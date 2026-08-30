import pw from '/opt/node22/lib/node_modules/playwright/index.js';
const { chromium } = pw;
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const page = await (await browser.newContext({ viewport: { width: 1500, height: 1100 } })).newPage();
const errors = [];
page.on('pageerror', (e) => errors.push('[pageerror] ' + e.message));
page.on('console', (m) => { if (m.type() === 'error' && !/favicon|404/.test(m.text())) errors.push('[console] ' + m.text()); });
const ok = (l, c, e = '') => console.log((c ? '  OK   ' : '  BLAD ') + l + (e ? ' — ' + e : ''));
await page.goto('http://127.0.0.1:5199/standalone-local.html', { waitUntil: 'networkidle', timeout: 30000 });
await page.evaluate(() => { try { localStorage.clear(); } catch (e) {} });
await page.reload({ waitUntil: 'networkidle', timeout: 30000 });
await page.waitForTimeout(3000);
const card = (re) => page.locator('section').filter({ has: page.locator('h2', { hasText: re }) }).first();

console.log('=== nowe funkcje na ścieżce GitHub Pages ===');
const hw = await card(/^Produkty do zamówienia/).innerText();
/* Nowy projekt startuje z szablonu „Szafka stojąca", wiec zawieszek na starcie
   nie ma — pojawiaja sie dopiero po zdjeciu cokolu, nizej w tej suicie. */
['Konfirmat', 'Zaślepka na konfirmat', 'Kołek podporowy', 'Zszywka'].forEach((n) =>
  ok('produkt: ' + n, hw.includes(n)));
ok('szafka stojąca nie ma zawieszek', !/Zawieszka meblowa/.test(hw));

const mont = card(/^Montaż półek i zawieszenie$/);
ok('karta montażu półek', await mont.count() === 1);
await mont.locator('h2').click();
await page.waitForTimeout(400);
await mont.getByText('Konfirmaty', { exact: true }).click();
await page.waitForTimeout(800);
ok('przełącznik montażu działa', !(await card(/^Produkty do zamówienia/).innerText()).includes('Kołek podporowy'));
await mont.getByText('Kołki podporowe', { exact: true }).click();
await page.waitForTimeout(700);

await page.getByText('Otw.', { exact: true }).first().click();
await page.waitForTimeout(900);
const pins = await page.evaluate(() => {
  const svg = document.querySelector('svg');
  return {
    circles: [...svg.querySelectorAll('circle')].filter(c => Math.round(+c.getAttribute('r')) === 5).length,
    otw: [...svg.querySelectorAll('text')].map(t => t.textContent.trim()).filter(t => /^otw\. \d+$/.test(t)),
    legenda: [...svg.querySelectorAll('text')].map(t => t.textContent.trim()).find(t => /^otw\. —/.test(t)) || null,
  };
});
ok('kołki na rysunku', pins.circles === 2, String(pins.circles));
ok('wysokości otworów opisane', pins.otw.length === 1, pins.otw.join(', '));
ok('legenda bazy wymiaru', /dolnej krawędzi boku/.test(pins.legenda || ''), pins.legenda);
// przelacz baze na dno — wartosci maja zejsc o grubosc dna
await mont.getByText('Dna szafki', { exact: true }).click();
await page.waitForTimeout(900);
const pins2 = await page.evaluate(() => {
  const svg = document.querySelector('svg');
  const ts = [...svg.querySelectorAll('text')].map(t => t.textContent.trim());
  return { otw: ts.filter(t => /^otw\. \d+$/.test(t)), legenda: ts.find(t => /^otw\. —/.test(t)) || null };
});
ok('baza "od dna" przelicza wysokości',
  pins2.otw.every((v, i) => Number(v.replace('otw. ', '')) === Number(pins.otw[i].replace('otw. ', '')) - 18),
  pins.otw.join(',') + ' → ' + pins2.otw.join(','));
ok('legenda zmieniła bazę', /górnego lica dna/.test(pins2.legenda || ''), pins2.legenda);
await mont.getByText('Krawędzi boku', { exact: true }).click();
await page.waitForTimeout(600);
/* Zawieszki pokazuja sie tylko szafce wiszacej, a nowy projekt startuje
   z szablonu „Szafka stojąca" — najpierw zdejmujemy cokol. */
const cok = card(/^Cokół$/);
await cok.locator('h2').click();
await page.waitForTimeout(300);
const cokChk = cok.locator('input[type=checkbox]').first();
if (await cokChk.isChecked()) { await cokChk.click(); await page.waitForTimeout(800); }
await cok.locator('h2').click();
await page.waitForTimeout(300);
// zawieszki na haczykach
await mont.getByText('Na haczykach', { exact: true }).click();
await page.waitForTimeout(800);
const hw2 = await card(/^Produkty do zamówienia/).innerText();
ok('bez cokołu doszły zawieszki', /Zawieszka meblowa/.test(hw2), hw2.slice(0, 120));
ok('haczyki zamiast listwy', !/Listwa montażowa/.test(hw2) && /Hak \/ wkręt/.test(hw2));
await mont.getByText('Na listwie', { exact: true }).click();
await page.waitForTimeout(600);

const plyty = card(/^Płyty$/);
await plyty.locator('h2').click();
await page.waitForTimeout(400);
await plyty.getByText('Rysuj strukturę słojów zamiast gładkiego koloru').click();
await page.waitForTimeout(900);
const tex = await page.evaluate(() => {
  const svg = document.querySelector('svg');
  return { pat: svg.querySelectorAll('pattern').length,
    urls: [...svg.querySelectorAll('rect')].filter(r => /^url\(/.test(r.getAttribute('fill') || '')).length };
});
ok('struktura słojów renderuje się', tex.pat > 0 && tex.urls > 0, JSON.stringify(tex));
await plyty.getByText('Kierunek usłojenia ma znaczenie', { exact: true }).click();
await page.waitForTimeout(700);
await card(/^Formatki do zamówienia$/).getByRole('button', { name: 'Rozkrój na płycie' }).click();
await page.waitForTimeout(2500);
const plan = await page.evaluate(() => {
  const sec = [...document.querySelectorAll('section')].find(s => /^Rozkrój na płycie/.test((s.querySelector('h2') || {}).textContent || ''));
  return sec ? { txt: sec.innerText.includes('kierunek słojów'), paths: sec.querySelectorAll('path').length } : null;
});
ok('strzałki słojów w rozkroju', plan && plan.txt && plan.paths > 0, JSON.stringify(plan));

await page.getByText('+ szafka', { exact: true }).click();
await page.waitForTimeout(1200);
const hdr = await card(/^Formatki całego projektu/).evaluate((s) => [...s.querySelectorAll('thead th')].map(t => t.textContent.trim()));
ok('kolumna "Szafka" w zestawieniu projektu', hdr.includes('Szafka'), hdr.join(' | '));


console.log('\n=== ceny startowe ===');
const wyc = card(/^Wycena$/);
await wyc.locator('h2').click();
await page.waitForTimeout(500);
const priceRow = async (re) => wyc.evaluate((sec, src) => {
  const rx = new RegExp(src);
  const tr = [...sec.querySelectorAll('tbody tr')].find(t => rx.test(t.innerText));
  if (!tr) return null;
  const td = [...tr.querySelectorAll('td')];
  return { qty: td[1].innerText.trim(), cena: tr.querySelector('input')?.value, ph: tr.querySelector('input')?.placeholder, wart: td[3].innerText.trim() };
}, re.source);
ok('obrzeże 3,38 brutto', (await priceRow(/Obrzeże/))?.ph === '3.38', JSON.stringify(await priceRow(/Obrzeże/)));
ok('oklejanie 8,86 i pełne metry', (await priceRow(/Oklejanie/))?.ph === '8.86'
  && /^\d+ mb$/.test((await priceRow(/Oklejanie/))?.qty || ''), JSON.stringify(await priceRow(/Oklejanie/)));
// rozkroj moze byc juz policzony wczesniej w tym tescie
if (await wyc.getByRole('button', { name: 'Policz rozkrój' }).count()) {
  await wyc.getByRole('button', { name: 'Policz rozkrój' }).click();
  await page.waitForTimeout(3000);
}
// domyslny dekor to dab sonoma, wiec cena kolorowa
ok('płyta w dekorze → 240 brutto', (await priceRow(/^Płyta /))?.ph === '240', JSON.stringify(await priceRow(/^Płyta /)));
ok('formatowanie 51,66 brutto', (await priceRow(/Formatowanie/))?.ph === '51.66', JSON.stringify(await priceRow(/Formatowanie/)));
ok('HDF 3 → 70 brutto', (await priceRow(/HDF/))?.ph === '70', JSON.stringify(await priceRow(/HDF/)));
ok('zawias 3 zł', (await priceRow(/Zawias/))?.ph === '3', JSON.stringify(await priceRow(/Zawias/)));
ok('zaślepki w opakowaniach po 0,7', (await priceRow(/Zaślepka/))?.ph === '0.7'
  && /op\./.test((await priceRow(/Zaślepka/))?.qty || ''), JSON.stringify(await priceRow(/Zaślepka/)));
ok('suma brutto', /z\u0142 brutto/.test(await wyc.innerText()));
ok('kwoty z groszami', /\.\d\d$/.test((await priceRow(/^Płyta /))?.wart || ''), (await priceRow(/^Płyta /))?.wart);

console.log('\nBLEDY:', errors.length ? errors.join('\n') : '(brak)');
await browser.close();
