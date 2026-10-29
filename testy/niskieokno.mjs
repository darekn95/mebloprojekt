/* Niskie okno (audyt GPT U2, decyzja uzytkownika 2026-10-19 — „oba naraz”):
   - ponizej 640 px wysokosci pasek „Ciągi i szafki” zwija sie sam do jednej
     linii, klikniecie go rozwija (bez zapamietywania),
   - gorny pasek jest zawsze przyklejony i ma najwyzej 40% okna — wyzszy przewija sie
     sam (uzytkownik 2026-10-29: odpiety po rozwinieciu „przypial sie na samej gorze”
     strony i zniknal z ekranu w waskim oknie artefaktu),
   - „Pokaż rysunek” w niskim oknie przewija prosto do rysunku, pod pasek,
   - w zwyklym oknie bez zmian: pasek rozwiniety i przyklejony. */
import pw from './pw.mjs';
const URL = process.env.STD ? 'http://127.0.0.1:5199/standalone-local.html'
  : 'http://127.0.0.1:5205/mebloprojekt-app.html';
const ok = (l, c, e = '') => console.log((c ? '  OK   ' : '  BLAD ') + l + (e ? ' — ' + e : ''));
const b = await pw.chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const errors = [];
const PL = { on: true, height: 100, mode: 'under', setback: 0 };
const RUN = (id, name, o = {}) => ({ id, name, wallW: null, gap: 0, mountY: 0, H: 720, D: 560, plinth: PL, worktop: true, corner: null, ...o });
const CAB = (name, runId) => ({ cab: { name, W: 600, H: 720, D: 560, plinth: PL, levels: [{ h: null, cols: [{ w: null, kind: 'doors', doors: 2 }] }] }, runId, offset: 0 });
// dwa ciagi w rogu — jak w audycie GPT (pasek dwoch ciagow)
const PROJ = { name: 'U2', active: 0, prices: {}, runs: [RUN('c1', 'Ściana A'), RUN('c2', 'Ściana B', { corner: { of: 'c1', at: 'end', owner: 'self', clear: 0 } })],
  items: [CAB('A1', 'c1'), CAB('A2', 'c1'), CAB('B1', 'c2')] };
const otworz = async (width, height) => {
  const ctx = await b.newContext({ viewport: { width, height } });
  await ctx.addInitScript(() => { window.__mpBezZwijania = false; });   // pw.mjs wylacza je innym testom
  const page = await ctx.newPage();
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto(URL, { waitUntil: 'networkidle' });
  await page.evaluate((q) => { localStorage.clear(); localStorage.setItem('szafki:projekt', JSON.stringify(q)); }, PROJ);
  await page.reload({ waitUntil: 'networkidle' }); await page.waitForTimeout(1500);
  return { ctx, page };
};
const stan = (page) => page.evaluate(() => {
  const h = document.querySelector('header[data-el="naglowek"]');
  return { wys: Math.round(h.getBoundingClientRect().height), poz: getComputedStyle(h).position, gora: Math.round(h.getBoundingClientRect().top),
    przewija: h.scrollHeight > h.clientHeight + 1, rozwiniety: !!document.querySelector('[data-el="pasek-ciagow-lista"]'), okno: innerHeight };
});

console.log('== okno 600 × 495 (audyt GPT U2) ==');
let { ctx, page } = await otworz(600, 495);
let s = await stan(page);
ok('pasek ciągów zwinięty sam', !s.rozwiniety, JSON.stringify(s));
ok('nagłówek najwyżej 40% okna i przyklejony', s.wys <= 0.4 * s.okno && s.poz === 'sticky', JSON.stringify(s));
await page.getByRole('button', { name: 'Pokaż rysunek' }).click();
// przewijanie jest płynne — przy kilku suitach naraz 1200 ms nie starczało (fałszywy alarm 2026-10-22)
await page.waitForFunction(() => { const svg = document.querySelector('#rysunek svg'); const h = document.querySelector('header[data-el="naglowek"]');
  return svg && h && Math.abs(svg.getBoundingClientRect().top - h.getBoundingClientRect().bottom) <= 3; }, null, { timeout: 6000 }).catch(() => {});
await page.waitForTimeout(300);
const r = await page.evaluate(() => { const svg = document.querySelector('#rysunek svg').getBoundingClientRect();
  const dol = document.querySelector('header[data-el="naglowek"]').getBoundingClientRect().bottom;
  return { svgTop: Math.round(svg.top), pasek: Math.round(dol), widac: Math.round(Math.min(innerHeight, svg.bottom) - Math.max(dol, svg.top)) }; });
ok('„Pokaż rysunek”: rysunek tuż pod paskiem, widać całe miejsce pod nim', Math.abs(r.svgTop - r.pasek) <= 3 && r.widac >= 495 - r.pasek - 3, JSON.stringify(r));
await page.locator('[data-el="pasek-ciagow"]').click(); await page.waitForTimeout(600);
s = await stan(page);
ok('kliknięcie rozwija pasek ciągów', s.rozwiniety, JSON.stringify(s));
ok('rozwinięty byłby ponad 40% — nagłówek dalej przyklejony, 40% okna, przewija się sam', s.poz === 'sticky' && s.wys <= Math.round(0.4 * s.okno) + 1 && s.przewija, JSON.stringify(s));
ok('rozwinięcie nie jest zapamiętane', await page.evaluate(() => localStorage.getItem('mp-pasek-zwiniety')) === null);
await page.locator('[data-el="pasek-ciagow"]').click(); await page.waitForTimeout(600);
s = await stan(page);
ok('drugie kliknięcie zwija, nagłówek znów przyklejony', !s.rozwiniety && s.poz === 'sticky', JSON.stringify(s));
await ctx.close();

console.log('\n== okno 640 × 300 (telefon w poziomie) ==');
({ ctx, page } = await otworz(640, 300));
s = await stan(page);
ok('zwinięty, a i tak ponad 40% okna — przyklejony, 40% okna, przewija się sam', !s.rozwiniety && s.poz === 'sticky' && s.wys <= Math.round(0.4 * s.okno) + 1 && s.przewija, JSON.stringify(s));
await ctx.close();

console.log('\n== okno 850 × 650 (artefakt w wąskim oknie, użytkownik 2026-10-29) ==');
{
  // trzy ciagi (jak pomieszczenie 1 uzytkownika): po przewinieciu paski sie zwijaja, klik je rozwija
  const P3 = { ...PROJ, runs: [...PROJ.runs, RUN('c3', 'Ściana C')], items: [...PROJ.items, CAB('C1', 'c3'), CAB('C2', 'c3'), CAB('A3', 'c1'), CAB('B2', 'c2')] };
  const ctx3 = await b.newContext({ viewport: { width: 850, height: 650 } });
  await ctx3.addInitScript(() => { window.__mpBezZwijania = false; });
  const p3 = await ctx3.newPage(); p3.on('pageerror', (e) => errors.push(e.message));
  await p3.goto(URL, { waitUntil: 'networkidle' });
  await p3.evaluate((q) => { localStorage.clear(); localStorage.setItem('szafki:projekt', JSON.stringify(q)); }, P3);
  await p3.reload({ waitUntil: 'networkidle' }); await p3.waitForTimeout(1500);
  await p3.mouse.move(200, 600);
  for (let i = 0; i < 6; i++) { await p3.mouse.wheel(0, 300); await p3.waitForTimeout(150); }
  await p3.waitForTimeout(800);
  s = await stan(p3);
  const y0 = await p3.evaluate(() => Math.round(scrollY));
  ok('po przewinięciu w dół: pasek zwinięty i przyklejony', y0 > 500 && !s.rozwiniety && s.poz === 'sticky' && s.gora === 0, JSON.stringify({ ...s, y0 }));
  await p3.locator('header[data-el="naglowek"] button', { hasText: 'Ciągi i szafki' }).first().click(); await p3.waitForTimeout(700);
  s = await stan(p3);
  ok('rozwinięcie w tym miejscu: pasek dalej na ekranie u góry (nie odpięty na górze strony), najwyżej 40%', s.rozwiniety && s.poz === 'sticky' && s.gora === 0
    && s.wys <= Math.round(0.4 * s.okno) + 1, JSON.stringify(s));
  await ctx3.close();
}

console.log('\n== okno 1500 × 1000: bez zmian ==');
({ ctx, page } = await otworz(1500, 1000));
s = await stan(page);
ok('pasek ciągów rozwinięty, nagłówek przyklejony', s.rozwiniety && s.poz === 'sticky', JSON.stringify(s));
await page.setViewportSize({ width: 1500, height: 500 }); await page.waitForTimeout(600);
s = await stan(page);
ok('po zmniejszeniu okna do 500 px pasek zwija się sam', !s.rozwiniety, JSON.stringify(s));
await page.setViewportSize({ width: 1500, height: 1000 }); await page.waitForTimeout(600);
s = await stan(page);
ok('po powiększeniu wraca rozwinięty', s.rozwiniety && s.poz === 'sticky', JSON.stringify(s));
await ctx.close();

console.log('\nBLEDY STRONY:', errors.join(' | ') || '(brak)');
await b.close();
