import pw from '/opt/node22/lib/node_modules/playwright/index.js';
const { chromium } = pw;
const S = './';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const page = await (await browser.newContext({ viewport: { width: 1500, height: 1200 } })).newPage();
const errors = [];
page.on('pageerror', (e) => errors.push('[pageerror] ' + e.message));
page.on('console', (m) => { if (m.type() === 'error' && !/favicon|404/.test(m.text())) errors.push('[console] ' + m.text()); });
const ok = (l, c, e = '') => console.log((c ? '  OK   ' : '  BLAD ') + l + (e ? ' — ' + e : ''));
await page.goto('http://127.0.0.1:5199/standalone-local.html', { waitUntil: 'networkidle' });
await page.evaluate(() => { try { localStorage.clear(); } catch (e) {} });
await page.reload({ waitUntil: 'networkidle' });
await page.waitForTimeout(1500);
const card = (re) => page.locator('section').filter({ has: page.locator('h2', { hasText: re }) }).first();

console.log('== 1. kolor zabudowy = kolor płyty półek ==');
// bryla przy prawym boku z zabudowa, plyta biala
await page.evaluate(() => {
  localStorage.clear();
  const col = { w: null, kind: 'doors', doors: 2, shelfTargets: [null],
    nl: null, drawers: [], doorWidths: [], mirrors: [], handles: [], hinges: [], rails: [],
    backMode: 'inherit', fix: { side: 'none', w: 60, mode: 'overlay', support: false, supportDepth: 100 },
    blendaMode: 'overlay', drawerMode: 'inherit', hinge: 'auto' };
  const cab = { name: 'T', W: 600, H: 720, D: 500,
    obstacles: [{ on: true, w: 80, d: 80, h: 0, side: 'right', fromSide: 0, fromBack: 0, fromBottom: 0,
      fullHeight: true, mask: true, maskType: 'auto', maskFront: 'over' }],
    levels: [{ h: null, cols: [col] }] };
  const mat = { board: { name: 'Płyta', thickness: 18, color: '#e8e6e1' },
    front: { name: 'Płyta', thickness: 18, color: '#e8e6e1' },
    shelf: { name: 'Płyta', thickness: 18, color: '#d0bb96' },
    back: { name: 'HDF', thickness: 3, color: '#9c7b56' },
    mirror: { name: 'Lustro', thickness: 4, color: '#c3d0d6' } };
  localStorage.setItem('szafki:projekt', JSON.stringify({ name: 'T', active: 0, prices: {}, items: [{ cab, mat }] }));
});
await page.reload({ waitUntil: 'networkidle' });
await page.waitForTimeout(2500);
await page.getByText('Z góry', { exact: true }).first().click();
await page.waitForTimeout(900);
const fills = await page.evaluate(() => {
  const rs = [...document.querySelector('svg').querySelectorAll('rect')];
  const by = {};
  rs.forEach(r => { const f = r.getAttribute('fill'); if (/^#/.test(f)) by[f] = (by[f] || 0) + 1; });
  return by;
});
console.log('  wypełnienia:', JSON.stringify(fills));
ok('zabudowa w kolorze korpusu (brak beżu półek przy shelfSameAsBoard)', !fills['#d0bb96'], JSON.stringify(fills));
await page.locator('svg').first().screenshot({ path: S + 'shot-zabudowa.png' });

console.log('\n== 2. etykieta płyty ==');
const cut = card(/^Formatki do zamówienia$/);
const labels = await cut.evaluate((s) => [...new Set([...s.querySelectorAll('tbody tr')].map(tr => tr.querySelectorAll('td')[1].innerText.trim()))]);
console.log('  materiały:', labels.join(' | '));
ok('brak "laminowana 18" w nazwie', !labels.some(l => /laminowana|18/.test(l)), labels.join(' | '));
ok('płyta z nazwą koloru', labels.some(l => l === 'Płyta Biały mat'), labels.join(' | '));
ok('HDF bez koloru i grubości', labels.includes('HDF'), labels.join(' | '));

console.log('\n== 3. paleta bez czystej bieli ==');
const plyty = card(/^Płyty$/);
await plyty.locator('h2').click();
await page.waitForTimeout(400);
ok('"Biały" usunięty z palety', await plyty.locator('button[title="Biały"]').count() === 0);
ok('"Biały mat" został', await plyty.locator('button[title="Biały mat"]').count() > 0);

console.log('\n== 4. HDF bez oklejania ==');
const hdfRow = await cut.evaluate((s) => {
  const tr = [...s.querySelectorAll('tbody tr')].find(t => /HDF/.test(t.querySelectorAll('td')[1].innerText));
  return tr ? { txt: tr.innerText.replace(/\s+/g, ' '), btns: tr.querySelectorAll('button').length } : null;
});
console.log('  wiersz HDF:', JSON.stringify(hdfRow));
ok('brak przycisków oklejania przy HDF', hdfRow && hdfRow.btns === 0, JSON.stringify(hdfRow));
ok('komunikat "HDF się nie okleja"', hdfRow && /nie okleja/.test(hdfRow.txt), hdfRow && hdfRow.txt);

console.log('\n== 5. nóżki: kolor i kształt ==');
const nogi = card(/^Nóżki$/);
await nogi.locator('h2').click();
await page.waitForTimeout(300);
await nogi.getByText('Nóżki pod szafką', { exact: true }).click();
await page.waitForTimeout(800);
ok('wybór kształtu', await nogi.getByText('Okrągła', { exact: true }).count() === 1);
ok('wzornik kolorów', await nogi.locator('button[title="Aluminium"]').count() === 1);
const legFills = async () => page.evaluate(() =>
  [...document.querySelector('svg').querySelectorAll('rect')]
    .filter(e => e.getAttribute('fill') === '#a1a1aa').length);
const topLegs = async () => page.evaluate(() => {
  const svg = document.querySelector('svg');
  return { circles: svg.querySelectorAll('circle').length,
    legs: [...svg.querySelectorAll('rect')].filter(r => Math.round(+r.getAttribute('width')) === 40
      && Math.round(+r.getAttribute('height')) === 40).length };
});
await page.getByText('Z góry', { exact: true }).first().click();
await page.waitForTimeout(800);
const tv = await topLegs();
console.log('  widok z góry:', JSON.stringify(tv));
ok('nóżek nie ma w widoku z góry', tv.circles === 0 && tv.legs === 0, JSON.stringify(tv));
await nogi.getByText('Okrągła', { exact: true }).click();
await page.waitForTimeout(900);
const tv2 = await topLegs();
ok('okrągłe też nie wchodzą do rzutu z góry', tv2.circles === 0 && tv2.legs === 0, JSON.stringify(tv2));
// kolor i ksztalt widac za to od czola
await nogi.locator('button[title="Aluminium"]').click();
await page.waitForTimeout(900);
await page.getByText('Zamk.', { exact: true }).first().click();
await page.waitForTimeout(800);
ok('kolor nóżek widać od czoła', await legFills() === 2, String(await legFills()));
const rx = await page.evaluate(() => [...document.querySelector('svg').querySelectorAll('rect')]
  .filter(r => r.getAttribute('fill') === '#a1a1aa').map(r => r.getAttribute('rx')));
ok('okrągła nóżka rysowana z zaokrągleniem', rx.every(v => Number(v) > 0), rx.join(', '));
await page.locator('svg').first().screenshot({ path: S + 'shot-nozki.png' });
const hw = await card(/^Produkty do zamówienia$/).innerText();
ok('kształt w specyfikacji nóżki', /okrągła, wysokość/.test(hw), (hw.split('\n').find(l => /Nóżka/.test(l)) || ''));

console.log('\nBLEDY:', errors.length ? errors.join('\n') : '(brak)');
await browser.close();
