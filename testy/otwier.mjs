import pw from '/opt/node22/lib/node_modules/playwright/index.js';
const { chromium } = pw;
const S = './';
const URL = process.env.STD ? 'http://127.0.0.1:5199/standalone-local.html'
  : 'http://127.0.0.1:5205/mebloprojekt-app.html';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const page = await (await browser.newContext({ viewport: { width: 1500, height: 1200 } })).newPage();
const errors = [];
page.on('pageerror', (e) => errors.push('[pageerror] ' + e.message));
/* Build standalone kompiluje JSX w przegladarce, a Babel powyzej 500 KB zrodla
   drukuje notatke o „deoptimised styling" jako console.error — to nie jest blad
   aplikacji, wiec nie liczymy jej. */
page.on('console', (m) => { if (m.type() === 'error' && !/favicon|404|deoptimised/.test(m.text())) errors.push('[console] ' + m.text()); });
const ok = (l, c, e = '') => console.log((c ? '  OK   ' : '  BLAD ') + l + (e ? ' — ' + e : ''));

const PL = { on: true, height: 100, mode: 'under', setback: 0 };
const CAB = (name, W, runId, corner = null, extra = {}, offset = 0) => ({
  cab: Object.assign({ name, W, H: 720, D: 600, plinth: PL, corner,
    levels: [{ h: null, cols: [{ kind: 'doors', doors: 1, w: null }] }] }, extra), runId, offset });
const SZUF = (name, W, runId) => ({
  cab: { name, W, H: 720, D: 600, plinth: PL, corner: null,
    levels: [{ h: null, cols: [{ kind: 'drawers', w: null,
      drawers: [{ front: null, nl: 500 }, { front: null, nl: 500 }] }] }] }, runId, offset: 0 });
const RUN = (id, name, extra = {}) => Object.assign({
  id, name, wallW: null, gap: 0, mountY: 0, H: 720, D: 600,
  plinth: { on: true, height: 100, mode: 'under', setback: 0 }, corner: null }, extra);
const seed = async (runs, items) => {
  await page.evaluate(({ rs, its }) => {
    localStorage.clear();
    localStorage.setItem('szafki:projekt', JSON.stringify({
      name: 'T', active: 0, prices: {}, runs: rs, items: its }));
  }, { rs: runs, its: items });
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(2400);
};
// same linie o kolizji otwierania — reszta uwag nas tu nie obchodzi
const kolizje = async () => {
  const c = page.locator('section').filter({ has: page.locator('h2', { hasText: /Uwagi/ }) }).first();
  if (!(await c.count())) return [];
  return (await c.innerText()).split('\n').filter((l) => /nie ma się jak otworzyć/.test(l));
};
/* Uwagi rozroznia sie ikona: „×" to blad, „!" ostrzezenie, „i" podpowiedz.
   Bierzemy ikony wszystkich linii o kolizji otwierania. */
const ikonyKolizji = async () => page.evaluate(() => {
  const t = [...document.querySelectorAll('section')]
    .map((s) => s.innerText).find((x) => /nie ma się jak otworzyć/.test(x)) || '';
  const linie = t.split('\n').map((l) => l.trim());
  return linie.flatMap((l, i) =>
    /nie ma się jak otworzyć/.test(l) ? [(linie[i - 1] || '').trim()] : []);
});
const skrot = (xs) => xs.map((l) => l.slice(0, 90)).join(' / ');
// narożnik L: ciąg A wjeżdża w róg, ciąg B odsuwa się o jego głębokość
const LRUNY = (extra = {}) => [RUN('c1', 'Ściana A'),
  RUN('c2', 'Ściana B', Object.assign({ corner: { of: 'c1', at: 'end', owner: 'of', clear: 0 } }, extra))];

await page.goto(URL, { waitUntil: 'networkidle' });

console.log('== prosty ciag: nic sie nie blokuje ==');
await seed([RUN('c1', 'Ściana A')],
  [CAB('A1', 600, 'c1'), CAB('A2', 600, 'c1'), CAB('A3', 450, 'c1'), CAB('A4', 800, 'c1')]);
let k = await kolizje();
ok('ciąg przy jednej ścianie bez kolizji', k.length === 0, skrot(k));

console.log('\n== wysuniecie z lica to nie kolizja ==');
/* Pole „wysunięcie" przesuwa całą szafkę i samo w sobie niczego nie blokuje —
   skrzydło i tak nie wychodzi poza własny front. */
await seed([RUN('c1', 'Ściana A')],
  [CAB('A1', 600, 'c1'), CAB('A2', 600, 'c1', null, {}, 150)]);
k = await kolizje();
ok('wysunięta sąsiadka nie blokuje skrzydła', k.length === 0, skrot(k));

console.log('\n== slepy naroznik: skrzydlo wjezdza w drugi ciag ==');
await seed(LRUNY(), [CAB('A1', 600, 'c1'), CAB('rogowa', 900, 'c1'), CAB('B1', 700, 'c2')]);
k = await kolizje();
console.log('     ' + k.join('\n     '));
ok('kolizja w narożniku zgłoszona', k.length > 0, String(k.length));
const ikony = await ikonyKolizji();
ok('kolizja zgłoszona jako błąd, nie ostrzeżenie',
  ikony.length > 0 && ikony.every((z) => z === '×'), JSON.stringify(ikony));
ok('kolizja idzie przez granicę ścian', k.some((l) => /Ściana B/.test(l) && /Ściana A/.test(l)),
  skrot(k));
ok('podane, o ile brakuje', k.some((l) => /brakuje \d+ mm/.test(l)), skrot(k));
ok('podpowiedziane zawiasy i węższy front',
  k.some((l) => /Przełóż zawiasy/.test(l) && /zwęź front do \d+ mm/.test(l)), skrot(k));

console.log('\n== kolizja z uchwytem, nie tylko z plyta ==');
ok('uchwyt bywa tym, co stoi na drodze', k.some((l) => /uchwyt/.test(l)), skrot(k));

console.log('\n== szafka narozna z ramieniem: front na cala szerokosc nie wejdzie ==');
await seed(LRUNY(),
  [CAB('A1', 600, 'c1'), CAB('rogowa', 900, 'c1', { on: true, arm: 500, doors: 'wsporniki' }),
   CAB('B1', 700, 'c2')]);
k = await kolizje();
console.log('     ' + k.join('\n     '));
ok('front przez całą szerokość wchodzi w ramię',
  k.some((l) => /rogowa/.test(l) && /ramię/.test(l)), skrot(k));

console.log('\n== ta sama szafka z jednymi drzwiami na dostepne swiatlo ==');
await seed(LRUNY(),
  [CAB('A1', 600, 'c1'),
   { cab: { name: 'rogowa', W: 900, H: 720, D: 600, plinth: PL,
       corner: { on: true, arm: 500, doors: 'wsporniki' },
       levels: [{ h: null, cols: [{ kind: 'doors', doors: 1, w: null,
         doorWidths: [300], hinge: 'left' }] }] }, runId: 'c1', offset: 0 },
   CAB('B1', 700, 'c2')]);
k = await kolizje();
ok('poprawiona szafka narożna otwiera się bez kolizji', k.length === 0, skrot(k));

console.log('\n== wysunieta szuflada zza rogu tez jest przeszkoda ==');
await seed(LRUNY(), [CAB('A1', 600, 'c1'), CAB('rogowa', 900, 'c1'), SZUF('B1', 700, 'c2')]);
k = await kolizje();
console.log('     ' + k.join('\n     '));
ok('szuflady zza rogu wchodzą do sprawdzenia', k.length > 0, String(k.length));

console.log('\n== luz w rogu rozsuwa ciagi ==');
/* Im wiekszy luz w rogu, tym dalej stoi drugi ciag — kolizji ma byc mniej. */
await seed(LRUNY({ corner: { of: 'c1', at: 'end', owner: 'of', clear: 0 } }),
  [CAB('A1', 600, 'c1'), CAB('rogowa', 600, 'c1'), CAB('B1', 700, 'c2')]);
const bezLuzu = (await kolizje()).length;
await seed(LRUNY({ corner: { of: 'c1', at: 'end', owner: 'of', clear: 900 } }),
  [CAB('A1', 600, 'c1'), CAB('rogowa', 600, 'c1'), CAB('B1', 700, 'c2')]);
const zLuzem = (await kolizje()).length;
console.log('     kolizji bez luzu: ' + bezLuzu + ', z luzem 900 mm: ' + zLuzem);
ok('luz w rogu zdejmuje kolizje', zLuzem < bezLuzu || (bezLuzu === 0 && zLuzem === 0),
  bezLuzu + ' → ' + zLuzem);

console.log('\n== wystawanie uchwytu wchodzi do kontroli ==');
/* Uchwyt styka sie pierwszy, wiec to on decyduje o kilku ostatnich milimetrach.
   Ten sam uklad z uchwytem 20 mm i ze 100 mm ma dac inna glebokosc kolizji,
   a uchwyt zerowy (muszelka, frez) ma zniknac z listy przeszkod. */
const ileBrakuje = async () => (await kolizje())
  .map((l) => Number((/brakuje (\d+) mm/.exec(l) || [])[1] || 0));
const zUchwytem = (mm) => seed(LRUNY(),
  [CAB('A1', 600, 'c1'), CAB('rogowa', 900, 'c1', null, { handleOut: mm }),
   CAB('B1', 700, 'c2', null, { handleOut: mm })]);
await zUchwytem(20);
const u20 = await ileBrakuje();
await zUchwytem(100);
const u100 = await ileBrakuje();
console.log('     uchwyt 20 mm: ' + JSON.stringify(u20) + ', 100 mm: ' + JSON.stringify(u100));
ok('grubszy uchwyt zabiera więcej miejsca',
  u100.length > 0 && u20.length > 0 && Math.max(...u100) > Math.max(...u20),
  JSON.stringify(u20) + ' → ' + JSON.stringify(u100));

await zUchwytem(0);
const bezUchwytu = await kolizje();
console.log('     uchwyt 0 mm: ' + skrot(bezUchwytu));
ok('uchwyt 0 mm nie jest już przeszkodą', !bezUchwytu.some((l) => /stoi uchwyt/.test(l)),
  skrot(bezUchwytu));

console.log('\n== domyslnie 20 mm, tak samo dla drzwi i szuflad ==');
await seed([RUN('c1', 'Ściana A')], [CAB('A1', 600, 'c1'), SZUF('A2', 600, 'c1')]);
const pola = await page.evaluate(() =>
  JSON.parse(localStorage.getItem('szafki:projekt')).items.map((i) => i.cab.handleOut));
console.log('     handleOut w szafkach: ' + JSON.stringify(pola));
ok('domyślne wystawanie uchwytu to 20 mm', pola.every((v) => v === 20), JSON.stringify(pola));

console.log('\n== zadnych bledow w konsoli ==');
ok('brak wyjątków', errors.length === 0, errors.join('; '));
await browser.close();
