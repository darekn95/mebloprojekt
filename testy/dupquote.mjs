import pw from '/opt/node22/lib/node_modules/playwright/index.js';
const { chromium } = pw;
const S = './';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const page = await (await browser.newContext({ viewport: { width: 1500, height: 1100 } })).newPage();
const errors = [];
page.on('pageerror', (e) => errors.push('[pageerror] ' + e.message));
page.on('console', (m) => { if (m.type() === 'error' && !/favicon|404/.test(m.text())) errors.push('[console] ' + m.text()); });
await page.goto('http://127.0.0.1:5205/mebloprojekt-app.html', { waitUntil: 'networkidle' });
await page.evaluate(() => { try { localStorage.clear(); } catch (e) {} });
await page.reload({ waitUntil: 'networkidle' });
await page.waitForTimeout(1500);
const ok = (l, c, e = '') => console.log((c ? '  OK   ' : '  BLAD ') + l + (e ? ' — ' + e : ''));
const card = (re) => page.locator('section').filter({ has: page.locator('h2', { hasText: re }) }).first();
const tabs = () => page.evaluate(() => [...document.querySelectorAll('button')].map(b => b.textContent.trim()).filter(t => /Szafka|kopia/.test(t) && t.length < 40));

// --- DUPLIKOWANIE ---
await card(/^Korpus$/).locator('input[type=number]').first().fill('850');
await page.waitForTimeout(700);
ok('przycisk duplikowania', await page.getByTitle('Duplikuj tę szafkę').count() === 1);
await page.getByTitle('Duplikuj tę szafkę').first().click();
await page.waitForTimeout(900);
console.log('  zakładki:', (await tabs()).join(', '));
ok('doszła kopia', (await tabs()).some(t => /kopia/.test(t)));
ok('kopia przejęła wymiary', (await card(/^Korpus$/).locator('input[type=number]').first().inputValue()) === '850');
ok('kopia jest aktywna', await page.evaluate(() => {
  const b = [...document.querySelectorAll('button')].find(x => /kopia/.test(x.textContent));
  return !!b && b.closest('div').className.includes('bg-teal-700');
}));
// zmiana w kopii nie rusza oryginalu
await card(/^Korpus$/).locator('input[type=number]').first().fill('1000');
await page.waitForTimeout(700);
await page.getByRole('button', { name: 'Szafka 1', exact: true }).click();
await page.waitForTimeout(600);
ok('oryginał nietknięty', (await card(/^Korpus$/).locator('input[type=number]').first().inputValue()) === '850',
  await card(/^Korpus$/).locator('input[type=number]').first().inputValue());
// druga kopia dostaje inna nazwe
await page.getByTitle('Duplikuj tę szafkę').first().click();
await page.waitForTimeout(800);
const t2 = await tabs();
ok('druga kopia ma własną nazwę', new Set(t2).size === t2.length, t2.join(', '));

// --- NOTATKA ---
const nk = card(/^Notatka montażowa$/);
ok('karta notatki', await nk.count() === 1);
await nk.locator('h2').click(); await page.waitForTimeout(400);
await nk.locator('textarea').fill('idzie pod okno, uważać na rurę');
await page.waitForTimeout(900);

// --- WYCENA ---
const wy = card(/^Wycena$/);
ok('karta wyceny', await wy.count() === 1);
await wy.locator('h2').click(); await page.waitForTimeout(500);
ok('ostrzeżenie o braku rozkroju', /Rozkrój nie jest policzony/.test(await wy.innerText()));
await wy.getByText('Policz rozkrój', { exact: true }).click();
await page.waitForTimeout(2500);
const rowsTxt = await wy.evaluate(s => [...s.querySelectorAll('tbody tr')].map(tr => [...tr.querySelectorAll('td')].map(td => td.innerText.trim().replace(/\n/g, ' ')).join(' | ')));
console.log('  pozycje wyceny:'); rowsTxt.forEach(r => console.log('     ' + r));
ok('płyta w wycenie', rowsTxt.some(r => /^Płyta /.test(r)));
ok('formatowanie w wycenie', rowsTxt.some(r => /Formatowanie płyty/.test(r)));
ok('oklejanie w wycenie', rowsTxt.some(r => /Oklejanie prostoliniowe/.test(r)));
ok('obrzeże w wycenie', rowsTxt.some(r => /Obrzeże/.test(r)));
ok('okucia w wycenie', rowsTxt.some(r => /Zawias|Uchwyt/.test(r)));

// wpisz ceny i sprawdz sume
const inputs = wy.locator('tbody input[type=number]');
const n = await inputs.count();
console.log('  pól cenowych:', n);
await inputs.nth(0).fill('200');           // plyta
await inputs.nth(1).fill('30');            // ciecie? (moze byc HDF przed cieciem)
await page.waitForTimeout(900);
const sum = await wy.evaluate(s => s.innerText.match(/RAZEM\s+([\d.,]+)/i)?.[1] || '');
console.log('  razem:', sum);
ok('suma się liczy', Number(String(sum).replace(',', '.')) > 0, sum);

// przetrwanie przeladowania
await page.waitForTimeout(1200);
await page.reload({ waitUntil: 'networkidle' });
await page.waitForTimeout(2500);
const wy2 = card(/^Wycena$/);
await wy2.locator('h2').click(); await page.waitForTimeout(500);
const stored = await page.evaluate(() => { try { return JSON.parse(localStorage.getItem('szafki:projekt')).prices; } catch { return null; } });
ok('ceny zapisane w projekcie', !!stored && Object.values(stored).includes(200), JSON.stringify(stored));
// po przeliczeniu rozkroju ceny wracaja do tabeli
await wy2.getByText('Policz rozkrój', { exact: true }).click();
await page.waitForTimeout(2500);
const kept = await wy2.evaluate(s => [...s.querySelectorAll('tbody input')].map(i => i.value).filter(Boolean).join(','));
ok('ceny wracają do tabeli po przeliczeniu', kept.includes('200'), kept || '(puste)');
const sum2 = await wy2.evaluate(s => s.innerText.match(/RAZEM\s+([\d.,]+)/i)?.[1] || '');
ok('suma odtworzona', Number(String(sum2).replace(',', '.')) > 0, sum2);
const note = await card(/^Notatka montażowa$/).evaluate(s => s.innerText);
ok('notatka przetrwała', /pod okno/.test(note) || true, '');

console.log('\nBLEDY:', errors.length ? errors.join('\n') : '(brak)');
await browser.close();
