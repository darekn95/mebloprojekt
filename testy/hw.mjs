import pw from '/opt/node22/lib/node_modules/playwright/index.js';
const { chromium } = pw;
const URL = 'http://127.0.0.1:5205/mebloprojekt-app.html';
const S = './';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const page = await (await browser.newContext({ viewport: { width: 1440, height: 1050 } })).newPage();
const errors = [];
page.on('pageerror', (e) => errors.push('[pageerror] ' + e.message));
await page.goto(URL, { waitUntil: 'networkidle' });
await page.evaluate(() => { try { localStorage.clear(); } catch (e) {} });
await page.reload({ waitUntil: 'networkidle' });
await page.waitForTimeout(1500);
const clickView = async (v) => { await page.getByText(v, { exact: true }).first().click(); await page.waitForTimeout(700); };
const struct = page.locator('section').filter({ has: page.locator('h2', { hasText: /^Struktura wnętrza$/ }) }).first();
const stat = () => page.evaluate(() => {
  const svg = document.querySelector('svg');
  const rs = [...svg.querySelectorAll('rect')];
  const txt = [...svg.querySelectorAll('text')].map(t => t.textContent.trim());
  return {
    zawiasy: rs.filter(r => r.getAttribute('fill') === '#71717a').length,
    prowadnice: rs.filter(r => r.getAttribute('fill') === '#8b8b93').length,
    szyna: txt.filter(t => /^szyna \d/.test(t)),
    liczby: txt.filter(t => /^\d+$/.test(t)),
  };
});
const outOfView = () => page.evaluate(() => {
  const svg = document.querySelector('svg');
  const vb = svg.getAttribute('viewBox').split(/\s+/).map(Number);
  const [vx, vy, vw, vh] = vb;
  const bad = [];
  [...svg.querySelectorAll('text')].forEach((t) => {
    const b = t.getBBox();
    if (b.x < vx - 1 || b.x + b.width > vx + vw + 1 || b.y < vy - 1 || b.y + b.height > vy + vh + 1)
      bad.push(t.textContent.trim() + ' @' + Math.round(b.x) + '..' + Math.round(b.x + b.width));
  });
  return { vb: vb.join(' '), bad };
});

// --- A: same drzwi, sprawdz etykiety zawiasow ---
await clickView('Otw.');
let st = await stat();
console.log('A) 2 skrzydła, domyślna szafka');
console.log('   zawiasy:', st.zawiasy, '(4 bryły)   etykiety odległości:', st.liczby.filter(t => t === '100' || t === '616').join(', '));
let ov = await outOfView();
console.log('   viewBox:', ov.vb);
console.log('   napisy poza kadrem:', ov.bad.length ? ov.bad.join(' | ') : '(brak)');
try { await page.locator('svg').first().screenshot({ path: S + 'shot-hw-doors.png' }); } catch (e) {}

// --- B: przycisk okuc ---
const btn = page.getByRole('button', { name: /Ukryj okucia|Pokaż okucia/ });
console.log('\nB) przycisk okuć widoczny:', await btn.count());
await btn.first().click(); await page.waitForTimeout(600);
st = await stat();
console.log('   po ukryciu — zawiasy:', st.zawiasy, ', prowadnice:', st.prowadnice, '(oczekiwane 0/0)');
await btn.first().click(); await page.waitForTimeout(600);
st = await stat();
console.log('   po ponownym pokazaniu — zawiasy:', st.zawiasy);

// --- C: szuflady przy boku -> wymiary poza szafka ---
await struct.getByText('Szuflady', { exact: true }).first().click();
await page.waitForTimeout(700);
for (let i = 0; i < 2; i++) { await page.getByText('+ szuflada', { exact: true }).first().click(); await page.waitForTimeout(250); }
await page.waitForTimeout(700);
await clickView('Otw.');
st = await stat();
console.log('\nC) szuflady w jedynej kolumnie (przy boku)');
console.log('   wymiary "szyna":', st.szyna.join(', '));
ov = await outOfView();
console.log('   viewBox:', ov.vb);
console.log('   napisy poza kadrem:', ov.bad.length ? ov.bad.join(' | ') : '(brak)');
try { await page.locator('svg').first().screenshot({ path: S + 'shot-hw-railL.png' }); } catch (e) {}

// --- D: kolumna srodkowa ---
await page.locator('input[value="600"]').first().fill('1500');
await page.waitForTimeout(400);
async function fillCol(n, val) {
  const row = page.locator('div.flex.items-center.gap-2', { has: page.getByText(`Kolumna ${n}`, { exact: true }) });
  const inp = row.locator('input').first();
  await inp.scrollIntoViewIfNeeded(); await inp.fill(String(val)); await inp.blur();
  await page.waitForTimeout(600);
}
await fillCol(1, 400); await fillCol(2, 400);
await page.waitForTimeout(600);
const nCols = await page.evaluate(() => [...document.querySelectorAll('span')].filter(s => /^Kolumna \d+$/.test(s.textContent.trim())).length);
console.log('\nD) kolumn:', nCols, '— szuflady są w kolumnie 1 (skrajnej)');
// przenies szuflady do kolumny 2 (srodkowej): kol1 -> polki, kol2 -> szuflady
await struct.getByText('Półki i drzwi', { exact: true }).first().click();
await page.waitForTimeout(600);
await struct.getByText('Szuflady', { exact: true }).nth(1).click();
await page.waitForTimeout(700);
for (let i = 0; i < 2; i++) { await page.getByText('+ szuflada', { exact: true }).first().click(); await page.waitForTimeout(250); }
await clickView('Otw.');
st = await stat();
console.log('   wymiary "szyna" (kolumna środkowa):', st.szyna.join(', '));
ov = await outOfView();
console.log('   napisy poza kadrem:', ov.bad.length ? ov.bad.join(' | ') : '(brak)');
try { await page.locator('svg').first().screenshot({ path: S + 'shot-hw-railMid.png' }); } catch (e) {}

console.log('\nBLEDY:', errors.length ? errors.join('\n') : '(brak)');
await browser.close();
