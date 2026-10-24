import pw from './pw.mjs';
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

// jedna kolumna, trzy szuflady wpuszczane w korpus (albo nakladane: tryb 'overlay')
const seed = async (col = {}, tryb = 'inset') => {
  await page.evaluate(([c, tryb]) => {
    localStorage.clear();
    const cab = { name: 'T', W: 600, H: 720, D: 500, frontMode: tryb,
      levels: [{ h: null, cols: [Object.assign(
        { kind: 'drawers', w: null, drawerMode: tryb,
          drawers: [0, 1, 2].map(() => ({ h: 'auto', front: null, handle: true })) }, c)] }] };
    localStorage.setItem('szafki:projekt', JSON.stringify({ name: 'T', active: 0, prices: {}, items: [{ cab }] }));
  }, [col, tryb]);
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
const grip = page.getByText('Wcięcie na palce (podfrez) zamiast uchwytu', { exact: true }).first();
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
const szyny = await page.evaluate(() => [...document.querySelectorAll('#rysunek svg text')]
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
const grip2 = page.getByText('Wcięcie na palce (podfrez) zamiast uchwytu', { exact: true }).first();
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

console.log('\n== szuflady nakładane: podfrez na dłoń jak przy wpuszczanych (użytkownik 2026-10-24) ==');
await seed({}, 'overlay');
f = await fronts();
const hn0 = Number((f[0] || '').split('|')[2].trim());
const gripN = page.getByText('Wcięcie na palce (podfrez) zamiast uchwytu', { exact: true }).first();
ok('checkbox jest też przy frontach na korpusie', await gripN.count() === 1);
await gripN.click();
await page.waitForTimeout(1200);
f = await fronts();
const hn1 = Number((f[0] || '').split('|')[2].trim());
ok('front nakładany krótszy o 18 mm', hn1 === hn0 - 18, `${hn0} → ${hn1}`);
/* Gorny front zachodzi 15 mm na wieniec — podfrez liczony od spodu wienca, nie
   od gory frontu (uzytkownik 2026-10-24): 702 − 18 = 684, front od 481 → 203 mm. */
const hGora = f.map((r) => Number(r.split('|')[2].trim()));
ok('górny front 18 mm pod spodem wieńca (203 mm), niższe tylko o 18', hGora.includes(203) && hGora.includes(hn1), f.join(' / '));
hw = await hwRows();
ok('uchwyty zniknęły z zamówienia', !hw.some((r) => /^Uchwyt/.test(r)), hw.find((r) => /^Uchwyt/.test(r)));
const nN = await notes();
ok('bez błędów w Uwagach', !nN.some((x) => /^×/.test(x.txt) || /minimum dla wysokości/.test(x.txt)), nN.map((x) => x.txt.slice(0, 60)).join(' // '));
for (const v of ['Zamk.', 'Z boku', '3D']) {
  const k = errors.length;
  await view(v);
  ok(`nakładane, widok ${v}`, errors.length === k, errors.slice(k).join('; '));
}
await view('Zamk.');

console.log('\n== nakładane pod przegrodą: górny front 18 mm pod nią ==');
await page.evaluate(() => {
  localStorage.clear();
  const cab = { name: 'T', W: 600, H: 1400, D: 500, frontMode: 'overlay',
    levels: [{ h: 600, cols: [{ kind: 'drawers', w: null, drawerMode: 'overlay', fingerGrip: true, drawers: [{ h: 'auto' }, { h: 'auto' }] }] },
      { h: null, cols: [{ kind: 'doors', doors: 1, w: null }] }] };
  localStorage.setItem('szafki:projekt', JSON.stringify({ name: 'T', active: 0, prices: {}, items: [{ cab }] }));
});
await page.reload({ waitUntil: 'networkidle' }); await page.waitForTimeout(2200);
f = await fronts();
// swiatlo poziomu 18–618, przegroda nad nim: gorny front od 315 do 618 − 18 = 600
ok('przegroda nad szufladami: górny front 285 mm (do 600 = spód przegrody − 18)', f.some((r) => Number(r.split('|')[2].trim()) === 285), f.join(' / '));

console.log('\n== widoki bez błędów ==');
await seed({ fingerGrip: true });
for (const v of ['Zamk.', 'Otw.', 'Z boku', 'Z góry', 'Z tyłu', '3D']) {
  const k = errors.length;
  await view(v);
  ok(`widok ${v}`, errors.length === k, errors.slice(k).join('; '));
}
await view('Zamk.');
await page.locator('#rysunek svg').first().screenshot({ path: S + 'shot-palce.png' });

console.log('\nBLEDY:', errors.length ? errors.join('\n') : '(brak)');
await browser.close();
