/* Wysokosc blatow miedzy ciagami (uzytkownik 2026-10-21: „żeby blat nie przesunął
   się o 1–2 cm”):
   - narozne ciagi z blatem na innej wysokosci — ostrzezenie (audyt GPT N66) teraz
     z przyciskami „Wyrównaj cokołem i nóżkami” / „Wyrównaj wysokością szafek”,
   - ciagi tego samego pomieszczenia bez rogu (np. przeciwlegle sciany) — nowe
     ostrzezenie z tymi samymi przyciskami; inne pomieszczenie — bez uwagi,
   - przycisk cokolu zmienia cokol i nozki o te sama roznice (nozki nie wisza),
     wysokosci — tylko szafki pod blatem (slupek zostaje). */
import pw from './pw.mjs';
const URL = process.env.STD ? 'http://127.0.0.1:5199/standalone-local.html'
  : 'http://127.0.0.1:5205/mebloprojekt-app.html';
const ok = (l, c, e = '') => console.log((c ? '  OK   ' : '  BLAD ') + l + (e ? ' — ' + e : ''));
const b = await pw.chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const page = await (await b.newContext({ viewport: { width: 1500, height: 1300 } })).newPage();
const errors = []; page.on('pageerror', (e) => errors.push(e.message));
await page.goto(URL, { waitUntil: 'networkidle' });

const PL = (h = 100) => ({ on: true, height: h, mode: 'under', setback: 0 });
const RUN = (id, name, o = {}) => ({ id, name, wallW: null, gap: 0, mountY: 0, H: 720, D: 560, plinth: PL(), worktop: true, corner: null, ...o });
const rails = [{ orient: 'shelf', pos: 'top', side: 'left', h: 100, depth: 100, atDepth: 0, fromBack: false },
  { orient: 'front', pos: 'top', side: 'left', h: 100, depth: 100, atDepth: 0, fromBack: true }];
const CAB = (name, runId, o = {}) => ({ cab: { name, W: 600, H: 720, D: 560, plinth: PL(), legs: { on: true, height: 100 },
  levels: [{ h: null, cols: [{ w: null, kind: 'doors', doors: 2, rails }] }], ...o }, runId, offset: 0 });
const CORNER = { of: 'c1', at: 'end', owner: 'self', clear: 0 };
const seed = async (runs, items, active = 0, extra = {}) => {
  await page.evaluate((q) => { localStorage.clear(); localStorage.setItem('szafki:projekt', JSON.stringify(q)); }, { name: 'W', active, prices: {}, runs, items, ...extra });
  await page.reload({ waitUntil: 'networkidle' }); await page.waitForTimeout(1500);
};
const uwagi = page.locator('section').filter({ has: page.locator('h2', { hasText: /^Uwagi/ }) }).first();
const blatUwagi = async () => (await uwagi.count() ? (await uwagi.innerText()).split('\n') : []).filter((l) => /leży na \d+ mm/.test(l));
const zapis = () => page.evaluate(() => JSON.parse(localStorage.getItem('szafki:projekt')));
const czekajZapis = (fn, arg) => page.waitForFunction(fn, arg, { timeout: 5000 }).catch(() => {});
const naSzafke = async (nazwa) => { await page.locator('header div.rounded-full').filter({ hasText: nazwa }).first().getByRole('button', { name: nazwa, exact: true }).click(); await page.waitForTimeout(1200); };

console.log('== narożnik: drugi ciąg na cokole 110 (blat 10 mm wyżej) ==');
await seed([RUN('c1', 'A'), RUN('c2', 'B', { corner: CORNER, plinth: PL(110) })],
  [CAB('A1', 'c1'), CAB('B1', 'c2', { plinth: PL(110), legs: { on: true, height: 110 } })]);
let u = await blatUwagi();
ok('ostrzeżenie „A na 858, B na 868 — różnica 10 mm”', u.some((l) => /„A” leży na 858 mm, a blat „B” w rogu na 868 mm — różnica 10 mm/.test(l)), u.join(' // '));
ok('przyciski: cokołem i nóżkami (110 mm), wysokością szafek (730 mm)',
  await uwagi.getByRole('button', { name: 'Wyrównaj cokołem i nóżkami (110 mm)' }).count() === 1
  && await uwagi.getByRole('button', { name: 'Wyrównaj wysokością szafek (730 mm)' }).count() === 1);
await uwagi.getByRole('button', { name: 'Wyrównaj cokołem i nóżkami (110 mm)' }).click(); await page.waitForTimeout(1200);
await czekajZapis(() => JSON.parse(localStorage.getItem('szafki:projekt')).runs[0].plinth.height === 110);
let z = await zapis();
const a1 = z.items[0].cab;
ok('po kliknięciu: ciąg A i A1 — cokół 110, nóżki 110', z.runs[0].plinth.height === 110 && a1.plinth.height === 110 && a1.legs.height === 110, JSON.stringify({ run: z.runs[0].plinth.height, cok: a1.plinth.height, n: a1.legs.height }));
ok('ostrzeżenie znika', !(await blatUwagi()).length, (await blatUwagi()).join(' // '));

console.log('\n== narożnik: drugi ciąg 735 (15 mm wyżej), wyrównanie wysokością z jego strony ==');
await seed([RUN('c1', 'A'), RUN('c2', 'B', { corner: CORNER, H: 735 })], [CAB('A1', 'c1'), CAB('B1', 'c2', { H: 735 })], 1);
u = await blatUwagi();
ok('w B: ostrzeżenie o 15 mm i przycisk „wysokością szafek (720 mm)”', u.some((l) => /różnica 15 mm/.test(l))
  && await uwagi.getByRole('button', { name: 'Wyrównaj wysokością szafek (720 mm)' }).count() === 1, u.join(' // '));
await uwagi.getByRole('button', { name: 'Wyrównaj wysokością szafek (720 mm)' }).click(); await page.waitForTimeout(1200);
await czekajZapis(() => JSON.parse(localStorage.getItem('szafki:projekt')).items[1].cab.H === 720);
z = await zapis();
ok('B1 i ciąg B na 720, ostrzeżenie znika', z.items[1].cab.H === 720 && z.runs[1].H === 720 && !(await blatUwagi()).length, JSON.stringify({ H: z.items[1].cab.H, run: z.runs[1].H }));

console.log('\n== to samo pomieszczenie, bez narożnika: 20 mm różnicy ==');
await seed([RUN('c1', 'A'), RUN('c2', 'B', { H: 740 })], [CAB('A1', 'c1'), CAB('A2', 'c1'), CAB('B1', 'c2', { H: 740 })]);
u = await blatUwagi();
ok('w A: „blat „B” na 878 mm (różnica 20 mm)” — wyrównaj do 878', u.some((l) => /Blat ciągu „A” leży na 858 mm, a w tym pomieszczeniu blat „B” na 878 mm \(różnica 20 mm\).*wyrównaj do 878 mm/.test(l)), u.join(' // '));
await naSzafke('B1');
u = await blatUwagi();
ok('w B: to samo z drugiej strony (do 858 mm)', u.some((l) => /„B” leży na 878 mm, a w tym pomieszczeniu blat „A” na 858 mm \(różnica 20 mm\).*wyrównaj do 858 mm/.test(l)), u.join(' // '));
await uwagi.getByRole('button', { name: 'Wyrównaj cokołem i nóżkami (80 mm)' }).click(); await page.waitForTimeout(1200);
await czekajZapis(() => JSON.parse(localStorage.getItem('szafki:projekt')).items[2].cab.plinth.height === 80);
z = await zapis();
ok('B1: cokół i nóżki 80 → blat na 858, ostrzeżenie znika', z.items[2].cab.plinth.height === 80 && z.items[2].cab.legs.height === 80 && !(await blatUwagi()).length,
  JSON.stringify({ cok: z.items[2].cab.plinth.height, n: z.items[2].cab.legs.height }) + ' ' + (await blatUwagi()).join(' // '));
await naSzafke('A1');
ok('w A też bez ostrzeżenia', !(await blatUwagi()).length, (await blatUwagi()).join(' // '));

console.log('\n== słupek w ciągu nie zmienia się przy wyrównaniu wysokością ==');
await seed([RUN('c1', 'A'), RUN('c2', 'B', { H: 740 })], [CAB('A1', 'c1'), CAB('S', 'c1', { H: 2000 }), CAB('B1', 'c2', { H: 740 })]);
await uwagi.getByRole('button', { name: 'Wyrównaj wysokością szafek (740 mm)' }).click(); await page.waitForTimeout(1200);
await czekajZapis(() => JSON.parse(localStorage.getItem('szafki:projekt')).items[0].cab.H === 740);
z = await zapis();
ok('A1 na 740, słupek zostaje 2000', z.items[0].cab.H === 740 && z.items[1].cab.H === 2000, JSON.stringify(z.items.map((it) => it.cab.H)));

console.log('\n== różne pomieszczenia: bez ostrzeżenia ==');
await seed([RUN('c1', 'A', { roomId: 'p1' }), RUN('c2', 'B', { H: 740, roomId: 'p2' })], [CAB('A1', 'c1'), CAB('B1', 'c2', { H: 740 })], 0,
  { rooms: [{ id: 'p1', name: 'Kuchnia' }, { id: 'p2', name: 'Łazienka' }] });
ok('inne pomieszczenie — blaty mogą być na różnej wysokości', !(await blatUwagi()).length, (await blatUwagi()).join(' // '));

console.log('\nBLEDY:', errors.length ? errors.join('; ') : '(brak)');
await b.close();
