/* Audyt szuflad (zgloszenie uzytkownika 2026-10-04: „zle sie policzyl front
   szuflady i zglasza, ze szuflada sie nie wysunie … coś jest bardzo źle”).
   Macierz: 1–4 szuflady × szafka z wiencem / pod blatem roboczym (bez wienca,
   ze wzmocnieniami) × podniesiony tyl tak/nie, plus fronty wpuszczane.
   Dla kazdego ukladu:
   - fronty nakladane wypelniaja pas od 3 mm nad dolem do 3 mm pod gora
     korpusu (z wiencem i bez) — nigdy ponad korpus, w blat,
   - w uwagach nie ma „nie wysunie się”, a kazde ostrzezenie/blad szuflady
     ma przycisk naprawy,
   - w bryle 3D skrzynka (boki V-BOX, dno, tyl) nie wchodzi w plyty korpusu
     ani we wzmocnienia (pod blatem: plaskie z przodu, stojace przy plecach).
   Kazda rola plyty ma swoj kolor, zeby po kolorze odroznic korpus od szuflady. */
import pw from './pw.mjs';
const URL = process.env.STD ? 'http://127.0.0.1:5199/standalone-local.html'
  : 'http://127.0.0.1:5205/mebloprojekt-app.html';
const ok = (l, c, e = '') => console.log((c ? '  OK   ' : '  BLAD ') + l + (e ? ' — ' + e : ''));
const b = await pw.chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const page = await (await b.newContext({ viewport: { width: 1500, height: 1300 } })).newPage();
const errors = []; page.on('pageerror', (e) => errors.push(e.message));
await page.goto(URL, { waitUntil: 'networkidle' });

const K = '#cc2222', F = '#2222cc', P = '#22aa22';
const MAT = {
  board: { name: 'Płyta', thickness: 18, color: K, decor: 'KORPUS' },
  front: { name: 'Płyta', thickness: 18, color: F, decor: 'FRONT' },
  shelf: { name: 'Płyta', thickness: 18, color: P, decor: 'POLKA' },
  back: { name: 'HDF', thickness: 3, color: '#e7e5e4' },
  worktop: { name: 'Blat roboczy', thickness: 38, color: '#8d7b68', depth: 600 },
};

/* Szafki wzorcowe biore z aplikacji, a nie z reki: zwykla stojaca (wieniec)
   i ta, ktora dostaje sie „+ szafka” w ciagu z blatem (bez wienca, wzmocnienia). */
await page.evaluate(() => localStorage.clear());
await page.reload({ waitUntil: 'networkidle' }); await page.waitForTimeout(1200);
await page.getByRole('button', { name: '+ ciąg', exact: true }).first().click(); await page.waitForTimeout(500);
const wiersz = page.locator('header .space-y-1 > div').filter({ hasText: /^Ściana 1/ }).first();
await wiersz.getByRole('button', { name: '+ szafka', exact: true }).click(); await page.waitForTimeout(1800);
const wzor = await page.evaluate(() => JSON.parse(localStorage.getItem('szafki:projekt')));
const zWiencem = wzor.items.find((it) => !it.runId).cab;
const podBlatem = wzor.items.find((it) => it.runId).cab;
const run = wzor.runs[0];
ok('wzór „pod blatem” ma wzmocnienia zamiast wieńca', JSON.stringify(podBlatem).includes('"rails"') && run.worktop === true,
  JSON.stringify(podBlatem.levels[0].cols[0].rails || []).slice(0, 80));

const szuflady = (n, tall) => Array.from({ length: n }, () => ({ h: 'auto', front: null, handle: true, tallBack: tall }));
// polki (dno i tyl szuflady) z wlasnej plyty — po kolorze odrozniamy je od korpusu
const zSzufladami = (cab, n, tall, o = {}) => ({ ...cab, name: 'S', W: 600, H: 720, D: 560, shelfSameAsBoard: false, frontSameAsBoard: false, ...o,
  levels: [{ h: null, cols: [{ ...cab.levels[0].cols[0], kind: 'drawers', drawers: szuflady(n, tall), doors: 2 }] }] });

const czytaj = () => page.evaluate(() => {
  const sec = (re) => [...document.querySelectorAll('section')].find((s) => re.test(s.querySelector('h2')?.textContent || ''));
  const f = sec(/^Formatki do zamówienia/);
  const rows = f ? [...f.querySelectorAll('tbody tr')].map((tr) => [...tr.children].map((x) => x.textContent.trim())) : [];
  const u = sec(/^Uwagi/);
  // kazda uwaga: tekst i przyciski naprawy (te w liscie, nie „odhacz”)
  const uwagi = u ? [...u.querySelectorAll('li, div')].filter((d) => /szuflad/.test(d.textContent || '') && d.querySelector('button'))
    .map((d) => ({ t: d.textContent.trim(), btn: [...d.querySelectorAll('button')].map((x) => x.textContent.trim()).filter((x) => x && x !== '✓' && x !== '×') })) : [];
  return { rows, uwagi: u ? u.innerText : '', zPrzyciskami: uwagi };
});
const click = async (l) => { const x = page.getByRole('button', { name: l, exact: true }); if (await x.count()) { await x.first().click(); await page.waitForTimeout(300); return true; } return false; };
let zamkniete = [];
const bryly = async () => {
  await click('Szafka'); await click('Zamk.');
  await page.evaluate(() => { window.__audytBryl = []; });
  await click('3D'); await page.waitForTimeout(300);
  zamkniete = await page.evaluate(() => (window.__audytBryl || []).filter((s) => s.p));
  // skrzynka jest w bryle tylko przy otwartych szufladach — wysuniete przejezdzaja pod wszystkim nad nimi
  // jak `audyt2d`: przelacznik „zamknięte” w 3D przerysowuje bryle otwarta
  await page.evaluate(() => { window.__audytBryl = []; });
  await click('zamknięte'); await page.waitForTimeout(400);
  return page.evaluate(() => { const x = window.__audytBryl || []; window.__audytBryl = null; return x.filter((s) => s.p); });
};
// czesc wspolna dwoch prostopadloscianow (mm) — kazda os musi zachodzic o wiecej niz 0,5
const nachodzi = (a, c) => [0, 1, 2].every((k) => Math.min(a.p[k + 3], c.p[k + 3]) - Math.max(a.p[k], c.p[k]) > 0.5);

const wynik = [];
for (const [opis, wzorCab, wRun] of [['z wieńcem', zWiencem, false], ['pod blatem', podBlatem, true]]) {
  for (const tall of [false, true]) {
    for (const n of [1, 2, 3, 4]) {
      for (const frontMode of n === 3 ? ['overlay', 'inset'] : ['overlay']) {
        const nazwa = `${opis}, ${n} szuf.${tall ? ', podniesiony tył' : ''}${frontMode === 'inset' ? ', fronty wpuszczane' : ''}`;
        const cab = zSzufladami(wzorCab, n, tall, { frontMode });
        const p = { name: 'Szuflady', active: 0, prices: {}, rooms: [{ id: 'p1', name: 'Pomieszczenie 1' }],
          runs: wRun ? [{ ...run, roomId: 'p1' }] : [],
          items: [{ cab, mat: MAT, runId: wRun ? run.id : null, roomId: 'p1', offset: 0 }] };
        await page.evaluate((q) => { localStorage.setItem('szafki:projekt', JSON.stringify(q)); }, p);
        await page.reload({ waitUntil: 'networkidle' }); await page.waitForTimeout(900);
        const r = await czytaj();
        const fronty = r.rows.filter((x) => /^Front szuflady/.test(x[0])).flatMap((x) => Array(Number(x[4])).fill(Number(x[2])));
        const bledy = [];
        // 1. pas frontow: nakladane 3 mm od dolu i od gory korpusu, luz 2 mm miedzy
        if (frontMode === 'overlay') {
          const suma = fronty.reduce((a, v) => a + v, 0) + 2 * (n - 1);
          if (fronty.length !== n || Math.abs(suma - (720 - 6)) > 1) bledy.push(`fronty ${fronty.join('+')} + luzy = ${suma}, a ma być ${720 - 6}`);
        } else if (fronty.length !== n || fronty.some((v) => !(v > 0))) bledy.push(`fronty wpuszczane: ${fronty.join(', ')}`);
        // 2. nic sie nie blokuje, a kazda uwaga szuflady ma przycisk
        if (/nie wysunie się/.test(r.uwagi)) bledy.push('„nie wysunie się”: ' + (r.uwagi.match(/[^\n]*nie wysunie się[^\n]*/) || [''])[0].slice(0, 120));
                const bezPrzycisku = r.uwagi.split('\n').filter((l) => /szuflada \d+:/.test(l) && !/front uniesie|zmieści się głębsza|reling/.test(l))
          .filter((l) => !r.zPrzyciskami.some((z) => z.t.includes(l.slice(0, 60)) && z.btn.length));
        if (bezPrzycisku.length) bledy.push('uwaga bez przycisku: ' + bezPrzycisku[0].slice(0, 140));
        // 3. bryla: skrzynka nie wchodzi w korpus ani we wzmocnienia
        const br = await bryly();
        const korpus = br.filter((s) => (s.color || '').toLowerCase() === K);
        const skrzynka = br.filter((s) => s.tag === 'skrzynka-bok' || ['#8b8b93', P].includes((s.color || '').toLowerCase()));
        const kol = [];
        skrzynka.forEach((s) => korpus.forEach((k) => { if (nachodzi(s, k)) kol.push(`${s.tag || 'dno/tył'} ${JSON.stringify(s.p)} × korpus ${JSON.stringify(k.p)}`); }));
        if (!skrzynka.length) bledy.push('brak skrzynki w 3D');
        if (kol.length) bledy.push(`skrzynka nachodzi na korpus/wzmocnienie (${kol.length}): ${kol[0]}`);
        // zamkniete fronty (wpuszczane siedza w otworze) nie wchodza w korpus ani we wzmocnienie
        const fr = zamkniete.filter((s) => (s.color || '').toLowerCase() === F);
        const kz = zamkniete.filter((s) => (s.color || '').toLowerCase() === K);
        const kolF = [];
        fr.forEach((s) => kz.forEach((k) => { if (nachodzi(s, k)) kolF.push(`front ${JSON.stringify(s.p)} × korpus ${JSON.stringify(k.p)}`); }));
        if (!fr.length) bledy.push('brak frontów w 3D');
        if (kolF.length) bledy.push(`front nachodzi na korpus/wzmocnienie (${kolF.length}): ${kolF[0]}`);
        ok(nazwa, bledy.length === 0, bledy.join(' | ') || `fronty ${fronty.join('/')}`);
        wynik.push({ nazwa, uwagi: r.uwagi.split('\n').filter((l) => /szuflada \d+:/.test(l)) });
      }
    }
  }
}

/* Uklad z projektu uzytkownika: 3 szuflady z podniesionym tylem pod blatem —
   front 236 (nie 242 w blat), gorna szuflada na krotszej prowadnicy przed
   tylnym wzmocnieniem, a tyl bez miejsca na podniesienie ma przycisk
   „Wyłącz podniesiony tył”, ktory gasi uwage. */
console.log('\n== 3 szuflady pod blatem, podniesiony tył (jak w zgłoszeniu) ==');
const p3 = { name: 'Szuflady', active: 0, prices: {}, rooms: [{ id: 'p1', name: 'Pomieszczenie 1' }], runs: [{ ...run, roomId: 'p1' }],
  items: [{ cab: zSzufladami(podBlatem, 3, true), mat: MAT, runId: run.id, roomId: 'p1', offset: 0 }] };
await page.evaluate((q) => { localStorage.setItem('szafki:projekt', JSON.stringify(q)); }, p3);
await page.reload({ waitUntil: 'networkidle' }); await page.waitForTimeout(900);
let r = await czytaj();
const dna = r.rows.filter((x) => /^Dno szuflady/.test(x[0])).map((x) => `${x[3]}×${x[4]}`);
ok('górna szuflada na krótszej prowadnicy (NL 500 → dno 476)', dna.some((d) => /^476×/.test(d)), dna.join(', '));
const przycisk = page.getByRole('button', { name: 'Wyłącz podniesiony tył' });
const ile = await przycisk.count();
ok('uwaga o podniesionym tyle ma przycisk „Wyłącz podniesiony tył”', ile >= 1, String(ile));
if (ile) {
  await przycisk.first().click(); await page.waitForTimeout(1600);   // zapis do przegladarki z opoznieniem
  r = await czytaj();
  const st = await page.evaluate(() => JSON.parse(localStorage.getItem('szafki:projekt')));
  ok('po kliknięciu tył zwykły i jedna uwaga mniej',
    st.items[0].cab.levels[0].cols[0].drawers.filter((d) => !d.tallBack).length === 1 && (r.uwagi.match(/podniesionego tyłu/g) || []).length === ile - 1,
    JSON.stringify(st.items[0].cab.levels[0].cols[0].drawers.map((d) => d.tallBack)));
}

/* Drzwi wpuszczane pod blatem: tez nie wchodza w plaskie wzmocnienie przy licu. */
console.log('\n== drzwi wpuszczane pod blatem ==');
const drzwi = { ...podBlatem, name: 'D', W: 600, H: 720, D: 560, frontMode: 'inset', shelfSameAsBoard: false, frontSameAsBoard: false,
  levels: [{ h: null, cols: [{ ...podBlatem.levels[0].cols[0], kind: 'doors', doors: 2 }] }] };
await page.evaluate((q) => { localStorage.setItem('szafki:projekt', JSON.stringify(q)); },
  { ...p3, items: [{ ...p3.items[0], cab: drzwi }] });
await page.reload({ waitUntil: 'networkidle' }); await page.waitForTimeout(900);
await bryly();
{
  const fr = zamkniete.filter((s) => (s.color || '').toLowerCase() === F);
  const kz = zamkniete.filter((s) => (s.color || '').toLowerCase() === K);
  const kolD = [];
  fr.forEach((s) => kz.forEach((k) => { if (nachodzi(s, k)) kolD.push(`${JSON.stringify(s.p)} × ${JSON.stringify(k.p)}`); }));
  ok('drzwi wpuszczane nie wchodzą we wzmocnienie przy licu', fr.length > 0 && !kolD.length, kolD[0] || `${fr.length} brył frontu`);
}

/* Zrecznie wybrany za wysoki bok pod wzmocnieniem: blad z przyciskiem nizszego boku. */
console.log('\n== za wysoki bok pod wzmocnieniem → błąd z przyciskiem ==');
const wysoki = zSzufladami(podBlatem, 2, false);
wysoki.levels[0].cols[0].drawers[1].h = 238;
wysoki.levels[0].cols[0].drawers[1].front = 400;
wysoki.levels[0].cols[0].drawers[0].front = null;
await page.evaluate((q) => { localStorage.setItem('szafki:projekt', JSON.stringify(q)); },
  { ...p3, items: [{ ...p3.items[0], cab: { ...wysoki, levels: [{ h: null, cols: [{ ...wysoki.levels[0].cols[0], drawers: [{ h: 'auto', front: null, handle: true }, { h: 238, front: 250, handle: true }] }] }] } }] });
await page.reload({ waitUntil: 'networkidle' }); await page.waitForTimeout(900);
r = await czytaj();
console.log('   ' + r.uwagi.split('\n').filter((l) => /szuflada/.test(l)).join('\n   ').slice(0, 400));

console.log('\nBLEDY:', errors.length ? errors.join('; ') : '(brak)');
await b.close();
