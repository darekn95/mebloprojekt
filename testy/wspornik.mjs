/* Wspornik pionowy fixu a polka (ustalone z uzytkownikiem 2026-09-28): nikt
   nie wycina w polce „U” na wspornik, wiec polka jest plytsza — na cala
   szerokosc, zaczyna sie za wspornikiem, na zwyklych kolkach w bokach. Ostrzezenie z przyciskiem: zawiasy na
   druga strone i wspornik usuniety (albo sam wspornik, gdy zawiasy juz sa po
   drugiej stronie); bez wspornika polka wraca na pelna szerokosc. */
import pw from './pw.mjs';
const URL = process.env.STD ? 'http://127.0.0.1:5199/standalone-local.html'
  : 'http://127.0.0.1:5205/mebloprojekt-app.html';
const ok = (l, c, e = '') => console.log((c ? '  OK   ' : '  BLAD ') + l + (e ? ' — ' + e : ''));
const b = await pw.chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const page = await (await b.newContext({ viewport: { width: 1500, height: 1300 } })).newPage();
const errors = []; page.on('pageerror', (e) => errors.push(e.message));
await page.goto(URL, { waitUntil: 'networkidle' });

const PL = { on: true, height: 100, mode: 'under', setback: 0 };
const seed = async (hinge) => {
  await page.evaluate((q) => { localStorage.clear(); localStorage.setItem('szafki:projekt', JSON.stringify(q)); }, {
    name: 'W', active: 0, prices: {}, runs: [], items: [{ cab: { name: 'W', W: 600, H: 720, D: 560, plinth: PL, legs: { on: true, height: 100 },
      levels: [{ h: null, cols: [{ kind: 'doors', doors: 1, w: null, shelfTargets: [null, null], hinge,
        fix: { side: 'left', w: 100, mode: 'overlay', support: true, supportDepth: 100 } }] }] }, offset: 0 }] });
  await page.reload({ waitUntil: 'networkidle' }); await page.waitForTimeout(800);
};
const card = (re) => page.locator('section').filter({ has: page.locator('h2', { hasText: re }) }).first();
const uwagi = async () => (await card(/^Uwagi/).count() ? await card(/^Uwagi/).innerText() : '');
const polki = () => page.evaluate(() => {
  const sec = [...document.querySelectorAll('section')].find((s) => /^Formatki do zamówienia/.test((s.querySelector('h2') || {}).textContent || ''));
  return [...sec.querySelectorAll('tbody tr')].map((tr) => [...tr.children].map((x) => x.textContent.trim()))
    .filter((r) => r[0] === 'Półka').map((r) => `${r[2]}×${r[3]}`);
});
const kol = () => page.evaluate(() => JSON.parse(localStorage.getItem('szafki:projekt')).items[0].cab.levels[0].cols[0]);

console.log('== zawias przy fixie: półka krótsza, przycisk przekłada zawiasy ==');
await seed('left');
// wspornik 100 mm od frontu — polka 564 na szerokosc, 560 - 100 = 460 w glab
ok('formatka półki 564 × 460 (płytsza, za wspornikiem)', (await polki()).includes('564×460'), (await polki()).join(', '));
let u = await uwagi();
ok('ostrzeżenie: półka płytsza, za wspornikiem', /półka jest płytsza — zaczyna się za wspornikiem pionowym fixu \(460 zamiast 560 mm głębokości\)/.test(u), u.slice(0, 200));
// plan wiercen jest w arkuszu PDF — kolek polki od strony fixu we wsporniku, nie w boku lewym
await page.evaluate(() => { window.__rep = ''; window.print = () => { const r = document.querySelector('.print-only');
  window.__rep = r ? [...r.querySelectorAll('tr')].map((tr) => tr.innerText.replace(/\s+/g, ' ')).join('\n') : ''; }; });
await page.getByRole('button', { name: 'Zestawienie PDF', exact: true }).first().click(); await page.waitForTimeout(1200);
const rep = await page.evaluate(() => window.__rep);
ok('plan wierceń: kołki półki w obu bokach (nie we wsporniku)',
  /Bok lewy.*kołek półki/.test(rep) && /Bok prawy.*kołek półki/.test(rep) && !/Wspornik pionowy.*kołek półki/.test(rep), rep.split('\n').filter((l) => /kołek/.test(l)).join(' / '));
const btn = card(/^Uwagi/).getByRole('button', { name: 'Przełóż zawiasy na drugą stronę i usuń wspornik' });
ok('przycisk „Przełóż zawiasy na drugą stronę i usuń wspornik”', await btn.count() === 1);
await btn.click(); await page.waitForTimeout(1500);
let c = await kol();
ok('po kliknięciu: zawias z prawej, bez wspornika', c.hinge === 'right' && c.fix.support === false, JSON.stringify({ h: c.hinge, s: c.fix.support }));
ok('półka wraca na pełną głębokość (560)', (await polki()).includes('564×560'), (await polki()).join(', '));
ok('ostrzeżenie znika', !/półka jest płytsza/.test(await uwagi()));


console.log('\n== zawias już po drugiej stronie: sam „Usuń wspornik” ==');
await seed('right');
ok('przycisk „Usuń wspornik”', await card(/^Uwagi/).getByRole('button', { name: 'Usuń wspornik', exact: true }).count() === 1);
ok('podpowiedź: wspornik niepotrzebny', /wspornik nie jest potrzebny/.test(await uwagi()));

console.log('\nBLEDY:', errors.length ? errors.join('; ') : '(brak)');
await b.close();
