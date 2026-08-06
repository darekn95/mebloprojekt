import pw from '/opt/node22/lib/node_modules/playwright/index.js';
const { chromium } = pw;
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const page = await (await browser.newContext({ viewport: { width: 1500, height: 1100 } })).newPage();
const errors = [];
page.on('pageerror', (e) => errors.push('[pageerror] ' + e.message));
const ok = (l, c, e = '') => console.log((c ? '  OK   ' : '  BLAD ') + l + (e ? ' — ' + e : ''));
await page.goto('http://127.0.0.1:5205/mebloprojekt-app.html', { waitUntil: 'networkidle' });
await page.evaluate(() => {
  localStorage.clear();
  const col = (shelves) => ({ w: null, kind: 'doors', doors: 1, shelfTargets: Array(shelves + 1).fill(null),
    nl: null, drawers: [], doorWidths: [], mirrors: [], handles: [], hinges: [], rails: [],
    backMode: 'inherit', fix: { side: 'none', w: 60, mode: 'overlay', support: false, supportDepth: 100 },
    blendaMode: 'overlay', drawerMode: 'inherit', hinge: 'auto' });
  const cab = { name: 'Bez dna', W: 800, H: 720, D: 500, back: 'none',
    joints: { topL: 'over', topR: 'over', botL: 'none', botR: 'none' },
    pinDatum: 'bottom', levels: [{ h: null, cols: [col(2)] }] };
  localStorage.setItem('szafki:projekt', JSON.stringify({ name: 'T', active: 0, prices: {}, items: [{ cab }] }));
});
await page.reload({ waitUntil: 'networkidle' });
await page.waitForTimeout(2500);
await page.getByText('Otw.', { exact: true }).first().click();
await page.waitForTimeout(900);
const info = await page.evaluate(() => {
  const ts = [...document.querySelector('svg').querySelectorAll('text')].map(t => t.textContent.trim());
  return { otw: ts.filter(t => /^otw\. \d+$/.test(t)).map(t => t.replace('otw. ', '')),
    legenda: ts.find(t => /^otw\. —/.test(t)) || null };
});
console.log('  wysokości:', info.otw.join(', '));
console.log('  legenda:', info.legenda);
ok('legenda mówi o spodzie wnętrza (brak dna)', /spodu wnętrza/.test(info.legenda || ''), info.legenda);
ok('są dwie wysokości', info.otw.length === 2, info.otw.join(', '));
ok('liczone od 0: (702-36)/3 = 222', Number(info.otw[0]) === 222 && Number(info.otw[1]) === 462, info.otw.join(', '));
await page.locator('svg').first().screenshot({ path: './shot-nobot.png' });
console.log('\nBLEDY:', errors.length ? errors.join('\n') : '(brak)');
await browser.close();
