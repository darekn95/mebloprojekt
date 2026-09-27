import pw from './pw.mjs';
const { chromium } = pw;
// dawniej preview-local.html, ktorego nikt juz nie buduje — ten sam kod jest w buildzie testowym
const URL = process.env.STD ? 'http://127.0.0.1:5199/standalone-local.html'
  : 'http://127.0.0.1:5205/mebloprojekt-app.html';
const ok = (l, c, e = '') => console.log((c ? '  OK   ' : '  BLAD ') + l + (e ? ' — ' + e : ''));
const OUTDIR = '.';

const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
const page = await ctx.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
page.on('console', (m) => { if (m.type() === 'error' && !/favicon|404/.test(m.text())) errors.push(m.text()); });

await page.goto(URL, { waitUntil: 'networkidle' });
await page.evaluate(() => { try { localStorage.clear(); } catch (e) {} });
await page.reload({ waitUntil: 'networkidle' });
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
ok('projekt zapisany w przeglądarce', lsKeys.includes('szafki:projekt') && /850/.test(lsVal || ''), String(lsVal).slice(0, 80));

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
ok('po przeładowaniu wraca szerokość 850', widthAfter === '850', widthAfter);
ok('bez błędów strony', errors.length === 0, errors.join(' | '));

await page.screenshot({ path: `${OUTDIR}/shot-saved.png` });
await browser.close();
