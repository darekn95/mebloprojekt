/* Blat na rysunkach, prześwit między piętrami, kasowanie ciągu i odhaczanie
   ostrzeżeń — rzeczy, które widać dopiero w gotowej zabudowie. */
import pw from '/opt/node22/lib/node_modules/playwright/index.js';
const URL = process.env.STD ? 'http://127.0.0.1:5199/standalone-local.html'
  : 'http://127.0.0.1:5205/mebloprojekt-app.html';
const b = await pw.chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const page = await (await b.newContext({ viewport: { width: 1500, height: 1100 } })).newPage();
const errors = []; page.on('pageerror', (e) => errors.push('[pageerror] ' + e.message));
const ok = (l, c, e = '') => console.log((c ? '  OK   ' : '  BLAD ') + l + (e ? ' — ' + e : ''));
const klik = async (l) => {
  const btn = page.getByText(l, { exact: true }).first();
  if (!(await btn.count())) return false;
  await btn.click(); await page.waitForTimeout(900); return true;
};
const wiersz = (txt) => page.locator('header .space-y-1 > div').filter({ hasText: txt });
await page.goto(URL, { waitUntil: 'networkidle' });
await page.evaluate(() => { try { localStorage.clear(); } catch (e) {} });
await page.reload({ waitUntil: 'networkidle' });
await page.waitForTimeout(1800);
await page.getByRole('button', { name: '+ ciąg' }).click();
await page.waitForTimeout(800);
await wiersz('Ściana 1').getByRole('button', { name: '+ szafka' }).click();
await page.waitForTimeout(1000);
await wiersz('Ściana 1').getByRole('button', { name: '+ szafka' }).click();
await page.waitForTimeout(1200);

const BLAT = '#8d7b68';
const plyty = () => page.evaluate((kol) => [...document.querySelectorAll('svg rect')]
  .filter((r) => (r.getAttribute('fill') || '').toLowerCase() === kol)
  .map((r) => ({ x: +r.getAttribute('x'), y: +r.getAttribute('y'),
    w: +r.getAttribute('width'), h: +r.getAttribute('height') })), BLAT);

console.log('== blat w rzucie z góry ==');
/* Przy jednej scianie zakres „Zabudowa" jeszcze sie nie pojawia — rysunek
   calego ciagu jest pod „Ciąg". */
for (const l of ['Ciąg', 'Z góry']) await klik(l);
let bl = await plyty();
console.log('   ' + JSON.stringify(bl));
ok('blat jest w rzucie', bl.length === 1, String(bl.length));
/* Dwie szafki po 600 to jedna plyta 1200, glebokosc 500 + front 18 + wysieg 10. */
ok('idzie przez obie szafki', bl.length === 1 && bl[0].w === 1200, bl[0] && String(bl[0].w));
ok('głębokość to wymiar rzeczywisty', bl.length === 1 && bl[0].h === 528, bl[0] && String(bl[0].h));

console.log('\n== blat w elewacji ==');
await klik('Zamk.');
bl = await plyty();
console.log('   ' + JSON.stringify(bl));
ok('blat jest w elewacji', bl.length === 1, String(bl.length));
ok('leży na licu szafek, grubość 38', bl.length === 1 && bl[0].h === 38, bl[0] && String(bl[0].h));

console.log('\n== blat w bryle ==');
/* W bryle sciany dostaja kolor przycieniowany, wiec po samym kolorze blatu nie
   poznamy. Liczymy inaczej: zdjecie blatu z ciagu ma zabrac dokladnie jedna
   kostke, czyli szesc scian. */
await klik('3D');
const scian = () => page.locator('svg polygon').count();
const zBlatem = await scian();
await page.evaluate(() => {
  const p = JSON.parse(localStorage.getItem('szafki:projekt'));
  p.runs[0].worktop = false;
  localStorage.setItem('szafki:projekt', JSON.stringify(p));
});
await page.reload({ waitUntil: 'networkidle' });
await page.waitForTimeout(2000);
await klik('Ciąg');
await klik('3D');
const bezBlatu = await scian();
console.log(`   ścian: z blatem ${zBlatem}, bez ${bezBlatu}`);
ok('blat to jedna kostka w bryle', zBlatem - bezBlatu === 6, `${zBlatem} - ${bezBlatu}`);
await page.evaluate(() => {
  const p = JSON.parse(localStorage.getItem('szafki:projekt'));
  p.runs[0].worktop = true;
  localStorage.setItem('szafki:projekt', JSON.stringify(p));
});
await page.reload({ waitUntil: 'networkidle' });
await page.waitForTimeout(2000);

console.log('\n== prześwit między piętrami ==');
await klik('Zamk.');
await page.getByRole('button', { name: '+ ciąg górny' }).first().click();
await page.waitForTimeout(1200);
await wiersz('ciąg górny').getByRole('button', { name: '+ szafka' }).click();
await page.waitForTimeout(1400);
await klik('Ciąg');
await klik('Całość');
await klik('Zamk.');
const opisy = await page.evaluate(() =>
  [...document.querySelectorAll('svg text')].map((t) => t.textContent.trim()));
console.log('   opisy: ' + opisy.filter((t) => /^\d+$/.test(t)).join(' '));
/* Lico dolnej szafki to cokol 100 + korpus 720, blat 38, a przeswit 500. */
ok('prześwit 500 jest na rysunku', opisy.includes('500'), opisy.slice(0, 12).join(' | '));
ok('wysokość zawieszenia też', opisy.includes('1358'), opisy.slice(0, 12).join(' | '));

console.log('\n== kasowanie ciągu ==');
const przed = await page.evaluate(() => JSON.parse(localStorage.getItem('szafki:projekt')));
const kasuj = wiersz('Ściana 1 — ciąg dolny').getByRole('button', { name: '× ciąg' });
ok('przycisk kasowania jest', await kasuj.count() === 1, String(await kasuj.count()));
await kasuj.first().click();
await page.waitForTimeout(1400);
const po = await page.evaluate(() => JSON.parse(localStorage.getItem('szafki:projekt')));
console.log(`   ciągi ${przed.runs.length} → ${po.runs.length}, szafki ${przed.items.length} → ${po.items.length}`);
ok('ciąg zniknął razem z piętrem', po.runs.length === 0, String(po.runs.length));
ok('szafki ciągu poszły z nim', po.items.length === przed.items.length - 3,
  `${przed.items.length} → ${po.items.length}`);
ok('wolnostojąca szafka została', po.items.length >= 1, String(po.items.length));

console.log('\nBLEDY:', errors.length ? errors.join('; ') : '(brak)');
await b.close();
