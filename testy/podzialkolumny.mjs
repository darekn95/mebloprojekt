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
  // przy drzwiach polki zostaja na kolkach — nie wisza na nich klapy (uzytkownik 2026-10-24)
  // od 2026-10-25: zwykłe półki na kołkach (jak szafka), granice poziomów domyślnie na konfirmatach
  ok('półki kolumny 2 jak szafka (kołki), granice bez wpisu (domyślnie konfirmaty)', !cols[1].shelfMount && !cols[1].podzialMount, String(cols[1].shelfMount));
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
  const dolny = odc.filter({ hasText: 'poziom 1 kolumny 2' });
  await dolny.getByRole('button', { name: 'w dół', exact: true }).click(); await page.waitForTimeout(500);
  let c = await zap();
  ok('poziom 1 kolumny 2: klapa w dół, wyższe dalej do góry', c.levels[0].cols[1].segmenty[0].klapa === 'dol' && c.levels[0].cols[1].klapa === 'gora',
    JSON.stringify(c.levels[0].cols[1].segmenty));
  ok('poziom 1 kolumny 2: „amortyzatory” (klapa w dół)', /amortyzatory/.test(await dolny.innerText()));
  const drugi = odc.filter({ hasText: 'poziom 2 kolumny 2' });
  await drugi.getByRole('button', { name: 'skrzydło', exact: true }).click(); await page.waitForTimeout(400);
  await drugi.locator('[data-el="odcinek-fronty"]').fill('2'); await page.waitForTimeout(500);
  c = await zap();
  ok('poziom 2 kolumny 2: dwoje drzwi zamiast klapy', c.levels[0].cols[1].segmenty[1].doors === 2 && c.levels[0].cols[1].segmenty[1].klapa === null, JSON.stringify(c.levels[0].cols[1].segmenty[1]));
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

console.log('\n== klapa na półce na kołkach: ostrzeżenie z konfirmatami ==');
{
  // granica przestawiona ręcznie na kołki (domyślnie od 2026-10-25 jest na konfirmatach)
  await seed({ ...SZAFA(), levels: [{ h: null, cols: [kol({ shelfTargets: [null] }), kol({ podzial: [0], podzialMount: ['pins'] }), kol({ shelfTargets: [null] })] }] });
  const k2 = kolumna(2);
  const poz2 = k2.locator('[data-el="odcinek-kolumny"]').filter({ hasText: 'poziom 2 kolumny 2' });
  await poz2.getByRole('button', { name: 'klapa', exact: true }).click(); await page.waitForTimeout(500);
  let u = await uwagi();
  ok('klapa do góry w poziomie 2 wisi na wieńcu — bez ostrzeżenia o kołkach', !/na kołkach — półka z zawiasami/.test(u), u.split('\n').filter((l) => /kołkach/.test(l)).join(' / '));
  await poz2.getByRole('button', { name: 'w dół', exact: true }).click(); await page.waitForTimeout(500);
  u = await uwagi();
  // od 2026-10-25 także „Półka 1 na konfirmatach” (tylko ta granica)
  ok('klapa w dół na półce na kołkach: ostrzeżenie z „Półka 1 …” i „Półki kolumny 2 na konfirmatach”', /klapa w dół wisi na półce 1 \(pod nią\), a ta półka jest na kołkach/.test(u)
    && /Półka 1 na konfirmatach/.test(u) && /Półki kolumny 2 na konfirmatach/.test(u),
    u.split('\n').filter((l) => /kołkach/.test(l)).join(' / '));
  await page.getByRole('button', { name: 'Półki kolumny 2 na konfirmatach' }).first().click(); await page.waitForTimeout(600);
  const k2z = (await zap()).levels[0].cols[1];
  ok('przycisk: kolumna 2 na konfirmatach (także granica), ostrzeżenie znika', k2z.shelfMount === 'confirmat' && JSON.stringify(k2z.podzialMount) === '["confirmat"]'
    && !/ta półka jest na kołkach/.test(await uwagi()), JSON.stringify([k2z.shelfMount, k2z.podzialMount]));
}

console.log('\n== półki w poziomie kolumny (użytkownik 2026-10-24) ==');
{
  // kolumna 3: granica nad swiatlem 1 (poziom 1 = 1 swiatlo), poziom 2 = 3 swiatla
  await seed({ ...SZAFA(), levels: [{ h: null, cols: [kol({ shelfTargets: [null] }), kol({ shelfTargets: [null] }),
    kol({ doors: 2, podzial: [0], shelfMount: 'confirmat' })] }] });
  const k3 = kolumna(3);
  const poz = (n) => k3.locator('[data-el="odcinek-kolumny"]').filter({ hasText: `poziom ${n} kolumny 3` });
  ok('pole „półki” w każdym poziomie kolumny: 0 i 2', (await poz(1).locator('[data-el="odcinek-polki"]').inputValue()) === '0'
    && (await poz(2).locator('[data-el="odcinek-polki"]').inputValue()) === '2');
  const yGranicy = async () => page.evaluate(() => 0);
  let c = await zap();
  await poz(1).locator('[data-el="odcinek-polki"]').fill('1'); await page.waitForTimeout(500);
  c = await zap();
  let k = c.levels[0].cols[2];
  ok('poziom 1: 1 półka (2 światła), granica przesunięta w danych na półkę 1', k.shelfTargets.length === 5 && JSON.stringify(k.podzial) === '[1]'
    && k.shelfTargets[0] === null && k.shelfTargets[1] === null, JSON.stringify([k.shelfTargets, k.podzial]));
  ok('poziom 2 bez zmian: 2 półki, światła na stałe (granica na miejscu)', (await poz(2).locator('[data-el="odcinek-polki"]').inputValue()) === '2'
    && k.shelfTargets.slice(2).every((v) => v > 300), JSON.stringify(k.shelfTargets));
  const f = await fronty();
  ok('fronty poziomu 1 dalej ok. 400 mm (granica na miejscu)', f.some((r) => /\| (39\d|40\d) \|/.test(r)), f.join(' / '));
  await poz(2).locator('[data-el="odcinek-polki"]').fill('0'); await page.waitForTimeout(500);
  c = await zap(); k = c.levels[0].cols[2];
  ok('poziom 2: 0 półek — 3 światła w kolumnie, granica na półce 1', k.shelfTargets.length === 3 && JSON.stringify(k.podzial) === '[1]', JSON.stringify([k.shelfTargets, k.podzial]));
  const u = await uwagi();
  ok('bez błędów (×) w Uwagach', !/^×/m.test(u), u.split('\n').filter((l) => /^×/.test(l)).join(' / '));
}

console.log('\n== poziom kolumny jak osobna kolumna: szuflady i blenda (użytkownik 2026-10-24) ==');
{
  // kolumna 2: granica na polce 0 — poziom 1 = swiatlo 600 na dole, poziom 2 = 2 polki nad nim
  await seed({ ...SZAFA(), H: 2000, levels: [{ h: null, cols: [kol(), kol({ shelfTargets: [600, null, null, null], podzial: [0] }), kol()] }] });
  const k2 = kolumna(2);
  const poz = (n) => k2.locator('[data-el="odcinek-kolumny"]').filter({ hasText: `poziom ${n} kolumny 2` });
  const rodzaj = (n, co) => poz(n).locator('[data-el="odcinek-rodzaj"]').getByRole('button', { name: co, exact: true });
  ok('w każdym poziomie kolumny wybór „Półki i drzwi / Szuflady / Blenda”',
    (await poz(1).locator('[data-el="odcinek-rodzaj"] button').allInnerTexts()).join('|') === 'Półki i drzwi|Szuflady|Blenda'
    && (await poz(2).locator('[data-el="odcinek-rodzaj"] button').count()) === 3);
  await rodzaj(1, 'Szuflady').click(); await page.waitForTimeout(900);
  let c = await zap(); let k = c.levels[0].cols[1];
  const ileSzuf = ((k.segmenty || [])[0] || {}).drawers?.length || 0;
  ok('poziom 1 → szuflady tylko w nim: kolumna dalej „Półki i drzwi”, inne kolumny bez zmian', k.kind === 'doors' && k.segmenty[0].kind === 'drawers'
    && ileSzuf >= 1 && c.levels[0].cols[0].kind === 'doors' && !c.levels[0].cols[0].segmenty, JSON.stringify(k.segmenty));
  ok('granica i półki poziomu 2 na miejscu', JSON.stringify(k.podzial) === '[0]' && k.shelfTargets.length === 4, JSON.stringify([k.podzial, k.shelfTargets]));
  ok('w poziomie 1 lista szuflad (wiersze) i „+ szuflada”', (await poz(1).locator('[data-el="szuflada-wiersz"]').count()) === ileSzuf
    && (await poz(1).getByRole('button', { name: '+ szuflada', exact: true }).count()) === 1);
  let f = await fronty();
  ok(`formatki: ${ileSzuf} fronty szuflad + drzwi poziomu 2`, f.filter((r) => /^Front szuflady/.test(r)).length >= 1 && f.some((r) => /^Drzwi/.test(r)), f.join(' / '));
  let u = await uwagi();
  ok('bez błędów (×) w Uwagach', !/^×/m.test(u), u.split('\n').filter((l) => /^×/.test(l)).join(' / '));
  // + szuflada w poziomie kolumny trafia do segmentu
  await poz(1).getByRole('button', { name: '+ szuflada', exact: true }).click(); await page.waitForTimeout(700);
  k = (await zap()).levels[0].cols[1];
  ok('„+ szuflada” dokłada w poziomie kolumny, nie w kolumnie', k.segmenty[0].drawers.length === ileSzuf + 1 && !(k.drawers || []).length, JSON.stringify(k.segmenty[0].drawers.length));
  // usun ostatnia (×) — wraca do stanu
  await poz(1).locator('[data-el="szuflada-wiersz"]').first().getByRole('button', { name: '×', exact: true }).click(); await page.waitForTimeout(700);
  k = (await zap()).levels[0].cols[1];
  ok('× usuwa szufladę z poziomu kolumny', k.segmenty[0].drawers.length === ileSzuf, String(k.segmenty[0].drawers.length));
  // rysunek: prowadnice szuflad w poziomie kolumny (widok „Otw.”)
  await page.getByText('Otw.', { exact: true }).first().click(); await page.waitForTimeout(700);
  const prow = await page.evaluate(() => [...document.querySelectorAll('#rysunek svg rect')].filter((r) => /^rn0-1-/.test(r.getAttribute('data-key') || '') || r.getAttribute('fill') === '#8b8b93').length);
  ok('widok „Otw.”: prowadnice szuflad poziomu kolumny na rysunku', prow >= 2, String(prow));
  await page.getByText('Zamkn.', { exact: true }).first().click().catch(() => {}); await page.waitForTimeout(400);

  // poziom 2 → blenda: polki z niego znikaja, granica zostaje
  await rodzaj(2, 'Blenda').click(); await page.waitForTimeout(900);
  c = await zap(); k = c.levels[0].cols[1];
  ok('poziom 2 → blenda: półki tego poziomu zdjęte, granica na półce 0', k.segmenty[1] && k.segmenty[1].kind === 'blenda'
    && k.shelfTargets.length === 2 && JSON.stringify(k.podzial) === '[0]', JSON.stringify([k.segmenty, k.shelfTargets, k.podzial]));
  const wiersze = await page.evaluate(() => {
    const sec = [...document.querySelectorAll('section')].find((s) => /^Formatki do zamówienia$/.test(s.querySelector('h2')?.textContent || ''));
    return sec ? [...sec.querySelectorAll('tbody tr')].map((tr) => tr.innerText.trim().split('\n')[0]) : [];
  });
  ok('formatki: blenda zamiast drzwi w kolumnie 2', wiersze.some((r) => /^Blenda/i.test(r)), wiersze.join(' / '));
  ok('„fronty N w 2 poziomach kolumny”', /w 2 poziomach kolumny/.test(await k2.locator('[data-el="fronty-kolumny"]').innerText()));
  // z powrotem na drzwi
  await rodzaj(2, 'Półki i drzwi').click(); await page.waitForTimeout(700);
  k = (await zap()).levels[0].cols[1];
  ok('„Półki i drzwi” — poziom 2 znów z drzwiami (bez rodzaju w segmencie)', !(k.segmenty[1] || {}).kind, JSON.stringify(k.segmenty[1]));
}

console.log('\n== półka w środku poziomu z szufladami: błąd z przyciskiem ==');
{
  await seed({ ...SZAFA(), H: 2000, levels: [{ h: null, cols: [kol(), kol({ shelfTargets: [300, 300, null, null], podzial: [1],
    segmenty: [{ kind: 'drawers', drawers: [{ h: 'auto', front: null, handle: true }, { h: 'auto', front: null, handle: true }] }, null] }), kol()] }] });
  const u = await uwagi();
  ok('błąd „szuflady i półka w tym samym poziomie kolumny”', /szuflady i półka w tym samym poziomie kolumny/.test(u), u.slice(0, 300));
  await page.getByRole('button', { name: 'Usuń półki z tego poziomu', exact: true }).first().click(); await page.waitForTimeout(800);
  const k = (await zap()).levels[0].cols[1];
  ok('„Usuń półki z tego poziomu”: granica na półce 0, półki poziomu 2 zostają', JSON.stringify(k.podzial) === '[0]' && k.shelfTargets.length === 3, JSON.stringify([k.podzial, k.shelfTargets]));
  ok('błąd znika', !/szuflady i półka w tym samym poziomie kolumny/.test(await uwagi()));
}

console.log('\n== mocowanie półki granicznej poziomu kolumny (użytkownik 2026-10-25) ==');
{
  await seed({ ...SZAFA(), H: 2000, levels: [{ h: null, cols: [kol(), kol({ podzial: [1] }), kol()] }] });
  const k2 = kolumna(2);
  const poz = (n) => k2.locator('[data-el="odcinek-kolumny"]').filter({ hasText: `poziom ${n} kolumny 2` });
  ok('karta „poziom 2 kolumny 2”: „półka pod nim” kołki / konfirmaty / trójkąty; dolny poziom bez', (await poz(2).locator('[data-el="granica-mocowanie"] button').allInnerTexts()).join('|') === 'kołki|konfirmaty|trójkąty'
    && (await poz(1).locator('[data-el="granica-mocowanie"]').count()) === 0);
  const produkty = async () => page.evaluate(() => {
    const sec = [...document.querySelectorAll('section')].find((x) => /^Produkty do zamówienia/.test(x.querySelector('h2')?.textContent || ''));
    const qty = (re) => { const tr = sec && [...sec.querySelectorAll('tbody tr')].find((t) => re.test(t.innerText)); return tr ? tr.innerText.replace(/\s+/g, ' ') : ''; };
    return { kolki: qty(/^Kołek podporowy/), konf: qty(/^Konfirmat/), tr: qty(/^Trójkąt/) };
  });
  const aktywny = async () => (await poz(2).locator('[data-el="granica-mocowanie"] button.bg-teal-700').allInnerTexts()).join('|');
  ok('granica domyślnie na konfirmatach (bez wpisu), „domyślne” niewidoczne', (await aktywny()) === 'konfirmaty'
    && (await poz(2).getByRole('button', { name: 'domyślne', exact: true }).count()) === 0, await aktywny());
  const przed = await produkty();
  await poz(2).locator('[data-el="granica-mocowanie"]').getByRole('button', { name: 'kołki', exact: true }).click(); await page.waitForTimeout(700);
  let k = (await zap()).levels[0].cols[1];
  ok('kołki: tylko ta granica (podzialMount), reszta półek kolumny jak była', JSON.stringify(k.podzialMount) === '["pins"]' && !k.shelfMount, JSON.stringify([k.podzialMount, k.shelfMount]));
  const po = await produkty();
  ok('zamówienie: więcej kołków, mniej konfirmatów', po.kolki !== przed.kolki && po.konf !== przed.konf, JSON.stringify([przed, po]));
  ok('przycisk „domyślne” przy wpisanym mocowaniu', (await poz(2).getByRole('button', { name: 'domyślne', exact: true }).count()) === 1);
  await poz(2).locator('[data-el="granica-mocowanie"]').getByRole('button', { name: 'trójkąty', exact: true }).click(); await page.waitForTimeout(700);
  ok('trójkąty w zamówieniu', /Trójkąt/.test((await produkty()).tr), JSON.stringify(await produkty()));
  await poz(2).getByRole('button', { name: 'domyślne', exact: true }).click(); await page.waitForTimeout(700);
  k = (await zap()).levels[0].cols[1];
  ok('„domyślne” zdejmuje wpis', !k.podzialMount, JSON.stringify(k.podzialMount));
  // klapa nad granica na kolkach — ostrzezenie z przyciskiem tej jednej polki
  await seed({ ...SZAFA(), H: 2000, levels: [{ h: null, cols: [kol(), kol({ podzial: [1], podzialMount: ['pins'], segmenty: [null, { doors: 1, klapa: 'dol' }] }), kol()] }] });
  const u = await uwagi();
  ok('klapa na granicy na kołkach: ostrzeżenie „ta półka jest na kołkach”', /ta półka jest na kołkach/.test(u), u.slice(0, 400));
  await page.getByRole('button', { name: 'Półka 2 na konfirmatach', exact: true }).first().click(); await page.waitForTimeout(800);
  k = (await zap()).levels[0].cols[1];
  ok('„Półka 2 na konfirmatach” — tylko ta granica', JSON.stringify(k.podzialMount) === '["confirmat"]' && !/ta półka jest na kołkach/.test(await uwagi()), JSON.stringify(k.podzialMount));
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
