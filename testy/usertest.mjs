import pw from '/opt/node22/lib/node_modules/playwright/index.js';
const { chromium } = pw;
const URL = 'http://127.0.0.1:5205/mebloprojekt-app.html';
const OUT = './shot-user.png';

const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
const page = await ctx.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
page.on('console', (m) => { if (m.type() === 'error' && !/favicon/.test(m.text())) errors.push(m.text()); });

await page.addInitScript(() => { try { localStorage.clear(); } catch (e) {} });
await page.goto(URL, { waitUntil: 'networkidle' });
await page.waitForTimeout(1500);

async function clickLabel(lbl) {
  try {
    const el = page.getByText(lbl, { exact: true }).first();
    await el.scrollIntoViewIfNeeded();
    await el.click();
    await page.waitForTimeout(300);
    return true;
  } catch (e) { console.log('nie kliknieto', JSON.stringify(lbl)); return false; }
}

// konfiguracja uzytkownika: szerokosc 900, cokol Pod korpusem, nozki (BEZ bokow)
await page.locator('input[value="600"]').first().fill('900');
await page.waitForTimeout(300);
await clickLabel('Cokół');
await clickLabel('Pod korpusem');
await clickLabel('Nóżki pod szafką');

// TEST 1: rysunek — cokol nie moze nachodzic na wymiar 800
await page.waitForTimeout(500);
await page.evaluate(() => window.scrollTo(0, 0));
await page.waitForTimeout(300);
try { await page.locator('svg').first().screenshot({ path: OUT }); console.log('zrzut rysunku zapisany'); }
catch (e) { await page.screenshot({ path: OUT }); }

// TEST 2: pole "Szerokosc frezu" = 16 po wlaczeniu "We frezie"
await clickLabel('We frezie');
await page.waitForTimeout(400);
const frez = await page.evaluate(() => {
  // znajdz label "Szerokosc" i "frezu" oraz wartosc inputa w tym samym polu
  const labels = [...document.querySelectorAll('*')].filter(e => e.children.length === 0 && e.textContent.trim() === 'Szerokość');
  if (!labels.length) return { found: false };
  // wejdz do kontenera Field i znajdz input
  let node = labels[0];
  for (let i = 0; i < 4 && node; i++) {
    const inp = node.querySelector && node.querySelector('input');
    if (inp) return { found: true, value: inp.value, hasHintFrezu: node.textContent.includes('frezu') };
    node = node.parentElement;
  }
  return { found: true, value: '(input nie znaleziony)' };
});
console.log('Pole Szerokosc frezu:', JSON.stringify(frez));

// czy stary label "Odsuniecie" zniknal?
const hasOld = await page.evaluate(() => document.body.innerText.includes('Odsunięcie'));
console.log('Stary label "Odsuniecie" obecny:', hasOld);
console.log('BLEDY:', errors.length ? errors.join(' | ') : '(brak)');
await browser.close();
