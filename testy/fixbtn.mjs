import pw from '/opt/node22/lib/node_modules/playwright/index.js';
const { chromium } = pw;
const URL = 'http://127.0.0.1:5205/mebloprojekt-app.html';
const S = './';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });

async function setup(page) {
  await page.goto(URL, { waitUntil: 'networkidle' });
  await page.evaluate(() => { try { localStorage.clear(); } catch (e) {} });
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);
  const struct = page.locator('section').filter({ has: page.locator('h2', { hasText: /^Struktura wnętrza$/ }) }).first();
  await struct.getByText('lewa', { exact: true }).first().click();
  await page.waitForTimeout(700);
  return struct;
}
const notes = (page) => page.evaluate(() => [...document.querySelectorAll('li')].map(l => l.innerText.replace(/\s+/g, ' ').trim()).filter(Boolean));

for (const btn of ['Dobuduj wspornik pionowy', 'Usuń drzwi z tej kolumny']) {
  const page = await (await browser.newContext({ viewport: { width: 1440, height: 1000 } })).newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push('[pageerror] ' + e.message));
  await setup(page);
  const before = await notes(page);
  console.log('\n=== ' + btn + ' ===');
  console.log('przed:', before.join(' // ') || '(brak)');
  const b = page.getByRole('button', { name: btn });
  console.log('przycisk widoczny:', await b.count());
  await b.first().click();
  await page.waitForTimeout(800);
  const after = await notes(page);
  console.log('po:  ', after.join(' // ') || '(brak uwag)');
  const parts = await page.evaluate(() => {
    const out = [];
    document.querySelectorAll('tr').forEach((tr) => {
      const c = [...tr.querySelectorAll('td')].map((d) => d.innerText.trim().split('\n')[0]);
      if (c.length >= 4 && /Element stały|Wspornik|Drzwi/.test(c[0])) out.push(c.slice(0, 5).join(' | '));
    });
    return out;
  });
  console.log('formatki:'); parts.forEach(p => console.log('   ', p));
  await page.evaluate(() => window.scrollTo(0, 0));
  try { await page.locator('svg').first().screenshot({ path: S + 'shot-btn-' + (btn.startsWith('Dobuduj') ? 'sup' : 'nodoor') + '.png' }); } catch (e) {}
  console.log('BLEDY:', errors.length ? errors.join('\n') : '(brak)');
  await page.close();
}
await browser.close();
