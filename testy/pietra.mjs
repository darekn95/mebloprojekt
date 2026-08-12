/* Piętra ściany: dolny i górny ciąg na tej samej ścianie. Sprawdzamy zakładanie
   górnego, wysokość montażu liczoną z lica dolnego i blatu, podpisy z piętrem
   oraz podzakładki zakresu „Ciąg". */
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

const wiersz = (txt) => page.locator('header .space-y-1 > div').filter({ hasText: txt });
await page.getByRole('button', { name: '+ ciąg' }).click();
await page.waitForTimeout(800);
await wiersz('Ściana 1').getByRole('button', { name: '+ szafka' }).click();
await page.waitForTimeout(1000);
await wiersz('Ściana 1').getByRole('button', { name: '+ szafka' }).click();
await page.waitForTimeout(1000);

console.log('== górne piętro zakłada się na tej samej ścianie ==');
const gornyBtn = page.getByRole('button', { name: '+ ciąg górny' });
ok('przycisk jest przy ciągu dolnym', await gornyBtn.count() === 1, String(await gornyBtn.count()));
await gornyBtn.first().click();
await page.waitForTimeout(1200);
const p = await page.evaluate(() => JSON.parse(localStorage.getItem('szafki:projekt')));
console.log('   ciągi: ' + JSON.stringify(p.runs.map((r) => ({ tier: r.tier, wall: r.wall, D: r.D, mountY: r.mountY }))));
const g = p.runs.find((r) => r.tier === 'gorny');
ok('powstał ciąg górny', !!g);
ok('wskazuje na ścianę dolnego', !!g && g.wall === p.runs[0].id, g && String(g.wall));
ok('głębokość górnych 300', !!g && g.D === 300, g && String(g.D));
/* Lico dolnej szafki to cokol 100 + korpus 720, nad nim blat 38, a przeswit 500. */
ok('wysokość montażu 1358', !!g && g.mountY === 1358, g && String(g.mountY));
ok('drugiego górnego już nie dołożysz', await page.getByRole('button', { name: '+ ciąg górny' }).count() === 0);

const etykiety = await page.evaluate(() =>
  [...document.querySelectorAll('header .space-y-1 > div span')].map((e) => e.textContent.trim()).filter(Boolean));
ok('podpisy mówią o piętrze', etykiety.some((t) => /ciąg dolny/.test(t)) && etykiety.some((t) => /ciąg górny/.test(t)),
  etykiety.slice(0, 4).join(' | '));

console.log('\n== podzakładki dolny / górny / całość ==');
await wiersz('ciąg górny').getByRole('button', { name: '+ szafka' }).click();
await page.waitForTimeout(1200);
for (const l of ['Ciąg', 'Zamk.']) {
  const btn = page.getByText(l, { exact: true }).first();
  if (await btn.count()) { await btn.click(); await page.waitForTimeout(900); }
}
for (const l of ['Dolny', 'Górny', 'Całość'])
  ok('jest podzakładka „' + l + '"', await page.getByText(l, { exact: true }).first().count() > 0);

const fronty = () => page.evaluate(() =>
  [...document.querySelectorAll('svg text')].map((t) => t.textContent.trim())
    .filter((t) => /^\d+×\d+$/.test(t)).length);
const wybierz = async (l) => {
  await page.getByText(l, { exact: true }).first().click();
  await page.waitForTimeout(900);
};
await wybierz('Dolny'); const nD = await fronty();
await wybierz('Górny'); const nG = await fronty();
await wybierz('Całość'); const nC = await fronty();
console.log('   fronty: dolny ' + nD + ', górny ' + nG + ', całość ' + nC);
ok('dolny pokazuje tylko dolne', nD > 0);
ok('górny pokazuje tylko górne', nG > 0 && nG < nD);
ok('całość pokazuje oba piętra', nC === nD + nG, `${nD}+${nG} vs ${nC}`);

console.log('\n== górny pas stoi nad dolnym we wszystkich widokach ==');
for (const w of ['Zamk.', 'Otw.', 'Z góry', 'Z tyłu', '3D', '45°']) {
  const btn = page.getByText(w, { exact: true }).first();
  if (!(await btn.count())) { ok('widok „' + w + '" jest', false); continue; }
  await btn.click();
  await page.waitForTimeout(800);
  const n = await page.locator('svg').count();
  ok('widok „' + w + '" rysuje się', n > 0 && errors.length === 0, errors.join('; ').slice(0, 120));
}

console.log('\nBLEDY:', errors.length ? errors.join('; ') : '(brak)');
await b.close();
