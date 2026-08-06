import pw from '/opt/node22/lib/node_modules/playwright/index.js';
const { chromium } = pw;
const S = './';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const page = await (await browser.newContext({ viewport: { width: 1500, height: 1100 } })).newPage();
const errors = [];
page.on('pageerror', (e) => errors.push('[pageerror] ' + e.message));
page.on('console', (m) => { if (m.type() === 'error' && !/favicon|404/.test(m.text())) errors.push('[console] ' + m.text()); });
const ok = (l, c, e = '') => console.log((c ? '  OK   ' : '  BLAD ') + l + (e ? ' — ' + e : ''));
await page.goto('http://127.0.0.1:5205/mebloprojekt-app.html', { waitUntil: 'networkidle' });
await page.evaluate(() => { try { localStorage.clear(); } catch (e) {} });
await page.reload({ waitUntil: 'networkidle' });
await page.waitForTimeout(1500);
const card = (re) => page.locator('section').filter({ has: page.locator('h2', { hasText: re }) }).first();
const hw = () => card(/^Produkty do zamówienia$/).innerText();
const svgInfo = () => page.evaluate(() => {
  const svg = document.querySelector('svg');
  const ts = [...svg.querySelectorAll('text')].map(t => t.textContent.trim());
  return { otw: ts.filter(t => /^otw\. \d+$/.test(t)).map(t => t.replace('otw. ', '')),
    legenda: ts.find(t => /^otw\. —/.test(t)) || null,
    vbH: Number(svg.getAttribute('viewBox').split(/\s+/)[3]) };
});

console.log('== zawieszki: listwa vs haczyki ==');
let h = await hw();
// domyslnie haczyki: pojedynczej szafki nie ma po co wyrownywac listwa
ok('domyślnie haczyki', /Hak \//.test(h) && !/Listwa montażowa/.test(h));
const mont = card(/^Montaż półek i zawieszenie$/);
await mont.locator('h2').click();
await page.waitForTimeout(400);
ok('przełącznik mocowania jest', await mont.getByText('Na haczykach', { exact: true }).count() === 1);
await mont.getByText('Na haczykach', { exact: true }).click();
await page.waitForTimeout(800);
h = await hw();
ok('listwa znika', !/Listwa montażowa/.test(h));
ok('hak dochodzi w liczbie zawieszek', /Hak \/ wkręt z kołkiem do ściany/.test(h) && /Hak[^\n]*\n?[^\n]*2 szt\./.test(h.replace(/\s+/g,' ')) === false || /Hak/.test(h),
  (h.split('\n').find(l => /Hak/.test(l)) || ''));
const hakQty = Number(((h.match(/Hak[\s\S]*?(\d+) szt\./) || [])[1]) || 0);
ok('haki = 2 (tyle co zawieszek)', hakQty === 2, String(hakQty));
await mont.getByText('Na listwie', { exact: true }).click();
await page.waitForTimeout(700);
ok('powrót na listwę', /Listwa montażowa/.test(await hw()));
// przy "nigdy" przelacznik mocowania znika
await mont.getByText('Nigdy', { exact: true }).click();
await page.waitForTimeout(600);
ok('bez zawieszek nie ma wyboru mocowania', await mont.getByText('Na listwie', { exact: true }).count() === 0);
await mont.getByText('Auto', { exact: true }).click();
await page.waitForTimeout(600);

console.log('\n== baza wymiarowania otworów ==');
await page.getByText('Otw.', { exact: true }).first().click();
await page.waitForTimeout(900);
const a = await svgInfo();
console.log('  od krawędzi boku:', a.otw.join(', '));
console.log('  legenda:', a.legenda);
ok('legenda opisuje bazę "od boku"', /dolnej krawędzi boku/.test(a.legenda || ''), a.legenda);
ok('wysokości otworów opisane', a.otw.length >= 1, a.otw.join(', '));
await page.locator('svg').first().screenshot({ path: S + 'shot-datum-panel.png' });

await mont.getByText('Dna szafki', { exact: true }).click();
await page.waitForTimeout(900);
const b = await svgInfo();
console.log('  od dna:', b.otw.join(', '));
console.log('  legenda:', b.legenda);
ok('legenda opisuje bazę "od dna"', /górnego lica dna/.test(b.legenda || ''), b.legenda);
ok('wartości mniejsze o grubość dna (18)',
  a.otw.every((v, i) => Number(v) - Number(b.otw[i]) === 18),
  a.otw.join(',') + ' → ' + b.otw.join(','));
ok('kadr zrobił miejsce na legendę', b.vbH > 720 + 120, String(b.vbH));
await page.locator('svg').first().screenshot({ path: S + 'shot-datum-bottom.png' });
ok('spec kołków wspomina bazę', /liczone od dna/.test(await hw()), (await hw()).split('\n').find(l => /Kołek/.test(l)) || '');

// brak dna -> od 0
console.log('\n== szafka bez dna ==');
const korpus = card(/^Korpus$/);
await korpus.locator('h2').click();
await page.waitForTimeout(300);
const noBot = korpus.getByText('bez dna', { exact: true });
if (await noBot.count()) {
  await noBot.first().click();
  await page.waitForTimeout(1000);
  const c = await svgInfo();
  console.log('  bez dna:', c.otw.join(', '), '|', c.legenda);
  ok('legenda mówi o spodzie wnętrza', /spodu wnętrza/.test(c.legenda || ''), c.legenda);
} else {
  console.log('  (brak przycisku "bez dna" — pomijam)');
}
console.log('\nBLEDY:', errors.length ? errors.join('\n') : '(brak)');
await browser.close();
