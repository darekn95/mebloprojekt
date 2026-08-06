import pw from '/opt/node22/lib/node_modules/playwright/index.js';
const { chromium } = pw;
const URL = 'http://127.0.0.1:5205/mebloprojekt-app.html';
const S = './';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const errors = [];

for (const w of [1440, 1100, 900, 700]) {
  const page = await (await browser.newContext({ viewport: { width: w, height: 900 } })).newPage();
  page.on('pageerror', (e) => errors.push('[pageerror] ' + e.message));
  await page.goto(URL, { waitUntil: 'networkidle' });
  await page.evaluate(() => { try { localStorage.clear(); } catch (e) {} });
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);

  const proj = page.locator('input[placeholder="Projekt bez nazwy"]').first();
  const cabi = page.locator('input[placeholder="Nazwa szafki"]').first();
  await proj.fill('Kuchnia Kowalscy — zabudowa');
  await cabi.fill('Dolna pod zlewozmywak');
  await page.waitForTimeout(600);

  const m = await page.evaluate(() => {
    const p = document.querySelector('input[placeholder="Projekt bez nazwy"]');
    const c = document.querySelector('input[placeholder="Nazwa szafki"]');
    const fits = (el) => ({
      w: Math.round(el.getBoundingClientRect().width),
      scroll: el.scrollWidth,
      ok: el.scrollWidth <= el.clientWidth + 1,
    });
    return { proj: fits(p), cab: fits(c), hdr: Math.round(document.querySelector('header').getBoundingClientRect().height) };
  });
  console.log(
    `${w}px — projekt: ${m.proj.w}px ${m.proj.ok ? 'mieści się' : 'UCIĘTE (' + m.proj.scroll + 'px treści)'}` +
    ` | szafka: ${m.cab.w}px ${m.cab.ok ? 'mieści się' : 'UCIĘTE (' + m.cab.scroll + 'px treści)'}` +
    ` | wys. nagłówka ${m.hdr}px`
  );
  await page.screenshot({ path: S + `shot-hdr-${w}.png`, clip: { x: 0, y: 0, width: w, height: Math.min(200, m.hdr + 60) } });
  await page.close();
}
console.log('BLEDY:', errors.length ? errors.join('\n') : '(brak)');
await browser.close();
