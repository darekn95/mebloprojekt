import pw from '/opt/node22/lib/node_modules/playwright/index.js';
const { chromium } = pw;
const URL = 'http://127.0.0.1:5205/mebloprojekt-app.html';
const OUT = './shot-multi.png';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
const page = await ctx.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
page.on('console', (m) => { if (m.type() === 'error' && !/favicon/.test(m.text())) errors.push(m.text()); });
await page.goto(URL, { waitUntil: 'networkidle' });
await page.evaluate(() => { try { localStorage.clear(); } catch (e) {} });
await page.reload({ waitUntil: 'networkidle' });
await page.waitForTimeout(1500);

const widthInput = () => page.locator('input[type="number"]').first();
const nameInput = () => page.locator('input[placeholder="Nazwa szafki"]').first();
const tab = (name) => page.locator('button', { hasText: new RegExp('^' + name + '$') }).first();

console.log('Start: nazwa =', JSON.stringify(await nameInput().inputValue()), ', szer =', await widthInput().inputValue());

// dodaj druga szafke
await page.getByText('+ szafka', { exact: true }).click();
await page.waitForTimeout(500);
console.log('Po dodaniu: nazwa =', JSON.stringify(await nameInput().inputValue()), ', szer =', await widthInput().inputValue(), '(oczekiwane Szafka 2 / 600)');

// ustaw szer szafki 2 na 900
await widthInput().fill('900');
await page.waitForTimeout(400);

// przelacz na Szafke 1
await tab('Szafka 1').click();
await page.waitForTimeout(400);
console.log('Szafka 1 szer =', await widthInput().inputValue(), '(oczekiwane 600 — niezalezne)');

// przelacz na Szafke 2
await tab('Szafka 2').click();
await page.waitForTimeout(400);
console.log('Szafka 2 szer =', await widthInput().inputValue(), '(oczekiwane 900)');

// zmien nazwe szafki 2
await nameInput().fill('Górna');
await page.waitForTimeout(400);
const hasGorna = await page.evaluate(() => [...document.querySelectorAll('button')].some(b => b.textContent.trim() === 'Górna'));
console.log('Zakladka pokazuje "Górna":', hasGorna);

await page.screenshot({ path: OUT, clip: { x: 0, y: 0, width: 1280, height: 110 } });

// przeladuj — czy dwie szafki przetrwaly?
await page.waitForTimeout(900);
await page.reload({ waitUntil: 'networkidle' });
await page.waitForTimeout(1500);
const tabsAfter = await page.evaluate(() => [...document.querySelectorAll('button')].map(b => b.textContent.trim()).filter(t => t === 'Szafka 1' || t === 'Górna'));
console.log('Po przeladowaniu zakladki:', JSON.stringify(tabsAfter), '(oczekiwane Szafka 1 + Górna)');

console.log('BLEDY:', errors.length ? errors.join(' | ') : '(brak)');
await browser.close();
