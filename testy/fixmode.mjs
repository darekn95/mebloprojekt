import pw from '/opt/node22/lib/node_modules/playwright/index.js';
const { chromium } = pw;
const URL = 'http://127.0.0.1:5205/mebloprojekt-app.html';
const S = './';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const page = await (await browser.newContext({ viewport: { width: 1440, height: 1000 } })).newPage();
const errors = [];
page.on('pageerror', (e) => errors.push('[pageerror] ' + e.message));
await page.goto(URL, { waitUntil: 'networkidle' });
await page.evaluate(() => { try { localStorage.clear(); } catch (e) {} });
await page.reload({ waitUntil: 'networkidle' });
await page.waitForTimeout(1500);
const struct = page.locator('section').filter({ has: page.locator('h2', { hasText: /^Struktura wnętrza$/ }) }).first();
const fixPart = () => page.evaluate(() => {
  const out = [];
  document.querySelectorAll('tr').forEach((tr) => {
    const c = [...tr.querySelectorAll('td')].map((d) => d.innerText.trim().split('\n')[0]);
    if (c.length >= 4 && /Element stały/.test(c[0])) out.push(c[2] + ' x ' + c[3]);
  });
  return out.join(', ');
});

await struct.getByText('lewa', { exact: true }).first().click();
await page.waitForTimeout(700);
console.log('fix lewa, NAKŁADANY, kol. skrajna:', await fixPart(), '(oczekiwane 720 x 60 — bez luzów)');

await struct.getByText('W obrysie', { exact: true }).first().click();
await page.waitForTimeout(700);
console.log('fix lewa, W OBRYSIE:                ', await fixPart(), '(oczekiwane 680 x 60 — luzy jak dotąd)');

await struct.getByText('Na korpusie', { exact: true }).first().click();
await page.waitForTimeout(500);

// trzy kolumny — fix prawa w kolumnie srodkowej
await page.locator('input[value="600"]').first().fill('1200');
await page.waitForTimeout(400);
async function fillCol(n, val) {
  const row = page.locator('div.flex.items-center.gap-2', { has: page.getByText(`Kolumna ${n}`, { exact: true }) });
  const inp = row.locator('input').first();
  await inp.scrollIntoViewIfNeeded(); await inp.fill(String(val)); await inp.blur();
  await page.waitForTimeout(500);
}
await fillCol(1, 380); await fillCol(2, 380);
await page.waitForTimeout(500);
const nCols = await page.evaluate(() => [...document.querySelectorAll('span')].filter(s => /^Kolumna \d+$/.test(s.textContent.trim())).length);
console.log('\nkolumn:', nCols);
// przelacz fix kol.1 na brak, kol.2 na prawa
await struct.getByText('brak', { exact: true }).first().click();
await page.waitForTimeout(500);
await struct.getByText('prawa', { exact: true }).nth(1).click();
await page.waitForTimeout(800);
console.log('fix prawa w kolumnie ŚRODKOWEJ:     ', await fixPart(), '(oczekiwane ~716 x 60 — luzy zostają, bo nie dotyka boku)');

await page.evaluate(() => window.scrollTo(0, 0));
try { await page.locator('svg').first().screenshot({ path: S + 'shot-fixmid.png' }); } catch (e) {}
console.log('BLEDY:', errors.length ? errors.join('\n') : '(brak)');
await browser.close();
