import pw from '/opt/node22/lib/node_modules/playwright/index.js';
const { chromium } = pw;
const URL = 'http://127.0.0.1:5205/mebloprojekt-app.html';
const OUT = './shot-projlist.png';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const ctx = await browser.newContext({ viewport: { width: 1280, height: 1400 } });
const page = await ctx.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
page.on('console', (m) => { if (m.type() === 'error' && !/favicon/.test(m.text())) errors.push(m.text()); });
await page.goto(URL, { waitUntil: 'networkidle' });
await page.evaluate(() => { try { localStorage.clear(); } catch (e) {} });
await page.reload({ waitUntil: 'networkidle' });
await page.waitForTimeout(1500);

const totals = () => page.evaluate(() => {
  const labels = [...document.querySelectorAll('span')].filter(s => s.textContent.trim() === 'Sztuk razem');
  return labels.map(l => l.nextElementSibling ? l.nextElementSibling.textContent.trim() : null);
});
const hasProjectCard = () => page.evaluate(() => document.body.innerText.includes('Formatki całego projektu'));

console.log('Przy 1 szafce — karta projektu istnieje:', await hasProjectCard(), '(oczekiwane false)');
const t1 = await totals();
console.log('Sztuk razem (1 szafka):', JSON.stringify(t1));

// dodaj druga szafke (identyczna, domyslna)
await page.getByText('+ szafka', { exact: true }).click();
await page.waitForTimeout(600);

console.log('Przy 2 szafkach — karta projektu istnieje:', await hasProjectCard(), '(oczekiwane true)');
const t2 = await totals();
console.log('Sztuk razem [per-szafka, projekt]:', JSON.stringify(t2));
const perCab = Number(t2[0]), proj = Number(t2[1]);
console.log('Weryfikacja: projekt', proj, '== 2 ×', perCab, '=', 2 * perCab, '->', proj === 2 * perCab ? 'OK' : 'BLAD');

await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
await page.waitForTimeout(300);
try { await page.screenshot({ path: OUT, fullPage: true }); } catch (e) {}
console.log('BLEDY:', errors.length ? errors.join(' | ') : '(brak)');
await browser.close();
