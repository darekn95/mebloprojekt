/* Nozki w ciagu (uzytkownik 2026-10-24): w karcie ciagu „Nóżki ciągu” jak cokol
   ciagu; zmiana nozek w szafce pyta, czy tak samo w calym ciagu (liczba nozek
   zostaje przy szafce — z jej szerokosci). Nowe pomieszczenie zaczyna od szafki
   na nozkach, bez cokolu. */
import pw from './pw.mjs';
const URL = process.env.STD ? 'http://127.0.0.1:5199/standalone-local.html'
  : 'http://127.0.0.1:5205/mebloprojekt-app.html';
const ok = (l, c, e = '') => console.log((c ? '  OK   ' : '  BLAD ') + l + (e ? ' — ' + e : ''));
const b = await pw.chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const page = await (await b.newContext({ viewport: { width: 1500, height: 1300 } })).newPage();
const errors = []; page.on('pageerror', (e) => errors.push(e.message));
await page.goto(URL, { waitUntil: 'networkidle' });

const BEZ = { on: false, height: 100, mode: 'under', setback: 0 };
const cab = (name, W, o = {}) => ({ name, W, H: 720, D: 560, plinth: BEZ, legs: { on: false, height: 100 },
  levels: [{ h: null, cols: [{ kind: 'doors', doors: 1, w: null, shelfTargets: [null, null] }] }], ...o });
const RUN = (o = {}) => ({ id: 'c1', name: 'Ściana 1', roomId: 'p1', wallW: null, gap: 0, mountY: 0, H: 720, D: 560,
  plinth: BEZ, worktop: false, corner: null, ...o });
const seed = async (items, run = RUN(), active = 0) => {
  await page.evaluate((q) => { localStorage.clear(); localStorage.setItem('szafki:projekt', JSON.stringify(q)); },
    { name: 'N', active, prices: {}, runs: [run], items: items.map((c) => ({ cab: c, runId: 'c1', offset: 0 })) });
  await page.reload({ waitUntil: 'networkidle' }); await page.waitForTimeout(1200);
};
const zap = async () => { await page.waitForTimeout(1000); return page.evaluate(() => JSON.parse(localStorage.getItem('szafki:projekt'))); };
const card = (re) => page.locator('section').filter({ has: page.locator('h2', { hasText: re }) }).first();
const nogi = async () => { const c = card(/^Nóżki$/); if (!(await c.getByText('Nóżki pod szafką', { exact: true }).count())) { await c.locator('h2').click(); await page.waitForTimeout(300); } return c; };
const legs = (p) => p.items.map((it) => it.cab.legs || {});

console.log('== karta ciągu: „Nóżki ciągu” ==');
{
  await seed([cab('A', 600), cab('B', 800), cab('C', 600)]);
  const pole = page.locator('[data-el="nozki-ciagu"]');
  ok('pole „Nóżki ciągu” w karcie ciągu', (await pole.count()) === 1);
  await pole.getByText('Nóżki pod wszystkimi szafkami', { exact: true }).click(); await page.waitForTimeout(400);
  let p = await zap();
  ok('zaznaczenie: nóżki 100 mm pod wszystkimi trzema szafkami', legs(p).every((l) => l.on && l.height === 100), JSON.stringify(legs(p)));
  await pole.locator('input[type=number]').fill('120'); await page.waitForTimeout(300);
  p = await zap();
  ok('wysokość 120 w karcie ciągu → wszystkie szafki', legs(p).every((l) => l.height === 120), JSON.stringify(legs(p).map((l) => l.height)));
  ok('cokół ciągu i jego szafek bez zmian (wyłączony)', !p.runs[0].plinth.on && p.items.every((it) => !it.cab.plinth.on));
  await pole.getByText('Nóżki pod wszystkimi szafkami', { exact: true }).click(); await page.waitForTimeout(400);
  p = await zap();
  ok('odznaczenie: bez nóżek, wysokość zostaje w ustawieniach', legs(p).every((l) => !l.on && l.height === 120), JSON.stringify(legs(p)));
}

console.log('\n== część szafek na nóżkach ==');
{
  await seed([cab('A', 600, { legs: { on: true, height: 150, shape: 'round', color: '#b08d3f' } }), cab('B', 800), cab('C', 600)]);
  const pole = page.locator('[data-el="nozki-ciagu"]');
  ok('„Nóżki ma 1 z 3 szafek”', /Nóżki ma 1 z 3 szafek/.test(await pole.innerText()), await pole.innerText());
  await pole.getByText('Nóżki pod wszystkimi szafkami', { exact: true }).click(); await page.waitForTimeout(400);
  const p = await zap();
  ok('zaznaczenie bierze nóżki aktywnej szafki: 150, okrągłe, złote', legs(p).every((l) => l.on && l.height === 150 && l.shape === 'round' && l.color === '#b08d3f'), JSON.stringify(legs(p)));
}

console.log('\n== zmiana w szafce: pytanie o cały ciąg ==');
{
  await seed([cab('A', 600), cab('B', 800, { legs: { on: false, height: 100, count: 6 } }), cab('C', 600)]);
  const c = await nogi();
  await c.getByText('Nóżki pod szafką', { exact: true }).click(); await page.waitForTimeout(400);
  const pyt = page.locator('[data-el="nozki-dla-ciagu"]');
  ok('pytanie „Takie same nóżki w całym ciągu?” z „Cały ciąg „Ściana 1” — 2 szafki”', (await pyt.count()) === 1
    && /Takie same nóżki w całym ciągu\?/.test(await pyt.innerText()) && /Cały ciąg „Ściana 1” — 2 szafki/.test(await pyt.innerText()), await pyt.innerText().catch(() => ''));
  await c.getByRole('button', { name: 'Okrągła', exact: true }).click(); await page.waitForTimeout(300);
  await pyt.getByRole('button', { name: /^Cały ciąg/ }).click(); await page.waitForTimeout(400);
  const p = await zap();
  ok('„Cały ciąg”: wszystkie na nóżkach okrągłych', legs(p).every((l) => l.on && l.shape === 'round'), JSON.stringify(legs(p)));
  ok('liczba nóżek zostaje przy szafce (B: 6)', p.items[1].cab.legs.count === 6, String(p.items[1].cab.legs.count));
  ok('po wyborze pytanie znika', (await pyt.count()) === 0);
  // zdjecie nozek w jednej szafce — pytanie o zdjecie w calym ciagu, „Tylko ta szafka” zostawia reszte
  await c.getByText('Nóżki pod szafką', { exact: true }).click(); await page.waitForTimeout(400);
  ok('odznaczenie: „Zdjąć nóżki w całym ciągu?”', /Zdjąć nóżki w całym ciągu\?/.test(await pyt.innerText().catch(() => '')));
  await pyt.getByRole('button', { name: 'Tylko ta szafka', exact: true }).click(); await page.waitForTimeout(400);
  const p2 = await zap();
  ok('„Tylko ta szafka”: A bez nóżek, B i C z nóżkami', !p2.items[0].cab.legs.on && p2.items[1].cab.legs.on && p2.items[2].cab.legs.on, JSON.stringify(legs(p2).map((l) => l.on)));
}

console.log('\n== szafka sama w ciągu: bez pytania ==');
{
  await seed([cab('A', 600)]);
  const c = await nogi();
  await c.getByText('Nóżki pod szafką', { exact: true }).click(); await page.waitForTimeout(400);
  ok('brak pytania o ciąg', (await page.locator('[data-el="nozki-dla-ciagu"]').count()) === 0);
}

console.log('\n== ciąg wiszący: bez nóżek ciągu ==');
{
  await seed([cab('A', 600), cab('B', 600)], RUN({ mountY: 1400 }));
  ok('wiszący ciąg nie ma pola „Nóżki ciągu”', (await page.locator('[data-el="nozki-ciagu"]').count()) === 0);
}

console.log('\n== nowe pomieszczenie: szafka na nóżkach, bez cokołu ==');
{
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: 'networkidle' }); await page.waitForTimeout(1200);
  await page.getByRole('button', { name: '+ pomieszczenie' }).click(); await page.waitForTimeout(800);
  const p = await zap();
  const c = p.items[p.active].cab;
  ok('pierwsza szafka nowego pomieszczenia: nóżki tak, cokół nie', !!(c.legs && c.legs.on) && !(c.plinth && c.plinth.on), JSON.stringify([c.legs, c.plinth]));
}

ok('bez błędów strony', !errors.length, errors.join(' / '));
await b.close();
