/* Wlasne plyty (uzytkownik 2026-10-24): „+” w kwadracie przy kolorach plyt dodaje
   plyte spoza wzornika — nazwa, grubosc, wymiar arkusza, cena (np. Egger na
   zamowienie). Osobny rzad „Własne płyty” pod wzornikiem (znak „W”). Rozkroj
   bierze jej arkusz, wycena jej cene; zmiana przechodzi do szafek z ta plyta. */
import pw from './pw.mjs';
const URL = process.env.STD ? 'http://127.0.0.1:5199/standalone-local.html'
  : 'http://127.0.0.1:5205/mebloprojekt-app.html';
const ok = (l, c, e = '') => console.log((c ? '  OK   ' : '  BLAD ') + l + (e ? ' — ' + e : ''));
const b = await pw.chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const page = await (await b.newContext({ viewport: { width: 1500, height: 1300 } })).newPage();
const errors = []; page.on('pageerror', (e) => errors.push(e.message));
await page.goto(URL, { waitUntil: 'networkidle' });

const cab = (name, W) => ({ name, W, H: 720, D: 560, levels: [{ h: null, cols: [{ kind: 'doors', doors: 1, w: null, shelfTargets: [null, null] }] }] });
const seed = async (q) => {
  await page.evaluate((p) => { localStorage.clear(); localStorage.setItem('szafki:projekt', JSON.stringify(p)); }, q);
  await page.reload({ waitUntil: 'networkidle' }); await page.waitForTimeout(1500);
};
const zap = async () => { await page.waitForTimeout(1000); return page.evaluate(() => JSON.parse(localStorage.getItem('szafki:projekt'))); };
const sekcja = (re) => page.locator('section').filter({ has: page.locator('h2', { hasText: re }) }).first();
// karta zwinieta ma w sobie sam tytul — wtedy klikamy, zeby ja rozwinac
const otworz = async (re) => { const s = sekcja(re); if ((await s.innerText()).length < 120) { await s.locator('h2').click(); await page.waitForTimeout(500); } return s; };
const wpisz = async (form, etykieta, v) => { await form.locator('label', { hasText: etykieta }).locator('input').fill(String(v)); await page.waitForTimeout(150); };

console.log('== „+” przy kolorach: nowa płyta ==');
{
  await seed({ name: 'P', active: 0, prices: {}, items: [{ cab: cab('A', 600) }, { cab: cab('B', 800) }] });
  const plyty = await otworz(/^Płyty$/);
  const plus = plyty.locator('[data-el="plyta-dodaj"]').first();
  ok('kwadrat „+” przy kolorach płyty', (await plus.count()) === 1 && /własną płytę/.test(await plus.getAttribute('title')));
  await plus.click(); await page.waitForTimeout(300);
  const form = page.locator('[data-el="plyta-formularz"]');
  ok('formularz: nazwa, grubość, cena, arkusz, kolor', (await form.count()) === 1 && /Arkusz — długość/.test(await form.innerText()));
  await wpisz(form, 'Nazwa', 'Egger W1000 ST9');
  await wpisz(form, 'Grubość', 18);
  await wpisz(form, 'Cena za arkusz', 400);
  await wpisz(form, 'Arkusz — długość', 2800);
  await wpisz(form, 'Arkusz — szerokość', 2070);
  await form.getByRole('button', { name: 'Dodaj i użyj', exact: true }).click(); await page.waitForTimeout(600);
  let p = await zap();
  const id = (p.plyty || [])[0] && p.plyty[0].id;
  ok('projekt: płyta na liście, szafka A ma ją jako korpus', (p.plyty || []).length === 1 && p.items[0].mat.board.plyta === id && p.items[0].mat.board.name === 'Egger W1000 ST9',
    JSON.stringify([p.plyty, p.items[0].mat.board]));
  ok('rząd „Własne płyty” pod wzornikiem ze znakiem „W”', /Własne płyty/i.test(await plyty.innerText()) && (await plyty.locator('[data-el="plyta-wlasna"]').count()) >= 1);
  ok('pytanie o inne szafki (jak przy kolorze)', (await page.locator('[data-el="kolor-dla-innych"]').count()) === 1);
  await page.locator('[data-el="kolor-dla-innych"] button').first().click(); await page.waitForTimeout(600);
  p = await zap();
  ok('„Cały projekt”: szafka B też z płyty Egger', p.items[1].mat.board.plyta === id, JSON.stringify(p.items[1].mat.board));
  const rk = await otworz(/^Rozkrój/);
  await page.waitForTimeout(1500);
  const tr = await rk.innerText();
  ok('rozkrój: grupa „Egger W1000 ST9” na arkuszu 2800 × 2070', /Egger W1000 ST9/.test(tr) && /2800\s*×\s*2070/.test(tr),
    tr.split('\n').filter((l) => /Egger|arkusz|2800|2070/i.test(l)).slice(0, 6).join(' / '));
  const wy = await otworz(/^Wycena/);
  const wiersz = (await wy.innerText()).split('\n').find((l) => /^Egger W1000 ST9/.test(l)) || '';
  ok('wycena: pozycja „Egger W1000 ST9”, cena domyślna 400', /Egger W1000 ST9/.test(await wy.innerText())
    && (await wy.locator('input[placeholder="400.00"], input[placeholder="400"]').count()) >= 1, wiersz);
  // zmiana plyty (cena 450) idzie do szafek
  await plyty.locator('[data-el="plyta-wlasna"]').first().getByTitle(/Zmień tę płytę/).click(); await page.waitForTimeout(300);
  await wpisz(form, 'Cena za arkusz', 450);
  await wpisz(form, 'Grubość', 19);
  await form.getByRole('button', { name: 'Zapisz', exact: true }).click(); await page.waitForTimeout(600);
  p = await zap();
  ok('✎ zmiana: cena 450 i grubość 19 w obu szafkach', p.plyty[0].cena === 450 && p.items.every((it) => it.mat.board.thickness === 19 && it.mat.board.plyta === id), JSON.stringify(p.items.map((it) => it.mat.board.thickness)));
  // kolor z wzornika zdejmuje plyte
  await plyty.locator('button[title="Biały mat"]').first().click(); await page.waitForTimeout(500);
  p = await zap();
  ok('kolor z wzornika: szafka A bez własnej płyty', !p.items[0].mat.board.plyta, JSON.stringify(p.items[0].mat.board));
  await plyty.locator('[data-el="plyta-wlasna"]').first().locator('button').first().click(); await page.waitForTimeout(500);
  ok('klik w płytę własną: znów Egger', (await zap()).items[0].mat.board.plyta === id);
  await plyty.locator('[data-el="plyta-wlasna"]').first().getByTitle(/Usuń z listy/).click(); await page.waitForTimeout(500);
  p = await zap();
  ok('× usuwa z listy, szafki zostają z nazwą, bez odnośnika', !(p.plyty || []).length && p.items.every((it) => !it.mat.board.plyta && it.mat.board.name === 'Egger W1000 ST9'));
}

console.log('\n== mały arkusz własnej płyty ==');
{
  await seed({ name: 'P', active: 0, prices: {}, plyty: [{ id: 'pw1', nazwa: 'Resztka', kolor: '#cccccc', grubosc: 18, arkusz: { w: 1000, h: 800 }, cena: 0 }],
    items: [{ cab: cab('A', 600), mat: { board: { name: 'Resztka', thickness: 18, color: '#cccccc', decor: 'Resztka', plyta: 'pw1' } } }] });
  const rk = await otworz(/^Rozkrój/);
  await page.waitForTimeout(1500);
  ok('rozkrój na arkuszu 1000 × 800 bez błędów strony', /1000\s*×\s*800/.test(await rk.innerText()) && !errors.length,
    (await rk.innerText()).split('\n').filter((l) => /Resztka|1000|800/.test(l)).slice(0, 4).join(' / ') + errors.join(' / '));
}

console.log('\n== własne kawałki płyty w rozkroju (użytkownik 2026-10-24: „mam własną płytę”) ==');
{
  const duza = (name) => ({ name, W: 1200, H: 2000, D: 600, levels: [{ h: null, cols: [{ kind: 'doors', doors: 2, w: null, shelfTargets: [null, null, null, null] }] }] });
  await seed({ name: 'P', active: 0, prices: {}, items: [{ cab: duza('A') }, { cab: duza('B') }] });
  const plan = async () => { await page.waitForTimeout(1600); return page.evaluate(() => (window.__audytRozkroj || { groups: [] }).groups.map((g) => ({ m: g.matLabel, n: g.sheets.length, kupic: g.kupic, wl: g.zWlasnych }))); };
  let p0 = (await plan()).find((g) => /Płyta/.test(g.m));
  const rk = await otworz(/^Rozkrój/);
  ok('przycisk „+ mam własny kawałek tej płyty” przy grupie', (await rk.getByRole('button', { name: '+ mam własny kawałek tej płyty' }).count()) >= 1);
  const grupa = rk.locator('[data-el="resztki"]').first();
  await grupa.getByRole('button', { name: '+ mam własny kawałek tej płyty' }).click(); await page.waitForTimeout(300);
  const f = rk.locator('[data-el="resztka-formularz"]');
  await f.locator('input[title="długość"]').fill('2700'); await f.locator('input[title="szerokość"]').fill('2000');
  await f.getByRole('button', { name: 'Dodaj', exact: true }).click();
  const p1 = (await plan()).find((g) => g.m === p0.m);
  ok(`kawałek 2700 × 2000: kupujesz ${p0.kupic} → ${p1.kupic} arkuszy, 1 z własnych`, p1.kupic === p0.kupic - 1 && p1.wl === 1, JSON.stringify([p0, p1]));
  ok('rysunek: „własny kawałek 2700 × 2000 mm — nie kupujesz”', /własny kawałek 2700 × 2000 mm — nie kupujesz/.test(await rk.innerText()));
  const wy = await otworz(/^Wycena/);
  ok(`wycena: ${p1.kupic} ark. tej płyty`, (await wy.innerText()).split('\n').some((l) => l.startsWith(p0.m) && new RegExp(`\\b${p1.kupic} ark\\.`).test(l)),
    (await wy.innerText()).split('\n').filter((l) => /ark\./.test(l)).join(' / '));
  ok('formatowanie: 4 ark. „w tym 1 własny kawałek”', /w tym 1 własny kawałek/.test(await wy.innerText()), (await wy.innerText()).split('\n').filter((l) => /Formatowanie/.test(l)).join(' / '));
  const pz = await zap();
  ok('kawałek zapisany w projekcie', (pz.resztki || []).length === 1 && pz.resztki[0].w === 2700, JSON.stringify(pz.resztki));
  await rk.locator('[data-el="resztka"]').first().getByTitle('Usuń ten kawałek').click();
  const p2 = (await plan()).find((g) => g.m === p0.m);
  ok('× usuwa kawałek: znów wszystko z kupowanych', p2.kupic === p0.kupic && !p2.wl, JSON.stringify(p2));
}

ok('bez błędów strony', !errors.length, errors.join(' / '));
await b.close();
