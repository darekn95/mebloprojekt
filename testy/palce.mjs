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

console.log('\n== wąskie okno (użytkownik 2026-10-24) ==');
await seed({ fingerGrip: true }, 'overlay');
await page.setViewportSize({ width: 1100, height: 1200 });
await page.waitForTimeout(500);
const wiersz = page.locator('[data-el="szuflada-wiersz"]').first();
const yUch = (await wiersz.getByText('uchwyt', { exact: true }).boundingBox()).y;
const yTyl = (await wiersz.getByText('tył', { exact: true }).boundingBox()).y;
const ySys = (await wiersz.locator('select').first().boundingBox()).y;
ok('„uchwyt” w jednej linii z „tył” i „reling”, pod systemem szuflady', Math.abs(yUch - yTyl) < 3 && yUch > ySys + 10, `uchwyt ${Math.round(yUch)}, tył ${Math.round(yTyl)}, system ${Math.round(ySys)}`);
const wPf = (await page.locator('[data-el="podfrez"] input[type=number]').first().boundingBox()).width;
ok('pole „front niższy o” ma szerokość na liczbę (≥ 60 px)', wPf >= 60, String(Math.round(wPf)));
await page.setViewportSize({ width: 1500, height: 1200 });
await page.evaluate(() => {
  localStorage.clear();
  const cab = { name: 'T', W: 600, H: 720, D: 500, levels: [{ h: null, cols: [{ kind: 'doors', doors: 1, w: null }] }] };
  localStorage.setItem('szafki:projekt', JSON.stringify({ name: 'T', active: 0, prices: {}, items: [{ cab }] }));
});
await page.reload({ waitUntil: 'networkidle' }); await page.waitForTimeout(1500);
ok('kolumna z drzwiami: bez checkboxa podfrezu', (await page.getByText('Wcięcie na palce (podfrez) zamiast uchwytu', { exact: true }).count()) === 0);

console.log('\n== podfrez: bez kreski „uchwytu” na rysunkach (użytkownik 2026-10-24) ==');
// szafka w ciagu — zeby byl tez widok „Ciąg”
await page.evaluate(() => {
  localStorage.clear();
  const cab = { name: 'T', W: 600, H: 720, D: 500, frontMode: 'overlay',
    levels: [{ h: null, cols: [{ kind: 'drawers', w: null, drawerMode: 'overlay', fingerGrip: true,
      drawers: [0, 1, 2].map(() => ({ h: 'auto', front: null, handle: false })) }] }] };
  localStorage.setItem('szafki:projekt', JSON.stringify({ name: 'T', active: 0, prices: {},
    runs: [{ id: 'c1', name: 'Ściana', mountY: 0, H: 720, D: 500, gap: 0 }], items: [{ cab, runId: 'c1', offset: 0 }] }));
});
await page.reload({ waitUntil: 'networkidle' }); await page.waitForTimeout(2200);
for (const [w, v] of [['Szafka', 'Otw.'], ['Szafka', 'Zamk.'], ['Ciąg', 'Otw.'], ['Ciąg', 'Zamk.']]) {
  for (const l of [w, v]) { await page.getByRole('button', { name: l, exact: true }).first().click(); await page.waitForTimeout(400); }
  const n = await page.locator('#rysunek svg [data-el="szuflada-kreska"]').count();
  const sz = await page.locator('#rysunek svg').first().evaluate((s) => s.querySelectorAll('rect').length);
  ok(`${w} / ${v}: bez kreski na szufladach z podfrezem`, n === 0 && sz > 5, `${n} kresek, ${sz} prostokątów`);
}
await page.getByRole('button', { name: 'Szafka', exact: true }).first().click();
await seed({ drawers: [0, 1, 2].map(() => ({ h: 'auto', front: null, handle: false })) }, 'overlay');
await view('Otw.');
const nk = await page.locator('#rysunek svg [data-el="szuflada-kreska"]').count();
ok('bez podfrezu i bez uchwytu kreska zostaje (symbol szuflady)', nk === 3, String(nk));
await view('Zamk.');

console.log('\n== DXS-3D z podfrezem: bok nie wyżej niż front (użytkownik 2026-10-25) ==');
{
  const dxs = { drawers: [0, 1, 2, 3].map(() => ({ h: 'auto', front: null, handle: false, system: 'dxs' })) };
  await seed({ ...dxs }, 'overlay');
  const boki0 = (await cutRows()).filter((r) => /^Bok szuflady/i.test(r));
  await seed({ ...dxs, fingerGrip: true }, 'overlay');
  const boki1 = (await cutRows()).filter((r) => /^Bok szuflady/i.test(r));
  const wys = (rows) => rows.map((r) => Math.min(...r.split(' | ').slice(2, 4).map(Number).filter((v) => v > 0)));
  ok('podfrez: boki skrzynek DXS niższe niż bez podfrezu', boki1.length > 0 && Math.max(...wys(boki1)) < Math.max(...wys(boki0)), JSON.stringify([wys(boki0), wys(boki1)]));
  const u = await notes();
  ok('bez uwag o boku wystającym ponad front', !u.some((n) => /wystaje .* ponad front obniżony/.test(n.txt)), u.map((n) => n.txt.slice(0, 80)).join(' / '));
  // bok wpisany recznie wyzej niz front — ostrzezenie z przyciskiem
  await seed({ ...dxs, fingerGrip: true, drawers: dxs.drawers.map((d, i) => (i === 1 ? { ...d, h: 150 } : d)) }, 'overlay');
  const u2 = await notes();
  const w = u2.find((n) => /szuflada 2: bok 150 mm wystaje \d+ mm ponad front obniżony podfrezem/.test(n.txt));
  ok('ręczny bok 150 ponad front: ostrzeżenie z „Zmień bok szuflady na N mm”', !!w && w.btns.some((b) => /^Zmień bok szuflady na \d+ mm$/.test(b)), JSON.stringify(w || u2.map((n) => n.txt.slice(0, 90))));
}

console.log('\n== drzwi bez uchwytu: dłuższy od dołu / podfrez / tip-on (użytkownik 2026-10-25) ==');
{
  const drzwi = async (o = {}) => {
    await page.evaluate((o) => {
      localStorage.clear();
      const cab = { name: 'G', W: 600, H: 720, D: 320, frontMode: 'overlay', plinth: { on: false }, legs: { on: false },
        levels: [{ h: null, cols: [{ kind: 'doors', doors: 1, w: null, shelfTargets: [null, null], ...o }] }] };
      localStorage.setItem('szafki:projekt', JSON.stringify({ name: 'T', active: 0, prices: {}, items: [{ cab }] }));
    }, o);
    await page.reload({ waitUntil: 'networkidle' }); await page.waitForTimeout(2000);
  };
  const zap = async () => { await page.waitForTimeout(800); return page.evaluate(() => JSON.parse(localStorage.getItem('szafki:projekt')).items[0].cab.levels[0].cols[0]); };
  const drzwiRows = async () => (await cutRows()).filter((r) => /^Drzwi/.test(r));
  await drzwi();
  const sel = page.locator('[data-el="drzwi-otwieranie"] select');
  ok('z uchwytem — bez wyboru otwierania', (await sel.count()) === 0);
  await page.locator('[data-el="drzwi-uchwyt"] input[type=checkbox]').first().uncheck(); await page.waitForTimeout(600);
  ok('bez uchwytu — wybór otwierania (—, dłuższy od dołu, podfrez od góry, tip-on)', (await sel.count()) === 1
    && (await sel.locator('option').allInnerTexts()).join('|') === 'otwieranie: —|front dłuższy od dołu|podfrez od góry|tip-on (GTV SALTO NOVA)');
  const h0 = await drzwiRows();
  await sel.selectOption('dol'); await page.waitForTimeout(700);
  let c = await zap();
  ok('„front dłuższy od dołu” zapisany przy skrzydle', JSON.stringify(c.otwieranie) === '["dol"]', JSON.stringify(c.otwieranie));
  const h1 = await drzwiRows();
  const wys = (rows) => Number((rows[0] || '').split(' | ')[2]);
  ok('formatka drzwi o 20 mm dłuższa', wys(h1) === wys(h0) + 20, JSON.stringify([h0, h1]));
  await page.locator('[data-el="drzwi-otwieranie-mm"]').fill('30'); await page.waitForTimeout(700);
  ok('30 mm — formatka o 30 mm dłuższa', wys(await drzwiRows()) === wys(h0) + 30, JSON.stringify(await drzwiRows()));
  await sel.selectOption('podfrez'); await page.waitForTimeout(700);
  ok('podfrez od góry 30 mm — formatka o 30 mm krótsza', wys(await drzwiRows()) === wys(h0) - 30, JSON.stringify(await drzwiRows()));
  await sel.selectOption('tipon'); await page.waitForTimeout(700);
  const hw = await hwRows();
  ok('tip-on: odbojnik GTV SALTO NOVA w zamówieniu, 1 szt.', hw.some((r) => /^Odbojnik tip-on GTV SALTO NOVA/.test(r) && /AM-SVN-DL-MG-30/.test(r) && /\b1 szt\./.test(r)), hw.filter((r) => /Odbojnik/.test(r)).join(' / '));
  ok('tip-on: drzwi bez zmiany wysokości', wys(await drzwiRows()) === wys(h0));
  ok('tip-on na rysunku (przerywany obrys przy wolnej krawędzi)', (await page.locator('#rysunek [data-el="tipon"]').count()) === 1);
  // szafka na nozkach: drzwi dluzsze o 95 mm siegaja podlogi — blad z przyciskami
  await drzwi({ handles: [false], otwieranie: ['dol'], otwieranieMm: [95] });
  await page.evaluate(() => { const p = JSON.parse(localStorage.getItem('szafki:projekt')); p.items[0].cab.legs = { on: true, height: 100 }; localStorage.setItem('szafki:projekt', JSON.stringify(p)); });
  await page.reload({ waitUntil: 'networkidle' }); await page.waitForTimeout(2000);
  const n = await notes();
  const b = n.find((x) => /front dłuższy od dołu o 95 mm kończy się \d+ mm nad podłogą/.test(x.txt));
  ok('nóżki 100, dłuższy o 95: błąd z „Podfrez od góry” / „Tip-on zamiast wydłużenia”', !!b && b.btns.includes('Podfrez od góry zamiast wydłużenia') && b.btns.includes('Tip-on zamiast wydłużenia'),
    JSON.stringify(b || n.map((x) => x.txt.slice(0, 80))));
  await page.getByRole('button', { name: 'Tip-on zamiast wydłużenia', exact: true }).click(); await page.waitForTimeout(800);
  c = await zap();
  ok('„Tip-on zamiast wydłużenia” zmienia otwieranie', JSON.stringify(c.otwieranie) === '["tipon"]', JSON.stringify(c.otwieranie));
}

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
