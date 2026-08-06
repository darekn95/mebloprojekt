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
const szyna = () => page.evaluate(() => {
  const svg = document.querySelector('svg');
  return [...svg.querySelectorAll('text')].map(t => t.textContent.trim()).filter(t => /^szyna /.test(t));
});
const frontParts = () => page.evaluate(() => {
  const out = [];
  document.querySelectorAll('tr').forEach((tr) => {
    const c = [...tr.querySelectorAll('td')].map(d => d.innerText.trim().split('\n')[0]);
    if (c.length >= 5 && /Front szuflady/.test(c[0])) out.push(c[2] + 'x' + c[3] + ' szt.' + c[4]);
  });
  return out;
});

await struct.getByText('Szuflady', { exact: true }).first().click();
await page.waitForTimeout(700);
for (let i = 0; i < 2; i++) { await page.getByText('+ szuflada', { exact: true }).first().click(); await page.waitForTimeout(250); }
await page.waitForTimeout(700);
await clickView('Otw.');

console.log('A) fronty "jak szafka" (na korpusie), reguła 16 mm');
console.log('   wysokości montażu:', (await szyna()).join(', '), '— najniższa powinna być 0');
console.log('   formatki frontów:', (await frontParts()).join(' | '));
try { await page.locator('svg').first().screenshot({ path: S + 'shot-dm-a.png' }); } catch (e) {}

const seg = struct.locator('div.flex.items-center.gap-2', { has: page.getByText('fronty', { exact: true }) });
console.log('\nB) kontrolka "fronty" w kolumnie szuflad:', await seg.count());
console.log('   opcje:', await seg.locator('button').allInnerTexts().then(a => a.join(' / ')));

await seg.getByText('Wewnątrz', { exact: true }).click();
await page.waitForTimeout(800);
console.log('\nC) fronty szuflad WEWNĄTRZ (korpus dalej "na korpusie")');
console.log('   wysokości montażu:', (await szyna()).join(', '));
console.log('   formatki frontów:', (await frontParts()).join(' | '), '— powinny być węższe niż w A');
try { await page.locator('svg').first().screenshot({ path: S + 'shot-dm-c.png' }); } catch (e) {}

await seg.getByText('Na korpusie', { exact: true }).click();
await page.waitForTimeout(800);
console.log('\nD) powrót na "Na korpusie":', (await frontParts()).join(' | '));

console.log('\nBLEDY:', errors.length ? errors.join('\n') : '(brak)');
await browser.close();
