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
const korpus = card(/^Korpus$/);
const cutRows = () => card(/^Formatki do zamówienia$/).evaluate((sec) =>
  [...sec.querySelectorAll('tbody tr')].map(tr => [...tr.querySelectorAll('td')].map(td => td.innerText.trim().split('\n')[0]).join(' | ')));
const clickView = async (v) => { await page.getByText(v, { exact: true }).first().click(); await page.waitForTimeout(700); };

// --- domyslnie wieniec ---
ok('przełącznik Wieniec/Blat', await korpus.getByText('Blat', { exact: true }).count() === 1);
const before = await cutRows();
ok('domyślnie wieniec, nie blat', before.some(r => /Dno \/ wieniec|Wieniec/.test(r)) && !before.some(r => /^Blat/.test(r)),
  (before.find(r => /wieniec/i.test(r)) || '').slice(0, 60));

// --- wlacz blat z wysunieciami: biurko 1100 korpus, blat 1200x600 ---
await korpus.getByText('Blat', { exact: true }).click();
await page.waitForTimeout(800);
// pola wysunięć to 4 kolejne liczby po W/H/D w karcie Korpus
const nums = korpus.locator('input[type=number]');
console.log('  pól liczbowych w Korpusie:', await nums.count(), '(3 gabaryty + 4 wysunięcia)');
for (const [i, v] of [[3, 50], [4, 50], [5, 30], [6, 20]]) {
  await nums.nth(i).fill(String(v)); await nums.nth(i).blur(); await page.waitForTimeout(400);
}
await page.waitForTimeout(600);
console.log('  wysunięcia po wpisaniu:', await nums.evaluateAll(els => els.map(e => e.value).join(', ')));

const rows = await cutRows();
const blatRow = rows.find(r => /^Blat/.test(r)) || '';
console.log('  formatka blatu:', blatRow);
ok('blat jest osobną formatką', !!blatRow);
ok('szerokość blatu = 600 + 50 + 50', /\| 700 \|/.test(blatRow), blatRow.split('|')[2]?.trim());
ok('głębokość blatu = 500 + 30 + 20', /\| 550 \|/.test(blatRow), blatRow.split('|')[3]?.trim());
ok('wieniec zniknął z listy', !rows.some(r => /Dno \/ wieniec|^Wieniec/.test(r)));
ok('dno zostało osobno', rows.some(r => /^Dno/.test(r)), (rows.find(r => /^Dno/.test(r)) || '').slice(0, 50));

// --- fronty konczą sie pod blatem ---
const doorRow = rows.find(r => /Drzwi/.test(r)) || '';
console.log('  drzwi:', doorRow);
// luz góra/dół to teraz 3 mm: 720 − 18 blatu − 3 − 3 = 696
ok('drzwi kończą się pod blatem (696)', /\| 696 \|/.test(doorRow), doorRow.split('|')[2]?.trim());

// --- widoki bez bledow, blat widoczny poza obrysem ---
for (const v of ['Zamk.', 'Otw.', 'Z boku', 'Z góry', 'Z tyłu', '3D']) {
  const n = errors.length;
  await clickView(v);
  ok('widok ' + v, errors.length === n);
}

await clickView('Zamk.');
const fr = await page.evaluate(() => {
  const svg = document.querySelector('svg');
  const vb = svg.getAttribute('viewBox').split(/\s+/).map(Number);
  const rs = [...svg.querySelectorAll('rect')];
  const wide = rs.find(r => Math.round(+r.getAttribute('width')) === 700 && Math.round(+r.getAttribute('height')) === 18);
  return { vb, blat: wide ? { x: Math.round(+wide.getAttribute('x')), y: Math.round(+wide.getAttribute('y')) } : null };
});
ok('blat narysowany od -50 do 650', !!fr.blat && fr.blat.x === -50, fr.blat ? 'x=' + fr.blat.x : 'nie znaleziono');
ok('kadr obejmuje wysunięcie', fr.vb[0] <= -50, 'viewBox x=' + fr.vb[0]);
await page.locator('svg').first().screenshot({ path: S + 'shot-blat-front.png' });

await clickView('Z boku');
await page.locator('svg').first().screenshot({ path: S + 'shot-blat-side.png' });
await clickView('Z góry');
await page.locator('svg').first().screenshot({ path: S + 'shot-blat-top.png' });

console.log('\nBLEDY:', errors.length ? errors.join('\n') : '(brak)');
await browser.close();
