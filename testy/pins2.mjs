import pw from '/opt/node22/lib/node_modules/playwright/index.js';
const { chromium } = pw;
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const page = await (await browser.newContext({ viewport: { width: 1500, height: 1100 } })).newPage();
const errors = [];
page.on('pageerror', (e) => errors.push('[pageerror] ' + e.message));
const ok = (l, c, e = '') => console.log((c ? '  OK   ' : '  BLAD ') + l + (e ? ' — ' + e : ''));
await page.goto('http://127.0.0.1:5205/mebloprojekt-app.html', { waitUntil: 'networkidle' });
await page.evaluate(() => { try { localStorage.clear(); } catch (e) {} });
await page.reload({ waitUntil: 'networkidle' });
await page.waitForTimeout(1500);
const card = (re) => page.locator('section').filter({ has: page.locator('h2', { hasText: re }) }).first();
// szerszy korpus + druga kolumna
const korpus = card(/^Korpus$/);
await korpus.locator('input[type=number]').first().fill('1200');
await korpus.locator('input[type=number]').first().blur();
await page.waitForTimeout(700);
await card(/^Struktura wnętrza$/).getByText('+ przegroda i kolumna', { exact: true }).first().click();
await page.waitForTimeout(1200);
// druga kolumna startuje bez polek — dodaj dwie
const addShelf = page.getByText('+ półka', { exact: true });
console.log('  przycisków "+ półka":', await addShelf.count());
await addShelf.last().click(); await page.waitForTimeout(500);
await addShelf.last().click(); await page.waitForTimeout(900);
await page.getByText('Otw.', { exact: true }).first().click();
await page.waitForTimeout(900);
const info = await page.evaluate(() => {
  const svg = document.querySelector('svg');
  const cs = [...svg.querySelectorAll('circle')].filter(c => Math.round(+c.getAttribute('r')) === 5)
    .map(c => ({ x: Math.round(+c.getAttribute('cx')), y: Math.round(+c.getAttribute('cy')) }));
  const labels = [...svg.querySelectorAll('text')].map(t => ({ x: Math.round(+t.getAttribute('x')), y: Math.round(+t.getAttribute('y')), s: t.textContent.trim() }));
  return { cs, xs: [...new Set(cs.map(c => c.x))].sort((a,b)=>a-b), labels };
});
console.log('  kółka X:', info.xs.join(', '));
ok('kołki w dwóch kolumnach (4 pionowe rzędy)', info.xs.length === 4, info.xs.join(', '));
console.log('  kółek razem:', info.cs.length);
// etykieta wysokosci: jedna na polke na kolumne
const ys = [...new Set(info.cs.map(c => c.y))];
const near = info.labels.filter(l => ys.some(y => Math.abs(y + 7 - y) < 1e9 && Math.abs(l.y - (y - 7)) < 2) && /^\d+$/.test(l.s));
console.log('  etykiety przy kołkach:', near.map(l => l.s + '@' + l.x).join(', '));
ok('etykiety w obu kolumnach', new Set(near.map(l => l.x)).size === 2, [...new Set(near.map(l=>l.x))].join(', '));
ok('etykiety liczą od dołu przegrody/boku', near.every(l => Number(l.s) > 0 && Number(l.s) < 720), near.map(l=>l.s).join(','));
await page.locator('svg').first().screenshot({ path: './shot-pins.png' });
console.log('\nBLEDY:', errors.length ? errors.join('\n') : '(brak)');
await browser.close();
