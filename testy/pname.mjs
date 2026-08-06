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
const ok = (l, c, e = '') => console.log((c ? '  OK   ' : '  BLAD ') + l + (e ? ' — ' + e : ''));

const projInp = page.locator('input[placeholder="Projekt bez nazwy"]').first();
const cabInp = page.locator('input[placeholder="Nazwa szafki"]').first();
ok('pole nazwy projektu istnieje', await projInp.count() === 1);
ok('pole nazwy szafki nadal istnieje', await cabInp.count() === 1);
ok('nazwa projektu pusta na starcie (placeholder)', (await projInp.inputValue()) === 'Projekt bez nazwy' || (await projInp.inputValue()) === '', JSON.stringify(await projInp.inputValue()));
ok('nazwa szafki domyślna', (await cabInp.inputValue()) === 'Szafka 1');

await projInp.fill('Kuchnia Kowalscy');
await page.waitForTimeout(400);
await cabInp.fill('Dolna pod zlew');
await page.waitForTimeout(1300);
ok('nazwy niezależne', (await projInp.inputValue()) === 'Kuchnia Kowalscy' && (await cabInp.inputValue()) === 'Dolna pod zlew');

const ls = await page.evaluate(() => { try { return JSON.parse(localStorage.getItem('szafki:projekt')); } catch { return null; } });
ok('nazwa projektu w zapisie', ls && ls.name === 'Kuchnia Kowalscy', ls ? JSON.stringify(ls.name) : 'brak');

await page.reload({ waitUntil: 'networkidle' });
await page.waitForTimeout(1800);
ok('przetrwała przeładowanie', (await page.locator('input[placeholder="Projekt bez nazwy"]').first().inputValue()) === 'Kuchnia Kowalscy');

// druga szafka -> karta projektu z nazwa
const addBtn = page.getByText('+ szafka', { exact: true });
console.log('  (+ szafka widoczne:', await addBtn.count(), ')');
await addBtn.first().click();
await page.waitForTimeout(900);
const body = await page.evaluate(() => document.body.innerText);
ok('karta zbiorcza z nazwą projektu', body.includes('Formatki całego projektu — Kuchnia Kowalscy'));
ok('nazwa projektu wspólna dla obu szafek', (await page.locator('input[placeholder="Projekt bez nazwy"]').first().inputValue()) === 'Kuchnia Kowalscy');
const cabNow = await page.locator('input[placeholder="Nazwa szafki"]').first().inputValue();
ok('nazwa szafki przełączyła się na nową', cabNow !== 'Dolna pod zlew' && /^Szafka \d+$/.test(cabNow), cabNow);

// eksport do pliku
const [dl2] = await Promise.all([
  page.waitForEvent('download', { timeout: 8000 }).catch(() => null),
  page.getByRole('button', { name: 'Zapisz do pliku', exact: true }).click(),
]);
let jtxt = '';
if (dl2) { const pth = S + 'dl2.json'; await dl2.saveAs(pth); jtxt = (await import('fs')).readFileSync(pth, 'utf8'); }
ok('eksport zawiera nazwę projektu', jtxt.includes('"name": "Kuchnia Kowalscy"'), dl2 ? dl2.suggestedFilename() : 'brak pliku');

await page.keyboard.press('Escape');
await page.waitForTimeout(400);
await page.screenshot({ path: S + 'shot-pname.png', clip: { x: 0, y: 0, width: 1440, height: 190 } });
console.log('\nBLEDY:', errors.length ? errors.join('\n') : '(brak)');
await browser.close();
