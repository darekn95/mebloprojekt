/* Audyt szuflad przez interfejs (zgloszenie uzytkownika 2026-10-21: „sporo bledow
   do analizy calkowitej z roznymi przypadkami — od dodawania nowej szafki, przez
   zmiane z szafki z klapami na szuflady oraz z drzwiami i polkami na szuflady,
   nowe DXS i stare V-BOX, pelne zlozone przypadki”).
   Kazdy scenariusz klika jak uzytkownik (nowy ciag, „+ szafka”, szablon, „Szuflady”,
   „klapy zamiast drzwi”, „+ poziom”, „Usuń poziom”, „+ przegroda i kolumna”,
   „Usuń kolumnę”, system szuflady), a po kazdym kroku sprawdza:
   - w Uwagach szafki nie ma bledow (×),
   - kazda plyta z bryly 3D jest w formatkach (jak `formatki`),
   - skrzynki i fronty szuflad nie wchodza w korpus ani wzmocnienia,
   - wlasna symulacja wysuwu (`symwysuw`) bez kolizji,
   - pod blatem para wzmocnien stoi na gorze korpusu (nie w srodku szafki). */
import pw from './pw.mjs';
import { symuluj, K, F, P } from './symwysuw.mjs';
const URL = process.env.STD ? 'http://127.0.0.1:5199/standalone-local.html'
  : 'http://127.0.0.1:5205/mebloprojekt-app.html';
const ok = (l, c, e = '') => console.log((c ? '  OK   ' : '  BLAD ') + l + (e ? ' — ' + e : ''));
const b = await pw.chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const page = await (await b.newContext({ viewport: { width: 1500, height: 1300 } })).newPage();
const errors = []; page.on('pageerror', (e) => errors.push(e.message));
await page.goto(URL, { waitUntil: 'networkidle' });

const MAT = {
  board: { name: 'Płyta', thickness: 18, color: K, decor: 'KORPUS' },
  front: { name: 'Płyta', thickness: 18, color: F, decor: 'FRONT' },
  shelf: { name: 'Płyta', thickness: 18, color: P, decor: 'POLKA' },
  back: { name: 'HDF', thickness: 3, color: '#e7e5e4' },
  worktop: { name: 'Blat roboczy', thickness: 38, color: '#8d7b68', depth: 600 },
};
const poczekaj = (ms = 500) => page.waitForTimeout(ms);
const zapis = () => page.evaluate(() => JSON.parse(localStorage.getItem('szafki:projekt')));
// autozapis idzie z opoznieniem — czekamy, az zapis sie zmieni
const poKliku = async (fn) => {
  const przed = await page.evaluate(() => localStorage.getItem('szafki:projekt'));
  await fn();
  await page.waitForFunction((p) => localStorage.getItem('szafki:projekt') !== p, przed, { timeout: 6000 }).catch(() => {});
  await poczekaj(400);
};
const przycisk = (nazwa) => page.getByRole('button', { name: nazwa, exact: true });
const nowyProjekt = async () => {
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: 'networkidle' }); await poczekaj(1200);
};
const nowaSzafkaWCiagu = async () => {
  await poKliku(() => przycisk('+ nowy ciąg').first().click());
  const wiersz = page.locator('header .space-y-1 > div').filter({ hasText: /^Ściana 1/ }).first();
  await poKliku(() => wiersz.getByRole('button', { name: '+ szafka', exact: true }).click());
  await poczekaj(800);
};
const zSzablonu = async (id) => {
  const s = page.locator('[data-el="z-szablonu"]').first();
  await poKliku(() => s.selectOption(id)); await poczekaj(800);
};
// przycisk w Strukturze wnetrza; poziomy sa w kolejnosci od gory (w poziomie kolumny od lewej),
// wiec odDolu = 0 to ostatni na liscie (dolny poziom, prawa kolumna), odGory = 0 — pierwszy
const wStrukturze = (nazwa, odDolu = 0, title = false, odGory = null) => {
  const l = title ? page.getByTitle(nazwa, { exact: true }) : przycisk(nazwa);
  return { kliknij: async () => { const n = await l.count(); if (!n) throw new Error(`brak „${nazwa}”`);
    await poKliku(() => l.nth(odGory != null ? odGory : n - 1 - odDolu).click()); } };
};
const doZapisu = async (fn) => {
  await page.evaluate((src) => { const q = JSON.parse(localStorage.getItem('szafki:projekt'));
    new Function('c', src)(q.items[q.active].cab); localStorage.setItem('szafki:projekt', JSON.stringify(q)); }, fn);
  await page.reload({ waitUntil: 'networkidle' }); await poczekaj(900);
};
const wpisz = async (loc, v) => { await poKliku(async () => { await loc.fill(String(v)); await loc.press('Tab'); }); };
const naDxs = async () => {
  for (let k = 0; k < 20; k++) {
    const s = page.locator('[data-el="szuflada-system"]');
    const n = await s.count();
    let zmieniono = false;
    for (let i = 0; i < n; i++) {
      if ((await s.nth(i).inputValue()) !== 'dxs') { await poKliku(() => s.nth(i).selectOption('dxs')); zmieniono = true; break; }
    }
    if (!zmieniono) return;
  }
};
const ustawDrzwi = async (n) => {
  await page.evaluate((n) => {
    const q = JSON.parse(localStorage.getItem('szafki:projekt'));
    const c = q.items[q.active].cab; c.levels.forEach((lv) => lv.cols.forEach((k) => { if (k.kind === 'doors') k.doors = n; }));
    localStorage.setItem('szafki:projekt', JSON.stringify(q));
  }, n);
  await page.reload({ waitUntil: 'networkidle' }); await poczekaj(900);
};

const uwagiBledy = async () => {
  const sec = page.locator('section').filter({ has: page.locator('h2', { hasText: /^Uwagi/ }) }).first();
  if (!(await sec.count())) return [];
  const l = (await sec.innerText()).split('\n').map((x) => x.trim());
  return l.flatMap((x, i) => (x === '×' && l[i + 1] ? [l[i + 1]] : []));
};
const tabela = (re) => page.evaluate((src) => {
  const re = new RegExp(src);
  const sec = [...document.querySelectorAll('section')].find((s) => re.test((s.querySelector('h2') || {}).textContent || ''));
  if (!sec) return [];
  const th = [...sec.querySelectorAll('thead th')].map((x) => x.textContent.trim());
  const iA = th.indexOf('Długość'), iB = th.indexOf('Szerokość');
  const num = (s) => Number(String(s).replace(/\s/g, '').replace(',', '.'));
  return [...sec.querySelectorAll('tbody tr')].map((tr) => { const td = [...tr.children].map((x) => x.textContent.trim()); return { name: td[0], a: num(td[iA]), b: num(td[iB]) }; });
}, re.source);
const klik = async (l) => { const x = przycisk(l); if (await x.count()) { await x.first().click(); await poczekaj(300); return true; } return false; };
let zamkniete = [];
const bryly = async () => {
  await klik('Szafka'); await klik('Zamk.');
  await page.evaluate(() => { window.__audytBryl = []; });
  await klik('3D'); await poczekaj(300);
  zamkniete = await page.evaluate(() => (window.__audytBryl || []).filter((s) => s.p));
  await page.evaluate(() => { window.__audytBryl = []; });
  await klik('zamknięte'); await poczekaj(400);
  const otw = await page.evaluate(() => { const x = window.__audytBryl || []; window.__audytBryl = null; return x.filter((s) => s.p); });
  await klik('otwarte'); await klik('Zamk.');
  return otw;
};
const nachodzi = (a, c) => [0, 1, 2].every((k) => Math.min(a.p[k + 3], c.p[k + 3]) - Math.max(a.p[k], c.p[k]) > 0.5);
const porownaj = (sol, parts) => {
  const plyty = sol.filter((s) => { const d = [...s.d].sort((x, y) => x - y);
    return d[0] > 0.5 && d[0] <= 40 && d[1] >= 20 && s.color !== '#3f3f46' && s.color !== '#8b8b93' && !/^(uchwyt|noga)/.test(s.tag || ''); });
  const brak = [];
  plyty.forEach((s) => {
    const [, q, r] = [...s.d].sort((x, y) => x - y).map(Math.round);
    const para = parts.find((p) => (Math.abs(p.a - q) <= 3 && Math.abs(p.b - r) <= 3) || (Math.abs(p.a - r) <= 3 && Math.abs(p.b - q) <= 3)
      || (Math.min(p.a, p.b) === 60 && Math.min(q, r) < 60 && Math.abs(Math.max(p.a, p.b) - Math.max(q, r)) <= 3))
      || (s.tag === 'blat' && parts.find((p) => /^Blat/.test(p.name)))
      || parts.find((p) => /^Cokół/.test(p.name) && (Math.abs(p.b - q) <= 3 || Math.abs(p.b - r) <= 3 || Math.abs(p.a - q) <= 3));
    if (!para) brak.push(`${[q, r].join('×')}${s.tag ? ' [' + s.tag + ']' : ''} ${s.color || ''}`);
  });
  return [...new Set(brak)];
};

/* Kontrola stanu: przemalowuje szafke na kolory rol (material nie zmienia geometrii),
   czyta uwagi, formatki i bryle. */
const wyniki = [];
// TYLKO=D,O — tylko wybrane scenariusze; PELNE=1 — pelne tresci bledow z Uwag
const TYLKO = (process.env.TYLKO || '').split(',').map((x) => x.trim()).filter(Boolean);
const wybrany = (k) => !TYLKO.length || TYLKO.includes(k);
let q;
const sprawdz = async (opis, { pomin = [] } = {}) => {
  const q = await zapis();
  const it = q.items[q.active];
  it.mat = MAT; it.cab = { ...it.cab, shelfSameAsBoard: false, frontSameAsBoard: false };
  await page.evaluate((p) => localStorage.setItem('szafki:projekt', JSON.stringify(p)), q);
  await page.reload({ waitUntil: 'networkidle' }); await poczekaj(900);
  const cab = it.cab;
  const bl = [];
  const bledy = (await uwagiBledy()).filter((t) => !pomin.some((re) => re.test(t)));
  if (bledy.length) bl.push(`błędy w uwagach: ${bledy.map((t) => (process.env.PELNE ? t : t.slice(0, 130))).join(' // ')}`);
  const formatki = [...(await tabela(/^Formatki do zamówienia/)), ...(await tabela(/^Formatki całego projektu/))];
  const otw = await bryly();
  const brak = porownaj(zamkniete, formatki);
  if (brak.length) bl.push(`płyty z 3D bez formatki: ${brak.slice(0, 4).join('; ')}`);
  const korpus = zamkniete.filter((s) => (s.color || '').toLowerCase() === K);
  const korpusO = otw.filter((s) => (s.color || '').toLowerCase() === K);
  const skrz = otw.filter((s) => s.tag === 'skrzynka-bok' || ['#8b8b93', P].includes((s.color || '').toLowerCase()));
  const kol = [];
  skrz.forEach((s) => korpusO.forEach((k) => { if (nachodzi(s, k)) kol.push(`${JSON.stringify(s.p)} × ${JSON.stringify(k.p)}`); }));
  if (kol.length) bl.push(`skrzynka w korpusie/wzmocnieniu (${kol.length}): ${kol[0]}`);
  const fr = zamkniete.filter((s) => (s.color || '').toLowerCase() === F);
  const kolF = [];
  fr.forEach((s) => korpus.forEach((k) => { if (nachodzi(s, k)) kolF.push(`front ${JSON.stringify(s.p)} × ${JSON.stringify(k.p)}`); }));
  if (kolF.length) bl.push(`front w korpusie (${kolF.length}): ${kolF[0]}`);
  const podBlatem = (cab.joints || {}).topL === 'none' && (cab.joints || {}).topR === 'none';
  const sym = symuluj(zamkniete, { H: cab.H, blat: podBlatem });
  sym.forEach((x) => { if (x.kolizje.length) bl.push(`wysuw szuflady ${x.szuflada}: ${x.kolizje[0]}`); });
  if (podBlatem) {
    // wzmocnienia spod blatu: plyty korpusu 18 × 100 na szerokosc wnetrza — gora rowno z gora korpusu
    const wz = korpus.filter((s) => { const d = [...s.d].map(Math.round).sort((x, y) => x - y); return d[0] === 18 && d[1] === 100 && d[2] > 200; });
    const nizej = wz.filter((s) => s.p[4] < cab.H - 1);
    if (!wz.length) bl.push('pod blatem bez wzmocnień w 3D');
    if (nizej.length) bl.push(`wzmocnienie pod blatem nie na górze korpusu: góra ${nizej.map((s) => s.p[4]).join(', ')} (H ${cab.H})`);
  }
  // kolumna bez drzwi nie trzyma ustawien klapy (zostawaly po „klapy zamiast drzwi” → Szuflady)
  const klapaBezDrzwi = cab.levels.flatMap((lv, i) => lv.cols.flatMap((c, j) => (c.kind !== 'doors' && (c.klapa || c.silowniki || c.klapaUchwyt) ? [`p${i + 1}k${j + 1} ${c.kind}: klapa ${c.klapa || ''}`] : [])));
  if (klapaBezDrzwi.length) bl.push(`ustawienia klapy w kolumnie bez drzwi: ${klapaBezDrzwi.join(', ')}`);
  const szuf = cab.levels.flatMap((lv) => lv.cols.flatMap((c) => (c.kind === 'drawers' ? c.drawers || [] : [])));
  const sys = [...new Set(szuf.map((d) => d.system || 'vbox'))].join('+') || '—';
  ok(`${opis} [${szuf.length} szuf., ${sys}]`, bl.length === 0, bl.join(' | '));
  wyniki.push({ opis, bl });
};

/* ===== A. ciag pod blatem: „+ szafka” → szuflady → DXS ===== */
if (wybrany('A')) {
console.log('== A. szafka w ciągu pod blatem ==');
await nowyProjekt(); await nowaSzafkaWCiagu();
await sprawdz('A1 nowa szafka w ciągu (drzwi i półki)');
await wStrukturze('Szuflady').kliknij();
await sprawdz('A2 drzwi i półki → Szuflady (V-BOX)');
await naDxs();
await sprawdz('A3 → DXS-3D');

}

/* ===== B. szafka stojaca (projekt startowy) ===== */
if (wybrany('B')) {
console.log('\n== B. szafka stojąca (start) ==');
await nowyProjekt();
await sprawdz('B1 szafka startowa');
await wStrukturze('Szuflady').kliknij();
await sprawdz('B2 → Szuflady (V-BOX)');
await naDxs();
await sprawdz('B3 → DXS-3D');

}

/* ===== C. szafka wiszaca z klapa → szuflady ===== */
if (wybrany('C')) {
console.log('\n== C. wisząca z klapą → szuflady ==');
await nowyProjekt(); await zSzablonu('wiszaca');
await ustawDrzwi(1);
await wStrukturze('klapa').kliknij();
await sprawdz('C1 wisząca, klapa do góry');
await wStrukturze('Szuflady').kliknij();
await sprawdz('C2 klapa → Szuflady (V-BOX)');
await naDxs();
await sprawdz('C3 → DXS-3D');

}

/* ===== D. pod blatem: klapy zamiast drzwi (poziomy) → szuflady, usuniecie poziomu (zgloszenie) ===== */
if (wybrany('D')) {
console.log('\n== D. pod blatem: klapy zamiast drzwi → szuflady, usunięcie poziomu ==');
await nowyProjekt(); await nowaSzafkaWCiagu();
await wStrukturze('klapy zamiast drzwi').kliknij();
await sprawdz('D1 klapy zamiast drzwi');
await wStrukturze('Szuflady', 0).kliknij();
await sprawdz('D2 dolny poziom → Szuflady');
// jak uzytkownik: zostaja szuflady, usuwa poziom z klapa (gorny)
await wStrukturze('Usuń poziom', 0, true, 0).kliknij();
await sprawdz('D3 usunięty górny poziom (z klapą)');
q = await zapis();
ok('D3: kolumna szuflad bez ustawień klapy', q.items[q.active].cab.levels.every((lv) => lv.cols.every((c) => c.kind !== 'drawers' || !c.klapa)),
  JSON.stringify(q.items[q.active].cab.levels.map((lv) => lv.cols.map((c) => [c.kind, c.klapa || '']))));
await naDxs();
await sprawdz('D4 → DXS-3D');

}

/* ===== D'. wariant: szuflady w gornym poziomie ===== */
if (wybrany("D'")) {
console.log('\n== D\'. pod blatem: klapy zamiast drzwi → górny poziom szuflady, usunięcie dolnego ==');
await nowyProjekt(); await nowaSzafkaWCiagu();
await wStrukturze('klapy zamiast drzwi').kliknij();
await wStrukturze('Szuflady', 0, false, 0).kliknij();
await sprawdz('D\'1 górny poziom → Szuflady (pod blatem)');
await naDxs();
await sprawdz('D\'2 → DXS-3D');
await wStrukturze('Usuń poziom', 0, true).kliknij();
await sprawdz('D\'3 usunięty dolny poziom');

}

/* ===== E. dwa poziomy: szuflady pod drzwiami, potem usuniecie poziomu ===== */
if (wybrany('E')) {
console.log('\n== E. dwa poziomy ==');
await nowyProjekt();
await poKliku(() => przycisk('+ poziom').first().click());
await wStrukturze('Szuflady', 0).kliknij();
await sprawdz('E1 szuflady pod drzwiami');
await naDxs();
await sprawdz('E2 → DXS-3D');
await wStrukturze('Usuń poziom', 1, true).kliknij();
await sprawdz('E3 usunięty górny poziom (z drzwiami)');

}

/* ===== F. dwie kolumny: szuflady obok drzwi, usuniecie przegrody ===== */
if (wybrany('F')) {
console.log('\n== F. dwie kolumny ==');
await nowyProjekt();
await page.evaluate(() => { const q = JSON.parse(localStorage.getItem('szafki:projekt')); q.items[q.active].cab.W = 900; localStorage.setItem('szafki:projekt', JSON.stringify(q)); });
await page.reload({ waitUntil: 'networkidle' }); await poczekaj(900);
await poKliku(() => przycisk('+ przegroda i kolumna').first().click());
await wStrukturze('Szuflady', 0).kliknij();
await sprawdz('F1 kolumna szuflad obok drzwi (V-BOX)');
await naDxs();
await sprawdz('F2 → DXS-3D');
await wStrukturze('Usuń kolumnę', 1, true).kliknij();
await sprawdz('F3 usunięta kolumna z drzwiami (przegroda)');

}

/* ===== G. ciag pod blatem z dwiema kolumnami szuflad ===== */
if (wybrany('G')) {
console.log('\n== G. ciąg pod blatem, dwie kolumny szuflad ==');
await nowyProjekt(); await nowaSzafkaWCiagu();
await page.evaluate(() => { const q = JSON.parse(localStorage.getItem('szafki:projekt')); q.items[q.active].cab.W = 900; localStorage.setItem('szafki:projekt', JSON.stringify(q)); });
await page.reload({ waitUntil: 'networkidle' }); await poczekaj(900);
await poKliku(() => przycisk('+ przegroda i kolumna').first().click());
await wStrukturze('Szuflady', 0).kliknij();
await wStrukturze('Szuflady', 1).kliknij();
await sprawdz('G1 dwie kolumny szuflad (V-BOX)');
await naDxs();
await sprawdz('G2 → DXS-3D');
await wStrukturze('Usuń kolumnę', 0, true).kliknij();
await sprawdz('G3 usunięta przegroda');

}

/* ===== H. slupek: szuflady w dolnym poziomie ===== */
if (wybrany('H')) {
console.log('\n== H. słupek ==');
await nowyProjekt(); await zSzablonu('slupek');
await wStrukturze('Szuflady', 0).kliknij();
await sprawdz('H1 słupek, dolny poziom → Szuflady');
await naDxs();
await sprawdz('H2 → DXS-3D');

}

/* ===== I. nowa szafka w ciagu z szafka DXS: domyslnie DXS ===== */
if (wybrany('I')) {
console.log('\n== I. druga szafka w ciągu DXS ==');
await nowyProjekt(); await nowaSzafkaWCiagu();
await wStrukturze('Szuflady').kliknij(); await naDxs();
const wiersz = page.locator('header .space-y-1 > div').filter({ hasText: /^Ściana 1/ }).first();
await poKliku(() => wiersz.getByRole('button', { name: '+ szafka', exact: true }).click()); await poczekaj(800);
await wStrukturze('Szuflady').kliknij();
q = await zapis();
const noweSzuf = q.items[q.active].cab.levels[0].cols[0].drawers || [];
ok('I1 szuflady nowej szafki w ciągu DXS — od razu DXS-3D', noweSzuf.length > 0 && noweSzuf.every((d) => d.system === 'dxs'), JSON.stringify(noweSzuf.map((d) => d.system || 'vbox')));
await sprawdz('I2 druga szafka w ciągu');

}

/* ===== J. szuflady → z powrotem drzwi i polki → znow szuflady ===== */
if (wybrany('J')) {
console.log('\n== J. szuflady → drzwi → szuflady ==');
await nowyProjekt(); await nowaSzafkaWCiagu();
await wStrukturze('Szuflady').kliknij(); await naDxs();
await wStrukturze('Półki i drzwi').kliknij();
await sprawdz('J1 DXS → Półki i drzwi');
await wStrukturze('Szuflady').kliknij();
await sprawdz('J2 → znów Szuflady');

}

/* ===== K. DXS: + szuflada, reczny front, usuniecie szuflady, reczny bok i tyl ===== */
if (wybrany('K')) {
console.log('\n== K. DXS — edycje szuflad ==');
await nowyProjekt(); await nowaSzafkaWCiagu();
await wStrukturze('Szuflady').kliknij(); await naDxs();
await poKliku(() => przycisk('+ szuflada').first().click()); await naDxs();
await sprawdz('K1 cztery szuflady DXS');
await wpisz(page.locator('[data-el="szuflada-wiersz"]').last().locator('div.w-20 input'), 250);
await sprawdz('K2 dolny front 250 mm');
await poKliku(() => page.getByTitle('Usuń szufladę', { exact: true }).first().click());
await sprawdz('K3 usunięta górna szuflada');
await wpisz(page.locator('[data-el="dxs-bok"] input').last(), 150);
await wpisz(page.locator('[data-el="dxs-tyl"] input').last(), 120);
await sprawdz('K4 ręczny bok 150 i tył 120 dolnej');
await wpisz(page.locator('[data-el="dxs-bok"] input').last(), '');
await wpisz(page.locator('[data-el="dxs-tyl"] input').last(), '');
await sprawdz('K5 bok i tył z powrotem auto');

}

/* ===== L. fronty wpuszczane ===== */
if (wybrany('L')) {
console.log('\n== L. fronty wpuszczane ==');
await nowyProjekt(); await nowaSzafkaWCiagu();
await doZapisu('c.frontMode = "inset"');
await wStrukturze('Szuflady').kliknij();
await sprawdz('L1 wpuszczane, Szuflady V-BOX');
await naDxs();
await sprawdz('L2 → DXS-3D');

}

/* ===== M. szeroka 1000 pod blatem ===== */
if (wybrany('M')) {
console.log('\n== M. szeroka 1000 ==');
await nowyProjekt(); await nowaSzafkaWCiagu();
await doZapisu('c.W = 1000');
await wStrukturze('Szuflady').kliknij();
await sprawdz('M1 1000, Szuflady V-BOX');
await naDxs();
await sprawdz('M2 → DXS-3D');

}

/* ===== N. trzy poziomy, szuflady w srodku ===== */
if (wybrany('N')) {
console.log('\n== N. trzy poziomy ==');
await nowyProjekt();
await doZapisu('c.H = 1400');
await poKliku(() => przycisk('+ poziom').first().click());
await poKliku(() => przycisk('+ poziom').first().click());
await wStrukturze('Szuflady', 1).kliknij();
await sprawdz('N1 szuflady w środkowym poziomie');
await naDxs();
await sprawdz('N2 → DXS-3D');
await wStrukturze('Usuń poziom', 0, true).kliknij();
await sprawdz('N3 usunięty dolny poziom');
await wStrukturze('Usuń poziom', 0, true, 0).kliknij();
await sprawdz('N4 usunięty górny poziom (zostały szuflady)');

}

/* ===== O. szafka stojaca: klapy zamiast drzwi → szuflady na gorze ===== */
if (wybrany('O')) {
console.log('\n== O. stojąca: klapy zamiast drzwi → szuflady ==');
await nowyProjekt();
await wStrukturze('klapy zamiast drzwi').kliknij();
await wStrukturze('Szuflady', 0, false, 0).kliknij();
await sprawdz('O1 górny poziom → Szuflady');
await naDxs();
await sprawdz('O2 → DXS-3D');
await wStrukturze('Usuń poziom', 0, true).kliknij();
await sprawdz('O3 usunięty dolny poziom');

}

/* ===== P. kolumny z wpisana szerokoscia, usuniecie przegrody — kolumna szuflad musi siegac boku ===== */
if (wybrany('P')) {
console.log('\n== P. wpisane szerokości kolumn, usunięcie przegrody ==');
await nowyProjekt(); await nowaSzafkaWCiagu();
await doZapisu('c.W = 900');
await poKliku(() => przycisk('+ przegroda i kolumna').first().click());
await wStrukturze('Szuflady', 0).kliknij(); await naDxs();
await doZapisu('c.levels[0].cols[0].w = 400; c.levels[0].cols[1].w = 446');
await sprawdz('P1 kolumny 400 + 446, szuflady DXS w prawej');
await wStrukturze('Usuń kolumnę', 0, true, 0).kliknij();
q = await zapis();
ok('P2: kolumna szuflad po usunięciu przegrody ma szerokość auto', q.items[q.active].cab.levels[0].cols.length === 1 && q.items[q.active].cab.levels[0].cols[0].w == null,
  JSON.stringify(q.items[q.active].cab.levels[0].cols.map((c) => [c.kind, c.w])));
await sprawdz('P2 usunięta lewa kolumna');
}

/* ===== Q. zapisany stan sprzed poprawki (poziom 342 mm sam w szafce) — przycisk w Uwagach ===== */
if (wybrany('Q')) {
console.log('\n== Q. poziom z wpisaną wysokością sam w szafce ==');
await nowyProjekt(); await nowaSzafkaWCiagu();
await wStrukturze('Szuflady').kliknij();
await doZapisu('c.levels[0].h = 342; c.levels[0].cols[0].klapa = "gora"');
const bledyQ = await uwagiBledy();
ok('Q1 błąd „nie wypełniają wnętrza” widać', bledyQ.some((t) => /nie wypełniają wnętrza/.test(t)), bledyQ.join(' // ').slice(0, 200));
const btn = przycisk('Górny poziom na auto');
ok('Q1 przy błędzie jest „Górny poziom na auto”', (await btn.count()) > 0);
if (await btn.count()) await poKliku(() => btn.first().click());
q = await zapis();
ok('Q2 po kliknięciu poziom ma wysokość auto', q.items[q.active].cab.levels[0].h == null, String(q.items[q.active].cab.levels[0].h));
await sprawdz('Q2 szuflady po naprawie (klapa wyczyszczona przy wczytaniu)');
// dolny poziom z szufladami 700 mm, gorny (drzwi, z para wzmocnien spod blatu) auto — dolny sam przekracza wnetrze
await doZapisu('const d = c.levels[0].cols[0]; c.levels = [{ h: 700, cols: [{ ...d, rails: [] }] }, { h: null, cols: [{ kind: "doors", doors: 1, w: null, shelfTargets: [null], rails: d.rails || [] }] }]');
const btn3 = przycisk('Podziel poziomy równo');
ok('Q3 dolny 700 przekracza wnętrze — „Podziel poziomy równo”', (await btn3.count()) > 0, (await uwagiBledy()).join(' // ').slice(0, 160));
if (await btn3.count()) await poKliku(() => btn3.first().click());
q = await zapis();
ok('Q4 po kliknięciu wszystkie poziomy auto', q.items[q.active].cab.levels.every((lv) => lv.h == null), JSON.stringify(q.items[q.active].cab.levels.map((lv) => lv.h)));
await sprawdz('Q5 poziomy po równo');
}

const zle = wyniki.filter((w) => w.bl.length);
console.log(`\nPODSUMOWANIE: ${wyniki.length} stanów, z błędami ${zle.length}`);
console.log('BLEDY STRONY:', errors.join(' | ') || '(brak)');
await b.close();
