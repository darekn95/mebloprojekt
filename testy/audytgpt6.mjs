/* Audyt GPT 2026-10-21, ustalenia N69–N81 (`AUDYT_GPT.md` na galezi gpt/audyt-2026-10-16).
   Decyzje uzytkownika 2026-10-22:
   - N77 listwa: w sklepie odcinki 1 m i 2 m, tniemy na dokladne dlugosci; jedna
     listwa na caly ciag (za wszystkimi szafkami), zakup z jak najmniejszym odpadem —
     docinki na krotsze kawalki, czasem lepiej 2 m niz dwa razy 1 m;
   - N75 kolki: gdy przesuniecie do srodka nie rozdziela otworow — na zewnatrz,
     z podpowiedzia „kolki przesuniete albo zamien na trojkaty”. */
import pw from './pw.mjs';
const URL = process.env.STD ? 'http://127.0.0.1:5199/standalone-local.html'
  : 'http://127.0.0.1:5205/mebloprojekt-app.html';
const ok = (l, c, e = '') => console.log((c ? '  OK   ' : '  BLAD ') + l + (e ? ' — ' + e : ''));
const b = await pw.chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const page = await (await b.newContext({ viewport: { width: 1500, height: 1300 } })).newPage();
const errors = []; page.on('pageerror', (e) => errors.push(e.message));
await page.goto(URL, { waitUntil: 'networkidle' });

const PL = { on: true, height: 100, mode: 'under', setback: 0 };
const cab = (o = {}) => ({ name: 'S', W: 600, H: 720, D: 560, plinth: PL, levels: [{ h: null, cols: [{ kind: 'doors', doors: 1, w: null }] }], ...o });
const proj = (items, runs = [], extra = {}) => ({ name: 'A', active: 0, prices: {}, runs, items: items.map((it) => ({ offset: 0, runId: null, ...it })), ...extra });
const seed = async (p) => {
  await page.evaluate((q) => { localStorage.clear(); localStorage.setItem('szafki:projekt', JSON.stringify(q)); }, p);
  await page.reload({ waitUntil: 'networkidle' }); await page.waitForTimeout(1200);
};
const rows = (re) => page.evaluate((src) => { const r = new RegExp(src);
  const sec = [...document.querySelectorAll('section')].find((s) => r.test(s.querySelector('h2')?.textContent || ''));
  return sec ? [...sec.querySelectorAll('tbody tr')].map((tr) => [...tr.children].map((x) => x.innerText.trim().replace(/\s+/g, ' ')).join(' | ')) : []; }, re.source);
const uwagi = async () => (await page.evaluate(() => [...document.querySelectorAll('section')].find((s) => /^Uwagi/.test(s.querySelector('h2')?.textContent || ''))?.innerText || ''));
const linie = (t, re) => t.split('\n').filter((l) => re.test(l)).join(' / ');

console.log('== N77: listwa montażowa — odcinki 1 m / 2 m, jedna na ciąg ==');
{
  const wisz = (n, W, o = {}) => cab({ name: n, W, D: 300, plinth: { on: false }, legs: { on: false }, hangerMode: 'listwa', ...o });
  const listwa = async () => (await rows(/^Produkty całego projektu/)).filter((r) => /^Listwa/.test(r));
  await seed(proj([{ cab: wisz('A', 680) }]));
  // jedna szafka — lista szafki jest zamowieniem
  let l = (await rows(/^Produkty do zamówienia/)).filter((r) => /^Listwa/.test(r));
  ok('szafka 680: odcinek 640 mm z jednego odcinka 1 m (nie 0,6 mb)', l.length === 1 && /kupić 1 × 1 m: potrzeba 640 mm, odpad 360 mm/.test(l[0]) && /\| 1 mb$/.test(l[0]), l.join(' / '));
  await seed(proj([{ cab: wisz('A', 680) }, { cab: wisz('B', 680) }, { cab: wisz('C', 680) }]));
  l = await listwa();
  ok('trzy osobne szafki 680: 3 × 640 z jednego odcinka 2 m (a nie 3 × 1 m)', l.length === 1 && /kupić 1 × 2 m: potrzeba 1920 mm, odpad 80 mm/.test(l[0]) && /\| 2 mb$/.test(l[0]), l.join(' / '));
  const R = [{ id: 'c1', name: 'Ściana', wallW: null, gap: 0, mountY: 1400, H: 720, D: 300, plinth: null, worktop: false, hangerMode: 'listwa', corner: null }];
  await seed(proj([...['A', 'B', 'C', 'D'].map((n) => ({ cab: wisz(n, 800), runId: 'c1' })), { cab: wisz('X', 680) }], R));
  l = await listwa();
  ok('ciąg 4 × 800 + osobna 680: listwa ciągu 3160 (2 m cały + 1160), docinek 2 m na szafkę X — razem 2 × 2 m',
    l.length === 1 && /kupić 2 × 2 m: potrzeba 3800 mm, odpad 200 mm/.test(l[0]) && /2 m → cały \(Ściana\)/.test(l[0]) && /1160 \(Ściana\) \+ 640 \(X\)/.test(l[0]) && /\| 4 mb$/.test(l[0]), l.join(' / '));
}

console.log('\n== N75: kołki po obu stronach przegrody — końcowe pozycje otworów ==');
{
  // plan wiercen z wydruku (PDF): wiersze tabeli „Otwory pod…”
  const wiercenia = async () => {
    await page.evaluate(() => { window.__rep = null; window.print = () => {
      const t = [...document.querySelectorAll('.print-only .rp-page table')].find((x) => /Otwory pod/.test(x.querySelector('thead')?.textContent || ''));
      window.__rep = t ? [...t.querySelectorAll('tbody tr')].map((tr) => [...tr.children].map((x) => x.textContent.trim()).join(' | ')) : [];
    }; });
    await page.getByRole('button', { name: 'Zestawienie PDF', exact: true }).first().click();
    await page.waitForTimeout(1000);
    return ((await page.evaluate(() => window.__rep)) || []).filter((r) => /kołek|trójkąt/.test(r));
  };
  const k2 = (D, pin, mount = 'pins') => cab({ W: 800, D, back: 'none', hangers: 'never', plinth: { on: false }, legs: { on: true, height: 100 }, shelfMount: mount, shelfPin: pin,
    levels: [{ h: null, cols: [{ kind: 'doors', doors: 0, w: null, shelfTargets: [null, null] }, { kind: 'doors', doors: 0, w: null, shelfTargets: [null, null] }] }] });
  for (const [D, przed, po] of [[240, '100 i 140', '80 i 160'], [220, '100 i 120', '80 i 140']]) {
    await seed(proj([{ cab: k2(D, { dFront: 100, dBack: 100 }) }]));
    const w = await wiercenia();
    const k1 = w.find((r) => /od kolumny 1/.test(r)) || '', k2r = w.find((r) => /od kolumny 2/.test(r)) || '';
    ok(`D${D}: kolumna 1 ${przed}, kolumna 2 przesunięta na zewnątrz ${po} (bez zbieżnych otworów)`,
      new RegExp(`${przed} mm`).test(k1) && new RegExp(`${po} mm.*przesunięte o 20 mm na zewnątrz`).test(k2r), `${k1} // ${k2r}`);
    const u = await uwagi();
    ok(`D${D}: podpowiedź „przesunięte … albo trójkąty” z przyciskiem`, /Kołki półek kolumny 2 na wysokości \d+ mm przesunięte o 20 mm na zewnątrz/.test(u) && /Półki kolumny 2 na trójkątach/.test(u), linie(u, /Kołki półek/));
  }
  await seed(proj([{ cab: k2(280, { dFront: 100, dBack: 100 }) }]));
  let w = await wiercenia();
  ok('D280: zwykłe 20 mm do środka (120 i 160), bez podpowiedzi', w.some((r) => /od kolumny 2/.test(r) && /120 i 160 mm.*do środka/.test(r)) && !/Kołki półek kolumny/.test(await uwagi()), w.join(' // '));
  await seed(proj([{ cab: k2(560, {}) }]));
  w = await wiercenia();
  ok('D560 domyślne 37/37: kolumna 2 57 i 503 (do środka)', w.some((r) => /od kolumny 2/.test(r) && /57 i 503 mm/.test(r)), w.join(' // '));
  await seed(proj([{ cab: k2(240, {}, 'trojkaty') }]));
  w = await wiercenia();
  ok('trójkąty D240: kolumna 2 70 i 170 (do środka), kolumna 1 50 i 190', w.some((r) => /od kolumny 2/.test(r) && /70 i 170 mm/.test(r)) && w.some((r) => /od kolumny 1/.test(r) && /50 i 190 mm/.test(r)), w.join(' // '));
}

console.log('\n== N69: blat przy ścianie dalej u góry niż u dołu ==');
{
  const pick = async (l) => { const x = page.getByRole('button', { name: l, exact: true }); if (await x.count()) { await x.first().click(); await page.waitForTimeout(300); } };
  const blat3d = async (wallGap) => {
    const R = [{ id: 'c1', name: 'Ściana 1', wallW: null, gap: 0, mountY: 0, H: 720, D: 560, plinth: PL, worktop: true, corner: null, wallGap }];
    await seed(proj([{ cab: cab({ name: 'A' }), runId: 'c1' }], R));
    await pick('Szafka'); await pick('Zamk.');
    await page.evaluate(() => { window.__audytBryl = []; });
    await pick('3D'); await page.waitForTimeout(300);
    const a = await page.evaluate(() => { const x = window.__audytBryl; window.__audytBryl = null; return x || []; });
    await pick('Front');
    return a.filter((q) => q.tag === 'blat').map((q) => q.p.map(Math.round));
  };
  const b0 = await blat3d({ bottom: 0, top: null }), b1 = await blat3d({ bottom: 0, top: 100 });
  const z = (b) => (b.length ? `${b[0][2]}…${b[0][5]}` : '(brak)');
  /* z: od lica w glab — tyl blatu dochodzi do sciany na wysokosci blatu (100 mm dalej).
     Przod: wysieg zwykly (0/0 — 37 mm, bo blat 600 z arkusza 600; 0/100 — 693 mm z arkusza
     1200, wysieg 30), a nie 130 mm jak przed poprawka (blat od linii sciany przy podlodze). */
  ok('dół 0 / góra 100: tył blatu 100 mm dalej, wysięg z przodu zwykły (do 40 mm, nie 130)',
    b0.length === 1 && b1.length === 1 && b1[0][5] === b0[0][5] + 100 && b1[0][2] >= -40 && b1[0][2] < 0, `0/0: ${z(b0)}, 0/100: ${z(b1)}`);
}

console.log('\n== N70: kątownik szafki w L z płyty półek 12 mm ==');
{
  const pick = async (l) => { const x = page.getByRole('button', { name: l, exact: true }); if (await x.count()) { await x.first().click(); await page.waitForTimeout(300); } };
  for (const typ of ['A', 'B']) for (const side of ['right', 'left']) {
    await seed(proj([{ cab: cab({ name: 'L', W: 900, shelfSameAsBoard: false, corner: { on: true, side, arm: 640, doors: 'wsporniki', post: { on: true, w: 150, typ } },
      levels: [{ h: null, cols: [{ kind: 'doors', doors: 1, w: null, shelfTargets: [null, null] }] }] }), mat: { shelf: { thickness: 12 } } }]));
    await pick('Szafka'); await pick('Zamk.');
    await page.evaluate(() => { window.__audytBryl = []; });
    await pick('3D'); await page.waitForTimeout(300);
    const a = await page.evaluate(() => { const x = window.__audytBryl; window.__audytBryl = null; return x || []; });
    await pick('Front');
    const kat = a.map((q) => [...q.d].map(Math.round).sort((x, y) => x - y).join('×')).filter((d) => /^\d+×150×684$/.test(d));
    const f = (await rows(/^Formatki do zamówienia/)).filter((r) => /^Kątownik przy ramieniu/.test(r));
    ok(`${typ}, ${side === 'right' ? 'z prawej' : 'z lewej'}: płyty kątownika w 3D 12 mm jak w zamówieniu (płyta półek)`,
      kat.length === 2 && kat.every((d) => d === '12×150×684') && f.length === 2 && f.every((r) => /12 mm|× 12|12$/.test(r) || /\b12\b/.test(r)), `3D: ${kat.join(', ')} | ${f.join(' / ')}`);
  }
}

console.log('\nBLEDY:', errors.length ? errors.join('\n') : '(brak)');
await b.close();
