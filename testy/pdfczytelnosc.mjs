/* Czytelnosc rysunkow szafki w PDF (audyt GPT PDF-1, decyzja uzytkownika
   2026-10-21: „opcja 3 ale tak żeby napisy nie nachodziły, wytestuj”):
   - 4 widoki na stronie zostaja (siatka 2 × 2 na A4),
   - napisy wymiarow w druku maja co najmniej ok. 2,3 mm wysokosci,
   - zaden napis nie wchodzi na inny i nie wychodzi poza pole widoku.
   Mierzymy w chwili druku: okno 190 mm (tresc A4), media „print”. Rozne typy
   szafek, bo kazdy ma inne kolumny wymiarow. PROJEKT=<plik> dokłada projekt
   uzytkownika ze scratchpadu. */
import fs from 'fs';
import pw from './pw.mjs';
const URL = process.env.STD ? 'http://127.0.0.1:5199/standalone-local.html'
  : 'http://127.0.0.1:5205/mebloprojekt-app.html';
const ok = (l, c, e = '') => console.log((c ? '  OK   ' : '  BLAD ') + l + (e ? ' — ' + e : ''));
const b = await pw.chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const page = await (await b.newContext({ viewport: { width: Math.round(190 / 25.4 * 96), height: 1100 } })).newPage();
const errors = []; page.on('pageerror', (e) => errors.push(e.message));
await page.goto(URL, { waitUntil: 'networkidle' });

const MIN_MM = 2.3;
const PL = { on: true, height: 100, mode: 'under', setback: 0 };
const kol = (o = {}) => ({ kind: 'doors', doors: 2, w: null, shelfTargets: [null, null], ...o });
const szafka = (name, o = {}) => ({ name, W: 600, H: 720, D: 560, plinth: PL, legs: { on: true, height: 100 },
  levels: [{ h: null, cols: [kol()] }], ...o });
const wisz = (name, o = {}) => szafka(name, { D: 300, plinth: { ...PL, on: false }, legs: { on: false }, hangerMode: 'listwa', ...o });
const SZUF = kol({ kind: 'drawers', drawers: [{ h: 'auto' }, { h: 'auto' }, { h: 'auto' }] });
const SZAFKI = [
  szafka('Drzwi 600'),
  szafka('Szuflady 600', { levels: [{ h: null, cols: [SZUF] }] }),
  wisz('Klapa 600', { H: 360, levels: [{ h: null, cols: [kol({ doors: 1, klapa: 'gora' })] }] }),
  szafka('Szeroka 1100 z fixem', { W: 1100, levels: [{ h: null, cols: [kol({ doors: 1, fix: { side: 'left', w: 100, mode: 'overlay', support: true, supportDepth: 100 } })] }] }),
  szafka('Wąska 300', { W: 300, levels: [{ h: null, cols: [kol({ doors: 1 })] }] }),
  szafka('Narożna L', { W: 900, corner: { on: true, arm: 640, doors: 'wsporniki' }, levels: [{ h: null, cols: [kol({ doors: 1 })] }] }),
  szafka('Słupek 2000', { H: 2000, levels: [{ h: 1300, cols: [kol()] }, { h: null, cols: [SZUF] }] }),
  szafka('Dwie kolumny', { W: 900, levels: [{ h: null, cols: [kol({ doors: 1, w: 450 }), SZUF] }] }),
  szafka('Wpuszczane, frez', { frontMode: 'inset', back: 'hdf', backGroove: { on: true }, levels: [{ h: 300, cols: [SZUF] }, { h: null, cols: [kol()] }] }),
  szafka('Blenda nad szafką', { plinth: { ...PL, on: false }, legs: { on: false }, topFiller: { on: true, height: 80 } }),
  szafka('Narożna L w lewo', { W: 1000, corner: { on: true, arm: 1200, doors: 'wsporniki', side: 'left' }, levels: [{ h: null, cols: [kol({ doors: 1 })] }] }),
  szafka('Trzy kolumny', { W: 1200, levels: [{ h: null, cols: [kol({ doors: 1, w: 300 }), SZUF, kol({ doors: 2 })] }] }),
];
// ciag z blatem: wymiar „z blatem”, dwie szafki w jednym projekcie
const RUN = { id: 'c1', name: 'A', wallW: null, gap: 0, mountY: 0, H: 720, D: 560, plinth: PL, worktop: true, corner: null };
const CIAG = { name: 'PDF', active: 0, prices: {}, runs: [RUN],
  items: [szafka('C1', { levels: [{ h: null, cols: [SZUF] }] }), szafka('C2', { W: 800 })].map((cab) => ({ cab, runId: 'c1', offset: 0 })) };

const pomiar = async (proj) => {
  await page.evaluate((q) => { localStorage.clear(); localStorage.setItem('szafki:projekt', JSON.stringify(q)); }, proj);
  await page.emulateMedia({ media: 'screen' });
  await page.reload({ waitUntil: 'networkidle' }); await page.waitForTimeout(2000);
  await page.evaluate(() => { window.__druk = null; window.print = () => {
    const mm = (px) => px * 25.4 / 96;
    const wyn = [];
    document.querySelectorAll('.print-only .rp-page:not(.rp-arkusz) .rp-widok').forEach((box) => {
      const svg = box.querySelector('svg'); if (!svg) return;
      const strona = box.closest('.rp-page');
      const szafka = ((strona.querySelector('strong') || {}).textContent || '').trim();
      const widok = ((box.firstElementChild || {}).textContent || '').trim().replace(/ —.*/, '');
      const pole = box.getBoundingClientRect();
      // getScreenCTM ma juz w sobie powiekszenie napisu z CSS (scale(var(--k)))
      const tx = [...svg.querySelectorAll('text')].map((t) => {
        const r = t.getBoundingClientRect(); const ctm = t.getScreenCTM();
        const fs = parseFloat(t.getAttribute('font-size') || getComputedStyle(t).fontSize) || 0;
        return { t: (t.textContent || '').trim(), x0: r.left, y0: r.top, x1: r.right, y1: r.bottom,
          h: ctm ? mm(fs * Math.hypot(ctm.a, ctm.b)) : 0, wym: /^\d+$/.test((t.textContent || '').trim()) };
      }).filter((q) => q.t && q.x1 > q.x0);
      const naklady = [];
      for (let i = 0; i < tx.length; i++) for (let j = i + 1; j < tx.length; j++) {
        const a = tx[i], c = tx[j];
        const w = Math.min(a.x1, c.x1) - Math.max(a.x0, c.x0), h = Math.min(a.y1, c.y1) - Math.max(a.y0, c.y0);
        if (w > 1 && h > 1) naklady.push(`„${a.t}” × „${c.t}”`);
      }
      const poza = tx.filter((q) => q.x0 < pole.left - 0.5 || q.x1 > pole.right + 0.5 || q.y0 < pole.top - 0.5 || q.y1 > pole.bottom + 0.5).map((q) => q.t);
      const wymiary = tx.filter((q) => q.wym).map((q) => q.h).sort((a, c) => a - c);
      const wszystkie = tx.map((q) => q.h).sort((a, c) => a - c);
      const najmniejsze = tx.filter((q) => q.wym).sort((a, c) => a.h - c.h).slice(0, 3).map((q) => `${q.t} ${q.h.toFixed(2)}`).join(', ');
      const drobne = tx.filter((q) => q.h < 1.8).map((q) => `„${q.t}” ${q.h.toFixed(2)}`);
      wyn.push({ szafka, widok, n: tx.length, najmniejsze, drobne, k: svg.style.getPropertyValue('--k'), minWym: wymiary[0] || 0, medWym: wymiary[Math.floor(wymiary.length / 2)] || 0,
        min: wszystkie[0] || 0, naklady, poza, mmSzer: Math.round(mm(svg.getBoundingClientRect().width)) });
    });
    window.__druk = wyn;
  }; });
  await page.emulateMedia({ media: 'print' });
  await page.getByRole('button', { name: 'Zestawienie PDF', exact: true }).first().click();
  await page.waitForFunction(() => window.__druk, null, { timeout: 15000 }).catch(() => {});
  return page.evaluate(() => window.__druk || []);
};

const sprawdz = (wyn, opis) => {
  ok(`${opis}: 4 widoki na każdą szafkę`, wyn.length > 0 && wyn.length % 4 === 0, String(wyn.length));
  // kazda szafka to 4 kolejne widoki; w projekcie z jedna szafka podpisujemy ja opisem
  const poSzafce = {};
  wyn.forEach((x, i) => { const sz = wyn.length === 4 ? opis : `${opis} ${Math.floor(i / 4) + 1}`; (poSzafce[sz] = poSzafce[sz] || []).push(x); });
  for (const [sz, widoki] of Object.entries(poSzafce)) {
    const male = widoki.filter((x) => x.minWym && x.minWym < MIN_MM);
    ok(`${sz}: wymiary co najmniej ${MIN_MM} mm`, !male.length,
      widoki.map((x) => `${x.widok} ${x.minWym.toFixed(2)}`).join(', '));
    const drob = widoki.filter((x) => x.drobne.length);
    ok(`${sz}: żaden napis poniżej 1,8 mm`, !drob.length, drob.map((x) => `${x.widok}: ${x.drobne.slice(0, 4).join(', ')}`).join(' // '));
    const nach = widoki.filter((x) => x.naklady.length);
    ok(`${sz}: napisy nie nachodzą na siebie`, !nach.length, nach.map((x) => `${x.widok}: ${x.naklady.slice(0, 4).join('; ')}`).join(' // '));
    const poza = widoki.filter((x) => x.poza.length);
    ok(`${sz}: napisy w polu widoku`, !poza.length, poza.map((x) => `${x.widok}: ${x.poza.slice(0, 4).join(', ')}`).join(' // '));
  }
  return poSzafce;
};

console.log('== szafki różnych typów, każda w swoim projekcie ==');
for (const cab of SZAFKI) {
  const wyn = await pomiar({ name: 'PDF', active: 0, prices: {}, runs: [], items: [{ cab, runId: null, offset: 0 }] });
  sprawdz(wyn, cab.name);
  if (process.env.SZCZEGOLY) wyn.forEach((x) => console.log(`     ${x.widok}: k ${x.k}, ${x.mmSzer} mm, ${x.n} napisów, wymiary min ${x.minWym.toFixed(2)} / med ${x.medWym.toFixed(2)} mm (${x.najmniejsze}), wszystkie min ${x.min.toFixed(2)}`));
}

console.log('\n== ciąg z blatem (dwie szafki) ==');
sprawdz(await pomiar(CIAG), 'Ciąg z blatem');

if (process.env.PROJEKT) {
  console.log('\n== projekt użytkownika ==');
  const wyn = await pomiar(JSON.parse(fs.readFileSync(process.env.PROJEKT, 'utf8')));
  sprawdz(wyn, 'projekt');
}

console.log('\nBLEDY STRONY:', errors.join(' | ') || '(brak)');
await b.close();
