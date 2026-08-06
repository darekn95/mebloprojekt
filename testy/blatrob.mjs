import pw from '/opt/node22/lib/node_modules/playwright/index.js';
const { chromium } = pw;
const URL = process.env.STD ? 'http://127.0.0.1:5199/standalone-local.html'
  : 'http://127.0.0.1:5205/mebloprojekt-app.html';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const page = await (await browser.newContext({ viewport: { width: 1500, height: 1200 } })).newPage();
const errors = [];
page.on('pageerror', (e) => errors.push('[pageerror] ' + e.message));
page.on('console', (m) => { if (m.type() === 'error' && !/favicon|404/.test(m.text())) errors.push('[console] ' + m.text()); });
const ok = (l, c, e = '') => console.log((c ? '  OK   ' : '  BLAD ') + l + (e ? ' — ' + e : ''));
const card = (re) => page.locator('section').filter({ has: page.locator('h2', { hasText: re }) }).first();
const rowsOf = (re) => card(re).evaluate((sec) =>
  [...sec.querySelectorAll('tbody tr')].map((tr) => [...tr.querySelectorAll('td')].map((td) => td.textContent.trim()).join(' | ')));
const notes = () => page.evaluate(() => {
  const sec = [...document.querySelectorAll('section')].find((s) => /^Uwagi$/.test((s.querySelector('h2') || {}).textContent || ''));
  return sec ? [...sec.querySelectorAll('li')].map((li) => li.textContent.trim()) : [];
});
const pick = async (label) => { await page.getByText(label, { exact: true }).first().click(); await page.waitForTimeout(800); };
await page.goto(URL, { waitUntil: 'networkidle' });

const BLAT = (material) => ({ mode: 'blat', material, widthMode: 'outside',
  overL: 20, overR: 20, overFront: 30, overBack: 0 });
const JOINTS = { topL: 'over', topR: 'over', botL: 'between', botR: 'between' };
// wCiagu=false daje szafki wolnostojace — wtedy blat zostaje przy szafce,
// a nie przechodzi na ciag
const seed = async (widths, material, run = {}, wCiagu = true) => {
  await page.evaluate(({ ws, m, r, wc }) => {
    localStorage.clear();
    localStorage.setItem('szafki:projekt', JSON.stringify({
      name: 'T', active: 0, prices: {},
      runs: wc ? [Object.assign({ id: 'c1', name: 'Kuchnia', wallW: null, gap: 0, mountY: 0,
        H: 720, D: 560, plinth: { on: true, height: 100, mode: 'under', setback: 0 } }, r)] : [],
      items: ws.map((w, i) => ({
        cab: { name: 'S' + (i + 1), W: w, H: 720, D: 560,
          plinth: { on: true, height: 100, mode: 'under', setback: 0 },
          top: { mode: 'blat', material: m, widthMode: 'outside', overL: 20, overR: 20, overFront: 30, overBack: 0 },
          joints: { topL: 'over', topR: 'over', botL: 'between', botR: 'between' },
          levels: [{ h: null, cols: [{ kind: 'doors', doors: 2, w: null }] }] },
        mat: undefined, runId: wc ? 'c1' : null, offset: 0 })),
    }));
  }, { ws: widths, m: material, r: run, wc: wCiagu });
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(2400);
};

console.log('== wybór materiału blatu w karcie szafki ==');
await seed([800], 'board', {}, false);
const blatCard = card(/^Korpus$/);
const seg = await page.evaluate(() => [...document.querySelectorAll('button')]
  .filter((b) => /^(Z płyty|Blat roboczy)$/.test(b.textContent.trim()))
  .map((b) => b.textContent.trim() + (b.className.includes('bg-teal-700') ? '*' : '')));
console.log('     ' + seg.join(', '));
ok('przełącznik materiału blatu jest', seg.length === 2, JSON.stringify(seg));
ok('domyślnie z płyty', seg.includes('Z płyty*'), JSON.stringify(seg));

console.log('\n== blat z płyty: idzie do rozkroju, grubość płyty ==');
let c = await rowsOf(/^Formatki do zamówienia$/);
let b = c.find((r) => /^Blat/.test(r));
console.log('     ' + b);
ok('formatka blatu z płyty', /Płyta/.test(b), b);
console.log('\n== blat roboczy: własny materiał i grubość ==');
await seed([800], 'worktop', {}, false);
c = await rowsOf(/^Formatki do zamówienia$/);
b = c.find((r) => /^Blat/.test(r));
console.log('     ' + b);
ok('formatka blatu z blatu roboczego', /Blat roboczy/.test(b), b);
const st = await page.evaluate(() => JSON.parse(localStorage.getItem('szafki:projekt')));
ok('materiał zapisany przy szafce', st.items[0].cab.top.material === 'worktop',
  JSON.stringify(st.items[0].cab.top));

console.log('\n== blat idzie do rozkroju na WŁASNYM arkuszu 4100 x 600 ==');
await page.getByRole('button', { name: /Rozkrój/i }).first().click();
await page.waitForTimeout(3500);
const plan = await page.evaluate(() => {
  const sec = [...document.querySelectorAll('section')]
    .find((s) => /Rozkrój/i.test((s.querySelector('h2') || {}).textContent || ''));
  if (!sec) return { txt: '(brak)', arkusze: [] };
  return {
    txt: sec.textContent,
    // kazdy arkusz rozkroju to svg z wlasnym viewBox — z niego czytamy format
    arkusze: [...sec.querySelectorAll('svg')].map((v) => v.getAttribute('viewBox')),
  };
});
console.log('     arkusze: ' + JSON.stringify(plan.arkusze));
ok('rozkrój zawiera blat', /Blat/.test(plan.txt), plan.txt.slice(0, 160));
// arkusz blatu ma proporcje 4100 x 600, plyta 2761 x 2061
const blatArk = plan.arkusze.filter((v) => {
  const [, , w, h] = (v || '').split(' ').map(Number);
  return w > h * 2.5;
});
ok('jest arkusz w proporcji blatu (długi i wąski)', blatArk.length >= 1, JSON.stringify(plan.arkusze));
ok('bez błędów przy rozkroju', errors.length === 0, errors.join('; '));
await page.getByRole('button', { name: /Zamknij/i }).first().click();
await page.waitForTimeout(600);

console.log('\n== kilka blatów widać jako kilka arkuszy ==');
// 3 szafki po 1600 = 4800 + 40 = 4840 -> dwa kawalki, kazdy na swoim arkuszu
await seed([1600, 1600, 1600], 'worktop', {}, false);
await page.getByRole('button', { name: /Rozkrój/i }).first().click();
await page.waitForTimeout(3500);
const ile = await page.evaluate(() => {
  const sec = [...document.querySelectorAll('section')]
    .find((s) => /Rozkrój/i.test((s.querySelector('h2') || {}).textContent || ''));
  return sec ? [...sec.querySelectorAll('svg')].map((v) => v.getAttribute('viewBox')).length : 0;
});
console.log('     arkuszy w rozkroju: ' + ile);
ok('rozkrój pokazuje więcej niż jeden arkusz', ile >= 2, String(ile));
await page.getByRole('button', { name: /Zamknij/i }).first().click();
await page.waitForTimeout(600);

console.log('\n== za płytki blat: błąd z przyciskiem zmiany na 1200 ==');
await page.evaluate(() => {
  const d = JSON.parse(localStorage.getItem('szafki:projekt'));
  d.items = [d.items[0]];
  d.items[0].cab.D = 900;   // glebokosc korpusu 900 -> blat glebszy niz arkusz 600
  localStorage.setItem('szafki:projekt', JSON.stringify(d));
});
await page.reload({ waitUntil: 'networkidle' });
await page.waitForTimeout(2400);
let nn = await page.evaluate(() => {
  const sec = [...document.querySelectorAll('section')].find((s) => /^Uwagi$/.test((s.querySelector('h2') || {}).textContent || ''));
  return sec ? [...sec.querySelectorAll('li')].map((li) => ({
    txt: li.textContent.trim(), btns: [...li.querySelectorAll('button')].map((b) => b.textContent.trim()) })) : [];
});
const zaPlytki = nn.find((x) => /głębszy niż arkusz blatu/.test(x.txt));
console.log('     ' + (zaPlytki ? zaPlytki.txt + '  →  [' + zaPlytki.btns.join(' | ') + ']' : '(brak)'));
ok('błąd o zbyt płytkim blacie', !!zaPlytki, nn.map((x) => x.txt.slice(0, 50)).join(' // '));
ok('przycisk zmiany na blat 1200', !!zaPlytki && zaPlytki.btns.some((b) => /^Zmień na blat 1200 mm$/.test(b)),
  zaPlytki && zaPlytki.btns);
await page.getByRole('button', { name: 'Zmień na blat 1200 mm' }).first().click();
await page.waitForTimeout(1200);
nn = await page.evaluate(() => {
  const sec = [...document.querySelectorAll('section')].find((s) => /^Uwagi$/.test((s.querySelector('h2') || {}).textContent || ''));
  return sec ? [...sec.querySelectorAll('li')].map((li) => li.textContent.trim()) : [];
});
ok('po zmianie błąd znika', !nn.some((x) => /głębszy niż arkusz blatu/.test(x)),
  nn.map((x) => x.slice(0, 50)).join(' // '));
const stW = await page.evaluate(() => JSON.parse(localStorage.getItem('szafki:projekt')));
ok('arkusz zapisany w materiałach', stW.items[0].mat.worktop.depth === 1200,
  JSON.stringify((stW.items[0].mat || {}).worktop));

console.log('\n== ceny: 470 zł za blat 600, 780 zł za blat 1200 ==');
await seed([800], 'worktop', {}, false);
/* Wycena arkuszy bierze sie z policzonego rozkroju, a zamkniecie okna rozkroju
   go kasuje — wiec czytamy wycene przy otwartym rozkroju. Karta wyceny jest
   zwinieta, wiec czytamy jej zawartosc wprost z DOM. */
await page.getByRole('button', { name: /Rozkrój/i }).first().click();
await page.waitForTimeout(3500);
// zwinieta karta w ogole nie renderuje tabeli — najpierw ja rozwijamy
const rozwinWycene = async () => {
  await page.evaluate(() => {
    const sec = [...document.querySelectorAll('section')].find((s) => /Wycena/.test((s.querySelector('h2') || {}).textContent || ''));
    if (sec && !sec.querySelector('tbody')) sec.querySelector('header button').click();
  });
  await page.waitForTimeout(900);
};
await rozwinWycene();
const cena600 = await page.evaluate(() => {
  const sec = [...document.querySelectorAll('section')].find((s) => /Wycena|Kosztorys/i.test((s.querySelector('h2') || {}).textContent || ''));
  if (!sec) return '(brak karty wyceny)';
  const tr = [...sec.querySelectorAll('tbody tr')].find((t) => /Blat roboczy/.test(t.textContent));
  return tr ? tr.textContent.replace(/\s+/g, ' ').trim() : '(brak pozycji blatu)';
});
console.log('     ' + cena600);
ok('blat 600 po 470 zł', /470/.test(cena600), cena600);
// ten sam blat w wersji 1200 kosztuje 780
await page.evaluate(() => {
  const d = JSON.parse(localStorage.getItem('szafki:projekt'));
  d.items[0].mat = Object.assign({}, d.items[0].mat, {
    worktop: { name: 'Blat roboczy', thickness: 38, color: '#8d7b68', depth: 1200 } });
  localStorage.setItem('szafki:projekt', JSON.stringify(d));
});
await page.reload({ waitUntil: 'networkidle' });
await page.waitForTimeout(2400);
await page.getByRole('button', { name: /Rozkrój/i }).first().click();
await page.waitForTimeout(3500);
await rozwinWycene();
const cena1200 = await page.evaluate(() => {
  const sec = [...document.querySelectorAll('section')].find((s) => /Wycena|Kosztorys/i.test((s.querySelector('h2') || {}).textContent || ''));
  const tr = sec && [...sec.querySelectorAll('tbody tr')].find((t) => /Blat roboczy/.test(t.textContent));
  return tr ? tr.textContent.replace(/\s+/g, ' ').trim() : '(brak pozycji blatu)';
});
console.log('     ' + cena1200);
ok('blat 1200 po 780 zł', /780/.test(cena1200), cena1200);

console.log('\n== w ciągu: blat roboczy tnie się co 4100, nie co 2761 ==');
// 4 x 800 = 3200 + 40 = 3240 — miesci sie w odcinku 4100, ale nie w formatce 2761
await seed([800, 800, 800, 800], 'worktop');
await pick('Ciąg');
let n = await notes();
console.log('     ' + (n.find((x) => /Blat ciągu/.test(x)) || '(brak uwagi — mieści się)'));
ok('blat 3240 mm mieści się w jednym odcinku', !n.some((x) => /Blat ciągu.*nie zmieści/.test(x)),
  n.filter((x) => /Blat/.test(x)).join(' // '));
let p = await rowsOf(/Formatki całego projektu/);
let bc = p.filter((r) => /^Blat ciągu/.test(r));
console.log('     ' + bc.join('\n     '));
ok('jedna formatka blatu ciągu', bc.length === 1, JSON.stringify(bc));
ok('długość 3240 mm', /\|\s*3240\s*\|/.test(bc[0]), bc[0]);
ok('z materiału blatu roboczego', /Blat roboczy/.test(bc[0]), bc[0]);

console.log('\n== ten sam ciąg z płyty musi się podzielić ==');
await seed([800, 800, 800, 800], 'board');
await pick('Ciąg');
n = await notes();
const dziel = n.find((x) => /Blat ciągu/.test(x));
console.log('     ' + (dziel || '(brak)'));
ok('blat z płyty dzieli się', !!dziel && /nie zmieści się/.test(dziel), dziel);
ok('mowa o arkuszu, nie o odcinku', !!dziel && /arkuszu/.test(dziel), dziel);
p = await rowsOf(/Formatki całego projektu/);
bc = p.filter((r) => /^Blat ciągu/.test(r));
ok('dwie formatki', bc.length === 2, JSON.stringify(bc));

console.log('\n== blat roboczy dłuższy niż odcinek handlowy ==');
// 6 x 800 = 4800 + 40 = 4840 > 4100
await seed([800, 800, 800, 800, 800, 800], 'worktop');
await pick('Ciąg');
n = await notes();
const dl = n.find((x) => /Blat ciągu/.test(x));
console.log('     ' + (dl || '(brak)'));
ok('ostrzeżenie o podziale', !!dl, n.filter((x) => /Blat/.test(x)).join(' // '));
ok('mówi o odcinku 4100', !!dl && /4100/.test(dl), dl);
ok('tnie na styku korpusów', !!dl && /styku korpusów/.test(dl), dl);
p = await rowsOf(/Formatki całego projektu/);
bc = p.filter((r) => /^Blat ciągu/.test(r));
console.log('     ' + bc.join('\n     '));
ok('podzielony na dwie części', bc.length === 2, JSON.stringify(bc));
ok('żaden kawałek nie przekracza 4100',
  bc.every((r) => Number((r.split('|')[3] || '0').trim()) <= 4100), JSON.stringify(bc));

console.log('\n== grubość blatu roboczego w geometrii ==');
await seed([800], 'worktop', {}, false);
const gr = await page.evaluate(() => {
  const sec = [...document.querySelectorAll('section')].find((s) => /^Korpus$/.test((s.querySelector('h2') || {}).textContent || ''));
  const lab = [...sec.querySelectorAll('label')].find((l) => /Blat z czego/.test(l.textContent || ''));
  return lab ? lab.textContent : '';
});
console.log('     ' + gr.replace(/\s+/g, ' ').trim().slice(0, 160));
ok('podpowiedź mówi o grubości blatu', /38 mm/.test(gr), gr.slice(0, 120));
ok('podpowiedź podaje arkusz blatu', /4100 × 600 mm/.test(gr), gr.slice(0, 180));
ok('podpowiedź mówi, że idzie osobno od płyty', /osobno od płyty/.test(gr), gr.slice(0, 180));

console.log('\nBLEDY:', errors.length ? errors.join('\n') : '(brak)');
await browser.close();
