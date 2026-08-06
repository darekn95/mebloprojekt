import pw from '/opt/node22/lib/node_modules/playwright/index.js';
const { chromium } = pw;
const URL = 'http://127.0.0.1:5205/mebloprojekt-app.html';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
const page = await ctx.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
page.on('console', (m) => { if (m.type() === 'error' && !/favicon/.test(m.text())) errors.push(m.text()); });
await page.addInitScript(() => { try { localStorage.clear(); } catch (e) {} });
await page.goto(URL, { waitUntil: 'networkidle' });
await page.waitForTimeout(1500);

const countCols = () => page.evaluate(() =>
  [...document.querySelectorAll('span')].filter(s => /^Kolumna \d+$/.test(s.textContent.trim())).length);

async function fillCol(n, val) {
  const row = page.locator('div.flex.items-center.gap-2', { has: page.getByText(`Kolumna ${n}`, { exact: true }) });
  const inp = row.locator('input').first();
  await inp.scrollIntoViewIfNeeded();
  await inp.fill(String(val));
  await inp.blur();
  await page.waitForTimeout(500);
}

// szerokosc 900 (innerW = 864)
await page.locator('input[value="600"]').first().fill('900');
await page.waitForTimeout(400);

console.log('Kolumn na starcie:', await countCols());
await fillCol(1, 250);
console.log('Po wpisaniu 250 w Kol.1:', await countCols(), '(oczekiwane 2)');
await fillCol(2, 250);
console.log('Po wpisaniu 250 w Kol.2:', await countCols(), '(oczekiwane 3)');
await fillCol(3, 250);
console.log('Po wpisaniu 250 w Kol.3:', await countCols(), '(oczekiwane 3 — brak miejsca)');

console.log('BLEDY:', errors.length ? errors.join(' | ') : '(brak)');
await browser.close();
