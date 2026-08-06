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
const cs = () => card(/^Ciąg meblowy$/);
const uwagi = () => card(/^Uwagi$/);
const notes = () => page.evaluate(() => {
  const sec = [...document.querySelectorAll('section')].find((s) => /^Uwagi$/.test((s.querySelector('h2') || {}).textContent || ''));
  return sec ? [...sec.querySelectorAll('li')].map((li) => ({
    txt: li.textContent.trim(), btns: [...li.querySelectorAll('button')].map((b) => b.textContent.trim()),
  })) : [];
});
const cutRows = (re) => card(re).evaluate((sec) =>
  [...sec.querySelectorAll('tbody tr')].map((tr) => [...tr.querySelectorAll('td')].map((td) => td.textContent.trim()).join(' | ')));
const stan = () => page.evaluate(() => JSON.parse(localStorage.getItem('szafki:projekt') || '{}'));
// kafelki podzialu: przyciski z sama liczba w karcie ciagu
const jointBtns = () => cs().evaluate((sec) => {
  const f = [...sec.querySelectorAll('div')].find((l) => /^Podział cokołu/.test((l.textContent || '').trim()));
  return f ? [...f.querySelectorAll('button')].map((b) => ({
    t: b.textContent.trim(), on: b.className.includes('bg-teal-700'),
  })) : [];
});
await page.goto(URL, { waitUntil: 'networkidle' });

const seed = async (widths, run = {}) => {
  await page.evaluate(({ ws, r }) => {
    localStorage.clear();
    localStorage.setItem('szafki:projekt', JSON.stringify({
      name: 'T', active: 0, prices: {},
      runs: [Object.assign({ id: 'c1', name: 'Ściana 1', wallW: null, gap: 0,
        H: 720, D: 500, plinth: { on: true, height: 100, mode: 'under', setback: 0 } }, r)],
      items: ws.map((w, i) => ({
        cab: { name: 'S' + (i + 1), W: w, H: 720, D: 500,
          plinth: { on: true, height: 100, mode: 'under', setback: 0 } },
        mat: undefined, runId: 'c1' })),
    }));
  }, { ws: widths, r: run });
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(2200);
};
const cokRow = async () => (await cutRows(/Formatki całego projektu/)).filter((r) => /^Cokół ciągu/.test(r));

console.log('== krótki ciąg: bez podziału, ale styki do wyboru są ==');
await seed([600, 600, 600]);
let j = await jointBtns();
console.log('     ' + JSON.stringify(j));
ok('dwa styki korpusów (600, 1200)', j.length === 2 && j[0].t === '600' && j[1].t === '1200', JSON.stringify(j));
ok('żaden nie jest zaznaczony', j.every((x) => !x.on), JSON.stringify(j));
ok('jedna formatka 1800', (await cokRow()).length === 1 && /1800/.test((await cokRow())[0]), (await cokRow()).join(' // '));

console.log('\n== długi ciąg: automat tnie na styku, nie po równo ==');
// 5 x 800 = 4000; styki co 800; najdalszy <= 2761,2 to 2400
await seed([800, 800, 800, 800, 800]);
let n = await notes();
let msg = n.find((x) => /Cokół ciągu/.test(x.txt));
console.log('     ' + (msg ? msg.txt : '(brak)'));
ok('ostrzeżenie o podziale', !!msg, n.map((x) => x.txt.slice(0, 50)).join(' // '));
ok('cięcie na styku 2400, nie po równo', !!msg && /2400 i 1600 mm/.test(msg.txt), msg && msg.txt);
ok('nie ma już równego 2000 i 2000', !msg || !/2000 i 2000/.test(msg.txt), msg && msg.txt);
ok('mówi, gdzie jest szew', !!msg && /2400 mm od lewej/.test(msg.txt), msg && msg.txt);
ok('mówi o oklejeniu łączenia', !!msg && /oklejonych także na łączeniu/.test(msg.txt), msg && msg.txt);
let rows = await cokRow();
console.log('     ' + rows.join('\n     '));
ok('dwie różne formatki 2400 i 1600', rows.length === 2
  && rows.some((r) => /\|\s*2400\s*\|/.test(r)) && rows.some((r) => /\|\s*1600\s*\|/.test(r)), rows.join(' // '));
j = await jointBtns();
console.log('     ' + JSON.stringify(j));
ok('zaznaczony dokładnie styk 2400', j.filter((x) => x.on).length === 1 && j.find((x) => x.on).t === '2400', JSON.stringify(j));

console.log('\n== jedno kliknięcie to jedno przełączenie ==');
const hits = await cs().evaluate((sec) => {
  const f = [...sec.querySelectorAll('div')].find((l) => /^Podział cokołu/.test((l.textContent || '').trim()));
  window.__hits = [];
  [...f.querySelectorAll('button')].forEach((b) =>
    b.addEventListener('click', () => window.__hits.push(b.textContent.trim()), true));
  return true;
});
await cs().getByRole('button', { name: '800', exact: true }).click();
await page.waitForTimeout(500);
const fired = await page.evaluate(() => window.__hits);
console.log('     odpalone kliki: ' + JSON.stringify(fired));
ok('pierwszy kafelek odpala się raz, nie dwa', fired.length === 1 && fired[0] === '800', JSON.stringify(fired));
j = await jointBtns();
ok('i faktycznie się zaznaczył', j.find((x) => x.t === '800').on, JSON.stringify(j));
await cs().getByRole('button', { name: '800', exact: true }).click();
await page.waitForTimeout(700);

console.log('\n== podział da się przestawić ręcznie ==');
// przelaczamy na styk 1600 + 3200 zamiast 2400
await cs().getByRole('button', { name: '2400', exact: true }).click();
await page.waitForTimeout(900);
await cs().getByRole('button', { name: '1600', exact: true }).click();
await page.waitForTimeout(900);
await cs().getByRole('button', { name: '3200', exact: true }).click();
await page.waitForTimeout(1000);
j = await jointBtns();
console.log('     ' + JSON.stringify(j.filter((x) => x.on)));
ok('zaznaczone 1600 i 3200', j.filter((x) => x.on).map((x) => x.t).join() === '1600,3200', JSON.stringify(j));
rows = await cokRow();
console.log('     ' + rows.join('\n     '));
// ciecia na 1600 i 3200 daja 1600 + 1600 + 800, wiec dwie pozycje w zamowieniu
ok('kawałki 2 x 1600 i 1 x 800', rows.length === 2
  && rows.some((r) => /\|\s*1600\s*\|\s*100\s*\|\s*2\s*\|/.test(r))
  && rows.some((r) => /\|\s*800\s*\|\s*100\s*\|\s*1\s*\|/.test(r)), rows.join(' // '));
n = await notes();
msg = n.find((x) => /Cokół ciągu/.test(x.txt));
console.log('     ' + (msg ? msg.txt : '(brak)'));
ok('opis mówi o 3 częściach', !!msg && /3 części/.test(msg.txt), msg && msg.txt);
ok('długości wyliczone po polsku', !!msg && /1600, 1600 i 800 mm/.test(msg.txt), msg && msg.txt);
ok('ręczny podział nie kłamie o formatce', !!msg && !/nie zmieści się/.test(msg.txt), msg && msg.txt);
let st = await stan();
ok('wybór zapisany w ciągu', JSON.stringify(st.runs[0].plinthCuts) === '[1600,3200]', JSON.stringify(st.runs[0].plinthCuts));

console.log('\n== przycisk auto wraca do podziału samoczynnego ==');
ok('przycisk auto jest przy ręcznym podziale', await cs().getByRole('button', { name: 'auto', exact: true }).count() === 1);
await cs().getByRole('button', { name: 'auto', exact: true }).click();
await page.waitForTimeout(1000);
j = await jointBtns();
ok('wróciło jedno cięcie na 2400', j.filter((x) => x.on).map((x) => x.t).join() === '2400', JSON.stringify(j));
ok('przycisk auto znika', await cs().getByRole('button', { name: 'auto', exact: true }).count() === 0);
st = await stan();
ok('w zapisie znowu null', st.runs[0].plinthCuts === null, JSON.stringify(st.runs[0].plinthCuts));

console.log('\n== za mało cięć: błąd z przyciskiem naprawy ==');
await seed([800, 800, 800, 800, 800], { plinthCuts: [3200] });
n = await notes();
const zle = n.find((x) => /nie mieści się w formatce/.test(x.txt));
console.log('     ' + (zle ? zle.txt + '  →  [' + zle.btns.join(' | ') + ']' : '(brak)'));
ok('błąd o za długim odcinku', !!zle, n.map((x) => x.txt.slice(0, 50)).join(' // '));
ok('podaje długość 3200 mm', !!zle && /3200 mm/.test(zle.txt), zle && zle.txt);
ok('przycisk dobierający podział', !!zle && zle.btns.includes('Dobierz podział automatycznie'), zle && zle.btns);
await uwagi().getByRole('button', { name: 'Dobierz podział automatycznie' }).click();
await page.waitForTimeout(1000);
ok('po kliknięciu błąd znika', !(await notes()).some((x) => /nie mieści się w formatce/.test(x.txt)),
  (await notes()).map((x) => x.txt.slice(0, 50)).join(' // '));
j = await jointBtns();
ok('automat ustawił 2400', j.filter((x) => x.on).map((x) => x.t).join() === '2400', JSON.stringify(j));

console.log('\n== jedna szafka szersza niż formatka: uczciwy błąd ==');
await seed([2900, 600]);
n = await notes();
const brak = n.find((x) => /nie ma odcinka krótszego niż formatka/.test(x.txt));
console.log('     ' + (brak ? brak.txt : '(brak)'));
ok('błąd, że nie da się ciąć na stykach', !!brak, n.map((x) => x.txt.slice(0, 60)).join(' // '));
ok('podpowiada, co zrobić', !!brak && /zwęzić którąś szafkę/.test(brak.txt), brak && brak.txt);

console.log('\n== luz między korpusami nie psuje styków ==');
await seed([800, 800, 800, 800, 800], { gap: 5 });
j = await jointBtns();
console.log('     ' + JSON.stringify(j.map((x) => x.t)));
// styki: 800, 1605, 2410, 3215; total 4020; najdalszy <= 2761,2 to 2410
ok('styki liczone z luzem', j.map((x) => x.t).join() === '800,1605,2410,3215', JSON.stringify(j.map((x) => x.t)));
ok('automat tnie na 2410', j.filter((x) => x.on).map((x) => x.t).join() === '2410', JSON.stringify(j));
n = await notes();
msg = n.find((x) => /Cokół ciągu/.test(x.txt));
ok('kawałki 2410 i 1610', !!msg && /2410 i 1610 mm/.test(msg.txt), msg && msg.txt);

console.log('\n== zmiana szerokości szafki czyści nieaktualny styk ==');
await seed([800, 800, 800, 800, 800], { plinthCuts: [2400] });
j = await jointBtns();
ok('przed zmianą styk 2400 zaznaczony', j.filter((x) => x.on).map((x) => x.t).join() === '2400', JSON.stringify(j));
// zwezamy pierwsza szafke: styki przesuwaja sie, 2400 przestaje istniec
await page.evaluate(() => {
  const d = JSON.parse(localStorage.getItem('szafki:projekt'));
  d.items[0].cab.W = 700;
  localStorage.setItem('szafki:projekt', JSON.stringify(d));
});
await page.reload({ waitUntil: 'networkidle' });
await page.waitForTimeout(2200);
j = await jointBtns();
console.log('     styki po zmianie: ' + JSON.stringify(j.map((x) => x.t)));
ok('nieistniejący styk odpadł', !j.some((x) => x.on && x.t === '2400'), JSON.stringify(j));
ok('bez błędów po odpadnięciu styku', errors.length === 0, errors.join('; '));

console.log('\nBLEDY:', errors.length ? errors.join('\n') : '(brak)');
await browser.close();
