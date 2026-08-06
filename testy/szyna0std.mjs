import pw from '/opt/node22/lib/node_modules/playwright/index.js';
const { chromium } = pw;
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const page = await (await browser.newContext({ viewport: { width: 1500, height: 1200 } })).newPage();
const errors = [];
page.on('pageerror', (e) => errors.push('[pageerror] ' + e.message));
page.on('console', (m) => { if (m.type() === 'error' && !/favicon|404/.test(m.text())) errors.push('[console] ' + m.text()); });
const ok = (l, c, e = '') => console.log((c ? '  OK   ' : '  BLAD ') + l + (e ? ' — ' + e : ''));
const card = (re) => page.locator('section').filter({ has: page.locator('h2', { hasText: re }) }).first();
const rails = async () => {
  await page.getByText('Otw.', { exact: true }).first().click();
  await page.waitForTimeout(800);
  return page.evaluate(() => [...document.querySelector('svg').querySelectorAll('text')]
    .map(t => t.textContent.trim()).filter(t => /^szyna /.test(t)).map(t => Number(t.replace('szyna ', ''))));
};
const setup = async (gapBottom, thickness, mode) => {
  await page.evaluate(({ gb, th, md }) => {
    localStorage.clear();
    const col = { w: null, kind: 'drawers', doors: 0, shelfTargets: [null], nl: null,
      drawers: [{ h: 'auto', front: null, handle: true }, { h: 'auto', front: null, handle: true },
                 { h: 'auto', front: null, handle: true }],
      doorWidths: [], mirrors: [], handles: [], hinges: [], rails: [],
      backMode: 'inherit', fix: { side: 'none', w: 60, mode: 'overlay', support: false, supportDepth: 100 },
      blendaMode: 'overlay', drawerMode: 'inherit', hinge: 'auto' };
    const cab = { name: 'T', W: 600, H: 720, D: 500, frontMode: md,
      gaps: { edge: 2, between: 3, top: 3, bottom: gb, inset: 2, divOverlay: 8 },
      levels: [{ h: null, cols: [col] }] };
    const mat = { board: { name: 'Płyta', thickness: th, color: '#e8e6e1' },
      front: { name: 'Płyta', thickness: th, color: '#e8e6e1' },
      shelf: { name: 'Płyta', thickness: th, color: '#e8e6e1' },
      back: { name: 'HDF', thickness: 3, color: '#9c7b56' },
      mirror: { name: 'Lustro', thickness: 4, color: '#c3d0d6' } };
    localStorage.setItem('szafki:projekt', JSON.stringify({ name: 'T', active: 0, prices: {}, items: [{ cab, mat }] }));
  }, { gb: gapBottom, th: thickness, md: mode });
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(2200);
};
await page.goto('http://127.0.0.1:5199/standalone-local.html', { waitUntil: 'networkidle' });

for (const [gb, th, md, opis] of [
  [3, 18, 'overlay', 'luz dolny 3, płyta 18, front nakładany'],
  [2, 18, 'overlay', 'luz dolny 2, płyta 18'],
  [5, 18, 'overlay', 'luz dolny 5, płyta 18'],
  [3, 22, 'overlay', 'luz dolny 3, płyta 22'],
  [3, 18, 'inset',   'front wpuszczany'],
]) {
  await setup(gb, th, md);
  const r = await rails();
  console.log(`  ${opis.padEnd(38)} → ${r.join(', ')}`);
  ok(`dolna szyna na 0 (${opis})`, r.length > 0 && Math.min(...r) === 0, r.join(', '));
}
console.log('\nBLEDY:', errors.length ? errors.join('\n') : '(brak)');
await browser.close();
