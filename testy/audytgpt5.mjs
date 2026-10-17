/* Audyt GPT 2026-10-17, ustalenia N49–N68 oraz decyzje do N42, N45, N49.
   Decyzje uzytkownika (2026-10-17):
   - N45: konfirmaty z obu stron jednej plyty w tej samej osi — blad z wyborem
     mocowania drugiej strony (trojkaty / kolki), zmienialnym potem w kolumnie;
   - N42: fix w kolumnie szuflad bez wspornika — blad z „Usuń element stały” /
     „Dobuduj wspornik pionowy”; ze wspornikiem szuflada wezsza, prowadnica na nim;
   - N49: polki szafki w L na konfirmatach — przy rogu konfirmat w plyte katownika
     przy plecach, polka ramienia: konfirmaty w boku ramienia, przy rogu kolki. */
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
const RUN = (id, o = {}) => ({ id, name: 'Ściana ' + id, wallW: null, gap: 0, mountY: 0, worktop: true, corner: null, ...o });
const seed = async (p) => {
  await page.evaluate((q) => { localStorage.clear(); localStorage.setItem('szafki:projekt', JSON.stringify(q)); }, p);
  await page.reload({ waitUntil: 'networkidle' }); await page.waitForTimeout(900);
};
const rows = (re) => page.evaluate((src) => { const r = new RegExp(src);
  const sec = [...document.querySelectorAll('section')].find((s) => r.test(s.querySelector('h2')?.textContent || ''));
  return sec ? [...sec.querySelectorAll('tbody tr')].map((tr) => [...tr.children].map((x) => x.innerText.trim().replace(/\s+/g, ' ')).join(' | ')) : []; }, re.source);
const wszystkieProdukty = () => page.evaluate(() => [...document.querySelectorAll('section')]
  .filter((s) => /^Produkty/.test(s.querySelector('h2')?.textContent || ''))
  .flatMap((s) => [...s.querySelectorAll('tbody tr')].map((tr) => tr.innerText.replace(/\s+/g, ' '))));
const uwagi = async () => (await page.evaluate(() => [...document.querySelectorAll('section')].find((s) => /^Uwagi/.test(s.querySelector('h2')?.textContent || ''))?.innerText || ''));
const ikona = (re) => page.evaluate((src) => { const r = new RegExp(src);
  const li = [...document.querySelectorAll('section li')].find((x) => r.test(x.textContent));
  return li ? ([...li.querySelectorAll('span.font-mono')].map((s) => s.textContent.trim()).find((t) => /^[×!i]$/.test(t)) || null) : null; }, re.source);
const linie = (t, re) => t.split('\n').filter((l) => re.test(l)).join(' / ');
const ilosc = (r) => (r ? Number((r.split('|').pop() || '').trim().split(' ')[0]) : null);
const okucie = async (re) => (await rows(/^Produkty do zamówienia/)).find((r) => re.test(r)) || '';
const zapis = () => page.evaluate(() => JSON.parse(localStorage.getItem('szafki:projekt')));
const pick = async (l) => { const x = page.getByRole('button', { name: l, exact: true }); if (await x.count()) { await x.first().click(); await page.waitForTimeout(250); } };
const bryly = async (zakres = 'Szafka') => {
  await pick(zakres); await pick('Zamk.');
  await page.evaluate(() => { window.__audytBryl = []; });
  await pick('3D'); await page.waitForTimeout(300);
  const s = await page.evaluate(() => { const a = window.__audytBryl; window.__audytBryl = null; return a; });
  await pick('Front');
  return (s || []).map((x) => ({ d: [...x.d].sort((p, q) => p - q).map(Math.round), color: x.color, tag: x.tag, p: x.p, v: x.v }));
};
const plan = async () => {
  await page.evaluate(() => { window.__rep = null; window.print = () => {
    window.__rep = [...document.querySelectorAll('.print-only table')].flatMap((t) => [...t.querySelectorAll('tbody tr')].map((tr) => tr.innerText.replace(/\s+/g, ' '))); }; });
  await page.getByRole('button', { name: 'Zestawienie PDF', exact: true }).first().click(); await page.waitForTimeout(900);
  return (await page.evaluate(() => window.__rep)) || [];
};
const klik = async (name) => { const x = page.getByRole('button', { name }); const n = await x.count(); if (n) { await x.first().click(); await page.waitForTimeout(1200); } return n; };

console.log('== N45: konfirmaty z obu stron jednej płyty ==');
{
  const k2 = cab({ W: 800, H: 1200, back: 'none', shelfMount: 'confirmat', plinth: { on: false },
    levels: [{ h: null, cols: [{ kind: 'doors', doors: 0, w: null, shelfTargets: [null, null] }, { kind: 'doors', doors: 0, w: null, shelfTargets: [null, null] }] }] });
  await seed(proj([{ cab: k2 }]));
  ok('półki naprzeciw siebie — błąd z wyborem', /półki na konfirmatach po obu stronach przegrody 1/.test(await uwagi()) && (await ikona(/po obu stronach przegrody/)) === '×', linie(await uwagi(), /po obu stronach/));
  ok('…dwa przyciski: trójkąty i kołki', (await page.getByRole('button', { name: 'Półki kolumny 2 na trójkątach' }).count()) === 1
    && (await page.getByRole('button', { name: 'Półki kolumny 2 na kołkach' }).count()) === 1);
  await klik('Półki kolumny 2 na trójkątach');
  const z = await zapis();
  ok('wybór zapisany w kolumnie (shelfMount = trojkaty)', z.items[0].cab.levels[0].cols[1].shelfMount === 'trojkaty');
  ok('błąd znika, konfirmaty tylko kolumny 1 (24), trójkąty 4', !/po obu stronach przegrody/.test(await uwagi())
    && ilosc(await okucie(/^Konfirmat/)) === 24 && ilosc(await okucie(/^Trójkąt/)) === 4, (await okucie(/^Konfirmat/)) + ' / ' + (await okucie(/^Trójkąt/)));
  ok('w kolumnie da się to zmienić później (pole „mocowanie”)', (await page.locator('[data-el="mocowanie-kolumny"]').count()) >= 2);
  const B = cab({ W: 800, H: 1200, back: 'none', plinth: { on: false },
    levels: [{ h: 300, cols: [{ kind: 'doors', doors: 0, w: null }, { kind: 'doors', doors: 0, w: null }] }, { h: null, cols: [{ kind: 'doors', doors: 0, w: null }, { kind: 'doors', doors: 0, w: null }] }] });
  await seed(proj([{ cab: B }]));
  ok('przegroda nad przegrodą — błąd', /przegroda 1 stoi nad przegrodą poziomu 1/.test(await uwagi()), linie(await uwagi(), /stoi nad/));
  await klik('Dół przegrody na trójkątach');
  ok('…po wyborze: dół górnej na trójkątach (3), konfirmatów 27', !/stoi nad przegrodą/.test(await uwagi())
    && ilosc(await okucie(/^Trójkąt/)) === 3 && ilosc(await okucie(/^Konfirmat/)) === 27, (await okucie(/^Konfirmat/)) + ' / ' + (await okucie(/^Trójkąt/)));
  const pl = await plan();
  ok('plan: trójkąt przy przegrodzie na półce przelotowej', pl.some((r) => /trójkąt meblowy — przegroda/.test(r)), pl.filter((r) => /przegroda/.test(r)).join(' // ').slice(0, 200));
}

console.log('\n== N42: fix w kolumnie szuflad ==');
{
  await seed(proj([{ cab: cab({ back: 'none', plinth: { on: false }, levels: [{ h: null, cols: [{ kind: 'drawers', drawers: [{ h: null }, { h: null }], w: null, fix: { side: 'left', w: 100, mode: 'overlay', support: false } }] }] }) }]));
  ok('bez wspornika — błąd', /element stały zasłania część kolumny szuflad/.test(await uwagi()) && (await ikona(/zasłania część kolumny/)) === '×');
  ok('…przyciski „Usuń element stały” i „Dobuduj wspornik pionowy”', (await page.getByRole('button', { name: 'Usuń element stały' }).count()) === 1
    && (await page.getByRole('button', { name: 'Dobuduj wspornik pionowy' }).count()) === 1);
  await klik('Dobuduj wspornik pionowy');
  const f = (await rows(/^Formatki do zamówienia/)).join(' / ');
  ok('wspornik na długość prowadnicy (550), bez błędu', /Wspornik pionowy \| [^|]+ \| 684 \| 550/.test(f) && !/zasłania część kolumny|wspornik ma/.test(await uwagi()), f.slice(0, 200));
  ok('szuflada węższa: dno 407 (482 − 75)', /Dno szuflady \| [^|]+ \| 407 \|/.test(f));
  const pl = await plan();
  ok('prowadnica od strony fixu na wsporniku', pl.some((r) => /^Wspornik pionowy\s*prowadnica/.test(r)) && pl.some((r) => /^Bok prawy\s*prowadnica/.test(r)), pl.filter((r) => /prowadnica/.test(r)).map((r) => r.slice(0, 40)).join(' // '));
  await seed(proj([{ cab: cab({ back: 'none', plinth: { on: false }, levels: [{ h: null, cols: [{ kind: 'drawers', drawers: [{ h: null }, { h: null }], w: null, fix: { side: 'left', w: 100, mode: 'overlay', support: false } }] }] }) }]));
  await klik('Usuń element stały');
  ok('„Usuń element stały” — fix znika', ((await zapis()).items[0].cab.levels[0].cols[0].fix || {}).side === 'none');
}

console.log('\n== N49–N61: szafka w L ==');
{
  const L = (o = {}, oc = {}) => ({ cab: cab({ name: 'L', W: 900, corner: { on: true, arm: 640, doors: 'wsporniki', ...oc }, ...o }), runId: 'c1' });
  const B2 = (o = {}) => ({ cab: cab({ name: 'B', ...o }), runId: 'c2' });
  const runs = [RUN('c1', { worktop: false }), RUN('c2', { worktop: false, corner: { of: 'c1', at: 'end', owner: 'of', clear: 0 } })];
  const formatki = async () => (await rows(/^Formatki całego projektu/)).join(' / ');
  await seed(proj([L({ shelfMount: 'confirmat', levels: [{ h: null, cols: [{ kind: 'doors', doors: 1, w: null, shelfTargets: [null, null] }] }] }), B2()], runs));
  const prod = (await wszystkieProdukty()).join(' / ');
  ok('N49: półka korpusu do kątownika, półka ramienia do boku ramienia + 2 kołki', /półki do kątownika 1×2/.test(prod) && /półki ramienia do boku ramienia: 1×3/.test(prod)
    && /półki ramienia przy rogu.*po dwa na półkę 2 szt/.test(prod), prod.slice(0, 300));
  const pl = await plan();
  ok('N49: plan bez „Boku prawego” szafki L, konfirmat w kątowniku i w boku ramienia', pl.some((r) => /^Kątownik przy ramieniu — bok\s*konfirmat — półka/.test(r))
    && pl.some((r) => /konfirmat — półka ramienia/.test(r)) && !pl.some((r) => /^Bok prawy\s*konfirmat — półka/.test(r)), pl.filter((r) => /półka/.test(r)).map((r) => r.slice(0, 50)).join(' // '));
  ok('N50: uchwyt frontu ramienia w zamówieniu', /front ramienia szafki narożnej/.test(prod));
  await seed(proj([L({ joints: { botL: 'none', botR: 'none' } }), B2()], runs));
  const f51 = await formatki();
  ok('N51: bez dna w korpusie — sam „Wieniec ramienia”', /Wieniec ramienia \|[^/]*\| 622 \| 560 \| 1/.test(f51) && !/Wieniec i dno ramienia/.test(f51));
  await seed(proj([L({}, { backBoard: true }), B2()], runs));
  const s52 = (await bryly('Ciąg')).filter((x) => x.d.includes(1197));
  ok('N52: plecy ramienia z płyty w 3D 684 wysokości, jak w zamówieniu', s52.length === 1 && s52[0].d.includes(684), s52.map((x) => x.d.join('×')).join(', '));
  await seed(proj([L({ plinth: { on: true, height: 100, mode: 'inbody', setback: 0 } }), B2({ plinth: { on: true, height: 100, mode: 'inbody', setback: 0 } })], runs));
  ok('N56: cokół ramienia także przy cokole w obrysie', /Cokół ramienia \|[^/]*\| 640 \| 100/.test(await formatki()));
  await seed(proj([L({ legs: { on: false } }), B2()], runs));
  ok('N61: cokół ramienia bez nóżek — trójkąty', /cokół ramienia szafki narożnej bez nóżek/.test((await wszystkieProdukty()).join(' / ')));
  await seed(proj([L({ legs: { on: true, height: 100 }, plinth: { on: true, height: 100, mode: 'under', setback: 0 } }), B2({ legs: { on: true, height: 100 } })], runs));
  ok('N61: cokół ramienia na nóżkach — klipsy', /cokół ramienia szafki narożnej: klips/.test((await wszystkieProdukty()).join(' / ')));
}

console.log('\n== N55: cofnięty cokół w 3D zabudowy ==');
{
  const p0 = [];
  for (const sb of [0, 20]) {
    const P = { on: true, height: 100, mode: 'under', setback: sb };
    await seed(proj([{ cab: cab({ plinth: P }), runId: 'c1' }], [RUN('c1', { plinth: P })]));
    const c = (await bryly('Ciąg')).filter((x) => x.d.join() === '18,100,600');
    p0.push(c.length ? c[0].p[2] : null);
  }
  ok('cokół 20 mm głębiej', p0[0] !== null && p0[1] === p0[0] + 20, JSON.stringify(p0));
}

console.log('\n== N58: licznik cięć przy ścinku węższym od rzazu ==');
{
  await seed(proj([{ cab: cab({ W: 300, H: 400, D: 300, plinth: { on: false }, back: 'none' }) }]));
  const przed = await page.evaluate(() => (document.querySelector('#rozkroj') || {}).innerText || '');
  void przed;
  const cuts = await page.evaluate(() => { const r = [...document.querySelectorAll('#rozkroj .font-mono.text-sm')].map((e) => e.textContent); return r; });
  ok('rozkrój pokazuje liczbę cięć', cuts.some((t) => /cięć \d+/.test(t)), cuts.join(' | '));
}

console.log('\n== N60: materiał półek w 3D szafki ==');
{
  await seed(proj([{ cab: cab({ H: 1000, realColors: true, shelfSameAsBoard: false, plinth: { on: false },
    levels: [{ h: 450, cols: [{ kind: 'doors', doors: 1, w: null, shelfTargets: [null, null] }] }, { h: null, cols: [{ kind: 'doors', doors: 1, w: null, shelfTargets: [null, null] }] }] }),
    mat: { board: { color: '#ff0000' }, shelf: { color: '#00ff00', thickness: 18, name: 'Płyta' } } }]));
  const s = (await bryly()).filter((x) => x.d[0] === 18 && x.d[1] === 560 && x.d[2] === 564).map((x) => x.color);
  ok('zwykłe półki z płyty półek (2 zielone), przelotowa z korpusu', s.filter((c) => c === '#00ff00').length === 2 && s.filter((c) => c === '#ff0000').length === 3, s.join(', '));
}

console.log('\n== N62/N63: szafka wysunięta z lica ==');
{
  const p2 = [];
  for (const off of [0, 100]) {
    await seed(proj([{ cab: cab({ name: 'A', realColors: true }), runId: 'c1' }, { cab: cab({ name: 'B', realColors: true }), runId: 'c1', offset: off }], [RUN('c1', { worktop: false })]));
    const boki = (await bryly('Ciąg')).filter((x) => x.d[0] === 18 && x.d[1] === 560 && x.d[2] === 720);
    p2.push(boki.map((x) => Math.round(Math.min(...x.v.map((q) => q.z)))));
  }
  ok('N62: wysunięta szafka w 3D o 100 mm dalej od ściany', p2[0].length === 4 && new Set(p2[1]).size === 2 && Math.abs(Math.min(...p2[1]) - Math.min(...p2[0])) === 100, JSON.stringify(p2));
  await seed(proj([{ cab: cab({ name: 'A' }), runId: 'c1' }, { cab: cab({ name: 'B' }), runId: 'c1', offset: 100 }], [RUN('c1')]));
  const r = (await rows(/^Formatki całego projektu/)).find((x) => /Blat ciągu/.test(x)) || '';
  ok('N63: blat sięga przed front szafki wysuniętej (693 z arkusza 1200)', /\| 1200 \| 693 \|/.test(r), r);
}

console.log('\n== N64: ciągi wyrównane do prawej krawędzi ściany ==');
{
  const runs = [RUN('c1', { wallW: 2400, offsetFrom: 'right', offset: 100, worktop: false }), RUN('c2', { tier: 'gorny', wall: 'c1', offsetFrom: 'right', offset: 100, worktop: false, plinth: null })];
  await seed(proj([{ cab: cab({ name: 'D1', realColors: true }), runId: 'c1' }, { cab: cab({ name: 'D2', realColors: true }), runId: 'c1' },
    { cab: cab({ name: 'G', D: 300, plinth: { on: false }, realColors: true }), runId: 'c2' }], runs));
  await pick('Całość');
  const s = (await bryly('Ciąg')).filter((x) => x.d[0] === 18 && x.d[2] === 720);
  const xs = (q) => [Math.round(Math.min(...q.v.map((p) => p.x))), Math.round(Math.max(...q.v.map((p) => p.x)))];
  const dol = s.filter((x) => x.d[1] === 560).map(xs).flat(), gor = s.filter((x) => x.d[1] === 300).map(xs).flat();
  ok('dolny i górny kończą się w tym samym miejscu (100 przed prawą krawędzią)', dol.length && gor.length && Math.max(...dol) === Math.max(...gor)
    && Math.max(...dol) - Math.min(...dol) === 1200 && Math.max(...gor) - Math.min(...gor) === 600, JSON.stringify({ dol: [Math.min(...dol), Math.max(...dol)], gor: [Math.min(...gor), Math.max(...gor)] }));
}

console.log('\n== N65: blaty na łyżwę w 3D ==');
{
  const runs = [RUN('c1'), RUN('c2', { corner: { of: 'c1', at: 'end', owner: 'of', clear: 0, cut: 'skos' } })];
  await seed(proj([{ cab: cab({ name: 'A' }), runId: 'c1' }, { cab: cab({ name: 'B' }), runId: 'c2' }], runs));
  await pick('Całość');
  const bl = (await bryly('Ciąg')).filter((x) => x.tag === 'blat');
  // sciety koniec: wierzcholki przy licu i przy scianie maja rozne x (albo z) — nie prostopadloscian
  // sciety: w rzucie brakuje ktoregos naroznika prostokata obrysu
  const skos = bl.filter((x) => { const [x0, , z0, x1, , z1] = x.p;
    return [[x0, z0], [x0, z1], [x1, z0], [x1, z1]].some(([a, c]) => !x.v.some((q) => Math.abs(q.x - a) <= 1 && Math.abs(q.z - c) <= 1)); });
  ok('oba blaty z jednym końcem ściętym na 45°', bl.length === 2 && skos.length === 2, `blatów ${bl.length}, ściętych ${skos.length}`);
}

console.log('\n== N66: złącza blatów tylko przy wspólnej wysokości ==');
for (const [H2, zl] of [[720, true], [1000, false]]) {
  const runs = [RUN('c1'), RUN('c2', { corner: { of: 'c1', at: 'end', owner: 'of', clear: 0 } })];
  await seed(proj([{ cab: cab({ name: 'A', W: 1200, levels: [{ h: null, cols: [{ kind: 'doors', doors: 1, w: null, fix: { side: 'right', w: 611, mode: 'overlay', support: false }, hinge: 'left' }] }] }), runId: 'c1' },
    { cab: cab({ name: 'B', H: H2 }), runId: 'c2' }], runs));
  const z = (await wszystkieProdukty()).some((r) => /Złącze do blatów/.test(r));
  const u = await uwagi();
  ok(`H ${H2}: ${zl ? 'złącza w rogu' : 'bez złączy, ostrzeżenie o różnicy 280 mm'}`, z === zl && /różnica 280 mm/.test(u) === !zl, linie(u, /różnica/));
}

console.log('\n== N67: za duży luz między szufladami ==');
{
  await seed(proj([{ cab: cab({ plinth: { on: false }, levels: [{ h: null, cols: [{ kind: 'drawers', drawers: [{ h: null }, { h: null }], w: null, gapBetween: 100 }] }] }) }]));
  ok('100 mm — błąd z przyciskiem', /luz między szufladami 100 mm — o 95 mm za dużo/.test(await uwagi()) && (await page.getByRole('button', { name: 'Zmniejsz luz do 2 mm' }).count()) === 1);
}

console.log('\n== N68: brak miejsca na prowadnicę ==');
{
  await seed(proj([{ cab: cab({ plinth: { on: false }, levels: [{ h: null, cols: [{ kind: 'drawers', drawers: [{ h: null }, { h: null }], w: null, rails: [{ orient: 'front', pos: 'bottom', h: 100, fromBack: true, atDepth: 350 }] }] }] }) }]));
  ok('błąd „nie mieści się żadna prowadnica”', /szuflada 1: nie mieści się żadna prowadnica/.test(await uwagi()));
  ok('oba fronty zostają w formatkach', /Front szuflady \| [^|]+ \| 356 \| 596 \| 2/.test((await rows(/^Formatki do zamówienia/)).join(' / ')));
}

console.log('\nBLEDY STRONY:', errors.join(' | ') || '(brak)');
await b.close();
