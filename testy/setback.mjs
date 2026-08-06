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
const railsTop = () => page.evaluate(() => {
  const svg = document.querySelector('svg');
  return [...svg.querySelectorAll('rect')].filter(r => r.getAttribute('fill') === '#8b8b93')
    .map(r => 'y ' + Math.round(+r.getAttribute('y')) + '..' + Math.round(+r.getAttribute('y') + +r.getAttribute('height')));
});
const railsSide = () => page.evaluate(() => {
  const svg = document.querySelector('svg');
  return [...svg.querySelectorAll('rect')].filter(r => r.getAttribute('fill') === '#8b8b93')
    .map(r => 'x ' + Math.round(+r.getAttribute('x')) + '..' + Math.round(+r.getAttribute('x') + +r.getAttribute('width')));
});

await struct.getByText('Szuflady', { exact: true }).first().click();
await page.waitForTimeout(700);
await page.getByText('+ szuflada', { exact: true }).first().click();
await page.waitForTimeout(600);

await clickView('Z góry');
console.log('NAKŁADANE, korpus D=500, NL 450');
console.log('  z góry:', [...new Set(await railsTop())].join(', '), '(oczekiwane 50..500 — lico korpusu)');
await clickView('Z boku');
console.log('  z boku:', [...new Set(await railsSide())].join(', '), '(oczekiwane 50..500)');

await struct.locator('div.flex.items-center.gap-2', { has: page.getByText('fronty', { exact: true }) })
  .getByText('Wewnątrz', { exact: true }).click();
await page.waitForTimeout(900);
await clickView('Z góry');
console.log('\nWEWNĄTRZ (front 18 mm)');
console.log('  z góry:', [...new Set(await railsTop())].join(', '), '(oczekiwane 32..482 — cofnięte o grubość frontu)');
try { await page.locator('svg').first().screenshot({ path: S + 'shot-sb-top.png' }); } catch (e) {}
await clickView('Z boku');
console.log('  z boku:', [...new Set(await railsSide())].join(', '), '(oczekiwane 32..482)');
try { await page.locator('svg').first().screenshot({ path: S + 'shot-sb-side.png' }); } catch (e) {}

console.log('\nBLEDY:', errors.length ? errors.join('\n') : '(brak)');
await browser.close();
