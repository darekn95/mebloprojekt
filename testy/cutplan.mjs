import pw from './pw.mjs';
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
ok('bez przycisku "Rozkrój na płycie" — karta rozkroju jest cały czas', await btn('Rozkrój na płycie').count() === 0);

const t0 = Date.now();
await page.waitForFunction(() => window.__audytRozkroj && window.__audytRozkroj.aktualny, null, { timeout: 15000 }); // rozkroj cały czas, bez przycisku (2026-09-30)
await page.waitForTimeout(300);
ok('karta rozkroju widoczna bez klikania', await planCard().count() === 1);
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

// karta rozkroju jest cały czas (uzytkownik 2026-09-30) — bez „Zamknij”
ok('karta rozkroju zostaje, bez przycisku Zamknij', (await planCard().count()) === 1 && (await btn('Zamknij').count()) === 0);

// --- caly projekt ---
await page.getByText('+ szafka', { exact: true }).click();
await page.waitForTimeout(900);
const cnt = await btn('Rozkrój na płycie').count();
ok('przy 2 szafkach też bez przycisku rozkroju', cnt === 0, cnt + ' przycisk(ów)');
// karta rozkroju pokazuje sie sama, bez klikania (uzytkownik 2026-09-30)
await page.waitForTimeout(1800);
const sam = await page.evaluate(() => [...document.querySelectorAll('section h2')].map((h) => h.textContent).find((t) => /^Rozkrój na płycie/.test(t)) || '');
ok('rozkrój całego projektu widać bez klikania', /cały projekt/.test(sam), sam);
ok('w wycenie nie ma przycisku „Pokaż rozkrój”', (await btn('Pokaż rozkrój').count()) === 0);
const t1 = Date.now();
await page.waitForFunction(() => window.__audytRozkroj && window.__audytRozkroj.aktualny, null, { timeout: 15000 }); // rozkroj cały czas, bez przycisku (2026-09-30)
await page.waitForTimeout(1500);
console.log('  (czas dla projektu: ' + (Date.now() - t1) + ' ms)');
const txt2 = await page.evaluate(() => {
  const sec = [...document.querySelectorAll('section')].find(s => /^Rozkrój na płycie/.test((s.querySelector('h2') || {}).textContent || ''));
  return sec ? { t: sec.innerText.replace(/\s+/g, ' '), svgs: sec.querySelectorAll('svg').length, title: sec.querySelector('h2').textContent } : null;
});
ok('rozkrój dla całego projektu', !!txt2 && /cały projekt/.test(txt2.title), txt2 ? txt2.title : 'brak');
ok('więcej formatek → arkusze', !!txt2 && txt2.svgs > 0, txt2 ? txt2.svgs + ' arkuszy' : '');

// --- blat roboczy: w „Płytach do zamówienia” jego arkusz, nie 2800 × 2100 (audyt GPT B3) ---
{
  const PL = { on: true, height: 100, mode: 'under', setback: 0 };
  const cab = (n) => ({ cab: { name: n, W: 600, H: 720, D: 560, plinth: PL, levels: [{ h: null, cols: [{ kind: 'doors', doors: 2, w: null }] }] }, runId: 'c1', offset: 0 });
  await page.evaluate((q) => { localStorage.clear(); localStorage.setItem('szafki:projekt', JSON.stringify(q)); }, { name: 'B3', active: 0, prices: {},
    runs: [{ id: 'c1', name: 'Ściana 1', wallW: null, gap: 0, mountY: 0, H: 720, D: 560, plinth: PL, worktop: true, corner: null }], items: [cab('A'), cab('B')] });
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForFunction(() => window.__audytRozkroj && window.__audytRozkroj.aktualny, null, { timeout: 15000 });
  await page.waitForTimeout(400);
  const linie = await page.evaluate(() => { const sec = document.getElementById('rozkroj'); if (!sec) return [];
    const t = sec.innerText; const i = t.indexOf('PŁYTY DO ZAMÓWIENIA') >= 0 ? t.indexOf('PŁYTY DO ZAMÓWIENIA') : t.indexOf('Płyty do zamówienia');
    return i < 0 ? [] : t.slice(i).split('\n').slice(1).filter(Boolean); });
  const blat = linie.find((l) => /^Blat roboczy:/.test(l)) || '';
  const plyta = linie.find((l) => !/^Blat roboczy:|^HDF/.test(l)) || '';
  ok('blat roboczy w zamówieniu: arkusze 4100×600', /arkusz\S* 4100×600/.test(blat), blat || linie.join(' / '));
  ok('płyta meblowa dalej 2800×2100', /arkusz\S* 2800×2100/.test(plyta), plyta);

  /* PDF (audyt GPT, kontrola PDF 2026-10-16): naglowek rozkroju bez wspolnego
     „arkusz 2800 × 2100” — format w wierszu kazdego materialu; naglowek
     materialu w jednym bloku z pierwszymi rysunkami (nie zostaje sam na dole
     strony); „N szafek”; zlacza blatu w produktach calego projektu. */
  await page.evaluate(() => { window.__pdf = null; window.print = () => {
    const root = document.querySelector('.print-only');
    const secs = [...root.querySelectorAll('section.rp-page')].map((s) => s.innerText);
    const rozSec = [...root.querySelectorAll('section.rp-page')].find((x) => /Rozkrój na płycie/.test(x.textContent));
    const roz = rozSec ? rozSec.firstElementChild.textContent : '';
    const tab = [...root.querySelectorAll('table')].find((t) => /Arkuszy/.test(t.querySelector('thead')?.textContent || ''));
    window.__pdf = { secs, roz,
      wiersze: tab ? [...tab.querySelectorAll('tbody tr')].map((tr) => [...tr.children].map((x) => x.textContent.trim())) : [],
      bloki: [...root.querySelectorAll('[data-el="rozkroj-material"]')].map((b) => ({ tytul: b.firstElementChild.textContent, rysunki: b.querySelectorAll('svg').length })) }; }; });
  await page.getByRole('button', { name: 'Zestawienie PDF', exact: true }).first().click(); await page.waitForTimeout(1200);
  const pdf = (await page.evaluate(() => window.__pdf)) || { secs: [], roz: '', wiersze: [], bloki: [] };
  const naglowek = pdf.roz;
  ok('PDF: nagłówek rozkroju bez wspólnego „arkusz 2800 × 2100”', !!naglowek && !/2800 × 2100/.test(naglowek), naglowek);
  const wBlat = pdf.wiersze.find((r) => /^Blat roboczy/.test(r[0])) || [], wPlyta = pdf.wiersze.find((r) => !/^Blat roboczy|^HDF/.test(r[0])) || [];
  ok('PDF: w tabeli blat roboczy z arkuszem 4100 × 600 mm', wBlat[1] === '4100 × 600 mm', JSON.stringify(wBlat));
  ok('PDF: płyta z arkuszem 2800 × 2100 mm (po okrawaniu …)', /^2800 × 2100 mm \(po okrawaniu [\d.,]+ × [\d.,]+ mm\)$/.test(wPlyta[1] || ''), JSON.stringify(wPlyta));
  ok('PDF: nagłówek każdego materiału w bloku z pierwszym rysunkiem', pdf.bloki.length === pdf.wiersze.length && pdf.bloki.every((b) => b.rysunki >= 1 && / — arkusz \d/.test(b.tytul)),
    JSON.stringify(pdf.bloki));
  const zbior = pdf.secs.find((t) => /Formatki całego projektu/.test(t)) || '';
  ok('PDF: „Formatki całego projektu — 2 szafki”', /Formatki całego projektu — 2 szafki/.test(zbior), (/Formatki całego projektu — [^E]*/.exec(zbior) || [''])[0]);
}

// PDF: zlacza blatu w „Produkty całego projektu” (kontrola PDF: P2 — w obecnym kodzie sa)
{
  const PL = { on: true, height: 100, mode: 'under', setback: 0 };
  const cab = (n, runId, W = 900) => ({ cab: { name: n, W, H: 720, D: 560, plinth: PL, levels: [{ h: null, cols: [{ kind: 'doors', doors: 2, w: null }] }] }, runId, offset: 0 });
  const RUN = (id, name, o = {}) => ({ id, name, wallW: null, gap: 0, mountY: 0, H: 720, D: 560, plinth: PL, worktop: true, corner: null, ...o });
  await page.evaluate((q) => { localStorage.clear(); localStorage.setItem('szafki:projekt', JSON.stringify(q)); }, { name: 'P2', active: 0, prices: {},
    runs: [RUN('c1', 'Ściana 1'), RUN('c2', 'Ściana 2', { corner: { of: 'c1', at: 'end', owner: 'of', clear: 0 } })],
    items: [cab('A1', 'c1'), cab('A2', 'c1'), cab('A3', 'c1'), cab('A4', 'c1'), cab('A5', 'c1'), cab('B1', 'c2')] });
  await page.reload({ waitUntil: 'networkidle' }); await page.waitForTimeout(1500);
  await page.evaluate(() => { window.__prod = null; window.print = () => {
    const sec = [...document.querySelectorAll('.print-only section.rp-page')].find((s) => /Produkty całego projektu/.test(s.innerText));
    const tabs = sec ? [...sec.querySelectorAll('table')] : [];
    window.__prod = tabs.length ? [...tabs[tabs.length - 1].querySelectorAll('tbody tr')].map((tr) => tr.innerText.replace(/\s+/g, ' ').trim()) : []; }; });
  await page.getByRole('button', { name: 'Zestawienie PDF', exact: true }).first().click(); await page.waitForTimeout(1200);
  const prod = (await page.evaluate(() => window.__prod)) || [];
  const zl = prod.filter((r) => /^Złącze do blatów śrubowe/.test(r));
  // rog: 2 szt.; Sciana 1 ma 4500 mm blatu — 2 kawalki, jedno laczenie: 2 szt.
  const suma = zl.reduce((a, r) => a + Number((/(\d+) szt\.$/.exec(r) || [])[1] || 0), 0);
  ok('PDF: złącza do blatów w „Produkty całego projektu” (róg 2 + łączenie w ciągu 2)', suma === 4, zl.join(' / ') || prod.slice(0, 4).join(' / '));
}

console.log('\nBLEDY:', errors.length ? errors.join('\n') : '(brak)');
await browser.close();
