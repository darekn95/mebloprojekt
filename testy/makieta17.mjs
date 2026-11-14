// Makieta — lodowka w szafce (decyzja uzytkownika 2026-11-13 „Oba warianty”): „podblatowa w szafce” (boki do podlogi, bez dna
// i plecow, wneka od podlogi do spodu blatu, cokol z kratka, front od cokolu, kolejnosc montazu) i „mała w szafce” (z dnem,
// lodowka z wlasnymi drzwiami na dnie, szuflada nad nia, wentylacja). Szafka podblatowa idzie za ciagiem (nozki, glebokosc).
import pw from './pw.mjs';
const { chromium } = pw;
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const page = await (await browser.newContext({ viewport: { width: 1500, height: 950 } })).newPage();
const errors = [];
page.on('pageerror', (e) => errors.push('[pageerror] ' + e.message));
page.on('console', (m) => { if (m.type() === 'error' && !/favicon|404|\[BABEL\] Note/.test(m.text())) errors.push('[console] ' + m.text()); });
let bledy = 0;
const ok = (l, c, e = '') => { if (!c) bledy++; console.log((c ? '  OK   ' : '  BLAD ') + l + (e ? ' — ' + e : '')); };
const STD = !!process.env.STD;
const URL = STD ? 'http://127.0.0.1:5199/standalone-local.html' : `http://127.0.0.1:5205/${process.env.APP || 'mebloprojekt-app.html'}`;
const start = async (zmien) => {
  await page.goto(URL, { waitUntil: 'networkidle' });
  await page.evaluate(() => { try { localStorage.clear(); } catch (e) {} });
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForFunction(() => !!localStorage.getItem('szafki:projekt'), null, { timeout: 10000 });
  await page.evaluate((src) => {
    const p = JSON.parse(localStorage.getItem('szafki:projekt'));
    if (src) new Function('p', src)(p);
    localStorage.setItem('szafki:projekt', JSON.stringify(p));
    localStorage.setItem('mp-tryb', 'prosta');
    localStorage.setItem('mp-mak-zoom', JSON.stringify({ pow: false, z: 1 }));
    localStorage.setItem('mp-mak-przel', JSON.stringify({ zgory: true, gorny: true, dolny: true, fronty: true, kolory: true, wymiary: true }));
  }, zmien || '');
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(1200);
};
const proj = () => page.evaluate(() => JSON.parse(localStorage.getItem('szafki:projekt')));
const czekaj = async (f) => { await page.waitForFunction((src) => { const p = JSON.parse(localStorage.getItem('szafki:projekt')); try { return new Function('p', 'return ' + src)(p); } catch (e) { return false; } }, f, { timeout: 5000 }).catch(() => {}); return proj(); };
const zakl = async (k) => { const b = page.locator(`[data-el="makieta"] nav [data-zakl="${k}"]`);
  if ((await b.getAttribute('aria-pressed')) !== 'true' || !(await page.locator('[data-el="mak-karta-panel"]').count())) await b.click(); await page.waitForTimeout(300); };
const karta = page.locator('[data-el="makieta-karta-agd"]');
const uwagi = async () => (await page.locator('[data-el="makieta-uwagi"]').innerText().catch(() => '')).replace(/\s+/g, ' ');
const agd = async (re) => {
  await zakl('dodaj');
  { const a = page.locator('[data-el="mak-dodaj"] [data-dodaj="agd"]'); if ((await a.getAttribute('aria-expanded').catch(() => 'true')) !== 'true') await a.click().catch(() => {}); await page.waitForTimeout(300); }
  await page.locator('[data-el="mak-agd-lista"] [data-el="mak-agd-wybierz"]').filter({ hasText: re }).first().click(); await page.waitForTimeout(400);
};
// ciag kuchenny z blatem (szafki na nozkach 100 + korpus 720 = 820 do spodu blatu), na koncu lodowka wolnostojaca
const KUCH = `const w = p.items[0];
  p.runs = [{ id: 'r1', name: 'Ściana 1', roomId: w.roomId || 'p1', worktop: true }];
  p.items = [0, 1].map((i) => { const it = JSON.parse(JSON.stringify(w)); it.cab.name = 'Szafka ' + (i + 1); it.cab.W = 600; it.cab.levels = [{ h: null, cols: [{ ...it.cab.levels[0].cols[0], doors: 1, w: null }] }]; it.runId = 'r1'; return it; });
  const l = JSON.parse(JSON.stringify(p.items[1])); l.cab = { ...l.cab, name: 'Lodówka', W: 700, H: 1850, sprzetCiagu: { typ: 'lodowka' } }; p.items.push(l);
  p.active = 0;`;
let p;

console.log('== podblatowa w szafce ==');
await start(KUCH);
await agd(/Lodówka wolnostojąca/);
ok('„Rodzaj lodówki”: 6 rodzajów, w tym „podblatowa w szafce” i „mała w szafce”', (await karta.locator('[data-el="agd-lod-rodz-v"]').count()) === 6
  && (await karta.locator('[data-el="agd-lod-rodz-v"][data-v="szafka"]').count()) === 1 && (await karta.locator('[data-el="agd-lod-rodz-v"][data-v="mala"]').count()) === 1);
await karta.locator('[data-el="agd-lod-rodz-v"][data-v="szafka"]').click();
p = await czekaj('p.items.some((it) => it.cab.lodowkaPodblat)');
{ const L = p.items.find((it) => it.cab.lodowkaPodblat), c = L && L.cab, k = c && c.levels[0].cols[0];
  ok('szafka z lodówką zamiast wolnostojącej (tyle samo pozycji, w ciągu)', !!L && p.items.length === 3 && L.runId === 'r1' && !p.items.some((it) => it.cab.sprzetCiagu));
  ok('wysokość od podłogi do spodu blatu 820, bez nóżek, cokół 100 w obrysie', !!c && c.H === 820 && !c.legs.on && c.plinth.on && c.plinth.mode === 'inbody' && c.plinth.height === 100, c && JSON.stringify({ H: c.H, legs: c.legs.on, pl: c.plinth }));
  ok('bez dna, bez pleców, bez wieńca', !!c && c.back === 'none' && c.joints.botL === 'none' && c.joints.botR === 'none' && c.joints.topL === 'none' && c.joints.topR === 'none');
  ok('kolumna: lodówka, wnęka 820–880; przy 820 bez wzmocnienia u góry (zabrałoby wnękę)', !!k && k.sprzet.typ === 'lodowka' && k.sprzet.hMin === 820 && k.sprzet.hMax === 880 && (k.rails || []).length === 0, k && JSON.stringify(k.rails));
  ok('nazwa „Lodówka”, głębokość jak szafki ciągu', !!c && /^Lodówka/.test(c.name) && c.D === p.items[0].cab.D, c && `${c.name} ${c.D}/${p.items[0].cab.D}`); }
ok('karta: tytuł „Lodówka podblatowa w szafce”, rodzaj zaznaczony, opis wnęki zamiast wyboru wnęki', /Lodówka podblatowa w szafce/.test(await karta.innerText())
  && (await karta.locator('[data-el="agd-lod-rodz-v"][data-v="szafka"]').getAttribute('aria-pressed')) === 'true'
  && (await karta.locator('[data-el="agd-lod-podblat-info"]').count()) === 1 && (await karta.locator('[data-el="agd-lod-wneka"]').count()) === 0);
{ const t = await karta.locator('[data-el="agd-lod-podblat-info"]').innerText().catch(() => '');
  ok('opis: wnęka 820 mm, lodówka 820–880, kratka w cokole', /820 mm/.test(t) && /820–880/.test(t) && /kratka/.test(t), t); }
{ const t = await uwagi();
  ok('uwagi: kolejność montażu (kratka, prowadniki od środka wnęki, cokół, sąsiednie, blat, lodówka, front)', /Lodówka w szafce — kolejność montażu: \(1\) w cokole wytnij kratkę/.test(t)
    && /prowadniki zawiasów — od środka wnęki, póki nie ma w niej lodówki/.test(t) && /\(7\) front na zawiasach/.test(t), t.slice(0, 400));
  ok('uwagi: u góry bez wzmocnienia — wnęka 802 zamiast 820', /u góry bez wzmocnienia — od podłogi do spodu blatu jest 820 mm/.test(t) && /802 mm/.test(t));
  ok('bez ostrzeżenia „nad tą kolumną nie ma wieńca ani wzmocnienia” w lodówce', !/Lodówka[^.]*nad tą kolumną nie ma wieńca/.test(t) && !/nad tą kolumną nie ma wieńca/.test(t)); }
// rysunek: kratka w cokole szafki z lodowka
ok('rysunek: kratka wentylacyjna w cokole', (await page.locator('[data-el="makieta"] [data-el="kratka-cokolu"]').count()) >= 1);
{ const zrzut = process.env.ZRZUT; if (zrzut) await page.locator('[data-el="makieta"]').screenshot({ path: zrzut + '/lod_szafka.png' }); }

console.log('== idzie za ciągiem ==');
// zmiana nozek i glebokosci calego ciagu (jak „wspólne wymiary” — ciag i jego szafki; lodowka w szafce wprost ich nie dostaje)
await page.evaluate(() => { const p = JSON.parse(localStorage.getItem('szafki:projekt')); p.runs[0].D = 580;
  p.items.forEach((it) => { if (!it.cab.lodowkaPodblat) { it.cab.legs = { ...it.cab.legs, height: 150 }; it.cab.D = 580; } });
  localStorage.setItem('szafki:projekt', JSON.stringify(p)); });
await page.reload({ waitUntil: 'networkidle' }); await page.waitForTimeout(1000);
// zapis po dowolnej zmianie (naprawa projektu idzie przy kazdej zmianie i przy wczytaniu)
await agd(/Lodówka/); await karta.locator('[data-el="agd-drzwi-v"][data-v="prawe"]').click().catch(() => {}); await page.waitForTimeout(500);
p = await czekaj('p.items.find((it) => it.cab.lodowkaPodblat).cab.H === 870 && p.items.find((it) => it.cab.lodowkaPodblat).cab.D === 580');
{ const c = p.items.find((it) => it.cab.lodowkaPodblat).cab;
  ok('nóżki ciągu 150: szafka z lodówką 870 do spodu blatu, cokół 150, głębokość ciągu 580', c.H === 870 && c.plinth.height === 150 && c.D === 580, JSON.stringify({ H: c.H, pl: c.plinth.height, D: c.D })); }
{ const t = await uwagi();
  ok('przy 870: „możesz dołożyć płaskie wzmocnienie” (pod nim zostaje 852)', /jest 870 mm, więc pod płytą 18 mm z przodu zostałoby 852 mm/.test(t) && /możesz dołożyć płaskie wzmocnienie/.test(t), t.slice(0, 200)); }

console.log('== mała w szafce (z dnem) ==');
await start(KUCH);
await agd(/Lodówka wolnostojąca/);
await karta.locator('[data-el="agd-lod-rodz-v"][data-v="mala"]').click();
p = await czekaj('p.items.some((it) => it.cab.levels && it.cab.levels[0].cols[0].sprzet && it.cab.levels[0].cols[0].sprzet.montaz === "brak" && it.cab.H < 1500)');
{ const L = p.items.find((it) => it.cab.levels && it.cab.levels[0].cols[0].sprzet && it.cab.H < 1500), c = L && L.cab, s = c && c.levels[0].cols[0].sprzet;
  ok('szafka dolna z lodówką na dnie (własne drzwi), nad nią płyta i otwarta wnęka', !!c && !c.lodowkaPodblat && s.typ === 'lodowka' && s.montaz === 'brak' && c.levels.length === 2 && c.levels[1].cols[0].kind === 'doors' && !c.levels[1].cols[0].doors, c && JSON.stringify(c.levels.map((l) => l.h)));
  ok('wymiary przykładowe 440 × 520 × 450, poziom 540 (z luzem 20 nad nią), z dnem i na nóżkach jak ciąg', !!s && s.lodW === 440 && s.lodH === 520 && s.lodD === 450 && c.levels[0].h === 540
    && c.joints.botL !== 'none' && c.legs.on && c.H === 720, c && JSON.stringify({ s, j: c.joints, legs: c.legs.on, H: c.H }));
  ok('lodówka równo z licem korpusu (za nią luz na wentylację)', !!s && s.luzTyl === c.D - 3 - s.lodD, s && `${s.luzTyl}`); }
ok('karta: „Mała lodówka w szafce”, 4 wysokości, pola wymiarów, opis wentylacji', /Mała lodówka w szafce/.test(await karta.innerText())
  && (await karta.locator('[data-el="agd-lod-mala-h-v"]').count()) === 4 && (await karta.locator('[data-el="agd-mala-w"]').count()) === 1
  && /200 cm²/.test(await karta.locator('[data-el="agd-lod-mala-info"]').innerText().catch(() => '')));
await karta.locator('[data-el="agd-lod-mala-h-v"][data-v="560"]').click();
p = await czekaj('p.items.some((it) => it.cab.levels && it.cab.levels[0].cols[0].sprzet && it.cab.levels[0].cols[0].sprzet.lodH === 560)');
{ const c = p.items.find((it) => it.cab.levels && it.cab.levels[0].cols[0].sprzet && it.cab.levels[0].cols[0].sprzet.lodH === 560);
  ok('wysokość 56 cm: lodówka 560, poziom 580 (płyta nad wnęką idzie za nią)', !!c && c.cab.levels[0].h === 580, c && JSON.stringify(c.cab.levels.map((l) => l.h))); }
{ const t = await uwagi();
  ok('uwagi: mała lodówka na dnie — otwory wentylacyjne', /mała lodówka stoi na dnie szafki — zostaw otwory wentylacyjne/.test(t), t.slice(0, 300));
  ok('bez błędów wnęki lodówki i szuflad', !/wnęka na lodówkę ma/.test(t) && !/skrzynka z bokiem/.test(t), t.slice(0, 300)); }
{ const zrzut = process.env.ZRZUT; if (zrzut) await page.locator('[data-el="makieta"]').screenshot({ path: zrzut + '/lod_mala.png' }); }
// z malej z powrotem do podblatowej
await karta.locator('[data-el="agd-lod-rodz-v"][data-v="szafka"]').click();
p = await czekaj('p.items.some((it) => it.cab.lodowkaPodblat)');
ok('mała → podblatowa w szafce: zastąpiona (tyle samo pozycji)', p.items.length === 3 && p.items.filter((it) => it.cab.levels && it.cab.levels[0].cols[0].sprzet).length === 1);

ok('bez błędów strony', errors.length === 0, errors.join(' | '));
await browser.close();
console.log(bledy ? `BLEDOW: ${bledy}` : 'WSZYSTKO OK');
process.exit(bledy ? 1 : 0);
