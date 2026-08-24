/* Bez wieńca nie ma czego ustawiać: przełącznik „Wieniec / Blat" i całe
   ustawienia blatu chowają się, a w ich miejsce idzie zdanie, dlaczego ich nie
   ma. Ze złączem z powrotem na „między" wszystko wraca. */
import pw from '/opt/node22/lib/node_modules/playwright/index.js';
const URL = process.env.STD ? 'http://127.0.0.1:5199/standalone-local.html'
  : 'http://127.0.0.1:5205/mebloprojekt-app.html';
const b = await pw.chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const page = await (await b.newContext({ viewport: { width: 1500, height: 1100 } })).newPage();
const errors = []; page.on('pageerror', (e) => errors.push('[pageerror] ' + e.message));
const ok = (l, c, e = '') => console.log((c ? '  OK   ' : '  BLAD ') + l + (e ? ' — ' + e : ''));
const card = (re) => page.locator('section').filter({ has: page.locator('h2', { hasText: re }) }).first();
await page.goto(URL, { waitUntil: 'networkidle' });
await page.evaluate(() => { try { localStorage.clear(); } catch (e) {} });
await page.reload({ waitUntil: 'networkidle' });
await page.waitForTimeout(1800);

const korpus = () => card(/^Korpus$/);
/* „Wieniec" pojawia sie tez w zlaczach korpusu, wiec szukamy nie po podpisie,
   tylko po samym przelaczniku: przycisk „Blat" obok „Wieniec". */
const przelacznik = () => korpus().getByRole('button', { name: 'Blat', exact: true });
const tekst = async () => korpus().innerText();

console.log('== szafka z wieńcem ==');
ok('przełącznik „Wieniec / Blat" jest', await przelacznik().count() === 1,
  String(await przelacznik().count()));
let t = await tekst();
ok('nie ma zdania o braku wieńca', !/Wieńca nie ma/.test(t), t.slice(0, 120));

console.log('\n== oba złącza wieńca na „brak" ==');
await page.evaluate(() => {
  const p = JSON.parse(localStorage.getItem('szafki:projekt'));
  const c = p.items[p.active].cab;
  c.joints = { ...(c.joints || {}), topL: 'none', topR: 'none' };
  localStorage.setItem('szafki:projekt', JSON.stringify(p));
});
await page.reload({ waitUntil: 'networkidle' });
await page.waitForTimeout(2200);
ok('przełącznik znika', await przelacznik().count() === 0, String(await przelacznik().count()));
t = await tekst();
console.log('   ' + (t.split('\n').find((l) => /Wieńca nie ma/.test(l)) || '(brak zdania)').slice(0, 200));
ok('jest zdanie, dlaczego go nie ma', /Wieńca nie ma/.test(t), t.slice(0, 200));
ok('mówi, co przywraca ustawienia', /między|na boku/.test(t.split('\n').find((l) => /Wieńca nie ma/.test(l)) || ''));
/* Ustawienia blatu wisza pod tym samym przelacznikiem, wiec tez maja zniknac. */
const blatPola = korpus().locator('label')
  .filter({ has: page.locator('span', { hasText: /^Wysunięcie w lewo$/ }) });
ok('ustawienia wysunięć blatu też znikają', await blatPola.count() === 0, String(await blatPola.count()));

console.log('\n== wieniec z powrotem ==');
await page.evaluate(() => {
  const p = JSON.parse(localStorage.getItem('szafki:projekt'));
  const c = p.items[p.active].cab;
  c.joints = { ...(c.joints || {}), topL: 'between', topR: 'between' };
  localStorage.setItem('szafki:projekt', JSON.stringify(p));
});
await page.reload({ waitUntil: 'networkidle' });
await page.waitForTimeout(2200);
ok('przełącznik wraca', await przelacznik().count() === 1, String(await przelacznik().count()));
t = await tekst();
ok('zdanie znika', !/Wieńca nie ma/.test(t), t.slice(0, 120));

console.log('\nBLEDY:', errors.length ? errors.join('; ') : '(brak)');
await b.close();
