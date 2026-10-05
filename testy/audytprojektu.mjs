/* Audyt projektu wyslanego z artefaktu („Wyślij do Claude”) — decyzja uzytkownika
   2026-10-04: zamiast trzymac jeden projekt jako staly test, kazdy wyslany projekt
   przechodzi przez wszystkie kontrole. Projekt NIE trafia do repozytorium: lezy
   w scratchpadzie, a skrypt dostaje sciezke.

     PROJEKT=/sciezka/projekt.json node testy/audytprojektu.mjs

   (plik: sam projekt albo dokument z ArtifactData z polem `json`). Dla kazdej
   szafki: uwagi (bledy, ostrzezenia, informacje), nachodzenie bryl 3D, formatki ↔
   bryla w obie strony, symulacja wysuwu szuflad; dla calosci: nachodzenie
   w bryle zabudowy kazdego pomieszczenia i bledy strony. Nie jest w pelnym
   przebiegu (`pelny.sh` bierze pliki z wynikiem „OK” — tu pisany inaczej). */
import pw from './pw.mjs';
import fs from 'fs';
import { symuluj } from './symwysuw.mjs';
const URL = process.env.STD ? 'http://127.0.0.1:5199/standalone-local.html'
  : 'http://127.0.0.1:5205/mebloprojekt-app.html';
if (!process.env.PROJEKT) { console.log('Podaj plik: PROJEKT=/sciezka/projekt.json node testy/audytprojektu.mjs'); process.exit(1); }
const surowy = JSON.parse(fs.readFileSync(process.env.PROJEKT, 'utf8'));
const proj = surowy.json ? JSON.parse(surowy.json) : surowy;
const DOBRZE = '  OK' + '   ';   // (nie wprost — patrz naglowek)
const wynik = (l, c, e = '') => console.log((c ? DOBRZE : '  BLAD ') + l + (e ? ' — ' + e : ''));
const b = await pw.chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const page = await (await b.newContext({ viewport: { width: 1500, height: 1300 } })).newPage();
const errors = []; page.on('pageerror', (e) => errors.push(e.message));
await page.goto(URL, { waitUntil: 'networkidle' });

const num = (s) => Number(String(s).replace(/\s/g, '').replace(',', '.').replace(/[^\d.\-]/g, '')) || 0;
const click = async (l) => { const x = page.getByRole('button', { name: l, exact: true }); if (await x.count()) { await x.first().click(); await page.waitForTimeout(300); return true; } return false; };
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
const formatki = (rows) => (rows || []).filter((r) => r['Długość'] != null)
  .map((r) => ({ name: r._[0], a: num(r['Długość']), b: num(r['Szerokość']), qty: num(r['Szt.']) }));
const uwagi = () => page.evaluate(() => {
  const sec = [...document.querySelectorAll('section')].find((s) => /^Uwagi/.test(s.querySelector('h2')?.textContent || ''));
  if (!sec) return { err: [], warn: [], inf: [] };
  const l = sec.innerText.split('\n').map((x) => x.trim()).filter(Boolean);
  const err = [], warn = [], inf = [];
  l.forEach((x, i) => { if (x === '×' && l[i + 1]) err.push(l[i + 1]); if (x === '!' && l[i + 1]) warn.push(l[i + 1]); if (x === 'i' && l[i + 1]) inf.push(l[i + 1]); });
  return { err, warn, inf };
});
const bryly = async (zakres, otwarte) => {
  await click(zakres); await click('Zamk.');
  await page.evaluate(() => { window.__audytBryl = []; }); await click('3D');
  let a = await page.evaluate(() => { const x = window.__audytBryl; window.__audytBryl = null; return (x || []).filter((s) => s.p); });
  if (otwarte) {
    await page.evaluate(() => { window.__audytBryl = []; }); await click('zamknięte'); await page.waitForTimeout(300);
    a = await page.evaluate(() => { const x = window.__audytBryl; window.__audytBryl = null; return (x || []).filter((s) => s.p); });
    await click('otwarte');
  }
  return a;
};
const plyty = (sol) => sol.filter((s) => { const d = [...s.d].sort((x, y) => x - y);
  return d[0] > 0.5 && d[0] <= 40 && d[1] >= 20 && s.color !== '#3f3f46' && s.color !== '#8b8b93' && !/^(uchwyt|noga)/.test(s.tag || ''); });
const opis = (q) => `${q.tag || q.color}${[...q.d].sort((x, y) => x - y).map(Math.round).join('×')}`;
const nachodzi = (sol) => {
  const s = sol.filter((q) => q.p && q.color !== '#b91c1c' && q.color !== '#b45309' && (q.alpha ?? 1) > 0.2);
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
const bezPlyty = (parts, sol) => { const pl = plyty(sol);
  return parts.filter((p) => !/^(Cokół|Blat)/.test(p.name)).map((p) => ({ p, ile: pl.filter((s) => pasuje(p, s)).length }))
    .filter((x) => x.ile < x.p.qty).map((x) => `${x.p.name} ${x.p.a}×${x.p.b}: ${x.ile} z ${x.p.qty}`); };
const bezFormatki = (parts, sol) => plyty(sol).filter((s) => s.tag !== 'blat' && !parts.some((p) => pasuje(p, s)
  || (/^Cokół/.test(p.name) && Math.abs(p.b - [...s.d].sort((x, y) => x - y)[1]) <= 3))).map(opis);

// kolory rol plyt, zeby symulacja odroznila korpus, front i skrzynke (wymiary bez zmian)
const K = '#cc2222', F = '#2222cc', P = '#22aa22';
const p2 = { ...proj, items: proj.items.map((it) => ({ ...it, cab: { ...it.cab, shelfSameAsBoard: false, frontSameAsBoard: false },
  mat: it.mat ? { ...it.mat, board: { ...it.mat.board, color: K }, front: { ...it.mat.front, color: F }, shelf: { ...it.mat.shelf, color: P } } : it.mat })) };
console.log(`Projekt „${proj.name || ''}”: ${proj.items.length} szafek, ${(proj.runs || []).length} ciągów`);
const wczytaj = async (q) => {
  await page.evaluate((x) => { localStorage.clear(); localStorage.setItem('szafki:projekt', JSON.stringify(x)); }, q);
  await page.reload({ waitUntil: 'networkidle' }); await page.waitForTimeout(900);
};
for (let i = 0; i < p2.items.length; i++) {
  const it = p2.items[i];
  await wczytaj({ ...p2, active: i });
  console.log(`\n== ${it.cab.name} (${it.runId || 'wolnostojąca'}) ==`);
  const u = await uwagi();
  wynik('brak błędów w uwagach', !u.err.length, u.err.map((e) => e.slice(0, 160)).join(' | '));
  u.warn.forEach((e) => console.log('  ! ' + e.slice(0, 200)));
  u.inf.forEach((e) => console.log('  i ' + e.slice(0, 200)));
  const f = formatki(await tabela(/^Formatki do zamówienia/));
  const zam = await bryly('Szafka', false);
  const otw = await bryly('Szafka', true);
  const n = nachodzi(zam);
  wynik('w bryle nic na nic nie nachodzi', !n.length, n.slice(0, 3).join('; '));
  const razem = [...zam, ...otw.filter((q) => !zam.some((x) => x.p.join() === q.p.join()))];
  const fProj = it.runId ? formatki(await tabela(/^Formatki całego projektu/)).filter((x) => /ciągu/.test(x.name)) : [];
  const bp = bezPlyty(f, razem), bf = bezFormatki([...f, ...fProj.map((x) => ({ ...x, name: 'Cokół ciągu' }))], zam);
  wynik('formatki = bryła (w obie strony)', !bp.length && !bf.length, [...bp, ...bf].slice(0, 4).join('; '));
  const run = (p2.runs || []).find((r) => r.id === it.runId);
  const sym = symuluj(zam.map((s) => ({ ...s, color: (s.color || '').toLowerCase() })), { H: it.cab.H, blat: !!(run && run.worktop) });
  sym.forEach((x) => {
    console.log(`  szuflada ${x.szuflada}: front ${x.front}, boki ${x.boki}, tył ${x.tyl}, nad nią ${x.sufit} — luz nad bokami ${x.luzBoki}, nad tyłem ${x.luzTyl}`);
    wynik(`szuflada ${x.szuflada} wysuwa się bez kolizji`, !x.kolizje.length, x.kolizje.join('; '));
  });
}
// cala zabudowa w kazdym pomieszczeniu
for (const room of (proj.rooms || [{ id: null, name: '' }])) {
  const idx = p2.items.findIndex((it) => !room.id || (it.roomId || 'p1') === room.id);
  if (idx < 0) continue;
  await wczytaj({ ...p2, active: idx });
  if (!(await page.getByRole('button', { name: 'Zabudowa', exact: true }).count())) continue;
  const sol = await bryly('Zabudowa', false);
  const n = nachodzi(sol);
  wynik(`zabudowa${room.name ? ' „' + room.name + '”' : ''}: nic na nic nie nachodzi`, !n.length, n.slice(0, 4).join('; '));
}
wynik('strona bez błędów', !errors.length, errors.join('; ').slice(0, 300));
await b.close();
