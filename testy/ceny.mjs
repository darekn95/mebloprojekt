import pw from '/opt/node22/lib/node_modules/playwright/index.js';
const { chromium } = pw;
const S = './';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const page = await (await browser.newContext({ viewport: { width: 1500, height: 1200 } })).newPage();
const errors = [];
page.on('pageerror', (e) => errors.push('[pageerror] ' + e.message));
page.on('console', (m) => { if (m.type() === 'error' && !/favicon|404/.test(m.text())) errors.push('[console] ' + m.text()); });
const ok = (l, c, e = '') => console.log((c ? '  OK   ' : '  BLAD ') + l + (e ? ' — ' + e : ''));
await page.goto('http://127.0.0.1:5205/mebloprojekt-app.html', { waitUntil: 'networkidle' });
await page.evaluate(() => { try { localStorage.clear(); } catch (e) {} });
await page.reload({ waitUntil: 'networkidle' });
await page.waitForTimeout(1500);
const card = (re) => page.locator('section').filter({ has: page.locator('h2', { hasText: re }) }).first();
const wyc = card(/^Wycena$/);
await wyc.locator('h2').click();
await page.waitForTimeout(400);
const dump = async () => wyc.evaluate((sec) => ({
  rows: [...sec.querySelectorAll('tbody tr')].map(tr => {
    const td = [...tr.querySelectorAll('td')];
    const inp = tr.querySelector('input');
    return { label: td[0].innerText.trim().split('\n')[0], qty: td[1].innerText.trim(),
      cena: inp ? inp.value : null, ph: inp ? inp.placeholder : null, wart: td[3].innerText.trim() };
  }),
  suma: (sec.innerText.match(/RAZEM\s+([\d.,]+)/i) || [])[1] || null,
  zlSuffix: /z\u0142 brutto/.test(sec.innerText),
}));

// bez rozkroju: obrzeze + oklejanie od razu
let d = await dump();
d.rows.forEach(r => console.log('    ', JSON.stringify(r)));
const find = (re) => d.rows.find(r => re.test(r.label));
ok('obrzeże 22 × 2 mm — domyślna 3,38 brutto', find(/Obrzeże/)?.ph === '3.38', JSON.stringify(find(/Obrzeże/)));
ok('oklejanie — domyślna 8,86 brutto', find(/Oklejanie/)?.ph === '8.86', JSON.stringify(find(/Oklejanie/)));

// policz rozkroj -> plyta + formatowanie
await wyc.getByRole('button', { name: 'Policz rozkrój' }).click();
await page.waitForTimeout(2500);
d = await dump();
console.log('\n  po rozkroju:');
d.rows.forEach(r => console.log('    ', JSON.stringify(r)));
const f = (re) => d.rows.find(r => re.test(r.label));
// domyslny dekor plyty to dab sonoma, wiec cena kolorowa
ok('płyta laminowana 18 (dekor) → 240 brutto', f(/^Płyta /)?.ph === '240', JSON.stringify(f(/^Płyta /)));
ok('formatowanie płyty → 51,66 brutto', f(/Formatowanie/)?.ph === '51.66', JSON.stringify(f(/Formatowanie/)));
ok('formatowanie liczone od arkusza', /ark\./.test(f(/Formatowanie/)?.qty || ''), f(/Formatowanie/)?.qty);
ok('HDF 3 → 70 zł brutto', f(/HDF/)?.ph === '70', JSON.stringify(f(/HDF/)));

// oklejanie w gore do pelnego metra
const mb = Number((f(/Obrzeże/)?.qty || '').replace(' mb', '').replace(',', '.'));
const okl = Number((f(/Oklejanie/)?.qty || '').replace(' mb', '').replace(',', '.'));
console.log('  obrzeże', mb, 'mb → oklejanie', okl, 'mb');
ok('oklejanie zaokrąglone w górę do pełnego metra', okl === Math.ceil(mb) && Number.isInteger(okl), `${mb} → ${okl}`);

// wartosci = ilosc x cena
const val = (r) => Number((r.wart || '0').replace(',', '.'));
const q = (r) => Number((r.qty || '0').replace(/[^\d.,]/g, '').replace(',', '.'));
[/^Płyta /, /HDF/, /Formatowanie/, /Obrzeże/, /Oklejanie/].forEach((re) => {
  const r = f(re);
  const cena = Number(r.cena || r.ph);
  const expect = Math.round(q(r) * cena * 100) / 100;
  ok('wartość ' + r.label, Math.abs(val(r) - expect) < 0.02, `${q(r)} × ${cena} = ${expect}, w tabeli ${val(r)}`);
});
console.log('  RAZEM:', d.suma);

// nadpisanie ceny wygrywa i przezywa przeladowanie
const inp = wyc.locator('tbody tr').filter({ hasText: 'Obrzeże' }).locator('input');
await inp.fill('3.10');
await page.waitForTimeout(900);
d = await dump();
ok('własna cena nadpisuje domyślną', Number(f(/Obrzeże/)?.cena) === 3.1, f(/Obrzeże/)?.cena);
await page.reload({ waitUntil: 'networkidle' });
await page.waitForTimeout(2500);
await card(/^Wycena$/).locator('h2').click();
await page.waitForTimeout(500);
d = await dump();
ok('własna cena przetrwała przeładowanie', Number(f(/Obrzeże/)?.cena) === 3.1, f(/Obrzeże/)?.cena);
ok('reszta cen domyślnych działa dalej', f(/Oklejanie/)?.ph === '8.86' && f(/Oklejanie/)?.wart !== '—', JSON.stringify(f(/Oklejanie/)));

// wyczyszczenie pola = zero, a nie powrot do domyslnej
const inp2 = card(/^Wycena$/).locator('tbody tr').filter({ hasText: 'Oklejanie' }).locator('input');
await inp2.fill('0');
await page.waitForTimeout(900);
d = await dump();
ok('wpisane 0 zeruje pozycję', f(/Oklejanie/)?.wart === '—', JSON.stringify(f(/Oklejanie/)));
await inp2.fill('');
await page.waitForTimeout(900);
d = await dump();
ok('puste pole wraca do domyślnej', f(/Oklejanie/)?.wart !== '—' && f(/Oklejanie/)?.ph === '8.86', JSON.stringify(f(/Oklejanie/)));

console.log('\n  == okucia ==');
// nozki pojawiaja sie dopiero po ich wlaczeniu
const nogi = card(/^Nóżki$/);
await nogi.locator('h2').click();
await page.waitForTimeout(300);
await nogi.getByText('Nóżki pod szafką', { exact: true }).click();
await page.waitForTimeout(1000);
d = await dump();
const hwRow = (re) => d.rows.find(r => re.test(r.label));
[['Zawias', '3'], ['Nóżka regulowana', '2.3'], ['Zaślepka na konfirmat', '0.7']].forEach(([n, p]) => {
  const r = hwRow(new RegExp('^' + n));
  ok('domyślna cena: ' + n, r && r.ph === p, JSON.stringify(r));
});
ok('zaślepki liczone w blistrach po 25', /op\./.test(hwRow(/^Zaślepka/)?.qty || ''), hwRow(/^Zaślepka/)?.qty);
ok('suma podana brutto', d.zlSuffix);

const bb = await card(/^Wycena$/).boundingBox();
if (bb) await page.screenshot({ path: S + 'shot-ceny.png', clip: { x: bb.x, y: Math.max(0, bb.y), width: bb.width, height: Math.min(760, bb.height) } });
console.log('\nBLEDY:', errors.length ? errors.join('\n') : '(brak)');
await browser.close();
