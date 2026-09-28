/* Kreator rogu przy „+ ciąg” i przycisk „Ustaw szafkę w rogu” (2026-09-28).
   Scenariusz uzytkownika: sciana 1 z trzema szafkami 600, drugi ciag pod katem
   prostym za nia, w rog wjezdza nowy ciag, slepa szafka 1000 z fixem, wstawka.
   Kreator ma od razu dac gotowy rog: fix 618 (570 + 18 + 30) przy rogu, jedne
   drzwi z zawiasem od zewnatrz, wstawka plaska — bez bloku „do ustawienia”. */
import pw from './pw.mjs';
const URL = process.env.STD ? 'http://127.0.0.1:5199/standalone-local.html'
  : 'http://127.0.0.1:5205/mebloprojekt-app.html';
const ok = (l, c, e = '') => console.log((c ? '  OK   ' : '  BLAD ') + l + (e ? ' — ' + e : ''));
const b = await pw.chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const page = await (await b.newContext({ viewport: { width: 1500, height: 1300 } })).newPage();
const errors = []; page.on('pageerror', (e) => errors.push(e.message));
await page.goto(URL, { waitUntil: 'networkidle' });

const PL = { on: true, height: 100, mode: 'under', setback: 0 };
const CAB = (name, W, runId) => ({ cab: { name, W, H: 720, D: 570, plinth: PL, legs: { on: true, height: 100 },
  levels: [{ h: null, cols: [{ kind: 'doors', doors: 2, w: null }] }] }, runId, offset: 0 });
const RUN = (id, name, o = {}) => ({ id, name, wallW: null, gap: 0, mountY: 0, H: 720, D: 570, plinth: PL, worktop: true, corner: null, ...o });
const seed = async (p) => {
  await page.evaluate((q) => { localStorage.clear(); localStorage.setItem('szafki:projekt', JSON.stringify(q)); }, p);
  await page.reload({ waitUntil: 'networkidle' }); await page.waitForTimeout(800);
};
const zapis = () => page.evaluate(() => JSON.parse(localStorage.getItem('szafki:projekt')));
const card = (re) => page.locator('section').filter({ has: page.locator('h2', { hasText: re }) }).first();
const uwagi = async () => (await card(/^Uwagi/).count() ? await card(/^Uwagi/).innerText() : '');
const sciana1 = () => ({ name: 'K', active: 0, prices: {}, runs: [RUN('c1', 'Ściana 1')],
  items: [CAB('S1', 600, 'c1'), CAB('S2', 600, 'c1'), CAB('S3', 600, 'c1')] });
const kreator = page.locator('[data-el="kreator-rogu"]');
const otworz = async () => { await page.getByRole('button', { name: '+ ciąg', exact: true }).click(); await page.waitForTimeout(300); };
const utworz = async () => { await kreator.getByRole('button', { name: 'Utwórz ciąg' }).click(); await page.waitForTimeout(1500); };

console.log('== kreator: ślepa szafka z fixem, nowy ciąg w róg ==');
await seed(sciana1());
await otworz();
ok('„+ ciąg” przy istniejącym ciągu otwiera kreator', await kreator.count() === 1);
await utworz();
let p = await zapis();
const c2 = p.runs.find((r) => r.id !== 'c1');
ok('nowy ciąg ma narożnik do „Ściana 1”, za nim, sam w róg, z płaską wstawką',
  c2 && c2.corner && c2.corner.of === 'c1' && c2.corner.at === 'end' && c2.corner.owner === 'self'
    && c2.corner.wstawka && c2.corner.wstawka.typ === 'plaska', JSON.stringify(c2 && c2.corner));
const rog = p.items.find((it) => it.runId === (c2 || {}).id);
const kol = rog && rog.cab.levels[0].cols[0];
ok('szafka w rogu 1000 × 570 w nowym ciągu', rog && rog.cab.W === 1000 && rog.cab.D === 570, rog && `${rog.cab.W}×${rog.cab.D}`);
ok('fix 618 przy rogu (od lewej), jedne drzwi, zawias od zewnątrz (prawy)',
  kol && kol.fix.side === 'left' && kol.fix.w === 618 && kol.doors === 1 && kol.hinge === 'right', JSON.stringify(kol && { fix: kol.fix, doors: kol.doors, hinge: kol.hinge }));
let u = await uwagi();
ok('bez bloku „Szafka w rogu do ustawienia” — róg jest od razu ustawiony', !/do ustawienia/.test(u) && /ma fix 618 mm/.test(u),
  u.split('\n').filter((l) => /fix|ustawienia/.test(l)).join(' / '));

console.log('\n== kreator: szafka w L ==');
await seed(sciana1());
await otworz();
await kreator.locator('select').nth(1).selectOption('L'); await page.waitForTimeout(200);
await utworz();
p = await zapis();
const l = p.items.find((it) => it.cab.corner && it.cab.corner.on);
ok('szafka w L 900 z ramieniem 630 w nowym ciągu', l && l.cab.W === 900 && l.cab.corner.arm === 630 && l.runId !== 'c1',
  l && JSON.stringify({ W: l.cab.W, arm: l.cab.corner.arm, run: l.runId }));
const c2L = p.runs.find((r) => r.id !== 'c1');
ok('przy szafce w L bez wstawki', c2L && c2L.corner && !c2L.corner.wstawka);

console.log('\n== kreator: osobny ciąg ==');
await seed(sciana1());
await otworz();
await kreator.getByText('Osobny ciąg', { exact: true }).click(); await page.waitForTimeout(200);
await utworz();
p = await zapis();
ok('osobny ciąg bez narożnika i bez nowej szafki', p.runs.length === 2 && !p.runs[1].corner && p.items.length === 3);

console.log('\n== przycisk „Ustaw szafkę w rogu” w istniejącym projekcie ==');
await seed({ name: 'K', active: 3, prices: {}, runs: [RUN('c1', 'Ściana 1'), RUN('c2', 'Ściana 2', { corner: { of: 'c1', at: 'end', owner: 'self', clear: 0 } })],
  items: [CAB('S1', 600, 'c1'), CAB('S2', 600, 'c1'), CAB('S3', 600, 'c1'), CAB('R', 1000, 'c2')] });
u = await uwagi();
ok('na górze blok „Ślepy narożnik — szafka w rogu do ustawienia”', /szafka w rogu do ustawienia/.test(u));
ok('kolizje w tym rogu czekają na ustawienie', !/nie ma się jak otworzyć/.test(u), u.split('\n').filter((l) => /otworzyć/.test(l)).join(' / '));
await card(/^Uwagi/).getByRole('button', { name: /Ustaw szafkę w rogu: fix 618 mm \+ drzwi \+ wstawka 18 mm/ }).click();
await page.waitForTimeout(1500);
p = await zapis();
const k2 = p.items[3].cab.levels[0].cols[0];
ok('po kliknięciu: fix 618 od lewej, jedne drzwi, zawias prawy, wstawka płaska',
  k2.fix.side === 'left' && k2.fix.w === 618 && k2.doors === 1 && k2.hinge === 'right' && p.runs[1].corner.wstawka && p.runs[1].corner.wstawka.typ === 'plaska',
  JSON.stringify({ fix: k2.fix, doors: k2.doors, hinge: k2.hinge, ws: p.runs[1].corner.wstawka }));
u = await uwagi();
ok('blok znika, zostaje podpowiedź o fixie', !/do ustawienia/.test(u) && /ma fix 618 mm/.test(u));

console.log('\nBLEDY:', errors.length ? errors.join('; ') : '(brak)');
await b.close();
