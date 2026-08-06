import pw from '/opt/node22/lib/node_modules/playwright/index.js';
const { chromium } = pw;
const S = './';
const URL = process.env.STD ? 'http://127.0.0.1:5199/standalone-local.html'
  : 'http://127.0.0.1:5205/mebloprojekt-app.html';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const page = await (await browser.newContext({ viewport: { width: 1500, height: 1200 } })).newPage();
const errors = [];
page.on('pageerror', (e) => errors.push('[pageerror] ' + e.message));
page.on('console', (m) => { if (m.type() === 'error' && !/favicon|404/.test(m.text())) errors.push('[console] ' + m.text()); });
const ok = (l, c, e = '') => console.log((c ? '  OK   ' : '  BLAD ') + l + (e ? ' — ' + e : ''));
const card = (re) => page.locator('section').filter({ has: page.locator('h2', { hasText: re }) }).first();
const view = async (v) => { await page.getByText(v, { exact: true }).first().click(); await page.waitForTimeout(800); };
await page.goto(URL, { waitUntil: 'networkidle' });

// jeden poziom: kolumna z 2 polkami + kolumna z 2 szufladami
const seed = async (shelfSame, shelfTh) => {
  await page.evaluate(({ same, th }) => {
    localStorage.clear();
    const cab = {
      name: 'T', W: 900, H: 720, D: 500,
      shelfSameAsBoard: same,
      plinth: { on: true, height: 100, mode: 'inbody', setback: 0 },
      levels: [{ h: null, cols: [
        { kind: 'doors', doors: 1, w: null, shelfTargets: [null, null, null] },
        { kind: 'drawers', w: 270, drawers: [{}, {}] },
      ] }],
    };
    const mat = {
      board: { name: 'Płyta', thickness: 18, color: '#d8c3a0' },
      front: { name: 'Płyta', thickness: 18, color: '#c2a880' },
      shelf: { name: 'Płyta cienka', thickness: th, color: '#9c9b97' },
      back: { name: 'HDF', thickness: 3, color: '#9c7b56' },
      mirror: { name: 'Lustro', thickness: 4, color: '#c3d0d6' },
    };
    localStorage.setItem('szafki:projekt', JSON.stringify({ name: 'T', active: 0, prices: {}, items: [{ cab, mat }] }));
  }, { same: shelfSame, th: shelfTh });
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(2200);
};

const dims = () => page.evaluate(() => [...document.querySelectorAll('svg text')].map((t) => t.textContent.trim()));
// polki w kolumnie: prostokaty szerokosci kolumny, niskie
const shelfRects = () => page.evaluate(() => [...document.querySelectorAll('svg rect')]
  .map((r) => ({ w: Math.round(+r.getAttribute('width')), h: Math.round(+r.getAttribute('height')) }))
  .filter((r) => r.w > 400 && r.w < 700 && r.h > 0 && r.h < 40).map((r) => r.h));
const cutRows = () => card(/^Formatki do zamówienia$/).evaluate((sec) =>
  [...sec.querySelectorAll('tbody tr')].map((tr) => [...tr.querySelectorAll('td')].map((td) => td.textContent.trim()).join(' | ')));

console.log('== półki z płyty korpusu (18 mm) ==');
await seed(true, 12); // grubosc polki ignorowana, bo polki ida z korpusu
await view('Otw.');
let d = await dims();
// swiatlo poziomu 584, 2 polki po 18 -> 183 + 183 + 182
ok('światła dzielone grubością korpusu', d.includes('183') && d.includes('182'),
  d.filter((x) => /^1[78][0-9]$/.test(x)).join(', '));
ok('półki rysowane grubością 18', (await shelfRects()).every((h) => h === 18), (await shelfRects()).join(', '));
// szyna dolna 0: 118 + 26 + 18 = 162, sufit 412 -> 250
// gorna szyna to front + 5 (nie 15), czyli 417 + 44 = 461, sufit 702 -> 241
ok('światło szuflad 250 / 241', d.includes('250 od dna') && d.includes('241 od dna'),
  d.filter((x) => /od dna/.test(x)).join(', '));
let rows = await cutRows();
ok('dno szuflady z płyty korpusu, gdy półki są z korpusu',
  /Płyta Dąb sonoma/.test(rows.find((r) => /^Dno szuflady/.test(r)) || ''),
  rows.find((r) => /^Dno szuflady/.test(r)));

console.log('\n== półki na osobną płytę 12 mm ==');
await seed(false, 12);
await view('Otw.');
d = await dims();
// (584 - 2*12)/3 = 186,67 -> 187 + 187 + 186
ok('światła przeliczone na półki 12 mm', d.includes('187') && d.includes('186'),
  d.filter((x) => /^1[78][0-9]$/.test(x)).join(', '));
ok('nie zostało światło liczone dla 18 mm', !d.includes('183'), d.filter((x) => /^1[78][0-9]$/.test(x)).join(', '));
const rects = await shelfRects();
ok('półki rysowane grubością 12', rects.length > 0 && rects.every((h) => h === 12), rects.join(', '));
// dno 12 zamiast 18 -> swiatlo wieksze o 6
ok('światło szuflad reaguje na grubość dna (256 / 247)',
  d.includes('256 od dna') && d.includes('247 od dna'),
  d.filter((x) => /od dna/.test(x)).join(', '));

// sama liczba nie mowi, od czego jest mierzona — legenda musi to dopowiedziec
const legenda = (await dims()).find((x) => /^od dna —/.test(x)) || '';
console.log('     legenda:', legenda);
ok('legenda tłumaczy bazę światła', /górne lico dna szuflady/.test(legenda) && /nad prowadnicą/.test(legenda), legenda);
ok('legenda podaje aktualną grubość dna', /26 \+ 12 mm/.test(legenda), legenda);

console.log('\n== formatki dna i tyłu szuflady z płyty półek ==');
rows = await cutRows();
const dnoRow = rows.find((r) => /^Dno szuflady/.test(r)) || '';
const tylRow = rows.find((r) => /^Tył szuflady/.test(r)) || '';
const polkaRow = rows.find((r) => /^Półka \|/.test(r)) || '';
console.log('     ' + dnoRow);
console.log('     ' + tylRow);
console.log('     ' + polkaRow);
ok('dno szuflady z płyty półek', /Płyta cienka/.test(dnoRow), dnoRow);
ok('tył szuflady z płyty półek', /Płyta cienka/.test(tylRow), tylRow);
ok('półka też z płyty półek', /Płyta cienka/.test(polkaRow), polkaRow);
// przegrody i polki przelotowe zostaja konstrukcyjne
const przel = rows.find((r) => /^Półka przelotowa/.test(r));
ok('półka przelotowa (gdy jest) zostaje z korpusu', !przel || /Płyta Dąb sonoma/.test(przel), przel || '(brak w tej szafce)');

console.log('\n== widoki bez błędów ==');
for (const v of ['Zamk.', 'Otw.', 'Z boku', 'Z góry', 'Z tyłu', '3D']) {
  const n = errors.length;
  await view(v);
  ok(`widok ${v}`, errors.length === n, errors.slice(n).join('; '));
}
await view('Otw.');
await page.locator('svg').first().screenshot({ path: S + 'shot-polkigr.png' });

console.log('\nBLEDY:', errors.length ? errors.join('\n') : '(brak)');
await browser.close();
