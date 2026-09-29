/* Kazda karta da sie zwinac (prosba uzytkownika 2026-09-29: „każda karta powinna
   mieć opcję zwijania”) — poza uwagami, ktore zawsze sa na wierzchu. Tu tez
   kolejnosc: notatka pod rysunkiem, wycena na koncu. Domyslnie rozwiniete;
   klik w naglowek chowa tresc, drugi klik ja przywraca. */
import pw from './pw.mjs';
const URL = process.env.STD ? 'http://127.0.0.1:5199/standalone-local.html'
  : 'http://127.0.0.1:5205/mebloprojekt-app.html';
const ok = (l, c, e = '') => console.log((c ? '  OK   ' : '  BLAD ') + l + (e ? ' — ' + e : ''));
const b = await pw.chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const page = await (await b.newContext({ viewport: { width: 1500, height: 1300 } })).newPage();
const errors = []; page.on('pageerror', (e) => errors.push(e.message));
await page.goto(URL, { waitUntil: 'networkidle' });

const PL = { on: true, height: 100, mode: 'under', setback: 0 };
const sz = (name) => ({ name, W: 600, H: 720, D: 560, plinth: PL, legs: { on: true, height: 100 },
  levels: [{ h: null, cols: [{ kind: 'doors', doors: 2, w: null }] }] });
await page.evaluate((q) => { localStorage.clear(); localStorage.setItem('szafki:projekt', JSON.stringify(q)); },
  { name: 'Zwijanie', prices: {}, runs: [], items: [{ cab: sz('S1'), runId: null, offset: 0 }, { cab: { ...sz('S2'), W: 400 }, runId: null, offset: 0 }], active: 1 });
await page.reload({ waitUntil: 'networkidle' }); await page.waitForTimeout(1200);

for (const re of [/^Rysunek$/, /^Notatka montażowa$/, /^Formatki do zamówienia/, /^Formatki całego projektu/, /^Produkty do zamówienia/, /^Produkty całego projektu/]) {
  const sec = page.locator('section').filter({ has: page.locator('h2', { hasText: re }) }).first();
  // notatka montazowa startuje zwinieta — najpierw ja rozwijamy
  const rozwin = sec.locator('header button[title="Rozwiń sekcję"]');
  if ((await sec.count()) && (await rozwin.count())) { await rozwin.click(); await page.waitForTimeout(250); }
  const btn = sec.locator('header button[title="Zwiń sekcję"]');
  const jest = (await sec.count()) && (await btn.count());
  if (!jest) { ok(`${re.source}: przycisk zwijania`, false, (await sec.count()) ? 'brak przycisku' : 'brak karty'); continue; }
  const tresc = () => sec.evaluate((s) => s.children.length > 1);
  const przed = await tresc();
  await btn.click(); await page.waitForTimeout(250);
  const zwinieta = !(await tresc());
  await sec.locator('header button[title="Rozwiń sekcję"]').click(); await page.waitForTimeout(250);
  const znow = await tresc();
  ok(`${re.source}: zwija się i rozwija`, przed && zwinieta && znow, `przed ${przed}, zwinięta ${zwinieta}, znów ${znow}`);
}

/* Uwagi zawsze na wierzchu — bez zwijania (uzytkownik 2026-09-29) */
const uw = page.locator('section').filter({ has: page.locator('h2', { hasText: /^Uwagi/ }) }).first();
ok('Uwagi bez zwijania', (await uw.count()) === 1 && (await uw.locator('header button[title="Zwiń sekcję"], header button[title="Rozwiń sekcję"]').count()) === 0);
// kolejnosc kart: notatka pod rysunkiem, wycena na koncu (pod produktami calego projektu)
const tytuly = await page.evaluate(() => [...document.querySelectorAll('section h2')].map((h) => h.textContent.trim()));
const idx = (re) => tytuly.findIndex((t) => re.test(t));
ok('notatka montażowa zaraz pod rysunkiem', idx(/^Notatka montażowa$/) === idx(/^Rysunek$/) + 1, tytuly.join(' | '));
ok('wycena pod produktami całego projektu', idx(/^Wycena$/) > idx(/^Produkty całego projektu/) && idx(/^Produkty całego projektu/) >= 0, tytuly.join(' | '));
ok('bez karty „Kontrola frontów”', idx(/^Kontrola frontów$/) < 0);

// „Zwiń wszystkie” w gornym pasku (komentarz uzytkownika 2026-09-29)
await page.getByRole('button', { name: '▸ Zwiń wszystkie' }).click(); await page.waitForTimeout(400);
const otwarte = await page.evaluate(() => [...document.querySelectorAll('section')].filter((s) => s.children.length > 1).map((s) => s.querySelector('h2')?.textContent));
ok('„Zwiń wszystkie” zwija wszystko poza uwagami', otwarte.length === 1 && /^Uwagi/.test(otwarte[0]), otwarte.join(', '));
// „Rozwiń wszystkie” niepotrzebny (uzytkownik 2026-09-29) — tylko zwijanie
ok('bez przycisku „Rozwiń wszystkie”', (await page.getByRole('button', { name: /Rozwiń wszystkie/ }).count()) === 0);

console.log('\nBLEDY:', errors.length ? errors.join('; ') : '(brak)');
await b.close();
