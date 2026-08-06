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
const counts = () => page.evaluate(() => {
  const svg = document.querySelector('svg');
  const rs = [...svg.querySelectorAll('rect')];
  return {
    zawiasy: rs.filter(r => r.getAttribute('fill') === '#71717a').length,
    prowadnice: rs.filter(r => r.getAttribute('fill') === '#8b8b93').length,
  };
});

// W = 1000, kolumna 1 = drzwi (400), kolumna 2 = szuflady
await page.locator('input[value="600"]').first().fill('1000');
await page.waitForTimeout(400);
const row = page.locator('div.flex.items-center.gap-2', { has: page.getByText('Kolumna 1', { exact: true }) });
const inp = row.locator('input').first();
await inp.scrollIntoViewIfNeeded(); await inp.fill('400'); await inp.blur();
await page.waitForTimeout(800);

// kolumna 2 -> szuflady
const segs = struct.getByText('Szuflady', { exact: true });
console.log('segmentów "Szuflady":', await segs.count());
await segs.nth(1).scrollIntoViewIfNeeded();
await segs.nth(1).click();
await page.waitForTimeout(800);
for (let i = 0; i < 2; i++) { await page.getByText('+ szuflada', { exact: true }).first().click(); await page.waitForTimeout(250); }
await page.waitForTimeout(700);

await clickView('Otw.');
console.log('\nWIDOK OTWARTY (wszystko widoczne):', JSON.stringify(await counts()));
try { await page.locator('svg').first().screenshot({ path: S + 'shot-sf-open.png' }); } catch (e) {}

await clickView('Z boku');
console.log('WIDOK Z LEWEJ :', JSON.stringify(await counts()), '— oczekiwane: zawiasy > 0 (kol.1 przy lewym boku), prowadnice 0 (za przegrodą)');
try { await page.locator('svg').first().screenshot({ path: S + 'shot-sf-left.png' }); } catch (e) {}

// przelacz na prawy bok
await page.getByText('Pokaż prawy bok', { exact: true }).first().click();
await page.waitForTimeout(800);
console.log('WIDOK Z PRAWEJ:', JSON.stringify(await counts()), '— oczekiwane: zawiasy 0 (za przegrodą), prowadnice > 0 (kol.2 przy prawym boku)');
try { await page.locator('svg').first().screenshot({ path: S + 'shot-sf-right.png' }); } catch (e) {}

console.log('\nBLEDY:', errors.length ? errors.join('\n') : '(brak)');
await browser.close();
