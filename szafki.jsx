import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";

/* ============================================================
   SZAFKI — poziomy, kolumny, przegrody
   ============================================================ */

const INK = "#1c1917";
const LINE = "#57534e";
const DIMC = "#0369a1";
const WARNC = "#b45309";
const ERRC = "#b91c1c";
const ACC = "#0f766e";
const PALETA = [
  ["Biały", "#f4f2ee"],
  ["Biały mat", "#e8e6e1"],
  ["Szary", "#9c9b97"],
  ["Antracyt", "#4a4d4f"],
  ["Czarny", "#2b2a28"],
  ["Dąb sonoma", "#d8c3a0"],
  ["Dąb wotan", "#b39a76"],
  ["Orzech", "#7a5638"],
  ["Buk", "#d9b98a"],
  ["Brąz", "#5b4433"],
];

const MIN_COL = 200; // najwezsza sensowna kolumna
const MIN_LEVEL = 100; // najnizszy sensowny poziom przy auto-dodawaniu

/* Sevroll V-BOX 3D Slim, wymiary elementow dla plyty 18 mm */
const VBOX = {
  heights: [80, 95, 127, 178, 210, 238],
  backH: { 80: 71, 95: 86, 127: 118, 178: 169, 210: 200, 238: 230 },
  // minimalna wysokosc frontu zalezy od tego, czy front idzie na korpus czy w niego
  minFront: {
    overlay: { 80: 95, 95: 110, 127: 142, 178: 192, 210: 223, 238: 253 },
    inset: { 80: 93, 95: 108, 127: 140, 178: 190, 210: 221, 238: 251 },
  },
  nl: [250, 270, 300, 350, 400, 450, 500, 550, 600],
};

/* polska odmiana liczebnikow: 1 blad, 2-4 bledy, 5+ bledow (12-14 tez bledow) */
const plural = (n, one, few, many) => {
  const a = Math.abs(n) % 100;
  const b = a % 10;
  if (a === 1) return one;
  if (b >= 2 && b <= 4 && !(a >= 12 && a <= 14)) return few;
  return many;
};

const fmt = (n) => {
  if (n === null || n === undefined || Number.isNaN(n)) return "—";
  const r = Math.round(n * 10) / 10;
  return Number.isInteger(r) ? String(r) : r.toFixed(1);
};

const num = (v) =>
  v === "" || v === null || v === undefined || Number.isNaN(Number(v))
    ? null
    : Math.round(Number(v));

/* zawiasy: dwa w standardzie, wiecej dopiero przy duzym i szerokim skrzydle */
function autoHinges(h, w) {
  if (w <= 500) return 2;
  if (h > 2000) return 4;
  if (h > 1400) return 3;
  return 2;
}

/* prowadnice szuflad: 21 mm na stronę (razem ze ścianką skrzynki) */
const RUNNER_W = 21; // szerokosc przy boku
const RUNNER_UP = 16; // dol szyny nad dolem frontu — front nakladany
// przy froncie wpuszczanym dol szyny schodzi o luz wpuszczenia, czyli siada
// rowno z dnem korpusu — tak jak przy froncie nakladanym

/* gabaryty zawiasu widziane od przodu (puszka + ramie na boku) */
const HINGE_H = 55; // wysokosc
const HINGE_W = 20; // szerokosc na boku
const HINGE_D = 80; // glebokosc zabudowy
const HINGE_REF = 100; // referencyjny odstep srodka od krawedzi frontu
const HINGE_CLR = 30; // wymagany luz od polki czy wzmocnienia

/* Srodek skrajnych zawiasow 100 mm od gory i dolu frontu, kolejne rozlozone
   rowno miedzy nimi (trzeci wypada dokladnie w polowie). Gdy zawias koliduje
   z polka albo wzmocnieniem, przesuwamy go najkrocej jak sie da tak, zeby
   zostalo HINGE_CLR luzu — i meldujemy o tym w uwagach. */
function hingePositions(y0, h, n, obstacles) {
  if (n <= 0 || h < HINGE_H) return { pts: [], moved: [] };
  const half = HINGE_H / 2;
  const lo = y0 + half;
  const hi = y0 + h - half;
  let b = y0 + HINGE_REF;
  let t = y0 + h - HINGE_REF;
  if (t <= b) {
    // front za niski na referencyjne 100 mm — rozkladamy na calej wysokosci
    b = lo;
    t = hi;
  }
  const base =
    n === 1 ? [(b + t) / 2] : Array.from({ length: n }, (_, i) => b + ((t - b) * i) / (n - 1));
  const pts = [];
  const moved = [];
  base.forEach((want) => {
    let y = Math.min(hi, Math.max(lo, want));
    for (let pass = 0; pass < 4; pass++) {
      const hit = obstacles.find(
        (o) => y + half + HINGE_CLR > o.y0 && y - half - HINGE_CLR < o.y1
      );
      if (!hit) break;
      const below = hit.y0 - HINGE_CLR - half;
      const above = hit.y1 + HINGE_CLR + half;
      const okB = below >= lo;
      const okA = above <= hi;
      let ny = null;
      if (okB && okA) ny = Math.abs(below - want) <= Math.abs(above - want) ? below : above;
      else if (okB) ny = below;
      else if (okA) ny = above;
      if (ny === null) break; // nie ma gdzie uciec — zostawiamy i tak jest ostrzezenie
      y = ny;
    }
    const yr = Math.round(y);
    if (Math.abs(yr - Math.round(want)) >= 1) moved.push({ from: Math.round(want), to: yr });
    pts.push(yr);
  });
  return { pts, moved };
}

/* rozdziela `total` na pola: podane zostaja, puste dziela reszte po rowno */
function distribute(total, targets) {
  const t = targets.map(num);
  const fixed = t.reduce((s, v) => s + (v === null ? 0 : v), 0);
  const auto = t.map((v, i) => (v === null ? i : -1)).filter((i) => i >= 0);
  const out = t.slice();
  if (auto.length) {
    const rest = total - fixed;
    const base = rest >= 0 ? Math.floor(rest / auto.length) : 0;
    const rem = rest >= 0 ? rest - base * auto.length : 0;
    auto.forEach((idx, k) => (out[idx] = rest >= 0 ? base + (k < rem ? 1 : 0) : 0));
  }
  const sum = out.reduce((s, v) => s + v, 0);
  return { sizes: out, diff: total - sum };
}

/* ---------- domyslny projekt ---------- */

const defaultMaterials = {
  board: { name: "Płyta laminowana 18", thickness: 18, color: "#d8c3a0" },
  front: { name: "Płyta laminowana 18", thickness: 18, color: "#c2a880" },
  shelf: { name: "Płyta laminowana 18", thickness: 18, color: "#d0bb96" },
  back: { name: "HDF 3", thickness: 3, color: "#9c7b56" },
  mirror: { name: "Lustro 4", thickness: 4, color: "#c3d0d6" },
};

// element wzmacniajacy w kolumnie (moze byc wiele)
// orient: "front" = pionowa plyta w licu (trawers), "shelf" = lezacy jak polka,
//         "vertical" = stojacy jak bok. pos: gora/dol. side: dla vertical lewy/prawy.
// h = wysokosc pasa (front/vertical), depth = glebokosc w glab (shelf/vertical),
// atDepth = odsuniecie od lica, fromBack = liczone od tylu, reducesDoor = skraca drzwi.
const newRail = () => ({
  orient: "front",
  pos: "top",
  side: "left",
  h: 100,
  depth: 100,
  atDepth: 0,
  fromBack: false,
  reducesDoor: false,
});

const newColumn = (doors = 1, shelves = 0) => ({
  w: null,
  kind: "doors",
  doors,
  shelfTargets: Array(shelves + 1).fill(null),
  nl: null,
  drawers: [],
  doorWidths: [],
  mirrors: [],
  handles: [],
  hinges: [],
  rails: [],
  backMode: "inherit",
  fix: { side: "none", w: 60, mode: "overlay", support: false, supportDepth: 100 },
  blendaMode: "overlay",
  drawerMode: "inherit", // front szuflady: dziedziczy z korpusu / na korpusie / wewnatrz
  hinge: "auto",
});

const newDrawer = (h = "auto") => ({ h, front: null, handle: true });

const newLevel = (doors = 2, shelves = 3) => ({
  h: null,
  cols: [newColumn(doors, shelves)],
});

const defaultCab = {
  version: 4,
  name: "Szafka 1",
  W: 600,
  H: 720,
  D: 500,
  bottomMode: "between",
  topMode: "between",
  depthIncludesBack: false,
  depthIncludesFront: false,
  back: "hdf",
  backPos: "inside",
  backBoardMat: "shelf",
  backGroove: { on: false, offset: 16, depth: 4, play: 1 },
  frontMode: "overlay",
  gaps: { edge: 2, between: 2, top: 2, bottom: 2, inset: 2, divOverlay: 8 },
  maxGap: 5,
  shelfExtraSetback: 0,
  levels: [newLevel(2, 3)],
  plinth: { on: false, height: 100, mode: "inbody", setback: 0 },
  // wieniec jako blat: wystaje poza boki i poza lico korpusu, a fronty
  // konczą sie pod nim
  top: { mode: "wieniec", overL: 0, overR: 0, overFront: 0, overBack: 0 },
  topFiller: { on: false, height: 100 }, // zaslepka nad szafka (do sufitu / maskownica)
  extraParts: [], // formatki dopisane recznie, poza geometria szafki
  note: "", // notatka montazowa — trafia do zestawienia
  frontSameAsBoard: true,
  shelfSameAsBoard: true,
  openAngle: 90,
  legs: { on: false, height: 100 },
  grainMatters: false,
  realColors: false,
  // dwa niezaleznie wycinane narozniki TYLNE (lewy = cutout, prawy = cutoutR)
  cutout: { on: false, w: 100, d: 100, fullHeight: true, levelIndex: 0, mask: true, maskType: "auto", maskFront: "over" },
  cutoutR: { on: false, w: 100, d: 100, fullHeight: true, levelIndex: 0, mask: true, maskType: "auto", maskFront: "over" },
  obstacles: [],
  // kazdy element: { on, w, d, h, side, fromSide, fromBack, fromBottom, fullHeight,
  //   mask, maskType, maskFront, maskCorner, maskToShelf, maskH }
  obstacle: { on: false, w: 80, d: 80, h: 0, side: "right", fromSide: 0, fromBack: 0, fromBottom: 0, fullHeight: true, mask: false, maskType: "auto", maskFront: "over" },
  edgeOverrides: {},
};

// scala wczytana szafke z domyslnymi polami + migruje stary model wyciecia
const migrateCab = (rawCab) => {
  const merged = { ...defaultCab, ...(rawCab || {}), version: defaultCab.version };
  if (!merged.top || typeof merged.top !== "object")
    merged.top = { mode: "wieniec", overL: 0, overR: 0, overFront: 0, overBack: 0 };
  if (!Array.isArray(merged.extraParts)) merged.extraParts = [];
  ["cutout", "cutoutR", "obstacle", "backGroove", "plinth", "topFiller", "legs", "gaps", "joints"].forEach((k) => {
    if (defaultCab[k] && typeof defaultCab[k] === "object")
      merged[k] = { ...defaultCab[k], ...((rawCab && rawCab[k]) || {}) };
  });
  if (rawCab && rawCab.cutout && rawCab.cutout.corner === "backRight") {
    merged.cutoutR = { ...merged.cutout };
    merged.cutout = { ...defaultCab.cutout };
  }
  if (merged.cutout) delete merged.cutout.corner;
  if (merged.cutoutR) delete merged.cutoutR.corner;
  return merged;
};
const migrateMat = (rawMat) => {
  const mm = { ...defaultMaterials };
  if (rawMat) Object.keys(mm).forEach((k) => { mm[k] = { ...mm[k], ...(rawMat[k] || {}) }; });
  mm.mirror = { ...mm.mirror, color: defaultMaterials.mirror.color }; // kolor lustra staly
  return mm;
};
// buduje stan projektu z wczytanych danych: obsluguje stary {cab,mat} i nowy {items,active}
const DEFAULT_PROJECT_NAME = "Projekt bez nazwy";

const loadProject = (d) => {
  if (!d) return null;
  let items;
  if (Array.isArray(d.items) && d.items.length) {
    items = d.items.map((it) => ({ cab: migrateCab(it.cab), mat: migrateMat(it.mat) }));
  } else if (d.cab) {
    items = [{ cab: migrateCab(d.cab), mat: migrateMat(d.mat) }];
  } else return null;
  const active = Math.min(Math.max(0, Math.round(d.active || 0)), items.length - 1);
  const prices = d.prices && typeof d.prices === "object" ? d.prices : {};
  const name = typeof d.name === "string" && d.name.trim() ? d.name : DEFAULT_PROJECT_NAME;
  return { name, items, active, prices };
};

/* ---------- szablony startowe ----------
   Szablon tylko ustawia zestaw pol — nie blokuje niczego i nie rozgalezia
   silnika geometrii. Po dodaniu szafki zmieniasz w niej co chcesz. */
const TEMPLATES = [
  {
    id: "stojaca",
    label: "Szafka stojąca",
    hint: "600 × 720 × 500, cokół, dwoje drzwi",
    make: () => ({
      W: 600, H: 720, D: 500,
      plinth: { on: true, height: 100, mode: "inbody", setback: 0 },
      levels: [newLevel(2, 3)],
    }),
  },
  {
    id: "wiszaca",
    label: "Szafka wisząca",
    hint: "600 × 720 × 300, bez cokołu i nóżek",
    make: () => ({
      W: 600, H: 720, D: 300,
      plinth: { on: false, height: 100, mode: "inbody", setback: 0 },
      legs: { on: false, height: 100 },
      levels: [newLevel(2, 2)],
    }),
  },
  {
    id: "biurko",
    label: "Biurko",
    hint: "1200 × 750 × 600, blat na bokach, bez dna, pleców i drzwi",
    make: () => {
      const col = newColumn(0, 0);
      col.doors = 0;
      col.shelfTargets = [null];
      return {
        W: 1200, H: 750, D: 600,
        top: { mode: "blat", overL: 50, overR: 50, overFront: 30, overBack: 0 },
        joints: { topL: "over", topR: "over", botL: "none", botR: "none" },
        back: "none",
        plinth: { on: false, height: 100, mode: "inbody", setback: 0 },
        legs: { on: false, height: 100 },
        levels: [{ h: null, cols: [col] }],
      };
    },
  },
];

const makeFromTemplate = (id) => {
  const tpl = TEMPLATES.find((t) => t.id === id) || TEMPLATES[0];
  return migrateCab({ ...JSON.parse(JSON.stringify(defaultCab)), ...tpl.make() });
};

/* ---------- geometria ---------- */

function computeGeo(cab, mat) {
  const t = mat.board.thickness;
  const tf = mat.front.thickness;
  const backIsBoard = cab.back === "board";
  // plyta na plecy ma grubosc korpusu, HDF swoja wlasna
  const tb = backIsBoard ? mat.board.thickness : mat.back.thickness;
  const backPos = cab.backPos === "outside" ? "outside" : "inside";
  const { W, H, D } = cab;
  const g = cab.gaps;
  const msgs = [];
  const add = (level, text) => msgs.push({ level, text });

  const gr = cab.backGroove || { on: false, offset: 16, depth: 4, play: 1 };
  const grooved = cab.back === "hdf" && !!gr.on;
  const grOff = Math.max(0, Math.round(gr.offset ?? 3));
  const grDep = Math.max(0, Math.round(gr.depth ?? 4));
  const grPlay = Math.max(0, Math.round(gr.play ?? 1));

  // plecy we frezie chowaja sie w korpusie, wiec nie doliczaja sie do glebokosci
  let carcassDepth = D;
  if (!grooved && cab.depthIncludesBack && cab.back !== "none") carcassDepth -= tb;
  // front nakladany wystaje przed korpus; jesli podana glebokosc go zawiera, korpus jest plytszy
  if (cab.depthIncludesFront && cab.frontMode === "overlay") {
    const anyFront = (cab.levels || []).some((lv) =>
      (lv.cols || []).some((c) => (c.kind !== "blenda") && ((c.doors ?? 0) > 0 || (c.drawers || []).length))
    );
    if (anyFront) carcassDepth -= tf;
  }
  const hasBack = cab.back !== "none";
  const rear = !hasBack;

  if (grooved) {
    if (grDep >= t)
      add("error", `Frez ${grDep} mm jest głębszy niż płyta ${fmt(t)} mm.`);
    if (grPlay >= grDep)
      add("error", "Luz we frezie jest większy niż jego głębokość — plecy nie wejdą.");
    if (grOff + tb > carcassDepth)
      add("error", "Frez wypada poza głębokość korpusu.");
  }

  if (W <= 2 * t) add("error", "Szerokość jest mniejsza niż dwie grubości płyty.");
  if (H <= 2 * t) add("error", "Wysokość jest mniejsza niż dwie grubości płyty.");
  if (carcassDepth <= 0) add("error", "Głębokość korpusu wychodzi zero lub mniej.");

  // dno i wieniec: kazde zlacze osobno — "between" = plyta miedzy bokami, "over" = plyta na boku
  const J = cab.joints || {};
  const legacy = (m) => (m === "outside" || m === "under" ? "over" : "between");
  const topL = J.topL || legacy(cab.topMode);
  const topR = J.topR || legacy(cab.topMode);
  const botL = J.botL || legacy(cab.bottomMode);
  const botR = J.botR || legacy(cab.bottomMode);
  // "none" = brak panelu (wieniec/dno). Boki i tak stoja na pelnej wysokosci.
  const rawTop = cab.top || {};
  const ov = (v) => Math.max(0, Math.round(num(v) ?? 0));
  const hasTop = topL !== "none" && topR !== "none";
  // blat lezy na bokach jak wieniec "na boku", ale ma wlasny obrys
  const isBlat = hasTop && rawTop.mode === "blat";
  const blat = isBlat
    ? { overL: ov(rawTop.overL), overR: ov(rawTop.overR), overFront: ov(rawTop.overFront), overBack: ov(rawTop.overBack) }
    : null;
  const hasBot = botL !== "none" && botR !== "none";

  const topOverL = isBlat || topL === "over";
  const topOverR = isBlat || topR === "over";
  const leftLen = H - (topOverL ? t : 0) - (botL === "over" ? t : 0);
  const rightLen = H - (topOverR ? t : 0) - (botR === "over" ? t : 0);
  const leftY0 = botL === "over" ? t : 0;
  const rightY0 = botR === "over" ? t : 0;
  const topX0 = isBlat ? -blat.overL : topL === "between" ? t : 0;
  const topX1 = isBlat ? W + blat.overR : topR === "between" ? W - t : W;
  const botX0 = botL === "between" ? t : 0;
  const botX1 = botR === "between" ? W - t : W;

  const pMode = cab.plinth.mode === "between" ? "inbody" : cab.plinth.mode;
  const plinthInBody =
    cab.plinth.on && pMode === "inbody" && botL === "between" && botR === "between";
  const plinthH = cab.plinth.on ? cab.plinth.height : 0;
  const bottomY = plinthInBody ? plinthH : 0;

  const interior = { x0: t, x1: W - t, y0: hasBot ? bottomY + t : bottomY, y1: hasTop ? H - t : H };
  const innerW = interior.x1 - interior.x0;
  const innerH = interior.y1 - interior.y0;

  // przy plecach we frezie polka musi zatrzymac sie przed HDF
  const backIntrusion = grooved ? grOff + tb : 0; // polka konczy sie przed licem HDF
  const frontCut =
    (cab.shelfExtraSetback || 0) + (cab.frontMode === "inset" ? tf + 5 : 0);
  const shelfDepth = Math.round(carcassDepth - backIntrusion - frontCut);
  const dividerDepth = Math.round(carcassDepth - backIntrusion);
  if (shelfDepth <= 0)
    add("error", "Głębokość półki wychodzi zero lub mniej — zmniejsz cofnięcie półki.");

  /* --- poziomy: rozdzielone półkami na całą szerokość --- */
  const rawLevels = cab.levels && cab.levels.length ? cab.levels : [newLevel()];
  const L = rawLevels.length;
  const levFree = innerH - (L - 1) * t;
  const lev = distribute(levFree, rawLevels.map((l) => l.h));
  if (lev.diff !== 0)
    add(
      "error",
      lev.diff < 0
        ? `Zadane wysokości poziomów przekraczają wnętrze o ${fmt(-lev.diff)} mm.`
        : `Zadane wysokości poziomów nie wypełniają wnętrza — brakuje ${fmt(lev.diff)} mm.`
    );

  const levels = [];
  const sepShelves = [];
  let cy = interior.y0;
  for (let i = 0; i < L; i++) {
    const h = lev.sizes[i];
    levels.push({ i, y0: cy, y1: cy + h, h, cols: [], fixed: num(rawLevels[i].h) !== null });
    cy += h;
    if (i < L - 1) {
      sepShelves.push({ y: cy });
      cy += t;
    }
    if (h > 0 && h < 60) add("warn", `Poziom ${i + 1} ma tylko ${fmt(h)} mm światła.`);
    if (h < 0) add("error", `Poziom ${i + 1} ma ujemną wysokość.`);
  }

  /* --- kolumny wewnątrz poziomów --- */
  const dividers = [];
  levels.forEach((lv) => {
    const rawCols = rawLevels[lv.i].cols && rawLevels[lv.i].cols.length
      ? rawLevels[lv.i].cols
      : [newColumn()];
    const K = rawCols.length;
    const colFree = innerW - (K - 1) * t;
    const col = distribute(colFree, rawCols.map((c) => c.w));
    if (col.diff !== 0)
      add(
        "error",
        col.diff < 0
          ? `Poziom ${lv.i + 1}: kolumny przekraczają szerokość wnętrza o ${fmt(-col.diff)} mm.`
          : `Poziom ${lv.i + 1}: kolumny nie wypełniają szerokości — brakuje ${fmt(col.diff)} mm.`
      );

    let cx = interior.x0;
    for (let j = 0; j < K; j++) {
      const w = col.sizes[j];
      const c = {
        j,
        x0: cx,
        x1: cx + w,
        w,
        fixed: num(rawCols[j].w) !== null,
        shelves: [],
        openings: [],
        doors: [],
      };
      if (w > 0 && w < MIN_COL)
        add(
          "warn",
          `Poziom ${lv.i + 1}, kolumna ${j + 1}: światło ${fmt(w)} mm, poniżej rozsądnego minimum ${MIN_COL} mm.`
        );
      if (w <= 0)
        add("error", `Poziom ${lv.i + 1}, kolumna ${j + 1}: szerokość zero lub mniej.`);

      /* półki wewnątrz kolumny — kolumna z szufladami ich nie ma */
      const st =
        rawCols[j].kind === "drawers" ? [null] : rawCols[j].shelfTargets || [null];
      const nS = Math.max(0, st.length - 1);
      const shFree = lv.h - nS * t;
      const sh = distribute(shFree, st);
      if (sh.diff !== 0)
        add(
          "error",
          `Poziom ${lv.i + 1}, kolumna ${j + 1}: zadane światła nie zgadzają się o ${fmt(Math.abs(sh.diff))} mm.`
        );
      let sy = lv.y0;
      for (let k = 0; k <= nS; k++) {
        c.openings.push({ k, from: sy, to: sy + sh.sizes[k], h: sh.sizes[k], fixed: num(st[k]) !== null });
        if (sh.sizes[k] > 0 && sh.sizes[k] < 50)
          add(
            "warn",
            `Poziom ${lv.i + 1}, kolumna ${j + 1}, światło ${k + 1}: tylko ${fmt(sh.sizes[k])} mm.`
          );
        sy += sh.sizes[k];
        if (k < nS) {
          c.shelves.push({ y: sy });
          sy += t;
        }
      }

      lv.cols.push(c);
      cx += w;
      if (j < K - 1) {
        dividers.push({ x: cx, y0: lv.y0, y1: lv.y1, h: lv.h, level: lv.i });
        cx += t;
      }
    }
  });

  /* --- fronty: pasmo pionowe z poziomu, poziome z kolumny --- */
  const half = g.between / 2;
  const divOv = Math.max(0, Math.round(g.divOverlay ?? 8));
  const divGap = t - 2 * divOv; // szczelina miedzy frontami nad przegroda
  if (cab.frontMode === "overlay") {
    if (divGap < 2)
      add(
        "error",
        `Nałożenie ${divOv} mm z obu stron zostawia nad przegrodą tylko ${fmt(divGap)} mm szczeliny — potrzeba minimum 2 mm.`
      );
    else if (divGap > cab.maxGap)
      add(
        "warn",
        `Szczelina nad przegrodą to ${fmt(divGap)} mm — powyżej przyjętego maksimum.`
      );
  }
  const doors = [];
  const drawerParts = [];
  const fixParts = [];
  const blendaParts = [];
  const mirrorParts = [];
  let handleCount = 0;
  let hingeCount = 0;
  const slideGroups = new Map();
  const supportParts = [];
  const insetExtra = cab.frontMode === "inset" ? tf : 0;
  // czy fronty danej kolumny siedza w swietle korpusu — potrzebne sasiadom,
  // bo front nakladany obok wpuszczanego musi zakryc cala przegrode
  const colIsInset = (rc) => {
    if (!rc) return false;
    if (rc.kind === "drawers")
      return (
        (rc.drawerMode === "overlay" || rc.drawerMode === "inset"
          ? rc.drawerMode
          : cab.frontMode) === "inset"
      );
    if (rc.kind === "blenda") return rc.blendaMode === "inset";
    return cab.frontMode === "inset";
  };
  const maxNL = [...VBOX.nl].reverse().find((v) => v + 3 + insetExtra <= carcassDepth) ?? null;

  // przeszkody ograniczajace glebokosc szuflad: wyciecie narożnika i element kolizyjny
  const backBlocks = [];
  {
    [[cab.cutout, true], [cab.cutoutR, false]].forEach(([cu, onL]) => {
      if (!cu?.on) return;
      const cwv = Math.round(cu.w || 0), cdv = Math.round(cu.d || 0);
      if (cwv > 0 && cdv > 0) {
        // zabudowa zabiera dodatkowo grubosc plyty czola
        const maskT = cu.mask !== false ? t : 0;
        backBlocks.push({ x0: onL ? 0 : W - cwv, x1: onL ? cwv : W, free: carcassDepth - cdv - maskT });
      }
    });
    const preList = (Array.isArray(cab.obstacles) && cab.obstacles.length
      ? cab.obstacles
      : cab.obstacle?.on ? [cab.obstacle] : []).filter((o) => o && o.on !== false);
    preList.forEach((obs) => {
      const ow = Math.round(obs.w || 0), od = Math.round(obs.d || 0);
      const fs = Math.round(obs.fromSide || 0), fb = Math.round(obs.fromBack || 0);
      if (ow > 0 && od > 0) {
        const x0 = obs.side === "left" ? fs : W - fs - ow;
        const maskT = obs.mask ? t : 0;
        backBlocks.push({ x0, x1: x0 + ow, free: carcassDepth - (fb + od) - maskT });
      }
    });
  }
  // najglebsze NL, jakie zmiesci sie w danym pasmie szerokosci
  const maxNlFor = (x0, x1, extra = insetExtra) => {
    let blocked = false;
    const lim = backBlocks.reduce((acc, b) => {
      if (Math.min(b.x1, x1) - Math.max(b.x0, x0) > 0) {
        blocked = true;
        return Math.min(acc, b.free);
      }
      return acc;
    }, carcassDepth);
    // przy przeszkodzie wymagamy 4 mm luzu miedzy szuflada a zabudowa
    const margin = blocked ? 4 : 3;
    return [...VBOX.nl].reverse().find((v) => v + margin + extra <= lim) ?? null;
  };

  levels.forEach((lv) => {
    let lo, hi;
    if (cab.frontMode === "overlay") {
      lo =
        lv.i === 0
          ? bottomY + g.bottom
          : Math.round(sepShelves[lv.i - 1].y + t / 2 + Math.ceil(half));
      hi =
        lv.i === levels.length - 1
          ? H - (isBlat ? t : 0) - g.top
          : Math.round(sepShelves[lv.i].y + t / 2 - Math.floor(half));
    } else {
      lo = lv.y0 + g.inset;
      hi = lv.y1 - g.inset;
    }
    lv.frontLo = lo;
    lv.frontHi = hi;
    const bandH = Math.round(hi - lo);

    lv.cols.forEach((c, j) => {
      const rawCol = rawLevels[lv.i].cols[j];
      const kind =
        rawCol.kind === "drawers" || rawCol.kind === "blenda" ? rawCol.kind : "doors";
      c.kind = kind;
      const where = `Poziom ${lv.i + 1}, kolumna ${j + 1}`;

      // --- elementy wzmacniajace kolumny ---
      const rawRails = Array.isArray(rawCol.rails) ? rawCol.rails : [];
      // pasmo frontu skracane przez wzmocnienia czolowe "skraca drzwi"
      let clo = lo, chi = hi;
      rawRails.forEach((r) => {
        if (r && r.orient === "front" && r.reducesDoor) {
          const rr = Math.max(0, Math.round(r.h || 0)) + g.between;
          if (r.pos === "bottom") clo += rr; else chi -= rr;
        }
      });
      // fix "gora" — staly pas u gory skraca pasmo drzwi (np. szafka do sufitu, lampy)
      const topFixW = (rawCol.fix && rawCol.fix.side === "top") ? Math.max(0, Math.round(rawCol.fix.w || 0)) : 0;
      let topFixGeo = null;
      if (topFixW > 0) {
        // maskownica: na najwyzszym poziomie przy froncie nakladanym siedzi rowno
        // z gora korpusu (bez luzu nad soba), zachowujac zadana wysokosc
        const flushTop = cab.frontMode === "overlay" && lv.i === levels.length - 1;
        // przy blacie maskownica konczy sie pod nim, a nie na jego licu
        const tfTop = flushTop ? H - (isBlat ? t : 0) : chi;
        topFixGeo = { y: tfTop - topFixW, w: topFixW };
        chi = tfTop - topFixW - g.between;
      }
      let cbandH = Math.round(chi - clo);
      // geometria wzmocnien (pozycje do rysunku i formatek); pozycja liczona w pelnym pasmie lo..hi
      c.rails = rawRails.map((r) => {
        const rh = Math.max(0, Math.round(r.h || 0));
        const rd = Math.max(0, Math.round(r.depth || 0));
        const rAt = Math.max(0, Math.round(r.atDepth || 0));
        const zLen = r.orient === "front" ? t : rd;
        const z0 = r.fromBack ? Math.max(0, carcassDepth - rAt - zLen) : rAt;
        const cw = c.x1 - c.x0;
        if (r.orient === "shelf") {
          const ry = r.pos === "bottom" ? lo : hi - t;
          return { orient: "shelf", x0: c.x0, x1: c.x1, y0: ry, y1: ry + t, z0, zLen: rd, a: cw, b: rd };
        }
        if (r.orient === "vertical") {
          const rx = r.side === "right" ? c.x1 - t : c.x0;
          // domyslnie wisi od gory; poziom najwyzszy z wiencem -> nizej o grubosc wienca
          const isTopLevel = lv.i === levels.length - 1;
          const vTop = hi - (hasTop && isTopLevel ? t : 0);
          return { orient: "vertical", x0: rx, x1: rx + t, y0: vTop - rh, y1: vTop, z0, zLen: rd, a: rh, b: rd };
        }
        const ry1 = r.pos === "bottom" ? lo + rh : hi;
        return { orient: "front", x0: c.x0, x1: c.x1, y0: ry1 - rh, y1: ry1, z0, zLen: t, a: cw, b: rh };
      });

      // sasiad z frontem wpuszczanym nie zakryje swojej polowy przegrody,
      // wiec front nakladany bierze ja w calosci i zostawia normalny luz
      const rawCols = rawLevels[lv.i].cols;
      const prevIn = j > 0 && colIsInset(rawCols[j - 1]);
      const nextIn = j < lv.cols.length - 1 && colIsInset(rawCols[j + 1]);
      const ovlX0 = j === 0
        ? g.edge
        : prevIn
        ? Math.round(c.x0 - t + g.edge)
        : Math.round(c.x0 - divOv);
      const ovlX1 = j === lv.cols.length - 1
        ? W - g.edge
        : nextIn
        ? Math.round(c.x1 + t - g.edge)
        : Math.round(c.x1 + divOv);
      const insX0 = c.x0 + g.inset;
      const insX1 = c.x1 - g.inset;
      // sciana odniesienia dla szczelin: krawedz korpusu albo dalsze lico
      // przegrody, gdy to my zakrywamy ja w calosci
      const selfIn = colIsInset(rawCol);
      const gwL = selfIn ? c.x0 : j === 0 ? 0 : prevIn ? c.x0 - t : null;
      const gwR = selfIn ? c.x1 : j === lv.cols.length - 1 ? W : nextIn ? c.x1 + t : null;

      let sx0, sx1;
      if (cab.frontMode === "overlay") {
        sx0 = ovlX0;
        sx1 = ovlX1;
      } else {
        sx0 = insX0;
        sx1 = insX1;
      }
      /* element staly (fix) zabiera kawalek pasma od strony sciany */
      const rawFix = rawCol.fix || { side: "none", w: 0 };
      const fixW = Math.max(0, Math.round(rawFix.w || 0));
      const hasFix = rawFix.side === "left" || rawFix.side === "right";
      const fixInset = rawFix.mode === "inset";
      if (hasFix && fixW > 0) {
        // fix wpuszczany siedzi w swietle korpusu, nakladany w pasmie frontu.
        // Nakladany dziala jak maskownica: tam gdzie dochodzi do boku, wienca
        // albo dna idzie rowno z korpusem, luz zostaje tylko od strony drzwi.
        const ovl = !fixInset && cab.frontMode === "overlay";
        const atOuter = ovl && (rawFix.side === "left" ? j === 0 : j === lv.cols.length - 1);
        const fLo = fixInset
          ? lv.y0 + g.inset
          : ovl && lv.i === 0 && clo === lo
          ? bottomY
          : clo;
        const fTop = fixInset
          ? lv.y1 - g.inset
          : ovl && lv.i === levels.length - 1 && chi === hi
          ? H
          : chi;
        const fH = Math.round(fTop - fLo);
        const fx = fixInset
          ? rawFix.side === "left"
            ? c.x0 + g.inset
            : c.x1 - g.inset - fixW
          : atOuter
          ? rawFix.side === "left"
            ? 0
            : W - fixW
          : rawFix.side === "left"
          ? sx0
          : sx1 - fixW;
        c.fix = { x: fx, y: fLo, w: fixW, h: fH, side: rawFix.side, inset: fixInset };
        fixParts.push({ h: fH, w: fixW });
        doors.push({
          lvl: lv.i,
          key: `f${lv.i}-${j}`,
          type: "fix",
          colKey: `${lv.i}-${j}`,
          x: fx,
          y: fLo,
          w: fixW,
          h: fH,
          iInGroup: 0,
          groupN: 1,
          inset: fixInset,
          gWallL: gwL, gWallR: gwR, colY0: lv.y0, colY1: lv.y1,
        });
        if (rawFix.support) {
          const sd = Math.max(0, Math.round(rawFix.supportDepth || 0));
          if (sd <= 0) add("error", `${where}: wspornik pionowy ma zerową głębokość.`);
          else if (sd > carcassDepth)
            add("error", `${where}: wspornik pionowy głębszy niż korpus.`);
          else if (kind === "drawers") {
            const needNl = num(rawCol.nl) ?? maxNL;
            if (needNl && sd < needNl)
              add(
                "error",
                `${where}: wspornik ma ${fmt(sd)} mm, a prowadnica NL ${needNl} musi się na nim oprzeć na całej długości — daj minimum ${needNl} mm.`
              );
          }
          else {
            supportParts.push({ h: lv.h, d: sd });
            c.support = { d: sd, side: rawFix.side };
          }
        }
        if (rawFix.side === "left") sx0 = Math.max(sx0, fx + fixW + g.between);
        else sx1 = Math.min(sx1, fx - g.between);
        if (sx1 - sx0 <= 0)
          add("error", `${where}: element stały nie zostawia miejsca na front.`);
      }

      c.frontX0 = sx0;
      c.frontX1 = sx1;

      // panel stalego pasa u gory (fix "gora") — na szerokosc frontu, skraca drzwi
      if (topFixGeo && sx1 - sx0 > 0) {
        // dziala jak maskownica: tam gdzie dochodzi do boku albo do wienca
        // nie zostawiamy luzu, ma zaslaniac korpus. Luzy zostaja tylko
        // od strony sasiedniej kolumny (miedzy frontami).
        const ovl = cab.frontMode === "overlay";
        const tfy = topFixGeo.y;
        const tfx0 = ovl && j === 0 ? 0 : sx0;
        const tfx1 = ovl && j === lv.cols.length - 1 ? W : sx1;
        const tfw = Math.round(tfx1 - tfx0);
        c.topFix = { x: tfx0, y: tfy, w: tfw, h: topFixW };
        fixParts.push({ h: topFixW, w: tfw });
        doors.push({
          lvl: lv.i, key: `ft${lv.i}-${j}`, type: "fix", colKey: `${lv.i}-${j}`,
          x: tfx0, y: tfy, w: tfw, h: topFixW, iInGroup: 0, groupN: 1,
        });
      }

      if (kind === "blenda") {
        const bi = rawCol.blendaMode === "inset";
        const bx0 = bi ? c.x0 + g.inset : sx0;
        const bx1 = bi ? c.x1 - g.inset : sx1;
        const by0 = bi ? lv.y0 + g.inset : clo;
        const by1 = bi ? lv.y1 - g.inset : chi;
        const bw = Math.round(bx1 - bx0);
        const bh = Math.round(by1 - by0);
        c.count = 1;
        if (bw <= 0 || bh <= 0) {
          add("error", `${where}: blenda ma wymiar zero lub mniej.`);
        } else {
          blendaParts.push({ h: bh, w: bw });
          doors.push({
            lvl: lv.i,
            key: `b${lv.i}-${j}`,
            type: "blenda",
          colKey: `${lv.i}-${j}`,
            x: bx0,
            y: by0,
            w: bw,
            h: bh,
            iInGroup: 0,
            groupN: 1,
            inset: bi,
            gWallL: gwL, gWallR: gwR, colY0: lv.y0, colY1: lv.y1,
          });
        }
        return;
      }

      if (kind === "doors") {
        const cnt = Math.max(0, Math.round(rawCol.doors ?? 0));
        c.count = cnt;
        if (cnt <= 0) return;
        // luz miedzy drzwiami: wlasny dla kolumny albo globalny
        const colGap = num(rawCol.gapBetween) ?? g.between;
        c.gapBetween = colGap;
        const availW = Math.round(sx1 - sx0 - (cnt - 1) * colGap);
        const wTargets = [];
        for (let i = 0; i < cnt; i++) wTargets.push((rawCol.doorWidths || [])[i]);
        const dws = distribute(availW, wTargets);
        if (dws.diff !== 0)
          add(
            "error",
            `${where}: zadane szerokości drzwi nie wypełniają pasma — różnica ${fmt(Math.abs(dws.diff))} mm.`
          );
        c.doorWs = dws.sizes;
        // gdy dzielimy rowno, a wychodza rozne szerokosci o 1-2 mm — podpowiedz zeby zwiekszyc luz
        const autoCnt = (rawCol.doorWidths || []).filter((v) => num(v) === null).length || cnt;
        if (autoCnt > 1) {
          const uniq = [...new Set(dws.sizes.map((v) => Math.round(v)))];
          if (uniq.length > 1) {
            const spread = Math.max(...uniq) - Math.min(...uniq);
            if (spread <= 2)
              add("info", `${where}: przy równym podziale drzwi różnią się o ${fmt(spread)} mm. Zwiększ luz między drzwiami o ${fmt(spread)} mm, żeby formatki były identyczne.|fixgap:${lv.i}:${j}:${colGap + spread}`);
          }
        }
        c.doorW = dws.sizes[0];
        c.doorH = cbandH;
        let dx = sx0;
        for (let i = 0; i < cnt; i++) {
          const dw = dws.sizes[i];
          const d = {
            lvl: lv.i,
            key: `d${lv.i}-${j}-${i}`,
            type: "door",
          colKey: `${lv.i}-${j}`,
            x: dx,
            y: clo,
            w: dw,
            h: cbandH,
            iInGroup: i,
            groupN: cnt,
            inset: cab.frontMode === "inset",
            gWallL: gwL, gWallR: gwR, colY0: lv.y0, colY1: lv.y1,
            mirror: !!(rawCol.mirrors || [])[i],
            hinges: num((rawCol.hinges || [])[i]) ?? autoHinges(cbandH, dw),
            handle: (rawCol.handles || [])[i] !== false,
            hingeSide:
              cnt === 1
                ? rawCol.hinge === "left" || rawCol.hinge === "right"
                  ? rawCol.hinge
                  : hasFix && rawFix.side === "left"
                  ? "right"
                  : "left"
                : i < cnt / 2
                ? "left"
                : "right",
          };
          // rozstaw zawiasow + kolizje z polkami i wzmocnieniami w tej kolumnie
          const hObs = [
            ...c.shelves.map((s) => ({ y0: s.y, y1: s.y + t, what: "półką" })),
            ...(c.rails || []).map((r) => ({ y0: r.y0, y1: r.y1, what: "wzmocnieniem" })),
          ];
          const hp = hingePositions(d.y, d.h, d.hinges, hObs);
          d.hingePts = hp.pts;
          d.colJ = j;
          d.colLast = j === lv.cols.length - 1;
          // zawias siedzi w swietle kolumny, przy licu tego, co go niesie:
          // boku, przegrody albo wspornika przy elemencie stalym. Dodatkowo
          // odsuwamy go za lico otwartego skrzydla, zeby sie nie nakladaly.
          const carrierL =
            c.fix && c.fix.side === "left" ? Math.max(c.x0, c.fix.x + c.fix.w) : c.x0;
          const carrierR =
            c.fix && c.fix.side === "right" ? Math.min(c.x1, c.fix.x) : c.x1;
          d.hingeX =
            d.hingeSide === "left"
              ? Math.max(carrierL, d.x + tf)
              : Math.min(carrierR, d.x + dw - tf) - HINGE_W;
          hp.moved.forEach((m) =>
            add(
              "warn",
              `${where}, skrzydło ${i + 1}: zawias przesunięty z ${fmt(m.from - d.y)} na ${fmt(
                m.to - d.y
              )} mm od dołu frontu — kolizja z półką lub wzmocnieniem, zostawiony luz ${HINGE_CLR} mm.`
            )
          );
          doors.push(d);
          c.doors.push(d);
          dx += dw + colGap;
          if (dw <= 0) add("error", `${where}: drzwi ${i + 1} mają szerokość zero lub mniej.`);
          if ((rawCol.mirrors || [])[i] && dw > 1 && cbandH > 1)
            mirrorParts.push({ a: cbandH - 1, b: dw - 1 });
          if ((rawCol.handles || [])[i] !== false) handleCount += 1;
          const autoH = autoHinges(cbandH, dw);
          const ovH = num((rawCol.hinges || [])[i]);
          hingeCount += ovH !== null ? ovH : autoH;
        }
        if (cbandH <= 0) add("error", `${where}: wysokość drzwi zero lub mniej.`);

        if (hasFix && fixW > 0) {
          const auto = rawFix.side === "left" ? "right" : "left";
          const hinge =
            rawCol.hinge === "left" || rawCol.hinge === "right" ? rawCol.hinge : auto;
          c.hinge = cnt >= 2 ? "obie" : hinge;
          const sides = cnt >= 2 ? ["left", "right"] : [hinge];
          if (sides.includes(rawFix.side) && !rawFix.support)
            add(
              "error",
              `${where}: zawias wypada na elemencie stałym — nie ma go w co przykręcić, tych drzwi fizycznie nie da się zamontować.` +
                `|fixsup:${lv.i}:${j}|fixnodoor:${lv.i}:${j}`
            );
        }
        return;
      }

      /* --- szuflady V-BOX --- */
      const ds = rawCol.drawers && rawCol.drawers.length ? rawCol.drawers : [];
      c.count = ds.length;
      c.drawers = [];
      if (!ds.length) return;

      // front szuflady moze siedziec inaczej niz drzwi: na korpusie albo w jego
      // obrysie. "inherit" bierze ustawienie calej szafki.
      const dMode =
        rawCol.drawerMode === "overlay" || rawCol.drawerMode === "inset"
          ? rawCol.drawerMode
          : cab.frontMode;
      c.drawerMode = dMode;
      const dIn = dMode === "inset";
      const dInsetExtra = dIn ? tf : 0;
      const dsx0 = dIn ? insX0 : ovlX0;
      const dsx1 = dIn ? insX1 : ovlX1;
      const dlo = dIn ? lv.y0 + g.inset : cab.frontMode === "overlay" ? clo : lo;
      const dhi = dIn ? lv.y1 - g.inset : cab.frontMode === "overlay" ? chi : hi;
      const dbandH = Math.round(dhi - dlo);

      const LW = c.w;
      const colMaxNL = maxNlFor(dsx0, dsx1, dInsetExtra); // ile realnie wchodzi w tej kolumnie
      const colNl = num(rawCol.nl) ?? colMaxNL; // domyslne dla kolumny
      c.nl = colNl;
      if (colNl === null)
        add("error", `${where}: korpus za płytki na najkrótszą szufladę (potrzeba ${250 + 3 + dInsetExtra} mm).`);
      if (LW > 600)
        add("warn", `${where}: szuflada szersza niż 600 mm — wzmocnij dno kątownikiem (Sevroll 40343).`);

      const drGap = num(rawCol.gapBetween) ?? g.between;
      c.gapBetween = drGap;
      if (ds.length > 1) {
        if (drGap <= 0)
          add("error", `${where}: luz między szufladami ${fmt(drGap)} mm — fronty się stykają, potrzeba minimum 2 mm.`);
        else if (drGap === 1)
          add("warn", `${where}: luz między szufladami tylko 1 mm — zalecane 2 mm, żeby fronty się nie ocierały.`);
      }
      const avail = dbandH - (ds.length - 1) * drGap;
      const fr = distribute(avail, ds.map((d) => d.front));
      if (fr.diff !== 0)
        add(
          "error",
          `${where}: wysokości frontów szuflad nie zgadzają się o ${fmt(Math.abs(fr.diff))} mm.`
        );
      // podpowiedz wyrownania, gdy rowny podzial daje rozne fronty o 1-2 mm
      const autoFronts = ds.filter((d) => num(d.front) === null).length;
      if (autoFronts > 1) {
        const uniq = [...new Set(fr.sizes.map((v) => Math.round(v)))];
        const spread = uniq.length > 1 ? Math.max(...uniq) - Math.min(...uniq) : 0;
        if (spread >= 1 && spread <= 2)
          add("info", `${where}: przy równym podziale fronty szuflad różnią się o ${fmt(spread)} mm. Żeby były identyczne, dobierz luz między frontami lub wysokość pasma tak, by dzieliło się równo.`);
      }

      let y = dlo;
      ds.forEach((d, i) => {
        const fh = fr.sizes[i];
        // wysokosc boku V-BOX: auto dobiera najwyzszy bok mieszczacy sie w froncie
        let hClass;
        if (d.h === "auto" || d.h == null) {
          const fit = [...VBOX.heights]
            .filter((hc) => VBOX.minFront[dMode][hc] <= fh)
            .pop();
          hClass = fit || VBOX.heights[0];
        } else {
          hClass = VBOX.heights.includes(Number(d.h)) ? Number(d.h) : 127;
        }
        const nl = num(d.nl) ?? colNl; // NL tej konkretnej szuflady
        if (nl !== null) {
          const need = nl + 3 + dInsetExtra;
          if (need > carcassDepth) {
            // najdluzsza prowadnica, ktora sie tu zmiesci — do przycisku naprawy
            const fitNl = [...VBOX.nl]
              .reverse()
              .find((v) => v + 3 + dInsetExtra <= carcassDepth && (colMaxNL == null || v <= colMaxNL));
            add(
              "error",
              `${where}, szuflada ${i + 1}: NL ${nl} wymaga korpusu ${need} mm, a jest ${fmt(carcassDepth)} mm.` +
                (fitNl ? `|fixnl:${lv.i}:${j}:${i}:${fitNl}` : "")
            );
          }
          else if (colMaxNL && nl < colMaxNL)
            add("info", `${where}, szuflada ${i + 1}: zmieści się głębsza NL ${colMaxNL}.|fixnl:${lv.i}:${j}:${i}:${colMaxNL}`);
        }
        const dr = {
          i,
          y,
          h: fh,
          x: dsx0,
          w: dsx1 - dsx0,
          hClass,
          nl,
          fixed: num(d.front) !== null,
          // prowadnica: 21 mm szerokosci przy kazdym boku, wysokosc z boku
          // skrzynki, glebokosc z NL. Front nakladany -> dol szyny 16 mm nad
          // dolem frontu, front wpuszczany -> o luz wpuszczenia ponizej niego;
          // w obu przypadkach najnizsza szyna siada rowno z dnem korpusu.
          rail: {
            y0: dIn ? y - g.inset : y + RUNNER_UP,
            h: hClass,
            d: nl || 0,
            // front wpuszczany zamyka sie w swietle korpusu, wiec prowadnice
            // trzeba dodatkowo cofnac o grubosc frontu
            setback: dInsetExtra,
          },
        };
        c.drawers.push(dr);
        doors.push({
          lvl: lv.i,
          key: `x${lv.i}-${j}-${i}`,
          type: "drawer",
          colKey: `${lv.i}-${j}`,
          x: dsx0,
          y,
          w: dsx1 - dsx0,
          h: fh,
          colW: c.w, // swiatlo szerokosci kolumny (do swiatla szuflady = colW - 42)
          nl,
          handle: d.handle !== false,
          iInGroup: 0,
          groupN: 1,
          inset: dIn,
          gWallL: gwL, gWallR: gwR, colY0: lv.y0, colY1: lv.y1,
        });
        if (d.handle !== false) handleCount += 1;
        if (nl !== null) {
          const kk = `${hClass}|${nl}`;
          slideGroups.set(kk, (slideGroups.get(kk) || 0) + 1);
        }

        const minF = VBOX.minFront[dMode][hClass];
        if (fh < minF)
          add(
            "error",
            `${where}, szuflada ${i + 1}: front ${fmt(fh)} mm, a minimum dla wysokości ${hClass} mm przy froncie ${
              dIn ? "wpuszczanym" : "na korpusie"
            } to ${minF} mm.`
          );
        if (fh - hClass > 140)
          add(
            "warn",
            `${where}, szuflada ${i + 1}: front wystaje ${fmt(fh - hClass)} mm ponad bok szuflady — zastosuj reling boczny.`
          );

        if (nl !== null && LW > 0) {
          drawerParts.push({ kind: "front", a: fh, b: dsx1 - dsx0 });
          drawerParts.push({ kind: "dno", a: LW - 75, b: nl - 24 });
          drawerParts.push({ kind: "tyl", a: LW - 87, b: VBOX.backH[hClass] });
        }
        y += fh + drGap;
      });
    });
  });

  /* --- suma kontrolna: sasiadujace fronty nie moga na siebie wchodzic --- */
  const nameOf = (d) =>
    d.type === "door"
      ? "drzwi"
      : d.type === "drawer"
      ? "front szuflady"
      : d.type === "blenda"
      ? "blenda"
      : "element stały";

  levels.forEach((lv) => {
    const band = doors.filter((d) => d.lvl === lv.i && d.w > 0);
    band.forEach((a2) => {
      // najblizszy front na prawo, ktory pokrywa sie w pionie
      let nb = null;
      band.forEach((b2) => {
        if (b2 === a2 || b2.x < a2.x + a2.w - 0.5) return;
        const vo = Math.min(a2.y + a2.h, b2.y + b2.h) - Math.max(a2.y, b2.y);
        if (vo <= 0) return;
        if (!nb || b2.x < nb.x) nb = b2;
      });
      if (!nb) return;
      const gap = Math.round(nb.x - (a2.x + a2.w));
      if (gap <= 0)
        add(
          "error",
          `Poziom ${lv.i + 1}: między ${nameOf(a2)} a ${nameOf(nb)} jest ${fmt(gap)} mm — fronty się stykają, potrzeba minimum 2 mm luzu.`
        );
      else if (gap === 1)
        add(
          "warn",
          `Poziom ${lv.i + 1}: między ${nameOf(a2)} a ${nameOf(nb)} tylko 1 mm luzu — zalecane 2 mm, żeby fronty się nie ocierały.`
        );
      else if (a2.colKey === nb.colKey && gap > cab.maxGap)
        add(
          "warn",
          `Poziom ${lv.i + 1}: między ${nameOf(a2)} a ${nameOf(nb)} jest ${fmt(gap)} mm szczeliny.`
        );
    });

    // nachodzenie liczone osobno, zeby zlapac tez wieksze zakladki
    band.forEach((a2, i) =>
      band.forEach((b2, k) => {
        if (k <= i) return;
        const ho = Math.min(a2.x + a2.w, b2.x + b2.w) - Math.max(a2.x, b2.x);
        const vo = Math.min(a2.y + a2.h, b2.y + b2.h) - Math.max(a2.y, b2.y);
        if (ho > 0 && vo > 0)
          add(
            "error",
            `Poziom ${lv.i + 1}: ${nameOf(a2)} i ${nameOf(b2)} zachodzą na siebie o ${fmt(ho)} mm.`
          );
      })
    );

    if (band.length && cab.frontMode === "overlay") {
      const minX = Math.min(...band.map((d) => d.x));
      const maxX = Math.max(...band.map((d) => d.x + d.w));
      if (minX < 0 || maxX > W)
        add("error", `Poziom ${lv.i + 1}: fronty wystają poza obrys szafki.`);
    }
  });

  /* --- luzy --- */
  const labels = {
    edge: "od krawędzi korpusu",
    between: "między drzwiami",
    top: "u góry",
    bottom: "u dołu",
    inset: "dookoła drzwi wpuszczanych",
    divOverlay: null,
  };
  Object.entries(g).forEach(([k, v]) => {
    if (!labels[k]) return; // nałożenie na przegrodę ma własną kontrolę
    if (v > cab.maxGap)
      add("warn", `Luz ${labels[k]} to ${fmt(v)} mm — powyżej przyjętego maksimum ${fmt(cab.maxGap)} mm.`);
    if (v < 0) add("error", `Luz ${labels[k]} jest ujemny.`);
  });
  if (doors.length >= 2 && g.between < 2)
    add("warn", "Luz między drzwiami poniżej 2 mm — mogą się blokować przy otwieraniu.");

  if (cab.frontMode === "inset" && doors.length > 0) {
    const need = carcassDepth - (tf + 5);
    if (shelfDepth > need)
      add("warn", `Półka jest głębsza niż ${fmt(need)} mm — drzwi wpuszczane się nie domkną.`);
  }

  /* --- formatki --- */
  const geoCuts = [];
  const geoObs = [];
  const panels = [];
  const sameBoard = cab.frontSameAsBoard !== false;
  const sameShelf = cab.shelfSameAsBoard !== false;
  const P = (o) => {
    let key = o.matKey;
    if (sameBoard && key === "front") key = "board";
    if (sameShelf && key === "shelf") key = "board";
    panels.push(key === o.matKey ? o : { ...o, matKey: key });
  };

  // bok: przod zawsze, gora i dol tylko gdy bok tam wychodzi na wierzch
  const noteOf = (e, kind) => {
    const [n1, n2] =
      kind === "side" ? ["górna", "dolna"] : ["lewy koniec", "prawy koniec"];
    const parts = ["krawędź przednia"];
    if (e.b1) parts.push(n1);
    if (e.b2) parts.push(n2);
    return parts.length > 1 ? parts.join(" + ") : parts[0];
  };
  // --- skrocenia bokow i plecow przez narozniki (wyciecie + element na pelna wysokosc) ---
  // zbieramy ile uciac z glebokosci lewego/prawego boku i ile z szerokosci plecow
  const cornerCut = { sideLeftDepth: 0, sideRightDepth: 0, backLeftX: null, backRightX: null };
  // edgeX = krawedz otworu/bryly od strony wnetrza; plecy maja siegac az tam (przykrywajac scianke)
  const registerCorner = (onLeftSide, onBackWall, d, fullH, edgeX) => {
    if (!fullH || !onBackWall) return;
    if (onLeftSide) {
      cornerCut.sideLeftDepth = Math.max(cornerCut.sideLeftDepth, d);
      cornerCut.backLeftX = Math.max(cornerCut.backLeftX ?? 0, edgeX);
    } else {
      cornerCut.sideRightDepth = Math.max(cornerCut.sideRightDepth, d);
      cornerCut.backRightX = Math.min(cornerCut.backRightX ?? W, edgeX);
    }
  };
  {
    [[cab.cutout, true], [cab.cutoutR, false]].forEach(([cu, onL]) => {
      if (!cu?.on) return;
      const cwv = Math.round(cu.w || 0);
      registerCorner(onL, true, Math.round(cu.d || 0),
        cu.fullHeight !== false || (cab.levels || []).length <= 1,
        onL ? cwv : W - cwv);
    });
    const cornerList = (Array.isArray(cab.obstacles) && cab.obstacles.length
      ? cab.obstacles
      : cab.obstacle?.on ? [cab.obstacle] : []).filter((o) => o && o.on !== false);
    cornerList.forEach((obs) => {
      const atSide = Math.round(obs.fromSide || 0) === 0;
      const atBack = Math.round(obs.fromBack || 0) === 0;
      if (atSide && atBack) {
        const ow = Math.round(obs.w || 0);
        const onL = obs.side === "left";
        registerCorner(onL, true, Math.round(obs.d || 0), obs.fullHeight !== false,
          onL ? ow : W - ow);
      }
    });
  }

  const sideLDepth = carcassDepth - cornerCut.sideLeftDepth;
  const sideRDepth = carcassDepth - cornerCut.sideRightDepth;
  const sideL = {
    name: "Bok lewy", qty: 1, a: leftLen, b: sideLDepth, matKey: "board",
    edges: { a1: true, a2: rear, b1: topL !== "over", b2: botL !== "over" },
    note: cornerCut.sideLeftDepth > 0 ? `skrócony o ${fmt(cornerCut.sideLeftDepth)} mm przy narożniku` : undefined,
  };
  const sideR = {
    name: "Bok prawy", qty: 1, a: rightLen, b: sideRDepth, matKey: "board",
    edges: { a1: true, a2: rear, b1: topR !== "over", b2: botR !== "over" },
    note: cornerCut.sideRightDepth > 0 ? `skrócony o ${fmt(cornerCut.sideRightDepth)} mm przy narożniku` : undefined,
  };
  const same = (x, y) =>
    x.a === y.a && x.b === y.b && x.edges.b1 === y.edges.b1 && x.edges.b2 === y.edges.b2;
  if (same(sideL, sideR)) P({ ...sideL, name: "Bok", qty: 2, note: sideL.note || noteOf(sideL.edges, "side") });
  else {
    P({ ...sideL, note: sideL.note || noteOf(sideL.edges, "side") });
    P({ ...sideR, note: sideR.note || noteOf(sideR.edges, "side") });
  }

  const horiz = (name, l, r, x0, x1) => ({
    name, qty: 1, a: x1 - x0, b: carcassDepth, matKey: "board",
    edges: { a1: true, a2: rear, b1: l === "over", b2: r === "over" },
  });
  const blatDepth = isBlat ? carcassDepth + blat.overFront + blat.overBack : 0;
  const wien = !hasTop
    ? null
    : isBlat
    ? {
        name: "Blat",
        qty: 1,
        a: topX1 - topX0,
        b: blatDepth,
        matKey: "board",
        // blat jest widoczny dookola, wiec czoło i oba końce zawsze oklejane,
        // tył tylko gdy wystaje poza korpus albo szafka stoi wolno
        edges: { a1: true, a2: rear || blat.overBack > 0, b1: true, b2: true },
      }
    : horiz("Wieniec", topL, topR, topX0, topX1);
  const dno = hasBot ? horiz("Dno", botL, botR, botX0, botX1) : null;
  if (wien && dno && !isBlat && same(wien, dno)) P({ ...dno, name: "Dno / wieniec", qty: 2, note: noteOf(dno.edges, "horiz") });
  else {
    if (dno) P({ ...dno, note: noteOf(dno.edges, "horiz") });
    if (wien) P({ ...wien, note: noteOf(wien.edges, "horiz") });
  }

  if (sepShelves.length)
    P({ name: "Półka przelotowa", qty: sepShelves.length, a: innerW, b: shelfDepth,
        matKey: "board", edges: { a1: true, a2: rear, b1: false, b2: false },
        note: "krawędź przednia" });

  const shelfMat = sameShelf ? "board" : "shelf";
  const divSizes = new Map();
  dividers.forEach((d) => divSizes.set(d.h, (divSizes.get(d.h) || 0) + 1));
  divSizes.forEach((qty, h) =>
    P({ name: "Przegroda pionowa", qty, a: h, b: dividerDepth, matKey: "board",
        edges: { a1: true, a2: rear, b1: false, b2: false },
        note: "krawędź przednia" })
  );

  const shSizes = new Map();
  levels.forEach((lv) =>
    lv.cols.forEach((c) => {
      c.shelves.forEach(() => shSizes.set(c.w, (shSizes.get(c.w) || 0) + 1));
    })
  );
  shSizes.forEach((qty, w) =>
    P({ name: "Półka", qty, a: w, b: shelfDepth, matKey: shelfMat,
        edges: { a1: true, a2: rear, b1: false, b2: false },
        note: "krawędź przednia" })
  );

  const doorSizes = new Map();
  doors.forEach((d) => {
    // tylko wlasciwe drzwi — szuflady, fix i blenda maja osobne formatki
    if (d.type !== "door") return;
    const k = `${Math.round(d.h)}x${Math.round(d.w)}`;
    doorSizes.set(k, (doorSizes.get(k) || 0) + 1);
  });
  doorSizes.forEach((qty, k) => {
    const [dh, dw] = k.split("x").map(Number);
    P({ name: cab.frontMode === "overlay" ? "Drzwi nakładane" : "Drzwi wpuszczane",
        qty, a: dh, b: dw, matKey: "front",
        edges: { a1: true, a2: true, b1: true, b2: true },
        note: "oklejone wszystkie krawędzie" });
  });

  const fixGroups = new Map();
  fixParts.forEach((f) => {
    const k = `${Math.round(f.h)}|${Math.round(f.w)}`;
    fixGroups.set(k, (fixGroups.get(k) || 0) + 1);
  });
  fixGroups.forEach((qty, k) => {
    const [a, b] = k.split("|").map(Number);
    P({
      name: "Element stały (fix)",
      qty,
      a,
      b,
      matKey: "front",
      edges: { a1: true, a2: true, b1: true, b2: true },
      note: "oklejone wszystkie krawędzie",
    });
  });

  const blGroups = new Map();
  blendaParts.forEach((f) => {
    const k = `${Math.round(f.h)}|${Math.round(f.w)}`;
    blGroups.set(k, (blGroups.get(k) || 0) + 1);
  });
  blGroups.forEach((qty, k) => {
    const [a, b] = k.split("|").map(Number);
    P({
      name: "Blenda",
      qty,
      a,
      b,
      matKey: "front",
      edges: { a1: true, a2: true, b1: true, b2: true },
      note: "oklejone wszystkie krawędzie",
    });
  });

  const supGroups = new Map();
  supportParts.forEach((f) => {
    const k = `${Math.round(f.h)}|${Math.round(f.d)}`;
    supGroups.set(k, (supGroups.get(k) || 0) + 1);
  });
  supGroups.forEach((qty, k) => {
    const [a, b] = k.split("|").map(Number);
    P({
      name: "Wspornik pionowy",
      qty,
      a,
      b,
      matKey: "board",
      edges: { a1: false, a2: true, b1: false, b2: false },
      note: "krawędź tylna — przednia chowa się za elementem stałym",
    });
  });

  const dpGroups = new Map();
  drawerParts.forEach((d) => {
    const k = `${d.kind}|${Math.round(d.a)}|${Math.round(d.b)}`;
    dpGroups.set(k, (dpGroups.get(k) || 0) + 1);
  });
  dpGroups.forEach((qty, k) => {
    const [kind, a, b] = k.split("|");
    const meta = {
      front: {
        name: "Front szuflady",
        matKey: "front",
        edges: { a1: true, a2: true, b1: true, b2: true },
        note: "oklejone wszystkie krawędzie",
      },
      dno: {
        name: "Dno szuflady",
        matKey: "board",
        edges: { a1: false, a2: false, b1: false, b2: false },
        note: "bez obrzeża",
      },
      tyl: {
        name: "Tył szuflady",
        matKey: "board",
        edges: { a1: true, a2: false, b1: false, b2: false },
        note: "oklejona krawędź górna",
      },
    }[kind];
    P({ ...meta, qty, a: Number(a), b: Number(b) });
  });

  if (cab.plinth.on) {
    if (plinthH < 50)
      add("warn", `Cokół ma ${fmt(plinthH)} mm — poniżej rozsądnego minimum 50 mm.`);
    P({ name: "Cokół", qty: 1, a: plinthInBody ? innerW : W, b: plinthH, matKey: "board",
        edges: plinthInBody
          ? { a1: false, a2: true, b1: false, b2: false }
          : { a1: false, a2: true, b1: true, b2: true },
        note: plinthInBody ? "krawędź dolna" : "krawędź dolna oraz oba końce" });
  }

  if (cab.topFiller?.on && cab.topFiller.height > 0) {
    P({ name: "Blenda nad szafką", qty: 1, a: W, b: Math.round(cab.topFiller.height), matKey: "board",
        edges: { a1: true, a2: false, b1: true, b2: true },
        note: "maskownica nad szafką — krawędź górna i oba końce oklejane" });
  }

  // formatki dopisane recznie — traktowane jak kazda inna, wiec licza sie
  // do obrzeza, powierzchni, rozkroju i zestawienia
  (cab.extraParts || []).forEach((e, i) => {
    const ea = Math.round(num(e.a) ?? 0);
    const eb = Math.round(num(e.b) ?? 0);
    const eq = Math.max(0, Math.round(num(e.qty) ?? 0));
    if (!eq) return;
    const where = `Dodatkowa formatka ${i + 1}`;
    if (ea <= 0 || eb <= 0) {
      add("error", `${where}: brakuje wymiarów.`);
      return;
    }
    P({
      name: (e.name || "").trim() || `Dodatkowa formatka ${i + 1}`,
      qty: eq,
      a: ea,
      b: eb,
      matKey: e.matKey === "front" || e.matKey === "shelf" || e.matKey === "back" ? e.matKey : "board",
      edges: {
        a1: !!(e.edges || {}).a1, a2: !!(e.edges || {}).a2,
        b1: !!(e.edges || {}).b1, b2: !!(e.edges || {}).b2,
      },
      note: "formatka dopisana ręcznie",
    });
  });

  // formatki wzmocnien (per kolumna, wiele)
  levels.forEach((lv) => lv.cols.forEach((c) => (c.rails || []).forEach((r) => {
    if (!(r.a > 0 && r.b > 0)) return;
    const name = r.orient === "front" ? "Wzmocnienie czołowe"
      : r.orient === "shelf" ? "Wzmocnienie poziome" : "Wzmocnienie pionowe";
    P({ name, qty: 1, a: Math.round(r.a), b: Math.round(r.b), matKey: "board",
        edges: { a1: r.orient === "front", a2: false, b1: false, b2: false },
        note: r.orient === "front" ? undefined : "element niewidoczny — bez oklejania" });
  })));

  const backOverride = levels.some((lv) =>
    (rawLevels[lv.i].cols || []).some((c) => c.backMode && c.backMode !== "inherit")
  );

  if (backOverride) {
    if (grooved)
      add(
        "warn",
        "Plecy dzielone na kolumny są przybijane od tyłu — frez obowiązuje tylko przy jednym pełnym arkuszu."
      );
    const hh = Math.round(t / 2);
    levels.forEach((lv) => {
      const rc = rawLevels[lv.i].cols || [];
      lv.cols.forEach((c, j) => {
        const mode = rc[j]?.backMode && rc[j].backMode !== "inherit" ? rc[j].backMode : cab.back;
        if (mode === "none") return;
        const x0 = j === 0 ? 1 : c.x0 - hh;
        const x1 = j === lv.cols.length - 1 ? W - 1 : c.x1 + hh;
        const y0 = lv.i === 0 ? 1 : lv.y0 - hh;
        const y1 = lv.i === levels.length - 1 ? H - 1 : lv.y1 + hh;
        P({
          name: mode === "hdf" ? "Plecy HDF" : "Plecy z płyty",
          qty: 1,
          a: Math.round(x1 - x0),
          b: Math.round(y1 - y0),
          matKey: mode === "hdf" ? "back" : "board",
          edges: { a1: false, a2: false, b1: false, b2: false },
          note: `poziom ${lv.i + 1}, kolumna ${j + 1} — przybijane`,
        });
      });
    });
  } else if (cab.back === "hdf" && grooved) {
    const grab = grDep - grPlay; // ile plecow wchodzi w kazdy frez
    const gx0 = Math.max(interior.x0 - grab, cornerCut.backLeftX ?? (interior.x0 - grab));
    const gx1 = Math.min(interior.x1 + grab, cornerCut.backRightX ?? (interior.x1 + grab));
    P({ name: "Plecy HDF we frezie", qty: 1,
        a: gx1 - gx0, b: innerH + 2 * grab, matKey: "back",
        edges: { a1: false, a2: false, b1: false, b2: false },
        note: `wchodzi ${fmt(grab)} mm w każdy frez (${grDep} mm frezu minus ${grPlay} mm luzu)` });
  } else if (cab.back === "hdf") {
    const x0 = (cornerCut.backLeftX ?? 0) + 1;
    const x1 = (cornerCut.backRightX ?? W) - 1;
    const cutInfo = (cornerCut.backLeftX || cornerCut.backRightX) ? ", docięte przy narożniku" : "";
    P({ name: "Plecy HDF", qty: 1, a: x1 - x0, b: H - 2, matKey: "back",
        edges: { a1: false, a2: false, b1: false, b2: false },
        note: "luz 1 mm z każdej strony" + cutInfo });
  }
  else if (cab.back === "board") {
    const backMat = cab.backPos === "outside"
      ? (cab.backBoardMat === "shelf" ? shelfMat : "board")
      : shelfMat; // wewnatrz zawsze z plyty polek (jak ustalono)
    const cutInfo = (cornerCut.backLeftX || cornerCut.backRightX) ? " (docięte przy narożniku)" : "";
    if (backPos === "outside") {
      const x0 = cornerCut.backLeftX ?? 0;
      const x1 = cornerCut.backRightX ?? W;
      P({ name: "Plecy z płyty (na zewnątrz)", qty: 1, a: x1 - x0, b: H, matKey: backMat,
          edges: { a1: false, a2: false, b1: false, b2: false }, note: "na całą tylną płaszczyznę korpusu" + cutInfo });
    } else {
      const x0 = Math.max(interior.x0, cornerCut.backLeftX ?? interior.x0);
      const x1 = Math.min(interior.x1, cornerCut.backRightX ?? interior.x1);
      P({ name: "Plecy z płyty (wewnątrz)", qty: 1, a: x1 - x0, b: innerH, matKey: backMat,
          edges: { a1: false, a2: false, b1: false, b2: false }, note: "między bokami, wieńcem i dnem" + cutInfo });
    }
  }

  panels.forEach((p) => {
    p.a = Math.round(p.a);
    p.b = Math.round(p.b);
    const o = (cab.edgeOverrides || {})[p.name];
    if (o) {
      p.edges = { ...p.edges, ...o };
      p.note = "oklejanie ustawione ręcznie";
    }
    if (p.a <= 0 || p.b <= 0)
      add("error", `Formatka „${p.name}" ma wymiar zero lub ujemny.`);
  });

  /* --- wspolna zabudowa L/U obszaru [bx0..bx1] x [bz0..bz1] na wysokosci [by0..by1] --- */
  // zwraca liczbe scianek dodanych + ostrzezenia; sciana czolowa "over" przed bokami, "between" miedzy
  function buildEnclosure(name, bx0, bx1, bz0, bz1, by0, by1, opts) {
    // swiatlo ponizej progu traktujemy jak dotkniecie sciany — nie ma sensu stawiac tam scianki
    const near = opts.nearSide ?? 50;
    const bndL = opts.boundL ?? interior.x0;
    const bndR = opts.boundR ?? interior.x1;
    const touchLeft = opts.touchLeft ?? bx0 - bndL < near;
    const touchRight = opts.touchRight ?? bndR - bx1 < near;
    const touchBack = bz0 <= 1;
    const touchFront = bz1 >= carcassDepth - 1;
    const bh = by1 - by0;
    const wIn = bx1 - bx0;   // szerokosc obszaru
    const dIn = bz1 - bz0;   // glebokosc obszaru
    // auto: L gdy obszar dotyka boku LUB tyłu (naroznik/przy scianie), U gdy stoi wolno / tylko przy jednej scianie w glab
    const sidesTouch = (touchLeft ? 1 : 0) + (touchRight ? 1 : 0);
    let type = opts.maskType;
    if (type === "auto" || !type) {
      // przy boku (L wystarczy jesli dotyka tez tylu/przodu); w innym razie U
      if ((touchLeft || touchRight) && (touchBack || touchFront)) type = "L";
      else type = "U";
    }
    const front = opts.maskFront === "between" ? "between" : "over";
    const smat = shelfMat;
    let count = 0;
    const addWall = (label, a, b) => {
      P({ name: `${name} — ${label}`, qty: 1, a: bh, b, matKey: smat,
          edges: { a1: true, a2: false, b1: false, b2: false },
          note: "krawędź od strony wnętrza szafki" });
      count += 1;
    };

    if (type === "L") {
      // czolo dochodzi do lica boku, wiec na dalszym koncu odejmujemy jego grubosc
      const farCut = opts.farSideThickness || 0;
      // uklad A: boczna widoczna (dluzsza o t), czolo dobija do niej
      const vA = dIn + t, hA = wIn - farCut;
      // uklad B: czolo widoczne (siega za bok pionowej), boczna dobija
      const vB = dIn, hB = wIn - farCut + t;
      let visible = opts.maskCorner;
      if (visible !== "vertical" && visible !== "horizontal") {
        // auto: wybieramy uklad dajacy rowne (albo najblizsze) plyty
        visible = Math.abs(vB - hB) <= Math.abs(vA - hA) ? "horizontal" : "vertical";
      }
      if (visible === "vertical") {
        addWall("ścianka boczna (wzdłuż głębokości, widoczna)", bh, vA);
        addWall("ścianka czołowa (wzdłuż szerokości)", bh, hA);
      } else {
        addWall("ścianka boczna (wzdłuż głębokości)", bh, vB);
        addWall("ścianka czołowa (wzdłuż szerokości, widoczna)", bh, hB);
      }
      return { count, type, touchBack, touchFront, touchLeft, touchRight, visible };
    } else {
      // U: dwie boczne wzdluz glebokosci + czolowa laczaca od strony wnetrza
      const sideLen = front === "between" ? dIn + t : dIn;
      addWall("ścianka boczna lewa", bh, sideLen);
      addWall("ścianka boczna prawa", bh, sideLen);
      addWall(front === "between" ? "czoło (między bokami)" : "czoło (przed bokami)", bh, front === "between" ? wIn : wIn + 2 * t);
    }
    return { count, type, touchBack, touchFront, touchLeft, touchRight };
  }

  /* --- wyciecia w narozniku + maskownica L (lewy i prawy tylny) --- */
  const processCutout = (cut, onLeft) => {
    if (!cut?.on) return;
    const side = onLeft ? "lewy" : "prawy";
    const onBack = true; // narozniki zawsze tylne
    const cw = Math.max(0, Math.round(cut.w || 0)); // szerokosc wciecia od boku
    const cdp = Math.max(0, Math.round(cut.d || 0)); // glebokosc wciecia od tylu
    if (cw <= 0 || cdp <= 0) add("error", `Wycięcie w narożniku (${side}) ma zerowy wymiar.`);
    if (cw >= W) add("error", `Wycięcie w narożniku (${side}) szersze niż szafka.`);
    else if (cw <= t)
      add("warn", `Wycięcie ${fmt(cw)} mm (${side}) nie wychodzi poza grubość boku — sprawdź, czy to celowe.`);
    if (cdp >= carcassDepth) add("error", `Wycięcie w narożniku (${side}) głębsze niż korpus.`);

    // pionowy zakres: cala szafka albo jeden poziom
    const li = Math.min(Math.max(0, Math.round(cut.levelIndex || 0)), levels.length - 1);
    const zFull = cut.fullHeight !== false || levels.length <= 1;
    const cy0 = zFull ? interior.y0 : levels[li].y0;
    const cy1 = zFull ? interior.y1 : levels[li].y1;
    const cutH = cy1 - cy0;

    // obszar wneki: wspolrzedne x i z (glebokosc od tyłu)
    // szerokosc i glebokosc wyciecia mierzone od ZEWNETRZNEJ krawedzi szafki
    const bx0 = onLeft ? 0 : W - cw;
    const bx1 = onLeft ? cw : W;
    const bz0 = onBack ? 0 : carcassDepth - cdp;
    const bz1 = onBack ? cdp : carcassDepth;

    const geoCut = { cw, cdp, onLeft, onBack, cy0, cy1, cutH, bx0, bx1, bz0, bz1, zFull, li, maskType: cut.maskType, mask: cut.mask !== false, side };

    // detekcja kolizji: polki, przegrody, szuflady wchodzace we wneke
    const inRangeY = (y0, y1) => Math.min(y1, cy1) - Math.max(y0, cy0) > 0;
    const maskX = onLeft ? bx1 : bx0;
    levels.forEach((lv) => {
      if (!zFull && lv.i !== li) return;
      lv.cols.forEach((c) => {
        const colHitsX = onLeft ? c.x0 < maskX : c.x1 > maskX;
        if (!colHitsX) return;
        c.shelves.forEach((sh) => {
          if (inRangeY(sh.y, sh.y + t))
            add("warn", `Poziom ${lv.i + 1}: półka na wysokości ${fmt(sh.y)} mm wchodzi w wycięcie narożnika — przytnij ją na miejscu.`);
        });
        if (c.drawers && c.drawers.length) {
          // wneka od tyłu zabiera glebokosc; szuflada nie miesci sie, gdy jej NL siega wneki
          const maskT = cut.mask !== false ? t : 0; // zabudowa zabiera dodatkowa plyte
          const freeDepth = onBack ? carcassDepth - cdp - maskT : carcassDepth;
          c.drawers.forEach((dr) => {
            const drNl = dr.nl || 0;
            const gap = Math.round(freeDepth - drNl); // luz miedzy tylem szuflady a zabudowa
            if (gap >= 4) return; // w porzadku
            const maxNlFit = [600, 550, 500, 450, 400, 350, 300, 270, 250]
              .find((v) => v + 4 <= freeDepth);
            const act = maxNlFit ? `|fixnl:${lv.i}:${c.j}:${dr.i}:${maxNlFit}` : "";
            const gdzie = `Poziom ${lv.i + 1}, kolumna ${c.j + 1}, szuflada ${dr.i + 1}`;
            if (gap < 0) {
              const advice = maxNlFit
                ? `zejdź z prowadnicą do NL ${maxNlFit}`
                : `przed wycięciem zostaje ${fmt(freeDepth)} mm, a najkrótsza szuflada potrzebuje 254 mm — zabuduj tę kolumnę lub zmniejsz wycięcie`;
              add("error", `${gdzie}: NL ${drNl} nie mieści się przy wycięciu — ${advice}.${act}`);
            } else if (gap === 0) {
              add("error", `${gdzie}: szuflada styka się z zabudową wycięcia — brak luzu, potrzeba minimum 4 mm.${act}`);
            } else {
              add("warn", `${gdzie}: tylko ${fmt(gap)} mm luzu do zabudowy wycięcia — zalecane minimum 4 mm.${act}`);
            }
          });
        }
      });
    });

    // zabudowa
    if (cut.mask !== false) {
      const r = buildEnclosure(`Zabudowa wycięcia (${side})`, bx0, bx1, bz0, bz1, cy0, cy1,
        { maskType: "L", maskFront: cut.maskFront, maskCorner: cut.maskCorner, farSideThickness: t });
      geoCut.maskChosen = r.type;
      geoCut.maskVisible = r.visible;
    } else {
      add("warn", `Wycięcie narożnika (${side}) nie ma zabudowy — otwór zostanie odsłonięty. Włącz maskownicę, jeśli ma być zakryty.`);
    }
    geoCuts.push(geoCut);
  };
  processCutout(cab.cutout, true);
  processCutout(cab.cutoutR, false);

  /* --- swobodny element kolizyjny (bryla) --- */
  // lista elementow kolizyjnych (wstecznie: pojedynczy cab.obstacle)
  const obsList = (Array.isArray(cab.obstacles) && cab.obstacles.length
    ? cab.obstacles
    : cab.obstacle?.on ? [cab.obstacle] : []).filter((o) => o && o.on !== false);
  obsList.forEach((ob, obIdx) => {
    const obName = obsList.length > 1 ? `Element ${obIdx + 1}` : "Element kolizyjny";
    const ow = Math.max(0, Math.round(ob.w || 0));
    const od = Math.max(0, Math.round(ob.d || 0));
    const fromSide = Math.round(ob.fromSide ?? ob.fromRight ?? 0); // odsuniecie od wybranego boku
    const fromB = Math.round(ob.fromBack || 0);  // odsuniecie od tylu
    const fromLeft = ob.side === "left";
    // pozycja mierzona od ZEWNETRZNEJ krawedzi szafki — tak samo jak wyciecie narożnika
    let ox0, ox1;
    if (fromLeft) {
      ox0 = fromSide;
      ox1 = ox0 + ow;
    } else {
      ox1 = W - fromSide;
      ox0 = ox1 - ow;
    }
    // odleglosci do zewnetrznych krawedzi szafki
    const distLeft = Math.round(ox0);
    const distRight = Math.round(W - ox1);
    const oz0 = fromB;
    const oz1 = fromB + od;
    const oFull = ob.fullHeight !== false;
    const oy0 = oFull ? interior.y0 : Math.round(ob.fromBottom || 0) + interior.y0;
    const oy1 = oFull ? interior.y1 : oy0 + Math.max(0, Math.round(ob.h || 0));

    if (ow <= 0 || od <= 0) add("error", `${obName} ma zerowy wymiar.`);
    // kontrola: czy bryla miesci sie w obrysie szafki
    if (ox0 < 0)
      add("warn", `${obName} wystaje poza lewą krawędź szafki o ${fmt(-ox0)} mm.`);
    if (ox1 > W)
      add("warn", `${obName} wystaje poza prawą krawędź szafki o ${fmt(ox1 - W)} mm.`);
    // bryla siegajaca w plyte boku wymaga jej przyciecia — informujemy
    if (ox0 < interior.x0 && ox0 >= 0)
      add("info", "Element sięga w płytę lewego boku — bok zostanie skrócony jak przy wycięciu narożnika.");
    if (ox1 > interior.x1 && ox1 <= W)
      add("info", "Element sięga w płytę prawego boku — bok zostanie skrócony jak przy wycięciu narożnika.");
    if (oz1 > carcassDepth)
      add("warn", `${obName} wystaje przed lico korpusu o ${fmt(oz1 - carcassDepth)} mm.`);
    if (!oFull && oy1 > interior.y1)
      add("warn", `${obName} wystaje ponad wnętrze szafki.`);

    // najblizsze ograniczenie z lewej i prawej: przegroda albo bok korpusu
    const boundL = dividers
      .filter((dv) => dv.x + t <= ox0 + 1)
      .reduce((a, dv) => Math.max(a, dv.x + t), interior.x0);
    const boundR = dividers
      .filter((dv) => dv.x >= ox1 - 1)
      .reduce((a, dv) => Math.min(a, dv.x), interior.x1);

    const geoOb = { ox0, ox1, oz0, oz1, oy0, oy1, ow, od, oFull, distLeft, distRight,
      touchLeft: ox0 - boundL < 50, touchRight: boundR - ox1 < 50, boundL, boundR,
      touchBack: oz0 <= 1, touchFront: oz1 >= carcassDepth - 1,
      mask: !!ob.mask, maskFront: ob.maskFront, name: obName, maskTop: null, shelfAbove: null };

    // kolizja z polkami i przegrodami
    const hitY = (y0, y1) => Math.min(y1, oy1) - Math.max(y0, oy0) > 0;
    const hitX = (x0, x1) => Math.min(x1, ox1) - Math.max(x0, ox0) > 0;
    levels.forEach((lv) => {
      lv.cols.forEach((c) => {
        if (!hitX(c.x0, c.x1)) return;
        c.shelves.forEach((sh) => {
          // polka koliduje, jesli bryla siega jej glebokosci od tylu
          if (hitY(sh.y, sh.y + t) && oz0 < backIntrusion + shelfDepth)
            add("warn", `Poziom ${lv.i + 1}: półka na ${fmt(sh.y)} mm koliduje z elementem — przytnij ją lub skróć.`);
        });
        // kolizja z szufladami: sprawdz czy bryla wchodzi w strefe prowadnicy
        if (c.drawers && c.drawers.length) {
          c.drawers.forEach((dr) => {
            const drNl = dr.nl || 0;
            if (!hitY(dr.y, dr.y + dr.h)) return;
            const freeDepth = carcassDepth - oz1 - (ob.mask ? t : 0);
            const gap = Math.round(freeDepth - drNl);
            if (gap >= 4) return;
            const maxNlFit = [600, 550, 500, 450, 400, 350, 300, 270, 250]
              .find((v) => v + 4 <= freeDepth);
            const act = maxNlFit ? `|fixnl:${lv.i}:${c.j}:${dr.i}:${maxNlFit}` : "";
            const gdzie = `Poziom ${lv.i + 1}, kolumna ${c.j + 1}, szuflada ${dr.i + 1}`;
            const co = ob.mask ? "zabudowy elementu" : "elementu";
            if (gap < 0) {
              const advice = maxNlFit
                ? `zejdź z prowadnicą do NL ${maxNlFit}`
                : `przed elementem zostaje ${fmt(freeDepth)} mm — najkrótsza szuflada się nie zmieści, przesuń bryłę`;
              add("error", `${gdzie}: NL ${drNl} sięga ${co} — ${advice}.${act}`);
            } else if (gap === 0) {
              add("error", `${gdzie}: szuflada styka się z ${co} — brak luzu, potrzeba minimum 4 mm.${act}`);
            } else {
              add("warn", `${gdzie}: tylko ${fmt(gap)} mm luzu do ${co} — zalecane minimum 4 mm.${act}`);
            }
          });
        }
      });
    });

    // polka nad elementem — zabudowa moze konczyc sie na niej
    let shelfAbove = null;
    levels.forEach((lv) => {
      lv.cols.forEach((c) => {
        if (Math.min(c.x1, ox1) - Math.max(c.x0, ox0) <= 0) return;
        (c.shelves || []).forEach((sh) => {
          if (sh.y >= oy1 - 1 && (shelfAbove === null || sh.y < shelfAbove)) shelfAbove = sh.y;
        });
      });
    });
    if (shelfAbove !== null && ob.mask && !ob.maskToShelf)
      add("info", `${obName}: nad elementem jest półka na ${fmt(shelfAbove)} mm — zabudowa może kończyć się na niej zamiast biec przez całą wysokość.`);
    // wysokosc zabudowy: do polki, wlasna albo do gory elementu
    const maskTop = ob.mask && ob.maskToShelf && shelfAbove !== null
      ? (num(ob.maskH) !== null ? oy0 + Math.round(ob.maskH) : shelfAbove)
      : oy1;

    // zabudowa bryly
    if (ob.mask) {
      const r = buildEnclosure(`Zabudowa: ${obName}`, ox0, ox1, oz0, oz1, oy0, maskTop,
        { maskType: ob.maskType || "auto", maskFront: ob.maskFront, maskCorner: ob.maskCorner,
          boundL, boundR, touchLeft: geoOb.touchLeft, touchRight: geoOb.touchRight,
          farSideThickness: (ox0 <= interior.x0 + 1 || ox1 >= interior.x1 - 1) ? t : 0 });
      geoOb.maskChosen = r.type;
      geoOb.maskVisible = r.visible;
      geoOb.maskTop = maskTop;
    } else if (ow > 0 && od > 0) {
      add("warn", `${obName} nie ma zabudowy — nie jest zakryty ani odgrodzony od wnętrza. Włącz zabudowę, jeśli ma być schowany.`);
    }
    geoOb.shelfAbove = shelfAbove;
    geoObs.push(geoOb);
  });
  const geoOb = geoObs[0] || null;

  /* --- produkty do zamowienia --- */
  const hardware = [];
  slideGroups.forEach((qty, k) => {
    const [h, nl] = k.split("|");
    hardware.push({
      name: `Prowadnica Sevroll V-BOX 3D Slim ${h} mm`,
      spec: `NL ${nl} mm`,
      qty,
      unit: "kpl.",
    });
  });
  const miGroups = new Map();
  mirrorParts.forEach((f) => {
    const k = `${Math.round(f.a)}|${Math.round(f.b)}`;
    miGroups.set(k, (miGroups.get(k) || 0) + 1);
  });
  miGroups.forEach((qty, k) => {
    const [a2, b2] = k.split("|").map(Number);
    hardware.push({
      name: "Lustro na drzwiach",
      spec: `${fmt(b2)} × ${fmt(a2)} mm — luz 0,5 mm na każdą stronę drzwi`,
      qty,
      unit: "szt.",
    });
  });

  if (handleCount)
    hardware.push({
      name: cab.handleName || "Uchwyt",
      spec: "na fronty z zaznaczonym uchwytem",
      qty: handleCount,
      unit: "szt.",
    });
  if (hingeCount)
    hardware.push({
      name: "Zawias",
      spec:
        (cab.frontMode === "overlay" ? "nakładany" : "wpuszczany") +
        ", 2 szt. na skrzydło poza szerokimi i wysokimi",
      qty: hingeCount,
      unit: "szt.",
    });
  if (cab.legs && cab.legs.on)
    hardware.push({
      name: "Nóżka regulowana",
      spec: `wysokość ${fmt(cab.legs.height || 100)} mm`,
      qty: 4,
      unit: "szt.",
    });

  return {
    hardware,
    t, tf, tb, carcassDepth, hasBack, interior, innerW, innerH,
    shelfDepth, dividerDepth, backIntrusion, frontCut, levels, sepShelves, dividers, doors, panels, msgs, maxNL,
    plinthInBody, plinthH, bottomY, pMode, grooved, grOff, grDep, grPlay, geoCuts, geoOb, geoObs,
    backPos, backIsBoard, cornerCut,
    topL, topR, botL, botR, hasTop, hasBot, leftLen, rightLen, leftY0, rightY0,
    isBlat, blat, blatDepth,
    topX0, topX1, botX0, botX1, divOv,
  };
}

/* ---------- rysunki ---------- */

const DimH = ({ x1, x2, y, label, c = DIMC, above = true }) => (
  <g>
    <line x1={x1} y1={y} x2={x2} y2={y} stroke={c} strokeWidth="1.5" />
    <line x1={x1} y1={y - 8} x2={x1} y2={y + 8} stroke={c} strokeWidth="1.5" />
    <line x1={x2} y1={y - 8} x2={x2} y2={y + 8} stroke={c} strokeWidth="1.5" />
    <text x={(x1 + x2) / 2} y={above ? y - 8 : y + 22} textAnchor="middle"
      fontSize="22" fill={c} fontFamily="ui-monospace, monospace">{label}</text>
  </g>
);

const DimV = ({ y1, y2, x, label, c = DIMC, left = true }) => (
  <g>
    <line x1={x} y1={y1} x2={x} y2={y2} stroke={c} strokeWidth="1.5" />
    <line x1={x - 8} y1={y1} x2={x + 8} y2={y1} stroke={c} strokeWidth="1.5" />
    <line x1={x - 8} y1={y2} x2={x + 8} y2={y2} stroke={c} strokeWidth="1.5" />
    <text x={left ? x - 8 : x + 8} y={(y1 + y2) / 2 + 7}
      textAnchor={left ? "end" : "start"} fontSize="22" fill={c}
      fontFamily="ui-monospace, monospace">{label}</text>
  </g>
);

function FrontView({ cab, geo, mat, open, showDims, showGaps, showLabels, showHardware }) {
  // tryb wizualizacji: gdy fronty z tej samej plyty, pokaz realny kolor korpusu
  const frontColor = cab.realColors && cab.frontSameAsBoard !== false
    ? mat.board.color : mat.front.color;
  const { W, H } = cab;
  const pad = 160;
  const t = geo.t;
  const belowExtra = Math.max(cab.legs?.on ? cab.legs.height || 100 : 0, geo.plinthH || 0) + 60;
  const hasBase = cab.legs?.on || cab.plinth.on;
  // wymiary rysowane tuz przy szafce (boki, cokol, nozki) wymuszaja odsuniecie
  // wymiarow wysokosci dalej w lewo, zeby etykiety sie nie nakladaly
  const showSideLengthDims = showDims && (geo.leftLen !== H || geo.rightLen !== H);
  const hasBaseDim = !!cab.legs?.on || (cab.plinth.on && !geo.plinthInBody);
  const hasDoorDims = showDims && !open && (geo.doors || []).some((d) => d.type === "door");
  // wysokosc montazu prowadnic: kolumna przy boku -> wymiar poza szafka,
  // kolumna miedzy przegrodami -> w swietle obok prowadnicy
  const railDimCols = [];
  if (open && showDims && showHardware)
    geo.levels.forEach((lv) =>
      lv.cols.forEach((c, j) => {
        if (c.kind !== "drawers" || !(c.drawers || []).length) return;
        railDimCols.push({
          c,
          where: j === 0 ? "left" : j === lv.cols.length - 1 ? "right" : "in",
        });
      })
    );
  const hasRailL = railDimCols.some((r) => r.where === "left");
  const hasRailR = railDimCols.some((r) => r.where === "right");
  const wideDims = showSideLengthDims || hasBaseDim || hasDoorDims || hasRailL;
  const leftExtra = wideDims ? 300 : 0;
  const rightExtraF = Math.max(hasBase ? 60 : 0, showSideLengthDims ? 160 : 0, hasRailR ? 150 : 0);
  // pozycje X wymiarow
  const dimHMainX = wideDims ? -290 : -50;
  const dimHTotalX = wideDims ? -370 : -115;
  const railExtra = hasRailR ? 130 : 0;
  const dimLevelX = W + (showSideLengthDims ? 170 : 60) + railExtra;
  const dimDrawerX = W + (showSideLengthDims ? 230 : 120) + railExtra;
  const dimDoorX = showSideLengthDims ? -160 : -26; // wymiary wys. drzwi po lewej
  // cokol pod lewym wymiarem boku, nozki pod prawym — tuz przy szafce
  const dimCokolX = -26;
  const dimNozkiX = W + 26;
  const blOvL = geo.isBlat ? geo.blat.overL : 0;
  const blOvR = geo.isBlat ? geo.blat.overR : 0;
  const vb = `${-pad - leftExtra - blOvL} ${-pad} ${W + blOvL + blOvR + 2 * pad + leftExtra + rightExtraF} ${H + pad + belowExtra + 60}`;
  const fy = (y) => H - y;
  const bf = mat.board.color;
  const ff = frontColor;
  const topY = 0;
  const bottomY = fy(geo.bottomY + t);
  // wymiary wewnetrzne rysujemy w swietle kolumny, omijajac element staly
  const dimColX = (c) =>
    (c.fix && c.fix.side === "left" ? Math.max(c.x0, c.fix.x + c.fix.w) : c.x0) + 46;
  const leftTopY = fy(geo.leftY0 + geo.leftLen);
  const leftBottomY = fy(geo.leftY0);
  const rightTopY = fy(geo.rightY0 + geo.rightLen);
  const rightBottomY = fy(geo.rightY0);
  const sidePanel = (key, x, y, h, topCap, bottomCap) => (
    <g key={key}>
      <rect x={x} y={y} width={t} height={h} fill={bf} />
      <line x1={x} y1={y} x2={x} y2={y + h} stroke={INK} strokeWidth="2" />
      <line x1={x + t} y1={y} x2={x + t} y2={y + h} stroke={INK} strokeWidth="2" />
      {topCap && <line x1={x} y1={y} x2={x + t} y2={y} stroke={INK} strokeWidth="2" />}
      {bottomCap && <line x1={x} y1={y + h} x2={x + t} y2={y + h} stroke={INK} strokeWidth="2" />}
    </g>
  );
  const carcassFrame = (key) => (
    <g key={key}>
      {sidePanel("left-side", 0, leftTopY, geo.leftLen, geo.topL === "between", geo.botL === "between")}
      {sidePanel("right-side", W - t, rightTopY, geo.rightLen, geo.topR === "between", geo.botR === "between")}
      {geo.hasTop && (
        <rect x={geo.topX0} y={topY} width={geo.topX1 - geo.topX0} height={t}
          fill={bf} stroke={INK} strokeWidth="2" strokeLinejoin="miter" />
      )}
      {geo.hasBot && (
        <rect x={geo.botX0} y={bottomY} width={geo.botX1 - geo.botX0} height={t}
          fill={bf} stroke={INK} strokeWidth="2" strokeLinejoin="miter" />
      )}
    </g>
  );

  return (
    <svg viewBox={vb} className="w-full h-auto" style={{ maxHeight: 540 }}>
      <rect x="0" y="0" width={W} height={H} fill="#fafaf9" stroke="#e7e5e4" strokeWidth="1" />

      {/* boki, wieniec, dno */}
      {carcassFrame("carcass-frame")}

      {geo.plinthInBody && (
        <rect x={geo.interior.x0} y={fy(geo.plinthH)} width={geo.innerW} height={geo.plinthH}
          fill={bf} stroke={INK} strokeWidth="2" />
      )}
      {cab.plinth.on && !geo.plinthInBody && (
        <rect x="0" y={H} width={W} height={geo.plinthH} fill={bf} stroke={INK} strokeWidth="2" opacity="0.75" />
      )}
      {cab.topFiller?.on && cab.topFiller.height > 0 && (
        <rect x="0" y={-cab.topFiller.height} width={W} height={cab.topFiller.height}
          fill={bf} stroke={INK} strokeWidth="2" opacity="0.75" />
      )}
      {cab.legs?.on && (
        <>
          <rect x={40} y={H} width={40} height={cab.legs.height || 100}
            fill="#3f3f46" stroke={INK} strokeWidth="2" />
          <rect x={W - 80} y={H} width={40} height={cab.legs.height || 100}
            fill="#3f3f46" stroke={INK} strokeWidth="2" />
        </>
      )}

      {/* elementy wzmacniajace (per kolumna) — widok od czola */}
      {geo.levels.flatMap((lv) => lv.cols.flatMap((c) => (c.rails || []).map((r, ri) => (
        <rect key={`rail${lv.i}-${c.j}-${ri}`}
          x={r.x0} y={fy(r.y1)} width={r.x1 - r.x0} height={r.y1 - r.y0}
          fill={r.orient === "vertical" ? (mat.shelf?.color || bf) : bf}
          stroke={INK} strokeWidth="2" opacity={r.orient === "front" ? 0.9 : 0.7} />
      ))))}

      {/* polki przelotowe */}
      {geo.sepShelves.map((s, i) => (
        <rect key={"sep" + i} x={geo.interior.x0} y={fy(s.y + t)} width={geo.innerW} height={t}
          fill={bf} stroke={INK} strokeWidth="2" />
      ))}

      {/* przegrody */}
      {geo.dividers.map((d, i) => (
        <rect key={"div" + i} x={d.x} y={fy(d.y1)} width={t} height={d.h}
          fill={bf} stroke={INK} strokeWidth="2" />
      ))}

      {/* polki w kolumnach */}
      {geo.levels.map((lv) =>
        lv.cols.map((c) =>
          c.shelves.map((s, k) => (
            <rect key={`s${lv.i}-${c.j}-${k}`} x={c.x0} y={fy(s.y + t)} width={c.w} height={t}
              fill={bf} stroke={INK} strokeWidth="2" />
          ))
        )
      )}

      {/* wsporniki pionowe za elementem stalym */}
      {geo.levels.flatMap((lv) =>
        lv.cols
          .filter((c) => c.support && c.fix)
          .map((c) => (
            <rect key={`sup${lv.i}-${c.j}`}
              x={c.fix.side === "left" ? c.fix.x + c.fix.w - t : c.fix.x}
              y={fy(lv.y1)} width={t} height={lv.h}
              fill="none" stroke={INK} strokeWidth="1.5" strokeDasharray="8 6" />
          ))
      )}

      {/* drzwi */}
      {geo.doors.map((d) =>
        d.type === "fix" || d.type === "blenda" ? (
          <g key={d.key}>
            <rect x={d.x} y={fy(d.y + d.h)} width={d.w} height={d.h}
              fill={ff} stroke={INK} strokeWidth="2.5" />
            {d.type === "fix" && (
              <>
                <line x1={d.x} y1={fy(d.y + d.h)} x2={d.x + d.w} y2={fy(d.y)}
                  stroke={INK} strokeWidth="1.5" opacity="0.4" />
                <line x1={d.x} y1={fy(d.y)} x2={d.x + d.w} y2={fy(d.y + d.h)}
                  stroke={INK} strokeWidth="1.5" opacity="0.4" />
              </>
            )}
            {d.type === "blenda" && (
              <text x={d.x + d.w / 2} y={fy(d.y + d.h / 2) - 20} textAnchor="middle"
                fontSize="20" fill={INK} opacity="0.55" fontFamily="ui-monospace, monospace">
                blenda
              </text>
            )}
            {showDims && ((d.w > 170 && d.h > 40) || (d.w > 40 && d.h > 170)) && (
              <text
                x={d.x + d.w / 2}
                y={fy(d.y + d.h / 2) + 7}
                textAnchor="middle" fontSize="20" fill={INK} opacity="0.75"
                fontFamily="ui-monospace, monospace"
                transform={d.w <= 170
                  ? `rotate(-90 ${d.x + d.w / 2} ${fy(d.y + d.h / 2) + 7})`
                  : undefined}>
                {fmt(d.w)}×{fmt(d.h)}
              </text>
            )}
          </g>
        ) : open ? (
          <g key={d.key}>
            {d.type === "drawer" ? (
              <>
                {/* front szuflady zostaje na miejscu, tylko przygaszony */}
                <rect x={d.x} y={fy(d.y + d.h)} width={d.w} height={d.h}
                  fill={ff} fillOpacity="0.35" stroke={INK} strokeWidth="2" />
                <line x1={d.x + d.w * 0.25} x2={d.x + d.w * 0.75}
                  y1={fy(d.y + d.h - Math.min(50, d.h / 2))}
                  y2={fy(d.y + d.h - Math.min(50, d.h / 2))}
                  stroke={INK} strokeWidth="5" opacity="0.5" />
                <text x={d.x + d.w / 2} y={fy(d.y + d.h * 0.42)} textAnchor="middle"
                  fontSize="19" fill={INK} opacity="0.8" fontFamily="ui-monospace, monospace">
                  szuflada
                </text>
              </>
            ) : (
              <>
                {/* obrys skrzydla po zamknieciu */}
                <rect x={d.x} y={fy(d.y + d.h)} width={d.w} height={d.h}
                  fill="none" stroke={LINE} strokeWidth="1.5" strokeDasharray="12 9" opacity="0.6" />
                {/* symbol otwierania: wierzcholek po stronie zawiasu */}
                <path
                  d={`M ${d.hingeSide === "left" ? d.x + d.w : d.x} ${fy(d.y + d.h)}
                      L ${d.hingeSide === "left" ? d.x : d.x + d.w} ${fy(d.y + d.h / 2)}
                      L ${d.hingeSide === "left" ? d.x + d.w : d.x} ${fy(d.y)}`}
                  fill="none" stroke={INK} strokeWidth="1.8" opacity="0.5" />
                {/* skrzydlo otwarte widziane od czola */}
                <rect x={d.hingeSide === "right" ? d.x + d.w - geo.tf : d.x}
                  y={fy(d.y + d.h)} width={geo.tf} height={d.h}
                  fill={ff} stroke={INK} strokeWidth="2" />
                {/* zawiasy — puszka na boku/przegrodzie, po stronie zawiasu */}
                {showHardware && (d.hingePts || []).map((hy, hi2) => (
                  <g key={`hg${hi2}`}>
                    <rect x={d.hingeX} y={fy(hy + HINGE_H / 2)} width={HINGE_W} height={HINGE_H}
                      rx="3" fill="#71717a" stroke={INK} strokeWidth="1.5" />
                    <line x1={d.hingeX} y1={fy(hy)} x2={d.hingeX + HINGE_W} y2={fy(hy)}
                      stroke="#fafaf9" strokeWidth="1.5" opacity="0.8" />
                    {showDims && d.iInGroup === 0 && (
                      <text
                        x={d.hingeSide === "left" ? d.hingeX + HINGE_W + 8 : d.hingeX - 8}
                        textAnchor={d.hingeSide === "left" ? "start" : "end"}
                        y={fy(hy) + 6} fontSize="17"
                        fill={DIMC} fontFamily="ui-monospace, monospace">
                        {fmt(hy - d.y)}
                      </text>
                    )}
                  </g>
                ))}
              </>
            )}
          </g>
        ) : (
          <g key={d.key}>
            <rect x={d.x} y={fy(d.y + d.h)} width={d.w} height={d.h}
              fill={ff} stroke={INK} strokeWidth="2.5" />
            {d.type === "drawer" && !d.handle && (
              <line x1={d.x + d.w * 0.3} x2={d.x + d.w * 0.7}
                y1={fy(d.y + d.h * 0.78)} y2={fy(d.y + d.h * 0.78)}
                stroke={INK} strokeWidth="4" opacity="0.45" />
            )}
            {d.handle && d.w > 60 && d.h > 30 && (
              <rect
                x={d.type === "drawer" ? d.x + d.w / 2 - 60 : d.hingeSide === "left" ? d.x + d.w - 45 : d.x + 30}
                y={d.type === "drawer"
                  ? fy(d.y + d.h - Math.min(50, d.h / 2)) - 5
                  : fy(d.y + d.h * 0.5) - 60}
                width={d.type === "drawer" ? 120 : 15}
                height={d.type === "drawer" ? 10 : 120}
                rx="5" fill="#52525b" opacity="0.9" />
            )}
            {d.mirror && d.w > 2 && d.h > 2 && (
              <rect x={d.x + 0.5} y={fy(d.y + d.h) + 0.5} width={d.w - 1} height={d.h - 1}
                fill={mat.mirror.color} stroke={INK} strokeWidth="1" opacity="0.85" />
            )}
            {showDims && d.w > 90 && d.h > 40 && (
              <text x={d.x + d.w / 2}
                y={d.type === "drawer" ? fy(d.y + d.h * 0.3) : fy(d.y + d.h / 2) + 7}
                textAnchor="middle" fontSize="20" fill={INK} opacity="0.75"
                fontFamily="ui-monospace, monospace">
                {fmt(d.w)}×{fmt(d.h)}
              </text>
            )}
          </g>
        )
      )}

      {/* szczeliny — realne 2 mm bylyby niewidoczne, wiec zaznaczamy je znacznikiem */}
      {open && carcassFrame("carcass-frame-open-overlay")}

      {showGaps && !open &&
        geo.levels.flatMap((lv) => {
          const band = geo.doors
            .filter((d) => d.lvl === lv.i && d.w > 0)
            .sort((a, b) => a.x - b.x);
          const out = [];
          // pionowa szczelina (miedzy frontami, gora, dol) — kropka na krawedzi, etykieta wyprowadzona krotka kreska
          const marker = (key, xMid, yTop, val, up) => {
            const col = val < 2 ? ERRC : ACC;
            const dir = up ? -1 : 1;
            out.push(
              <g key={key}>
                <circle cx={xMid} cy={fy(yTop)} r="6" fill={col} />
                <line x1={xMid} y1={fy(yTop)} x2={xMid} y2={fy(yTop) + dir * 26}
                  stroke={col} strokeWidth="1.5" strokeDasharray="3 3" />
                <text x={xMid} y={fy(yTop) + dir * 34 + (up ? 0 : 14)} textAnchor="middle"
                  fontSize="20" fill={col} fontFamily="ui-monospace, monospace">
                  {fmt(val)}
                </text>
              </g>
            );
          };
          // boczna szczelina (lewy/prawy bok korpusu) — etykieta wyprowadzona poza obrys
          const sideMarker = (key, xMid, yMid, val, toLeft) => {
            const col = val < 2 ? ERRC : ACC;
            const lx = toLeft ? xMid - 34 : xMid + 34;
            out.push(
              <g key={key}>
                <circle cx={xMid} cy={fy(yMid)} r="6" fill={col} />
                <line x1={xMid} y1={fy(yMid)} x2={lx} y2={fy(yMid)}
                  stroke={col} strokeWidth="1.5" strokeDasharray="3 3" />
                <text x={lx} y={fy(yMid) + 7} textAnchor={toLeft ? "end" : "start"}
                  fontSize="20" fill={col} fontFamily="ui-monospace, monospace">
                  {fmt(val)}
                </text>
              </g>
            );
          };

          // dla kazdego pasma pionowego (kolumny) bierzemy skrajne fronty
          const colTop = {}; // najwyzszy front w kolumnie
          const colBot = {}; // najnizszy front w kolumnie
          band.forEach((d) => {
            const k = d.colKey;
            if (!colTop[k] || d.y + d.h > colTop[k].y + colTop[k].h) colTop[k] = d;
            if (!colBot[k] || d.y < colBot[k].y) colBot[k] = d;
          });

          band.forEach((d, i) => {
            const yTop = d.y + d.h;
            const yMid = d.y + d.h / 2;

            // front wpuszczony ma szczeliny wzgledem wlasnej kolumny — boku albo
            // przegrody obok niego, a nie wzgledem sasiada zza przegrody
            const pairOK = (b2) => !(d.inset || b2.inset) || d.colKey === b2.colKey;
            const leftWall =
              d.gWallL != null ? d.gWallL : cab.frontMode === "overlay" ? 0 : geo.interior.x0;
            const rightWall =
              d.gWallR != null ? d.gWallR : cab.frontMode === "overlay" ? W : geo.interior.x1;

            // czy po lewej stronie jest jakis front pokrywajacy sie w pionie
            let leftNb = null;
            band.forEach((b2) => {
              if (b2 === d || b2.x + b2.w > d.x + 0.5 || !pairOK(b2)) return;
              const vo = Math.min(d.y + d.h, b2.y + b2.h) - Math.max(d.y, b2.y);
              if (vo <= 0) return;
              if (!leftNb || b2.x + b2.w > leftNb.x + leftNb.w) leftNb = b2;
            });
            // luz z lewej rysujemy tylko gdy nie ma sasiada (bok/przegroda) — sasiad da luz z prawej
            if (!leftNb)
              sideMarker(`gl${d.key}`, (leftWall + d.x) / 2, yMid, Math.round(d.x - leftWall), true);

            // luz z prawej: do najblizszego sasiada w pionie albo do sciany
            let nb = null;
            band.forEach((b2) => {
              if (b2 === d || b2.x < d.x + d.w - 0.5 || !pairOK(b2)) return;
              const vo = Math.min(d.y + d.h, b2.y + b2.h) - Math.max(d.y, b2.y);
              if (vo <= 0) return;
              if (!nb || b2.x < nb.x) nb = b2;
            });
            if (nb) {
              const val = Math.round(nb.x - (d.x + d.w));
              // kropka na styku frontow u gory, kreska i opis wyprowadzone nad krawedz
              marker(`gm${d.key}`, (d.x + d.w + nb.x) / 2, Math.max(yTop, nb.y + nb.h), val, true);
            } else {
              sideMarker(`gr${d.key}`, (d.x + d.w + rightWall) / 2, yMid, Math.round(rightWall - (d.x + d.w)), false);
            }
            // luz gorny liczymy tylko dla najwyzszego frontu kolumny, dolny dla najnizszego
            const topRef = d.inset
              ? d.colY1
              : cab.frontMode === "overlay"
              ? H
              : geo.interior.y1;
            const botRef = d.inset
              ? d.colY0
              : cab.frontMode === "overlay"
              ? geo.bottomY
              : geo.interior.y0;
            if (colTop[d.colKey] === d)
              marker(`gt${d.key}`, d.x + d.w / 2, topRef, Math.round(topRef - (d.y + d.h)), true);
            if (colBot[d.colKey] === d)
              marker(`gb${d.key}`, d.x + d.w / 2, d.y, Math.round(d.y - botRef), false);

            // luz pionowy do frontu bezposrednio nad tym w tej samej kolumnie
            let above = null;
            band.forEach((b2) => {
              if (b2.colKey !== d.colKey || b2.y < d.y + d.h - 0.5) return;
              if (!above || b2.y < above.y) above = b2;
            });
            if (above) {
              const val = Math.round(above.y - (d.y + d.h));
              const col = val < 2 ? ERRC : ACC;
              // kropka na styku, kreska wyprowadzona az za prawa krawedz frontu
              const cxm = d.x + d.w / 2;
              const yv = fy(d.y + d.h);
              const lx = d.x + d.w + 30;
              out.push(
                <g key={`gv${d.key}`}>
                  <circle cx={cxm} cy={yv} r="6" fill={col} />
                  <line x1={cxm} y1={yv} x2={lx} y2={yv}
                    stroke={col} strokeWidth="1.5" strokeDasharray="3 3" />
                  <text x={lx + 6} y={yv + 7} textAnchor="start" fontSize="20"
                    fill={col} fontFamily="ui-monospace, monospace">
                    {fmt(val)}
                  </text>
                </g>
              );
            }
          });
          return out;
        })}

      {showDims && (
        <>
          {(() => {
            const wy = cab.topFiller?.on && cab.topFiller.height > 0 ? -(cab.topFiller.height + 40) : -50;
            return (
              <>
                <DimH x1={0} x2={W} y={wy} label={`${fmt(W)}`} />
                {geo.isBlat && (geo.blat.overL > 0 || geo.blat.overR > 0) && (
                  <DimH x1={geo.topX0} x2={geo.topX1} y={wy - 60}
                    label={`blat ${fmt(geo.topX1 - geo.topX0)}`} c={LINE} />
                )}
              </>
            );
          })()}
          <DimV y1={0} y2={H} x={dimHMainX} label={`${fmt(H)}`} />
          {showSideLengthDims && (
            <>
              <DimV y1={leftTopY} y2={leftBottomY} x={-26}
                label={`bok L ${fmt(geo.leftLen)}`} c={LINE} />
              <DimV y1={rightTopY} y2={rightBottomY} x={W + 26}
                label={`bok P ${fmt(geo.rightLen)}`} left={false} c={LINE} />
            </>
          )}
          {(cab.legs?.on || cab.plinth.on) && (() => {
            const legH = cab.legs?.on ? cab.legs.height || 100 : 0;
            const plH = cab.plinth.on && !geo.plinthInBody ? geo.plinthH : 0;
            // nozki i cokol pod korpusem nie stoja na sobie — cokol jest zabudowa miedzy nozkami
            const extra = Math.max(plH, legH);
            if (extra <= 0) return null;
            return (
              <>
                {/* calkowita wysokosc z podstawa po lewej */}
                <DimV y1={0} y2={H + extra} x={dimHTotalX} label={`${fmt(H + extra)}`} c={LINE} />
                {/* cokol: mierzony przy prawej krawedzi korpusu (cokol jest szerokosci szafki) */}
                {plH > 0 && (
                  <DimV y1={H} y2={H + plH} x={dimCokolX} label={`cokół ${fmt(plH)}`}
                    c={LINE} />
                )}
                {/* nozki: mierzone znacznie dalej w prawo, zeby opis sie nie nakladal */}
                {legH > 0 && (
                  <DimV y1={H} y2={H + legH} x={dimNozkiX} label={`nóżki ${fmt(legH)}`}
                    left={false} c={LINE} />
                )}
              </>
            );
          })()}
          {geo.levels.map((lv) => (
            <DimV key={"lv" + lv.i} y1={fy(lv.y1)} y2={fy(lv.y0)} x={dimLevelX}
              label={`${fmt(lv.h)}`} left={false} c={lv.h < 60 ? WARNC : DIMC} />
          ))}
          {/* wysokosci frontow szuflad przy prawej krawedzi */}
          {!open &&
            geo.doors
              .filter((d) => d.type === "drawer")
              .map((d) => (
                <DimV key={"dr" + d.key} y1={fy(d.y + d.h)} y2={fy(d.y)} x={dimDrawerX}
                  label={`${fmt(d.h)}`} left={false} c={DIMC} />
              ))}
          {/* wysokosci drzwi przy lewej krawedzi */}
          {!open &&
            geo.doors
              .filter((d) => d.type === "door")
              .map((d) => (
                <DimV key={"door" + d.key} y1={fy(d.y + d.h)} y2={fy(d.y)} x={dimDoorX}
                  label={`${fmt(d.h)}`} c={DIMC} />
              ))}
          {open &&
            geo.levels[0] &&
            geo.levels[0].cols.length > 1 &&
            geo.levels[0].cols.map((c) => (
              <DimH key={"c" + c.j} x1={c.x0} x2={c.x1} y={H + geo.plinthH + 90}
                label={`${fmt(c.w)}`} above={false} c={c.w < MIN_COL ? WARNC : DIMC} />
            ))}
          {/* szerokosci wszystkich frontow dolnego rzedu */}
          {!open &&
            (() => {
              const bottomLvl = geo.levels[0];
              if (!bottomLvl) return null;
              const seen = new Set();
              const yLine = H + geo.plinthH + 90;
              return geo.doors
                .filter((d) => d.lvl === 0 && d.w > 0)
                .filter((d) => {
                  const key = Math.round(d.x);
                  if (seen.has(key)) return false;
                  seen.add(key);
                  return true;
                })
                .map((d) => (
                  <DimH key={"fw" + d.key} x1={d.x} x2={d.x + d.w} y={yLine}
                    label={`${fmt(d.w)}`} above={false} c={DIMC} />
                ));
            })()}
        </>
      )}

      {/* swiatla miedzy polkami — w widoku otwartym, przy lewej krawedzi kolumny */}
      {open && showDims &&
        geo.levels.flatMap((lv) =>
          lv.cols
            .filter((c) => c.kind !== "drawers" && c.kind !== "blenda")
            .flatMap((c) =>
              (c.openings || [])
                .filter((op) => op.h > 30)
                .map((op) => (
                  <DimV key={`op${lv.i}-${c.j}-${op.k}`}
                    y1={fy(op.to)} y2={fy(op.from)} x={dimColX(c)}
                    label={`${fmt(op.h)}`} left={false} c={DIMC} />
                ))
            )
        )}

      {/* wysokosc uzytkowa szuflad: od gory dna (36 mm nad dolem frontu) do dolu frontu wyzej */}
      {open && showDims &&
        geo.levels.flatMap((lv) =>
          lv.cols
            .filter((c) => c.kind === "drawers" && (c.drawers || []).length)
            .flatMap((c) => {
              const ds = [...c.drawers].sort((a, b) => a.y - b.y);
              return ds.map((dr, i) => {
                const bottom = dr.y + 36; // gora dna szuflady
                const top = i + 1 < ds.length ? ds[i + 1].y : lv.y1;
                const val = Math.round(top - bottom);
                if (val < 30) return null;
                return (
                  <DimV key={`du${lv.i}-${c.j}-${i}`}
                    y1={fy(top)} y2={fy(bottom)} x={dimColX(c)}
                    label={`${fmt(val)} od dna`} left={false} c={DIMC} />
                );
              });
            })
        )}

      {/* prowadnice szuflad — po jednej przy kazdym boku kolumny */}
      {open && showHardware &&
        geo.levels.flatMap((lv) =>
          lv.cols
            .filter((c) => c.kind === "drawers" && (c.drawers || []).length)
            .flatMap((c) =>
              c.drawers.flatMap((dr) =>
                [c.x0, c.x1 - RUNNER_W].map((rx, s) => (
                  <rect key={`rn${lv.i}-${c.j}-${dr.i}-${s}`}
                    x={rx} y={fy(dr.rail.y0 + dr.rail.h)} width={RUNNER_W} height={dr.rail.h}
                    fill="#8b8b93" stroke={INK} strokeWidth="1.5" />
                ))
              )
            )
        )}

      {/* wysokosc montazu prowadnic — mierzona od wewnetrznego dna szafki */}
      {railDimCols.flatMap(({ c, where }) =>
        c.drawers.map((dr, i) => {
          const val = Math.round(dr.rail.y0 - geo.interior.y0);
          if (val < 0) return null;
          // w srodku szafki chowamy wymiar przy prawej prowadnicy, zeby nie
          // wchodzil na wymiary swiatla szuflady rysowane przy lewej
          const x =
            where === "left" ? -26 : where === "right" ? W + 26 : c.x1 - RUNNER_W - 30;
          return (
            <DimV key={`rh${c.j}-${i}`} y1={fy(dr.rail.y0)} y2={fy(geo.interior.y0)} x={x}
              label={`szyna ${fmt(val)}`} left={where !== "right"} c={DIMC} />
          );
        })
      )}

      {/* swiatlo szerokosci szuflady: swiatlo kolumny minus 2 x 21 mm (prowadnica + bok) */}
      {open && showDims &&
        geo.levels.flatMap((lv) =>
          lv.cols
            .filter((c) => c.kind === "drawers" && (c.drawers || []).length && c.w > 42 + 60)
            .flatMap((c) => {
              const clear = Math.round(c.w - 42);
              return c.drawers.map((dr, i) =>
                dr.h < 46 ? null : (
                  <DimH key={`dw${lv.i}-${c.j}-${i}`}
                    x1={c.x0 + 21} x2={c.x1 - 21} y={fy(dr.y + 16)}
                    label={`${fmt(clear)} szer.`} c={DIMC} />
                )
              );
            })
        )}

      {showLabels &&
        geo.levels.flatMap((lv) =>
          lv.cols.map((c) => {
            const cx = (c.x0 + c.x1) / 2;
            const cy = fy(lv.y1) + 34; // tuz pod gorna krawedzia pola
            return (
              <text key={`lbl${lv.i}-${c.j}`} x={cx} y={cy + 20}
                textAnchor="middle" fontSize="64" fontWeight="800"
                fill={INK} stroke="#ffffff" strokeWidth="8" paintOrder="stroke"
                fontFamily="ui-monospace, monospace"
                style={{ pointerEvents: "none" }}>
                Poz.{lv.i + 1}K{c.j + 1}
              </text>
            );
          })
        )}
    </svg>
  );
}

function RearView({ cab, geo, mat, showDims }) {
  const { W, H } = cab;
  const pad = 170;
  const rBelow = Math.max(
    cab.legs?.on ? cab.legs.height || 100 : 0,
    cab.plinth.on && !geo.plinthInBody ? geo.plinthH : 0
  );
  const vb = `${-pad} ${-pad} ${W + 2 * pad} ${H + 2 * pad + 40 + rBelow}`;
  const fy = (y) => H - y;
  const mx = (x, w) => W - x - w; // patrzymy od tylu, wiec lustro w poziomie
  const bf = mat.board.color;
  const t = geo.t;

  const grab = geo.grooved ? geo.grDep - geo.grPlay : 0;
  let bx, by, bw, bh, label;
  if (cab.back === "none") {
    bx = by = bw = bh = 0;
    label = "brak pleców";
  } else if (cab.back === "board") {
    if (geo.backPos === "outside") {
      bx = 0; by = 0; bw = W; bh = H;
      label = "plecy z płyty na zewnątrz — cała tylna płaszczyzna";
    } else {
      bx = geo.interior.x0; by = geo.interior.y0;
      bw = geo.innerW; bh = geo.innerH;
      label = "plecy z płyty wewnątrz — między bokami";
    }
  } else if (geo.grooved) {
    bx = geo.interior.x0 - grab;
    by = geo.interior.y0 - grab;
    bw = geo.innerW + 2 * grab;
    bh = geo.innerH + 2 * grab;
    label = `HDF we frezie, wchodzi ${fmt(grab)} mm w każdy frez`;
  } else {
    bx = 1; by = 1; bw = W - 2; bh = H - 2;
    label = "HDF przybijane, luz 1 mm z każdej strony";
  }
  // przyciecie plecow do granic narożnika
  {
    const limL = geo.cornerCut?.backLeftX;
    const limR = geo.cornerCut?.backRightX;
    if ((limL != null || limR != null) && bw > 0) {
      const x0 = Math.max(bx, limL ?? bx);
      const x1 = Math.min(bx + bw, limR ?? bx + bw);
      bx = x0;
      bw = Math.max(0, x1 - x0);
      label += ", docięte przy narożniku";
    }
  }

  return (
    <svg viewBox={vb} className="w-full h-auto" style={{ maxHeight: 540 }}>
      {/* korpus widziany od tylu */}
      <rect x="0" y="0" width={W} height={H} fill="#fafaf9" stroke={LINE} strokeWidth="1.5" />
      {/* boki — widok od tylu, wiec lewy bok po prawej */}
      <rect x={W - t} y={fy(geo.leftY0 + geo.leftLen)} width={t} height={geo.leftLen}
        fill={bf} stroke={INK} strokeWidth="2" />
      <rect x="0" y={fy(geo.rightY0 + geo.rightLen)} width={t} height={geo.rightLen}
        fill={bf} stroke={INK} strokeWidth="2" />
      {/* wieniec */}
      {geo.hasTop && (
        <rect x={W - geo.topX1} y="0" width={geo.topX1 - geo.topX0} height={t}
          fill={bf} stroke={INK} strokeWidth="2" />
      )}
      {/* dno */}
      {geo.hasBot && (
        <rect x={W - geo.botX1} y={fy(geo.bottomY + t)} width={geo.botX1 - geo.botX0} height={t}
          fill={bf} stroke={INK} strokeWidth="2" />
      )}

      {/* polki i przegrody widoczne pod pleckami */}
      {geo.sepShelves.map((sh, i) => (
        <rect key={"s" + i} x={geo.interior.x0} y={fy(sh.y + t)} width={geo.innerW} height={t}
          fill="none" stroke={LINE} strokeWidth="1.5" strokeDasharray="8 6" />
      ))}
      {geo.dividers.map((d, i) => (
        <rect key={"d" + i} x={mx(d.x, t)} y={fy(d.y1)} width={t} height={d.h}
          fill="none" stroke={LINE} strokeWidth="1.5" strokeDasharray="8 6" />
      ))}
      {geo.levels.map((lv) =>
        lv.cols.map((c) =>
          c.shelves.map((sh, k) => (
            <rect key={`p${lv.i}-${c.j}-${k}`} x={mx(c.x0, c.w)} y={fy(sh.y + t)}
              width={c.w} height={t} fill="none" stroke={LINE} strokeWidth="1.5" strokeDasharray="8 6" />
          ))
        )
      )}

      {/* plecy */}
      {cab.back !== "none" && (
        <rect x={mx(bx, bw)} y={fy(by + bh)} width={bw} height={bh}
          fill={geo.backIsBoard
            ? (cab.backPos === "outside" && cab.backBoardMat !== "shelf" ? mat.board.color : (mat.shelf?.color || mat.board.color))
            : mat.back.color}
          stroke={INK} strokeWidth="2.5" opacity={geo.backIsBoard ? 0.95 : 0.72} />
      )}

      {/* wyciecie w narozniku — widziane od tylu */}
      {geo.geoCuts.map((gc, ci) => {
        // od tylu obraz jest lustrzany: mx(x, w)
        const xw = mx(gc.bx0, gc.bx1 - gc.bx0);
        // scianka pionowa stoi na zewnatrz otworu, po stronie wnetrza
        const wallX = gc.onLeft ? gc.bx1 : gc.bx0 - t;
        return (
          <g key={"cut" + ci}>
            <rect x={xw} y={fy(gc.cy1)} width={gc.bx1 - gc.bx0} height={gc.cutH}
              fill={ERRC} opacity="0.14" stroke={ERRC} strokeWidth="1.5" strokeDasharray="6 4" />
            <rect x={mx(wallX, t)} y={fy(gc.cy1)} width={t} height={gc.cutH}
              fill={mat.shelf?.color || bf} stroke={INK} strokeWidth="2" opacity="0.9" />
            <text x={xw + (gc.bx1 - gc.bx0) / 2} y={fy((gc.cy0 + gc.cy1) / 2)} textAnchor="middle"
              fontSize="18" fill={ERRC} fontFamily="ui-monospace, monospace">
              wycięcie {fmt(gc.cw)}×{fmt(gc.cdp)}
            </text>
          </g>
        );
      })}

      {/* cokol pod korpusem / nozki */}
      {cab.plinth.on && !geo.plinthInBody && (
        <rect x="0" y={H} width={W} height={geo.plinthH}
          fill={bf} stroke={INK} strokeWidth="2" opacity="0.75" />
      )}
      {cab.legs?.on && (
        <>
          <rect x={40} y={H} width={40} height={cab.legs.height || 100}
            fill="#3f3f46" stroke={INK} strokeWidth="2" />
          <rect x={W - 80} y={H} width={40} height={cab.legs.height || 100}
            fill="#3f3f46" stroke={INK} strokeWidth="2" />
        </>
      )}

      {showDims && cab.back !== "none" && (
        <>
          <DimH x1={mx(bx, bw)} x2={mx(bx, bw) + bw} y={-55} label={`${fmt(bw)}`} />
          <DimV y1={fy(by + bh)} y2={fy(by)} x={-55} label={`${fmt(bh)}`} />
          {geo.grooved && (
            <DimH x1={mx(bx, bw)} x2={mx(bx, bw) + grab} y={H + 60}
              label={`frez ${fmt(grab)}`} above={false} c={WARNC} />
          )}
        </>
      )}
      <text x={W / 2} y={H + 120 + rBelow} textAnchor="middle" fontSize="22" fill={LINE}
        fontFamily="ui-monospace, monospace">{label}</text>
      <text x={W / 2} y={H + 150 + rBelow} textAnchor="middle" fontSize="20" fill={LINE}
        fontFamily="ui-monospace, monospace">widok od tyłu — lewy bok szafki po prawej</text>
    </svg>
  );
}

function TopView({ cab, geo, mat, showDims, showShelves, showHardware }) {
  const { W, D } = cab;
  const pad = 160;
  // patrzymy z gory: X = szerokosc, Y (w dol na ekranie) = glebokosc, przod u dolu
  const frontExtra = cab.frontMode === "overlay" ? geo.tf : 0;
  const tOvL = geo.isBlat ? geo.blat.overL : 0;
  const tOvR = geo.isBlat ? geo.blat.overR : 0;
  const tOvF = geo.isBlat ? geo.blat.overFront : 0;
  const tOvB = geo.isBlat ? geo.blat.overBack : 0;
  const vb = `${-pad - tOvL} ${-pad - tOvB} ${W + tOvL + tOvR + 2 * pad + 120} ${D + tOvB + tOvF + 2 * pad + 100 + frontExtra}`;
  const bf = mat.board.color;
  const t = geo.t;
  const cd = geo.carcassDepth;

  return (
    <svg viewBox={vb} className="w-full h-auto" style={{ maxHeight: 540 }}>
      {/* obrys korpusu z gory */}
      <rect x="0" y="0" width={W} height={cd} fill="#fafaf9" stroke={LINE} strokeWidth="1.5" />
      {/* boki — skrocone przy narozniku z wycieciem/elementem */}
      <rect x="0" y={geo.cornerCut?.sideLeftDepth || 0} width={t}
        height={cd - (geo.cornerCut?.sideLeftDepth || 0)} fill={bf} stroke={INK} strokeWidth="2" />
      <rect x={W - t} y={geo.cornerCut?.sideRightDepth || 0} width={t}
        height={cd - (geo.cornerCut?.sideRightDepth || 0)} fill={bf} stroke={INK} strokeWidth="2" />
      {/* wieniec widoczny z gory jako plyta na calej glebokosci */}
      {geo.hasTop && (
        <rect x={geo.topX0} y={geo.isBlat ? -tOvB : 0}
          width={geo.topX1 - geo.topX0}
          height={geo.isBlat ? geo.blatDepth : cd}
          fill={bf} stroke={INK}
          strokeWidth={geo.isBlat ? 2 : 1}
          opacity={geo.isBlat ? 0.45 : 0.25} />
      )}
      {/* elementy wzmacniajace z gory (y=0 tyl; glebokosc od tylu = cd - z0 - zLen) */}
      {geo.levels.flatMap((lv) => lv.cols.flatMap((c) => (c.rails || []).map((r, ri) => (
        <rect key={`trail${lv.i}-${c.j}-${ri}`}
          x={r.x0} y={cd - (r.z0 + r.zLen)} width={r.x1 - r.x0} height={r.zLen}
          fill={bf} stroke={INK} strokeWidth="1.5" opacity="0.55" />
      ))))}

      {/* polki widziane z gory — obrys glebokosci polki w kolumnach, ktore je maja */}
      {showShelves &&
        (geo.levels[0]?.cols || []).map((c) => {
          if (c.kind === "drawers" || c.kind === "blenda") return null;
          const n = (c.shelves || []).length;
          if (!n) return null;
          return (
            <g key={"sh" + c.j}>
              <rect x={c.x0} y={geo.backIntrusion} width={c.w} height={geo.shelfDepth}
                fill={mat.shelf?.color || mat.board.color} fillOpacity="0.35"
                stroke={INK} strokeWidth="1.5" strokeDasharray="9 6" />
              <text x={(c.x0 + c.x1) / 2} y={geo.backIntrusion + geo.shelfDepth - 14}
                textAnchor="middle" fontSize="17" fill={INK} opacity="0.75"
                fontFamily="ui-monospace, monospace">
                {n} {n === 1 ? "półka" : "półki"} {fmt(c.w)}×{fmt(geo.shelfDepth)}
              </text>
            </g>
          );
        })}

      {/* przegrody pionowe */}
      {geo.dividers.map((d, i) => (
        <rect key={"dv" + i} x={d.x} y={geo.backIntrusion} width={t}
          height={geo.dividerDepth} fill={bf} stroke={INK} strokeWidth="2" />
      ))}

      {/* fronty widziane z gory jako cienki pas przy przedniej krawedzi */}
      {(() => {
        // bierzemy dolny poziom jako reprezentatywny (z gory widac tylko przednia plaszczyzne)
        const cols = geo.levels[0]?.cols || [];
        const ffc = cab.realColors && cab.frontSameAsBoard !== false ? mat.board.color : mat.front.color;
        return cols.map((c) => {
          if (!c.count) return null;
          const isDrawer = c.kind === "drawers";
          // kolumna szuflad ma wlasny montaz frontu — wpuszczony siedzi w
          // swietle korpusu, rowno z bokiem i przegroda, a nie na nich
          const cMode = isDrawer ? c.drawerMode || cab.frontMode : cab.frontMode;
          const z0 = cMode === "overlay" ? cd : cd - geo.tf;
          const dr0 = isDrawer && c.drawers?.length ? c.drawers[0] : null;
          const x0 = dr0 ? dr0.x : c.frontX0 ?? c.x0;
          const x1 = dr0 ? dr0.x + dr0.w : c.frontX1 ?? c.x1;
          // skrzynka: bierzemy najglebsze NL sposrod szuflad w kolumnie (rzeczywisty zasieg)
          const nl = isDrawer && c.drawers?.length
            ? Math.max(...c.drawers.map((d) => d.nl || 0))
            : c.nl || 0;
          const boxFront = cd; // lico korpusu
          const boxBack = Math.max(geo.backIntrusion, cd - nl);
          return (
            <g key={"fr" + c.j}>
              <rect x={x0} y={z0} width={x1 - x0} height={geo.tf}
                fill={ffc} stroke={INK} strokeWidth="2" />
              {isDrawer && nl > 0 && (
                <>
                  <rect x={x0 + 4} y={boxBack} width={x1 - x0 - 8}
                    height={boxFront - boxBack}
                    fill="none" stroke={LINE} strokeWidth="1" strokeDasharray="5 4" opacity="0.6" />
                  <text x={(x0 + x1) / 2} y={(boxBack + boxFront) / 2 + 6} textAnchor="middle"
                    fontSize="16" fill={LINE} fontFamily="ui-monospace, monospace">
                    NL {fmt(nl)}
                  </text>
                  {/* wolna przestrzen za szuflada, od jej konca do tylu */}
                  {boxBack - geo.backIntrusion > 1 && showDims && (
                    <DimV y1={geo.backIntrusion} y2={boxBack} x={(x0 + x1) / 2}
                      label={`${fmt(boxBack - geo.backIntrusion)}`}
                      c={WARNC} />
                  )}
                </>
              )}
            </g>
          );
        });
      })()}

      {/* prowadnice szuflad z gory — pas 21 mm przy kazdym boku, na glebokosc NL */}
      {showHardware && (geo.levels[0]?.cols || [])
        .filter((c) => c.kind === "drawers" && (c.drawers || []).length)
        .flatMap((c) => {
          const nl = Math.max(...c.drawers.map((d) => d.rail.d || 0));
          if (!nl) return [];
          const sb = c.drawers[0]?.rail.setback || 0;
          return [c.x0, c.x1 - RUNNER_W].map((rx, s) => (
            <rect key={`trn${c.j}-${s}`} x={rx} y={cd - sb - nl} width={RUNNER_W} height={nl}
              fill="#8b8b93" stroke={INK} strokeWidth="1.5" opacity="0.85" />
          ));
        })}

      {/* elementy stale (fix) widziane z gory — leza w plaszczyznie frontu */}
      {(() => {
        const z0 = cab.frontMode === "overlay" ? cd : cd - geo.tf;
        const ffc = cab.realColors && cab.frontSameAsBoard !== false ? mat.board.color : mat.front.color;
        const panels = [];
        geo.levels.forEach((lv) =>
          lv.cols.forEach((c) => {
            if (c.fix) panels.push({ k: `f${lv.i}-${c.j}`, x: c.fix.x, w: c.fix.w });
            if (c.topFix) panels.push({ k: `tf${lv.i}-${c.j}`, x: c.topFix.x, w: c.topFix.w });
          })
        );
        // z gory kilka poziomow nakłada się na siebie — rysujemy kazdy pas raz
        const seen = new Set();
        return panels
          .filter((p) => {
            const key = `${Math.round(p.x)}|${Math.round(p.w)}`;
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
          })
          .map((p) => (
            <g key={p.k}>
              <rect x={p.x} y={z0} width={p.w} height={geo.tf}
                fill={ffc} stroke={INK} strokeWidth="2" />
              <line x1={p.x} y1={z0} x2={p.x + p.w} y2={z0 + geo.tf}
                stroke={INK} strokeWidth="1.2" opacity="0.5" />
              <line x1={p.x} y1={z0 + geo.tf} x2={p.x + p.w} y2={z0}
                stroke={INK} strokeWidth="1.2" opacity="0.5" />
            </g>
          ));
      })()}

      {/* wsporniki pionowe przy elementach stalych — z gory widac ich glebokosc */}
      {geo.levels.flatMap((lv) =>
        lv.cols
          .filter((c) => c.support && c.fix)
          .map((c) => (
            <rect key={`tsup${lv.i}-${c.j}`}
              x={c.fix.side === "left" ? c.fix.x + c.fix.w - t : c.fix.x}
              y={cd - c.support.d} width={t} height={c.support.d}
              fill="none" stroke={INK} strokeWidth="1.5" strokeDasharray="8 6" />
          ))
      )}

      {/* plecy */}
      {cab.back !== "none" && (() => {
        const bcol = geo.backIsBoard
          ? (cab.backPos === "outside" && cab.backBoardMat !== "shelf" ? mat.board.color : (mat.shelf?.color || mat.board.color))
          : mat.back.color;
        // z gory: y=0 to tyl. Plecy wewnatrz siedza tuz przy tyle, na zewnatrz za korpusem
        const outside = geo.backIsBoard && geo.backPos === "outside";
        const py = geo.grooved ? geo.grOff : outside ? -geo.tb : 0;
        const inside = geo.grooved || (geo.backIsBoard && geo.backPos === "inside");
        const base0 = inside ? geo.interior.x0 : 1;
        const base1 = inside ? geo.interior.x1 : W - 1;
        const px = Math.max(base0, geo.cornerCut?.backLeftX ?? base0);
        const px1 = Math.min(base1, geo.cornerCut?.backRightX ?? base1);
        const pw = Math.max(0, px1 - px);
        return (
          <rect x={px} y={py} width={pw} height={geo.tb}
            fill={bcol} stroke={INK} strokeWidth="2" />
        );
      })()}

      {/* wyciecie w narozniku */}
      {geo.geoCuts.map((gc, ci) => {
        const smat = mat.shelf?.color || bf;
        // obszar wneki we wspolrzednych widoku z gory (y = glebokosc od tyłu)
        const rx = gc.bx0;
        const ry = gc.bz0;
        const rw = gc.bx1 - gc.bx0;
        const rh = gc.bz1 - gc.bz0;
        return (
          <g key={"cut" + ci}>
            <rect x={rx} y={ry} width={rw} height={rh}
              fill={ERRC} opacity="0.15" stroke={ERRC} strokeWidth="1.5" strokeDasharray="6 4" />
            {gc.mask && (() => {
              const vVisible = gc.maskVisible === "vertical";
              // scianki NA ZEWNATRZ otworu; czolo dochodzi do lica boku
              const sideFace = gc.onLeft ? rx + t : rx + rw - t; // lico boku od wnetrza
              const vx = gc.onLeft ? rx + rw : rx - t;
              const hy = gc.onBack ? ry + rh : ry - t;
              const vy = vVisible ? (gc.onBack ? ry : ry - t) : ry;
              const vh = vVisible ? rh + t : rh;
              const hx0 = gc.onLeft
                ? sideFace
                : (vVisible ? rx : rx - t);
              const hx1 = gc.onLeft
                ? (vVisible ? rx + rw : rx + rw + t)
                : sideFace;
              const hx = Math.min(hx0, hx1);
              const hw = Math.abs(hx1 - hx0);
              return (
                <>
                  <rect x={vx} y={vy} width={t} height={vh}
                    fill={smat} stroke={INK} strokeWidth="2" />
                  <rect x={hx} y={hy} width={hw} height={t}
                    fill={smat} stroke={INK} strokeWidth="2" />
                </>
              );
            })()}
            {showDims && (
              <>
                {/* szerokosc na zewnatrz otworu: przy tylnej scianie gdy otwor z tyłu, inaczej przy licu */}
                <DimH x1={rx} x2={rx + rw}
                  y={gc.onBack ? ry - 22 : ry + rh + 22}
                  label={`${fmt(gc.cw)}`} above={gc.onBack} c={ERRC} />
                {/* glebokosc na zewnatrz otworu: po stronie boku szafki */}
                <DimV y1={ry} y2={ry + rh}
                  x={gc.onLeft ? rx - 22 : rx + rw + 22}
                  label={`${fmt(gc.cdp)}`} left={gc.onLeft} c={ERRC} />
                {/* wolna glebokosc od czola zabudowy do lica */}
                {(() => {
                  const mt = gc.mask ? t : 0;
                  const zEnd = gc.bz1 + mt;
                  const free = Math.round(cd - zEnd);
                  if (free < 20) return null;
                  return (
                    <DimV y1={zEnd} y2={cd} x={(gc.bx0 + gc.bx1) / 2}
                      label={`${fmt(free)}`} left={!gc.onLeft} c={LINE} />
                  );
                })()}

              </>
            )}
          </g>
        );
      })}

      {(geo.geoObs || []).map((o, obIx) => (() => {
        return (
          <g key={"ob" + obIx}>
            <rect x={o.ox0} y={o.oz0} width={o.ow} height={o.od}
              fill="#7c3aed" opacity="0.28" stroke="#6d28d9" strokeWidth="1.5" strokeDasharray="5 4" />
            {o.mask && o.maskChosen && (() => {
              const smat = mat.shelf?.color || mat.board.color;
              const rx = o.ox0, ry = o.oz0, rw = o.ow, rh = o.od;
              const gb = o;
              const needL = !gb.touchLeft, needR = !gb.touchRight;
              const needBack = !gb.touchBack, needFront = !gb.touchFront;
              const vVisible = gb.maskVisible === "vertical";
              const isU = gb.maskChosen === "U";
              const frontBetween = o.maskFront === "between";
              // czolo konczy sie na licu boku, gdy bryla dotyka boku
              const hx0 = gb.touchLeft ? (gb.boundL ?? t)
                : isU ? (frontBetween ? rx : rx - t)
                : (needL && !vVisible ? rx - t : rx);
              const hx1 = gb.touchRight ? (gb.boundR ?? W - t)
                : isU ? (frontBetween ? rx + rw : rx + rw + t)
                : (needR && !vVisible ? rx + rw + t : rx + rw);
              // przy czole miedzy bokami scianki wychodza przed nie o jego grubosc
              const eB = needBack && (isU ? frontBetween : vVisible) ? t : 0;
              const eF = needFront && (isU ? frontBetween : vVisible) ? t : 0;
              const walls = [];
              if (needL) walls.push({ x: rx - t, y: ry - eB, w: t, h: rh + eB + eF });
              if (needR) walls.push({ x: rx + rw, y: ry - eB, w: t, h: rh + eB + eF });
              if (needBack) walls.push({ x: hx0, y: ry - t, w: hx1 - hx0, h: t });
              if (needFront) walls.push({ x: hx0, y: ry + rh, w: hx1 - hx0, h: t });
              return walls.map((w, i) => (
                <rect key={"ow" + i} x={w.x} y={w.y} width={w.w} height={w.h}
                  fill={smat} stroke={INK} strokeWidth="2" />
              ));
            })()}
            <text x={o.ox0 + o.ow / 2} y={o.oz0 + o.od / 2 + 6} textAnchor="middle"
              fontSize="18" fill="#6d28d9" fontFamily="ui-monospace, monospace">
              {fmt(o.ow)}×{fmt(o.od)}
            </text>
            {showDims && (() => {
              // bryla w narozniku wchodzi w plyte boku — wtedy mierzymy od krawedzi szafki
              const cols = geo.levels[0]?.cols || [];
              const host = cols.find((c) => o.ox0 >= c.x0 - 1 && o.ox1 <= c.x1 + 1);
              const colX0 = host ? host.x0 : 0;
              const colX1 = host ? host.x1 : W;
              const dL = Math.round(o.ox0 - colX0);
              const dR = Math.round(colX1 - o.ox1);
              return (
                <>
                  {/* glebokosc od tylu do bryly */}
                  {o.oz0 > 0 && !o.mask && (
                    <DimV y1={0} y2={o.oz0} x={o.ox0 - 18}
                      label={`${fmt(o.oz0)}`} c="#6d28d9" />
                  )}
                  {/* glebokosc od przodu (lica) do bryly — tylko gdy nie ma zabudowy,
                      bo przy zabudowie mierzymy przestrzen od jej czola */}
                  {cd - o.oz1 > 0 && !o.mask && (
                    <DimV y1={o.oz1} y2={cd} x={o.ox1 + 18}
                      label={`${fmt(cd - o.oz1)}`} left={false} c="#6d28d9" />
                  )}
                  {/* odleglosci w obrebie kolumny, tuz pod bryla */}
                  {dL > 1 && !o.mask && (
                    <DimH x1={colX0} x2={o.ox0} y={o.oz1 + 46}
                      label={`${fmt(dL)}`} above={false} c="#6d28d9" />
                  )}
                  {dR > 1 && !o.mask && (
                    <DimH x1={o.ox1} x2={colX1} y={o.oz1 + 46}
                      label={`${fmt(dR)}`} above={false} c="#6d28d9" />
                  )}
                  {/* wolna przestrzen po zabudowie — tylko w kolumnach z polkami */}
                  {host && host.kind !== "drawers" && o.mask && (() => {
                    const gb = o;
                    const wallL = gb.touchLeft ? host.x0 : o.ox0 - geo.t;
                    const wallR = gb.touchRight ? host.x1 : o.ox1 + geo.t;
                    const myEnd = o.oz1 + (o.mask ? geo.t : 0);
                    const frontFree = Math.round(cd - myEnd);
                    return (
                      <>
                        {frontFree > 1 && (
                          <DimV y1={myEnd} y2={cd} x={(o.ox0 + o.ox1) / 2}
                            label={`${fmt(frontFree)}`}
                            left={(o.ox0 + o.ox1) / 2 > W / 2} c={LINE} />
                        )}
                      </>
                    );
                  })()}
                </>
              );
            })()}
          </g>
        );
      })())}

      {/* swiatla miedzy przeszkodami — liczone raz, na kazdym pasmie glebokosci */}
      {showDims && (() => {
        const cols = geo.levels[0]?.cols || [];
        const blockers = [];
        geo.geoCuts.forEach((gc) => {
          const mt = gc.mask ? t : 0;
          blockers.push({
            l: gc.onLeft ? gc.bx0 : gc.bx0 - mt,
            r: gc.onLeft ? gc.bx1 + mt : gc.bx1,
            end: gc.bz1 + mt,
          });
        });
        (geo.geoObs || []).forEach((q) => {
          const mt = q.mask ? t : 0;
          blockers.push({
            l: q.ox0 - (q.touchLeft ? 0 : mt),
            r: q.ox1 + (q.touchRight ? 0 : mt),
            end: q.oz1 + mt,
          });
        });
        if (!blockers.length) return null;
        const edges = [0, ...new Set(blockers.map((b) => Math.round(b.end)))].sort((a, b) => a - b);
        const bands = edges.map((z, i) => [z, i + 1 < edges.length ? edges[i + 1] : cd]);
        const drawn = new Set();
        const out = [];
        bands.forEach(([za, zb]) => {
          if (zb - za < 12) return;
          const act = blockers.filter((b) => b.end > za + 1);
          cols.forEach((col) => {
            if (col.kind === "drawers") return;
            const inCol = act
              .filter((b) => b.r > col.x0 + 1 && b.l < col.x1 - 1)
              .sort((a, b) => a.l - b.l);
            if (!inCol.length) return;
            let cur = col.x0;
            const segs = [];
            inCol.forEach((b) => {
              if (b.l - cur > 1) segs.push([cur, b.l]);
              cur = Math.max(cur, b.r);
            });
            if (col.x1 - cur > 1) segs.push([cur, col.x1]);
            segs.forEach(([sa, sb]) => {
              const val = Math.round(sb - sa);
              if (val < 20) return;
              const key = `${col.j}|${Math.round(sa)}|${Math.round(sb)}`;
              if (drawn.has(key)) return;
              drawn.add(key);
              out.push(
                <DimH key={"lw" + key} x1={sa} x2={sb} y={za + 16}
                  label={`${fmt(val)}`} above={false} c={LINE} />
              );
            });
          });
        });
        return out;
      })()}

      {showDims && (
        <>
          <DimH x1={0} x2={W} y={-50} label={`${fmt(W)}`} />
          <DimV y1={0} y2={cd} x={-50} label={`${fmt(cd)}`} />
          {/* szerokosci swiatla kolumn dolnego poziomu */}
          {(geo.levels[0]?.cols || []).length > 1 &&
            geo.levels[0].cols.map((c) => (
              <DimH key={"cw" + c.j} x1={c.x0} x2={c.x1} y={cd + 90}
                label={`${fmt(c.w)}`} above={false}
                c={c.w < MIN_COL ? WARNC : DIMC} />
            ))}
          {/* glebokosc uzytkowa: swiatlo miedzy pleckami a licem */}
          <DimV y1={geo.backIntrusion} y2={cd} x={W + 55}
            label={`${fmt(cd - geo.backIntrusion)}`} left={false} c={DIMC} />
          {/* glebokosc polki, jesli krotsza niz swiatlo */}
          {geo.shelfDepth < cd - geo.backIntrusion && (
            <DimV y1={geo.backIntrusion} y2={geo.backIntrusion + geo.shelfDepth} x={W + 115}
              label={`półka ${fmt(geo.shelfDepth)}`} left={false} c={LINE} />
          )}
        </>
      )}
      <text x={W / 2} y={cd + 150} textAnchor="middle" fontSize="22" fill={LINE}
        fontFamily="ui-monospace, monospace">widok z góry — tył u góry, przód u dołu</text>
    </svg>
  );
}

function SideView({ cab, geo, mat, showDims, which, showHardware }) {
  const sideRight = which === "right";
  const { H, D } = cab;
  const pad = 160;
  const rightExtra = cab.frontMode === "overlay" ? geo.tf : 0;
  const below = Math.max(
    cab.legs?.on ? cab.legs.height || 100 : 0,
    cab.plinth.on && !geo.plinthInBody ? geo.plinthH : 0
  );
  const sOvF = geo.isBlat ? geo.blat.overFront : 0;
  const sOvB = geo.isBlat ? geo.blat.overBack : 0;
  const vb = `${-pad - sOvB} ${-pad - 70} ${D + sOvB + sOvF + 2 * pad + rightExtra} ${H + 2 * pad + 70 + below}`;
  const fy = (y) => H - y;
  const bf = mat.board.color;
  const cd = geo.carcassDepth;
  const xC = D - cd; // tyl po lewej
  const hasFront = geo.levels.some((lv) => lv.cols.some((c) => c.count > 0));
  // przod korpusu jest przy x=D; front nakladany wystaje o tf, wpuszczany jest w licu
  const frontFace = cab.frontMode === "overlay" ? D + geo.tf : D;

  const allShelves = [
    ...geo.sepShelves.map((s) => s.y),
    ...geo.levels.flatMap((lv) => lv.cols.flatMap((c) => c.shelves.map((s) => s.y))),
  ];

  return (
    <svg viewBox={vb} className="w-full h-auto" style={{ maxHeight: 540 }}>
      <rect x="0" y="0" width={D} height={H} fill="#fafaf9" stroke={LINE} strokeWidth="1.5" strokeDasharray="8 8" />
      {(() => {
        const cut = (sideRight ? geo.cornerCut?.sideRightDepth : geo.cornerCut?.sideLeftDepth) || 0;
        return (
          <rect x={xC + cut} y="0" width={cd - cut} height={H}
            fill={bf} stroke={INK} strokeWidth="2" opacity="0.35" />
        );
      })()}
      <rect x={geo.isBlat ? xC - sOvB : xC} y="0"
        width={geo.isBlat ? geo.blatDepth : cd} height={geo.t}
        fill={bf} stroke={INK} strokeWidth="2" />
      <rect x={xC} y={fy(geo.bottomY + geo.t)} width={cd} height={geo.t} fill={bf} stroke={INK} strokeWidth="2" />

      {cab.plinth.on && geo.plinthInBody && (
        <rect x={D - geo.t - (cab.plinth.setback || 0)} y={fy(geo.plinthH)}
          width={geo.t} height={geo.plinthH} fill={bf} stroke={INK} strokeWidth="2" />
      )}
      {cab.plinth.on && !geo.plinthInBody && (
        <rect x={xC} y={H} width={cd} height={geo.plinthH}
          fill={bf} stroke={INK} strokeWidth="2" opacity="0.75" />
      )}
      {cab.legs?.on && (
        <>
          <rect x={xC + 40} y={H} width={40} height={cab.legs.height || 100}
            fill="#3f3f46" stroke={INK} strokeWidth="2" />
          <rect x={xC + cd - 80} y={H} width={40} height={cab.legs.height || 100}
            fill="#3f3f46" stroke={INK} strokeWidth="2" />
        </>
      )}

      {allShelves.map((y, i) => (
        <rect key={i} x={xC + geo.backIntrusion} y={fy(y + geo.t)}
          width={geo.shelfDepth} height={geo.t} fill={bf} stroke={INK} strokeWidth="2" />
      ))}

      {/* wsporniki pionowe przy elementach stalych */}
      {geo.levels.flatMap((lv) =>
        lv.cols
          .filter((c) => c.support)
          .map((c) => (
            <rect key={`sup${lv.i}-${c.j}`} x={D - c.support.d} y={fy(lv.y1)}
              width={c.support.d} height={lv.h} fill="none" stroke={INK}
              strokeWidth="1.5" strokeDasharray="8 6" />
          ))
      )}

      {cab.back !== "none" && (() => {
        const bcol = geo.backIsBoard
          ? (cab.backPos === "outside" && cab.backBoardMat !== "shelf" ? mat.board.color : (mat.shelf?.color || mat.board.color))
          : mat.back.color;
        // tyl po lewej (xC). Wewnatrz przy xC, na zewnatrz za korpusem (xC - tb)
        const px = geo.grooved
          ? xC + geo.grOff
          : geo.backIsBoard && geo.backPos === "outside"
          ? xC - geo.tb
          : xC;
        const py = geo.backIsBoard && geo.backPos === "inside" ? fy(geo.interior.y1) : 0;
        const ph = geo.backIsBoard && geo.backPos === "inside" ? geo.innerH : H;
        return (
          <rect x={px} y={py} width={geo.tb} height={ph}
            fill={bcol} stroke={INK} strokeWidth="2" />
        );
      })()}

      {geo.levels
        .filter((lv) => lv.cols.some((c) => c.count > 0))
        .map((lv) => (
          <rect key={lv.i} x={cab.frontMode === "overlay" ? D : D - geo.tf}
            y={fy(lv.frontHi)} width={geo.tf} height={Math.max(0, lv.frontHi - lv.frontLo)}
            fill={cab.realColors && cab.frontSameAsBoard !== false ? mat.board.color : mat.front.color} stroke={INK} strokeWidth="2" />
        ))}

      {/* prowadnice szuflad z boku — tylko kolumna przylegajaca do ogladanego
          boku; dalsze zaslania przegroda */}
      {showHardware && (() => {
        const seen = new Set();
        const out = [];
        geo.levels.forEach((lv) =>
          lv.cols.forEach((c, j) =>
            (c.kind === "drawers" && (sideRight ? j === lv.cols.length - 1 : j === 0)
              ? c.drawers || []
              : []
            ).forEach((dr) => {
              const k = `${Math.round(dr.rail.y0)}|${dr.rail.h}|${dr.rail.d}`;
              if (seen.has(k) || !dr.rail.d) return;
              seen.add(k);
              const rx0 = D - (dr.rail.setback || 0) - dr.rail.d;
              out.push(
                <g key={`srn${k}`}>
                  <rect x={rx0} y={fy(dr.rail.y0 + dr.rail.h)}
                    width={dr.rail.d} height={dr.rail.h}
                    fill="#8b8b93" fillOpacity="0.45" stroke={INK} strokeWidth="1.5" />
                  <text x={rx0 + 12} y={fy(dr.rail.y0 + dr.rail.h / 2) + 6}
                    fontSize="18" fill={INK} opacity="0.75" fontFamily="ui-monospace, monospace">
                    prowadnica NL {fmt(dr.rail.d)} / bok {fmt(dr.rail.h)}
                  </text>
                </g>
              );
            })
          )
        );
        return out;
      })()}

      {/* zawiasy z boku — tylko te przy ogladanym boku; zawiasy z dalszych
          kolumn albo z drugiej strony zaslania przegroda */}
      {showHardware && (() => {
        const seen = new Set();
        const out = [];
        geo.doors
          .filter((d) =>
            sideRight
              ? d.colLast && d.hingeSide === "right"
              : d.colJ === 0 && d.hingeSide === "left"
          )
          .forEach((d) =>
          (d.hingePts || []).forEach((hy) => {
            const k = Math.round(hy);
            if (seen.has(k)) return;
            seen.add(k);
            out.push(
              <g key={`shg${k}`}>
                <rect x={D - HINGE_D} y={fy(hy + HINGE_H / 2)} width={HINGE_D} height={HINGE_H}
                  rx="3" fill="#71717a" fillOpacity="0.8" stroke={INK} strokeWidth="1.5" />
                <line x1={D - HINGE_D} y1={fy(hy)} x2={D} y2={fy(hy)}
                  stroke="#fafaf9" strokeWidth="1.5" opacity="0.8" />
              </g>
            );
          })
        );
        return out;
      })()}

      {/* elementy stale (fix) — z boku widac ich zasieg na wysokosci */}
      {(() => {
        const fxx = cab.frontMode === "overlay" ? D : D - geo.tf;
        const ffc = cab.realColors && cab.frontSameAsBoard !== false ? mat.board.color : mat.front.color;
        const panels = [];
        geo.levels.forEach((lv) =>
          lv.cols.forEach((c) => {
            if (c.fix) panels.push({ k: `sf${lv.i}-${c.j}`, y: c.fix.y, h: c.fix.h });
            if (c.topFix) panels.push({ k: `stf${lv.i}-${c.j}`, y: c.topFix.y, h: c.topFix.h });
          })
        );
        const seen = new Set();
        return panels
          .filter((p) => {
            const key = `${Math.round(p.y)}|${Math.round(p.h)}`;
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
          })
          .map((p) => (
            <g key={p.k}>
              <rect x={fxx} y={fy(p.y + p.h)} width={geo.tf} height={p.h}
                fill={ffc} stroke={INK} strokeWidth="2" />
              <line x1={fxx} y1={fy(p.y + p.h)} x2={fxx + geo.tf} y2={fy(p.y)}
                stroke={INK} strokeWidth="1.2" opacity="0.5" />
              <line x1={fxx} y1={fy(p.y)} x2={fxx + geo.tf} y2={fy(p.y + p.h)}
                stroke={INK} strokeWidth="1.2" opacity="0.5" />
              <text x={fxx + geo.tf + 14} y={fy(p.y + p.h / 2) + 7} fontSize="20"
                fill={INK} opacity="0.7" fontFamily="ui-monospace, monospace">
                fix {fmt(p.h)}
              </text>
            </g>
          ));
      })()}

      {showDims && (
        <>
          <DimH x1={0} x2={D} y={-50} label={`${fmt(D)}`} />
          {hasFront && (
            <DimH x1={0} x2={frontFace} y={-110} label={`z drzwiami ${fmt(frontFace)}`} c={LINE} />
          )}
          <DimH x1={xC} x2={xC + geo.shelfDepth} y={H + 70} label={`półka ${fmt(geo.shelfDepth)}`} above={false} />
          <DimV y1={0} y2={H} x={-50} label={`${fmt(H)}`} />
        </>
      )}
      {geo.geoCuts.filter((gc) => gc.onBack && (gc.onLeft !== sideRight)).map((gc, ci) => (
        <g key={"cut" + ci}>
          {/* obszar wyciecia od tylu (tyl po lewej, x=xC) */}
          <rect x={xC} y={fy(gc.cy1)} width={gc.cdp} height={gc.cutH}
            fill={ERRC} opacity="0.14" stroke={ERRC} strokeWidth="1.5" strokeDasharray="6 4" />
          {/* maskownica pozioma zamyka wneke */}
          {gc.mask && (
            <rect x={xC + gc.cdp - geo.t} y={fy(gc.cy1)} width={geo.t} height={gc.cutH}
              fill={mat.shelf?.color || bf} stroke={INK} strokeWidth="2" opacity="0.9" />
          )}
        </g>
      ))}
      {/* elementy kolizyjne — widoczne w przekroju boku */}
      {(geo.geoObs || []).map((o, oi) => {
        const near = sideRight ? o.touchRight : o.touchLeft; // przy pokazywanym boku
        return (
          <g key={"sob" + oi} opacity={near ? 1 : 0.45}>
            <rect x={xC + o.oz0} y={fy(o.oy1)} width={o.od} height={o.oy1 - o.oy0}
              fill="#7c3aed" opacity="0.3" stroke="#6d28d9" strokeWidth="1.5" strokeDasharray="5 4" />
            {o.mask && !o.touchFront && (
              <rect x={xC + o.oz1} y={fy(o.maskTop ?? o.oy1)} width={geo.t} height={(o.maskTop ?? o.oy1) - o.oy0}
                fill={mat.shelf?.color || bf} stroke={INK} strokeWidth="2" />
            )}
            {o.mask && !o.touchBack && (
              <rect x={xC + o.oz0 - geo.t} y={fy(o.maskTop ?? o.oy1)} width={geo.t} height={(o.maskTop ?? o.oy1) - o.oy0}
                fill={mat.shelf?.color || bf} stroke={INK} strokeWidth="2" />
            )}
          </g>
        );
      })}

      {/* elementy wzmacniajace z boku (x = xC + glebokosc od tylu; tyl po lewej) */}
      {geo.levels.flatMap((lv) => lv.cols.flatMap((c) => (c.rails || []).map((r, ri) => (
        <rect key={`srail${lv.i}-${c.j}-${ri}`}
          x={xC + cd - (r.z0 + r.zLen)} y={fy(r.y1)} width={r.zLen} height={r.y1 - r.y0}
          fill={r.orient === "vertical" ? (mat.shelf?.color || bf) : bf}
          stroke={INK} strokeWidth="1.5" opacity="0.6" />
      ))))}
      <text x={D / 2} y={H + 125} textAnchor="middle" fontSize="22" fill={LINE}
        fontFamily="ui-monospace, monospace">{sideRight ? "prawy bok" : "lewy bok"} — tył po lewej, przód po prawej</text>
    </svg>
  );
}

/* ---------- widok 3D ---------- */

const VERTS = (x0, y0, z0, x1, y1, z1) => [
  { x: x0, y: y0, z: z0 }, { x: x1, y: y0, z: z0 },
  { x: x1, y: y1, z: z0 }, { x: x0, y: y1, z: z0 },
  { x: x0, y: y0, z: z1 }, { x: x1, y: y0, z: z1 },
  { x: x1, y: y1, z: z1 }, { x: x0, y: y1, z: z1 },
];
const QUADS = [
  [0, 1, 2, 3], [5, 4, 7, 6], [4, 0, 3, 7],
  [1, 5, 6, 2], [3, 2, 6, 7], [4, 5, 1, 0],
];

const rotAboutY = (p, ang, ox, oz) => {
  const c = Math.cos(ang), s2 = Math.sin(ang);
  const dx = p.x - ox, dz = p.z - oz;
  return { x: ox + dx * c - dz * s2, y: p.y, z: oz + dx * s2 + dz * c };
};

function Scene3D({ cab, geo, mat, open, yaw, pitch, angle }) {
  const t = geo.t;
  const cd = geo.carcassDepth;
  const { W, H } = cab;
  const bf = mat.board.color;
  const ff = cab.realColors && cab.frontSameAsBoard !== false ? mat.board.color : mat.front.color;

  /* --- lista bryl --- */
  const solids = [];
  const box = (x0, y0, z0, x1, y1, z1, color, transform, alpha, bold) => {
    let v = VERTS(x0, y0, z0, x1, y1, z1);
    if (transform) v = v.map(transform);
    solids.push({ v, color, alpha: alpha ?? 1, bold: !!bold });
  };

  // boki skrocone przy narozniku (w 3D z=cd to tyl, wiec ucinamy od strony cd)
  const cutSL = geo.cornerCut?.sideLeftDepth || 0;
  const cutSR = geo.cornerCut?.sideRightDepth || 0;
  box(0, geo.leftY0, 0, t, geo.leftY0 + geo.leftLen, cd - cutSL, bf);
  box(W - t, geo.rightY0, 0, W, geo.rightY0 + geo.rightLen, cd - cutSR, bf);
  if (geo.hasBot) box(geo.botX0, geo.bottomY, 0, geo.botX1, geo.bottomY + t, cd, bf);
  if (geo.hasTop)
    box(
      geo.topX0, H - t, geo.isBlat ? -geo.blat.overBack : 0,
      geo.topX1, H, geo.isBlat ? cd + geo.blat.overFront : cd, bf
    );

  if (cab.back !== "none") {
    const bz = geo.grooved ? cd - geo.grOff - geo.tb : cd;
    const grab = geo.grooved ? geo.grDep - geo.grPlay : 0;
    const bx0 = geo.grooved ? geo.interior.x0 - grab : 1;
    const bx1 = geo.grooved ? geo.interior.x1 + grab : W - 1;
    const by0 = geo.grooved ? geo.interior.y0 - grab : 1;
    const by1 = geo.grooved ? geo.interior.y1 + grab : H - 1;
    const px0 = Math.max(bx0, geo.cornerCut?.backLeftX ?? bx0);
    const px1 = Math.min(bx1, geo.cornerCut?.backRightX ?? bx1);
    box(px0, by0, bz, px1, by1, bz + geo.tb, mat.back.color);
  }

  geo.sepShelves.forEach((sh) =>
    box(geo.interior.x0, sh.y, geo.backIntrusion, geo.interior.x1, sh.y + t,
      geo.backIntrusion + geo.shelfDepth, bf)
  );
  geo.dividers.forEach((d) =>
    box(d.x, d.y0, geo.backIntrusion, d.x + t, d.y1, geo.backIntrusion + geo.dividerDepth, bf)
  );
  geo.levels.forEach((lv) =>
    lv.cols.forEach((c) => {
      c.shelves.forEach((sh) =>
        box(c.x0, sh.y, geo.backIntrusion, c.x1, sh.y + t,
          geo.backIntrusion + geo.shelfDepth, bf)
      );
      if (c.support && c.fix) {
        const sx = c.fix.side === "left" ? c.fix.x + c.fix.w - t : c.fix.x;
        box(sx, lv.y0, 0, sx + t, lv.y1, c.support.d, bf);
      }
    })
  );

  if (cab.plinth.on) {
    const sb = cab.plinth.setback || 0;
    // z=0 to przod korpusu; cokol siedzi z przodu, cofniety o setback w glab
    if (geo.plinthInBody)
      box(geo.interior.x0, 0, sb, geo.interior.x1, geo.plinthH, sb + t, bf);
    else box(0, -geo.plinthH, sb, W, 0, sb + t, bf);
  }
  geo.levels.forEach((lv) => lv.cols.forEach((c) => (c.rails || []).forEach((r) => {
    if (r.x1 > r.x0 && r.y1 > r.y0 && r.zLen > 0)
      box(r.x0, r.y0, r.z0, r.x1, r.y1, r.z0 + r.zLen, bf);
  })));
  if (cab.legs && cab.legs.on) {
    const lh = cab.legs.height || 100;
    const ins = 40;
    [[ins, ins], [W - ins - 40, ins], [ins, cd - ins - 40], [W - ins - 40, cd - ins - 40]]
      .forEach(([lx, lz]) => box(lx, -lh, lz, lx + 40, 0, lz + 40, "#3f3f46"));
  }

  (geo.geoObs || []).forEach((o) => {
    // w 3D z=cd to tyl, a geometria bryly ma tyl przy oz=0 — odwracamy
    box(o.ox0, o.oy0, cd - o.oz1, o.ox1, o.oy1, cd - o.oz0, "#7c3aed", null, 0.45);
  });
  geo.geoCuts.filter((gc) => gc.mask).forEach((gc) => {
    const smat = mat.shelf?.color || bf;
    // w 3D z=cd to TYL, geometria wneki ma tyl przy z=0 -> odwracamy: z3d = cd - z
    const zf = (z) => cd - z;
    const rx = gc.bx0, rw = gc.bx1 - gc.bx0;
    const ry = gc.bz0, rh = gc.bz1 - gc.bz0;
    const vVisible = gc.maskVisible === "vertical";
    const sideFace = gc.onLeft ? rx + t : rx + rw - t; // lico boku od wnetrza
    const vx0 = gc.onLeft ? rx + rw : rx - t;
    const vz0 = vVisible ? (gc.onBack ? ry : ry - t) : ry;
    const vz1 = vz0 + (vVisible ? rh + t : rh);
    box(vx0, gc.cy0, zf(vz1), vx0 + t, gc.cy1, zf(vz0), smat);
    // czolo — dochodzi do lica boku
    const hz0 = gc.onBack ? ry + rh : ry - t;
    const a0 = gc.onLeft ? sideFace : (vVisible ? rx : rx - t);
    const a1 = gc.onLeft ? (vVisible ? rx + rw : rx + rw + t) : sideFace;
    box(Math.min(a0, a1), gc.cy0, zf(hz0 + t), Math.max(a0, a1), gc.cy1, zf(hz0), smat);
  });
  (geo.geoObs || []).filter((o) => o.mask && o.maskChosen).forEach((o) => {
    const smat = mat.shelf?.color || bf;
    const zf = (z) => cd - z;
    const needL = !o.touchLeft, needR = !o.touchRight;
    const needBack = !o.touchBack, needFront = !o.touchFront;
    const eB = needBack ? t : 0, eF = needFront ? t : 0;
    const mTop = o.maskTop ?? o.oy1;
    if (needL) box(o.ox0 - t, o.oy0, zf(o.oz1 + eF), o.ox0, mTop, zf(o.oz0 - eB), smat);
    if (needR) box(o.ox1, o.oy0, zf(o.oz1 + eF), o.ox1 + t, mTop, zf(o.oz0 - eB), smat);
    if (needBack) box(o.ox0, o.oy0, zf(o.oz0), o.ox1, mTop, zf(o.oz0 - t), smat);
    if (needFront) box(o.ox0, o.oy0, zf(o.oz1 + t), o.ox1, mTop, zf(o.oz1), smat);
  });

  const tf = geo.tf;
  const handleBar = (d, z0trans, transform) => {
    if (!d.handle) return;
    const depth = 22; // ile uchwyt wystaje przed front
    const zA = z0trans - depth;
    const zB = z0trans;
    let hx0, hy0, hx1, hy1;
    if (d.type === "drawer") {
      const cy = d.y + d.h - Math.min(50, d.h / 2);
      hx0 = d.x + d.w / 2 - Math.min(120, d.w * 0.3);
      hx1 = d.x + d.w / 2 + Math.min(120, d.w * 0.3);
      hy0 = cy - 6;
      hy1 = cy + 6;
    } else {
      const cx = d.hingeSide === "left" ? d.x + d.w - 38 : d.x + 26;
      hx0 = cx - 6;
      hx1 = cx + 6;
      hy0 = d.y + d.h / 2 - Math.min(90, d.h * 0.25);
      hy1 = d.y + d.h / 2 + Math.min(90, d.h * 0.25);
    }
    box(hx0, hy0, zA, hx1, hy1, zB, "#3f3f46", transform, 1, false);
  };

  geo.doors.forEach((d) => {
    const z0 = cab.frontMode === "overlay" ? -tf : 0;
    const z1 = z0 + tf;
    if (d.type === "drawer") {
      const pull = open ? Math.min(220, (d.nl || 400) * 0.6) : 0;
      box(d.x, d.y, z0 - pull, d.x + d.w, d.y + d.h, z1 - pull, ff, null, 1, true);
      handleBar(d, z0 - pull, null);
      return;
    }
    const col = d.mirror ? mat.mirror.color : ff;
    if (d.type === "fix" || d.type === "blenda" || !open) {
      box(d.x, d.y, z0, d.x + d.w, d.y + d.h, z1, col, null, 1, true);
      if (d.type !== "fix" && d.type !== "blenda") handleBar(d, z0, null);
      return;
    }
    // os obrotu na wlasnej zewnetrznej krawedzi plyty, zeby nie wychodzila poza obrys
    const ang = (angle * Math.PI) / 180;
    const left = d.hingeSide === "left";
    const ox = left ? d.x : d.x + d.w;
    const sign = left ? -1 : 1;
    const rot = (p) => rotAboutY(p, sign * ang, ox, z0);
    box(d.x, d.y, z0, d.x + d.w, d.y + d.h, z1, col, rot, 0.85, true);
    handleBar(d, z0, rot);
  });

  /* --- rzut --- */
  const cyw = Math.cos(yaw), syw = Math.sin(yaw);
  const cp = Math.cos(pitch), sp = Math.sin(pitch);
  const cx = W / 2, cyc = H / 2, cz = cd / 2;
  const proj = (p) => {
    const x = p.x - cx, y = p.y - cyc, z = p.z - cz;
    const x1 = x * cyw + z * syw;
    const z1 = -x * syw + z * cyw;
    const y2 = y * cp - z1 * sp;
    const z2 = y * sp + z1 * cp;
    return { X: x1, Y: -y2, D: z2 };
  };

  const faces = [];
  solids.forEach((sol) => {
    const pv = sol.v.map(proj);
    QUADS.forEach((q) => {
      const pts = q.map((i) => pv[i]);
      const depth = pts.reduce((a, b) => a + b.D, 0) / 4;
      const a = pts[0], b = pts[1], c2 = pts[2];
      const ux = b.X - a.X, uy = b.Y - a.Y;
      const vx = c2.X - a.X, vy = c2.Y - a.Y;
      const area = ux * vy - uy * vx;
      const shade = 0.62 + 0.38 * Math.min(1, Math.abs(area) / 40000);
      faces.push({ pts, depth, color: sol.color, shade, alpha: sol.alpha, bold: sol.bold });
    });
  });
  faces.sort((a, b) => b.depth - a.depth);

  const xs = faces.flatMap((f) => f.pts.map((p) => p.X));
  const ys = faces.flatMap((f) => f.pts.map((p) => p.Y));
  const minX = Math.min(...xs), maxX = Math.max(...xs);
  const minY = Math.min(...ys), maxY = Math.max(...ys);
  const pad = 60;
  const vb = `${minX - pad} ${minY - pad} ${maxX - minX + 2 * pad} ${maxY - minY + 2 * pad}`;

  const tint = (hex, f) => {
    const n = parseInt(hex.replace("#", ""), 16);
    const r = Math.min(255, Math.round(((n >> 16) & 255) * f));
    const g2 = Math.min(255, Math.round(((n >> 8) & 255) * f));
    const b2 = Math.min(255, Math.round((n & 255) * f));
    return `rgb(${r},${g2},${b2})`;
  };

  return (
    <svg viewBox={vb} className="w-full h-auto select-none" style={{ maxHeight: 540 }}>
      {faces.map((f, i) => (
        <polygon key={i} points={f.pts.map((p) => `${p.X},${p.Y}`).join(" ")}
          fill={tint(f.color, f.shade)} stroke={INK} strokeWidth={f.bold ? 3 : 1.2}
          strokeLinejoin="round" opacity={f.alpha} />
      ))}
    </svg>
  );
}

/* ---------- kontrolki ---------- */

const Field = ({ label, children, hint }) => (
  <label className="block">
    <span className="block text-xs uppercase tracking-wider text-stone-500 mb-1">{label}</span>
    {children}
    {hint && <span className="block text-xs text-stone-400 mt-1">{hint}</span>}
  </label>
);

const Num = ({ value, onChange, min, max, suffix = "mm" }) => (
  <div className="flex items-center gap-2">
    <input type="number" value={value} min={min} max={max} step={1}
      onChange={(e) => onChange(e.target.value === "" ? "" : Math.round(Number(e.target.value)))}
      className="w-full rounded border border-stone-300 bg-white px-2 py-1.5 font-mono text-sm text-stone-900 focus:border-teal-600 focus:outline-none focus:ring-1 focus:ring-teal-600" />
    <span className="text-xs text-stone-400 shrink-0">{suffix}</span>
  </div>
);

const AutoNum = ({ value, placeholder, onChange, fixed, warn }) => (
  <input type="number" step={1} value={value ?? ""} placeholder={placeholder}
    onChange={(e) => onChange(e.target.value)}
    className={
      "w-full rounded border px-2 py-1.5 font-mono text-sm focus:outline-none focus:ring-1 focus:ring-teal-600 " +
      (fixed
        ? "border-teal-600 bg-teal-50 text-stone-900"
        : warn
        ? "border-amber-400 bg-white text-stone-900 placeholder:text-amber-600"
        : "border-stone-300 bg-white text-stone-900 placeholder:text-stone-400")
    } />
);

const Seg = ({ value, onChange, options }) => (
  <div className="flex rounded border border-stone-300 overflow-hidden">
    {options.map((o) => (
      <button key={o.v} onClick={() => onChange(o.v)}
        className={"flex-1 px-2 py-1.5 text-xs transition-colors " +
          (value === o.v ? "bg-teal-700 text-white" : "bg-white text-stone-600 hover:bg-stone-100")}>
        {o.l}
      </button>
    ))}
  </div>
);

const Check = ({ checked, onChange, label }) => (
  <label className="flex items-center gap-2 cursor-pointer select-none">
    <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)}
      className="h-4 w-4 accent-teal-700" />
    <span className="text-sm text-stone-700">{label}</span>
  </label>
);

/* laczy identyczne formatki w jedna pozycje listy */
const groupPanels = (panels) => {
  const map = new Map();
  panels.forEach((p) => {
    const e = p.edges;
    const key = [p.matKey, p.a, p.b, e.a1, e.a2, e.b1, e.b2, p.name].join("|");
    if (map.has(key)) map.get(key).qty += p.qty;
    else map.set(key, { ...p });
  });
  return [...map.values()];
};

const edgeText = (p) => {
  const out = [];
  if (p.edges.a1) out.push("przód " + fmt(p.a));
  if (p.edges.a2) out.push("tył " + fmt(p.a));
  if (p.edges.b1) out.push("bok " + fmt(p.b));
  if (p.edges.b2) out.push("bok " + fmt(p.b));
  return out.length ? out.join(", ") : "—";
};

const Card = ({ title, children, right, collapsible = false, defaultOpen = true }) => {
  const [open, setOpen] = useState(defaultOpen);
  const shown = collapsible ? open : true;
  return (
    <section className="rounded-lg border border-stone-200 bg-white">
      <header
        className={`flex items-center justify-between gap-2 px-4 py-2.5 ${
          shown ? "border-b border-stone-200" : ""
        }`}>
        {collapsible ? (
          <button type="button" onClick={() => setOpen(!open)}
            title={open ? "Zwiń sekcję" : "Rozwiń sekcję"}
            className="flex min-w-0 flex-1 items-center gap-2 text-left">
            <span className={`text-[10px] leading-none text-stone-400 transition-transform ${open ? "" : "-rotate-90"}`}>
              ▼
            </span>
            <h2 className="truncate text-sm font-semibold tracking-tight text-stone-800">{title}</h2>
          </button>
        ) : (
          <h2 className="min-w-0 truncate text-sm font-semibold tracking-tight text-stone-800">{title}</h2>
        )}
        {right}
      </header>
      {shown && <div className="p-4 space-y-4">{children}</div>}
    </section>
  );
};

const NoteLine = ({ text, color, icon, editLevels, cab }) => {
  const [txt, ...actions] = text.split("|");
  const btns = actions.map((action) => {
    if (action.startsWith("fixgap:")) {
      const [, li, j, val] = action.split(":");
      return { label: `Zwiększ luz do ${val} mm`, run: () => editLevels((L) => (L[+li].cols[+j].gapBetween = +val)) };
    }
    if (action.startsWith("fixnl:")) {
      const [, li, j, k, val] = action.split(":");
      return { label: `Zmień głębokość prowadnic do NL ${val}`, run: () => editLevels((L) => (L[+li].cols[+j].drawers[+k].nl = +val)) };
    }
    if (action.startsWith("fixsup:")) {
      const [, li, j] = action.split(":");
      return {
        label: "Dobuduj wspornik pionowy",
        run: () => editLevels((L) => {
          const f = L[+li].cols[+j].fix || (L[+li].cols[+j].fix = { side: "none", w: 60 });
          f.support = true;
          if (!(f.supportDepth > 0)) f.supportDepth = 100;
        }),
      };
    }
    if (action.startsWith("fixnodoor:")) {
      const [, li, j] = action.split(":");
      return {
        label: "Usuń kolidujące skrzydło",
        run: () => editLevels((L) => {
          const col = L[+li].cols[+j];
          const n = Math.max(0, Math.round(col.doors ?? 0));
          if (n <= 0) return;
          // koliduje skrzydlo od strony elementu stalego — usuwamy tylko je
          const k = (col.fix || {}).side === "right" ? n - 1 : 0;
          col.doors = n - 1;
          ["doorWidths", "mirrors", "handles", "hinges"].forEach((key) => {
            if (Array.isArray(col[key]) && col[key].length > k) col[key].splice(k, 1);
          });
          // po usunieciu jednego z dwoch skrzydel zawias wraca na auto
          if (col.doors === 1) col.hinge = "auto";
        }),
      };
    }
    return null;
  }).filter(Boolean);
  return (
    <li className="flex items-start gap-2 text-sm" style={{ color }}>
      <span className="font-mono">{icon}</span>
      <span>
        {txt}
        {btns.map((btn, i) => (
          <button key={i} onClick={btn.run}
            className="ml-2 rounded bg-teal-600 px-2 py-0.5 text-xs font-medium text-white hover:bg-teal-700">
            {btn.label}
          </button>
        ))}
      </span>
    </li>
  );
};

const MiniBtn = ({ onClick, children, tone = "plain", title }) => (
  <button onClick={onClick} title={title}
    className={"rounded border px-1.5 py-0.5 text-[11px] transition-colors " +
      (tone === "on"
        ? "border-teal-700 bg-teal-700 text-white"
        : "border-stone-200 bg-white text-stone-500 hover:border-stone-400 hover:text-stone-800")}>
    {children}
  </button>
);

/* ---------- trwaly zapis projektu ----------
   W artefakcie Claude dostepne jest window.storage; w zwyklej przegladarce
   (standalone.html, GitHub Pages, dwuklik, Vite) go nie ma, wiec uzywamy
   localStorage. Interfejs ujednolicony: get -> {value}|null, set(key, value). */
const projectStore = (() => {
  const ws = typeof window !== "undefined" ? window.storage : null;
  if (ws && typeof ws.get === "function" && typeof ws.set === "function") return ws;
  return {
    async get(key) {
      try {
        const value = localStorage.getItem(key);
        return value == null ? null : { value };
      } catch (e) {
        return null;
      }
    },
    async set(key, value) {
      localStorage.setItem(key, value);
    },
  };
})();

/* ---------- rozkrój formatek na arkuszach ----------
   Ciecie gilotynowe: kazde ciecie przechodzi przez caly pozostaly kawalek.
   Wolne pola powstaja wylacznie z takich ciec i nigdy sie nie nakladaja,
   wiec kazdy uklad da sie wyciac prostymi cieciami piły panelowej. */

const SHEET_W = 2800;
const SHEET_H = 2100;
const KERF = 3; // rzaz piły

const rectFits = (w, h, r) => w <= r.w + 1e-9 && h <= r.h + 1e-9;

const RECT_RULES = {
  "ciasny krótszy bok": (r, w, h) => Math.min(r.w - w, r.h - h) * 1e6 + Math.max(r.w - w, r.h - h),
  "ciasny dłuższy bok": (r, w, h) => Math.max(r.w - w, r.h - h) * 1e6 + Math.min(r.w - w, r.h - h),
  "najmniejszy odpad": (r, w, h) => r.w * r.h - w * h,
};

function pickFreeRect(free, pw, ph, rotatable, rule) {
  let best = null;
  free.forEach((r, i) => {
    [[pw, ph, false], [ph, pw, true]].forEach(([w, h, rot]) => {
      if (rot && (!rotatable || pw === ph)) return;
      if (!rectFits(w, h, r)) return;
      const score = rule(r, w, h);
      if (!best || score < best.score) best = { i, w, h, rot, score };
    });
  });
  return best;
}

function splitFreeRect(r, w, h, mode) {
  const out = [];
  const rw = r.w - w - KERF;
  const rh = r.h - h - KERF;
  if (mode === "h") {
    if (rw > 0) out.push({ x: r.x + w + KERF, y: r.y, w: rw, h });
    if (rh > 0) out.push({ x: r.x, y: r.y + h + KERF, w: r.w, h: rh });
  } else {
    if (rw > 0) out.push({ x: r.x + w + KERF, y: r.y, w: rw, h: r.h });
    if (rh > 0) out.push({ x: r.x, y: r.y + h + KERF, w, h: rh });
  }
  return out;
}

const MIN_USEFUL = 150; // ponizej tego resztka to juz scinek

/* Sasiadujace wolne pola, ktorych nikt nie przecial, sa fizycznie jednym
   kawalkiem — scalamy je, zeby zrzut liczyl sie jako calosc. Szczelina rowna
   rzazowi tez sie scala: skoro nie ma tam formatki, nie ma i ciecia. */
function mergeFree(free) {
  const rs = free.map((r) => ({ ...r }));
  let again = true;
  while (again) {
    again = false;
    outer: for (let i = 0; i < rs.length; i++) {
      for (let j = i + 1; j < rs.length; j++) {
        const A = rs[i], B = rs[j];
        const near = (u, v) => Math.abs(u - v) <= KERF + 1e-6;
        if (Math.abs(A.x - B.x) < 1e-6 && Math.abs(A.w - B.w) < 1e-6) {
          const [t, d] = A.y <= B.y ? [A, B] : [B, A];
          if (near(t.y + t.h, d.y)) {
            rs[i] = { x: t.x, y: t.y, w: t.w, h: d.y + d.h - t.y };
            rs.splice(j, 1); again = true; break outer;
          }
        }
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
  return rs.sort((a2, b2) => b2.w * b2.h - a2.w * a2.h);
}

const usefulOf = (rects) => rects.filter((r) => r.w >= MIN_USEFUL && r.h >= MIN_USEFUL);

function nestPass(parts, sheetW, sheetH, mode, rule) {
  const sheets = [];
  const left = parts.slice();
  while (left.length) {
    const sheet = { free: [{ x: 0, y: 0, w: sheetW, h: sheetH }], parts: [], cuts: 0 };
    let placedAny = false;
    for (let k = 0; k < left.length; ) {
      const p = left[k];
      const hit = pickFreeRect(sheet.free, p.w, p.h, p.rotatable, rule);
      if (!hit) { k++; continue; }
      const r = sheet.free[hit.i];
      sheet.parts.push({ name: p.name, x: r.x, y: r.y, w: hit.w, h: hit.h, rot: hit.rot });
      const pieces = splitFreeRect(r, hit.w, hit.h, mode);
      sheet.cuts += pieces.length;
      sheet.free.splice(hit.i, 1, ...pieces);
      left.splice(k, 1);
      placedAny = true;
    }
    if (!placedAny) return { sheets, rejected: left.slice() };
    sheet.offcuts = mergeFree(sheet.free);
    sheets.push(sheet);
  }
  return { sheets, rejected: [] };
}

/* input: [{ name, qty, a, b, rotatable }] — a x b w mm */
function packSheets(input, { sheetW = SHEET_W, sheetH = SHEET_H } = {}) {
  const parts = [];
  input.forEach((it) => {
    for (let i = 0; i < it.qty; i++)
      parts.push({ name: it.name, w: it.a, h: it.b, rotatable: it.rotatable !== false });
  });
  if (!parts.length)
    return { sheets: [], rejected: [], usedPct: 0, cuts: 0, sheetW, sheetH, strategy: "" };

  const ar = (p) => p.w * p.h;
  const orders = {
    "dłuższy bok malejąco": (a, b) => Math.max(b.w, b.h) - Math.max(a.w, a.h) || ar(b) - ar(a),
    "pole malejąco": (a, b) => ar(b) - ar(a) || Math.max(b.w, b.h) - Math.max(a.w, a.h),
    "szerokość malejąco": (a, b) => b.w - a.w || b.h - a.h,
    "wysokość malejąco": (a, b) => b.h - a.h || b.w - a.w,
  };

  let best = null;
  let anyRun = null;
  Object.entries(orders).forEach(([label, cmp]) => {
    const sorted = parts.slice().sort(cmp);
    ["h", "v"].forEach((mode) => {
      Object.entries(RECT_RULES).forEach(([ruleName, rule]) => {
        const res = nestPass(sorted, sheetW, sheetH, mode, rule);
        const used = res.sheets.reduce((s, sh) => s + sh.parts.reduce((q, p) => q + p.w * p.h, 0), 0);
        const cuts = res.sheets.reduce((s, sh) => s + sh.cuts, 0);
        const total = Math.max(1, res.sheets.length) * sheetW * sheetH;
        // o jakosci decyduje jeden duzy zrzut, a nie suma scinkow
        const allOff = res.sheets.flatMap((sh) => usefulOf(sh.offcuts || []));
        const biggest = allOff.reduce((m, r) => Math.max(m, r.w * r.h), 0);
        const usefulArea = allOff.reduce((q, r) => q + r.w * r.h, 0);
        const scraps = res.sheets.reduce(
          (q, sh) => q + (sh.offcuts || []).filter((r) => r.w < MIN_USEFUL || r.h < MIN_USEFUL).length,
          0
        );
        const cand = { ...res, used, cuts, total, label, mode, ruleName, biggest, usefulArea, scraps };
        if (!anyRun) anyRun = cand;
        if (res.rejected.length) return;
        // 1. najmniej arkuszy  2. największy pojedynczy zrzut  3. najwięcej
        // użytecznej resztki  4. najmniej ścinków  5. najmniej cięć
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
    usefulArea: off.reduce((q, r) => q + r.w * r.h, 0),
    usefulCount: off.length,
    sheets: win.sheets,
    rejected: win.rejected,
    usedPct: (win.used / win.total) * 100,
    cuts: win.cuts,
    usedArea: win.used,
    strategy: `${win.label} / ${win.mode === "h" ? "podział poziomy" : "podział pionowy"} / ${win.ruleName}`,
    sheetW,
    sheetH,
  };
}

/* dzieli formatki na grupy materialowe i liczy rozkroj dla kazdej */
function buildCutPlan(rows) {
  const groups = new Map();
  rows.forEach((r) => {
    const k = r.matLabel;
    if (!groups.has(k)) groups.set(k, []);
    groups.get(k).push(r);
  });
  return [...groups.entries()].map(([matLabel, list]) => ({
    matLabel,
    ...packSheets(list),
  }));
}

/* rysunek jednego arkusza z ulozonymi formatkami */
function SheetPlan({ sheet, sheetW, sheetH, index, total }) {
  const pad = 40;
  const vb = `${-pad} ${-pad} ${sheetW + 2 * pad} ${sheetH + 2 * pad + 60}`;
  const used = sheet.parts.reduce((s, p) => s + p.w * p.h, 0);
  const pct = (used / (sheetW * sheetH)) * 100;
  return (
    <div className="rp-keep space-y-1">
      <div className="flex flex-wrap items-baseline justify-between gap-2 text-xs">
        <span className="font-medium text-stone-700">
          Arkusz {index + 1} z {total}
        </span>
        <span className="font-mono text-stone-500">
          {sheet.parts.length} szt. · wykorzystane {fmt(pct)}%
        </span>
      </div>
      <svg viewBox={vb} className="w-full h-auto" style={{ maxHeight: 420 }}>
        <rect x="0" y="0" width={sheetW} height={sheetH} fill="#fafaf9" stroke={INK} strokeWidth="6" />
        {sheet.parts.map((p, i) => (
          <g key={i}>
            <rect x={p.x} y={p.y} width={p.w} height={p.h}
              fill={mixName(p.name)} stroke={INK} strokeWidth="4" />
            {p.w > 190 && p.h > 90 && (
              <>
                <text x={p.x + p.w / 2} y={p.y + p.h / 2 - 6} textAnchor="middle"
                  fontSize={Math.min(56, Math.max(30, Math.min(p.w, p.h) / 4))}
                  fill={INK} fontFamily="ui-monospace, monospace">
                  {fmt(p.w)}×{fmt(p.h)}
                </text>
                <text x={p.x + p.w / 2} y={p.y + p.h / 2 + 44} textAnchor="middle"
                  fontSize="34" fill={INK} opacity="0.65">
                  {p.name}{p.rot ? " ↻" : ""}
                </text>
              </>
            )}
          </g>
        ))}
        {(sheet.offcuts || [])
          .filter((o) => o.w >= MIN_USEFUL && o.h >= MIN_USEFUL)
          .map((o, i) => (
            <g key={"off" + i}>
              <rect x={o.x} y={o.y} width={o.w} height={o.h}
                fill="#14532d" fillOpacity="0.07" stroke="#15803d"
                strokeWidth="4" strokeDasharray="26 18" />
              {o.w > 260 && o.h > 130 && (
                <text x={o.x + o.w / 2} y={o.y + o.h / 2 + 12} textAnchor="middle"
                  fontSize="46" fill="#15803d" fontFamily="ui-monospace, monospace">
                  zrzut {fmt(o.w)}×{fmt(o.h)}
                </text>
              )}
            </g>
          ))}
        <text x={sheetW / 2} y={sheetH + 52} textAnchor="middle" fontSize="44"
          fill={LINE} fontFamily="ui-monospace, monospace">
          {fmt(sheetW)} × {fmt(sheetH)} mm, rzaz {KERF} mm
        </text>
      </svg>
    </div>
  );
}

/* stabilny, jasny kolor tla dla nazwy formatki — zeby jednakowe elementy
   mialy ten sam odcien i uklad dalo sie czytac jednym rzutem oka */
const mixName = (name) => {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) % 360;
  return `hsl(${h}, 42%, 82%)`;
};

/* ---------- zestawienie do druku / PDF ---------- */

const PRINT_CSS = `
@media screen { .print-only { display: none !important; } }
@media print {
  .print-hide { display: none !important; }
  .print-only { display: block !important; }
  @page { size: A4 portrait; margin: 10mm; }
  html, body { background: #fff !important; }
  .rp-page { break-after: page; page-break-after: always; }
  .rp-page:last-child { break-after: auto; page-break-after: auto; }
  .rp-keep { break-inside: avoid; page-break-inside: avoid; }
  .rp-tbl { width: 100%; border-collapse: collapse; font-size: 9pt; }
  .rp-tbl th, .rp-tbl td { border: 1px solid #d6d3d1; padding: 3px 5px; text-align: left; }
  .rp-tbl th { background: #f5f5f4; font-weight: 600; }
  .rp-tbl td.num, .rp-tbl th.num { text-align: right; font-family: ui-monospace, monospace; }
}
`;

function ReportSheet({ cab, mat, projectName, index, total }) {
  const geo = useMemo(() => computeGeo(cab, mat), [cab, mat]);
  const panels = useMemo(() => groupPanels(geo.panels), [geo.panels]);
  const realCab = useMemo(() => ({ ...cab, realColors: true }), [cab]);
  const totalQty = panels.reduce((s, p) => s + p.qty, 0);
  const edgeMm = panels.reduce((s, p) => {
    const e = p.edges;
    return s + p.qty * ((e.a1 ? p.a : 0) + (e.a2 ? p.a : 0) + (e.b1 ? p.b : 0) + (e.b2 ? p.b : 0));
  }, 0);

  const head = (
    <div style={{ borderBottom: "2px solid #292524", marginBottom: 8, paddingBottom: 4 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <strong style={{ fontSize: "13pt" }}>{projectName}</strong>
        <span style={{ fontSize: "9pt", color: "#57534e" }}>
          {cab.name} {total > 1 ? `(${index + 1} z ${total})` : ""}
        </span>
      </div>
      <div style={{ fontSize: "9pt", color: "#57534e" }}>
        {fmt(cab.W)} × {fmt(cab.H)} × {fmt(cab.D)} mm
      </div>
      {(cab.note || "").trim() && (
        <div style={{ fontSize: "9pt", marginTop: 3, whiteSpace: "pre-wrap" }}>
          <strong>Uwagi:</strong> {cab.note}
        </div>
      )}
    </div>
  );

  const box = (title, node) => (
    <div className="rp-keep" style={{ border: "1px solid #e7e5e4", padding: 6 }}>
      <div style={{ fontSize: "8.5pt", fontWeight: 600, marginBottom: 3, color: "#44403c" }}>{title}</div>
      {node}
    </div>
  );

  return (
    <>
      <section className="rp-page">
        {head}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          {box("Widok zamknięty — wymiary, szczeliny, kolory",
            <FrontView cab={realCab} geo={geo} mat={mat} open={false} showDims showGaps
              showLabels={false} showHardware={false} />)}
          {box("Widok otwarty — wymiary i okucia",
            <FrontView cab={cab} geo={geo} mat={mat} open showDims showGaps={false}
              showLabels={false} showHardware />)}
          {box("Widok z góry — wymiary i okucia",
            <TopView cab={cab} geo={geo} mat={mat} showDims showShelves showHardware />)}
          {box("Widok z tyłu — wymiary",
            <RearView cab={cab} geo={geo} mat={mat} showDims />)}
        </div>
      </section>

      <section className="rp-page">
        {head}
        <div style={{ fontSize: "10pt", fontWeight: 600, margin: "6px 0 4px" }}>
          Formatki do zamówienia
        </div>
        <table className="rp-tbl">
          <thead>
            <tr>
              <th>Element</th>
              <th>Płyta</th>
              <th className="num">Długość</th>
              <th className="num">Szerokość</th>
              <th className="num">Szt.</th>
              <th>Oklejanie PCV 2 mm</th>
              <th>Słoje</th>
            </tr>
          </thead>
          <tbody>
            {panels.map((p, i) => (
              <tr key={i}>
                <td>{p.name}</td>
                <td>{mat[p.matKey].name}</td>
                <td className="num">{fmt(p.a)}</td>
                <td className="num">{fmt(p.b)}</td>
                <td className="num">{p.qty}</td>
                <td>{edgeText(p)}</td>
                <td>{p.matKey === "back" ? "—" : cab.grainMatters ? "wzdłuż dł." : "dowolnie"}</td>
              </tr>
            ))}
            <tr>
              <td colSpan={4} style={{ fontWeight: 600 }}>Razem</td>
              <td className="num" style={{ fontWeight: 600 }}>{totalQty}</td>
              <td colSpan={2}>obrzeże {fmt(edgeMm / 1000)} mb</td>
            </tr>
          </tbody>
        </table>

        <div style={{ fontSize: "10pt", fontWeight: 600, margin: "10px 0 4px" }}>
          Produkty do zamówienia
        </div>
        {geo.hardware.length === 0 ? (
          <div style={{ fontSize: "9pt", color: "#78716c" }}>Brak okuć.</div>
        ) : (
          <table className="rp-tbl">
            <thead>
              <tr>
                <th>Produkt</th>
                <th>Specyfikacja</th>
                <th className="num">Ilość</th>
              </tr>
            </thead>
            <tbody>
              {geo.hardware.map((h, i) => (
                <tr key={i}>
                  <td>{h.name}</td>
                  <td>{h.spec}</td>
                  <td className="num">{h.qty} {h.unit}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </>
  );
}

function PrintReport({ project }) {
  const name = (project.name || "").trim() || DEFAULT_PROJECT_NAME;
  return (
    <div className="print-only" style={{ color: "#1c1917", fontFamily: "ui-sans-serif, system-ui, sans-serif" }}>
      <style>{PRINT_CSS}</style>
      {project.items.map((it, i) => (
        <ReportSheet key={i} cab={it.cab} mat={it.mat} projectName={name}
          index={i} total={project.items.length} />
      ))}
      {project.items.length > 1 && <ReportProjectSheet project={project} projectName={name} />}
      <ReportCutPlan project={project} projectName={name} />
    </div>
  );
}

/* rozkroj na arkuszach — ostatnie strony zestawienia */
function ReportCutPlan({ project, projectName }) {
  const groups = useMemo(() => {
    const rows = [];
    project.items.forEach((it) => {
      const g = computeGeo(it.cab, it.mat);
      groupPanels(g.panels).forEach((p) => {
        rows.push({
          name: p.name,
          qty: p.qty,
          a: p.a,
          b: p.b,
          rotatable: p.matKey === "back" || !it.cab.grainMatters,
          matLabel: (it.mat[p.matKey] || {}).name || p.matKey,
        });
      });
    });
    // te same pozycje z roznych szafek lacza sie w jedna
    const merged = new Map();
    rows.forEach((r) => {
      const k = [r.matLabel, r.a, r.b, r.name, r.rotatable].join("|");
      if (merged.has(k)) merged.get(k).qty += r.qty;
      else merged.set(k, { ...r });
    });
    return buildCutPlan([...merged.values()]);
  }, [project]);

  if (!groups.length) return null;
  return (
    <section className="rp-page">
      <div style={{ borderBottom: "2px solid #292524", marginBottom: 8, paddingBottom: 4 }}>
        <strong style={{ fontSize: "13pt" }}>{projectName}</strong>
        <div style={{ fontSize: "9pt", color: "#57534e" }}>
          Rozkrój na płycie — arkusz {fmt(SHEET_W)} × {fmt(SHEET_H)} mm, rzaz {KERF} mm
        </div>
      </div>
      <table className="rp-tbl">
        <thead>
          <tr>
            <th>Płyta</th>
            <th className="num">Arkuszy</th>
            <th className="num">Wykorzystanie</th>
            <th className="num">Cięć</th>
            <th>Największy zrzut</th>
          </tr>
        </thead>
        <tbody>
          {groups.map((g, i) => (
            <tr key={i}>
              <td>{g.matLabel}</td>
              <td className="num">{g.sheets.length}</td>
              <td className="num">{fmt(g.usedPct)}%</td>
              <td className="num">{g.cuts}</td>
              <td>{g.biggestRect ? `${fmt(g.biggestRect.w)} × ${fmt(g.biggestRect.h)} mm` : "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {groups.map((g, gi) => (
        <div key={gi} style={{ marginTop: 10 }}>
          <div style={{ fontSize: "10pt", fontWeight: 600, marginBottom: 4 }}>{g.matLabel}</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            {g.sheets.map((sh, i) => (
              <div key={i} className="rp-keep" style={{ border: "1px solid #e7e5e4", padding: 6 }}>
                <SheetPlan sheet={sh} sheetW={g.sheetW} sheetH={g.sheetH}
                  index={i} total={g.sheets.length} />
              </div>
            ))}
          </div>
        </div>
      ))}
    </section>
  );
}

/* zbiorcza lista formatek calego projektu — tylko przy kilku szafkach */
function ReportProjectSheet({ project, projectName }) {
  const rows = useMemo(() => {
    const map = new Map();
    project.items.forEach((it) => {
      const g = computeGeo(it.cab, it.mat);
      g.panels.forEach((p) => {
        const m = it.mat[p.matKey] || {};
        const e = p.edges;
        const key = [m.name, m.thickness, m.color, p.matKey, p.a, p.b, e.a1, e.a2, e.b1, e.b2, p.name].join("|");
        if (map.has(key)) map.get(key).qty += p.qty;
        else map.set(key, { ...p, matName: m.name || p.matKey });
      });
    });
    return [...map.values()];
  }, [project]);
  const totalQty = rows.reduce((s, p) => s + p.qty, 0);
  const edgeMm = rows.reduce((s, p) => {
    const e = p.edges;
    return s + p.qty * ((e.a1 ? p.a : 0) + (e.a2 ? p.a : 0) + (e.b1 ? p.b : 0) + (e.b2 ? p.b : 0));
  }, 0);
  const area = {};
  rows.forEach((p) => { area[p.matName] = (area[p.matName] || 0) + (p.qty * p.a * p.b) / 1e6; });
  const hardware = useMemo(() => {
    const map = new Map();
    project.items.forEach((it) => {
      computeGeo(it.cab, it.mat).hardware.forEach((h) => {
        const k = `${h.name}|${h.spec}|${h.unit}`;
        if (map.has(k)) map.get(k).qty += h.qty;
        else map.set(k, { ...h });
      });
    });
    return [...map.values()];
  }, [project]);

  return (
    <section className="rp-page">
      <div style={{ borderBottom: "2px solid #292524", marginBottom: 8, paddingBottom: 4 }}>
        <strong style={{ fontSize: "13pt" }}>{projectName}</strong>
        <div style={{ fontSize: "9pt", color: "#57534e" }}>
          Formatki całego projektu — {project.items.length} szafki
        </div>
      </div>
      <table className="rp-tbl">
        <thead>
          <tr>
            <th>Element</th>
            <th>Płyta</th>
            <th className="num">Długość</th>
            <th className="num">Szerokość</th>
            <th className="num">Szt.</th>
            <th>Oklejanie PCV 2 mm</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((p, i) => (
            <tr key={i}>
              <td>{p.name}</td>
              <td>{p.matName}</td>
              <td className="num">{fmt(p.a)}</td>
              <td className="num">{fmt(p.b)}</td>
              <td className="num">{p.qty}</td>
              <td>{edgeText(p)}</td>
            </tr>
          ))}
          <tr>
            <td colSpan={4} style={{ fontWeight: 600 }}>Razem</td>
            <td className="num" style={{ fontWeight: 600 }}>{totalQty}</td>
            <td>obrzeże {fmt(edgeMm / 1000)} mb</td>
          </tr>
        </tbody>
      </table>
      <div style={{ fontSize: "9pt", marginTop: 6 }}>
        {Object.entries(area).map(([k, v]) => (
          <div key={k}>{k}: {fmt(v)} m²</div>
        ))}
      </div>

      <div style={{ fontSize: "10pt", fontWeight: 600, margin: "10px 0 4px" }}>
        Produkty całego projektu
      </div>
      {hardware.length === 0 ? (
        <div style={{ fontSize: "9pt", color: "#78716c" }}>Brak okuć.</div>
      ) : (
        <table className="rp-tbl">
          <thead>
            <tr>
              <th>Produkt</th>
              <th>Specyfikacja</th>
              <th className="num">Ilość</th>
            </tr>
          </thead>
          <tbody>
            {hardware.map((h, i) => (
              <tr key={i}>
                <td>{h.name}</td>
                <td>{h.spec}</td>
                <td className="num">{h.qty} {h.unit}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}

/* ---------- aplikacja ---------- */

export default function App() {
  // projekt = lista niezaleznych szafek (kazda ma swoj cab i mat) + aktywny indeks
  const [project, setProjectRaw] = useState({
    name: DEFAULT_PROJECT_NAME,
    prices: {},
    items: [{ cab: defaultCab, mat: defaultMaterials }],
    active: 0,
  });
  const cab = project.items[project.active].cab;
  const mat = project.items[project.active].mat;
  const histRef = useRef({ past: [], future: [] });
  const [histLen, setHistLen] = useState({ undo: 0, redo: 0 });

  // kazda zmiana projektu przechodzi tu — zapisuje poprzedni stan do historii
  const setProject = useCallback((next) => {
    setProjectRaw((prev) => {
      const resolved = typeof next === "function" ? next(prev) : next;
      if (resolved === prev) return prev;
      const h = histRef.current;
      h.past.push(prev);
      if (h.past.length > 60) h.past.shift();
      h.future = [];
      setHistLen({ undo: h.past.length, redo: 0 });
      return resolved;
    });
  }, []);

  // edycja aktywnej szafki (cab) oraz jej materialow (mat) — przez historie projektu
  const setCab = useCallback((next) => {
    setProject((p) => {
      const it = p.items[p.active];
      const resolved = typeof next === "function" ? next(it.cab) : next;
      if (resolved === it.cab) return p;
      const items = p.items.slice();
      items[p.active] = { ...it, cab: resolved };
      return { ...p, items };
    });
  }, [setProject]);

  const setMat = useCallback((next) => {
    setProject((p) => {
      const it = p.items[p.active];
      const resolved = typeof next === "function" ? next(it.mat) : next;
      if (resolved === it.mat) return p;
      const items = p.items.slice();
      items[p.active] = { ...it, mat: resolved };
      return { ...p, items };
    });
  }, [setProject]);

  // zastepuje caly projekt (wczytanie / nowy) i czysci historie
  const replaceProject = useCallback((proj) => {
    histRef.current = { past: [], future: [] };
    setHistLen({ undo: 0, redo: 0 });
    setProjectRaw(proj);
  }, []);

  // przelaczanie / dodawanie / usuwanie szafek
  const switchCabinet = useCallback((i) => setProject((p) => (i === p.active ? p : { ...p, active: i })), [setProject]);
  const addCabinet = useCallback((tplId) => setProject((p) => {
    // nastepny numer = max z istniejacych "Szafka N" + 1 (odporne na usuwanie)
    const nums = p.items.map((it) => {
      const m = /^Szafka (\d+)$/.exec((it.cab.name || "").trim());
      return m ? Number(m[1]) : 0;
    });
    const next = Math.max(0, ...nums) + 1;
    const base = tplId ? makeFromTemplate(tplId) : { ...defaultCab };
    const items = [...p.items, { cab: { ...base, name: `Szafka ${next}` }, mat: defaultMaterials }];
    return { ...p, items, active: items.length - 1 };
  }), [setProject]);
  const duplicateCabinet = useCallback((i) => setProject((p) => {
    const src = p.items[i];
    if (!src) return p;
    const copy = JSON.parse(JSON.stringify(src));
    const base = (src.cab.name || "Szafka").replace(/\s*\(kopia( \d+)?\)$/, "");
    let name = `${base} (kopia)`;
    for (let n = 2; p.items.some((it) => it.cab.name === name); n++) name = `${base} (kopia ${n})`;
    copy.cab.name = name;
    const items = [...p.items.slice(0, i + 1), copy, ...p.items.slice(i + 1)];
    return { ...p, items, active: i + 1 };
  }), [setProject]);
  const removeCabinet = useCallback((i) => setProject((p) => {
    if (p.items.length <= 1) return p;
    const items = p.items.filter((_, k) => k !== i);
    return { ...p, items, active: Math.min(p.active, items.length - 1) };
  }), [setProject]);

  const undo = useCallback(() => {
    const h = histRef.current;
    if (!h.past.length) return;
    setProjectRaw((cur) => {
      h.future.unshift(cur);
      const prev = h.past.pop();
      setHistLen({ undo: h.past.length, redo: h.future.length });
      return prev;
    });
  }, []);

  const redo = useCallback(() => {
    const h = histRef.current;
    if (!h.future.length) return;
    setProjectRaw((cur) => {
      h.past.push(cur);
      const nxt = h.future.shift();
      setHistLen({ undo: h.past.length, redo: h.future.length });
      return nxt;
    });
  }, []);

  // skroty klawiszowe Ctrl+Z / Ctrl+Shift+Z
  useEffect(() => {
    const onKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") {
        e.preventDefault();
        if (e.shiftKey) redo();
        else undo();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [undo, redo]);

  const [transfer, setTransfer] = useState(null); // { mode:'export'|'import', text }

  const exportProject = () => {
    const json = JSON.stringify(
      { name: project.name, prices: project.prices, items: project.items, active: project.active },
      null,
      2
    );
    // nazwa pliku z nazwy projektu — bez znakow, ktore psuja sciezke
    const base =
      (project.name || DEFAULT_PROJECT_NAME).trim().replace(/[\\/:*?"<>|]+/g, "-").slice(0, 60) ||
      "projekt";
    try {
      const url = URL.createObjectURL(new Blob([json], { type: "application/json" }));
      const a = document.createElement("a");
      a.href = url;
      a.download = `${base}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 2000);
      setSaved("zapisano plik " + base + ".json");
    } catch (e) {
      // gdy przegladarka blokuje pobieranie — pokaz tekst do skopiowania
      setTransfer({ mode: "export", text: json });
      setSaved("skopiuj tekst projektu");
    }
  };

  const applyImportText = (raw) => {
    try {
      const d = JSON.parse(raw);
      const proj = loadProject(d);
      if (!proj) throw new Error("zły format");
      replaceProject(proj);
      setSaved("wczytano projekt");
      setTransfer(null);
    } catch (err) {
      setSaved("nieprawidłowy tekst projektu");
    }
  };

  const importProject = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => applyImportText(String(reader.result));
    reader.readAsText(file);
    e.target.value = "";
  };
  const [view, setView] = useState("closed");
  const [showDims, setShowDims] = useState(true);
  const [showGaps, setShowGaps] = useState(false);
  const [showLabels, setShowLabels] = useState(false);
  const [showShelves, setShowShelves] = useState(false);
  const [sideWhich, setSideWhich] = useState("left");
  const [showHardware, setShowHardware] = useState(true);
  const [yaw, setYaw] = useState(-0.55);
  const [pitch, setPitch] = useState(0.28);
  const [open3d, setOpen3d] = useState(false);
  const [angle3d, setAngle3d] = useState(90);
  const drag = useRef(null);
  const [saved, setSaved] = useState("");
  const [loaded, setLoaded] = useState(false);
  const [confirmNew, setConfirmNew] = useState(false);
  const [printing, setPrinting] = useState(false);
  const [cutPlan, setCutPlan] = useState(null);


  // zestawienie renderujemy dopiero na zadanie, potem oddajemy je przegladarce
  useEffect(() => {
    if (!printing) return;
    const id = requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        try {
          window.print();
        } catch (e) {
          setSaved("przeglądarka zablokowała drukowanie — użyj Ctrl+P");
        }
        setPrinting(false);
      });
    });
    return () => cancelAnimationFrame(id);
  }, [printing]);

  useEffect(() => {
    (async () => {
      try {
        const r = await projectStore.get("szafki:projekt");
        if (r) {
          const d = JSON.parse(r.value);
          const proj = loadProject(d);
          if (proj) {
            setProjectRaw(proj);
            const oldV = Array.isArray(d.items) ? d.items[0]?.cab?.version : d.cab?.version;
            setSaved(oldV === defaultCab.version ? "wczytano zapisany projekt" : "wczytano i zaktualizowano starszy projekt");
          }
        }
      } catch (e) {
        /* brak zapisu */
      }
      setLoaded(true);
    })();
  }, []);

  useEffect(() => {
    if (!loaded) return;
    const id = setTimeout(async () => {
      try {
        await projectStore.set(
          "szafki:projekt",
          JSON.stringify({ name: project.name, prices: project.prices, items: project.items, active: project.active })
        );
        setSaved("zapisano " + new Date().toLocaleTimeString("pl-PL"));
      } catch (e) {
        setSaved("nie udało się zapisać");
      }
    }, 800);
    return () => clearTimeout(id);
  }, [project, loaded]);

  const geo = useMemo(() => computeGeo(cab, mat), [cab, mat]);
  const set = useCallback((patch) => setCab((c) => ({ ...c, ...patch })), [setCab]);
  const setGap = (k, v) => setCab((c) => ({ ...c, gaps: { ...c.gaps, [k]: v } }));

  /* --- edycja struktury --- */
  const editLevels = (fn) =>
    setCab((c) => {
      const levels = JSON.parse(JSON.stringify(c.levels));
      fn(levels);
      return { ...c, levels };
    });

  const addLevel = () => editLevels((L) => L.push(newLevel(L[0]?.cols[0]?.doors ?? 1, 0)));
  const removeLevel = (i) => editLevels((L) => L.length > 1 && L.splice(i, 1));
  const setLevelH = (i, v) => editLevels((L) => {
    L[i].h = v === "" ? null : Math.round(Number(v));
    // po wypelnieniu ostatniego poziomu dodaj automatycznie kolejny (pusty),
    // o ile w szafce zostaje jeszcze miejsce na sensowny poziom (>= MIN_LEVEL)
    if (i === L.length - 1 && L[i].h != null) {
      const n = L.length;
      const fixedSum = L.reduce((s, lv) => s + (lv.h != null ? lv.h : 0), 0);
      const leftover = geo.innerH - n * geo.t - fixedSum;
      if (leftover >= MIN_LEVEL) L.push(newLevel(L[0]?.cols[0]?.doors ?? 1, 0));
    }
  });

  const addCol = (i) => editLevels((L) => L[i].cols.push(newColumn(1, 0)));
  const removeCol = (i, j) => editLevels((L) => L[i].cols.length > 1 && L[i].cols.splice(j, 1));
  const setColW = (i, j, v) => editLevels((L) => {
    const cols = L[i].cols;
    cols[j].w = v === "" ? null : Math.round(Number(v));
    // po wypelnieniu ostatniej kolumny dodaj automatycznie kolejna (pusta),
    // o ile w poziomie zostaje jeszcze miejsce na sensowna kolumne (>= MIN_COL)
    if (j === cols.length - 1 && cols[j].w != null) {
      const K = cols.length;
      const fixedSum = cols.reduce((s, c) => s + (c.w != null ? c.w : 0), 0);
      const leftover = geo.innerW - K * geo.t - fixedSum;
      if (leftover >= MIN_COL) cols.push(newColumn(1, 0));
    }
  });
  const setColDoors = (i, j, v) =>
    editLevels((L) => (L[i].cols[j].doors = Math.max(0, Math.round(Number(v) || 0))));
  const setColShelfCount = (i, j, v) =>
    editLevels((L) => {
      const n = Math.max(0, Math.round(Number(v) || 0));
      L[i].cols[j].shelfTargets = Array(n + 1).fill(null);
    });
  const setColOpening = (i, j, k, v) =>
    editLevels((L) => (L[i].cols[j].shelfTargets[k] = v === "" ? null : Math.round(Number(v))));
  const setColKind = (i, j, v) =>
    editLevels((L) => {
      L[i].cols[j].kind = v;
      if (v === "drawers" && !(L[i].cols[j].drawers || []).length)
        L[i].cols[j].drawers = [newDrawer(), newDrawer(), newDrawer()];
    });
  const setFixSide = (i, j, v) =>
    editLevels((L) => {
      L[i].cols[j].fix = { ...(L[i].cols[j].fix || { w: 60 }), side: v };
    });
  const setFixW = (i, j, v) =>
    editLevels((L) => {
      L[i].cols[j].fix = {
        ...(L[i].cols[j].fix || { side: "none" }),
        w: Math.max(0, Math.round(Number(v) || 0)),
      };
    });
  const setFixMode = (i, j, v) =>
    editLevels((L) => {
      L[i].cols[j].fix = { ...(L[i].cols[j].fix || {}), mode: v };
    });
  const setDoorWidth = (i, j, k, v) =>
    editLevels((L) => {
      const a = L[i].cols[j].doorWidths || [];
      while (a.length <= k) a.push(null);
      a[k] = v === "" ? null : Math.round(Number(v));
      L[i].cols[j].doorWidths = a;
    });
  const clearDoorWidths = (i, j) => editLevels((L) => (L[i].cols[j].doorWidths = []));
  const setDoorFlag = (i, j, k, key, v) =>
    editLevels((L) => {
      const a = L[i].cols[j][key] || [];
      while (a.length <= k) a.push(key === "handles" ? true : key === "hinges" ? null : false);
      a[k] = v;
      L[i].cols[j][key] = a;
    });
  const setDrawerHandle = (i, j, k, v) =>
    editLevels((L) => (L[i].cols[j].drawers[k].handle = v));
  const setColBack = (i, j, v) => editLevels((L) => (L[i].cols[j].backMode = v));
  const setBlendaMode = (i, j, v) =>
    editLevels((L) => (L[i].cols[j].blendaMode = v));
  const setDrawerMode = (i, j, v) =>
    editLevels((L) => (L[i].cols[j].drawerMode = v));

  // dodatkowe formatki — poza geometria szafki, wpisywane recznie
  const addExtraPart = () =>
    set({
      extraParts: [
        ...(cab.extraParts || []),
        { name: "", qty: 1, a: null, b: null, matKey: "board", edges: { a1: false, a2: false, b1: false, b2: false } },
      ],
    });
  const setExtraPart = (i, patch) =>
    set({ extraParts: (cab.extraParts || []).map((e, k) => (k === i ? { ...e, ...patch } : e)) });
  const removeExtraPart = (i) =>
    set({ extraParts: (cab.extraParts || []).filter((_, k) => k !== i) });
  const setHinge = (i, j, v) => editLevels((L) => (L[i].cols[j].hinge = v));
  const setFixSupport = (i, j, v) =>
    editLevels((L) => {
      L[i].cols[j].fix = { ...(L[i].cols[j].fix || {}), support: v };
    });
  const setFixSupportDepth = (i, j, v) =>
    editLevels((L) => {
      L[i].cols[j].fix = {
        ...(L[i].cols[j].fix || {}),
        supportDepth: Math.max(0, Math.round(Number(v) || 0)),
      };
    });

  const setColNL = (i, j, v) =>
    editLevels((L) => (L[i].cols[j].nl = v === "" ? null : Number(v)));
  const addDrawer = (i, j) => editLevels((L) => L[i].cols[j].drawers.push(newDrawer()));
  const removeDrawer = (i, j, k) => editLevels((L) => L[i].cols[j].drawers.splice(k, 1));
  const addRail = (i, j) => editLevels((L) => { if (!Array.isArray(L[i].cols[j].rails)) L[i].cols[j].rails = []; L[i].cols[j].rails.push(newRail()); });
  const removeRail = (i, j, k) => editLevels((L) => L[i].cols[j].rails.splice(k, 1));
  const setRail = (i, j, k, patch) => editLevels((L) => { L[i].cols[j].rails[k] = { ...L[i].cols[j].rails[k], ...patch }; });
  const setDrawerH = (i, j, k, v) =>
    editLevels((L) => (L[i].cols[j].drawers[k].h = v === "auto" ? "auto" : Number(v)));
  const setDrawerFront = (i, j, k, v) =>
    editLevels((L) => (L[i].cols[j].drawers[k].front = v === "" ? null : Math.round(Number(v))));
  // lista elementow kolizyjnych (migracja ze starego pojedynczego pola)
  const obsList = Array.isArray(cab.obstacles) && cab.obstacles.length
    ? cab.obstacles
    : cab.obstacle?.on ? [cab.obstacle] : [];
  const writeObs = (arr) => set({ obstacles: arr, obstacle: { ...(cab.obstacle || {}), on: false } });
  const addObstacle = () =>
    writeObs([...obsList, { on: true, w: 80, d: 80, h: 0, side: "right", fromSide: 0,
      fromBack: 0, fromBottom: 0, fullHeight: true, mask: true, maskType: "auto", maskFront: "over" }]);
  const removeObstacle = (i) => writeObs(obsList.filter((_, k) => k !== i));
  const setObstacle = (i, patch) =>
    writeObs(obsList.map((o, k) => (k === i ? { ...o, ...patch } : o)));

  const setDrawerNL = (i, j, k, v) =>
    editLevels((L) => (L[i].cols[j].drawers[k].nl = v === "" ? null : Number(v)));

  // rozdziela pasmo proporcjonalnie do wysokosci bokow, startujac od minimow
  const fitFronts = (i, j) => {
    const lv = geo.levels[i];
    if (!lv) return;
    const ds = cab.levels[i].cols[j].drawers || [];
    const n = ds.length;
    if (!n) return;
    const band = Math.round(lv.frontHi - lv.frontLo);
    const avail = band - (n - 1) * cab.gaps.between;
    const cMode = geo.levels[i].cols[j]?.drawerMode || cab.frontMode;
    const mins = ds.map((d) => VBOX.minFront[cMode][Number(d.h)] ?? 0);
    const base = mins.reduce((a, b) => a + b, 0);
    let sizes;
    if (avail <= base) {
      sizes = mins.slice();
    } else {
      const wsum = ds.reduce((a, d) => a + Number(d.h), 0);
      const left = avail - base;
      sizes = ds.map((d, k) => mins[k] + Math.floor((left * Number(d.h)) / wsum));
      let rem = avail - sizes.reduce((a, b) => a + b, 0);
      for (let k = 0; rem > 0; k = (k + 1) % n) {
        sizes[k] += 1;
        rem -= 1;
      }
    }
    editLevels((L) => L[i].cols[j].drawers.forEach((d, k) => (d.front = sizes[k])));
  };

  const clearColOpenings = (i, j) =>
    editLevels((L) => (L[i].cols[j].shelfTargets = L[i].cols[j].shelfTargets.map(() => null)));
  // liczba polek = liczba swiatel minus 1, wiec dodanie polki to dodanie swiatla
  const addShelf = (i, j) =>
    editLevels((L) => L[i].cols[j].shelfTargets.push(null));
  // usuwa polke przy wskazanym swietle — dwa swiatla lacza sie w jedno
  const removeShelfAt = (i, j, k) =>
    editLevels((L) => {
      const st = L[i].cols[j].shelfTargets;
      if (st.length > 1) st.splice(k, 1);
    });

  const toggleEdge = (name, key, cur) =>
    set({
      edgeOverrides: {
        ...(cab.edgeOverrides || {}),
        [name]: { ...((cab.edgeOverrides || {})[name] || {}), [key]: !cur },
      },
    });

  const cutList = useMemo(() => groupPanels(geo.panels), [geo.panels]);

  const edgeMeters = useMemo(() => {
    let mm = 0;
    cutList.forEach((p) => {
      const e = p.edges;
      mm += p.qty * ((e.a1 ? p.a : 0) + (e.a2 ? p.a : 0) + (e.b1 ? p.b : 0) + (e.b2 ? p.b : 0));
    });
    return mm / 1000;
  }, [cutList]);

  const boardArea = useMemo(() => {
    const by = {};
    cutList.forEach((p) => (by[p.matKey] = (by[p.matKey] || 0) + (p.qty * p.a * p.b) / 1e6));
    return by;
  }, [cutList]);

  // wspolna lista formatek CALEGO projektu — sumuje wszystkie szafki.
  // Rozne materialy (nazwa/kolor/grubosc) nie lacza sie mimo tych samych wymiarow.
  const projectCutList = useMemo(() => {
    const map = new Map();
    project.items.forEach((it) => {
      const g = computeGeo(it.cab, it.mat);
      g.panels.forEach((p) => {
        const m = it.mat[p.matKey] || {};
        const e = p.edges;
        const key = [m.name, m.thickness, m.color, p.matKey, p.a, p.b, e.a1, e.a2, e.b1, e.b2, p.name, !!it.cab.grainMatters].join("|");
        if (map.has(key)) map.get(key).qty += p.qty;
        else map.set(key, { ...p, matName: m.name || p.matKey, matColor: m.color,
          rotatable: p.matKey === "back" || !it.cab.grainMatters });
      });
    });
    return [...map.values()];
  }, [project]);

  const projectEdgeMeters = useMemo(() => {
    let mm = 0;
    projectCutList.forEach((p) => {
      const e = p.edges;
      mm += p.qty * ((e.a1 ? p.a : 0) + (e.a2 ? p.a : 0) + (e.b1 ? p.b : 0) + (e.b2 ? p.b : 0));
    });
    return mm / 1000;
  }, [projectCutList]);

  const projectBoardArea = useMemo(() => {
    const by = {};
    projectCutList.forEach((p) => { by[p.matName] = (by[p.matName] || 0) + (p.qty * p.a * p.b) / 1e6; });
    return by;
  }, [projectCutList]);

  // okucia calego projektu — te same pozycje z roznych szafek sumujemy
  const projectHardware = useMemo(() => {
    const map = new Map();
    project.items.forEach((it) => {
      computeGeo(it.cab, it.mat).hardware.forEach((h) => {
        const k = `${h.name}|${h.spec}|${h.unit}`;
        if (map.has(k)) map.get(k).qty += h.qty;
        else map.set(k, { ...h });
      });
    });
    return [...map.values()];
  }, [project]);

  // rozkroj liczymy tylko na zadanie — to najciezsza operacja w aplikacji
  const makeCutPlan = useCallback((scope) => {
    const rows =
      scope === "project"
        ? projectCutList.map((p) => ({
            name: p.name,
            qty: p.qty,
            a: p.a,
            b: p.b,
            rotatable: p.rotatable !== false,
            matLabel: p.matName,
          }))
        : cutList.map((p) => ({
            name: p.name,
            qty: p.qty,
            a: p.a,
            b: p.b,
            rotatable: p.matKey === "back" || !cab.grainMatters,
            matLabel: mat[p.matKey].name,
          }));
    setCutPlan({ scope, groups: buildCutPlan(rows) });
  }, [cutList, projectCutList, cab.grainMatters, mat]);

  // --- wycena: ceny trzyma projekt, ilosci biora sie z list i rozkroju ---
  const prices = project.prices || {};
  const setPrice = (key, v) =>
    setProject((p) => ({ ...p, prices: { ...(p.prices || {}), [key]: v === "" ? null : Number(v) } }));
  const priceOf = (key) => {
    const v = prices[key];
    return typeof v === "number" && isFinite(v) ? v : 0;
  };

  const projectEdgeMb = useMemo(() => {
    let mm = 0;
    projectCutList.forEach((p) => {
      const e = p.edges;
      mm += p.qty * ((e.a1 ? p.a : 0) + (e.a2 ? p.a : 0) + (e.b1 ? p.b : 0) + (e.b2 ? p.b : 0));
    });
    return mm / 1000;
  }, [projectCutList]);

  // arkusze bierzemy z policzonego rozkroju — bez niego nie ma czego mnożyć
  const planSheets = useMemo(() => {
    if (!cutPlan) return null;
    const by = {};
    cutPlan.groups.forEach((g) => { by[g.matLabel] = (by[g.matLabel] || 0) + g.sheets.length; });
    return by;
  }, [cutPlan]);

  const quote = useMemo(() => {
    const rows = [];
    if (planSheets)
      Object.entries(planSheets).forEach(([matLabel, n]) => {
        rows.push({ key: "plyta:" + matLabel, label: matLabel, qty: n, unit: "ark.", price: priceOf("plyta:" + matLabel) });
      });
    const sheetsTotal = planSheets ? Object.values(planSheets).reduce((a, b) => a + b, 0) : 0;
    if (sheetsTotal)
      rows.push({ key: "ciecie", label: "Cięcie płyty", qty: sheetsTotal, unit: "ark.", price: priceOf("ciecie") });
    rows.push({ key: "obrzeze", label: "Obrzeże PCV", qty: Math.round(projectEdgeMb * 10) / 10, unit: "mb", price: priceOf("obrzeze") });
    projectHardware.forEach((h) => {
      const k = "okucie:" + h.name + "|" + h.spec;
      rows.push({ key: k, label: h.name, spec: h.spec, qty: h.qty, unit: h.unit, price: priceOf(k) });
    });
    const sum = rows.reduce((a, r) => a + r.qty * r.price, 0);
    return { rows, sum };
  }, [planSheets, projectEdgeMb, projectHardware, prices]);

  const errors = geo.msgs.filter((m) => m.level === "error");
  const warns = geo.msgs.filter((m) => m.level === "warn");
  const infos = geo.msgs.filter((m) => m.level === "info");
  const notesRef = useRef(null);
  const scrollToNotes = () =>
    notesRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });

  const EdgeChips = ({ p }) => (
    <div className="flex flex-wrap gap-1">
      {[["a1", "przód", p.a], ["a2", "tył", p.a], ["b1", "bok", p.b], ["b2", "bok", p.b]].map(
        ([k, lab, val]) => (
          <MiniBtn key={k} tone={p.edges[k] ? "on" : "plain"}
            onClick={() => toggleEdge(p.name, k, p.edges[k])}
            title={p.edges[k] ? "Oklejona — kliknij, aby wyłączyć" : "Bez obrzeża — kliknij, aby okleić"}>
            <span className="font-mono">{lab} {fmt(val)}</span>
          </MiniBtn>
        )
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-stone-100 text-stone-900">
      <header className="print-hide sticky top-0 z-10 border-b border-stone-300 bg-stone-50/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-3 px-4 py-3">
          <div className="flex w-full flex-col gap-0.5 sm:w-auto sm:min-w-[22rem] sm:flex-1">
            <label className="flex min-w-0 items-center gap-1.5"
              title="Nazwa całego projektu — kliknij i wpisz dowolną">
              <span aria-hidden="true" className="shrink-0 text-base text-stone-400">✎</span>
              <input value={project.name ?? ""}
                onChange={(e) => setProject((p) => ({ ...p, name: e.target.value }))}
                placeholder={DEFAULT_PROJECT_NAME}
                className="min-w-0 flex-1 border-b border-stone-300 bg-transparent px-0.5 text-lg font-semibold tracking-tight hover:border-stone-400 focus:border-teal-700 focus:outline-none" />
            </label>
            <label className="flex min-w-0 items-center gap-1.5 pl-6"
              title="Nazwa tej szafki — kliknij i wpisz dowolną">
              <span className="shrink-0 text-[11px] uppercase tracking-wide text-stone-400">szafka</span>
              <input value={cab.name} onChange={(e) => set({ name: e.target.value })}
                placeholder="Nazwa szafki"
                className="min-w-0 flex-1 border-b border-stone-200 bg-transparent px-0.5 text-sm text-stone-700 hover:border-stone-400 focus:border-teal-700 focus:outline-none" />
            </label>
          </div>
          <span className="font-mono text-xs text-stone-400">{saved}</span>
          <div className="flex items-center gap-1">
            <button onClick={undo} disabled={!histLen.undo}
              title="Cofnij (Ctrl+Z)"
              className="rounded px-2 py-1 text-xs font-medium disabled:opacity-30 enabled:hover:bg-stone-200">
              ↶ Cofnij
            </button>
            <button onClick={redo} disabled={!histLen.redo}
              title="Ponów (Ctrl+Shift+Z)"
              className="rounded px-2 py-1 text-xs font-medium disabled:opacity-30 enabled:hover:bg-stone-200">
              Ponów ↷
            </button>
          </div>
          <button onClick={exportProject}
            title="Pobierz projekt jako plik JSON"
            className="text-xs text-teal-700 hover:underline">Zapisz do pliku</button>
          <label className="cursor-pointer text-xs text-teal-700 hover:underline">
            Wczytaj plik
            <input type="file" accept="application/json,.json,.txt" className="hidden"
              onChange={importProject} />
          </label>
          <button onClick={() => setPrinting(true)}
            title="Zestawienie z rysunkami i listami — zapisz jako PDF w oknie druku"
            className="text-xs font-medium text-teal-700 hover:underline">Zestawienie PDF</button>
          <button onClick={() => setConfirmNew(true)}
            className="text-xs text-stone-500 hover:text-stone-800 hover:underline">Nowy projekt</button>
          {errors.length > 0 && (
            <button onClick={scrollToNotes} title="Przejdź do uwag"
              className="rounded-full px-2.5 py-1 text-xs font-medium transition hover:brightness-95"
              style={{ background: "#fee2e2", color: ERRC }}>
              {errors.length} {plural(errors.length, "błąd", "błędy", "błędów")}
            </button>
          )}
          {warns.length > 0 && (
            <button onClick={scrollToNotes} title="Przejdź do uwag"
              className="rounded-full px-2.5 py-1 text-xs font-medium transition hover:brightness-95"
              style={{ background: "#fef3c7", color: WARNC }}>
              {warns.length} {plural(warns.length, "ostrzeżenie", "ostrzeżenia", "ostrzeżeń")}
            </button>
          )}
          {infos.length > 0 && (
            <button onClick={scrollToNotes} title="Przejdź do podpowiedzi"
              className="rounded-full px-2.5 py-1 text-xs font-medium text-stone-600 transition hover:brightness-95"
              style={{ background: "#e7e5e4" }}>
              {infos.length} {plural(infos.length, "podpowiedź", "podpowiedzi", "podpowiedzi")}
            </button>
          )}
          {errors.length === 0 && warns.length === 0 && infos.length === 0 && (
            <span className="rounded-full bg-teal-50 px-2.5 py-1 text-xs font-medium text-teal-800">bez uwag</span>
          )}
        </div>
        {/* pasek szafek w projekcie */}
        <div className="border-t border-stone-200 bg-stone-50/60">
          <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-1.5 px-4 py-2">
            <span className="mr-1 shrink-0 text-xs font-medium text-stone-400">Szafki:</span>
            {project.items.map((it, i) => {
              const activeTab = i === project.active;
              return (
                <div key={i}
                  className={"flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-medium transition " +
                    (activeTab ? "border-teal-600 bg-teal-700 text-white" : "border-stone-300 bg-white text-stone-600 hover:border-stone-400")}>
                  <button onClick={() => switchCabinet(i)} className="max-w-[180px] truncate">
                    {it.cab.name || `Szafka ${i + 1}`}
                  </button>
                  <button onClick={() => duplicateCabinet(i)} title="Duplikuj tę szafkę"
                    className={"px-0.5 leading-none " + (activeTab ? "text-teal-100 hover:text-white" : "text-stone-400 hover:text-stone-700")}>
                    ⧉
                  </button>
                  {project.items.length > 1 && (
                    <button onClick={() => removeCabinet(i)} title="Usuń szafkę"
                      className={"shrink-0 rounded-full px-1 leading-none " + (activeTab ? "hover:bg-teal-800" : "hover:bg-stone-200")}>×</button>
                  )}
                </div>
              );
            })}
            <select value="" title="Dodaj szafkę z gotowego szablonu"
              onChange={(e) => { if (e.target.value) addCabinet(e.target.value); e.target.value = ""; }}
              className="rounded-full border border-dashed border-teal-500 bg-white px-2 py-1 text-xs text-teal-700 focus:border-teal-700 focus:outline-none">
              <option value="">+ z szablonu…</option>
              {TEMPLATES.map((t) => (
                <option key={t.id} value={t.id}>{t.label} — {t.hint}</option>
              ))}
            </select>
            <button onClick={() => addCabinet()} title="Dodaj nową szafkę do projektu"
              className="rounded-full border border-dashed border-teal-500 px-3 py-1 text-xs font-medium text-teal-700 hover:bg-teal-50">
              + szafka
            </button>
          </div>
        </div>
      </header>

      <main className="print-hide mx-auto max-w-7xl gap-4 px-4 py-4 lg:grid lg:grid-cols-[440px_1fr]">
        <div className="space-y-4">
          <Card title="Korpus" collapsible>
            <div className="grid grid-cols-3 gap-3">
              <Field label="Szerokość"><Num value={cab.W} onChange={(v) => set({ W: v })} /></Field>
              <Field label="Wysokość"><Num value={cab.H} onChange={(v) => set({ H: v })} /></Field>
              <Field label="Głębokość"><Num value={cab.D} onChange={(v) => set({ D: v })} /></Field>
            </div>
            <Field label="Złącza korpusu"
              hint={`Bok lewy ${fmt(geo.leftLen)} mm, bok prawy ${fmt(geo.rightLen)} mm. „Między" = płyta wchodzi między boki, „na boku" = płyta idzie po wierzchu boku.`}>
              <div className="space-y-2">
                {[["Wieniec", "topL", "topR", geo.topL, geo.topR],
                  ["Dno", "botL", "botR", geo.botL, geo.botR]].map(([lab, kl, kr, vl, vr]) => (
                  <div key={lab} className="flex items-center gap-2">
                    <span className="w-16 shrink-0 text-xs text-stone-500">{lab}</span>
                    {[[kl, vl, "L"], [kr, vr, "P"]].map(([key, val, mark]) => (
                      <div key={key} className="flex flex-1 items-center gap-1">
                        <span className="text-[11px] text-stone-400">{mark}</span>
                        <div className="flex-1">
                          <Seg value={val}
                            onChange={(v) => {
                              const cur = { topL: geo.topL, topR: geo.topR, botL: geo.botL, botR: geo.botR };
                              const sib = key === kl ? kr : kl;
                              if (v === "none") { cur[key] = "none"; cur[sib] = "none"; }
                              else { cur[key] = v; if (cur[sib] === "none") cur[sib] = v; }
                              set({ joints: { ...(cab.joints || {}), ...cur } });
                            }}
                            options={[{ v: "between", l: "między" }, { v: "over", l: "na boku" }, { v: "none", l: "brak" }]} />
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </Field>
            <Field label="Wieniec"
              hint={geo.isBlat
                ? `Blat leży na bokach i wystaje poza nie — fronty kończą się pod nim. Formatka ${fmt(geo.topX1 - geo.topX0)} × ${fmt(geo.blatDepth)} mm.`
                : "Zwykły wieniec w obrysie korpusu. Wysunięcia ustawisz po przełączeniu na blat."}>
              <Seg value={(cab.top || {}).mode === "blat" ? "blat" : "wieniec"}
                onChange={(v) => set({ top: { ...(cab.top || {}), mode: v } })}
                options={[{ v: "wieniec", l: "Wieniec" }, { v: "blat", l: "Blat" }]} />
            </Field>
            {(cab.top || {}).mode === "blat" && (
              <div className="grid grid-cols-2 gap-3">
                <Field label="Wysunięcie w lewo">
                  <Num value={(cab.top || {}).overL ?? 0}
                    onChange={(v) => set({ top: { ...(cab.top || {}), overL: v } })} />
                </Field>
                <Field label="Wysunięcie w prawo">
                  <Num value={(cab.top || {}).overR ?? 0}
                    onChange={(v) => set({ top: { ...(cab.top || {}), overR: v } })} />
                </Field>
                <Field label="Wysunięcie do przodu" hint="blat zakrywa górę frontów">
                  <Num value={(cab.top || {}).overFront ?? 0}
                    onChange={(v) => set({ top: { ...(cab.top || {}), overFront: v } })} />
                </Field>
                <Field label="Wysunięcie do tyłu">
                  <Num value={(cab.top || {}).overBack ?? 0}
                    onChange={(v) => set({ top: { ...(cab.top || {}), overBack: v } })} />
                </Field>
              </div>
            )}

            <Field label="Drzwi" hint={cab.frontMode === "overlay"
              ? "Zawiasy zwykłe — drzwi zamykają się na korpus."
              : "Drzwi chowają się w świetle korpusu."}>
              <Seg value={cab.frontMode} onChange={(v) => set({ frontMode: v })}
                options={[{ v: "overlay", l: "Na korpusie" }, { v: "inset", l: "Wewnątrz" }]} />
            </Field>
            <Field label="Plecy">
              <Seg value={cab.back} onChange={(v) => set({ back: v })}
                options={[{ v: "hdf", l: "HDF" }, { v: "board", l: "Płyta" }, { v: "none", l: "Brak" }]} />
            </Field>
            {cab.back === "hdf" && (
              <Field label="Montaż pleców" hint={geo.grooved
                ? "Plecy chowają się we frezie, tył korpusu dolega do ściany."
                : "Plecy przybijane od tyłu, luz 1 mm z każdej strony."}>
                <Seg value={geo.grooved ? "groove" : "nail"}
                  onChange={(v) => set({ backGroove: { ...(cab.backGroove || {}), on: v === "groove" } })}
                  options={[{ v: "nail", l: "Przybijane" }, { v: "groove", l: "We frezie" }]} />
              </Field>
            )}
            {geo.grooved && (
              <div className="grid grid-cols-3 gap-3">
                <Field label="Szerokość" hint="frezu">
                  <Num value={geo.grDep}
                    onChange={(v) => set({ backGroove: { ...(cab.backGroove || {}), depth: v } })} suffix="" />
                </Field>
                <Field label="Głębokość" hint="frezu">
                  <Num value={geo.grOff}
                    onChange={(v) => set({ backGroove: { ...(cab.backGroove || {}), offset: v } })} suffix="" />
                </Field>
                <Field label="Luz" hint="we frezie">
                  <Num value={geo.grPlay}
                    onChange={(v) => set({ backGroove: { ...(cab.backGroove || {}), play: v } })} suffix="" />
                </Field>
              </div>
            )}
            {cab.back === "board" && (
              <>
                <Field label="Pozycja pleców" hint={cab.backPos === "outside"
                  ? "Płyta na całej tylnej płaszczyźnie, przykrywa boki."
                  : "Płyta wsunięta między boki, wieniec i dno."}>
                  <Seg value={cab.backPos === "outside" ? "outside" : "inside"}
                    onChange={(v) => set({ backPos: v })}
                    options={[{ v: "inside", l: "Wewnątrz" }, { v: "outside", l: "Na zewnątrz" }]} />
                </Field>
                {cab.backPos === "outside" && (
                  <Field label="Materiał pleców" hint="wewnątrz zawsze z płyty półek">
                    <Seg value={cab.backBoardMat === "shelf" ? "shelf" : "board"}
                      onChange={(v) => set({ backBoardMat: v })}
                      options={[{ v: "board", l: "Jak korpus" }, { v: "shelf", l: "Jak półki" }]} />
                  </Field>
                )}
              </>
            )}
            {cab.back !== "none" && !geo.grooved && (
              <Check checked={cab.depthIncludesBack} onChange={(v) => set({ depthIncludesBack: v })}
                label="Podana głębokość zawiera plecy" />
            )}
            {cab.frontMode === "overlay" && (
              <Check checked={!!cab.depthIncludesFront} onChange={(v) => set({ depthIncludesFront: v })}
                label="Podana głębokość zawiera drzwi (front nakładany wystaje przed korpus)" />
            )}
          </Card>

          <Card title="Struktura wnętrza" collapsible
            right={<MiniBtn onClick={addLevel}>+ poziom</MiniBtn>}>
            <p className="text-xs text-stone-500">
              Poziomy rozdziela półka na całą szerokość. W poziomie możesz postawić przegrodę
              i podzielić go na kolumny. Puste pole wymiaru znaczy „podziel resztę równo".
            </p>

            {[...geo.levels].reverse().map((lv) => (
              <div key={lv.i} className="rounded border border-stone-200 p-3 space-y-3">
                <div className="flex items-center gap-2">
                  <span className="w-20 shrink-0 text-xs font-medium text-stone-700">
                    Poziom {lv.i + 1}
                  </span>
                  <AutoNum value={cab.levels[lv.i].h} placeholder={fmt(lv.h)} fixed={lv.fixed}
                    onChange={(v) => setLevelH(lv.i, v)} />
                  <span className="w-12 shrink-0 text-right font-mono text-xs"
                    style={{ color: lv.h < 60 ? WARNC : "#78716c" }}>{fmt(lv.h)}</span>
                  {lv.fixed && (
                    <MiniBtn onClick={() => setLevelH(lv.i, "")} title="Wróć do równego podziału">×</MiniBtn>
                  )}
                  {geo.levels.length > 1 && (
                    <MiniBtn onClick={() => removeLevel(lv.i)} title="Usuń poziom">usuń</MiniBtn>
                  )}
                </div>

                <div className="space-y-2 pl-2 border-l-2 border-stone-100">
                  {lv.cols.map((c) => {
                    const rawCol = cab.levels[lv.i].cols[c.j];
                    const nS = (rawCol.shelfTargets || [null]).length - 1;
                    return (
                      <div key={c.j} className="rounded bg-stone-50 p-2 space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="w-20 shrink-0 text-xs text-stone-500">
                            Kolumna {c.j + 1}
                          </span>
                          <AutoNum value={rawCol.w} placeholder={fmt(c.w)} fixed={c.fixed}
                            warn={c.w < MIN_COL} onChange={(v) => setColW(lv.i, c.j, v)} />
                          <span className="w-12 shrink-0 text-right font-mono text-xs"
                            style={{ color: c.w < MIN_COL ? WARNC : "#78716c" }}>{fmt(c.w)}</span>
                          {lv.cols.length > 1 && (
                            <MiniBtn onClick={() => removeCol(lv.i, c.j)} title="Usuń kolumnę">×</MiniBtn>
                          )}
                        </div>

                        <Seg value={c.kind}
                          onChange={(v) => setColKind(lv.i, c.j, v)}
                          options={[
                            { v: "doors", l: "Półki i drzwi" },
                            { v: "drawers", l: "Szuflady" },
                            { v: "blenda", l: "Blenda" },
                          ]} />

                        {c.kind === "blenda" && (
                          <div className="flex items-center gap-2 text-xs">
                            <span className="w-16 shrink-0 text-stone-500">montaż</span>
                            <div className="flex-1">
                              <Seg value={rawCol.blendaMode === "inset" ? "inset" : "overlay"}
                                onChange={(v) => setBlendaMode(lv.i, c.j, v)}
                                options={[
                                  { v: "overlay", l: "Na korpusie" },
                                  { v: "inset", l: "W obrysie" },
                                ]} />
                            </div>
                          </div>
                        )}

                        {c.kind === "drawers" && (
                          <div className="flex items-center gap-2 text-xs">
                            <span className="w-16 shrink-0 text-stone-500">fronty</span>
                            <div className="flex-1">
                              <Seg
                                value={
                                  rawCol.drawerMode === "overlay" || rawCol.drawerMode === "inset"
                                    ? rawCol.drawerMode
                                    : "inherit"
                                }
                                onChange={(v) => setDrawerMode(lv.i, c.j, v)}
                                options={[
                                  { v: "inherit", l: `jak szafka (${cab.frontMode === "overlay" ? "na korpusie" : "wewnątrz"})` },
                                  { v: "overlay", l: "Na korpusie" },
                                  { v: "inset", l: "Wewnątrz" },
                                ]} />
                            </div>
                          </div>
                        )}

                        <div className="space-y-2 rounded border border-stone-200 bg-white p-2">
                          <div className="flex items-center gap-2 text-xs">
                            <span className="w-16 shrink-0 text-stone-500">fix</span>
                            <div className="flex-1">
                              <Seg value={(rawCol.fix || {}).side || "none"}
                                onChange={(v) => setFixSide(lv.i, c.j, v)}
                                options={[
                                  { v: "none", l: "brak" },
                                  { v: "left", l: "lewa" },
                                  { v: "right", l: "prawa" },
                                  { v: "top", l: "góra" },
                                ]} />
                            </div>
                          </div>
                          {((rawCol.fix || {}).side || "none") !== "none" && (
                            <>
                              {(rawCol.fix || {}).side !== "top" && (
                              <div className="flex items-center gap-2 text-xs">
                                <span className="w-16 shrink-0 text-stone-500">montaż</span>
                                <div className="flex-1">
                                  <Seg value={(rawCol.fix || {}).mode === "inset" ? "inset" : "overlay"}
                                    onChange={(v) => setFixMode(lv.i, c.j, v)}
                                    options={[
                                      { v: "overlay", l: "Na korpusie" },
                                      { v: "inset", l: "W obrysie" },
                                    ]} />
                                </div>
                              </div>
                              )}
                              <div className="flex items-center gap-2 text-xs">
                                <span className="w-16 shrink-0 text-stone-500">{(rawCol.fix || {}).side === "top" ? "wysokość" : "szerokość"}</span>
                                <input type="number" min={0} step={1} value={(rawCol.fix || {}).w ?? 60}
                                  onChange={(e) => setFixW(lv.i, c.j, e.target.value)}
                                  className="w-20 rounded border border-stone-300 bg-white px-1.5 py-1 font-mono text-xs focus:border-teal-600 focus:outline-none" />
                                <span className="text-stone-400">mm</span>
                              </div>
                              {(rawCol.fix || {}).side !== "top" && (
                              <div className="flex items-center gap-2 text-xs">
                                <label className="flex items-center gap-2 cursor-pointer"
                                  title="Pionowa płytka za elementem stałym — daje w co przykręcić zawias i usztywnia front.">
                                  <input type="checkbox" checked={!!(rawCol.fix || {}).support}
                                    onChange={(e) => setFixSupport(lv.i, c.j, e.target.checked)}
                                    className="h-3.5 w-3.5 accent-teal-700" />
                                  <span className="text-stone-600">wspornik pionowy</span>
                                </label>
                                {(rawCol.fix || {}).support && (
                                  <>
                                    <input type="number" min={0} step={1}
                                      value={(rawCol.fix || {}).supportDepth ?? 100}
                                      onChange={(e) => setFixSupportDepth(lv.i, c.j, e.target.value)}
                                      className="w-20 rounded border border-stone-300 bg-white px-1.5 py-1 font-mono text-xs focus:border-teal-600 focus:outline-none" />
                                    <span className="text-stone-400">mm głęb.</span>
                                  </>
                                )}
                              </div>
                              )}
                              {c.kind === "doors" && rawCol.doors === 1 && (
                                <div className="flex items-center gap-2 text-xs">
                                  <span className="w-16 shrink-0 text-stone-500">zawiasy</span>
                                  <div className="flex-1">
                                    <Seg value={rawCol.hinge === "left" || rawCol.hinge === "right" ? rawCol.hinge : "auto"}
                                      onChange={(v) => setHinge(lv.i, c.j, v)}
                                      options={[
                                        { v: "auto", l: "auto" },
                                        { v: "left", l: "lewe" },
                                        { v: "right", l: "prawe" },
                                      ]} />
                                  </div>
                                </div>
                              )}
                            </>
                          )}
                        </div>

                        {c.kind === "blenda" && (
                          <div className="flex items-center gap-2 text-xs">
                            <span className="text-stone-500">półki</span>
                            <input type="number" min={0} step={1} value={nS}
                              onChange={(e) => setColShelfCount(lv.i, c.j, e.target.value)}
                              className="w-14 rounded border border-stone-300 bg-white px-1.5 py-1 font-mono text-xs focus:border-teal-600 focus:outline-none" />
                          </div>
                        )}

                        {c.kind === "doors" && (
                          <div className="flex items-center gap-2 text-xs">
                            <span className="text-stone-500">drzwi</span>
                            <input type="number" min={0} step={1} value={rawCol.doors}
                              onChange={(e) => setColDoors(lv.i, c.j, e.target.value)}
                              className="w-14 rounded border border-stone-300 bg-white px-1.5 py-1 font-mono text-xs focus:border-teal-600 focus:outline-none" />
                            <span className="text-stone-500">półki</span>
                            <input type="number" min={0} step={1} value={nS}
                              onChange={(e) => setColShelfCount(lv.i, c.j, e.target.value)}
                              className="w-14 rounded border border-stone-300 bg-white px-1.5 py-1 font-mono text-xs focus:border-teal-600 focus:outline-none" />
                            {c.count > 0 && (
                              <span className="ml-auto font-mono text-stone-500">
                                {fmt(c.doorH)} wys.
                              </span>
                            )}
                          </div>
                        )}

                        {c.kind === "doors" && rawCol.doors > 0 && (
                          <div className="space-y-1">
                            {(c.doorWs || []).map((w, k) => (
                              <div key={k} className="flex items-center gap-2">
                                <span className="w-20 shrink-0 text-[11px] text-stone-400">
                                  drzwi {k + 1}
                                </span>
                                <AutoNum value={(rawCol.doorWidths || [])[k]} placeholder={fmt(w)}
                                  fixed={num((rawCol.doorWidths || [])[k]) !== null}
                                  onChange={(v) => setDoorWidth(lv.i, c.j, k, v)} />
                                <label className="flex shrink-0 items-center gap-1 cursor-pointer"
                                  title="Lustro na tych drzwiach">
                                  <input type="checkbox"
                                    checked={!!(rawCol.mirrors || [])[k]}
                                    onChange={(e) => setDoorFlag(lv.i, c.j, k, "mirrors", e.target.checked)}
                                    className="h-3.5 w-3.5 accent-teal-700" />
                                  <span className="text-[11px] text-stone-500">lustro</span>
                                </label>
                                <label className="flex shrink-0 items-center gap-1 cursor-pointer"
                                  title="Uchwyt na tych drzwiach">
                                  <input type="checkbox"
                                    checked={(rawCol.handles || [])[k] !== false}
                                    onChange={(e) => setDoorFlag(lv.i, c.j, k, "handles", e.target.checked)}
                                    className="h-3.5 w-3.5 accent-teal-700" />
                                  <span className="text-[11px] text-stone-500">uchwyt</span>
                                </label>
                                <input type="number" min={0} step={1}
                                  title="Liczba zawiasów — puste liczy automatycznie"
                                  value={(rawCol.hinges || [])[k] ?? ""}
                                  placeholder={String((c.doors[k] || {}).hinges ?? 2)}
                                  onChange={(e) => setDoorFlag(lv.i, c.j, k, "hinges",
                                    e.target.value === "" ? null : Math.round(Number(e.target.value)))}
                                  className="w-12 shrink-0 rounded border border-stone-300 bg-white px-1 py-1 font-mono text-[11px] focus:border-teal-600 focus:outline-none" />
                                <span className="shrink-0 text-[11px] text-stone-400">zaw.</span>
                              </div>
                            ))}
                            {rawCol.doors > 1 && (
                              <button onClick={() => clearDoorWidths(lv.i, c.j)}
                                className="text-[11px] text-teal-700 hover:underline">
                                równe szerokości
                              </button>
                            )}
                            {rawCol.doors > 1 && (
                              <div className="flex items-center gap-2 pt-1">
                                <label className="flex items-center gap-1.5 cursor-pointer">
                                  <input type="checkbox"
                                    checked={num(rawCol.gapBetween) !== null}
                                    onChange={(e) => editLevels((L) =>
                                      (L[lv.i].cols[c.j].gapBetween = e.target.checked ? (c.gapBetween ?? cab.gaps.between) : null))}
                                    className="h-3.5 w-3.5 accent-teal-700" />
                                  <span className="text-[11px] text-stone-600">własny luz między drzwiami</span>
                                </label>
                                {num(rawCol.gapBetween) !== null && (
                                  <>
                                    <input type="number" min={0} step={1}
                                      value={rawCol.gapBetween}
                                      onChange={(e) => editLevels((L) =>
                                        (L[lv.i].cols[c.j].gapBetween = e.target.value === "" ? 0 : Math.round(Number(e.target.value))))}
                                      className="w-14 rounded border border-stone-300 bg-white px-1.5 py-1 font-mono text-[11px] focus:border-teal-600 focus:outline-none" />
                                    <span className="text-[11px] text-stone-400">mm</span>
                                  </>
                                )}
                              </div>
                            )}
                          </div>
                        )}

                        <div className="flex items-center gap-2 text-xs">
                          <span className="w-16 shrink-0 text-stone-500">plecy</span>
                          <div className="flex-1">
                            <Seg value={rawCol.backMode || "inherit"}
                              onChange={(v) => setColBack(lv.i, c.j, v)}
                              options={[
                                { v: "inherit", l: "jak szafka" },
                                { v: "hdf", l: "HDF" },
                                { v: "board", l: "płyta" },
                                { v: "none", l: "brak" },
                              ]} />
                          </div>
                        </div>

                        {c.kind === "drawers" && (
                          <div className="space-y-2">
                            <div className="flex items-center gap-2 text-xs">
                              <span className="text-stone-500">głębokość NL</span>
                              <select value={rawCol.nl ?? ""}
                                onChange={(e) => setColNL(lv.i, c.j, e.target.value)}
                                className="rounded border border-stone-300 bg-white px-1.5 py-1 font-mono text-xs focus:border-teal-600 focus:outline-none">
                                <option value="">auto {geo.maxNL ? `(${geo.maxNL})` : ""}</option>
                                {VBOX.nl.map((v) => (
                                  <option key={v} value={v}>{v}</option>
                                ))}
                              </select>
                              <MiniBtn onClick={() => addDrawer(lv.i, c.j)}>+ szuflada</MiniBtn>
                              <MiniBtn onClick={() => fitFronts(lv.i, c.j)}
                                title="Rozdziel pasmo proporcjonalnie do wysokości boków">
                                dopasuj fronty
                              </MiniBtn>
                            </div>
                            {[...(c.drawers || [])].reverse().map((dr) => (
                              <div key={dr.i} className="flex items-center gap-2">
                                <select value={rawCol.drawers[dr.i]?.h ?? "auto"}
                                  title="Wysokość boku V-BOX — auto dobiera najwyższy mieszczący się w froncie"
                                  onChange={(e) => setDrawerH(lv.i, c.j, dr.i, e.target.value)}
                                  className="rounded border border-stone-300 bg-white px-1.5 py-1 font-mono text-[11px] focus:border-teal-600 focus:outline-none">
                                  <option value="auto">auto {dr.hClass}</option>
                                  {VBOX.heights.map((v) => (
                                    <option key={v} value={v}>{v} mm</option>
                                  ))}
                                </select>
                                <AutoNum value={rawCol.drawers[dr.i]?.front} placeholder={fmt(dr.h)}
                                  fixed={dr.fixed} warn={dr.h < VBOX.minFront[c.drawerMode || cab.frontMode][dr.hClass]}
                                  onChange={(v) => setDrawerFront(lv.i, c.j, dr.i, v)} />
                                <span className="w-12 shrink-0 text-right font-mono text-[11px]"
                                  style={{ color: dr.h < VBOX.minFront[c.drawerMode || cab.frontMode][dr.hClass] ? ERRC : "#a8a29e" }}>
                                  {fmt(dr.h)}
                                </span>
                                <label className="flex shrink-0 items-center gap-1 cursor-pointer"
                                  title="Uchwyt na tym froncie">
                                  <input type="checkbox"
                                    checked={rawCol.drawers[dr.i]?.handle !== false}
                                    onChange={(e) => setDrawerHandle(lv.i, c.j, dr.i, e.target.checked)}
                                    className="h-3.5 w-3.5 accent-teal-700" />
                                  <span className="text-[11px] text-stone-500">uchwyt</span>
                                </label>
                                <select value={rawCol.drawers[dr.i]?.nl ?? ""}
                                  title="Głębokość NL tej szuflady — puste bierze głębokość kolumny"
                                  onChange={(e) => setDrawerNL(lv.i, c.j, dr.i, e.target.value)}
                                  className="shrink-0 rounded border border-stone-300 bg-white px-1 py-1 font-mono text-[11px] focus:border-teal-600 focus:outline-none">
                                  <option value="">NL {c.nl ?? "auto"}</option>
                                  {VBOX.nl.map((v) => (
                                    <option key={v} value={v}>{v}</option>
                                  ))}
                                </select>
                                {(c.drawers || []).length > 1 && (
                                  <MiniBtn onClick={() => removeDrawer(lv.i, c.j, dr.i)} title="Usuń szufladę">×</MiniBtn>
                                )}
                              </div>
                            ))}
                            <p className="text-[11px] text-stone-400">
                              Lewe pole to wysokość boku V-BOX, prawe to wysokość frontu.
                              Puste = podziel pasmo równo.
                            </p>
                          </div>
                        )}

                        {c.kind !== "drawers" && nS > 0 && (
                          <div className="space-y-1">
                            {[...c.openings].reverse().map((o) => (
                              <div key={o.k} className="flex items-center gap-2">
                                <span className="w-20 shrink-0 text-[11px] text-stone-400">
                                  światło {o.k + 1}
                                </span>
                                <AutoNum value={rawCol.shelfTargets[o.k]} placeholder={fmt(o.h)}
                                  fixed={o.fixed} warn={o.h > 0 && o.h < 50}
                                  onChange={(v) => setColOpening(lv.i, c.j, o.k, v)} />
                                <span className="w-12 shrink-0 text-right font-mono text-[11px]"
                                  style={{ color: o.h > 0 && o.h < 50 ? WARNC : "#a8a29e" }}>{fmt(o.h)}</span>
                                {c.openings.length > 1 && (
                                  <MiniBtn onClick={() => removeShelfAt(lv.i, c.j, o.k)}
                                    title="Usuń półkę przy tym świetle">×</MiniBtn>
                                )}
                              </div>
                            ))}
                            <div className="flex items-center gap-2 pt-1">
                              <MiniBtn onClick={() => addShelf(lv.i, c.j)} tone="accent">+ półka</MiniBtn>
                              <button onClick={() => clearColOpenings(lv.i, c.j)}
                                className="text-[11px] text-teal-700 hover:underline">wszystkie równo</button>
                            </div>
                          </div>
                        )}

                        {/* elementy wzmacniajace kolumny */}
                        <div className="border-t border-stone-100 pt-2">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-medium text-stone-500">Wzmocnienia</span>
                            <MiniBtn onClick={() => addRail(lv.i, c.j)} tone="accent">+ wzmocnienie</MiniBtn>
                          </div>
                          {(rawCol.rails || []).map((r, ri) => (
                            <div key={ri} className="mt-2 space-y-2 rounded border border-stone-200 p-2">
                              <div className="flex items-center gap-2">
                                <div className="flex-1">
                                  <Seg value={r.orient}
                                    onChange={(v) => setRail(lv.i, c.j, ri, { orient: v })}
                                    options={[{ v: "front", l: "Czołowy" }, { v: "shelf", l: "Poziomy" }, { v: "vertical", l: "Pionowy" }]} />
                                </div>
                                <MiniBtn onClick={() => removeRail(lv.i, c.j, ri)} title="Usuń wzmocnienie">×</MiniBtn>
                              </div>
                              <div className="grid grid-cols-2 gap-2">
                                {r.orient !== "shelf" && (
                                  <Field label="Wysokość">
                                    <Num value={r.h} onChange={(v) => setRail(lv.i, c.j, ri, { h: v })} />
                                  </Field>
                                )}
                                {r.orient !== "front" && (
                                  <Field label="Głębokość">
                                    <Num value={r.depth} onChange={(v) => setRail(lv.i, c.j, ri, { depth: v })} />
                                  </Field>
                                )}
                                {r.orient !== "vertical" && (
                                  <Field label="Położenie">
                                    <Seg value={r.pos} onChange={(v) => setRail(lv.i, c.j, ri, { pos: v })}
                                      options={[{ v: "top", l: "Góra" }, { v: "bottom", l: "Dół" }]} />
                                  </Field>
                                )}
                                {r.orient === "vertical" && (
                                  <Field label="Przy boku">
                                    <Seg value={r.side} onChange={(v) => setRail(lv.i, c.j, ri, { side: v })}
                                      options={[{ v: "left", l: "Lewy" }, { v: "right", l: "Prawy" }]} />
                                  </Field>
                                )}
                                <Field label="Głębokość od lica" hint="0 = w licu">
                                  <Num value={r.atDepth} onChange={(v) => setRail(lv.i, c.j, ri, { atDepth: v })} />
                                </Field>
                              </div>
                              <div className="flex flex-wrap gap-x-4 gap-y-1">
                                <Check checked={!!r.fromBack} onChange={(v) => setRail(lv.i, c.j, ri, { fromBack: v })} label="Liczone od tyłu" />
                                {r.orient === "front" && (
                                  <Check checked={!!r.reducesDoor} onChange={(v) => setRail(lv.i, c.j, ri, { reducesDoor: v })} label="Skraca drzwi" />
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                  <MiniBtn onClick={() => addCol(lv.i)}>+ przegroda i kolumna</MiniBtn>
                </div>
              </div>
            ))}
          </Card>

          <Card title="Luzy drzwi" collapsible defaultOpen={false}>
            <div className="grid grid-cols-2 gap-3">
              {cab.frontMode === "overlay" ? (
                <>
                  <Field label="Od krawędzi korpusu"><Num value={cab.gaps.edge} onChange={(v) => setGap("edge", v)} /></Field>
                  <Field label="Między drzwiami"><Num value={cab.gaps.between} onChange={(v) => setGap("between", v)} /></Field>
                  <Field label="U góry"><Num value={cab.gaps.top} onChange={(v) => setGap("top", v)} /></Field>
                  <Field label="U dołu"><Num value={cab.gaps.bottom} onChange={(v) => setGap("bottom", v)} /></Field>
                </>
              ) : (
                <>
                  <Field label="Dookoła drzwi"><Num value={cab.gaps.inset} onChange={(v) => setGap("inset", v)} /></Field>
                  <Field label="Między drzwiami"><Num value={cab.gaps.between} onChange={(v) => setGap("between", v)} /></Field>
                </>
              )}
              {cab.frontMode === "overlay" && (
                <Field label="Nałożenie na przegrodę"
                  hint={`Szczelina nad przegrodą: ${fmt(mat.board.thickness - 2 * (cab.gaps.divOverlay ?? 8))} mm`}>
                  <Num value={cab.gaps.divOverlay ?? 8} onChange={(v) => setGap("divOverlay", v)} />
                </Field>
              )}
              <Field label="Ostrzegaj powyżej"><Num value={cab.maxGap} onChange={(v) => set({ maxGap: v })} /></Field>
              <Field label="Kąt otwarcia" hint="do widoku 3D">
                <Num value={cab.openAngle ?? 90} onChange={(v) => set({ openAngle: v })} suffix="°" />
              </Field>
              <Field label="Dodatkowe cofnięcie półki"
                hint={cab.frontMode === "inset"
                  ? `Drzwi wewnątrz — półka jest już krótsza o ${fmt(mat.front.thickness + 5)} mm.`
                  : "Drzwi na korpusie — półka na pełną głębokość."}>
                <Num value={cab.shelfExtraSetback || 0} onChange={(v) => set({ shelfExtraSetback: v })} />
              </Field>
            </div>
          </Card>

          <Card title="Wycięcie w narożniku (tylne)" collapsible defaultOpen={false}>
            <p className="text-xs text-stone-500">
              Oba tylne narożniki można wyciąć niezależnie (np. na dwie rury), każdy z własnymi wymiarami.
            </p>
            {[
              { key: "cutout", label: "Wytnij narożnik lewy (np. na rurę)" },
              { key: "cutoutR", label: "Wytnij narożnik prawy (np. na rurę)" },
            ].map(({ key, label }) => {
              const cu = cab[key] || {};
              const upd = (patch) => set({ [key]: { ...cu, ...patch } });
              const gCut = geo.geoCuts.find((x) => x.onLeft === (key === "cutout"));
              return (
                <div key={key} className="space-y-3 border-t border-stone-100 pt-3 first:border-t-0 first:pt-0">
                  <Check checked={!!cu.on} onChange={(v) => upd({ on: v })} label={label} />
                  {cu.on && (
                    <>
                      <div className="grid grid-cols-2 gap-3">
                        <Field label="Szerokość od boku">
                          <Num value={cu.w ?? 100} onChange={(v) => upd({ w: v })} />
                        </Field>
                        <Field label="Głębokość od tyłu">
                          <Num value={cu.d ?? 100} onChange={(v) => upd({ d: v })} />
                        </Field>
                      </div>
                      {geo.levels.length > 1 && (
                        <>
                          <Check checked={cu.fullHeight !== false}
                            onChange={(v) => upd({ fullHeight: v })}
                            label="Wycięcie przez całą wysokość szafki" />
                          {cu.fullHeight === false && (
                            <Field label="Poziom z wycięciem">
                              <Seg value={String(cu.levelIndex || 0)}
                                onChange={(v) => upd({ levelIndex: Number(v) })}
                                options={geo.levels.map((lv) => ({ v: String(lv.i), l: `Poziom ${lv.i + 1}` }))} />
                            </Field>
                          )}
                        </>
                      )}
                      <Check checked={cu.mask !== false}
                        onChange={(v) => upd({ mask: v })}
                        label="Zabuduj otwór maskownicą" />
                      {cu.mask !== false && (
                        <>
                          <Field label="Widoczna ścianka" hint="wycięcie zabudowuje się w L — jeden bok zachodzi na drugi">
                            <Seg value={cu.maskCorner === "horizontal" ? "horizontal" : cu.maskCorner === "vertical" ? "vertical" : "auto"}
                              onChange={(v) => upd({ maskCorner: v })}
                              options={[
                                { v: "auto", l: "Auto" },
                                { v: "vertical", l: "Boczna" },
                                { v: "horizontal", l: "Czołowa" },
                              ]} />
                          </Field>
                          {gCut?.maskVisible && (
                            <p className="text-xs text-stone-500">
                              Widoczna ścianka: {gCut.maskVisible === "vertical" ? "boczna" : "czołowa"}.
                            </p>
                          )}
                        </>
                      )}
                    </>
                  )}
                </div>
              );
            })}
            <p className="text-xs text-stone-500">
              Formatki korpusu do zamówienia zostają pełnymi prostokątami — wycięcie
              robisz sam. Zabudowa jest liczona z płyty półek.
            </p>
          </Card>

          <Card title="Elementy kolizyjne" collapsible defaultOpen={false}
            right={<MiniBtn onClick={addObstacle} tone="accent">+ element</MiniBtn>}>
            {obsList.length === 0 && (
              <p className="text-sm text-stone-400">
                Brak przeszkód. Dodaj element, jeśli w szafce przebiega rura albo kanał wentylacyjny.
              </p>
            )}
            {obsList.map((ob, oi) => {
              const g = (geo.geoObs || [])[oi];
              return (
                <div key={oi} className="space-y-3 rounded border border-stone-200 p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-stone-600">
                      {obsList.length > 1 ? `Element ${oi + 1}` : "Element kolizyjny"}
                    </span>
                    <MiniBtn onClick={() => removeObstacle(oi)} title="Usuń element">×</MiniBtn>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Szerokość">
                      <Num value={ob.w ?? 80} onChange={(v) => setObstacle(oi, { w: v })} />
                    </Field>
                    <Field label="Głębokość">
                      <Num value={ob.d ?? 80} onChange={(v) => setObstacle(oi, { d: v })} />
                    </Field>
                  </div>
                  <Field label="Liczone od boku">
                    <Seg value={ob.side === "left" ? "left" : "right"}
                      onChange={(v) => setObstacle(oi, { side: v })}
                      options={[{ v: "left", l: "Od lewej" }, { v: "right", l: "Od prawej" }]} />
                  </Field>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label={ob.side === "left" ? "Od lewego boku" : "Od prawego boku"}
                      hint="od zewnętrznej krawędzi szafki">
                      <Num value={ob.fromSide ?? 0} onChange={(v) => setObstacle(oi, { fromSide: v })} />
                    </Field>
                    <Field label="Od tyłu" hint="od tylnej płaszczyzny">
                      <Num value={ob.fromBack ?? 0} onChange={(v) => setObstacle(oi, { fromBack: v })} />
                    </Field>
                  </div>
                  {g && (
                    <div className="rounded bg-stone-50 px-3 py-2 font-mono text-xs text-stone-600">
                      od lewej: {fmt(g.distLeft)} mm &nbsp;·&nbsp; od prawej: {fmt(g.distRight)} mm
                    </div>
                  )}
                  <Check checked={ob.fullHeight !== false}
                    onChange={(v) => setObstacle(oi, { fullHeight: v })}
                    label="Na całą wysokość szafki" />
                  {ob.fullHeight === false && (
                    <div className="grid grid-cols-2 gap-3">
                      <Field label="Od dna">
                        <Num value={ob.fromBottom ?? 0} onChange={(v) => setObstacle(oi, { fromBottom: v })} />
                      </Field>
                      <Field label="Wysokość bryły">
                        <Num value={ob.h ?? 0} onChange={(v) => setObstacle(oi, { h: v })} />
                      </Field>
                    </div>
                  )}
                  <Check checked={!!ob.mask} onChange={(v) => setObstacle(oi, { mask: v })}
                    label="Zabuduj element (odgrodź od wnętrza)" />
                  {ob.mask && (
                    <>
                      <Field label="Typ zabudowy" hint={g?.maskChosen
                        ? `Program wybrał: ${g.maskChosen === "U" ? "U (trzy ścianki)" : "L (dwie ścianki)"}`
                        : "Auto dobiera L w narożniku, U przy ścianie lub w środku."}>
                        <Seg value={ob.maskType || "auto"}
                          onChange={(v) => setObstacle(oi, { maskType: v })}
                          options={[{ v: "auto", l: "Auto" }, { v: "L", l: "L" }, { v: "U", l: "U" }]} />
                      </Field>
                      {g?.shelfAbove != null && (
                        <>
                          <Check checked={!!ob.maskToShelf}
                            onChange={(v) => setObstacle(oi, { maskToShelf: v })}
                            label={`Zabudowa tylko do półki (${fmt(g.shelfAbove)} mm)`} />
                          {ob.maskToShelf && (
                            <Field label="Wysokość zabudowy"
                              hint="puste = do półki; wpisz, jeśli ma być inna">
                              <Num value={ob.maskH ?? ""} placeholder={String(Math.round(g.shelfAbove - (g.oy0 ?? 0)))}
                                onChange={(v) => setObstacle(oi, { maskH: v })} />
                            </Field>
                          )}
                        </>
                      )}
                      {g?.maskChosen === "U" && (
                        <Field label="Montaż czoła">
                          <Seg value={ob.maskFront === "between" ? "between" : "over"}
                            onChange={(v) => setObstacle(oi, { maskFront: v })}
                            options={[{ v: "over", l: "Przed bokami" }, { v: "between", l: "Między bokami" }]} />
                        </Field>
                      )}
                      {g?.maskChosen === "L" && (
                        <Field label="Który bok widoczny" hint="jeden bok musi zachodzić na drugi">
                          <Seg value={ob.maskCorner === "horizontal" ? "horizontal" : "vertical"}
                            onChange={(v) => setObstacle(oi, { maskCorner: v })}
                            options={[{ v: "vertical", l: "Boczna" }, { v: "horizontal", l: "Czołowa" }]} />
                        </Field>
                      )}
                    </>
                  )}
                </div>
              );
            })}
            <p className="text-xs text-stone-500">
              Odległości liczone od zewnętrznych krawędzi szafki, tak samo jak przy wycięciu
              narożnika. Przy 0 i 0 bryła siada w narożniku i skraca bok oraz plecy dokładnie
              tak jak wycięcie.
            </p>
          </Card>

          <Card title="Cokół" collapsible defaultOpen={false}>
            <Check checked={cab.plinth.on} onChange={(v) => set({ plinth: { ...cab.plinth, on: v } })} label="Cokół pod szafką" />
            {cab.plinth.on && (
              <div className="space-y-3">
                <Field label="Montaż" hint={!(geo.botL === "between" && geo.botR === "between")
                  ? "Cokół pod dnem wymaga dna między bokami."
                  : geo.plinthInBody
                  ? "Boki schodzą do podłogi, dno siedzi na cokole. Oklejana krawędź dolna."
                  : "Cały korpus stoi na cokole."}>
                  <Seg value={geo.pMode} onChange={(v) => set({ plinth: { ...cab.plinth, mode: v } })}
                    options={[{ v: "inbody", l: "Pod dnem, w obrysie" }, { v: "under", l: "Pod korpusem" }]} />
                </Field>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Wysokość">
                    <Num value={cab.plinth.height} onChange={(v) => set({ plinth: { ...cab.plinth, height: v } })} />
                  </Field>
                  <Field label="Cofnięcie w głąb" hint="0 = równo z przodem">
                    <Num value={cab.plinth.setback || 0} onChange={(v) => set({ plinth: { ...cab.plinth, setback: v } })} />
                  </Field>
                </div>
              </div>
            )}
          </Card>

          <Card title="Nóżki" collapsible defaultOpen={false}>
            <Check checked={!!cab.legs?.on}
              onChange={(v) => set({ legs: { ...(cab.legs || { height: 100 }), on: v } })}
              label="Nóżki pod szafką" />
            {cab.legs?.on && (
              <Field label="Wysokość nóżki"
                hint={`Całkowita wysokość z podstawą: ${fmt(cab.H + Math.max(cab.legs.height || 100, cab.plinth.on && !geo.plinthInBody ? geo.plinthH : 0))} mm`}>
                <Num value={cab.legs.height ?? 100}
                  onChange={(v) => set({ legs: { ...cab.legs, height: v } })} />
              </Field>
            )}
          </Card>

          <Card title="Blenda nad szafką" collapsible defaultOpen={false}>
            <Check checked={!!cab.topFiller?.on}
              onChange={(v) => set({ topFiller: { ...(cab.topFiller || { height: 100 }), on: v } })}
              label="Blenda nad szafką" />
            {cab.topFiller?.on && (
              <Field label="Wysokość blendy" hint="maskownica do sufitu / zasłonięcie otworu">
                <Num value={cab.topFiller.height ?? 100}
                  onChange={(v) => set({ topFiller: { ...cab.topFiller, height: v } })} />
              </Field>
            )}
          </Card>

          <Card title="Notatka montażowa" collapsible defaultOpen={false}>
            <p className="text-xs text-stone-500">
              Uwagi do tej szafki — trafiają na jej stronę w zestawieniu PDF.
            </p>
            <textarea value={cab.note || ""} rows={3}
              placeholder="np. idzie pod okno, uważać na rurę przy prawym boku"
              onChange={(e) => set({ note: e.target.value })}
              className="w-full rounded border border-stone-300 bg-white px-2 py-1.5 text-sm focus:border-teal-600 focus:outline-none" />
          </Card>

          <Card title="Płyty" collapsible defaultOpen={false}>
            <Check checked={cab.frontSameAsBoard !== false}
              onChange={(v) => set({ frontSameAsBoard: v })}
              label="Fronty z tej samej płyty co korpus" />
            <Check checked={cab.shelfSameAsBoard !== false}
              onChange={(v) => set({ shelfSameAsBoard: v })}
              label="Półki z tej samej płyty co korpus" />
            {[
              "board",
              ...(cab.frontSameAsBoard !== false ? [] : ["front"]),
              ...(cab.shelfSameAsBoard !== false ? [] : ["shelf"]),
              "back",
              "mirror",
            ].map((k) => (
              <div key={k} className="space-y-2 border-t border-stone-100 pt-3 first:border-0 first:pt-0">
                <div className="flex items-end gap-2">
                <div className="flex-1">
                <Field label={
                  k === "board"
                    ? "Korpus" +
                      (cab.shelfSameAsBoard !== false ? ", półki" : "") +
                      (cab.frontSameAsBoard !== false ? " i fronty" : "")
                    : k === "front" ? "Drzwi"
                    : k === "shelf" ? "Półki"
                    : k === "back" ? "Plecy" : "Lustro"
                }>
                  <input value={mat[k].name}
                    onChange={(e) => setMat({ ...mat, [k]: { ...mat[k], name: e.target.value } })}
                    className="w-full rounded border border-stone-300 bg-white px-2 py-1.5 text-sm focus:border-teal-600 focus:outline-none" />
                </Field>
                </div>
                <div className="w-20">
                <Field label="Grubość">
                  <Num value={mat[k].thickness}
                    onChange={(v) => setMat({ ...mat, [k]: { ...mat[k], thickness: v } })} suffix="" />
                </Field>
                </div>
                {k === "mirror" ? (
                  <div className="h-9 w-11 rounded border border-stone-300"
                    style={{ background: mat[k].color }}
                    title="Kolor lustra jest stały" />
                ) : (
                  <input type="color" value={mat[k].color}
                    onChange={(e) => setMat({ ...mat, [k]: { ...mat[k], color: e.target.value } })}
                    className="h-9 w-11 cursor-pointer rounded border border-stone-300 bg-white" />
                )}
                </div>
                {k !== "mirror" && (
                  <div className="flex flex-wrap gap-1">
                    {PALETA.map(([nazwa, hex]) => (
                      <button key={hex} title={nazwa}
                        onClick={() => setMat({ ...mat, [k]: { ...mat[k], color: hex } })}
                        className={"h-6 w-6 rounded border transition-transform hover:scale-110 " +
                          (mat[k].color.toLowerCase() === hex.toLowerCase()
                            ? "border-teal-700 ring-1 ring-teal-700"
                            : "border-stone-300")}
                        style={{ background: hex }} />
                    ))}
                  </div>
                )}
              </div>
            ))}
            <Check checked={cab.grainMatters} onChange={(v) => set({ grainMatters: v })}
              label="Kierunek usłojenia ma znaczenie" />
          </Card>
        </div>

        <div className="mt-4 space-y-4 lg:mt-0">
          <Card title="Rysunek"
            right={
              <div className="flex items-center gap-3">
                <button onClick={() => setShowDims((s) => !s)} className="text-xs text-teal-700 hover:underline">
                  {showDims ? "Ukryj wymiary" : "Pokaż wymiary"}
                </button>
                {view === "closed" && (
                  <button onClick={() => setShowGaps((s) => !s)}
                    className="text-xs text-teal-700 hover:underline">
                    {showGaps ? "Ukryj szczeliny" : "Pokaż szczeliny"}
                  </button>
                )}
                <button onClick={() => set({ realColors: !cab.realColors })}
                  className="text-xs text-teal-700 hover:underline">
                  {cab.realColors ? "Rozróżnij fronty" : "Realne kolory"}
                </button>
                {view === "side" && (
                  <button onClick={() => setSideWhich((s) => (s === "left" ? "right" : "left"))}
                    className="text-xs text-teal-700 hover:underline">
                    {sideWhich === "left" ? "Pokaż prawy bok" : "Pokaż lewy bok"}
                  </button>
                )}
                {view === "top" && (
                  <button onClick={() => setShowShelves((s) => !s)}
                    className="text-xs text-teal-700 hover:underline">
                    {showShelves ? "Ukryj półki" : "Rysuj półki"}
                  </button>
                )}
                {(view === "closed" || view === "open") && (
                  <button onClick={() => setShowLabels((s) => !s)}
                    className="text-xs text-teal-700 hover:underline">
                    {showLabels ? "Ukryj oznaczenia" : "Oznacz pola"}
                  </button>
                )}
                {(view === "open" || view === "side" || view === "top") && (
                  <button onClick={() => setShowHardware((s) => !s)}
                    className="text-xs text-teal-700 hover:underline">
                    {showHardware ? "Ukryj okucia" : "Pokaż okucia"}
                  </button>
                )}
                <div className="w-80">
                  <Seg value={view} onChange={setView}
                    options={[
                      { v: "closed", l: "Zamk." },
                      { v: "open", l: "Otw." },
                      { v: "side", l: "Z boku" },
                      { v: "top", l: "Z góry" },
                      { v: "rear", l: "Z tyłu" },
                      { v: "3d", l: "3D" },
                    ]} />
                </div>
              </div>
            }>
            <div className="rounded border border-stone-100 bg-stone-50 p-3">
              {view === "3d" ? (
                <div className="space-y-3">
                  <div
                    className="cursor-grab active:cursor-grabbing touch-none"
                    onPointerDown={(e) => {
                      drag.current = { x: e.clientX, y: e.clientY, yaw, pitch };
                      e.currentTarget.setPointerCapture(e.pointerId);
                    }}
                    onPointerMove={(e) => {
                      if (!drag.current) return;
                      const dx = e.clientX - drag.current.x;
                      const dy = e.clientY - drag.current.y;
                      setYaw(drag.current.yaw + dx * 0.008);
                      setPitch(
                        Math.max(-1.2, Math.min(1.2, drag.current.pitch + dy * 0.006))
                      );
                    }}
                    onPointerUp={() => (drag.current = null)}
                    onPointerCancel={() => (drag.current = null)}
                  >
                    <Scene3D cab={cab} geo={geo} mat={mat} open={open3d} yaw={yaw} pitch={pitch} angle={angle3d} />
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <MiniBtn onClick={() => setYaw((v) => v - Math.PI / 4)}>◀ 45°</MiniBtn>
                    <MiniBtn onClick={() => { setYaw(-0.55); setPitch(0.28); }}>reset</MiniBtn>
                    <MiniBtn onClick={() => setYaw((v) => v + Math.PI / 4)}>45° ▶</MiniBtn>
                    <MiniBtn tone={open3d ? "on" : "plain"} onClick={() => setOpen3d((v) => !v)}>
                      {open3d ? "otwarte" : "zamknięte"}
                    </MiniBtn>
                    {open3d && (
                      <label className="flex items-center gap-2">
                        <span className="text-xs text-stone-500">kąt</span>
                        <input type="range" min={0} max={110} step={1} value={angle3d}
                          onChange={(e) => setAngle3d(Number(e.target.value))}
                          className="w-32 accent-teal-700" />
                        <span className="w-10 font-mono text-xs text-stone-500">{angle3d}°</span>
                      </label>
                    )}
                    <span className="ml-auto font-mono text-xs text-stone-400">
                      przeciągnij, żeby obrócić
                    </span>
                  </div>
                </div>
              ) : view === "side" ? (
                <SideView cab={cab} geo={geo} mat={mat} showDims={showDims} which={sideWhich}
                  showHardware={showHardware} />
              ) : view === "top" ? (
                <TopView cab={cab} geo={geo} mat={mat} showDims={showDims} showShelves={showShelves}
                  showHardware={showHardware} />
              ) : view === "rear" ? (
                <RearView cab={cab} geo={geo} mat={mat} showDims={showDims} />
              ) : (
                <FrontView cab={cab} geo={geo} mat={mat} open={view === "open"} showDims={showDims}
                  showGaps={showGaps} showLabels={showLabels} showHardware={showHardware} />
              )}
            </div>
          </Card>

          {(errors.length > 0 || warns.length > 0 || infos.length > 0) && (
            <div ref={notesRef} className="scroll-mt-24">
            <Card title="Uwagi">
              {(errors.length > 0 || warns.length > 0) && (
                <ul className="space-y-2">
                  {errors.map((m, i) => (
                    <NoteLine key={"e" + i} text={m.text} color={ERRC} icon="×" editLevels={editLevels} cab={cab} />
                  ))}
                  {warns.map((m, i) => (
                    <NoteLine key={"w" + i} text={m.text} color={WARNC} icon="!" editLevels={editLevels} cab={cab} />
                  ))}
                </ul>
              )}
              {infos.length > 0 && (
                <div className={(errors.length || warns.length) ? "border-t border-stone-100 pt-3" : ""}>
                  <div className="mb-2 text-xs font-medium uppercase tracking-wider text-stone-400">
                    Podpowiedzi — nic nie trzeba poprawiać
                  </div>
                  <ul className="space-y-2">
                    {infos.map((m, i) => (
                      <NoteLine key={"i" + i} text={m.text} color="#78716c" icon="i" editLevels={editLevels} cab={cab} />
                    ))}
                  </ul>
                </div>
              )}
            </Card>
            </div>
          )}

          <Card title="Kontrola frontów" collapsible defaultOpen={false}>
            <p className="text-xs text-stone-500">
              Rzeczywiste położenie każdego frontu na szerokości szafki, z odstępem do
              sąsiada. Liczby są liczone z tego samego silnika co formatki.
            </p>
            {geo.levels.map((lv) => {
              const rows = geo.doors
                .filter((d) => d.lvl === lv.i && d.w > 0)
                .sort((a, b) => b.y - a.y || a.x - b.x);
              if (!rows.length) return null;
              return (
                <div key={lv.i}>
                  <div className="mb-1 text-xs font-medium text-stone-700">
                    Poziom {lv.i + 1}
                  </div>
                  <table className="w-full text-xs">
                    <tbody className="font-mono">
                      {rows.map((d, i) => {
                        let nb = null;
                        rows.forEach((b) => {
                          if (b === d || b.x < d.x + d.w - 0.5) return;
                          const vo = Math.min(d.y + d.h, b.y + b.h) - Math.max(d.y, b.y);
                          if (vo <= 0) return;
                          if (!nb || b.x < nb.x) nb = b;
                        });
                        const gap = nb ? Math.round(nb.x - (d.x + d.w)) : null;
                        const nm = { door: "drzwi", drawer: "szuflada", fix: "fix", blenda: "blenda" }[d.type];
                        return (
                          <tr key={i} className="border-b border-stone-100">
                            <td className="py-1 pr-2 font-sans text-stone-600">{nm}</td>
                            <td className="py-1 pr-2 text-right">{fmt(d.x)}</td>
                            <td className="py-1 pr-2 text-stone-400">…</td>
                            <td className="py-1 pr-2">{fmt(d.x + d.w)}</td>
                            <td className="py-1 pr-2 text-right text-stone-500">{fmt(d.w)}×{fmt(d.h)}</td>
                            <td className="py-1 text-right"
                              style={{ color: gap === null ? "#a8a29e" : gap < 2 ? ERRC : "#78716c" }}>
                              {gap === null ? "—" : `luz ${fmt(gap)}`}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              );
            })}
          </Card>

          <Card title="Formatki do zamówienia"
            right={
              <div className="flex items-center gap-3">
                {Object.keys(cab.edgeOverrides || {}).length > 0 && (
                  <button onClick={() => set({ edgeOverrides: {} })} className="text-xs text-teal-700 hover:underline">
                    Wróć do automatycznego oklejania
                  </button>
                )}
                <button onClick={addExtraPart}
                  title="Dopisz formatkę spoza geometrii szafki — np. blat, listwę, półkę na wymiar"
                  className="text-xs text-teal-700 hover:underline">
                  + dodatkowa formatka
                </button>
                {project.items.length === 1 && (
                  <button onClick={() => makeCutPlan("cab")}
                    title="Ułóż formatki na arkuszach i policz, ile płyt zamówić"
                    className="text-xs font-medium text-teal-700 hover:underline">
                    Rozkrój na płycie
                  </button>
                )}
              </div>
            }>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-sm">
                <thead>
                  <tr className="border-b border-stone-200 text-left text-xs uppercase tracking-wider text-stone-500">
                    <th className="py-2 pr-3 font-medium">Element</th>
                    <th className="py-2 pr-3 font-medium">Płyta</th>
                    <th className="py-2 pr-3 text-right font-medium">Długość</th>
                    <th className="py-2 pr-3 text-right font-medium">Szerokość</th>
                    <th className="py-2 pr-3 text-right font-medium">Szt.</th>
                    <th className="py-2 pr-3 font-medium">Oklejanie PCV 2 mm</th>
                    <th className="py-2 font-medium">Słoje</th>
                  </tr>
                </thead>
                <tbody className="font-mono">
                  {cutList.map((p, i) => (
                    <tr key={i} className="border-b border-stone-100">
                      <td className="py-2 pr-3 font-sans">{p.name}</td>
                      <td className="py-2 pr-3 font-sans text-stone-500">{mat[p.matKey].name}</td>
                      <td className="py-2 pr-3 text-right">{fmt(p.a)}</td>
                      <td className="py-2 pr-3 text-right">{fmt(p.b)}</td>
                      <td className="py-2 pr-3 text-right">{p.qty}</td>
                      <td className="py-2 pr-3"><EdgeChips p={p} /></td>
                      <td className="py-2 font-sans text-stone-500">
                        {p.matKey === "back" ? "—" : cab.grainMatters ? "wzdłuż dł." : "dowolnie"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {(cab.extraParts || []).length > 0 && (
              <div className="space-y-2 border-t border-stone-200 pt-3">
                <span className="block text-xs uppercase tracking-wider text-stone-500">
                  Dodatkowe formatki
                </span>
                {(cab.extraParts || []).map((e, i) => (
                  <div key={i} className="space-y-1.5 rounded border border-stone-200 bg-stone-50 p-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <input value={e.name || ""} placeholder={`Dodatkowa formatka ${i + 1}`}
                        onChange={(ev) => setExtraPart(i, { name: ev.target.value })}
                        className="min-w-[9rem] flex-1 rounded border border-stone-300 bg-white px-1.5 py-1 text-xs focus:border-teal-600 focus:outline-none" />
                      <select value={e.matKey || "board"}
                        onChange={(ev) => setExtraPart(i, { matKey: ev.target.value })}
                        className="rounded border border-stone-300 bg-white px-1.5 py-1 text-xs focus:border-teal-600 focus:outline-none">
                        <option value="board">{mat.board.name}</option>
                        <option value="front">{mat.front.name}</option>
                        <option value="shelf">{mat.shelf?.name || "Półka"}</option>
                        <option value="back">{mat.back.name}</option>
                      </select>
                      <MiniBtn tone="plain" onClick={() => removeExtraPart(i)} title="Usuń formatkę">×</MiniBtn>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <span className="text-stone-500">długość</span>
                      <input type="number" min={1} step={1} value={e.a ?? ""}
                        onChange={(ev) => setExtraPart(i, { a: ev.target.value === "" ? null : Number(ev.target.value) })}
                        className="w-20 rounded border border-stone-300 bg-white px-1.5 py-1 font-mono text-xs focus:border-teal-600 focus:outline-none" />
                      <span className="text-stone-500">szerokość</span>
                      <input type="number" min={1} step={1} value={e.b ?? ""}
                        onChange={(ev) => setExtraPart(i, { b: ev.target.value === "" ? null : Number(ev.target.value) })}
                        className="w-20 rounded border border-stone-300 bg-white px-1.5 py-1 font-mono text-xs focus:border-teal-600 focus:outline-none" />
                      <span className="text-stone-500">szt.</span>
                      <input type="number" min={1} step={1} value={e.qty ?? 1}
                        onChange={(ev) => setExtraPart(i, { qty: Math.max(1, Number(ev.target.value) || 1) })}
                        className="w-14 rounded border border-stone-300 bg-white px-1.5 py-1 font-mono text-xs focus:border-teal-600 focus:outline-none" />
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5 text-xs">
                      <span className="mr-1 text-stone-500">oklejanie</span>
                      {[
                        ["a1", "przód", "a"], ["a2", "tył", "a"],
                        ["b1", "bok", "b"], ["b2", "bok", "b"],
                      ].map(([k, lab, dim], n) => (
                        <MiniBtn key={k} tone={(e.edges || {})[k] ? "on" : "plain"}
                          onClick={() => setExtraPart(i, { edges: { ...(e.edges || {}), [k]: !(e.edges || {})[k] } })}
                          title={`Krawędź ${lab} — długość ${dim === "a" ? "A" : "B"}`}>
                          {lab} {fmt(dim === "a" ? e.a || 0 : e.b || 0)}
                        </MiniBtn>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="grid gap-3 border-t border-stone-200 pt-3 text-sm sm:grid-cols-3">
              <div>
                <span className="block text-xs uppercase tracking-wider text-stone-500">Sztuk razem</span>
                <span className="font-mono text-lg">{cutList.reduce((s, p) => s + p.qty, 0)}</span>
              </div>
              <div>
                <span className="block text-xs uppercase tracking-wider text-stone-500">Obrzeże PCV</span>
                <span className="font-mono text-lg">{fmt(edgeMeters)} mb</span>
              </div>
              <div>
                <span className="block text-xs uppercase tracking-wider text-stone-500">Powierzchnia</span>
                <span className="font-mono text-sm">
                  {Object.entries(boardArea).map(([k, v]) => (
                    <span key={k} className="block">{mat[k].name}: {fmt(v)} m²</span>
                  ))}
                </span>
              </div>
            </div>
            <p className="text-xs text-stone-500">
              Wymiary są wymiarami gotowej formatki — automat szlifuje krawędź o 2 mm i nakleja
              obrzeże, więc zamawiasz dokładnie te liczby.
            </p>
          </Card>

          {project.items.length > 1 && (
            <Card title={`Formatki całego projektu${project.name ? " — " + project.name : ""}`}
              right={
                <div className="flex items-center gap-3">
                  <button onClick={() => makeCutPlan("project")}
                    title="Ułóż formatki całego projektu na arkuszach"
                    className="text-xs font-medium text-teal-700 hover:underline">
                    Rozkrój na płycie
                  </button>
                  <span className="text-xs text-stone-400">{project.items.length} szafek</span>
                </div>
              }>
              <p className="mb-2 text-xs text-stone-500">
                Suma formatek ze wszystkich szafek w projekcie — do zamówienia płyty na całość naraz.
                Formatki o tych samych wymiarach i materiale są łączone; różne materiały liczone osobno.
              </p>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[640px] text-sm">
                  <thead>
                    <tr className="border-b border-stone-200 text-left text-xs uppercase tracking-wider text-stone-500">
                      <th className="py-2 pr-3 font-medium">Element</th>
                      <th className="py-2 pr-3 font-medium">Płyta</th>
                      <th className="py-2 pr-3 text-right font-medium">Długość</th>
                      <th className="py-2 pr-3 text-right font-medium">Szerokość</th>
                      <th className="py-2 pr-3 text-right font-medium">Szt.</th>
                      <th className="py-2 font-medium">Oklejanie PCV 2 mm</th>
                    </tr>
                  </thead>
                  <tbody className="font-mono">
                    {projectCutList.map((p, i) => {
                      const eg = [];
                      if (p.edges.a1) eg.push(`przód ${fmt(p.a)}`);
                      if (p.edges.a2) eg.push(`tył ${fmt(p.a)}`);
                      if (p.edges.b1) eg.push(`bok ${fmt(p.b)}`);
                      if (p.edges.b2) eg.push(`bok ${fmt(p.b)}`);
                      return (
                        <tr key={i} className="border-b border-stone-100">
                          <td className="py-2 pr-3 font-sans">{p.name}</td>
                          <td className="py-2 pr-3 font-sans text-stone-500">
                            <span className="inline-flex items-center gap-1.5">
                              <span className="inline-block h-3 w-3 shrink-0 rounded-sm border border-stone-300"
                                style={{ background: p.matColor }} />
                              {p.matName}
                            </span>
                          </td>
                          <td className="py-2 pr-3 text-right">{fmt(p.a)}</td>
                          <td className="py-2 pr-3 text-right">{fmt(p.b)}</td>
                          <td className="py-2 pr-3 text-right">{p.qty}</td>
                          <td className="py-2 font-sans text-xs text-stone-500">{eg.length ? eg.join(", ") : "—"}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <div className="grid gap-3 border-t border-stone-200 pt-3 text-sm sm:grid-cols-3">
                <div>
                  <span className="block text-xs uppercase tracking-wider text-stone-500">Sztuk razem</span>
                  <span className="font-mono text-lg">{projectCutList.reduce((s, p) => s + p.qty, 0)}</span>
                </div>
                <div>
                  <span className="block text-xs uppercase tracking-wider text-stone-500">Obrzeże PCV</span>
                  <span className="font-mono text-lg">{fmt(projectEdgeMeters)} mb</span>
                </div>
                <div>
                  <span className="block text-xs uppercase tracking-wider text-stone-500">Powierzchnia</span>
                  <span className="font-mono text-sm">
                    {Object.entries(projectBoardArea).map(([k, v]) => (
                      <span key={k} className="block">{k}: {fmt(v)} m²</span>
                    ))}
                  </span>
                </div>
              </div>
            </Card>
          )}

          {cutPlan && (
            <Card title={`Rozkrój na płycie${cutPlan.scope === "project" ? " — cały projekt" : ""}`}
              right={
                <button onClick={() => setCutPlan(null)} className="text-xs text-stone-500 hover:underline">
                  Zamknij
                </button>
              }>
              <p className="text-xs text-stone-500">
                Arkusz {fmt(SHEET_W)} × {fmt(SHEET_H)} mm, rzaz piły {KERF} mm. Układ jest
                gilotynowy — każde cięcie idzie przez cały pozostały kawałek, więc da się go
                wykonać piłą panelową. Formatki oznaczone ↻ są obrócone; dzieje się to tylko tam,
                gdzie słoje nie mają znaczenia. Zielonym obrysem zaznaczone są zrzuty, czyli
                resztki w jednym kawałku — program celowo zbija je razem, żeby zostawić jak
                największy użyteczny kawałek zamiast garści ścinków. Za użyteczne uznaje resztki
                od {MIN_USEFUL} mm w obu wymiarach.
              </p>
              {cutPlan.groups.map((g, gi) => (
                <div key={gi} className="space-y-3 border-t border-stone-200 pt-3">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <span className="text-sm font-medium text-stone-800">{g.matLabel}</span>
                    <span className="font-mono text-sm text-stone-600">
                      {g.sheets.length} {plural(g.sheets.length, "arkusz", "arkusze", "arkuszy")}
                      {" · wykorzystanie "}{fmt(g.usedPct)}%
                      {" · cięć "}{g.cuts}
                      {g.biggestRect && (
                        <span style={{ color: "#15803d" }}>
                          {" · zrzut "}{fmt(g.biggestRect.w)}×{fmt(g.biggestRect.h)}
                        </span>
                      )}
                    </span>
                  </div>
                  {g.rejected.length > 0 && (
                    <p className="rounded border border-red-200 bg-red-50 px-2 py-1 text-xs"
                      style={{ color: ERRC }}>
                      {g.rejected.length}{" "}
                      {plural(g.rejected.length, "formatka nie mieści się", "formatki nie mieszczą się", "formatek nie mieści się")}
                      {" na arkuszu: "}
                      {[...new Set(g.rejected.map((r) => `${r.name} ${fmt(r.w)}×${fmt(r.h)}`))].join(", ")}
                    </p>
                  )}
                  <div className="grid gap-4 xl:grid-cols-2">
                    {g.sheets.map((sh, i) => (
                      <SheetPlan key={i} sheet={sh} sheetW={g.sheetW} sheetH={g.sheetH}
                        index={i} total={g.sheets.length} />
                    ))}
                  </div>
                </div>
              ))}
              <div className="border-t border-stone-200 pt-3 text-sm">
                <span className="text-xs uppercase tracking-wider text-stone-500">Płyty do zamówienia</span>
                <div className="mt-1 space-y-0.5 font-mono">
                  {cutPlan.groups.map((g, i) => (
                    <div key={i}>
                      {g.matLabel}: {g.sheets.length}{" "}
                      {plural(g.sheets.length, "arkusz", "arkusze", "arkuszy")} {fmt(SHEET_W)}×{fmt(SHEET_H)}
                      {g.biggestRect && (
                        <span className="text-stone-500">
                          {" — zostaje "}{fmt(g.biggestRect.w)}×{fmt(g.biggestRect.h)} mm
                          {g.usefulCount > 1 ? ` i ${g.usefulCount - 1} ${plural(g.usefulCount - 1, "mniejszy zrzut", "mniejsze zrzuty", "mniejszych zrzutów")}` : ""}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          )}

          <Card title="Produkty do zamówienia">
            {geo.hardware.length === 0 ? (
              <p className="text-sm text-stone-400">
                Brak okuć — dodaj szuflady, uchwyty albo nóżki.
              </p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-stone-200 text-left text-xs uppercase tracking-wider text-stone-500">
                    <th className="py-2 pr-3 font-medium">Produkt</th>
                    <th className="py-2 pr-3 font-medium">Specyfikacja</th>
                    <th className="py-2 text-right font-medium">Ilość</th>
                  </tr>
                </thead>
                <tbody>
                  {geo.hardware.map((h, i) => (
                    <tr key={i} className="border-b border-stone-100">
                      <td className="py-2 pr-3">{h.name}</td>
                      <td className="py-2 pr-3 font-mono text-xs text-stone-500">{h.spec}</td>
                      <td className="py-2 text-right font-mono">{h.qty} {h.unit}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            <Field label="Nazwa uchwytu" hint="trafia do listy zamówienia">
              <input value={cab.handleName || ""} placeholder="np. Uchwyt relingowy 160"
                onChange={(e) => set({ handleName: e.target.value })}
                className="w-full rounded border border-stone-300 bg-white px-2 py-1.5 text-sm focus:border-teal-600 focus:outline-none" />
            </Field>
            <p className="text-xs text-stone-500">
              Zawiasy domyślnie dwa na skrzydło. Trzy dopiero przy szerokości powyżej
              500 mm i wysokości powyżej 1400 mm, cztery powyżej 2000 mm. Wąskie drzwi
              zawsze dostają dwa. Liczbę nadpiszesz w polu przy każdym skrzydle.
            </p>
          </Card>

          <Card title="Wycena" collapsible defaultOpen={false}
            right={
              !cutPlan ? (
                <button onClick={() => makeCutPlan(project.items.length > 1 ? "project" : "cab")}
                  className="text-xs text-teal-700 hover:underline">
                  Policz rozkrój
                </button>
              ) : null
            }>
            <p className="text-xs text-stone-500">
              Ceny dotyczą całego projektu i zapisują się razem z nim. Płyta i cięcie liczone
              są od arkusza, więc potrzebują policzonego rozkroju — obrzeże i okucia wyliczą
              się od razu. Puste pole znaczy zero.
            </p>
            {!cutPlan && (
              <p className="rounded border border-amber-200 bg-amber-50 px-2 py-1 text-xs"
                style={{ color: WARNC }}>
                Rozkrój nie jest policzony, więc płyty i cięcia nie ma w wycenie.
              </p>
            )}
            <div className="overflow-x-auto">
              <table className="w-full min-w-[520px] text-sm">
                <thead>
                  <tr className="border-b border-stone-200 text-left text-xs uppercase tracking-wider text-stone-500">
                    <th className="py-2 pr-3 font-medium">Pozycja</th>
                    <th className="py-2 pr-3 text-right font-medium">Ilość</th>
                    <th className="py-2 pr-3 text-right font-medium">Cena jedn.</th>
                    <th className="py-2 text-right font-medium">Wartość</th>
                  </tr>
                </thead>
                <tbody>
                  {quote.rows.map((r) => (
                    <tr key={r.key} className="border-b border-stone-100">
                      <td className="py-1.5 pr-3">
                        {r.label}
                        {r.spec && <span className="block font-mono text-[11px] text-stone-400">{r.spec}</span>}
                      </td>
                      <td className="py-1.5 pr-3 text-right font-mono">{fmt(r.qty)} {r.unit}</td>
                      <td className="py-1.5 pr-3 text-right">
                        <input type="number" min={0} step="0.01"
                          value={prices[r.key] ?? ""}
                          placeholder="0"
                          onChange={(e) => setPrice(r.key, e.target.value)}
                          className="w-24 rounded border border-stone-300 bg-white px-1.5 py-1 text-right font-mono text-xs focus:border-teal-600 focus:outline-none" />
                      </td>
                      <td className="py-1.5 text-right font-mono">
                        {r.price ? fmt(Math.round(r.qty * r.price * 100) / 100) : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex items-baseline justify-between border-t border-stone-200 pt-3">
              <span className="text-xs uppercase tracking-wider text-stone-500">Razem</span>
              <span className="font-mono text-lg">{fmt(Math.round(quote.sum * 100) / 100)}</span>
            </div>
          </Card>

          {project.items.length > 1 && (
            <Card title={`Produkty całego projektu${project.name ? " — " + project.name : ""}`}
              right={<span className="text-xs text-stone-400">{project.items.length} szafek</span>}>
              <p className="mb-2 text-xs text-stone-500">
                Suma okuć ze wszystkich szafek w projekcie — do zamówienia na całość naraz.
                Te same pozycje z różnych szafek są sumowane; różne rozmiary i specyfikacje
                liczone osobno.
              </p>
              {projectHardware.length === 0 ? (
                <p className="text-sm text-stone-400">Brak okuć w żadnej szafce.</p>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-stone-200 text-left text-xs uppercase tracking-wider text-stone-500">
                      <th className="py-2 pr-3 font-medium">Produkt</th>
                      <th className="py-2 pr-3 font-medium">Specyfikacja</th>
                      <th className="py-2 text-right font-medium">Ilość</th>
                    </tr>
                  </thead>
                  <tbody>
                    {projectHardware.map((h, i) => (
                      <tr key={i} className="border-b border-stone-100">
                        <td className="py-2 pr-3">{h.name}</td>
                        <td className="py-2 pr-3 font-mono text-xs text-stone-500">{h.spec}</td>
                        <td className="py-2 text-right font-mono">{h.qty} {h.unit}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </Card>
          )}

        </div>
      </main>

      {printing && <PrintReport project={project} />}

      {confirmNew && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/40 p-4"
          onClick={() => setConfirmNew(false)}>
          <div className="w-full max-w-sm rounded-lg bg-white p-4 shadow-xl"
            onClick={(e) => e.stopPropagation()}>
            <h3 className="mb-2 text-sm font-semibold text-stone-800">Zacząć nowy projekt?</h3>
            <p className="mb-4 text-xs text-stone-500">
              Bieżący projekt zostanie wyczyszczony. Można go przywrócić przyciskiem Cofnij.
            </p>
            <div className="flex justify-end gap-2">
              <button onClick={() => setConfirmNew(false)}
                className="rounded px-3 py-1.5 text-sm text-stone-600 hover:bg-stone-100">Anuluj</button>
              <button onClick={() => {
                  replaceProject({
                      name: DEFAULT_PROJECT_NAME,
                      items: [{ cab: defaultCab, mat: defaultMaterials }],
                      active: 0,
                    });
                  setSaved("nowy projekt"); setConfirmNew(false);
                }}
                className="rounded bg-teal-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-teal-800">
                Tak, nowy projekt
              </button>
            </div>
          </div>
        </div>
      )}

      {transfer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/40 p-4"
          onClick={() => setTransfer(null)}>
          <div className="w-full max-w-2xl rounded-lg bg-white p-4 shadow-xl"
            onClick={(e) => e.stopPropagation()}>
            <h3 className="mb-2 text-sm font-semibold text-stone-800">
              {transfer.mode === "export" ? "Kopia projektu" : "Wklej projekt"}
            </h3>
            <p className="mb-2 text-xs text-stone-500">
              {transfer.mode === "export"
                ? "Zaznacz i skopiuj poniższy tekst, wklej go do pliku tekstowego albo notatki. Tak zachowasz projekt niezależnie od przeglądarki."
                : "Wklej tutaj wcześniej skopiowany tekst projektu."}
            </p>
            <textarea
              readOnly={transfer.mode === "export"}
              value={transfer.text}
              onChange={(e) => setTransfer({ ...transfer, text: e.target.value })}
              onFocus={(e) => transfer.mode === "export" && e.target.select()}
              className="h-64 w-full rounded border border-stone-300 p-2 font-mono text-[11px] focus:border-teal-600 focus:outline-none" />
            <div className="mt-3 flex justify-end gap-2">
              <button onClick={() => setTransfer(null)}
                className="rounded px-3 py-1.5 text-sm text-stone-600 hover:bg-stone-100">Zamknij</button>
              {transfer.mode === "export" ? (
                <button
                  onClick={async () => {
                    try { await navigator.clipboard.writeText(transfer.text); setSaved("skopiowano do schowka"); }
                    catch { setSaved("zaznacz tekst i skopiuj ręcznie"); }
                  }}
                  className="rounded bg-teal-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-teal-800">
                  Kopiuj do schowka
                </button>
              ) : (
                <button onClick={() => applyImportText(transfer.text)}
                  className="rounded bg-teal-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-teal-800">
                  Wczytaj projekt
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
