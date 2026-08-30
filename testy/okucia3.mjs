/* Okucia, ktore kiedys byly wpisane na sztywno, maja sie liczyc z wymiaru:
   trojkaty pod blatem od szerokosci szafki, a w ramieniu naroznika zlaczki
   fixu i zawiasy lamane od wysokosci frontu. */
import pw from '/opt/node22/lib/node_modules/playwright/index.js';
const URL = process.env.STD ? 'http://127.0.0.1:5199/standalone-local.html'
  : 'http://127.0.0.1:5205/mebloprojekt-app.html';
const b = await pw.chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const page = await (await b.newContext({ viewport: { width: 1500, height: 1200 } })).newPage();
const errors = []; page.on('pageerror', (e) => errors.push('[pageerror] ' + e.message));
const ok = (l, c, e = '') => console.log((c ? '  OK   ' : '  BLAD ') + l + (e ? ' — ' + e : ''));
const card = (re) => page.locator('section').filter({ has: page.locator('h2', { hasText: re }) }).first();
const wiersze = (re) => card(re).evaluate((sec) =>
  [...sec.querySelectorAll('tbody tr')].map((tr) =>
    [...tr.querySelectorAll('td')].map((td) => td.innerText.trim()).join(' | ')));
/* Okucia szafki sa w jej wlasnej karcie, ale ramie naroznika dokladane jest
   dopiero do zestawienia calego projektu — stad dwa zrodla. */
const hwRows = () => wiersze(/^Produkty do zamówienia/);
const projRows = () => wiersze(/^Produkty całego projektu/);
const qty = (rows, name) => {
  const r = rows.find((x) => x.startsWith(name));
  return r ? Number((r.split('|').pop() || '').trim().split(' ')[0]) : null;
};
await page.goto(URL, { waitUntil: 'networkidle' });
await page.evaluate(() => { try { localStorage.clear(); } catch (e) {} });
await page.reload({ waitUntil: 'networkidle' });
await page.waitForTimeout(1800);

console.log('== klipsy cokolu ida za nozkami przedniego rzedu ==');
/* Klipsy sa tylko przy nozkach — swiezo zalozona szafka stoi bez nich, wiec
   najpierw je wlaczamy. */
const nogi = card(/^Nóżki$/);
await nogi.locator('h2').click();
await page.waitForTimeout(400);
await nogi.getByText('Nóżki pod szafką', { exact: true }).click();
await page.waitForTimeout(900);
const korpus = card(/^Korpus$/);
const szerPole = korpus.locator('label').filter({ hasText: /Szerokość/ }).locator('input').first();
const klipsy = async (W) => {
  await szerPole.fill(String(W));
  await szerPole.blur();
  await page.waitForTimeout(1300);
  const rs = await hwRows();
  const w = rs.find((r) => /^Złączka do cokołu/.test(r)) || '(brak)';
  console.log(`     W=${W}: ` + w);
  return qty(rs, 'Złączka do cokołu');
};
ok('600 mm -> 2 klipsy (4 nozki, 2 z przodu)', (await klipsy(600)) === 2, '');
ok('900 mm -> 3 klipsy (6 nozek, 3 z przodu)', (await klipsy(900)) === 3, '');
await szerPole.fill('600');
await szerPole.blur();
await page.waitForTimeout(1200);

console.log('\n== trojkaty pod blatem rosna z szerokoscia ==');
await korpus.locator('button').filter({ hasText: /^Blat$/ }).first().click();
await page.waitForTimeout(1200);
let rows = await hwRows();
console.log('    ', (rows.find((r) => /^Trójkąt/.test(r)) || '(brak)'));
ok('600 mm -> 2 rzedy po 2 = 4', qty(rows, 'Trójkąt') === 4, String(qty(rows, 'Trójkąt')));

await szerPole.fill('1200');
await szerPole.blur();
await page.waitForTimeout(1400);
rows = await hwRows();
console.log('    ', (rows.find((r) => /^Trójkąt/.test(r)) || '(brak)'));
ok('1200 mm -> 2 rzedy po 3 = 6', qty(rows, 'Trójkąt') === 6, String(qty(rows, 'Trójkąt')));
ok('opis mowi, skad ta liczba', /2 rzędy po 3/.test(rows.find((r) => /^Trójkąt/.test(r)) || ''),
  rows.find((r) => /^Trójkąt/.test(r)));

/* Narozniki stawiamy z ziarna, tak jak reszta suit narożnikowych — karta
   szafki ma zbyt wiele przelacznikow, zeby klikac je po nazwie. */
const seed = async (H, doors, arm = 500) => {
  await page.evaluate(({ h, d, a }) => {
    localStorage.clear();
    localStorage.setItem('szafki:projekt', JSON.stringify({
      name: 'T', active: 1, prices: {},
      runs: [{ id: 'c1', name: 'A', wallW: null, gap: 0, mountY: 0, H: h, D: 600,
        plinth: { on: true, height: 100, mode: 'under', setback: 0 }, corner: null },
      { id: 'c2', name: 'B', wallW: null, gap: 0, mountY: 0, H: h, D: 600,
        plinth: { on: true, height: 100, mode: 'under', setback: 0 },
        corner: { of: 'c1', at: 'end', owner: 'of', clear: 0 } }],
      items: [
        { cab: { name: 'A1', W: 600, H: h, D: 600, plinth: { on: true, height: 100, mode: 'under', setback: 0 },
          corner: null, levels: [{ h: null, cols: [{ kind: 'doors', doors: 1, w: null }] }] }, runId: 'c1', offset: 0 },
        { cab: { name: 'rogowa', W: 900, H: h, D: 600, plinth: { on: true, height: 100, mode: 'under', setback: 0 },
          corner: { on: true, arm: a, doors: d },
          levels: [{ h: null, cols: [{ kind: 'doors', doors: 1, w: null }] }] }, runId: 'c1', offset: 0 },
      ] }));
  }, { h: H, d: doors, a: arm });
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(2400);
};

console.log('\n== fix trzyma sie na trojkatach, tyle ile wysokosci ==');
const fixTr = async (H) => {
  await seed(H, 'fix');
  const rs = await projRows();
  const w = rs.find((r) => /^Trójkąt meblarski \| fix ramienia/.test(r)) || '(brak)';
  console.log(`     H=${H}: ` + w);
  const m = /2 rzędy po (\d+) na (\d+) mm \| (\d+)/.exec(w);
  return m ? { wRzedzie: +m[1], swiatlo: +m[2], ile: +m[3] } : null;
};
const t720 = await fixTr(720);
const t2000 = await fixTr(2000);
ok('fix idzie na trojkaty meblarskie, nie na zlaczki', !!t720, '(brak wiersza trojkatow dla fixu)');
ok('zlaczki meblowej juz nie ma', qty(await projRows(), 'Złączka meblowa') === null, '');
if (t720 && t2000) {
  ok('trojkatow dokladnie 2 x rzad (720)', t720.ile === 2 * t720.wRzedzie, JSON.stringify(t720));
  ok('rzad z podzialu swiatla co 400 mm (720)',
    t720.wRzedzie === Math.max(2, Math.ceil(t720.swiatlo / 400)), JSON.stringify(t720));
  ok('rzad z podzialu swiatla co 400 mm (2000)',
    t2000.wRzedzie === Math.max(2, Math.ceil(t2000.swiatlo / 400)), JSON.stringify(t2000));
  ok('wyzszy fix ma wiecej trojkatow', t2000.ile > t720.ile, `${t720.ile} \u2192 ${t2000.ile}`);
}

console.log('\n== skrzydla lamane: 165 stopni do boku, 90 do drzwi ==');
const lamane = async (H, arm = 500) => {
  await seed(H, 'lamane', arm);
  const rs = await projRows();
  const wynik = { l: qty(rs, 'Zawias łamany'), s: qty(rs, 'Zawias 165'), z: qty(rs, 'Zawias |') };
  console.log(`     H=${H}, ramie ${arm}: 165 stopni ${wynik.s}, lamane ${wynik.l}`);
  return wynik;
};
const l720 = await lamane(720);
/* Reguly sa te same, co przy zwyklych zawiasach: waskie skrzydlo zawsze dwa,
   trzeci dopiero przy szerokosci ponad 500 i wysokosci ponad 1400 mm. */
const l2000 = await lamane(2000, 700);
ok('skrzydlo przy boku dostaje zawias 165 stopni', l720.s === 2, String(l720.s));
ok('drugie skrzydlo na zawiasie lamanym', l720.l === 2, String(l720.l));
/* Kazde skrzydlo liczy zawiasy ze swojej wielkosci, a w narozniku skrzydlo
   przy boku jest wezsze od tego na ramieniu — wiec liczby nie musza byc rowne.
   Wazne, ze obie ida za wymiarem, a nie stoja na sztywno. */
ok('szerokie skrzydlo ramienia dostaje trzeci zawias lamany', l2000.l > 2, String(l2000.l));
ok('waskie skrzydlo przy boku zostaje przy dwoch', l2000.s === 2, String(l2000.s));
/* Drugie skrzydlo wisi na pierwszym, wiec zwyklych zawiasow do ramienia nie ma
   — kiedys liczyly sie podwojnie. */
const rsL = await projRows();
ok('ramie nie dostaje juz zwyklych zawiasow',
  !rsL.some((r) => /^Zawias \| front ramienia/.test(r)),
  JSON.stringify(rsL.filter((r) => /^Zawias/.test(r))));

console.log('\nBLEDY:', errors.length ? errors.join('; ') : '(brak)');
await b.close();
