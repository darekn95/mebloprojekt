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
// przelacznik rysunku: pierwszy wiersz to zakres, drugi to wariant
const segRows = () => page.evaluate(() => {
  const sec = [...document.querySelectorAll('section')]
    .find((s) => /^Rysunek/.test((s.querySelector('h2') || {}).textContent || ''));
  return [...sec.querySelectorAll('header .flex-col > div')].map((d) =>
    [...d.querySelectorAll('button')].map((b) => ({
      t: b.textContent.trim(), on: b.className.includes('bg-teal-700'),
    })));
});
const pick = async (label) => {
  await page.getByText(label, { exact: true }).first().click();
  await page.waitForTimeout(800);
};
const svgTexts = () => page.evaluate(() => [...document.querySelectorAll('svg text')].map((t) => t.textContent.trim()));
const rects = () => page.evaluate(() => [...document.querySelectorAll('svg rect')].map((r) => ({
  x: Math.round(+r.getAttribute('x')), y: Math.round(+r.getAttribute('y')),
  w: Math.round(+r.getAttribute('width')), h: Math.round(+r.getAttribute('height')),
  dash: r.getAttribute('stroke-dasharray') || '',
})));
/* Szafki stawia na miejsce transform, wiec surowe x/y prostokatow sa lokalne.
   Przeliczamy realne polozenie na ekranie z powrotem na milimetry rysunku. */
const mmRects = () => page.evaluate(() => {
  const svg = document.querySelector('svg');
  const vb = svg.getAttribute('viewBox').split(' ').map(Number);
  const box = svg.getBoundingClientRect();
  const s = box.width / vb[2];
  return [...svg.querySelectorAll('rect')].map((r) => {
    const b = r.getBoundingClientRect();
    return {
      x: Math.round((b.x - box.x) / s + vb[0]),
      y: Math.round((b.y - box.y) / s + vb[1]),
      w: Math.round(b.width / s),
      h: Math.round(b.height / s),
      f: r.getAttribute('fill'),
      dash: r.getAttribute('stroke-dasharray') || '',
    };
  });
});
const vbox = () => page.evaluate(() => document.querySelector('svg').getAttribute('viewBox').split(' ').map(Number));
await page.goto(URL, { waitUntil: 'networkidle' });

const PL = { on: true, height: 100, mode: 'under', setback: 0 };
const NO = { on: false, height: 100, mode: 'under', setback: 0 };
const seed = async (runs, items) => {
  await page.evaluate(({ rs, its }) => {
    localStorage.clear();
    localStorage.setItem('szafki:projekt', JSON.stringify({ name: 'T', active: 0, prices: {}, runs: rs, items: its }));
  }, { rs: runs, its: items });
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(2400);
};
const kuchnia = () => seed(
  [{ id: 'c1', name: 'Dolne', wallW: 2600, gap: 0, mountY: 0, H: 720, D: 500, plinth: PL },
   { id: 'c2', name: 'Górne', wallW: 2600, gap: 0, mountY: 1450, H: 600, D: 320, plinth: NO }],
  [{ cab: { name: 'd1', W: 800, H: 720, D: 500, plinth: PL }, runId: 'c1' },
   { cab: { name: 'd2', W: 600, H: 720, D: 500, plinth: PL }, runId: 'c1' },
   { cab: { name: 'g1', W: 800, H: 600, D: 320, plinth: NO }, runId: 'c2' },
   { cab: { name: 'g2', W: 600, H: 600, D: 320, plinth: NO }, runId: 'c2' }]);

console.log('== pojedyncza szafka: bez wiersza zakresu ==');
await seed([], [{ cab: { name: 'A', W: 600, H: 720, D: 500, plinth: NO }, runId: null }]);
let rows = await segRows();
console.log('     ' + JSON.stringify(rows.map((r) => r.map((b) => b.t))));
ok('jeden wiersz przełącznika', rows.length === 1, String(rows.length));
ok('wiersz to warianty', rows[0].map((b) => b.t).join() === 'Zamk.,Otw.,Z boku,Z góry,Z tyłu,3D',
  rows[0].map((b) => b.t).join());

console.log('\n== jeden ciąg: zakres Szafka / Ciąg, bez Zabudowy ==');
await seed([{ id: 'c1', name: 'S', wallW: null, gap: 0, mountY: 0, H: 720, D: 500, plinth: PL }],
  [{ cab: { name: 'A', W: 600, H: 720, D: 500, plinth: PL }, runId: 'c1' }]);
rows = await segRows();
console.log('     ' + JSON.stringify(rows.map((r) => r.map((b) => b.t))));
ok('dwa wiersze', rows.length === 2, String(rows.length));
ok('zakres w osobnym wierszu nad wariantami', rows[0].map((b) => b.t).join() === 'Szafka,Ciąg',
  rows[0].map((b) => b.t).join());
ok('domyślnie zakres Szafka', rows[0].find((b) => b.t === 'Szafka').on, JSON.stringify(rows[0]));
ok('warianty pełne przy szafce', rows[1].map((b) => b.t).join() === 'Zamk.,Otw.,Z boku,Z góry,Z tyłu,3D',
  rows[1].map((b) => b.t).join());

console.log('\n== zakres Ciąg zabiera „Z boku" ==');
await pick('Ciąg');
rows = await segRows();
console.log('     ' + JSON.stringify(rows[1].map((b) => b.t)));
ok('bok znika przy ciągu', !rows[1].some((b) => b.t === 'Z boku'), rows[1].map((b) => b.t).join());
ok('reszta wariantów zostaje', rows[1].map((b) => b.t).join() === 'Zamk.,Otw.,Z góry,Z tyłu,3D',
  rows[1].map((b) => b.t).join());

console.log('\n== dwa ciągi: dochodzi Zabudowa ==');
await kuchnia();
rows = await segRows();
console.log('     ' + JSON.stringify(rows.map((r) => r.map((b) => b.t))));
ok('trzy zakresy', rows[0].map((b) => b.t).join() === 'Szafka,Ciąg,Zabudowa', rows[0].map((b) => b.t).join());

console.log('\n== zabudowa: górne i dolne na swoich wysokościach ==');
await pick('Zabudowa');
let r = await mmRects();
const dolne = r.filter((q) => q.w === 800 && q.h === 720 && q.f === '#fafaf9');
const gorne = r.filter((q) => q.w === 800 && q.h === 600 && q.f === '#fafaf9');
console.log('     dolna: ' + JSON.stringify(dolne[0]) + '  górna: ' + JSON.stringify(gorne[0]));
ok('korpus dolny i górny są', dolne.length === 1 && gorne.length === 1,
  `${dolne.length} / ${gorne.length}`);
// gorny ciag wisi 1450 nad podloga, dolny stoi na cokole 100
ok('górny wyżej niż dolny', gorne[0].y < dolne[0].y, `${gorne[0].y} vs ${dolne[0].y}`);
ok('spód górnego 1450 nad podłogą',
  Math.round(dolne[0].y + dolne[0].h + 100 - (gorne[0].y + gorne[0].h)) === 1450,
  String(dolne[0].y + dolne[0].h + 100 - (gorne[0].y + gorne[0].h)));
let tx = await svgTexts();
console.log('     ' + tx.join(' | '));
ok('wysokość całkowita 2050', tx.includes('2050'), tx.join(' | '));
ok('poziom montażu 1450', tx.includes('1450'), tx.join(' | '));
ok('suma opisana jako zabudowa', tx.some((t) => /zabudowa$/.test(t)), tx.join(' | '));

console.log('\n== wszystko mieści się w kadrze ==');
const vb = await vbox();
const yTexts = await page.evaluate(() => [...document.querySelectorAll('svg text')]
  .map((t) => +t.getAttribute('y')));
const xTexts = await page.evaluate(() => [...document.querySelectorAll('svg text')]
  .map((t) => +t.getAttribute('x')));
console.log('     viewBox ' + JSON.stringify(vb) + '  y: ' + Math.min(...yTexts) + '..' + Math.max(...yTexts));
ok('żaden opis nie wypada pod kadr', Math.max(...yTexts) < vb[1] + vb[3], `${Math.max(...yTexts)} < ${vb[1] + vb[3]}`);
ok('żaden opis nie wypada nad kadr', Math.min(...yTexts) > vb[1], `${Math.min(...yTexts)} > ${vb[1]}`);
ok('żaden opis nie wypada w prawo', Math.max(...xTexts) < vb[0] + vb[2], `${Math.max(...xTexts)} < ${vb[0] + vb[2]}`);

console.log('\n== plan: ciąg górny przerywaną linią na tle dolnego ==');
await pick('Z góry');
r = await mmRects();
// tlo korpusu z gory: pelna glebokosc szafki; ciag wyzszy idzie przerywana linia
const solid = r.filter((q) => q.f === '#fafaf9' && q.h === 500 && !q.dash);
const dashed = r.filter((q) => q.f === '#fafaf9' && q.h === 320 && q.dash);
console.log('     solidne: ' + solid.length + '  przerywane: ' + dashed.length);
ok('dolne rysowane pełną linią', solid.length === 2, String(solid.length));
ok('górne przerywaną', dashed.length === 2, String(dashed.length));
tx = await svgTexts();
ok('nazwa ciągu górnego z wysokością', tx.some((t) => /Górne — 1450 nad podłogą/.test(t)), tx.join(' | '));
ok('nazwa ciągu dolnego bez wysokości', tx.includes('Dolne'), tx.join(' | '));
const xT = await page.evaluate(() => [...document.querySelectorAll('svg text')].map((t) => +t.getAttribute('x')));
const vb2 = await vbox();
ok('etykiety ciągów mieszczą się w kadrze', Math.max(...xT) < vb2[0] + vb2[2], `${Math.max(...xT)} < ${vb2[0] + vb2[2]}`);

console.log('\n== widok z tyłu: lustrzane odbicie ==');
await pick('Z tyłu');
r = await mmRects();
const t800 = r.filter((q) => q.w === 800 && (q.h === 720 || q.h === 600) && q.f === '#fafaf9');
console.log('     ' + JSON.stringify(t800.map((q) => q.x)));
// od tylu szafka 800 stojaca z lewej ma byc z prawej: 1400-0-800 = 600
ok('szafka 800 przeszła na prawo', t800.every((q) => q.x === 600), JSON.stringify(t800.map((q) => q.x)));

console.log('\n== 3D zabudowy rysuje obie kondygnacje ==');
await pick('3D');
const poly = await page.evaluate(() => document.querySelectorAll('svg polygon').length);
console.log('     wielokątów: ' + poly);
ok('bryła się narysowała', poly > 50, String(poly));
ok('jest przełącznik otwarte/zamknięte',
  await page.getByRole('button', { name: /^(otwarte|zamknięte)$/ }).count() === 1);
/* Sama liczba wielokatow nie zmienia sie przy otwarciu (te same bryly, tylko
   obrocone), wiec mierzymy obrys: otwarte fronty musza wyjsc poza korpus. */
const szer = () => page.evaluate(() => {
  const vb = document.querySelector('svg').getAttribute('viewBox').split(' ').map(Number);
  return Math.round(vb[2]);
});
const przed = await szer();
await page.getByRole('button', { name: /^(otwarte|zamknięte)$/ }).click();
await page.waitForTimeout(900);
const poly2 = await page.evaluate(() => document.querySelectorAll('svg polygon').length);
const po = await szer();
console.log('     wielokąty ' + poly + ' → ' + poly2 + ', szerokość obrysu ' + przed + ' → ' + po);
ok('otwarte fronty rozszerzają obrys bryły', po > przed, `${przed} → ${po}`);
ok('bryła nie gubi ścianek przy otwarciu', poly2 === poly, `${poly} → ${poly2}`);
ok('po otwarciu jest suwak kąta', await page.locator('input[type=range]').count() === 1);

console.log('\n== zakres wraca na szafkę, gdy ciąg znika ==');
await pick('Zabudowa');
await pick('Zamk.');
await seed([], [{ cab: { name: 'A', W: 600, H: 720, D: 500, plinth: NO }, runId: null }]);
rows = await segRows();
ok('bez ciągów znowu jeden wiersz', rows.length === 1, String(rows.length));
ok('rysunek to pojedyncza szafka', (await svgTexts()).some((t) => t === '600'), (await svgTexts()).join(' | '));
ok('bez błędów', errors.length === 0, errors.join('; '));

console.log('\nBLEDY:', errors.length ? errors.join('\n') : '(brak)');
await browser.close();
