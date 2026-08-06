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

const setup = async (plinthMode, plinthH, legH) => {
  await page.evaluate(({ pm, ph, lh }) => {
    localStorage.clear();
    const cab = { name: 'T', W: 900, H: 720, D: 500,
      plinth: { on: pm !== 'none', height: ph, mode: pm === 'none' ? 'inbody' : pm, setback: 0 },
      legs: { on: true, height: lh, color: '#3f3f46', shape: 'box' } };
    localStorage.setItem('szafki:projekt', JSON.stringify({ name: 'T', active: 0, prices: {}, items: [{ cab }] }));
  }, { pm: plinthMode, ph: plinthH, lh: legH });
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(2200);
};
const front = async () => {
  await page.getByText('Zamk.', { exact: true }).first().click();
  await page.waitForTimeout(800);
  return page.evaluate(() => {
    const svg = document.querySelector('svg');
    const legs = [...svg.querySelectorAll('rect')]
      .filter(r => Math.round(+r.getAttribute('width')) === 40 && Math.round(+r.getAttribute('height')) >= 40)
      .map(r => ({ y: Math.round(+r.getAttribute('y')), h: Math.round(+r.getAttribute('height')),
        op: r.getAttribute('opacity') }));
    const txt = [...svg.querySelectorAll('text')].map(t => t.textContent.trim());
    return { legs, total: txt.filter(t => /^\d+$/.test(t)).map(Number), nozki: txt.find(t => /^nóżki/.test(t)) };
  });
};

console.log('== cokół w obrysie 100 + nóżki 100 ==');
await setup('inbody', 100, 100);
let f = await front();
console.log('  nóżki:', JSON.stringify(f.legs), '| podpisy:', f.total.join(', '), '|', f.nozki);
ok('nóżka kończy się pod dnem, nie pod szafką', f.legs.length === 2 && f.legs[0].y === 620, JSON.stringify(f.legs));
ok('nóżka rysowana za cokołem (przygaszona)', f.legs.every(l => l.op === '0.5'), JSON.stringify(f.legs.map(l => l.op)));
ok('całkowita wysokość zostaje 720', f.total.includes(720) && !f.total.includes(820), f.total.join(', '));
await page.locator('svg').first().screenshot({ path: S + 'shot-nozki-obrys.png' });

console.log('\n== cokół w obrysie 100 + nóżki 150 (wystają) ==');
await setup('inbody', 100, 150);
f = await front();
console.log('  podpisy:', f.total.join(', '));
ok('szafka podniesiona o nadwyżkę 50', f.total.includes(770), f.total.join(', '));

console.log('\n== cokół pod korpusem 100 + nóżki 100 ==');
await setup('outside', 100, 100);
f = await front();
console.log('  nóżki:', JSON.stringify(f.legs), '| podpisy:', f.total.join(', '));
ok('nóżka pod korpusem, pełna widoczność', f.legs.length === 2 && f.legs[0].op === '1', JSON.stringify(f.legs));
ok('całkowita wysokość 820', f.total.includes(820), f.total.join(', '));

console.log('\n== bez cokołu, nóżki 100 ==');
await setup('none', 100, 100);
f = await front();
console.log('  podpisy:', f.total.join(', '));
ok('całkowita wysokość 820', f.total.includes(820), f.total.join(', '));

console.log('\n== widoki bez błędów (cokół w obrysie) ==');
await setup('inbody', 100, 100);
for (const v of ['Zamk.', 'Otw.', 'Z boku', 'Z góry', 'Z tyłu', '3D']) {
  const n = errors.length;
  await page.getByText(v, { exact: true }).first().click();
  await page.waitForTimeout(700);
  ok('widok ' + v, errors.length === n);
}
await page.getByText('3D', { exact: true }).first().click();
await page.waitForTimeout(900);
await page.locator('svg').first().screenshot({ path: S + 'shot-nozki-3d.png' });
console.log('\nBLEDY:', errors.length ? errors.join('\n') : '(brak)');
await browser.close();
