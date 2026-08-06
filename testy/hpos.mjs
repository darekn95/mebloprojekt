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

const dump = () => page.evaluate(() => {
  const svg = document.querySelector('svg');
  const out = { hinges: [], boards: [] };
  [...svg.querySelectorAll('rect')].forEach((r) => {
    const f = r.getAttribute('fill');
    const x = +r.getAttribute('x'), w = +r.getAttribute('width'), h = +r.getAttribute('height');
    if (f === '#71717a') out.hinges.push({ x0: Math.round(x), x1: Math.round(x + w) });
    else if (w > 0 && w < 40 && h > 300) out.boards.push({ x0: Math.round(x), x1: Math.round(x + w), fill: f });
  });
  return out;
});

await clickView('Otw.');
console.log('=== BEZ FIXU (W=600, t=18: bok lewy 0..18, bok prawy 582..600) ===');
let d = await dump();
console.log('zawiasy [x0..x1]:', d.hinges.map(h => h.x0 + '..' + h.x1).join(', '));
console.log('pionowe płyty  :', d.boards.map(b => b.x0 + '..' + b.x1).join(', '));

await struct.getByText('lewa', { exact: true }).first().click();
await page.waitForTimeout(600);
const supLabel = struct.getByText('wspornik pionowy');
if (await supLabel.count()) { await supLabel.first().click(); await page.waitForTimeout(700); }
await clickView('Otw.');
console.log('\n=== FIX "lewa" 60 mm + wspornik pionowy ===');
d = await dump();
console.log('zawiasy [x0..x1]:', d.hinges.map(h => h.x0 + '..' + h.x1).join(', '));
console.log('pionowe płyty  :', d.boards.map(b => b.x0 + '..' + b.x1 + ' ' + b.fill).join(', '));
console.log('   fix zajmuje 0..60, wspornik 42..60, światło zaczyna się na 60');
try { await page.locator('svg').first().screenshot({ path: S + 'shot-hpos.png' }); } catch (e) {}
console.log('BLEDY:', errors.length ? errors.join('\n') : '(brak)');
await browser.close();
