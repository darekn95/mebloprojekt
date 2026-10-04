/* Audyt zabudowy budowanej przez interfejs (analiza brakow kontroli 2026-10-04).
   `audyt` sprawdza narozniki na szafkach z wiencem wpisanych recznie — a uzytkownik
   sklada kuchnie przyciskami: „+ ciąg”, „+ szafka” (pod blatem: bez wienca,
   z para wzmocnien), kreator rogu, „+ ciąg górny”. Tu ta sama droga, potem:
   1. w bryle calej zabudowy (zamknietej) nic na nic nie nachodzi,
   2. kazda plyta z bryly ma formatke w liscie projektu i odwrotnie,
   3. zadna szafka nie ma bledu (×) w uwagach (kazda po kolei jako aktywna),
   4. szuflady: symulacja wysuwu z blatem. */
import pw from './pw.mjs';
import { symuluj } from './symwysuw.mjs';
const URL = process.env.STD ? 'http://127.0.0.1:5199/standalone-local.html'
  : 'http://127.0.0.1:5205/mebloprojekt-app.html';
const ok = (l, c, e = '') => console.log((c ? '  OK   ' : '  BLAD ') + l + (e ? ' — ' + e : ''));
const info = (l) => console.log('  INFO ' + l);
const b = await pw.chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const page = await (await b.newContext({ viewport: { width: 1500, height: 1300 } })).newPage();
const errors = []; page.on('pageerror', (e) => errors.push(e.message));
await page.goto(URL, { waitUntil: 'networkidle' });

const num = (s) => Number(String(s).replace(/\s/g, '').replace(',', '.').replace(/[^\d.\-]/g, '')) || 0;
const tabela = (re) => page.evaluate((src) => {
  const re = new RegExp(src);
  const sec = [...document.querySelectorAll('section')].find((s) => re.test((s.querySelector('h2') || {}).textContent || ''));
  if (!sec) return null;
  const t = sec.querySelector('table'); if (!t) return [];
  const th = [...t.querySelectorAll('thead th')].map((x) => x.textContent.trim());
  return [...t.querySelectorAll('tbody tr')].map((tr) => {
    const td = [...tr.children].map((x) => x.textContent.trim());
    const o = {}; th.forEach((h, i) => { o[h] = td[i]; }); o._ = td; return o;
  });
}, re.source);
const K = '#cc2222', F = '#2222cc', P = '#22aa22';
const formatki = (rows) => (rows || []).filter((r) => r['Długość'] != null)
  .map((r) => ({ name: r._[0], a: num(r['Długość']), b: num(r['Szerokość']), qty: num(r['Szt.']) }));
const click = async (l) => { const x = page.getByRole('button', { name: l, exact: true }); if (await x.count()) { await x.first().click(); await page.waitForTimeout(300); return true; } return false; };
const plyty = (sol) => sol.filter((s) => { const d = [...s.d].sort((x, y) => x - y);
  return d[0] > 0.5 && d[0] <= 40 && d[1] >= 20 && s.color !== '#3f3f46' && s.color !== '#8b8b93' && !/^(uchwyt|noga)/.test(s.tag || ''); });
const opis = (q) => `${q.tag || ''}${[...q.d].sort((x, y) => x - y).map(Math.round).join('×')}`;
const nachodzi = (sol) => {
  const s = sol.filter((q) => q.p && q.color !== '#b91c1c' && q.color !== '#b45309');
  const out = [];
  for (let i = 0; i < s.length; i++) for (let j = i + 1; j < s.length; j++) {
    const a = s[i].p, c = s[j].p;
    const ov = [0, 1, 2].map((k) => Math.min(a[k + 3], c[k + 3]) - Math.max(a[k], c[k]));
    const cienka = Math.min(...s[i].d) <= 4 || Math.min(...s[j].d) <= 4;
    const [o1, o2] = [...ov].sort((x, y) => x - y);
    if (cienka && o1 <= 4 && o2 <= 16) continue;
    if (ov.every((v) => v > 1)) out.push(`${opis(s[i])} × ${opis(s[j])} (${ov.map(Math.round).join('×')})`);
  }
  return [...new Set(out)];
};
const pasuje = (p, s) => { const [, q, r] = [...s.d].sort((x, y) => x - y).map(Math.round);
  return (Math.abs(p.a - q) <= 3 && Math.abs(p.b - r) <= 3) || (Math.abs(p.a - r) <= 3 && Math.abs(p.b - q) <= 3); };
const czesci = (parts) => parts.flatMap((p) => {
  const m = /wycięty tylny róg (\d+) × (\d+)/.exec(p.name);
  if (!m) return [p];
  const nw = Number(m[1]), nd = Number(m[2]);
  return [{ ...p, name: p.name + ' (pas)', b: p.b - nd }, { ...p, name: p.name + ' (obok wycięcia)', a: p.a - nw, b: nd }];
});
/* cokol ciagu dluzszy niz arkusz jest w formatkach w kawalkach, a w bryle w calosci —
   kawalek pasuje do bryly o tej samej wysokosci i nie krotszej */
const pasujeCokol = (p, s) => { const [, q, r] = [...s.d].sort((x, y) => x - y).map(Math.round);
  return /^Cokół/.test(p.name) && Math.abs(p.b - q) <= 3 && r >= p.a - 3; };
const bezPlyty = (parts, sol) => { const pl = plyty(sol);
  return czesci(parts).map((p) => ({ p, ile: pl.filter((s) => pasuje(p, s)).length || (pl.some((s) => pasujeCokol(p, s)) ? p.qty : 0) }))
    .filter((x) => x.ile < x.p.qty && !/^(Front szuflady|Dno szuflady|Tył szuflady)/.test(x.p.name)).map((x) => `${x.p.name} ${x.p.a}×${x.p.b}: ${x.ile} z ${x.p.qty}`); };
const bezFormatki = (parts, sol) => plyty(sol).filter((s) => !czesci(parts).some((p) => pasuje(p, s)
  || (/^Cokół/.test(p.name) && Math.abs(p.b - [...s.d].sort((x, y) => x - y)[1]) <= 3))).map(opis);
const uwagi = () => page.evaluate(() => {
  const sec = [...document.querySelectorAll('section')].find((s) => /^Uwagi/.test(s.querySelector('h2')?.textContent || ''));
  if (!sec) return { err: [], warn: [] };
  const linie = sec.innerText.split('\n').map((l) => l.trim()).filter(Boolean);
  const err = [], warn = [];
  linie.forEach((l, i) => { if (l === '×' && linie[i + 1]) err.push(linie[i + 1]); if (l === '!' && linie[i + 1]) warn.push(linie[i + 1]); });
  return { err, warn };
});
const zapis = async () => { await page.waitForTimeout(1500); return page.evaluate(() => JSON.parse(localStorage.getItem('szafki:projekt'))); };
const wczytaj = async (q) => {
  await page.evaluate((x) => { localStorage.setItem('szafki:projekt', JSON.stringify(x)); }, q);
  await page.reload({ waitUntil: 'networkidle' }); await page.waitForTimeout(1000);
};
const wiersz = (re) => page.locator('header .space-y-1 > div').filter({ hasText: re }).first();
const dodajSzafke = async (re, ile = 1) => { for (let k = 0; k < ile; k++) { await wiersz(re).getByRole('button', { name: '+ szafka', exact: true }).click(); await page.waitForTimeout(500); } };

/* buduje zabudowe przyciskami; `szafka` = 'slepa' | 'L' (kreator rogu) */
const buduj = async (szafka, gorne) => {
  await page.evaluate(() => localStorage.clear()); await page.reload({ waitUntil: 'networkidle' }); await page.waitForTimeout(900);
  await click('+ ciąg');
  await dodajSzafke(/^Ściana 1/, 3);
  await click('+ ciąg');
  const kreator = page.locator('[data-el="kreator-rogu"]');
  if (szafka === 'L') { await kreator.locator('select').nth(1).selectOption('L'); await page.waitForTimeout(200); }
  await kreator.getByRole('button', { name: 'Utwórz ciąg' }).click(); await page.waitForTimeout(1200);
  await dodajSzafke(/^Ściana 2/, 2);
  if (gorne) {
    await wiersz(/^Ściana 1/).getByRole('button', { name: '+ ciąg górny', exact: true }).click(); await page.waitForTimeout(500);
    // „+ ciąg górny” jest tez w wierszu Sciany 2 — szukamy po pelnej etykiecie
    await dodajSzafke(/^Ściana 1 — ciąg górny/, 2);
  }
  let p = await zapis();
  // startowa szafka (wolnostojaca) nie nalezy do zabudowy
  p = { ...p, items: p.items.filter((it) => it.runId) };
  // w drugiej szafce sciany 1 szuflady — wnetrze zmienione, konstrukcja (wzmocnienia) z aplikacji
  const s1 = p.items.filter((it) => it.runId === p.runs[0].id);
  if (s1[1]) {
    const col = s1[1].cab.levels[s1[1].cab.levels.length - 1].cols[0];
    s1[1].cab.levels = [{ h: null, cols: [{ ...col, kind: 'drawers', drawers: [{ h: 'auto' }, { h: 'auto' }, { h: 'auto' }] }] }];
    // kolory rol plyt, zeby symulacja wysuwu odroznila korpus, front i skrzynke
    s1[1].cab = { ...s1[1].cab, shelfSameAsBoard: false, frontSameAsBoard: false };
    s1[1].mat = { ...s1[1].mat, board: { ...s1[1].mat.board, color: K }, front: { ...s1[1].mat.front, color: F },
      shelf: { ...s1[1].mat.shelf, color: P } };
  }
  return { ...p, active: 0 };
};

for (const [opis2, szafka, gorne] of [['ślepy róg z wstawką', 'slepa', false], ['szafka w L', 'L', false],
  ['ślepy róg + górny ciąg', 'slepa', true], ['szafka w L + górny ciąg', 'L', true]]) {
  console.log(`\n== ${opis2} ==`);
  const p = await buduj(szafka, gorne);
  await wczytaj(p);
  ok(`${opis2}: zbudowana (${p.items.length} szafek, ${p.runs.length} ciągi)`, p.items.length >= 5, '');
  // 3. bledy w uwagach kazdej szafki
  const bledy = [];
  for (let i = 0; i < p.items.length; i++) {
    await wczytaj({ ...p, active: i });
    const u = await uwagi();
    u.err.forEach((e) => bledy.push(`${p.items[i].cab.name}: ${e.slice(0, 130)}`));
    if (u.warn.length) info(`${p.items[i].cab.name}: ${u.warn.map((w) => w.slice(0, 80)).join(' | ')}`);
  }
  ok(`${opis2}: żadna szafka nie ma błędu w uwagach`, !bledy.length, [...new Set(bledy)].slice(0, 4).join(' | '));
  // 1–2. bryla zabudowy
  await wczytaj({ ...p, active: 0 });
  const pf = formatki(await tabela(/^Formatki całego projektu/));
  await click(await page.getByRole('button', { name: 'Zabudowa', exact: true }).count() ? 'Zabudowa' : 'Ciąg');
  await click('Zamk.');
  await page.evaluate(() => { window.__audytBryl = []; });
  await click('3D');
  const sol = await page.evaluate(() => (window.__audytBryl || []).filter((s) => s.p));
  const n = nachodzi(sol);
  ok(`${opis2}: w bryle zabudowy nic na nic nie nachodzi`, !n.length, n.slice(0, 4).join('; '));
  const bf = bezFormatki(pf, sol);
  ok(`${opis2}: każda płyta z bryły ma formatkę`, !bf.length, [...new Set(bf)].slice(0, 6).join('; '));
  const bp = bezPlyty(pf, sol);
  ok(`${opis2}: każda formatka projektu jest w bryle`, !bp.length, bp.slice(0, 6).join('; '));
  // 4. szuflady w szafce sciany 1 (zakres „Szafka”)
  await wczytaj({ ...p, active: 1 });
  await click('Szafka'); await click('Zamk.');
  await page.evaluate(() => { window.__audytBryl = []; }); await click('3D');
  const zam = await page.evaluate(() => (window.__audytBryl || []).filter((s) => s.p));
  const sym = symuluj(zam.map((s) => ({ ...s, color: (s.color || '').toLowerCase() })), { H: p.items[1].cab.H, blat: true });
  ok(`${opis2}: symulacja widzi 3 szuflady`, sym.length === 3, `jest ${sym.length}`);
  const kol = sym.flatMap((x) => x.kolizje.map((k) => `szuflada ${x.szuflada}: ${k}`));
  ok(`${opis2}: szuflady wysuwają się bez kolizji`, !kol.length, kol.slice(0, 3).join('; '));
}

console.log('\nBLEDY:', errors.length ? errors.join('; ') : '(brak)');
await b.close();
