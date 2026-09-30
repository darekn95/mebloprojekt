/* Wstawka w rogu przy zwyklych szafkach (bez szafki w L). Uklad jak u
   uzytkownika: w rog wjezdza sciana 2, sciana 1 konczy sie przy jej drzwiach.
   Wstawka siedzi na boku ostatniej szafki sciany 1, od strony rogu:
   - plaska: grubosc plyty frontowej × 60 w glab, odsuwa ciag o 18 mm,
   - szeroka: 60 mm licem do przodu, na trojkatach, odsuwa ciag o 60 mm.
   Formatka z plyty frontowej, wysokosc korpusu; przyciski przy kolizji. */
import pw from './pw.mjs';
const URL = process.env.STD ? 'http://127.0.0.1:5199/standalone-local.html'
  : 'http://127.0.0.1:5205/mebloprojekt-app.html';
const ok = (l, c, e = '') => console.log((c ? '  OK   ' : '  BLAD ') + l + (e ? ' — ' + e : ''));
const b = await pw.chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const page = await (await b.newContext({ viewport: { width: 1500, height: 1300 } })).newPage();
const errors = []; page.on('pageerror', (e) => errors.push(e.message));
await page.goto(URL, { waitUntil: 'networkidle' });

const PL = { on: true, height: 100, mode: 'under', setback: 0 };
const CAB = (name, W, runId, o = {}) => ({ cab: { name, W, H: 720, D: 570, plinth: PL, legs: { on: true, height: 100 },
  levels: [{ h: null, cols: [{ kind: 'doors', doors: W > 600 ? 2 : 1, w: null }] }], ...o }, runId, offset: 0 });
const RUN = (id, name, o = {}) => ({ id, name, wallW: null, gap: 0, mountY: 0, H: 720, D: 570, plinth: PL, worktop: false, corner: null, ...o });
/* Szafka w rogu ustawiona jak po „Ustaw szafkę w rogu”: fix 618 od rogu
   (570 + 18 + 30), jedne drzwi, zawias od zewnatrz — dopiero wtedy kolizje
   w rogu wracaja do uwag razem z przyciskami wstawki (od 2026-09-28). */
const USTAWIONA = { levels: [{ h: null, cols: [{ kind: 'doors', doors: 1, w: null,
  fix: { side: 'left', w: 618, mode: 'overlay', support: false }, hinge: 'right' }] }] };
const seed = async (wstawka, active = 1, rogowa = USTAWIONA) => {
  await page.evaluate((p) => { localStorage.clear(); localStorage.setItem('szafki:projekt', JSON.stringify(p)); }, {
    name: 'W', active, prices: {},
    runs: [RUN('c1', 'Ściana 1'), RUN('c2', 'Ściana 2', { corner: { of: 'c1', at: 'end', owner: 'self', clear: 0, wstawka } })],
    items: [CAB('A1', 600, 'c1'), CAB('A2', 600, 'c1'), CAB('rog', 1000, 'c2', rogowa), CAB('B2', 600, 'c2')] });
  await page.reload({ waitUntil: 'networkidle' }); await page.waitForTimeout(800);
};
const card = (re) => page.locator('section').filter({ has: page.locator('h2', { hasText: re }) }).first();
const uwagi = async () => (await card(/^Uwagi/).count() ? await card(/^Uwagi/).innerText() : '');
const tabela = (re) => page.evaluate((src) => {
  const re = new RegExp(src);
  const sec = [...document.querySelectorAll('section')].find((s) => re.test((s.querySelector('h2') || {}).textContent || ''));
  return sec ? [...sec.querySelectorAll('tbody tr')].map((tr) => [...tr.children].map((td) => td.textContent.trim()).join(' | ')) : [];
}, re.source);
const zapis = () => page.evaluate(() => JSON.parse(localStorage.getItem('szafki:projekt')));
const pick = async (l) => { await page.getByRole('button', { name: l, exact: true }).first().click(); await page.waitForTimeout(300); };
const wstawkaZGory = async () => {
  await pick('Zabudowa'); await pick('Z góry');
  return page.evaluate(() => [...document.querySelectorAll('#rysunek [data-el="wstawka"]')].map((r) =>
    ({ w: Math.round(Number(r.getAttribute('width'))), h: Math.round(Number(r.getAttribute('height'))) })));
};

console.log('== bez wstawki: kolizja w rogu podpowiada wstawkę ==');
await seed(null);
let uw = await uwagi();
ok('kolizja otwierania w rogu jest zgłoszona', /nie ma się jak otworzyć/.test(uw));
const przycisk18 = card(/^Uwagi/).getByRole('button', { name: /Dodaj wstawkę 18 mm/ }).first();
ok('przycisk „Dodaj wstawkę 18 mm”', await przycisk18.count() === 1);
await przycisk18.click(); await page.waitForTimeout(1500);
let p = await zapis();
ok('po kliknięciu: płaska wstawka w narożniku ciągu', JSON.stringify(p.runs[1].corner.wstawka) === JSON.stringify({ typ: 'plaska', w: 60 }),
  JSON.stringify(p.runs[1].corner.wstawka));

console.log('\n== płaska: formatka, okucia, rysunki ==');
let lista = await tabela(/^Formatki do zamówienia/);
ok('formatka w liście szafki A2 (720 × 60, płyta frontowa)', lista.some((l) => /^Wstawka w rogu \|/.test(l) && /\| 720 \| 60 \|/.test(l)), lista.join(' / '));
let proj = await tabela(/^Formatki całego projektu/);
ok('formatka w liście projektu', proj.some((l) => /^Wstawka w rogu \| Wstawka w rogu — A2/.test(l)), proj.filter((l) => /Wstawka/.test(l)).join(' / '));
let prod = await tabela(/^Produkty całego projektu/);
ok('wkręty do wstawki w produktach', prod.some((l) => /Wkręt 4 × 30/.test(l) && /wstawka w rogu/.test(l)), prod.filter((l) => /Wkręt/.test(l)).join(' / '));
let wg = await wstawkaZGory();
ok('rzut z góry: wstawka 18 × 60', wg.length === 1 && wg[0].w === 18 && wg[0].h === 60, JSON.stringify(wg));
await pick('Zamk.');
const el = await page.evaluate(() => [...document.querySelectorAll('#rysunek [data-el="wstawka"]')].map((r) =>
  ({ w: Math.round(Number(r.getAttribute('width'))), h: Math.round(Number(r.getAttribute('height'))) })));
ok('elewacja: pasek 18 × 720', el.length === 1 && el[0].w === 18 && el[0].h === 720, JSON.stringify(el));

console.log('\n== szeroka: 60 mm na trójkątach ==');
uw = await uwagi();
const przycisk60 = card(/^Uwagi/).getByRole('button', { name: /Wstawka 60 mm \(na trójkątach\)/ }).first();
if (/nie ma się jak otworzyć/.test(uw)) {
  ok('gdy 18 mm nie wystarcza: przycisk „Wstawka 60 mm (na trójkątach)”', await przycisk60.count() === 1);
  await przycisk60.click(); await page.waitForTimeout(1500);
} else {
  console.log('     (18 mm wystarczyło — szeroką ustawiam wprost)');
  await seed({ typ: 'szeroka', w: 60 });
}
p = await zapis();
ok('narożnik ma szeroką wstawkę 60', p.runs[1].corner.wstawka && p.runs[1].corner.wstawka.typ === 'szeroka' && p.runs[1].corner.wstawka.w === 60,
  JSON.stringify(p.runs[1].corner.wstawka));
lista = await tabela(/^Formatki do zamówienia/);
ok('formatka 720 × 60 w liście szafki', lista.some((l) => /^Wstawka w rogu \|/.test(l) && /\| 720 \| 60 \|/.test(l)), lista.join(' / '));
prod = await tabela(/^Produkty całego projektu/);
ok('trójkąty do wstawki: po 2 z każdej strony = 4', prod.some((l) => /Trójkąt meblarski/.test(l) && /wstawka w rogu/.test(l) && /\| 4 szt\./.test(l)), prod.filter((l) => /Trójkąt/.test(l)).join(' / '));
proj = await tabela(/^Formatki całego projektu/);
const wiersz = proj.find((l) => /^Wstawka w rogu/.test(l)) || '';
ok('szeroka: oklejona tylko dolna krawędź (boki stykają się z szafkami)', /bok 60/.test(wiersz) && !/przód 720/.test(wiersz), wiersz);
wg = await wstawkaZGory();
ok('rzut z góry: wstawka 60 × 18', wg.length === 1 && wg[0].w === 60 && wg[0].h === 18, JSON.stringify(wg));

console.log('\n== odsunięcie ciągu o wstawkę ==');
/* Ciag sciany 1 odsuwa sie od rogu o glebokosc szafki w rogu (570), jej
   front (18) i wstawke — rzut pisze te liczbe w przerywanym polu „zjedzonym
   przez narożnik”. Front doliczany od 2026-09-28: wczesniej bok sasiada stal
   na fixie szafki w rogu, a wstawka na niego nachodzila. */
const zjedzone = async (w) => {
  await seed(w);
  await pick('Zabudowa'); await pick('Z góry');
  return page.evaluate(() => [...document.querySelectorAll('#rysunek text')].map((t) => t.textContent.trim()));
};
const tBez = await zjedzone(null), tPl = await zjedzone({ typ: 'plaska', w: 60 }), tSz = await zjedzone({ typ: 'szeroka', w: 60 });
// 570 + 3 (HDF za korpusem) + 18 frontu
ok('bez wstawki róg zjada 591 (korpus + plecy + front)', tBez.includes('591') && !tBez.includes('609'), tBez.filter((t) => /^[56]\d\d$/.test(t)).join(','));
// sciana 1: A1 + A2 = 1200 i plaska wstawka 18 — wymiar calosci razem z nia
ok('wymiar ciągu z wstawką: 1218', tPl.includes('1218 z wstawką'), tPl.filter((t) => /wstawk/.test(t)).join(','));
ok('płaska odsuwa ciąg o 18 (609)', tPl.includes('609'), tPl.filter((t) => /^[56]\d\d$/.test(t)).join(','));
ok('szeroka odsuwa ciąg o 60 (651)', tSz.includes('651'), tSz.filter((t) => /^6\d\d$/.test(t)).join(','));

console.log('\n== pole w karcie ciągu ==');
await seed(null, 3);
await page.getByText('Narożnik', { exact: true }).first().scrollIntoViewIfNeeded().catch(() => {});
const pole = page.locator('[data-el="wstawka-pole"] select');
ok('pole „Wstawka w rogu” w sekcji Narożnik', await pole.count() === 1);
await pole.selectOption('plaska'); await page.waitForTimeout(1500);
p = await zapis();
ok('wybór w polu zapisuje płaską wstawkę', p.runs[1].corner.wstawka && p.runs[1].corner.wstawka.typ === 'plaska');

console.log('\n== widok samej szafki z wstawką (zgłoszenie 2026-09-28) ==');
// A2 to ostatnia szafka sciany 1 — wstawka przykreca sie do jej prawego boku
await seed({ typ: 'plaska', w: 60 }, 1);
const wRys = async () => page.locator('#rysunek [data-el="wstawka"]').count();
await pick('Szafka'); await pick('Zamk.');
ok('widok z przodu (zamknięty): wstawka przy boku szafki', await wRys() === 1);
const bx = await page.locator('#rysunek [data-el="wstawka"]').first().evaluate((r) => ({ x: +r.getAttribute('x'), w: +r.getAttribute('width'), h: +r.getAttribute('height') }));
ok('po prawej stronie, 18 mm szerokości, wysokość korpusu 720', bx.x === 600 && bx.w === 18 && bx.h === 720, JSON.stringify(bx));
await pick('Otw.');
ok('widok z przodu (otwarty): wstawka jest', await wRys() === 1);
await pick('Z góry');
const bt = await page.locator('#rysunek [data-el="wstawka"]').first().evaluate((r) => ({ x: +r.getAttribute('x'), w: +r.getAttribute('width'), h: +r.getAttribute('height') })).catch(() => null);
ok('rzut z góry: wstawka 18 × 60 przy prawym boku', bt && bt.x === 600 && bt.w === 18 && bt.h === 60, JSON.stringify(bt));
await page.evaluate(() => { window.__audytBryl = []; });
await pick('3D');
const bryly = await page.evaluate(() => (window.__audytBryl || []).map((b) => [...b.d].sort((x, y) => x - y).map(Math.round).join('×')));
ok('bryła 3D: płyta 18 × 60 × 720', bryly.includes('18×60×720'), [...new Set(bryly)].filter((x) => /^18×/.test(x)).join(', '));
await pick('Z tyłu');
ok('widok z tyłu szafki: wstawka jest (po lewej, bo lustro)', await wRys() === 1);
await pick('Z boku');
ok('lewy bok: wstawki nie widać (jest przy prawym)', await wRys() === 0);
await page.getByRole('button', { name: /prawy bok/ }).first().click(); await page.waitForTimeout(300);
const bs = await page.locator('#rysunek [data-el="wstawka"]').first().evaluate((r) => ({ w: +r.getAttribute('width'), h: +r.getAttribute('height') })).catch(() => null);
ok('prawy bok: wstawka 60 × 720 przy froncie', bs && bs.w === 60 && bs.h === 720, JSON.stringify(bs));
await pick('Ciąg'); await pick('Z tyłu');
ok('ciąg z tyłu: wstawka jest', await wRys() === 1);
await pick('Zamk.');
const napisy = await page.evaluate(() => [...document.querySelectorAll('#rysunek text')].map((t) => t.textContent.trim()));
ok('ciąg: bok sąsiada bez wstawki (591, nie 609)', napisy.some((t) => /^bok „Ściana 2" 591$/.test(t)), napisy.filter((t) => /^bok/.test(t)).join(' | '));
await seed({ typ: 'plaska', w: 60 }, 0);
await pick('Szafka'); await pick('Zamk.');
ok('pierwsza szafka ściany 1 (nie przy rogu): bez wstawki', await wRys() === 0);

console.log('\n== szafka w L: wstawki nie ma ==');
await seed({ typ: 'plaska', w: 60 }, 3, { corner: { on: true, arm: 600 } });
ok('przy szafce w L pola wstawki nie ma', await page.locator('[data-el="wstawka-pole"]').count() === 0);
proj = await tabela(/^Formatki całego projektu/);
ok('przy szafce w L formatki wstawki nie ma', !proj.some((l) => /Wstawka w rogu/.test(l)));

console.log('\n== wstawka z tej samej płyty co drzwi (zgłoszenie 2026-09-30) ==');
/* Szafka z „Fronty z tej samej plyty co korpus” (domyslnie) robi drzwi z plyty
   korpusu — wstawka to front tej szafki, wiec idzie z tej samej plyty. Po
   odznaczeniu — obie z plyty frontowej. Plyty rozne kolorem, zeby bylo widac. */
const MAT = { board: { name: 'Płyta', thickness: 18, color: '#d8c3a0' }, front: { name: 'Płyta', thickness: 18, color: '#3b82f6' },
  back: { name: 'HDF', thickness: 3, color: '#e7e5e4' } };
const plytaWierszy = async (same) => {
  await page.evaluate(([p]) => { localStorage.clear(); localStorage.setItem('szafki:projekt', JSON.stringify(p)); }, [{
    name: 'W', active: 1, prices: {},
    runs: [RUN('c1', 'Ściana 1'), RUN('c2', 'Ściana 2', { corner: { of: 'c1', at: 'end', owner: 'self', clear: 0, wstawka: { typ: 'plaska', w: 60 } } })],
    items: [CAB('A1', 600, 'c1'), CAB('A2', 600, 'c1'), CAB('rog', 1000, 'c2', USTAWIONA), CAB('B2', 600, 'c2')]
      .map((it) => ({ ...it, mat: MAT, cab: { ...it.cab, frontSameAsBoard: same } })) }]);
  await page.reload({ waitUntil: 'networkidle' }); await page.waitForTimeout(900);
  const rows = await tabela(/^Formatki do zamówienia/);
  const plyta = (re) => ((rows.find((l) => re.test(l)) || '').split(' | ').find((x) => /^Płyta/.test(x)) || '');
  return { drzwi: plyta(/^Drzwi/), wstawka: plyta(/^Wstawka w rogu/), rows };
};
let pw1 = await plytaWierszy(true);
ok('fronty z płyty korpusu → wstawka z tej samej płyty co drzwi', !!pw1.wstawka && pw1.wstawka === pw1.drzwi, `drzwi „${pw1.drzwi}”, wstawka „${pw1.wstawka}”`);
pw1 = await plytaWierszy(false);
ok('fronty z płyty frontowej → wstawka też z frontowej', !!pw1.wstawka && pw1.wstawka === pw1.drzwi, `drzwi „${pw1.drzwi}”, wstawka „${pw1.wstawka}”`);

console.log('\nBLEDY:', errors.length ? errors.join('; ') : '(brak)');
await b.close();
