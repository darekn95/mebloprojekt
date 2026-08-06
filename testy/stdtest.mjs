import pw from '/opt/node22/lib/node_modules/playwright/index.js';
const { chromium } = pw;
const URL = 'http://127.0.0.1:5199/standalone-local.html';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
const errors = [];
page.on('pageerror', (e) => errors.push('[pageerror] ' + e.message));
page.on('console', (m) => { if (m.type() === 'error' && !/favicon/.test(m.text())) errors.push('[console] ' + m.text()); });
await page.goto(URL, { waitUntil: 'networkidle', timeout: 20000 });
await page.waitForTimeout(2500);
console.log('Renderuje sie (Korpus):', await page.evaluate(() => document.body.innerText.includes('Korpus')));
console.log('Ma pasek szafek:', await page.evaluate(() => document.body.innerText.includes('Szafki:')));
// dodaj druga szafke
try { await page.getByText('+ szafka', { exact: true }).click(); await page.waitForTimeout(600); } catch(e) { console.log('brak + szafka'); }
console.log('Po dodaniu — wspolna lista:', await page.evaluate(() => document.body.innerText.includes('Formatki całego projektu')));
console.log('Liczba zakladek Szafka:', await page.evaluate(() => [...document.querySelectorAll('button')].filter(b=>/^Szafka \d+$/.test(b.textContent.trim())).length));
console.log('BLEDY:', errors.length ? errors.join('\n') : '(brak)');
await browser.close();
