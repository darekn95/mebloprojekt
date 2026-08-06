import pw from '/opt/node22/lib/node_modules/playwright/index.js';
const { chromium } = pw;
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const page = await (await browser.newContext({ viewport: { width: 1500, height: 1150 } })).newPage();
const errors = [];
page.on('pageerror', (e) => errors.push('[pageerror] ' + e.message));
page.on('console', (m) => { if (m.type() === 'error' && !/favicon|404/.test(m.text())) errors.push('[console] ' + m.text()); });
const ok = (l, c, e = '') => console.log((c ? '  OK   ' : '  BLAD ') + l + (e ? ' — ' + e : ''));
await page.goto('http://127.0.0.1:5205/mebloprojekt-app.html', { waitUntil: 'networkidle' });
await page.evaluate(() => { try { localStorage.clear(); } catch (e) {} });
await page.reload({ waitUntil: 'networkidle' });
await page.waitForTimeout(1500);
const card = (re) => page.locator('section').filter({ has: page.locator('h2', { hasText: re }) }).first();
const shelfCount = () => card(/^Formatki do zamówienia$/).evaluate((sec) => {
  const tr = [...sec.querySelectorAll('tbody tr')].find(t => /^Półka\b/.test(t.querySelector('td').innerText.trim()));
  return tr ? Number([...tr.querySelectorAll('td')][4].innerText.trim()) : 0;
});
ok('start: 1 półka', await shelfCount() === 1, String(await shelfCount()));
const korpus = card(/^Korpus$/);
const hIn = korpus.locator('input[type=number]').nth(1);
await hIn.fill('2000'); await hIn.blur();
await page.waitForTimeout(1200);
ok('po zmianie H półki zostają nietknięte', await shelfCount() === 1, String(await shelfCount()));
const btn = page.getByText('dopasuj do wysokości', { exact: true });
ok('przycisk dopasowania istnieje', await btn.count() >= 1, String(await btn.count()));
await btn.first().click();
await page.waitForTimeout(1200);
const n = await shelfCount();
console.log('  po dopasowaniu przy H=2000:', n, 'półek');
ok('doszło więcej półek', n === 6, String(n));
// swiatla bez okuc
await page.getByText('Otw.', { exact: true }).first().click();
await page.waitForTimeout(800);
const hide = page.getByText('Ukryj okucia', { exact: true });
if (await hide.count()) { await hide.first().click(); await page.waitForTimeout(700); }
const sw = await page.evaluate((k) => {
  const by = new Map();
  [...document.querySelector('svg').querySelectorAll('text')].forEach((t) => {
    const s = t.textContent.trim();
    if (!/^\d+$/.test(s)) return;
    const x = Math.round(+t.getAttribute('x'));
    by.set(x, [...(by.get(x) || []), Number(s)]);
  });
  for (const [x, vals] of by) if (vals.length === k + 1) return vals;
  return null;
}, n);
console.log('  światła:', (sw || []).join(', '));
ok('wszystkie światła ≥ 250', sw && sw.every(v => v >= 250), (sw || []).join(', '));
ok('kolejna półka zeszłaby poniżej 250',
  sw && (sw.reduce((a, b) => a + b, 0) - 18) / (sw.length + 1) < 250,
  sw ? String(Math.round((sw.reduce((a, b) => a + b, 0) - 18) / (sw.length + 1))) : '');
// niska szafka: dopasowanie usuwa polki
await page.getByText('Zamk.', { exact: true }).first().click();
await page.waitForTimeout(500);
await hIn.fill('400'); await hIn.blur();
await page.waitForTimeout(1200);
await page.getByText('dopasuj do wysokości', { exact: true }).first().click();
await page.waitForTimeout(1200);
const n2 = await shelfCount();
console.log('  po dopasowaniu przy H=400:', n2, 'półek');
ok('niska szafka zostaje bez półek', n2 === 0, String(n2));
console.log('\nBLEDY:', errors.length ? errors.join('\n') : '(brak)');
await browser.close();
