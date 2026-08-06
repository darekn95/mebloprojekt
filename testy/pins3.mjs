import pw from '/opt/node22/lib/node_modules/playwright/index.js';
const { chromium } = pw;
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const page = await (await browser.newContext({ viewport: { width: 1500, height: 1100 } })).newPage();
const errors = [];
page.on('pageerror', (e) => errors.push('[pageerror] ' + e.message));
const ok = (l, c, e = '') => console.log((c ? '  OK   ' : '  BLAD ') + l + (e ? ' — ' + e : ''));
await page.goto('http://127.0.0.1:5205/mebloprojekt-app.html', { waitUntil: 'networkidle' });
// dwie kolumny po 2 polki, przegroda w srodku — sianie wprost do zapisu
await page.evaluate(() => {
  localStorage.clear();
  const col = (shelves) => ({
    w: null, kind: 'doors', doors: 1, shelfTargets: Array(shelves + 1).fill(null),
    nl: null, drawers: [], doorWidths: [], mirrors: [], handles: [], hinges: [], rails: [],
    backMode: 'inherit', fix: { side: 'none', w: 60, mode: 'overlay', support: false, supportDepth: 100 },
    blendaMode: 'overlay', drawerMode: 'inherit', hinge: 'auto',
  });
  const cab = { name: 'Dwie kolumny', W: 1200, H: 720, D: 500,
    levels: [{ h: null, cols: [col(2), col(3)] }] };
  localStorage.setItem('szafki:projekt', JSON.stringify({ name: 'Test', active: 0, prices: {}, items: [{ cab }] }));
});
await page.reload({ waitUntil: 'networkidle' });
await page.waitForTimeout(2500);
await page.getByText('Otw.', { exact: true }).first().click();
await page.waitForTimeout(1000);
const info = await page.evaluate(() => {
  const svg = document.querySelector('svg');
  const cs = [...svg.querySelectorAll('circle')].filter(c => Math.round(+c.getAttribute('r')) === 5)
    .map(c => ({ x: Math.round(+c.getAttribute('cx')), y: Math.round(+c.getAttribute('cy')) }));
  const ys = [...new Set(cs.map(c => c.y))];
  const labels = [...svg.querySelectorAll('text')]
    .filter(t => /^otw\. \d+$/.test(t.textContent.trim()) && ys.some(y => Math.abs(+t.getAttribute('y') - (y + 24)) < 3))
    .map(t => ({ x: Math.round(+t.getAttribute('x')), s: t.textContent.trim().replace('otw. ', '') }));
  return { cs, xs: [...new Set(cs.map(c => c.x))].sort((a, b) => a - b), labels };
});
console.log('  kółka X:', info.xs.join(', '), '| razem', info.cs.length);
ok('4 pionowe rzędy kołków (2 kolumny × 2 boki)', info.xs.length === 4, info.xs.join(', '));
ok('kółek = (2+3 półki) × 2', info.cs.length === 10, String(info.cs.length));
const byX = {};
info.labels.forEach(l => { (byX[l.x] = byX[l.x] || []).push(l.s); });
console.log('  etykiety:', JSON.stringify(byX));
ok('etykiety w obu kolumnach', Object.keys(byX).length === 2, Object.keys(byX).join(', '));
const vals = Object.values(byX);
ok('lewa kolumna: 2 wysokości', vals.some(v => v.length === 2), JSON.stringify(vals));
ok('prawa kolumna: 3 wysokości', vals.some(v => v.length === 3), JSON.stringify(vals));
ok('wszystkie wysokości w zakresie korpusu', info.labels.every(l => +l.s > 0 && +l.s < 720), JSON.stringify(byX));
await page.locator('svg').first().screenshot({ path: './shot-pins.png' });
console.log('\nBLEDY:', errors.length ? errors.join('\n') : '(brak)');
await browser.close();
