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

const clickView = async (v) => { await page.getByText(v, { exact: true }).first().click(); await page.waitForTimeout(600); };
const struct = page.locator('section').filter({ has: page.locator('h2', { hasText: /^Struktura wnętrza$/ }) }).first();
const rails = () => page.evaluate(() => {
  const svg = document.querySelector('svg');
  return [...svg.querySelectorAll('rect')]
    .filter(r => r.getAttribute('fill') === '#8b8b93')
    .map(r => ({ x: Math.round(+r.getAttribute('x')), y: Math.round(+r.getAttribute('y')), w: Math.round(+r.getAttribute('width')), h: Math.round(+r.getAttribute('height')) }));
});

await struct.getByText('Szuflady', { exact: true }).first().click();
await page.waitForTimeout(600);
for (let i = 0; i < 2; i++) { await page.getByText('+ szuflada', { exact: true }).first().click(); await page.waitForTimeout(250); }
await page.waitForTimeout(700);

await clickView('Otw.');
let r = await rails();
console.log('FRONT (otwarty), fronty NAKŁADANE — prowadnice:', r.length, 'szt.');
r.forEach(v => console.log('   x=' + v.x + ' szer=' + v.w + ' wys=' + v.h));
console.log('   szer. == 21 dla wszystkich:', r.every(v => v.w === 21) ? 'ok' : 'BLAD');
try { await page.locator('svg').first().screenshot({ path: S + 'shot-run-open.png' }); } catch (e) {}

// pozycja pionowa: y_svg = H - (rail.y0 + rail.h); front nakladany -> rail.y0 = dr.y + 18
const info = await page.evaluate(() => {
  const svg = document.querySelector('svg');
  const fronts = [...svg.querySelectorAll('rect')].filter(r => r.getAttribute('fill-opacity') === '0.35');
  return fronts.map(f => ({ y: Math.round(+f.getAttribute('y')), h: Math.round(+f.getAttribute('height')) }));
});
console.log('   fronty szuflad (y, h):', JSON.stringify(info));
console.log('   dół frontu (y+h) vs dół szyny (y+h) — różnica powinna wynosić 18:');
info.sort((a, b) => a.y - b.y).forEach((f, i) => {
  const rr = r.filter(v => v.x < 100).sort((a, b) => a.y - b.y)[i];
  if (rr) console.log('     szuflada', i + 1, ': front dół', f.y + f.h, ', szyna dół', rr.y + rr.h, '-> różnica', (f.y + f.h) - (rr.y + rr.h));
});

await clickView('Z boku');
console.log('\nZ BOKU — prowadnice:', (await rails()).map(v => 'gł=' + v.w + ' wys=' + v.h).join(', '));
try { await page.locator('svg').first().screenshot({ path: S + 'shot-run-side.png' }); } catch (e) {}
await clickView('Z góry');
console.log('Z GÓRY — prowadnice:', (await rails()).map(v => 'szer=' + v.w + ' gł=' + v.h).join(', '));
try { await page.locator('svg').first().screenshot({ path: S + 'shot-run-top.png' }); } catch (e) {}

// tryb "w obrysie"
await clickView('Otw.');
const korpus = page.locator('section').filter({ has: page.locator('h2', { hasText: /^Korpus$/ }) }).first();
await korpus.getByText('Wewnątrz', { exact: true }).first().click();
await page.waitForTimeout(800);
const r2 = await rails();
const info2 = await page.evaluate(() => {
  const svg = document.querySelector('svg');
  return [...svg.querySelectorAll('rect')].filter(r => r.getAttribute('fill-opacity') === '0.35')
    .map(f => ({ y: Math.round(+f.getAttribute('y')), h: Math.round(+f.getAttribute('height')) })).sort((a, b) => a.y - b.y);
});
console.log('\nFronty W OBRYSIE — różnica dół frontu vs dół szyny (powinno być -1):');
info2.forEach((f, i) => {
  const rr = r2.filter(v => v.x < 100).sort((a, b) => a.y - b.y)[i];
  if (rr) console.log('   szuflada', i + 1, '->', (f.y + f.h) - (rr.y + rr.h));
});
try { await page.locator('svg').first().screenshot({ path: S + 'shot-run-inset.png' }); } catch (e) {}

console.log('\nBLEDY:', errors.length ? errors.join('\n') : '(brak)');
await browser.close();
