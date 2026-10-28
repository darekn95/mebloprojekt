/* Funkcje obliczen z `szafki.jsx` wywolane wprost w node (bez przegladarki) — tam,
   gdzie scenariusz trudno ulozyc formularzem (audyt GPT 2026-10-28):
   - N92 rozkroj na wlasnym kawalku zdejmuje te formatke, ktora na nim lezy;
   - N93 podsumowanie grupy liczy tez wlasne kawalki;
   - N95 dwie wlasne plyty o tej samej nazwie — osobne grupy; stary zapis dostaje numer;
   - N94 stary kawalek (bez tozsamosci plyty) dostaje ja przy wczytaniu;
   - N90 wiersz rury w zamowieniu projektu z planem zakupu i ciecia. */
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
const nazwy = ['buildCutPlan', 'loadProject', 'scalOkucia', 'tozsamoscPlyty', 'defaultMaterials'];
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
