/* Sprzety w zabudowie (uzytkownik 2026-11-04): piekarnik i mikrofala jako rodzaj kolumny
   „Sprzęt” — wneka w poziomie szafki, typowe wymiary do zmiany w polach. Klikane w aplikacji:
   - „Sprzęt” w kolumnie poziomu — wneka bez drzwi i polek, front sprzetu na rysunku;
   - „Mikrofala” — ostrzezenie o otwartej wnece nad nia i przycisk „Poziom 373 mm”;
   - pole „Front — wysokość” — front wchodzacy na drzwi nad nim i przycisk podniesienia plyty;
   - za szeroka szafka / kolumna i za plytka szafka — przyciski „Szafka 600 mm (wnęka 564)”,
     „Kolumna 564 mm”, „Głębokość szafki 550 mm”;
   - powrot na „Półki i drzwi” zdejmuje sprzet;
   - rysunki: front (zamkniety), z boku, z gory, 3D szafki i 3D zabudowy;
   - sprzet w ciagu bez korpusu (2026-11-05): zmywarka i lodowka wolnostojaca z szablonu, karta,
     przyciski „Miejsce N mm” / „Wysokość N mm”, cokol z przerwa pod lodowka, rysunki ciagu.
   Liczby i kolizje otwierania — suita `funkcje`. */
import pw from './pw.mjs';
const URL = process.env.STD ? 'http://127.0.0.1:5199/standalone-local.html'
  : 'http://127.0.0.1:5205/mebloprojekt-app.html';
const ok = (l, c, e = '') => console.log((c ? '  OK   ' : '  BLAD ') + l + (e ? ' — ' + e : ''));
const b = await pw.chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const page = await (await b.newContext({ viewport: { width: 1500, height: 1300 } })).newPage();
const errors = []; page.on('pageerror', (e) => errors.push(e.message));
await page.goto(URL, { waitUntil: 'networkidle' });

const seedP = async (q) => {
  await page.evaluate((x) => { localStorage.clear(); localStorage.setItem('szafki:projekt', JSON.stringify(x)); }, q);
  await page.reload({ waitUntil: 'networkidle' }); await page.waitForTimeout(1500);
};
const seed = (cab) => seedP({ name: 'P', active: 0, prices: {}, runs: [], items: [{ cab, runId: null, offset: 0 }] });
const zap = async () => { await page.waitForTimeout(900); return page.evaluate(() => JSON.parse(localStorage.getItem('szafki:projekt'))); };
const notes = () => page.evaluate(() => {
  const sec = [...document.querySelectorAll('section')].find((s) => /^Uwagi$/.test((s.querySelector('h2') || {}).textContent || ''));
  return sec ? [...sec.querySelectorAll('li')].map((li) => ({ txt: li.textContent.trim(), btns: [...li.querySelectorAll('button')].map((x) => x.textContent.trim()) })) : [];
});
const klik = async (re, label) => {
  const li = page.locator('section li').filter({ hasText: re }).first();
  await li.getByRole('button', { name: label, exact: true }).click();
  await page.waitForTimeout(700);
};
const przyciski = async (re) => ((await notes()).find((x) => re.test(x.txt)) || { btns: [] }).btns.filter((x) => x !== '✓');
const jest = async (re) => (await notes()).some((x) => re.test(x.txt));
const widok = async (n) => { await page.getByRole('button', { name: n, exact: true }).first().click(); await page.waitForTimeout(700); };
const ile = (sel) => page.locator(`#rysunek ${sel}`).count();
// bryly 3D z audytu (`window.__audytBryl`) — tagi sprzetu po przerysowaniu widoku
const bryly3d = async (n) => {
  await page.evaluate(() => { window.__audytBryl = []; });
  await widok(n);
  const a = await page.evaluate(() => { const x = window.__audytBryl; window.__audytBryl = null; return x || []; });
  return { bryla: a.filter((q) => q.tag === 'sprzet').length, front: a.filter((q) => q.tag === 'sprzet-front').length };
};
const SLUPEK = (o = {}, sp2 = null, h2 = 590) => ({ name: 'Słupek', W: 600, H: 2100, D: 560, plinth: { on: true, height: 100 }, legs: { on: false },
  levels: [{ h: 720, cols: [{ kind: 'drawers', w: null, drawers: [{ h: 'auto' }, { h: 'auto' }] }] },
    { h: h2, cols: [{ kind: 'doors', doors: 1, w: null, shelfTargets: [null, null], ...(sp2 ? { doors: 0, sprzet: sp2 } : {}) }] },
    { h: null, cols: [{ kind: 'doors', doors: 1, w: null, shelfTargets: [null] }] }], ...o });

console.log('== „Sprzęt” w kolumnie poziomu 2: piekarnik ==');
{
  await seed(SLUPEK());
  // poziomy w karcie od gory: poziom 3, 2, 1 — „Sprzęt” poziomu 2 to drugi
  await page.getByRole('button', { name: 'Sprzęt', exact: true }).nth(1).click(); await page.waitForTimeout(900);
  const c = (await zap()).items[0].cab.levels[1].cols[0];
  ok('kliknięcie „Sprzęt”: kolumna z „sprzet: piekarnik”', c.sprzet && c.sprzet.typ === 'piekarnik', JSON.stringify(c));
  const karta = page.locator('[data-el="sprzet-kolumny"]');
  ok('karta sprzętu: typowe wymiary, wnęka 564 × 590 × 560 mm, pola frontu i wnęki', (await karta.count()) === 1
    && /Wnęka teraz: 564 × 590 × 560 mm/.test(await karta.innerText()) && (await karta.locator('input').count()) === 8, (await karta.count()) ? (await karta.innerText()).slice(0, 200) : 'brak');
  ok('bez uwag o sprzęcie', !(await jest(/sprzęt|piekarnik/)), (await notes()).map((x) => x.txt.slice(0, 80)).join(' / '));
  await widok('Zamk.');
  ok('rysunek frontu: front piekarnika (1)', (await ile('[data-el="sprzet-front"]')) === 1);
  await widok('Z boku');
  ok('z boku: bryła piekarnika (1)', (await ile('[data-el="sprzet-z-boku"]')) === 1);
  await widok('Z góry');
  ok('z góry: piekarnik (1)', (await ile('[data-el="sprzet-z-gory"]')) === 1);
  const s3 = await bryly3d('3D');
  ok('3D szafki: bryła i front sprzętu (po 1)', s3.bryla === 1 && s3.front === 1, JSON.stringify(s3));

  console.log('\n== mikrofala: otwarta wnęka nad nią ==');
  await karta.getByRole('button', { name: 'Mikrofala', exact: true }).click(); await page.waitForTimeout(900);
  const re = /nad sprzętem \(mikrofala, front 382 mm\) zostaje 208 mm otwartej wnęki/;
  ok('„Mikrofala”: ostrzeżenie o 208 mm otwartej wnęki z przyciskiem „Poziom 373 mm”', JSON.stringify(await przyciski(re)) === '["Poziom 373 mm"]', (await przyciski(re)).join(' / '));
  await klik(re, 'Poziom 373 mm');
  ok('po kliknięciu: poziom 2 = 373 mm, bez uwag o mikrofali', (await zap()).items[0].cab.levels[1].h === 373 && !(await jest(/mikrofala/)),
    String((await zap()).items[0].cab.levels[1].h));

  console.log('\n== własny wymiar frontu: zachodzi na drzwi nad nim ==');
  await karta.getByRole('button', { name: 'Piekarnik', exact: true }).click(); await page.waitForTimeout(700);
  const reH = /wnęka na piekarnik ma 373 mm wysokości — potrzeba co najmniej 585 mm \(586 mm/;
  ok('powrót na piekarnik w poziomie 373: błąd wysokości z „Poziom 586 mm”', JSON.stringify(await przyciski(reH)) === '["Poziom 586 mm"]', (await przyciski(reH)).join(' / '));
  await klik(reH, 'Poziom 586 mm');
  ok('po kliknięciu: poziom 586, bez błędu', (await zap()).items[0].cab.levels[1].h === 586 && !(await jest(/piekarnik/)));
  await karta.locator('label').filter({ hasText: 'Front — wysokość' }).locator('input').fill('610'); await page.waitForTimeout(900);
  const sp = (await zap()).items[0].cab.levels[1].cols[0].sprzet;
  const reF = /front sprzętu \(piekarnik, 595 × 610 mm\) zachodzi o \d+ mm na drzwi nad nim/;
  const bF = await przyciski(reF);
  ok('pole „Front — wysokość” 610: zapisane, błąd frontu na drzwiach nad nim z przyciskiem „Poziom N mm”', sp.frontH === 610 && bF.length === 1 && /^Poziom \d+ mm$/.test(bF[0]), `${sp.frontH} | ${bF.join(' / ')}`);
  await klik(reF, bF[0]);
  ok('po kliknięciu: bez błędu frontu', !(await jest(reF)), String((await zap()).items[0].cab.levels[1].h));

  console.log('\n== „Półki i drzwi” zdejmuje sprzęt ==');
  await page.getByRole('button', { name: 'Półki i drzwi', exact: true }).nth(1).click(); await page.waitForTimeout(900);
  const c2 = (await zap()).items[0].cab.levels[1].cols[0];
  ok('kolumna bez „sprzet”, karta sprzętu znika', !c2.sprzet && (await page.locator('[data-el="sprzet-kolumny"]').count()) === 0, JSON.stringify(c2));
}

console.log('\n== szerokość i głębokość: przyciski naprawy ==');
{
  await seed(SLUPEK({ W: 640 }, { typ: 'piekarnik' }));
  const reW = /wnęka na piekarnik ma 604 mm szerokości/;
  ok('szafka 640: „Szafka 600 mm (wnęka 564)”', JSON.stringify(await przyciski(reW)) === '["Szafka 600 mm (wnęka 564)"]', (await przyciski(reW)).join(' / '));
  await klik(reW, 'Szafka 600 mm (wnęka 564)');
  ok('po kliknięciu: szafka 600, bez ostrzeżenia', (await zap()).items[0].cab.W === 600 && !(await jest(reW)));
  await seed({ ...SLUPEK(), W: 1300, levels: [{ h: 720, cols: [{ kind: 'drawers', w: null, drawers: [{ h: 'auto' }] }] },
    { h: 590, cols: [{ kind: 'doors', doors: 0, w: 640, shelfTargets: [null], sprzet: { typ: 'piekarnik' } }, { kind: 'doors', doors: 1, w: null, shelfTargets: [null] }] },
    { h: null, cols: [{ kind: 'doors', doors: 2, w: null }] }] });
  const reK = /wnęka na piekarnik ma 640 mm szerokości/;
  ok('dwie kolumny, wnęka 640: „Kolumna 564 mm”', JSON.stringify(await przyciski(reK)) === '["Kolumna 564 mm"]', (await przyciski(reK)).join(' / '));
  await klik(reK, 'Kolumna 564 mm');
  ok('po kliknięciu: kolumna 564, bez ostrzeżenia', (await zap()).items[0].cab.levels[1].cols[0].w === 564 && !(await jest(reK)));
  await seed(SLUPEK({ D: 450 }, { typ: 'piekarnik' }));
  const reD = /wnęka na piekarnik ma 450 mm głębokości/;
  ok('szafka 450 głęb.: „Głębokość szafki 550 mm”', JSON.stringify(await przyciski(reD)) === '["Głębokość szafki 550 mm"]', (await przyciski(reD)).join(' / '));
  await klik(reD, 'Głębokość szafki 550 mm');
  ok('po kliknięciu: głębokość 550, bez błędu', (await zap()).items[0].cab.D === 550 && !(await jest(reD)));
}

console.log('\n== zabudowa 3D: sprzęt w szafce ciągu ==');
{
  const PL = { on: true, height: 100, mode: 'under', setback: 0 };
  await seedP({ name: 'P', active: 0, prices: {}, runs: [{ id: 'c1', name: 'Ściana A', wallW: null, gap: 0, mountY: 0, H: 2100, D: 560, plinth: PL, worktop: false, corner: null }],
    items: [{ cab: { ...SLUPEK({}, { typ: 'piekarnik' }), plinth: PL }, runId: 'c1', offset: 0 }] });
  await widok((await page.getByRole('button', { name: 'Zabudowa', exact: true }).count()) ? 'Zabudowa' : 'Ciąg');
  const z3 = await bryly3d('3D');
  ok('3D zabudowy: bryła i front sprzętu (po 1)', z3.bryla === 1 && z3.front === 1, JSON.stringify(z3));
}

console.log('\n== lodówka (użytkownik 2026-11-05): zabudowa ślizgowo / na stałe, 2 fronty, wolnostojąca ==');
{
  await seed({ name: 'Lodówka', W: 600, H: 2100, D: 560, plinth: { on: true, height: 100 }, legs: { on: false },
    levels: [{ h: 1781, cols: [{ kind: 'doors', doors: 1, w: null, shelfTargets: [null, null] }] }, { h: null, cols: [{ kind: 'doors', doors: 1, w: null, shelfTargets: [null] }] }] });
  // poziomy od gory: poziom 2, 1 — „Sprzęt” poziomu 1 to drugi
  await page.getByRole('button', { name: 'Sprzęt', exact: true }).nth(1).click(); await page.waitForTimeout(700);
  const karta = page.locator('[data-el="sprzet-kolumny"]');
  await karta.getByRole('button', { name: 'Lodówka', exact: true }).click(); await page.waitForTimeout(900);
  const c = (await zap()).items[0].cab.levels[0].cols[0];
  ok('„Lodówka”: typ lodowka, domyślnie ślizgowo — informacja o prowadnicy, bez uwag o wnęce', c.sprzet.typ === 'lodowka'
    && await jest(/prowadnicą ślizgową z kompletu lodówki/) && !(await jest(/wnęka na lodówkę/)), JSON.stringify(c.sprzet));
  ok('karta: mocowanie (ślizgowo / na stałe / bez frontu), fronty, pola wnęki, zawiasy, uchwyt',
    (await karta.getByRole('button', { name: 'bez frontu (wolnostojąca)', exact: true }).count()) === 1 && (await karta.getByRole('button', { name: '2 fronty', exact: true }).count()) === 1
    && (await karta.locator('input[type=number]').count()) === 5 && (await karta.locator('[data-el="lodowka-uchwyt"] input').count()) === 1);
  await karta.getByRole('button', { name: '2 fronty', exact: true }).click(); await page.waitForTimeout(700);
  ok('„2 fronty”: ostrzeżenie „wpisz wysokość dolnego frontu z karty lodówki”', await jest(/wpisz wysokość dolnego frontu z karty lodówki/));
  await karta.locator('label').filter({ hasText: 'Dolny front — wysokość' }).locator('input').fill('700'); await page.waitForTimeout(900);
  ok('dolny 700: zapisany, bez ostrzeżenia', (await zap()).items[0].cab.levels[0].cols[0].sprzet.dolny === 700 && !(await jest(/wpisz wysokość dolnego frontu/)));
  await widok('Zamk.');
  const napisy = await page.locator('#rysunek svg').first().evaluate((e) => e.textContent).catch(() => '');
  ok('rysunek frontu: dwa fronty lodówki 596 × 700 i 596 × 1101', /596×700/.test(napisy) && /596×1101/.test(napisy), napisy.replace(/\s+/g, ' ').slice(0, 200));
  await karta.getByRole('button', { name: 'na stałe', exact: true }).click(); await page.waitForTimeout(700);
  ok('„na stałe”: informacja „bez zawiasów meblowych”', await jest(/przykręcony do drzwi lodówki okuciami z kompletu lodówki — bez zawiasów meblowych/));
  await karta.getByRole('button', { name: 'bez frontu (wolnostojąca)', exact: true }).click(); await page.waitForTimeout(900);
  const reW = /wnęka na lodówkę ma 564 mm szerokości — lodówka ma 600 mm/;
  ok('„bez frontu”: błąd szerokości z „Szafka 736 mm (wnęka 700)”', JSON.stringify(await przyciski(reW)) === '["Szafka 736 mm (wnęka 700)"]', (await przyciski(reW)).join(' / '));
  await klik(reW, 'Szafka 736 mm (wnęka 700)');
  ok('po kliknięciu: szafka 736, bez błędu szerokości', (await zap()).items[0].cab.W === 736 && !(await jest(reW)));
  const l3 = await bryly3d('3D');
  ok('3D: bryła i drzwi lodówki wolnostojącej', l3.bryla === 1 && l3.front === 1, JSON.stringify(l3));
}

console.log('\n== wycięcia w blacie (użytkownik 2026-11-05): płyta i zlew nad szafką ==');
{
  const PLw = { on: true, height: 100, mode: 'under', setback: 0 };
  const sz = (name, W) => ({ cab: { name, W, H: 720, D: 560, plinth: PLw, joints: { topL: 'none', topR: 'none' },
    levels: [{ h: null, cols: [{ kind: 'doors', doors: W > 500 ? 2 : 1, w: null, shelfTargets: [null] }] }] }, runId: 'c1', offset: 0 });
  await seedP({ name: 'P', active: 1, prices: {}, runs: [{ id: 'c1', name: 'Ściana A', wallW: null, gap: 0, mountY: 0, H: 720, D: 560, plinth: PLw, worktop: true, corner: null }],
    items: [sz('A', 400), sz('Płyta', 600), sz('B', 600)] });
  const karta = page.locator('[data-el="wyciecia-blatu"]');
  ok('karta „Wycięcia w blacie nad szafką” przy szafce pod blatem roboczym', (await karta.count()) === 1);
  await karta.getByRole('button', { name: '+ płyta grzewcza', exact: true }).click(); await page.waitForTimeout(900);
  ok('„+ płyta grzewcza”: wycięcie w szafce, karta z polami', JSON.stringify((await zap()).items[1].cab.blatWyciecia) === '[{"typ":"plyta"}]'
    && (await page.locator('[data-el="wyciecie-blatu-karta"] input').count()) === 4);
  await widok((await page.getByRole('button', { name: 'Zabudowa', exact: true }).count()) ? 'Zabudowa' : 'Ciąg');
  await widok('Z góry');
  ok('rzut z góry ciągu: wycięcie „płyta 560×490”', (await ile('[data-el="wyciecie-blatu"]')) === 1
    && /płyta 560×490/.test(await page.locator('#rysunek [data-el="wyciecie-blatu"]').first().textContent()));
  await page.locator('[data-el="wyciecie-blatu-karta"] label').filter({ hasText: 'Od przodu blatu' }).locator('input').fill('140'); await page.waitForTimeout(900);
  const reT = /płyta nad szafką „Płyta”: blat ma 600 mm głębokości, a wycięcie 490 mm zaczyna się 140 mm od przodu/;
  ok('od przodu 140: błąd „poza tył blatu” z „Wycięcie 60 mm od przodu blatu”', (await przyciski(reT)).includes('Wycięcie 60 mm od przodu blatu'), (await przyciski(reT)).join(' / '));
  await klik(reT, 'Wycięcie 60 mm od przodu blatu');
  ok('po kliknięciu: od przodu 60, bez błędu', (await zap()).items[1].cab.blatWyciecia[0].odPrzodu === 60 && !(await jest(reT)));
  await page.locator('[data-el="wyciecie-blatu-karta"]').getByRole('button', { name: 'usuń', exact: true }).click(); await page.waitForTimeout(900);
  ok('„usuń”: bez wycięć', !((await zap()).items[1].cab.blatWyciecia || []).length && (await page.locator('[data-el="wyciecie-blatu-karta"]').count()) === 0);
}

console.log('\n== sprzęt w ciągu bez korpusu (użytkownik 2026-11-05): zmywarka i lodówka wolnostojąca ==');
{
  const PLs = { on: true, height: 100, mode: 'under', setback: 0 };
  const sz = (name, W) => ({ cab: { name, W, H: 720, D: 560, plinth: PLs, joints: { topL: 'none', topR: 'none' },
    levels: [{ h: null, cols: [{ kind: 'doors', doors: 2, w: null, shelfTargets: [null] }] }] }, runId: 'c1', offset: 0 });
  await seedP({ name: 'P', active: 0, prices: {}, runs: [{ id: 'c1', name: 'Ściana A', wallW: null, gap: 0, mountY: 0, H: 720, D: 560, plinth: PLs, worktop: true, corner: null }],
    items: [sz('A', 600), sz('B', 600)] });
  await page.locator('[data-el="z-szablonu"]').first().selectOption('zmywarka'); await page.waitForTimeout(1000);
  let p = await zap();
  const zm = p.items[p.active];
  ok('„+ z szablonu… Zmywarka”: pozycja „Zmywarka” w ciągu, 600 × 720, cokół ciągu', zm.cab.name === 'Zmywarka' && zm.runId === 'c1' && zm.cab.sprzetCiagu.typ === 'zmywarka'
    && zm.cab.W === 600 && zm.cab.H === 720 && zm.cab.plinth.on, JSON.stringify({ n: zm.cab.name, W: zm.cab.W, H: zm.cab.H, sp: zm.cab.sprzetCiagu }));
  const karta = page.locator('[data-el="sprzet-ciagu-karta"]');
  const naglowki = await page.evaluate(() => [...document.querySelectorAll('section h2')].map((h) => h.textContent.trim()));
  ok('karta „Sprzęt w ciągu” zamiast „Korpus” i „Struktura wnętrza”', (await karta.count()) === 1 && !naglowki.some((h) => /^(▼ )?(Korpus|Struktura wnętrza)$/.test(h)), naglowki.join(' | '));
  const formatki = await page.evaluate(() => { const sec = [...document.querySelectorAll('section')].find((q) => /^(▼ )?Formatki do zamówienia/.test((q.querySelector('h2') || {}).textContent || '')); return sec ? sec.innerText.replace(/\s+/g, ' ') : ''; });
  ok('formatki zmywarki: tylko „Front zmywarki 714 × 596”', /Front zmywarki .*714 596 1/.test(formatki) && !/Bok|Dno|Plecy/.test(formatki), formatki.slice(0, 200));
  await karta.locator('label').filter({ hasText: 'Miejsce — szerokość' }).locator('input').fill('590'); await page.waitForTimeout(900);
  const reW = /Miejsce na zmywarkę ma 590 mm — zmywarka 60 cm potrzebuje 600–605 mm/;
  ok('miejsce 590: błąd z „Miejsce 600 mm”', JSON.stringify(await przyciski(reW)) === '["Miejsce 600 mm"]', (await przyciski(reW)).join(' / '));
  await klik(reW, 'Miejsce 600 mm');
  ok('po kliknięciu: 600, bez błędu', (await zap()).items[(await zap()).active].cab.W === 600 && !(await jest(reW)));
  ok('bez uwagi „nie ma ani wieńca, ani wzmocnień” o zmywarce', !(await jest(/„Zmywarka" nie ma ani wieńca/)));
  await page.locator('[data-el="z-szablonu"]').first().selectOption('lodowka-wolno'); await page.waitForTimeout(1000);
  p = await zap();
  const lo = p.items[p.active];
  ok('„+ z szablonu… Lodówka wolnostojąca”: „Lodówka” 700 × 1850, bez cokołu i nóżek', lo.cab.name === 'Lodówka' && lo.cab.sprzetCiagu.typ === 'lodowka'
    && lo.cab.W === 700 && lo.cab.H === 1850 && !lo.cab.plinth.on && !(lo.cab.legs || {}).on, JSON.stringify({ n: lo.cab.name, W: lo.cab.W, H: lo.cab.H, pl: lo.cab.plinth, legs: lo.cab.legs }));
  ok('lodówka: bez uwag o wysokości i cokole niezgodnych z ciągiem', !(await jest(/Wysokość 1850 mm nie zgadza się z ciągiem|Cokół tej szafki .* nie zgadza się/)));
  await page.locator('[data-el="sprzet-ciagu-karta"] label').filter({ hasText: 'Wysokość' }).first().locator('input').fill('1800'); await page.waitForTimeout(900);
  const reH = /Pozycja ma 1800 mm wysokości, a lodówka 1850 mm/;
  ok('wysokość 1800: ostrzeżenie z „Wysokość 1850 mm”', JSON.stringify(await przyciski(reH)) === '["Wysokość 1850 mm"]', (await przyciski(reH)).join(' / '));
  await klik(reH, 'Wysokość 1850 mm');
  ok('po kliknięciu: 1850, bez ostrzeżenia', (await zap()).items[(await zap()).active].cab.H === 1850 && !(await jest(reH)));
  // lodowka w srodek: A, Zmywarka, Lodowka, B
  await page.evaluate(() => { const q = JSON.parse(localStorage.getItem('szafki:projekt')); const o = ['A', 'Zmywarka', 'Lodówka', 'B'];
    q.items.sort((a, c) => o.indexOf(a.cab.name) - o.indexOf(c.cab.name)); q.active = 1; localStorage.setItem('szafki:projekt', JSON.stringify(q)); });
  await page.reload({ waitUntil: 'networkidle' }); await page.waitForTimeout(1500);
  ok('lodówka w środku ciągu: informacja o przerwie w cokole i dwóch kawałkach blatu', await jest(/Lodówka „Lodówka" stoi w środku ciągu — blat dzieli się przy niej na dwa kawałki, a cokół ciągu ma pod nią przerwę/));
  await widok('Ciąg'); await widok('Zamk.');
  ok('rysunek ciągu: zmywarka i lodówka, cokół w dwóch odcinkach', (await ile('[data-el="sprzet-ciagu"]')) === 2 && (await ile('[data-el="cokol-ciagu"]')) === 2,
    `${await ile('[data-el="sprzet-ciagu"]')} / ${await ile('[data-el="cokol-ciagu"]')}`);
  await widok('Z boku');
  ok('ciąg z boku: profile zmywarki i lodówki', (await ile('[data-el="sprzet-ciagu-z-boku"]')) === 2, String(await ile('[data-el="sprzet-ciagu-z-boku"]')));
  const z3 = await bryly3d('3D');
  ok('3D ciągu: bryły zmywarki i lodówki', z3.bryla === 2, JSON.stringify(z3));
}

ok('bez błędów strony', !errors.length, errors.join(' / '));
await b.close();
