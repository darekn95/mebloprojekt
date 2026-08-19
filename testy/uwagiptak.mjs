/* Odhaczanie uwag: ostrzeżenie da się oznaczyć jako przeczytane tak samo jak
   podpowiedź — schodzi wtedy pod zwijany nagłówek i przestaje się liczyć
   w pasku nad projektem. Błędów się nie odhacza. */
import pw from '/opt/node22/lib/node_modules/playwright/index.js';
const URL = process.env.STD ? 'http://127.0.0.1:5199/standalone-local.html'
  : 'http://127.0.0.1:5205/mebloprojekt-app.html';
const b = await pw.chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const page = await (await b.newContext({ viewport: { width: 1500, height: 1100 } })).newPage();
const errors = []; page.on('pageerror', (e) => errors.push('[pageerror] ' + e.message));
const ok = (l, c, e = '') => console.log((c ? '  OK   ' : '  BLAD ') + l + (e ? ' — ' + e : ''));
const card = (re) => page.locator('section').filter({ has: page.locator('h2', { hasText: re }) }).first();
await page.goto(URL, { waitUntil: 'networkidle' });
await page.evaluate(() => { try { localStorage.clear(); } catch (e) {} });
await page.reload({ waitUntil: 'networkidle' });
await page.waitForTimeout(1800);
/* Narożnik L daje wąskie skrzydło 237 mm, czyli ostrzeżenie o froncie poniżej
   250 mm — mamy na czym sprawdzać odhaczanie. */
await page.locator('select[title="Dodaj szafkę z gotowego szablonu"]').first().selectOption('naroznikL');
await page.waitForTimeout(2200);

const licznik = async () => {
  const b2 = page.locator('header button').filter({ hasText: /ostrzeżeni/ });
  return (await b2.count()) ? (await b2.first().innerText()).trim() : '';
};
const ptaszki = () => card(/^Uwagi$/).locator('button[title*="przeczytane"]');
let n0 = await licznik();
console.log('   licznik u góry: „' + n0 + '"');
ok('ostrzeżenie jest w pasku', /ostrzeżeni/.test(n0), n0);
const ile = await ptaszki().count();
console.log('   ptaszków w Uwagach: ' + ile);
ok('ostrzeżenie da się odhaczyć', ile > 0, String(ile));

await ptaszki().first().click();
await page.waitForTimeout(1000);
const n1 = await licznik();
console.log('   po odhaczeniu: „' + n1 + '"');
ok('licznik nie liczy przeczytanych', n1 !== n0, `${n0} → ${n1}`);
const zwiniete = card(/^Uwagi$/).getByText(/Przeczytane ostrzeżenia \(\d+\)/);
ok('przeczytane schodzą pod nagłówek', await zwiniete.count() === 1, String(await zwiniete.count()));
await zwiniete.first().click();
await page.waitForTimeout(800);
const tekst = await card(/^Uwagi$/).innerText();
ok('po rozwinięciu treść wraca', /poniżej 250 mm/.test(tekst.replace(/\s+/g, ' ')), tekst.slice(0, 160));

/* Odhaczenie trzyma sie przegladarki, nie projektu — po przeladowaniu zostaje. */
await page.reload({ waitUntil: 'networkidle' });
await page.waitForTimeout(2000);
ok('po przeładowaniu dalej odhaczone', (await licznik()) === n1, `${await licznik()} vs ${n1}`);

const odhacz = card(/^Uwagi$/).getByText(/Przeczytane ostrzeżenia \(\d+\)/);
await odhacz.first().click();
await page.waitForTimeout(700);
await card(/^Uwagi$/).locator('button[title*="nieprzeczytane"]').first().click();
await page.waitForTimeout(1000);
ok('odznaczenie przywraca licznik', (await licznik()) === n0, `${await licznik()} vs ${n0}`);

console.log('\nBLEDY:', errors.length ? errors.join('; ') : '(brak)');
await b.close();
