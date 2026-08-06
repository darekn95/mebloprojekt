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

const drill = async () => {
  await page.evaluate(() => {
    window.__snap = null;
    window.print = () => {
      const rep = document.querySelector('.print-only');
      if (!rep) return;
      const t = [...rep.querySelectorAll('table.rp-tbl')]
        .find(x => [...x.querySelectorAll('th')].some(th => th.textContent.trim() === 'Otwory pod'));
      window.__snap = t ? [...t.querySelectorAll('tbody tr')].map(tr =>
        [...tr.querySelectorAll('td')].map(td => td.textContent.trim())) : null;
    };
  });
  await page.getByRole('button', { name: 'Zestawienie PDF', exact: true }).click();
  await page.waitForTimeout(1800);
  return page.evaluate(() => window.__snap);
};

console.log('== domyślna szafka: 2 drzwi, 1 półka ==');
let d = await drill();
(d || []).forEach(r => console.log('     ' + r.join(' | ')));
ok('tabela wierceń jest w PDF', !!d && d.length > 0);
ok('są oba boki', (d || []).some(r => r[0] === 'Bok lewy') && (d || []).some(r => r[0] === 'Bok prawy'), '');
ok('zawiasy opisane', (d || []).some(r => r[1] === 'zawias'), '');
ok('kołki półek opisane', (d || []).some(r => r[1] === 'kołek półki'), '');
const zaw = (d || []).find(r => r[1] === 'zawias');
console.log('  zawiasy:', zaw && zaw[2]);
ok('dwie wysokości zawiasów', zaw && zaw[2].split(',').length === 2, zaw && zaw[2]);
ok('puszka ⌀35 wspomniana', zaw && /⌀35/.test(zaw[3]), zaw && zaw[3]);
const kol = (d || []).find(r => r[1] === 'kołek półki');
ok('kołek ⌀5 z odsunięciami', kol && /⌀5/.test(kol[3]) && /37/.test(kol[3]), kol && kol[3]);

console.log('\n== kolumna z szufladami ==');
const struct = card(/^Struktura wnętrza$/);
await struct.getByText('Szuflady', { exact: true }).first().click();
await page.waitForTimeout(800);
for (let i = 0; i < 3; i++) { await page.getByText('+ szuflada', { exact: true }).first().click(); await page.waitForTimeout(500); }
await page.waitForTimeout(800);
d = await drill();
(d || []).forEach(r => console.log('     ' + r.join(' | ')));
const pr = (d || []).find(r => r[1] === 'prowadnica');
ok('prowadnice trafiły do wierceń', !!pr, '');
ok('prowadnice na obu bokach', (d || []).filter(r => r[1] === 'prowadnica').length === 2,
  String((d || []).filter(r => r[1] === 'prowadnica').length));
ok('NL w uwagach', pr && /NL \d+/.test(pr[3]), pr && pr[3]);
ok('kołki znikły (brak półek w kolumnie szuflad)', !(d || []).some(r => r[1] === 'kołek półki'), '');

console.log('\n== półki skręcane: bez kołków ==');
const mont = card(/^Montaż półek i zawieszenie$/);
await mont.locator('h2').click();
await page.waitForTimeout(400);
await mont.getByText('Konfirmaty', { exact: true }).click();
await page.waitForTimeout(900);
d = await drill();
ok('brak wierceń pod kołki', !(d || []).some(r => r[1] === 'kołek półki'), '');
console.log('\nBLEDY:', errors.length ? errors.join('\n') : '(brak)');
await browser.close();
