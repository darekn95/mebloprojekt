/* Okucia skrzydla pod jego szerokoscia (prosba uzytkownika 2026-09-28):
   zawiasy, uchwyt (ile wystaje — domyslnie z szafki, 20 mm — i czy na boku,
   czy u gory), lustro, w tej kolejnosci. Wysuniecie i polozenie uchwytu
   ida do rysunku z przodu, bryly 3D i kontroli otwierania. */
import pw from './pw.mjs';
const URL = process.env.STD ? 'http://127.0.0.1:5199/standalone-local.html'
  : 'http://127.0.0.1:5205/mebloprojekt-app.html';
const ok = (l, c, e = '') => console.log((c ? '  OK   ' : '  BLAD ') + l + (e ? ' — ' + e : ''));
const b = await pw.chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const page = await (await b.newContext({ viewport: { width: 1500, height: 1300 } })).newPage();
const errors = []; page.on('pageerror', (e) => errors.push(e.message));
await page.goto(URL, { waitUntil: 'networkidle' });

const PL = { on: true, height: 100, mode: 'under', setback: 0 };
await page.evaluate((q) => { localStorage.clear(); localStorage.setItem('szafki:projekt', JSON.stringify(q)); }, {
  name: 'U', active: 0, prices: {}, runs: [], items: [{ cab: { name: 'U', W: 600, H: 720, D: 560, plinth: PL, legs: { on: true, height: 100 },
    levels: [{ h: null, cols: [{ kind: 'doors', doors: 2, w: null }] }] }, offset: 0 }] });
await page.reload({ waitUntil: 'networkidle' }); await page.waitForTimeout(800);
const zapis = () => page.evaluate(() => JSON.parse(localStorage.getItem('szafki:projekt')));
const col = async () => (await zapis()).items[0].cab.levels[0].cols[0];
const click = async (l) => { const x = page.getByRole('button', { name: l, exact: true }); if (await x.count()) { await x.first().click(); await page.waitForTimeout(300); } };

console.log('== wiersz okuć pod szerokością drzwi ==');
const wiersz = page.locator('[data-el="drzwi-okucia"]');
ok('pod każdym skrzydłem wiersz okuć (2 drzwi → 2)', await wiersz.count() === 2);
const txt = await wiersz.first().innerText();
ok('kolejność: zawiasy, uchwyt, lustro', /zawiasy[\s\S]*uchwyt[\s\S]*lustro/.test(txt), txt.replace(/\s+/g, ' '));
const mm = wiersz.first().locator('[data-el="drzwi-uchwyt"] input[type=number]');
ok('uchwyt: pole „mm” z domyślnym 20 z szafki', await mm.count() === 1 && await mm.getAttribute('placeholder') === '20');

console.log('\n== wysunięcie i położenie uchwytu ==');
await mm.fill('35'); await page.waitForTimeout(1300);
let c = await col();
ok('wpisane 35 mm zapisane przy skrzydle 1', (c.handleOuts || [])[0] === 35, JSON.stringify(c.handleOuts));
await wiersz.first().getByRole('button', { name: 'górze', exact: true }).click(); await page.waitForTimeout(1300);
c = await col();
ok('„na górze” zapisane przy skrzydle 1', (c.handlePos || [])[0] === 'gora', JSON.stringify(c.handlePos));
await click('Zamk.');
ok('rysunek z przodu: skrzydło 1 z uchwytem u góry, 2 na boku',
  await page.locator('#rysunek [data-el="uchwyt-gora"]').count() === 1 && await page.locator('#rysunek [data-el="uchwyt-bok"]').count() === 1);
await page.evaluate(() => { window.__audytBryl = []; });
await click('3D');
const uch = await page.evaluate(() => (window.__audytBryl || []).filter((q) => q.color === '#3f3f46' && Math.min(...q.d) < 40)
  .map((q) => q.d.map(Math.round).join('×')));
ok('bryła 3D: jeden uchwyt poziomy 35 mm, drugi pionowy 20 mm',
  uch.some((d) => /×12×35$/.test(d)) && uch.some((d) => /^12×\d+×20$/.test(d)), uch.join(' | '));

console.log('\n== bez uchwytu: pole i położenie znikają ==');
await wiersz.nth(1).getByText('uchwyt', { exact: true }).click(); await page.waitForTimeout(1300);
ok('odznaczony uchwyt chowa pole mm', await wiersz.nth(1).locator('[data-el="drzwi-uchwyt"] input[type=number]').count() === 0);
c = await col();
ok('skrzydło 2 bez uchwytu', (c.handles || [])[1] === false, JSON.stringify(c.handles));

console.log('\nBLEDY:', errors.length ? errors.join('; ') : '(brak)');
await b.close();
