import pw from '/opt/node22/lib/node_modules/playwright/index.js';
const { chromium } = pw;

const URL = process.argv[2] || 'http://127.0.0.1:5199/preview-local.html';
const OUTDIR = '.';

const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });

const errors = [];
page.on('console', (msg) => { if (msg.type() === 'error' && !/favicon/.test(msg.text())) errors.push(`[console.error] ${msg.text()}`); });
page.on('pageerror', (err) => errors.push(`[pageerror] ${err.message}`));

await page.goto(URL, { waitUntil: 'networkidle', timeout: 20000 });
await page.waitForTimeout(1500);

async function clickText(label) {
  const errBefore = errors.length;
  const el = page.getByText(label, { exact: true }).first();
  try {
    await el.click({ timeout: 4000 });
    await page.waitForTimeout(700);
    const newErrs = errors.slice(errBefore);
    console.log(`CLICK "${label}": ${newErrs.length ? 'BŁĄD -> ' + newErrs.join(' | ') : 'ok'}`);
    return newErrs.length === 0;
  } catch (e) {
    console.log(`CLICK "${label}": nie znaleziono/nie kliknięto (${e.message.split('\n')[0]})`);
    return false;
  }
}

// Test each view toggle
for (const label of ['Otw.', 'Z boku', 'Z góry', 'Z tyłu', '3D', 'Zamk.']) {
  await clickText(label);
}
await page.screenshot({ path: `${OUTDIR}/shot-3d.png` });

// Toggle options
for (const label of ['Pokaż szczeliny', 'Realne kolory', 'Oznacz pola', 'Ukryj wymiary']) {
  await clickText(label);
}

// Change a dimension
try {
  const width = page.locator('input[value="600"]').first();
  await width.fill('900');
  await page.waitForTimeout(600);
  console.log('ZMIANA szerokości na 900: ' + (errors.length ? 'sprawdź błędy' : 'ok'));
} catch (e) { console.log('ZMIANA szerokości: ' + e.message.split('\n')[0]); }

// Add a level
await clickText('+ poziom');
await page.screenshot({ path: `${OUTDIR}/shot-final.png` });

console.log('\n=== WSZYSTKIE BŁĄDY (' + errors.length + ') ===');
console.log(errors.join('\n') || '(brak)');

await browser.close();
