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
await page.goto(URL, { waitUntil: 'networkidle' });

// pasek grup: kazdy wiersz to etykieta + kafelki szafek
const bar = () => page.evaluate(() => {
  const rows = [...document.querySelectorAll('header .space-y-1 > div')];
  return rows.map((r) => ({
    label: (r.querySelector('span') || {}).textContent || '',
    // w kafelku sa tez przyciski sterujace — nazwa to ten, ktory nie jest ikona
    chips: [...r.querySelectorAll('div.rounded-full')].map((c) =>
      [...c.querySelectorAll('button')].map((b) => b.textContent.trim())
        .find((t) => !['‹', '›', '⧉', '×'].includes(t)) || ''),
    btns: [...r.querySelectorAll(':scope > button')].map((b) => b.textContent.trim()),
  })).filter((r) => r.label || r.chips.length || r.btns.length);
});
const seedProject = async (data) => {
  await page.evaluate((d) => { localStorage.clear(); localStorage.setItem('szafki:projekt', JSON.stringify(d)); }, data);
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
};
const cab = (name, W) => ({ cab: { name, W, H: 720, D: 500 }, mat: undefined });
const addRun = () => page.getByRole('button', { name: '+ ciąg' }).click();
const stan = () => page.evaluate(() => JSON.parse(localStorage.getItem('szafki:projekt') || '{}'));
/* Pola karty adresujemy po etykiecie, nie po kolejnosci — kazde nowe pole
   przesuwa indeksy i test zaczyna wpisywac liczby nie tam. .last() bierze
   etykiete najglebsza, bo pola wspolne siedza w Field wewnatrz Field. */
const numByLabel = (cap) => cs.locator('label')
  .filter({ has: page.locator('span', { hasText: new RegExp('^' + cap + '$') }) })
  .last().locator('input[type=number]').first();

console.log('== stary projekt bez ciągów wczytuje się jak dotąd ==');
await seedProject({ name: 'T', active: 0, prices: {}, items: [cab('A', 600), cab('B', 400)] });
let b = await bar();
b.forEach((r) => console.log('     [' + r.label + '] ' + r.chips.join(', ') + '  ' + r.btns.join(' ')));
ok('jeden wiersz szafek', b.filter((r) => r.chips.length).length === 1, JSON.stringify(b.map((r) => r.label)));
ok('etykieta jak dotąd', b[0].label === 'Szafki:', b[0].label);
ok('obie szafki na pasku', b[0].chips.join() === 'A,B', b[0].chips.join());
ok('brak karty ciągu, gdy nie ma ciągów', await card(/^Ciąg meblowy$/).count() === 0);
ok('przycisk + ciąg jest', await page.getByRole('button', { name: '+ ciąg' }).count() === 1);

console.log('\n== nowy ciąg to osobny wiersz, szafki zostają wolnostojące ==');
await addRun();
await page.waitForTimeout(700);
b = await bar();
b.forEach((r) => console.log('     [' + r.label + '] ' + r.chips.join(', ')));
ok('wiersz ciągu „Ściana 1"', b.some((r) => r.label === 'Ściana 1'), JSON.stringify(b.map((r) => r.label)));
ok('wiersz wolnostojących', b.some((r) => r.label === 'Wolnostojące'), JSON.stringify(b.map((r) => r.label)));
ok('ciąg startuje pusty', (b.find((r) => r.label === 'Ściana 1') || {}).chips.length === 0);
ok('szafki dalej wolnostojące', (b.find((r) => r.label === 'Wolnostojące') || {}).chips.join() === 'A,B');

console.log('\n== + szafka w wierszu ciągu wpada do ciągu ==');
await page.locator('header .space-y-1 > div').filter({ hasText: 'Ściana 1' })
  .getByRole('button', { name: '+ szafka' }).click();
await page.waitForTimeout(900);
b = await bar();
b.forEach((r) => console.log('     [' + r.label + '] ' + r.chips.join(', ')));
const row1 = b.find((r) => r.label === 'Ściana 1');
ok('szafka trafiła do ciągu', row1.chips.length === 1, JSON.stringify(row1.chips));
ok('wolnostojące bez zmian', (b.find((r) => r.label === 'Wolnostojące') || {}).chips.join() === 'A,B');
ok('karta ciągu się pojawiła', await card(/^Ciąg meblowy$/).count() === 1);

console.log('\n== karta ciągu opisuje pozycję i sumę ==');
const cs = card(/^Ciąg meblowy$/);
// .mt-1 odsiewa strzalke zwijania karty, ktora tez jest stone-400
let hint = await cs.locator('span.text-stone-400.mt-1').first().textContent();
console.log('     ' + hint.trim());
ok('pozycja 1 z 1', /1 z 1 w ciągu/.test(hint), hint.trim());
let sum = (await cs.locator('p').first().textContent()).trim();
console.log('     ' + sum);
// nowa szafka ma domyslne 600 mm
ok('suma szerokości 600 mm', /1 szafka zajmuje\s*600 mm/.test(sum.replace(/\s+/g, ' ')), sum);

console.log('\n== przypisanie szafki do ciągu z karty ==');
await cs.locator('select').first().selectOption({ label: 'Wolnostojąca' });
await page.waitForTimeout(800);
b = await bar();
ok('szafka wróciła na wolnostojące', (b.find((r) => r.label === 'Wolnostojące') || {}).chips.length === 3,
  JSON.stringify(b.map((r) => r.label + ':' + r.chips.length)));
ok('karta znika dla wolnostojącej', await cs.locator('p').count() === 0);
await cs.locator('select').first().selectOption({ label: 'Ściana 1' });
await page.waitForTimeout(800);
b = await bar();
ok('i z powrotem do ciągu', (b.find((r) => r.label === 'Ściana 1') || {}).chips.length === 1,
  JSON.stringify(b.map((r) => r.label + ':' + r.chips.length)));

console.log('\n== długość ściany i luz między korpusami ==');
await cs.getByRole('textbox').first().fill('Ściana kuchenna');
await page.waitForTimeout(700);
b = await bar();
ok('nazwa ciągu widoczna na pasku', b.some((r) => r.label === 'Ściana kuchenna'), JSON.stringify(b.map((r) => r.label)));
await numByLabel('Długość ściany').fill('2400');
await page.waitForTimeout(800);
sum = (await cs.locator('p').first().textContent()).replace(/\s+/g, ' ').trim();
console.log('     ' + sum);
ok('zostaje 1800 mm ściany', /zostaje 1800 mm/.test(sum), sum);
// luz miedzy korpusami: druga szafka w ciagu + luz 5 -> 600+600+5
await page.locator('header .space-y-1 > div').filter({ hasText: 'Ściana kuchenna' })
  .getByRole('button', { name: '+ szafka' }).click();
await page.waitForTimeout(900);
await numByLabel('Luz między korpusami').fill('5');
await page.waitForTimeout(900);
sum = (await cs.locator('p').first().textContent()).replace(/\s+/g, ' ').trim();
console.log('     ' + sum);
ok('luz wchodzi do sumy (1205 mm)', /2 szafki zajmuje 1205 mm/.test(sum), sum);
ok('zostaje 1195 mm', /zostaje 1195 mm/.test(sum), sum);

console.log('\n== kolejność w ciągu: strzałki ==');
b = await bar();
const rowK = b.find((r) => r.label === 'Ściana kuchenna');
console.log('     ' + rowK.chips.join(', '));
ok('dwie szafki w ciągu', rowK.chips.length === 2, rowK.chips.join());
const przed = rowK.chips.join();
await page.locator('header .space-y-1 > div').filter({ hasText: 'Ściana kuchenna' })
  .getByTitle('Przesuń w lewo w ciągu').first().click();
await page.waitForTimeout(800);
b = await bar();
const po = (b.find((r) => r.label === 'Ściana kuchenna') || {}).chips.join();
console.log('     ' + po);
ok('kolejność się odwróciła', po === przed.split(',').reverse().join(','), `${przed} → ${po}`);
ok('strzałka w lewo znika przy pierwszej',
  await page.locator('header .space-y-1 > div').filter({ hasText: 'Ściana kuchenna' })
    .getByTitle('Przesuń w lewo w ciągu').count() === 1);

console.log('\n== zapis i odczyt zachowuje ciągi ==');
let st = await stan();
console.log('     runs: ' + JSON.stringify(st.runs));
ok('ciąg zapisany', Array.isArray(st.runs) && st.runs.length === 1, JSON.stringify(st.runs));
ok('nazwa i ściana w zapisie', st.runs[0].name === 'Ściana kuchenna' && st.runs[0].wallW === 2400 && st.runs[0].gap === 5,
  JSON.stringify(st.runs[0]));
// ciag zapamietuje tez wymiary wspolne, przejete od pierwszej szafki
ok('wymiary wspólne w zapisie', st.runs[0].H === 720 && st.runs[0].D === 500, JSON.stringify(st.runs[0]));
ok('przynależność przy szafce, nie w cab',
  st.items.filter((it) => it.runId === st.runs[0].id).length === 2 && !('runId' in st.items[0].cab),
  st.items.map((it) => it.runId).join());
await page.reload({ waitUntil: 'networkidle' });
await page.waitForTimeout(2200);
b = await bar();
ok('po przeładowaniu ciąg na miejscu', b.some((r) => r.label === 'Ściana kuchenna' && r.chips.length === 2),
  JSON.stringify(b.map((r) => r.label + ':' + r.chips.length)));

console.log('\n== rozwiązanie ciągu nie kasuje szafek ==');
await card(/^Ciąg meblowy$/).getByRole('button', { name: /Rozwiąż ciąg/ }).click();
await page.waitForTimeout(900);
b = await bar();
b.forEach((r) => console.log('     [' + r.label + '] ' + r.chips.join(', ')));
ok('ciąg zniknął', !b.some((r) => /Ściana/.test(r.label)), JSON.stringify(b.map((r) => r.label)));
ok('wszystkie 4 szafki zostały', b[0].chips.length === 4, JSON.stringify(b[0].chips));
ok('pasek wrócił do jednego wiersza', b.filter((r) => r.chips.length).length === 1);

console.log('\n== ciąg wskazujący na nieistniejący wiersz nie wywala aplikacji ==');
await seedProject({ name: 'T', active: 0, prices: {}, runs: [{ id: 'c9', name: 'X' }],
  items: [{ ...cab('A', 600), runId: 'ktos-skasowal' }] });
b = await bar();
ok('szafka z martwym ciągiem ląduje na wolnostojących',
  b.some((r) => r.label === 'Wolnostojące' && r.chips.join() === 'A'), JSON.stringify(b.map((r) => r.label + ':' + r.chips.join())));
ok('bez błędów w konsoli', errors.length === 0, errors.join('; '));

await page.locator('header').first().screenshot({ path: S + 'shot-ciag.png' });
console.log('\nBLEDY:', errors.length ? errors.join('\n') : '(brak)');
await browser.close();
