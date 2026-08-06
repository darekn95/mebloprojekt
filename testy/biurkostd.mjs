import pw from '/opt/node22/lib/node_modules/playwright/index.js';
const { chromium } = pw;
const S = './';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const page = await (await browser.newContext({ viewport: { width: 1500, height: 1150 } })).newPage();
const errors = [];
page.on('pageerror', (e) => errors.push('[pageerror] ' + e.message));
page.on('console', (m) => { if (m.type() === 'error' && !/favicon|404/.test(m.text())) errors.push('[console] ' + m.text()); });
const ok = (l, c, e = '') => console.log((c ? '  OK   ' : '  BLAD ') + l + (e ? ' — ' + e : ''));
await page.goto('http://127.0.0.1:5199/standalone-local.html', { waitUntil: 'networkidle' });
await page.evaluate(() => { try { localStorage.clear(); } catch (e) {} });
await page.reload({ waitUntil: 'networkidle' });
await page.waitForTimeout(1500);
const card = (re) => page.locator('section').filter({ has: page.locator('h2', { hasText: re }) }).first();
const cutRows = () => card(/^Formatki do zamówienia$/).evaluate((sec) =>
  [...sec.querySelectorAll('tbody tr')].map(tr => [...tr.querySelectorAll('td')].map(td => td.innerText.trim().split('\n')[0]).join(' | ')));

console.log('== szablon biurka: 1200 szerokości, wysunięcia 50 + 50 ==');
await page.locator('select[title="Dodaj szafkę z gotowego szablonu"]').selectOption('biurko');
await page.waitForTimeout(1800);
const korpus = card(/^Korpus$/);
const wIn = await korpus.locator('input[type=number]').first().inputValue();
ok('podana szerokość zostaje 1200', wIn === '1200', wIn);

let rows = await cutRows();
rows.forEach(r => console.log('     ' + r));
const cell = (r, i) => (r.split('|')[i] || '').trim();
const blat = rows.find(r => /^Blat/.test(r)) || '';
ok('blat ma 1200 mm, nie 1300', cell(blat, 2) === '1200', cell(blat, 2));
ok('głębokość blatu 600 + 30 = 630', cell(blat, 3) === '630', cell(blat, 3));
// boki: korpus 1200 - 50 - 50 = 1100, wiec dno/wieniec miedzy bokami = 1100 - 2*18 = 1064
const dno = rows.find(r => /Dno|Wieniec|wieniec/.test(r)) || '';
console.log('  dno/wieniec:', dno || '(brak — biurko nie ma dna)');

const geo = await page.evaluate(() => {
  const svg = document.querySelector('svg');
  const rs = [...svg.querySelectorAll('rect')].map(r => ({
    x: Math.round(+r.getAttribute('x')), w: Math.round(+r.getAttribute('width')),
    y: Math.round(+r.getAttribute('y')), h: Math.round(+r.getAttribute('height')) }));
  return { vb: svg.getAttribute('viewBox'), blat: rs.find(r => r.w === 1200 && r.h === 18) || null,
    boki: rs.filter(r => r.w === 18 && r.h > 500).map(r => r.x).sort((a,b)=>a-b) };
});
console.log('  blat na rysunku:', JSON.stringify(geo.blat), '| boki X:', geo.boki.join(', '));
// rysunek ma zero na lewym boku korpusu, wiec blat wystaje na -50 i +50
ok('blat wystaje 50 mm poza lewy bok', geo.blat && geo.blat.x === -50, JSON.stringify(geo.blat));
ok('blat kończy się 50 mm za prawym bokiem', geo.blat && geo.blat.x + geo.blat.w === 1150, String(geo.blat && geo.blat.x + geo.blat.w));
ok('boki stoją na 0 i 1082 (korpus 1100)', geo.boki[0] === 0 && geo.boki[1] === 1082, geo.boki.join(', '));
ok('rozstaw boków = 1100', geo.boki[1] + 18 - geo.boki[0] === 1100, String(geo.boki[1] + 18 - geo.boki[0]));

console.log('\n== przełącznik szerokości ==');
ok('pole wyboru jest', await korpus.getByText('Szerokość blatu', { exact: true }).count() === 1);
await korpus.getByText('Szerokość korpusu', { exact: true }).click();
await page.waitForTimeout(1000);
rows = await cutRows();
const blat2 = rows.find(r => /^Blat/.test(r)) || '';
ok('tryb "szerokość korpusu" daje blat 1300', cell(blat2, 2) === '1300', cell(blat2, 2));
const geo2 = await page.evaluate(() => {
  const rs = [...document.querySelector('svg').querySelectorAll('rect')].map(r => ({
    x: Math.round(+r.getAttribute('x')), w: Math.round(+r.getAttribute('width')), h: Math.round(+r.getAttribute('height')) }));
  return rs.filter(r => r.w === 18 && r.h > 500).map(r => r.x).sort((a,b)=>a-b);
});
ok('korpus wraca na pełne 1200 (boki 0 i 1182)', geo2[0] === 0 && geo2[1] === 1182, geo2.join(', '));
await korpus.getByText('Szerokość blatu', { exact: true }).click();
await page.waitForTimeout(900);

console.log('\n== zwykła szafka z blatem nie zmienia znaczenia ==');
await page.getByText('+ szafka', { exact: true }).click();
await page.waitForTimeout(1000);
const k2 = card(/^Korpus$/);
await k2.getByText('Blat', { exact: true }).click();
await page.waitForTimeout(900);
const seg = await k2.evaluate((s) => [...s.querySelectorAll('button')].filter(b => b.className.includes('bg-teal-700')).map(b => b.textContent.trim()));
ok('nowa szafka startuje w trybie "szerokość korpusu"', seg.includes('Szerokość korpusu'), seg.join(', '));

console.log('\n== widoki bez błędów ==');
await page.getByRole('button', { name: 'Szafka 1', exact: true }).click().catch(()=>{});
await page.waitForTimeout(600);
for (const v of ['Zamk.', 'Otw.', 'Z boku', 'Z góry', 'Z tyłu', '3D']) {
  const n = errors.length;
  await page.getByText(v, { exact: true }).first().click();
  await page.waitForTimeout(700);
  ok('widok ' + v, errors.length === n);
}
await page.getByText('Zamk.', { exact: true }).first().click();
await page.waitForTimeout(700);
await page.locator('svg').first().screenshot({ path: S + 'shot-biurko.png' });
console.log('\nBLEDY:', errors.length ? errors.join('\n') : '(brak)');
await browser.close();
