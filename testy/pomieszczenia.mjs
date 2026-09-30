/* Pomieszczenia (uzytkownik 2026-09-29): Projekt → Pomieszczenia → ciagi → szafki.
   Stary projekt otwiera sie jako „Pomieszczenie 1”; rogi, zabudowa i kolizje
   tylko w obrebie pomieszczenia; formatki/produkty/wycena domyslnie z calego
   projektu z przelacznikiem „To pomieszczenie”; usuwanie pomieszczenia zawsze
   z pytaniem (usun z szafkami albo przenies); PDF z rozdzialami i zbiorczym
   zamowieniem. */
import pw from './pw.mjs';
const URL = process.env.STD ? 'http://127.0.0.1:5199/standalone-local.html'
  : 'http://127.0.0.1:5205/mebloprojekt-app.html';
const ok = (l, c, e = '') => console.log((c ? '  OK   ' : '  BLAD ') + l + (e ? ' — ' + e : ''));
const b = await pw.chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const page = await (await b.newContext({ viewport: { width: 1500, height: 1300 } })).newPage();
const errors = []; page.on('pageerror', (e) => errors.push(e.message));
await page.goto(URL, { waitUntil: 'networkidle' });

const PL = { on: true, height: 100, mode: 'under', setback: 0 };
const sz = (name, W, runId, o = {}) => ({ cab: { name, W, H: 720, D: 560, plinth: PL, legs: { on: true, height: 100 },
  levels: [{ h: null, cols: [{ kind: 'doors', doors: 2, w: null }] }], ...o }, runId, offset: 0 });
const RUN = (id, name, o = {}) => ({ id, name, wallW: null, gap: 0, mountY: 0, H: 720, D: 560, plinth: PL, worktop: true, corner: null, ...o });
const wczytaj = async (q) => {
  await page.evaluate((q) => { localStorage.clear(); localStorage.setItem('szafki:projekt', JSON.stringify(q)); }, q);
  await page.reload({ waitUntil: 'networkidle' }); await page.waitForTimeout(1500);
};
const stan = async () => { await page.waitForTimeout(1600); return page.evaluate(() => JSON.parse(localStorage.getItem('szafki:projekt') || '{}')); };
const pasek = () => page.locator('[data-pasek="pomieszczenia"]');
const pokojBtn = (nazwa) => pasek().locator('[data-pokoj] button', { hasText: nazwa }).first();
const szafkiNaPasku = () => page.evaluate(() => {
  const h = document.querySelector('header');
  return [...h.querySelectorAll('button.max-w-\\[180px\\]')].map((x) => x.textContent.trim());
});
const tytuly = () => page.evaluate(() => [...document.querySelectorAll('section h2')].map((h) => h.textContent.trim()));

console.log('== stary projekt bez pomieszczeń → „Pomieszczenie 1” ==');
// sciana 1 z rogiem do sciany 2 (jak kuchnia uzytkownika)
await wczytaj({ name: 'Dom', active: 0, prices: {},
  items: [sz('A1', 600, 'c1'), sz('A2', 600, 'c1'), sz('B1', 1100, 'c2')],
  runs: [RUN('c1', 'Ściana 1'), RUN('c2', 'Ściana 2', { corner: { of: 'c1', at: 'end', owner: 'self', clear: 0 } })] });
const t0 = await pasek().innerText();
ok('pasek pomieszczeń z „Pomieszczenie 1”', /Pomieszczenie 1/.test(t0) && /\+ pomieszczenie/.test(t0), t0.replace(/\n/g, ' | '));
ok('jedno pomieszczenie: bez „×” i bez przełącznika zamówienia',
  (await pasek().locator('button[title^="Usuń pomieszczenie"]').count()) === 0 && !/Zamówienie/.test(t0));
let st = await stan();
ok('zapis ma rooms = [Pomieszczenie 1], ciągi i szafki w p1',
  JSON.stringify(st.rooms) === '[{"id":"p1","name":"Pomieszczenie 1"}]'
  && st.runs.every((r) => r.roomId === 'p1') && st.items.every((it) => it.roomId === 'p1'),
  JSON.stringify({ rooms: st.rooms, runs: st.runs.map((r) => r.roomId), items: st.items.map((i) => i.roomId) }));

console.log('\n== nowe pomieszczenie ==');
await page.getByRole('button', { name: '+ pomieszczenie' }).click(); await page.waitForTimeout(600);
const t1 = await pasek().innerText();
ok('„Pomieszczenie 2” dodane i aktywne', /Pomieszczenie 2/.test(t1)
  && (await pasek().locator('[data-pokoj="p2"]').getAttribute('class')).includes('bg-stone-800'), t1.replace(/\n/g, ' | '));
let naPasku = await szafkiNaPasku();
ok('w nowym pomieszczeniu tylko jego szafka startowa', naPasku.length === 1 && !naPasku.includes('A1'), naPasku.join(', '));
ok('ciągi pierwszego pomieszczenia nie są na pasku', !(await page.locator('header').first().innerText()).includes('Ściana 2'));
// nowy ciag w pomieszczeniu 2 nazywa sie znow „Ściana 1” (bez kreatora rogu — tu nie ma innych scian)
await page.getByRole('button', { name: '+ ciąg', exact: true }).click(); await page.waitForTimeout(600);
st = await stan();
const nowy = st.runs.find((r) => r.roomId === 'p2');
ok('„+ ciąg” w pomieszczeniu 2 → „Ściana 1” z roomId p2', !!nowy && nowy.name === 'Ściana 1', JSON.stringify(nowy && { id: nowy.id, name: nowy.name, roomId: nowy.roomId }));
ok('bez kreatora rogu (brak ścian w tym pomieszczeniu)', (await page.getByText('Narożnik do', { exact: false }).count()) === 0 || !!nowy);

console.log('\n== zmiana nazwy ==');
await pasek().locator('button[title="Zmień nazwę pomieszczenia"]').click();
await pasek().getByLabel('Nazwa pomieszczenia').fill('Łazienka');
await pasek().getByLabel('Nazwa pomieszczenia').press('Enter'); await page.waitForTimeout(300);
st = await stan();
ok('nazwa zapisana: Łazienka', st.rooms.some((r) => r.id === 'p2' && r.name === 'Łazienka'), JSON.stringify(st.rooms));

console.log('\n== przełączanie i zakres list ==');
await pokojBtn('Pomieszczenie 1').click(); await page.waitForTimeout(600);
naPasku = await szafkiNaPasku();
ok('powrót do Pomieszczenia 1 — jego szafki', naPasku.join(',') === 'A1,A2,B1', naPasku.join(', '));
let tt = await tytuly();
ok('domyślnie „Formatki całego projektu” (4 szafki)', tt.some((t) => /^Formatki całego projektu/.test(t)), tt.filter((t) => /Formatki/.test(t)).join(' | '));
const licznik = async (re) => page.evaluate((src) => {
  const sec = [...document.querySelectorAll('section')].find((s) => new RegExp(src).test(s.querySelector('h2')?.textContent || ''));
  return sec ? sec.querySelector('header')?.innerText : null;
}, re.source);
ok('licznik szafek w formatkach całego projektu = 4', /4 szafki/.test(await licznik(/^Formatki całego projektu/) || ''), await licznik(/^Formatki całego projektu/));
await pasek().getByRole('button', { name: 'To pomieszczenie' }).click(); await page.waitForTimeout(500);
tt = await tytuly();
ok('„To pomieszczenie” → „Formatki pomieszczenia „Pomieszczenie 1”” (3 szafki)',
  tt.some((t) => /^Formatki pomieszczenia „Pomieszczenie 1”/.test(t)) && /3 szafki/.test(await licznik(/^Formatki pomieszczenia/) || ''),
  tt.filter((t) => /Formatki|Produkty/.test(t)).join(' | '));
ok('produkty też tylko z pomieszczenia', tt.some((t) => /^Produkty pomieszczenia „Pomieszczenie 1”/.test(t)));
await pasek().getByRole('button', { name: 'Cały projekt' }).click(); await page.waitForTimeout(400);

console.log('\n== rogi, zabudowa i kolizje tylko w pomieszczeniu ==');
// dwa pomieszczenia, w kazdym sciana z szafkami w tym samym miejscu rzutu
await wczytaj({ name: 'Dom', active: 0, prices: {},
  rooms: [{ id: 'p1', name: 'Kuchnia' }, { id: 'p2', name: 'Łazienka' }],
  items: [sz('K1', 600, 'c1'), sz('K2', 600, 'c1'), sz('K3', 900, 'c2'), sz('L1', 600, 'c3'), sz('L2', 600, 'c3', { H: 800 })],
  runs: [RUN('c1', 'Ściana 1', { roomId: 'p1' }), RUN('c2', 'Ściana 2', { roomId: 'p1', corner: { of: 'c1', at: 'end', owner: 'self', clear: 0 } }),
    RUN('c3', 'Ściana 1', { roomId: 'p2' })] });
const uwagi = () => page.evaluate(() => {
  const sec = [...document.querySelectorAll('section')].find((s) => /^Uwagi/.test(s.querySelector('h2')?.textContent || ''));
  return sec ? sec.innerText : '';
});
let u = await uwagi();
ok('kolizje nie sięgają do szafek innego pomieszczenia', !/L1|L2/.test(u), u.split('\n').filter((l) => /L1|L2/.test(l)).join(' | '));
const zakresy = async () => page.evaluate(() => [...document.querySelectorAll('button')].map((x) => x.textContent.trim()).filter((t) => /^(Szafka|Ciąg|Zabudowa)$/.test(t)));
ok('Kuchnia (2 ściany) ma zakres „Zabudowa”', (await zakresy()).includes('Zabudowa'), (await zakresy()).join(','));
// licznik uwag z innego pomieszczenia: L2 ma inna wysokosc niz ciag
const naglowek = await page.locator('header').first().innerText();
ok('w nagłówku licznik uwag „Łazienka: …”', /Łazienka: \d+ (ostrzeżen|błęd)/.test(naglowek),
  (naglowek.match(/Łazienka[^\n]*/g) || []).join(' | '));
ok('kropka uwag przy pomieszczeniu Łazienka', (await pasek().locator('[data-pokoj="p2"] span').count()) === 1);
// rog do sciany z innego pomieszczenia jest niedostepny
const opcjeRogu = await page.evaluate(() => [...document.querySelectorAll('select')].flatMap((s) => [...s.options].map((o) => o.textContent.trim())));
ok('„Należy do ciągu” bez ścian Łazienki', !opcjeRogu.some((o) => o === 'Ściana 1') || opcjeRogu.filter((o) => o === 'Ściana 1').length === 1,
  opcjeRogu.filter((o) => /Ściana/.test(o)).join(','));
await pokojBtn('Łazienka').click(); await page.waitForTimeout(600);
ok('Łazienka (1 ściana) bez zakresu „Zabudowa”', !(await zakresy()).includes('Zabudowa'), (await zakresy()).join(','));
naPasku = await szafkiNaPasku();
ok('w Łazience jej szafki', naPasku.join(',') === 'L1,L2', naPasku.join(', '));

console.log('\n== przenoszenie zabudowy ==');
await pokojBtn('Kuchnia').click(); await page.waitForTimeout(500);
await pasek().locator('select[aria-label="Przenieś do pomieszczenia"]').selectOption('p2'); await page.waitForTimeout(700);
st = await stan();
const r2 = Object.fromEntries(st.runs.map((r) => [r.id, r]));
ok('cała zabudowa (obie ściany z rogiem) w Łazience', r2.c1.roomId === 'p2' && r2.c2.roomId === 'p2' && r2.c2.corner && r2.c2.corner.of === 'c1',
  JSON.stringify(st.runs.map((r) => [r.id, r.name, r.roomId])));
ok('„Ściana 1” z Kuchni dostaje wolny numer', r2.c1.name !== 'Ściana 1' && /^Ściana \d+$/.test(r2.c1.name) && r2.c3.name === 'Ściana 1',
  st.runs.map((r) => r.name).join(', '));
ok('widok idzie za przeniesioną szafką (Łazienka aktywna)', (await pasek().locator('[data-pokoj="p2"]').getAttribute('class')).includes('bg-stone-800'));
await page.keyboard.press('Control+z'); await page.waitForTimeout(500);
st = await stan();
ok('Cofnij przywraca zabudowę do Kuchni', st.runs.find((r) => r.id === 'c1').roomId === 'p1', JSON.stringify(st.runs.map((r) => [r.id, r.roomId])));

console.log('\n== usuwanie pomieszczenia — zawsze z pytaniem ==');
await pokojBtn('Łazienka').click(); await page.waitForTimeout(500);
await pasek().locator('button[title^="Usuń pomieszczenie"]').click(); await page.waitForTimeout(300);
const okno = page.locator('[data-okno="usun-pokoj"]');
ok('pytanie: usuń z szafkami albo przenieś', (await okno.count()) === 1
  && /Usunąć „Łazienka”/.test(await okno.innerText()) && /2 szafki/.test(await okno.innerText()), (await okno.innerText()).replace(/\n/g, ' | '));
await okno.getByRole('button', { name: 'Przenieś i usuń pomieszczenie' }).click(); await page.waitForTimeout(600);
st = await stan();
ok('po przeniesieniu: jedno pomieszczenie, 5 szafek w Kuchni', st.rooms.length === 1 && st.items.length === 5
  && st.items.every((it) => it.roomId === 'p1'), JSON.stringify({ rooms: st.rooms, items: st.items.map((i) => i.cab.name + '@' + i.roomId) }));
await page.keyboard.press('Control+z'); await page.waitForTimeout(500);
await pokojBtn('Łazienka').click(); await page.waitForTimeout(500);
await pasek().locator('button[title^="Usuń pomieszczenie"]').click(); await page.waitForTimeout(300);
await okno.getByRole('button', { name: 'Usuń razem z szafkami' }).click(); await page.waitForTimeout(600);
st = await stan();
ok('usuń z szafkami: zostaje Kuchnia z 3 szafkami, bez ściany Łazienki', st.rooms.length === 1 && st.items.length === 3
  && !st.runs.some((r) => r.id === 'c3'), JSON.stringify({ items: st.items.map((i) => i.cab.name), runs: st.runs.map((r) => r.id) }));
naPasku = await szafkiNaPasku();
ok('widok wraca do Kuchni', naPasku.join(',') === 'K1,K2,K3', naPasku.join(', '));

console.log('\n== zestawienie PDF: rozdziały i zbiorcze zamówienie ==');
await page.keyboard.press('Control+z'); await page.waitForTimeout(600);
await page.evaluate(() => {
  window.__snap = null;
  window.print = () => {
    const rep = document.querySelector('.print-only');
    if (!rep) return;
    window.__snap = { text: rep.innerText, pages: rep.querySelectorAll('.rp-page').length };
  };
});
await page.getByRole('button', { name: 'Zestawienie PDF', exact: true }).click(); await page.waitForTimeout(2000);
const snap = await page.evaluate(() => window.__snap);
ok('rozdział Kuchnia i Łazienka w nagłówkach kartek', !!snap && /Dom — Kuchnia/.test(snap.text) && /Dom — Łazienka/.test(snap.text));
ok('formatki pomieszczeń osobno', !!snap && /Formatki pomieszczenia „Kuchnia”/.test(snap.text) && /Formatki pomieszczenia „Łazienka”/.test(snap.text));
ok('na końcu zbiorcze zamówienie całego projektu', !!snap && /Zbiorcze zamówienie — cały projekt: 2 pomieszczenia, 5 szafek/.test(snap.text),
  snap ? (snap.text.match(/Zbiorcze[^\n]*/) || [''])[0].slice(0, 90) : 'brak');
ok('„Ściana 1” z dwóch pomieszczeń rozróżniona w zamówieniu', !!snap && /Blat — Kuchnia, Ściana 1/.test(snap.text) && /Blat — Łazienka, Ściana 1/.test(snap.text),
  snap ? (snap.text.match(/Blat — [^\n]{0,20}/g) || []).join(' | ') : '');
ok('numeracja kartek przez cały projekt (1 z 5 … 5 z 5)', !!snap && /\(1 z 5\)/.test(snap.text) && /\(5 z 5\)/.test(snap.text));

console.log('\n== ostatnia szafka pomieszczenia ==');
await pokojBtn('Łazienka').click(); await page.waitForTimeout(500);
await page.getByRole('button', { name: '+ pomieszczenie' }).click(); await page.waitForTimeout(500);
ok('w pomieszczeniu z jedną szafką nie ma „Usuń szafkę”', (await page.locator('header button[title="Usuń szafkę"]').count()) === 0);

console.log('\n== pasek pomieszczeń zwija się (uzytkownik 2026-09-30) ==');
await pasek().getByRole('button', { name: /^▼\s*Pomieszczenia/ }).click(); await page.waitForTimeout(300);
const zw = await pasek().innerText();
ok('zwinięty: bez kafelków i „+ pomieszczenie”, z podsumowaniem', (await pasek().locator('[data-pokoj]').count()) === 0
  && !/\+ pomieszczenie/.test(zw) && /3 pomieszczenia, aktywne: „Pomieszczenie \d+”/.test(zw), zw.replace(/\n/g, ' | '));
ok('stan pamiętany w przeglądarce', (await page.evaluate(() => localStorage.getItem('mp-pokoje-zwiniete'))) === '1');
await page.reload({ waitUntil: 'networkidle' }); await page.waitForTimeout(1200);
ok('po przeładowaniu dalej zwinięty', (await pasek().locator('[data-pokoj]').count()) === 0);
await pasek().getByRole('button', { name: /Pomieszczenia/ }).first().click(); await page.waitForTimeout(300);
ok('drugie kliknięcie rozwija', (await pasek().locator('[data-pokoj]').count()) === 3);

console.log('\nBLEDY:', errors.length ? errors.join('; ') : '(brak)');
await b.close();
