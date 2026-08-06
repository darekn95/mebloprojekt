import pw from '/opt/node22/lib/node_modules/playwright/index.js';
const { chromium } = pw;
const URL = 'http://127.0.0.1:5205/mebloprojekt-app.html';
const S = './';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const page = await (await browser.newContext({ viewport: { width: 1440, height: 1050 } })).newPage();
const errors = [];
page.on('pageerror', (e) => errors.push('[pageerror] ' + e.message));
await page.goto(URL, { waitUntil: 'networkidle' });
await page.evaluate(() => { try { localStorage.clear(); } catch (e) {} });
await page.reload({ waitUntil: 'networkidle' });
await page.waitForTimeout(1500);
const clickView = async (v) => { await page.getByText(v, { exact: true }).first().click(); await page.waitForTimeout(700); };
const struct = page.locator('section').filter({ has: page.locator('h2', { hasText: /^Struktura wnętrza$/ }) }).first();
const gapVals = () => page.evaluate(() => {
  const svg = document.querySelector('svg');
  return [...svg.querySelectorAll('text')].map(t => t.textContent.trim()).filter(t => /^-?\d+$/.test(t) && +t < 60);
});

// W = 900, kol.1 = drzwi 500, kol.2 = szuflady wewnatrz
await page.locator('input[value="600"]').first().fill('900');
await page.waitForTimeout(400);
const row = page.locator('div.flex.items-center.gap-2', { has: page.getByText('Kolumna 1', { exact: true }) });
const inp = row.locator('input').first();
await inp.scrollIntoViewIfNeeded(); await inp.fill('500'); await inp.blur();
await page.waitForTimeout(800);
await struct.getByText('Szuflady', { exact: true }).nth(1).click();
await page.waitForTimeout(700);
for (let i = 0; i < 1; i++) { await page.getByText('+ szuflada', { exact: true }).first().click(); await page.waitForTimeout(300); }
await page.waitForTimeout(600);

await clickView('Zamk.');
await page.getByText('Pokaż szczeliny', { exact: true }).first().click();
await page.waitForTimeout(700);
console.log('A) szuflady NAKŁADANE — szczeliny:', (await gapVals()).join(', '));
try { await page.locator('svg').first().screenshot({ path: S + 'shot-gap-a.png' }); } catch (e) {}

await struct.locator('div.flex.items-center.gap-2', { has: page.getByText('fronty', { exact: true }) })
  .getByText('Wewnątrz', { exact: true }).click();
await page.waitForTimeout(900);
console.log('B) szuflady WEWNĄTRZ — szczeliny:', (await gapVals()).join(', '), '— nie powinno być 22, tylko 2 od przegrody');
try { await page.locator('svg').first().screenshot({ path: S + 'shot-gap-b.png' }); } catch (e) {}

await clickView('Z góry');
const topFronts = await page.evaluate(() => {
  const svg = document.querySelector('svg');
  const vb = svg.getAttribute('viewBox').split(/\s+/).map(Number);
  return [...svg.querySelectorAll('rect')]
    .filter(r => +r.getAttribute('height') > 15 && +r.getAttribute('height') < 22 && +r.getAttribute('width') > 100)
    .map(r => 'x ' + Math.round(+r.getAttribute('x')) + '..' + Math.round(+r.getAttribute('x') + +r.getAttribute('width')) + ' @y ' + Math.round(+r.getAttribute('y')));
});
console.log('\nC) widok z góry — pasy frontów:', topFronts.join(' | '));
console.log('   korpus 900 głęb. 500: front nakładany na y=500, wpuszczony na y=482');
try { await page.locator('svg').first().screenshot({ path: S + 'shot-gap-top.png' }); } catch (e) {}

console.log('\nBLEDY:', errors.length ? errors.join('\n') : '(brak)');
await browser.close();
