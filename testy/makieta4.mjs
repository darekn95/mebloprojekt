// Tryb makiety, krok 4 (uzytkownik 2026-11-09): karty prostej z przyciskami jak w makiecie „Dodaj” —
// fronty kolumny (drzwi / klapa / bez frontu), uchwyt albo tip-on, liczba szuflad, polek, drazek,
// kolumny poziomu, cokol i nozki (caly ciag albo sama szafka wolnostojaca), blat ciagu jest / nie ma.
// Zapis do tych samych pol co tryb techniczny.
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
  const wzor = p.items[0];
  const kopia = (o) => JSON.parse(JSON.stringify(o));
  const w = (n, W) => { const it = kopia(wzor); it.cab.name = n; it.cab.W = W; return it; };
  p.runs = [{ id: 'r1', name: 'Ściana A', roomId: 'p1', worktop: true }];
  p.items = [{ ...w('Lewa', 600), runId: 'r1' }, { ...w('Środek', 800), runId: 'r1' }, { ...w('Prawa', 400), runId: 'r1' }, { ...w('Komoda', 900), runId: null, roomId: 'p1' }];
  p.active = 0;
  localStorage.setItem('szafki:projekt', JSON.stringify(p));
  localStorage.setItem('mp-tryb', 'prosta');
});
await page.reload({ waitUntil: 'networkidle' });
await page.waitForTimeout(1200);

const projekt = () => page.evaluate(() => JSON.parse(localStorage.getItem('szafki:projekt')));
// zapis projektu jest opozniony — czekamy, az warunek spelni sie w localStorage
const czekaj = async (opis, fn, arg) => {
  const okk = await page.waitForFunction(([f, a]) => { const p = JSON.parse(localStorage.getItem('szafki:projekt')); return (new Function('p', 'a', /\breturn\b/.test(f) ? f : 'return ' + f))(p, a); },
    [fn, arg], { timeout: 5000 }).then(() => true).catch(() => false);
  ok(opis, okk);
  return okk;
};
// klik w otwarta zakladke chowa karte — klikamy tylko inna albo przy schowanej karcie
const zakladka = async (z) => { const b = page.locator(`[data-el="makieta"] nav [data-zakl="${z}"]`);
  if ((await b.getAttribute('aria-pressed')) !== 'true' || !(await page.locator('[data-el="mak-karta-panel"]').count())) await b.click(); await page.waitForTimeout(250); };
const wybierz = async (i) => {
  await page.locator('[data-el="mak-szafka"] button').first().click();
  await page.locator(`[data-el="mak-szafka"] [data-v="${i}"]`).click();
  await page.waitForTimeout(300);
};
/* karta przerysowana w trakcie przewijania (pelny przebieg 2026-11-13, 5 suit naraz: „Element is not attached to the DOM”, wolno
   przechodzi) — jeszcze raz na swiezym elemencie */
const klik = async (sel) => {
  for (let n = 0; ; n++) {
    const l = page.locator(`[data-el="makieta-karta"] ${sel}`).first();
    try { await l.scrollIntoViewIfNeeded({ timeout: 5000 }); await l.click({ timeout: 5000 }); break; }
    catch (e) { if (n >= 2) throw e; await page.waitForTimeout(300); }
  }
  await page.waitForTimeout(250);
};

ok('tryb prosty po przeładowaniu', (await page.locator('[data-el="tryb"] [aria-pressed="true"]').getAttribute('data-tryb')) === 'prosta');

console.log('== Drzwi: fronty i tip-on ==');
await wybierz(0);
await zakladka('drzwi');
await klik('[data-el="mak-front"][data-v="drzwi-1"]');
await czekaj('1 drzwi', 'p.items[0].cab.levels[0].cols[0].doors === 1 && !p.items[0].cab.levels[0].cols[0].klapa');
await klik('[data-el="mak-otw"][data-v="tipon"]');
await czekaj('tip-on: bez uchwytu, otwieranie tipon', 'const k = p.items[0].cab.levels[0].cols[0]; return k.handles[0] === false && k.otwieranie[0] === "tipon"');
await klik('[data-el="mak-front"][data-v="drzwi-2"]');
await czekaj('2 drzwi — tip-on na obu', 'const k = p.items[0].cab.levels[0].cols[0]; return k.doors === 2 && k.handles.length === 2 && k.handles.every((h) => h === false) && k.otwieranie.every((o) => o === "tipon")');
ok('przycisk tip-on wciśnięty', (await page.locator('[data-el="makieta-karta"] [data-el="mak-otw"][data-v="tipon"]').getAttribute('aria-pressed')) === 'true');
await klik('[data-el="mak-otw"][data-v="uchwyt"]');
await czekaj('uchwyt wraca', 'const k = p.items[0].cab.levels[0].cols[0]; return k.handles.every((h) => h === true) && !k.otwieranie');
await klik('[data-el="mak-front"][data-v="klapa-gora"]');
await czekaj('klapa do góry (1 front)', 'const k = p.items[0].cab.levels[0].cols[0]; return k.doors === 1 && k.klapa === "gora"');
await klik('[data-el="mak-front"][data-v="klapa-dol"]');
await czekaj('klapa w dół', 'p.items[0].cab.levels[0].cols[0].klapa === "dol"');
await klik('[data-el="mak-front"][data-v="otwarta"]');
await czekaj('bez frontu: drzwi 0, bez klapy', 'const k = p.items[0].cab.levels[0].cols[0]; return k.doors === 0 && !k.klapa');
ok('bez frontu — brak wyboru uchwyt / tip-on', !(await page.locator('[data-el="makieta-karta"] [data-el="mak-otw"]').count()));

console.log('== Szuflady ==');
await zakladka('szuflady');
await klik('[data-el="mak-szuflady"][data-v="2"]');
await czekaj('2 szuflady', 'const k = p.items[0].cab.levels[0].cols[0]; return k.kind === "drawers" && k.drawers.length === 2');
await klik('[data-el="mak-szuflady"][data-v="4"]');
await czekaj('4 szuflady, fronty auto', 'const k = p.items[0].cab.levels[0].cols[0]; return k.drawers.length === 4 && k.drawers.every((d) => d.front == null)');
const szRys = await page.locator('[data-el="makieta"] [data-el="makieta-szafka"][data-idx="0"]').first().evaluate((g) => g.outerHTML.length);
ok('rysunek szafki po zmianie', szRys > 0);
await zakladka('drzwi');
await klik('[data-el="mak-front"][data-v="drzwi-1"]');
await czekaj('szuflady → 1 drzwi: bez szuflad', 'const k = p.items[0].cab.levels[0].cols[0]; return k.kind === "doors" && k.doors === 1 && !(k.drawers || []).length');

console.log('== Półki i drążek ==');
await wybierz(1);
await zakladka('polki');
const n0 = Number(await page.locator('[data-el="makieta-karta"] [data-el="mak-polki-n"]').first().textContent());
await klik('[data-el="mak-polki"][data-v="1"]');
await czekaj(`półki ${n0} → ${n0 + 1}`, 'p.items[1].cab.levels[0].cols[0].shelfTargets.length === a + 2', n0);
ok('licznik półek', Number(await page.locator('[data-el="makieta-karta"] [data-el="mak-polki-n"]').first().textContent()) === n0 + 1);
// drazek — klocek nad karta Polek (2026-11-10: bez przycisku „drążek” przy kazdym swietle); klik — wybrana kolumna
await page.locator('[data-el="mak-klocki-karty"] [data-el="mak-klocek"][data-id="drazek"]').click(); await page.locator('[data-el="mak-wybrany-teraz"]').click(); await page.waitForTimeout(250);
await czekaj('drążek w najwyższym świetle', 'JSON.stringify(p.items[1].cab.levels[0].cols[0].drazki) === JSON.stringify([a + 1])', n0);
await klik('[data-el="mak-polki"][data-v="-1"]');
await czekaj('mniej półek — drążek zostaje na górze', 'const k = p.items[1].cab.levels[0].cols[0]; return k.shelfTargets.length === a + 1 && JSON.stringify(k.drazki) === JSON.stringify([a])', n0);
await klik('[data-el="mak-drazek-usun"]');
await czekaj('drążek zdjęty', '!(p.items[1].cab.levels[0].cols[0].drazki || []).length');

console.log('== Przegroda: kolumny ==');
await zakladka('przegroda');
await klik('[data-el="mak-kolumny"][data-v="3"]');
await czekaj('3 kolumny, szerokości auto', 'const L = p.items[1].cab.levels[0].cols; return L.length === 3 && L.every((k) => k.w == null)');
const przeg = await page.locator('[data-el="makieta"] [data-el="makieta-uchwyty"] [data-u="przeg"]').count();
ok('na rysunku uchwyty przegród (2)', przeg >= 2, String(przeg));
await klik('[data-el="mak-kolumny"][data-v="1"]');
await czekaj('1 kolumna', 'p.items[1].cab.levels[0].cols.length === 1');

console.log('== Cokół i nóżki: cały ciąg ==');
await zakladka('cokol');
ok('napis „dla całego ciągu”', /całego ciągu/.test(await page.locator('[data-el="makieta-karta"]').innerText()));
await klik('[data-el="mak-cokol"][data-v="inbody"]');
await czekaj('cokół w obrysie w 3 szafkach ciągu', 'p.items.slice(0, 3).every((it) => it.cab.plinth.on && it.cab.plinth.mode === "inbody")');
await czekaj('cokół ciągu (run.plinth) też w obrysie', 'p.runs[0].plinth && p.runs[0].plinth.on && p.runs[0].plinth.mode === "inbody"');
const komoda0 = (await projekt()).items[3].cab.plinth;
ok('wolnostojąca bez zmian', komoda0.mode !== 'inbody' || false, JSON.stringify(komoda0));
const ch = page.locator('[data-el="makieta-karta"] [data-pole="cokol-h"]');
await ch.fill('120'); await ch.press('Enter'); await page.waitForTimeout(300);
await czekaj('wysokość cokołu 120 w całym ciągu', 'p.items.slice(0, 3).every((it) => it.cab.plinth.height === 120) && p.runs[0].plinth.height === 120');
ok('karta: cokół zgodny z ciągiem (bez uwagi „nie zgadza się z ciągiem”)', !/nie zgadza się z ciągiem/.test(await page.locator('body').innerText()));
await klik('[data-el="mak-nozki"][data-v="tak"]');
await czekaj('nóżki w całym ciągu', 'p.items.slice(0, 3).every((it) => it.cab.legs && it.cab.legs.on)');
const nh = page.locator('[data-el="makieta-karta"] [data-pole="nozki-h"]');
await nh.fill('110'); await nh.press('Enter'); await page.waitForTimeout(300);
await czekaj('wysokość nóżek 110 w ciągu', 'p.items.slice(0, 3).every((it) => it.cab.legs.height === 110)');
await klik('[data-el="mak-cokol"][data-v="under"]');
await czekaj('cokół pod korpusem', 'p.items.slice(0, 3).every((it) => it.cab.plinth.on && it.cab.plinth.mode === "under")');
await klik('[data-el="mak-cokol"][data-v="brak"]');
await czekaj('cokół zdjęty w ciągu', 'p.items.slice(0, 3).every((it) => !it.cab.plinth.on)');

console.log('== wolnostojąca: tylko ta szafka ==');
await wybierz(3);
await zakladka('cokol');
ok('bez napisu „dla całego ciągu”', !/całego ciągu/.test(await page.locator('[data-el="makieta-karta"]').innerText()));
await klik('[data-el="mak-nozki"][data-v="tak"]');
await czekaj('nóżki tylko w wolnostojącej', 'p.items[3].cab.legs.on && p.items[3].cab.legs.height !== 110');

console.log('== Szafka: blat ciągu ==');
await wybierz(0);
await zakladka('szafka');
ok('blat „jest” wciśnięty', (await page.locator('[data-el="makieta-karta"] [data-el="mak-blat"][data-v="tak"]').getAttribute('aria-pressed')) === 'true');
await klik('[data-el="mak-blat"][data-v="nie"]');
await czekaj('blat ciągu: nie ma', 'p.runs[0].worktop === false');
await klik('[data-el="mak-blat"][data-v="tak"]');
await czekaj('blat ciągu: jest', 'p.runs[0].worktop === true');
await wybierz(3);
await zakladka('szafka');
ok('wolnostojąca — bez wyboru blatu ciągu', !(await page.locator('[data-el="makieta-karta"] [data-el="mak-blat"]').count()));

const p2 = await projekt();
ok('projekt: 4 szafki, wymiary bez zmian', p2.items.length === 4 && p2.items.map((it) => it.cab.W).join(',') === '600,800,400,900');

console.log('bledy strony:', errors.length ? errors.join(' | ') : 'brak');
if (errors.length) bledy++;
console.log(bledy ? `${bledy} BLAD` : 'WSZYSTKO OK');
await browser.close();
process.exit(bledy ? 1 : 0);
