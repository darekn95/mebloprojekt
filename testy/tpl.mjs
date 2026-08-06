import pw from '/opt/node22/lib/node_modules/playwright/index.js';
const { chromium } = pw;
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const page = await (await browser.newContext({ viewport: { width: 1500, height: 1100 } })).newPage();
const errors = [];
page.on('pageerror', (e) => errors.push('[pageerror] ' + e.message));
page.on('console', (m) => { if (m.type() === 'error' && !/favicon|404/.test(m.text())) errors.push('[console] ' + m.text()); });
await page.goto('http://127.0.0.1:5205/mebloprojekt-app.html', { waitUntil: 'networkidle' });
await page.evaluate(() => { try { localStorage.clear(); } catch (e) {} });
await page.reload({ waitUntil: 'networkidle' });
await page.waitForTimeout(1500);
const ok = (l, c, e = '') => console.log((c ? '  OK   ' : '  BLAD ') + l + (e ? ' — ' + e : ''));
const card = (re) => page.locator('section').filter({ has: page.locator('h2', { hasText: re }) }).first();
const dims = () => card(/^Korpus$/).locator('input[type=number]').evaluateAll(e => e.slice(0, 3).map(x => x.value).join('×'));
const cutRows = () => card(/^Formatki do zamówienia$/).evaluate((sec) =>
  [...sec.querySelectorAll('tbody tr')].map(tr => [...tr.querySelectorAll('td')].map(td => td.innerText.trim().split('\n')[0]).join(' | ')));

const sel = page.locator('select[title="Dodaj szafkę z gotowego szablonu"]').first();
ok('lista szablonów w pasku szafek', await sel.count() === 1);
const opts = await sel.locator('option').allInnerTexts();
console.log('  szablony:', opts.slice(1).map(o => o.split(' — ')[0]).join(', '));

for (const [id, expect] of [['wiszaca', '600×720×300'], ['biurko', '1200×750×600']]) {
  await sel.selectOption(id);
  await page.waitForTimeout(1200);
  ok('szablon ' + id + ' ustawia gabaryty', (await dims()) === expect, 'jest ' + (await dims()) + ', oczekiwane ' + expect);
  if (id === 'biurko') {
    const rows = await cutRows();
    console.log('  formatki biurka:'); rows.forEach(r => console.log('     ' + r));
    ok('biurko ma blat', rows.some(r => /^Blat/.test(r)), (rows.find(r => /^Blat/.test(r)) || '').slice(0, 60));
    ok('biurko bez dna', !rows.some(r => /^Dno/.test(r)));
    ok('biurko bez pleców', !rows.some(r => /Plecy/.test(r)));
    ok('biurko bez drzwi', !rows.some(r => /Drzwi/.test(r)));
    ok('biurko ma dwa boki', rows.some(r => /^Bok/.test(r)), (rows.find(r => /^Bok/.test(r)) || '').slice(0, 50));
  }
}
const tabs = await page.evaluate(() => [...document.querySelectorAll('button')].filter(b => /^Szafka \d+$/.test(b.textContent.trim())).length);
ok('doszły dwie szafki', tabs === 3, tabs + ' zakładek');
console.log('\nBLEDY:', errors.length ? errors.join('\n') : '(brak)');
await browser.close();
