import pw from '/opt/node22/lib/node_modules/playwright/index.js';
const { chromium } = pw;
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const page = await (await browser.newContext({ viewport: { width: 1500, height: 1150 } })).newPage();
const errors = [];
page.on('pageerror', (e) => errors.push('[pageerror] ' + e.message));
page.on('console', (m) => { if (m.type() === 'error' && !/favicon|404/.test(m.text())) errors.push('[console] ' + m.text()); });
const ok = (l, c, e = '') => console.log((c ? '  OK   ' : '  BLAD ') + l + (e ? ' — ' + e : ''));
await page.goto('http://127.0.0.1:5205/mebloprojekt-app.html', { waitUntil: 'networkidle' });
// dwie kolumny (drzwi + szuflady) i wysoka szafka
await page.evaluate(() => {
  localStorage.clear();
  const col = (kind) => ({ w: null, kind, doors: kind === 'doors' ? 1 : 0, shelfTargets: [null],
    nl: null, drawers: kind === 'drawers' ? [{ h: 'auto', front: null, handle: true }] : [],
    doorWidths: [], mirrors: [], handles: [], hinges: [], rails: [],
    backMode: 'inherit', fix: { side: 'none', w: 60, mode: 'overlay', support: false, supportDepth: 100 },
    blendaMode: 'overlay', drawerMode: 'inherit', hinge: 'auto' });
  const cab = { name: 'T', W: 1200, H: 2000, D: 500, levels: [{ h: null, cols: [col('doors'), col('drawers')] }] };
  localStorage.setItem('szafki:projekt', JSON.stringify({ name: 'T', active: 0, prices: {}, items: [{ cab }] }));
});
await page.reload({ waitUntil: 'networkidle' });
await page.waitForTimeout(2500);
const card = (re) => page.locator('section').filter({ has: page.locator('h2', { hasText: re }) }).first();
const shelves = () => card(/^Formatki do zamówienia$/).evaluate((s) => {
  const tr = [...s.querySelectorAll('tbody tr')].filter(t => /^Półka\b/.test(t.querySelector('td').innerText.trim()));
  return tr.reduce((a, t) => a + Number([...t.querySelectorAll('td')][4].innerText.trim()), 0);
});
const drawersQty = () => card(/^Produkty do zamówienia$/).evaluate((s) => {
  const tr = [...s.querySelectorAll('tbody tr')].find(t => /Prowadnica/.test(t.innerText));
  return tr ? tr.innerText.trim() : null;
});
console.log('  półek na starcie:', await shelves(), '| prowadnice:', await drawersQty());
const btn = card(/^Struktura wnętrza$/).getByText('dopasuj półki', { exact: true });
ok('przycisk w nagłówku karty', await btn.count() === 1, String(await btn.count()));
const before = await drawersQty();
await btn.click();
await page.waitForTimeout(1500);
const n = await shelves();
console.log('  półek po dopasowaniu:', n, '| prowadnice:', await drawersQty());
ok('kolumna z drzwiami dostała 6 półek', n === 6, String(n));
ok('kolumna z szufladami nietknięta', await drawersQty() === before, `${before} → ${await drawersQty()}`);
// swiatla
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
  for (const [, vals] of by) if (vals.length === k + 1) return vals;
  return null;
}, n);
console.log('  światła:', (sw || []).join(', '));
ok('wszystkie światła ≥ 250', sw && sw.every(v => v >= 250), (sw || []).join(', '));
console.log('\nBLEDY:', errors.length ? errors.join('\n') : '(brak)');
await browser.close();
