import pw from '/opt/node22/lib/node_modules/playwright/index.js';
const { chromium } = pw;
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const page = await (await browser.newContext({ viewport: { width: 1500, height: 1150 } })).newPage();
await page.goto('http://127.0.0.1:5205/mebloprojekt-app.html', { waitUntil: 'networkidle' });
await page.evaluate(() => { try { localStorage.clear(); } catch (e) {} });
await page.reload({ waitUntil: 'networkidle' });
await page.waitForTimeout(2000);
const card = (re) => page.locator('section').filter({ has: page.locator('h2', { hasText: re }) }).first();
const rows = await card(/^Formatki do zamówienia$/).evaluate((s) =>
  [...s.querySelectorAll('tbody tr')].map(tr => [...tr.querySelectorAll('td')].slice(0,2).map(td => td.innerText.trim()).join(' → ')));
rows.forEach(r => console.log('   ', r));
console.log('\n  różne materiały:', [...new Set(rows.map(r => r.split(' → ')[1]))].join(' | '));
await browser.close();
