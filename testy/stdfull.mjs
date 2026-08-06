import pw from '/opt/node22/lib/node_modules/playwright/index.js';
const { chromium } = pw;
const URL = 'http://127.0.0.1:5199/standalone-local.html';
const S = './';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const page = await (await browser.newContext({ viewport: { width: 1440, height: 1050 } })).newPage();
const errors = [];
page.on('pageerror', (e) => errors.push('[pageerror] ' + e.message));
page.on('console', (m) => { if (m.type() === 'error' && !/favicon|404/.test(m.text())) errors.push('[console] ' + m.text()); });
await page.goto(URL, { waitUntil: 'networkidle', timeout: 30000 });
await page.evaluate(() => { try { localStorage.clear(); } catch (e) {} });
await page.reload({ waitUntil: 'networkidle', timeout: 30000 });
await page.waitForTimeout(3000);

const ok = (label, cond, extra = '') => console.log((cond ? '  OK   ' : '  BLAD ') + label + (extra ? ' — ' + extra : ''));
const body = () => page.evaluate(() => document.body.innerText);
const clickView = async (v) => { await page.getByText(v, { exact: true }).first().click(); await page.waitForTimeout(700); };
const struct = page.locator('section').filter({ has: page.locator('h2', { hasText: /^Struktura wnętrza$/ }) }).first();
const svgTexts = () => page.evaluate(() => {
  const svg = document.querySelector('svg');
  return [...svg.querySelectorAll('text')].map(t => t.textContent.trim());
});
const rects = (fill) => page.evaluate((f) => {
  const svg = document.querySelector('svg');
  return [...svg.querySelectorAll('rect')].filter(r => r.getAttribute('fill') === f).length;
}, fill);

console.log('=== standalone.html (ścieżka GitHub Pages) ===');
let b = await body();
ok('strona się renderuje', b.includes('Korpus') && b.includes('Struktura wnętrza'));
ok('karty zwijane obecne', ['Luzy drzwi', 'Cokół', 'Nóżki', 'Blenda nad szafką', 'Płyty'].every(t => b.includes(t)));
ok('stara karta "Cokół i wzmocnienie" usunięta', !b.includes('Cokół i wzmocnienie'));
ok('pasek szafek', b.includes('Szafki:'));

// zwijanie
await page.locator('h2', { hasText: /^Cokół$/ }).first().click();
await page.waitForTimeout(400);
ok('rozwijanie karty Cokół', (await body()).includes('Cokół pod szafką'));
await page.locator('h2', { hasText: /^Cokół$/ }).first().click();
await page.waitForTimeout(400);
ok('zwijanie karty Cokół', !(await body()).includes('Cokół pod szafką'));

// zawiasy w widoku otwartym
await clickView('Otw.');
ok('zawiasy rysowane', await rects('#71717a') === 4, (await rects('#71717a')) + ' brył');
// luz góra/dół 3 mm => drzwi 714, wiec górny zawias wypada na 614 od dołu frontu
const hDist = (await svgTexts()).filter(t => t === '100' || t === '614');
ok('odległości zawiasów raz na kolumnę', hDist.length === 2, hDist.join(', '));

// przycisk okuc
const hwBtn = page.getByRole('button', { name: /Ukryj okucia|Pokaż okucia/ });
ok('przycisk okuć istnieje', await hwBtn.count() === 1);
await hwBtn.first().click(); await page.waitForTimeout(600);
ok('ukrywanie okuć', await rects('#71717a') === 0);
await hwBtn.first().click(); await page.waitForTimeout(600);

// szuflady: prowadnice, wysokosci montazu, tryb frontu
await struct.getByText('Szuflady', { exact: true }).first().click();
await page.waitForTimeout(800);
await page.getByText('+ szuflada', { exact: true }).first().click();
await page.waitForTimeout(600);
await clickView('Otw.');
ok('prowadnice rysowane', await rects('#8b8b93') > 0, (await rects('#8b8b93')) + ' szt.');
const rail = (await svgTexts()).filter(t => /^szyna /.test(t));
// dolna szyna ma zawsze siadać równo z dnem
ok('wysokości montażu prowadnic', rail.length > 0 && rail.includes('szyna 0'), rail.join(', '));
const clr = (await svgTexts()).filter(t => /szer\.$/.test(t));
ok('światło szuflady w widoku otwartym', clr.length > 0, clr[0]);

const dmSeg = struct.locator('div.flex.items-center.gap-2', { has: page.getByText('fronty', { exact: true }) });
ok('wybór montażu frontów szuflad', await dmSeg.count() === 1);
await dmSeg.getByText('Wewnątrz', { exact: true }).click();
await page.waitForTimeout(900);
const rail2 = (await svgTexts()).filter(t => /^szyna /.test(t));
ok('tryb "wewnątrz" przelicza montaż', rail2.includes('szyna 0') && rail2.join() !== rail.join(), rail2.join(', '));
await clickView('Z góry');
const topRail = await page.evaluate(() => {
  const svg = document.querySelector('svg');
  const r = [...svg.querySelectorAll('rect')].find(x => x.getAttribute('fill') === '#8b8b93');
  return r ? Math.round(+r.getAttribute('y')) + '..' + Math.round(+r.getAttribute('y') + +r.getAttribute('height')) : null;
});
ok('prowadnica cofnięta o grubość frontu', topRail === '32..482', String(topRail));

// --- nazwa projektu, zapis do pliku, zestawienie PDF ---
const projInp = page.locator('input[placeholder="Projekt bez nazwy"]').first();
ok('pole nazwy projektu', await projInp.count() === 1);
await projInp.fill('Kuchnia testowa');
await page.waitForTimeout(600);
ok('pole nazwy szafki obok', await page.locator('input[placeholder="Nazwa szafki"]').count() === 1);

const hb = (n) => page.getByRole('button', { name: n, exact: true });
ok('"Zapisz do pliku"', await hb('Zapisz do pliku').count() === 1);
ok('"Kopiuj projekt" usunięty', await hb('Kopiuj projekt').count() === 0);
ok('"Zestawienie PDF"', await hb('Zestawienie PDF').count() === 1);

await page.evaluate(() => {
  window.__snap = null;
  window.print = () => {
    const rep = document.querySelector('.print-only');
    if (rep) window.__snap = {
      pages: rep.querySelectorAll('.rp-page').length,
      svgs: rep.querySelectorAll('svg').length,
      tables: rep.querySelectorAll('table.rp-tbl').length,
      formatki: rep.innerText.includes('Formatki do zam'),
      produkty: rep.innerText.includes('Produkty do zam'),
      nazwa: rep.innerText.includes('Kuchnia testowa'),
    };
  };
});
await hb('Zestawienie PDF').click();
await page.waitForTimeout(1500);
const snap = await page.evaluate(() => window.__snap);
ok('zestawienie zbudowane', !!snap, snap ? snap.pages + ' stron, ' + snap.svgs + ' rysunków, ' + snap.tables + ' tabel' : 'brak');
if (snap) {
  ok('zestawienie: 2 strony na szafkę + rozkrój', snap.pages === 3, String(snap.pages));
  ok('zestawienie: 4 widoki + arkusze rozkroju', snap.svgs >= 5, String(snap.svgs));
  ok('zestawienie: formatki i produkty', snap.formatki && snap.produkty);
  ok('zestawienie: nazwa projektu w nagłówku', snap.nazwa);
}
ok('zestawienie znika po druku', await page.locator('.print-only').count() === 0);

// wszystkie widoki bez bledow
for (const v of ['Zamk.', 'Otw.', 'Z boku', 'Z góry', 'Z tyłu', '3D']) {
  const before = errors.length;
  await clickView(v);
  ok('widok ' + v, errors.length === before);
}

// odmiana liczebnikow + przycisk skrocenia szuflady
const korpus = page.locator('section').filter({ has: page.locator('h2', { hasText: /^Korpus$/ }) }).first();
const nlSel = struct.locator('div.flex.items-center.gap-2', { has: page.getByText('głębokość NL', { exact: true }) }).locator('select').first();
await nlSel.selectOption('400'); await page.waitForTimeout(700);
const dInp = korpus.locator('input[type=number]').nth(2);
await dInp.fill('410'); await dInp.blur(); await page.waitForTimeout(900);
const badge = await page.evaluate(() => [...document.querySelectorAll('button')].map(b => b.textContent.trim()).find(t => /^\d+ (błąd|błęd)/.test(t)));
ok('odmiana liczebników', /błędy|błędów|^1 błąd$/.test(badge || ''), badge);
const fixBtn = page.getByRole('button', { name: /Zmień głębokość prowadnic do NL/ });
ok('przycisk skrócenia szuflady', await fixBtn.count() > 0, (await fixBtn.count()) + ' szt.');

// zapis do localStorage
await page.waitForTimeout(1200);
const saved = await page.evaluate(() => !!localStorage.getItem('szafki:projekt'));
ok('projekt zapisany w localStorage', saved);
await page.reload({ waitUntil: 'networkidle', timeout: 30000 });
await page.waitForTimeout(3000);
ok('projekt przetrwał przeładowanie', (await body()).includes('Struktura wnętrza'));

try { await page.screenshot({ path: S + 'shot-std.png' }); } catch (e) {}
console.log('\nBLEDY KONSOLI:', errors.length ? errors.join('\n') : '(brak)');
await browser.close();
