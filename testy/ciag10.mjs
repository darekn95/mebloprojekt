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
const pick = async (label) => { await page.getByText(label, { exact: true }).first().click(); await page.waitForTimeout(800); };
const chip = (name) => page.locator('header div.rounded-full').filter({ hasText: name }).first();
/* Swiatla rysuje ten sam kod co w widoku pojedynczej szafki, kolorem DIMC.
   Bierzemy je razem z pozycja na ekranie, zeby sprawdzic, przy ktorej szafce
   wypadaja. */
const dimy = (tylkoSzafki) => page.evaluate((wSzafce) => [...document.querySelectorAll('svg text')]
  .filter((t) => t.getAttribute('fill') === '#0369a1' && /^\d+$/.test(t.textContent.trim()))
  /* Wymiary szafki siedza w jej <g transform>, wymiary calego ciagu leza wprost
     w <svg> — po tym je rozrozniamy. */
  .filter((t) => (wSzafce ? !!t.closest('g[transform]') : true))
  .map((t) => ({ v: t.textContent.trim(), x: Math.round(t.getBoundingClientRect().x) })), tylkoSzafki);
const swiatla = () => dimy(true);
const wartosci = async () => (await swiatla()).map((q) => q.v).sort().join(',');
const shapes = (sel) => page.evaluate((q) => [...document.querySelectorAll('svg ' + q)].map((r) => ({
  w: Math.round(+r.getAttribute('width')), h: Math.round(+r.getAttribute('height')),
  f: r.getAttribute('fill'), dash: r.getAttribute('stroke-dasharray') || '',
})), sel);

const PL = { on: true, height: 100, mode: 'under', setback: 0 };
// szafka z otworem na zabudowe: rura w rogu, zabudowana
const OB = (name, W) => ({
  cab: { name, W, H: 720, D: 600, plinth: PL,
    obstacle: { on: true, name: 'rura', x: 40, w: 140, d: 160, y: 0, h: 720, mask: true },
    levels: [{ h: null, cols: [{ kind: 'doors', doors: 1, w: null, shelfTargets: [null, null] }] }] },
  runId: 'c1', offset: 0 });
const ZWY = (name, W) => ({
  cab: { name, W, H: 720, D: 600, plinth: PL,
    levels: [{ h: null, cols: [{ kind: 'doors', doors: 1, w: null, shelfTargets: [null, null] }] }] },
  runId: 'c1', offset: 0 });
const seed = async (items) => {
  await page.evaluate((its) => {
    localStorage.clear();
    localStorage.setItem('szafki:projekt', JSON.stringify({
      name: 'T', active: 0, prices: {},
      runs: [{ id: 'c1', name: 'Ściana 1', wallW: null, gap: 0, mountY: 0, H: 720, D: 600,
        plinth: { on: true, height: 100, mode: 'under', setback: 0 } }],
      items: its,
    }));
  }, items);
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(2400);
};
await page.goto(URL, { waitUntil: 'networkidle' });

console.log('== światła tylko dla szafki wybranej na pasku ==');
await seed([ZWY('A', 800), ZWY('B', 600)]);
await pick('Ciąg');
await pick('Otw.');
let sw = await swiatla();
console.log('     przy A: ' + JSON.stringify(sw));
ok('światła są', sw.length > 0, String(sw.length));
const xA = sw.map((q) => q.x);
// szafka A stoi z lewej — wszystkie lancuchy musza byc w jej obrysie
const przedB = Math.min(...xA);
ok('wszystkie światła w jednej szafce', Math.max(...xA) - przedB < 300,
  JSON.stringify(xA));
const ileA = sw.length;
const wartA = await wartosci();

console.log('\n== przełączenie na drugą szafkę przenosi światła ==');
await chip('B').getByRole('button', { name: 'B', exact: true }).click();
await page.waitForTimeout(1200);
sw = await swiatla();
console.log('     przy B: ' + JSON.stringify(sw));
ok('światła dalej są', sw.length > 0, String(sw.length));
ok('tyle samo łańcuchów co przy A', sw.length === ileA, `${ileA} vs ${sw.length}`);
ok('przeniosły się w prawo, do szafki B', Math.min(...sw.map((q) => q.x)) > przedB + 100,
  `${przedB} → ${Math.min(...sw.map((q) => q.x))}`);

console.log('\n== w widoku zamkniętym świateł nie ma ==');
await pick('Zamk.');
sw = await swiatla();
ok('zamknięty bez łańcuchów świateł', sw.length === 0, JSON.stringify(sw));

console.log('\n== pojedyncza szafka ma światła bez wybierania ==');
await page.evaluate(() => {
  const d = JSON.parse(localStorage.getItem('szafki:projekt'));
  d.runs = []; d.items.forEach((it) => { it.runId = null; });
  localStorage.setItem('szafki:projekt', JSON.stringify(d));
});
await page.reload({ waitUntil: 'networkidle' });
await page.waitForTimeout(2300);
await pick('Otw.');
// widok pojedynczej szafki nie uzywa transform, wiec bierzemy wszystkie wymiary
sw = await dimy(false);
console.log('     ' + JSON.stringify(sw.map((q) => q.v)));
ok('widok pojedynczej szafki ma światła jak dotąd', sw.length > 0, String(sw.length));
// istota opcji 1: wybrana szafka w ciagu pokazuje te same swiatla, co sama
const zbiorSam = sw.map((q) => q.v);
const brakuje = wartA.split(',').filter((v) => !zbiorSam.includes(v));
console.log('     sama: ' + zbiorSam.join(',') + '   w ciągu: ' + wartA);
ok('każde światło z ciągu jest też u szafki samodzielnej', brakuje.length === 0,
  'brakuje: ' + brakuje.join(','));

console.log('\n== zabudowa otworu widoczna w ciągu ==');
await seed([OB('z rurą', 800), ZWY('B', 600)]);
await pick('Ciąg');
await pick('Z góry');
let r = await shapes('rect');
const bryla = r.filter((q) => q.f === '#7c3aed');
console.log('     bryła otworu: ' + JSON.stringify(bryla));
ok('otwór zaznaczony', bryla.length === 1, String(bryla.length));
// scianki zabudowy ida z materialu polek — grubosc 18, przylegaja do bryly
const scianki = r.filter((q) => (q.w === 18 && q.h > 100 && q.h < 300) || (q.h === 18 && q.w > 100 && q.w < 300));
console.log('     ścianki zabudowy: ' + JSON.stringify(scianki));
ok('ścianki zabudowy narysowane', scianki.length >= 2, String(scianki.length));

console.log('\n== zabudowa w 3D ==');
await pick('3D');
const poly = await page.evaluate(() => document.querySelectorAll('svg polygon').length);
console.log('     wielokątów z zabudową: ' + poly);
await seed([ZWY('A', 800), ZWY('B', 600)]);
await pick('Ciąg');
await pick('3D');
const polyBez = await page.evaluate(() => document.querySelectorAll('svg polygon').length);
console.log('     wielokątów bez zabudowy: ' + polyBez);
ok('zabudowa dokłada bryły w 3D', poly > polyBez, `${polyBez} → ${poly}`);

console.log('\n== ten sam otwór w widoku pojedynczej szafki i w ciągu ==');
await seed([OB('z rurą', 800)]);
await pick('Z góry');
const samSc = (await shapes('rect')).filter((q) => q.f === '#7c3aed').length;
await pick('Ciąg');
await pick('Z góry');
const ciagSc = (await shapes('rect')).filter((q) => q.f === '#7c3aed').length;
ok('otwór widać tak samo w obu zakresach', samSc === ciagSc, `${samSc} vs ${ciagSc}`);

console.log('\n== wszystkie warianty bez błędów ==');
await seed([OB('z rurą', 800), ZWY('B', 600)]);
await pick('Ciąg');
for (const v of ['Zamk.', 'Otw.', 'Z góry', 'Z tyłu', '3D']) {
  const before = errors.length;
  await pick(v);
  ok(`wariant ${v}`, errors.length === before, errors.slice(before).join('; '));
}
await pick('Otw.');
await page.locator('svg').first().screenshot({ path: S + 'shot-swiatla.png' });
await pick('Z góry');
await page.locator('svg').first().screenshot({ path: S + 'shot-zabudowa.png' });

console.log('\nBLEDY:', errors.length ? errors.join('\n') : '(brak)');
await browser.close();
