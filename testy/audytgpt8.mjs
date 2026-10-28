/* Audyt GPT 2026-10-27, ustalenia N86–N87 (`AUDYT_GPT.md` na galezi gpt/audyt-2026-10-16):
   - N86 „scal” ostatniej granicy kolumny zostawia ustawienia dolnego poziomu (wczesniej
     kolumna wracala do swoich: znikal tip-on, wracal uchwyt i zawias z lewej); cofnij;
     rozne wnetrza (szuflady / blenda / drzwi) — okno „ktory zostaje” (uzytkownik 2026-10-28),
     takze „×” przy polce granicznej; szuflady i blenda zabieraja polki scalonego poziomu;
   - N87 mocowanie amortyzatora / podnosnika na klapie musi lezec na zamawianym froncie —
     za duzy podfrez: blad z „Podfrez N mm” (najwiekszy mozliwy) i „Tip-on zamiast podfrezu”. */
import pw from './pw.mjs';
const URL = process.env.STD ? 'http://127.0.0.1:5199/standalone-local.html'
  : 'http://127.0.0.1:5205/mebloprojekt-app.html';
const ok = (l, c, e = '') => console.log((c ? '  OK   ' : '  BLAD ') + l + (e ? ' — ' + e : ''));
const b = await pw.chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const page = await (await b.newContext({ viewport: { width: 1500, height: 1300 } })).newPage();
const errors = []; page.on('pageerror', (e) => errors.push(e.message));
await page.goto(URL, { waitUntil: 'networkidle' });

const seed = async (cab) => {
  await page.evaluate((c) => { localStorage.clear(); localStorage.setItem('szafki:projekt', JSON.stringify({ name: 'P', active: 0, prices: {}, runs: [], items: [{ cab: c, runId: null, offset: 0 }] })); }, cab);
  await page.reload({ waitUntil: 'networkidle' }); await page.waitForTimeout(1200);
};
const zap = async () => { await page.waitForTimeout(800); return page.evaluate(() => JSON.parse(localStorage.getItem('szafki:projekt')).items[0].cab.levels[0].cols[0]); };
const notes = () => page.evaluate(() => {
  const sec = [...document.querySelectorAll('section')].find((s) => /^Uwagi$/.test((s.querySelector('h2') || {}).textContent || ''));
  return sec ? [...sec.querySelectorAll('li')].map((li) => ({
    txt: li.textContent.trim(), btns: [...li.querySelectorAll('button')].map((x) => x.textContent.trim()),
  })) : [];
});
const rows = (re) => page.evaluate((src) => { const r = new RegExp(src);
  const sec = [...document.querySelectorAll('section')].find((s) => r.test(s.querySelector('h2')?.textContent || ''));
  return sec ? [...sec.querySelectorAll('tbody tr')].map((tr) => [...tr.children].map((x) => x.innerText.trim().replace(/\s+/g, ' ')).join(' | ')) : []; }, re.source);
const produkty = () => rows(/^Produkty do zamówienia/);
const fronty = async () => (await rows(/^Formatki do zamówienia$/)).filter((r) => /^(Drzwi|Klapa|Front)/.test(r));
const szt = (lista, re) => { const r = lista.find((x) => re.test(x)); return r ? Number((r.match(/\|\s*(\d+)\s*(szt|kpl)/) || [])[1] || 0) : 0; };
const scal = async () => { await page.locator('[data-el="granica-frontow"]').first().getByRole('button', { name: 'scal', exact: true }).click(); await page.waitForTimeout(800); };
const SZ = { name: 'S', W: 600, H: 1200, D: 560, plinth: { on: false }, legs: { on: true, height: 100 } };

console.log('== N86: „scal” ostatniej granicy — zostają ustawienia dolnego poziomu ==');
{
  // dol: jedne drzwi bez uchwytu, tip-on, zawias z prawej; gora: dwoje drzwi z uchwytami
  await seed({ ...SZ, levels: [{ h: null, cols: [{ kind: 'doors', w: null, doors: 2, shelfTargets: [400, null], podzial: [0],
    segmenty: [{ doors: 1, hinge: 'right', handles: [false], otwieranie: ['tipon'] }] }] }] });
  const p0 = await produkty();
  ok('przed: tip-on 1, uchwyty 2 (góra)', szt(p0, /^Odbojnik tip-on/) === 1 && szt(p0, /^Uchwyt/) === 2, p0.filter((r) => /tip-on|Uchwyt/.test(r)).join(' / '));
  await scal();
  const c = await zap();
  ok('po scaleniu: bez podziału, kolumna ma ustawienia dolnego (1 drzwi, zawias z prawej, bez uchwytu, tip-on)',
    !c.podzial && !c.segmenty && c.doors === 1 && c.hinge === 'right' && JSON.stringify(c.handles) === '[false]' && JSON.stringify(c.otwieranie) === '["tipon"]', JSON.stringify(c));
  const p1 = await produkty();
  ok('zamówienie: tip-on 1, bez uchwytów', szt(p1, /^Odbojnik tip-on/) === 1 && !p1.some((r) => /^Uchwyt/.test(r)), p1.filter((r) => /tip-on|Uchwyt/.test(r)).join(' / '));
  const f = await fronty();
  ok('jedne drzwi na całą wysokość', f.length === 1 && /^Drzwi/.test(f[0]), f.join(' / '));
  await page.getByRole('button', { name: '↶ Cofnij', exact: true }).click(); await page.waitForTimeout(800);
  const u = await zap();
  ok('„Cofnij” przywraca granicę i oba poziomy', JSON.stringify(u.podzial) === '[0]' && u.segmenty && u.segmenty[0] && u.segmenty[0].hinge === 'right' && u.doors === 2, JSON.stringify(u));

  // dwie granice (w karcie wypisane od gory): scal gornej — srodkowy laczy sie z gornym, zostaja jego ustawienia
  await seed({ ...SZ, levels: [{ h: null, cols: [{ kind: 'doors', w: null, doors: 2, shelfTargets: [300, 300, null], podzial: [0, 1],
    segmenty: [{ doors: 1, hinge: 'right' }, { doors: 1, hinge: 'left', handles: [false], otwieranie: ['tipon'] }] }] }] });
  await scal();
  let c2 = await zap();
  ok('dwie granice, scal górnej: zostaje granica 1, środkowy poziom (tip-on) sięga do góry', JSON.stringify(c2.podzial) === '[0]'
    && c2.segmenty[0].hinge === 'right' && JSON.stringify(c2.segmenty[1].otwieranie) === '["tipon"]', JSON.stringify(c2));
  await scal();
  c2 = await zap();
  ok('potem scal ostatniej: kolumna = dolny poziom (1 drzwi, zawias z prawej)', !c2.podzial && !c2.segmenty && c2.doors === 1 && c2.hinge === 'right' && !c2.otwieranie, JSON.stringify(c2));
}

console.log('\n== N86: różne wnętrza — „scal” pyta, który poziom zostaje (użytkownik 2026-10-28) ==');
{
  // dol: szuflada DXS, gora: dwoje drzwi i polka nad granica
  const MIX = () => ({ ...SZ, levels: [{ h: null, cols: [{ kind: 'doors', w: null, doors: 2, shelfTargets: [400, null, null], podzial: [0],
    segmenty: [{ kind: 'drawers', drawers: [{ system: 'dxs' }] }] }] }] });
  const okno = () => page.locator('[data-okno="scal-poziomy"]');
  const bledy = async () => (await notes()).filter((x) => /^×/.test(x.txt)).map((x) => x.txt.slice(0, 90));
  await seed(MIX());
  await scal();
  let t = await okno().count() ? await okno().innerText() : '';
  ok('okno: „Scalić poziomy 1 i 2 kolumny 1?”, na dole szuflady (1), na górze drzwi (2) i półki, półki znikną',
    /Scalić poziomy 1 i 2 kolumny 1\?/.test(t) && /Na dole szuflady \(1\), na górze drzwi \(2\) i półki/.test(t) && /półki z tego miejsca \(także ta granica\) znikną/.test(t), t.replace(/\n/g, ' / '));
  await okno().getByRole('button', { name: 'Anuluj', exact: true }).click(); await page.waitForTimeout(500);
  let c = await zap();
  ok('„Anuluj” — nic się nie zmienia', JSON.stringify(c.podzial) === '[0]' && c.segmenty[0].kind === 'drawers' && c.shelfTargets.length === 3, JSON.stringify(c));
  await scal();
  await okno().getByRole('button', { name: /^Zostaw dolny/ }).click(); await page.waitForTimeout(800);
  c = await zap();
  ok('„Zostaw dolny”: kolumna szuflad, bez podziału i bez półek', c.kind === 'drawers' && !c.podzial && !c.segmenty && JSON.stringify(c.shelfTargets) === '[null]'
    && (c.drawers || []).length === 1, JSON.stringify(c));
  let p = await produkty(), f = await fronty();
  ok('zamówienie: komplet DXS, bez zawiasów i drzwi; bez błędów (×)', p.some((r) => /^Prowadnica Sevroll DXS/.test(r)) && !p.some((r) => /^Zawias/.test(r))
    && !f.some((r) => /^Drzwi/.test(r)) && !(await bledy()).length, `${p.filter((r) => /Prowadnica|Zawias/.test(r)).join(' / ')} | ${(await bledy()).join(' / ')}`);
  await page.getByRole('button', { name: '↶ Cofnij', exact: true }).click(); await page.waitForTimeout(800);
  c = await zap();
  ok('„Cofnij” — wraca podział i półka', JSON.stringify(c.podzial) === '[0]' && c.segmenty[0].kind === 'drawers' && c.shelfTargets.length === 3, JSON.stringify(c));
  await scal();
  await okno().getByRole('button', { name: /^Zostaw górny/ }).click(); await page.waitForTimeout(800);
  c = await zap();
  ok('„Zostaw górny”: drzwi (2) na całą wysokość, półki zostają (2), bez szuflad', (c.kind || 'doors') === 'doors' && !c.podzial && !c.segmenty && c.doors === 2
    && c.shelfTargets.length === 3 && !(c.drawers || []).length, JSON.stringify(c));
  p = await produkty();
  ok('zamówienie: bez prowadnic, zawiasy są', !p.some((r) => /^Prowadnica/.test(r)) && p.some((r) => /^Zawias/.test(r)), p.filter((r) => /Prowadnica|Zawias/.test(r)).join(' / '));

  // „×” przy polce granicznej miedzy roznymi wnetrzami — to samo pytanie
  await seed(MIX());
  const gr = page.locator('[data-el="granica-frontow"]').first().locator('xpath=..');
  await gr.getByRole('button', { name: '×', exact: true }).click(); await page.waitForTimeout(500);
  t = await okno().count() ? await okno().innerText() : '';
  ok('„×” przy półce granicznej: okno „Usunąć półkę między poziomy 1 i 2 kolumny 1?”', /Usunąć półkę między poziomy 1 i 2 kolumny 1\?/.test(t), t.replace(/\n/g, ' / '));
  await okno().getByRole('button', { name: /^Zostaw górny/ }).click(); await page.waitForTimeout(800);
  c = await zap();
  ok('„Zostaw górny” po „×”: półka graniczna znika (zostaje 1), drzwi (2), bez podziału', !c.podzial && c.shelfTargets.length === 2 && c.doors === 2 && !c.segmenty, JSON.stringify(c));

  // srodkowa granica: szuflada / drzwi z polka / drzwi — scal dolnej, zostaw szuflady
  await seed({ ...SZ, levels: [{ h: null, cols: [{ kind: 'doors', w: null, doors: 1, shelfTargets: [300, null, null, 300], podzial: [0, 2],
    segmenty: [{ kind: 'drawers', drawers: [{ system: 'dxs' }] }, { doors: 2 }, { doors: 1, hinge: 'right' }] }] }] });
  await page.locator('[data-el="granica-frontow"]').last().getByRole('button', { name: 'scal', exact: true }).click(); await page.waitForTimeout(500);
  await okno().getByRole('button', { name: /^Zostaw dolny/ }).click(); await page.waitForTimeout(800);
  c = await zap();
  ok('środkowa: szuflady zajmują dwa dolne poziomy, półki z nich znikają, górny bez zmian', JSON.stringify(c.podzial) === '[0]' && c.shelfTargets.length === 2
    && c.segmenty[0].kind === 'drawers' && c.segmenty[1].hinge === 'right' && c.shelfTargets[1] === 300, JSON.stringify(c));
  ok('bez błędu „szuflady i półka w tym samym poziomie”', !(await notes()).some((x) => /szuflady i półk/.test(x.txt)), (await bledy()).join(' / '));
  // te same wnetrza — bez pytania
  await seed({ ...SZ, levels: [{ h: null, cols: [{ kind: 'doors', w: null, doors: 2, shelfTargets: [400, null], podzial: [0], segmenty: [{ doors: 1 }] }] }] });
  await scal();
  ok('drzwi / drzwi: bez okna, zostaje dolny', (await okno().count()) === 0 && (await zap()).doors === 1, String(await okno().count()));
}

console.log('\n== N87: mocowanie amortyzatora na klapie po podfrezie ==');
{
  const KL = (o = {}) => ({ name: 'K', W: 600, H: 300, D: 350, plinth: { on: false }, legs: { on: false }, hangers: 'always',
    levels: [{ h: null, cols: [{ kind: 'doors', w: null, doors: 1, klapa: 'dol', silowniki: 2, handles: [false], otwieranie: ['podfrez'], shelfTargets: [null], ...o }] }] });
  await seed(KL({ otwieranieMm: [200] }));
  let n = (await notes()).find((x) => /mocowanie amortyzatora na froncie/.test(x.txt));
  ok('podfrez 200: błąd „klapa 596 × 79 … otwory 77 i 101 mm … najwyżej 168 mm”', !!n && /596 × 79 mm/.test(n.txt) && /otwory 77 i 101 mm od dołu klapy/.test(n.txt) && /najwyżej 168 mm/.test(n.txt),
    JSON.stringify(n || (await notes()).map((x) => x.txt.slice(0, 80))));
  ok('przyciski „Podfrez 168 mm” i „Tip-on zamiast podfrezu”', !!n && n.btns.includes('Podfrez 168 mm') && n.btns.includes('Tip-on zamiast podfrezu'), JSON.stringify(n && n.btns));
  await page.getByRole('button', { name: 'Podfrez 168 mm', exact: true }).click(); await page.waitForTimeout(800);
  ok('„Podfrez 168 mm”: wpis 168, klapa 111 mm, błąd znika', JSON.stringify((await zap()).otwieranieMm) === '[168]'
    && (await fronty()).some((r) => /^Klapa/.test(r) && /\b111\b/.test(r)) && !(await notes()).some((x) => /mocowanie amortyzatora/.test(x.txt)), (await fronty()).join(' / '));
  await seed(KL({ otwieranieMm: [180] }));
  await page.getByRole('button', { name: 'Tip-on zamiast podfrezu', exact: true }).click(); await page.waitForTimeout(800);
  ok('podfrez 180 → „Tip-on zamiast podfrezu”: otwieranie tip-on, bez błędu', JSON.stringify((await zap()).otwieranie) === '["tipon"]' && !(await notes()).some((x) => /mocowanie amortyzatora/.test(x.txt)));
  for (const mm of [20, 100]) {
    await seed(KL({ otwieranieMm: [mm] }));
    ok(`podfrez ${mm}: bez błędu mocowania`, !(await notes()).some((x) => /mocowanie amortyzatora/.test(x.txt)));
  }
  await seed(KL({ silowniki: 1, podnosnikStrona: 'right', otwieranieMm: [200] }));
  ok('jeden amortyzator z prawej, podfrez 200: ten sam błąd', (await notes()).some((x) => /mocowanie amortyzatora na froncie/.test(x.txt) && /najwyżej 168 mm/.test(x.txt)));
  // poziom kolumny: dolna klapa w dol z podfrezem 220
  await seed({ name: 'K', W: 600, H: 700, D: 350, plinth: { on: false }, legs: { on: false }, hangers: 'always',
    levels: [{ h: null, cols: [{ kind: 'doors', w: null, doors: 1, shelfTargets: [300, null], podzial: [0],
      segmenty: [{ doors: 1, klapa: 'dol', silowniki: 2, handles: [false], otwieranie: ['podfrez'], otwieranieMm: [220] }] }] }] });
  n = (await notes()).find((x) => /mocowanie amortyzatora na froncie/.test(x.txt));
  ok('poziom kolumny, podfrez 220: błąd „poziom 1 kolumny 1” z przyciskami', !!n && /poziom 1 kolumny 1: klapa w dół/.test(n.txt) && n.btns.some((x) => /^Podfrez \d+ mm$/.test(x)) && n.btns.includes('Tip-on zamiast podfrezu'),
    JSON.stringify(n || (await notes()).map((x) => x.txt.slice(0, 80))));
}

ok('bez błędów strony', errors.length === 0, errors.join(' | '));
await b.close();
