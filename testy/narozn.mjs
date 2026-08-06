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
const card = (re) => page.locator('section').filter({ has: page.locator('h2', { hasText: re }) }).first();
const svgTexts = () => page.evaluate(() => [...document.querySelectorAll('svg text')].map((t) => t.textContent.trim()));
/* Obrocony ciag ma w atrybutach dalej swoje wlasne wspolrzedne — dopiero
   getBoundingClientRect pokazuje, gdzie naprawde wyladowal. */
const mmShapes = (sel) => page.evaluate((s) => {
  const svg = document.querySelector('svg');
  const vb = svg.getAttribute('viewBox').split(' ').map(Number);
  const box = svg.getBoundingClientRect();
  const k = box.width / vb[2];
  return [...svg.querySelectorAll(s)].map((r) => {
    const b = r.getBoundingClientRect();
    /* O tym, do ktorego ciagu nalezy ksztalt, mowi obrot jego grupy — po samych
       wymiarach nie da sie tego poznac, bo szafka 600 gleboka i 500 szeroka po
       obrocie wyglada jak lezaca. */
    let rot = 0;
    for (let e = r; e && e.tagName !== 'svg'; e = e.parentElement) {
      const m = /rotate\((-?\d+)/.exec(e.getAttribute('transform') || '');
      if (m) { rot = ((+m[1] % 360) + 360) % 360; break; }
    }
    return {
      x: Math.round((b.x - box.x) / k + vb[0]), y: Math.round((b.y - box.y) / k + vb[1]),
      w: Math.round(b.width / k), h: Math.round(b.height / k), f: r.getAttribute('fill'), rot,
    };
  });
}, sel);

const PL = { on: true, height: 100, mode: 'under', setback: 0 };
const CAB = (name, W, D, runId) => ({
  cab: { name, W, H: 720, D, plinth: PL,
    levels: [{ h: null, cols: [{ kind: 'doors', doors: 1, w: null }] }] }, runId, offset: 0 });
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
// korpus szafki w rzucie z gory: jasne tlo o szerokosci szafki
const korpusy = async () => (await mmShapes('rect')).filter((q) => q.f === '#fafaf9' && q.w > 100 && q.h > 100);

await page.goto(URL, { waitUntil: 'networkidle' });

console.log('== dwa ciagi pod katem prostym w rzucie z gory ==');
await seed(
  [RUN('c1', 'Ściana A'), RUN('c2', 'Ściana B', { corner: { of: 'c1', at: 'end', owner: 'of', clear: 0 } })],
  [CAB('A1', 800, 600, 'c1'), CAB('A2', 600, 600, 'c1'), CAB('B1', 500, 600, 'c2'), CAB('B2', 700, 600, 'c2')]);
await pick('Zabudowa');
await pick('Z góry');
let k = await korpusy();
console.log('     ' + JSON.stringify(k.map((q) => ({ x: q.x, y: q.y, w: q.w, h: q.h }))));
ok('wszystkie cztery szafki narysowane', k.length === 4, String(k.length));
// ciag A lezy poziomo (szeroki, plytki), ciag B pionowo (waski, wysoki)
const poziome = k.filter((q) => q.rot === 0);
const pionowe = k.filter((q) => q.rot === 90);
ok('ciąg A leży wzdłuż osi X', poziome.length === 2, JSON.stringify(poziome.map((q) => q.w)));
ok('ciąg B stoi pod kątem prostym', pionowe.length === 2, JSON.stringify(pionowe.map((q) => q.h)));
ok('obrócone szafki mają szerokość równą głębokości ciągu',
  pionowe.every((q) => q.w === 600), JSON.stringify(pionowe.map((q) => q.w)));
ok('obrócone szafki zachowały swoje szerokości',
  pionowe.map((q) => q.h).sort((a, b) => a - b).join(',') === '500,700',
  JSON.stringify(pionowe.map((q) => q.h)));

console.log('\n== rog zjada glebokosc ciagu, ktory w niego wjezdza ==');
// A dojezdza do rogu (koniec A = 1400), wiec B startuje 600 mm dalej
const konA = Math.max(...poziome.map((q) => q.x + q.w));
const startB = Math.min(...pionowe.map((q) => q.y));
console.log(`     koniec A: ${konA}, poczatek B: ${startB}`);
ok('ciąg B zaczyna się o głębokość ciągu A od rogu', startB === 600, String(startB));
ok('ciągi nie wchodzą na siebie', pionowe.every((q) => q.y >= 600), JSON.stringify(pionowe.map((q) => q.y)));
ok('lico ciągu B jest po stronie pokoju',
  pionowe.every((q) => q.x + q.w <= konA + 1 && q.x >= konA - 601),
  JSON.stringify(pionowe.map((q) => ({ x: q.x, kon: q.x + q.w }))));
let tx = await svgTexts();
ok('strata w rogu opisana na rysunku', tx.includes('600'), tx.join(' | '));
await page.locator('svg').first().screenshot({ path: S + 'shot-narozn-top.png' });

console.log('\n== przelaczenie: to ten ciag wjezdza w rog ==');
await seed(
  [RUN('c1', 'Ściana A'), RUN('c2', 'Ściana B', { corner: { of: 'c1', at: 'end', owner: 'self', clear: 0 } })],
  [CAB('A1', 800, 600, 'c1'), CAB('A2', 600, 600, 'c1'), CAB('B1', 500, 600, 'c2'), CAB('B2', 700, 600, 'c2')]);
await pick('Zabudowa');
await pick('Z góry');
k = await korpusy();
const poz2 = k.filter((q) => q.rot === 0), pio2 = k.filter((q) => q.rot === 90);
console.log('     ' + JSON.stringify(k.map((q) => ({ x: q.x, y: q.y, w: q.w, h: q.h }))));
ok('ciąg B dojeżdża teraz do samego rogu', Math.min(...pio2.map((q) => q.y)) === 0,
  String(Math.min(...pio2.map((q) => q.y))));
ok('to ciąg A odsuwa się od rogu',
  Math.max(...poz2.map((q) => q.x + q.w)) === 1400,
  String(Math.max(...poz2.map((q) => q.x + q.w))));
ok('nadal się nie nakładają',
  poz2.every((q) => q.x + q.w <= Math.min(...pio2.map((p) => p.x)) + 1),
  JSON.stringify([poz2.map((q) => q.x + q.w), pio2.map((q) => q.x)]));

console.log('\n== luz w rogu ==');
await seed(
  [RUN('c1', 'Ściana A'), RUN('c2', 'Ściana B', { corner: { of: 'c1', at: 'end', owner: 'of', clear: 50 } })],
  [CAB('A1', 800, 600, 'c1'), CAB('B1', 500, 600, 'c2')]);
await pick('Zabudowa');
await pick('Z góry');
k = await korpusy();
const startB2 = Math.min(...k.filter((q) => q.rot === 90).map((q) => q.y));
ok('luz dokłada się do straty w rogu', startB2 === 650, String(startB2));

console.log('\n== narożnik przed ciagiem (lustrzane L) ==');
await seed(
  [RUN('c1', 'Ściana A'), RUN('c2', 'Ściana B', { corner: { of: 'c1', at: 'start', owner: 'of', clear: 0 } })],
  [CAB('A1', 800, 600, 'c1'), CAB('B1', 500, 600, 'c2')]);
await pick('Zabudowa');
await pick('Z góry');
k = await korpusy();
console.log('     ' + JSON.stringify(k.map((q) => ({ x: q.x, y: q.y, w: q.w, h: q.h }))));
const a = k.find((q) => q.rot === 0), b = k.find((q) => q.rot !== 0);
console.log('     obroty: ' + JSON.stringify(k.map((q) => q.rot)));
/* Lustrzane L: sciana A idzie w prawo gora, sciana B schodzi w dol po lewej —
   rog wypada w (0,0), a B konczy sie przy nim, zamiast od niego zaczynac. */
ok('drugi ciąg schodzi w dół przy lewej ścianie', b.rot === 270 && b.x === 0,
  `rot ${b.rot}, x ${b.x}`);
ok('i nie wchodzi na pierwszy', b.y >= 600, String(b.y));
ok('pierwszy ciąg dojeżdża do rogu', a.x === 0, String(a.x));

console.log('\n== U z trzech scian ==');
await seed(
  [RUN('c1', 'A'), RUN('c2', 'B', { corner: { of: 'c1', at: 'end', owner: 'of', clear: 0 } }),
    RUN('c3', 'C', { corner: { of: 'c2', at: 'end', owner: 'of', clear: 0 } })],
  [CAB('A1', 900, 600, 'c1'), CAB('B1', 900, 600, 'c2'), CAB('C1', 900, 600, 'c3')]);
await pick('Zabudowa');
await pick('Z góry');
k = await korpusy();
console.log('     ' + JSON.stringify(k.map((q) => ({ x: q.x, y: q.y, w: q.w, h: q.h }))));
ok('trzy ciągi na rysunku', k.length === 3, String(k.length));
console.log('     obroty: ' + JSON.stringify(k.map((q) => q.rot)));
ok('trzecia ściana wraca równolegle do pierwszej',
  k.filter((q) => q.rot === 180).length === 1 && k.filter((q) => q.rot === 90).length === 1,
  JSON.stringify(k.map((q) => q.rot)));
const [g1, g3] = k.filter((q) => q.rot !== 90).sort((p, q) => p.y - q.y);
ok('trzecia ściana leży niżej — pod pierwszą', g3.y > g1.y, `${g1.y} vs ${g3.y}`);
await page.locator('svg').first().screenshot({ path: S + 'shot-narozn-u.png' });

console.log('\n== elewacja jako rozwiniecie scian ==');
await seed(
  [RUN('c1', 'Ściana A', { wallW: 2000 }), RUN('c2', 'Ściana B', { corner: { of: 'c1', at: 'end', owner: 'of', clear: 0 } })],
  [CAB('A1', 800, 600, 'c1'), CAB('B1', 500, 600, 'c2')]);
await pick('Zabudowa');
await pick('Zamk.');
tx = await svgTexts();
console.log('     ' + tx.join(' | '));
ok('rozwinięcie oznaczone narożnikiem', tx.includes('narożnik'), tx.join(' | '));
ok('obie szafki w elewacji', tx.includes('800') && tx.includes('500'), tx.join(' | '));
const ele = await mmShapes('rect');
const kor = ele.filter((q) => q.f === '#fafaf9' && q.h === 720);
console.log('     ' + JSON.stringify(kor.map((q) => ({ x: q.x, w: q.w }))));
ok('szafki dwóch ścian nie leżą na sobie',
  kor.length === 2 && Math.abs(kor[0].x - kor[1].x) > 800,
  JSON.stringify(kor.map((q) => q.x)));
await page.locator('svg').first().screenshot({ path: S + 'shot-narozn-elew.png' });

console.log('\n== uwaga o narozniku w karcie ==');
const uw = card(/Uwagi/);
const txt = await uw.innerText();
console.log('     ' + txt.replace(/\n+/g, ' / ').slice(0, 300));
ok('narożnik opisany w uwagach', /naroż/i.test(txt), txt.slice(0, 120));

console.log('\n== slepy naroznik: ile frontu zostaje ==');
// szafka 900 w rogu, drugi ciag 600 gleboki — do reki zostaje 300 mm frontu
await seed(
  [RUN('c1', 'Ściana A'), RUN('c2', 'Ściana B', { corner: { of: 'c1', at: 'end', owner: 'of', clear: 0 } })],
  [CAB('A1', 600, 600, 'c1'), CAB('A2', 900, 600, 'c1'), CAB('B1', 500, 600, 'c2')]);
await pick('Zabudowa');
await pick('Z góry');
tx = await svgTexts();
console.log('     ' + tx.join(' | '));
ok('rysunek pokazuje odsłonięty kawałek frontu', tx.includes('300 dostępu'), tx.join(' | '));
let uwagi = await card(/Uwagi/).innerText();
console.log('     ' + uwagi.replace(/\n+/g, ' / ').slice(0, 260));
ok('uwagi mówią o ślepym narożniku', /Ślepy narożnik/.test(uwagi), uwagi.slice(0, 160));
ok('podana zasłonięta i wolna szerokość', /600 mm frontu zasłonięte/.test(uwagi) && /300 mm/.test(uwagi),
  uwagi.slice(0, 200));

console.log('\n== szafka w rogu weższa niz drugi ciag jest slepa ==');
await seed(
  [RUN('c1', 'Ściana A'), RUN('c2', 'Ściana B', { corner: { of: 'c1', at: 'end', owner: 'of', clear: 0 } })],
  [CAB('A1', 600, 600, 'c1'), CAB('A2', 500, 600, 'c1'), CAB('B1', 500, 600, 'c2')]);
await pick('Zabudowa');
await pick('Z góry');
tx = await svgTexts();
ok('rysunek oznacza szafkę jako ślepą', tx.includes('ślepa'), tx.join(' | '));
uwagi = await card(/Uwagi/).innerText();
console.log('     ' + uwagi.replace(/\n+/g, ' / ').slice(0, 260));
ok('to jest błąd, nie podpowiedź', /chowa się w całości/.test(uwagi), uwagi.slice(0, 200));
ok('podpowiedź, do ilu poszerzyć', /800 mm/.test(uwagi), uwagi.slice(0, 260));
await page.locator('svg').first().screenshot({ path: S + 'shot-narozn-slepa.png' });

console.log('\n== karta ciagu: ustawienie naroznika z UI ==');
await seed([RUN('c1', 'Ściana A'), RUN('c2', 'Ściana B')],
  [CAB('A1', 800, 600, 'c1'), CAB('B1', 500, 600, 'c2')]);
const cc = card(/^Ciąg meblowy$/);
const sel = cc.locator('select').filter({ hasText: 'Ciąg stoi osobno' }).first();
ok('pole narożnika jest w karcie ciągu', await sel.count() === 1, String(await sel.count()));
const opcje = await sel.locator('option').allTextContents();
console.log('     ' + JSON.stringify(opcje));
ok('można wskazać drugi ciąg', opcje.some((o) => /Ściana B/.test(o)), JSON.stringify(opcje));
ok('nie można wskazać samego siebie', !opcje.some((o) => /Ściana A/.test(o)), JSON.stringify(opcje));
await sel.selectOption({ index: 1 });
await page.waitForTimeout(900);
const zapis = await page.evaluate(() => JSON.parse(localStorage.getItem('szafki:projekt')).runs.map((r) => r.corner));
console.log('     ' + JSON.stringify(zapis));
ok('narożnik zapisany w projekcie', !!zapis[0] && zapis[0].of === 'c2', JSON.stringify(zapis));
ok('domyślnie w róg wjeżdża tamten ciąg', zapis[0].owner === 'of', JSON.stringify(zapis[0]));
const info = await cc.innerText();
ok('karta mówi, ile zjada róg', /zjada/.test(info), info.slice(0, 200));

console.log('\n== zapetlony narożnik nie zawiesza rysunku ==');
await seed(
  [RUN('c1', 'A', { corner: { of: 'c2', at: 'end', owner: 'of', clear: 0 } }),
    RUN('c2', 'B', { corner: { of: 'c1', at: 'end', owner: 'of', clear: 0 } })],
  [CAB('A1', 800, 600, 'c1'), CAB('B1', 500, 600, 'c2')]);
await pick('Zabudowa');
await pick('Z góry');
k = await korpusy();
ok('rysunek powstał mimo pętli', k.length === 2, String(k.length));

console.log('\n== wszystkie warianty z naroznikiem bez bledow ==');
await seed(
  [RUN('c1', 'A', { wallW: 2000 }), RUN('c2', 'B', { corner: { of: 'c1', at: 'end', owner: 'of', clear: 0 }, mountY: 1400, H: 720 })],
  [CAB('A1', 800, 600, 'c1'), CAB('A2', 600, 600, 'c1'), CAB('B1', 500, 600, 'c2')]);
await pick('Zabudowa');
for (const v of ['Zamk.', 'Otw.', 'Z góry', 'Z tyłu', '3D']) {
  const before = errors.length;
  await pick(v);
  ok(`wariant ${v}`, errors.length === before, errors.slice(before).join('; '));
}
await pick('3D');
await page.locator('svg').first().screenshot({ path: S + 'shot-narozn-3d.png' });

console.log('\n== bez naroznika nic sie nie zmienia ==');
await seed([RUN('c1', 'Ściana A')], [CAB('A1', 800, 600, 'c1'), CAB('A2', 600, 600, 'c1')]);
await pick('Ciąg');
await pick('Z góry');
k = await korpusy();
console.log('     ' + JSON.stringify(k.map((q) => ({ x: q.x, y: q.y, w: q.w, h: q.h }))));
ok('ciąg bez narożnika leży wzdłuż osi X', k.every((q) => q.rot === 0), JSON.stringify(k.map((q) => q.rot)));
ok('pierwsza szafka zaczyna się w zerze', Math.min(...k.map((q) => q.x)) === 0,
  String(Math.min(...k.map((q) => q.x))));
tx = await svgTexts();
ok('bez narożnika nie ma o nim mowy', !tx.includes('narożnik'), tx.join(' | '));

console.log('\nBLEDY:', errors.length ? errors.join('\n') : '(brak)');
await browser.close();
