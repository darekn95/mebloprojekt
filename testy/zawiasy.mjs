/* Zmiana strony zawiasow (prosba uzytkownika 2026-09-28):
   - przy kolizji otwierania przycisk „Przełóż zawiasy na …” tylko wtedy, gdy
     przelozenie zmniejsza kolizje, z informacja, ile jej zostanie,
   - przelacznik „zawias” przy kolumnie z jednymi drzwiami w Strukturze wnetrza.
   Uklad jak u uzytkownika: sciana 1 konczy sie szafka z jednymi drzwiami przy
   rogu, w rog wjezdza sciana 2 ze slepa szafka 1000 (fix 618, uchwyt przy
   fixie) i wstawka plaska. */
import pw from './pw.mjs';
const URL = process.env.STD ? 'http://127.0.0.1:5199/standalone-local.html'
  : 'http://127.0.0.1:5205/mebloprojekt-app.html';
const ok = (l, c, e = '') => console.log((c ? '  OK   ' : '  BLAD ') + l + (e ? ' — ' + e : ''));
const b = await pw.chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const page = await (await b.newContext({ viewport: { width: 1500, height: 1300 } })).newPage();
const errors = []; page.on('pageerror', (e) => errors.push(e.message));
await page.goto(URL, { waitUntil: 'networkidle' });

const PL = { on: true, height: 100, mode: 'under', setback: 0 };
const CAB = (name, W, runId, col) => ({ cab: { name, W, H: 720, D: 570, plinth: PL, legs: { on: true, height: 100 },
  levels: [{ h: null, cols: [{ kind: 'doors', doors: 2, w: null, ...col }] }] }, runId, offset: 0 });
const RUN = (id, name, o = {}) => ({ id, name, wallW: null, gap: 0, mountY: 0, H: 720, D: 570, plinth: PL, worktop: true, corner: null, ...o });
const seed = async (hingeA3) => {
  await page.evaluate((p) => { localStorage.clear(); localStorage.setItem('szafki:projekt', JSON.stringify(p)); }, {
    name: 'Z', active: 2, prices: {},
    runs: [RUN('c1', 'Ściana 1'), RUN('c2', 'Ściana 2', { corner: { of: 'c1', at: 'end', owner: 'self', clear: 0, wstawka: { typ: 'plaska', w: 60 } } })],
    items: [CAB('A1', 600, 'c1'), CAB('A2', 600, 'c1'), CAB('A3', 600, 'c1', { doors: 1, hinge: hingeA3 }),
      CAB('R', 1000, 'c2', { doors: 1, fix: { side: 'left', w: 618, mode: 'overlay', support: false }, hinge: 'right' })] });
  await page.reload({ waitUntil: 'networkidle' }); await page.waitForTimeout(800);
};
const card = (re) => page.locator('section').filter({ has: page.locator('h2', { hasText: re }) }).first();
const kolizje = async () => (await card(/^Uwagi/).count() ? await card(/^Uwagi/).innerText() : '')
  .split('\n').filter((l) => /nie ma się jak otworzyć/.test(l));
const zapis = () => page.evaluate(() => JSON.parse(localStorage.getItem('szafki:projekt')));

console.log('== zawias z lewej (dalej od rogu): mała kolizja, przełożenie byłoby gorsze ==');
await seed('left');
let k = await kolizje();
console.log('     ' + k.join('\n     '));
ok('kolizja A3 z uchwytem szafki w rogu', k.some((l) => /„A3"/.test(l) && /uchwyt/.test(l)));
ok('bez przycisku przełożenia (gorzej po drugiej stronie)',
  await card(/^Uwagi/).getByRole('button', { name: /Przełóż zawiasy na prawą/ }).count() === 0);

console.log('\n== zawias z prawej (w róg): duża kolizja, przycisk na lewą ==');
await seed('right');
k = await kolizje();
console.log('     ' + k.join('\n     '));
const przycisk = card(/^Uwagi/).getByRole('button', { name: /Przełóż zawiasy na lewą — zostaje \d+ mm/ });
ok('przycisk „Przełóż zawiasy na lewą — zostaje N mm”', await przycisk.count() === 1);
await przycisk.first().click(); await page.waitForTimeout(1500);
let p = await zapis();
ok('po kliknięciu zawias A3 z lewej', p.items[2].cab.levels[0].cols[0].hinge === 'left', p.items[2].cab.levels[0].cols[0].hinge);

console.log('\n== przełącznik przy kolumnie ==');
await seed('auto');
const pole = page.locator('[data-el="zawias-kolumny"]');
ok('przy jednych drzwiach jest przełącznik „zawias”', await pole.count() === 1);
ok('„auto” pokazuje, gdzie zawias wypada (L)', /auto \(L\)/.test(await pole.innerText()), await pole.innerText());
await pole.getByText('z prawej', { exact: true }).click(); await page.waitForTimeout(1500);
p = await zapis();
ok('„z prawej” zapisuje zawias kolumny', p.items[2].cab.levels[0].cols[0].hinge === 'right');
await page.evaluate(() => { const q = JSON.parse(localStorage.getItem('szafki:projekt')); q.active = 0; localStorage.setItem('szafki:projekt', JSON.stringify(q)); });
await page.reload({ waitUntil: 'networkidle' }); await page.waitForTimeout(800);
ok('przy dwojgu drzwiach przełącznika nie ma', await page.locator('[data-el="zawias-kolumny"]').count() === 0);

console.log('\nBLEDY:', errors.length ? errors.join('; ') : '(brak)');
await b.close();
