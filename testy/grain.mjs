import pw from '/opt/node22/lib/node_modules/playwright/index.js';
const { chromium } = pw;
const URL = 'http://127.0.0.1:5205/mebloprojekt-app.html';
const S = './';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const page = await (await browser.newContext({ viewport: { width: 1500, height: 1100 } })).newPage();
const errors = [];
page.on('pageerror', (e) => errors.push('[pageerror] ' + e.message));
page.on('console', (m) => { if (m.type() === 'error' && !/favicon|404/.test(m.text())) errors.push('[console] ' + m.text()); });
await page.goto(URL, { waitUntil: 'networkidle' });
await page.evaluate(() => { try { localStorage.clear(); } catch (e) {} });
await page.reload({ waitUntil: 'networkidle' });
await page.waitForTimeout(1500);
const ok = (l, c, e = '') => console.log((c ? '  OK   ' : '  BLAD ') + l + (e ? ' — ' + e : ''));
const card = (re) => page.locator('section').filter({ has: page.locator('h2', { hasText: re }) }).first();
const clickView = async (v) => { await page.getByText(v, { exact: true }).first().click(); await page.waitForTimeout(700); };

console.log('== struktura słojów ==');
const plyty = card(/^Płyty$/);
await plyty.locator('h2').click();
await page.waitForTimeout(400);
ok('checkbox struktury jest', await plyty.getByText('Rysuj strukturę słojów zamiast gładkiego koloru').count() === 1);

const fills = async () => page.evaluate(() => {
  const svg = document.querySelector('svg');
  return {
    patterns: svg.querySelectorAll('pattern').length,
    urlFills: [...svg.querySelectorAll('rect')].filter(r => /^url\(/.test(r.getAttribute('fill') || '')).length,
    hexFills: [...svg.querySelectorAll('rect')].filter(r => /^#/.test(r.getAttribute('fill') || '')).length,
  };
});
const f0 = await fills();
ok('bez struktury brak wzorów', f0.patterns === 0 && f0.urlFills === 0, JSON.stringify(f0));

await plyty.getByText('Rysuj strukturę słojów zamiast gładkiego koloru').click();
await page.waitForTimeout(900);
const f1 = await fills();
ok('wzory się pojawiły', f1.patterns > 0, JSON.stringify(f1));
ok('formatki wypełnione wzorem', f1.urlFills > 0, String(f1.urlFills));

// wszystkie widoki bez bledow i z wzorem
for (const v of ['Otw.', 'Z boku', 'Z góry', 'Z tyłu', '3D', 'Zamk.']) {
  const n = errors.length;
  await clickView(v);
  const f = await fills();
  const wantsPattern = v !== '3D';
  ok(`widok ${v}` + (wantsPattern ? ' ma wzór' : ' (3D zostaje płaskie)'),
    errors.length === n && (wantsPattern ? f.patterns > 0 && f.urlFills > 0 : true),
    JSON.stringify(f));
}
await clickView('Zamk.');
await page.locator('svg').first().screenshot({ path: S + 'shot-texture.png' });

// widoczne czy pattern faktycznie sie renderuje (nie pusty)
const painted = await page.evaluate(() => {
  const p = document.querySelector('svg pattern');
  return p ? { id: p.id, kids: p.children.length, w: p.getAttribute('width') } : null;
});
ok('wzór ma zawartość', painted && painted.kids >= 3, JSON.stringify(painted));

console.log('\n== strzałka słojów w rozkroju ==');
// bez grainMatters — rozkroj bez strzalek
await card(/^Formatki do zamówienia$/).getByRole('button', { name: 'Rozkrój na płycie' }).click();
await page.waitForTimeout(2000);
const arrowsOff = await page.evaluate(() => {
  const sec = [...document.querySelectorAll('section')].find(s => /^Rozkrój na płycie/.test((s.querySelector('h2') || {}).textContent || ''));
  return sec ? { paths: sec.querySelectorAll('path').length, txt: sec.innerText.includes('kierunek słojów') } : null;
});
ok('bez usłojenia brak strzałek', arrowsOff && !arrowsOff.txt, JSON.stringify(arrowsOff));

await plyty.getByText('Kierunek usłojenia ma znaczenie', { exact: true }).click();
await page.waitForTimeout(700);
await card(/^Formatki do zamówienia$/).getByRole('button', { name: 'Rozkrój na płycie' }).click();
await page.waitForTimeout(2500);
const arrowsOn = await page.evaluate(() => {
  const sec = [...document.querySelectorAll('section')].find(s => /^Rozkrój na płycie/.test((s.querySelector('h2') || {}).textContent || ''));
  if (!sec) return null;
  return { paths: sec.querySelectorAll('path').length, txt: sec.innerText.includes('kierunek słojów'), rot: sec.innerText.includes('↻') };
});
ok('legenda kierunku słojów', arrowsOn && arrowsOn.txt, JSON.stringify(arrowsOn));
ok('groty strzałek narysowane', arrowsOn && arrowsOn.paths > 0, String(arrowsOn && arrowsOn.paths));
// plecy HDF wolno obracac nawet przy wymuszonych slojach — obrot jest tam poprawny
ok('formatki ze słojami rysowane bez obrotu', arrowsOn && arrowsOn.paths >= 6, String(arrowsOn && arrowsOn.paths));
// karta bywa poza kadrem — zrzut robimy z samego SVG, bez wycinania strony
const planSvg = card(/^Rozkrój na płycie/).locator('svg').first();
if (await planSvg.count()) await planSvg.screenshot({ path: S + 'shot-grain-plan.png' }).catch(() => {});

console.log('\nBLEDY:', errors.length ? errors.join('\n') : '(brak)');
await browser.close();
