/* Przeglad projektu uzytkownika — jedno polecenie zamiast jednorazowych skryptow.
     node testy/projekt.mjs <projekt.json> [katalog-na-zrzuty]
   <projekt.json> to pole `json` z ArtifactData (projekt/biezacy) zapisane do
   pliku — w SCRATCHPADZIE, nie w repozytorium (AGENTS.md). Wymaga serwera
   `python3 -m http.server 5205` w testy/ i swiezego `node testy/build-artifact.mjs`.
   Wypisuje:
   - ciagi (pietro, sciana, narożnik, wstawka) i szafki (wymiary, ciag),
   - uwagi kazdej szafki (bledy / ostrzezenia; podpowiedzi tylko licznik),
   - kolizje otwierania (raz, bo sa wspolne dla projektu),
   - audyt: plyty z rysunku 3D bez pary w formatkach projektu,
   i zapisuje zrzuty: rzut z gory, 3D, elewacja kazdej sciany. */
import pw from './pw.mjs';
import fs from 'fs';
import path from 'path';

const [plik, outArg] = process.argv.slice(2);
if (!plik) { console.log('Uzycie: node testy/projekt.mjs <projekt.json> [katalog-na-zrzuty]'); process.exit(1); }
const out = outArg || path.dirname(path.resolve(plik));
fs.mkdirSync(out, { recursive: true });
let p = JSON.parse(fs.readFileSync(plik, 'utf8'));
if (typeof p.json === 'string') p = JSON.parse(p.json);   // caly dokument z ArtifactData

const b = await pw.chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const page = await (await b.newContext({ viewport: { width: 1500, height: 1300 } })).newPage();
const errors = []; page.on('pageerror', (e) => errors.push(e.message));
await page.goto('http://127.0.0.1:5205/mebloprojekt-app.html', { waitUntil: 'networkidle' });
const wczytaj = async (active) => {
  await page.evaluate((q) => { localStorage.clear(); localStorage.setItem('szafki:projekt', JSON.stringify(q)); }, { ...p, active });
  await page.reload({ waitUntil: 'networkidle' }); await page.waitForTimeout(800);
};
const card = (re) => page.locator('section').filter({ has: page.locator('h2', { hasText: re }) }).first();
const pick = async (l) => { const x = page.getByRole('button', { name: l, exact: true }); if (await x.count()) { await x.first().click(); await page.waitForTimeout(300); return true; } return false; };

console.log(`== projekt „${p.name || ''}” — ${p.items.length} szafek, ${(p.runs || []).length} ciągów ==`);
(p.runs || []).forEach((r) => console.log(`  ciąg ${r.id} „${r.name}” ${r.tier || 'dolny'}${r.wall ? ' nad ' + r.wall : ''}`
  + ` H${r.H} D${r.D} montaż ${r.mountY || 0}${r.corner ? ` | róg: do ${r.corner.of}, ${r.corner.at}, w róg ${r.corner.owner === 'self' ? 'ten' : 'tamten'},`
  + ` luz ${r.corner.clear || 0}${r.corner.wstawka ? `, wstawka ${r.corner.wstawka.typ} ${r.corner.wstawka.w}` : ''}` : ''}`));
p.items.forEach((it, i) => console.log(`  [${i}] ${it.cab.name} ${it.cab.W}×${it.cab.H}×${it.cab.D} @${it.runId || '-'}`
  + `${(it.cab.corner || {}).on ? ' L ramię ' + it.cab.corner.arm : ''}`));

console.log('\n== uwagi szafek (błędy i ostrzeżenia) ==');
let kolizje = null;
for (let i = 0; i < p.items.length; i++) {
  await wczytaj(i);
  const t = (await card(/^Uwagi/).count()) ? await card(/^Uwagi/).innerText() : '';
  const linie = t.split('\n').map((l) => l.trim()).filter(Boolean);
  const podp = linie.indexOf('PODPOWIEDZI — NIC NIE TRZEBA POPRAWIAĆ');
  const glowne = (podp >= 0 ? linie.slice(0, podp) : linie).filter((l) => l.length > 3 && l !== 'Uwagi');
  const kol = glowne.filter((l) => /nie ma się jak otworzyć/.test(l));
  if (!kolizje) kolizje = kol;
  const reszta = glowne.filter((l) => !/nie ma się jak otworzyć/.test(l) && !/^DO SPRAWDZENIA/.test(l) && !/— \d+ (ostrzeż|błęd)/.test(l));
  const ilePodp = podp >= 0 ? linie.slice(podp + 1).filter((l) => l.length > 3 && !/^DO SPRAWDZENIA/.test(l)).length : 0;
  console.log(`  [${i}] ${p.items[i].cab.name}: ${reszta.length ? '' : 'bez błędów i ostrzeżeń'} (podpowiedzi: ${ilePodp})`);
  reszta.forEach((l) => console.log('      ' + l.slice(0, 220)));
}
console.log('\n== kolizje otwierania ==');
(kolizje || []).forEach((l) => console.log('  ' + l.slice(0, 260)));
if (!(kolizje || []).length) console.log('  brak');

console.log('\n== audyt: rysunek 3D ↔ formatki projektu ==');
await wczytaj(p.active || 0);
const zakres = (await pick('Zabudowa')) ? 'Zabudowa' : ((await pick('Ciąg')) ? 'Ciąg' : 'Szafka');
await pick('Zamk.');
await page.evaluate(() => { window.__audytBryl = []; });
await pick('3D');
const sol = await page.evaluate(() => window.__audytBryl || []);
const parts = await page.evaluate(() => {
  const sec = [...document.querySelectorAll('section')].find((s) => /^Formatki (całego projektu|do zamówienia)/.test((s.querySelector('h2') || {}).textContent || '')
    && /całego/.test((s.querySelector('h2') || {}).textContent || ''))
    || [...document.querySelectorAll('section')].find((s) => /^Formatki do zamówienia/.test((s.querySelector('h2') || {}).textContent || ''));
  if (!sec) return [];
  const th = [...sec.querySelectorAll('thead th')].map((x) => x.textContent.trim());
  const iA = th.indexOf('Długość'), iB = th.indexOf('Szerokość');
  return [...sec.querySelectorAll('tbody tr')].map((tr) => { const td = [...tr.children].map((x) => x.textContent.trim());
    return { name: td[0], a: Number(td[iA].replace(/\s/g, '')), b: Number(td[iB].replace(/\s/g, '')) }; });
});
const plyty = sol.filter((s) => { const d = [...s.d].sort((x, y) => x - y);
  return d[0] > 0.5 && d[0] <= 40 && d[1] >= 20 && s.color !== '#3f3f46' && !/^(uchwyt|noga)/.test(s.tag || ''); });
const brak = plyty.filter((s) => { const [, q, r] = [...s.d].sort((x, y) => x - y).map(Math.round);
  return !parts.find((x) => (Math.abs(x.a - q) <= 3 && Math.abs(x.b - r) <= 3) || (Math.abs(x.a - r) <= 3 && Math.abs(x.b - q) <= 3)
    || (/^Cokół/.test(x.name) && Math.abs(x.b - q) <= 3 && x.a >= r - 3)); })
  .map((s) => [...s.d].sort((x, y) => x - y).map(Math.round).join('×') + (s.tag ? ' [' + s.tag + ']' : ''));
console.log(`  zakres ${zakres}: ${plyty.length} płyt z rysunku, ${parts.length} pozycji formatek`);
console.log(brak.length ? '  BEZ PARY: ' + [...new Set(brak)].join('; ') : '  każda płyta ma parę w formatkach');

console.log('\n== zrzuty ==');
const zrzut = async (nazwa) => { const f = path.join(out, `projekt-${nazwa}.png`); await page.locator('#rysunek').screenshot({ path: f }); console.log('  ' + f); };
await page.getByRole('button', { name: 'Dopasuj', exact: true }).click().catch(() => {});
await zrzut('3d');
if (await pick('Z góry')) await zrzut('gora');
if (await pick('Ciąg')) {
  await pick('Całość'); await pick('Zamk.');
  await zrzut('elewacja');
}
console.log('\nBLEDY STRONY:', errors.length ? errors.join('; ') : '(brak)');
await b.close();
