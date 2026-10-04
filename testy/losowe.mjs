/* Test losowych edycji (uzytkownik 2026-10-04: „test losowych edycji jak
   najbardziej, ale nie po kazdej zmianie — przed wrzuceniem na git”). Odpala sie
   w pelnym przebiegu (`testy/pelny.sh`), czyli przed scaleniem.

   Kazdy przebieg (ziarno) bierze szafke stojaca albo pod blatem w ciagu (wzor
   z aplikacji) i robi serie losowych zmian: wymiary, wnetrze (drzwi, szuflady,
   klapy, fix, blenda, kolumny, poziomy), montaz frontow, plecy, cokol, nozki,
   dno, blat, mocowanie polek, NL — czasem klika przycisk naprawy w uwagach.
   Po kazdym kroku:
   - strona nie rzuca bledem,
   - jesli aplikacja NIE zglasza bledu (×), to naprawde jest dobrze: nic na nic
     nie nachodzi, formatki zgadzaja sie z bryla w obie strony, szuflady
     wysuwaja sie bez kolizji (symulacja). Czyli: „zielone w uwagach” = prawda.
   Ziarna sa stale, wiec blad da sie powtorzyc: LOSOWE_ZIARNO=7 node testy/losowe.mjs
   (kilka: LOSOWE_ZIARNO=1,2,3; dluzej: LOSOWE_KROKOW=40; zapis projektu z bledem:
   LOSOWE_ZRZUT=katalog). */
import pw from './pw.mjs';
import { symuluj } from './symwysuw.mjs';
import fs from 'fs';
const URL = process.env.STD ? 'http://127.0.0.1:5199/standalone-local.html'
  : 'http://127.0.0.1:5205/mebloprojekt-app.html';
const ZIARNA = process.env.LOSOWE_ZIARNO ? String(process.env.LOSOWE_ZIARNO).split(',').map(Number) : [11, 23, 37];
const KROKOW = Number(process.env.LOSOWE_KROKOW || 22);
const ok = (l, c, e = '') => console.log((c ? '  OK   ' : '  BLAD ') + l + (e ? ' — ' + e : ''));
const info = (l) => console.log('  INFO ' + l);
const b = await pw.chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const page = await (await b.newContext({ viewport: { width: 1500, height: 1300 } })).newPage();
const errors = []; page.on('pageerror', (e) => errors.push(e.message));
await page.goto(URL, { waitUntil: 'networkidle' });

// kolory rol plyt — symulacja wysuwu i kontrola nachodzenia odrozniaja po nich czesci
const K = '#cc2222', F = '#2222cc', P = '#22aa22';
const MAT = {
  board: { name: 'Płyta', thickness: 18, color: K, decor: 'KORPUS' },
  front: { name: 'Płyta', thickness: 18, color: F, decor: 'FRONT' },
  shelf: { name: 'Płyta', thickness: 18, color: P, decor: 'POLKA' },
  back: { name: 'HDF', thickness: 3, color: '#e7e5e4' },
  worktop: { name: 'Blat roboczy', thickness: 38, color: '#8d7b68', depth: 600 },
};
const NL = [250, 270, 300, 350, 400, 450, 500, 550, 600];

// --- powtarzalny los (mulberry32) ---
const los = (ziarno) => { let a = ziarno >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; };

// --- narzedzia jak w `audytmacierz` ---
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
const bryly = async () => {
  await click('Szafka'); await click('Zamk.');
  await page.evaluate(() => { window.__audytBryl = []; });
  await click('3D');
  const zam = await page.evaluate(() => { const a = window.__audytBryl; window.__audytBryl = null; return (a || []).filter((s) => s.p); });
  await page.evaluate(() => { window.__audytBryl = []; });
  await click('zamknięte'); await page.waitForTimeout(250);
  const otw = await page.evaluate(() => { const a = window.__audytBryl; window.__audytBryl = null; return (a || []).filter((s) => s.p); });
  await click('otwarte');
  return { zam, otw };
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
const bezFormatki = (parts, sol) => plyty(sol).filter((s) => s.tag !== 'blat' && !parts.some((p) => pasuje(p, s)
  || (/^Cokół/.test(p.name) && Math.abs(p.b - [...s.d].sort((x, y) => x - y)[1]) <= 3))).map(opis);
const uwagi = () => page.evaluate(() => {
  const sec = [...document.querySelectorAll('section')].find((s) => /^Uwagi/.test(s.querySelector('h2')?.textContent || ''));
  if (!sec) return { err: [], warn: [] };
  const linie = sec.innerText.split('\n').map((l) => l.trim()).filter(Boolean);
  const err = [], warn = [];
  linie.forEach((l, i) => { if (l === '×' && linie[i + 1]) err.push(linie[i + 1]); if (l === '!' && linie[i + 1]) warn.push(linie[i + 1]); });
  return { err, warn };
});
// przyciski naprawy w uwagach (bez „odhacz” i zwijania)
const przyciskiNaprawy = () => page.locator('section').filter({ has: page.locator('h2', { hasText: /^Uwagi/ }) }).first()
  .locator('button').filter({ hasNotText: /^(✓|×|Pokaż|Ukryj|Zwiń|Rozwiń)/ });

// --- wzor szafki pod blatem z aplikacji ---
await page.evaluate(() => localStorage.clear()); await page.reload({ waitUntil: 'networkidle' }); await page.waitForTimeout(900);
await click('+ ciąg');
await page.locator('header .space-y-1 > div').filter({ hasText: /^Ściana 1/ }).first().getByRole('button', { name: '+ szafka', exact: true }).click();
await page.waitForTimeout(1500);
const wzor = await page.evaluate(() => JSON.parse(localStorage.getItem('szafki:projekt')));
const wzorPB = wzor.items.find((it) => it.runId).cab;
const wzorSt = wzor.items.find((it) => !it.runId).cab;
const kolWzor = (cab) => cab.levels[cab.levels.length - 1].cols[0];

/* --- losowe zmiany: kazda bierze szafke i zwraca nowa + opis --- */
const ZMIANY = [
  ['szerokość', (c, r) => { const W = 300 + 50 * Math.floor(r() * 19); return [{ ...c, W }, `W ${W}`]; }],
  ['wysokość', (c, r) => { const H = [400, 560, 720, 820, 900, 1300, 2100][Math.floor(r() * 7)]; return [{ ...c, H }, `H ${H}`]; }],
  ['głębokość', (c, r) => { const D = [300, 350, 450, 500, 560, 600][Math.floor(r() * 6)]; return [{ ...c, D }, `D ${D}`]; }],
  ['drzwi', (c, r) => { const n = 1 + Math.floor(r() * 2); return [nowaKolumna(c, { kind: 'doors', doors: n, fix: undefined, klapa: undefined }), `${n} drzwi`]; }],
  ['szuflady', (c, r) => { const n = 1 + Math.floor(r() * 4); const tall = r() < 0.3;
    return [nowaKolumna(c, { kind: 'drawers', drawers: Array.from({ length: n }, () => ({ h: 'auto', handle: true, tallBack: tall })) }), `${n} szuflady${tall ? ', podniesiony tył' : ''}`]; }],
  ['klapa', (c, r) => { const kl = r() < 0.5 ? 'gora' : 'dol'; return [nowaKolumna({ ...c, H: Math.min(c.H, 600) }, { kind: 'doors', doors: 1, klapa: kl, fix: undefined }), `klapa ${kl}, H ≤ 600`]; }],
  ['fix', (c, r) => { const side = ['left', 'right', 'top'][Math.floor(r() * 3)]; const support = side !== 'top' && r() < 0.6;
    return [nowaKolumna({ ...c, W: Math.max(c.W, 600) }, { kind: 'doors', doors: 1, hinge: side === 'left' ? 'right' : 'left', klapa: undefined,
      fix: { side, w: side === 'top' ? 120 : 150, mode: 'overlay', support, supportDepth: 100 } }), `fix ${side}${support ? ' ze wspornikiem' : ''}`]; }],
  ['dwie kolumny', (c, r) => { const W = Math.max(c.W, 800); const lv = c.levels[c.levels.length - 1];
    const k0 = { ...lv.cols[0], w: null };
    const druga = r() < 0.5 ? { ...k0, kind: 'drawers', drawers: [{ h: 'auto', handle: true }, { h: 'auto', handle: true }], fix: undefined, klapa: undefined }
      : r() < 0.5 ? { ...k0, kind: 'blenda', w: 100, fix: undefined, klapa: undefined } : { ...k0, kind: 'doors', doors: 1, fix: undefined, klapa: undefined };
    return [{ ...c, W, levels: c.levels.map((l, i) => (i === c.levels.length - 1 ? { ...l, cols: [k0, druga] } : l)) }, `dwie kolumny (${druga.kind})`]; }],
  ['dwa poziomy', (c) => { const k = kolWzor(c);
    return [{ ...c, H: Math.max(c.H, 720), levels: [{ h: 300, cols: [{ ...k, kind: 'drawers', drawers: [{ h: 'auto', handle: true }, { h: 'auto', handle: true }], fix: undefined, klapa: undefined }] },
      { h: null, cols: [{ ...k, kind: 'doors', doors: 2, fix: undefined, klapa: undefined }] }] }, 'dwa poziomy: szuflady pod drzwiami']; }],
  ['fronty', (c) => [{ ...c, frontMode: c.frontMode === 'inset' ? 'overlay' : 'inset' }, `fronty ${c.frontMode === 'inset' ? 'nakładane' : 'wpuszczane'}`]],
  ['plecy', (c, r) => { const v = [{ back: 'hdf', backGroove: { on: false } }, { back: 'hdf', backGroove: { on: true, offset: 3, depth: 16, play: 1, wreg: true } },
    { back: 'board', backPos: 'inside' }, { back: 'board', backPos: 'outside' }, { back: 'none' }][Math.floor(r() * 5)];
    return [{ ...c, ...v }, `plecy ${v.back}${v.backPos ? ' ' + v.backPos : ''}${v.backGroove && v.backGroove.on ? ' we frezie' : ''}`]; }],
  ['cokół', (c, r) => { const v = [{ on: true, height: 100, mode: 'under', setback: 0 }, { on: true, height: 100, mode: 'inside', setback: 50 }, { on: false, height: 100, mode: 'under', setback: 0 }][Math.floor(r() * 3)];
    return [{ ...c, plinth: v }, `cokół ${v.on ? v.mode : 'wył.'}`]; }],
  ['nóżki', (c) => [{ ...c, legs: { ...(c.legs || {}), height: 100, on: !(c.legs && c.legs.on) } }, `nóżki ${c.legs && c.legs.on ? 'wył.' : 'wł.'}`]],
  ['półki', (c, r) => { const m = ['pins', 'confirmat', 'trojkaty'][Math.floor(r() * 3)]; return [{ ...c, shelfMount: m }, `półki na ${m}`]; }],
  ['NL ręcznie', (c, r) => { const lv = c.levels.findIndex((l) => l.cols.some((k) => k.kind === 'drawers'));
    if (lv < 0) return [c, 'NL — brak szuflad']; const nl = NL[Math.floor(r() * NL.length)];
    return [{ ...c, levels: c.levels.map((l, i) => (i !== lv ? l : { ...l, cols: l.cols.map((k) => (k.kind !== 'drawers' ? k : { ...k, drawers: k.drawers.map((d, j) => (j === 0 ? { ...d, nl } : d)) })) })) }, `NL ${nl} w pierwszej szufladzie`]; }],
];
/* Grubosci plyt inne niz 18 — zmieniaja material szafki (nie sama szafke),
   wiec ida osobno: [mat, opis]. */
const ZMIANY_MAT = [
  ['grubość korpusu', (m, r) => { const t = [16, 18, 19][Math.floor(r() * 3)]; return [{ ...m, board: { ...m.board, thickness: t } }, `korpus ${t} mm`]; }],
  ['grubość frontów', (m, r) => { const t = [16, 18, 19, 22][Math.floor(r() * 4)]; return [{ ...m, front: { ...m.front, thickness: t } }, `fronty ${t} mm`]; }],
  ['grubość półek', (m, r) => { const t = [16, 18][Math.floor(r() * 2)]; return [{ ...m, shelf: { ...m.shelf, thickness: t } }, `półki ${t} mm`]; }],
];
const nowaKolumna = (c, o) => ({ ...c, levels: [{ h: null, cols: [{ ...kolWzor(c), w: null, ...o }] }] });
// tylko szafka wolnostojaca: dno i blat na bokach (pod blatem ciagu to nie ma sensu)
const ZMIANY_SAMA = [
  ['bez dna', (c) => [{ ...c, joints: { ...(c.joints || {}), botL: 'none', botR: 'none' } }, 'bez dna']],
  ['blat na bokach', (c, r) => { const m = r() < 0.5 ? 'worktop' : 'board';
    return [{ ...c, top: { mode: 'blat', material: m, widthMode: 'outside', overL: 10, overR: 10, overFront: 20, overBack: r() < 0.5 ? 20 : 0 },
      joints: { ...(c.joints || {}), topL: 'over', topR: 'over' } }, `blat na bokach (${m})`]; }],
];

const RUN = { id: 'c1', name: 'Ściana 1', roomId: 'p1', wallW: null, gap: 0, mountY: 0, H: 720, D: 560,
  plinth: { on: true, height: 100, mode: 'under', setback: 0 }, worktop: true, corner: null };
let wszystkie = 0, zlych = 0;
for (const ziarno of ZIARNA) {
  const r = los(ziarno);
  const wCiagu = ziarno % 2 === 1;
  let cab = { ...(wCiagu ? wzorPB : wzorSt), name: 'L' + ziarno, W: 600, H: 720, D: 560, shelfSameAsBoard: false, frontSameAsBoard: false };
  console.log(`\n== ziarno ${ziarno} — ${wCiagu ? 'pod blatem w ciągu' : 'szafka wolnostojąca'} ==`);
  const lista = wCiagu ? ZMIANY : [...ZMIANY, ...ZMIANY_SAMA];
  let mat = MAT;
  for (let k = 1; k <= KROKOW; k++) {
    let co;
    if (r() < 0.15) { const [, zm] = ZMIANY_MAT[Math.floor(r() * ZMIANY_MAT.length)]; [mat, co] = zm(mat, r); }
    else { const [, zmien] = lista[Math.floor(r() * lista.length)]; let nowa; [nowa, co] = zmien(cab, r); cab = nowa; }
    const p = { name: 'Losowe', active: 0, prices: {}, rooms: [{ id: 'p1', name: 'Pomieszczenie 1' }],
      runs: wCiagu ? [{ ...RUN, H: cab.H, D: cab.D }] : [], items: [{ cab, mat, runId: wCiagu ? 'c1' : null, roomId: 'p1', offset: 0 }] };
    const blPrzed = errors.length;
    await page.evaluate((q) => { localStorage.clear(); localStorage.setItem('szafki:projekt', JSON.stringify(q)); }, p);
    await page.reload({ waitUntil: 'networkidle' }); await page.waitForTimeout(600);
    let opisKroku = `${k}. ${co}`;
    // czasem przycisk naprawy z uwag — jak uzytkownik
    if (r() < 0.35) {
      const pr = przyciskiNaprawy();
      const n = await pr.count();
      if (n) {
        const i = Math.floor(r() * n);
        const tekst = (await pr.nth(i).textContent() || '').trim();
        await pr.nth(i).click(); await page.waitForTimeout(900);
        cab = (await page.evaluate(() => JSON.parse(localStorage.getItem('szafki:projekt')))).items[0].cab;
        opisKroku += ` + przycisk „${tekst.slice(0, 50)}”`;
      }
    }
    wszystkie++;
    const bl = [];
    if (errors.length > blPrzed) bl.push(`błąd strony: ${errors.slice(blPrzed).join('; ').slice(0, 200)}`);
    const u = await uwagi();
    if (!u.err.length) {
      // aplikacja mowi „w porzadku” — sprawdzamy, czy to prawda
      const f = formatki(await tabela(/^Formatki do zamówienia/));
      const { zam, otw } = await bryly();
      const n = nachodzi(zam);
      if (n.length) bl.push(`nachodzi: ${n.slice(0, 2).join('; ')}`);
      const razem = [...zam, ...otw.filter((q) => !zam.some((x) => x.p.join() === q.p.join()))];
      const bp = bezPlyty(f, razem);
      if (bp.length) bl.push(`formatka bez płyty: ${bp.slice(0, 2).join('; ')}`);
      const fProj = wCiagu ? formatki(await tabela(/^Formatki całego projektu/)).filter((x) => /ciągu/.test(x.name)) : [];
      const bf = bezFormatki([...f, ...fProj.map((x) => ({ ...x, name: 'Cokół ciągu' }))], zam);
      if (bf.length) bl.push(`płyta bez formatki: ${[...new Set(bf)].slice(0, 3).join('; ')}`);
      const sym = symuluj(zam, { H: cab.H, blat: wCiagu });
      sym.forEach((x) => { if (x.kolizje.length) bl.push(`wysuw szuflady ${x.szuflada}: ${x.kolizje[0]}`); });
    }
    if (bl.length) {
      zlych++;
      // LOSOWE_ZRZUT=katalog — projekt z bledem do pliku (do odtworzenia w aplikacji)
      if (process.env.LOSOWE_ZRZUT) fs.writeFileSync(`${process.env.LOSOWE_ZRZUT}/losowe-${ziarno}-${k}.json`, JSON.stringify({ ...p, items: [{ ...p.items[0], cab }] }));
      ok(`ziarno ${ziarno}, krok ${opisKroku}`, false, [...new Set(bl)].slice(0, 3).join(' | '));
      console.log('       płyty: ' + ['board', 'front', 'shelf'].map((x) => `${x} ${mat[x].thickness}`).join(', ') + '; szafka: ' + JSON.stringify({ W: cab.W, H: cab.H, D: cab.D, frontMode: cab.frontMode, back: cab.back, backPos: cab.backPos,
        plinth: cab.plinth, joints: cab.joints, top: cab.top, levels: cab.levels }).slice(0, 600));
    } else ok(`ziarno ${ziarno}, krok ${opisKroku}${u.err.length ? ` (aplikacja zgłasza błąd: ${u.err[0].slice(0, 70)})` : ''}`, true);
  }
}
console.log(`\nKroków: ${wszystkie}, z problemem: ${zlych}`);
console.log('\nBLEDY:', errors.length ? errors.join('; ') : '(brak)');
await b.close();
