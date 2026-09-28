/* Kontrola otwierania szuflad i klap (uzytkownik 2026-09-28: „kontrola kolizji
   dotyczy otwierania wszystkich drzwi, klap i szuflad”). Skrzydla sprawdza
   `otwier`; tu:
   - szuflada wysuwa sie prosto na dlugosc prowadnicy z uchwytem — w slepym
     rogu, w zaslonietej czesci, trafia w korpus sasiedniego ciagu,
   - klapa do gory w szafce pod blatem uderza w blat, bez blatu jest wolna,
   - klapa w dol w szafce gornej nad pusta sciana jest wolna,
   - prosty ciag z szufladami i klapami nie ma zadnej kolizji. */
import pw from './pw.mjs';
const URL = process.env.STD ? 'http://127.0.0.1:5199/standalone-local.html'
  : 'http://127.0.0.1:5205/mebloprojekt-app.html';
const ok = (l, c, e = '') => console.log((c ? '  OK   ' : '  BLAD ') + l + (e ? ' — ' + e : ''));
const b = await pw.chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const page = await (await b.newContext({ viewport: { width: 1500, height: 1300 } })).newPage();
const errors = []; page.on('pageerror', (e) => errors.push(e.message));
await page.goto(URL, { waitUntil: 'networkidle' });

const PL = { on: true, height: 100, mode: 'under', setback: 0 };
const RUN = (id, name, o = {}) => ({ id, name, wallW: null, gap: 0, mountY: 0, H: 720, D: 560, plinth: PL,
  worktop: true, corner: null, ...o });
const CAB = (name, W, runId, col, o = {}) => ({ cab: { name, W, H: 720, D: 560, plinth: PL,
  levels: [{ h: null, cols: [{ w: null, ...col }] }], ...o }, runId, offset: 0 });
const SZUF = { kind: 'drawers', drawers: [{ h: 'auto' }, { h: 'auto' }, { h: 'auto' }] };
const DRZWI = { kind: 'doors', doors: 2 };
const seed = async (runs, items) => {
  await page.evaluate((q) => { localStorage.clear(); localStorage.setItem('szafki:projekt', JSON.stringify(q)); },
    { name: 'R', active: 0, prices: {}, runs, items });
  await page.reload({ waitUntil: 'networkidle' }); await page.waitForTimeout(1800);
};
const uwagi = async () => {
  const c = page.locator('section').filter({ has: page.locator('h2', { hasText: /^Uwagi/ }) }).first();
  return (await c.count()) ? (await c.innerText()).split('\n').filter((l) => l.length > 20) : [];
};
const ruchy = async () => (await uwagi()).filter((l) => /nie wysunie się|nie otworzy się|nie ma się jak otworzyć/.test(l));
const skrot = (a) => a.map((l) => l.slice(0, 150)).join(' // ') || '(brak)';

console.log('== prosty ciąg: szuflady i klapy bez kolizji ==');
await seed([RUN('c1', 'Ściana A', { worktop: false })], [
  CAB('S1', 600, 'c1', SZUF), CAB('D1', 600, 'c1', DRZWI),
  CAB('K1', 600, 'c1', { kind: 'doors', doors: 1, klapa: 'gora' })]);
let r = await ruchy();
ok('bez blatu nic się nie blokuje', r.length === 0, skrot(r));

console.log('\n== klapa do góry pod blatem: staje przed wieńcem, otwiera się ==');
/* Zawiasy te same co przy skrzydlach (uzytkownik 2026-09-28): skrzydlo staje
   przed krawedzia boku, klapa — przed krawedzia wienca, 3 mm pod blatem. */
await seed([RUN('c1', 'Ściana A')], [CAB('S1', 600, 'c1', SZUF),
  CAB('K1', 600, 'c1', { kind: 'doors', doors: 1, klapa: 'gora' })]);
r = await ruchy();
ok('klapa pod blatem bez kolizji', !r.some((l) => /Klapa/.test(l)), skrot(r));
ok('szuflady pod blatem wolne', !r.some((l) => /Szuflada szafki „S1"/.test(l)), skrot(r));

console.log('\n== klapa w zasłoniętej części ślepego rogu ==');
await seed([RUN('c1', 'Ściana A', { worktop: false }),
  RUN('c2', 'Ściana B', { worktop: false, corner: { of: 'c1', at: 'end', owner: 'self', clear: 0 } })], [
  CAB('A1', 600, 'c1', DRZWI), CAB('A2', 600, 'c1', DRZWI),
  CAB('R', 1000, 'c2', { kind: 'doors', doors: 1, klapa: 'gora' })]);
r = await ruchy();
const kl = r.find((l) => /Klapa do góry szafki „R"/.test(l));
ok('klapa R nie otworzy się: po drodze szafka z ciągu „Ściana A”',
  !!kl && /nie otworzy się na 90°: po drodze stoi .* szafki „A2" z ciągu „Ściana A" — otworzy się tylko na ok\. \d+°/.test(kl), skrot(r));

console.log('\n== klapa w dół w szafce górnej: wolna ==');
await seed([RUN('g1', 'Górne', { worktop: false, H: 360, D: 300, plinth: { on: false }, mountY: 1500 })], [
  { cab: { name: 'G1', W: 600, H: 360, D: 300, plinth: { on: false }, legs: { on: false }, hangerMode: 'listwa',
    levels: [{ h: null, cols: [{ w: null, kind: 'doors', doors: 1, klapa: 'dol' }] }] }, runId: 'g1', offset: 0 }]);
r = await ruchy();
ok('klapa w dół bez przeszkód', r.length === 0, skrot(r));

console.log('\n== szuflada w zasłoniętej części ślepego rogu ==');
/* Sciana B wjezdza w rog szafka R 1000 z szufladami na cala szerokosc, sciana A
   staje bokiem przed jej licem. Szuflady R przy rogu wyjezdzaja wprost na
   korpus A2 — prawdziwa pomylka projektu, ktora trzeba zobaczyc. */
await seed([RUN('c1', 'Ściana A', { worktop: false }),
  RUN('c2', 'Ściana B', { worktop: false, corner: { of: 'c1', at: 'end', owner: 'self', clear: 0 } })], [
  CAB('A1', 600, 'c1', DRZWI), CAB('A2', 600, 'c1', DRZWI), CAB('R', 1000, 'c2', SZUF)]);
r = await ruchy();
const szR = r.find((l) => /Szuflada szafki „R"/.test(l));
ok('szuflada R nie wysunie się: po drodze szafka z ciągu „Ściana A”',
  !!szR && /nie wysunie się do końca: po drodze stoi .* szafki „A2" z ciągu „Ściana A"/.test(szR), skrot(r));
ok('podaje, ile się wysunie i ile ma', !!szR && /wysunie się tylko \d+ z \d+ mm/.test(szR), szR || '');
ok('rada: luz w rogu', !!szR && /Luz w rogu/.test(szR), szR || '');

console.log('\n== w zasłoniętej części drzwi, szuflady obok: szuflady wolne ==');
await seed([RUN('c1', 'Ściana A', { worktop: false }),
  RUN('c2', 'Ściana B', { worktop: false, corner: { of: 'c1', at: 'end', owner: 'self', clear: 0 } })], [
  CAB('A1', 600, 'c1', DRZWI), CAB('A2', 600, 'c1', DRZWI),
  { cab: { name: 'R', W: 1000, H: 720, D: 560, plinth: PL, levels: [{ h: null, cols: [
    { kind: 'doors', doors: 1, w: 640 }, { ...SZUF, w: null }] }] }, runId: 'c2', offset: 0 }]);
r = await ruchy();
ok('szuflady obok fixu wysuwają się', !r.some((l) => /Szuflada szafki „R"/.test(l)), skrot(r));

console.log('\nBLEDY:', errors.length ? errors.join('; ') : '(brak)');
await b.close();
