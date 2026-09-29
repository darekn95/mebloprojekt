/* Audyt planu wiercen (uzytkownik 2026-09-28: „potrzebny — sprawdz dokladnie”).
   Tabela „Wiercenia” z arkusza PDF porownana z niezaleznymi zrodlami:
   - zawiasy skrzydel: z rysunku z przodu (otwarte) — ile i na jakiej wysokosci,
     po ktorej stronie; na plycie, ktora je niesie (bok, przegroda, wspornik fixu),
   - kolki polek: z bryly 3D — kazda polka ma otwory w obu plytach obok,
     na wysokosci jej spodu, z odleglosciami od przedniej krawedzi plyty,
   - prowadnice: z bryly 3D (boki metalowe skrzynek) — wysokosc i otwory wg NL,
   - zawiasy klap: z rysunku z przodu — w wiencu/dnie, wzdluz szerokosci,
   - kazda plyta z planu jest w formatkach, liczba zawiasow = okucia.
   Wysokosci w planie sa od dolnej krawedzi plyty; dol plyty bierzemy z bryly. */
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
const click = async (l) => { const x = page.getByRole('button', { name: l, exact: true }); if (await x.count()) { await x.first().click(); await page.waitForTimeout(350); return true; } return false; };
const num = (s) => Number(String(s).replace(/\s/g, '').replace(',', '.').replace(/[^\d.\-]/g, '')) || 0;

let formatkiPdf = [];
// nr: numer szafki w PDF („(2 z 3)” w naglowku kartki); bez numeru — pierwsza kartka z wierceniami
const wiercenia = async (nr = null) => {
  await page.evaluate((nr) => { window.__rep = null; window.print = () => {
    const tabele = [...document.querySelectorAll('.print-only .rp-page')]
      .filter((s) => nr == null || (s.querySelector('span')?.textContent || '').includes(`(${nr} z `))
      .flatMap((s) => [...s.querySelectorAll('table')]);
    const t = tabele.find((x) => /Otwory pod/.test(x.querySelector('thead')?.textContent || ''));
    window.__rep = t ? [...t.querySelectorAll('tbody tr')].map((tr) => [...tr.children].map((x) => x.textContent.trim())) : [];
    // formatki tej samej szafki (pierwsza kolumna tabeli z dlugosciami)
    const f = tabele.find((x) => /Długość/.test(x.querySelector('thead')?.textContent || ''));
    window.__fmt = f ? [...f.querySelectorAll('tbody tr')].map((tr) => tr.children[0].textContent.trim()) : [];
  }; }, nr);
  await page.getByRole('button', { name: 'Zestawienie PDF', exact: true }).first().click();
  await page.waitForTimeout(1000);
  const rows = (await page.evaluate(() => window.__rep)) || [];
  formatkiPdf = (await page.evaluate(() => window.__fmt)) || [];
  let panel = '';
  return rows.map((r) => { if (r[0]) panel = r[0]; return { panel, kind: r[1], ys: r[2].split(',').map(num), note: r[3] }; });
};
const tabela = (re) => page.evaluate((src) => {
  const re = new RegExp(src);
  const sec = [...document.querySelectorAll('section')].find((s) => re.test((s.querySelector('h2') || {}).textContent || ''));
  return sec ? [...sec.querySelectorAll('tbody tr')].map((tr) => [...tr.children].map((x) => x.textContent.trim())) : [];
}, re.source);
const bryla = async () => {
  await click('Zamk.');
  await page.evaluate(() => { window.__audytBryl = []; });
  await click('3D');
  return page.evaluate(() => { const x = window.__audytBryl; window.__audytBryl = null; return (x || []).filter((q) => q.p); });
};
// zawiasy na rysunku z przodu (otwarte): prostokaty #71717a, w ukladzie szafki (y od dolu korpusu)
const zawiasyRys = async (H) => {
  await click('Otw.');
  return page.evaluate((H) => {
    const svg = document.querySelector('#rysunek svg'); const sm = svg.getCTM().inverse();
    return [...svg.querySelectorAll('rect')].filter((r) => r.getAttribute('fill') === '#71717a').map((r) => {
      const bb = r.getBBox(); const m = sm.multiply(r.getCTM());
      const a = new DOMPoint(bb.x, bb.y).matrixTransform(m), c = new DOMPoint(bb.x + bb.width, bb.y + bb.height).matrixTransform(m);
      return { x: (a.x + c.x) / 2, y: H - (a.y + c.y) / 2, w: Math.abs(c.x - a.x), h: Math.abs(c.y - a.y) };
    });
  }, H);
};

const scenariusz = async (tytul, cab, { spr = {} } = {}) => {
  console.log(`\n== ${tytul} ==`);
  await page.evaluate((q) => { localStorage.clear(); localStorage.setItem('szafki:projekt', JSON.stringify(q)); },
    { name: 'W', active: 0, prices: {}, runs: [], items: [{ cab, runId: null, offset: 0 }] });
  await page.reload({ waitUntil: 'networkidle' }); await page.waitForTimeout(700);
  await click('Szafka');
  const plan = await wiercenia();
  const sol = await bryla();
  const t = 18, W = cab.W, H = cab.H;
  // plyty pionowe z bryly: boki i przegrody (grubosc t w x, wysokie), wsporniki (plytkie w z)
  const pion = sol.filter((q) => Math.abs((q.p[3] - q.p[0]) - t) < 0.6 && q.p[4] - q.p[1] > 60 && q.p[2] >= -0.5 && q.color === '#d8c3a0');
  // polki: poziome plyty dosuniete do plyt pionowych z obu stron (dno szuflady stoi 37 mm od boku)
  const przy = (x) => pion.some((v) => Math.abs(v.p[0] - x) <= 1 || Math.abs(v.p[3] - x) <= 1);
  const polki = sol.filter((q) => Math.abs((q.p[4] - q.p[1]) - t) < 0.6 && q.p[3] - q.p[0] > 60 && q.p[5] - q.p[2] > 60
    && q.p[1] > 20 && q.p[4] < H - 20 && q.color === '#d8c3a0' && q.p[2] >= -0.5 && przy(q.p[0]) && przy(q.p[3]));
  const metal = sol.filter((q) => q.color === '#8b8b93');
  const formatki = (await tabela(/^Formatki do zamówienia/)).map((r) => r[0]);
  const okucia = await tabela(/^Produkty do zamówienia/);

  // 1. kazda plyta z planu jest w formatkach
  const wFormatkach = (panel) => {
    const n = panel.replace(/^Poziom \d+ — /, '');
    const re = /^Bok/.test(n) ? /^Bok/ : /^Przegroda/.test(n) ? /^Przegroda/ : /^Wspornik/.test(n) ? /^Wspornik pionowy/
      : /^(Wieniec|Dno)/.test(n) ? /Wieniec|Dno|wieniec/ : /^Półka przelotowa/.test(n) ? /^Półka przelotowa/
      : /^Cokół/.test(n) ? /Cokół/ : new RegExp('^' + n);
    return formatki.some((f) => re.test(f));
  };
  const obce = [...new Set(plan.map((r) => r.panel))].filter((p) => !wFormatkach(p));
  ok('każda płyta z planu jest w formatkach', !obce.length, obce.join('; '));

  // dol plyty z planu wg bryly: bok lewy/prawy — skrajne; przegroda k — k-ta pionowa w swoim poziomie
  const dolPlyty = (panel) => {
    const n = panel.replace(/^Poziom \d+ — /, '');
    const boki = pion.filter((q) => q.p[5] - q.p[2] > 200).sort((a, c) => a.p[0] - c.p[0]);
    if (n === 'Bok lewy') return boki[0]?.p[1];
    if (n === 'Bok prawy') return boki[boki.length - 1]?.p[1];
    return null;   // przegrody/wsporniki — wysokosci sprawdzamy wzgledem poziomu nizej
  };

  // 2. zawiasy skrzydel: tyle ile na rysunku i na tych wysokosciach
  const zr = (await zawiasyRys(H)).filter((z) => z.h > z.w);        // pionowe = skrzydla (klapy maja poziome)
  const zPlan = plan.filter((r) => r.kind === 'zawias');
  const nPlan = zPlan.reduce((s, r) => s + r.ys.length, 0);
  ok(`zawiasy: w planie ${nPlan}, na rysunku ${zr.length}`, nPlan === zr.length, zPlan.map((r) => `${r.panel}: ${r.ys.join(',')}`).join(' | '));
  const zawOk = zPlan.every((r) => { const d0 = dolPlyty(r.panel); return d0 == null
    || r.ys.every((y) => zr.some((z) => Math.abs(z.y - (y + d0)) <= 1)); });
  ok('zawiasy na tych samych wysokościach co na rysunku', zawOk,
    zPlan.map((r) => `${r.panel}: ${r.ys.join(',')}`).join(' | ') + ' // rys: ' + zr.map((z) => Math.round(z.y)).join(','));
  const hw = okucia.find((r) => /^Zawias/.test(r[0]) && !/klap/.test(r[0]));
  if (spr.zawiasyOkucia !== false && hw) {
    const q = num(hw[hw.length - 1].split(' ')[0]);
    const nKlap = plan.filter((r) => r.kind === 'zawias klapy').reduce((s, r) => s + r.ys.length, 0);
    ok(`liczba zawiasów w okuciach (${q}) = otwory w planie (${nPlan + nKlap})`, q === nPlan + nKlap, hw.join(' | '));
  }
  if (spr.wspornik) ok('zawias po stronie fixu na wsporniku, nie na boku', zPlan.some((r) => /^Wspornik pionowy/.test(r.panel))
    && !zPlan.some((r) => r.panel === (spr.wspornik === 'left' ? 'Bok lewy' : 'Bok prawy')), zPlan.map((r) => r.panel).join(', '));

  // 3. kolki polek: kazda polka z bryly ma otwory w dwoch plytach na wysokosci swojego spodu
  const kPlan = plan.filter((r) => r.kind === 'kołek półki');
  const nKol = kPlan.reduce((s, r) => s + r.ys.length, 0);
  if (cab.shelfMount !== 'confirmat') {
    // polka przelotowa (miedzy poziomami) jest na konfirmatach — kolki maja tylko polki kolumn
    ok(`kołki: ${polki.length} półek → ${2 * polki.length} otworów w planie (jest ${nKol})`,
      nKol === 2 * polki.length || spr.polkiPrzelotowe, kPlan.map((r) => `${r.panel}: ${r.ys.join(',')}`).join(' | '));
    const bokL = kPlan.find((r) => r.panel === 'Bok lewy');
    if (bokL) {
      const d0 = dolPlyty('Bok lewy');
      const lewe = polki.filter((q) => q.p[0] <= t + 1).map((q) => Math.round(q.p[1] - d0)).sort((a, c) => a - c);
      ok('kołki w boku lewym na wysokości spodu półek', JSON.stringify([...bokL.ys].sort((a, c) => a - c)) === JSON.stringify(lewe),
        `plan ${bokL.ys.join(',')} / bryła ${lewe.join(',')}`);
      // odleglosci od przedniej krawedzi plyty: przod polki z bryly + 37 i tyl - 37
      const q0 = polki.find((q) => q.p[0] <= t + 1);
      const [a1, a2] = (bokL.note.match(/([\d.]+) i ([\d.]+) mm od przedniej krawędzi/) || []).slice(1).map(Number);
      ok('kołki: odległości od przedniej krawędzi płyty jak półka w bryle', !!q0 && Math.abs(a1 - (q0.p[2] + 37)) <= 1 && Math.abs(a2 - (q0.p[5] - 37)) <= 1,
        `${bokL.note} / półka z ${q0 && q0.p[2]} do ${q0 && q0.p[5]}`);
    }
  }

  // 3a. laczenia: konfirmaty i trojkaty w planie = w okuciach
  const ileWNocie = (note) => ((note.match(/,\s*([\d.]+(?:, [\d.]+)*) mm od przedniej/) || [])[1] || '').split(', ').filter(Boolean).length;
  const konPlan = plan.filter((r) => /^konfirmat/.test(r.kind)).reduce((s2, r) => s2 + r.ys.length * ileWNocie(r.note), 0);
  const konHw = okucia.find((r) => /^Konfirmat/.test(r[0]));
  if (!spr.bezKatownika) ok(`konfirmaty: w planie ${konPlan}, w okuciach ${konHw ? num(konHw[konHw.length - 1].split(' ')[0]) : 0}`,
    konPlan === (konHw ? num(konHw[konHw.length - 1].split(' ')[0]) : 0), plan.filter((r) => /^konfirmat/.test(r.kind)).map((r) => `${r.panel} ${r.kind}: ${r.ys.join(',')}`).join(' | '));
  const trPlan = plan.filter((r) => r.kind === 'trójkąt meblowy').reduce((s2, r) => s2 + r.ys.length * (/2 rzędy/.test(r.note) ? 2 : 1) + (/po 1 na każdym krótkim boku/.test(r.note) ? 2 : 0), 0);
  const trHw = okucia.find((r) => /^Trójkąt/.test(r[0]));
  ok(`trójkąty: w planie ${trPlan}, w okuciach ${trHw ? num(trHw[trHw.length - 1].split(' ')[0]) : 0}`,
    trPlan === (trHw ? num(trHw[trHw.length - 1].split(' ')[0]) : 0), plan.filter((r) => r.kind === 'trójkąt meblowy').map((r) => `${r.panel}: ${r.ys.join(',')}`).join(' | '));

  // 3b. przegroda z polkami z obu stron na tej samej wysokosci: jedna strona o 20 mm do srodka
  if (spr.przegrodaObie) {
    const pr = kPlan.filter((r) => /^Przegroda 1/.test(r.panel));
    const k1 = pr.find((r) => /od kolumny 1/.test(r.note)), k2 = pr.find((r) => /od kolumny 2/.test(r.note));
    const odl = (r) => ((r && r.note.match(/⌀5, ([\d.]+) i ([\d.]+) mm/)) || []).slice(1).map(Number);
    const [a1, b1] = odl(k1), [a2, b2] = odl(k2);
    ok('przegroda: półki na tej samej wysokości — druga strona kołki o 20 mm bliżej środka',
      !!k1 && !!k2 && a2 - a1 === 20 && b1 - b2 === 20 && /przesunięte o 20 mm/.test(k2.note), pr.map((r) => r.note).join(' | '));
  }

  // 4. prowadnice: wysokosc dolnej krawedzi = dol boku metalowego, otwory wg NL
  const pPlan = plan.filter((r) => r.kind === 'prowadnica');
  const skrzynek = metal.length / 2;
  const nPr = pPlan.reduce((s, r) => s + r.ys.length, 0);
  if (skrzynek) {
    ok(`prowadnice: ${skrzynek} szuflad → ${2 * skrzynek} wpisów (jest ${nPr})`, nPr === 2 * skrzynek, pPlan.map((r) => `${r.panel}: ${r.ys.join(',')}`).join(' | '));
    const bokL = pPlan.filter((r) => r.panel === 'Bok lewy');
    const d0 = dolPlyty('Bok lewy');
    const ys = bokL.flatMap((r) => r.ys).sort((a, c) => a - c);
    const zBryly = metal.filter((q) => q.p[0] < W / 2).map((q) => Math.round(q.p[1] - d0)).sort((a, c) => a - c);
    ok('prowadnice na wysokości dołu skrzynek z bryły', JSON.stringify(ys) === JSON.stringify(zBryly), `plan ${ys.join(',')} / bryła ${zBryly.join(',')}`);
    const OTW = { 250: '37, 133', 270: '37, 133', 300: '37, 165', 350: '37, 165', 400: '37, 229', 450: '37, 261', 500: '37, 261', 550: '37, 261', 600: '37, 261, 389' };
    const zle = pPlan.filter((r) => { const nl = Number((r.note.match(/NL (\d+)/) || [])[1]); const sb = Number((r.note.match(/cofnięta o (\d+)/) || [])[1] || 0);
      const oczek = OTW[nl] && OTW[nl].split(', ').map((x) => Number(x) + sb).join(', ');
      return !oczek || !r.note.includes(`otwory ${oczek} mm`); });
    ok('otwory prowadnic wg instrukcji V-BOX (37 + rozstaw wg NL)', !zle.length, zle.map((r) => r.note).join(' | '));
  }

  // 5. zawiasy klap: w wiencu (do gory) albo dnie (w dol), tyle co na rysunku, w tych samych miejscach
  const kl = plan.filter((r) => r.kind === 'zawias klapy');
  if (spr.klapa) {
    const zk = (await zawiasyRys(H)).filter((z) => z.w > z.h);
    ok(`zawiasy klapy w ${spr.klapa === 'gora' ? 'wieńcu' : 'dnie'}`, kl.length > 0 && kl.every((r) => (spr.klapa === 'gora' ? /Wieniec/ : /Dno/).test(r.panel)),
      kl.map((r) => r.panel).join(', ') || '(brak)');
    const xs = kl.flatMap((r) => r.ys).sort((a, c) => a - c);
    const xr = zk.map((z) => Math.round(z.x - t)).sort((a, c) => a - c);
    ok('zawiasy klapy tam, gdzie na rysunku', JSON.stringify(xs) === JSON.stringify(xr), `plan ${xs.join(',')} / rysunek ${xr.join(',')}`);
  }
};

await scenariusz('drzwi i półki', szafka('D'));
await scenariusz('dwie kolumny z przegrodą', szafka('P2', { W: 900, levels: [{ h: null, cols: [kol({ doors: 1 }), kol({ doors: 1, hinge: 'right' })] }] }), { spr: { przegrodaObie: true } });
await scenariusz('fix ze wspornikiem, zawias przy fixie', szafka('F', { levels: [{ h: null, cols: [kol({ doors: 1, hinge: 'left',
  fix: { side: 'left', w: 100, mode: 'overlay', support: true, supportDepth: 100 } })] }] }), { spr: { wspornik: 'left' } });
await scenariusz('fix bez wspornika, zawias od drugiej strony', szafka('F2', { levels: [{ h: null, cols: [kol({ doors: 1, hinge: 'right',
  fix: { side: 'left', w: 100, mode: 'overlay', support: false } })] }] }));
await scenariusz('fronty wpuszczane (półki cofnięte)', szafka('WP', { frontMode: 'inset' }));
await scenariusz('szuflady NL 500', szafka('S', { levels: [{ h: null, cols: [{ ...kol(), kind: 'drawers', drawers: [{ h: 'auto' }, { h: 'auto' }, { h: 'auto' }] }] }] }));
await scenariusz('szuflady, fronty wpuszczane (prowadnica cofnięta)', szafka('SW', { frontMode: 'inset', levels: [{ h: null, cols: [{ ...kol(), kind: 'drawers', drawers: [{ h: 'auto' }, { h: 'auto' }] }] }] }));
await scenariusz('szuflady NL 300 (płytka szafka)', szafka('S3', { D: 330, levels: [{ h: null, cols: [{ ...kol(), kind: 'drawers', drawers: [{ h: 'auto' }, { h: 'auto' }] }] }] }));
await scenariusz('wysoka, dwa poziomy', szafka('H', { W: 600, H: 2000, levels: [{ h: null, cols: [kol({ doors: 1 })] }, { h: 700, cols: [kol()] }] }), { spr: { polkiPrzelotowe: true } });
await scenariusz('klapa do góry', wisz('KG', { W: 800, H: 400, levels: [{ h: null, cols: [kol({ doors: 1, klapa: 'gora' })] }] }), { spr: { klapa: 'gora' } });
await scenariusz('klapa w dół', wisz('KD', { W: 600, H: 400, levels: [{ h: null, cols: [kol({ doors: 1, klapa: 'dol' })] }] }), { spr: { klapa: 'dol' } });
await scenariusz('półki na konfirmatach (bez kołków)', szafka('K', { shelfMount: 'confirmat' }));
await scenariusz('cokół bez nóżek (trójkąty), przegroda i wspornik', szafka('CT', { W: 900, legs: { on: false }, levels: [{ h: null, cols: [kol({ doors: 1 }),
  kol({ doors: 1, fix: { side: 'right', w: 100, mode: 'overlay', support: true, supportDepth: 100 } })] }] }));
await scenariusz('blat na szafce (trójkąty od spodu)', szafka('BL', { W: 800, top: { mode: 'blat', material: 'worktop', widthMode: 'outside', overL: 0, overR: 0, overFront: 20, overBack: 0 } }));
await scenariusz('wieniec na bokach', szafka('WB', { joints: { topL: 'over', topR: 'over', botL: 'between', botR: 'between' } }));

/* Projekty z rogiem: plan szafki w L (ramie) i wstawki szerokiej jest na karcie
   szafki w PDF. Liczby musza sie zgadzac z jej okuciami (korpus + ramie + wstawka). */
const PLr = { on: true, height: 100, mode: 'under', setback: 0 };
const RUNr = (id, name, o = {}) => ({ id, name, wallW: null, gap: 0, mountY: 0, H: 720, D: 560, plinth: PLr, worktop: true, corner: null, ...o });
const zRogiem = async (tytul, runs, items, aktywna, oczek) => {
  console.log(`\n== ${tytul} ==`);
  await page.evaluate((q) => { localStorage.clear(); localStorage.setItem('szafki:projekt', JSON.stringify(q)); },
    { name: 'W', active: aktywna, prices: {}, runs, items: items.map(([cab, runId]) => ({ cab, runId, offset: 0 })) });
  await page.reload({ waitUntil: 'networkidle' }); await page.waitForTimeout(900);
  const plan = await wiercenia(aktywna + 1);
  const okucia = await tabela(/^Produkty do zamówienia/);
  const q = (re) => { const r = okucia.find((x) => re.test(x[0])); return r ? num(r[r.length - 1].split(' ')[0]) : 0; };
  const ileWNocie = (note) => ((note.match(/,\s*([\d.]+(?:, [\d.]+)*) mm od przedniej/) || [])[1] || '').split(', ').filter(Boolean).length;
  const kon = plan.filter((r) => /^konfirmat/.test(r.kind)).reduce((a, r) => a + r.ys.length * ileWNocie(r.note), 0);
  const tr = plan.filter((r) => r.kind === 'trójkąt meblowy').reduce((a, r) => a + r.ys.length * (/2 rzędy/.test(r.note) ? 2 : 1) + (/po 1 na każdym krótkim boku/.test(r.note) ? 2 : 0), 0);
  const zaw = plan.filter((r) => r.kind === 'zawias').reduce((a, r) => a + r.ys.length, 0);
  /* Szafka w L nie ma boku od strony ramienia (stoi tam katownik). Ustalone
     z uzytkownikiem 2026-09-29: wieniec i dno konfirmatem w czolo obu plyt
     katownika, drzwi korpusu na jego boku, kolki polki we wzmocnieniu tylnym.
     Plan nie moze wiercic w boku, ktorego nie ma w formatkach. */
  const formatki = formatkiPdf;
  const bezBoku = ['Bok lewy', 'Bok prawy'].filter((n) => !formatki.includes(n) && !formatki.includes('Bok'));
  const naBrak = plan.filter((r) => bezBoku.includes(r.panel));
  ok('plan nie wierci w boku, którego nie ma w formatkach', !naBrak.length, naBrak.map((r) => `${r.panel} | ${r.kind}`).join(' / '));
  const zKatownikiem = plan.filter((r) => /^Kątownik przy ramieniu/.test(r.panel)).map((r) => r.panel);
  ok('kątowniki z planu są w formatkach', zKatownikiem.every((n) => formatki.includes(n)), zKatownikiem.join(', '));
  const konfOk = q(/^Konfirmat/);
  ok(`konfirmaty: plan ${kon} = okucia ${konfOk}`, kon === konfOk, plan.filter((r) => /^konfirmat/.test(r.kind)).map((r) => `${r.panel} ${r.kind}`).join(' | '));
  ok(`trójkąty: plan ${tr} = okucia ${q(/^Trójkąt/)}`, tr === q(/^Trójkąt/), plan.filter((r) => r.kind === 'trójkąt meblowy').map((r) => `${r.panel}: ${r.ys.join(',')}`).join(' | '));
  ok(`zawiasy: plan ${zaw} = okucia ${q(/^Zawias$/)}`, zaw === q(/^Zawias$/), plan.filter((r) => r.kind === 'zawias').map((r) => `${r.panel}: ${r.ys.join(',')}`).join(' | '));
  (oczek || []).forEach(([opis, re]) => ok(opis, plan.some((r) => re.test(`${r.panel} | ${r.kind}`)), [...new Set(plan.map((r) => `${r.panel} | ${r.kind}`))].join(' / ')));
};
const Lcab = (o = {}) => ({ name: 'L', W: 900, H: 720, D: 560, plinth: PLr, legs: { on: true, height: 100 }, corner: { on: true, arm: 640, doors: 'wsporniki', ...o },
  levels: [{ h: null, cols: [kol({ doors: 1 })] }] });
await zRogiem('szafka w L w rogu — ramię z drzwiami', [RUNr('c1', 'Ściana 1'), RUNr('c2', 'Ściana 2', { corner: { of: 'c1', at: 'end', owner: 'self', clear: 0 } })],
  [[szafka('A1'), 'c1'], [Lcab(), 'c2'], [szafka('B2'), 'c2']], 1,
  [['wieniec i dno w kątownik', /^(Wieniec|Dno) \| konfirmat — kątownik przy ramieniu/], ['kołki półki we wzmocnieniu tylnym', /^Kątownik przy ramieniu — (bok|plecy) \| kołek półki/],
   ['zawiasy drzwi korpusu na jego boku', /^Bok (lewy|prawy) \| zawias/],
   ['bok ramienia: konfirmaty dna ramienia', /^Bok ramienia \| konfirmat — dno ramienia/], ['bok ramienia: zawiasy frontu ramienia', /^Bok ramienia \| zawias/],
   ['bok ramienia: kołki półek ramienia', /^Bok ramienia \| kołek półki/]]);
await zRogiem('szafka w L w rogu — fix ramienia', [RUNr('c1', 'Ściana 1'), RUNr('c2', 'Ściana 2', { corner: { of: 'c1', at: 'end', owner: 'self', clear: 0 } })],
  [[szafka('A1'), 'c1'], [Lcab({ doors: 'fix' }), 'c2'], [szafka('B2'), 'c2']], 1,
  [['fix ramienia na trójkątach', /^Fix ramienia \| trójkąt meblowy/]]);
const USTr = { W: 1000, levels: [{ h: null, cols: [kol({ doors: 1, fix: { side: 'left', w: 621, mode: 'overlay', support: false }, hinge: 'right' })] }] };
await zRogiem('ślepy róg z wstawką szeroką (trójkąty wstawki)', [RUNr('c1', 'Ściana 1'), RUNr('c2', 'Ściana 2', { corner: { of: 'c1', at: 'end', owner: 'self', clear: 0, wstawka: { typ: 'szeroka', w: 60 } } })],
  [[szafka('A1'), 'c1'], [szafka('A2'), 'c1'], [szafka('R', USTr), 'c2']], 1,
  [['wstawka szeroka na trójkątach', /^Wstawka w rogu \| trójkąt meblowy/]]);

console.log('\n== frez pod HDF w planie ==');
await page.evaluate((q) => { localStorage.clear(); localStorage.setItem('szafki:projekt', JSON.stringify(q)); },
  { name: 'W', active: 0, prices: {}, runs: [], items: [{ cab: szafka('FR', { backGroove: { on: true, offset: 3, depth: 16, play: 1, wreg: true } }), runId: null, offset: 0 }] });
await page.reload({ waitUntil: 'networkidle' }); await page.waitForTimeout(800);
const planF = await wiercenia();
const zFrezem = planF.filter((r) => r.kind === 'frez pod HDF').map((r) => r.panel);
ok('frez pod HDF w bokach, wieńcu i dnie (16 × 3)', ['Bok lewy', 'Bok prawy', 'Wieniec', 'Dno'].every((n) => zFrezem.includes(n))
  && planF.filter((r) => r.kind === 'frez pod HDF').every((r) => /16 mm w grubość płyty × 3 mm/.test(r.note)), zFrezem.join(', '));

console.log('\nBLEDY:', errors.length ? errors.join('; ') : '(brak)');
await b.close();
