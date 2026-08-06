import pw from '/opt/node22/lib/node_modules/playwright/index.js';
const { chromium } = pw;
const S = './';
const URL = process.env.STD ? 'http://127.0.0.1:5199/standalone-local.html'
  : 'http://127.0.0.1:5205/mebloprojekt-app.html';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const page = await (await browser.newContext({ viewport: { width: 1500, height: 1200 } })).newPage();
const errors = [];
page.on('pageerror', (e) => errors.push('[pageerror] ' + e.message));
page.on('console', (m) => { if (m.type() === 'error' && !/favicon|404/.test(m.text())) errors.push('[console] ' + m.text()); });
const ok = (l, c, e = '') => console.log((c ? '  OK   ' : '  BLAD ') + l + (e ? ' — ' + e : ''));
const uwagi = page.locator('section').filter({ has: page.locator('h2', { hasText: /^Uwagi$/ }) }).first();
const notes = () => page.evaluate(() => {
  const sec = [...document.querySelectorAll('section')].find((s) => /^Uwagi$/.test((s.querySelector('h2') || {}).textContent || ''));
  return sec ? [...sec.querySelectorAll('li')].map((li) => ({
    txt: li.textContent.trim(), btns: [...li.querySelectorAll('button')].map((b) => b.textContent.trim()),
  })) : [];
});
const view = async (v) => { await page.getByText(v, { exact: true }).first().click(); await page.waitForTimeout(800); };
await page.goto(URL, { waitUntil: 'networkidle' });

// dwa poziomy, w kazdym jedna szuflada — fronty spotykaja sie nad przegroda
const seed = async (patch = {}) => {
  await page.evaluate((p) => {
    localStorage.clear();
    const cab = Object.assign({
      name: 'T', W: 600, H: 720, D: 500,
      levels: [
        { h: null, cols: [{ kind: 'drawers', w: null, drawers: [{}] }] },
        { h: null, cols: [{ kind: 'drawers', w: null, drawers: [{}] }] },
      ],
    }, p);
    localStorage.setItem('szafki:projekt', JSON.stringify({ name: 'T', active: 0, prices: {}, items: [{ cab }] }));
  }, patch);
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(2200);
};
const gaps = () => page.evaluate(() => [...document.querySelectorAll('svg text')]
  .filter((t) => t.getAttribute('fill') === '#0f766e').map((t) => t.textContent.trim()));
const dims = () => page.evaluate(() => [...document.querySelectorAll('svg text')].map((t) => t.textContent.trim()));

console.log('== luzy przy dwóch poziomach ==');
await seed();
await page.getByText('Pokaż szczeliny', { exact: true }).first().click();
await page.waitForTimeout(500);
await view('Zamk.');
let g = await gaps();
console.log('     szczeliny:', g.join(', '));
// front dolny konczy sie na przegrodzie, gorny zaczyna sie na niej — miedzy nimi
// zostaje 18 - 2 x 7 = 4 mm, a do dna i wienca nie ma zadnej szczeliny
ok('szczelina nad przegrodą to 4 mm', g.includes('4'), g.join(', '));
ok('żadnej fałszywej szczeliny rzędu setek', !g.some((x) => Number(x) > 20), g.join(', '));
ok('fronty równe', (await dims()).filter((x) => /^596×/.test(x)).length === 2,
  (await dims()).filter((x) => /^596×/.test(x)).join(', '));

console.log('\n== szyna górnego poziomu siada na przegrodzie ==');
await view('Otw.');
let d = await dims();
console.log('     ', d.filter((x) => /szyna/.test(x)).join(', '));
// wnetrze 18..702 (684), dwa poziomy po 333 i przegroda 18: gora przegrody
// wypada 351 mm nad dnem korpusu — i tam ma siedziec szyna
ok('górna szyna równo na przegrodzie (351)', d.includes('szyna 351'),
  d.filter((x) => /szyna/.test(x)).join(', '));

console.log('\n== szczelina powyżej 5 mm zgłaszana z przyciskami ==');
await seed({ gaps: { edge: 2, between: 3, top: 3, bottom: 3, inset: 2, divOverlay: 5,
                     overBottom: 15, overTop: 15, underRail: 5 } });
let n = await notes();
const hint = n.find((x) => /Szczelina nad przegrodą/.test(x.txt));
console.log('     ' + (hint ? hint.txt + '  →  [' + hint.btns.join(' | ') + ']' : '(brak)'));
ok('ostrzeżenie o szczelinie 8 mm', !!hint && /8 mm/.test(hint.txt), hint && hint.txt);
ok('przycisk zwiększenia nałożenia', !!hint && hint.btns.some((b) => /^Zwiększ nałożenie do 6 mm$/.test(b)), hint && hint.btns);
ok('przycisk zmniejszenia nałożenia', !!hint && hint.btns.some((b) => /^Zmniejsz nałożenie do 4 mm$/.test(b)), hint && hint.btns);

await uwagi.getByRole('button', { name: /Zwiększ nałożenie do 6 mm/ }).first().click();
await page.waitForTimeout(900);
n = await notes();
ok('po zwiększeniu szczelina 6 mm dalej zgłaszana',
  n.some((x) => /Szczelina nad przegrodą to 6 mm/.test(x.txt)),
  (n.find((x) => /Szczelina/.test(x.txt)) || {}).txt);
await uwagi.getByRole('button', { name: /Zwiększ nałożenie do 7 mm/ }).first().click();
await page.waitForTimeout(900);
n = await notes();
ok('przy nałożeniu 7 mm ostrzeżenie znika', !n.some((x) => /Szczelina nad przegrodą/.test(x.txt)),
  (n.find((x) => /Szczelina/.test(x.txt)) || {}).txt);

console.log('\n== nałożenia frontów da się zmienić ==');
await seed();
const plyty = page.locator('section').filter({ has: page.locator('h2', { hasText: /^Luzy drzwi$/ }) }).first();
await plyty.locator('h2').click();
await page.waitForTimeout(400);
for (const lab of ['Nałożenie na przegrodę', 'Front szuflady na dno', 'Front szuflady na wieniec', 'Front poniżej prowadnicy']) {
  ok(`pole „${lab}" jest`, await plyty.getByText(lab, { exact: true }).count() === 1);
}

console.log('\n== widoki bez błędów ==');
for (const v of ['Zamk.', 'Otw.', 'Z boku', 'Z góry', 'Z tyłu', '3D']) {
  const k = errors.length;
  await view(v);
  ok(`widok ${v}`, errors.length === k, errors.slice(k).join('; '));
}
await view('Zamk.');
await page.locator('svg').first().screenshot({ path: S + 'shot-przegroda.png' });

console.log('\nBLEDY:', errors.length ? errors.join('\n') : '(brak)');
await browser.close();
