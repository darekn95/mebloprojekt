import pw from '/opt/node22/lib/node_modules/playwright/index.js';
const { chromium } = pw;
const S = './';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const page = await (await browser.newContext({ viewport: { width: 1500, height: 1150 } })).newPage();
const errors = [];
page.on('pageerror', (e) => errors.push('[pageerror] ' + e.message));
page.on('console', (m) => { if (m.type() === 'error' && !/favicon|404/.test(m.text())) errors.push('[console] ' + m.text()); });
const ok = (l, c, e = '') => console.log((c ? '  OK   ' : '  BLAD ') + l + (e ? ' — ' + e : ''));
await page.goto('http://127.0.0.1:5199/standalone-local.html', { waitUntil: 'networkidle' });

const col = (kind) => ({ w: null, kind, doors: kind === 'doors' ? 2 : 0, shelfTargets: [null, null],
  nl: null, drawers: kind === 'drawers' ? [{ h: 'auto', front: null, handle: true }] : [],
  doorWidths: [], mirrors: [], handles: [], hinges: [], rails: [],
  backMode: 'inherit', fix: { side: 'none', w: 60, mode: 'overlay', support: false, supportDepth: 100 },
  blendaMode: 'overlay', drawerMode: 'inherit', hinge: 'auto' });

const seed = async (cab) => {
  await page.evaluate((c) => {
    localStorage.clear();
    localStorage.setItem('szafki:projekt', JSON.stringify({ name: 'T', active: 0, prices: {}, items: [{ cab: c }] }));
  }, cab);
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(2200);
  await page.getByText('Z góry', { exact: true }).first().click();
  await page.waitForTimeout(900);
  return page.evaluate(() => [...document.querySelector('svg').querySelectorAll('text')]
    .map(t => ({ s: t.textContent.trim(), x: Math.round(+t.getAttribute('x')), fill: t.getAttribute('fill') })));
};
const has = (d, v) => d.some(t => t.s === String(v));

console.log('== bryła przy prawym boku, z zabudową (przypadek ze zrzutu) ==');
let d = await seed({ name: 'T', W: 600, H: 720, D: 500,
  cutout: { on: true, w: 60, d: 60, fullHeight: true, levelIndex: 0, mask: true, maskType: 'auto', maskFront: 'over' },
  obstacles: [{ on: true, w: 80, d: 80, h: 0, side: 'right', fromSide: 0, fromBack: 0, fromBottom: 0,
    fullHeight: true, mask: true, maskType: 'auto', maskFront: 'over' }],
  levels: [{ h: null, cols: [col('doors')] }] });
console.log('  etykiety:', d.map(t => t.s).join(' | '));
ok('zabudowa wycięcia ma wymiar do lica (422)', has(d, 422), '');
ok('zabudowa bryły ma wymiar do lica (500 − 80 − 18 = 402)', has(d, 402), '');
const w402 = d.find(t => t.s === '402');
const w422 = d.find(t => t.s === '422');
ok('wymiar bryły po jej stronie szafki', w402 && w422 && w402.x > w422.x, `422 @x=${w422?.x}, 402 @x=${w402?.x}`);
await page.locator('svg').first().screenshot({ path: S + 'shot-obdim.png' });

console.log('\n== bryła w środku kolumny (działało wcześniej — ma działać dalej) ==');
d = await seed({ name: 'T', W: 800, H: 720, D: 500,
  obstacles: [{ on: true, w: 100, d: 120, h: 0, side: 'left', fromSide: 250, fromBack: 0, fromBottom: 0,
    fullHeight: true, mask: true, maskType: 'auto', maskFront: 'over' }],
  levels: [{ h: null, cols: [col('doors')] }] });
console.log('  etykiety:', d.map(t => t.s).join(' | '));
ok('wolna głębokość policzona (500 − 120 − 18 = 362)', has(d, 362), '');

console.log('\n== kolumna z szufladami: wymiaru nie ma (szuflady same się wymiarują) ==');
d = await seed({ name: 'T', W: 600, H: 720, D: 500,
  obstacles: [{ on: true, w: 80, d: 80, h: 0, side: 'right', fromSide: 0, fromBack: 0, fromBottom: 0,
    fullHeight: true, mask: true, maskType: 'auto', maskFront: 'over' }],
  levels: [{ h: null, cols: [col('drawers')] }] });
console.log('  etykiety:', d.map(t => t.s).join(' | '));
ok('brak wymiaru wolnej głębokości przy szufladach', !has(d, 402), '');

console.log('\n== bryła bez zabudowy: zostają wymiary od tyłu i od lica ==');
d = await seed({ name: 'T', W: 600, H: 720, D: 500,
  obstacles: [{ on: true, w: 80, d: 80, h: 0, side: 'right', fromSide: 0, fromBack: 0, fromBottom: 0,
    fullHeight: true, mask: false, maskType: 'auto', maskFront: 'over' }],
  levels: [{ h: null, cols: [col('doors')] }] });
console.log('  etykiety:', d.map(t => t.s).join(' | '));
ok('bez zabudowy mierzymy do samej bryły (420)', has(d, 420), '');
ok('bez zabudowy nie ma wymiaru zabudowy (402)', !has(d, 402), '');

console.log('\nBLEDY:', errors.length ? errors.join('\n') : '(brak)');
await browser.close();
