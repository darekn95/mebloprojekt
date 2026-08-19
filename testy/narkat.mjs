/* Kątownik w narożniku: od strony ramienia korpus nie ma boku, a róg trzyma
   kątownik przy plecach. Sprawdzamy formatki, rysunek i przełącznik w karcie. */
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
await page.waitForTimeout(2000);

const formatki = async () => card(/^Formatki do zamówienia$/).evaluate((sec) =>
  [...sec.querySelectorAll('tbody tr')].map((tr) =>
    [...tr.querySelectorAll('td')].map((td) => td.innerText.trim())));
const wiersz = (rows, re) => rows.find((r) => re.test(r[0]));

console.log('== formatki: bok znika, kątownik dochodzi ==');
let rows = await formatki();
rows.forEach((r) => console.log('     ' + r.slice(0, 5).join(' | ').replace(/\s+/g, ' ')));
const bok = wiersz(rows, /^Bok/);
ok('został tylko jeden bok', !!bok && bok[0] === 'Bok lewy', bok ? bok.slice(0, 2).join('|') : '(brak)');
const kBok = wiersz(rows, /^Kątownik przy ramieniu — bok/);
const kPlecy = wiersz(rows, /^Kątownik przy ramieniu — plecy/);
ok('kątownik przy boku ma 150 mm', !!kBok && kBok[2] === '150', kBok ? kBok.slice(0, 4).join('|') : '(brak)');
/* Obie plyty maja te sama formatke — jedno ramie wypada wtedy dluzsze o grubosc
   drugiej plyty, ale w zamowieniu sa to dwie takie same sztuki. */
ok('kątownik przy plecach też 150 mm', !!kPlecy && kPlecy[2] === '150', kPlecy ? kPlecy.slice(0, 4).join('|') : '(brak)');
ok('oba kątowniki tej samej wysokości', !!kBok && !!kPlecy && kBok[3] === kPlecy[3],
  `${kBok && kBok[3]} vs ${kPlecy && kPlecy[3]}`);

console.log('\n== rzut z góry: kątownik stoi przy plecach, nie przy licu ==');
for (const l of ['Szafka', 'Z góry']) {
  const btn = page.getByText(l, { exact: true }).first();
  if (await btn.count()) { await btn.click(); await page.waitForTimeout(800); }
}
const plyty = () => page.evaluate(() => [...document.querySelectorAll('svg rect')].map((r) => ({
  x: +r.getAttribute('x'), y: +r.getAttribute('y'),
  w: +r.getAttribute('width'), h: +r.getAttribute('height'),
})).filter((r) => r.w > 0 && r.h > 0));
let rs = await plyty();
const bokLewy = rs.find((r) => r.x === 0 && r.w === 18 && r.h === 600);
const bokPrawy = rs.find((r) => r.x === 882 && r.w === 18 && r.h === 600);
// katownik stoi PRZED plecami, wiec y to ich grubosc, a nie zero
const ramBok = rs.find((r) => r.x === 882 && r.w === 18 && r.h === 150);
const ramPlecy = rs.find((r) => r.w === 150 && r.h === 18 && r.x === 732);
ok('lewy bok jest', !!bokLewy);
ok('prawego boku nie ma', !bokPrawy);
ok('ramię kątownika przy boku', !!ramBok, JSON.stringify(ramBok));
ok('ramię kątownika przy plecach', !!ramPlecy, JSON.stringify(ramPlecy));

/* Wzmocnienia szafki naroznej koncza sie na maskownicy katownika: dostepne lico
   to 900 - 600 - 18 = 282, wiec od lewego boku zostaje 282 - 18 = 264. */
rows = await formatki();
const wzm = wiersz(rows, /^Wzmocnienie poziome/);
ok('wzmocnienie kończy się na maskownicy', !!wzm && wzm[2] === '264',
  wzm ? wzm.slice(0, 4).join('|') : '(brak)');

console.log('\n== przełącznik w karcie: kątownik zdejmowalny, ramiona regulowane ==');
const naroznik = page.getByText('Kątownik w tylnym narożniku', { exact: true }).first();
ok('przełącznik jest w karcie', await naroznik.count() > 0);
await naroznik.click();
await page.waitForTimeout(1200);
rows = await formatki();
ok('po wyłączeniu wracają dwa boki', !!wiersz(rows, /^Bok$/) || !!wiersz(rows, /^Bok prawy/),
  JSON.stringify((wiersz(rows, /^Bok/) || []).slice(0, 2)));
ok('kątownika nie ma w formatkach', !wiersz(rows, /^Kątownik przy ramieniu/));
await naroznik.click();
await page.waitForTimeout(1200);

const pole = page.locator('label')
  .filter({ has: page.locator('span', { hasText: /^Ramiona kątownika$/ }) })
  .last().locator('input[type=number]').first();
if (await pole.count()) {
  await pole.fill('200');
  await page.waitForTimeout(1200);
  rows = await formatki();
  const k2 = wiersz(rows, /^Kątownik przy ramieniu — bok/);
  const p2 = wiersz(rows, /^Kątownik przy ramieniu — plecy/);
  ok('ramiona 200 mm', !!k2 && k2[2] === '200', k2 ? k2.slice(0, 4).join('|') : '(brak)');
  ok('druga płyta też 200 mm', !!p2 && p2[2] === '200', p2 ? p2.slice(0, 4).join('|') : '(brak)');
} else {
  ok('pole „Ramiona kątownika" jest', false, 'nie znaleziono pola');
}

console.log('\nBLEDY:', errors.length ? errors.join('; ') : '(brak)');
await b.close();
