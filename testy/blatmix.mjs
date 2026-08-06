import pw from '/opt/node22/lib/node_modules/playwright/index.js';
const { chromium } = pw;
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const page = await (await browser.newContext({ viewport: { width: 1500, height: 1100 } })).newPage();
const errors = [];
page.on('pageerror', (e) => errors.push('[pageerror] ' + e.message));
await page.goto('http://127.0.0.1:5205/mebloprojekt-app.html', { waitUntil: 'networkidle' });
await page.evaluate(() => { try { localStorage.clear(); } catch (e) {} });
await page.reload({ waitUntil: 'networkidle' });
await page.waitForTimeout(1500);
const card = (re) => page.locator('section').filter({ has: page.locator('h2', { hasText: re }) }).first();
const rows = () => card(/^Formatki do zamówienia$/).evaluate((s) =>
  [...s.querySelectorAll('tbody tr')].map(tr => [...tr.querySelectorAll('td')].map(td => td.innerText.trim().split('\n')[0]).join(' | ')));

// blat + fix "góra"
await card(/^Korpus$/).getByText('Blat', { exact: true }).click();
await page.waitForTimeout(700);
const nums = card(/^Korpus$/).locator('input[type=number]');
await nums.nth(5).fill('40'); await nums.nth(5).blur();  // wysunięcie do przodu
await page.waitForTimeout(600);
await card(/^Struktura wnętrza$/).getByText('góra', { exact: true }).first().click();
await page.waitForTimeout(900);
console.log('BLAT + FIX "GÓRA" (H=720, blat 18):');
(await rows()).forEach(r => console.log('   ' + r));
console.log('   fix powinien kończyć się pod blatem, czyli na 702, a nie na 720');

// blat + blenda nad szafką
await card(/^Struktura wnętrza$/).getByText('brak', { exact: true }).first().click();
await page.waitForTimeout(500);
const bl = card(/^Blenda nad szafką$/);
await bl.locator('h2').click(); await page.waitForTimeout(400);
await bl.getByText('Blenda nad szafką', { exact: true }).last().click();
await page.waitForTimeout(900);
console.log('\nBLAT + BLENDA:');
(await rows()).forEach(r => console.log('   ' + r));
const notes = await page.evaluate(() => [...document.querySelectorAll('li')].map(l => l.innerText.replace(/\s+/g,' ').trim()).filter(Boolean));
console.log('   uwagi:', notes.join(' // ') || '(brak)');
console.log('\nBLEDY:', errors.length ? errors.join('\n') : '(brak)');
await browser.close();
