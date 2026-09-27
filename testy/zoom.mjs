/* Powiekszanie rysunku: przyciski − / + / Dopasuj, przesuwanie przeciaganiem,
   powrot do 100% przy zmianie widoku, pelny ekran z Esc, a w 3D przeciaganie
   obraca, a Shift + przeciaganie przesuwa. */
import pw from '/opt/node22/lib/node_modules/playwright/index.js';
const URL = process.env.STD ? 'http://127.0.0.1:5199/standalone-local.html'
  : 'http://127.0.0.1:5205/mebloprojekt-app.html';
const ok = (l, c, e = '') => console.log((c ? '  OK   ' : '  BLAD ') + l + (e ? ' — ' + e : ''));
const b = await pw.chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const page = await (await b.newContext({ viewport: { width: 1366, height: 768 } })).newPage();
const errors = []; page.on('pageerror', (e) => errors.push(e.message));
await page.goto(URL, { waitUntil: 'networkidle' });
await page.evaluate(() => { try { localStorage.clear(); } catch (e) {} });
await page.reload({ waitUntil: 'networkidle' });
await page.waitForTimeout(1800);
// szablon: szafka narozna z ramieniem — rysunek ciagu jest szeroki
await page.locator('select[title="Dodaj szafkę z gotowego szablonu"]').first().selectOption('naroznikL');
await page.waitForTimeout(2200);
const pick = async (l) => { await page.getByRole('button', { name: l, exact: true }).first().click(); await page.waitForTimeout(700); };
await pick('Ciąg');
const stan = () => page.evaluate(() => {
  const k = document.getElementById('rysunek'); const svg = k.querySelector('svg'); const r = svg.getBoundingClientRect();
  const vb = svg.viewBox.baseVal; const ramka = svg.closest('.zoom-on, .zoom-fit');
  return { zoom: k.querySelector('[data-el="zoom"]').textContent, tresc: Math.round(Math.min(r.width, r.height * vb.width / vb.height)),
    sl: ramka.scrollLeft, st: ramka.scrollTop, przewija: ramka.scrollWidth > ramka.clientWidth };
});
const s0 = await stan(); console.log('     100%: ' + JSON.stringify(s0));
ok('na starcie 100%, bez przewijania', s0.zoom === '100%' && !s0.przewija, JSON.stringify(s0));
await page.getByRole('button', { name: '+', exact: true }).click(); await page.waitForTimeout(400);
const s1 = await stan();
ok('„+" daje 125% dopasowanego rysunku', s1.zoom === '125%' && Math.abs(s1.tresc / s0.tresc - 1.25) < 0.03, (s1.tresc / s0.tresc).toFixed(2));
ok('powiększony rysunek się przewija', s1.przewija, JSON.stringify(s1));
await page.getByRole('button', { name: '+', exact: true }).click(); await page.getByRole('button', { name: '+', exact: true }).click(); await page.waitForTimeout(400);
const s2 = await stan();
ok('trzy razy „+" to 200%', s2.zoom === '200%' && Math.abs(s2.tresc / s0.tresc - 2) < 0.05, (s2.tresc / s0.tresc).toFixed(2));
// przeciagniecie
const box = await page.locator('#rysunek .zoom-on').boundingBox();
await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
await page.mouse.down(); await page.mouse.move(box.x + box.width / 2 - 200, box.y + box.height / 2 - 100, { steps: 8 }); await page.mouse.up();
const s3 = await stan();
ok('przeciąganie przesuwa rysunek', s3.sl > s2.sl + 100, JSON.stringify(s3));
await page.getByRole('button', { name: 'Dopasuj', exact: true }).click(); await page.waitForTimeout(400);
ok('„Dopasuj" wraca do 100%', (await stan()).zoom === '100%');
await page.getByRole('button', { name: '+', exact: true }).click(); await pick('Otw.');
ok('zmiana widoku wraca do 100%', (await stan()).zoom === '100%');
// pelny ekran
await page.getByRole('button', { name: 'Pełny ekran' }).click(); await page.waitForTimeout(500);
const pe = await page.evaluate(() => { const ov = document.getElementById('rysunek').parentElement;
  return [[10, 10], [683, 760], [1356, 400]].every(([x, y]) => ov.contains(document.elementFromPoint(x, y))); });
ok('pełny ekran przykrywa całe okno', pe);
await page.keyboard.press('Escape'); await page.waitForTimeout(400);
ok('Esc zamyka pełny ekran', await page.getByRole('button', { name: 'Pełny ekran' }).count() === 1
  && await page.evaluate(() => getComputedStyle(document.getElementById('rysunek').parentElement).position !== 'fixed'));
// 3D: przeciaganie obraca, shift przesuwa
await pick('3D');
await page.getByRole('button', { name: '+', exact: true }).click(); await page.getByRole('button', { name: '+', exact: true }).click(); await page.waitForTimeout(400);
const pts = () => page.evaluate(() => document.querySelector('#rysunek svg polygon').getAttribute('points'));
const b3 = await page.locator('#rysunek .zoom-on').boundingBox();
const pA = await pts(); const sA = await stan();
await page.mouse.move(b3.x + b3.width / 2, b3.y + 200); await page.mouse.down(); await page.mouse.move(b3.x + b3.width / 2 + 120, b3.y + 200, { steps: 6 }); await page.mouse.up();
const pB = await pts(); const sB = await stan();
ok('3D: przeciąganie obraca, nie przesuwa', pA !== pB && sA.sl === sB.sl);
await page.keyboard.down('Shift');
await page.mouse.move(b3.x + b3.width / 2, b3.y + 200); await page.mouse.down(); await page.mouse.move(b3.x + b3.width / 2 - 150, b3.y + 200, { steps: 6 }); await page.mouse.up();
await page.keyboard.up('Shift');
const pC = await pts(); const sC = await stan();
ok('3D: Shift + przeciąganie przesuwa, nie obraca', pB === pC && sB.sl !== sC.sl);
console.log('\nBLEDY:', errors.length ? errors.join('; ') : '(brak)');
await b.close();
