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
  if (!sec) return [];
  return [...sec.querySelectorAll('li')].map((li) => ({
    txt: li.textContent.trim(), btns: [...li.querySelectorAll('button')].map((b) => b.textContent.trim()),
  }));
});
await page.goto(URL, { waitUntil: 'networkidle' });

// kolumna szuflad, front ~306 mm — auto dobiera bok 238
const seed = async (h) => {
  await page.evaluate((hh) => {
    localStorage.clear();
    const cab = {
      name: 'T', W: 900, H: 720, D: 500,
      plinth: { on: true, height: 100, mode: 'inbody', setback: 0 },
      levels: [{ h: null, cols: [
        { kind: 'doors', doors: 1, w: null },
        { kind: 'drawers', w: 270, drawers: [{ h: hh }, { h: hh }] },
      ] }],
    };
    localStorage.setItem('szafki:projekt', JSON.stringify({ name: 'T', active: 0, prices: {}, items: [{ cab }] }));
  }, h);
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(2200);
};

console.log('== bok na auto: żadnej podpowiedzi ==');
await seed('auto');
let n = await notes();
n.forEach((x) => console.log('     ' + x.txt.slice(0, 90) + '  →  [' + x.btns.join(' | ') + ']'));
ok('brak podpowiedzi o wyższym boku przy auto', !n.some((x) => /wyższy bok/.test(x.txt)),
  (n.find((x) => /wyższy bok/.test(x.txt)) || {}).txt);

console.log('\n== bok wybrany ręcznie na 127, a front uniesie 238 ==');
await seed(127);
n = await notes();
n.forEach((x) => console.log('     ' + x.txt.slice(0, 90) + '  →  [' + x.btns.join(' | ') + ']'));
const hint = n.find((x) => /wyższy bok/.test(x.txt));
ok('podpowiedź o wyższym boku jest', !!hint, JSON.stringify(n.map((x) => x.txt.slice(0, 50))));
ok('podpowiedź podaje 238 i obecne 127', !!hint && /238/.test(hint.txt) && /127/.test(hint.txt), hint && hint.txt);
ok('przycisk naprawy jest', !!hint && hint.btns.some((b) => /^Zmień bok szuflady na 238 mm$/.test(b)), hint && hint.btns);

console.log('\n== przycisk faktycznie podmienia bok ==');
const before = await page.evaluate(() => {
  const sel = [...document.querySelectorAll('select')].filter((s) => /auto \d+/.test(s.textContent));
  return sel.map((s) => s.value);
});
console.log('     przed:', before.join(', '));
await uwagi.getByRole('button', { name: /Zmień bok szuflady na 238 mm/ }).first().click();
await page.waitForTimeout(1000);
const after = await page.evaluate(() => {
  const sel = [...document.querySelectorAll('select')].filter((s) => /auto \d+/.test(s.textContent));
  return sel.map((s) => s.value);
});
console.log('     po:  ', after.join(', '));
ok('jedna szuflada dostała bok 238', after.includes('238'), after.join(', '));
n = await notes();
ok('podpowiedź dla poprawionej szuflady znika',
  n.filter((x) => /wyższy bok/.test(x.txt)).length < 2,
  String(n.filter((x) => /wyższy bok/.test(x.txt)).length));

console.log('\n== bok 238 wybrany ręcznie: nie ma czego podpowiadać ==');
await seed(238);
n = await notes();
ok('brak podpowiedzi, gdy ręcznie ustawiono już najwyższy', !n.some((x) => /wyższy bok/.test(x.txt)),
  (n.find((x) => /wyższy bok/.test(x.txt)) || {}).txt);

console.log('\nBLEDY:', errors.length ? errors.join('\n') : '(brak)');
await browser.close();
