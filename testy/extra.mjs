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
const card = (re) => page.locator('section').filter({ has: page.locator('h2', { hasText: re }) }).first();
const cut = card(/^Formatki do zamówienia$/);
const rows = () => cut.evaluate((sec) => [...sec.querySelectorAll('tbody tr')].map(tr =>
  [...tr.querySelectorAll('td')].map(td => td.innerText.trim().split('\n')[0]).join(' | ')));
const totals = () => cut.evaluate((sec) => sec.innerText.replace(/\s+/g, ' '));

const before = await rows();
const t0 = await totals();
console.log('  formatek przed:', before.length);
ok('przycisk "+ dodatkowa formatka"', await page.getByText('+ dodatkowa formatka', { exact: true }).count() === 1);

await page.getByText('+ dodatkowa formatka', { exact: true }).click();
await page.waitForTimeout(600);
ok('sekcja edycji się pojawiła', /dodatkowe formatki/i.test(await totals()));

// wpisz wymiary
const box = cut.locator('div.rounded.border.border-stone-200.bg-stone-50').first();
await box.locator('input[type=text], input:not([type])').first().fill('Blat roboczy');
const nums = box.locator('input[type=number]');
await nums.nth(0).fill('1800');
await nums.nth(1).fill('600');
await nums.nth(2).fill('2');
await page.waitForTimeout(800);

const after = await rows();
console.log('  formatek po:', after.length);
ok('formatka trafiła do listy', after.some(r => /Blat roboczy/.test(r)), (after.find(r => /Blat/.test(r)) || '').slice(0, 80));
const sztukOf = (txt) => Number((txt.match(/SZTUK RAZEM (\d+)/i) || [0, '0'])[1]);
ok('sztuki policzone: bazowe + 2 dodatkowe', sztukOf(await totals()) === sztukOf(t0) + 2,
  `${sztukOf(t0)} → ${sztukOf(await totals())}`);

// oklejanie
const mbOf = async () => Number(((await totals()).match(/OBRZEŻE PCV ([\d.,]+) mb/i) || [0, '0'])[1].replace(',', '.'));
const edgeBtns = box.locator('button').filter({ hasText: /przód|bok|tył/ });
console.log('  przycisków oklejania:', await edgeBtns.count());
const mb0 = await mbOf();
await edgeBtns.first().click();
await page.waitForTimeout(800);
const mb1 = await mbOf();
ok('oklejanie przodu dolicza 2 × 1800 mm obrzeża', Math.abs(mb1 - mb0 - 3.6) < 0.15, mb0 + ' → ' + mb1 + ' mb');
await edgeBtns.nth(2).click();
await page.waitForTimeout(800);
const mb2 = await mbOf();
ok('oklejanie boku dolicza 2 × 600 mm', Math.abs(mb2 - mb1 - 1.2) < 0.15, mb1 + ' → ' + mb2 + ' mb');

// rozkroj uwzglednia dodatkowa formatke
await page.getByRole('button', { name: 'Rozkrój na płycie', exact: true }).first().click();
await page.waitForTimeout(1500);
const plan = await page.evaluate(() => {
  const sec = [...document.querySelectorAll('section')].find(s => /^Rozkrój na płycie/.test((s.querySelector('h2') || {}).textContent || ''));
  return sec ? sec.innerText.replace(/\s+/g, ' ') : null;
});
ok('rozkrój widzi dodatkową formatkę', !!plan && /Blat roboczy/.test(plan));

// zestawienie PDF konczy sie rozkrojem
await page.evaluate(() => {
  window.__snap = null;
  window.print = () => {
    const rep = document.querySelector('.print-only');
    if (!rep) return;
    const pages = [...rep.querySelectorAll('.rp-page')];
    window.__snap = {
      pages: pages.length,
      lastTxt: (pages[pages.length - 1] || {}).innerText?.replace(/\s+/g, ' ') || '',
      hasPlanSvg: (pages[pages.length - 1] || document).querySelectorAll('svg').length,
      txt: rep.innerText.replace(/\s+/g, ' '),
    };
  };
});
await page.getByRole('button', { name: 'Zestawienie PDF', exact: true }).click();
await page.waitForTimeout(2000);
const snap = await page.evaluate(() => window.__snap);
ok('zestawienie zbudowane', !!snap, snap ? snap.pages + ' stron' : 'brak');
if (snap) {
  ok('ostatnia strona to rozkrój', /Rozkrój na płycie/.test(snap.lastTxt), snap.lastTxt.slice(0, 80));
  ok('rozkrój ma rysunki arkuszy', snap.hasPlanSvg > 0, snap.hasPlanSvg + ' rysunków');
  ok('rozkrój ma tabelę podsumowania', /Największy zrzut/.test(snap.lastTxt));
  ok('dodatkowa formatka w zestawieniu', /Blat roboczy/.test(snap.txt));
}

// usuwanie
await card(/^Formatki do zamówienia$/).getByTitle('Usuń formatkę').first().click();
await page.waitForTimeout(700);
ok('usuwanie działa', !(await rows()).some(r => /Blat roboczy/.test(r)));

console.log('\nBLEDY:', errors.length ? errors.join('\n') : '(brak)');
await browser.close();
