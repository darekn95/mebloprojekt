/* Komentarze uzytkownika z artefaktu (2026-10-17), zrobione od razu na jego
   prosbe („od razu w miedzyczasie mozesz naprawiac komentarze”):
   - „Luzy drzwi” nad „Struktura wnetrza”;
   - opis pola „Luz w rogu”;
   - podzial cokolu i blatu zwiniety za polem wyboru;
   - klikniecie nazwy formatki podswietla ja na rysunku 3D;
   - polka -> nowy poziom, „klapy zamiast drzwi” (pod polem drzwi);
   - kontrola zuzycia blatu (brakuje do 200 mm) i duzy odpad arkusza (< 15%). */
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
const RUN = (id, o = {}) => ({ id, name: 'Ściana ' + id, wallW: null, gap: 0, mountY: 0, worktop: true, corner: null, ...o });
const seed = async (p) => {
  await page.evaluate((q) => { localStorage.clear(); localStorage.setItem('szafki:projekt', JSON.stringify(q)); }, p);
  await page.reload({ waitUntil: 'networkidle' }); await page.waitForTimeout(1200);
};
const zapis = () => page.evaluate(() => JSON.parse(localStorage.getItem('szafki:projekt')));
const odpad = () => page.evaluate(() => [...document.querySelectorAll('[data-el="rozkroj-odpad"]')].map((e) => e.textContent.trim()));

console.log('== „Luzy drzwi” nad „Strukturą wnętrza” ==');
await seed(proj([{ cab: cab() }]));
const karty = await page.evaluate(() => [...document.querySelectorAll('section h2')].map((h) => h.textContent.trim()));
ok('kolejność kart', karty.findIndex((t) => /^Luzy drzwi/.test(t)) >= 0 && karty.findIndex((t) => /^Luzy drzwi/.test(t)) < karty.findIndex((t) => /^Struktura wnętrza/.test(t)));

console.log('\n== podświetlenie formatki ==');
const nazwy = await page.evaluate(() => [...document.querySelectorAll('[data-el="formatka-nazwa"]')].map((e) => e.textContent.trim()));
ok('nazwy formatek klikalne', nazwy.includes('Bok') && nazwy.includes('Dno / wieniec'), nazwy.join(', '));
await page.evaluate(() => { window.__audytBryl = []; });
await page.getByRole('button', { name: 'Dno / wieniec', exact: true }).first().click(); await page.waitForTimeout(600);
const nieb = await page.evaluate(() => { const a = window.__audytBryl || []; window.__audytBryl = null; return a.filter((x) => x.color === '#2563eb').map((x) => x.d.map(Math.round).join('×')); });
ok('3D: dno i wieniec na niebiesko', nieb.length === 2 && nieb.every((d) => d === '564×18×560'), nieb.join(', '));
ok('pasek „Podświetlona: …” z „zdejmij”', /Podświetlona: Dno \/ wieniec/.test(await page.evaluate(() => document.querySelector('[data-el="podswietlona"]')?.textContent || '')));
await page.getByRole('button', { name: 'Dno / wieniec', exact: true }).first().click(); await page.waitForTimeout(400);
ok('drugi klik zdejmuje podświetlenie', (await page.locator('[data-el="podswietlona"]').count()) === 0);

console.log('\n== półka → poziom, półki → klapy ==');
await seed(proj([{ cab: cab({ levels: [{ h: null, cols: [{ kind: 'doors', doors: 2, w: null, shelfTargets: [null, null] }] }] }) }]));
// od 2026-10-24 kreator: ile klap, granice, otwieranie — domyslnie klapa na kazdej polce, gdy sie miesci
await page.getByRole('button', { name: 'klapy zamiast drzwi…' }).first().click(); await page.waitForTimeout(500);
await page.getByRole('button', { name: 'Zrób 2 klapy', exact: true }).first().click(); await page.waitForTimeout(1500);
let lv = (await zapis()).items[0].cab.levels;
ok('dwa poziomy, w każdym klapa do góry, bez półek', lv.length === 2 && lv.every((l) => l.cols[0].klapa === 'gora' && l.cols[0].doors === 1 && l.cols[0].shelfTargets.length === 1)
  && lv[0].h > 0 && lv[1].h === null, JSON.stringify(lv.map((l) => ({ h: l.h, k: l.cols[0].klapa }))));
await seed(proj([{ cab: cab({ levels: [{ h: null, cols: [{ kind: 'doors', doors: 1, w: null, shelfTargets: [null, null, null] }] }] }) }]));
ok('„→ poziom” przy każdej półce (2)', (await page.getByRole('button', { name: '→ poziom', exact: true }).count()) === 2);
await page.getByRole('button', { name: '→ poziom', exact: true }).last().click(); await page.waitForTimeout(1500);
lv = (await zapis()).items[0].cab.levels;
ok('dolna półka → poziom: niżej 0 półek, wyżej 1', lv.length === 2 && lv[0].cols[0].shelfTargets.length === 1 && lv[1].cols[0].shelfTargets.length === 2 && lv[0].cols[0].doors === 1 && lv[1].cols[0].doors === 1,
  JSON.stringify(lv.map((l) => ({ h: l.h, s: l.cols[0].shelfTargets.length - 1 }))));

// kilka kolumn: dzieli sie caly poziom, inne kolumny zachowuja swoje polki ponizej/powyzej
await seed(proj([{ cab: cab({ W: 800, levels: [{ h: null, cols: [{ kind: 'doors', doors: 1, w: null, shelfTargets: [null, null] }, { kind: 'doors', doors: 1, w: null, shelfTargets: [null, null, null] }] }] }) }]));
ok('„→ poziom” także w poziomie z dwiema kolumnami', (await page.getByRole('button', { name: '→ poziom', exact: true }).count()) === 3);
await page.getByRole('button', { name: '→ poziom', exact: true }).last().click(); await page.waitForTimeout(600);
// przy kilku kolumnach najpierw ostrzezenie, ze poziom dzieli cala szafke (uzytkownik 2026-10-24)
const ostrz = page.locator('[data-el="poziom-cala-szafka"]');
ok('kilka kolumn: najpierw „Poziom idzie przez całą szerokość szafki… kolumnie 1… drzwi dzielą się”, bez zmian w projekcie',
  /Poziom idzie przez całą szerokość szafki/.test(await ostrz.innerText().catch(() => '')) && /kolumnie 1/.test(await ostrz.innerText())
  && /drzwi dzielą się/.test(await ostrz.innerText()) && (await zapis()).items[0].cab.levels.length === 1, await ostrz.innerText().catch(() => ''));
await ostrz.getByRole('button', { name: 'Anuluj', exact: true }).click(); await page.waitForTimeout(400);
ok('„Anuluj”: jeden poziom, ostrzeżenie znika', (await zapis()).items[0].cab.levels.length === 1 && (await ostrz.count()) === 0);
await page.getByRole('button', { name: '→ poziom', exact: true }).last().click(); await page.waitForTimeout(400);
await ostrz.getByRole('button', { name: 'Podziel całą szafkę', exact: true }).click(); await page.waitForTimeout(1500);
lv = (await zapis()).items[0].cab.levels;
ok('dwa poziomy po dwie kolumny, drzwi w obu', lv.length === 2 && lv.every((l) => l.cols.length === 2 && l.cols.every((c) => c.doors === 1)), JSON.stringify(lv.map((l) => ({ h: l.h, s: l.cols.map((c) => c.shelfTargets.length - 1) }))));
// rura w kolumnie obok idzie tylko do poziomu, w ktorym wisi (uzytkownik 2026-10-24: rura w kazdym poziomie)
await seed(proj([{ cab: cab({ W: 1200, H: 2000, levels: [{ h: null, cols: [{ kind: 'doors', doors: 1, w: null, shelfTargets: [null, null, null] },
  { kind: 'doors', doors: 1, w: null, shelfTargets: [400, null], drazki: [1] }] }] }) }]));
await page.getByRole('button', { name: '→ poziom', exact: true }).first().click(); await page.waitForTimeout(400);
await page.locator('[data-el="poziom-cala-szafka"]').getByRole('button', { name: 'Podziel całą szafkę', exact: true }).click(); await page.waitForTimeout(1500);
lv = (await zapis()).items[0].cab.levels;
ok('rura kolumny 2 tylko w jednym poziomie (tym, w którym wisi)', lv.filter((l) => (l.cols[1].drazki || []).length).length === 1,
  JSON.stringify(lv.map((l) => l.cols[1].drazki || null)));
await seed(proj([{ cab: cab({ W: 800, levels: [{ h: null, cols: [{ kind: 'doors', doors: 1, w: null, shelfTargets: [null, null] }, { kind: 'drawers', w: null, drawers: [{ h: null }, { h: null }] }] }] }) }]));
ok('z kolumną szuflad — bez „→ poziom”', (await page.getByRole('button', { name: '→ poziom', exact: true }).count()) === 0);

console.log('\n== podział cokołu i blatu zwinięty ==');
await seed(proj([1200, 1200, 1200, 900].map((W) => ({ cab: cab({ W }), runId: 'c1' })), [RUN('c1')]));
const zw = await page.evaluate(() => [...document.querySelectorAll('label[data-el^="podzial-"]')].map((e) => e.textContent.trim()));
ok('oba zwinięte, z podsumowaniem cięć', zw.length === 2 && zw.some((t) => /^Podział cokołu— cięcie na 2400 mm \(auto\)/.test(t)) && zw.some((t) => /^Podział blatu— cięcie na 3600 mm \(auto\)/.test(t)), zw.join(' // '));
await page.evaluate(() => document.querySelector('label[data-el="podzial-blat"] input').click()); await page.waitForTimeout(300);
ok('pole wyboru rozwija podział blatu (styki do zaznaczenia)', await page.evaluate(() => { const g = document.querySelector('span[data-el="podzial-blat"]'); return !!g; }));

console.log('\n== kontrola zużycia blatu i odpadu arkusza ==');
await seed(proj([1200, 1200, 1200, 600].map((W) => ({ cab: cab({ W }), runId: 'c1' })), [RUN('c1')]));
let o = await odpad();
ok('blat 4200: brakuje 103 mm do jednego arkusza', o.some((t) => /brakuje 103 mm/.test(t) && /3600 → 3497/.test(t)), o.join(' // '));
// to samo w karcie „Uwagi” (komentarz uzytkownika 2026-10-17: „czemu tego nie ma w ostrzezeniach?”)
const uw = await page.evaluate(() => [...document.querySelectorAll('section')].find((s) => /^Uwagi/.test(s.querySelector('h2')?.textContent || ''))?.innerText || '');
ok('…i w „Uwagach” jako ostrzeżenie', /Rozkrój — [^\n]*do zmieszczenia na jednym arkuszu zamiast 2 brakuje 103 mm/.test(uw), uw.split('\n').filter((l) => /Rozkrój/.test(l)).join(' / '));
await seed(proj([1200, 1200, 1200, 1000].map((W) => ({ cab: cab({ W }), runId: 'c1' })), [RUN('c1')]));
ok('blat 4600 (brakuje ponad 200 mm) — bez ostrzeżenia', !(await odpad()).some((t) => /^! Blat/.test(t)));
await seed(proj([{ cab: cab({ W: 300, H: 400, D: 300, plinth: { on: false }, back: 'none', extraParts: [{ name: 'Duża', a: 2700, b: 2000, qty: 1, matKey: 'board' }] }) }]));
o = await odpad();
ok('arkusz 2 z 2 wykorzystany poniżej 15% — ostrzeżenie', o.some((t) => /Arkusz 2 z 2 wykorzystany tylko w/.test(t)), o.join(' // '));
ok('…i w „Uwagach”', /Rozkrój — [^\n]*Arkusz 2 z 2 wykorzystany tylko w/.test(await page.evaluate(() => [...document.querySelectorAll('section')].find((s) => /^Uwagi/.test(s.querySelector('h2')?.textContent || ''))?.innerText || '')));

console.log('\n== oklejanie: wzmocnienia i bok ramienia ==');
// szafka pod blatem roboczym bez wienca — para wzmocnien (plaskie z przodu, stojace z tylu)
const okl = async (re) => page.evaluate((src) => { const r = new RegExp(src);
  return [...document.querySelectorAll('section')].filter((s) => /^Formatki/.test(s.querySelector('h2')?.textContent || ''))
    .flatMap((s) => [...s.querySelectorAll('tbody tr')]).filter((tr) => r.test(tr.children[0].innerText))
    .map((tr) => tr.children[0].innerText.trim() + ': ' + [...tr.querySelectorAll('button[title]')].filter((x) => /Oklejona/.test(x.title)).map((x) => x.innerText.trim()).join(', ')); }, re.source);
await seed(proj([{ cab: cab({ joints: { topL: 'none', topR: 'none' }, levels: [{ h: null, cols: [{ kind: 'doors', doors: 1, w: null,
  rails: [{ orient: 'shelf', pos: 'top', depth: 100 }, { orient: 'front', pos: 'top', h: 100, fromBack: true, atDepth: 0 }, { orient: 'vertical', side: 'left', pos: 'top', h: 200, depth: 300 }] }] }] }) }]));
const w = await okl(/^Wzmocnienie/);
ok('wzmocnienie poziome i pionowe — oklejona przednia krawędź', w.some((t) => /^Wzmocnienie poziome: przód/.test(t)) && w.some((t) => /^Wzmocnienie pionowe: przód/.test(t)), w.join(' / '));
await seed(proj([{ cab: cab({ name: 'L', W: 900, corner: { on: true, arm: 640, doors: 'wsporniki' } }), runId: 'c1' }, { cab: cab({ name: 'B' }), runId: 'c2' }],
  [RUN('c1', { worktop: false }), RUN('c2', { worktop: false, corner: { of: 'c1', at: 'end', owner: 'of', clear: 0 } })]));
const br = await page.evaluate(() => { const sec = [...document.querySelectorAll('section')].find((s) => /^Formatki całego projektu/.test(s.querySelector('h2')?.textContent || ''));
  const tr = sec && [...sec.querySelectorAll('tbody tr')].find((x) => /^Bok ramienia/.test(x.children[0].innerText.trim()));
  return tr ? tr.innerText : ''; });
ok('bok ramienia — czoło oraz góra i dół, jak bok korpusu', /przód 720, bok 560, bok 560/.test(br), br.replace(/\s+/g, ' '));

console.log('\n== opis „Luz w rogu” ==');
await seed(proj([{ cab: cab({ name: 'A' }), runId: 'c1' }, { cab: cab({ name: 'B' }), runId: 'c2' }],
  [RUN('c1'), RUN('c2', { corner: { of: 'c1', at: 'end', owner: 'of', clear: 0 } })], { active: 1 }));
ok('pod polem jest opis', /Dodatkowa przerwa w rogu/.test(await page.evaluate(() => document.querySelector('[data-el="luz-w-rogu-opis"]')?.textContent || '')));

/* Uwaga uzytkownika 2026-10-19: z tylu podpisane wzmocnienia, a polki i przegrody
   nie — teraz kazda z nazwa i wysokoscia od dolu korpusu (polka do spodu, jak w planie
   wiercen; przegroda od–do), podpis przegrody w wolnym miejscu miedzy polkami. */
console.log('\n== widok z tyłu: półki i przegroda podpisane ==');
await seed(proj([{ cab: cab({ W: 900, levels: [{ h: null, cols: [{ kind: 'doors', doors: 1, w: null, shelfTargets: [null, null] }, { kind: 'doors', doors: 1, w: null, shelfTargets: [null, null] }] }] }) }]));
for (const n of ['Szafka', 'Z tyłu']) { const x = page.getByRole('button', { name: n, exact: true }); if (await x.count()) { await x.first().click(); await page.waitForTimeout(500); } }
const tyl = await page.evaluate(() => [...document.querySelectorAll('#rysunek [data-el^="tyl-"] text')].map((t) => t.textContent.trim()));
ok('dwie półki „półka … · spód … od dołu”', tyl.filter((t) => /^półka \d+ · spód \d+ od dołu$/.test(t)).length === 2, tyl.join(' | '));
ok('przegroda „przegroda … · od … do …”', tyl.some((t) => /^przegroda \d+ · od \d+ do \d+$/.test(t)), tyl.join(' | '));
const naklad = await page.evaluate(() => {
  const r = (el) => el.getBoundingClientRect();
  const pp = [...document.querySelectorAll('#rysunek [data-el="tyl-przegroda"] text')].map(r);
  const pl = [...document.querySelectorAll('#rysunek [data-el="tyl-polka"] text')].map(r);
  return pp.some((a) => pl.some((b) => a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom));
});
ok('podpis przegrody nie nachodzi na podpisy półek', !naklad);

console.log('\nBLEDY STRONY:', errors.join(' | ') || '(brak)');
await b.close();
