/* Retest GPT N145–N149 (`AUDYT_GPT.md` na galezi gpt/audyt-2026-10-16) — przyciski
   naprawy, klikniete w aplikacji (zasada uzytkownika: blad jest zalatwiony, gdy mowi, co
   zrobic, i ma dzialajacy przycisk):
   - N145 tip-on wchodzacy w plecy plytkiej szafki: „Uchwyt zamiast tip-on”, „Głębokość szafki N mm”;
   - N147 polki konczace sie w przelocie bez przegrody: „Przywróć przegrodę”,
     „Jedna kolumna na całą szerokość” (decyzje uzytkownika 2026-10-30).
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
const seed = async (cab) => {
  await page.evaluate((c) => { localStorage.clear(); localStorage.setItem('szafki:projekt', JSON.stringify({ name: 'P', active: 0, prices: {}, runs: [], items: [{ cab: c, runId: null, offset: 0 }] })); }, cab);
  await page.reload({ waitUntil: 'networkidle' }); await page.waitForTimeout(1500);
};
const zap = async () => { await page.waitForTimeout(900); return page.evaluate(() => JSON.parse(localStorage.getItem('szafki:projekt'))); };
const notes = () => page.evaluate(() => {
  const sec = [...document.querySelectorAll('section')].find((s) => /^Uwagi$/.test((s.querySelector('h2') || {}).textContent || ''));
  return sec ? [...sec.querySelectorAll('li')].map((li) => ({ txt: li.textContent.trim(), btns: [...li.querySelectorAll('button')].map((x) => x.textContent.trim()) })) : [];
});
const rows = (re) => page.evaluate((src) => { const r = new RegExp(src);
  const sec = [...document.querySelectorAll('section')].find((s) => r.test(s.querySelector('h2')?.textContent || ''));
  return sec ? [...sec.querySelectorAll('tbody tr')].map((tr) => [...tr.children].map((x) => x.innerText.trim().replace(/\s+/g, ' ')).join(' | ')) : []; }, re.source);
// przycisk w uwadze pasujacej do `re`
const klik = async (re, label) => {
  const li = page.locator('section li').filter({ hasText: re }).first();
  await li.getByRole('button', { name: label, exact: true }).click();
  await page.waitForTimeout(700);
};

console.log('== N145: tip-on wchodzi w plecy ==');
{
  const tip = { name: 'T', W: 600, H: 300, D: 80, ...NOGI, handles: false,
    levels: [{ h: null, cols: [{ kind: 'doors', doors: 1, w: null, shelfTargets: [null], handles: [false], otwieranie: ['tipon'] }] }] };
  await seed(tip);
  let m = (await notes()).find((x) => /wchodzi w plecy/.test(x.txt));
  ok('błąd „wchodzi w plecy” z przyciskami „Uchwyt zamiast tip-on” i „Głębokość szafki 89 mm”',
    !!m && m.btns.includes('Uchwyt zamiast tip-on') && m.btns.includes('Głębokość szafki 89 mm'), m && m.btns.join(' / '));
  ok('przed: tip-on w zamówieniu', (await rows(/^Produkty do zamówienia/)).some((r) => /tip-on|SALTO/i.test(r)));
  await klik(/wchodzi w plecy/, 'Uchwyt zamiast tip-on');
  const c = (await zap()).items[0].cab.levels[0].cols[0];
  ok('„Uchwyt zamiast tip-on”: drzwi z uchwytem, bez otwierania tip-on', c.handles[0] === true && !c.otwieranie[0], JSON.stringify({ h: c.handles, o: c.otwieranie }));
  ok('po kliknięciu: bez błędu o tip-on, bez tip-on w zamówieniu', !(await notes()).some((x) => /tip-on/.test(x.txt))
    && !(await rows(/^Produkty do zamówienia/)).some((r) => /tip-on|SALTO/i.test(r)));
  await seed(tip);
  await klik(/wchodzi w plecy/, 'Głębokość szafki 89 mm');
  const cab = (await zap()).items[0].cab;
  ok('„Głębokość szafki 89 mm”: szafka D 89, tip-on zostaje, bez błędu', cab.D === 89 && cab.levels[0].cols[0].otwieranie[0] === 'tipon'
    && !(await notes()).some((x) => /wchodzi w plecy/.test(x.txt)), 'D ' + cab.D);
}

console.log('\n== N147: półki kończą się w przelocie ==');
{
  const prz = { name: 'P', W: 1000, H: 720, D: 560, ...NOGI, levels: [{ h: null, cols: [
    { kind: 'doors', doors: 1, w: null, shelfTargets: [null, null], noDiv: true, hinge: 'left' },
    { kind: 'doors', doors: 1, w: null, shelfTargets: [null, null], hinge: 'right' }] }] };
  await seed(prz);
  const re = /nie ma przegrody \(przelot\)/;
  let m = (await notes()).find((x) => re.test(x.txt));
  ok('błąd o przelocie z przyciskami „Przywróć przegrodę” i „Jedna kolumna na całą szerokość”',
    !!m && m.btns.includes('Przywróć przegrodę') && m.btns.includes('Jedna kolumna na całą szerokość'), m && m.btns.join(' / '));
  await klik(re, 'Przywróć przegrodę');
  let L = (await zap()).items[0].cab.levels[0];
  ok('„Przywróć przegrodę”: dwie kolumny, bez `noDiv`', L.cols.length === 2 && !L.cols[0].noDiv);
  const fm = await rows(/^Formatki/);
  ok('po kliknięciu: bez błędu, przegroda w formatkach', !(await notes()).some((x) => re.test(x.txt)) && fm.some((r) => /^Przegroda/.test(r)), fm.filter((r) => /Przegroda/.test(r)).join(' / '));
  await seed(prz);
  await klik(re, 'Jedna kolumna na całą szerokość');
  L = (await zap()).items[0].cab.levels[0];
  ok('„Jedna kolumna na całą szerokość”: jedna kolumna (auto), dwoje drzwi, półki zostają', L.cols.length === 1 && L.cols[0].w === null && L.cols[0].doors === 2
    && L.cols[0].shelfTargets.length === 2 && !L.cols[0].noDiv, JSON.stringify(L.cols));
  const n = await notes();
  ok('po kliknięciu: bez błędów w uwagach', !n.some((x) => re.test(x.txt) || /w powietrzu/.test(x.txt)), n.map((x) => x.txt.slice(0, 80)).join(' / '));
  const f2 = await rows(/^Formatki/);
  ok('formatki: bez przegrody, półka na całą szerokość (964)', !f2.some((r) => /^Przegroda/.test(r)) && f2.some((r) => /^Półka/.test(r) && / 964 /.test(r)), f2.filter((r) => /Półka|Przegroda/.test(r)).join(' / '));
}

ok('bez błędów strony', !errors.length, errors.join(' / '));
await b.close();
