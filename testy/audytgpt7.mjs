/* Audyt GPT 2026-10-26/27, ustalenia N82–N85 (`AUDYT_GPT.md` na galezi gpt/audyt-2026-10-16):
   - N82 front wpuszczany „dluzszy od dolu” wchodzi w plyte pod nim (dno, polka
     przelotowa, polka graniczna poziomu kolumny) — blad z przyciskami zamiast wydluzenia;
     przy wpuszczanym opcji „dluzszy od dolu” nie ma na liscie (uzytkownik 2026-10-27);
   - N83 szafka w stojacym ciagu bez nozek i cokolu stoi na podlodze — wydluzony front
     nie moze zejsc pod podloge (wiszacy ciag bez bledu);
   - N84 plan wiercen: kazda klapa poziomu kolumny osobno (wysokosci od wlasnego frontu);
   - N85 kreator klap przy kilku kolumnach mowi o tej kolumnie, nie o calej szafce. */
import pw from './pw.mjs';
const URL = process.env.STD ? 'http://127.0.0.1:5199/standalone-local.html'
  : 'http://127.0.0.1:5205/mebloprojekt-app.html';
const ok = (l, c, e = '') => console.log((c ? '  OK   ' : '  BLAD ') + l + (e ? ' — ' + e : ''));
const b = await pw.chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const page = await (await b.newContext({ viewport: { width: 1500, height: 1300 } })).newPage();
const errors = []; page.on('pageerror', (e) => errors.push(e.message));
await page.goto(URL, { waitUntil: 'networkidle' });

const BEZ = { plinth: { on: false }, legs: { on: false } };
const NOZKI = { plinth: { on: false }, legs: { on: true, height: 100 } };
const cab = (o = {}, cols = null) => ({ name: 'S', W: 600, H: 600, D: 560, ...BEZ, ...o,
  levels: o.levels || [{ h: null, cols: cols || [{ kind: 'doors', doors: 1, w: null }] }] });
// drzwi bez uchwytu, dluzsze od dolu
const DOL = (mm = 20, o = {}) => ({ kind: 'doors', doors: 1, w: null, shelfTargets: [null], handles: [false], otwieranie: ['dol'], otwieranieMm: [mm], ...o });
const proj = (items, runs = []) => ({ name: 'A', active: 0, prices: {}, runs, items: items.map((it) => ({ offset: 0, runId: null, ...it })) });
const seed = async (p) => {
  await page.evaluate((q) => { localStorage.clear(); localStorage.setItem('szafki:projekt', JSON.stringify(q)); }, p);
  await page.reload({ waitUntil: 'networkidle' }); await page.waitForTimeout(1200);
};
const notes = () => page.evaluate(() => {
  const sec = [...document.querySelectorAll('section')].find((s) => /^Uwagi$/.test((s.querySelector('h2') || {}).textContent || ''));
  return sec ? [...sec.querySelectorAll('li')].map((li) => ({
    txt: li.textContent.trim(), btns: [...li.querySelectorAll('button')].map((x) => x.textContent.trim()),
  })) : [];
});
const uwagi = async () => (await page.evaluate(() => [...document.querySelectorAll('section')].find((s) => /^Uwagi/.test(s.querySelector('h2')?.textContent || ''))?.innerText || ''));
const bledy = async () => (await uwagi()).split('\n').filter((l) => /^×/.test(l));
const zap = async () => { await page.waitForTimeout(800); return page.evaluate(() => JSON.parse(localStorage.getItem('szafki:projekt')).items[0].cab); };
const RUN = (o = {}) => ({ id: 'c1', name: 'Ściana', roomId: null, wallW: null, gap: 0, H: null, D: null, plinth: null, plinthCuts: null, topCuts: null,
  worktop: false, hangerMode: 'listwa', mountY: 0, corner: null, tier: 'dolny', wall: null, clearance: 500, ceiling: null,
  offset: 0, offsetFrom: 'left', wallGap: { bottom: 0, top: null }, topCut: null, ...o });
const PODFREZ = 'Podfrez od góry zamiast wydłużenia', TIPON = 'Tip-on zamiast wydłużenia';
// opcje listy „otwieranie” pierwszych drzwi: [tekst, wylaczona]
const opcje = () => page.locator('[data-el="drzwi-otwieranie"] select').first().evaluate((sel) => ({
  v: sel.value, o: [...sel.options].map((x) => (x.disabled ? '-' : '') + x.textContent.trim()) }));

console.log('== N82: front wpuszczany dłuższy od dołu wchodzi w płytę pod nim ==');
{
  const W = { frontMode: 'inset' };
  await seed(proj([{ cab: cab({ ...W, ...NOZKI }, [DOL()]) }]));
  let n = (await notes()).find((x) => /front wpuszczany dłuższy od dołu o 20 mm/.test(x.txt));
  ok('nóżki 100, drzwi 20 mm: błąd „wchodzi 18 mm w dno” z podfrezem i tip-on', !!n && /wchodzi 18 mm w dno pod nim/.test(n.txt)
    && n.btns.includes(PODFREZ) && n.btns.includes(TIPON), JSON.stringify(n || (await notes()).map((x) => x.txt.slice(0, 90))));
  let o = await opcje();
  ok('wpis sprzed zmiany frontu: „dłuższy od dołu” widoczny, ale wyszarzony', o.v === 'dol' && o.o.includes('-front dłuższy od dołu (nie przy wpuszczanym)'), JSON.stringify(o));
  await page.getByRole('button', { name: TIPON, exact: true }).click(); await page.waitForTimeout(800);
  o = await opcje();
  ok('wpuszczany: na liście bez „front dłuższy od dołu” (użytkownik 2026-10-27)', o.v === 'tipon' && !o.o.some((x) => /dłuższy/.test(x)) && o.o.includes('podfrez od góry'), JSON.stringify(o));
  const c = await zap();
  ok('„Tip-on zamiast wydłużenia” — otwieranie tip-on, błąd znika', JSON.stringify(c.levels[0].cols[0].otwieranie) === '["tipon"]'
    && !(await notes()).some((x) => /front wpuszczany dłuższy/.test(x.txt)), JSON.stringify(c.levels[0].cols[0].otwieranie));

  await seed(proj([{ cab: cab({ ...NOZKI }, [DOL()]) }]));
  ok('nakładany na nóżkach, 20 mm: bez błędu (leży przed korpusem)', !(await bledy()).length, (await bledy()).join(' / '));
  o = await opcje();
  ok('nakładany: „front dłuższy od dołu” do wyboru', o.o.includes('front dłuższy od dołu'), JSON.stringify(o));

  await seed(proj([{ cab: cab({ ...W, hangers: 'always' }, [DOL(20, { klapa: 'gora' })]) }]));
  n = (await notes()).find((x) => /klapa: front wpuszczany dłuższy od dołu/.test(x.txt));
  ok('wisząca, klapa do góry: błąd „w dno”, tylko tip-on (bez podfrezu — u góry zawiasy)', !!n && /w dno pod nim/.test(n.txt)
    && n.btns.includes(TIPON) && !n.btns.includes(PODFREZ), JSON.stringify(n || (await notes()).map((x) => x.txt.slice(0, 90))));

  await seed(proj([{ cab: cab({ ...W, W: 1200, hangers: 'always' }, [DOL(20, { otwieranie: [] }), DOL(), DOL(20, { otwieranie: [] })]) }]));
  n = (await notes()).filter((x) => /front wpuszczany dłuższy/.test(x.txt));
  ok('trzy kolumny, wydłużona tylko środkowa: jeden błąd „kolumna 2”', n.length === 1 && /kolumna 2, drzwi 1/.test(n[0].txt), JSON.stringify(n.map((x) => x.txt.slice(0, 90))));

  await seed(proj([{ cab: cab({ ...W, H: 1200, hangers: 'always', levels: [{ h: null, cols: [DOL(20, { otwieranie: [] })] }, { h: null, cols: [DOL()] }] }) }]));
  n = (await notes()).find((x) => /front wpuszczany dłuższy/.test(x.txt));
  ok('dwa poziomy główne, górny wydłużony: „w półkę przelotową”', !!n && /^.?Poziom 2, kolumna 1/.test(n.txt) && /w półkę przelotową pod nim/.test(n.txt), JSON.stringify(n && n.txt));

  await seed(proj([{ cab: cab({ ...W, H: 900, hangers: 'always' }, [DOL(20, { shelfTargets: [300, null], podzial: [0], otwieranie: [],
    segmenty: [{}, { doors: 1, handles: [false], otwieranie: ['dol'], otwieranieMm: [20] }] })]) }]));
  n = (await notes()).find((x) => /front wpuszczany dłuższy/.test(x.txt));
  ok('poziomy kolumny, górny wydłużony: „poziom 2 kolumny 1 … w półkę graniczną”', !!n && /poziom 2 kolumny 1, drzwi 1/.test(n.txt) && /w półkę graniczną poziomu kolumny/.test(n.txt), JSON.stringify(n && n.txt));

  await seed(proj([{ cab: cab({ ...W, hangers: 'always' }, [DOL(2)]) }]));
  ok('wpuszczany wydłużony o 2 mm (w luzie od dna): bez błędu', !(await bledy()).length, (await bledy()).join(' / '));
}

console.log('\n== N83: szafka w stojącym ciągu bez nóżek — front nie schodzi pod podłogę ==');
{
  await seed(proj([{ cab: cab({}, [DOL()]), runId: 'c1' }], [RUN()]));
  let n = (await notes()).find((x) => /front dłuższy od dołu o 20 mm/.test(x.txt));
  ok('dolny ciąg na 0, bez nóżek, 20 mm: błąd „schodzi 17 mm pod podłogę” z przyciskami', !!n && /schodzi 17 mm pod podłogę/.test(n.txt)
    && n.btns.includes(PODFREZ) && n.btns.includes(TIPON), JSON.stringify(n || (await notes()).map((x) => x.txt.slice(0, 90))));
  await seed(proj([{ cab: cab({}, [DOL(100)]), runId: 'c1' }], [RUN()]));
  n = (await notes()).find((x) => /front dłuższy od dołu o 100 mm/.test(x.txt));
  ok('to samo przy 100 mm: „schodzi 97 mm pod podłogę”', !!n && /schodzi 97 mm pod podłogę/.test(n.txt), JSON.stringify(n && n.txt));
  await seed(proj([{ cab: cab({ D: 300 }, [DOL()]), runId: 'c1' }], [RUN({ mountY: 1400, D: 300 })]));
  ok('ciąg wiszący (montaż 1400): bez błędu podłogi', !(await notes()).some((x) => /podłog/.test(x.txt) && /front dłuższy/.test(x.txt)),
    (await notes()).map((x) => x.txt.slice(0, 90)).join(' / '));
  await seed(proj([{ cab: cab({ ...NOZKI }, [DOL(100)]) }]));
  n = (await notes()).find((x) => /front dłuższy od dołu o 100 mm/.test(x.txt));
  ok('nóżki 100, 100 mm: „kończy się 3 mm nad podłogą”', !!n && /kończy się 3 mm nad podłogą — potrzeba min. 10 mm/.test(n.txt), JSON.stringify(n && n.txt));
}

console.log('\n== N84: plan wierceń — każda klapa poziomu kolumny osobno ==');
{
  const num = (s) => Number(String(s).replace(/\s/g, '').replace(',', '.').replace(/[^\d.\-]/g, '')) || 0;
  const wiercenia = async () => {
    await page.evaluate(() => { window.__rep = null; window.print = () => {
      const t = [...document.querySelectorAll('.print-only .rp-page table')].find((x) => /Otwory pod/.test(x.querySelector('thead')?.textContent || ''));
      window.__rep = t ? [...t.querySelectorAll('tbody tr')].map((tr) => [...tr.children].map((x) => x.textContent.trim())) : [];
    }; });
    await page.getByRole('button', { name: 'Zestawienie PDF', exact: true }).first().click();
    await page.waitForTimeout(1000);
    let panel = '';
    return ((await page.evaluate(() => window.__rep)) || []).map((r) => { if (r[0]) panel = r[0]; return { panel, kind: r[1], ys: r[2].split(',').map(num), note: r[3] }; });
  };
  const klapy = async () => (await wiercenia()).filter((r) => /^Klapa/.test(r.panel));
  const K = (o) => ({ kind: 'doors', doors: 1, w: null, shelfTargets: [300, null], podzial: [0], ...o });
  // szafka 600 × 900, polka 300 mm od dolu — granica dwoch klap do gory z dwoma podnosnikami (wysokosci 322 i 568)
  await seed(proj([{ cab: cab({ H: 900, hangers: 'always' }, [K({ klapa: 'gora', silowniki: 2, segmenty: [{}, { klapa: 'gora', silowniki: 2 }] })]) }]));
  let r = await klapy();
  const p1 = r.filter((x) => x.panel === 'Klapa — poziom 1 kolumny 1'), p2 = r.filter((x) => x.panel === 'Klapa — poziom 2 kolumny 1');
  ok('dwie płyty: „Klapa — poziom 1 kolumny 1” i „… poziom 2 …”, bez wspólnej „Klapa”', p1.length === 2 && p2.length === 2 && !r.some((x) => x.panel === 'Klapa'),
    JSON.stringify(r.map((x) => [x.panel, x.ys])));
  ok('niższa klapa (322): 229, 253 po obu stronach', p1.every((x) => JSON.stringify(x.ys) === '[229,253]'), JSON.stringify(p1.map((x) => x.ys)));
  ok('wyższa klapa (568): 467, 491 po obu stronach', p2.every((x) => JSON.stringify(x.ys) === '[467,491]'), JSON.stringify(p2.map((x) => x.ys)));
  ok('żaden otwór niższej klapy poza jej wysokością', p1.every((x) => x.ys.every((y) => y < 322)), JSON.stringify(p1.map((x) => x.ys)));

  // mieszane: dolna w dol z amortyzatorem z prawej, gorna do gory z podnosnikiem z lewej
  await seed(proj([{ cab: cab({ H: 900, hangers: 'always' }, [K({ klapa: 'dol', silowniki: 1, podnosnikStrona: 'right',
    segmenty: [{}, { klapa: 'gora', silowniki: 1, podnosnikStrona: 'left' }] })]) }]));
  r = await klapy();
  const d1 = r.filter((x) => x.panel === 'Klapa — poziom 1 kolumny 1'), d2 = r.filter((x) => x.panel === 'Klapa — poziom 2 kolumny 1');
  ok('w dół (prawy) i do góry (lewy): każda płyta ze swoim mocowaniem i stroną',
    d1.length === 1 && /amortyzator/.test(d1[0].kind) && /od prawej krawędzi/.test(d1[0].note) && JSON.stringify(d1[0].ys) === '[77,101]'
    && d2.length === 1 && /podnośnik/.test(d2[0].kind) && /od lewej krawędzi/.test(d2[0].note) && JSON.stringify(d2[0].ys) === '[467,491]',
    JSON.stringify(r.map((x) => [x.panel, x.kind, x.ys, x.note.slice(-25)])));

  // trzy kolumny: klapy w poziomach srodkowej i jedna klapa w trzeciej
  await seed(proj([{ cab: cab({ W: 1500, H: 900, hangers: 'always' }, [{ kind: 'doors', doors: 1, w: null }, K({ klapa: 'gora', segmenty: [{}, { klapa: 'gora' }] }),
    { kind: 'doors', doors: 1, w: null, klapa: 'gora' }]) }]));
  r = await klapy();
  ok('trzy kolumny: „poziom 1 / 2 kolumny 2” i „Klapa — kolumna 3”', ['Klapa — poziom 1 kolumny 2', 'Klapa — poziom 2 kolumny 2', 'Klapa — kolumna 3']
    .every((p) => r.filter((x) => x.panel === p).length === 1) && new Set(r.map((x) => x.panel)).size === 3, JSON.stringify(r.map((x) => [x.panel, x.ys])));
}

console.log('\n== N85: kreator klap — opis zakresu ==');
{
  const kol = (o = {}) => ({ kind: 'doors', doors: 1, w: null, shelfTargets: [null, null, null, null], ...o });
  const kolumna = (n) => page.locator('div.rounded.bg-stone-50').filter({ has: page.getByText(`Kolumna ${n}`, { exact: true }) }).first();
  const opis = () => page.locator('[data-el="kreator-klap"] p').first().innerText();
  await seed(proj([{ cab: { name: 'Szafa', W: 1800, H: 1600, D: 560, levels: [{ h: null, cols: [kol(), kol(), kol()] }] } }]));
  await kolumna(2).getByRole('button', { name: 'klapy zamiast drzwi…', exact: true }).click(); await page.waitForTimeout(400);
  let t = await opis();
  ok('trzy kolumny: granice w tej kolumnie, inne kolumny bez zmian — nie „przez całą szafkę”', /tej kolumny/.test(t) && /Inne kolumny zostają bez zmian/.test(t) && !/przez całą szafkę/.test(t), t);
  await seed(proj([{ cab: { name: 'Szafa', W: 600, H: 1600, D: 560, levels: [{ h: null, cols: [kol()] }] } }]));
  await page.getByRole('button', { name: 'klapy zamiast drzwi…', exact: true }).first().click(); await page.waitForTimeout(400);
  t = await opis();
  ok('jedna kolumna: „poziomami (płyta przez całą szafkę)”', /płyta przez całą szafkę/.test(t), t);
}

ok('bez błędów strony', errors.length === 0, errors.join(' | '));
await b.close();
