/* Ciag z boku (uzytkownik 2026-10-24: „nie ma rzutu ciąg z boku”): przekroj
   sciany — profile szafek od sciany, fronty, nozki / cokol, blat roboczy, ciag
   gorny; wymiary glebokosci (z frontem, blat) i wysokosci. Zabudowa (z rogami)
   bez tego widoku. */
import pw from './pw.mjs';
const URL = process.env.STD ? 'http://127.0.0.1:5199/standalone-local.html'
  : 'http://127.0.0.1:5205/mebloprojekt-app.html';
const ok = (l, c, e = '') => console.log((c ? '  OK   ' : '  BLAD ') + l + (e ? ' — ' + e : ''));
const b = await pw.chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const page = await (await b.newContext({ viewport: { width: 1500, height: 1300 } })).newPage();
const errors = []; page.on('pageerror', (e) => errors.push(e.message));
await page.goto(URL, { waitUntil: 'networkidle' });

const NOGI = { on: true, height: 100 };
const BEZ = { on: false, height: 100, mode: 'under', setback: 0 };
const cab = (name, W, H, D, o = {}) => ({ name, W, H, D, plinth: BEZ, legs: NOGI,
  levels: [{ h: null, cols: [{ kind: 'doors', doors: 1, w: null }] }], ...o });
const seed = async (q) => {
  await page.evaluate((p) => { localStorage.clear(); localStorage.setItem('szafki:projekt', JSON.stringify(p)); }, q);
  await page.reload({ waitUntil: 'networkidle' }); await page.waitForTimeout(1200);
};
const pick = async (l) => { await page.getByRole('button', { name: l, exact: true }).first().click(); await page.waitForTimeout(400); };
const svg = () => page.locator('#rysunek svg[data-el="ciag-z-boku"]');

console.log('== kuchnia: dolny z blatem, górny ==');
{
  await seed({ name: 'K', active: 0, prices: {},
    runs: [{ id: 'c1', name: 'Ściana 1', mountY: 0, H: 720, D: 560, gap: 0, worktop: true, plinth: BEZ },
      { id: 'g1', name: 'Ściana 1', tier: 'gorny', wall: 'c1', mountY: 1450, H: 720, D: 320, gap: 0 }],
    items: [{ cab: cab('D1', 600, 720, 560), runId: 'c1', offset: 0 }, { cab: cab('D2', 600, 720, 560), runId: 'c1', offset: 0 },
      { cab: cab('G1', 600, 720, 320, { legs: { on: false, height: 100 } }), runId: 'g1', offset: 0 }] });
  await pick('Ciąg');
  ok('przy ciągu jest „Z boku”', (await page.getByRole('button', { name: 'Z boku', exact: true }).count()) === 1);
  await pick('Z boku');
  ok('rysunek ciągu z boku', (await svg().count()) === 1);
  ok('profil dolnych szafek (D1, D2 razem) i górnej', (await svg().locator('[data-el="profil-szafki"]').count()) === 2
    && (await svg().locator('[data-el="profil-szafki"]').evaluateAll((g) => g.map((x) => x.getAttribute('data-nazwy')))).includes('D1, D2'),
    JSON.stringify(await svg().locator('[data-el="profil-szafki"]').evaluateAll((g) => g.map((x) => x.getAttribute('data-nazwy')))));
  ok('blat roboczy i ściana', (await svg().locator('[data-el="blat"]').count()) === 1 && (await svg().locator('[data-el="sciana"]').count()) === 1);
  const t = (await svg().locator('[data-el="wymiary-ciagu-z-boku"] text').allTextContents()).join(' | ');
  ok('wymiary: „dolny: z frontem …”, „górny: z frontem …”, „blat 600 (… przed frontem)”', /dolny: z frontem \d+/.test(t) && /górny: z frontem \d+/.test(t) && /blat 600 \(\d+ przed frontem\)/.test(t), t);
  ok('wysokości: nóżki 100, korpus 720, blat 38, do górnego ciągu', /\b100\b/.test(t) && /\b720\b/.test(t) && /\b38\b/.test(t), t);
  await page.getByRole('button', { name: 'Ukryj blat' }).first().click(); await page.waitForTimeout(300);
  ok('„Ukryj blat” chowa blat', (await svg().locator('[data-el="blat"]').count()) === 0);
  await page.getByRole('button', { name: 'Ukryj ścianę' }).first().click(); await page.waitForTimeout(300);
  ok('„Ukryj ścianę” chowa ścianę', (await svg().locator('[data-el="sciana"]').count()) === 0);
}

console.log('\n== zabudowa: bez „Z boku” ==');
{
  const zab = page.getByRole('button', { name: 'Zabudowa', exact: true });
  if (await zab.count()) {
    await zab.first().click(); await page.waitForTimeout(400);
    ok('zakres „Zabudowa”: brak „Z boku”', (await page.getByRole('button', { name: 'Z boku', exact: true }).count()) === 0);
  } else ok('zakres „Zabudowa” niedostępny przy jednej ścianie', true);
}

ok('bez błędów strony', !errors.length, errors.join(' / '));
await b.close();
