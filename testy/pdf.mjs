import pw from '/opt/node22/lib/node_modules/playwright/index.js';
const { chromium } = pw;
const URL = 'http://127.0.0.1:5205/mebloprojekt-app.html';
const S = './';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const page = await (await browser.newContext({ viewport: { width: 1440, height: 1050 }, acceptDownloads: true })).newPage();
const errors = [];
page.on('pageerror', (e) => errors.push('[pageerror] ' + e.message));
await page.goto(URL, { waitUntil: 'networkidle' });
await page.evaluate(() => { try { localStorage.clear(); } catch (e) {} });
await page.reload({ waitUntil: 'networkidle' });
await page.waitForTimeout(1500);
const ok = (l, c, e = '') => console.log((c ? '  OK   ' : '  BLAD ') + l + (e ? ' — ' + e : ''));

// --- przyciski w naglowku ---
const btn = (n) => page.getByRole('button', { name: n, exact: true });
ok('"Zapisz do pliku" istnieje', await btn('Zapisz do pliku').count() === 1);
ok('"Kopiuj projekt" usunięty', await btn('Kopiuj projekt').count() === 0);
ok('"Wklej projekt" usunięty', await btn('Wklej projekt').count() === 0);
ok('"Wczytaj plik" nadal jest', (await page.getByText('Wczytaj plik', { exact: true }).count()) >= 1);
ok('"Zestawienie PDF" istnieje', await btn('Zestawienie PDF').count() === 1);

// --- zapis do pliku ---
await page.locator('input[placeholder="Projekt bez nazwy"]').first().fill('Kuchnia / test:1');
await page.waitForTimeout(500);
const [dl] = await Promise.all([
  page.waitForEvent('download', { timeout: 8000 }).catch(() => null),
  btn('Zapisz do pliku').click(),
]);
ok('plik pobrany', !!dl, dl ? dl.suggestedFilename() : 'brak zdarzenia download');
if (dl) {
  const path = S + 'dl-' + dl.suggestedFilename();
  await dl.saveAs(path);
  const txt = await import('fs').then(m => m.readFileSync(path, 'utf8'));
  const j = JSON.parse(txt);
  ok('plik to poprawny JSON projektu', j.name === 'Kuchnia / test:1' && Array.isArray(j.items), 'name=' + JSON.stringify(j.name));
  ok('nazwa pliku bez znaków zakazanych', !/[\\/:*?"<>|]/.test(dl.suggestedFilename()), dl.suggestedFilename());
}

// --- zestawienie: druga szafka, zeby sprawdzic wielostronicowosc ---
await page.getByText('+ szafka', { exact: true }).click();
await page.waitForTimeout(800);

// zestawienie renderuje sie tylko na czas druku, wiec podmieniamy window.print
await page.evaluate(() => { window.__printed = 0; window.print = () => { window.__printed++; }; });
await btn('Zestawienie PDF').click();
await page.waitForTimeout(1200);
ok('window.print wywołane', await page.evaluate(() => window.__printed) === 1);
ok('zestawienie znika z ekranu po druku', await page.locator('.print-only').count() === 0);

// --- struktura raportu mierzona w momencie druku ---
await page.evaluate(() => {
  window.__snap = null;
  window.print = () => {
    const rep = document.querySelector('.print-only');
    if (!rep) return;
    window.__snap = {
      pages: rep.querySelectorAll('.rp-page').length,
      svgs: rep.querySelectorAll('svg').length,
      tables: rep.querySelectorAll('table.rp-tbl').length,
      hasFormatki: rep.innerText.includes('Formatki do zam'),
      hasProdukty: rep.innerText.includes('Produkty do zam'),
      hasZbiorcza: rep.innerText.includes('Formatki całego projektu'),
      widoki: rep.innerText.match(/Widok [a-ząćęłńóśźż ]+/g) || [],
      html: rep.outerHTML,
    };
  };
});
await btn('Zestawienie PDF').click();
await page.waitForTimeout(1500);
const m = await page.evaluate(() => {
  const s = window.__snap;
  return s ? { ...s, html: undefined, htmlLen: s.html.length } : null;
});
if (!m) { ok('raport w DOM w chwili druku', false); }
else {
  ok('raport w DOM w chwili druku', true, Math.round(m.htmlLen / 1024) + ' KB HTML');
  ok('strony: 2 szafki x 2 + zbiorcza + rozkrój = 6', m.pages === 6, String(m.pages));
  ok('rysunki: 4 widoki x 2 szafki + arkusze rozkroju', m.svgs >= 8, String(m.svgs));
  ok('tabele: (formatki + produkty + wiercenia) x 2 + zbiorcze + rozkrój = 9', m.tables === 9, String(m.tables));
  ok('zbiorcza lista projektu', m.hasZbiorcza);
  ok('sekcja formatek', m.hasFormatki);
  ok('sekcja produktow', m.hasProdukty);
  ok('opisane cztery widoki', [...new Set(m.widoki.map(t => t.trim()))].length === 4, [...new Set(m.widoki.map(t => t.trim()))].join(' | '));
}

// --- prawdziwy PDF z wyciagnietego raportu ---
const html = await page.evaluate(() => window.__snap.html);
const fs = await import('fs');
fs.writeFileSync(S + 'report.html',
  '<!doctype html><meta charset="utf-8"><style>@media screen{.print-only{display:block!important}}' +
  'body{margin:0;font-family:ui-sans-serif,system-ui,sans-serif}' +
  '.rp-page{page-break-after:always;padding:10mm}' +
  '.rp-tbl{width:100%;border-collapse:collapse;font-size:9pt}' +
  '.rp-tbl th,.rp-tbl td{border:1px solid #d6d3d1;padding:3px 5px;text-align:left}' +
  '.rp-tbl th{background:#f5f5f4;font-weight:600}' +
  '.rp-tbl td.num,.rp-tbl th.num{text-align:right;font-family:ui-monospace,monospace}' +
  '</style>' + html);
const p2 = await browser.newPage();
await p2.goto('file://' + S + 'report.html', { waitUntil: 'networkidle' });
await p2.pdf({ path: S + 'zestawienie.pdf', format: 'A4', printBackground: true });
await p2.screenshot({ path: S + 'shot-report1.png', fullPage: false, clip: { x: 0, y: 0, width: 800, height: 1000 } });
const st = fs.statSync(S + 'zestawienie.pdf');
ok('PDF wygenerowany', st.size > 20000, Math.round(st.size / 1024) + ' KB');
await p2.close();

console.log('\nBLEDY:', errors.length ? errors.join('\n') : '(brak)');
await browser.close();
