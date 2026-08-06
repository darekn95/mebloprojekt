import pw from '/opt/node22/lib/node_modules/playwright/index.js';
const { chromium } = pw;
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const page = await (await browser.newContext({ viewport: { width: 1500, height: 1200 } })).newPage();
const errs = [];
page.on('pageerror', (e) => errs.push('[pageerror] ' + e.message));
page.on('console', (m) => { if (m.type() === 'error' && !/favicon|404/.test(m.text())) errs.push('[console] ' + m.text()); });
await page.goto('http://127.0.0.1:5205/mebloprojekt-app.html', { waitUntil: 'networkidle' });
await page.evaluate(() => {
  localStorage.clear();
  const PL = { on: true, height: 100, mode: 'under', setback: 0 };
  localStorage.setItem('szafki:projekt', JSON.stringify({
    name: 'T', active: 0, prices: {},
    runs: [
      { id: 'c1', name: 'Dolne', wallW: 2600, gap: 0, mountY: 0, H: 720, D: 500, plinth: PL },
      { id: 'c2', name: 'Górne', wallW: 2600, gap: 0, mountY: 1400, H: 600, D: 320,
        plinth: { on: false, height: 100, mode: 'under', setback: 0 } },
    ],
    items: [
      { cab: { name: 'zlew 800', W: 800, H: 720, D: 500, plinth: PL }, runId: 'c1' },
      { cab: { name: 'szuflady 600', W: 600, H: 720, D: 500, plinth: PL,
        levels: [{ h: null, cols: [{ kind: 'drawers', w: null, drawers: [{}, {}, {}] }] }] }, runId: 'c1' },
      { cab: { name: 'piekarnik 600', W: 600, H: 720, D: 500, plinth: PL }, runId: 'c1' },
      { cab: { name: 'górna 800', W: 800, H: 600, D: 320,
        plinth: { on: false, height: 100, mode: 'under', setback: 0 } }, runId: 'c2' },
      { cab: { name: 'górna 600', W: 600, H: 600, D: 320,
        plinth: { on: false, height: 100, mode: 'under', setback: 0 } }, runId: 'c2' },
    ],
  }));
});
await page.reload({ waitUntil: 'networkidle' });
await page.waitForTimeout(2400);
const segs = await page.evaluate(() => [...document.querySelectorAll('section')]
  .filter((s) => /^Rysunek/.test((s.querySelector('h2') || {}).textContent || ''))
  .flatMap((s) => [...s.querySelectorAll('header .flex-col > div')]
    .map((d) => [...d.querySelectorAll('button')].map((b) => b.textContent.trim()).join('|'))));
console.log('wiersze przelacznika:', JSON.stringify(segs));
for (const scope of ['Szafka', 'Ciąg', 'Zabudowa']) {
  await page.getByText(scope, { exact: true }).first().click();
  await page.waitForTimeout(700);
  const opts = await page.evaluate(() => [...document.querySelectorAll('section')]
    .filter((s) => /^Rysunek/.test((s.querySelector('h2') || {}).textContent || ''))
    .flatMap((s) => [...s.querySelectorAll('header .flex-col > div')].slice(-1)
      .map((d) => [...d.querySelectorAll('button')].map((b) => b.textContent.trim()).join('|'))));
  console.log(scope.padEnd(9), '->', opts[0]);
  for (const v of opts[0].split('|')) {
    const before = errs.length;
    await page.getByText(v, { exact: true }).first().click();
    await page.waitForTimeout(600);
    const n = await page.evaluate(() => document.querySelectorAll('svg').length);
    console.log('   ', v.padEnd(7), 'svg:', n, errs.length > before ? 'BLAD: ' + errs.slice(before).join('; ') : '');
  }
}
console.log('BLEDY:', errs.length ? errs.join('\n') : '(brak)');
await browser.close();
