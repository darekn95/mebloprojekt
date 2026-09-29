/* Komentarze uzytkownika w artefakcie (2026-09-29):
   - podzial blatu i cokolu: styki jako pola do zaznaczenia plus wlasne ciecie
     wpisane w mm od lewego konca,
   - rysunek „Ciąg”: wymiar tylko szafek ciagu (bez rogu zajetego przez szafke
     drugiej sciany),
   - karta ciagu: dlugosc kazdej sciany osobno, bez „z narożnikiem”, a „Rozwiąż
     ciąg” na gorze czesci „Cały ciąg”,
   - pasek ciagow i szafek da sie zwinac. */
import pw from './pw.mjs';
const URL = process.env.STD ? 'http://127.0.0.1:5199/standalone-local.html'
  : 'http://127.0.0.1:5205/mebloprojekt-app.html';
const ok = (l, c, e = '') => console.log((c ? '  OK   ' : '  BLAD ') + l + (e ? ' — ' + e : ''));
const b = await pw.chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const page = await (await b.newContext({ viewport: { width: 1500, height: 1300 } })).newPage();
const errors = []; page.on('pageerror', (e) => errors.push(e.message));
await page.goto(URL, { waitUntil: 'networkidle' });

const PL = { on: true, height: 100, mode: 'under', setback: 0 };
const sz = (name, W, runId) => ({ cab: { name, W, H: 720, D: 560, plinth: PL, legs: { on: true, height: 100 },
  levels: [{ h: null, cols: [{ kind: 'doors', doors: 2, w: null }] }] }, runId, offset: 0 });
const RUN = (id, name, o = {}) => ({ id, name, wallW: null, gap: 0, mountY: 0, H: 720, D: 560, plinth: PL, worktop: true, corner: null, ...o });
// jak projekt uzytkownika: sciana 1 — trzy szafki 600, sciana 2 wjezdza w rog szafka 1100
await page.evaluate((q) => { localStorage.clear(); localStorage.setItem('szafki:projekt', JSON.stringify(q)); },
  { name: 'P', active: 0, prices: {}, items: [sz('A1', 600, 'c1'), sz('A2', 600, 'c1'), sz('A3', 600, 'c1'), sz('B1', 1100, 'c2')],
    runs: [RUN('c1', 'Ściana 1'), RUN('c2', 'Ściana 2', { corner: { of: 'c1', at: 'end', owner: 'self', clear: 0 } })] });
await page.reload({ waitUntil: 'networkidle' }); await page.waitForTimeout(1500);
const cs = () => page.locator('section').filter({ has: page.locator('h2', { hasText: /^Ciąg meblowy/ }) }).first();
const stan = () => page.evaluate(() => JSON.parse(localStorage.getItem('szafki:projekt') || '{}'));

console.log('== karta ciągu: ściany osobno, bez „z narożnikiem”, „Rozwiąż ciąg” u góry ==');
const txt = await cs().innerText();
ok('„Ściana 1: 3 szafki — 1800 mm” i „Ściana 2: 1 szafka — 1100 mm”', /Ściana 1: 3 szafki — 1800 mm/.test(txt) && /Ściana 2: 1 szafka — 1100 mm/.test(txt),
  txt.split('\n').filter((l) => /szafk[ai] —/.test(l)).join(' | '));
ok('bez „z narożnikiem” w długościach', !/z narożnikiem/.test(txt), (txt.match(/.{0,40}z narożnikiem.{0,20}/) || [''])[0]);
const kol = await cs().evaluate((sec) => {
  const t = sec.innerText; return { rozw: t.indexOf('Rozwiąż ciąg'), sciana: t.indexOf('NAZWA CIĄGU') >= 0 ? t.indexOf('NAZWA CIĄGU') : t.indexOf('Nazwa ciągu'), blat: t.search(/PODZIAŁ BLATU|Podział blatu/) };
});
ok('„Rozwiąż ciąg” przed częścią „Ściana”, nie pod blatem', kol.rozw >= 0 && kol.rozw < kol.sciana && kol.rozw < kol.blat, JSON.stringify(kol));

console.log('\n== rysunek „Ciąg”: wymiar samych szafek ==');
await page.getByRole('button', { name: 'Ciąg', exact: true }).first().click(); await page.waitForTimeout(600);
const napisy = await page.evaluate(() => [...document.querySelectorAll('#rysunek text')].map((t) => t.textContent.trim()));
ok('„1800 ciąg”, bez „2399 ciąg”', napisy.includes('1800 ciąg') && !napisy.some((t) => /^2\d{3} ciąg$/.test(t)), napisy.filter((t) => /ciąg/.test(t)).join(', '));

console.log('\n== podział blatu: pola do zaznaczenia i własne cięcie ==');
const grupa = (lab) => cs().locator('div').filter({ hasText: new RegExp('^' + lab) }).first();
const pola = await cs().evaluate((sec) => {
  const f = [...sec.querySelectorAll('div')].find((l) => /^Podział blatu/.test((l.textContent || '').trim()));
  return f ? { chk: [...f.querySelectorAll('input[type=checkbox]')].length, pole: !!f.querySelector('input[type=number]') } : null;
});
ok('styki jako pola do zaznaczenia + pole na własny wymiar', !!pola && pola.chk >= 2 && pola.pole, JSON.stringify(pola));
const wpisz = async (lab, v) => {
  await cs().evaluate((sec, [lab, v]) => {
    const f = [...sec.querySelectorAll('div')].find((l) => new RegExp('^' + lab).test((l.textContent || '').trim()));
    const inp = f.querySelector('input[type=number]');
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
    setter.call(inp, String(v)); inp.dispatchEvent(new Event('input', { bubbles: true }));
  }, [lab, v]);
  await page.waitForTimeout(200);
  await cs().evaluate((sec, lab) => {
    const f = [...sec.querySelectorAll('div')].find((l) => new RegExp('^' + lab).test((l.textContent || '').trim()));
    [...f.querySelectorAll('button')].find((x) => x.textContent.trim() === 'dodaj').click();
  }, lab);
  await page.waitForTimeout(1600);   // projekt zapisuje sie do przegladarki z opoznieniem
};
await wpisz('Podział blatu', 1000);
let st = await stan();
ok('własne cięcie blatu zapisane (topCutsWlasne = [1000])', JSON.stringify(st.runs[0].topCutsWlasne) === '[1000]', JSON.stringify(st.runs[0].topCutsWlasne));
const f = await page.evaluate(() => {
  const sec = [...document.querySelectorAll('section')].find((s) => /^Formatki całego projektu/.test(s.querySelector('h2')?.textContent || ''));
  return sec ? [...sec.querySelectorAll('tbody tr')].map((tr) => [...tr.children].map((x) => x.textContent.trim())).filter((r) => /^Blat ciągu/.test(r[0])) : [];
});
// blat sciany 1 dochodzi do krawedzi blatu sciany 2: 1781 = 1000 + 781
ok('blat ściany 1 w dwóch kawałkach, jeden 1000', f.length >= 2 && f.some((r) => r.includes('1000')), f.map((r) => r.slice(0, 5).join(' ')).join(' // '));
await wpisz('Podział cokołu', 700);
st = await stan();
ok('własne cięcie cokołu zapisane (plinthCutsWlasne = [700])', JSON.stringify(st.runs[0].plinthCutsWlasne) === '[700]', JSON.stringify(st.runs[0].plinthCutsWlasne));
// usuniecie wlasnego ciecia
await cs().evaluate((sec) => {
  const f = [...sec.querySelectorAll('div')].find((l) => /^Podział blatu/.test((l.textContent || '').trim()));
  f.querySelector('button[title="Usuń to cięcie"]').click();
});
await page.waitForTimeout(1600);
st = await stan();
ok('własne cięcie da się usunąć', (st.runs[0].topCutsWlasne || []).length === 0, JSON.stringify(st.runs[0].topCutsWlasne));
void grupa;

console.log('\n== pasek ciągów i szafek zwija się ==');
const przed = await page.getByRole('button', { name: /^\+ ciąg$/ }).count();
await page.getByRole('button', { name: /^▼\s*Ciągi i szafki/ }).first().click(); await page.waitForTimeout(400);
const po = await page.getByRole('button', { name: /^\+ ciąg$/ }).count();
const pamieta = await page.evaluate(() => localStorage.getItem('mp-pasek-zwiniety'));
ok('zwinięty pasek chowa ciągi i szafki (i pamięta to)', przed > 0 && po === 0 && pamieta === '1', `przed ${przed}, po ${po}, pamięć ${pamieta}`);
await page.getByRole('button', { name: /Ciągi i szafki/ }).first().click(); await page.waitForTimeout(400);
ok('po drugim kliknięciu pasek wraca', (await page.getByRole('button', { name: /^\+ ciąg$/ }).count()) > 0);

console.log('\nBLEDY:', errors.length ? errors.join('; ') : '(brak)');
await b.close();
