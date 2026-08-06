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
const view = async (v) => { await page.getByText(v, { exact: true }).first().click(); await page.waitForTimeout(900); };
const svgTexts = () => page.evaluate(() => [...document.querySelectorAll('svg text')].map((t) => ({
  t: t.textContent.trim(), x: Math.round(+t.getAttribute('x')), y: Math.round(+t.getAttribute('y')), f: t.getAttribute('fill'),
})));
const rects = () => page.evaluate(() => [...document.querySelectorAll('svg rect')].map((r) => ({
  x: Math.round(+r.getAttribute('x')), y: Math.round(+r.getAttribute('y')),
  w: Math.round(+r.getAttribute('width')), h: Math.round(+r.getAttribute('height')),
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

const seed = async (cabs, run = {}) => {
  await page.evaluate(({ cs, r }) => {
    localStorage.clear();
    localStorage.setItem('szafki:projekt', JSON.stringify({
      name: 'T', active: 0, prices: {},
      runs: r === null ? [] : [Object.assign({ id: 'c1', name: 'Ściana 1', wallW: null, gap: 0,
        H: 720, D: 500, plinth: { on: true, height: 100, mode: 'under', setback: 0 } }, r)],
      items: cs.map((c) => ({ cab: c, mat: undefined, runId: c.__free ? null : 'c1' })),
    }));
  }, { cs: cabs, r: run });
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(2200);
};
const K = (name, patch = {}) => Object.assign({ name, W: 600, H: 720, D: 500,
  plinth: { on: true, height: 100, mode: 'under', setback: 0 } }, patch);

console.log('== widok „Ciąg" pojawia się tylko przy ciągu ==');
await seed([K('A')], null);
ok('bez ciągu nie ma zakładki', await page.getByText('Ciąg', { exact: true }).count() === 0);
await seed([K('A'), K('B'), K('C')]);
ok('w ciągu zakładka jest', await page.getByText('Ciąg', { exact: true }).count() === 1);

console.log('\n== elewacja rysuje wszystkie szafki obok siebie ==');
await view('Ciąg');
let r = await mmRects();
// korpusy: tlo szafki ma jej pelna szerokosc i wysokosc
const korp = r.filter((q) => q.w === 600 && q.h === 720 && q.f === '#fafaf9');
console.log('     korpusy: ' + JSON.stringify(korp.map((q) => q.x)));
ok('trzy korpusy', korp.length === 3, String(korp.length));
ok('ustawione po kolei 0/600/1200', korp.map((q) => q.x).sort((a, b) => a - b).join() === '0,600,1200',
  korp.map((q) => q.x).join());
ok('wszystkie na tej samej wysokości', new Set(korp.map((q) => q.y)).size === 1, JSON.stringify(korp.map((q) => q.y)));

console.log('\n== cokół to jeden pas przez cały ciąg ==');
const cok = r.filter((q) => q.h === 100 && q.w > 1000);
console.log('     ' + JSON.stringify(cok));
ok('jeden pas cokołu na 1800', cok.length === 1 && cok[0].w === 1800 && cok[0].x === 0, JSON.stringify(cok));
ok('cokół pod korpusami', cok.length === 1 && cok[0].y === korp[0].y + 720, JSON.stringify(cok));

console.log('\n== wymiary ciągu ==');
let tx = await svgTexts();
console.log('     ' + tx.map((t) => t.t).join(' | '));
ok('szerokość każdej szafki', tx.filter((t) => t.t === '600').length === 3, String(tx.filter((t) => t.t === '600').length));
ok('suma ciągu', tx.some((t) => t.t === '1800 ciąg'), tx.map((t) => t.t).join(' | '));
ok('wysokość całkowita 820', tx.some((t) => t.t === '820'), tx.map((t) => t.t).join(' | '));
ok('wysokość cokołu', tx.some((t) => t.t === '100'), tx.map((t) => t.t).join(' | '));
ok('nazwy szafek na rysunku', ['A', 'B', 'C'].every((n) => tx.some((t) => t.t === n)), tx.map((t) => t.t).join(' | '));

console.log('\n== ściana pokazana i oznaczona, gdy za krótka ==');
await seed([K('A'), K('B'), K('C')], { wallW: 2000 });
await view('Ciąg');
tx = await svgTexts();
let sc = tx.find((t) => /ściana/.test(t.t));
console.log('     ' + JSON.stringify(sc));
ok('wymiar ściany 2000', !!sc && sc.t === '2000 ściana', JSON.stringify(sc));
ok('ściana dłuższa niż ciąg rysowana normalnie', !!sc && sc.f === '#0369a1', JSON.stringify(sc));
await seed([K('A'), K('B'), K('C')], { wallW: 1500 });
await view('Ciąg');
tx = await svgTexts();
sc = tx.find((t) => /ściana/.test(t.t));
console.log('     ' + JSON.stringify(sc));
ok('za krótka ściana na czerwono', !!sc && sc.f === '#b91c1c', JSON.stringify(sc));

console.log('\n== luz między korpusami widać i jest zwymiarowany ==');
await seed([K('A'), K('B'), K('C')], { gap: 5 });
await view('Ciąg');
r = await mmRects();
const k2 = r.filter((q) => q.w === 600 && q.h === 720 && q.f === '#fafaf9').map((q) => q.x).sort((a, b) => a - b);
console.log('     korpusy: ' + JSON.stringify(k2));
ok('szafki rozsunięte o luz', k2.join() === '0,605,1210', k2.join());
tx = await svgTexts();
ok('luz zwymiarowany dwa razy', tx.filter((t) => t.t === '5').length === 2,
  String(tx.filter((t) => t.t === '5').length));
ok('suma z luzami 1810', tx.some((t) => t.t === '1810 ciąg'), tx.map((t) => t.t).join(' | '));

console.log('\n== szew cokołu narysowany w miejscu cięcia ==');
await seed([800, 800, 800, 800, 800].map((w, i) => K('S' + i, { W: w })));
await view('Ciąg');
const linie = await page.evaluate(() => [...document.querySelectorAll('svg line')]
  .filter((l) => l.getAttribute('stroke-width') === '3')
  .map((l) => Math.round(+l.getAttribute('x1'))));
console.log('     szwy: ' + JSON.stringify(linie));
ok('jeden szew na styku 2400', linie.length === 1 && linie[0] === 2400, JSON.stringify(linie));

console.log('\n== linie frontów ciągną się przez cały ciąg ==');
await seed([K('A'), K('B'), K('C')]);
await view('Ciąg');
const prowad = await page.evaluate(() => [...document.querySelectorAll('svg line')]
  .filter((l) => (l.getAttribute('stroke-dasharray') || '') === '10 8')
  .map((l) => ({ x1: Math.round(+l.getAttribute('x1')), x2: Math.round(+l.getAttribute('x2')) })));
console.log('     linii frontów: ' + prowad.length + ' ' + JSON.stringify(prowad[0]));
ok('linie frontów są', prowad.length > 0, String(prowad.length));
ok('ciągną się przez cały ciąg', prowad.every((l) => l.x1 < 0 && l.x2 > 1800), JSON.stringify(prowad.slice(0, 2)));
const rowne = prowad.length;
// szafka z innym podzialem frontow dokłada linie — widac rozjazd
await seed([K('A'), K('B', { H: 900 }), K('C')]);
await view('Ciąg');
const prowad2 = await page.evaluate(() => [...document.querySelectorAll('svg line')]
  .filter((l) => (l.getAttribute('stroke-dasharray') || '') === '10 8').length);
console.log('     linii po rozjeździe: ' + prowad2);
ok('rozjazd frontów dokłada linie', prowad2 > rowne, `${rowne} → ${prowad2}`);

console.log('\n== różne wysokości: wszystko stoi na podłodze ==');
r = await mmRects();
const k3 = r.filter((q) => q.w === 600 && (q.h === 720 || q.h === 900) && q.f === '#fafaf9');
console.log('     ' + JSON.stringify(k3.map((q) => ({ h: q.h, dol: q.y + q.h }))));
ok('spody korpusów w jednej linii', new Set(k3.map((q) => q.y + q.h)).size === 1,
  JSON.stringify(k3.map((q) => q.y + q.h)));

console.log('\n== przejście na szafkę wolnostojącą wraca na widok zamknięty ==');
await seed([K('A'), Object.assign(K('W'), { __free: true })]);
await view('Ciąg');
ok('jesteśmy na widoku ciągu', (await svgTexts()).some((t) => /ciąg/.test(t.t)));
await page.locator('header div.rounded-full').filter({ hasText: 'W' })
  .getByRole('button', { name: 'W', exact: true }).click();
await page.waitForTimeout(1200);
ok('widok wrócił na zamknięty', !(await svgTexts()).some((t) => /ciąg/.test(t.t)),
  (await svgTexts()).map((t) => t.t).slice(0, 6).join(' | '));
ok('zakładka Ciąg zniknęła', await page.getByText('Ciąg', { exact: true }).count() === 0);
ok('bez błędów', errors.length === 0, errors.join('; '));

await seed([K('A'), K('B'), K('C')], { gap: 3, wallW: 2000 });
await view('Ciąg');
await page.locator('svg').first().screenshot({ path: S + 'shot-ciag5.png' });
console.log('\nBLEDY:', errors.length ? errors.join('\n') : '(brak)');
await browser.close();
