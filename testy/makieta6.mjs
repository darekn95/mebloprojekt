// Makieta: szafa z kolumnami podzielonymi na poziomy (`col.podzial` / `col.segmenty`) i cokol szafki wolnostojacej
// (zgloszenia uzytkownika 2026-11-09: „w szafie nie widzi kolumn do sprawdzenia i poprawy”, „nie wyświetla cokołu”).
// Karta pokazuje kazdy poziom kolumny osobno; polki, fronty i szuflady zmieniaja sie w jednym poziomie, reszta zostaje.
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
  const it = JSON.parse(JSON.stringify(p.items[0]));
  const k0 = it.cab.levels[0].cols[0];
  const kol = (o) => ({ ...JSON.parse(JSON.stringify(k0)), w: null, ...o });
  Object.assign(it.cab, { name: 'Szafa', W: 1800, H: 2000, D: 500 });
  it.cab.plinth = { ...(it.cab.plinth || {}), on: true, mode: 'under', height: 100 };
  it.cab.legs = { ...(it.cab.legs || {}), on: true, height: 100 };
  it.cab.levels = [{ h: null, cols: [
    kol({ kind: 'doors', doors: 0, shelfTargets: [null, null, null, null], drazki: [3] }),
    kol({ kind: 'doors', doors: 1, klapa: 'gora', shelfTargets: [null, null, null, null], podzial: [0, 1, 2] }),
    kol({ kind: 'doors', doors: 2, shelfTargets: [null, null, null, null], podzial: [1] }),
  ] }];
  p.runs = [];
  p.items = [{ ...it, runId: null, roomId: (p.rooms && p.rooms[0] && p.rooms[0].id) || it.roomId }];
  p.active = 0;
  localStorage.setItem('szafki:projekt', JSON.stringify(p));
  localStorage.setItem('mp-tryb', 'prosta');
});
await page.reload({ waitUntil: 'networkidle' });
await page.waitForTimeout(1200);
const proj = () => page.evaluate(() => JSON.parse(localStorage.getItem('szafki:projekt')));
const kolumny = async () => (await proj()).items[0].cab.levels[0].cols;
// zapis projektu idzie z opoznieniem — czekamy, az warunek bedzie spelniony (do 5 s)
const czekajNa = async (f) => { await page.waitForFunction((src) => { const p = JSON.parse(localStorage.getItem('szafki:projekt')); try { return new Function('L', 'return ' + src)(p.items[0].cab.levels[0].cols); } catch (e) { return false; } }, f, { timeout: 5000 }).catch(() => {}); return kolumny(); };
const zakl = async (k) => { const b = page.locator(`[data-el="makieta"] nav [data-zakl="${k}"]`);
  if ((await b.getAttribute('aria-pressed')) !== 'true' || !(await page.locator('[data-el="mak-karta-panel"]').count())) await b.click(); await page.waitForTimeout(250); };
const wiersz = (t) => page.locator('[data-el="makieta-karta"] [data-el="mak-kolumna"]').filter({ has: page.locator('p', { hasText: new RegExp(`^${t}$`) }) });

console.log('== karta: poziomy kolumny ==');
await zakl('szafka');
const tekst = await page.locator('[data-el="makieta-karta"]').innerText();
ok('„Szafka”: każdy poziom kolumny 2 i 3 w karcie', ['kolumna 2 · poziom 4', 'kolumna 2 · poziom 1', 'kolumna 3 · poziom 2', 'kolumna 3 · poziom 1'].every((t) => tekst.includes(t)), tekst.replace(/\n/g, ' | ').slice(0, 300));
await zakl('polki');
const nWier = await page.locator('[data-el="makieta-karta"] [data-el="mak-kolumna"]').count();
ok('„Półki”: kolumna 1 + 4 poziomy kolumny 2 + 2 poziomy kolumny 3', nWier === 7, String(nWier));
ok('kolumna 3 · poziom 2: 1 półka (światła 2–3 kolumny)', (await wiersz('kolumna 3 · poziom 2').locator('[data-el="mak-polki-n"]').innerText()) === '1');
await wiersz('kolumna 3 · poziom 1').locator('[data-el="mak-polki"][data-v="1"]').click(); await page.waitForTimeout(400);
let L = await czekajNa('L[2].shelfTargets.length === 5');
ok('„+” w poziomie 1 kolumny 3: półka w tym poziomie, granica idzie za nią', L[2].shelfTargets.length === 5 && L[2].podzial.join() === '2', JSON.stringify({ st: L[2].shelfTargets, pz: L[2].podzial }));
ok('kolumna 3 · poziom 2 dalej ma 1 półkę, poziom 1 — 2', (await wiersz('kolumna 3 · poziom 2').locator('[data-el="mak-polki-n"]').innerText()) === '1' && (await wiersz('kolumna 3 · poziom 1').locator('[data-el="mak-polki-n"]').innerText()) === '2');
await wiersz('kolumna 2 · poziom 3').locator('[data-el="mak-drazek"]').click(); await page.waitForTimeout(400);
L = await czekajNa('(L[1].drazki || []).length > 0');
ok('drążek w poziomie 3 kolumny 2 (światło 2)', (L[1].drazki || []).join() === '2', JSON.stringify(L[1].drazki));

console.log('== fronty i szuflady w poziomie kolumny ==');
await zakl('drzwi');
await wiersz('kolumna 2 · poziom 1').locator('[data-el="mak-front"][data-v="drzwi-2"]').click(); await page.waitForTimeout(400);
L = await czekajNa('L[1].segmenty && L[1].segmenty[0] && L[1].segmenty[0].doors === 2');
ok('„2 drzwi” w poziomie 1 kolumny 2 (reszta kolumny — klapy)', (L[1].segmenty || [])[0] && L[1].segmenty[0].doors === 2 && L[1].segmenty[0].klapa === null && L[1].klapa === 'gora', JSON.stringify(L[1].segmenty));
ok('poziom kolumny bez „Bez frontu”', !(await wiersz('kolumna 2 · poziom 2').locator('[data-v="otwarta"]').count()));
await zakl('szuflady');
await wiersz('kolumna 2 · poziom 4').locator('[data-el="mak-szuflady"][data-v="2"]').click(); await page.waitForTimeout(500);
L = await czekajNa('L[1].segmenty && L[1].segmenty[3] && L[1].segmenty[3].kind === "drawers"');
ok('2 szuflady w poziomie 4 kolumny 2', (L[1].segmenty || [])[3] && L[1].segmenty[3].kind === 'drawers' && L[1].segmenty[3].drawers.length === 2, JSON.stringify(L[1].segmenty));
const uch = page.locator('[data-u="szufl"][data-seg="3"]');
ok('uchwyt między szufladami poziomu kolumny na rysunku', (await uch.count()) === 1);
if (await uch.count()) {
  const b = await uch.boundingBox();
  await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2); await page.mouse.down();
  await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2 - 25, { steps: 5 }); await page.mouse.up(); await page.waitForTimeout(400);
  L = await czekajNa('L[1].segmenty[3].drawers[0].front > 0');
  ok('przeciągnięcie: front dolnej szuflady poziomu zapisany w poziomie', L[1].segmenty[3].drawers[0].front > 0 && L[1].segmenty[3].drawers[1].front == null, JSON.stringify(L[1].segmenty[3].drawers.map((d) => d.front)));
}

console.log('== cokół, drążek, okno rysunku ==');
ok('cokół pod korpusem narysowany', (await page.locator('[data-el="cokol-szafki"]').count()) >= 1);
ok('drążek otwartej kolumny narysowany (zgłoszenie „a gdzie się to wyświetla?”)', (await page.locator('[data-el="makieta"] [data-el="rura-wieszaki"]').count()) >= 1);
const okno = await page.evaluate(() => { const r = document.querySelector('[data-el="makieta-rysunek"]').getBoundingClientRect(), n = document.querySelector('[data-el="naglowek"]').getBoundingClientRect();
  return { gora: Math.round(r.top), dol: Math.round(r.bottom), nagl: Math.round(n.bottom), H: innerHeight }; });
ok('rysunek pod paskiem i do dołu okna (suwak rysunku widoczny)', okno.dol <= okno.H && okno.gora >= okno.nagl && okno.dol > okno.H - 40, JSON.stringify(okno));
console.log('== przybliżanie w każdym widoku ==');
await page.locator('[data-el="mak-ciag"] button').first().click(); await page.locator('[data-el="mak-ciag"] [data-v="szafka"]').click(); await page.waitForTimeout(400);
const wys = async () => page.evaluate(() => { const s = [...document.querySelectorAll('[data-el="mak-plotno"] svg')].find((q) => q.querySelector('[data-el="makieta-szafka"]')); return s ? Math.round(s.getBoundingClientRect().height) : 0; });
const h1 = await wys();
ok('„Tylko zaznaczona szafka”: − / % / + / Dopasuj / Powiększ', (await page.locator('[data-el="mak-zoom"] button').count()) >= 4 && (await page.locator('[data-el="mak-przel"] [data-p="powieksz"]').count()) === 1);
await page.locator('[data-el="mak-zoom"] button[title="Powiększ"]').click(); await page.waitForTimeout(400);
const h2 = await wys();
ok('„+” powiększa samą szafkę', h2 > h1 * 1.15, `${h1} → ${h2}`);
await page.locator('[data-el="mak-zoom"] button', { hasText: 'Dopasuj' }).click(); await page.waitForTimeout(300);
await page.locator('[data-el="mak-ciag"] button').first().click(); await page.locator('[data-el="mak-ciag"] [data-v="aktywny"]').click(); await page.waitForTimeout(400);
console.log('== „Co zmienić?” — dwuklik i prawy przycisk ==');
const szafa = page.locator('[data-el="mak-plotno"] svg:not([data-el="makieta-wolnostojace-zgory"]) [data-el="makieta-szafka"]').first();
await zakl('szafka');
const bb = await szafa.boundingBox();
await page.mouse.dblclick(bb.x + bb.width * 0.5, bb.y + bb.height * 0.3); await page.waitForTimeout(300);
const menu = page.locator('[data-el="mak-menu-co"]');
const mz = await menu.locator('[data-mz]').evaluateAll((els) => els.map((e) => e.dataset.mz));
ok('dwuklik na szafce: „Co zmienić?” z zakładkami szafki', (await menu.count()) === 1 && ['szafka', 'szuflady', 'polki', 'drzwi', 'przegroda', 'cokol'].every((z) => mz.includes(z)), mz.join(','));
await menu.locator('[data-mz="polki"]').click(); await page.waitForTimeout(300);
ok('wybór „Półki” przełącza zakładkę i zamyka okienko', (await page.locator('[data-el="makieta"] nav [data-zakl="polki"]').getAttribute('aria-pressed')) === 'true' && !(await menu.count()));
await page.mouse.click(bb.x + bb.width * 0.5, bb.y + bb.height * 0.3, { button: 'right' }); await page.waitForTimeout(300);
ok('prawy przycisk: to samo okienko', (await menu.count()) === 1);
await page.keyboard.press('Escape'); await page.waitForTimeout(200);
ok('Esc zamyka', !(await menu.count()));
const ph = page.locator('[data-u="polka"][data-j="0"][data-k="0"]');
const pb = await ph.boundingBox();
await page.mouse.dblclick(pb.x + pb.width / 2, pb.y + pb.height / 2); await page.waitForTimeout(300);
ok('dwuklik na półce: wpisanie światła pod nią', (await page.locator('[data-el="mak-swiatlo"]').count()) === 1);
if (await page.locator('[data-el="mak-swiatlo-pole"]').count()) {
  await page.fill('[data-el="mak-swiatlo-pole"]', '300'); await page.locator('[data-el="mak-swiatlo-pole"]').press('Enter');
  L = await czekajNa('L[0].shelfTargets[0] === 300');
  ok('światło 300 zapisane, ostatnie auto', L[0].shelfTargets[0] === 300 && L[0].shelfTargets[L[0].shelfTargets.length - 1] == null, JSON.stringify(L[0].shelfTargets));
}
console.log('== uwagi w makiecie ==');
await page.evaluate(() => window.scrollTo(0, 0)); await page.waitForTimeout(200);
const uw = page.locator('[data-el="makieta-uwagi"]');
ok('karta „Uwagi” pod makietą (błędy, ostrzeżenia, podpowiedzi)', (await uw.count()) === 1 && /Uwagi/.test(await uw.innerText()), String(await uw.count()));
const pod = await page.evaluate(() => document.querySelector('[data-el="makieta-uwagi"]').getBoundingClientRect().top >= document.querySelector('[data-el="makieta-rysunek"]').getBoundingClientRect().bottom - 1);
ok('uwagi na dole — pod rysunkiem (rysunek bez ucięcia na górze strony)', pod);
const odznaka = page.locator('[data-el="naglowek"] button', { hasText: /ostrze|błęd/ }).first();
if (await odznaka.count()) {
  await odznaka.click(); await page.waitForTimeout(800);
  const r = await uw.boundingBox();
  ok('przycisk ostrzeżeń w pasku przewija do uwag makiety', !!r && r.y < 950 && r.y + 20 > 0, JSON.stringify(r));
}
console.log('bledy strony:', errors.length ? errors.join(' | ') : 'brak');
if (errors.length) bledy++;
console.log(bledy ? `${bledy} BLAD` : 'WSZYSTKO OK');
await browser.close();
process.exit(bledy ? 1 : 0);
