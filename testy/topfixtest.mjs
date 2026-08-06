import pw from '/opt/node22/lib/node_modules/playwright/index.js';
const { chromium } = pw;
const URL = 'http://127.0.0.1:5205/mebloprojekt-app.html';
const S = './';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const page = await (await browser.newContext({ viewport: { width: 1440, height: 1100 } })).newPage();
const errors = [];
page.on('pageerror', (e) => errors.push('[pageerror] ' + e.message));
page.on('console', (m) => { if (m.type() === 'error' && !/favicon|404/.test(m.text())) errors.push('[console] ' + m.text()); });
await page.goto(URL, { waitUntil: 'networkidle' });
await page.evaluate(() => { try { localStorage.clear(); } catch (e) {} });
await page.reload({ waitUntil: 'networkidle' });
await page.waitForTimeout(1500);

const card = (t) => page.locator('section').filter({ has: page.locator('h2', { hasText: new RegExp('^' + t + '$') }) }).first();
const fixRows = () => page.evaluate(() => {
  const out = [];
  document.querySelectorAll('tr').forEach((tr) => {
    const c = [...tr.querySelectorAll('td')].map((d) => d.innerText.trim());
    if (c.length && /Element stały/.test(c.join(' '))) out.push(c.join(' | '));
  });
  return out;
});

// Struktura wnetrza jest rozwinieta domyslnie — ustaw fix "góra"
await card('Struktura wnętrza').getByText('góra', { exact: true }).first().click();
await page.waitForTimeout(600);

console.log('Formatki "Element stały" (1 kolumna, W=600, H=720, wys. fix 60):');
(await fixRows()).forEach((r) => console.log('  ', r));
console.log('  oczekiwane: 600 x 62 (bez luzu od boków i od wieńca)');

// wspornik pionowy nie powinien byc widoczny przy fix "góra"
const supVisible = await card('Struktura wnętrza').getByText('wspornik pionowy').count();
console.log('\n"wspornik pionowy" widoczny przy fix "góra":', supVisible, '(oczekiwane 0)');

// przelacz na "lewa" — wspornik powinien wrocic
await card('Struktura wnętrza').getByText('lewa', { exact: true }).first().click();
await page.waitForTimeout(500);
console.log('"wspornik pionowy" widoczny przy fix "lewa":', await card('Struktura wnętrza').getByText('wspornik pionowy').count(), '(oczekiwane 1)');

// wroc na gore + zrzut widoku zamknietego
await card('Struktura wnętrza').getByText('góra', { exact: true }).first().click();
await page.waitForTimeout(600);
await page.evaluate(() => window.scrollTo(0, 0));
try { await page.locator('svg').first().screenshot({ path: S + 'shot-topfix.png' }); console.log('zrzut: shot-topfix.png'); } catch (e) { console.log('zrzut nieudany', e.message); }

// dwie kolumny — sprawdz ze srodkowa krawedz ma luz
await card('Struktura wnętrza').locator('input[type=number]').first().fill('300');
await page.waitForTimeout(700);
console.log('\nPo dodaniu 2. kolumny (auto), formatki "Element stały":');
(await fixRows()).forEach((r) => console.log('  ', r));

await page.screenshot({ path: S + 'shot-topfix-full.png' });
console.log('\nBLEDY:', errors.length ? errors.join('\n') : '(brak)');
await browser.close();
