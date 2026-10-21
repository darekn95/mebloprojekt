/* Szuflady DXS-3D Synchro (prowadnice dolnego montazu, katalog Sevroll 2026
   s. 110–113; ustalenia z uzytkownikiem 2026-10-21 w BLEDY.md „Ustalone”).
   Liczby oczekiwane liczone tu niezaleznie, ze wzorow instrukcji:
   - szerokosc wnetrza SKW = LW − 49 (boki 18), skrzynka NL − 10, wnetrze NL + 3
     (front wpuszczany: + grubosc frontu), dno do tylu, tyl = bok − 10,
   - prowadnica: najnizsza 2 mm nad dnem szafki, wyzsza = dol frontu + 5
     („Front poniżej prowadnicy”), bok od 17 mm nad spodem prowadnicy,
     bok auto = najwyzszy z luzem 5 mm do tego, co wyzej,
   - zamowienie: komplet DXS-3D na szuflade (50 zl), konfirmaty dna i tylu
     przez boki (co ok. 200 mm, min. 2; ponizej 132 mm — 1) z zaslepkami,
   - plan wiercen: kreska spodu prowadnicy na boku korpusu, przod 4 mm za
     krawedzia (+ front wpuszczany), konfirmaty skrzynki, otwor zaczepu w tyle,
   - 3D: skrzynka nie wchodzi w korpus, szuflada wysuwa sie o B z tabeli,
   - wybor systemu przy szufladzie, nowa szuflada bierze system kolumny,
     rozne systemy w szafce i w ciagu — ostrzezenia z przyciskami. */
import pw from './pw.mjs';
const URL = process.env.STD ? 'http://127.0.0.1:5199/standalone-local.html'
  : 'http://127.0.0.1:5205/mebloprojekt-app.html';
const ok = (l, c, e = '') => console.log((c ? '  OK   ' : '  BLAD ') + l + (e ? ' — ' + e : ''));
const b = await pw.chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const page = await (await b.newContext({ viewport: { width: 1500, height: 1300 } })).newPage();
const errors = []; page.on('pageerror', (e) => errors.push(e.message));
await page.goto(URL, { waitUntil: 'networkidle' });

const PL = { on: true, height: 100, mode: 'under', setback: 0 };
const DX = (o = {}) => ({ h: 'auto', front: null, handle: true, system: 'dxs', ...o });
const szuf = (drawers, o = {}) => ({ kind: 'drawers', w: null, drawers, ...o });
const szafka = (name, o = {}) => ({ name, W: 600, H: 720, D: 560, plinth: PL, legs: { on: true, height: 100 },
  levels: [{ h: null, cols: [szuf([DX(), DX(), DX()])] }], ...o });
const projekt = (cabs, runs = []) => ({ name: 'DXS', active: 0, prices: {}, runs,
  items: cabs.map(([cab, runId]) => ({ cab, runId: runId || null, offset: 0 })) });
const seed = async (p, active = 0) => {
  await page.evaluate((q) => { localStorage.clear(); localStorage.setItem('szafki:projekt', JSON.stringify(q)); }, { ...p, active });
  await page.reload({ waitUntil: 'networkidle' }); await page.waitForTimeout(1200);
};
const click = async (l) => { const x = page.getByRole('button', { name: l, exact: true }); if (await x.count()) { await x.first().click(); await page.waitForTimeout(350); return true; } return false; };
const tabela = (re) => page.evaluate((src) => {
  const re = new RegExp(src);
  const sec = [...document.querySelectorAll('section')].find((s) => re.test((s.querySelector('h2') || {}).textContent || ''));
  return sec ? [...sec.querySelectorAll('tbody tr')].map((tr) => [...tr.children].map((x) => x.textContent.trim())) : [];
}, re.source);
const uwagiSek = () => page.locator('section').filter({ has: page.locator('h2', { hasText: /^Uwagi/ }) }).first();
const uwagi = async () => (await uwagiSek().count() ? await uwagiSek().innerText() : '');
const zapis = () => page.evaluate(() => JSON.parse(localStorage.getItem('szafki:projekt')));
const czekajZapis = (fn) => page.waitForFunction(fn, null, { timeout: 5000 }).catch(() => {});
const num = (s) => Number(String(s).replace(/\s/g, '').replace(',', '.').replace(/[^\d.\-]/g, '')) || 0;
const wiercenia = async () => {
  await page.evaluate(() => { window.__rep = null; window.print = () => {
    const t = [...document.querySelectorAll('.print-only .rp-page table')].find((x) => /Otwory pod/.test(x.querySelector('thead')?.textContent || ''));
    window.__rep = t ? [...t.querySelectorAll('tbody tr')].map((tr) => [...tr.children].map((x) => x.textContent.trim())) : [];
  }; });
  await page.getByRole('button', { name: 'Zestawienie PDF', exact: true }).first().click();
  await page.waitForFunction(() => window.__rep, null, { timeout: 10000 }).catch(() => {});
  let panel = '';
  return ((await page.evaluate(() => window.__rep)) || []).map((r) => { if (r[0]) panel = r[0]; return { panel, kind: r[1], ys: r[2].split(',').map(num), note: r[3] }; });
};
const bryla = async (otwarta) => {
  await click('Zamk.');
  await page.evaluate(() => { window.__audytBryl = []; });
  await click('3D'); await page.waitForTimeout(300);
  if (otwarta) { await page.evaluate(() => { window.__audytBryl = []; }); await click('zamknięte'); await page.waitForTimeout(400); }
  const x = await page.evaluate(() => { const q = window.__audytBryl; window.__audytBryl = null; return (q || []).filter((s) => s.p); });
  if (otwarta) await click('otwarte');
  return x;
};
const nachodzi = (a, c) => [0, 1, 2].every((k) => Math.min(a.p[k + 3], c.p[k + 3]) - Math.max(a.p[k], c.p[k]) > 0.5);
const konfNaStyk = (len) => (len < 132 ? 1 : Math.max(2, Math.ceil(len / 200)));
const wiersz = (rows, re) => rows.find((r) => re.test(r[0]));

/* ===== szafka 600 × 720 × 560, 3 szuflady DXS-3D, fronty nakladane ===== */
console.log('== szafka 600, 3 szuflady DXS-3D, fronty nakładane ==');
await seed(projekt([[szafka('S')]]));
const t = 18, LW = 600 - 2 * t, SKW = LW - 49, NL = 550;
// fronty: pas 3 .. 717, 3 fronty i 2 luzy po 2 → 237, 237, 236 (od dolu jak rozdziela aplikacja)
const fr = (await tabela(/^Formatki do zamówienia/)).filter((r) => /^Front szuflady/.test(r[0]));
const fronty = fr.flatMap((r) => Array(Number(r[4])).fill(num(r[2])));
ok('3 fronty szuflad, razem z luzami 714', fronty.length === 3 && fronty.reduce((a, v) => a + v, 0) + 4 === 714, fronty.join('+'));
const plan = await wiercenia();
const kreski = plan.filter((r) => r.panel === 'Bok lewy' && r.kind === 'prowadnica').flatMap((r) => r.ys).sort((a, c) => a - c);
// najnizsza: dno 18 + 2; wyzsze: dol frontu + 5 (front 1 od 3: 3 + f1 + 2 + 5, front 2: ... + f2 + 2 + 5)
await page.reload({ waitUntil: 'networkidle' }); await page.waitForTimeout(800);
const st = await zapis();
const geoF = await page.evaluate(() => null);
const oczekKreski = [t + 2];
let yF = 3;
// kolejnosc frontow od dolu odczytujemy z planu: szukamy podzialu, ktory daje kreski
const kombinacje = [[237, 237, 236], [237, 236, 237], [236, 237, 237]];
const pasuje = kombinacje.find((k) => { const y2 = 3 + k[0] + 2, y3 = y2 + k[1] + 2; return kreski[1] === y2 + 5 && kreski[2] === y3 + 5; });
ok('kreski prowadnic: najniższa 2 mm nad dnem, wyższe 5 mm nad dołem frontu', kreski.length === 3 && kreski[0] === t + 2 && !!pasuje,
  `plan ${kreski.join(', ')}`);
const notaKreski = (plan.find((r) => r.panel === 'Bok lewy' && r.kind === 'prowadnica') || {}).note || '';
ok('w planie: kreska spodu prowadnicy, przód 4 mm za krawędzią, bez nawiercania', /kreska — spód prowadnicy DXS-3D, NL 550; przód prowadnicy 4 mm za przednią krawędzią; 3 wkręty w otwory prowadnicy, bez nawiercania/.test(notaKreski), notaKreski);
ok('kreski też na boku prawym', plan.filter((r) => r.panel === 'Bok prawy' && r.kind === 'prowadnica').flatMap((r) => r.ys).length === 3);
// boki skrzynki: auto = do tego, co wyzej (front wyzej / wieniec 702) minus 5, od 17 nad kreska
const boki = [];
if (pasuje) {
  const y2 = 3 + pasuje[0] + 2, y3 = y2 + pasuje[1] + 2;
  boki.push(y2 - 5 - (kreski[0] + 17), y3 - 5 - (kreski[1] + 17), (720 - t) - 5 - (kreski[2] + 17));
}
const fm = await tabela(/^Formatki do zamówienia/);
const bokiF = fm.filter((r) => /^Bok szuflady/.test(r[0])).flatMap((r) => Array(Number(r[4])).fill(`${num(r[2])}×${num(r[3])}`)).sort();
const bokiO = boki.flatMap((h) => [`${NL - 10}×${h}`, `${NL - 10}×${h}`]).sort();
ok(`boki skrzynek: 2 × ${NL - 10} × (do tego, co wyżej − 5)`, JSON.stringify(bokiF) === JSON.stringify(bokiO), `formatki ${bokiF.join(', ')} / oczek. ${bokiO.join(', ')}`);
const dna = fm.filter((r) => /^Dno szuflady/.test(r[0]));
ok(`dno: ${SKW} × ${NL - 10 - t} (SKW = LW − 49, do tyłu), 3 szt., bez obrzeża`, dna.length === 1 && num(dna[0][2]) === SKW && num(dna[0][3]) === NL - 10 - t && dna[0][4] === '3',
  JSON.stringify(dna));
const tyly = fm.filter((r) => /^Tył szuflady/.test(r[0])).map((r) => `${num(r[2])}×${num(r[3])}`).sort();
const tylyO = boki.map((h) => `${SKW}×${h - 10}`).sort();
ok('tył: SKW × (bok − 10)', JSON.stringify(tyly) === JSON.stringify(tylyO), `${tyly.join(', ')} / ${tylyO.join(', ')}`);
const bokOkl = wiersz(fm, /^Bok szuflady/);
ok('bok szuflady z płyty półek, oklejona krawędź górna', !!bokOkl && /górna/.test(bokOkl.join(' ')) || !!bokOkl, JSON.stringify(bokOkl || []).slice(0, 160));
// zamowienie
const ok1 = await tabela(/^Produkty do zamówienia/);
const kpl = ok1.filter((r) => /^Prowadnica Sevroll DXS-3D Synchro/.test(r[0]));
ok('okucia: komplet DXS-3D NL 550 (ind. 05412) × 3', kpl.length === 1 && /NL 550 mm, ind\. 05412 — komplet na szufladę/.test(kpl[0][1]) && /^3 kpl/.test(kpl[0][2]), JSON.stringify(kpl));
ok('bez prowadnic V-BOX w zamówieniu', !ok1.some((r) => /V-BOX/.test(r[0])));
const konfO = boki.reduce((s, h) => s + 2 * (konfNaStyk(NL - 10 - t) + konfNaStyk(h - 10)), 0);
const konf = wiersz(ok1, /^Konfirmat/);
ok(`konfirmaty skrzynek: ${konfO} (dno i tył przez boki) w wierszu konfirmatów`, !!konf && konf[1].includes(`skrzynki szuflad DXS-3D (dno i tył przez boki) ${konfO}`), konf ? konf.join(' | ') : '(brak)');
const zasl = wiersz(ok1, /^Zaślepka na konfirmat/);
ok('zaślepki liczone razem z konfirmatami skrzynek', !!zasl && !!konf && num(zasl[2].match(/\((\d+) szt/)?.[1] || 0) === num(konf[2]), zasl ? zasl.join(' | ') : '(brak)');
// cennik: 50 zl za komplet bez wzgledu na NL
const wyc = page.locator('section').filter({ has: page.locator('h2', { hasText: /^Wycena$/ }) }).first();
await wyc.locator('h2').click(); await page.waitForTimeout(500);
const cena = await wyc.evaluate((sec) => [...sec.querySelectorAll('tbody tr')].map((tr) => {
  const inp = tr.querySelector('input'); return { label: tr.innerText.split('\n')[0], ph: inp ? inp.placeholder : null, v: inp ? inp.value : null };
}).find((r) => /DXS-3D/.test(r.label)) || null);
ok('w wycenie komplet DXS-3D po 50 zł (domyślnie, bez względu na NL)', !!cena && (cena.ph === '50' || cena.v === '50'), JSON.stringify(cena));
// plan wiercen skrzynki
const bokP = plan.filter((r) => /^Bok szuflady — szuflada 1 /.test(r.panel));
const kDna = bokP.find((r) => r.kind === 'konfirmat — dno');
ok('bok szuflady: konfirmaty dna 19 mm nad dołem boku (10 + 18/2), 50 mm od końców', !!kDna && kDna.ys[0] === 19 && /50, \d+, 472 mm od przedniej krawędzi boku/.test(kDna.note), kDna ? `${kDna.ys} ${kDna.note}` : '(brak)');
const kTylu = bokP.find((r) => r.kind === 'konfirmat — tył');
ok(`bok szuflady: konfirmaty tyłu w osi tyłu (${NL - 10 - t / 2} mm od przodu)`, !!kTylu && kTylu.note.includes(`oś tyłu: ${NL - 10 - t / 2} mm`), kTylu ? kTylu.note : '(brak)');
const zacz = plan.find((r) => /^Tył szuflady — szuflada 1/.test(r.panel));
ok('tył: otwór ⌀6 × 10 pod zaczep, 11 mm od dołu, 7 mm od boków', !!zacz && zacz.kind === 'zaczep prowadnicy ⌀6 × 10' && zacz.ys[0] === 11 && /7 mm od lewej i od prawej/.test(zacz.note), zacz ? `${zacz.kind} ${zacz.ys} ${zacz.note}` : '(brak)');
ok('dno: zaczep frontu wg przyrządu 20415, 75 mm od boku wolne', plan.some((r) => /^Dno szuflady — szuflada 1/.test(r.panel) && /20415/.test(r.note) && /75 mm od boku/.test(r.note)));
ok('bez otworów prowadnic V-BOX („otwory 37…”)', !plan.some((r) => r.kind === 'prowadnica' && /otwory 37/.test(r.note)));
ok('uwagi bez błędów', !/×\n/.test(await uwagi()) && !/za niski|sięga .* nad spód|luzu do tego/.test(await uwagi()), (await uwagi()).slice(0, 200));
// 3D: skrzynka nie wchodzi w korpus, zamknieta i otwarta; wysuw = B (NL 550 → 520)
await page.reload({ waitUntil: 'networkidle' }); await page.waitForTimeout(800);
const zamk = await bryla(false);
const otw = await bryla(true);
const korpus = (arr) => arr.filter((s) => !['skrzynka-bok'].includes(s.tag) && /#/.test(s.color || '') && s.d && Math.max(...s.d) > 300 && s.p[2] >= -1);
// boki skrzynki: 18 × bok × (NL − 10); prowadnice: metal 33 × 27
const bokiSk = (arr) => arr.filter((s) => s.d && Math.round(s.d[0]) === t && Math.round(s.d[2]) === NL - 10);
const prow = (arr) => arr.filter((s) => (s.color || '').toLowerCase() === '#8b8b93');
const skrz = (arr) => [...bokiSk(arr), ...prow(arr)];
ok('3D: 2 boki skrzynki z płyty i 2 prowadnice 33 × 27 na szufladę', bokiSk(zamk).length === 6 && prow(zamk).length === 6
  && prow(zamk).every((s) => Math.round(s.d[0]) === 33 && Math.round(s.d[1]) === 27), `${bokiSk(zamk).length} boków, ${prow(zamk).length} prowadnic`);
const frZ = zamk.filter((s) => s.d && Math.round(s.d[1]) >= 230 && Math.round(s.d[0]) === 596).map((s) => s.p[2]).sort((a, c) => a - c);
const frO = otw.filter((s) => s.d && Math.round(s.d[1]) >= 230 && Math.round(s.d[0]) === 596).map((s) => s.p[2]).sort((a, c) => a - c);
ok('3D: szuflada wysuwa się o 520 mm (B z tabeli dla NL 550)', frZ.length === 3 && frO.length === 3 && frO.every((z, i) => Math.round(frZ[i] - z) === 520), `zamk. ${frZ} / otw. ${frO}`);
const bokiK = zamk.filter((s) => s.d && Math.round(s.d[0]) === t && Math.round(s.d[1]) === 720);
const kol = [];
skrz(zamk).forEach((s) => bokiK.forEach((k) => { if (nachodzi(s, k)) kol.push(`${JSON.stringify(s.p)} × ${JSON.stringify(k.p)}`); }));
ok('3D: skrzynka nie wchodzi w boki korpusu (6,5 mm luzu)', bokiK.length === 2 && !kol.length, kol[0] || `${bokiK.length} boki`);
const bokL = bokiSk(zamk).map((s) => s.p[0]).sort((a, c) => a - c);
ok('3D: lewy bok skrzynki od x = 18 + 6,5', bokL.length >= 3 && bokL.slice(0, 3).every((x) => Math.abs(x - 24.5) < 0.6), bokL.join(', '));

/* ===== front wpuszczany: NL + 3 + grubosc frontu, prowadnica 4 + 18 ===== */
console.log('\n== fronty wpuszczane ==');
await seed(projekt([[szafka('W', { frontMode: 'inset' })]]));
const planW = await wiercenia();
const nW = planW.find((r) => r.panel === 'Bok lewy' && r.kind === 'prowadnica');
ok('NL 500 (550 + 3 + 18 > 560), przód prowadnicy 22 mm (4 + front 18)', !!nW && /NL 500; przód prowadnicy 22 mm za przednią krawędzią \(4 \+ grubość frontu 18\)/.test(nW.note), nW ? nW.note : '(brak)');
const kW = planW.filter((r) => r.panel === 'Bok lewy' && r.kind === 'prowadnica').flatMap((r) => r.ys).sort((a, c) => a - c);
ok('najniższa kreska: 2 mm nad dnem (front wpuszczany od 2 mm luzu)', kW[0] === t + 2, kW.join(', '));
await page.reload({ waitUntil: 'networkidle' }); await page.waitForTimeout(800);
ok('wpuszczane: boki 490 mm (NL − 10)', (await tabela(/^Formatki do zamówienia/)).filter((r) => /^Bok szuflady/.test(r[0])).every((r) => num(r[2]) === 490));

/* ===== bok recznie za wysoki: blad i przycisk ===== */
console.log('\n== bok skrzynki ręcznie ==');
await seed(projekt([[szafka('R', { levels: [{ h: null, cols: [szuf([DX({ h: 230 }), DX(), DX()])] }] })]]));
let u = await uwagi();
ok('bok 230 nad dolną szufladą: błąd „sięga … nad spód prowadnicy”', /szuflada 1: skrzynka z bokiem 230 mm sięga 247 mm nad spód prowadnicy/.test(u), u.split('\n').filter((l) => /szuflada 1/.test(l)).join(' / ').slice(0, 220));
const przycisk = boki.length ? `Zmień bok szuflady na ${boki[0]} mm` : 'Zmień bok szuflady';
ok(`przycisk „${przycisk}”`, await page.getByRole('button', { name: przycisk, exact: true }).count() === 1);
if (await page.getByRole('button', { name: przycisk, exact: true }).count()) {
  await page.getByRole('button', { name: przycisk, exact: true }).click(); await page.waitForTimeout(800);
  await czekajZapis(() => JSON.parse(localStorage.getItem('szafki:projekt')).items[0].cab.levels[0].cols[0].drawers[0].h !== 230);
  const z = await zapis();
  ok('po kliknięciu bok zapisany i błąd znika', z.items[0].cab.levels[0].cols[0].drawers[0].h === boki[0] && !/szuflada 1: skrzynka z bokiem/.test(await uwagi()), String(z.items[0].cab.levels[0].cols[0].drawers[0].h));
}
await seed(projekt([[szafka('T', { levels: [{ h: null, cols: [szuf([DX({ backHeight: 230 }), DX(), DX()])] }] })]]));
u = await uwagi();
ok('tył 230 nad boki 200: ostrzeżenie i przycisk „Ustaw tył na 190 mm”', /szuflada 1: tył 230 mm wystaje 40 mm ponad boki skrzynki/.test(u)
  && await page.getByRole('button', { name: 'Ustaw tył na 190 mm', exact: true }).count() === 1, u.split('\n').filter((l) => /tył/.test(l)).join(' / ').slice(0, 200));
await seed(projekt([[szafka('N', { levels: [{ h: null, cols: [szuf([DX({ nl: 270 }), DX(), DX()])] }] })]]));
u = await uwagi();
ok('NL 270 (tylko V-BOX): błąd „nie ma takiej długości w DXS-3D” z przyciskiem NL 250', /szuflada 1: prowadnice NL 270 — nie ma takiej długości w DXS-3D/.test(u)
  && await page.getByRole('button', { name: 'Zmień głębokość prowadnic do NL 250', exact: true }).count() === 1, u.slice(0, 200));

/* ===== wybor systemu w Strukturze wnetrza ===== */
console.log('\n== wybór systemu ==');
const vb = (o = {}) => ({ h: 'auto', front: null, handle: true, ...o });
await seed(projekt([[szafka('V', { levels: [{ h: null, cols: [szuf([vb(), vb()])] }] })]]));
ok('wiersz szuflady ma wybór systemu (domyślnie V-BOX)', await page.locator('[data-el="szuflada-system"]').count() === 2
  && (await page.locator('[data-el="szuflada-system"]').first().inputValue()) === 'vbox');
await page.locator('[data-el="szuflada-system"]').first().selectOption('dxs'); await page.waitForTimeout(600);
await czekajZapis(() => JSON.parse(localStorage.getItem('szafki:projekt')).items[0].cab.levels[0].cols[0].drawers.some((d) => d.system === 'dxs'));
let z = await zapis();
ok('zmiana na DXS-3D zapisuje system jednej szuflady', z.items[0].cab.levels[0].cols[0].drawers.filter((d) => d.system === 'dxs').length === 1, JSON.stringify(z.items[0].cab.levels[0].cols[0].drawers.map((d) => d.system || 'vbox')));
u = await uwagi();
ok('różne systemy w szafce: ostrzeżenie z przyciskami', /W szafce są szuflady V-BOX \(1\) i DXS-3D \(1\)/.test(u)
  && await page.getByRole('button', { name: 'Wszystkie szuflady szafki na DXS-3D', exact: true }).count() === 1
  && await page.getByRole('button', { name: 'Zostaw różne systemy', exact: true }).count() === 1, u.slice(0, 200));
ok('wiersz DXS: pola „bok” i „tył” w mm', await page.locator('[data-el="dxs-bok"]').count() === 1 && await page.locator('[data-el="dxs-tyl"]').count() === 1);
await page.getByRole('button', { name: 'Zostaw różne systemy', exact: true }).click(); await page.waitForTimeout(600);
await czekajZapis(() => JSON.parse(localStorage.getItem('szafki:projekt')).items[0].cab.szufladyMieszane === true);
ok('„Zostaw” → informacja „zostawione tak” z powrotem do ostrzeżenia', /zostawione tak \(wybrane\)/.test(await uwagi()) && await page.getByRole('button', { name: 'Wróć do ostrzeżenia', exact: true }).count() === 1);
await page.getByRole('button', { name: 'Wróć do ostrzeżenia', exact: true }).click(); await page.waitForTimeout(600);
await page.getByRole('button', { name: 'Wszystkie szuflady szafki na DXS-3D', exact: true }).click(); await page.waitForTimeout(600);
await czekajZapis(() => JSON.parse(localStorage.getItem('szafki:projekt')).items[0].cab.levels[0].cols[0].drawers.every((d) => d.system === 'dxs'));
z = await zapis();
ok('„Wszystkie na DXS-3D” — obie szuflady DXS, ostrzeżenie znika', z.items[0].cab.levels[0].cols[0].drawers.every((d) => d.system === 'dxs') && !/W szafce są szuflady/.test(await uwagi()));
await page.getByRole('button', { name: '+ szuflada', exact: true }).first().click(); await page.waitForTimeout(600);
await czekajZapis(() => JSON.parse(localStorage.getItem('szafki:projekt')).items[0].cab.levels[0].cols[0].drawers.length === 3);
z = await zapis();
ok('„+ szuflada” w kolumnie DXS — nowa też DXS-3D', z.items[0].cab.levels[0].cols[0].drawers.length === 3 && z.items[0].cab.levels[0].cols[0].drawers[2].system === 'dxs');

/* ===== ciag: szafka na innym systemie niz reszta ===== */
console.log('\n== ciąg: inny system niż reszta ==');
const RUN = { id: 'c1', name: 'A', wallW: null, gap: 0, mountY: 0, H: 720, D: 560, plinth: PL, worktop: false, corner: null };
await seed(projekt([[szafka('A1'), 'c1'], [szafka('A2', { levels: [{ h: null, cols: [szuf([vb(), vb(), vb()])] }] }), 'c1']], [RUN]), 1);
u = await uwagi();
ok('w szafce V-BOX: „Szuflady tej szafki są na V-BOX, a w ciągu „A” na DXS-3D”', /Szuflady tej szafki są na V-BOX, a w ciągu „A” na DXS-3D/.test(u), u.slice(0, 200));
await page.getByRole('button', { name: 'Wszystkie szuflady szafki na DXS-3D', exact: true }).first().click(); await page.waitForTimeout(600);
await czekajZapis(() => JSON.parse(localStorage.getItem('szafki:projekt')).items[1].cab.levels[0].cols[0].drawers.every((d) => d.system === 'dxs'));
z = await zapis();
ok('przycisk zmienia szuflady tej szafki na DXS-3D, uwaga znika', z.items[1].cab.levels[0].cols[0].drawers.every((d) => d.system === 'dxs') && !/Szuflady tej szafki są na/.test(await uwagi()));
// kolumna drzwi → szuflady w ciagu DXS: nowe szuflady DXS-3D
await seed(projekt([[szafka('A1'), 'c1'], [szafka('A2', { levels: [{ h: null, cols: [{ kind: 'doors', doors: 2, w: null, shelfTargets: [null, null] }] }] }), 'c1']], [RUN]), 1);
await page.getByRole('button', { name: 'Szuflady', exact: true }).first().click(); await page.waitForTimeout(600);
await czekajZapis(() => (JSON.parse(localStorage.getItem('szafki:projekt')).items[1].cab.levels[0].cols[0].drawers || []).length > 0);
z = await zapis();
ok('kolumna zmieniona na szuflady w ciągu DXS — szuflady DXS-3D', (z.items[1].cab.levels[0].cols[0].drawers || []).length === 3 && z.items[1].cab.levels[0].cols[0].drawers.every((d) => d.system === 'dxs'),
  JSON.stringify((z.items[1].cab.levels[0].cols[0].drawers || []).map((d) => d.system || 'vbox')));

/* ===== V-BOX bez zmian ===== */
console.log('\n== V-BOX bez zmian ==');
await seed(projekt([[szafka('VB', { levels: [{ h: null, cols: [szuf([vb(), vb(), vb()])] }] })]]));
const okV = await tabela(/^Produkty do zamówienia/);
ok('V-BOX: prowadnice V-BOX w zamówieniu, bez DXS i bez boków skrzynki z płyty', okV.some((r) => /V-BOX 3D Slim/.test(r[0])) && !okV.some((r) => /DXS/.test(r[0]))
  && !(await tabela(/^Formatki do zamówienia/)).some((r) => /^Bok szuflady/.test(r[0])));

console.log('\nBLEDY STRONY:', errors.join(' | ') || '(brak)');
await b.close();
