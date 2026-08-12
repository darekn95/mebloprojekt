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
const mmShapes = (sel) => page.evaluate((s) => {
  const svg = document.querySelector('svg');
  const vb = svg.getAttribute('viewBox').split(' ').map(Number);
  const box = svg.getBoundingClientRect();
  const k = box.width / vb[2];
  return [...svg.querySelectorAll(s)].map((r) => {
    const b = r.getBoundingClientRect();
    let rot = 0;
    for (let e = r; e && e.tagName !== 'svg'; e = e.parentElement) {
      const m = /rotate\((-?\d+)/.exec(e.getAttribute('transform') || '');
      if (m) { rot = ((+m[1] % 360) + 360) % 360; break; }
    }
    return { x: Math.round((b.x - box.x) / k + vb[0]), y: Math.round((b.y - box.y) / k + vb[1]),
      w: Math.round(b.width / k), h: Math.round(b.height / k), f: r.getAttribute('fill'), rot };
  });
}, sel);

const PL = { on: true, height: 100, mode: 'under', setback: 0 };
const CAB = (name, W, runId, corner = null) => ({
  cab: { name, W, H: 720, D: 600, plinth: PL, corner,
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
const L = (arm, doors = 'wsporniki') => ({ on: true, arm, doors });
// ciag A wjezdza w rog, jego ostatnia szafka jest szafka narozna w L
const uklad = (arm, W = 900, doors = 'wsporniki') => seed(
  [RUN('c1', 'Ściana A'), RUN('c2', 'Ściana B', { corner: { of: 'c1', at: 'end', owner: 'of', clear: 0 } })],
  [CAB('A1', 600, 'c1'), CAB('rogowa', W, 'c1', arm ? L(arm, doors) : null), CAB('B1', 700, 'c2')]);

await page.goto(URL, { waitUntil: 'networkidle' });

console.log('== ramie odsuwa drugi ciag ==');
await uklad(0);
await pick('Zabudowa');
await pick('Z góry');
let k = (await mmShapes('rect')).filter((q) => q.f === '#fafaf9' && q.w > 100 && q.h > 100);
/* Szafka B1 ma 700 mm szerokosci — po obrocie to jej wysokosc na rysunku.
   Po tym poznajemy ja wsrod ksztaltow obroconego ciagu (ramie ma 500). */
const szafkaB = (kk) => kk.filter((q) => q.rot === 90 && q.h === 700);
const bezRamienia = Math.min(...szafkaB(k).map((q) => q.y));
console.log('     bez ramienia ciąg B zaczyna się na ' + bezRamienia);
await uklad(500);
await pick('Zabudowa');
await pick('Z góry');
k = (await mmShapes('rect')).filter((q) => q.f === '#fafaf9' && q.w > 100 && q.h > 100);
const zRamieniem = Math.min(...szafkaB(k).map((q) => q.y));
console.log('     z ramieniem 500 ciąg B zaczyna się na ' + zRamieniem);
ok('ramię odsuwa drugi ciąg o swoją długość', zRamieniem - bezRamienia === 500,
  `${bezRamienia} → ${zRamieniem}`);

console.log('\n== ramie widac w rzucie z gory ==');
let tx = await svgTexts();
console.log('     ' + tx.join(' | '));
ok('ramię opisane na rysunku', tx.some((t) => /^ramię 500$/.test(t)), tx.join(' | '));
// ramie lezy w luce miedzy rogiem a pierwsza szafka ciagu B
// ramie po obrocie: 600 mm glebokosci w poziomie, 500 mm dlugosci w pionie
const front = (await mmShapes('rect')).filter((q) => q.rot === 90 && q.h === 500 && q.w > 100);
console.log('     kształty ramienia: ' + JSON.stringify(front.map((q) => ({ x: q.x, y: q.y, w: q.w, h: q.h }))));
ok('ramię narysowane w obróconym ciągu', front.length >= 1, String(front.length));
ok('ramię stoi między rogiem a szafką B',
  front.every((q) => q.y >= 600 && q.y + q.h <= 1100 + 1),
  JSON.stringify(front.map((q) => ({ y: q.y, kon: q.y + q.h }))));
await page.locator('svg').first().screenshot({ path: S + 'shot-L-top.png' });

console.log('\n== uwagi opisuja szafke narozna ==');
let uw = await card(/Uwagi/).innerText();
console.log('     ' + uw.replace(/\n+/g, ' / ').slice(0, 400));
ok('uwaga o szafce narożnej w L', /szafką narożną w L/.test(uw), uw.slice(0, 200));
ok('podany korpus i ramię', /900 mm przy ścianie/.test(uw) && /500 × 600 mm/.test(uw), uw.slice(0, 300));
ok('opisany sposób otwierania', /kątownika/.test(uw), uw.slice(0, 400));
ok('nie ma już mowy o ślepym narożniku', !/Ślepy narożnik/.test(uw), uw.slice(0, 200));

console.log('\n== formatki ramienia wchodza do zestawienia ==');
const zest = card(/Zestawienie|Formatki|Rozkrój/);
const zt = await page.evaluate(() => document.body.innerText);
for (const nazwa of ['Wieniec i dno ramienia', 'Bok ramienia', 'Front ramienia',
  'Kątownik narożnika — nachodzący', 'Kątownik narożnika — doczołowy',
  'Maskownica kątownika — nachodząca', 'Maskownica kątownika — doczołowa']) {
  ok(`formatka „${nazwa}" jest w zestawieniu`, zt.includes(nazwa), '');
}
ok('grupa formatek podpisana narożnikiem', /Narożnik — rogowa/.test(zt), '');

console.log('\n== warianty drzwi ==');
await uklad(500, 900, 'lamane');
uw = await card(/Uwagi/).innerText();
ok('drzwi łamane opisane', /zawiasami łamanymi/.test(uw), uw.slice(0, 300));
ok('bez kątownika przy łamanych', !/Kątownik narożnika/.test(uw), uw.slice(0, 300));
let body = await page.evaluate(() => document.body.innerText);
ok('kątownik nie idzie na formatki', !body.includes('Kątownik narożnika'), '');
ok('dochodzi zawias łamany', body.includes('Zawias łamany 90°'), '');
await uklad(500, 900, 'skrecone');
uw = await card(/Uwagi/).innerText();
ok('drzwi skręcone opisane', /skręcone na stałe/.test(uw), uw.slice(0, 300));
/* Czwarty wariant: ramie zaslepia fix, otwieraja sie tylko drzwi w korpusie. */
await uklad(500, 900, 'fix');
uw = await card(/Uwagi/).innerText();
ok('wariant z fixem opisany', /zaślepione fixem/.test(uw), uw.slice(0, 300));
body = await page.evaluate(() => document.body.innerText);
ok('formatka to fix, nie front', body.includes('Fix ramienia') && !body.includes('Front ramienia'), '');
ok('fix nie dostaje zawiasów', !/front ramienia szafki narożnej/.test(body), '');
ok('fix trzyma się na złączkach', body.includes('Złączka meblowa'), '');
ok('przy fixie nie ma kątownika', !body.includes('Kątownik narożnika'), '');

console.log('\n== za waski korpus przy szafce naroznej ==');
/* Korpus 700, glebokosc ramienia 600, front ramienia 18 → z lica zostaje 82 mm,
   a katownik z luzem zabiera z tego jeszcze 45. */
await uklad(500, 700);
uw = await card(/Uwagi/).innerText();
console.log('     ' + uw.replace(/\n+/g, ' / ').slice(0, 240));
ok('ostrzeżenie o zbyt wąskim froncie', /tylko 37 mm frontu/.test(uw), uw.slice(0, 240));
await uklad(500, 500);   // korpus wezszy niz ramie → nie ma frontu w ogole
uw = await card(/Uwagi/).innerText();
ok('brak frontu to błąd', /nie ma frontu od strony/.test(uw), uw.slice(0, 240));
ok('podpowiedź, do ilu poszerzyć', /800 mm/.test(uw), uw.slice(0, 300));

console.log('\n== fronty szafki naroznej musza sie zmiescic obok ramienia ==');
await uklad(500, 900);   // korpus 900, ramie 600 gleboko → front tylko 300 mm
uw = await card(/Uwagi/).innerText();
console.log('     ' + uw.replace(/\n+/g, ' / ').slice(0, 400));
/* Dostepne swiatlo to szerokosc korpusu minus glebokosc sasiedniego ciagu
   i minus grubosc frontu ramienia (jego lico stoi przed korpusem ramienia),
   a z tego jeszcze katownik z luzem. Nachodzaca plyta wchodzi w kwadrat styku
   obu lic, wiec poza naroze wystaje o grubosc frontu mniej: 900 - 600 - 18
   - (60 - 18) - 3 = 237. */
const swiatlo = Number((/dostępne jest tylko (\d+) mm/.exec(uw) || [])[1]);
console.log('     dostępne światło: ' + swiatlo + ' mm');
ok('ostrzeżenie o froncie nad ramieniem', swiatlo > 0, uw.slice(0, 300));
ok('światło liczone z lica ramienia i po kątowniku', swiatlo === 237, String(swiatlo));
ok('podpowiedź, ile mają mieć drzwi',
  new RegExp('Zrób jedne drzwi na ' + swiatlo + ' mm').test(uw), uw.slice(0, 400));

console.log('\n== przycisk ustawia jedne drzwi na dostepne swiatlo ==');
await uklad(500, 900);
let przed = await page.evaluate(() => document.body.innerText);
ok('przed naprawą jest ostrzeżenie', /nad ramieniem frontu nie ma|dostępne jest tylko/.test(przed), '');
await card(/Uwagi/).getByRole('button', { name: new RegExp('Ustaw jedne drzwi ' + swiatlo + ' mm') }).click();
await page.waitForTimeout(1200);
const kol = await page.evaluate(() =>
  JSON.parse(localStorage.getItem('szafki:projekt')).items[1].cab.levels[0].cols
    .map((c) => ({ w: c.w, doors: c.doors, dw: c.doorWidths })));
console.log('     kolumny: ' + JSON.stringify(kol));
/* Szafka narozna to jedna komora — zostaje jedna kolumna, a front jest po
   prostu wezszy od korpusu, bo nad ramieniem nie ma czego zaslaniac. */
ok('jedna kolumna z jednymi drzwiami',
  kol.length === 1 && kol[0].doors === 1 && kol[0].dw[0] === swiatlo, JSON.stringify(kol));
uw = await card(/Uwagi/).count() ? await card(/Uwagi/).innerText() : '';
ok('ostrzeżenie znika po naprawie', !/dostępne jest tylko/.test(uw), uw.slice(0, 200));
ok('front węższy od korpusu nie jest błędem', !/nie wypełniają pasma/.test(uw), uw.slice(0, 200));
body = await page.evaluate(() => document.body.innerText);
ok('nie doszła przegroda pionowa', !/Przegroda pionowa/.test(body), '');
await pick('Ciąg');
await pick('Zamk.');
tx = await svgTexts();
console.log('     ' + tx.filter((t) => /×/.test(t)).join(' | '));
/* Zadana szerokosc drzwi wchodzi wprost, bez doliczania nalozenia — front
   ma dokladnie tyle, ile pokazala podpowiedz. */
ok('front szafki narożnej zwężony do dostępnego światła',
  tx.some((t) => new RegExp('^' + swiatlo + '×').test(t)) && !tx.some((t) => /^8\d\d×/.test(t)),
  tx.filter((t) => /×/.test(t)).join(' | '));

console.log('\n== polki w ramieniu ida za szafka ==');
await seed(
  [RUN('c1', 'Ściana A'), RUN('c2', 'Ściana B', { corner: { of: 'c1', at: 'end', owner: 'of', clear: 0 } })],
  [{ cab: { name: 'rogowa', W: 900, H: 720, D: 600, plinth: PL, corner: L(500),
      levels: [{ h: null, cols: [{ kind: 'doors', doors: 1, w: null,
        shelfTargets: [null, null, null] }] }] }, runId: 'c1', offset: 0 },
   CAB('B1', 700, 'c2')]);
body = await page.evaluate(() => document.body.innerText);
ok('półki ramienia w zestawieniu', /Półka ramienia/.test(body), '');
const wiersz = await page.evaluate(() => ([...document.querySelectorAll('tr')]
  .find((tr) => /Półka ramienia/.test(tr.innerText)) || {}).innerText || '');
console.log('     ' + wiersz.replace(/\s+/g, ' '));
ok('tyle półek, ile w szafce', / 2 /.test(wiersz.replace(/\s+/g, ' ')), wiersz.replace(/\s+/g, ' '));
uw = await card(/Uwagi/).innerText();
ok('jedna kolumna — półka ma na czym się skończyć',
  !/skończyłaby się w powietrzu/.test(uw), uw.slice(0, 300));

console.log('\n== polka bez pary w kolumnie przy ramieniu ==');
/* Ramie wychodzi z prawej strony korpusu, wiec polke lapie kolumna prawa.
   Lewa ma polki, prawa nie — polka lewej konczylaby sie w ramieniu w powietrzu. */
await seed(
  [RUN('c1', 'Ściana A'), RUN('c2', 'Ściana B', { corner: { of: 'c1', at: 'end', owner: 'of', clear: 0 } })],
  [{ cab: { name: 'rogowa', W: 900, H: 720, D: 600, plinth: PL, corner: L(500),
      levels: [{ h: null, cols: [
        { kind: 'doors', doors: 1, w: 400, shelfTargets: [null, null] },
        { kind: 'doors', doors: 1, w: null, shelfTargets: [null] }] }] }, runId: 'c1', offset: 0 },
   CAB('B1', 700, 'c2')]);
uw = await card(/Uwagi/).innerText();
console.log('     ' + uw.replace(/\n+/g, ' / ').slice(0, 400));
ok('błąd o półce kończącej się w powietrzu', /skończyłaby się w powietrzu/.test(uw), uw.slice(0, 300));
ok('podana wysokość wiszącej półki', /półka na \d+ mm nie ma pary/.test(uw), uw.slice(0, 300));

console.log('\n== maskownica naroznika nie liczy sie jako luz ==');
/* Front szafki naroznej konczy sie tam, gdzie zaczyna sie ramie. Reszta lica
   jest zabudowana — maskownica przy wsporniku i sam korpus ramienia — wiec
   kontrola luzu nie ma prawa tam niczego mierzyc. */
await seed(
  [RUN('c1', 'Ściana A'), RUN('c2', 'Ściana B', { corner: { of: 'c1', at: 'end', owner: 'of', clear: 0 } })],
  [{ cab: { name: 'rogowa', W: 900, H: 720, D: 600, plinth: PL, corner: L(500),
      levels: [{ h: null, cols: [{ kind: 'doors', doors: 1, w: null,
        doorWidths: [300], hinge: 'left' }] }] }, runId: 'c1', offset: 0 },
   CAB('B1', 700, 'c2')]);
uw = await card(/Uwagi/).innerText();
console.log('     ' + uw.replace(/\n+/g, ' / ').slice(0, 300));
ok('nie krzyczy o luzie przy zabudowanym odcinku', !/luzu — o \d+ mm za dużo/.test(uw), uw.slice(0, 300));
ok('brak fałszywej szczeliny do boku korpusu', !/między frontem a \w+ bokiem/.test(uw), uw.slice(0, 300));

console.log('\n== dziura po drugiej stronie frontu dalej jest bledem ==');
/* Ramie wychodzi prawa strona korpusu, wiec lewa dziura nie ma czym byc
   zabudowana — i ma sie odezwac jak kazdy inny za duzy luz. */
await seed(
  [RUN('c1', 'Ściana A'), RUN('c2', 'Ściana B', { corner: { of: 'c1', at: 'end', owner: 'of', clear: 0 } })],
  [{ cab: { name: 'rogowa', W: 900, H: 720, D: 600, plinth: PL, corner: L(500),
      levels: [{ h: null, cols: [
        { kind: 'doors', doors: 0, w: 200 },
        { kind: 'doors', doors: 1, w: null, doorWidths: [200] }] }] }, runId: 'c1', offset: 0 },
   CAB('B1', 700, 'c2')]);
uw = await card(/Uwagi/).innerText();
console.log('     ' + uw.replace(/\n+/g, ' / ').slice(0, 400));
ok('odsłonięta szczelina przy boku zgłoszona jako błąd',
  /między frontem a lewym bokiem korpusu zostaje \d+ mm luzu/.test(uw), uw.slice(0, 300));
ok('podane, o ile za dużo i jaka granica',
  /za dużo, granica to 5 mm/.test(uw), uw.slice(0, 300));

console.log('\n== za krotkie ramie ==');
await uklad(120);
uw = await card(/Uwagi/).innerText();
ok('ostrzeżenie o krótkim ramieniu', /Ramię szafki narożnej ma 120 mm/.test(uw), uw.slice(0, 240));

console.log('\n== karta: wlaczenie ramienia z UI ==');
await uklad(0);
const cc = card(/^Ciąg meblowy$/);
// szafka rogowa to druga w ciagu A — przelaczamy sie na nia
await page.locator('header div.rounded-full').filter({ hasText: 'rogowa' }).first()
  .getByRole('button', { name: 'rogowa', exact: true }).click();
await page.waitForTimeout(1000);
const grupa = cc.locator('div').filter({ hasText: /^Szafka narożna \(L\)/ }).first();
ok('sekcja szafki narożnej jest w karcie', await grupa.count() === 1, String(await grupa.count()));
await cc.getByText('Korpus wychodzi ramieniem w L', { exact: true }).click();
await page.waitForTimeout(900);
const zapis = await page.evaluate(() =>
  JSON.parse(localStorage.getItem('szafki:projekt')).items.map((i) => i.cab.corner));
console.log('     ' + JSON.stringify(zapis));
ok('ramię zapisane w szafce', !!zapis[1] && zapis[1].on === true, JSON.stringify(zapis[1]));
ok('domyślnie na wsporniki', zapis[1].doors === 'wsporniki', JSON.stringify(zapis[1]));
ok('inne szafki bez ramienia', !zapis[0].on && !zapis[2].on, JSON.stringify(zapis));

console.log('\n== szafka spoza rogu nie dostaje tej sekcji ==');
await page.locator('header div.rounded-full').filter({ hasText: 'A1' }).first()
  .getByRole('button', { name: 'A1', exact: true }).click();
await page.waitForTimeout(1000);
const brak = card(/^Ciąg meblowy$/).locator('div').filter({ hasText: /^Szafka narożna \(L\)/ });
ok('zwykła szafka nie ma sekcji narożnej', await brak.count() === 0, String(await brak.count()));

console.log('\n== wszystkie widoki z szafka narozna ==');
await uklad(500);
await pick('Zabudowa');
for (const v of ['Zamk.', 'Otw.', 'Z góry', 'Z tyłu', '3D']) {
  const before = errors.length;
  await pick(v);
  ok(`wariant ${v}`, errors.length === before, errors.slice(before).join('; '));
}
await pick('Zamk.');
tx = await svgTexts();
ok('ramię widać też w elewacji', tx.some((t) => /^ramię 500$/.test(t)), tx.join(' | '));
await page.locator('svg').first().screenshot({ path: S + 'shot-L-elew.png' });
await pick('3D');
await page.locator('svg').first().screenshot({ path: S + 'shot-L-3d.png' });

console.log('\n== bez ramienia nic sie nie zmienia ==');
await uklad(0);
body = await page.evaluate(() => document.body.innerText);
ok('brak formatek ramienia', !body.includes('Front ramienia'), '');
uw = await card(/Uwagi/).innerText();
ok('wraca ślepy narożnik', /Ślepy narożnik/.test(uw), uw.slice(0, 200));

console.log('\nBLEDY:', errors.length ? errors.join('\n') : '(brak)');
await browser.close();
