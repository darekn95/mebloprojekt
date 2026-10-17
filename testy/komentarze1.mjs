/* Komentarze uzytkownika z artefaktu (2026-10-17), zrobione od razu na jego
   prosbe („od razu w miedzyczasie mozesz naprawiac komentarze”):
   - „Luzy drzwi” nad „Struktura wnetrza”;
   - opis pola „Luz w rogu”;
   - podzial cokolu i blatu zwiniety za polem wyboru;
   - klikniecie nazwy formatki podswietla ja na rysunku 3D;
   - polka -> nowy poziom, „półki → poziomy z klapami”;
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
await page.getByRole('button', { name: 'półki → poziomy z klapami' }).first().click(); await page.waitForTimeout(1500);
let lv = (await zapis()).items[0].cab.levels;
ok('dwa poziomy, w każdym klapa do góry, bez półek', lv.length === 2 && lv.every((l) => l.cols[0].klapa === 'gora' && l.cols[0].doors === 1 && l.cols[0].shelfTargets.length === 1)
  && lv[0].h > 0 && lv[1].h === null, JSON.stringify(lv.map((l) => ({ h: l.h, k: l.cols[0].klapa }))));
await seed(proj([{ cab: cab({ levels: [{ h: null, cols: [{ kind: 'doors', doors: 1, w: null, shelfTargets: [null, null, null] }] }] }) }]));
ok('„→ poziom” przy każdej półce (2)', (await page.getByRole('button', { name: '→ poziom', exact: true }).count()) === 2);
await page.getByRole('button', { name: '→ poziom', exact: true }).last().click(); await page.waitForTimeout(1500);
lv = (await zapis()).items[0].cab.levels;
ok('dolna półka → poziom: niżej 0 półek, wyżej 1', lv.length === 2 && lv[0].cols[0].shelfTargets.length === 1 && lv[1].cols[0].shelfTargets.length === 2 && lv[0].cols[0].doors === 1 && lv[1].cols[0].doors === 1,
  JSON.stringify(lv.map((l) => ({ h: l.h, s: l.cols[0].shelfTargets.length - 1 }))));

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
await seed(proj([1200, 1200, 1200, 1000].map((W) => ({ cab: cab({ W }), runId: 'c1' })), [RUN('c1')]));
ok('blat 4600 (brakuje ponad 200 mm) — bez ostrzeżenia', !(await odpad()).some((t) => /^! Blat/.test(t)));
await seed(proj([{ cab: cab({ W: 300, H: 400, D: 300, plinth: { on: false }, back: 'none', extraParts: [{ name: 'Duża', a: 2700, b: 2000, qty: 1, matKey: 'board' }] }) }]));
o = await odpad();
ok('arkusz 2 z 2 wykorzystany poniżej 15% — ostrzeżenie', o.some((t) => /Arkusz 2 z 2 wykorzystany tylko w/.test(t)), o.join(' // '));

console.log('\n== opis „Luz w rogu” ==');
await seed(proj([{ cab: cab({ name: 'A' }), runId: 'c1' }, { cab: cab({ name: 'B' }), runId: 'c2' }],
  [RUN('c1'), RUN('c2', { corner: { of: 'c1', at: 'end', owner: 'of', clear: 0 } })], { active: 1 }));
ok('pod polem jest opis', /Dodatkowa przerwa w rogu/.test(await page.evaluate(() => document.querySelector('[data-el="luz-w-rogu-opis"]')?.textContent || '')));

console.log('\nBLEDY STRONY:', errors.join(' | ') || '(brak)');
await b.close();
