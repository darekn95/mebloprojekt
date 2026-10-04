/* Decyzje uzytkownika z analizy brakow kontroli (2026-10-04):
   1. H to wysokosc calej szafki razem z gorna plyta — takze z blatem roboczym 38
      lezacym na bokach: boki krotsze o grubosc blatu, a gorny ciag liczy przeswit
      od H (blat juz w niej jest).
   2. Wspornik pionowy fixu bez plyty nad soba (pod blatem) idzie na trojkaty:
      jeden do dna i co ok. 300 mm (min. 2) do fixa — bez konfirmatow.
   3. „+ szafka” w pustym ciagu dolnym: glebokosc innego ciagu dolnego
      w pomieszczeniu, a gdy go nie ma — 560 (nie 500 szafki domyslnej).
   4. Szafka w L z kreatora rogu bierze glebokosc sasiedniej sciany. */
import pw from './pw.mjs';
const URL = process.env.STD ? 'http://127.0.0.1:5199/standalone-local.html'
  : 'http://127.0.0.1:5205/mebloprojekt-app.html';
const ok = (l, c, e = '') => console.log((c ? '  OK   ' : '  BLAD ') + l + (e ? ' — ' + e : ''));
const b = await pw.chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const page = await (await b.newContext({ viewport: { width: 1500, height: 1300 } })).newPage();
const errors = []; page.on('pageerror', (e) => errors.push(e.message));
await page.goto(URL, { waitUntil: 'networkidle' });

const PL = { on: true, height: 100, mode: 'under', setback: 0 };
const MAT = {
  board: { name: 'Płyta', thickness: 18, color: '#d6d3d1' }, front: { name: 'Płyta', thickness: 18, color: '#d6d3d1' },
  shelf: { name: 'Płyta', thickness: 18, color: '#d6d3d1' }, back: { name: 'HDF', thickness: 3, color: '#e7e5e4' },
  worktop: { name: 'Blat roboczy', thickness: 38, color: '#8d7b68', depth: 600 },
};
const wczytaj = async (q) => {
  await page.evaluate((x) => { localStorage.clear(); localStorage.setItem('szafki:projekt', JSON.stringify(x)); }, q);
  await page.reload({ waitUntil: 'networkidle' }); await page.waitForTimeout(1200);
};
const zapis = async () => { await page.waitForTimeout(1500); return page.evaluate(() => JSON.parse(localStorage.getItem('szafki:projekt'))); };
const click = async (l) => { const x = page.getByRole('button', { name: l, exact: true }); if (await x.count()) { await x.first().click(); await page.waitForTimeout(300); return true; } return false; };
const sekcja = (re) => page.evaluate((src) => {
  const sec = [...document.querySelectorAll('section')].find((s) => new RegExp(src).test((s.querySelector('h2') || {}).textContent || ''));
  return sec ? [...sec.querySelectorAll('tbody tr')].map((tr) => [...tr.children].map((x) => x.textContent.trim())) : [];
}, re.source);
const okucia = async () => (await sekcja(/^Produkty do zamówienia/)).map((r) => r.join(' | '));
const ile = (rows, re) => { const r = rows.find((x) => re.test(x)); return r ? Number((r.split('|').pop() || '').trim().split(' ')[0]) : null; };
const pdf = async () => {
  await page.evaluate(() => { window.__rep = ''; window.print = () => { const r = document.querySelector('.print-only');
    window.__rep = r ? [...r.querySelectorAll('tr')].map((tr) => tr.innerText.replace(/\s+/g, ' ')).join('\n') : ''; }; });
  await page.getByRole('button', { name: 'Zestawienie PDF', exact: true }).first().click(); await page.waitForTimeout(1200);
  return page.evaluate(() => window.__rep);
};
const wiersz = (re) => page.locator('header .space-y-1 > div').filter({ hasText: re }).first();

console.log('== 1. blat roboczy 38 na bokach mieści się w H ==');
const zBlatem = (name, material, o = {}) => ({ cab: { name, W: 600, H: 720, D: 560, plinth: PL,
  top: { mode: 'blat', material, widthMode: 'outside', overL: 0, overR: 0, overFront: 0, overBack: 0 },
  joints: { topL: 'over', topR: 'over', botL: 'between', botR: 'between' },
  levels: [{ h: null, cols: [{ kind: 'doors', doors: 2, w: null }] }], ...o }, mat: MAT, offset: 0 });
for (const [material, gr] of [['worktop', 38], ['board', 18]]) {
  await wczytaj({ name: 'B', active: 0, prices: {}, runs: [], items: [zBlatem('S', material)] });
  const f = await sekcja(/^Formatki do zamówienia/);
  const bok = f.find((r) => r[0] === 'Bok');
  ok(`blat ${gr} mm: bok ${720 - gr} (720 − ${gr})`, bok && bok.includes(String(720 - gr)), bok && bok.join(' '));
  await click('Szafka'); await click('Zamk.');
  await page.evaluate(() => { window.__audytBryl = []; }); await click('3D');
  const sol = await page.evaluate(() => (window.__audytBryl || []).filter((s) => s.p));
  const gora = Math.max(...sol.map((s) => s.p[4]));
  const blat = sol.find((s) => Math.round(s.p[4]) === Math.round(gora) && Math.round(s.p[4] - s.p[1]) === gr);
  // widok samej szafki liczy y od spodu korpusu (cokol ponizej zera)
  ok(`blat ${gr} mm: w 3D płyta ${gr} mm z wierzchem na H`, !!blat && Math.round(gora) === 720, `góra ${Math.round(gora)}, płyta ${blat ? '' : 'brak '}${gr}`);
}
// gorny ciag nad szafkami z blatem na bokach: przeswit od H, blat juz w niej jest
await wczytaj({ name: 'B', active: 0, prices: {}, runs: [
  { id: 'c1', name: 'Ściana 1', roomId: 'p1', wallW: null, gap: 0, mountY: 0, H: 720, D: 560, plinth: PL, worktop: false, corner: null, tier: 'dolny' },
  { id: 'c2', name: 'Ściana 1', roomId: 'p1', wallW: null, gap: 0, mountY: 0, H: 720, D: 300, plinth: null, worktop: false, corner: null, tier: 'gorny', wall: 'c1', clearance: 500 }],
  rooms: [{ id: 'p1', name: 'Kuchnia' }],
  items: [{ ...zBlatem('S1', 'worktop'), runId: 'c1', roomId: 'p1' },
    { cab: { name: 'G1', W: 600, H: 720, D: 300, plinth: { ...PL, on: false }, levels: [{ h: null, cols: [{ kind: 'doors', doors: 2, w: null }] }] },
      mat: MAT, runId: 'c2', roomId: 'p1', offset: 0 }] });
await click('Zabudowa'); await click('Zamk.');
await page.evaluate(() => { window.__audytBryl = []; }); await click('3D');
const solZ = await page.evaluate(() => (window.__audytBryl || []).filter((s) => s.p));
const ys = [...new Set(solZ.map((s) => Math.round(s.p[1])))].sort((x, y) => x - y);
const gornaOd = ys.find((y) => y > 900);
ok('górny ciąg wisi 500 nad szafką z blatem na bokach (100 + 720 + 500 = 1320)', gornaOd === 1320, `spód górnej ${gornaOd}`);

console.log('\n== 2. wspornik pod blatem na trójkątach ==');
// szafka pod blatem prosto z aplikacji: „+ ciąg”, „+ szafka” (bez wienca, para wzmocnien)
await page.evaluate(() => localStorage.clear()); await page.reload({ waitUntil: 'networkidle' }); await page.waitForTimeout(900);
await click('+ ciąg');
await wiersz(/^Ściana 1/).getByRole('button', { name: '+ szafka', exact: true }).click();
let p = await zapis();
const podBlat = p.items.find((it) => it.runId);
const zFixem = (it) => ({ ...it, cab: { ...it.cab, levels: it.cab.levels.map((lv) => ({ ...lv, cols: lv.cols.map((c) => ({ ...c, kind: 'doors', doors: 1, hinge: 'right',
  fix: { side: 'left', w: 100, mode: 'overlay', support: true, supportDepth: 100 } })) })) } });
await wczytaj({ ...p, items: [zFixem(podBlat)], active: 0 });
let hw = await okucia();
const tr = hw.find((r) => /^Trójkąt meblarski/.test(r) && /wspornik/.test(r));
// wspornik od dna (18) do plaskiego wzmocnienia (702): 684 mm -> 3 do fixa + 1 do dna
ok('okucia: trójkąty wspornika 1 do dna + 3 do fixa = 4', tr && ile([tr], /./) === 4, tr);
const konf = hw.find((r) => /^Konfirmat/.test(r));
ok('okucia: bez konfirmatów do wspornika', !konf || !/wsporniki/.test(konf), konf);
let rep = await pdf();
const wFixie = rep.split('\n').filter((l) => /Element stały.*trójkąt meblowy — wspornik/.test(l) || /trójkąt meblowy — wspornik/.test(l));
ok('plan wierceń: trójkąty wspornika w fixie i w dnie', /trójkąt meblowy — wspornik pionowy/.test(rep) && !/konfirmat — wspornik pionowy/.test(rep),
  wFixie.slice(0, 3).join(' / '));
// kontrola: ta sama szafka z wiencem — konfirmaty, bez trojkatow
const zWiencem = zFixem({ cab: { name: 'W', W: 600, H: 720, D: 560, plinth: PL, levels: [{ h: null, cols: [{ kind: 'doors', doors: 2, w: null }] }] }, mat: MAT, offset: 0 });
await wczytaj({ name: 'W', active: 0, prices: {}, runs: [], items: [zWiencem] });
hw = await okucia();
ok('z wieńcem: konfirmaty wspornika (wieniec i dno), bez trójkątów', /wsporniki 2×/.test(hw.find((r) => /^Konfirmat/.test(r)) || '')
  && !hw.some((r) => /^Trójkąt meblarski/.test(r) && /wspornik/.test(r)), hw.filter((r) => /Konfirmat|Trójkąt/.test(r)).join(' / '));

console.log('\n== 3. „+ szafka” w pustym ciągu dolnym ==');
await page.evaluate(() => localStorage.clear()); await page.reload({ waitUntil: 'networkidle' }); await page.waitForTimeout(900);
await click('+ ciąg');
await wiersz(/^Ściana 1/).getByRole('button', { name: '+ szafka', exact: true }).click();
p = await zapis();
const pierwsza = p.items.find((it) => it.runId);
ok('pierwszy ciąg w pomieszczeniu: szafka 560 (nie 500)', pierwsza && pierwsza.cab.D === 560, pierwsza && String(pierwsza.cab.D));
ok('ciąg przejmuje 560', p.runs[0].D === 560, String(p.runs[0].D));
// drugi, pusty ciag w tym samym pomieszczeniu bierze glebokosc pierwszego (tu 570)
p = { ...p, runs: [{ ...p.runs[0], D: 570 }, { ...p.runs[0], id: 'c9', name: 'Ściana 2', D: null, H: null, plinth: null, corner: null }],
  items: p.items.map((it) => (it.runId ? { ...it, cab: { ...it.cab, D: 570 } } : it)) };
await wczytaj(p);
await wiersz(/^Ściana 2/).getByRole('button', { name: '+ szafka', exact: true }).click();
p = await zapis();
const druga = p.items.find((it) => it.runId === 'c9');
ok('pusty ciąg obok ciągu 570: szafka 570', druga && druga.cab.D === 570, druga && String(druga.cab.D));

console.log('\n== 4. szafka w L z kreatora: głębokość sąsiedniej ściany ==');
const RUN = { id: 'c1', name: 'Ściana 1', wallW: null, gap: 0, mountY: 0, H: 720, D: 570, plinth: PL, worktop: true, corner: null };
await wczytaj({ name: 'K', active: 0, prices: {}, runs: [RUN],
  items: ['S1', 'S2'].map((n) => ({ cab: { name: n, W: 600, H: 720, D: 570, plinth: PL, levels: [{ h: null, cols: [{ kind: 'doors', doors: 2, w: null }] }] }, mat: MAT, runId: 'c1', offset: 0 })) });
await click('+ ciąg');
const kreator = page.locator('[data-el="kreator-rogu"]');
await kreator.locator('select').nth(1).selectOption('L'); await page.waitForTimeout(200);
await kreator.getByRole('button', { name: 'Utwórz ciąg' }).click(); await page.waitForTimeout(1500);
p = await zapis();
const l = p.items.find((it) => it.cab.corner && it.cab.corner.on);
ok('szafka w L ma 570 jak sąsiednia ściana', l && l.cab.D === 570, l && String(l.cab.D));

console.log('\nBLEDY:', errors.length ? errors.join('; ') : '(brak)');
await b.close();
