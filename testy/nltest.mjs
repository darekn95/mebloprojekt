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
const korpus = page.locator('section').filter({ has: page.locator('h2', { hasText: /^Korpus$/ }) }).first();
const notes = () => page.evaluate(() => [...document.querySelectorAll('li')].map(l => l.innerText.replace(/\s+/g, ' ').trim()).filter(Boolean));
const badges = () => page.evaluate(() => [...document.querySelectorAll('header button, body > div button')]
  .map(b => b.textContent.trim()).filter(t => /^\d+ (błąd|błęd|ostrzeż|podpow)/.test(t)));

// --- 1. odmiana w plakietkach ---
async function setDepth(v) {
  const vals = await korpus.locator('input[type=number]').evaluateAll(els => els.map(e => e.value));
  console.log('pola Korpus:', JSON.stringify(vals));
  const inp = korpus.locator('input[type=number]').nth(2);
  await inp.fill(String(v)); await inp.blur(); await page.waitForTimeout(900);
  console.log('po zmianie:', JSON.stringify(await korpus.locator('input[type=number]').evaluateAll(els => els.map(e => e.value))));
}
await struct.getByText('Szuflady', { exact: true }).first().click();
await page.waitForTimeout(700);
await page.getByText('+ szuflada', { exact: true }).first().click();
await page.waitForTimeout(600);
// NL zadana recznie na 400, korpus plytki
const nlSel = struct.locator('div.flex.items-center.gap-2', { has: page.getByText('głębokość NL', { exact: true }) }).locator('select').first();
console.log('select NL:', await nlSel.count());
await nlSel.selectOption('400'); await page.waitForTimeout(700);
// fronty szuflad wewnatrz korpusu -> potrzeba dodatkowych 18 mm na glebokosc
await struct.locator('div.flex.items-center.gap-2', { has: page.getByText('fronty', { exact: true }) })
  .getByText('Wewnątrz', { exact: true }).click();
await page.waitForTimeout(700);
await setDepth(410);

console.log('UWAGI:');
(await notes()).forEach(n => console.log('  -', n));
console.log('\nPLAKIETKI:', JSON.stringify(await badges()));

const btn = page.getByRole('button', { name: /Zmień głębokość prowadnic do NL/ });
console.log('przycisk skrócenia szuflady:', await btn.count());
if (await btn.count()) {
  console.log('   etykieta:', (await btn.first().textContent()).trim());
  await btn.first().click(); await page.waitForTimeout(800);
  console.log('   po kliknięciu — uwagi:');
  (await notes()).forEach(n => console.log('     -', n));
  console.log('   plakietki:', JSON.stringify(await badges()));
}
console.log('\nBLEDY:', errors.length ? errors.join('\n') : '(brak)');
await browser.close();
