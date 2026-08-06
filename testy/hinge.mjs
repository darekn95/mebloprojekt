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

const notes = () => page.evaluate(() => [...document.querySelectorAll('li')].map(l => l.innerText.replace(/\s+/g, ' ').trim()).filter(Boolean));
const clickView = async (v) => { await page.getByText(v, { exact: true }).first().click(); await page.waitForTimeout(600); };
const struct = page.locator('section').filter({ has: page.locator('h2', { hasText: /^Struktura wnętrza$/ }) }).first();

// --- A: wysoka szafka bez półek, 2 zawiasy ---
const setNum = async (label, val) => {
  const inp = page.locator('div', { hasText: new RegExp('^' + label + '$') }).first();
  return inp;
};
await page.locator('input[value="720"]').first().fill('2000');
await page.waitForTimeout(500);
// półki -> 0
const shelvesInp = struct.locator('div.flex.items-center.gap-2', { has: page.getByText('półki', { exact: true }) }).locator('input').first();
await shelvesInp.fill('0'); await shelvesInp.blur();
await page.waitForTimeout(700);

await clickView('Otw.');
const hingeYs = () => page.evaluate(() => {
  const out = [];
  document.querySelectorAll('svg rect').forEach((r) => {
    if (r.getAttribute('fill') === '#71717a' && r.getAttribute('width') === '20') out.push(Math.round(+r.getAttribute('y')));
  });
  return out.sort((a, b) => a - b);
});
const hingeLabels = () => page.evaluate(() => [...document.querySelectorAll('svg text')].map(t => t.textContent.trim()));
console.log('A) H=2000, brak półek — prostokąty zawiasów (y w SVG):', JSON.stringify(await hingeYs()));
console.log('   etykiety odległości:', (await hingeLabels()).filter(t => /^\d+$/.test(t)).join(', '));
console.log('   uwagi:', (await notes()).join(' // ') || '(brak)');
try { await page.locator('svg').first().screenshot({ path: S + 'shot-hinge-a.png' }); } catch (e) {}

// --- B: półki wracają, sprawdzamy kolizję ---
await shelvesInp.fill('3'); await shelvesInp.blur();
await page.waitForTimeout(800);
await clickView('Otw.');
console.log('\nB) H=2000, 3 półki — uwagi:');
(await notes()).forEach(n => console.log('   -', n));
console.log('   etykiety odległości:', (await hingeLabels()).filter(t => /^\d+$/.test(t)).join(', '));
try { await page.locator('svg').first().screenshot({ path: S + 'shot-hinge-b.png' }); } catch (e) {}

await clickView('Z boku');
try { await page.locator('svg').first().screenshot({ path: S + 'shot-hinge-side.png' }); } catch (e) {}

console.log('\nBLEDY:', errors.length ? errors.join('\n') : '(brak)');
await browser.close();
