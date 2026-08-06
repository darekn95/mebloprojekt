import pw from '/opt/node22/lib/node_modules/playwright/index.js';
const { chromium } = pw;
const URL = 'http://127.0.0.1:5205/mebloprojekt-app.html';
const S = './';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const ctx = await browser.newContext({ viewport: { width: 1400, height: 1000 } });
const page = await ctx.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push('[pageerror] ' + e.message));
page.on('console', (m) => { if (m.type() === 'error' && !/favicon/.test(m.text())) errors.push('[console] ' + m.text()); });
await page.goto(URL, { waitUntil: 'networkidle' });
await page.evaluate(() => { try { localStorage.clear(); } catch (e) {} });
await page.reload({ waitUntil: 'networkidle' });
await page.waitForTimeout(1500);

const txt = () => page.evaluate(() => document.body.innerText);
let b = await txt();
console.log('--- Karty ---');
for (const n of ['Korpus', 'Struktura wnętrza', 'Luzy drzwi', 'Wycięcie w narożniku', 'Elementy kolizyjne', 'Cokół', 'Nóżki', 'Blenda nad szafką', 'Płyty', 'Kontrola frontów'])
  console.log(' ', n.padEnd(24), b.includes(n) ? 'jest' : 'BRAK');
console.log('Stara karta "Cokół i wzmocnienie":', b.includes('Cokół i wzmocnienie') ? 'BLAD - nadal jest' : 'usunieta');

// zwiniete sekcje nie pokazuja tresci
console.log('Zwinieta "Luzy drzwi" — tresc ukryta:', !b.includes('Luz górny') && !b.includes('Luz przy krawędzi') ? 'ok' : 'sprawdz');

// rozwin Cokol
async function toggle(t) {
  const h = page.locator('h2', { hasText: new RegExp('^' + t + '$') }).first();
  await h.scrollIntoViewIfNeeded(); await h.click(); await page.waitForTimeout(350);
}
await toggle('Cokół');
b = await txt();
console.log('Po rozwinieciu Cokół — "Cokół pod szafką":', b.includes('Cokół pod szafką') ? 'ok' : 'BLAD');
await toggle('Cokół');
b = await txt();
console.log('Po zwinieciu Cokół — ukryte:', !b.includes('Cokół pod szafką') ? 'ok' : 'BLAD');

// Blenda
await toggle('Blenda nad szafką');
await page.getByText('Blenda nad szafką', { exact: true }).last().click();
await page.waitForTimeout(500);
b = await txt();
console.log('Blenda wl. — pole wysokości:', b.includes('Wysokość blendy') ? 'ok' : 'BLAD');

// przewijanie panelu / overflow poziomy
const overflow = await page.evaluate(() => {
  const bad = [];
  document.querySelectorAll('section, div, span, label').forEach((el) => {
    if (el.scrollWidth > el.clientWidth + 2 && el.clientWidth > 0) {
      const cs = getComputedStyle(el);
      if (cs.overflowX === 'visible') bad.push(el.tagName + '.' + (el.className || '').toString().slice(0, 60) + ' ' + el.scrollWidth + '>' + el.clientWidth);
    }
  });
  return bad.slice(0, 12);
});
console.log('Elementy z przepelnieniem w poziomie:', overflow.length ? overflow.join('\n   ') : '(brak)');
console.log('Body scrollWidth vs clientWidth:', await page.evaluate(() => document.documentElement.scrollWidth + ' / ' + document.documentElement.clientWidth));

await page.screenshot({ path: S + 'shot-cards.png', fullPage: false });
console.log('\nBLEDY:', errors.length ? errors.join('\n') : '(brak)');
await browser.close();
