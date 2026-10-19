/* „Wyslij do Claude": przycisk istnieje tylko w artefakcie na claude.ai, gdzie
   strona dostaje wspolny magazyn (`window.claude.use("db")`). Poza nim — na
   GitHub Pages, w standalone, w tym buildzie testowym — nie ma go wcale.
   Prawdziwego magazynu tu nie ma, wiec w drugiej czesci podstawiamy atrape
   z tym samym ksztaltem wywolan i sprawdzamy, co strona do niej zapisuje. */
import pw from './pw.mjs';
const URL = process.env.STD ? 'http://127.0.0.1:5199/standalone-local.html'
  : 'http://127.0.0.1:5205/mebloprojekt-app.html';
const b = await pw.chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const ok = (l, c, e = '') => console.log((c ? '  OK   ' : '  BLAD ') + l + (e ? ' — ' + e : ''));
const PROJ = { name: 'Kuchnia testowa', active: 0, prices: {}, runs: [],
  items: [{ cab: { name: 'A', W: 600, H: 720, D: 570 } }, { cab: { name: 'B', W: 800, H: 720, D: 570 } }] };

const otworz = async (zAtrapa) => {
  const ctx = await b.newContext({ viewport: { width: 1500, height: 1100 } });
  if (zAtrapa) await ctx.addInitScript(() => {
    window.__zapisy = [];
    // „wyslany” projekt w magazynie — do wczytania na innym komputerze
    window.__wMagazynie = { json: JSON.stringify({ name: 'Wysłany wcześniej', items: [{ cab: { name: 'W1', W: 500, H: 720, D: 570 } },
      { cab: { name: 'W2', W: 500, H: 720, D: 570 } }, { cab: { name: 'W3', W: 500, H: 720, D: 570 } }], runs: [], active: 0 }),
      nazwa: 'Wysłany wcześniej', szafek: 3, wyslano: '2026-10-14T09:20:00.000Z' };
    const db = { doc: (sciezka) => ({
      set: async (dane) => { window.__zapisy.push({ sciezka, dane }); },
      get: async () => ({ exists: sciezka === 'projekt/biezacy' && !!window.__wMagazynie, data: () => window.__wMagazynie }) }) };
    window.claude = { use: async (n) => (n === 'db' ? db : null) };
  });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto(URL, { waitUntil: 'networkidle' });
  await page.evaluate((p) => { localStorage.clear(); localStorage.setItem('szafki:projekt', JSON.stringify(p)); }, PROJ);
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  /* Pierwszy autozapis po wczytaniu (800 ms po starcie) pisze w pasku „zapisano …”.
     Standalone kompiluje sie w przegladarce dluzej i ten zapis wypadal juz po
     kliknieciu „Wyślij” — nadpisywal komunikat i test padal (BLEDY.md). */
  await page.waitForFunction(() => /zapisano/.test(document.body.innerText), null, { timeout: 8000 }).catch(() => {});
  return { page, errors, ctx };
};
const przycisk = (page) => page.getByRole('button', { name: 'Wyślij do Claude' });

console.log('== poza claude.ai: przycisku nie ma ==');
let { page, errors, ctx } = await otworz(false);
ok('bez magazynu nie ma przycisku', (await przycisk(page).count()) === 0, '');
ok('ani „Wczytaj wysłany do Claude”', (await page.getByRole('button', { name: 'Wczytaj wysłany do Claude' }).count()) === 0, '');
ok('a „Zapisz do pliku" jest jak był', (await page.getByRole('button', { name: 'Zapisz do pliku' }).count()) === 1, '');
// „Pokaz rysunek" w gornym pasku przewija do karty rysunku, pod przyklejony pasek
await page.setViewportSize({ width: 900, height: 900 });
await page.getByRole('button', { name: 'Pokaż rysunek' }).click();
await page.waitForTimeout(1200);
const rys = await page.evaluate(() => ({
  top: Math.round(document.getElementById('rysunek').getBoundingClientRect().top),
  pasek: Math.round(document.querySelector('header.sticky').getBoundingClientRect().bottom) }));
ok('„Pokaż rysunek" przewija do rysunku', rys.top >= rys.pasek - 2 && rys.top < 300, JSON.stringify(rys));
ok('bez błędów strony', errors.length === 0, errors.join('; '));
await ctx.close();

console.log('\n== w artefakcie: przycisk zapisuje cały projekt ==');
({ page, errors, ctx } = await otworz(true));
ok('z magazynem przycisk jest', (await przycisk(page).count()) === 1, '');
await przycisk(page).click();
await page.waitForTimeout(800);
const zapisy = await page.evaluate(() => window.__zapisy);
const z = zapisy[0] || {};
console.log('     ścieżka: ' + z.sciezka + ', pola: ' + Object.keys(z.dane || {}).join(', '));
ok('jeden zapis do projekt/biezacy', zapisy.length === 1 && z.sciezka === 'projekt/biezacy', JSON.stringify(zapisy).slice(0, 120));
let wczytany = null;
try { wczytany = JSON.parse(z.dane.json); } catch (e) { /* zostaje null */ }
ok('pole json to cały projekt', wczytany && wczytany.items.length === 2 && wczytany.name === 'Kuchnia testowa',
  String(z.dane && z.dane.json).slice(0, 80));
ok('opis: nazwa, liczba szafek, czas', z.dane && z.dane.nazwa === 'Kuchnia testowa' && z.dane.szafek === 2
  && !Number.isNaN(Date.parse(z.dane.wyslano)), JSON.stringify({ ...z.dane, json: '…' }));
const stan = await page.locator('header').innerText().catch(() => '');
ok('pasek mówi, że wysłano', /wysłano do Claude/.test(await page.evaluate(() => document.body.innerText)), stan.slice(0, 80));
ok('bez błędów strony', errors.length === 0, errors.join('; '));
await ctx.close();

console.log('\n== w artefakcie na innym komputerze: „Wczytaj wysłany do Claude” ==');
/* Uzytkownik 2026-10-15: na innym komputerze artefakt otworzyl projekt
   startowy. Ostatnio wyslany lezy w magazynie — przycisk go wczytuje, ale
   najpierw pyta, bo zastepuje otwarty projekt. */
({ page, errors, ctx } = await otworz(true));
const wczytaj = page.getByRole('button', { name: 'Wczytaj wysłany do Claude' });
ok('przycisk „Wczytaj wysłany do Claude” jest', (await wczytaj.count()) === 1);
await wczytaj.click(); await page.waitForTimeout(600);
const pytanie = page.locator('[data-el="wczytaj-od-claude-pytanie"]');
ok('najpierw pytanie z nazwą i liczbą szafek', (await pytanie.count()) === 1 && /„Wysłany wcześniej”, 3 szafek\)\? Zastąpi otwarty projekt/.test(await pytanie.innerText()),
  (await pytanie.count()) ? await pytanie.innerText() : '(brak)');
await pytanie.getByRole('button', { name: 'Anuluj' }).click(); await page.waitForTimeout(400);
let zap = await page.evaluate(() => JSON.parse(localStorage.getItem('szafki:projekt')));
ok('„Anuluj” zostawia otwarty projekt', zap.name === 'Kuchnia testowa' && zap.items.length === 2, zap.name);
await wczytaj.click(); await page.waitForTimeout(600);
await page.locator('[data-el="wczytaj-od-claude-pytanie"]').getByRole('button', { name: 'Wczytaj' }).click(); await page.waitForTimeout(1500);
zap = await page.evaluate(() => JSON.parse(localStorage.getItem('szafki:projekt')));
ok('„Wczytaj” podmienia projekt na wysłany', zap.name === 'Wysłany wcześniej' && zap.items.length === 3 && zap.items.map((i) => i.cab.name).join(',') === 'W1,W2,W3',
  `${zap.name}: ${zap.items.map((i) => i.cab.name).join(',')}`);
await page.evaluate(() => { window.__wMagazynie = null; });
await wczytaj.click(); await page.waitForTimeout(600);
ok('pusty magazyn: komunikat, bez pytania', /w artefakcie nie ma wysłanego projektu/.test(await page.evaluate(() => document.body.innerText))
  && (await page.locator('[data-el="wczytaj-od-claude-pytanie"]').count()) === 0);
ok('bez błędów strony', errors.length === 0, errors.join('; '));
await ctx.close();

await b.close();
