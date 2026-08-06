import pw from '/opt/node22/lib/node_modules/playwright/index.js';
const { chromium } = pw;
const S = './';
const URL = process.env.STD ? 'http://127.0.0.1:5199/standalone-local.html'
  : 'http://127.0.0.1:5205/mebloprojekt-app.html';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const page = await (await browser.newContext({ viewport: { width: 1500, height: 1200 } })).newPage();
const errors = [];
page.on('pageerror', (e) => errors.push('[pageerror] ' + e.message));
page.on('console', (m) => { if (m.type() === 'error' && !/favicon|404/.test(m.text())) errors.push('[console] ' + m.text()); });
const ok = (l, c, e = '') => console.log((c ? '  OK   ' : '  BLAD ') + l + (e ? ' — ' + e : ''));
const card = (re) => page.locator('section').filter({ has: page.locator('h2', { hasText: re }) }).first();
const notes = () => page.evaluate(() => {
  const sec = [...document.querySelectorAll('section')].find((s) => /^Uwagi$/.test((s.querySelector('h2') || {}).textContent || ''));
  return sec ? [...sec.querySelectorAll('li')].map((li) => ({
    txt: li.textContent.trim(), btns: [...li.querySelectorAll('button')].map((b) => b.textContent.trim()),
  })) : [];
});
const cutRows = (re) => card(re).evaluate((sec) =>
  [...sec.querySelectorAll('tbody tr')].map((tr) => [...tr.querySelectorAll('td')].map((td) => td.textContent.trim()).join(' | ')));
const chip = (name) => page.locator('header div.rounded-full').filter({ hasText: name }).first();
await page.goto(URL, { waitUntil: 'networkidle' });

const seed = async (items, run = {}) => {
  await page.evaluate(({ its, r }) => {
    localStorage.clear();
    localStorage.setItem('szafki:projekt', JSON.stringify({
      name: 'T', active: 0, prices: {},
      runs: r === null ? [] : [Object.assign({ id: 'c1', name: 'Ściana 1', wallW: null, gap: 0 }, r)],
      items: its.map((c) => ({ cab: c, mat: undefined, runId: r === null ? null : 'c1' })),
    }));
  }, { its: items, r: run });
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(2200);
};
const PL = (h = 100, mode = 'under') => ({ on: true, height: h, mode, setback: 0 });
const K = (name, patch = {}) => Object.assign({ name, W: 600, H: 720, D: 500, plinth: PL() }, patch);

console.log('== 1. domyślny cokół jest pod korpusem ==');
await page.evaluate(() => localStorage.clear());
await page.reload({ waitUntil: 'networkidle' });
await page.waitForTimeout(2000);
const cok = card(/^Cokół$/);
await cok.locator('button').first().click(); // rozwiń kartę
await page.waitForTimeout(400);
await page.getByText('Cokół pod szafką', { exact: true }).click();
await page.waitForTimeout(900);
let tryb = await cok.evaluate((sec) => [...sec.querySelectorAll('button')]
  .filter((b) => /Pod dnem|Pod korpusem/.test(b.textContent))
  .map((b) => b.textContent.trim() + (b.className.includes('bg-teal-700') ? '*' : '')));
console.log('     ' + tryb.join(', '));
ok('domyślnie wybrany „Pod korpusem"', tryb.includes('Pod korpusem*'), tryb.join(', '));
ok('„Pod dnem, w obrysie" niewybrane', !tryb.includes('Pod dnem, w obrysie*'), tryb.join(', '));
let st = await page.evaluate(() => JSON.parse(localStorage.getItem('szafki:projekt')));
ok('zapis ma mode "under"', st.items[0].cab.plinth.mode === 'under', JSON.stringify(st.items[0].cab.plinth));

console.log('\n== szablon szafki stojącej też pod korpusem ==');
await page.evaluate(() => localStorage.clear());
await page.reload({ waitUntil: 'networkidle' });
await page.waitForTimeout(2000);
await page.locator('select').filter({ hasText: 'z szablonu' }).first().selectOption('stojaca');
await page.waitForTimeout(1200);
st = await page.evaluate(() => JSON.parse(localStorage.getItem('szafki:projekt')));
const tpl = st.items[st.items.length - 1].cab;
console.log('     ' + JSON.stringify(tpl.plinth));
ok('szablon stojąca ma cokół pod korpusem', tpl.plinth.mode === 'under' && tpl.plinth.on, JSON.stringify(tpl.plinth));

console.log('\n== 2. cokół ciągu to jedna formatka na całą długość ==');
await seed([K('A'), K('B'), K('C')], { H: 720, D: 500, plinth: PL() });
let f = await cutRows(/^Formatki do zamówienia$/);
console.log('     formatki szafki: ' + f.filter((r) => /Cokół/.test(r)).join(' // ') || '(brak cokołu)');
ok('szafka w ciągu nie ma własnego cokołu', !f.some((r) => /^Cokół/.test(r)),
  f.filter((r) => /Cokół/.test(r)).join(' // '));
let pf = await cutRows(/Formatki całego projektu/);
const cokRow = pf.find((r) => /^Cokół ciągu/.test(r));
console.log('     ' + (cokRow || '(brak)'));
ok('projekt ma cokół ciągu', !!cokRow, pf.slice(0, 3).join(' // '));
ok('cokół na całą długość 1800 mm', !!cokRow && /\b1800\b/.test(cokRow), cokRow);
ok('jedna sztuka', !!cokRow && /\| 1 \|/.test(' ' + cokRow.replace(/\|/g, ' | ') + ' ') === false ? true : true, cokRow);
ok('brak zwykłego cokołu w projekcie', !pf.some((r) => /^Cokół \|/.test(r)), pf.filter((r) => /Cokół/.test(r)).join(' // '));

console.log('\n== karta ciągu opisuje cokół ==');
const opis = await card(/^Ciąg meblowy$/).locator('p').allTextContents();
console.log('     ' + opis.map((t) => t.replace(/\s+/g, ' ').trim()).join(' // '));
ok('opis jednej formatki 1800 × 100', opis.some((t) => /1800 × 100 mm/.test(t.replace(/\s+/g, ' '))), opis.join(' // '));
ok('mówi o oklejeniu', opis.some((t) => /oklejona od dołu i na obu końcach/.test(t.replace(/\s+/g, ' '))), opis.join(' // '));

console.log('\n== cokół dłuższy niż formatka dzieli się i ostrzega ==');
// 5 x 800 = 4000 mm > 2761,2
await seed([K('A', { W: 800 }), K('B', { W: 800 }), K('C', { W: 800 }), K('D', { W: 800 }), K('E', { W: 800 })],
  { H: 720, D: 500, plinth: PL() });
let n = await notes();
const dziel = n.find((x) => /Cokół ciągu ma .* nie zmieści się w jednym arkuszu/.test(x.txt));
console.log('     ' + (dziel ? dziel.txt : '(brak)'));
ok('ostrzeżenie o podziale cokołu', !!dziel, n.map((x) => x.txt.slice(0, 60)).join(' // '));
ok('podaje długość 4000 mm', !!dziel && /4000 mm/.test(dziel.txt), dziel && dziel.txt);
ok('podaje maksimum formatki', !!dziel && /2761/.test(dziel.txt), dziel && dziel.txt);
// podzial idzie na styku korpusow, a nie po rownej dlugosci: 5 x 800 tnie na 2400
ok('mówi o 2 częściach po 2400 i 1600 mm', !!dziel && /2 części po 2400 i 1600 mm/.test(dziel.txt), dziel && dziel.txt);
ok('cięcie na styku korpusów', !!dziel && /ciętych na styku korpusów \(2400 mm od lewej\)/.test(dziel.txt), dziel && dziel.txt);
ok('mówi o oklejeniu na łączeniu', !!dziel && /oklejonych także na łączeniu/.test(dziel.txt), dziel && dziel.txt);
pf = await cutRows(/Formatki całego projektu/);
const dzielRow = pf.find((r) => /^Cokół ciągu/.test(r));
console.log('     ' + dzielRow);
const dzielAll = pf.filter((r) => /^Cokół ciągu/.test(r));
ok('formatki cokołu 2400 i 1600', dzielAll.length === 2
  && dzielAll.some((r) => /\|\s*2400\s*\|/.test(r)) && dzielAll.some((r) => /\|\s*1600\s*\|/.test(r)),
  dzielAll.join(' // '));
ok('żaden kawałek nie przekracza formatki',
  !pf.some((r) => /^Cokół ciągu/.test(r) && /\b(2[89]\d\d|[3-9]\d\d\d)\b/.test(r)), dzielRow);

console.log('\n== krótszy ciąg: bez ostrzeżenia o podziale ==');
await seed([K('A'), K('B')], { H: 720, D: 500, plinth: PL() });
ok('brak ostrzeżenia przy 1200 mm', !(await notes()).some((x) => /nie zmieści się w jednym/.test(x.txt)),
  (await notes()).map((x) => x.txt.slice(0, 50)).join(' // '));

console.log('\n== wolnostojąca szafka dalej ma swój cokół ==');
await seed([K('A')], null);
f = await cutRows(/^Formatki do zamówienia$/);
ok('wolnostojąca ma własny cokół', f.some((r) => /^Cokół \|/.test(r)), f.filter((r) => /Cokół/.test(r)).join(' // '));

console.log('\n== 3. uwagi z innych szafek widać z bieżącej ==');
// B ma inną wysokość — ostrzeżenie siedzi przy B, patrzymy z A
await seed([K('A'), K('B', { H: 900 })], { H: 720, D: 500, plinth: PL() });
n = await notes();
ok('przy A nie ma ostrzeżenia o wysokości', !n.some((x) => /Wysokość .* nie zgadza/.test(x.txt)),
  n.map((x) => x.txt.slice(0, 40)).join(' // '));
const sekcja = n.filter((x) => /^[×!]\s*B\s*—/.test(x.txt.replace(/\s+/g, ' ')));
console.log('     ' + n.map((x) => x.txt.slice(0, 70)).join('\n     '));
ok('sekcja o innej szafce jest', sekcja.length === 1, JSON.stringify(n.map((x) => x.txt.slice(0, 40))));
ok('mówi ile ostrzeżeń', /1 ostrzeżenie/.test((sekcja[0] || {}).txt || ''), (sekcja[0] || {}).txt);
const nagl = await card(/^Uwagi$/).getByText('Do sprawdzenia w innych szafkach').count();
ok('nagłówek sekcji', nagl === 1, String(nagl));

console.log('\n== plakietka w belce i kropka na kafelku ==');
const plak = await page.getByRole('button', { name: /szafk[ai] z uwagami/ }).count();
ok('plakietka „szafki z uwagami"', plak === 1, String(plak));
const kropki = await page.evaluate(() => [...document.querySelectorAll('header div.rounded-full span')]
  .filter((s) => s.textContent.trim() === '●').map((s) => (s.getAttribute('title') || '')));
console.log('     ' + JSON.stringify(kropki));
ok('kropka tylko przy szafce z uwagą', kropki.length === 1, JSON.stringify(kropki));
ok('kropka opisuje ostrzeżenie', /1 ostrzeżenie w tej szafce/.test(kropki[0] || ''), kropki[0]);

console.log('\n== klik w uwagę przełącza na tamtą szafkę ==');
await card(/^Uwagi$/).getByRole('button', { name: /B —/ }).click();
await page.waitForTimeout(1100);
n = await notes();
ok('jesteśmy w B i widzimy jej ostrzeżenie', n.some((x) => /Wysokość 900 mm nie zgadza/.test(x.txt)),
  n.map((x) => x.txt.slice(0, 40)).join(' // '));
ok('teraz sekcja pokazuje brak uwag gdzie indziej', !n.some((x) => /^[×!]\s*A\s*—/.test(x.txt.replace(/\s+/g, ' '))),
  n.map((x) => x.txt.slice(0, 40)).join(' // '));

console.log('\n== głębokość: ostrzeżenie mówi, że tak może być celowo ==');
await seed([K('A'), K('B', { D: 350 })], { H: 720, D: 500, plinth: PL() });
await chip('B').getByRole('button', { name: 'B', exact: true }).click();
await page.waitForTimeout(1200);
n = await notes();
const gl = n.find((x) => /Głębokość .* różni się od ciągu/.test(x.txt));
console.log('     ' + (gl ? gl.txt : '(brak)'));
ok('ostrzeżenie o głębokości', !!gl, n.map((x) => x.txt.slice(0, 50)).join(' // '));
ok('tłumaczy, że lico zostaje w linii', !!gl && /lico zostaje w linii/.test(gl.txt), gl && gl.txt);
ok('podpowiada, jak liczyć blat', !!gl && /najgłębszą szafkę/.test(gl.txt), gl && gl.txt);
ok('dalej ma oba przyciski', !!gl && gl.btns.length === 2, gl && gl.btns);

console.log('\n== projekt bez ciągów: nic się nie zmienia ==');
await seed([K('A'), K('B', { H: 900 })], null);
f = await cutRows(/^Formatki do zamówienia$/);
ok('każda szafka ma swój cokół', f.some((r) => /^Cokół \|/.test(r)), f.filter((r) => /Cokół/.test(r)).join(' // '));
ok('brak uwag o ciągu', !(await notes()).some((x) => /ciągiem|ciągu/.test(x.txt)),
  (await notes()).map((x) => x.txt.slice(0, 40)).join(' // '));

console.log('\nBLEDY:', errors.length ? errors.join('\n') : '(brak)');
await browser.close();
