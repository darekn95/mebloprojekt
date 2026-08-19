/* Plecy z pełnej płyty w szafce narożnej — osobno od ściany korpusu i od ściany
   ramienia. Płyta usztywnia róg, więc stojące wzmocnienie przy tej ścianie ma
   zniknąć z formatek i z rysunku. */
import pw from '/opt/node22/lib/node_modules/playwright/index.js';
const URL = process.env.STD ? 'http://127.0.0.1:5199/standalone-local.html'
  : 'http://127.0.0.1:5205/mebloprojekt-app.html';
const b = await pw.chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const page = await (await b.newContext({ viewport: { width: 1500, height: 1100 } })).newPage();
const errors = []; page.on('pageerror', (e) => errors.push('[pageerror] ' + e.message));
const ok = (l, c, e = '') => console.log((c ? '  OK   ' : '  BLAD ') + l + (e ? ' — ' + e : ''));
await page.goto(URL, { waitUntil: 'networkidle' });
await page.evaluate(() => { try { localStorage.clear(); } catch (e) {} });
await page.reload({ waitUntil: 'networkidle' });
await page.waitForTimeout(1800);
await page.locator('select[title="Dodaj szafkę z gotowego szablonu"]').first().selectOption('naroznikL');
await page.waitForTimeout(2200);

const lista = async () => page.evaluate(() => {
  const sec = [...document.querySelectorAll('section')].find((s) => {
    const h = s.querySelector('h2');
    return h && /Formatki ca/.test(h.textContent);
  });
  if (!sec) return [];
  return [...sec.querySelectorAll('tbody tr')].map((tr) =>
    [...tr.querySelectorAll('td')].map((t) => t.innerText.trim().split('\n')[0]));
});
const jest = (rows, re) => rows.some((r) => re.test(r[0]));
const wiersz = (rows, re) => rows.find((r) => re.test(r[0]));
// obok naroznika stoi jeszcze szafka, od ktorej zaczyna sie projekt — jej plecy
// nas nie interesuja, wiec filtrujemy po kolumnie „z ktorej szafki"
const rog = (rows) => rows.filter((r) => /Szafka 2/.test(r[1] || ''));

let rows = await lista();
console.log('== na start: HDF i oba wzmocnienia tylne ==');
ok('plecy korpusu z HDF', !!wiersz(rows, /^Plecy HDF/), '');
ok('plecy ramienia z HDF', (wiersz(rows, /^Plecy ramienia/) || [])[2] === 'HDF',
  JSON.stringify((wiersz(rows, /^Plecy ramienia/) || []).slice(0, 3)));
ok('jest wzmocnienie czołowe korpusu', jest(rows, /^Wzmocnienie czołowe/));
ok('jest tylne wzmocnienie ramienia', jest(rows, /^Wzmocnienie ramienia — tylne/));

console.log('\n== plecy korpusu z płyty ==');
const check = (re) => page.locator('label').filter({ hasText: re }).locator('input[type=checkbox]').first();
const korp = check(/Od ściany .* \(korpus\)/);
ok('checkbox przy ścianie korpusu jest', await korp.count() === 1, String(await korp.count()));
await korp.check();
await page.waitForTimeout(1500);
rows = await lista();
ok('plecy korpusu idą z płyty', !jest(rog(rows), /^Plecy HDF/) && jest(rog(rows), /^Plecy/),
  JSON.stringify((rog(rows).find((r) => /^Plecy/.test(r[0])) || []).slice(0, 3)));
ok('stojące wzmocnienie korpusu znika', !jest(rows, /^Wzmocnienie czołowe/),
  JSON.stringify((wiersz(rows, /^Wzmocnienie czołowe/) || []).slice(0, 3)));
ok('płaskie wzmocnienie korpusu zostaje', jest(rows, /^Wzmocnienie poziome/));
ok('ramienia to jeszcze nie dotyczy', jest(rows, /^Wzmocnienie ramienia — tylne/));

console.log('\n== plecy ramienia z płyty ==');
const ram = check(/Od ściany .* \(ramię\)/);
ok('checkbox przy ścianie ramienia jest', await ram.count() === 1, String(await ram.count()));
await ram.check();
await page.waitForTimeout(1500);
rows = await lista();
const pr = wiersz(rows, /^Plecy ramienia/);
console.log('   ' + JSON.stringify((pr || []).slice(0, 5)));
ok('plecy ramienia z płyty', !!pr && /płyty/i.test(pr[0]) && pr[2] !== 'HDF',
  pr ? pr.slice(0, 3).join('|') : '(brak)');
ok('tylne wzmocnienie ramienia znika', !jest(rows, /^Wzmocnienie ramienia — tylne/));
ok('czołowe wzmocnienie ramienia zostaje', jest(rows, /^Wzmocnienie ramienia — czołowe/));

console.log('\n== odznaczenie wraca do HDF i wzmocnień ==');
await ram.uncheck();
await korp.uncheck();
await page.waitForTimeout(1600);
rows = await lista();
ok('wraca HDF w korpusie', jest(rog(rows), /^Plecy HDF/),
  JSON.stringify((rog(rows).find((r) => /^Plecy/.test(r[0])) || []).slice(0, 3)));
ok('wraca HDF w ramieniu', (wiersz(rows, /^Plecy ramienia$/) || [])[2] === 'HDF',
  JSON.stringify((wiersz(rows, /^Plecy ramienia/) || []).slice(0, 3)));
ok('wracają oba wzmocnienia tylne',
  jest(rows, /^Wzmocnienie czołowe/) && jest(rows, /^Wzmocnienie ramienia — tylne/));

console.log('\nBLEDY:', errors.length ? errors.join('; ') : '(brak)');
await b.close();
