// Makieta — runda 4 wyrownania z makieta „Dodaj” (2026-11-13): karty AGD (wymiary modelu na blacie i lodowki, wystaje przed blat,
// przesun w ciagu, kaseta pod blatem, okap szerszy niz szafka), kontrole blatu (dwa wyciecia blisko, przy przedniej krawedzi), karta Szafka.
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
const URL = STD ? 'http://127.0.0.1:5199/standalone-local.html' : `http://127.0.0.1:5205/${process.env.APP || 'mebloprojekt-app.html'}`;
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
const PRZOD = { zgory: true, gorny: true, dolny: true, fronty: true, kolory: true, wymiary: true };
const uw = page.locator('[data-el="makieta-uwagi"]');
const uwagi = async () => (await uw.innerText().catch(() => '')).replace(/\s+/g, ' ');
let p;
// kuchnia: plyta na szafce 1, zlew na szafce 2, mikrofala na blacie szafki 2, zmywarka i lodowka wolnostojaca w ciagu, gorne z okapem
const KUCH = (dop = '') => CIAG + `p.items[0].cab.blatWyciecia = [{ typ: 'plyta', rozm: '60' }]; p.items[1].cab.blatWyciecia = [{ typ: 'zlew', rozm: '1' }]; p.items[1].cab.naBlacie = [{ typ: 'mikrofala' }];
  const z = JSON.parse(JSON.stringify(p.items[1])); z.cab = { ...z.cab, name: 'Zmywarka', W: 600, blatWyciecia: [], naBlacie: [], sprzetCiagu: { typ: 'zmywarka' } }; p.items.push(z);
  const l = JSON.parse(JSON.stringify(p.items[1])); l.cab = { ...l.cab, name: 'Lodówka', W: 700, H: 2000, blatWyciecia: [], naBlacie: [], sprzetCiagu: { typ: 'lodowka' } }; p.items.push(l);
  p.runs.push({ id: 'g1', name: 'Ściana 1 — góra', roomId: p.runs[0].roomId, tier: 'gorny', wall: 'r1' });
  [0, 1].forEach((k) => { const g = JSON.parse(JSON.stringify(p.items[1])); g.cab.name = 'Górna ' + (k + 1); g.cab.H = 720; g.cab.D = 320; g.cab.blatWyciecia = []; g.cab.naBlacie = [];
    g.cab.levels = [{ h: null, cols: [{ kind: 'doors', doors: 1, w: null, shelfTargets: [null] }] }];
    g.cab.legs = { ...(g.cab.legs || {}), on: false }; g.cab.plinth = { ...(g.cab.plinth || {}), on: false };
    if (k === 0) g.cab.okap = { typ: 'podszafkowy' }; g.runId = 'g1'; p.items.push(g); }); ${dop}`;
const agd = async (re) => {
  await zakl('dodaj');
  { const a = page.locator('[data-el="mak-dodaj"] [data-dodaj="agd"]'); if ((await a.getAttribute('aria-expanded').catch(() => 'true')) !== 'true') await a.click().catch(() => {}); await page.waitForTimeout(300); }
  const poz = page.locator('[data-el="mak-agd-lista"] [data-el="mak-agd-wybierz"]').filter({ hasText: re }).first(); await poz.click(); await page.waitForTimeout(400);
};
const agdKarta = () => page.locator('[data-el="mak-paleta"]');
const wpisz = async (sel, v) => { const f = page.locator(sel).first(); await f.fill(String(v)); await f.press('Enter'); await page.waitForTimeout(400); };

console.log('== karty AGD jak w makiecie (runda 4) ==');
await start('prosta', KUCH(), PRZOD);
await agd(/Mikrofala wolnostojąca/);
ok('mikrofala na blacie: pola „szer. × głęb.” i „wysokość” z karty modelu', await page.locator('[data-el="agd-nb-w"]').count() === 1 && await page.locator('[data-el="agd-nb-d"]').count() === 1 && await page.locator('[data-el="agd-nb-h"]').count() === 1);
await wpisz('[data-el="agd-nb-d"]', 600);
p = await czekaj('p.items[1].cab.naBlacie[0].d === 600');
ok('wpisana głębokość 600 — zapisana', p.items[1].cab.naBlacie[0].d === 600);
{ const t = await page.locator('[data-el="agd-nb-wystaje"]').innerText().catch(() => '');
  ok('„Głęboka: 600 mm + 40 od ściany — wystaje N mm przed blat”', /Głęboka: 600 mm \+ 40 od ściany — wystaje \d+ mm przed blat/.test(t), t); }
await page.locator('[data-el="agd-typowe"]').click(); await page.waitForTimeout(400);
p = await czekaj('p.items[1].cab.naBlacie[0].d == null');
ok('„Wróć do typowych” — bez własnych wymiarów', p.items[1].cab.naBlacie[0].d == null);
await agd(/Lodówka wolnostojąca/);
await wpisz('[data-el="agd-lod-w"]', 650);
p = await czekaj('p.items.some((x) => x.cab.sprzetCiagu && x.cab.sprzetCiagu.lodW === 650)');
{ const L = p.items.find((x) => x.cab.sprzetCiagu && x.cab.sprzetCiagu.typ === 'lodowka');
  ok('lodówka wolnostojąca: szerokość 650 w karcie — miejsce w ciągu 50 + 650 + 50 = 750', L.cab.sprzetCiagu.lodW === 650 && L.cab.W === 750, `${L.cab.sprzetCiagu.lodW} / ${L.cab.W}`); }
ok('lodówka wolnostojąca: pola głębokości i wysokości', await page.locator('[data-el="agd-lod-d"]').count() === 1 && await page.locator('[data-el="agd-lod-h"]').count() === 1);
await agd(/Zmywarka/);
ok('zmywarka (pozycja ciągu): „Przesuń w ciągu”', await page.locator('[data-el="agd-przesun"][data-v="ciag"]').count() === 1);
await page.locator('[data-el="agd-przesun"][data-v="ciag"]').click(); await page.waitForTimeout(400);
ok('po kliknięciu — pasek „Przesuwasz: Zmywarka — dotknij zieloną ramkę”', /Przesuwasz: Zmywarka/.test(await page.locator('[data-el="mak-przesun-pasek"]').innerText().catch(() => '')));
await page.locator('[data-el="mak-przesun-anuluj"]').click().catch(() => {}); await page.waitForTimeout(200);
await agd(/Płyta/);
{ const t = await page.locator('[data-el="agd-pod-blatem"]').innerText().catch(() => '');
  ok('płyta: „Kaseta schodzi N mm od wierzchu blatu — M mm pod blat 38 mm”', /Kaseta schodzi \d+ mm od wierzchu blatu — \d+ mm pod blat \d+ mm/.test(t), t); }
await agd(/Okap/);
await page.locator('[data-el="agd-rozm-v"][data-v="90"]').click(); await page.waitForTimeout(400);
p = await czekaj('p.items.some((x) => x.cab.okap && x.cab.okap.rozm === "90")');
ok('okap 90 w szafce 600: „Okap 900 mm jest szerszy niż szafka 600 mm”', /Okap 900 mm jest szerszy niż szafka 600 mm/.test(await page.locator('[data-el="agd-okap-szerszy"]').innerText().catch(() => '')));
await zakl('szafka');
ok('uwagi: „… szerszy niż szafka „Górna 1” (600 mm)”', /szerszy niż szafka „Górna 1” \(600 mm\)/.test(await uwagi()), (await uwagi()).slice(0, 300));
ok('karta szafki górnej z okapem: „Pod szafką okap … przesuwa się razem z dnem szafki”', /przesuwa się razem z dnem szafki/.test(await karta('[data-el="mak-sz-okap-pod"]').innerText().catch(() => '')));

console.log('== blat: dwa wycięcia blisko siebie, wycięcie przy przedniej krawędzi ==');
await start('prosta', KUCH(`p.items[0].cab.blatWyciecia = [{ typ: 'plyta', rozm: '60', przesun: 120 }]; p.items[1].cab.blatWyciecia = [{ typ: 'zlew', rozm: '1', przesun: -120, odPrzodu: 20 }]; p.active = 1;`), PRZOD);
await zakl('szafka');
{ const t = await uwagi();
  ok('uwagi: wycięcie płyty nachodzi na wycięcie pod zlew', /płyta nad szafką „Szafka 1”: wycięcie nachodzi na wycięcie pod zlew nad „Szafka 2” \(\d+ mm\)/.test(t), t.slice(0, 400));
  ok('uwagi: zlew — do przedniej krawędzi blatu tylko 20 mm', /do przedniej krawędzi blatu tylko 20 mm — zostaw co najmniej 30–50 mm płyty/.test(t)); }
await start('prosta', KUCH(`p.items[0].cab.blatWyciecia = [{ typ: 'plyta', rozm: '60' }]; p.items[1].cab.blatWyciecia = [{ typ: 'zlew', rozm: '1', przesun: -40 }]; p.active = 1;`), PRZOD);
await zakl('szafka');
ok('uwagi: między wycięciami tylko N mm płyty (co najmniej 50)', /między nim a wycięciem pod zlew nad „Szafka 2” tylko \d+ mm płyty \(co najmniej 50\)/.test(await uwagi()), (await uwagi()).slice(0, 300));

console.log('== karta Szafka: sprzęt w słupku po nazwie, pozycja ciągu, okap kominowy ==');
await start('prosta', KUCH(`const s = JSON.parse(JSON.stringify(p.items[1])); s.cab.name = 'Słupek'; s.cab.H = 2000; s.cab.slupek = true; s.cab.blatWyciecia = []; s.cab.naBlacie = [];
  s.cab.levels = [{ h: 590, cols: [{ kind: 'doors', doors: 0, w: null, shelfTargets: [null], sprzet: { typ: 'piekarnik' } }] }]; p.items.splice(2, 0, s); p.active = 2;`), PRZOD);
await zakl('szafka');
ok('słupek z piekarnikiem: „W szafce stoi sprzęt (piekarnik)”', /W szafce stoi sprzęt \(piekarnik\)/.test(await karta('[data-el="mak-sz-sprzet"]').innerText().catch(() => '')),
  await karta('[data-el="mak-sz-sprzet"]').innerText().catch(() => 'brak'));
await start('prosta', KUCH(`p.active = 2;`), PRZOD);
await zakl('szafka');
ok('zmywarka w karcie Szafka: „W ciągu, bez korpusu … Dodaj → AGD”', /W ciągu, bez korpusu: zmywarka do zabudowy — rodzaj, model i luzy zmienisz w karcie sprzętu: Dodaj → AGD/.test(await karta('[data-el="mak-sz-sprzet-ciagu"]').innerText().catch(() => '')),
  await karta('[data-el="mak-sz-sprzet-ciagu"]').innerText().catch(() => 'brak'));

ok('bez błędów strony', errors.length === 0, errors.slice(0, 3).join(' | '));
await browser.close();
console.log(bledy ? `\nBLEDOW: ${bledy}` : '\nWSZYSTKO OK');
process.exit(bledy ? 1 : 0);
