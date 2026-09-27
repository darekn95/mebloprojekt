/* Zaden napis na rysunku nie moze byc przykryty plyta, nozka ani blatem.
   Dla kazdego napisu sprawdzamy, co lezy na wierzchu w dwoch punktach jego
   srodka — dopuszczalny jest on sam, inny napis albo kreska wymiaru.
   Szablon narożnika: ramie obok korpusu, blat, nozki — najwiecej okazji,
   zeby cos zaslonilo opis. Wszystkie zakresy i widoki. */
import pw from './pw.mjs';
const URL = process.env.STD ? 'http://127.0.0.1:5199/standalone-local.html'
  : 'http://127.0.0.1:5205/mebloprojekt-app.html';
const b = await pw.chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const page = await (await b.newContext({ viewport: { width: 1500, height: 1200 } })).newPage();
const errors = []; page.on('pageerror', (e) => errors.push('[pageerror] ' + e.message));
const ok = (l, c, e = '') => console.log((c ? '  OK   ' : '  BLAD ') + l + (e ? ' — ' + e : ''));
await page.goto(URL, { waitUntil: 'networkidle' });
await page.evaluate(() => { try { localStorage.clear(); } catch (e) {} });
await page.reload({ waitUntil: 'networkidle' });
await page.waitForTimeout(1800);
await page.locator('select[title="Dodaj szafkę z gotowego szablonu"]').first().selectOption('naroznikL');
await page.waitForTimeout(2200);
const zakryte = () => page.evaluate(() => {
  const svg = document.querySelector('#rysunek svg'); const out = [];
  if (!svg) return out;
  svg.querySelectorAll('text').forEach((t) => {
    const r = t.getBoundingClientRect(); if (!r.width) return;
    const pts = [[r.left + r.width * 0.25, r.top + r.height / 2], [r.left + r.width * 0.75, r.top + r.height / 2]];
    const zle = pts.filter(([x, y]) => { const e = document.elementFromPoint(x, y);
      return e && e !== t && !['text', 'tspan', 'line'].includes(e.tagName) && !t.contains(e); });
    if (zle.length === 2) out.push(t.textContent.trim().slice(0, 30));
  });
  return out;
});
// szafka narozna jest aktywna po dodaniu szablonu
for (const sc of ['Szafka', 'Ciąg', 'Zabudowa']) {
  await page.getByRole('button', { name: sc, exact: true }).first().click();
  await page.waitForTimeout(600);
  for (const v of ['Zamk.', 'Otw.', 'Z boku', 'Z góry', 'Z tyłu']) {
    const btn = page.getByRole('button', { name: v, exact: true });
    if (!(await btn.count())) continue;
    await btn.first().click();
    await page.waitForTimeout(600);
    const z = await zakryte();
    ok(`${sc} / ${v}: żaden opis nie jest zakryty`, z.length === 0, JSON.stringify(z));
  }
}
console.log('\nBLEDY:', errors.length ? errors.join('; ') : '(brak)');
await b.close();
