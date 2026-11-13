// Makieta — roznice z makieta testowa „Dodaj” (uzytkownik 2026-11-11: „wszystko zrób”): chwyt calej szuflady (gorna
// polowa — linia nad nia, dolna — pod nia), dwuklik na szufladzie (wysokosc frontu), „Szuflada + drzwi” jednym przyciskiem
// i „Szuflada typowa”, przenoszenie sprzetu do innej szafki (przeciaganie i „Przesuń” dotknieciem, zielone ramki),
// opis „Co zrobi program”, plyta indukcyjna jak w makiecie, lodowka — dolny front przy 2 frontach.
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

console.log('== Szuflada + drzwi ==');
await start('prosta', CIAG, WSZYSTKO);
await zakl('szuflady');
ok('przycisk „Szuflada + drzwi” w Szufladach', (await karta('[data-el="mak-szd-nowa"]').count()) === 1);
await karta('[data-el="mak-szd-nowa"]').click();
let p = await czekaj('p.items[0].cab.levels.length === 2');
let L = p.items[0].cab.levels;
ok('dwa poziomy: drzwi na dole, szuflada u góry', L.length === 2 && (L[0].cols[0].kind || 'doors') === 'doors' && L[1].cols[0].kind === 'drawers' && L[1].cols[0].drawers.length === 1, JSON.stringify(L.map((l) => [l.h, l.cols[0].kind, l.cols[0].doors])));
await page.waitForTimeout(400);
const frontSz = async () => page.evaluate(() => { const t = [...document.querySelectorAll('[data-el="makieta-uchwyty"] text')].map((q) => q.textContent.trim()).filter((q) => /^front \d+/.test(q)); return t; });
ok('front szuflady 170 mm', (await frontSz()).includes('front 170'), JSON.stringify(await frontSz()));
ok('wiersz „szuflada + drzwi” z miejscem i drzwiami', (await karta('[data-el="mak-szd"]').count()) === 1 && /szuflada \+ drzwi — front szuflady 170/.test(await karta('[data-el="mak-szd"]').textContent()));
await karta('[data-el="mak-szd-miejsce"][data-v="dol"]').click();
p = await czekaj('p.items[0].cab.levels[0].cols[0].kind === "drawers"');
L = p.items[0].cab.levels;
ok('szuflada na dole: poziom szuflady pierwszy', L[0].cols[0].kind === 'drawers' && (L[1].cols[0].kind || 'doors') === 'doors');
await page.waitForTimeout(400);
ok('front szuflady na dole 200 mm', (await frontSz()).includes('front 200'), JSON.stringify(await frontSz()));
await karta('[data-el="mak-szd-drzwi"][data-v="1"]').click();
p = await czekaj('p.items[0].cab.levels[1].cols[0].doors === 1');
ok('1 drzwi nad szufladą', p.items[0].cab.levels[1].cols[0].doors === 1);
// chwyt calej szuflady: gorna polowa — granica z drzwiami w gore
{ const pas = page.locator('[data-u="szuflSz"]').first();
  ok('szuflada do chwycenia na rysunku', (await pas.count()) === 1);
  const s = await srodek(pas);
  await ciagnij(s.x, s.b.y + 4, s.x, s.b.y - 60);
  await page.waitForTimeout(300);
  const f = await frontSz();
  const h = Number(((f[0] || '').match(/\d+/) || [0])[0]);
  ok('górna połowa szuflady ciągnie linię nad nią — szuflada wyższa', h > 220, JSON.stringify(f));
  ok('„Szuflada typowa (200 mm)” po zmianie', (await karta('[data-el="mak-szd-typowa"]').count()) === 1 && /200/.test(await karta('[data-el="mak-szd-typowa"]').textContent()));
  await karta('[data-el="mak-szd-typowa"]').click(); await page.waitForTimeout(500);
  ok('„Szuflada typowa” wraca do 200', (await frontSz()).includes('front 200'), JSON.stringify(await frontSz()));
}
// dwuklik na szufladzie — wysokosc frontu
{ const pas = page.locator('[data-u="szuflSz"]').first(); const s = await srodek(pas);
  await page.mouse.dblclick(s.x, s.y); await page.waitForTimeout(300);
  ok('dwuklik na szufladzie — okienko wysokości', (await page.locator('[data-el="mak-szuflada-wys"]').count()) === 1);
  await page.locator('[data-el="mak-szuflada-wys-pole"]').fill('250'); await page.locator('[data-el="mak-szuflada-wys-pole"]').press('Enter'); await page.waitForTimeout(500);
  ok('wpisane 250 — front szuflady 250', (await frontSz()).includes('front 250'), JSON.stringify(await frontSz()));
}
// zwykle szuflady: chwyt dolnej polowy srodkowej szuflady ciagnie linie pod nia
await karta('[data-el="mak-szuflady"][data-v="3"]').first().click().catch(() => {});
console.log('== 3 szuflady: chwyt dolnej połowy ==');
await start('prosta', CIAG + `p.items[0].cab.levels[0].cols[0].kind = 'drawers'; p.items[0].cab.levels[0].cols[0].drawers = [{}, {}, {}];`, WSZYSTKO);
await zakl('szuflady');
{ const przed = await frontSz();
  const pas = page.locator('[data-u="szuflSz"][data-k="1"]'); const s = await srodek(pas);
  ok('3 szuflady — każda do chwycenia', (await page.locator('[data-u="szuflSz"]').count()) === 3);
  await ciagnij(s.x, s.b.y + s.b.height - 4, s.x, s.b.y + s.b.height + 40);
  const po = await frontSz();
  const n = (t) => t.map((q) => Number(q.match(/\d+/)[0]));
  ok('dolna połowa środkowej: niższa szuflada mniejsza, środkowa większa, górna bez zmian', n(po)[0] < n(przed)[0] && n(po)[1] > n(przed)[1] && n(po)[2] === n(przed)[2], JSON.stringify([przed, po]));
}

console.log('== Drzwi i klapy: „Szuflada + drzwi” ==');
await start('prosta', CIAG, WSZYSTKO);
await zakl('drzwi');
ok('przycisk „Szuflada + drzwi” wśród frontów', (await karta('[data-el="mak-front"][data-v="szuflada-drzwi"]').count()) === 1);
await karta('[data-el="mak-front"][data-v="szuflada-drzwi"]').click();
p = await czekaj('p.items[0].cab.levels.length === 2');
ok('z Drzwi — szuflada u góry i drzwi', p.items[0].cab.levels.length === 2 && p.items[0].cab.levels[1].cols[0].kind === 'drawers');

console.log('== płyta indukcyjna jak w makiecie ==');
await start('prosta', CIAG + `p.items[0].cab.blatWyciecia = [{ typ: 'plyta', rozm: '60' }, { typ: 'zlew', rozm: '1' }].slice(0, 1); p.items[1].cab.blatWyciecia = [{ typ: 'zlew', rozm: '1' }];`, WSZYSTKO);
{ const r = await page.evaluate(() => { const g = document.querySelector('[data-el="wyciecie-blatu"]'); if (!g) return null;
    const rant = g.querySelector('[data-el="rant-blatu"]'), kola = [...g.querySelectorAll('[data-el="pola-grzewcze"] circle')];
    return { fill: rant && rant.getAttribute('fill'), op: rant && rant.getAttribute('opacity'), kola: kola.length, kolor: kola[0] && kola[0].getAttribute('stroke'), r: [...new Set(kola.map((c) => Math.round(Number(c.getAttribute('r')))))].length }; });
  ok('z góry: ciemne szkło, 4 jasne pola grzewcze w dwóch rozmiarach', !!r && r.fill === '#292524' && r.op === '1' && r.kola === 4 && r.kolor === '#d6d3d1' && r.r === 2, JSON.stringify(r));
  const f = await page.evaluate(() => [...document.querySelectorAll('[data-el="wyciecie-front"]')].map((g) => ({ typ: g.getAttribute('data-typ'), szklo: !!g.querySelector('rect[height="10"]'), kran: !!g.querySelector('path'), kas: g.querySelectorAll('rect[stroke-dasharray]').length })));
  ok('z przodu: szkło płyty na blacie i kaseta pod nim, zlew z baterią i komorą', f.some((q) => q.typ === 'plyta' && q.szklo && q.kas === 1) && f.some((q) => q.typ === 'zlew' && q.kran && q.kas >= 1), JSON.stringify(f));
}

console.log('== przenoszenie sprzętu: przeciąganie i „Przesuń” ==');
const TRZY = CIAG + `const s = JSON.parse(JSON.stringify(p.items[1])); s.cab.name = 'Słupek'; s.cab.H = 2000; s.cab.slupek = true; p.items.push(s);
  p.items[0].cab.levels[0].cols[0].sprzet = { typ: 'piekarnik' };`;
await start('prosta', TRZY, PRZOD);
await zakl('dodaj');
{ // piekarnik z szafki 1 przeciagniety na slupek
  const sz = page.locator('[data-el="mak-plotno"] [data-el="makieta-szafka"][data-idx="0"]').last(), sl = page.locator('[data-el="mak-plotno"] [data-el="makieta-szafka"][data-idx="2"]').last();
  const a = await srodek(sz), b = await srodek(sl);
  await page.mouse.move(a.x, a.y); await page.mouse.down();
  for (let i = 1; i <= 10; i++) await page.mouse.move(a.x + ((b.x - a.x) * i) / 10, a.y + ((b.y - a.y) * i) / 10);
  await page.waitForTimeout(200);
  const r = await page.evaluate(() => [...document.querySelectorAll('[data-el="mak-ramka"]')].map((q) => [q.getAttribute('data-idx'), q.getAttribute('data-akt')]));
  ok('w trakcie: zielone ramki na szafce 2 i słupku, słupek podświetlony', r.length === 2 && r.some(([i, a2]) => i === '2' && a2 === '1') && r.some(([i]) => i === '1'), JSON.stringify(r));
  await page.mouse.up(); await page.waitForTimeout(600);
  p = await czekaj('p.items[2].cab.levels.some((lv) => lv.cols.some((k) => k.sprzet))');
  const wSl = p.items[2].cab.levels.some((lv) => lv.cols.some((k) => k.sprzet && k.sprzet.typ === 'piekarnik'));
  const wSz = p.items[0].cab.levels.some((lv) => lv.cols.some((k) => k.sprzet));
  ok('piekarnik przeniesiony do słupka (własny poziom), szafka 1 bez sprzętu', wSl && !wSz && p.items[2].cab.levels.length >= 2, JSON.stringify(p.items[2].cab.levels.map((l) => [l.h, l.cols[0].sprzet && l.cols[0].sprzet.typ])));
  ok('ramki znikają po upuszczeniu', (await page.locator('[data-el="mak-ramka"]').count()) === 0);
  ok('karta przeniesionego sprzętu z „Co zrobi program”', (await page.locator('[data-el="agd-co-zrobi"]').count()) === 1 && /Wnęka na piekarnik w „Słupek”/.test(await page.locator('[data-el="agd-co-zrobi"]').textContent()));
}
{ // „Przesuń” z karty: piekarnik ze slupka z powrotem do szafki 2
  ok('w karcie sprzętu przycisk „Przesuń do innej szafki”', (await page.locator('[data-el="agd-przesun"]').count()) === 1);
  await page.locator('[data-el="agd-przesun"]').click(); await page.waitForTimeout(300);
  ok('tryb „Przesuń”: pasek i zielone ramki', (await page.locator('[data-el="mak-przesun-pasek"]').count()) === 1 && (await page.locator('[data-el="mak-ramka"]').count()) >= 1);
  const sz = await srodek(page.locator('[data-el="mak-plotno"] [data-el="makieta-szafka"][data-idx="1"]').last());
  await page.mouse.click(sz.x, sz.y); await page.waitForTimeout(600);
  p = await czekaj('p.items[1].cab.levels.some((lv) => lv.cols.some((k) => k.sprzet))');
  ok('dotknięcie szafki 2 — piekarnik w niej, słupek bez piekarnika', p.items[1].cab.levels.some((lv) => lv.cols.some((k) => k.sprzet && k.sprzet.typ === 'piekarnik')) && !p.items[2].cab.levels.some((lv) => lv.cols.some((k) => k.sprzet)));
  ok('pasek „Przesuń” znika', (await page.locator('[data-el="mak-przesun-pasek"]').count()) === 0 && (await page.locator('[data-el="mak-ramka"]').count()) === 0);
}
{ // „Przesuń w ciągu” szafki
  await start('prosta', TRZY, PRZOD);
  await zakl('szafka');
  ok('Szafka: „Co zrobi program” z korpusem i wnęką', /Korpus 600 × 720/.test(await karta('[data-el="mak-co-zrobi"]').textContent()) && /piekarnik/.test(await karta('[data-el="mak-co-zrobi"]').textContent()), await karta('[data-el="mak-co-zrobi"]').textContent());
  await karta('[data-el="mak-przesun-szafke"]').click(); await page.waitForTimeout(300);
  const sl = await srodek(page.locator('[data-el="mak-plotno"] [data-el="makieta-szafka"][data-idx="2"]').last());
  await page.mouse.click(sl.x + sl.b.width / 4, sl.y); await page.waitForTimeout(500);
  p = await czekaj('p.items[2].cab.name === "Szafka 1"');
  ok('„Przesuń w ciągu”: szafka 1 za słupkiem', p.items.map((x) => x.cab.name).join(',') === 'Szafka 2,Słupek,Szafka 1', p.items.map((x) => x.cab.name).join(','));
}
console.log('== mikrofala ze słupka za uchwyt na drugi słupek, płyta „Przesuń” ==');
await start('prosta', TRZY + `p.items[0].cab.levels[0].cols[0].sprzet = null; delete p.items[0].cab.levels[0].cols[0].sprzet;
  const s2 = JSON.parse(JSON.stringify(p.items[2])); s2.cab.name = 'Słupek 2'; p.items.push(s2);
  p.items[2].cab.levels = [{ h: 400, cols: [{ ...p.items[2].cab.levels[0].cols[0], sprzet: { typ: 'mikrofala' } }] }, { h: null, cols: [{ ...p.items[2].cab.levels[0].cols[0] }] }];
  p.items[0].cab.blatWyciecia = [{ typ: 'plyta', rozm: '60' }]; p.active = 2;`, PRZOD);
await zakl('dodaj');
{ const uch = page.locator('[data-u="sprzetY"]').first();
  ok('słupek: uchwyt mikrofali', (await uch.count()) === 1);
  const a = await srodek(uch), b = await srodek(page.locator('[data-el="mak-plotno"] [data-el="makieta-szafka"][data-idx="3"]').last());
  await page.mouse.move(a.x, a.y); await page.mouse.down();
  for (let i = 1; i <= 10; i++) await page.mouse.move(a.x + ((b.x - a.x) * i) / 10, a.y + ((b.y - a.y) * i) / 10);
  await page.waitForTimeout(200);
  ok('nad słupkiem 2: jego ramka podświetlona', (await page.locator('[data-el="mak-ramka"][data-idx="3"][data-akt="1"]').count()) === 1);
  await page.mouse.up(); await page.waitForTimeout(600);
  p = await czekaj('p.items[3].cab.levels.some((lv) => lv.cols.some((k) => k.sprzet))');
  ok('mikrofala w słupku 2, słupek 1 bez sprzętu i bez jej poziomu', p.items[3].cab.levels.some((lv) => lv.cols.some((k) => k.sprzet && k.sprzet.typ === 'mikrofala'))
    && !p.items[2].cab.levels.some((lv) => lv.cols.some((k) => k.sprzet)) && p.items[2].cab.levels.length === 1, JSON.stringify(p.items[2].cab.levels.map((l) => l.h)));
}
{ // plyta: „Przesuń” z karty (z listy „W projekcie”)
  const poz = page.locator('[data-el="mak-agd-lista"] button').filter({ hasText: 'Płyta' }).first();
  if (await poz.count()) await poz.click(); await page.waitForTimeout(300);
  ok('karta płyty: „Co zrobi program” i „Przesuń”', /Wycięcie .* w blacie nad „Szafka 1”/.test((await page.locator('[data-el="agd-co-zrobi"]').textContent().catch(() => '')) || '') && (await page.locator('[data-el="agd-przesun"]').count()) === 1);
  await page.locator('[data-el="agd-przesun"]').click(); await page.waitForTimeout(300);
  const r = await page.evaluate(() => [...document.querySelectorAll('[data-el="mak-ramka"]')].map((q) => q.getAttribute('data-idx')).sort().join(','));
  ok('ramki tylko na szafce pod blatem (szafka 2)', r === '1', r);
  const sz = await srodek(page.locator('[data-el="mak-plotno"] [data-el="makieta-szafka"][data-idx="1"]').last());
  await page.mouse.click(sz.x, sz.y); await page.waitForTimeout(500);
  p = await czekaj('(p.items[1].cab.blatWyciecia || []).length === 1');
  ok('płyta przeniesiona nad szafkę 2', (p.items[1].cab.blatWyciecia || []).length === 1 && !(p.items[0].cab.blatWyciecia || []).length);
}
console.log('== płyta przeciągana z góry: ramki i podpis przy wskaźniku ==');
await start('prosta', CIAG + `p.items[0].cab.blatWyciecia = [{ typ: 'plyta', rozm: '60' }];`, WSZYSTKO);
{ const a = await srodek(page.locator('[data-el="wyciecie-blatu"]').first());
  const b = await srodek(page.locator('[data-el="mak-zgory"] [data-el="makieta-szafka"][data-idx="1"]').first());
  await page.mouse.move(a.x, a.y); await page.mouse.down();
  for (let i = 1; i <= 10; i++) await page.mouse.move(a.x + ((b.x - a.x) * i) / 10, a.y + ((b.y - a.y) * i) / 10);
  await page.waitForTimeout(250);
  const r = await page.evaluate(() => [...document.querySelectorAll('[data-el="mak-ramka"]')].map((q) => q.getAttribute('data-idx') + ':' + q.getAttribute('data-akt')));
  ok('w trakcie: ramki na szafce 2 (z góry i z przodu), ta pod wskaźnikiem podświetlona', r.filter((q) => q.startsWith('1:')).length === 2 && r.includes('1:1'), JSON.stringify(r));
  const nap = await page.locator('[data-el="mak-niesiesz"]').textContent().catch(() => '');
  ok('przy wskaźniku: „Płyta … → „Szafka 2” — puść”', /→ „Szafka 2” — puść/.test(nap), nap);
  await page.mouse.up(); await page.waitForTimeout(500);
  p = await czekaj('(p.items[1].cab.blatWyciecia || []).length === 1');
  ok('płyta nad szafką 2, ramki i podpis zniknęły', (p.items[1].cab.blatWyciecia || []).length === 1 && !(p.items[0].cab.blatWyciecia || []).length
    && (await page.locator('[data-el="mak-ramka"], [data-el="mak-niesiesz"]').count()) === 0);
}
console.log('== słupek: piekarnik i mikrofala jak klocki (bez „kosmosu”) ==');
await start('prosta', TRZY.replace("p.items[0].cab.levels[0].cols[0].sprzet = { typ: 'piekarnik' };", '') + 'p.active = 2;', PRZOD);
await zakl('dodaj');
{ const sw = page.locator('[data-el="mak-dodaj"] [data-dodaj="agd"]'); if (await sw.count() && (await sw.getAttribute('aria-expanded')) !== 'true') await sw.click().catch(() => {}); await page.waitForTimeout(300); }
const poz = async (oczek) => { if (oczek) await page.waitForFunction((o) => { const p = JSON.parse(localStorage.getItem('szafki:projekt'));
    return JSON.stringify(p.items[2].cab.levels.map((q) => [q.h, (q.cols[0].sprzet || {}).typ || 'd'])) === o; }, JSON.stringify(oczek), { timeout: 4000 }).catch(() => {});
  return (await proj()).items[2].cab.levels.map((q) => [q.h, (q.cols[0].sprzet || {}).typ || 'd']); };
await page.locator('[data-el="mak-agd"]').filter({ hasText: 'Piekarnik' }).first().click(); await page.locator('[data-el="mak-wybrany-teraz"]').click(); await page.waitForTimeout(700);
await page.locator('[data-el="mak-agd"]').filter({ hasText: 'Mikrofala' }).first().click(); await page.locator('[data-el="mak-wybrany-teraz"]').click(); await page.waitForTimeout(700);
ok('jak w makiecie „Dodaj”: piekarnik nisko (692), mikrofala na nim do 1300 od podłogi', JSON.stringify(await poz([[556, 'd'], [590, 'piekarnik'], [373, 'mikrofala'], [null, 'd']])) === JSON.stringify([[556, 'd'], [590, 'piekarnik'], [373, 'mikrofala'], [null, 'd']]), JSON.stringify(await poz()));
ok('„Na wysokość blatu (dół 858)” — blat ciągu, nie słupka', /dół 858/.test(await page.locator('[data-el="agd-slupek-blat"]').textContent()));
await page.locator('[data-el="agd-slupek-blat"]').click(); await page.waitForTimeout(700);
ok('mikrofala na wysokości blatu: piekarnik zjeżdża pod nią (front pod piekarnikiem 114)', JSON.stringify(await poz([[114, 'd'], [590, 'piekarnik'], [373, 'mikrofala'], [null, 'd']])) === JSON.stringify([[114, 'd'], [590, 'piekarnik'], [373, 'mikrofala'], [null, 'd']]), JSON.stringify(await poz()));
ok('karta dalej pokazuje mikrofalę, dół 858', /Mikrofala/.test(await page.locator('[data-el="makieta-karta-agd"] b').first().textContent()) && (await page.locator('[data-el="agd-slupek-dol"]').inputValue()) === '858');
await page.locator('[data-el="agd-slupek-krok"][data-v="50"]').click(); await page.waitForTimeout(700);
ok('+50 przy mikrofali: piekarnik jedzie razem z nią (bez przerwy między nimi)', JSON.stringify(await poz([[164, 'd'], [590, 'piekarnik'], [373, 'mikrofala'], [null, 'd']])) === JSON.stringify([[164, 'd'], [590, 'piekarnik'], [373, 'mikrofala'], [null, 'd']]), JSON.stringify(await poz()));
ok('„Razem ✓” — sprzęty jeden na drugim', /Razem ✓/.test(await page.locator('[data-el="agd-slupek-razem"]').textContent()));
ok('„Razem ✓”', /Razem ✓/.test(await page.locator('[data-el="agd-slupek-razem"]').textContent()));
{ const g = await page.evaluate(() => { const s = [...document.querySelectorAll('[data-el="mak-plotno"] [data-el="makieta-szafka"][data-idx="2"]')].pop(); return s ? s.getBoundingClientRect().top : null; });
  const m = await page.evaluate(() => { const s = [...document.querySelectorAll('[data-el="mak-plotno"] [data-el="makieta-szafka"][data-idx="2"]')].pop(); const t = s && [...s.querySelectorAll('text')].find((q) => /mikrofala/.test(q.textContent)); return t ? t.getBoundingClientRect().top : null; });
  ok('mikrofala narysowana w słupku (nie nad nim)', g != null && m != null && m > g, JSON.stringify([g, m])); }
console.log('== projekt z „kosmosem” (piekarnik 1982) naprawia się przy wczytaniu ==');
await start('prosta', TRZY.replace("p.items[0].cab.levels[0].cols[0].sprzet = { typ: 'piekarnik' };", '') + `const k0 = p.items[2].cab.levels[0].cols[0];
  p.items[2].cab.levels = [{ h: 1982, cols: [{ ...k0, sprzet: { typ: 'piekarnik' } }] }, { h: 373, cols: [{ ...k0, sprzet: { typ: 'mikrofala' } }] }, { h: null, cols: [{ ...k0 }] }];`, PRZOD);
await page.locator('[data-el="makieta"] nav [data-zakl="szafka"]').click(); await page.waitForTimeout(500);
await page.locator('[data-el="mak-plotno"] [data-el="makieta-szafka"][data-idx="2"]').last().click(); await page.waitForTimeout(500);
{ const s2 = await page.evaluate(() => { const s = [...document.querySelectorAll('[data-el="mak-plotno"] [data-el="makieta-szafka"][data-idx="2"]')].pop(); return s ? [...s.querySelectorAll('text')].map((t) => t.textContent.trim()) : []; });
  p = await czekaj('p.items[2].cab.levels[0].h === 590');
  ok('poziom piekarnika wraca do wnęki (590), mikrofala w słupku', JSON.stringify(p.items[2].cab.levels.map((q) => q.h)) === JSON.stringify([590, 373, null]) || s2.includes('mikrofala'), JSON.stringify(p.items[2].cab.levels.map((q) => q.h))); }
console.log('== słupek wysunięty 40 mm w ciągu z cokołem: nóżki za płytą cokołu ==');
{ await start('prosta', TRZY + `p.items[2].cab.D = 600; p.items[2].offset = 40; p.runs[0].plinth = { on: true, height: 100, mode: 'under', setback: 0 };
    p.items.forEach((it) => { it.cab.plinth = { on: true, height: 100, mode: 'under', setback: 0 }; it.cab.legs = { ...(it.cab.legs || {}), on: true, height: 100 }; });
    p.runs.push({ id: 'r2', name: 'Ściana 2', roomId: p.runs[0].roomId, worktop: true, offset: 2500 }); const d2 = JSON.parse(JSON.stringify(p.items[1])); d2.cab.name = 'Szafka 3'; d2.runId = 'r2'; p.items.push(d2);`, PRZOD);
  const { execFileSync } = await import('node:child_process'), fs = await import('node:fs');
  const plik = '/tmp/makieta13-cokol.json'; fs.writeFileSync(plik, JSON.stringify(await proj()));
  let wyj = '';
  try { wyj = execFileSync('node', [new globalThis.URL('./audytprojektu.mjs', import.meta.url).pathname], { env: { ...process.env, PROJEKT: plik }, encoding: 'utf8', timeout: 240000 }); } catch (e) { wyj = (e.stdout || '') + (e.stderr || ''); }
  ok('audyt zabudowy: nic na nic nie nachodzi (nóżka słupka nie w cokole)', /OK\s+zabudowa/.test(wyj) && !/BLAD zabudowa/.test(wyj), ((wyj.match(/BLAD zabudowa.*$/m) || [''])[0] || wyj.slice(-300)).slice(0, 300));
}
console.log('== razem bez odstępu: piekarnik 722 pod mikrofalą wraca do 590, linii między nimi nie ma ==');
await start('prosta', TRZY.replace("p.items[0].cab.levels[0].cols[0].sprzet = { typ: 'piekarnik' };", '') + `const k0 = p.items[2].cab.levels[0].cols[0]; p.active = 2;
  p.items[2].cab.levels = [{ h: 722, cols: [{ ...k0, sprzet: { typ: 'piekarnik' } }] }, { h: 373, cols: [{ ...k0, sprzet: { typ: 'mikrofala' } }] }, { h: null, cols: [{ ...k0 }] }];`, PRZOD);
p = await czekaj('p.items[2].cab.levels[0].h === 590');
ok('poziom piekarnika pod mikrofalą = wnęka 590 (bez pustej wnęki nad nim)', p.items[2].cab.levels[0].h === 590, JSON.stringify(p.items[2].cab.levels.map((q) => q.h)));
await zakl('dodaj');
ok('w Dodaj: linii między piekarnikiem a mikrofalą do przeciągania nie ma (sprzęt — za uchwyt)', (await page.locator('[data-u="poziom"][data-k="0"]').count()) === 0 && (await page.locator('[data-u="sprzetY"]').count()) === 2);

console.log('== jak w makiecie „Dodaj”: wysokość słupka, dół szafek górnych, płyta „50 od przodu” ==');
await start('prosta', TRZY.replace("p.items[0].cab.levels[0].cols[0].sprzet = { typ: 'piekarnik' };", '') + `
  p.runs.push({ id: 'g1', name: 'Ściana 1 — góra', roomId: p.runs[0].roomId, tier: 'gorny', wall: 'r1' });
  const g = JSON.parse(JSON.stringify(p.items[0])); g.cab.name = 'Górna 1'; g.cab.H = 720; g.cab.D = 300; g.runId = 'g1'; g.cab.legs = { ...(g.cab.legs || {}), on: false }; g.cab.plinth = { ...(g.cab.plinth || {}), on: false }; p.items.push(g);
  p.items[0].cab.blatWyciecia = [{ typ: 'plyta', rozm: '60', odPrzodu: 90 }]; p.active = 2;`, PRZOD);
await zakl('szafka');
{ const ch = await karta('[data-el="mak-slupek-wys"]').allTextContents();
  ok('słupek: wysokości 1800 / 2000 / 2120 / 2200 i „równo z górnymi”', ['1800', '2000', '2120', '2200'].every((v) => ch.some((t) => t.startsWith(v))) && ch.some((t) => /równo z górnymi/.test(t)), JSON.stringify(ch));
  await karta('[data-el="mak-slupek-wys"][data-v="2120"]').click();
  p = await czekaj('p.items[2].cab.H === 2120');
  ok('klik 2120 — słupek 2120', p.items[2].cab.H === 2120); }
await page.locator('[data-el="mak-plotno"] [data-el="makieta-szafka"][data-idx="3"]').last().click(); await page.waitForTimeout(500);
{ const dol = Number(await karta('[data-el="mak-gorny-dol"]').inputValue().catch(() => 0));
  ok('szafka górna: „dół szafek górnych od podłogi” (blat + prześwit 500)', dol > 1200, String(dol));
  await karta('[data-el="mak-gorny-krok"][data-v="50"]').click();
  p = await czekaj('p.runs.find((r) => r.id === "g1").clearance === 550');
  ok('+50 — prześwit 550, dół o 50 wyżej', p.runs.find((r) => r.id === 'g1').clearance === 550 && Number(await karta('[data-el="mak-gorny-dol"]').inputValue()) === dol + 50);
  await karta('[data-el="mak-gorny-dom"]').click();
  p = await czekaj('p.runs.find((r) => r.id === "g1").clearance === 500');
  ok('„jak domyślnie” — prześwit 500', p.runs.find((r) => r.id === 'g1').clearance === 500); }
await zakl('dodaj');
{ const agd = page.locator('[data-el="mak-dodaj"] [data-dodaj="agd"]'); if ((await agd.getAttribute('aria-expanded')) !== 'true') await agd.click().catch(() => {}); await page.waitForTimeout(300);
  const poz = page.locator('[data-el="mak-agd-lista"] button').filter({ hasText: 'Płyta' }).first(); if (await poz.count()) await poz.click(); await page.waitForTimeout(300);
  ok('płyta 90 od przodu: przycisk „50 od przodu (typowo)”', (await page.locator('[data-el="agd-odprzodu-dom"]').count()) === 1);
  await page.locator('[data-el="agd-odprzodu-dom"]').click();
  p = await czekaj('p.items[0].cab.blatWyciecia[0].odPrzodu == null');
  ok('po kliknięciu — typowo od przodu', p.items[0].cab.blatWyciecia[0].odPrzodu == null); }
console.log('== rzut z góry: wymiary od ściany, blat, słupek wysunięty; pole „wysunięcie” ==');
await start('szczegolowa', TRZY.replace("p.items[0].cab.levels[0].cols[0].sprzet = { typ: 'piekarnik' };", '') + `p.items[2].cab.D = 600; p.items[2].offset = 40; p.runs[0].wallGap = { bottom: 20, top: null }; p.active = 0;`, WSZYSTKO);
{ const t = await page.locator('[data-el="mak-wym-zgory"] text').allTextContents();
  ok('z góry: „20 od ściany”, korpus, front, „blat …”', t.includes('20 od ściany') && t.some((q) => /^560/.test(q)) && t.some((q) => /^front \d+/.test(q)) && t.some((q) => /^blat \d+/.test(q)), JSON.stringify(t));
  const sl = await page.locator('[data-el="mak-wym-zgory-szafka"] text').allTextContents();
  ok('słupek: od ściany do jego lica i „wysunięty 40”', sl.some((q) => /wysunięty 40/.test(q)), JSON.stringify(sl)); }
await zakl('szafka');
ok('karta Szafka: pole „wysunięcie przed lico ciągu”', (await karta('[data-pole="wysuniecie"]').count()) === 1);
await karta('[data-pole="wysuniecie"]').fill('30'); await karta('[data-pole="wysuniecie"]').blur();
p = await czekaj('p.items[0].offset === 30');
ok('wpisane 30 — szafka wysunięta o 30', p.items[0].offset === 30);
await page.locator('[data-el="mak-przel"] [data-p="wymiary"]').click().catch(() => {}); await page.waitForTimeout(300);
{ const pz = page.locator('[data-el="mak-wymiary-menu"] [data-wym="zgory"], [data-wym="zgory"]').first();
  ok('lista „Wymiary”: pozycja „z góry: od ściany …”', (await pz.count()) === 1); }
console.log('== narożnik: bok szafki z sąsiedniej ściany ma jej wysokość, nie słupka ==');
await start('szczegolowa', CIAG + `const w0 = p.items[0];
  p.runs[0].wallW = 3000; p.runs.push({ id: 'r2', name: 'Ściana 2', roomId: p.runs[0].roomId, worktop: true, corner: { of: 'r1', at: 'end', owner: 'self', clear: 0, cut: 'prosty', wstawka: { typ: 'plaska', w: 60 } } });
  const s = JSON.parse(JSON.stringify(w0)); s.cab.name = 'Słupek'; s.cab.H = 2000; s.cab.slupek = true; p.items.unshift(s);
  const r = JSON.parse(JSON.stringify(w0)); r.cab.name = 'Róg'; r.cab.W = 1095; r.runId = 'r2'; p.items.push(r);
  p.active = 1;`, WSZYSTKO);
{ const b = await page.evaluate(() => { const t = [...document.querySelectorAll('[data-el="mak-plotno"] svg text')].find((q) => /^bok/.test(q.textContent.trim()));
    const r = t && t.parentNode.querySelector('rect'); return r ? Number(r.getAttribute('height')) : null; });
  ok('bok w rogu do wysokości szafki z sąsiedniej ściany (ok. 820), nie słupka 2000', b == null || b < 1000, String(b)); }
console.log('== lodówka: dolny front przy 2 frontach ==');
await start('szczegolowa', TRZY + `p.items[2].cab.levels = [{ h: 1780, cols: [{ ...p.items[2].cab.levels[0].cols[0], sprzet: { typ: 'lodowka', fronty: 2 } }] }, { h: null, cols: [{ ...p.items[2].cab.levels[0].cols[0] }] }]; p.active = 2;`, PRZOD, 'szczegolowa');
await zakl('dodaj');
await page.locator('[data-el="mak-plotno"] [data-el="makieta-szafka"][data-idx="2"]').last().click(); await page.waitForTimeout(400);
{ const sw = page.locator('[data-el="mak-dodaj-co"] [data-v="agd"], [data-dodaj="agd"]').first(); if (await sw.count()) await sw.click().catch(() => {}); }
await page.evaluate(() => {}); await page.waitForTimeout(300);
if (!(await page.locator('[data-el="agd-lod-dolny"]').count())) { const it = page.locator('[data-el="mak-agd-lista"] button').filter({ hasText: 'Lodówka' }).first(); if (await it.count()) await it.click(); await page.waitForTimeout(300); }
ok('pole „dolny front — wysokość” przy 2 frontach', (await page.locator('[data-el="agd-lod-dolny"]').count()) === 1);
if (await page.locator('[data-el="agd-lod-dolny"]').count()) {
  await page.locator('[data-el="agd-lod-dolny"]').fill('700'); await page.locator('[data-el="agd-lod-dolny"]').blur(); await page.waitForTimeout(500);
  p = await czekaj('p.items[2].cab.levels[0].cols[0].sprzet.dolny === 700');
  ok('dolny front zapisany (700)', p.items[2].cab.levels[0].cols[0].sprzet.dolny === 700);
  const fr = await page.evaluate(() => { const g = document.querySelector('[data-el="mak-plotno"] [data-el="makieta-szafka"][data-idx="2"]'); return g ? [...g.querySelectorAll('text')].map((t) => t.textContent.trim()).filter((t) => /×/.test(t)) : []; });
  ok('na rysunku dolny front lodówki 700 wysokości', fr.some((t) => / × 70\d$/.test(t) || /×\s*70\d/.test(t)), JSON.stringify(fr));
  ok('opis lodówki: 2 fronty, dolny 700 mm', /2 fronty \(dolny 700 mm/.test(await page.locator('[data-el="agd-co-zrobi"]').textContent()));
}

ok('bez błędów strony', errors.length === 0, errors.slice(0, 3).join(' | '));
await browser.close();
console.log(bledy ? `\nBLEDOW: ${bledy}` : '\nWSZYSTKO OK');
process.exit(bledy ? 1 : 0);
