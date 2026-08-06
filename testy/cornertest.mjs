import pw from '/opt/node22/lib/node_modules/playwright/index.js';
const { chromium } = pw;
const URL = 'http://127.0.0.1:5205/mebloprojekt-app.html';
const OUT = './shot-corners.png';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
const page = await ctx.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push('[pageerror] ' + e.message));
page.on('console', (m) => { if (m.type() === 'error' && !/favicon/.test(m.text())) errors.push('[console] ' + m.text()); });
await page.addInitScript(() => { try { localStorage.clear(); } catch (e) {} });
await page.goto(URL, { waitUntil: 'networkidle' });
await page.waitForTimeout(1500);

console.log('Renderuje sie:', await page.evaluate(() => document.body.innerText.includes('Korpus')));

async function clickText(t) {
  try { const el = page.getByText(t, { exact: true }).first(); await el.scrollIntoViewIfNeeded(); await el.click(); await page.waitForTimeout(400); return true; }
  catch (e) { console.log('nie kliknieto', JSON.stringify(t)); return false; }
}

// szerokosc 900 zeby zmiescic dwa narozniki
await page.locator('input[value="600"]').first().fill('900');
await page.waitForTimeout(300);

await page.locator('h2', { hasText: /^Wycięcie w narożniku/ }).first().click();
await page.waitForTimeout(400);
// wlacz oba narozniki
await clickText('Wytnij narożnik lewy (np. na rurę)');
await clickText('Wytnij narożnik prawy (np. na rurę)');

// przejdz przez wszystkie widoki
for (const v of ['Otw.', 'Z boku', 'Z góry', 'Z tyłu', '3D', 'Zamk.']) {
  const before = errors.length;
  await clickText(v);
  console.log(`Widok "${v}":`, errors.length > before ? 'BLAD' : 'ok');
}

// lista formatek: czy jest zabudowa dla obu?
await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
await page.waitForTimeout(400);
const body = await page.evaluate(() => document.body.innerText);
console.log('Zabudowa (lewy) w liscie:', body.includes('Zabudowa wycięcia (lewy)'));
console.log('Zabudowa (prawy) w liscie:', body.includes('Zabudowa wycięcia (prawy)'));

// zrzut widoku z tylu z oboma wycieciami
await page.evaluate(() => window.scrollTo(0, 0));
await clickText('Z tyłu');
await page.waitForTimeout(400);
try { await page.locator('svg').first().screenshot({ path: OUT }); console.log('zrzut zapisany'); } catch (e) {}

console.log('\nBLEDY (' + errors.length + '):', errors.length ? errors.join('\n') : '(brak)');
await browser.close();
