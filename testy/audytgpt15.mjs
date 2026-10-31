/* Audyt GPT N170–N190 (`AUDYT_GPT.md` na galezi gpt/audyt-2026-10-16, seria 2026-10-31) —
   przyciski naprawy klikniete w aplikacji (zasada uzytkownika: blad jest zalatwiony, gdy mowi,
   co zrobic, i ma dzialajacy przycisk):
   - N176 „Płyta nad element” — zmienia tylko ten poziom i nastepny, dalsze plyty zostaja;
   - N177 „Luz między drzwiami 2 mm”; N179 „Dodatkowe cofnięcie półek N mm”; N185 „Grubość
     korpusu 18 mm”; N186 „Zabuduj element”; N187 „Jeden …, siła z tabeli”; N190 „Frez 16 mm”;
   - N183 dwa nakladajace sie wyciecia — „Wycięcie lewe: N mm”;
   - N188 / N189 tip-on na cofnietej polce / w elemencie — „Dodatkowe cofnięcie półek 0 mm”,
     „Przełóż zawiasy na …”;
   - N171 / N173 / N180 nazwy formatek z wycieciami (dwa otwory, strony, wyciecie narozne).
   Liczby i reszta przypadkow — funkcje, suita `funkcje`. */
import pw from './pw.mjs';
const URL = process.env.STD ? 'http://127.0.0.1:5199/standalone-local.html'
  : 'http://127.0.0.1:5205/mebloprojekt-app.html';
const ok = (l, c, e = '') => console.log((c ? '  OK   ' : '  BLAD ') + l + (e ? ' — ' + e : ''));
const b = await pw.chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const page = await (await b.newContext({ viewport: { width: 1500, height: 1300 } })).newPage();
const errors = []; page.on('pageerror', (e) => errors.push(e.message));
await page.goto(URL, { waitUntil: 'networkidle' });

const NOGI = { plinth: { on: false }, legs: { on: true, height: 100 } };
const seedP = async (q) => {
  await page.evaluate((x) => { localStorage.clear(); localStorage.setItem('szafki:projekt', JSON.stringify(x)); }, q);
  await page.reload({ waitUntil: 'networkidle' }); await page.waitForTimeout(1500);
};
const seed = (cab, mat) => seedP({ name: 'P', active: 0, prices: {}, runs: [], items: [{ cab, runId: null, offset: 0, ...(mat ? { mat } : {}) }] });
const zap = async () => { await page.waitForTimeout(900); return page.evaluate(() => JSON.parse(localStorage.getItem('szafki:projekt'))); };
const notes = () => page.evaluate(() => {
  const sec = [...document.querySelectorAll('section')].find((s) => /^Uwagi$/.test((s.querySelector('h2') || {}).textContent || ''));
  return sec ? [...sec.querySelectorAll('li')].map((li) => ({ txt: li.textContent.trim(), btns: [...li.querySelectorAll('button')].map((x) => x.textContent.trim()) })) : [];
});
const rows = (re) => page.evaluate((src) => { const r = new RegExp(src);
  const sec = [...document.querySelectorAll('section')].find((s) => r.test(s.querySelector('h2')?.textContent || ''));
  return sec ? [...sec.querySelectorAll('tbody tr')].map((tr) => [...tr.children].map((x) => x.innerText.trim().replace(/\s+/g, ' ')).join(' | ')) : []; }, re.source);
const klik = async (re, label) => {
  const li = page.locator('section li').filter({ hasText: re }).first();
  await li.getByRole('button', { name: label, exact: true }).click();
  await page.waitForTimeout(700);
};
// przyciski naprawy uwagi (bez „✓” — oznacz jako przeczytane)
const przyciski = async (re) => ((await notes()).find((x) => re.test(x.txt)) || { btns: [] }).btns.filter((x) => x !== '✓');
const jest = async (re) => (await notes()).some((x) => re.test(x.txt));
const kol = (o = {}) => ({ kind: 'doors', doors: 1, w: null, shelfTargets: [null], ...o });
const el = (o) => ({ on: true, w: 100, d: 100, side: 'left', fromSide: 0, fromBack: 0, fullHeight: true, mask: false, ...o });

console.log('== N176: płyta nad element — dalsze poziomy zostają ==');
{
  await seed({ name: 'T', W: 800, H: 1800, D: 560, ...NOGI, obstacles: [el({ fullHeight: false, fromBottom: 400, h: 300 })],
    levels: [{ h: 500, cols: [{ kind: 'open', w: null, shelfTargets: [] }] }, { h: 500, cols: [{ kind: 'open', w: null, shelfTargets: [] }] }, { h: null, cols: [{ kind: 'open', w: null, shelfTargets: [] }] }] });
  const re = /przechodzi przez płytę między poziomami 1 i 2/;
  const lab = 'Płyta nad element (poziom 1: 700 mm, poziom 2: 300 mm)';
  ok('przycisk „' + lab + '”', (await przyciski(re)).includes(lab), (await przyciski(re)).join(' / '));
  await klik(re, lab);
  const L = (await zap()).items[0].cab.levels;
  ok('po kliknięciu: 700 / 300 / auto — trzeci poziom (i płyta nad drugim) bez zmian, bez ostrzeżenia', L[0].h === 700 && L[1].h === 300 && L[2].h == null && !(await jest(re)), JSON.stringify(L.map((l) => l.h)));
}

console.log('\n== N177, N179, N185, N190: przyciski przy komunikatach ==');
{
  await seed({ name: 'T', W: 600, H: 720, D: 560, ...NOGI, gaps: { edge: 2, between: 1, top: 3, bottom: 3, inset: 2 }, levels: [{ h: null, cols: [kol({ doors: 2 })] }] });
  await klik(/Luz między drzwiami poniżej 2 mm/, 'Luz między drzwiami 2 mm');
  ok('N177: „Luz między drzwiami 2 mm” — luz 2, bez ostrzeżenia', (await zap()).items[0].cab.gaps.between === 2 && !(await jest(/poniżej 2 mm/)));
  await seed({ name: 'T', W: 600, H: 720, D: 560, ...NOGI, shelfExtraSetback: 560, levels: [{ h: null, cols: [kol({ shelfTargets: [null, null] })] }] });
  const re179 = /Głębokość półki wychodzi zero/;
  const b179 = await przyciski(re179);
  ok('N179: przyciski „Dodatkowe cofnięcie półek N mm” (półka 100) i „… 0 mm”', b179.length === 2 && b179.includes('Dodatkowe cofnięcie półek 0 mm'), b179.join(' / '));
  await klik(re179, b179[0]);
  ok('N179: po kliknięciu pierwszego — bez błędu głębokości', !(await jest(re179)), String((await zap()).items[0].cab.shelfExtraSetback));
  await seed({ name: 'T', W: 600, H: 720, D: 560, ...NOGI, levels: [{ h: null, cols: [kol()] }] });
  const mat = (await zap()).items[0].mat;
  await seed({ name: 'T', W: 600, H: 720, D: 560, ...NOGI, levels: [{ h: null, cols: [kol()] }] }, { ...mat, board: { ...mat.board, thickness: 0 } });
  const re185 = /musi być większa od zera/;
  ok('N185: grubość 0 — „Grubość korpusu 18 mm”', JSON.stringify(await przyciski(re185)) === '["Grubość korpusu 18 mm"]', (await przyciski(re185)).join(' / '));
  await klik(re185, 'Grubość korpusu 18 mm');
  ok('N185: po kliknięciu — płyta 18 mm, bez błędu', (await zap()).items[0].mat.board.thickness === 18 && !(await jest(re185)));
  await seed({ name: 'T', W: 600, H: 720, D: 560, ...NOGI, back: 'hdf', backGroove: { on: true, depth: 18, offset: 3, play: 1 }, levels: [{ h: null, cols: [kol()] }] });
  const re190 = /^!?\s*Frez 18 mm jest równy grubości płyty/;
  ok('N190: „Frez 18 mm jest równy grubości płyty” z „Frez 16 mm (domyślny)”', (await przyciski(/Frez 18 mm jest równy/)).includes('Frez 16 mm (domyślny)'));
  await klik(/Frez 18 mm jest równy/, 'Frez 16 mm (domyślny)');
  ok('N190: po kliknięciu — frez 16, bez błędu', (await zap()).items[0].cab.backGroove.depth === 16 && !(await jest(/Frez 18 mm/)), String(re190));
}

console.log('\n== N186, N183, N180, N171, N173: element, wycięcia, nazwy formatek ==');
{
  await seed({ name: 'T', W: 800, H: 720, D: 560, ...NOGI, obstacles: [el({})], levels: [{ h: null, cols: [{ kind: 'open', w: null, shelfTargets: [] }] }] });
  const re186 = /nie ma zabudowy — nie jest zakryty/;
  await klik(re186, 'Zabuduj element (odgrodź od wnętrza)');
  ok('N186: „Zabuduj element” — zabudowa włączona, bez ostrzeżenia', (await zap()).items[0].cab.obstacles[0].mask === true && !(await jest(re186)));
  await seed({ name: 'T', W: 600, H: 720, D: 560, ...NOGI, back: 'none', cutout: { on: true, w: 400, d: 100, fullHeight: true, mask: true }, cutoutR: { on: true, w: 400, d: 100, fullHeight: true, mask: true },
    levels: [{ h: null, cols: [{ kind: 'open', w: null, shelfTargets: [] }] }] });
  const re183 = /nachodzą na siebie/;
  ok('N183: błąd z „Wycięcie lewe: 164 mm” i „Wycięcie prawe: 164 mm”', JSON.stringify(await przyciski(re183)) === '["Wycięcie lewe: 164 mm","Wycięcie prawe: 164 mm"]', (await przyciski(re183)).join(' / '));
  await klik(re183, 'Wycięcie lewe: 164 mm');
  ok('N183: po kliknięciu — lewe 164, bez błędu', (await zap()).items[0].cab.cutout.w === 164 && !(await jest(re183)));
  await seed({ name: 'T', W: 600, H: 720, D: 560, ...NOGI, cutout: { on: true, w: 100, d: 100, fullHeight: true, mask: true }, levels: [{ h: null, cols: [kol({ shelfTargets: [null, null] })] }] });
  const f180 = (await rows(/^Formatki/)).filter((r) => /^Półka/.test(r));
  ok('N180: formatka „Półka — wycięcie … w lewym tylnym rogu”, informacja zamiast „przytnij na miejscu”', f180.some((r) => /^Półka — wycięcie \d+ × \d+ w lewym tylnym rogu/.test(r))
    && !(await jest(/przytnij ją na miejscu/)), f180.join(' / '));
  await seed({ name: 'T', W: 800, H: 1200, D: 560, ...NOGI, obstacles: [el({ otwory: true }), el({ side: 'right', w: 150, d: 120, otwory: true })],
    levels: [{ h: 591, cols: [{ kind: 'open', w: null, shelfTargets: [] }] }, { h: null, cols: [{ kind: 'open', w: null, shelfTargets: [] }] }] });
  const f171 = (await rows(/^Formatki/)).filter((r) => /^Półka przelotowa/.test(r));
  ok('N171: formatka z oboma wycięciami (lewym i prawym)', f171.length === 1 && /w lewym tylnym rogu \+ wycięcie 132 × 120 w prawym tylnym rogu/.test(f171[0]), f171.join(' / '));
}

console.log('\n== N187: klapa w szafce narożnej — jeden podnośnik ==');
{
  await seed({ name: 'N', W: 600, H: 400, D: 560, plinth: { on: false }, legs: { on: false }, corner: { on: true, side: 'right', arm: 400, doors: 'wsporniki' },
    levels: [{ h: null, cols: [kol({ klapa: 'gora', silowniki: 2 })] }] });
  const re = /drugi podnośnik nie ma boku/;
  const bt = await przyciski(re);
  ok('ostrzeżenie z przyciskiem „Jeden z …, siła z tabeli”', bt.length === 1 && /^Jeden z (lewej|prawej), siła z tabeli$/.test(bt[0]), bt.join(' / '));
  if (bt[0]) await klik(re, bt[0]);
  const c = (await zap()).items[0].cab.levels[0].cols[0];
  ok('po kliknięciu: jeden podnośnik, siła auto, bez ostrzeżenia', c.silowniki === 1 && c.silaN === undefined && !(await jest(re)), JSON.stringify({ s: c.silowniki, n: c.silaN, str: c.podnosnikStrona }));
}

console.log('\n== N188, N189: tip-on ==');
{
  await seed({ name: 'T', W: 600, H: 2000, D: 560, ...NOGI, joints: { topL: 'none', topR: 'none', botL: 'none', botR: 'none' }, shelfExtraSetback: 200, handles: false,
    levels: [{ h: null, cols: [kol({ shelfTargets: [null, null], handles: [false], otwieranie: ['tipon'] })] }] });
  const re = /tip-on nie ma płyty/;
  ok('N188: półki cofnięte o 200 — błąd z powodem, „Uchwyt zamiast tip-on” i „Dodatkowe cofnięcie półek 0 mm”',
    (await notes()).some((x) => re.test(x.txt) && /cofnięte o 200 mm/.test(x.txt)) && JSON.stringify(await przyciski(re)) === '["Uchwyt zamiast tip-on","Dodatkowe cofnięcie półek 0 mm"]', (await przyciski(re)).join(' / '));
  await klik(re, 'Dodatkowe cofnięcie półek 0 mm');
  ok('N188: po kliknięciu — tip-on na półce, bez błędu', !(await jest(re)) && !(await jest(/tip-on wchodzi/)));
  await seed({ name: 'T', W: 600, H: 720, D: 560, ...NOGI, back: 'none', handles: false, obstacles: [el({ w: 40, fromSide: 550, fromBack: 460 })],
    levels: [{ h: null, cols: [kol({ handles: [false], otwieranie: ['tipon'] })] }] });
  const re2 = /tip-on wchodzi w/;
  ok('N189: błąd z „Uchwyt zamiast tip-on” i „Przełóż zawiasy na prawą”', JSON.stringify(await przyciski(re2)) === '["Uchwyt zamiast tip-on","Przełóż zawiasy na prawą"]', (await przyciski(re2)).join(' / '));
  await klik(re2, 'Przełóż zawiasy na prawą');
  ok('N189: po kliknięciu — zawiasy z prawej, tip-on z lewej, bez błędu', (await zap()).items[0].cab.levels[0].cols[0].hinge === 'right' && !(await jest(re2)));
}

ok('bez błędów strony', !errors.length, errors.join(' / '));
await b.close();
