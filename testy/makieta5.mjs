// Tryb makiety, krok 5 (uzytkownik 2026-11-09): paleta — szablony szafek i klocki przeciagane na rysunek albo klikane.
// Szafka laduje przed / za szafka, na ktora ja upuszczono (albo na koncu ciagu), wolnostojace obok, gorne na ciag gorny
// (zakladany, gdy go nie ma); klocek zmienia kolumne pod kursorem. Zapis przez `addCabinet` / `makietaZmien`.
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
  const wzor = p.items[0];
  const kopia = (o) => JSON.parse(JSON.stringify(o));
  const w = (n, W) => { const it = kopia(wzor); it.cab.name = n; it.cab.W = W; return it; };
  p.runs = [{ id: 'r1', name: 'Ściana A', roomId: 'p1', worktop: true }];
  p.items = [{ ...w('Lewa', 600), runId: 'r1' }, { ...w('Środek', 800), runId: 'r1' }, { ...w('Prawa', 400), runId: 'r1' }, { ...w('Komoda', 900), runId: null, roomId: 'p1' }];
  p.active = 0;
  localStorage.setItem('szafki:projekt', JSON.stringify(p));
  localStorage.setItem('mp-tryb', 'prosta');
});
await page.reload({ waitUntil: 'networkidle' });
await page.waitForTimeout(1200);

const czekaj = async (opis, fn, arg) => {
  const okk = await page.waitForFunction(([f, a]) => { const p = JSON.parse(localStorage.getItem('szafki:projekt')); return (new Function('p', 'a', /\breturn\b/.test(f) ? f : 'return ' + f))(p, a); },
    [fn, arg], { timeout: 5000 }).then(() => true).catch(() => false);
  if (!okk) { const p = await page.evaluate(() => JSON.parse(localStorage.getItem('szafki:projekt'))); ok(opis, false, p.items.map((it) => `${it.cab.name}:${it.runId}`).join(', ')); return false; }
  ok(opis, true);
  return true;
};
const PRZOD = '[data-el="makieta"] svg:not([data-el="mak-zgory"] svg) [data-el="makieta-szafka"]';
const kafel = (el, id) => page.locator(`[data-el="mak-paleta"] [data-el="${el}"][data-id="${id}"]`);
const upusc = async (el, id, idx, gdzie = 'srodek') => {
  const cel = page.locator(`${PRZOD}[data-idx="${idx}"]`).first();
  await cel.scrollIntoViewIfNeeded();
  const b = await cel.boundingBox();
  const pos = gdzie === 'lewo' ? { x: Math.min(15, b.width / 4), y: b.height / 2 } : gdzie === 'prawo' ? { x: b.width - Math.min(15, b.width / 4), y: b.height / 2 }
    : typeof gdzie === 'object' ? gdzie : { x: b.width / 2, y: b.height / 2 };
  await kafel(el, id).dragTo(cel, { targetPosition: pos, force: true });
  await page.waitForTimeout(400);
};

// zakladki jak w makiecie „Dodaj” (2026-11-09): AGD, wzory szafek w „Szafka”, klocki w swoich zakladkach
const zakl = async (k) => { const b = page.locator(`[data-el="makieta"] nav [data-zakl="${k}"]`);
  if ((await b.getAttribute('aria-pressed')) !== 'true' || !(await page.locator('[data-el="mak-karta-panel"]').count())) await b.click(); await page.waitForTimeout(250); };
await zakl('agd');
const nAgd = await page.locator('[data-el="mak-paleta"] [data-el="mak-agd"]').count();
ok('zakładka AGD: sprzęt do przeciągnięcia', nAgd >= 12, String(nAgd));
await zakl('szafka');
await page.waitForTimeout(300);
const nWz = await page.locator('[data-el="mak-paleta"] [data-el="mak-wzor"]').count();
await zakl('drzwi');
const nKl = await page.locator('[data-el="mak-paleta"] [data-el="mak-klocek"]').count();
await zakl('szafka');
ok('„Szafka”: wzory szafek; „Drzwi i klapy”: klocki frontów', nWz >= 14 && nKl === 5, `${nWz} / ${nKl}`);

console.log('== klik: szafka na koniec ciągu ==');
await kafel('mak-wzor', 'dolna2').click();
await czekaj('„Dolna, 2 drzwi” za „Prawa”, w ciągu, aktywna', 'p.items.length === 5 && p.items[3].runId === "r1" && p.items[3].cab.W === 800 && p.items[4].cab.name === "Komoda" && p.active === 3');

console.log('== przeciągnięcie szafki przed / za ==');
await upusc('mak-wzor', 'szuflady', 1, 'lewo');
await czekaj('„Dolna z szufladami” przed „Środek”', 'p.items[1].runId === "r1" && p.items[1].cab.W === 600 && p.items[1].cab.levels[0].cols[0].kind === "drawers" && p.items[1].cab.levels[0].cols[0].drawers.length === 3 && p.items[2].cab.name === "Środek"');
await upusc('mak-wzor', 'zlewowa', 0, 'prawo');
await czekaj('„Zlewowa” za „Lewa”, bez półek', 'p.items[1].cab.W === 800 && p.items[1].cab.levels[0].cols[0].shelfTargets.length === 1 && p.items[0].cab.name === "Lewa"');
// Lewa 0, Zlewowa 1, Szuflady 2, Srodek 3, Prawa 4, Dolna 5, Komoda 6

console.log('== klocki na kolumnę ==');
const n0 = await page.evaluate(() => JSON.parse(localStorage.getItem('szafki:projekt')).items[0].cab.levels[0].cols[0].shelfTargets.length);
await zakl('polki');
await upusc('mak-klocek', 'polka', 0);
await czekaj('„Półka” na „Lewa”: o jedną więcej', 'p.items[0].cab.levels[0].cols[0].shelfTargets.length === a + 1 && p.active === 0', n0);
await zakl('przegroda');
await upusc('mak-klocek', 'przegroda', 0);
await czekaj('„Przegroda” na „Lewa”: 2 kolumny, szerokości auto', 'const L = p.items[0].cab.levels[0].cols; return L.length === 2 && L.every((k) => k.w == null)');
await page.waitForTimeout(300);
await zakl('szuflady');
await upusc('mak-klocek', 'szu-2', 0, 'prawo');
await czekaj('„2 szuflady” na prawą kolumnę „Lewa”', 'const L = p.items[0].cab.levels[0].cols; return L[1].kind === "drawers" && L[1].drawers.length === 2 && (L[0].kind || "doors") === "doors"');
await zakl('polki');
await upusc('mak-klocek', 'polka', 0, 'prawo');
ok('„Półka” na kolumnę z szufladami — komunikat', /tylko do kolumny z drzwiami/.test(await page.locator('[data-el="mak-komunikat"]').innerText().catch(() => '')));
await zakl('drzwi');
await kafel('mak-klocek', 'klapa-gora').click();
await czekaj('klik „Klapa ↑”: pierwsza pasująca kolumna zaznaczonej', 'p.items[0].cab.levels[0].cols[0].klapa === "gora" && p.items[0].cab.levels[0].cols[0].doors === 1');

console.log('== wolnostojące i górne ==');
await zakl('szafka');
await kafel('mak-wzor', 'komoda').click();
await czekaj('„Komoda” wolnostojąca, nazwa bez powtórki', 'const it = p.items[p.active]; return it.runId == null && it.cab.name === "Komoda 2" && it.cab.W === 800 && it.cab.H === 800 && it.cab.D === 450 && it.cab.levels[0].cols[0].drawers.length === 4');
await kafel('mak-wzor', 'wiszaca').click();
ok('wisząca przy wolnostojącej zaznaczonej — komunikat', /upuść na ciąg/.test(await page.locator('[data-el="mak-komunikat"]').innerText().catch(() => '')));
await kafel('mak-wzor', 'szafaW').click();
await czekaj('„Szafa” 800 × 2000, cokół w obrysie i nóżki', 'const c = p.items[p.active].cab; return c.H === 2000 && c.plinth.on && c.plinth.mode === "inbody" && c.legs.on && c.levels[0].cols[0].doors === 2');
// wroc do ciagu: zaznacz „Lewa” z listy
await page.locator('[data-el="mak-szafka"] button').first().click();
await page.locator('[data-el="mak-szafka"] [data-v="0"]').click();
await page.waitForTimeout(400);
await upusc('mak-wzor', 'wiszaca', 0);
await czekaj('wisząca na ciąg dolny: ciąg górny założony, szafka w nim', 'const g = p.runs.find((r) => r.tier === "gorny" && r.wall === "r1"); return !!g && p.items[p.active].runId === g.id');

console.log('== widok: karta do schowania, duży rysunek ==');
const zakDodaj = page.locator('[data-el="makieta"] nav [data-zakl="szafka"]');
await zakDodaj.click(); await page.waitForTimeout(300);
ok('klik w otwartą zakładkę chowa kartę', !(await page.locator('[data-el="mak-karta-panel"]').count()));
await page.locator('[data-el="makieta"] nav [data-zakl="polki"]').click(); await page.waitForTimeout(300);
ok('inna zakładka otwiera kartę', /półki/.test(await page.locator('[data-el="makieta-karta"]').innerText()));
await page.locator('[data-el="mak-karta-schowaj"]').click(); await page.waitForTimeout(300);
ok('„‹” chowa kartę, pamiętane', !(await page.locator('[data-el="mak-karta-panel"]').count()) && (await page.evaluate(() => localStorage.getItem('mp-mak-karta'))) === '0');
// widok jak w makiecie „Dodaj” (2026-11-09): na szerokosc okna, sciana do 2300 w tle, z gory nad widokiem z przodu
const miara = () => page.evaluate(() => { const box = document.querySelector('[data-el="mak-plotno"]'); const svgs = [...box.querySelectorAll('svg')].filter((s) => !s.closest('[data-el="mak-zgory"]') && s.querySelector('[data-el="makieta-szafka"]'));
  const f = svgs[0].getBoundingClientRect(); return { h: f.height, okno: window.innerHeight, sw: box.scrollWidth, cw: box.clientWidth, tlo: !!box.querySelector('[data-el="tlo-sciany"]') }; });
const m1 = await miara();
ok('jak w makiecie: rysunek w szerokości okna, ściana w tle, nagłówek ciągu', m1.sw <= m1.cw + 2 && m1.tlo && (await page.locator('[data-el="mak-naglowek"]').count()) === 1, JSON.stringify(m1));
await page.locator('[data-el="mak-przel"] [data-p="powieksz"]').click(); await page.waitForTimeout(400);
const m2 = await miara();
ok('„Powiększ”: widok z przodu na wysokość okna, przewijany w bok', m2.h > m2.okno * 0.6 && m2.sw > m2.cw, JSON.stringify(m2));
await page.locator('[data-el="mak-przel"] [data-p="powieksz"]').click(); await page.waitForTimeout(300);
await zakl('szafka');

const p2 = await page.evaluate(() => JSON.parse(localStorage.getItem('szafki:projekt')));
ok('stare szafki nietknięte (Środek 800, Prawa 400)', p2.items.find((it) => it.cab.name === 'Środek').cab.W === 800 && p2.items.find((it) => it.cab.name === 'Prawa').cab.W === 400);

console.log('bledy strony:', errors.length ? errors.join(' | ') : 'brak');
if (errors.length) bledy++;
console.log(bledy ? `${bledy} BLAD` : 'WSZYSTKO OK');
await browser.close();
process.exit(bledy ? 1 : 0);
