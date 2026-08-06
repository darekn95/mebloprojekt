import pw from '/opt/node22/lib/node_modules/playwright/index.js';
const { chromium } = pw;
const URL = 'http://127.0.0.1:5199/preview-local.html';
const OUTDIR = '.';

const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
const page = await ctx.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
page.on('console', (m) => { if (m.type() === 'error' && !/favicon/.test(m.text())) errors.push(m.text()); });

await page.goto(URL, { waitUntil: 'networkidle' });
await page.waitForTimeout(1500);

// zmien szerokosc, zeby wywolac auto-save
const width = page.locator('input[value="600"]').first();
await width.fill('850');
await page.waitForTimeout(1500); // debounce 800ms + zapas

// status w naglowku
const status = await page.evaluate(() => {
  const spans = [...document.querySelectorAll('span')];
  const s = spans.find((el) => /zapis|nie uda|wczyt/i.test(el.textContent));
  return s ? s.textContent : '(nie znaleziono statusu)';
});
const lsKeys = await page.evaluate(() => Object.keys(localStorage));
const lsVal = await page.evaluate(() => {
  const v = localStorage.getItem('szafki:projekt');
  return v ? v.slice(0, 120) : null;
});

console.log('STATUS w naglowku:', JSON.stringify(status));
console.log('localStorage klucze:', JSON.stringify(lsKeys));
console.log('localStorage szafki:projekt (fragment):', lsVal);
console.log('BLEDY:', errors.length ? errors.join(' | ') : '(brak)');

// Test 2: przeladuj strone -> czy wczytuje zapisany projekt (szerokosc 850)?
await page.reload({ waitUntil: 'networkidle' });
await page.waitForTimeout(1500);
const widthAfter = await page.evaluate(() => {
  const inp = [...document.querySelectorAll('input')].find((i) => i.value === '850');
  return inp ? inp.value : '(brak inputu 850)';
});
const statusAfter = await page.evaluate(() => {
  const spans = [...document.querySelectorAll('span')];
  const s = spans.find((el) => /zapis|nie uda|wczyt/i.test(el.textContent));
  return s ? s.textContent : '(brak)';
});
console.log('PO PRZELADOWANIU szerokosc:', widthAfter, '| status:', JSON.stringify(statusAfter));

await page.screenshot({ path: `${OUTDIR}/shot-saved.png` });
await browser.close();
