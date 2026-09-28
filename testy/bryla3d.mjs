/* Bryla 3D zabudowy: czy na wierzchu widac to, co powinno. Malowanie scian po
   sredniej glebokosci przepuszczalo wzmocnienia i styk blatow przez wierzch
   blatu, a wnetrze ramienia przez jego maskownice — rysunek niby mial wszystko,
   ale nie w tej kolejnosci. Dlatego nie liczymy wielokatow, tylko pytamy
   przegladarke, co lezy na wierzchu w danym punkcie obrazu.

   Uklad jak w projekcie z kuchni w L: dwie szafki 600, narozna 900 z ramieniem
   1200, blat, cokol i nozki. */
import pw from './pw.mjs';
const URL = process.env.STD ? 'http://127.0.0.1:5199/standalone-local.html'
  : 'http://127.0.0.1:5205/mebloprojekt-app.html';
const b = await pw.chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const page = await (await b.newContext({ viewport: { width: 1500, height: 1300 } })).newPage();
const errors = []; page.on('pageerror', (e) => errors.push('[pageerror] ' + e.message));
const ok = (l, c, e = '') => console.log((c ? '  OK   ' : '  BLAD ') + l + (e ? ' — ' + e : ''));
const card = (re) => page.locator('section').filter({ has: page.locator('h2', { hasText: re }) }).first();
const pick = async (l) => { await page.getByText(l, { exact: true }).first().click(); await page.waitForTimeout(900); };

const PL = { on: true, height: 100, mode: 'under', setback: 0 };
const NOGI = { on: true, height: 100, color: '#3f3f46', shape: 'box' };
const CAB = (name, W, extra = {}) => ({ cab: Object.assign({ name, W, H: 720, D: 570,
  plinth: PL, legs: NOGI, levels: [{ h: null, cols: [{ kind: 'doors', doors: W > 600 ? 1 : 2, w: null }] }] },
  extra), runId: 'c1', offset: 0 });
const seed = async (items, runs) => {
  await page.evaluate(({ its, rs }) => {
    localStorage.clear();
    localStorage.setItem('szafki:projekt', JSON.stringify({ name: 'T', active: 0, prices: {}, runs: rs, items: its }));
  }, { its: items, rs: runs });
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(2400);
};
const RUNY = [
  { id: 'c1', name: 'A', wallW: null, gap: 0, mountY: 0, H: 720, D: 570, plinth: PL, worktop: true, corner: null },
  { id: 'c2', name: 'B', wallW: null, gap: 0, mountY: 0, H: 720, D: 600, plinth: PL, worktop: false,
    corner: { of: 'c1', at: 'end', owner: 'of', clear: 0 } },
];
await page.goto(URL, { waitUntil: 'networkidle' });
await seed([CAB('A1', 600), CAB('A2', 600),
  CAB('rogowa', 900, { corner: { on: true, arm: 1200, doors: 'wsporniki' } })], RUNY);

/* Punkty wewnatrz wielokata (siatka na jego czterech rogach, z dala od
   krawedzi) i to, co przegladarka widzi w nich na wierzchu. */
const naWierzchu = (tag, siatka) => page.evaluate(({ tag, siatka }) => {
  const svg = [...document.querySelectorAll('svg')].find((s) => s.querySelector('polygon[data-b]'));
  const m = svg.getScreenCTM();
  const pt = svg.createSVGPoint();
  const ekran = (x, y) => { pt.x = x; pt.y = y; const q = pt.matrixTransform(m); return [q.x, q.y]; };
  const pole = (ps) => Math.abs(ps.reduce((s, p, i) => {
    const q = ps[(i + 1) % ps.length]; return s + p.x * q.y - q.x * p.y; }, 0)) / 2;
  // dla kazdej bryly o tym znaczniku bierzemy najwieksza sciane — wierzch albo czolo
  const najw = new Map();
  svg.querySelectorAll(`polygon[data-el="${tag}"]`).forEach((p) => {
    const ps = [...p.points];
    const a = pole(ps);
    const k = p.dataset.b;
    if (!najw.has(k) || najw.get(k).a < a) najw.set(k, { p, ps, a });
  });
  const wynik = [];
  najw.forEach(({ ps }) => {
    if (ps.length !== 4) return;
    for (let i = 1; i < siatka; i++) for (let j = 1; j < siatka; j++) {
      const u = i / siatka, v = j / siatka;
      const x = (1 - u) * (1 - v) * ps[0].x + u * (1 - v) * ps[1].x + u * v * ps[2].x + (1 - u) * v * ps[3].x;
      const y = (1 - u) * (1 - v) * ps[0].y + u * (1 - v) * ps[1].y + u * v * ps[2].y + (1 - u) * v * ps[3].y;
      const [sx, sy] = ekran(x, y);
      const hit = document.elementFromPoint(sx, sy);
      wynik.push(hit && hit.dataset ? hit.dataset.el || '(inna bryla)' : '(nic)');
    }
  });
  return wynik;
}, { tag, siatka });
const bryly = (tag) => page.evaluate((tag) => new Set([...document.querySelectorAll(`polygon[data-el="${tag}"]`)]
  .map((p) => p.dataset.b)).size, tag);

console.log('== 45°: blat bez paskow, maskownice na wierzchu ==');
await page.locator('button', { hasText: /^rogowa/ }).first().click().catch(() => {});
await pick('Zabudowa');
await pick('45°');
const blat = await naWierzchu('blat', 6);
const obcy = blat.filter((t) => t !== 'blat');
console.log(`     punktów na blacie ${blat.length}, zasłoniętych ${obcy.length}`);
ok('wierzch blatu nie jest niczym przykryty', blat.length > 0 && obcy.length === 0,
  [...new Set(obcy)].join(', '));
/* Maskownice stoja w rogu pod katem prostym: doczolowa przylega do lica
   nachodzacej, wiec pod katem 45° czesc jednej chowa sie za druga — tak jest
   w rzeczywistosci. Zaslonic ja moze tylko druga maskownica, nigdy wnetrze. */
for (const tag of ['maska-korpus', 'maska-ramie']) {
  const w = await naWierzchu(tag, 4);
  const swoje = w.filter((t) => t === tag).length;
  const obce = w.filter((t) => !/^maska-/.test(t));
  ok(`${tag}: widać ją, nie zasłania jej wnętrze`, swoje > 0 && obce.length === 0,
    `${swoje}/${w.length} punktów na niej, zasłonięte przez: ${[...new Set(obce)].join(', ') || '—'}`);
}
/* Uchwyty sa male i stoja tuz przed duza plyta drzwi — przy malowaniu po
   sredniej glebokosci w kazdej szafce dwudrzwiowej jeden z nich znikal. */
const uchwyty = await naWierzchu('uchwyt', 2);
const ileUchwytow = await bryly('uchwyt');
console.log(`     uchwytów ${ileUchwytow}, widać na wierzchu ${uchwyty.filter((t) => t === 'uchwyt').length}`);
ok('każdy uchwyt jest na wierzchu (2 + 2 + narożna + ramię)',
  ileUchwytow === 6 && uchwyty.length === 6 && uchwyty.every((t) => t === 'uchwyt'),
  `${ileUchwytow} uchwytów: ${uchwyty.join(', ')}`);

/* Kolejnosc bryl ma wynikac z geometrii, a nie z wymuszenia. Rysunek podaje,
   ile razy trzeba bylo przerwac cykl — przy zamknietych drzwiach ma byc zero,
   z kazdej strony, z ktorej da sie obejrzec zabudowe w „3D". */
const cykle = () => page.evaluate(() => Number(
  [...document.querySelectorAll('svg[data-cykle]')].map((s) => s.dataset.cykle)[0] ?? -1));
ok('45°: kolejność bez wymuszeń', (await cykle()) === 0, String(await cykle()));
await pick('3D');
const zKatow = [];
for (let k = 0; k < 8; k++) {
  zKatow.push(await cykle());
  await page.getByText('45° ▶', { exact: true }).first().click();
  await page.waitForTimeout(400);
}
ok('3D z ośmiu stron: kolejność bez wymuszeń', zKatow.every((c) => c === 0), zKatow.join(' '));
await pick('45°');

console.log('\n== nóżki w bryle zabudowy ==');
/* 600 i 600 po 4, narozna 900 dostaje pare posrodku, czyli 6; ramie 1200
   stoi jak samodzielna szafka 1200: para przy rogu, posrodku i pod koncem. */
const nSzafki = await bryly('noga');
const nRamie = await bryly('noga-ramie');
console.log(`     nóżek szafek ${nSzafki}, ramienia ${nRamie}`);
ok('szafki stoją na swoich nóżkach (4 + 4 + 6)', nSzafki === 14, String(nSzafki));
ok('ramię ma 6 nóżek: przy rogu, na środku i pod końcem', nRamie === 6, String(nRamie));
await pick('3D');
ok('w widoku 3D też', (await bryly('noga')) === 14 && (await bryly('noga-ramie')) === 6,
  `${await bryly('noga')} / ${await bryly('noga-ramie')}`);

const zam = await card(/^Produkty całego projektu/).evaluate((s) =>
  [...s.querySelectorAll('tbody tr')].map((tr) => tr.innerText.replace(/\s+/g, ' ')));
const nogiZam = zam.find((r) => /^Nóżka/.test(r)) || '';
console.log('     ' + nogiZam);
ok('zamówienie liczy tyle samo nóżek ramienia', /pod ramieniem szafki narożnej — 6 szt/.test(nogiZam), nogiZam);
ok('i razem tyle, ile stoi w bryle', / 20 szt\.?$/.test(nogiZam), nogiZam);

console.log('\n== pojedyncza szafka w 3D: ta sama kolejność ==');
/* Szafka z plecami we frezie to najgorszy przypadek: plecy wchodza w boki,
   dno i wieniec, wiec plyty naprawde sie przenikaja. Narozna ma katownik
   i wzmocnienia do samego tylu. */
const osiemStron = async () => {
  const w = [];
  for (let k = 0; k < 8; k++) {
    w.push(await cykle());
    await page.getByText('45° ▶', { exact: true }).first().click();
    await page.waitForTimeout(300);
  }
  return w;
};
await seed([CAB('F', 800, { backGroove: { on: true, offset: 3, depth: 16, play: 1, wreg: true },
  levels: [{ h: null, cols: [{ kind: 'doors', doors: 2, w: null }] }] })], []);
await pick('3D');
let s8 = await osiemStron();
ok('plecy we frezie: bez wymuszeń z ośmiu stron', s8.every((c) => c === 0), s8.join(' '));
await seed([CAB('A1', 600), CAB('A2', 600),
  CAB('rogowa', 900, { corner: { on: true, arm: 1200, doors: 'wsporniki' } })], RUNY);
await page.locator('button', { hasText: /^rogowa/ }).first().click();
await page.waitForTimeout(800);
await pick('3D');
s8 = await osiemStron();
ok('szafka narożna: bez wymuszeń z ośmiu stron', s8.every((c) => c === 0), s8.join(' '));

console.log('\n== elewacja szafki narożnej: nóżki ramienia jak w zamówieniu ==');
/* Rysunek szafki naroznej rozwija ramie obok korpusu (900 mm, ramie od x=900).
   Nozki ramienia ida z `armLegPlan`, tak jak w zamowieniu: przy rogu, posrodku
   i pod wolnym koncem. Wczesniej ten widok rysowal oba konce bez srodka. */
await pick('Szafka');
await pick('Zamk.');
const nogiElew = await page.evaluate(() => [...document.querySelector('svg').querySelectorAll('rect')]
  .filter((r) => (r.getAttribute('fill') || '').toLowerCase() === '#3f3f46')
  .map((r) => Math.round(+r.getAttribute('x'))).sort((a, c) => a - c));
const nogiRam = nogiElew.filter((x) => x >= 900);
console.log('     nóżki w elewacji: ' + nogiElew.join(' '));
ok('ramię: trzy nóżki od przodu', nogiRam.length === 3, nogiRam.join(' '));
ok('przy rogu, na środku i pod końcem', [900 + 40, 900 + 600 - 20, 900 + 1200 - 80]
  .every((x0) => nogiRam.some((x) => Math.abs(x - x0) <= 5)), nogiRam.join(' '));

console.log('\n== podpowiedź przy ręcznie wpisanych nóżkach ==');
const uwagi = async () => (await page.locator('section').filter({ has: page.locator('h2', { hasText: /^Uwagi$/ }) })
  .count()) ? await card(/^Uwagi$/).innerText() : '';
await seed([CAB('D', 1200, { legs: { ...NOGI, count: 4 } })], []);
let u = await uwagi();
ok('1200 na 4 nóżkach dostaje podpowiedź', /stoi na 4 nóżkach/.test(u), u.slice(0, 200));
const b5 = card(/^Uwagi$/).getByRole('button', { name: /5 nóżek — jedna na środku/ });
const b6 = card(/^Uwagi$/).getByRole('button', { name: /6 nóżek — para na środku/ });
ok('są obie propozycje: 5 i 6', (await b5.count()) === 1 && (await b6.count()) === 1, '');
await b5.click();
await page.waitForTimeout(1200);
const zapis = await page.evaluate(() => JSON.parse(localStorage.getItem('szafki:projekt')).items[0].cab.legs.count);
ok('przycisk wpisuje 5 nóżek', zapis === 5, String(zapis));
u = await uwagi();
ok('przy 5 (jedna na środku) podpowiedź znika', !/stoi na \d+ nóżkach/.test(u), u.slice(0, 200));
await seed([CAB('D', 1200)], []);
u = await uwagi();
ok('bez ręcznej liczby nic nie podpowiada — automat daje 6', !/stoi na \d+ nóżkach/.test(u), u.slice(0, 200));

console.log('\nBLEDY:', errors.length ? errors.join('; ') : '(brak)');
await b.close();
