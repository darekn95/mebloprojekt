/* Audyt GPT 2026-10-28, ustalenia N100–N109 (`AUDYT_GPT.md` na galezi gpt/audyt-2026-10-16):
   - N100 pionowe wzmocnienie przecina polke — blad z „Wzmocnienie N: X mm”;
   - N101 wzmocnienie na rysunku w kolorze plyty korpusu (z niej jest zamawiane);
   - N102 fix wpuszczany z boku — jeden obraz w plaszczyznie korpusu;
   - N103 „Dobuduj wspornik” przy szufladach w poziomie kolumny zmienia fix kolumny;
   - N104 usuniecie nizszej polki nie kasuje rury w gornym swietle;
   - N105 „Wszędzie N zawiasy” w poziomach kolumny;
   - N106 „Zwiększ siłę” w klapie poziomu kolumny przy recznej sile kolumny;
   - N107 kreator klap z grubosci polek (12 mm przy korpusie 18);
   - N108 „dopasuj fronty” z luzem i montazem kolumny.
   N109 (para pod blat w szafce narożnej) — funkcje, suita `funkcje`. */
import pw from './pw.mjs';
const URL = process.env.STD ? 'http://127.0.0.1:5199/standalone-local.html'
  : 'http://127.0.0.1:5205/mebloprojekt-app.html';
const ok = (l, c, e = '') => console.log((c ? '  OK   ' : '  BLAD ') + l + (e ? ' — ' + e : ''));
const b = await pw.chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const page = await (await b.newContext({ viewport: { width: 1500, height: 1300 } })).newPage();
const errors = []; page.on('pageerror', (e) => errors.push(e.message));
await page.goto(URL, { waitUntil: 'networkidle' });

const M = (o = {}) => ({ board: { name: 'Płyta', thickness: 18, color: '#d8c3a0' }, front: { name: 'Płyta', thickness: 18, color: '#c2a880' },
  shelf: { name: 'Płyta', thickness: 18, color: '#d0bb96' }, back: { name: 'HDF', thickness: 3, color: '#9c7b56' },
  mirror: { name: 'Lustro', thickness: 4, color: '#c3d0d6' }, worktop: { name: 'Blat roboczy', thickness: 38, color: '#8d7b68', depth: 600 }, ...o });
const NOZKI = { plinth: { on: false }, legs: { on: true, height: 100 } };
const seed = async (cab, mat) => {
  await page.evaluate((p) => { localStorage.clear(); localStorage.setItem('szafki:projekt', JSON.stringify(p)); },
    { name: 'P', active: 0, prices: {}, runs: [], items: [{ cab, ...(mat ? { mat } : {}), runId: null, offset: 0 }] });
  await page.reload({ waitUntil: 'networkidle' }); await page.waitForTimeout(1500);
};
const zap = async () => { await page.waitForTimeout(900); return page.evaluate(() => JSON.parse(localStorage.getItem('szafki:projekt')).items[0].cab); };
const notes = () => page.evaluate(() => {
  const sec = [...document.querySelectorAll('section')].find((s) => /^Uwagi$/.test((s.querySelector('h2') || {}).textContent || ''));
  return sec ? [...sec.querySelectorAll('li')].map((li) => ({ txt: li.textContent.trim(), btns: [...li.querySelectorAll('button')].map((x) => x.textContent.trim()) })) : [];
});
const rows = (re) => page.evaluate((src) => { const r = new RegExp(src);
  const sec = [...document.querySelectorAll('section')].find((s) => r.test(s.querySelector('h2')?.textContent || ''));
  return sec ? [...sec.querySelectorAll('tbody tr')].map((tr) => [...tr.children].map((x) => x.innerText.trim().replace(/\s+/g, ' ')).join(' | ')) : []; }, re.source);
const szt = (lista, re) => { const r = lista.find((x) => re.test(x)); return r ? Number((r.match(/\|\s*(\d+)\s*(szt|kpl)/) || [])[1] || 0) : 0; };
const widok = async (v) => { const x = page.getByRole('button', { name: v, exact: true }); if (await x.count()) { await x.first().click(); await page.waitForTimeout(500); } };
const klik = async (nazwa) => { await page.getByRole('button', { name: nazwa, exact: true }).first().click(); await page.waitForTimeout(900); };

console.log('== N100: pionowe wzmocnienie a półka ==');
{
  const R = { orient: 'vertical', pos: 'top', side: 'left', h: 400, depth: 100, atDepth: 0, fromBack: false, reducesDoor: false };
  await seed({ name: 'S', W: 600, H: 720, D: 560, hangers: 'never', ...NOZKI, levels: [{ h: null, cols: [{ kind: 'open', w: null, shelfTargets: [null, null, null], rails: [R] }] }] });
  const n = (await notes()).find((x) => /przecina półkę/.test(x.txt));
  ok('błąd „wzmocnienie 1 (pionowe) przy lewym boku przecina półkę 2” z „Wzmocnienie 1: 216 mm”', !!n && /wzmocnienie 1 \(pionowe\) przy lewym boku przecina półkę 2/.test(n.txt) && n.btns.includes('Wzmocnienie 1: 216 mm'),
    JSON.stringify(n || (await notes()).map((x) => x.txt.slice(0, 80))));
  await klik('Wzmocnienie 1: 216 mm');
  ok('po kliknięciu: wzmocnienie 216 mm, bez błędu', (await zap()).levels[0].cols[0].rails[0].h === 216 && !(await notes()).some((x) => /przecina półkę/.test(x.txt)));
}

console.log('\n== N101: kolor wzmocnienia na rysunku ==');
{
  const R = { orient: 'vertical', pos: 'top', side: 'left', h: 400, depth: 100, atDepth: 0, fromBack: false, reducesDoor: false };
  await seed({ name: 'S', W: 600, H: 720, D: 560, hangers: 'never', realColors: true, shelfSameAsBoard: false, ...NOZKI,
    levels: [{ h: null, cols: [{ kind: 'open', w: null, shelfTargets: [null], rails: [R] }] }] },
  M({ board: { name: 'Płyta', thickness: 18, color: '#f5f5f4', decor: 'Biały' }, shelf: { name: 'Płyta', thickness: 18, color: '#2b2a28', decor: 'Czarny' } }));
  await widok('Otw.');
  const fills = await page.evaluate(() => [...document.querySelectorAll('#rysunek svg rect')]
    .filter((r) => Math.round(+r.getAttribute('width')) === 18 && Math.round(+r.getAttribute('height')) === 400).map((r) => (r.getAttribute('fill') || '').toLowerCase()));
  ok('prostokąt wzmocnienia 18 × 400 — nie w kolorze półek (#2b2a28)', fills.length >= 1 && !fills.includes('#2b2a28'), JSON.stringify(fills));
  await widok('Zamk.');
}

console.log('\n== N102: fix wpuszczany z boku ==');
{
  await seed({ name: 'S', W: 600, H: 720, D: 560, frontMode: 'overlay', ...NOZKI,
    levels: [{ h: null, cols: [{ kind: 'doors', doors: 1, w: null, shelfTargets: [null], fix: { side: 'left', w: 100, mode: 'inset' } }] }] });
  await widok('Z boku');
  // pasy grubosci frontu: [x, wysokosc] — fix wpuszczany 680 mm, drzwi nakladane wyzsze
  const pasy = await page.evaluate(() => [...document.querySelectorAll('#rysunek svg rect')]
    .filter((r) => Math.round(+r.getAttribute('width')) === 18 && Math.round(+r.getAttribute('height')) >= 600)
    .map((r) => [Math.round(+r.getAttribute('x')), Math.round(+r.getAttribute('height'))]));
  const fixX = [...new Set(pasy.filter(([, h]) => h === 680).map(([x]) => x))];
  ok('fix wpuszczany (680 mm): jeden pas, w korpusie (x 542), bez drugiego przed nim (560)', JSON.stringify(fixX) === '[542]', JSON.stringify(pasy));
  await widok('Zamk.');
}

console.log('\n== N103: wspornik przy szufladach w poziomie kolumny ==');
{
  await seed({ name: 'S', W: 600, H: 1800, D: 560, ...NOZKI, levels: [{ h: null, cols: [{ kind: 'doors', doors: 1, w: null, shelfTargets: [null, null], podzial: [0],
    fix: { side: 'left', w: 100 }, segmenty: [{ kind: 'drawers', drawers: [{ system: 'dxs' }] }] }] }] });
  const n = (await notes()).find((x) => /element stały zasłania część kolumny szuflad/.test(x.txt));
  ok('błąd kolizji z fixem z „Dobuduj wspornik pionowy”', !!n && n.btns.includes('Dobuduj wspornik pionowy'), JSON.stringify(n && n.btns));
  await klik('Dobuduj wspornik pionowy');
  const c = (await zap()).levels[0].cols[0];
  ok('wspornik przy fixie kolumny (nie w poziomie), błąd znika', c.fix && c.fix.support === true && !((c.segmenty || [])[0] || {}).fix
    && !(await notes()).some((x) => /element stały zasłania część kolumny szuflad/.test(x.txt)), JSON.stringify({ fix: c.fix, seg: c.segmenty }));
}

console.log('\n== N104: usunięcie niższej półki a rura w górnym świetle ==');
{
  await seed({ name: 'S', W: 600, H: 2400, D: 560, ...NOZKI, levels: [{ h: null, cols: [{ kind: 'doors', doors: 1, w: null, shelfTargets: [null, null], drazki: [1] }] }] });
  const usun = page.getByTitle('Usuń półkę przy tym świetle');
  ok('dwa światła — dwa „×”', (await usun.count()) === 2);
  await usun.last().click(); await page.waitForTimeout(900);   // w karcie swiatla od gory — ostatni to dolne
  const c = (await zap()).levels[0].cols[0];
  const r = (await rows(/^Produkty do zamówienia/)).find((x) => /^Rura na wieszaki/.test(x)) || '';
  ok('po usunięciu półki: rura w jedynym świetle (0), dalej w zamówieniu (562)', c.shelfTargets.length === 1 && JSON.stringify(c.drazki) === '[0]' && /562/.test(r), `${JSON.stringify(c.drazki)} | ${r}`);
}

console.log('\n== N105: „Wszędzie N zawiasy” w poziomach kolumny ==');
{
  await seed({ name: 'S', W: 600, H: 1800, D: 560, ...NOZKI, levels: [{ h: null, cols: [{ kind: 'doors', doors: 1, w: null, shelfTargets: [null, null], podzial: [0],
    segmenty: [{ hinges: [2] }, { hinges: [3] }] }] }] });
  const n = (await notes()).find((x) => /mają różną liczbę zawiasów/.test(x.txt));
  ok('ostrzeżenie „poziom 1 kolumny 1 — 2; poziom 2 kolumny 1 — 3” z „Wszędzie 2 zawiasy”', !!n && /poziom 1 kolumny 1 — 2/.test(n.txt) && /poziom 2 kolumny 1 — 3/.test(n.txt) && n.btns.includes('Wszędzie 2 zawiasy'),
    JSON.stringify(n && n.txt));
  await klik('Wszędzie 2 zawiasy');
  const c = (await zap()).levels[0].cols[0];
  ok('oba poziomy po 2 zawiasy, ostrzeżenie znika, 4 zawiasy w zamówieniu', JSON.stringify(c.segmenty.map((s) => s.hinges)) === '[[2],[2]]'
    && !(await notes()).some((x) => /mają różną liczbę zawiasów/.test(x.txt)) && szt(await rows(/^Produkty do zamówienia/), /^Zawias/) === 4,
    JSON.stringify(c.segmenty));
}

console.log('\n== N106: „Zwiększ siłę” w klapie poziomu kolumny ==');
{
  await seed({ name: 'S', W: 600, H: 900, D: 560, hangers: 'always', plinth: { on: false }, legs: { on: false }, levels: [{ h: null, cols: [{ kind: 'doors', doors: 1, w: null,
    shelfTargets: [null, null], podzial: [0], klapa: 'gora', silowniki: 2, silaN: 50, segmenty: [{}, {}] }] }] });
  const ile0 = (await notes()).filter((x) => x.btns.some((t) => /^Zwiększ siłę do/.test(t))).length;
  const n = (await notes()).find((x) => /poziom 1 kolumny 1/.test(x.txt) && x.btns.some((t) => /^Zwiększ siłę do/.test(t)));
  ok('dolna klapa: ostrzeżenie „za słaby” z „Zwiększ siłę do … N”', !!n, (await notes()).map((x) => x.txt.slice(0, 70)).join(' / '));
  if (n) {
    await page.locator('li', { hasText: 'poziom 1 kolumny 1' }).getByRole('button', { name: /^Zwiększ siłę do/ }).first().click(); await page.waitForTimeout(900);
    const c = (await zap()).levels[0].cols[0];
    const ile1 = (await notes()).filter((x) => x.btns.some((t) => /^Zwiększ siłę do/.test(t))).length;
    ok('w poziomie 1 jawne auto (silaN: null), jego ostrzeżenie znika; poziom 2 bez zmian', c.segmenty[0].silaN === null && !('silaN' in (c.segmenty[1] || {})) && ile1 === ile0 - 1,
      JSON.stringify({ seg: c.segmenty, ile0, ile1 }));
  }
}

console.log('\n== N107: kreator klap przy półkach 12 mm ==');
{
  await seed({ name: 'S', W: 1200, H: 580, D: 350, frontMode: 'inset', shelfSameAsBoard: false, hangers: 'always', plinth: { on: false }, legs: { on: false },
    levels: [{ h: null, cols: [{ kind: 'doors', doors: 1, w: null, shelfTargets: [null, null] }, { kind: 'doors', doors: 1, w: null, shelfTargets: [null] }] }] },
  M({ shelf: { name: 'Płyta', thickness: 12, color: '#d0bb96' } }));
  const k1 = page.locator('div.rounded.bg-stone-50').filter({ has: page.getByText('Kolumna 1', { exact: true }) }).first();
  await k1.getByRole('button', { name: 'klapy zamiast drzwi…', exact: true }).click(); await page.waitForTimeout(500);
  const t = await page.locator('[data-el="kreator-klap"]').innerText();
  ok('dwie klapy po 266 mm, bez „260”', (t.match(/266/g) || []).length >= 2 && !/\b260\b/.test(t), t.replace(/\n/g, ' / ').slice(0, 300));
}

console.log('\n== N108: „dopasuj fronty” — luz i montaż kolumny ==');
{
  const sz = (o, col) => ({ name: 'S', W: 600, H: 900, D: 560, ...NOZKI, ...o, levels: [{ h: null, cols: [{ kind: 'drawers', w: null, ...col,
    drawers: [{ h: 95, front: 150 }, { h: 178, front: 300 }, { h: 210, front: 440 }] }] }] });
  const zle = async () => (await notes()).filter((x) => /nie zgadzają się/.test(x.txt)).map((x) => x.txt.slice(0, 90));
  await seed(sz({}, { gapBetween: 5 }));
  await klik('dopasuj fronty');
  ok('A: luz kolumny 5 mm — po „dopasuj fronty” bez błędu sumy', !(await zle()).length, (await zle()).join(' / '));
  await seed(sz({ frontMode: 'overlay' }, { drawerMode: 'inset' }));
  await klik('dopasuj fronty');
  ok('B: szuflady „Wewnątrz” w szafce nakładanej — bez błędu sumy', !(await zle()).length, (await zle()).join(' / '));
}

ok('bez błędów strony', errors.length === 0, errors.join(' | '));
await b.close();
