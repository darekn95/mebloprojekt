import { packSheets, SHEET_W, SHEET_H, KERF } from './nest.mjs';

const show = (title, input, opts) => {
  const r = packSheets(input, opts);
  const qty = input.reduce((s, i) => s + i.qty, 0);
  const placed = r.sheets.reduce((s, sh) => s + sh.parts.length, 0);
  console.log('\n=== ' + title + ' ===');
  console.log('  formatek: ' + qty + ', ułożonych: ' + placed + (r.rejected.length ? ', NIE ZMIEŚCIŁO SIĘ: ' + r.rejected.length : ''));
  console.log('  arkuszy: ' + r.sheets.length + ', wykorzystanie: ' + r.usedPct.toFixed(1) + '%, cięć: ' + r.cuts);
  console.log('  strategia: ' + r.strategy);
  const bg = r.biggestRect;
  console.log('  największy zrzut: ' + (bg ? Math.round(bg.w) + '×' + Math.round(bg.h) + ' mm (' + ((bg.w*bg.h)/1e6).toFixed(2) + ' m²)' : 'brak użytecznego') +
    ', użyteczna resztka razem: ' + (r.usefulArea/1e6).toFixed(2) + ' m²');
  r.sheets.forEach((sh, i) => {
    const used = sh.parts.reduce((q, p) => q + p.w * p.h, 0);
    console.log('   arkusz ' + (i + 1) + ': ' + sh.parts.length + ' szt., ' +
      ((used / (r.sheetW * r.sheetH)) * 100).toFixed(1) + '% powierzchni');
  });
  // --- weryfikacja poprawnosci ---
  let bad = [];
  r.sheets.forEach((sh, si) => {
    sh.parts.forEach((p) => {
      if (p.x < -1e-6 || p.y < -1e-6 || p.x + p.w > r.sheetW + 1e-6 || p.y + p.h > r.sheetH + 1e-6)
        bad.push('arkusz ' + (si + 1) + ': ' + p.name + ' poza arkuszem');
    });
    for (let a = 0; a < sh.parts.length; a++)
      for (let b = a + 1; b < sh.parts.length; b++) {
        const A = sh.parts[a], B = sh.parts[b];
        const ox = Math.min(A.x + A.w, B.x + B.w) - Math.max(A.x, B.x);
        const oy = Math.min(A.y + A.h, B.y + B.h) - Math.max(A.y, B.y);
        if (ox > 1e-6 && oy > 1e-6) bad.push('arkusz ' + (si + 1) + ': ' + A.name + ' nachodzi na ' + B.name);
        // odstep na rzaz miedzy sasiadami
        if (ox > 1e-6 && oy <= 1e-6 && Math.abs(oy) < KERF - 1e-6) bad.push('arkusz ' + (si+1) + ': za maly rzaz w pionie miedzy ' + A.name + ' a ' + B.name);
        if (oy > 1e-6 && ox <= 1e-6 && Math.abs(ox) < KERF - 1e-6) bad.push('arkusz ' + (si+1) + ': za maly rzaz w poziomie miedzy ' + A.name + ' a ' + B.name);
      }
  });
  // zrzuty musza byc realne: w obrysie i bez kolizji z formatkami
  r.sheets.forEach((sh, si) => {
    (sh.offcuts || []).forEach((o) => {
      if (o.x < -1e-6 || o.y < -1e-6 || o.x + o.w > r.sheetW + 1e-6 || o.y + o.h > r.sheetH + 1e-6)
        bad.push('arkusz ' + (si + 1) + ': zrzut poza arkuszem');
      sh.parts.forEach((p) => {
        const ox = Math.min(o.x + o.w, p.x + p.w) - Math.max(o.x, p.x);
        const oy = Math.min(o.y + o.h, p.y + p.h) - Math.max(o.y, p.y);
        if (ox > 1e-6 && oy > 1e-6) bad.push('arkusz ' + (si + 1) + ': zrzut nachodzi na ' + p.name);
      });
    });
    for (let a2 = 0; a2 < (sh.offcuts || []).length; a2++)
      for (let b2 = a2 + 1; b2 < sh.offcuts.length; b2++) {
        const A = sh.offcuts[a2], B = sh.offcuts[b2];
        const ox = Math.min(A.x + A.w, B.x + B.w) - Math.max(A.x, B.x);
        const oy = Math.min(A.y + A.h, B.y + B.h) - Math.max(A.y, B.y);
        if (ox > 1e-6 && oy > 1e-6) bad.push('arkusz ' + (si + 1) + ': zrzuty nachodzą na siebie');
      }
  });
  console.log('  kontrola: ' + (bad.length ? 'BŁĘDY -> ' + bad.slice(0, 5).join(' | ') : 'formatki i zrzuty rozłączne, wszystko w obrysie, rzaz zachowany'));
  return r;
};

// A. jedna typowa szafka 600x720x500
show('jedna szafka 600×720×500 (10 formatek)', [
  { name: 'Bok', qty: 2, a: 720, b: 500, rotatable: true },
  { name: 'Dno / wieniec', qty: 2, a: 564, b: 500, rotatable: true },
  { name: 'Półka', qty: 3, a: 564, b: 500, rotatable: true },
  { name: 'Drzwi nakładane', qty: 2, a: 716, b: 297, rotatable: true },
  { name: 'Plecy HDF', qty: 1, a: 598, b: 718, rotatable: true },
]);

// B. kuchnia — 8 szafek
const kitchen = [];
for (let i = 0; i < 8; i++) {
  kitchen.push({ name: 'Bok ' + i, qty: 2, a: 720, b: 500, rotatable: true });
  kitchen.push({ name: 'Dno/wieniec ' + i, qty: 2, a: 564, b: 500, rotatable: true });
  kitchen.push({ name: 'Półka ' + i, qty: 2, a: 564, b: 500, rotatable: true });
  kitchen.push({ name: 'Front ' + i, qty: 2, a: 716, b: 297, rotatable: true });
}
show('kuchnia — 8 szafek (64 formatki)', kitchen);

// C. słoje wzdłuż długości — bez obrotu
show('to samo, ale słoje wymuszone (bez obrotu)', kitchen.map(k => ({ ...k, rotatable: false })));

// D. formatka wieksza niz arkusz
show('formatka za duża na arkusz', [
  { name: 'Bok wysoki', qty: 1, a: 3000, b: 600, rotatable: true },
  { name: 'Półka', qty: 2, a: 564, b: 500, rotatable: true },
]);

// E. szafa 2400 wysokosci
show('szafa 2400×1000×600 — długie boki', [
  { name: 'Bok', qty: 2, a: 2400, b: 600, rotatable: true },
  { name: 'Dno / wieniec', qty: 2, a: 964, b: 600, rotatable: true },
  { name: 'Półka', qty: 6, a: 964, b: 580, rotatable: true },
  { name: 'Drzwi', qty: 2, a: 2396, b: 497, rotatable: true },
]);
