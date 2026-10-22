/* Audyt GPT 2026-10-17, ustalenia N5–N21 i U3 (N2–N4 i N15 — blat — sa
   w `cutplan`). Kazdy punkt: zamowienie, uwagi i bryla 3D musza mowic to samo.
   Ustalenia uzytkownika 2026-10-17: nozki min. 50 mm (katalog GTV, MLA-50),
   szafka bez zawieszek w ciagu na listwie — ostrzezenie z wyborem listwa /
   haczyki, listwa tylko gdy choc jedna szafka na niej wisi. */
import pw from './pw.mjs';
const URL = process.env.STD ? 'http://127.0.0.1:5199/standalone-local.html'
  : 'http://127.0.0.1:5205/mebloprojekt-app.html';
const ok = (l, c, e = '') => console.log((c ? '  OK   ' : '  BLAD ') + l + (e ? ' — ' + e : ''));
const b = await pw.chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const page = await (await b.newContext({ viewport: { width: 1500, height: 1300 } })).newPage();
const errors = []; page.on('pageerror', (e) => errors.push(e.message));
await page.goto(URL, { waitUntil: 'networkidle' });

const PL = { on: true, height: 100, mode: 'under', setback: 0 };
const cab = (o = {}) => ({ name: 'S', W: 600, H: 720, D: 560, plinth: PL, levels: [{ h: null, cols: [{ kind: 'doors', doors: 1, w: null }] }], ...o });
const proj = (items, runs = [], extra = {}) => ({ name: 'A', active: 0, prices: {}, runs, items: items.map((it) => ({ offset: 0, runId: null, ...it })), ...extra });
const seed = async (p) => {
  await page.evaluate((q) => { localStorage.clear(); localStorage.setItem('szafki:projekt', JSON.stringify(q)); }, p);
  await page.reload({ waitUntil: 'networkidle' }); await page.waitForTimeout(1200);
};
const rows = (re) => page.evaluate((src) => { const r = new RegExp(src);
  const sec = [...document.querySelectorAll('section')].find((s) => r.test(s.querySelector('h2')?.textContent || ''));
  return sec ? [...sec.querySelectorAll('tbody tr')].map((tr) => [...tr.children].map((x) => x.innerText.trim().replace(/\s+/g, ' ')).join(' | ')) : []; }, re.source);
const uwagi = async () => (await page.evaluate(() => [...document.querySelectorAll('section')].find((s) => /^Uwagi/.test(s.querySelector('h2')?.textContent || ''))?.innerText || ''));
const linie = (t, re) => t.split('\n').filter((l) => re.test(l)).join(' / ');
const pick = async (l) => { const x = page.getByRole('button', { name: l, exact: true }); if (await x.count()) { await x.first().click(); await page.waitForTimeout(300); } };
const bryly = async () => {
  await pick('Szafka'); await pick('Zamk.');
  await page.evaluate(() => { window.__audytBryl = []; });
  await pick('3D'); await page.waitForTimeout(300);
  const s = await page.evaluate(() => { const a = window.__audytBryl; window.__audytBryl = null; return a; });
  await pick('Front');
  return (s || []).map((x) => ({ d: [...x.d].sort((p, q) => p - q).map(Math.round), color: x.color, tag: x.tag }));
};
const wym = (x) => x.d.join('×');
const zapis = () => page.evaluate(() => JSON.parse(localStorage.getItem('szafki:projekt')));

console.log('== N5: HDF w dwóch kolorach — osobne grupy rozkroju ==');
await seed(proj([{ cab: cab({ name: 'A' }), mat: { back: { color: '#ffffff' } } }, { cab: cab({ name: 'B' }), mat: { back: { color: '#111111' } } }]));
await page.waitForFunction(() => window.__audytRozkroj && window.__audytRozkroj.aktualny, null, { timeout: 15000 });
let g = await page.evaluate(() => (window.__audytRozkroj.groups || []).filter((x) => /HDF/.test(x.matLabel)).map((x) => `${x.matLabel}: ${x.sheets.length}`));
ok('dwa kolory HDF: dwie grupy po 1 arkuszu', g.length === 2 && g.every((x) => /: 1$/.test(x)), g.join(' / '));
await seed(proj([{ cab: cab({ name: 'A' }) }, { cab: cab({ name: 'B' }) }]));
await page.waitForFunction(() => window.__audytRozkroj && window.__audytRozkroj.aktualny, null, { timeout: 15000 });
g = await page.evaluate(() => (window.__audytRozkroj.groups || []).filter((x) => /HDF/.test(x.matLabel)).map((x) => x.matLabel));
ok('jeden kolor HDF: etykieta dalej „HDF”', g.length === 1 && g[0] === 'HDF', g.join(' / '));

console.log('\n== N6: ręczne oklejanie wstawki w rogu ==');
{
  const r1 = { id: 'c1', name: 'Ściana 1', wallW: null, gap: 0, mountY: 0, H: 720, D: 560, plinth: PL, worktop: false, corner: null };
  const r2 = { id: 'c2', name: 'Ściana 2', wallW: null, gap: 0, mountY: 0, H: 720, D: 560, plinth: PL, worktop: false, corner: { of: 'c1', at: 'end', owner: 'of', clear: 0, wstawka: { typ: 'plaska', w: 60 } } };
  const eo = { 'Wstawka w rogu': { a1: false, a2: false, b1: false, b2: true } };
  await seed(proj([{ cab: cab({ name: 'A' }), runId: 'c1' }, { cab: cab({ name: 'B', edgeOverrides: eo }), runId: 'c2' }], [r1, r2]));
  const w = (await rows(/^Formatki całego projektu/)).find((r) => /^Wstawka w rogu/.test(r)) || '';
  ok('oklejanie wstawki z `edgeOverrides` (tylko jeden bok 60)', /\| bok 60$/.test(w) && !/przód 720/.test(w), w);
}

console.log('\n== N7: fronty z płyty korpusu — grubość jak w zamówieniu ==');
for (const [kb, kf] of [[25, 18], [18, 25]]) {
  await seed(proj([{ cab: cab({ frontSameAsBoard: true }), mat: { board: { thickness: kb }, front: { thickness: kf } } }]));
  const f = (await rows(/^Formatki do zamówienia/)).find((r) => /^Drzwi/.test(r)) || '';
  const d = (await bryly()).filter((x) => x.d[2] === 714 && x.d[1] === 596).map(wym);
  ok(`korpus ${kb}, ukryty front ${kf}: formatka i bryła drzwi ${kb} mm`, new RegExp(`Płyta [^|]*${kb} \\|`).test(f) && d.length === 1 && d[0] === `${kb}×596×714`, `${f.split('|').slice(0, 2).join('|')} / ${d.join(', ')}`);
}

console.log('\n== N8: nóżki niższe niż 50 mm ==');
await seed(proj([{ cab: cab({ plinth: { on: false }, legs: { on: true, height: 0 } }) }]));
let u = await uwagi();
ok('nóżki 0 mm: błąd z MLA-50 i przyciskami 50 / 100 mm', /Nóżki 0 mm — najniższe regulowane nóżki w katalogu GTV to MLA-50/.test(u) && /Ustaw 50 mm/.test(u) && /Ustaw 100 mm/.test(u), linie(u, /Nóżki/));
const nz = (await rows(/^Produkty do zamówienia/)).find((r) => /^Nóżka/.test(r)) || '';
ok('zamówienie z tej samej wysokości co rysunek (0, nie 100)', /wysokość 0 mm/.test(nz), nz);
await page.getByRole('button', { name: 'Ustaw 50 mm' }).first().click(); await page.waitForTimeout(800);
ok('„Ustaw 50 mm” zapisuje 50 i błąd znika', (await zapis()).items[0].cab.legs.height === 50 && !/Nóżki \d+ mm — najniższe/.test(await uwagi()));

console.log('\n== N9: różne nóżki w zbiorczym zamówieniu ==');
await seed(proj([{ cab: cab({ name: 'A', plinth: { on: false }, legs: { on: true, height: 100, shape: 'square' } }) },
  { cab: cab({ name: 'B', plinth: { on: false }, legs: { on: true, height: 150, shape: 'round' } }) }]));
let pr = (await rows(/^Produkty całego projektu/)).filter((r) => /^Nóżka/.test(r));
ok('dwa wiersze: kwadratowa 100 i okrągła 150, po 4 szt.', pr.length === 2 && pr.some((r) => /kwadratowa, 100 mm/.test(r) && /4 szt\./.test(r)) && pr.some((r) => /okrągła, 150 mm/.test(r) && /4 szt\./.test(r)), pr.join(' / '));
await seed(proj([{ cab: cab({ name: 'A', frontMode: 'overlay' }) }, { cab: cab({ name: 'B', frontMode: 'inset' }) }]));
pr = (await rows(/^Produkty całego projektu/)).filter((r) => /^Zawias \|/.test(r));
ok('zawiasy nakładane i wpuszczane — osobne wiersze', pr.length === 2 && pr.some((r) => /nakładany/.test(r)) && pr.some((r) => /wpuszczany/.test(r)), pr.join(' / '));

console.log('\n== N10: dodatkowa formatka „Cokół” / „Blat” w ciągu ze wspólnym ==');
for (const nazwa of ['Cokół', 'Blat']) {
  await seed(proj([{ cab: cab({ name: 'A', extraParts: [{ name: nazwa, a: 999, b: 123, qty: 1, matKey: 'board', edges: {} }] }), runId: 'c1' }, { cab: cab({ name: 'B' }), runId: 'c1' }],
    [{ id: 'c1', name: 'Ściana', wallW: null, gap: 0, mountY: 0, H: 720, D: 560, plinth: PL, worktop: true, corner: null }]));
  const sz = (await rows(/^Formatki do zamówienia/)).filter((r) => /\| 999 \| 123 \|/.test(r));
  const pj = (await rows(/^Formatki całego projektu/)).filter((r) => /\| 999 \| 123 \|/.test(r));
  ok(`dodatkowa „${nazwa}” 999 × 123 zostaje w szafce i w projekcie`, sz.length === 1 && pj.length === 1, `${sz.join(' / ')} // ${pj.join(' / ')}`);
}

console.log('\n== N11: plecy ustawione w kolumnie — bryła jak zamówienie ==');
for (const [gb, cb, plecy] of [['hdf', 'none', null], ['none', 'hdf', '3×598×718'], ['hdf', 'board', '18×598×718']]) {
  await seed(proj([{ cab: cab({ back: gb, levels: [{ h: null, cols: [{ kind: 'doors', doors: 1, w: null, backMode: cb }] }] }) }]));
  const s = (await bryly()).filter((x) => x.d[2] >= 700 && x.d[1] >= 590 && x.d[0] <= 20 && !(x.d[1] === 596 && x.d[2] === 714)).map(wym);
  ok(`szafka ${gb}, kolumna ${cb}: plecy w 3D ${plecy || 'brak'}`, plecy ? s.length === 1 && s[0] === plecy : s.length === 0, s.join(', ') || '(brak)');
}

console.log('\n== N12: dno i tył szuflady z płyty półek 25 mm ==');
await seed(proj([{ cab: cab({ shelfSameAsBoard: false, levels: [{ h: null, cols: [{ kind: 'drawers', drawers: [{ h: null }, { h: null }], w: null }] }] }),
  mat: { shelf: { thickness: 25, name: 'Płyta', color: '#3366cc' } } }]));
{
  const s = (await bryly()).filter((x) => x.color === '#3366cc').map(wym);
  ok('dno 489 × 526 i tył 477 × 230 w 3D po 25 mm', s.length === 4 && s.filter((x) => x === '25×489×526').length === 2 && s.filter((x) => x === '25×230×477').length === 2, s.join(', '));
}

console.log('\n== N13: HDF przy wycięciu narożnika ==');
await seed(proj([{ cab: cab({ back: 'hdf', cutout: { on: true, w: 100, d: 100, fullHeight: true, levelIndex: 0, mask: true, maskType: 'auto', maskFront: 'over' } }) }]));
{
  const f = (await rows(/^Formatki do zamówienia/)).find((r) => /^Plecy HDF/.test(r)) || '';
  const s = (await bryly()).filter((x) => x.d[0] === 3).map(wym);
  ok('formatka 498 × 718 i bryła 3 × 498 × 718', /\| 498 \| 718 \|/.test(f) && s.includes('3×498×718'), `${f} / ${s.join(', ')}`);
}

console.log('\n== N14: blenda nad szafką w 3D ==');
await seed(proj([{ cab: cab({ topFiller: { on: true, height: 80 } }) }]));
{
  const s = (await bryly()).filter((x) => x.tag === 'blenda').map(wym);
  ok('bryła blendy 18 × 80 × 600', s.length === 1 && s[0] === '18×80×600', s.join(', ') || '(brak)');
}

console.log('\n== N16: kołki półki poza płytą ==');
await seed(proj([{ cab: cab({ shelfPin: { dFront: 700, dBack: 700 }, levels: [{ h: null, cols: [{ kind: 'doors', doors: 1, w: null, shelfTargets: [null, null] }] }] }) }]));
u = await uwagi();
ok('700 / 700 mm na półce 560: błąd z przyciskiem „Ustaw 37 / 37 mm”', /Kołki półek 700 mm od przodu i 700 mm od tyłu nie mieszczą się na półce głębokości 560 mm/.test(u) && /Ustaw 37 \/ 37 mm/.test(u), linie(u, /Kołki/));
await page.getByRole('button', { name: 'Ustaw 37 / 37 mm' }).first().click(); await page.waitForTimeout(800);
ok('po przycisku 37 / 37 i bez błędu', JSON.stringify((await zapis()).items[0].cab.shelfPin) === '{"dFront":37,"dBack":37}' && !/Kołki półek/.test(await uwagi()));

console.log('\n== N17: własny blat roboczy w kolorze blatu ==');
await seed(proj([{ cab: cab({ realColors: true, top: { mode: 'blat', material: 'worktop', widthMode: 'outside', overL: 0, overR: 0, overFront: 0, overBack: 0 } }),
  mat: { board: { color: '#ff0000' }, worktop: { color: '#0000ff' } } }]));
{
  const s = (await bryly()).filter((x) => x.d[0] === 38);
  ok('bryła blatu 38 mm w kolorze blatu (#0000ff)', s.length === 1 && s[0].color === '#0000ff', s.map((x) => wym(x) + ' ' + x.color).join(', '));
}

console.log('\n== N18: dwa zawiasy w jednym miejscu ==');
/* H250 z 5 polkami bylo tu dawniej: dwa zawiasy staly 100 mm od krawedzi i 45 mm od siebie.
   Od 2026-10-22 front 201–254 mm rozklada je na cala wysokosc (jak front do 200) i tam
   sie mieszcza — przyklad bledu to teraz H300 z 6 polkami (macierz szuflad). */
await seed(proj([{ cab: cab({ H: 300, plinth: { on: false }, levels: [{ h: null, cols: [{ kind: 'doors', doors: 1, w: null, shelfTargets: Array(7).fill(null) }] }] }) }]));
u = await uwagi();
ok('H300, 6 półek: błąd „zawiasy nie mieszczą się między półkami”', /skrzydło 1: 2 zawiasy nie mieszczą się między półkami — po ich ominięciu wypadają w jednym miejscu/.test(u), linie(u, /zawias/));
await seed(proj([{ cab: cab({ H: 250, plinth: { on: false }, levels: [{ h: null, cols: [{ kind: 'doors', doors: 1, w: null, shelfTargets: [null] }] }] }) }]));
ok('front ok. 245 mm bez półek: dwa zawiasy na całej wysokości, bez tego błędu', !/nie mieszczą się między półkami/.test(await uwagi()));
await seed(proj([{ cab: cab({ levels: [{ h: null, cols: [{ kind: 'doors', doors: 1, w: null, shelfTargets: [null, null, null] }] }] }) }]));
ok('zwykła szafka 720 z 2 półkami: bez tego błędu', !/nie mieszczą się między półkami/.test(await uwagi()));

console.log('\n== N19: NL spoza tabeli V-BOX ==');
await seed(proj([{ cab: cab({ levels: [{ h: null, cols: [{ kind: 'drawers', drawers: [{ h: null }, { h: null }], w: null, nl: 325 }] }] }) }]));
u = await uwagi();
ok('NL 325: błąd z listą V-BOX i przyciskiem NL 300', /prowadnice NL 325 — nie ma takiej długości w V-BOX \(250, 270, 300, 350, 400, 450, 500, 550, 600\)/.test(u) && /NL 300/.test(u), linie(u, /NL 325/));

console.log('\n== N20: lustra — powierzchnia i sztuki ==');
{
  const c = () => ({ cab: cab({ levels: [{ h: null, cols: [{ kind: 'doors', doors: 1, w: null, mirrors: [true] }] }] }) });
  await seed(proj([c(), c(), c()]));
  const l = (await rows(/^Produkty całego projektu/)).find((r) => /^Lustro/.test(r)) || '';
  ok('3 lustra 595 × 713: „× 3 szt.” i 1.273 m² (nie 1.26)', /595 × 713 mm × 3 szt\./.test(l) && /1\.273 m²/.test(l), l);
}

console.log('\n== N21: listwa i zawieszki w ciągu ==');
{
  const c = (n, o = {}) => ({ cab: cab({ name: n, plinth: { on: false }, legs: { on: false }, H: 720, D: 320, ...o }), runId: 'c1' });
  const R = [{ id: 'c1', name: 'Ściana', wallW: null, gap: 0, mountY: 1400, H: 720, D: 320, plinth: null, worktop: false, hangerMode: 'listwa', corner: null }];
  await seed(proj([c('A', { hangers: 'never', hangerMode: 'listwa' }), c('B', { hangers: 'never', hangerMode: 'listwa' })], R));
  pr = (await rows(/^Produkty całego projektu/)).filter((r) => /Listwa|Zawieszka/.test(r));
  ok('obie szafki bez zawieszek: bez listwy i zawieszek', pr.length === 0, pr.join(' / '));
  await seed(proj([c('A', { hangerMode: 'listwa' }), c('B', { hangers: 'never', hangerMode: 'listwa' })], R, { active: 1 }));
  u = await uwagi();
  ok('jedna na listwie, druga bez zawieszek: ostrzeżenie z wyborem listwa / haczyki', /Ta szafka jest bez zawieszek, a inne szafki ciągu „Ściana" wiszą na zawieszkach na listwie/.test(u)
    && /Zawieszki na listwie/.test(u) && /Zawieszki na haczykach/.test(u) && !/Ta szafka wiesza się na haczykach/.test(u), linie(u, /zawiesz|haczyk/i));
  pr = (await rows(/^Produkty całego projektu/)).filter((r) => /^Listwa/.test(r));
  ok('listwa jest (choć jedna szafka na niej wisi)', pr.length === 1, pr.join(' / '));
  await page.getByRole('button', { name: 'Zawieszki na haczykach' }).first().click(); await page.waitForTimeout(800);
  const zp = (await zapis()).items[1].cab;
  u = await uwagi();
  ok('„Zawieszki na haczykach”: zawieszki włączone, na haczykach — zostaje ostrzeżenie o wyjątku', zp.hangers === 'auto' && zp.hangerMode === 'haczyki' && /Ta szafka wiesza się na haczykach, a ciąg na listwie/.test(u), JSON.stringify([zp.hangers, zp.hangerMode]));
}

console.log('\n== U3: nagłówek „Rysunek” w wąskim oknie ==');
await page.setViewportSize({ width: 714, height: 1000 });
await seed(proj([{ cab: cab() }]));
{
  const h = await page.evaluate(() => [...document.querySelectorAll('h2')].filter((x) => x.textContent === 'Rysunek').map((x) => Math.round(x.getBoundingClientRect().width)));
  ok('714 px: tytuł „Rysunek” widoczny (szerokość > 40 px)', h.length > 0 && h.every((w) => w > 40), h.join(', '));
}

console.log('\nBLEDY:', errors.length ? errors.join('\n') : '(brak)');
await b.close();
