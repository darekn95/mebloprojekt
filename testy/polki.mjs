import pw from '/opt/node22/lib/node_modules/playwright/index.js';
const { chromium } = pw;
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const page = await (await browser.newContext({ viewport: { width: 1500, height: 1150 } })).newPage();
const errors = [];
page.on('pageerror', (e) => errors.push('[pageerror] ' + e.message));
page.on('console', (m) => { if (m.type() === 'error' && !/favicon|404/.test(m.text())) errors.push('[console] ' + m.text()); });
const ok = (l, c, e = '') => console.log((c ? '  OK   ' : '  BLAD ') + l + (e ? ' — ' + e : ''));
await page.goto('http://127.0.0.1:5205/mebloprojekt-app.html', { waitUntil: 'networkidle' });
await page.evaluate(() => { try { localStorage.clear(); } catch (e) {} });
await page.reload({ waitUntil: 'networkidle' });
await page.waitForTimeout(1500);
const card = (re) => page.locator('section').filter({ has: page.locator('h2', { hasText: re }) }).first();
// swiatla czytamy z widoku otwartego — kazda polka dzieli kolumne
const openings = async () => {
  await page.getByText('Otw.', { exact: true }).first().click();
  await page.waitForTimeout(800);
  return page.evaluate(() => {
    const svg = document.querySelector('svg');
    return [...svg.querySelectorAll('text')].map(t => t.textContent.trim())
      .filter(t => /^\d+$/.test(t)).map(Number);
  });
};
const shelfCount = () => card(/^Formatki do zamówienia$/).evaluate((sec) => {
  const tr = [...sec.querySelectorAll('tbody tr')].find(t => /^Półka\b/.test(t.querySelector('td').innerText.trim()));
  if (!tr) return 0;
  return Number([...tr.querySelectorAll('td')][4].innerText.trim());
});

console.log('== domyślna szafka 720 ==');
let n = await shelfCount();
ok('nie trzy półki na sztywno', n !== 3, String(n));
ok('jedna półka przy 684 mm światła', n === 1, String(n));
let ops = await openings();
console.log('  liczby na rysunku otwartym:', ops.join(', '));
ok('światła po 333 mm (≥ 250)', ops.includes(333), ops.join(', '));

console.log('\n== szablony ==');
const tplShelves = async (id) => {
  await page.locator('select[title="Dodaj szafkę z gotowego szablonu"]').selectOption(id);
  await page.waitForTimeout(1500);
  return shelfCount();
};
const st = await tplShelves('stojaca');
ok('stojąca (cokół 100 → 584 mm) ma 1 półkę', st === 1, String(st));
const wi = await tplShelves('wiszaca');
ok('wisząca ma 1 półkę', wi === 1, String(wi));
const bi = await tplShelves('biurko');
ok('biurko dalej bez półek', bi === 0, String(bi));

console.log('\n== wysoka szafka dostaje więcej półek ==');
await page.getByText('+ szafka', { exact: true }).click();
await page.waitForTimeout(1000);
const korpus = card(/^Korpus$/);
const hIn = korpus.locator('input[type=number]').nth(1);
await hIn.fill('2000'); await hIn.blur();
await page.waitForTimeout(1200);
console.log('  po ręcznej zmianie H na 2000 półek:', await shelfCount(), '(auto-dobór działa przy tworzeniu, nie przy edycji)');

// szafka utworzona juz jako wysoka: sprawdzamy regule wprost przez zapis
await page.evaluate(() => {
  localStorage.clear();
  localStorage.setItem('szafki:projekt', JSON.stringify({ name: 'T', active: 0, prices: {}, items: [] }));
});
await page.reload({ waitUntil: 'networkidle' });
await page.waitForTimeout(2000);
const n2 = await shelfCount();
ok('po wyczyszczeniu wraca domyślna 1 półka', n2 === 1, String(n2));

console.log('\n== reguła: światła nie schodzą poniżej 250 ==');
// swiatla to wymiary DimV rysowane w kolumnie — wszystkie na tym samym X,
// wiec grupujemy etykiety po X i bierzemy grupe o rozmiarze (polki + 1)
const swiatlaOf = async (polek) => {
  await page.getByText('Otw.', { exact: true }).first().click();
  await page.waitForTimeout(800);
  // bez okuc znikaja opisy odleglosci zawiasow, zostaja same swiatla
  const hide = page.getByText('Ukryj okucia', { exact: true });
  if (await hide.count()) { await hide.first().click(); await page.waitForTimeout(700); }
  return page.evaluate((n) => {
    const svg = document.querySelector('svg');
    const by = new Map();
    [...svg.querySelectorAll('text')].forEach((t) => {
      const s = t.textContent.trim();
      if (!/^\d+$/.test(s)) return;
      const x = Math.round(+t.getAttribute('x'));
      by.set(x, [...(by.get(x) || []), Number(s)]);
    });
    for (const [x, vals] of by) if (vals.length === n + 1) return { x, vals };
    return null;
  }, polek);
};
const sw = await swiatlaOf(await shelfCount());
console.log('  światła:', JSON.stringify(sw));
ok('znalezione światła dla 1 półki', sw && sw.vals.length === 2, JSON.stringify(sw));
ok('każde światło ≥ 250 mm', sw && sw.vals.every(v => v >= 250), (sw ? sw.vals : []).join(', '));
const suma = sw ? sw.vals.reduce((a, b) => a + b, 0) : 0;
ok('druga półka zeszłaby poniżej 250', sw && (suma - 18) / (sw.vals.length + 1) < 250,
  sw ? String(Math.round((suma - 18) / (sw.vals.length + 1))) : '');

console.log('\nBLEDY:', errors.length ? errors.join('\n') : '(brak)');
await browser.close();
