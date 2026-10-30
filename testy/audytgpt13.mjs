/* Retest GPT N145–N149 (`AUDYT_GPT.md` na galezi gpt/audyt-2026-10-16) — przyciski
   naprawy, klikniete w aplikacji (zasada uzytkownika: blad jest zalatwiony, gdy mowi, co
   zrobic, i ma dzialajacy przycisk):
   - N145 tip-on wchodzacy w plecy plytkiej szafki: „Uchwyt zamiast tip-on”, „Głębokość szafki N mm”;
   - N147 polki konczace sie w przelocie bez przegrody: „Przywróć przegrodę”,
     „Jedna kolumna na całą szerokość” (decyzje uzytkownika 2026-10-30);
   - N149 zawieszka w wycieciu naroznika / przy elemencie w rogu: idzie na scianke zabudowy
     (dochodzi do sciany); bez zabudowy „Zabuduj wycięcie / element”, plytkie — „Wycięcie N mm
     w głąb” (uzytkownik 2026-10-30: „nie może wisieć w powietrzu”).
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

console.log('\n== N149: zawieszka w wycięciu narożnika ==');
{
  // plan wiercen jest w zestawieniu PDF — tabela „Otwory pod”
  const plan = async () => {
    await page.evaluate(() => {
      window.__snap = null;
      window.print = () => {
        const rep = document.querySelector('.print-only');
        const t = rep && [...rep.querySelectorAll('table.rp-tbl')].find((x) => [...x.querySelectorAll('th')].some((th) => th.textContent.trim() === 'Otwory pod'));
        window.__snap = t ? [...t.querySelectorAll('tbody tr')].map((tr) => [...tr.querySelectorAll('td')].map((td) => td.textContent.trim())) : null;
      };
    });
    await page.getByRole('button', { name: 'Zestawienie PDF', exact: true }).click(); await page.waitForTimeout(1800);
    // nazwa plyty tylko w pierwszym wierszu grupy — w kolejnych przenosimy ja dalej
    let pan = '';
    const r = ((await page.evaluate(() => window.__snap)) || []).map((x) => { if (x[0]) pan = x[0]; return [pan, ...x.slice(1)]; });
    await page.keyboard.press('Escape'); await page.waitForTimeout(300);
    return r;
  };
  const wis = (o = {}) => ({ name: 'W', W: 600, H: 1200, D: 560, plinth: { on: false }, legs: { on: false },
    cutout: { on: true, w: 100, d: 100, fullHeight: false, levelIndex: 1, mask: false },
    levels: [{ h: 591, cols: [{ kind: 'open', w: null, shelfTargets: [] }] }, { h: null, cols: [{ kind: 'open', w: null, shelfTargets: [] }] }], ...o });
  const re = /Zawieszka przy lewym boku wypada w wycięciu narożnika/;
  await seed(wis());
  let m = (await notes()).find((x) => re.test(x.txt));
  ok('wycięcie w górnym poziomie bez zabudowy — błąd „zawisłaby w powietrzu” z „Zabuduj wycięcie (zawieszka na zabudowie)”',
    !!m && /zawisłaby w powietrzu/.test(m.txt) && m.btns.includes('Zabuduj wycięcie (zawieszka na zabudowie)'), m && m.btns.join(' / '));
  await klik(re, 'Zabuduj wycięcie (zawieszka na zabudowie)');
  ok('po kliknięciu: zabudowa wycięcia włączona', (await zap()).items[0].cab.cutout.mask === true);
  const n = await notes();
  ok('po kliknięciu: bez błędu, informacja „na ściance bocznej zabudowy wycięcia”', !n.some((x) => re.test(x.txt))
    && n.some((x) => /Zawieszka przy lewym boku na ściance bocznej zabudowy wycięcia/.test(x.txt)), n.filter((x) => /Zawieszk/.test(x.txt)).map((x) => x.txt.slice(0, 90)).join(' / '));
  const pl = (await plan()).filter((r) => r[1] === 'zawieszka');
  ok('plan wierceń: zawieszka na ściance zabudowy i na boku prawym, nie na boku lewym', pl.length === 2 && pl.some((r) => /Zabudowa wycięcia \(lewy\) — ścianka boczna/.test(r[0]))
    && pl.some((r) => /Bok prawy/.test(r[0])) && !pl.some((r) => /Bok lewy/.test(r[0])), pl.map((r) => r[0]).join(' / '));
  ok('zamówienie: zawieszki 2 szt., „jedna na ściance zabudowy przy narożniku”', (await rows(/^Produkty do zamówienia/)).some((r) => /^Zawieszka/.test(r) && /jedna na ściance zabudowy przy narożniku/.test(r) && /\| 2 szt\.$/.test(r)));
  // plytkie wyciecie: scianka za krotka na zawieszke
  await seed(wis({ cutout: { on: true, w: 100, d: 20, fullHeight: false, levelIndex: 1, mask: true } }));
  m = (await notes()).find((x) => /ścianka zabudowy ma tylko/.test(x.txt));
  ok('wycięcie 20 mm w głąb — błąd „ścianka zabudowy ma tylko 38 mm” z „Wycięcie 30 mm w głąb”', !!m && m.btns.includes('Wycięcie 30 mm w głąb'), m && (m.txt.slice(0, 120) + ' / ' + m.btns.join(' / ')));
  await klik(/ścianka zabudowy ma tylko/, 'Wycięcie 30 mm w głąb');
  ok('po kliknięciu: wycięcie 30 mm, bez błędu o zawieszce', (await zap()).items[0].cab.cutout.d === 30 && !(await notes()).some((x) => /Zawieszka przy lewym boku wypada/.test(x.txt)));
  // element w prawym rogu na cala wysokosc — to samo co wyciecie
  await seed(wis({ cutout: { on: false }, H: 720, levels: [{ h: null, cols: [{ kind: 'open', w: null, shelfTargets: [] }] }],
    obstacles: [{ on: true, side: 'right', w: 120, d: 120, fromSide: 0, fromBack: 0, fullHeight: true, mask: false }] }));
  const reE = /Zawieszka przy prawym boku wypada w miejscu elementu/;
  m = (await notes()).find((x) => reE.test(x.txt));
  ok('element w prawym rogu bez zabudowy — błąd z „Zabuduj element (zawieszka na zabudowie)”', !!m && m.btns.includes('Zabuduj element (zawieszka na zabudowie)'), m && m.btns.join(' / '));
  await klik(reE, 'Zabuduj element (zawieszka na zabudowie)');
  ok('po kliknięciu: zabudowa elementu włączona, bez błędu o zawieszce', (await zap()).items[0].cab.obstacles[0].mask === true && !(await notes()).some((x) => reE.test(x.txt)));
}

ok('bez błędów strony', !errors.length, errors.join(' / '));
await b.close();
