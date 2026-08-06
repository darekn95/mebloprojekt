import pw from '/opt/node22/lib/node_modules/playwright/index.js';
const { chromium } = pw;
const URL = 'http://127.0.0.1:5205/mebloprojekt-app.html';
const S = './';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const page = await (await browser.newContext({ viewport: { width: 1600, height: 1100 } })).newPage();
const errors = [];
page.on('pageerror', (e) => errors.push('[pageerror] ' + e.message));
page.on('console', (m) => { if (m.type() === 'error' && !/favicon|404/.test(m.text())) errors.push('[console] ' + m.text()); });
await page.goto(URL, { waitUntil: 'networkidle' });
await page.evaluate(() => { try { localStorage.clear(); } catch (e) {} });
await page.reload({ waitUntil: 'networkidle' });
await page.waitForTimeout(1500);
const ok = (l, c, e = '') => console.log((c ? '  OK   ' : '  BLAD ') + l + (e ? ' — ' + e : ''));
const card = (re) => page.locator('section').filter({ has: page.locator('h2', { hasText: re }) }).first();

// dwie szafki: druga wezsza, zeby czesc formatek byla wspolna a czesc nie
await page.getByText('+ szafka', { exact: true }).click();
await page.waitForTimeout(900);
const korpus = card(/^Korpus$/);
await korpus.locator('input[type=number]').first().fill('800');
await korpus.locator('input[type=number]').first().blur();
await page.waitForTimeout(900);

const proj = card(/^Formatki całego projektu/);
ok('karta zbiorcza jest', await proj.count() === 1);
const hdr = await proj.evaluate((s) => [...s.querySelectorAll('thead th')].map(t => t.textContent.trim()));
console.log('  nagłówki:', hdr.join(' | '));
ok('kolumna "Szafka" w nagłówku', hdr.includes('Szafka'), hdr.join(' | '));
ok('kolumna zaraz po "Element"', hdr[0] === 'Element' && hdr[1] === 'Szafka');

const rows = await proj.evaluate((s) => [...s.querySelectorAll('tbody tr')].map(tr =>
  [...tr.querySelectorAll('td')].map(td => td.innerText.trim()).join(' | ')));
rows.forEach(r => console.log('     ' + r));
ok('każdy wiersz ma nazwę szafki', rows.every(r => /Szafka [12]/.test(r.split('|')[1] || '')), rows[0]);

// bok jest identyczny w obu szafkach (720x500) -> wiersz z obiema nazwami i mnoznikami
const bok = rows.find(r => /^Bok/.test(r)) || '';
console.log('  wiersz boków:', bok);
ok('wspólny bok pokazuje obie szafki', /Szafka 1/.test(bok) && /Szafka 2/.test(bok), bok.split('|')[1]);
ok('wspólny bok ma rozbicie ilości', /×\s*\d/.test(bok.split('|')[1] || ''), bok.split('|')[1]);

// wieniec 600 istnieje tylko w szafce 1
const w600 = rows.find(r => /wieniec|Wieniec/.test(r) && /\|\s*564\s*\|/.test(r)) || '';
console.log('  wiersz wieńca 564 (tylko szafka 1):', w600);
ok('unikalna formatka bez mnożnika', w600 && !/×/.test(w600.split('|')[1] || ''), w600.split('|')[1]);

// zmiana nazwy szafki przechodzi do tabeli
await page.locator('input[placeholder="Szafka 1"], input[value="Szafka 2"]').first().fill('Pod zlew');
await page.waitForTimeout(900);
const rows2 = await proj.evaluate((s) => [...s.querySelectorAll('tbody tr')].map(tr =>
  [...tr.querySelectorAll('td')].map(td => td.innerText.trim()).join(' | ')));
ok('nowa nazwa szafki w tabeli', rows2.some(r => /Pod zlew/.test(r)), (rows2.find(r=>/Pod zlew/.test(r))||'').slice(0,70));

// zestawienie PDF ma te sama kolumne
await page.evaluate(() => {
  window.__snap = null;
  window.print = () => {
    const rep = document.querySelector('.print-only');
    if (!rep) return;
    const tbls = [...rep.querySelectorAll('table.rp-tbl')];
    const proj = tbls.find(t => [...t.querySelectorAll('th')].some(th => th.innerText.trim() === 'Szafka'));
    window.__snap = {
      cols: proj ? [...proj.querySelectorAll('thead th')].map(t => t.innerText.trim()) : null,
      firstRow: proj ? [...proj.querySelectorAll('tbody tr')][0].innerText.replace(/\s+/g, ' ') : null,
      lastRow: proj ? [...proj.querySelectorAll('tbody tr')].pop().innerText.replace(/\s+/g, ' ') : null,
      cells: proj ? [...proj.querySelectorAll('tbody tr')].map(r => r.querySelectorAll('td').length) : null,
    };
  };
});
await page.getByRole('button', { name: 'Zestawienie PDF', exact: true }).click();
await page.waitForTimeout(2000);
const snap = await page.evaluate(() => window.__snap);
ok('zbiorcza tabela w PDF ma kolumnę Szafka', !!snap && snap.cols && snap.cols.includes('Szafka'), JSON.stringify(snap && snap.cols));
if (snap) {
  console.log('  pierwszy wiersz PDF:', snap.firstRow);
  console.log('  wiersz "Razem":', snap.lastRow);
  ok('wiersz Razem trzyma się kolumn', /Razem/.test(snap.lastRow || ''), snap.lastRow);
  const body = (snap.cells || []).slice(0, -1);
  ok('każdy wiersz ma 7 komórek', body.length > 0 && body.every(n => n === 7), JSON.stringify([...new Set(body)]));
}

console.log('\nBLEDY:', errors.length ? errors.join('\n') : '(brak)');
await browser.close();
