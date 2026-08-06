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
const uwagi = page.locator('section').filter({ has: page.locator('h2', { hasText: /^Uwagi$/ }) }).first();
const notes = () => page.evaluate(() => {
  const sec = [...document.querySelectorAll('section')].find((s) => /^Uwagi$/.test((s.querySelector('h2') || {}).textContent || ''));
  return sec ? [...sec.querySelectorAll('li')].map((li) => ({
    txt: li.textContent.trim(), btns: [...li.querySelectorAll('button')].map((b) => b.textContent.trim()),
  })) : [];
});
const cutRows = () => card(/^Formatki do zamówienia$/).evaluate((sec) =>
  [...sec.querySelectorAll('tbody tr')].map((tr) => [...tr.querySelectorAll('td')].map((td) => td.textContent.trim()).join(' | ')));
const tyl = async () => (await cutRows()).filter((r) => /^Tył szuflady/.test(r));
await page.goto(URL, { waitUntil: 'networkidle' });

const seed = async (col = {}, cabPatch = {}) => {
  await page.evaluate(({ c, p }) => {
    localStorage.clear();
    const cab = Object.assign({ name: 'T', W: 600, H: 720, D: 500,
      levels: [{ h: null, cols: [Object.assign(
        { kind: 'drawers', w: null,
          drawers: [0, 1].map(() => ({ h: 'auto', front: null, handle: true })) }, c)] }] }, p);
    localStorage.setItem('szafki:projekt', JSON.stringify({ name: 'T', active: 0, prices: {}, items: [{ cab }] }));
  }, { c: col, p: cabPatch });
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(2200);
};

console.log('== tył standardowy ==');
await seed();
let t = await tyl();
t.forEach((r) => console.log('     ' + r));
const std = Number((t[0] || '').split('|')[3].trim());
ok('tył ma standardową wysokość boku', std > 0 && std < 300, String(std));

console.log('\n== checkbox przy szufladzie podnosi tył do wysokości frontu ==');
await seed();
const chk = page.getByText('tył', { exact: true });
ok('checkbox tyłu przy każdej szufladzie', await chk.count() === 2, String(await chk.count()));
await chk.first().click();
await page.waitForTimeout(700);
await chk.last().click();
await page.waitForTimeout(1200);
t = await tyl();
t.forEach((r) => console.log('     ' + r));
const tall = Number((t[0] || '').split('|')[3].trim());
ok('tył urósł ponad standardowy', tall > std, `${std} → ${tall}`);
// tyl idzie za frontem, ale nie wyzej niz przejdzie: dolny do spodu frontu
// wyzej minus 20 luzu (324), gorny do gory swiatla poziomu minus 20 (315)
const wys = t.map((r) => Number(r.split('|')[3].trim())).sort((a2, b2) => b2 - a2);
ok('tył przycięty do tego, co przejdzie (324 i 315)',
  wys.length === 2 && wys[0] === 324 && wys[1] === 315, wys.join(', '));
ok('tył niższy od frontu, bo front ma 356/355', wys.every((w) => w < 355), wys.join(', '));

console.log('\n== własna wysokość tyłu ==');
await seed({ drawers: [0, 1].map(() => ({ h: 'auto', front: null, handle: true,
  tallBack: true, backHeight: 300 })) });
t = await tyl();
ok('tył 300 mm', Number((t[0] || '').split('|')[3].trim()) === 300, (t[0] || '').split('|')[3]);
ok('jedna pozycja dla obu szuflad', t.length === 1, String(t.length));

console.log('\n== tył niższy niż bok skrzynki: błąd z przyciskiem ==');
await seed({ drawers: [0, 1].map(() => ({ h: 'auto', front: null, handle: true,
  tallBack: true, backHeight: 50 })) });
let n = await notes();
const err = n.find((x) => /niższy niż bok skrzynki/.test(x.txt));
console.log('     ' + (err ? err.txt + '  →  [' + err.btns.join(' | ') + ']' : '(brak)'));
ok('błąd o za niskim tyle', !!err, n.map((x) => x.txt.slice(0, 60)).join(' // '));
ok('przycisk podnoszący tył', !!err && err.btns.some((b) => /^Ustaw tył na \d+ mm$/.test(b)), err && err.btns);
await uwagi.getByRole('button', { name: /Ustaw tył na/ }).first().click();
await page.waitForTimeout(1000);
n = await notes();
ok('po kliknięciu błąd znika dla tej szuflady',
  n.filter((x) => /niższy niż bok skrzynki/.test(x.txt)).length === 1,
  String(n.filter((x) => /niższy niż bok skrzynki/.test(x.txt)).length));

console.log('\n== przy domyślnym tyle żadnego ostrzeżenia ==');
await seed({ drawers: [0, 1].map(() => ({ h: 'auto', front: null, handle: true, tallBack: true })) });
let nAuto = await notes();
ok('domyślny tył sam mieści się pod przeszkodą',
  !nAuto.some((x) => /nie przejdzie pod tym/.test(x.txt)),
  (nAuto.find((x) => /nie przejdzie/.test(x.txt)) || {}).txt);

console.log('\n== ręcznie za wysoki tył: ostrzeżenie z przyciskiem ==');
await seed({ drawers: [0, 1].map(() => ({ h: 'auto', front: null, handle: true,
  tallBack: true, backHeight: 400 })) });
n = await notes();
const zaW = n.find((x) => /nie przejdzie pod tym, co jest wyżej/.test(x.txt));
console.log('     ' + (zaW ? zaW.txt + '  →  [' + zaW.btns.join(' | ') + ']' : '(brak)'));
ok('ostrzeżenie o zbyt wysokim tyle', !!zaW, n.map((x) => x.txt.slice(0, 60)).join(' // '));
ok('przycisk przycinający tył', !!zaW && zaW.btns.some((b) => /^Ustaw tył na \d+ mm$/.test(b)), zaW && zaW.btns);
await uwagi.getByRole('button', { name: /Ustaw tył na/ }).first().click();
await page.waitForTimeout(1000);
n = await notes();
ok('po przycięciu jedno ostrzeżenie mniej',
  n.filter((x) => /nie przejdzie pod tym/.test(x.txt)).length === 1,
  String(n.filter((x) => /nie przejdzie pod tym/.test(x.txt)).length));

console.log('\n== szerokość kolumny wraca na auto ==');
await seed({}, { levels: [{ h: null, cols: [
  { kind: 'doors', doors: 1, w: 300 }, { kind: 'doors', doors: 1, w: null }] }] });
const auto = page.getByRole('button', { name: 'auto' }).first();
ok('przycisk auto przy zadanej szerokości', await auto.count() === 1);
await auto.click();
await page.waitForTimeout(1000);
ok('przycisk znika po powrocie na auto', await page.getByRole('button', { name: 'auto' }).count() === 0);

console.log('\n== błąd wypełnienia szerokości ma przycisk naprawy ==');
await seed({}, { levels: [{ h: null, cols: [
  { kind: 'doors', doors: 1, w: 200 }, { kind: 'doors', doors: 1, w: 200 }] }] });
n = await notes();
const fill = n.find((x) => /nie wypełniają szerokości/.test(x.txt));
console.log('     ' + (fill ? fill.txt + '  →  [' + fill.btns.join(' | ') + ']' : '(brak)'));
ok('błąd wypełnienia jest', !!fill, n.map((x) => x.txt.slice(0, 60)).join(' // '));
ok('przycisk rozkładający kolumny', !!fill && fill.btns.includes('Rozłóż kolumny automatycznie'), fill && fill.btns);
await uwagi.getByRole('button', { name: 'Rozłóż kolumny automatycznie' }).first().click();
await page.waitForTimeout(1000);
n = await notes();
ok('po kliknięciu kolumny wypełniają szerokość',
  !n.some((x) => /nie wypełniają szerokości|szerokość zero/.test(x.txt)),
  (n.find((x) => /szerok/.test(x.txt)) || {}).txt);

console.log('\nBLEDY:', errors.length ? errors.join('\n') : '(brak)');
await browser.close();
