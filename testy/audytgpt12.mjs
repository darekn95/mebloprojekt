/* Audyt GPT 2026-10-28, ustalenia N110–N139 (`AUDYT_GPT.md` na galezi gpt/audyt-2026-10-16) —
   to, co widac dopiero w aplikacji:
   - N119 wspolne dno ciagu w 3D jedna plyta (jak w zamowieniu), bez szpary miedzy szafkami;
   - N130 klikniecie obrzeza „Frontu ramienia” w tabeli formatek zmienia zamowienie;
   - N136 przycisk „Ustaw 50 / 50 mm” przy kolkach polki ramienia zmienia szafke w L;
   - N122, N132, N139 — uwagi widoczne w karcie szafki.
   Liczby i reszta przypadkow (N110–N139) — funkcje, suita `funkcje`. */
import pw from './pw.mjs';
const URL = process.env.STD ? 'http://127.0.0.1:5199/standalone-local.html'
  : 'http://127.0.0.1:5205/mebloprojekt-app.html';
const ok = (l, c, e = '') => console.log((c ? '  OK   ' : '  BLAD ') + l + (e ? ' — ' + e : ''));
const b = await pw.chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const page = await (await b.newContext({ viewport: { width: 1500, height: 1300 } })).newPage();
const errors = []; page.on('pageerror', (e) => errors.push(e.message));
await page.goto(URL, { waitUntil: 'networkidle' });

const PL = { on: true, height: 100, mode: 'under', setback: 0 };
const kol = (o = {}) => ({ kind: 'doors', doors: 1, w: null, shelfTargets: [null, null], ...o });
const szafka = (name, o = {}) => ({ name, W: 600, H: 720, D: 560, plinth: PL, legs: { on: true, height: 100 }, levels: [{ h: null, cols: [kol({ shelfTargets: [null] })] }], ...o });
const Lcab = (o = {}, c = {}) => ({ name: 'L', W: 900, H: 720, D: 560, plinth: PL, legs: { on: true, height: 100 },
  corner: { on: true, arm: 640, doors: 'wsporniki', ...c }, levels: [{ h: null, cols: [kol()] }], ...o });
const RUN = (id, name, o = {}) => ({ id, name, wallW: null, gap: 0, mountY: 0, H: 720, D: 560, plinth: PL, worktop: true, corner: null, ...o });
const rog = (L, o = {}) => ({ name: 'P', active: 1, prices: {},
  runs: [RUN('c1', 'Ściana 1', o.run1), RUN('c2', 'Ściana 2', { corner: { of: 'c1', at: 'end', owner: 'self', clear: 0 } })],
  items: [{ cab: szafka('A1', o.a1), runId: 'c1', offset: 0 }, { cab: L, runId: 'c2', offset: 0 }, { cab: szafka('B2'), runId: 'c2', offset: 0 }] });
const seed = async (p) => {
  await page.evaluate((q) => { localStorage.clear(); localStorage.setItem('szafki:projekt', JSON.stringify(q)); }, p);
  await page.reload({ waitUntil: 'networkidle' }); await page.waitForTimeout(1500);
};
const zap = async () => { await page.waitForTimeout(900); return page.evaluate(() => JSON.parse(localStorage.getItem('szafki:projekt'))); };
const notes = () => page.evaluate(() => {
  const sec = [...document.querySelectorAll('section')].find((s) => /^Uwagi$/.test((s.querySelector('h2') || {}).textContent || ''));
  return sec ? [...sec.querySelectorAll('li')].map((li) => ({ txt: li.textContent.trim(), btns: [...li.querySelectorAll('button')].map((x) => x.textContent.trim()) })) : [];
});
const rows = (re) => page.evaluate((src) => { const r = new RegExp(src);
  const sec = [...document.querySelectorAll('section')].find((s) => r.test(s.querySelector('h2')?.textContent || ''));
  return sec ? [...sec.querySelectorAll('tbody tr')].map((tr) => [...tr.children].map((x) => x.innerText.trim().replace(/\s+/g, ' ')).join(' | ')) : []; }, re.source);
const pick = async (l) => { const x = page.getByRole('button', { name: l, exact: true }); if (await x.count()) { await x.first().click(); await page.waitForTimeout(300); } };
const bryly = async (widok) => {
  await pick(widok); await pick('Zamk.');
  await page.evaluate(() => { window.__audytBryl = []; });
  await pick('3D'); await page.waitForTimeout(300);
  const s = await page.evaluate(() => { const a = window.__audytBryl; window.__audytBryl = null; return a; });
  await pick('Front');
  // standalone rysuje dwa razy (StrictMode) — te same bryly raz
  const byl = new Set();
  return (s || []).filter((x) => { const k = JSON.stringify([x.p, x.d, x.tag]); if (byl.has(k)) return false; byl.add(k); return true; })
    .map((x) => ({ d: [...x.d].map(Math.round), tag: x.tag }));
};

console.log('== N119: wspólne dno ciągu w 3D ==');
{
  const run = RUN('c1', 'Ściana', { gap: 20, D: 500, worktop: false, wspolneDno: true });
  const c = (n) => ({ name: n, W: 600, H: 720, D: 500, plinth: PL, legs: { on: false }, joints: { topL: 'over', topR: 'over', botL: 'over', botR: 'over' },
    dnoZCiagu: { botL: null, botR: null }, levels: [{ h: null, cols: [kol({ shelfTargets: [] })] }] });
  await seed({ name: 'P', active: 0, prices: {}, runs: [run], items: [{ cab: c('S1'), runId: 'c1', offset: 0 }, { cab: c('S2'), runId: 'c1', offset: 0 }] });
  const zam = (await rows(/^Formatki całego projektu/)).filter((r) => /^Dno/.test(r));
  ok('zamówienie: „Dno ciągu” 1220 × 500, bez den szafek', zam.length === 1 && /^Dno ciągu .*\| 1220 \| 500 \| 1 \|/.test(zam[0]), zam.join(' / '));
  const bl = await bryly('Ciąg');
  const dnoC = bl.filter((x) => x.tag === 'dno-ciagu');
  ok('3D: jedna płyta „dno-ciagu” 1220 mm (nie dwa dna po 600 ze szparą 20)', dnoC.length === 1 && dnoC[0].d.includes(1220), JSON.stringify(dnoC));
}

console.log('\n== N130: oklejanie formatek ramienia z tabeli ==');
{
  await seed(rog(Lcab()));
  await pick('Szafka');
  const przed = (await rows(/^Formatki do zamówienia$/)).find((r) => /^Front ramienia/.test(r)) || '';
  const btn = page.locator('section tbody tr', { hasText: 'Front ramienia' }).first().locator('button', { hasText: /^przód/ }).first();
  const tytul0 = await btn.getAttribute('title');
  await btn.click(); await page.waitForTimeout(900);
  const tytul1 = await page.locator('section tbody tr', { hasText: 'Front ramienia' }).first().locator('button', { hasText: /^przód/ }).first().getAttribute('title');
  const p = await zap();
  ok('klik „przód” przy Froncie ramienia: zapisane nadpisanie, przycisk „Bez obrzeża”', /Oklejona/.test(tytul0) && /Bez obrzeża/.test(tytul1)
    && p.items[1].cab.edgeOverrides && p.items[1].cab.edgeOverrides['Front ramienia'] && p.items[1].cab.edgeOverrides['Front ramienia'].a1 === false, `${tytul0} → ${tytul1} | ${przed}`);
}

console.log('\n== N136: kołki półki płytkiego ramienia ==');
{
  await seed(rog(Lcab({ shelfPin: { dFront: 250, dBack: 50 } }), { run1: { D: 200 }, a1: { D: 200, shelfPin: { dFront: 70, dBack: 70 } } }));
  const n = (await notes()).find((x) => /kołki półek 250 mm od przodu i 50 mm od tyłu nie mieszczą się na półce ramienia/.test(x.txt));
  ok('błąd przy szafce w L z „Ustaw 50 / 50 mm”', !!n && n.btns.includes('Ustaw 50 / 50 mm'), JSON.stringify(n || (await notes()).map((x) => x.txt.slice(0, 90))));
  if (n) await page.getByRole('button', { name: 'Ustaw 50 / 50 mm', exact: true }).first().click();
  const p = await zap();
  ok('po kliknięciu: kołki 50 / 50 w szafce L (nie w sąsiedniej), błąd znika', p.items[1].cab.shelfPin.dFront === 50 && p.items[1].cab.shelfPin.dBack === 50
    && p.items[0].cab.shelfPin.dFront === 70
    && !(await notes()).some((x) => /nie mieszczą się na półce ramienia/.test(x.txt)), JSON.stringify(p.items.map((it) => it.cab.shelfPin)));
}

console.log('\n== N132/N139: uwagi szafki w L ==');
{
  await seed(rog(Lcab({ H: 900, levels: [{ h: 450, cols: [kol()] }, { h: null, cols: [kol()] }] })));
  ok('N132: dwa poziomy frontów przy ramieniu — błąd „reszta ramienia zostaje otwarta”', (await notes()).some((x) => /2 fronty jeden nad drugim/.test(x.txt) && /Reszta ramienia zostaje otwarta/.test(x.txt)));
  await seed(rog(Lcab({ levels: [{ h: null, cols: [{ kind: 'drawers', w: null, drawers: [{ h: null, system: 'dxs', nl: 400, sideH: 80 }] }] }] })));
  ok('N139: szuflady w kolumnie przy ramieniu — błąd montażu', (await notes()).some((x) => /szuflady w kolumnie przy ramieniu szafki narożnej w L/.test(x.txt)));
}

console.log('\n== N122: nóżka pod wycięciem narożnika ==');
{
  await seed({ name: 'P', active: 0, prices: {}, runs: [], items: [{ cab: { name: 'S', W: 600, H: 720, D: 560, plinth: { on: false }, legs: { on: true, height: 100 },
    cutout: { on: true, w: 100, d: 100, fullHeight: true, mask: true }, levels: [{ h: null, cols: [{ kind: 'open', w: null, shelfTargets: [] }] }] }, runId: null, offset: 0 }] });
  ok('ostrzeżenie „przechodzi przez dno nad nóżką”', (await notes()).some((x) => /przechodzi przez dno nad nóżką/.test(x.txt)));
}

ok('bez błędów strony', !errors.length, errors.join(' / '));
await b.close();
