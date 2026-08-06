import pw from '/opt/node22/lib/node_modules/playwright/index.js';
const { chromium } = pw;
const URL = process.env.STD ? 'http://127.0.0.1:5199/standalone-local.html'
  : 'http://127.0.0.1:5205/mebloprojekt-app.html';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const page = await (await browser.newContext({ viewport: { width: 1500, height: 1200 } })).newPage();
const errors = [];
page.on('pageerror', (e) => errors.push('[pageerror] ' + e.message));
page.on('console', (m) => { if (m.type() === 'error' && !/favicon|404/.test(m.text())) errors.push('[console] ' + m.text()); });
const ok = (l, c, e = '') => console.log((c ? '  OK   ' : '  BLAD ') + l + (e ? ' — ' + e : ''));
const card = (re) => page.locator('section').filter({ has: page.locator('h2', { hasText: re }) }).first();
const notes = () => page.evaluate(() => {
  const sec = [...document.querySelectorAll('section')].find((s) => /^Uwagi$/.test((s.querySelector('h2') || {}).textContent || ''));
  return sec ? [...sec.querySelectorAll('li')].map((li) => li.textContent.trim()) : [];
});
await page.goto(URL, { waitUntil: 'networkidle' });

const seed = async (cabPatch) => {
  await page.evaluate((patch) => {
    localStorage.clear();
    const cab = Object.assign({ name: 'T', W: 600, H: 720, D: 500 }, patch);
    localStorage.setItem('szafki:projekt', JSON.stringify({ name: 'T', active: 0, prices: {}, items: [{ cab }] }));
  }, cabPatch);
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(2200);
};

console.log('== zwykła szafka: żadnej uwagi o arkuszu ==');
await seed({});
let n = await notes();
ok('brak uwagi o arkuszu', !n.some((x) => /nie mieści się na arkuszu/.test(x)),
  n.find((x) => /arkusz/.test(x)));

console.log('== drzwi 2196 szerokości: mieszczą się dopiero po obróceniu ==');
// formatka 714 x 2196: 2196 > 2061,2 w pionie, ale po obrocie wchodzi
await seed({ W: 2200, levels: [{ h: null, cols: [{ kind: 'doors', doors: 1, w: null }] }] });
n = await notes();
ok('szerokie drzwi przechodzą, gdy wolno obracać', !n.some((x) => /nie mieści się na arkuszu/.test(x)),
  n.find((x) => /arkusz/.test(x)));

console.log('== te same drzwi przy wymuszonym usłojeniu ==');
// sloj biegnie wzdluz dluzszego boku arkusza, wiec obrot odpada
await seed({ W: 2200, grainMatters: true, levels: [{ h: null, cols: [{ kind: 'doors', doors: 1, w: null }] }] });
n = await notes();
const g = n.find((x) => /Drzwi.*nie mieści się na arkuszu/.test(x));
console.log('     ' + (g || '(brak)'));
ok('przy usłojeniu szerokie drzwi nie przechodzą', !!g, n.join(' // '));
ok('uwaga podaje wymiar po okrawaniu', !!g && /2761\.2/.test(g) && /2061\.2/.test(g), g);

console.log('== bok 2800 mm: nie mieści się w żadnym ułożeniu ==');
await seed({ H: 2800 });
n = await notes();
const big = n.find((x) => /nie mieści się na arkuszu/.test(x));
console.log('     ' + (big || '(brak)'));
ok('bok 2800 odrzucony', !!big, n.join(' // '));

console.log('\n== rozkrój układa na okrojonym arkuszu ==');
await seed({ W: 900, H: 720, D: 500 });
await card(/^Formatki do zamówienia$/).getByRole('button', { name: 'Rozkrój na płycie' }).click();
await page.waitForTimeout(2500);
const plan = await page.evaluate(() => {
  const sec = [...document.querySelectorAll('section')].find((s) => /^Rozkrój na płycie/.test((s.querySelector('h2') || {}).textContent || ''));
  if (!sec) return null;
  const svg = sec.querySelector('svg');
  const sheet = svg ? [...svg.querySelectorAll('rect')]
    .map((r) => ({ w: Number(r.getAttribute('width')), h: Number(r.getAttribute('height')) }))
    .find((r) => r.w > 2000) : null;
  return { txt: sec.innerText.replace(/\s+/g, ' '), vb: svg ? svg.getAttribute('viewBox') : null, sheet };
});
console.log('     ' + (plan ? plan.txt.slice(0, 200) : '(brak karty)'));
ok('opis podaje arkusz kupowany 2800 × 2100', !!plan && /2800 × 2100/.test(plan.txt), plan && plan.txt.slice(0, 160));
ok('opis podaje wymiar po okrawaniu 2761.2 × 2061.2', !!plan && /2761\.2 × 2061\.2/.test(plan.txt), plan && plan.txt.slice(0, 200));
// obrys arkusza na rysunku to juz wymiar po okrawaniu, nie surowy arkusz
ok('obrys arkusza rysowany po okrawaniu',
  !!plan && !!plan.sheet && plan.sheet.w === 2761.2 && plan.sheet.h === 2061.2,
  plan && plan.sheet ? `${plan.sheet.w} × ${plan.sheet.h}` : String(plan && plan.vb));

console.log('\nBLEDY:', errors.length ? errors.join('\n') : '(brak)');
await browser.close();
