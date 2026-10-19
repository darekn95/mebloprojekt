/* Audyt GPT 2026-10-17, ustalenia N34–N48 (bez N45 — czeka na decyzje
   montazowa). Decyzje uzytkownika: N39 — martwe pole „Kąt otwarcia” usuniete;
   N47 — gorny ciag zostaje samodzielny na obecnej wysokosci, z wyraznym
   ostrzezeniem przed rozwiazaniem dolnego. */
import pw from './pw.mjs';
const URL = process.env.STD ? 'http://127.0.0.1:5199/standalone-local.html'
  : 'http://127.0.0.1:5205/mebloprojekt-app.html';
const ok = (l, c, e = '') => console.log((c ? '  OK   ' : '  BLAD ') + l + (e ? ' — ' + e : ''));
const b = await pw.chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const page = await (await b.newContext({ viewport: { width: 1500, height: 1300 } })).newPage();
const errors = []; page.on('pageerror', (e) => errors.push(e.message));
await page.goto(URL, { waitUntil: 'networkidle' });

const PL = { on: true, height: 100, mode: 'under', setback: 0 };
const cab = (o = {}) => ({ name: 'S', W: 600, H: 720, D: 560, plinth: PL, levels: [{ h: null, cols: [{ kind: 'doors', doors: 1, w: null }] }], ...o });
const kol = (o = {}) => ({ levels: [{ h: null, cols: [{ kind: 'doors', doors: 1, w: null, ...o }] }] });
const proj = (items, runs = [], extra = {}) => ({ name: 'A', active: 0, prices: {}, runs, items: items.map((it) => ({ offset: 0, runId: null, ...it })), ...extra });
const RUN = (id, o = {}) => ({ id, name: 'Ściana', wallW: null, gap: 0, mountY: 0, worktop: true, corner: null, ...o });
const seed = async (p) => {
  await page.evaluate((q) => { localStorage.clear(); localStorage.setItem('szafki:projekt', JSON.stringify(q)); }, p);
  await page.reload({ waitUntil: 'networkidle' }); await page.waitForTimeout(900);
};
const rows = (re) => page.evaluate((src) => { const r = new RegExp(src);
  const sec = [...document.querySelectorAll('section')].find((s) => r.test(s.querySelector('h2')?.textContent || ''));
  return sec ? [...sec.querySelectorAll('tbody tr')].map((tr) => [...tr.children].map((x) => x.innerText.trim().replace(/\s+/g, ' ')).join(' | ')) : []; }, re.source);
const uwagi = async () => (await page.evaluate(() => [...document.querySelectorAll('section')].find((s) => /^Uwagi/.test(s.querySelector('h2')?.textContent || ''))?.innerText || ''));
const ikona = (re) => page.evaluate((src) => { const r = new RegExp(src);
  const li = [...document.querySelectorAll('section li')].find((x) => r.test(x.textContent));
  return li ? ([...li.querySelectorAll('span.font-mono')].map((s) => s.textContent.trim()).find((t) => /^[×!i]$/.test(t)) || null) : null; }, re.source);
const linie = (t, re) => t.split('\n').filter((l) => re.test(l)).join(' / ');
const ilosc = (r) => (r ? Number((r.split('|').pop() || '').trim().split(' ')[0]) : null);
const okucie = async (re) => (await rows(/^Produkty do zamówienia/)).find((r) => re.test(r)) || '';
const zapis = () => page.evaluate(() => JSON.parse(localStorage.getItem('szafki:projekt')));
const pick = async (l) => { const x = page.getByRole('button', { name: l, exact: true }); if (await x.count()) { await x.first().click(); await page.waitForTimeout(250); } };
const bryly = async (zakres = 'Szafka') => {
  await pick(zakres); await pick('Zamk.');
  await page.evaluate(() => { window.__audytBryl = []; });
  await pick('3D'); await page.waitForTimeout(300);
  const s = await page.evaluate(() => { const a = window.__audytBryl; window.__audytBryl = null; return a; });
  await pick('Front');
  return (s || []).map((x) => ({ d: [...x.d].sort((p, q) => p - q).map(Math.round), color: x.color, tag: x.tag }));
};
const plan = async () => {
  await page.evaluate(() => { window.__rep = null; window.print = () => {
    window.__rep = [...document.querySelectorAll('.print-only table')].flatMap((t) => [...t.querySelectorAll('tbody tr')].map((tr) => tr.innerText.replace(/\s+/g, ' '))); }; });
  await page.getByRole('button', { name: 'Zestawienie PDF', exact: true }).first().click(); await page.waitForTimeout(900);
  return (await page.evaluate(() => window.__rep)) || [];
};

console.log('== N34: lustro zwiększa masę frontu przy doborze okuć ==');
{
  const klapa = (m) => cab({ W: 800, H: 400, D: 300, plinth: { on: false }, ...kol({ klapa: 'gora', mirrors: [m] }) });
  await seed(proj([{ cab: klapa(false) }]));
  const bez = await okucie(/^Podnośnik/);
  await seed(proj([{ cab: klapa(true) }]));
  const zL = await okucie(/^Podnośnik/);
  ok('klapa 800×400 bez lustra: 100 N, ok. 3,8 kg', /100 N/.test(bez) && /3,8 kg/.test(bez), bez);
  ok('z lustrem cięższa (ok. 7,0 kg) — inna siła niż bez lustra', /7,0 kg/.test(zL) && !/100 N/.test(zL), zL);
  const drzwi = (m) => cab({ H: 1450, plinth: { on: false }, ...kol({ mirrors: [m] }) });
  await seed(proj([{ cab: drzwi(false) }]));
  const z0 = ilosc(await okucie(/^Zawias/));
  await seed(proj([{ cab: drzwi(true) }]));
  const z1 = ilosc(await okucie(/^Zawias/));
  ok('drzwi 600×1450: z lustrem więcej zawiasów niż bez (3 → 5)', z0 === 3 && z1 === 5, `${z0} → ${z1}`);
}

console.log('\n== N35: wczytanie bieżącego zapisu nie prostuje ręcznych danych ==');
{
  const rails = [{ orient: 'front', fromBack: true, pos: 'top', h: 100, atDepth: 18 }];
  const ceny = { ciecie: 42, obrzeze: 2.75, oklejanie: 7.2 };
  const p = (nowy) => proj([{ cab: { ...cab(kol({ rails })), ...(nowy ? { version: 5 } : {}) } }], [], { prices: ceny, ...(nowy ? { wersja: 2 } : {}) });
  await seed(p(true));
  let z = await zapis();
  ok('bieżący zapis: własne ceny zostają', JSON.stringify(z.prices) === JSON.stringify(ceny), JSON.stringify(z.prices));
  ok('bieżący zapis: odsunięcie wzmocnienia 18 mm zostaje', z.items[0].cab.levels[0].cols[0].rails[0].atDepth === 18);
  ok('zapis niesie wersję projektu i szafki', z.wersja === 2 && z.items[0].cab.version === 5, `${z.wersja} / ${z.items[0].cab.version}`);
  await seed(p(false));
  z = await zapis();
  ok('stary zapis (bez wersji): dawne ceny netto ustępują, wzmocnienie prostowane', JSON.stringify(z.prices) === '{}' && z.items[0].cab.levels[0].cols[0].rails[0].atDepth === 0,
    JSON.stringify(z.prices) + ' / ' + z.items[0].cab.levels[0].cols[0].rails[0].atDepth);
}

console.log('\n== N36: własne wystawanie uchwytu działa na klapie ==');
for (const [ho, oczek] of [[0, null], [45, 45], [null, 20]]) {
  await seed(proj([{ cab: cab({ H: 400, D: 300, plinth: { on: false }, handleOut: 20, ...kol({ klapa: 'gora', handleOuts: [ho] }) }) }]));
  const u = (await bryly()).filter((x) => x.d[0] === 12 && x.d[2] === 240);
  ok(`klapa, uchwyt ${ho === null ? 'puste (szafka 20)' : ho + ' mm'}`, oczek === null ? u.length === 0 : u.length === 1 && u[0].d[1] === oczek,
    u.map((x) => x.d.join('×')).join(', ') || '(brak uchwytu)');
}

console.log('\n== N37: przeszkoda w strefie zawiasu ==');
{
  const prz = (o) => cab({ plinth: { on: false }, ...kol({ hinge: 'left' }),
    obstacles: [{ on: true, side: 'left', w: 80, d: 80, fromSide: 18, fromBack: 480, fullHeight: false, mask: false, maskType: 'auto', maskFront: 'over', ...o }] });
  await seed(proj([{ cab: prz({ h: 684, fromBottom: 0 }) }]));
  let u = await uwagi();
  ok('przeszkoda na całą wysokość przy zawiasach — błąd', /zawias 100, 614 mm od dołu frontu wypada na przeszkodzie/.test(u) && (await ikona(/wypada na przeszkodzie/)) === '×', linie(u, /przeszkod/));
  ok('…z przyciskiem przełożenia zawiasów', /Przełóż zawiasy na prawą/.test(u));
  await seed(proj([{ cab: prz({ h: 100, fromBottom: 0 }) }]));
  u = await uwagi();
  ok('krótka przeszkoda na dole — zawias ją omija (ostrzeżenie, notatka)', /zawias przesunięty z 100 na 173 mm od dołu frontu — kolizja z przeszkodą/.test(u) && !/wypada na przeszkodzie/.test(u), linie(u, /zawias/));
  await seed(proj([{ cab: prz({ h: 100, fromBottom: 400 }) }]));
  u = await uwagi();
  ok('przeszkoda między zawiasami — bez uwag o zawiasach', !/zawias/i.test(u), linie(u, /zawias/i));
  await seed(proj([{ cab: prz({ h: 684, fromBottom: 0, fromBack: 300 }) }]));
  u = await uwagi();
  ok('przeszkoda dalej niż 80 mm od lica — bez kolizji', !/wypada na przeszkodzie/.test(u), linie(u, /zawias/i));
}

console.log('\n== N38: kolumna szuflad z własnym montażem frontu ==');
{
  const sz = (fm, dm) => cab({ frontMode: fm, plinth: { on: false }, levels: [{ h: null, cols: [{ kind: 'drawers', drawerMode: dm, drawers: [{ h: null }, { h: null }], w: null }] }] });
  const fr = async () => (await rows(/^Formatki do zamówienia/)).filter((r) => /Front szuflady/.test(r)).join(' / ');
  await seed(proj([{ cab: sz('overlay', 'inherit') }]));
  const nak = await fr();
  await seed(proj([{ cab: sz('inset', 'overlay') }]));
  const mies = await fr();
  ok('szafka wpuszczana, szuflady nakładane: fronty jak w nakładanej (356 × 596)', /\| 356 \| 596 \| 2/.test(mies) && mies === nak, mies);
  await seed(proj([{ cab: sz('overlay', 'inset') }]));
  ok('szafka nakładana, szuflady wpuszczane: 339 × 560', /\| 339 \| 560 \| 2/.test(await fr()), await fr());
}

console.log('\n== N40: konfirmaty wspornika i płytszej półki z ich głębokości ==');
{
  await seed(proj([{ cab: cab({ back: 'none', shelfMount: 'confirmat', plinth: { on: false },
    ...kol({ hinge: 'left', shelfTargets: [null, null], fix: { side: 'left', w: 100, mode: 'overlay', support: true, supportDepth: 300 } }) }) }]));
  const k = await okucie(/^Konfirmat/);
  ok('zamówienie: 12 korpusu + 4 wspornika + 4 półki = 20', ilosc(k) === 20 && /wsporniki 2×2/.test(k) && /półki 2×2/.test(k), k);
  const pl = await plan();
  ok('plan: wspornik 300 mm — konfirmaty 50, 250 mm od przodu', pl.filter((r) => /konfirmat — wspornik pionowy.*50, 250 mm od przedniej/.test(r)).length === 2,
    pl.filter((r) => /wspornik pionowy/.test(r)).join(' // '));
  ok('plan: półka 260 mm — po dwa na stronę (350, 510)', pl.filter((r) => /konfirmat — półka.*350, 510 mm od przedniej/.test(r)).length === 2,
    pl.filter((r) => /konfirmat — półka/.test(r)).join(' // '));
}

console.log('\n== N41: wspornik fixu nie wchodzi w plecy ani za korpus ==');
{
  const wsp = (mode, sd) => cab({ back: 'board', backPos: 'inside', plinth: { on: false },
    ...kol({ hinge: 'right', fix: { side: 'left', w: 100, mode, support: true, supportDepth: sd } }) });
  await seed(proj([{ cab: wsp('overlay', 550) }]));
  let u = await uwagi();
  ok('nakładany 550 przy plecach z płyty wewnątrz — błąd „wchodzi w plecy”, max 542', /wspornik pionowy ma 550 mm .* tylko 542 mm — wchodzi w plecy/.test(u) && (await ikona(/wchodzi w plecy/)) === '×', linie(u, /wspornik/));
  const btn = page.getByRole('button', { name: 'Wspornik na 542 mm głębokości' });
  ok('przycisk „Wspornik na 542 mm głębokości”', (await btn.count()) === 1);
  if (await btn.count()) {
    // zapis projektu idzie z opoznieniem 800 ms
    await btn.first().click(); await page.waitForTimeout(1200);
    const z = await zapis();
    ok('…ustawia 542 mm i błąd znika', z.items[0].cab.levels[0].cols[0].fix.supportDepth === 542 && !/wchodzi w plecy/.test(await uwagi()));
  }
  await seed(proj([{ cab: wsp('inset', 550) }]));
  u = await uwagi();
  ok('fix wpuszczany 550 — „wystaje za korpus”, max 524', /tylko 524 mm — wystaje za korpus/.test(u), linie(u, /wspornik/));
}

console.log('\n== N42: fix w kolumnie szuflad zabiera pasmo frontom ==');
{
  const szf = (fix) => cab({ back: 'none', plinth: { on: false }, levels: [{ h: null, cols: [{ kind: 'drawers', drawers: [{ h: null }, { h: null }], w: null, fix }] }] });
  for (const side of ['left', 'right']) {
    await seed(proj([{ cab: szf({ side, w: 100, mode: 'overlay', support: false }) }]));
    const f = (await rows(/^Formatki do zamówienia/)).filter((r) => /Front szuflady/.test(r)).join(' / ');
    ok(`fix ${side === 'left' ? 'lewy' : 'prawy'} 100: fronty 496 mm, bez nachodzenia`, /\| 356 \| 496 \| 2/.test(f) && !/nachodz/i.test(await uwagi()), f);
  }
  await seed(proj([{ cab: szf({ side: 'top', w: 100, mode: 'overlay' }) }]));
  const f = (await rows(/^Formatki do zamówienia/)).filter((r) => /Front szuflady/.test(r));
  const suma = f.reduce((s, r) => s + Number(r.split('|')[2]) * Number(r.split('|')[4]), 0);
  ok('fix górny 100: fronty kończą się pod nim (razem 613 mm)', suma === 613, f.join(' / '));
}

console.log('\n== N43: zabudowa 3D — lustro i blenda jak w szafce ==');
for (const [opis, col, kolor] of [['lustro', { kind: 'doors', doors: 1, w: null, mirrors: [true] }, '#c3d0d6'], ['blenda', { kind: 'blenda', w: null }, '#00ff00']]) {
  await seed(proj([{ runId: 'c1', mat: { board: { color: '#ff0000' }, front: { color: '#00ff00' } },
    cab: cab({ plinth: { on: false }, realColors: true, frontSameAsBoard: false, levels: [{ h: null, cols: [col] }] }) }], [RUN('c1', { worktop: false })]));
  const fr = (await bryly('Ciąg')).filter((x) => x.d[0] === 18 && x.d[1] === 596 && x.d[2] === 714);
  ok(`${opis} w 3D ciągu: ${kolor}`, fr.length === 1 && fr[0].color === kolor, fr.map((x) => x.color).join(', '));
}

console.log('\n== N44: konfirmaty przegrody tylko do istniejących płyt ==');
for (const [opis, o, n, pl] of [['pełny', {}, 18, 2], ['bez wieńca', { joints: { topL: 'none', topR: 'none' } }, 9, 1],
  ['bez dna', { joints: { botL: 'none', botR: 'none' } }, 9, 1], ['blat na bokach', { top: { mode: 'blat', material: 'worktop' } }, 9, 1]]) {
  await seed(proj([{ cab: cab({ W: 800, H: 1200, back: 'none', plinth: { on: false }, ...o,
    levels: [{ h: null, cols: [{ kind: 'doors', doors: 0, w: null }, { kind: 'doors', doors: 0, w: null }] }] }) }]));
  const k = await okucie(/^Konfirmat/);
  const p = (await plan()).filter((r) => /konfirmat — przegroda/.test(r)).length;
  ok(`${opis}: ${n} konfirmatów, ${pl} wpis(y) przegrody w planie`, ilosc(k) === n && p === pl, `${k} | plan ${p}`);
}

console.log('\n== N46: górny ciąg liczy prześwit od blatu, nie od słupka ==');
{
  const low = (n, H) => ({ cab: cab({ name: n, H }), runId: 'c1' });
  const up = (n) => ({ cab: cab({ name: n, D: 300, plinth: { on: false } }), runId: 'c2' });
  const runs = [RUN('c1'), RUN('c2', { tier: 'gorny', wall: 'c1', clearance: 500, ceiling: 3000, worktop: false, plinth: null })];
  await seed(proj([low('A', 720), low('B', 720), low('C', 720), up('G1')], runs));
  const bez = linie(await uwagi(), /do sufitu/);
  await seed(proj([low('A', 720), low('B', 720), low('C', 2000), up('G1')], runs));
  const u = await uwagi();
  ok('słupek z prawej, górna nad lewą: wisi jak bez słupka (922 mm do sufitu)', /zostaje 922 mm do sufitu/.test(bez) && /zostaje 922 mm do sufitu/.test(u) && !/wchodzą w nią/.test(u), linie(u, /sufit|wchodz/));
  await seed(proj([low('A', 720), low('B', 720), low('C', 2000), up('G1'), up('G2'), up('G3')], runs));
  const u2 = await uwagi();
  ok('górna nad słupkiem — błąd kolizji', /„C” w ciągu dolnym sięga 2100 mm, a szafki górne nad nią \(„G3”\) zaczynają się na 1358 mm/.test(u2) && (await ikona(/wchodzą w nią/)) === '×', linie(u2, /wchodz/));
}

console.log('\n== N47: rozwiązanie dolnego ciągu z górnym nad nim ==');
{
  const runs = [RUN('c1'), RUN('c2', { tier: 'gorny', wall: 'c1', clearance: 500, worktop: false, plinth: null, mountY: 1358 })];
  await seed(proj([{ cab: cab({ name: 'D', H: 800 }), runId: 'c1' }, { cab: cab({ name: 'G', D: 300, plinth: { on: false } }), runId: 'c2' }], runs.map((r) => (r.id === 'c1' ? { ...r, wallW: 3000 } : r))));
  const btn = page.getByRole('button', { name: 'Rozwiąż ciąg — szafki zostają, wracają na wolnostojące' });
  await btn.first().click(); await page.waitForTimeout(400);
  const ostrz = page.locator('[data-el="rozwiaz-ostrzezenie"]');
  ok('najpierw ostrzeżenie o ciągu górnym (ciąg jeszcze jest)', (await ostrz.count()) === 1 && /Nad tym ciągiem wisi ciąg górny/.test(await ostrz.innerText()) && (await zapis()).runs.length === 2,
    (await ostrz.count()) ? (await ostrz.innerText()).slice(0, 160) : '(brak)');
  ok('…z obecną wysokością 1438 mm', (await ostrz.count()) && /1438 mm/.test(await ostrz.innerText()));
  await page.getByRole('button', { name: 'Anuluj', exact: true }).click(); await page.waitForTimeout(300);
  ok('Anuluj — nic się nie zmienia', (await ostrz.count()) === 0 && (await zapis()).runs.length === 2);
  await btn.first().click(); await page.waitForTimeout(300);
  await page.getByRole('button', { name: 'Rozwiąż mimo to', exact: true }).click(); await page.waitForTimeout(1200);
  const z = await zapis();
  const g = z.runs.find((r) => r.id === 'c2');
  ok('górny zostaje samodzielny: bez odwołania do c1, na 1438 mm, ściana 3000', z.runs.length === 1 && g && !g.wall && g.tier !== 'gorny' && g.mountY === 1438 && g.wallW === 3000,
    JSON.stringify(g && { tier: g.tier, wall: g.wall, mountY: g.mountY, wallW: g.wallW }));
  ok('szafki zostają (2)', z.items.length === 2);
  // bez górnego — rozwiązuje się od razu, bez pytania
  await seed(proj([{ cab: cab({ name: 'D' }), runId: 'c1' }], [RUN('c1')]));
  await btn.first().click(); await page.waitForTimeout(1200);
  ok('ciąg bez górnego — rozwiązany od razu', (await zapis()).runs.length === 0);
  // zapis z górnym bez dolnego (stary plik) — bez odwołania do nieistniejącego ciągu
  await seed(proj([{ cab: cab({ name: 'G', D: 300, plinth: { on: false } }), runId: 'c2' }], [RUN('c2', { tier: 'gorny', wall: 'c9', mountY: 1400, worktop: false })]));
  const z2 = await zapis();
  ok('wczytany górny bez dolnego: samodzielny na zapisanej wysokości', !z2.runs[0].wall && z2.runs[0].mountY === 1400, JSON.stringify({ tier: z2.runs[0].tier, wall: z2.runs[0].wall }));
}

console.log('\n== N48: blat przy frontach wpuszczanych ==');
for (const [fm, gl, msg] of [['overlay', 613, true], ['inset', 600, false]]) {
  await seed(proj([{ cab: cab({ D: 580, frontMode: fm, back: 'hdf', backPos: 'nailed', depthIncludesBack: false }), runId: 'c1' }], [RUN('c1')]));
  const r = (await rows(/^Formatki całego projektu/)).find((x) => /Blat ciągu/.test(x)) || '';
  const u = await uwagi();
  ok(`${fm}: blat ${gl} mm${msg ? ', uwaga „za głębokie”' : ', bez uwagi'}`, r.includes(`| 600 | ${gl} |`) && /Szafki są za głębokie/.test(u) === msg, r + ' || ' + linie(u, /Blat wychodzi/));
}

console.log('\n== N39: pola „Kąt otwarcia” nie ma ==');
{
  await seed(proj([{ cab: cab() }]));
  ok('brak pola „Kąt otwarcia”', !(await page.evaluate(() => [...document.querySelectorAll('label, span, div')].some((e) => e.childElementCount === 0 && /^Kąt otwarcia$/.test(e.textContent.trim())))));
}

console.log('\nBLEDY STRONY:', errors.join(' | ') || '(brak)');
await b.close();
