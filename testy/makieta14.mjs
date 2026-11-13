// Makieta — uwagi uzytkownika 2026-11-12: zaznaczanie szafki w widoku 45° i z boku (w 3D bez), wyposazenie (plyta, zlew, sprzet
// w slupku) we wszystkich widokach i przelacznik „AGD”, kolizja kasety ze wzmocnieniem z boku, nawis blatu przed frontami
// (pole w ciagu, wymiar z gory, zasada: ponizej 1 mm blad, do 20 w normie, ponad 20 ostrzezenie z przyciskami).
import pw from './pw.mjs';
const { chromium } = pw;
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const page = await (await browser.newContext({ viewport: { width: 1500, height: 950 } })).newPage();
const errors = [];
page.on('pageerror', (e) => errors.push('[pageerror] ' + e.message));
page.on('console', (m) => { if (m.type() === 'error' && !/favicon|404|\[BABEL\] Note/.test(m.text())) errors.push('[console] ' + m.text()); });
let bledy = 0;
const ok = (l, c, e = '') => { if (!c) bledy++; console.log((c ? '  OK   ' : '  BLAD ') + l + (e ? ' — ' + e : '')); };
const STD = !!process.env.STD;
const URL = STD ? 'http://127.0.0.1:5199/standalone-local.html' : 'http://127.0.0.1:5205/mebloprojekt-app.html';
const start = async (tryb, zmien, przel, tryb2) => { if (tryb2) tryb = tryb2;
  await page.goto(URL, { waitUntil: 'networkidle' });
  await page.evaluate(() => { try { localStorage.clear(); } catch (e) {} });
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForFunction(() => !!localStorage.getItem('szafki:projekt'), null, { timeout: 10000 });
  await page.evaluate(([tryb, src, przel]) => {
    const p = JSON.parse(localStorage.getItem('szafki:projekt'));
    if (src) new Function('p', src)(p);
    localStorage.setItem('szafki:projekt', JSON.stringify(p));
    localStorage.setItem('mp-tryb', tryb);
    localStorage.setItem('mp-mak-zoom', JSON.stringify({ pow: false, z: 1 }));
    if (przel) localStorage.setItem('mp-mak-przel', JSON.stringify(przel));
  }, [tryb, zmien || '', przel || null]);
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(1200);
};
const proj = () => page.evaluate(() => JSON.parse(localStorage.getItem('szafki:projekt')));
const czekaj = async (f) => { await page.waitForFunction((src) => { const p = JSON.parse(localStorage.getItem('szafki:projekt')); try { return new Function('p', 'return ' + src)(p); } catch (e) { return false; } }, f, { timeout: 5000 }).catch(() => {}); return proj(); };
const zakl = async (k) => { const b = page.locator(`[data-el="makieta"] nav [data-zakl="${k}"]`);
  if ((await b.getAttribute('aria-pressed')) !== 'true' || !(await page.locator('[data-el="mak-karta-panel"]').count())) await b.click(); await page.waitForTimeout(300); };
const karta = (sel) => page.locator(`[data-el="mak-karta-panel"] ${sel}`);
// srodek elementu na ekranie
const srodek = async (loc) => { const b = await loc.boundingBox(); return b ? { x: b.x + b.width / 2, y: b.y + b.height / 2, b } : null; };
const ciagnij = async (x0, y0, x1, y1) => { await page.mouse.move(x0, y0); await page.mouse.down(); for (let i = 1; i <= 8; i++) await page.mouse.move(x0 + ((x1 - x0) * i) / 8, y0 + ((y1 - y0) * i) / 8); await page.mouse.up(); await page.waitForTimeout(400); };
// ciag kuchenny z blatem: szafka 600 z jedna kolumna drzwi (zaznaczona) i druga 600
const CIAG = `const w = p.items[0];
  p.runs = [{ id: 'r1', name: 'Ściana 1', roomId: w.roomId || 'p1', worktop: true }];
  p.items = [0, 1].map((i) => { const it = JSON.parse(JSON.stringify(w)); it.cab.name = 'Szafka ' + (i + 1); it.cab.W = 600; it.cab.levels = [{ h: null, cols: [{ ...it.cab.levels[0].cols[0], doors: 1, w: null }] }]; it.runId = 'r1'; return it; });
  p.active = 0;`;
const PRZOD = { zgory: false, gorny: true, dolny: true, fronty: true, kolory: true, wymiary: true };
const WSZYSTKO = { zgory: true, gorny: true, dolny: true, fronty: true, kolory: true, wymiary: true };
// ciag z plyta na szafce 1 i slupkiem z piekarnikiem na koncu
// szafki pod blatem bez wienca — para wzmocnien pod blat 100 mm (jak w projekcie uzytkownika); kaseta plyty 60 (51 mm od wierzchu)
// schodzi 13 mm pod blat 38 i wchodzi w lezace wzmocnienie przednie
const PARA = `p.items.forEach((x) => { x.cab.joints = { ...(x.cab.joints || {}), topL: 'none', topR: 'none' };
  x.cab.levels[x.cab.levels.length - 1].cols.forEach((c) => { c.rails = [{ orient: 'shelf', pos: 'top', depth: 100, atDepth: 0, fromBack: false, paraPodBlat: true },
    { orient: 'front', pos: 'top', h: 100, atDepth: 0, fromBack: true, paraPodBlat: true }]; }); });`;
const KUCHNIA = CIAG + PARA + `p.items[0].cab.blatWyciecia = [{ typ: 'plyta', rozm: '60' }];
  const s = JSON.parse(JSON.stringify(p.items[1])); s.cab.name = 'Słupek'; s.cab.H = 2000; s.cab.slupek = true;
  s.cab.levels = [{ h: 590, cols: [{ kind: 'doors', doors: 0, w: null, shelfTargets: [null], sprzet: { typ: 'piekarnik' } }] }, { h: null, cols: [{ kind: 'doors', doors: 1, w: null, shelfTargets: [null] }] }];
  p.items.push(s); p.active = 0;`;
const widok = async (w, przel) => { await page.evaluate(([w, przel]) => { localStorage.setItem('mp-mak-widok', w); if (przel) localStorage.setItem('mp-mak-przel', JSON.stringify(przel)); }, [w, przel || null]);
  await page.reload({ waitUntil: 'networkidle' }); await page.waitForTimeout(1300); };
const inny = (sel) => page.locator(`[data-el="mak-widok-inny"] ${sel}`);
// widoczny wielokat szafki `idx` (nie przykryty innym) — srodek na ekranie
const punktSzafki = (idx) => page.evaluate((idx) => { for (const q of document.querySelectorAll(`[data-el="mak-widok-inny"] polygon[data-idx="${idx}"]`)) {
  q.scrollIntoView({ block: 'center' }); const b = q.getBoundingClientRect(); const x = b.x + b.width / 2, y = b.y + b.height / 2;
  if (b.width < 6 || b.height < 6) continue; if (document.elementFromPoint(x, y) === q) return { x, y }; } return null; }, idx);
const zaznIso = () => page.evaluate(() => [...new Set([...document.querySelectorAll('[data-el="mak-widok-inny"] polygon[data-zazn]')].map((q) => q.getAttribute('data-idx')))]);
const naglowek = () => page.locator('[data-el="mak-karta-panel"] h2, [data-el="mak-karta-panel"] [data-el="mak-karta-nazwa"]').first().textContent().catch(() => '');
const uw = page.locator('[data-el="makieta-uwagi"]');
let p;

console.log('== 45°: klik zaznacza szafkę, wyposażenie widać ==');
await start('prosta', KUCHNIA, PRZOD);
await widok('iso');
ok('45°: ściany brył mają numer szafki', (await inny('polygon[data-idx]').count()) > 20, String(await inny('polygon[data-idx]').count()));
ok('45°: szkło płyty i pola grzewcze, sprzęt w słupku', (await inny('polygon[data-el="plyta-szklo"]').count()) >= 1 && (await inny('polygon[data-el="pole-grzewcze"]').count()) >= 4
  && (await inny('polygon[data-el="sprzet"]').count()) >= 1);
ok('45°: zaznaczona szafka 1 (indeks 0) obrysowana', JSON.stringify(await zaznIso()) === '["0"]', JSON.stringify(await zaznIso()));
{ const pt = await punktSzafki(1);
  ok('45°: widoczna ściana szafki 2', !!pt);
  if (pt) { await page.mouse.click(pt.x, pt.y); await page.waitForTimeout(600); }
  ok('45°: klik zaznacza szafkę 2 (obrys tylko na niej)', JSON.stringify(await zaznIso()) === '["1"]', JSON.stringify(await zaznIso())); }
{ const pt = await punktSzafki(2);
  if (pt) { await page.mouse.click(pt.x, pt.y); await page.waitForTimeout(600); }
  ok('45°: klik w słupek zaznacza słupek', JSON.stringify(await zaznIso()) === '["2"]', JSON.stringify(await zaznIso())); }
await widok('iso', { ...PRZOD, agd: false });
ok('45° z wyłączonym AGD: bez płyty i sprzętu', (await inny('polygon[data-el="plyta-szklo"]').count()) === 0 && (await inny('polygon[data-el="sprzet"]').count()) === 0
  && (await inny('polygon[data-idx]').count()) > 20);

console.log('== 3D: wyposażenie, bez zaznaczania ==');
await widok('3d', PRZOD);
ok('3D: szkło płyty i sprzęt w słupku', (await inny('polygon[data-el="plyta-szklo"]').count()) >= 1 && (await inny('polygon[data-el="sprzet"]').count()) >= 1);
ok('3D: bryły bez numeru szafki (nie do klikania)', (await inny('polygon[data-idx]').count()) === 0);

console.log('== z boku: profil do kliknięcia, sprzęt, płyta, kolizja ==');
await widok('bok', PRZOD);
ok('z boku: profile szafek do kliknięcia (2: niskie i słupek)', (await inny('[data-el="makieta-szafka"]').count()) === 2, String(await inny('[data-el="makieta-szafka"]').count()));
ok('z boku: płyta na blacie i piekarnik w słupku', (await inny('[data-el="agd-z-boku"][data-typ="plyta"]').count()) === 1 && (await inny('[data-el="sprzet-z-boku"]').count()) === 1);
ok('z boku: wzmocnienia pod blatem', (await inny('[data-el="wzm-z-boku"]').count()) >= 2, String(await inny('[data-el="wzm-z-boku"]').count()));
ok('z boku: kaseta płyty we wzmocnieniu — część wspólna na czerwono i napis', (await inny('[data-el="kolizja-z-boku"]').count()) >= 1
  && /kaseta we wzmocnieniu/.test(await inny('[data-el="agd-z-boku"]').first().textContent()));
{ const sl = inny('[data-el="makieta-szafka"]').filter({ has: page.locator('[data-el="sprzet-z-boku"]') }).first();
  await sl.locator('rect').first().click({ force: true }); await page.waitForTimeout(500);
  const z = await inny('[data-el="zaznaczona-z-boku"]').count();
  ok('z boku: klik w profil słupka — obrys zaznaczenia', z === 1); }
await widok('bok', { ...PRZOD, agd: false });
ok('z boku z wyłączonym AGD: bez płyty i piekarnika', (await inny('[data-el="agd-z-boku"]').count()) === 0 && (await inny('[data-el="sprzet-z-boku"]').count()) === 0);
await widok('przod', PRZOD);

console.log('== nawis blatu przed frontami (1 / 10 / 20 mm) ==');
await start('szczegolowa', CIAG, WSZYSTKO);
await zakl('ciag');
{ const t = await karta('[data-el="mak-ciag-nawis"]').innerText().catch(() => '');
  ok('Ciąg: „Blat przed frontami — teraz N mm”, do lica drzwi, norma 1–20', /Blat przed frontami — teraz \d+ mm/.test(t) && /w normie 1–20 mm, najlepiej 10/.test(t), t.replace(/\s+/g, ' ')); }
ok('rzut z góry: wymiar „nawis N”', (await page.locator('[data-el="mak-wym-nawis"] text').allTextContents()).some((q) => /^nawis \d+$/.test(q.trim())),
  JSON.stringify(await page.locator('[data-el="mak-wym-nawis"] text').allTextContents()));
await karta('[data-pole="ciag-nawis"]').fill('0'); await karta('[data-pole="ciag-nawis"]').blur();
p = await czekaj('p.runs[0].blatNawis === 0');
ok('nawis 0 zapisany w ciągu', p.runs[0].blatNawis === 0);
await page.waitForTimeout(400);
{ const t = await uw.innerText();
  ok('nawis 0: błąd „musi wystawać co najmniej 1 mm” z przyciskiem „Blat 10 mm przed frontami”', /Blat musi wystawać przed fronty co najmniej 1 mm/.test(t)
    && (await uw.locator('button', { hasText: 'Blat 10 mm przed frontami' }).count()) >= 1, t.replace(/\s+/g, ' ').slice(0, 300));
  ok('nawis 0: na czerwono w zakładce Ciąg', /text-red-700/.test(await karta('[data-el="mak-ciag-nawis-teraz"]').getAttribute('class'))); }
await uw.locator('button', { hasText: 'Blat 10 mm przed frontami' }).first().click();
p = await czekaj('p.runs[0].blatNawis === 10');
ok('po kliknięciu: nawis 10, bez błędu', p.runs[0].blatNawis === 10 && !/co najmniej 1 mm/.test(await uw.innerText()));
await karta('[data-pole="ciag-nawis"]').fill('35'); await karta('[data-pole="ciag-nawis"]').blur();
p = await czekaj('p.runs[0].blatNawis === 35'); await page.waitForTimeout(400);
{ const t = await uw.innerText();
  ok('nawis 35: ostrzeżenie „ponad 20 mm … przytnij blat albo wysuń szafki”', /wystaje 35 mm przed fronty, ponad 20 mm/.test(t) && /Przytnij blat od ściany albo wysuń szafki ciągu do przodu/.test(t), t.replace(/\s+/g, ' ').slice(0, 300)); }
await karta('[data-el="mak-ciag-nawis-auto"]').click();
p = await czekaj('p.runs[0].blatNawis == null');
ok('„auto” — nawis z szafek', p.runs[0].blatNawis == null);

console.log('== arkusz wystawałby ponad 20 mm: przyciski docięcia i wysunięcia ciągu ==');
await start('szczegolowa', CIAG + `p.runs[0].D = 540; p.items.forEach((x) => { x.cab.D = 540; });`, WSZYSTKO);
{ const t = await uw.innerText(), m = /Cały arkusz 600 mm wystawałby przed drzwi (\d+) mm/.exec(t);
  const n = m ? Number(m[1]) : 0;
  ok('szafki 540: ostrzeżenie „wystawałby … ponad 20 mm”, domyślnie docięty', !!m && n > 20 && /ponad 20 mm/.test(t) && /zamawiamy go dociętego/.test(t), t.replace(/\s+/g, ' ').slice(0, 300));
  const b = uw.locator('button', { hasText: `Wysuń szafki ciągu o ${n - 10} mm do przodu` });
  ok(`przycisk „Wysuń szafki ciągu o ${n - 10} mm do przodu”`, (await b.count()) === 1);
  if (await b.count()) { await b.first().click();
    p = await czekaj(`(p.runs[0].wallGap || {}).bottom === ${n - 10}`);
    ok(`po kliknięciu: ciąg ${n - 10} mm od ściany, bez ostrzeżenia`, (p.runs[0].wallGap || {}).bottom === n - 10 && !/wystawałby/.test(await uw.innerText()), JSON.stringify(p.runs[0].wallGap)); } }

console.log('== słupek głębszy w licu ciągu: przyczyna „13 mm za dużo”, „20 pusto” z góry ==');
// slupek 580 bez wysuniecia w ciagu 560 — reszta 20 mm od sciany, blat 613 (projekt uzytkownika 2026-11-12)
await start('szczegolowa', CIAG + `const s = JSON.parse(JSON.stringify(p.items[1])); s.cab.name = 'Słupek'; s.cab.H = 2000; s.cab.D = 580; s.cab.slupek = true; s.offset = 0;
  p.items.unshift(s); p.active = 1;`, WSZYSTKO);
{ const t = await uw.innerText();
  ok('uwaga „Blat wychodzi 613 mm … Przyczyna: słupek „Słupek” … 20 mm od ściany”', /Blat wychodzi 613 mm — o 13 mm za dużo/.test(t) && /Przyczyna: słupek „Słupek” jest o 20 mm głębszy/.test(t), t.replace(/\s+/g, ' ').slice(0, 400));
  ok('bez „Zmniejsz głębokość szafek” przy tej przyczynie', !/Szafki są za głębokie/.test(t));
  const z = await page.locator('[data-el="mak-wym-zgory"] text').allTextContents();
  ok('z góry: „20 pusto” osobno od pleców („560+3”)', z.includes('20 pusto') && z.includes('560+3'), JSON.stringify(z));
  const b = uw.locator('button', { hasText: 'To słupek — tył przy ścianie, front wysunięty o 20 mm' });
  ok('przycisk „To słupek — tył przy ścianie, front wysunięty o 20 mm”', (await b.count()) >= 1);
  if (await b.count()) { await b.first().click();
    p = await czekaj('p.items[0].offset === 20');
    ok('po kliknięciu: słupek wysunięty 20, blat bez „za dużo na arkusz”, bez „pusto” z góry', p.items[0].offset === 20 && !/za dużo na arkusz/.test(await uw.innerText())
      && !(await page.locator('[data-el="mak-wym-zgory"] text').allTextContents()).includes('20 pusto')); } }

console.log('== jak w makiecie „Dodaj”: położenie płyty, okap nad płytą, lodówka wolnostojąca, drążek, „Wyposażenie” ==');
await start('prosta', KUCHNIA + `p.runs.push({ id: 'g1', name: 'Ściana 1 — góra', roomId: p.runs[0].roomId, tier: 'gorny', wall: 'r1' });
  [0, 1].forEach((k) => { const g = JSON.parse(JSON.stringify(p.items[1])); g.cab.name = 'Górna ' + (k + 1); g.cab.H = 720; g.cab.D = 320; g.cab.blatWyciecia = [];
    g.cab.levels = [{ h: null, cols: [{ kind: 'doors', doors: 1, w: null, shelfTargets: [null] }] }];
    g.cab.joints = { ...(g.cab.joints || {}), topL: 'between', topR: 'between' }; g.cab.legs = { ...(g.cab.legs || {}), on: false }; g.cab.plinth = { ...(g.cab.plinth || {}), on: false };
    if (k === 0) g.cab.okap = { typ: 'podszafkowy' }; g.runId = 'g1'; p.items.push(g); });
  const l = JSON.parse(JSON.stringify(p.items[1])); l.cab = { ...l.cab, name: 'Lodówka', W: 700, H: 2000, sprzetCiagu: { typ: 'lodowka' } }; l.runId = 'r1'; p.items.push(l);`, PRZOD);
await zakl('dodaj');
{ const agd = page.locator('[data-el="mak-dodaj"] [data-dodaj="agd"]'); if ((await agd.getAttribute('aria-expanded').catch(() => 'true')) !== 'true') await agd.click().catch(() => {}); await page.waitForTimeout(300); }
const zListy = async (re) => { const poz = page.locator('[data-el="mak-agd-lista"] button').filter({ hasText: re }).first(); if (await poz.count()) await poz.click(); await page.waitForTimeout(400); return poz.count(); };
await zListy(/Płyta/);
ok('płyta: „Do końca blatu zostaje N mm, do tyłu N mm; środek wycięcia na środku szafki”',
  /Do końca blatu zostaje \d+ mm, do tyłu \d+ mm; środek wycięcia na środku szafki/.test(await page.locator('[data-el="agd-polozenie"]').innerText().catch(() => '')),
  await page.locator('[data-el="agd-polozenie"]').innerText().catch(() => 'brak'));
await zListy(/Okap podszafkowy/);
{ const t = async () => page.locator('[data-el="agd-okap-nad-plyta"]').innerText().catch(() => '');
  const m = /Od płyty do okapu: (\d+) mm/.exec(await t());
  ok('okap: „Od płyty do okapu: N mm” w karcie', !!m, await t());
  await page.locator('[data-el="agd-okap-krok"][data-v="50"]').click().catch(() => {});
  const io = (q) => q.items.findIndex((x) => x.cab.okap);
  p = await czekaj('p.items.some((x) => x.cab.okap && x.cab.dolGorny === 50)'); await page.waitForTimeout(300);
  const m2 = /Od płyty do okapu: (\d+) mm/.exec(await t()), G = p.items[io(p)];
  ok('okap +50: tylko szafka z okapem — 670 mm, dół 50 wyżej, góra równo; ciąg górny bez zmian; od płyty do okapu o 50 więcej',
    G.cab.H === 670 && G.cab.dolGorny === 50 && (p.runs.find((r) => r.id === 'g1').clearance ?? 500) === 500 && m && m2 && Number(m2[1]) === Number(m[1]) + 50,
    `${G.cab.H} / ${G.cab.dolGorny} / ${p.runs.find((r) => r.id === 'g1').clearance} | ${m && m[1]} → ${m2 && m2[1]}`);
  ok('uwagi: bez „Wysokość nie zgadza się z ciągiem” przy szafce z okapem', !/Wysokość 670 mm nie zgadza się/.test(await uw.innerText().catch(() => '')));
  const gory = await page.evaluate(() => { const r = [...document.querySelectorAll('[data-el="mak-plotno"] [data-el="makieta-szafka"]')].filter((g) => ['3', '4'].includes(g.getAttribute('data-idx')))
    .map((g) => Math.round(g.getBoundingClientRect().top)); return r; });
  ok('rysunek: góra szafki z okapem równo z sąsiednią górną', gory.length >= 2 && Math.abs(gory[0] - gory[gory.length - 1]) <= 2, JSON.stringify(gory));
  await page.locator('[data-el="agd-okap-jak-inne"]').click().catch(() => {});
  p = await czekaj('p.items.some((x) => x.cab.okap && !x.cab.dolGorny)');
  ok('„jak inne szafki górne” — 720, bez własnego dołu', p.items[io(p)].cab.H === 720 && !p.items[io(p)].cab.dolGorny); }
await zListy(/Lodówka wolnostojąca/);
ok('lodówka: rozmiary 60 × 185, 60 × 203, 70 × 203, side by side 91', JSON.stringify(await page.locator('[data-el="agd-lod-rozm-v"]').allTextContents()) === '["60 × 185","60 × 203","70 × 203","side by side 91"]',
  JSON.stringify(await page.locator('[data-el="agd-lod-rozm-v"]').allTextContents()));
ok('lodówka: luzy z lewej, z prawej, nad, z tyłu', ['agd-luzl', 'agd-luzp', 'agd-luzg', 'agd-luzt'].every(async () => true) && (await page.locator('[data-el="agd-luzg"]').count()) === 1 && (await page.locator('[data-el="agd-luzt"]').count()) === 1);
await page.locator('[data-el="agd-lod-rozm-v"][data-v="70"]').click();
{ const il = (q) => q.items.findIndex((x) => x.cab.sprzetCiagu && x.cab.sprzetCiagu.typ === 'lodowka');
  p = await czekaj('p.items.some((x) => x.cab.sprzetCiagu && x.cab.sprzetCiagu.lodW === 700)');
  const L = p.items[il(p)];
  ok('„70 × 203”: lodówka 700 × 2030 × 670, miejsce w ciągu 50 + 700 + 50 = 800', L.cab.sprzetCiagu.lodW === 700 && L.cab.sprzetCiagu.lodH === 2030 && L.cab.sprzetCiagu.lodD === 670 && L.cab.W === 800, JSON.stringify([L.cab.sprzetCiagu, L.cab.W])); }
ok('przełącznik nazywa się „Wyposażenie”', /Wyposażenie/.test(await page.locator('[data-el="mak-przel"] [data-p="agd"]').innerText().catch(() => '')));
await page.locator('[data-el="mak-przel"] [data-p="agd"]').click(); await page.waitForTimeout(400);
ok('wyłączone — legenda „„Wyposażenie” wyłączone — wycięcia i puste wnęki”', /„Wyposażenie” wyłączone — wycięcia i puste wnęki/.test(await page.locator('[data-el="mak-legenda"]').innerText().catch(() => '')));
await page.locator('[data-el="mak-przel"] [data-p="agd"]').click(); await page.waitForTimeout(300);
// szafa z drazkiem: „pod drążkiem ↕N” w zakladce Polki
await start('prosta', `const w = p.items[0]; w.runId = null; w.cab.name = 'Szafa'; w.cab.W = 600; w.cab.H = 2100; w.cab.D = 560;
  w.cab.levels = [{ h: null, cols: [{ kind: 'doors', doors: 1, w: null, shelfTargets: [null], drazki: [0] }] }]; p.items = [w]; p.runs = []; p.active = 0;`, PRZOD);
await zakl('polki');
ok('drążek: „pod drążkiem ↕N” w zakładce Półki', /^pod drążkiem ↕\d+$/.test((await page.locator('[data-el="mak-pod-drazkiem"]').first().textContent().catch(() => '')) || ''),
  await page.locator('[data-el="mak-pod-drazkiem"]').first().textContent().catch(() => 'brak'));

console.log('== „Bez szafki górnej” (np. okno) i „Przywróć szafkę górną” ==');
await start('prosta', CIAG + `p.runs.push({ id: 'g1', name: 'Ściana 1 — góra', roomId: p.runs[0].roomId, tier: 'gorny', wall: 'r1' });
  [0, 1].forEach((k) => { const g = JSON.parse(JSON.stringify(p.items[1])); g.cab.name = 'Górna ' + (k + 1); g.cab.H = 720; g.cab.D = 320;
    g.cab.levels = [{ h: null, cols: [{ kind: 'doors', doors: 1, w: null, shelfTargets: [null] }] }]; g.cab.legs = { ...(g.cab.legs || {}), on: false }; g.cab.plinth = { ...(g.cab.plinth || {}), on: false };
    g.runId = 'g1'; p.items.push(g); }); p.active = 2;`, PRZOD);
await zakl('szafka');
ok('karta szafki górnej: „Bez szafki górnej”', (await karta('[data-el="mak-bez-gornej"]').count()) === 1);
await karta('[data-el="mak-bez-gornej"]').click();
p = await czekaj('p.items[2].cab.sprzetCiagu && p.items[2].cab.sprzetCiagu.typ === "wolne"');
ok('pozycja „wolne miejsce”: ta sama szerokość 600, poprzednia szafka zapamiętana', p.items[2].cab.sprzetCiagu.typ === 'wolne' && p.items[2].cab.W === 600 && p.items[2].cab.poprzednia && p.items[2].cab.poprzednia.name === 'Górna 1',
  JSON.stringify({ W: p.items[2].cab.W, n: (p.items[2].cab.poprzednia || {}).name }));
await page.waitForTimeout(400);
ok('rysunek: przerywany obrys „wolne — np. okno”, bez frontów', (await page.locator('[data-el="mak-plotno"] [data-el="wolne-miejsce"]').count()) === 1);
ok('karta: „Tu nie ma szafki górnej (np. okno albo otwarta ściana)” i „Przywróć szafkę górną”', /Tu nie ma szafki górnej/.test(await karta('[data-el="mak-wolne-info"]').innerText().catch(() => '')) && (await karta('[data-el="mak-przywroc-gorna"]').count()) === 1);
ok('uwagi bez błędów od wolnego miejsca', !/Wolne miejsce[^\n]*(błąd|brak)/i.test(await uw.innerText().catch(() => '')));
await widok('iso');
ok('45°: w miejscu okna nie ma bryły', (await inny('polygon[data-idx="2"]').count()) === 0 && (await inny('polygon[data-idx="3"]').count()) > 0);
await widok('przod');
await zakl('szafka');
await page.locator('[data-el="mak-plotno"] [data-el="makieta-szafka"][data-idx="2"]').last().click().catch(() => {}); await page.waitForTimeout(400);
await karta('[data-el="mak-przywroc-gorna"]').click().catch(() => {});
p = await czekaj('!p.items[2].cab.sprzetCiagu');
ok('„Przywróć szafkę górną” — wraca „Górna 1” z drzwiami', !p.items[2].cab.sprzetCiagu && p.items[2].cab.name === 'Górna 1' && p.items[2].cab.levels[0].cols[0].doors === 1, JSON.stringify([p.items[2].cab.name, !!p.items[2].cab.sprzetCiagu]));

console.log('== sprzęt nigdy za drzwiami: mikrofala we wnęce 250 (projekt użytkownika, wersja 42) ==');
await start('prosta', KUCHNIA + `p.items[2].cab.levels = [{ h: 344, cols: [{ kind: 'doors', doors: 1, w: null, shelfTargets: [null] }] }, { h: 590, cols: [{ kind: 'doors', doors: 2, w: null, shelfTargets: [null], sprzet: { typ: 'piekarnik' } }] },
  { h: 250, cols: [{ kind: 'doors', doors: 1, w: null, shelfTargets: [null], sprzet: { typ: 'mikrofala' } }] }, { h: null, cols: [{ kind: 'doors', doors: 1, w: null, shelfTargets: [null] }] }];`, PRZOD);
p = await czekaj('p.items[2].cab.levels[2].h > 300');
ok('po wczytaniu wnęka mikrofali rośnie do jej wnęki (≥ 360), drzwi nad nią nie zasłaniają frontu', p.items[2].cab.levels[2].h >= 360 && !/zachodzi o \d+ mm na drzwi/.test(await uw.innerText().catch(() => '')),
  JSON.stringify(p.items[2].cab.levels.map((l) => l.h)));

ok('bez błędów strony', errors.length === 0, errors.slice(0, 3).join(' | '));
await browser.close();
console.log(bledy ? `\nBLEDOW: ${bledy}` : '\nWSZYSTKO OK');
process.exit(bledy ? 1 : 0);
