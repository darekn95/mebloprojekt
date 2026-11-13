// Makieta — runda 3 wyrownania z makieta „Dodaj” (uzytkownik 2026-11-13: „sprawdź wszystko po kolei, żeby już nie wracać”):
// pelna karta Szafka (front, szuflady, szuflada + drzwi, wnetrze — polki, przegroda, drazek, kolumny — swiatlo, wzmocnienia,
// podpowiedzi), biurko z kontenerem (szuflady 2 / 3 / 4, miejsce na nogi); klocki i „Co zrobi” w zakladkach, wzory i lista ciagu,
// przegroda (swiatlo, dwuklik); rysunek: okap–plyta, lodowka (luzy, wystaje), kaseta / komora, wyciecie, alarm sciany, Esc.
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
const PRZOD = { zgory: false, gorny: true, dolny: true, fronty: true, kolory: true, wymiary: true };
const cab0 = (p) => p.items[p.active || 0].cab;
const wcisniety = async (sel) => (await karta(sel).first().getAttribute('aria-pressed').catch(() => '')) === 'true';
const klik = async (sel) => { await karta(sel).first().click(); await page.waitForTimeout(350); };
let p;

console.log('== karta Szafka: front, szuflady, wnętrze, wzmocnienia (makieta „Dodaj”, runda 3) ==');
await start('prosta', CIAG, PRZOD);
await zakl('szafka');
ok('wiersz „Front” w karcie Szafka', await karta('[data-el="mak-sz-front-w"]').count() === 1);
ok('drzwi 1 wciśnięte (szafka z jednymi drzwiami)', await wcisniety('[data-el="mak-sz-front"][data-v="drzwi-1"]'));
ok('przyciski 1–4 szuflady i „Szuflada + drzwi”', await karta('[data-el="mak-sz-front"][data-v^="szu-"]').count() === 4 && await karta('[data-el="mak-sz-front"][data-v="szuflada-drzwi"]').count() === 1);
{ const t = await karta('[data-el="mak-sz-wys-hint"]').innerText().catch(() => '');
  ok('podpowiedź przy wysokości: „pod blat, jak cały ciąg dolny”', /pod blat, jak cały ciąg dolny/.test(t), t); }
ok('Wnętrze: półki −/+ i „Przegroda”, bez „Drążek” w szafce 720', await karta('[data-el="mak-sz-polki"]').count() === 2 && await karta('[data-el="mak-sz-przegroda"]').count() === 1 && await karta('[data-el="mak-sz-drazek"]').count() === 0);
ok('Wzmocnienia: leżące, stojące, pionowe, para pod blat', await karta('[data-el="mak-sz-wzm"]').count() === 4);

const n0 = (cab0(await proj()).levels[0].cols[0].shelfTargets || [null]).length;
await klik('[data-el="mak-sz-polki"][data-v="0:1"]');
p = await czekaj(`(p.items[0].cab.levels[0].cols[0].shelfTargets || [null]).length === ${n0 + 1}`);
ok('„+” dokłada półkę', (cab0(p).levels[0].cols[0].shelfTargets || [null]).length === n0 + 1);
ok('licznik półek pokazuje nową liczbę', (await karta('[data-el="mak-sz-polki-n"]').first().innerText()).trim() === String(n0));
await klik('[data-el="mak-sz-polki"][data-v="0:-1"]');
p = await czekaj(`(p.items[0].cab.levels[0].cols[0].shelfTargets || [null]).length === ${n0}`);
ok('„−” zabiera półkę', (cab0(p).levels[0].cols[0].shelfTargets || [null]).length === n0);

await klik('[data-el="mak-sz-wzm"][data-v="pionowe"]');
p = await czekaj('p.items[0].cab.levels[0].cols.every((k) => (k.rails || []).some((r) => r.orient === "vertical"))');
ok('„wzm. pionowe” — wzmocnienie pionowe w szafce', cab0(p).levels[0].cols.every((k) => (k.rails || []).some((r) => r.orient === 'vertical')));
ok('przycisk „wzm. pionowe” wciśnięty', await wcisniety('[data-el="mak-sz-wzm"][data-v="pionowe"]'));
await klik('[data-el="mak-sz-wzm"][data-v="pionowe"]');
p = await czekaj('!p.items[0].cab.levels[0].cols.some((k) => (k.rails || []).some((r) => r.orient === "vertical"))');
ok('drugi klik zdejmuje pionowe', !cab0(p).levels[0].cols.some((k) => (k.rails || []).some((r) => r.orient === 'vertical')));

console.log('== Przegroda w karcie Szafka i „Kolumny — światło” ==');
await klik('[data-el="mak-sz-przegroda"]');
p = await czekaj('p.items[0].cab.levels[0].cols.length === 2');
ok('„Przegroda” — dwie kolumny', cab0(p).levels[0].cols.length === 2);
ok('Kolumny — światło: pola lewa i prawa', await karta('[data-el="mak-kol-swiatlo-pole"]').count() === 2);
ok('półki osobno dla lewej i prawej kolumny', await karta('[data-el="mak-sz-polki"]').count() === 4);
{ const pole = karta('[data-el="mak-kol-swiatlo-pole"][data-v="0"]'); const w0 = Number(await pole.inputValue()), w1 = Number(await karta('[data-el="mak-kol-swiatlo-pole"][data-v="1"]').inputValue());
  ok('światła po równo (różnica ≤ 1 mm)', Math.abs(w0 - w1) <= 1, `${w0} / ${w1}`);
  await pole.fill('200'); await pole.press('Enter'); await page.waitForTimeout(400);
  p = await czekaj('p.items[0].cab.levels[0].cols[0].w === 200');
  ok('lewa = 200 → kolumna 1 ma 200 mm', cab0(p).levels[0].cols[0].w === 200);
  const nowaP = Number(await karta('[data-el="mak-kol-swiatlo-pole"][data-v="1"]').inputValue());
  ok('prawa przeliczona (suma bez zmian)', Math.abs(200 + nowaP - (w0 + w1)) <= 1, `${nowaP}`);
  const pp = karta('[data-el="mak-kol-swiatlo-pole"][data-v="1"]'); await pp.fill('50'); await pp.press('Enter'); await page.waitForTimeout(400);
  p = await proj();
  ok('prawa 50 (< 100) — nie przyjęte', cab0(p).levels[0].cols[0].w === 200); }
ok('„Przegroda na środek” widoczna po zmianie', await karta('[data-el="mak-przegroda-srodek"]').count() === 1);
await klik('[data-el="mak-przegroda-srodek"]');
p = await czekaj('p.items[0].cab.levels[0].cols.every((k) => k.w == null)');
ok('„Przegroda na środek” — szerokości auto', cab0(p).levels[0].cols.every((k) => k.w == null));
await klik('[data-el="mak-sz-przegroda"]');
p = await czekaj('p.items[0].cab.levels[0].cols.length === 1');
ok('drugi klik „Przegroda” — znów jedna kolumna', cab0(p).levels[0].cols.length === 1);

console.log('== szuflady i „Szuflada + drzwi” z karty Szafka ==');
await klik('[data-el="mak-sz-front"][data-v="szu-3"]');
p = await czekaj('p.items[0].cab.levels[0].cols[0].kind === "drawers"');
ok('„3 szuflady” — kolumna szuflad', cab0(p).levels[0].cols[0].kind === 'drawers' && cab0(p).levels[0].cols[0].drawers.length === 3);
{ const t = await karta('[data-el="mak-sz-szuflady-wys"]').innerText().catch(() => '');
  ok('podpowiedź „Wysokości szuflad od dołu: a · b · c mm”', /Wysokości szuflad od dołu: \d+ · \d+ · \d+ mm/.test(t), t); }
ok('„Same szuflady — półek ani przegrody tu nie ma”', await karta('[data-el="mak-sz-same-szuflady"]').count() === 1);
ok('przy samych szufladach bez półek i przegrody', await karta('[data-el="mak-sz-polki"]').count() === 0 && await karta('[data-el="mak-sz-przegroda"]').count() === 0);
await klik('[data-el="mak-sz-front"][data-v="szuflada-drzwi"]');
p = await czekaj('p.items[0].cab.levels.length === 2');
ok('„Szuflada + drzwi” — dwa poziomy', cab0(p).levels.length === 2);
ok('w karcie wciśnięte „Szuflada + drzwi”', await wcisniety('[data-el="mak-sz-front"][data-v="szuflada-drzwi"]'));
{ const t = await karta('[data-el="mak-sz-szd-hint"]').innerText().catch(() => '');
  ok('podpowiedź „Szuflada u góry, pod nią drzwi”', /Szuflada u góry, pod nią (drzwi|dwoje drzwi)/.test(t), t); }
ok('półki za drzwiami −/+', await karta('[data-el="mak-sz-polki"]').count() === 2);
await klik('[data-el="mak-sz-front"][data-v="drzwi-2"]');
p = await czekaj('p.items[0].cab.levels.length === 1 && p.items[0].cab.levels[0].cols[0].doors === 2');
ok('z „Szuflada + drzwi” na „2 drzwi” — jeden poziom, dwoje drzwi', cab0(p).levels.length === 1 && cab0(p).levels[0].cols[0].doors === 2 && cab0(p).levels[0].cols[0].kind !== 'drawers');

console.log('== szafa: drążek; słupek w kuchni bez szuflad ==');
await start('prosta', CIAG + `p.runs[0].zabudowa = 'szafa'; p.runs[0].worktop = false; p.items.forEach((x) => { x.cab.H = 2000; });`, PRZOD);
await zakl('szafka');
ok('szafa 2000: „Drążek” w Wnętrzu', await karta('[data-el="mak-sz-drazek"]').count() === 1);
await klik('[data-el="mak-sz-drazek"]');
p = await czekaj('(p.items[0].cab.levels[0].cols[0].drazki || []).length > 0');
ok('„Drążek” — drążek w kolumnie', (cab0(p).levels[0].cols[0].drazki || []).length > 0);
ok('szafa: tylko „wzm. pionowe”', await karta('[data-el="mak-sz-wzm"]').count() === 1);
await start('prosta', CIAG + `p.items[0].cab.H = 2000; p.items[0].cab.slupek = true;`, PRZOD);
await zakl('szafka');
ok('słupek w kuchni: bez przycisków szuflad', await karta('[data-el="mak-sz-front"][data-v^="szu-"]').count() === 0);
ok('słupek w kuchni: podpowiedź „W słupku szuflad nie ma”', await karta('[data-el="mak-sz-slupek-szuflady"]').count() === 1);

console.log('== biurko z kontenerem: szuflady 2 / 3 / 4, miejsce na nogi ==');
await start('prosta', CIAG + `p.runs[0].zabudowa = 'szafa'; p.runs[0].worktop = false;`, PRZOD);
await zakl('dodaj');
{ const sek = page.locator('[data-el="mak-dodaj"] [data-dodaj="szafki"]'); if ((await sek.getAttribute('aria-expanded').catch(() => 'true')) !== 'true') await sek.click().catch(() => {}); await page.waitForTimeout(200); }
await page.locator('[data-el="mak-paleta"] [data-el="mak-wzor"][data-id="biurkoK"]').click();
p = await czekaj('p.items.some((x) => x.cab.top && x.cab.top.mode === "blat" && x.cab.back === "none")');
await zakl('szafka');
ok('kontener: 3 szuflady wciśnięte', await wcisniety('[data-el="mak-kontener-sz"][data-v="3"]'));
await klik('[data-el="mak-kontener-sz"][data-v="4"]');
p = await czekaj('p.items[p.active].cab.levels[0].cols.some((k) => (k.segmenty || []).some((s) => s && s.kind === "drawers" && s.drawers.length === 4))');
ok('„4 szuflady” — kontener ma 4 szuflady', cab0(p).levels[0].cols.some((k) => (k.segmenty || []).some((s) => s && s.kind === 'drawers' && s.drawers.length === 4)));
{ const t = await karta('[data-el="mak-sz-kont-wys"]').innerText().catch(() => '');
  ok('wysokości szuflad kontenera od dołu (4 liczby)', /od dołu: \d+ · \d+ · \d+ · \d+ mm/.test(t), t); }
{ const t = await karta('[data-el="mak-sz-nogi"]').innerText().catch(() => '');
  ok('„Miejsce na nogi między bokiem a kontenerem: N mm”', /Miejsce na nogi między bokiem a kontenerem: \d+ mm/.test(t), t); }
{ const t = await karta('[data-el="mak-sz-wys-hint"]').innerText().catch(() => '');
  ok('biurko: „Do wierzchu blatu”', /Do wierzchu blatu/.test(t), t); }

console.log('== klocki nad kartą, „Co zrobi program” w każdej zakładce, wzory i lista ciągu w Szafce ==');
await start('prosta', CIAG, PRZOD);
for (const z of ['drzwi', 'szuflady', 'przegroda', 'polki']) {
  await zakl(z);
  ok(`zakładka ${z}: klocki nad kartą zaznaczonej szafki`, await page.locator('[data-el="mak-klocki-karty"] [data-el="mak-klocek"]').count() > 0);
  ok(`zakładka ${z}: „Co zrobi program” i „Całą szafkę … w zakładce Szafka”`, await karta('[data-el="mak-co-zrobi"]').count() === 1 && await karta('[data-el="mak-cala-w-szafce"]').count() === 1);
}
await zakl('szafka');
ok('Szafka: „Wzory szafek” nad kartą, zwinięte', await page.locator('[data-el="mak-wzory-przelacz"]').count() === 1 && (await page.locator('[data-el="mak-wzory-przelacz"]').getAttribute('aria-expanded')) === 'false');
await page.locator('[data-el="mak-wzory-przelacz"]').click(); await page.waitForTimeout(300);
ok('rozwinięte — miniatury wzorów', await page.locator('[data-el="mak-wzory-nad-karta"] [data-el="mak-wzor"]').count() > 3);
await page.locator('[data-el="mak-wzory-przelacz"]').click(); await page.waitForTimeout(200);
{ const t = await page.locator('[data-el="mak-lista-ciagu"]').innerText().catch(() => '');
  ok('pod kartą: „Ciąg dolny (2)” z obiema szafkami', /Ciąg dolny \(2\)/i.test(t) && /Szafka 1/.test(t) && /Szafka 2/.test(t), t.replace(/\s+/g, ' ')); }
await page.locator('[data-el="mak-lista-szafka"][data-idx="1"] [data-el="mak-lista-wybierz"]').click(); await page.waitForTimeout(300);
p = await czekaj('p.active === 1');
ok('klik w „Szafka 2” na liście — zaznaczona', p.active === 1);
ok('karta pokazuje „Szafka 2”', /Szafka 2/.test(await page.locator('[data-el="makieta-karta"] h3').first().innerText().catch(() => '')));
await page.locator('[data-el="mak-lista-szafka"][data-idx="0"] [data-el="mak-lista-usun"]').click(); await page.waitForTimeout(300);
p = await czekaj('p.items.length === 1');
ok('× przy „Szafka 1” — usunięta, „Szafka 2” zostaje', p.items.length === 1 && p.items[0].cab.name === 'Szafka 2');

console.log('== zakładka Przegroda: światło kolumn, dwuklik na przegrodzie ==');
await start('prosta', CIAG + `p.items[0].cab.levels[0].cols.push(JSON.parse(JSON.stringify(p.items[0].cab.levels[0].cols[0])));`, PRZOD);
await zakl('przegroda');
ok('Przegroda: „Kolumny — światło” z polami lewa / prawa', await karta('[data-el="mak-kol-swiatlo-pole"]').count() === 2);
ok('podpowiedź „kliknij ją dwa razy i wpisz”', /kliknij ją dwa razy i wpisz/.test(await karta('[data-el="mak-kol-swiatlo"]').innerText().catch(() => '')));
{ const h = page.locator('[data-el="makieta-rysunek"] [data-u="przeg"]').first(); const r = await h.boundingBox();
  if (r) { await page.mouse.click(r.x + r.width / 2, r.y + r.height / 2); await page.waitForTimeout(120); await page.mouse.click(r.x + r.width / 2, r.y + r.height / 2); await page.waitForTimeout(350); }
  ok('dwuklik na przegrodzie — okienko z lewą i prawą', await page.locator('[data-el="mak-przegroda-okno"]').count() === 1 && await page.locator('[data-el="mak-przeg-p"]').count() === 1, r ? '' : 'brak uchwytu przegrody'); }
{ const pole = page.locator('[data-el="mak-przeg-l"]'); await pole.fill('250'); await pole.press('Enter'); await page.waitForTimeout(400); }
p = await czekaj('p.items[0].cab.levels[0].cols[0].w === 250');
ok('wpisane 250 z lewej — kolumna 1 ma 250 mm', cab0(p).levels[0].cols[0].w === 250, JSON.stringify(cab0(p).levels[0].cols.map((k) => k.w)));
ok('okienko zamknięte po Enter', await page.locator('[data-el="mak-przegroda-okno"]').count() === 0);
{ const h = page.locator('[data-el="makieta-rysunek"] [data-u="przeg"]').first(); const r = await h.boundingBox();
  if (r) { await page.mouse.click(r.x + r.width / 2, r.y + r.height / 2, { button: 'right' }); await page.waitForTimeout(350); }
  ok('prawy przycisk na przegrodzie — to samo okienko', await page.locator('[data-el="mak-przegroda-okno"]').count() === 1); }
await page.locator('[data-el="mak-przeg-srodek"]').click(); await page.waitForTimeout(400);
p = await czekaj('p.items[0].cab.levels[0].cols[0].w !== 250');
{ const g = cab0(p).levels[0].cols; const wL = Number(await karta('[data-el="mak-kol-swiatlo-pole"][data-v="0"]').inputValue()), wP = Number(await karta('[data-el="mak-kol-swiatlo-pole"][data-v="1"]').inputValue());
  ok('„Na środek” — kolumny po równo', g[0].w !== 250 && Math.abs(wL - wP) <= 1, `${JSON.stringify(g.map((k) => k.w))} ${wL}/${wP}`); }
{ const h = page.locator('[data-el="makieta-rysunek"] [data-u="przeg"]').first(); const r = await h.boundingBox();
  if (r) { await page.mouse.click(r.x + r.width / 2, r.y + r.height / 2, { button: 'right' }); await page.waitForTimeout(350); }
  await page.keyboard.press('Escape'); await page.waitForTimeout(250);
  ok('Esc zamyka okienko przegrody', await page.locator('[data-el="mak-przegroda-okno"]').count() === 0); }

console.log('== rysunek jak w makiecie: okap–płyta, lodówka (luzy, wystaje), kaseta / komora, wycięcie, alarm ściany, Esc ==');
const PARA = `p.items.forEach((x) => { x.cab.joints = { ...(x.cab.joints || {}), topL: 'none', topR: 'none' };
  x.cab.levels[x.cab.levels.length - 1].cols.forEach((c) => { c.rails = [{ orient: 'shelf', pos: 'top', depth: 100, atDepth: 0, fromBack: false, paraPodBlat: true },
    { orient: 'front', pos: 'top', h: 100, atDepth: 0, fromBack: true, paraPodBlat: true }]; }); });`;
const RYS = (opcje = '') => CIAG + PARA + `p.items[0].cab.blatWyciecia = [{ typ: 'plyta', rozm: '60' }]; p.items[1].cab.blatWyciecia = [{ typ: 'zlew', rozm: '1' }];
  p.runs.push({ id: 'g1', name: 'Ściana 1 — góra', roomId: p.runs[0].roomId, tier: 'gorny', wall: 'r1' });
  [0, 1].forEach((k) => { const g = JSON.parse(JSON.stringify(p.items[1])); g.cab.name = 'Górna ' + (k + 1); g.cab.H = 720; g.cab.D = 320; g.cab.blatWyciecia = [];
    g.cab.levels = [{ h: null, cols: [{ kind: 'doors', doors: 1, w: null, shelfTargets: [null] }] }];
    g.cab.joints = { ...(g.cab.joints || {}), topL: 'between', topR: 'between' }; g.cab.legs = { ...(g.cab.legs || {}), on: false }; g.cab.plinth = { ...(g.cab.plinth || {}), on: false };
    if (k === 0) g.cab.okap = { typ: 'podszafkowy' }; g.runId = 'g1'; p.items.push(g); });
  const l = JSON.parse(JSON.stringify(p.items[1])); l.cab = { ...l.cab, name: 'Lodówka', W: 700, H: 2000, blatWyciecia: [], sprzetCiagu: { typ: 'lodowka' } }; l.runId = 'r1'; p.items.push(l); ${opcje}`;
await start('szczegolowa', RYS(), { zgory: true, gorny: true, dolny: true, fronty: true, kolory: true, wymiary: true });
{ const od = await page.locator('[data-el="mak-okap-plyta"]').first().getAttribute('data-od').catch(() => null);
  const t = await page.locator('[data-el="mak-okap-plyta"] text').first().textContent().catch(() => '');
  ok('z przodu: wymiar od płyty do okapu (poniżej 650 z „< 650”)', od != null && Number(od) > 0 && t.trim() === (Number(od) < 650 ? `${od} < 650` : String(Number(od))), `${od} / ${t}`); }
{ const luzy = await page.locator('[data-el="lodowka-miejsce-rys"] [data-el="lodowka-luz"]').evaluateAll((a) => a.map((x) => Number(x.getAttribute('data-v'))));
  ok('lodówka z przodu: miejsce przerywane, luzy 50 / 50 / 100', await page.locator('[data-el="lodowka-miejsce-rys"]').count() === 1 && JSON.stringify(luzy) === '[50,50,100]', JSON.stringify(luzy)); }
{ const t = await page.locator('[data-el="lodowka-wystaje"]').first().textContent().catch(() => '');
  ok('z góry: „wystaje N przed korpusy” przy lodówce', /^wystaje \d+ przed korpusy$/.test(t.trim()), t); }
ok('kaseta płyty wchodzi we wzmocnienie — z przodu na pomarańczowo', await page.locator('[data-el="wyciecie-front"][data-typ="plyta"] [data-el="wyciecie-pod-blatem"][data-zle="1"]').count() >= 1);
ok('komora zlewu: głębokość pod blatem podpisana (200)', (await page.locator('[data-el="wyciecie-front"][data-typ="zlew"] [data-el="wyciecie-glebokosc"]').first().textContent().catch(() => '')).trim() === '200');
await zakl('dodaj');
{ const agd = page.locator('[data-el="mak-dodaj"] [data-dodaj="agd"]'); if ((await agd.getAttribute('aria-expanded').catch(() => 'true')) !== 'true') await agd.click().catch(() => {}); await page.waitForTimeout(300); }
await page.locator('[data-el="mak-agd-lista"] button').filter({ hasText: /Płyta/ }).first().click(); await page.waitForTimeout(500);
{ const t = await page.locator('[data-el="mak-zgory"] [data-el="wyciecie-wymiary"]').textContent().catch(() => '');
  ok('z góry: zaznaczona płyta — wymiar od początku blatu i „od przodu N”', await page.locator('[data-el="mak-zgory"] [data-el="wyciecie-wymiary"]').count() === 1 && /od przodu \d+/.test(t), t.replace(/\s+/g, ' ')); }

await start('szczegolowa', RYS(`p.runs[1].clearance = 900; p.items[0].cab.blatWyciecia = [{ typ: 'plyta', rozm: '90' }]; p.runs[0].wallW = 1000;`), { zgory: true, gorny: true, dolny: true, fronty: true, kolory: true, wymiary: true });
{ const od = Number(await page.locator('[data-el="mak-okap-plyta"]').first().getAttribute('data-od').catch(() => 0));
  const t = await page.locator('[data-el="mak-okap-plyta"] text').first().textContent().catch(() => '');
  ok('okap 750 nad płytą — sama liczba, bez „< 650”', od === 750 && t.trim() === '750', `${od} / ${t}`); }
ok('płyta 90 na szafce 600 — z góry „szersza niż szafka”', await page.locator('[data-el="wyciecie-za-szerokie"]').count() >= 1);
{ const t = await page.locator('[data-el="mak-alarm-sciana"]').innerText().catch(() => '');
  ok('alarm: „Ciąg nie mieści się na ścianie — N mm na ścianie 1000 mm, brakuje N mm”', /Ciąg nie mieści się na ścianie — \d+ mm na ścianie 1000 mm, brakuje \d+ mm/.test(t), t.replace(/\s+/g, ' '));
  ok('alarm: „Usuń „Lodówka wolnostojąca”” (ostatnia w ciągu)', /Usuń „Lodówka wolnostojąca”/.test(t)); }
await page.locator('[data-el="mak-alarm-poszerz"]').click(); await page.waitForTimeout(300);
p = await czekaj('p.runs[0].wallW > 1000');
ok('„Poszerz ścianę do N mm” — ściana = długość ciągu, alarm znika', p.runs[0].wallW >= 1900 && await page.locator('[data-el="mak-alarm-sciana"]').count() === 0, String(p.runs[0].wallW));
await start('prosta', RYS(`p.runs[0].wallW = 1000;`), PRZOD);
{ const n0 = (await proj()).items.filter((x) => x.runId === 'r1').length;
  await page.locator('[data-el="mak-alarm-usun"]').click(); await page.waitForTimeout(300);
  p = await czekaj(`p.items.filter((x) => x.runId === 'r1').length === ${n0 - 1}`);
  ok('„Usuń …” w alarmie — ostatnia pozycja ciągu usunięta', p.items.filter((x) => x.runId === 'r1').length === n0 - 1 && !p.items.some((x) => x.cab.sprzetCiagu && x.cab.sprzetCiagu.typ === 'lodowka')); }
await start('prosta', CIAG, PRZOD);
await zakl('polki');
{ const h = page.locator('[data-el="makieta-rysunek"] [data-u="polka"]').first(); const r = await h.boundingBox();
  if (r) { await page.mouse.move(r.x + r.width / 2, r.y + r.height / 2); await page.mouse.down(); for (let i = 1; i <= 6; i++) await page.mouse.move(r.x + r.width / 2, r.y + r.height / 2 - i * 12);
    await page.waitForTimeout(150); await page.keyboard.press('Escape'); await page.waitForTimeout(150); await page.mouse.up(); await page.waitForTimeout(700); }
  p = await proj();
  ok('Esc w trakcie przeciągania półki — nic się nie zmienia', r && (cab0(p).levels[0].cols[0].shelfTargets || []).every((v) => v == null), JSON.stringify(cab0(p).levels[0].cols[0].shelfTargets)); }

console.log('== karta szafki górnej jak w makiecie (front bez szuflad, bez drążka i wzmocnień) ==');
await start('prosta', CIAG + `p.runs.push({ id: 'g1', name: 'Ściana 1 — góra', roomId: p.runs[0].roomId, tier: 'gorny', wall: 'r1' });
  const g = JSON.parse(JSON.stringify(p.items[1])); g.cab.name = 'Górna 1'; g.cab.H = 720; g.cab.D = 320; g.cab.levels = [{ h: null, cols: [{ kind: 'doors', doors: 1, w: null, shelfTargets: [null] }] }];
  g.runId = 'g1'; p.items.push(g); p.active = 2;`, PRZOD);
await zakl('szafka');
ok('górna: front 1 / 2 drzwi, Klapa ↑, Bez frontu (bez szuflad i „Klapa ↓”)', JSON.stringify(await karta('[data-el="mak-sz-front"]').evaluateAll((a) => a.map((x) => x.getAttribute('data-v')))) === '["drzwi-1","drzwi-2","klapa-gora","otwarta"]',
  JSON.stringify(await karta('[data-el="mak-sz-front"]').evaluateAll((a) => a.map((x) => x.getAttribute('data-v')))));
ok('górna: półki i „Przegroda”, bez „Drążek” i wzmocnień', await karta('[data-el="mak-sz-polki"]').count() === 2 && await karta('[data-el="mak-sz-przegroda"]').count() === 1
  && await karta('[data-el="mak-sz-drazek"]').count() === 0 && await karta('[data-el="mak-sz-wzm"]').count() === 0);
await zakl('drzwi');
ok('górna, zakładka Drzwi: „Wysokość i całą szafkę górną zmienisz w zakładce Szafka.”', /Wysokość i całą szafkę górną zmienisz w zakładce Szafka/.test(await karta('[data-el="mak-cala-w-szafce"]').innerText().catch(() => '')));

ok('bez błędów strony', errors.length === 0, errors.slice(0, 3).join(' | '));
await browser.close();
console.log(bledy ? `\nBLEDOW: ${bledy}` : '\nWSZYSTKO OK');
process.exit(bledy ? 1 : 0);
