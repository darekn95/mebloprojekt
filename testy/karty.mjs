/* Karty zamowienia (uzytkownik 2026-10-24: „żeby zmniejszyć ilość zakładek —
   zakładka formatki i pod nią przyciski szafka, pomieszczenie, projekt; tak samo
   rozkrój, produkty do zamówienia i wycena”). Jedna karta na obszar, przelacznik
   pod tytulem; Pomieszczenie / Projekt to wspolny zakres zamowienia, „Szafka”
   osobno w kazdej karcie. Domyslnie: formatki i produkty — szafka, rozkroj
   i wycena — projekt. */
import pw from './pw.mjs';
const URL = process.env.STD ? 'http://127.0.0.1:5199/standalone-local.html'
  : 'http://127.0.0.1:5205/mebloprojekt-app.html';
const ok = (l, c, e = '') => console.log((c ? '  OK   ' : '  BLAD ') + l + (e ? ' — ' + e : ''));
const b = await pw.chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const ctx = await b.newContext({ viewport: { width: 1500, height: 1300 } });
await ctx.addInitScript(() => { window.__mpKartyOsobno = false; });
const page = await ctx.newPage();
const errors = []; page.on('pageerror', (e) => errors.push(e.message));
await page.goto(URL, { waitUntil: 'networkidle' });

const cab = (name, W) => ({ name, W, H: 720, D: 560, levels: [{ h: null, cols: [{ kind: 'doors', doors: 1, w: null, shelfTargets: [null, null] }] }] });
const seed = async (q) => {
  await page.evaluate((p) => { localStorage.clear(); localStorage.setItem('szafki:projekt', JSON.stringify(p)); }, q);
  await page.reload({ waitUntil: 'networkidle' }); await page.waitForTimeout(1500);
};
const karty = (re) => page.evaluate((src) => [...document.querySelectorAll('section')].filter((s) => new RegExp(src).test(s.querySelector('h2')?.textContent || '')).length, re.source);
const sekcja = (re) => page.locator('section').filter({ has: page.locator('h2', { hasText: re }) }).first();
const zakres = (k) => page.locator(`[data-el="zakres-${k}"]`);
const wybierz = async (k, l) => { await zakres(k).getByRole('button', { name: l, exact: true }).click(); await page.waitForTimeout(600); };
const sumaWyceny = async () => {
  const t = await sekcja(/^Wycena/).innerText();
  const m = [...t.matchAll(/(\d+\.\d{2}) zł brutto/g)].pop();
  return m ? Number(m[1]) : NaN;
};

console.log('== dwie szafki w jednym pomieszczeniu ==');
{
  await seed({ name: 'P', active: 0, prices: {}, items: [{ cab: cab('A', 600) }, { cab: cab('B', 1000) }] });
  ok('jedna karta „Formatki”, bez „Formatki całego projektu”', (await karty(/^Formatki$/)) === 1 && (await karty(/^Formatki całego projektu/)) === 0 && (await karty(/^Formatki do zamówienia/)) === 0);
  ok('jedna karta „Produkty do zamówienia”, bez „Produkty całego projektu”', (await karty(/^Produkty do zamówienia$/)) === 1 && (await karty(/^Produkty całego projektu/)) === 0);
  await sekcja(/^Wycena/).locator('h2').click(); await page.waitForTimeout(800);   // wycena jest domyslnie zwinieta
  ok('przyciski Szafka / Projekt pod tytułem w 4 kartach (bez „Pomieszczenie” przy jednym)', (await zakres('formatki').count()) === 1 && (await zakres('rozkroj').count()) === 1 && (await zakres('produkty').count()) === 1 && (await zakres('wycena').count()) === 1
    && !(await zakres('formatki').innerText()).includes('Pomieszczenie'));
  ok('formatki domyślnie: szafka „A”', /szafka „A”/.test(await zakres('formatki').innerText()), await zakres('formatki').innerText());
  ok('rozkrój domyślnie: cały projekt — 2 szafki', /cały projekt — 2 szafki/.test(await zakres('rozkroj').innerText()), await zakres('rozkroj').innerText());
  await wybierz('formatki', 'Projekt');
  ok('Formatki → Projekt: suma formatek ze wszystkich szafek', /Suma formatek ze wszystkich szafek/.test(await sekcja(/^Formatki$/).innerText()));
  await wybierz('formatki', 'Szafka');
  ok('Formatki → Szafka: znów szafka „A”', /szafka „A”/.test(await zakres('formatki').innerText()) && !/Suma formatek/.test(await sekcja(/^Formatki$/).innerText()));
  const sumP = await sumaWyceny();
  await wybierz('wycena', 'Szafka');
  const sumS = await sumaWyceny();
  ok('Wycena → Szafka: mniej niż cały projekt (sama szafka A)', sumS > 0 && sumS < sumP, `${sumS} < ${sumP}`);
  await wybierz('rozkroj', 'Szafka');
  ok('Rozkrój → Szafka: „szafka „A””', /szafka „A”/.test(await zakres('rozkroj').innerText()) && (await sekcja(/^Rozkrój na płycie/).locator('svg').count()) > 0);
  // wybor pamietany w przegladarce
  await page.reload({ waitUntil: 'networkidle' }); await page.waitForTimeout(1200);
  ok('po przeładowaniu Rozkrój dalej na Szafka', /szafka „A”/.test(await zakres('rozkroj').innerText()));
}

console.log('\n== dwa pomieszczenia: „Pomieszczenie” ==');
{
  await seed({ name: 'P', active: 0, prices: {}, rooms: [{ id: 'p1', name: 'Kuchnia' }, { id: 'p2', name: 'Salon' }],
    items: [{ cab: cab('A', 600), roomId: 'p1' }, { cab: cab('B', 1000), roomId: 'p1' }, { cab: cab('C', 800), roomId: 'p2' }] });
  ok('jest „Pomieszczenie”', (await zakres('produkty').getByRole('button', { name: 'Pomieszczenie', exact: true }).count()) === 1);
  await wybierz('produkty', 'Pomieszczenie');
  ok('Produkty → Pomieszczenie: „pomieszczenie „Kuchnia” — 2 szafki”', /pomieszczenie „Kuchnia” — 2 szafki/.test(await zakres('produkty').innerText()), await zakres('produkty').innerText());
  ok('wspólny zakres: Formatki na Projekt pokazują teraz pomieszczenie', await (async () => { await wybierz('formatki', 'Projekt'); await wybierz('formatki', 'Pomieszczenie'); return /pomieszczenie „Kuchnia”/.test(await zakres('formatki').innerText()); })());
}

console.log('\n== jedna szafka: bez przełącznika ==');
{
  await seed({ name: 'P', active: 0, prices: {}, items: [{ cab: cab('A', 600) }] });
  ok('jedna szafka: karta „Formatki do zamówienia” bez przycisków', (await karty(/^Formatki do zamówienia$/)) === 1 && (await zakres('formatki').count()) === 0);
}

ok('bez błędów strony', !errors.length, errors.join(' / '));
await b.close();
