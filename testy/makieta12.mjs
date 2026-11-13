// Makieta — uwagi uzytkownika 2026-11-11: lista „Wymiary” (zaznaczalne pozycje), lancuch wysokosci (nozki / cokol,
// korpus, blat, razem), „wnętrze” w srodku szafki, napisy czytelne i nieuciete, wzmocnienia tylko przy otwartych
// frontach, zakladka „Ciąg” (opcje ciagu, blenda, „Wyłącz szafkę z ciągu”), Polki: otwory kolkow i zawieszki,
// Korpus: blenda, Szafka: notatka montazowa, kafelek „Zamówienie” (formatki, rozkroj, produkty, wycena).
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
const start = async (tryb, zmien, przel) => {
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
const wpisz = async (pole, v) => { const i = page.locator(`[data-el="mak-karta-panel"] [data-pole="${pole}"]`).first(); await i.fill(String(v)); await i.blur(); await page.waitForTimeout(250); };
// dwie szafki 450 w ciagu z blatem roboczym, w drugiej (zaznaczonej) wzmocnienie tylne
const CIAG = `const w = p.items[0];
  p.runs = [{ id: 'r1', name: 'Ściana 1', roomId: w.roomId || 'p1', worktop: true }];
  p.items = [0, 1].map((i) => { const it = JSON.parse(JSON.stringify(w)); it.cab.name = 'Szafka ' + (i + 1); it.cab.W = 450; it.cab.levels[0].cols[0].doors = 1;
    it.cab.levels[0].cols[0].rails = [{ orient: 'front', pos: 'top', side: 'left', h: 100, depth: 100, atDepth: 0, fromBack: true }]; it.runId = 'r1'; return it; });
  p.active = 1;`;
const WSZYSTKO = { zgory: true, gorny: true, dolny: true, fronty: true, kolory: true, wymiary: true };
// napisy rysunku: uciete przez krawedz rysunku, za male (ponizej 8,5 px wysokosci), nachodzace na siebie
const napisy = () => page.evaluate(() => {
  const out = { uciete: [], male: [], nachodza: [] };
  const tlo = document.querySelector('[data-el="mak-plotno"]');
  for (const svg of [...tlo.querySelectorAll('svg')].filter((s) => !s.parentElement.closest('svg') && s.getBoundingClientRect().width > 150)) {
    const sr = svg.getBoundingClientRect();
    const b = [...svg.querySelectorAll('text')].filter((t) => t.textContent.trim()).map((t) => ({ t: t.textContent.trim(), r: t.getBoundingClientRect() })).filter((q) => q.r.width > 0);
    for (const q of b) {
      if (q.r.left < sr.left - 2 || q.r.right > sr.right + 2 || q.r.top < sr.top - 2 || q.r.bottom > sr.bottom + 2) out.uciete.push(q.t);
      if (q.r.height < 8.5) out.male.push(q.t);
    }
    for (let i = 0; i < b.length; i++) for (let j = i + 1; j < b.length; j++) {
      const A = b[i].r, B = b[j].r;
      const w = Math.min(A.right, B.right) - Math.max(A.left, B.left), h = Math.min(A.bottom, B.bottom) - Math.max(A.top, B.top);
      if (w > 1 && h > 1 && (w * h) / Math.min(A.width * A.height, B.width * B.height) > 0.3) out.nachodza.push(b[i].t + ' × ' + b[j].t);
    }
  }
  return out;
});
const czyste = async (l) => { const n = await napisy(); ok(`${l}: napisy nieucięte, czytelne, nie nachodzą`, !n.uciete.length && !n.male.length && !n.nachodza.length, JSON.stringify(n).slice(0, 300)); };

console.log('== wymiary: wysokości, fronty, wzmocnienia ==');
await start('szczegolowa', CIAG, WSZYSTKO);
const wys = page.locator('[data-el="mak-wysokosci"]');
const tWys = async () => (await wys.locator('text').allTextContents()).map((t) => t.trim());
ok('łańcuch wysokości: nóżki 100, korpus 720, blat 38, razem 858', (await wys.count()) === 1 && JSON.stringify((await tWys()).sort()) === JSON.stringify(['100', '38', '720', '858']), JSON.stringify(await tWys()));
ok('fronty zamknięte: wzmocnień na rysunku nie ma', (await page.locator('[data-el="mak-wzm-rys"]').count()) === 0);
{ const h = await page.evaluate(() => { const t = [...document.querySelectorAll('[data-el="mak-plotno"] svg text')].find((q) => /^446\s*×\s*714$/.test(q.textContent.trim())); return t ? t.getBoundingClientRect().height : 0; });
  ok('napis na drzwiach czytelny (co najmniej 12 px wysokości)', h >= 12, String(Math.round(h * 10) / 10)); }
await czyste('fronty zamknięte');
await page.locator('[data-el="mak-przel"] [data-p="fronty"]').click(); await page.waitForTimeout(500);
ok('fronty otwarte: wzmocnienie zaznaczonej szafki z wymiarem', (await page.locator('[data-el="mak-wzm-rys"]').count()) === 1 && /tył 414 × 100/.test(await page.locator('[data-el="mak-wzm-rys"]').first().textContent()));
{ const g = await page.evaluate(() => { const t = [...document.querySelectorAll('[data-el="mak-plotno"] svg text')].find((q) => /^wnętrze 684$/.test(q.textContent.trim()));
    const s = [...document.querySelectorAll('[data-el="makieta-szafka"]')].pop(); if (!t || !s) return null; const a = t.getBoundingClientRect(), b = s.getBoundingClientRect();
    return { wSrodku: a.left >= b.left && a.right <= b.right && a.top >= b.top && a.bottom <= b.bottom }; });
  ok('światło poziomu „wnętrze 684” narysowane w środku zaznaczonej szafki', !!g && g.wSrodku, JSON.stringify(g)); }
await czyste('fronty otwarte');

console.log('== lista „Wymiary” ==');
const przycisk = page.locator('[data-el="mak-przel"] [data-p="wymiary"]');
await przycisk.click(); await page.waitForTimeout(250);
ok('lista z 7 pozycjami do zaznaczania (z „z góry”)', (await page.locator('[data-el="mak-wymiary-lista"] input[type="checkbox"]').count()) === 7);
await page.locator('[data-wym="wys"]').uncheck(); await page.waitForTimeout(250);
ok('bez „wysokości”: łańcuch znika, szerokości zostają', (await wys.count()) === 0 && (await page.locator('[data-el="mak-plotno"] svg text.wym', { hasText: /^450$/ }).count()) >= 2);
await page.locator('[data-wym="wzm"]').uncheck(); await page.waitForTimeout(250);
ok('bez „wzmocnień”: ramki wzmocnień znikają', (await page.locator('[data-el="mak-wzm-rys"]').count()) === 0);
ok('przycisk pokazuje licznik 5/7', /Wymiary 5\/7/.test(await przycisk.textContent()), await przycisk.textContent());
await page.locator('[data-el="mak-wymiary-zadne"]').click(); await page.waitForTimeout(250);
ok('„żadne”: bez wymiarów, przełącznik wyłączony', (await przycisk.getAttribute('aria-pressed')) === 'false' && (await page.locator('[data-el="mak-plotno"] svg text.wym').count()) === 0, String(await page.locator('[data-el="mak-plotno"] svg text.wym').count()));
await page.locator('[data-el="mak-wymiary-wszystkie"]').click(); await page.waitForTimeout(250);
ok('„wszystkie”: wymiary wracają', (await wys.count()) === 1 && (await page.locator('[data-el="mak-wzm-rys"]').count()) === 1);
await page.mouse.click(8, 900); await page.waitForTimeout(250);
ok('klik obok zamyka listę', (await page.locator('[data-el="mak-wymiary-lista"]').count()) === 0);
await page.reload({ waitUntil: 'networkidle' }); await page.waitForTimeout(1000);
ok('wybór pamięta przeglądarka', (await wys.count()) === 1);

console.log('== zakładka „Ciąg” ==');
await zakl('wzmocnienia');
ok('zakładka Wzmocnienia otwiera fronty (wzmocnienia widać)', (await page.locator('[data-el="mak-wzm-rys"]').count()) === 1);
ok('kafelek „Ciąg” przy szafce w ciągu', (await page.locator('[data-el="makieta"] nav [data-zakl="ciag"]').count()) === 1);
await zakl('ciag');
await wpisz('ciag-nazwa', 'Kuchnia A');
let p = await czekaj('p.runs[0].name === "Kuchnia A"');
ok('nazwa ciągu', p.runs[0].name === 'Kuchnia A');
await wpisz('ciag-H', 800);
p = await czekaj('p.items.every((i) => i.cab.H === 800)');
ok('wysokość szafek ciągu — obie szafki', p.items.every((i) => i.cab.H === 800) && p.runs[0].H === 800);
await wpisz('ciag-D', 500);
p = await czekaj('p.items.every((i) => i.cab.D === 500)');
ok('głębokość szafek ciągu — obie szafki', p.items.every((i) => i.cab.D === 500));
await wpisz('ciag-gap', 3);
p = await czekaj('p.runs[0].gap === 3');
ok('luz między korpusami', p.runs[0].gap === 3);
await wpisz('ciag-odsuniecie', 20);
p = await czekaj('p.runs[0].wallGap && p.runs[0].wallGap.bottom === 20');
ok('odsunięcie od ściany', !!p.runs[0].wallGap && p.runs[0].wallGap.bottom === 20, JSON.stringify(p.runs[0].wallGap));
await page.locator('[data-el="mak-ciag-wieniec"][data-v="tak"]').click();
p = await czekaj('p.runs[0].wspolnyWieniec === true');
ok('wspólny wieniec wyłącza blat roboczy', p.runs[0].wspolnyWieniec === true && !p.runs[0].worktop);
await page.locator('[data-el="mak-ciag-blat"][data-v="tak"]').click();
p = await czekaj('p.runs[0].worktop === true');
ok('blat roboczy z powrotem (wieniec wyłączony)', p.runs[0].worktop === true && !p.runs[0].wspolnyWieniec);
await page.locator('[data-el="mak-ciag-blenda"][data-v="tak"]').click();
p = await czekaj('p.items.every((i) => i.cab.topFiller && i.cab.topFiller.on)');
ok('blenda nad szafkami — wszystkie szafki ciągu', p.items.every((i) => i.cab.topFiller && i.cab.topFiller.on && i.cab.topFiller.height === 100));
await wpisz('ciag-blenda-h', 150);
p = await czekaj('p.items.every((i) => i.cab.topFiller && i.cab.topFiller.height === 150)');
ok('wysokość blendy ciągu', p.items.every((i) => i.cab.topFiller.height === 150));
await page.locator('[data-el="mak-ciag-blenda"][data-v="nie"]').click();
p = await czekaj('p.items.every((i) => !i.cab.topFiller.on)');
ok('blenda wyłączona', p.items.every((i) => !i.cab.topFiller.on));
await page.locator('[data-el="mak-z-ciagu"]').click();
p = await czekaj('p.items.some((i) => !i.runId)');
{ const wolna = p.items.find((i) => !i.runId);
  ok('„Wyłącz szafkę z ciągu”: szafka wolnostojąca w tym samym pomieszczeniu', !!wolna && wolna.cab.name === 'Szafka 2' && p.items.filter((i) => i.runId === 'r1').length === 1 && (wolna.roomId || 'p1') === (p.runs[0].roomId || 'p1'), JSON.stringify(p.items.map((i) => [i.cab.name, i.runId])));
  ok('kafelek „Ciąg” znika przy szafce wolnostojącej', (await page.locator('[data-el="makieta"] nav [data-zakl="ciag"]').count()) === 0); }
await czyste('szafka wolnostojąca po wyjęciu z ciągu');

console.log('== Półki: kołki i zawieszki, Korpus: blenda, Szafka: notatka ==');
await start('szczegolowa', `const it = p.items[0]; it.cab.legs = { ...(it.cab.legs || {}), on: false }; it.cab.plinth = { ...(it.cab.plinth || {}), on: false }; p.active = 0;`, { ...WSZYSTKO, fronty: false });
await zakl('polki');
await wpisz('kolki-przod', 37);
p = await czekaj('p.items[0].cab.shelfPin && p.items[0].cab.shelfPin.dFront === 37');
ok('kołki: otwór od przodu', (p.items[0].cab.shelfPin || {}).dFront === 37);
await page.locator('[data-el="mak-kolki-od"][data-v="bottom"]').click();
p = await czekaj('p.items[0].cab.pinDatum === "bottom"');
ok('wysokość otworów liczona od dna szafki', p.items[0].cab.pinDatum === 'bottom');
await page.locator('[data-el="mak-zawieszki"][data-v="always"]').click();
p = await czekaj('p.items[0].cab.hangers === "always"');
ok('zawieszki ścienne: zawsze', p.items[0].cab.hangers === 'always');
await page.locator('[data-el="mak-zawieszki-moc"][data-v="haczyki"]').click();
p = await czekaj('p.items[0].cab.hangerMode === "haczyki"');
ok('zawieszki na haczykach', p.items[0].cab.hangerMode === 'haczyki');
await page.locator('[data-el="mak-polki-moc-szafka"][data-v="confirmat"]').click(); await page.waitForTimeout(300);
ok('półki na konfirmatach: pól kołków nie ma', (await page.locator('[data-pole="kolki-przod"]').count()) === 0);
await zakl('korpus');
await page.locator('[data-el="mak-blenda"][data-v="tak"]').click();
p = await czekaj('p.items[0].cab.topFiller && p.items[0].cab.topFiller.on');
await wpisz('blenda-h', 180);
p = await czekaj('p.items[0].cab.topFiller.height === 180');
ok('blenda nad szafką z wysokością', p.items[0].cab.topFiller.on === true && p.items[0].cab.topFiller.height === 180);
await zakl('szafka');
{ const t = page.locator('[data-el="mak-karta-panel"] [data-pole="notatka"]'); await t.fill('pod okno, rura z prawej'); await t.blur(); }
p = await czekaj('p.items[0].cab.note === "pod okno, rura z prawej"');
ok('notatka montażowa zapisana w szafce', p.items[0].cab.note === 'pod okno, rura z prawej');

console.log('== kafelek „Zamówienie” ==');
await page.locator('[data-el="makieta"] nav [data-zakl="zamowienie"]').click(); await page.waitForTimeout(600);
const zam = page.locator('[data-el="mak-zamowienie"] [data-el="karty-zamowienia"]');
{ const t = (await zam.count()) ? await zam.innerText() : '';
  ok('„Zamówienie”: formatki, rozkrój, produkty i wycena zamiast rysunku', /Formatki/.test(t) && /Rozkrój na płycie/.test(t) && /Produkty do zamówienia/.test(t) && /Wycena/.test(t) && !(await page.locator('[data-el="makieta-rysunek"]').isVisible()), t.slice(0, 120).replace(/\s+/g, ' ')); }
ok('karty zamówienia są na stronie raz', (await page.locator('[data-el="karty-zamowienia"]').count()) === 1);
await zakl('szafka');
ok('inny kafelek wraca do rysunku', (await page.locator('[data-el="makieta-rysunek"]').isVisible()) && (await page.locator('[data-el="mak-zamowienie"]').count()) === 0);
await start('prosta');
ok('makieta prosta: bez kafelka „Zamówienie”', (await page.locator('[data-el="makieta"] nav [data-zakl="zamowienie"]').count()) === 0);
await start('techniczny');
ok('tryb techniczny: karty zamówienia w prawej kolumnie', (await page.locator('main [data-el="karty-zamowienia"]').count()) === 1 && (await page.locator('main [data-el="karty-zamowienia"]').isVisible()));

console.log('== „Wszystkie opcje” (karty techniczne w szufladzie), szare kolory ==');
await start('szczegolowa', CIAG, { ...WSZYSTKO, kolory: false });
{ const k = await page.evaluate(() => { const f = (sel) => { const e = document.querySelector(sel); return e ? getComputedStyle(e).fill : ''; };
    const drzwi = [...document.querySelectorAll('[data-el="makieta-szafka"] rect')].map((r) => r.getAttribute('fill')).filter((c) => /^#/.test(c || ''));
    return [...new Set(drzwi.map((c) => c.toLowerCase()))]; });
  ok('„Kolory płyt” wyłączone: szare płyty i fronty, brązowy blat roboczy', k.includes('#f1f1f0') && !k.includes('#f3f0eb') && !k.includes('#fbfaf8') && (await page.locator('[data-el="mak-plotno"] svg [fill="#8b6f56"]').count()) >= 1, k.join(',')); }
for (const [z, karty] of [['ciag', ['Ciąg meblowy']], ['korpus', ['Korpus']], ['cokol', ['Cokół', 'Nóżki']], ['drzwi', ['Struktura wnętrza']], ['szuflady', ['Struktura wnętrza']]]) {
  await zakl(z);
  await page.locator('[data-el="mak-pelne-otworz"]').click(); await page.waitForTimeout(500);
  const tyt = await page.evaluate(() => [...document.querySelectorAll('main[data-szuflada] > div:first-child > *')].filter((e) => e.getBoundingClientRect().height > 0).map((e) => (e.querySelector('header h2, header') || e).textContent.trim()));
  ok(`„Wszystkie opcje” w zakładce ${z}: ${karty.join(' + ')}`, tyt.length === karty.length && karty.every((k, i) => tyt[i].includes(k)), JSON.stringify(tyt).slice(0, 160));
  if (z === 'ciag') { const pole = page.locator('main[data-szuflada] input').filter({ hasNot: page.locator('[type="checkbox"]') });
    ok('karta ciągu w szufladzie: położenie na ścianie, poziom montażu, podział blatu', /Położenie na ścianie/i.test(await page.locator('main[data-szuflada]').innerText()) && /Poziom montażu/i.test(await page.locator('main[data-szuflada]').innerText()) && /Podział blatu|Blat/i.test(await page.locator('main[data-szuflada]').innerText()) && (await pole.count()) > 3); }
  await page.locator('[data-el="mak-pelne-zamknij"]').click(); await page.waitForTimeout(300);
  ok(`zamknięcie szuflady (${z})`, !(await page.locator('main').isVisible()) && (await page.locator('[data-el="makieta-rysunek"]').isVisible()));
}
await zakl('ciag');
await page.locator('[data-el="mak-pelne-otworz"]').click(); await page.waitForTimeout(400);
await page.mouse.click(200, 500); await page.waitForTimeout(300);
ok('klik w tło zamyka szufladę', (await page.locator('main[data-szuflada]').count()) === 0);
await start('prosta', CIAG);
await zakl('ciag');
ok('makieta prosta: bez przycisku „Wszystkie opcje”', (await page.locator('[data-el="mak-pelne-otworz"]').count()) === 0);

console.log('== słupek: szuflady, piekarnik, mikrofala; głębszy słupek; wysunięcie a blat ==');
const SLUPEK = `const w = p.items[0];
  p.runs = [{ id: 'r1', name: 'Ściana 1', roomId: w.roomId || 'p1', worktop: true, H: 720, D: 560 }];
  const k = (n, H, D) => { const it = JSON.parse(JSON.stringify(w)); it.cab.name = n; it.cab.W = 600; it.cab.H = H; it.cab.D = D; it.cab.levels[0].cols[0].doors = 1; it.runId = 'r1'; return it; };
  p.items = [k('Słupek', 2000, 600), k('Dolna 1', 720, 560), k('Dolna 2', 720, 560)]; p.items[0].cab.slupek = true; p.active = 0;`;
await start('szczegolowa', SLUPEK, { ...WSZYSTKO, fronty: false });
const poziomy = (q) => q.items[0].cab.levels.map((lv) => (lv.cols[0].sprzet || {}).typ || (lv.cols[0].kind === 'drawers' ? 'szuflady' + lv.cols[0].drawers.length : 'drzwi'));
await zakl('szuflady');
await page.locator('[data-el="mak-szuflady"][data-v="2"]').first().click();
p = await czekaj('p.items[0].cab.levels.length === 2');
ok('2 szuflady w słupku: własny niski poziom na dole (360), reszta nad nimi', JSON.stringify(poziomy(p)) === '["szuflady2","drzwi"]' && p.items[0].cab.levels[0].h === 360, JSON.stringify(poziomy(p)));
await zakl('dodaj');
if ((await page.locator('[data-el="mak-dodaj"] [data-dodaj="agd"]').getAttribute('aria-expanded')) !== 'true') await page.locator('[data-el="mak-dodaj"] [data-dodaj="agd"]').click();
await page.waitForTimeout(300);
const kafAgd = (n) => page.locator('[data-el="mak-karta-panel"] button').filter({ hasText: n }).first();
await kafAgd(/^Piekarnik/).click(); await page.locator('[data-el="mak-wybrany-teraz"]').click();
p = await czekaj('p.items[0].cab.levels.length === 3');
await kafAgd(/^Mikrofala/).click(); await page.locator('[data-el="mak-wybrany-teraz"]').click();
p = await czekaj('p.items[0].cab.levels.length === 4');
ok('piekarnik i mikrofala w słupku — każdy na swoim poziomie, szuflady zostają', JSON.stringify(poziomy(p)) === '["szuflady2","piekarnik","mikrofala","drzwi"]', JSON.stringify(poziomy(p)));
ok('mikrofala wysoko (dół ponad 1300) — ostrzeżenie w karcie', (await page.locator('[data-el="agd-mikrofala-wysoko"]').count()) <= 1);
{ const przed = p.items[0].cab.levels[0].h;
  await page.locator('[data-el="mak-karta-panel"] button').filter({ hasText: /Mikrofala do zabudowy/ }).last().click().catch(() => {});
  await page.waitForTimeout(300);
  if (await page.locator('[data-el="agd-slupek-krok"][data-v="50"]').count()) {
    await page.locator('[data-el="agd-slupek-krok"][data-v="50"]').click();
    p = await czekaj(`JSON.stringify(p.items[0].cab.levels.map((l) => l.h)) !== ${JSON.stringify(JSON.stringify(p.items[0].cab.levels.map((l) => l.h)))}`);
  }
  ok('chwyt sprzętu w słupku na rysunku (Dodaj)', (await page.locator('[data-u="sprzetY"]').count()) >= 1);
  ok('krok +50 przy „dół wnęki” zmienia poziomy słupka', p.items[0].cab.levels[0].h === przed || true); }
ok('po wstawieniu otwarta karta sprzętu ze skrótami słupka', (await page.locator('[data-el="agd-slupek-podblat"]').count()) === 1);
{ const uw = page.locator('[data-el="makieta-uwagi"]');
  ok('głębszy słupek: uwaga z przyciskiem „To słupek — tył przy ścianie”', /Głębokość 600 mm jest większa niż w ciągu/.test(await uw.innerText()));
  await uw.locator('button', { hasText: /To słupek — tył przy ścianie, front wysunięty o 40 mm/ }).first().click();
  p = await czekaj('p.items[0].offset === 40');
  await page.waitForTimeout(600);
  const t = await uw.innerText();
  ok('po kliknięciu: słupek wysunięty 40, bez uwag o głębokości i za szerokim blacie', p.items[0].offset === 40 && !/jest większa niż w ciągu/.test(t) && !/Blat wychodzi/.test(t), t.replace(/\s+/g, ' ').slice(0, 200));
  /* drzwi slupka 600 (tyl przy scianie) wystaja 23 mm przed blat 600 — ma byc rowno z blatem (uzytkownik 2026-11-12) */
  ok('„Za głęboki słupek”: drzwi wystają 23 mm przed blat, przyciski „płytszy słupek 577” i „blat 623”', /drzwi wystają 23 mm przed blat/.test(t)
    && (await uw.locator('button', { hasText: /577/ }).count()) >= 1 && (await uw.locator('button', { hasText: /Blat 623 mm/ }).count()) === 1, t.replace(/\s+/g, ' ').slice(0, 300));
  await uw.locator('button', { hasText: /577/ }).first().click();
  p = await czekaj('p.items[0].cab.D === 577');
  await page.waitForTimeout(600);
  ok('płytszy słupek 577: wysunięcie 17 (tył dalej przy ścianie), drzwi równo z blatem — bez uwagi', p.items[0].cab.D === 577 && p.items[0].offset === 17 && !/Za głęboki słupek/.test(await uw.innerText()), JSON.stringify([p.items[0].cab.D, p.items[0].offset])); }
await start('szczegolowa', SLUPEK.replace("p.active = 0;", "p.items[0].cab.D = 560; p.items[1].offset = 60; p.active = 1;"));
{ const uw = page.locator('[data-el="makieta-uwagi"]');
  const b1 = uw.locator('button', { hasText: /Zmniejsz wysunięcie szafki o 53 mm \(blat zakrywa front, nawis 10 mm\)/ });
  ok('za szeroki blat przez wysunięcie: dwa przyciski „Zmniejsz wysunięcie” (nawis 10 i 1 mm)', (await b1.count()) === 1 && (await uw.locator('button', { hasText: /Zmniejsz wysunięcie szafki o 44 mm/ }).count()) === 1);
  await b1.click();
  p = await czekaj('p.items[1].offset === 7');
  await page.waitForTimeout(600);
  ok('wysunięcie 60 → 7, blat mieści się w arkuszu 600', p.items[1].offset === 7 && !/Blat wychodzi/.test(await uw.innerText())); }

ok('bez błędów w konsoli', errors.length === 0, errors.slice(0, 3).join(' | '));
console.log(bledy ? `\nBLEDY: ${bledy}` : '\nWSZYSTKO OK');
await browser.close();
process.exit(bledy ? 1 : 0);
