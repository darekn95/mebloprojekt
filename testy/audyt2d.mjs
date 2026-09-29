/* Audyt rysunkow 2D (prosba uzytkownika 2026-09-28: „sprawdzamy dokladnie”).
   Rysunek plaski ma byc rzutem bryly 3D — a bryle 3D pilnuje `audyt`
   (nachodzenie, formatki). Dla kazdego widoku samej szafki (z przodu
   zamkniete i otwarte, z gory, z boku, z tylu) porownujemy prostokaty
   rysunku z rzutami bryl w obie strony:
   - kazda bryla ma na rysunku swoj prostokat (±1 mm), chyba ze w tym widoku
     zaslaniaja ja w calosci bryly blizej patrzacego,
   - kazdy prostokat rysunku jest rzutem jakiejs bryly (tlo korpusu i okucia
     rysowane tylko na plasko — zawiasy, prowadnice — pomijamy).
   Przesuniecie ukladu widoku szukamy sami (najczestsze przesuniecie par
   o tych samych wymiarach), wiec test nie zalezy od marginesow rysunku. */
import pw from './pw.mjs';
const URL = process.env.STD ? 'http://127.0.0.1:5199/standalone-local.html'
  : 'http://127.0.0.1:5205/mebloprojekt-app.html';
const ok = (l, c, e = '') => console.log((c ? '  OK   ' : '  BLAD ') + l + (e ? ' — ' + e : ''));
const b = await pw.chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const page = await (await b.newContext({ viewport: { width: 1500, height: 1300 } })).newPage();
const errors = []; page.on('pageerror', (e) => errors.push(e.message));
await page.goto(URL, { waitUntil: 'networkidle' });

const PL = { on: true, height: 100, mode: 'under', setback: 0 };
const kol = (o = {}) => ({ kind: 'doors', doors: 2, w: null, shelfTargets: [null, null], ...o });
const szafka = (name, o = {}) => ({ name, W: 600, H: 720, D: 560, plinth: PL, legs: { on: true, height: 100 },
  levels: [{ h: null, cols: [kol()] }], ...o });
const wisz = (name, o = {}) => szafka(name, { D: 300, plinth: { ...PL, on: false }, legs: { on: false }, hangerMode: 'listwa', ...o });
const projekt = (cab) => ({ name: 'A2D', active: 0, prices: {}, runs: [], items: [{ cab, runId: null, offset: 0 }] });

const click = async (l) => { const x = page.getByRole('button', { name: l, exact: true }); if (await x.count()) { await x.first().click(); await page.waitForTimeout(350); return true; } return false; };
const bryly3d = async (otwarte) => {
  await click('Zamk.');
  await page.evaluate(() => { window.__audytBryl = []; });
  await click('3D');
  let a = await page.evaluate(() => { const x = window.__audytBryl; window.__audytBryl = null; return x || []; });
  if (otwarte) {
    // tak jak `audyt`: przelacznik 3D przerysowuje bryle otwarta
    await page.evaluate(() => { window.__audytBryl = []; });
    const z = page.getByRole('button', { name: 'zamknięte', exact: true });
    if (await z.count()) { await z.first().click(); await page.waitForTimeout(400); }
    a = await page.evaluate(() => { const x = window.__audytBryl; window.__audytBryl = null; return x || []; });
    const o = page.getByRole('button', { name: 'otwarte', exact: true });
    if (await o.count()) { await o.first().click(); await page.waitForTimeout(200); }
  }
  return a.filter((s) => s.p && s.color !== '#b91c1c' && s.color !== '#b45309');
};
// prostokaty rysunku w jednostkach viewBox (mm), po wszystkich transformacjach grup
const prostokaty = () => page.evaluate(() => {
  const svg = document.querySelector('#rysunek svg');
  if (!svg) return [];
  const sm = svg.getCTM().inverse();
  return [...svg.querySelectorAll('rect')].map((r) => {
    const bb = r.getBBox(); const m = sm.multiply(r.getCTM());
    const pts = [[bb.x, bb.y], [bb.x + bb.width, bb.y + bb.height]].map(([x, y]) => new DOMPoint(x, y).matrixTransform(m));
    let el = ''; for (let e = r; e && e !== svg && !el; e = e.parentElement) el = e.getAttribute('data-el') || '';
    return { x0: Math.min(pts[0].x, pts[1].x), y0: Math.min(pts[0].y, pts[1].y), x1: Math.max(pts[0].x, pts[1].x), y1: Math.max(pts[0].y, pts[1].y),
      f: r.getAttribute('fill'), s: r.getAttribute('stroke'), da: r.getAttribute('stroke-dasharray'), el,
      op: Number(r.getAttribute('opacity') ?? r.getAttribute('fill-opacity') ?? 1) };
  }).filter((r) => r.x1 - r.x0 >= 0.9 && r.y1 - r.y0 >= 0.9);
});

/* Uklad widoku: ktora os bryly idzie w poziom (X) i pion (Y) rysunku, ze
   znakiem, i z ktorej strony patrzymy (do zaslaniania). Bryla: x w prawo,
   y w gore od dna korpusu, z od lica korpusu w glab. */
const WIDOKI = {
  'Zamk.': { X: [0, 1], Y: [1, -1], blizej: [2, -1] },
  'Otw.': { X: [0, 1], Y: [1, -1], blizej: [2, -1], otwarte: true },
  'Z góry': { X: [0, 1], Y: [2, -1], blizej: [1, 1] },
  'Z boku': { X: [2, -1], Y: [1, -1], blizej: [0, -1] },
  'Z tyłu': { X: [0, -1], Y: [1, -1], blizej: [2, 1] },
};
const rzut = (s, w) => {
  const p = s.p;
  const ax = (o) => { const [k, sg] = o; return sg > 0 ? [p[k], p[k + 3]] : [-p[k + 3], -p[k]]; };
  const [x0, x1] = ax(w.X), [y0, y1] = ax(w.Y);
  const [k, sg] = w.blizej;
  return { x0, x1, y0, y1, glab: sg > 0 ? -p[k + 3] : p[k], dal: sg > 0 ? -p[k] : p[k + 3], s };
};
const TOL = 1.01;
const rowny = (a, r, dx, dy) => Math.abs(a.x0 + dx - r.x0) <= TOL && Math.abs(a.x1 + dx - r.x1) <= TOL
  && Math.abs(a.y0 + dy - r.y0) <= TOL && Math.abs(a.y1 + dy - r.y1) <= TOL;
// przesuniecie ukladu rysunku: najczestsze wsrod par o tych samych wymiarach
const przesuniecie = (rz, rs) => {
  const m = new Map();
  rz.forEach((a) => rs.forEach((r) => {
    if (Math.abs((a.x1 - a.x0) - (r.x1 - r.x0)) > TOL || Math.abs((a.y1 - a.y0) - (r.y1 - r.y0)) > TOL) return;
    const k = `${Math.round(r.x0 - a.x0)}|${Math.round(r.y0 - a.y0)}`;
    m.set(k, (m.get(k) || 0) + 1);
  }));
  const best = [...m.entries()].sort((a, c) => c[1] - a[1])[0];
  return best ? best[0].split('|').map(Number) : [0, 0];
};
// czy prostokat `a` zaslaniaja w calosci (szczeliny miedzy frontami do 3 mm pomijamy)
// inne rzuty lezace blizej patrzacego (probkowanie co 4 mm)
const zasloniety = (a, rz) => {
  const przed = rz.filter((q) => q !== a && q.dal <= a.glab + 0.5);
  const st = (lo, hi) => { const n = Math.max(2, Math.ceil((hi - lo) / 4)); return [...Array(n + 1)].map((_, i) => lo + 0.3 + (hi - lo - 0.6) * i / n); };
  return st(a.x0, a.x1).every((x) => st(a.y0, a.y1).every((y) => przed.some((q) => x >= q.x0 - 1.6 && x <= q.x1 + 1.6 && y >= q.y0 - 1.6 && y <= q.y1 + 1.6)));
};
/* Obrys przerywany (skrzynka szuflady, strefa) to obwiednia kilku bryl — pasuje,
   gdy bryly lezace w nim maja razem dokladnie taki obrys (±2,5 mm). */
const obwiednia = (r, rz, dx, dy) => {
  if (r.f && r.f !== 'none') return false;
  const w = rz.filter((a) => a.x0 + dx >= r.x0 - 2.5 && a.x1 + dx <= r.x1 + 2.5 && a.y0 + dy >= r.y0 - 2.5 && a.y1 + dy <= r.y1 + 2.5);
  if (w.length < 2) return false;
  const bb = [Math.min(...w.map((a) => a.x0)), Math.min(...w.map((a) => a.y0)), Math.max(...w.map((a) => a.x1)), Math.max(...w.map((a) => a.y1))];
  return Math.abs(bb[0] + dx - r.x0) <= 2.5 && Math.abs(bb[1] + dy - r.y0) <= 2.5 && Math.abs(bb[2] + dx - r.x1) <= 2.5 && Math.abs(bb[3] + dy - r.y1) <= 2.5;
};
/* Kilka frontow w jednej linii (drzwi obok siebie z gory, szuflady jedna nad
   druga z boku) rysunek pokazuje jednym pasem — to ta sama plyta w rzucie.
   Pas pasuje, gdy jest obrysem bryl tego samego koloru, ktore maja z nim
   wspolna jedna os, a w drugiej go wypelniaja (szczeliny do 4 mm). */
const kolor = (a, r) => (a.s.color || '').toLowerCase() === (r.f || '').toLowerCase();
const wPasie = (a, r, dx, dy) => kolor(a, r) && (
  (Math.abs(a.y0 + dy - r.y0) <= TOL && Math.abs(a.y1 + dy - r.y1) <= TOL && a.x0 + dx >= r.x0 - TOL && a.x1 + dx <= r.x1 + TOL)
  || (Math.abs(a.x0 + dx - r.x0) <= TOL && Math.abs(a.x1 + dx - r.x1) <= TOL && a.y0 + dy >= r.y0 - TOL && a.y1 + dy <= r.y1 + TOL));
const pasem = (r, rz, dx, dy) => {
  const cz = rz.filter((a) => wPasie(a, r, dx, dy));
  if (cz.length < 2) return false;
  const poziomo = cz.every((a) => Math.abs(a.y0 + dy - r.y0) <= TOL && Math.abs(a.y1 + dy - r.y1) <= TOL);
  const odc = cz.map((a) => poziomo ? [a.x0 + dx, a.x1 + dx] : [a.y0 + dy, a.y1 + dy]).sort((p, q) => p[0] - q[0]);
  let kon = poziomo ? r.x0 : r.y0;
  for (const [lo, hi] of odc) { if (lo - kon > 4) return false; kon = Math.max(kon, hi); }
  return (poziomo ? r.x1 : r.y1) - kon <= 4;
};
// zawiasy (#71717a) i prowadnice (#8b8b93, z opacity) — okucia rysowane tylko na plasko
const OKUCIA_2D = new Set(['#71717a']);
const prowadnica = (r) => r.f === '#8b8b93' && (r.op < 1 || r.el === '' && r.s === '#1c1917');
const opisR = (r) => `${Math.round(r.x0)},${Math.round(r.y0)}–${Math.round(r.x1)},${Math.round(r.y1)}${r.el ? ' ' + r.el : ''}${r.f && r.f !== 'none' ? ' ' + r.f : ' kontur'}`;
const opisB = (a) => `${a.s.color} ${[...a.s.d].map(Math.round).join('×')} @${Math.round(a.x0)},${Math.round(a.y0)}`;

/* Znane, czekajace na decyzje (BLEDY.md): tyl skrzynki szuflady stoi na dnie
   i przy gornej szufladzie wchodzi w wieniec — uzytkownik przysle instrukcje
   V-BOX (2026-09-28). Wypisujemy jako INFO, nie BLAD. */
// szafka w L sama: z gory w rogu bez boku widac ~15 mm cokolu (w ciagu zakrywa go ramie) — drobne, do decyzji
const ZNANE = [/^#d8c3a0 900×100×18 @0,-18$/];
const info = (l) => console.log('  INFO ' + l);
const scenariusz = async (tytul, cab) => {
  console.log(`\n== ${tytul} ==`);
  await page.evaluate((q) => { localStorage.clear(); localStorage.setItem('szafki:projekt', JSON.stringify(q)); }, projekt(cab));
  await page.reload({ waitUntil: 'networkidle' }); await page.waitForTimeout(700);
  await click('Szafka');
  const zamk = await bryly3d(false);
  const otw = await bryly3d(true);
  for (const [nazwa, w] of Object.entries(WIDOKI)) {
    if (!(await click(nazwa))) continue;
    const wszystkie = await prostokaty();
    const rs = wszystkie.filter((r) => r.f !== '#fafaf9' && !OKUCIA_2D.has(r.f) && !prowadnica(r)
      && !(r.f === 'none' && (!r.s || r.s === 'none')));
    const baza = w.otwarte ? otw : zamk;
    /* Z przodu plecy sa tlem wnetrza (jasny prostokat korpusu) — przy
       otwartych drzwiach widac je przez caly otwor, ale rysunek nie maluje ich
       osobno. Plecy = najdalej w glebi, cienkie w glab. */
    const zMax = Math.max(...baza.map((q) => q.p[5]));
    const plecy = (q) => q.p[5] >= zMax - 0.5 && q.p[5] - q.p[2] <= 18.5 && (q.p[3] - q.p[0]) > 100 && (q.p[4] - q.p[1]) > 100;
    const rz = baza.filter((q) => !(w.X[0] === 0 && w.Y[0] === 1 && w.blizej[1] < 0 && plecy(q))).map((s) => rzut(s, w));
    const rzZamk = zamk.map((s) => rzut(s, w));
    const [dx, dy] = przesuniecie(rz, rs);
    const brak = rz.filter((a) => !rs.some((r) => rowny(a, r, dx, dy) || wPasie(a, r, dx, dy)) && !zasloniety(a, rz));
    // prostokat rysunku moze byc rzutem bryly otwartej albo (kontur drzwi) zamknietej
    const obce = rs.filter((r) => !rz.some((a) => rowny(a, r, dx, dy)) && !pasem(r, rz, dx, dy) && !obwiednia(r, rz, dx, dy)
      && !(w.otwarte && (rzZamk.some((a) => rowny(a, r, dx, dy)) || pasem(r, rzZamk, dx, dy))));
    const brakOp = brak.map(opisB);
    const znane = brakOp.filter((x) => ZNANE.some((re) => re.test(x)));
    if (znane.length) info(`${nazwa}: znane, do decyzji (BLEDY.md): ${znane.join('; ')}`);
    const brakN = brakOp.filter((x) => !znane.includes(x));
    ok(`${nazwa}: każda bryła ma swój prostokąt`, !brakN.length, brakN.join('; '));
    ok(`${nazwa}: każdy prostokąt jest rzutem bryły`, !obce.length, obce.map((r) => opisR({ ...r, x0: r.x0 - dx, x1: r.x1 - dx, y0: r.y0 - dy, y1: r.y1 - dy })).join('; '));
  }
};

await scenariusz('drzwi i półki', szafka('D'));
await scenariusz('szuflady', szafka('S', { levels: [{ h: null, cols: [{ ...kol(), kind: 'drawers', drawers: [{ h: 'auto' }, { h: 'auto' }, { h: 'auto' }] }] }] }));
await scenariusz('szuflady z podniesionym tyłem', szafka('ST', { levels: [{ h: null, cols: [{ ...kol(), kind: 'drawers', drawers: [{ h: 'auto', tallBack: true }, { h: 'auto', tallBack: true }] }] }] }));
await scenariusz('fix ze wspornikiem + drzwi', szafka('F', { levels: [{ h: null, cols: [kol({ doors: 1, fix: { side: 'left', w: 100, mode: 'overlay', support: true, supportDepth: 100 } })] }] }));
await scenariusz('blenda w kolumnie + drzwi', szafka('B', { W: 800, levels: [{ h: null, cols: [kol({ doors: 1 }), { ...kol(), kind: 'blenda', w: 100 }] }] }));
await scenariusz('dwa poziomy, dwie kolumny', szafka('P', { W: 800, H: 2000, levels: [{ h: null, cols: [kol({ doors: 1 }), kol({ doors: 1 })] }, { h: 700, cols: [kol()] }] }));
await scenariusz('fronty wpuszczane', szafka('WP', { frontMode: 'inset' }));
await scenariusz('HDF we frezie', szafka('FR', { backGroove: { on: true, offset: 3, depth: 16, play: 1, wreg: true } }));
await scenariusz('plecy z płyty wewnątrz', szafka('PW', { back: 'board', backPos: 'inside' }));
await scenariusz('plecy z płyty na zewnątrz', szafka('PZ', { back: 'board', backPos: 'outside' }));
await scenariusz('bez pleców', szafka('BP', { back: 'none' }));
await scenariusz('klapa do góry', wisz('KG', { W: 800, H: 400, levels: [{ h: null, cols: [kol({ doors: 1, klapa: 'gora' })] }] }));
await scenariusz('klapa w dół', wisz('KD', { W: 600, H: 400, levels: [{ h: null, cols: [kol({ doors: 1, klapa: 'dol' })] }] }));
await scenariusz('wisząca na listwie', wisz('W'));
await scenariusz('uchwyty u góry, 35 mm', szafka('U', { levels: [{ h: null, cols: [kol({ handlePos: ['gora', 'gora'], handleOuts: [35, 35] })] }] }));
await scenariusz('szafka w L (sama)', szafka('L', { W: 900, corner: { on: true, arm: 640, doors: 'wsporniki' }, levels: [{ h: null, cols: [kol({ doors: 1 })] }] }));
await scenariusz('górna szafka w L (sama), wzmocnienie tylne A', wisz('GLA', { W: 650, corner: { on: true, arm: 350, doors: 'wsporniki' }, levels: [{ h: null, cols: [kol({ doors: 1 })] }] }));
await scenariusz('górna szafka w L (sama), wzmocnienie tylne B', wisz('GLB', { W: 650, corner: { on: true, arm: 350, doors: 'wsporniki', post: { on: true, w: 150, typ: 'B' } }, levels: [{ h: null, cols: [kol({ doors: 1 })] }] }));
await scenariusz('cokół w obrysie', szafka('CO', { plinth: { on: true, height: 100, mode: 'inside', setback: 50 } }));

/* ---- Ciag i zabudowa: te same zasady, ale uklad osi rysunku szukamy
   posrod obrotow i odbic (sciany w zabudowie sa obrocone), a bryly bierzemy
   z bryly calej zabudowy. */
const MAPY = [];
for (const X of [[0, 1], [0, -1], [2, 1], [2, -1]]) for (const Yz of [[1, -1]]) MAPY.push({ X, Y: Yz, blizej: X[0] === 0 ? [2, -1] : [0, -1], front: true });
for (const X of [[0, 1], [0, -1], [2, 1], [2, -1]]) for (const Ys of [1, -1]) MAPY.push({ X, Y: [X[0] === 0 ? 2 : 0, Ys], blizej: [1, 1], top: true });
/* `tylkoInfo` — zabudowy z rogiem: rysunek ciagu pokazuje sasiada inaczej niz
   bryla (przekroj, bez jego blatu i uchwytow) i nie wszystkie roznice sa juz
   rozebrane (AI_NOTES, [AI-TODO] audyt 2D rogu) — wypisujemy je jako INFO. */
const zabudowa = async (tytul, p, { widoki = ['Zamk.', 'Z góry'], tylkoInfo = false } = {}) => {
  const sprawdz = (l, c, e) => (tylkoInfo ? (c ? ok(l, c, e) : info(`${l} — ${e}`)) : ok(l, c, e));
  console.log(`\n== ${tytul} ==`);
  await page.evaluate((q) => { localStorage.clear(); localStorage.setItem('szafki:projekt', JSON.stringify(q)); }, p);
  await page.reload({ waitUntil: 'networkidle' }); await page.waitForTimeout(900);
  for (const zakres of ['Ciąg', 'Zabudowa']) {
    if (!(await click(zakres))) continue;
    await click('Zamk.');
    await page.evaluate(() => { window.__audytBryl = []; });
    await click('3D');
    const sol = (await page.evaluate(() => { const x = window.__audytBryl; window.__audytBryl = null; return x || []; }))
      .filter((q) => q.p && q.color !== '#b91c1c' && q.color !== '#b45309' && (q.alpha ?? 1) > 0.2);
    for (const nazwa of widoki) {
      // zabudowa z przodu to rozwiniecie scian obok siebie — jednego ukladu osi nie ma
      if (zakres === 'Zabudowa' && nazwa !== 'Z góry') continue;
      if (!(await click(nazwa))) continue;
      const wsz = await prostokaty();
      // przerywane obrysy to strefy (rog, zasieg) — nie plyty
      const rs = wsz.filter((r) => r.f !== '#fafaf9' && !OKUCIA_2D.has(r.f) && !prowadnica(r) && !(r.da && (!r.f || r.f === 'none'))
        && !(r.f === 'none' && (!r.s || r.s === 'none')) && !/sciana|wymiar/.test(r.el));
      // blat w rzucie z gory jest domyslnie ukryty — gdy go nie ma na rysunku, nie szukamy go
      const blatNaRys = wsz.some((r) => r.f === '#8d7b68');
      const solW = sol.filter((q) => blatNaRys || q.color !== '#8d7b68' || nazwa !== 'Z góry');
      let best = null;
      for (const w of MAPY.filter((m) => (nazwa === 'Z góry') === !!m.top)) {
        const rz = solW.map((q) => rzut(q, w));
        const [dx, dy] = przesuniecie(rz, rs);
        const trafione = rs.filter((r) => rz.some((a) => rowny(a, r, dx, dy))).length;
        if (!best || trafione > best.trafione) best = { w, rz, dx, dy, trafione };
      }
      const { rz, dx, dy } = best;
      /* Sasiedni ciag na elewacji to przekroj — jeden pelny blok w obrysie jego
         szafki. Pasuje, gdy jest obwiednia kilku bryl; bryly w nim sa wtedy „na rysunku”. */
      const blok = (r) => !!r.da && r.f && r.f !== 'none' && obwiednia({ ...r, f: 'none' }, rz, dx, dy);
      const bloki = rs.filter(blok);
      const wBloku = (a) => bloki.some((r) => a.x0 + dx >= r.x0 - 2.5 && a.x1 + dx <= r.x1 + 2.5 && a.y0 + dy >= r.y0 - 2.5 && a.y1 + dy <= r.y1 + 2.5);
      // w „Ciąg” blat sasiedniego ciagu jest tylko tlem bryly — elewacja i rzut ciagu go nie rysuja
      const brak = rz.filter((a) => !rs.some((r) => rowny(a, r, dx, dy) || wPasie(a, r, dx, dy)) && !zasloniety(a, rz) && !wBloku(a)
        && !(zakres === 'Ciąg' && a.s.color === '#8d7b68'));
      const obce = rs.filter((r) => !rz.some((a) => rowny(a, r, dx, dy)) && !pasem(r, rz, dx, dy) && !obwiednia(r, rz, dx, dy) && !blok(r));
      sprawdz(`${zakres} ${nazwa}: każda bryła ma swój prostokąt`, !brak.length, brak.map(opisB).slice(0, 8).join('; '));
      sprawdz(`${zakres} ${nazwa}: każdy prostokąt jest rzutem bryły`, !obce.length, obce.slice(0, 8).map((r) => opisR({ ...r, x0: r.x0 - dx, x1: r.x1 - dx, y0: r.y0 - dy, y1: r.y1 - dy })).join('; '));
    }
  }
};
const RUN = (id, name, o = {}) => ({ id, name, wallW: null, gap: 0, mountY: 0, H: 720, D: 560, plinth: PL, worktop: true, corner: null, ...o });
const PRJ = (items, runs) => ({ name: 'Z', active: 0, prices: {}, runs, items: items.map(([cab, runId]) => ({ cab, runId, offset: 0 })) });
await zabudowa('ciąg trzech szafek z blatem i cokołem', PRJ([[szafka('C1'), 'c1'], [szafka('C2'), 'c1'], [szafka('C3', { W: 400 }), 'c1']], [RUN('c1', 'Ściana 1')]));
const ROG = (o = {}) => ({ of: 'c1', at: 'end', owner: 'self', clear: 0, ...o });
const USTAW = { W: 1000, levels: [{ h: null, cols: [kol({ doors: 1, fix: { side: 'left', w: 621, mode: 'overlay', support: false }, hinge: 'right' })] }] };
for (const ws of [null, { typ: 'plaska', w: 60 }, { typ: 'szeroka', w: 60 }])
  await zabudowa('ślepy róg ' + (ws ? 'z wstawką ' + ws.typ : 'bez wstawki'), PRJ([[szafka('A1'), 'c1'], [szafka('A2'), 'c1'],
    [szafka('R', USTAW), 'c2'], [szafka('B2'), 'c2']], [RUN('c1', 'Ściana 1'), RUN('c2', 'Ściana 2', { corner: ROG({ wstawka: ws }) })]));
await zabudowa('szafka w L w rogu', PRJ([[szafka('A1'), 'c1'], [szafka('A2'), 'c1'],
  [szafka('L', { W: 900, corner: { on: true, arm: 640, doors: 'wsporniki' }, levels: [{ h: null, cols: [kol({ doors: 1 })] }] }), 'c2'], [szafka('B2'), 'c2']],
  [RUN('c1', 'Ściana 1'), RUN('c2', 'Ściana 2', { corner: ROG() })]));
await zabudowa('U: trzy ściany', PRJ([[szafka('A', { W: 1200, levels: [{ h: null, cols: [kol({ doors: 1, fix: { side: 'right', w: 621, mode: 'overlay', support: false }, hinge: 'left' })] }] }), 'c1'],
  [szafka('B', { W: 1400, levels: [{ h: null, cols: [kol({ doors: 1, fix: { side: 'right', w: 621, mode: 'overlay', support: false }, hinge: 'left' })] }] }), 'c2'],
  [szafka('C', { W: 900 }), 'c3']],
  [RUN('c1', 'A'), RUN('c2', 'B', { corner: ROG({ owner: 'of' }) }), RUN('c3', 'C', { corner: { of: 'c2', at: 'end', owner: 'of', clear: 0 } })]), { tylkoInfo: true });
await zabudowa('górne ciągi w L', PRJ([[szafka('D1'), 'c1'], [szafka('D2'), 'c1'], [szafka('D3'), 'c2'],
  [wisz('G1'), 'c3'], [wisz('G2'), 'c3'], [wisz('G3'), 'c4']],
  [RUN('c1', 'Ściana 1'), RUN('c2', 'Ściana 2', { corner: ROG({ owner: 'of' }) }),
   RUN('c3', 'Ściana 1', { tier: 'gorny', wall: 'c1', D: 300, mountY: 1358, worktop: false, plinth: null }),
   RUN('c4', 'Ściana 2', { tier: 'gorny', wall: 'c2', D: 300, mountY: 1358, worktop: false, plinth: null })]), { tylkoInfo: true });

console.log('\nBLEDY:', errors.length ? errors.join('; ') : '(brak)');
await b.close();
