/* Klapy (prosba uzytkownika 2026-09-28): front uchylny do gory (zawiasy na
   gornej krawedzi) albo opadany w dol (na dolnej), z podnosnikiem gazowym.
   - zawiasy te same co przy skrzydlach: 2, powyzej 900 mm szerokosci 3,
   - podnosniki/amortyzatory: 1, powyzej 600 mm domyslnie 2, do zmiany; jeden
     przy szerokosci ponad 600 — ostrzezenie,
   - sila klapy do gory z tabeli GTV PD-G00 (waga frontu na jeden podnosnik,
     wysokosc frontu, kat), klapy w dol z tabeli amortyzatora GTV PD-ECGDL,
   - UI: najpierw „skrzydło / klapa”, dopiero przy klapie „do góry / w dół”,
   - formatka „Klapa” zamiast „Drzwi”, klapa na rysunku i w bryle,
   - (2026-10-17) strona jednego podnosnika, polka na drodze podnosnika,
     zawias polnakladany osobno (klapa pod polka, drzwi na przegrodzie). */
import pw from './pw.mjs';
const URL = process.env.STD ? 'http://127.0.0.1:5199/standalone-local.html'
  : 'http://127.0.0.1:5205/mebloprojekt-app.html';
const ok = (l, c, e = '') => console.log((c ? '  OK   ' : '  BLAD ') + l + (e ? ' — ' + e : ''));
const b = await pw.chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const page = await (await b.newContext({ viewport: { width: 1500, height: 1300 } })).newPage();
const errors = []; page.on('pageerror', (e) => errors.push(e.message));
await page.goto(URL, { waitUntil: 'networkidle' });

// ta sama tabela co w aplikacji — test liczy oczekiwana sile niezaleznie
const GTV90 = { 50: [1.5, 1.1, 0.9, 0.7], 60: [1.8, 1.3, 1.1, 0.9], 80: [2.4, 1.8, 1.4, 1.2],
  100: [3.0, 2.2, 1.8, 1.5], 120: [3.6, 2.7, 2.1, 1.8], 150: [4.1, 3.2, 2.3, 2.1] };
const ECGDL = { 60: GTV90[60], 80: GTV90[80], 150: GTV90[150] };
const oczekiwana = (h, kg, tab = GTV90) => {
  const W = [300, 400, 500, 600]; const hh = Math.max(300, Math.min(600, h));
  let i = 0; while (i < 2 && hh > W[i + 1]) i++;
  const t = (hh - W[i]) / 100;
  return Object.keys(tab).map(Number).find((f) => tab[f][i] + (tab[f][i + 1] - tab[f][i]) * t >= kg) || null;
};

const GORNA = (W, col = {}) => ({ name: 'K', active: 0, prices: {}, runs: [],
  items: [{ cab: { name: 'Górna', W, H: 360, D: 300, plinth: { on: false }, legs: { on: false }, hangerMode: 'listwa',
    levels: [{ h: null, cols: [{ kind: 'doors', doors: 1, w: null, ...col }] }] }, offset: 0 }] });
const seed = async (p) => {
  await page.evaluate((q) => { localStorage.clear(); localStorage.setItem('szafki:projekt', JSON.stringify(q)); }, p);
  await page.reload({ waitUntil: 'networkidle' }); await page.waitForTimeout(800);
};
const card = (re) => page.locator('section').filter({ has: page.locator('h2', { hasText: re }) }).first();
const wiersze = async (re) => (await card(re).count()) ? card(re).evaluate((sec) =>
  [...sec.querySelectorAll('tbody tr')].map((tr) => [...tr.querySelectorAll('td')].map((td) => td.innerText.trim()).join(' | '))) : [];
const okucia = () => wiersze(/^Produkty do zamówienia/);
const formatki = () => wiersze(/^Formatki do zamówienia/);
const ilosc = (rows, re) => { const r = rows.find((x) => re.test(x)); return r ? Number((r.split('|').pop() || '').trim().split(' ')[0]) : null; };
const uwagi = async () => (await card(/^Uwagi/).count() ? await card(/^Uwagi/).innerText() : '');
const zapis = () => page.evaluate(() => JSON.parse(localStorage.getItem('szafki:projekt')));

console.log('== klapa do góry 600: siła z tabeli GTV, jeden podnośnik, dwa zawiasy ==');
await seed(GORNA(600, { klapa: 'gora' }));
let u = await uwagi();
let hw = await okucia();
// sila z tabeli — w Produktach (podpowiedz w Uwagach usunieta, uzytkownik 2026-10-26: zbedna)
const wPodn = hw.find((r) => /^Podnośnik gazowy \d+ N/.test(r)) || '';
const mP = /^Podnośnik gazowy (\d+) N.*?(\d+) × (\d+) mm, ok\. ([\d,]+) kg/.exec(wPodn);
const m = mP && [mP[0], mP[2], mP[3], mP[4], String(ilosc(hw, /^Podnośnik gazowy/)), mP[1]];
console.log('     ' + (m ? m[0] : '(brak podnośnika w produktach)'));
ok('bez podpowiedzi o dobranym podnośniku w Uwagach', !/× podnośnik \d+ N \(tabela/.test(u), u.split('\n').filter((l) => /podnośnik/.test(l)).join(' / '));
ok('podnośnik dobrany w Produktach (siła, wymiar i waga klapy)', !!m, wPodn);
if (m) {
  const [, w, h, kg, ile, F] = m; const kgN = Number(kg.replace(',', '.'));
  ok('szerokość 600 → jeden podnośnik', ile === '1');
  ok(`siła zgodna z tabelą (${h} mm, ${kg} kg → ${oczekiwana(Number(h), kgN)} N)`, Number(F) === oczekiwana(Number(h), kgN), F);
  ok('waga ≈ szer × wys × 18 mm × 680 kg/m³', Math.abs(kgN - (w / 1000) * (h / 1000) * 0.018 * 680) < 0.06, kg);
}
ok('okucia: „Podnośnik gazowy N N” × 1', ilosc(hw, /^Podnośnik gazowy \d+ N/) === 1, hw.filter((r) => /Podnośnik|Zawias/.test(r)).join(' / '));
ok('okucia: 2 zawiasy', ilosc(hw, /^Zawias \|/) === 2 || ilosc(hw, /^Zawias/) === 2);
let fk = await formatki();
ok('formatka „Klapa”, bez „Drzwi”', fk.some((r) => /^Klapa/.test(r)) && !fk.some((r) => /^Drzwi/.test(r)), fk.filter((r) => /Klapa|Drzwi/.test(r)).join(' / '));
ok('na widoku z przodu jest klapa', await page.locator('#rysunek [data-el="klapa"]').count() >= 1);

console.log('\n== UI: najpierw skrzydło / klapa, potem kierunek ==');
const pole = page.locator('[data-el="klapa-kolumny"]');
ok('przy jednych drzwiach jest wybór frontu', await pole.count() === 1);
ok('przy klapie nie ma przełącznika strony zawiasu', await page.locator('[data-el="zawias-kolumny"]').count() === 0);
ok('przy klapie jest wybór „do góry / w dół”', await pole.getByText('w dół', { exact: true }).count() === 1);
await pole.getByText('w dół', { exact: true }).click(); await page.waitForTimeout(1500);
let p = await zapis();
ok('„w dół” zapisuje col.klapa = "dol"', p.items[0].cab.levels[0].cols[0].klapa === 'dol');
hw = await okucia();
const mA = /^Amortyzator do klapy opadanej (\d+) N.*?(\d+) × (\d+) mm, ok\. ([\d,]+) kg/.exec(hw.find((r) => /^Amortyzator do klapy opadanej \d+ N/.test(r)) || '');
const md = mA && [mA[0], mA[2], mA[3], mA[4], mA[1]];
console.log('     ' + (md ? md[0] : '(brak amortyzatora w produktach)'));
ok('klapa w dół: siła z tabeli PD-ECGDL', md && Number(md[4]) === oczekiwana(Number(md[2]), Number(md[3].replace(',', '.')), ECGDL), md && md[4]);
ok('okucia: „Amortyzator do klapy opadanej N N” × 1', ilosc(hw, /^Amortyzator do klapy opadanej \d+ N/) === 1, hw.filter((r) => /Amortyzator/.test(r)).join(' / '));
// sila z listy (2026-10-19), jak NL prowadnic — tylko te z karty producenta
await pole.locator('select[data-el="klapa-sila"]').selectOption('80'); await page.waitForTimeout(1500);
hw = await okucia();
ok('po wybraniu 80 → „Amortyzator do klapy opadanej 80 N” × 1', ilosc(hw, /^Amortyzator do klapy opadanej 80 N/) === 1, hw.filter((r) => /Amortyzator/.test(r)).join(' / '));
ok('siła z listy bez podpowiedzi w Uwagach', !/siła wybrana z listy/.test(await uwagi()));
await pole.getByText('skrzydło', { exact: true }).click(); await page.waitForTimeout(1500);
p = await zapis();
ok('„skrzydło” usuwa klapę, wraca przełącznik zawiasu, znika wybór kierunku', !p.items[0].cab.levels[0].cols[0].klapa
  && await page.locator('[data-el="zawias-kolumny"]').count() === 1 && await pole.getByText('w dół', { exact: true }).count() === 0);
fk = await formatki();
ok('formatka znów „Drzwi”', fk.some((r) => /^Drzwi/.test(r)) && !fk.some((r) => /^Klapa/.test(r)));
await pole.getByText('klapa', { exact: true }).click(); await page.waitForTimeout(1500);
p = await zapis();
ok('„klapa” bez wyboru kierunku zaczyna od „do góry”', p.items[0].cab.levels[0].cols[0].klapa === 'gora');

console.log('\n== klapa użytkownika: w dół 560 × 750 ==');
await seed({ ...GORNA(560), items: [{ ...GORNA(560).items[0], cab: { ...GORNA(560, { klapa: 'dol' }).items[0].cab, H: 754 } }] });
u = await uwagi();
ok('poza tabelą (ponad 600 mm) i za ciężka na 150 N, z uwagą o kącie 45°',
  /poza tabelą GTV PD-ECGDL/.test(u) && /za ciężka/.test(u) && /45°/.test(u), u.split('\n').filter((l) => /klapa/.test(l)).join(' / ').slice(0, 300));

console.log('\n== szeroka klapa: 900 → 2 podnośniki, 1000 → 3 zawiasy ==');
await seed(GORNA(900, { klapa: 'gora' }));
hw = await okucia();
ok('900: dwa podnośniki (auto), dwa zawiasy', ilosc(hw, /^Podnośnik gazowy/) === 2 && ilosc(hw, /^Zawias/) === 2,
  hw.filter((r) => /Podnośnik|Zawias/.test(r)).join(' / '));
await page.locator('[data-el="klapa-kolumny"]').getByText('1', { exact: true }).click(); await page.waitForTimeout(1500);
hw = await okucia();
u = await uwagi();
const cz = u.split('\n'); const iP = cz.findIndex((l) => /^podpowiedzi — nic nie trzeba/i.test(l.trim()));
const linia = cz.findIndex((l) => /dają się dwa/.test(l));
ok('ręcznie 1 podnośnik → 1 szt. i OSTRZEŻENIE „dają się dwa”', ilosc(hw, /^Podnośnik gazowy/) === 1 && linia >= 0 && (iP < 0 || linia < iP), `${linia} / ${iP}`);
await seed(GORNA(1000, { klapa: 'gora' }));
hw = await okucia();
ok('1000: trzy zawiasy', ilosc(hw, /^Zawias/) === 3, hw.filter((r) => /Zawias/.test(r)).join(' / '));

console.log('\n== ograniczenia z instrukcji GTV ==');
await seed({ ...GORNA(600, { klapa: 'gora' }), items: [{ ...GORNA(600).items[0], cab: { ...GORNA(600, { klapa: 'gora' }).items[0].cab, H: 720 } }] });
u = await uwagi();
ok('klapa wyższa niż 600 → ostrzeżenie „poza tabelą GTV”', /poza tabelą GTV/.test(u));
await seed({ ...GORNA(600, { klapa: 'gora' }), items: [{ ...GORNA(600).items[0], cab: { ...GORNA(600, { klapa: 'gora' }).items[0].cab, H: 285 } }] });
u = await uwagi();
ok('klapa niższa niż 290 → ostrzeżenie o miejscu na podnośnik', /co najmniej 290 mm/.test(u));
// H250: plytka podnosnika wypada pod bokiem — blad zamiast ostrzezenia (audyt GPT N74)
await seed({ ...GORNA(600, { klapa: 'gora' }), items: [{ ...GORNA(600).items[0], cab: { ...GORNA(600, { klapa: 'gora' }).items[0].cab, H: 250 } }] });
u = await uwagi();
ok('klapa 250: płytka podnośnika poza płytą → błąd z radą, bez ostrzeżenia 290', /płytka podnośnika GTV PD-G00 wypada poza płytą/.test(u) && /podwyższ poziom o \d+ mm/.test(u) && !/co najmniej 290 mm/.test(u));

console.log('\n== bryła 3D otwarta ==');
await seed(GORNA(600, { klapa: 'gora' }));
const pick = async (l) => { const x = page.getByRole('button', { name: l, exact: true }); if (await x.count()) { await x.first().click(); await page.waitForTimeout(300); } };
await pick('3D'); await pick('Otw.');
ok('3D z otwartą klapą bez błędów strony', errors.length === 0, errors.join('; '));

console.log('\n== zawiasy klapy: ręcznie 2–4, tyle punktów co w zamówieniu (audyt GPT B2) ==');
/* Uzytkownik 2026-10-16: 2, 3 albo 4 zawiasy, rozstaw jak w drzwiach (100 mm od
   krawedzi, reszta rowno); przy 3+ zawiasach i odstepie ponizej 600 mm —
   ostrzezenie „za duzo zawiasow” z przyciskiem. Wczesniej 4 wpisane dawaly
   4 w zamowieniu i 3 punkty, 1 wpisany — 1 w zamowieniu i 2 punkty. */
const wierceniaKlapy = async () => {
  await page.evaluate(() => { window.__rep = null; window.print = () => {
    const t = [...document.querySelectorAll('.print-only table')].find((x) => /Otwory pod/.test(x.querySelector('thead')?.textContent || ''));
    window.__rep = t ? [...t.querySelectorAll('tbody tr')].map((tr) => [...tr.children].map((x) => x.textContent.trim())) : []; }; });
  await page.getByRole('button', { name: 'Zestawienie PDF', exact: true }).first().click(); await page.waitForTimeout(1000);
  return ((await page.evaluate(() => window.__rep)) || []).filter((r) => /zawias klapy/.test(r[1]))
    .reduce((a, r) => a + r[2].split(',').filter((x) => x.trim()).length, 0);
};
for (const [n, zam] of [[1, 2], [2, 2], [3, 3], [4, 4], [5, 4]]) {
  await seed(GORNA(1300, { klapa: 'gora', hinges: [n] }));
  hw = await okucia();
  const pkt = await wierceniaKlapy();
  ok(`wpisano ${n}: zamówienie ${zam}, plan wierceń ${zam} pkt`, ilosc(hw, /^Zawias/) === zam && pkt === zam, `zamówienie ${ilosc(hw, /^Zawias/)}, punkty ${pkt}`);
  if (n === 1 || n === 5) {
    u = await uwagi();
    ok(`wpisano ${n}: błąd „klapa ma ${n === 1 ? 'co najmniej 2' : 'najwyżej 4'} zawiasy”`, new RegExp(`klapa ma ${n === 1 ? 'co najmniej 2' : 'najwyżej 4'} zawiasy, a wpisano ${n}`).test(u));
  }
}
await seed(GORNA(1300, { klapa: 'gora', hinges: [4] }));
u = await uwagi();
ok('klapa ok. 1300 z 4 zawiasami (co ok. 365 mm): ostrzeżenie „za dużo zawiasów”, wystarczą 3', /za dużo zawiasów — klapa \d+ mm ma 4 zawiasy co ok\. \d+ mm.*wystarczą 3/.test(u),
  u.split('\n').filter((l) => /zawias/.test(l)).join(' / ').slice(0, 240));
await card(/^Uwagi/).getByRole('button', { name: 'Ustaw 3 zawiasy' }).first().click(); await page.waitForTimeout(1200);
const zp = await page.evaluate(() => JSON.parse(localStorage.getItem('szafki:projekt')));
ok('„Ustaw 3 zawiasy” zapisuje 3', (zp.items[0].cab.levels[0].cols[0].hinges || [])[0] === 3, JSON.stringify(zp.items[0].cab.levels[0].cols[0].hinges));
await seed(GORNA(600, { klapa: 'gora' }));
ok('klapa 600 z automatu (2 zawiasy): bez ostrzeżenia o odstępie', !/za dużo zawiasów/.test(await uwagi()));
console.log('\n== drzwi: liczba zawiasów wg tabeli GTV (katalog 2023 s. 68) ==');
/* Uzytkownik 2026-10-16: liczba z automatu wg tabeli GTV — wieksza z liczb z
   wysokosci (750 / 1500 / 2100 / 2500 mm) i wagi frontu (6 / 12 / 17 / 20 kg),
   front do 600 mm szerokosci. Wpisana recznie inna niz w tabeli — „za duzo” /
   „za malo zawiasow wg tabeli GTV” z przyciskiem. Front ponad tabele —
   ostrzezenie, ze liczba orientacyjna. */
const DRZWI = (W, H, col = {}) => ({ name: 'D', active: 0, prices: {}, runs: [], items: [{ cab: { name: 'D', W, H, D: 560,
  plinth: { on: true, height: 100, mode: 'under', setback: 0 },
  levels: [{ h: null, cols: [{ kind: 'doors', doors: 1, w: null, ...col }] }] }, offset: 0 }] });
const linieZaw = (t) => t.split('\n').filter((l) => /zawias/i.test(l)).join(' / ').slice(0, 300);
// front drzwi = wysokosc szafki − 6 mm (cokol pod szafka nie zjada frontu)
/* Liczba z wagi frontu (uzytkownik 2026-10-24: „jak waga pozwala, nie dajemy wiecej
   zawiasow, nawet gdy tabela wymiarow pokazuje wiecej”): 496 × 994 mm ok. 6,0 kg → 3,
   1694 ok. 10,3 kg → 3, 2094 ok. 12,7 kg → 4, 2194 ok. 13,3 kg → 4. */
for (const [H, zaw, opis] of [[720, 2, 'front 714 mm'], [1000, 3, 'front 994 mm (ok. 6 kg)'],
  [1700, 3, 'front 1694 mm (ok. 10,3 kg)'], [2100, 4, 'front 2094 mm'], [2200, 4, 'front 2194 mm (ok. 13,3 kg)']]) {
  await seed(DRZWI(500, H));
  hw = await okucia(); u = await uwagi();
  ok(`drzwi ${opis}: ${zaw} zawiasy z automatu, bez ostrzeżenia o zawiasach`, ilosc(hw, /^Zawias/) === zaw && !/zawiasów wg tabeli GTV|poza tabelą zawiasów/.test(u),
    `zamówienie ${ilosc(hw, /^Zawias/)}; ${linieZaw(u)}`);
}
// dymek pola „zawiasy” opisuje te same progi (audyt GPT N1: zostal stary opis 1400 / 2000 mm)
const dymek = await page.evaluate(() => [...document.querySelectorAll('[title^="Liczba zawiasów"]')].map((x) => x.getAttribute('title')));
ok('dymek „Liczba zawiasów” mówi o tabeli GTV i wadze frontu, bez starych progów 1400 / 2000 mm', dymek.length > 0 && dymek.every((t) => /tabeli GTV/.test(t) && /z wagi frontu/.test(t) && /6 kg/.test(t) && !/1400|2000 mm|zawsze dwa/.test(t)), dymek.join(' / '));
await seed(DRZWI(500, 720, { hinges: [3] }));
u = await uwagi();
ok('drzwi 714 mm z 3 zawiasami: „za dużo zawiasów wg tabeli GTV — 3 zamiast 2 (front 496 × 714 mm, ok. 4,3 kg)”', /skrzydło 1: za dużo zawiasów wg tabeli GTV — 3 zamiast 2 \(front 496 × 714 mm, ok\. 4,3 kg\)/.test(u), linieZaw(u));
await card(/^Uwagi/).getByRole('button', { name: 'Ustaw 2 zawiasy' }).first().click(); await page.waitForTimeout(1200);
ok('„Ustaw 2 zawiasy” zapisuje 2', ((await zapis()).items[0].cab.levels[0].cols[0].hinges || [])[0] === 2,
  JSON.stringify((await zapis()).items[0].cab.levels[0].cols[0].hinges));
await seed(DRZWI(500, 1000, { hinges: [2] }));
u = await uwagi();
ok('drzwi 994 mm z 2 zawiasami: „za mało zawiasów wg tabeli GTV — 2 zamiast 3”', /skrzydło 1: za mało zawiasów wg tabeli GTV — 2 zamiast 3/.test(u), linieZaw(u));
await seed(DRZWI(500, 1700, { hinges: [4] }));
ok('drzwi 1694 mm (ok. 10,3 kg) z 4 zawiasami: „za dużo … 4 zamiast 3. Waga ok. 10,3 kg — wystarczą 3 (do 12 kg)”', /za dużo zawiasów wg tabeli GTV — 4 zamiast 3 \(front 496 × 1694 mm, ok\. 10,3 kg\)\. Waga ok\. 10,3 kg — wystarczą 3 \(do 12 kg\)/.test(await uwagi()), linieZaw(await uwagi()));
// trzeci zawias z samej wagi: front 25 mm, 596 × 714 mm — ok. 7,2 kg (> 6 kg), choc wysokosc ponizej 750
{
  const ciezki = DRZWI(600, 720); ciezki.items[0].mat = { front: { thickness: 25 } }; ciezki.items[0].cab.frontSameAsBoard = false;
  await seed(ciezki);
  hw = await okucia(); u = await uwagi();
  const lekki = DRZWI(600, 720); lekki.items[0].cab.levels[0].cols[0].hinges = [3];
  ok('front 596 × 714 mm z płyty 25 mm (ok. 7,2 kg): 3 zawiasy z samej wagi, bez ostrzeżenia', ilosc(hw, /^Zawias/) === 3 && !/zawiasów wg tabeli GTV|poza tabelą/.test(u), `zamówienie ${ilosc(hw, /^Zawias/)}; ${linieZaw(u)}`);
  await seed(lekki);
  ok('ten sam front z płyty 18 mm (ok. 5,2 kg) i 3 wpisane: „za dużo … 3 zamiast 2”', /za dużo zawiasów wg tabeli GTV — 3 zamiast 2 \(front 596 × 714 mm, ok\. 5,2 kg\)/.test(await uwagi()), linieZaw(await uwagi()));
}
await seed(DRZWI(704, 720));
u = await uwagi();
ok('drzwi szersze niż 600 mm: „poza tabelą zawiasów GTV”, liczba orientacyjna', /skrzydło 1: front 700 × 714 mm, ok\. 6,1 kg — poza tabelą zawiasów GTV \(front do 600 mm szerokości/.test(u), linieZaw(u));
await seed(DRZWI(500, 2700));
hw = await okucia(); u = await uwagi();
ok('drzwi 2694 mm (ponad 2500, ok. 16,4 kg): 4 zawiasy z wagi i „poza tabelą”', ilosc(hw, /^Zawias/) === 4 && /poza tabelą zawiasów GTV/.test(u), `zamówienie ${ilosc(hw, /^Zawias/)}; ${linieZaw(u)}`);

console.log('\n== zawias przesunięty przez półkę: ostrzeżenie + notatka montażowa ==');
/* Uzytkownik 2026-10-16: ostrzezenie zostaje, a do tego notatka montazowa —
   linia sama w PDF na stronie szafki i przycisk „Dopisz do notatki montażowej”. */
// 1200 mm: dwa skrzydla po 597 mm (ok. 6,5 kg) — 3 zawiasy z wagi, srodkowy trafia w polke
await seed({ name: 'N', active: 0, prices: {}, runs: [], items: [{ cab: { name: 'N', W: 1200, H: 900, D: 500,
  plinth: { on: true, height: 100, mode: 'under', setback: 0 } }, offset: 0 }] });
u = await uwagi();
ok('drzwi 894 mm: 3 zawiasy, środkowy przesunięty przez półkę — ostrzeżenie zostaje', /skrzydło 1: zawias przesunięty z 447 na 381 mm od dołu frontu/.test(u), linieZaw(u));
const btnNot = card(/^Uwagi/).getByRole('button', { name: 'Dopisz do notatki montażowej' });
ok('przycisk „Dopisz do notatki montażowej” przy każdym przesuniętym zawiasie', (await btnNot.count()) === 2, String(await btnNot.count()));
await btnNot.first().click(); await page.waitForTimeout(800);
let notatka = (await zapis()).items[0].cab.note || '';
ok('kliknięcie dopisuje linię do notatki szafki', /skrzydło 1: zawias 381 mm od dołu frontu \(nie 447\) — przesunięty przez kolizję z półką, 30 mm luzu\./.test(notatka), notatka);
ok('po dopisaniu ten przycisk znika, drugi zostaje', (await btnNot.count()) === 1, String(await btnNot.count()));
await btnNot.first().click(); await page.waitForTimeout(800);
notatka = (await zapis()).items[0].cab.note || '';
ok('drugi dopisuje się w nowej linii', notatka.split('\n').length === 2 && /skrzydło 2/.test(notatka.split('\n')[1]), JSON.stringify(notatka));
await page.evaluate(() => { window.print = () => { window.__notZaw = [...document.querySelectorAll('[data-el="notatka-zawiasy"]')].map((x) => x.textContent); }; });
await page.getByRole('button', { name: 'Zestawienie PDF', exact: true }).first().click(); await page.waitForTimeout(1000);
const pdfZaw = (await page.evaluate(() => window.__notZaw)) || [];
ok('PDF: na stronie szafki „Zawiasy przesunięte” z oboma skrzydłami (bez klikania)', new Set(pdfZaw).size === 1 && /381 mm od dołu frontu \(nie 447\)/.test(pdfZaw[0]) && /skrzydło 2/.test(pdfZaw[0]), pdfZaw.join(' / '));
await seed(DRZWI(500, 720));
await page.evaluate(() => { window.print = () => { window.__notZaw = [...document.querySelectorAll('[data-el="notatka-zawiasy"]')].map((x) => x.textContent); }; });
await page.getByRole('button', { name: 'Zestawienie PDF', exact: true }).first().click(); await page.waitForTimeout(1000);
ok('PDF: bez przesuniętych zawiasów — bez tej linii', !((await page.evaluate(() => window.__notZaw)) || []).length);

console.log('\n== klapa w 3D do wybranego kąta (audyt GPT U1) ==');
/* Uzytkownik 2026-10-16: bryla klapy otwiera sie do wybranego kata (75/90/100°),
   a nie zawsze do 90°. */
// suwak 3D na 110° — klapa idzie za nim, ale najwyzej do swojego kata
const frontKlapy = async (kat) => {
  await seed(GORNA(600, { klapa: 'gora', katKlapy: kat }));
  await pick('Szafka'); await pick('Zamk.'); await pick('3D');
  await pick('zamknięte');   // przelacznik: otwiera (od 90°)
  const suwak = page.locator('input[type=range][max="110"]').first();
  await page.evaluate(() => { window.__audytBryl = []; });
  if (await suwak.count()) await suwak.fill('110');
  await page.waitForTimeout(400);
  return page.evaluate(() => (window.__audytBryl || []).filter((b) => b.p && b.tag !== 'uchwyt').map((b) => b.p.map(Math.round).join(',')));
};
const b90 = await frontKlapy(90), b100 = await frontKlapy(100);
const tylko100 = b100.filter((x) => !b90.includes(x));
ok('suwak 110°: klapa ustawiona na 100° otwiera się dalej niż ustawiona na 90°', tylko100.length > 0, `${tylko100.length} brył różnych z ${b100.length}`);

console.log('\n== zabudowa: klapa w ciągu górnym, bryła otwarta ==');
const RUN = (id, o = {}) => ({ id, name: 'Górne', wallW: null, gap: 0, mountY: 1358, H: 360, D: 300, plinth: null, worktop: false, corner: null, ...o });
await seed({ name: 'Z', active: 0, prices: {}, runs: [RUN('c1', { tier: 'gorny' })],
  items: [{ ...GORNA(600, { klapa: 'gora' }).items[0], runId: 'c1' }, { ...GORNA(800, { klapa: 'dol' }).items[0], runId: 'c1' }] });
await pick('Zabudowa'); await pick('3D'); await pick('zamknięte');
ok('bryła zabudowy z otwartymi klapami bez błędów strony', errors.length === 0, errors.join('; '));

/* Decyzje uzytkownika 2026-10-17: jeden podnosnik — strona do wyboru przy
   klapie (domyslnie lewa); polka przy podnosniku min. 50 mm za frontem tylko
   wtedy, gdy naprawde stoi tam, gdzie podnosnik (od plytki na boku do mocowania
   na klapie); zawias polnakladany osobna pozycja, gdzie dwa fronty dziela plyte. */
const wierc = async () => {
  await page.evaluate(() => { window.__rep = null; window.print = () => {
    const t = [...document.querySelectorAll('.print-only .rp-page table')].find((x) => /Otwory pod/.test(x.querySelector('thead')?.textContent || ''));
    window.__rep = t ? [...t.querySelectorAll('tbody tr')].map((tr) => [...tr.children].map((x) => x.textContent.trim())) : [];
  }; });
  await page.getByRole('button', { name: 'Zestawienie PDF', exact: true }).first().click(); await page.waitForTimeout(1000);
  let panel = '';
  return ((await page.evaluate(() => window.__rep)) || []).map((r) => { if (r[0]) panel = r[0]; return { panel, kind: r[1], note: r[3] }; });
};
const SZAFKA = (cab) => ({ name: 'K', active: 0, prices: {}, runs: [], items: [{ cab: { name: 'K', W: 600, H: 720, D: 560,
  plinth: { on: true, height: 100, mode: 'under', setback: 0 }, ...cab }, offset: 0 }] });

console.log('\n== jeden podnośnik: strona do wyboru ==');
await seed(GORNA(600, { klapa: 'gora' }));
let wr = (await wierc()).filter((r) => r.kind === 'podnośnik klapy');
ok('domyślnie na lewym boku', wr.some((r) => r.panel === 'Bok lewy') && !wr.some((r) => r.panel === 'Bok prawy'), wr.map((r) => r.panel).join(', '));
await page.locator('[data-el="klapa-strona"]').getByRole('button', { name: 'na prawym' }).click(); await page.waitForTimeout(900);
ok('zapis: podnosnikStrona = right', (await zapis()).items[0].cab.levels[0].cols[0].podnosnikStrona === 'right');
wr = (await wierc()).filter((r) => r.kind === 'podnośnik klapy');
ok('„na prawym”: płytka na prawym boku, mocowanie od prawej krawędzi klapy',
  wr.some((r) => r.panel === 'Bok prawy') && !wr.some((r) => r.panel === 'Bok lewy') && wr.some((r) => r.panel === 'Klapa' && /od prawej krawędzi/.test(r.note)),
  wr.map((r) => `${r.panel}: ${r.note.slice(0, 50)}`).join(' | '));
await seed(GORNA(800, { klapa: 'gora' }));
ok('dwa podnośniki: bez pola strony', await page.locator('[data-el="klapa-strona"]').count() === 0);

console.log('\n== półka na drodze podnośnika ==');
const naDrodze = async () => (await uwagi()).split('\n').filter((l) => /na drodze (podnośnika|amortyzatora)/.test(l));
await seed(SZAFKA({ levels: [{ h: null, cols: [{ w: null, kind: 'doors', doors: 1, klapa: 'gora', shelfTargets: [null, null] }] }] }));
ok('półka w połowie (pod płytką podnośnika) — bez uwagi', !(await naDrodze()).length, (await naDrodze()).join(' // '));
await seed(SZAFKA({ levels: [{ h: null, cols: [{ w: null, kind: 'doors', doors: 1, klapa: 'gora', shelfTargets: [null, null, null] }] }] }));
let nd = await naDrodze();
ok('druga z dwóch półek w zasięgu podnośnika — uwaga', nd.length === 1 && /półka 2 \(od dołu\) stoi na drodze podnośnika/.test(nd[0]) && /co najmniej 50 mm/.test(nd[0]), nd.join(' // '));
await card(/^Uwagi/).getByRole('button', { name: 'Dodatkowe cofnięcie półek 50 mm' }).click(); await page.waitForTimeout(900);
ok('przycisk: cofnięcie półek 50 mm, uwaga znika', (await zapis()).items[0].cab.shelfExtraSetback === 50 && !(await naDrodze()).length, (await naDrodze()).join(' // '));
await seed(SZAFKA({ levels: [{ h: null, cols: [{ w: null, kind: 'doors', doors: 1, klapa: 'dol', shelfTargets: [null, null, null] }] }] }));
nd = await naDrodze();
ok('klapa w dół: dolna półka w zasięgu amortyzatora', nd.length === 1 && /półka 1 \(od dołu\) stoi na drodze amortyzatora/.test(nd[0]), nd.join(' // '));

console.log('\n== zawias półnakładany ==');
const zaw = (rows) => ({ n: ilosc(rows, /^Zawias \| nakładany/), p: ilosc(rows, /^Zawias \| półnakładany/) });
await seed(SZAFKA({ W: 900, levels: [{ h: null, cols: [{ w: null, kind: 'doors', doors: 1, hinge: 'left' }, { w: null, kind: 'doors', doors: 1, hinge: 'left' }] }] }));
let z = zaw(await okucia());
ok('drzwi drugiej kolumny na przegrodzie: 2 nakładane + 2 półnakładane', z.n === 2 && z.p === 2, JSON.stringify(z));
await seed(SZAFKA({ W: 900, levels: [{ h: null, cols: [{ w: null, kind: 'doors', doors: 1, hinge: 'left' }, { w: null, kind: 'doors', doors: 1, hinge: 'right' }] }] }));
z = zaw(await okucia());
ok('obie na bokach: 4 nakładane, bez półnakładanych', z.n === 4 && z.p === null, JSON.stringify(z));
await seed(SZAFKA({ H: 1400, levels: [{ h: 400, cols: [{ w: null, kind: 'doors', doors: 1, klapa: 'gora' }] }, { h: null, cols: [{ w: null, kind: 'doors', doors: 1 }] }] }));
z = zaw(await okucia());
ok('klapa pod półką, drzwi nad nią: zawiasy klapy półnakładane (2), drzwi nakładane (3)', z.n === 3 && z.p === 2, JSON.stringify(z));
wr = (await wierc()).filter((r) => r.kind === 'podnośnik klapy' && /^Poziom 1 — Bok/.test(r.panel));
ok('podnośnik tej klapy z wiersza „bliźniaczy” (242 mm)', wr.length === 1 && /bliźniaczy.*242 mm/.test(wr[0].note), wr.map((r) => r.note.slice(0, 120)).join(' | '));

/* Opisy przy klapie (uzytkownik 2026-10-19): uchwyt „na dole / na górze” (nie
   „na boku”), „klapa” zamiast „drzwi 1”, „fronty” zamiast „drzwi”, siła z polem
   w jednej linii (pole bez opisu przy kącie), z boku „z klapą”. */
console.log('\n== opisy przy klapie ==');
await seed(GORNA(600, { klapa: 'gora' }));
const kolumna = card(/^Struktura wnętrza/);
const tekst = await kolumna.innerText();
ok('„fronty” i „klapa” zamiast „drzwi” / „drzwi 1”', /\bfronty\b/.test(tekst) && /\nklapa\n/.test(tekst) && !/drzwi 1/.test(tekst), tekst.replace(/\n/g, ' | ').slice(0, 300));
const ku = page.locator('[data-el="klapa-uchwyt"]');
ok('uchwyt klapy: „dole / górze”, bez „boku”', (await ku.innerText()).replace(/\s+/g, ' ').trim() === 'dole górze' && !/boku/.test(await page.locator('[data-el="drzwi-uchwyt"]').innerText()),
  await ku.innerText());
const liniaSily = await page.evaluate(() => {
  const pole = document.querySelector('[data-el="klapa-sila"]').getBoundingClientRect();
  const etyk = [...document.querySelectorAll('[data-el="klapa-kolumny"] span')].find((x) => x.textContent.trim() === 'siła').getBoundingClientRect();
  return Math.abs((pole.top + pole.bottom) / 2 - (etyk.top + etyk.bottom) / 2);
});
ok('„siła” i jej pole w jednej linii', liniaSily < 6, String(liniaSily));
await pick('Szafka'); await pick('Zamk.');
const uchY = async () => page.evaluate(() => { const r = document.querySelector('#rysunek [data-el^="uchwyt-klapy-"]'); if (!r) return null;
  const b = r.getBoundingClientRect(), f = r.ownerSVGElement.getBoundingClientRect(); return { el: r.getAttribute('data-el'), wzgl: (b.top - f.top) / f.height }; });
let uy = await uchY();
ok('do góry: uchwyt domyślnie na dole', !!uy && uy.el === 'uchwyt-klapy-dol' && uy.wzgl > 0.5, JSON.stringify(uy));
await ku.getByRole('button', { name: 'górze' }).click(); await page.waitForTimeout(700);
uy = await uchY();
ok('„na górze”: uchwyt na górnej krawędzi', !!uy && uy.el === 'uchwyt-klapy-gora' && uy.wzgl < 0.5, JSON.stringify(uy));
// autozapis przychodzi z opoznieniem — czekamy na niego
await page.waitForFunction(() => JSON.parse(localStorage.getItem('szafki:projekt')).items[0].cab.levels[0].cols[0].klapaUchwyt === 'gora', null, { timeout: 5000 }).catch(() => {});
ok('zapis: klapaUchwyt = gora', (await zapis()).items[0].cab.levels[0].cols[0].klapaUchwyt === 'gora');
await ku.getByRole('button', { name: 'dole' }).click(); await page.waitForTimeout(700);
await page.waitForFunction(() => !('klapaUchwyt' in JSON.parse(localStorage.getItem('szafki:projekt')).items[0].cab.levels[0].cols[0]), null, { timeout: 5000 }).catch(() => {});
ok('powrót do domyślnej krawędzi nie zostawia pola w zapisie', !('klapaUchwyt' in (await zapis()).items[0].cab.levels[0].cols[0]));
await seed(GORNA(600, { klapa: 'dol' }));
await pick('Szafka'); await pick('Zamk.');
uy = await uchY();
ok('w dół: uchwyt domyślnie na górze', !!uy && uy.el === 'uchwyt-klapy-gora' && uy.wzgl < 0.5, JSON.stringify(uy));
await pick('Z boku');
const boki = await page.evaluate(() => [...document.querySelectorAll('#rysunek svg text')].map((t) => t.textContent));
ok('z boku: „z klapą”, nie „z drzwiami”', boki.some((t) => /^z klapą \d+/.test(t)) && !boki.some((t) => /z drzwiami/.test(t)), boki.join(' · '));

/* Sila z listy (uzytkownik 2026-10-19: „jak prowadnice szuflad”): tylko sily
   z karty producenta — PD-G00 50/60/80/100/120/150 N, PD-ECGDL 60/80/150 N;
   auto = najslabsza, ktora uniesie klape; przy kazdej udzwig i „za słaby”;
   slabsza od tabeli — ostrzezenie z przyciskiem powrotu do auto. */
console.log('\n== siła z listy ==');
await seed(GORNA(600, { klapa: 'gora' }));
const lista = async () => page.locator('select[data-el="klapa-sila"] option').evaluateAll((o) => o.map((x) => ({ v: x.value, t: x.textContent.trim() })));
let ls = await lista();
ok('do góry: auto + 50, 60, 80, 100, 120, 150 N', ls.length === 7 && ls.slice(1).map((o) => o.v).join() === '50,60,80,100,120,150', ls.map((o) => o.t).join(' | '));
const autoN = Number((/auto \((\d+) N\)/.exec(ls[0].t) || [])[1]);
// wymiar i waga klapy — z Produktow (podpowiedz w Uwagach usunieta 2026-10-26)
const um = /(\d+) × (\d+) mm, ok\. ([\d,]+) kg/.exec((await okucia()).find((r) => /^Podnośnik gazowy \d+ N/.test(r)) || '');
ok(`auto = siła z tabeli GTV (${autoN} N)`, !!um && autoN === oczekiwana(Number(um[2]), Number(um[3].replace(',', '.'))), ls[0].t);
ok('słabsze od auto oznaczone „za słaby”, auto i mocniejsze bez', ls.slice(1).every((o) => (Number(o.v) < autoN) === /za słaby/.test(o.t)) && ls.slice(1).every((o) => /do ok\. [\d,]+ kg/.test(o.t)),
  ls.map((o) => o.t).join(' | '));
const slaby = ls.slice(1).find((o) => /za słaby/.test(o.t));
if (slaby) {
  await page.locator('select[data-el="klapa-sila"]').selectOption(slaby.v); await page.waitForTimeout(1200);
  u = await uwagi();
  ok(`wybrany ${slaby.v} N: ostrzeżenie „za słaby”`, new RegExp(`podnośnik ${slaby.v} N jest za słaby na tę klapę`).test(u) && new RegExp(`Z tabeli wychodzi ${autoN} N`).test(u), u.slice(0, 300));
  // „dołóż drugi albo zwiększ siłę” (uzytkownik 2026-10-19)
  const dolozBtn = card(/^Uwagi/).getByRole('button', { name: /^Dołóż drugi — 2 × \d+ N$/ });
  ok('przy za słabym: „Zwiększ siłę do … N” i „Dołóż drugi — 2 × … N”',
    await card(/^Uwagi/).getByRole('button', { name: `Zwiększ siłę do ${autoN} N` }).count() === 1 && await dolozBtn.count() === 1,
    (await card(/^Uwagi/).getByRole('button').allInnerTexts()).filter((t) => /Zwiększ|Dołóż/.test(t)).join(' | '));
  const dolozT = await dolozBtn.innerText();
  await dolozBtn.click(); await page.waitForTimeout(1200);
  await page.waitForFunction(() => JSON.parse(localStorage.getItem('szafki:projekt')).items[0].cab.levels[0].cols[0].silowniki === 2, null, { timeout: 5000 }).catch(() => {});
  let col0 = (await zapis()).items[0].cab.levels[0].cols[0];
  hw = await okucia();
  const n2 = Number((/2 × (\d+) N/.exec(dolozT) || [])[1]);
  ok(`„${dolozT}”: dwa podnośniki ${n2} N w okuciach, bez „za słaby”`, col0.silowniki === 2 && ilosc(hw, new RegExp(`^Podnośnik gazowy ${n2} N`)) === 2 && !/jest za słaby/.test(await uwagi()),
    JSON.stringify(col0) + ' / ' + hw.filter((r) => /Podnośnik/.test(r)).join(' / '));
  await seed(GORNA(600, { klapa: 'gora', silaN: Number(slaby.v) }));
  await card(/^Uwagi/).getByRole('button', { name: `Zwiększ siłę do ${autoN} N` }).click(); await page.waitForTimeout(1200);
  await page.waitForFunction(() => !('silaN' in JSON.parse(localStorage.getItem('szafki:projekt')).items[0].cab.levels[0].cols[0]), null, { timeout: 5000 }).catch(() => {});
  ok('przycisk „Auto”: siła wraca do tabeli, ostrzeżenie znika', !('silaN' in (await zapis()).items[0].cab.levels[0].cols[0]) && !/jest za słaby/.test(await uwagi()));
}
await page.locator('select[data-el="klapa-sila"]').selectOption('150'); await page.waitForTimeout(1200);
ok('mocniejszy (150 N): bez ostrzeżenia, w okuciach 150 N', !/jest za słaby/.test(await uwagi()) && ilosc(await okucia(), /^Podnośnik gazowy 150 N/) === 1);
await seed(GORNA(600, { klapa: 'dol' }));
ls = await lista();
ok('w dół: auto + 60, 80, 150 N (PD-ECGDL)', ls.length === 4 && ls.slice(1).map((o) => o.v).join() === '60,80,150', ls.map((o) => o.t).join(' | '));
await seed(GORNA(600, { klapa: 'gora', silaN: 90 }));
ls = await lista();
ok('starsza siła spoza karty (90 N) zostaje widoczna na liście', ls.some((o) => o.v === '90' && /spoza karty/.test(o.t)) && await page.locator('select[data-el="klapa-sila"]').inputValue() === '90', ls.map((o) => o.t).join(' | '));

console.log('\nBLEDY:', errors.length ? errors.join('; ') : '(brak)');
await b.close();
