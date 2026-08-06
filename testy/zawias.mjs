import pw from '/opt/node22/lib/node_modules/playwright/index.js';
const b = await pw.chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const page = await (await b.newContext({ viewport: { width: 1500, height: 1100 } })).newPage();
const errors = []; page.on('pageerror', e => errors.push(e.message));
const ok = (l, c, e='') => console.log((c ? '  OK   ' : '  BLAD ') + l + (e ? ' — ' + e : ''));
await page.goto(process.env.STD ? 'http://127.0.0.1:5199/standalone-local.html' : 'http://127.0.0.1:5205/mebloprojekt-app.html', { waitUntil: 'networkidle' });
const seed = async (hinge) => {
  await page.evaluate((h) => {
    localStorage.clear();
    localStorage.setItem('szafki:projekt', JSON.stringify({ name: 'T', active: 0, prices: {}, runs: [],
      items: [{ cab: { name: 'A', W: 600, H: 720, D: 600, hinge: h,
        levels: [{ h: null, cols: [{ kind: 'doors', doors: 1, w: null }] }] }, mat: null, runId: null, offset: 0 }] }));
  }, hinge);
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(2200);
};
// uchwyt rysuje sie po stronie przeciwnej do zawiasow
const uchwyt = () => page.evaluate(() => {
  const r = [...document.querySelectorAll('svg rect')].filter(q => +q.getAttribute('width') < 30 && +q.getAttribute('height') > 60 && +q.getAttribute('height') < 200);
  return r.map(q => Math.round(+q.getAttribute('x')));
});
await seed('auto'); const a = await uchwyt();
await seed('left'); const l = await uchwyt();
await seed('right'); const p = await uchwyt();
console.log('   auto:', JSON.stringify(a), ' left:', JSON.stringify(l), ' right:', JSON.stringify(p));
ok('auto zachowuje się jak dotąd', JSON.stringify(a) === JSON.stringify(l), `${a} vs ${l}`);
ok('prawa strona przenosi uchwyt', p.length && l.length && p[0] !== l[0], `${l} vs ${p}`);
const sel = await page.evaluate(() => JSON.parse(localStorage.getItem('szafki:projekt')).items[0].cab.hinge);
ok('ustawienie zapisane', sel === 'right', String(sel));
console.log('BLEDY:', errors.length ? errors.join('; ') : '(brak)');
await b.close();
