/* Audyt GPT 2026-10-28, ustalenia N90–N99 (`AUDYT_GPT.md` na galezi gpt/audyt-2026-10-16):
   - N90 rura na wieszaki w zamowieniu projektu — plan zakupu i ciecia, nie sam opis;
   - N91 „dopasuj półki” w kolumnie z podzialem — granice i fronty zostaja;
   - N93 podsumowanie rozkroju z wlasnymi kawalkami (wykorzystanie, ciecia);
   - N94 wlasny kawalek zostaje przy plycie, gdy etykieta dostaje grubosc;
   - N95 dwie wlasne plyty o tej samej nazwie — formularz nie pozwala;
   - N96 „dopasuj półki” z grubosci polek (korpus 16, polki 18);
   - N97 „dopasuj fronty” przy boku „auto” — bez NaN, proporcjonalnie;
   - N98 „głębokość zawiera drzwi” wedlug montazu frontow szuflad;
   - N99 kontrola „nie mieści się na arkuszu” z arkusza plyty wlasnej.
   N92 (zdejmowanie wlasciwej formatki) — w funkcjach rozkroju, test w `nest`. */
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
const seed = async (q) => {
  await page.evaluate((p) => { localStorage.clear(); localStorage.setItem('szafki:projekt', JSON.stringify(p)); }, { name: 'P', active: 0, prices: {}, runs: [], ...q });
  await page.reload({ waitUntil: 'networkidle' }); await page.waitForTimeout(1500);
};
const zap = async () => { await page.waitForTimeout(900); return page.evaluate(() => JSON.parse(localStorage.getItem('szafki:projekt'))); };
const rows = (re) => page.evaluate((src) => { const r = new RegExp(src);
  const sec = [...document.querySelectorAll('section')].find((s) => r.test(s.querySelector('h2')?.textContent || ''));
  return sec ? [...sec.querySelectorAll('tbody tr')].map((tr) => [...tr.children].map((x) => x.innerText.trim().replace(/\s+/g, ' ')).join(' | ')) : []; }, re.source);
const uwagi = async () => (await page.evaluate(() => [...document.querySelectorAll('section')].find((s) => /^Uwagi/.test(s.querySelector('h2')?.textContent || ''))?.innerText || ''));
const sekcja = (re) => page.locator('section').filter({ has: page.locator('h2', { hasText: re }) }).first();
const otworz = async (re) => { const s = sekcja(re); if ((await s.innerText()).length < 120) { await s.locator('h2').click(); await page.waitForTimeout(500); } return s; };
const fronty = async () => (await rows(/^Formatki do zamówienia$/)).filter((r) => /^(Drzwi|Front|Klapa)/.test(r));

console.log('== N90: rura na wieszaki w zamówieniu projektu ==');
{
  const szafa = (name) => ({ cab: { name, W: 600, H: 2100, D: 560, ...NOZKI, levels: [{ h: null, cols: [{ kind: 'doors', doors: 1, w: null, shelfTargets: [null], drazki: [0] }] }] }, runId: null, offset: 0 });
  await seed({ items: [szafa('A'), szafa('B')] });
  const r = (await rows(/^Produkty całego projektu/)).find((x) => /^Rura na wieszaki/.test(x)) || '';
  ok('projekt: „kupić 1 × 1,5 m … Cięcie: 1,5 m → 562 (A) + 562 (B)”, 1,5 mb', /kupić 1 × 1,5 m: potrzeba 1124 mm, odpad 376 mm/.test(r) && /Cięcie: 1,5 m → 562 \(A\) \+ 562 \(B\)/.test(r) && /1[.,]5 mb/.test(r), r);
  const s = (await rows(/^Produkty do zamówienia/)).find((x) => /^Rura na wieszaki/.test(x)) || '';
  ok('szafka: zakup 1 m i cięcie 562', /kupić 1 × 1 m/.test(s) && /562/.test(s), s);
}

console.log('\n== N91 / N96: „dopasuj półki” ==');
{
  await seed({ items: [{ cab: { name: 'S', W: 600, H: 1800, D: 560, ...NOZKI, levels: [{ h: null, cols: [{ kind: 'doors', doors: 2, w: null,
    shelfTargets: Array(11).fill(null), podzial: [7], segmenty: [{ doors: 1, hinge: 'right' }] }] }] }, runId: null, offset: 0 }] });
  const f0 = await fronty();
  await page.getByRole('button', { name: 'dopasuj półki', exact: true }).first().click(); await page.waitForTimeout(900);
  const c = (await zap()).items[0].cab.levels[0].cols[0];
  const f1 = await fronty();
  ok('podział zostaje (granica przeniesiona z półką), dolny poziom z zawiasem z prawej', JSON.stringify(c.podzial) === '[3]' && c.segmenty[0].hinge === 'right' && c.shelfTargets.length === 5, JSON.stringify(c));
  ok('fronty bez zmian: jedne 1300 i dwoje 490', JSON.stringify(f0) === JSON.stringify(f1) && f1.length === 2, `${f0.join(' / ')} → ${f1.join(' / ')}`);
  // korpus 16, polki 18 — swiatla co najmniej 250 mm (1 polka, a nie 2 po 249)
  await seed({ items: [{ cab: { name: 'S', W: 600, H: 816, D: 560, shelfSameAsBoard: false, ...NOZKI, levels: [{ h: null, cols: [{ kind: 'doors', doors: 1, w: null, shelfTargets: [null] }] }] },
    mat: M({ board: { name: 'Płyta', thickness: 16, color: '#d8c3a0' }, shelf: { name: 'Płyta', thickness: 18, color: '#d0bb96' } }), runId: null, offset: 0 }] });
  await page.getByRole('button', { name: 'dopasuj półki', exact: true }).first().click(); await page.waitForTimeout(900);
  const st = (await zap()).items[0].cab.levels[0].cols[0].shelfTargets;
  ok('korpus 16, półki 18: jedna półka (światła ≥ 250)', st.length === 2, JSON.stringify(st));
}

console.log('\n== N97: „dopasuj fronty” z bokiem auto ==');
{
  await seed({ items: [{ cab: { name: 'S', W: 600, H: 900, D: 560, ...NOZKI, levels: [{ h: null, cols: [{ kind: 'drawers', w: null,
    drawers: [{ h: 95, front: 150 }, { h: 'auto', front: 300 }, { h: 210, front: 440 }] }] }] }, runId: null, offset: 0 }] });
  await page.getByRole('button', { name: 'dopasuj fronty', exact: true }).first().click(); await page.waitForTimeout(900);
  const fr = (await zap()).items[0].cab.levels[0].cols[0].drawers.map((d) => d.front);
  ok('fronty to liczby (bez NaN / null), środkowy (bok auto) największy, dolny najmniejszy', fr.every((v) => Number.isFinite(v) && v > 0) && fr[1] > fr[2] && fr[2] > fr[0], JSON.stringify(fr));
}

console.log('\n== N98: „głębokość zawiera drzwi” a montaż frontów szuflad ==');
{
  const sz = (frontMode, drawerMode) => ({ items: [{ cab: { name: 'S', W: 600, H: 720, D: 560, frontMode, depthIncludesFront: true, ...NOZKI,
    levels: [{ h: null, cols: [{ kind: 'drawers', w: null, drawerMode, drawers: [{ system: 'dxs' }, { system: 'dxs' }] }] }] }, runId: null, offset: 0 }] });
  const bok = async () => Number(((await rows(/^Formatki do zamówienia$/)).find((r) => /^Bok/.test(r)) || '').split(' | ')[3]);
  await seed(sz('overlay', 'inset'));
  ok('A: szafka nakładana, szuflady „Wewnątrz” — korpus 560 (nic nie wystaje)', await bok() === 560, String(await bok()));
  await seed(sz('inset', 'overlay'));
  ok('B: szafka wpuszczana, szuflady „Na korpusie” — korpus 542', await bok() === 542, String(await bok()));
  ok('B: pole „Podana głębokość zawiera drzwi” widoczne', (await page.getByText('Podana głębokość zawiera drzwi', { exact: false }).count()) >= 1);
}

console.log('\n== N99: arkusz płyty własnej w kontroli formatek ==');
{
  const otwarta = (mat) => ({ plyty: [{ id: 'pw1', nazwa: 'Duża płyta', kolor: '#dddddd', grubosc: 18, arkusz: { w: 4000, h: 2500 }, cena: 0 }],
    items: [{ cab: { name: 'S', W: 3100, H: 600, D: 500, back: 'none', ...NOZKI, levels: [{ h: null, cols: [{ kind: 'open', w: null, shelfTargets: [null] }] }] }, mat, runId: null, offset: 0 }] });
  await seed(otwarta(M({ board: { name: 'Duża płyta', thickness: 18, color: '#dddddd', decor: 'Duża płyta', plyta: 'pw1' } })));
  ok('własna 4000 × 2500: bez błędu „nie mieści się na arkuszu”', !/nie mieści się na arkuszu/.test(await uwagi()), (await uwagi()).split('\n').filter((l) => /arkusz/.test(l)).join(' / '));
  await seed(otwarta(M()));
  ok('zwykła płyta: błąd zostaje (2761,2 × 2061,2)', /Dno \/ wieniec 3064 × 500 mm nie mieści się na arkuszu/.test(await uwagi()));
}

console.log('\n== N93 / N94: własne kawałki w rozkroju ==');
{
  const plyta = { name: 'Płyta', thickness: 18, color: '#d8c3a0', decor: 'Testowa' };
  const mala = (name, mat) => ({ cab: { name, W: 400, H: 400, D: 300, back: 'none', ...NOZKI, levels: [{ h: null, cols: [{ kind: 'open', w: null, shelfTargets: [null] }] }] }, mat, runId: null, offset: 0 });
  const RK = [{ id: 'rk1', matLabel: 'Płyta Testowa', matId: 'Płyta|#d8c3a0|Testowa|18', w: 1000, h: 800, qty: 1 }];
  await seed({ items: [mala('A', M({ board: plyta }))], resztki: RK });
  let rk = await otworz(/^Rozkrój/); await page.waitForTimeout(2500);
  let t = (await rk.innerText()).split('\n').find((l) => /z własnych kawałków/.test(l)) || '';
  ok('wszystko na własnym kawałku: „0 arkuszy + 1 z własnych kawałków”, wykorzystanie > 0 %, cięć > 0', /0 arkuszy \+ 1 z własnych kawałków/.test(t)
    && Number((t.match(/wykorzystanie ([\d.,]+)%/) || [])[1]?.replace(',', '.')) > 0 && Number((t.match(/cięć (\d+)/) || [])[1]) > 0, t);
  // druga szafka z ta sama nazwa plyty 16 mm — etykieta dostaje grubosc, kawalek dalej pasuje
  await seed({ items: [mala('A', M({ board: plyta })), mala('B', M({ board: { ...plyta, thickness: 16 } }))], resztki: RK });
  rk = await otworz(/^Rozkrój/); await page.waitForTimeout(2500);
  t = (await rk.innerText()).split('\n').filter((l) => /arkusz/.test(l)).join(' / ');
  ok('obok „Płyta Testowa 16”: grupa „… 18” dalej z własnego kawałka', /Płyta Testowa 18/.test(await rk.innerText()) && /\+ 1 z własnych kawałków/.test(t), t);
}

console.log('\n== N95: dwie własne płyty o tej samej nazwie ==');
{
  await seed({ plyty: [{ id: 'pw1', nazwa: 'Egger', kolor: '#ffffff', grubosc: 18, arkusz: { w: 2800, h: 2070 }, cena: 100 }],
    items: [{ cab: { name: 'S', W: 600, H: 720, D: 560, ...NOZKI, levels: [{ h: null, cols: [{ kind: 'doors', doors: 1, w: null, shelfTargets: [null] }] }] }, runId: null, offset: 0 }] });
  const plyty = await otworz(/^Płyty$/);
  await plyty.locator('[data-el="plyta-dodaj"]').first().click(); await page.waitForTimeout(300);
  const form = page.locator('[data-el="plyta-formularz"]');
  await form.locator('label', { hasText: 'Nazwa' }).locator('input').fill('Egger'); await page.waitForTimeout(150);
  await form.getByRole('button', { name: 'Dodaj i użyj', exact: true }).click(); await page.waitForTimeout(500);
  ok('ta sama nazwa: „Płyta „Egger” już jest — nadaj inną nazwę”, nic nie dodane', /już jest — nadaj inną nazwę/.test(await form.innerText()) && (await zap()).plyty.length === 1,
    (await form.innerText()).slice(0, 120));
  await form.locator('label', { hasText: 'Nazwa' }).locator('input').fill('Egger czarny'); await page.waitForTimeout(150);
  await form.getByRole('button', { name: 'Dodaj i użyj', exact: true }).click(); await page.waitForTimeout(600);
  ok('inna nazwa — dodana', (await zap()).plyty.map((q) => q.nazwa).join('|') === 'Egger|Egger czarny');
  // stary zapis z dwiema „Płyta własna” — druga dostaje numer
  await seed({ plyty: [{ id: 'a', nazwa: 'Płyta własna', grubosc: 18 }, { id: 'b', nazwa: 'Płyta własna', grubosc: 18 }],
    items: [{ cab: { name: 'S', W: 600, H: 720, D: 560, ...NOZKI, levels: [{ h: null, cols: [{ kind: 'doors', doors: 1, w: null, shelfTargets: [null] }] }] }, runId: null, offset: 0 }] });
  ok('wczytanie starego zapisu: „Płyta własna” i „Płyta własna (2)”', (await zap()).plyty.map((q) => q.nazwa).join('|') === 'Płyta własna|Płyta własna (2)', JSON.stringify((await zap()).plyty));
}

ok('bez błędów strony', errors.length === 0, errors.join(' | '));
await b.close();
