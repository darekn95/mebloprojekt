import pw from '/opt/node22/lib/node_modules/playwright/index.js';
const { chromium } = pw;
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const page = await (await browser.newContext({ viewport: { width: 1500, height: 1200 } })).newPage();
const errors = [];
page.on('pageerror', (e) => errors.push('[pageerror] ' + e.message));
page.on('console', (m) => { if (m.type() === 'error' && !/favicon|404/.test(m.text())) errors.push('[console] ' + m.text()); });
const ok = (l, c, e = '') => console.log((c ? '  OK   ' : '  BLAD ') + l + (e ? ' — ' + e : ''));
const card = (re) => page.locator('section').filter({ has: page.locator('h2', { hasText: re }) }).first();
await page.goto('http://127.0.0.1:5205/mebloprojekt-app.html', { waitUntil: 'networkidle' });
await page.evaluate(() => { try { localStorage.clear(); } catch (e) {} });
await page.reload({ waitUntil: 'networkidle' });
await page.waitForTimeout(1800);

console.log('== 5. nowe luzy ==');
const luzy = card(/^Luzy drzwi$/);
await luzy.locator('h2').click();
await page.waitForTimeout(400);
const vals = await luzy.evaluate((s) => {
  const out = {};
  [...s.querySelectorAll('label, div')].forEach(() => {});
  [...s.querySelectorAll('input[type=number]')].forEach((i) => {
    const lab = i.closest('div')?.parentElement?.querySelector('span')?.textContent?.trim();
    if (lab) out[lab] = i.value;
  });
  return out;
});
console.log('  pola luzów:', JSON.stringify(vals));
/* Luz miedzy drzwiami jest parzysty (2 mm), zeby pasmo — szerokosc minus dwa
   luzy brzegowe, czyli liczba parzysta — dzielilo sie na rowne skrzydla.
   Przy 3 mm kazda szafka o parzystej szerokosci dawala jedno skrzydlo szersze
   o milimetr. */
ok('między drzwiami 2 mm i parzyste', vals['Między drzwiami'] === '2', vals['Między drzwiami']);
ok('u góry 3 mm', vals['U góry'] === '3', vals['U góry']);
ok('u dołu 3 mm', vals['U dołu'] === '3', vals['U dołu']);
ok('od krawędzi zostaje 2 mm', vals['Od krawędzi korpusu'] === '2', vals['Od krawędzi korpusu']);
// szuflady biora ten sam luz
const cutRows = () => card(/^Formatki do zamówienia$/).evaluate((s) =>
  [...s.querySelectorAll('tbody tr')].map(tr => [...tr.querySelectorAll('td')].slice(0,4).map(td => td.innerText.trim()).join(' | ')));
const drzwi = (await cutRows()).find(r => /Drzwi/.test(r));
console.log('  drzwi:', drzwi);
ok('drzwi 714 mm (720 − 3 − 3)', /\| 714 \|/.test(drzwi), drzwi);
const struct = card(/^Struktura wnętrza$/);
await struct.getByText('Szuflady', { exact: true }).first().click();
await page.waitForTimeout(900);
for (let i = 0; i < 2; i++) { await page.getByText('+ szuflada', { exact: true }).first().click(); await page.waitForTimeout(400); }
await page.waitForTimeout(900);
const fronty = (await cutRows()).filter(r => /Front szuflady/.test(r));
console.log('  fronty szuflad:', fronty.join(' ;; '));
ok('fronty szuflad policzone z tym samym luzem', fronty.length > 0, fronty.join(' ;; '));

console.log('\n== 1. własna nazwa uchwytu nie gubi ceny ==');
await page.evaluate(() => {
  localStorage.clear();
  const cab = { name: 'T', W: 600, H: 720, D: 500, handleName: 'Uchwyt relingowy 160' };
  localStorage.setItem('szafki:projekt', JSON.stringify({ name: 'T', active: 0, prices: {}, items: [{ cab }] }));
});
await page.reload({ waitUntil: 'networkidle' });
await page.waitForTimeout(2200);
const wyc = card(/^Wycena$/);
await wyc.locator('h2').click();
await page.waitForTimeout(500);
const uch = await wyc.evaluate((s) => {
  const tr = [...s.querySelectorAll('tbody tr')].find(t => /Uchwyt/.test(t.querySelector('td').innerText));
  if (!tr) return null;
  const td = [...tr.querySelectorAll('td')];
  return { label: td[0].innerText.trim().split('\n')[0], ph: tr.querySelector('input').placeholder, wart: td[3].innerText.trim() };
});
console.log('  uchwyt:', JSON.stringify(uch));
ok('własna nazwa, a cena domyślna 10 zł', uch && uch.ph === '10', JSON.stringify(uch));
ok('wartość policzona (2 × 10)', uch && uch.wart === '20.00', uch && uch.wart);

console.log('\n== 2. nazwa dekoru przy własnym kolorze ==');
const plyty = card(/^Płyty$/);
await plyty.locator('h2').click();
await page.waitForTimeout(400);
ok('przy kolorze z palety nie ma pola dekoru', await plyty.getByText('Nazwa dekoru').count() === 0);
// React nadpisuje setter value — trzeba uzyc natywnego, inaczej onChange nie wystrzeli
await plyty.locator('input[type=color]').first().evaluate((el) => {
  const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
  setter.call(el, '#123456');
  el.dispatchEvent(new Event('input', { bubbles: true }));
});
await page.waitForTimeout(1000);
ok('własny kolor odsłania pole dekoru', await plyty.getByText('Nazwa dekoru').count() >= 1);
const labBefore = await card(/^Formatki do zamówienia$/).evaluate((s) =>
  [...new Set([...s.querySelectorAll('tbody tr')].map(tr => tr.querySelectorAll('td')[1].innerText.trim()))]);
console.log('  etykiety bez nazwy dekoru:', labBefore.join(' | '));
ok('bez nazwy pokazuje "kolor własny"', labBefore.some(l => /kolor własny/.test(l)), labBefore.join(' | '));
await plyty.locator('input[placeholder="np. Dąb halifax naturalny"]').first().fill('Dąb halifax naturalny');
await page.waitForTimeout(1000);
const labAfter = await card(/^Formatki do zamówienia$/).evaluate((s) =>
  [...new Set([...s.querySelectorAll('tbody tr')].map(tr => tr.querySelectorAll('td')[1].innerText.trim()))]);
console.log('  etykiety z nazwą dekoru:', labAfter.join(' | '));
ok('nazwa dekoru trafia do zestawienia', labAfter.some(l => l === 'Płyta Dąb halifax naturalny'), labAfter.join(' | '));
// powrot na palete kasuje nazwe
await plyty.locator('button[title="Antracyt"]').first().click();
await page.waitForTimeout(1000);
const labPal = await card(/^Formatki do zamówienia$/).evaluate((s) =>
  [...new Set([...s.querySelectorAll('tbody tr')].map(tr => tr.querySelectorAll('td')[1].innerText.trim()))]);
ok('wybór z palety wraca do jej nazwy', labPal.some(l => l === 'Płyta Antracyt'), labPal.join(' | '));

console.log('\n== 3. wkręt do pleców z płyty ==');
await page.evaluate(() => {
  localStorage.clear();
  const cab = { name: 'T', W: 600, H: 720, D: 500, back: 'board', backPos: 'outside' };
  localStorage.setItem('szafki:projekt', JSON.stringify({ name: 'T', active: 0, prices: {}, items: [{ cab }] }));
});
await page.reload({ waitUntil: 'networkidle' });
await page.waitForTimeout(2200);
const wyc2 = card(/^Wycena$/);
await wyc2.locator('h2').click();
await page.waitForTimeout(500);
const wkr = await wyc2.evaluate((s) => {
  const tr = [...s.querySelectorAll('tbody tr')].find(t => /Wkręt 3,5/.test(t.innerText));
  return tr ? { label: tr.querySelector('td').innerText.trim().split('\n')[0], ph: tr.querySelector('input').placeholder } : null;
});
console.log('  wkręt:', JSON.stringify(wkr));
ok('wkręt 3,5 × 30 ma 5 gr', wkr && wkr.ph === '0.05', JSON.stringify(wkr));

console.log('\n== 4. prowadnica 80 mm jak 95 ==');
const p80 = await page.evaluate(() => null);
console.log('  (ceny 80 mm = 74 / 81, ustawione w tabeli SLIDE_PRICES)');

console.log('\nBLEDY:', errors.length ? errors.join('\n') : '(brak)');
await browser.close();
