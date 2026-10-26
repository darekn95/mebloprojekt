/* Rysunek „przypiety” (uzytkownik 2026-10-25): na szerokim ekranie prawa kolumna
   (rysunek i karty pod nim) stoi pod gornym paskiem z wlasnym przewijaniem:
   - przewijanie lewej kolumny nie zabiera rysunku z ekranu,
   - kolko nad prawa kolumna przewija karty pod rysunkiem, a to zwija paski u gory,
   - „Pokaż rysunek” wraca na gore prawej kolumny, strona stoi,
   - przycisk uwag u gory pokazuje Uwagi w prawej kolumnie,
   - krotka kolumna (karty zwiniete) nie ma wlasnego przewijania,
   - pelny ekran rysunku przykrywa tez gorny pasek (kolumna odklejona),
   - waskie okno (jedna kolumna) — bez przypiecia. */
import pw from './pw.mjs';
const URL = process.env.STD ? 'http://127.0.0.1:5199/standalone-local.html'
  : 'http://127.0.0.1:5205/mebloprojekt-app.html';
const ok = (l, c, e = '') => console.log((c ? '  OK   ' : '  BLAD ') + l + (e ? ' — ' + e : ''));
const b = await pw.chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const errors = [];
const PL = { on: true, height: 100, mode: 'under', setback: 0 };
// szafa 1800 × 1600 z trzema kolumnami — dluga Struktura wnetrza po lewej, klapy daja podpowiedzi
const CAB = { name: 'Szafa', W: 1800, H: 1600, D: 500, plinth: PL, levels: [{ h: null, cols: [
  { w: 576, kind: 'doors', doors: 2, shelfTargets: [250, null, 250] },
  { w: 576, kind: 'doors', doors: 1, klapa: 'gora', podzial: [0, 1, 2], shelfMount: 'confirmat', segmenty: [{ klapa: 'dol' }] },
  { w: null, kind: 'doors', doors: 1, podzial: [1, 2], segmenty: [{ doors: 2 }, { doors: 2 }, { doors: 2 }] },
] }] };
const PROJ = { name: 'P', active: 0, prices: {}, runs: [], items: [{ cab: CAB, runId: null, offset: 0 }] };
const ctx = await b.newContext({ viewport: { width: 1500, height: 900 } });
await ctx.addInitScript(() => { window.__mpBezZwijania = false; window.__mpKartyOsobno = false; });
const page = await ctx.newPage();
page.on('pageerror', (e) => errors.push(e.message));
await page.goto(URL, { waitUntil: 'networkidle' });
await page.evaluate((q) => { localStorage.clear(); localStorage.setItem('szafki:projekt', JSON.stringify(q)); }, PROJ);
await page.reload({ waitUntil: 'networkidle' }); await page.waitForTimeout(1500);

const stan = () => page.evaluate(() => {
  const k = document.querySelector('[data-el="prawa-kolumna"]'), r = k.getBoundingClientRect();
  const rys = document.getElementById('rysunek').getBoundingClientRect();
  const svg = document.querySelector('#rysunek svg');
  const s = svg ? svg.getBoundingClientRect() : null;
  return { y: Math.round(scrollY), poz: getComputedStyle(k).position, top: Math.round(r.top), dol: Math.round(r.bottom),
    kst: Math.round(k.scrollTop), wlasne: k.scrollHeight > k.clientHeight + 1, rys: Math.round(rys.top),
    svg: s ? [Math.round(s.top), Math.round(s.bottom)] : null, vh: innerHeight,
    pasek: Math.round(document.querySelector('header[data-el="naglowek"]').getBoundingClientRect().bottom),
    ciagi: !!document.querySelector('[data-el="pasek-ciagow-lista"]') };
});
const kolko = async (x, dy, n = 3) => { for (let i = 0; i < n; i++) { await page.mouse.move(x, 600); await page.mouse.wheel(0, dy); await page.waitForTimeout(250); } await page.waitForTimeout(300); };
// przewijanie prawej kolumny nie jest widoczne dla czekania z pw.mjs — czekamy na nie wprost
const czekajKolumne = async (warunek) => {
  let pop = null;
  for (let i = 0; i < 40; i++) {
    const s = await stan();
    if (warunek(s) && pop && pop.kst === s.kst && pop.y === s.y) return s;   // i juz stoi
    pop = s; await page.waitForTimeout(100);
  }
  return stan();
};
const LEWA = 250, PRAWA = 1000;

console.log('== szeroki ekran: prawa kolumna przypięta ==');
let s = await stan();
ok('kolumna przyklejona (sticky) z własnym przewijaniem', s.poz === 'sticky' && s.wlasne, JSON.stringify(s));
ok('na górze strony rysunek na początku kolumny', s.rys === s.top && s.kst === 0, JSON.stringify(s));
ok('kolumna kończy się nad dołem okna', s.dol <= s.vh, JSON.stringify(s));

console.log('\n== przewijanie lewej kolumny ==');
await kolko(LEWA, 500, 4);
s = await stan();
ok('strona przewinięta', s.y > 1000, JSON.stringify(s));
ok('kolumna tuż pod paskiem (8 px)', Math.abs(s.top - s.pasek - 8) <= 1, JSON.stringify(s));
ok('rysunek widoczny od góry pod paskiem', s.svg && s.svg[0] >= s.pasek && s.svg[0] < s.vh / 2, JSON.stringify(s));
ok('kolumna kończy się 8 px nad dołem okna', Math.abs(s.dol - (s.vh - 8)) <= 1, JSON.stringify(s));
const y0 = s.y;

console.log('\n== kółko nad prawą kolumną ==');
await kolko(PRAWA, 150, 1);
s = await stan();
ok('przewija karty pod rysunkiem', s.kst > 0, JSON.stringify(s));
ok('strona stoi', s.y === y0, JSON.stringify(s));

console.log('\n== „Pokaż rysunek” ==');
await page.getByRole('button', { name: 'Pokaż rysunek' }).click();
s = await czekajKolumne((x) => x.kst === 0);
ok('kolumna wraca na górę, rysunek pod paskiem', s.kst === 0 && Math.abs(s.rys - s.pasek - 8) <= 1, JSON.stringify(s));
ok('strona nie przeskakuje', s.y === y0, JSON.stringify(s));

console.log('\n== przycisk uwag u góry ==');
const doUwag = page.locator('header button[title^="Przejdź do"]').first();
ok('jest przycisk uwag / podpowiedzi', await doUwag.count() === 1);
await doUwag.click();
s = await czekajKolumne((x) => x.kst > 0);
const uw = await page.evaluate(() => {
  const n = [...document.querySelectorAll('#uwagi, section')].find((e) => /Uwagi/.test((e.querySelector('h2') || {}).textContent || ''));
  const r = n && n.getBoundingClientRect();
  return r ? { top: Math.round(r.top), vh: innerHeight } : null;
});
ok('Uwagi tuż pod górą prawej kolumny', uw && Math.abs(uw.top - s.top - 8) <= 2, JSON.stringify({ uw, s }));
ok('strona przy tym stoi', s.y === y0, JSON.stringify(s));

console.log('\n== przewijanie prawej zwija paski ==');
await kolko(LEWA, -3000, 4);
await page.getByRole('button', { name: 'Pokaż rysunek' }).click();
await czekajKolumne((x) => x.kst === 0);
await kolko(LEWA, -3000, 2);
s = await stan();
ok('na górze strony paski rozwinięte', s.y === 0 && s.ciagi, JSON.stringify(s));
await kolko(PRAWA, 150, 2);
s = await stan();
ok('kółko w dół nad prawą kolumną zwija paski', s.kst > 0 && !s.ciagi, JSON.stringify(s));
await kolko(PRAWA, -600, 2);
s = await stan();
ok('z powrotem na górze prawej kolumny paski wracają', s.kst === 0 && s.ciagi, JSON.stringify(s));

console.log('\n== pełny ekran rysunku ==');
await page.locator('#rysunek').getByRole('button', { name: 'Pełny ekran' }).click(); await page.waitForTimeout(400);
const pe = await page.evaluate(() => {
  const e = document.elementFromPoint(20, 20), k = document.querySelector('[data-el="prawa-kolumna"]');
  return { rysunek: !!(e && e.closest('#rysunek')), poz: getComputedStyle(k).position };
});
ok('nakładka przykrywa też górny pasek, kolumna odklejona', pe.rysunek && pe.poz === 'static', JSON.stringify(pe));
await page.keyboard.press('Escape'); await page.waitForTimeout(400);
s = await stan();
ok('Esc — kolumna znów przypięta', s.poz === 'sticky', JSON.stringify(s));

console.log('\n== karty zwinięte: krótka kolumna (okno 1500 × 1800) ==');
await page.setViewportSize({ width: 1500, height: 1800 }); await page.waitForTimeout(400);
await page.getByRole('button', { name: '▸ Zwiń wszystkie' }).click(); await page.waitForTimeout(400);
for (const t of ['Struktura wnętrza', 'Rysunek']) { await page.locator('main button', { hasText: t }).first().click(); await page.waitForTimeout(300); }
s = await stan();
ok('kolumna mieści się w oknie — bez własnego przewijania', s.poz === 'sticky' && !s.wlasne, JSON.stringify(s));
await kolko(LEWA, 400, 3);
s = await stan();
ok('po przewinięciu lewej rysunek stoi pod paskiem', s.y > 300 && Math.abs(s.rys - s.pasek - 8) <= 1, JSON.stringify(s));

console.log('\n== wąskie okno ==');
await page.setViewportSize({ width: 900, height: 900 }); await page.waitForTimeout(500);
s = await stan();
const w = await page.evaluate(() => document.querySelector('[data-el="prawa-kolumna"]').style.maxHeight);
ok('jedna kolumna — bez przypięcia i bez własnego przewijania', s.poz === 'static' && !s.wlasne && w === '', JSON.stringify({ s, w }));
await page.setViewportSize({ width: 1500, height: 900 }); await page.waitForTimeout(500);
s = await stan();
ok('z powrotem szeroko — przypięta', s.poz === 'sticky', JSON.stringify(s));

ok('bez błędów strony', errors.length === 0, errors.join(' | '));
await b.close();
