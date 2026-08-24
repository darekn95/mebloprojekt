/* Ramie szafki naroznej: wzmocnienia i plecy nie koncza sie na licu korpusu,
   tylko wchodza w glab az do katownika w tylnym narozniku. Sprawdzamy formatki,
   rzut z gory i to, ze ramie w ogole widac w widoku samej szafki. */
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
await page.goto(URL, { waitUntil: 'networkidle' });
await page.evaluate(() => { try { localStorage.clear(); } catch (e) {} });
await page.reload({ waitUntil: 'networkidle' });
await page.waitForTimeout(1800);
await page.locator('select[title="Dodaj szafkę z gotowego szablonu"]').first().selectOption('naroznikL');
await page.waitForTimeout(2200);
/* Formatki ramienia sa w liscie calego projektu, a nie w liscie szafki — ramie
   nalezy do naroznika, nie do korpusu. Ta lista jest juz po szablonie, bo obok
   naroznika stoi jeszcze szafka, od ktorej zaczyna sie nowy projekt. */

const proj = await page.evaluate(() => JSON.parse(localStorage.getItem('szafki:projekt')));
const rog = proj.items.map((i) => i.cab).find((c) => c.corner && c.corner.on);
const ramie = Math.round(rog.corner.arm);
const glRog = Math.round(rog.D);
const postW = Math.round((rog.corner.post || {}).w || 150);
console.log(`   ramię ${ramie}, głębokość ${glRog}, kątownik ${postW}`);

const lista = async () => page.evaluate(() => {
  const sec = [...document.querySelectorAll('section')].find((s) => {
    const h = s.querySelector('h2');
    return h && /Formatki ca/.test(h.textContent);
  });
  if (!sec) return [];
  return [...sec.querySelectorAll('tbody tr')].map((tr) =>
    [...tr.querySelectorAll('td')].map((t) => t.innerText.trim().split('\n')[0]));
});
const wiersz = (rows, re) => rows.find((r) => re.test(r[0]));

console.log('== formatki ramienia ==');
const rows = await lista();
rows.filter((r) => /ramieni/i.test(r[0])).forEach((r) => console.log('     ' + r.slice(0, 5).join(' | ')));
const wCz = wiersz(rows, /^Wzmocnienie ramienia — czołowe/);
const wTy = wiersz(rows, /^Wzmocnienie ramienia — tylne/);
const plecy = wiersz(rows, /^Plecy ramienia/);
ok('wzmocnienie czołowe jest osobną pozycją', !!wCz, wCz ? wCz.slice(0, 4).join('|') : '(brak)');
ok('wzmocnienie tylne jest osobną pozycją', !!wTy, wTy ? wTy.slice(0, 4).join('|') : '(brak)');
ok('tylne wzmocnienie dłuższe od czołowego', !!wCz && !!wTy && Number(wTy[3]) > Number(wCz[3]),
  `${wCz && wCz[3]} vs ${wTy && wTy[3]}`);
/* Tylne nachodzi jeszcze na ramie katownika w narozniku — o jego dlugosc bez
   dwoch grubosci plyty — zeby dalo sie je z nim skrecic. */
/* Dlugosc: od boku zamykajacego ramie (len - 18) w glab szafki do katownika
   (glebokosc - plecy - ramie katownika) i jeszcze po jego wolnej czesci. */
const tylneDl = (ramie - 18) + (glRog - postW) + (postW - 36);
ok('tylne nachodzi na kątownik w narożniku', !!wTy && Number(wTy[3]) === tylneDl,
  wTy && `${wTy[3]} zamiast ${tylneDl}`);
/* Plecy nachodza na katownik i koncza sie dopiero na tylnej plaszczyznie
   szafki — przybija sie je do niego tak samo jak do bokow. */
const zapas = glRog;
ok('plecy sięgają do kątownika w narożniku',
  !!plecy && Number(plecy[3]) === ramie + zapas,
  plecy ? `${plecy[3]} zamiast ${ramie + zapas}` : '(brak)');

console.log('\n== rzut z góry całej zabudowy ==');
for (const l of ['Zabudowa', 'Z góry']) await klik(l);
const pasy = await page.evaluate(() => [...document.querySelectorAll('svg rect')].map((r) => ({
  x: +r.getAttribute('x'), y: +r.getAttribute('y'),
  w: +r.getAttribute('width'), h: +r.getAttribute('height'),
})).filter((r) => r.w > 0 && r.h > 0 && r.x < 0));
console.log('   płyty zaczynające się przed licem: ' + JSON.stringify(pasy.slice(0, 4)));
ok('plecy i wzmocnienie wchodzą w głąb szafki', pasy.length >= 2, String(pasy.length));

console.log('\n== ramię widać w elewacji samej szafki ==');
await klik('Szafka');
await klik('Zamk.');
const podpisy = async () => page.evaluate(() =>
  [...document.querySelectorAll('svg text')].map((t) => t.textContent.trim()));
let tks = await podpisy();
ok('podpis ramienia jest', tks.some((t) => t === 'ramię ' + ramie), tks.slice(0, 6).join(' | '));
await klik('Otw.');
tks = await podpisy();
ok('po otwarciu ramię dalej jest', tks.some((t) => t === 'ramię ' + ramie), tks.slice(0, 6).join(' | '));

console.log('\nBLEDY:', errors.length ? errors.join('; ') : '(brak)');
await b.close();
