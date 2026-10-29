/* Podpisy formatek na arkuszach rozkroju (audyt GPT PDF-1; uzytkownik 2026-10-29
   „podpis w formatce”): kazda formatka ma podpis — wymiar zawsze, nazwa, gdy sie
   zmiesci — i podpis nie wychodzi poza swoja formatke. Waska pionowa (fix 60,
   drzwi 150) ma napis obrocony wzdluz. Ten sam rysunek (`SheetPlan`) idzie do PDF.
   Opcjonalnie PROJEKT=<plik> — to samo na projekcie uzytkownika (caly projekt). */
import pw from './pw.mjs';
import fs from 'fs';
const URL = process.env.STD ? 'http://127.0.0.1:5199/standalone-local.html'
  : 'http://127.0.0.1:5205/mebloprojekt-app.html';
const ok = (l, c, e = '') => console.log((c ? '  OK   ' : '  BLAD ') + l + (e ? ' — ' + e : ''));
const b = await pw.chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const page = await (await b.newContext({ viewport: { width: 1500, height: 1300 } })).newPage();
const errors = []; page.on('pageerror', (e) => errors.push(e.message));
await page.goto(URL, { waitUntil: 'networkidle' });

const seed = async (p) => {
  await page.evaluate((q) => { localStorage.clear(); localStorage.setItem('szafki:projekt', JSON.stringify(q)); }, p);
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForFunction(() => window.__audytRozkroj && window.__audytRozkroj.aktualny, null, { timeout: 20000 }).catch(() => {});
  await page.waitForTimeout(400);
};
// kazda formatka na arkuszach karty „Rozkrój”: ma podpis? miesci sie w niej?
const podpisy = () => page.evaluate(() => {
  const out = [];
  document.querySelectorAll('#rozkroj svg').forEach((svg) => {
    [...svg.querySelectorAll(':scope > g')].forEach((g) => {
      const r = g.querySelector('rect');
      if (!r || r.getAttribute('stroke-dasharray')) return; // zrzut
      const w = Math.round(+r.getAttribute('width')), h = Math.round(+r.getAttribute('height'));
      const pg = g.querySelector('[data-el="podpis-formatki"]');
      const rr = r.getBoundingClientRect();
      const o = { wym: `${w}×${h}`, txt: pg ? pg.textContent : null, rot: !!(pg && /rotate/.test(pg.getAttribute('transform') || '')) };
      if (pg) {
        const t = pg.getBoundingClientRect();
        o.wewnatrz = t.left >= rr.left - 1 && t.right <= rr.right + 1 && t.top >= rr.top - 1 && t.bottom <= rr.bottom + 1;
      }
      out.push(o);
    });
  });
  return out;
});

console.log('== szafka z fixem 60, drzwiami 150 i cokołem ==');
{
  const cab = { name: 'S', W: 750, H: 720, D: 560, plinth: { on: true, height: 100, mode: 'under', setback: 0 }, legs: { on: true, height: 100 },
    levels: [{ h: null, cols: [{ kind: 'doors', doors: 1, w: 150, shelfTargets: [null], fix: { side: 'left', w: 60, mode: 'overlay', support: true, supportDepth: 100 } },
      { kind: 'doors', doors: 1, w: null, shelfTargets: [null, null] }] }] };
  await seed({ name: 'P', active: 0, prices: {}, items: [{ cab }] });
  const p = await podpisy();
  ok('każda formatka na arkuszu ma podpis z wymiarem', p.length > 5 && p.every((x) => x.txt && /\d+×\d+/.test(x.txt)), p.filter((x) => !x.txt).map((x) => x.wym).join(', '));
  ok('żaden podpis nie wychodzi poza swoją formatkę', p.every((x) => x.wewnatrz), p.filter((x) => !x.wewnatrz).map((x) => `${x.wym}: ${x.txt}`).join(' / '));
  const male = p.filter((x) => { const [w, h] = x.wym.split('×').map(Number); return w <= 190 || h <= 100; });
  ok('dawniej bez podpisu albo z napisem poza formatką (fix 60, cokół i wspornik 100) — teraz z wymiarem', male.length >= 3 && male.every((x) => x.txt), JSON.stringify(male));
  ok('duże formatki bez zmian: wymiar i nazwa poziomo', p.filter((x) => { const [w, h] = x.wym.split('×').map(Number); return w > 400 && h > 400; })
    .every((x) => !x.rot && /\d+×\d+\D+/.test(x.txt)));
}

console.log('\n== wąskie pionowe na arkuszu (słoje: front szuflady 4 × ok. 175) ==');
{
  const cab = { name: 'S', W: 600, H: 720, D: 560, grainMatters: true, plinth: { on: false }, legs: { on: true, height: 100 },
    levels: [{ h: null, cols: [{ kind: 'drawers', w: null, drawers: [{ h: null }, { h: null }, { h: null }, { h: null }] }] }] };
  await seed({ name: 'P', active: 0, prices: {}, items: [{ cab }] });
  const p = await podpisy();
  const waskie = p.filter((x) => { const [w, h] = x.wym.split('×').map(Number); return w <= 190 && h > 2 * w; });
  ok('wąskie pionowe — napis obrócony wzdłuż, w formatce', waskie.length >= 4 && waskie.every((x) => x.rot && x.wewnatrz && /\d+×\d+/.test(x.txt)), JSON.stringify(waskie));
  ok('wszystkie podpisy w swoich formatkach', p.every((x) => x.txt && x.wewnatrz), p.filter((x) => !x.wewnatrz).map((x) => `${x.wym}: ${x.txt}`).join(' / '));
}

if (process.env.PROJEKT) {
  console.log('\n== projekt użytkownika (cały projekt) ==');
  const s = JSON.parse(fs.readFileSync(process.env.PROJEKT, 'utf8'));
  await seed(s.json ? JSON.parse(s.json) : s);
  const t = page.getByRole('button', { name: 'Projekt', exact: true });
  for (let i = 0; i < await t.count(); i++) await t.nth(i).click().catch(() => {});
  await page.waitForTimeout(6000);
  const p = await podpisy();
  console.log('  (obrócone: ' + p.filter((x) => x.rot).map((x) => `${x.wym} ${x.txt}`).join(' / ') + ')');
  ok('projekt: każda formatka z podpisem, podpis w formatce', p.length && p.every((x) => x.txt && x.wewnatrz),
    `${p.length} formatek; ` + p.filter((x) => !x.txt || !x.wewnatrz).map((x) => `${x.wym}: ${x.txt}`).join(' / '));
}

ok('bez błędów strony', !errors.length, errors.join(' / '));
await b.close();
