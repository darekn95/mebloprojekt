/* Paski u gory przy przewijaniu (uzytkownik 2026-10-19):
   - przewijanie w dol zwija pasek pomieszczen oraz ciagow i szafek, zeby nie
     zaslanialy strony; na samej gorze strony wracaja,
   - recznie rozwiniety zostaje rozwiniety przez minute (przewijanie go nie
     zwija), potem przewijanie znow go zwija,
   - paski nie skacza (zwiniecie nie cofa strony na gore, co by je rozwijalo),
   - klikniecie nazwy sciany zmienia ja w miejscu (Enter, Esc, pusta = bez zmian;
     gorny ciag tej sciany razem z dolnym),
   - napisy „+ nowy ciąg” i „× usuń ciąg”. */
import pw from './pw.mjs';
const URL = process.env.STD ? 'http://127.0.0.1:5199/standalone-local.html'
  : 'http://127.0.0.1:5205/mebloprojekt-app.html';
const ok = (l, c, e = '') => console.log((c ? '  OK   ' : '  BLAD ') + l + (e ? ' — ' + e : ''));
const b = await pw.chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const errors = [];
const PL = { on: true, height: 100, mode: 'under', setback: 0 };
const RUN = (id, name, o = {}) => ({ id, name, wallW: null, gap: 0, mountY: 0, H: 720, D: 560, plinth: PL, worktop: true, corner: null, ...o });
const CAB = (name, runId) => ({ cab: { name, W: 600, H: 720, D: 560, plinth: PL, levels: [{ h: null, cols: [{ w: null, kind: 'doors', doors: 2 }] }] }, runId, offset: 0 });
const PROJ = { name: 'P', active: 0, prices: {}, runs: [RUN('c1', 'Ściana 1'), RUN('c2', 'Ściana 2', { corner: { of: 'c1', at: 'end', owner: 'self', clear: 0 } })],
  items: [CAB('A1', 'c1'), CAB('A2', 'c1'), CAB('B1', 'c2')] };
const ctx = await b.newContext({ viewport: { width: 1500, height: 900 } });
await ctx.addInitScript(() => { window.__mpBezZwijania = false; });   // pw.mjs wylacza je innym testom
const page = await ctx.newPage();
page.on('pageerror', (e) => errors.push(e.message));
await page.clock.install();
await page.goto(URL, { waitUntil: 'networkidle' });
await page.evaluate((q) => { localStorage.clear(); localStorage.setItem('szafki:projekt', JSON.stringify(q)); }, PROJ);
await page.reload({ waitUntil: 'networkidle' }); await page.waitForTimeout(1500);
const stan = () => page.evaluate(() => ({
  y: Math.round(scrollY),
  pokoje: !!document.querySelector('header button[title^="Nowe pomieszczenie"]'),
  ciagi: !!document.querySelector('[data-el="pasek-ciagow-lista"]'),
  wys: Math.round(document.querySelector('header[data-el="naglowek"]').getBoundingClientRect().height) }));
const kolko = async (dy, n = 3) => { for (let i = 0; i < n; i++) { await page.mouse.move(700, 600); await page.mouse.wheel(0, dy); await page.waitForTimeout(250); } await page.waitForTimeout(400); };

console.log('== przewijanie w dół zwija paski ==');
let s = await stan();
ok('na górze oba paski rozwinięte', s.pokoje && s.ciagi, JSON.stringify(s));
await kolko(300);
s = await stan();
ok('po przewinięciu w dół oba zwinięte', !s.pokoje && !s.ciagi && s.y > 0, JSON.stringify(s));
const proby = [];
for (let i = 0; i < 6; i++) { proby.push(await stan()); await page.waitForTimeout(200); }
ok('nie skaczą (stała wysokość i miejsce strony)', new Set(proby.map((x) => `${x.wys}|${x.y}|${x.pokoje}|${x.ciagi}`)).size === 1, JSON.stringify(proby.map((x) => [x.wys, x.y])));

console.log('\n== ręcznie rozwinięty zostaje minutę ==');
await page.locator('[data-el="pasek-ciagow"]').click(); await page.waitForTimeout(400);
s = await stan();
ok('kliknięcie rozwija ciągi (pomieszczenia zostają zwinięte)', s.ciagi && !s.pokoje, JSON.stringify(s));
await kolko(200, 2);
s = await stan();
ok('dalsze przewijanie go nie zwija', s.ciagi, JSON.stringify(s));
await page.clock.fastForward(61000);
await kolko(200, 2);
s = await stan();
ok('po minucie przewijanie znów zwija', !s.ciagi, JSON.stringify(s));
ok('zwinięcie nie było zapisane na stałe', await page.evaluate(() => localStorage.getItem('mp-pasek-zwiniety')) === null);

console.log('\n== na samej górze wracają ==');
await kolko(-2000, 4);
s = await stan();
ok('przewinięte do góry: oba rozwinięte', s.y === 0 && s.pokoje && s.ciagi, JSON.stringify(s));

console.log('\n== „Pokaż rysunek” ==');
await page.getByRole('button', { name: 'Pokaż rysunek' }).click(); await page.waitForTimeout(1500);
const r = await page.evaluate(() => ({ top: Math.round(document.getElementById('rysunek').getBoundingClientRect().top),
  pasek: Math.round(document.querySelector('header[data-el="naglowek"]').getBoundingClientRect().bottom),
  ciagi: !!document.querySelector('[data-el="pasek-ciagow-lista"]') }));
ok('paski zwinięte, karta „Rysunek” tuż pod paskiem', !r.ciagi && r.top >= r.pasek && r.top - r.pasek < 20, JSON.stringify(r));
await kolko(-3000, 4);

console.log('\n== nazwa ściany ==');
ok('napis „+ nowy ciąg”', await page.getByRole('button', { name: '+ nowy ciąg', exact: true }).count() === 1);
ok('napisy „× usuń ciąg” przy obu ciągach', await page.getByRole('button', { name: '× usuń ciąg', exact: true }).count() === 2);
const sciany = page.locator('[data-el="nazwa-sciany"]');
ok('nazwy ścian są przyciskami', await sciany.count() === 2, String(await sciany.count()));
await sciany.first().click(); await page.waitForTimeout(300);
const pole = page.locator('[data-el="nazwa-sciany-pole"]');
await pole.fill('Okno'); await pole.press('Enter');
// autozapis przychodzi z opoznieniem — czekamy na niego, a nie stala pauza
const zapisane = (id, n) => page.waitForFunction(([id, n]) => ((JSON.parse(localStorage.getItem('szafki:projekt')).runs || [])
  .find((x) => x.id === id) || {}).name === n, [id, n], { timeout: 5000 }).catch(() => {});
await zapisane('c1', 'Okno');
let zap = await page.evaluate(() => JSON.parse(localStorage.getItem('szafki:projekt')));
ok('Enter zapisuje: „Okno”', zap.runs.find((x) => x.id === 'c1').name === 'Okno' && (await sciany.first().textContent()) === 'Okno', await sciany.first().textContent());
await sciany.first().click(); await page.waitForTimeout(300);
await pole.fill('Zła nazwa'); await pole.press('Escape'); await page.waitForTimeout(600);
ok('Esc wraca do „Okno”', (await sciany.first().textContent()) === 'Okno', await sciany.first().textContent());
await sciany.first().click(); await page.waitForTimeout(300);
await pole.fill(''); await pole.press('Enter'); await page.waitForTimeout(600);
ok('pusta nazwa — zostaje „Okno”', (await sciany.first().textContent()) === 'Okno', await sciany.first().textContent());
// gorne pietro: nazwa sciany idzie za dolnym
await page.getByRole('button', { name: '+ ciąg górny', exact: true }).first().click(); await page.waitForTimeout(900);
const gorna = page.locator('[data-el="nazwa-sciany"]', { hasText: 'ciąg górny' }).first();
ok('ciąg górny podpisany „Okno — ciąg górny”', (await gorna.textContent()) === 'Okno — ciąg górny', await gorna.textContent());
await gorna.click(); await page.waitForTimeout(300);
await pole.fill('Okno duże'); await pole.press('Enter');
await zapisane('c1', 'Okno duże'); await page.waitForTimeout(300);
zap = await page.evaluate(() => JSON.parse(localStorage.getItem('szafki:projekt')));
const g = zap.runs.find((x) => x.tier === 'gorny');
ok('zmiana z wiersza górnego: dolny i górny „Okno duże”', zap.runs.find((x) => x.id === 'c1').name === 'Okno duże' && g && g.name === 'Okno duże',
  JSON.stringify(zap.runs.map((x) => [x.id, x.tier, x.name])));

console.log('\nBLEDY STRONY:', errors.join(' | ') || '(brak)');
await b.close();
