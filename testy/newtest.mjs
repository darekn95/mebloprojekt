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

// zmien szerokosc na 900
await page.locator('input[value="600"]').first().fill('900');
await page.waitForTimeout(400);

// klik "Nowy projekt"
await page.getByText('Nowy projekt', { exact: true }).click();
await page.waitForTimeout(400);
const modalVisible = await page.evaluate(() => document.body.innerText.includes('Zacząć nowy projekt?'));
console.log('Modal potwierdzenia pojawil sie:', modalVisible);

// klik "Tak, nowy projekt"
await page.getByText('Tak, nowy projekt', { exact: true }).click();
await page.waitForTimeout(500);

// czy szerokosc wrocila do 600?
const widthReset = await page.evaluate(() => {
  const inp = [...document.querySelectorAll('input')].find(i => i.value === '600');
  return inp ? '600 (reset OK)' : 'brak inputu 600 (reset NIE zadzialal)';
});
console.log('Po resecie szerokosc:', widthReset);
const modalGone = await page.evaluate(() => !document.body.innerText.includes('Zacząć nowy projekt?'));
console.log('Modal zamkniety po resecie:', modalGone);
console.log('BLEDY:', errors.length ? errors.join(' | ') : '(brak)');
await browser.close();
