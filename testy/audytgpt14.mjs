/* Audyt GPT N157–N169, N145 bez plyty (`AUDYT_GPT.md` na galezi gpt/audyt-2026-10-16, seria
   2026-10-30) — przyciski naprawy klikniete w aplikacji (zasada uzytkownika: blad jest
   zalatwiony, gdy mowi, co zrobic, i ma dzialajacy przycisk):
   - N158/N159/N164/N165 „Podziel kolumnę przegrodą”: kolumna bez drzwi zostaje bez drzwi,
     wpisana szerokosc drzwi na auto, fix tylko po swojej stronie, zawiasy jak przed podzialem;
   - N157 „Jedna kolumna” przy dwoch roznych wnetrzach — wybor „wnętrze lewej / prawej”;
   - N169 fronty rozne przez wpisany wymiar — „Wszystkie drzwi / fronty równo, luz N mm”;
   - N166/N167 „Dodaj parę wzmocnień pod blat” — w plytkiej szafce plaskie na tyle, ile miejsca,
     w naroznej jak „Dołóż parę wzmocnień”; wzmocnienie poza korpusem — „Wzmocnienie 1: głębokość N mm”;
   - N145 tip-on bez plyty: „Uchwyt zamiast tip-on”, „Dołóż półkę (tip-on na niej)”;
   - N161 scianka zabudowy z zawieszka bez wienca: „Dodaj wieniec”;
   - N162 wyciecie w srodku elementu: „Bez zabudowy wycięcia”, zawieszka na zabudowie elementu;
   - N160 / N163 lista produktow projektu: grubosc dystansu, wkrety wg zastosowan;
   - N114 element przez plyte miedzy poziomami: „Wycinam otwory w płytach”, „Płyta nad / pod element”
     (decyzja uzytkownika 2026-10-30: „przyciski do dostępnych i sensownych opcji”).
   Liczby i reszta przypadkow — funkcje, suita `funkcje`. */
import pw from './pw.mjs';
const URL = process.env.STD ? 'http://127.0.0.1:5199/standalone-local.html'
  : 'http://127.0.0.1:5205/mebloprojekt-app.html';
const ok = (l, c, e = '') => console.log((c ? '  OK   ' : '  BLAD ') + l + (e ? ' — ' + e : ''));
const b = await pw.chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const page = await (await b.newContext({ viewport: { width: 1500, height: 1300 } })).newPage();
const errors = []; page.on('pageerror', (e) => errors.push(e.message));
await page.goto(URL, { waitUntil: 'networkidle' });

const NOGI = { plinth: { on: false }, legs: { on: true, height: 100 } };
const seedP = async (q) => {
  await page.evaluate((x) => { localStorage.clear(); localStorage.setItem('szafki:projekt', JSON.stringify(x)); }, q);
  await page.reload({ waitUntil: 'networkidle' }); await page.waitForTimeout(1500);
};
const seed = (cab) => seedP({ name: 'P', active: 0, prices: {}, runs: [], items: [{ cab, runId: null, offset: 0 }] });
const zap = async () => { await page.waitForTimeout(900); return page.evaluate(() => JSON.parse(localStorage.getItem('szafki:projekt'))); };
const notes = () => page.evaluate(() => {
  const sec = [...document.querySelectorAll('section')].find((s) => /^Uwagi$/.test((s.querySelector('h2') || {}).textContent || ''));
  return sec ? [...sec.querySelectorAll('li')].map((li) => ({ txt: li.textContent.trim(), btns: [...li.querySelectorAll('button')].map((x) => x.textContent.trim()) })) : [];
});
const rows = (re) => page.evaluate((src) => { const r = new RegExp(src);
  const sec = [...document.querySelectorAll('section')].find((s) => r.test(s.querySelector('h2')?.textContent || ''));
  return sec ? [...sec.querySelectorAll('tbody tr')].map((tr) => [...tr.children].map((x) => x.innerText.trim().replace(/\s+/g, ' ')).join(' | ')) : []; }, re.source);
const klik = async (re, label) => {
  const li = page.locator('section li').filter({ hasText: re }).first();
  await li.getByRole('button', { name: label, exact: true }).click();
  await page.waitForTimeout(700);
};
// przyciski naprawy uwagi (bez „✓” — oznacz jako przeczytane)
const przyciski = async (re) => ((await notes()).find((x) => re.test(x.txt)) || { btns: [] }).btns.filter((x) => x !== '✓');

console.log('== N158 / N159 / N164 / N165: „Podziel kolumnę przegrodą” ==');
{
  const szafa = (kol) => ({ name: 'S', W: 2100, H: 2000, D: 560, ...NOGI, levels: [{ h: null, cols: [{ kind: 'doors', doors: 2, w: null, shelfTargets: [400, null], drazki: [1], ...kol }] }] });
  const re = /ugina się/;
  await seed(szafa({ fix: { side: 'left', w: 100, mode: 'overlay', support: true }, doorWidths: [600, null] }));
  ok('ostrzeżenie o uginaniu z „Podziel kolumnę przegrodą”', (await przyciski(re)).includes('Podziel kolumnę przegrodą'), (await przyciski(re)).join(' / '));
  await klik(re, 'Podziel kolumnę przegrodą');
  const L = (await zap()).items[0].cab.levels[0];
  const n = await notes();
  ok('N164: fix lewy tylko w lewej kolumnie (z nim wspornik)', !!L.cols[0].fix && L.cols[0].fix.side === 'left' && !L.cols[1].fix, JSON.stringify(L.cols.map((c) => c.fix || null)));
  ok('N165: zawiasy — lewa kolumna z lewej, prawa z prawej', L.cols[0].hinge === 'left' && L.cols[1].hinge === 'right', L.cols.map((c) => c.hinge).join());
  ok('N159: bez wpisanych szerokości drzwi i bez błędu „nie wypełniają pasma”', L.cols.every((c) => !c.doorWidths) && !n.some((x) => /nie wypełniają pasma/.test(x.txt)));
  ok('bez uwag o długości rury', !n.some((x) => /rura ma/.test(x.txt)));
  await seed(szafa({ doors: 0 }));
  await klik(re, 'Podziel kolumnę przegrodą');
  const L0 = (await zap()).items[0].cab.levels[0];
  ok('N158: kolumna bez drzwi — po podziale obie bez drzwi, bez zawiasów w zamówieniu', L0.cols.length === 2 && L0.cols.every((c) => c.doors === 0)
    && !(await rows(/^Produkty do zamówienia/)).some((r) => /^Zawias/.test(r)), JSON.stringify(L0.cols.map((c) => c.doors)));
}

console.log('\n== N157: „Jedna kolumna” przy różnych wnętrzach ==');
{
  await seed({ name: 'P', W: 600, H: 1200, D: 560, ...NOGI, levels: [{ h: null, cols: [
    { kind: 'open', w: null, noDiv: true, shelfTargets: [300, null] }, { kind: 'open', w: null, shelfTargets: [200, 200, null] }] }] });
  const re = /nie ma przegrody \(przelot\)/;
  const bt = await przyciski(re);
  ok('błąd z „Jedna kolumna — wnętrze lewej (1 półka)” i „… prawej (2 półki)”', bt.includes('Jedna kolumna — wnętrze lewej (1 półka)') && bt.includes('Jedna kolumna — wnętrze prawej (2 półki)'), bt.join(' / '));
  await klik(re, 'Jedna kolumna — wnętrze prawej (2 półki)');
  const c = (await zap()).items[0].cab.levels[0].cols;
  ok('po kliknięciu: jedna kolumna z półkami prawej (200, 200), bez błędu', c.length === 1 && JSON.stringify(c[0].shelfTargets) === '[200,200,null]' && !(await notes()).some((x) => re.test(x.txt)), JSON.stringify(c.map((k) => k.shelfTargets)));
}

console.log('\n== N169: fronty różne przez wpisany wymiar ==');
{
  await seed({ name: 'T', W: 600, H: 720, D: 560, ...NOGI, levels: [{ h: null, cols: [{ kind: 'doors', doors: 3, w: null, shelfTargets: [null], doorWidths: [198, null, null] }] }] });
  const re = /drzwi różnią się o 1 mm/;
  const bt = await przyciski(re);
  ok('ostrzeżenie „198 wpisana ręcznie” tylko z „Wszystkie drzwi równo, luz 4 mm”', bt.length === 1 && bt[0] === 'Wszystkie drzwi równo, luz 4 mm', bt.join(' / '));
  await klik(re, 'Wszystkie drzwi równo, luz 4 mm');
  const c = (await zap()).items[0].cab.levels[0].cols[0];
  const fr = (await rows(/^Formatki/)).filter((r) => /^Drzwi/.test(r));
  ok('po kliknięciu: luz 4, bez wpisanych szerokości, trzy drzwi 196, bez ostrzeżenia', c.gapBetween === 4 && !c.doorWidths && fr.some((r) => /196/.test(r) && /\| 3 \|/.test(r))
    && !(await notes()).some((x) => /różnią się/.test(x.txt)), fr.join(' / '));
  await seed({ name: 'T', W: 600, H: 720, D: 560, ...NOGI, levels: [{ h: null, cols: [{ kind: 'drawers', w: null, drawers: [{ h: 'auto', front: 238 }, { h: 'auto' }, { h: 'auto' }] }] }] });
  const reS = /fronty szuflad różnią się/;
  ok('szuflady 238 + auto — „Wszystkie fronty równo, luz 3 mm”', (await przyciski(reS)).includes('Wszystkie fronty równo, luz 3 mm'), (await przyciski(reS)).join(' / '));
  await klik(reS, 'Wszystkie fronty równo, luz 3 mm');
  const s = (await zap()).items[0].cab.levels[0].cols[0];
  ok('po kliknięciu: luz 3, fronty auto, bez ostrzeżenia', s.gapBetween === 3 && s.drawers.every((d) => d.front == null) && !(await notes()).some((x) => reS.test(x.txt)));
}

console.log('\n== N166 / N167: para wzmocnień pod blat ==');
{
  const re = /nie ma wieńca ani wzmocnienia/;
  await seed({ name: 'T', W: 600, H: 300, D: 80, ...NOGI, joints: { topL: 'none', topR: 'none' }, levels: [{ h: null, cols: [{ kind: 'doors', doors: 1, w: null, shelfTargets: [null] }] }] });
  await klik(re, 'Dodaj parę wzmocnień pod blat');
  const r = (await zap()).items[0].cab.levels[0].cols[0].rails || [];
  const n = await notes();
  ok('N166: D80 — płaskie 62 mm, bez błędu „poza korpus” i bez „nie ma wieńca”', r.length === 2 && r[0].depth === 62 && !n.some((x) => /poza korpus|nie ma wieńca ani wzmocnienia/.test(x.txt)), JSON.stringify(r.map((q) => [q.orient, q.depth, q.h])));
  await seed({ name: 'T', W: 600, H: 300, D: 80, ...NOGI, levels: [{ h: null, cols: [{ kind: 'doors', doors: 1, w: null, shelfTargets: [null],
    rails: [{ orient: 'shelf', pos: 'top', side: 'left', h: 100, depth: 100, atDepth: 0, fromBack: false }] }] }] });
  const reP = /wychodzi o 20 mm poza korpus/;
  ok('N166: płaskie 100 w D80 — błąd z „Wzmocnienie 1: głębokość 80 mm”', (await przyciski(reP)).includes('Wzmocnienie 1: głębokość 80 mm'), (await przyciski(reP)).join(' / '));
  await klik(reP, 'Wzmocnienie 1: głębokość 80 mm');
  ok('po kliknięciu: głębokość 80, bez błędu', (await zap()).items[0].cab.levels[0].cols[0].rails[0].depth === 80 && !(await notes()).some((x) => /poza korpus/.test(x.txt)));
  await seed({ name: 'L', W: 1000, H: 720, D: 560, ...NOGI, joints: { topL: 'none', topR: 'none' }, corner: { on: true, arm: 400, doors: 'wsporniki' },
    levels: [{ h: null, cols: [{ kind: 'doors', doors: 1, w: null, shelfTargets: [null] }] }] });
  await klik(re, 'Dodaj parę wzmocnień pod blat');
  const rr = (await zap()).items[0].cab.levels[0].cols[0].rails || [];
  ok('N167: szafka narożna — dwie stojące 60 mm, cofnięte o 18 (jak „Dołóż parę wzmocnień”)', rr.length === 2 && rr.every((q) => q.orient === 'front' && q.h === 60 && q.atDepth === 18), JSON.stringify(rr.map((q) => [q.orient, q.h, q.atDepth])));
}

console.log('\n== N145: tip-on bez płyty do przykręcenia ==');
{
  const tip = { name: 'T', W: 600, H: 300, D: 300, ...NOGI, handles: false, joints: { topL: 'none', topR: 'none', botL: 'none', botR: 'none' },
    levels: [{ h: null, cols: [{ kind: 'doors', doors: 1, w: null, shelfTargets: [null], handles: [false], otwieranie: ['tipon'] }] }] };
  const re = /tip-on nie ma płyty do przykręcenia/;
  await seed(tip);
  const bt = await przyciski(re);
  ok('błąd z „Uchwyt zamiast tip-on” i „Dołóż półkę (tip-on na niej)”', bt.includes('Uchwyt zamiast tip-on') && bt.includes('Dołóż półkę (tip-on na niej)'), bt.join(' / '));
  await klik(re, 'Uchwyt zamiast tip-on');
  ok('„Uchwyt zamiast tip-on”: bez błędu, bez tip-on w zamówieniu', !(await notes()).some((x) => re.test(x.txt)) && !(await rows(/^Produkty do zamówienia/)).some((r) => /tip-on|SALTO/i.test(r)));
  await seed(tip);
  await klik(re, 'Dołóż półkę (tip-on na niej)');
  ok('„Dołóż półkę”: półka w kolumnie, tip-on zostaje, bez błędu', ((await zap()).items[0].cab.levels[0].cols[0].shelfTargets || []).length === 2
    && !(await notes()).some((x) => re.test(x.txt)) && (await rows(/^Produkty do zamówienia/)).some((r) => /tip-on|SALTO/i.test(r)));
}

console.log('\n== N161 / N162: ścianka zabudowy z zawieszką ==');
{
  const wis = (o = {}, cu = {}) => ({ name: 'W', W: 600, H: 1200, D: 560, plinth: { on: false }, legs: { on: false }, ...o,
    cutout: { on: true, w: 100, d: 100, fullHeight: false, levelIndex: 1, mask: true, ...cu },
    levels: [{ h: 591, cols: [{ kind: 'open', w: null, shelfTargets: [] }] }, { h: null, cols: [{ kind: 'open', w: null, shelfTargets: [] }] }] });
  const re = /na ściance bocznej zabudowy wycięcia/;
  await seed(wis({ joints: { topL: 'none', topR: 'none' } }, { zawMocowanie: 'trojkaty' }));
  const m = (await notes()).find((x) => re.test(x.txt));
  ok('N161: bez wieńca — „Dodaj wieniec”, bez „złączona z wieńcem”, bez trójkątów w zamówieniu', !!m && m.btns.includes('Dodaj wieniec') && !/złączona/.test(m.txt)
    && !(await rows(/^Produkty do zamówienia/)).some((r) => /^Trójkąt meblarski/.test(r)), m && m.txt);
  await klik(re, 'Dodaj wieniec');
  const cab = (await zap()).items[0].cab;
  const m2 = (await notes()).find((x) => re.test(x.txt));
  ok('po „Dodaj wieniec”: wieniec jest, ścianka złączona 2 trójkątami (wybór został), trójkąty w zamówieniu', cab.joints.topL !== 'none' && cab.joints.topR !== 'none'
    && !!m2 && /złączona z wieńcem 2 trójkątami/.test(m2.txt) && (await rows(/^Produkty do zamówienia/)).some((r) => /^Trójkąt meblarski/.test(r)), m2 && m2.txt);
  // N162: wyciecie 100 × 100 w elemencie 200 × 150, oba na cala wysokosc, oba zabudowane
  await seed({ name: 'W', W: 600, H: 1200, D: 560, plinth: { on: false }, legs: { on: false },
    cutout: { on: true, w: 100, d: 100, fullHeight: true, mask: true },
    obstacles: [{ on: true, w: 200, d: 150, side: 'left', fromSide: 0, fromBack: 0, fullHeight: true, mask: true }],
    levels: [{ h: null, cols: [{ kind: 'open', w: null, shelfTargets: [] }] }] });
  const re2 = /leży w całości w elemencie/;
  const n = await notes();
  ok('N162: błąd „leży w całości w elemencie” z „Bez zabudowy wycięcia”; zawieszka na zabudowie elementu', (await przyciski(re2)).includes('Bez zabudowy wycięcia')
    && n.some((x) => /na ściance bocznej zabudowy elementu/.test(x.txt)) && !n.some((x) => re.test(x.txt)), (await przyciski(re2)).join(' / '));
  await klik(re2, 'Bez zabudowy wycięcia');
  const n2 = await notes();
  ok('po kliknięciu: zabudowa wycięcia wyłączona, bez błędu i bez „otwór zostanie odsłonięty”', (await zap()).items[0].cab.cutout.mask === false
    && !n2.some((x) => re2.test(x.txt) || /otwór zostanie odsłonięty/.test(x.txt)));
}

console.log('\n== N160 / N163: lista produktów projektu ==');
{
  const RUNG = { id: 'g1', name: 'Górne', roomId: null, wallW: null, gap: 0, mountY: 1500, H: 720, D: 300, plinth: null, worktop: false, corner: null, hangerMode: 'listwa' };
  const wis = (n, o = {}) => ({ name: n, W: 600, H: 720, D: 300, plinth: { on: false }, legs: { on: false }, hangerMode: 'listwa', levels: [{ h: null, cols: [{ kind: 'doors', doors: 1, w: null, shelfTargets: [null] }] }], ...o });
  await seedP({ name: 'P', active: 0, prices: {}, runs: [RUNG], items: [{ cab: wis('A'), runId: 'g1', offset: 0 },
    { cab: wis('B', { dystans: 50 }), runId: 'g1', offset: 50 }, { cab: wis('C', { dystans: 100 }), runId: 'g1', offset: 100 }] });
  const pr = await rows(/^Produkty całego projektu/);
  const dyst = pr.filter((r) => /^Listwa dystansowa/.test(r));
  ok('N160: dwa wiersze listwy dystansowej — grubość 50 mm i 100 mm', dyst.length === 2 && dyst.some((r) => /grubość 50 mm/.test(r)) && dyst.some((r) => /grubość 100 mm/.test(r)), dyst.join(' / '));
  const wk = pr.find((r) => /^Wkręt 4 × 30/.test(r)) || '';
  ok('N163: wkręty 4 × 30 — „zawieszki, 2 na zawieszkę”, bez „wzmocnienia i kątownik”', /zawieszki, 2 na zawieszkę/.test(wk) && !/wzmocnienia i kątownik/.test(wk), wk);
}

console.log('\n== N114: element przechodzi przez płytę (decyzja użytkownika 2026-10-30) ==');
{
  const sz = (ob, lv1 = 591) => ({ name: 'T', W: 600, H: 1200, D: 560, ...NOGI,
    obstacles: [{ on: true, w: 200, d: 150, side: 'left', fromSide: 0, fromBack: 0, fullHeight: true, mask: false, ...ob }],
    levels: [{ h: lv1, cols: [{ kind: 'open', w: null, shelfTargets: [] }] }, { h: null, cols: [{ kind: 'open', w: null, shelfTargets: [] }] }] });
  const re = /przechodzi przez płytę między poziomami/;
  await seed(sz({}));
  ok('na całą wysokość — tylko „Wycinam otwory w płytach (na formatkach)”', JSON.stringify(await przyciski(re)) === '["Wycinam otwory w płytach (na formatkach)"]', (await przyciski(re)).join(' / '));
  await klik(re, 'Wycinam otwory w płytach (na formatkach)');
  const m = (await notes()).find((x) => re.test(x.txt));
  const fr = (await rows(/^Formatki/)).filter((r) => /^Półka przelotowa/.test(r));
  ok('po kliknięciu: `otwory` w elemencie, informacja, formatka „Półka przelotowa — wycięcie 182 × 150 w lewym tylnym rogu”', (await zap()).items[0].cab.obstacles[0].otwory === true
    && !!m && !m.btns.filter((x) => x !== '✓').length && fr.some((r) => /^Półka przelotowa — wycięcie 182 × 150 w lewym tylnym rogu/.test(r)), fr.join(' / '));
  await seed(sz({ fullHeight: false, fromBottom: 400, h: 300 }));
  const bt = await przyciski(re);
  ok('element 400–700 — „Płyta nad element (poziom 1: 700 mm, poziom 2: 446 mm)” i „… pod element (poziom 1: 382 mm, poziom 2: 764 mm)”', bt.includes('Płyta nad element (poziom 1: 700 mm, poziom 2: 446 mm)') && bt.includes('Płyta pod element (poziom 1: 382 mm, poziom 2: 764 mm)'), bt.join(' / '));
  await klik(re, 'Płyta nad element (poziom 1: 700 mm, poziom 2: 446 mm)');
  ok('po kliknięciu: poziom 1 ma 700 mm, płyta nie przecina elementu, bez błędu wysokości', (await zap()).items[0].cab.levels[0].h === 700
    && !(await notes()).some((x) => re.test(x.txt) || /nie wypełniają wnętrza/.test(x.txt)));
}

ok('bez błędów strony', !errors.length, errors.join(' / '));
await b.close();
