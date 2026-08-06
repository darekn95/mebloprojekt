import pw from '/opt/node22/lib/node_modules/playwright/index.js';
const { chromium } = pw;
const URL = 'http://127.0.0.1:5205/mebloprojekt-app.html';
const S = './';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const page = await (await browser.newContext({ viewport: { width: 1500, height: 1100 } })).newPage();
const errors = [];
page.on('pageerror', (e) => errors.push('[pageerror] ' + e.message));
page.on('console', (m) => { if (m.type() === 'error' && !/favicon|404/.test(m.text())) errors.push('[console] ' + m.text()); });
await page.goto(URL, { waitUntil: 'networkidle' });
await page.evaluate(() => { try { localStorage.clear(); } catch (e) {} });
await page.reload({ waitUntil: 'networkidle' });
await page.waitForTimeout(1500);
const ok = (l, c, e = '') => console.log((c ? '  OK   ' : '  BLAD ') + l + (e ? ' — ' + e : ''));
const btn = (n) => page.getByRole('button', { name: n, exact: true });
const planCard = () => page.locator('section').filter({ has: page.locator('h2', { hasText: /^Rozkrój na płycie/ }) }).first();

// --- jedna szafka ---
ok('przycisk "Rozkrój na płycie" przy formatkach', await btn('Rozkrój na płycie').count() === 1);
ok('karta rozkroju ukryta przed kliknięciem', await planCard().count() === 0);

const t0 = Date.now();
await btn('Rozkrój na płycie').first().click();
await page.waitForTimeout(1200);
console.log('  (czas do wyniku: ' + (Date.now() - t0) + ' ms)');
ok('karta rozkroju się pojawiła', await planCard().count() === 1);

const info = await page.evaluate(() => {
  const sec = [...document.querySelectorAll('section')].find(s => /^Rozkrój na płycie/.test((s.querySelector('h2') || {}).textContent || ''));
  if (!sec) return null;
  const svgs = [...sec.querySelectorAll('svg')];
  const parts = svgs.map(sv => [...sv.querySelectorAll('rect')].length - 1);
  return {
    txt: sec.innerText.replace(/\s+/g, ' '),
    sheets: svgs.length,
    parts,
    // sprawdz, czy formatki nie wychodza poza arkusz i nie nachodza
    bad: (() => {
      const out = [];
      svgs.forEach((sv, si) => {
        const vb = sv.getAttribute('viewBox').split(/\s+/).map(Number);
        const all = [...sv.querySelectorAll('rect')].slice(1);
        const offs = all.filter(r => r.getAttribute('stroke') === '#15803d').map(r => ({
          x: +r.getAttribute('x'), y: +r.getAttribute('y'),
          w: +r.getAttribute('width'), h: +r.getAttribute('height'),
        }));
        const rs = all.filter(r => r.getAttribute('stroke') !== '#15803d').map(r => ({
          x: +r.getAttribute('x'), y: +r.getAttribute('y'),
          w: +r.getAttribute('width'), h: +r.getAttribute('height'),
        }));
        rs.forEach(r => {
          if (r.x < -0.001 || r.y < -0.001 || r.x + r.w > 2800.001 || r.y + r.h > 2100.001)
            out.push('arkusz ' + (si + 1) + ': poza obrysem');
        });
        for (let a = 0; a < rs.length; a++) for (let b = a + 1; b < rs.length; b++) {
          const A = rs[a], B = rs[b];
          const ox = Math.min(A.x + A.w, B.x + B.w) - Math.max(A.x, B.x);
          const oy = Math.min(A.y + A.h, B.y + B.h) - Math.max(A.y, B.y);
          if (ox > 0.001 && oy > 0.001) out.push('arkusz ' + (si + 1) + ': nachodzenie');
        }
        offs.forEach(o => {
          if (o.x < -0.001 || o.y < -0.001 || o.x + o.w > 2800.001 || o.y + o.h > 2100.001)
            out.push('arkusz ' + (si + 1) + ': zrzut poza obrysem');
          rs.forEach(p => {
            const ox = Math.min(o.x + o.w, p.x + p.w) - Math.max(o.x, p.x);
            const oy = Math.min(o.y + o.h, p.y + p.h) - Math.max(o.y, p.y);
            if (ox > 0.001 && oy > 0.001) out.push('arkusz ' + (si + 1) + ': zrzut nachodzi na formatkę');
          });
        });
      });
      return [...new Set(out)];
    })(),
  };
});
if (!info) ok('odczyt karty', false);
else {
  ok('arkusze narysowane', info.sheets > 0, info.sheets + ' arkuszy, formatki na arkusz: ' + info.parts.join('/'));
  ok('formatki i zrzuty rozłączne, w obrysie', info.bad.length === 0, info.bad.join(' | '));
  ok('zrzuty zaznaczone i opisane', /zrzut \d+×\d+/.test(info.txt), (info.txt.match(/zrzut \d+×\d+/g) || []).slice(0,3).join(', '));
  ok('podsumowanie mówi co zostaje', /zostaje \d+×\d+ mm/.test(info.txt), (info.txt.match(/zostaje \d+×\d+ mm[^A-Z]*/g) || []).join(' | ').slice(0,110));
  ok('podsumowanie z liczbą płyt', /płyty do zamówienia/i.test(info.txt));
  ok('wymiar arkusza w opisie', /2800/.test(info.txt) && /2100/.test(info.txt));
  ok('poprawna odmiana', /\d arkusz(e|y)?\b/.test(info.txt), (info.txt.match(/\d+ arkusz\w*/g) || []).join(', '));
  console.log('  podsumowanie:', (info.txt.match(/P.YTY DO ZAM.WIENIA.*/i) || [''])[0].slice(0, 120));
}
await planCard().scrollIntoViewIfNeeded();
await page.screenshot({ path: S + 'shot-plan1.png', clip: await planCard().boundingBox().then(b => ({ x: b.x, y: Math.max(0, b.y), width: b.width, height: Math.min(900, b.height) })) });

// zamkniecie
await btn('Zamknij').first().click();
await page.waitForTimeout(500);
ok('przycisk Zamknij chowa kartę', await planCard().count() === 0);

// --- caly projekt ---
await page.getByText('+ szafka', { exact: true }).click();
await page.waitForTimeout(900);
const cnt = await btn('Rozkrój na płycie').count();
ok('przy 2 szafkach przycisk tylko przy liście projektu', cnt === 1, cnt + ' przycisk(ów)');
const t1 = Date.now();
await btn('Rozkrój na płycie').first().click();
await page.waitForTimeout(1500);
console.log('  (czas dla projektu: ' + (Date.now() - t1) + ' ms)');
const txt2 = await page.evaluate(() => {
  const sec = [...document.querySelectorAll('section')].find(s => /^Rozkrój na płycie/.test((s.querySelector('h2') || {}).textContent || ''));
  return sec ? { t: sec.innerText.replace(/\s+/g, ' '), svgs: sec.querySelectorAll('svg').length, title: sec.querySelector('h2').textContent } : null;
});
ok('rozkrój dla całego projektu', !!txt2 && /cały projekt/.test(txt2.title), txt2 ? txt2.title : 'brak');
ok('więcej formatek → arkusze', !!txt2 && txt2.svgs > 0, txt2 ? txt2.svgs + ' arkuszy' : '');

console.log('\nBLEDY:', errors.length ? errors.join('\n') : '(brak)');
await browser.close();
