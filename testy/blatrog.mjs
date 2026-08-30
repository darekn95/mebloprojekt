/* Blat w narożniku: dwa odcinki, po jednym na ścianę. Sprawdzamy ostrzeżenia
   o różnych szerokościach i o blacie ponad arkusz 600 — także wtedy, gdy ten
   drugi odcinek leży nad samym ramieniem, w ciągu bez własnych szafek. */
import pw from '/opt/node22/lib/node_modules/playwright/index.js';
const URL = process.env.STD ? 'http://127.0.0.1:5199/standalone-local.html'
  : 'http://127.0.0.1:5205/mebloprojekt-app.html';
const b = await pw.chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const page = await (await b.newContext({ viewport: { width: 1500, height: 1100 } })).newPage();
const errors = []; page.on('pageerror', (e) => errors.push('[pageerror] ' + e.message));
const ok = (l, c, e = '') => console.log((c ? '  OK   ' : '  BLAD ') + l + (e ? ' — ' + e : ''));
const card = (re) => page.locator('section').filter({ has: page.locator('h2', { hasText: re }) }).first();
await page.goto(URL, { waitUntil: 'networkidle' });
await page.evaluate(() => { try { localStorage.clear(); } catch (e) {} });
await page.reload({ waitUntil: 'networkidle' });
await page.waitForTimeout(1800);
await page.locator('select[title="Dodaj szafkę z gotowego szablonu"]').first().selectOption('naroznikL');
await page.waitForTimeout(2200);
/* Szablon daje obie sciany po tyle samo. Poglebiamy te za rogiem do 600, zeby
   odcinki blatu rozjechaly sie tak jak w prawdziwym projekcie. */
await page.evaluate(() => {
  const p = JSON.parse(localStorage.getItem('szafki:projekt'));
  const rog = p.items.find((i) => i.cab.corner && i.cab.corner.on);
  p.runs.forEach((r) => { if (r.id !== rog.runId) r.D = 600; });
  localStorage.setItem('szafki:projekt', JSON.stringify(p));
});
await page.reload({ waitUntil: 'networkidle' });
await page.waitForTimeout(2500);

const uwagi = async () => card(/^Uwagi$/).evaluate((sec) =>
  [...sec.querySelectorAll('li')].map((li) => ({
    t: li.textContent.replace(/\s+/g, ' ').trim(),
    b: [...li.querySelectorAll('button')].map((x) => x.textContent.trim()).filter((x) => x !== '✓'),
  })));
let u = await uwagi();
const rozne = u.find((x) => /różne szerokości/.test(x.t));
const szerszy = u.find((x) => /Blat nad ramieniem/.test(x.t));
console.log('   ' + (rozne ? rozne.t.slice(0, 190) : '(brak o różnych)'));
console.log('   ' + (szerszy ? szerszy.t.slice(0, 190) : '(brak o arkuszu)'));
ok('ostrzeżenie o różnych szerokościach', !!rozne, u.map((x) => x.t.slice(0, 40)).join(' // '));
/* 598 zamawia sie w calym pasie 600 i dociera przy scianie, wiec w uwadze
   o rogu stoi juz szerokosc zamawiana. */
ok('mówi, które odcinki', !!rozne && /600 mm/.test(rozne.t) && /628 mm/.test(rozne.t), rozne && rozne.t.slice(0, 120));
ok('wskazuje głębszy ciąg', !!rozne && /jest głębszy/.test(rozne.t));
ok('ma poprawkę na sąsiedni ciąg', !!rozne && rozne.b.some((x) => /sąsiedniego ciągu do \d+/.test(x)),
  rozne ? rozne.b.join(' | ') : '');
/* Blat nad ramieniem to 600 glebokosci + front + wysieg = 628, czyli ponad
   arkusz 600 — a ciag za rogiem nie ma wlasnych szafek, wiec nie ma tez
   wlasnej karty, w ktorej moglby o tym powiedziec. */
ok('ostrzeżenie o blacie ponad arkusz', !!szerszy, '');
ok('podaje 628 mm', !!szerszy && /628 mm/.test(szerszy.t), szerszy && szerszy.t.slice(0, 120));

console.log('\n== poprawka wyrównuje sąsiedni ciąg ==');
await page.getByRole('button', { name: /sąsiedniego ciągu do 570 mm/ }).first().click();
await page.waitForTimeout(1600);
const p2 = await page.evaluate(() => JSON.parse(localStorage.getItem('szafki:projekt')));
console.log('   głębokości ciągów: ' + JSON.stringify(p2.runs.map((r) => [r.name, r.D])));
ok('sąsiedni ciąg ma 570', p2.runs.every((r) => r.D === 570), JSON.stringify(p2.runs.map((r) => r.D)));
u = await uwagi();
ok('ostrzeżenia znikają', !u.some((x) => /różne szerokości|Blat nad ramieniem/.test(x.t)),
  u.map((x) => x.t.slice(0, 40)).join(' // '));

console.log('\n== blat blisko arkusza: caly pas, docinany na miejscu ==');
u = await uwagi();
const docinka = u.find((x) => /zdejmujemy \d+ mm przy ścianie/.test(x.t));
console.log('   ' + (docinka ? docinka.t.slice(0, 220) : '(brak)'));
ok('jest podpowiedź o docinaniu na miejscu', !!docinka, u.map((x) => x.t.slice(0, 40)).join(' // '));
ok('da się zamówić docięty', !!docinka && docinka.b.some((x) => /docięty na wymiar/.test(x)),
  docinka ? docinka.b.join(' | ') : '');
await page.getByRole('button', { name: /docięty na wymiar/ }).first().click();
await page.waitForTimeout(1400);
u = await uwagi();
const poCieciu = u.find((x) => /zamawiamy docięty/.test(x.t));
ok('po przełączeniu blat idzie na wymiar', !!poCieciu, u.map((x) => x.t.slice(0, 40)).join(' // '));
ok('i da się wrócić do całego pasa', !!poCieciu && poCieciu.b.some((x) => /cały pas/.test(x)),
  poCieciu ? poCieciu.b.join(' | ') : '');

console.log('\nBLEDY:', errors.length ? errors.join('; ') : '(brak)');
await b.close();
