// Makieta — sufit, blenda i dol szafek gornych (uzytkownik 2026-11-15): „brak opcji przesunięcia szafki do samego sufitu”,
// „ręcznie nie da się złapać, żeby blenda była do sufitu”, „górę szafki da się przesuwać, a dołu nie”, „w ciągu górnym brak opcji
// wymiaru od blatu — widać, że jest stały 500”, „gdzie jest opcja blendy nad górnymi szafkami?”. Sufit podany przy ciagu dolnym
// (pole „wys.” nad rysunkiem) dziala tez dla ciagu gornego tej sciany.
import pw from './pw.mjs';
const { chromium } = pw;
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const page = await (await browser.newContext({ viewport: { width: 1500, height: 1000 } })).newPage();
const errors = [];
page.on('pageerror', (e) => errors.push('[pageerror] ' + e.message));
page.on('console', (m) => { if (m.type() === 'error' && !/favicon|404|\[BABEL\] Note/.test(m.text())) errors.push('[console] ' + m.text()); });
let bledy = 0;
const ok = (l, c, e = '') => { if (!c) bledy++; console.log((c ? '  OK   ' : '  BLAD ') + l + (e ? ' — ' + e : '')); };
const STD = !!process.env.STD;
const URL = STD ? 'http://127.0.0.1:5199/standalone-local.html' : `http://127.0.0.1:5205/${process.env.APP || 'mebloprojekt-app.html'}`;
const SUFIT = 2400;
// sciana: slupek 2000 + szafka dolna; ciag gorny z dwiema szafkami nad szafka dolna (za slupkiem); sufit przy ciagu dolnym
const FIX = `const w = p.items[0];
  p.runs = [{ id: 'r1', name: 'Ściana 1', roomId: w.roomId || 'p1', worktop: true, ceiling: ${SUFIT} },
    { id: 'g1', name: 'Ściana 1', roomId: w.roomId || 'p1', tier: 'gorny', wall: 'r1', offset: 600, offsetFrom: 'left', H: 720 }];
  const mk = (n, W, H, run) => { const it = JSON.parse(JSON.stringify(w)); it.cab.name = n; it.cab.W = W; it.cab.H = H; it.runId = run;
    it.cab.levels = [{ h: null, cols: [{ ...it.cab.levels[0].cols[0], kind: 'doors', doors: 1, w: null, shelfTargets: [null, null] }] }]; return it; };
  const s = mk('Słupek', 600, 2000, 'r1'); s.cab.slupek = true;
  const g = (n) => { const it = mk(n, 400, 720, 'g1'); it.cab.D = 320; it.cab.legs = { ...it.cab.legs, on: false }; it.cab.plinth = { ...it.cab.plinth, on: false }; return it; };
  p.items = [s, mk('Dolna', 800, 720, 'r1'), g('Góra 1'), g('Góra 2')]; p.items.forEach((it) => { it.cab.blatWyciecia = []; }); p.active = 2;`;
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
    localStorage.setItem('mp-mak-przel', JSON.stringify({ zgory: false, gorny: true, dolny: true, fronty: true, kolory: true, wymiary: false }));
  }, zmien || '');
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(1200);
};
const proj = () => page.evaluate(() => JSON.parse(localStorage.getItem('szafki:projekt')));
const czekaj = async (f) => { await page.waitForFunction((src) => { const p = JSON.parse(localStorage.getItem('szafki:projekt')); try { return new Function('p', 'return ' + src)(p); } catch (e) { return false; } }, f, { timeout: 5000 }).catch(() => {}); return proj(); };
const zakl = async (k) => { const b = page.locator(`[data-el="makieta"] nav [data-zakl="${k}"]`);
  if ((await b.getAttribute('aria-pressed')) !== 'true' || !(await page.locator('[data-el="mak-karta-panel"]').count())) await b.click(); await page.waitForTimeout(300); };
const uwagi = async () => (await page.locator('[data-el="makieta-uwagi"]').innerText().catch(() => '')).replace(/\s+/g, ' ');
const wpisz = async (sel, v) => { const f = page.locator(sel).first(); await f.fill(String(v)); await f.press('Enter'); await page.waitForTimeout(500); };
const val = async (sel) => Number(await page.locator(sel).first().inputValue());
const uch = (u) => page.locator(`[data-el="makieta-uchwyty"] [data-u="${u}"]`).first();
const napis = async (re) => (await page.locator('[data-el="makieta-uchwyty"] text').allTextContents()).find((q) => re.test(q)) || '';
const rowno = async () => (await page.locator('[data-el="makieta-podglad"][data-rowno="1"]').count()) > 0;
// przeciaga uchwyt do punktu y (ekran), zbiera napis w trakcie; puszcza
const ciagnij = async (u, yCel, re) => {
  const b = await uch(u).boundingBox(); if (!b) return { t: '', r: false };
  const x = b.x + b.width / 2, y = b.y + b.height / 2;
  await page.mouse.move(x, y); await page.mouse.down();
  for (let i = 1; i <= 12; i++) { await page.mouse.move(x, y + (yCel - y) * i / 12); await page.waitForTimeout(30); }
  await page.waitForTimeout(250);
  const t = await napis(re), r = await rowno();
  await page.mouse.up(); await page.waitForTimeout(700);
  return { t, r };
};
// skala rysunku: px na mm z uchwytow gory i dolu zaznaczonej szafki gornej
const skala = async (H) => { const a = await uch('wys').boundingBox(), b = await uch('dol').boundingBox(); return a && b ? { top: a.y + a.height / 2, bot: b.y + b.height / 2, s: (b.y - a.y) / H } : null; };

console.log('== sufit przy ciągu dolnym działa dla górnego; od blatu; do sufitu ==');
await start(FIX);
await zakl('szafka');
{ const t = await uwagi(); ok('Uwagi: „Nad szafkami górnymi zostaje N mm do sufitu” (sufit z ciągu dolnego)', /Nad szafkami górnymi zostaje \d[\d ]* mm do sufitu/.test(t), t.slice(0, 160)); }
const Y0 = await val('[data-el="mak-gorny-dol"]'), G0 = await val('[data-el="mak-gorny-gora"]');
ok('karta szafki górnej: pole „od blatu” = 500', (await val('[data-el="mak-gorny-od-blatu"]')) === 500, String(await val('[data-el="mak-gorny-od-blatu"]').catch(() => NaN)));
await wpisz('[data-el="mak-gorny-od-blatu"]', 600);
let p = await czekaj("p.runs.find((r) => r.id === 'g1').clearance === 600");
ok('„od blatu” 600 — prześwit 600, dół całego ciągu +100, wysokość bez zmian', p.runs.find((r) => r.id === 'g1').clearance === 600 && (await val('[data-el="mak-gorny-dol"]')) === Y0 + 100 && p.items[2].cab.H === 720,
  `${Y0} → ${await val('[data-el="mak-gorny-dol"]')}`);
await page.locator('[data-el="mak-gorny-blat-krok"][data-v="-50"]').click(); await page.waitForTimeout(500);
p = await czekaj("p.runs.find((r) => r.id === 'g1').clearance === 550");
ok('„−” przy „od blatu” — 550', p.runs.find((r) => r.id === 'g1').clearance === 550);
{ const b = page.locator('[data-el="mak-gorny-do-sufitu"]');
  ok('przycisk „do sufitu (2400)” w karcie szafki górnej', (await b.count()) === 1 && /do sufitu \(2 ?400\)/.test(await b.innerText()), await b.innerText().catch(() => ''));
  await b.click(); await page.waitForTimeout(700); }
ok('po „do sufitu”: góra ciągu górnego = sufit', (await val('[data-el="mak-gorny-gora"]')) === SUFIT, String(await val('[data-el="mak-gorny-gora"]')));
{ const t = await uwagi(); ok('Uwagi: „zostaje 0 mm do sufitu”', /zostaje 0 mm do sufitu/.test(t), t.slice(0, 160));
  ok('Uwagi: na styk pod sufitem na zawieszkach — ostrzeżenie (zostaw luz, blenda)', /stoją na styk pod sufitem — na zawieszkach ich nie zawiesisz/.test(t), t.slice(0, 300)); }
{ const b = page.locator('[data-el="makieta-uwagi"] button', { hasText: /Blenda 100 mm do sufitu/ }).first();
  ok('przycisk w Uwagach „Blenda 100 mm do sufitu — szafki górne niżej”', (await b.count()) === 1);
  await b.click().catch(() => {}); await page.waitForTimeout(700); }
p = await czekaj('p.items[2].cab.topFiller && p.items[2].cab.topFiller.on');
ok('po przycisku: blenda 100 w obu szafkach, góra korpusów 2300', p.items[2].cab.topFiller.height === 100 && p.items[3].cab.topFiller.height === 100 && (await val('[data-el="mak-gorny-gora"]')) === SUFIT - 100,
  `${JSON.stringify(p.items[2].cab.topFiller)} góra ${await val('[data-el="mak-gorny-gora"]')}`);
{ const t = await uwagi(); ok('z blendą — bez ostrzeżenia o zawieszkach', !/na zawieszkach ich nie zawiesisz/.test(t)); }
// karta: „do sufitu z blendą 100” (bez blendy)
const bezBlendy = async () => { await page.evaluate(() => { const p = JSON.parse(localStorage.getItem('szafki:projekt')); [2, 3].forEach((i) => { p.items[i].cab.topFiller = { on: false, height: 100 }; });
  p.runs.find((r) => r.id === 'g1').clearance = 500; localStorage.setItem('szafki:projekt', JSON.stringify(p)); }); await page.reload({ waitUntil: 'networkidle' }); await page.waitForTimeout(1200); await zakl('szafka'); };
await bezBlendy();
await page.locator('[data-el="mak-gorny-do-sufitu-blenda"]').click(); await page.waitForTimeout(700);
p = await czekaj('p.items[3].cab.topFiller && p.items[3].cab.topFiller.on');
ok('karta: „do sufitu z blendą 100” — blenda 100, góra korpusów 2300', p.items[2].cab.topFiller.height === 100 && p.items[3].cab.topFiller.height === 100 && (await val('[data-el="mak-gorny-gora"]')) === SUFIT - 100,
  String(await val('[data-el="mak-gorny-gora"]')));
await bezBlendy();

console.log('== blenda: karta szafki górnej, zakładka Ciąg, „do sufitu” ==');
{ const tak = page.locator('[data-el="mak-sz-blenda"][data-v="tak"]');
  ok('karta Szafka (szafka górna): „Blenda nad szafką” jest / nie ma', (await tak.count()) === 1);
  await tak.click(); await page.waitForTimeout(600);
  p = await czekaj('p.items[2].cab.topFiller && p.items[2].cab.topFiller.on');
  const G = await val('[data-el="mak-gorny-gora"]');
  ok('„jest” — blenda od razu do sufitu (sufit − góra szafki)', p.items[2].cab.topFiller.height === SUFIT - G, `${p.items[2].cab.topFiller.height} vs ${SUFIT - G}`);
  await page.locator('[data-el="mak-sz-blenda"][data-v="nie"]').click(); await page.waitForTimeout(500);
  p = await czekaj('!p.items[2].cab.topFiller.on'); ok('„nie ma” — bez blendy', !p.items[2].cab.topFiller.on); }
await zakl('ciag');
await page.locator('[data-el="mak-ciag-blenda"][data-v="tak"]').click(); await page.waitForTimeout(600);
p = await czekaj('p.items[2].cab.topFiller.on && p.items[3].cab.topFiller.on');
ok('zakładka Ciąg: blenda całego ciągu górnego (obie szafki, 100)', p.items[2].cab.topFiller.height === 100 && p.items[3].cab.topFiller.height === 100 && !(p.items[1].cab.topFiller || {}).on);
{ const b = page.locator('[data-el="mak-ciag-blenda-sufit"]');
  ok('przycisk „Blenda do sufitu (N mm, sufit 2400)”', (await b.count()) === 1 && /Blenda do sufitu \(\d+ mm, sufit 2 ?400\)/.test(await b.innerText()), await b.innerText().catch(() => ''));
  await b.click(); await page.waitForTimeout(600); }
p = await czekaj(`p.items[2].cab.topFiller.height === ${SUFIT - G0}`);
ok('obie blendy do sufitu', p.items[2].cab.topFiller.height === SUFIT - G0 && p.items[3].cab.topFiller.height === SUFIT - G0, `${p.items[2].cab.topFiller.height}, ${p.items[3].cab.topFiller.height} (oczek. ${SUFIT - G0})`);
{ const t = await uwagi(); ok('Uwagi: „Nad szafkami górnymi (z blendą) zostaje 0 mm do sufitu”', /\(z blendą\) zostaje 0 mm do sufitu/.test(t), t.slice(0, 160)); }

console.log('== przeciąganie: blenda łapie sufit, dół szafki górnej, wysokość do sufitu ==');
await page.evaluate(() => { const p = JSON.parse(localStorage.getItem('szafki:projekt')); [2, 3].forEach((i) => { p.items[i].cab.topFiller = { on: true, height: 100 }; }); localStorage.setItem('szafki:projekt', JSON.stringify(p)); });
await page.reload({ waitUntil: 'networkidle' }); await page.waitForTimeout(1200);
await zakl('szafka');
{ const sk = await skala(720);
  ok('uchwyty: blenda, góra i dół szafki górnej', !!sk && (await uch('blenda').count()) === 1, JSON.stringify(sk));
  if (sk) {
    const ySuf = sk.top - (SUFIT - G0) * sk.s;
    const { t, r } = await ciagnij('blenda', ySuf + 15 * sk.s, /blenda/);
    ok('blenda w trakcie: „blenda N — do sufitu” i zielona linia', /blenda \d+ — do sufitu/.test(t) && r, t);
    p = await czekaj(`p.items[2].cab.topFiller.height === ${SUFIT - G0}`);
    ok('po puszczeniu: blenda do sufitu w obu szafkach ciągu (ta sama góra)', p.items[2].cab.topFiller.height === SUFIT - G0 && p.items[3].cab.topFiller.height === SUFIT - G0,
      `${p.items[2].cab.topFiller.height}, ${p.items[3].cab.topFiller.height}`);
    // dol szafki gornej: 100 mm w gore — tylko ta szafka, gora zostaje
    const sk2 = await skala(720);
    const { t: t2 } = await ciagnij('dol', sk2.bot - 100 * sk2.s, /dół/);
    ok('dół w trakcie: „dół N od podłogi”', /dół \d[\d ]* od podłogi/.test(t2), t2);
    { const dlg = page.locator('[data-el="makieta-pytanie-dol"]');
      ok('po puszczeniu pytanie: tylko ta / cały ciąg (dół) / cały ciąg przesuń / anuluj', (await dlg.count()) === 1 && (await dlg.locator('[data-dol]').count()) === 4, await dlg.innerText().catch(() => ''));
      await dlg.locator('[data-dol="ta"]').click(); await page.waitForTimeout(600); }
    p = await czekaj('p.items[2].cab.dolGorny === 100');
    ok('po puszczeniu: dół +100, wysokość 620, góra zostaje; druga szafka bez zmian', p.items[2].cab.dolGorny === 100 && p.items[2].cab.H === 620 && !p.items[3].cab.dolGorny && p.items[3].cab.H === 720,
      JSON.stringify([p.items[2].cab.dolGorny, p.items[2].cab.H, p.items[3].cab.dolGorny, p.items[3].cab.H]));
    // z powrotem prawie do dolu innych — lapie „jak inne”
    const sk3 = await skala(620);
    const { t: t3, r: r3 } = await ciagnij('dol', sk3.bot + 85 * sk3.s, /dół/);
    ok('dół blisko innych — „jak inne” i zielona linia', /jak inne/.test(t3) && r3, t3);
    p = await czekaj('!p.items[2].cab.dolGorny && p.items[2].cab.H === 720');
    ok('po puszczeniu: dół jak inne (720, bez własnego dołu) — bez pytania', !p.items[2].cab.dolGorny && p.items[2].cab.H === 720 && !(await page.locator('[data-el="makieta-pytanie-dol"]').count()),
      JSON.stringify([p.items[2].cab.dolGorny, p.items[2].cab.H]));
    // cały ciąg: dół wyżej o 100, góra zostaje (obie szafki 620, prześwit 600)
    const sk5 = await skala(720);
    await ciagnij('dol', sk5.bot - 100 * sk5.s, /dół/);
    await page.locator('[data-el="makieta-pytanie-dol"] [data-dol="ciag"]').click(); await page.waitForTimeout(600);
    p = await czekaj("p.runs.find((r) => r.id === 'g1').clearance === 600");
    ok('„Cały ciąg — dół, góra zostaje”: prześwit 600, obie szafki 620', p.runs.find((r) => r.id === 'g1').clearance === 600 && p.items[2].cab.H === 620 && p.items[3].cab.H === 620 && !p.items[2].cab.dolGorny,
      JSON.stringify([p.runs.find((r) => r.id === 'g1').clearance, p.items[2].cab.H, p.items[3].cab.H]));
    // cały ciąg przesunięty w dół o 100, wysokość zostaje
    const sk6 = await skala(620);
    await ciagnij('dol', sk6.bot + 100 * sk6.s, /dół/);
    await page.locator('[data-el="makieta-pytanie-dol"] [data-dol="przesun"]').click(); await page.waitForTimeout(600);
    p = await czekaj("p.runs.find((r) => r.id === 'g1').clearance === 500");
    ok('„Cały ciąg przesuń w dół o 100”: prześwit 500, szafki dalej 620', p.runs.find((r) => r.id === 'g1').clearance === 500 && p.items[2].cab.H === 620 && p.items[3].cab.H === 620,
      JSON.stringify([p.runs.find((r) => r.id === 'g1').clearance, p.items[2].cab.H, p.items[3].cab.H]));
    await page.evaluate(() => { const p = JSON.parse(localStorage.getItem('szafki:projekt')); [2, 3].forEach((i) => { p.items[i].cab.H = 720; }); p.runs.find((r) => r.id === 'g1').H = 720; localStorage.setItem('szafki:projekt', JSON.stringify(p)); });
    // wysokosc do sufitu: bez blendy szafka lapie sufit
    await page.evaluate(() => { const p = JSON.parse(localStorage.getItem('szafki:projekt')); [2, 3].forEach((i) => { p.items[i].cab.topFiller = { on: false, height: 100 }; }); localStorage.setItem('szafki:projekt', JSON.stringify(p)); });
    await page.reload({ waitUntil: 'networkidle' }); await page.waitForTimeout(1200); await zakl('szafka');
    const sk4 = await skala(720);
    const { t: t4, r: r4 } = await ciagnij('wys', sk4.top - (SUFIT - G0 - 20) * sk4.s, /wys\./);
    ok('wysokość w trakcie: „wys. N — do sufitu”', /wys\. \d+ — do sufitu/.test(t4) && r4, t4);
    p = await czekaj(`p.items[2].cab.H === ${720 + SUFIT - G0}`);
    ok('po puszczeniu: góra szafki górnej pod sufitem', p.items[2].cab.H === 720 + SUFIT - G0, String(p.items[2].cab.H));
  } }

console.log('== Sevroll Blendo: cokół i blenda nad szafką ==');
await start(FIX + `p.items.forEach((x) => { if (x.runId === 'r1') x.cab.plinth = { on: true, height: 100, mode: 'under', setback: 0 }; }); p.active = 1;`);
await zakl('cokol');
{ const b = page.locator('[data-el="mak-cokol-moc"][data-v="blendo"]');
  ok('Cokół i nóżki: „Mocowanie cokołu” — klipsy na nóżki / złącza Blendo (domyślnie klipsy)', (await b.count()) === 1 && (await page.locator('[data-el="mak-cokol-moc"][data-v="klipsy"]').getAttribute('aria-pressed')) === 'true');
  await b.click(); await page.waitForTimeout(600); }
p = await czekaj("p.items.filter((x) => x.runId === 'r1').every((x) => x.cab.plinth.mocowanie === 'blendo')");
ok('Blendo — cały ciąg dolny (cokół ciągu), podpowiedź z kolejnością', p.items.filter((x) => x.runId === 'r1').every((x) => x.cab.plinth.mocowanie === 'blendo')
  && /Kolejność: szafki na nóżkach/.test(await page.locator('[data-el="mak-cokol-blendo-hint"]').innerText().catch(() => '')));
await page.locator('[data-el="mak-cokol-moc"][data-v="klipsy"]').click(); await page.waitForTimeout(600);
p = await czekaj("p.items.filter((x) => x.runId === 'r1').every((x) => !x.cab.plinth.mocowanie)");
ok('z powrotem klipsy', p.items.filter((x) => x.runId === 'r1').every((x) => !x.cab.plinth.mocowanie));
await page.evaluate(() => { const p = JSON.parse(localStorage.getItem('szafki:projekt')); p.active = 2; [2, 3].forEach((i) => { p.items[i].cab.topFiller = { on: true, height: 100 }; }); localStorage.setItem('szafki:projekt', JSON.stringify(p)); });
await page.reload({ waitUntil: 'networkidle' }); await page.waitForTimeout(1200);
await zakl('szafka');
await page.locator('[data-el="mak-sz-blenda-moc"][data-v="blendo"]').click(); await page.waitForTimeout(600);
p = await czekaj("p.items[2].cab.topFiller.mocowanie === 'blendo'");
ok('karta szafki górnej: blenda na złączach Blendo (tylko ta szafka)', p.items[2].cab.topFiller.mocowanie === 'blendo' && !p.items[3].cab.topFiller.mocowanie);
await zakl('ciag');
await page.locator('[data-el="mak-ciag-blenda-moc"][data-v="blendo"]').click(); await page.waitForTimeout(600);
p = await czekaj("p.items[3].cab.topFiller.mocowanie === 'blendo'");
ok('zakładka Ciąg: blenda całego ciągu górnego na Blendo', p.items[2].cab.topFiller.mocowanie === 'blendo' && p.items[3].cab.topFiller.mocowanie === 'blendo');

console.log('== Blenda przy ścianie: sama do ściany, pas w głąb, wysokość jak szafka obok ==');
await start(FIX + `p.runs[0].wallW = 1600; p.active = 1;`);
await zakl('ciag');
await page.locator('[data-el="mak-ciag-blenda-sc"][data-v="prawa"]').click(); await page.waitForTimeout(800);
p = await czekaj("p.items.some((x) => x.cab.sprzetCiagu && x.cab.sprzetCiagu.typ === 'blenda')");
let ib = p.items.findIndex((x) => x.cab.sprzetCiagu && x.cab.sprzetCiagu.typ === 'blenda');
ok('„z prawej” — blenda na końcu ciągu dolnego, sama do ściany (1600 − 600 − 800 = 200), wysokość jak „Dolna”', ib === 2 && p.items[ib].runId === 'r1' && p.items[ib].cab.W === 200 && p.items[ib].cab.H === 720
  && p.items[ib].cab.sprzetCiagu.strona === 'prawa', JSON.stringify(p.items.map((x) => [x.cab.name, x.cab.W, x.cab.H, x.runId])));
ok('na ścianie wolne 0 mm', /wolne 0 mm/.test(await page.locator('[data-el="mak-wolne"]').innerText().catch(() => '')));
await page.locator('[data-el="mak-sciana"]').fill('1700'); await page.locator('[data-el="mak-sciana"]').press('Enter'); await page.waitForTimeout(700);
p = await czekaj(`p.items[${ib}].cab.W === 300`);
ok('ściana 1700 — blenda rośnie do 300', p.items[ib].cab.W === 300, String(p.items[ib].cab.W));
await page.evaluate((i) => { const p = JSON.parse(localStorage.getItem('szafki:projekt')); p.active = i; localStorage.setItem('szafki:projekt', JSON.stringify(p)); }, ib);
await page.reload({ waitUntil: 'networkidle' }); await page.waitForTimeout(1200);
await zakl('szafka');
ok('karta blendy: szerokość (sama do ściany / mm), pas w głąb; bez pola Wysokość', (await page.locator('[data-el="mak-blenda-sc-auto"]').count()) === 1
  && (await page.locator('[data-el="mak-blenda-sc-pas"]').count()) === 2 && !(await page.locator('[data-el="makieta-karta"] [data-pole="H"], [data-el="mak-karta-panel"] [data-k="H"]').count()));
await page.locator('[data-el="mak-blenda-sc-pas"][data-v="z"]').click(); await page.waitForTimeout(600);
p = await czekaj(`p.items[${ib}].cab.sprzetCiagu.pas === 100`);
ok('„z pasem” — pas 100 mm w głąb; blenda na rysunku z przodu', p.items[ib].cab.sprzetCiagu.pas === 100 && (await page.locator('[data-el="blenda-przy-scianie"]').count()) >= 1);
{ const t = await uwagi(); ok('Podpowiedź o montażu pasa (od środka szafki, wkręty 4 × 30)', /Blenda przy ścianie z pasem 100 mm w głąb/.test(t), t.slice(0, 200)); }
await wpisz('[data-el="mak-blenda-sc-w"]', 250);
p = await czekaj(`p.items[${ib}].cab.W === 250`);
ok('wpisana szerokość 250 — już nie „sama do ściany”', p.items[ib].cab.W === 250 && p.items[ib].cab.sprzetCiagu.auto === false);
// z lewej — przy słupku: wysokość jak słupek
await zakl('ciag');
await page.locator('[data-el="mak-ciag-blenda-sc"][data-v="lewa"]').click(); await page.waitForTimeout(800);
p = await czekaj("p.items[0].cab.sprzetCiagu && p.items[0].cab.sprzetCiagu.typ === 'blenda'");
ok('„z lewej” — blenda na początku ciągu, wysokość jak słupek (2000), słupek', p.items[0].cab.sprzetCiagu && p.items[0].cab.sprzetCiagu.strona === 'lewa' && p.items[0].cab.H === 2000 && p.items[0].cab.slupek === true,
  JSON.stringify([p.items[0].cab.name, p.items[0].cab.W, p.items[0].cab.H, p.items[0].cab.slupek]));
await page.locator('[data-el="mak-ciag-blenda-sc"][data-v="lewa"]').click(); await page.waitForTimeout(600);
await page.locator('[data-el="mak-ciag-blenda-sc"][data-v="prawa"]').click(); await page.waitForTimeout(600);
p = await czekaj("!p.items.some((x) => x.cab.sprzetCiagu && x.cab.sprzetCiagu.typ === 'blenda')");
ok('ponowne kliknięcie usuwa blendy', !p.items.some((x) => x.cab.sprzetCiagu && x.cab.sprzetCiagu.typ === 'blenda') && p.items.length === 4);

ok('bez błędów strony', errors.length === 0, errors.join(' | '));
await browser.close();
console.log(bledy ? `BLEDOW: ${bledy}` : 'WSZYSTKO OK');
process.exit(bledy ? 1 : 0);
