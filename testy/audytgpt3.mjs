/* Audyt GPT 2026-10-17, ustalenia N22–N33, oraz podpowiedzi przeniesione na
   ostrzezenia (uzytkownik 2026-10-17: „to powinno byc ostrzezenie, a nie uwaga”).
   Decyzje uzytkownika: N30 — samo ostrzezenie; N33 — jeden konfirmat posrodku
   + ostrzezenie o plytkiej szafce z przyciskiem do pola glebokosci. */
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
const proj = (items, runs = [], extra = {}) => ({ name: 'A', active: 0, prices: {}, runs, items: items.map((it) => ({ offset: 0, runId: null, ...it })), ...extra });
const seed = async (p) => {
  await page.evaluate((q) => { localStorage.clear(); localStorage.setItem('szafki:projekt', JSON.stringify(q)); }, p);
  await page.reload({ waitUntil: 'networkidle' }); await page.waitForTimeout(900);
};
const rows = (re) => page.evaluate((src) => { const r = new RegExp(src);
  const sec = [...document.querySelectorAll('section')].find((s) => r.test(s.querySelector('h2')?.textContent || ''));
  return sec ? [...sec.querySelectorAll('tbody tr')].map((tr) => [...tr.children].map((x) => x.innerText.trim().replace(/\s+/g, ' ')).join(' | ')) : []; }, re.source);
const uwagi = async () => (await page.evaluate(() => [...document.querySelectorAll('section')].find((s) => /^Uwagi/.test(s.querySelector('h2')?.textContent || ''))?.innerText || ''));
// ikona przy uwadze o danym tekscie: × blad, ! ostrzezenie, i podpowiedz
const ikona = (re) => page.evaluate((src) => { const r = new RegExp(src);
  const li = [...document.querySelectorAll('section li')].find((x) => r.test(x.textContent));
  return li ? ([...li.querySelectorAll('span.font-mono')].map((s) => s.textContent.trim()).find((t) => /^[×!i]$/.test(t)) || null) : null; }, re.source);
const linie = (t, re) => t.split('\n').filter((l) => re.test(l)).join(' / ');
const pick = async (l) => { const x = page.getByRole('button', { name: l, exact: true }); if (await x.count()) { await x.first().click(); await page.waitForTimeout(250); } };
const bryly = async () => {
  await pick('Szafka'); await pick('Zamk.');
  await page.evaluate(() => { window.__audytBryl = []; });
  await pick('3D'); await page.waitForTimeout(250);
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

console.log('== N22: przeszkoda poniżej szuflady nie skraca prowadnicy ==');
for (const [opis, obs, nl] of [['bez przeszkody', [], 550], ['przeszkoda na dole (0–118 mm)', [{ on: true, side: 'left', w: 80, d: 80, h: 100, fromSide: 0, fromBack: 0, fromBottom: 0, fullHeight: false, mask: false }], 550],
  ['przeszkoda na całą wysokość', [{ on: true, side: 'left', w: 80, d: 80, h: 100, fromSide: 0, fromBack: 0, fromBottom: 0, fullHeight: true, mask: false }], 450]]) {
  await seed(proj([{ cab: cab({ H: 1200, plinth: { on: false }, obstacles: obs,
    levels: [{ h: 500, cols: [{ kind: 'doors', doors: 1, w: null }] }, { h: null, cols: [{ kind: 'drawers', drawers: [{ h: null }], w: null }] }] }) }]));
  const h = (await rows(/^Produkty do zamówienia/)).find((r) => /Prowadnica/.test(r)) || '';
  ok(`${opis}: NL ${nl}`, new RegExp(`NL ${nl} mm`).test(h), h);
}

console.log('\n== N23: wysoka szafka w środku przerywa blat ciągu ==');
{
  const c = (n, H) => ({ cab: cab({ name: n, H }), runId: 'c1' });
  await seed(proj([c('A', 720), c('B', 2000), c('C', 720)], [{ id: 'c1', name: 'Ściana', wallW: null, gap: 0, mountY: 0, H: 720, D: 560, plinth: PL, worktop: true, corner: null }]));
  const bl = (await rows(/^Formatki całego projektu/)).filter((r) => /^Blat ciągu/.test(r));
  // dwa wiersze: kawalek z oklejonym lewym i z prawym koncem (koniec przy slupku bez oklejania)
  ok('720 / 2000 / 720: dwa kawałki 600 × 600, każdy z jednym oklejonym końcem', bl.length === 2 && bl.every((r) => /\| 600 \| 600 \| 1 \| bok 600$/.test(r)), bl.join(' / '));
  ok('bez złączy blatu (kawałki nie stykają się — między nimi słupek)', !(await rows(/^Produkty całego projektu/)).some((r) => /^Złącze do blatów/.test(r)));
}

console.log('\n== N24: ścianki zabudowy przeszkody — 3D jak zamówienie ==');
{
  let zle = 0, n = 0; const przyk = [];
  for (const side of ['left', 'right']) for (const maskType of ['auto', 'L', 'U']) for (const maskFront of ['over', 'between'])
  for (const maskCorner of ['auto', 'vertical']) for (const [fromSide, fromBack] of [[0, 0], [150, 30]]) {
    await seed(proj([{ cab: cab({ W: 800, H: 1000, obstacles: [{ on: true, side, w: 100, d: 100, h: 200, fromSide, fromBack, fromBottom: 100, fullHeight: false, mask: true, maskType, maskFront, maskCorner }] }) }]));
    const f = (await rows(/^Formatki do zamówienia/)).map((r) => r.split(' | ')).filter((r) => /^Zabudowa:/.test(r[0]))
      .flatMap((r) => Array(Number(r[4]) || 1).fill([18, Number(r[2]), Number(r[3])].sort((x, y) => x - y).join('×')));
    const s = (await bryly()).filter((x) => x.tag === 'zabudowa').map((x) => x.d.join('×'));
    n++;
    if ([...f].sort().join() !== [...s].sort().join() || !f.length) { zle++; if (przyk.length < 3) przyk.push(`${side}/${maskType}/${maskFront}/${maskCorner}/${fromSide},${fromBack}: ${f.join(',')} | 3D ${s.join(',')}`); }
  }
  ok(`${n} wariantów: ścianki w 3D = formatki`, zle === 0, przyk.join(' ; '));
}

console.log('\n== N25: „głębokość obejmuje plecy” przy plecach wewnątrz ==');
for (const [pos, bok] of [['inside', 560], ['outside', 542]]) {
  await seed(proj([{ cab: cab({ back: 'board', backPos: pos, depthIncludesBack: true }) }]));
  const r = (await rows(/^Formatki do zamówienia/)).find((x) => /^Bok/.test(x)) || '';
  ok(`plecy z płyty ${pos === 'inside' ? 'wewnątrz' : 'na zewnątrz'}: bok ${bok}`, new RegExp(`\\| 720 \\| ${bok} \\|`).test(r), r);
}

console.log('\n== N26: „głębokość obejmuje front” — blenda i sam fix ==');
for (const [opis, col] of [['blenda', { kind: 'blenda', w: null }], ['sam fix', { kind: 'doors', doors: 0, w: null, fix: { side: 'left', w: 596, mode: 'overlay', support: false, supportDepth: 100 } }]]) {
  await seed(proj([{ cab: cab({ back: 'none', depthIncludesFront: true, levels: [{ h: null, cols: [col] }] }) }]));
  const r = (await rows(/^Formatki do zamówienia/)).find((x) => /^Bok/.test(x)) || '';
  ok(`${opis}: bok 542 (560 − front 18)`, /\| 720 \| 542 \|/.test(r), r);
}

console.log('\n== N27: plecy z płyty półek — grubość i kolor w 3D ==');
await seed(proj([{ cab: cab({ realColors: true, shelfSameAsBoard: false, back: 'board', backPos: 'outside', backBoardMat: 'shelf' }),
  mat: { board: { color: '#ff0000' }, shelf: { thickness: 12, color: '#00ff00', name: 'Płyta' } } }]));
{
  const s = (await bryly()).filter((x) => x.d[1] === 600 && x.d[2] === 720);
  ok('plecy na zewnątrz z płyty półek 12 mm: bryła 12 × 600 × 720, kolor półek', s.length === 1 && s[0].d[0] === 12 && s[0].color === '#00ff00', s.map((x) => x.d.join('×') + ' ' + x.color).join(', '));
}

console.log('\n== N28: usunięcie wcześniejszej szafki nie zmienia aktywnej ==');
await seed(proj([{ cab: cab({ name: 'Pierwsza' }) }, { cab: cab({ name: 'Druga' }) }, { cab: cab({ name: 'Trzecia' }) }, { cab: cab({ name: 'Czwarta' }) }], [], { active: 2 }));
page.once('dialog', (d) => d.accept());
await page.getByTitle('Usuń szafkę').first().click(); await page.waitForTimeout(800);
{
  const st = await page.evaluate(() => { const p = JSON.parse(localStorage.getItem('szafki:projekt')); return [p.items.map((i) => i.cab.name).join(','), p.items[p.active].cab.name]; });
  ok('aktywna „Trzecia” zostaje aktywna po usunięciu „Pierwszej”', st[0] === 'Druga,Trzecia,Czwarta' && st[1] === 'Trzecia', JSON.stringify(st));
}

console.log('\n== N29: własna cena okucia nie znika przy zmianie ilości ==');
{
  // cena zapisana pod starym kluczem (nazwa | opis z iloscia) — dalej obowiazuje
  await seed(proj([{ cab: cab() }], [], { prices: { 'okucie:Konfirmat 7 × 50|złącza korpusu: wieniec 2×3, dno 2×3 szt.': 0.5 } }));
  const w = page.locator('section').filter({ has: page.locator('h2', { hasText: /^Wycena/ }) }).first();
  if ((await w.innerText()).split('\n').length < 4) { await w.locator('h2').first().click(); await page.waitForTimeout(400); }
  // wiersz wyceny: „… N szt. KWOTA” — kwota = N × cena
  const cena = async () => page.evaluate(() => { const sec = [...document.querySelectorAll('section')].find((s) => /^Wycena/.test(s.querySelector('h2')?.textContent || ''));
    const tr = sec && [...sec.querySelectorAll('tr')].find((r) => /^Konfirmat 7 × 50/.test(r.innerText.trim()));
    const m = tr && /(\d+) szt\.\s*([\d.,]+)\s*$/.exec(tr.innerText.replace(/\s+/g, ' ').trim());
    return m ? Number(m[2].replace(',', '.')) / Number(m[1]) : null; });
  ok('cena zapisana starym kluczem (0,5) obowiązuje', await cena() === 0.5, String(await cena()));
  // zmiana ilosci (szersza szafka — wiecej konfirmatow) — cena zostaje
  await seed(proj([{ cab: cab({ D: 700 }) }], [], { prices: { 'okucie:Konfirmat 7 × 50|złącza korpusu: wieniec 2×3, dno 2×3 szt.': 0.5 } }));
  const w2 = page.locator('section').filter({ has: page.locator('h2', { hasText: /^Wycena/ }) }).first();
  if ((await w2.innerText()).split('\n').length < 4) { await w2.locator('h2').first().click(); await page.waitForTimeout(400); }
  ok('po zmianie liczby konfirmatów (D700: 16 szt.) cena dalej 0,5', await cena() === 0.5, String(await cena()));
}

console.log('\n== N30: nóżki w płytkiej szafce ==');
await seed(proj([{ cab: cab({ D: 120, plinth: { on: false }, legs: { on: true, height: 100 } }) }]));
{
  const u = await uwagi();
  ok('D120: ostrzeżenie „rzędy nóżek nachodzą na siebie” z przyciskiem do głębokości', /przedni i tylny rząd nóżek nachodzą na siebie/.test(u) && /Popraw głębokość/.test(u)
    && (await ikona(/rząd nóżek nachodzą/)) === '!', linie(u, /nóżek/));
  const n = (await rows(/^Produkty do zamówienia/)).find((r) => /^Nóżka/.test(r)) || '';
  ok('liczba nóżek bez zmian (4)', /\| 4 szt\.$/.test(n), n);
}

console.log('\n== N31: szczelina nad przegrodą tylko przy przegrodzie ==');
for (const t of [10, 12]) {
  await seed(proj([{ cab: cab(), mat: { board: { thickness: t } } }]));
  ok(`korpus ${t} mm, jedna kolumna: bez błędu szczeliny nad przegrodą`, !/szczeliny/.test(await uwagi()), linie(await uwagi(), /szczelin/));
}
await seed(proj([{ cab: cab({ W: 800, levels: [{ h: null, cols: [{ kind: 'doors', doors: 1, w: null }, { kind: 'doors', doors: 1, w: null }] }] }), mat: { board: { thickness: 12 } } }]));
ok('korpus 12 mm, dwie kolumny: błąd szczeliny zostaje', /nad przegrodą tylko -?\d+ mm szczeliny/.test(await uwagi()), linie(await uwagi(), /szczelin/));

console.log('\n== N32: grubość płyty 0 / ujemna ==');
for (const t of [0, -1]) {
  await seed(proj([{ cab: cab({ frontMode: 'inset' }), mat: { board: { thickness: t } } }]));
  ok(`korpus ${t} mm: błąd „musi być większa od zera”`, /Grubość płyty korpusu -?\d+ mm.*musi być większa od zera/.test(await uwagi()), linie(await uwagi(), /Grubość/));
}

console.log('\n== N33: płytka szafka — jeden konfirmat pośrodku ==');
await seed(proj([{ cab: cab({ D: 80, plinth: { on: false } }) }]));
{
  const p = (await plan()).filter((r) => /konfirmat — wieniec/.test(r));
  ok('D80: plan wierceń „40 mm od przedniej krawędzi” (jeden, w połowie)', p.length > 0 && p.every((r) => /⌀7 w boku, 40 mm od przedniej krawędzi/.test(r)), p.join(' // '));
  const k = (await rows(/^Produkty do zamówienia/)).find((r) => /^Konfirmat/.test(r)) || '';
  ok('zamówienie: wieniec 2×1, dno 2×1 — 4 szt.', /wieniec 2×1, dno 2×1/.test(k) && /\| 4 szt\.$/.test(k), k);
  const u = await uwagi();
  ok('ostrzeżenie o płytkiej szafce z przyciskiem „Popraw głębokość”', /Szafka płytka \(80 mm\) — na styku płyt mieści się jeden konfirmat/.test(u) && /Popraw głębokość/.test(u), linie(u, /płytka/));
  await page.getByRole('button', { name: 'Popraw głębokość' }).first().click(); await page.waitForTimeout(500);
  const fokus = await page.evaluate(() => !!document.activeElement && !!document.activeElement.closest('[data-el="pole-glebokosc"]'));
  ok('„Popraw głębokość” ustawia kursor w polu głębokości (karta Korpus)', fokus);
}
await seed(proj([{ cab: cab({ plinth: { on: false } }) }]));
ok('D560: bez ostrzeżenia o płytkiej szafce', !/Szafka płytka/.test(await uwagi()));

console.log('\n== podpowiedzi → ostrzeżenia (użytkownik 2026-10-17) ==');
await seed(proj([{ cab: cab({ W: 601, levels: [{ h: null, cols: [{ kind: 'doors', doors: 2, w: null }] }] }) }]));
{
  const re = /przy równym podziale drzwi różnią się o/;
  ok('„drzwi różnią się o 1 mm” — ostrzeżenie (!)', (await ikona(re)) === '!', await ikona(re));
}
await seed(proj([{ cab: cab({ W: 900, plinth: { on: false }, legs: { on: true, height: 100, count: 4 } }) }]));
ok('„środek dna nie ma podpory” — ostrzeżenie (!)', (await ikona(/środek dna nie ma podpory/)) === '!', await ikona(/środek dna nie ma podpory/));

console.log('\nBLEDY:', errors.length ? errors.join('\n') : '(brak)');
await b.close();
