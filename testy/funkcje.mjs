/* Funkcje obliczen z `szafki.jsx` wywolane wprost w node (bez przegladarki) — tam,
   gdzie scenariusz trudno ulozyc formularzem (audyt GPT 2026-10-28):
   - N92 rozkroj na wlasnym kawalku zdejmuje te formatke, ktora na nim lezy;
   - N93 podsumowanie grupy liczy tez wlasne kawalki;
   - N95 dwie wlasne plyty o tej samej nazwie — osobne grupy; stary zapis dostaje numer;
   - N94 stary kawalek (bez tozsamosci plyty) dostaje ja przy wczytaniu;
   - N90 wiersz rury w zamowieniu projektu z planem zakupu i ciecia;
   - N109 para wzmocnien pod blat w szafce narożnej (stojaca z przodu) przy nowym poziomie
     i przy powrocie do wienca;
   - N110–N139 (audyt GPT 2026-10-28): przeszkody i DXS, wiercenia, wspolne dno, prześwit,
     ramie szafki w L (zawiasy, uchwyt, wzmocnienia, polki, plecy, katownik, fronty
     skrecone), noga pod wycieciem;
   - decyzje uzytkownika 2026-10-28: krotszy wkret frontu DXS (N117), nozka przesunieta spod
     wyciecia (N122), dwa fronty w ramieniu (N132);
   - N140–N149: kolory blatow w rozkroju, scalanie przy roznym montazu frontow, wlasne blaty
     na roznych wysokosciach, rura a wzmocnienie, wspornik a NL szuflady, tip-on, blaty
     gornych ciagow w rogu, przelot bez przegrody, listwa przy roznych wysokosciach,
     zawieszka w wycieciu. */
import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';
import { fileURLToPath } from 'url';
const DIR = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const Babel = require(path.join(DIR, 'vendorpkg/node_modules/@babel/standalone'));
const ok = (l, c, e = '') => console.log((c ? '  OK   ' : '  BLAD ') + l + (e ? ' — ' + e : ''));

let src = fs.readFileSync(path.join(DIR, '..', 'szafki.jsx'), 'utf8');
src = src.replace(/^import React[^\n]*\n/, 'const React = { createElement: () => null, Fragment: "f" };\n'
  + 'const useState=()=>[null,()=>{}],useEffect=()=>{},useMemo=(f)=>f(),useCallback=(f)=>f,useRef=()=>({current:null});\n');
src = src.replace(/export default function App/, 'function App');
const nazwy = ['hwDefaultPrice', 'buildCutPlan', 'loadProject', 'scalOkucia', 'tozsamoscPlyty', 'defaultMaterials', 'migrateCab', 'bezWienca', 'utrzymajPodBlat', 'zWiencem', 'jestParaPodBlat',
  'computeGeo', 'projectLayout', 'projectParts', 'runBottom', 'wysokoscWienca', 'wedlugCiagu', 'cornerArmParts', 'cornerPairMsgs', 'armPlan', 'wierceniaDodatkowe', 'openingMsgs', 'armCtxOf',
  'ambiguousThickness', 'matyUzyte', 'matLabelOf', 'scalSzafki', 'cabDoGeo', 'okuciaSzafki', 'wierszBlatu', 'scalenieBlad', 'runTop', 'worktopMsgs', 'runTopZlacza', 'tierMountY', 'runRail', 'kolumnaZPrzelotu', 'roznePlyty', 'kolumnaNaDwie', 'odScianyMsgs', 'odstepOdSciany'];
src += '\nmodule.exports = {' + nazwy.map((n) => `${n}: typeof ${n} !== "undefined" ? ${n} : undefined`).join(',') + '};\n';
const out = Babel.transform(src, { presets: [['react', { runtime: 'classic' }]], filename: 'szafki.jsx', compact: true }).code;
const m = { exports: {} };
new Function('module', 'exports', 'window', 'localStorage', out)(m, m.exports, {}, { getItem: () => null, setItem: () => {} });
const G = m.exports;

console.log('== N92: własny kawałek zdejmuje właściwą formatkę ==');
{
  const plan = G.buildCutPlan([
    { name: 'Drzwi nakładane', qty: 1, a: 500, b: 800, rotatable: false, matLabel: 'X', matId: 'X' },
    { name: 'Drzwi nakładane', qty: 1, a: 800, b: 500, rotatable: false, matLabel: 'X', matId: 'X' },
  ], [{ id: 'r1', matLabel: 'X', matId: 'X', w: 800, h: 500, qty: 1 }]);
  const ul = plan[0].sheets.map((s) => (s.wlasna ? 'W:' : 'K:') + s.parts.map((p) => `${p.w}×${p.h}`).join(','));
  ok('na kawałku 800 × 500, na kupnym arkuszu 500 × 800 (obie orientacje, bez obracania)', JSON.stringify(ul) === '["W:800×500","K:500×800"]', JSON.stringify(ul));
  const plan2 = G.buildCutPlan([
    { name: 'Bok', qty: 3, a: 700, b: 400, rotatable: false, matLabel: 'X', matId: 'X' },
    { name: 'Bok', qty: 2, a: 400, b: 700, rotatable: false, matLabel: 'X', matId: 'X' },
  ], [{ id: 'r1', matLabel: 'X', matId: 'X', w: 720, h: 420, qty: 2 }]);
  const wszystkie = plan2[0].sheets.flatMap((s) => s.parts.map((p) => `${p.w}×${p.h}`)).sort();
  ok('ilości > 1: 3 × 700 × 400 i 2 × 400 × 700 — razem właściwe orientacje', JSON.stringify(wszystkie) === JSON.stringify(['400×700', '400×700', '700×400', '700×400', '700×400']), JSON.stringify(wszystkie));
}

console.log('\n== N93: podsumowanie z własnymi kawałkami ==');
{
  const g = G.buildCutPlan([{ name: 'Półka', qty: 1, a: 400, b: 300, rotatable: true, matLabel: 'X', matId: 'X' }],
    [{ id: 'r1', matLabel: 'X', matId: 'X', w: 800, h: 500, qty: 1 }])[0];
  ok('0 do kupienia, 1 własny; wykorzystanie 30 %, 2 cięcia, zrzut 497 × 500', g.kupic === 0 && g.zWlasnych === 1 && Math.round(g.usedPct) === 30 && g.cuts === 2
    && g.biggestRect && g.biggestRect.w === 497 && g.biggestRect.h === 500, JSON.stringify({ k: g.kupic, w: g.zWlasnych, p: g.usedPct, c: g.cuts, z: g.biggestRect }));
  const bez = G.buildCutPlan([{ name: 'Półka', qty: 1, a: 400, b: 300, rotatable: true, matLabel: 'X', matId: 'X' }])[0];
  ok('bez kawałków — jak dotąd (1 arkusz)', bez.kupic === 1 && bez.cuts > 0);
}

console.log('\n== N95: dwie własne płyty o tej samej nazwie ==');
{
  const plan = G.buildCutPlan([
    { name: 'Bok', qty: 1, a: 800, b: 500, rotatable: true, matLabel: 'Płyta własna', matId: 'plyta:a' },
    { name: 'Bok', qty: 1, a: 800, b: 500, rotatable: true, matLabel: 'Płyta własna', matId: 'plyta:b' },
  ]);
  ok('dwie grupy, nie jeden arkusz', plan.length === 2 && plan.every((g) => g.sheets.length === 1), plan.map((g) => g.matIds.join(',')).join(' / '));
  const M = G.defaultMaterials;
  const cab = { name: 'S', W: 600, H: 720, D: 560, levels: [{ h: null, cols: [{ kind: 'doors', doors: 1 }] }] };
  const p = G.loadProject({ name: 'P', plyty: [{ id: 'a', nazwa: 'Płyta własna', grubosc: 18 }, { id: 'b', nazwa: 'Płyta własna', grubosc: 18 }],
    items: [{ cab, mat: { ...M, board: { name: 'Płyta własna', thickness: 18, color: '#fff', plyta: 'b' } } }] });
  ok('wczytanie: druga „Płyta własna (2)”, szafka z nią ma nową nazwę i arkusz', p.plyty.map((q) => q.nazwa).join('|') === 'Płyta własna|Płyta własna (2)'
    && p.items[0].mat.board.name === 'Płyta własna (2)' && p.items[0].mat.board.arkusz && p.items[0].mat.board.arkusz.w === 2800, JSON.stringify(p.items[0].mat.board));
}

console.log('\n== N94: stary kawałek dostaje tożsamość płyty ==');
{
  const M = G.defaultMaterials;
  const cab = { name: 'S', W: 600, H: 720, D: 560, levels: [{ h: null, cols: [{ kind: 'doors', doors: 1 }] }] };
  const board = { name: 'Płyta', thickness: 18, color: '#c19a6b', decor: 'Dąb sonoma' };
  const p = G.loadProject({ name: 'P', resztki: [{ id: 'r1', matLabel: 'Płyta Dąb sonoma', w: 800, h: 500 }], items: [{ cab, mat: { ...M, board } }] });
  ok('matId z materiału o tej etykiecie', p.resztki[0].matId === G.tozsamoscPlyty(board), JSON.stringify(p.resztki[0]));
  // etykieta z grubością („… 18”), kawałek po tożsamości dalej pasuje
  const plan = G.buildCutPlan([{ name: 'Półka', qty: 1, a: 400, b: 300, rotatable: true, matLabel: 'Płyta Dąb sonoma 18', matId: G.tozsamoscPlyty(board) },
    { name: 'Półka', qty: 1, a: 400, b: 300, rotatable: true, matLabel: 'Płyta Dąb sonoma 16', matId: G.tozsamoscPlyty({ ...board, thickness: 16 }) }], p.resztki);
  const g18 = plan.find((g) => /18$/.test(g.matLabel)), g16 = plan.find((g) => /16$/.test(g.matLabel));
  ok('grupa 18 mm z własnego kawałka, 16 mm — bez niego (kupiony arkusz)', g18.zWlasnych === 1 && g18.kupic === 0 && g16.zWlasnych === 0 && g16.kupic === 1,
    JSON.stringify(plan.map((g) => [g.matLabel, g.kupic, g.zWlasnych])));
}

console.log('\n== N90: rura na wieszaki w zamówieniu projektu ==');
{
  const r = G.scalOkucia([
    { name: 'Rura na wieszaki ⌀25', unit: 'mb', qty: 0.562, odcinek: 562, gdzie: 'A', spec: 'docięta' },
    { name: 'Rura na wieszaki ⌀25', unit: 'mb', qty: 0.9, odcinek: 900, gdzie: 'B', spec: 'docięta' },
  ]).find((h) => /^Rura/.test(h.name));
  ok('różne długości: plan zakupu i cięcia z nazwami szafek', /^kupić/.test(r.spec) && /562 \(A\)/.test(r.spec) && /900 \(B\)/.test(r.spec) && /odpad/.test(r.spec), r.spec);
}

console.log('\n== N109: para pod blat w szafce narożnej ==');
{
  const M = G.defaultMaterials;
  const kol = () => ({ kind: 'doors', doors: 1, w: null, shelfTargets: [null] });
  const naroz = G.migrateCab({ name: 'N', W: 1000, H: 720, D: 560, corner: { on: true, side: 'left', arm: 400 }, levels: [{ h: null, cols: [kol()] }] }, M);
  const z = { ...naroz, ...G.bezWienca(naroz) };
  const para = (lv) => lv.cols.flatMap((c) => (c.rails || []).filter(G.jestParaPodBlat).map((r) => `${r.orient}/${r.fromBack ? 'tył' : 'przód'}`));
  ok('bez wieńca: para — stojąca z przodu i z tyłu', JSON.stringify(para(z.levels[0])) === '["front/przód","front/tył"]', JSON.stringify(para(z.levels[0])));
  const L2 = G.utrzymajPodBlat(z, [...JSON.parse(JSON.stringify(z.levels)), { h: null, cols: [kol()] }]);
  ok('nowy poziom: obie płyty pary w najwyższym, w niższym żadnej', para(L2[0]).length === 0 && JSON.stringify(para(L2[1])) === '["front/przód","front/tył"]',
    JSON.stringify(L2.map(para)));
  const zw = G.zWiencem({ ...z, levels: L2 });
  ok('powrót do wieńca: para znika w całości', zw.levels.every((lv) => lv.cols.every((c) => !(c.rails || []).length)), JSON.stringify(zw.levels.map((lv) => lv.cols.map((c) => (c.rails || []).length))));
  // reczne wzmocnienie czolowe 100 mm z przodu — nie jest para, zostaje
  const r = { orient: 'front', pos: 'top', side: 'left', h: 100, depth: 100, atDepth: 0, fromBack: false };
  ok('ręczne czołowe 100 mm z przodu nie jest parą', !G.jestParaPodBlat(r));
}

/* ---------- audyt GPT N110–N139 ---------- */
const M0 = G.defaultMaterials;
const geo = (cab, mat = M0) => G.computeGeo(G.migrateCab(JSON.parse(JSON.stringify(cab)), mat), mat);
const uw = (g, re) => g.msgs.filter((x) => re.test(x.text));
const nogi = { plinth: { on: false }, legs: { on: false } };
const drzwi = (o = {}) => ({ kind: 'doors', doors: 1, w: null, shelfTargets: [], ...o });

console.log('\n== N110/N111: DXS przy przeszkodzie ==');
{
  const dxs = (nl, ob) => ({ name: 'T', W: 600, H: 720, D: 560, ...nogi, obstacles: [{ on: true, w: 80, d: 280, side: 'left', fromSide: 200, fromBack: 0, fullHeight: false, mask: false, ...ob }],
    levels: [{ h: null, cols: [{ kind: 'drawers', w: null, drawers: [{ h: null, nl, system: 'dxs', sideH: 80 }] }] }] });
  const m = uw(geo(dxs(300, { fromBottom: 100, h: 100 })), /NL 300 sięga elementu/);
  ok('N110: NL 300 przy przeszkodzie — od razu NL 250 z katalogu DXS (nie 270)', m.length === 1 && /NL 250/.test(m[0].text) && /\|fixnl:0:0:0:250$/.test(m[0].text), m.map((x) => x.text).join(' / '));
  ok('N111: przeszkoda 18–28 mm pod skrzynką (bok od 37) — bez kolizji', !uw(geo(dxs(550, { fromBottom: 0, h: 10 })), /NL 550 sięga/).length);
  ok('N111: kontrola — przeszkoda 118–218 mm na drodze skrzynki', uw(geo(dxs(550, { fromBottom: 100, h: 100 })), /NL 550 sięga/).length === 1);
}

console.log('\n== N112–N114: zabudowa przeszkody przy dwóch poziomach ==');
{
  const open = () => ({ kind: 'open', w: null, shelfTargets: [] });
  const dwa = (ob, gor) => ({ name: 'T', W: 600, H: 1200, D: 560, ...nogi, levels: [{ h: 591, cols: [open()] }, { h: null, cols: gor }],
    obstacles: [{ on: true, w: 80, d: 80, h: 100, side: 'left', fromSide: 320, fromBack: 0, fromBottom: 100, fullHeight: false, mask: true, maskType: 'auto', maskFront: 'over', ...ob }] });
  const g2 = geo(dwa({}, [open(), open()])), g1 = geo(dwa({}, [open()]));
  ok('N112: przegroda górnego poziomu nie jest bokiem dolnej zabudowy — U z trzema ściankami jak przy jednej kolumnie',
    g2.geoObs[0].maskChosen === 'U' && g2.geoObs[0].maskWalls.length === 3 && g1.geoObs[0].maskWalls.length === 3, `${g2.geoObs[0].maskChosen}/${g2.geoObs[0].maskWalls.length}`);
  ok('N113: płyta między poziomami to „półka nad” elementem', g1.geoObs[0].shelfAbove != null, String(g1.geoObs[0].shelfAbove));
  const g3 = geo(dwa({ fromSide: 200, fromBottom: 530, mask: false }, [open()]));
  ok('N114: element przez płytę między poziomami — uwaga z wymiarem otworu', uw(g3, /przechodzi przez płytę między poziomami 1 i 2/).length === 1 && /potrzebne w niej wycięcie 80 × 80 z tyłu, 182 mm od lewej/.test(uw(g3, /przechodzi przez płytę/)[0].text), uw(g3, /przechodzi przez płytę/).map((x) => x.text).join(' / '));
  const g4 = geo(dwa({ fromSide: 251, fromBottom: 800, mask: false }, [open(), open()]));
  ok('N114: element przez przegrodę między kolumnami — uwaga', uw(g4, /przechodzi przez przegrodę między kolumnami 1 i 2/).length === 1);
}

console.log('\n== N115/N116/N121: plan wierceń ==');
{
  const g = geo({ name: 'T', W: 600, H: 720, D: 560, ...nogi, joints: { topL: 'between', topR: 'over', botL: 'between', botR: 'over' }, levels: [{ h: null, cols: [drzwi()] }] });
  const r = (g.drillPlan.find((p) => p.panel === 'Dno') || { rows: [] }).rows.find((x) => /konfirmat — bok prawy/.test(x.kind));
  ok('N115: dno 582 z lewym końcem między bokami — prawy konfirmat 573 mm od lewego końca płyty (było 591)', g.panels.some((p) => p.a === 582) && r && r.ys[0] === 573, JSON.stringify(r));
  const wsp = (rails) => geo({ name: 'T', W: 600, H: 720, D: 560, ...nogi, levels: [{ h: null, cols: [drzwi({ hinge: 'left', fix: { side: 'left', w: 100, mode: 'overlay', support: true, supportDepth: 100 }, rails })] }] });
  const gw = wsp([{ orient: 'front', pos: 'bottom', side: 'left', h: 100, depth: 100, atDepth: 50, fromBack: false, reducesDoor: false }]);
  const s = gw.levels[0].cols[0].support;
  const zaw = (gw.drillPlan.find((p) => /Wspornik/.test(p.panel)) || { rows: [] }).rows.find((x) => x.kind === 'zawias');
  ok('N116: wspornik skrócony wzmocnieniem (118–702) — bez płyty pod nim, zawiasy w jego zakresie', s.y0 === 118 && s.pod === false && zaw && zaw.ys.every((y) => y >= 0 && y <= s.h), JSON.stringify({ s, zaw: zaw && zaw.ys }));
  const hdf = (bm) => geo({ name: 'T', W: 600, H: 720, D: 560, ...nogi, back: 'hdf', backGroove: { on: true, offset: 3, depth: 16, play: 1 }, levels: [{ h: null, cols: [drzwi({ backMode: bm })] }] });
  const frezy = (g2) => g2.drillPlan.flatMap((p) => p.rows.filter((x) => /frez pod HDF/.test(x.kind))).length;
  ok('N121: kolumna bez pleców — bez frezów pod HDF; kontrola z plecami — 4 frezy', frezy(hdf('none')) === 0 && frezy(hdf('inherit')) === 4, `${frezy(hdf('none'))} / ${frezy(hdf('inherit'))}`);
}

console.log('\n== N117/N128: DXS — wkręty frontu i wysoki tył ==');
{
  const dx = (o = {}, H = 720) => ({ name: 'T', W: 600, H, D: 560, ...nogi, shelfSameAsBoard: false, frontSameAsBoard: false,
    levels: [{ h: null, cols: [{ kind: 'drawers', w: null, drawers: [{ h: null, system: 'dxs', nl: 500, sideH: 80, ...o }] }] }] });
  const mat = (ts, tf) => ({ ...M0, shelf: { ...M0.shelf, thickness: ts }, front: { ...M0.front, thickness: tf } });
  // decyzja uzytkownika 2026-10-28: krotszy wkret dobiera sie sam, z ostrzezeniem i przyciskiem do notatki
  const g117 = geo(dx(), mat(16, 12));
  const w117 = uw(g117, /wkręty do frontu 4 × 25 zamiast 4 × 30/);
  const h117 = g117.hardware.find((h) => /do frontu szuflady/.test(h.name)) || {};
  const p117 = g117.drillPlan.flatMap((q) => q.rows.filter((r) => r.kind === 'front od środka').map((r) => r.note)).join(' ');
  ok('N117: przód 16 + front 12 — zamówienie 4 × 25, ostrzeżenie z „Dopisz do notatki”, plan z 4 × 25',
    h117.name === 'Wkręt 4 × 25 do frontu szuflady' && h117.qty === 4 && /krótszy niż zwykły 4 × 30/.test(h117.spec)
    && w117.length === 1 && w117[0].level === 'warn' && /\|notatka:/.test(w117[0].text) && /4 wkręty 4 × 25/.test(p117), `${h117.name} | ${w117.map((x) => x.text.slice(0, 90))} | ${p117}`);
  const g117b = geo(dx(), mat(8, 8));
  ok('N117: przód 8 + front 8 — za cienko nawet na 4 × 16: błąd, bez wkrętów w zamówieniu', uw(g117b, /frontu nie da się przykręcić od środka/).length === 1
    && !g117b.hardware.some((h) => /do frontu szuflady/.test(h.name)));
  ok('N117: kontrola 18 + 18 — 4 × 30, bez uwagi', !uw(geo(dx(), mat(18, 18)), /wkręt/).length
    && geo(dx(), mat(18, 18)).hardware.some((h) => h.name === 'Wkręt 4 × 30 do frontu szuflady'));
  const m = uw(geo(dx({ backHeight: 260 }, 300)), /tył 260 mm sięga/);
  ok('N128: tył 260 w korpusie 300 — błąd „wchodzi w nie” z naprawą', m.length === 1 && m[0].level === 'error' && /\|fixback:/.test(m[0].text), m.map((x) => x.text).join(' / '));
}

console.log('\n== N118/N133: wspólne dno ciągu ==');
{
  const run = { id: 'c1', name: 'Ściana', wallW: null, gap: 20, mountY: 0, H: 720, D: 500, plinth: { on: true, height: 100, mode: 'under', setback: 0 }, worktop: false, corner: null, wspolneDno: true };
  const cab = (n, o = {}) => ({ name: n, W: 600, H: 720, D: 500, plinth: run.plinth, levels: [{ h: null, cols: [drzwi()] }], ...o });
  const mk = (it = [{}, {}], co = [{}, {}]) => {
    const P = G.loadProject({ name: 'P', runs: [run], items: [0, 1].map((k) => ({ cab: cab('S' + k, co[k]), runId: 'c1', ...it[k] })) });
    const h = G.wysokoscWienca(P.items, P.runs[0]);
    P.items = P.items.map((x) => ({ ...x, cab: G.wedlugCiagu(x.cab, x.mat, P.runs[0], h) }));
    return P;
  };
  const rb = (P) => G.runBottom(P, P.runs[0]);
  ok('N118: obrzeże dna wyłączone — dalej wspólne dno 1220', JSON.stringify(rb(mk([{}, {}], [{}, { edgeOverrides: { Dno: { b1: false, b2: false } } }])).lens) === '[1220]');
  const P = mk([{}, { offset: 100 }]);
  const r = rb(P);
  const dna = G.projectParts(P).flatMap((g) => g.panels.filter((p) => /^Dno/.test(p.name)).map((p) => `${p.name} ${p.a}×${p.b}`));
  ok('N133: szafka wysunięta o 100 — bez wspólnego dna, z powodem; każda zostaje przy swoim dnie', r.brak && /wysunięte z lica/.test(r.powod) && dna.length === 2 && dna.every((d) => d === 'Dno 600×500'), `${r.powod} | ${dna.join(', ')}`);
}

console.log('\n== N120: prześwit 0 po wczytaniu ==');
{
  const P = (c) => G.loadProject({ name: 'P', runs: [{ id: 'd', name: 'D', H: 720, D: 560 }, { id: 'g', name: 'G', tier: 'gorny', wall: 'd', clearance: c, H: 720, D: 300 }],
    items: [{ cab: { name: 'S', W: 600, H: 720, D: 560, levels: [{ h: null, cols: [drzwi()] }] }, runId: 'd' }] }).runs[1].clearance;
  ok('0 zostaje 0, 300 zostaje, brak / ujemny → 500', P(0) === 0 && P(300) === 300 && P(undefined) === 500 && P(-5) === 500, [P(0), P(300), P(undefined), P(-5)].join(','));
}

console.log('\n== N122: nóżka pod pełnym wycięciem narożnika ==');
{
  const c = (cut, legs = true) => geo({ name: 'T', W: 600, H: 720, D: 560, plinth: { on: false }, legs: { on: legs, height: 100 }, cutout: { on: true, w: 100, d: 100, fullHeight: true, mask: true, ...cut },
    levels: [{ h: null, cols: [{ kind: 'open', w: null, shelfTargets: [] }] }] });
  // decyzja uzytkownika 2026-10-28: nozka sama przesuwa sie tuz za wyciecie (10 mm), tam gdzie blizej
  const m = (g) => JSON.stringify(g.legs.miejsca.map((q) => [q.x, q.odTylu]));
  const g1 = c({});
  ok('100 × 100: tylna lewa nóżka przesunięta do przodu na 110 mm od tyłu, informacja', m(g1) === '[[40,480],[40,110],[520,480],[520,40]]'
    && uw(g1, /Nóżka spod wycięcia narożnika \(lewy\) przesunięta o 70 mm do przodu — stoi 40 mm od lewego boku i 110 mm od tyłu/).length === 1, m(g1));
  const g2 = c({ w: 100, d: 300 });
  ok('100 × 300 (głębokie): przesunięta w prawo na 110 mm od lewego boku', m(g2) === '[[40,480],[110,40],[520,480],[520,40]]', m(g2));
  const g3 = c({ w: 560, d: 520 });
  ok('wycięcie prawie na całą szafkę: nie ma gdzie — ostrzeżenie, nóżki bez zmian', uw(g3, /obok wycięcia nie ma na nią miejsca/).length === 4 && !g3.legs.miejsca.some((q) => q.przesunieta));
  ok('wycięcie 30 × 30 (nóżka obok), bez nóżek — bez uwagi', !uw(c({ w: 30, d: 30 }), /nóżk/i).length && !uw(c({}, false), /nóżk/i).length);
}

console.log('\n== N123–N139: ramię szafki w L ==');
{
  const PL = { on: true, height: 100, mode: 'under', setback: 0 };
  const kol = (o = {}) => ({ kind: 'doors', doors: 1, w: null, shelfTargets: [null, null], ...o });
  const RUN = (id, name, o = {}) => ({ id, name, wallW: null, gap: 0, mountY: 0, H: 720, D: 560, plinth: PL, worktop: true, corner: null, ...o });
  const szafka = (name, o = {}) => ({ name, W: 600, H: 720, D: 560, plinth: PL, legs: { on: true, height: 100 }, levels: [{ h: null, cols: [kol({ shelfTargets: [null] })] }], ...o });
  const Lcab = (o = {}, c = {}) => ({ name: 'L', W: 900, H: 720, D: 560, plinth: PL, legs: { on: true, height: 100 }, corner: { on: true, arm: 640, doors: 'wsporniki', ...c }, levels: [{ h: null, cols: [kol()] }], ...o });
  const proj = (L, o = {}) => G.loadProject({ name: 'P', active: 1, prices: {},
    runs: [RUN('c1', 'Ściana 1', o.run1), RUN('c2', 'Ściana 2', { corner: { of: 'c1', at: 'end', owner: 'self', clear: 0 } })],
    items: [{ cab: szafka('A1', o.a1), runId: 'c1' }, { cab: L, runId: 'c2' }, { cab: szafka('B2'), runId: 'c2', offset: o.b2off || 0 }] });
  const ramie = (P) => { const Ly = G.projectLayout(P); const n = [...Ly.info.values()].find((x) => x.arm); return { Ly, n, a: n.arm }; };
  const uwagiRogu = (P) => [...G.projectLayout(P).info.values()].flatMap((x) => G.cornerPairMsgs(x, false));
  const pod = (L) => ({ ...L, ...G.bezWienca(G.migrateCab(L, M0)) });

  let P = proj(Lcab({ H: 900, frontSameAsBoard: false }));
  P.items[1].mat = { ...P.items[1].mat, front: { ...P.items[1].mat.front, thickness: 16 } };
  let ap = G.cornerArmParts(ramie(P).a);
  ok('N123: front ramienia 18 mm sąsiada H900 — 3 zawiasy (nie 2 z 16 mm właściciela)', (ap.hardware.find((h) => h.name === 'Zawias') || {}).qty === 3);
  P = proj(Lcab({ handleName: 'Uchwyt wpuszczany', handleOut: 0 }));
  ok('N124: uchwyt ramienia zamówiony także przy wystawaniu 0', ap.hardware.some((h) => h.pk === 'Uchwyt') && G.cornerArmParts(ramie(P).a).hardware.some((h) => h.pk === 'Uchwyt'));
  const m125 = (w) => uwagiRogu(proj(pod(Lcab({ H: 900 }, { railW: { przod: w, tyl: null } })))).filter((m) => /wzmocnienie ramienia czołowe/.test(m.text));
  ok('N125: własne wzmocnienie ramienia 1000 w H900 — błąd „najwyżej 882”; 60 bez uwagi', m125(1000).length === 1 && /Najwyżej 882 mm/.test(m125(1000)[0].text) && !m125(60).length);
  const glPolki = (tb) => { const Q = proj(Lcab({ back: 'none' }), { a1: { back: 'none' } }); Q.items.forEach((x) => { x.mat = { ...x.mat, back: { ...x.mat.back, thickness: tb } }; });
    return (G.cornerArmParts(ramie(Q).a).panels.find((p) => p.name === 'Półka ramienia') || {}).b; };
  ok('N126: bez pleców półka ramienia nie zależy od grubości HDF (3 / 4 mm)', glPolki(3) === glPolki(4) && glPolki(3) > 0, `${glPolki(3)} / ${glPolki(4)}`);
  P = proj(Lcab({ edgeOverrides: { 'Front ramienia': { a1: false, a2: false, b1: false, b2: false } } }));
  ok('N130: oklejanie frontu ramienia z tabeli formatek działa', JSON.stringify(G.cornerArmParts(ramie(P).a).panels.find((p) => p.name === 'Front ramienia').edges) === '{"a1":false,"a2":false,"b1":false,"b2":false}');
  P = proj(Lcab({ levels: [{ h: null, cols: [kol({ shelfMount: 'confirmat' })] }] }));
  const r131 = ramie(P).a;
  ap = G.cornerArmParts(r131);
  const plan = G.wierceniaDodatkowe(r131).flatMap((p) => p.rows.map((x) => `${p.panel}|${x.kind}`));
  ok('N131: kolumna na konfirmatach — półka ramienia też (okucia i plan), bez kołków 4 na półkę',
    ap.hardware.some((h) => /półki ramienia do boku/.test(h.spec || '')) && !ap.hardware.some((h) => h.spec === 'półki ramienia, po cztery na półkę')
    && plan.includes('Bok ramienia|konfirmat — półka ramienia') && !plan.includes('Bok ramienia|kołek półki'), plan.join(' / '));
  // decyzja uzytkownika 2026-10-28: dwa fronty w ramieniu, w linii z frontami korpusu
  P = proj(Lcab({ H: 900, levels: [{ h: 450, cols: [kol()] }, { h: null, cols: [kol()] }] }));
  let r132 = ramie(P).a;
  ap = G.cornerArmParts(r132);
  const fr = ap.panels.filter((p) => /^Front ramienia/.test(p.name)).map((p) => `${p.name} ${p.a}×${p.b}`);
  const zaw132 = (G.wierceniaDodatkowe(r132).find((q) => q.panel === 'Bok ramienia').rows.find((r) => r.kind === 'zawias') || {}).ys;
  ok('N132: dwa poziomy — dwa fronty ramienia (dolny 472, górny 418), maskownica 894, 4 zawiasy, 2 uchwyty',
    JSON.stringify(fr) === '["Front ramienia — dolny 558×472","Front ramienia — górny 558×418"]'
    && ap.panels.filter((p) => /^Maskownica/.test(p.name)).every((p) => p.b === 894)
    && (ap.hardware.find((h) => h.name === 'Zawias') || {}).qty === 4 && (ap.hardware.find((h) => h.pk === 'Uchwyt') || {}).qty === 2
    && JSON.stringify(zaw132) === '[103,375,579,797]', `${fr.join(', ')} | ${JSON.stringify(zaw132)}`);
  ok('N132: bez błędu, z informacją o dwóch frontach', !uwagiRogu(P).some((m) => m.level === 'error' && /fronty jeden nad drugim/.test(m.text))
    && uwagiRogu(P).some((m) => m.level === 'info' && /są 2 fronty jeden nad drugim — ramię ma tyle samo/.test(m.text)));
  ap = G.cornerArmParts(ramie(proj(Lcab({ H: 900 }))).a);
  ok('N132: kontrola — jeden poziom: jeden „Front ramienia” 558 × 894, 3 zawiasy', JSON.stringify(ap.panels.filter((p) => /^Front ramienia/.test(p.name)).map((p) => `${p.name} ${p.a}×${p.b}`)) === '["Front ramienia 558×894"]'
    && (ap.hardware.find((h) => h.name === 'Zawias') || {}).qty === 3);
  P = proj(Lcab({ H: 900, plinth: { on: true, height: 100, mode: 'inbody', setback: 0 }, legs: { on: false } }));
  ok('N134: cokół w obrysie — kątownik 900 − 18 − 118 = 764 mm (nad dnem)', G.cornerArmParts(ramie(P).a).panels.filter((p) => /^Kątownik narożnika/.test(p.name)).every((p) => p.b === 764));
  const kol135 = (doors, off) => { const Q = proj(Lcab({}, { doors }), { b2off: off }); const Ly = G.projectLayout(Q).pokoje.values().next().value; return G.openingMsgs(Ly, Q).map((m) => m.text); };
  const sk = kol135('skrecone', 350);
  ok('N135: skręcone 90° — zespół na zawiasach korpusu, styk z wysuniętą B2 (jedno skrzydło, bez osobnego frontu ramienia)',
    sk.length === 1 && /^Skrzydło skręcone z frontem ramienia/.test(sk[0]) && /B2/.test(sk[0]) && !/Przełóż zawiasy/.test(sk[0]), sk.join(' / '));
  ok('N135: kontrola — bez wysunięcia brak kolizji', !kol135('skrecone', 0).length);
  P = proj(Lcab({ shelfPin: { dFront: 250, dBack: 50 } }), { run1: { D: 200 }, a1: { D: 200 } });
  const m136 = uwagiRogu(P).filter((m) => /kołki półek 250 mm/.test(m.text));
  ok('N136: płytkie ramię (półka 182) — kołki 250/50 to błąd z przyciskiem dla tej szafki', m136.length === 1 && /półce ramienia głębokości 182 mm/.test(m136[0].text) && /\|kolki:50:50:1$/.test(m136[0].text));
  const dwieKol = pod(Lcab({ W: 1000, levels: [{ h: null, cols: [kol({ w: 500 }), kol({ doors: 0 })] }] }));
  ap = G.cornerArmParts(ramie(proj(dwieKol)).a);
  ok('N137: dwie kolumny z parą pod blat — w ramieniu 2 wzmocnienia (nie 4), 8 wkrętów', ap.panels.filter((p) => /^Wzmocnienie ramienia/.test(p.name)).length === 2
    && /wzmocnienia 2×4/.test((ap.hardware.find((h) => h.name === 'Wkręt 4 × 30') || {}).spec || ''));
  ap = G.cornerArmParts(ramie(proj(Lcab({ H: 900 }))).a);
  ok('N138: plecy ramienia 1197 × 898 — 42 zszywki', ap.panels.some((p) => p.name === 'Plecy ramienia' && p.a === 1197 && p.b === 898)
    && (ap.hardware.find((h) => h.name === 'Zszywka / gwoździk do pleców') || {}).qty === 42);
  P = proj(Lcab({ levels: [{ h: null, cols: [{ kind: 'drawers', w: null, drawers: [{ h: null, system: 'dxs', nl: 400, sideH: 80 }] }] }] }));
  const Ly = G.projectLayout(P);
  const g139 = G.computeGeo(P.items[1].cab, P.items[1].mat, G.armCtxOf(Ly, 1));
  ok('N139: szuflady w kolumnie przy ramieniu — błąd montażu', g139.msgs.some((m) => m.level === 'error' && /szuflady w kolumnie przy ramieniu/.test(m.text)));
}

console.log('\n== N140–N149 ==');
{
  const M = G.defaultMaterials;
  const wt = (c) => ({ ...M.worktop, name: 'Blat roboczy', color: c });
  const mats = [{ ...M, worktop: wt('#e8e6e1') }, { ...M, worktop: wt('#2b2a28') }];
  const amb = G.ambiguousThickness(mats);
  const rows = mats.map((m) => { const lab = G.matLabelOf(m.worktop, 'worktop', amb);
    return { name: 'Blat', qty: 1, a: 1000, b: 600, matId: G.tozsamoscPlyty(m.worktop), matLabel: lab, ...G.wierszBlatu({ a: 1000, b: 600, matKey: 'worktop' }, m, lab) }; });
  const plan = G.buildCutPlan(rows);
  ok('N140: biały i czarny „Blat roboczy” — dwie etykiety, dwie grupy, dwa arkusze', rows[0].matLabel !== rows[1].matLabel && plan.length === 2 && plan.every((g) => g.sheets.length === 1),
    rows.map((r) => r.matLabel).join(' / '));
  ok('N140: kontrola — jeden kolor bez dopisku', G.matLabelOf(mats[0].worktop, 'worktop', G.ambiguousThickness([mats[0], mats[0]])) === 'Blat roboczy');
  // dwie plyty w kolorach spoza wzornika pod jedna nazwa — z kodem koloru, jedna — „kolor własny”
  const wl = (c) => ({ ...M, board: { ...M.board, name: 'Płyta', color: c, decor: '' } });
  const amb2 = G.ambiguousThickness([wl('#cc2222'), wl('#22aa22')]);
  ok('N140: dwa „kolory własne” płyty — etykiety z kodem koloru', G.matLabelOf(wl('#cc2222').board, 'board', amb2) === 'Płyta kolor #cc2222'
    && G.matLabelOf(wl('#22aa22').board, 'board', amb2) === 'Płyta kolor #22aa22');
  // nieuzywany domyslny front (#c2a880) i polka (#d0bb96) tez sa spoza wzornika — nie licza sie
  const cabD = G.migrateCab({});
  const amb1 = G.ambiguousThickness([wl('#cc2222')], [G.matyUzyte(cabD, wl('#cc2222'))]);
  ok('N140: jeden „kolor własny” — bez zmian (nieużywany front i półka się nie liczą)', G.matLabelOf(wl('#cc2222').board, 'board', amb1) === 'Płyta kolor własny', [...amb1].join(','));
  const cabF = { ...cabD, frontSameAsBoard: false };
  const amb3 = G.ambiguousThickness([wl('#cc2222')], [G.matyUzyte(cabF, wl('#cc2222'))]);
  ok('N140: front z własnej płyty w innym kolorze własnym — oba z kodem koloru', G.matLabelOf(wl('#cc2222').board, 'board', amb3) === 'Płyta kolor #cc2222'
    && G.matLabelOf(wl('#cc2222').front, 'front', amb3) === 'Płyta kolor #c2a880', [...amb3].join(','));

  const run = (o = {}) => ({ id: 'c1', name: 'Ściana', wallW: null, gap: 0, mountY: 0, H: 720, D: 560, plinth: { on: false }, worktop: false, corner: null, ...o });
  const sz = (n, o = {}) => ({ name: n, W: 600, H: 720, D: 560, plinth: { on: false }, legs: { on: true, height: 100 }, levels: [{ h: null, cols: [drzwi({ shelfTargets: [null] })] }], ...o });
  const P2 = (a, b, r = run()) => G.loadProject({ name: 'P', runs: [r], items: [{ cab: a, runId: 'c1' }, { cab: b, runId: 'c1' }] });
  ok('N141: scalanie drzwi nakładanych z wpuszczanymi — zablokowane z powodem', /różny montaż frontów \(nakładane i wpuszczane\)/.test(G.scalenieBlad(P2(sz('A'), sz('B', { frontMode: 'inset' })), [0, 1]) || ''));
  ok('N141: kontrola — ten sam montaż scala się', G.scalenieBlad(P2(sz('A'), sz('B')), [0, 1]) === null);

  const blat = { top: { mode: 'blat', material: 'board', overFront: 30 } };
  let P = P2(sz('A', { ...blat }), sz('B', { ...blat, H: 900 }));
  const bl = G.projectParts(P).flatMap((g) => g.panels.filter((x) => /^Blat/.test(x.name)).map((x) => `${x.name} ${x.a}×${x.b}`));
  ok('N142: własne blaty H720 i H900 — dwa blaty szafek, bez „Blatu ciągu”, uwaga o wysokościach', G.runTop(P, P.runs[0]) == null && bl.length === 2 && bl.every((x) => /^Blat 600×590$/.test(x))
    && G.worktopMsgs(P, P.runs[0]).some((m) => /na różnych wysokościach \(720 i 900 mm\)/.test(m.text)), bl.join(', '));
  P = P2(sz('A', { ...blat }), sz('B', { ...blat }));
  ok('N142: kontrola — H720 i H720: jeden blat ciągu 1200', JSON.stringify((G.runTop(P, P.runs[0]) || {}).lens) === '[1200]');

  const R43 = (o) => ({ orient: 'vertical', pos: 'top', side: 'left', h: 400, depth: 100, atDepth: 230, fromBack: false, reducesDoor: false, ...o });
  const rura = (rails) => geo({ name: 'T', W: 600, H: 2000, D: 560, ...nogi, levels: [{ h: null, cols: [drzwi({ shelfTargets: [null], drazki: [0], rails })] }] });
  const m43 = uw(rura([R43()]), /przecina rurę na wieszaki/);
  ok('N143: pionowe wzmocnienie w drodze rury — błąd z „Usuń rurę”', m43.length === 1 && m43[0].level === 'error' && /\|drazek:0:0:0:0$/.test(m43[0].text));
  ok('N143: kontrola — wzmocnienie przy licu (poza rurą) i bez wzmocnień — bez uwagi', !uw(rura([R43({ atDepth: 0 })]), /przecina rurę/).length && !uw(rura([]), /przecina rurę/).length);

  const wsp = (sd, nl) => geo({ name: 'T', W: 600, H: 720, D: 560, ...nogi, levels: [{ h: null, cols: [{ kind: 'drawers', w: null,
    fix: { side: 'left', w: 100, mode: 'overlay', support: true, supportDepth: sd }, drawers: [{ h: null, system: 'dxs', nl }] }] }] });
  ok('N144: wspornik 400 przy NL 400 wybranym w szufladzie — bez błędu o NL 550', !uw(wsp(400, 400), /wspornik ma/).length);
  ok('N144: wspornik 300 przy NL 400 — błąd „daj minimum 400”', uw(wsp(300, 400), /wspornik ma 300 mm, a prowadnica NL 400/).length === 1);

  const tip = (o) => geo({ name: 'T', W: 600, H: 720, D: 560, ...nogi, handles: false, levels: [{ h: null, cols: [drzwi({ shelfTargets: [null], handles: [false], otwieranie: ['tipon'] })] }], ...o });
  ok('N145: tip-on w szafce D80 — błąd „wchodzi w plecy”', uw(tip({ D: 80, H: 300 }), /tip-on ma 89 mm długości w głąb, a do pleców jest 80 mm/).length === 1);
  ok('N145: tip-on bez dna, wieńca i półek — błąd „nie ma płyty do przykręcenia”', uw(tip({ joints: { topL: 'none', topR: 'none', botL: 'none', botR: 'none' } }), /tip-on nie ma płyty do przykręcenia/).length === 1);
  ok('N145: kontrola D560 — bez uwag o tip-on', !uw(tip({}), /tip-on/).length);
  // przyciski (retest N145): uchwyt zamiast tip-on i glebokosc o tyle, ile brakuje odbojnikowi
  const m145 = uw(tip({ D: 80, H: 300 }), /wchodzi w plecy/)[0];
  ok('N145: błąd ma przyciski „uchwyt:0:0:0” i „glebokosc:89”', !!m145 && /\|uchwyt:0:0:0\|glebokosc:89$/.test(m145.text), m145 && m145.text.split('|').slice(1).join(' | '));
  const tipU = geo({ name: 'T', W: 600, H: 300, D: 80, ...nogi, handles: false, levels: [{ h: null, cols: [drzwi({ shelfTargets: [null], handles: [true], otwieranie: [null] })] }] });
  ok('N145: po „Uchwyt zamiast tip-on” — bez błędu i bez tip-on w zamówieniu', !uw(tipU, /tip-on/).length && !G.okuciaSzafki(tipU, {}).some((h) => /SALTO|tip-on/i.test(h.name + ' ' + (h.spec || ''))));
  ok('N145: po „Głębokość szafki 89 mm” — bez błędu o plecach', !uw(tip({ D: 89, H: 300 }), /wchodzi w plecy/).length);

  const PL = { on: true, height: 100, mode: 'under', setback: 0 };
  const R = (id, o) => ({ id, name: id, wallW: null, gap: 0, mountY: 0, H: 720, D: 560, plinth: PL, worktop: true, corner: null, ...o });
  const cabH = (n, H, D = 560) => ({ name: n, W: 600, H, D, plinth: PL, levels: [{ h: null, cols: [drzwi({ shelfTargets: [null] })] }] });
  const P46 = (h1, h2) => G.loadProject({ name: 'P', items: [{ cab: cabH('A', h1), runId: 'd1' }, { cab: cabH('B', h2), runId: 'd2' }, { cab: cabH('GA', 900, 320), runId: 'g1' }, { cab: cabH('GB', 900, 320), runId: 'g2' }],
    runs: [R('d1', { H: h1 }), R('d2', { H: h2, corner: { of: 'd1', at: 'end', owner: 'self', clear: 0 } }),
      R('g1', { tier: 'gorny', wall: 'd1', clearance: 500, H: 900, D: 320, plinth: null }), R('g2', { tier: 'gorny', wall: 'd2', clearance: 500, H: 900, D: 320, plinth: null, corner: { of: 'g1', at: 'end', owner: 'self', clear: 0 } })] });
  let q = P46(720, 900); let g2 = q.runs.find((r) => r.id === 'g2');
  ok('N146: górne ciągi nad H720 i H900 (montaż auto) — bez złączy w rogu, uwaga o 180 mm', !(G.runTopZlacza(q, g2) || []).some((z) => /w rogu/.test(z.use))
    && G.worktopMsgs(q, g2).some((m) => /różnica 180 mm/.test(m.text)));
  q = P46(720, 720); g2 = q.runs.find((r) => r.id === 'g2');
  ok('N146: kontrola — równe dolne: złącza w rogu są', (G.runTopZlacza(q, g2) || []).some((z) => /w rogu/.test(z.use)));

  const nd = (v) => geo({ name: 'T', W: 600, H: 720, D: 560, ...nogi, levels: [{ h: null, cols: [{ kind: 'open', w: null, shelfTargets: [null, null], noDiv: v }, { kind: 'open', w: null, shelfTargets: [null, null] }] }] });
  ok('N147: przelot (noDiv) — bez wierceń w „Przegrodzie 1”, błąd o półkach w powietrzu', !nd(true).drillPlan.some((x) => /^Przegroda/.test(x.panel)) && uw(nd(true), /nie ma przegrody \(przelot\), a półki kończą się tam w powietrzu/).length === 1);
  ok('N147: kontrola — z przegrodą: wiercenia w niej, bez uwagi', nd(false).drillPlan.some((x) => x.panel === 'Przegroda 1') && !uw(nd(false), /przelot/).length);
  // przyciski (retest N147): przywroc przegrode albo jedna kolumna na cala szerokosc
  const m147 = uw(nd(true), /nie ma przegrody \(przelot\)/)[0];
  ok('N147: błąd ma przyciski „przelot:0:0:przegroda” i „przelot:0:0:jedna:564”', !!m147 && /\|przelot:0:0:przegroda\|przelot:0:0:jedna:564$/.test(m147.text), m147 && m147.text.split('|').slice(1).join(' | '));
  const jd = (cols, w) => geo({ name: 'T', W: 600, H: 720, D: 560, ...nogi, levels: [{ h: null, cols: G.kolumnaZPrzelotu(cols, 0, w) }] });
  const k147 = [drzwi({ w: null, shelfTargets: [null, null], noDiv: true, handles: [false] }), drzwi({ w: null, shelfTargets: [null, null], hinge: 'right' })];
  const g147 = jd(k147, 564);
  ok('N147: „Jedna kolumna” — jedna kolumna 564, dwoje drzwi, bez błędu o przelocie', g147.levels[0].cols.length === 1 && Math.round(g147.levels[0].cols[0].w) === 564
    && g147.doors.filter((d) => d.type === 'door').length === 2 && !uw(g147, /przelot/).length && !g147.msgs.some((x) => x.level === 'error'),
    g147.levels[0].cols.map((c) => Math.round(c.w)).join() + ' drzwi ' + g147.doors.length);
  const kp = G.kolumnaZPrzelotu(k147, 0, 564)[0];
  ok('N147: „Jedna kolumna” — uchwyty drzwi zostają (false, domyślny), bez noDiv, zawias auto', JSON.stringify(kp.handles) === '[false,true]' && kp.noDiv === undefined && kp.hinge === 'auto', JSON.stringify(kp.handles));
  const k3 = [{ kind: 'open', w: 200, shelfTargets: [null], noDiv: true }, { kind: 'open', w: null, shelfTargets: [null, null], drazki: [0] }, { kind: 'open', w: null, shelfTargets: [null] }];
  const p3 = G.kolumnaZPrzelotu(k3, 0, 380);
  ok('N147: „Jedna kolumna” przy innej kolumnie auto — szerokość z rysunku (380), półki i rura z prawej', p3.length === 2 && p3[0].w === 380 && p3[0].shelfTargets.length === 2 && JSON.stringify(p3[0].drazki) === '[0]');
  const p4 = G.kolumnaZPrzelotu([{ kind: 'open', w: 200, shelfTargets: [null], noDiv: true }, { kind: 'open', w: null }, { kind: 'open', w: 150 }], 0, 380);
  ok('N147: „Jedna kolumna”, reszta zadana — auto (weźmie dokładnie to, co obie)', p4[0].w === null);
  const gP = geo({ name: 'T', W: 600, H: 720, D: 560, ...nogi, levels: [{ h: null, cols: [{ kind: 'open', w: null, shelfTargets: [null, null] }, { kind: 'open', w: null, shelfTargets: [null, null] }] }] });
  ok('N147: po „Przywróć przegrodę” — bez błędu o przelocie', !uw(gP, /przelot/).length);

  const wis = (n, H) => ({ name: n, W: 600, H, D: 300, plinth: { on: false }, legs: { on: false }, hangerMode: 'listwa', levels: [{ h: null, cols: [drzwi({ shelfTargets: [null] })] }] });
  const rr = (h1, h2) => G.runRail(G.loadProject({ name: 'P', runs: [run({ mountY: 1500, D: 300, plinth: null, hangerMode: 'listwa' })], items: [{ cab: wis('A', h1), runId: 'c1' }, { cab: wis('B', h2), runId: 'c1' }] }), run({ mountY: 1500, D: 300, plinth: null, hangerMode: 'listwa' }));
  ok('N148: H720 i H900 — listwa w dwóch odcinkach (zawieszki 702 i 882)', JSON.stringify(rr(720, 900).odcinki.map((o) => [o.len, o.wys])) === '[[600,702],[600,882]]');
  ok('N148: kontrola H720 i H720 — jedna listwa 1200', JSON.stringify(rr(720, 720).odcinki.map((o) => o.len)) === '[1200]');

  const zw = (li, full, cu = {}) => geo({ name: 'T', W: 600, H: 1200, D: 560, ...nogi, hangers: 'always', cutout: { on: true, w: 100, d: 100, fullHeight: full, levelIndex: li, mask: true, ...cu },
    levels: [{ h: 591, cols: [{ kind: 'open', w: null, shelfTargets: [] }] }, { h: null, cols: [{ kind: 'open', w: null, shelfTargets: [] }] }] });
  const zaw = (g) => g.drillPlan.filter((p) => p.rows.some((r) => r.kind === 'zawieszka')).map((p) => p.panel);
  /* uzytkownik 2026-10-30 (retest N149): zawieszka nie moze wisiec w powietrzu — idzie na scianke
     zabudowy wyciecia, ktora dochodzi do sciany; bez zabudowy blad z przyciskiem, ktory ja wlacza */
  let g149 = zw(1, false);
  ok('N149: wycięcie w górnym poziomie z zabudową — zawieszka na ściance zabudowy, bez błędu', !uw(g149, /Zawieszka/).some((m) => m.level === 'error')
    && zaw(g149).some((p) => /^Poziom 2 — Zabudowa wycięcia \(lewy\) — ścianka boczna/.test(p)) && !zaw(g149).some((p) => /Bok lewy/.test(p)) && zaw(g149).some((p) => /Bok prawy/.test(p))
    && uw(g149, /Zawieszka przy lewym boku na ściance bocznej zabudowy wycięcia/).length === 1, zaw(g149).join(' / '));
  ok('N149: zamówienie — „jedna na ściance zabudowy przy narożniku”', G.okuciaSzafki(g149, {}).some((h) => /Zawieszka/.test(h.name) && h.qty === 2 && /jedna na ściance zabudowy przy narożniku/.test(h.spec)));
  g149 = zw(1, true);
  ok('N149: wycięcie na całą wysokość (bok skrócony, nie dochodzi do ściany) — też na ściance zabudowy', zaw(g149).some((p) => /Zabudowa wycięcia \(lewy\) — ścianka boczna/.test(p)) && !zaw(g149).some((p) => /Bok lewy/.test(p)), zaw(g149).join(' / '));
  const m149 = uw(zw(1, false, { mask: false }), /Zawieszka przy lewym boku wypada w wycięciu narożnika \(lewy, poziom 2\)/);
  ok('N149: bez zabudowy — błąd „zawisłaby w powietrzu” z przyciskiem „zabudowa:wyc:L”', m149.length === 1 && m149[0].level === 'error' && /zawisłaby w powietrzu/.test(m149[0].text) && /\|zabudowa:wyc:L$/.test(m149[0].text), m149[0] && m149[0].text);
  const k149 = uw(zw(1, false, { d: 20 }), /ścianka zabudowy ma tylko/);
  ok('N149: płytkie wycięcie (20) — błąd z „zabudowaglab:wyc:L:N”, po pogłębieniu do N bez błędu', k149.length === 1 && /\|zabudowaglab:wyc:L:\d+$/.test(k149[0].text)
    && !uw(zw(1, false, { d: Number(k149[0].text.split(':').pop()) }), /Zawieszka/).some((m) => m.level === 'error'), k149[0] && k149[0].text);
  ok('N149: kontrola — wycięcie w dolnym poziomie — zawieszki na bokach, bez uwagi', !uw(zw(0, false), /Zawieszka/).length && zaw(zw(0, false)).join() === 'Poziom 2 — Bok lewy,Poziom 2 — Bok prawy', zaw(zw(0, false)).join());
  // element w rogu (przy boku i z tylu, na cala wysokosc) — to samo co wyciecie
  const el = (mask) => geo({ name: 'T', W: 600, H: 720, D: 560, ...nogi, hangers: 'always', obstacles: [{ on: true, side: 'right', w: 120, d: 120, fromSide: 0, fromBack: 0, fullHeight: true, mask }],
    levels: [{ h: null, cols: [{ kind: 'open', w: null, shelfTargets: [] }] }] });
  const e149 = uw(el(false), /Zawieszka przy prawym boku wypada/);
  ok('N149: element w prawym rogu bez zabudowy — błąd z „zabudowa:el:0”', e149.length === 1 && /\|zabudowa:el:0$/.test(e149[0].text), e149[0] && e149[0].text);
  ok('N149: element w rogu z zabudową — zawieszka na jej ściance, bez błędu', !uw(el(true), /Zawieszka/).some((m) => m.level === 'error') && zaw(el(true)).some((p) => /^Zabudowa: Element kolizyjny — ścianka/.test(p)), zaw(el(true)).join(' / '));
}

console.log('\n== Rura: niska rura — przesunięcie półki w tym samym ostrzeżeniu (użytkownik 2026-10-29) ==');
{
  // jak Szafka 6 w projekcie uzytkownika: swiatla 250 / auto / 250, rura w srodkowym
  const rura = (st, o = {}, H = 1600) => ({ name: 'T', W: 600, H, D: 560, ...nogi, levels: [{ h: null, cols: [drzwi({ shelfTargets: st, drazki: [1], ...o })] }] });
  const akcje = (g) => (uw(g, /pod rurą tylko/)[0] || { text: '' }).text.split('|').slice(1);
  const zastosuj = (cab, a) => { const c = JSON.parse(JSON.stringify(cab)); const st = c.levels[0].cols[0].shelfTargets;
    a.split(':')[7].split(',').forEach((q) => { const [i, v] = q.split('=').map(Number); st[i] = v; }); return c; };
  const c1 = rura([250, null, 250]);
  const g1 = geo(c1), a1 = akcje(g1).filter((a) => a.startsWith('drazekpolka:'));
  const brak = 1070 - g1.levels[0].cols[0].openings[1].h;
  ok('ostrzeżenie z „przesunąć półkę o N mm” i dwoma przyciskami (wyżej / niżej)', a1.length === 2 && a1.some((a) => /:gora:/.test(a)) && a1.some((a) => /:dol:/.test(a))
    && uw(g1, new RegExp(`Wystarczy przesunąć półkę o ${brak} mm`)).length === 1, a1.join(' / '));
  ok('po kliknięciu (obie wersje): 1000 mm pod rurą, ostrzeżenie znika, bez nowych uwag o światłach', a1.every((a) => { const g = geo(zastosuj(c1, a));
    return g.levels[0].cols[0].drazki[0].pod >= 1000 && !uw(g, /pod rurą tylko|światło|zadane światła/).length; }), a1.join(' / '));
  // wszystkie swiatla automatyczne (4) — zmiana obu jawnie, reszta bez zmian
  const c2 = rura([null, null, null, null], {}, 2400), g2 = geo(c2), a2 = akcje(g2).filter((a) => a.startsWith('drazekpolka:'));
  const h2 = g2.levels[0].cols[0].openings.map((o) => o.h);
  ok('światła automatyczne: po kliknięciu rura ma 1000 mm, nieruszane światło bez zmian', a2.length && a2.every((a) => { const g = geo(zastosuj(c2, a));
    const h = g.levels[0].cols[0].openings.map((o) => o.h); const nb = +a.split(':')[5]; const inne = [0, 1, 2, 3].filter((i) => i !== 1 && i !== nb);
    return g.levels[0].cols[0].drazki[0].pod >= 1000 && inne.every((i) => Math.abs(h[i] - h2[i]) <= 1) && !uw(g, /zadane światła/).length; }), JSON.stringify(h2) + ' ' + a2.join(' / '));
  // sasiad za niski (60 − brak < 50), granica poziomu kolumny i rura w samym swietle — bez propozycji
  const a3 = akcje(geo(rura([80, null], {}, 1100))), a4 = akcje(geo(rura([null], { drazki: [0] }, 1000)));
  ok('kontrola: sąsiad za niski i światło od dna do wieńca — ostrzeżenie bez przycisku przesunięcia', a3.length && a4.length
    && ![...a3, ...a4].some((a) => a.startsWith('drazekpolka:')), [...a3, ...a4].join(' / '));
  const a5 = akcje(geo(rura([250, null, 250], { podzial: [0, 1] })));
  ok('kontrola: półka będąca granicą poziomu kolumny się nie przesuwa', a5.length && !a5.some((a) => a.startsWith('drazekpolka:')), a5.join(' / '));
}

console.log('\n== Scalanie „dwie przegrody” (użytkownik 2026-10-29) ==');
{
  const RUN = { id: 'c1', name: 'Ściana', wallW: null, gap: 0, mountY: 0, H: 720, D: 560, plinth: { on: false }, worktop: false, corner: null };
  const sz = (n, col, o = {}) => ({ name: n, W: 600, H: 720, D: 560, plinth: { on: false }, legs: { on: true, height: 100 }, levels: [{ h: null, cols: [col] }], ...o });
  const scal = (a, b, run = RUN, mat) => { const P = G.loadProject({ name: 'P', runs: [run], items: [{ cab: a, runId: 'c1', ...(mat ? { mat } : {}) }, { cab: b, runId: 'c1', ...(mat ? { mat } : {}) }] });
    const Q = G.scalSzafki(P, [0, 1], null, 'dwie'); const it = Q.items[Q.active]; return { Q, g: G.computeGeo(G.cabDoGeo(Q, it), it.mat) }; };
  const wk = (g) => g.drillPlan.flatMap((p) => p.rows.filter((r) => r.kind === 'wkręt łączący przegrody').map((r) => ({ panel: p.panel, ...r })));
  // A: drzwi z zawiasem przy styku i polka 200 od dolu; B: drzwi z zawiasem przy styku, bez polek
  const { g } = scal(sz('A', drzwi({ hinge: 'right', shelfTargets: [200, null] })), sz('B', drzwi({ hinge: 'left', shelfTargets: [null] })));
  ok('1200: kolumny 564 / 564, dwie przegrody obok siebie (582 i 600), fronty jak w osobnych szafkach', g.W === 1200 && g.levels[0].cols.map((c) => Math.round(c.w)).join() === '564,564'
    && g.dividers.map((d) => `${d.x}${d.para}`).join() === '582L,600P' && g.doors.map((d) => `${Math.round(d.x)}+${Math.round(d.w)}`).join() === '2+596,602+596',
    g.dividers.map((d) => `${d.x}${d.para}`).join() + ' ' + g.doors.map((d) => `${Math.round(d.x)}+${Math.round(d.w)}`).join());
  const w = wk(g);
  const opis = w.map((r) => `${r.panel} ${r.ys} ${r.note.split(';').slice(0, 2).join(';')}`).join(' / ');
  ok('4 wkręty: dolne nad kołkiem półki 200, w jej grubości (209; 70 mm od przodu i tyłu), górny przedni 20 mm nad zawiasem w jego osi (40), górny tylny 100 pod górą (50)',
    w.length === 4 && w.filter((r) => String(r.ys) === '209' && /^70 mm/.test(r.note) && /w grubości półki/.test(r.note)).length === 2
    && w.some((r) => /^40 mm od przedniej/.test(r.note) && /20 mm nad górnym zawiasem/.test(r.note))
    && w.some((r) => /^50 mm od tylnej/.test(r.note) && /100 mm pod górą/.test(r.note)), opis);
  ok('zamówienie: 4 × „Wkręt 4 × 30” (dwie przegrody na styku 1×4)', G.okuciaSzafki(g, {}).some((h) => h.name === 'Wkręt 4 × 30' && h.qty >= 4 && /dwie przegrody na styku 1×4/.test(h.spec)));
  ok('obie płyty pary osobno w planie wierceń (zawiasy każdej strony na swojej)', g.drillPlan.some((p) => p.panel === 'Przegroda 1 — lewa' && p.rows.some((r) => r.kind === 'zawias'))
    && g.drillPlan.some((p) => p.panel === 'Przegroda 1 — prawa' && p.rows.some((r) => r.kind === 'zawias')));
  // bez polek i zawiasow przy styku — 100 mm od dolu / gory, 50 od krawedzi
  const g2 = scal(sz('A', drzwi({ hinge: 'left', shelfTargets: [null] })), sz('B', drzwi({ hinge: 'right', shelfTargets: [null] }))).g;
  ok('bez półki i zawiasu przy styku: 4 wkręty 100 mm od dołu / góry, 50 mm od krawędzi', wk(g2).length === 4 && wk(g2).every((r) => /^50 mm/.test(r.note) && /100 mm/.test(r.note)), wk(g2).map((r) => r.ys + ' ' + r.note.slice(0, 40)).join(' / '));
  // plyta 16 mm — 4 × 30 wyszedlby z drugiej plyty (32 mm), wiec 4 × 25 osobna pozycja
  const M16 = JSON.parse(JSON.stringify(G.defaultMaterials)); M16.board.thickness = 16;
  const g3 = scal(sz('A', drzwi({ shelfTargets: [null] })), sz('B', drzwi({ shelfTargets: [null] })), RUN, M16).g;
  ok('płyta 16: wkręt 4 × 25 (osobna pozycja), w planie „4 × 25”', G.okuciaSzafki(g3, {}).some((h) => h.name === 'Wkręt 4 × 25' && h.qty === 4) && wk(g3).every((r) => /4 × 25/.test(r.note)),
    G.okuciaSzafki(g3, {}).filter((h) => /Wkręt/.test(h.name)).map((h) => h.name + ' ' + h.qty).join(', '));
  // przy lacznej szczelinie miedzy korpusami (luz ciagu 2 mm) — luz idzie na kolumny, przegrody dalej obok siebie
  const g4 = scal(sz('A', drzwi({ shelfTargets: [null] })), sz('B', drzwi({ shelfTargets: [null] })), { ...RUN, gap: 2 }).g;
  ok('luz ciągu 2 mm: szafka 1202, kolumny 565 / 565, bez błędów', g4.W === 1202 && g4.levels[0].cols.map((c) => Math.round(c.w)).join() === '565,565' && !g4.msgs.some((x) => x.level === 'error'),
    g4.W + ' ' + g4.levels[0].cols.map((c) => Math.round(c.w)).join());
}

console.log('\n== N150–N156 (audyt GPT 2026-10-30) ==');
{
  const M = G.defaultMaterials;
  // N150: jedna wlasna resztka blatu 1000 × 1000 — nie moze isc do dwoch grup (arkusz 600 i 1200)
  const lab = G.matLabelOf(M.worktop, 'worktop', G.ambiguousThickness([M]));
  const id = G.tozsamoscPlyty(M.worktop);
  const rows = [[1000, 300], [1000, 700]].map(([a, b]) => ({ name: 'Blat', qty: 1, a, b, matId: id, matLabel: lab, ...G.wierszBlatu({ a, b, matKey: 'worktop' }, M, lab) }));
  const plan = (qty) => G.buildCutPlan(rows, [{ id: 'r1', matId: id, matLabel: lab, w: 1000, h: 1000, qty }]);
  const p1 = plan(1);
  ok('N150: jedna resztka 1000 × 1000 — tylko w jednej grupie, druga kupuje arkusz', p1.length === 2 && p1.filter((g) => g.zWlasnych).length === 1 && p1.reduce((a, g) => a + g.kupic, 0) === 1,
    p1.map((g) => `${g.arkusz.w}×${g.arkusz.h}: własne ${g.zWlasnych}, kupić ${g.kupic}`).join(' / '));
  const p2 = plan(2);
  ok('N150: dwie takie resztki — obie grupy z resztek, zakup 0', p2.every((g) => g.zWlasnych === 1 && g.kupic === 0), p2.map((g) => `${g.zWlasnych}/${g.kupic}`).join(' '));

  // N151: wysoka szafka z wlasnym blatem w ciagu z blatem roboczym — jej blat zostaje
  const run = (o = {}) => ({ id: 'c1', name: 'Ściana', wallW: null, gap: 0, mountY: 0, H: 720, D: 560, plinth: { on: false }, worktop: true, corner: null, ...o });
  const blat = { top: { mode: 'blat', material: 'board', overFront: 30 } };
  const sz = (n, o = {}) => ({ name: n, W: 600, H: 720, D: 560, plinth: { on: false }, legs: { on: true, height: 100 }, levels: [{ h: null, cols: [drzwi({ shelfTargets: [null] })] }], ...o });
  let P = G.loadProject({ name: 'P', runs: [run()], items: [{ cab: sz('A', blat), runId: 'c1' }, { cab: sz('B', { ...blat, H: 2000 }), runId: 'c1' }] });
  const bl = (Q) => G.projectParts(Q).flatMap((g) => g.panels.filter((x) => /^Blat/.test(x.name)).map((x) => `${g.name}: ${x.name} ${x.a}×${x.b}`));
  ok('N151: blat ciągu nad A, słupek B zostaje ze swoim blatem 600 × 590', (G.runTop(P, P.runs[0]).pokryte || []).join() === '0' && bl(P).some((x) => /^B: Blat 600×590$/.test(x)) && !bl(P).some((x) => /^A: /.test(x)), bl(P).join(' / '));

  // N154: wspolne dno — ta sama nazwa i kolor, rozny dekor
  const runD = { id: 'c1', name: 'Ściana', wallW: null, gap: 20, mountY: 0, H: 720, D: 500, plinth: { on: true, height: 100, mode: 'under', setback: 0 }, worktop: false, corner: null, wspolneDno: true };
  const dek = (d) => ({ ...M, board: { ...M.board, name: 'Płyta', color: '#d8c3a0', decor: d } });
  const mk = (d1, d2) => {
    const Q = G.loadProject({ name: 'P', runs: [runD], items: [d1, d2].map((d, k) => ({ cab: { name: 'S' + k, W: 600, H: 720, D: 500, plinth: runD.plinth, levels: [{ h: null, cols: [drzwi()] }] }, runId: 'c1', mat: dek(d) })) });
    const h = G.wysokoscWienca(Q.items, Q.runs[0]);
    Q.items = Q.items.map((x) => ({ ...x, cab: G.wedlugCiagu(x.cab, x.mat, Q.runs[0], h) }));
    return Q;
  };
  const rbx = G.runBottom(mk('Oak', 'Ash'), runD);
  ok('N154: dekor Oak i Ash — bez wspólnego dna („różnych płyt”), każda szafka ze swoim dnem', rbx && rbx.brak && /różnych płyt/.test(rbx.powod)
    && G.projectParts(mk('Oak', 'Ash')).flatMap((g) => g.panels.filter((p) => /^Dno/.test(p.name))).length === 2, rbx && rbx.powod);
  ok('N154: kontrola — ten sam dekor: wspólne dno 1220', JSON.stringify((G.runBottom(mk('Oak', 'Oak'), runD) || {}).lens) === '[1220]');

  // N155: model tip-on zostaje w zbiorczej liscie
  const gT = G.computeGeo(G.migrateCab({ name: 'T', W: 600, H: 720, D: 560, plinth: { on: false }, legs: { on: true, height: 100 }, handles: false, levels: [{ h: null, cols: [drzwi({ shelfTargets: [null], handles: [false], otwieranie: ['tipon'] })] }] }, M), M);
  const tip = G.scalOkucia([...gT.hardware, ...gT.hardware]).find((h) => /tip-on/.test(h.name));
  ok('N155: zbiorcza lista — tip-on z modelem AM-SVN-DL-MG-30, 2 szt.', !!tip && /AM-SVN-DL-MG-30/.test(tip.spec) && tip.qty === 2, tip && tip.spec);

  // N156: drugie scalanie z „dwie przegrody” — podwojna przegroda z pierwszego zostaje
  const P3 = G.loadProject({ name: 'P', runs: [run({ worktop: false })], items: ['A', 'B', 'C'].map((n) => ({ cab: sz(n), runId: 'c1' })) });
  let Q = G.scalSzafki(P3, [0, 1], null, 'dwie');
  Q = G.scalSzafki(Q, [Q.active, Q.items.length - 1], null, 'dwie');
  const it = Q.items[Q.active];
  const gS = G.computeGeo(G.cabDoGeo(Q, it), it.mat);
  const prz = gS.panels.filter((p) => /^Przegroda/.test(p.name)).reduce((a, p) => a + p.qty, 0);
  ok('N156: A + B, potem + C, oba razy „dwie przegrody” — 4 przegrody, szafka 1800, kolumny 564 × 3', prz === 4 && gS.W === 1800 && gS.levels[0].cols.map((c) => Math.round(c.w)).join() === '564,564,564',
    `${prz} przegród, W ${gS.W}, ${gS.levels[0].cols.map((c) => Math.round(c.w)).join()}`);

  // N152: rozne plecy — kreator pokazuje roznice, plecy z wybranej szafki
  const P4 = G.loadProject({ name: 'P', runs: [run({ worktop: false })], items: [{ cab: sz('A', { back: 'none' }), runId: 'c1' }, { cab: sz('B', { back: 'hdf' }), runId: 'c1' }] });
  const rz = G.roznePlyty(P4, [0, 1]).find((r) => r.k === 'back');
  ok('N152: A bez pleców, B HDF — w kreatorze różnica „plecy”', !!rz && rz.plyty[0] === 'bez pleców' && rz.plyty[1] === 'HDF 3 mm', rz && rz.plyty.join(' | '));
  const plecy = (wzor) => { const R = G.scalSzafki(P4, [0, 1], wzor); const x = R.items[R.active]; return G.computeGeo(G.cabDoGeo(R, x), x.mat).panels.filter((p) => /^Plecy/.test(p.name)).map((p) => `${p.a}×${p.b}`); };
  ok('N152: „płyty jak w B” — scalona ma plecy HDF; „jak w A” — bez pleców', plecy(1).length === 1 && plecy(0).length === 0, `B: ${plecy(1).join()} / A: ${plecy(0).join()}`);
}

console.log('\n== N153: rura dłuższa niż 3 m / ugięcie od 2 m (decyzja użytkownika 2026-10-30) ==');
{
  const szafa = (W, cols) => ({ name: 'S', W, H: 2000, D: 560, plinth: { on: false }, legs: { on: true, height: 100 }, levels: [{ h: null, cols }] });
  const kol = (o = {}) => drzwi({ doors: 2, shelfTargets: [400, null], drazki: [1], ...o });
  const g31 = geo(szafa(3100, [kol()]));
  const m31 = uw(g31, /rura ma 3062 mm/);
  ok('3100: rura 3062 — błąd „dłuższa niż … 3 m” z „podzielkol:0:0:3064:18”', m31.length === 1 && m31[0].level === 'error' && /\|podzielkol:0:0:3064:18\|/.test(m31[0].text), m31[0] && m31[0].text.split('|').slice(1).join(' | '));
  const cols = G.kolumnaNaDwie(szafa(3100, [kol()]).levels[0].cols, 0, 3064, 18);
  const gP = geo(szafa(3100, cols));
  ok('po „Podziel kolumnę przegrodą”: dwie kolumny po 1523, po jednych drzwiach, rury 1521, bez uwag o długości rury', cols.length === 2 && gP.levels[0].cols.map((c) => Math.round(c.w)).join() === '1523,1523'
    && cols.every((c) => c.doors === 1) && gP.levels[0].cols.every((c) => c.drazki.length === 1 && c.drazki[0].len === 1521) && !uw(gP, /rura ma/).length,
    gP.levels[0].cols.map((c) => `${Math.round(c.w)}:${c.drazki.map((d) => d.len)}`).join(' '));
  const m21 = uw(geo(szafa(2100, [kol()])), /rura ma 2062 mm/);
  ok('2100: rura 2062 — ostrzeżenie o uginaniu z „Podziel kolumnę przegrodą”', m21.length === 1 && m21[0].level === 'warn' && /ugina się/.test(m21[0].text) && /\|podzielkol:0:0:/.test(m21[0].text));
  ok('kontrola 2000: rura 1962 — bez uwagi o długości', !uw(geo(szafa(2000, [kol()])), /rura ma/).length);
}

console.log('\n== N148 (wariant): szafka wisząca z dala od ściany (decyzja użytkownika 2026-10-30) ==');
{
  const RUN = { id: 'c1', name: 'Górne', wallW: null, gap: 0, mountY: 1500, H: 720, D: 300, plinth: null, worktop: false, corner: null, hangerMode: 'listwa' };
  const wis = (n, o = {}) => ({ name: n, W: 600, H: 720, D: 300, plinth: { on: false }, legs: { on: false }, hangerMode: 'listwa', levels: [{ h: null, cols: [drzwi({ shelfTargets: [null] })] }], ...o });
  const P = (items) => G.loadProject({ name: 'P', runs: [RUN], items: items.map(([cab, offset = 0]) => ({ cab, runId: 'c1', offset })) });
  let Q = P([[wis('A')], [wis('B'), 100]]);
  let m = G.odScianyMsgs(Q, 1);
  ok('B wysunięta o 100 — błąd „wisi 100 mm od ściany” z „dosciany:1:0” i „dystans:1:100”', m.length === 1 && m[0].level === 'error' && /wisi 100 mm od ściany \(wysunięta z lica o 100 mm\)/.test(m[0].text)
    && /\|dosciany:1:0\|dystans:1:100$/.test(m[0].text), m[0] && m[0].text);
  ok('kontrola: A przy ścianie — bez uwagi', !G.odScianyMsgs(Q, 0).length);
  Q = P([[wis('A')], [wis('B', { D: 250 })]]);
  m = G.odScianyMsgs(Q, 1);
  ok('B płytsza (250 przy 300) — błąd z „płytsza od ciągu o 50 mm” i „dosciany:1:-50”', m.length === 1 && /płytsza od ciągu o 50 mm/.test(m[0].text) && /\|dosciany:1:-50\|dystans:1:50$/.test(m[0].text), m[0] && m[0].text);
  // po „Do ściany” (wysuniecie −50) — bez bledu; po „na dystansie 50” — informacja, dystans w zamowieniu
  ok('po „Do ściany”: bez uwagi', !G.odScianyMsgs(P([[wis('A')], [wis('B', { D: 250 }), -50]]), 1).length);
  const Qd = P([[wis('A')], [wis('B', { D: 250, dystans: 50 })]]);
  m = G.odScianyMsgs(Qd, 1);
  const hwB = G.computeGeo(G.cabDoGeo(Qd, Qd.items[1]), Qd.items[1].mat).hardware;
  // dystans 50 — nie 18 / 36, wiec kantowka 50 × 60 (uzytkownik 2026-10-31)
  ok('po „Listwa na dystansie 50 mm”: informacja, w zamówieniu kantówka dystansowa 50 × 60 mm na 600', m.length === 1 && m[0].level === 'info' && /listwa montażowa na kantówce dystansowej 50 × 60 mm \(w zamówieniu\)/.test(m[0].text)
    && hwB.some((h) => h.name === 'Kantówka dystansowa' && h.wariant === '50 × 60 mm' && h.qty === 0.6), m[0] && m[0].text);
  const rr = G.runRail(Qd, Qd.runs[0]);
  ok('listwa ciągu w dwóch odcinkach (B na dystansie)', rr && rr.odcinki.length === 2 && rr.odcinki[1].dyst === 50, rr && JSON.stringify(rr.odcinki));
  ok('dystans przy szafce dosuniętej do ściany — ostrzeżenie „niepotrzebny” z „dystans:1:0”', /\|dystans:1:0$/.test((G.odScianyMsgs(P([[wis('A')], [wis('B', { dystans: 40 })]]), 1)[0] || {}).text || ''));
}

console.log('\n== N149: mocowanie ścianki zabudowy z zawieszką (decyzja użytkownika 2026-10-30) ==');
{
  const zw = (cu = {}) => geo({ name: 'T', W: 600, H: 1200, D: 560, ...nogi, hangers: 'always', cutout: { on: true, w: 100, d: 100, fullHeight: false, levelIndex: 1, mask: true, ...cu },
    levels: [{ h: 591, cols: [{ kind: 'open', w: null, shelfTargets: [] }] }, { h: null, cols: [{ kind: 'open', w: null, shelfTargets: [] }] }] });
  const m0 = uw(zw(), /na ściance bocznej zabudowy wycięcia/)[0];
  ok('bez wyboru: informacja z „zawmoc:wyc:L:konfirmaty” i „zawmoc:wyc:L:trojkaty”', !!m0 && m0.level === 'info' && /2 konfirmaty przez wieniec albo 2 trójkąty/.test(m0.text)
    && /\|zawmoc:wyc:L:konfirmaty\|zawmoc:wyc:L:trojkaty$/.test(m0.text), m0 && m0.text.split('|').slice(1).join(' | '));
  const gK = zw({ zawMocowanie: 'konfirmaty' });
  const wien = gK.drillPlan.find((p) => /Wieniec$/.test(p.panel));
  const kon = G.okuciaSzafki(gK, {}).find((h) => h.name === 'Konfirmat 7 × 50');
  const kon0 = G.okuciaSzafki(zw(), {}).find((h) => h.name === 'Konfirmat 7 × 50');
  ok('„2 konfirmaty”: wiersz w planie wieńca (x 91 od wewnętrznej strony lewego boku, 33 i 67 mm od tyłu), +2 konfirmaty w zamówieniu, informacja z drugą opcją', !!wien && wien.rows.some((r) => r.kind === 'konfirmat — ścianka zabudowy' && r.ys.join() === '91' && /33 i 67 mm od tylnej/.test(r.note))
    && kon.qty === kon0.qty + 2 && /ścianka zabudowy z zawieszką do wieńca 2/.test(kon.spec)
    && /złączona z wieńcem 2 konfirmatami.*\|zawmoc:wyc:L:trojkaty$/.test(uw(gK, /na ściance bocznej zabudowy/)[0].text),
    wien && JSON.stringify(wien.rows.filter((r) => /ścianka/.test(r.kind))));
  const gT = zw({ zawMocowanie: 'trojkaty' });
  ok('„2 trójkąty”: wiersz na ściance zabudowy, 2 trójkąty w zamówieniu', gT.drillPlan.some((p) => /Zabudowa wycięcia/.test(p.panel) && p.rows.some((r) => r.kind === 'trójkąt meblowy — wieniec'))
    && G.okuciaSzafki(gT, {}).some((h) => h.name === 'Trójkąt meblarski' && h.qty === 2 && /ścianka zabudowy/.test(h.spec + ' ' + (h.use || ''))));
}

console.log('\n== N157–N169 (audyt GPT 2026-10-30, druga seria) ==');
{
  const szafa = (W, cols, o = {}) => ({ name: 'S', W, H: 2000, D: 560, plinth: { on: false }, legs: { on: true, height: 100 }, levels: [{ h: null, cols }], ...o });
  const kol = (o = {}) => drzwi({ doors: 2, shelfTargets: [400, null], drazki: [1], ...o });
  // N158: kolumna bez drzwi zostaje bez drzwi
  let cols = G.kolumnaNaDwie([kol({ doors: 0 })], 0, 2064, 18);
  ok('N158: podział kolumny bez drzwi — obie bez drzwi', cols.length === 2 && cols.every((c) => c.doors === 0), cols.map((c) => c.doors).join());
  // N159: wpisana szerokosc drzwi idzie na auto
  cols = G.kolumnaNaDwie([kol({ doorWidths: [600, null] })], 0, 2064, 18);
  let g = geo(szafa(2100, cols));
  ok('N159: drzwi 600 + auto — po podziale bez wpisanych szerokości, bez błędu „nie wypełniają pasma”', cols.every((c) => !c.doorWidths) && !uw(g, /nie wypełniają pasma/).length, uw(g, /pasma/).map((x) => x.text).join(' / '));
  // N164: fix lewy zostaje tylko w lewej kolumnie (z nim wspornik)
  cols = G.kolumnaNaDwie([kol({ fix: { side: 'left', w: 100, mode: 'overlay', support: true } })], 0, 2064, 18);
  g = geo(szafa(2100, cols));
  const fixy = g.panels.filter((p) => /stały|Element stały|Fix/i.test(p.name)).reduce((a, p) => a + p.qty, 0);
  ok('N164: fix lewy — w lewej kolumnie tak, w prawej nie; jeden element stały w formatkach', !!cols[0].fix && !cols[1].fix && fixy === 1, `${JSON.stringify(cols.map((c) => c.fix && c.fix.side))}, formatki ${fixy}`);
  // N165: para — lewe skrzydlo na lewym boku, prawe na prawym
  cols = G.kolumnaNaDwie([kol()], 0, 2064, 18);
  g = geo(szafa(2100, cols));
  ok('N165: para auto — po podziale zawiasy lewej kolumny z lewej, prawej z prawej', g.doors.map((d) => d.hingeSide).join() === 'left,right', g.doors.map((d) => d.hingeSide).join());
  cols = G.kolumnaNaDwie([kol({ doors: 1 })], 0, 2064, 18);
  ok('N165: jedne drzwi auto — lewa „auto”, prawa z prawej (jak para)', geo(szafa(2100, cols)).doors.map((d) => d.hingeSide).join() === 'left,right');
  // N153 (retest): reczna 2065 przy 2101 — 1023 + 1024, bez przekroczenia o 1 mm
  cols = G.kolumnaNaDwie([kol({ w: 2065 })], 0, 2065, 18);
  g = geo(szafa(2101, cols));
  ok('N153: kolumna 2065 (nieparzysta reszta) — 1023 i 1024, bez błędu szerokości', cols.map((c) => c.w).join() === '1023,1024' && !uw(g, /przekracza|za szerok|o 1 mm/).length, cols.map((c) => c.w).join() + ' ' + uw(g, /szerok/).map((x) => x.text).join(' / '));
  // N157: przelot — wybor wnetrza prawej
  const a = { kind: 'open', w: null, noDiv: true, shelfTargets: [300, null] }, b = { kind: 'open', w: null, shelfTargets: [200, 200, null] };
  const msg = uw(geo(szafa(600, [a, b], { H: 1200 })), /nie ma przegrody \(przelot\)/)[0];
  ok('N157: obie kolumny z półkami — dwa przyciski „wnętrze lewej (1 półka)” / „prawej (2 półki)”', !!msg && /\|przelot:0:0:jedna:\d+:L:1 półka\|przelot:0:0:jedna:\d+:P:2 półki$/.test(msg.text), msg && msg.text.split('|').slice(1).join(' | '));
  const jP = G.kolumnaZPrzelotu([a, b], 0, 564, 'P'), jL = G.kolumnaZPrzelotu([a, b], 0, 564, 'L');
  ok('N157: „prawej” — półki prawej (200, 200), „lewej” — lewej (300)', jP.length === 1 && JSON.stringify(jP[0].shelfTargets) === '[200,200,null]' && JSON.stringify(jL[0].shelfTargets) === '[300,null]');
  // N169: 198 recznie + 2 auto przy luzie 2 — tylko przycisk, ktory daje identyczne
  const trzy = (o) => geo({ name: 'T', W: 600, H: 720, D: 560, ...nogi, levels: [{ h: null, cols: [drzwi({ doors: 3, ...o })] }] });
  const m169 = uw(trzy({ doorWidths: [198, null, null] }), /drzwi różnią się/)[0];
  ok('N169: drzwi 198 + 2 auto — „wpisana ręcznie”, przycisk „rowno:0:0:4:d:1” (bez zwiększania luzu, który tylko pogłębia różnicę)', !!m169 && /szerokość 198 mm jest wpisana ręcznie/.test(m169.text)
    && /\|rowno:0:0:4:d:1$/.test(m169.text) && !/fixgap/.test(m169.text), m169 && m169.text);
  const po = trzy({ gapBetween: 4 });
  ok('N169: po kliknięciu (auto, luz 4) — 196 × 3, bez ostrzeżenia', po.levels[0].cols[0].doorWs.map(Math.round).join() === '196,196,196' && !uw(po, /różnią się/).length, po.levels[0].cols[0].doorWs.join());
  const szuf = (o) => geo({ name: 'T', W: 600, H: 720, D: 560, ...nogi, levels: [{ h: null, cols: [{ kind: 'drawers', w: null, drawers: [{ h: 'auto', front: 238 }, { h: 'auto' }, { h: 'auto' }], ...o }] }] });
  const s169 = uw(szuf(), /fronty szuflad różnią się/)[0];
  ok('N169: szuflady 238 + 2 auto — „Wszystkie fronty równo, luz 3 mm” (rowno:…:3:s:1)', !!s169 && /wysokość 238 mm jest wpisana ręcznie/.test(s169.text) && /\|rowno:0:0:3:s:1$/.test(s169.text), s169 && s169.text);
  // N166 / N167: para pod blat z miejscem w glab i regula narozna
  const plytka = geo({ name: 'T', W: 600, H: 300, D: 80, ...nogi, joints: { topL: 'none', topR: 'none' }, levels: [{ h: null, cols: [drzwi()] }] });
  const p166 = uw(plytka, /nie ma wieńca ani wzmocnienia/)[0];
  ok('N166: D80 — przycisk „parablat:0:0:62:0” (płaskie 62 mm, nie 100)', !!p166 && /\|parablat:0:0:62:0$/.test(p166.text), p166 && p166.text.split('|').slice(1).join());
  // para z przycisku (railPair z tym miejscem) — bez bledu „poza korpus”
  const zPara = geo({ name: 'T', W: 600, H: 300, D: 80, ...nogi, joints: { topL: 'none', topR: 'none' }, levels: [{ h: null, cols: [drzwi({ rails: [
    { orient: 'shelf', pos: 'top', depth: 62, atDepth: 0, fromBack: false, paraPodBlat: true, side: 'left', h: 100 },
    { orient: 'front', pos: 'top', h: 100, atDepth: 0, fromBack: true, paraPodBlat: true, side: 'left', depth: 100 }] })] }] });
  ok('N166: po kliknięciu — bez błędu „poza korpus” i bez „nie ma wieńca”', !uw(zPara, /poza korpus|nie ma wieńca ani wzmocnienia/).length, uw(zPara, /poza korpus|wieńca/).map((x) => x.text).join(' / '));
  const zly = geo({ name: 'T', W: 600, H: 300, D: 80, ...nogi, joints: { topL: 'none', topR: 'none' }, levels: [{ h: null, cols: [drzwi({ rails: [
    { orient: 'shelf', pos: 'top', depth: 100, atDepth: 0, fromBack: false, side: 'left', h: 100 }] })] }] });
  const e166 = uw(zly, /wychodzi o 20 mm poza korpus/)[0];
  ok('N166: płaskie 100 w D80 — błąd z przyciskiem „wzmgleb:0:0:0:depth:80”', !!e166 && /\|wzmgleb:0:0:0:depth:80$/.test(e166.text), e166 && e166.text);
  const rog = geo({ name: 'L', W: 1000, H: 720, D: 560, ...nogi, joints: { topL: 'none', topR: 'none' }, corner: { on: true, arm: 400, doors: 'wsporniki' }, levels: [{ h: null, cols: [drzwi()] }] });
  const p167 = uw(rog, /nie ma wieńca ani wzmocnienia/)[0];
  ok('N167: szafka narożna — przycisk z cofnięciem o front (…:18), jak „Dołóż parę wzmocnień”', !!p167 && /\|parablat:0:0:\d+:18$/.test(p167.text), p167 && p167.text.split('|').slice(1).join());
  // N145: tip-on bez plyty — uchwyt albo polka
  const tip = (o = {}) => geo({ name: 'T', W: 600, H: 300, D: 300, ...nogi, joints: { topL: 'none', topR: 'none', botL: 'none', botR: 'none' },
    levels: [{ h: null, cols: [drzwi({ handles: [false], otwieranie: ['tipon'], ...o })] }] });
  const t145 = uw(tip(), /tip-on nie ma płyty do przykręcenia/)[0];
  ok('N145: tip-on bez płyty — „uchwyt:0:0:0” i „polkatipon:0:0”', !!t145 && /\|uchwyt:0:0:0\|polkatipon:0:0$/.test(t145.text), t145 && t145.text.split('|').slice(1).join());
  ok('N145: po „Dołóż półkę” — tip-on ma płytę (bez błędu)', !uw(tip({ shelfTargets: [null, null] }), /tip-on nie ma płyty/).length);
  // N161: scianka zabudowy z zawieszka bez wienca
  const zw = (o = {}, cu = {}) => geo({ name: 'T', W: 600, H: 1200, D: 560, ...nogi, hangers: 'always', ...o, cutout: { on: true, w: 100, d: 100, fullHeight: false, levelIndex: 1, mask: true, ...cu },
    levels: [{ h: 591, cols: [{ kind: 'open', w: null, shelfTargets: [] }] }, { h: null, cols: [{ kind: 'open', w: null, shelfTargets: [] }] }] });
  const bez = zw({ joints: { topL: 'none', topR: 'none' } }, { zawMocowanie: 'trojkaty' });
  const w161 = uw(bez, /na ściance bocznej zabudowy wycięcia/)[0];
  ok('N161: bez wieńca — ostrzeżenie z „Dodaj wieniec”, bez „złączona z wieńcem”, bez trójkątów w planie i zamówieniu', !!w161 && w161.level === 'warn' && /\|dodajwieniec$/.test(w161.text) && !/złączona/.test(w161.text)
    && !bez.drillPlan.some((p) => p.rows.some((r) => /trójkąt meblowy/.test(r.kind))) && !G.okuciaSzafki(bez, {}).some((h) => h.name === 'Trójkąt meblarski'), w161 && w161.text);
  // N162: wyciecie 100 × 100 w elemencie 200 × 150 (ten sam rog, cala wysokosc)
  const el = (cu = {}) => geo({ name: 'T', W: 600, H: 1200, D: 560, ...nogi, hangers: 'always', cutout: { on: true, w: 100, d: 100, fullHeight: true, mask: true, ...cu },
    obstacles: [{ on: true, w: 200, d: 150, side: 'left', fromSide: 0, fromBack: 0, fullHeight: true, mask: true }],
    levels: [{ h: null, cols: [{ kind: 'open', w: null, shelfTargets: [] }] }] });
  const g162 = el();
  const e162 = uw(g162, /leży w całości w elemencie/)[0];
  ok('N162: zabudowa wycięcia w środku elementu — błąd z „bezzabudowy:wyc:L”', !!e162 && e162.level === 'error' && /\|bezzabudowy:wyc:L$/.test(e162.text), e162 && e162.text);
  ok('N162: zawieszka na ściance zabudowy elementu, nie wycięcia', g162.zawieszki.naZabudowie.length === 1 && !/wycięcia/.test(g162.zawieszki.naZabudowie[0]), JSON.stringify(g162.zawieszki.naZabudowie));
  const g162b = el({ mask: false });
  ok('N162: po „Bez zabudowy wycięcia” — bez błędu i bez ostrzeżenia o odsłoniętym otworze', !uw(g162b, /leży w całości|Wycięcie narożnika \(.*\) nie ma zabudowy/).length);
  ok('N162: kontrola — samo wycięcie bez zabudowy dalej ostrzega', uw(geo({ name: 'T', W: 600, H: 720, D: 560, ...nogi, cutout: { on: true, w: 100, d: 100, fullHeight: true, mask: false }, levels: [{ h: null, cols: [{ kind: 'open', w: null, shelfTargets: [] }] }] }), /nie ma zabudowy — otwór/).length === 1);
  // N160 / N163: zbiorcze zamowienie
  const lista = G.scalOkucia([
    { name: 'Listwa dystansowa pod listwę montażową', use: 'szafka wisząca z dala od ściany', wariant: 'grubość 50 mm', spec: 'x', qty: 0.6, unit: 'mb' },
    { name: 'Listwa dystansowa pod listwę montażową', use: 'szafka wisząca z dala od ściany', wariant: 'grubość 100 mm', spec: 'y', qty: 0.6, unit: 'mb' }]);
  ok('N160: dystans 50 i 100 mm — dwa wiersze z grubością', lista.length === 2 && lista.every((h) => /^grubość \d+ mm — /.test(h.spec)), lista.map((h) => h.spec).join(' / '));
  const wis = () => geo({ name: 'W', W: 600, H: 720, D: 300, ...nogi, levels: [{ h: null, cols: [drzwi()] }] });
  const hw = [wis(), wis(), wis()].flatMap((x) => G.okuciaSzafki(x, {}));
  const w163 = G.scalOkucia(hw).find((h) => h.name === 'Wkręt 4 × 30');
  ok('N163: trzy wiszące bez wzmocnień — w projekcie „zawieszki, 2 na zawieszkę”, nie „wzmocnienia i kątownik”', !!w163 && /zawieszki, 2 na zawieszkę/.test(w163.spec) && !/wzmocnienia/.test(w163.spec), w163 && `${w163.qty}: ${w163.spec}`);
}

console.log('\n== N168: zaślepki konfirmatów ramienia szafki w L ==');
{
  const PL = { on: true, height: 100, mode: 'under', setback: 0 };
  const kol = (o = {}) => ({ kind: 'doors', doors: 1, w: null, shelfTargets: [null, null], ...o });
  const RUN = (id, name, o = {}) => ({ id, name, wallW: null, gap: 0, mountY: 0, H: 720, D: 560, plinth: PL, worktop: true, corner: null, ...o });
  const szafka = (name) => ({ name, W: 600, H: 720, D: 560, plinth: PL, legs: { on: true, height: 100 }, levels: [{ h: null, cols: [kol({ shelfTargets: [null] })] }] });
  const L = { name: 'L', W: 900, H: 720, D: 560, plinth: PL, legs: { on: true, height: 100 }, corner: { on: true, arm: 640, doors: 'wsporniki' }, levels: [{ h: null, cols: [kol()] }] };
  const P = G.loadProject({ name: 'P', active: 1, prices: {},
    runs: [RUN('c1', 'Ściana 1'), RUN('c2', 'Ściana 2', { corner: { of: 'c1', at: 'end', owner: 'self', clear: 0 } })],
    items: [{ cab: szafka('A1'), runId: 'c1' }, { cab: L, runId: 'c2' }, { cab: szafka('B2'), runId: 'c2' }] });
  const n = [...G.projectLayout(P).info.values()].find((x) => x.arm);
  const hw = G.cornerArmParts(n.arm).hardware;
  const konf = hw.filter((h) => h.name === 'Konfirmat 7 × 50').reduce((a, h) => a + h.qty, 0);
  const zasl = hw.filter((h) => h.name === 'Zaślepka na konfirmat').reduce((a, h) => a + h.qty, 0);
  ok('ramię: zaślepek tyle, ile konfirmatów (jak w szafce)', konf > 0 && zasl === konf, `konfirmaty ${konf}, zaślepki ${zasl}`);
  const razem = G.scalOkucia([...G.okuciaSzafki(G.computeGeo(G.cabDoGeo(P, P.items[1]), P.items[1].mat), {}), ...hw]);
  const zR = razem.find((h) => h.name === 'Zaślepka na konfirmat'), kR = razem.find((h) => h.name === 'Konfirmat 7 × 50');
  ok('szafka + ramię: jeden wiersz zaślepek, tyle sztuk co konfirmatów', !!zR && zR.qty === kR.qty, `${zR && zR.qty} / ${kR && kR.qty}`);
}

console.log('\n== N114: element przechodzi przez płytę — przyciski (decyzja użytkownika 2026-10-30) ==');
{
  const sz = (ob = {}, o = {}) => geo({ name: 'T', W: 600, H: 1200, D: 560, ...nogi, obstacles: [{ on: true, w: 200, d: 150, side: 'left', fromSide: 0, fromBack: 0, fullHeight: true, mask: false, ...ob }],
    levels: [{ h: 591, cols: [{ kind: 'open', w: null, shelfTargets: [] }] }, { h: null, cols: [{ kind: 'open', w: null, shelfTargets: [] }] }], ...o });
  const g = sz();
  const m = uw(g, /przechodzi przez płytę między poziomami/)[0];
  ok('element na całą wysokość — ostrzeżenie z „otwory:el:0”, bez przesuwania poziomu', !!m && m.level === 'warn' && /\|otwory:el:0$/.test(m.text), m && m.text.split('|').slice(1).join());
  const gO = sz({ otwory: true });
  const mO = uw(gO, /przechodzi przez płytę między poziomami/)[0];
  const pO = gO.panels.find((p) => /^Półka przelotowa — /.test(p.name));
  ok('po „Wycinam otwory”: informacja, formatka „Półka przelotowa — wycięcie 182 × 150 w lewym tylnym rogu”', !!mO && mO.level === 'info' && !!pO && pO.name === 'Półka przelotowa — wycięcie 182 × 150 w lewym tylnym rogu' && pO.qty === 1,
    `${mO && mO.level} ${pO && pO.name}`);
  // element 300 mm wysoki od 400 mm — plyta na 591: przesuniecie nad / pod
  const gP = sz({ fullHeight: false, fromBottom: 400, h: 300 });
  const mP = uw(gP, /przechodzi przez płytę między poziomami/)[0];
  ok('element 400–700 mm — przyciski „poziomh:0:700:nad:446” i „poziomh:0:382:pod:764” (poziom 2 o tyle mniejszy)', !!mP && /\|otwory:el:0\|poziomh:0:700:nad:446\|poziomh:0:382:pod:764$/.test(mP.text), mP && mP.text.split('|').slice(1).join());
  ok('po „Płyta nad element” (poziom 1: 700) — płyta nie przecina elementu', !uw(sz({ fullHeight: false, fromBottom: 400, h: 300 }, { levels: [{ h: 700, cols: [{ kind: 'open', w: null, shelfTargets: [] }] }, { h: null, cols: [{ kind: 'open', w: null, shelfTargets: [] }] }] }), /przechodzi przez płytę/).length);
  // polka kolumny i przegroda
  const gk = (ob = {}) => geo({ name: 'T', W: 600, H: 720, D: 560, ...nogi, obstacles: [{ on: true, w: 100, d: 100, side: 'left', fromSide: 250, fromBack: 0, fullHeight: true, mask: false, ...ob }],
    levels: [{ h: null, cols: [{ kind: 'open', w: null, shelfTargets: [null, null] }, { kind: 'open', w: null, shelfTargets: [null, null] }] }] });
  const g1 = gk();
  ok('półka i przegroda przecięte — ostrzeżenia z „otwory:el:0”', uw(g1, /półka na .* koliduje z elementem/).every((x) => /\|otwory:el:0$/.test(x.text)) && uw(g1, /przechodzi przez przegrodę/).length === 1
    && /\|otwory:el:0$/.test(uw(g1, /przechodzi przez przegrodę/)[0].text));
  const g2 = gk({ otwory: true });
  const nazwy = g2.panels.map((p) => p.name).filter((n) => /otwór|wycięcie/.test(n));
  ok('po „Wycinam otwory”: półki „— wycięcie … w lewym / prawym tylnym rogu”, przegroda „— wycięcie … z tyłu”, bez ostrzeżeń o kolizji', nazwy.some((n) => /^Półka — wycięcie 41 × 100 w lewym tylnym rogu$/.test(n)) && nazwy.some((n) => /^Półka — wycięcie 41 × 100 w prawym tylnym rogu$/.test(n)) && nazwy.some((n) => /^Przegroda pionowa — wycięcie 100 × 684 z tyłu$/.test(n))
    && !uw(g2, /koliduje z elementem|potrzebne w niej/).length, nazwy.join(' / '));
}

console.log('\n== N170–N190 (audyt GPT 2026-10-31) ==');
{
  const dwaPoz = (obs, o = {}) => geo({ name: 'T', W: 800, H: 1200, D: 560, ...nogi, obstacles: obs,
    levels: [{ h: 591, cols: [{ kind: 'open', w: null, shelfTargets: [] }] }, { h: null, cols: [{ kind: 'open', w: null, shelfTargets: [] }] }], ...o });
  const el = (o) => ({ on: true, w: 100, d: 100, side: 'left', fromSide: 0, fromBack: 0, fullHeight: true, mask: false, otwory: true, ...o });
  // N171: dwa elementy — oba otwory w nazwie
  const g171 = dwaPoz([el({}), el({ side: 'right', w: 150, d: 120 })]);
  const n171 = g171.panels.filter((p) => /^Półka przelotowa/.test(p.name)).map((p) => p.name);
  ok('N171: dwa elementy — „Półka przelotowa — wycięcie 82 × 100 w lewym tylnym rogu + wycięcie 132 × 120 w prawym tylnym rogu”',
    n171.length === 1 && n171[0] === 'Półka przelotowa — wycięcie 82 × 100 w lewym tylnym rogu + wycięcie 132 × 120 w prawym tylnym rogu', n171.join(' / '));
  // N172: informacja z tym samym wymiarem co formatka
  const m172 = uw(dwaPoz([el({})]), /przechodzi przez płytę między poziomami/)[0];
  ok('N172: informacja „wycięcie 82 × 100 w lewym tylnym rogu” — jak w nazwie formatki', !!m172 && /wycięcie 82 × 100 w lewym tylnym rogu/.test(m172.text), m172 && m172.text);
  // N173: dwie plyty z otworami po roznych stronach — dwa wiersze
  const g173 = geo({ name: 'T', W: 800, H: 1800, D: 560, ...nogi, obstacles: [el({ fullHeight: false, fromBottom: 400, h: 200 }), el({ side: 'right', fullHeight: false, fromBottom: 900, h: 200 })],
    levels: [{ h: 500, cols: [{ kind: 'open', w: null, shelfTargets: [] }] }, { h: 500, cols: [{ kind: 'open', w: null, shelfTargets: [] }] }, { h: null, cols: [{ kind: 'open', w: null, shelfTargets: [] }] }] });
  const n173 = g173.panels.filter((p) => /^Półka przelotowa/.test(p.name)).map((p) => `${p.name} ×${p.qty}`);
  ok('N173: otwór z lewej i z prawej — dwa wiersze po 1 szt.', n173.length === 2 && n173.every((x) => / ×1$/.test(x)) && n173.some((x) => /lewym/.test(x)) && n173.some((x) => /prawym/.test(x)), n173.join(' / '));
  // N174: element 0–5 mm od tylu przed polka cofnieta o plecy 18 — bez ostrzezenia
  const g174 = dwaPoz([el({ otwory: false, w: 100, d: 5, fromSide: 200 })], { back: 'board', backPos: 'inside' });
  ok('N174: element 5 mm za tylną krawędzią półki — bez ostrzeżenia o płycie', !uw(g174, /przechodzi przez płytę/).length, uw(g174, /przechodzi przez płytę/).map((x) => x.text).join(' / '));
  // N175: polka na kolkach z wycieciem w tylnym lewym rogu — tylny kolek przed wycieciem
  const g175 = geo({ name: 'T', W: 600, H: 1200, D: 560, ...nogi, obstacles: [el({ w: 200, d: 150 })],
    levels: [{ h: null, cols: [{ kind: 'open', w: null, shelfTargets: [null, null] }] }] });
  const k175 = (g175.drillPlan.find((p) => p.panel === 'Bok lewy') || { rows: [] }).rows.find((r) => r.kind === 'kołek półki');
  ok('N175: tylny kołek lewego boku przed wycięciem (560 − 150 − 30 = 380 od przodu)', !!k175 && /50 i 380 mm od przedniej krawędzi/.test(k175.note) && /przed wycięciem/.test(k175.note), k175 && k175.note);
  // N176: plyta nad element — przycisk z wysokoscia nastepnego poziomu
  const g176 = geo({ name: 'T', W: 800, H: 1800, D: 560, ...nogi, obstacles: [el({ otwory: false, fullHeight: false, fromBottom: 400, h: 300 })],
    levels: [{ h: 500, cols: [{ kind: 'open', w: null, shelfTargets: [] }] }, { h: 500, cols: [{ kind: 'open', w: null, shelfTargets: [] }] }, { h: null, cols: [{ kind: 'open', w: null, shelfTargets: [] }] }] });
  const m176 = uw(g176, /przechodzi przez płytę między poziomami 1 i 2/)[0];
  ok('N176: „poziomh:0:700:nad:300” — poziom 2 zmniejsza się o tyle, ile rośnie 1', !!m176 && /\|poziomh:0:700:nad:300/.test(m176.text), m176 && m176.text.split('|').slice(1).join());
  // N177, N179, N185, N190: przyciski
  ok('N177: luz między drzwiami 1 mm — „luzdrzwi:2”', /\|luzdrzwi:2$/.test((uw(geo({ name: 'T', W: 600, H: 720, D: 560, ...nogi, gaps: { edge: 2, between: 1, top: 3, bottom: 3, inset: 2 }, levels: [{ h: null, cols: [drzwi({ doors: 2 })] }] }), /poniżej 2 mm/)[0] || {}).text || ''));
  const m179 = uw(geo({ name: 'T', W: 600, H: 720, D: 560, ...nogi, shelfExtraSetback: 560, levels: [{ h: null, cols: [drzwi({ shelfTargets: [null, null] })] }] }), /Głębokość półki wychodzi zero/)[0];
  ok('N179: cofnięcie 560 — „polkicof:460” (półka 100) i „polkicof:0”', !!m179 && /\|polkicof:4\d\d\|polkicof:0$/.test(m179.text), m179 && m179.text.split('|').slice(1).join());
  const m185 = uw(geo({ name: 'T', W: 600, H: 720, D: 560, ...nogi, levels: [{ h: null, cols: [drzwi()] }] }, { ...M0, board: { ...M0.board, thickness: 0 } }), /musi być większa od zera/)[0];
  ok('N185: grubość korpusu 0 — jeden przycisk „grubosc:board:18”', !!m185 && /\|grubosc:board:18$/.test(m185.text), m185 && m185.text.split('|').slice(1).join());
  const m190 = uw(geo({ name: 'T', W: 600, H: 720, D: 560, ...nogi, back: 'hdf', backGroove: { on: true, depth: 18, offset: 3, play: 1 }, levels: [{ h: null, cols: [drzwi()] }] }), /^Frez 18 mm/)[0];
  ok('N190: frez 18 przy płycie 18 — „równy grubości płyty”, przycisk „frez:16”', !!m190 && /równy grubości płyty/.test(m190.text) && /\|frez:16$/.test(m190.text), m190 && m190.text);
  // N180: polka w wycieciu naroznym — wyciety rog w nazwie formatki, informacja
  const g180 = geo({ name: 'T', W: 600, H: 720, D: 560, ...nogi, cutout: { on: true, w: 100, d: 100, fullHeight: true, mask: true }, levels: [{ h: null, cols: [drzwi({ shelfTargets: [null, null] })] }] });
  const p180 = g180.panels.filter((p) => /^Półka/.test(p.name)).map((p) => p.name);
  ok('N180: półka — „wycięcie 100 × 118 w lewym tylnym rogu” w nazwie, informacja zamiast „przytnij na miejscu”', p180.some((n) => /^Półka — wycięcie \d+ × \d+ w lewym tylnym rogu$/.test(n))
    && uw(g180, /wchodzi w wycięcie narożnika — ma wycięcie/).every((x) => x.level === 'info') && !uw(g180, /przytnij ją na miejscu/).length, p180.join(' / '));
  // N183: dwa wyciecia 400 × 100 przy W600
  const m183 = uw(geo({ name: 'T', W: 600, H: 720, D: 560, ...nogi, back: 'none', cutout: { on: true, w: 400, d: 100, fullHeight: true, mask: true }, cutoutR: { on: true, w: 400, d: 100, fullHeight: true, mask: true },
    levels: [{ h: null, cols: [{ kind: 'open', w: null, shelfTargets: [] }] }] }), /nachodzą na siebie/)[0];
  ok('N183: błąd z „wycszer:L:164” i „wycszer:P:164”', !!m183 && m183.level === 'error' && /\|wycszer:L:164\|wycszer:P:164$/.test(m183.text), m183 && m183.text);
  // N184: element obok skrzynki (za fixem) — bez kolizji i bez zapetlenia
  const sz184 = (nl) => geo({ name: 'T', W: 800, H: 720, D: 560, ...nogi, back: 'none', obstacles: [el({ otwory: false, w: 100, fromSide: 20 })],
    levels: [{ h: null, cols: [{ kind: 'drawers', w: null, nl, fix: { side: 'left', w: 200, mode: 'overlay', support: true, supportDepth: 550 }, drawers: [{ h: 'auto' }] }] }] });
  ok('N184: element 20–120, skrzynka od 200 — bez „sięga elementu”, bez „głębsza NL”', !uw(sz184(550), /sięga elementu|głębsza NL/).length, uw(sz184(550), /NL/).map((x) => x.text).join(' / '));
  const sz184b = (nl) => geo({ name: 'T', W: 800, H: 720, D: 560, ...nogi, back: 'none', obstacles: [el({ otwory: false, w: 100, fromSide: 300 })],
    levels: [{ h: null, cols: [{ kind: 'drawers', w: null, nl, drawers: [{ h: 'auto' }] }] }] });
  ok('N184: element na drodze — NL 550 „sięga” z NL 450, a przy NL 450 nie ma „głębsza NL 550”', uw(sz184b(550), /NL 550 sięga elementu/).length === 1 && !uw(sz184b(450), /głębsza NL/).length);
  // N186: element bez zabudowy — przycisk
  ok('N186: element bez zabudowy — „zabuduj:el:0”', /\|zabuduj:el:0$/.test((uw(dwaPoz([el({ otwory: false })]), /nie ma zabudowy — nie jest zakryty/)[0] || {}).text || ''));
  // N188 / N189: tip-on
  const tip = (o = {}) => geo({ name: 'T', W: 600, H: 2000, D: 560, ...nogi, ...o, levels: [{ h: null, cols: [drzwi({ handles: [false], otwieranie: ['tipon'], shelfTargets: [null, null] })] }] });
  const t188 = tip({ joints: { topL: 'none', topR: 'none', botL: 'none', botR: 'none' }, shelfExtraSetback: 200 });
  const m188 = uw(t188, /tip-on nie ma płyty/)[0];
  ok('N188: półka cofnięta o 200 — „nie ma płyty” z powodem i „polkicof:0”', !!m188 && /półki są cofnięte o 200 mm/.test(m188.text) && /\|uchwyt:0:0:0\|polkicof:0$/.test(m188.text), m188 && m188.text);
  const t189 = geo({ name: 'T', W: 600, H: 720, D: 560, ...nogi, back: 'none', obstacles: [el({ otwory: false, w: 40, fromSide: 550, fromBack: 460 })],
    levels: [{ h: null, cols: [drzwi({ handles: [false], otwieranie: ['tipon'] })] }] });
  const m189 = uw(t189, /tip-on wchodzi w/)[0];
  ok('N189: odbojnik w elemencie — błąd z „uchwyt” i „hingeflip” (druga krawędź wolna)', !!m189 && m189.level === 'error' && /\|uchwyt:0:0:0\|hingeflip:0:0:right$/.test(m189.text), m189 && m189.text);
  // N170: rozne dekory o tym samym kolorze — osobne wiersze i grupy (projectCutList jest w App — sprawdzamy klucz)
  ok('N170: tożsamość płyty rozróżnia dekor', G.tozsamoscPlyty({ name: 'Płyta', color: '#d8c3a0', decor: 'Oak', thickness: 18 }) !== G.tozsamoscPlyty({ name: 'Płyta', color: '#d8c3a0', decor: 'Ash', thickness: 18 }));
}

console.log('\n== Decyzje 2026-10-31: kątownik szuflady > 600 (N178), podpora rury WP-10 (N181/N182) ==');
{
  const szuf = (W) => geo({ name: 'T', W, H: 720, D: 560, ...nogi, levels: [{ h: null, cols: [{ kind: 'drawers', w: null, drawers: [{ h: 'auto' }, { h: 'auto' }, { h: 'auto' }] }] }] });
  const g800 = szuf(800), hw800 = G.okuciaSzafki(g800, {});
  const kat = hw800.find((h) => h.name === 'Kątownik mocujący Sevroll 40343'), wk = hw800.find((h) => h.name === 'Wkręt 3,5 × 13');
  ok('N178: W800, 3 szuflady V-BOX — 3 kątowniki 40343 i 12 wkrętów 3,5 × 13, informacja zamiast ostrzeżenia', !!kat && kat.qty === 3 && !!wk && wk.qty === 12
    && uw(g800, /szersza niż 600 mm/).every((x) => x.level === 'info'), `${kat && kat.qty} / ${wk && wk.qty}`);
  ok('N178: kontrola W600 — bez kątownika', !G.okuciaSzafki(szuf(600), {}).some((h) => h.name === 'Kątownik mocujący Sevroll 40343'));
  const szafa = (o = {}) => geo({ name: 'S', W: 2100, H: 2000, D: 560, plinth: { on: false }, legs: { on: true, height: 100 },
    levels: [{ h: null, cols: [drzwi({ doors: 2, shelfTargets: [400, null], drazki: [1], ...o })] }] });
  const m = uw(szafa(), /rura ma 2062 mm/)[0];
  ok('rura 2062 — ostrzeżenie z „podpora:0:0” przed „podzielkol”', !!m && /\|podpora:0:0\|podzielkol:/.test(m.text), m && m.text.split('|').slice(1).join());
  const gP = szafa({ drazekPodpora: true });
  const hwP = G.okuciaSzafki(gP, {});
  const plan = gP.drillPlan.find((p) => p.rows.some((r) => /podpora rury WP-10/.test(r.kind)));
  ok('po „Podpora rury na środku”: informacja, w zamówieniu 1 × WP-10, w planie wierceń na płycie nad rurą', uw(gP, /podparta na środku/).length === 1 && !uw(gP, /ugina się/).length
    && (hwP.find((h) => h.name === 'Podpora rury ⌀25 GTV WP-10') || {}).qty === 1 && !!plan && plan.panel === 'Wieniec', plan && plan.panel);
  // ceny uzytkownika 2026-10-31: WP-10 i katownik po 4 zl, klocek 1 zl, wkrety bez ceny jak 4 × 30
  const c = (name, pk) => G.hwDefaultPrice({ name, pk });
  // listwa dystansowa (uzytkownik 2026-10-31): 18 / 36 z plyty (formatka 60 × W, bez okleiny, dzielona), inna — kantowka co 5 mm
  const wis = (o = {}) => geo({ name: 'W', W: 800, H: 720, D: 320, ...nogi, hangerMode: 'listwa', levels: [{ h: null, cols: [drzwi()] }], ...o });
  const ld = (g) => g.panels.filter((p) => p.name === 'Listwa dystansowa');
  const hwD = (g) => g.hardware.filter((h) => /dystans|Kantówka/i.test(h.name));
  const g18 = wis({ dystans: 18 }), g36 = wis({ dystans: 36 }), g20 = wis({ dystans: 20 }), g50 = wis({ dystans: 50 }), g52 = wis({ dystans: 52 });
  ok('dystans 18: formatka „Listwa dystansowa” 800 × 60, 1 szt., bez okleiny, dzielona; bez okucia dystansu',
    ld(g18).length === 1 && ld(g18)[0].qty === 1 && ld(g18)[0].a === 800 && ld(g18)[0].b === 60 && ld(g18)[0].dzielona
    && !Object.values(ld(g18)[0].edges).some(Boolean) && !hwD(g18).length, JSON.stringify(ld(g18)[0]));
  ok('dystans 36: 2 warstwy (2 szt.); 20 (w tolerancji 2 mm): 1 warstwa', ld(g36)[0]?.qty === 2 && ld(g20)[0]?.qty === 1 && !hwD(g36).length);
  ok('dystans 50 / 52: bez formatki, kantówka 50 × 60 mm na 0,8 mb', !ld(g50).length && !ld(g52).length
    && hwD(g50).length === 1 && hwD(g50)[0].name === 'Kantówka dystansowa' && hwD(g50)[0].wariant === '50 × 60 mm' && hwD(g50)[0].qty === 0.8
    && hwD(g52)[0]?.wariant === '50 × 60 mm', hwD(g52).map((h) => h.wariant).join());
  const gH = wis({ dystans: 18, hangerMode: 'haczyki' });
  ok('haki: klocek dystansowy pod hak, bez listwy z płyty', !ld(gH).length && hwD(gH).length === 1 && hwD(gH)[0].name === 'Klocek dystansowy pod hak');
  // rozkroj: listwa dzielona w zrzutach — bez dodatkowego arkusza, najmniej kawalkow
  const wr = (name, a, b, qty = 1, o = {}) => ({ name, a, b, qty, rotatable: true, matLabel: 'X', matId: 'X', sheet: null, ...o });
  const planR = (rows) => G.buildCutPlan(rows)[0];
  const czesci = (g) => g.sheets.flatMap((q) => q.parts.filter((p) => /^Listwa dystansowa/.test(p.name)));
  const dl = (ps) => ps.reduce((s2, p) => s2 + Math.max(p.w, p.h), 0);
  const p1 = planR([wr('Bok', 2600, 1900), wr('Listwa dystansowa', 1000, 60, 1, { dzielona: true })]);
  ok('rozkrój: listwa 1000 w zrzucie obok boku — 1 arkusz, 1 kawałek', p1.kupic === 1 && czesci(p1).length === 1 && dl(czesci(p1)) === 1000);
  const p2 = planR([wr('Bok', 2600, 1900), wr('Listwa dystansowa', 2800, 60, 1, { dzielona: true })]);
  ok('rozkrój: listwa 2800 (dłuższa niż arkusz) — 2 kawałki w zrzutach, razem 2800, 1 arkusz, każdy ≥ 60',
    p2.kupic === 1 && czesci(p2).length === 2 && Math.abs(dl(czesci(p2)) - 2800) < 1e-6 && czesci(p2).every((p) => Math.max(p.w, p.h) >= 60 && Math.min(p.w, p.h) === 60)
    && czesci(p2).every((p) => /kawałek [12]\/2$/.test(p.name)), czesci(p2).map((p) => p.name + ' ' + Math.round(p.w) + '×' + Math.round(p.h)).join(' / '));
  const p3 = planR([wr('Bok', 2761.2, 2061.2), wr('Listwa dystansowa', 800, 60, 2, { dzielona: true })]);
  ok('rozkrój: arkusz bez zrzutów — listwy całe (2 × 800) na drugim arkuszu', p3.kupic === 2 && czesci(p3).length === 2 && czesci(p3).every((p) => Math.max(p.w, p.h) === 800));
  const p4 = G.buildCutPlan([wr('Bok', 2600, 1900), wr('Listwa dystansowa', 800, 60, 1, { dzielona: true })], [{ id: 'r1', matLabel: 'X', w: 900, h: 100, qty: 1 }])[0];
  ok('rozkrój: własny kawałek 900 × 100 — listwa na nim (zrzut), kupny arkusz 1', p4.kupic === 1 && p4.zWlasnych === 1 && p4.sheets.some((q) => q.wlasna && q.parts.some((p) => p.name === 'Listwa dystansowa')));
  ok('ceny: WP-10 4 zł, kątownik 40343 4 zł, klocek pod hak 1 zł; wkręty 3,5 × 13, do frontu DXS (też krótszy), 4 × 40 — 0,08 zł jak 4 × 30',
    c('Podpora rury ⌀25 GTV WP-10') === 4 && c('Kątownik mocujący Sevroll 40343') === 4 && c('Klocek dystansowy pod hak') === 1
    && c('Wkręt 3,5 × 13') === 0.08 && c('Wkręt 4 × 25 do frontu szuflady', 'Wkręt 4 × 30 do frontu szuflady') === 0.08 && c('Wkręt 4 × 40') === 0.08 && c('Zawias') === 3,
    [c('Wkręt 3,5 × 13'), c('Wkręt 4 × 40')].join(' / '));
}
