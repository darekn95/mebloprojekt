import pw from '/opt/node22/lib/node_modules/playwright/index.js';
const { chromium } = pw;
const URL = 'http://127.0.0.1:5205/mebloprojekt-app.html';
const S = './';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const ok = (l, c, e = '') => console.log((c ? '  OK   ' : '  BLAD ') + l + (e ? ' — ' + e : ''));

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

// „Usun drzwi z tej kolumny" nazywa sie dzis „Usun kolidujace skrzydlo"
for (const btn of ['Dobuduj wspornik pionowy', 'Usuń kolidujące skrzydło']) {
  const page = await (await browser.newContext({ viewport: { width: 1440, height: 1000 } })).newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push('[pageerror] ' + e.message));
  await setup(page);
  const before = await notes(page);
  console.log('\n=== ' + btn + ' ===');
  console.log('przed:', before.join(' // ') || '(brak)');
  const b = page.getByRole('button', { name: btn });
  ok(`${btn}: błąd o zawiasie na fixie jest`, before.some((t) => /zawias wypada na elemencie stałym/.test(t)));
  ok(`${btn}: przycisk jest`, (await b.count()) > 0);
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
  ok(`${btn}: błąd znika`, !after.some((t) => /zawias wypada na elemencie stałym/.test(t)), after.join(' // ').slice(0, 160));
  if (btn.startsWith('Dobuduj')) ok('jest formatka wspornika', parts.some((x) => /Wspornik/.test(x)), parts.join(' // '));
  ok(`${btn}: bez błędów strony`, errors.length === 0, errors.join('; '));
  await page.evaluate(() => window.scrollTo(0, 0));
  try { await page.locator('svg').first().screenshot({ path: S + 'shot-btn-' + (btn.startsWith('Dobuduj') ? 'sup' : 'nodoor') + '.png' }); } catch (e) {}
  console.log('BLEDY:', errors.length ? errors.join('\n') : '(brak)');
  await page.close();
}
await browser.close();
