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
/* Pozycje czytamy przeliczone z ekranu na milimetry rysunku — szafki stawia
   na miejsce transform, wiec surowe x/y sa lokalne. */
const mmShapes = (sel) => page.evaluate((s) => {
  const svg = document.querySelector('svg');
  const vb = svg.getAttribute('viewBox').split(' ').map(Number);
  const box = svg.getBoundingClientRect();
  const k = box.width / vb[2];
  return [...svg.querySelectorAll(s)].map((r) => {
    const b = r.getBoundingClientRect();
    return {
      x: Math.round((b.x - box.x) / k + vb[0]), y: Math.round((b.y - box.y) / k + vb[1]),
      w: Math.round(b.width / k), h: Math.round(b.height / k),
      f: r.getAttribute('fill'), dash: r.getAttribute('stroke-dasharray') || '',
    };
  });
}, sel);

const PL = { on: true, height: 100, mode: 'under', setback: 0 };
const seed = async (items, run = {}) => {
  await page.evaluate(({ its, r }) => {
    localStorage.clear();
    localStorage.setItem('szafki:projekt', JSON.stringify({
      name: 'T', active: 0, prices: {},
      runs: [Object.assign({ id: 'c1', name: 'Dolne', wallW: 2600, gap: 0, mountY: 0,
        H: 720, D: 600, plinth: { on: true, height: 100, mode: 'under', setback: 0 } }, r)],
      items: its,
    }));
  }, { its: items, r: run });
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(2400);
};
const DRZWI = (name, W, D, offset = 0) => ({
  cab: { name, W, H: 720, D, plinth: PL,
    levels: [{ h: null, cols: [{ kind: 'doors', doors: 2, w: null }] }] }, runId: 'c1', offset });
await page.goto(URL, { waitUntil: 'networkidle' });

console.log('== 1. rzut z góry: lico w jednej linii, nie plecy ==');
await seed([DRZWI('głęboka', 800, 600), DRZWI('płytka', 600, 400)]);
await pick('Ciąg');
await pick('Z góry');
let sh = await mmShapes('rect');
// tlo korpusu z gory ma pelna szerokosc i glebokosc szafki
const kor = sh.filter((q) => q.f === '#fafaf9' && (q.w === 800 || q.w === 600));
console.log('     ' + JSON.stringify(kor.map((q) => ({ w: q.w, d: q.h, y: q.y, spod: q.y + q.h }))));
ok('obie szafki narysowane', kor.length === 2, JSON.stringify(kor.map((q) => q.w)));
ok('lica w jednej linii', new Set(kor.map((q) => q.y + q.h)).size === 1,
  JSON.stringify(kor.map((q) => q.y + q.h)));
ok('płytsza cofnięta od ściany, nie wysunięta',
  kor.find((q) => q.w === 600).y > kor.find((q) => q.w === 800).y,
  JSON.stringify(kor.map((q) => ({ w: q.w, y: q.y }))));

console.log('\n== wysunięcie z lica da się ustawić ==');
await seed([DRZWI('A', 800, 600), DRZWI('B', 600, 600, 40)]);
await pick('Ciąg');
await pick('Z góry');
sh = await mmShapes('rect');
const kor2 = sh.filter((q) => q.f === '#fafaf9' && (q.w === 800 || q.w === 600));
console.log('     ' + JSON.stringify(kor2.map((q) => ({ w: q.w, spod: q.y + q.h }))));
const licoA = kor2.find((q) => q.w === 800).y + kor2.find((q) => q.w === 800).h;
const licoB = kor2.find((q) => q.w === 600).y + kor2.find((q) => q.w === 600).h;
ok('wysunięta szafka stoi 40 mm przed resztą', licoB - licoA === 40, `${licoA} vs ${licoB}`);
let tx = await svgTexts();
ok('wysunięcie opisane na rysunku', tx.includes('+40'), tx.join(' | '));
// pole w karcie
await pick('Zamk.');
const pole = card(/^Ciąg meblowy$/).locator('label').filter({ hasText: 'Wysunięcie tej szafki z lica' });
ok('pole wysunięcia jest w karcie ciągu', await pole.count() === 1, String(await pole.count()));

console.log('\n== rzut z góry pokazuje boki, fronty i maskownice ==');
await seed([{ cab: { name: 'A', W: 800, H: 720, D: 600, plinth: PL,
  levels: [{ h: null, cols: [{ kind: 'doors', doors: 2, w: 500 },
                             { kind: 'blenda', w: null }] }] }, runId: 'c1', offset: 0 }]);
await pick('Ciąg');
await pick('Z góry');
sh = await mmShapes('rect');
const boki = sh.filter((q) => q.w === 18 && q.h > 300);
console.log('     boki: ' + JSON.stringify(boki.map((q) => q.x)));
ok('oba boki narysowane', boki.length >= 2, String(boki.length));
const fronty = sh.filter((q) => q.h === 18 && q.w > 100);
console.log('     fronty: ' + JSON.stringify(fronty.map((q) => q.w)));
ok('fronty widać jako pas przy licu', fronty.length >= 1, JSON.stringify(fronty.map((q) => q.w)));
const przekr = await page.evaluate(() => [...document.querySelectorAll('svg line')]
  .filter((l) => Math.abs(+l.getAttribute('x1') - +l.getAttribute('x2')) > 20
    && Math.abs(+l.getAttribute('y1') - +l.getAttribute('y2')) > 5).length);
ok('maskownica przekreślona jak w widoku szafki', przekr >= 2, String(przekr));

console.log('\n== wycięcia i elementy kolizyjne we wszystkich widokach ==');
const OB = { cab: { name: 'z rurą', W: 800, H: 720, D: 600, plinth: PL,
  obstacle: { on: true, name: 'rura', x: 300, w: 120, d: 150, y: 0, h: 500, mask: true },
  levels: [{ h: null, cols: [{ kind: 'doors', doors: 2, w: null }] }] }, runId: 'c1', offset: 0 };
await seed([OB, DRZWI('B', 600, 600)]);
await pick('Ciąg');
for (const [v, opis] of [['Zamk.', 'zamknięty'], ['Otw.', 'otwarty'], ['Z góry', 'z góry'], ['Z tyłu', 'z tyłu']]) {
  await pick(v);
  const kol = await mmShapes('rect');
  /* Rzut z gory rysuje bryle tym samym fioletem co widok pojedynczej szafki,
     elewacja i widok z tylu — bursztynem ostrzezenia. */
  const zazn = kol.filter((q) => ['#b45309', '#b91c1c', '#7c3aed'].includes(q.f));
  console.log(`     ${opis}: ${zazn.length} zaznaczeń ` + JSON.stringify(zazn.map((q) => ({ w: q.w, h: q.h }))));
  ok(`element kolizyjny widać w widoku ${opis}`, zazn.length >= 1, String(zazn.length));
}
await pick('3D');
const bryly = await page.evaluate(() => [...document.querySelectorAll('svg polygon')]
  .filter((p) => (p.getAttribute('fill') || '').startsWith('rgb(') && +p.getAttribute('fill-opacity') < 0.4).length);
console.log('     3D: ' + bryly + ' ścianek półprzezroczystych');
ok('element kolizyjny widać w 3D', bryly >= 6, String(bryly));

console.log('\n== wymiary frontów w elewacji ciągu ==');
await seed([DRZWI('A', 800, 600), DRZWI('B', 600, 600)]);
await pick('Ciąg');
await pick('Zamk.');
tx = await svgTexts();
console.log('     ' + tx.join(' | '));
const formatki = tx.filter((t) => /^\d+×\d+$/.test(t));
ok('formatki frontów opisane', formatki.length === 4, JSON.stringify(formatki));
ok('szerokości szafek', tx.includes('800') && tx.includes('600'), tx.join(' | '));
ok('suma ciągu', tx.some((t) => /ciąg$/.test(t)), tx.join(' | '));
ok('wysokość całkowita', tx.includes('820'), tx.join(' | '));

console.log('\n== te same formatki co przy pojedynczej szafce ==');
await page.evaluate(() => {
  const d = JSON.parse(localStorage.getItem('szafki:projekt'));
  d.runs = []; d.items.forEach((it) => { it.runId = null; });
  d.items = [d.items[0]];
  localStorage.setItem('szafki:projekt', JSON.stringify(d));
});
await page.reload({ waitUntil: 'networkidle' });
await page.waitForTimeout(2300);
const sam = (await svgTexts()).filter((t) => /^\d+×\d+$/.test(t));
console.log('     szafka sama: ' + JSON.stringify(sam));
ok('pojedyncza szafka ma te same opisy formatek', sam.length === 2, JSON.stringify(sam));

console.log('\n== wszystkie warianty bez błędów ==');
await seed([OB, DRZWI('B', 600, 400, -30)]);
await pick('Ciąg');
for (const v of ['Zamk.', 'Otw.', 'Z góry', 'Z tyłu', '3D']) {
  const before = errors.length;
  await pick(v);
  ok(`wariant ${v}`, errors.length === before, errors.slice(before).join('; '));
}
await pick('Z góry');
await page.locator('svg').first().screenshot({ path: S + 'shot-top2.png' });

console.log('\nBLEDY:', errors.length ? errors.join('\n') : '(brak)');
await browser.close();
