import pw from '/opt/node22/lib/node_modules/playwright/index.js';
const { chromium } = pw;
const URL = 'http://127.0.0.1:5205/mebloprojekt-app.html';
const OUT = './shot-name.png';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
const page = await ctx.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
page.on('console', (m) => { if (m.type() === 'error' && !/favicon/.test(m.text())) errors.push(m.text()); });
await page.addInitScript(() => { try { localStorage.clear(); } catch (e) {} });
await page.goto(URL, { waitUntil: 'networkidle' });
await page.waitForTimeout(1500);

const nameInput = page.locator('input[placeholder="Nazwa szafki"]').first();
console.log('Pole nazwy istnieje:', await nameInput.count() > 0);
console.log('Wartosc domyslna:', JSON.stringify(await nameInput.inputValue()));

await nameInput.fill('Szafka kuchenna dolna');
await page.waitForTimeout(1200); // debounce zapisu
console.log('Po zmianie:', JSON.stringify(await nameInput.inputValue()));

const ls = await page.evaluate(() => {
  const v = localStorage.getItem('szafki:projekt');
  if (!v) return null;
  try { return JSON.parse(v).cab.name; } catch { return '(blad)'; }
});
console.log('Zapisane w localStorage:', JSON.stringify(ls));

await page.screenshot({ path: OUT, clip: { x: 0, y: 0, width: 1280, height: 60 } });
console.log('BLEDY:', errors.length ? errors.join(' | ') : '(brak)');
await browser.close();
