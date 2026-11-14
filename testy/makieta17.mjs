// Makieta — lodowka podblatowa w szafce (uzytkownik 2026-11-14: „w szafce czyli mniejsza lodówka np. na wino … potrzebuje dna,
// boków — jakbyśmy wpakowali mikrofalę na dół”): szafka dolna z dnem, lodowka z wlasnymi drzwiami na dnie, nad nia otwarta wneka,
// wentylacja; „w ciągu” jak zmywarka. Zielone ramki przy przeciaganiu w widoku „Z góry” w miejscu szafek (legenda nie przesuwa rysunku).
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
const start = async (zmien) => {
  await page.goto(URL, { waitUntil: 'networkidle' });
  await page.evaluate(() => { try { localStorage.clear(); } catch (e) {} });
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForFunction(() => !!localStorage.getItem('szafki:projekt'), null, { timeout: 10000 });
  await page.evaluate((src) => {
    const p = JSON.parse(localStorage.getItem('szafki:projekt'));
    if (src) new Function('p', src)(p);
    localStorage.setItem('szafki:projekt', JSON.stringify(p));
    localStorage.setItem('mp-tryb', 'prosta');
    localStorage.setItem('mp-mak-zoom', JSON.stringify({ pow: false, z: 1 }));
    localStorage.setItem('mp-mak-przel', JSON.stringify({ zgory: true, gorny: true, dolny: true, fronty: true, kolory: true, wymiary: true }));
  }, zmien || '');
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(1200);
};
const proj = () => page.evaluate(() => JSON.parse(localStorage.getItem('szafki:projekt')));
const czekaj = async (f) => { await page.waitForFunction((src) => { const p = JSON.parse(localStorage.getItem('szafki:projekt')); try { return new Function('p', 'return ' + src)(p); } catch (e) { return false; } }, f, { timeout: 5000 }).catch(() => {}); return proj(); };
const zakl = async (k) => { const b = page.locator(`[data-el="makieta"] nav [data-zakl="${k}"]`);
  if ((await b.getAttribute('aria-pressed')) !== 'true' || !(await page.locator('[data-el="mak-karta-panel"]').count())) await b.click(); await page.waitForTimeout(300); };
const karta = page.locator('[data-el="makieta-karta-agd"]');
const uwagi = async () => (await page.locator('[data-el="makieta-uwagi"]').innerText().catch(() => '')).replace(/\s+/g, ' ');
const agd = async (re) => {
  await zakl('dodaj');
  { const a = page.locator('[data-el="mak-dodaj"] [data-dodaj="agd"]'); if ((await a.getAttribute('aria-expanded').catch(() => 'true')) !== 'true') await a.click().catch(() => {}); await page.waitForTimeout(300); }
  await page.locator('[data-el="mak-agd-lista"] [data-el="mak-agd-wybierz"]').filter({ hasText: re }).first().click(); await page.waitForTimeout(400);
};
// ciag kuchenny z blatem (szafki na nozkach 100 + korpus 720 = 820 do spodu blatu), na koncu lodowka wolnostojaca
const KUCH = `const w = p.items[0];
  p.runs = [{ id: 'r1', name: 'Ściana 1', roomId: w.roomId || 'p1', worktop: true }];
  p.items = [0, 1].map((i) => { const it = JSON.parse(JSON.stringify(w)); it.cab.name = 'Szafka ' + (i + 1); it.cab.W = 600; it.cab.levels = [{ h: null, cols: [{ ...it.cab.levels[0].cols[0], doors: 1, w: null }] }]; it.runId = 'r1'; return it; });
  const l = JSON.parse(JSON.stringify(p.items[1])); l.cab = { ...l.cab, name: 'Lodówka', W: 700, H: 1850, sprzetCiagu: { typ: 'lodowka' } }; p.items.push(l);
  p.active = 0;`;
let p;
const wpiszK = async (el, v) => { const f = karta.locator(`[data-el="${el}"]`).first(); await f.fill(String(v)); await f.press('Enter'); await page.waitForTimeout(400); };

console.log('== podblatowa w szafce (mniejsza, np. na wino — na dnie szafki, jak mikrofala na dole) ==');
await start(KUCH);
await agd(/Lodówka wolnostojąca/);
ok('„Rodzaj lodówki”: 5 rodzajów, w tym „podblatowa w szafce” i „podblatowa w ciągu”', (await karta.locator('[data-el="agd-lod-rodz-v"]').count()) === 5
  && (await karta.locator('[data-el="agd-lod-rodz-v"][data-v="szafka"]').count()) === 1 && (await karta.locator('[data-el="agd-lod-rodz-v"][data-v="ciag"]').count()) === 1
  && (await karta.locator('[data-el="agd-lod-rodz-v"][data-v="mala"]').count()) === 0);
await karta.locator('[data-el="agd-lod-rodz-v"][data-v="szafka"]').click();
p = await czekaj('p.items.some((it) => it.cab.levels && it.cab.levels[0].cols[0].sprzet && it.cab.levels[0].cols[0].sprzet.montaz === "brak" && it.cab.H < 1500)');
{ const L = p.items.find((it) => it.cab.levels && it.cab.levels[0].cols[0].sprzet && it.cab.H < 1500), c = L && L.cab, s = c && c.levels[0].cols[0].sprzet;
  ok('szafka dolna z lodówką na dnie (własne drzwi), nad nią płyta i otwarta wnęka; zastąpiła wolnostojącą', !!c && s.typ === 'lodowka' && s.montaz === 'brak' && c.levels.length === 2
    && c.levels[1].cols[0].kind === 'doors' && !c.levels[1].cols[0].doors && p.items.length === 3 && !p.items.some((it) => it.cab.sprzetCiagu) && /^Lodówka/.test(c.name), c && JSON.stringify(c.levels.map((l) => l.h)));
  ok('wymiary przykładowe 440 × 520 × 450, poziom 540 (z luzem 20 nad nią), z dnem, na nóżkach jak ciąg', !!s && s.lodW === 440 && s.lodH === 520 && s.lodD === 450 && c.levels[0].h === 540
    && (c.joints || {}).botL !== 'none' && c.legs.on && c.H === 720 && !c.lodowkaPodblat, c && JSON.stringify({ s, j: c.joints, legs: c.legs.on, H: c.H }));
  ok('lodówka równo z licem korpusu (za nią luz na wentylację)', !!s && s.luzTyl === c.D - 3 - s.lodD, s && `${s.luzTyl}`); }
ok('karta: „Lodówka podblatowa w szafce”, rodzaj zaznaczony, 4 wysokości, pola wymiarów, opis wentylacji', /Lodówka podblatowa w szafce/.test(await karta.innerText())
  && (await karta.locator('[data-el="agd-lod-rodz-v"][data-v="szafka"]').getAttribute('aria-pressed')) === 'true'
  && (await karta.locator('[data-el="agd-lod-mala-h-v"]').count()) === 4 && (await karta.locator('[data-el="agd-mala-w"]').count()) === 1
  && /na wino/.test(await karta.locator('[data-el="agd-lod-mala-info"]').innerText().catch(() => '')) && /200 cm²/.test(await karta.locator('[data-el="agd-lod-mala-info"]').innerText().catch(() => '')));
await karta.locator('[data-el="agd-lod-mala-h-v"][data-v="560"]').click();
p = await czekaj('p.items.some((it) => it.cab.levels && it.cab.levels[0].cols[0].sprzet && it.cab.levels[0].cols[0].sprzet.lodH === 560)');
{ const c = p.items.find((it) => it.cab.levels && it.cab.levels[0].cols[0].sprzet && it.cab.levels[0].cols[0].sprzet.lodH === 560);
  ok('wysokość 56 cm: lodówka 560, poziom 580 (płyta nad wnęką idzie za nią)', !!c && c.cab.levels[0].h === 580, c && JSON.stringify(c.cab.levels.map((l) => l.h))); }
await wpiszK('agd-mala-w', 500);
p = await czekaj('p.items.some((it) => it.cab.levels && it.cab.levels[0].cols[0].sprzet && it.cab.levels[0].cols[0].sprzet.lodW === 500)');
ok('szerokość lodówki 500 — zapisana', p.items.some((it) => it.cab.levels && it.cab.levels[0].cols[0].sprzet && it.cab.levels[0].cols[0].sprzet.lodW === 500));
{ const t = await uwagi();
  ok('uwagi: lodówka na dnie szafki — otwory wentylacyjne', /lodówka stoi na dnie szafki — zostaw otwory wentylacyjne/.test(t), t.slice(0, 300));
  ok('bez błędów wnęki lodówki i szuflad, bez „nie ma wieńca ani wzmocnienia”', !/wnęka na lodówkę ma/.test(t) && !/skrzynka z bokiem/.test(t) && !/nie ma wieńca ani wzmocnienia/.test(t), t.slice(0, 300)); }
ok('rysunek: lodówka w szafce', (await page.locator('[data-el="makieta"] [data-el="sprzet-front"]').count()) >= 1);
{ const zrzut = process.env.ZRZUT; if (zrzut) await page.locator('[data-el="makieta"]').screenshot({ path: zrzut + '/lod_szafka.png' }); }
await karta.locator('[data-el="agd-lod-rodz-v"][data-v="ciag"]').click();
p = await czekaj('p.items.some((it) => it.cab.sprzetCiagu && it.cab.sprzetCiagu.typ === "lodowkaP")');
ok('w szafce → podblatowa w ciągu (jak zmywarka): zastąpiona, tyle samo pozycji', p.items.length === 3 && p.items.some((it) => it.cab.sprzetCiagu && it.cab.sprzetCiagu.typ === 'lodowkaP')
  && !p.items.some((it) => it.cab.levels && it.cab.levels[0].cols[0] && it.cab.levels[0].cols[0].sprzet));

console.log('== zielone ramki w widoku „Z góry” trafiają w szafki (zgłoszenie 2026-11-14) ==');
await start(KUCH.replace("p.items.push(l);", "") + `p.items[0].cab.blatWyciecia = [{ typ: 'plyta', rozm: '60' }];`);
await page.evaluate(() => localStorage.setItem('mp-mak-widok', 'gora')); await page.reload({ waitUntil: 'networkidle' }); await page.waitForTimeout(1300);
{ const gora = (sel) => page.locator(`[data-el="mak-widok-inny"][data-widok="gora"] ${sel}`);
  const z = await gora('[data-el="wyciecie-blatu"]').first().boundingBox();
  await page.mouse.move(z.x + z.width / 2, z.y + z.height / 2); await page.mouse.down();
  for (let i = 1; i <= 6; i++) await page.mouse.move(z.x + z.width / 2 + i * 15, z.y + z.height / 2);
  await page.waitForTimeout(300);
  const r = await page.locator('[data-el="mak-ramka"][data-idx="1"]').first().boundingBox();
  const c = await gora('[data-el="makieta-szafka"][data-idx="1"]').first().boundingBox();
  const leg = await page.locator('[data-el="mak-legenda"]').innerText().catch(() => '');
  ok('w trakcie: legenda „tu może stanąć…”', /tu może stanąć/.test(leg));
  ok('ramka „Szafka 2” w miejscu szafki na rysunku (±6 px w pionie i poziomie)', !!r && !!c && Math.abs(r.y - c.y) <= 6 && Math.abs(r.x - c.x) <= 6 && Math.abs(r.height - c.height) <= 12,
    r && c ? `ramka y ${Math.round(r.y)} h ${Math.round(r.height)}, szafka y ${Math.round(c.y)} h ${Math.round(c.height)}` : 'brak');
  await page.keyboard.press('Escape'); await page.mouse.up(); await page.waitForTimeout(300); }

console.log('== nowa szafka wisząca za słupkiem; ciąg górny: od lewej / od prawej / przy słupku; lista „Ciąg” = ściany (2026-11-14) ==');
const SLUP = KUCH.replace("p.items.push(l);", "") + `const s0 = JSON.parse(JSON.stringify(p.items[0])); s0.cab = { ...s0.cab, name: 'Słupek', H: 2000, slupek: true }; p.items.unshift(s0);
  p.items.forEach((it) => { it.cab.blatWyciecia = []; }); p.items[2].cab.levels = [{ h: null, cols: [{ ...p.items[2].cab.levels[0].cols[0], kind: 'drawers', drawers: [{ h: 'auto', front: null, handle: true }, { h: 'auto', front: null, handle: true }, { h: 'auto', front: null, handle: true }] }] }];
  const z = JSON.parse(JSON.stringify(p.items[1])); z.cab = { ...z.cab, name: 'Zmywarka', sprzetCiagu: { typ: 'zmywarka' } }; p.items.push(z); p.active = 1;`;
await start(SLUP);
await zakl('dodaj');
{ const a = page.locator('[data-el="mak-dodaj"] [data-dodaj="szafki"]'); if ((await a.getAttribute('aria-expanded').catch(() => 'true')) !== 'true') await a.click().catch(() => {}); await page.waitForTimeout(300); }
{ const n = page.locator('[data-el="mak-grupa"][data-grupa="Kuchnia — góra"] [data-el="mak-grupa-nagl"]'); if ((await n.getAttribute('aria-expanded').catch(() => 'true')) === 'false') { await n.click(); await page.waitForTimeout(200); } }
await page.locator('[data-el="mak-paleta"] [data-el="mak-wzor"][data-id="wiszaca"]').click(); await page.locator('[data-el="mak-wybrany-teraz"]').click();
p = await czekaj('(p.runs || []).some((r) => r.tier === "gorny") && p.items.some((it) => (p.runs.find((r) => r.id === it.runId) || {}).tier === "gorny")');
{ const g = (p.runs || []).find((r) => r.tier === 'gorny');
  ok('nowy ciąg górny zaczyna się za słupkiem (od lewej 600)', !!g && g.offset === 600 && g.offsetFrom === 'left', g && JSON.stringify({ off: g.offset, od: g.offsetFrom })); }
{ const t = await uwagi(); ok('bez błędu „szafki górne … wchodzą w nią”', !/wchodzą w nią o/.test(t), t.slice(0, 200)); }
await zakl('szafka');
ok('karta górnej: „ciąg górny wzdłuż ściany” — od lewej / od prawej, mm, przy słupku', (await page.locator('[data-el="mak-gorny-od"]').count()) === 2
  && (await page.locator('[data-el="mak-gorny-offset"]').count()) === 1 && (await page.locator('[data-el="mak-gorny-przy-slupku"]').count()) === 1
  && (await page.locator('[data-el="mak-gorny-przy-slupku"]').getAttribute('aria-pressed').catch(() => null)) !== 'false');
{ const f = page.locator('[data-el="mak-gorny-offset"]'); await f.fill('900'); await f.press('Enter'); await page.waitForTimeout(400); }
p = await czekaj('p.runs.find((r) => r.tier === "gorny").offset === 900');
ok('wpisane 900 — ciąg górny od lewej 900', p.runs.find((r) => r.tier === 'gorny').offset === 900);
await page.locator('[data-el="mak-gorny-od"][data-v="right"]').click();
p = await czekaj('p.runs.find((r) => r.tier === "gorny").offsetFrom === "right"');
ok('„od prawej” — liczone od prawej', p.runs.find((r) => r.tier === 'gorny').offsetFrom === 'right');
await page.locator('[data-el="mak-gorny-przy-slupku"]').click();
p = await czekaj('p.runs.find((r) => r.tier === "gorny").offset === 600 && p.runs.find((r) => r.tier === "gorny").offsetFrom === "left"');
ok('„przy słupku” — znów od lewej 600', p.runs.find((r) => r.tier === 'gorny').offset === 600 && p.runs.find((r) => r.tier === 'gorny').offsetFrom === 'left');
// stary ciag gorny od 0 nad slupkiem — blad z przyciskiem „Ciąg górny od 600 mm — za „Słupek””
await page.evaluate(() => { const p = JSON.parse(localStorage.getItem('szafki:projekt')); p.runs.find((r) => r.tier === 'gorny').offset = 0; localStorage.setItem('szafki:projekt', JSON.stringify(p)); });
await page.reload({ waitUntil: 'networkidle' }); await page.waitForTimeout(1200);
{ const b = page.locator('[data-el="makieta-uwagi"] button', { hasText: /Ciąg górny od 600 mm — za „Słupek”/ });
  ok('ciąg górny nad słupkiem: błąd z przyciskiem „Ciąg górny od 600 mm — za „Słupek””', (await b.count()) === 1);
  if (await b.count()) { await b.first().click(); await page.waitForTimeout(500); } }
p = await czekaj('p.runs.find((r) => r.tier === "gorny").offset === 600');
ok('po kliknięciu: ciąg górny od 600, bez błędu', p.runs.find((r) => r.tier === 'gorny').offset === 600 && !/wchodzą w nią o/.test(await uwagi()));
// lista „Ciąg”: same sciany, gorne w opisie
await page.locator('[data-el="mak-ciag"] button').first().click(); await page.waitForTimeout(200);
{ const g = p.runs.find((r) => r.tier === 'gorny');
  ok('lista „Ciąg”: bez osobnego ciągu górnego, przy ścianie „+ 1 górna”', (await page.locator(`[data-el="mak-ciag"] [data-v="${g.id}"]`).count()) === 0
    && /\+ 1 górna/.test(await page.locator('[data-el="mak-ciag"] [data-v="r1"]').innerText().catch(() => ''))); }
await page.locator('[data-el="mak-ciag"] [data-v="r1"]').click(); await page.waitForTimeout(500);
ok('wybrana ściana: rysunek z szafką górną', (await page.locator('[data-el="makieta"] [data-el="makieta-szafka"]').count()) >= 5);

console.log('== zmywarka: uchwyt, otwieranie klapą w dół; Półki — szuflady zamknięte (2026-11-14) ==');
ok('zmywarka: uchwyt na froncie (rysunek)', (await page.locator('[data-el="makieta"] [data-el="uchwyt-sprzetu"]').count()) >= 1);
await page.evaluate(() => { localStorage.setItem('mp-mak-widok', 'iso'); }); await page.reload({ waitUntil: 'networkidle' }); await page.waitForTimeout(1300);
await page.evaluate(() => { window.__audytBryl = []; });
await zakl('polki'); await page.waitForTimeout(800);
{ const A = await page.evaluate(() => window.__audytBryl || []);
  const fz = A.filter((b) => b.tag === 'front-zmywarki').slice(-1)[0];
  ok('Półki (wnętrze otwarte): front zmywarki opada klapą w dół (leży przed szafką)', !!fz && fz.p && (fz.p[5] - fz.p[2]) > 400, fz && JSON.stringify(fz.p));
  const uz = A.filter((b) => b.tag === 'uchwyt').length;
  ok('3D: uchwyty są (w tym zmywarki)', uz >= 4, String(uz)); }
{ const zrzut = process.env.ZRZUT; if (zrzut) await page.locator('[data-el="mak-plotno"]').screenshot({ path: zrzut + '/polki_iso.png' }); }
{ const n1 = await page.evaluate(() => (window.__audytBryl || []).length);
  // „otwarte” wybrane recznie (zakladka Szafka): szuflady wysuwaja sie — dochodza bryly skrzynek
  await page.evaluate(() => { const q = JSON.parse(localStorage.getItem('mp-mak-przel') || '{}'); q.fronty = false; localStorage.setItem('mp-mak-przel', JSON.stringify(q)); });
  await page.reload({ waitUntil: 'networkidle' }); await page.waitForTimeout(1300);
  await page.evaluate(() => { window.__audytBryl = []; }); await zakl('szuflady'); await page.waitForTimeout(800);
  const n2 = await page.evaluate(() => (window.__audytBryl || []).length);
  ok('Półki: szuflady zamknięte — przy ręcznym „otwarte” wysuwają się (więcej brył: skrzynki)', n2 >= n1 + 9, `${n1} → ${n2}`); }

ok('bez błędów strony', errors.length === 0, errors.join(' | '));
await browser.close();
console.log(bledy ? `BLEDOW: ${bledy}` : 'WSZYSTKO OK');
process.exit(bledy ? 1 : 0);
