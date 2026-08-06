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
const stan = () => page.evaluate(() => JSON.parse(localStorage.getItem('szafki:projekt') || '{}'));

/* Odcisk rysunku: ile czego jest na obrazku. Porownujemy pojedyncza szafke
   z ta sama szafka w ciagu — w ciagu nie moze brakowac zadnego elementu. */
const fingerprint = () => page.evaluate(() => {
  const svg = document.querySelector('svg');
  const n = (sel) => svg.querySelectorAll(sel).length;
  const rects = [...svg.querySelectorAll('rect')];
  return {
    rect: rects.length,
    line: n('line'),
    path: n('path'),
    circle: n('circle'),
    // uchwyty: prostokaty rx=5 w ciemnym szarym
    uchwyty: rects.filter((r) => r.getAttribute('fill') === '#52525b').length,
    // zawiasy: puszki rx=3 w szarym
    zawiasy: rects.filter((r) => r.getAttribute('fill') === '#71717a').length,
    // kolki podporowe
    kolki: n('circle'),
    // symbole otwierania drzwi
    symbole: [...svg.querySelectorAll('path')].filter((p) => (p.getAttribute('d') || '').startsWith('M ')).length,
    // obrysy skrzydel po zamknieciu
    obrysy: rects.filter((r) => (r.getAttribute('stroke-dasharray') || '') === '12 9').length,
  };
});

const PL = { on: true, height: 100, mode: 'under', setback: 0 };
const NO = { on: false, height: 100, mode: 'under', setback: 0 };
const LEGS = { on: true, height: 100, color: '#3f3f46', shape: 'box' };
// jedna szafka: drzwi + szuflady + polki + nozki + uchwyty — zeby bylo co porownywac
const CAB = (name) => ({
  name, W: 800, H: 720, D: 500, plinth: NO, legs: LEGS,
  levels: [{ h: null, cols: [
    { kind: 'doors', doors: 2, w: 400 },
    { kind: 'drawers', w: null, drawers: [{}, {}] },
  ] }],
});
const seed = async (runs, items) => {
  await page.evaluate(({ rs, its }) => {
    localStorage.clear();
    localStorage.setItem('szafki:projekt', JSON.stringify({ name: 'T', active: 0, prices: {}, runs: rs, items: its }));
  }, { rs: runs, its: items });
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(2400);
};
await page.goto(URL, { waitUntil: 'networkidle' });

for (const wariant of ['Zamk.', 'Otw.']) {
  console.log(`\n== parytet rysunku: ${wariant} ==`);
  // ta sama szafka raz wolnostojaca, raz jako jedyna w ciagu
  await seed([], [{ cab: CAB('A'), runId: null }]);
  await pick(wariant);
  const sam = await fingerprint();
  console.log('     szafka: ' + JSON.stringify(sam));
  await seed([{ id: 'c1', name: 'S', wallW: null, gap: 0, mountY: 0, H: 720, D: 500, plinth: NO, hangerMode: 'listwa' }],
    [{ cab: CAB('A'), runId: 'c1' }]);
  await pick('Ciąg');
  await pick(wariant);
  const wCiagu = await fingerprint();
  console.log('     ciąg:   ' + JSON.stringify(wCiagu));
  ok(`${wariant}: uchwyty`, wCiagu.uchwyty === sam.uchwyty, `${sam.uchwyty} vs ${wCiagu.uchwyty}`);
  ok(`${wariant}: zawiasy`, wCiagu.zawiasy === sam.zawiasy, `${sam.zawiasy} vs ${wCiagu.zawiasy}`);
  ok(`${wariant}: kołki pod półki`, wCiagu.kolki === sam.kolki, `${sam.kolki} vs ${wCiagu.kolki}`);
  ok(`${wariant}: symbole otwierania`, wCiagu.symbole === sam.symbole, `${sam.symbole} vs ${wCiagu.symbole}`);
  ok(`${wariant}: obrysy skrzydeł`, wCiagu.obrysy === sam.obrysy, `${sam.obrysy} vs ${wCiagu.obrysy}`);
  // rysunek ciagu ma wiecej linii (wymiary ciagu), ale nie mniej niz pojedynczy korpus
  ok(`${wariant}: nic nie zginęło z prostokątów`, wCiagu.rect >= sam.rect - 4,
    `${sam.rect} vs ${wCiagu.rect}`);
}

console.log('\n== nóżki widać w ciągu ==');
await seed([{ id: 'c1', name: 'S', wallW: null, gap: 0, mountY: 0, H: 720, D: 500, plinth: NO, hangerMode: 'listwa' }],
  [{ cab: CAB('A'), runId: 'c1' }, { cab: CAB('B'), runId: 'c1' }]);
await pick('Ciąg');
await pick('Zamk.');
/* Szafki stoja na miejscu przez transform, wiec surowy atrybut x jest lokalny —
   pozycje trzeba czytac z realnego polozenia na ekranie. */
const nozki = await page.evaluate(() => [...document.querySelectorAll('svg rect')]
  .filter((r) => r.getAttribute('fill') === '#3f3f46')
  .map((r) => ({ x: Math.round(r.getBoundingClientRect().x), w: Math.round(+r.getAttribute('width')) })));
console.log('     ' + JSON.stringify(nozki));
ok('cztery nóżki (po dwie na szafkę)', nozki.length === 4, String(nozki.length));
const xs = [...new Set(nozki.map((q) => q.x))].sort((a, b) => a - b);
ok('nóżki na czterech różnych pozycjach', xs.length === 4, JSON.stringify(xs));

console.log('\n== nowa szafka w stojącym ciągu dostaje nóżki ==');
await seed([{ id: 'c1', name: 'S', wallW: null, gap: 0, mountY: 0, H: 720, D: 500, plinth: NO, hangerMode: 'listwa' }],
  [{ cab: { name: 'A', W: 600, H: 720, D: 500, plinth: NO, legs: LEGS }, runId: 'c1' }]);
await page.locator('header .space-y-1 > div').filter({ hasText: 'S' })
  .getByRole('button', { name: '+ szafka' }).first().click();
await page.waitForTimeout(1200);
let st = await stan();
console.log('     ' + JSON.stringify(st.items.map((it) => (it.cab.legs || {}).on)));
ok('dołożona szafka ma nóżki', st.items[st.items.length - 1].cab.legs.on === true,
  JSON.stringify(st.items.map((it) => (it.cab.legs || {}).on)));

console.log('\n== ciąg wiszący nie dostaje nóżek ==');
await seed([{ id: 'c1', name: 'G', wallW: null, gap: 0, mountY: 1450, H: 600, D: 320, plinth: NO, hangerMode: 'listwa' }],
  [{ cab: { name: 'g1', W: 600, H: 600, D: 320, plinth: NO }, runId: 'c1' }]);
await page.locator('header .space-y-1 > div').filter({ hasText: 'G' })
  .getByRole('button', { name: '+ szafka' }).first().click();
await page.waitForTimeout(1200);
st = await stan();
console.log('     ' + JSON.stringify(st.items.map((it) => (it.cab.legs || {}).on)));
ok('wisząca szafka bez nóżek', !st.items[st.items.length - 1].cab.legs.on,
  JSON.stringify(st.items.map((it) => (it.cab.legs || {}).on)));

console.log('\n== widok z tyłu pokazuje cokół i plecy ==');
await seed([{ id: 'c1', name: 'S', wallW: null, gap: 0, mountY: 0, H: 720, D: 500, plinth: PL, hangerMode: 'haczyki' }],
  [{ cab: { name: 'A', W: 800, H: 720, D: 500, plinth: PL }, runId: 'c1' },
   { cab: { name: 'B', W: 600, H: 720, D: 500, plinth: PL }, runId: 'c1' }]);
await pick('Ciąg');
await pick('Z tyłu');
let r = await page.evaluate(() => [...document.querySelectorAll('svg rect')].map((q) => ({
  x: Math.round(q.getBoundingClientRect().x), w: Math.round(+q.getAttribute('width')),
  h: Math.round(+q.getAttribute('height')), f: q.getAttribute('fill'),
})));
const cokol = r.filter((q) => q.h === 100 && q.w === 1400);
ok('cokół widać także od tyłu', cokol.length === 1, JSON.stringify(cokol));
const plecy = r.filter((q) => q.f === '#9c7b56');
console.log('     plecy: ' + JSON.stringify(plecy.map((q) => q.w)));
ok('plecy obu szafek', plecy.length === 2, String(plecy.length));
const dash = await page.evaluate(() => [...document.querySelectorAll('svg line')]
  .filter((l) => (l.getAttribute('stroke-dasharray') || '') === '10 8').length);
ok('brak linii frontów od tyłu', dash === 0, String(dash));

console.log('\n== lustro od tyłu: pierwsza szafka po prawej ==');
// tlo korpusu ma pelna szerokosc szafki — po nim poznajemy, gdzie ktora stoi
const korp = r.filter((q) => q.f === '#fafaf9' && (q.w === 800 || q.w === 600));
console.log('     ' + JSON.stringify(korp.map((q) => ({ w: q.w, x: q.x }))));
const x800 = (korp.find((q) => q.w === 800) || {}).x;
const x600 = (korp.find((q) => q.w === 600) || {}).x;
ok('szafka 800 stoi na prawo od 600 (lustro)', x800 > x600, `800 @ ${x800}, 600 @ ${x600}`);

console.log('\n== wszystkie warianty bez błędów ==');
await seed([{ id: 'c1', name: 'S', wallW: 2000, gap: 3, mountY: 0, H: 720, D: 500, plinth: PL, hangerMode: 'haczyki' }],
  [{ cab: CAB('A'), runId: 'c1' }, { cab: CAB('B'), runId: 'c1' }]);
await pick('Ciąg');
for (const v of ['Zamk.', 'Otw.', 'Z góry', 'Z tyłu', '3D']) {
  const before = errors.length;
  await pick(v);
  const svg = await page.evaluate(() => document.querySelectorAll('svg').length);
  ok(`wariant ${v}`, errors.length === before && svg === 1, errors.slice(before).join('; '));
}
await pick('Zamk.');
/* Szafka na nozkach stoi NA nich — nozka nie moze przebijac linii podlogi.
   Pierwsza wersja elewacji stawiala korpus na 0 i nozki wychodzily pod spod. */
const podloga = await page.evaluate(() => {
  const svg = document.querySelector('svg');
  const linie = [...svg.querySelectorAll('line')]
    .filter((l) => l.getAttribute('stroke-width') === '2' && Math.abs(+l.getAttribute('y1') - +l.getAttribute('y2')) < 1);
  const y = Math.max(...linie.map((l) => l.getBoundingClientRect().y));
  const noz = [...svg.querySelectorAll('rect')].filter((r) => r.getAttribute('fill') === '#3f3f46')
    .map((r) => r.getBoundingClientRect());
  return { podloga: Math.round(y), spodNozek: noz.length ? Math.round(Math.max(...noz.map((b) => b.y + b.height))) : null };
});
console.log('     ' + JSON.stringify(podloga));
ok('nóżki nie przebijają linii podłogi',
  podloga.spodNozek !== null && podloga.spodNozek <= podloga.podloga + 2,
  JSON.stringify(podloga));
await page.locator('svg').first().screenshot({ path: S + 'shot-parytet.png' });

console.log('\nBLEDY:', errors.length ? errors.join('\n') : '(brak)');
await browser.close();
