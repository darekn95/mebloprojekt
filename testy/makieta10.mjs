// Makieta szczegolowa — karty szczegolowe (krok 4 planu, 2026-11-10): naglowek karty z ikona i opisem (szerokosci kolumn,
// fronty, polki, wzmocnienia), „Korpus i plecy” (plecy, frez, fronty, gora), „Wzmocnienia” wybranej kolumny (MAK_WZM,
// mocowanie konfirmaty / wkrety), „Wycięcia i kolizje” (wyciecie tylnego naroznika z lewej / z prawej, wymiary).
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
await page.waitForFunction(() => !!localStorage.getItem('szafki:projekt'), null, { timeout: 10000 });
await page.evaluate(() => {
  const p = JSON.parse(localStorage.getItem('szafki:projekt'));
  const it = p.items[0];
  it.cab.name = 'Szafa'; it.cab.W = 1000; it.cab.H = 2000; it.cab.D = 600;
  const kol = JSON.parse(JSON.stringify(it.cab.levels[0].cols[0]));
  it.cab.levels = [{ h: null, cols: [kol, JSON.parse(JSON.stringify(kol))] }];
  p.active = 0;
  localStorage.setItem('szafki:projekt', JSON.stringify(p));
  localStorage.setItem('mp-tryb', 'szczegolowa');
  localStorage.setItem('mp-mak-zoom', JSON.stringify({ pow: false, z: 1 }));
});
await page.reload({ waitUntil: 'networkidle' });
await page.waitForTimeout(1200);
const proj = () => page.evaluate(() => JSON.parse(localStorage.getItem('szafki:projekt')));
const czekaj = async (f) => { await page.waitForFunction((src) => { const p = JSON.parse(localStorage.getItem('szafki:projekt')); try { return new Function('p', 'return ' + src)(p); } catch (e) { return false; } }, f, { timeout: 5000 }).catch(() => {}); return proj(); };
const zakl = async (k) => { const b = page.locator(`[data-el="makieta"] nav [data-zakl="${k}"]`);
  if ((await b.getAttribute('aria-pressed')) !== 'true' || !(await page.locator('[data-el="mak-karta-panel"]').count())) await b.click(); await page.waitForTimeout(300); };
const cab = (p) => p.items[0].cab;

console.log('== nagłówek karty ==');
await zakl('szafka');
ok('ikona szafki w nagłówku', (await page.locator('[data-el="mak-ikona-szafki"] svg').count()) === 1);
const opis = await page.locator('[data-el="mak-opis-szafki"]').innerText().catch(() => '');
ok('opis: szerokości kolumn i fronty', /kol\. \d+ \/ \d+/.test(opis) && /drzwi|półk/.test(opis), opis);

console.log('== Korpus i plecy ==');
await zakl('korpus');
await page.locator('[data-el="mak-plecy"][data-v="board"]').click();
let p = await czekaj('p.items[0].cab.back === "board"');
ok('plecy: płyta', cab(p).back === 'board');
ok('przy płycie bez wyboru frezu', (await page.locator('[data-el="mak-plecy-frez"]').count()) === 0);
await page.locator('[data-el="mak-plecy"][data-v="hdf"]').click();
await czekaj('p.items[0].cab.back === "hdf"');
await page.locator('[data-el="mak-plecy-frez"][data-v="groove"]').click();
p = await czekaj('p.items[0].cab.backGroove && p.items[0].cab.backGroove.on === true');
ok('HDF we frezie', cab(p).back === 'hdf' && cab(p).backGroove.on === true);
await page.locator('[data-el="mak-fronty"][data-v="inset"]').click();
p = await czekaj('p.items[0].cab.frontMode === "inset"');
ok('fronty wewnątrz', cab(p).frontMode === 'inset');
await page.locator('[data-el="mak-fronty"][data-v="overlay"]').click();
await czekaj('p.items[0].cab.frontMode === "overlay"');
const maGore = (await page.locator('[data-el="mak-gora"]').count()) > 0;
if (maGore) {
  await page.locator('[data-el="mak-gora"][data-v="blat"]').click();
  p = await czekaj('p.items[0].cab.top && p.items[0].cab.top.mode === "blat"');
  ok('góra: blat z płyty', cab(p).top.mode === 'blat');
  await page.locator('[data-el="mak-gora"][data-v="wieniec"]').click();
  await czekaj('p.items[0].cab.top.mode === "wieniec"');
} else ok('góra: wieniec / blat z płyty (szafka ma górę)', false, 'brak przycisków');

console.log('== Wzmocnienia ==');
await zakl('wzmocnienia');
ok('wybór kolumny (2 kolumny)', (await page.locator('[data-el="mak-kol-wybor"]').count()) === 1);
await page.locator('[data-el="mak-kol"][data-v="0-1"]').click(); await page.waitForTimeout(300);
await page.locator('[data-el="mak-wzm"][data-v="lezace"]').click();
p = await czekaj('(p.items[0].cab.levels[0].cols[1].rails || []).length === 1');
let r = cab(p).levels[0].cols[1].rails || [];
ok('kolumna 2: wzmocnienie leżące u góry', r.length === 1 && r[0].orient === 'shelf' && r[0].pos === 'top' && (cab(p).levels[0].cols[0].rails || []).length === 0, JSON.stringify(r));
await page.locator('[data-el="mak-wzm"][data-v="dolT"]').click();
p = await czekaj('(p.items[0].cab.levels[0].cols[1].rails || []).length === 2');
r = cab(p).levels[0].cols[1].rails;
ok('+ na dole z tyłu', r.some((x) => x.orient === 'front' && x.pos === 'bottom' && x.fromBack));
await page.locator('[data-el="mak-wzm-moc"][data-v="wkrety"]').click();
p = await czekaj('p.items[0].cab.levels[0].cols[1].rails.every((x) => x.mocowanie === "wkrety")');
ok('mocowanie: wkręty 4 × 30 dla całej kolumny', cab(p).levels[0].cols[1].rails.every((x) => x.mocowanie === 'wkrety'));
// trojkaty meblowe (decyzja uzytkownika 2026-11-10: „wszędzie opcja na trójkąty”)
await page.locator('[data-el="mak-wzm-moc"][data-v="trojkaty"]').click();
p = await czekaj('p.items[0].cab.levels[0].cols[1].rails.every((x) => x.mocowanie === "trojkaty")');
ok('mocowanie: trójkąty meblowe dla całej kolumny', cab(p).levels[0].cols[1].rails.every((x) => x.mocowanie === 'trojkaty')
  && (await page.locator('[data-el="mak-wzm-moc"][data-v="trojkaty"]').getAttribute('aria-pressed')) === 'true');
await page.locator('[data-el="mak-wzm"][data-v="lezace"]').click();
p = await czekaj('p.items[0].cab.levels[0].cols[1].rails.length === 1');
ok('ponowny klik zdejmuje leżące', cab(p).levels[0].cols[1].rails.length === 1 && cab(p).levels[0].cols[1].rails[0].pos === 'bottom');
const opis2 = await page.locator('[data-el="mak-opis-szafki"]').innerText().catch(() => '');
ok('opis w nagłówku liczy wzmocnienia', /1 wzm\./.test(opis2), opis2);

console.log('== Wycięcia i kolizje ==');
await zakl('wyciecia');
await page.locator('[data-el="mak-wyciecie"][data-v="cutoutR-1"]').click();
p = await czekaj('p.items[0].cab.cutoutR && p.items[0].cab.cutoutR.on === true');
ok('wycięcie tylnego narożnika z prawej', cab(p).cutoutR.on === true && !cab(p).cutout.on);
const pole = page.locator('[data-pole="cutoutR-w"]');
await pole.fill('150'); await pole.press('Enter');
p = await czekaj('p.items[0].cab.cutoutR.w === 150');
ok('szerokość wycięcia 150', cab(p).cutoutR.w === 150);
await page.locator('[data-el="mak-wyciecie"][data-v="cutoutR-0"]').click();
p = await czekaj('p.items[0].cab.cutoutR.on === false');
ok('wycięcie zdjęte', cab(p).cutoutR.on === false);

console.log('bledy strony:', errors.length ? errors.join(' | ') : 'brak');
if (errors.length) bledy++;
console.log(bledy ? `${bledy} BLAD` : 'WSZYSTKO OK');
await browser.close();
process.exit(bledy ? 1 : 0);
