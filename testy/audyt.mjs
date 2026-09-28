/* Audyt calosci (prosba uzytkownika 2026-09-28: „czy wszystko wszedzie sie
   wyswietla, dobrze liczy, nic na nic nie nachodzi i czy dobrze liczy sie
   w arkuszach do zamowienia”). Dla kazdego scenariusza:
   1. nachodzenie — w bryle 3D (zamknietej) samej szafki i calej zabudowy
      zadne dwie bryly nie wchodza w siebie wiecej niz 1 mm w kazdym kierunku,
   2. formatki ↔ rysunek w obie strony — kazda plyta z bryly ma formatke,
      i kazda formatka ma na rysunku tyle plyt, ile sztuk zamawiamy,
   3. projekt = suma szafek — formatki i okucia calego projektu to suma list
      szafek plus to, co wspolne dla ciagu (cokol, blat ciagu),
   4. arkusz PDF = tabele na ekranie (formatki i okucia kazdej szafki i projektu).
   Bryly zapisuje hook `audytBryly` (wymiary + obrys na miejscu). */
import pw from './pw.mjs';
const URL = process.env.STD ? 'http://127.0.0.1:5199/standalone-local.html'
  : 'http://127.0.0.1:5205/mebloprojekt-app.html';
const ok = (l, c, e = '') => console.log((c ? '  OK   ' : '  BLAD ') + l + (e ? ' — ' + e : ''));
const info = (l) => console.log('  INFO ' + l);
const b = await pw.chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const page = await (await b.newContext({ viewport: { width: 1500, height: 1300 } })).newPage();
const errors = []; page.on('pageerror', (e) => errors.push(e.message));
await page.goto(URL, { waitUntil: 'networkidle' });

const PL = { on: true, height: 100, mode: 'under', setback: 0 };
const kol = (o = {}) => ({ kind: 'doors', doors: 2, w: null, shelfTargets: [null, null], ...o });
const szafka = (name, o = {}) => ({ name, W: 600, H: 720, D: 570, plinth: PL, legs: { on: true, height: 100 },
  levels: [{ h: null, cols: [kol()] }], ...o });
const wisz = (name, o = {}) => szafka(name, { D: 300, plinth: { ...PL, on: false }, legs: { on: false }, hangerMode: 'listwa', ...o });
const run = (id, name, o = {}) => ({ id, name, wallW: null, gap: 0, mountY: 0, H: 720, D: 570, plinth: PL, worktop: true, ...o });
const projekt = (items, runs = []) => ({ name: 'Audyt', active: 0, prices: {}, runs,
  items: items.map(([cab, runId]) => ({ cab, runId: runId || null, offset: 0 })) });

const num = (s) => Number(String(s).replace(/\s/g, '').replace(',', '.').replace(/[^\d.\-]/g, '')) || 0;
// tabela z karty o tytule pasujacym do `re`: wiersze jako obiekty po naglowkach
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
const okucia = (rows) => (rows || []).filter((r) => r._.length >= 2)
  .map((r) => ({ name: r._[0], qty: num((r['Ilość'] || r._[r._.length - 1] || '').split(' ')[0]) }));

const click = async (l) => { const x = page.getByRole('button', { name: l, exact: true }); if (await x.count()) { await x.first().click(); await page.waitForTimeout(300); return true; } return false; };
const bryly = async (zakres) => {
  await click(zakres); await click('Zamk.');
  await page.evaluate(() => { window.__audytBryl = []; });
  await click('3D');
  return page.evaluate(() => { const a = window.__audytBryl; window.__audytBryl = null; return a || []; });
};
// bryla po otwarciu — tam widac skrzynki szuflad; nachodzenia tu nie liczymy (skrzydla sie obracaja)
const brylyOtw = async () => {
  await page.evaluate(() => { window.__audytBryl = []; });
  const z = page.getByRole('button', { name: 'zamknięte', exact: true });
  if (await z.count()) { await z.first().click(); await page.waitForTimeout(400); }
  const a = await page.evaluate(() => { const x = window.__audytBryl; window.__audytBryl = null; return x || []; });
  const o = page.getByRole('button', { name: 'otwarte', exact: true });
  if (await o.count()) { await o.first().click(); await page.waitForTimeout(200); }
  return a;
};
// uchwyty, nozki i metalowe boki szuflad (#8b8b93) to okucia, nie formatki
const plyty = (sol) => sol.filter((s) => { const d = [...s.d].sort((x, y) => x - y);
  return d[0] > 0.5 && d[0] <= 40 && d[1] >= 20 && s.color !== '#3f3f46' && s.color !== '#8b8b93' && !/^(uchwyt|noga)/.test(s.tag || ''); });
const opis = (q) => `${q.tag || ''}${[...q.d].sort((x, y) => x - y).map(Math.round).join('×')}`;

// 1. nachodzenie brył (bez stref kolizji i wyciec, ktore sa przezroczyste)
const nachodzi = (sol) => {
  const s = sol.filter((q) => q.p && q.color !== '#b91c1c' && q.color !== '#b45309');
  const out = [];
  for (let i = 0; i < s.length; i++) for (let j = i + 1; j < s.length; j++) {
    const a = s[i].p, c = s[j].p;
    const ov = [0, 1, 2].map((k) => Math.min(a[k + 3], c[k + 3]) - Math.max(a[k], c[k]));
    /* HDF we wregu wchodzi krawedzia w boki, wieniec i dno na szerokosc
       wregu minus luz (16 - 1 = 15) — to nie kolizja: cienka plyta (do 4 mm),
       styk do 4 mm w jednym kierunku i do 16 w drugim. HDF wstawiony w korpus
       na plasko wszedlby na cale 18 mm plyty i jest bledem. */
    const cienka = Math.min(...s[i].d) <= 4 || Math.min(...s[j].d) <= 4;
    const [o1, o2] = [...ov].sort((x, y) => x - y);
    if (cienka && o1 <= 4 && o2 <= 16) continue;
    if (ov.every((v) => v > 1)) out.push(`${opis(s[i])} × ${opis(s[j])} (${ov.map(Math.round).join('×')})`);
  }
  return [...new Set(out)];
};
// 2. formatki ↔ plyty: ile plyt o wymiarach formatki (±3 mm, dowolnie obrocone)
const pasuje = (p, s) => { const [, q, r] = [...s.d].sort((x, y) => x - y).map(Math.round);
  return (Math.abs(p.a - q) <= 3 && Math.abs(p.b - r) <= 3) || (Math.abs(p.a - r) <= 3 && Math.abs(p.b - q) <= 3); };
const bezPlyty = (parts, sol, pomin) => {
  const pl = plyty(sol);
  return parts.filter((p) => !pomin.test(p.name)).map((p) => ({ p, ile: pl.filter((s) => pasuje(p, s)).length }))
    .filter((x) => x.ile < x.p.qty).map((x) => `${x.p.name} ${x.p.a}×${x.p.b}: ${x.ile} z ${x.p.qty}`);
};
const bezFormatki = (parts, sol) => plyty(sol).filter((s) => !parts.some((p) => pasuje(p, s)
  || (/^Cokół/.test(p.name) && Math.abs(p.b - [...s.d].sort((x, y) => x - y)[1]) <= 3))).map(opis);
// 3. suma list
const suma = (lists, key) => { const m = new Map(); lists.flat().forEach((r) => m.set(key(r), (m.get(key(r)) || 0) + r.qty)); return m; };
const roznice = (a, b2) => [...new Set([...a.keys(), ...b2.keys()])].filter((k) => Math.abs((a.get(k) || 0) - (b2.get(k) || 0)) > 0.01)
  .map((k) => `${k}: szafki ${a.get(k) || 0}, projekt ${b2.get(k) || 0}`);
const kluczF = (r) => `${r.name}|${Math.min(r.a, r.b)}|${Math.max(r.a, r.b)}`;
// 4. arkusz PDF
const raport = async () => {
  await page.evaluate(() => { window.__rep = null; window.print = () => { const r = document.querySelector('.print-only');
    window.__rep = r ? [...r.querySelectorAll('.rp-page')].map((pg) => [...pg.querySelectorAll('table')].map((t) => ({
      th: [...t.querySelectorAll('thead th')].map((x) => x.textContent.trim()),
      rows: [...t.querySelectorAll('tbody tr')].map((tr) => [...tr.children].map((x) => x.textContent.trim())) }))) : null; }; });
  await page.getByRole('button', { name: 'Zestawienie PDF', exact: true }).first().click();
  await page.waitForTimeout(1200);
  return page.evaluate(() => window.__rep) || [];
};
const zRaportu = (t) => {
  const o = (h) => t.th.indexOf(h);
  // wiersz „Razem” to podsumowanie m² pod tabela, nie formatka
  if (o('Długość') >= 0) return { f: t.rows.filter((r) => !/^Razem/.test(r[0])).map((r) => ({ name: r[0], a: num(r[o('Długość')]), b: num(r[o('Szerokość')]), qty: num(r[o('Szt.')]) })) };
  if (t.th[0] === 'Produkt') return { h: t.rows.map((r) => ({ name: r[0], qty: num((r[o('Ilość')] || '').split(' ')[0]) })) };
  return {};
};
const tekstF = (l) => l.map((r) => `${r.name} ${r.a}×${r.b} ×${r.qty}`).sort().join('; ');
const tekstH = (l) => l.map((r) => `${r.name} ×${r.qty}`).sort().join('; ');

const wynik = { blad: 0 };
// `znane` — nachodzenie czekajace na decyzje uzytkownika (BLEDY.md), wypisywane jako INFO
const scenariusz = async (tytul, p, { pominRys = /$^/, znane = null } = {}) => {
  console.log(`\n== ${tytul} ==`);
  const set = async (active) => {
    await page.evaluate((q) => { localStorage.clear(); localStorage.setItem('szafki:projekt', JSON.stringify(q)); }, { ...p, active });
    await page.reload({ waitUntil: 'networkidle' }); await page.waitForTimeout(700);
  };
  const szafki = [];
  for (let i = 0; i < p.items.length; i++) {
    await set(i);
    const f = formatki(await tabela(/^Formatki do zamówienia/));
    const h = okucia(await tabela(/^Produkty do zamówienia/));
    const sol = await bryly('Szafka');
    const nm = p.items[i].cab.name;
    const nAll = nachodzi(sol);
    const n = znane ? nAll.filter((x) => !znane.test(x)) : nAll;
    if (nAll.length > n.length) info(`${nm}: znane, do decyzji (BLEDY.md): ${nAll.filter((x) => znane.test(x)).join('; ')}`);
    ok(`${nm}: w bryle szafki nic na nic nie nachodzi`, !n.length, n.slice(0, 6).join('; '));
    const otw = await brylyOtw();
    // ramie szafki w L i elementy wspolne ciagu rysuja sie dopiero w zabudowie
    const bp = bezPlyty(f, [...sol, ...otw.filter((q) => !sol.some((x) => x.p && q.p && x.p.join() === q.p.join()))], /ramienia|Kątownik|Maskownica|^Cokół ramienia/);
    ok(`${nm}: każda formatka szafki jest na rysunku w swojej ilości`, !bp.length, bp.join('; '));
    szafki.push({ f, h, nm });
  }
  await set(0);
  const pf = formatki(await tabela(/^Formatki całego projektu/));
  const ph = okucia(await tabela(/^Produkty całego projektu/));
  if (pf.length) {
    // wspolne dla ciagu: cokol i blat ciagu — sa tylko w liscie projektu
    const wspolne = pf.filter((r) => /ciągu/.test(r.name));
    const r1 = roznice(suma([...szafki.map((s) => s.f), wspolne], kluczF), suma([pf], kluczF));
    ok('formatki projektu = suma formatek szafek + cokół/blat ciągu', !r1.length, r1.join('; '));
    // okucia: zaslepki licza sie w opakowaniach od sumy sztuk, wiec tu tylko do porownania
    const r2 = roznice(suma(szafki.map((s) => s.h), (r) => r.name), suma([ph], (r) => r.name))
      // listwa montazowa wspolna dla ciagu jest jego pozycja, jak cokol i blat ciagu
      .filter((x) => !/^Zaślepka/.test(x) && !/^Listwa montażowa/.test(x));
    if (r2.length) info('okucia projektu ≠ suma szafek: ' + r2.join('; '));
    const zakres = await page.getByRole('button', { name: 'Zabudowa', exact: true }).count() ? 'Zabudowa' : 'Ciąg';
    // szafki luzem (bez ciagu) nie maja wspolnej bryly — kazda sprawdzona wyzej osobno
    const wCiagach = p.items.every((it) => it.runId);
    if (!wCiagach) info('szafki spoza ciągu — bryłę całości pomijam, każda szafka sprawdzona osobno');
    const sol = wCiagach ? await bryly(zakres) : [];
    if (wCiagach) {
    const n = nachodzi(sol);
    ok(`${zakres}: w bryle nic na nic nie nachodzi`, !n.length, n.slice(0, 8).join('; '));
    const bf = bezFormatki(pf, sol);
    ok(`${zakres}: każda płyta z rysunku ma formatkę`, !bf.length, [...new Set(bf)].join('; '));
    const bp = bezPlyty(pf, sol, pominRys);
    ok(`${zakres}: każda formatka projektu jest na rysunku w swojej ilości`, !bp.length, bp.join('; '));
    }
  }
  // arkusz PDF: strony szafek (co druga, z tabelami) i strona projektu
  const rep = await raport();
  const zTab = rep.filter((pg) => pg.length).map((pg) => pg.map(zRaportu));
  szafki.forEach((s, i) => {
    const pg = zTab[i] || [];
    const rf = (pg.find((x) => x.f) || {}).f || [], rh = (pg.find((x) => x.h) || {}).h || [];
    ok(`PDF ${s.nm}: formatki jak na ekranie`, tekstF(rf) === tekstF(s.f), tekstF(rf) + '  ≠  ' + tekstF(s.f));
    ok(`PDF ${s.nm}: okucia jak na ekranie`, tekstH(rh) === tekstH(s.h), tekstH(rh) + '  ≠  ' + tekstH(s.h));
  });
  if (pf.length) {
    const pg = zTab[szafki.length] || [];
    const rf = (pg.find((x) => x.f) || {}).f || [], rh = (pg.find((x) => x.h) || {}).h || [];
    ok('PDF projekt: formatki jak na ekranie', tekstF(rf) === tekstF(pf), tekstF(rf).slice(0, 300) + '  ≠  ' + tekstF(pf).slice(0, 300));
    ok('PDF projekt: okucia jak na ekranie', tekstH(rh) === tekstH(ph), tekstH(rh).slice(0, 300) + '  ≠  ' + tekstH(ph).slice(0, 300));
  }
};

const rog = (o = {}) => ({ of: 'c1', at: 'end', owner: 'self', clear: 0, ...o });
const USTAWIONA = { W: 1000, levels: [{ h: null, cols: [kol({ doors: 1, fix: { side: 'left', w: 618, mode: 'overlay', support: false }, hinge: 'right' })] }] };

await scenariusz('szafka: drzwi i półki', projekt([[szafka('D')]]));
await scenariusz('szafka: szuflady', projekt([[szafka('S', { levels: [{ h: null, cols: [{ ...kol(), kind: 'drawers', drawers: [{ h: 'auto' }, { h: 'auto' }, { h: 'auto' }] }] }] })]]));
// podniesiony tyl szuflady (do frontu minus luz) — nie moze wejsc w nic nad soba
await scenariusz('szafka: szuflady z podniesionym tyłem', projekt([[szafka('ST', { levels: [{ h: null, cols: [{ ...kol(), kind: 'drawers', drawers: [{ h: 'auto', tallBack: true }, { h: 'auto', tallBack: true }, { h: 'auto', tallBack: true }] }] }] })]]));
// polka w kolumnie ze wspornikiem fixu jest krotsza — konczy sie na wsporniku (2026-09-28)
await scenariusz('szafka: fix ze wspornikiem + drzwi', projekt([[szafka('F', { levels: [{ h: null, cols: [kol({ doors: 1, fix: { side: 'left', w: 100, mode: 'overlay', support: true, supportDepth: 100 } })] }] })]]));
await scenariusz('szafka: blenda w kolumnie + drzwi', projekt([[szafka('B', { W: 800, levels: [{ h: null, cols: [kol({ doors: 1 }), { ...kol(), kind: 'blenda', w: 100 }] }] })]]));
await scenariusz('szafka: dwa poziomy', projekt([[szafka('P', { W: 800, H: 2000, levels: [{ h: null, cols: [kol({ doors: 1 }), kol({ doors: 1 })] }, { h: 700, cols: [kol()] }] })]]));
await scenariusz('szafka: fronty wpuszczane', projekt([[szafka('WP', { frontMode: 'inset' })]]));
await scenariusz('szafka: HDF we frezie', projekt([[szafka('FR', { backGroove: { on: true, offset: 3, depth: 16, play: 1, wreg: true } })]]));
await scenariusz('szafka: plecy z płyty wewnątrz', projekt([[szafka('PW', { back: 'board', backPos: 'inside' })]]));
await scenariusz('szafka: klapa do góry i w dół', projekt([[wisz('KG', { W: 800, H: 400, levels: [{ h: null, cols: [kol({ doors: 1, klapa: 'gora' })] }] })],
  [wisz('KD', { W: 600, H: 400, levels: [{ h: null, cols: [kol({ doors: 1, klapa: 'dol' })] }] })]]));
await scenariusz('ciąg trzech szafek z blatem i cokołem', projekt([[szafka('C1'), 'c1'], [szafka('C2'), 'c1'], [szafka('C3', { W: 400 }), 'c1']], [run('c1', 'Ściana 1')]));
for (const ws of [null, { typ: 'plaska', w: 60 }, { typ: 'szeroka', w: 60 }]) {
  await scenariusz('ślepy róg ' + (ws ? 'z wstawką ' + ws.typ : 'bez wstawki'), projekt(
    [[szafka('A1'), 'c1'], [szafka('A2'), 'c1'], [szafka('R', USTAWIONA), 'c2'], [szafka('B2'), 'c2']],
    [run('c1', 'Ściana 1'), run('c2', 'Ściana 2', { corner: rog({ wstawka: ws }) })]));
}
/* Szafka w rogu ustawiona jak po „Ustaw szafkę w rogu” — nieustawiona ma
   dwoje drzwi za plecami sasiedniego ciagu i jej uchwyty wchodza w jego bok,
   ale wtedy aplikacja sama pokazuje blok „do ustawienia”. */
const USTAWIONA_P = { W: 1000, levels: [{ h: null, cols: [kol({ doors: 1, fix: { side: 'right', w: 618, mode: 'overlay', support: false }, hinge: 'left' })] }] };
await scenariusz('ślepy róg: ściana 1 wjeżdża w róg', projekt(
  [[szafka('A1'), 'c1'], [szafka('R', USTAWIONA_P), 'c1'], [szafka('B1'), 'c2'], [szafka('B2'), 'c2']],
  [run('c1', 'Ściana 1'), run('c2', 'Ściana 2', { corner: rog({ owner: 'of' }) })]));
await scenariusz('U: trzy ściany', projekt([[szafka('A', { ...USTAWIONA_P, W: 1200 }), 'c1'],
  [szafka('B', { W: 1400, levels: [{ h: null, cols: [kol({ doors: 1, fix: { side: 'right', w: 618, mode: 'overlay', support: false }, hinge: 'left' })] }] }), 'c2'],
  [szafka('C', { W: 900 }), 'c3']],
  [run('c1', 'A'), run('c2', 'B', { corner: rog({ owner: 'of' }) }), run('c3', 'C', { corner: { of: 'c2', at: 'end', owner: 'of', clear: 0 } })]));
await scenariusz('górne ciągi w L', projekt([
  [szafka('D1'), 'c1'], [szafka('D2', USTAWIONA_P), 'c1'], [szafka('D3'), 'c2'],
  [wisz('G1'), 'c3'], [wisz('G2'), 'c3'], [wisz('G3'), 'c4']],
[run('c1', 'Ściana 1'), run('c2', 'Ściana 2', { corner: rog({ owner: 'of' }) }),
  run('c3', 'Ściana 1', { tier: 'gorny', wall: 'c1', D: 300, mountY: 1358, worktop: false, plinth: null }),
  run('c4', 'Ściana 2', { tier: 'gorny', wall: 'c2', D: 300, mountY: 1358, worktop: false, plinth: null })]));
// szablony, w tym szafka w L z ramieniem
for (const t of ['stojaca', 'wiszaca', 'slupek', 'naroznikL']) {
  await page.evaluate(() => localStorage.clear()); await page.reload({ waitUntil: 'networkidle' }); await page.waitForTimeout(600);
  await page.locator('select[title="Dodaj szafkę z gotowego szablonu"]').first().selectOption(t);
  await page.waitForTimeout(900);
  const q = await page.evaluate(() => JSON.parse(localStorage.getItem('szafki:projekt')));
  await scenariusz('szablon ' + t, q);
  if (t === 'naroznikL') {
    // ta sama szafka w L w rogu dwoch ciagow — ramie istnieje dopiero w ukladzie
    const L = q.items[q.active].cab;
    await scenariusz('szafka w L w rogu ciągów', projekt(
      [[szafka('A1'), 'c1'], [szafka('A2'), 'c1'], [L, 'c2'], [szafka('B2'), 'c2']],
      [run('c1', 'Ściana 1'), run('c2', 'Ściana 2', { corner: rog() })]));
  }
}

console.log('\nBLEDY:', errors.length ? errors.join('; ') : '(brak)');
await b.close();
