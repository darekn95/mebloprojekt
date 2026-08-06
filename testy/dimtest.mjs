import pw from '/opt/node22/lib/node_modules/playwright/index.js';
const { chromium } = pw;
const URL = 'http://127.0.0.1:5205/mebloprojekt-app.html';
const OUT = './shot-dims.png';

const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
const page = await ctx.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
page.on('console', (m) => { if (m.type() === 'error' && !/favicon/.test(m.text())) errors.push(m.text()); });

// czysty start (bez zapisanego projektu)
await page.addInitScript(() => { try { localStorage.clear(); } catch (e) {} });
await page.goto(URL, { waitUntil: 'networkidle' });
await page.waitForTimeout(1500);

// 1. szerokosc 900
const w = page.locator('input[value="600"]').first();
await w.fill('900');
await page.waitForTimeout(400);

// 2. wszystkie "na boku" (wieniec L/P, dno L/P) -> boki krotsze niz wysokosc
const naboku = page.getByText('na boku', { exact: true });
const n = await naboku.count();
for (let i = 0; i < n; i++) { try { await naboku.nth(i).click(); await page.waitForTimeout(150); } catch (e) {} }

// 3. wlacz Cokol, ustaw "Pod korpusem", wlacz Nozki
async function clickLabel(lbl) {
  try {
    const el = page.getByText(lbl, { exact: true }).first();
    await el.scrollIntoViewIfNeeded();
    await el.click();
    await page.waitForTimeout(350);
    return true;
  } catch (e) { console.log('nie kliknieto', JSON.stringify(lbl), e.message.split('\n')[0]); return false; }
}
await clickLabel('Cokół');
await clickLabel('Pod korpusem');       // cokol jako osobna podstawa (widoczny wymiar)
await clickLabel('Nóżki pod szafką');

await page.waitForTimeout(600);
// przewin do gory, zeby rysunek byl widoczny
await page.evaluate(() => window.scrollTo(0, 0));
await page.waitForTimeout(300);

// zrzut samego rysunku (SVG)
const svg = page.locator('svg').first();
try {
  await svg.screenshot({ path: OUT });
  console.log('zrzut SVG zapisany');
} catch (e) {
  await page.screenshot({ path: OUT });
  console.log('zrzut calej strony (svg fail):', e.message.split('\n')[0]);
}

// sprawdz czy sa etykiety bok L / bok P w SVG
const hasBokL = await page.evaluate(() => document.body.innerHTML.includes('bok L'));
const hasBokP = await page.evaluate(() => document.body.innerHTML.includes('bok P'));
console.log('bok L widoczne:', hasBokL, '| bok P widoczne:', hasBokP);
console.log('BLEDY:', errors.length ? errors.join(' | ') : '(brak)');
await browser.close();
