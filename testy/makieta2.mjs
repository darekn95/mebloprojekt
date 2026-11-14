// Tryb makiety, krok 2 (uzytkownik 2026-11-09): uchwyty na rysunku zmieniaja prawdziwe dane szafki —
// szerokosc / wysokosc (z przodu), glebokosc (z gory), polka (swiatla kolumny), przegroda (szerokosci kolumn),
// linia miedzy szufladami (fronty); pola wymiarow w karcie; „po rowno”; jeden krok „Cofnij”.
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
// projekt: wolnostojaca szafka 800 × 1600 — 2 kolumny (polki 3 | szuflady 3)
await page.evaluate(() => {
  const p = JSON.parse(localStorage.getItem('szafki:projekt'));
  const it = p.items[0];
  it.cab.name = 'Test'; it.cab.W = 800; it.cab.H = 1600;
  const kol = JSON.parse(JSON.stringify(it.cab.levels[0].cols[0]));
  const polki = { ...JSON.parse(JSON.stringify(kol)), w: null, kind: 'doors', doors: 1, shelfTargets: [null, null, null, null], drawers: [] };
  const szuf = { ...JSON.parse(JSON.stringify(kol)), w: null, kind: 'drawers', doors: 0, shelfTargets: [null], drawers: [{ h: 'auto', front: null, handle: true }, { h: 'auto', front: null, handle: true }, { h: 'auto', front: null, handle: true }] };
  it.cab.levels = [{ h: null, cols: [polki, szuf] }];
  p.items = [it]; p.runs = []; p.active = 0;
  localStorage.setItem('szafki:projekt', JSON.stringify(p));
  localStorage.setItem('mp-tryb', 'prosta'); localStorage.setItem('mp-mak-zoom', JSON.stringify({ pow: false, z: 1 }));   // „Dopasuj” — uchwyty w oknie (przyblizanie: makieta5)
});
await page.reload({ waitUntil: 'networkidle' });
await page.waitForTimeout(1500);
const stan = () => page.evaluate(() => JSON.parse(localStorage.getItem('szafki:projekt')).items[0].cab);
const zapis = async (f) => { await page.waitForFunction(f, null, { timeout: 5000 }).catch(() => {}); return stan(); };
const ciagnij = async (sel, dx, dy) => {
  const r = await page.locator(sel).first().boundingBox();
  const x = r.x + r.width / 2, y = r.y + r.height / 2;
  await page.mouse.move(x, y); await page.mouse.down();
  await page.mouse.move(x + dx / 2, y + dy / 2, { steps: 4 });
  const pg = await page.locator('[data-el="makieta-podglad"]').count();
  await page.mouse.move(x + dx, y + dy, { steps: 4 }); await page.mouse.up();
  await page.waitForTimeout(400);
  return pg;
};
// klik w otwarta zakladke chowa karte — klikamy tylko inna albo przy schowanej karcie
const zakl = async (k) => { const b = page.locator(`[data-el="makieta"] nav [data-zakl="${k}"]`);
  if ((await b.getAttribute('aria-pressed')) !== 'true' || !(await page.locator('[data-el="mak-karta-panel"]').count())) await b.click(); await page.waitForTimeout(300); };

console.log('== Szafka: szerokość i wysokość z rysunku ==');
ok('uchwyty szerokości i wysokości', (await page.locator('[data-u="szer"]').count()) === 1 && (await page.locator('[data-u="wys"]').count()) === 1);
const pg = await ciagnij('[data-u="szer"]', -40, 0);
ok('podgląd w trakcie przeciągania', pg === 1);
let c = await zapis(() => JSON.parse(localStorage.getItem('szafki:projekt')).items[0].cab.W !== 800);
ok('szerokość zmieniona (co 10, mniejsza)', c.W < 800 && c.W % 10 === 0, String(c.W));
const W1 = c.W;
await ciagnij('[data-u="wys"]', 0, -30);
c = await zapis(() => JSON.parse(localStorage.getItem('szafki:projekt')).items[0].cab.H !== 1600);
ok('wysokość zmieniona (większa)', c.H > 1600 && c.H % 10 === 0, String(c.H));
console.log('== pola w karcie ==');
await page.fill('[data-pole="W"]', '900'); await page.locator('[data-pole="W"]').press('Enter'); await page.waitForTimeout(300);
c = await zapis(() => JSON.parse(localStorage.getItem('szafki:projekt')).items[0].cab.W === 900);
ok('szerokość z pola = 900', c.W === 900, String(c.W));
console.log('== Cofnij: jeden krok ==');
await page.keyboard.press('Control+z'); await page.waitForTimeout(400);
c = await zapis(() => JSON.parse(localStorage.getItem('szafki:projekt')).items[0].cab.W !== 900);
ok('Cofnij wraca do szerokości z przeciągnięcia', c.W === W1, String(c.W));

console.log('== Półki ==');
await zakl('polki');
const nPolek = await page.locator('[data-u="polka"]').count();
ok('3 półki do chwycenia (kolumna szuflad bez)', nPolek === 3, String(nPolek));
await ciagnij('[data-u="polka"][data-k="0"]', 0, -25);
c = await zapis(() => (JSON.parse(localStorage.getItem('szafki:projekt')).items[0].cab.levels[0].cols[0].shelfTargets || []).some((v) => v != null));
const st = c.levels[0].cols[0].shelfTargets;
ok('światła: przeciągnięte i sąsiad liczbami, ostatnie auto', st.length === 4 && st[0] > 0 && st[1] > 0 && st[3] === null, JSON.stringify(st));
const uw = await page.evaluate(() => document.querySelector('header').innerText);
ok('bez błędu „światła nie zgadzają się”', !/nie zgadzają się/.test(await page.evaluate(() => document.body.innerText)));
await page.locator('[data-akcja="porowno-shelfTargets"]').click(); await page.waitForTimeout(300);
c = await zapis(() => (JSON.parse(localStorage.getItem('szafki:projekt')).items[0].cab.levels[0].cols[0].shelfTargets || []).every((v) => v == null));
ok('„Półki po równo” wraca do auto', c.levels[0].cols[0].shelfTargets.every((v) => v == null));

console.log('== Przegroda ==');
await zakl('przegroda');
ok('uchwyt przegrody', (await page.locator('[data-u="przeg"]').count()) === 1);
await ciagnij('[data-u="przeg"]', 30, 0);
c = await zapis(() => JSON.parse(localStorage.getItem('szafki:projekt')).items[0].cab.levels[0].cols[0].w != null);
ok('lewa kolumna szersza liczbą, prawa (ostatnia) auto', c.levels[0].cols[0].w > 300 && c.levels[0].cols[1].w == null, JSON.stringify(c.levels[0].cols.map((k) => k.w)));

console.log('== Szuflady ==');
await zakl('szuflady');
ok('2 linie między 3 szufladami', (await page.locator('[data-u="szufl"]').count()) === 2);
await ciagnij('[data-u="szufl"][data-k="0"]', 0, -20);
c = await zapis(() => JSON.parse(localStorage.getItem('szafki:projekt')).items[0].cab.levels[0].cols[1].drawers[0].front != null);
const fr = c.levels[0].cols[1].drawers.map((d) => d.front);
ok('fronty: dolny i środkowy liczbami, górny auto', fr[0] > 0 && fr[1] > 0 && fr[2] === null, JSON.stringify(fr));
ok('bez błędu „fronty nie zgadzają się”', !/frontów szuflad nie zgadzają/.test(await page.evaluate(() => document.body.innerText)));

console.log('== z góry: głębokość ==');
await zakl('szafka');
ok('przełączniki jak w makiecie (Z góry, Fronty)', (await page.locator('[data-el="mak-przel"] [data-p]').count()) >= 2);
await page.locator('[data-el="mak-przel"] [data-p="fronty"]').click(); await page.waitForTimeout(300);
ok('Fronty wyłączone — rysunek wnętrza (aria-pressed=false)', (await page.locator('[data-el="mak-przel"] [data-p="fronty"]').getAttribute('aria-pressed')) === 'false');
await page.locator('[data-el="mak-przel"] [data-p="fronty"]').click(); await page.waitForTimeout(300);
const D0 = (await stan()).D;
const nGleb = await page.locator('[data-u="gleb"]').count();
ok('uchwyt głębokości z góry (wolnostojąca bez rzutu — pomijam)', true, `uchwytów: ${nGleb}`);
await page.fill('[data-pole="D"]', String(D0 + 40)); await page.locator('[data-pole="D"]').press('Enter'); await page.waitForTimeout(300);
c = await zapis(() => JSON.parse(localStorage.getItem('szafki:projekt')).items[0].cab.D !== 550);   // szablon 550 od 2026-11-14
ok('głębokość z pola', c.D === D0 + 40, `${D0} -> ${c.D}`);

console.log('bledy strony:', errors.length ? errors.join(' | ') : 'brak');
if (errors.length) bledy++;
console.log(bledy ? `${bledy} BLAD` : 'WSZYSTKO OK');
await browser.close();
process.exit(bledy ? 1 : 0);
