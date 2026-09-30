/* Audyt kolorow i plyt (prosba uzytkownika 2026-09-30: „czy nie ma problemow
   z kolorowaniem i ich zaleznosciami we wszystkich miejscach”, po zgloszeniu
   wstawki „w kolorze wlasnym” zamiast frontu).
   Kazda rola plyty ma wlasny, latwy do wylapania kolor i dekor:
     korpus #cc2222 KORPUS, front #2222cc FRONT, polki #22aa22 POLKA.
   Scenariusze przelacznikow szafki:
     A: realne kolory, fronty i polki z plyty korpusu — nigdzie (rysunki
        wszystkich zakresow i widokow, 3D, PDF, formatki, rozkroj) nie moze byc
        ani koloru frontu, ani polek: wszystko idzie z korpusu;
     B: realne kolory, fronty i polki z wlasnych plyt — kazda formatka ma plyte
        swojej roli (front / polka / korpus), a rysunki pokazuja wszystkie trzy;
     C: „Rozróżnij fronty” (schemat), fronty i polki z korpusu — na rysunkach
        fronty w kolorze wyroznienia, ale formatki i rozkroj z korpusu, a koloru
        polek nie ma nigdzie.
   Uklad w dwoch pomieszczeniach: kuchnia z szafka w L (ramie, katownik w tylnym
   narozniku, katownik narożnika z maskownicami), szufladami, blenda, klapa
   w gornym ciagu; drugie pomieszczenie ze slepym rogiem i wstawka. */
import pw from './pw.mjs';
const URL = process.env.STD ? 'http://127.0.0.1:5199/standalone-local.html'
  : 'http://127.0.0.1:5205/mebloprojekt-app.html';
const ok = (l, c, e = '') => console.log((c ? '  OK   ' : '  BLAD ') + l + (e ? ' — ' + e : ''));
const b = await pw.chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const page = await (await b.newContext({ viewport: { width: 1500, height: 1300 } })).newPage();
const errors = []; page.on('pageerror', (e) => errors.push(e.message));
await page.goto(URL, { waitUntil: 'networkidle' });

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
const sz = (name, o = {}) => ({ name, W: 600, H: 720, D: 560, plinth: PL, legs: { on: true, height: 100 },
  levels: [{ h: null, cols: [kol()] }], ...o });
const wisz = (name, o = {}) => sz(name, { D: 300, plinth: { ...PL, on: false }, legs: { on: false }, hangerMode: 'listwa', ...o });
const RUN = (id, name, roomId, o = {}) => ({ id, name, roomId, wallW: null, gap: 0, mountY: 0, H: 720, D: 560, plinth: PL, worktop: true, corner: null, ...o });
const USTAWIONA = { levels: [{ h: null, cols: [{ kind: 'doors', doors: 1, w: null,
  fix: { side: 'left', w: 608, mode: 'overlay', support: false }, hinge: 'right' }] }] };

const S = '#cc8800';   // fronty sasiedniej sciany w scenariuszu D
const MAT_SASIAD = { ...MAT, front: { name: 'Płyta', thickness: 18, color: S, decor: 'SASIAD' } };
const projekt = (flags, inne = {}) => {
  const it = (cab, runId) => ({ cab: { ...cab, ...flags, ...((inne[cab.name] || {}).cab || {}) },
    mat: (inne[cab.name] || {}).mat || MAT, runId, offset: 0 });
  return { name: 'Kolory', active: 0, prices: {},
    rooms: [{ id: 'p1', name: 'Kuchnia' }, { id: 'p2', name: 'Łazienka' }],
    runs: [RUN('c1', 'Ściana 1', 'p1'), RUN('c2', 'Ściana 2', 'p1', { corner: { of: 'c1', at: 'end', owner: 'self', clear: 0 } }),
      RUN('u1', 'Ściana 1', 'p1', { tier: 'gorny', wall: 'c1', D: 300, H: 720, plinth: null, worktop: false, mountY: 1440 }),
      RUN('c3', 'Ściana 1', 'p2'), RUN('c4', 'Ściana 2', 'p2', { corner: { of: 'c3', at: 'end', owner: 'self', clear: 0, wstawka: { typ: 'plaska', w: 60 } } })],
    items: [
      it(sz('A1', { levels: [{ h: null, cols: [{ ...kol(), kind: 'drawers', drawers: [{ h: 'auto' }, { h: 'auto' }, { h: 'auto' }] }] }] }), 'c1'),
      it(sz('A2', { W: 800, topFiller: { on: true, height: 80 }, levels: [{ h: null, cols: [kol({ doors: 1 }), { ...kol(), kind: 'blenda', w: 100 }] }] }), 'c1'),
      it(sz('L', { W: 900, corner: { on: true, arm: 640, doors: 'wsporniki', post: { on: true, w: 150 } }, levels: [{ h: null, cols: [kol({ doors: 1 })] }] }), 'c2'),
      it(sz('B2'), 'c2'),
      it(wisz('G1', { W: 800, H: 400, levels: [{ h: null, cols: [kol({ doors: 1, klapa: 'gora' })] }] }), 'u1'),
      it(sz('W1'), 'c3'), it(sz('W2'), 'c3'),
      it(sz('rog', { W: 1000, ...USTAWIONA }), 'c4'), it(sz('W3'), 'c4'),
    ] };
};

// kolory na rysunku: fill (takze tekstury url(#grv<hex>)) z SVG „Rysunek”
const koloryRysunku = (sel) => page.evaluate((sel) => {
  const out = {};
  const hex = (v) => {
    if (!v) return null;
    v = v.trim().toLowerCase();
    const g = /url\(#gr[hv]([0-9a-f]{6})\)/.exec(v);
    if (g) return '#' + g[1];
    if (/^#[0-9a-f]{6}$/.test(v)) return v;
    return null;
  };
  document.querySelectorAll(sel).forEach((svg) => svg.querySelectorAll('[fill]').forEach((e) => {
    const h = hex(e.getAttribute('fill'));
    if (!h) return;
    // etykieta: najblizszy data-el albo tag
    let el = ''; for (let x = e; x && x !== svg && !el; x = x.parentElement) el = x.getAttribute('data-el') || '';
    const k = h + (el ? ' [' + el + ']' : '');
    out[k] = (out[k] || 0) + 1;
  }));
  return out;
}, sel);
const click = async (l) => { const x = page.getByRole('button', { name: l, exact: true }); if (await x.count()) { await x.first().click(); await page.waitForTimeout(300); return true; } return false; };
const bryly = () => page.evaluate(() => { const x = window.__audytBryl; window.__audytBryl = null; return (x || []).map((s) => (s.color || '').toLowerCase() + (s.tag ? ' [' + s.tag + ']' : '')); });
const aktywuj = async (nazwa) => {
  await page.locator('header button', { hasText: new RegExp('^' + nazwa + '$') }).first().click(); await page.waitForTimeout(300);
};
const pokoj = async (n) => { await page.locator('[data-pasek="pomieszczenia"] [data-pokoj] button', { hasText: n }).first().click(); await page.waitForTimeout(400); };

// wszystkie widoki: zakres „Szafka” dla szafek z kazdym rodzajem elementu, potem „Zabudowa”
const rysunki = async () => {
  const zebrane = []; // { gdzie, kolory: {kolor: n} }
  const widoki = async (gdzie, lista) => {
    for (const w of lista) {
      if (!(await click(w))) continue;
      if (w === '3D') {
        await page.evaluate(() => { window.__audytBryl = []; });
        await click('Zamk.'); await click('3D');
        const z = page.getByRole('button', { name: 'otwarte', exact: true });
        if (await z.count()) { await z.first().click(); await page.waitForTimeout(350); }
        const br = await bryly();
        const k = {}; br.forEach((c) => { k[c] = (k[c] || 0) + 1; });
        zebrane.push({ gdzie: gdzie + ' / 3D (bryły)', kolory: k });
        const zz = page.getByRole('button', { name: 'zamknięte', exact: true });
        if (await zz.count()) { await zz.first().click(); await page.waitForTimeout(200); }
      }
      zebrane.push({ gdzie: gdzie + ' / ' + w, kolory: await koloryRysunku('#rysunek svg') });
    }
  };
  for (const [room, szafki] of [['Kuchnia', ['A1', 'A2', 'L', 'G1']], ['Łazienka', ['W2', 'rog']]]) {
    await pokoj(room);
    for (const s of szafki) {
      await aktywuj(s); await click('Szafka');
      await widoki(`${room} / ${s}`, ['Zamk.', 'Otw.', 'Z boku', 'Z góry', 'Z tyłu', '3D']);
    }
    if (await click('Zabudowa')) await widoki(`${room} / zabudowa`, ['Zamk.', 'Otw.', 'Z góry', 'Z tyłu', '3D', '45°']);
    await click('Szafka');
  }
  return zebrane;
};
const pdf = async () => {
  await page.evaluate(() => {
    window.__pdfKolory = null;
    window.print = () => {
      const rep = document.querySelector('.print-only');
      if (!rep) return;
      const out = {};
      rep.querySelectorAll('svg [fill]').forEach((e) => {
        let v = (e.getAttribute('fill') || '').toLowerCase();
        const g = /url\(#gr[hv]([0-9a-f]{6})\)/.exec(v); if (g) v = '#' + g[1];
        if (/^#[0-9a-f]{6}$/.test(v)) out[v] = (out[v] || 0) + 1;
      });
      window.__pdfKolory = { kolory: out, tekst: rep.innerText };
    };
  });
  await click('Zestawienie PDF'); await page.waitForTimeout(2500);
  return page.evaluate(() => window.__pdfKolory);
};
const formatki = () => page.evaluate(() => {
  const sec = [...document.querySelectorAll('section')].find((s) => /^Formatki całego projektu/.test(s.querySelector('h2')?.textContent || ''));
  if (!sec) return [];
  return [...sec.querySelectorAll('tbody tr')].map((tr) => [...tr.children].map((x) => x.textContent.trim()))
    .filter((r) => r.length > 3 && /^Płyta/.test(r[2])).map((r) => ({ nazwa: r[0], plyta: r[2] }));
});
const rozkroj = async () => {
  await page.waitForFunction(() => window.__audytRozkroj && window.__audytRozkroj.aktualny, null, { timeout: 15000 }); // rozkroj cały czas, bez przycisku (2026-09-30)
  return page.evaluate(() => (window.__audytRozkroj ? window.__audytRozkroj.groups.map((g) => g.matLabel) : null));
};
const wczytaj = async (flags, inne) => {
  await page.evaluate((q) => { localStorage.clear(); localStorage.setItem('szafki:projekt', JSON.stringify(q)); }, projekt(flags, inne));
  await page.reload({ waitUntil: 'networkidle' }); await page.waitForTimeout(1500);
};
// gdzie wystepuje dany kolor (do opisu bledu)
const gdzieKolor = (zebrane, c) => zebrane.flatMap((z) => Object.keys(z.kolory).filter((k) => k.startsWith(c))
  .map((k) => `${z.gdzie}: ${k.slice(7).trim() || 'bez znacznika'} ×${z.kolory[k]}`));

/* Rola kazdej formatki: front / polka / korpus. Tu jest regula, ktorej pilnujemy:
   co widac z przodu jak front, to front; to, na czym sie cos stawia — polka. */
/* Ustalone z uzytkownikiem 2026-09-30: blenda nad szafka jak fronty; katownik
   w tylnym narozniku szafki L i tyl szuflady — z plyty polek (jak dno). */
const ROLA = [
  [/^(Drzwi|Klapa|Front szuflady|Front ramienia|Fix ramienia|Maskownica kątownika|Wstawka w rogu|Blenda|Element stały)/, 'FRONT'],
  [/^(Półka|Dno szuflady|Tył szuflady|Kątownik przy ramieniu)/, 'POLKA'],
];
const rolaOf = (n) => (ROLA.find(([re]) => re.test(n)) || [null, 'KORPUS'])[1];

for (const [nazwa, flags, dozwolone, rolaFormatki] of [
  ['A: realne kolory, fronty i półki z płyty korpusu', { realColors: true, frontSameAsBoard: true, shelfSameAsBoard: true }, [K], () => 'KORPUS'],
  ['B: realne kolory, fronty i półki z własnych płyt', { realColors: true, frontSameAsBoard: false, shelfSameAsBoard: false }, [K, F, P], rolaOf],
  ['C: „Rozróżnij fronty”, fronty i półki z płyty korpusu', { realColors: false, frontSameAsBoard: true, shelfSameAsBoard: true }, [K, F], () => 'KORPUS'],
]) {
  console.log(`\n== ${nazwa} ==`);
  await wczytaj(flags);
  const zeb = await rysunki();
  const wszystkie = new Set(zeb.flatMap((z) => Object.keys(z.kolory).map((k) => k.slice(0, 7))));
  const zakazane = [K, F, P].filter((c) => !dozwolone.includes(c));
  zakazane.forEach((c) => {
    const g = gdzieKolor(zeb, c);
    ok(`rysunki: brak koloru ${c === F ? 'frontu' : 'półek'} (${c})`, g.length === 0, g.slice(0, 12).join(' | ') + (g.length > 12 ? ` … (+${g.length - 12})` : ''));
  });
  dozwolone.forEach((c) => ok(`rysunki: kolor ${c === K ? 'korpusu' : c === F ? 'frontu' : 'półek'} jest (${c})`, wszystkie.has(c)));
  // skrzynka szuflady (z boku): dno i tyl z plyty polek — jak w formatkach
  const skr = zeb.filter((z) => /A1 \/ Z boku$/.test(z.gdzie)).flatMap((z) => Object.keys(z.kolory).filter((k) => /\[skrzynka\]/.test(k)).map((k) => k.slice(0, 7)));
  const pol = flags.shelfSameAsBoard ? K : P;
  ok(`skrzynka szuflady z boku: dno i tył w kolorze płyty półek (${pol})`, skr.includes(pol) && !skr.includes(pol === K ? P : K), skr.join(', '));
  ok(`obejrzane widoki: ${zeb.length}`, zeb.length >= 40, String(zeb.length));

  // formatki calego projektu: kazda z plyty swojej roli
  await page.locator('[data-pasek="pomieszczenia"]').getByRole('button', { name: 'Cały projekt' }).click().catch(() => {});
  const f = await formatki();
  const zle = f.filter((r) => !r.plyta.includes(rolaFormatki(r.nazwa)));
  ok(`formatki: ${f.length} pozycji z płyty swojej roli`, f.length > 20 && zle.length === 0,
    zle.map((r) => `${r.nazwa} → ${r.plyta} (ma być ${rolaFormatki(r.nazwa)})`).join(' | '));
  const rk = await rozkroj();
  const oczek = [...new Set(f.map((r) => r.plyta))].sort();
  ok('rozkrój: arkusze tych samych płyt co formatki', !!rk && JSON.stringify([...new Set(rk.filter((l) => /^Płyta/.test(l)))].sort()) === JSON.stringify(oczek),
    `rozkrój ${JSON.stringify(rk)}, formatki ${JSON.stringify(oczek)}`);

  // formatki w karcie szafki w L = te same plyty co w liscie projektu (ramie, maskownice)
  await pokoj('Kuchnia'); await aktywuj('L');
  const karta = await page.evaluate(() => {
    const sec = [...document.querySelectorAll('section')].find((s) => /^Formatki do zamówienia/.test(s.querySelector('h2')?.textContent || ''));
    return sec ? [...sec.querySelectorAll('tbody tr')].map((tr) => [...tr.children].map((x) => x.textContent.trim())) : [];
  });
  const plytaW = (rows, i) => (rows.find((r) => r.some((x) => /^Płyta/.test(x))) ? rows : rows);
  void plytaW;
  const kartaZle = karta.filter((r) => r.length > 2).map((r) => ({ nazwa: r[0], plyta: r.find((x) => /^Płyta /.test(x)) || '' }))
    .filter((r) => r.plyta && !r.plyta.includes(rolaFormatki(r.nazwa)));
  ok('karta szafki w L: formatki (z ramieniem) z płyty swojej roli', kartaZle.length === 0,
    kartaZle.map((r) => `${r.nazwa} → ${r.plyta}`).join(' | '));

  // PDF: realne kolory (wydruk zawsze w realnych) — zakazane jak w A/B
  const p = await pdf();
  // wydruk: widok zamkniety w realnych kolorach, reszta jak ustawienie szafki
  const zakPdf = [K, F, P].filter((c) => !(flags.frontSameAsBoard ? (flags.realColors ? [K] : [K, F]) : [K, F, P]).includes(c));
  zakPdf.forEach((c) => ok(`PDF: brak koloru ${c === F ? 'frontu' : 'półek'}`, !!p && !p.kolory[c], p ? `×${p.kolory[c] || 0}` : 'brak wydruku'));
}

console.log('\n== D: sąsiednia ściana z innymi frontami — front ramienia z jej płyty ==');
/* Ramie szafki L lezy w pasie sciany 1 przy szafce A2. A2 ma fronty z wlasnej
   plyty (SASIAD), reszta z plyty korpusu: front ramienia z plyty A2, maskownice
   katownika i reszta ramienia — z szafki w rogu (uzytkownik 2026-09-30). */
await wczytaj({ realColors: true, frontSameAsBoard: true, shelfSameAsBoard: true },
  { A2: { mat: MAT_SASIAD, cab: { frontSameAsBoard: false } } });
const wiersze = async (re) => page.evaluate((src) => {
  const sec = [...document.querySelectorAll('section')].find((s) => new RegExp(src).test(s.querySelector('h2')?.textContent || ''));
  return sec ? [...sec.querySelectorAll('tbody tr')].map((tr) => [...tr.children].map((x) => x.textContent.trim())) : [];
}, re.source);
const plytaWiersza = (rows, re) => ((rows.find((r) => re.test(r[0])) || []).find((x) => /^Płyta /.test(x)) || '');
let rows = await wiersze(/^Formatki całego projektu/);
ok('lista projektu: front ramienia z płyty sąsiedniej ściany', /SASIAD/.test(plytaWiersza(rows, /^Front ramienia/)), plytaWiersza(rows, /^Front ramienia/));
ok('lista projektu: maskownice kątownika z płyty szafki w L', /KORPUS/.test(plytaWiersza(rows, /^Maskownica kątownika/)), plytaWiersza(rows, /^Maskownica kątownika/));
ok('lista projektu: bok ramienia z płyty szafki w L', /KORPUS/.test(plytaWiersza(rows, /^Bok ramienia/)), plytaWiersza(rows, /^Bok ramienia/));
await pokoj('Kuchnia'); await aktywuj('L');
rows = await wiersze(/^Formatki do zamówienia/);
ok('karta szafki L: front ramienia z płyty sąsiedniej ściany', /SASIAD/.test(plytaWiersza(rows, /^Front ramienia/)), plytaWiersza(rows, /^Front ramienia/));
const kolL = {};
for (const w of ['Zamk.', 'Z góry']) { await click('Szafka'); await click(w); Object.assign(kolL, await koloryRysunku('#rysunek svg')); }
ok('rysunek szafki L: front ramienia w kolorze frontów sąsiada', Object.keys(kolL).some((k) => k.startsWith(S)), Object.keys(kolL).join(', '));
await click('Zabudowa'); await click('Zamk.');
ok('zabudowa: front ramienia w kolorze frontów sąsiada', Object.keys(await koloryRysunku('#rysunek svg')).some((k) => k.startsWith(S)));
await page.evaluate(() => { window.__audytBryl = []; }); await click('3D');
ok('3D zabudowy: front ramienia w kolorze frontów sąsiada', (await bryly()).some((c) => c.startsWith(S)));

console.log('\nBLEDY:', errors.length ? errors.join('; ') : '(brak)');
await b.close();
