import pw from '/opt/node22/lib/node_modules/playwright/index.js';
const { chromium } = pw;
const URL = 'http://127.0.0.1:5205/mebloprojekt-app.html';
const S = './';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const page = await (await browser.newContext({ viewport: { width: 1400, height: 1000 } })).newPage();
const errors = [];
page.on('pageerror', (e) => errors.push('[pageerror] ' + e.message));
await page.goto(URL, { waitUntil: 'networkidle' });
await page.evaluate(() => { try { localStorage.clear(); } catch (e) {} });
await page.reload({ waitUntil: 'networkidle' });
await page.waitForTimeout(1500);

const h2 = page.locator('h2', { hasText: /^Blenda nad szafką$/ });
console.log('h2 count:', await h2.count());
await h2.first().scrollIntoViewIfNeeded();
await h2.first().click();
await page.waitForTimeout(400);
console.log('po rozwinieciu, checkboxy w karcie:', await page.evaluate(() => {
  const hs = [...document.querySelectorAll('h2')].filter(h => h.textContent.trim() === 'Blenda nad szafką');
  const sec = hs[0].closest('section');
  return sec.innerText;
}));
const cb = page.locator('section').filter({ has: page.locator('h2', { hasText: /^Blenda nad szafką$/ }) }).locator('input[type=checkbox]');
console.log('checkbox count:', await cb.count());
await cb.first().check();
await page.waitForTimeout(500);
console.log('po zaznaczeniu:', await page.evaluate(() => {
  const hs = [...document.querySelectorAll('h2')].filter(h => h.textContent.trim() === 'Blenda nad szafką');
  return hs[0].closest('section').innerText;
}));
await page.screenshot({ path: S + 'shot-blenda.png' });
console.log('BLEDY:', errors.length ? errors.join('\n') : '(brak)');
await browser.close();
