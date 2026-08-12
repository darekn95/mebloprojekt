/* Blat roboczy calego ciagu: wlacza sie sam przy nowym ciagu, zdejmuje szafkom
   wieniec i daje im pare wzmocnien, a slupek zostawia obok siebie. */
import pw from '/opt/node22/lib/node_modules/playwright/index.js';
const { chromium } = pw;
const URL = process.env.STD ? 'http://127.0.0.1:5199/standalone-local.html'
  : 'http://127.0.0.1:5205/mebloprojekt-app.html';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const page = await (await browser.newContext({ viewport: { width: 1500, height: 1200 } })).newPage();
const errors = [];
page.on('pageerror', (e) => errors.push('[pageerror] ' + e.message));
const ok = (l, c, e = '') => console.log((c ? '  OK   ' : '  BLAD ') + l + (e ? ' — ' + e : ''));
const card = (re) => page.locator('section').filter({ has: page.locator('h2', { hasText: re }) }).first();
const stan = () => page.evaluate(() => JSON.parse(localStorage.getItem('szafki:projekt') || '{}'));
const uwagi = async () => (await card(/^Uwagi$/).count() ? await card(/^Uwagi$/).innerText() : '')
  .replace(/\s+/g, ' ');
const wiersze = () => card(/^Formatki całego projektu/).evaluate((sec) =>
  [...sec.querySelectorAll('tbody tr')].map((tr) =>
    [...tr.querySelectorAll('td')].map((td) => td.innerText.trim()).join(' | ')));
await page.goto(URL, { waitUntil: 'networkidle' });

const RUN = (id, name, extra = {}) => ({ id, name, wallW: null, gap: 0, H: null, D: null,
  plinth: null, plinthCuts: null, topCuts: null, worktop: true, hangerMode: 'listwa',
  mountY: 0, corner: null, ...extra });
const PL = { on: true, height: 100, mode: 'under', setback: 0 };
const CAB = (name, H, runId, extra = {}) => ({ runId, offset: 0, cab: Object.assign({
  name, W: 600, H, D: 500, plinth: PL,
  levels: [{ h: null, cols: [{ kind: 'doors', doors: 2, w: null }] }],
}, extra) });
const seed = async (runs, items) => {
  await page.evaluate((d) => { localStorage.clear(); localStorage.setItem('szafki:projekt', JSON.stringify(d)); },
    { name: 'T', active: items.length - 1, prices: {}, runs, items });
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(2200);
};

console.log('== nowy ciąg dostaje blat, a szafka w nim traci wieniec ==');
await page.evaluate(() => { try { localStorage.clear(); } catch (e) {} });
await page.reload({ waitUntil: 'networkidle' });
await page.waitForTimeout(1600);
await page.getByRole('button', { name: '+ ciąg' }).click();
await page.waitForTimeout(700);
await page.locator('header .space-y-1 > div').filter({ hasText: 'Ściana 1' })
  .getByRole('button', { name: '+ szafka' }).click();
await page.waitForTimeout(1200);
let p = await stan();
const run0 = (p.runs || [])[0] || {};
const wCiagu = p.items.find((it) => it.runId === run0.id) || { cab: {} };
console.log('     ciąg:', JSON.stringify({ worktop: run0.worktop }),
  ' szafka:', JSON.stringify({ joints: wCiagu.cab.joints }));
ok('nowy ciąg ma blat roboczy', run0.worktop === true, String(run0.worktop));
ok('szafka pod blatem nie ma wieńca',
  (wCiagu.cab.joints || {}).topL === 'none' && (wCiagu.cab.joints || {}).topR === 'none',
  JSON.stringify(wCiagu.cab.joints));
const szyny = ((((wCiagu.cab.levels || [])[0] || {}).cols || [])[0] || {}).rails || [];
console.log('     wzmocnienia:', JSON.stringify(szyny.map((r) => ({ o: r.orient, tyl: r.fromBack }))));
ok('doszła para wzmocnień', szyny.length === 2, String(szyny.length));
ok('z przodu leżąca, z tyłu stojąca',
  szyny[0] && szyny[0].orient === 'shelf' && !szyny[0].fromBack
  && szyny[1] && szyny[1].orient === 'front' && szyny[1].fromBack === true,
  JSON.stringify(szyny));

console.log('\n== blat wchodzi do formatek na własnym materiale ==');
let rs = await wiersze();
const blat = rs.find((r) => /^Blat ciągu/.test(r));
console.log('     ' + (blat || '(brak)'));
ok('blat ciągu w zestawieniu', !!blat, String(rs.length));
/* Glebokosc blatu to wymiar rzeczywisty: korpus 500 + grubosc frontu 18
   + 10 mm wysiegu przed lico. */
ok('głębokość blatu 528 mm', !!blat && / 528 /.test(blat.replace(/\|/g, ' ')), blat || '');

console.log('\n== słupek: blat kończy się przy nim, bez błędu ==');
await seed([RUN('c1', 'Ściana 1')], [CAB('A', 720, 'c1'), CAB('Słupek', 2000, 'c1')]);
let uw = await uwagi();
console.log('     ' + uw.slice(0, 260));
ok('słupek opisany jako zamierzony', /Słupek.*wyższa od reszty ciągu|blat kończy się przy jej boku/.test(uw),
  uw.slice(0, 200));
ok('słupek nie jest błędem', !/odstaje od ciągu/.test(uw), uw.slice(0, 200));

console.log('\n== rozjazd wysokości o 10 mm to ostrzeżenie ==');
await seed([RUN('c1', 'Ściana 1')], [CAB('A', 720, 'c1'), CAB('B', 730, 'c1')]);
uw = await uwagi();
console.log('     ' + uw.slice(0, 260));
ok('ostrzeżenie o rozjeździe', /odstaje od ciągu o 10 mm/.test(uw), uw.slice(0, 200));

console.log('\n== wieniec w ciągu z blatem: ostrzeżenie i przycisk zamiany ==');
await seed([RUN('c1', 'Ściana 1')],
  [CAB('A', 720, 'c1', { joints: { topL: 'between', topR: 'between', botL: 'between', botR: 'between' } })]);
uw = await uwagi();
console.log('     ' + uw.slice(0, 240));
ok('ostrzeżenie o wieńcu pod blatem', /ma wieniec/.test(uw), uw.slice(0, 200));
const btn = card(/^Uwagi$/).getByRole('button', { name: /Dołóż parę wzmocnień/ });
ok('jest przycisk zamiany', await btn.count() > 0, String(await btn.count()));
await btn.first().click();
await page.waitForTimeout(1200);
p = await stan();
const po = p.items[0].cab;
console.log('     po zamianie:', JSON.stringify({ joints: po.joints,
  rails: (po.levels[0].cols[0].rails || []).map((r) => r.orient) }));
ok('wieniec zdjęty', (po.joints || {}).topL === 'none' && (po.joints || {}).topR === 'none',
  JSON.stringify(po.joints));
ok('wzmocnienia dołożone', (po.levels[0].cols[0].rails || []).length === 2,
  String((po.levels[0].cols[0].rails || []).length));

console.log('\nBLEDY:', errors.length ? errors.join('; ') : '(brak)');
await browser.close();
