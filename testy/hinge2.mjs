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

// ustawia pole liczbowe stojace tuz za etykieta o podanym tekscie
async function setAfterLabel(label, val) {
  const ok = await page.evaluate(([label, val]) => {
    const sp = [...document.querySelectorAll('span')].find((s) => s.textContent.trim() === label);
    if (!sp) return 'brak etykiety';
    let el = sp.nextElementSibling;
    while (el && el.tagName !== 'INPUT') el = el.querySelector ? el.querySelector('input') || el.nextElementSibling : el.nextElementSibling;
    if (!el) return 'brak pola';
    const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
    setter.call(el, String(val));
    el.dispatchEvent(new Event('input', { bubbles: true }));
    return 'ok';
  }, [label, val]);
  await page.waitForTimeout(700);
  return ok;
}
const notes = () => page.evaluate(() => [...document.querySelectorAll('li')].map(l => l.innerText.replace(/\s+/g, ' ').trim()).filter(Boolean));
const hingeLabels = () => page.evaluate(() => {
  const svg = document.querySelector('svg');
  return [...svg.querySelectorAll('text')].map(t => t.textContent.trim()).filter(t => /^\d+(\.\d)?$/.test(t));
});
const hingeCount = () => page.evaluate(() => {
  const svg = document.querySelector('svg');
  return [...svg.querySelectorAll('rect')].filter(r => r.getAttribute('fill') === '#71717a' && r.getAttribute('width') === '20').length;
});
const clickView = async (v) => { await page.getByText(v, { exact: true }).first().click(); await page.waitForTimeout(600); };

// H = 1600, 1 skrzydlo -> 3 zawiasy (100 / 800 / 1500 od dolu frontu)
await page.locator('input[value="720"]').first().fill('1600');
await page.waitForTimeout(400);
console.log('drzwi ->1 :', await setAfterLabel('drzwi', 1));
console.log('polki ->0 :', await setAfterLabel('półki', 0));
await clickView('Otw.');
console.log('\nA) H=1600, 1 skrzydło, bez półek');
console.log('   zawiasów narysowanych:', await hingeCount(), '(oczekiwane 3)');
console.log('   odległości od dołu frontu:', (await hingeLabels()).join(', '), '(oczekiwane 100 / ~798 / ~1496)');
console.log('   uwagi:', (await notes()).join(' // ') || '(brak)');
try { await page.locator('svg').first().screenshot({ path: S + 'shot-h2-a.png' }); } catch (e) {}

// polka dokladnie w miejscu srodkowego zawiasu
console.log('\nB) półka wchodząca w środkowy zawias');
console.log('   polki ->1 :', await setAfterLabel('półki', 1));
await page.waitForTimeout(400);
console.log('   swiatlo 1 ->800 :', await setAfterLabel('światło 1', 800));
await clickView('Otw.');
console.log('   zawiasów:', await hingeCount());
console.log('   odległości:', (await hingeLabels()).join(', '));
console.log('   uwagi:');
(await notes()).forEach(n => console.log('     -', n));
try { await page.locator('svg').first().screenshot({ path: S + 'shot-h2-b.png' }); } catch (e) {}

await clickView('Z boku');
try { await page.locator('svg').first().screenshot({ path: S + 'shot-h2-side.png' }); } catch (e) {}
console.log('\nBLEDY:', errors.length ? errors.join('\n') : '(brak)');
await browser.close();
