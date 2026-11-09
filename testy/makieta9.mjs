// Makieta prosta — podstawy kreatora (przeglad brakow 2026-11-09): nazwa szafki, „Kopiuj obok”, „Usuń szafkę”, poziomy
// szafki (+ / −, przegroda pozioma przeciagana na rysunku), „Szafa z szufladami” z palety (3 szuflady na dole, 2 drzwi).
import pw from './pw.mjs';
const { chromium } = pw;
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const page = await (await browser.newContext({ viewport: { width: 1500, height: 950 } })).newPage();
const errors = [];
page.on('pageerror', (e) => errors.push('[pageerror] ' + e.message));
page.on('console', (m) => { if (m.type() === 'error' && !/favicon|404/.test(m.text())) errors.push('[console] ' + m.text()); });
let bledy = 0;
const ok = (l, c, e = '') => { if (!c) bledy++; console.log((c ? '  OK   ' : '  BLAD ') + l + (e ? ' — ' + e : '')); };
await page.goto('http://127.0.0.1:5205/mebloprojekt-app.html', { waitUntil: 'networkidle' });
await page.evaluate(() => { try { localStorage.clear(); } catch (e) {} });
await page.reload({ waitUntil: 'networkidle' });
await page.waitForFunction(() => !!localStorage.getItem('szafki:projekt'), null, { timeout: 10000 });
await page.evaluate(() => {
  const p = JSON.parse(localStorage.getItem('szafki:projekt'));
  const wzor = p.items[0];
  const w = (n, W) => { const it = JSON.parse(JSON.stringify(wzor)); it.cab.name = n; it.cab.W = W; it.cab.H = 2000; return { ...it, runId: 'r1' }; };
  p.runs = [{ id: 'r1', name: 'Sypialnia', roomId: 'p1', worktop: false, zabudowa: 'szafa' }];
  p.items = [w('Szafa A', 1000), w('Szafa B', 800)];
  p.active = 0;
  localStorage.setItem('szafki:projekt', JSON.stringify(p));
  localStorage.setItem('mp-tryb', 'prosta');
  localStorage.setItem('mp-mak-zoom', JSON.stringify({ pow: false, z: 1 }));
});
await page.reload({ waitUntil: 'networkidle' });
await page.waitForTimeout(1200);
const proj = () => page.evaluate(() => JSON.parse(localStorage.getItem('szafki:projekt')));
const czekaj = async (f) => { await page.waitForFunction((src) => { const p = JSON.parse(localStorage.getItem('szafki:projekt')); try { return new Function('p', 'return ' + src)(p); } catch (e) { return false; } }, f, { timeout: 5000 }).catch(() => {}); return proj(); };
const zakl = async (k) => { const b = page.locator(`[data-el="makieta"] nav [data-zakl="${k}"]`);
  if ((await b.getAttribute('aria-pressed')) !== 'true' || !(await page.locator('[data-el="mak-karta-panel"]').count())) await b.click(); await page.waitForTimeout(250); };

console.log('== nazwa, kopiuj, usuń ==');
await zakl('szafka');
await page.fill('[data-pole="nazwa"]', 'Szafa główna'); await page.locator('[data-pole="nazwa"]').press('Enter');
let p = await czekaj('p.items[0].cab.name === "Szafa główna"');
ok('nazwa szafki z karty', p.items[0].cab.name === 'Szafa główna');
await page.locator('[data-el="mak-kopiuj"]').click();
p = await czekaj('p.items.length === 3');
ok('„Kopiuj obok”: kopia za nią w ciągu, zaznaczona', p.items.length === 3 && p.items[1].cab.name === 'Szafa główna (kopia)' && p.items[1].runId === 'r1' && p.active === 1, p.items.map((it) => it.cab.name).join(', '));
await page.locator('[data-el="mak-usun-szafke"]').click();
p = await czekaj('p.items.length === 2');
ok('„Usuń szafkę”: kopia usunięta, nic nie zaznaczone (paleta)', p.items.length === 2 && !p.items.some((it) => /kopia/.test(it.cab.name)) && (await page.locator('[data-el="mak-bez-zaznaczenia"]').count()) === 1);

console.log('== poziomy szafki ==');
await page.locator('[data-el="mak-szafka"] button').first().click(); await page.locator('[data-el="mak-szafka"] [data-v="0"]').click(); await page.waitForTimeout(300);
await zakl('przegroda');
await page.locator('[data-el="mak-poziom-szafki"][data-v="1"]').click();
p = await czekaj('p.items[0].cab.levels.length === 2');
ok('„+” poziom szafki: 2 poziomy, dolny z wysokością, górny auto', p.items[0].cab.levels.length === 2 && p.items[0].cab.levels[0].h > 0 && p.items[0].cab.levels[1].h == null, JSON.stringify(p.items[0].cab.levels.map((l) => l.h)));
const sep = page.locator('[data-u="poziom"][data-k="0"]');
ok('przegroda pozioma do chwycenia na rysunku', (await sep.count()) === 1);
const h0 = p.items[0].cab.levels[0].h;
const b = await sep.boundingBox();
await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2); await page.mouse.down();
await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2 + 60, { steps: 6 }); await page.mouse.up(); await page.waitForTimeout(300);
p = await czekaj(`p.items[0].cab.levels[0].h < ${h0}`);
ok('przeciągnięta w dół — niższy dolny poziom', p.items[0].cab.levels[0].h < h0 && p.items[0].cab.levels[1].h == null, `${h0} → ${p.items[0].cab.levels[0].h}`);
await page.locator('[data-el="mak-poziom-szafki"][data-v="-1"]').click();
p = await czekaj('p.items[0].cab.levels.length === 1');
ok('„−” zdejmuje najwyższy, zostaje jeden (auto)', p.items[0].cab.levels.length === 1 && p.items[0].cab.levels[0].h == null);

console.log('== półki równo z kolumną obok ==');
await page.evaluate(() => { const p = JSON.parse(localStorage.getItem('szafki:projekt')); const c = p.items[1].cab, k0 = c.levels[0].cols[0];
  c.levels[0].cols = [{ ...JSON.parse(JSON.stringify(k0)), w: null, shelfTargets: [300, 500, null] }, { ...JSON.parse(JSON.stringify(k0)), w: null, shelfTargets: [null, null, null, null] }];
  p.active = 1; localStorage.setItem('szafki:projekt', JSON.stringify(p)); });
await page.reload({ waitUntil: 'networkidle' }); await page.waitForTimeout(1000);
await zakl('polki');
await page.locator('[data-el="mak-kol-wybor"] [title="kolumna 2"]').click(); await page.waitForTimeout(250);
await page.locator('[data-el="mak-polki-rowno"][data-v="0"]').click();
p = await czekaj('p.items[1].cab.levels[0].cols[1].shelfTargets.length === 3');
ok('„równo z kol. 1”: te same światła (2 półki, ostatnie auto)', JSON.stringify(p.items[1].cab.levels[0].cols[1].shelfTargets) === JSON.stringify([300, 500, null]), JSON.stringify(p.items[1].cab.levels[0].cols[1].shelfTargets));
console.log('== szafa z szufladami z palety ==');
await zakl('dodaj'); const sek = page.locator('[data-el="mak-dodaj"] [data-dodaj="szafki"]'); if ((await sek.getAttribute('aria-expanded')) !== 'true') await sek.click(); await page.waitForTimeout(200);
await page.locator('[data-el="mak-paleta"] [data-el="mak-wzor"][data-id="szafaSz"]').click();
p = await czekaj('p.items.length === 3');
const c = p.items[p.active].cab;
ok('„Szafa z szufladami”: 800, dwa poziomy — 3 szuflady na dole, 2 drzwi z półkami nad nimi', c.W === 800 && c.levels.length === 2 && c.levels[0].cols[0].kind === 'drawers' && c.levels[0].cols[0].drawers.length === 3 && c.levels[1].cols[0].doors === 2,
  JSON.stringify(c.levels.map((l) => ({ h: l.h, k: l.cols[0].kind, d: l.cols[0].doors, n: (l.cols[0].drawers || []).length }))));

console.log('bledy strony:', errors.length ? errors.join(' | ') : 'brak');
if (errors.length) bledy++;
console.log(bledy ? `${bledy} BLAD` : 'WSZYSTKO OK');
await browser.close();
process.exit(bledy ? 1 : 0);
