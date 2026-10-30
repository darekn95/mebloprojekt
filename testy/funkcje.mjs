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
const nazwy = ['buildCutPlan', 'loadProject', 'scalOkucia', 'tozsamoscPlyty', 'defaultMaterials', 'migrateCab', 'bezWienca', 'utrzymajPodBlat', 'zWiencem', 'jestParaPodBlat',
  'computeGeo', 'projectLayout', 'projectParts', 'runBottom', 'wysokoscWienca', 'wedlugCiagu', 'cornerArmParts', 'cornerPairMsgs', 'armPlan', 'wierceniaDodatkowe', 'openingMsgs', 'armCtxOf',
  'ambiguousThickness', 'matyUzyte', 'matLabelOf', 'scalSzafki', 'cabDoGeo', 'okuciaSzafki', 'wierszBlatu', 'scalenieBlad', 'runTop', 'worktopMsgs', 'runTopZlacza', 'tierMountY', 'runRail', 'kolumnaZPrzelotu'];
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
  ok('N114: element przez płytę między poziomami — uwaga z wymiarem otworu', uw(g3, /przechodzi przez płytę między poziomami 1 i 2/).length === 1 && /80 × 80 mm/.test(uw(g3, /przechodzi przez płytę/)[0].text));
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

  const zw = (li, full) => geo({ name: 'T', W: 600, H: 1200, D: 560, ...nogi, hangers: 'always', cutout: { on: true, w: 100, d: 100, fullHeight: full, levelIndex: li, mask: true },
    levels: [{ h: 591, cols: [{ kind: 'open', w: null, shelfTargets: [] }] }, { h: null, cols: [{ kind: 'open', w: null, shelfTargets: [] }] }] });
  ok('N149: wycięcie w górnym poziomie — błąd o zawieszce w wycięciu', uw(zw(1, false), /Zawieszka przy lewym boku wypada w wycięciu narożnika/).length === 1);
  ok('N149: kontrola — wycięcie w dolnym poziomie albo na całą wysokość — bez uwagi', !uw(zw(0, false), /Zawieszka/).length && !uw(zw(1, true), /Zawieszka/).length);
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
