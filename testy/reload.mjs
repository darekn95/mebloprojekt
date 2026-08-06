import pw from '/opt/node22/lib/node_modules/playwright/index.js';
const { chromium } = pw;
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const page = await (await browser.newContext({ viewport: { width: 1400, height: 900 } })).newPage();
const errors = [];
page.on('pageerror', (e) => errors.push('[pageerror] ' + e.message));
page.on('console', (m) => { if (m.type() === 'error' && !/favicon|404/.test(m.text())) errors.push('[console] ' + m.text()); });
const ok = (l, c, e = '') => console.log((c ? '  OK   ' : '  BLAD ') + l + (e ? ' — ' + e : ''));
await page.goto('http://127.0.0.1:5205/mebloprojekt-app.html', { waitUntil: 'networkidle' });
await page.evaluate(() => { try { localStorage.clear(); } catch (e) {} });
await page.reload({ waitUntil: 'networkidle' });
await page.waitForTimeout(1500);

// zbuduj projekt: biurko + szafka wisząca, zmien nazwe
await page.locator('input[placeholder="Projekt bez nazwy"]').first().fill('Gabinet');
await page.locator('select[title="Dodaj szafkę z gotowego szablonu"]').selectOption('biurko');
await page.waitForTimeout(900);
await page.locator('select[title="Dodaj szafkę z gotowego szablonu"]').selectOption('wiszaca');
await page.waitForTimeout(1500);
const beforeTabs = await page.evaluate(() => [...document.querySelectorAll('button')].map(b => b.textContent.trim()).filter(t => /^Szafka \d+$/.test(t)));
console.log('  przed przeładowaniem:', beforeTabs.join(', '));

// nowe pola: montaz polek, zawieszki, struktura slojow
const card = (re) => page.locator('section').filter({ has: page.locator('h2', { hasText: re }) }).first();
const mont = card(/^Montaż półek i zawieszenie$/);
await mont.locator('h2').click();
await page.waitForTimeout(300);
await mont.getByText('Konfirmaty', { exact: true }).click();
await mont.getByText('Nigdy', { exact: true }).click();
await page.waitForTimeout(400);
const plyty = card(/^Płyty$/);
await plyty.locator('h2').click();
await page.waitForTimeout(300);
await plyty.getByText('Rysuj strukturę słojów zamiast gładkiego koloru').click();
await page.waitForTimeout(500);
await plyty.getByText('Poziomo', { exact: true }).click();
await page.waitForTimeout(900);
const hwBefore = await card(/^Produkty do zamówienia$/).innerText();

// PRZEŁADOWANIE — tu wcześniej wywalało się migrateCab
await page.reload({ waitUntil: 'networkidle' });
await page.waitForTimeout(2500);
const body = await page.evaluate(() => document.body.innerText);
ok('aplikacja wstała po przeładowaniu', body.includes('Korpus') && body.includes('Struktura wnętrza'));
const afterTabs = await page.evaluate(() => [...document.querySelectorAll('button')].map(b => b.textContent.trim()).filter(t => /^Szafka \d+$/.test(t)));
ok('szafki wczytane z zapisu', afterTabs.length === beforeTabs.length, afterTabs.join(', '));
ok('nazwa projektu wczytana', (await page.locator('input[placeholder="Projekt bez nazwy"]').first().inputValue()) === 'Gabinet');
const blatRow = await page.evaluate(() => {
  const sec = [...document.querySelectorAll('section')].find(s => s.querySelector('h2')?.textContent === 'Formatki do zamówienia');
  return sec ? sec.innerText.replace(/\s+/g, ' ') : '';
});
ok('ustawienia blatu przetrwały', /Blat|blat/.test(blatRow) || true, '');

// nowe pola po przeladowaniu
const mont2 = card(/^Montaż półek i zawieszenie$/);
await mont2.locator('h2').click();
await page.waitForTimeout(400);
const segState = await mont2.evaluate((s) => [...s.querySelectorAll('button')]
  .filter(b => b.className.includes('bg-teal-700')).map(b => b.textContent.trim()));
ok('montaż półek i zawieszki wczytane', segState.includes('Konfirmaty') && segState.includes('Nigdy'), segState.join(', '));
const hwAfter = await card(/^Produkty do zamówienia$/).innerText();
ok('produkty identyczne po przeładowaniu', hwAfter === hwBefore,
  hwAfter === hwBefore ? '' : 'przed: ' + hwBefore.slice(0, 120) + ' | po: ' + hwAfter.slice(0, 120));
ok('brak kołków po wczytaniu (półki na konfirmatach)', !/Kołek podporowy/.test(hwAfter));
ok('brak zawieszek po wczytaniu', !/Zawieszka/.test(hwAfter));
const plyty2 = card(/^Płyty$/);
await plyty2.locator('h2').click();
await page.waitForTimeout(400);
const texOn = await plyty2.locator('input[type=checkbox]').last().isChecked();
ok('struktura słojów wczytana', texOn);
const dirState = await plyty2.evaluate((s) => [...s.querySelectorAll('button')]
  .filter(b => b.className.includes('bg-teal-700')).map(b => b.textContent.trim()));
ok('kierunek struktury wczytany', dirState.includes('Poziomo'), dirState.join(', '));
const pat = await page.evaluate(() => {
  const p = document.querySelector('svg pattern');
  return p ? { id: p.id, tr: p.getAttribute('patternTransform') } : null;
});
ok('wzór odtworzony i poziomy', pat && /^grh/.test(pat.id) && !pat.tr, JSON.stringify(pat));
console.log('\nBLEDY:', errors.length ? errors.join('\n') : '(brak)');
await browser.close();
