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

const countLevels = () => page.evaluate(() =>
  [...document.querySelectorAll('span')].filter(s => /^Poziom \d+$/.test(s.textContent.trim())).length);

async function fillLevel(n, val) {
  const row = page.locator('div.flex.items-center.gap-2', { has: page.getByText(`Poziom ${n}`, { exact: true }) });
  const inp = row.locator('input').first();
  await inp.scrollIntoViewIfNeeded();
  await inp.fill(String(val));
  await inp.blur();
  await page.waitForTimeout(500);
}

console.log('Poziomow na starcie:', await countLevels());
await fillLevel(1, 200);
console.log('Po wpisaniu 200 w Poz.1:', await countLevels(), '(oczekiwane 2)');
await fillLevel(2, 200);
console.log('Po wpisaniu 200 w Poz.2:', await countLevels(), '(oczekiwane 3)');
await fillLevel(3, 300);
console.log('Po wpisaniu 300 w Poz.3:', await countLevels(), '(oczekiwane 3 — brak miejsca)');
console.log('BLEDY:', errors.length ? errors.join(' | ') : '(brak)');
await browser.close();
