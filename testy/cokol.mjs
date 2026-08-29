import pw from '/opt/node22/lib/node_modules/playwright/index.js';
const { chromium } = pw;
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const page = await (await browser.newContext({ viewport: { width: 1500, height: 1150 } })).newPage();
const errors = [];
page.on('pageerror', (e) => errors.push('[pageerror] ' + e.message));
page.on('console', (m) => { if (m.type() === 'error' && !/favicon|404/.test(m.text())) errors.push('[console] ' + m.text()); });
const ok = (l, c, e = '') => console.log((c ? '  OK   ' : '  BLAD ') + l + (e ? ' — ' + e : ''));
await page.goto('http://127.0.0.1:5205/mebloprojekt-app.html', { waitUntil: 'networkidle' });
await page.evaluate(() => { try { localStorage.clear(); } catch (e) {} });
await page.reload({ waitUntil: 'networkidle' });
await page.waitForTimeout(1500);
const card = (re) => page.locator('section').filter({ has: page.locator('h2', { hasText: re }) }).first();
const rows = () => card(/^Produkty do zamówienia/).evaluate((s) =>
  [...s.querySelectorAll('tbody tr')].map(tr => [...tr.querySelectorAll('td')].map(td => td.innerText.trim()).join(' | ')));
const qty = (rs, n) => { const r = rs.find(x => x.startsWith(n)); return r ? Number((r.split('|').pop() || '').trim().split(' ')[0]) : null; };

console.log('== wkręty ==');
let rs = await rows();
ok('wkrętów już nie liczymy (są w komplecie z okuciem)', qty(rs, 'Wkręt') === null, String(qty(rs, 'Wkręt')));

console.log('\n== cokół bez nóżek: trójkąty meblarskie ==');
const cok = card(/^Cokół$/);
await cok.locator('h2').click();
await page.waitForTimeout(400);
/* Nowy projekt startuje z szablonu „Szafka stojąca", wiec cokol bywa juz
   wlaczony — zamiast klikac na oslep, ustawiamy stan, jakiego chcemy. */
const cokol = async (want) => {
  const chk = cok.locator('input[type=checkbox]').first();
  if (await chk.isChecked() !== want) await chk.click();
  await page.waitForTimeout(1000);
};
await cokol(true);
rs = await rows();
console.log('    ', (rs.find(r => /Trójkąt|Złączka/.test(r)) || '(brak)'));
ok('są trójkąty, nie klipsy', qty(rs, 'Trójkąt') !== null && qty(rs, 'Złączka') === null, '');
// cokol w bryle: dlugosc = innerW = 564 -> 2 wzdluz + 2 boki = 4
ok('600 mm korpusu → 4 trójkąty', qty(rs, 'Trójkąt') === 4, String(qty(rs, 'Trójkąt')));

console.log('\n== szeroka szafka: więcej trójkątów ==');
const korpus = card(/^Korpus$/);
await korpus.locator('input[type=number]').first().fill('1800');
await korpus.locator('input[type=number]').first().blur();
await page.waitForTimeout(1200);
rs = await rows();
console.log('    ', (rs.find(r => /Trójkąt/.test(r)) || '(brak)'));
// cokol w bryle przy 1800 -> 1764 mm -> ceil(1764/300)=6 + 2 = 8
ok('1800 mm → 8 trójkątów (co ok. 300 mm)', qty(rs, 'Trójkąt') === 8, String(qty(rs, 'Trójkąt')));

console.log('\n== z nóżkami: wracają klipsy ==');
const nogi = card(/^Nóżki$/);
await nogi.locator('h2').click();
await page.waitForTimeout(400);
await nogi.getByText('Nóżki pod szafką', { exact: true }).click();
await page.waitForTimeout(1000);
rs = await rows();
console.log('    ', (rs.find(r => /Trójkąt|Złączka/.test(r)) || '(brak)'));
/* Klipsow jest tyle, ile nozek w przednim rzedzie — przy 1800 mm szafka ma
   ich 8, czyli 4 z przodu. Liczbe czytamy z zestawienia nozek, zeby test nie
   zalezal od tego, co akurat wychodzi z szerokosci. */
const nozek = qty(rs, 'Nóżka regulowana');
ok('klipsy zamiast trójkątów', qty(rs, 'Złączka do cokołu') === nozek / 2
  && qty(rs, 'Trójkąt') === null, `klipsy ${qty(rs, 'Złączka do cokołu')}, nóżki ${nozek}`);

console.log('\n== bez cokołu: ani jedno, ani drugie ==');
await cokol(false);
rs = await rows();
ok('brak złączek i trójkątów', qty(rs, 'Złączka do cokołu') === null && qty(rs, 'Trójkąt') === null, '');

console.log('\nBLEDY:', errors.length ? errors.join('\n') : '(brak)');
await browser.close();
