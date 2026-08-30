/* Opcje ramienia siedzą w „Strukturze wnętrza", a nie w karcie ciągu — ramię to
   dalszy ciąg tej samej szafki. W karcie ciągu zostaje sam narożnik. */
import pw from '/opt/node22/lib/node_modules/playwright/index.js';
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
await page.locator('select[title="Dodaj szafkę z gotowego szablonu"]').first().selectOption('naroznikL');
await page.waitForTimeout(2200);

const struktura = async () => card(/^Struktura wnętrza$/).innerText();
const ciag = async () => card(/^Ciąg meblowy$/).innerText();
let st = await struktura();
let cg = await ciag();
console.log('   struktura: ' + st.split('\n').slice(0, 6).join(' | ').slice(0, 200));
ok('nagłówek „Ramię narożnika" jest w strukturze', /rami[ęe] narożnika/i.test(st), st.slice(0, 120));
ok('nie ma go już w karcie ciągu', !/rami[ęe] narożnika|szafka narożna \(l\)/i.test(cg), cg.slice(0, 160));
ok('karta ciągu dalej mówi o narożniku', /narożnik/i.test(cg), cg.slice(0, 160));

console.log('\n== ustawienia ramienia działają z nowego miejsca ==');
const dl = card(/^Struktura wnętrza$/).locator('label')
  .filter({ has: page.locator('span', { hasText: /^Długość ramienia$/ }) })
  .locator('input[type=number]').first();
ok('pole długości ramienia jest w strukturze', await dl.count() === 1, String(await dl.count()));
await dl.fill('800');
await page.waitForTimeout(1400);
const p2 = await page.evaluate(() => JSON.parse(localStorage.getItem('szafki:projekt')));
const rog = p2.items.map((i) => i.cab).find((c) => c.corner && c.corner.on);
ok('zmiana trafia do szafki', rog && rog.corner.arm === 800, rog && String(rog.corner.arm));
const kat = card(/^Struktura wnętrza$/).getByText('Kątownik w tylnym narożniku', { exact: true });
ok('przełącznik kątownika też tutaj', await kat.count() === 1, String(await kat.count()));
const plecy = card(/^Struktura wnętrza$/).getByText(/Od ściany .* \(ramię\)/);
ok('plecy z płyty też tutaj', await plecy.count() === 1, String(await plecy.count()));

console.log('\n== widać, co ramię bierze z szafki ==');
st = await struktura();
const dziedz = st.split('\n').find((l) => /Z szafki, bez osobnego ustawienia/.test(l)) || '';
console.log('   ' + dziedz.slice(0, 200));
ok('jest informacja o dziedziczeniu', !!dziedz, st.slice(0, 160));
ok('mówi o wysokości i głębokości', /wysokość/.test(dziedz) && /głębokość/.test(dziedz), dziedz.slice(0, 120));
ok('mówi o półkach', /Półki|półek/.test(dziedz), dziedz.slice(0, 160));

console.log('\n== typ montażu drzwi jest podpisany ==');
const drzwi = card(/^Struktura wnętrza$/).getByText(/Drzwi w narożniku — typ montażu/i);
ok('pasek drzwi ma podpis', await drzwi.count() === 1, String(await drzwi.count()));

console.log('\n== widać, które wzmocnienia są czyje ==');
st = await struktura();
ok('wzmocnienia podpisane jako korpusu', /Wzmocnienia korpusu/.test(st), st.slice(0, 160));
ok('ramię ma własną sekcję wzmocnień', /Wzmocnienia ramienia/i.test(st), st.slice(0, 160));
const owzm = st.split('\n').find((l) => /idą dalej w ramieniu/.test(l)) || '';
console.log('   ' + owzm.slice(0, 220));
ok('jest opis wzmocnień ramienia', !!owzm, st.slice(-200));
/* Ramie ma dwie wlasne plyty: czolowa i tylna — obie z wlasna szerokoscia. */
const sekcja = st.slice(st.indexOf('WZMOCNIENIA RAMIENIA'));
ok('są obie płyty ramienia', /czołowe/.test(sekcja) && /tylne/.test(sekcja), sekcja.slice(0, 200));
ok('mówi, gdzie dochodzą', (sekcja.match(/kątownik/gi) || []).length >= 2, sekcja.slice(0, 260));
const szer = card(/^Struktura wnętrza$/).locator('div')
  .filter({ has: page.getByText(/czołowe — dochodzi do kątownika/) })
  .filter({ has: page.locator('input[type=number]') })
  .last().locator('input[type=number]').first();
ok('szerokość czołowego da się ustawić', await szer.count() === 1, String(await szer.count()));
await szer.fill('80');
await page.waitForTimeout(1400);
const p3 = await page.evaluate(() => JSON.parse(localStorage.getItem('szafki:projekt')));
const rog3 = p3.items.map((i) => i.cab).find((c) => c.corner && c.corner.on);
ok('szerokość trafia do projektu', rog3 && Number(rog3.corner.railW.przod) === 80,
  JSON.stringify(rog3 && rog3.corner.railW));
const wzmR = await card(/Formatki ca/).evaluate((sec) =>
  [...sec.querySelectorAll('tbody tr')].map((tr) =>
    [...tr.querySelectorAll('td')].map((t) => t.innerText.trim().split('\n')[0]))
    .find((r) => /^Wzmocnienie ramienia — czołowe/.test(r[0])));
console.log('   formatka: ' + JSON.stringify(wzmR && wzmR.slice(0, 5)));
ok('formatka ramienia ma nową szerokość', !!wzmR && wzmR[4] === '80',
  wzmR ? wzmR.slice(0, 5).join('|') : '(brak)');

console.log('\nBLEDY:', errors.length ? errors.join('; ') : '(brak)');
await b.close();
