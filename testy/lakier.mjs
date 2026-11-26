// Lakierowanie formatek (uzytkownik 2026-11-26): przy kazdej szafce grupy z MDF lakierowanego (fronty, opaski, cokol, korpus,
// polki), kolor i grubosc (domyslnie jak plyta); takie formatki poza rozkrojem i okleina, osobna lista „Do lakierni” (m²),
// w wycenie za m² formatki (400 zl, z plyta). Wspolny cokol ciagu z MDF tylko, gdy wszystkie szafki maja lakierowany cokol.
// Do tego maskownica boku „do lica frontów”: napis i uchwyt glebokosci z cala plyta (600 + 20), nie z samym korpusem.
import pw from './pw.mjs';
const { chromium } = pw;
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const page = await (await browser.newContext({ viewport: { width: 1500, height: 1100 } })).newPage();
const errors = [];
page.on('pageerror', (e) => errors.push('[pageerror] ' + e.message));
let bledy = 0;
const ok = (l, c, e = '') => { if (!c) bledy++; console.log((c ? '  OK   ' : '  BLAD ') + l + (e ? ' — ' + e : '')); };
const URL = process.env.STD ? 'http://127.0.0.1:5199/standalone-local.html' : 'http://127.0.0.1:5205/mebloprojekt-app.html';

const PL = { on: true, height: 100, mode: 'under', setback: 0 };
const CAB = (name, W, extra = {}) => ({ cab: Object.assign({ name, W, H: 720, D: 550, plinth: PL, legs: { on: false },
  levels: [{ h: null, cols: [{ kind: 'doors', doors: 1, w: null, shelfTargets: [null] }] }] }, extra), runId: 'c1', offset: 0 });
const RUN = { id: 'c1', name: 'Ściana 1', wallW: null, gap: 0, mountY: 0, H: 720, D: 550, plinth: PL, worktop: true, corner: null };
const seed = async (items, runs, tryb = 'techniczny', active = 0) => {
  await page.evaluate(({ its, rs, tryb, active }) => {
    localStorage.clear();
    localStorage.setItem('szafki:projekt', JSON.stringify({ name: 'L', active, prices: {}, runs: rs, items: its }));
    localStorage.setItem('mp-tryb', tryb);
  }, { its: items, rs: runs, tryb, active });
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);
};
const proj = () => page.evaluate(() => JSON.parse(localStorage.getItem('szafki:projekt')));
const czekajZapis = () => page.waitForTimeout(1300);

await page.goto(URL, { waitUntil: 'networkidle' });

console.log('\n== techniczny: karta „Lakierowanie (MDF)” w „Płyty” ==');
await seed([CAB('S1', 600), CAB('S2', 500)], [RUN]);
await page.locator('#karta-plyty button').first().click();
await page.waitForTimeout(500);
const karta = page.locator('[data-el=lakier-karta]');
ok('karta lakieru: 5 grup i 4 skróty', (await karta.locator('[data-el=lakier-grupa]').count()) === 5 && (await karta.locator('[data-el=lakier-skrot]').count()) === 4);
ok('bez lakieru: listy „Do lakierni” nie ma', (await page.locator('[data-el=lakiernia]').count()) === 0);
await karta.locator('[data-el=lakier-skrot][data-v=fronty-opaski] button').click();
await page.waitForTimeout(500);
await karta.locator('[data-el=lakier-kolor]').fill('RAL 9016 mat');
await karta.locator('[data-el=lakier-kolor]').blur();
await czekajZapis();
let P = await proj();
const lk = P.items[0].cab.lakier || {};
ok('„Fronty i opaski” — zapisane w szafce: fronty i opaski, bez korpusu, cokołu i półek; kolor', lk.fronty && lk.opaski && !lk.korpus && !lk.cokol && !lk.polki && lk.kolor === 'RAL 9016 mat', JSON.stringify(lk));
ok('druga szafka bez zmian (lakier przy każdej szafce osobno)', !P.items[1].cab.lakier);
const lista = page.locator('[data-el=lakiernia]').first();
const tLak = (await lista.innerText().catch(() => '')).replace(/\s+/g, ' ');
ok('lista „Do lakierni”: drzwi 714 × 596 z MDF lakierowanego 18 mm w kolorze, 0,43 m²', /Drzwi nakładane/.test(tLak) && /MDF lakierowany 18 mm — RAL 9016 mat/.test(tLak) && /0[,.]43/.test(tLak), tLak.slice(0, 200));
const glowna = await page.evaluate(() => {
  const sec = [...document.querySelectorAll('section')].find((s) => /^Formatki do zamówienia/.test(s.querySelector('h2')?.textContent || ''));
  const t = sec && sec.querySelector('table'); return t ? t.innerText : '';
});
ok('tabela płyt bez drzwi (są w liście do lakierni), korpus zostaje', !/Drzwi/.test(glowna) && /Bok/.test(glowna), glowna.slice(0, 120));
await page.waitForTimeout(1800);
const rk = await page.evaluate(() => window.__audytRozkroj);
ok('rozkrój bez MDF lakierowanego', !!rk && rk.aktualny && !rk.groups.some((g) => /MDF lakierowany/.test(g.matLabel)), rk ? rk.groups.map((g) => g.matLabel).join(' | ') : 'brak');
const uw = await page.evaluate(() => (document.body.innerText.match(/Lakierowane z MDF[^\n]*/) || [''])[0]);
ok('informacja w uwagach: grupy, liczba formatek, m², „poza rozkrojem”', /fronty, opaski — 1 formatka, 0,426 m²\. Poza rozkrojem/.test(uw), uw);
// wycena: pozycja lakierni za m², 400 zl
const wyc = page.locator('section').filter({ has: page.locator('h2', { hasText: /^Wycena/ }) }).first();
await wyc.locator('button').first().click();
await page.waitForTimeout(600);
const wiersz = await page.evaluate(() => [...document.querySelectorAll('tr')].map((r) => r.innerText.replace(/\s+/g, ' ')).find((t) => /lakiernia/.test(t)) || '');
// drzwi 714 × 596 = 0,426 m² × 400 zl = 170,40
ok('wycena: „MDF lakierowany 18 mm — RAL 9016 mat — lakiernia”, 1 formatka, 0,426 m² × 400 zł = 170,40', /MDF lakierowany 18 mm — RAL 9016 mat — lakiernia 1 formatka/.test(wiersz) && /0[.,]426 m²/.test(wiersz) && /170[.,]40/.test(wiersz), wiersz);
// grubosc MDF frontow — domyslnie jak plyta, zmiana odlacza fronty od plyty korpusu
const gr = karta.locator('[data-el=lakier-grubosc][data-g=fronty] select');
ok('grubość MDF frontów: domyślnie 18 (jak płyta)', (await gr.inputValue()) === '18');
await gr.selectOption('22');
await czekajZapis();
P = await proj();
ok('grubość 22: fronty z własnej płyty 22 mm (geometria), korpus zostaje 18', P.items[0].cab.frontSameAsBoard === false && P.items[0].mat.front.thickness === 22 && P.items[0].mat.board.thickness === 18,
  JSON.stringify({ same: P.items[0].cab.frontSameAsBoard, f: P.items[0].mat.front.thickness, b: P.items[0].mat.board.thickness }));
ok('lista do lakierni: MDF 22 mm', /MDF lakierowany 22 mm/.test(await page.locator('[data-el=lakiernia]').first().innerText().catch(() => '')));

console.log('\n== cokół ciągu z MDF tylko przy wszystkich szafkach z lakierowanym cokołem ==');
const lak = (o) => ({ lakier: { fronty: true, opaski: true, cokol: true, korpus: false, polki: false, ...o } });
const projLak = async () => (await page.locator('[data-el=lakiernia]').allInnerTexts()).join(' ');
await seed([CAB('S1', 600, lak()), CAB('S2', 500, lak({ cokol: false }))], [RUN]);
let tP = await projLak();
ok('jedna szafka bez lakierowanego cokołu — „Cokół ciągu” z płyty', !/Cokół ciągu/.test(tP), tP.slice(0, 160));
await seed([CAB('S1', 600, lak()), CAB('S2', 500, lak())], [RUN]);
tP = await projLak();
ok('obie z lakierowanym cokołem — „Cokół ciągu” w liście do lakierni projektu', /Cokół ciągu/.test(tP), tP.slice(0, 200));
await seed([CAB('S1', 600, lak({ korpus: true, polki: true }))], [RUN]);
P = await proj();
await page.waitForTimeout(1500);
const rk2 = await page.evaluate(() => window.__audytRozkroj);
ok('„wszystko” lakierowane: w rozkroju zostają plecy HDF (i niewidoczne wzmocnienia)', !!rk2 && rk2.groups.every((g) => !/MDF lakierowany/.test(g.matLabel)) && rk2.groups.some((g) => /HDF/.test(g.matLabel)),
  rk2 ? rk2.groups.map((g) => g.matLabel).join(' | ') : 'brak');

console.log('\n== makieta: lakier w karcie szafki (zakładka Szafka) ==');
await seed([CAB('S1', 600), CAB('S2', 500)], [RUN], 'prosta');
const zak = page.locator('[data-el="makieta"] nav [data-zakl="szafka"]');
if ((await zak.count()) && (await zak.getAttribute('aria-pressed')) !== 'true') { await zak.click(); await page.waitForTimeout(400); }
const mk = page.locator('[data-el=mak-lakier]');
ok('makieta prosta: blok „Lakierowanie (MDF)” w karcie', (await mk.count()) === 1);
if (await mk.count()) {
  await mk.locator('[data-el=lakier-skrot][data-v=wszystko] button').click();
  await czekajZapis();
  P = await proj();
  const l2 = P.items[P.active].cab.lakier || {};
  ok('„Wszystko” — wszystkie grupy w zaznaczonej szafce', ['fronty', 'opaski', 'cokol', 'korpus', 'polki'].every((k) => l2[k]), JSON.stringify(l2));
}

console.log('\n== maskownica boku „do lica frontów” — napis głębokości z całą płytą ==');
const MASK = { cab: { name: 'Maskownica boku', W: 18, H: 2600, D: 600, plinth: PL, legs: { on: false }, levels: [{ h: null, cols: [{ kind: 'open', w: null }] }],
  sprzetCiagu: { typ: 'maskownica', gl: 'front', kolor: 'korpus' } }, runId: 'c1', offset: 0 };
const SLUP = CAB('Słupek', 600, { H: 2500, D: 600 });
await seed([SLUP, MASK, CAB('S2', 600, { D: 600 })], [{ ...RUN, D: 600, H: 2500, worktop: false }], 'prosta', 1);
const zak2 = page.locator('[data-el="makieta"] nav [data-zakl="szafka"]');
if ((await zak2.count()) && (await zak2.getAttribute('aria-pressed')) !== 'true') { await zak2.click(); await page.waitForTimeout(400); }
const napisy = await page.evaluate(() => [...document.querySelectorAll('[data-el=mak-zgory] text')].map((t) => t.textContent).filter((t) => /^gł\./.test(t)));
ok('rzut z góry: „gł. 620 (600 + 20)” przy maskownicy (płyta do lica frontów), nie „gł. 600”', napisy.includes('gł. 620 (600 + 20)') && !napisy.includes('gł. 600'), napisy.join(' | '));
const podp = await page.evaluate(() => (document.querySelector('[data-el=mak-sz-maskownica]') || {}).textContent || '');
ok('podpowiedź w karcie maskownicy: 620 = 600 korpusu + 20 do lica frontów', /głęb\. 620 mm — 600 korpusu \+ 20 do lica frontów/.test(podp), podp.slice(0, 160));

console.log('\nBLEDY:', errors.length ? errors.join('; ') : '(brak)');
if (errors.length) bledy++;
await browser.close();
process.exit(bledy ? 1 : 0);
