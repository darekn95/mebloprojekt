/* Dwoje waskich drzwi tam, gdzie zmiesci sie jedno skrzydlo: informacja
   z dwoma przyciskami (zawiasy z lewej / z prawej). Szafka 600 z dwojgiem
   drzwi po 298 i szafka narozna nie dostaja tej podpowiedzi. */
import pw from './pw.mjs';
const b = await pw.chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const page = await (await b.newContext({ viewport: { width: 1500, height: 1100 } })).newPage();
const errors = []; page.on('pageerror', e => errors.push(e.message));
const ok = (l, c, e = '') => console.log((c ? '  OK   ' : '  BLAD ') + l + (e ? ' — ' + e : ''));
const card = (re) => page.locator('section').filter({ has: page.locator('h2', { hasText: re }) }).first();
await page.goto(process.env.STD ? 'http://127.0.0.1:5199/standalone-local.html' : 'http://127.0.0.1:5205/mebloprojekt-app.html', { waitUntil: 'networkidle' });
const seed = async (W, doors = 2) => {
  await page.evaluate(([W, doors]) => {
    localStorage.clear();
    localStorage.setItem('szafki:projekt', JSON.stringify({ name: 'T', active: 0, prices: {}, runs: [],
      items: [{ cab: { name: 'wąska', W, H: 720, D: 560,
        levels: [{ h: null, cols: [{ kind: 'doors', doors, w: null }] }] }, mat: null, runId: null, offset: 0 }] }));
  }, [W, doors]);
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
};
const uwagi = async () => (await card(/Uwagi/).count() ? await card(/Uwagi/).innerText() : '');
const zapis = () => page.evaluate(() => JSON.parse(localStorage.getItem('szafki:projekt')).items[0].cab.levels[0].cols[0]);

await seed(300);
let uw = await uwagi();
console.log('   ' + uw.replace(/\n+/g, ' / ').slice(0, 260));
ok('300 z dwojgiem drzwi: podpowiedź o wąskich drzwiach', /dwoje wąskich drzwi po 147 mm/.test(uw) && /Jedne drzwi miałyby 296 mm/.test(uw), uw.slice(0, 200));
const przyL = card(/Uwagi/).getByRole('button', { name: /Jedne drzwi 296 mm — zawiasy z lewej/ });
const przyP = card(/Uwagi/).getByRole('button', { name: /Jedne drzwi 296 mm — zawiasy z prawej/ });
ok('dwa przyciski: zawiasy z lewej i z prawej', await przyL.count() === 1 && await przyP.count() === 1);
await przyP.click();
await page.waitForTimeout(1000);
let c = await zapis();
ok('po kliknięciu jedne drzwi z zawiasami z prawej', c.doors === 1 && c.hinge === 'right', JSON.stringify(c));
uw = await uwagi();
ok('podpowiedź znika', !/wąskich drzwi/.test(uw), uw.slice(0, 160));

await seed(300);
await card(/Uwagi/).getByRole('button', { name: /zawiasy z lewej/ }).click();
await page.waitForTimeout(1000);
c = await zapis();
ok('przycisk „z lewej” ustawia zawiasy z lewej', c.doors === 1 && c.hinge === 'left', JSON.stringify(c));

await seed(500);
ok('500 (2 × 247): też podpowiedź', /dwoje wąskich drzwi/.test(await uwagi()));
await seed(600);
ok('600 (2 × 297): bez podpowiedzi — skrzydła nie są wąskie', !/wąskich drzwi/.test(await uwagi()));
await seed(300, 1);
ok('300 z jednymi drzwiami: bez podpowiedzi', !/wąskich drzwi/.test(await uwagi()));
console.log('BLEDY:', errors.length ? errors.join('; ') : '(brak)');
await b.close();
