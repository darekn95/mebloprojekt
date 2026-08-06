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
await page.goto(URL, { waitUntil: 'networkidle' });

// szafka z fotki uzytkownika: 900x720, cokol w obrysie 100, nozki 100,
// kolumna drzwi (2 skrzydla) + kolumna szuflad (2 fronty)
await page.evaluate(() => {
  localStorage.clear();
  const cab = {
    name: 'T', W: 900, H: 720, D: 500,
    plinth: { on: true, height: 100, mode: 'inbody', setback: 0 },
    legs: { on: true, height: 100, color: '#3f3f46', shape: 'box' },
    levels: [{ h: null, cols: [
      { kind: 'doors', doors: 2, w: 601 },
      { kind: 'drawers', w: 245, drawers: [{}, {}] },
    ] }],
  };
  localStorage.setItem('szafki:projekt', JSON.stringify({ name: 'T', active: 0, prices: {}, items: [{ cab }] }));
});
await page.reload({ waitUntil: 'networkidle' });
await page.waitForTimeout(2200);

const svgTexts = () => page.evaluate(() => {
  const svg = document.querySelector('svg');
  return [...svg.querySelectorAll('text')].map((t) => ({
    t: t.textContent.trim(), x: Math.round(+t.getAttribute('x')), y: Math.round(+t.getAttribute('y')),
    f: t.getAttribute('fill'), a: t.getAttribute('text-anchor'),
  }));
});
const view = async (v) => { await page.getByText(v, { exact: true }).first().click(); await page.waitForTimeout(800); };
const ACC = '#0f766e';

console.log('== widok zamknięty: szczeliny nie chowają się pod wymiarami ==');
await page.getByText('Pokaż szczeliny', { exact: true }).first().click();
await page.waitForTimeout(600);
await view('Zamk.');
let tx = await svgTexts();
const gaps = tx.filter((t) => t.f === ACC);
const dims = tx.filter((t) => t.f !== ACC);
ok('etykiety szczelin są', gaps.length > 0, String(gaps.length));
const clash = gaps.filter((g) => dims.some((d) => Math.abs(d.x - g.x) < 40 && Math.abs(d.y - g.y) < 16));
ok('żadna etykieta szczeliny nie leży pod wymiarem', clash.length === 0,
  JSON.stringify(clash.map((c) => `${c.t}@${c.x},${c.y}`)));
const leftGap = gaps.filter((g) => g.x < 0);
ok('luz z lewej strony jest widoczny', leftGap.length > 0, JSON.stringify(leftGap.map((g) => `${g.t}@${g.x}`)));

// WARTOSCI luzow, nie tylko ich rozmieszczenie — brak tego sprawdzenia przepuscil
// najpierw 381/362 (odniesienie do calej szafki), potem 0 (odniesienie do pasma)
const vals = gaps.map((g) => Number(g.t)).filter((v) => Number.isFinite(v));
console.log('     szczeliny:', vals.join(', '));
// dozwolone: 2 przy krawedzi korpusu, 3 miedzy frontami oraz u gory i u dolu,
// 4 nad przegroda (18 - 2 x 7 nalozenia) — nic poza tym
ok('każdy luz to 2, 3 albo 4 mm', vals.length > 0 && vals.every((v) => [2, 3, 4].includes(v)), vals.join(', '));
ok('żadnego luzu zerowego', !vals.includes(0), vals.join(', '));
// luz gorny i dolny: skrajne po pionie etykiety ze srodkowym wyrownaniem
const mid = gaps.filter((g) => g.a === 'middle');
const gora = mid.reduce((a2, b2) => (b2.y < a2.y ? b2 : a2), mid[0]);
const dol = mid.reduce((a2, b2) => (b2.y > a2.y ? b2 : a2), mid[0]);
ok('luz górny 3 mm', Number(gora.t) === 3, `${gora.t}@y${gora.y}`);
ok('luz dolny 3 mm', Number(dol.t) === 3, `${dol.t}@y${dol.y}`);

console.log('\n== widok zamknięty: bez wymiaru światła poziomu ==');
// swiatlo poziomu przy cokole 100 w obrysie = 720-18-18-100 = 584
ok('brak wymiaru 584 w widoku zamkniętym', !tx.some((t) => t.t === '584'),
  tx.filter((t) => t.t === '584').map((t) => t.x).join(', '));
ok('całkowita wysokość nie dubluje 720', tx.filter((t) => t.t === '720').length === 1,
  String(tx.filter((t) => t.t === '720').length));

console.log('\n== widok otwarty: światło pionowe po lewej ==');
await view('Otw.');
tx = await svgTexts();
const lvl = tx.filter((t) => t.t === '584');
ok('wymiar światła 584 jest', lvl.length > 0, String(lvl.length));
// 584 pojawia sie tez w swietle otworu (rysowane wewnatrz kolumny) — chodzi o to,
// zeby wymiar poziomu przestal wisiec po prawej stronie szafki
ok('światło poziomu po lewej, nic po prawej', lvl.some((t) => t.x < 0) && !lvl.some((t) => t.x > 900),
  lvl.map((t) => t.x).join(', '));

console.log('\n== wymiary blisko szafki, gdy nie ma długości boków ==');
const vb = await page.evaluate(() => document.querySelector('svg').getAttribute('viewBox').split(' ').map(Number));
ok('lewy margines rysunku rozsądny (< 500)', -vb[0] < 500, String(-vb[0]));
const hMain = tx.find((t) => t.t === '720');
ok('wymiar wysokości blisko obrysu (> -260)', hMain && hMain.x > -260, hMain && String(hMain.x));

console.log('\n== podpowiedzi: luz w górę i w dół ==');
const hints = await page.evaluate(() => {
  const sec = [...document.querySelectorAll('section')].find((s) => /^Uwagi$/.test((s.querySelector("h2") || {}).textContent || ""));
  if (!sec) return null;
  return [...sec.querySelectorAll('li')].map((li) => ({
    txt: li.textContent.trim(),
    btns: [...li.querySelectorAll('button')].map((b) => b.textContent.trim()),
  }));
});
(hints || []).forEach((h) => console.log('     ' + h.txt.slice(0, 90) + '  →  [' + h.btns.join(' | ') + ']'));
const dHint = (hints || []).find((h) => /drzwi różnią się/.test(h.txt));
const sHint = (hints || []).find((h) => /fronty szuflad różnią się/.test(h.txt));
ok('podpowiedź o drzwiach jest', !!dHint);
ok('drzwi: przycisk zwiększenia luzu', !!dHint && dHint.btns.some((b) => /^Zwiększ luz do \d+ mm$/.test(b)), (dHint || {}).btns);
ok('drzwi: przycisk zmniejszenia luzu', !!dHint && dHint.btns.some((b) => /^Zmniejsz luz do \d+ mm$/.test(b)), (dHint || {}).btns);
ok('podpowiedź o szufladach jest', !!sHint);
ok('szuflady: przycisk zwiększenia luzu', !!sHint && sHint.btns.some((b) => /^Zwiększ luz do \d+ mm$/.test(b)), (sHint || {}).btns);
ok('szuflady: przycisk zmniejszenia luzu', !!sHint && sHint.btns.some((b) => /^Zmniejsz luz do \d+ mm$/.test(b)), (sHint || {}).btns);

console.log('\n== przycisk faktycznie wyrównuje formatki ==');
const hintSec = page.locator('section').filter({ has: page.locator('h2', { hasText: /^Uwagi$/ }) }).first();
const fronts = () => page.evaluate(() => {
  const svg = document.querySelector('svg');
  return [...svg.querySelectorAll('text')].map((t) => t.textContent.trim()).filter((t) => /^\d+×\d+$/.test(t));
});
await view('Zamk.');
console.log('     przed:', (await fronts()).join(', '));
await hintSec.getByRole('button', { name: /Zmniejsz luz do/ }).first().click();
await page.waitForTimeout(900);
const after = await fronts();
console.log('     po:  ', after.join(', '));
const doorSizes = after.filter((s) => Number(s.split('×')[0]) > 300);
ok('drzwi mają identyczne formatki', new Set(doorSizes).size === 1, doorSizes.join(', '));
await page.locator('svg').first().screenshot({ path: S + 'shot-luzy.png' });

console.log('\nBLEDY:', errors.length ? errors.join('\n') : '(brak)');
await browser.close();
