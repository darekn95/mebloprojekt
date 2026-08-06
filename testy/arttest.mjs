import pw from '/opt/node22/lib/node_modules/playwright/index.js';
const { chromium } = pw;
const URL = 'http://127.0.0.1:5205/mebloprojekt-app.html';
const OUT = './shot-artifact.png';

const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
const errors = [];
const external = [];
page.on('pageerror', (e) => errors.push('[pageerror] ' + e.message));
page.on('console', (m) => { if (m.type() === 'error' && !/favicon/.test(m.text())) errors.push('[console] ' + m.text()); });
page.on('request', (r) => {
  const u = r.url();
  if (!u.startsWith('http://127.0.0.1:5205') && !u.startsWith('data:') && !u.startsWith('blob:')) external.push(u);
});

await page.goto(URL, { waitUntil: 'networkidle', timeout: 20000 });
await page.waitForTimeout(2000);

const rootLen = await page.evaluate(() => document.getElementById('root').innerHTML.length);
const hasApp = await page.evaluate(() => document.body.innerText.includes('Korpus'));
const styled = await page.evaluate(() => {
  const h = document.querySelector('header');
  if (!h) return 'brak header';
  const bg = getComputedStyle(h).backgroundColor;
  return bg;
});

// szybki test interakcji: klik "3D"
let clickErr = '(nie testowano)';
try {
  await page.getByText('3D', { exact: true }).first().click({ timeout: 4000 });
  await page.waitForTimeout(600);
  clickErr = 'klik 3D ok';
} catch (e) { clickErr = 'klik 3D: ' + e.message.split('\n')[0]; }

await page.screenshot({ path: OUT });

console.log('root innerHTML len:', rootLen);
console.log('zawiera "Korpus":', hasApp);
console.log('header background:', styled);
console.log('interakcja:', clickErr);
console.log('ZAPYTANIA ZEWNETRZNE (powinno byc 0):', external.length, external.slice(0, 5).join(', '));
console.log('BLEDY:', errors.length ? errors.join('\n') : '(brak)');
await browser.close();
