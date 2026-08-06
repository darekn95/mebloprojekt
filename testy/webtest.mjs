import pw from '/opt/node22/lib/node_modules/playwright/index.js';
const { chromium } = pw;

const URL = process.argv[2] || 'http://localhost:5173/';
const OUT = process.argv[3] || './shot.png';

const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });

const logs = [];
page.on('console', (msg) => logs.push(`[console.${msg.type()}] ${msg.text()}`));
page.on('pageerror', (err) => logs.push(`[pageerror] ${err.message}`));
page.on('requestfailed', (req) => {
  const f = req.failure();
  logs.push(`[requestfailed] ${req.url()} :: ${f ? f.errorText : '?'}`);
});

let navErr = null;
try {
  await page.goto(URL, { waitUntil: 'networkidle', timeout: 20000 });
} catch (e) {
  navErr = e.message;
}
// give React a moment to mount / throw
await page.waitForTimeout(2500);

const rootHtml = await page.evaluate(() => {
  const r = document.getElementById('root');
  return r ? r.innerHTML.slice(0, 600) : '(no #root)';
});
const bodyText = await page.evaluate(() => document.body.innerText.slice(0, 500));

await page.screenshot({ path: OUT, fullPage: false });

console.log('=== URL ===', URL);
if (navErr) console.log('=== NAV ERROR ===', navErr);
console.log('=== #root innerHTML (first 600 chars) ===');
console.log(rootHtml);
console.log('=== body innerText (first 500 chars) ===');
console.log(bodyText);
console.log('=== LOGS (' + logs.length + ') ===');
console.log(logs.join('\n') || '(none)');

await browser.close();
