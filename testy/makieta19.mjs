// Makieta — szafa do zabudowy z drzwiami przesuwnymi GTV NOVO S (uzytkownik 2026-11-16: „robimy drzwi przesuwne w szafach i dojdzie
// nowy szablon w szafie do zabudowy”; „sama szafa może być do sufitu z luzem min. 5 mm”): wzór z palety (nowy ciąg, 2000 mm, przesuwne,
// cokół), sufit ściany — podpowiedź „do sufitu”, błąd za wysokiej, przycisk; karta Drzwi (przesuwne / na zawiasach, skrzydła, szczotka);
// rysunek z przodu (tory, skrzydła), z góry, 3D, karta techniczna.
import pw from './pw.mjs';
const { chromium } = pw;
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const page = await (await browser.newContext({ viewport: { width: 1500, height: 1000 } })).newPage();
const errors = [];
page.on('pageerror', (e) => errors.push('[pageerror] ' + e.message));
page.on('console', (m) => { if (m.type() === 'error' && !/favicon|404|\[BABEL\] Note/.test(m.text())) errors.push('[console] ' + m.text()); });
let bledy = 0;
const ok = (l, c, e = '') => { if (!c) bledy++; console.log((c ? '  OK   ' : '  BLAD ') + l + (e ? ' — ' + e : '')); };
const STD = !!process.env.STD;
const URL = STD ? 'http://127.0.0.1:5199/standalone-local.html' : `http://127.0.0.1:5205/${process.env.APP || 'mebloprojekt-app.html'}`;
// szafka startowa wolnostojąca (bez ciągu) — wzór z palety zakłada nowy ciąg „szafa”
const FIX = `const w = p.items[0]; w.runId = null; w.cab.name = 'Komoda'; p.runs = []; p.items = [w]; p.active = 0;`;
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
    localStorage.setItem('mp-mak-przel', JSON.stringify({ zgory: true, gorny: true, dolny: true, fronty: true, kolory: true, wymiary: false }));
  }, zmien || '');
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(1200);
};
const proj = () => page.evaluate(() => JSON.parse(localStorage.getItem('szafki:projekt')));
const czekaj = async (f) => { await page.waitForFunction((src) => { const p = JSON.parse(localStorage.getItem('szafki:projekt')); try { return new Function('p', 'return ' + src)(p); } catch (e) { return false; } }, f, { timeout: 5000 }).catch(() => {}); return proj(); };
const zakl = async (k) => { const b = page.locator(`[data-el="makieta"] nav [data-zakl="${k}"]`);
  if ((await b.getAttribute('aria-pressed')) !== 'true' || !(await page.locator('[data-el="mak-karta-panel"]').count())) await b.click(); await page.waitForTimeout(300); };
const uwagi = async () => (await page.locator('[data-el="makieta-uwagi"]').innerText().catch(() => '')).replace(/\s+/g, ' ');
const ust = async (src) => { await page.evaluate((src) => { const p = JSON.parse(localStorage.getItem('szafki:projekt')); new Function('p', src)(p); localStorage.setItem('szafki:projekt', JSON.stringify(p)); }, src);
  await page.reload({ waitUntil: 'networkidle' }); await page.waitForTimeout(1000); };
const szafa = (p) => p.items.find((it) => it.cab.name === 'Szafa');

console.log('== wzór „Szafa do zabudowy” z palety ==');
await start(FIX);
await zakl('dodaj'); { const sek = page.locator('[data-el="mak-dodaj"] [data-dodaj="szafki"]'); if ((await sek.getAttribute('aria-expanded')) !== 'true') await sek.click(); await page.waitForTimeout(200); }
const wz = page.locator('[data-el="mak-paleta"] [data-el="mak-wzor"][data-id="szafaZab"]');
ok('paleta „Szafa w zabudowie”: „Szafa do zabudowy” (drzwi przesuwne, do sufitu)', (await wz.count()) === 1 && /Szafa do zabudowy/.test(await wz.innerText()) && /przesuwne/.test(await wz.innerText()));
await wz.click(); await page.locator('[data-el="mak-wybrany-teraz"]').click();
let p = await czekaj("p.items.some((it) => it.cab.name === 'Szafa')");
let s = szafa(p), run = s && p.runs.find((r) => r.id === s.runId);
ok('dodana w nowym ciągu „szafa”: 2000 × 2400 × 600, drzwi przesuwne, podwójne boki, cokół 100 w obrysie', !!s && !!run && run.zabudowa === 'szafa' && s.cab.W === 2000 && s.cab.H === 2400 && s.cab.D === 600
  && s.cab.przesuwne && s.cab.przesuwne.on && s.cab.przesuwne.podwBoki && s.cab.przesuwne.podwBoki.L && s.cab.przesuwne.podwBoki.R && s.cab.plinth.on && s.cab.plinth.height === 100 && s.cab.plinth.mode === 'inbody',
  s && JSON.stringify({ W: s.cab.W, H: s.cab.H, D: s.cab.D, pr: s.cab.przesuwne, pl: s.cab.plinth, z: run && run.zabudowa }));
ok('bez nóżek — boki do podłogi, cokół między nimi', !(s.cab.legs && s.cab.legs.on), JSON.stringify(s.cab.legs));
ok('wnętrze: przegroda — półki | drążek z półką nad nim; bez blendy', s.cab.levels[0].cols.length === 2 && (s.cab.levels[0].cols[1].drazki || []).length === 1 && !(s.cab.topFiller || {}).on);
ok('Uwagi: „podaj wysokość ściany” (sufit nieznany)', /podaj wysokość ściany/.test(await uwagi()), (await uwagi()).slice(0, 200));
ok('rysunek z przodu: tor górny, tor dolny, 2 skrzydła', (await page.locator('[data-el="makieta"] [data-el="tor-gorny"]').count()) >= 1 && (await page.locator('[data-el="makieta"] [data-el="tor-dolny"]').count()) >= 1
  && (await page.locator('[data-el="makieta"] [data-el="skrzydlo-przesuwne"]').count()) === 2);
ok('rysunek z góry: skrzydła w strefie toru', (await page.locator('[data-el="przesuwne-z-gory"]').count()) >= 1);

console.log('== sufit: do sufitu z luzem 5 mm ==');
{ const f = page.locator('[data-el="mak-sciana-wys"]').first(); await f.fill('2600'); await f.press('Tab'); await page.waitForTimeout(600); }
p = await czekaj("p.runs.some((r) => r.ceiling === 2600)");
{ const t = await uwagi(); ok('sufit 2600: „zostaje 200 mm do sufitu — może sięgać sufitu” (cokół w obrysie — boki do podłogi)', /zostaje 200 mm do sufitu/.test(t), t.slice(0, 240)); }
{ const b = page.locator('[data-el="makieta-uwagi"] button', { hasText: /Do sufitu z luzem 5 mm/ }).first();
  ok('przycisk „Do sufitu z luzem 5 mm”', (await b.count()) === 1);
  if (await b.count()) await b.click(); }
p = await czekaj("p.items.some((it) => it.cab.name === 'Szafa' && it.cab.H === 2595)");
ok('po kliknięciu: szafa 2595 (2600 − 5; cokół w obrysie)', szafa(p).cab.H === 2595, String(szafa(p).cab.H));
{ const t = await uwagi(); ok('przekątna boku 2663 > sufit 2600 — „skręcaj na stojąco, na miejscu”', /przekątna boku 2 ?663 mm/.test(t) && /na stojąco/.test(t), t.slice(0, 300)); }
await ust("const it = p.items.find((x) => x.cab.name === 'Szafa'); it.cab.H = 2660; p.active = p.items.indexOf(it);");
{ const t = await uwagi(); ok('H 2660: błąd „nie zmieści się o 60 mm”', /nie zmieści się o 60 mm/.test(t), t.slice(0, 240)); }
await page.locator('[data-el="makieta-uwagi"] button', { hasText: /Do sufitu z luzem 5 mm/ }).first().click().catch(() => {});
p = await czekaj("p.items.some((it) => it.cab.name === 'Szafa' && it.cab.H === 2595)");
ok('przycisk z błędu — z powrotem 2595', szafa(p).cab.H === 2595, String(szafa(p).cab.H));
await ust("const it = p.items.find((x) => x.cab.name === 'Szafa'); it.cab.H = 2400; it.cab.D = 800; it.cab.legs = { ...it.cab.legs, on: false };");
{ const t = await uwagi(); ok('H 2400, D 800: „przekątna boku 2530 mm” mieści się — bez uwagi o montażu', !/przekątna boku/.test(t), t.slice(0, 300)); }
await ust("const it = p.items.find((x) => x.cab.name === 'Szafa'); it.cab.H = 2590; it.cab.D = 800;");
{ const t = await uwagi(); ok('H 2590, D 800: „przekątna boku 2711 mm … skręcaj na stojąco”', /przekątna boku 2 ?711 mm/.test(t) && /na stojąco/.test(t), t.slice(0, 300)); }
await ust("const it = p.items.find((x) => x.cab.name === 'Szafa'); it.cab.D = 600; it.cab.H = 2595;");

console.log('== karta Drzwi: przesuwne, skrzydła, szczotka ==');
await zakl('drzwi');
ok('karta Drzwi: „na zawiasach / przesuwne”, przesuwne zaznaczone', (await page.locator('[data-el="mak-przesuwne"][data-v="tak"]').getAttribute('aria-pressed')) === 'true');
{ const t = (await page.locator('[data-el="mak-przes-info"]').innerText().catch(() => '')).replace(/\s+/g, ' ');
  ok('opis: 2 skrzydła 997 × … (otwór 1964 × …), cofnięte o 80 mm', /2 skrzydła 997 ×/.test(t) && /otwór 1 ?964 ×/.test(t) && /80 mm/.test(t), t); }
await page.locator('[data-el="mak-przes-n"][data-v="3"]').click();
p = await czekaj("p.items.some((it) => it.cab.name === 'Szafa' && it.cab.przesuwne.n === 3)");
ok('„3” — 3 skrzydła (na rysunku też 3)', szafa(p).cab.przesuwne.n === 3 && (await page.locator('[data-el="makieta"] [data-el="skrzydlo-przesuwne"]').count()) === 3);
{ const t = await uwagi(); ok('3 skrzydła a przegroda na środku — podpowiedź o kolumnie pod dwoma skrzydłami', /pod dwoma skrzydłami/.test(t), t.slice(0, 300)); }
await page.locator('[data-el="mak-przes-n"][data-v="auto"]').click();
await page.locator('[data-el="mak-przes-szczotka"][data-v="nie"]').click();
p = await czekaj("p.items.some((it) => it.cab.name === 'Szafa' && it.cab.przesuwne.szczotka === false)");
{ const t = (await page.locator('[data-el="mak-przes-info"]').innerText().catch(() => '')).replace(/\s+/g, ' ');
  ok('bez szczotki: skrzydło 999 (auto, 2 skrzydła)', szafa(p).cab.przesuwne.n == null && /2 skrzydła 999 ×/.test(t), t); }
ok('karta Drzwi: „podwójny bok” z lewej i z prawej — włączone (szablon)', (await page.locator('[data-el="mak-przes-podw"][data-v="L"]').getAttribute('aria-pressed')) === 'true'
  && (await page.locator('[data-el="mak-przes-podw"][data-v="R"]').getAttribute('aria-pressed')) === 'true');
await page.locator('[data-el="mak-przes-podw"][data-v="R"]').click();
p = await czekaj("p.items.some((it) => it.cab.name === 'Szafa' && !it.cab.przesuwne.podwBoki.R)");
ok('„z prawej” wyłączone — bok prawy zasłonięty, bez boku wewnętrznego z prawej', !szafa(p).cab.przesuwne.podwBoki.R && szafa(p).cab.przesuwne.podwBoki.L);
await page.locator('[data-el="mak-przes-podw"][data-v="R"]').click(); await page.waitForTimeout(300);
{ const t = (await page.locator('[data-el="mak-karta-panel"]').innerText().catch(() => '')).replace(/\s+/g, ' ');
  ok('„Co zrobi program”: drzwi przesuwne GTV NOVO S, nie „Bez frontów”', /Drzwi przesuwne GTV NOVO S: 2 skrzydła/.test(t) && !/Bez frontów/.test(t), t.slice(0, 200)); }

console.log('== szuflady na dół kolumny za drzwiami przesuwnymi ==');
await zakl('szuflady');
{ const kw = page.locator('[data-el="mak-kol-wybor"] [title="kolumna 2"]'); if (await kw.count()) { await kw.click(); await page.waitForTimeout(300); } }
await page.locator('[data-el="mak-szuflady"][data-v="2"]').first().click();
p = await czekaj("p.items.some((it) => it.cab.name === 'Szafa' && (it.cab.levels[0].cols[1].podzial || []).length === 1)");
{ const k2 = szafa(p).cab.levels[0].cols[1];
  ok('„2” w kolumnie 2 szafy: poziom kolumny z 2 szufladami na dole, drążek i półka 300 zostają nad nim', JSON.stringify(k2.podzial) === '[0]' && k2.segmenty[0].kind === 'drawers' && k2.segmenty[0].drawers.length === 2
    && k2.shelfTargets[0] > 400 && k2.shelfTargets[2] === 300 && JSON.stringify(k2.drazki) === '[1]', JSON.stringify({ st: k2.shelfTargets, pz: k2.podzial, dr: k2.drazki })); }
{ const t = await uwagi(); ok('Uwagi: zabudowa pod szuflady (bok 18 mm przy przegrodzie), prowadnica 18 nad dnem; fronty równe', /zabudowa pod szuflady — 1 bok 18 mm przy przegrodach/.test(t) && /dolna prowadnica 18 mm nad dnem/.test(t) && !/różnią się o/.test(t), t.slice(0, 300)); }
// klocek „3 szuflady” (dotknij, potem „do zaznaczonej”) na kolumnę 1: szuflady na jej dół, nie na całą wysokość
{ const kw = page.locator('[data-el="mak-kol-wybor"] [title="kolumna 1"]'); if (await kw.count()) { await kw.click(); await page.waitForTimeout(300); } }
{ const kl = page.locator('[data-el="mak-klocki-karty"] [data-el="mak-klocek"][data-id="szu-3"]');
  ok('klocek „3 szuflady” w karcie Szuflady', (await kl.count()) === 1);
  if (await kl.count()) { await kl.click(); await page.locator('[data-el="mak-wybrany-teraz"]').click(); } }
p = await czekaj("p.items.some((it) => it.cab.name === 'Szafa' && (it.cab.levels[0].cols[0].podzial || []).length === 1)");
{ const k1 = szafa(p).cab.levels[0].cols[0];
  ok('klocek „3 szuflady” — na dół kolumny 1 (poziom kolumny 3 × 220), półki nad nim', JSON.stringify(k1.podzial) === '[0]' && k1.segmenty[0].kind === 'drawers' && k1.segmenty[0].drawers.length === 3
    && k1.shelfTargets[0] >= 660 && k1.shelfTargets[0] < 663 && k1.kind !== 'drawers', JSON.stringify({ st: k1.shelfTargets, pz: k1.podzial })); }
{ const t = await uwagi(); ok('dwie kolumny z szufladami: „2 boki 18 mm przy przegrodach”, fronty równe', /2 boki 18 mm przy przegrodach/.test(t) && !/różnią się o/.test(t), t.slice(0, 300)); }
await zakl('drzwi');
{ const kl = page.locator('[data-el="mak-klocki-karty"] [data-el="mak-klocek"][data-id="drzwi-2"]');
  if (await kl.count()) { await kl.click(); await page.locator('[data-el="mak-wybrany-teraz"]').click(); await page.waitForTimeout(300); }
  ok('klocek „2 drzwi” w szafie przesuwnej — komunikat, bez zmiany', /ma drzwi przesuwne/.test(await page.locator('[data-el="mak-komunikat"]').innerText().catch(() => '')),
    await page.locator('[data-el="mak-komunikat"]').innerText().catch(() => '')); }
await page.evaluate(() => localStorage.setItem('mp-mak-przel', JSON.stringify({ zgory: true, gorny: true, dolny: true, fronty: false, kolory: true, wymiary: false })));
await page.reload({ waitUntil: 'networkidle' }); await page.waitForTimeout(1000);
ok('rysunek (bez frontów): bok zabudowy szuflad i boki wewnętrzne z przodu i z góry', (await page.locator('[data-el="makieta"] [data-el="zabudowa-szuflad"]').count()) >= 2
  && (await page.locator('[data-el="makieta"] [data-el="bok-wewnetrzny"]').count()) >= 4);
// uzytkownik 2026-11-17: „przy zdjętych frontach fronty szuflad dalej są widoczne w szafie” — szuflady wewnetrzne tylko obrysem, widac prowadnice
{ const n = await page.locator('[data-el="makieta"] [data-el="szuflada-bez-frontu"]').count();
  ok('bez frontów: szuflady za drzwiami przesuwnymi bez frontu (obrys) — 5 szuflad, prowadnice widać', n === 5 && (await page.locator('[data-el="makieta"] [data-el="szuflada-bez-frontu"] [data-el="prowadnica-szuflady"]').count()) === 10, String(n)); }
await page.evaluate(() => localStorage.setItem('mp-mak-przel', JSON.stringify({ zgory: true, gorny: true, dolny: true, fronty: true, kolory: true, wymiary: false })));
await page.reload({ waitUntil: 'networkidle' }); await page.waitForTimeout(1000);
ok('z frontami: szuflady z frontami (bez obrysów „bez frontu”)', (await page.locator('[data-el="makieta"] [data-el="szuflada-bez-frontu"]').count()) === 0);

console.log('== odsunięcie jednego skrzydła (2, 3 skrzydła) ==');
await zakl('drzwi');
ok('karta Drzwi: „odsuń skrzydło” — zamknięte + po przycisku na skrzydło (2)', (await page.locator('[data-el="mak-przes-odsun"]').count()) === 3
  && (await page.locator('[data-el="mak-przes-odsun"][data-v="brak"]').getAttribute('aria-pressed')) === 'true');
await page.locator('[data-el="mak-przes-odsun"][data-v="1"]').click();
p = await czekaj("p.items.some((it) => it.cab.name === 'Szafa' && it.cab.przesuwne.odsun === 0)");
await page.waitForTimeout(300);
ok('„1” — lewe skrzydło odsunięte (zapisane w szafie), na rysunku jedno odsunięte', szafa(p).cab.przesuwne.odsun === 0
  && (await page.locator('[data-el="makieta"] [data-el="skrzydlo-przesuwne"][data-odsuniete="1"]').count()) === 1);
await page.locator('[data-el="mak-przes-n"][data-v="3"]').click(); await page.waitForTimeout(400);
ok('3 skrzydła — 4 przyciski (zamknięte, 1–3)', (await page.locator('[data-el="mak-przes-odsun"]').count()) === 4);
await page.locator('[data-el="mak-przes-odsun"][data-v="2"]').click();
p = await czekaj("p.items.some((it) => it.cab.name === 'Szafa' && it.cab.przesuwne.odsun === 1)");
await page.waitForTimeout(300);
ok('„2” z 3 — środkowe odsunięte', szafa(p).cab.przesuwne.odsun === 1 && (await page.locator('[data-el="makieta"] [data-el="skrzydlo-przesuwne"][data-odsuniete="1"]').count()) === 1
  && (await page.locator('[data-el="makieta"] [data-el="skrzydlo-przesuwne"]').count()) === 3);
await page.locator('[data-el="mak-przes-odsun"][data-v="brak"]').click();
p = await czekaj("p.items.some((it) => it.cab.name === 'Szafa' && it.cab.przesuwne.odsun == null)");
await page.waitForTimeout(300);
ok('„zamknięte” — żadne skrzydło odsunięte', szafa(p).cab.przesuwne.odsun == null && (await page.locator('[data-el="makieta"] [data-odsuniete="1"]').count()) === 0);
await page.locator('[data-el="mak-przes-n"][data-v="auto"]').click(); await page.waitForTimeout(300);
await page.locator('[data-el="mak-przes-odsun"][data-v="2"]').click(); await page.waitForTimeout(400);   // do widoku 3D ponizej — prawe odsuniete

console.log('== bok V-BOX: jaki się zmieści / niski 127 (opcja szafy przesuwnej) ==');
await zakl('szuflady');
ok('karta Szuflady: „bok szuflad V-BOX” — domyślnie „jaki się zmieści”', (await page.locator('[data-el="mak-przes-bok"][data-v="auto"]').getAttribute('aria-pressed')) === 'true');
await page.locator('[data-el="mak-przes-bok"][data-v="127"]').click();
p = await czekaj("p.items.some((it) => it.cab.name === 'Szafa' && it.cab.przesuwne.niskieSzuflady === true)");
ok('„niski 127” — opcja zapisana w szafie', szafa(p).cab.przesuwne.niskieSzuflady === true);
await page.locator('[data-el="mak-przes-bok"][data-v="auto"]').click(); await page.waitForTimeout(300);

console.log('== 3D i karta techniczna ==');
await page.locator('[data-el="mak-widoki"]').first().click(); await page.waitForTimeout(150);
await page.locator('[data-v="3d"]').last().click(); await page.waitForTimeout(800);
ok('widok 3D szafy z drzwiami przesuwnymi — bez błędów', (await page.locator('[data-el="mak-widok-inny"][data-widok="3d"] [data-el="mak-3d"]').count()) >= 1 && !errors.length, errors.join(' | '));
await page.locator('[data-el="mak-widoki"]').first().click(); await page.waitForTimeout(150);
await page.locator('[data-v="przod"]').last().click(); await page.waitForTimeout(400);
await zakl('drzwi');
await page.locator('[data-el="mak-przesuwne"][data-v="nie"]').click();
p = await czekaj("p.items.some((it) => it.cab.name === 'Szafa' && !it.cab.przesuwne.on)");
ok('„na zawiasach” — z powrotem drzwi na zawiasach (bez torów na rysunku)', !szafa(p).cab.przesuwne.on && (await page.locator('[data-el="makieta"] [data-el="tor-gorny"]').count()) === 0);
await page.locator('[data-el="mak-przesuwne"][data-v="tak"]').click(); await page.waitForTimeout(400);
p = await czekaj("p.items.some((it) => it.cab.name === 'Szafa' && it.cab.przesuwne.on)");
await page.evaluate(() => localStorage.setItem('mp-tryb', 'techniczny')); await page.reload({ waitUntil: 'networkidle' }); await page.waitForTimeout(1200);
if (!(await page.locator('#karta-przesuwne [data-el="karta-przes-odsun"]').count())) { await page.locator('#karta-przesuwne header button').first().click(); await page.waitForTimeout(300); }
{ const k = page.locator('#karta-przesuwne'); ok('tryb Techniczny: karta „Drzwi przesuwne (GTV NOVO S)” z wyborem odsuniętego skrzydła', (await k.count()) === 1 && /Drzwi przesuwne/.test(await k.innerText())
  && (await k.locator('[data-el="karta-przes-odsun"] button').count()) === 3, String(await k.locator('[data-el="karta-przes-odsun"] button').count()) + ' ' + (await k.innerText()).replace(/\s+/g, ' ').slice(0, 300)); }

console.log('== wzór „Szafa do zabudowy z szufladami” ==');
await start(FIX);
await zakl('dodaj'); { const sek = page.locator('[data-el="mak-dodaj"] [data-dodaj="szafki"]'); if ((await sek.getAttribute('aria-expanded')) !== 'true') await sek.click(); await page.waitForTimeout(200); }
await page.locator('[data-el="mak-paleta"] [data-el="mak-wzor"][data-id="szafaZabSz"]').click(); await page.locator('[data-el="mak-wybrany-teraz"]').click();
p = await czekaj("p.items.some((it) => it.cab.name === 'Szafa')");
{ const c = szafa(p).cab, k2 = c.levels[0].cols[1];
  ok('„Szafa do zabudowy z szufladami”: przesuwne, niski bok V-BOX, w kolumnie 2 na dole 2 szuflady, drążek i półka 300 nad nimi', c.przesuwne.on && c.przesuwne.niskieSzuflady
    && JSON.stringify(k2.podzial) === '[0]' && k2.segmenty[0].kind === 'drawers' && k2.segmenty[0].drawers.length === 2 && k2.shelfTargets[2] === 300 && JSON.stringify(k2.drazki) === '[1]',
    JSON.stringify({ pr: c.przesuwne, st: k2.shelfTargets, pz: k2.podzial })); }
{ const t = await uwagi(); ok('Uwagi: zabudowa pod szuflady, bez błędów', /zabudowa pod szuflady/.test(t) && !/różnią się o/.test(t), t.slice(0, 200)); }

ok('bez błędów strony', !errors.length, errors.join(' | '));
console.log(bledy ? `\nBLEDOW: ${bledy}` : '\nWSZYSTKO OK');
await browser.close();
process.exit(bledy ? 1 : 0);
