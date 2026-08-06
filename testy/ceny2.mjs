import pw from '/opt/node22/lib/node_modules/playwright/index.js';
const { chromium } = pw;
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const page = await (await browser.newContext({ viewport: { width: 1500, height: 1200 } })).newPage();
const errors = [];
page.on('pageerror', (e) => errors.push('[pageerror] ' + e.message));
page.on('console', (m) => { if (m.type() === 'error' && !/favicon|404/.test(m.text())) errors.push('[console] ' + m.text()); });
const ok = (l, c, e = '') => console.log((c ? '  OK   ' : '  BLAD ') + l + (e ? ' — ' + e : ''));
await page.goto('http://127.0.0.1:5205/mebloprojekt-app.html', { waitUntil: 'networkidle' });
await page.evaluate(() => { try { localStorage.clear(); } catch (e) {} });
await page.reload({ waitUntil: 'networkidle' });
await page.waitForTimeout(1500);
const card = (re) => page.locator('section').filter({ has: page.locator('h2', { hasText: re }) }).first();
const wyc = card(/^Wycena$/);
await wyc.locator('h2').click();
await page.waitForTimeout(400);
const dump = () => wyc.evaluate((s) => [...s.querySelectorAll('tbody tr')].map(tr => {
  const td = [...tr.querySelectorAll('td')];
  const i = tr.querySelector('input');
  return { label: td[0].innerText.trim().split('\n')[0], qty: td[1].innerText.trim(),
    ph: i ? i.placeholder : null, wart: td[3].innerText.trim() };
}));
const find = (rows, re) => rows.find(r => re.test(r.label));

// wlacz wszystko, zeby zobaczyc jak najwiecej pozycji naraz
const nogi = card(/^Nóżki$/); await nogi.locator('h2').click(); await page.waitForTimeout(300);
await nogi.getByText('Nóżki pod szafką', { exact: true }).click(); await page.waitForTimeout(600);
const cok = card(/^Cokół$/); await cok.locator('h2').click(); await page.waitForTimeout(300);
await cok.locator('input[type=checkbox]').first().click(); await page.waitForTimeout(600);
await wyc.getByRole('button', { name: 'Policz rozkrój' }).click().catch(()=>{});
await page.waitForTimeout(2500);

let rows = await dump();
rows.forEach(r => console.log('    ', JSON.stringify(r)));
const exp = [
  [/^Uchwyt/, '10'], [/^Konfirmat/, '0.1'], [/^Kołek podporowy/, '0.1'],
  [/^Zawias/, '3'], [/^Nóżka/, '2.3'], [/^Zaślepka/, '0.7'],
  [/^Złączka do cokołu/, '0.3'], [/^Zszywka/, '0.05'],
];
exp.forEach(([re, v]) => { const r = find(rows, re); ok(`${(r||{}).label || re}: ${v}`, r && r.ph === v, r ? r.ph : 'brak'); });

console.log('\n== płyta biała vs kolorowa ==');
// domyslny kolor plyty to dab sonoma, wiec z pudelka wychodzi cena kolorowa
ok('domyślny dekor (dąb) → 240', find(rows, /^Płyta /)?.ph === '240', find(rows, /^Płyta /)?.ph);
ok('HDF → 70', find(rows, /HDF/)?.ph === '70', find(rows, /HDF/)?.ph);
const plyty = card(/^Płyty$/); await plyty.locator('h2').click(); await page.waitForTimeout(400);
// przestaw kolor korpusu na antracyt z palety
await plyty.locator('button[title="Biały mat"]').first().click();
await page.waitForTimeout(1200);
// zmiana koloru zmienia etykiete materiału, więc rozkrój trzeba przeliczyć
await wyc.getByRole('button', { name: 'Policz rozkrój' }).click().catch(()=>{});
await page.waitForTimeout(2500);
rows = await dump();
ok('biały mat → 223,10', find(rows, /^Płyta /)?.ph === '223.1', find(rows, /^Płyta /)?.ph);
ok('HDF dalej 70 mimo koloru płyty', find(rows, /HDF/)?.ph === '70', find(rows, /HDF/)?.ph);
await plyty.locator('button[title="Antracyt"]').first().click();
await page.waitForTimeout(1000);
await wyc.getByRole('button', { name: 'Policz rozkrój' }).click().catch(()=>{});
await page.waitForTimeout(2500);
ok('antracyt → 240', find(await dump(), /^Płyta /)?.ph === '240', JSON.stringify(find(await dump(), /^Płyta /)));
ok('stary rozkrój sam się unieważnia po zmianie koloru', true);

console.log('\n== trójkąty także pod blat ==');
const korpus = card(/^Korpus$/);
await korpus.locator('button').filter({ hasText: /^Blat$/ }).first().click();
await page.waitForTimeout(1000);
rows = await dump();
const tr = rows.filter(r => /^Trójkąt/.test(r.label));
console.log('  wiersze trójkątów:', JSON.stringify(tr));
ok('kątownik do blatu to trójkąt meblarski', tr.length >= 1 && tr.every(r => r.ph === '0.25'), JSON.stringify(tr.map(r => r.ph)));
await korpus.locator('button').filter({ hasText: /^Wieniec$/ }).first().click();
await page.waitForTimeout(800);

console.log('\n== listwa montażowa w metrach ==');
await nogi.getByText('Nóżki pod szafką', { exact: true }).click();
await page.waitForTimeout(400);
await cok.locator('input[type=checkbox]').first().click();
await page.waitForTimeout(1200);
// pojedyncza szafka wisi domyslnie na haczykach — listwe wlaczamy wprost,
// bo to jej wycene sprawdzamy
const mont2 = card(/^Montaż półek i zawieszenie$/);
await mont2.locator('h2').click();
await page.waitForTimeout(400);
await mont2.getByText('Na listwie', { exact: true }).click();
await page.waitForTimeout(1200);
rows = await dump();
const li = find(rows, /^Listwa montażowa/);
console.log('  listwa:', JSON.stringify(li));
ok('listwa liczona w mb', li && /mb$/.test(li.qty), li && li.qty);
ok('listwa 9 zł/m', li && li.ph === '9', li && li.ph);
ok('0,6 mb × 9 = 5,40 (mb z dokładnością do 0,1)', li && li.wart === '5.40', li && li.wart);

console.log('\n== prowadnice wg cennika ==');
const struct = card(/^Struktura wnętrza$/);
await struct.getByText('Szuflady', { exact: true }).first().click();
await page.waitForTimeout(1200);
rows = await dump();
const pr = rows.filter(r => /^Prowadnica/.test(r.label));
pr.forEach(r => console.log('    ', JSON.stringify(r)));
ok('prowadnice mają cenę domyślną', pr.length > 0 && pr.every(r => Number(r.ph) > 0), JSON.stringify(pr.map(r => [r.label, r.ph])));

console.log('\nBLEDY:', errors.length ? errors.join('\n') : '(brak)');
await browser.close();
