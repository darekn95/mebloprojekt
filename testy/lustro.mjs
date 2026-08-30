import pw from '/opt/node22/lib/node_modules/playwright/index.js';
const { chromium } = pw;
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const page = await (await browser.newContext({ viewport: { width: 1500, height: 1150 } })).newPage();
const errors = [];
page.on('pageerror', (e) => errors.push('[pageerror] ' + e.message));
const ok = (l, c, e = '') => console.log((c ? '  OK   ' : '  BLAD ') + l + (e ? ' — ' + e : ''));
await page.goto('http://127.0.0.1:5205/mebloprojekt-app.html', { waitUntil: 'networkidle' });
await page.evaluate(() => {
  localStorage.clear();
  const col = { w: null, kind: 'doors', doors: 2, shelfTargets: [null],
    nl: null, drawers: [], doorWidths: [], mirrors: [true, true], handles: [], hinges: [], rails: [],
    backMode: 'inherit', fix: { side: 'none', w: 60, mode: 'overlay', support: false, supportDepth: 100 },
    blendaMode: 'overlay', drawerMode: 'inherit', hinge: 'auto' };
  const cab = { name: 'Lustra', W: 800, H: 2000, D: 500, levels: [{ h: null, cols: [col] }] };
  localStorage.setItem('szafki:projekt', JSON.stringify({ name: 'T', active: 0, prices: {}, items: [{ cab }] }));
});
await page.reload({ waitUntil: 'networkidle' });
await page.waitForTimeout(2500);
const card = (re) => page.locator('section').filter({ has: page.locator('h2', { hasText: re }) }).first();
const hw = await card(/^Produkty do zamówienia/).evaluate((s) =>
  [...s.querySelectorAll('tbody tr')].map(tr => [...tr.querySelectorAll('td')].map(td => td.innerText.trim()).join(' | ')));
const mirRows = hw.filter(r => /^Lustro/.test(r));
const mirRow = mirRows[0];
console.log('  wierszy luster:', mirRows.length);
console.log('  produkt:', mirRow || '(brak)');
ok('lustro w produktach', !!mirRow);
ok('jednostka m²', mirRow && /m²/.test(mirRow), mirRow);
ok('spec podaje liczbę sztuk', mirRow && /× \d+ szt\./.test(mirRow), mirRow);
const wyc = card(/^Wycena$/);
await wyc.locator('h2').click();
await page.waitForTimeout(500);
const r = await wyc.evaluate((s) => {
  const tr = [...s.querySelectorAll('tbody tr')].find(t => /^Lustro/.test(t.querySelector('td').innerText.trim()));
  if (!tr) return null;
  const td = [...tr.querySelectorAll('td')];
  return { qty: td[1].innerText.trim(), ph: tr.querySelector('input').placeholder, wart: td[3].innerText.trim() };
});
console.log('  wycena:', JSON.stringify(r));
ok('cena 200 zł/m²', r && r.ph === '200', r && r.ph);
const m2 = Number((r.qty || '').replace(' m²', ''));
ok('wartość = m² × 200', r && Math.abs(Number(r.wart) - m2 * 200) < 0.02, `${m2} × 200 = ${(m2*200).toFixed(2)}, w tabeli ${r && r.wart}`);
console.log('\nBLEDY:', errors.length ? errors.join('\n') : '(brak)');
await browser.close();
