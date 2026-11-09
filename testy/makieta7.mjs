// Makieta: rodzaj zabudowy NA CIAG (uzytkownik 2026-11-09: „Na ciąg”) — Kuchnia / Szafa (bez blatu) / Wolnostojaca:
// `run.zabudowa`, blat ciagu, kolejnosc palety „Nowe szafki”, AGD tylko w kuchni, bez sciany dla wolnostojacej,
// szerokosci (i wysokosci) do klikniecia w karcie „Szafka” jak w makiecie „Dodaj”.
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
  const w = (n, W) => { const it = JSON.parse(JSON.stringify(wzor)); it.cab.name = n; it.cab.W = W; return { ...it, runId: 'r1' }; };
  p.runs = [{ id: 'r1', name: 'Ściana A', roomId: 'p1', worktop: true, wallW: 3000 }];
  p.items = [w('Lewa', 600), w('Środek', 800), w('Prawa', 400)];
  p.active = 1;
  localStorage.setItem('szafki:projekt', JSON.stringify(p));
  localStorage.setItem('mp-tryb', 'prosta');
});
await page.reload({ waitUntil: 'networkidle' });
await page.waitForTimeout(1200);
const proj = () => page.evaluate(() => JSON.parse(localStorage.getItem('szafki:projekt')));
const czekaj = async (f) => { await page.waitForFunction((src) => { const p = JSON.parse(localStorage.getItem('szafki:projekt')); try { return new Function('p', 'return ' + src)(p); } catch (e) { return false; } }, f, { timeout: 5000 }).catch(() => {}); return proj(); };
const zakl = async (k) => { const b = page.locator(`[data-el="makieta"] nav [data-zakl="${k}"]`);
  if ((await b.getAttribute('aria-pressed')) !== 'true' || !(await page.locator('[data-el="mak-karta-panel"]').count())) await b.click(); await page.waitForTimeout(250); };
const dodajSek = async (k) => { await zakl('dodaj'); const b = page.locator(`[data-el="mak-dodaj"] [data-dodaj="${k}"]`);
  if ((await b.getAttribute('aria-expanded')) !== 'true') await b.click(); await page.waitForTimeout(250); };
const rodzaj = (v) => page.locator(`[data-el="mak-rodzaj"] [data-v="${v}"]`);
const pierwszaGrupa = () => page.locator('[data-el="mak-paleta"] p.uppercase').first().innerText();

console.log('== kuchnia (domyślnie) ==');
ok('ciąg bez pola — „Kuchnia”', (await rodzaj('kuchnia').getAttribute('aria-pressed')) === 'true');
await dodajSek('szafki');
ok('„Nowe szafki”: najpierw Kuchnia — dół', /kuchnia — dół/i.test(await pierwszaGrupa()), await pierwszaGrupa());
ok('„Dodaj → AGD” jest w kuchni', (await page.locator('[data-el="mak-dodaj"] [data-dodaj="agd"]').count()) === 1);
await zakl('szafka');
const szer = await page.locator('[data-el="mak-szer"] [data-v]').evaluateAll((els) => els.map((e) => e.dataset.v).join(','));
ok('szerokości szafki dolnej jak w makiecie', szer === '300,400,450,500,600,800,900', szer);
await page.locator('[data-el="mak-szer"] [data-v="600"]').click();
let p = await czekaj('p.items[1].cab.W === 600');
ok('klik „600” → szerokość 600', p.items[1].cab.W === 600, String(p.items[1].cab.W));

console.log('== szafa (bez blatu) ==');
await rodzaj('szafa').click();
p = await czekaj('p.runs[0].zabudowa === "szafa"');
ok('„Szafa”: run.zabudowa, blat ciągu wyłączony', p.runs[0].zabudowa === 'szafa' && p.runs[0].worktop === false, JSON.stringify({ z: p.runs[0].zabudowa, w: p.runs[0].worktop }));
ok('nagłówek „Zabudowa …”', /Zabudowa/.test(await page.locator('[data-el="mak-naglowek"] h2').innerText()));
const szer2 = await page.locator('[data-el="mak-szer"] [data-v]').evaluateAll((els) => els.map((e) => e.dataset.v).join(','));
ok('szerokości szafy', szer2 === '400,500,600,800,1000,1200', szer2);
await dodajSek('szafki');
ok('„Nowe szafki”: najpierw Szafa w zabudowie', /szafa w zabudowie/i.test(await pierwszaGrupa()), await pierwszaGrupa());
ok('AGD schowane poza kuchnią (z podpowiedzią)', !(await page.locator('[data-el="mak-dodaj"] [data-dodaj="agd"]').count()) && (await page.locator('[data-el="mak-agd-kuchnia"]').count()) === 1);

console.log('== wolnostojąca ==');
await rodzaj('wolnostojaca').click();
p = await czekaj('p.runs[0].zabudowa === "wolnostojaca"');
ok('„Wolnostojąca”: bez ściany (pole, tło)', !(await page.locator('[data-el="mak-sciana"]').count()) && !(await page.locator('[data-el="makieta"] [data-el="tlo-sciany"]').count()));
await dodajSek('szafki');
ok('„Nowe szafki”: najpierw Wolnostojące', /wolnostojące/i.test(await pierwszaGrupa()), await pierwszaGrupa());
await zakl('szafka');
ok('wolnostojąca: wysokości do kliknięcia', (await page.locator('[data-el="mak-wys"] [data-v="800"]').count()) === 1);

console.log('== z powrotem kuchnia ==');
await rodzaj('kuchnia').click();
p = await czekaj('p.runs[0].zabudowa === "kuchnia" && p.runs[0].worktop === true');
ok('„Kuchnia”: blat ciągu wraca', p.runs[0].worktop === true && p.runs[0].zabudowa === 'kuchnia');
await page.reload({ waitUntil: 'networkidle' }); await page.waitForTimeout(800);
await rodzaj('szafa').click(); await czekaj('p.runs[0].zabudowa === "szafa"');
await page.reload({ waitUntil: 'networkidle' }); await page.waitForTimeout(800);
ok('rodzaj zostaje po wczytaniu projektu', (await rodzaj('szafa').getAttribute('aria-pressed')) === 'true');

console.log('== kolory rysunku wg trybu ==');
const fille = () => page.evaluate(() => [...new Set([...document.querySelectorAll('[data-el="makieta"] [data-el="makieta-szafka"] rect')].map((r) => (r.getAttribute('fill') || '').toLowerCase()))]);
let f = await fille();
ok('prosta: płyty jasne jak w makiecie (bez kolorów materiału)', f.includes('#fbfaf8') && !f.includes('#d8c3a0'), f.slice(0, 8).join(' '));
ok('prosta: bez przełącznika „Kolory płyt”', !(await page.locator('[data-el="mak-przel"] [data-p="kolory"]').count()));
await page.locator('[data-el="tryb"] button', { hasText: 'szczegółowa' }).click(); await page.waitForTimeout(500);
f = await fille();
ok('szczegółowa: „Kolory płyt” włączone — kolory materiału', (await page.locator('[data-el="mak-przel"] [data-p="kolory"]').getAttribute('aria-pressed')) === 'true' && f.includes('#d8c3a0'), f.slice(0, 8).join(' '));
await page.locator('[data-el="mak-przel"] [data-p="kolory"]').click(); await page.waitForTimeout(400);
f = await fille();
ok('szczegółowa, „Kolory płyt” wyłączone — jasne', f.includes('#fbfaf8') && !f.includes('#d8c3a0'), f.slice(0, 8).join(' '));
const pk = await proj();
ok('kolory w projekcie nietknięte', pk.items.every((it) => it.mat.board.color === '#d8c3a0'), pk.items.map((it) => it.mat.board.color).join(','));
console.log('bledy strony:', errors.length ? errors.join(' | ') : 'brak');
if (errors.length) bledy++;
console.log(bledy ? `${bledy} BLAD` : 'WSZYSTKO OK');
await browser.close();
process.exit(bledy ? 1 : 0);
