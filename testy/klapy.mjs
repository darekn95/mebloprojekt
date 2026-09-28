/* Klapy (prosba uzytkownika 2026-09-28): front uchylny do gory (zawiasy na
   gornej krawedzi) albo opadany w dol (na dolnej), z podnosnikiem gazowym.
   - zawiasy puszkowe: 2, powyzej 900 mm szerokosci 3,
   - podnosniki: 1, powyzej 600 mm domyslnie 2, do zmiany na 1 albo 2,
   - sila klapy do gory z tabeli GTV PD-G00 (waga frontu na jeden podnosnik,
     wysokosc frontu, kat), klapy w dol — wpisana recznie,
   - formatka „Klapa” zamiast „Drzwi”, klapa na rysunku i w bryle. */
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
const oczekiwana = (h, kg) => {
  const W = [300, 400, 500, 600]; const hh = Math.max(300, Math.min(600, h));
  let i = 0; while (i < 2 && hh > W[i + 1]) i++;
  const t = (hh - W[i]) / 100;
  return [50, 60, 80, 100, 120, 150].find((f) => GTV90[f][i] + (GTV90[f][i + 1] - GTV90[f][i]) * t >= kg) || null;
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
const m = /klapa do góry (\d+) × (\d+) mm, ok\. ([\d,]+) kg — (\d) × podnośnik (\d+) N/.exec(u);
console.log('     ' + (m ? m[0] : '(brak uwagi o podnośniku)'));
ok('uwaga z dobranym podnośnikiem', !!m);
if (m) {
  const [, w, h, kg, ile, F] = m; const kgN = Number(kg.replace(',', '.'));
  ok('szerokość 600 → jeden podnośnik', ile === '1');
  ok(`siła zgodna z tabelą (${h} mm, ${kg} kg → ${oczekiwana(Number(h), kgN)} N)`, Number(F) === oczekiwana(Number(h), kgN), F);
  ok('waga ≈ szer × wys × 18 mm × 700 kg/m³', Math.abs(kgN - (w / 1000) * (h / 1000) * 0.018 * 700) < 0.06, kg);
}
let hw = await okucia();
ok('okucia: „Podnośnik gazowy N N” × 1', ilosc(hw, /^Podnośnik gazowy \d+ N/) === 1, hw.filter((r) => /Podnośnik|Zawias/.test(r)).join(' / '));
ok('okucia: 2 zawiasy', ilosc(hw, /^Zawias \|/) === 2 || ilosc(hw, /^Zawias/) === 2);
let fk = await formatki();
ok('formatka „Klapa”, bez „Drzwi”', fk.some((r) => /^Klapa/.test(r)) && !fk.some((r) => /^Drzwi/.test(r)), fk.filter((r) => /Klapa|Drzwi/.test(r)).join(' / '));
ok('na widoku z przodu jest klapa', await page.locator('#rysunek [data-el="klapa"]').count() >= 1);

console.log('\n== UI: przełącznik otwierania i podnośników ==');
const pole = page.locator('[data-el="klapa-kolumny"]');
ok('przy jednych drzwiach jest „otwieranie”', await pole.count() === 1);
ok('przy klapie nie ma przełącznika strony zawiasu', await page.locator('[data-el="zawias-kolumny"]').count() === 0);
await pole.getByText('klapa w dół', { exact: true }).click(); await page.waitForTimeout(1500);
let p = await zapis();
ok('„klapa w dół” zapisuje col.klapa = "dol"', p.items[0].cab.levels[0].cols[0].klapa === 'dol');
u = await uwagi();
ok('klapa w dół bez siły → uwaga „wpisz siłę siłownika” z wzorcem 80 N', /wpisz siłę siłownika/.test(u) && /80 N/.test(u));
hw = await okucia();
ok('okucia: „Siłownik do klapy opadanej — siła do dobrania”', hw.some((r) => /^Siłownik do klapy opadanej — siła do dobrania/.test(r)), hw.filter((r) => /Siłownik/.test(r)).join(' / '));
await pole.locator('[data-el="klapa-sila"] input').fill('80'); await page.waitForTimeout(1500);
hw = await okucia();
ok('po wpisaniu 80 → „Siłownik do klapy opadanej 80 N” × 1', ilosc(hw, /^Siłownik do klapy opadanej 80 N/) === 1, hw.filter((r) => /Siłownik/.test(r)).join(' / '));
ok('uwaga o braku siły znika', !/wpisz siłę siłownika/.test(await uwagi()));
await pole.getByText('skrzydło', { exact: true }).click(); await page.waitForTimeout(1500);
p = await zapis();
ok('„skrzydło” usuwa klapę, wraca przełącznik zawiasu', !p.items[0].cab.levels[0].cols[0].klapa
  && await page.locator('[data-el="zawias-kolumny"]').count() === 1);
fk = await formatki();
ok('formatka znów „Drzwi”', fk.some((r) => /^Drzwi/.test(r)) && !fk.some((r) => /^Klapa/.test(r)));

console.log('\n== szeroka klapa: 900 → 2 podnośniki, 1000 → 3 zawiasy ==');
await seed(GORNA(900, { klapa: 'gora' }));
hw = await okucia();
ok('900: dwa podnośniki (auto), dwa zawiasy', ilosc(hw, /^Podnośnik gazowy/) === 2 && ilosc(hw, /^Zawias/) === 2,
  hw.filter((r) => /Podnośnik|Zawias/.test(r)).join(' / '));
await page.locator('[data-el="klapa-kolumny"]').getByText('1', { exact: true }).click(); await page.waitForTimeout(1500);
hw = await okucia();
u = await uwagi();
ok('ręcznie 1 podnośnik → 1 szt. i podpowiedź „zwykle daje się dwa”', ilosc(hw, /^Podnośnik gazowy/) === 1 && /zwykle daje się dwa/.test(u));
await seed(GORNA(1000, { klapa: 'gora' }));
hw = await okucia();
ok('1000: trzy zawiasy', ilosc(hw, /^Zawias/) === 3, hw.filter((r) => /Zawias/.test(r)).join(' / '));

console.log('\n== ograniczenia z instrukcji GTV ==');
await seed({ ...GORNA(600, { klapa: 'gora' }), items: [{ ...GORNA(600).items[0], cab: { ...GORNA(600, { klapa: 'gora' }).items[0].cab, H: 720 } }] });
u = await uwagi();
ok('klapa wyższa niż 600 → ostrzeżenie „poza tabelą GTV”', /poza tabelą GTV/.test(u));
await seed({ ...GORNA(600, { klapa: 'gora' }), items: [{ ...GORNA(600).items[0], cab: { ...GORNA(600, { klapa: 'gora' }).items[0].cab, H: 250 } }] });
u = await uwagi();
ok('klapa niższa niż 290 → ostrzeżenie o miejscu na podnośnik', /co najmniej 290 mm/.test(u));

console.log('\n== bryła 3D otwarta ==');
await seed(GORNA(600, { klapa: 'gora' }));
const pick = async (l) => { const x = page.getByRole('button', { name: l, exact: true }); if (await x.count()) { await x.first().click(); await page.waitForTimeout(300); } };
await pick('3D'); await pick('Otw.');
ok('3D z otwartą klapą bez błędów strony', errors.length === 0, errors.join('; '));

console.log('\n== zabudowa: klapa w ciągu górnym, bryła otwarta ==');
const RUN = (id, o = {}) => ({ id, name: 'Górne', wallW: null, gap: 0, mountY: 1358, H: 360, D: 300, plinth: null, worktop: false, corner: null, ...o });
await seed({ name: 'Z', active: 0, prices: {}, runs: [RUN('c1', { tier: 'gorny' })],
  items: [{ ...GORNA(600, { klapa: 'gora' }).items[0], runId: 'c1' }, { ...GORNA(800, { klapa: 'dol', silaN: 80 }).items[0], runId: 'c1' }] });
await pick('Zabudowa'); await pick('3D'); await pick('zamknięte');
ok('bryła zabudowy z otwartymi klapami bez błędów strony', errors.length === 0, errors.join('; '));

console.log('\nBLEDY:', errors.length ? errors.join('; ') : '(brak)');
await b.close();
