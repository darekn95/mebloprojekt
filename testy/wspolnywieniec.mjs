/* Wspolny wieniec i wspolne dno ciagu (uzytkownik 2026-10-24, salon RTV): opcje
   ciagu jak blat roboczy. Wieniec — plyta korpusu na bokach szafek w wysokosci
   ciagu, rowno z frontami, na trojkatach; slupek zostaje przy swoim. Dno — szafki
   stoja na jednej plycie. W zamowieniu „Wieniec ciągu” i „Dno ciągu”.
   Przy okazji: ciag z wysokoscia od wysokiej szafki — „Ustaw cały ciąg na 900 mm,
   wyższe jako słupki”. */
import pw from './pw.mjs';
const URL = process.env.STD ? 'http://127.0.0.1:5199/standalone-local.html'
  : 'http://127.0.0.1:5205/mebloprojekt-app.html';
const ok = (l, c, e = '') => console.log((c ? '  OK   ' : '  BLAD ') + l + (e ? ' — ' + e : ''));
const b = await pw.chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const page = await (await b.newContext({ viewport: { width: 1500, height: 1300 } })).newPage();
const errors = []; page.on('pageerror', (e) => errors.push(e.message));
await page.goto(URL, { waitUntil: 'networkidle' });

const BEZ = { on: false, height: 100, mode: 'under', setback: 0 };
const cab = (name, W, H, o = {}) => ({ name, W, H, D: 500, plinth: BEZ, legs: { on: false, height: 100 },
  joints: { topL: 'over', topR: 'over', botL: 'over', botR: 'over' },
  levels: [{ h: null, cols: [{ kind: 'doors', doors: 1, w: null, shelfTargets: [null, null] }] }], ...o });
const RUN = (o = {}) => ({ id: 'c3', name: 'Ściana tv', roomId: 'p1', wallW: null, gap: 0, mountY: 0, H: 1600, D: 500,
  plinth: BEZ, worktop: false, corner: null, ...o });
const seed = async (items, run = RUN(), active = 1) => {
  await page.evaluate((q) => { localStorage.clear(); localStorage.setItem('szafki:projekt', JSON.stringify(q)); },
    { name: 'Salon', active, prices: {}, runs: [run], items: items.map((c) => ({ cab: c, runId: 'c3', offset: 0 })) });
  await page.reload({ waitUntil: 'networkidle' }); await page.waitForTimeout(1200);
};
const zap = async () => { await page.waitForTimeout(1000); return page.evaluate(() => JSON.parse(localStorage.getItem('szafki:projekt'))); };
const rows = (re) => page.evaluate((src) => { const r = new RegExp(src);
  const sec = [...document.querySelectorAll('section')].find((s) => r.test(s.querySelector('h2')?.textContent || ''));
  return sec ? [...sec.querySelectorAll('tbody tr')].map((tr) => [...tr.children].map((x) => x.innerText.trim().replace(/\s+/g, ' ')).join(' | ')) : []; }, re.source);
const uwagi = async () => (await page.evaluate(() => [...document.querySelectorAll('section')].find((s) => /^Uwagi/.test(s.querySelector('h2')?.textContent || ''))?.innerText || ''));
const zaznacz = async (txt) => { await page.getByText(txt, { exact: true }).first().click(); await page.waitForTimeout(700); };
const SALON = () => [cab('S1', 1200, 1600), cab('S2', 600, 900), cab('S3', 600, 900), cab('S4', 600, 900)];

console.log('== ciąg 1600 od wysokiej szafki, trzy po 900 ==');
{
  await seed(SALON());
  let u = await uwagi();
  ok('szafka 900: przycisk „Ustaw cały ciąg na 900 mm, wyższe jako słupki”', /Ustaw cały ciąg na 900 mm, wyższe jako słupki/.test(u), u.split('\n').filter((l) => /900/.test(l)).join(' / '));
  await page.getByRole('button', { name: 'Ustaw cały ciąg na 900 mm, wyższe jako słupki' }).first().click(); await page.waitForTimeout(600);
  const p = await zap();
  ok('ciąg 900, S1 słupek 1600, S2–S4 900', p.runs[0].H === 900 && p.items[0].cab.slupek === true && p.items[0].cab.H === 1600 && p.items.slice(1).every((it) => it.cab.H === 900),
    JSON.stringify([p.runs[0].H, ...p.items.map((it) => [it.cab.H, !!it.cab.slupek])]));
  u = await uwagi();
  ok('bez ostrzeżenia o wysokości przy S2', !/Wysokość 900 mm nie zgadza się/.test(u));
}

console.log('\n== wspólny wieniec ==');
{
  await seed(SALON(), RUN({ H: 900 }));
  await zaznacz('Wspólny wieniec z płyty na całym ciągu');
  let p = await zap();
  const top = (i) => p.items[i].cab.top || {};
  ok('S2–S4: blat z płyty z ciągu, równo z frontami (wysunięcie 20 = 2 luzu + 18 frontu); S1 (1600) przy swoim wieńcu',
    [1, 2, 3].every((i) => top(i).mode === 'blat' && top(i).material === 'board' && top(i).zCiagu && top(i).overFront === 20 && !top(i).overL && !top(i).overR)
    && top(0).mode !== 'blat', JSON.stringify(p.items.map((it) => [it.cab.name, (it.cab.top || {}).mode, (it.cab.top || {}).overFront])));
  const proj = await rows(/^Formatki całego projektu/);
  const wien = proj.filter((r) => /^Wieniec ciągu/.test(r));
  ok('zamówienie: „Wieniec ciągu” 1800 × 520 mm, 1 szt.', wien.length === 1 && /Wieniec — Ściana tv \| .* \| 1800 \| 520 \| 1 \|/.test(wien[0]), wien.join(' / ') || proj.slice(0, 6).join(' / '));
  ok('bez „Blat” szafek w zamówieniu projektu', !proj.some((r) => /^Blat \|/.test(r)), proj.filter((r) => /^Blat/.test(r)).join(' / '));
  const karta = await rows(/^Formatki do zamówienia$/);
  ok('karta S2: bez własnego blatu', !karta.some((r) => /^Blat/.test(r)), karta.filter((r) => /Blat|Wieniec/.test(r)).join(' / '));
  const hw = await rows(/^Produkty do zamówienia/);
  ok('karta S2: trójkąty pod wieniec', hw.some((r) => /^Trójkąt meblarski/.test(r)), hw.filter((r) => /Trójk/.test(r)).join(' / '));
  // nowa szafka w ciagu z wiencem
  await page.locator('header').getByRole('button', { name: '+ szafka' }).first().click(); await page.waitForTimeout(800);
  p = await zap();
  const nowa = p.items[p.active].cab;
  ok('„+ szafka”: nowa szafka 900 też pod wspólnym wieńcem', nowa.H === 900 && (nowa.top || {}).mode === 'blat' && (nowa.top || {}).zCiagu === true, JSON.stringify([nowa.H, nowa.top]));
  // wylaczenie
  await zaznacz('Wspólny wieniec z płyty na całym ciągu');
  p = await zap();
  ok('wyłączenie: szafki wracają do wieńca, bez „Wieniec ciągu”', p.items.every((it) => (it.cab.top || {}).mode !== 'blat')
    && !(await rows(/^Formatki całego projektu/)).some((r) => /^Wieniec ciągu/.test(r)), JSON.stringify(p.items.map((it) => (it.cab.top || {}).mode)));
  // blat roboczy i wspolny wieniec wykluczaja sie
  await zaznacz('Wspólny wieniec z płyty na całym ciągu');
  await zaznacz('Blat roboczy na całym ciągu');
  p = await zap();
  ok('blat roboczy wyłącza wspólny wieniec (i jego blaty z płyty)', p.runs[0].worktop === true && !p.runs[0].wspolnyWieniec && p.items.every((it) => !(it.cab.top || {}).zCiagu || (it.cab.top || {}).mode !== 'blat'),
    JSON.stringify([p.runs[0].worktop, p.runs[0].wspolnyWieniec]));
}

console.log('\n== słupek w środku przerywa wieniec ==');
{
  await seed([cab('A', 600, 900), cab('S', 600, 1600, { slupek: true }), cab('B', 600, 900)], RUN({ H: 900, wspolnyWieniec: true }), 0);
  // ustawienia szafek jak po wlaczeniu opcji
  await zaznacz('Wspólny wieniec z płyty na całym ciągu'); await zaznacz('Wspólny wieniec z płyty na całym ciągu');
  const wien = (await rows(/^Formatki całego projektu/)).filter((r) => /^Wieniec ciągu/.test(r));
  ok('A | słupek | B: „Wieniec ciągu” 2 × 600 mm (nie 1800 nad słupkiem)', wien.length === 1 && /\| 600 \| 520 \| 2 \|/.test(wien[0]), wien.join(' / '));
}

console.log('\n== wspólne dno ==');
{
  await seed(SALON(), RUN({ H: 900 }));
  await zaznacz('Wspólne dno na całym ciągu');
  const proj = await rows(/^Formatki całego projektu/);
  const dno = proj.filter((r) => /^Dno ciągu/.test(r));
  ok('zamówienie: „Dno ciągu” 3000 mm w dwóch częściach (2400 + 600) × 500', dno.length === 2 && dno.some((r) => /\| 2400 \| 500 \| 1 \|/.test(r)) && dno.some((r) => /\| 600 \| 500 \| 1 \|/.test(r)), dno.join(' / '));
  ok('bez „Dno” szafek w zamówieniu projektu', !proj.some((r) => /^Dno \|/.test(r) || /^Dno \/ wieniec/.test(r)), proj.filter((r) => /^Dno/.test(r)).join(' / '));
  const karta = await rows(/^Formatki do zamówienia$/);
  ok('karta S2: bez dna, wieniec zostaje', !karta.some((r) => /^Dno/.test(r)) && karta.some((r) => /^Wieniec \|/.test(r)), karta.filter((r) => /Dno|Wieniec/.test(r)).join(' / '));
  const opis = await page.locator('[data-el="dno-ciagu"]').first().innerText().catch(() => '');
  ok('karta ciągu: „Dno ciągu: 2 części po 2400 i 600 mm”', /Dno ciągu: 2 części po 2400 i 600 mm/.test(opis), opis);
  await zaznacz('Wspólne dno na całym ciągu');
  const p = await zap();
  ok('wyłączenie: złącza dna wracają, bez „Dno ciągu”', p.items.every((it) => !it.cab.dnoZCiagu) && !(await rows(/^Formatki całego projektu/)).some((r) => /^Dno ciągu/.test(r)));
}

console.log('\n== widoki bez błędów ==');
{
  await seed(SALON(), RUN({ H: 900 }));
  await zaznacz('Wspólny wieniec z płyty na całym ciągu'); await zaznacz('Wspólne dno na całym ciągu');
  for (const w of ['Szafka', 'Ciąg']) for (const v of ['Zamk.', 'Z góry', 'Z boku', '3D']) {
    const k = errors.length;
    const pick = async (l) => { const x = page.getByRole('button', { name: l, exact: true }); if (await x.count()) { await x.first().click(); await page.waitForTimeout(250); } };
    await pick(w); await pick(v);
    ok(`${w} / ${v}`, errors.length === k, errors.slice(k).join('; '));
  }
}

ok('bez błędów strony', !errors.length, errors.join(' / '));
await b.close();
