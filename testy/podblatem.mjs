/* Szafka pod blatem roboczym (bez wienca, para wzmocnien) przy zmianach
   struktury (analiza brakow kontroli 2026-10-04):
   - „+ poziom” przenosi pare wzmocnien do nowego, najwyzszego poziomu (zostawala
     w srodku szafki),
   - „+ przegroda i kolumna” daje nowej kolumnie pare (nie miala nad soba niczego),
   - kolumna bez wienca i bez wzmocnienia → ostrzezenie „od góry otwarty”
     z przyciskiem, ktory dodaje pare,
   - recznie usunieta para nie wraca sama (tylko zmiana struktury ja dokłada). */
import pw from './pw.mjs';
const URL = process.env.STD ? 'http://127.0.0.1:5199/standalone-local.html'
  : 'http://127.0.0.1:5205/mebloprojekt-app.html';
const ok = (l, c, e = '') => console.log((c ? '  OK   ' : '  BLAD ') + l + (e ? ' — ' + e : ''));
const b = await pw.chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const page = await (await b.newContext({ viewport: { width: 1500, height: 1300 } })).newPage();
const errors = []; page.on('pageerror', (e) => errors.push(e.message));
await page.goto(URL, { waitUntil: 'networkidle' });
await page.evaluate(() => localStorage.clear()); await page.reload({ waitUntil: 'networkidle' }); await page.waitForTimeout(1000);
const stan = async () => { await page.waitForTimeout(1600); return page.evaluate(() => JSON.parse(localStorage.getItem('szafki:projekt'))); };
const para = (c) => (c.rails || []).filter((r) => r.pos === 'top' && ((r.orient === 'shelf' && !r.fromBack) || (r.orient === 'front' && r.fromBack))).length;
const uwagi = () => page.evaluate(() => [...document.querySelectorAll('section')].find((s) => /^Uwagi/.test(s.querySelector('h2')?.textContent || ''))?.innerText || '');

await page.getByRole('button', { name: '+ ciąg', exact: true }).first().click(); await page.waitForTimeout(500);
await page.locator('header .space-y-1 > div').filter({ hasText: /^Ściana 1/ }).first().getByRole('button', { name: '+ szafka', exact: true }).click();
let st = await stan();
let cab = st.items.find((it) => it.runId).cab;
ok('szafka w ciągu z blatem: bez wieńca, para wzmocnień w kolumnie', cab.joints.topL === 'none' && para(cab.levels[0].cols[0]) === 2,
  JSON.stringify({ joints: cab.joints, para: para(cab.levels[0].cols[0]) }));

console.log('\n== + poziom ==');
await page.getByRole('button', { name: '+ poziom', exact: true }).first().click();
st = await stan(); cab = st.items.find((it) => it.runId).cab;
ok('para przeszła do nowego, najwyższego poziomu', cab.levels.length === 2 && para(cab.levels[0].cols[0]) === 0 && para(cab.levels[1].cols[0]) === 2,
  cab.levels.map((lv) => lv.cols.map(para).join('/')).join(' | '));

console.log('\n== + przegroda i kolumna (w najwyższym poziomie) ==');
/* przycisk najwyzszego poziomu: klikamy po kolei, az przybedzie kolumna na gorze
   (kolejnosc poziomow na karcie nie jest tu istotna) */
{
  const btn = page.getByRole('button', { name: '+ przegroda i kolumna', exact: true });
  for (let k = 0; k < await btn.count(); k++) {
    await btn.nth(k).click(); st = await stan(); cab = st.items.find((x) => x.runId).cab;
    if (cab.levels[cab.levels.length - 1].cols.length === 2) break;
    await page.keyboard.press('Control+z'); await page.waitForTimeout(500);
  }
}
st = await stan(); cab = st.items.find((it) => it.runId).cab;
const gora = cab.levels[cab.levels.length - 1];
ok('nowa kolumna ma parę', gora.cols.length === 2 && gora.cols.every((c) => para(c) === 2), gora.cols.map(para).join('/'));
ok('bez ostrzeżenia „od góry otwarty”', !/od góry otwarty/.test(await uwagi()));

console.log('\n== kolumna bez niczego nad sobą ==');
const goly = JSON.parse(JSON.stringify(st));
const it = goly.items.find((x) => x.runId);
it.cab.levels[it.cab.levels.length - 1].cols[1].rails = [];
goly.active = goly.items.indexOf(it);
await page.evaluate((q) => { localStorage.setItem('szafki:projekt', JSON.stringify(q)); }, goly);
await page.reload({ waitUntil: 'networkidle' }); await page.waitForTimeout(1000);
let u = await uwagi();
ok('ostrzeżenie „korpus jest od góry otwarty” z przyciskiem', /od góry otwarty/.test(u) && (await page.getByRole('button', { name: 'Dodaj parę wzmocnień pod blat' }).count()) === 1,
  (u.match(/[^\n]*od góry otwarty[^\n]*/) || ['(brak)'])[0].slice(0, 140));
// zmiana inna niz struktura (np. wysokosc) nie przywraca recznie usunietej pary
st = await stan(); cab = st.items.find((x) => x.runId).cab;
ok('ręcznie usunięta para nie wraca sama', para(cab.levels[cab.levels.length - 1].cols[1]) === 0);
await page.getByRole('button', { name: 'Dodaj parę wzmocnień pod blat' }).first().click();
st = await stan(); cab = st.items.find((x) => x.runId).cab;
u = await uwagi();
ok('przycisk dodaje parę i gasi ostrzeżenie', para(cab.levels[cab.levels.length - 1].cols[1]) === 2 && !/od góry otwarty/.test(u));

console.log('\nBLEDY:', errors.length ? errors.join('; ') : '(brak)');
await b.close();
