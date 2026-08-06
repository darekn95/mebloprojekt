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
const rowsOf = (re) => card(re).evaluate((sec) =>
  [...sec.querySelectorAll('tbody tr')].map((tr) => [...tr.querySelectorAll('td')].map((td) => td.textContent.trim()).join(' | ')));
const stan = () => page.evaluate(() => JSON.parse(localStorage.getItem('szafki:projekt') || '{}'));
// kafelki podzialu danej sekcji
const cutBtns = (label) => cs().evaluate((sec, lab) => {
  const f = [...sec.querySelectorAll('div')].find((l) => new RegExp('^' + lab).test((l.textContent || '').trim()));
  return f ? [...f.querySelectorAll('button')].map((b) => ({
    t: b.textContent.trim(), on: b.className.includes('bg-teal-700'),
  })) : [];
}, label);
await page.goto(URL, { waitUntil: 'networkidle' });

const BLAT = { mode: 'blat', widthMode: 'outside', overL: 20, overR: 20, overFront: 30, overBack: 0 };
const NO = { on: false, height: 100, mode: 'under', setback: 0 };
const seed = async (widths, run = {}, cabPatch = {}) => {
  await page.evaluate(({ ws, r, cp }) => {
    localStorage.clear();
    localStorage.setItem('szafki:projekt', JSON.stringify({
      name: 'T', active: 0, prices: {},
      runs: [Object.assign({ id: 'c1', name: 'Ściana 1', wallW: null, gap: 0, mountY: 0,
        H: 720, D: 500, plinth: { on: false, height: 100, mode: 'under', setback: 0 },
        hangerMode: 'listwa' }, r)],
      items: ws.map((w, i) => ({
        cab: Object.assign({ name: 'S' + (i + 1), W: w, H: 720, D: 500,
          plinth: { on: false, height: 100, mode: 'under', setback: 0 },
          legs: { on: false, height: 100, color: '#3f3f46', shape: 'box' } }, cp),
        mat: undefined, runId: 'c1' })),
    }));
  }, { ws: widths, r: run, cp: cabPatch });
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(2300);
};
const projRows = () => rowsOf(/Formatki całego projektu/);
const cabRows = () => rowsOf(/^Formatki do zamówienia$/);
const hwProj = () => rowsOf(/Produkty całego projektu/).catch(() => []);
const hwCab = () => rowsOf(/^Produkty do zamówienia$/);

console.log('== blat ciągu to jedna płyta na całą długość ==');
// 3 x 600 = 1800, blat wystaje 20 z lewej i 20 z prawej -> 1840
await seed([600, 600, 600], {}, { top: BLAT, joints: { topL: 'over', topR: 'over', botL: 'between', botR: 'between' } });
let c = await cabRows();
ok('szafka w ciągu nie ma własnego blatu', !c.some((r) => /^Blat \|/.test(r)),
  c.filter((r) => /Blat/.test(r)).join(' // '));
let p = await projRows();
let blat = p.filter((r) => /^Blat ciągu/.test(r));
console.log('     ' + blat.join('\n     '));
ok('projekt ma blat ciągu', blat.length === 1, p.slice(0, 4).join(' // '));
ok('blat na 1840 mm (1800 + 2 × 20 wysunięcia)', /\|\s*1840\s*\|/.test(blat[0]), blat[0]);
ok('brak pojedynczych blatów', !p.some((r) => /^Blat \|/.test(r)), p.filter((r) => /Blat/.test(r)).join(' // '));

console.log('\n== karta opisuje blat ==');
const opis = await cs().locator('p').allTextContents();
console.log('     ' + opis.map((t) => t.replace(/\s+/g, ' ').trim()).join(' // '));
ok('opis jednej formatki blatu', opis.some((t) => /Jedna formatka 1840 × \d+ mm/.test(t.replace(/\s+/g, ' '))),
  opis.join(' // '));

console.log('\n== długi blat dzieli się na styku korpusów ==');
// 5 x 800 = 4000 + 40 wysuniecia = 4040; styki plyty: 820, 1620, 2420, 3220
await seed([800, 800, 800, 800, 800], {}, { top: BLAT, joints: { topL: 'over', topR: 'over', botL: 'between', botR: 'between' } });
let n = await notes();
let msg = n.find((x) => /Blat ciągu/.test(x.txt));
console.log('     ' + (msg ? msg.txt : '(brak)'));
ok('ostrzeżenie o podziale blatu', !!msg, n.map((x) => x.txt.slice(0, 55)).join(' // '));
ok('podaje długość 4040 mm', !!msg && /4040 mm/.test(msg.txt), msg && msg.txt);
ok('tnie na styku 2420, nie po równo', !!msg && /2420 i 1620 mm/.test(msg.txt), msg && msg.txt);
ok('mówi o oklejeniu łączenia', !!msg && /oklejonych także na łączeniu/.test(msg.txt), msg && msg.txt);
p = await projRows();
blat = p.filter((r) => /^Blat ciągu/.test(r));
console.log('     ' + blat.join('\n     '));
ok('dwie formatki blatu 2420 i 1620', blat.length === 2
  && blat.some((r) => /\|\s*2420\s*\|/.test(r)) && blat.some((r) => /\|\s*1620\s*\|/.test(r)), blat.join(' // '));

console.log('\n== podział blatu da się przestawić ==');
let j = await cutBtns('Podział blatu');
console.log('     ' + JSON.stringify(j));
ok('kafelki styków blatu są', j.length >= 4, JSON.stringify(j.map((x) => x.t)));
ok('automat zaznaczył 2420', j.filter((x) => x.on).map((x) => x.t).join() === '2420', JSON.stringify(j));
await cs().getByRole('button', { name: '2420', exact: true }).click();
await page.waitForTimeout(800);
await cs().getByRole('button', { name: '1620', exact: true }).click();
await page.waitForTimeout(800);
await cs().getByRole('button', { name: '3220', exact: true }).click();
await page.waitForTimeout(1000);
j = await cutBtns('Podział blatu');
ok('ręczny wybór 1620 i 3220', j.filter((x) => x.on).map((x) => x.t).join() === '1620,3220', JSON.stringify(j));
let st = await stan();
ok('zapisane w topCuts', JSON.stringify(st.runs[0].topCuts) === '[1620,3220]', JSON.stringify(st.runs[0].topCuts));
ok('cokół nie ruszony', st.runs[0].plinthCuts === null, JSON.stringify(st.runs[0].plinthCuts));

console.log('\n== za mało cięć blatu: błąd z przyciskiem ==');
await seed([800, 800, 800, 800, 800], { topCuts: [3220] },
  { top: BLAT, joints: { topL: 'over', topR: 'over', botL: 'between', botR: 'between' } });
n = await notes();
const zle = n.find((x) => /Odcinek blatu ciągu .* nie mieści się w formatce/.test(x.txt));
console.log('     ' + (zle ? zle.txt + '  →  [' + zle.btns.join(' | ') + ']' : '(brak)'));
ok('błąd o za długim odcinku blatu', !!zle, n.map((x) => x.txt.slice(0, 55)).join(' // '));
ok('przycisk naprawy', !!zle && zle.btns.includes('Dobierz podział automatycznie'), zle && zle.btns);
await uwagi().getByRole('button', { name: 'Dobierz podział automatycznie' }).first().click();
await page.waitForTimeout(1000);
ok('po kliknięciu błąd znika', !(await notes()).some((x) => /nie mieści się w formatce/.test(x.txt)),
  (await notes()).map((x) => x.txt.slice(0, 50)).join(' // '));

console.log('\n== nowa szafka w ciągu wiesza się jak ciąg ==');
await seed([600]);
await page.locator('header .space-y-1 > div').filter({ hasText: 'Ściana 1' })
  .getByRole('button', { name: '+ szafka' }).click();
await page.waitForTimeout(1200);
st = await stan();
console.log('     ' + st.items.map((it) => it.cab.hangerMode).join(', '));
ok('dołożona szafka bierze wieszanie ciągu',
  st.items[st.items.length - 1].cab.hangerMode === 'listwa',
  st.items.map((it) => it.cab.hangerMode).join());
ok('żadnej uwagi o wieszaniu na starcie',
  !(await notes()).some((x) => /wiesza się na/.test(x.txt)),
  (await notes()).map((x) => x.txt.slice(0, 45)).join(' // '));

console.log('\n== listwa jedna na cały ciąg ==');
await seed([600, 600, 600]);
let hw = await hwCab();
console.log('     szafka: ' + hw.filter((r) => /Listwa/.test(r)).join(' // '));
ok('szafka w ciągu nie liczy własnej listwy', !hw.some((r) => /^Listwa/.test(r)),
  hw.filter((r) => /Listwa/.test(r)).join(' // '));
let ph = await rowsOf(/Produkty całego projektu/);
const listwa = ph.filter((r) => /^Listwa/.test(r));
console.log('     projekt: ' + listwa.join(' // '));
ok('projekt ma jedną listwę', listwa.length === 1, ph.filter((r) => /Listwa/.test(r)).join(' // '));
// 1800 - 40 = 1760 mm = 17,6 mb
ok('listwa 1760 mm na cały ciąg', /1760 mm/.test(listwa[0]), listwa[0]);
ok('podana jako jeden odcinek', /jeden odcinek/.test(listwa[0]), listwa[0]);

console.log('\n== ciąg domyślnie na listwie, szafka na haczykach dostaje uwagę ==');
await seed([600, 600], {}, { hangerMode: 'haczyki' });
n = await notes();
const wiesz = n.find((x) => /wiesza się na haczykach/.test(x.txt));
console.log('     ' + (wiesz ? wiesz.txt + '  →  [' + wiesz.btns.join(' | ') + ']' : '(brak)'));
ok('uwaga o sposobie wieszania', !!wiesz, n.map((x) => x.txt.slice(0, 55)).join(' // '));
ok('tłumaczy, po co listwa w ciągu', !!wiesz && /w jednej linii/.test(wiesz.txt), wiesz && wiesz.txt);
ok('przycisk na szafkę', !!wiesz && wiesz.btns.includes('Wieszaj tę szafkę jak ciąg'), wiesz && wiesz.btns);
ok('przycisk na ciąg', !!wiesz && wiesz.btns.includes('Tak ma wisieć cały ciąg'), wiesz && wiesz.btns);
await uwagi().getByRole('button', { name: 'Wieszaj tę szafkę jak ciąg' }).first().click();
await page.waitForTimeout(1100);
st = await stan();
console.log('     ' + st.items.map((it) => it.cab.hangerMode).join(', '));
ok('szafka przeszła na listwę', st.items[0].cab.hangerMode === 'listwa', st.items.map((it) => it.cab.hangerMode).join());
ok('uwaga znikła dla tej szafki',
  (await notes()).filter((x) => /wiesza się na haczykach/.test(x.txt)).length === 0,
  (await notes()).map((x) => x.txt.slice(0, 40)).join(' // '));

console.log('\n== „tak ma wisieć cały ciąg" przestawia wszystkie ==');
await seed([600, 600], {}, { hangerMode: 'haczyki' });
await uwagi().getByRole('button', { name: 'Tak ma wisieć cały ciąg' }).first().click();
await page.waitForTimeout(1100);
st = await stan();
ok('ciąg zapamiętał haczyki', st.runs[0].hangerMode === 'haczyki', st.runs[0].hangerMode);
ok('bez listwy w zamówieniu', !(await rowsOf(/Produkty całego projektu/)).some((r) => /^Listwa/.test(r)),
  (await rowsOf(/Produkty całego projektu/)).filter((r) => /Listwa/.test(r)).join(' // '));

console.log('\n== ciąg stojący nie liczy listwy ==');
await seed([600, 600], {}, { plinth: { on: true, height: 100, mode: 'under', setback: 0 } });
ok('stojący ciąg bez listwy', !(await rowsOf(/Produkty całego projektu/)).some((r) => /^Listwa/.test(r)),
  (await rowsOf(/Produkty całego projektu/)).filter((r) => /Listwa|Zawieszka|Hak/.test(r)).join(' // '));

console.log('\n== wolnostojąca szafka bez zmian ==');
await page.evaluate(() => {
  const d = JSON.parse(localStorage.getItem('szafki:projekt'));
  d.runs = []; d.items.forEach((it) => { it.runId = null; });
  d.items[0].cab.top = { mode: 'blat', widthMode: 'outside', overL: 20, overR: 20, overFront: 30, overBack: 0 };
  d.items[0].cab.joints = { topL: 'over', topR: 'over', botL: 'between', botR: 'between' };
  localStorage.setItem('szafki:projekt', JSON.stringify(d));
});
await page.reload({ waitUntil: 'networkidle' });
await page.waitForTimeout(2300);
c = await cabRows();
ok('wolnostojąca ma swój blat', c.some((r) => /^Blat \|/.test(r)), c.filter((r) => /Blat/.test(r)).join(' // '));
ok('bez błędów', errors.length === 0, errors.join('; '));

console.log('\nBLEDY:', errors.length ? errors.join('\n') : '(brak)');
await browser.close();
