/* Odsuniecie od sciany i to, ile blat wystaje przed drzwi. Blat liczy sie od
   sciany na wysokosci blatu: odstep + korpus + 2 mm luzu przy zawiasach +
   front + wysieg. Arkusz 600 ma wystawac przed drzwi 10 mm; mniej to uwaga,
   ponad 30 mm — ostrzezenie i domyslnie blat na wymiar. Krzywa sciana daje
   inny odstep przy podlodze niz pod blatem — widok z boku rysuje ja ukosem.
   Od 2026-09-28 HDF przybijany (3 mm) stoi za korpusem i odsuwa szafke od
   sciany — korpusy sa tu wiec o 3 mm plytsze (567, 537, 572), zeby odleglosci
   od sciany do lica zostaly te same co wczesniej (570, 540, 575). */
import pw from './pw.mjs';
const URL = process.env.STD ? 'http://127.0.0.1:5199/standalone-local.html'
  : 'http://127.0.0.1:5205/mebloprojekt-app.html';
const b = await pw.chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const page = await (await b.newContext({ viewport: { width: 1500, height: 1100 } })).newPage();
const errors = []; page.on('pageerror', (e) => errors.push('[pageerror] ' + e.message));
const ok = (l, c, e = '') => console.log((c ? '  OK   ' : '  BLAD ') + l + (e ? ' — ' + e : ''));
const card = (re) => page.locator('section').filter({ has: page.locator('h2', { hasText: re }) }).first();

await page.goto(URL, { waitUntil: 'networkidle' });
await page.evaluate(() => { try { localStorage.clear(); } catch (e) {} });
await page.reload({ waitUntil: 'networkidle' });
await page.waitForTimeout(1800);
// szablon: szafka narozna 900 z ramieniem w ciagu c1, ciag c2 za rogiem
await page.locator('select[title="Dodaj szafkę z gotowego szablonu"]').first().selectOption('naroznikL');
await page.waitForTimeout(2200);
const baza = await page.evaluate(() => localStorage.getItem('szafki:projekt'));

/* Ciag c1 dostaje druga, zwykla szafke — blat ma wtedy nad czym lezec poza
   rogiem — a obie jedna glebokosc. */
const uklad = async (D, wallGap, extra = () => {}) => {
  await page.evaluate(({ baza, D, wallGap, extra }) => {
    const p = JSON.parse(baza);
    const rog = p.items.find((i) => i.cab.corner && i.cab.corner.on);
    const zwykla = JSON.parse(JSON.stringify(rog));
    zwykla.cab.corner = { ...zwykla.cab.corner, on: false };
    zwykla.cab.name = 'Zwykła'; zwykla.cab.W = 600;
    p.items = [zwykla, rog];
    p.items.forEach((i) => { i.cab.D = D; });
    p.runs.forEach((r) => { r.D = D; });
    p.runs[0].wallGap = wallGap;
    p.active = 0;
    new Function('p', extra)(p);
    localStorage.setItem('szafki:projekt', JSON.stringify(p));
  }, { baza, D, wallGap, extra: String(extra).replace(/^[^{]*\{|\}$/g, '') });
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(2400);
};
const uwagi = async () => card(/^Uwagi$/).evaluate((sec) =>
  [...sec.querySelectorAll('li')].map((li) => ({
    t: li.textContent.replace(/\s+/g, ' ').trim(),
    b: [...li.querySelectorAll('button')].map((x) => x.textContent.trim()).filter((x) => x !== '✓'),
  })));
// glebokosci odcinkow blatu z zestawienia
const blaty = () => page.evaluate(() => [...document.querySelectorAll('tr')]
  .filter((tr) => /^Blat ciągu/.test(tr.innerText.trim()))
  .map((tr) => tr.innerText.split('\t').map((x) => x.trim())));
const wysiegowe = (u) => u.filter((x) => /wystaje przed drzwi|wystawałby|zamawiamy docięty/.test(x.t));

console.log('== pola w ciągu i w szafce ==');
await uklad(567, { bottom: 0, top: null });
ok('ciąg ma „Odsunięcie od ściany"', await page.getByText('Odsunięcie od ściany', { exact: true }).count() === 1);
ok('szafka ma własne odsunięcie', await page.getByText('Odsunięcie tej szafki od ściany', { exact: true }).count() === 1);

console.log('\n== 570 bez odstępu: arkusz 600 wystaje 10 mm ==');
let u = await uwagi();
let bl = await blaty();
console.log('     ' + bl.map((r) => r.slice(3, 5).join(' × ')).join(' // '));
ok('bez uwag o wysięgu', wysiegowe(u).length === 0, wysiegowe(u).map((x) => x.t.slice(0, 80)).join(' // '));
ok('bez uwagi o odstępie', !u.some((x) => /stoi .* od ściany/.test(x.t)));
ok('blat ściany ma 600', bl.length > 0 && bl[0].includes('600'), JSON.stringify(bl[0]));

console.log('\n== 540 + 30 mm od ściany: też 600, bez docinania ==');
await uklad(537, { bottom: 30, top: null });
u = await uwagi();
bl = await blaty();
ok('bez uwag o wysięgu', wysiegowe(u).length === 0, wysiegowe(u).map((x) => x.t.slice(0, 80)).join(' // '));
ok('uwaga o odstępie od ściany', u.some((x) => /Ciąg stoi 30 mm od ściany/.test(x.t)), u.map((x) => x.t.slice(0, 40)).join(' // '));
ok('blat ściany ma 600', bl.length > 0 && bl[0].includes('600'), JSON.stringify(bl[0]));
/* Szafka narozna odsunieta o 30 mm zjada rog razem z odstepem: 30 + 540 +
   ramie 630 = 1200, tyle samo co przy 570 bez odstepu. */
ok('ciąg za rogiem zaczyna się 1200 mm od rogu',
  u.some((x) => /zaczyna się 1200 mm od rogu/.test(x.t)), (u.find((x) => /zaczyna się/.test(x.t)) || {}).t);

console.log('\n== obie ściany 30 mm: ramię zostaje przy korpusie 540 ==');
/* Ramie lezy przy scianie drugiego ciagu i stoi z jego odstepem — jego plyty
   maja glebokosc korpusu, a nie korpusu z odstepem. Blat nad nim wychodzi
   wtedy tak samo jak na pierwszej scianie. */
await uklad(537, { bottom: 30, top: null }, (p) => { p.runs[1].wallGap = { bottom: 30, top: null }; });
u = await uwagi();
bl = await blaty();
const lka = u.find((x) => /szafką narożną w L/.test(x.t));
ok('ramię 630 × 537 (głębokość korpusu)', !!lka && /ramię 630 × 537 mm/.test(lka.t), lka && lka.t.slice(0, 160));
ok('oba blaty po 600, bez uwagi o różnych szerokościach',
  bl.length === 2 && bl.every((r) => r.includes('600')) && !u.some((x) => /różne szerokości/.test(x.t)),
  JSON.stringify(bl.map((r) => r.slice(3, 5))));
/* Szafka w L odsuwa sie od drugiej sciany razem z ramieniem, wiec blat
   pierwszej sciany wychodzi o te 30 mm dluzszy — dochodzi do sciany. */
ok('blat pierwszej ściany dochodzi do ściany: 1530', bl.length > 0 && bl[0].includes('1530'), JSON.stringify(bl[0]));

console.log('\n== krzywa ściana: 30 mm przy podłodze, 0 pod blatem ==');
await uklad(537, { bottom: 30, top: 0 });
u = await uwagi();
bl = await blaty();
const duzo = u.find((x) => /wystawałby przed drzwi 40 mm/.test(x.t));
console.log('     ' + (duzo ? duzo.t.slice(0, 200) : '(brak)'));
ok('ostrzeżenie: arkusz wystawałby 40 mm', !!duzo, wysiegowe(u).map((x) => x.t.slice(0, 80)).join(' // '));
ok('pokazuje, z czego to wynika', !!duzo && /plecy 3 \+ korpus 537 \+ 2 mm luzu przy zawiasach \+ front 18 = 560 mm/.test(duzo.t));
ok('domyślnie blat docięty do 570', bl.length > 0 && bl[0].includes('570'), JSON.stringify(bl[0]));
ok('uwaga mówi o obu odstępach', u.some((x) => /30 mm od ściany przy podłodze i 0 mm na wysokości blatu/.test(x.t)));
ok('da się wziąć cały arkusz', !!duzo && duzo.b.includes('Zamów cały arkusz'), duzo && duzo.b.join(' | '));
await page.getByRole('button', { name: 'Zamów cały arkusz' }).first().click();
await page.waitForTimeout(1400);
await page.reload({ waitUntil: 'networkidle' });
await page.waitForTimeout(2400);
u = await uwagi();
bl = await blaty();
const caly = u.find((x) => /wystawałby przed drzwi 40 mm/.test(x.t));
ok('po przełączeniu i przeładowaniu: cały arkusz 600', bl.length > 0 && bl[0].includes('600'), JSON.stringify(bl[0]));
ok('ostrzeżenie zostaje, z drogą powrotu', !!caly && /Teraz zamawiamy cały arkusz/.test(caly.t)
  && caly.b.some((x) => /docięty na wymiar/.test(x)), caly && caly.b.join(' | '));

console.log('\n== widok z boku rysuje ścianę ==');
await page.getByRole('button', { name: 'Z boku', exact: true }).first().click();
await page.waitForTimeout(900);
ok('ściana jest', await page.locator('g[data-el="sciana"]').count() === 1);
const napisy = await page.locator('g[data-el="sciana"] text').allTextContents();
ok('podpisane odstępy 30 i 0', napisy.some((t) => /30/.test(t)) && napisy.some((t) => /↔ 0/.test(t)), napisy.join(' | '));
await page.getByRole('button', { name: 'Ukryj ścianę' }).first().click();
await page.waitForTimeout(600);
ok('„Ukryj ścianę" chowa ją', await page.locator('g[data-el="sciana"]').count() === 0);
await page.getByRole('button', { name: 'Pokaż ścianę' }).first().click();
await page.waitForTimeout(600);
ok('„Pokaż ścianę" przywraca', await page.locator('g[data-el="sciana"]').count() === 1);
await uklad(567, { bottom: 0, top: null });
await page.getByRole('button', { name: 'Z boku', exact: true }).first().click();
await page.waitForTimeout(900);
// przy odstepie 0 sciana tez jest — szafka po prostu do niej dostaje — ale bez podpisow
ok('bez odstępu ściana jest, bez podpisów odstępu', await page.locator('g[data-el="sciana"]').count() === 1
  && (await page.locator('g[data-el="sciana"] text').allTextContents()).every((t) => !/↔/.test(t)));

console.log('\n== zakres „Ciąg", z góry: ramię obrócone wzdłuż drugiej ściany ==');
/* Druga sciana nie jest tu rysowana — ramie stoi mimo to na swoim miejscu,
   obrocone, z kawalkiem tamtej sciany, i miesci sie w kadrze. */
await page.getByRole('button', { name: 'Ciąg', exact: true }).first().click();
await page.waitForTimeout(700);
await page.getByRole('button', { name: 'Z góry', exact: true }).first().click();
await page.waitForTimeout(900);
const ramieWKadrze = await page.evaluate(() => {
  const g = [...document.querySelectorAll('g[transform^="matrix"]')][0];
  if (!g) return null;
  const svg = g.closest('svg').getBoundingClientRect(), r = g.getBoundingClientRect();
  return { wys: Math.round(r.height), szer: Math.round(r.width),
    wKadrze: r.left >= svg.left - 1 && r.right <= svg.right + 1 && r.top >= svg.top - 1 && r.bottom <= svg.bottom + 1,
    sciany: g.querySelectorAll('g[data-el="sciana"]').length,
    // blat pasa ramienia (przezroczysty) i nozki ramienia (przerywane)
    blaty: [...g.querySelectorAll('rect')].filter((q) => q.getAttribute('opacity') === '0.35').length,
    nozki: [...g.querySelectorAll('rect')].filter((q) => q.getAttribute('stroke-dasharray') === '6 4').length };
});
ok('ramię narysowane w prawdziwym położeniu', !!ramieWKadrze, JSON.stringify(ramieWKadrze));
ok('obrócone: wyższe niż szersze', !!ramieWKadrze && ramieWKadrze.wys > ramieWKadrze.szer, JSON.stringify(ramieWKadrze));
ok('mieści się w kadrze, z kawałkiem drugiej ściany', !!ramieWKadrze && ramieWKadrze.wKadrze && ramieWKadrze.sciany === 1,
  JSON.stringify(ramieWKadrze));
ok('nad ramieniem jest blat jego ściany', !!ramieWKadrze && ramieWKadrze.blaty >= 1, JSON.stringify(ramieWKadrze));
// ramie 630 mm: para przy rogu i para pod wolnym koncem (srodkowa dopiero od 900)
ok('ramię ma swoje 4 nóżki', !!ramieWKadrze && ramieWKadrze.nozki === 4, JSON.stringify(ramieWKadrze));
await page.getByRole('button', { name: 'Szafka', exact: true }).first().click().catch(() => {});
await page.waitForTimeout(500);

console.log('\n== ramię 1200: drzwi ramienia za szerokie, przyciski skracają ==');
/* Drzwi ramienia to ramie minus katownik w rogu z luzami. Powyzej 600 mm
   ostrzezenie z dwoma przyciskami: ramie na drzwi 600 i ramie 600. */
await uklad(567, { bottom: 0, top: null }, (p) => {
  const r = p.items.find((i) => i.cab.corner && i.cab.corner.on); r.cab.corner.arm = 1200;
  p.active = p.items.indexOf(r); });  // karta narożnika jest przy szafce narożnej
u = await uwagi();
const szerokie = u.find((x) => /drzwi ramienia mają/.test(x.t));
ok('ostrzeżenie o szerokich drzwiach ramienia', !!szerokie, u.map((x) => x.t.slice(0, 40)).join(' // '));
const naDrzwi600 = szerokie && szerokie.b.find((x) => /drzwi 600 mm/.test(x));
ok('przycisk „drzwi 600" i „ramię 600"', !!naDrzwi600 && szerokie.b.some((x) => /Skróć ramię do 600 mm/.test(x)),
  szerokie && szerokie.b.join(' | '));
if (naDrzwi600) {
  await page.getByRole('button', { name: naDrzwi600 }).first().click();
  await page.waitForTimeout(1400);
  const kartaR = await page.evaluate(() => document.body.innerText.split('\n').find((l) => /drzwi ramienia \d/.test(l)) || '');
  ok('po skróceniu drzwi ramienia mają 600', /drzwi ramienia 600 mm/.test(kartaR), kartaR.slice(0, 160));
  ok('ostrzeżenie znika', !(await uwagi()).some((x) => /drzwi ramienia mają/.test(x.t)));
}

console.log('\n== szafka narożna z góry: wymiary ramienia, blat i przycisk blatu ==');
await page.getByRole('button', { name: 'Z góry', exact: true }).first().click();
await page.waitForTimeout(900);
const wymR = await page.locator('g[data-el="wymiary-ramienia"] text').allTextContents();
ok('wymiar ramienia i całości z ramieniem', wymR.some((t) => /^ramię \d+/.test(t)) && wymR.some((t) => /z ramieniem/.test(t)),
  wymR.join(' | '));
ok('blat nad korpusem i nad ramieniem', await page.locator('g[data-el="blat-szafki"] rect').count() >= 2);
await page.getByRole('button', { name: 'Ukryj blat' }).first().click();
await page.waitForTimeout(500);
ok('„Ukryj blat" chowa blat', await page.locator('g[data-el="blat-szafki"]').count() === 0);
await page.getByRole('button', { name: 'Pokaż blat' }).first().click();
await page.waitForTimeout(500);

console.log('\n== 575: za mało wysięgu ==');
await uklad(572, { bottom: 0, top: null });
u = await uwagi();
const malo = u.find((x) => /wystaje przed drzwi tylko 5 mm/.test(x.t));
ok('uwaga: tylko 5 mm', !!malo, wysiegowe(u).map((x) => x.t.slice(0, 80)).join(' // '));
ok('to uwaga, nie ostrzeżenie', !!malo && !/wystawałby/.test(malo.t));
ok('podpowiada głębokość 567', !!malo && malo.b.some((x) => /567/.test(x)), malo && malo.b.join(' | '));

console.log('\n== szafka stojąca inaczej niż ciąg ==');
await uklad(567, { bottom: 0, top: null }, (p) => { p.items[0].wallGap = { bottom: 20, top: null }; });
u = await uwagi();
ok('uwaga o tej jednej szafce', u.some((x) => /Szafka „Zwykła" stoi 20 mm od ściany, inaczej niż reszta ciągu/.test(x.t)),
  u.map((x) => x.t.slice(0, 50)).join(' // '));
/* 20 + 570 + 2 + 18 = 610 do lica — arkusz 600 za waski, idzie 1200 na wymiar. */
bl = await blaty();
ok('blat liczy się z najgłębszej: 620', bl.length > 0 && bl[0].includes('620'), JSON.stringify(bl[0]));

console.log('\nBLEDY:', errors.length ? errors.join('; ') : '(brak)');
await b.close();
