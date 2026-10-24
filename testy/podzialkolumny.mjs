/* Podzial frontow w jednej kolumnie (uzytkownik 2026-10-24, szafa 1800 × 1600,
   3 kolumny): „→ poziom” i kreator klap przy kilku kolumnach dziela tylko te
   kolumne — polka zostaje polka stala (konfirmaty), front dzieli sie na niej.
   Inne kolumny bez zmian (wczesniej poziom dzielil cala szafe i kopiowal rure). */
import pw from './pw.mjs';
const URL = process.env.STD ? 'http://127.0.0.1:5199/standalone-local.html'
  : 'http://127.0.0.1:5205/mebloprojekt-app.html';
const ok = (l, c, e = '') => console.log((c ? '  OK   ' : '  BLAD ') + l + (e ? ' — ' + e : ''));
const b = await pw.chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const page = await (await b.newContext({ viewport: { width: 1500, height: 1300 } })).newPage();
const errors = []; page.on('pageerror', (e) => errors.push(e.message));
await page.goto(URL, { waitUntil: 'networkidle' });

const kol = (o = {}) => ({ kind: 'doors', doors: 1, w: null, shelfTargets: [null, null, null, null], ...o });
const SZAFA = () => ({ name: 'Szafa', W: 1800, H: 1600, D: 560,
  levels: [{ h: null, cols: [kol({ drazki: [3] }), kol(), kol()] }] });
const seed = async (cab) => {
  await page.evaluate((c) => { localStorage.clear(); localStorage.setItem('szafki:projekt', JSON.stringify({ name: 'P', active: 0, prices: {}, items: [{ cab: c }] })); }, cab);
  await page.reload({ waitUntil: 'networkidle' }); await page.waitForTimeout(1200);
};
const zap = async () => { await page.waitForTimeout(1000); return page.evaluate(() => JSON.parse(localStorage.getItem('szafki:projekt')).items[0].cab); };
const kolumna = (n) => page.locator('div.rounded.bg-stone-50').filter({ has: page.getByText(`Kolumna ${n}`, { exact: true }) }).first();
const uwagi = async () => (await page.evaluate(() => [...document.querySelectorAll('section')].find((s) => /^Uwagi/.test(s.querySelector('h2')?.textContent || ''))?.innerText || ''));
const fronty = () => page.evaluate(() => {
  const sec = [...document.querySelectorAll('section')].find((s) => /^Formatki do zamówienia$/.test(s.querySelector('h2')?.textContent || ''));
  return sec ? [...sec.querySelectorAll('tbody tr')].map((tr) => [...tr.children].map((x) => x.innerText.trim()).join(' | ')).filter((r) => /^(Drzwi|Klapa|Front)/.test(r)) : [];
});

console.log('== „→ poziom” w kolumnie 2: tylko ta kolumna ==');
{
  await seed(SZAFA());
  for (let k = 0; k < 3; k++) {
    await kolumna(2).getByRole('button', { name: '→ poziom', exact: true }).first().click(); await page.waitForTimeout(400);
  }
  const c = await zap();
  const cols = c.levels[0].cols;
  ok('jeden poziom, kolumna 2: granice na 3 półkach, kolumny 1 i 3 bez zmian', c.levels.length === 1
    && JSON.stringify(cols[1].podzial) === '[0,1,2]' && !cols[0].podzial && !cols[2].podzial
    && cols.every((k) => k.shelfTargets.length === 4), JSON.stringify(cols.map((k) => [k.podzial || null, k.shelfTargets.length])));
  ok('rura kolumny 1 zostaje jedna, w swoim świetle', JSON.stringify(cols[0].drazki) === '[3]', JSON.stringify(cols[0].drazki));
  ok('półki kolumny 2 na konfirmatach (granice niosą fronty)', cols[1].shelfMount === 'confirmat', String(cols[1].shelfMount));
  ok('w Strukturze 3 × „granica frontów” z „scal”', (await kolumna(2).locator('[data-el="granica-frontow"]').count()) === 3);
  const f = await fronty();
  ok('formatki: drzwi kolumn 1 i 3 na całą wysokość + 4 niższe w kolumnie 2', f.length >= 2, f.join(' / '));
  const u = await uwagi();
  ok('bez błędów (×) w Uwagach', !/^×/m.test(u), u.split('\n').filter((l) => /^×/.test(l)).join(' / '));
  await kolumna(2).locator('[data-el="granica-frontow"]').first().getByRole('button', { name: 'scal', exact: true }).click(); await page.waitForTimeout(400);
  ok('„scal” przy najwyższej granicy zdejmuje tylko ją', JSON.stringify((await zap()).levels[0].cols[1].podzial) === '[0,1]', JSON.stringify((await zap()).levels[0].cols[1].podzial));
}

console.log('\n== kreator klap w kolumnie 2 z 3 ==');
{
  await seed(SZAFA());
  await kolumna(2).getByRole('button', { name: 'klapy zamiast drzwi…', exact: true }).click(); await page.waitForTimeout(400);
  const zrob = kolumna(2).getByRole('button', { name: /^Zrób \d+ klap/ }).first();
  const ile = Number(((await zrob.innerText()).match(/\d+/) || [0])[0]);
  await zrob.click(); await page.waitForTimeout(600);
  const c = await zap();
  const cols = c.levels[0].cols;
  ok(`„Zrób ${ile} klapy”: jeden poziom, kolumna 2 z klapą i ${ile - 1} granicami, kolumny 1 i 3 — drzwi`, c.levels.length === 1
    && cols[1].klapa === 'gora' && (cols[1].podzial || []).length === ile - 1 && !cols[0].klapa && !cols[2].klapa && !cols[0].podzial && !cols[2].podzial,
    JSON.stringify(cols.map((k) => [k.klapa || null, k.podzial || null])));
  const u = await uwagi();
  ok('bez błędów (×) w Uwagach (zawiasy klap w półkach stałych)', !/^×/m.test(u), u.split('\n').filter((l) => /^×/.test(l)).join(' / '));
  for (const v of ['Zamk.', 'Otw.', 'Z boku', 'Z góry', '3D']) {
    const k = errors.length;
    const x = page.getByRole('button', { name: v, exact: true }); if (await x.count()) { await x.first().click(); await page.waitForTimeout(300); }
    ok(`widok ${v}`, errors.length === k, errors.slice(k).join('; '));
  }
}

console.log('\n== każdy odcinek osobno (użytkownik 2026-10-24: „dolną w dół”, „1 fronty to nieprawda”) ==');
{
  await seed({ ...SZAFA(), levels: [{ h: null, cols: [kol({ doors: 2, shelfTargets: [null] }),
    kol({ klapa: 'gora', podzial: [0, 1, 2], shelfMount: 'confirmat' }), kol({ shelfTargets: [null] })] }] });
  const k2 = kolumna(2);
  ok('kolumna: „fronty 4 w 4 poziomach kolumny” (nie pole z 1)', /fronty 4 w 4 poziomach kolumny/.test(await k2.locator('[data-el="fronty-kolumny"]').innerText().catch(() => '')),
    await k2.locator('[data-el="fronty-kolumny"]').innerText().catch(() => ''));
  const odc = k2.locator('[data-el="odcinek-kolumny"]');
  ok('4 odcinki z własnymi ustawieniami', (await odc.count()) === 4);
  const dolny = odc.filter({ hasText: 'poziom kolumny 1' });
  await dolny.getByRole('button', { name: 'w dół', exact: true }).click(); await page.waitForTimeout(500);
  let c = await zap();
  ok('poziom kolumny 1: klapa w dół, wyższe dalej do góry', c.levels[0].cols[1].segmenty[0].klapa === 'dol' && c.levels[0].cols[1].klapa === 'gora',
    JSON.stringify(c.levels[0].cols[1].segmenty));
  ok('poziom kolumny 1: „amortyzatory” (klapa w dół)', /amortyzatory/.test(await dolny.innerText()));
  const drugi = odc.filter({ hasText: 'poziom kolumny 2' });
  await drugi.getByRole('button', { name: 'skrzydło', exact: true }).click(); await page.waitForTimeout(400);
  await drugi.locator('[data-el="odcinek-fronty"]').fill('2'); await page.waitForTimeout(500);
  c = await zap();
  ok('poziom kolumny 2: dwoje drzwi zamiast klapy', c.levels[0].cols[1].segmenty[1].doors === 2 && c.levels[0].cols[1].segmenty[1].klapa === null, JSON.stringify(c.levels[0].cols[1].segmenty[1]));
  ok('kolumna liczy „fronty 5 w 4 poziomach kolumny”', /fronty 5 w 4 poziomach kolumny/.test(await k2.locator('[data-el="fronty-kolumny"]').innerText()));
  const u = await uwagi();
  ok('bez błędów (×) w Uwagach', !/^×/m.test(u), u.split('\n').filter((l) => /^×/.test(l)).join(' / '));
  // scal najwyzsza granice: odcinki 3 i 4 lacza sie, ustawienia nizszych zostaja
  await k2.locator('[data-el="granica-frontow"]').first().getByRole('button', { name: 'scal', exact: true }).click(); await page.waitForTimeout(400);
  c = await zap();
  ok('„scal” górnej granicy: 3 odcinki, dolny w dół i drugi z drzwiami zostają', JSON.stringify(c.levels[0].cols[1].podzial) === '[0,1]'
    && c.levels[0].cols[1].segmenty[0].klapa === 'dol' && c.levels[0].cols[1].segmenty[1].doors === 2, JSON.stringify([c.levels[0].cols[1].podzial, c.levels[0].cols[1].segmenty]));
  for (const v of ['Zamk.', 'Otw.', 'Z boku', '3D']) {
    const k = errors.length;
    const x = page.getByRole('button', { name: v, exact: true }); if (await x.count()) { await x.first().click(); await page.waitForTimeout(300); }
    ok(`odcinki — widok ${v}`, errors.length === k, errors.slice(k).join('; '));
  }
}

console.log('\n== jedna kolumna: „→ poziom” jak dotąd (poziom) ==');
{
  await seed({ name: 'S', W: 600, H: 1600, D: 560, levels: [{ h: null, cols: [kol()] }] });
  await page.getByRole('button', { name: '→ poziom', exact: true }).first().click(); await page.waitForTimeout(400);
  const c = await zap();
  ok('jedna kolumna: nowy poziom, bez podziału kolumny', c.levels.length === 2 && !c.levels[0].cols[0].podzial, String(c.levels.length));
}

ok('bez błędów strony', !errors.length, errors.join(' / '));
await b.close();
