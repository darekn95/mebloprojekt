/* Silnik rozkroju gilotynowego — prototyp do strojenia poza aplikacja.
   Kazde ciecie idzie przez caly pozostaly kawalek (gilotyna), zabiera KERF mm.
   Wolne pola nigdy sie nie nakladaja i powstaja wylacznie z ciec gilotynowych,
   wiec uklad zawsze da sie wyciac prostymi cieciami. */

export const SHEET_W = 2800;
export const SHEET_H = 2100;
export const KERF = 3;

const fits = (w, h, r) => w <= r.w + 1e-9 && h <= r.h + 1e-9;

/* wybor wolnego pola — trzy klasyczne heurystyki dopasowania */
const RECT_RULES = {
  "ciasny krótszy bok": (r, w, h) => Math.min(r.w - w, r.h - h) * 1e6 + Math.max(r.w - w, r.h - h),
  "ciasny dłuższy bok": (r, w, h) => Math.max(r.w - w, r.h - h) * 1e6 + Math.min(r.w - w, r.h - h),
  "najmniejszy odpad": (r, w, h) => r.w * r.h - w * h,
};

function pickRect(free, pw, ph, rotatable, rule) {
  let best = null;
  free.forEach((r, i) => {
    [[pw, ph, false], [ph, pw, true]].forEach(([w, h, rot]) => {
      if (rot && (!rotatable || pw === ph)) return;
      if (!fits(w, h, r)) return;
      const score = rule(r, w, h);
      if (!best || score < best.score) best = { i, w, h, rot, score };
    });
  });
  return best;
}

/* podzial wolnego pola po ulozeniu formatki — dwa warianty gilotynowe */
function splitRect(r, w, h, mode) {
  const out = [];
  const rw = r.w - w - KERF;
  const rh = r.h - h - KERF;
  if (mode === "h") {
    // ciecie poziome przez cala szerokosc pola
    if (rw > 0) out.push({ x: r.x + w + KERF, y: r.y, w: rw, h });
    if (rh > 0) out.push({ x: r.x, y: r.y + h + KERF, w: r.w, h: rh });
  } else {
    // ciecie pionowe przez cala wysokosc pola
    if (rw > 0) out.push({ x: r.x + w + KERF, y: r.y, w: rw, h: r.h });
    if (rh > 0) out.push({ x: r.x, y: r.y + h + KERF, w, h: rh });
  }
  return out;
}

/* jeden przebieg: dana kolejnosc formatek i regula podzialu */
function runPass(parts, sheetW, sheetH, mode, rule) {
  const sheets = [];
  const left = parts.slice();
  while (left.length) {
    const sheet = { free: [{ x: 0, y: 0, w: sheetW, h: sheetH }], parts: [], cuts: 0 };
    let placedAny = false;
    for (let k = 0; k < left.length; ) {
      const p = left[k];
      const hit = pickRect(sheet.free, p.w, p.h, p.rotatable, rule);
      if (!hit) { k++; continue; }
      const r = sheet.free[hit.i];
      sheet.parts.push({ ...p, x: r.x, y: r.y, w: hit.w, h: hit.h, rot: hit.rot });
      const pieces = splitRect(r, hit.w, hit.h, mode);
      sheet.cuts += pieces.length; // kazdy odpad to jedno ciecie oddzielajace
      sheet.free.splice(hit.i, 1, ...pieces);
      left.splice(k, 1);
      placedAny = true;
    }
    if (!placedAny) {
      // formatka wieksza niz arkusz — oddajemy ja osobno jako niemieszczaca sie
      return { sheets, rejected: left.slice() };
    }

    sheet.offcuts = mergeFree(sheet.free);
    sheets.push(sheet);
  }
  return { sheets, rejected: [] };
}

export const MIN_USEFUL = 150; // ponizej tego resztka to juz scinek

/* Sasiadujace wolne pola, ktorych nikt nie przecial, sa fizycznie jednym
   kawalkiem — scalamy je, zeby zrzut liczyl sie jako calosc. Szczelina
   rowna rzazowi tez sie scala: skoro nie ma tam formatki, nie ma i ciecia. */
function mergeFree(free) {
  const rs = free.map((r) => ({ ...r }));
  let again = true;
  while (again) {
    again = false;
    outer: for (let i = 0; i < rs.length; i++) {
      for (let j = i + 1; j < rs.length; j++) {
        const A = rs[i], B = rs[j];
        const near = (a, b) => Math.abs(a - b) <= KERF + 1e-6;
        // ten sam pas w pionie, stykaja sie bokami
        if (Math.abs(A.x - B.x) < 1e-6 && Math.abs(A.w - B.w) < 1e-6) {
          const [t, d] = A.y <= B.y ? [A, B] : [B, A];
          if (near(t.y + t.h, d.y)) {
            rs[i] = { x: t.x, y: t.y, w: t.w, h: d.y + d.h - t.y };
            rs.splice(j, 1); again = true; break outer;
          }
        }
        // ten sam pas w poziomie, stykaja sie gora-dol
        if (Math.abs(A.y - B.y) < 1e-6 && Math.abs(A.h - B.h) < 1e-6) {
          const [l, r2] = A.x <= B.x ? [A, B] : [B, A];
          if (near(l.x + l.w, r2.x)) {
            rs[i] = { x: l.x, y: l.y, w: r2.x + r2.w - l.x, h: l.h };
            rs.splice(j, 1); again = true; break outer;
          }
        }
      }
    }
  }
  return rs.sort((a, b) => b.w * b.h - a.w * a.h);
}

const usefulOf = (rects) => rects.filter((r) => r.w >= MIN_USEFUL && r.h >= MIN_USEFUL);

const area = (p) => p.w * p.h;

export function packSheets(input, { sheetW = SHEET_W, sheetH = SHEET_H } = {}) {
  // rozwijamy sztuki na pojedyncze formatki
  const parts = [];
  input.forEach((it) => {
    for (let i = 0; i < it.qty; i++)
      parts.push({ name: it.name, w: it.a, h: it.b, rotatable: it.rotatable !== false, src: it });
  });
  if (!parts.length) return { sheets: [], rejected: [], usedPct: 0, cuts: 0 };

  const orders = {
    "dłuższy bok malejąco": (a, b) => Math.max(b.w, b.h) - Math.max(a.w, a.h) || area(b) - area(a),
    "pole malejąco": (a, b) => area(b) - area(a) || Math.max(b.w, b.h) - Math.max(a.w, a.h),
    "szerokość malejąco": (a, b) => b.w - a.w || b.h - a.h,
    "wysokość malejąco": (a, b) => b.h - a.h || b.w - a.w,
  };

  let best = null;
  let anyRun = null;
  Object.entries(orders).forEach(([label, cmp]) => {
    const sorted = parts.slice().sort(cmp);
    ["h", "v"].forEach((mode) => {
      Object.entries(RECT_RULES).forEach(([ruleName, rule]) => {
        const res = runPass(sorted, sheetW, sheetH, mode, rule);
        const used = res.sheets.reduce((s, sh) => s + sh.parts.reduce((q, p) => q + p.w * p.h, 0), 0);
        const cuts = res.sheets.reduce((s, sh) => s + sh.cuts, 0);
        const total = Math.max(1, res.sheets.length) * sheetW * sheetH;
        // jakosc resztek: liczy sie jeden duzy zrzut, a nie suma scinkow
        const allOff = res.sheets.flatMap((sh) => usefulOf(sh.offcuts || []));
        const biggest = allOff.reduce((m, r) => Math.max(m, r.w * r.h), 0);
        const usefulArea = allOff.reduce((s2, r) => s2 + r.w * r.h, 0);
        const scraps = res.sheets.reduce(
          (s2, sh) => s2 + (sh.offcuts || []).filter((r) => r.w < MIN_USEFUL || r.h < MIN_USEFUL).length,
          0
        );
        const cand = { ...res, used, cuts, total, label, mode, ruleName, biggest, usefulArea, scraps };
        if (!anyRun) anyRun = cand;
        if (res.rejected.length) return;
        // 1. jak najmniej arkuszy  2. jak najwiekszy pojedynczy zrzut
        // 3. jak najwiecej uzytecznej resztki  4. jak najmniej scinkow  5. ciec
        const cmpBy = [
          (c) => -c.sheets.length,
          (c) => c.biggest,
          (c) => c.usefulArea,
          (c) => -c.scraps,
          (c) => -c.cuts,
        ];
        let better = false;
        if (!best) better = true;
        else
          for (const f of cmpBy) {
            const d = f(cand) - f(best);
            if (Math.abs(d) > 1e-6) { better = d > 0; break; }
          }
        if (better) best = cand;
      });
    });
  });

  const win = best || anyRun;
  const off = win.sheets.flatMap((sh) => usefulOf(sh.offcuts || []));
  const biggestRect = off.reduce((m, r) => (!m || r.w * r.h > m.w * m.h ? r : m), null);
  return {
    biggestRect,
    usefulArea: off.reduce((s2, r) => s2 + r.w * r.h, 0),
    sheets: win.sheets,
    rejected: win.rejected,
    usedPct: (win.used / win.total) * 100,
    cuts: win.cuts,
    strategy:
      win.label +
      " / " +
      (win.mode === "h" ? "podział poziomy" : "podział pionowy") +
      " / " +
      win.ruleName,
    sheetW,
    sheetH,
  };
}
