/* Gorna szafka narozna w L (szablon „Górna narożna L”, 2026-09-29). Pilnuje:
   - szablon w gornym ciagu staje przy rogu (na koncu albo na poczatku ciagu,
     zaleznie od tego, z ktorej strony jest rog) i zaklada gorny ciag drugiej
     sciany, gdy go nie ma,
   - para gornych ciagow dostaje narożnik jak dolna: ramie, odsuniecie sasiada
     o glebokosc i ramie; w rog wjezdza ciag, w ktorym stoi szafka w L,
   - gorny ciag konczacy sie w rogu dosuwa sie do niego (uwaga),
   - bez kolizji otwierania i bez „wystaje poza dolny” nad ramieniem dolnej,
   - formatki ramienia z wiencem, dwie zawieszki,
   - szablon tylko w gornym ciagu, „Narożnik L” tylko w dolnym. */
import pw from './pw.mjs';
const URL = process.env.STD ? 'http://127.0.0.1:5199/standalone-local.html'
  : 'http://127.0.0.1:5205/mebloprojekt-app.html';
const ok = (l, c, e = '') => console.log((c ? '  OK   ' : '  BLAD ') + l + (e ? ' — ' + e : ''));
const b = await pw.chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const page = await (await b.newContext({ viewport: { width: 1500, height: 1300 } })).newPage();
const errors = []; page.on('pageerror', (e) => errors.push(e.message));
await page.goto(URL, { waitUntil: 'networkidle' });

const PL = { on: true, height: 100, mode: 'under', setback: 0 };
const dol = (name, W, runId, o = {}) => ({ cab: { name, W, H: 720, D: 560, plinth: PL, legs: { on: true, height: 100 },
  levels: [{ h: null, cols: [{ kind: 'doors', doors: 1, w: null }] }], ...o }, runId, offset: 0 });
const gor = (name, W, runId) => ({ cab: { name, W, H: 720, D: 300, plinth: { ...PL, on: false }, legs: { on: false }, hangerMode: 'listwa',
  levels: [{ h: null, cols: [{ kind: 'doors', doors: 1, w: null }] }] }, runId, offset: 0 });
const RUN = (id, name, o = {}) => ({ id, name, wallW: null, gap: 0, mountY: 0, H: 720, D: 560, plinth: PL, worktop: true, corner: null, ...o });
const GORNY = (id, wall, name) => RUN(id, name, { tier: 'gorny', wall, D: 300, H: 720, mountY: 1358, worktop: false, plinth: null });
// dolny rog: szafka w L na koncu sciany 1 (sciana 1 wjezdza w rog)
const DOLNE = [dol('D1', 600, 'c1'), dol('L', 900, 'c1', { corner: { on: true, arm: 640, doors: 'wsporniki' } }), dol('D4', 600, 'c2')];
const seed = async (runs, items, active = 0) => {
  await page.evaluate((p) => { localStorage.clear(); localStorage.setItem('szafki:projekt', JSON.stringify(p)); },
    { name: 'GL', active, prices: {}, runs, items });
  await page.reload({ waitUntil: 'networkidle' }); await page.waitForTimeout(900);
};
const projekt = () => page.evaluate(() => JSON.parse(localStorage.getItem('szafki:projekt')));
const uwagi = async () => {
  const c = page.locator('section').filter({ has: page.locator('h2', { hasText: /^Uwagi/ }) }).first();
  return (await c.count()) ? (await c.innerText()).split('\n').filter((l) => l.length > 20) : [];
};
const tabela = (re) => page.evaluate((src) => {
  const re = new RegExp(src);
  const sec = [...document.querySelectorAll('section')].find((s) => re.test((s.querySelector('h2') || {}).textContent || ''));
  return sec ? [...sec.querySelectorAll('tbody tr')].map((tr) => [...tr.children].map((x) => x.textContent.trim())) : [];
}, re.source);
const szablon = async (nr, id) => {
  await page.locator('select[title="Dodaj szafkę z gotowego szablonu"]').nth(nr).selectOption(id);
  await page.waitForTimeout(1200);
};
const opcje = (nr) => page.locator('select[title="Dodaj szafkę z gotowego szablonu"]').nth(nr)
  .evaluate((s) => [...s.options].map((o) => o.value).filter(Boolean));
// plan wiercen z PDF: kartka szafki nr (1..n) — tabela „Otwory pod” i formatki
const wiercenia = async (nr) => {
  await page.evaluate((nr) => { window.__rep = null; window.print = () => {
    const tabele = [...document.querySelectorAll('.print-only .rp-page')]
      .filter((s) => (s.querySelector('span')?.textContent || '').includes(`(${nr} z `))
      .flatMap((s) => [...s.querySelectorAll('table')]);
    const t = tabele.find((x) => /Otwory pod/.test(x.querySelector('thead')?.textContent || ''));
    window.__rep = t ? [...t.querySelectorAll('tbody tr')].map((tr) => [...tr.children].map((x) => x.textContent.trim())) : [];
  }; }, nr);
  await page.getByRole('button', { name: 'Zestawienie PDF', exact: true }).first().click();
  await page.waitForTimeout(1000);
  let panel = '';
  return ((await page.evaluate(() => window.__rep)) || []).map((r) => { if (r[0]) panel = r[0]; return { panel, kind: r[1], note: r[3] }; });
};
const zawieszkiW = (plan) => plan.filter((r) => r.kind === 'zawieszka').map((r) => r.panel);
const okuciaT = () => tabela(/^Produkty do zamówienia/);
const listwy = (h) => h.filter((r) => /^Listwa montażowa/.test(r[0])).map((r) => r[1]);
const kolizje = (u) => u.filter((l) => /nie ma się jak otworzyć|nie otworzy się|nie wysunie się/.test(l) && /„G/.test(l));

console.log('== szablon w górnym ciągu ściany 1 (róg na jego końcu) ==');
await seed([RUN('c1', 'Ściana 1'), RUN('c2', 'Ściana 2', { corner: { of: 'c1', at: 'end', owner: 'of', clear: 0 } }),
  GORNY('c3', 'c1', 'Ściana 1')], [...DOLNE, gor('G1', 600, 'c3')]);
const o0 = await opcje(0), o2 = await opcje(2);
ok('„Górna narożna L” tylko w górnym ciągu', o2.includes('naroznikLgorny') && !o0.includes('naroznikLgorny'), `dolny: ${o0} / górny: ${o2}`);
ok('„Narożnik L” tylko w dolnym ciągu', o0.includes('naroznikL') && !o2.includes('naroznikL'), `dolny: ${o0} / górny: ${o2}`);
await szablon(2, 'naroznikLgorny');
let p = await projekt();
const wC3 = p.items.filter((it) => it.runId === 'c3');
const nowa = p.items[p.active];
ok('nowa szafka: 650 × 720 × 300, ramię 350, bez nóżek', nowa && nowa.cab.W === 650 && nowa.cab.D === 300 && nowa.cab.corner.on
  && nowa.cab.corner.arm === 350 && !(nowa.cab.legs || {}).on && !(nowa.cab.plinth || {}).on, JSON.stringify(nowa && nowa.cab).slice(0, 200));
ok('stoi na końcu ciągu, przy rogu', wC3.length === 2 && wC3[1].cab.W === 650, wC3.map((it) => it.cab.name).join(','));
const g2 = p.runs.find((r) => r.tier === 'gorny' && r.wall === 'c2');
ok('założony górny ciąg drugiej ściany (na nim leży ramię)', !!g2 && g2.D === 300 && g2.mountY > 0, JSON.stringify(g2 || null));
let u = await uwagi();
ok('uwaga: górny ciąg dosunięty do rogu o 250 mm (1500 dolnego − 1250 górnego)', u.some((l) => /Górny ciąg „Ściana 1" jest dosunięty do rogu o 250 mm/.test(l)),
  u.filter((l) => /dosunięty/.test(l)).join(' | ') || '(brak)');
ok('ramię przy ścianie 2: „ramię 350 × 300”', u.some((l) => /jest szafką narożną w L: korpus 650 mm przy ścianie „Ściana 1" plus ramię 350 × 300 mm przy ścianie „Ściana 2"/.test(l)),
  u.filter((l) => /narożną w L/.test(l)).map((l) => l.slice(0, 160)).join(' | '));
ok('bez kolizji otwierania szafek górnych', !kolizje(u).length, kolizje(u).join(' / '));
ok('bez „Ciąg górny wystaje poza dolny”', !u.some((l) => /wystaje poza dolny/.test(l)), u.filter((l) => /wystaje/.test(l)).join(' | '));
const f = await tabela(/^Formatki do zamówienia/);
const fn = f.map((r) => r[0]);
ok('formatki: wieniec i dno ramienia ×2, bok ramienia, kątownik przy ramieniu',
  f.some((r) => r[0] === 'Wieniec i dno ramienia' && r[4] === '2') && fn.includes('Bok ramienia') && fn.some((n) => /^Kątownik przy ramieniu/.test(n)), fn.join(', '));
ok('bez wzmocnień ramienia (jest wieniec) i bez cokołu ramienia', !fn.some((n) => /Wzmocnienie ramienia|Cokół ramienia/.test(n)), fn.join(', '));
const h = await tabela(/^Produkty do zamówienia/);
const zaw = h.find((r) => /^Zawieszka/.test(r[0]));
ok('dwie zawieszki', !!zaw && /^2 szt/.test(zaw[zaw.length - 1]), zaw ? zaw.join(' | ') : '(brak)');
ok('bez nóżek pod ramieniem', !h.some((r) => /^Nóżka/.test(r[0])), h.map((r) => r[0]).join(', '));

console.log('\n== szablon w górnym ciągu ściany 2 (róg na jego początku) ==');
await seed([RUN('c1', 'Ściana 1'), RUN('c2', 'Ściana 2', { corner: { of: 'c1', at: 'end', owner: 'of', clear: 0 } }),
  GORNY('c3', 'c1', 'Ściana 1'), GORNY('c4', 'c2', 'Ściana 2')], [...DOLNE, gor('G1', 600, 'c3'), gor('G4', 600, 'c4')]);
await szablon(3, 'naroznikLgorny');
p = await projekt();
const wC4 = p.items.filter((it) => it.runId === 'c4');
ok('stoi na początku ciągu, przy rogu', wC4.length === 2 && wC4[0].cab.W === 650 && wC4[1].cab.name === 'G4', wC4.map((it) => it.cab.name).join(','));
ok('nie zakłada drugiego górnego ciągu', p.runs.filter((r) => r.tier === 'gorny').length === 2, p.runs.map((r) => r.id).join(','));
u = await uwagi();
ok('w górny róg wjeżdża ściana 2 (tam wisi szafka w L), ściana 1 zaczyna się 653 mm od rogu',
  u.some((l) => /W róg wjeżdża „Ściana 2", więc ciąg „Ściana 1" zaczyna się 653 mm od rogu/.test(l)), u.filter((l) => /^Narożnik/.test(l)).join(' | '));
ok('ramię przy ścianie 1', u.some((l) => /korpus 650 mm przy ścianie „Ściana 2" plus ramię 350 × 300 mm przy ścianie „Ściana 1"/.test(l)),
  u.filter((l) => /narożną w L/.test(l)).map((l) => l.slice(0, 160)).join(' | '));
ok('bez kolizji otwierania szafek górnych', !kolizje(u).length, kolizje(u).join(' / '));
ok('bez „Ciąg górny wystaje poza dolny” (nad ramieniem dolnej szafki w L)', !u.some((l) => /wystaje poza dolny/.test(l)), u.filter((l) => /wystaje/.test(l)).join(' | '));

console.log('\n== zawieszki i listwa: zwykła górna, szafka w L (A), B w części ramienia / szafki, hak ==');
const GL = (post, o = {}) => ({ cab: { name: 'GL', W: 650, H: 720, D: 300, plinth: { ...PL, on: false }, legs: { on: false }, hangerMode: 'listwa',
  corner: { on: true, arm: 350, doors: 'wsporniki', ...(post ? { post } : {}), ...o },
  levels: [{ h: null, cols: [{ kind: 'doors', doors: 1, w: null, shelfTargets: [null, null] }] }] }, runId: 'c3', offset: 0 });
const RUNY4 = [RUN('c1', 'Ściana 1'), RUN('c2', 'Ściana 2', { corner: { of: 'c1', at: 'end', owner: 'of', clear: 0 } }),
  GORNY('c3', 'c1', 'Ściana 1'), GORNY('c4', 'c2', 'Ściana 2')];
// kolejnosc: D1, L, D4, G1, GL, G4 — GL to 5. szafka
await seed(RUNY4, [...DOLNE, gor('G1', 600, 'c3'), GL(null), gor('G4', 600, 'c4')], 4);
let plan = await wiercenia(4);
ok('zwykła górna: zawieszki w obu bokach', ['Bok lewy', 'Bok prawy'].every((n) => zawieszkiW(plan).includes(n)), zawieszkiW(plan).join(', '));
plan = await wiercenia(5);
ok('szafka w L, wzmocnienie A: zawieszki w boku korpusu i w boku ramienia', zawieszkiW(plan).length === 2
  && zawieszkiW(plan).includes('Bok lewy') && zawieszkiW(plan).includes('Bok ramienia'), zawieszkiW(plan).join(', '));
let hw = await okuciaT();
// listwa pod korpusem w ciagu to wspolna listwa ciagu — na karcie szafki jest tylko odcinek pod ramieniem
ok('A: odcinek listwy pod ramieniem 310 mm (przy drugiej ścianie)', listwy(hw).length === 1 && /ramię.*310 mm/.test(listwy(hw)[0]), listwy(hw).join(' | '));
ok('A: dwie zawieszki', hw.some((r) => /^Zawieszka/.test(r[0]) && /^2 szt/.test(r[r.length - 1])), hw.filter((r) => /^Zawieszka/.test(r[0])).map((r) => r.join(' ')).join(''));

await seed(RUNY4, [...DOLNE, gor('G1', 600, 'c3'), GL({ on: true, w: 150, typ: 'B' }), gor('G4', 600, 'c4')], 4);
const fB = (await tabela(/^Formatki do zamówienia/)).map((r) => r[0]);
ok('B: półka z wyciętym tylnym rogiem (w nazwie formatki)', fB.some((n) => /^Półka — wycięty tylny róg \d+ × \d+$/.test(n)), fB.join(', '));
plan = await wiercenia(5);
ok('B w części ramienia (domyślnie): płyta wzmocnienia przy plecach i bok ramienia', zawieszkiW(plan).length === 2
  && zawieszkiW(plan).includes('Kątownik przy ramieniu — plecy') && zawieszkiW(plan).includes('Bok ramienia'), zawieszkiW(plan).join(', '));
ok('B: kołki półki w płytach wzmocnienia', plan.some((r) => /^Kątownik przy ramieniu — bok$/.test(r.panel) && r.kind === 'kołek półki')
  && plan.some((r) => /^Kątownik przy ramieniu — plecy$/.test(r.panel) && r.kind === 'kołek półki'), [...new Set(plan.map((r) => r.panel + '|' + r.kind))].join(' / '));
hw = await okuciaT();
ok('B w części ramienia: listwa przy ścianie ramienia od płyty wzmocnienia do boku ramienia', listwy(hw).length === 1 && /ramię.*odcinek (\d+)/.test(listwy(hw)[0]) && Number(/odcinek (\d+)/.exec(listwy(hw)[0])[1]) > 400, listwy(hw).join(' | '));
// przelacznik „W części szafki” w karcie szafki narożnej
await page.getByRole('button', { name: 'W części szafki', exact: true }).first().click(); await page.waitForTimeout(900);
plan = await wiercenia(5);
ok('B w części szafki: bok korpusu i płyta wzmocnienia równoległa do boku', zawieszkiW(plan).length === 2
  && zawieszkiW(plan).includes('Bok lewy') && zawieszkiW(plan).includes('Kątownik przy ramieniu — bok'), zawieszkiW(plan).join(', '));
hw = await okuciaT();
ok('B w części szafki: bez odcinka listwy pod ramieniem', listwy(hw).length === 0, listwy(hw).join(' | '));

await seed(RUNY4, [...DOLNE, gor('G1', 600, 'c3'), GL(null, { armHanger: 'hak' }), gor('G4', 600, 'c4')], 4);
hw = await okuciaT();
ok('hak pod zawieszką ramienia zamiast listwy', hw.some((r) => /^Hak/.test(r[0]) && /^1 szt/.test(r[r.length - 1])) && listwy(hw).length === 0, hw.map((r) => r[0]).join(', '));
// przelacznik A/B w karcie
await page.getByRole('button', { name: 'B — kąt do środka', exact: true }).first().click(); await page.waitForTimeout(900);
p = await projekt();
ok('przełącznik „B — kąt do środka” zapisuje wariant B', ((p.items[4].cab.corner || {}).post || {}).typ === 'B', JSON.stringify((p.items[4].cab.corner || {}).post));

console.log('\n== górny ślepy róg bez szafki w L: po staremu ==');
await seed([RUN('c1', 'Ściana 1'), RUN('c2', 'Ściana 2', { corner: { of: 'c1', at: 'end', owner: 'of', clear: 0 } }),
  GORNY('c3', 'c1', 'Ściana 1'), GORNY('c4', 'c2', 'Ściana 2')],
  [dol('D1', 600, 'c1'), dol('D2', 900, 'c1'), dol('D4', 600, 'c2'), gor('G1', 900, 'c3'), gor('G2', 600, 'c3'), gor('G4', 600, 'c4')], 3);
u = await uwagi();
ok('bez narożnika górnych (nie ma w nim szafki w L)', !u.some((l) => /^Narożnik: ciąg „Ściana 2" stoi pod kątem prostym do „Ściana 1" .*„Ściana 1", więc ciąg „Ściana 2" zaczyna się 3\d\d mm/.test(l))
  && !u.some((l) => /dosunięty do rogu/.test(l)), u.filter((l) => /Narożnik|dosunięty/.test(l)).join(' | '));

console.log('\nBLEDY:', errors.length ? errors.join('; ') : '(brak)');
await b.close();
