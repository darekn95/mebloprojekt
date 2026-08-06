import pw from '/opt/node22/lib/node_modules/playwright/index.js';
const { chromium } = pw;
const URL = 'http://127.0.0.1:5205/mebloprojekt-app.html';
const S = './';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const page = await (await browser.newContext({ viewport: { width: 1500, height: 1100 } })).newPage();
const errors = [];
page.on('pageerror', (e) => errors.push('[pageerror] ' + e.message));
page.on('console', (m) => { if (m.type() === 'error' && !/favicon|404/.test(m.text())) errors.push('[console] ' + m.text()); });
await page.goto(URL, { waitUntil: 'networkidle' });
await page.evaluate(() => { try { localStorage.clear(); } catch (e) {} });
await page.reload({ waitUntil: 'networkidle' });
await page.waitForTimeout(1500);
const ok = (l, c, e = '') => console.log((c ? '  OK   ' : '  BLAD ') + l + (e ? ' — ' + e : ''));
const card = (re) => page.locator('section').filter({ has: page.locator('h2', { hasText: re }) }).first();
const rowsOf = async (re) => {
  const c = card(re);
  if (await c.count() === 0) return null;
  return c.evaluate((sec) => [...sec.querySelectorAll('tbody tr')].map(tr =>
    [...tr.querySelectorAll('td')].map(td => td.innerText.trim()).join(' | ')));
};

ok('przy jednej szafce brak karty zbiorczej', await card(/^Produkty całego projektu/).count() === 0);
const one = await rowsOf(/^Produkty do zamówienia$/);
console.log('  szafka 1 — produkty:'); (one || []).forEach(r => console.log('     ' + r));

await page.getByText('+ szafka', { exact: true }).click();
await page.waitForTimeout(900);
ok('przy 2 szafkach karta zbiorcza jest', await card(/^Produkty całego projektu/).count() === 1);
const two = await rowsOf(/^Produkty całego projektu/);
console.log('  projekt — produkty:'); (two || []).forEach(r => console.log('     ' + r));

// dwie identyczne szafki -> ilosci maja byc podwojone
const num = (rows, name) => {
  const r = (rows || []).find(x => x.startsWith(name));
  return r ? Number((r.split('|').pop() || '').trim().split(' ')[0]) : null;
};
['Uchwyt', 'Zawias'].forEach((n) => {
  const a = num(one, n), b = num(two, n);
  ok(`${n}: projekt = 2 × szafka`, a !== null && b === 2 * a, `${a} → ${b}`);
});

// trzecia szafka z szufladami — nowa pozycja ma dojsc, a nie zastapic
const struct = card(/^Struktura wnętrza$/);
await struct.getByText('Szuflady', { exact: true }).first().click();
await page.waitForTimeout(700);
await page.getByText('+ szuflada', { exact: true }).first().click();
await page.waitForTimeout(900);
const three = await rowsOf(/^Produkty całego projektu/);
console.log('  po zmianie szafki 2 na szuflady:'); (three || []).forEach(r => console.log('     ' + r));
ok('doszły prowadnice', (three || []).some(r => /Prowadnica/.test(r)));
ok('zawiasy zostały tylko z szafki 1', num(three, 'Zawias') === num(one, 'Zawias'), num(one, 'Zawias') + ' → ' + num(three, 'Zawias'));

// w zestawieniu PDF
await page.evaluate(() => {
  window.__snap = null;
  window.print = () => {
    const rep = document.querySelector('.print-only');
    if (rep) window.__snap = { txt: rep.innerText.replace(/\s+/g, ' ') };
  };
});
await page.getByRole('button', { name: 'Zestawienie PDF', exact: true }).click();
await page.waitForTimeout(1500);
const snap = await page.evaluate(() => window.__snap);
ok('zestawienie ma "Produkty całego projektu"', !!snap && /Produkty całego projektu/.test(snap.txt));

await card(/^Produkty całego projektu/).scrollIntoViewIfNeeded();
const bb = await card(/^Produkty całego projektu/).boundingBox();
await page.screenshot({ path: S + 'shot-projhw.png', clip: { x: bb.x, y: Math.max(0, bb.y), width: bb.width, height: Math.min(500, bb.height) } });
console.log('\nBLEDY:', errors.length ? errors.join('\n') : '(brak)');
await browser.close();
