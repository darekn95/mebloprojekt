import pw from '/opt/node22/lib/node_modules/playwright/index.js';
const { chromium } = pw;
const URL = 'http://127.0.0.1:5205/mebloprojekt-app.html';
const S = './';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const page = await (await browser.newContext({ viewport: { width: 1500, height: 1100 } })).newPage();
const errors = [];
page.on('pageerror', (e) => errors.push('[pageerror] ' + e.message));
await page.goto(URL, { waitUntil: 'networkidle' });
await page.evaluate(() => { try { localStorage.clear(); } catch (e) {} });
await page.reload({ waitUntil: 'networkidle' });
await page.waitForTimeout(1500);

const card = (t) => page.locator('section').filter({ has: page.locator('h2', { hasText: new RegExp('^' + t + '$') }) }).first();
async function fillCol(n, val) {
  const row = page.locator('div.flex.items-center.gap-2', { has: page.getByText(`Kolumna ${n}`, { exact: true }) });
  const inp = row.locator('input').first();
  await inp.scrollIntoViewIfNeeded(); await inp.fill(String(val)); await inp.blur();
  await page.waitForTimeout(500);
}

// W = 900, kol 1 = 500 (fix lewa + drzwi), kol 2 = reszta (szuflady)
await page.locator('input[value="600"]').first().fill('900');
await page.waitForTimeout(400);
await fillCol(1, 500);
await page.waitForTimeout(500);

// fix "lewa" w kolumnie 1
const struct = card('Struktura wnętrza');
await struct.getByText('lewa', { exact: true }).first().click();
await page.waitForTimeout(600);
// szerokosc fixu 100
const fixW = struct.locator('input[type=number]').filter({ hasNot: page.locator('x') });
// znajdz pole obok etykiety "szerokość"
const wInp = struct.locator('div.flex.items-center.gap-2', { has: page.getByText('szerokość', { exact: true }) }).locator('input').first();
await wInp.fill('100'); await wInp.blur();
await page.waitForTimeout(700);

// kolumna 2 = szuflady
const kol2 = struct.locator('div.rounded').filter({ has: page.getByText('Kolumna 2', { exact: true }) }).first();
try { await kol2.getByText('Szuflady', { exact: true }).click(); } catch (e) { console.log('brak kol2 szuflady:', e.message.slice(0, 60)); }
await page.waitForTimeout(700);

const notes = await page.evaluate(() => {
  const out = [];
  document.querySelectorAll('li').forEach((li) => { const t = li.innerText.trim(); if (t) out.push(t.replace(/\s+/g, ' ')); });
  return out;
});
console.log('UWAGI:'); notes.forEach((n) => console.log('  -', n));

const clickView = async (v) => { await page.getByText(v, { exact: true }).first().click(); await page.waitForTimeout(600); };
for (const [v, f] of [['Zamk.', 'v-closed'], ['Otw.', 'v-open'], ['Z boku', 'v-side'], ['Z góry', 'v-top'], ['3D', 'v-3d']]) {
  await clickView(v);
  try { await page.locator('svg').first().screenshot({ path: S + 'shot-' + f + '.png' }); } catch (e) { console.log('zrzut', v, 'nieudany'); }
}
console.log('BLEDY:', errors.length ? errors.join('\n') : '(brak)');
await browser.close();
