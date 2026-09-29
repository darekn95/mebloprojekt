/* Audyt wyceny i rozkroju (uzytkownik 2026-09-28: „tak, zrob”). Dla kazdego
   projektu liczymy rozkroj z karty „Wycena” i sprawdzamy:
   1. rozkroj: kazda formatka jest na arkuszach dokladnie tyle razy, ile
      zamawiamy (wymiary, material), nic nie zostalo odrzucone, formatki nie
      nachodza na siebie, miedzy sasiednimi jest rzaz, wszystko w arkuszu;
      obrocone tylko te, ktorym slojow nie pilnujemy,
   2. wycena: arkusze = rozkroj (na material), formatowanie = suma arkuszy,
      obrzeze = suma oklejanych krawedzi z listy formatek, oklejanie = w gore
      do pelnego metra, okucia = lista okuc projektu, suma = suma pozycji.
   Rozkroj czyta hook `window.__audytRozkroj` (makeCutPlan). */
import pw from './pw.mjs';
const URL = process.env.STD ? 'http://127.0.0.1:5199/standalone-local.html'
  : 'http://127.0.0.1:5205/mebloprojekt-app.html';
const ok = (l, c, e = '') => console.log((c ? '  OK   ' : '  BLAD ') + l + (e ? ' — ' + e : ''));
const b = await pw.chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const page = await (await b.newContext({ viewport: { width: 1500, height: 1300 } })).newPage();
const errors = []; page.on('pageerror', (e) => errors.push(e.message));
await page.goto(URL, { waitUntil: 'networkidle' });

const KERF = 3;
const PL = { on: true, height: 100, mode: 'under', setback: 0 };
const kol = (o = {}) => ({ kind: 'doors', doors: 2, w: null, shelfTargets: [null, null], ...o });
const szafka = (name, o = {}) => ({ name, W: 600, H: 720, D: 560, plinth: PL, legs: { on: true, height: 100 },
  levels: [{ h: null, cols: [kol()] }], ...o });
const run = (id, name, o = {}) => ({ id, name, wallW: null, gap: 0, mountY: 0, H: 720, D: 560, plinth: PL, worktop: true, ...o });
const projekt = (items, runs = []) => ({ name: 'Wycena', active: 0, prices: {}, runs,
  items: items.map(([cab, runId]) => ({ cab, runId: runId || null, offset: 0 })) });
const num = (s) => Number(String(s).replace(/\s/g, '').replace(',', '.').replace(/[^\d.\-]/g, '')) || 0;

const tabela = (re) => page.evaluate((src) => {
  const re = new RegExp(src);
  const sec = [...document.querySelectorAll('section')].find((s) => re.test((s.querySelector('h2') || {}).textContent || ''));
  if (!sec) return null;
  const t = sec.querySelector('table'); if (!t) return [];
  const th = [...t.querySelectorAll('thead th')].map((x) => x.textContent.trim());
  return [...t.querySelectorAll('tbody tr')].map((tr) => {
    const td = [...tr.children];
    const o = { _: td.map((x) => x.textContent.trim()) };
    th.forEach((h, i) => { o[h] = td[i] ? td[i].textContent.trim() : ''; });
    const inp = tr.querySelector('input'); if (inp) o._cena = inp.value || inp.getAttribute('placeholder');
    // lista szafki pokazuje krawedzie jako przelaczniki — liczymy tylko oklejone
    const chips = [...tr.querySelectorAll('button[title]')].filter((x) => /^Oklejona/.test(x.getAttribute('title')));
    if (tr.querySelector('button[title]')) o._okl = chips.reduce((sum, x) => sum + (Number((x.textContent.match(/[\d.]+/) || [0])[0]) || 0), 0);
    o._pierwszy = td[0] ? (td[0].childNodes[0]?.textContent || '').trim() : '';
    return o;
  });
}, re.source);

const scenariusz = async (tytul, p, { grain = false } = {}) => {
  console.log(`\n== ${tytul} ==`);
  if (grain) p.items.forEach((it) => { it.cab.grainMatters = true; });
  await page.evaluate((q) => { localStorage.clear(); localStorage.setItem('szafki:projekt', JSON.stringify(q)); }, p);
  await page.reload({ waitUntil: 'networkidle' }); await page.waitForTimeout(900);
  // formatki: calego projektu, gdy sa, inaczej szafki
  let f = await tabela(/^Formatki całego projektu/);
  if (!f) f = await tabela(/^Formatki do zamówienia/);
  const formatki = (f || []).filter((r) => r['Długość']).map((r) => ({
    name: r._[0], mat: (r['Płyta'] || r['Materiał'] || '').trim(), a: num(r['Długość']), b: num(r['Szerokość']), qty: num(r['Szt.']),
    edge: r._okl != null ? r._okl : ((r['Oklejanie PCV 2 mm'] ?? '').match(/\d+(?:[.,]\d+)?/g) || []).map(num).reduce((s, x) => s + x, 0),
  }));
  let hw = await tabela(/^Produkty całego projektu/);
  if (!hw) hw = await tabela(/^Produkty do zamówienia/);
  // karta „Wycena” jest zwinieta — otwieramy i liczymy rozkroj
  await page.evaluate(() => { window.__audytRozkroj = null; });
  const wyc = page.locator('section').filter({ has: page.locator('h2', { hasText: /^Wycena/ }) }).first();
  await wyc.locator('h2').first().click(); await page.waitForTimeout(300);
  await page.getByRole('button', { name: 'Policz rozkrój', exact: true }).first().click();
  await page.waitForTimeout(1500);
  const rk = await page.evaluate(() => window.__audytRozkroj);
  ok('rozkrój policzony', !!rk && rk.groups.length > 0, JSON.stringify(rk).slice(0, 80));
  if (!rk) return;

  // 1a. nic odrzuconego
  const odrz = rk.groups.flatMap((g) => g.rejected.map((r) => `${g.matLabel}: ${r.name} ${r.w}×${r.h}`));
  ok('żadna formatka nie odpadła z rozkroju', !odrz.length, odrz.join('; '));
  // 1b. formatki = czesci na arkuszach (material + wymiary, bez kolejnosci bokow)
  const klucz = (m, a, b) => `${m}|${Math.min(a, b)}|${Math.max(a, b)}`;
  const zam = new Map(); formatki.forEach((x) => zam.set(klucz(x.mat, x.a, x.b), (zam.get(klucz(x.mat, x.a, x.b)) || 0) + x.qty));
  const ark = new Map(); rk.groups.forEach((g) => g.sheets.forEach((s) => s.parts.forEach((q) =>
    ark.set(klucz(g.matLabel, Math.round(q.w * 10) / 10, Math.round(q.h * 10) / 10), (ark.get(klucz(g.matLabel, Math.round(q.w * 10) / 10, Math.round(q.h * 10) / 10)) || 0) + 1))));
  const roz = [...new Set([...zam.keys(), ...ark.keys()])].filter((k) => (zam.get(k) || 0) !== (ark.get(k) || 0))
    .map((k) => `${k}: zamawiamy ${zam.get(k) || 0}, na arkuszach ${ark.get(k) || 0}`);
  ok('każda formatka na arkuszach tyle razy, ile zamawiamy', !roz.length, roz.slice(0, 6).join('; '));
  // 1c. geometria: w arkuszu, bez nachodzenia, z rzazem miedzy sasiadami
  const geo = [];
  rk.groups.forEach((g) => g.sheets.forEach((s, si) => {
    const P = s.parts;
    P.forEach((q) => { if (q.x < -0.01 || q.y < -0.01 || q.x + q.w > g.sheetW + 0.01 || q.y + q.h > g.sheetH + 0.01)
      geo.push(`${g.matLabel} ark.${si + 1}: ${q.name} poza arkuszem`); });
    for (let i = 0; i < P.length; i++) for (let j = i + 1; j < P.length; j++) {
      const A = P[i], B = P[j];
      const ox = Math.min(A.x + A.w, B.x + B.w) - Math.max(A.x, B.x);
      const oy = Math.min(A.y + A.h, B.y + B.h) - Math.max(A.y, B.y);
      if (ox > 0.01 && oy > 0.01) geo.push(`${g.matLabel} ark.${si + 1}: ${A.name} × ${B.name} nachodzą`);
      else if (ox > 0.01 && -oy < KERF - 0.01) geo.push(`${g.matLabel} ark.${si + 1}: ${A.name}/${B.name} bez rzazu (${Math.round(-oy * 10) / 10} mm)`);
      else if (oy > 0.01 && -ox < KERF - 0.01) geo.push(`${g.matLabel} ark.${si + 1}: ${A.name}/${B.name} bez rzazu (${Math.round(-ox * 10) / 10} mm)`);
    }
  }));
  ok('formatki w arkuszu, bez nachodzenia, z rzazem 3 mm', !geo.length, [...new Set(geo)].slice(0, 6).join('; '));
  // 1d. obrocone tylko tam, gdzie slojow nie pilnujemy (HDF zawsze wolno)
  if (grain) {
    const obr = rk.groups.filter((g) => !/HDF/i.test(g.matLabel)).flatMap((g) => g.sheets.flatMap((s) => s.parts.filter((q) => q.rot).map((q) => `${g.matLabel}: ${q.name}`)));
    ok('przy pilnowanych słojach nic nie jest obrócone', !obr.length, obr.slice(0, 5).join('; '));
  }
  // 1e. powierzchnia formatek zmiesci sie w arkuszach
  const pow = rk.groups.filter((g) => g.sheets.reduce((s, sh) => s + sh.parts.reduce((t, q) => t + q.w * q.h, 0), 0) > g.sheets.length * g.sheetW * g.sheetH + 1);
  ok('powierzchnia formatek ≤ arkusze', !pow.length, pow.map((g) => g.matLabel).join(', '));

  // 2. wycena
  const w = (await tabela(/^Wycena/)) || [];
  const wiersz = (re) => w.find((r) => re.test(r._pierwszy || r._[0]));
  const ilosc = (r) => (r ? num((r['Ilość'] || '').split(' ')[0]) : null);
  const arkRk = new Map(rk.groups.map((g) => [g.matLabel, 0])); rk.groups.forEach((g) => arkRk.set(g.matLabel, arkRk.get(g.matLabel) + g.sheets.length));
  const arkZle = [...arkRk.entries()].filter(([m, n]) => ilosc(w.find((r) => (r._pierwszy || r._[0]) === m)) !== n).map(([m, n]) => `${m}: rozkrój ${n}, wycena ${ilosc(w.find((r) => (r._pierwszy || r._[0]) === m))}`);
  ok('arkusze w wycenie = rozkrój (na materiał)', !arkZle.length, arkZle.join('; ') + ' // ' + w.map((r) => r._pierwszy).join(' | '));
  const suma = [...arkRk.values()].reduce((s, x) => s + x, 0);
  ok(`formatowanie = ${suma} ark.`, ilosc(wiersz(/^Formatowanie płyty/)) === suma, JSON.stringify(wiersz(/^Formatowanie/)?._));
  // blat roboczy ma wlasna pozycje „Obrzeze blatu roboczego” — nie obrzeze 22 mm
  const blatowy = (x) => /^Blat/.test(x.name) && /blat/i.test(x.mat);
  const mb = formatki.filter((x) => !blatowy(x)).reduce((s, x) => s + x.qty * x.edge, 0) / 1000;
  const mbBlat = formatki.filter(blatowy).reduce((s, x) => s + x.qty * x.edge, 0) / 1000;
  if (mbBlat > 0) ok(`krawędzie blatu osobno (${Math.round(mbBlat * 100) / 100} mb)`, Math.abs(ilosc(wiersz(/^Obrzeże ABS .* — blat/)) - Math.round(mbBlat * 100) / 100) < 0.006, JSON.stringify(wiersz(/^Obrzeże ABS/)?._));
  if (mbBlat > 0) ok(`oklejanie PCV > 23 mm w górę do pełnego metra (${Math.ceil(mbBlat)})`, ilosc(wiersz(/^Oklejanie prostoliniowe PCV > 23/)) === Math.ceil(mbBlat), JSON.stringify(wiersz(/PCV > 23/)?._));
  ok(`obrzeże 22 mm = suma oklejanych krawędzi płyty (${Math.round(mb * 10) / 10} mb)`, Math.abs(ilosc(wiersz(/^Obrzeże 22/)) - Math.round(mb * 10) / 10) < 0.051, JSON.stringify(wiersz(/^Obrzeże/)?._));
  if (mb > 0) ok(`oklejanie w górę do pełnego metra (${Math.ceil(mb)})`, ilosc(wiersz(/^Oklejanie prostoliniowe$/)) === Math.ceil(mb), JSON.stringify(wiersz(/^Oklejanie prostoliniowe$/)?._));
  // okucia: kazda pozycja listy okuc jest w wycenie z ta sama iloscia
  // po nazwie, z suma ilosci — wycena scala opisy zastosowan w jeden wiersz
  const sumy = (rows, nazwa, il) => { const m = new Map(); rows.forEach((r) => m.set(nazwa(r), (m.get(nazwa(r)) || 0) + il(r))); return m; };
  const zListy = sumy((hw || []).filter((r) => r._.length >= 2), (r) => r._[0], (r) => num((r['Ilość'] || r._[r._.length - 1]).split(' ')[0]));
  const zWyc = sumy(w.filter((r) => zListy.has(r._pierwszy)), (r) => r._pierwszy, (r) => ilosc(r));
  const okZle = [...zListy.entries()].filter(([n, q]) => zWyc.get(n) !== q).map(([n, q]) => `${n}: lista ${q}, wycena ${zWyc.get(n)}`);
  ok('okucia w wycenie = lista okuć (nazwa i ilość)', !okZle.length, okZle.slice(0, 6).join('; '));
  // suma = suma wartosci pozycji
  const sumaPoz = w.reduce((s, r) => s + (/—/.test(r['Wartość'] || '') ? 0 : num(r['Wartość'])), 0);
  const razem = await page.evaluate(() => { const sec = [...document.querySelectorAll('section')].find((s) => /^Wycena/.test((s.querySelector('h2') || {}).textContent || ''));
    const m = /razem\s*([\d\s,.]+)\s*zł/i.exec(sec ? sec.innerText : ''); return m ? m[1] : null; });
  ok(`suma „Razem” = suma pozycji (${Math.round(sumaPoz * 100) / 100})`, razem != null && Math.abs(num(razem) - sumaPoz) < 0.02, `Razem ${razem}`);
  // kazda pozycja: wartosc = ilosc × cena
  const zleW = w.filter((r) => !/—/.test(r['Wartość'] || '') && Math.abs(num(r['Wartość']) - ilosc(r) * Number(r._cena)) > 0.02).map((r) => `${r._pierwszy}: ${r['Ilość']} × ${r._cena} ≠ ${r['Wartość']}`);
  ok('wartość = ilość × cena w każdej pozycji', !zleW.length, zleW.slice(0, 5).join('; '));
};

const rog = (o = {}) => ({ of: 'c1', at: 'end', owner: 'self', clear: 0, ...o });
await scenariusz('jedna szafka', projekt([[szafka('A')]]));
await scenariusz('jedna szafka, pilnowane słoje', projekt([[szafka('A')]]), { grain: true });
await scenariusz('szuflady', projekt([[szafka('S', { levels: [{ h: null, cols: [{ ...kol(), kind: 'drawers', drawers: [{ h: 'auto' }, { h: 'auto' }, { h: 'auto' }] }] }] })]]));
await scenariusz('ciąg z blatem i cokołem', projekt([[szafka('C1'), 'c1'], [szafka('C2'), 'c1'], [szafka('C3', { W: 400 }), 'c1']], [run('c1', 'Ściana 1')]));
await scenariusz('ślepy róg z wstawką', projekt([[szafka('A1'), 'c1'], [szafka('A2'), 'c1'],
  [szafka('R', { W: 1000, levels: [{ h: null, cols: [kol({ doors: 1, fix: { side: 'left', w: 621, mode: 'overlay', support: false }, hinge: 'right' })] }] }), 'c2'],
  [szafka('B2'), 'c2']], [run('c1', 'Ściana 1'), run('c2', 'Ściana 2', { corner: rog({ wstawka: { typ: 'szeroka', w: 60 } }) })]));
await scenariusz('dużo szafek (kilka arkuszy)', projekt([...Array(8)].map((_, i) => [szafka('K' + i, { W: 800, H: 2000, levels: [{ h: null, cols: [kol({ doors: 2 })] }] }), 'c1']), [run('c1', 'Ściana 1', { H: 2000, worktop: false })]));
await scenariusz('dużo szafek, pilnowane słoje', projekt([...Array(6)].map((_, i) => [szafka('G' + i, { W: 800, H: 2000, levels: [{ h: null, cols: [kol({ doors: 2 })] }] }), 'c1']), [run('c1', 'Ściana 1', { H: 2000, worktop: false })]), { grain: true });

console.log('\nBLEDY:', errors.length ? errors.join('; ') : '(brak)');
await b.close();
