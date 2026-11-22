// Makieta — uwagi uzytkownika 2026-11-10 (lista po pierwszych testach): zawiasy → „2 drzwi w kolumnie”, okienko polki
// (swiatlo pod i nad, „Usuń tę półkę”, prawy przycisk), klocki „Półka” / „Drążek” nad karta Polek (polka w miejscu
// upuszczenia), Drzwi: zawiasy z lewej / z prawej i lustro, klocki lustro / uchwyt / tip-on, „Dodaj” zwiniete,
// „Elementy szafki” w menu prawego przycisku, „Widok” (z boku / z gory / 3D), szczegolowa: wzmocnienia na rysunku
// (klik → karta Wzmocnienia), mocowanie polek, plan kolizji, nowy ciag z szafki wolnostojacej, rysunek z gory
// (wieniec na wierzchu).
import pw from './pw.mjs';
const { chromium } = pw;
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const page = await (await browser.newContext({ viewport: { width: 1500, height: 950 } })).newPage();
const errors = [];
page.on('pageerror', (e) => errors.push('[pageerror] ' + e.message));
page.on('console', (m) => { if (m.type() === 'error' && !/favicon|404/.test(m.text())) errors.push('[console] ' + m.text()); });
let bledy = 0;
const ok = (l, c, e = '') => { if (!c) bledy++; console.log((c ? '  OK   ' : '  BLAD ') + l + (e ? ' — ' + e : '')); };
const URL = 'http://127.0.0.1:5205/mebloprojekt-app.html';
const start = async (tryb, zmien) => {
  await page.goto(URL, { waitUntil: 'networkidle' });
  await page.evaluate(() => { try { localStorage.clear(); } catch (e) {} });
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForFunction(() => !!localStorage.getItem('szafki:projekt'), null, { timeout: 10000 });
  await page.evaluate(([tryb, src]) => {
    const p = JSON.parse(localStorage.getItem('szafki:projekt'));
    if (src) new Function('p', src)(p);
    localStorage.setItem('szafki:projekt', JSON.stringify(p));
    localStorage.setItem('mp-tryb', tryb);
    localStorage.setItem('mp-mak-zoom', JSON.stringify({ pow: false, z: 1 }));
  }, [tryb, zmien || '']);
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(1200);
};
const proj = () => page.evaluate(() => JSON.parse(localStorage.getItem('szafki:projekt')));
const czekaj = async (f) => { await page.waitForFunction((src) => { const p = JSON.parse(localStorage.getItem('szafki:projekt')); try { return new Function('p', 'return ' + src)(p); } catch (e) { return false; } }, f, { timeout: 5000 }).catch(() => {}); return proj(); };
const zakl = async (k) => { const b = page.locator(`[data-el="makieta"] nav [data-zakl="${k}"]`);
  if ((await b.getAttribute('aria-pressed')) !== 'true' || !(await page.locator('[data-el="mak-karta-panel"]').count())) await b.click(); await page.waitForTimeout(300); };
const PRZOD = '[data-el="makieta"] svg:not([data-el="makieta-wolnostojace-zgory"]) [data-el="makieta-szafka"]';
const kol0 = (p) => p.items[0].cab.levels[0].cols[0];
// szafa 600 × 2000, jedne drzwi, 2 zawiasy wpisane recznie, 3 polki
const SZAFA = `const it = p.items[0]; it.cab.name = 'Szafa'; it.cab.W = 600; it.cab.H = 2000; it.cab.D = 600;
  const k = it.cab.levels[0].cols[0]; k.kind = 'doors'; k.doors = 1; k.hinges = [2]; k.shelfTargets = [null, null, null, null]; delete k.drazki;
  it.cab.levels = [{ h: null, cols: [k] }]; p.active = 0;`;

console.log('== zawiasy: „2 drzwi w kolumnie” ==');
await start('techniczny', SZAFA);
const uw = await page.locator('body').innerText();
ok('uwaga podpowiada dwoje drzwi (po 3 zawiasy)', /za mało zawiasów wg tabeli GTV — 2 zamiast 4/.test(uw) && /Dwoje drzwi po \d+ mm .*po 3 zawiasy/.test(uw));
const b2 = page.locator('button', { hasText: /^2 drzwi w kolumnie \(po 3 zawiasy\)$/ }).first();
ok('przycisk „2 drzwi w kolumnie (po 3 zawiasy)”', (await b2.count()) === 1);
await b2.click();
let p = await czekaj('p.items[0].cab.levels[0].cols[0].doors === 2');
ok('po kliknięciu: 2 drzwi, po 3 zawiasy', kol0(p).doors === 2 && JSON.stringify(kol0(p).hinges) === '[3,3]', JSON.stringify(kol0(p).hinges));

console.log('== okienko półki: pod / nad, usuń, prawy przycisk ==');
await start('prosta', SZAFA);
await zakl('polki');
const uchwyt = (k) => page.locator(`${PRZOD} [data-u="polka"][data-k="${k}"]`).first();
{ const r = await uchwyt(1).boundingBox(); await page.mouse.click(r.x + r.width / 2, r.y + r.height / 2); await page.waitForTimeout(120); await page.mouse.click(r.x + r.width / 2, r.y + r.height / 2); await page.waitForTimeout(300); }
ok('dwuklik na półce: okienko z światłem pod i nad', (await page.locator('[data-el="mak-swiatlo"]').count()) === 1 && (await page.locator('[data-el="mak-swiatlo-nad"]').count()) === 1);
const nad0 = Number(await page.locator('[data-el="mak-swiatlo-nad"]').inputValue());
await page.locator('[data-el="mak-swiatlo-nad"]').fill(String(nad0 - 100));
await page.locator('[data-el="mak-swiatlo-ok"]').click();
p = await czekaj('p.items[0].cab.levels[0].cols[0].shelfTargets[1] != null');
ok('„nad nią” mniej o 100 — światło pod nią większe o 100', kol0(p).shelfTargets[1] != null, JSON.stringify(kol0(p).shelfTargets));
{ const r = await uchwyt(2).boundingBox(); await page.mouse.click(r.x + r.width / 2, r.y + r.height / 2, { button: 'right' }); await page.waitForTimeout(300); }
ok('prawy przycisk na półce — to samo okienko (Półka 3)', /Półka 3/.test(await page.locator('[data-el="mak-swiatlo"]').innerText().catch(() => '')));
await page.locator('[data-el="mak-polka-usun"]').click();
p = await czekaj('p.items[0].cab.levels[0].cols[0].shelfTargets.length === 3');
ok('„Usuń tę półkę”: 3 → 2 półki', kol0(p).shelfTargets.length === 3, JSON.stringify(kol0(p).shelfTargets));

console.log('== klocki „Półka” / „Drążek” nad kartą Półek ==');
ok('klocki nad kartą przy zaznaczonej szafce', (await page.locator('[data-el="mak-klocki-karty"] [data-el="mak-klocek"]').count()) === 2);
ok('bez przycisku „drążek” przy każdym świetle', !(await page.locator('[data-el="mak-drazek"]').count()));
{ const g = await page.locator(PRZOD).first().boundingBox(), pl = page.locator('[data-el="mak-plotno"]'), r = await pl.boundingBox();
  // w dolnej czwartej czesci szafki (najnizsze swiatlo)
  await page.locator('[data-el="mak-klocki-karty"] [data-el="mak-klocek"][data-id="polka"]').dragTo(pl, { force: true, targetPosition: { x: g.x + g.width / 2 - r.x, y: g.y + g.height * 0.85 - r.y } });
  await page.waitForTimeout(500); }
p = await czekaj('p.items[0].cab.levels[0].cols[0].shelfTargets.length === 4');
const st = kol0(p).shelfTargets;
ok('„Półka” upuszczona nisko: nowa półka w najniższym świetle (wpisane światło pod nią)', st.length === 4 && st[0] != null && st[0] < 500, JSON.stringify(st));
await page.locator('[data-el="mak-klocki-karty"] [data-el="mak-klocek"][data-id="drazek"]').click(); await page.locator('[data-el="mak-wybrany-teraz"]').click();
p = await czekaj('(p.items[0].cab.levels[0].cols[0].drazki || []).length === 1');
ok('klik „Drążek” — w najwyższym świetle', JSON.stringify(kol0(p).drazki) === '[3]', JSON.stringify(kol0(p).drazki));
ok('„usuń drążek” przy kolumnie z drążkiem', (await page.locator('[data-el="mak-drazek-usun"]').count()) === 1);

console.log('== Drzwi: zawiasy, lustro; Elementy szafki ==');
await zakl('drzwi');
await page.locator('[data-el="mak-zawias"][data-v="right"]').click();
p = await czekaj('p.items[0].cab.levels[0].cols[0].hinge === "right"');
ok('pojedyncze drzwi: zawiasy z prawej', kol0(p).hinge === 'right');
ok('zaznaczona strona „z prawej”', (await page.locator('[data-el="mak-zawias"][data-v="right"]').getAttribute('aria-pressed')) === 'true');
await page.locator('[data-el="mak-lustro"]').click();
p = await czekaj('(p.items[0].cab.levels[0].cols[0].mirrors || [])[0] === true');
ok('lustro na drzwiach', (kol0(p).mirrors || [])[0] === true);
await zakl('dodaj');
ok('„Dodaj”: sekcje zwinięte po kliknięciu', (await page.locator('[data-el="mak-dodaj"] [data-dodaj][aria-expanded="true"]').count()) === 0);
await page.locator('[data-el="mak-dodaj"] [data-dodaj="elementy"]').click(); await page.waitForTimeout(250);
ok('Elementy szafki: lustro, uchwyt, tip-on', (await page.locator('[data-el="mak-paleta"] [data-el="mak-klocek"][data-id="tipon"]').count()) === 1
  && (await page.locator('[data-el="mak-paleta"] [data-el="mak-klocek"][data-id="lustro"]').count()) === 1 && (await page.locator('[data-el="mak-paleta"] [data-el="mak-klocek"][data-id="uchwyt"]').count()) === 1);
await page.locator('[data-el="mak-paleta"] [data-el="mak-klocek"][data-id="tipon"]').click(); await page.locator('[data-el="mak-wybrany-teraz"]').click();
p = await czekaj('(p.items[0].cab.levels[0].cols[0].otwieranie || [])[0] === "tipon"');
ok('klik „Tip-on” — drzwi zaznaczonej szafki na tip-on', (kol0(p).otwieranie || [])[0] === 'tipon');
await zakl('szafka');
{ const g = await page.locator(PRZOD).first().boundingBox(); await page.mouse.click(g.x + g.width / 2, g.y + g.height / 2, { button: 'right' }); await page.waitForTimeout(300); }
ok('prawy przycisk na szafce: „Elementy szafki” w menu', (await page.locator('[data-el="mak-menu-co"] [data-mz="elementy"]').count()) === 1);
await page.locator('[data-el="mak-menu-co"] [data-mz="elementy"]').click(); await page.waitForTimeout(300);
ok('→ Dodaj z rozwiniętymi Elementami szafki', (await page.locator('[data-el="mak-dodaj"] [data-dodaj="elementy"]').getAttribute('aria-expanded')) === 'true');

console.log('== Widok ==');
for (const [v, sel] of [['bok', 'svg'], ['gora', 'svg'], ['3d', '[data-el="mak-3d"]']]) {
  await page.locator('[data-el="mak-widoki"]').first().click(); await page.waitForTimeout(150);
  await page.locator(`[data-v="${v}"]`).last().click(); await page.waitForTimeout(500);
  ok(`Widok „${v}”: podgląd`, (await page.locator(`[data-el="mak-widok-inny"][data-widok="${v}"] ${sel}`).count()) >= 1);
}
await page.locator('[data-el="mak-widoki"]').first().click(); await page.waitForTimeout(150);
await page.locator('[data-v="przod"]').last().click(); await page.waitForTimeout(400);
ok('z powrotem „Z przodu” — makieta z uchwytami', (await page.locator(`${PRZOD}`).count()) >= 1 && !(await page.locator('[data-el="mak-widok-inny"]').count()));

console.log('== szczegółowa: wzmocnienia, półki, kolizje, wymiary ==');
await start('szczegolowa', `${SZAFA} const k2 = p.items[0].cab.levels[0].cols[0];
  k2.rails = [{ orient: 'shelf', pos: 'top', side: 'left', h: 100, depth: 100, atDepth: 0, fromBack: false }];`);
ok('przełącznik „Wymiary” i wymiary szafki wolnostojącej', (await page.locator('[data-el="mak-przel"] [data-p="wymiary"]').count()) === 1 && (await page.locator('[data-el="mak-wymiary-szafki"]').count()) >= 1);
const wzm = page.locator('[data-el="mak-wzm-rys"]');
// wzmocnienia rysuja sie tylko przy otwartych frontach (uzytkownik 2026-11-11)
ok('fronty zamknięte: wzmocnień na rysunku nie ma', (await wzm.count()) === 0);
await page.locator('[data-el="mak-przel"] [data-p="fronty"]').click(); await page.waitForTimeout(400);
ok('wzmocnienie na rysunku z wymiarem', (await wzm.count()) === 1 && /leż\. 100/.test(await wzm.first().textContent()));
{ const r = await wzm.locator('rect').first().boundingBox(); await page.mouse.click(r.x + r.width / 2, r.y + r.height / 2); await page.waitForTimeout(400); }
ok('klik we wzmocnienie → karta Wzmocnienia', (await page.locator('[data-el="makieta"] nav [data-zakl="wzmocnienia"]').getAttribute('aria-pressed')) === 'true');
await zakl('polki');
await page.locator('[data-el="mak-polki-moc-szafka"][data-v="trojkaty"]').click();
p = await czekaj('p.items[0].cab.shelfMount === "trojkaty"');
ok('mocowanie półek całej szafki: trójkąty', p.items[0].cab.shelfMount === 'trojkaty');
await zakl('wyciecia');
const plan = page.locator('[data-el="mak-kolizje-plan"]');
{ const b = await plan.boundingBox(); await page.mouse.click(b.x + b.width * 0.75, b.y + b.height * 0.3); await page.waitForTimeout(400); }
p = await czekaj('(p.items[0].cab.obstacles || []).length === 1');
const ob = (p.items[0].cab.obstacles || [])[0] || {};
ok('klik na planie: element kolizyjny po prawej, przy tyle', ob.side === 'right' && ob.w === 80 && ob.fromBack < 300, JSON.stringify(ob));
{ const r = await page.locator('[data-el="mak-kolizja"]').first().boundingBox(); await page.mouse.click(r.x + r.width / 2, r.y + r.height / 2); await page.waitForTimeout(400); }
p = await proj();
ok('klik w istniejący element — tylko go wybiera (nie dodaje nowego)', (p.items[0].cab.obstacles || []).length === 1 && (await page.locator('[data-el="mak-kolizja-karta"]').count()) === 1);
await page.locator('[data-el="mak-kolizja-zab"][data-v="brak"]').click();
p = await czekaj('p.items[0].cab.obstacles[0].mask === false');
ok('zabudowa elementu: bez', p.items[0].cab.obstacles[0].mask === false);
await page.locator('[data-el="mak-kolizja-usun"]').click();
p = await czekaj('(p.items[0].cab.obstacles || []).length === 0');
ok('usuń element', (p.items[0].cab.obstacles || []).length === 0);
await zakl('szafka');
await page.locator('[data-el="mak-plyta-inne"][data-v="frontSameAsBoard"]').click();
p = await czekaj('p.items[0].cab.frontSameAsBoard === false');
ok('„Fronty inne niż korpus”', p.items[0].cab.frontSameAsBoard === false && (await page.locator('[data-el="mak-plyta"][data-k="front"]').count()) >= 8);

console.log('== ciąg z makiety ==');
await page.locator('[data-el="mak-do-ciagu"][data-v="nowy"]').click();
p = await czekaj('(p.runs || []).length === 1 && p.items[0].runId === p.runs[0].id');
ok('„nowy ciąg z tej szafki”', (p.runs || []).length === 1 && p.items[0].runId === p.runs[0].id, JSON.stringify((p.runs || []).map((r) => r.id)));
await zakl('dodaj');
await page.locator('[data-el="mak-dodaj"] [data-dodaj="szafki"]').click(); await page.waitForTimeout(250);
const gr = await page.locator('[data-el="mak-grupa"]').evaluateAll((els) => els.map((e) => e.dataset.grupa));
ok('w szafie (wysoka szafka): najpierw Szafa w zabudowie', gr[0] === 'Szafa w zabudowie', gr.join(' | '));

console.log('== rysunek z góry: wieniec na wierzchu ==');
const ost = await page.evaluate(() => { const g = document.querySelector('[data-el="mak-zgory"] [data-el="makieta-szafka"] g, [data-el="makieta-wolnostojace-zgory"] [data-el="makieta-szafka"]');
  if (!g) return null; const all = [...g.querySelectorAll('rect')]; const w = g.querySelector('[data-el="gora-z-gory"]'); return w ? all.length - 1 - all.indexOf(w) : -1; });
ok('wieniec rysowany na końcu (nad półkami i przegrodami)', ost != null && ost >= 0 && ost <= 2, String(ost));

console.log('bledy strony:', errors.length ? errors.join(' | ') : 'brak');
if (errors.length) bledy++;
console.log(bledy ? `${bledy} BLAD` : 'WSZYSTKO OK');
await browser.close();
process.exit(bledy ? 1 : 0);
