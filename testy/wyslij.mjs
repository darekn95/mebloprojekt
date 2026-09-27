/* „Wyslij do Claude": przycisk istnieje tylko w artefakcie na claude.ai, gdzie
   strona dostaje wspolny magazyn (`window.claude.use("db")`). Poza nim — na
   GitHub Pages, w standalone, w tym buildzie testowym — nie ma go wcale.
   Prawdziwego magazynu tu nie ma, wiec w drugiej czesci podstawiamy atrape
   z tym samym ksztaltem wywolan i sprawdzamy, co strona do niej zapisuje. */
import pw from '/opt/node22/lib/node_modules/playwright/index.js';
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
    const db = { doc: (sciezka) => ({ set: async (dane) => { window.__zapisy.push({ sciezka, dane }); } }) };
    window.claude = { use: async (n) => (n === 'db' ? db : null) };
  });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto(URL, { waitUntil: 'networkidle' });
  await page.evaluate((p) => { localStorage.clear(); localStorage.setItem('szafki:projekt', JSON.stringify(p)); }, PROJ);
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  return { page, errors, ctx };
};
const przycisk = (page) => page.getByRole('button', { name: 'Wyślij do Claude' });

console.log('== poza claude.ai: przycisku nie ma ==');
let { page, errors, ctx } = await otworz(false);
ok('bez magazynu nie ma przycisku', (await przycisk(page).count()) === 0, '');
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

await b.close();
