import pw from '/opt/node22/lib/node_modules/playwright/index.js';
const b = await pw.chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const page = await (await b.newContext({ viewport: { width: 1500, height: 1100 } })).newPage();
const errors = []; page.on('pageerror', e => errors.push(e.message));
const ok = (l, c, e='') => console.log((c ? '  OK   ' : '  BLAD ') + l + (e ? ' — ' + e : ''));
const card = (re) => page.locator('section').filter({ has: page.locator('h2', { hasText: re }) }).first();
await page.goto(process.env.STD ? 'http://127.0.0.1:5199/standalone-local.html' : 'http://127.0.0.1:5205/mebloprojekt-app.html', { waitUntil: 'networkidle' });
// kolumna z drzwiami + przelot bez przegrody po prawej: zawias z prawej wisi w powietrzu
const seed = async (hinge) => {
  await page.evaluate((h) => {
    localStorage.clear();
    localStorage.setItem('szafki:projekt', JSON.stringify({ name: 'T', active: 0, prices: {}, runs: [],
      items: [{ cab: { name: 'rogowa', W: 900, H: 720, D: 600, hinge: h,
        levels: [{ h: null, cols: [
          { kind: 'doors', doors: 1, w: null, noDiv: true },
          { kind: 'doors', doors: 0, w: 600 }] }] }, mat: null, runId: null, offset: 0 }] }));
  }, hinge);
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(2200);
};
await seed('right');
let uw = await card(/Uwagi/).innerText();
console.log('   ' + uw.replace(/\n+/g, ' / ').slice(0, 220));
ok('błąd przy zawiasie od przelotu', /zawiasy wypadają od strony przelotu/.test(uw), uw.slice(0,160));
ok('podpowiada, na którą stronę', /Przełóż je na lewą stronę/.test(uw), uw.slice(0,220));
await card(/Uwagi/).getByRole('button', { name: /Przełóż zawiasy na lewą/ }).click();
await page.waitForTimeout(1000);
// bez zadnej uwagi karta w ogole sie nie rysuje
uw = await card(/Uwagi/).count() ? await card(/Uwagi/).innerText() : '';
ok('po naprawie błąd znika', !/zawiasy wypadają/.test(uw), uw.slice(0,160));
const zap = await page.evaluate(() => JSON.parse(localStorage.getItem('szafki:projekt')).items[0].cab.levels[0].cols[0].hinge);
ok('zawias przełożony w kolumnie', zap === 'left', String(zap));
await seed('left');
uw = await card(/Uwagi/).count() ? await card(/Uwagi/).innerText() : '';
ok('zawias od boku szafki jest w porządku', !/zawiasy wypadają/.test(uw), uw.slice(0,160));
console.log('BLEDY:', errors.length ? errors.join('; ') : '(brak)');
await b.close();
