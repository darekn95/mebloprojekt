/* Rura na wieszaki (uzytkownik 2026-10-24): okragla ⌀25 na 2 rozetach, os 70 mm
   pod plyta nad swiatlem, w polowie glebokosci, dlugosc = swiatlo − 2 mm. Pod rura
   ok. 1000 mm (koszule), plaszcze ok. 1600. Glebokosc od 400 mm, ponizej 500
   ostrzezenie. Opcja w Strukturze przy swietle od 800 mm, podpowiedz w Uwagach. */
import pw from './pw.mjs';
const URL = process.env.STD ? 'http://127.0.0.1:5199/standalone-local.html'
  : 'http://127.0.0.1:5205/mebloprojekt-app.html';
const ok = (l, c, e = '') => console.log((c ? '  OK   ' : '  BLAD ') + l + (e ? ' — ' + e : ''));
const b = await pw.chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const page = await (await b.newContext({ viewport: { width: 1500, height: 1300 } })).newPage();
const errors = []; page.on('pageerror', (e) => errors.push(e.message));
await page.goto(URL, { waitUntil: 'networkidle' });

const szafa = (o = {}, col = {}) => ({ name: 'Szafa', W: 1000, H: 2000, D: 600,
  levels: [{ h: null, cols: [{ kind: 'doors', doors: 2, w: null, shelfTargets: [400, null], ...col }] }], ...o });
const seed = async (cab) => {
  await page.evaluate((c) => { localStorage.clear(); localStorage.setItem('szafki:projekt', JSON.stringify({ name: 'R', active: 0, prices: {}, items: [{ cab: c }] })); }, cab);
  await page.reload({ waitUntil: 'networkidle' }); await page.waitForTimeout(1200);
};
const zap = async () => { await page.waitForTimeout(1000); return page.evaluate(() => JSON.parse(localStorage.getItem('szafki:projekt'))); };
const rows = (re) => page.evaluate((src) => { const r = new RegExp(src);
  const sec = [...document.querySelectorAll('section')].find((s) => r.test(s.querySelector('h2')?.textContent || ''));
  return sec ? [...sec.querySelectorAll('tbody tr')].map((tr) => [...tr.children].map((x) => x.innerText.trim().replace(/\s+/g, ' ')).join(' | ')) : []; }, re.source);
const uwagi = async () => (await page.evaluate(() => [...document.querySelectorAll('section')].find((s) => /^Uwagi/.test(s.querySelector('h2')?.textContent || ''))?.innerText || ''));
const linie = (t, re) => t.split('\n').filter((l) => re.test(l)).join(' / ');
const pick = async (l) => { const x = page.getByRole('button', { name: l, exact: true }); if (await x.count()) { await x.first().click(); await page.waitForTimeout(300); } };

console.log('== podpowiedź i dodanie rury ==');
{
  await seed(szafa());
  let u = await uwagi();
  ok('szafa 2000 ze światłem 1546 mm: podpowiedź „zmieści się rura na wieszaki (pod nią 1476 mm: koszule)” z przyciskiem', /kolumna 1: światło 1546 mm — zmieści się rura na wieszaki \(pod nią 1476 mm: koszule\)/.test(u) && /Dodaj rurę na wieszaki/.test(u), linie(u, /rur/));
  const opcja = page.locator('[data-el="rura-wieszaki-opcja"]');
  ok('w Strukturze opcja tylko przy świetle od 800 mm („światło 2 (1546 mm)”)', (await opcja.count()) === 1 && /światło 2 \(1546 mm\)/.test(await opcja.innerText()) && !/światło 1/.test(await opcja.innerText()), await opcja.innerText().catch(() => ''));
  await page.getByRole('button', { name: 'Dodaj rurę na wieszaki' }).first().click(); await page.waitForTimeout(600);
  const c = (await zap()).items[0].cab;
  ok('przycisk: rura w świetle 2 (`drazki: [1]`)', JSON.stringify(c.levels[0].cols[0].drazki) === '[1]', JSON.stringify(c.levels[0].cols[0].drazki));
  u = await uwagi();
  ok('po dodaniu: bez podpowiedzi i bez ostrzeżeń o rurze', !/rur/.test(u), linie(u, /rur/));
  const hw = await rows(/^Produkty do zamówienia/);
  // zakup w odcinkach 0,5–3 m (uzytkownik 2026-10-24): 962 mm z odcinka 1 m
  ok('zamówienie: rura 962 mm — „kupić 1 × 1 m: potrzeba 962 mm, odpad 38 mm”, 1 mb, i 2 rozety', hw.some((r) => /^Rura na wieszaki ⌀25 .*kupić 1 × 1 m: potrzeba 962 mm, odpad 38 mm/.test(r) && /\| 1 mb$/.test(r)) && hw.some((r) => /^Rozeta do rury ⌀25 .*\| 2 szt\./.test(r)),
    hw.filter((r) => /Rura|Rozeta/.test(r)).join(' / '));
  // plan wiercen jest w zestawieniu PDF (jak w `wierc`)
  await page.evaluate(() => {
    window.__snap = null;
    window.print = () => {
      const rep = document.querySelector('.print-only');
      const t = rep && [...rep.querySelectorAll('table.rp-tbl')].find((x) => [...x.querySelectorAll('th')].some((th) => th.textContent.trim() === 'Otwory pod'));
      window.__snap = t ? [...t.querySelectorAll('tbody tr')].map((tr) => [...tr.querySelectorAll('td')].map((td) => td.textContent.trim())) : null;
    };
  });
  await page.getByRole('button', { name: 'Zestawienie PDF', exact: true }).click(); await page.waitForTimeout(1800);
  const plan = (await page.evaluate(() => window.__snap)) || [];
  const rr = plan.filter((r) => r[1] === 'rura na wieszaki');
  ok('plan wierceń: rozeta rury na obu bokach, 1912 mm od dołu boku, oś 300 mm od przedniej krawędzi', rr.length === 2 && rr.every((r) => /1912/.test(r[2]) && /rozeta rury ⌀25: oś 300 mm od przedniej krawędzi/.test(r[3])) && rr.some((r) => r[0] === 'Bok lewy') && rr.some((r) => r[0] === 'Bok prawy'),
    rr.map((r) => r.join(' | ')).join(' / '));
  await page.keyboard.press('Escape'); await page.waitForTimeout(300);
  // rysunki
  await pick('Otw.');
  ok('widok otwarty: rura na rysunku', (await page.locator('#rysunek svg [data-el="rura-wieszaki"]').count()) === 1);
  await pick('Z boku');
  ok('z boku: przekrój rury', (await page.locator('#rysunek svg circle[data-el="rura-wieszaki"]').count()) === 1);
  await pick('Zamk.');
  await page.evaluate(() => { window.__audytBryl = []; });
  await pick('3D'); await page.waitForTimeout(300);
  const br = await page.evaluate(() => { const a = window.__audytBryl || []; window.__audytBryl = null; return a.filter((x) => x.tag === 'rura-wieszaki').map((x) => x.d.map(Math.round).sort((p, q) => p - q).join('×') + ' ' + x.color); });
  ok('3D: rura 25 × 25 × 962 w kolorze metalu (nie formatka)', br.length >= 1 && br.every((s) => s === '25×25×962 #8b8b93'), br.join(', '));
  await pick('Front');
  // odznaczenie w Strukturze
  await page.locator('[data-el="rura-wieszaki-opcja"] input').first().uncheck(); await page.waitForTimeout(600);
  ok('odznaczenie w Strukturze usuwa rurę', !(await zap()).items[0].cab.levels[0].cols[0].drazki);
}

console.log('\n== kontrole ==');
{
  await seed(szafa({ H: 1800 }, { shelfTargets: [null, null], drazki: [0] }));
  let u = await uwagi();
  ok('światło ok. 864 mm: „pod rurą tylko … mm — na koszule … ok. 1000 mm”', /rura na wieszaki: pod rurą tylko \d+ mm — na koszule i marynarki potrzeba ok\. 1000 mm \(płaszcze ok\. 1600\)/.test(u), linie(u, /rur/));
  await seed(szafa({ D: 470 }, { drazki: [1] }));
  u = await uwagi();
  ok('szafa 470 w głąb: ostrzeżenie „płytko, wieszaki zmieszczą się tylko pod skosem”', /wnętrze ma \d+ mm w głąb — płytko, wieszaki zmieszczą się tylko pod skosem/.test(u), linie(u, /rur/));
  await seed(szafa({ D: 380 }, { drazki: [1] }));
  u = await uwagi();
  ok('szafa 380 w głąb: błąd „za płytko na wieszaki” z „Usuń rurę”', /za płytko na wieszaki \(najmniej ok\. 400 mm/.test(u) && /Usuń rurę/.test(u), linie(u, /rur/));
  await page.getByRole('button', { name: 'Usuń rurę' }).first().click(); await page.waitForTimeout(600);
  ok('„Usuń rurę” zdejmuje ją', !(await zap()).items[0].cab.levels[0].cols[0].drazki);
  await seed(szafa({ H: 2200 }, { shelfTargets: [null] }));
  u = await uwagi();
  ok('światło ok. 2164 mm: podpowiedź z „płaszcze i sukienki”', /zmieści się rura na wieszaki \(pod nią \d+ mm: koszule, płaszcze i sukienki\)/.test(u), linie(u, /rur/));
}

ok('bez błędów strony', !errors.length, errors.join(' / '));
await b.close();
