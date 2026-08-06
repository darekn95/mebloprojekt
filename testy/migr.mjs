import pw from '/opt/node22/lib/node_modules/playwright/index.js';
const { chromium } = pw;
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const page = await (await browser.newContext({ viewport: { width: 1500, height: 1100 } })).newPage();
const errors = [];
page.on('pageerror', (e) => errors.push('[pageerror] ' + e.message));
const ok = (l, c, e = '') => console.log((c ? '  OK   ' : '  BLAD ') + l + (e ? ' — ' + e : ''));
await page.goto('http://127.0.0.1:5205/mebloprojekt-app.html', { waitUntil: 'networkidle' });
// projekt zapisany poprzednia wersja: ceny netto + jedna zmieniona recznie
await page.evaluate(() => {
  localStorage.clear();
  localStorage.setItem('szafki:projekt', JSON.stringify({
    name: 'Stary', active: 0,
    prices: { 'plyta:Płyta laminowana 18': 181.38, ciecie: 42, obrzeze: 2.75, oklejanie: 9.99 },
    items: [{ cab: { name: 'Szafka 1' } }],
  }));
});
await page.reload({ waitUntil: 'networkidle' });
await page.waitForTimeout(2500);
const card = (re) => page.locator('section').filter({ has: page.locator('h2', { hasText: re }) }).first();
const wyc = card(/^Wycena$/);
await wyc.locator('h2').click();
await page.waitForTimeout(400);
if (await wyc.getByRole('button', { name: 'Policz rozkrój' }).count()) {
  await wyc.getByRole('button', { name: 'Policz rozkrój' }).click();
  await page.waitForTimeout(2500);
}
const row = async (re) => wyc.evaluate((sec, src) => {
  const rx = new RegExp(src);
  const tr = [...sec.querySelectorAll('tbody tr')].find(t => rx.test(t.innerText));
  if (!tr) return null;
  const td = [...tr.querySelectorAll('td')];
  return { cena: tr.querySelector('input')?.value, ph: tr.querySelector('input')?.placeholder, wart: td[3].innerText.trim() };
}, re.source);
console.log('  płyta:      ', JSON.stringify(await row(/^Płyta /)));
console.log('  formatowanie:', JSON.stringify(await row(/Formatowanie/)));
console.log('  obrzeże:    ', JSON.stringify(await row(/Obrzeże/)));
console.log('  oklejanie:  ', JSON.stringify(await row(/Oklejanie/)));
ok('stara cena netto płyty ustąpiła brutto', (await row(/^Płyta /))?.cena === '' && (await row(/^Płyta /))?.ph === '240');
ok('stare formatowanie ustąpiło', (await row(/Formatowanie/))?.cena === '' && (await row(/Formatowanie/))?.ph === '51.66');
ok('stare obrzeże ustąpiło', (await row(/Obrzeże/))?.cena === '' && (await row(/Obrzeże/))?.ph === '3.38');
ok('ręcznie zmieniona cena została nietknięta', Number((await row(/Oklejanie/))?.cena) === 9.99, (await row(/Oklejanie/))?.cena);
// recznie wpisana cena plyty pod stara nazwa ma przejsc na nowa etykiete
await page.evaluate(() => {
  localStorage.clear();
  localStorage.setItem('szafki:projekt', JSON.stringify({
    name: 'Stary2', active: 0,
    prices: { 'plyta:Płyta laminowana 18': 199 },
    items: [{ cab: { name: 'Szafka 1' } }],
  }));
});
await page.reload({ waitUntil: 'networkidle' });
await page.waitForTimeout(2500);
const wyc2 = card(/^Wycena$/);
await wyc2.locator('h2').click();
await page.waitForTimeout(400);
if (await wyc2.getByRole('button', { name: 'Policz rozkrój' }).count()) {
  await wyc2.getByRole('button', { name: 'Policz rozkrój' }).click();
  await page.waitForTimeout(2500);
}
const moved = await wyc2.evaluate((sec) => {
  const tr = [...sec.querySelectorAll('tbody tr')].find(t => /^Płyta /.test(t.querySelector('td').innerText.trim()));
  if (!tr) return null;
  return { label: tr.querySelector('td').innerText.trim(), cena: tr.querySelector('input').value };
});
console.log('  po przeniesieniu klucza:', JSON.stringify(moved));
ok('własna cena przeszła na nową etykietę', moved && Number(moved.cena) === 199, JSON.stringify(moved));

console.log('\nBLEDY:', errors.length ? errors.join('\n') : '(brak)');
await browser.close();
