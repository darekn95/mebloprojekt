import pw from '/opt/node22/lib/node_modules/playwright/index.js';
const { chromium } = pw;
const URL = 'http://127.0.0.1:5205/mebloprojekt-app.html';
const S = './';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const page = await (await browser.newContext({ viewport: { width: 1440, height: 1200 } })).newPage();
const errors = [];
page.on('pageerror', (e) => errors.push('[pageerror] ' + e.message));
await page.goto(URL, { waitUntil: 'networkidle' });
await page.evaluate(() => { try { localStorage.clear(); } catch (e) {} });
await page.reload({ waitUntil: 'networkidle' });
await page.waitForTimeout(1500);

await page.getByText('+ wzmocnienie', { exact: true }).first().click();
await page.waitForTimeout(500);

// przepelnienia wewnatrz panelu
const bad = await page.evaluate(() => {
  const panel = document.querySelector('main > div');
  const out = [];
  const pr = panel.getBoundingClientRect();
  panel.querySelectorAll('*').forEach((el) => {
    const r = el.getBoundingClientRect();
    if (r.width === 0) return;
    if (r.right > pr.right + 1 || r.left < pr.left - 1)
      out.push(el.tagName + ' "' + el.textContent.trim().slice(0, 30) + '" ' + Math.round(r.left) + '-' + Math.round(r.right) + ' vs panel ' + Math.round(pr.left) + '-' + Math.round(pr.right));
  });
  return out.slice(0, 15);
});
console.log('Elementy wychodzace poza panel:', bad.length ? '\n  ' + bad.join('\n  ') : '(brak)');

const box = await page.locator('section').filter({ has: page.locator('h2', { hasText: /^Struktura wnętrza$/ }) }).first().boundingBox();
await page.screenshot({ path: S + 'shot-panel.png', clip: { x: box.x - 6, y: Math.max(0, box.y), width: box.width + 12, height: Math.min(1150, box.height) } });
console.log('BLEDY:', errors.length ? errors.join('\n') : '(brak)');
await browser.close();
