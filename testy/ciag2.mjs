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
const cs = () => card(/^Ciąg meblowy$/);
const uwagi = () => card(/^Uwagi$/);
const notes = () => page.evaluate(() => {
  const sec = [...document.querySelectorAll('section')].find((s) => /^Uwagi$/.test((s.querySelector('h2') || {}).textContent || ''));
  return sec ? [...sec.querySelectorAll('li')].map((li) => ({
    txt: li.textContent.trim(), btns: [...li.querySelectorAll('button')].map((b) => b.textContent.trim()),
  })) : [];
});
const stan = () => page.evaluate(() => JSON.parse(localStorage.getItem('szafki:projekt') || '{}'));
const chip = (name) => page.locator('header div.rounded-full').filter({ hasText: name }).first();
/* Pola karty adresujemy po etykiecie, a nie po kolejnosci — inaczej kazde nowe
   pole w karcie przesuwa indeksy i test zaczyna wpisywac liczby nie tam. */
// .last() bierze etykiete najglebsza — pola wspolne siedza w Field wewnatrz Field,
// wiec .first() trafialby w opakowanie i pisal do sasiedniego pola
const numByLabel = (cap) => cs().locator('label')
  .filter({ has: page.locator('span', { hasText: new RegExp('^' + cap + '$') }) })
  .last().locator('input[type=number]').first();
await page.goto(URL, { waitUntil: 'networkidle' });

// ciag z trzema szafkami o roznych wymiarach, zeby bylo co wyrownywac
const seed = async (items, run = {}) => {
  await page.evaluate(({ its, r }) => {
    localStorage.clear();
    localStorage.setItem('szafki:projekt', JSON.stringify({
      name: 'T', active: 0, prices: {},
      runs: [Object.assign({ id: 'c1', name: 'Ściana 1', wallW: null, gap: 0 }, r)],
      items: its.map((c) => ({ cab: c, mat: undefined, runId: 'c1' })),
    }));
  }, { its: items, r: run });
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(2200);
};
const K = (name, patch = {}) => Object.assign({ name, W: 600, H: 720, D: 500,
  plinth: { on: true, height: 100, mode: 'inbody', setback: 0 } }, patch);

console.log('== pusty ciąg przejmuje wymiary od pierwszej szafki ==');
await page.evaluate(() => {
  localStorage.clear();
  localStorage.setItem('szafki:projekt', JSON.stringify({ name: 'T', active: 0, prices: {},
    runs: [{ id: 'c1', name: 'Ściana 1' }], items: [] }));
});
await page.reload({ waitUntil: 'networkidle' });
await page.waitForTimeout(2000);
// pusty projekt nie przejdzie przez loadProject — startujemy standardowo i robimy ciąg z UI
await page.evaluate(() => localStorage.clear());
await page.reload({ waitUntil: 'networkidle' });
await page.waitForTimeout(2000);
await page.getByRole('button', { name: '+ ciąg' }).click();
await page.waitForTimeout(600);
await page.locator('header .space-y-1 > div').filter({ hasText: 'Ściana 1' })
  .getByRole('button', { name: '+ szafka' }).click();
await page.waitForTimeout(1000);
let st = await stan();
console.log('     run: ' + JSON.stringify(st.runs[0]));
ok('ciąg przejął wysokość pierwszej szafki', st.runs[0].H === st.items[1].cab.H, JSON.stringify(st.runs[0]));
ok('ciąg przejął głębokość', st.runs[0].D === st.items[1].cab.D, String(st.runs[0].D));
ok('ciąg przejął cokół', !!st.runs[0].plinth, JSON.stringify(st.runs[0].plinth));
ok('żadnej uwagi o rozjeździe na starcie',
  !(await notes()).some((n) => /nie zgadza się z ciągiem/.test(n.txt)),
  (await notes()).map((n) => n.txt.slice(0, 50)).join(' // '));

console.log('\n== rozjazd wysokości: ostrzeżenie z dwoma przyciskami ==');
await seed([K('A'), K('B', { H: 900 })], { H: 720, D: 500, plinth: { on: true, height: 100, mode: 'inbody', setback: 0 } });
await chip('B').getByRole('button', { name: 'B', exact: true }).click();
await page.waitForTimeout(1200);
let n = await notes();
let wys = n.find((x) => /Wysokość .* nie zgadza się z ciągiem/.test(x.txt));
console.log('     ' + (wys ? wys.txt + '  →  [' + wys.btns.join(' | ') + ']' : '(brak)'));
ok('ostrzeżenie o wysokości', !!wys, n.map((x) => x.txt.slice(0, 60)).join(' // '));
ok('przycisk wyrównania szafki', !!wys && wys.btns.some((b) => /^Wyrównaj tę szafkę do ciągu \(720 mm\)$/.test(b)), wys && wys.btns);
ok('przycisk wyrównania ciągu', !!wys && wys.btns.some((b) => /^Ustaw cały ciąg na 900 mm$/.test(b)), wys && wys.btns);

console.log('\n== „wyrównaj szafkę" zmienia tylko tę szafkę ==');
await uwagi().getByRole('button', { name: /Wyrównaj tę szafkę do ciągu/ }).first().click();
await page.waitForTimeout(1100);
st = await stan();
console.log('     wysokości: ' + st.items.map((it) => it.cab.H).join(', '));
ok('szafka zeszła na 720', st.items.every((it) => it.cab.H === 720), st.items.map((it) => it.cab.H).join());
ok('ciąg został na 720', st.runs[0].H === 720, String(st.runs[0].H));
ok('ostrzeżenie znikło', !(await notes()).some((x) => /Wysokość .* nie zgadza/.test(x.txt)));

console.log('\n== „ustaw cały ciąg" ciągnie wszystkie szafki ==');
await seed([K('A'), K('B', { H: 900 })], { H: 720, D: 500, plinth: { on: true, height: 100, mode: 'inbody', setback: 0 } });
await chip('B').getByRole('button', { name: 'B', exact: true }).click();
await page.waitForTimeout(1200);
await uwagi().getByRole('button', { name: /Ustaw cały ciąg na 900 mm/ }).first().click();
await page.waitForTimeout(1100);
st = await stan();
console.log('     wysokości: ' + st.items.map((it) => it.cab.H).join(', ') + ' / ciąg ' + st.runs[0].H);
ok('obie szafki na 900', st.items.every((it) => it.cab.H === 900), st.items.map((it) => it.cab.H).join());
ok('ciąg zapamiętał 900', st.runs[0].H === 900, String(st.runs[0].H));
ok('po wyrównaniu bez ostrzeżeń', !(await notes()).some((x) => /nie zgadza się z ciągiem/.test(x.txt)),
  (await notes()).map((x) => x.txt.slice(0, 50)).join(' // '));

console.log('\n== rozjazd głębokości ==');
await seed([K('A'), K('B', { D: 350 })], { H: 720, D: 500, plinth: { on: true, height: 100, mode: 'inbody', setback: 0 } });
await chip('B').getByRole('button', { name: 'B', exact: true }).click();
await page.waitForTimeout(1200);
n = await notes();
// plytsza szafka w ciagu bywa celowa (przeszkoda z tylu), wiec uwaga o tym mowi
// zamiast kazac to naprawiac — tekst zmieniony swiadomie
const gl = n.find((x) => /Głębokość .* różni się od ciągu/.test(x.txt));
console.log('     ' + (gl ? gl.txt + '  →  [' + gl.btns.join(' | ') + ']' : '(brak)'));
ok('ostrzeżenie o głębokości', !!gl, n.map((x) => x.txt.slice(0, 60)).join(' // '));
ok('mówi o blacie', !!gl && /blat/.test(gl.txt), gl && gl.txt);
ok('dopuszcza, że tak może być celowo', !!gl && /lico zostaje w linii/.test(gl.txt), gl && gl.txt);

console.log('\n== rozjazd cokołu ==');
await seed([K('A'), K('B', { plinth: { on: true, height: 150, mode: 'inbody', setback: 0 } })],
  { H: 720, D: 500, plinth: { on: true, height: 100, mode: 'inbody', setback: 0 } });
await chip('B').getByRole('button', { name: 'B', exact: true }).click();
await page.waitForTimeout(1200);
n = await notes();
const ck = n.find((x) => /Cokół tej szafki/.test(x.txt));
console.log('     ' + (ck ? ck.txt + '  →  [' + ck.btns.join(' | ') + ']' : '(brak)'));
ok('ostrzeżenie o cokole', !!ck, n.map((x) => x.txt.slice(0, 60)).join(' // '));
ok('opisuje oba cokoły', !!ck && /150 mm w bryle/.test(ck.txt) && /100 mm w bryle/.test(ck.txt), ck && ck.txt);
ok('przyciski cokołu', !!ck && ck.btns.includes('Wyrównaj cokół do ciągu') && ck.btns.includes('Ustaw cokół ciągu jak tutaj'), ck && ck.btns);
await uwagi().getByRole('button', { name: 'Wyrównaj cokół do ciągu' }).first().click();
await page.waitForTimeout(1100);
st = await stan();
console.log('     cokoły: ' + st.items.map((it) => it.cab.plinth.height).join(', '));
ok('cokół wyrównany do 100', st.items.every((it) => it.cab.plinth.height === 100), st.items.map((it) => it.cab.plinth.height).join());
ok('brak uwagi o cokole', !(await notes()).some((x) => /Cokół tej szafki/.test(x.txt)));

console.log('\n== bez cokołu vs z cokołem ==');
await seed([K('A'), K('B', { plinth: { on: false, height: 100, mode: 'inbody', setback: 0 } })],
  { H: 720, D: 500, plinth: { on: true, height: 100, mode: 'inbody', setback: 0 } });
await chip('B').getByRole('button', { name: 'B', exact: true }).click();
await page.waitForTimeout(1200);
n = await notes();
const bez = n.find((x) => /Cokół tej szafki/.test(x.txt));
console.log('     ' + (bez ? bez.txt : '(brak)'));
ok('brak cokołu też jest rozjazdem', !!bez && /bez cokołu/.test(bez.txt), bez && bez.txt);

console.log('\n== pola wspólne w karcie przestawiają cały ciąg ==');
await seed([K('A'), K('B'), K('C')], { H: 720, D: 500, plinth: { on: true, height: 100, mode: 'inbody', setback: 0 } });
const cnt = await cs().locator('input[type=number]').count();
console.log('     pól liczbowych w karcie: ' + cnt);
ok('karta ma komplet pól', cnt >= 5, String(cnt));
ok('jest pole wysokości wspólnej', await numByLabel('Wysokość').count() === 1);
ok('jest pole głębokości wspólnej', await numByLabel('Głębokość').count() === 1);
await numByLabel('Wysokość').fill('900');
await page.waitForTimeout(1100);
st = await stan();
console.log('     wysokości: ' + st.items.map((it) => it.cab.H).join(', '));
ok('wszystkie trzy szafki na 900', st.items.every((it) => it.cab.H === 900), st.items.map((it) => it.cab.H).join());
await numByLabel('Głębokość').fill('600');
await page.waitForTimeout(1100);
st = await stan();
ok('wszystkie trzy na głębokość 600', st.items.every((it) => it.cab.D === 600), st.items.map((it) => it.cab.D).join());
await numByLabel('Cokół ciągu').fill('150');
await page.waitForTimeout(1100);
st = await stan();
ok('cokół 150 w każdej szafce', st.items.every((it) => it.cab.plinth.height === 150), st.items.map((it) => it.cab.plinth.height).join());
ok('bez uwag o rozjeździe po zmianie z karty',
  !(await notes()).some((x) => /nie zgadza się z ciągiem|Cokół tej szafki/.test(x.txt)),
  (await notes()).map((x) => x.txt.slice(0, 50)).join(' // '));

console.log('\n== ciąg nie mieści się przy ścianie ==');
await seed([K('A', { W: 900 }), K('B', { W: 900 }), K('C', { W: 900 })],
  { H: 720, D: 500, plinth: { on: true, height: 100, mode: 'inbody', setback: 0 }, wallW: 2400, gap: 0 });
n = await notes();
const sc = n.find((x) => /brakuje/.test(x.txt) && /ściana/.test(x.txt));
console.log('     ' + (sc ? sc.txt : '(brak)'));
ok('błąd o ścianie', !!sc, n.map((x) => x.txt.slice(0, 60)).join(' // '));
ok('podaje brakujące 300 mm', !!sc && /brakuje 300 mm/.test(sc.txt), sc && sc.txt);
// po zwezeniu ściana przestaje byc za krotka
await numByLabel('Długość ściany').fill('2700');
await page.waitForTimeout(1100);
ok('po poprawieniu ściany błąd znika', !(await notes()).some((x) => /brakuje \d+ mm/.test(x.txt)),
  (await notes()).map((x) => x.txt.slice(0, 50)).join(' // '));

console.log('\n== wolnostojąca szafka nie dostaje uwag ciągu ==');
await page.evaluate(() => {
  const d = JSON.parse(localStorage.getItem('szafki:projekt'));
  d.items[0].runId = null;
  d.items[0].cab.H = 555;
  d.active = 0;
  localStorage.setItem('szafki:projekt', JSON.stringify(d));
});
await page.reload({ waitUntil: 'networkidle' });
await page.waitForTimeout(2200);
ok('żadnej uwagi o ciągu dla wolnostojącej',
  !(await notes()).some((x) => /nie zgadza się z ciągiem|Cokół tej szafki/.test(x.txt)),
  (await notes()).map((x) => x.txt.slice(0, 50)).join(' // '));

await cs().screenshot({ path: S + 'shot-ciag2.png' }).catch(() => {});
console.log('\nBLEDY:', errors.length ? errors.join('\n') : '(brak)');
await browser.close();
