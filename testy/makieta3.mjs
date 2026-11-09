// Tryb makiety (uzytkownik 2026-11-09): zmiana wysokosci szafki w ciagu od razu pyta o zakres —
// tylko ta / caly ciag / ten ciag i polaczone w narozniku (wspolny blat). Slupek i wolnostojaca zostaja.
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
const wczytaj = async () => {
  await page.evaluate(() => {
    const p = JSON.parse(localStorage.getItem('szafki:projekt0') || localStorage.getItem('szafki:projekt'));
    localStorage.setItem('szafki:projekt0', JSON.stringify(p));
    const wzor = p.items[0];
    const k = (n, H, run, extra = {}) => { const it = JSON.parse(JSON.stringify(wzor)); it.cab.name = n; it.cab.H = H; Object.assign(it.cab, extra); it.runId = run; if (!run) it.roomId = 'p1'; return it; };
    p.runs = [{ id: 'r1', name: 'Ściana A', roomId: 'p1', H: 720 }, { id: 'r2', name: 'Ściana B', roomId: 'p1', H: 720, corner: { of: 'r1', at: 'end', owner: 'of', clear: 0, top: null, cut: 'prosty' } }];
    p.items = [k('A1', 720, 'r1'), k('A2', 720, 'r1'), k('Słupek', 2000, 'r1', { slupek: true }), k('B1', 720, 'r2'), k('B2', 720, 'r2'), k('Komoda', 720, null)];
    p.active = 0;
    localStorage.setItem('szafki:projekt', JSON.stringify(p));
    localStorage.setItem('mp-tryb', 'prosta');
  });
  await page.reload({ waitUntil: 'networkidle' }); await page.waitForTimeout(1200);
};
const wys = () => page.evaluate(() => { const p = JSON.parse(localStorage.getItem('szafki:projekt')); return { H: p.items.map((it) => it.cab.H).join(','), runs: (p.runs || []).map((r) => r.H).join(',') }; });
const czekaj = (f) => page.waitForFunction(f, null, { timeout: 5000 }).catch(() => {});
const wpiszH = async (v) => { await page.fill('[data-pole="H"]', String(v)); await page.locator('[data-pole="H"]').press('Enter'); await page.waitForTimeout(400); };

console.log('== pytanie po zmianie wysokości ==');
await wczytaj();
await wpiszH(760);
ok('okienko pyta o zakres', await page.locator('[data-el="makieta-pytanie-wys"]').isVisible());
const przyciski = await page.locator('[data-el="makieta-pytanie-wys"] [data-wys]').evaluateAll((els) => els.map((e) => e.dataset.wys + ':' + e.textContent.trim()));
console.log('     ' + przyciski.join(' | '));
ok('3 wybory: ciąg, narożnik, tylko ta', przyciski.length === 3 && /jeszcze 1 szafka/.test(przyciski[0]) && /Ściana A.*Ściana B.*jeszcze 3 szafki/.test(przyciski[1]));
await page.locator('[data-wys="naroznik"]').click(); await page.waitForTimeout(400);
await czekaj(() => JSON.parse(localStorage.getItem('szafki:projekt')).items[4].cab.H === 760);
let w = await wys();
ok('narożnik: A1, A2, B1, B2 = 760; słupek i komoda bez zmian', w.H === '760,760,2000,760,760,720', w.H);
ok('wysokość obu ciągów = 760', w.runs === '760,760', w.runs);

console.log('== cały ciąg ==');
await wczytaj();
await wpiszH(800);
await page.locator('[data-wys="ciag"]').click(); await page.waitForTimeout(400);
await czekaj(() => JSON.parse(localStorage.getItem('szafki:projekt')).items[1].cab.H === 800);
w = await wys();
ok('ciąg A: A1, A2 = 800; ciąg B bez zmian', w.H === '800,800,2000,720,720,720', w.H);
ok('wysokość tylko ciągu A', w.runs === '800,720', w.runs);

console.log('== tylko ta ==');
await wczytaj();
await wpiszH(700);
await page.locator('[data-wys="ta"]').click(); await page.waitForTimeout(400);
w = await wys();
ok('tylko A1 = 700', w.H === '700,720,2000,720,720,720', w.H);
ok('okienko zamknięte', !(await page.locator('[data-el="makieta-pytanie-wys"]').count()));

console.log('== przeciągnięcie górnej krawędzi też pyta ==');
await wczytaj();
const r = await page.locator('[data-u="wys"]').first().boundingBox();
const x = r.x + r.width / 2, y = r.y + r.height / 2;
await page.mouse.move(x, y); await page.mouse.down(); await page.mouse.move(x, y - 15, { steps: 5 }); await page.mouse.up(); await page.waitForTimeout(500);
ok('po przeciągnięciu okienko', await page.locator('[data-el="makieta-pytanie-wys"]').isVisible());
await page.keyboard.press('Escape'); await page.waitForTimeout(300);
ok('Esc = tylko ta szafka', !(await page.locator('[data-el="makieta-pytanie-wys"]').count()));

console.log('== wolnostojąca: bez pytania ==');
await wczytaj();
await page.locator('[data-el="mak-szafka"] button').first().click();
await page.locator('[data-el="mak-szafka"] [data-v="5"]').click(); await page.waitForTimeout(400);
await wpiszH(900);
ok('wolnostojąca — bez okienka', !(await page.locator('[data-el="makieta-pytanie-wys"]').count()));

console.log('bledy strony:', errors.length ? errors.join(' | ') : 'brak');
if (errors.length) bledy++;
console.log(bledy ? `${bledy} BLAD` : 'WSZYSTKO OK');
await browser.close();
process.exit(bledy ? 1 : 0);
