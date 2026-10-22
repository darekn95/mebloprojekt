/* Macierz wszystkich mozliwosci szuflad (prosba uzytkownika 2026-10-22: „testy
   wszystkich możliwości szuflad, szukaj błędów i je napraw”). Kazda KONSTRUKCJA
   korpusu × kazdy WARIANT szuflad (system, liczba, boki, fronty, tyl, reling, NL,
   luzy, montaz frontu, uchwyt frezowany, fix, kolumny, poziomy) plus wymiary
   skrajne. Na kazdym ukladzie:
   1. bryla zamknieta — nic na nic nie nachodzi,
   2. formatki ↔ bryla w obie strony (skrzynki w bryle otwartej),
   3. fronty w obrysie korpusu,
   4. skrzynka (otwarta) nie wchodzi w korpus, wzmocnienia ani plecy,
   5. symulacja wysuwu (`symwysuw`) bez kolizji,
   6. zamowienie: prowadnic V-BOX i kompletow DXS-3D tyle, ile szuflad tego systemu,
   7. plan wiercen: dwie kreski prowadnicy na szuflade,
   8. uwagi: uklad poprawny nie ma bledow (×); uklad celowo zly (`zle`) ma
      oczekiwany blad — i przycisk przy bledzie go naprawia (klik, uwagi od nowa:
      blad znika, nie przybywa innych).
   TYLKO=<regex> — wybrane uklady, SHARD=k/n — co n-ty uklad (rownolegle przebiegi),
   PELNE=1 — cale tresci bledow. */
import pw from './pw.mjs';
import { symuluj, K, F, P, METAL } from './symwysuw.mjs';
const URL = process.env.STD ? 'http://127.0.0.1:5199/standalone-local.html'
  : 'http://127.0.0.1:5205/mebloprojekt-app.html';
const ok = (l, c, e = '') => console.log((c ? '  OK   ' : '  BLAD ') + l + (e ? ' — ' + e : ''));
const b = await pw.chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const page = await (await b.newContext({ viewport: { width: 1500, height: 1300 } })).newPage();
const errors = []; page.on('pageerror', (e) => errors.push(e.message));
await page.goto(URL, { waitUntil: 'networkidle' });
const TYLKO = process.env.TYLKO ? new RegExp(process.env.TYLKO) : null;
const [SH_K, SH_N] = (process.env.SHARD || '0/1').split('/').map(Number);
const PELNE = !!process.env.PELNE;

const MAT = {
  board: { name: 'Płyta', thickness: 18, color: K, decor: 'KORPUS' },
  front: { name: 'Płyta', thickness: 18, color: F, decor: 'FRONT' },
  shelf: { name: 'Płyta', thickness: 18, color: P, decor: 'POLKA' },
  back: { name: 'HDF', thickness: 3, color: '#e7e5e4' },
  worktop: { name: 'Blat roboczy', thickness: 38, color: '#8d7b68', depth: 600 },
};
const PL = { on: true, height: 100, mode: 'under', setback: 0 };
const kol = (o = {}) => ({ kind: 'doors', doors: 1, w: null, shelfTargets: [null], ...o });
const baza = (o = {}) => ({ name: 'M', W: 600, H: 720, D: 560, plinth: PL, legs: { on: true, height: 100 },
  frontSameAsBoard: false, shelfSameAsBoard: false, levels: [{ h: null, cols: [kol()] }], ...o });
const PARA = [
  { orient: 'shelf', pos: 'top', side: 'left', h: 100, depth: 100, atDepth: 0, fromBack: false, reducesDoor: false },
  { orient: 'front', pos: 'top', side: 'left', h: 100, depth: 100, atDepth: 0, fromBack: true, reducesDoor: false },
];
const RUN = { id: 'c1', name: 'Ściana 1', roomId: 'p1', wallW: null, gap: 0, mountY: 0, H: 720, D: 560, plinth: PL, worktop: true, corner: null };

// szuflady: n sztuk danego systemu (auto), opcje nadpisuja kazda
const sz = (n, sys = 'vbox', o = {}) => Array.from({ length: n }, () => ({ h: 'auto', front: null, handle: true, ...(sys === 'dxs' ? { system: 'dxs' } : {}), ...o }));
const kolSz = (drawers, o = {}) => ({ ...kol(), kind: 'drawers', drawers, ...o });
const jedna = (col, o = {}) => (c) => ({ ...c, ...o, levels: [{ h: null, cols: [col] }] });

/* KONSTRUKCJE: [nazwa, zmiana, w ciagu z blatem?]. „pod blatem” = bez wienca, para
   wzmocnien w najwyzszym poziomie (jak `bezWienca`). */
const podBlatem = (c) => ({ ...c, joints: { ...(c.joints || {}), topL: 'none', topR: 'none' },
  levels: c.levels.map((lv, i) => (i === c.levels.length - 1 ? { ...lv, cols: lv.cols.map((cc) => ({ ...cc, rails: [...(cc.rails || []), ...PARA] })) } : lv)) });
const KONSTRUKCJE = [
  ['stojąca', (c) => c, false],
  ['pod blatem', podBlatem, true],
  ['fronty wpuszczane', (c) => ({ ...c, frontMode: 'inset' }), false],
  ['wisząca 350', (c) => ({ ...c, D: 350, plinth: { ...PL, on: false }, legs: { on: false }, hangerMode: 'listwa' }), false],
  ['cokół w obrysie', (c) => ({ ...c, plinth: { ...PL, mode: 'inbody' } }), false],
  ['plecy z płyty', (c) => ({ ...c, back: 'board', backPos: 'inside' }), false],
  ['HDF we frezie', (c) => ({ ...c, backGroove: { on: true, offset: 3, depth: 16, play: 1, wreg: true } }), false],
  ['blat 38 na bokach', (c) => ({ ...c, top: { mode: 'blat', material: 'worktop', widthMode: 'outside', overL: 10, overR: 10, overFront: 20, overBack: 20 },
    joints: { ...(c.joints || {}), topL: 'over', topR: 'over' } }), false],
  ['pod blatem, wpuszczane', (c) => podBlatem({ ...c, frontMode: 'inset' }), true],
];

/* WARIANTY: [nazwa, zmiana szafki, { zle: regex oczekiwanego bledu }]. Kazdy
   wariant „systemowy” idzie w V-BOX i w DXS-3D (`S` = system). */
const WARIANTY = (S) => [
  ...[1, 2, 3, 4, 5].map((n) => [`${n} szt.`, jedna(kolSz(sz(n, S)))]),
  ['bez uchwytów', jedna(kolSz(sz(3, S, { handle: false })))],
  ['front dolny 300', jedna(kolSz(sz(3, S).map((d, i) => (i === 0 ? { ...d, front: 300 } : d))))],
  ['fronty ręcznie, suma za mała', jedna(kolSz(sz(2, S, { front: 200 }))), { zle: /wysokości frontów szuflad nie zgadzają się/ }],
  ['luz między frontami 0', jedna(kolSz(sz(3, S), { gapBetween: 0 })), { zle: /fronty się stykają/ }],
  ['luz między frontami 8', jedna(kolSz(sz(3, S), { gapBetween: 8 })), { zle: /za dużo, granica/ }],
  ['NL kolumny 400', jedna(kolSz(sz(3, S), { nl: 400 }))],
  ['NL szuflady 600 (za długa)', jedna(kolSz(sz(3, S).map((d, i) => (i === 0 ? { ...d, nl: 600 } : d)))), { zle: /NL 600|głębokości do pleców/ }],
  ['dwie kolumny szuflad', (c) => ({ ...c, W: 900, levels: [{ h: null, cols: [kolSz(sz(3, S)), kolSz(sz(2, S))] }] })],
  ['szuflady obok drzwi', (c) => ({ ...c, W: 900, levels: [{ h: null, cols: [kolSz(sz(3, S)), kol()] }] })],
  ['szuflady pod drzwiami', (c) => ({ ...c, levels: [{ h: 340, cols: [kolSz(sz(2, S))] }, { h: null, cols: [kol()] }] })],
  ['szuflady nad drzwiami', (c) => ({ ...c, levels: [{ h: 340, cols: [kol()] }, { h: null, cols: [kolSz(sz(2, S))] }] })],
  ['fix z lewej, wspornik 100 (krótszy niż NL)', jedna(kolSz(sz(3, S), { fix: { side: 'left', w: 100, mode: 'overlay', support: true, supportDepth: 100 } }), { W: 700 }), { zle: /wspornik ma 100 mm/ }],
  ['fix z lewej bez wspornika', jedna(kolSz(sz(3, S), { fix: { side: 'left', w: 100, mode: 'overlay', support: false, supportDepth: 100 } }), { W: 700 }), { zle: /element stały zasłania część kolumny szuflad/ }],
  ['fix u góry', jedna(kolSz(sz(2, S), { fix: { side: 'top', w: 100, mode: 'overlay' } }))],
  ['fronty szuflad na korpusie', jedna(kolSz(sz(3, S), { drawerMode: 'overlay' }))],
  ['fronty szuflad wewnątrz', jedna(kolSz(sz(3, S), { drawerMode: 'inset' }))],
  ['plecy kolumny z płyty', jedna(kolSz(sz(3, S), { backMode: 'board' }))],
];
const TYLKO_VBOX = [
  ['V-BOX boki 80', jedna(kolSz(sz(3, 'vbox', { h: 80 })))],
  ['V-BOX boki 127', jedna(kolSz(sz(3, 'vbox', { h: 127 })))],
  ['V-BOX boki 238 (za wysokie)', jedna(kolSz(sz(3, 'vbox', { h: 238 }))), { zle: /skrzynka z bokiem 238|minimum dla wysokości 238|luzu nad bokiem|nad bokiem skrzynki/ }],
  ['V-BOX podniesiony tył', jedna(kolSz(sz(3, 'vbox', { tallBack: true })))],
  ['V-BOX podniesiony tył 150 (niższy niż bok)', jedna(kolSz(sz(2, 'vbox', { tallBack: true, backHeight: 150 }))), { zle: /niższy niż bok skrzynki/ }],
  ['V-BOX reling', jedna(kolSz(sz(2, 'vbox', { reling: true })))],
  ['V-BOX szeroka 1000', jedna(kolSz(sz(3, 'vbox')), { W: 1000 })],
  ['V-BOX NL 270', jedna(kolSz(sz(3, 'vbox'), { nl: 270 }))],
];
const TYLKO_DXS = [
  ['DXS bok 150, tył 120', jedna(kolSz(sz(3, 'dxs').map((d, i) => (i === 0 ? { ...d, h: 150, backHeight: 120 } : d))))],
  ['DXS bok 60, tył 50', jedna(kolSz(sz(3, 'dxs', { h: 60, backHeight: 50 })))],
  ['DXS bok 25 (za niski)', jedna(kolSz(sz(3, 'dxs').map((d, i) => (i === 0 ? { ...d, h: 25 } : d)))), { zle: /węższej niż 30 mm/ }],
  ['DXS bok za wysoki 400', jedna(kolSz(sz(3, 'dxs').map((d, i) => (i === 0 ? { ...d, h: 400 } : d)))), { zle: /sięga \d+ mm nad spód prowadnicy|nad bokiem skrzynki/ }],
  ['DXS tył wyższy niż bok − 10', jedna(kolSz(sz(2, 'dxs', { backHeight: 300 })))],
  ['DXS NL 270 (nie ma)', jedna(kolSz(sz(3, 'dxs'), { nl: 270 })), { zle: /nie ma takiej długości w DXS-3D/ }],
  ['DXS szeroka 1000', jedna(kolSz(sz(3, 'dxs')), { W: 1000 })],
  ['DXS dwanaście szuflad', jedna(kolSz(sz(12, 'dxs'))), { zle: /nie ma miejsca na skrzynkę DXS-3D/ }],
  ['mieszane V/D/V', jedna(kolSz([...sz(1, 'vbox'), ...sz(1, 'dxs'), ...sz(1, 'vbox')]))],
];
const WSZYSTKIE = [
  ...WARIANTY('vbox').map(([n, z, o]) => [`V-BOX ${n}`, z, o]),
  ...WARIANTY('dxs').map(([n, z, o]) => [`DXS ${n}`, z, o]),
  ...TYLKO_VBOX, ...TYLKO_DXS,
];
// na pozostalych konstrukcjach — rdzen
const RDZEN = /^(V-BOX|DXS) (3 szt\.|szuflady pod drzwiami|dwie kolumny szuflad)$|podniesiony tył$|mieszane/;
const SKRAJNE = [
  ['W 300', { W: 300 }], ['W 350', { W: 350 }], ['W 1200, dwie kolumny', { W: 1200 }, 2],
  ['D 300', { D: 300 }], ['D 400', { D: 400 }], ['D 650', { D: 650 }],
  ['H 400', { H: 400 }], ['H 500', { H: 500 }], ['H 900', { H: 900 }],
  ['słupek 2100', { H: 2100 }, 'slupek'],
  ['płyta 16', {}, 'p16'], ['płyta 19', {}, 'p19'],
];

const uklady = [];
for (const [kN, kZ, wCiagu] of KONSTRUKCJE) {
  for (const [wN, wZ, o = {}] of WSZYSTKIE) {
    if (kN !== 'stojąca' && kN !== 'pod blatem' && kN !== 'fronty wpuszczane' && !RDZEN.test(wN)) continue;
    // uchwyt frezowany ma sens tylko przy frontach wpuszczanych
    uklady.push({ nazwa: `${kN} × ${wN}`, cab: kZ(wZ(baza())), wCiagu, zle: o.zle || null });
  }
  if (/frezie/.test(kN) || /wpuszczane$/.test(kN)) {
    if (kN === 'fronty wpuszczane') for (const S of ['vbox', 'dxs'])
      uklady.push({ nazwa: `${kN} × ${S === 'dxs' ? 'DXS' : 'V-BOX'} uchwyt frezowany`, cab: kZ(jedna(kolSz(sz(3, S), { fingerGrip: true, gripDepth: 18 }))(baza())), wCiagu, zle: null });
  }
}
for (const [kN, kZ, wCiagu] of KONSTRUKCJE.filter(([n]) => n === 'stojąca' || n === 'pod blatem')) {
  for (const [sN, zm, typ] of SKRAJNE) for (const S of ['vbox', 'dxs']) {
    const sys = S === 'dxs' ? 'DXS' : 'V-BOX';
    let cab;
    if (typ === 2) cab = { ...baza(zm), levels: [{ h: null, cols: [kolSz(sz(3, S)), kolSz(sz(3, S))] }] };
    else if (typ === 'slupek') cab = { ...baza(zm), levels: [{ h: 700, cols: [kolSz(sz(3, S))] }, { h: null, cols: [kol({ shelfTargets: [null, null, null] })] }] };
    else cab = { ...baza(zm), levels: [{ h: null, cols: [kolSz(sz(zm.H && zm.H <= 400 ? 1 : zm.H === 500 ? 2 : 3, S))] }] };
    const mat = typ === 'p16' || typ === 'p19' ? Object.fromEntries(Object.entries(MAT).map(([k, v]) => [k, ['board', 'front', 'shelf'].includes(k) ? { ...v, thickness: typ === 'p16' ? 16 : 19 } : v])) : MAT;
    uklady.push({ nazwa: `${kN} × ${sys} ${sN}`, cab: kZ(cab), wCiagu, zle: null, mat });
  }
}

/* DODATKI — rzadsze opcje szafki przy szufladach, na stojacej i pod blatem, w obu systemach:
   [nazwa, zmiana szafki, zmiana materialu] */
const DODATKI = (S) => [
  ['wycięcie tylnego narożnika', (c) => ({ ...c, cutoutR: { on: true, w: 100, d: 100, fullHeight: true, levelIndex: 0, mask: true, maskType: 'auto', maskFront: 'over' },
    levels: [{ h: null, cols: [kolSz(sz(3, S))] }] })],
  ['rura przy plecach', (c) => ({ ...c, obstacles: [{ on: true, w: 60, d: 60, h: 0, side: 'right', fromSide: 40, fromBack: 0, fromBottom: 0, fullHeight: true, mask: false, maskType: 'auto', maskFront: 'over' }],
    levels: [{ h: null, cols: [kolSz(sz(3, S))] }] })],
  ['płyta półek 16', (c) => ({ ...c, levels: [{ h: null, cols: [kolSz(sz(3, S))] }] }), (m) => ({ ...m, shelf: { ...m.shelf, thickness: 16 } })],
  ['front 22, wpuszczane', (c) => ({ ...c, frontMode: 'inset', levels: [{ h: null, cols: [kolSz(sz(3, S))] }] }), (m) => ({ ...m, front: { ...m.front, thickness: 22 } })],
  ['front poniżej prowadnicy 0', (c) => ({ ...c, gaps: { underRail: 0 }, levels: [{ h: null, cols: [kolSz(sz(3, S))] }] })],
  ['front poniżej prowadnicy 20', (c) => ({ ...c, gaps: { underRail: 20 }, levels: [{ h: null, cols: [kolSz(sz(3, S))] }] })],
  ['bez nałożenia na dno i wieniec', (c) => ({ ...c, gaps: { overBottom: 0, overTop: 0 }, levels: [{ h: null, cols: [kolSz(sz(3, S))] }] })],
  ['dwa poziomy szuflad', (c) => ({ ...c, levels: [{ h: 340, cols: [kolSz(sz(2, S))] }, { h: null, cols: [kolSz(sz(2, S))] }] })],
  ['trzy kolumny szuflad', (c) => ({ ...c, W: 1200, levels: [{ h: null, cols: [kolSz(sz(3, S)), kolSz(sz(2, S)), kolSz(sz(4, S))] }] })],
];
for (const [kN, kZ, wCiagu] of KONSTRUKCJE.filter(([n]) => n === 'stojąca' || n === 'pod blatem')) {
  for (const S of ['vbox', 'dxs']) for (const [dN, zm, zmMat] of DODATKI(S)) {
    uklady.push({ nazwa: `${kN} × ${S === 'dxs' ? 'DXS' : 'V-BOX'} ${dN}`, cab: kZ(zm(baza())), wCiagu, zle: null, mat: zmMat ? zmMat(MAT) : MAT });
  }
}

// --- narzedzia (jak `audytmacierz`) ---
const num = (s) => Number(String(s).replace(/\s/g, '').replace(',', '.').replace(/[^\d.\-]/g, '')) || 0;
const tabela = (re) => page.evaluate((src) => {
  const re = new RegExp(src);
  const sec = [...document.querySelectorAll('section')].find((s) => re.test((s.querySelector('h2') || {}).textContent || ''));
  if (!sec) return null;
  const t = sec.querySelector('table'); if (!t) return [];
  const th = [...t.querySelectorAll('thead th')].map((x) => x.textContent.trim());
  return [...t.querySelectorAll('tbody tr')].map((tr) => {
    const td = [...tr.children].map((x) => x.textContent.trim());
    const o = {}; th.forEach((h, i) => { o[h] = td[i]; }); o._ = td; return o;
  });
}, re.source);
const formatki = (rows) => (rows || []).filter((r) => r['Długość'] != null)
  .map((r) => ({ name: r._[0], a: num(r['Długość']), b: num(r['Szerokość']), qty: num(r['Szt.']) }));
const click = async (l) => { const x = page.getByRole('button', { name: l, exact: true }); if (await x.count()) { await x.first().click(); await page.waitForTimeout(250); return true; } return false; };
const bezPowtorzen = (lista) => { const byl = new Set(); return lista.filter((s) => { const k = JSON.stringify([s.p, s.color, s.tag]); if (byl.has(k)) return false; byl.add(k); return true; }); };
const brylyZamk = async () => {
  await click('Szafka'); await click('Zamk.');
  await page.evaluate(() => { window.__audytBryl = []; });
  await click('3D');
  return bezPowtorzen(await page.evaluate(() => { const a = window.__audytBryl; window.__audytBryl = null; return (a || []).filter((s) => s.p); }));
};
const brylyOtw = async () => {
  await page.evaluate(() => { window.__audytBryl = []; });
  await click('zamknięte'); await page.waitForTimeout(250);
  const a = bezPowtorzen(await page.evaluate(() => { const x = window.__audytBryl; window.__audytBryl = null; return (x || []).filter((s) => s.p); }));
  await click('otwarte');
  return a;
};
const plyty = (sol) => sol.filter((s) => { const d = [...s.d].sort((x, y) => x - y);
  return d[0] > 0.5 && d[0] <= 40 && d[1] >= 20 && s.color !== '#3f3f46' && s.color !== METAL && !/^(uchwyt|noga)/.test(s.tag || ''); });
const opis = (q) => `${q.tag || q.color}${[...q.d].sort((x, y) => x - y).map(Math.round).join('×')}`;
const nachodzi = (sol) => {
  const s = sol.filter((q) => q.p && q.color !== '#b91c1c' && q.color !== '#b45309');
  const out = [];
  for (let i = 0; i < s.length; i++) for (let j = i + 1; j < s.length; j++) {
    const a = s[i].p, c = s[j].p;
    const ov = [0, 1, 2].map((k) => Math.min(a[k + 3], c[k + 3]) - Math.max(a[k], c[k]));
    const cienka = Math.min(...s[i].d) <= 4 || Math.min(...s[j].d) <= 4;
    const [o1, o2] = [...ov].sort((x, y) => x - y);
    if (cienka && o1 <= 4 && o2 <= 16) continue;
    if (ov.every((v) => v > 1)) out.push(`${opis(s[i])} × ${opis(s[j])} (${ov.map(Math.round).join('×')})`);
  }
  return [...new Set(out)];
};
const bok = (f, b) => Math.abs(f - b) <= 3 || (f === 60 && b < 60);
const pasuje = (p, s) => { const [, q, r] = [...s.d].sort((x, y) => x - y).map(Math.round);
  return (bok(p.a, q) && bok(p.b, r)) || (bok(p.a, r) && bok(p.b, q)); };
const bezPlyty = (parts, sol) => { const pl = plyty(sol);
  return parts.filter((p) => !/^(Cokół|Blat)/.test(p.name)).map((p) => ({ p, ile: pl.filter((s) => pasuje(p, s)).length }))
    .filter((x) => x.ile < x.p.qty).map((x) => `${x.p.name} ${x.p.a}×${x.p.b}: ${x.ile} z ${x.p.qty}`); };
const bezFormatki = (parts, sol) => plyty(sol).filter((s) => s.tag !== 'blat' && !parts.some((p) => pasuje(p, s)
  || (/^Cokół/.test(p.name) && Math.abs(p.b - [...s.d].sort((x, y) => x - y)[1]) <= 3))).map(opis);
const kolizja = (a, c) => [0, 1, 2].every((k) => Math.min(a.p[k + 3], c.p[k + 3]) - Math.max(a.p[k], c.p[k]) > 0.5);
// bledy w uwagach razem z ich przyciskami (DOM `NoteLine`: ikona × i przyciski w tej samej linii)
const bledyUwag = () => page.evaluate(() => {
  const sec = [...document.querySelectorAll('section')].find((s) => /^Uwagi/.test(s.querySelector('h2')?.textContent || ''));
  if (!sec) return [];
  return [...sec.querySelectorAll('li')].filter((li) => (li.querySelector('span.font-mono') || {}).textContent === '×')
    .map((li) => { const sp = li.querySelector('span.font-mono + span');
      const btn = [...(sp ? sp.querySelectorAll('button') : [])].map((x) => x.textContent.trim());
      const txt = sp ? [...sp.childNodes].filter((n) => n.nodeType === 3).map((n) => n.textContent).join('').trim() : li.textContent;
      return { txt, btn }; });
});
const zapis = () => page.evaluate(() => localStorage.getItem('szafki:projekt'));
const wczytaj = async (p) => {
  await page.evaluate((q) => { localStorage.clear(); localStorage.setItem('szafki:projekt', JSON.stringify(q)); }, p);
  await page.reload({ waitUntil: 'networkidle' }); await page.waitForTimeout(700);
};
// klik w przycisk przy bledzie i ponowne wczytanie (autozapis z opoznieniem)
const kliknijPrzycisk = async (txt, label) => {
  const przed = await zapis();
  const sec = page.locator('section').filter({ has: page.locator('h2', { hasText: /^Uwagi/ }) }).first();
  const li = sec.locator('li').filter({ hasText: txt.slice(0, 60) }).first();
  await li.getByRole('button', { name: label, exact: true }).first().click();
  await page.waitForFunction((p) => localStorage.getItem('szafki:projekt') !== p, przed, { timeout: 6000 }).catch(() => {});
  await page.waitForTimeout(300);
  await page.reload({ waitUntil: 'networkidle' }); await page.waitForTimeout(700);
};

const sprawdzGeometrie = async (u, cab, bl, szuflady) => {
  const H = cab.H;
    const f = formatki(await tabela(/^Formatki do zamówienia/));
    const zam = await brylyZamk();
    const otw = await brylyOtw();
    const n = nachodzi(zam);
    if (n.length) bl.push(`nachodzi: ${n.slice(0, 2).join('; ')}`);
    const razem = [...zam, ...otw.filter((q) => !zam.some((x) => x.p.join() === q.p.join()))];
    const bp = bezPlyty(f, razem);
    if (bp.length) bl.push(`formatka bez płyty: ${bp.slice(0, 2).join('; ')}`);
    const fProj = u.wCiagu ? formatki(await tabela(/^Formatki całego projektu/)).filter((r) => /ciągu/.test(r.name)) : [];
    const bf = bezFormatki([...f, ...fProj.map((r) => ({ ...r, name: 'Cokół ciągu' }))], zam);
    if (bf.length) bl.push(`płyta bez formatki: ${[...new Set(bf)].slice(0, 3).join('; ')}`);
    const korpus = zam.filter((s) => s.color === K);
    if (korpus.length) {
      const kx0 = Math.min(...korpus.map((s) => s.p[0])), kx1 = Math.max(...korpus.map((s) => s.p[3]));
      const ky0 = Math.min(...korpus.filter((s) => s.p[1] >= -1).map((s) => s.p[1])), ky1 = Math.max(...korpus.map((s) => s.p[4]));
      zam.filter((s) => s.color === F).forEach((s) => {
        if (s.p[0] < kx0 - 0.5 || s.p[3] > kx1 + 0.5 || s.p[4] > ky1 + 0.5 || s.p[1] < ky0 - 0.5)
          bl.push(`front poza obrysem: ${JSON.stringify(s.p.map(Math.round))} (korpus x ${kx0}–${kx1}, y ${ky0}–${ky1})`);
      });
      // skrzynki w bryle otwartej (metal V-BOX / prowadnice DXS, plyta polek ruchoma) poza korpusem i plecami
      const korpusO = otw.filter((s) => s.color === K || s.color === '#e7e5e4');
      const skrz = otw.filter((s) => s.tag === 'skrzynka-bok' || s.color === METAL || (s.color === P && s.p[2] < 0));
      const kol = [];
      skrz.forEach((s) => korpusO.forEach((k) => { if (kolizja(s, k)) kol.push(`${opis(s)} ${JSON.stringify(s.p.map(Math.round))} × ${opis(k)}`); }));
      if (kol.length) bl.push(`skrzynka w korpusie (${kol.length}): ${kol[0]}`);
    }
    const sym = symuluj(zam, { H, blat: u.wCiagu });
    sym.forEach((x) => { if (x.kolizje.length) bl.push(`wysuw szuflady ${x.szuflada}: ${x.kolizje[0]}`); });
    if (sym.length !== szuflady.length) bl.push(`symulacja widzi ${sym.length} szuflad z ${szuflady.length}`);
    // zamowienie: prowadnice
    const prod = (await tabela(/^Produkty do zamówienia/)) || [];
    const ile = (re) => prod.filter((r) => re.test(r._[0])).reduce((s, r) => s + num((r._[2] || '').split(' ')[0]), 0);
    const nV = szuflady.filter((d) => d.system !== 'dxs').length, nD = szuflady.filter((d) => d.system === 'dxs').length;
    const vb = ile(/^Prowadnica Sevroll V-BOX/), dx = ile(/^Prowadnica Sevroll DXS-3D/);
    if (vb !== nV || dx !== nD) bl.push(`zamówienie: prowadnice V-BOX ${vb} (szuflad ${nV}), DXS ${dx} (szuflad ${nD})`);
    // plan wiercen: kreski prowadnic — po dwie na szuflade
    await page.evaluate(() => { window.__plan = null; window.print = () => {
      const t = [...document.querySelectorAll('.print-only table')].find((x) => /Otwory pod/.test(x.querySelector('thead')?.textContent || ''));
      window.__plan = t ? [...t.querySelectorAll('tbody tr')].map((tr) => [...tr.children].map((x) => x.textContent.trim())) : [];
    }; });
    await page.getByRole('button', { name: 'Zestawienie PDF', exact: true }).first().click();
    await page.waitForFunction(() => window.__plan, null, { timeout: 5000 }).catch(() => {});
    const plan = (await page.evaluate(() => window.__plan)) || [];
    const kreski = plan.filter((r) => r[1] === 'prowadnica').reduce((s, r) => s + (r[2] === '—' ? 0 : r[2].split(',').length), 0);
    if (kreski !== 2 * szuflady.length) bl.push(`plan wierceń: ${kreski} kresek prowadnic, a szuflad ${szuflady.length}`);
};

const wyniki = [];
let nr = -1;
for (const u of uklady) {
  nr += 1;
  if (TYLKO && !TYLKO.test(u.nazwa)) continue;
  if (nr % SH_N !== SH_K) continue;
  const cab = u.cab;
  const H = cab.H;
  const p = { name: 'Macierz szuflad', active: 0, prices: {}, rooms: [{ id: 'p1', name: 'Pomieszczenie 1' }],
    runs: u.wCiagu ? [{ ...RUN, H, D: cab.D }] : [], items: [{ cab, mat: u.mat || MAT, runId: u.wCiagu ? 'c1' : null, roomId: 'p1', offset: 0 }] };
  await wczytaj(p);
  const bl = [];
  const bledy = await bledyUwag();
  const szuflady = cab.levels.flatMap((lv) => lv.cols.flatMap((c) => (c.kind === 'drawers' ? c.drawers : [])));
  if (u.zle) {
    const jest = bledy.find((e) => u.zle.test(e.txt));
    if (!jest) bl.push(`brak oczekiwanego błędu ${u.zle} (są: ${bledy.map((e) => e.txt.slice(0, 80)).join(' // ') || '—'})`);
  }
  /* bledy w ukladzie poprawnym sa podejrzane; w celowo zlym bywa ich kilka z jednej
     przyczyny (np. za duzo szuflad: brak miejsca i formatki < 30 mm) — tam liczy sie,
     czy po przyciskach naprawy nie zostaje zaden */
  const obce = u.zle ? [] : bledy;
  obce.forEach((e) => bl.push(`błąd w uwagach: ${PELNE ? e.txt : e.txt.slice(0, 150)}${e.btn.length ? ` [${e.btn.join(' / ')}]` : ''}`));
  if (!bledy.length) await sprawdzGeometrie(u, cab, bl, szuflady);
  else {
    /* Przyciski naprawy: klikamy pierwszy przycisk kazdego bledu po kolei (najwyzej
       4 kroki) — po kliknieciu ten blad ma zniknac, a nowych bledow nie przybywa. */
    for (let krok = 0; krok < 4; krok++) {
      const teraz = await bledyUwag();
      const zP = teraz.find((e) => e.btn.length);
      if (!zP) {
        if (krok === 0 && u.zle && teraz.some((e) => u.zle.test(e.txt) && !e.btn.length)) { /* blad bez przycisku — tylko informacja */ }
        break;
      }
      const label = zP.btn[0];
      await kliknijPrzycisk(zP.txt, label);
      const po = await bledyUwag();
      const tenSam = po.find((e) => e.txt === zP.txt);
      const nowe = po.filter((e) => !teraz.some((x) => x.txt === e.txt));
      if (tenSam) bl.push(`przycisk „${label}” nie usunął błędu: ${zP.txt.slice(0, 110)}`);
      if (nowe.length) bl.push(`po „${label}” nowy błąd: ${nowe.map((e) => e.txt.slice(0, 110)).join(' // ')}`);
      if (tenSam || nowe.length) break;
    }
    // bledy oczekiwane sa w porzadku; przypisujemy tylko to, co przyciski zepsuly
    // po naprawach bez bledow — geometria tego, co zostalo (projekt z localStorage)
    const zostaly = await bledyUwag();
    if (u.zle && zostaly.length && !bl.length)
      bl.push(`po przyciskach naprawy zostały błędy: ${zostaly.map((e) => e.txt.slice(0, 110) + (e.btn.length ? ` [${e.btn.join(' / ')}]` : ' [bez przycisku]')).join(' // ')}`);
    if (!zostaly.length) {
      const pPo = JSON.parse(await zapis());
      const pom = [];
      await sprawdzGeometrie(u, pPo.items[pPo.active].cab, pom, pPo.items[pPo.active].cab.levels.flatMap((lv) => lv.cols.flatMap((c) => (c.kind === 'drawers' ? c.drawers : []))));
      pom.forEach((x) => bl.push(`po naprawie: ${x}`));
    }
  }
  ok(u.nazwa, bl.length === 0, [...new Set(bl)].slice(0, 4).join(' | '));
  wyniki.push({ nazwa: u.nazwa, bl });
}
const zle = wyniki.filter((w) => w.bl.length);
console.log(`\nUkładów: ${wyniki.length} (z ${uklady.length}), z problemem: ${zle.length}`);
console.log('BLEDY STRONY:', errors.length ? [...new Set(errors)].join(' | ') : '(brak)');
await b.close();
