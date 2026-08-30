import pw from '/opt/node22/lib/node_modules/playwright/index.js';
const { chromium } = pw;
const S = './';
const URL = process.env.STD ? 'http://127.0.0.1:5199/standalone-local.html'
  : 'http://127.0.0.1:5205/mebloprojekt-app.html';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const page = await (await browser.newContext({ viewport: { width: 1500, height: 1200 } })).newPage();
const errors = [];
page.on('pageerror', (e) => errors.push('[pageerror] ' + e.message));
page.on('console', (m) => { if (m.type() === 'error' && !/favicon|404/.test(m.text())) errors.push('[console] ' + m.text()); });
const ok = (l, c, e = '') => console.log((c ? '  OK   ' : '  BLAD ') + l + (e ? ' — ' + e : ''));
const card = (re) => page.locator('section').filter({ has: page.locator('h2', { hasText: re }) }).first();
const view = async (v) => { await page.getByText(v, { exact: true }).first().click(); await page.waitForTimeout(800); };
const notes = () => page.evaluate(() => {
  const sec = [...document.querySelectorAll('section')].find((s) => /^Uwagi$/.test((s.querySelector('h2') || {}).textContent || ''));
  return sec ? [...sec.querySelectorAll('li')].map((li) => ({
    txt: li.textContent.trim(), btns: [...li.querySelectorAll('button')].map((b) => b.textContent.trim()),
  })) : [];
});
const hwRows = () => card(/^Produkty do zamówienia/).evaluate((sec) =>
  [...sec.querySelectorAll('tbody tr')].map((tr) => [...tr.querySelectorAll('td')].map((td) => td.textContent.trim()).join(' | ')));
const cutRows = () => card(/^Formatki do zamówienia$/).evaluate((sec) =>
  [...sec.querySelectorAll('tbody tr')].map((tr) => [...tr.querySelectorAll('td')].map((td) => td.textContent.trim()).join(' | ')));
await page.goto(URL, { waitUntil: 'networkidle' });

// jedna kolumna, trzy szuflady wpuszczane w korpus
const seed = async (col = {}) => {
  await page.evaluate((c) => {
    localStorage.clear();
    const cab = { name: 'T', W: 600, H: 720, D: 500, frontMode: 'inset',
      levels: [{ h: null, cols: [Object.assign(
        { kind: 'drawers', w: null, drawerMode: 'inset',
          drawers: [0, 1, 2].map(() => ({ h: 'auto', front: null, handle: true })) }, c)] }] };
    localStorage.setItem('szafki:projekt', JSON.stringify({ name: 'T', active: 0, prices: {}, items: [{ cab }] }));
  }, col);
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(2200);
};
const fronts = async () => (await cutRows()).filter((r) => /^Front szuflady/.test(r));

console.log('== bez wcięcia ==');
await seed();
let f = await fronts();
f.forEach((r) => console.log('     ' + r));
const h0 = Number((f[0] || '').split('|')[2].trim());
ok('fronty mają pełną wysokość', h0 > 200, String(h0));
let hw = await hwRows();
ok('uchwyty policzone', hw.some((r) => /^Uchwyt/.test(r)), hw.find((r) => /^Uchwyt/.test(r)));

console.log('\n== kliknięcie w checkbox: wcięcie 18 mm i uchwyty znikają ==');
await seed();
const grip = page.getByText('Wcięcie na palce zamiast uchwytu', { exact: true }).first();
ok('checkbox jest w karcie kolumny', await grip.count() === 1);
await grip.click();
await page.waitForTimeout(1200);
f = await fronts();
f.forEach((r) => console.log('     ' + r));
const h1 = Number((f[0] || '').split('|')[2].trim());
ok('front krótszy dokładnie o 18 mm', h1 === h0 - 18, `${h0} → ${h1}`);
hw = await hwRows();
ok('uchwyty zniknęły z zamówienia', !hw.some((r) => /^Uchwyt/.test(r)),
  hw.find((r) => /^Uchwyt/.test(r)));

console.log('\n== prowadnice nie drgnęły ==');
await view('Otw.');
const szyny = await page.evaluate(() => [...document.querySelectorAll('svg text')]
  .map((t) => t.textContent.trim()).filter((x) => /^szyna/.test(x)));
console.log('     ' + szyny.join(', '));
ok('dolna szyna dalej na 0', szyny.includes('szyna 0'), szyny.join(', '));
ok('trzy prowadnice', szyny.length === 3, szyny.join(', '));

console.log('\n== własna głębokość wcięcia ==');
await seed({ fingerGrip: true, gripDepth: 30 });
f = await fronts();
const h2 = Number((f[0] || '').split('|')[2].trim());
ok('front krótszy o 30 mm', h2 === h0 - 30, `${h0} → ${h2}`);

console.log('\n== uchwyt da się dodać mimo wcięcia ==');
await seed({ fingerGrip: true,
  drawers: [{ h: 'auto', front: null, handle: true },
            { h: 'auto', front: null, handle: false },
            { h: 'auto', front: null, handle: false }] });
hw = await hwRows();
ok('uchwyt wraca, gdy włączony ręcznie', hw.some((r) => /^Uchwyt/.test(r)),
  hw.find((r) => /^Uchwyt/.test(r)) || '(brak)');

console.log('\n== wyłączenie wcięcia oddaje uchwyty ==');
await seed();
const grip2 = page.getByText('Wcięcie na palce zamiast uchwytu', { exact: true }).first();
await grip2.click();
await page.waitForTimeout(1000);
ok('po włączeniu brak uchwytów', !(await hwRows()).some((r) => /^Uchwyt/.test(r)));
await grip2.click();
await page.waitForTimeout(1000);
hw = await hwRows();
ok('po wyłączeniu uchwyty wracają', hw.some((r) => /^Uchwyt/.test(r)),
  hw.find((r) => /^Uchwyt/.test(r)) || '(brak)');

console.log('\n== auto samo schodzi klasę niżej przy głębokim wcięciu ==');
await seed({ fingerGrip: true, gripDepth: 120 });
let n0 = await notes();
ok('przy auto żadnego błędu o froncie', !n0.some((x) => /minimum dla wysokości/.test(x.txt)),
  (n0.find((x) => /minimum/.test(x.txt)) || {}).txt);

console.log('\n== ręcznie ustawiony bok nie mieści się — błąd z przyciskiem ==');
await seed({ fingerGrip: true, gripDepth: 120, drawers: [{ h: 238 }, { h: 238 }, { h: 238 }] });
const n = await notes();
const err = n.find((x) => /minimum dla wysokości/.test(x.txt));
console.log('     ' + (err ? err.txt.slice(0, 110) + '  →  [' + err.btns.join(' | ') + ']' : '(brak)'));
ok('błąd o zbyt niskim froncie', !!err, n.map((x) => x.txt.slice(0, 50)).join(' // '));
ok('przycisk zmiany wysokości boku', !!err && err.btns.some((b) => /^Zmień bok szuflady na \d+ mm$/.test(b)),
  err && err.btns);

console.log('\n== widoki bez błędów ==');
await seed({ fingerGrip: true });
for (const v of ['Zamk.', 'Otw.', 'Z boku', 'Z góry', 'Z tyłu', '3D']) {
  const k = errors.length;
  await view(v);
  ok(`widok ${v}`, errors.length === k, errors.slice(k).join('; '));
}
await view('Zamk.');
await page.locator('svg').first().screenshot({ path: S + 'shot-palce.png' });

console.log('\nBLEDY:', errors.length ? errors.join('\n') : '(brak)');
await browser.close();
