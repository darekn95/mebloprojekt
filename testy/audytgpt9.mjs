/* Audyt GPT 2026-10-28, ustalenia N88–N89 (`AUDYT_GPT.md` na galezi gpt/audyt-2026-10-16):
   - N88 „Scal szafki w jedną” przy roznych plytach — kreator pokazuje roznice (korpus,
     fronty, polki, plecy) i pyta, z ktorej szafki wziac plyty; wczesniej po cichu pierwszej;
   - N89 rura na wieszaki w poziomie kolumny z szufladami / blenda — blad z „Przenieś do
     światła N” i „Usuń rurę”; podpowiedz „zmieści się rura” tylko w poziomach z drzwiami. */
import pw from './pw.mjs';
const URL = process.env.STD ? 'http://127.0.0.1:5199/standalone-local.html'
  : 'http://127.0.0.1:5205/mebloprojekt-app.html';
const ok = (l, c, e = '') => console.log((c ? '  OK   ' : '  BLAD ') + l + (e ? ' — ' + e : ''));
const b = await pw.chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const page = await (await b.newContext({ viewport: { width: 1500, height: 1300 } })).newPage();
const errors = []; page.on('pageerror', (e) => errors.push(e.message));
await page.goto(URL, { waitUntil: 'networkidle' });

const MAT = (o = {}) => ({ board: { name: 'Płyta', thickness: 18, color: '#d8c3a0' }, front: { name: 'Płyta', thickness: 18, color: '#c2a880' },
  shelf: { name: 'Płyta', thickness: 18, color: '#d0bb96' }, back: { name: 'HDF', thickness: 3, color: '#9c7b56' },
  mirror: { name: 'Lustro', thickness: 4, color: '#c3d0d6' }, worktop: { name: 'Blat roboczy', thickness: 38, color: '#8d7b68', depth: 600 }, ...o });
const BIALY = { name: 'Płyta', thickness: 18, color: '#f5f5f4', decor: 'Biały mat' };
const CZARNY = { name: 'Płyta', thickness: 18, color: '#1c1917', decor: 'Czarny mat' };
const BEZ = { on: false, height: 100, mode: 'under', setback: 0 };
const cab = (name, o = {}) => ({ name, W: 600, H: 900, D: 560, plinth: BEZ, legs: { on: true, height: 100 },
  levels: [{ h: null, cols: [{ kind: 'doors', doors: 1, w: null, shelfTargets: [null] }] }], ...o });
const RUN = { id: 'c1', name: 'Ściana', roomId: null, wallW: null, gap: 0, mountY: 0, H: 900, D: 560, plinth: BEZ, worktop: false, corner: null };
const seedRun = async (items, active = 0) => {
  await page.evaluate((q) => { localStorage.clear(); localStorage.setItem('szafki:projekt', JSON.stringify(q)); },
    { name: 'P', active, prices: {}, runs: [RUN], items: items.map((it) => ({ runId: 'c1', offset: 0, ...it })) });
  await page.reload({ waitUntil: 'networkidle' }); await page.waitForTimeout(1200);
};
const seed = async (c) => {
  await page.evaluate((q) => { localStorage.clear(); localStorage.setItem('szafki:projekt', JSON.stringify(q)); },
    { name: 'P', active: 0, prices: {}, runs: [], items: [{ cab: c, runId: null, offset: 0 }] });
  await page.reload({ waitUntil: 'networkidle' }); await page.waitForTimeout(1200);
};
const zap = async () => { await page.waitForTimeout(800); return page.evaluate(() => JSON.parse(localStorage.getItem('szafki:projekt'))); };
const rows = (re) => page.evaluate((src) => { const r = new RegExp(src);
  const sec = [...document.querySelectorAll('section')].find((s) => r.test(s.querySelector('h2')?.textContent || ''));
  return sec ? [...sec.querySelectorAll('tbody tr')].map((tr) => [...tr.children].map((x) => x.innerText.trim().replace(/\s+/g, ' ')).join(' | ')) : []; }, re.source);
const notes = () => page.evaluate(() => {
  const sec = [...document.querySelectorAll('section')].find((s) => /^Uwagi$/.test((s.querySelector('h2') || {}).textContent || ''));
  return sec ? [...sec.querySelectorAll('li')].map((li) => ({ txt: li.textContent.trim(), btns: [...li.querySelectorAll('button')].map((x) => x.textContent.trim()) })) : [];
});
const panel = () => page.locator('[data-el="scalanie"]');
const otworz = async () => { await page.locator('[data-el="scal-otworz"]').click(); await page.waitForTimeout(400); };
const plyty = () => panel().locator('[data-el="scal-plyty"]');

console.log('== N88: scalanie szafek z różnymi płytami ==');
{
  await seedRun([{ cab: cab('A'), mat: MAT({ board: BIALY }) }, { cab: cab('B'), mat: MAT({ board: CZARNY }) }]);
  await otworz();
  let t = (await plyty().count()) ? await plyty().innerText() : '';
  ok('kreator: ostrzeżenie o różnych płytach — korpus i fronty (z płyty korpusu): A — Biały mat, B — Czarny mat',
    /Szafki mają różne płyty/.test(t) && /korpus: A — Biały mat 18 mm; B — Czarny mat 18 mm/.test(t) && /fronty: A — Biały mat 18 mm; B — Czarny mat 18 mm/.test(t)
    && !/plecy:/.test(t), t.replace(/\n/g, ' / '));
  const wybor = plyty().getByRole('button', { name: 'B', exact: true });
  ok('wybór „płyty jak w” A / B, domyślnie A', (await plyty().getByRole('button', { name: 'A', exact: true }).count()) === 1 && (await wybor.count()) === 1, t);
  await wybor.click(); await page.waitForTimeout(300);
  await panel().getByRole('button', { name: 'Scal', exact: true }).click(); await page.waitForTimeout(1200);
  let p = await zap();
  ok('„płyty jak w B” → scalona szafka z Czarnym matem (korpus)', p.items.length === 1 && p.items[0].mat.board.decor === 'Czarny mat' && p.items[0].cab.W === 1200,
    JSON.stringify(p.items.map((it) => [it.cab.name, it.cab.W, it.mat.board.decor])));
  const f = await rows(/^Formatki do zamówienia$/);
  ok('formatki: wszystkie Czarny mat, bez Białego', f.length > 0 && f.filter((r) => /Płyta/.test(r)).every((r) => /Czarny mat/.test(r)) && !f.some((r) => /Biały mat/.test(r)),
    f.slice(0, 4).join(' / '));
  await page.getByRole('button', { name: '↶ Cofnij', exact: true }).click(); await page.waitForTimeout(900);
  p = await zap();
  ok('„Cofnij” — dwie szafki z własnymi płytami', p.items.length === 2 && p.items[0].mat.board.decor === 'Biały mat' && p.items[1].mat.board.decor === 'Czarny mat');

  await seedRun([{ cab: cab('A'), mat: MAT({ board: BIALY }) }, { cab: cab('B'), mat: MAT({ board: BIALY }) }]);
  await otworz();
  ok('te same płyty — bez ostrzeżenia', (await plyty().count()) === 0);

  // osobna plyta frontow w obu, rozne dekory frontow; korpus ten sam
  await seedRun([{ cab: cab('A', { frontSameAsBoard: false }), mat: MAT({ board: BIALY, front: BIALY }) },
    { cab: cab('B', { frontSameAsBoard: false }), mat: MAT({ board: BIALY, front: CZARNY }) }]);
  await otworz();
  t = (await plyty().count()) ? await plyty().innerText() : '';
  ok('różne tylko fronty (własna płyta frontów): lista ma tylko „fronty”', /fronty: A — Biały mat 18 mm; B — Czarny mat 18 mm/.test(t) && !/korpus:/.test(t), t.replace(/\n/g, ' / '));
  await panel().getByRole('button', { name: 'Scal', exact: true }).click(); await page.waitForTimeout(1200);
  p = await zap();
  ok('domyślnie (A): fronty Biały mat, osobna płyta frontów zostaje', p.items.length === 1 && p.items[0].mat.front.decor === 'Biały mat' && p.items[0].cab.frontSameAsBoard === false,
    JSON.stringify(p.items[0].mat.front));

  // rozne grubosci korpusu: wybor B — grubosc B
  await seedRun([{ cab: cab('A'), mat: MAT({ board: BIALY }) }, { cab: cab('B'), mat: MAT({ board: { ...CZARNY, thickness: 16 } }) }]);
  await otworz();
  t = (await plyty().count()) ? await plyty().innerText() : '';
  ok('różna grubość: „B — Czarny mat 16 mm”', /B — Czarny mat 16 mm/.test(t), t.replace(/\n/g, ' / '));
  await plyty().getByRole('button', { name: 'B', exact: true }).click(); await page.waitForTimeout(300);
  await panel().getByRole('button', { name: 'Scal', exact: true }).click(); await page.waitForTimeout(1200);
  p = await zap();
  ok('„jak w B”: korpus 16 mm, szerokość 1200', p.items.length === 1 && p.items[0].mat.board.thickness === 16 && p.items[0].cab.W === 1200, JSON.stringify(p.items[0].mat.board));
}

console.log('\n== N89: rura na wieszaki w poziomie kolumny z szufladami ==');
{
  // 600 × 2400, granica w polowie; rura w dolnym swietle, dol — szuflady DXS
  const SZAFA = (seg0, drazki = [0]) => ({ name: 'S', W: 600, H: 2400, D: 560, plinth: BEZ, legs: { on: true, height: 100 },
    levels: [{ h: null, cols: [{ kind: 'doors', w: null, doors: 1, shelfTargets: [null, null], podzial: [0], drazki, segmenty: [seg0] }] }] });
  const DXS3 = { kind: 'drawers', drawers: [{ system: 'dxs' }, { system: 'dxs' }, { system: 'dxs' }] };
  await seed(SZAFA(DXS3));
  let n = (await notes()).find((x) => /rura na wieszaki: w tym poziomie są szuflady/.test(x.txt));
  ok('błąd „poziom 1 kolumny 1, rura na wieszaki: w tym poziomie są szuflady — rura przecina skrzynki”', !!n && /^.?Poziom 1, poziom 1 kolumny 1/.test(n.txt),
    JSON.stringify(n || (await notes()).map((x) => x.txt.slice(0, 80))));
  ok('przyciski „Przenieś do światła 2 (1173 mm)” i „Usuń rurę”', !!n && n.btns.includes('Przenieś do światła 2 (1173 mm)') && n.btns.includes('Usuń rurę'), JSON.stringify(n && n.btns));
  await page.getByRole('button', { name: 'Przenieś do światła 2 (1173 mm)', exact: true }).click(); await page.waitForTimeout(900);
  let c = (await zap()).items[0].cab.levels[0].cols[0];
  const pr = await rows(/^Produkty do zamówienia/);
  ok('„Przenieś”: rura w świetle 2 (drzwi), błąd znika, rura dalej w zamówieniu', JSON.stringify(c.drazki) === '[1]' && !(await notes()).some((x) => /rura na wieszaki: w tym poziomie/.test(x.txt))
    && pr.some((r) => /^Rura na wieszaki/.test(r)), JSON.stringify(c.drazki));
  await seed(SZAFA({ kind: 'blenda' }));
  n = (await notes()).find((x) => /w tym poziomie jest blenda/.test(x.txt));
  ok('blenda w dolnym poziomie: błąd „za nią rura nie ma sensu”, „Usuń rurę” usuwa', !!n && n.btns.includes('Usuń rurę'), JSON.stringify(n && n.txt));
  await page.getByRole('button', { name: 'Usuń rurę', exact: true }).first().click(); await page.waitForTimeout(900);
  c = (await zap()).items[0].cab.levels[0].cols[0];
  ok('„Usuń rurę”: bez rury, bez błędu', !c.drazki && !(await notes()).some((x) => /rura na wieszaki: w tym poziomie/.test(x.txt)), JSON.stringify(c.drazki));
  // zmiana rodzaju poziomu w karcie: drzwi z rura → szuflady
  await seed(SZAFA({}, [0]));
  ok('poziom z drzwiami i rurą — bez błędu rury', !(await notes()).some((x) => /rura na wieszaki: w tym poziomie/.test(x.txt)));
  const poz1 = page.locator('[data-el="odcinek-kolumny"]').filter({ hasText: 'poziom 1 kolumny 1' });
  await poz1.locator('[data-el="odcinek-rodzaj"]').getByRole('button', { name: 'Szuflady', exact: true }).click(); await page.waitForTimeout(1000);
  ok('„Półki i drzwi” → „Szuflady” w karcie: pojawia się błąd rury z przyciskami', (await notes()).some((x) => /rura na wieszaki: w tym poziomie są szuflady/.test(x.txt) && x.btns.includes('Usuń rurę')),
    (await notes()).map((x) => x.txt.slice(0, 70)).join(' / '));
  await poz1.locator('[data-el="odcinek-rodzaj"]').getByRole('button', { name: 'Półki i drzwi', exact: true }).click(); await page.waitForTimeout(1000);
  ok('z powrotem „Półki i drzwi”: rura w swoim świetle, bez błędu', JSON.stringify((await zap()).items[0].cab.levels[0].cols[0].drazki) === '[0]'
    && !(await notes()).some((x) => /rura na wieszaki: w tym poziomie/.test(x.txt)));
  // podpowiedz „zmieści się rura” nie wskazuje swiatla szuflad
  await seed({ ...SZAFA(DXS3, []), levels: [{ h: null, cols: [{ kind: 'doors', w: null, doors: 1, shelfTargets: [null, null], podzial: [0], segmenty: [{}, DXS3] }] }] });
  const info = (await notes()).filter((x) => /zmieści się rura/.test(x.txt));
  ok('górny poziom szuflady, dolny drzwi: podpowiedź rury tylko dla światła 1 (drzwi)', info.length === 1, info.map((x) => x.txt.slice(0, 80)).join(' / '));
  if (info.length) {
    await page.getByRole('button', { name: 'Dodaj rurę na wieszaki', exact: true }).first().click(); await page.waitForTimeout(900);
    ok('„Dodaj rurę” — rura w świetle 1 (z drzwiami), bez błędu', JSON.stringify((await zap()).items[0].cab.levels[0].cols[0].drazki) === '[0]'
      && !(await notes()).some((x) => /rura na wieszaki: w tym poziomie/.test(x.txt)));
  }
}

ok('bez błędów strony', errors.length === 0, errors.join(' | '));
await b.close();
