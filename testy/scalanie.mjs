/* Scalanie szafek ciagu w jedna (uzytkownik 2026-10-24, salon: szafki 2, 3, 4).
   Boki pojedyncze — jedna szafka z przegrodami, wspolnym wiencem i dnem, wnetrza
   kolumn bez zmian. Dwie przegrody (uzytkownik 2026-10-29, zamiast „podwojnych” bokow, ktore
   zostawialy osobne szafki) — jedna szafka, na styku dwie plyty skrecone 4 wkretami.
   Warunki: obok siebie, ta sama wysokosc, glebokosc, podzial na poziomy. */
import pw from './pw.mjs';
const URL = process.env.STD ? 'http://127.0.0.1:5199/standalone-local.html'
  : 'http://127.0.0.1:5205/mebloprojekt-app.html';
const ok = (l, c, e = '') => console.log((c ? '  OK   ' : '  BLAD ') + l + (e ? ' — ' + e : ''));
const b = await pw.chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const page = await (await b.newContext({ viewport: { width: 1500, height: 1300 } })).newPage();
const errors = []; page.on('pageerror', (e) => errors.push(e.message));
await page.goto(URL, { waitUntil: 'networkidle' });

const BEZ = { on: false, height: 100, mode: 'under', setback: 0 };
const drzwi = { kind: 'doors', doors: 1, w: null, shelfTargets: [null, null] };
const szuf = { kind: 'drawers', w: null, drawers: [{ h: 'auto' }, { h: 'auto' }, { h: 'auto' }] };
const cab = (name, W, H, col = drzwi, o = {}) => ({ name, W, H, D: 500, plinth: BEZ, legs: { on: false, height: 100 },
  levels: [{ h: null, cols: [col] }], ...o });
const RUN = { id: 'c3', name: 'Ściana tv', roomId: 'p1', wallW: null, gap: 0, mountY: 0, H: 900, D: 500, plinth: BEZ, worktop: false, corner: null };
const seed = async (cabs, active = 1) => {
  await page.evaluate((q) => { localStorage.clear(); localStorage.setItem('szafki:projekt', JSON.stringify(q)); },
    { name: 'Salon', active, prices: {}, runs: [RUN], items: cabs.map((c) => ({ cab: c, runId: 'c3', offset: 0 })) });
  await page.reload({ waitUntil: 'networkidle' }); await page.waitForTimeout(1200);
};
const zap = async () => { await page.waitForTimeout(1000); return page.evaluate(() => JSON.parse(localStorage.getItem('szafki:projekt'))); };
const rows = (re) => page.evaluate((src) => { const r = new RegExp(src);
  const sec = [...document.querySelectorAll('section')].find((s) => r.test(s.querySelector('h2')?.textContent || ''));
  return sec ? [...sec.querySelectorAll('tbody tr')].map((tr) => [...tr.children].map((x) => x.innerText.trim().replace(/\s+/g, ' ')).join(' | ')) : []; }, re.source);
const SALON = () => [cab('S1', 1200, 1600, drzwi, { slupek: true }), cab('S2', 600, 900), cab('S3', 600, 900, szuf), cab('S4', 600, 900)];
const panel = () => page.locator('[data-el="scalanie"]');
const otworz = async () => { await page.locator('[data-el="scal-otworz"]').click(); await page.waitForTimeout(300); };
const zaznacz = async (nazwa, v = true) => { const x = panel().locator('label', { hasText: nazwa }).locator('input'); if (v) await x.check(); else await x.uncheck(); await page.waitForTimeout(200); };
const blad = async () => ((await panel().locator('[data-el="scal-blad"]').count()) ? panel().locator('[data-el="scal-blad"]').innerText() : '');

console.log('== warunki scalenia ==');
{
  await seed(SALON());
  await otworz();
  ok('start: aktywna S2 i sąsiad S3 zaznaczone, boki pojedyncze, przycisk „Scal”',
    JSON.stringify(await panel().locator('input[type=checkbox]').evaluateAll((xs) => xs.map((x) => x.checked))) === '[false,true,true,false]'
    && (await panel().getByRole('button', { name: 'Scal', exact: true }).count()) === 1);
  await zaznacz('S1');
  ok('S1 (1600) + S2 + S3: „Nie da się scalić: różna wysokość (900 i 1600 mm)”, bez „Scal”', /różna wysokość \(900 i 1600 mm\)/.test(await blad())
    && !(await panel().getByRole('button', { name: 'Scal', exact: true }).count()), await blad());
  await zaznacz('S1', false); await zaznacz('S3', false); await zaznacz('S4');
  ok('S2 + S4 (z przerwą): „szafki muszą stać obok siebie”', /muszą stać obok siebie/.test(await blad()), await blad());
  await page.getByRole('button', { name: 'Anuluj', exact: true }).first().click();
}

console.log('\n== znaczek ⊞ na pasku szafek (użytkownik 2026-10-24) ==');
{
  await seed(SALON(), 0);
  const ikony = page.locator('[data-el="scal-z-paska"]');
  ok('⊞ przy każdej szafce ciągu, z dymkiem „Scal z szafką obok w jedną”', (await ikony.count()) === 4 && (await ikony.first().getAttribute('title')) === 'Scal z szafką obok w jedną');
  ok('w karcie ciągu większy przycisk „⊞ Scal szafki w jedną…”', /text-sm/.test(await page.locator('[data-el="scal-otworz"]').getAttribute('class')));
  await ikony.nth(2).click(); await page.waitForTimeout(700);
  const p = await zap();
  ok('klik ⊞ przy S3: S3 aktywna, okienko z zaznaczonymi S3 i S4', p.active === 2 && (await panel().count()) === 1
    && JSON.stringify(await panel().locator('input[type=checkbox]').evaluateAll((xs) => xs.map((x) => x.checked))) === '[false,false,true,true]', `aktywna ${p.active}`);
  ok('okienko widoczne na ekranie (przewinięte)', await panel().isVisible());
}

console.log('\n== boki pojedyncze: jedna szafka z przegrodami ==');
{
  await seed(SALON());
  await otworz(); await zaznacz('S4');
  ok('S2 + S3 + S4: opis „Jedna szafka 1800 mm”', /Jedna szafka 1800 mm/.test(await panel().innerText()));
  await panel().getByRole('button', { name: 'Scal', exact: true }).click(); await page.waitForTimeout(800);
  const p = await zap();
  const c = p.items[p.active].cab;
  const kol = c.levels[0].cols;
  ok('2 szafki w projekcie, aktywna scalona „S2 + S3 + S4” 1800 × 900', p.items.length === 2 && c.name === 'S2 + S3 + S4' && c.W === 1800 && c.H === 900, `${p.items.length} ${c.name} ${c.W}`);
  // zwolnione 2 × 18 mm rowno na kolumny (uzytkownik 2026-10-24): 564 + 12
  ok('kolumny: drzwi / szuflady / drzwi, szerokości 576 / 576 / auto', JSON.stringify(kol.map((k) => [k.kind, k.w])) === '[["doors",576],["drawers",576],["doors",null]]', JSON.stringify(kol.map((k) => [k.kind, k.w])));
  const f = await rows(/^Formatki do zamówienia$/);
  ok('formatki: 2 przegrody pionowe, boki szafki, dno / wieniec 1764 (między bokami) × 2', f.some((r) => /^Przegroda pionowa .*\| 2 \|/.test(r)) && f.some((r) => /^Bok/.test(r)) && f.some((r) => /^Dno \/ wieniec .*\| 1764 \| 500 \| 2 \|/.test(r)),
    f.filter((r) => /Przegroda|Bok|Dno|Wieniec/.test(r)).join(' / '));
  const u = await page.evaluate(() => [...document.querySelectorAll('section')].find((s) => /^Uwagi/.test(s.querySelector('h2')?.textContent || ''))?.innerText || '');
  ok('bez błędów (×) w Uwagach', !/^×/m.test(u), u.split('\n').filter((l) => /^×/.test(l)).join(' / '));
}

console.log('\n== dwie przegrody na styku (użytkownik 2026-10-29) ==');
{
  await seed(SALON());
  await otworz();
  ok('w okienku „jedna przegroda” / „dwie przegrody”, bez dawnego „podwójne”', (await panel().getByRole('button', { name: 'dwie przegrody', exact: true }).count()) === 1
    && (await panel().getByRole('button', { name: 'jedna przegroda', exact: true }).count()) === 1 && !(await panel().getByRole('button', { name: 'podwójne', exact: true }).count()));
  await panel().getByRole('button', { name: 'dwie przegrody', exact: true }).click(); await page.waitForTimeout(200);
  ok('opis: jedna szafka 1200 mm, dwie przegrody skręcone 4 wkrętami, wnętrza jak w osobnych szafkach',
    /Jedna szafka 1200 mm: na stykach dwie przegrody obok siebie .*skręcone 4 wkrętami/.test(await panel().locator('[data-el="scal-opis"]').innerText()), await panel().locator('[data-el="scal-opis"]').innerText());
  await panel().getByRole('button', { name: 'Scal', exact: true }).click(); await page.waitForTimeout(800);
  const p = await zap();
  const c = p.items[p.active].cab, kol = c.levels[0].cols;
  ok('jedna szafka „S2 + S3” 1200, kolumny 564 / auto, na styku `przegrodaPodw`', p.items.length === 3 && c.name === 'S2 + S3' && c.W === 1200
    && kol[0].w === 564 && kol[0].przegrodaPodw === true && !kol[1].przegrodaPodw, JSON.stringify(kol.map((k) => [k.kind, k.w, !!k.przegrodaPodw])));
  const f = await rows(/^Formatki do zamówienia$/);
  ok('formatki: 2 przegrody pionowe, dno / wieniec 1164 × 2 (wspólne)', f.some((r) => /^Przegroda pionowa .*\| 2 \|/.test(r)) && f.some((r) => /^Dno \/ wieniec .*\| 1164 \| 500 \| 2 \|/.test(r)),
    f.filter((r) => /Przegroda|Bok|Dno|Wieniec/.test(r)).join(' / '));
  const hw = await rows(/^Produkty do zamówienia/);
  ok('produkty: 4 wkręty 4 × 30 na dwie przegrody', hw.some((r) => /^Wkręt 4 × 30 .*dwie przegrody na styku 1×4/.test(r)), hw.filter((r) => /Wkręt/.test(r)).join(' / '));
  const u = await page.evaluate(() => [...document.querySelectorAll('section')].find((s) => /^Uwagi/.test(s.querySelector('h2')?.textContent || ''))?.innerText || '');
  ok('bez błędów (×) w Uwagach', !/^×/m.test(u), u.split('\n').filter((l) => /^×/.test(l)).join(' / '));
  // plan wiercen w zestawieniu PDF (jak w `dxs`): obie plyty pary osobno, 4 wkrety przy dole i gorze
  await page.evaluate(() => { window.__rep = null; window.print = () => {
    // wszystkie szafki projektu — scalona nie jest pierwsza
    const ts = [...document.querySelectorAll('.print-only .rp-page table')].filter((x) => /Otwory pod/.test(x.querySelector('thead')?.textContent || ''));
    window.__rep = ts.flatMap((t) => [...t.querySelectorAll('tbody tr')].map((tr) => [...tr.children].map((x) => x.textContent.trim())));
  }; });
  await page.getByRole('button', { name: 'Zestawienie PDF', exact: true }).first().click();
  await page.waitForFunction(() => window.__rep, null, { timeout: 10000 }).catch(() => {});
  let pl = '';
  const plan = ((await page.evaluate(() => window.__rep)) || []).map((r) => { if (r[0]) pl = r[0]; return { panel: pl, kind: r[1], ys: r[2], note: r[3] }; });
  const wk = plan.filter((r) => r.kind === 'wkręt łączący przegrody');
  ok('plan wierceń: „Przegroda 1 — lewa” i „— prawa” osobno, wkręty łączące 4 (przy dole i górze, z przodu i z tyłu)', plan.some((r) => /Przegroda 1 — lewa/.test(r.panel))
    && plan.some((r) => /Przegroda 1 — prawa/.test(r.panel)) && wk.reduce((a, r) => a + String(r.ys).split(',').length, 0) === 4
    && wk.some((r) => /od przedniej krawędzi/.test(r.note)) && wk.some((r) => /od tylnej krawędzi/.test(r.note)),
    wk.map((r) => `${r.panel}: ${r.ys} — ${r.note.slice(0, 70)}`).join(' / '));
  await page.keyboard.press('Escape'); await page.reload({ waitUntil: 'networkidle' }); await page.waitForTimeout(800);
}

console.log('\n== widoki po scaleniu ==');
{
  await seed(SALON());
  await otworz(); await zaznacz('S4');
  await panel().getByRole('button', { name: 'Scal', exact: true }).click(); await page.waitForTimeout(800);
  const pick = async (l) => { const x = page.getByRole('button', { name: l, exact: true }); if (await x.count()) { await x.first().click(); await page.waitForTimeout(250); } };
  for (const w of ['Szafka', 'Ciąg']) for (const v of ['Zamk.', 'Otw.', 'Z góry', '3D']) {
    const k = errors.length;
    await pick(w); await pick(v);
    ok(`${w} / ${v}`, errors.length === k, errors.slice(k).join('; '));
  }
}

ok('bez błędów strony', !errors.length, errors.join(' / '));
await b.close();
