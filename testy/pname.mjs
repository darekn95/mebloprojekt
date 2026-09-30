import pw from './pw.mjs';
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
// nazwa szafki: drugie klikniecie w aktywna szafke na pasku otwiera pole (2026-09-30)
const cabOtworz = () => (async () => { if (!(await page.locator('input[placeholder="Nazwa szafki"]').count())) { await page.locator('header button[title="Kliknij, aby zmienić nazwę szafki"]').first().click(); await page.waitForTimeout(200); } return page.locator('input[placeholder="Nazwa szafki"]').first(); })();
const cabInp = await cabOtworz();
ok('pole nazwy projektu istnieje', await projInp.count() === 1);
ok('pole nazwy szafki po kliknięciu w aktywną szafkę', await cabInp.count() === 1);
ok('nazwa projektu pusta na starcie (placeholder)', (await projInp.inputValue()) === 'Projekt bez nazwy' || (await projInp.inputValue()) === '', JSON.stringify(await projInp.inputValue()));
ok('nazwa szafki domyślna', (await cabInp.inputValue()) === 'Szafka 1');

await projInp.fill('Kuchnia Kowalscy');
await page.waitForTimeout(400);
// pole nazwy projektu zabralo fokus — pole szafki zamknelo sie, otwieramy je znow
await (await cabOtworz()).fill('Dolna pod zlew');
await page.waitForTimeout(1300);
ok('nazwy niezależne', (await projInp.inputValue()) === 'Kuchnia Kowalscy' && (await (await cabOtworz()).inputValue()) === 'Dolna pod zlew');

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
const cabNow = await (await (async () => { if (!(await page.locator('input[placeholder="Nazwa szafki"]').count())) { await page.locator('header button[title="Kliknij, aby zmienić nazwę szafki"]').first().click(); await page.waitForTimeout(200); } return page.locator('input[placeholder="Nazwa szafki"]').first(); })()).inputValue();
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
/* Zmiana nazwy na pasku szafek (uzytkownik 2026-09-30): pierwsze klikniecie
   w nieaktywna szafke tylko ja wybiera, drugie otwiera pole; Enter zapisuje,
   Esc wraca do nazwy sprzed edycji; w gornym pasku pola nazwy szafki nie ma. */
const chip = (n) => page.locator('header button', { hasText: new RegExp('^' + n + '$') }).first();
await chip('Dolna pod zlew').click(); await page.waitForTimeout(300);
ok('pierwsze kliknięcie tylko wybiera szafkę', (await page.locator('input[placeholder="Nazwa szafki"]').count()) === 0);
await chip('Dolna pod zlew').click(); await page.waitForTimeout(300);
const pole = page.locator('input[placeholder="Nazwa szafki"]').first();
ok('drugie kliknięcie otwiera pole z nazwą', (await pole.count()) === 1 && (await pole.inputValue()) === 'Dolna pod zlew');
await pole.fill('Zlewowa'); await pole.press('Enter'); await page.waitForTimeout(300);
ok('Enter zapisuje i zamyka pole', (await page.locator('input[placeholder="Nazwa szafki"]').count()) === 0 && (await chip('Zlewowa').count()) === 1);
await chip('Zlewowa').click(); await page.waitForTimeout(300);
await page.locator('input[placeholder="Nazwa szafki"]').first().fill('Pomyłka');
await page.locator('input[placeholder="Nazwa szafki"]').first().press('Escape'); await page.waitForTimeout(300);
ok('Esc wraca do nazwy sprzed edycji', (await chip('Zlewowa').count()) === 1 && (await chip('Pomyłka').count()) === 0);
await page.screenshot({ path: S + 'shot-pname.png', clip: { x: 0, y: 0, width: 1440, height: 190 } });
console.log('\nBLEDY:', errors.length ? errors.join('\n') : '(brak)');
await browser.close();
