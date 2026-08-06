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
  return [...svg.querySelectorAll('text')].map(t => t.textContent.trim()).filter(t => /^-?\d+$/.test(t) && Math.abs(+t) < 60);
});
const fronts = () => page.evaluate(() => {
  const out = [];
  document.querySelectorAll('tr').forEach((tr) => {
    const c = [...tr.querySelectorAll('td')].map(d => d.innerText.trim().split('\n')[0]);
    if (c.length >= 5 && /Drzwi|Front szuflady/.test(c[0])) out.push(c[0] + ' ' + c[2] + 'x' + c[3] + ' szt.' + c[4]);
  });
  return out;
});

// 900 mm: kol.1 drzwi 500 (nakładane), kol.2 szuflady
await page.locator('input[value="600"]').first().fill('900');
await page.waitForTimeout(400);
const row = page.locator('div.flex.items-center.gap-2', { has: page.getByText('Kolumna 1', { exact: true }) });
const inp = row.locator('input').first();
await inp.scrollIntoViewIfNeeded(); await inp.fill('500'); await inp.blur();
await page.waitForTimeout(800);
await struct.getByText('Szuflady', { exact: true }).nth(1).click();
await page.waitForTimeout(700);
await page.getByText('+ szuflada', { exact: true }).first().click();
await page.waitForTimeout(500);

await clickView('Zamk.');
await page.getByText('Pokaż szczeliny', { exact: true }).first().click();
await page.waitForTimeout(700);
console.log('A) obie kolumny NAKŁADANE');
console.log('   szczeliny:', (await gapVals()).join(', '));
console.log('   formatki:', (await fronts()).join(' | '));

await struct.locator('div.flex.items-center.gap-2', { has: page.getByText('fronty', { exact: true }) })
  .getByText('Wewnątrz', { exact: true }).click();
await page.waitForTimeout(900);
console.log('\nB) drzwi NAKŁADANE + szuflady WEWNĄTRZ');
console.log('   szczeliny:', (await gapVals()).join(', '), '— wszystkie powinny być 2');
console.log('   formatki:', (await fronts()).join(' | '), '— drzwi szersze niż w A o 8 mm (zakrywają całą przegrodę)');
try { await page.locator('svg').first().screenshot({ path: S + 'shot-mix.png' }); } catch (e) {}
const notes = await page.evaluate(() => [...document.querySelectorAll('li')].map(l => l.innerText.replace(/\s+/g, ' ').trim()).filter(Boolean));
console.log('   uwagi:', notes.length ? notes.join(' // ') : '(brak)');

console.log('\nBLEDY:', errors.length ? errors.join('\n') : '(brak)');
await browser.close();
