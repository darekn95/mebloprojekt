/* Plecy HDF „We frezie” = frez od tylu na krawedzi bokow, wienca i dna
   (ustalone z uzytkownikiem 2026-09-28; w UI zawsze „frez”): z plyty 18 frezujemy 16 (zostaja 2 mm od
   zewnatrz), 3 mm w glab w strone drzwi, wiec HDF 3 mm stoi rowno z tylem
   korpusu; luz 1 mm na strone. HDF = W - 6 × H - 6, polki o 3 mm plytsze,
   szafka stoi tylem korpusu przy scianie (bez 3 mm plecow za nim). */
import pw from './pw.mjs';
const URL = process.env.STD ? 'http://127.0.0.1:5199/standalone-local.html'
  : 'http://127.0.0.1:5205/mebloprojekt-app.html';
const ok = (l, c, e = '') => console.log((c ? '  OK   ' : '  BLAD ') + l + (e ? ' — ' + e : ''));
const b = await pw.chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const page = await (await b.newContext({ viewport: { width: 1500, height: 1300 } })).newPage();
const errors = []; page.on('pageerror', (e) => errors.push(e.message));
await page.goto(URL, { waitUntil: 'networkidle' });

const PL = { on: true, height: 100, mode: 'under', setback: 0 };
const seed = async (backGroove) => {
  await page.evaluate((q) => { localStorage.clear(); localStorage.setItem('szafki:projekt', JSON.stringify(q)); }, {
    name: 'R', active: 0, prices: {}, runs: [], items: [{ cab: { name: 'R', W: 600, H: 720, D: 560, plinth: PL,
      legs: { on: true, height: 100 }, back: 'hdf', backGroove,
      levels: [{ h: null, cols: [{ kind: 'doors', doors: 2, w: null, shelfTargets: [null, null] }] }] }, offset: 0 }] });
  await page.reload({ waitUntil: 'networkidle' }); await page.waitForTimeout(900);
};
const formatki = () => page.evaluate(() => {
  const sec = [...document.querySelectorAll('section')].find((s) => /^Formatki do zamówienia/.test((s.querySelector('h2') || {}).textContent || ''));
  return [...sec.querySelectorAll('tbody tr')].map((tr) => [...tr.children].map((x) => x.textContent.trim()));
});
const wymiar = (rows, re) => rows.filter((r) => re.test(r[0])).map((r) => `${r[2]}×${r[3]}`);
const zapis = () => page.evaluate(() => JSON.parse(localStorage.getItem('szafki:projekt')).items[0].cab.backGroove);

console.log('== frez 16 × 3, luz 1 ==');
await seed({ on: true, offset: 3, depth: 16, play: 1, wreg: true });
let rows = await formatki();
ok('Plecy HDF we frezie 594 × 714 (W − 6 × H − 6)', wymiar(rows, /^Plecy HDF we frezie/).includes('594×714'),
  wymiar(rows, /^Plecy/).join(', '));
ok('półka o grubość HDF płytsza: 564 × 557', wymiar(rows, /^Półka/).includes('564×557'), wymiar(rows, /^Półka/).join(', '));
ok('bok ma pełną głębokość 560', rows.some((r) => /^Bok/.test(r[0]) && (r[2] === '560' || r[3] === '560')),
  rows.filter((r) => /^Bok/.test(r[0])).map((r) => r.slice(0, 4).join('|')).join(' / '));
const pola = await page.evaluate(() => {
  const g = [...document.querySelectorAll('.grid')].find((x) => /Szerokość[\s\S]*frezu[\s\S]*Głębokość[\s\S]*frezu/.test(x.textContent));
  return g ? [...g.querySelectorAll('input')].map((i) => i.value) : null;
});
ok('pola: Szerokość 16, Głębokość 3, Luz 1', JSON.stringify(pola) === '["16","3","1"]', JSON.stringify(pola));

console.log('\n== rzut z góry: HDF równo z tyłem korpusu ==');
for (const l of ['Szafka', 'Z góry']) {
  const x = page.getByText(l, { exact: true }).first();
  if (await x.count()) { await x.click(); await page.waitForTimeout(600); }
}
const hdf = await page.evaluate(() => [...document.querySelectorAll('#rysunek svg rect')]
  .map((r) => ({ x: +r.getAttribute('x'), y: +r.getAttribute('y'), w: +r.getAttribute('width'), h: +r.getAttribute('height') }))
  .filter((r) => r.h === 3 && r.w > 500));
ok('HDF na y = 0 (tył korpusu), nie za nim', hdf.some((r) => r.y === 0), JSON.stringify(hdf));

console.log('\n== frez płytszy niż HDF: ostrzeżenie ==');
await seed({ on: true, offset: 2, depth: 16, play: 1, wreg: true });
const card = page.locator('section').filter({ has: page.locator('h2', { hasText: /^Uwagi/ }) }).first();
const u = (await card.count()) ? await card.innerText() : '';
ok('„plecy wystają 1 mm za tył korpusu”', /plecy wystają 1 mm za tył korpusu/.test(u), u.slice(0, 200));

console.log('\n== stary zapis {16 od tyłu, 4 w płytę} przechodzi na frez 16 × 3 ==');
await seed({ on: true, offset: 16, depth: 4, play: 1 });
rows = await formatki();
ok('stary projekt: HDF 594 × 714', wymiar(rows, /^Plecy HDF we frezie/).includes('594×714'), wymiar(rows, /^Plecy/).join(', '));
await page.getByText('Szafka', { exact: true }).first().click().catch(() => {});
await page.waitForTimeout(1300);
const bg = await zapis();
ok('po zapisie: offset 3, depth 16, wreg', bg && bg.offset === 3 && bg.depth === 16 && bg.wreg === true, JSON.stringify(bg));

console.log('\nBLEDY:', errors.length ? errors.join('; ') : '(brak)');
await b.close();
