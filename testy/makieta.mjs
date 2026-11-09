// Tryb makiety w aplikacji (krok 1, uzytkownik 2026-11-09): przelacznik trybu, rysunek ciagu
// i szafek wolnostojacych z prawdziwych danych, wybor pomieszczenia / ciagu / widoku z listy,
// klik w szafke = aktywna szafka, karta do odczytu; tryb techniczny bez zmian.
import pw from './pw.mjs';
const { chromium } = pw;
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const page = await (await browser.newContext({ viewport: { width: 1500, height: 950 } })).newPage();
const errors = [];
page.on('pageerror', (e) => errors.push('[pageerror] ' + e.message));
page.on('console', (m) => { if (m.type() === 'error' && !/favicon|404/.test(m.text())) errors.push('[console] ' + m.text()); });
let bledy = 0;
const ok = (l, c, e = '') => { if (!c) bledy++; console.log((c ? '  OK   ' : '  BLAD ') + l + (e ? ' — ' + e : '')); };
await page.goto('http://127.0.0.1:5205/mebloprojekt-app.html', { waitUntil: 'networkidle' });
await page.evaluate(() => { try { localStorage.clear(); } catch (e) {} });
await page.reload({ waitUntil: 'networkidle' });
await page.waitForTimeout(1500);

await page.waitForFunction(() => !!localStorage.getItem('szafki:projekt'), null, { timeout: 10000 });
console.log('== projekt: ciąg z 3 szafkami + szafka wolnostojąca ==');
await page.evaluate(() => {
  const p = JSON.parse(localStorage.getItem('szafki:projekt'));
  const wzor = p.items[0];
  const kopia = (o) => JSON.parse(JSON.stringify(o));
  const w = (n, W) => { const it = kopia(wzor); it.cab.name = n; it.cab.W = W; return it; };
  p.runs = [{ id: 'r1', name: 'Ściana A', roomId: 'p1' }];
  p.items = [{ ...w('Lewa', 600), runId: 'r1' }, { ...w('Środek', 800), runId: 'r1' }, { ...w('Prawa', 400), runId: 'r1' }, { ...w('Komoda', 900), runId: null, roomId: 'p1' }];
  p.active = 0;
  localStorage.setItem('szafki:projekt', JSON.stringify(p));
});
await page.reload({ waitUntil: 'networkidle' });
await page.waitForTimeout(1500);

const widoczny = (sel) => page.locator(sel).first().isVisible().catch(() => false);
ok('domyślnie tryb techniczny', (await page.locator('[data-el="tryb"] [aria-pressed="true"]').getAttribute('data-tryb')) === 'techniczny');
ok('w technicznym makiety nie ma', !(await page.locator('[data-el="makieta"]').count()));
ok('w technicznym jest karta „Rysunek”', await widoczny('#rysunek'));

console.log('== makieta prosta ==');
await page.locator('[data-el="tryb"] [data-tryb="prosta"]').click();
await page.waitForTimeout(500);
ok('makieta widoczna', await widoczny('[data-el="makieta"]'));
ok('tryb techniczny ukryty', !(await widoczny('#rysunek')));
ok('paski pomieszczeń i ciągów schowane', !(await widoczny('[data-pasek="pomieszczenia"]')) && !(await widoczny('[data-pasek="ciagi"]')));
ok('karta bez roboczych kluczy', !/#\d/.test(await page.locator('[data-el="makieta-karta"]').innerText()));
await page.locator('[data-el="mak-szafka"] button').first().click();
const lista = await page.locator('[data-el="mak-szafka"] [role="option"]').count();
ok('lista „Szafka”: 4 szafki pomieszczenia', lista === 4, String(lista));
await page.locator('[data-el="mak-szafka"] [data-v="2"]').click();
await page.waitForTimeout(300);
ok('wybór z listy zaznacza „Prawa”', /Prawa/.test(await page.locator('[data-el="makieta-karta"] h3').textContent()));
await page.locator('[data-el="mak-szafka"] button').first().click();
await page.locator('[data-el="mak-szafka"] [data-v="0"]').click();
await page.waitForTimeout(300);
const PRZOD = '[data-el="makieta"] svg:not([data-el="mak-zgory"] svg) [data-el="makieta-szafka"]';
const szafki0 = await page.locator(PRZOD).evaluateAll((els) => els.map((e) => e.dataset.idx));
ok('domyślnie ciąg zaznaczonej szafki (3 szafki)', szafki0.length === 3, szafki0.join(','));
await page.locator('[data-el="mak-ciag"] button').first().click();
await page.locator('[data-el="mak-ciag"] [data-v="wszystkie"]').click();
await page.waitForTimeout(400);
const szafki = await page.locator(PRZOD).evaluateAll((els) => els.map((e) => e.dataset.idx));
ok('„Wszystkie ciągi”: 3 szafki ciągu i wolnostojąca', szafki.length === 4, szafki.join(','));
const zakl = await page.locator('[data-el="makieta"] nav [data-zakl]').evaluateAll((els) => els.map((e) => e.dataset.zakl));
ok('zakładki prostej (bez wzmocnień)', zakl.join(',') === 'agd,szafka,szuflady,polki,drzwi,przegroda,cokol', zakl.join(','));
ok('karta aktywnej szafki', /Lewa/.test(await page.locator('[data-el="makieta-karta"] h3').textContent()));

await page.locator('[data-el="makieta-szafka"][data-idx="1"]').first().click({ force: true });
await page.waitForTimeout(400);
ok('klik zaznacza szafkę „Środek”', /Środek/.test(await page.locator('[data-el="makieta-karta"] h3').textContent()));
ok('obrys zaznaczonej na rysunku (z przodu i z góry)', (await page.locator('[data-el="makieta-szafka"][data-idx="1"] [data-el="makieta-zaznaczona"]').count()) === 2);
await page.waitForFunction(() => JSON.parse(localStorage.getItem('szafki:projekt')).active === 1, null, { timeout: 5000 }).catch(() => {});
const akt = await page.evaluate(() => JSON.parse(localStorage.getItem('szafki:projekt')).active);
ok('aktywna szafka projektu = 1', akt === 1, String(akt));
await page.locator('[data-el="makieta-szafka"][data-idx="3"]').first().click({ force: true });
await page.waitForTimeout(400);
ok('klik w wolnostojącą', /Komoda/.test(await page.locator('[data-el="makieta-karta"] h3').textContent()));

console.log('== listy: ciąg, widok ==');
await page.locator('[data-el="mak-ciag"] button').first().click();
await page.locator('[data-el="mak-ciag"] [data-v="r1"]').click();
await page.waitForTimeout(400);
ok('tylko ciąg: bez wolnostojących', !(await page.locator('[data-el="makieta-wolnostojace"]').count()));
ok('z góry nad widokiem z przodu: szafki klikalne', (await page.locator('[data-el="mak-zgory"] [data-el="makieta-szafka"]').count()) === 3);
await page.locator('[data-el="mak-zgory"] [data-el="makieta-szafka"][data-idx="2"]').first().click({ force: true });
await page.waitForTimeout(300);
ok('klik z góry zaznacza „Prawa”', /Prawa/.test(await page.locator('[data-el="makieta-karta"] h3').textContent()));

console.log('== szczegółowa i powrót ==');
await page.locator('[data-el="tryb"] [data-tryb="szczegolowa"]').click();
await page.waitForTimeout(300);
const zakl2 = await page.locator('[data-el="makieta"] nav [data-zakl]').evaluateAll((els) => els.map((e) => e.dataset.zakl));
ok('szczegółowa ma wzmocnienia i wycięcia', zakl2.includes('wzmocnienia') && zakl2.includes('wyciecia'), zakl2.join(','));
await page.reload({ waitUntil: 'networkidle' });
await page.waitForTimeout(1200);
ok('tryb pamiętany po przeładowaniu', (await page.locator('[data-el="tryb"] [aria-pressed="true"]').getAttribute('data-tryb')) === 'szczegolowa');
await page.locator('[data-el="tryb"] [data-tryb="techniczny"]').click();
await page.waitForTimeout(400);
ok('techniczny wraca', await widoczny('#rysunek') && !(await page.locator('[data-el="makieta"]').count()));
const p2 = await page.evaluate(() => JSON.parse(localStorage.getItem('szafki:projekt')));
ok('projekt nietknięty (4 szafki, wymiary)', p2.items.length === 4 && p2.items.map((it) => it.cab.W).join(',') === '600,800,400,900');

console.log('bledy strony:', errors.length ? errors.join(' | ') : 'brak');
if (errors.length) bledy++;
console.log(bledy ? `${bledy} BLAD` : 'WSZYSTKO OK');
await browser.close();
process.exit(bledy ? 1 : 0);
