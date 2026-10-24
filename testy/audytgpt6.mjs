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
// standalone rysuje bryle 3D dwa razy (StrictMode) — te same bryly liczymy raz (jak `audytszuflad`)
const bezPowtorzen = (lista) => { const byl = new Set(); return lista.filter((s) => { const k = JSON.stringify([s.p, s.color, s.tag]); if (byl.has(k)) return false; byl.add(k); return true; }); };

console.log('== N77: listwa montażowa — odcinki 1 m / 2 m, jedna na ciąg ==');
/* Uzytkownik 2026-10-24: listwa na wymiar szafki / ciagu (nie −40), najwyzej 10 mm krotsza,
   gdy to oszczedza odcinek; skrajna szafka bez zawieszek — listwa konczy sie przed nia;
   plecy cofniete — listwa w szafce, szerokosc plecow − 2 × 5 mm. */
{
  const wisz = (n, W, o = {}) => cab({ name: n, W, D: 300, plinth: { on: false }, legs: { on: false }, hangerMode: 'listwa', ...o });
  const listwa = async () => (await rows(/^Produkty całego projektu/)).filter((r) => /^Listwa/.test(r));
  await seed(proj([{ cab: wisz('A', 680) }]));
  // jedna szafka — lista szafki jest zamowieniem
  let l = (await rows(/^Produkty do zamówienia/)).filter((r) => /^Listwa/.test(r));
  ok('szafka 680: listwa 680 mm (na wymiar) z odcinka 1 m', l.length === 1 && /kupić 1 × 1 m: potrzeba 680 mm, odpad 320 mm/.test(l[0]) && /\| 1 mb$/.test(l[0]), l.join(' / '));
  await seed(proj([{ cab: wisz('A', 660) }, { cab: wisz('B', 660) }, { cab: wisz('C', 660) }]));
  l = await listwa();
  ok('trzy osobne szafki 660: 3 × 660 z jednego odcinka 2 m (a nie 3 × 1 m)', l.length === 1 && /kupić 1 × 2 m: potrzeba 1980 mm, odpad 20 mm/.test(l[0]) && /\| 2 mb$/.test(l[0]), l.join(' / '));
  await seed(proj([{ cab: wisz('A', 670) }, { cab: wisz('B', 670) }, { cab: wisz('C', 670) }]));
  l = await listwa();
  ok('trzy szafki 670 (2010 mm): jedna listwa krótsza o 10 mm — 1 × 2 m zamiast 3 m', l.length === 1 && /kupić 1 × 2 m: potrzeba 2000 mm, odpad 0 mm \(skrócona o 10 mm/.test(l[0]) && /660 \(C, −10 mm\)/.test(l[0]), l.join(' / '));
  const R = [{ id: 'c1', name: 'Ściana', wallW: null, gap: 0, mountY: 1400, H: 720, D: 300, plinth: null, worktop: false, hangerMode: 'listwa', corner: null }];
  await seed(proj([...['A', 'B', 'C', 'D'].map((n) => ({ cab: wisz(n, 800), runId: 'c1' })), { cab: wisz('X', 680) }], R));
  l = await listwa();
  ok('ciąg 4 × 800 + osobna 680: listwa ciągu 3200 (2 m cały + 1200), docinek na szafkę X — razem 2 × 2 m',
    l.length === 1 && /kupić 2 × 2 m: potrzeba 3880 mm, odpad 120 mm/.test(l[0]) && /2 m → cały \(Ściana\)/.test(l[0]) && /1200 \(Ściana\) \+ 680 \(X\)/.test(l[0]) && /\| 4 mb$/.test(l[0]), l.join(' / '));
  await seed(proj([{ cab: wisz('A', 600, { hangers: 'never' }), runId: 'c1' }, { cab: wisz('B', 600), runId: 'c1' }, { cab: wisz('C', 600), runId: 'c1' }], R));
  l = await listwa();
  ok('skrajna szafka bez zawieszek: listwa kończy się przed nią (1200, nie 1800)', l.length === 1 && /potrzeba 1200 mm/.test(l[0]) && /1200 \(Ściana\)/.test(l[0]), l.join(' / '));
  await seed(proj([{ cab: wisz('A', 600), runId: 'c1' }, { cab: wisz('B', 600, { hangers: 'never' }), runId: 'c1' }, { cab: wisz('C', 600), runId: 'c1' }], R, { active: 1 }));
  l = await listwa();
  const u = await uwagi();
  ok('środkowa bez zawieszek: listwa przechodzi (1800) i ostrzeżenie „może być pomyłka”', l.length === 1 && /potrzeba 1800 mm/.test(l[0]) && /bez zawieszek.*to może być pomyłka/.test(u), `${l.join(' / ')} | ${linie(u, /bez zawieszek/)}`);
  const cof = { back: 'board', backPos: 'inside', backRecess: 10 };
  await seed(proj([{ cab: wisz('A', 600), runId: 'c1' }, { cab: wisz('B', 600, cof), runId: 'c1' }, { cab: wisz('C', 600), runId: 'c1' }], R));
  l = await listwa();
  ok('środkowa z plecami cofniętymi 10 mm: listwa w niej 600 − 2 × 18 − 10 = 554, ciąg w dwóch odcinkach 600', l.length === 1 && /554 \(B\)/.test(l[0]) && (l[0].match(/600 \(Ściana\)/g) || []).length === 2, l.join(' / '));
}

console.log('\n== N75: kołki po obu stronach przegrody — końcowe pozycje otworów ==');
/* Uzytkownik 2026-10-24: kolki jak trojkaty 50 mm od krawedzi, otwory mijaja sie o 10 mm;
   na glebokiej polce druga strona 10 mm do srodka, na waskiej (do 300) — na zewnatrz (40). */
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
  const para = async (D, pin, mount, k1re, k2re, opis, podpowiedz) => {
    await seed(proj([{ cab: k2(D, pin, mount) }]));
    const w = await wiercenia();
    const r1 = w.find((r) => /od kolumny 1/.test(r)) || '', r2 = w.find((r) => /od kolumny 2/.test(r)) || '';
    const u = await uwagi();
    ok(opis, k1re.test(r1) && k2re.test(r2) && (podpowiedz ? /Kołki półek kolumny 2 na wysokości \d+ mm przesunięte/.test(u) && /Półki kolumny 2 na trójkątach/.test(u) : !/Kołki półek kolumny/.test(u)),
      `${r1.slice(0, 90)} // ${r2.slice(0, 140)} | ${linie(u, /Kołki półek/)}`);
  };
  await para(560, {}, 'pins', /50 i 510 mm/, /60 i 500 mm.*przesunięte o 10 mm do środka/, 'D560 domyślne 50 / 50: kolumna 2 10 mm do środka (60 i 500), bez podpowiedzi', false);
  await para(240, {}, 'pins', /50 i 190 mm/, /40 i 200 mm.*przesunięte o 10 mm na zewnątrz/, 'D240 (wąska): kolumna 2 10 mm na zewnątrz (40 i 200), bez podpowiedzi', false);
  await para(240, { dFront: 100, dBack: 100 }, 'pins', /100 i 140 mm/, /90 i 150 mm.*na zewnątrz/, 'D240, otwory 100 / 100 (przypadek GPT N75): 90 i 150 — bez zbieżnych otworów', false);
  await para(560, { dFront: 270, dBack: 270 }, 'pins', /270 i 290 mm/, /(do tyłu|do przodu|na zewnątrz)/, 'D560, otwory 270 / 270: do środka się nie da — inne przesunięcie z podpowiedzią o trójkątach', true);
  await para(240, {}, 'trojkaty', /50 i 190 mm/, /40 i 200 mm.*na zewnątrz/, 'trójkąty D240: kolumna 2 40 i 200 (na zewnątrz)', false);
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
    const a = bezPowtorzen(await page.evaluate(() => { const x = window.__audytBryl; window.__audytBryl = null; return x || []; }));
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
    const a = bezPowtorzen(await page.evaluate(() => { const x = window.__audytBryl; window.__audytBryl = null; return x || []; }));
    await pick('Front');
    const kat = a.map((q) => [...q.d].map(Math.round).sort((x, y) => x - y).join('×')).filter((d) => /^\d+×150×684$/.test(d));
    const f = (await rows(/^Formatki do zamówienia/)).filter((r) => /^Kątownik przy ramieniu/.test(r));
    ok(`${typ}, ${side === 'right' ? 'z prawej' : 'z lewej'}: płyty kątownika w 3D 12 mm jak w zamówieniu (płyta półek)`,
      kat.length === 2 && kat.every((d) => d === '12×150×684') && f.length === 2 && f.every((r) => /12 mm|× 12|12$/.test(r) || /\b12\b/.test(r)), `3D: ${kat.join(', ')} | ${f.join(' / ')}`);
  }
}

console.log('\n== N71: zabudowa przeszkody z płyty 18 mm w korpusie 12 mm ==');
{
  const pick = async (l) => { const x = page.getByRole('button', { name: l, exact: true }); if (await x.count()) { await x.first().click(); await page.waitForTimeout(300); } };
  for (const [typ, fs, czolo] of [['U', 200, 136], ['L', 0, 106]]) {
    await seed(proj([{ cab: cab({ name: 'Z', W: 800, H: 1000, plinth: { on: false }, legs: { on: false }, shelfSameAsBoard: false,
      obstacles: [{ on: true, w: 100, d: 150, h: 0, side: 'left', fromSide: fs, fromBack: 0, fromBottom: 0, fullHeight: true, mask: true, maskType: typ, maskFront: 'over' }],
      levels: [{ h: null, cols: [{ kind: 'doors', doors: 0, w: null, shelfTargets: [null] }] }] }), mat: { board: { thickness: 12 }, shelf: { thickness: 18 } } }]));
    await pick('Szafka'); await pick('Zamk.');
    await page.evaluate(() => { window.__audytBryl = []; });
    await pick('3D'); await page.waitForTimeout(300);
    const a = bezPowtorzen(await page.evaluate(() => { const x = window.__audytBryl; window.__audytBryl = null; return x || []; }));
    await pick('Front');
    // scianki zabudowy: wysokosc 976 (wnetrze 1000 − 2 × 12), jedna z grubosci 18
    const sc = a.map((q) => [...q.d].map(Math.round).sort((x, y) => x - y)).filter((d) => d[2] === 976 && d[0] <= 20).map((d) => d.join('×'));
    const f = (await rows(/^Formatki do zamówienia/)).filter((r) => /^Zabudowa/.test(r));
    ok(`${typ}: ścianki w 3D 18 mm, czoło ${czolo} mm w zamówieniu (płyta zabudowy, nie korpusu)`,
      sc.length === (typ === 'U' ? 3 : 2) && sc.every((d) => /^18×/.test(d)) && f.some((r) => /czoło|czołowa/.test(r) && new RegExp(`\\| ${czolo} \\|`).test(r)), `3D: ${sc.join(', ')} | ${f.join(' / ')}`);
  }
}

const pick = async (l) => { const x = page.getByRole('button', { name: l, exact: true }); if (await x.count()) { await x.first().click(); await page.waitForTimeout(300); } };
const bryly = async (widok = 'Szafka') => {
  await pick(widok); await pick('Zamk.');
  await page.evaluate(() => { window.__audytBryl = []; });
  await pick('3D'); await page.waitForTimeout(300);
  const a = bezPowtorzen(await page.evaluate(() => { const x = window.__audytBryl; window.__audytBryl = null; return x || []; }));
  await pick('Front');
  return a.filter((q) => q.p);
};
const kolumna = (o = {}) => ({ kind: 'doors', doors: 0, w: null, shelfTargets: [null], ...o });

console.log('\n== N72: ręczne wzmocnienie poza korpusem ==');
for (const [opis, rail, re] of [
  ['poziome 200 mm, 500 od lica', { orient: 'shelf', depth: 200, atDepth: 500, pos: 'top' }, /wzmocnienie 1 \(poziome\) sięga 700 mm w głąb, a korpus ma 560 mm — wychodzi o 140 mm poza korpus\. Popraw: przy 500 mm od lica głębokość najwyżej 60 mm, a przy głębokości 200 mm — najwyżej 360 mm od lica/],
  ['czołowe 800 mm', { orient: 'front', h: 800, atDepth: 0, pos: 'top' }, /wzmocnienie 1 \(czołowe\) ma 800 mm wysokości, a poziom ma 684 mm — wychodzi poza korpus\. Najwyżej 684 mm/],
  ['poziome 200 mm, 360 od lica (do tyłu korpusu)', { orient: 'shelf', depth: 200, atDepth: 360, pos: 'top' }, null]]) {
  await seed(proj([{ cab: cab({ plinth: { on: false }, legs: { on: true, height: 100 }, hangers: 'never', levels: [{ h: null, cols: [kolumna({ rails: [rail] })] }] }) }]));
  const u = await uwagi();
  ok(`${opis}: ${re ? 'błąd z największym wymiarem' : 'bez uwagi (mieści się)'}`, re ? re.test(u) : !/wzmocnienie 1 .*poza korpus/.test(u), linie(u, /wzmocnienie 1/));
}

console.log('\n== N73: plecy tylko w kolumnie — szafka dalej od ściany ==');
{
  const R = [{ id: 'c1', name: 'Ściana 1', wallW: null, gap: 0, mountY: 0, H: 720, D: 560, plinth: PL, worktop: true, corner: null }];
  await seed(proj([{ cab: cab({ name: 'P', back: 'none', levels: [{ h: null, cols: [kolumna({ backMode: 'board' }), kolumna({ backMode: 'none' })] }] }), runId: 'c1' }], R));
  const a = await bryly();
  const blat = a.filter((q) => q.tag === 'blat');
  const plecy = a.filter((q) => Math.round(q.p[5] - q.p[2]) === 18 && Math.round(q.p[4] - q.p[1]) >= 700 && q.p[2] >= 559);
  ok('plecy z płyty 18 w kolumnie za korpusem 560…578, blat dochodzi do ściany za nimi (578)',
    plecy.length === 1 && Math.round(plecy[0].p[5]) === 578 && blat.length === 1 && Math.round(blat[0].p[5]) === 578,
    `plecy z: ${plecy.map((q) => `${Math.round(q.p[2])}…${Math.round(q.p[5])}`).join(', ')}; blat z: ${blat.map((q) => `${Math.round(q.p[2])}…${Math.round(q.p[5])}`).join(', ')}`);
}

console.log('\n== N74: niska klapa w dół — płytka amortyzatora poza bokiem ==');
for (const [H, zle] of [[200, true], [250, true], [300, false]]) {
  await seed(proj([{ cab: cab({ W: 400, H, D: 350, plinth: { on: false }, legs: { on: true, height: 100 }, hangers: 'never',
    levels: [{ h: null, cols: [{ kind: 'doors', doors: 1, w: null, shelfTargets: [null], klapa: 'dol', silowniki: 1 }] }] }) }]));
  const u = await uwagi();
  const re = /płytka amortyzatora GTV PD-ECGDL wypada poza płytą: jej środek jest 245 mm nad płytą pod klapą, a do góry poziomu jest \d+ mm\. Potrzeba co najmniej 260 mm/;
  ok(`H${H}: ${zle ? 'błąd „płytka poza płytą” z radą' : 'płytka na boku — bez błędu'}`, zle ? re.test(u) : !/wypada poza płytą/.test(u), linie(u, /płytka|amortyzator/));
}

console.log('\n== N76: wspornik fixu wpuszczanego a wzmocnienie 100 mm od lica ==');
for (const [mode, h] of [['inset', 666], ['overlay', 684]]) {
  await seed(proj([{ cab: cab({ plinth: { on: false }, legs: { on: true, height: 100 }, hangers: 'never', levels: [{ h: null, cols: [{ kind: 'doors', doors: 1, w: null, shelfTargets: [null],
    fix: { side: 'left', w: 60, mode, support: true, supportDepth: 100 }, rails: [{ orient: 'shelf', depth: 100, atDepth: 100, pos: 'bottom' }] }] }] }) }]));
  const w = (await rows(/^Formatki do zamówienia/)).filter((r) => /^Wspornik/.test(r));
  const a = await bryly();
  const wsp = a.filter((q) => Math.round(q.p[3] - q.p[0]) === 18 && Math.round(q.p[5] - q.p[2]) === 100 && Math.round(q.p[4] - q.p[1]) > 600);
  const wzm = a.filter((q) => Math.round(q.p[4] - q.p[1]) === 18 && Math.round(q.p[5] - q.p[2]) === 100 && Math.round(q.p[3] - q.p[0]) > 500);
  const prz = wsp.flatMap((A) => wzm.map((B) => [0, 1, 2].map((k) => Math.min(A.p[k + 3], B.p[k + 3]) - Math.max(A.p[k], B.p[k])))).filter((d) => d.every((x) => x > 0.5));
  ok(`fix ${mode === 'inset' ? 'wpuszczany' : 'nakładany'}: wspornik ${h} mm, w 3D nie przecina wzmocnienia`, w.some((r) => new RegExp(`\\| ${h} \\|`).test(r)) && wsp.length === 1 && !prz.length,
    `${w.join(' / ')} | przecięcia: ${prz.map((d) => d.map(Math.round).join('×')).join(', ') || 'brak'}`);
}

console.log('\n== N78 / N79: własne blaty szafek w ciągu bez blatu roboczego ==');
{
  const R = [{ id: 'c1', name: 'C', wallW: null, gap: 0, mountY: 0, H: 720, D: 560, plinth: null, worktop: false, corner: null }];
  const blat = { mode: 'blat', material: 'board', overL: 0, overR: 0, overFront: 0, overBack: 0 };
  const c2 = (n, o = {}) => cab({ name: n, plinth: { on: false }, legs: { on: false }, levels: [{ h: null, cols: [kolumna()] }], ...o });
  const dab = { board: { name: 'Dąb sonoma', color: '#b08a5a', thickness: 18 } }, ant = { board: { name: 'Antracyt', color: '#333333', thickness: 12 } };
  await seed(proj([{ cab: c2('A'), mat: dab, runId: 'c1' }, { cab: c2('B', { top: blat }), mat: ant, runId: 'c1' }], R));
  let a = await bryly('Ciąg');
  const naPodlodze = a.filter((q) => q.p[1] < 5 && q.p[4] - q.p[1] < 40 && q.p[3] - q.p[0] >= 590 && q.p[5] - q.p[2] >= 550);
  ok('N78: bez dodatkowej płyty blatu przy podłodze w 3D zabudowy', !naPodlodze.length, naPodlodze.map((q) => q.p.map(Math.round).join(',')).join(' / '));
  let f = (await rows(/^Formatki całego projektu/)).filter((r) => /^Blat/.test(r));
  // grubosci tabela nie pokazuje — material z nazwy (grubosc 12 sprawdza harness runTop: th 12, y 708)
  ok('N79: blat ciągu z płyty szafki B (Antracyt), nie z pierwszej szafki (Dąb)', f.length === 1 && /Antracyt/.test(f[0]) && !/Dąb/.test(f[0]), f.join(' / '));
  await seed(proj([{ cab: c2('A', { top: blat }), mat: dab, runId: 'c1' }, { cab: c2('B', { top: blat }), mat: ant, runId: 'c1' }], R));
  f = (await rows(/^Formatki całego projektu/)).filter((r) => /^Blat/.test(r));
  const u = await uwagi();
  ok('N79: dwa własne blaty z różnych płyt — każdy ze swoją szafką, z informacją', f.length === 2 && f.some((r) => /Dąb/.test(r)) && f.some((r) => /Antracyt/.test(r))
    && /Własne blaty szafek ciągu „C" \(„A" i „B"\) są z różnych płyt/.test(u), `${f.join(' / ')} | ${linie(u, /Własne blaty/)}`);
  await seed(proj([{ cab: c2('A', { top: blat }), mat: dab, runId: 'c1' }, { cab: c2('B', { top: blat }), mat: dab, runId: 'c1' }], R));
  f = (await rows(/^Formatki całego projektu/)).filter((r) => /^Blat/.test(r));
  ok('ta sama płyta: jeden blat ciągu 1200 × 560', f.length === 1 && /Blat ciągu/.test(f[0]) && /1200/.test(f[0]), f.join(' / '));
}

console.log('\n== N80: lustra 4 i 6 mm ==');
{
  const lc = () => cab({ H: 900, levels: [{ h: null, cols: [{ kind: 'doors', doors: 1, w: null, mirrors: [true] }] }] });
  await seed(proj([{ cab: lc(), mat: { mirror: { thickness: 4 } } }, { cab: lc(), mat: { mirror: { thickness: 6 } } }]));
  const l = (await rows(/^Produkty całego projektu/)).filter((r) => /^Lustro/.test(r));
  ok('dwa wiersze: 4 mm i 6 mm', l.length === 2 && l.some((r) => /4 mm, 595 × 893 mm × 1 szt\./.test(r)) && l.some((r) => /6 mm, 595 × 893 mm × 1 szt\./.test(r)), l.join(' / '));
  await seed(proj([{ cab: lc(), mat: { mirror: { thickness: 4 } } }, { cab: lc(), mat: { mirror: { thickness: 4 } } }]));
  const l2 = (await rows(/^Produkty całego projektu/)).filter((r) => /^Lustro/.test(r));
  ok('ta sama grubość: jeden wiersz × 2 szt.', l2.length === 1 && /4 mm, 595 × 893 mm × 2 szt\./.test(l2[0]), l2.join(' / '));
}

console.log('\n== N81: mocowania pleców w kolumnach ==');
for (const [opis, back, a, bb, hdf, wk] of [['brak, HDF w kolumnie 1', 'none', 'hdf', 'none', 21, 0], ['HDF, płyta + HDF', 'hdf', 'board', 'hdf', 21, 21], ['HDF, obie „brak”', 'hdf', 'none', 'none', 0, 0], ['HDF zwykłe', 'hdf', null, null, 27, 0]]) {
  await seed(proj([{ cab: cab({ back, hangers: 'never', levels: [{ h: null, cols: [kolumna(a ? { backMode: a } : {}), kolumna(bb ? { backMode: bb } : {})] }] }) }]));
  const pr = await rows(/^Produkty do zamówienia/);
  const ile = (re) => { const r = pr.find((x) => re.test(x)); return r ? Number((/(\d+) szt\./.exec(r.split(' | ').slice(-1)[0]) || [])[1] || (/\| (\d+) szt/.exec(r) || [])[1] || -1) : 0; };
  const z = ile(/^Zszywka/), w = ile(/^Wkręt 3,5/);
  ok(`${opis}: zszywki ${hdf}, wkręty do pleców ${wk}`, z === hdf && w === wk, pr.filter((r) => /pleców/.test(r)).join(' / ') || '(brak)');
}

console.log('\n== plecy z płyty cofnięte (opcja, użytkownik 2026-10-24) ==');
for (const rec of [0, 10]) {
  await seed(proj([{ cab: cab({ back: 'board', backPos: 'inside', backRecess: rec, hangers: 'never', levels: [{ h: null, cols: [kolumna({ shelfTargets: [null, null] })] }] }) }]));
  const a = await bryly();
  // plecy wewnatrz: plyta 18, wysoka; polka: plyta pozioma 18 na szerokosc wnetrza
  const plecy = a.filter((q) => Math.round(q.p[5] - q.p[2]) === 18 && q.p[4] - q.p[1] > 600 && q.p[3] - q.p[0] > 500);
  const polki = a.filter((q) => Math.round(q.p[4] - q.p[1]) === 18 && q.p[1] > 100 && q.p[1] < 600 && q.p[3] - q.p[0] > 500);
  const f = (await rows(/^Formatki do zamówienia/)).filter((r) => /^Plecy z płyty/.test(r));
  const zp = plecy.map((q) => `${Math.round(q.p[2])}…${Math.round(q.p[5])}`).join(', '), zs = polki.map((q) => `${Math.round(q.p[2])}…${Math.round(q.p[5])}`).join(', ');
  // formatka plecow bez zmian (564 × 684) — cofa sie tylko polozenie
  ok(`cofnięcie ${rec}: plecy ${560 - 18 - rec}…${560 - rec}, półka kończy się przed nimi, formatka pleców 564 × 684`,
    plecy.length === 1 && Math.round(plecy[0].p[5]) === 560 - rec && polki.length === 1 && Math.round(polki[0].p[5]) <= 560 - 18 - rec
      && f.length === 1 && /\| 564 \| 684 \|/.test(f[0]), `plecy z ${zp}; półka z ${zs} | ${f.join(' / ')}`);
}

console.log('\nBLEDY:', errors.length ? errors.join('\n') : '(brak)');
await b.close();
