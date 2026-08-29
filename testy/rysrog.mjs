/* Rysunki naroznika: front ramienia zachodzi na jego bok z luzem, drzwi szafki
   nie nachodza z gory na maskownice katownika, widok od tylu pokazuje
   wzmocnienia, a pod ramieniem stoja nozki. */
import pw from '/opt/node22/lib/node_modules/playwright/index.js';
const URL = process.env.STD ? 'http://127.0.0.1:5199/standalone-local.html'
  : 'http://127.0.0.1:5205/mebloprojekt-app.html';
const b = await pw.chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const page = await (await b.newContext({ viewport: { width: 1500, height: 1100 } })).newPage();
const errors = []; page.on('pageerror', (e) => errors.push('[pageerror] ' + e.message));
const ok = (l, c, e = '') => console.log((c ? '  OK   ' : '  BLAD ') + l + (e ? ' — ' + e : ''));
const klik = async (l) => {
  const btn = page.getByText(l, { exact: true }).first();
  if (!(await btn.count())) return false;
  await btn.click(); await page.waitForTimeout(800); return true;
};
/* Najwiekszy rysunek na stronie to ten, ktory wlasnie ogladamy. */
const plyty = () => page.evaluate(() => {
  const s = [...document.querySelectorAll('svg')].sort((a, b) =>
    b.getBoundingClientRect().width * b.getBoundingClientRect().height
    - a.getBoundingClientRect().width * a.getBoundingClientRect().height)[0];
  return {
    rect: [...s.querySelectorAll('rect')].map((r) => ({
      x: Math.round(+r.getAttribute('x') || 0), y: Math.round(+r.getAttribute('y') || 0),
      w: Math.round(+r.getAttribute('width') || 0), h: Math.round(+r.getAttribute('height') || 0),
      f: r.getAttribute('fill'), d: r.getAttribute('stroke-dasharray') || '',
    })).filter((r) => r.w > 0 && r.h > 0),
    text: [...s.querySelectorAll('text')].map((t) => t.textContent.trim()),
  };
});
await page.goto(URL, { waitUntil: 'networkidle' });
await page.evaluate(() => { try { localStorage.clear(); } catch (e) {} });
await page.reload({ waitUntil: 'networkidle' });
await page.waitForTimeout(1800);
await page.locator('select[title="Dodaj szafkę z gotowego szablonu"]').first().selectOption('naroznikL');
await page.waitForTimeout(2200);
const proj = await page.evaluate(() => JSON.parse(localStorage.getItem('szafki:projekt')));
const rog = proj.items.map((i) => i.cab).find((c) => c.corner && c.corner.on);
const W = Math.round(rog.W);
const ramie = Math.round(rog.corner.arm);
const luz = (rog.gaps || {}).edge ?? 2;
console.log(`   szafka ${W}, ramię ${ramie}, luz ${luz}`);

console.log('== elewacja szafki: front ramienia zachodzi na bok ==');
await klik('Szafka');
await klik('Zamk.');
let d = await plyty();
// ramie idzie w prawo od korpusu: bok na wolnym koncu, front tuz przed nim
const konieC = W + ramie;
const bok = d.rect.find((r) => r.x + r.w === konieC && r.w === 18 && r.h > 600);
const frontKol = ((proj.items.find((i) => i.cab.corner && i.cab.corner.on).mat
  || {}).front || {}).color;
const front = d.rect.filter((r) => r.x > W && r.f === frontKol && r.h > 600)
  .sort((a, b) => b.w - a.w)[0];
ok('bok ramienia jest', !!bok, JSON.stringify(bok));
ok('front konczy sie luz przed koncem ramienia',
  !!front && front.x + front.w === konieC - luz,
  front ? `${front.x}..${front.x + front.w} zamiast ...${konieC - luz}` : '(brak)');
ok('front zachodzi na bok', !!front && !!bok && front.x + front.w > bok.x,
  front && bok ? `front do ${front.x + front.w}, bok od ${bok.x}` : '');
ok('przejście do ramienia jest podpisane',
  d.text.some((t) => /przejście do ramienia/.test(t)), d.text.slice(0, 4).join(' | '));

console.log('\n== drzwi jadą za licem, gdy zmieni się głębokość sąsiada ==');
/* Lico przed narozem to szerokosc korpusu bez glebokosci sasiedniego ciagu
   i bez frontu ramienia; drzwi maja siegac az do maskownicy katownika. */
const pasFrontu = async () => {
  const dd = await plyty();
  return dd.rect.filter((r) => r.f === frontKol && r.h > 600 && r.x < W)
    .sort((a, b) => a.x - b.x);
};
const szpara = (p) => (p.length >= 2 ? p[1].x - (p[0].x + p[0].w) : null);
let p = await pasFrontu();
console.log('   ' + p.map((r) => `${r.x}..${r.x + r.w}`).join(' | ') + `  szpara ${szpara(p)}`);
ok('drzwi dochodzą do maskownicy', szpara(p) !== null && szpara(p) <= 3, String(szpara(p)));
const glOk = await page.evaluate(() => {
  const d = JSON.parse(localStorage.getItem('szafki:projekt'));
  const rog = d.items.find((i) => i.cab.corner && i.cab.corner.on);
  d.runs.forEach((r) => { if (r.id !== rog.runId) r.D = 500; });
  localStorage.setItem('szafki:projekt', JSON.stringify(d));
  return true;
});
await page.reload({ waitUntil: 'networkidle' });
await page.waitForTimeout(2400);
const kafel = page.locator('button', { hasText: /^Szafka 2/ });
if (await kafel.count()) { await kafel.first().click(); await page.waitForTimeout(1000); }
await klik('Szafka'); await klik('Zamk.');
const p2 = await pasFrontu();
console.log('   po zmianie na 500: ' + p2.map((r) => `${r.x}..${r.x + r.w}`).join(' | ')
  + `  szpara ${szpara(p2)}`);
ok('drzwi poszerzyły się razem z licem', !!p2.length && !!p.length && p2[0].w > p[0].w,
  `${p.length && p[0].w} -> ${p2.length && p2[0].w}`);
ok('nadal bez szpary', szpara(p2) !== null && szpara(p2) <= 3, String(szpara(p2)));
ok('bez ostrzeżenia o szparze', !(await page.evaluate(() =>
  [...document.querySelectorAll('li')].some((li) => /szpary/.test(li.textContent)))), '');

console.log('\n== rzut z góry: drzwi nie wchodzą na maskownicę ==');
await klik('Z góry');
d = await plyty();
/* Pas frontu lezy tuz przed licem korpusu — bierzemy wszystkie plyty w tym
   pasie i sprawdzamy, czy sie nie nakladaja. */
const pas = d.rect.filter((r) => r.h === 18 && r.w > 20 && r.f === frontKol
  && r.x + r.w <= W + 1)
  .sort((a, b) => a.x - b.x);
console.log('   ' + pas.map((r) => `${r.x}..${r.x + r.w}`).join(' | '));
const nachodzi = pas.some((r, i) => i > 0 && r.x < pas[i - 1].x + pas[i - 1].w);
ok('front i maskownica nie nachodzą na siebie', !nachodzi, JSON.stringify(pas.slice(0, 4)));

console.log('\n== widok od tyłu: wzmocnienia widać ==');
await klik('Z tyłu');
d = await plyty();
const kreski = d.rect.filter((r) => r.d === '8 6');
ok('wzmocnienia narysowane kreską', d.text.some((t) => /wzmocnienie/.test(t)),
  d.text.slice(0, 5).join(' | '));
ok('kreskowane obrysy w środku są', kreski.length >= 2, String(kreski.length));

console.log('\n== zabudowa: ramię stoi na nóżkach, też od tyłu ==');
/* W szablonie nozki ma tylko szafka narozna, wiec para pod korpusem i para pod
   ramieniem — od przodu i od tylu tak samo. */
const nozki = () => d.rect.filter((r) => (r.f || '').toLowerCase() === '#3f3f46' && r.w === 40).length;
await klik('Zabudowa');
await klik('Zamk.');
d = await plyty();
const przod = nozki();
await klik('Z tyłu');
d = await plyty();
const tyl = nozki();
console.log(`   nóżek od przodu ${przod}, od tyłu ${tyl}`);
ok('ramię ma własną parę nóżek', przod >= 4, String(przod));
ok('od tyłu tyle samo', tyl === przod, `${tyl} vs ${przod}`);

console.log('\nBLEDY:', errors.length ? errors.join('; ') : '(brak)');
await b.close();
