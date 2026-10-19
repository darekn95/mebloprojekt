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
      bloki: [...root.querySelectorAll('[data-el="rozkroj-material"]')].map((b) => ({ tytul: b.firstElementChild.textContent, rysunki: b.querySelectorAll('svg').length,
        strona: b.matches('section.rp-page') })) }; }; });
  await page.getByRole('button', { name: 'Zestawienie PDF', exact: true }).first().click(); await page.waitForTimeout(1200);
  const pdf = (await page.evaluate(() => window.__pdf)) || { secs: [], roz: '', wiersze: [], bloki: [] };
  const naglowek = pdf.roz;
  ok('PDF: nagłówek rozkroju bez wspólnego „arkusz 2800 × 2100”', !!naglowek && !/2800 × 2100/.test(naglowek), naglowek);
  const wBlat = pdf.wiersze.find((r) => /^Blat roboczy/.test(r[0])) || [], wPlyta = pdf.wiersze.find((r) => !/^Blat roboczy|^HDF/.test(r[0])) || [];
  ok('PDF: w tabeli blat roboczy z arkuszem 4100 × 600 mm', wBlat[1] === '4100 × 600 mm', JSON.stringify(wBlat));
  ok('PDF: płyta z arkuszem 2800 × 2100 mm (po okrawaniu …)', /^2800 × 2100 mm \(po okrawaniu [\d.,]+ × [\d.,]+ mm\)$/.test(wPlyta[1] || ''), JSON.stringify(wPlyta));
  // kazdy arkusz na wlasnej stronie, z naglowkiem materialu (uzytkownik 2026-10-17: „Arkusz na całą stronę”)
  const arkuszy = pdf.wiersze.reduce((acc, r) => acc + Number(r[2] || 0), 0);
  ok('PDF: każdy arkusz rozkroju na swojej stronie, z nagłówkiem materiału i jednym rysunkiem', arkuszy > 0 && pdf.bloki.length === arkuszy
    && pdf.bloki.every((b) => b.rysunki === 1 && / — arkusz \d/.test(b.tytul) && b.strona), JSON.stringify(pdf.bloki).slice(0, 300));
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

/* Blat roboczy: format arkusza (600 / 1200) idzie z formatka, blatu nie
   obracamy (przod z profilem — uzytkownik 2026-10-17), format i cena nie
   zaleza od aktywnej szafki (audyt GPT N2–N4); wlasny dlugi blat szafki bez
   bledu arkusza plyty (N15). */
{
  const PL = { on: true, height: 100, mode: 'under', setback: 0 };
  const cabR = (n, runId, D, o = {}) => ({ cab: { name: n, W: 600, H: 720, D, plinth: PL, levels: [{ h: null, cols: [{ kind: 'doors', doors: 1, w: null }] }], ...o }, runId, offset: 0 });
  const RUN = (id, name, D) => ({ id, name, wallW: null, gap: 0, mountY: 0, H: 720, D, plinth: PL, worktop: true, corner: null });
  const grupyBlatu = () => page.evaluate(() => (window.__audytRozkroj?.groups || []).filter((g) => /Blat/.test(g.matLabel))
    .map((g) => ({ label: g.matLabel, ark: g.sheets.length, h: g.arkusz && g.arkusz.h, uloz: g.sheets.reduce((a, x) => a + x.parts.length, 0), odrz: (g.rejected || []).length })));
  const poRozkroju = async () => { await page.waitForFunction(() => window.__audytRozkroj && window.__audytRozkroj.aktualny, null, { timeout: 15000 }); await page.waitForTimeout(300); };
  // ciag D650 — blat 600 × 683 z arkusza 1200; ze slojami i bez nich (obracany trafial na arkusz 600)
  for (const grain of [true, false]) {
    await page.evaluate((q) => { localStorage.clear(); localStorage.setItem('szafki:projekt', JSON.stringify(q)); },
      { name: 'N2', active: 0, prices: {}, runs: [RUN('c1', 'Ściana', 650)], items: [cabR('A', 'c1', 650, { grainMatters: grain })] });
    await page.reload({ waitUntil: 'networkidle' }); await poRozkroju();
    const g = await grupyBlatu();
    ok(`blat 600 × 683 (ciąg D650, słoje ${grain ? 'tak' : 'nie'}): arkusz 4100 × 1200, ułożony, nic odrzuconego`,
      g.length === 1 && g[0].h === 1200 && g[0].ark === 1 && g[0].uloz === 1 && g[0].odrz === 0, JSON.stringify(g));
  }
  // dwa ciagi: D560 (arkusz 600) i D650 (arkusz 1200) — osobne grupy i ceny, niezaleznie od aktywnej szafki
  const ceny = async () => {
    const w = page.locator('section').filter({ has: page.locator('h2', { hasText: /^Wycena/ }) }).first();
    if ((await w.innerText()).split('\n').length < 4) { await w.locator('h2').first().click(); await page.waitForTimeout(400); }
    return page.evaluate(() => [...([...document.querySelectorAll('section')].find((s) => /^Wycena/.test(s.querySelector('h2')?.textContent || ''))?.querySelectorAll('tr') || [])]
      .filter((tr) => /Blat roboczy/.test(tr.textContent)).map((tr) => tr.innerText.replace(/\s+/g, ' ').trim()));
  };
  const wyniki = [];
  for (const act of [0, 1]) {
    await page.evaluate((q) => { localStorage.clear(); localStorage.setItem('szafki:projekt', JSON.stringify(q)); },
      { name: 'N3', active: act, prices: {}, runs: [RUN('c1', 'A', 560), RUN('c2', 'B', 650)], items: [cabR('płytka', 'c1', 560), cabR('głęboka', 'c2', 650)] });
    await page.reload({ waitUntil: 'networkidle' }); await poRozkroju();
    wyniki.push({ g: await grupyBlatu(), c: await ceny() });
  }
  const [w0, w1] = wyniki;
  ok('dwa formaty blatu: osobne grupy rozkroju 600 i 1200, po 1 arkuszu', w0.g.length === 2 && w0.g.some((g) => g.h === 600 && g.ark === 1) && w0.g.some((g) => g.h === 1200 && g.ark === 1 && /arkusz 1200/.test(g.label)), JSON.stringify(w0.g));
  ok('wycena: arkusz 600 — 563.99 zł, arkusz 1200 — 1128.22 zł', w0.c.some((r) => /^Blat roboczy 1 ark\. 563[.,]99/.test(r)) && w0.c.some((r) => /arkusz 1200 1 ark\. 1128[.,]22/.test(r)), w0.c.join(' / '));
  ok('format i cena blatu nie zależą od aktywnej szafki', JSON.stringify(w0) === JSON.stringify(w1), `${JSON.stringify(w0.c)} vs ${JSON.stringify(w1.c)}`);
  // wlasny blat roboczy szafki 3100 × 560 — miesci sie na 4100 × 600, bez bledu arkusza plyty
  await page.evaluate((q) => { localStorage.clear(); localStorage.setItem('szafki:projekt', JSON.stringify(q)); },
    { name: 'N15', active: 0, prices: {}, runs: [], items: [{ cab: { name: 'S', W: 600, H: 720, D: 560, plinth: PL,
      top: { mode: 'blat', material: 'worktop', widthMode: 'outside', overL: 0, overR: 2500, overFront: 0, overBack: 0 },
      levels: [{ h: null, cols: [{ kind: 'doors', doors: 1, w: null }] }] }, offset: 0 }] });
  await page.reload({ waitUntil: 'networkidle' }); await page.waitForTimeout(1000);
  const uw15 = await page.evaluate(() => [...document.querySelectorAll('section')].find((s) => /^Uwagi/.test(s.querySelector('h2')?.textContent || ''))?.innerText || '');
  ok('własny blat roboczy 3100 × 560: bez błędu „nie mieści się na arkuszu” płyty', !/Blat 3[\s ]?100 × 560 mm nie mieści się na arkuszu/.test(uw15), uw15.split('\n').filter((l) => /arkusz/.test(l)).join(' / '));
}

/* „N szafek” — odmiana przy 5+ (kontrola PDF: „6 szafki”); przy 2 stara i nowa
   wersja pisaly tak samo, wiec sprawdzamy na 6. Na koniec prawdziwy wydruk
   rozkroju do PDF: kazdy arkusz to dokladnie jedna strona (Chromium przy
   nazwanych stronach „A4 landscape” dzielil arkusz na dwie). */
{
  const PL = { on: true, height: 100, mode: 'under', setback: 0 };
  const cab = (n) => ({ cab: { name: n, W: 600, H: 720, D: 560, plinth: PL, levels: [{ h: null, cols: [{ kind: 'doors', doors: 2, w: null }] }] }, runId: 'c1', offset: 0 });
  await page.evaluate((q) => { localStorage.clear(); localStorage.setItem('szafki:projekt', JSON.stringify(q)); }, { name: 'Sześć', active: 0, prices: {},
    runs: [{ id: 'c1', name: 'Ściana 1', wallW: null, gap: 0, mountY: 0, H: 720, D: 560, plinth: PL, worktop: true, corner: null }],
    items: ['A', 'B', 'C', 'D', 'E', 'F'].map(cab) });
  await page.reload({ waitUntil: 'networkidle' }); await page.waitForTimeout(1500);
  await page.evaluate(() => { window.__html = null; window.print = () => { window.__html = document.querySelector('.print-only').outerHTML; }; });
  await page.getByRole('button', { name: 'Zestawienie PDF', exact: true }).first().click(); await page.waitForTimeout(1500);
  const html = await page.evaluate(() => window.__html) || '';
  const tyt = (/Formatki całego projektu — \d+ \S+/.exec(html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ')) || [''])[0];
  ok('PDF: „Formatki całego projektu — 6 szafek”', tyt === 'Formatki całego projektu — 6 szafek', tyt);
  // w dokumencie zostaje sam rozkroj: strona z tabela + strony arkuszy
  const ark = await page.evaluate(() => {
    document.body.innerHTML = window.__html;
    const root = document.querySelector('.print-only');
    [...root.querySelectorAll('section.rp-page')].forEach((s) => { if (!/Rozkrój na płycie/.test(s.textContent) && !s.matches('.rp-arkusz')) s.remove(); });
    return root.querySelectorAll('section.rp-arkusz').length;
  });
  await page.emulateMedia({ media: 'print' });
  const buf = await page.pdf({ format: 'A4', printBackground: true, preferCSSPageSize: true });
  await page.emulateMedia({ media: 'screen' });
  const stron = (buf.toString('latin1').match(/\/Type\s*\/Page[^s]/g) || []).length;
  ok('wydruk PDF: rozkrój = 1 strona tabeli + dokładnie 1 strona na arkusz', ark >= 3 && stron === 1 + ark, `${stron} stron, arkuszy ${ark}`);
  await page.reload({ waitUntil: 'networkidle' });
}

console.log('\nBLEDY:', errors.length ? errors.join('\n') : '(brak)');
await browser.close();
