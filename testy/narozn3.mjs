import pw from './pw.mjs';
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
const card = (re) => page.locator('section').filter({ has: page.locator('h2', { hasText: re }) }).first();

/* Blat na szafce robi sie wieńcem w trybie „blat" z materialu blatu roboczego. */
const PL = { on: true, height: 100, mode: 'under', setback: 0 };
const CAB = (name, W, runId) => ({
  cab: { name, W, H: 720, D: 600, plinth: PL,
    top: { mode: 'blat', material: 'worktop', widthMode: 'outside',
      overL: 0, overR: 0, overFront: 0, overBack: 0 },
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
// dwa ciagi w L, oba z blatem; corner steruje tym, ktory blat przechodzi
const uklad = (corner) => seed(
  [RUN('c1', 'Ściana A'), RUN('c2', 'Ściana B',
    { corner: Object.assign({ of: 'c1', at: 'end', owner: 'of', clear: 0 }, corner) })],
  [CAB('A1', 800, 'c1'), CAB('A2', 900, 'c1'), CAB('B1', 900, 'c2')]);
// dlugosci formatek blatu z zestawienia
const blaty = () => page.evaluate(() => [...document.querySelectorAll('tr')]
  .filter((tr) => /Blat ciągu/.test(tr.innerText))
  .map((tr) => tr.innerText.replace(/\s+/g, ' ').trim()));

await page.goto(URL, { waitUntil: 'networkidle' });

console.log('== bez naroznika: blat idzie po szafkach ==');
await seed([RUN('c1', 'Ściana A')], [CAB('A1', 800, 'c1'), CAB('A2', 600, 'c1')]);
let b = await blaty();
console.log('     ' + b.join('  //  '));
ok('blat ciągu ma długość szafek', b.some((t) => /1400/.test(t)), b.join(' | '));

console.log('\n== na styk: blat wjezdzajacego w rog przechodzi ==');
await uklad({});
b = await blaty();
console.log('     ' + b.join('  //  '));
/* Ciag A (800 + 900 = 1700) wjezdza w rog, wiec jego blat idzie nad rogiem.
   Blat ciagu B zaczyna sie dopiero za nim, czyli nad wlasnymi szafkami. */
ok('blat ciągu A na całą jego długość', b.some((t) => /1700/.test(t)), b.join(' | '));
/* Szafki B zaczynaja sie za licem szafki A (600 + 18), blat B dochodzi do
   przedniej krawedzi blatu A (600) — stad 900 szafek + 18. */
/* Szafki B zaczynaja sie 621 od rogu, a ich blat dochodzi do przedniej
   krawedzi blatu A: 600 korpusu + 3 HDF za nim = 603 — stad 1521 - 603 = 918. */
ok('blat ciągu B skrócony o głębokość A (918)', b.some((t) => /\b918\b/.test(t)), b.join(' | '));
let uw = await card(/Uwagi/).innerText();
console.log('     ' + uw.replace(/\n+/g, ' / ').slice(0, 300));
ok('uwaga mówi, który blat przechodzi', /przechodzi blat ciągu „Ściana A"/.test(uw), uw.slice(0, 300));
ok('drugi kończy się na krawędzi przechodzącego', /dojeżdża do jego przedniej krawędzi/.test(uw), uw.slice(0, 300));

console.log('\n== przelaczenie: przechodzi blat drugiego ciagu ==');
await uklad({ top: 'self' });
b = await blaty();
console.log('     ' + b.join('  //  '));
/* Teraz przechodzi blat ciagu B: siega az do rogu, wiec ma 900 mm szafek plus
   600 mm nad rogiem = 1500 mm. Blat ciagu A konczy sie 600 mm przed rogiem. */
// szafki B zaczynaja sie 621 od rogu (600 + 3 HDF + 18 frontu A)
ok('blat ciągu B idzie nad rogiem (900 + 621)', b.some((t) => /1521/.test(t)), b.join(' | '));
// blat B siega sciany: 600 + 3 za korpusem = 603 glebokosci — A konczy sie 603 przed rogiem
ok('blat ciągu A skrócony', b.some((t) => /1097/.test(t)), b.join(' | '));
uw = await card(/Uwagi/).innerText();
ok('uwaga mówi o zamianie', /przechodzi blat ciągu „Ściana B"/.test(uw), uw.slice(0, 300));

console.log('\n== lyzwa: oba blaty do rogu, ciete na 45 ==');
await uklad({ cut: 'skos' });
b = await blaty();
console.log('     ' + b.join('  //  '));
ok('blat A dochodzi do rogu', b.some((t) => /1700/.test(t)), b.join(' | '));
ok('blat B też dochodzi do rogu (1521)', b.some((t) => /1521/.test(t)), b.join(' | '));
ok('formatka mówi o cięciu na 45°', b.every((t) => /łyżwa 45°/.test(t)), b.join(' | '));
uw = await card(/Uwagi/).innerText();
console.log('     ' + uw.replace(/\n+/g, ' / ').slice(0, 300));
ok('uwaga o łyżwie', /na łyżwę/.test(uw), uw.slice(0, 300));
ok('podpowiedź o jednej partii', /tej samej partii/.test(uw), uw.slice(0, 300));

console.log('\n== U: srodkowy blat obsluguje dwa rogi ==');
await seed(
  [RUN('c1', 'A'), RUN('c2', 'B', { corner: { of: 'c1', at: 'end', owner: 'of', clear: 0 } }),
    RUN('c3', 'C', { corner: { of: 'c2', at: 'end', owner: 'of', clear: 0 } })],
  [CAB('A1', 900, 'c1'), CAB('B1', 900, 'c2'), CAB('C1', 900, 'c3')]);
b = await blaty();
console.log('     ' + b.join('  //  '));
/* A: 900. B i C zaczynaja sie za licem szafki poprzedniej sciany (+18),
   a blat dochodzi do krawedzi poprzedniego blatu — po 918. Od 2026-09-29 blat
   roboczy ma oklejone tylko wolne konce (uzytkownik): A i C po jednym koncu,
   B — oba konce w rogach, bez oklejania — wiec B i C to osobne pozycje. */
ok('blaty wszystkich trzech ścian w zestawieniu',
  b.length === 3 && b.some((t) => /Blat — A/.test(t) && /\b900\b/.test(t))
    && b.some((t) => /Blat — B/.test(t) && /\b918\b/.test(t)) && b.some((t) => /Blat — C/.test(t) && /\b918\b/.test(t)),
  b.join(' | '));
/* B wjezdza w rog z C, ale ustepuje A — jego blat zaczyna sie 600 za rogiem
   i konczy nad drugim rogiem, wiec ma tyle, co szafki. */
ok('środkowy blat nie nakłada się na sąsiadów', /\b900\b/.test(b[0] || ''), b.join(' | '));
ok('po jednej sztuce każdej ściany', b.every((t) => / 1 /.test(t)), b.join(' | '));
ok('oklejone tylko wolne końce: A i C jeden koniec, B żadnego',
  b.some((t) => /Blat — A/.test(t) && /bok 600/.test(t)) && b.some((t) => /Blat — C/.test(t) && /bok 600/.test(t))
    && b.some((t) => /Blat — B/.test(t) && !/bok/.test(t)), b.join(' | '));

console.log('\n== karta ciagu: przelaczniki blatu w rogu ==');
await uklad({});
// aktywna jest szafka z ciagu A — przechodzimy na szafke ciagu B
await page.locator('header div.rounded-full').filter({ hasText: 'B1' }).first()
  .getByRole('button', { name: 'B1', exact: true }).click();
await page.waitForTimeout(1200);
const cc = card(/^Ciąg meblowy$/);
const txt = await cc.innerText();
ok('przełącznik cięcia jest w karcie', /Na 45° \(łyżwa\)/.test(txt), txt.slice(0, 200));
ok('przełącznik przechodzenia blatu jest w karcie', /Przechodzi ten blat/.test(txt), txt.slice(0, 200));
await cc.getByText('Na 45° (łyżwa)', { exact: true }).click();
await page.waitForTimeout(900);
let zapis = await page.evaluate(() =>
  JSON.parse(localStorage.getItem('szafki:projekt')).runs.map((r) => r.corner));
console.log('     ' + JSON.stringify(zapis));
ok('łyżwa zapisana', zapis[1] && zapis[1].cut === 'skos', JSON.stringify(zapis[1]));
const po = await cc.innerText();
ok('przy łyżwie nie pytamy, który przechodzi', !/Przechodzi ten blat/.test(po), po.slice(0, 200));
await cc.getByText('Blat na styk', { exact: true }).click();
await page.waitForTimeout(900);
await cc.getByText('Przechodzi ten blat', { exact: true }).click();
await page.waitForTimeout(900);
zapis = await page.evaluate(() =>
  JSON.parse(localStorage.getItem('szafki:projekt')).runs.map((r) => r.corner));
ok('wybór przechodzącego blatu zapisany', zapis[1] && zapis[1].top === 'self', JSON.stringify(zapis[1]));

console.log('\n== rozkroj liczy blaty razem z narożnikiem ==');
await uklad({ cut: 'skos' });
await page.getByRole('button', { name: 'Rozkrój na płycie', exact: true }).first().click();
await page.waitForTimeout(1500);
const plan = await page.evaluate(() => {
  const sec = [...document.querySelectorAll('section')]
    .find((s) => /^Rozkrój na płycie/.test((s.querySelector('h2') || {}).textContent || ''));
  return sec ? sec.innerText.replace(/\s+/g, ' ') : '';
});
console.log('     ' + plan.slice(0, 220));
ok('blat roboczy ma swój arkusz w rozkroju', /4100/.test(plan), plan.slice(0, 220));

console.log('\n== bez blatu narożnik nic nie mówi o blacie ==');
await seed(
  [RUN('c1', 'A'), RUN('c2', 'B', { corner: { of: 'c1', at: 'end', owner: 'of', clear: 0 } })],
  [{ cab: { name: 'A1', W: 800, H: 720, D: 600, plinth: PL,
      levels: [{ h: null, cols: [{ kind: 'doors', doors: 1, w: null }] }] }, runId: 'c1', offset: 0 },
   { cab: { name: 'B1', W: 900, H: 720, D: 600, plinth: PL,
      levels: [{ h: null, cols: [{ kind: 'doors', doors: 1, w: null }] }] }, runId: 'c2', offset: 0 }]);
uw = await card(/Uwagi/).innerText();
ok('bez blatu brak uwagi o blacie w rogu', !/Blat w narożniku/.test(uw), uw.slice(0, 200));

console.log('\nBLEDY:', errors.length ? errors.join('\n') : '(brak)');
await browser.close();
