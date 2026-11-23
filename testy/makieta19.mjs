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
// uzytkownik 2026-11-17: „może być jak wszędzie przygaszony front szuflad, ale nie było widać prowadnic w szafie z drzwiami przesuwnymi”
{ const n = await page.locator('[data-el="makieta"] [data-el="szuflada-za-przesuwnymi"]').count();
  ok('bez frontów: pod przygaszonymi frontami szuflad za drzwiami przesuwnymi widać prowadnice — 5 szuflad, 10 prowadnic', n === 5
    && (await page.locator('[data-el="makieta"] [data-el="szuflada-za-przesuwnymi"] [data-el="prowadnica-szuflady"]').count()) === 10, String(n)); }
await page.evaluate(() => localStorage.setItem('mp-mak-przel', JSON.stringify({ zgory: true, gorny: true, dolny: true, fronty: true, kolory: true, wymiary: false })));
await page.reload({ waitUntil: 'networkidle' }); await page.waitForTimeout(1000);
ok('z frontami (zamknięte): prowadnic szuflad za frontami nie rysuje', (await page.locator('[data-el="makieta"] [data-el="szuflada-za-przesuwnymi"]').count()) === 0);

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
// uzytkownik 2026-11-17: „szafa z szufladami bez drążka, za to szuflady po obu stronach; druga szafa w szablonie z drążkiem bez szuflad”
{ const c = szafa(p).cab, kol = c.levels[0].cols;
  ok('„Szafa do zabudowy z szufladami”: przesuwne, niski bok V-BOX, w obu kolumnach na dole 2 szuflady, nad nimi 3 półki, bez drążka', c.przesuwne.on && c.przesuwne.niskieSzuflady
    && kol.length === 2 && kol.every((k) => JSON.stringify(k.podzial) === '[0]' && k.segmenty[0].kind === 'drawers' && k.segmenty[0].drawers.length === 2 && k.shelfTargets.length === 5 && !(k.drazki || []).length),
    JSON.stringify(kol.map((k) => ({ st: k.shelfTargets, pz: k.podzial, dr: k.drazki })))); }
{ const t = await uwagi(); ok('Uwagi: zabudowa pod szuflady (bok przy przegrodzie w każdej kolumnie), bez błędów i bez „nie wysunie się”', /zabudowa pod szuflady — 2 boki/.test(t) && !/różnią się o/.test(t) && !/nie wysunie/.test(t), t.slice(0, 300)); }
{ const pz = page.locator('[data-el="mak-paleta"] [data-el="mak-wzor"][data-id="szafaZab"]');
  if (!(await pz.count())) { await zakl('dodaj'); const sek = page.locator('[data-el="mak-dodaj"] [data-dodaj="szafki"]'); if ((await sek.count()) && (await sek.getAttribute('aria-expanded')) !== 'true') await sek.click(); await page.waitForTimeout(200); }
  ok('opisy wzorów: „z drążkiem” / „szuflady po obu stronach … bez drążka”', /z drążkiem/.test(await page.locator('[data-el="mak-paleta"] [data-el="mak-wzor"][data-id="szafaZab"]').innerText().catch(() => ''))
    && /po obu stronach/.test(await page.locator('[data-el="mak-paleta"] [data-el="mak-wzor"][data-id="szafaZabSz"]').innerText().catch(() => ''))); }

console.log('== panel nad rysunkiem: osobno zwijane pomieszczenie i zabudowa oraz widoki (2026-11-22) ==');
{ const rys = page.locator('[data-el="makieta-rysunek"]');
  const h0 = (await page.locator('[data-el="mak-plotno"]').boundingBox()).y;
  await rys.locator('[data-el="mak-panel-zwin"]').click(); await page.waitForTimeout(400);
  const h1 = (await page.locator('[data-el="mak-plotno"]').boundingBox()).y;
  ok('„▼” pomieszczenia i zabudowy: bez wyborów i nagłówka, przełączniki widoków zostają; rysunek wyżej', (await rys.locator('[data-el="mak-panel-zwiniety"]').count()) === 1
    && (await rys.locator('[data-el="mak-pomieszczenie"], [data-el="mak-naglowek"]').count()) === 0 && (await rys.locator('[data-el="mak-przel"]').count()) === 1 && h1 < h0 - 10, `${h0} → ${h1}`);
  ok('streszczenie: pomieszczenie, zabudowa, szafka', /Pomieszczenie.*zabudowa „.*”.*szafka „Szafa”/.test(await rys.locator('[data-el="mak-panel-opis"]').innerText()), await rys.locator('[data-el="mak-panel-opis"]').innerText());
  await rys.locator('[data-el="mak-widoki-zwin"]').click(); await page.waitForTimeout(400);
  const h2 = (await page.locator('[data-el="mak-plotno"]').boundingBox()).y;
  ok('„▼” widoków: bez przełączników, streszczenie widoku, zoom zostaje; obie linie w jednej', (await rys.locator('[data-el="mak-przel"]').count()) === 0
    && /z przodu/.test(await rys.locator('[data-el="mak-widoki-opis"]').innerText()) && (await rys.locator('[data-el="mak-zoom"]').count()) === 1
    && (await rys.locator('[data-el="mak-panel-zwiniety"] [data-el="mak-widoki-zwin"]').count()) === 1 && h2 < h1 - 10, `${h1} → ${h2}`);
  await page.reload({ waitUntil: 'networkidle' }); await page.waitForTimeout(1000);
  ok('oba zwinięte zostają po przeładowaniu (pamięta przeglądarka)', (await page.locator('[data-el="makieta-rysunek"] [data-el="mak-panel-zwiniety"]').count()) === 1
    && (await page.locator('[data-el="makieta-rysunek"] [data-el="mak-przel"]').count()) === 0);
  await page.locator('[data-el="makieta-rysunek"] [data-el="mak-panel-zwin"]').click(); await page.waitForTimeout(400);
  ok('rozwinięte pomieszczenie, widoki dalej zwinięte (osobno)', (await page.locator('[data-el="makieta-rysunek"] [data-el="mak-pomieszczenie"]').count()) === 1
    && (await page.locator('[data-el="makieta-rysunek"] [data-el="mak-przel"]').count()) === 0 && (await page.locator('[data-el="makieta-rysunek"] [data-el="mak-zoom"]').count()) === 1);
  await page.locator('[data-el="makieta-rysunek"] [data-el="mak-widoki-zwin"]').click(); await page.waitForTimeout(400);
  ok('kliknięcie rozwija widoki: przełączniki wracają', (await page.locator('[data-el="makieta-rysunek"] [data-el="mak-przel"]').count()) === 1 && (await page.locator('[data-el="makieta-rysunek"] [data-el="mak-panel-zwiniety"]').count()) === 0); }

console.log('== analiza 2026-11-21: wysoki pokój (sufit 2900) i słupek z palety w kuchni ==');
await start(FIX);
await zakl('dodaj'); { const sek = page.locator('[data-el="mak-dodaj"] [data-dodaj="szafki"]'); if ((await sek.getAttribute('aria-expanded')) !== 'true') await sek.click(); await page.waitForTimeout(200); }
await page.locator('[data-el="mak-paleta"] [data-el="mak-wzor"][data-id="szafaZab"]').click(); await page.locator('[data-el="mak-wybrany-teraz"]').click();
p = await czekaj("p.items.some((it) => it.cab.name === 'Szafa')");
await ust(`const it = p.items.find((i) => i.cab.name === 'Szafa'); p.runs.find((x) => x.id === it.runId).ceiling = 2900;`);
{ const t = await uwagi(); ok('sufit 2900: „do sufitu się nie da … najwyżej 2761 mm” i przycisk „Wysokość szafy 2761 mm” (bez „Do sufitu z luzem”)', /do sufitu się nie da.*najwyżej 2 ?761 mm/.test(t)
    && (await page.locator('[data-el="makieta-uwagi"] button', { hasText: 'Wysokość szafy 2761 mm' }).count()) === 1 && !(await page.locator('[data-el="makieta-uwagi"] button', { hasText: /Do sufitu z luzem/ }).count()), t.slice(0, 400)); }
const H0 = szafa(await proj()).cab.H;
ok('500 mm do sufitu: przyciski „Blenda do sufitu” i „Nadstawka do sufitu (drzwi na zawiasach)” (#41)', (await page.locator('[data-el="makieta-uwagi"] button', { hasText: 'Blenda do sufitu' }).count()) === 1
  && (await page.locator('[data-el="makieta-uwagi"] button', { hasText: 'Nadstawka do sufitu (drzwi na zawiasach)' }).count()) === 1);
await page.locator('[data-el="makieta-uwagi"] button', { hasText: 'Wysokość szafy 2761 mm' }).click();
p = await czekaj("p.items.find((it) => it.cab.name === 'Szafa').cab.H === 2761");
{ const t = await uwagi(); ok('po kliknięciu szafa 2761 mm, bez błędu boku i rączki', szafa(p).cab.H === 2761 && !/nie mieści się na arkuszu|rączka NOVO S/.test(t), szafa(p).cab.H + ' ' + t.slice(0, 300)); }
// nad szafa do wyboru blenda albo nadstawka (uzytkownik 2026-11-21 / 2026-11-22: nadstawka z drzwiami na zawiasach) — #41
{ const t = await uwagi(), bB = page.locator('[data-el="makieta-uwagi"] button', { hasText: 'Blenda do sufitu' }), bN = page.locator('[data-el="makieta-uwagi"] button', { hasText: 'Nadstawka do sufitu' });
  ok('po 2761 (139 mm do sufitu): „Blenda do sufitu”, bez nadstawki (za niska — poniżej 150 mm)', (await bB.count()) === 1 && (await bN.count()) === 0, t.slice(0, 300));
  await bB.click(); p = await czekaj("p.items.find((it) => it.cab.name === 'Szafa').cab.topFiller && p.items.find((it) => it.cab.name === 'Szafa').cab.topFiller.on");
  const sz = szafa(p), o = sz.cab.topFiller;
  ok('„Blenda do sufitu” — blenda nad szafą do sufitu, rada znika', o && o.on && o.height >= 100 && !/do sufitu się nie da/.test(await uwagi()), JSON.stringify(o));
  await ust(`const it = p.items.find((i) => i.cab.name === 'Szafa'); it.cab.topFiller = { ...it.cab.topFiller, on: false }; it.cab.H = ${H0};`);
  await page.locator('[data-el="makieta-uwagi"] button', { hasText: 'Nadstawka do sufitu' }).click();
  p = await czekaj("p.items.some((it) => it.cab.nadstawka)"); }
{ const n = p.items.find((it) => it.cab.nadstawka), sz = szafa(p), g = p.runs.find((r) => r.id === n.runId), dolny = p.runs.find((r) => r.id === sz.runId);
  ok('nadstawka: w ciągu górnym nad szafą (prześwit 0), szerokość i głębokość szafy, do sufitu z luzem 5, drzwi na zawiasach, bez zawieszek',
    g && g.tier === 'gorny' && g.wall === dolny.id && g.clearance === 0 && n.cab.W === sz.cab.W && n.cab.D === sz.cab.D && n.cab.hangers === 'never'
    && n.cab.levels[0].cols.some((k) => (k.kind || 'doors') === 'doors' && k.doors >= 1), JSON.stringify({ W: n.cab.W, H: n.cab.H, D: n.cab.D, g: g && { c: g.clearance, m: g.mountY, o: g.offset } }));
  await ust(`p.active = p.items.findIndex((i) => i.cab.nadstawka);`);
  const t = await uwagi();
  const bezRozkroju = t.replace(/! Rozkrój[^✓]*/g, '');
  ok('uwagi nadstawki: „stoi na szafie … przykręć od środka przez dno do wieńca” — bez błędów i ostrzeżeń (drzwi po ok. 500 mm)', /Nadstawka stoi na szafie/.test(t) && !/ ! | × /.test(' ' + bezRozkroju.replace(/\d+ × \d+/g, '') + ' ')
    && n.cab.levels[0].cols.length === 2 && n.cab.levels[0].cols.every((k) => k.doors === 2), bezRozkroju.slice(0, 400));
  await ust(`p.active = p.items.findIndex((i) => i.cab.name === 'Szafa');`);
  ok('szafa z nadstawką — rady o blendzie / nadstawce już nie ma', !/do sufitu się nie da/.test(await uwagi())); }
await ust(`p.items = p.items.filter((i) => !i.cab.nadstawka); p.active = p.items.findIndex((i) => i.cab.name === 'Szafa'); const it = p.items.find((i) => i.cab.name === 'Szafa'); it.cab.H = 2895;`);
{ const t = await uwagi(); ok('szafa 2895 wpisana ręcznie: błąd boku i rączki NOVO S, przycisk „Wysokość szafy 2761 mm”', /Bok 2 ?895 × 600 mm nie mieści się/.test(t) && /rączka NOVO S/.test(t)
    && (await page.locator('[data-el="makieta-uwagi"] button', { hasText: 'Wysokość szafy 2761 mm' }).count()) >= 1, t.slice(0, 400)); }
// szafa szersza niz plyta (#42, decyzja uzytkownika 2026-11-22: podwojna przegroda na styku) — przycisk przy bledzie dna / wienca
await ust(`const it = p.items.find((i) => i.cab.name === 'Szafa'); it.cab.H = 2400; it.cab.W = 3200; const r = p.runs.find((x) => x.id === it.runId); r.wallW = 3200;`);
{ const b = page.locator('[data-el="makieta-uwagi"] button', { hasText: 'Dno i wieniec z kawałków' });
  ok('szafa 3200: błąd „Dno / wieniec … nie mieści się” z przyciskiem „Dno i wieniec z kawałków — dwie przegrody na styku”', (await b.count()) >= 1, (await uwagi()).slice(0, 300));
  if (await b.count()) await b.first().click();
  p = await czekaj("p.items.find((i) => i.cab.name === 'Szafa').cab.levels[0].cols.some((k) => k.przegrodaPodw && k.przegrodaOsobneDna)");
  const sz = szafa(p), t = await uwagi();
  ok('po kliknięciu: dwie przegrody na styku, osobne dna i wieńce; bez błędu dna, wieńca i cokołu', sz.cab.levels[0].cols.some((k) => k.przegrodaPodw && k.przegrodaOsobneDna)
    && sz.cab.levels[sz.cab.levels.length - 1].cols.some((k) => k.przegrodaOsobneWience) && !/(Dno|Wieniec|Cokół)[^.]* nie mieści się na arkuszu/.test(t), t.slice(0, 400)); }
// słupek z palety do kuchennego ciągu: wyjątek w ciągu, cokół jak ciąg
await start(FIX);
await zakl('dodaj'); { const sek = page.locator('[data-el="mak-dodaj"] [data-dodaj="szafki"]'); if ((await sek.getAttribute('aria-expanded')) !== 'true') await sek.click(); await page.waitForTimeout(200); }
for (const id of ['dolna1', 'slupek']) { const n0 = (await proj()).items.length; await page.locator(`[data-el="mak-paleta"] [data-el="mak-wzor"][data-id="${id}"]`).click(); await page.locator('[data-el="mak-wybrany-teraz"]').click(); await czekaj(`p.items.length > ${n0}`); }
p = await proj();
{ const sl = p.items[p.items.length - 1], run = p.runs.find((r) => r.id === sl.runId), t = await uwagi();
  ok('słupek z palety w kuchni: „wyjątek w ciągu” (slupek), cokół jak w ciągu — bez uwag o wysokości i cokole', sl.cab.slupek === true && JSON.stringify(sl.cab.plinth) === JSON.stringify(run.plinth)
    && !/nie zgadza się z ciągiem|Wysokość 2000 mm nie zgadza się/.test(t), JSON.stringify({ sl: sl.cab.slupek, pl: sl.cab.plinth, rp: run.plinth }) + ' ' + t.slice(0, 300));
  // uzytkownik 2026-11-21: „słupek nie ma blatu”; 2026-11-22: na końcu zabudowy dolega do ściany, front w linii (590 przy blacie 600)
  const sz = (run.wallGap || {}).bottom || 0;
  ok('… na końcu ciągu: przy samej ścianie (szpara 0), głębokość = ciąg + szpara ciągu, front w linii — bez uwag o głębokości, blacie i szparze', sz > 0 && sl.cab.D === run.D + sz
    && sl.wallGap && sl.wallGap.bottom === 0 && !(Number(sl.offset) > 0) && !/Głębokość \d+ mm jest większa|Blat wychodzi|Za głęboki słupek|na końcu ciągu stoi|inaczej niż reszta ciągu/.test(t),
    JSON.stringify({ D: sl.cab.D, wg: sl.wallGap, off: sl.offset, rD: run.D, sz }) + ' ' + t.slice(0, 300)); }
// słupek wstawiony ręcznie na końcu ciągu, 17 mm od ściany — informacja z przyciskiem „Słupek do ściany”
await ust(`const sl = p.items[p.items.length - 1]; delete sl.wallGap; sl.cab.D = 550; p.active = p.items.length - 1;`);
{ const b = page.locator('[data-el="makieta-uwagi"] button', { hasText: /Słupek do ściany/ });
  ok('słupek 17 mm od ściany na końcu ciągu: „jeśli obok nie ma ściany, z boku widać szparę” + przycisk', /na końcu ciągu stoi 17 mm od ściany/.test(await uwagi()) && (await b.count()) === 1, (await uwagi()).slice(0, 300));
  if (await b.count()) await b.click(); }
p = await czekaj("p.items[p.items.length - 1].cab.D === 567");
{ const sl = p.items[p.items.length - 1]; ok('… po kliknięciu: szpara 0, głębokość 567', sl.cab.D === 567 && sl.wallGap && sl.wallGap.bottom === 0, JSON.stringify({ D: sl.cab.D, wg: sl.wallGap })); }
// szafa przesuwna 2400 (3 skrzydła): przycisk „Przegrody na stykach skrzydeł”
await start(FIX);
await zakl('dodaj'); { const sek = page.locator('[data-el="mak-dodaj"] [data-dodaj="szafki"]'); if ((await sek.getAttribute('aria-expanded')) !== 'true') await sek.click(); await page.waitForTimeout(200); }
await page.locator('[data-el="mak-paleta"] [data-el="mak-wzor"][data-id="szafaZab"]').click(); await page.locator('[data-el="mak-wybrany-teraz"]').click();
p = await czekaj("p.items.some((it) => it.cab.name === 'Szafa')");
await ust(`const it = p.items.find((i) => i.cab.name === 'Szafa'); it.cab.W = 2400;`);
{ const t = await uwagi(), b = page.locator('[data-el="makieta-uwagi"] button', { hasText: 'Przegrody na stykach skrzydeł' });
  ok('2400 mm (3 skrzydła), 2 kolumny: ostrzeżenie „wypada pod dwoma skrzydłami” z przyciskiem', /wypada pod dwoma skrzydłami/.test(t) && (await b.count()) >= 1, t.slice(0, 300));
  if (await b.count()) await b.first().click(); }
p = await czekaj("p.items.find((it) => it.cab.name === 'Szafa').cab.levels[0].cols.length === 3");
{ const t = await uwagi(), kol = szafa(p).cab.levels[0].cols;
  ok('po kliknięciu: 3 kolumny (trzecia — kopia ostatniej, z drążkiem), bez uwag o kolumnach', kol.length === 3 && kol[0].w === 751 && kol[1].w === 791 && kol[2].w == null && (kol[2].drazki || []).length === 1
    && !/wypada pod dwoma skrzydłami/.test(t), JSON.stringify(kol.map((c) => c.w)) + ' ' + t.slice(0, 200)); }

console.log('== 2026-11-22: kolor cokołu (domyślnie jak fronty) ==');
await start(FIX);
await zakl('dodaj'); { const sek = page.locator('[data-el="mak-dodaj"] [data-dodaj="szafki"]'); if ((await sek.getAttribute('aria-expanded')) !== 'true') await sek.click(); await page.waitForTimeout(200); }
{ const n0 = (await proj()).items.length; await page.locator('[data-el="mak-paleta"] [data-el="mak-wzor"][data-id="dolna1"]').click(); await page.locator('[data-el="mak-wybrany-teraz"]').click(); await czekaj(`p.items.length > ${n0}`); }
await ust(`p.active = p.items.length - 1; const it = p.items[p.active]; it.mat.front = { ...it.mat.front, color: '#203040' }; it.mat.board = { ...it.mat.board, color: '#e0d0c0' }; it.cab.frontSameAsBoard = false;`);
await zakl('cokol');
await page.locator('[data-el="mak-cokol"][data-v="under"]').click(); await page.waitForTimeout(700);
{ const b = page.locator('[data-el="mak-cokol-kolor"]');
  ok('zakładka „Cokół i nóżki”: „kolor cokołu” — jak fronty (wybrane) / jak korpus', (await b.count()) === 2 && (await page.locator('[data-el="mak-cokol-kolor"][data-v="front"]').getAttribute('aria-pressed')) === 'true', String(await b.count())); }
const fillCokolu = () => page.evaluate(() => { const r = document.querySelector('[data-el="makieta"] [data-el="cokol-ciagu"], [data-el="makieta"] [data-el="cokol-szafki"]'); return r ? (r.getAttribute('fill') || '').toLowerCase() : null; });
// makieta rysuje jasną paletą (MAK_JASNE: front #f3f0eb, korpus #fbfaf8) — cokół w tonie frontów, po zmianie w tonie korpusu
ok('rysunek: cokół w kolorze frontów', (await fillCokolu()) === '#f3f0eb', String(await fillCokolu()));
await page.locator('[data-el="mak-cokol-kolor"][data-v="korpus"]').click(); await page.waitForTimeout(700);
p = await czekaj("(p.runs.find((r) => r.id === p.items[p.active].runId).plinth || {}).kolor === 'korpus'");
ok('„jak korpus”: zapisane w ciągu, rysunek w kolorze korpusu', (p.runs.find((r) => r.id === p.items[p.active].runId).plinth || {}).kolor === 'korpus' && (await fillCokolu()) === '#fbfaf8', String(await fillCokolu()));

console.log('== 2026-11-22: biurko w ciągu, między dwiema szafkami ==');
await start(FIX);
await zakl('dodaj'); { const sek = page.locator('[data-el="mak-dodaj"] [data-dodaj="szafki"]'); if ((await sek.getAttribute('aria-expanded')) !== 'true') await sek.click(); await page.waitForTimeout(200); }
for (const id of ['szafa2', 'regal']) { const n0 = (await proj()).items.length; await page.locator(`[data-el="mak-paleta"] [data-el="mak-wzor"][data-id="${id}"]`).click(); await page.locator('[data-el="mak-wybrany-teraz"]').click(); await czekaj(`p.items.length > ${n0}`); }
await ust(`p.active = p.items.findIndex((i) => i.cab.name === 'Szafa');`);
await zakl('dodaj'); { const sek = page.locator('[data-el="mak-dodaj"] [data-dodaj="szafki"]'); if ((await sek.getAttribute('aria-expanded')) !== 'true') await sek.click(); await page.waitForTimeout(200); }
{ const n0 = (await proj()).items.length; await page.locator('[data-el="mak-paleta"] [data-el="mak-wzor"][data-id="biurko"]').click(); await page.locator('[data-el="mak-wybrany-teraz"]').click(); await czekaj(`p.items.length > ${n0}`); }
p = await proj();
{ const kol = p.items.filter((i) => i.runId).map((i) => i.cab.name), b = p.items.find((i) => i.cab.name === 'Biurko');
  ok('biurko przy zaznaczonej szafie w ciągu — w tym ciągu, między szafą a regałem; blat bez nawisu na boki', JSON.stringify(kol) === '["Szafa","Biurko","Regał"]' && b.cab.top.overL === 0 && b.cab.top.overR === 0, JSON.stringify(kol) + ' ' + JSON.stringify(b && b.cab.top));
  await ust(`p.active = p.items.findIndex((i) => i.cab.name === 'Biurko');`);
  const t = await uwagi();
  ok('… bez uwag o wysokości, cokole i drzwiach szafy obok', !/nie zgadza się z ciągiem|nie otworzy się/.test(t), t.slice(0, 300)); }

console.log('== 2026-11-22: maskownica boku (zakładka Wzmocnienia, między meblami) ==');
await page.evaluate(() => localStorage.setItem('mp-tryb', 'szczegolowa')); await page.reload({ waitUntil: 'networkidle' }); await page.waitForTimeout(1000);
await ust(`p.items = p.items.filter((i) => i.cab.name !== 'Biurko'); p.active = p.items.findIndex((i) => i.cab.name === 'Szafa');`);
await zakl('wzmocnienia');
ok('zakładka Wzmocnienia: „maskownica boku” — z lewej / z prawej', (await page.locator('[data-el="mak-maskownica"]').count()) === 2);
await page.locator('[data-el="mak-maskownica"][data-v="prawa"]').click();
p = await czekaj("p.items.some((i) => i.cab.sprzetCiagu && i.cab.sprzetCiagu.typ === 'maskownica' && i.cab.H > 1000)");
{ const kol = p.items.filter((i) => i.runId).map((i) => i.cab.name), m = p.items.find((i) => i.cab.sprzetCiagu && i.cab.sprzetCiagu.typ === 'maskownica'), sz = p.items.find((i) => i.cab.name === 'Szafa');
  const gora = Math.max(sz.cab.plinth && sz.cab.plinth.on ? sz.cab.plinth.height : 0, sz.cab.legs && sz.cab.legs.on ? sz.cab.legs.height : 0) + sz.cab.H;
  ok('maskownica domyślnie w kolorze korpusu (2026-11-22)', m.cab.sprzetCiagu.kolor === 'korpus', JSON.stringify(m.cab.sprzetCiagu));
  ok('maskownica między szafą a regałem: 18 mm, od podłogi do góry szafy, głębokość szafy', JSON.stringify(kol) === '["Szafa","Maskownica boku","Regał"]' && m.cab.W === 18 && m.cab.H === gora && m.cab.D === sz.cab.D,
    JSON.stringify(kol) + ' ' + JSON.stringify({ W: m.cab.W, H: m.cab.H, D: m.cab.D, gora })); }
await ust(`p.active = p.items.findIndex((i) => i.cab.sprzetCiagu && i.cab.sprzetCiagu.typ === 'maskownica');`);
await zakl('wzmocnienia');
ok('zaznaczona maskownica w zakładce Wzmocnienia: jej kolor (jak korpus — wybrane) i głębokość, bez wzmocnień kolumn', (await page.locator('[data-el="mak-maskownica-kolor"][data-v="korpus"]').getAttribute('aria-pressed')) === 'true'
  && (await page.locator('[data-el="mak-maskownica-gl"]').count()) === 2 && (await page.locator('[data-el="mak-wzm"]').count()) === 0);
await zakl('plyty');
ok('… w kafelku „Płyty i kolory”: kolor maskownicy', (await page.locator('[data-el="mak-plyty-maskownica"]').count()) === 2);
// projekt sprzed poprawki: maskownica zapisana ze starym domyslnym „jak fronty” — ma wyjsc jak korpus; „jak fronty” klikniete zostaje
await ust(`const m = p.items.find((i) => i.cab.sprzetCiagu && i.cab.sprzetCiagu.typ === 'maskownica'); m.cab.sprzetCiagu = { typ: 'maskownica', gl: 'front', kolor: 'front' };`);
await zakl('wzmocnienia');
ok('stara maskownica (kolor: front bez wyboru) — jak korpus', (await page.locator('[data-el="mak-maskownica-kolor"][data-v="korpus"]').getAttribute('aria-pressed')) === 'true');
await page.locator('[data-el="mak-maskownica-kolor"][data-v="front"]').click();
p = await czekaj("p.items.some((i) => i.cab.sprzetCiagu && i.cab.sprzetCiagu.typ === 'maskownica' && i.cab.sprzetCiagu.kolorWyb)");
ok('„jak fronty” kliknięte — zostaje (kolorWyb)', (await page.locator('[data-el="mak-maskownica-kolor"][data-v="front"]').getAttribute('aria-pressed')) === 'true');
await page.locator('[data-el="mak-maskownica-kolor"][data-v="korpus"]').click();
await page.waitForTimeout(500);
{ const t = await uwagi(); ok('uwagi maskownicy: wkręty 4 × 30 od środka szafki obok, cokół kończy się przy niej; rysunek', /Maskownica boku \d+ × \d+ mm: przykręć ją od środka szafki obok wkrętami 4 × 30/.test(t)
    && (await page.locator('[data-el="makieta"] [data-el="maskownica-boku"]').count()) >= 1, t.slice(0, 300)); }

console.log('== 2026-11-22: biurko wiszące między szafkami (maskownice, dno cofnięte, front do spodu dna) ==');
await ust(`p.items = p.items.filter((i) => !(i.cab.sprzetCiagu && i.cab.sprzetCiagu.typ === 'maskownica')); p.active = p.items.findIndex((i) => i.cab.name === 'Szafa');`);
await zakl('dodaj'); { const sek = page.locator('[data-el="mak-dodaj"] [data-dodaj="szafki"]'); if ((await sek.getAttribute('aria-expanded')) !== 'true') await sek.click(); await page.waitForTimeout(200); }
{ const n0 = (await proj()).items.length; await page.locator('[data-el="mak-paleta"] [data-el="mak-wzor"][data-id="biurkoW"]').click(); await page.locator('[data-el="mak-wybrany-teraz"]').click(); await czekaj(`p.items.length > ${n0}`); }
p = await proj();
{ const b = p.items.find((i) => i.cab.biurkoWiszace), kol = p.items.filter((i) => i.runId).map((i) => i.cab.name);
  ok('wzór „Biurko wiszące” przy szafie: w ciągu za nią, 2100 × 250 × 600, 500 nad podłogą, bez nóżek, 3 szuflady, dno cofnięte 18', JSON.stringify(kol) === '["Szafa","Biurko wiszące","Regał"]'
    && b.cab.W === 2100 && b.cab.H === 250 && b.cab.dolGorny === 500 && !(b.cab.legs && b.cab.legs.on) && b.cab.levels[0].cols.length === 3 && b.cab.dnoCof === 18, JSON.stringify(kol)); }
await ust(`p.active = p.items.findIndex((i) => i.cab.biurkoWiszace);`);
await page.evaluate(() => localStorage.setItem('mp-tryb', 'szczegolowa')); await page.reload({ waitUntil: 'networkidle' }); await page.waitForTimeout(1000);
await zakl('wzmocnienia');
for (const st of ['lewa', 'prawa']) { await page.locator(`[data-el="mak-maskownica"][data-v="${st}"]`).click(); await page.waitForTimeout(800); }
p = await czekaj("p.items.filter((i) => i.cab.sprzetCiagu && i.cab.sprzetCiagu.typ === 'maskownica').length === 2");
{ const m = p.items.filter((i) => i.cab.sprzetCiagu && i.cab.sprzetCiagu.typ === 'maskownica'), sz = p.items.find((i) => i.cab.name === 'Szafa');
  ok('maskownice z obu stron biurka: wysokość do góry szafy (wyższej z sąsiadek), bez cech biurka', m.every((q) => q.cab.H >= sz.cab.H && !q.cab.biurkoWiszace && !q.cab.dnoCof), JSON.stringify(m.map((q) => q.cab.H))); }
await ust(`p.active = p.items.findIndex((i) => i.cab.biurkoWiszace);`);
{ const t = await uwagi(), b = page.locator('[data-el="makieta-uwagi"] button', { hasText: 'Front 10 mm poniżej dna' });
  // push to open (2026-11-23): trzeci przycisk — prowadnice w wersji PUSH
  ok('uwagi biurka: też „Push to open (prowadnice PUSH)”', (await page.locator('[data-el="makieta-uwagi"] button', { hasText: 'Push to open' }).count()) === 1);
  ok('uwagi: fronty bez chwytu — „Dodaj uchwyty” / „Front 10 mm poniżej dna”; wisi 500 (blat 750); maskownice są', /nie ma za co chwycić/.test(t) && (await b.count()) === 1 && /wisi 500 mm nad podłogą \(blat 750 mm\)/.test(t) && !/nie ma maskownic/.test(t), t.slice(0, 400));
  await b.click(); }
p = await czekaj("p.items.find((i) => i.cab.biurkoWiszace).cab.frontPodDnem === 10");
ok('„Front 10 mm poniżej dna” — zapisane, ostrzeżenie znika', p.items.find((i) => i.cab.biurkoWiszace).cab.frontPodDnem === 10 && !/nie ma za co chwycić/.test(await uwagi()));
// przesuwanie biurka w gore / w dol na rysunku (uzytkownik 2026-11-22: „brak możliwości przesunięcia biurka w dół … wyrównać do półki
// szafki obok”) — dolna krawedz w zakladce Szafka przesuwa cala skrzynke, lapie polki szafy obok
await zakl('szafka');
{ const uch = (u) => page.locator(`[data-el="makieta-uchwyty"] [data-u="${u}"]`).first();
  ok('biurko wiszące: uchwyt dolnej krawędzi (przesuwa całe biurko)', (await page.locator('[data-el="makieta-uchwyty"] [data-u="pion"]').count()) === 1);
  const a = await uch('wys').boundingBox(), b = await uch('pion').boundingBox(), sk = (b.y - a.y) / 250;
  const x = b.x + b.width / 2, y = b.y + b.height / 2;
  await page.mouse.move(x, y); await page.mouse.down();
  const lapy = [];
  for (let i = 1; i <= 40; i++) { await page.mouse.move(x, y + 300 * sk * i / 40); await page.waitForTimeout(25);
    const t = (await page.locator('[data-el="makieta-uchwyty"] text').allTextContents()).find((q) => /od podłogi/.test(q)) || '';
    if ((await page.locator('[data-el="makieta-podglad"][data-rowno="1"]').count()) > 0) lapy.push(t); }
  const tK = (await page.locator('[data-el="makieta-uchwyty"] text').allTextContents()).find((q) => /od podłogi/.test(q)) || '';
  await page.mouse.up(); await page.waitForTimeout(800);
  p = await proj(); const bw = p.items.find((i) => i.cab.biurkoWiszace);
  ok('przeciągnięte w dół o ok. 300 mm: „dół … od podłogi”, wysokość biurka bez zmian', bw.cab.dolGorny >= 160 && bw.cab.dolGorny <= 240 && bw.cab.H === 250 && /dół \d+ od podłogi/.test(tK), JSON.stringify({ dG: bw.cab.dolGorny, H: bw.cab.H, tK }));
  ok('po drodze łapie półkę szafy obok („równo z … półki”)', lapy.some((t) => /półki „Szafa”/.test(t)), JSON.stringify(lapy.slice(0, 4))); }
// przegrody cofniete (uzytkownik 2026-11-22): biurko — przegrody o grubosc frontu, pole w zakladce Przegroda
await zakl('przegroda');
{ const pole = page.locator('[data-pole="przegrody-cof"]');
  ok('zakładka Przegroda: „przegrody pionowe cofnięte od frontu” — biurko 18 mm, głębokość przegród 582', (await pole.count()) === 1 && Number(await pole.inputValue()) === 18
    && /głębokość przegród 582 mm/.test(await page.locator('[data-el="mak-przegrody-cof-w"]').innerText()), await page.locator('[data-el="mak-przegrody-cof-w"]').innerText().catch(() => ''));
  await page.locator('[data-el="mak-przegrody-cof"][data-v="0"]').click();
  p = await czekaj("p.items.find((i) => i.cab.biurkoWiszace).cab.przegrodyCof === 0");
  ok('„równo z frontem korpusu” — 0 (zostaje po przeładowaniu)', p.items.find((i) => i.cab.biurkoWiszace).cab.przegrodyCof === 0);
  await page.reload({ waitUntil: 'networkidle' }); await page.waitForTimeout(1000); await zakl('przegroda');
  ok('… po przeładowaniu dalej 0 (biurko nie wraca do 18)', Number(await page.locator('[data-pole="przegrody-cof"]').inputValue()) === 0);
  await page.locator('[data-pole="przegrody-cof"]').fill('18'); await page.locator('[data-pole="przegrody-cof"]').press('Enter');
  p = await czekaj("p.items.find((i) => i.cab.biurkoWiszace).cab.przegrodyCof === 18");
  ok('wpisane 18 — zapisane', p.items.find((i) => i.cab.biurkoWiszace).cab.przegrodyCof === 18); }

console.log('== 2026-11-22: szafka RTV wisząca, „+ nowe pomieszczenie” w makiecie ==');
await start(FIX);
await zakl('dodaj'); { const sek = page.locator('[data-el="mak-dodaj"] [data-dodaj="szafki"]'); if ((await sek.getAttribute('aria-expanded')) !== 'true') await sek.click(); await page.waitForTimeout(200); }
{ const n0 = (await proj()).items.length; await page.locator('[data-el="mak-paleta"] [data-el="mak-wzor"][data-id="rtvW"]').click(); await page.locator('[data-el="mak-wybrany-teraz"]').click(); await czekaj(`p.items.length > ${n0}`); }
p = await proj();
{ const r = p.items.find((i) => i.cab.wiszacaRtv), t = await uwagi();
  ok('„Szafka RTV wisząca”: 1600 × 400 × 450, 350 nad podłogą, bez nóżek i cokołu, 2 klapy w dół, na zawieszkach', !!r && r.cab.W === 1600 && r.cab.H === 400 && r.cab.D === 450 && r.cab.dolGorny === 350
    && !(r.cab.legs && r.cab.legs.on) && !(r.cab.plinth && r.cab.plinth.on) && r.cab.levels[0].cols.length === 2 && /na zawieszkach do ściany.*dół 350 mm nad podłogą/.test(t), r && JSON.stringify({ W: r.cab.W, H: r.cab.H, dG: r.cab.dolGorny }) + ' ' + t.slice(0, 200)); }
await zakl('szafka');
{ const pole = page.locator('[data-pole="dol-nad-podloga"]'); ok('karta Szafka: pole „dół nad podłogą” (350)', (await pole.count()) === 1 && (await pole.inputValue()) === '350');
  if (await pole.count()) { await pole.fill('400'); await pole.press('Enter'); } }
p = await czekaj("p.items.find((i) => i.cab.wiszacaRtv).cab.dolGorny === 400");
ok('… zmiana na 400 zapisana', p.items.find((i) => i.cab.wiszacaRtv).cab.dolGorny === 400);
await page.locator('[data-el="mak-pomieszczenie"] > button').click(); await page.waitForTimeout(200);
await page.locator('[data-el="mak-pomieszczenie"] [role="option"][data-v="__nowe"]').click();
p = await czekaj("(p.rooms || []).length === 2");
ok('lista „Pomieszczenie”: „+ nowe pomieszczenie” dodaje pomieszczenie i do niego przechodzi', (p.rooms || []).length === 2 && /Pomieszczenie 2/.test(await page.locator('[data-el="mak-pomieszczenie"]').innerText()),
  JSON.stringify(p.rooms) + ' ' + (await page.locator('[data-el="mak-pomieszczenie"]').innerText()));

console.log('== 2026-11-22: kafelek „Płyty i kolory” (makieta szczegółowa) ==');
await start(FIX);
await zakl('dodaj'); { const sek = page.locator('[data-el="mak-dodaj"] [data-dodaj="szafki"]'); if ((await sek.getAttribute('aria-expanded')) !== 'true') await sek.click(); await page.waitForTimeout(200); }
for (const id of ['dolna1', 'dolna2']) { const n0 = (await proj()).items.length; await page.locator(`[data-el="mak-paleta"] [data-el="mak-wzor"][data-id="${id}"]`).click(); await page.locator('[data-el="mak-wybrany-teraz"]').click(); await czekaj(`p.items.length > ${n0}`); }
await page.evaluate(() => localStorage.setItem('mp-tryb', 'szczegolowa')); await page.reload({ waitUntil: 'networkidle' }); await page.waitForTimeout(1000);
await zakl('plyty');
{ const sw = page.locator('[data-el="mak-karta-panel"] [data-el="mak-plyta"][data-k="board"]');
  ok('kafelek „Płyty i kolory”: paleta korpusu, „w całym pomieszczeniu”, kolor cokołu / maskownic (opis)', (await sw.count()) > 3 && (await page.locator('[data-el="mak-plyta-pokoj"]').count()) >= 1 && (await page.locator('[data-el="mak-plyty-info"]').count()) === 1);
  const hex = await sw.nth(2).getAttribute('data-v'); await sw.nth(2).click(); await page.waitForTimeout(500);
  await page.locator('[data-el="mak-plyta-pokoj"][data-v="board"]').click();
  p = await czekaj(`p.items.filter((i) => !i.cab.sprzetCiagu).every((i) => (i.mat.board.color || '').toLowerCase() === '${'${hex}'}'.toLowerCase())`.replace("${'${hex}'}", hex));
  ok('kolor korpusu z kafelka i „korpus — w całym pomieszczeniu”: wszystkie szafki pomieszczenia', p.items.filter((i) => !i.cab.sprzetCiagu).every((i) => (i.mat.board.color || '').toLowerCase() === hex.toLowerCase()), hex + ' ' + JSON.stringify(p.items.map((i) => i.mat.board.color))); }
console.log('== 2026-11-22: kolor HDF — jak korpus, ostrzeżenie z przyciskami ==');
{ const lc = (x) => String(x || '').toLowerCase();
  const hdfOk = (q) => q.items.filter((i) => !i.cab.sprzetCiagu && i.cab.back === 'hdf').every((i) => lc(i.mat.back.color) === lc(i.mat.board.color));
  ok('w kafelku „Płyty i kolory”: wiersz „Plecy HDF” z paletą i „jak korpus”', (await page.locator('[data-el="mak-karta-panel"] [data-el="mak-plyta"][data-k="back"]').count()) > 3
    && (await page.locator('[data-el="mak-plyta-hdf-korpus"]').count()) === 1);
  ok('po zmianie koloru korpusu HDF idzie za nim (był jak korpus)', hdfOk(p), JSON.stringify(p.items.map((i) => [i.mat.board.color, i.mat.back.color])));
  const inny = await page.locator('[data-el="mak-karta-panel"] [data-el="mak-plyta"][data-k="back"]').nth(5).getAttribute('data-v');
  await page.locator('[data-el="mak-karta-panel"] [data-el="mak-plyta"][data-k="back"]').nth(5).click(); await page.waitForTimeout(600);
  const t = await uwagi(), bK = page.locator('[data-el="makieta-uwagi"] button', { hasText: 'HDF jak korpus' });
  ok('HDF w innym kolorze: ostrzeżenie i przyciski „HDF jak korpus” / „Zostaw HDF tak jak jest”', /Plecy HDF w innym kolorze niż korpus/.test(t) && (await bK.count()) >= 1
    && (await page.locator('[data-el="makieta-uwagi"] button', { hasText: 'Zostaw HDF tak jak jest' }).count()) >= 1, inny + ' ' + t.slice(0, 200));
  await bK.first().click(); p = await czekaj(`p.items.every((i) => i.cab.back !== 'hdf' || String(i.mat.back.color).toLowerCase() === String(i.mat.board.color).toLowerCase())`);
  ok('„HDF jak korpus” — kolor korpusu, ostrzeżenie znika', hdfOk(p) && !/Plecy HDF w innym kolorze/.test(await uwagi()));
  await page.locator('[data-el="mak-karta-panel"] [data-el="mak-plyta"][data-k="back"]').nth(5).click(); await page.waitForTimeout(600);
  await page.locator('[data-el="makieta-uwagi"] button', { hasText: 'Zostaw HDF tak jak jest' }).first().click();
  p = await czekaj(`p.items.some((i) => i.mat.back && i.mat.back.kolorOk)`);
  ok('„Zostaw HDF tak jak jest” — kolor zostaje (kolorOk), ostrzeżenie znika', p.items.some((i) => i.mat.back.kolorOk && lc(i.mat.back.color) === lc(inny)) && !/Plecy HDF w innym kolorze/.test(await uwagi())); }
console.log('== 2026-11-22: „Nowy projekt — co projektujesz?” (#44) ==');
{ await page.evaluate(() => localStorage.setItem('mp-tryb', 'techniczny')); await page.reload({ waitUntil: 'networkidle' }); await page.waitForTimeout(1000);
  await page.getByRole('button', { name: 'Nowy projekt', exact: true }).first().click(); await page.waitForTimeout(300);
  ok('okno „co projektujesz?”: kuchnia / szafa w zabudowie / pokój / pusta szafka, pola ściany', (await page.locator('[data-el="start-rodzaj"]').count()) === 4 && (await page.locator('[data-pole="start-szer"]').count()) === 1);
  await page.locator('[data-pole="start-szer"]').fill('3000'); await page.locator('[data-pole="start-wys"]').fill('2600');
  await page.locator('[data-el="start-rodzaj"][data-v="szafa"]').click(); await page.waitForTimeout(1200);
  p = await proj();
  const run = p.runs[0], sz = p.items.filter((i) => i.runId === run.id);
  ok('„Szafa w zabudowie”, ściana 3000 × 2600: ciąg szafa (bez blatu), ściana i sufit zapisane, dwie szafy po 1500 do sufitu, makieta', p.runs.length === 1 && run.zabudowa === 'szafa' && !run.worktop
    && run.wallW === 3000 && run.ceiling === 2600 && sz.length === 2 && sz.every((i) => i.cab.W === 1500 && i.cab.H >= 2500) && (await page.evaluate(() => localStorage.getItem('mp-tryb'))) === 'prosta',
    JSON.stringify({ runs: p.runs.length, z: run.zabudowa, w: run.wallW, c: run.ceiling, sz: sz.map((i) => [i.cab.W, i.cab.H]) }));
  await page.getByRole('button', { name: 'Nowy projekt', exact: true }).first().click(); await page.waitForTimeout(300);
  await page.locator('[data-pole="start-szer"]').fill('3600'); await page.locator('[data-pole="start-wys"]').fill('');
  await page.locator('[data-el="start-rodzaj"][data-v="kuchnia"]').click(); await page.waitForTimeout(1200);
  p = await proj();
  ok('„Kuchnia”: ciąg z blatem, ściana 3600, dolna szafka pod blatem na nóżkach', p.runs[0].zabudowa === 'kuchnia' && p.runs[0].worktop === true && p.runs[0].wallW === 3600
    && p.items.length === 1 && p.items[0].runId === p.runs[0].id && p.items[0].cab.legs.on, JSON.stringify({ r: p.runs[0], it: p.items.map((i) => i.cab.name) }).slice(0, 300));
  const t = await uwagi(); ok('kuchnia startowa bez błędów i ostrzeżeń', !/ ! | × /.test(' ' + t.replace(/! Rozkrój[^✓]*/g, '') + ' '), t.slice(0, 300)); }
console.log('== 2026-11-22: zoom makiety poniżej 100% ==');
await page.evaluate(() => localStorage.setItem('mp-tryb', 'prosta')); await page.reload({ waitUntil: 'networkidle' }); await page.waitForTimeout(1000);
{ const minus = page.locator('[data-el="mak-zoom"] button', { hasText: '−' });
  for (let k = 0; k < 3; k++) { await minus.click(); await page.waitForTimeout(200); }
  ok('„−” oddala poniżej 100% (do 25%)', /^25%$/.test((await page.locator('[data-el="mak-zoom-proc"]').innerText()).trim()), await page.locator('[data-el="mak-zoom-proc"]').innerText());
  await page.locator('[data-el="mak-zoom"] button', { hasText: 'Dopasuj' }).click(); await page.waitForTimeout(200); }
// zoom w widokach 45°, 3D, z boku, z gory (uzytkownik 2026-11-22: „w 45 i 3d oddalanie widoku poniżej 100% nie działa”)
for (const w of ['iso', '3d', 'bok', 'gora']) {
  const szer = async (z) => { await page.evaluate(([w, z]) => { localStorage.setItem('mp-mak-zoom', JSON.stringify({ pow: false, z })); localStorage.setItem('mp-mak-widok', w); }, [w, z]);
    await page.reload({ waitUntil: 'networkidle' }); await page.waitForTimeout(700);
    return page.evaluate(() => { const s = document.querySelector('[data-el=mak-widok-inny] svg'); return s ? Math.round(s.getBoundingClientRect().width) : 0; }); };
  const a = await szer(0.5), b = await szer(1), c = await szer(2);
  ok(`widok ${w}: 50% / 100% / 200% — rysunek mniejszy i większy`, a > 0 && Math.abs(a * 2 - b) < 4 && Math.abs(c - b * 2) < 4, `${a} / ${b} / ${c}`);
}
await page.evaluate(() => { localStorage.setItem('mp-mak-zoom', JSON.stringify({ pow: false, z: 1 })); localStorage.setItem('mp-mak-widok', 'przod'); });
await page.reload({ waitUntil: 'networkidle' }); await page.waitForTimeout(700);
console.log('== 2026-11-22: „Wczytaj plik” — pytanie: nowe pomieszczenie / zastąp projekt ==');
{ const fs = await import('fs'), plik = '/tmp/mp-test-import.json';
  const inny = JSON.parse(JSON.stringify(await proj())); inny.name = 'Pokój dziecka';
  fs.writeFileSync(plik, JSON.stringify(inny));
  const przed = await proj();
  await page.evaluate(() => localStorage.setItem('mp-tryb', 'techniczny')); await page.reload({ waitUntil: 'networkidle' }); await page.waitForTimeout(1000);
  await page.locator('input[type="file"]').first().setInputFiles(plik); await page.waitForTimeout(800);
  const of = page.locator('[data-el="import-oferta"]');
  ok('wczytanie pliku przy otwartym projekcie: pytanie „Dodaj jako nowe pomieszczenie / Zastąp cały projekt / Anuluj” (projekt bez zmian)', (await of.count()) === 1
    && (await page.locator('[data-el="import-dolacz"]').count()) === 1 && (await page.locator('[data-el="import-zastap"]').count()) === 1 && (await proj()).items.length === przed.items.length);
  await page.locator('[data-el="import-dolacz"]').click();
  const po = await czekaj(`(p.rooms || []).length === ${(przed.rooms || []).length + (inny.rooms || []).length}`);
  const idsC = (po.runs || []).map((r) => r.id);
  ok('„Dodaj jako nowe pomieszczenie”: pomieszczenia i szafki obu projektów, ciągi z nowymi numerami, nazwa pomieszczenia z pliku', po.items.length === przed.items.length + inny.items.length
    && new Set(idsC).size === idsC.length && (po.rooms || []).some((r) => /^Pokój dziecka/.test(r.name)) && po.items.slice(przed.items.length).every((it) => !it.runId || idsC.includes(it.runId)),
    JSON.stringify({ rooms: po.rooms, runs: idsC, n: po.items.length })); }

ok('bez błędów strony', !errors.length, errors.join(' | '));
console.log(bledy ? `\nBLEDOW: ${bledy}` : '\nWSZYSTKO OK');
await browser.close();
process.exit(bledy ? 1 : 0);
