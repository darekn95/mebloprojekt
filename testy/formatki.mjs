/* Czy wszystko, co narysowane, jest w formatkach do zamowienia.
   Kazda bryla 3D, ktora wyglada na plyte (najmniejszy wymiar do 40 mm), musi
   miec pare w liscie formatek: dwa pozostale wymiary zgodne z dlugoscia
   i szerokoscia jakiejs formatki (±3 mm, w dowolnej kolejnosci). Sprawdzamy
   osobno szafke (widok Szafka / 3D kontra „Formatki do zamowienia”) i cala
   zabudowe (Zabudowa / 3D kontra „Formatki calego projektu”, a przy jednej
   szafce — lista szafki). Bryly zapisuje hook `audytBryly` w szafki.jsx. */
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
const szafka = (name, o = {}) => ({ name, W: 600, H: 720, D: 570, plinth: PL, legs: { on: true, height: 100 },
  levels: [{ h: null, cols: [kol()] }], ...o });
const run = (id, name, o = {}) => ({ id, name, wallW: null, gap: 0, mountY: 0, H: 720, D: 570, plinth: PL, worktop: true, ...o });
const projekt = (items, runs = []) => ({ name: 'Audyt', active: 0, prices: {}, runs,
  items: items.map(([cab, runId]) => ({ cab, runId: runId || null, offset: 0 })) });

const tabela = (re) => page.evaluate((src) => {
  const re = new RegExp(src);
  const sec = [...document.querySelectorAll('section')].find((s) => re.test((s.querySelector('h2') || {}).textContent || ''));
  if (!sec) return null;
  const th = [...sec.querySelectorAll('thead th')].map((x) => x.textContent.trim());
  const iA = th.indexOf('Długość'), iB = th.indexOf('Szerokość'), iQ = th.indexOf('Szt.');
  const num = (s) => Number(String(s).replace(/\s/g, '').replace(',', '.'));
  return [...sec.querySelectorAll('tbody tr')].map((tr) => {
    const td = [...tr.children].map((x) => x.textContent.trim());
    return { name: td[0], a: num(td[iA]), b: num(td[iB]), qty: num(td[iQ]) };
  });
}, re.source);

const pick = async (l) => { await page.getByRole('button', { name: l, exact: true }).first().click(); await page.waitForTimeout(300); };
const bryly = async (zakres) => {
  // szafka spoza ciagu nie ma przelacznika zakresu — rysuje sie tylko ona
  if (await page.getByRole('button', { name: zakres, exact: true }).count()) await pick(zakres);
  await pick('Zamk.');
  await page.evaluate(() => { window.__audytBryl = []; });
  await pick('3D');
  const s = await page.evaluate(() => { const a = window.__audytBryl; window.__audytBryl = null; return a; });
  return s;
};

/* Paruje bryly z formatkami. Bryl bywa wiecej niz sztuk (ta sama plyta
   narysowana dwa razy w zabudowie i w szafce), wiec liczy sie tylko, czy
   bryla ma JAKAKOLWIEK formatke o swoich wymiarach. */
const porownaj = (sol, parts, luzCokol = false) => {
  /* Uchwyty i nozki to okucia (osobna lista), nie formatki — w bryle maja
     kolor okuc albo znacznik. */
  const plyty = sol.filter((s) => { const d = [...s.d].sort((x, y) => x - y);
    return d[0] > 0.5 && d[0] <= 40 && d[1] >= 20 && s.color !== '#3f3f46' && s.color !== '#8b8b93' && !/^(uchwyt|noga)/.test(s.tag || ''); });
  const brak = [];
  plyty.forEach((s) => {
    const [, q, r] = [...s.d].sort((x, y) => x - y).map(Math.round);
    const para = parts.find((p) => (Math.abs(p.a - q) <= 3 && Math.abs(p.b - r) <= 3) || (Math.abs(p.a - r) <= 3 && Math.abs(p.b - q) <= 3))
      /* Cokol ciagu zamawia sie w jednym kawalku (albo kilku do dlugosci
         arkusza), a rysuje odcinkami pod szafkami — odcinek musi sie w nim zmiescic. */
      || parts.find((p) => /^Cokół ciągu/.test(p.name) && Math.abs(p.b - q) <= 3 && p.a >= r - 3)
      /* Blat ciagu nad szafka (widok samej szafki pokazuje jego odcinek od
         2026-10-04) — zamawia sie go w calosci, w formatkach projektu: odcinek
         ma te sama glebokosc i miesci sie w dlugosci. */
      || (s.tag === 'blat' && parts.find((p) => /^Blat/.test(p.name) && ((Math.abs(p.b - q) <= 3 && p.a >= r - 3) || (Math.abs(p.b - r) <= 3 && p.a >= q - 3))))
      /* Widok samej szafki naroznej nie ma ramienia, wiec jej cokol rysuje sie
         na cala szerokosc — w zamowieniu to cokol ciagu plus cokol ramienia. */
      || (luzCokol && parts.find((p) => /^Cokół/.test(p.name) && Math.abs(p.b - q) <= 3));
    if (!para) brak.push(`${[...s.d].sort((x, y) => x - y).map(Math.round).join('×')}${s.tag ? ' [' + s.tag + ']' : ''} ${s.color || ''}`);
  });
  return { plyt: plyty.length, brak: [...new Set(brak)] };
};

const scenariusz = async (tytul, p, { zabudowa = false } = {}) => {
  await page.evaluate((p) => { localStorage.clear(); localStorage.setItem('szafki:projekt', JSON.stringify(p)); }, p);
  await page.reload({ waitUntil: 'networkidle' }); await page.waitForTimeout(800);
  const n = p.items.length;
  for (let i = 0; i < n; i++) {
    if (n > 1) {
      await page.evaluate((i) => { const q = JSON.parse(localStorage.getItem('szafki:projekt')); q.active = i;
        localStorage.setItem('szafki:projekt', JSON.stringify(q)); }, i);
      await page.reload({ waitUntil: 'networkidle' }); await page.waitForTimeout(800);
    }
    const lista = await tabela(/^Formatki do zamówienia/) || [];
    /* Cokol i blat ciagu sa wspolne — szafka pokazuje o tym informacje, a same
       formatki sa w liscie calego projektu. */
    const wCiagu = await page.locator('[data-el="formatki-ciagu"]').count();
    const projekt = wCiagu ? (await tabela(/^Formatki całego projektu/) || []) : [];
    if (wCiagu) ok(`${tytul} — szafka ${p.items[i].cab.name}: cokół/blat ciągu są w formatkach projektu`, projekt.length > 0);
    const w = porownaj(await bryly('Szafka'), [...lista, ...projekt], lista.some((x) => /ramienia/.test(x.name)));
    ok(`${tytul} — szafka ${p.items[i].cab.name}: ${w.plyt} płyt z rysunku jest w formatkach szafki`, !w.brak.length, w.brak.join('; '));
  }
  if (zabudowa) {
    const proj = await tabela(/^Formatki całego projektu/);
    const lista = proj || await tabela(/^Formatki do zamówienia/) || [];
    // przy jednym ciagu nie ma „Zabudowa” — calosc pokazuje „Ciag”
    const zakres = await page.getByRole('button', { name: 'Zabudowa', exact: true }).count() ? 'Zabudowa' : 'Ciąg';
    const w = porownaj(await bryly(zakres), lista);
    ok(`${tytul} — zabudowa: ${w.plyt} płyt z rysunku jest w formatkach ${proj ? 'projektu' : 'szafki (brak karty projektu)'}`, !w.brak.length, w.brak.join('; '));
  }
};

await scenariusz('drzwi i półka', projekt([[szafka('D')]]));
await scenariusz('szuflady', projekt([[szafka('S', { levels: [{ h: null, cols: [{ ...kol(), kind: 'drawers', drawers: [{ h: 'auto' }, { h: 'auto' }, { h: 'auto' }] }] }] })]]));
await scenariusz('fix z boku ze wspornikiem', projekt([[szafka('F', { levels: [{ h: null, cols: [kol({ doors: 1, fix: { side: 'left', w: 100, mode: 'overlay', support: true, supportDepth: 100 } })] }] })]]));
await scenariusz('fix u góry', projekt([[szafka('FG', { levels: [{ h: null, cols: [kol({ fix: { side: 'top', w: 100, mode: 'overlay' } })] }] })]]));
await scenariusz('blenda w kolumnie', projekt([[szafka('B', { W: 800, levels: [{ h: null, cols: [kol({ doors: 1 }), { ...kol(), kind: 'blenda', w: 100 }] }] })]]));
await scenariusz('blenda nad szafką', projekt([[szafka('BN', { plinth: { ...PL, on: false }, legs: { on: false }, topFiller: { on: true, height: 80 } })]]));
await scenariusz('dwa poziomy, przegroda', projekt([[szafka('P', { W: 800, H: 2000, levels: [
  { h: null, cols: [kol({ doors: 1 }), kol({ doors: 1 })] }, { h: 700, cols: [kol()] }] })]]));
await scenariusz('wycięcie z maskownicą', projekt([[szafka('W', { cutout: { on: true, w: 100, d: 100, fullHeight: true, levelIndex: 0, mask: true, maskType: 'auto', maskFront: 'over' } })]]));
await scenariusz('plecy z płyty na zewnątrz', projekt([[szafka('PL', { back: 'board', backPos: 'outside' })]]));
await scenariusz('jedna szafka w ciągu z blatem i cokołem', projekt([[szafka('J'), 'c1']], [run('c1', 'Ściana 1')]), { zabudowa: true });
await scenariusz('ciąg trzech szafek', projekt([[szafka('C1'), 'c1'], [szafka('C2'), 'c1'], [szafka('C3', { W: 400 }), 'c1']], [run('c1', 'Ściana 1')]), { zabudowa: true });

// wstawka w rogu (plaska i szeroka) — bryla 3D ma pare w formatkach
for (const typ of ['plaska', 'szeroka']) {
  await scenariusz('wstawka ' + typ, projekt([[szafka('A1'), 'c1'], [szafka('A2'), 'c1'], [szafka('R', { W: 1000 }), 'c2'], [szafka('B2'), 'c2']],
    [run('c1', 'Ściana 1', { worktop: false }), run('c2', 'Ściana 2', { worktop: false,
      corner: { of: 'c1', at: 'end', owner: 'self', clear: 0, wstawka: { typ, w: 60 } } })]), { zabudowa: true });
}

// kuchnia w L z górnymi ciągami na obu ścianach (górne 300 w głąb, wiszą na listwie)
{
  const wisz = (name) => szafka(name, { D: 300, plinth: { ...PL, on: false }, legs: { on: false }, hangerMode: 'listwa' });
  await scenariusz('górne ciągi w L', projekt([
    [szafka('D1'), 'c1'], [szafka('D2', { W: 1000 }), 'c1'], [szafka('D3'), 'c2'],
    [wisz('G1'), 'c3'], [wisz('G2'), 'c3'], [wisz('G3'), 'c4']],
  [run('c1', 'Ściana 1'), run('c2', 'Ściana 2', { corner: { of: 'c1', at: 'end', owner: 'of', clear: 0 } }),
    run('c3', 'Ściana 1', { tier: 'gorny', wall: 'c1', D: 300, mountY: 1358, worktop: false, plinth: null }),
    run('c4', 'Ściana 2', { tier: 'gorny', wall: 'c2', D: 300, mountY: 1358, worktop: false, plinth: null })]), { zabudowa: true });
}

// szablony z listy „+ z szablonu”
for (const t of ['stojaca', 'wiszaca', 'biurko', 'slupek', 'naroznikL']) {
  await page.evaluate(() => localStorage.clear()); await page.reload({ waitUntil: 'networkidle' }); await page.waitForTimeout(600);
  await page.locator('select[title="Dodaj szafkę z gotowego szablonu"]').first().selectOption(t);
  await page.waitForTimeout(800);
  const p = await page.evaluate(() => JSON.parse(localStorage.getItem('szafki:projekt')));
  await scenariusz('szablon ' + t, p, { zabudowa: true });
  if (t === 'naroznikL') {
    // ramie nalezy do szafki naroznej — jego plyty sa w jej liscie, nie tylko w projekcie
    const lista = (await tabela(/^Formatki do zamówienia/) || []).map((x) => x.name);
    ok('szafka w L: płyty ramienia w liście szafki', ['Dno ramienia', 'Bok ramienia', 'Front ramienia', 'Plecy ramienia']
      .every((n) => lista.includes(n)), lista.join(', '));
  }
}
console.log('\nBLEDY:', errors.length ? errors.join('; ') : '(brak)');
await b.close();
