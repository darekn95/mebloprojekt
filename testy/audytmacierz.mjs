/* Audyt macierzowy (analiza brakow kontroli 2026-10-04). Dotychczasowe audyty
   sprawdzaly wiele rzeczy, ale prawie zawsze na jednej konstrukcji korpusu
   (wieniec + dno + HDF przybijany + fronty nakladane) — dlatego blad szuflad
   pod blatem roboczym (bez wienca) przeszedl. Tu kazda KONSTRUKCJA korpusu
   krzyzuje sie z kazdym rodzajem WNETRZA, a na kazdym ukladzie te same,
   ogolne niezmienniki:
   1. w bryle zamknietej nic na nic nie nachodzi (jak `audyt`),
   2. kazda plyta z bryly ma formatke i kazda formatka jest w bryle (jak `audyt`),
   3. fronty mieszcza sie w obrysie korpusu (i pod blatem — pod blatem roboczym),
   4. szuflady: symulacja wysuwu (`symwysuw.mjs`) bez kolizji,
   5. uklad zbudowany poprawnie nie ma bledow (×) w uwagach — kazdy blad jest
      tu albo usterka aplikacji, albo falszywym alarmem; ostrzezenia jako INFO.
   Kolory rol plyt jak w `kolory`/`szuflady` (front F, korpus K, polki P). */
import pw from './pw.mjs';
import { symuluj } from './symwysuw.mjs';
const URL = process.env.STD ? 'http://127.0.0.1:5199/standalone-local.html'
  : 'http://127.0.0.1:5205/mebloprojekt-app.html';
const ok = (l, c, e = '') => console.log((c ? '  OK   ' : '  BLAD ') + l + (e ? ' — ' + e : ''));
const info = (l) => console.log('  INFO ' + l);
const b = await pw.chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const page = await (await b.newContext({ viewport: { width: 1500, height: 1300 } })).newPage();
const errors = []; page.on('pageerror', (e) => errors.push(e.message));
await page.goto(URL, { waitUntil: 'networkidle' });
const TYLKO = process.env.TYLKO ? new RegExp(process.env.TYLKO) : null;   // np. TYLKO='pod blatem' — do szukania przyczyny

const K = '#cc2222', F = '#2222cc', P = '#22aa22';
const MAT = {
  board: { name: 'Płyta', thickness: 18, color: K, decor: 'KORPUS' },
  front: { name: 'Płyta', thickness: 18, color: F, decor: 'FRONT' },
  shelf: { name: 'Płyta', thickness: 18, color: P, decor: 'POLKA' },
  back: { name: 'HDF', thickness: 3, color: '#e7e5e4' },
  worktop: { name: 'Blat roboczy', thickness: 38, color: '#8d7b68', depth: 600 },
};
const PL = { on: true, height: 100, mode: 'under', setback: 0 };
const kol = (o = {}) => ({ kind: 'doors', doors: 2, w: null, shelfTargets: [null, null], ...o });
const baza = (o = {}) => ({ name: 'M', W: 600, H: 720, D: 560, plinth: PL, legs: { on: true, height: 100 },
  frontSameAsBoard: false, shelfSameAsBoard: false, levels: [{ h: null, cols: [kol()] }], ...o });
// para wzmocnien pod blatem — jak `railPair` w aplikacji (plaskie z przodu, stojace przy plecach)
const PARA = [
  { orient: 'shelf', pos: 'top', side: 'left', h: 100, depth: 100, atDepth: 0, fromBack: false, reducesDoor: false },
  { orient: 'front', pos: 'top', side: 'left', h: 100, depth: 100, atDepth: 0, fromBack: true, reducesDoor: false },
];
const RUN = { id: 'c1', name: 'Ściana 1', roomId: 'p1', wallW: null, gap: 0, mountY: 0, H: 720, D: 560, plinth: PL, worktop: true, corner: null };

/* KONSTRUKCJE: [nazwa, zmiana szafki, w ciagu z blatem?]. „pod blatem” robi
   to samo co `bezWienca`: bez wienca, para wzmocnien w kazdej kolumnie
   najwyzszego poziomu. */
const KONSTRUKCJE = [
  ['stojąca', (c) => c, false],
  ['pod blatem', (c) => ({ ...c, joints: { ...(c.joints || {}), topL: 'none', topR: 'none' },
    levels: c.levels.map((lv, i) => (i === c.levels.length - 1 ? { ...lv, cols: lv.cols.map((cc) => ({ ...cc, rails: [...(cc.rails || []), ...PARA] })) } : lv)) }), true],
  ['wisząca', (c) => ({ ...c, D: 300, plinth: { ...PL, on: false }, legs: { on: false }, hangerMode: 'listwa' }), false],
  ['cokół w obrysie', (c) => ({ ...c, plinth: { ...PL, mode: 'inbody' } }), false],
  ['plecy z płyty', (c) => ({ ...c, back: 'board', backPos: 'inside' }), false],
  ['HDF we frezie', (c) => ({ ...c, backGroove: { on: true, offset: 3, depth: 16, play: 1, wreg: true } }), false],
  ['fronty wpuszczane', (c) => ({ ...c, frontMode: 'inset' }), false],
  ['blat na bokach', (c) => ({ ...c, top: { mode: 'blat', widthMode: 'inside', overL: 0, overR: 0, overFront: 20, overBack: 0 },
    joints: { ...(c.joints || {}), topL: 'over', topR: 'over' } }), false],
  ['bez dna (na nóżkach)', (c) => ({ ...c, plinth: { ...PL, on: false }, joints: { ...(c.joints || {}), botL: 'none', botR: 'none' } }), false],
];
const szuf = (n, o = {}) => Array.from({ length: n }, () => ({ h: 'auto', front: null, handle: true, ...o }));
const WNETRZA = [
  ['drzwi 2 + półki', (c) => c],
  ['3 szuflady', (c) => ({ ...c, levels: [{ h: null, cols: [{ ...kol(), kind: 'drawers', drawers: szuf(3) }] }] })],
  ['3 szuflady, podniesiony tył', (c) => ({ ...c, levels: [{ h: null, cols: [{ ...kol(), kind: 'drawers', drawers: szuf(3, { tallBack: true }) }] }] })],
  ['klapa do góry', (c) => ({ ...c, H: 400, levels: [{ h: null, cols: [kol({ doors: 1, klapa: 'gora' })] }] })],
  ['klapa w dół', (c) => ({ ...c, H: 400, levels: [{ h: null, cols: [kol({ doors: 1, klapa: 'dol' })] }] })],
  ['szuflady + drzwi wyżej (2 poziomy)', (c) => ({ ...c, levels: [{ h: 300, cols: [{ ...kol(), kind: 'drawers', drawers: szuf(2) }] }, { h: null, cols: [kol({ doors: 1 })] }] })],
  ['szuflady obok drzwi (2 kolumny)', (c) => ({ ...c, W: 900, levels: [{ h: null, cols: [{ ...kol(), kind: 'drawers', w: 450, drawers: szuf(3) }, kol({ doors: 1 })] }] })],
  ['fix ze wspornikiem + drzwi', (c) => ({ ...c, W: 800, levels: [{ h: null, cols: [kol({ doors: 1, fix: { side: 'left', w: 200, mode: 'overlay', support: true, supportDepth: 100 } })] }] })],
  ['blenda + drzwi', (c) => ({ ...c, W: 800, levels: [{ h: null, cols: [kol({ doors: 1 }), { ...kol(), kind: 'blenda', w: 100 }] }] })],
  ['drzwi + fix u góry', (c) => ({ ...c, levels: [{ h: null, cols: [kol({ doors: 2, fix: { side: 'top', w: 120, mode: 'overlay' } })] }] })],
  ['jedne drzwi z lustrem', (c) => ({ ...c, levels: [{ h: null, cols: [kol({ doors: 1, mirrors: [true] })] }] })],
];

// --- narzedzia z `audyt` (bryly, formatki) ---
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
const click = async (l) => { const x = page.getByRole('button', { name: l, exact: true }); if (await x.count()) { await x.first().click(); await page.waitForTimeout(300); return true; } return false; };
const brylyZamk = async () => {
  await click('Szafka'); await click('Zamk.');
  await page.evaluate(() => { window.__audytBryl = []; });
  await click('3D');
  return page.evaluate(() => { const a = window.__audytBryl; window.__audytBryl = null; return (a || []).filter((s) => s.p); });
};
const brylyOtw = async () => {
  await page.evaluate(() => { window.__audytBryl = []; });
  await click('zamknięte'); await page.waitForTimeout(300);
  const a = await page.evaluate(() => { const x = window.__audytBryl; window.__audytBryl = null; return (x || []).filter((s) => s.p); });
  await click('otwarte');
  return a;
};
const plyty = (sol) => sol.filter((s) => { const d = [...s.d].sort((x, y) => x - y);
  return d[0] > 0.5 && d[0] <= 40 && d[1] >= 20 && s.color !== '#3f3f46' && s.color !== '#8b8b93' && !/^(uchwyt|noga)/.test(s.tag || ''); });
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
const pasuje = (p, s) => { const [, q, r] = [...s.d].sort((x, y) => x - y).map(Math.round);
  return (Math.abs(p.a - q) <= 3 && Math.abs(p.b - r) <= 3) || (Math.abs(p.a - r) <= 3 && Math.abs(p.b - q) <= 3); };
const bezPlyty = (parts, sol) => { const pl = plyty(sol);
  return parts.filter((p) => !/^(Cokół|Blat)/.test(p.name)).map((p) => ({ p, ile: pl.filter((s) => pasuje(p, s)).length }))
    .filter((x) => x.ile < x.p.qty).map((x) => `${x.p.name} ${x.p.a}×${x.p.b}: ${x.ile} z ${x.p.qty}`); };
const bezFormatki = (parts, sol) => plyty(sol).filter((s) => !parts.some((p) => pasuje(p, s)
  || (/^Cokół/.test(p.name) && Math.abs(p.b - [...s.d].sort((x, y) => x - y)[1]) <= 3))).map(opis);
const uwagi = () => page.evaluate(() => {
  const sec = [...document.querySelectorAll('section')].find((s) => /^Uwagi/.test(s.querySelector('h2')?.textContent || ''));
  if (!sec) return { err: [], warn: [] };
  const linie = sec.innerText.split('\n').map((l) => l.trim()).filter(Boolean);
  const err = [], warn = [];
  linie.forEach((l, i) => { if (l === '×' && linie[i + 1]) err.push(linie[i + 1]); if (l === '!' && linie[i + 1]) warn.push(linie[i + 1]); });
  return { err, warn };
});

/* Uklady, ktore naprawde nie maja sensu — aplikacja ma je zglosic bledem
   (i to jest tu sprawdzane, a nie przepuszczane). */
const OCZEKIWANE = {
  'bez dna (na nóżkach) × klapa w dół': /klapa w dół nie ma w czym zawiesić zawiasów/,
};
const podsumowanie = [];
for (const [kNazwa, kZmien, wCiagu] of KONSTRUKCJE) {
  for (const [wNazwa, wZmien] of WNETRZA) {
    const nazwa = `${kNazwa} × ${wNazwa}`;
    if (TYLKO && !TYLKO.test(nazwa)) continue;
    // wnetrze najpierw, konstrukcja na wierzch (pod blatem: wzmocnienia w najwyzszym poziomie)
    const cab = kZmien(wZmien(baza()));
    const H = cab.H;
    const p = { name: 'Macierz', active: 0, prices: {}, rooms: [{ id: 'p1', name: 'Pomieszczenie 1' }],
      runs: wCiagu ? [{ ...RUN, H }] : [], items: [{ cab, mat: MAT, runId: wCiagu ? 'c1' : null, roomId: 'p1', offset: 0 }] };
    await page.evaluate((q) => { localStorage.clear(); localStorage.setItem('szafki:projekt', JSON.stringify(q)); }, p);
    await page.reload({ waitUntil: 'networkidle' }); await page.waitForTimeout(800);
    const bl = [];
    const f = formatki(await tabela(/^Formatki do zamówienia/));
    const zam = await brylyZamk();
    const otw = await brylyOtw();
    // 1. nachodzenie
    const n = nachodzi(zam);
    if (n.length) bl.push(`nachodzi: ${n.slice(0, 2).join('; ')}`);
    // 2. formatki ↔ bryla (szuflady widac w bryle otwartej)
    const razem = [...zam, ...otw.filter((q) => !zam.some((x) => x.p.join() === q.p.join()))];
    const bp = bezPlyty(f, razem);
    if (bp.length) bl.push(`formatka bez płyty: ${bp.slice(0, 2).join('; ')}`);
    // cokol i blat ciagu sa na liscie calego projektu, nie szafki
    const fProj = wCiagu ? formatki(await tabela(/^Formatki całego projektu/)).filter((r) => /ciągu/.test(r.name)) : [];
    const bf = bezFormatki([...f, ...fProj.map((r) => ({ ...r, name: 'Cokół ciągu' }))], zam);
    if (bf.length) bl.push(`płyta bez formatki: ${[...new Set(bf)].slice(0, 3).join('; ')}`);
    // 3. fronty w obrysie korpusu (szerokosc, od dolu korpusu do gory, pod blatem 1 mm ponizej gory)
    const korpus = zam.filter((s) => s.color === K);
    if (korpus.length) {
      const kx0 = Math.min(...korpus.map((s) => s.p[0])), kx1 = Math.max(...korpus.map((s) => s.p[3]));
      const ky0 = Math.min(...korpus.filter((s) => s.p[1] >= -1).map((s) => s.p[1])), ky1 = Math.max(...korpus.map((s) => s.p[4]));
      // nic nie wychodzi ponad korpus (pod blatem: w blat); elementy stale moga dojsc do samej gory
      const gora = ky1 + 0.5;
      zam.filter((s) => s.color === F).forEach((s) => {
        if (s.p[0] < kx0 - 0.5 || s.p[3] > kx1 + 0.5 || s.p[4] > gora || s.p[1] < ky0 - 0.5)
          bl.push(`front poza obrysem: ${JSON.stringify(s.p.map(Math.round))} (korpus x ${kx0}–${kx1}, y ${ky0}–${gora})`);
      });
    }
    // 4. szuflady: symulacja wysuwu
    const sym = symuluj(zam, { H, blat: wCiagu });
    sym.forEach((x) => { if (x.kolizje.length) bl.push(`wysuw szuflady ${x.szuflada}: ${x.kolizje[0]}`); });
    /* 5. plan wiercen (PDF): kazda plyta z planu jest w formatkach — scisle:
       „Wieniec” tylko, gdy jest wieniec, „Dno” tylko, gdy jest dno (stara
       kontrola w `audytwierc` laczyla je i przepuszczala zawiasy klapy
       w nieistniejacym wiencu) */
    await page.evaluate(() => { window.__plan = null; window.print = () => {
      const t = [...document.querySelectorAll('.print-only table')].find((x) => /Otwory pod/.test(x.querySelector('thead')?.textContent || ''));
      const fm = [...document.querySelectorAll('.print-only table')].find((x) => /Długość/.test(x.querySelector('thead')?.textContent || ''));
      window.__plan = { rows: t ? [...t.querySelectorAll('tbody tr')].map((tr) => tr.children[0].textContent.trim()).filter(Boolean) : [],
        fm: fm ? [...fm.querySelectorAll('tbody tr')].map((tr) => tr.children[0].textContent.trim()) : [] };
    }; });
    await page.getByRole('button', { name: 'Zestawienie PDF', exact: true }).first().click(); await page.waitForTimeout(900);
    const plan = await page.evaluate(() => window.__plan) || { rows: [], fm: [] };
    const nazwyF = [...plan.fm, ...f.map((r) => r.name)];
    const jest = (panel) => {
      const n = panel.replace(/^Poziom \d+ — /, '');
      const re = /^Bok (lewy|prawy)$/.test(n) ? /^Bok/ : /^Wieniec$/.test(n) ? /wieniec|Wieniec/ : /^Dno$/.test(n) ? /^Dno(?! szuflady)/
        : /^Przegroda/.test(n) ? /^Przegroda/ : /^Wspornik/.test(n) ? /^Wspornik pionowy/
        : /^Półka przelotowa/.test(n) ? /^Półka przelotowa/ : new RegExp('^' + n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
      return nazwyF.some((x) => re.test(x));
    };
    [...new Set(plan.rows)].filter((pnl) => !jest(pnl)).forEach((pnl) => bl.push(`plan wierceń w płycie spoza formatek: „${pnl}”`));
    // 6. bledy w uwagach
    const u = await uwagi();
    const oczek = OCZEKIWANE[nazwa];
    if (oczek && !u.err.some((e) => oczek.test(e))) bl.push(`brak oczekiwanego błędu ${oczek}`);
    u.err.filter((e) => !(oczek && oczek.test(e))).forEach((e) => bl.push(`błąd w uwagach: ${e.slice(0, 140)}`));
    if (u.warn.length) info(`${nazwa}: ostrzeżenia: ${u.warn.map((w) => w.slice(0, 90)).join(' | ')}`);
    ok(nazwa, bl.length === 0, [...new Set(bl)].slice(0, 4).join(' | '));
    podsumowanie.push({ nazwa, bl });
  }
}
/* Wymiary skrajne — kazdy z nich na zwyklej konstrukcji i pod blatem. */
const SKRAJNE = [
  ['wąska 300, jedne drzwi', (c) => ({ ...c, W: 300, levels: [{ h: null, cols: [kol({ doors: 1 })] }] })],
  ['szeroka 1200, dwoje drzwi', (c) => ({ ...c, W: 1200 })],
  ['wąska 450, 3 szuflady', (c) => ({ ...c, W: 450, levels: [{ h: null, cols: [{ ...kol(), kind: 'drawers', drawers: szuf(3) }] }] })],
  ['płytka 350, 2 szuflady', (c) => ({ ...c, D: 350, levels: [{ h: null, cols: [{ ...kol(), kind: 'drawers', drawers: szuf(2) }] }] })],
  ['niska 400, 2 szuflady', (c) => ({ ...c, H: 400, levels: [{ h: null, cols: [{ ...kol(), kind: 'drawers', drawers: szuf(2) }] }] })],
  ['słupek 2100, 3 poziomy', (c) => ({ ...c, H: 2100, levels: [{ h: 700, cols: [{ ...kol(), kind: 'drawers', drawers: szuf(3) }] }, { h: 700, cols: [kol()] }, { h: null, cols: [kol()] }] })],
];
for (const [kNazwa, kZmien, wCiagu] of KONSTRUKCJE.filter(([n]) => n === 'stojąca' || n === 'pod blatem')) {
  for (const [wNazwa, wZmien] of SKRAJNE) {
    const nazwa = `${kNazwa} × ${wNazwa}`;
    if (TYLKO && !TYLKO.test(nazwa)) continue;
    const cab = kZmien(wZmien(baza()));
    const H = cab.H;
    const p = { name: 'Macierz', active: 0, prices: {}, rooms: [{ id: 'p1', name: 'Pomieszczenie 1' }],
      runs: wCiagu ? [{ ...RUN, H, D: cab.D }] : [], items: [{ cab, mat: MAT, runId: wCiagu ? 'c1' : null, roomId: 'p1', offset: 0 }] };
    await page.evaluate((q) => { localStorage.clear(); localStorage.setItem('szafki:projekt', JSON.stringify(q)); }, p);
    await page.reload({ waitUntil: 'networkidle' }); await page.waitForTimeout(800);
    const bl = [];
    const f = formatki(await tabela(/^Formatki do zamówienia/));
    const zam = await brylyZamk();
    const otw = await brylyOtw();
    const n = nachodzi(zam);
    if (n.length) bl.push(`nachodzi: ${n.slice(0, 2).join('; ')}`);
    const razem = [...zam, ...otw.filter((q) => !zam.some((x) => x.p.join() === q.p.join()))];
    const bp = bezPlyty(f, razem);
    if (bp.length) bl.push(`formatka bez płyty: ${bp.slice(0, 2).join('; ')}`);
    const fProj = wCiagu ? formatki(await tabela(/^Formatki całego projektu/)).filter((r) => /ciągu/.test(r.name)) : [];
    const bf = bezFormatki([...f, ...fProj.map((r) => ({ ...r, name: 'Cokół ciągu' }))], zam);
    if (bf.length) bl.push(`płyta bez formatki: ${[...new Set(bf)].slice(0, 3).join('; ')}`);
    const sym = symuluj(zam, { H, blat: wCiagu });
    sym.forEach((x) => { if (x.kolizje.length) bl.push(`wysuw szuflady ${x.szuflada}: ${x.kolizje[0]}`); });
    const u = await uwagi();
    u.err.forEach((e) => bl.push(`błąd w uwagach: ${e.slice(0, 140)}`));
    if (u.warn.length) info(`${nazwa}: ostrzeżenia: ${u.warn.map((w) => w.slice(0, 90)).join(' | ')}`);
    ok(nazwa, bl.length === 0, [...new Set(bl)].slice(0, 4).join(' | '));
    podsumowanie.push({ nazwa, bl });
  }
}

const zle = podsumowanie.filter((x) => x.bl.length);
console.log(`\nUkładów: ${podsumowanie.length}, z problemem: ${zle.length}`);
console.log('\nBLEDY:', errors.length ? errors.join('; ') : '(brak)');
await b.close();
