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

const card = (t) => page.locator('section').filter({ has: page.locator('h2', { hasText: new RegExp('^' + t + '$') }) }).first();
const svgTxt = () => page.evaluate(() => [...document.querySelectorAll('svg text')].map(t => t.textContent.trim()).join(' | '));

// --- 1. fix "gora" = 60 ma dawac formatke 60 ---
await card('Struktura wnętrza').getByText('góra', { exact: true }).first().click();
await page.waitForTimeout(700);
const fixRows = await page.evaluate(() => {
  const out = [];
  document.querySelectorAll('tr').forEach((tr) => {
    const c = [...tr.querySelectorAll('td')].map((d) => d.innerText.trim().split('\n')[0]);
    if (c.length && /Element stały/.test(c.join(' '))) out.push(c.slice(0, 5).join(' | '));
  });
  return out;
});
console.log('Fix "góra" ustawiony na 60 → formatka:');
fixRows.forEach(r => console.log('  ', r));
console.log('  oczekiwane: 60 x 600');
await page.evaluate(() => window.scrollTo(0, 0));
try { await page.locator('svg').first().screenshot({ path: S + 'shot-fix60.png' }); } catch (e) {}

// wroc do braku fixu
await card('Struktura wnętrza').getByText('brak', { exact: true }).first().click();
await page.waitForTimeout(500);

// --- 2. szuflady: swiatlo tylko w widoku otwartym ---
await card('Struktura wnętrza').getByText('Szuflady', { exact: true }).first().click();
await page.waitForTimeout(700);
// dodaj kilka szuflad jesli trzeba
const addDr = page.getByText('+ szuflada', { exact: true });
if (await addDr.count()) { for (let i = 0; i < 3; i++) { await addDr.first().click(); await page.waitForTimeout(250); } }
await page.waitForTimeout(600);

const clickView = async (v) => { await page.getByText(v, { exact: true }).first().click(); await page.waitForTimeout(500); };
await clickView('Zamk.');
let t = await svgTxt();
console.log('\nWidok ZAMKNIĘTY — "szer." w rysunku:', /szer\./.test(t) ? 'BLAD (jest)' : 'ok (brak)');
console.log('  Widok ZAMKNIĘTY — stare "światło":', /światło/.test(t) ? 'BLAD (jest)' : 'ok (brak)');
try { await page.locator('svg').first().screenshot({ path: S + 'shot-drw-closed.png' }); } catch (e) {}

await clickView('Otw.');
t = await svgTxt();
const szer = (t.match(/\d+ szer\./g) || []);
const odDna = (t.match(/\d+ od dna/g) || []);
console.log('\nWidok OTWARTY — wymiary "szer.":', szer.length ? szer.join(', ') : 'BRAK');
console.log('  Widok OTWARTY — wymiary "od dna":', odDna.length ? odDna.join(', ') : 'BRAK');
console.log('  liczba szer. == liczba od dna:', szer.length === odDna.length ? 'ok' : 'ROZNE');
try { await page.locator('svg').first().screenshot({ path: S + 'shot-drw-open.png' }); } catch (e) {}

console.log('\nBLEDY:', errors.length ? errors.join('\n') : '(brak)');
await browser.close();
