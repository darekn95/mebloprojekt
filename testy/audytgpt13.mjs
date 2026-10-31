/* Retest GPT N145–N149 (`AUDYT_GPT.md` na galezi gpt/audyt-2026-10-16) — przyciski
   naprawy, klikniete w aplikacji (zasada uzytkownika: blad jest zalatwiony, gdy mowi, co
   zrobic, i ma dzialajacy przycisk):
   - N145 tip-on wchodzacy w plecy plytkiej szafki: „Uchwyt zamiast tip-on”, „Głębokość szafki N mm”;
   - N147 polki konczace sie w przelocie bez przegrody: „Przywróć przegrodę”,
     „Jedna kolumna na całą szerokość” (decyzje uzytkownika 2026-10-30);
   - N149 zawieszka w wycieciu naroznika / przy elemencie w rogu: idzie na scianke zabudowy
     (dochodzi do sciany); bez zabudowy „Zabuduj wycięcie / element”, plytkie — „Wycięcie N mm
     w głąb” (uzytkownik 2026-10-30: „nie może wisieć w powietrzu”);
   - N151 wlasny blat slupka w ciagu z blatem roboczym zostaje w jego formatkach;
   - N152 scalanie szafek z roznymi plecami: roznica w kreatorze, „płyty jak w B” daje plecy B;
   - decyzje uzytkownika 2026-10-30: N153 „Podziel kolumnę przegrodą” przy rurze > 3 m, N148
     „Do ściany” / „Listwa na dystansie” przy wiszacej z dala od sciany, N149 „2 konfirmaty
     przez wieniec” przy sciance zabudowy z zawieszka; N155 model tip-on w liscie projektu.
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

console.log('\n== N151 / N152: blat słupka, scalanie z różnymi plecami ==');
{
  const RUN = { id: 'c1', name: 'Ściana', roomId: null, wallW: null, gap: 0, mountY: 0, H: 720, D: 560, plinth: { on: false }, worktop: true, corner: null };
  const sz = (name, o = {}) => ({ name, W: 600, H: 720, D: 560, plinth: { on: false }, legs: { on: true, height: 100 },
    levels: [{ h: null, cols: [{ kind: 'doors', doors: 1, w: null, shelfTargets: [null] }] }], ...o });
  const seedRun = async (items, active, run = RUN) => {
    await page.evaluate((q) => { localStorage.clear(); localStorage.setItem('szafki:projekt', JSON.stringify(q)); },
      { name: 'P', active, prices: {}, runs: [run], items: items.map((cab) => ({ cab, runId: 'c1', offset: 0 })) });
    await page.reload({ waitUntil: 'networkidle' }); await page.waitForTimeout(1500);
  };
  const blat = { top: { mode: 'blat', material: 'board', overFront: 30 } };
  await seedRun([sz('A', blat), sz('B', { ...blat, H: 2000 })], 1);
  let f = await rows(/^Formatki do zamówienia$/);
  ok('N151: słupek B w ciągu z blatem roboczym — w jego formatkach własny blat 600 × 590', f.some((r) => /^Blat \|/.test(r) && /\| 600 \| 590 \|/.test(r)), f.filter((r) => /Blat/.test(r)).join(' / '));
  await seedRun([sz('A', blat), sz('B', { ...blat, H: 2000 })], 0);
  f = await rows(/^Formatki do zamówienia$/);
  ok('N151: kontrola — A pod blatem ciągu bez własnego blatu', !f.some((r) => /^Blat \|/.test(r)), f.filter((r) => /Blat/.test(r)).join(' / '));

  await seedRun([sz('A', { back: 'none' }), sz('B', { back: 'hdf' })], 0, { ...RUN, worktop: false });
  await page.locator('[data-el="scal-otworz"]').click(); await page.waitForTimeout(400);
  const pl = page.locator('[data-el="scalanie"] [data-el="scal-plyty"]');
  const t = (await pl.count()) ? await pl.innerText() : '';
  ok('N152: kreator — „różne płyty albo plecy”, plecy: A — bez pleców; B — HDF 3 mm', /różne płyty albo plecy/.test(t) && /plecy: A — bez pleców; B — HDF 3 mm/.test(t), t.replace(/\n/g, ' / '));
  await pl.getByRole('button', { name: 'B', exact: true }).click(); await page.waitForTimeout(300);
  await page.locator('[data-el="scalanie"]').getByRole('button', { name: 'Scal', exact: true }).click(); await page.waitForTimeout(1200);
  const p = await zap();
  f = await rows(/^Formatki do zamówienia$/);
  ok('N152: „płyty jak w B” → scalona szafka 1200 z plecami HDF (formatka 1198 × 718)', p.items.length === 1 && p.items[0].cab.back === 'hdf'
    && f.some((r) => /^Plecy HDF/.test(r) && /1198/.test(r) && /718/.test(r)), JSON.stringify(p.items.map((x) => [x.cab.W, x.cab.back])) + ' ' + f.filter((r) => /Plecy/.test(r)).join(' / '));
}

console.log('\n== decyzje 2026-10-30: N153, N148, N149, N155 ==');
{
  const seedP = async (q) => {
    await page.evaluate((x) => { localStorage.clear(); localStorage.setItem('szafki:projekt', JSON.stringify(x)); }, q);
    await page.reload({ waitUntil: 'networkidle' }); await page.waitForTimeout(1500);
  };
  // N153: szafa 3100 z rura 3062 — blad, „Podziel kolumnę przegrodą”
  await seed({ name: 'S', W: 3100, H: 2000, D: 560, plinth: { on: false }, legs: { on: true, height: 100 },
    levels: [{ h: null, cols: [{ kind: 'doors', doors: 2, w: null, shelfTargets: [400, null], drazki: [1] }] }] });
  const re153 = /rura ma 3062 mm/;
  let m = (await notes()).find((x) => re153.test(x.txt));
  ok('N153: błąd „rura ma 3062 mm” z „Podziel kolumnę przegrodą”', !!m && m.btns.includes('Podziel kolumnę przegrodą'), m && m.btns.join(' / '));
  await klik(re153, 'Podziel kolumnę przegrodą');
  let L = (await zap()).items[0].cab.levels[0];
  const n153 = await notes();
  ok('po kliknięciu: dwie kolumny po 1 drzwi z rurą, bez uwag o długości rury', L.cols.length === 2 && L.cols.every((c) => c.doors === 1 && JSON.stringify(c.drazki) === '[1]')
    && !n153.some((x) => /rura ma/.test(x.txt)), JSON.stringify(L.cols.map((c) => [c.w, c.doors, c.drazki])));
  // N148: gorny ciag, B wysunieta o 100 — „Do ściany” i „Listwa na dystansie 100 mm”
  const RUNG = { id: 'g1', name: 'Górne', roomId: null, wallW: null, gap: 0, mountY: 1500, H: 720, D: 300, plinth: null, worktop: false, corner: null, hangerMode: 'listwa' };
  const wis = (n) => ({ name: n, W: 600, H: 720, D: 300, plinth: { on: false }, legs: { on: false }, hangerMode: 'listwa', levels: [{ h: null, cols: [{ kind: 'doors', doors: 1, w: null, shelfTargets: [null] }] }] });
  const P148 = { name: 'P', active: 1, prices: {}, runs: [RUNG], items: [{ cab: wis('A'), runId: 'g1', offset: 0 }, { cab: wis('B'), runId: 'g1', offset: 100 }] };
  await seedP(P148);
  const re148 = /Szafka wisi 100 mm od ściany/;
  m = (await notes()).find((x) => re148.test(x.txt));
  ok('N148: błąd „wisi 100 mm od ściany” z „Do ściany (wysunięcie 0 mm)” i „Listwa na dystansie 100 mm”', !!m && m.btns.includes('Do ściany (wysunięcie 0 mm)') && m.btns.includes('Listwa na dystansie 100 mm'), m && m.btns.join(' / '));
  await klik(re148, 'Do ściany (wysunięcie 0 mm)');
  ok('po „Do ściany”: wysunięcie 0, bez błędu', (await zap()).items[1].offset === 0 && !(await notes()).some((x) => re148.test(x.txt)));
  await seedP(P148);
  await klik(re148, 'Listwa na dystansie 100 mm');
  const hw148 = await rows(/^Produkty do zamówienia/);
  // 100 mm — nie grubosc plyty ani dwie, wiec kantowka 100 × 60 (uzytkownik 2026-10-31)
  ok('po „Listwa na dystansie”: `dystans` 100, informacja, w zamówieniu kantówka dystansowa 100 × 60 mm', (await zap()).items[1].cab.dystans === 100
    && (await notes()).some((x) => /na kantówce dystansowej 100 × 60 mm/.test(x.txt)) && !(await notes()).some((x) => /zawisłaby w powietrzu/.test(x.txt))
    && hw148.some((r) => /^Kantówka dystansowa/.test(r) && /100 × 60/.test(r)), hw148.filter((r) => /dystans/i.test(r)).join(' / '));
  // N149: scianka zabudowy z zawieszka — „2 konfirmaty przez wieniec”
  await seed({ name: 'W', W: 600, H: 1200, D: 560, plinth: { on: false }, legs: { on: false },
    cutout: { on: true, w: 100, d: 100, fullHeight: false, levelIndex: 1, mask: true },
    levels: [{ h: 591, cols: [{ kind: 'open', w: null, shelfTargets: [] }] }, { h: null, cols: [{ kind: 'open', w: null, shelfTargets: [] }] }] });
  const re149 = /na ściance bocznej zabudowy wycięcia/;
  m = (await notes()).find((x) => re149.test(x.txt));
  ok('N149: informacja z „2 konfirmaty przez wieniec” i „2 trójkąty pod wieńcem”', !!m && m.btns.includes('2 konfirmaty przez wieniec') && m.btns.includes('2 trójkąty pod wieńcem'), m && m.btns.join(' / '));
  await klik(re149, '2 konfirmaty przez wieniec');
  m = (await notes()).find((x) => re149.test(x.txt));
  const hw149 = await rows(/^Produkty do zamówienia/);
  ok('po kliknięciu: `zawMocowanie` konfirmaty, informacja „złączona … 2 konfirmatami”, konfirmaty w zamówieniu', (await zap()).items[0].cab.cutout.zawMocowanie === 'konfirmaty'
    && !!m && /2 konfirmatami/.test(m.txt) && hw149.some((r) => /^Konfirmat 7 × 50/.test(r) && /ścianka zabudowy z zawieszką do wieńca 2/.test(r)), hw149.filter((r) => /Konfirmat/.test(r)).join(' / '));
  // N155: dwie szafki z tip-on — w liscie projektu model AM-SVN-DL-MG-30
  const tip = (n) => ({ name: n, W: 600, H: 720, D: 560, plinth: { on: false }, legs: { on: true, height: 100 }, handles: false,
    levels: [{ h: null, cols: [{ kind: 'doors', doors: 1, w: null, shelfTargets: [null], handles: [false], otwieranie: ['tipon'] }] }] });
  await seedP({ name: 'P', active: 0, prices: {}, runs: [], items: [{ cab: tip('A'), runId: null, offset: 0 }, { cab: tip('B'), runId: null, offset: 0 }] });
  // dwie karty: „Produkty do zamówienia — A” i „Produkty całego projektu — P”
  const pr = await rows(/^Produkty całego projektu/);
  ok('N155: lista produktów projektu — tip-on z modelem AM-SVN-DL-MG-30, 2 szt.', pr.some((r) => /Odbojnik tip-on/.test(r) && /AM-SVN-DL-MG-30/.test(r) && /\b2 szt\./.test(r)), pr.filter((r) => /tip-on/.test(r)).join(' / '));
}

ok('bez błędów strony', !errors.length, errors.join(' / '));
await b.close();
