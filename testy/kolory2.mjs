/* Zmiana koloru plyty w kilku szafkach i kolory rysunku (zgloszenie uzytkownika
   2026-10-24: „stworzyłem 4 szafki w kolorze sonoma a na końcu zmieniłem na biały
   i dzieją się cuda”; „przycisk realne kolory / rozróżnij fronty działa tylko na
   daną szafkę a nie na cały ciąg czy zabudowę”).
   - „Rozróżnij fronty” przy frontach z plyty korpusu: fronty w odcieniu korpusu,
     a nie w ukrytym kolorze plyty frontow (bialy korpus = bezowe fronty);
   - „Realne kolory / Rozróżnij fronty” — dla wszystkich szafek projektu;
   - zmiana koloru pyta o ciag / pomieszczenie / projekt;
   - nowa szafka w ciagu bierze plyty sasiedniej;
   - struktura slojow: wzory wszystkich szafek na rysunku ciagu, 3D bez czerni. */
import pw from './pw.mjs';
const URL = process.env.STD ? 'http://127.0.0.1:5199/standalone-local.html'
  : 'http://127.0.0.1:5205/mebloprojekt-app.html';
const ok = (l, c, e = '') => console.log((c ? '  OK   ' : '  BLAD ') + l + (e ? ' — ' + e : ''));
const b = await pw.chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const page = await (await b.newContext({ viewport: { width: 1500, height: 1300 } })).newPage();
const errors = []; page.on('pageerror', (e) => errors.push(e.message));
await page.goto(URL, { waitUntil: 'networkidle' });

const SONOMA = '#d8c3a0', BIALY = '#e8e6e1', STARY_FRONT = '#c2a880';
const BIALY_ODCIEN = '#c8c6c2';   // bialy korpus × 0,86 — fronty w „Rozróżnij fronty”
const PL = { on: true, height: 100, mode: 'under', setback: 0 };
const cab = (n, o = {}) => ({ name: n, W: 600, H: 720, D: 560, plinth: PL, legs: { on: true, height: 100 },
  levels: [{ h: null, cols: [{ kind: 'doors', doors: 1, w: null }] }], ...o });
const wisz = (n) => cab(n, { D: 300, plinth: { on: false }, legs: { on: false }, hangerMode: 'listwa' });
const RUN = (id, name, roomId, o = {}) => ({ id, name, roomId, wallW: null, gap: 0, mountY: 0, H: 720, D: 560, plinth: PL, worktop: true, corner: null, ...o });
const seed = async (p) => {
  await page.evaluate((q) => { localStorage.clear(); localStorage.setItem('szafki:projekt', JSON.stringify(q)); }, p);
  await page.reload({ waitUntil: 'networkidle' }); await page.waitForTimeout(1200);
};
// zapis idzie 800 ms po zmianie
const projekt = async () => { await page.waitForTimeout(1100); return page.evaluate(() => JSON.parse(localStorage.getItem('szafki:projekt'))); };
const pick = async (l) => { const x = page.getByRole('button', { name: l, exact: true }); if (await x.count()) { await x.first().click(); await page.waitForTimeout(300); } };
// standalone rysuje bryly 3D dwa razy (StrictMode) — te same liczymy raz
const bezPowtorzen = (lista) => { const byl = new Set(); return lista.filter((s) => { const k = JSON.stringify([s.p, s.color, s.tag]); if (byl.has(k)) return false; byl.add(k); return true; }); };
const kolory3D = async (widok) => {
  await pick(widok); await pick('Zamk.');
  await page.evaluate(() => { window.__audytBryl = []; });
  await pick('3D'); await page.waitForTimeout(300);
  const a = bezPowtorzen(await page.evaluate(() => { const x = window.__audytBryl; window.__audytBryl = null; return x || []; }));
  const czarne = await page.evaluate(() => [...document.querySelectorAll('section svg polygon[fill="rgb(0,0,0)"]')].length);
  const ile = {}; a.forEach((q) => { ile[q.color] = (ile[q.color] || 0) + 1; });
  return { ile, czarne };
};
const karta = () => page.locator('section', { has: page.locator('h2', { hasText: /^Płyty/ }) });
const otworzPlyty = async () => {
  const k = karta();
  if (!(await k.locator('button[title="Biały mat"]').count())) { await k.locator('h2').first().click(); await page.waitForTimeout(300); }
};
const pytanie = async () => { const x = page.locator('[data-el="kolor-dla-innych"]'); return (await x.count()) ? (await x.first().innerText()).replace(/\s+/g, ' ') : ''; };
// przycisk w pytaniu (na stronie jest tez zakres zamowienia „Cały projekt”)
const wPytaniu = async (re) => { await page.locator('[data-el="kolor-dla-innych"] button', { hasText: re }).first().click(); await page.waitForTimeout(500); };
const chip = async (n) => { await page.getByRole('button', { name: n, exact: true }).first().click(); await page.waitForTimeout(400); };

const MAT = (board) => ({ board: { name: 'Płyta', thickness: 18, color: board }, front: { name: 'Płyta', thickness: 18, color: STARY_FRONT },
  shelf: { name: 'Płyta', thickness: 18, color: '#d0bb96' }, back: { name: 'HDF', thickness: 3, color: '#9c7b56' },
  mirror: { name: 'Lustro', thickness: 4, color: '#c3d0d6' }, worktop: { name: 'Blat roboczy', thickness: 38, color: '#8d7b68', depth: 600 } });
const UKLAD = () => ({ name: 'Kolory', active: 0, prices: {},
  rooms: [{ id: 'p1', name: 'Kuchnia' }, { id: 'p2', name: 'Salon' }],
  runs: [RUN('c1', 'Ściana 1', 'p1'), RUN('u1', 'Ściana 1', 'p1', { tier: 'gorny', wall: 'c1', D: 300, plinth: null, worktop: false, mountY: 1440 }),
    RUN('s1', 'Ściana 1', 'p2')],
  items: [...['A', 'B', 'C', 'D'].map((n) => ({ cab: cab(n), mat: MAT(SONOMA), runId: 'c1', offset: 0 })),
    { cab: wisz('G'), mat: MAT(SONOMA), runId: 'u1', offset: 0 },
    { cab: cab('S'), mat: MAT(SONOMA), runId: 's1', offset: 0 }] });

console.log('== 4 szafki sonoma → biały ==');
{
  await seed(UKLAD());
  let k = await kolory3D('Ciąg');
  // ciąg z górnym piętrem: 4 szafki dolne + górna G
  ok('przed: korpusy sonoma, fronty w odcieniu sonomy (nie w ukrytym kolorze plyty frontów)', k.ile[SONOMA] > 0 && !k.ile[STARY_FRONT] && k.ile['#baa88a'] === 5, JSON.stringify(k.ile));
  await otworzPlyty();
  await karta().locator('button[title="Biały mat"]').first().click(); await page.waitForTimeout(500);
  let q = await pytanie();
  ok('po zmianie: pytanie o ciąg (3), pomieszczenie (4) i projekt (5)',
    /Cały ciąg „Ściana 1” — 3 szafki/.test(q) && /Całe pomieszczenie — 4 szafki/.test(q) && /Cały projekt — 5 szafek/.test(q) && /Tylko ta szafka/.test(q), q);
  k = await kolory3D('Ciąg');
  ok('aktywna biała z frontem w odcieniu bieli, reszta jeszcze sonoma', k.ile[BIALY] > 0 && k.ile[BIALY_ODCIEN] === 1 && k.ile['#baa88a'] === 4 && !k.ile[STARY_FRONT], JSON.stringify(k.ile));
  await wPytaniu(/^Cały ciąg/);
  let p = await projekt();
  ok('„Cały ciąg”: A–D białe, górna G i salon S bez zmian', p.items.slice(0, 4).every((it) => it.mat.board.color === BIALY) && p.items[4].mat.board.color === SONOMA && p.items[5].mat.board.color === SONOMA,
    p.items.map((it) => it.cab.name + ':' + it.mat.board.color).join(' '));
  q = await pytanie();
  ok('dalej pytanie o pomieszczenie (1) i projekt (2)', /Całe pomieszczenie — 1 szafka/.test(q) && /Cały projekt — 2 szafki/.test(q) && !/Cały ciąg/.test(q), q);
  k = await kolory3D('Ciąg');
  ok('3D ciągu: dolne korpusy białe, 4 fronty w odcieniu bieli, górna G jeszcze sonoma, bez starego beżu', k.ile[BIALY] > 0 && k.ile[BIALY_ODCIEN] === 4 && k.ile['#baa88a'] === 1 && !k.ile[STARY_FRONT], JSON.stringify(k.ile));
  await wPytaniu(/^Tylko ta szafka/);
  ok('„Tylko ta szafka” zamyka pytanie', !(await pytanie()));
  // pytanie znika przy innej szafce
  await karta().locator('button[title="Szary"]').first().click(); await page.waitForTimeout(300);
  await chip('B');
  ok('po przejściu na inną szafkę pytania nie ma', !(await pytanie()));
  await chip('A');
  await karta().locator('button[title="Biały mat"]').first().click(); await page.waitForTimeout(300);
  await wPytaniu(/^Cały projekt/);
  p = await projekt();
  ok('„Cały projekt”: wszystkie 6 szafek białe', p.items.every((it) => it.mat.board.color === BIALY), p.items.map((it) => it.cab.name + ':' + it.mat.board.color).join(' '));
}

console.log('\n== „Realne kolory / Rozróżnij fronty” dla całego projektu ==');
{
  await pick('Realne kolory');
  let p = await projekt();
  ok('„Realne kolory” włącza wszystkie szafki projektu', p.items.every((it) => it.cab.realColors === true), p.items.map((it) => it.cab.name + ':' + !!it.cab.realColors).join(' '));
  let k = await kolory3D('Ciąg');
  ok('3D ciągu: fronty białe jak korpus (bez odcienia)', k.ile[BIALY] > 0 && !k.ile[BIALY_ODCIEN], JSON.stringify(k.ile));
  await chip('C');
  ok('inna szafka ma ten sam tryb (przycisk „Rozróżnij fronty”)', (await page.getByRole('button', { name: 'Rozróżnij fronty', exact: true }).count()) > 0);
  await pick('Rozróżnij fronty');
  p = await projekt();
  ok('„Rozróżnij fronty” wyłącza wszystkie', p.items.every((it) => !it.cab.realColors));
  k = await kolory3D('Zabudowa');
  ok('3D zabudowy (dół + góra): wszystkie fronty w odcieniu bieli', k.ile[BIALY_ODCIEN] === 5 && !k.ile[STARY_FRONT], JSON.stringify(k.ile));
  await pick('Realne kolory');
  await page.getByRole('button', { name: '+ szafka', exact: true }).first().click(); await page.waitForTimeout(600);
  p = await projekt();
  const nowa = p.items[p.active];
  ok('nowa szafka w ciągu: płyty jak sąsiednia (biały) i realne kolory', nowa.runId === 'c1' && nowa.mat.board.color === BIALY && nowa.cab.realColors === true,
    `${nowa.cab.name} ${nowa.runId} ${nowa.mat.board.color} ${nowa.cab.realColors}`);
}

console.log('\n== fronty z osobnej płyty, ciemny korpus ==');
{
  const u = UKLAD();
  u.items[1].cab.frontSameAsBoard = false; u.items[1].mat.front.color = '#4a4d4f';
  u.items[2].mat = MAT('#2b2a28');
  await seed(u);
  let k = await kolory3D('Ciąg');
  ok('„Rozróżnij fronty”: osobne fronty w swoim kolorze (antracyt), czarny korpus — fronty jaśniejsze', k.ile['#4a4d4f'] === 1 && k.ile['#5a5957'] === 1, JSON.stringify(k.ile));
  await pick('Realne kolory');
  k = await kolory3D('Ciąg');
  ok('„Realne kolory”: osobne fronty dalej antracyt, czarne fronty jak korpus', k.ile['#4a4d4f'] === 1 && !k.ile['#5a5957'] && k.ile['#2b2a28'] > 0, JSON.stringify(k.ile));
}

console.log('\n== struktura słojów w ciągu ==');
{
  const u = UKLAD();
  u.items[0].cab.texture = true; u.items[1].cab.texture = true; u.items[1].mat = MAT(BIALY);
  await seed(u);
  await pick('Ciąg'); await pick('Zamk.'); await pick('Front');
  const braki = await page.evaluate(() => {
    const svg = [...document.querySelectorAll('section svg')].sort((a, b) => b.getBoundingClientRect().width - a.getBoundingClientRect().width)[0];
    const ids = new Set([...document.querySelectorAll('pattern')].map((x) => x.id));
    const f = [...svg.querySelectorAll('[fill^="url(#gr"]')].map((e) => e.getAttribute('fill').slice(5, -1));
    return { uzyte: [...new Set(f)], brak: [...new Set(f.filter((x) => !ids.has(x)))] };
  });
  ok('elewacja ciągu: wzór słojów dla każdej szafki (także białej)', braki.uzyte.includes('grve8e6e1') && !braki.brak.length, JSON.stringify(braki));
  const k = await kolory3D('Ciąg');
  ok('3D ciągu ze słojami: kolory płyt, nic czarnego', !k.czarne && k.ile[BIALY] > 0, `czarne ${k.czarne} ${JSON.stringify(k.ile)}`);
}

ok('bez błędów strony', !errors.length, errors.join(' / '));
await b.close();
