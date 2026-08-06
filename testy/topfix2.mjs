import pw from '/opt/node22/lib/node_modules/playwright/index.js';
const { chromium } = pw;
const URL = 'http://127.0.0.1:5205/mebloprojekt-app.html';
const S = './';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const page = await (await browser.newContext({ viewport: { width: 1440, height: 1100 } })).newPage();
const errors = [];
page.on('pageerror', (e) => errors.push('[pageerror] ' + e.message));
await page.goto(URL, { waitUntil: 'networkidle' });
await page.evaluate(() => { try { localStorage.clear(); } catch (e) {} });
await page.reload({ waitUntil: 'networkidle' });
await page.waitForTimeout(1500);

async function fillCol(n, val) {
  const row = page.locator('div.flex.items-center.gap-2', { has: page.getByText(`Kolumna ${n}`, { exact: true }) });
  const inp = row.locator('input').first();
  await inp.scrollIntoViewIfNeeded(); await inp.fill(String(val)); await inp.blur();
  await page.waitForTimeout(500);
}
// W = 900, dwie kolumny po 430
await page.locator('input[value="600"]').first().fill('900');
await page.waitForTimeout(400);
await fillCol(1, 430);
await page.waitForTimeout(400);

// fix "gora" tylko w kolumnie 1
const segs = page.getByText('góra', { exact: true });
console.log('Segmentow "góra":', await segs.count());
await segs.first().scrollIntoViewIfNeeded();
await segs.first().click();
await page.waitForTimeout(700);

const rows = await page.evaluate(() => {
  const out = [];
  document.querySelectorAll('tr').forEach((tr) => {
    const c = [...tr.querySelectorAll('td')].map((d) => d.innerText.trim().split('\n')[0]);
    if (c.length && /Element stały/.test(c.join(' '))) out.push(c.slice(0, 5).join(' | '));
  });
  return out;
});
console.log('Formatki "Element stały" (kol.1 z fix góra, W=900):');
rows.forEach((r) => console.log('  ', r));
console.log('  oczekiwane: wys. 62 (do wieńca), szer. ~436 = od 0 do prawej krawędzi frontu kol.1');

await page.evaluate(() => window.scrollTo(0, 0));
await page.waitForTimeout(300);
try { await page.locator('svg').first().screenshot({ path: S + 'shot-topfix2.png' }); } catch (e) {}
console.log('BLEDY:', errors.length ? errors.join('\n') : '(brak)');
await browser.close();
