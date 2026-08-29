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

console.log('\n== zlaczki fixu ida za wysokoscia ramienia ==');
const zlaczki = async (H) => {
  await seed(H, 'fix');
  const rs = await projRows();
  const w = rs.find((r) => /^Złączka meblowa/.test(r)) || '(brak)';
  console.log(`     H=${H}: ` + w);
  return { ile: qty(rs, 'Złączka meblowa'), opis: w };
};
const z720 = await zlaczki(720);
const z2000 = await zlaczki(2000);
ok('opis podaje rzedy i swiatlo', /2 rzędy po \d+ na \d+ mm/.test(z720.opis), z720.opis);
const zRzedu = (o) => { const m = /2 rzędy po (\d+) na (\d+) mm/.exec(o); return m ? [+m[1], +m[2]] : null; };
const p720 = zRzedu(z720.opis); const p2000 = zRzedu(z2000.opis);
ok('zlaczek dokladnie 2 x rzad (720)', p720 && z720.ile === 2 * p720[0], `${z720.ile} vs ${p720 && 2 * p720[0]}`);
ok('rzad z podzialu swiatla co 400 mm (720)',
  p720 && p720[0] === Math.max(2, Math.ceil(p720[1] / 400)), JSON.stringify(p720));
ok('rzad z podzialu swiatla co 400 mm (2000)',
  p2000 && p2000[0] === Math.max(2, Math.ceil(p2000[1] / 400)), JSON.stringify(p2000));
ok('wyzsze ramie ma wiecej zlaczek', z2000.ile > z720.ile, `${z720.ile} → ${z2000.ile}`);

console.log('\n== zawiasy lamane licza sie jak zwykle ==');
const lamane = async (H, arm = 500) => {
  await seed(H, 'lamane', arm);
  const rs = await projRows();
  const zw = qty(rs, 'Zawias łamany');
  console.log(`     H=${H}, ramie ${arm}: łamane ${zw}`);
  return zw;
};
const l720 = await lamane(720);
/* Reguly sa te same, co przy zwyklych zawiasach: waskie skrzydlo zawsze dwa,
   trzeci dopiero przy szerokosci ponad 500 i wysokosci ponad 1400 mm. */
const l2000 = await lamane(2000, 700);
ok('przy 720 mm dwa zawiasy lamane', l720 === 2, String(l720));
ok('wysokie i szerokie skrzydlo dostaje trzeci', l2000 !== null && l2000 > 2, String(l2000));

console.log('\nBLEDY:', errors.length ? errors.join('; ') : '(brak)');
await b.close();
