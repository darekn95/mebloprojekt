/* Ciagi gorne w kuchni w L. Pilnuje trzech rzeczy znalezionych przy testach
   2026-09-28:
   - gorny ciag drugiej sciany wisi na tej scianie (wczesniej trafial na
     pierwsza i nachodzil na tamten gorny),
   - gorny ciag, ktory zaczyna sie w rogu, odsuwa sie o glebokosc gornego ciagu
     sciany wjezdzajacej (300), gdy ten siega rogu — a nie wcale,
   - „+ szafka” w ciagu bierze jego wymiary (gorny 300 w glab, dolny 570),
     zamiast domyslnych 500. */
import pw from './pw.mjs';
const URL = process.env.STD ? 'http://127.0.0.1:5199/standalone-local.html'
  : 'http://127.0.0.1:5205/mebloprojekt-app.html';
const ok = (l, c, e = '') => console.log((c ? '  OK   ' : '  BLAD ') + l + (e ? ' — ' + e : ''));
const b = await pw.chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const page = await (await b.newContext({ viewport: { width: 1500, height: 1300 } })).newPage();
const errors = []; page.on('pageerror', (e) => errors.push(e.message));
await page.goto(URL, { waitUntil: 'networkidle' });

const PL = { on: true, height: 100, mode: 'under', setback: 0 };
const dol = (name, W, runId) => ({ cab: { name, W, H: 720, D: 570, plinth: PL, legs: { on: true, height: 100 },
  levels: [{ h: null, cols: [{ kind: 'doors', doors: 1, w: null }] }] }, runId, offset: 0 });
const gor = (name, W, runId) => ({ cab: { name, W, H: 720, D: 300, plinth: { ...PL, on: false }, legs: { on: false }, hangerMode: 'listwa',
  levels: [{ h: null, cols: [{ kind: 'doors', doors: 1, w: null }] }] }, runId, offset: 0 });
const RUN = (id, name, o = {}) => ({ id, name, wallW: null, gap: 0, mountY: 0, H: 720, D: 570, plinth: PL, worktop: true, corner: null, ...o });
const RUNY = () => [RUN('c1', 'Ściana 1'), RUN('c2', 'Ściana 2', { corner: { of: 'c1', at: 'end', owner: 'of', clear: 0 } }),
  RUN('c3', 'Ściana 1', { tier: 'gorny', wall: 'c1', D: 300, H: 720, mountY: 1358, worktop: false, plinth: null }),
  RUN('c4', 'Ściana 2', { tier: 'gorny', wall: 'c2', D: 300, H: 720, mountY: 1358, worktop: false, plinth: null })];
const seed = async (items, active = 0) => {
  await page.evaluate((p) => { localStorage.clear(); localStorage.setItem('szafki:projekt', JSON.stringify(p)); },
    { name: 'G', active, prices: {}, runs: RUNY(), items });
  await page.reload({ waitUntil: 'networkidle' }); await page.waitForTimeout(800);
};
const pick = async (l) => { await page.getByRole('button', { name: l, exact: true }).first().click(); await page.waitForTimeout(300); };
const napisyZGory = async () => {
  await pick('Zabudowa'); await pick('Z góry');
  return page.evaluate(() => [...document.querySelectorAll('#rysunek text')].map((t) => t.textContent.trim()));
};
const kolizje = async () => {
  const c = page.locator('section').filter({ has: page.locator('h2', { hasText: /^Uwagi/ }) }).first();
  return (await c.count() ? await c.innerText() : '').split('\n').filter((l) => /nie ma się jak otworzyć/.test(l));
};
const dolne = [dol('D1', 600, 'c1'), dol('D2', 600, 'c1'), dol('D3', 1000, 'c1'), dol('D4', 600, 'c2')];

console.log('== górny ciąg drugiej ściany wisi na niej ==');
// gorny sciany 1 konczy sie daleko od rogu (1200 z 2200), gorny sciany 2 startuje w rogu
await seed([...dolne, gor('G1', 600, 'c3'), gor('G2', 600, 'c3'), gor('G3', 600, 'c4'), gor('G4', 600, 'c4')]);
let t = await napisyZGory();
const gorneNapisy = t.filter((x) => /ciąg górny — 1358 nad podłogą/.test(x));
ok('dwa podpisy „ciąg górny — 1358” (po jednym na ścianę)', gorneNapisy.length === 2, t.filter((x) => /1358/.test(x)).join(' | '));
// dolny slepy rog (D3/D4) ma swoje kolizje — tu liczymy tylko te miedzy gornymi szafkami
let k = (await kolizje()).filter((l) => /szafki „G\d"[^„]*„G\d"/.test(l) || /Skrzydło szafki „G/.test(l));
ok('górne ciągi obu ścian nie nachodzą na siebie (brak kolizji górnych)', k.length === 0, k.map((l) => l.slice(0, 80)).join(' / '));

console.log('\n== górny ciąg sięgający rogu odsuwa górny drugiej ściany o 300 ==');
// gorny sciany 1 do samego rogu: 600 + 600 + 1000 = 2200 = dlugosc dolnego
await seed([...dolne, gor('G1', 600, 'c3'), gor('G2', 600, 'c3'), gor('G3', 1000, 'c3'), gor('G4', 600, 'c4')]);
t = await napisyZGory();
ok('rzut pokazuje odsunięcie 300 w rogu górnego ciągu', t.includes('300'), t.filter((x) => /^\d{3}$/.test(x)).join(','));

console.log('\n== „+ szafka” bierze wymiary ciągu ==');
await seed([...dolne, gor('G1', 600, 'c3'), gor('G2', 600, 'c4')]);
const wiersze = page.locator('header .space-y-1 > div');
await wiersze.filter({ hasText: 'ciąg górny' }).first().getByRole('button', { name: '+ szafka' }).click();
await page.waitForTimeout(1500);
await wiersze.filter({ hasText: 'ciąg dolny' }).first().getByRole('button', { name: '+ szafka' }).click();
await page.waitForTimeout(1500);
const p = await page.evaluate(() => JSON.parse(localStorage.getItem('szafki:projekt')));
const nowe = p.items.filter((it) => /^Szafka \d+$/.test(it.cab.name));
const wG = nowe.find((it) => it.runId === 'c3' || it.runId === 'c4');
const wD = nowe.find((it) => it.runId === 'c1' || it.runId === 'c2');
ok('nowa szafka w ciągu górnym ma 300 w głąb', wG && wG.cab.D === 300, wG && String(wG.cab.D));
ok('nowa szafka w ciągu dolnym ma 570 w głąb i cokół ciągu', wD && wD.cab.D === 570 && wD.cab.plinth && wD.cab.plinth.on,
  wD && JSON.stringify({ D: wD.cab.D, plinth: wD.cab.plinth }));

console.log('\nBLEDY:', errors.length ? errors.join('; ') : '(brak)');
await b.close();
