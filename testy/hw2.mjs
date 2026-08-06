import pw from '/opt/node22/lib/node_modules/playwright/index.js';
const { chromium } = pw;
const URL = 'http://127.0.0.1:5205/mebloprojekt-app.html';
const S = './';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const page = await (await browser.newContext({ viewport: { width: 1500, height: 1100 } })).newPage();
const errors = [];
page.on('pageerror', (e) => errors.push('[pageerror] ' + e.message));
page.on('console', (m) => { if (m.type() === 'error' && !/favicon|404/.test(m.text())) errors.push('[console] ' + m.text()); });
await page.goto(URL, { waitUntil: 'networkidle' });
await page.evaluate(() => { try { localStorage.clear(); } catch (e) {} });
await page.reload({ waitUntil: 'networkidle' });
await page.waitForTimeout(1500);
const ok = (l, c, e = '') => console.log((c ? '  OK   ' : '  BLAD ') + l + (e ? ' — ' + e : ''));
const card = (re) => page.locator('section').filter({ has: page.locator('h2', { hasText: re }) }).first();
const hwRows = async () => card(/^Produkty do zamówienia$/).evaluate((sec) =>
  [...sec.querySelectorAll('tbody tr')].map(tr => [...tr.querySelectorAll('td')].map(td => td.innerText.trim()).join(' | ')));
const clickView = async (v) => { await page.getByText(v, { exact: true }).first().click(); await page.waitForTimeout(700); };
const qty = (rows, name) => {
  const r = rows.find(x => x.startsWith(name));
  return r ? Number((r.split('|').pop() || '').trim().split(' ')[0]) : null;
};

console.log('== domyślna szafka 600×720×500, 2 drzwi, 1 półka (auto), bez nóżek/cokołu ==');
let rows = await hwRows();
rows.forEach(r => console.log('     ' + r));

// 1. konfirmaty: wieniec 2 + dno 2, glebokosc 500 -> 3 na styk = 12
ok('konfirmaty policzone', qty(rows, 'Konfirmat') === 12, String(qty(rows, 'Konfirmat')));
ok('zaślepki liczone w blistrach po 25', qty(rows, 'Zaślepka') === Math.ceil(qty(rows, 'Konfirmat') / 25),
  `${qty(rows, 'Konfirmat')} konfirmatów → ${qty(rows, 'Zaślepka')} op.`);
ok('opis zaślepek podaje sztuki', /\(\d+ szt\.\)/.test(rows.find(r => /^Zaślepka/.test(r)) || ''),
  rows.find(r => /^Zaślepka/.test(r)));
// 2. kolki: 1 polka x 4 (auto-dobor przy swietle min 250)
ok('kołki podporowe 1 półka × 4', qty(rows, 'Kołek podporowy') === 4, String(qty(rows, 'Kołek')));
// 3. zawieszki: brak nozek i cokolu -> szafka wiszaca
ok('zawieszki przy braku nóżek i cokołu', qty(rows, 'Zawieszka') === 2, String(qty(rows, 'Zawieszka')));
// pojedyncza szafka wisi domyslnie na haczykach — listwa dopiero w ciagu
ok('domyślnie haczyki, bez listwy', qty(rows, 'Hak') > 0 && qty(rows, 'Listwa') === null,
  `haki ${qty(rows, 'Hak')}, listwa ${qty(rows, 'Listwa')}`);
// 4. wkretow nie liczymy — ida w komplecie z zawiasem i prowadnica
ok('brak osobnej pozycji na wkręty', qty(rows, 'Wkręt') === null, String(qty(rows, 'Wkręt')));
// 5. plecy HDF przybijane
ok('zszywki do pleców', qty(rows, 'Zszywka') > 0, String(qty(rows, 'Zszywka')));

console.log('\n== włączam nóżki -> zawieszki mają zniknąć ==');
const nogi = card(/^Nóżki$/);
await nogi.locator('h2').click();
await page.waitForTimeout(300);
await nogi.getByText('Nóżki pod szafką', { exact: true }).click();
await page.waitForTimeout(800);
rows = await hwRows();
ok('zawieszki zniknęły po włączeniu nóżek', qty(rows, 'Zawieszka') === null);
ok('nóżki doszły', qty(rows, 'Nóżka') === 4);

console.log('\n== karta "Montaż półek i zawieszenie" ==');
const mont = card(/^Montaż półek i zawieszenie$/);
ok('karta istnieje', await mont.count() === 1);
await mont.locator('h2').click();
await page.waitForTimeout(400);
// przelacz na konfirmaty
await mont.getByText('Konfirmaty', { exact: true }).click();
await page.waitForTimeout(800);
rows = await hwRows();
ok('kołki znikają przy skręcanych półkach', qty(rows, 'Kołek') === null);
ok('konfirmatów przybyło (półka × 2 styki)', qty(rows, 'Konfirmat') > 12, String(qty(rows, 'Konfirmat')));
// z powrotem na kolki
await mont.getByText('Kołki podporowe', { exact: true }).click();
await page.waitForTimeout(800);
rows = await hwRows();
ok('powrót na kołki', qty(rows, 'Kołek') === 4 && qty(rows, 'Konfirmat') === 12,
  `kołki ${qty(rows, 'Kołek')}, konfirmaty ${qty(rows, 'Konfirmat')}`);
// zawieszki na "zawsze"
await mont.getByText('Zawsze', { exact: true }).click();
await page.waitForTimeout(800);
rows = await hwRows();
ok('zawieszki "zawsze" mimo nóżek', qty(rows, 'Zawieszka') === 2);
await mont.getByText('Nigdy', { exact: true }).click();
await page.waitForTimeout(800);
ok('zawieszki "nigdy"', qty(await hwRows(), 'Zawieszka') === null);
await mont.getByText('Auto', { exact: true }).click();
await page.waitForTimeout(600);

console.log('\n== kołki na rysunku otwartym ==');
await clickView('Otw.');
const pins = await page.evaluate(() => {
  const svg = document.querySelector('svg');
  const cs = [...svg.querySelectorAll('circle')].filter(c => Math.round(+c.getAttribute('r')) === 5);
  const txt = [...svg.querySelectorAll('text')].map(t => t.textContent.trim());
  return { n: cs.length, ys: [...new Set(cs.map(c => Math.round(+c.getAttribute('cy'))))].sort((a,b)=>a-b), txt };
});
ok('2 kółka (1 półka × 2 boki)', pins.n === 2, String(pins.n));
ok('kółka na 1 wysokości', pins.ys.length === 1, pins.ys.join(', '));

// wysokosci otworow: polki dziela swiatlo rowno; sprawdz ze podpisy sa liczbami rosnacymi
const shelfDims = await page.evaluate(() => {
  const svg = document.querySelector('svg');
  return [...svg.querySelectorAll('text')]
    .map(t => t.textContent.trim())
    .filter(t => /^otw\. \d+$/.test(t));
});
console.log('  podpisy wysokości otworów:', shelfDims.join(', '));
ok('podpisy wysokości otworów są', shelfDims.length === 1, shelfDims.join(', '));
const legenda = await page.evaluate(() => [...document.querySelector('svg').querySelectorAll('text')]
  .map(t => t.textContent.trim()).find(t => /^otw\. —/.test(t)) || null);
ok('legenda opisuje bazę wymiaru', !!legenda, legenda);

// wylacz okucia -> kolki znikaja
await page.getByText('Ukryj okucia', { exact: true }).first().click().catch(()=>{});
await page.waitForTimeout(600);
const pins2 = await page.evaluate(() => [...document.querySelector('svg').querySelectorAll('circle')].filter(c => Math.round(+c.getAttribute('r')) === 5).length);
ok('kółka chowają się razem z okuciami', pins2 === 0, String(pins2));

console.log('\nBLEDY:', errors.length ? errors.join('\n') : '(brak)');
await browser.close();
