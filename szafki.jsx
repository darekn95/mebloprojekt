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
  // czysta biel wypadala z rysunku, a cene ma ta sama co mat — zostaje mat
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

/* Nazwa materialu sklada sie sama: typ z pola nazwy, kolor z palety i grubosc
   tylko wtedy, gdy ta sama plyta wystepuje w projekcie w kilku grubosciach. */
const PALETA_BY_HEX = new Map(PALETA.map(([n, h]) => [h.toLowerCase(), n]));
const paletteName = (hex) => PALETA_BY_HEX.get(String(hex || "").toLowerCase()) || null;
// kolor spoza wzornika trzeba nazwac samemu, inaczej do zamowienia poszloby
// bezuzyteczne "kolor wlasny"
const colorLabel = (m) => ((m && m.decor) || "").trim() || paletteName(m && m.color) || "kolor własny";
const COLORED_KEYS = ["board", "front", "shelf"];

/* Nozki: kolor z palety okuc i ksztalt — kwadratowa albo okragla. */
const LEG_COLORS = [
  ["Czarny", "#2b2a28"],
  ["Grafit", "#3f3f46"],
  ["Aluminium", "#a1a1aa"],
  ["Chrom", "#d4d4d8"],
  ["Biały", "#f4f4f5"],
  ["Złoty", "#b08d3f"],
];
const legColorOf = (cab) => (cab.legs && cab.legs.color) || "#3f3f46";
const legRound = (cab) => (cab.legs || {}).shape === "round";

// zbior nazw, ktore w podanych zestawach materialow maja wiecej niz jedna grubosc
const ambiguousThickness = (mats) => {
  const by = new Map();
  mats.forEach((mm) =>
    Object.values(mm || {}).forEach((m) => {
      if (!m || !m.name) return;
      const k = m.name.trim();
      if (!by.has(k)) by.set(k, new Set());
      by.get(k).add(m.thickness);
    })
  );
  return new Set([...by.entries()].filter(([, set]) => set.size > 1).map(([k]) => k));
};

const matLabelOf = (m, key, ambiguous) => {
  const parts = [((m && m.name) || "").trim() || key];
  if (COLORED_KEYS.includes(key)) parts.push(colorLabel(m));
  if (ambiguous && ambiguous.has(((m && m.name) || "").trim())) parts.push(String(m.thickness));
  return parts.join(" ");
};

/* Ceny startowe — WSZYSTKIE BRUTTO, bo tyle sie faktycznie placi.
   Kazda da sie nadpisac w karcie Wyceny; wpisanie 0 zeruje pozycje.
   Oklejanie liczone jest za kazdy rozpoczety metr, stad zaokraglanie w gore. */
const DEFAULT_PRICES = {
  plytaBiala: 223.1, // arkusz 2800 × 2100 × 18, biel
  plytaKolor: 240, // ten sam arkusz w kolorze
  hdf: 70, // arkusz plecow, cena jedna dla wszystkich kolorow
  ciecie: 51.66, // formatowanie jednego arkusza
  obrzeze: 3.38, // obrzeze 22 × 2 mm, za mb
  oklejanie: 8.86, // oklejanie prostoliniowe, za rozpoczety mb
};

/* Plyta w kolorze jest drozsza od bialej, a koloru nie ma w nazwie materialu,
   wiec rozpoznajemy go po odcieniu: bardzo jasny = biel. */
const isWhiteBoard = (hex) => {
  const m = /^#?([0-9a-f]{6})$/i.exec(String(hex || ""));
  if (!m) return true;
  const v = parseInt(m[1], 16);
  return [(v >> 16) & 255, (v >> 8) & 255, v & 255].every((c) => c >= 0.85 * 255);
};

/* Prowadnice: cena zalezy od wysokosci boku i dlugosci NL. Progi z cennika,
   w kazdym przedziale przyjmujemy srodek podanego widelka. */
const SLIDE_PRICES = {
  80: [{ maxNl: 400, price: 74 }, { maxNl: Infinity, price: 81 }], // brak w cenniku, przyjete jak 95
  95: [{ maxNl: 400, price: 74 }, { maxNl: Infinity, price: 81 }],
  127: [{ maxNl: 400, price: 86 }, { maxNl: Infinity, price: 95 }],
  178: [{ maxNl: 400, price: 91.5 }, { maxNl: Infinity, price: 100 }],
  210: [{ maxNl: Infinity, price: 108.5 }],
  238: [{ maxNl: 450, price: 110 }, { maxNl: Infinity, price: 126 }],
};

/* Okucia dopasowujemy po samej nazwie — specyfikacja bywa zmienna
   (np. zawias nakladany kontra wpuszczany), a cena i tak jest ta sama. */
const DEFAULT_HW_PRICES = {
  Zawias: 3,
  "Nóżka regulowana": 2.3,
  "Zaślepka na konfirmat": 0.7, // blister 25 szt.
  Uchwyt: 10,
  "Konfirmat 7 × 50": 0.1,
  "Kołek podporowy ⌀5": 0.1,
  "Zawieszka meblowa regulowana": 3,
  "Listwa montażowa do zawieszek": 9, // za metr
  "Hak / wkręt z kołkiem do ściany": 1,
  "Trójkąt meblarski": 0.25,
  "Złączka do cokołu": 0.3,
  "Lustro na drzwiach": 200, // za m²
  "Zszywka / gwoździk do pleców": 0.05,
  "Wkręt 3,5 × 30 do pleców": 0.05,
};

/* Prowadnica ma rozmiar w nazwie i NL w specyfikacji, wiec nie da sie jej
   zalatwic zwyklym wpisem w tabeli — stad osobne dopasowanie. */
const hwDefaultPrice = (h) => {
  const sl = /^Prowadnica .*?(\d+) mm$/.exec(h.name || "");
  if (sl) {
    const bands = SLIDE_PRICES[Number(sl[1])];
    if (!bands) return 0;
    const nl = Number((/(\d+)/.exec(h.spec || "") || [])[1]) || 0;
    return (bands.find((b) => nl <= b.maxNl) || bands[bands.length - 1]).price;
  }
  // uchwyt moze miec wlasna nazwe, wiec dopasowujemy po stalym kluczu pozycji
  return DEFAULT_HW_PRICES[h.pk || h.name] || 0;
};

/* Ceny netto rozdawane przez wczesniejsza wersje — jesli projekt ma
   dokladnie te wartosci, znaczy ze nikt ich nie ruszal, wiec ustepuja
   nowym cenom brutto zamiast zanizac wycene. */
const LEGACY_NET_PRICES = {
  "plyta:Płyta laminowana 18": 181.38,
  ciecie: 42,
  obrzeze: 2.75,
  oklejanie: 7.2,
};

const MIN_COL = 200; // najwezsza sensowna kolumna
/* Wystawanie uchwytu przed lico frontu. Jedno miejsce dla rysunku 3D i dla
   kontroli otwierania — inaczej model kolizji rozjezdzalby sie z tym, co widac.
   Dotyczy tak samo drzwi jak i szuflad. */
const handleOutOf = (cab) => Math.max(0, Math.round(Number((cab || {}).handleOut ?? 20) || 0));
// szerokosc pionowego wspornika w wewnetrznym rogu szafki naroznej
/* Ramie katownika w rogu szafki w L. To nie jest liczba z powietrza: 60 mm to
   najmniejsza formatka, jaka da sie uciac i okleic (MIN_PART nizej), a katownika
   z czegos wezszego nikt nie zrobi. */
const CORNER_BRACKET_W = 60;
/* Wymiary startowe szablonu „Narożnik L". Korpus jest szerszy od glebokosci
   drugiego ciagu, bo inaczej nie zostaje nic na front — CORNER_L_W minus
   CORNER_L_D (i minus grubosc frontu ramienia) to swiatlo, ktore zostaje do reki.

   Ramie liczy sie OD konca naroznego kwadratu: przy drugiej scianie narożnik
   zajmuje CORNER_L_D + CORNER_L_ARM, czyli tyle, ile odsuwa sie tamten ciag.
   CORNER_L_TOTAL to ta wlasnie calkowita szerokosc przy drugiej scianie —
   1200 mm, bo krotsze ramie nie daje sie po nie siegnac przez rog. */
const CORNER_L_W = 900;
const CORNER_L_D = 600;
const CORNER_L_TOTAL = 1200;
const CORNER_L_ARM = CORNER_L_TOTAL - CORNER_L_D;
// ponizej tego boku formatki nie utnie sie na pile formatowej
const MIN_PART = 60;
/* Ponizej tego front robi sie waski — nie blad, bo czasem inaczej sie nie da,
   ale warto rzucic okiem, zanim pojdzie do ciecia. */
const WASKI_FRONT = 250;
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

/* Okucia sprzedawane w opakowaniach trzymamy w sztukach az do wyswietlenia —
   inaczej suma z kilku szafek zaokraglalaby sie w gore w kazdej z osobna. */
const hwQty = (h) => (h.pack ? Math.ceil(h.qty / h.pack) : h.qty);
const hwUnit = (h) => (h.pack ? "op." : h.unit);
const hwNote = (h) => (h.pack ? ` (${h.qty} szt.)` : "");

/* Ilosci w wycenie mnozy sie przez cene, wiec nie moga byc zaokraglone
   mocniej niz to, czym liczymy — fmt gubi setne i m2 przestaja sie zgadzac. */
const qtyFmt = (n) => {
  const r = Math.round(n * 100) / 100;
  return Number.isInteger(r) ? String(r) : r.toFixed(2).replace(/0$/, "");
};

// kwoty pokazujemy z groszami — fmt zaokragla do dziesiatych i gubilby je
const zl = (n) => {
  if (n === null || n === undefined || Number.isNaN(n)) return "—";
  return (Math.round(n * 100) / 100).toFixed(2);
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
/* Wysoka i waska szafka po przeskalowaniu do stalej wysokosci chowala sie na
   srodku pola, a wymiary robily sie nieczytelne — bierzemy tyle wysokosci
   okna, ile realnie jest. */
/* Rysunek ma sie skalowac do szerokosci pola, a nie miescic w stalej wysokosci
   — inaczej wysoka szafka kurczy sie do paska na srodku. Sufit jest tylko
   zabezpieczeniem przed skrajnie waskim i wysokim rzutem. */
const DRAW_MAX_H = "min(180vh, 2000px)";

const RUNNER_W = 21; // szerokosc prowadnicy przy boku
/* Od spodu prowadnicy do spodu dna skrzynki — wymiar okucia, niezalezny od
   wysokosci boku szuflady. Nad nim lezy jeszcze grubosc samego dna. */
const RAIL_TO_BOTTOM = 26;
/* Luz nad podniesionym tylem szuflady — tyl nie moze siegac dokladnie do frontu
   wyzej ani do wienca, bo bedzie o nie zawadzal przy wysuwaniu. */
const BACK_CLEAR = 20;

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

/* Rowny podzial pasma wychodzi tylko przy odpowiednim luzie. Szukamy najblizszego
   luzu w gore i w dol, przy ktorym reszta pasma dzieli sie na formatki bez
   resztek — `span` to cale pasmo, `n` liczba frontow, `fixedSum` suma tych o
   zadanym wymiarze, `autoCnt` liczba dzielonych po rowno. */
const evenGapOptions = (span, n, fixedSum, autoCnt, gap, min = 2, max = 12) => {
  const fits = (G) => {
    if (G < min || G > max) return false;
    const rest = Math.round(span - (n - 1) * G - fixedSum);
    return rest >= autoCnt && rest % autoCnt === 0;
  };
  let up = null;
  let down = null;
  for (let d = 1; d <= max && up === null; d++) if (fits(gap + d)) up = gap + d;
  for (let d = 1; d <= max && down === null; d++) if (fits(gap - d)) down = gap - d;
  return { up, down };
};

/* ---------- domyslny projekt ---------- */

const defaultMaterials = {
  board: { name: "Płyta", thickness: 18, color: "#d8c3a0" },
  front: { name: "Płyta", thickness: 18, color: "#c2a880" },
  shelf: { name: "Płyta", thickness: 18, color: "#d0bb96" },
  back: { name: "HDF", thickness: 3, color: "#9c7b56" },
  mirror: { name: "Lustro", thickness: 4, color: "#c3d0d6" },
  /* Blat roboczy to nie plyta meblowa: grubszy, kupowany w gotowych odcinkach
     i ciety na dlugosc, wiec nie idzie do rozkroju razem z korpusami. */
  worktop: { name: "Blat roboczy", thickness: 38, color: "#8d7b68", depth: 600 },
};

/* Blaty robocze sprzedaje sie w gotowych arkuszach: 4100 x 600 i 4100 x 1200.
   Dluzszego po prostu nie ma w jednym kawalku, wiec to dlugosc arkusza — a nie
   formatka plyty meblowej — wyznacza podzial blatu w ciagu. Blat wchodzi do
   rozkroju na wlasnym arkuszu, zeby bylo widac, ile sztuk trzeba kupic. */
const WORKTOP_LEN = 4100;
const WORKTOP_DEPTHS = [600, 1200];
const WORKTOP_PRICES = { 600: 470, 1200: 780 };
const worktopDepth = (mat) => {
  const d = Math.round(Number((mat.worktop || {}).depth) || 600);
  return WORKTOP_DEPTHS.includes(d) ? d : 600;
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

/* Ile polek wrzucic do swiezej szafki. Zamiast sztywnej trojki bierzemy tyle,
   ile zmiesci sie przy zachowaniu sensownego swiatla — niska szafka dostanie
   jedna polke, slupek kilka. Uzytkownik i tak moze dolozyc albo usunac. */
const MIN_OPENING = 250; // najmniejsze swiatlo miedzy polkami przy auto-doborze

const autoShelves = (innerH, t = 18, minOpen = MIN_OPENING) => {
  let n = 0;
  while (n < 20 && (innerH - (n + 1) * t) / (n + 2) >= minOpen) n++;
  return n;
};

/* Swiatlo w pionie bez wnikania w kolumny — tyle wystarczy do doboru polek. */
const innerHeightOf = (H, { t = 18, plinth = 0, hasBot = true, hasTop = true } = {}) =>
  H - (hasBot ? t : 0) - (hasTop ? t : 0) - plinth;

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

/* Para wzmocnien zamiast wienca: z przodu plyta na plask, do ktorej przykreca
   sie blat, z tylu stojaca, ktora trzyma korpus w kacie prostym. */
/* Tylne wzmocnienie stoi pionowo i konczy sie rowno z bokami — dokladnie tak,
   jak konczy sie tylna krawedz korpusu. Plecy idzie na nie normalnie, tak jak
   przybija sie je do bokow. */
/* W rogu plyta od strony drzwi tez staje pionowo i jest wezsza: dwie stojace
   plyty spotykaja sie tam pod katem prostym i skreca sie je przez lico jednej
   w czolo drugiej. Plaska, na 100 mm, dawala tam tylko styk krawedzi. */
const ROG_WZM_H = 60;
const railPair = (cofniete = 0, odTylu = 0, pionZPrzodu = false) => ([
  pionZPrzodu
    ? { ...newRail(), orient: "front", pos: "top", h: ROG_WZM_H, atDepth: cofniete, fromBack: false }
    : { ...newRail(), orient: "shelf", pos: "top", depth: 100, atDepth: cofniete, fromBack: false },
  { ...newRail(), orient: "front", pos: "top",
    h: pionZPrzodu ? ROG_WZM_H : 100, atDepth: odTylu, fromBack: true },
]);

/* Szafka pod blatem roboczym: wieniec schodzi, a kazda kolumna najwyzszego
   poziomu dostaje te pare. Ta sama zamiana idzie z przycisku w Uwagach, wiec
   liczy sie w jednym miejscu. */
const bezWienca = (cab, tf = 18) => {
  const levels = JSON.parse(JSON.stringify(cab.levels || []));
  const last = levels.length - 1;
  /* W szafce naroznej wzmocnienie z przodu cofa sie o grubosc frontu, zeby jego
     czolo wypadlo rowno z wewnetrzna strona maskownicy katownika i bylo do czego
     ja przykrecic. */
  const wRogu = !!(cab.corner || {}).on;
  const cofniete = wRogu ? tf : 0;
  /* W szafce naroznej tylne wzmocnienie cofa sie od plecow o grubosc plyty:
     dolega wtedy do wewnetrznego lica katownika w tylnym narozniku i jest do
     czego je przykrecic. W zwyklej szafce nie ma tam czego szukac, wiec stoi
     rowno z tylna krawedzia, a plecy ida na nie. */
  const odTylu = (cab.corner || {}).on ? Math.round(tf) : 0;
  if (last >= 0)
    levels[last].cols = (levels[last].cols || []).map((c) => ({
      ...c, rails: [...(c.rails || []), ...railPair(cofniete, odTylu, wRogu)],
    }));
  return { joints: { ...(cab.joints || {}), topL: "none", topR: "none" }, levels };
};

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
  // overBottom / overTop — o ile front skrajnej szuflady zachodzi na dno i wieniec,
  // underRail — o ile front schodzi ponizej wlasnej szyny, gdy pod nia nic nie ma
  gaps: { edge: 2, between: 3, top: 3, bottom: 3, inset: 2, divOverlay: 7,
          overBottom: 15, overTop: 15, underRail: 5 },
  maxGap: 5,
  /* Ile uchwyt wystaje przed lico frontu — tak samo dla drzwi i dla szuflad.
     To on styka sie pierwszy, wiec z tego wymiaru korzysta i rysunek 3D,
     i kontrola otwierania. Relingi trzymaja sie okolic 20-35 mm, muszelki
     i uchwyty frezowane nie wystaja wcale. */
  handleOut: 20,
  shelfExtraSetback: 0,
  levels: [newLevel(2, autoShelves(innerHeightOf(720)))],
  /* Cokol domyslnie idzie pod korpusem, nie w obrysie — w ciagu to jedna
     plaszczyzna przez wszystkie szafki i nie zjada swiatla wnetrza. */
  plinth: { on: false, height: 100, mode: "under", setback: 0 },
  // wieniec jako blat: wystaje poza boki i poza lico korpusu, a fronty
  // konczą sie pod nim
  top: { mode: "wieniec", widthMode: "outside", overL: 0, overR: 0, overFront: 0, overBack: 0 },
  topFiller: { on: false, height: 100 }, // zaslepka nad szafka (do sufitu / maskownica)
  extraParts: [], // formatki dopisane recznie, poza geometria szafki
  note: "", // notatka montazowa — trafia do zestawienia
  frontSameAsBoard: true,
  shelfSameAsBoard: true,
  openAngle: 90,
  /* Strona zawiasow dla pojedynczych drzwi — jedno ustawienie na cala szafke,
     bo w kuchni wszystkie drzwi otwiera sie zwykle w te sama strone.
     „auto" = jak dotad, czyli od lewej, chyba ze z lewej stoi fix. */
  hinge: "auto",
  legs: { on: false, height: 100, color: "#3f3f46", shape: "box" },
  /* Szafka narozna w L: do korpusu dochodzi ramie wzdluz drugiej sciany, a oba
     fronty spotykaja sie w rogu pod katem prostym. `arm` to dlugosc ramienia
     mierzona wzdluz tamtej sciany. `doors` mowi, jak zamykaja sie drzwi:
     „wsporniki" = dwa pionowe wsporniki w wewnetrznym rogu (jak w zdjeciach),
     „lamane" = drzwi na podwojnych zawiasach, „skrecone" = dwa fronty skrecone
     na staly kat 90 stopni, na zawiasach z jednej strony, „fix" = ramie zaslepia
     przykrecony na staly fix, a otwieraja sie tylko jedne drzwi w korpusie. */
  corner: { on: false, arm: 600, doors: "wsporniki", bracket: "krotsze",
    /* Od strony ramienia korpus nie ma boku — przechodzi w ramie. Zamiast plyty
       stoi tam katownik: dwie plyty polkowe pod 90 stopni, na cala wysokosc
       wnetrza, w zewnetrznym narozniku. `side` mowi, ktora strona to jest;
       „auto" znaczy prawa, a rozjazd z ukladem zglasza uwaga. */
    /* Plecy ramienia z pelnej plyty zamiast HDF. Plyta trzyma rog sama, wiec
       stojace wzmocnienie przy niej schodzi — to samo po stronie korpusu robi
       zwykle ustawienie pleców na „płyta". */
    /* Wzmocnienia ramienia to osobne plyty — `railW` trzyma ich szerokosc,
       osobno dla czolowej i tylnej. Puste = tak jak w korpusie. */
    post: { on: true, w: 150 }, side: "auto", backBoard: false,
    railW: { przod: null, tyl: null } },
  // polki w kolumnach: na kolkach podporowych czy skrecane konfirmatami
  shelfMount: "pins",
  // odsuniecie osi otworu pod kolek od przedniej i tylnej krawedzi polki
  shelfPin: { dFront: 37, dBack: 37 },
  // od czego liczymy wysokosc otworu: "panel" = dolna krawedz boku/przegrody
  // (tak sie mierzy plyte na stole), "bottom" = dno szafki
  pinDatum: "panel",
  hangers: "auto", // zawieszki do szafek wiszacych: auto / zawsze / nigdy
  // pojedyncza szafka wisi na haczykach; listwa oplaca sie dopiero, gdy szafek
  // jest kilka w ciagu i trzeba je wyrownac do jednej linii
  hangerMode: "haczyki", // zawieszki mocowane na listwie albo wprost na haczyki
  grainMatters: false,
  texture: false, // rysuj strukture slojow zamiast plaskiego koloru
  textureDir: "v", // kierunek slojow na rysunku: v = pionowo, h = poziomo
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
/* `mat` sluzy tylko do tego, zeby prostowanie starych ustawien liczylo sie
   gruboscia plyty z projektu, a nie liczba wpisana na sztywno. */
const migrateCab = (rawCab, mat) => {
  const merged = { ...defaultCab, ...(rawCab || {}), version: defaultCab.version };
  if (!merged.top || typeof merged.top !== "object")
    merged.top = { mode: "wieniec", widthMode: "outside", overL: 0, overR: 0, overFront: 0, overBack: 0 };
  if (!Array.isArray(merged.extraParts)) merged.extraParts = [];
  ["cutout", "cutoutR", "obstacle", "backGroove", "plinth", "topFiller", "legs", "corner", "gaps", "joints", "shelfPin"].forEach((k) => {
    if (defaultCab[k] && typeof defaultCab[k] === "object")
      merged[k] = { ...defaultCab[k], ...((rawCab && rawCab[k]) || {}) };
  });
  /* Tylne wzmocnienie: w zwyklej szafce rowno z tylna krawedzia (plecy ida na
     nie), w naroznej cofniete o grubosc plyty, zeby doleglo do wewnetrznego
     lica katownika w rogu. Po drodze bylo raz tak, raz tak, wiec prostujemy to
     przy wczytaniu — ale tylko dla plyty z tej pary (stojaca, u gory) i tylko
     gdy stoi na jednej z naszych wartosci, zeby nie kasowac recznych ustawien. */
  const wRogu = !!(merged.corner || {}).on;
  const tPlyty = Math.max(1, Math.round(Number(((mat || defaultMaterials).board || {}).thickness) || 18));
  (merged.levels || []).forEach((lv) => (lv.cols || []).forEach((c) => {
    (c.rails || []).forEach((r) => {
      if (r.orient === "front" && r.fromBack && r.pos === "top") {
        const at = Number(r.atDepth) || 0;
        if (at === 0 || at === tPlyty) r.atDepth = wRogu ? tPlyty : 0;
        /* W rogu obie plyty tej pary stoja pionowo i maja 60 mm — dwie stojace
           latwiej skrecic w kacie. Stare 100 mm z domyslnego ukladu zmieniamy,
           recznie ustawionej innej szerokosci nie ruszamy. */
        if (wRogu && Number(r.h) === 100) r.h = ROG_WZM_H;
        return;
      }
      /* Plyta od strony drzwi w rogu stoi teraz pionowo i ma 60 mm. Projekty
         z czasow, gdy lezala na plask na 100 mm, przestawiamy — rozpoznajemy ja
         po tej samej sygnaturze, ktora sama zaklada `railPair`. */
      if (wRogu && r.orient === "shelf" && r.pos === "top" && !r.fromBack
        && Number(r.depth) === 100) {
        r.orient = "front";
        r.h = 60;
        delete r.depth;
      }
    });
  }));
  if (rawCab && rawCab.cutout && rawCab.cutout.corner === "backRight") {
    merged.cutoutR = { ...merged.cutout };
    merged.cutout = { ...defaultCab.cutout };
  }
  if (merged.cutout) delete merged.cutout.corner;
  if (merged.cutoutR) delete merged.cutoutR.corner;
  return merged;
};
// stare nazwy niosly grubosc i rodzaj w jednym; teraz sklada sie ja z pol
const LEGACY_MAT_NAMES = { "Płyta laminowana 18": "Płyta", "HDF 3": "HDF", "Lustro 4": "Lustro" };

const migrateMat = (rawMat) => {
  const mm = { ...defaultMaterials };
  if (rawMat) Object.keys(mm).forEach((k) => { mm[k] = { ...mm[k], ...(rawMat[k] || {}) }; });
  Object.keys(mm).forEach((k) => {
    const n = (mm[k].name || "").trim();
    if (LEGACY_MAT_NAMES[n]) mm[k] = { ...mm[k], name: LEGACY_MAT_NAMES[n] };
  });
  mm.mirror = { ...mm.mirror, color: defaultMaterials.mirror.color }; // kolor lustra staly
  return mm;
};
// buduje stan projektu z wczytanych danych: obsluguje stary {cab,mat} i nowy {items,active}
const DEFAULT_PROJECT_NAME = "Projekt bez nazwy";

/* ---------- ciagi meblowe ----------
   Ciag to grupa szafek stojacych obok siebie przy jednej scianie. Sam nie jest
   szafka — trzyma to, co szafki maja wspolne (dlugosc sciany, luz miedzy
   korpusami), a kolejnosc ustawienia bierze z kolejnosci szafek w projekcie,
   zeby nie prowadzic dwoch list naraz i nie musiec ich godzic.
   Szafka bez ciagu jest wolnostojaca i zachowuje sie dokladnie jak dotad. */
const nextRunId = (runs) => {
  // numerujemy po kolei zamiast losowac — zapis projektu ma byc powtarzalny
  let n = 1;
  while (runs.some((r) => r.id === "c" + n)) n++;
  return "c" + n;
};

const makeRun = (runs) => {
  const nums = runs.map((r) => {
    const m = /^Ściana (\d+)$/.exec((r.name || "").trim());
    return m ? Number(m[1]) : 0;
  });
  /* H, D i cokol zostaja puste — ciag przejmuje je od pierwszej szafki, ktora do
     niego wejdzie. Dzieki temu nigdy nie narzuca wymiarow wzietych znikad. */
  /* Nowy ciag od razu dostaje blat roboczy: w kuchni to regula, a szafki pod
     nim nie maja wienca, tylko pare wzmocnien. Stare projekty zostaja bez
     zmian — tam `worktop` po prostu nie ma i nie wlacza sie samo. */
  return { id: nextRunId(runs), name: `Ściana ${Math.max(0, ...nums) + 1}`, wallW: null, gap: 0,
    H: null, D: null, plinth: null, plinthCuts: null, topCuts: null, worktop: true,
    hangerMode: "listwa", mountY: 0, corner: null,
    tier: "dolny", wall: null, clearance: 500, ceiling: null,
    offset: 0, offsetFrom: "left" };
};

/* Gorny ciag tej samej sciany. Dlugosc sciany i narożnik bierze od dolnego, wiec
   ich tu nie ma. Wisi nad nim, jest plytszy i nie ma cokolu ani blatu. */
const GORNY_D = 300;
const makeUpperRun = (runs, dolny, mountY) => ({
  ...makeRun(runs), name: dolny.name, tier: "gorny", wall: dolny.id,
  wallW: null, D: GORNY_D, H: null, plinth: null, worktop: false,
  clearance: 500, ceiling: null, mountY, corner: null,
  offset: 0, offsetFrom: "left",
});

/* Nazwa z pietrem — sama „Ściana 1" przestaje wystarczac, gdy ma dwa ciagi. */
const runLabel = (runs, run) => {
  const dolny = run.tier === "gorny" ? (runs || []).find((r) => r.id === run.wall) : run;
  const nazwa = (dolny && dolny.name) || run.name;
  const maPietra = (runs || []).some((r) => r.tier === "gorny" && r.wall === (dolny || run).id);
  if (!maPietra) return nazwa;
  return `${nazwa} — ciąg ${run.tier === "gorny" ? "górny" : "dolny"}`;
};

/* ---------- narozniki ----------
   Dwa ciagi spotykaja sie pod katem prostym. Ciag „dziecko" dostawia sie do
   konca albo do poczatku ciagu-rodzica i skreca w strone pokoju — tak samo jak
   sciany w prawdziwym pomieszczeniu. Lancuch takich narozy daje L (dwa ciagi),
   U (trzy) i G (cztery-piec), wiec nie ma tu osobnego pola „ksztalt".

   W samym rogu dwa ciagi zawsze na siebie wchodza: jeden z nich musi dojechac
   do naroza, a drugi zaczac sie dopiero za jego glebokoscia. Kto wchodzi w rog,
   mowi `owner`: „of" = rodzic, „self" = ten ciag. */
const migrateCorner = (c) => {
  if (!c || c.of == null) return null;
  return {
    of: String(c.of),
    // "end" = przy koncu rodzica (skret w prawo), "start" = przy jego poczatku
    at: c.at === "start" ? "start" : "end",
    owner: c.owner === "self" ? "self" : "of",
    // dodatkowy luz w rogu, zeby uchwyty i fronty sie nie zaczepialy
    clear: Math.max(0, Math.round(Number(c.clear) || 0)),
    /* Blat w rogu: ktory ciag przechodzi przez naroze i jak sie tnie styk.
       null = blat idzie tak jak korpusy, czyli przechodzi ten, ktory wjezdza
       w rog. „skos" to lyzwa, czyli oba kawalki ciete pod 45 stopni. */
    top: c.top === "self" || c.top === "of" ? c.top : null,
    cut: c.cut === "skos" ? "skos" : "prosty",
  };
};

// wymiary, ktore w ciagu musza byc wspolne — inaczej fronty i blat sie rozjada
const RUN_SHARED = ["H", "D", "plinth", "hangerMode"];

const migrateRun = (r) => ({
  id: String(r.id),
  name: typeof r.name === "string" && r.name.trim() ? r.name : "Ciąg",
  wallW: Number(r.wallW) > 0 ? Math.round(Number(r.wallW)) : null,
  gap: Math.max(0, Math.round(Number(r.gap) || 0)),
  H: Number(r.H) > 0 ? Math.round(Number(r.H)) : null,
  D: Number(r.D) > 0 ? Math.round(Number(r.D)) : null,
  plinth: r.plinth && typeof r.plinth === "object" ? { ...r.plinth } : null,
  // null = podzial dobierany sam; tablica = styki wybrane recznie
  plinthCuts: Array.isArray(r.plinthCuts)
    ? r.plinthCuts.map(Number).filter((n) => n > 0).sort((a, b) => a - b) : null,
  topCuts: Array.isArray(r.topCuts)
    ? r.topCuts.map(Number).filter((n) => n > 0).sort((a, b) => a - b) : null,
  // blat roboczy przez caly ciag; w starych projektach pola nie ma, wiec zostaje wylaczony
  worktop: r.worktop === true,
  // ciag wiesza sie na listwie; pojedyncza szafka na haczykach
  hangerMode: r.hangerMode === "haczyki" ? "haczyki" : "listwa",
  // wysokosc spodu korpusu nad podloga: 0 = ciag stoi, wiecej = ciag wisi
  mountY: Number(r.mountY) > 0 ? Math.round(Number(r.mountY)) : 0,
  /* Jedna sciana trzyma dwa pietra: dolne i gorne. Dlugosc sciany i narożnik sa
     wspolne — gorny bierze je od dolnego, na ktory wskazuje `wall`. Wysokosc
     montazu gornego nie jest wpisywana, tylko liczona: lico dolnego plus
     `clearance`. `ceiling` to wysokosc pomieszczenia, gdy chcemy znac luz nad
     szafkami. */
  tier: r.tier === "gorny" ? "gorny" : "dolny",
  wall: r.wall != null ? String(r.wall) : null,
  clearance: Number(r.clearance) > 0 ? Math.round(Number(r.clearance)) : 500,
  ceiling: Number(r.ceiling) > 0 ? Math.round(Number(r.ceiling)) : null,
  /* Odsuniecie ciagu w obrebie sciany: dolne szafki moga zaczynac sie w innym
     miejscu niz gorne. Liczone od tej krawedzi, ktora wskazuje `offsetFrom`. */
  offset: Math.max(0, Math.round(Number(r.offset) || 0)),
  offsetFrom: r.offsetFrom === "right" ? "right" : "left",
  // null = ciag stoi przy wlasnej scianie, bez zwiazku z innymi
  corner: migrateCorner(r.corner),
});

// cokol porownujemy po wszystkich czterech polach — cofniecie tez psuje lico ciagu
const samePlinth = (a, b) => {
  if (!a || !b) return !a === !b;
  if (!a.on || !b.on) return !a.on === !b.on;
  return Math.round(a.height || 0) === Math.round(b.height || 0)
    && (a.mode || "inbody") === (b.mode || "inbody")
    && Math.round(a.setback || 0) === Math.round(b.setback || 0);
};

const plinthText = (p) => {
  if (!p || !p.on) return "bez cokołu";
  const gdzie = (p.mode || "inbody") === "inbody" ? "w bryle" : "pod korpusem";
  return `cokół ${fmt(p.height)} mm ${gdzie}` + (p.setback > 0 ? `, cofnięty ${fmt(p.setback)} mm` : "");
};

/* szafki jednego ciagu w kolejnosci ustawienia przy scianie; id === null daje
   szafki wolnostojace, wiec caly pasek grup idzie jednym mechanizmem */
const runItems = (project, id) =>
  project.items.map((it, i) => ({ it, i })).filter(({ it }) => (it.runId || null) === (id || null));

const loadProject = (d) => {
  if (!d) return null;
  let items;
  if (Array.isArray(d.items) && d.items.length) {
    items = d.items.map((it) => {
      const mat = migrateMat(it.mat);
      return { cab: migrateCab(it.cab, mat), mat,
        runId: it.runId || null, offset: Math.round(Number(it.offset) || 0) };
    });
  } else if (d.cab) {
    items = (() => { const mat = migrateMat(d.mat);
      return [{ cab: migrateCab(d.cab, mat), mat, runId: null, offset: 0 }]; })();
  } else return null;
  const runs = (Array.isArray(d.runs) ? d.runs : []).filter((r) => r && r.id != null).map(migrateRun);
  // ciag mogl wypasc z zapisu — szafka po nim wraca na wolnostojaca, nie zostaje sierota
  items.forEach((it) => { if (!runs.some((r) => r.id === it.runId)) it.runId = null; });
  /* Narożnik wskazujacy na skasowany ciag, na samego siebie albo zapetlony
     rozwiazujemy — inaczej rozmieszczenie ciagow nie mialoby konca. */
  runs.forEach((r) => {
    if (!r.corner) return;
    if (r.corner.of === r.id || !runs.some((q) => q.id === r.corner.of)) { r.corner = null; return; }
    let p = runs.find((q) => q.id === r.corner.of);
    for (let n = 0; p && p.corner && n <= runs.length; n++) {
      if (p.corner.of === r.id) { r.corner = null; break; }
      p = runs.find((q) => q.id === p.corner.of);
    }
  });
  const active = Math.min(Math.max(0, Math.round(d.active || 0)), items.length - 1);
  // trzymamy wylacznie ceny wpisane recznie; domyslne siedza przy pozycjach
  const prices = { ...(d.prices && typeof d.prices === "object" ? d.prices : {}) };
  Object.entries(LEGACY_NET_PRICES).forEach(([k, v]) => {
    if (prices[k] === v) delete prices[k];
  });
  /* Etykieta materialu nosi teraz kolor, wiec recznie wpisana cena zapisana
     pod stara nazwa zostalaby sierota — przenosimy ja na nowy klucz. */
  const ambig = ambiguousThickness(items.map((it) => it.mat));
  items.forEach((it) =>
    Object.entries(it.mat || {}).forEach(([key, m]) => {
      Object.keys(LEGACY_MAT_NAMES).forEach((old) => {
        const from = "plyta:" + old;
        const to = "plyta:" + matLabelOf(m, key, ambig);
        if (prices[from] != null && prices[to] == null && LEGACY_MAT_NAMES[old] === m.name) {
          prices[to] = prices[from];
          delete prices[from];
        }
      });
    })
  );
  const name = typeof d.name === "string" && d.name.trim() ? d.name : DEFAULT_PROJECT_NAME;
  return { name, items, runs, active, prices };
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
      plinth: { on: true, height: 100, mode: "under", setback: 0 },
      // cokol pod korpusem nie zjada swiatla — korpus stoi na nim caly
      levels: [newLevel(2, autoShelves(innerHeightOf(720)))],
    }),
  },
  {
    id: "wiszaca",
    label: "Szafka wisząca",
    hint: "600 × 720 × 300, bez cokołu i nóżek",
    make: () => ({
      W: 600, H: 720, D: 300,
      plinth: { on: false, height: 100, mode: "under", setback: 0 },
      legs: { on: false, height: 100, color: "#3f3f46", shape: "box" },
      levels: [newLevel(2, autoShelves(innerHeightOf(720)))],
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
        top: { mode: "blat", widthMode: "inside", overL: 50, overR: 50, overFront: 30, overBack: 0 },
        joints: { topL: "over", topR: "over", botL: "none", botR: "none" },
        back: "none",
        plinth: { on: false, height: 100, mode: "under", setback: 0 },
        legs: { on: false, height: 100, color: "#3f3f46", shape: "box" },
        levels: [{ h: null, cols: [col] }],
      };
    },
  },
  {
    id: "slupek",
    label: "Słupek",
    hint: "600 × 2000 × 600, wyższy od ciągu — blat kończy się przy nim",
    make: () => ({
      W: 600, H: 2000, D: 600,
      plinth: { on: true, height: 100, mode: "under", setback: 0 },
      levels: [newLevel(2, autoShelves(innerHeightOf(2000)))],
    }),
  },
  {
    /* Narożnik w L to nie jedna szafka, tylko układ: szafka w rogu przy jednej
       ścianie, drugi ciąg pod kątem prostym i szafka przy nim. Ustawianie tego
       ręcznie to cztery różne pola w trzech miejscach — szablon składa to od
       razu, a `corner: true` mówi karcie, że po dodaniu ma jeszcze założyć
       drugi ciąg i dołożyć do niego szafkę. */
    id: "naroznikL",
    label: "Narożnik L",
    hint: "szafka narożna z ramieniem plus drugi ciąg za rogiem",
    corner: true,
    // glebokosc drugiego ciagu — pusty ciag nie ma jej skad wziac, a to od niej
    // zalezy, ile z szerokosci naroznika zostaje na front
    otherD: CORNER_L_D,
    make: () => {
      /* Front sięga tylko tam, gdzie korpus nie wchodzi w ramię: reszta
         szerokości chowa się za drugim ciągiem, a ostatnie milimetry zabiera
         lico ramienia, które stoi o grubość frontu przed jego korpusem.
         Szerokosci nie wpisujemy: pasmo frontu jest juz przyciete do lica
         naroznika, wiec drzwi dobieraja sie same i jada za kazda zmiana
         glebokosci sasiada. Wpisana na sztywno zostawala stara i robila szpare
         miedzy drzwiami a maskownica katownika. */
      const col = newColumn(1, autoShelves(innerHeightOf(720)));
      return {
        W: CORNER_L_W, H: 720, D: CORNER_L_D,
        plinth: { on: true, height: 100, mode: "under", setback: 0 },
        corner: { on: true, arm: CORNER_L_ARM, doors: "wsporniki" },
        levels: [{ h: null, cols: [col] }],
      };
    },
  },
];

const makeFromTemplate = (id) => {
  const tpl = TEMPLATES.find((t) => t.id === id) || TEMPLATES[0];
  return migrateCab({ ...JSON.parse(JSON.stringify(defaultCab)), ...tpl.make() });
};

/* Nowy projekt startuje z szablonu „Szafka stojąca", a nie z golego defaultCab:
   szafka bez cokolu to nie jest nic, co ktos faktycznie stawia, a dopisanie
   cokolu pozniej przesuwa wszystkie wysokosci w gotowym juz projekcie.
   `makeFromTemplate` oddaje swiezy obiekt, wiec kolejne projekty nie dziela
   jednej szafki przez referencje. */
const START_TEMPLATE = "stojaca";
const newProject = () => ({
  name: DEFAULT_PROJECT_NAME,
  prices: {},
  items: [{ cab: makeFromTemplate(START_TEMPLATE), mat: defaultMaterials, runId: null }],
  runs: [],
  active: 0,
});

/* ---------- geometria ---------- */

/* `ctx` to informacja z rozmieszczenia ciagow, ktorej sama szafka nie ma:
   `armFree` mowi, ile jej lica zostaje przed narozem, a `armSide`, z ktorej
   strony wychodzi ramie. Bez tego wzmocnienia w szafce naroznej biegly przez
   caly korpus, takze przez przelot w ramie. Pole jest opcjonalne — widoki,
   ktore o narozniku nie wiedza, wolaja `computeGeo` jak dotad. */
function computeGeo(cab, mat, ctx) {
  const t = mat.board.thickness;
  const tf = mat.front.thickness;
  // polki w kolumnach (i dno/tyl szuflady) moga byc z innej plyty niz korpus;
  // przegrody i polki przelotowe zostaja konstrukcyjne, czyli z plyty korpusu
  const ts = cab.shelfSameAsBoard !== false ? t : ((mat.shelf && mat.shelf.thickness) || t);
  const backIsBoard = cab.back === "board";
  /* Pelne plecy z plyty w szafce naroznej zastepuja stojace wzmocnienie przy
     tej samej scianie — konstrukcja jest wtedy sztywna bez niego. */
  const plecyUsztywniaja = !!(cab.corner || {}).on && backIsBoard;
  // plyta na plecy ma grubosc korpusu, HDF swoja wlasna
  const tb = backIsBoard ? mat.board.thickness : mat.back.thickness;
  const backPos = cab.backPos === "outside" ? "outside" : "inside";
  const { H, D } = cab;

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
  // blat roboczy ma swoja grubosc — wieniec z plyty zostaje przy grubosci plyty
  const isWorktop = isBlat && rawTop.material === "worktop";
  const tTop = isWorktop ? ((mat.worktop && mat.worktop.thickness) || 38) : t;
  const blat = isBlat
    ? { overL: ov(rawTop.overL), overR: ov(rawTop.overR), overFront: ov(rawTop.overFront), overBack: ov(rawTop.overBack) }
    : null;
  const hasBot = botL !== "none" && botR !== "none";

  /* Szerokosc blatu: "outside" (domyslnie) — W to korpus, blat wystaje poza
     niego; "inside" — W to calkowita szerokosc mebla, a boki chowaja sie do
     srodka o wysuniecia. Reszta silnika liczy jak zwykle od szerokosci
     korpusu, wiec wystarczy podmienic ja tutaj. */
  const blatInside = isBlat && rawTop.widthMode === "inside";
  const W = blatInside ? cab.W - blat.overL - blat.overR : cab.W;
  const g = cab.gaps;
  const msgs = [];
  const add = (level, text) => msgs.push({ level, text });

  if (blatInside && W <= 2 * t)
    add("error", `Wysunięcia blatu (${fmt(blat.overL)} + ${fmt(blat.overR)} mm) zjadają całą szerokość ${fmt(cab.W)} mm — na korpus nic nie zostaje.`);

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

  /* Szafka narozna z ramieniem nie ma boku od tej strony, w ktora ramie wychodzi
     — zamiast niego stoi katownik w zewnetrznym narozniku. */
  const rawCorner = cab.corner || {};
  const postCfg = rawCorner.post || {};
  const postOn = !!(rawCorner.on && postCfg.on !== false);
  const postSide = postOn ? (rawCorner.side === "left" ? "left" : "right") : null;
  /* Katownik w tylnym narozniku chowa sie za plecami z obu stron: wzdluz sciany
     korpusu i wzdluz sciany ramienia. Plecy przybija sie na niego od zewnatrz,
     wiec o ich grubosc odsuwa sie od obu plaszczyzn. */
  const postBack = Math.max(0, cab.back !== "none" ? Math.round(tb) : 0);
  const postW = Math.max(MIN_PART, Math.round(Number(postCfg.w) || 150));

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
  /* Nozka podpiera dno. Przy cokole w obrysie dno stoi juz na wysokosci cokolu,
     wiec nozka miesci sie w tej przestrzeni i nie podnosi szafki — podnosi ja
     dopiero o tyle, o ile jest wyzsza od cokolu. */
  const legH = cab.legs && cab.legs.on ? Math.max(0, Math.round(num(cab.legs.height) ?? 100)) : 0;
  const legTop = plinthInBody ? bottomY : 0;
  const legBelow = Math.max(0, legH - legTop);

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
    /* Kolumna oznaczona `noDiv` nie ma przegrody po swojej prawej stronie —
       wnetrze idzie dalej bez przerwy. Tak wchodzi sie do ramienia szafki
       naroznej: front konczy sie, a korpus nie. */
    const nDiv = rawCols.slice(0, -1).filter((c) => !c.noDiv).length;
    const colFree = innerW - nDiv * t;
    const col = distribute(colFree, rawCols.map((c) => c.w));
    if (col.diff !== 0)
      add(
        "error",
        (col.diff < 0
          ? `Poziom ${lv.i + 1}: kolumny przekraczają szerokość wnętrza o ${fmt(-col.diff)} mm.`
          : `Poziom ${lv.i + 1}: kolumny nie wypełniają szerokości — brakuje ${fmt(col.diff)} mm.`) +
          `|fixcolauto:${lv.i}`
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
        add("error", `Poziom ${lv.i + 1}, kolumna ${j + 1}: szerokość zero lub mniej.|fixcolauto:${lv.i}`);

      /* półki wewnątrz kolumny — kolumna z szufladami ich nie ma */
      const st =
        rawCols[j].kind === "drawers" ? [null] : rawCols[j].shelfTargets || [null];
      const nS = Math.max(0, st.length - 1);
      const shFree = lv.h - nS * ts;
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
          sy += ts;
        }
      }

      c.noDiv = !!rawCols[j].noDiv;
      lv.cols.push(c);
      cx += w;
      if (j < K - 1 && !rawCols[j].noDiv) {
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
    else if (divGap > 5)
      // szczeline reguluje sie nalozeniem: kazdy milimetr nalozenia zabiera z niej dwa
      add(
        "warn",
        `Szczelina nad przegrodą to ${fmt(divGap)} mm — powyżej 5 mm.` +
          `|fixdiv:${divOv + 1}|fixdiv:${Math.max(0, divOv - 1)}`
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
      /* Nad przegroda fronty nakladaja sie po `divOverlay` z kazdej strony —
         tak samo drzwi jak i fronty szuflad. Dotad drzwi dzielilo pol grubosci
         plus pol luzu, przez co zachodzily 8 mm z dolu i 7 z gory, a pole
         „nalozenie na przegrode" nie mialo na nie zadnego wplywu. */
      lo =
        lv.i === 0
          ? bottomY + g.bottom
          : Math.round(sepShelves[lv.i - 1].y + t - divOv);
      hi =
        lv.i === levels.length - 1
          ? H - (isBlat ? t : 0) - g.top
          : Math.round(sepShelves[lv.i].y + divOv);
    } else {
      lo = lv.y0 + g.inset;
      hi = lv.y1 - g.inset;
    }
    lv.frontLo = lo;
    lv.frontHi = hi;
    /* Fronty szuflad nie trzymaja luzu do korpusu, tylko go zakrywaja: dolny
       zachodzi na dno, gorny na wieniec, a nad przegroda dwa sasiednie fronty
       nakladaja sie po `divOverlay` i zostawiaja miedzy soba szczeline. */
    if (cab.frontMode === "overlay") {
      lv.drawLo = lv.i === 0
        ? lv.y0 - Math.max(0, Math.round(num(g.overBottom) ?? 15))
        : Math.round(sepShelves[lv.i - 1].y + t - divOv);
      lv.drawHi = lv.i === levels.length - 1
        ? lv.y1 + Math.max(0, Math.round(num(g.overTop) ?? 15))
        : Math.round(sepShelves[lv.i].y + divOv);
    } else {
      lv.drawLo = lo;
      lv.drawHi = hi;
    }
    const bandH = Math.round(hi - lo);

    lv.cols.forEach((c, j) => {
      const rawCol = rawLevels[lv.i].cols[j];
      const kind =
        rawCol.kind === "drawers" || rawCol.kind === "blenda" ? rawCol.kind : "doors";
      c.kind = kind;
      const where = `Poziom ${lv.i + 1}, kolumna ${j + 1}`;

      // --- elementy wzmacniajace kolumny ---
      /* Plecy z plyty trzymaja korpus w kacie prostym tak samo jak stojace
         wzmocnienie tuz przy nich — w szafce naroznej to wlasnie ta zamiana
         pozwala je zdjac i nie robic dwa razy tej samej roboty. */
      const rawRails = (Array.isArray(rawCol.rails) ? rawCol.rails : [])
        .filter((r) => !(plecyUsztywniaja && r.orient === "front" && r.fromBack));
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
      /* Wzmocnienie to plyta korpusu, nie front: trzyma sie swiatla poziomu,
         a nie linii frontow. Liczone po staremu z `lo`/`hi` konczylo sie na
         luzie frontu, wiec w rysunku i w bryle brakowalo mu tych kilku
         milimetrow do krawedzi boku. */
      const kLo = lv.y0;
      const kHi = lv.y1;
      /* Wzmocnienie konczy sie na maskownicy katownika: dalej lico jest juz
         otwarte i prowadzi w ramie, wiec nie ma czego usztywniac ani do czego
         przykrecac. */
      /* Kawalek za wolnym licem to jeszcze nie koniec: wzmocnienie ma dojsc do
         konca katownika, bo dopiero na jego calej szerokosci ma sie czego
         trzymac. `armKat` mowi, ile katownik wystaje poza lico. */
      const kat = (ctx && ctx.armKat) || 0;
      const licoOd = ctx && ctx.armFree > 0 && ctx.armSide === "left"
        ? W - ctx.armFree - kat : 0;
      const licoDo = ctx && ctx.armFree > 0
        ? (ctx.armSide === "right" ? ctx.armFree + kat : W) : W;
      c.rails = rawRails.map((r) => {
        const rh = Math.max(0, Math.round(r.h || 0));
        const rd = Math.max(0, Math.round(r.depth || 0));
        const rAt = Math.max(0, Math.round(r.atDepth || 0));
        const zLen = r.orient === "front" ? t : rd;
        /* Lico przycina tylko to, co stoi z przodu — przy tylnej scianie ramie
           niczego nie otwiera, wiec wzmocnienie idzie przez cala szafke az do
           katownika w tylnym narozniku. Inaczej wisialo w powietrzu. */
        const przyTyle = !!r.fromBack;
        /* W rogu plyta przy plecach ma dolegac do wewnetrznego lica katownika:
           od tylu idzie najpierw plyta plecow, potem ramie katownika, dopiero
           potem wzmocnienie. Zapisane cofniecie moze byc mniejsze, wiec tutaj
           je dociagamy — inaczej zostawalaby szpara na grubosc plecow. */
        const zaKatownikiem = postSide && przyTyle
          ? Math.max(backIntrusion, cab.back !== "none" ? tb : 0) + t : 0;
        const z0 = przyTyle
          ? Math.max(0, carcassDepth - Math.max(rAt, zaKatownikiem) - zLen) : rAt;
        const cw = c.x1 - c.x0;
        /* Od strony ramienia wzmocnienie konczy sie na wewnetrznym licu
           katownika, a nie na plaszczyznie boku — katownik jest jeszcze cofniety
           o grubosc plecow. */
        const doKatownika = postSide === "right" ? W - t - postBack : null;
        const odKatownika = postSide === "left" ? t + postBack : null;
        const rx0 = przyTyle
          ? Math.max(c.x0, odKatownika ?? c.x0) : Math.max(c.x0, licoOd);
        const rx1 = przyTyle
          ? Math.min(c.x1, doKatownika ?? c.x1) : Math.min(c.x1, licoDo);
        const rw = Math.max(0, rx1 - rx0);
        if (r.orient === "shelf") {
          const ry = r.pos === "bottom" ? kLo : kHi - t;
          return { orient: "shelf", x0: rx0, x1: rx1, y0: ry, y1: ry + t, z0, zLen: rd, a: rw, b: rd };
        }
        if (r.orient === "vertical") {
          const rx = r.side === "right" ? c.x1 - t : c.x0;
          // swiatlo poziomu konczy sie juz pod wiencem, wiec nic nie odejmujemy
          return { orient: "vertical", x0: rx, x1: rx + t, y0: kHi - rh, y1: kHi, z0, zLen: rd, a: rh, b: rd };
        }
        const ry1 = r.pos === "bottom" ? kLo + rh : kHi;
        // przyTyle rozroznia plyte przy plecach od tej przy licu — obie stoja
        return { orient: "front", przyTyle: !!r.fromBack,
          x0: rx0, x1: rx1, y0: ry1 - rh, y1: ry1, z0, zLen: t, a: rw, b: rh };
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
      /* W szafce naroznej pasmo frontu konczy sie na maskownicy katownika —
         dalej lico chowa sie za drugim ciagiem i nie ma czego zaslaniac.
         Bez tego szerokosc drzwi trzeba bylo wpisac recznie i po zmianie
         glebokosci sasiada zostawala stara: miedzy drzwiami a maskownica robila
         sie szpara, bo maskownica jedzie z licem, a wpisana liczba nie. */
      if (ctx && ctx.armFront > 0) {
        const licoOd0 = cab.frontMode === "overlay" ? g.edge : t + g.inset;
        if (ctx.armSide === "right") sx1 = Math.min(sx1, licoOd0 + ctx.armFront);
        else sx0 = Math.max(sx0, W - licoOd0 - ctx.armFront);
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
          bandLo: lv.i === 0 ? null : clo, bandHi: lv.i === L - 1 ? null : chi,
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
            bandLo: lv.i === 0 ? null : by0, bandHi: lv.i === L - 1 ? null : by1,
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
        /* Jedne drzwi w kolumnie przy rogu maja wypelnic lico az do maskownicy
           katownika — innej szerokosci nie ma tam po co ustawiac. Starsze
           projekty maja ja wpisana na sztywno (tak robil szablon) i po zmianie
           glebokosci sasiada zostawala szpara, wiec taka liczbe pomijamy. */
        const przyRogu = ctx && ctx.armFront > 0
          && (ctx.armSide === "right" ? j === lv.cols.length - 1 : j === 0);
        if (przyRogu && cnt === 1) wTargets[0] = null;
        const dws = distribute(availW, wTargets);
        /* W szafce naroznej front celowo nie siega konca korpusu — nad
           ramieniem nie ma czego zaslaniac, wiec to nie jest blad. */
        const narozna = !!(cab.corner && cab.corner.on);
        if (dws.diff !== 0 && !narozna)
          add(
            "error",
            `${where}: zadane szerokości drzwi nie wypełniają pasma — różnica ${fmt(Math.abs(dws.diff))} mm.`
          );
        c.doorWs = dws.sizes;
        // gdy dzielimy rowno, a wychodza rozne szerokosci o 1-2 mm — podpowiedz,
        // jakim luzem (w gore albo w dol) pasmo podzieli sie bez resztek
        const autoCnt = wTargets.filter((v) => num(v) === null).length;
        const fixedW = wTargets.reduce((s2, v) => s2 + (num(v) ?? 0), 0);
        if (autoCnt > 1) {
          const uniq = [...new Set(dws.sizes.map((v) => Math.round(v)))];
          if (uniq.length > 1) {
            const spread = Math.max(...uniq) - Math.min(...uniq);
            if (spread <= 2) {
              const opt = evenGapOptions(sx1 - sx0, cnt, fixedW, autoCnt, colGap);
              const acts = [opt.up, opt.down]
                .filter((v) => v !== null)
                .map((v) => `|fixgap:${lv.i}:${j}:${v}:${v > colGap ? "up" : "down"}`)
                .join("");
              add("info", `${where}: przy równym podziale drzwi różnią się o ${fmt(spread)} mm. Zmień luz między drzwiami, żeby formatki były identyczne.${acts}`);
            }
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
            bandLo: lv.i === 0 ? null : clo, bandHi: lv.i === L - 1 ? null : chi,
            mirror: !!(rawCol.mirrors || [])[i],
            hinges: num((rawCol.hinges || [])[i]) ?? autoHinges(cbandH, dw),
            handle: (rawCol.handles || [])[i] !== false,
            hingeSide:
              cnt === 1
                ? rawCol.hinge === "left" || rawCol.hinge === "right"
                  ? rawCol.hinge
                  : cab.hinge === "left" || cab.hinge === "right"
                  ? cab.hinge
                  : hasFix && rawFix.side === "left"
                  ? "right"
                  : "left"
                : i < cnt / 2
                ? "left"
                : "right",
          };
          /* Zawias musi miec do czego sie przykrecic: bok szafki albo przegrode.
             Tam, gdzie kolumny stykaja sie bez przegrody (przelot do ramienia
             szafki naroznej), plyty nie ma i drzwi wisialyby w powietrzu. */
          const kolumny = rawLevels[lv.i].cols;
          const wPowietrzu = d.hingeSide === "left"
            ? j > 0 && !!kolumny[j - 1].noDiv
            : j < kolumny.length - 1 && !!kolumny[j].noDiv;
          if (wPowietrzu) {
            const druga = d.hingeSide === "left" ? "right" : "left";
            add("error", `${where}: zawiasy wypadają od strony przelotu — nie ma tam płyty, `
              + `do której da się je przykręcić. Przełóż je na ${druga === "left" ? "lewą" : "prawą"} stronę.`
              + `|hingeflip:${lv.i}:${j}:${druga}`);
          }
          // rozstaw zawiasow + kolizje z polkami i wzmocnieniami w tej kolumnie
          const hObs = [
            ...c.shelves.map((s) => ({ y0: s.y, y1: s.y + ts, what: "półką" })),
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
      const dlo = dIn ? lv.y0 + g.inset : cab.frontMode === "overlay" ? lv.drawLo : lo;
      const dhi = dIn ? lv.y1 - g.inset : cab.frontMode === "overlay" ? lv.drawHi : hi;
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
      const fixedFronts = ds.reduce((s2, d) => s2 + (num(d.front) ?? 0), 0);
      if (autoFronts > 1) {
        const uniq = [...new Set(fr.sizes.map((v) => Math.round(v)))];
        const spread = uniq.length > 1 ? Math.max(...uniq) - Math.min(...uniq) : 0;
        if (spread >= 1 && spread <= 2) {
          const opt = evenGapOptions(dbandH, ds.length, fixedFronts, autoFronts, drGap);
          const acts = [opt.up, opt.down]
            .filter((v) => v !== null)
            .map((v) => `|fixgap:${lv.i}:${j}:${v}:${v > drGap ? "up" : "down"}`)
            .join("");
          add("info", `${where}: przy równym podziale fronty szuflad różnią się o ${fmt(spread)} mm. Zmień luz między frontami, żeby były identyczne.${acts}`);
        }
      }

      /* Wciecie na palce: front wpuszczany skracamy od gory, zeby zamiast
         uchwytu zahaczyc palcami o jego gorna krawedz. Podzial pasma i pozycje
         prowadnic zostaja bez zmian — skraca sie sama formatka frontu. */
      const grip = dIn && rawCol.fingerGrip
        ? Math.max(0, Math.round(num(rawCol.gripDepth) ?? 18))
        : 0;
      c.fingerGrip = grip;
      let y = dlo;
      ds.forEach((d, i) => {
        const fhFull = fr.sizes[i];
        const fh = Math.max(0, fhFull - grip);
        // wysokosc boku V-BOX: auto dobiera najwyzszy bok mieszczacy sie w froncie
        const fitH = [...VBOX.heights]
          .filter((hc) => VBOX.minFront[dMode][hc] <= fh)
          .pop();
        let hClass;
        if (d.h === "auto" || d.h == null) {
          hClass = fitH || VBOX.heights[0];
        } else {
          hClass = VBOX.heights.includes(Number(d.h)) ? Number(d.h) : 127;
          // bok wybrany recznie — front moze uniesc wyzszy, wiec to podpowiadamy
          if (fitH && fitH > hClass)
            add("info", `${where}, szuflada ${i + 1}: front uniesie wyższy bok ${fitH} mm zamiast ${hClass}.|fixh:${lv.i}:${j}:${i}:${fitH}`);
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
        /* Prowadnica najnizszej szuflady siada rowno na dnie albo na przegrodzie
           tego poziomu — to ona wyznacza wysokosc, a front sie do niej
           dostosowuje. Wyzsze szuflady nie maja na czym usiasc, wiec ich front
           schodzi ponizej szyny o staly, ustawialny wymiar. */
        const railY0 = i === 0
          ? lv.y0
          : y + Math.max(0, Math.round(num(g.underRail) ?? 5));
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
          // skrzynki, glebokosc z NL. Front nakladany -> dol szyny o reszte
          // grubosci dna nad dolem frontu, front wpuszczany -> o luz
          // wpuszczenia ponizej niego; w obu przypadkach najnizsza szyna
          // siada rowno z dnem korpusu.
          rail: {
            y0: railY0,
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
          bandLo: lv.i === 0 ? null : dlo, bandHi: lv.i === L - 1 ? null : dhi,
        });
        if (d.handle !== false) handleCount += 1;
        if (nl !== null) {
          const kk = `${hClass}|${nl}`;
          slideGroups.set(kk, (slideGroups.get(kk) || 0) + 1);
        }

        const minF = VBOX.minFront[dMode][hClass];
        if (fh < minF) {
          // najwyzszy bok, ktory zmiesci sie w tak skroconym froncie
          const fitLower = [...VBOX.heights].filter((hc) => VBOX.minFront[dMode][hc] <= fh).pop();
          add(
            "error",
            `${where}, szuflada ${i + 1}: front ${fmt(fh)} mm, a minimum dla wysokości ${hClass} mm przy froncie ${
              dIn ? "wpuszczanym" : "na korpusie"
            } to ${minF} mm.` +
              (fitLower ? `|fixh:${lv.i}:${j}:${i}:${fitLower}` : "")
          );
        }
        if (fh - hClass > 140)
          add(
            "warn",
            `${where}, szuflada ${i + 1}: front wystaje ${fmt(fh - hClass)} mm ponad bok szuflady — zastosuj reling boczny.`
          );

        /* Tyl szuflady bywa podnoszony do wysokosci frontu, zeby rzeczy nie
           wypadaly ponad burte. Nizej niz standardowy tyl zejsc nie moze —
           wtedy nie ma czym spiac skrzynki. */
        const stdBack = VBOX.backH[hClass];
        /* Podniesiony tyl jedzie razem ze skrzynka i musi przejsc pod tym, co
           jest nad szuflada — frontem wyzej albo gora swiatla poziomu — a do
           tego zostawic luz, zeby o nic nie zawadzal. */
        const ceilY = i + 1 < ds.length ? y + fhFull + drGap : lv.y1;
        const maxBack = Math.max(0, Math.round(ceilY - railY0) - BACK_CLEAR);
        let backH = stdBack;
        if (d.tallBack) {
          const wanted = num(d.backHeight);
          // domyslnie tak wysoko jak front, ale nie wyzej niz przejdzie
          backH = wanted === null ? Math.min(fh, maxBack) : Math.max(0, Math.round(wanted));
          if (backH < stdBack)
            add(
              "error",
              `${where}, szuflada ${i + 1}: tył ${fmt(backH)} mm jest niższy niż bok skrzynki (${stdBack} mm).` +
                `|fixback:${lv.i}:${j}:${i}:${stdBack}`
            );
          if (backH > maxBack)
            add(
              "warn",
              `${where}, szuflada ${i + 1}: tył ${fmt(backH)} mm nie przejdzie pod tym, co jest wyżej — mieści się ${fmt(maxBack)} mm.` +
                (maxBack >= stdBack ? `|fixback:${lv.i}:${j}:${i}:${maxBack}` : "")
            );
        }
        if (nl !== null && LW > 0) {
          drawerParts.push({ kind: "front", a: fh, b: dsx1 - dsx0 });
          drawerParts.push({ kind: "dno", a: LW - 75, b: nl - 24 });
          drawerParts.push({ kind: "tyl", a: LW - 87, b: backH });
        }
        y += fhFull + drGap;
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

  /* Odcinki lica zabudowane na staly. Tam, gdzie stoi plyta, nie ma szczeliny —
     i kontrola luzu nie moze tego kawalka liczyc. W szafce naroznej front konczy
     sie tam, gdzie zaczyna sie ramie: dalsza czesc lica idzie w druga sciane,
     a styk zamyka maskownica przy wsporniku. Ktora to strona, wiadomo dopiero
     z rozmieszczenia ciagow, wiec sam luz przy boku sprawdza cornerPairMsgs —
     tutaj zostaje odjecie zabudowanego kawalka i wyciszenie znacznika na
     rysunku. */
  const builtFront = [];
  if (cab.corner && cab.corner.on) {
    levels.forEach((lv) => {
      const band = doors.filter((d) => d.lvl === lv.i && d.w > 0);
      if (!band.length) return;
      const lo = Math.min(...band.map((d) => d.x));
      const hi = Math.max(...band.map((d) => d.x + d.w));
      /* Ramie wychodzi ta strona, po ktorej zostalo wiecej niezakrytego lica —
         po drugiej dziura w froncie zostaje dziura i ma sie odezwac. */
      if (lo >= W - hi) builtFront.push({ lvl: lv.i, x0: 0, x1: lo });
      else builtFront.push({ lvl: lv.i, x0: hi, x1: W });
    });
  }
  // ile z odcinka [x0, x1) na danym poziomie jest zabudowane plyta
  const builtIn = (lvl, x0, x1) => builtFront.reduce((s2, b) => {
    if (b.lvl !== lvl) return s2;
    return s2 + Math.max(0, Math.min(x1, b.x1) - Math.max(x0, b.x0));
  }, 0);

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
      const surowy = Math.round(nb.x - (a2.x + a2.w));
      // to, co zabudowane, nie jest szczelina — zostaje sam luz
      const gap = surowy > 0
        ? Math.round(surowy - builtIn(lv.i, a2.x + a2.w, nb.x))
        : surowy;
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
        /* Za duza szczelina to blad, nie kosmetyka: widac przez nia wnetrze,
           a fronty przestaja stac w linii. Mowimy o ile za duzo i miedzy czym. */
        add(
          "error",
          `Poziom ${lv.i + 1}: między ${nameOf(a2)} a ${nameOf(nb)} jest ${fmt(gap)} mm luzu — `
            + `o ${fmt(gap - cab.maxGap)} mm za dużo, granica to ${fmt(cab.maxGap)} mm.`
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
  /* Arkusz jest okrawany przed rozkrojem, wiec formatka wieksza niz to, co po
     okrawaniu zostaje, nie ma z czego powstac. Formatka z wymuszonym slojem nie
     moze sie obrocic, wiec dla niej liczy sie tylko jedno ulozenie. */
  const laysOn = (a, b) =>
    Math.round(a * 10) / 10 <= USABLE_W && Math.round(b * 10) / 10 <= USABLE_H;
  const P = (o) => {
    let key = o.matKey;
    if (sameBoard && key === "front") key = "board";
    if (sameShelf && key === "shelf") key = "board";
    // plecy z HDF wolno obracac zawsze — uslojenie ich nie dotyczy
    const rot = key === "back" || !cab.grainMatters;
    const fits = laysOn(o.a, o.b) || (rot && laysOn(o.b, o.a));
    if (o.a > 0 && o.b > 0 && !fits)
      add(
        "error",
        `${o.name} ${fmt(o.a)} × ${fmt(o.b)} mm nie mieści się na arkuszu — po okrawaniu zostaje ${fmt(USABLE_W)} × ${fmt(USABLE_H)} mm.`
      );
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
  if (postSide) {
    // po stronie ramienia boku nie ma — zostaje tylko ten drugi
    P(postSide === "right"
      ? { ...sideL, note: sideL.note || noteOf(sideL.edges, "side") }
      : { ...sideR, note: sideR.note || noteOf(sideR.edges, "side") });
    /* Katownik: jedna plyta w plaszczyznie boku, druga w plaszczyznie plecow,
       skrecone pod 90 stopni. Formatka nie schodzi ponizej MIN_PART, wiec jedna
       nachodzi na czolo drugiej — tak samo jak przy maskownicy w rogu. */
    const postH = interior.y1 - interior.y0;
    P({ name: "Kątownik przy ramieniu — bok", qty: 1, a: postW, b: postH, matKey: "shelf",
      edges: { a1: false, a2: false, b1: true, b2: true }, note: "obie krawędzie pionowe" });
    P({ name: "Kątownik przy ramieniu — plecy", qty: 1, a: postW, b: postH, matKey: "shelf",
      edges: { a1: false, a2: false, b1: true, b2: false },
      note: "krawędź pionowa od strony wnętrza — druga wchodzi w styk" });
  } else if (same(sideL, sideR)) {
    P({ ...sideL, name: "Bok", qty: 2, note: sideL.note || noteOf(sideL.edges, "side") });
  } else {
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
        matKey: rawTop.material === "worktop" ? "worktop" : "board",
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
        matKey: "shelf",
        edges: { a1: false, a2: false, b1: false, b2: false },
        note: "bez obrzeża",
      },
      tyl: {
        name: "Tył szuflady",
        matKey: "shelf",
        edges: { a1: true, a2: false, b1: false, b2: false },
        note: "oklejona krawędź górna",
      },
    }[kind];
    P({ ...meta, qty, a: Number(a), b: Number(b) });
  });

  /* Blat roboczy ma stala glebokosc arkusza. Formatka glebsza niz on po prostu
     sie z niego nie wytnie — trzeba wziac szerszy blat. */
  if (isWorktop) {
    const wd = worktopDepth(mat);
    if (blatDepth > wd) {
      const szerszy = WORKTOP_DEPTHS.find((d) => d >= blatDepth);
      add("error", `Blat ${fmt(blatDepth)} mm jest głębszy niż arkusz blatu ${fmt(wd)} mm — nie wytnie się z niego.`
        + (szerszy ? `|worktop:${szerszy}` : ""));
    }
    if (topX1 - topX0 > WORKTOP_LEN)
      add("error", `Blat ${fmt(topX1 - topX0)} mm jest dłuższy niż arkusz blatu (${fmt(WORKTOP_LEN)} mm) — trzeba go podzielić.`);
  }

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
    const name = r.orient === "front"
      ? (r.przyTyle ? "Wzmocnienie tylne" : "Wzmocnienie czołowe")
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
    /* Luz 1 mm z kazdej strony takze pod blatem: gora korpusu i tak jest
       zamknieta wzmocnieniami, wiec plecy maja sie do czego przybic. */
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
    // plyty na plecy nie da sie okleic — zadne ustawienie tego nie zmieni
    if (p.matKey === "back") {
      p.edges = { a1: false, a2: false, b1: false, b2: false };
    } else {
      const o = (cab.edgeOverrides || {})[p.name];
      if (o) {
        p.edges = { ...p.edges, ...o };
        p.note = "oklejanie ustawione ręcznie";
      }
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
          if (hitY(sh.y, sh.y + ts) && oz0 < backIntrusion + shelfDepth)
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

  /* --- wiercenia: co i na jakiej wysokosci na kazdej plycie ---
     Wszystko mierzone od DOLNEJ KRAWEDZI wierconej plyty, bo tak sie ja
     kladzie na stole. Zawias i prowadnica siedza na tej samej wysokosci po
     obu stronach kolumny, wiec wpisujemy je do obu plyt. */
  const drillMap = new Map();
  const drillKey = (lvI, name) => (levels.length > 1 ? `Poziom ${lvI + 1} — ${name}` : name);
  const drillAdd = (lvI, name, base, kind, y, note) => {
    const key = drillKey(lvI, name);
    if (!drillMap.has(key)) drillMap.set(key, { panel: key, holes: [] });
    drillMap.get(key).holes.push({ kind, y: Math.round(y - base), note });
  };
  const panelsOfCol = (lv, c) => {
    const last = lv.cols.length - 1;
    return {
      left: { name: c.j === 0 ? "Bok lewy" : `Przegroda ${c.j}`, base: c.j === 0 ? leftY0 : lv.y0 },
      right: { name: c.j === last ? "Bok prawy" : `Przegroda ${c.j + 1}`, base: c.j === last ? rightY0 : lv.y0 },
    };
  };
  {
    const pin = cab.shelfPin || {};
    const pinNote = `⌀5, ${fmt(num(pin.dFront) ?? 37)} mm od przodu i ${fmt(num(pin.dBack) ?? 37)} mm od tyłu półki`;
    levels.forEach((lv) =>
      lv.cols.forEach((c) => {
        const p = panelsOfCol(lv, c);
        if (cab.shelfMount !== "confirmat")
          (c.shelves || []).forEach((s) => {
            drillAdd(lv.i, p.left.name, p.left.base, "kołek półki", s.y, pinNote);
            drillAdd(lv.i, p.right.name, p.right.base, "kołek półki", s.y, pinNote);
          });
        (c.drawers || []).forEach((dr) => {
          if (!dr.rail) return;
          const note = `dolna krawędź prowadnicy, NL ${fmt(dr.rail.d)}`
            + (dr.rail.setback ? `, cofnięta ${fmt(dr.rail.setback)} mm od lica` : "");
          drillAdd(lv.i, p.left.name, p.left.base, "prowadnica", dr.rail.y0, note);
          drillAdd(lv.i, p.right.name, p.right.base, "prowadnica", dr.rail.y0, note);
        });
      })
    );
    doors.forEach((d) => {
      if (d.type !== "door" || !(d.hingePts || []).length) return;
      const lv = levels[d.lvl];
      const c = lv && lv.cols[d.colJ];
      if (!c) return;
      const p = panelsOfCol(lv, c);
      const side = d.hingeSide === "left" ? p.left : p.right;
      const note = "oś zawiasu — puszka ⌀35 we froncie, prowadnik na płycie";
      d.hingePts.forEach((hy) => drillAdd(lv.i, side.name, side.base, "zawias", hy, note));
    });
  }
  // scalamy powtorki (te same wysokosci z sasiadujacych kolumn) i porzadkujemy
  const drillPlan = [...drillMap.values()].map((p) => {
    const by = new Map();
    p.holes.forEach((h) => {
      const k = `${h.kind}|${h.note}`;
      if (!by.has(k)) by.set(k, { kind: h.kind, note: h.note, ys: [] });
      const g = by.get(k);
      if (!g.ys.includes(h.y)) g.ys.push(h.y);
    });
    return {
      panel: p.panel,
      rows: [...by.values()].map((g) => ({ ...g, ys: g.ys.sort((a, b) => a - b) })),
    };
  });

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
      // lustro kupuje sie na metry, wiec podajemy powierzchnie, nie sztuki
      spec: `${fmt(b2)} × ${fmt(a2)} mm × ${qty} szt. — luz 0,5 mm na każdą stronę drzwi`,
      qty: Math.round((a2 * b2 * qty) / 1e6 * 100) / 100,
      unit: "m²",
    });
  });

  if (handleCount)
    hardware.push({
      name: cab.handleName || "Uchwyt",
      pk: "Uchwyt",
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
      spec: `${(cab.legs || {}).shape === "round" ? "okrągła" : "kwadratowa"}, wysokość ${fmt(cab.legs.height || 100)} mm`,
      qty: 4,
      unit: "szt.",
    });

  /* --- zlacza korpusu, kolki, zawieszki, wkrety ---
     Konfirmat co ok. 200 mm dlugosci styku, minimum 2 na styk. */
  const confPer = (len) => Math.max(2, Math.ceil((len || 0) / 200));
  let confQty = 0;
  const jointNotes = [];
  const joint = (n, len, what) => {
    if (n <= 0) return;
    const per = confPer(len);
    confQty += n * per;
    jointNotes.push(`${what} ${n}×${per}`);
  };
  // blat lezy na bokach i jest kryty od gory — mocowany od spodu, nie konfirmatem
  if (hasTop && !isBlat) joint(2, carcassDepth, "wieniec");
  if (hasBot) joint(2, carcassDepth, "dno");
  joint(dividers.length * 2, dividerDepth, "przegrody");
  joint(sepShelves.length * 2, shelfDepth, "półki przelotowe");
  joint(supportParts.length * 2, carcassDepth, "wsporniki");

  const shelfPins = cab.shelfMount !== "confirmat";
  let colShelves = 0;
  levels.forEach((lv) => lv.cols.forEach((c) => { colShelves += (c.shelves || []).length; }));
  if (!shelfPins) joint(colShelves * 2, shelfDepth, "półki");

  if (confQty)
    hardware.push({
      name: "Konfirmat 7 × 50",
      spec: `złącza korpusu: ${jointNotes.join(", ")} szt.`,
      qty: confQty,
      unit: "szt.",
    });
  // zaslepki chodza w blistrach po 25 — tak sie je kupuje i tak sie je wycenia.
  // qty zostaje w sztukach, przeliczenie na opakowania idzie na sam koniec,
  // zeby suma z kilku szafek nie zaokraglala sie w gore kilka razy
  if (confQty)
    hardware.push({
      name: "Zaślepka na konfirmat",
      spec: "blister 25 szt., po jednej na widoczny łeb",
      qty: confQty,
      unit: "szt.",
      pack: 25,
    });

  if (isBlat)
    hardware.push({
      name: "Trójkąt meblarski",
      spec: "blat przykręcany od spodu — konfirmat zepsułby lico",
      qty: 4,
      unit: "szt.",
    });
  if (cab.plinth && cab.plinth.on) {
    if (cab.legs && cab.legs.on) {
      hardware.push({
        name: "Złączka do cokołu",
        spec: "klips na nóżkę — po jednym na każdy koniec cokołu",
        qty: 2,
        unit: "szt.",
      });
    } else {
      /* Bez nozek cokol jest skrecany do korpusu na plastikowe trojkaty:
         po jednym na kazdym krotkim boku plus wzdluz dlugiego co ok. 300 mm,
         nie mniej niz dwa. */
      const plinthLen = Math.round(plinthInBody ? innerW : W);
      const alongLong = Math.max(2, Math.ceil(plinthLen / 300));
      hardware.push({
        name: "Trójkąt meblarski",
        spec: `cokół skręcany bez nóżek: 2 na krótkie boki + ${alongLong} wzdłuż ${fmt(plinthLen)} mm (co ok. 300 mm)`,
        qty: 2 + alongLong,
        unit: "szt.",
      });
    }
  }

  if (shelfPins && colShelves) {
    const pin = cab.shelfPin || {};
    hardware.push({
      name: "Kołek podporowy ⌀5",
      spec: `4 szt. na półkę, otwory ⌀5 — ${fmt(num(pin.dFront) ?? 37)} mm od przodu i ${fmt(num(pin.dBack) ?? 37)} mm od tyłu półki, wysokości na widoku otwartym liczone od ${
        cab.pinDatum === "bottom" ? "dna" : "dolnej krawędzi boku"}`,
      qty: colShelves * 4,
      unit: "szt.",
    });
  }

  // szafka wisząca: brak nozek i cokolu = musi byc na czym powiesic
  const floorStanding = (cab.legs && cab.legs.on) || (cab.plinth && cab.plinth.on);
  const wantHangers = cab.hangers === "always" || (cab.hangers !== "never" && !floorStanding);
  if (wantHangers) {
    const nH = W >= 900 ? 4 : 2;
    hardware.push({
      name: "Zawieszka meblowa regulowana",
      spec: "szafka bez nóżek i cokołu — wieszana na ścianie",
      qty: nH,
      unit: "szt.",
    });
    // listwa montazowa jest opcjonalna — zawieszki moga isc wprost na haki
    if (cab.hangerMode !== "haczyki")
      hardware.push({
        name: "Listwa montażowa do zawieszek",
        spec: `odcinek ${fmt(Math.max(0, W - 40))} mm na szafkę`,
        qty: Math.round(Math.max(0, W - 40) / 100) / 10,
        unit: "mb",
      });
    else
      hardware.push({
        name: "Hak / wkręt z kołkiem do ściany",
        spec: "zawieszki wieszane bez listwy — po jednym na zawieszkę",
        qty: nH,
        unit: "szt.",
      });
  }

  // wkretow do zawiasow i prowadnic nie liczymy — ida w komplecie z okuciem

  // plecy przybijane — we frezie trzymaja sie same
  if (hasBack && !grooved) {
    const per = 2 * (W + H);
    hardware.push({
      name: backIsBoard ? "Wkręt 3,5 × 30 do pleców" : "Zszywka / gwoździk do pleców",
      spec: "co ok. 100 mm po obwodzie",
      qty: Math.ceil(per / 100),
      unit: "szt.",
    });
  }

  /* Najmniejszy bok formatki. Ponizej tego piła formatowa nie ma czego trzymac
     — takiego kawalka nikt nie wytnie z plyty na maszynie. */
  const male = panels.filter((q) => Math.min(q.a, q.b) > 0 && Math.min(q.a, q.b) < MIN_PART);
  if (male.length)
    add("warn", `${male.length === 1 ? "Formatka" : "Formatki"} `
      + listPl([...new Set(male.map((q) => `${q.name} ${fmt(q.a)} × ${fmt(q.b)} mm`))])
      + ` ${male.length === 1 ? "ma bok" : "mają bok"} poniżej ${fmt(MIN_PART)} mm — `
      + "na formatówce się tego nie utnie, trzeba dociąć ręcznie z większego kawałka.");

  return {
    hardware,
    t, tf, tb, ts, carcassDepth, hasBack, interior, innerW, innerH,
    shelfDepth, dividerDepth, backIntrusion, frontCut, levels, sepShelves, dividers, doors, panels, msgs, maxNL,
    plinthInBody, plinthH, bottomY, legH, legTop, legBelow, pMode, grooved, grOff, grDep, grPlay, geoCuts, geoOb, geoObs,
    backPos, backIsBoard, cornerCut, builtFront,
    topL, topR, botL, botR, hasTop, hasBot, leftLen, rightLen, leftY0, rightY0,
    postSide, postW, postBack,
    isBlat, isWorktop, tTop, blat, blatDepth, blatInside, W, drillPlan,
    topX0, topX1, botX0, botX1, divOv,
  };
}

/* ---------- rysunki ---------- */

/* ---------- struktura usłojenia na rysunkach ----------
   Zamiast plaskiego koloru plyta dostaje wzor z delikatnymi slojami.
   Kolor zostaje ten sam — wzor tylko go rozrysowuje, wiec nic sie nie
   rozjezdza w zestawieniach, gdzie nadal uzywamy czystego hexa. */
/* Polki i zabudowa ida z "plyty polek", a ta domyslnie jest ta sama co korpus.
   Kolor na rysunku musi isc za tym samym wyborem co lista formatek, inaczej
   biala szafka dostaje bezowa zabudowe. */
const shelfColorOf = (cab, mat) =>
  cab.shelfSameAsBoard !== false ? mat.board.color : ((mat.shelf || mat.board).color);

const TEX_KEYS = ["board", "front", "shelf"];
const grainId = (hex, dir) =>
  "gr" + (dir === "h" ? "h" : "v") + String(hex || "").replace(/[^0-9a-fA-F]/g, "").toLowerCase();

const GrainDefs = ({ mat, on, dir }) => {
  if (!on) return null;
  const cols = [...new Set(TEX_KEYS.map((k) => (mat[k] || {}).color).filter(Boolean))];
  return (
    <defs>
      {cols.map((c) => (
        <pattern key={c} id={grainId(c, dir)} width="160" height="54"
          patternUnits="userSpaceOnUse" patternContentUnits="userSpaceOnUse"
          patternTransform={dir === "h" ? undefined : "rotate(90)"}>
          <rect x="0" y="0" width="160" height="54" fill={c} />
          <g fill="none" stroke="#000" strokeWidth="2.2" strokeOpacity="0.09">
            <path d="M0 8 q40 -6 80 0 t80 0" />
            <path d="M0 20 q30 5 60 0 t60 -3 t40 3" />
            <path d="M0 33 q50 -7 100 0 t60 2" />
            <path d="M0 46 q35 4 70 0 t90 -2" />
          </g>
          <g fill="none" stroke="#fff" strokeWidth="1.6" strokeOpacity="0.18">
            <path d="M0 14 q45 -5 90 0 t70 1" />
            <path d="M0 39 q40 5 80 0 t80 -2" />
          </g>
        </pattern>
      ))}
    </defs>
  );
};

/* Lico szafki naroznej za maskownica katownika jest otwarte — tamtedy siega sie
   w rog. Samo jasne pole czytalo sie jak dziura albo jak brakujaca plyta, wiec
   kreskujemy je na ukos: tak rysuje sie miejsce, w ktorym plyty nie ma. */
const PRZEJSCIE_ID = "mp-przejscie";
const PrzejscieDefs = () => (
  <defs>
    <pattern id={PRZEJSCIE_ID} width="34" height="34" patternUnits="userSpaceOnUse"
      patternTransform="rotate(45)">
      <line x1="0" y1="0" x2="0" y2="34" stroke={ACC} strokeWidth="3" opacity="0.3" />
    </pattern>
  </defs>
);

/* zwraca kopie materialow, w ktorej kolor plyty wskazuje na wzor slojow */
const texMat = (mat, on, dir) => {
  if (!on) return mat;
  const out = { ...mat };
  TEX_KEYS.forEach((k) => {
    if (out[k] && out[k].color) out[k] = { ...out[k], color: `url(#${grainId(out[k].color, dir)})` };
  });
  return out;
};

const DimH = ({ x1, x2, y, label, c = DIMC, above = true }) => (
  <g>
    <line x1={x1} y1={y} x2={x2} y2={y} stroke={c} strokeWidth="1.5" />
    <line x1={x1} y1={y - 8} x2={x1} y2={y + 8} stroke={c} strokeWidth="1.5" />
    <line x1={x2} y1={y - 8} x2={x2} y2={y + 8} stroke={c} strokeWidth="1.5" />
    <text x={(x1 + x2) / 2} y={above ? y - 8 : y + 22} textAnchor="middle"
      fontSize="22" fill={c} fontFamily="ui-monospace, monospace">{label}</text>
  </g>
);

const DimV = ({ y1, y2, x, label, c = DIMC, left = true, labelY = null }) => (
  <g>
    <line x1={x} y1={y1} x2={x} y2={y2} stroke={c} strokeWidth="1.5" />
    <line x1={x - 8} y1={y1} x2={x + 8} y2={y1} stroke={c} strokeWidth="1.5" />
    <line x1={x - 8} y1={y2} x2={x + 8} y2={y2} stroke={c} strokeWidth="1.5" />
    <text x={left ? x - 8 : x + 8} y={(labelY == null ? (y1 + y2) / 2 : labelY) + 7}
      textAnchor={left ? "end" : "start"} fontSize="22" fill={c}
      fontFamily="ui-monospace, monospace">{label}</text>
  </g>
);

/* Wysokosc lica szafki nad podloga ciagu: po niej poznajemy, ktore szafki laduja
   pod jednym blatem, ktora jest slupkiem, i jak wysoko wisi ciag gorny. */
const cabTopY = (cab, geo) => {
  const plinthH = cab.plinth && cab.plinth.on && !geo.plinthInBody ? geo.plinthH : 0;
  const legH = cab.legs && cab.legs.on ? geo.legBelow : 0;
  return Math.round(Math.max(plinthH, legH) + cab.H);
};

/* Ciag gorny wisi nad dolnym tej samej sciany, wiec jego wysokosci montazu sie nie
   wpisuje — liczy sie ja z lica dolnego plus przeswit. Dopoki dolny jest pusty,
   zostaje to, co zapisane. */
const tierMountY = (project, run) => {
  const wlasny = Math.max(0, Math.round(run.mountY || 0));
  if (run.tier !== "gorny" || !run.wall) return wlasny;
  const dolny = (project.runs || []).find((r) => r.id === run.wall);
  if (!dolny) return wlasny;
  const lista = runItems(project, dolny.id);
  if (!lista.length) return wlasny;
  const lico = Math.max(...lista.map(({ it }) => cabTopY(it.cab, computeGeo(it.cab, it.mat))));
  /* Przeswit mierzy sie od blatu, a nie od lica korpusu — nad szafkami lezy
     jeszcze plyta blatu i to ona wyznacza poziom, od ktorego liczy sie odstep. */
  const blat = dolny.worktop
    ? ((lista[0].it.mat.worktop || {}).thickness || 38)
    : Math.max(0, ...lista.map(({ it }) => {
        const g = computeGeo(it.cab, it.mat);
        return g.isBlat ? g.tTop : 0;
      }));
  return Math.round((dolny.mountY || 0) + lico + blat
    + Math.max(0, Math.round(run.clearance ?? 500)));
};

/* Dlugosc sciany jest wspolna dla obu pieter. */
const runWallW = (project, run) => {
  if (run.tier === "gorny" && run.wall) {
    const dolny = (project.runs || []).find((r) => r.id === run.wall);
    if (dolny && dolny.wallW != null) return dolny.wallW;
  }
  return run.wallW;
};

/* ---------- widoki zabudowy ----------
   Pojedyncza szafka ma swoje widoki od dawna. Ciag i cala zabudowa rysuja sie
   z tych samych czesci: kazda szafka wnosi swoja geometrie, a roznica jest
   tylko w tym, ile ciagow bierzemy i na jakiej wysokosci one wisza. */
/* `ref` to rozmieszczenie calego projektu. Szafka narozna potrzebuje z niego
   szerokosci dostepnego lica — bez tego jej wzmocnienia biegna przez przelot
   w ramie. Pierwsze przejscie (to, ktore buduje rozmieszczenie) `ref` nie ma
   i liczy sie jak dotad; rysunki i zestawienie wolaja juz z nim. */
/* Ile katownik wystaje poza wolne lico korpusu. Liczymy z `bracketPlan`, zeby
   rysunek i geometria nie rozjechaly sie przy zmianie ukladu plyt: bierzemy te
   plyty, ktore stoja w plaszczyznie korpusu (siegaja w glab ramienia). */
const bracketPozaLico = (a) => {
  if (!a.bracket) return 0;
  const tf = a.cab.geo.tf;
  const vF0 = armInset(a) ? a.depth - tf : a.depth;
  const korpusowe = bracketPlan(a, true).filter((r) => r.h === a.bracket.w);
  if (!korpusowe.length) return 0;
  return Math.max(0, Math.round(vF0 + tf - Math.min(...korpusowe.map((r) => r.v))));
};

const armCtxOf = (ref, index) => {
  if (!ref) return undefined;
  let out;
  ref.info.forEach((k) => {
    if (k.arm && k.arm.cab.index === index)
      out = { armFree: k.arm.free, armSide: k.arm.side, armKat: bracketPozaLico(k.arm),
        // ile lica zostaje na front korpusu: wolne lico bez maskownicy i luzu
        armFront: k.arm.front };
  });
  return out;
};

const assemblyParts = (project, runs, ref) =>
  runs.map((run) => {
    const gap = Math.max(0, Math.round(run.gap || 0));
    const mount = tierMountY(project, run);
    let x = 0;
    const cabs = runItems(project, run.id).map(({ it, i: index }, i, arr) => {
      const geo = computeGeo(it.cab, it.mat, armCtxOf(ref, index));
      const mat = texMat(it.mat, it.cab.texture, it.cab.textureDir);
      /* Cokol pod korpusem podnosi szafke, cokol w obrysie siedzi juz w H.
         Nozki podnosza tak samo, ale schowane w cokole nie dokladaja nic —
         dlatego bierzemy to, co wyzsze, a nie sume. */
      const plinthH = it.cab.plinth && it.cab.plinth.on && !geo.plinthInBody ? geo.plinthH : 0;
      const legBelow = it.cab.legs && it.cab.legs.on ? geo.legBelow : 0;
      const o = {
        // index = pozycja szafki w projekcie; po niej trafiaja w nia poprawki
        cab: it.cab, geo, mat, rawMat: it.mat, x, plinthH, index,
        // wysuniecie (+) albo cofniecie (-) z lica ciagu
        offset: Math.round(Number(it.offset) || 0),
        base: mount + Math.max(plinthH, legBelow),
        name: (it.cab.name || "").trim(),
        frontColor: it.cab.realColors && it.cab.frontSameAsBoard !== false
          ? mat.board.color : mat.front.color,
      };
      x += geo.W;
      if (i < arr.length - 1) x += gap;
      return o;
    });
    return { run, gap, mount, cabs, total: x };
  });

/* Ciag za rogiem bywa pusty — ramie i cokol trzeba narysowac, a koloru plyty
   ani wzoru slojow nie ma z czego wziac. Bierzemy je wtedy z pierwszej szafki,
   jaka w ogole jest na rysunku. */
const wzorcowaSzafka = (groups) => {
  const g = groups.find((x) => x.cabs.length);
  return g ? g.cabs[0] : null;
};
const kolorPlyty = (g, wzor) => {
  const c = g.cabs[0] || wzor;
  return c ? c.mat.board.color : "#d6d3d1";
};

/* Ramie szafki naroznej lezy w pasie sasiedniej sciany. Gdy rysujemy tylko
   jeden ciag, tamtego pasa nie ma — a ramie i tak trzeba pokazac, bo to kawalek
   tej szafki. Dostawiamy je wtedy tuz za koncem ciagu. */
const armsIn = (full, n, rysowane) => {
  const fn = full.info.get(n.id);
  if (!fn) return [];
  /* Ramiona lezace w tym pasie rysujemy zawsze, tez wtedy, gdy ciagu ich szafki
     nie ma na rysunku: to kawalek zabudowy stojacy przy TEJ scianie, wiec przy
     zakresie „ciag" musi byc widoczny — inaczej ciag za rogiem wyglada tak,
     jakby narożnika w ogole nie bylo. */
  const swoje = fn.arms;
  // ramiona szafek tego ciagu, ktorych pas nie jest rysowany — dostawiamy za koniec
  const cudze = [...full.info.values()]
    .filter((k) => k.arm && k.arm.run.id === n.id && !rysowane.has(k.arm.other.id))
    .map((k) => ({ ...k.arm, u0: n.len + WALL_SEP / 2, dostawione: true }));
  return [...swoje, ...cudze];
};

/* Front ramienia trzyma sie tego samego trybu co fronty jego szafki: nakladany
   siedzi przed korpusem ramienia, wpuszczany chowa sie w nim. `a.depth` to lico
   korpusu, wiec to od niego liczymy w obie strony. */
const armInset = (a) => a.cab.cab.frontMode === "inset";
const armFrontV = (a) => a.depth + (armInset(a) ? 0 : a.cab.geo.tf);

/* Katownik w wewnetrznym rogu szafki w L. Cztery pionowe plyty na cala wysokosc:
   dwie w srodku z plyty polkowej i dwie na czole korpusu z plyty frontowej,
   wszystkie skrecone ze soba. Zewnetrzne siedza wprost na korpusie, wiec ich lico
   wypada rowno z zamknietymi drzwiami — razem tworza jedna plaszczyzne.

   Formatka nie schodzi ponizej 60 mm, bo mniejszej nikt nie utnie i nie oklei.
   Dlatego jedna plyta nachodzi na czolo drugiej i od wewnetrznego naroza wychodzi
   60 mm dla nachodzacej, a 60 + grubosc dla doczolowej. Nachodzaca stoi domyslnie
   od strony krotszych drzwi — to one maja mniej do stracenia. */
const cornerBracket = (arm) => {
  const geo = arm.cab.geo;
  const cab = arm.cab.cab;
  const luz = (cab.gaps || {}).between ?? 3;
  const w = CORNER_BRACKET_W;
  const tryb = (cab.corner || {}).bracket === "dluzsze" ? "dluzsze" : "krotsze";
  const korpusKrotszy = arm.free <= arm.len;
  const nachodziKorpus = tryb === "krotsze" ? korpusKrotszy : !korpusKrotszy;
  /* Plyty musza sie stykac: krawedz jednej lezy na licu drugiej, tak jak przy
     zabudowie wycietego naroznika. Nachodzaca wchodzi w kwadrat styku obu lic,
     wiec od wewnetrznego naroza wystaje o grubosc plyty mniej, a doczolowa —
     ktora zaczyna sie dopiero za tym licem — o tyle samo wiecej. */
  return {
    w, luz, nachodziKorpus,
    // ile lica zjada katownik razem z luzem — osobno po stronie korpusu i ramienia
    odKorpusu: (nachodziKorpus ? w - geo.tf : w) + luz,
    odRamienia: (nachodziKorpus ? w + geo.tf : w) + luz,
  };
};

/* Front ramienia w ukladzie „od naroza": `odRogu` mowi, gdzie sie zaczyna, `w`
   jaki jest szeroki. Przy katowniku luz siedzi tylko na wolnym koncu — front
   zachodzi tam na bok ramienia dokladnie tak, jak drzwi szafki zachodza na jej
   bok. Jedno miejsce dla formatki i dla wszystkich rysunkow: rysowany po staremu
   na cala `armFront` konczyl sie rowno z bokiem, zamiast na niego zachodzic. */
const armFrontPlan = (a) => {
  const luz = (a.cab.cab.gaps || {}).edge ?? 2;
  const pelne = a.armFront != null ? a.armFront : a.len;
  const fix = a.doors === "fix";
  const ubytek = fix ? 0 : a.bracket ? luz : 2 * luz;
  return {
    odRogu: (a.len - pelne) + (fix || a.bracket ? 0 : luz),
    w: Math.max(0, Math.round(pelne - ubytek)),
  };
};

/* Cztery plyty katownika w rzucie z gory, w ukladzie ramienia: `u` biegnie wzdluz
   ramienia od strony rogu, `v` w glab od sciany. Zewnetrzne siedza w licach obu
   frontow, wewnetrzne tuz za nimi. Gdy rog wypada na drugim koncu ramienia,
   wszystko odbija sie lustrzanie. */
const bracketPlan = (a, lokalnie) => {
  const kat = a.bracket;
  if (!kat) return [];
  const tf = a.cab.geo.tf;
  const t = a.cab.geo.t;
  const vF0 = armInset(a) ? a.depth - tf : a.depth;   // wewnetrzna krawedz frontu ramienia
  /* Para plyt spina sie w kacie prostym wokol jednego naroza: krawedz jednej
     lezy na licu drugiej. Zewnetrzna para trzyma sie naroza obu lic, wewnetrzna
     tego samego naroza cofnietego o grubosc plyty czolowej — dlatego obie pary
     licza sie tym samym wzorem, tylko z innym punktem i inna gruboscia. */
  const para = (uC, vC, th, front) => (kat.nachodziKorpus
    ? [{ u: uC - th, v: vC - th, w: th, h: kat.w, front },          // korpus: nachodzaca
       { u: uC, v: vC - th, w: kat.w, h: th, front }]               // ramie: doczolowa
    : [{ u: uC - th, v: vC - th, w: kat.w, h: th, front },          // ramie: nachodzaca
       { u: uC - th, v: vC, w: th, h: kat.w, front }]);             // korpus: doczolowa
  const rects = [
    ...para(tf, vF0 + tf, tf, true),   // zewnetrzne — w licu zamknietych drzwi
    ...para(0, vF0, t, false),         // wewnetrzne — tuz za czolem korpusu
  ];
  /* W ukladzie ciagu rog wypada raz na poczatku, raz na koncu ramienia. Rysunek
     samej szafki liczy zawsze od jej lica, wiec tam odbicie jest zbedne. */
  return lokalnie || a.outerAtEnd ? rects : rects.map((r) => ({ ...r, u: a.len - r.u - r.w }));
};

/* Wzmocnienia i plecy ramienia w jego wlasnym ukladzie: `u` biegnie wzdluz
   ramienia od lica korpusu, `v` w glab od sciany. Jedno miejsce dla rysunku
   i dla formatek — inaczej lista mowi swoje, a rysunek swoje.

   Dwie rzeczy nie koncza sie na licu korpusu, tylko wchodza w glab szafki
   naroznej az do katownika w tylnym narozniku: plecy i tylne wzmocnienie.
   Bez tego wisialy w powietrzu nad przejsciem, a wzdluz drugiej sciany
   zostawal goly kawalek. */
const armPlan = (a, lokalnie) => {
  const geo = a.cab.geo;
  const cab = a.cab.cab;
  const t = geo.t;
  const tf = geo.tf;
  /* Plecy ramienia moga byc pelna plyta zamiast HDF — wtedy trzymaja rog same
     i stojace wzmocnienie przy nich jest juz niepotrzebne. */
  const plytaRamienia = !!(cab.corner || {}).on && !!(cab.corner || {}).backBoard;
  const maPlecy = cab.back !== "none" || plytaRamienia;
  const tb = !maPlecy ? 0 : plytaRamienia ? t : geo.tb || t;
  const pOd = Math.max(geo.backIntrusion, cab.back !== "none" ? geo.tb : 0);
  const tyl = geo.postSide
    ? Math.max(0, Math.round(geo.carcassDepth - pOd - geo.postW)) : 0;
  /* Plecy koncza sie na katowniku, ale wzmocnienie idzie dalej: nachodzi na jego
     ramie i tam sie z nim skreca. Wolna czesc tego ramienia to jego dlugosc bez
     dwoch grubosci plyty — drugiego ramienia katownika i wzmocnienia korpusu,
     ktore stoi przy tej samej scianie. */
  const tylWzm = geo.postSide
    ? tyl + Math.max(0, Math.round(geo.postW - 2 * t)) : 0;
  // ramie zamyka bok na wolnym koncu — plyty poziome dochodza do jego lica
  const u1 = Math.max(0, Math.round(a.len - t));
  const surowe = (((cab.levels || []).slice(-1)[0] || {}).cols || [])
    .flatMap((c) => c.rails || []);
  /* Wzmocnienia ramienia to osobne plyty, wiec ich szerokosc moze byc inna niz
     w korpusie — polozenie zostaje wspolne, bo obie plyty musza sie spotkac.
     Puste ustawienie znaczy „tak jak w szafce". */
  const szerRam = (cab.corner || {}).railW || {};
  const nadpis = (r) => {
    const v = Number(szerRam[r.fromBack ? "tyl" : "przod"]);
    return v > 0 ? Math.round(v) : null;
  };
  const rails = geo.hasTop ? [] : surowe
    .filter((r) => !(plytaRamienia && r.orient === "front" && r.fromBack))
    .map((r) => {
    const szer = nadpis(r)
      ?? Math.max(0, Math.round(r.orient === "front" ? Number(r.h) || 0 : Number(r.depth) || 0));
    const gr = Math.max(0, Math.round(r.orient === "front" ? t : szer));
    const at = Math.max(0, Math.round(Number(r.atDepth) || 0));
    /* Przy plecach katownik jest cofniety o ich grubosc, wiec wzmocnienie
       ramienia zaczyna sie dopiero za jego ramieniem. */
    const zaKat = geo.postSide ? geo.postBack + t : 0;
    const v0 = r.fromBack ? Math.max(at, zaKat) : Math.max(0, a.depth - at - gr);
    /* Wzmocnienie czolowe ramienia dobija do tylnej krawedzi tego samego
       wzmocnienia w korpusie — czyli wchodzi w szafke o jego cofniecie plus
       szerokosc. Dopiero wtedy obie plyty stykaja sie cala szerokoscia i da sie
       je skrecic; skrocone do lica mijaly sie o grubosc frontu. */
    return { u0: r.fromBack ? -tylWzm : -(at + gr), u1, v0, v1: v0 + gr, wys: szer,
      // stojace = plyta na sztorc (liczy sie wysokosc), przyTyle = ktora to z pary
      stojace: r.orient === "front", przyTyle: !!r.fromBack, wlasna: nadpis(r) != null };
  });
  /* Plecy ida dalej niz wzmocnienie: nachodza na katownik w narozniku i konczą
     sie dopiero na tylnej plaszczyznie szafki. Przybija sie je do niego tak samo
     jak do bokow, wiec nie ma powodu urywac ich na jego czole. */
  const tylPlecy = geo.postSide ? Math.max(0, Math.round(geo.carcassDepth - pOd)) : tyl;
  const back = maPlecy
    ? { u0: -tylPlecy, u1: a.len, v0: 0, v1: tb, plyta: plytaRamienia } : null;
  /* Tak samo jak katownik: w ukladzie ciagu rog wypada raz na poczatku, raz na
     koncu ramienia, a rysunek samej szafki liczy zawsze od jej lica. */
  const odbij = (r) => (lokalnie || a.outerAtEnd
    ? r : { ...r, u0: a.len - r.u1, u1: a.len - r.u0 });
  return { tyl, u1, tb, rails: rails.map(odbij), back: back && odbij(back) };
};

/* Glebokosc ciagu liczona od sciany do lica — szafki wyrownujemy do lica, wiec
   od sciany odsuwa nas najglebsza z nich, a wysuniete jeszcze bardziej.
   Pusty ciag za rogiem glebokosci jeszcze nie ma z czego wziac, wiec bierze ja
   z wlasnego ustawienia — to od niej zalezy szerokosc frontu szafki naroznej. */
const runFrontDepth = (g) =>
  g.cabs.length
    ? Math.max(...g.cabs.map((c) => c.geo.carcassDepth - c.offset))
    : Math.max(0, Math.round(Number(g.run.D) || 0));

/* Ciag bez szafek zwykle nie ma czego pokazac, ale ten za rogiem owszem: w jego
   pasie lezy ramie szafki naroznej, a jego glebokosc wyznacza szerokosc frontu
   w rogu. Dlatego pusty ciag zostaje na rysunku, jesli laczy go z czyms narożnik. */
const runInCorner = (runs, r) =>
  !!(r.corner && r.corner.of) || runs.some((o) => o.corner && o.corner.of === r.id);
const drawableRuns = (project) => {
  const runs = project.runs || [];
  return runs.filter((r) => runItems(project, r.id).length || runInCorner(runs, r));
};

// odstep miedzy scianami w rozwinieciu elewacji — tyle, zeby rog byl widoczny
const WALL_SEP = 260;

/* Rozmieszczenie ciagow w rzucie i w rozwinietej elewacji. Ciag bez naroznika
   lezy wzdluz osi X: sciana na y = 0, front w strone +y. Naroznik obraca ciag
   o 90 stopni tak, zeby sciana zostala po tej samej rece — dlatego kolejne
   narozniki skladaja sie same w L, U i G i nie ma tu osobnego pola „ksztalt".

   `lead` to odcinek przed pierwsza szafka, `tail` za ostatnia. W rogu dwa ciagi
   zawsze na siebie wchodza: ten, ktory w rog wjezdza, jedzie do konca, a drugi
   musi sie odsunac o jego glebokosc.

   `ref` to rozmieszczenie calego projektu. Przy zakresie „ciag" drugiego ciagu
   nie ma na rysunku, wiec rog nie ma sie z czego policzyc — a odsuniecie i tak
   obowiazuje, bo w tej luce lezy ramie szafki naroznej. Wtedy bierzemy `lead`
   i `tail` z calosci, zeby ramie wypadlo dokladnie tam, gdzie stoi naprawde. */
const runLayout = (groups, ref = null) => {
  const info = new Map();
  groups.forEach((g) => info.set(g.run.id, {
    g, id: g.run.id, run: g.run, depth: runFrontDepth(g), total: g.total,
    // szafka wysunieta z lica wystaje poza lico ciagu — rysunek musi ja objac
    front: Math.max(0, ...g.cabs.map((c) => c.offset)),
    /* Odsuniecie ciagu w obrebie sciany wchodzi od razu w `lead` albo `tail` —
       dalej liczy sie samo, bo cala geometria pasa idzie od tych dwoch liczb. */
    lead: g.run.offsetFrom === "right" ? 0 : Math.max(0, Math.round(g.run.offset || 0)),
    tail: g.run.offsetFrom === "right" ? Math.max(0, Math.round(g.run.offset || 0)) : 0,
    corner: null, kids: [], zones: [], arms: [], blind: null, arm: null, pair: null,
  }));
  info.forEach((n) => {
    const c = n.run.corner;
    // narożnik do ciagu, ktorego na rysunku nie ma, po prostu nie dziala
    if (!c || c.of === n.id || !info.has(c.of)) return;
    n.corner = c;
    n.parent = info.get(c.of);
    n.parent.kids.push(n);
  });
  info.forEach((n) => {
    if (!n.corner) return;
    const p = info.get(n.corner.of);
    const wchodzi = n.corner.owner === "self" ? n : p;   // ten jedzie do naroza
    const ustepuje = wchodzi === n ? p : n;              // ten sie odsuwa
    // przy ktorym koncu ciagu wjezdzajacego w rog wypada narożnik
    const przyStarcie = (n.corner.at === "end") === (wchodzi === n);
    const rogowa = wchodzi.g.cabs[przyStarcie ? 0 : wchodzi.g.cabs.length - 1];
    /* Szafka narozna w L wychodzi ramieniem na sasiednia sciane, wiec drugi
       ciag musi sie odsunac nie tylko o glebokosc, ale i o dlugosc ramienia. */
    const kor = rogowa && rogowa.cab.corner;
    const armLen = kor && kor.on ? Math.max(0, Math.round(kor.arm || 0)) : 0;
    /* Rog zjada tyle, ile ma glebokosci szafka, ktora w nim faktycznie stoi —
       nie caly ciag. Plytsza szafka w rogu odsuwa sasiada mniej, glebsza
       wiecej; branie glebokosci ciagu myliloby sie w obie strony. */
    const glRog = rogowa ? Math.round(rogowa.geo.carcassDepth - rogowa.offset) : wchodzi.depth;
    n.pair = { wchodzi, ustepuje, przyStarcie, rogowa, armLen, glRog };
    const o = glRog + armLen + (n.corner.clear || 0);
    // odsuwamy z tej strony ciagu, ktora dotyka rogu
    if (n.corner.at === "end") { if (ustepuje === n) n.lead += o; else p.tail += o; }
    else if (ustepuje === n) n.tail += o; else p.lead += o;
  });
  /* Ciag, ktorego partner z rogu nie jest rysowany, nie policzyl sobie wyzej
     odsuniecia — bierze je z calosci, razem z ta sama luka na ramie. */
  if (ref) info.forEach((n) => {
    if (n.pair || n.corner) return;
    const rn = ref.info.get(n.id);
    if (!rn) return;
    n.lead = rn.lead;
    n.tail = rn.tail;
  });
  info.forEach((n) => { n.len = n.lead + n.total + n.tail; });

  /* Slepy narożnik. Ciag, ktory wjezdza w rog, konczy sie szafka stojaca za
     plecami drugiego ciagu: tyle jej frontu, ile ma glebokosci ten drugi ciag,
     jest po prostu zaslonione i nie da sie tamtedy siegnac. Dlatego szafki
     narozne robi sie szersze — zostaje wtedy kawalek frontu na drzwi — albo
     dokłada sie ramie i robi z nich jedna szafke w L. */
  info.forEach((n) => {
    if (!n.pair) return;
    const { wchodzi: w, ustepuje: other, przyStarcie, rogowa: c, armLen, glRog } = n.pair;
    if (!c) return;
    const covered = Math.min(c.geo.W, other.depth);
    const free = c.geo.W - covered;
    const u0 = przyStarcie ? w.lead : w.lead + w.total - covered;
    const z = { cab: c, covered, free, run: w, other, u0, u1: u0 + covered,
      freeU0: przyStarcie ? u0 + covered : u0 - free };
    if (!armLen) { n.blind = z; w.zones.push(z); return; }
    /* Ramie rysuje sie i mierzy w ukladzie tego ciagu, ktory sie odsunal —
       lezy dokladnie w luce miedzy rogiem a jego pierwsza szafka. */
    const a0 = przyStarcie ? other.len - glRog - armLen : glRog;
    /* Front korpusu i front ramienia spotykaja sie w rogu pod katem prostym.
       Lico ramienia lezy o grubosc frontu przed jego korpusem (przy froncie
       nakladanym), wiec front korpusu ma do dyspozycji o tyle mniej — liczony
       po staremu do samej glebokosci sasiada nachodzil na tamten front. */
    const licoRamienia = other.depth
      + (c.cab.frontMode === "inset" ? 0 : c.geo.tf);
    const arm = { cab: c, len: armLen, depth: other.depth, run: w, other,
      u0: a0, free: Math.max(0, Math.round(c.geo.W - licoRamienia)),
      outerAtEnd: !przyStarcie,
      // z ktorej strony korpusu wychodzi ramie — po tej stronie nie ma juz frontu
      side: przyStarcie ? "left" : "right",
      doors: (c.cab.corner || {}).doors || "wsporniki" };
    /* Katownik zjada kawalek lica po obu stronach rogu: oba skrzydla domykaja
       sie do niego, kazde do swojego ramienia i kazde z luzem. Zostaje z tego
       `front` na drzwi korpusu i `armFront` na front ramienia. */
    arm.bracket = arm.doors === "wsporniki" ? cornerBracket(arm) : null;
    arm.front = Math.max(0, Math.round(arm.free - (arm.bracket ? arm.bracket.odKorpusu : 0)));
    arm.armFront = Math.max(0, Math.round(armLen - (arm.bracket ? arm.bracket.odRamienia : 0)));
    n.arm = arm;
    other.arms.push(n.arm);
  });

  /* Blat w narozniku. Nad rogiem plaszczyzny obu ciagow na siebie wchodza,
     wiec albo jeden blat przechodzi przez rog, a drugi dojezdza do jego boku,
     albo oba tnie sie na 45 stopni (lyzwa) i spotykaja sie po przekatnej.
     `s` i `e` to poczatek i koniec blatu na osi ciagu — moga wyjsc poza szafki
     (blat idzie nad rogiem) albo przed nie (rog zabral go sasiad). */
  info.forEach((n) => {
    n.top = { s: n.lead, e: n.lead + n.total, skosS: false, skosE: false, corS: false, corE: false };
  });
  info.forEach((n) => {
    if (!n.pair) return;
    const p = n.parent;
    const c = n.corner;
    const przez = c.top === "self" ? n : c.top === "of" ? p : n.pair.wchodzi;
    const skos = c.cut === "skos";
    const ust = (r, atStart) => {
      // na lyzwe oba kawalki dochodza do rogu, na styk tylko ten przechodzacy
      const d = skos || r === przez ? 0 : przez.depth;
      if (atStart) { r.top.s = d; r.top.skosS = skos; r.top.corS = true; }
      else { r.top.e = r.len - d; r.top.skosE = skos; r.top.corE = true; }
    };
    ust(n, c.at === "end");
    ust(p, c.at !== "end");
  });
  // ten sam odcinek, ale liczony od lewej krawedzi pierwszej szafki ciagu
  info.forEach((n) => {
    n.topSpan = { x0: n.top.s - n.lead, x1: n.top.e - n.lead,
      skos0: n.top.skosS, skos1: n.top.skosE, cor0: n.top.corS, cor1: n.top.corE };
  });

  /* Ramka ciagu: punkt (u, v) — u wzdluz sciany od poczatku ciagu, v w glab
     pokoju od sciany — trafia na (ox + ux·u + vx·v, oy + uy·u + vy·v). */
  const at = (f, u, v) => ({ x: f.ox + f.ux * u + f.vx * v, y: f.oy + f.uy * u + f.vy * v });
  const seen = new Set();
  const put = (n, f, wall) => {
    if (seen.has(n.id)) return;
    seen.add(n.id);
    n.f = f;
    n.wall = wall;
    n.at = (u, v) => at(f, u, v);
    n.kids.forEach((k) => {
      if (k.corner.at === "end") {
        // rog na koncu rodzica: dziecko rusza z rogu i skreca w strone pokoju
        const o = at(f, n.len, 0);
        put(k, { ox: o.x, oy: o.y, ux: -f.uy, uy: f.ux, vx: -f.vy, vy: f.vx }, wall + 1);
      } else {
        // rog na poczatku rodzica: dziecko konczy sie w rogu, wiec cofamy o jego dlugosc
        const o = at(f, 0, 0);
        const ux = f.uy, uy = -f.ux;
        put(k, { ox: o.x - ux * k.len, oy: o.y - uy * k.len, ux, uy, vx: f.vy, vy: -f.vx }, wall - 1);
      }
    });
  };
  const base = { ox: 0, oy: 0, ux: 1, uy: 0, vx: 0, vy: 1 };
  [...info.values()].filter((n) => !n.corner).forEach((n) => put(n, base, 0));
  // ciag ocalaly z zapetlonego naroznika i tak trzeba gdzies postawic
  info.forEach((n) => put(n, base, 0));

  /* Rozwiniecie elewacji: kazda sciana dostaje swoj pas, ciag gorny i dolny tej
     samej sciany trafiaja na siebie, bo maja ten sam numer sciany. */
  const wallLen = new Map();
  info.forEach((n) => wallLen.set(n.wall, Math.max(wallLen.get(n.wall) || 0, n.len)));
  const keys = [...wallLen.keys()].sort((a, b) => a - b);
  let ex = 0;
  const exOf = new Map();
  keys.forEach((k, i) => {
    exOf.set(k, ex);
    ex += wallLen.get(k) + (i < keys.length - 1 ? WALL_SEP : 0);
  });
  info.forEach((n) => { n.ex = exOf.get(n.wall); });

  const pts = [...info.values()].flatMap((n) =>
    [[0, 0], [n.len, 0], [0, n.depth + n.front], [n.len, n.depth + n.front]]
      .map(([u, v]) => n.at(u, v)));
  return {
    info,
    corners: [...info.values()].some((n) => n.corner),
    walls: keys.map((k) => ({ wall: k, ex: exOf.get(k), len: wallLen.get(k) })),
    elevTotal: ex,
    box: { x0: Math.min(...pts.map((p) => p.x)), x1: Math.max(...pts.map((p) => p.x)),
      y0: Math.min(...pts.map((p) => p.y)), y1: Math.max(...pts.map((p) => p.y)) },
  };
};

/* Jedna szafka w elewacji ciagu. Rysuje sie tak samo jak w widoku pojedynczej
   szafki — z bokami, nozkami, uchwytami, zawiasami i wnetrzem — bo inaczej ciag
   pokazywalby uproszczenie, na ktorym nie da sie niczego sprawdzic. Uklad
   wspolrzednych jest lokalny (0,0 = lewy gorny rog korpusu); na miejsce
   przesuwa go transform w AssemblyView. */
function CabElevation({ cab, geo, mat, open, showDims, showHardware, showLabels, frontColor, rear, levelDims }) {
  const H = cab.H;
  const W = geo.W;
  const t = geo.t;
  const fy = (y) => H - y;
  const bf = mat.board.color;
  const ff = frontColor;
  const shc = shelfColorOf(cab, mat);
  const mx = (x, w) => (rear ? W - x - w : x); // od tylu wszystko w lustrze
  const side = (key, x, y, h, topCap, botCap) => (
    <g key={key}>
      <rect x={x} y={y} width={t} height={h} fill={bf} />
      <line x1={x} y1={y} x2={x} y2={y + h} stroke={INK} strokeWidth="2" />
      <line x1={x + t} y1={y} x2={x + t} y2={y + h} stroke={INK} strokeWidth="2" />
      {topCap && <line x1={x} y1={y} x2={x + t} y2={y} stroke={INK} strokeWidth="2" />}
      {botCap && <line x1={x} y1={y + h} x2={x + t} y2={y + h} stroke={INK} strokeWidth="2" />}
    </g>
  );
  return (
    <g>
      <rect x="0" y="0" width={W} height={H} fill="#fafaf9" stroke="#e7e5e4" strokeWidth="1" />

      {/* boki, wieniec, dno. Od strony ramienia boku nie ma — korpus przechodzi
          w ramie, a rog trzyma katownik stojacy 150 mm od plecow, wiec od czola
          go nie widac. */}
      {geo.postSide !== "left" && side("l", mx(0, t), fy(geo.leftY0 + geo.leftLen), geo.leftLen,
        geo.topL === "between", geo.botL === "between")}
      {geo.postSide !== "right" && side("r", mx(W - t, t), fy(geo.rightY0 + geo.rightLen), geo.rightLen,
        geo.topR === "between", geo.botR === "between")}
      {geo.hasTop && (
        <rect x={mx(geo.topX0, geo.topX1 - geo.topX0)} y={fy(H)} width={geo.topX1 - geo.topX0} height={t}
          fill={bf} stroke={INK} strokeWidth="2" strokeLinejoin="miter" />
      )}
      {geo.hasBot && (
        <rect x={mx(geo.botX0, geo.botX1 - geo.botX0)} y={fy(geo.bottomY + t)} width={geo.botX1 - geo.botX0} height={t}
          fill={bf} stroke={INK} strokeWidth="2" strokeLinejoin="miter" />
      )}
      {geo.plinthInBody && (
        <rect x={mx(geo.interior.x0, geo.innerW)} y={fy(geo.plinthH)} width={geo.innerW} height={geo.plinthH}
          fill={bf} stroke={INK} strokeWidth="2" />
      )}
      {cab.topFiller?.on && cab.topFiller.height > 0 && (
        <rect x="0" y={-cab.topFiller.height} width={W} height={cab.topFiller.height}
          fill={bf} stroke={INK} strokeWidth="2" opacity="0.75" />
      )}
      {cab.legs?.on && (
        <>
          <rect x={40} y={H - geo.legTop} width={40} height={geo.legH}
            rx={legRound(cab) ? 20 : 0} fill={legColorOf(cab)} stroke={INK} strokeWidth="2"
            opacity={geo.legTop > 0 ? 0.5 : 1} />
          <rect x={W - 80} y={H - geo.legTop} width={40} height={geo.legH}
            rx={legRound(cab) ? 20 : 0} fill={legColorOf(cab)} stroke={INK} strokeWidth="2"
            opacity={geo.legTop > 0 ? 0.5 : 1} />
        </>
      )}

      {/* plecy widac tylko od tylu */}
      {rear && cab.back !== "none" && (
        <rect x={t / 2} y={fy(H - t / 2)} width={W - t} height={H - t}
          fill={mat.back.color} stroke={INK} strokeWidth="2" opacity="0.9" />
      )}

      {/* elementy wzmacniajace */}
      {!rear && geo.levels.flatMap((lv) => lv.cols.flatMap((c) => (c.rails || []).map((r, ri) => (
        <rect key={`rail${lv.i}-${c.j}-${ri}`}
          x={mx(r.x0, r.x1 - r.x0)} y={fy(r.y1)} width={r.x1 - r.x0} height={r.y1 - r.y0}
          fill={r.orient === "vertical" ? shc : bf}
          stroke={INK} strokeWidth="2" opacity={r.orient === "front" ? 0.9 : 0.7} />
      ))))}

      {/* polki przelotowe, przegrody i polki w kolumnach */}
      {!rear && geo.sepShelves.map((s, i) => (
        <rect key={"sep" + i} x={mx(geo.interior.x0, geo.innerW)} y={fy(s.y + t)} width={geo.innerW} height={t}
          fill={bf} stroke={INK} strokeWidth="2" />
      ))}
      {!rear && geo.dividers.map((d, i) => (
        <rect key={"div" + i} x={mx(d.x, t)} y={fy(d.y1)} width={t} height={d.h}
          fill={bf} stroke={INK} strokeWidth="2" />
      ))}
      {!rear && geo.levels.flatMap((lv) => lv.cols.flatMap((c) =>
        (c.shelves || []).map((s, k) => (
          <rect key={`s${lv.i}-${c.j}-${k}`} x={mx(c.x0, c.w)} y={fy(s.y + geo.ts)} width={c.w} height={geo.ts}
            fill={shc} stroke={INK} strokeWidth="2" />
        ))
      ))}

      {/* kolki pod polki */}
      {open && showHardware && !rear && cab.shelfMount !== "confirmat" &&
        geo.levels.flatMap((lv) => lv.cols.flatMap((c) =>
          (c.shelves || []).map((s, k) => (
            <g key={`pin${lv.i}-${c.j}-${k}`}>
              <circle cx={mx(c.x0 + 7, 0)} cy={fy(s.y)} r="5" fill="#71717a" stroke={INK} strokeWidth="1.2" />
              <circle cx={mx(c.x1 - 7, 0)} cy={fy(s.y)} r="5" fill="#71717a" stroke={INK} strokeWidth="1.2" />
            </g>
          ))
        ))}

      {/* prowadnice szuflad — po jednej przy kazdym boku kolumny */}
      {open && showHardware && !rear &&
        geo.levels.flatMap((lv) =>
          lv.cols
            .filter((c) => c.kind === "drawers" && (c.drawers || []).length)
            .flatMap((c) =>
              c.drawers.flatMap((dr) =>
                [c.x0, c.x1 - RUNNER_W].map((rx, si) => (
                  <rect key={`rn${lv.i}-${c.j}-${dr.i}-${si}`}
                    x={mx(rx, RUNNER_W)} y={fy(dr.rail.y0 + dr.rail.h)} width={RUNNER_W} height={dr.rail.h}
                    fill="#8b8b93" stroke={INK} strokeWidth="1.5" />
                ))
              )
            )
        )}

      {/* fronty */}
      {!rear && geo.doors.filter((d) => d.w > 0 && d.h > 0).map((d) => {
        const X = mx(d.x, d.w);
        const hinge = rear ? (d.hingeSide === "left" ? "right" : "left") : d.hingeSide;
        if (d.type === "fix" || d.type === "blenda")
          return (
            <g key={d.key}>
              <rect x={X} y={fy(d.y + d.h)} width={d.w} height={d.h} fill={ff} stroke={INK} strokeWidth="2.5" />
              {d.type === "fix" && (
                <>
                  <line x1={X} y1={fy(d.y + d.h)} x2={X + d.w} y2={fy(d.y)} stroke={INK} strokeWidth="1.5" opacity="0.4" />
                  <line x1={X} y1={fy(d.y)} x2={X + d.w} y2={fy(d.y + d.h)} stroke={INK} strokeWidth="1.5" opacity="0.4" />
                </>
              )}
              {d.type === "blenda" && d.w > 120 && (
                <text x={X + d.w / 2} y={fy(d.y + d.h / 2) - 20} textAnchor="middle"
                  fontSize="20" fill={INK} opacity="0.55" fontFamily="ui-monospace, monospace">blenda</text>
              )}
            </g>
          );
        if (open)
          return d.type === "drawer" ? (
            <g key={d.key}>
              {/* front szuflady zostaje na miejscu, tylko przygaszony */}
              <rect x={X} y={fy(d.y + d.h)} width={d.w} height={d.h}
                fill={ff} fillOpacity="0.35" stroke={INK} strokeWidth="2" />
              <line x1={X + d.w * 0.25} x2={X + d.w * 0.75}
                y1={fy(d.y + d.h - Math.min(50, d.h / 2))} y2={fy(d.y + d.h - Math.min(50, d.h / 2))}
                stroke={INK} strokeWidth="5" opacity="0.5" />
            </g>
          ) : (
            <g key={d.key}>
              <rect x={X} y={fy(d.y + d.h)} width={d.w} height={d.h}
                fill="none" stroke={LINE} strokeWidth="1.5" strokeDasharray="12 9" opacity="0.6" />
              <path d={`M ${hinge === "left" ? X + d.w : X} ${fy(d.y + d.h)}
                        L ${hinge === "left" ? X : X + d.w} ${fy(d.y + d.h / 2)}
                        L ${hinge === "left" ? X + d.w : X} ${fy(d.y)}`}
                fill="none" stroke={INK} strokeWidth="1.8" opacity="0.5" />
              <rect x={hinge === "right" ? X + d.w - geo.tf : X} y={fy(d.y + d.h)}
                width={geo.tf} height={d.h} fill={ff} stroke={INK} strokeWidth="2" />
              {showHardware && (d.hingePts || []).map((hy, hi2) => (
                <rect key={`hg${hi2}`} x={mx(d.hingeX, HINGE_W)} y={fy(hy + HINGE_H / 2)}
                  width={HINGE_W} height={HINGE_H} rx="3" fill="#71717a" stroke={INK} strokeWidth="1.5" />
              ))}
            </g>
          );
        return (
          <g key={d.key}>
            <rect x={X} y={fy(d.y + d.h)} width={d.w} height={d.h} fill={ff} stroke={INK} strokeWidth="2.5" />
            {d.type === "drawer" && !d.handle && (
              <line x1={X + d.w * 0.3} x2={X + d.w * 0.7}
                y1={fy(d.y + d.h * 0.78)} y2={fy(d.y + d.h * 0.78)}
                stroke={INK} strokeWidth="4" opacity="0.45" />
            )}
            {d.handle && d.w > 60 && d.h > 30 && (
              <rect
                x={d.type === "drawer" ? X + d.w / 2 - 60 : hinge === "left" ? X + d.w - 45 : X + 30}
                y={d.type === "drawer"
                  ? fy(d.y + d.h - Math.min(50, d.h / 2)) - 5
                  : fy(d.y + d.h * 0.5) - 60}
                width={d.type === "drawer" ? 120 : 15}
                height={d.type === "drawer" ? 10 : 120}
                rx="5" fill="#52525b" opacity="0.9" />
            )}
            {d.mirror && d.w > 2 && d.h > 2 && (
              <rect x={X + 0.5} y={fy(d.y + d.h) + 0.5} width={d.w - 1} height={d.h - 1}
                fill={mat.mirror.color} stroke={INK} strokeWidth="1" opacity="0.85" />
            )}
            {showDims && d.w > 90 && d.h > 40 && (
              <text x={X + d.w / 2}
                y={d.type === "drawer" ? fy(d.y + d.h * 0.3) : fy(d.y + d.h / 2) + 7}
                textAnchor="middle" fontSize="20" fill={INK} opacity="0.75"
                fontFamily="ui-monospace, monospace">{fmt(d.w)}×{fmt(d.h)}</text>
            )}
          </g>
        );
      })}

      {/* wyciecia w narozniku i elementy kolizyjne — w elewacji widac ich obrys */}
      {geo.geoCuts.map((gc, ci) => (
        <rect key={"cut" + ci} x={mx(gc.bx0, gc.bx1 - gc.bx0)} y={fy(gc.cy1)}
          width={gc.bx1 - gc.bx0} height={gc.cy1 - gc.cy0}
          fill={ERRC} opacity="0.15" stroke={ERRC} strokeWidth="1.5" strokeDasharray="6 4" />
      ))}
      {(geo.geoObs || []).map((go, oi) => (
        <g key={"ob" + oi}>
          <rect x={mx(go.ox0, go.ox1 - go.ox0)} y={fy(go.oy1)}
            width={go.ox1 - go.ox0} height={go.oy1 - go.oy0}
            fill={WARNC} opacity="0.18" stroke={WARNC} strokeWidth="1.5" strokeDasharray="6 4" />
          {go.name && go.ox1 - go.ox0 > 120 && go.oy1 - go.oy0 > 60 && (
            <text x={mx(go.ox0, go.ox1 - go.ox0) + (go.ox1 - go.ox0) / 2}
              y={fy((go.oy0 + go.oy1) / 2) + 6} textAnchor="middle"
              fontSize="18" fill={WARNC} fontFamily="ui-monospace, monospace">{go.name}</text>
          )}
        </g>
      ))}

      /* Swiatla poziomow i polek rysujemy tylko dla szafki wybranej na pasku —
         przy kilku szafkach obok siebie lancuchy wymiarowe przy kazdej krawedzi
         zlalyby sie w gaszcz. Liczy je ten sam geo.openings, co widok
         pojedynczej szafki, wiec wartosci sa identyczne. */
      {levelDims && !rear && geo.levels.flatMap((lv) =>
        lv.cols
          .filter((c) => c.kind !== "drawers" && c.kind !== "blenda")
          .flatMap((c) => (c.openings || [])
            .filter((op) => op.h > 30 && !(c.openings.length === 1 && Math.round(op.h) === Math.round(lv.h)))
            .map((op) => (
              <DimV key={`op${lv.i}-${c.j}-${op.k}`} y1={fy(op.to)} y2={fy(op.from)}
                x={c.x0 + 46} label={fmt(op.h)} left={false} c={DIMC} />
            ))
          )
      )}
      {/* wysokosc calego poziomu przy lewej krawedzi — jak w widoku szafki */}
      {levelDims && !rear && geo.levels.map((lv) => (
        <DimV key={"lvh" + lv.i} y1={fy(lv.y1)} y2={fy(lv.y0)} x={-46}
          label={fmt(lv.h)} c={DIMC} />
      ))}

      {/* korpus jeszcze raz na wierzchu — otwarte skrzydla nie moga zaslaniac bokow */}
      {open && !rear && (
        <g>
          {side("l2", mx(0, t), fy(geo.leftY0 + geo.leftLen), geo.leftLen,
            geo.topL === "between", geo.botL === "between")}
          {side("r2", mx(W - t, t), fy(geo.rightY0 + geo.rightLen), geo.rightLen,
            geo.topR === "between", geo.botR === "between")}
          {geo.hasTop && (
            <rect x={mx(geo.topX0, geo.topX1 - geo.topX0)} y={fy(H)} width={geo.topX1 - geo.topX0} height={t}
              fill={bf} stroke={INK} strokeWidth="2" strokeLinejoin="miter" />
          )}
          {geo.hasBot && (
            <rect x={mx(geo.botX0, geo.botX1 - geo.botX0)} y={fy(geo.bottomY + t)} width={geo.botX1 - geo.botX0} height={t}
              fill={bf} stroke={INK} strokeWidth="2" strokeLinejoin="miter" />
          )}
        </g>
      )}
    </g>
  );
}

/* Jedna szafka w rzucie z gory ciagu — z bokami, przegrodami, frontami,
   maskownicami, prowadnicami, plecami i wycieciami, czyli tym samym, co
   pokazuje rzut pojedynczej szafki. Uklad lokalny: x = szerokosc, y = glebokosc
   liczona od sciany (y = 0 to tyl korpusu). */
/* Zabudowa wyciecia i bryly kolizyjnej w rzucie z gory. Te same scianki ida na
   formatki, wiec musza byc widoczne i przy pojedynczej szafce, i w rzucie ciagu
   czy calej zabudowy — dlatego rysunek siedzi w jednym miejscu. */
const CutMaskTop = ({ gc, t, color }) => {
  if (!gc.mask) return null;
  const rx = gc.bx0, ry = gc.bz0;
  const rw = gc.bx1 - gc.bx0, rh = gc.bz1 - gc.bz0;
  const vVisible = gc.maskVisible === "vertical";
  // scianki NA ZEWNATRZ otworu; czolo dochodzi do lica boku
  const sideFace = gc.onLeft ? rx + t : rx + rw - t;
  const vx = gc.onLeft ? rx + rw : rx - t;
  const hy = gc.onBack ? ry + rh : ry - t;
  const vy = vVisible ? (gc.onBack ? ry : ry - t) : ry;
  const vh = vVisible ? rh + t : rh;
  const hx0 = gc.onLeft ? sideFace : (vVisible ? rx : rx - t);
  const hx1 = gc.onLeft ? (vVisible ? rx + rw : rx + rw + t) : sideFace;
  const hx = Math.min(hx0, hx1);
  const hw = Math.abs(hx1 - hx0);
  return (
    <>
      <rect x={vx} y={vy} width={t} height={vh} fill={color} stroke={INK} strokeWidth="2" />
      <rect x={hx} y={hy} width={hw} height={t} fill={color} stroke={INK} strokeWidth="2" />
    </>
  );
};

const ObsMaskTop = ({ o, t, W, color }) => {
  if (!o.mask || !o.maskChosen) return null;
  const rx = o.ox0, ry = o.oz0, rw = o.ow, rh = o.od;
  const needL = !o.touchLeft, needR = !o.touchRight;
  const needBack = !o.touchBack, needFront = !o.touchFront;
  const vVisible = o.maskVisible === "vertical";
  const isU = o.maskChosen === "U";
  const frontBetween = o.maskFront === "between";
  // czolo konczy sie na licu boku, gdy bryla dotyka boku
  const hx0 = o.touchLeft ? (o.boundL ?? t)
    : isU ? (frontBetween ? rx : rx - t)
    : (needL && !vVisible ? rx - t : rx);
  const hx1 = o.touchRight ? (o.boundR ?? W - t)
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
      fill={color} stroke={INK} strokeWidth="2" />
  ));
};

function CabTop({ cab, geo, mat, showShelves, showHardware, ghost, arm }) {
  const W = geo.W;
  const t = geo.t;
  const cd = geo.carcassDepth;
  const bf = mat.board.color;
  const shc = shelfColorOf(cab, mat);
  const ffc = cab.realColors && cab.frontSameAsBoard !== false ? mat.board.color : mat.front.color;
  const cols = geo.levels[0]?.cols || [];
  return (
    <g>
      {/* ciag wyzszy idzie przerywana linia, jak szafki gorne na planie kuchni */}
      <rect x="0" y="0" width={W} height={cd} fill="#fafaf9" stroke={LINE} strokeWidth="1.5"
        strokeDasharray={ghost ? "14 9" : undefined} />

      {/* boki — skrocone przy narozniku z wycieciem. Od strony ramienia boku nie
          ma: korpus przechodzi w ramie, a rog trzyma katownik. */}
      {geo.postSide !== "left" && (
        <rect x="0" y={geo.cornerCut?.sideLeftDepth || 0} width={t}
          height={cd - (geo.cornerCut?.sideLeftDepth || 0)} fill={bf} stroke={INK} strokeWidth="2"
          strokeDasharray={ghost ? "14 9" : undefined} />
      )}
      {geo.postSide !== "right" && (
        <rect x={W - t} y={geo.cornerCut?.sideRightDepth || 0} width={t}
          height={cd - (geo.cornerCut?.sideRightDepth || 0)} fill={bf} stroke={INK} strokeWidth="2"
          strokeDasharray={ghost ? "14 9" : undefined} />
      )}
      {/* katownik w zewnetrznym narozniku: plyta w plaszczyznie boku i druga
          w plaszczyznie plecow, skrecone pod katem prostym */}
      {geo.postSide && (() => {
        const pw = geo.postW;
        /* Katownik chowa sie za plecami z obu stron: `pOd` odsuwa go od tylnej
           plaszczyzny, `pBok` od bocznej. Plecy przybija sie na niego, a
           wzmocnienia dolegaja do jego wewnetrznego lica i tam sie skreca. */
        const pOd = Math.max(geo.backIntrusion, geo.postBack);
        const pBok = geo.postBack;
        const px = geo.postSide === "right" ? W - t - pBok : pBok;
        // obie plyty maja te sama formatke, wiec druga zaczyna sie za grubosc pierwszej
        const bx = geo.postSide === "right" ? W - t - pBok - pw : t + pBok;
        return (
          <g>
            {/* w rzucie z gory tyl jest u gory (y = 0), wiec katownik siedzi
                przy zerze, a nie przy licu */}
            <rect x={px} y={pOd} width={t} height={pw}
              fill={shc} stroke={INK} strokeWidth="2" />
            <rect x={bx} y={pOd} width={pw} height={t}
              fill={shc} stroke={INK} strokeWidth="2" />
          </g>
        );
      })()}

      {/* wieniec albo blat widoczny z gory */}
      {geo.hasTop && (
        <rect x={geo.topX0} y={geo.isBlat ? -geo.blat.overBack : 0}
          width={geo.topX1 - geo.topX0} height={geo.isBlat ? geo.blatDepth : cd}
          fill={bf} stroke={INK} strokeWidth={geo.isBlat ? 2 : 1}
          opacity={geo.isBlat ? 0.45 : 0.25} />
      )}

      {/* elementy wzmacniajace */}
      {geo.levels.flatMap((lv) => lv.cols.flatMap((c) => (c.rails || []).map((r, ri) => (
        <rect key={`trail${lv.i}-${c.j}-${ri}`} x={r.x0} y={cd - (r.z0 + r.zLen)}
          width={r.x1 - r.x0} height={r.zLen} fill={bf} stroke={INK} strokeWidth="1.5" opacity="0.55" />
      ))))}

      {showShelves && cols.map((c) => {
        if (c.kind === "drawers" || c.kind === "blenda") return null;
        if (!(c.shelves || []).length) return null;
        return (
          <rect key={"sh" + c.j} x={c.x0} y={geo.backIntrusion} width={c.w} height={geo.shelfDepth}
            fill={shc} fillOpacity="0.35" stroke={INK} strokeWidth="1.5" strokeDasharray="9 6" />
        );
      })}

      {/* przegrody pionowe */}
      {geo.dividers.map((d, i) => (
        <rect key={"dv" + i} x={d.x} y={geo.backIntrusion} width={t} height={geo.dividerDepth}
          fill={bf} stroke={INK} strokeWidth="2" />
      ))}


      {/* fronty jako pas przy przedniej krawedzi, ze skrzynkami szuflad */}
      {(() => {
        /* Szafka narozna ma front tylko tam, gdzie nie wchodzi ramie — dalej lico
           jest otwarte. Bez tego rzut ciagu rysowal sciane przez cale przejscie.
           Przy rogu front konczy sie jeszcze przed maskownica katownika — inaczej
           drzwi nachodzily z gory na wspornik. */
        const maskK = arm && arm.bracket ? arm.bracket.odKorpusu - arm.bracket.luz : 0;
        const licoOd = arm ? (arm.side === "right" ? 0 : W - arm.free + maskK) : 0;
        const licoDo = arm ? (arm.side === "right" ? arm.free - maskK : W) : W;
        return cols.map((c) => {
        if (!c.count) return null;
        const isDrawer = c.kind === "drawers";
        const cMode = isDrawer ? c.drawerMode || cab.frontMode : cab.frontMode;
        const z0 = cMode === "overlay" ? cd : cd - geo.tf;
        const dr0 = isDrawer && c.drawers?.length ? c.drawers[0] : null;
        const x0 = dr0 ? dr0.x : c.frontX0 ?? c.x0;
        const x1 = dr0 ? dr0.x + dr0.w : c.frontX1 ?? c.x1;
        const nl = isDrawer && c.drawers?.length
          ? Math.max(...c.drawers.map((d) => d.nl || 0)) : c.nl || 0;
        const boxBack = Math.max(geo.backIntrusion, cd - nl);
        return (
          <g key={"fr" + c.j}>
            {Math.min(x1, licoDo) > Math.max(x0, licoOd) && (
              <rect x={Math.max(x0, licoOd)} y={z0}
                width={Math.min(x1, licoDo) - Math.max(x0, licoOd)} height={geo.tf}
                fill={ffc} stroke={INK} strokeWidth="2" />
            )}
            {/* maskownica nie jest skrzydlem — przekreslamy ja, tak jak element staly */}
            {c.kind === "blenda" && (
              <>
                <line x1={x0} y1={z0} x2={x1} y2={z0 + geo.tf} stroke={INK} strokeWidth="1.2" opacity="0.5" />
                <line x1={x0} y1={z0 + geo.tf} x2={x1} y2={z0} stroke={INK} strokeWidth="1.2" opacity="0.5" />
              </>
            )}
            {isDrawer && nl > 0 && (
              <rect x={x0 + 4} y={boxBack} width={x1 - x0 - 8} height={cd - boxBack}
                fill="none" stroke={LINE} strokeWidth="1" strokeDasharray="5 4" opacity="0.6" />
            )}
          </g>
        );
        });
      })()}

      {/* prowadnice szuflad */}
      {showHardware && cols
        .filter((c) => c.kind === "drawers" && (c.drawers || []).length)
        .flatMap((c) => {
          const nl = Math.max(...c.drawers.map((d) => d.rail.d || 0));
          if (!nl) return [];
          const sb = c.drawers[0]?.rail.setback || 0;
          return [c.x0, c.x1 - RUNNER_W].map((rx, si) => (
            <rect key={`trn${c.j}-${si}`} x={rx} y={cd - sb - nl} width={RUNNER_W} height={nl}
              fill="#8b8b93" stroke={INK} strokeWidth="1.5" opacity="0.85" />
          ));
        })}

      {/* elementy stale i blendy — leza w plaszczyznie frontu, przekreslone */}
      {(() => {
        const z0 = cab.frontMode === "overlay" ? cd : cd - geo.tf;
        const panels = [];
        geo.levels.forEach((lv) => lv.cols.forEach((c) => {
          if (c.fix) panels.push({ k: `f${lv.i}-${c.j}`, x: c.fix.x, w: c.fix.w });
          if (c.topFix) panels.push({ k: `tf${lv.i}-${c.j}`, x: c.topFix.x, w: c.topFix.w });
        }));
        const seen = new Set();
        return panels.filter((p) => {
          const key = `${Math.round(p.x)}|${Math.round(p.w)}`;
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        }).map((p) => (
          <g key={p.k}>
            <rect x={p.x} y={z0} width={p.w} height={geo.tf} fill={ffc} stroke={INK} strokeWidth="2" />
            <line x1={p.x} y1={z0} x2={p.x + p.w} y2={z0 + geo.tf} stroke={INK} strokeWidth="1.2" opacity="0.5" />
            <line x1={p.x} y1={z0 + geo.tf} x2={p.x + p.w} y2={z0} stroke={INK} strokeWidth="1.2" opacity="0.5" />
          </g>
        ));
      })()}

      {/* wsporniki pionowe przy elementach stalych */}
      {geo.levels.flatMap((lv) => lv.cols.filter((c) => c.support && c.fix).map((c) => (
        <rect key={`tsup${lv.i}-${c.j}`}
          x={c.fix.side === "left" ? c.fix.x + c.fix.w - t : c.fix.x}
          y={cd - c.support.d} width={t} height={c.support.d}
          fill="none" stroke={INK} strokeWidth="1.5" strokeDasharray="8 6" />
      )))}

      {/* plecy */}
      {cab.back !== "none" && (() => {
        const outside = geo.backIsBoard && geo.backPos === "outside";
        const bcol = geo.backIsBoard
          ? (cab.backPos === "outside" && cab.backBoardMat !== "shelf" ? mat.board.color : shc)
          : mat.back.color;
        const py = geo.grooved ? geo.grOff : outside ? -geo.tb : 0;
        const inside = geo.grooved || (geo.backIsBoard && geo.backPos === "inside");
        const base0 = inside ? geo.interior.x0 : 1;
        const base1 = inside ? geo.interior.x1 : W - 1;
        const px = Math.max(base0, geo.cornerCut?.backLeftX ?? base0);
        const px1 = Math.min(base1, geo.cornerCut?.backRightX ?? base1);
        return <rect x={px} y={py} width={Math.max(0, px1 - px)} height={geo.tb}
          fill={bcol} stroke={INK} strokeWidth="2" />;
      })()}

      {/* wyciecia w narozniku i elementy kolizyjne */}
      {geo.geoCuts.map((gc, ci) => (
        <g key={"cut" + ci}>
          <rect x={gc.bx0} y={gc.bz0} width={gc.bx1 - gc.bx0} height={gc.bz1 - gc.bz0}
            fill={ERRC} opacity="0.15" stroke={ERRC} strokeWidth="1.5" strokeDasharray="6 4" />
          {/* scianki zabudowy wyciecia — ida na formatki, wiec musza byc widoczne
              tak samo jak przy bryle kolizyjnej nizej */}
          <CutMaskTop gc={gc} t={t} color={shc} />
        </g>
      ))}
      {(geo.geoObs || []).map((o, oi) => (
        <g key={"ob" + oi}>
          <rect x={o.ox0} y={o.oz0} width={o.ow} height={o.od}
            fill="#7c3aed" opacity="0.28" stroke="#6d28d9" strokeWidth="1.5" strokeDasharray="5 4" />
          {/* scianki zabudowy — to one ida na formatki, wiec musza byc widoczne */}
          <ObsMaskTop o={o} t={t} W={W} color={shc} />
          {o.name && o.ow > 120 && (
            <text x={o.ox0 + o.ow / 2} y={o.oz0 + o.od / 2 + 6} textAnchor="middle"
              fontSize="17" fill="#6d28d9" fontFamily="ui-monospace, monospace">{o.name}</text>
          )}
        </g>
      ))}
    </g>
  );
}

/* Elewacja — od przodu (zamknieta i otwarta) oraz od tylu. Wszystkie trzy to ten
   sam rzut, wiec dzieli je tylko to, co rysujemy w srodku obrysu. */
function AssemblyView({ project, runs, rpOf, variant, showDims, showHardware, showLabels, activeCab }) {
  const full = projectLayout(project);
  const groups = assemblyParts(project, runs, full);
  const wzor = wzorcowaSzafka(groups);
  if (!wzor) return null;
  const plyta = (g) => kolorPlyty(g, wzor);
  const rear = variant === "rear";
  const open = variant === "open";

  /* Ciagi polaczone naroznikiem rysujemy jako rozwiniecie scian: kazda sciana
     dostaje swoj pas, obok siebie, oddzielone linia naroza. Bez narozy
     rozwiniecie ma jeden pas i elewacja wyglada dokladnie jak dotad. */
  /* Rozmieszczenie do rysowania liczymy z ciagow objetych zakresem, ale o
     narozniki pytamy caly projekt — inaczej przy zakresie „ciag" naroznika by
     nie bylo i ramie szafki znikaloby z rysunku. */
  const L = runLayout(groups, full);
  const rysowane = new Set(groups.map((g) => g.run.id));
  const dostawione = groups.flatMap((g) => {
    const n = L.info.get(g.run.id);
    return armsIn(full, n, rysowane).filter((a) => a.dostawione).map((a) => n.ex + a.u0 + a.len);
  });
  const total = Math.max(L.elevTotal, ...dostawione);
  const top = Math.max(...groups.flatMap((g) => g.cabs.map((c) => c.base + c.cab.H)));
  const fy = (v) => top - v;
  // patrzac od tylu widzimy ciag w lustrzanym odbiciu
  const mx = (x, w) => (rear ? total - x - w : x);

  const anyGap = groups.some((g) => g.gap > 0);
  const anyMount = groups.some((g) => g.mount > 0);
  const padL = showDims ? 200 : 40;
  // wysokosc zawieszenia wymiarujemy z prawej, wiec musi sie tam zmiescic
  const padR = showDims && anyMount ? 200 : 40;
  // przy narożniku nad rysunkiem idzie jeszcze podpis rozwiniecia scian
  const padT = showDims ? (anyGap ? 210 : 130) + (L.corners ? 44 : 0) : 40;
  // kazdy ciag dokłada wlasny wiersz szerokosci, a pod nimi idzie jeszcze suma
  const padB = showDims ? 150 + groups.length * 74 : 40;
  const vb = [-padL, -padT, total + padL + padR, top + padT + padB].join(" ");

  /* Linie frontow ciagniete przez cala szerokosc — front, ktory wypada inaczej
     niz sasiedzi, zostaje przeciety w poprzek i widac to od razu. */
  const frontLines = showDims && !open && !rear
    ? [...new Set(groups.flatMap((g) => g.cabs.flatMap((c) =>
        c.geo.doors.filter((d) => d.w > 0 && d.h > 0)
          .flatMap((d) => [Math.round(c.base + d.y), Math.round(c.base + d.y + d.h)]))))]
    : [];

  return (
    <svg viewBox={vb} className="w-full h-auto" style={{ maxHeight: DRAW_MAX_H }}>
      {/* jeden zestaw wzorow slojow na cala elewacje — id wzoru bierze sie
          z koloru, wiec powtarzanie ich przy kazdej szafce dalo by duplikaty */}
      <GrainDefs mat={wzor.rawMat} on={wzor.cab.texture} dir={wzor.cab.textureDir} />
      <PrzejscieDefs />
      <line x1={-20} y1={fy(0)} x2={total + 20} y2={fy(0)} stroke={LINE} strokeWidth="2" />

      {groups.map((g, gi) => {
        const rp = rpOf ? rpOf(g.run) : null;
        const plinthH = rp ? rp.h : 0;
        // przesuniecie ciagu w rozwinieciu: pas jego sciany plus miejsce zjedzone w rogu
        const ox = L.info.get(g.run.id).ex + L.info.get(g.run.id).lead;
        return (
          <g key={g.run.id}>
            {/* cokol ciagu — jedna plaszczyzna, ze szwami w miejscach ciecia */}
            {plinthH > 0 && (
              <g>
                {/* W rogu cokol konczy sie na cokole prostopadlej sciany, a nie
                    na koncu szafki naroznej — `rp.total` ma to juz policzone.
                    Rysowany na cala dlugosc ciagu wystawal w powietrze. */}
                <rect x={mx(ox, rp.total)} y={fy(g.mount + plinthH)} width={rp.total} height={plinthH}
                  fill={plyta(g)} stroke={INK} strokeWidth="2" opacity="0.75" />
                {rp.cuts.map((c) => (
                  <line key={"pc" + c} x1={mx(ox + c, 0)} y1={fy(g.mount + plinthH)}
                    x2={mx(ox + c, 0)} y2={fy(g.mount)} stroke={INK} strokeWidth="3" />
                ))}
              </g>
            )}

            {g.cabs.map((c, i) => (
              <g key={gi + "-" + i}
                transform={`translate(${mx(ox + c.x, c.geo.W)}, ${fy(c.base + c.cab.H)})`}>
                <CabElevation cab={c.cab} geo={c.geo} mat={c.mat} open={open} rear={rear}
                  showDims={showDims} showHardware={showHardware} showLabels={showLabels}
                  frontColor={c.frontColor} levelDims={showDims && open && c.cab === activeCab} />
              </g>
            ))}
            {/* Blat ciagu — jedna plaszczyzna nad szafkami, takze nad ramieniem
                w rogu. Bez tego widok konczyl sie na licu korpusow. */}
            {(() => {
              const rt = runTop(project, g.run);
              if (!rt) return null;
              const kol = rt.worktop
                ? (rt.mat.worktop || {}).color || "#8d7b68"
                : (rt.mat.board || {}).color || "#d8c3a0";
              return worktopSpans(rt).map((s, i) => (
                <rect key={"blat" + i} x={mx(ox + s.x0, s.x1 - s.x0)}
                  y={fy(g.mount + rt.y + rt.th)} width={s.x1 - s.x0} height={rt.th}
                  fill={kol} stroke={INK} strokeWidth="2" />
              ));
            })()}
            {/* Odcinek zjedzony przez rog nie jest pusty — stoi w nim bok szafki
                z sasiedniej sciany. Bez tego szafki wygladaja, jakby bez powodu
                odjechaly od naroza. */}
            {(() => {
              const n = L.info.get(g.run.id);
              const ar = armsIn(full, n, rysowane).filter((a) => !a.dostawione);
              const sasiad = [...full.info.values()]
                .find((k) => k.pair && k.pair.ustepuje.id === n.id);
              if (!sasiad) return null;
              const nazwa = sasiad.pair.wchodzi.run.name;
              const hTop = Math.max(...g.cabs.map((c) => c.base + c.cab.H));
              const bok = (u0, w) => w <= 0 ? null : (
                <g key={"bok" + u0}>
                  <rect x={mx(n.ex + u0, w)} y={fy(hTop)} width={w} height={hTop - g.mount}
                    fill={plyta(g)} opacity="0.3"
                    stroke={LINE} strokeWidth="2" strokeDasharray="14 10" />
                  {showDims && w > 180 && (
                    <text x={mx(n.ex + u0, w) + w / 2} y={fy(hTop) + (hTop - g.mount) / 2}
                      textAnchor="middle" fontSize="20" fill={LINE}
                      fontFamily="ui-monospace, monospace">bok „{nazwa}" {fmt(w)}</text>
                  )}
                </g>
              );
              const przodem = ar.length ? Math.min(...ar.map((a) => a.u0)) : n.lead;
              return (
                <g>
                  {n.lead > 0 && bok(0, Math.min(przodem, n.lead))}
                  {n.tail > 0 && bok(n.len - n.tail, n.tail)}
                </g>
              );
            })()}
            {/* Maskownica katownika po stronie korpusu. Stoi w licu drzwi tej
                szafki, przy samym rogu — front konczy sie na niej, wiec bez niej
                elewacja pokazuje pusty pas miedzy drzwiami a sasiednim ciagiem. */}
            {[...full.info.values()]
              .filter((k) => k.arm && k.arm.bracket && k.arm.run.id === g.run.id)
              .map((k, i) => {
                const a = k.arm;
                const c = a.cab;
                const wM = a.bracket.odKorpusu - a.bracket.luz;
                if (!(wM > 0) || !(a.free > 0)) return null;
                const ox = L.info.get(g.run.id).ex + L.info.get(g.run.id).lead;
                // ramie wychodzi z jednej strony korpusu, po tej stronie jest rog
                const u0 = a.side === "right"
                  ? c.x + a.free - wM
                  : c.x + c.geo.W - a.free;
                /* Za maskownica lico szafki naroznej jest juz otwarte — tam
                   zaczyna sie przejscie do ramienia. Zostawione puste wygladalo
                   jak dziura miedzy drzwiami a wzmocnieniem, wiec zaznaczamy je
                   jako przejscie: bez frontu, ale i bez udawania, ze czegos
                   brakuje. Po otwarciu drzwi widac tam wnetrze, wiec nie
                   zakrywamy. */
                const pu0 = a.side === "right" ? c.x + a.free : c.x;
                const pw = Math.max(0, c.geo.W - a.free);
                return (
                  <g key={"kmask" + i}>
                    {!open && !rear && pw > 0 && (
                      <g>
                        <rect x={mx(ox + pu0, pw)} y={fy(c.base + c.cab.H)}
                          width={pw} height={c.cab.H}
                          fill={c.mat.board.color} fillOpacity="0.25"
                          stroke={ACC} strokeWidth="2" strokeDasharray="14 10" />
                        <rect x={mx(ox + pu0, pw)} y={fy(c.base + c.cab.H)}
                          width={pw} height={c.cab.H}
                          fill={`url(#${PRZEJSCIE_ID})`} stroke="none" />
                        {showDims && pw > 260 && (
                          <text x={mx(ox + pu0, pw) + pw / 2} y={fy(c.base + c.cab.H / 2)}
                            textAnchor="middle" fontSize="20" fill={ACC}
                            fontFamily="ui-monospace, monospace">
                            przejście do ramienia {fmt(pw)}
                          </text>
                        )}
                      </g>
                    )}
                    <rect x={mx(ox + u0, wM)}
                      y={fy(c.base + c.cab.H)} width={wM} height={c.cab.H}
                      fill={rear ? c.mat.board.color : c.frontColor}
                      stroke={INK} strokeWidth="2" />
                  </g>
                );
              })}
            {/* front ramienia szafki naroznej — stoi na tej scianie, choc sama
                szafka nalezy do sasiedniego ciagu */}
            {armsIn(full, L.info.get(g.run.id), rysowane).map((a, i) => {
              const ax = mx(L.info.get(g.run.id).ex + a.u0, a.len);
              /* Zawias siedzi przy koncu dalszym od naroza, wiec maskownica —
                 ktora stoi przy samym rogu — wypada po przeciwnej stronie.
                 Front ramienia konczy sie na niej, a nie na koncu ramienia. */
              const zl = rear ? a.outerAtEnd : !a.outerAtEnd;
              /* Przy samym rogu stoi maskownica katownika, za nia luz, a dopiero
                 potem zaczyna sie front — dlatego `armFront`, a nie cala dlugosc. */
              const maskW = a.bracket ? a.bracket.odRamienia - a.bracket.luz : 0;
              /* Front zachodzi na bok ramienia z luzem, tak samo jak drzwi
                 szafki na jej bok — `armFrontPlan` liczy to raz dla rysunkow
                 i dla formatki. */
              const fp = armFrontPlan(a);
              const lw = fp.w;
              const lx = zl ? ax + (a.len - fp.odRogu - lw) : ax + fp.odRogu;
              // wewnetrzne lico boku na wolnym koncu ramienia — tam siedza zawiasy
              const licoBoku = zl ? ax + a.cab.geo.t : ax + a.len - a.cab.geo.t;
              return (
                <g key={"arm" + i}>
                  {/* Front ramienia otwiera sie tak samo jak kazdy inny: po
                      otwarciu zostaje obrys skrzydla, symbol kierunku i sama
                      plyta widziana od czola przy zawiasach. */}
                  {open && !rear && a.doors !== "fix" ? (
                    <g>
                      <rect x={lx} y={fy(a.cab.base + a.cab.cab.H)} width={lw} height={a.cab.cab.H}
                        fill="none" stroke={LINE} strokeWidth="1.5" strokeDasharray="12 9" opacity="0.6" />
                      <path
                        d={`M ${zl ? lx + lw : lx} ${fy(a.cab.base + a.cab.cab.H)}
                            L ${zl ? lx : lx + lw} ${fy(a.cab.base + a.cab.cab.H / 2)}
                            L ${zl ? lx + lw : lx} ${fy(a.cab.base)}`}
                        fill="none" stroke={INK} strokeWidth="1.8" opacity="0.5" />
                      <rect x={zl ? lx : lx + lw - a.cab.geo.tf}
                        y={fy(a.cab.base + a.cab.cab.H)} width={a.cab.geo.tf} height={a.cab.cab.H}
                        fill={a.cab.frontColor} stroke={INK} strokeWidth="2" />
                    </g>
                  ) : (
                    /* Od tylu ramie pokazuje plecy, a nie front — i to na calej
                       dlugosci, bo plecy ida przez cale ramie, a front tylko do
                       maskownicy katownika. */
                    <rect x={rear ? ax : lx} y={fy(a.cab.base + a.cab.cab.H)}
                      width={rear ? a.len : lw} height={a.cab.cab.H}
                      fill={rear ? a.cab.mat.back.color : a.cab.frontColor}
                      stroke={INK} strokeWidth="2" />
                  )}
                  {a.cab.plinthH > 0 && (
                    <rect x={ax} y={fy(a.cab.base)} width={a.len} height={a.cab.plinthH}
                      fill={a.cab.mat.board.color} stroke={INK} strokeWidth="2" opacity="0.75" />
                  )}
                  {/* Ramie stoi na wlasnych nozkach — bez nich widac sam cokol,
                      jakby ten kawalek zabudowy na niczym nie stal. */}
                  {a.cab.cab.legs?.on && a.len > 160 && [ax + 40, ax + a.len - 80].map((lx2, k) => (
                    <rect key={"anog" + k} x={lx2}
                      y={fy(a.cab.base) - a.cab.geo.legTop} width={40} height={a.cab.geo.legH}
                      rx={legRound(a.cab.cab) ? 20 : 0} fill={legColorOf(a.cab.cab)}
                      stroke={INK} strokeWidth="2" opacity={a.cab.geo.legTop > 0 ? 0.5 : 1} />
                  ))}
                  {/* Polki ramienia widac dopiero po otwarciu — ida na tych samych
                      wysokosciach co polki kolumny przy ramieniu, bo to na nich
                      sie koncza. */}
                  {open && !rear && armShelfYs(a.side, a.cab.geo.levels).map((sy, k) => (
                    <rect key={"apo" + k} x={ax} y={fy(a.cab.base + sy + a.cab.geo.ts)}
                      width={a.len} height={a.cab.geo.ts}
                      fill={a.cab.mat.board.color} stroke={INK} strokeWidth="2" />
                  ))}
                  {/* Front ramienia to zwykle drzwi, wiec musi miec uchwyt i
                      zawiasy — inaczej na elewacji wyglada jak zaslepka.
                      Zawiasy ida od konca dalszego od naroza, bo przy samym
                      rogu domyka sie do wspornika albo do drugiego frontu. */}
                  {(() => {
                    // od tylu nie widac ani uchwytu, ani zawiasow — to strona pleców
                    if (a.doors === "fix" || rear) return null;
                    const H = a.cab.cab.H;
                    const y0 = fy(a.cab.base + H);
                    // puszka zawiasu siedzi na boku ramienia, w jego wewnetrznym
                    // licu — po staremu stala na krawedzi skrzydla, w powietrzu
                    const hx = zl ? licoBoku : licoBoku - HINGE_W;
                    /* Zawiasy ramienia siadaja na tych samych wysokosciach co
                       zawiasy drzwi tej szafki — front ramienia jest tak samo
                       wysoki, wiec rozstawione na oko wypadaly obok tamtych. */
                    const dRef = (a.cab.geo.doors || [])
                      .find((d) => d.h > 0 && d.type === "door" && (d.hingePts || []).length);
                    const ile = Math.max(2, Math.min(4, Math.round(H / 500) + 1));
                    const hys = dRef ? dRef.hingePts
                      : Array.from({ length: ile }, (_, k) => (H * (k + 1)) / (ile + 1));
                    return (
                      <g>
                        {open && showHardware && hys.map((hy, k) => (
                          <rect key={"hg" + k} x={hx} y={fy(a.cab.base + hy) - HINGE_H / 2}
                            width={HINGE_W} height={HINGE_H}
                            fill="#a1a1aa" stroke={INK} strokeWidth="1.5" opacity="0.9" />
                        ))}
                        {/* Uchwytu na otwartym skrzydle nie widac — tak samo jak
                            przy drzwiach szafki, gdzie zostaje sam obrys. */}
                        {!open && lw > 60 && (
                          <rect x={zl ? lx + lw - 45 : lx + 30} y={y0 + H / 2 - 60}
                            width={15} height={120} rx="5" fill="#52525b" opacity="0.9" />
                        )}
                        {/* Maskownica w rogu: plyta frontowa, do ktorej domykaja
                            sie drzwi. Za nia stoi wspornik, ale ten jest w srodku
                            i z zewnatrz go nie widac. */}
                        {maskW > 0 && (
                          <rect x={zl ? ax + a.len - maskW : ax}
                            y={y0} width={maskW} height={H}
                            fill={a.cab.frontColor} stroke={INK} strokeWidth="2" />
                        )}
                      </g>
                    );
                  })()}
                  {showDims && (
                    <>
                      <text x={ax + a.len / 2} y={fy(a.cab.base + a.cab.cab.H / 2)} textAnchor="middle"
                        fontSize="20" fill={INK} fontFamily="ui-monospace, monospace">
                        ramię {fmt(a.len)}
                      </text>
                      {/* Ramie jest kawalkiem zabudowy jak kazdy inny, wiec
                          dostaje kreske w tym samym wierszu co szerokosci
                          szafek — bez niej pas z samym ramieniem byl niemierzony. */}
                      <DimH x1={ax} x2={ax + a.len} y={fy(0) + 56 + gi * 74}
                        label={fmt(a.len)} above={false} />
                    </>
                  )}
                </g>
              );
            })}
            {g.cabs.map((c, i) => c.name ? (
              <text key={"n" + gi + "-" + i} x={mx(ox + c.x, c.geo.W) + c.geo.W / 2}
                y={fy(c.base + c.cab.H) - 14} textAnchor="middle"
                fontSize="22" fill={LINE} fontFamily="ui-monospace, monospace">{c.name}</text>
            ) : null)}

            {showDims && (
              <g>
                {g.cabs.map((c, i) => (
                  <DimH key={"w" + i} x1={mx(ox + c.x, c.geo.W)} x2={mx(ox + c.x, c.geo.W) + c.geo.W}
                    y={fy(0) + 56 + gi * 74} label={fmt(c.geo.W)} above={false} />
                ))}
                {g.mount > 0 && (
                  <DimV y1={fy(g.mount)} y2={fy(0)} x={total + 90} left={false} label={fmt(g.mount)} />
                )}
                {/* Przeswit nad blatem: od lica dolnego ciagu (z blatem, jesli
                    go ma) do spodu szafek gornych. To ten wymiar bierze sie pod
                    uwage przy okapie i plytkach, wiec musi byc na rysunku. */}
                {g.mount > 0 && (() => {
                  const dolny = groups.find((q) => q.run.id === g.run.wall);
                  if (!dolny || !dolny.cabs.length) return null;
                  const rtD = runTop(project, dolny.run);
                  const lico = rtD
                    ? dolny.mount + rtD.y + rtD.th
                    : Math.max(...dolny.cabs.map((c) => c.base + c.cab.H));
                  const luz = Math.round(g.mount - lico);
                  if (!(luz > 0)) return null;
                  return (
                    <DimV y1={fy(g.mount)} y2={fy(lico)} x={mx(ox + g.total / 2, 0)}
                      label={fmt(luz)} />
                  );
                })()}
                {/* Luz miedzy korpusami bywa 3 mm — kreska wymiarowa zlalaby sie
                    w plame, wiec zamiast niej idzie odnosnik nad ciagiem. */}
                {g.gap > 0 && g.cabs.slice(0, -1).map((c, i) => {
                  const cx = rear
                    ? total - (ox + c.x + c.geo.W) - g.gap / 2
                    : ox + c.x + c.geo.W + g.gap / 2;
                  const yTop = fy(Math.max(...g.cabs.map((q) => q.base + q.cab.H)));
                  return (
                    <g key={"g" + i}>
                      <line x1={cx} y1={yTop - 12} x2={cx} y2={yTop - 58} stroke={ACC} strokeWidth="1.5" />
                      <text x={cx} y={yTop - 66} textAnchor="middle" fontSize="22" fill={ACC}
                        fontFamily="ui-monospace, monospace">{fmt(g.gap)}</text>
                    </g>
                  );
                })}
              </g>
            )}
          </g>
        );
      })}

      {showDims && (
        <g>
          {frontLines.map((v) => (
            <line key={"fl" + v} x1={-16} y1={fy(v)} x2={total + 16} y2={fy(v)}
              stroke={ACC} strokeWidth="1" strokeDasharray="10 8" opacity="0.45" />
          ))}
          {/* W rozwinieciu suma wszystkich pasow nie jest zadnym wymiarem —
              mierzymy wtedy kazda sciane osobno. */}
          {L.corners
            ? L.walls.map((w) => {
                const [a, b2] = rear ? [total - w.ex - w.len, total - w.ex] : [w.ex, w.ex + w.len];
                const nazwa = (groups.find((g) => L.info.get(g.run.id).wall === w.wall) || {}).run;
                return (
                  <DimH key={"wl" + w.wall} x1={a} x2={b2} y={fy(0) + 56 + groups.length * 74}
                    label={`${fmt(w.len)} ${nazwa ? nazwa.name : "ściana"}`} above={false} />
                );
              })
            : (
              /* mierzymy sam ciag — dostawione ramie lezy juz przy innej scianie */
              <DimH x1={0} x2={L.elevTotal} y={fy(0) + 56 + groups.length * 74}
                label={`${fmt(L.elevTotal)} ${groups.length > 1 ? "zabudowa" : "ciąg"}`} above={false} />
            )}
          <DimV y1={fy(top)} y2={fy(0)} x={-70} label={fmt(top)} />
          {groups.map((g) => {
            const rp = rpOf ? rpOf(g.run) : null;
            return rp && rp.h > 0 && !rear ? (
              <DimV key={"pl" + g.run.id} y1={fy(g.mount + rp.h)} y2={fy(g.mount)} x={-150}
                label={fmt(rp.h)} />
            ) : null;
          })}
          {L.walls.map((w) => {
            const mine = groups.filter((g) => L.info.get(g.run.id).wall === w.wall);
            const wallW = Math.max(0, ...mine.map((g) => g.run.wallW || 0));
            if (!wallW) return null;
            const [a, b2] = rear ? [total - w.ex - wallW, total - w.ex] : [w.ex, w.ex + wallW];
            return (
              <DimH key={"ws" + w.wall} x1={a} x2={b2} y={fy(top) - (anyGap ? 140 : 66)}
                label={`${fmt(wallW)} ściana`} c={wallW < w.len ? ERRC : DIMC} />
            );
          })}
          {/* granica scian w rozwinieciu — za nia zaczyna sie kolejna sciana */}
          {L.walls.slice(0, -1).map((w) => {
            const cx = mx(w.ex + w.len + WALL_SEP / 2, 0);
            return (
              <g key={"cn" + w.wall}>
                <line x1={cx} y1={fy(top) - 40} x2={cx} y2={fy(0) + 40}
                  stroke={ACC} strokeWidth="2" strokeDasharray="16 12" />
                <text x={cx} y={fy(top) - (anyGap ? 200 : 126)} textAnchor="middle" fontSize="22" fill={ACC}
                  fontFamily="ui-monospace, monospace">narożnik</text>
              </g>
            );
          })}
        </g>
      )}
    </svg>
  );
}

/* Rzut z gory. Szafki wyrownujemy do LICA, nie do sciany — w ciagu fronty stoja
   w jednej linii, a glebsza szafka wchodzi blizej sciany, zamiast wystawac do
   przodu. Szafke da sie tez celowo wysunac albo cofnac. Ciag wyzszy rysujemy
   przerywana linia na tle nizszego, tak jak szafki gorne nad dolnymi.
   Ciagi polaczone naroznikiem stoja wzgledem siebie pod katem prostym — kazdy
   rysuje sie we wlasnym ukladzie (u wzdluz sciany, v w glab pokoju), a na
   miejsce obraca go transform. */
function AssemblyTopView({ project, runs, showDims, showShelves, showHardware }) {
  const full = projectLayout(project);
  const groups = assemblyParts(project, runs, full).slice().sort((a, b) => a.mount - b.mount);
  const wzor = wzorcowaSzafka(groups);
  if (!wzor) return null;
  const L = runLayout(groups, full);
  /* Ramie opisane jest przy sasiednim pasie, a przycina lico TEJ szafki. */
  const armOf = new Map();
  full.info.forEach((k) => { if (k.arm) armOf.set(k.arm.cab.index, k.arm); });
  const b = L.box;
  const pad = showDims ? 190 : 40;
  const padR = showDims ? 700 : 40;
  const vb = [b.x0 - pad, b.y0 - pad,
    b.x1 - b.x0 + pad + padR, b.y1 - b.y0 + 2 * pad].join(" ");
  // ciag nizszy na danej scianie rysujemy pelna kreska, wyzszy przerywana
  const rysowane = new Set(groups.map((g) => g.run.id));
  const lowest = new Map();
  groups.forEach((g) => {
    const w = L.info.get(g.run.id).wall;
    if (!lowest.has(w)) lowest.set(w, g.run.id);
  });
  return (
    <svg viewBox={vb} className="w-full h-auto" style={{ maxHeight: DRAW_MAX_H }}>
      <GrainDefs mat={wzor.rawMat} on={wzor.cab.texture} dir={wzor.cab.textureDir} />
      {groups.map((g, gi) => {
        const n = L.info.get(g.run.id);
        const upper = lowest.get(n.wall) !== g.run.id;
        const o = n.at(0, 0);
        const deg = Math.round((Math.atan2(n.f.uy, n.f.ux) * 180) / Math.PI);
        const dv = n.depth + n.front;
        return (
          <g key={g.run.id} opacity={upper ? 0.75 : 1}
            transform={`translate(${o.x}, ${o.y}) rotate(${deg})`}>
            {!upper && <line x1={-20} y1={0} x2={n.len + 20} y2={0} stroke={LINE} strokeWidth="3" />}
            {g.cabs.map((c, i) => (
              <g key={i} transform={`translate(${n.lead + c.x}, ${n.depth - c.geo.carcassDepth + c.offset})`}>
                <CabTop cab={c.cab} geo={c.geo} mat={c.mat} ghost={upper}
                  arm={armOf.get(c.index)}
                  showShelves={showShelves} showHardware={showHardware} />
              </g>
            ))}
            {/* Ramie szafki naroznej lezy w tym ciagu, ale nalezy do szafki
                z sasiedniego — dlatego rysuje sie tu, a liczy przy tamtej. */}
            {armsIn(full, n, rysowane).map((a, i) => (
              <g key={"arm" + i} transform={`translate(${a.u0}, 0)`}>
                <rect x={0} y={0} width={a.len} height={a.depth} fill="#fafaf9"
                  stroke="#e7e5e4" strokeWidth="1" />
                <rect x={a.outerAtEnd ? a.len - a.cab.geo.t : 0} y={0}
                  width={a.cab.geo.t} height={a.depth}
                  fill={a.cab.mat.board.color} stroke={INK} strokeWidth="2" />
                {/* Front ramienia siada tak samo jak front kazdej szafki ciagu:
                    nakladany idzie PRZED korpusem, wpuszczany chowa sie w nim.
                    Rysowany po staremu zawsze do srodka stal 18 mm za linia
                    frontow sasiadow — a ma z nimi byc w jednym licu. */}
                {(() => {
                  // front zachodzi na bok ramienia z luzem — jak drzwi na bok szafki
                  const fp = armFrontPlan(a);
                  return (
                    <rect x={a.outerAtEnd ? fp.odRogu : a.len - fp.odRogu - fp.w}
                      y={armInset(a) ? a.depth - a.cab.geo.tf : a.depth}
                      width={fp.w} height={a.cab.geo.tf}
                      fill={a.cab.frontColor} stroke={INK} strokeWidth="2" />
                  );
                })()}
                {/* Plecy i wzmocnienia ramienia. Plecy i tylne wzmocnienie ida
                    dalej niz samo ramie — az do katownika w tylnym narozniku. */}
                {(() => {
                  const ap = armPlan(a);
                  return (
                    <>
                      {ap.back && (
                        <rect x={ap.back.u0} y={ap.back.v0}
                          width={ap.back.u1 - ap.back.u0} height={ap.back.v1 - ap.back.v0}
                          fill={ap.back.plyta ? a.cab.mat.board.color : a.cab.mat.back.color}
                          stroke={INK} strokeWidth="1.5" />
                      )}
                      {ap.rails.map((r, k) => (
                        <rect key={"awz" + k} x={r.u0} y={r.v0}
                          width={r.u1 - r.u0} height={r.v1 - r.v0}
                          fill={a.cab.mat.board.color} stroke={INK} strokeWidth="1.5" opacity="0.55" />
                      ))}
                    </>
                  );
                })()}
                {/* Katownik w wewnetrznym rogu: po jednej plycie w kazdej
                    plaszczyznie frontu, a za nimi te same dwie w srodku szafki.
                    Do zewnetrznych domykaja sie oba skrzydla. */}
                {a.bracket && bracketPlan(a).map((r, k) => (
                  <rect key={"kat" + k} x={r.u} y={r.v} width={r.w} height={r.h}
                    fill={r.front ? a.cab.frontColor : a.cab.mat.board.color}
                    stroke={INK} strokeWidth="2" />
                ))}
                {showDims && (
                  <text x={a.len / 2} y={a.depth / 2 + 8} textAnchor="middle" fontSize="22"
                    fill={ACC} fontFamily="ui-monospace, monospace">ramię {fmt(a.len)}</text>
                )}
              </g>
            ))}
            {/* Blat ciagu lezy nad wszystkim, wiec i rysujemy go na wierzchu —
                przezroczysto, zeby bylo widac, co pod nim stoi. */}
            {(() => {
              const rt = runTop(project, g.run);
              if (!rt) return null;
              const kol = rt.worktop
                ? (rt.mat.worktop || {}).color || "#8d7b68"
                : (rt.mat.board || {}).color || "#d8c3a0";
              return worktopSpans(rt).map((s, i) => (
                <rect key={"blat" + i} x={n.lead + s.x0} y={0}
                  width={s.x1 - s.x0} height={rt.depth}
                  fill={kol} opacity="0.35" stroke={INK} strokeWidth="2" />
              ));
            })()}
            {showDims && (
              <g>
                {/* miejsce zjedzone przez narożnik — tam nie stanie zadna szafka */}
                {[["lead", 0, n.lead], ["tail", n.lead + n.total, n.tail]]
                  .filter(([, , d]) => d > 0).map(([k, u0, d]) => (
                    <g key={k}>
                      <rect x={u0} y={0} width={d} height={n.depth} fill="none"
                        stroke={ACC} strokeWidth="2" strokeDasharray="14 10" opacity="0.7" />
                      <text x={u0 + d / 2} y={n.depth / 2} textAnchor="middle" fontSize="22"
                        fill={ACC} fontFamily="ui-monospace, monospace">{fmt(d)}</text>
                    </g>
                  ))}
                {/* ile frontu szafki w rogu zostaje odsloniete — reszta chowa
                    sie za drugim ciagiem i drzwi nie maja tam czego szukac */}
                {n.zones.map((z, i) => (z.free > 0 ? (
                  <DimH key={"bl" + i} x1={z.freeU0} x2={z.freeU0 + z.free} y={dv + 18}
                    label={`${fmt(z.free)} dostępu`} above={false} c={ACC} />
                ) : (
                  <text key={"bl" + i} x={(z.u0 + z.u1) / 2} y={n.depth - 30} textAnchor="middle"
                    fontSize="22" fill={ERRC} fontFamily="ui-monospace, monospace">ślepa</text>
                )))}
                {!upper && g.cabs.map((c, i) => (
                  <DimH key={i} x1={n.lead + c.x} x2={n.lead + c.x + c.geo.W} y={dv + 56}
                    label={fmt(c.geo.W)} above={false} />
                ))}
                {!upper && (
                  <DimH x1={n.lead} x2={n.lead + n.total} y={dv + 120} label={fmt(n.total)} above={false} />
                )}
                {/* Glebokosc mierzymy od strony wolnej: przy narożniku poczatek
                    ciagu lezy na sasiednim ciagu i kreska wpadlaby w jego rysunek. */}
                {!upper && (n.lead > 0
                  ? <DimV y1={0} y2={dv} x={n.len + 70} left={false} label={fmt(dv)} />
                  : <DimV y1={0} y2={dv} x={-70} label={fmt(dv)} />)}
                {g.cabs.filter((c) => c.offset).map((c, i) => (
                  <text key={"o" + i} x={n.lead + c.x + c.geo.W / 2}
                    y={n.depth - c.geo.carcassDepth + c.offset - 14} textAnchor="middle"
                    fontSize="20" fill={ACC} fontFamily="ui-monospace, monospace">
                    {c.offset > 0 ? `+${fmt(c.offset)}` : fmt(c.offset)}
                  </text>
                ))}
              </g>
            )}
          </g>
        );
      })}
      {showDims && groups.map((g, gi) => (
        <text key={"nm" + g.run.id} x={b.x1 + 30} y={b.y0 + 40 + gi * 40}
          fontSize="22" fill={LINE} fontFamily="ui-monospace, monospace">
          {g.run.name}{g.mount > 0 ? ` — ${fmt(g.mount)} nad podłogą` : ""}
        </text>
      ))}
    </svg>
  );
}

/* Widok 3D calej zabudowy. Nie powtarza detalu pojedynczej szafki — na tym
   poziomie liczy sie bryla: korpusy, cokoly i fronty, ktore da sie otworzyc. */
function Assembly3D({ project, runs, open, yaw, pitch, angle, rpOf }) {
  const full = projectLayout(project);
  const groups = assemblyParts(project, runs, full);
  const L = runLayout(groups, full);
  const rysowane = new Set(groups.map((g) => g.run.id));
  /* Ramie jest opisane przy sasiednim pasie, a maskownica po stronie korpusu
     stoi w licu TEJ szafki — zeby ja narysowac, trzeba dojsc od szafki do jej
     ramienia. */
  const armOf = new Map();
  full.info.forEach((k) => { if (k.arm) armOf.set(k.arm.cab.index, k.arm); });
  const solids = [];
  /* Ciag narozny stoi w bryle pod katem prostym, wiec kazdy jego punkt idzie
     jeszcze przez `place`: z ukladu ciagu (x wzdluz sciany, z od lica w glab)
     na uklad calej zabudowy. Ciag bez naroznika dostaje przesuniecie zerowe. */
  let place = null;
  /* `bias` przyciaga bryle do widza przy sortowaniu scian. Uchwyt jest maly
     i siedzi tuz przy duzym froncie — bez tego przy niektorych katach front
     wypadal blizej niz on i uchwyt znikal pod plyta. */
  const box = (x0, y0, z0, x1, y1, z1, color, transform, alpha, bold, bias) => {
    let v = VERTS(x0, y0, z0, x1, y1, z1);
    if (transform) v = v.map(transform);
    if (place) v = v.map(place);
    solids.push({ v, color, alpha: alpha ?? 1, bold: !!bold, bias: bias || 0 });
  };

  groups.forEach((g) => {
    const n = L.info.get(g.run.id);
    place = (p) => {
      const q = n.at(n.lead + p.x, n.depth - p.z);
      return { x: q.x, y: p.y, z: -q.y };
    };
    const rp = rpOf ? rpOf(g.run) : null;
    /* Cokol to plyta stojaca pod frontami, a nie pelna kostka — rysowany na cala
       glebokosc pokazywal plyte tam, gdzie jej nie ma: przy bokach i z tylu. */
    if (rp && rp.h > 0 && g.cabs.length) {
      const cokT = g.cabs[0].geo.t;
      const cokZ = Math.max(0, Math.round(rp.setback || 0));
      box(0, g.mount, cokZ, rp.total, g.mount + rp.h, cokZ + cokT,
        g.cabs[0].mat.board.color, null, 0.95);
    }
    g.cabs.forEach((c) => {
      const cd = c.geo.carcassDepth;
      const t = c.geo.t;
      const bf = c.mat.board.color;
      const y0 = c.base, y1 = c.base + c.cab.H;
      /* Skorupa korpusu liczona tak samo jak w 3D pojedynczej szafki: boki moga
         byc skrocone przy narozniku, a wienca albo dna po prostu moze nie byc —
         rysowane na sztywno pokazywaly plyte tam, gdzie jej nie ma. */
      const cutSL = c.geo.cornerCut?.sideLeftDepth || 0;
      const cutSR = c.geo.cornerCut?.sideRightDepth || 0;
      if (c.geo.postSide !== "left")
        box(c.x, c.base + c.geo.leftY0, 0, c.x + t,
          c.base + c.geo.leftY0 + c.geo.leftLen, cd - cutSL, bf);
      if (c.geo.postSide !== "right")
        box(c.x + c.geo.W - t, c.base + c.geo.rightY0, 0, c.x + c.geo.W,
          c.base + c.geo.rightY0 + c.geo.rightLen, cd - cutSR, bf);
      /* Katownik w zewnetrznym narozniku zamiast boku od strony ramienia. */
      if (c.geo.postSide) {
        const pShc = shelfColorOf(c.cab, c.mat);
        const pBok = c.geo.postBack;
        const px = c.x + (c.geo.postSide === "right" ? c.geo.W - t - pBok : pBok);
        const bx = c.x + (c.geo.postSide === "right" ? c.geo.W - t - pBok - c.geo.postW : t + pBok);
        const zT = cd - Math.max(c.geo.backIntrusion, c.geo.postBack);
        box(px, c.base + c.geo.interior.y0, zT - c.geo.postW,
          px + t, c.base + c.geo.interior.y1, zT, pShc);
        box(bx, c.base + c.geo.interior.y0, zT - t,
          bx + c.geo.postW, c.base + c.geo.interior.y1, zT, pShc);
      }
      if (c.geo.hasBot)
        box(c.x + c.geo.botX0, c.base + c.geo.bottomY, 0,
          c.x + c.geo.botX1, c.base + c.geo.bottomY + t, cd, bf);
      if (c.geo.hasTop)
        box(c.x + c.geo.topX0, y1 - t, c.geo.isBlat ? -c.geo.blat.overBack : 0,
          c.x + c.geo.topX1, y1, c.geo.isBlat ? cd + c.geo.blat.overFront : cd, bf);
      if (c.cab.back !== "none")
        box(c.x, y0, cd - c.geo.tb, c.x + c.geo.W, y1, cd, c.mat.back.color);
      /* Maskownica katownika po stronie korpusu: bez niej w rogu zostawala dziura
         miedzy drzwiami tej szafki a frontem ramienia. */
      /* Wzmocnienia: pod blatem to one zastepuja wieniec, wiec bez nich bryla
         calej zabudowy pokazywala korpus otwarty od gory. */
      /* `r.z0` liczy sie od lica, a w bryle os z tak samo — przeliczanie go jak
         w rzucie z gory (gdzie zero jest z tylu) odbijalo wzmocnienia na druga
         strone szafki. */
      c.geo.levels.forEach((lv) => lv.cols.forEach((col) => (col.rails || []).forEach((r) => {
        box(c.x + r.x0, c.base + r.y0, r.z0, c.x + r.x1, c.base + r.y1, r.z0 + r.zLen, bf);
      })));
      /* Polki i przegrody. Po otwarciu drzwi to one sa cala trescia szafki, wiec
         bez nich bryla calej zabudowy pokazywala puste pudla. Glebokosci w `geo`
         licza sie od plecow, a tu os z idzie od lica — stad odbicie przez `cd`. */
      const shc3 = shelfColorOf(c.cab, c.mat);
      const zPolki = [cd - (c.geo.backIntrusion + c.geo.shelfDepth), cd - c.geo.backIntrusion];
      /* Polka siega az do lica, wiec jej przednia krawedz lezy w jednej
         plaszczyznie z drzwiami. Sciany sortuja sie po sredniej glebokosci
         i przy takim styku polka potrafila przebic sie na wierzch zamknietych
         drzwi — odsuwamy ja od widza o pol glebokosci szafki. */
      const wGlab = -Math.round(cd / 2);
      (c.geo.sepShelves || []).forEach((sh) => box(
        c.x + c.geo.interior.x0, c.base + sh.y, zPolki[0],
        c.x + c.geo.interior.x1, c.base + sh.y + t, zPolki[1], shc3,
        null, 1, false, wGlab));
      (c.geo.dividers || []).forEach((d) => box(
        c.x + d.x, c.base + d.y0, cd - (c.geo.backIntrusion + c.geo.dividerDepth),
        c.x + d.x + t, c.base + d.y1, cd - c.geo.backIntrusion, bf,
        null, 1, false, wGlab));
      c.geo.levels.forEach((lv) => lv.cols.forEach((col) => (col.shelves || []).forEach((sh) => {
        box(c.x + col.x0, c.base + sh.y, zPolki[0],
          c.x + col.x1, c.base + sh.y + c.geo.ts, zPolki[1], shc3,
          null, 1, false, wGlab);
      })));
      const tf = c.geo.tf;
      /* Uchwyt wystaje przed lico i w bryle calej zabudowy widac go tak samo jak
         przy pojedynczej szafce — bez niego fronty wygladaja jak gladkie plyty. */
      const uchwyt = handleOutOf(c.cab);
      const handleBar = (d, zLico, transform) => {
        if (!d.handle || !uchwyt) return;
        let hx0, hy0, hx1, hy1;
        if (d.type === "drawer") {
          const cy = d.y + d.h - Math.min(50, d.h / 2);
          hx0 = d.x + d.w / 2 - Math.min(120, d.w * 0.3);
          hx1 = d.x + d.w / 2 + Math.min(120, d.w * 0.3);
          hy0 = cy - 6; hy1 = cy + 6;
        } else {
          const cx = d.hingeSide === "left" ? d.x + d.w - 38 : d.x + 26;
          hx0 = cx - 6; hx1 = cx + 6;
          hy0 = d.y + d.h / 2 - Math.min(90, d.h * 0.25);
          hy1 = d.y + d.h / 2 + Math.min(90, d.h * 0.25);
        }
        box(c.x + hx0, c.base + hy0, zLico - uchwyt, c.x + hx1, c.base + hy1, zLico,
          "#3f3f46", transform, 1, false);
      };
      c.geo.doors.filter((d) => d.w > 0 && d.h > 0).forEach((d) => {
        const col = d.type === "blenda" ? bf : c.frontColor;
        if (!open) {
          box(c.x + d.x, c.base + d.y, -tf, c.x + d.x + d.w, c.base + d.y + d.h, 0, col, null, 1, true);
          if (d.type !== "fix" && d.type !== "blenda") handleBar(d, -tf, null);
          return;
        }
        if (d.type === "drawer") {
          // szuflada wyjezdza do przodu, front zostaje rownolegly do korpusu
          const out = Math.min(d.h * 1.6, cd * 0.75);
          box(c.x + d.x, c.base + d.y, -tf - out, c.x + d.x + d.w, c.base + d.y + d.h, -out,
            col, null, 0.9, true);
          handleBar(d, -tf - out, null);
          return;
        }
        if (d.type === "door") {
          const ang = (angle * Math.PI) / 180;
          const left = d.hingeSide === "left";
          const ox = c.x + (left ? d.x : d.x + d.w);
          const rot = (p) => rotAboutY(p, (left ? -1 : 1) * ang, ox, -tf);
          box(c.x + d.x, c.base + d.y, -tf, c.x + d.x + d.w, c.base + d.y + d.h, 0,
            col, rot, 0.85, true);
          handleBar(d, -tf, rot);
          return;
        }
        box(c.x + d.x, c.base + d.y, -tf, c.x + d.x + d.w, c.base + d.y + d.h, 0, col, null, 1, true);
        if (d.type !== "fix" && d.type !== "blenda") handleBar(d, -tf, null);
      });
      /* Wyciecia i elementy kolizyjne w bryle — bez nich zabudowa wygladalaby
         na gotowa tam, gdzie w rzeczywistosci cos przeszkadza. */
      c.geo.geoCuts.forEach((gc) => {
        box(c.x + gc.bx0, c.base + gc.cy0, cd - gc.bz1, c.x + gc.bx1, c.base + gc.cy1, cd - gc.bz0,
          "#b91c1c", null, 0.28);
      });
      (c.geo.geoObs || []).forEach((o) => {
        box(c.x + o.ox0, c.base + o.oy0, cd - o.oz1, c.x + o.ox1, c.base + o.oy1, cd - o.oz0,
          "#b45309", null, 0.32);
        // scianki zabudowy bryly — te same, ktore ida na formatki
        if (!o.mask || !o.maskChosen) return;
        const smat = shelfColorOf(c.cab, c.mat);
        const zf = (z) => cd - z;
        const needL = !o.touchLeft, needR = !o.touchRight;
        const needBack = !o.touchBack, needFront = !o.touchFront;
        const eB = needBack ? t : 0, eF = needFront ? t : 0;
        const mTop = c.base + (o.maskTop ?? o.oy1);
        if (needL) box(c.x + o.ox0 - t, c.base + o.oy0, zf(o.oz1 + eF), c.x + o.ox0, mTop, zf(o.oz0 - eB), smat);
        if (needR) box(c.x + o.ox1, c.base + o.oy0, zf(o.oz1 + eF), c.x + o.ox1 + t, mTop, zf(o.oz0 - eB), smat);
        if (needBack) box(c.x + o.ox0, c.base + o.oy0, zf(o.oz0), c.x + o.ox1, mTop, zf(o.oz0 - t), smat);
        if (needFront) box(c.x + o.ox0, c.base + o.oy0, zf(o.oz1 + t), c.x + o.ox1, mTop, zf(o.oz1), smat);
      });
    });
    /* Ramie szafki naroznej stoi w tym ciagu, ale nalezy do sasiedniego —
        w bryle to ono domyka rog. */
    n.arms.forEach((a) => {
      const c = a.cab;
      const x0 = a.u0 - n.lead;
      const y0 = c.base, y1 = c.base + c.cab.H;
      const tfA = c.geo.tf;
      const przyKoncuBok = a.outerAtEnd;   // rog przy poczatku, wiec bok na koncu
      /* Ramie rysowane jako pelna kostka wygladalo jak szafka z wiencem, nawet
         gdy szafka wienca nie ma. Skladamy je z plyt: dno, bok na wolnym koncu,
         wieniec tylko wtedy, gdy jest, a w jego miejsce para wzmocnien. */
      const tA = c.geo.t;
      const bA = c.mat.board.color;
      if (c.geo.hasBot) box(x0, y0, 0, x0 + a.len, y0 + tA, a.depth, bA);
      const bokU = przyKoncuBok ? x0 + a.len - tA : x0;
      box(bokU, y0, 0, bokU + tA, y1, a.depth, bA);
      if (c.geo.hasTop) {
        box(x0, y1 - tA, 0, x0 + a.len, y1, a.depth, bA);
      } else {
        /* Z przodu plyta na plask, z tylu stojaca — te same, ktore liczy rzut
           z gory, wiec bryla nie rozjedzie sie z rysunkiem. W ukladzie ramienia
           `v` idzie od sciany, a os z w bryle od lica, stad odbicie. */
        armPlan(a).rails.forEach((r) => {
          box(x0 + r.u0, y1 - (r.stojace ? r.wys : tA), a.depth - r.v1,
            x0 + r.u1, y1, a.depth - r.v0, bA);
        });
      }
      /* Polki ramienia — te same plyty co w kolumnie przy nim, wiec i te same
         wysokosci. Bez nich ramie po otwarciu bylo pustym pudlem. */
      armShelfYs(a.side, c.geo.levels).forEach((sy) => {
        box(x0, y0 + sy, 0, x0 + a.len, y0 + sy + c.geo.ts, a.depth - (c.geo.tb || tA),
          shelfColorOf(c.cab, c.mat), null, 1, false, -Math.round(a.depth / 2));
      });
      const apBack = armPlan(a).back;
      if (apBack) {
        box(x0 + apBack.u0, y0, a.depth - apBack.v1, x0 + apBack.u1, y1, a.depth - apBack.v0,
          apBack.plyta ? bA : c.mat.back.color, null, 0.95);
      }
      // cokol ramienia to plyta pod frontem, nie kloc na cala glebokosc
      if (c.plinthH > 0)
        box(x0, y0 - c.plinthH, 0, x0 + a.len, y0, tA, c.mat.board.color, null, 0.95);
      /* Front ramienia to zwykle drzwi: konczy sie na maskownicy katownika,
         zawias ma na koncu dalszym od naroza i otwiera sie razem z reszta. */
      const przyKoncu = a.outerAtEnd;                 // rog przy poczatku ramienia
      const kat = a.bracket;
      // front zachodzi na bok ramienia z luzem — tak samo jak w elewacji
      const fpA = armFrontPlan(a);
      const fw = fpA.w;
      const fu0 = przyKoncu ? fpA.odRogu : a.len - fpA.odRogu - fw;
      const otwiera = open && a.doors !== "fix";
      /* Uchwyt idzie przy krawedzi wolnej, czyli od strony rogu — zawias siedzi
         na przeciwnym koncu. Bez niego front ramienia wygladal w bryle jak
         zaslepka, choc to zwykle drzwi. */
      const uchwytA = handleOutOf(c.cab);
      const hcx = przyKoncu ? x0 + fu0 + 26 : x0 + fu0 + fw - 38;
      const hcy = y0 + c.cab.H / 2;
      const hh = Math.min(90, c.cab.H * 0.25);
      const uchwytBox = (rot) => {
        if (a.doors === "fix" || !(uchwytA > 0)) return;
        box(hcx - 6, hcy - hh, -tfA - uchwytA, hcx + 6, hcy + hh, -tfA, "#3f3f46", rot, 1, false, 400);
      };
      if (!otwiera) {
        box(x0 + fu0, y0, -tfA, x0 + fu0 + fw, y1, 0, c.frontColor, null, 1, true);
        uchwytBox(null);
      } else {
        const ang = (angle * Math.PI) / 180;
        const left = !przyKoncu;                      // zawias po stronie dalszej od rogu
        const ox = x0 + (left ? fu0 : fu0 + fw);
        const rot = (p) => rotAboutY(p, (left ? -1 : 1) * ang, ox, -tfA);
        box(x0 + fu0, y0, -tfA, x0 + fu0 + fw, y1, 0, c.frontColor, rot, 0.85, true);
        uchwytBox(rot);
      }
      /* Cztery plyty katownika liczy `bracketPlan` — ta sama funkcja co w rzucie
         z gory, zeby bryla i rzut nie rozjechaly sie o grubosc plyty. W ukladzie
         ramienia `v` idzie od sciany, a os z w bryle od lica, stad odbicie. */
      if (kat) {
        const shcA = shelfColorOf(c.cab, c.mat);
        bracketPlan(a).forEach((r) => {
          box(x0 + r.u, y0, a.depth - (r.v + r.h), x0 + r.u + r.w, y1, a.depth - r.v,
            r.front ? c.frontColor : shcA, null, 1, r.front);
        });
      }
    });
    /* Blat ciagu — plyta lezaca na wszystkim, co pod nia stoi, takze na ramieniu
       w rogu. W ukladzie ciagu z = 0 to lico, wiec blat wychodzi przed nie. */
    const rt = runTop(project, g.run);
    if (rt) {
      const kolB = rt.worktop
        ? (rt.mat.worktop || {}).color || "#8d7b68"
        : (rt.mat.board || {}).color || "#d8c3a0";
      worktopSpans(rt).forEach((s) => {
        /* Sciany sortuja sie po sredniej glebokosci, a blat to jedna wielka
           plyta: jej srodek wypada dalej niz wzmocnienia i katowniki tuz pod
           nia, wiec bez przyciagniecia do widza przebijaly sie przez wierzch.
           Polowa glebokosci wystarcza, zeby wygrac z tym, co lezy pod blatem,
           i jest wyraznie mniejsza od przeswitu do szafek gornych. */
        box(s.x0, g.mount + rt.y, n.depth - rt.depth, s.x1, g.mount + rt.y + rt.th, n.depth,
          kolB, null, 1, true, Math.round(rt.depth / 2));
      });
    }
  });
  place = null;

  if (!solids.length) return null;

  const cyw = Math.cos(yaw), syw = Math.sin(yaw);
  const cp = Math.cos(pitch), sp = Math.sin(pitch);
  /* Srodek obrotu bierzemy z gotowej bryly, a nie z samych szerokosci szafek —
     ciag narozny lezy w innym miejscu ukladu niz ten, od ktorego zaczynamy. */
  const all = solids.flatMap((s) => s.v);
  const mid = (k) => (Math.min(...all.map((p) => p[k])) + Math.max(...all.map((p) => p[k]))) / 2;
  const cx = mid("x"), cyc = mid("y"), cz = mid("z");
  const proj = (p) => {
    const x = p.x - cx, y = p.y - cyc, z = p.z - cz;
    const x1 = x * cyw + z * syw;
    const z1 = -x * syw + z * cyw;
    const y2 = y * cp - z1 * sp;
    return { X: x1, Y: -y2, D: y * sp + z1 * cp };
  };

  const faces = [];
  solids.forEach((sol) => {
    const pv = sol.v.map(proj);
    QUADS.forEach((q) => {
      const pts = q.map((i) => pv[i]);
      const depth = pts.reduce((a, b) => a + b.D, 0) / 4;
      const a = pts[0], b = pts[1], c2 = pts[2];
      const area = (b.X - a.X) * (c2.Y - a.Y) - (b.Y - a.Y) * (c2.X - a.X);
      faces.push({ pts, depth: depth - (sol.bias || 0), color: sol.color,
        shade: 0.62 + 0.38 * Math.min(1, Math.abs(area) / 40000),
        alpha: sol.alpha, bold: sol.bold });
    });
  });
  faces.sort((a, b) => b.depth - a.depth);

  const xs = faces.flatMap((f) => f.pts.map((p) => p.X));
  const ys = faces.flatMap((f) => f.pts.map((p) => p.Y));
  const minX = Math.min(...xs), mX = Math.max(...xs);
  const minY = Math.min(...ys), mY = Math.max(...ys);
  const pad = 60;
  const vb = `${minX - pad} ${minY - pad} ${mX - minX + 2 * pad} ${mY - minY + 2 * pad}`;
  const tint = (hex, f) => {
    const n = parseInt(String(hex).replace("#", ""), 16);
    const r = Math.min(255, Math.round(((n >> 16) & 255) * f));
    const g2 = Math.min(255, Math.round(((n >> 8) & 255) * f));
    const b = Math.min(255, Math.round((n & 255) * f));
    return `rgb(${r},${g2},${b})`;
  };
  return (
    <svg viewBox={vb} className="w-full h-auto" style={{ maxHeight: DRAW_MAX_H }}>
      {faces.map((f, i) => (
        <polygon key={i} points={f.pts.map((p) => `${p.X},${p.Y}`).join(" ")}
          fill={tint(f.color, f.shade)} fillOpacity={f.alpha}
          stroke={INK} strokeWidth={f.bold ? 2 : 1} strokeOpacity="0.55" />
      ))}
    </svg>
  );
}

function FrontView({ cab, geo, mat: matIn, open, showDims, showGaps, showLabels, showHardware, arm }) {
  const mat = texMat(matIn, cab.texture, cab.textureDir);
  const shc = shelfColorOf(cab, mat);
  // tryb wizualizacji: gdy fronty z tej samej plyty, pokaz realny kolor korpusu
  const frontColor = cab.realColors && cab.frontSameAsBoard !== false
    ? mat.board.color : mat.front.color;
  const { H } = cab;
  const W = geo.W;
  const pad = 160;
  const t = geo.t;
  // kolki pod polki: rysowane w widoku otwartym razem z okuciami
  const showPins = open && showHardware && cab.shelfMount !== "confirmat";
  const pinFromBottom = cab.pinDatum === "bottom";
  const anyPins = showPins && geo.levels.some((lv) => lv.cols.some((c) => (c.shelves || []).length));
  const pinLegend = anyPins && showDims;
  // swiatlo szuflady liczymy od gory dna skrzynki — sama liczba tego nie mowi
  const drawerLegend = open && showDims
    && geo.levels.some((lv) => lv.cols.some((c) => (c.drawers || []).length));
  const belowExtra = Math.max(geo.legBelow, cab.plinth.on && !geo.plinthInBody ? geo.plinthH : 0)
    + 60 + (pinLegend ? 70 : 0) + (drawerLegend ? 40 : 0);
  const hasBase = cab.legs?.on || cab.plinth.on;
  // wszystko rysowane pod szafka odmierzamy od jej realnego spodu — cokol
  // w obrysie siedzi juz w wysokosci H i niczego nie obniza
  const belowY = H + (cab.plinth.on && !geo.plinthInBody ? geo.plinthH : 0);
  // wymiary rysowane tuz przy szafce (boki, cokol, nozki) wymuszaja odsuniecie
  // wymiarow wysokosci dalej w lewo, zeby etykiety sie nie nakladaly
  const showSideLengthDims = showDims && (geo.leftLen !== H || geo.rightLen !== H);
  // wymiar wysokosci calkowitej ma sens tylko wtedy, gdy podstawa faktycznie
  // podnosi szafke — nozki schowane w swietle cokolu niczego nie zmieniaja
  const hasBaseDim =
    geo.legBelow > 0 || (cab.plinth.on && !geo.plinthInBody && geo.plinthH > 0);
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
          lvl: lv.i,
          where: j === 0 ? "left" : j === lv.cols.length - 1 ? "right" : "in",
        });
      })
    );
  const hasRailL = railDimCols.some((r) => r.where === "left");
  const hasRailR = railDimCols.some((r) => r.where === "right");
  // swiatlo poziomow opisujemy tylko w widoku otwartym i po lewej stronie —
  // w zamknietym powtarzaloby wysokosci frontow, ktore i tak sa wymiarowane
  const hasLevelDims = showDims && open && geo.levels.length > 0;
  const hasDrawerDims = showDims && !open && (geo.doors || []).some((d) => d.type === "drawer");
  // Wymiary po bokach ukladamy kolumnami: pierwsza tuz przy obrysie, kazda
  // kolejna dalej. Rezerwujemy tylko te kolumny, ktore naprawde rysujemy, wiec
  // gdy nie ma np. dlugosci bokow, reszta wymiarow siedzi znacznie blizej.
  const gapLabels = showGaps && !open; // opisy szczelin siedza tuz przy krawedzi
  let lxCur = gapLabels ? -26 - 70 : -26;
  const takeL = (w) => { const x = lxCur; lxCur -= w; return x; };
  let rxCur = gapLabels ? W + 26 + 70 : W + 26;
  const takeR = (w) => { const x = rxCur; rxCur += w; return x; };
  const dimRailLX = hasRailL ? takeL(180) : -26;
  const dimRailRX = hasRailR ? takeR(150) : W + 26;
  const dimSideLX = showSideLengthDims ? takeL(150) : -26;
  const dimSideRX = showSideLengthDims ? takeR(150) : W + 26;
  // przegrody poziome: gdzie wiercic konfirmaty, liczone od spodu boku
  const hasSepDims = showDims && geo.sepShelves.length > 0;
  const dimSepX = hasSepDims ? takeR(240) : W + 26;
  const dimDoorX = hasDoorDims ? takeL(90) : lxCur; // wysokosci drzwi po lewej
  const dimLevelX = hasLevelDims ? takeL(90) : lxCur; // swiatlo poziomow po lewej
  const dimDrawerX = hasDrawerDims ? takeR(90) : rxCur; // wysokosci frontow szuflad
  const dimHMainX = takeL(100);
  const dimHTotalX = hasBaseDim ? takeL(100) : dimHMainX;
  const leftExtra = Math.max(0, -lxCur - 40);
  // "nóżki 100" to szeroki opis — rezerwujemy mu miejsce po prawej
  const rightExtraF = Math.max(0, rxCur - W - 26) + (hasBase ? 140 : 0);
  // cokol pod lewym wymiarem boku, nozki pod prawym — tuz przy szafce
  const dimCokolX = -26;
  const dimNozkiX = W + 26;
  const blOvL = geo.isBlat ? geo.blat.overL : 0;
  const blOvR = geo.isBlat ? geo.blat.overR : 0;
  /* Szafka narozna nie konczy sie na korpusie: ramie idzie wzdluz drugiej
     sciany. W elewacji pokazujemy je jak rozwiniecie — obok korpusu, za linia
     naroza — bo inaczej z rysunku znika polowa mebla. */
  const armLen = arm ? Math.max(0, arm.len) : 0;
  const armL = !!arm && arm.side === "left";
  const vb = `${-pad - leftExtra - blOvL - (armL ? armLen : 0)} ${-pad} ${W + armLen + blOvL + blOvR + 2 * pad + leftExtra + rightExtraF} ${H + pad + belowExtra + 60}`;
  const fy = (y) => H - y;
  const bf = mat.board.color;
  const ff = frontColor;
  const topY = 0;
  const bottomY = fy(geo.bottomY + t);
  // wymiary wewnetrzne rysujemy w swietle kolumny, omijajac element staly;
  // gdy widac okucia, odsuwamy je dalej, zeby nie wchodzily na opisy zawiasow
  const dimColX = (c) =>
    (c.fix && c.fix.side === "left" ? Math.max(c.x0, c.fix.x + c.fix.w) : c.x0)
    + (open && showHardware ? 116 : 46);
  // baza wymiarowania otworow pod kolki. Domyslnie dolna krawedz elementu,
  // w ktory wiercimy (lewy bok dla pierwszej kolumny, inaczej przegroda po jej
  // lewej stronie) — tak sie mierzy plyte lezaca na stole. W trybie "od dna"
  // liczymy od gornego lica dna, a przy jego braku od spodu wnetrza.
  const pinRef = (c) => {
    if (pinFromBottom) return geo.interior.y0;
    if (c.j === 0) return geo.leftY0;
    const dv = geo.dividers.find((d) => Math.abs(d.x + t - c.x0) < 2 || Math.abs(d.x - (c.x0 - t)) < 2);
    return dv ? dv.y1 - dv.h : geo.leftY0;
  };
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
    <svg viewBox={vb} className="w-full h-auto" style={{ maxHeight: DRAW_MAX_H }}>
      <GrainDefs mat={matIn} on={cab.texture} dir={cab.textureDir} />
      <PrzejscieDefs />
      <rect x="0" y="0" width={W} height={H} fill="#fafaf9" stroke="#e7e5e4" strokeWidth="1" />

      {/* Ramie w rozwinieciu: pas drugiej sciany dostawiony do korpusu. Rysujemy
          je pod korpusem, zeby wszystko, co przy narozu, zostalo na wierzchu. */}
      {arm && armLen > 0 && (() => {
        const ax0 = armL ? -armLen : W;
        /* Front ramienia konczy sie przy rogu na maskownicy katownika, a na
           wolnym koncu zachodzi na bok ramienia — tak jak drzwi szafki na jej
           bok. `armFrontPlan` liczy to raz, dla rysunku i dla formatki. */
        const fp = armFrontPlan(arm);
        const fw = fp.w;
        const fx = armL ? -(fp.odRogu + fw) : ax0 + fp.odRogu;
        // wewnetrzne lico boku ramienia — tam siedza puszki zawiasow
        const licoBoku = armL ? ax0 + t : ax0 + armLen - t;
        const maskW = arm.bracket ? arm.bracket.odRamienia - arm.bracket.luz : 0;
        const plinthH = cab.plinth.on && !geo.plinthInBody ? geo.plinthH : 0;
        /* Lico korpusu za maskownica jest otwarte — tamtedy siega sie do rogu.
           Puste czytalo sie jak dziura miedzy drzwiami a kątownikiem, wiec
           zaznaczamy je jako przejscie. Po otwarciu drzwi i tak widac wnetrze,
           wiec wtedy pola nie ma. */
        const wolne = Math.max(0, Math.round(arm.free));
        const przejW = Math.max(0, W - wolne);
        const przejX = armL ? 0 : wolne;
        return (
          <g>
            {!open && przejW > 0 && (
              <g>
                <rect x={przejX} y="0" width={przejW} height={H}
                  fill={bf} fillOpacity="0.25" stroke={ACC} strokeWidth="2"
                  strokeDasharray="14 10" />
                <rect x={przejX} y="0" width={przejW} height={H}
                  fill={`url(#${PRZEJSCIE_ID})`} stroke="none" />
              </g>
            )}
            <rect x={ax0} y="0" width={armLen} height={H}
              fill="#fafaf9" stroke="#e7e5e4" strokeWidth="1" />
            {plinthH > 0 && (
              <rect x={ax0} y={H} width={armLen} height={plinthH}
                fill={bf} stroke={INK} strokeWidth="2" opacity="0.75" />
            )}
            {/* Ramie stoi na wlasnych nozkach tak samo jak korpus — bez nich
                wyglada, jakby wisialo nad cokolem. */}
            {cab.legs?.on && armLen > 160 && [ax0 + 40, ax0 + armLen - 80].map((lx, k) => (
              <rect key={"anz" + k} x={lx} y={H - geo.legTop} width={40} height={geo.legH}
                rx={legRound(cab) ? 20 : 0} fill={legColorOf(cab)} stroke={INK} strokeWidth="2"
                opacity={geo.legTop > 0 ? 0.5 : 1} />
            ))}
            {open && (() => {
              /* Wzmocnienia ramienia widac po otwarciu tak samo jak te w szafce:
                 stojace przy plecach na cala swoja wysokosc, plaskie tuz pod
                 blatem. Wysokosc bierzemy z wzmocnien tej szafki, bo leza na
                 tym samym poziomie. */
              const moje = ((geo.levels[geo.levels.length - 1] || {}).cols || [])
                .flatMap((c) => c.rails || []);
              return armPlan(arm, true).rails.map((r, k) => {
                const wz = moje.find((q) => (q.orient === "front") === r.stojace) || moje[0];
                if (!wz) return null;
                const u0 = Math.max(0, r.u0), u1 = Math.min(armLen, r.u1);
                if (!(u1 > u0)) return null;
                return (
                  <rect key={"apw" + k} x={armL ? -u1 : W + u0} y={fy(wz.y1)}
                    width={u1 - u0} height={wz.y1 - wz.y0}
                    fill={bf} stroke={INK} strokeWidth="2" opacity={r.stojace ? 0.9 : 0.7} />
                );
              });
            })()}
            {open && armShelfYs(arm.side, geo.levels).map((sy, k) => (
              <rect key={"aps" + k} x={ax0} y={fy(sy + geo.ts)} width={armLen} height={geo.ts}
                fill={bf} stroke={INK} strokeWidth="2" />
            ))}
            {/* Bok zamykajacy ramie na wolnym koncu — ta sama plyta, ktora
                w rzucie z gory konczy ramie. Rysowany przed frontem, bo front
                nakladany na niego zachodzi. */}
            <rect x={armL ? ax0 : ax0 + armLen - t} y="0" width={t} height={H}
              fill={bf} stroke={INK} strokeWidth="2" />
            {!open && (
              <rect x={fx} y="0" width={fw} height={H}
                fill={ff} stroke={INK} strokeWidth="2" />
            )}
            {/* Front ramienia to zwykle drzwi: zawias na koncu dalszym od rogu,
                uchwyt przy rogu. Po otwarciu zostaje obrys skrzydla, plyta
                widziana od czola i puszki zawiasow na boku — tak samo jak przy
                drzwiach szafki. */}
            {arm.doors !== "fix" && (() => {
              const zawiasPrawy = !armL;
              const uchwytOut = handleOutOf(cab);
              if (!open) {
                if (!(uchwytOut > 0) || fw <= 60) return null;
                return (
                  <rect x={zawiasPrawy ? fx + 30 : fx + fw - 45} y={fy(H * 0.5) - 60}
                    width={15} height={120} rx="5" fill="#52525b" opacity="0.9" />
                );
              }
              /* Te same wysokosci co zawiasy drzwi tej szafki — front ramienia
                 jest tak samo wysoki, wiec maja stanac w jednej linii. */
              const dRef = (geo.doors || [])
                .find((d) => d.h > 0 && d.type === "door" && (d.hingePts || []).length);
              const ile = Math.max(2, Math.min(4, Math.round(H / 500) + 1));
              const hys = dRef ? dRef.hingePts
                : Array.from({ length: ile }, (_, k) => (H * (k + 1)) / (ile + 1));
              return (
                <g>
                  <rect x={fx} y="0" width={fw} height={H}
                    fill="none" stroke={LINE} strokeWidth="1.5" strokeDasharray="12 9" opacity="0.6" />
                  <path
                    d={`M ${zawiasPrawy ? fx + fw : fx} 0
                        L ${zawiasPrawy ? fx : fx + fw} ${fy(H / 2)}
                        L ${zawiasPrawy ? fx + fw : fx} ${H}`}
                    fill="none" stroke={INK} strokeWidth="1.8" opacity="0.5" />
                  <rect x={zawiasPrawy ? fx + fw - geo.tf : fx} y="0" width={geo.tf} height={H}
                    fill={ff} stroke={INK} strokeWidth="2" />
                  {/* Puszka siedzi na boku ramienia, w jego wewnetrznym licu —
                      po staremu stala na samym boku, jakby wisiala w powietrzu. */}
                  {showHardware && hys.map((hy, k) => (
                    <rect key={"azw" + k}
                      x={zawiasPrawy ? licoBoku - HINGE_W : licoBoku}
                      y={fy(hy) - HINGE_H / 2} width={HINGE_W} height={HINGE_H}
                      rx="3" fill="#71717a" stroke={INK} strokeWidth="1.5" />
                  ))}
                </g>
              );
            })()}
            {maskW > 0 && (
              <rect x={armL ? ax0 + armLen - maskW : ax0} y="0" width={maskW} height={H}
                fill={ff} stroke={INK} strokeWidth="2" />
            )}
            {/* linia naroza — za nia zaczyna sie juz druga sciana */}
            <line x1={armL ? 0 : W} y1={-30} x2={armL ? 0 : W} y2={H + plinthH + 30}
              stroke={ACC} strokeWidth="2" strokeDasharray="14 10" opacity="0.7" />
            {showDims && (
              <>
                <text x={ax0 + armLen / 2} y={fy(H / 2)} textAnchor="middle" fontSize="20"
                  fill={ACC} fontFamily="ui-monospace, monospace">ramię {fmt(armLen)}</text>
                <DimH x1={ax0} x2={ax0 + armLen} y={H + plinthH + 60}
                  label={fmt(armLen)} above={false} />
              </>
            )}
          </g>
        );
      })()}

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
          <rect x={40} y={H - geo.legTop} width={40} height={geo.legH}
            rx={legRound(cab) ? 20 : 0} fill={legColorOf(cab)} stroke={INK} strokeWidth="2"
            opacity={geo.legTop > 0 ? 0.5 : 1} />
          <rect x={W - 80} y={H - geo.legTop} width={40} height={geo.legH}
            rx={legRound(cab) ? 20 : 0} fill={legColorOf(cab)} stroke={INK} strokeWidth="2"
            opacity={geo.legTop > 0 ? 0.5 : 1} />
        </>
      )}

      {/* elementy wzmacniajace (per kolumna) — widok od czola */}
      {geo.levels.flatMap((lv) => lv.cols.flatMap((c) => (c.rails || []).map((r, ri) => (
        <rect key={`rail${lv.i}-${c.j}-${ri}`}
          x={r.x0} y={fy(r.y1)} width={r.x1 - r.x0} height={r.y1 - r.y0}
          fill={r.orient === "vertical" ? (shc) : bf}
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
            <rect key={`s${lv.i}-${c.j}-${k}`} x={c.x0} y={fy(s.y + geo.ts)} width={c.w} height={geo.ts}
              fill={bf} stroke={INK} strokeWidth="2" />
          ))
        )
      )}

      {/* Podpis przejscia do ramienia idzie dopiero tutaj, nad polkami
          i wzmocnieniami — pod nimi byl zaslaniany i puste lico czytalo sie
          jak dziura miedzy drzwiami a wzmocnieniem. */}
      {arm && armLen > 0 && !open && showDims && (() => {
        const wolne = Math.max(0, Math.round(arm.free));
        const przejW = Math.max(0, W - wolne);
        if (!(przejW > 260)) return null;
        const przejX = armL ? 0 : wolne;
        return (
          <text x={przejX + przejW / 2} y={fy(H / 2)} textAnchor="middle" fontSize="20"
            fill={ACC} fontFamily="ui-monospace, monospace">
            przejście do ramienia {fmt(przejW)}
          </text>
        );
      })()}

      {/* kolki podporowe pod polkami — os otworu na dolnej krawedzi polki */}
      {showPins &&
        geo.levels.flatMap((lv) =>
          lv.cols.flatMap((c) =>
            c.shelves.map((s, k) => (
              <g key={`pin${lv.i}-${c.j}-${k}`}>
                <circle cx={c.x0 + 7} cy={fy(s.y)} r="5" fill="#71717a" stroke={INK} strokeWidth="1.2" />
                <circle cx={c.x1 - 7} cy={fy(s.y)} r="5" fill="#71717a" stroke={INK} strokeWidth="1.2" />
                {showDims && (
                  <text x={(c.x0 + c.x1) / 2} y={fy(s.y) + 24} textAnchor="middle" fontSize="17"
                    fill={DIMC} fontFamily="ui-monospace, monospace">
                    otw. {fmt(s.y - pinRef(c))}
                  </text>
                )}
              </g>
            ))
          )
        )}

      {/* legenda — bez niej sama liczba nie mowi, od czego jest mierzona */}
      {pinLegend && (
        <text x={W / 2} y={belowY + (hasBase ? 160 : 150)} textAnchor="middle"
          fontSize="19" fill={DIMC} fontFamily="ui-monospace, monospace">
          otw. — oś otworu ⌀5 pod kołek, od {pinFromBottom
            ? (geo.hasBot ? "górnego lica dna" : "spodu wnętrza")
            : "dolnej krawędzi boku / przegrody"}
        </text>
      )}
      {drawerLegend && (
        <text x={W / 2} y={belowY + (hasBase ? 160 : 150) + (pinLegend ? 34 : 0)}
          textAnchor="middle" fontSize="19" fill={DIMC} fontFamily="ui-monospace, monospace">
          od dna — górne lico dna szuflady, {RAIL_TO_BOTTOM} + {fmt(geo.ts)} mm nad prowadnicą
        </text>
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
      {/* Maskownica katownika po stronie ramienia. Nalezy do tej szafki, wiec musi
          byc widoczna takze przy zakresie „Szafka" — inaczej za frontem jest
          pusto i nie widac, do czego on sie domyka. */}
      {arm && arm.bracket && arm.free > 0 && (() => {
        const wM = arm.bracket.odKorpusu - arm.bracket.luz;
        if (!(wM > 0)) return null;
        const x0 = arm.side === "right" ? arm.free - wM : W - arm.free;
        const d0 = (geo.doors || []).find((d) => d.h > 0 && d.type !== "blenda");
        const hy = d0 ? d0.h : H;
        const y0 = d0 ? d0.y : 0;
        return (
          <g>
            <rect x={x0} y={fy(y0 + hy)} width={wM} height={hy}
              fill={frontColor} stroke={INK} strokeWidth="2.5" />
            {showDims && hy > 170 && (
              <text x={x0 + wM / 2} y={fy(y0 + hy / 2) + 7} textAnchor="middle"
                fontSize="18" fill={INK} opacity="0.75"
                fontFamily="ui-monospace, monospace" transform={`rotate(-90 ${x0 + wM / 2} ${fy(y0 + hy / 2)})`}>
                kątownik {fmt(arm.bracket.w)}
              </text>
            )}
          </g>
        );
      })()}
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
            /* Odcinek zabudowany na staly (maskownica narozna) nie jest
               szczelina — nie ma czego tam mierzyc. */
            const zabud = (x0, x1) => (geo.builtFront || []).some(
              (b) => b.lvl === d.lvl && x0 >= b.x0 - 0.5 && x1 <= b.x1 + 0.5 && x1 > x0);
            // luz z lewej rysujemy tylko gdy nie ma sasiada (bok/przegroda) — sasiad da luz z prawej
            if (!leftNb && !zabud(leftWall, d.x))
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
            } else if (!zabud(d.x + d.w, rightWall)) {
              sideMarker(`gr${d.key}`, (d.x + d.w + rightWall) / 2, yMid, Math.round(rightWall - (d.x + d.w)), false);
            }
            // luz gorny liczymy tylko dla najwyzszego frontu kolumny, dolny dla najnizszego
            /* Luz gorny i dolny mierzymy do krawedzi pasma frontow TEGO poziomu.
               Odniesienie do calej szafki pokazywalo przy kilku poziomach
               odleglosc do wienca zamiast szczeliny nad przegroda. */
            const topRef = d.inset ? d.colY1 : d.bandHi != null ? d.bandHi
              : cab.frontMode === "overlay" ? H : geo.interior.y1;
            const botRef = d.inset ? d.colY0 : d.bandLo != null ? d.bandLo
              : cab.frontMode === "overlay" ? geo.bottomY : geo.interior.y0;
            if (colTop[d.colKey] === d && (d.inset || d.bandHi == null))
              marker(`gt${d.key}`, d.x + d.w / 2, topRef, Math.round(topRef - (d.y + d.h)), true);
            if (colBot[d.colKey] === d && (d.inset || d.bandLo == null))
              marker(`gb${d.key}`, d.x + d.w / 2, d.y, Math.round(d.y - botRef), false);

            // luz pionowy do frontu bezposrednio nad tym w tej samej kolumnie
            /* Nad przegroda spotykaja sie fronty z dwoch poziomow, wiec sasiada
               szukamy po numerze kolumny, a nie po kluczu z numerem poziomu. */
            let above = null;
            geo.doors.forEach((b2) => {
              if (!(b2.w > 0) || b2 === d || b2.y < d.y + d.h - 0.5) return;
              // musi byc realnie nad tym frontem, czyli zachodzic na jego szerokosc
              if (Math.min(d.x + d.w, b2.x + b2.w) - Math.max(d.x, b2.x) <= 0) return;
              if (!above || b2.y < above.y) above = b2;
            });
            if (above) {
              const val = Math.round(above.y - (d.y + d.h));
              const col = val < 2 ? ERRC : ACC;
              // kropka na styku, kreska wyprowadzona az za prawa krawedz frontu
              /* Opis wyprowadzamy pionowo nad kropke, a nie w prawo — wyprowadzony
                 w bok ladowal dokladnie tam, gdzie opis szczeliny miedzy sasiednimi
                 frontami, i oba robily sie nieczytelne. */
              const cxm = d.x + d.w / 2;
              const yv = fy(d.y + d.h);
              out.push(
                <g key={`gv${d.key}`}>
                  <circle cx={cxm} cy={yv} r="6" fill={col} />
                  <line x1={cxm} y1={yv} x2={cxm} y2={yv - 26}
                    stroke={col} strokeWidth="1.5" strokeDasharray="3 3" />
                  <text x={cxm} y={yv - 34} textAnchor="middle" fontSize="20"
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
              <DimV y1={leftTopY} y2={leftBottomY} x={dimSideLX}
                label={`bok L ${fmt(geo.leftLen)}`} c={LINE} />
              <DimV y1={rightTopY} y2={rightBottomY} x={dimSideRX}
                label={`bok P ${fmt(geo.rightLen)}`} left={false} c={LINE} />
            </>
          )}
          {(cab.legs?.on || cab.plinth.on) && (() => {
            const legH = geo.legH;
            const plH = cab.plinth.on && !geo.plinthInBody ? geo.plinthH : 0;
            // nozki i cokol pod korpusem nie stoja na sobie — cokol jest zabudowa
            // miedzy nozkami. Przy cokole w obrysie nozka siedzi w jego swietle,
            // wiec podnosi szafke tylko nadwyzka ponad wysokosc cokolu.
            const extra = Math.max(plH, geo.legBelow);
            if (legH <= 0 && extra <= 0) return null;
            return (
              <>
                {/* calkowita wysokosc z podstawa po lewej — tylko gdy podstawa
                    naprawde podnosi szafke, inaczej powtarzalaby wymiar H */}
                {extra > 0 && (
                  <DimV y1={0} y2={H + extra} x={dimHTotalX} label={`${fmt(H + extra)}`} c={LINE} />
                )}
                {/* cokol: mierzony przy prawej krawedzi korpusu (cokol jest szerokosci szafki) */}
                {plH > 0 && (
                  <DimV y1={H} y2={H + plH} x={dimCokolX} label={`cokół ${fmt(plH)}`}
                    c={LINE} />
                )}
                {/* nozki: mierzone znacznie dalej w prawo, zeby opis sie nie nakladal */}
                {legH > 0 && (
                  <DimV y1={H - geo.legTop} y2={H - geo.legTop + legH} x={dimNozkiX}
                    label={`nóżki ${fmt(legH)}`} left={false} c={LINE} />
                )}
              </>
            );
          })()}
          {hasSepDims &&
            geo.sepShelves.map((sh, i) => {
              /* Wiercimy od zewnatrz, wiec baza jest spod boku (y = 0), a nie
                 od wnetrza. Podajemy oba lica przegrody — miedzy nimi lezy
                 grubosc plyty i to w nia ida konfirmaty. */
              const lo = Math.round(sh.y);
              const hi = Math.round(sh.y + geo.t);
              return (
                <DimV key={"sep" + i} y1={fy(lo)} y2={fy(0)} x={dimSepX}
                  labelY={fy(lo)} label={`przegroda ${fmt(lo)}/${fmt(hi)}`}
                  left={false} c={LINE} />
              );
            })}
          {hasLevelDims &&
            geo.levels.map((lv) => (
              <DimV key={"lv" + lv.i} y1={fy(lv.y1)} y2={fy(lv.y0)} x={dimLevelX}
                label={`${fmt(lv.h)}`} c={lv.h < 60 ? WARNC : DIMC} />
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
              <DimH key={"c" + c.j} x1={c.x0} x2={c.x1} y={belowY + 90}
                label={`${fmt(c.w)}`} above={false} c={c.w < MIN_COL ? WARNC : DIMC} />
            ))}
          {/* szerokosci wszystkich frontow dolnego rzedu */}
          {!open &&
            (() => {
              const bottomLvl = geo.levels[0];
              if (!bottomLvl) return null;
              const seen = new Set();
              const yLine = belowY + 90;
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
                // jedyne swiatlo rowne calemu poziomowi juz jest zwymiarowane
                // przy lewej krawedzi szafki — nie powtarzamy go w srodku
                .filter((op) => op.h > 30 && !(c.openings.length === 1 && Math.round(op.h) === Math.round(lv.h)))
                .map((op) => (
                  <DimV key={`op${lv.i}-${c.j}-${op.k}`}
                    y1={fy(op.to)} y2={fy(op.from)} x={dimColX(c)}
                    label={`${fmt(op.h)}`} left={false} c={DIMC} />
                ))
            )
        )}

      {/* Swiatlo pionowe szuflady. Dol: gora dna skrzynki, czyli 26 mm od spodu
          prowadnicy (wymiar okucia, staly dla kazdej wysokosci boku) plus grubosc
          dna, ktore idzie z plyty polek. Gora: pierwsza przeszkoda — spod frontu
          szuflady wyzej albo gora swiatla poziomu (polka, przegroda, wieniec). */}
      {open && showDims &&
        geo.levels.flatMap((lv) =>
          lv.cols
            .filter((c) => c.kind === "drawers" && (c.drawers || []).length)
            .flatMap((c) => {
              const ds = [...c.drawers].sort((a, b) => a.y - b.y);
              return ds.map((dr, i) => {
                const bottom = dr.rail.y0 + RAIL_TO_BOTTOM + geo.ts;
                const top = i + 1 < ds.length ? ds[i + 1].y : lv.y1;
                const val = Math.round(top - bottom);
                if (val < 30) return null;
                return (
                  <DimV key={`du${lv.i}-${c.j}-${i}`}
                    y1={fy(top)} y2={fy(bottom)} x={c.x0 + 46}
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
      {railDimCols.flatMap(({ c, lvl, where }) =>
        c.drawers.map((dr, i) => {
          const val = Math.round(dr.rail.y0 - geo.interior.y0);
          if (val < 0) return null;
          // w srodku szafki chowamy wymiar przy prawej prowadnicy, zeby nie
          // wchodzil na wymiary swiatla szuflady rysowane przy lewej
          const x =
            where === "left" ? dimRailLX : where === "right" ? dimRailRX : c.x1 - RUNNER_W - 30;
          return (
            /* opis przy kresce tej prowadnicy — na srodku wymiaru odjechalby
               od kreski i przy kilku szufladach nie dalo sie ich powiazac */
            <DimV key={`rh${lvl}-${c.j}-${i}`} y1={fy(dr.rail.y0)} y2={fy(geo.interior.y0)} x={x}
              labelY={fy(dr.rail.y0)}
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

function RearView({ cab, geo, mat: matIn, showDims }) {
  const mat = texMat(matIn, cab.texture, cab.textureDir);
  const shc = shelfColorOf(cab, mat);
  const { H } = cab;
  const W = geo.W;
  const pad = 170;
  const rBelow = Math.max(
    geo.legBelow,
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
    <svg viewBox={vb} className="w-full h-auto" style={{ maxHeight: DRAW_MAX_H }}>
      <GrainDefs mat={matIn} on={cab.texture} dir={cab.textureDir} />
      {/* korpus widziany od tylu */}
      <rect x="0" y="0" width={W} height={H} fill="#fafaf9" stroke={LINE} strokeWidth="1.5" />
      {/* boki — widok od tylu, wiec lewy bok po prawej */}
      {/* Od strony ramienia boku nie ma — od tylu widac tam ramie katownika. */}
      {geo.postSide !== "left" && (
        <rect x={W - t} y={fy(geo.leftY0 + geo.leftLen)} width={t} height={geo.leftLen}
          fill={bf} stroke={INK} strokeWidth="2" />
      )}
      {geo.postSide !== "right" && (
        <rect x="0" y={fy(geo.rightY0 + geo.rightLen)} width={t} height={geo.rightLen}
          fill={bf} stroke={INK} strokeWidth="2" />
      )}
      {geo.postSide && (
        <rect x={geo.postSide === "right" ? t : W - t - geo.postW}
          y={fy(geo.interior.y1)} width={geo.postW} height={geo.interior.y1 - geo.interior.y0}
          fill={shc} stroke={INK} strokeWidth="2" />
      )}
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
            <rect key={`p${lv.i}-${c.j}-${k}`} x={mx(c.x0, c.w)} y={fy(sh.y + geo.ts)}
              width={c.w} height={geo.ts} fill="none" stroke={LINE} strokeWidth="1.5" strokeDasharray="8 6" />
          ))
        )
      )}

      {/* plecy */}
      {cab.back !== "none" && (
        <rect x={mx(bx, bw)} y={fy(by + bh)} width={bw} height={bh}
          fill={geo.backIsBoard
            ? (cab.backPos === "outside" && cab.backBoardMat !== "shelf" ? mat.board.color : (shc))
            : mat.back.color}
          stroke={INK} strokeWidth="2.5" opacity={geo.backIsBoard ? 0.95 : 0.72} />
      )}

      {/* Wzmocnienia widziane od tylu. Stojace przy plecach dolega do nich od
          srodka, plaskie lezy pod blatem — obu z tylu nie widac, wiec ida
          kreska, ale na wierzchu pleców, zeby w ogole bylo je widac. */}
      {geo.levels.flatMap((lv) => lv.cols.flatMap((c) => (c.rails || []).map((r, ri) => (
        <g key={`rwzm${lv.i}-${c.j}-${ri}`}>
          <rect x={mx(r.x0, r.x1 - r.x0)} y={fy(r.y1)}
            width={r.x1 - r.x0} height={r.y1 - r.y0}
            fill="none" stroke={LINE} strokeWidth="1.5" strokeDasharray="8 6" />
          {showDims && r.x1 - r.x0 > 220 && (
            <text x={mx(r.x0, r.x1 - r.x0) + (r.x1 - r.x0) / 2} y={fy(r.y0) - 8}
              textAnchor="middle" fontSize="17" fill={LINE} fontFamily="ui-monospace, monospace">
              {r.przyTyle ? "wzmocnienie tylne" : "wzmocnienie czołowe"} {fmt(r.x1 - r.x0)}
            </text>
          )}
        </g>
      ))))}

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
              fill={shc} stroke={INK} strokeWidth="2" opacity="0.9" />
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
          <rect x={40} y={H - geo.legTop} width={40} height={geo.legH}
            rx={legRound(cab) ? 20 : 0} fill={legColorOf(cab)} stroke={INK} strokeWidth="2"
            opacity={geo.legTop > 0 ? 0.5 : 1} />
          <rect x={W - 80} y={H - geo.legTop} width={40} height={geo.legH}
            rx={legRound(cab) ? 20 : 0} fill={legColorOf(cab)} stroke={INK} strokeWidth="2"
            opacity={geo.legTop > 0 ? 0.5 : 1} />
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

function TopView({ cab, geo, mat: matIn, showDims, showShelves, showHardware, arm }) {
  const mat = texMat(matIn, cab.texture, cab.textureDir);
  const shc = shelfColorOf(cab, mat);
  const { D } = cab;
  const W = geo.W;
  const pad = 160;
  // patrzymy z gory: X = szerokosc, Y (w dol na ekranie) = glebokosc, przod u dolu
  const frontExtra = cab.frontMode === "overlay" ? geo.tf : 0;
  const tOvL = geo.isBlat ? geo.blat.overL : 0;
  const tOvR = geo.isBlat ? geo.blat.overR : 0;
  const tOvF = geo.isBlat ? geo.blat.overFront : 0;
  const tOvB = geo.isBlat ? geo.blat.overBack : 0;
  /* Szafka narozna nie konczy sie na korpusie — ramie idzie w bok wzdluz drugiej
     sciany i rysunek musi je objac, inaczej widac tylko kawalek mebla. */
  const armLen = arm ? arm.len + geo.tf : 0;
  const vb = `${-pad - tOvL} ${-pad - tOvB} ${W + tOvL + tOvR + 2 * pad + 120} ${D + tOvB + tOvF + 2 * pad + 100 + frontExtra + armLen}`;
  const bf = mat.board.color;
  const t = geo.t;
  const cd = geo.carcassDepth;

  return (
    <svg viewBox={vb} className="w-full h-auto" style={{ maxHeight: DRAW_MAX_H }}>
      <GrainDefs mat={matIn} on={cab.texture} dir={cab.textureDir} />
      {/* obrys korpusu z gory */}
      <rect x="0" y="0" width={W} height={cd} fill="#fafaf9" stroke={LINE} strokeWidth="1.5" />
      {/* Ramie szafki naroznej: biegnie wzdluz drugiej sciany, wiec w ukladzie
          tej szafki idzie w bok od jej lica. `v` to glebokosc ramienia od tamtej
          sciany, `u` — dlugosc liczona od lica korpusu. */}
      {arm && (() => {
        const left = arm.side === "left";
        const ax = (v, szer) => (left ? v : W - v - szer);
        const ay = (u) => cd + u;
        const vLico = arm.depth;
        return (
          <g>
            <rect x={ax(0, arm.depth)} y={ay(0)} width={arm.depth} height={arm.len}
              fill="#fafaf9" stroke={LINE} strokeWidth="1.5" />
            {/* bok zamykajacy ramie na wolnym koncu */}
            <rect x={ax(0, arm.depth)} y={ay(arm.len - t)} width={arm.depth} height={t}
              fill={bf} stroke={INK} strokeWidth="2" />
            {/* plecy i wzmocnienia — te same, co w rzucie calej zabudowy */}
            {(() => {
              const ap = armPlan(arm, true);
              const pas = (r, fill, op) => (
                <rect x={ax(r.v0, r.v1 - r.v0)} y={ay(r.u0)}
                  width={r.v1 - r.v0} height={r.u1 - r.u0}
                  fill={fill} stroke={INK} strokeWidth="1.5" opacity={op} />
              );
              return (
                <>
                  {ap.back && pas(ap.back, ap.back.plyta ? bf : mat.back.color, 1)}
                  {ap.rails.map((r, k) => (
                    <g key={"awz" + k}>{pas(r, bf, 0.55)}</g>
                  ))}
                </>
              );
            })()}
            {/* front ramienia zaczyna sie za katownikiem i luzem, a na wolnym
                koncu zachodzi na bok ramienia — bez luzu stal z nim rowno */}
            {(() => {
              const fp = armFrontPlan(arm);
              return (
                <rect x={ax(cab.frontMode === "inset" ? vLico - geo.tf : vLico, geo.tf)}
                  y={ay(fp.odRogu)} width={geo.tf} height={fp.w}
                  fill={mat.front.color} stroke={INK} strokeWidth="2" />
              );
            })()}
            {bracketPlan(arm, true).map((r, k) => (
              <rect key={"kat" + k} x={ax(r.v, r.h)} y={ay(r.u)} width={r.h} height={r.w}
                fill={r.front ? mat.front.color : bf} stroke={INK} strokeWidth="2" />
            ))}
            {showDims && (
              <text x={ax(arm.depth / 2, 0)} y={ay(arm.len / 2)} textAnchor="middle"
                fontSize="22" fill={ACC} fontFamily="ui-monospace, monospace">
                ramię {fmt(arm.len)}
              </text>
            )}
          </g>
        );
      })()}
      {/* boki — skrocone przy narozniku z wycieciem/elementem */}
      {geo.postSide !== "left" && (
        <rect x="0" y={geo.cornerCut?.sideLeftDepth || 0} width={t}
          height={cd - (geo.cornerCut?.sideLeftDepth || 0)} fill={bf} stroke={INK} strokeWidth="2" />
      )}
      {geo.postSide !== "right" && (
        <rect x={W - t} y={geo.cornerCut?.sideRightDepth || 0} width={t}
          height={cd - (geo.cornerCut?.sideRightDepth || 0)} fill={bf} stroke={INK} strokeWidth="2" />
      )}
      {/* katownik w zewnetrznym narozniku — zastepuje bok i plyte plecow */}
      {geo.postSide && (() => {
        const pOd = Math.max(geo.backIntrusion, geo.postBack);
        const pBok = geo.postBack;
        return (
        <g>
          <rect x={geo.postSide === "right" ? W - t - pBok : pBok} y={pOd}
            width={t} height={geo.postW} fill={shc} stroke={INK} strokeWidth="2" />
          <rect x={geo.postSide === "right" ? W - t - pBok - geo.postW : t + pBok} y={pOd}
            width={geo.postW} height={t} fill={shc} stroke={INK} strokeWidth="2" />
        </g>
        );
      })()}
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
                fill={shc} fillOpacity="0.35"
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
        /* Szafka narozna ma front tylko tam, gdzie nie wchodzi ramie — dalej lico
           jest otwarte i prowadzi w ramie. Pas ciagniety przez cala szerokosc
           rysowal tam sciane, ktorej nie ma. Przy samym rogu konczy sie jeszcze
           wczesniej: tam stoi maskownica katownika i drzwi na nia nie wchodza —
           z gory wygladalo to, jakby front nachodzil na wspornik. */
        const maskK = arm && arm.bracket ? arm.bracket.odKorpusu - arm.bracket.luz : 0;
        const licoOd = arm ? (arm.side === "right" ? 0 : W - arm.free + maskK) : 0;
        const licoDo = arm ? (arm.side === "right" ? arm.free - maskK : W) : W;
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
              {Math.min(x1, licoDo) > Math.max(x0, licoOd) && (
                <rect x={Math.max(x0, licoOd)} y={z0}
                  width={Math.min(x1, licoDo) - Math.max(x0, licoOd)} height={geo.tf}
                  fill={ffc} stroke={INK} strokeWidth="2" />
              )}
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
          ? (cab.backPos === "outside" && cab.backBoardMat !== "shelf" ? mat.board.color : (shc))
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
        const smat = shc;
        // obszar wneki we wspolrzednych widoku z gory (y = glebokosc od tyłu)
        const rx = gc.bx0;
        const ry = gc.bz0;
        const rw = gc.bx1 - gc.bx0;
        const rh = gc.bz1 - gc.bz0;
        return (
          <g key={"cut" + ci}>
            <rect x={rx} y={ry} width={rw} height={rh}
              fill={ERRC} opacity="0.15" stroke={ERRC} strokeWidth="1.5" strokeDasharray="6 4" />
            <CutMaskTop gc={gc} t={t} color={smat} />
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
            <ObsMaskTop o={o} t={t} W={W} color={shc} />
            <text x={o.ox0 + o.ow / 2} y={o.oz0 + o.od / 2 + 6} textAnchor="middle"
              fontSize="18" fill="#6d28d9" fontFamily="ui-monospace, monospace">
              {fmt(o.ow)}×{fmt(o.od)}
            </text>
            {showDims && (() => {
              // bryla w narozniku wchodzi w plyte boku — wtedy mierzymy od krawedzi szafki
              const cols = geo.levels[0]?.cols || [];
              const host = cols.find((c) => o.ox0 >= c.x0 - 1 && o.ox1 <= c.x1 + 1);
              // bryla przy boku wchodzi w plyte, wiec nie miesci sie w zadnej
              // kolumnie — do wymiaru wolnej glebokosci wystarczy ta, ktora
              // zachodzi, inaczej zabudowa zostawala bez zwymiarowania
              const hostAny = host || cols.find((c) => Math.min(c.x1, o.ox1) - Math.max(c.x0, o.ox0) > 0);
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
                  {hostAny && hostAny.kind !== "drawers" && o.mask && (() => {
                    const gb = o;
                    const wallL = gb.touchLeft ? hostAny.x0 : o.ox0 - geo.t;
                    const wallR = gb.touchRight ? hostAny.x1 : o.ox1 + geo.t;
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
      {/* nozek nie rysujemy z gory — schowane pod korpusem, tylko myla rzut */}

      <text x={W / 2} y={cd + 150} textAnchor="middle" fontSize="22" fill={LINE}
        fontFamily="ui-monospace, monospace">widok z góry — tył u góry, przód u dołu</text>
    </svg>
  );
}

function SideView({ cab, geo, mat: matIn, showDims, which, showHardware }) {
  const mat = texMat(matIn, cab.texture, cab.textureDir);
  const shc = shelfColorOf(cab, mat);
  const sideRight = which === "right";
  const { H, D } = cab;
  const pad = 160;
  const rightExtra = cab.frontMode === "overlay" ? geo.tf : 0;
  const below = Math.max(
    geo.legBelow,
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

  // polki przelotowe sa konstrukcyjne (plyta korpusu), polki w kolumnach moga
  // byc z cienszej plyty — rysujemy je wiec osobno, kazda swoja gruboscia
  const allShelves = [
    ...geo.sepShelves.map((s) => ({ y: s.y, th: geo.t })),
    ...geo.levels.flatMap((lv) => lv.cols.flatMap((c) => c.shelves.map((s) => ({ y: s.y, th: geo.ts })))),
  ];

  return (
    <svg viewBox={vb} className="w-full h-auto" style={{ maxHeight: DRAW_MAX_H }}>
      <GrainDefs mat={matIn} on={cab.texture} dir={cab.textureDir} />
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
          <rect x={xC + 40} y={H - geo.legTop} width={40} height={geo.legH}
            rx={legRound(cab) ? 20 : 0} fill={legColorOf(cab)} stroke={INK} strokeWidth="2"
            opacity={geo.legTop > 0 ? 0.5 : 1} />
          <rect x={xC + cd - 80} y={H - geo.legTop} width={40} height={geo.legH}
            rx={legRound(cab) ? 20 : 0} fill={legColorOf(cab)} stroke={INK} strokeWidth="2"
            opacity={geo.legTop > 0 ? 0.5 : 1} />
        </>
      )}

      {allShelves.map((s, i) => (
        <rect key={i} x={xC + geo.backIntrusion} y={fy(s.y + s.th)}
          width={geo.shelfDepth} height={s.th} fill={bf} stroke={INK} strokeWidth="2" />
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
          ? (cab.backPos === "outside" && cab.backBoardMat !== "shelf" ? mat.board.color : (shc))
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
              fill={shc} stroke={INK} strokeWidth="2" opacity="0.9" />
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
                fill={shc} stroke={INK} strokeWidth="2" />
            )}
            {o.mask && !o.touchBack && (
              <rect x={xC + o.oz0 - geo.t} y={fy(o.maskTop ?? o.oy1)} width={geo.t} height={(o.maskTop ?? o.oy1) - o.oy0}
                fill={shc} stroke={INK} strokeWidth="2" />
            )}
          </g>
        );
      })}

      {/* elementy wzmacniajace z boku (x = xC + glebokosc od tylu; tyl po lewej) */}
      {geo.levels.flatMap((lv) => lv.cols.flatMap((c) => (c.rails || []).map((r, ri) => (
        <rect key={`srail${lv.i}-${c.j}-${ri}`}
          x={xC + cd - (r.z0 + r.zLen)} y={fy(r.y1)} width={r.zLen} height={r.y1 - r.y0}
          fill={r.orient === "vertical" ? (shc) : bf}
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
  const { H } = cab;
  const W = geo.W;
  const bf = mat.board.color;
  const shc = shelfColorOf(cab, mat);
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
  /* Od strony ramienia boku nie ma — stoi tam katownik przy plecach. */
  if (geo.postSide !== "left")
    box(0, geo.leftY0, 0, t, geo.leftY0 + geo.leftLen, cd - cutSL, bf);
  if (geo.postSide !== "right")
    box(W - t, geo.rightY0, 0, W, geo.rightY0 + geo.rightLen, cd - cutSR, bf);
  if (geo.postSide) {
    const pShc = shelfColorOf(cab, mat);
    const pBok = geo.postBack;
    const px = geo.postSide === "right" ? W - t - pBok : pBok;
    const bx = geo.postSide === "right" ? W - t - pBok - geo.postW : t + pBok;
    // plecy zajmuja swoja grubosc, katownik staje dopiero przed nimi
    const zT = cd - Math.max(geo.backIntrusion, geo.postBack);
    box(px, geo.interior.y0, zT - geo.postW, px + t, geo.interior.y1, zT, pShc);
    box(bx, geo.interior.y0, zT - t, bx + geo.postW, geo.interior.y1, zT, pShc);
  }
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
        box(c.x0, sh.y, geo.backIntrusion, c.x1, sh.y + geo.ts,
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
    // nozka konczy sie pod dnem: przy cokole w obrysie to wysokosc cokolu,
    // inaczej spod korpusu
    const top = geo.legTop;
    const lh = geo.legH;
    const ins = 40;
    [[ins, ins], [W - ins - 40, ins], [ins, cd - ins - 40], [W - ins - 40, cd - ins - 40]]
      .forEach(([lx, lz]) => box(lx, top - lh, lz, lx + 40, top, lz + 40, legColorOf(cab)));
  }

  (geo.geoObs || []).forEach((o) => {
    // w 3D z=cd to tyl, a geometria bryly ma tyl przy oz=0 — odwracamy
    box(o.ox0, o.oy0, cd - o.oz1, o.ox1, o.oy1, cd - o.oz0, "#7c3aed", null, 0.45);
  });
  geo.geoCuts.filter((gc) => gc.mask).forEach((gc) => {
    const smat = shc;
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
    const smat = shc;
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
    const depth = handleOutOf(cab); // ile uchwyt wystaje przed front
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
    <svg viewBox={vb} className="w-full h-auto select-none" style={{ maxHeight: DRAW_MAX_H }}>
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

/* To samo co Field, ale zwyklym divem. Potrzebne wszedzie tam, gdzie w srodku
   siedza przyciski-przelaczniki: <label> przekazuje klikniecie swojemu
   pierwszemu przyciskowi, wiec przelacznik zapalilby sie i od razu zgasil. */
const Group = ({ label, children, hint }) => (
  <div className="block">
    <span className="block text-xs uppercase tracking-wider text-stone-500 mb-1">{label}</span>
    {children}
    {hint && <span className="block text-xs text-stone-400 mt-1">{hint}</span>}
  </div>
);

/* Kafelki styków, na których wolno przeciąć długą płaszczyznę. Wspólne dla
   cokołu i blatu, bo reguła jest ta sama. */
const SplitPicker = ({ label, what, s, onToggle, onAuto }) =>
  s && s.joints.length ? (
    <Group label={label}
      hint={`Cięcie idzie na styku korpusów, żeby szew wypadł w linii szczeliny między frontami. Sam dokłada się dopiero wtedy, gdy ${what} nie mieści się w formatce.`}>
      <div className="flex flex-wrap items-center gap-1.5">
        {s.joints.map((j) => {
          const on = s.cuts.includes(j);
          return (
            <button key={j} onClick={() => onToggle(j)}
              title={on ? "Zdejmij podział z tego styku" : `Potnij ${what} na tym styku`}
              className={"rounded-full border px-2.5 py-1 font-mono text-xs transition " +
                (on ? "border-teal-600 bg-teal-700 text-white"
                    : "border-stone-300 bg-white text-stone-500 hover:border-stone-400")}>
              {fmt(j)}
            </button>
          );
        })}
        {!s.auto && (
          <button onClick={onAuto}
            className="rounded-full border border-dashed border-stone-400 px-2.5 py-1 text-xs text-stone-500 hover:text-stone-700">
            auto
          </button>
        )}
      </div>
    </Group>
  ) : null;

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
        className={"flex-1 whitespace-nowrap px-2 py-1.5 text-xs transition-colors " +
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
/* Kolejnosc materialow w zestawieniu: blat na gorze, bo idzie osobnym zamowieniem
   i najczesciej sie o niego pyta, HDF na dole, bo to drobiazg. Reszta zostaje
   w kolejnosci, w jakiej powstaje geometria. */
const MAT_ORDER = { worktop: 0, front: 1, board: 2, shelf: 2, mirror: 3, back: 4 };
const groupPanels = (panels) => {
  const map = new Map();
  panels.forEach((p) => {
    const e = p.edges;
    const key = [p.matKey, p.a, p.b, e.a1, e.a2, e.b1, e.b2, p.name].join("|");
    if (map.has(key)) map.get(key).qty += p.qty;
    else map.set(key, { ...p });
  });
  return [...map.values()]
    .map((p, i) => ({ p, i }))
    .sort((x, y) => (MAT_ORDER[x.p.matKey] ?? 2) - (MAT_ORDER[y.p.matKey] ?? 2) || x.i - y.i)
    .map(({ p }) => p);
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

const NoteLine = ({ text, color, icon, przed, editLevels, editItemLevels, editItemCab, cab, setGap, runFix, setMatDepth }) => {
  const [txt, ...actions] = text.split("|");
  const btns = actions.map((action) => {
    if (action.startsWith("worktop:")) {
      const d = Number(action.split(":")[1]);
      return { label: `Zmień na blat ${fmt(d)} mm`, run: () => setMatDepth && setMatDepth(d) };
    }
    if (action === "plinthauto" || action === "topauto")
      return { label: "Dobierz podział automatycznie", run: () => runFix && runFix(action) };
    if (action.startsWith("topcut:")) {
      return { label: action === "topcut:1"
        ? "Zamów blat docięty na wymiar"
        : "Zamów cały pas, dotnij na miejscu",
        run: () => runFix && runFix(action) };
    }
    if (action.startsWith("rundepth:")) {
      // „rundepth:570" — ten ciag, „rundepth:570@c2" — sasiedni, po nazwie w akcji
      const [d, gdzie] = action.slice("rundepth:".length).split("@");
      return { label: gdzie
        ? `Zmniejsz głębokość sąsiedniego ciągu do ${fmt(Number(d))} mm`
        : `Zmniejsz głębokość szafek do ${fmt(Number(d))} mm`,
        run: () => runFix && runFix(action) };
    }
    // rozjazd z ciagiem da sie naprawic z dwoch stron — szafka albo caly ciag
    if (action.startsWith("runcab:") || action.startsWith("runrun:")) {
      const [kind, field, val] = action.split(":");
      const toRun = kind === "runrun";
      const label = field === "plinth"
        ? (toRun ? "Ustaw cokół ciągu jak tutaj" : "Wyrównaj cokół do ciągu")
        : field === "hangerMode"
        ? (toRun ? "Tak ma wisieć cały ciąg" : "Wieszaj tę szafkę jak ciąg")
        : (toRun ? `Ustaw cały ciąg na ${val} mm` : `Wyrównaj tę szafkę do ciągu (${val} mm)`);
      return { label, run: () => runFix && runFix(action) };
    }
    if (action.startsWith("fixgap:")) {
      const [, li, j, val, dir] = action.split(":");
      const verb = dir === "down" ? "Zmniejsz" : "Zwiększ";
      return { label: `${verb} luz do ${val} mm`, run: () => editLevels((L) => (L[+li].cols[+j].gapBetween = +val)) };
    }
    if (action.startsWith("fixback:")) {
      const [, li, j, k, val] = action.split(":");
      return {
        label: `Ustaw tył na ${val} mm`,
        run: () => editLevels((L) => (L[+li].cols[+j].drawers[+k].backHeight = +val)),
      };
    }
    if (action.startsWith("hingeflip:")) {
      const [, li, j, side] = action.split(":");
      return {
        label: `Przełóż zawiasy na ${side === "left" ? "lewą" : "prawą"}`,
        run: () => editLevels((L) => (L[+li].cols[+j].hinge = side)),
      };
    }
    if (action.startsWith("noTop:")) {
      const idx = Number(action.split(":")[1]);
      return {
        label: "Dołóż parę wzmocnień",
        run: () => editItemCab && editItemCab(idx, (c) => Object.assign(c, bezWienca(c))),
      };
    }
    if (action.startsWith("cornerdoor:")) {
      const [, w, idx] = action.split(":");
      return {
        label: `Ustaw jedne drzwi ${w} mm`,
        /* Szafka narozna to jedna komora — front jest po prostu wezszy od
           korpusu. Uwaga bywa widoczna z sasiadki, wiec poprawka idzie po
           numerze szafki, a nie po tej akurat ogladanej. */
        run: () => editItemLevels(Number(idx), (L) => L.forEach((lv) => {
          const c = { ...lv.cols[0], w: null, kind: "doors", doors: 1,
            doorWidths: [Number(w)], noDiv: false };
          lv.cols = [c];
        })),
      };
    }
    if (action.startsWith("fixcolauto:")) {
      const li = Number(action.split(":")[1]);
      return {
        label: "Rozłóż kolumny automatycznie",
        run: () => editLevels((L) => L[li].cols.forEach((c) => { c.w = null; })),
      };
    }
    if (action.startsWith("fixdiv:")) {
      const val = Number(action.split(":")[1]);
      const now = cab.gaps?.divOverlay ?? 7;
      return {
        label: `${val > now ? "Zwiększ" : "Zmniejsz"} nałożenie do ${val} mm`,
        run: () => setGap("divOverlay", val),
      };
    }
    if (action.startsWith("fixh:")) {
      const [, li, j, k, val] = action.split(":");
      return { label: `Zmień bok szuflady na ${val} mm`, run: () => editLevels((L) => (L[+li].cols[+j].drawers[+k].h = +val)) };
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
      {przed}
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

const SHEET_W = 2800; // arkusz, ktory kupujemy
const SHEET_H = 2100;
/* Zanim pojda formatki, arkusz jest okrawany na wymiar bazowy — i to on jest
   realnym maksimum jednej formatki, nie surowy arkusz. */
const USABLE_W = 2761.2;
const USABLE_H = 2061.2;
const KERF = 3; // rzaz piły

/* ---------- cokol ciagu ----------
   W ciagu cokol jest jedna plaszczyzna przez wszystkie szafki, a nie suma
   odcinkow pod kazda z nich — inaczej mielibysmy szwy tam, gdzie stykaja sie
   korpusy. Plaszczyzna dluzsza od maksymalnej formatki musi jednak pojsc
   z kilku kawalkow: dzielimy je rowno i oklejamy takze na laczeniu, zeby styk
   plaszczyzn bocznych nie zostal surowy. */
/* Styki korpusow to jedyne miejsca, w ktorych laczenie plaszczyzny nie rzuca sie
   w oczy — tam wypada pionowa szczelina miedzy frontami, wiec szew chowa sie
   w tej samej linii. Dlatego ciac wolno tylko tutaj. Automat tnie dopiero
   wtedy, gdy plaszczyzna nie miesci sie w formatce, i bierze najdalszy styk,
   ktory jeszcze wchodzi — czyli tak rzadko, jak sie da. */
const splitAtJoints = (total, joints, want, max = USABLE_W) => {
  let cuts = [];
  let auto = true;
  let noFit = false;
  if (Array.isArray(want)) {
    // recznie wybrane styki; te, ktore zniknely po zmianie szerokosci, odpadaja same
    auto = false;
    cuts = want.filter((c) => joints.includes(c)).sort((a, b) => a - b);
  } else {
    let start = 0;
    while (total - start > max) {
      const cand = joints.filter((j) => j > start && j - start <= max).pop();
      if (cand == null) { noFit = true; break; }
      cuts.push(cand);
      start = cand;
    }
  }
  const lens = [];
  let prev = 0;
  cuts.forEach((c) => { lens.push(c - prev); prev = c; });
  lens.push(total - prev);
  return { cuts, joints, lens, auto, noFit, max, n: lens.length,
    tooLong: Math.max(0, ...lens.filter((l) => l > max)) };
};

/* Rozmieszczenie ciagow liczy sie z calego projektu, a potrzebuje go i rysunek,
   i blat, i uwagi. Projekt jest niezmienny — po kazdej zmianie powstaje nowy
   obiekt — wiec wystarczy zapamietac wynik przy nim samym. */
const layoutCache = new WeakMap();
const projectLayout = (project) => {
  if (layoutCache.has(project)) return layoutCache.get(project);
  const runs = drawableRuns(project);
  const L = runLayout(assemblyParts(project, runs));
  layoutCache.set(project, L);
  return L;
};

// styki korpusow wzdluz ciagu, liczone od lewej krawedzi pierwszej szafki
const runJoints = (project, run) => {
  const list = runItems(project, run.id);
  const joints = [];
  let x = 0;
  list.forEach(({ it }, k) => {
    x += computeGeo(it.cab, it.mat).W;
    if (k < list.length - 1) { joints.push(x); x += run.gap || 0; }
  });
  return { joints, total: x, list };
};

const runPlinth = (project, run) => {
  const { joints, total, list } = runJoints(project, run);
  if (!list.length) return null;
  const p = run.plinth || list[0].it.cab.plinth;
  if (!p || !p.on) return null;
  const h = Math.max(0, Math.round(p.height || 0));
  if (!(h > 0)) return null;
  /* W rogu cokoly obu scian spotykaja sie pod katem prostym i jeden musi zajsc
     za drugi — inaczej stalyby obok siebie i jeden wystawalby w powietrze.
     Cokol tej sciany konczy sie wiec na TYLE cokolu prostopadlego, a nie na
     koncu szafki naroznej: reszta jej lica jest juz zaslonieta ramieniem. */
  let dl = total;
  const n = projectLayout(project).info.get(run.id);
  const arm = n && n.pair && n.pair.wchodzi.id === run.id ? n.arm || null : null;
  const mojeRamie = arm || [...projectLayout(project).info.values()]
    .map((k) => k.arm).find((a) => a && a.run.id === run.id);
  if (mojeRamie && mojeRamie.free > 0) {
    const c = mojeRamie.cab;
    const t = c.geo.t;
    /* Koniec cokolu: lico ramienia plus grubosc jego cokolu i jeszcze grubosc
       plyty, na ktora ma zachodzic. Cokoly obu scian nie stykaja sie w rogu
       czolami — jeden idzie na zakladke po drugim. */
    const koniec = Math.round(c.x + mojeRamie.free + 2 * t);
    if (koniec > 0 && koniec < total) dl = koniec;
  }
  return { total: dl, h,
    ...splitAtJoints(dl, joints.filter((j) => j < dl), run.plinthCuts),
    mat: list[0].it.mat, grainMatters: list[0].it.cab.grainMatters, name: run.name };
};

/* Blat idzie nad calym ciagiem jedna plaszczyzna. Bierzemy go od lewego wysuniecia
   pierwszej szafki z blatem do prawego wysuniecia ostatniej — wysuniecia
   wewnetrzne znikaja, bo to jedna plyta, a nie kilka stykajacych sie. */
/* Ile blat wystaje przed lico frontow. Glebokosc blatu jest wymiarem
   rzeczywistym — od sciany do jego konca — wiec ten wysieg wchodzi w nia. */
const WORKTOP_OVERHANG = 10;
/* Blat kupuje sie w gotowym pasie 600 albo 1200 mm. Kilku centymetrow nie warto
   zdejmowac w zakladzie: sciana i tak nie jest prosta, wiec i tak dopasowuje sie
   go na miejscu. Przy wiekszej roznicy ciecie na wymiar ma juz sens — mniej
   odpadu i lzej go wniesc. */
const WORKTOP_ONSITE = 50;

/* Odcinki blatu do rysunku. Skrajne dociagamy do konca calej plyty, bo nad
   rogiem blat idzie dalej niz szafki, ktore pod nim stoja. */
const worktopSpans = (rt) => {
  if (!rt || !(rt.spans || []).length) return [];
  const s = rt.spans.map((x) => ({ ...x })).sort((a, b) => a.x0 - b.x0);
  s[0].x0 = Math.min(s[0].x0, rt.x0);
  s[s.length - 1].x1 = Math.max(s[s.length - 1].x1, rt.x0 + rt.total);
  /* Blat nad sasiadujacymi szafkami to jedna plyta, a nie kawalek na szafke —
     rysowany osobno pokazywal szwy tam, gdzie ich nie ma. Rozdziela go dopiero
     przerwa miedzy szafkami. */
  const out = [s[0]];
  s.slice(1).forEach((x) => {
    const p = out[out.length - 1];
    if (x.x0 <= p.x1) { p.x1 = Math.max(p.x1, x.x1); p.depth = Math.max(p.depth, x.depth); }
    else out.push(x);
  });
  return out;
};

/* Szafki ciagu pogrupowane po wysokosci lica. Blat idzie nad ta grupa, ktora
   zajmuje najwiecej miejsca — reszta to slupki albo szafka z rozjechana
   wysokoscia, i jedno od drugiego rozni sie tylko skala roznicy. */
const worktopLevel = (project, run) => {
  const { list } = runJoints(project, run);
  if (!list.length) return null;
  const gap = Math.max(0, Math.round(run.gap || 0));
  let x = 0;
  const cabs = list.map(({ it, i }, k) => {
    const geo = computeGeo(it.cab, it.mat);
    const o = { it, idx: i, geo, x0: x, x1: x + geo.W, y: cabTopY(it.cab, geo) };
    x += geo.W;
    if (k < list.length - 1) x += gap;
    return o;
  });
  const szer = new Map();
  cabs.forEach((c) => szer.set(c.y, (szer.get(c.y) || 0) + (c.x1 - c.x0)));
  const y = [...szer.entries()].sort((a, b) => b[1] - a[1] || a[0] - b[0])[0][0];
  return { cabs, y, pod: cabs.filter((c) => c.y === y), poza: cabs.filter((c) => c.y !== y) };
};

const runTop = (project, run) => {
  const { joints, list } = runJoints(project, run);
  /* Pas moze byc pusty, a i tak potrzebowac blatu: lezy w nim ramie szafki
     naroznej z sasiedniej sciany. */
  /* Ramie lezy w tym pasie, ale nalezy do szafki z sasiedniej sciany — i to jej
     ciag decyduje, czy ma nad soba blat. Pytanie o `run.worktop` zostawialo rog
     bez blatu, gdy pas za rogiem byl pusty i nikt mu blatu nie wlaczyl. */
  const ramiona = ((projectLayout(project).info.get(run.id) || {}).arms || [])
    .filter((a) => (a.run && a.run.run && a.run.run.worktop) || run.worktop);
  if (!list.length && !ramiona.length) return null;
  const gap = Math.max(0, Math.round(run.gap || 0));
  let x = 0;
  const spans = [];
  /* Blat roboczy ciagu obejmuje wszystkie szafki jednej wysokosci, niezaleznie
     od tego, co ma ustawione pojedyncza szafka. Slupek jest wyzszy, wiec blat
     konczy sie przy jego boku i do niego dolega. */
  const lvl = run.worktop ? worktopLevel(project, run) : null;
  if (lvl && lvl.pod.length) {
    lvl.pod.forEach((c) => {
      const gl = Math.round(c.geo.carcassDepth - (Number(c.it.offset) || 0));
      spans.push({ x0: c.x0, x1: c.x1, depth: gl + c.geo.tf + WORKTOP_OVERHANG,
        worktop: true, rear: c.it.cab.back !== "none" });
    });
  }
  /* Ramie szafki naroznej lezy w pasie sasiedniej sciany i tez chce blat nad
     soba — bez tego blat konczyl sie na korpusie, a rog zostawal goly. */
  if (ramiona.length) {
    const n = projectLayout(project).info.get(run.id) || { lead: 0 };
    ramiona.forEach((a) => {
      spans.push({ x0: a.u0 - (n.lead || 0), x1: a.u0 - (n.lead || 0) + a.len,
        depth: a.depth + a.cab.geo.tf + WORKTOP_OVERHANG,
        // grubosc frontu ramienia — pas z samym ramieniem nie ma jej skad wziac
        tf: a.cab.geo.tf,
        worktop: true, rear: a.cab.cab.back !== "none" });
    });
  }
  if (!(lvl && lvl.pod.length)) {
  list.forEach(({ it }, k) => {
    const geo = computeGeo(it.cab, it.mat);
    if (geo.isBlat)
      spans.push({ x0: x + geo.topX0, x1: x + geo.topX1, depth: geo.blatDepth,
        worktop: geo.isWorktop,
        rear: it.cab.back !== "none" || geo.blat.overBack > 0 });
    x += geo.W;
    if (k < list.length - 1) x += gap;
  });
  }
  if (!spans.length) return null;
  /* Przy narożniku o koncu blatu decyduje rog, a nie wysuniecie blatu szafki:
     albo blat idzie nad rogiem, albo konczy sie przy boku sasiada. */
  const ext = (project.runs || []).some((r) => r.corner)
    ? (projectLayout(project).info.get(run.id) || {}).topSpan : null;
  const x0 = ext && ext.cor0 ? Math.round(ext.x0) : Math.min(...spans.map((s) => s.x0));
  const x1 = ext && ext.cor1 ? Math.round(ext.x1) : Math.max(...spans.map((s) => s.x1));
  const total = Math.round(x1 - x0);
  /* Blat roboczy tnie sie z gotowego odcinka, wiec jego granica jest dlugosc
     handlowa, a nie formatka plyty. */
  const worktop = spans.some((s) => s.worktop);
  const mat0 = list.length ? list[0].it.mat : ramiona[0].cab.rawMat;
  return {
    total, x0, worktop,
    /* Odcinki, ktore blat naprawde zakrywa — rysunek bierze je wprost, zeby
       plaszczyzna konczyla sie tam, gdzie konczy sie mebel pod nia. */
    spans: spans.map((s) => ({
      x0: Math.round(s.x0), x1: Math.round(s.x1), depth: Math.round(s.depth) })),
    th: Math.round(worktop
      ? (mat0.worktop || {}).thickness || 38
      : (mat0.board || {}).thickness || 18),
    /* Wysokosc lica, na ktorym blat lezy — elewacja rysuje go wlasnie stad.
       Pas z samym ramieniem bierze ja z szafki, do ktorej ramie nalezy. */
    y: lvl && lvl.pod.length ? lvl.y
      : ramiona.length ? cabTopY(ramiona[0].cab.cab, ramiona[0].cab.geo) : 0,
    // konce ciete na 45 stopni — na formatce trzeba je zaznaczyc
    skos0: !!(ext && ext.skos0), skos1: !!(ext && ext.skos1),
    matKey: worktop ? "worktop" : "board",
    ...(() => {
      /* Szerokosc zamawiana: przy malej roznicy bierzemy caly arkusz i docinamy
         przy scianie na miejscu. `surowa` zostaje na uwagi i wymiary. */
      const surowa = Math.round(Math.max(...spans.map((s) => s.depth)));
      const arkusz = worktop ? WORKTOP_DEPTHS.find((d) => d >= surowa) : null;
      const docinka = arkusz ? arkusz - surowa : 0;
      const pelny = !!arkusz && docinka > 0 && docinka <= WORKTOP_ONSITE
        && run.topCut !== true;
      return { surowa, arkusz: arkusz || null, docinka, pelnyArkusz: pelny,
        depth: pelny ? arkusz : surowa };
    })(),
    rear: spans.some((s) => s.rear),
    // styki przeliczamy na uklad samej plyty, zeby ciecia liczyly sie od jej konca
    ...splitAtJoints(total, joints.filter((j) => j > x0 && j < x1).map((j) => Math.round(j - x0)),
      run.topCuts, worktop ? WORKTOP_LEN : USABLE_W),
    /* Pas z samym ramieniem nie ma wlasnych szafek — material bierze wtedy
       od tej, do ktorej ramie nalezy. */
    mat: mat0,
    grainMatters: list.length ? list[0].it.cab.grainMatters : ramiona[0].cab.cab.grainMatters,
    name: run.name,
  };
};

// rowne kawalki lacza sie w jedna pozycje zamowienia
const runPlinthPanels = (rp) => {
  if (!rp) return [];
  const map = new Map();
  rp.lens.forEach((len) => map.set(len, (map.get(len) || 0) + 1));
  return [...map.entries()].map(([len, qty]) => ({
    name: "Cokół ciągu", qty, a: len, b: rp.h, matKey: "board",
    edges: { a1: false, a2: true, b1: true, b2: true },
    note: rp.n > 1 ? "krawędź dolna oraz oba końce, w tym łączenie" : "krawędź dolna oraz oba końce",
  }));
};

/* Kolumna korpusu, ktora styka sie z ramieniem. Ramie wychodzi bokiem, wiec
   polka ramienia konczy sie wlasnie na polkach tej kolumny — z niej bierzemy
   i liczbe polek, i wysokosci do sprawdzenia. */
const armColumn = (side, lv) => {
  const cs = (lv && lv.cols) || [];
  return (side === "right" ? cs[cs.length - 1] : cs[0]) || null;
};
const armShelfYs = (side, levels) => {
  const ys = [];
  (levels || []).forEach((lv) =>
    ((armColumn(side, lv) || {}).shelves || []).forEach((s) => ys.push(Math.round(s.y))));
  return ys;
};

/* Formatki ramienia szafki naroznej. Plyty poziome i plecy sa osobnymi
   kawalkami dostawionymi na kolki do korpusu — tak jak w kupnych szafkach
   naroznych — bo w calosci nie da sie ich ani okleic, ani wnieść. */
const cornerArmParts = (a) => {
  const geo = a.cab.geo;
  const cab = a.cab.cab;
  const t = geo.t;
  const H = cab.H;
  // ramie liczymy od lica korpusu: to, co wystaje poza jego glebokosc
  const len = Math.max(0, a.len);
  const inner = Math.max(0, H - 2 * t);
  const panels = [];
  if (len <= 0) return { panels, hardware: [] };
  /* Ramie idzie za szafka, do ktorej nalezy: pod blatem nie ma wienca, wiec i
     ramie go nie ma — zamiast niego dostaje te sama pare wzmocnien. */
  const armTop = geo.hasTop;
  panels.push({ name: armTop ? "Wieniec i dno ramienia" : "Dno ramienia", qty: armTop ? 2 : 1,
    a: len, b: a.depth - t, matKey: "board",
    edges: { a1: true, a2: false, b1: true, b2: false }, note: "czoło i koniec przy wsporniku" });
  /* Wzmocnienia ramienia nie sa juz jedna pozycja na dwie sztuki: czolowe
     konczy sie na katowniku przy drzwiach, a tylne idzie dalej — az do
     katownika w tylnym narozniku, bo tam ma sie czego trzymac. */
  const plan = armPlan(a);
  plan.rails.forEach((r) => panels.push({
    name: r.przyTyle ? "Wzmocnienie ramienia — tylne" : "Wzmocnienie ramienia — czołowe",
    qty: 1, a: Math.max(0, Math.round(r.u1 - r.u0)), b: r.wys, matKey: "board",
    edges: { a1: true, a2: false, b1: true, b2: false },
    note: r.przyTyle
      ? "stojące przy plecach, od kątownika w narożniku po bok ramienia"
      : (r.stojace ? "stojące" : "na płask") + " pod blatem, od kątownika przy drzwiach po bok ramienia",
  }));
  panels.push({ name: "Bok ramienia", qty: 1, a: a.depth - t, b: inner, matKey: "board",
    edges: { a1: true, a2: false, b1: false, b2: false }, note: "czoło" });
  /* Plecy ramienia siegaja poza samo ramie: wzdluz drugiej sciany biegna dalej,
     az do katownika w tylnym narozniku — inaczej zostawal tam goly kawalek. */
  if (plan.back)
    panels.push({ name: plan.back.plyta ? "Plecy ramienia z płyty" : "Plecy ramienia", qty: 1,
      a: Math.round(plan.back.u1 - plan.back.u0), b: inner,
      matKey: plan.back.plyta ? "board" : "back",
      edges: { a1: false, a2: false, b1: false, b2: false },
      note: [plan.tyl > 0 ? "sięgają do kątownika w tylnym narożniku" : "",
        plan.back.plyta ? "pełna płyta zamiast HDF — usztywnia róg" : ""]
        .filter(Boolean).join(", ") });
  // front ramienia bierze wysokosc z frontow samej szafki, zeby stanely w linii
  const d0 = (geo.doors || []).find((d) => d.h > 0 && d.type !== "blenda");
  /* Wariant „fix": ramie zaslepia plyta przykrecona na staly, a otwierac sie
     bedzie tylko front korpusu — tak sie robi, gdy w rogu i tak nic nie stoi. */
  const fix = a.doors === "fix";
  /* Przy katowniku front ramienia konczy sie na maskownicy i luzie, a nie na
     koncu ramienia — `armFrontPlan` ma to juz policzone, tak samo jak rysunki. */
  panels.push({ name: fix ? "Fix ramienia" : "Front ramienia", qty: 1,
    a: armFrontPlan(a).w,
    b: d0 ? Math.round(d0.h) : H, matKey: "front",
    edges: { a1: true, a2: true, b1: true, b2: true }, note: "cztery krawędzie" });
  /* Katownik trzyma kat prosty i daje obu skrzydlom o co sie oprzec przy
     zamknieciu. Cztery plyty na cala wysokosc: dwie w srodku i dwie na czole,
     wszystkie skrecone ze soba. Przy drzwiach lamanych albo skreconych na staly
     kat nie jest potrzebny.

     Formatki po 60 mm, bo mniejszej nie da sie uciac ani okleic — dlatego jedna
     plyta nachodzi na czolo drugiej. Nachodzaca ma obie dlugie krawedzie na
     wierzchu, doczolowa chowa jedna w styku i tej sie nie oklei. */
  if (a.bracket) {
    const w = a.bracket.w;
    const hM = d0 ? Math.round(d0.h) : H;
    panels.push({ name: "Kątownik narożnika — nachodzący", qty: 1, a: w, b: inner, matKey: "board",
      edges: { a1: false, a2: false, b1: true, b2: true }, note: "obie krawędzie pionowe" });
    panels.push({ name: "Kątownik narożnika — doczołowy", qty: 1, a: w, b: inner, matKey: "board",
      edges: { a1: false, a2: false, b1: true, b2: false },
      note: "krawędź pionowa od strony wnętrza — druga wchodzi w styk" });
    panels.push({ name: "Maskownica kątownika — nachodząca", qty: 1, a: w, b: hM, matKey: "front",
      edges: { a1: true, a2: true, b1: true, b2: false }, note: "krawędź pionowa oraz góra i dół" });
    panels.push({ name: "Maskownica kątownika — doczołowa", qty: 1, a: w, b: hM, matKey: "front",
      edges: { a1: true, a2: true, b1: true, b2: false }, note: "krawędź pionowa oraz góra i dół" });
  }
  /* Polki w ramieniu ida osobno, tak jak plyty poziome — w calosci w L nikt ich
     nie okleji ani nie wniesie. Liczba idzie za kolumna przy ramieniu, bo to na
     jej polkach polka ramienia sie konczy — polka bez pary wisialaby w powietrzu.
     Poziomy sumujemy, bo kazdy z nich ma wlasny podzial na wysokosc. */
  const polek = armShelfYs(a.side, geo.levels).length;
  if (polek > 0)
    panels.push({ name: "Półka ramienia", qty: polek, a: len - t, b: a.depth - t, matKey: "board",
      edges: { a1: true, a2: false, b1: false, b2: false }, note: "krawędź przednia" });
  // cokol idzie dalej pod ramieniem — to osobny kawalek wzdluz drugiej sciany
  if (a.cab.plinthH > 0)
    panels.push({ name: "Cokół ramienia", qty: 1, a: len, b: a.cab.plinthH, matKey: "board",
      edges: { a1: false, a2: true, b1: true, b2: true }, note: "krawędź dolna oraz oba końce" });
  /* Fix nie ma zawiasow — trzyma sie na zlaczkach od srodka, zeby z zewnatrz
     nie bylo nic widac. */
  /* Zawiasow tyle, ile wychodzi z wysokosci i szerokosci skrzydla — tak samo
     jak przy drzwiach szafki. Na sztywno wpisane 3 rozjezdzaly sie z rysunkiem,
     ktory rysuje tyle zawiasow, co przy froncie korpusu. */
  const hardware = fix
    ? [{ name: "Złączka meblowa", spec: "fix ramienia szafki narożnej, od środka", qty: 4, unit: "szt." }]
    : [{ name: "Zawias", spec: "front ramienia szafki narożnej",
        qty: autoHinges(d0 ? Math.round(d0.h) : H, armFrontPlan(a).w), unit: "szt." }];
  if (a.doors === "lamane")
    hardware.push({ name: "Zawias łamany 90°", spec: "spina dwa skrzydła szafki narożnej", qty: 2, unit: "szt." });
  return { panels, hardware };
};

const runTopPanels = (rt) => {
  if (!rt) return [];
  const map = new Map();
  rt.lens.forEach((len) => map.set(len, (map.get(len) || 0) + 1));
  /* Lyzwa zmienia sposob ciecia, wiec musi byc widoczna w samej nazwie —
     kolumna z oklejaniem mowi tylko o krawedziach. */
  const skos = (rt.skos0 ? 1 : 0) + (rt.skos1 ? 1 : 0);
  return [...map.entries()].map(([len, qty]) => ({
    name: skos ? `Blat ciągu (łyżwa 45° — ${skos === 2 ? "oba końce" : "jeden koniec"})` : "Blat ciągu",
    qty, a: len, b: rt.depth, matKey: rt.matKey,
    edges: { a1: true, a2: rt.rear, b1: true, b2: true },
    note: rt.n > 1 ? "czoło i oba końce, w tym łączenie" : "czoło i oba końce",
  }));
};

/* Listwa do zawieszek biegnie przez caly ciag jednym odcinkiem, a nie kawalkiem
   pod kazda szafka — inaczej szafki wisialyby kazda na swoim kawalku i nic by
   ich nie trzymalo w jednej linii. */
const RAIL_NAME = "Listwa montażowa do zawieszek";
const runRail = (project, run) => {
  const { total, list } = runJoints(project, run);
  if (list.length < 2) return null;
  if ((run.hangerMode || "listwa") !== "listwa") return null;
  // liczy sie tylko dla ciagu wiszacego — stojacy nie ma czego wieszac
  if (!list.every(({ it }) => !(it.cab.legs && it.cab.legs.on) && !(it.cab.plinth && it.cab.plinth.on)))
    return null;
  const len = Math.max(0, total - 40);
  return { len, name: run.name };
};

/* Zestawienia calego projektu: szafka nalezaca do ciagu oddaje swoje formatki
   bez cokolu i bez blatu, bo te ida osobnymi pozycjami — na caly ciag. */
const projectParts = (project) => {
  const shared = new Map();
  (project.runs || []).forEach((r) => {
    const rp = runPlinth(project, r);
    const rt = runTop(project, r);
    const rr = runRail(project, r);
    if (rp || rt || rr) shared.set(r.id, { run: r, rp, rt, rr });
  });
  const drop = (id) => {
    const s = shared.get(id);
    if (!s) return null;
    const names = [];
    if (s.rp) names.push("Cokół");
    if (s.rt) names.push("Blat");
    return names;
  };
  // szafka narozna liczy sie z kontekstem rogu — inaczej jej wzmocnienia sa za dlugie
  const layout = projectLayout(project);
  const cabs = project.items.map((it, ci) => {
    const g = computeGeo(it.cab, it.mat, armCtxOf(layout, ci));
    const gone = drop(it.runId || null);
    const s = shared.get(it.runId || null);
    return {
      mat: it.mat,
      grainMatters: it.cab.grainMatters,
      name: (it.cab.name || "").trim() || `Szafka ${ci + 1}`,
      panels: gone ? g.panels.filter((p) => !gone.includes(p.name)) : g.panels,
      hardware: s && s.rr ? g.hardware.filter((h) => h.name !== RAIL_NAME) : g.hardware,
    };
  });
  const runs = [];
  shared.forEach(({ run, rp, rt, rr }) => {
    const base = { mat: (rp || rt || {}).mat || project.items[0].mat,
      grainMatters: (rp || rt || {}).grainMatters };
    if (rp) runs.push({ ...base, mat: rp.mat, name: `Cokół — ${run.name}`,
      panels: runPlinthPanels(rp), hardware: [] });
    if (rt) runs.push({ ...base, mat: rt.mat, name: `Blat — ${run.name}`,
      panels: runTopPanels(rt), hardware: [] });
    if (rr) runs.push({ ...base, name: `Listwa — ${run.name}`, panels: [],
      hardware: [{ name: RAIL_NAME, spec: `jeden odcinek ${fmt(rr.len)} mm na ciąg`,
        qty: Math.round(rr.len / 100) / 10, unit: "mb" }] });
  });
  /* Ramie szafki naroznej to osobna pozycja: formatki ida na te sama plyte, co
     szafka, ale latwiej je rozpoznac przy montazu, gdy stoja osobno. */
  const arms = [];
  if ((project.runs || []).some((r) => r.corner)) {
    projectLayout(project).info.forEach((n) => {
      if (!n.arm) return;
      const { panels, hardware } = cornerArmParts(n.arm);
      if (!panels.length) return;
      /* Front ramienia stoi w licu tej sciany, w ktorej pasie lezy — wiec bierze
         plyte frontowa stamtad. Gdy tamten ciag jest jeszcze pusty, zostaje
         material szafki naroznej. */
      const sasiad = n.arm.other && n.arm.other.g ? n.arm.other.g.cabs[0] : null;
      const armMat = sasiad ? sasiad.rawMat : n.arm.cab.rawMat;
      arms.push({ mat: armMat, grainMatters: n.arm.cab.cab.grainMatters,
        name: `Narożnik — ${(n.arm.cab.cab.name || "").trim() || "szafka w rogu"}`,
        panels, hardware });
    });
  }
  return [...cabs, ...runs, ...arms];
};

/* Uwagi ciagu w jednym miejscu, bo czyta je i karta aktywnej szafki, i licznik
   uwag przy pozostalych szafkach na pasku — teksty nie moga sie rozjechac.
   runCabMsgs dotyczy jednej szafki, runWideMsgs calego ciagu. */
const runCabMsgs = (run, c) => {
  const out = [];
  if (!run) return out;
  if (run.H != null && Math.round(c.H) !== run.H)
    out.push({ level: "warn", text:
      `Wysokość ${fmt(c.H)} mm nie zgadza się z ciągiem „${run.name}" (${fmt(run.H)} mm) — fronty nie staną w jednej linii.`
      + `|runcab:H:${run.H}|runrun:H:${Math.round(c.H)}` });
  /* Plytsza szafka w ciagu to normalny zabieg, gdy z tylu cos przeszkadza: lico
     zostaje w linii, cofa sie sam tyl. Dlatego mowimy o tym wprost, zamiast
     kazac to "naprawiac". */
  if (run.D != null && Math.round(c.D) !== run.D)
    out.push({ level: "warn", text:
      `Głębokość ${fmt(c.D)} mm różni się od ciągu (${fmt(run.D)} mm). Jeśli to celowe — lico zostaje w linii, cofa się tylko tył — zostaw tak; blat licz na najgłębszą szafkę.`
      + `|runcab:D:${run.D}|runrun:D:${Math.round(c.D)}` });
  /* Ciag wiesza sie na listwie, pojedyncza szafka na haczykach — dlatego nowy
     ciag startuje z listwa, a szafka, ktora zostala na haczykach, dostaje uwage
     zamiast cichej zmiany ustawienia. Szafki stojacej to nie dotyczy: nic nie
     wiesza, wiec sposob wieszania jest jej obojetny. */
  const wisi = !(c.legs && c.legs.on) && !(c.plinth && c.plinth.on);
  if (wisi && (run.hangerMode || "listwa") !== (c.hangerMode || "listwa"))
    out.push({ level: "warn", text:
      `Ta szafka wiesza się ${c.hangerMode === "haczyki" ? "na haczykach" : "na listwie"}, `
      + `a ciąg ${run.hangerMode === "haczyki" ? "na haczykach" : "na listwie"} — w ciągu listwa trzyma wszystkie szafki w jednej linii.`
      + `|runcab:hangerMode:x|runrun:hangerMode:x` });
  if (run.plinth && !samePlinth(c.plinth, run.plinth))
    out.push({ level: "warn", text:
      `Cokół tej szafki (${plinthText(c.plinth)}) nie zgadza się z ciągiem (${plinthText(run.plinth)}) — cokół idzie przez cały ciąg jedną płaszczyzną.`
      + `|runcab:plinth:x|runrun:plinth:x` });
  return out;
};

// "1600, 1600 i 800" zamiast "1600 i 1600 i 800"
const listPl = (xs) => (xs.length < 2 ? xs.join("") : xs.slice(0, -1).join(", ") + " i " + xs[xs.length - 1]);

/* Cokol i blat dziela sie dokladnie tak samo, wiec i uwagi o nich pisze jedno
   miejsce — inaczej teksty rozjechalyby sie przy pierwszej poprawce. */
const splitMsgs = (what, whatGen, s, fixAction) => {
  const out = [];
  if (!s) return out;
  // blat roboczy ma swoj arkusz 4100, plyta meblowa swoj po okrawaniu
  const jednostka = s.max === WORKTOP_LEN ? "arkuszu blatu" : "formatce";
  const jednostkaM = s.max === WORKTOP_LEN ? "arkusz blatu" : "formatka";
  if (s.noFit)
    out.push({ level: "error", text:
      `${what} ma ${fmt(s.total)} mm, a między stykami korpusów nie ma odcinka krótszego niż ${jednostkaM} `
      + `(${fmt(s.max)} mm) — trzeba zwęzić którąś szafkę albo pociąć go poza stykiem.` });
  else if (s.tooLong > 0)
    out.push({ level: "error", text:
      `Odcinek ${whatGen} ${fmt(s.tooLong)} mm nie mieści się w ${jednostka} (${fmt(s.max)} mm) `
      + `— dołóż podział na styku korpusów.|${fixAction}` });
  else if (s.n > 1)
    out.push({ level: "warn", text:
      (s.auto
        ? `${what} ma ${fmt(s.total)} mm i nie zmieści się w jednym ${s.max === WORKTOP_LEN ? "arkuszu blatu" : "arkuszu"} (maksimum ${fmt(s.max)} mm) — pójdzie z ${s.n} części`
        : `${what} idzie z ${s.n} części`)
      + ` po ${listPl(s.lens.map(fmt))} mm, ciętych na styku korpusów `
      + `(${listPl(s.cuts.map(fmt))} mm od lewej) i oklejonych także na łączeniu.` });
  return out;
};

/* Ponizej tej roznicy wysokosci szafka po prostu odstaje od reszty ciagu i
   pewnie jest to pomylka; powyzej to juz slupek, ktory ma byc wyzszy. */
const SLUPEK_MIN = 200;

/* Uwagi o blacie roboczym ciagu: co jest pod nim, co obok, i co jeszcze ma
   wieniec, choc pod blatem powinno miec pare wzmocnien. */
const worktopMsgs = (project, run) => {
  const out = [];
  if (!run) return out;
  /* Pas za rogiem sam blatu nie ma wlaczonego, a mimo to lezy na nim blat nad
     ramieniem naroznika — jego szerokosc trzeba sprawdzic tak samo. */
  const rt = runTop(project, run);
  if (!run.worktop && !(rt && rt.worktop)) return out;
  /* Pas moze nie miec wlasnych szafek, a i tak miec blat — nad ramieniem
     naroznika z sasiedniej sciany. Wtedy `lvl` jest pusty, ale sprawdzic
     szerokosc blatu i tak trzeba. */
  const lvl = worktopLevel(project, run);
  (lvl ? lvl.poza : []).forEach((c) => {
    const nazwa = (c.it.cab.name || "").trim() || "szafka";
    const roznica = Math.abs(c.y - lvl.y);
    if (roznica >= SLUPEK_MIN)
      out.push({ level: "info", text:
        `Szafka „${nazwa}" jest o ${fmt(roznica)} mm ${c.y > lvl.y ? "wyższa" : "niższa"} od reszty ciągu `
        + `— blat kończy się przy jej boku i do niej dolega.` });
    else
      out.push({ level: "warn", text:
        `Szafka „${nazwa}" odstaje od ciągu o ${fmt(roznica)} mm — blat jej nie obejmie. `
        + `Wyrównaj wysokość albo zrób z niej słupek (różnica od ${fmt(SLUPEK_MIN)} mm).` });
  });
  /* Blat glebszy niz 600 wymusza arkusz 1200, a z niego zostaje pas odpadu.
     Zwykle taniej jest zejsc z glebokoscia szafek o te kilkadziesiat milimetrow,
     niz kupowac dwa razy szerszy blat — ale to decyzja, nie blad. */
  if (rt && rt.worktop && rt.depth > WORKTOP_DEPTHS[0] && rt.depth <= WORKTOP_DEPTHS[1]) {
    const nadmiar = rt.depth - WORKTOP_DEPTHS[0];
    /* Grubosc frontu bierzemy z szafki, a w pasie z samym ramieniem — z tej,
       do ktorej ramie nalezy. Na sztywno wpisane 18 klamalo przy innej plycie. */
    const tf = lvl && lvl.pod.length
      ? lvl.pod[0].geo.tf
      : ((rt.spans || []).find((s2) => s2.tf) || {}).tf
        ?? (project.items[0] ? computeGeo(project.items[0].cab, project.items[0].mat).tf : 18);
    // pas z samym ramieniem glebokosc bierze z ustawienia ciagu
    const glebokosc = lvl && lvl.pod.length
      ? Math.max(...lvl.pod.map((c) => Math.round(c.geo.carcassDepth - (Number(c.it.offset) || 0))))
      : Math.max(0, Math.round(Number(run.D) || 0));
    // 2 mm zapasu, zeby blat na pewno wszedl w arkusz 600
    const sugerowana = WORKTOP_DEPTHS[0] - tf - WORKTOP_OVERHANG - 2;
    out.push({ level: "warn", text:
      `Blat wychodzi ${fmt(rt.depth)} mm — o ${fmt(nadmiar)} mm za dużo na arkusz `
      + `${fmt(WORKTOP_DEPTHS[0])} mm, a z arkusza ${fmt(WORKTOP_DEPTHS[1])} mm zostaje pas odpadu. `
      + `Szafki są za głębokie: przy ${fmt(sugerowana)} mm blat ma ${fmt(sugerowana + tf + WORKTOP_OVERHANG)} mm `
      + `i mieści się z zapasem. Można też świadomie wziąć szerszy arkusz.`
      + (glebokosc > sugerowana ? `|rundepth:${sugerowana}` : "")
      + `|worktop:${WORKTOP_DEPTHS[1]}` });
  }
  /* Blat kupiony w calym pasie trzeba docisnac do sciany na miejscu — o tym
     trzeba powiedziec, bo inaczej te kilka milimetrow wychodzi dopiero przy
     montazu. Przy wiekszej roznicy ciecie na wymiar ma sens i wtedy pytamy. */
  if (rt && rt.worktop && rt.docinka > 0) {
    out.push({ level: "info", text: rt.pelnyArkusz
      ? `Blat wychodzi ${fmt(rt.surowa)} mm, a kupuje się go w pasie ${fmt(rt.arkusz)} mm — `
        + `zamawiamy cały pas i zdejmujemy ${fmt(rt.docinka)} mm przy ścianie na miejscu. `
        + `Ściana i tak nie jest prosta, więc docinanie w zakładzie niewiele daje. `
        + `Jeśli nic nie zdejmiesz, blat wystanie o ${fmt(rt.docinka)} mm dalej przed fronty.`
        + `|topcut:1`
      : `Blat zamawiamy docięty do ${fmt(rt.surowa)} mm z pasa ${fmt(rt.arkusz)} mm — `
        + `zdejmuje go zakład, na miejscu zostaje tylko dopasowanie do ściany.`
        + `|topcut:0` });
  }
  /* Dwa odcinki blatu spotykaja sie w rogu. Rozne szerokosci widac tam od razu:
     jeden konczy sie przed licem drugiego albo za nim, a styk trzeba doginac.
     Zwykle chodzi o rozne glebokosci szafek na obu scianach. */
  (project.runs || []).forEach((inny) => {
    if (inny.id === run.id) return;
    const para = (inny.corner && inny.corner.of === run.id)
      || (run.corner && run.corner.of === inny.id);
    if (!para) return;
    const rtI = runTop(project, inny);
    if (!rt || !rtI || !rt.worktop || !rtI.worktop || rt.depth === rtI.depth) return;
    /* Wyrownujemy w dol: glebszy pas schodzi do szerokosci plytszego. Poprawka
       moze dotyczyc tego ciagu albo sasiada, wiec nazwa ciagu idzie w akcji. */
    const glOf = (r, l) => (l && l.pod.length
      ? Math.max(...l.pod.map((c) => Math.round(c.geo.carcassDepth - (Number(c.it.offset) || 0))))
      : Math.max(0, Math.round(Number(r.D) || 0)));
    const glebszy = rt.depth > rtI.depth ? run : inny;
    const rtG = rt.depth > rtI.depth ? rt : rtI;
    const cel = glOf(glebszy, glebszy.id === run.id ? lvl : worktopLevel(project, glebszy))
      - (rtG.depth - Math.min(rt.depth, rtI.depth));
    const fix = cel > 0
      ? `|rundepth:${cel}${glebszy.id === run.id ? "" : "@" + glebszy.id}` : "";
    out.push({ level: "warn", text:
      `Blat tej ściany ma ${fmt(rt.depth)} mm, a sąsiedniej „${inny.name}" ${fmt(rtI.depth)} mm `
      + `— w narożniku spotkają się dwie różne szerokości i styk wypadnie ze skokiem. `
      + `Zwykle bierze się to z różnych głębokości szafek na obu ścianach: `
      + `ciąg „${glebszy.name}" jest głębszy.` + fix });
    /* Sasiad z blatem ponad arkusz 600 nie ma gdzie o tym powiedziec, gdy stoi
       w nim samo ramie — wtedy mowimy to tutaj, przy szafce naroznej. */
    if (rtI.depth > WORKTOP_DEPTHS[0] && !runItems(project, inny.id).length) {
      const celI = glOf(inny, null) - (rtI.depth - WORKTOP_DEPTHS[0]) - 2;
      out.push({ level: "warn", text:
        `Blat nad ramieniem, po stronie ciągu „${inny.name}", wychodzi ${fmt(rtI.depth)} mm `
        + `— nie wytnie się z arkusza ${fmt(WORKTOP_DEPTHS[0])} mm. Ramię jest tak głębokie, `
        + `jak ten ciąg: przy ${fmt(celI)} mm blat zmieści się z zapasem.`
        + (celI > 0 ? `|rundepth:${celI}@${inny.id}` : "") });
    }
  });
  (lvl ? lvl.pod : []).forEach((c) => {
    const nazwa = (c.it.cab.name || "").trim() || "szafka";
    if (c.geo.hasTop) {
      out.push({ level: "warn", text:
        `Szafka „${nazwa}" stoi pod blatem roboczym, a ma wieniec — pod blatem robi się parę wzmocnień: `
        + `z przodu płyta na płask, z tyłu stojąca.`
        + `|noTop:${c.idx}` });
      return;
    }
    /* Bez wienca i bez wzmocnien korpus nie ma sie czym usztywnic — tak wygladaja
       szafki z projektow sprzed blatu ciagu, wiec trzeba je zaczepic. */
    const maWzmocnienia = (c.geo.levels || []).some((lv) =>
      (lv.cols || []).some((k) => (k.rails || []).length));
    if (!maWzmocnienia)
      out.push({ level: "warn", text:
        `Szafka „${nazwa}" nie ma ani wieńca, ani wzmocnień — pod blatem korpus musi się czymś `
        + `usztywnić: z przodu płyta na płask, z tyłu stojąca.`
        + `|noTop:${c.idx}` });
  });
  return out;
};

/* Uwagi o pietrach: gorny ciag nie moze wystawac poza dolny, a pod sufitem
   warto wiedziec, ile jeszcze zostaje. */
const tierMsgs = (project, run) => {
  const out = [];
  if (!run) return out;
  const runs = project.runs || [];
  const dolny = run.tier === "gorny" ? runs.find((r) => r.id === run.wall) : run;
  const gorny = run.tier === "gorny" ? run : runs.find((r) => r.tier === "gorny" && r.wall === run.id);
  if (!dolny || !gorny) return out;
  /* Oba pietra liczymy w tym samym ukladzie sciany: od lewej krawedzi. */
  const zakres = (r) => {
    const { total } = runJoints(project, r);
    const od = r.offsetFrom === "right" ? null : Math.max(0, Math.round(r.offset || 0));
    const sciana = runWallW(project, r);
    const start = od != null ? od
      : sciana != null ? Math.max(0, sciana - Math.max(0, Math.round(r.offset || 0)) - total) : 0;
    return { start, koniec: start + total, total };
  };
  const d = zakres(dolny);
  const g = zakres(gorny);
  if (g.total > 0 && d.total > 0) {
    const zLewej = d.start - g.start;
    const zPrawej = g.koniec - d.koniec;
    if (zLewej > 0 || zPrawej > 0)
      out.push({ level: "warn", text:
        `Ciąg górny wystaje poza dolny`
        + (zLewej > 0 ? ` o ${fmt(zLewej)} mm z lewej` : "")
        + (zLewej > 0 && zPrawej > 0 ? " i" : "")
        + (zPrawej > 0 ? ` o ${fmt(zPrawej)} mm z prawej` : "")
        + ". Górna szafka wisi wtedy nad pustym miejscem — przesuń ciąg albo wyrównaj długości." });
  }
  if (gorny.ceiling != null) {
    const { list } = runJoints(project, gorny);
    if (list.length) {
      const mount = tierMountY(project, gorny);
      const gora = mount + Math.max(...list.map(({ it }) => Math.round(it.cab.H)));
      const luz = Math.round(gorny.ceiling - gora);
      if (luz < 0)
        out.push({ level: "error", text:
          `Szafki górne sięgają ${fmt(gora)} mm, a sufit jest na ${fmt(gorny.ceiling)} mm — `
          + `nie mieszczą się o ${fmt(-luz)} mm.` });
      else
        out.push({ level: "info", text:
          `Nad szafkami górnymi zostaje ${fmt(luz)} mm do sufitu`
          + (luz > 0 ? ` — o tyle da się je jeszcze podwyższyć albo dołożyć blendę.` : ".") });
    }
  }
  return out;
};

const runWideMsgs = (run, total, rp, rt, len) => {
  const out = [];
  if (!run) return out;
  // przy narożniku liczy sie miejsce od rogu, a nie sama suma korpusow
  const zajete = Math.max(total, Math.round(len || 0));
  if (run.wallW != null && zajete > run.wallW)
    out.push({ level: "error", text:
      `Ciąg „${run.name}" zajmuje ${fmt(zajete)} mm`
      + (zajete > total ? ` (${fmt(total)} mm szafek i ${fmt(zajete - total)} mm na narożnik)` : "")
      + `, a ściana ma ${fmt(run.wallW)} mm — brakuje ${fmt(zajete - run.wallW)} mm.` });
  out.push(...splitMsgs("Cokół ciągu", "cokołu ciągu", rp, "plinthauto"));
  out.push(...splitMsgs("Blat ciągu", "blatu ciągu", rt, "topauto"));
  return out;
};

/* Uwagi o narozniku. W rogu zawsze cos przepada — chodzi o to, zeby bylo
   wiadomo ile, po ktorej stronie i czego jeszcze nie da sie z tego wyliczyc.
   Rog dotyczy obu ciagow po rowno, wiec uwage widac z kazdego z nich. */
const cornerPairMsgs = (n, blat) => {
  const out = [];
  const p = n.parent;
  if (!n.corner || !p) return out;
  const wchodzi = n.corner.owner === "self" ? n.run.name : p.run.name;
  const ustepuje = n.corner.owner === "self" ? p : n;
  const strata = Math.round(ustepuje.lead + ustepuje.tail);
  const gdzie = n.corner.at === "end" ? "za jego końcem" : "przed jego początkiem";
  out.push({ level: "info", text:
    `Narożnik: ciąg „${n.run.name}" stoi pod kątem prostym do „${p.run.name}" (${gdzie}). `
    + `W róg wjeżdża „${wchodzi}"`
    + (strata > 0
      ? `, więc ciąg „${ustepuje.run.name}" zaczyna się ${fmt(strata)} mm od rogu.`
      : ".") });
  /* Szafka wjezdzajaca w rog chowa czesc frontu za drugim ciagiem — to wlasnie
     slepy narożnik. Mowimy wprost, ile frontu zostaje do reki. */
  const z = n.blind;
  if (z) {
    const kto = `Szafka „${(z.cab.cab.name || "").trim() || "bez nazwy"}" z ciągu „${z.run.run.name}"`;
    const za = `ciąg „${z.other.run.name}"`;
    const zaCiagiem = `ciągiem „${z.other.run.name}"`;
    if (z.free <= 0)
      out.push({ level: "error", text:
        `${kto} chowa się w całości za ${zaCiagiem} — nie ma jak jej otworzyć. `
        + `Poszerz ją do co najmniej ${fmt(z.other.depth + MIN_COL)} mm albo zrób z niej szafkę narożną.` });
    else if (z.free < MIN_COL)
      out.push({ level: "warn", text:
        `Ślepy narożnik: ${kto} ma ${fmt(z.covered)} mm frontu zasłonięte przez ${za}, `
        + `zostaje ${fmt(z.free)} mm — na drzwi to za mało. Poszerz szafkę albo zrób z niej szafkę narożną.` });
    else
      out.push({ level: "info", text:
        `Ślepy narożnik: ${kto} ma ${fmt(z.covered)} mm frontu zasłonięte przez ${za}, `
        + `do ręki zostaje ${fmt(z.free)} mm. Drzwi rób na tę szerokość, reszta korpusu jest ślepa.` });
  }
  /* Szafka narozna w L: zamiast chowac front za sasiadem, korpus wychodzi
     ramieniem na druga sciane i oba fronty spotykaja sie w rogu. */
  const a = n.arm;
  if (a) {
    const kto = `Szafka „${(a.cab.cab.name || "").trim() || "bez nazwy"}"`;
    const opisDrzwi = {
      wsporniki: "dwa osobne fronty, każdy domykany do swojego ramienia kątownika w wewnętrznym rogu",
      lamane: "dwa skrzydła spięte zawiasami łamanymi — wspornik nie jest potrzebny",
      skrecone: "dwa fronty skręcone na stałe pod kątem 90°, na zawiasach z jednej strony",
      fix: "ramię zaślepione fixem przykręconym na stałe, otwierają się tylko drzwi w korpusie",
    }[a.doors] || "dwa fronty spotykające się pod kątem prostym";
    out.push({ level: "info", text:
      `${kto} jest szafką narożną w L: korpus ${fmt(a.cab.geo.W)} mm przy ścianie „${a.run.run.name}" `
      + `plus ramię ${fmt(a.len)} × ${fmt(a.depth)} mm przy ścianie „${a.other.run.name}". `
      + `Drzwi: ${opisDrzwi}. Płyty poziome ramienia dostawia się na kołki, oklejone na łączeniu.` });
    if (a.front <= 0)
      out.push({ level: "error", text:
        `${kto} nie ma frontu od strony ciągu „${a.run.run.name}" — korpus jest węższy `
        + `niż głębokość ramienia. Poszerz go do co najmniej ${fmt(a.depth + MIN_COL)} mm.` });
    else if (a.front < MIN_COL)
      out.push({ level: "warn", text:
        `${kto} ma od strony ciągu „${a.run.run.name}" tylko ${fmt(a.front)} mm frontu — na drzwi to za mało. `
        + `Poszerz korpus albo wydłuż ramię i przenieś otwieranie na drugą stronę.` });
    if (a.len < MIN_COL)
      out.push({ level: "warn", text:
        `Ramię szafki narożnej ma ${fmt(a.len)} mm — to za krótko na front. Wydłuż je do co najmniej ${fmt(MIN_COL)} mm.` });
    /* Waskie skrzydlo w rogu to nie blad — czasem tak sie po prostu robi, bo
       katownik musi swoje zabrac. Ale warto o tym wiedziec przed zamowieniem. */
    [["od strony ciągu „" + a.run.run.name + "\u201d", a.front],
     ["ramienia", a.armFront]].forEach(([gdzie, szer]) => {
      if (szer > 0 && szer < WASKI_FRONT)
        out.push({ level: "warn", text:
          `${kto}: front ${gdzie} ma ${fmt(szer)} mm — poniżej ${fmt(WASKI_FRONT)} mm. `
          + "Da się tak zrobić, ale skrzydło jest wąskie: sprawdź, czy uchwyt i zawiasy się mieszczą." });
    });
    /* Fronty samej szafki dalej licza sie z jej szerokosci — nad ramieniem
       zadnego frontu nie ma, wiec kolumny trzeba ustawic recznie. */
    /* Geometria w ukladzie liczy sie bez kontekstu rogu (to z niej dopiero
       wychodzi ramie), wiec do porownania z licem bierzemy ja jeszcze raz —
       juz z kontekstem, czyli z frontem doszlifowanym do maskownicy. */
    const geoRog = computeGeo(a.cab.cab, a.cab.rawMat || a.cab.mat, {
      armFree: a.free, armSide: a.side, armKat: bracketPozaLico(a), armFront: a.front });
    const fr = (geoRog.doors || []).filter((d) => d.w > 0 && d.type !== "blenda");
    const zajete = fr.length
      ? (a.side === "right"
        ? Math.max(...fr.map((d) => d.x + d.w))
        : a.cab.geo.W - Math.min(...fr.map((d) => d.x)))
      : 0;
    /* Rozjazd liczy sie w obie strony. Za szeroki front wchodzi na maskownice
       katownika, za waski zostawia miedzy nimi szpare — a tak wlasnie konczy
       sie recznie wpisana szerokosc drzwi po zmianie glebokosci sasiada. */
    const luzLica = ((a.cab.cab.gaps || {}).edge ?? 2) + 3;
    if (a.front > 0 && Math.abs(zajete - a.front) > luzLica) {
      const zaSzerokie = zajete > a.front;
      out.push({ level: "warn", text:
        `Fronty szafki „${(a.cab.cab.name || "").trim() || "w rogu"}" sięgają ${fmt(zajete)} mm od `
        + `${a.side === "right" ? "lewej" : "prawej"} krawędzi, a od tej strony lica przed narożnikiem `
        + `jest ${fmt(a.front)} mm. `
        + (zaSzerokie
          ? "Front wchodzi na maskownicę kątownika. "
          : `Między drzwiami a maskownicą kątownika zostaje ${fmt(a.front - zajete)} mm szpary — `
            + "zwykle znaczy to, że szerokość drzwi jest wpisana ręcznie i nie zmieniła się razem z licem. ")
        + `Zrób jedne drzwi na ${fmt(a.front)} mm — reszta korpusu wchodzi w ramię i frontu nie potrzebuje.`
        + `|cornerdoor:${Math.round(a.front)}:${a.cab.index}` });
    }
    /* Polka ramienia opiera sie jednym koncem o bok ramienia, a drugim dochodzi
       do wnetrza korpusu i musi tam trafic na polke na tej samej wysokosci.
       Odkad narozna jest jedna komora, polka biegnie przez cale wnetrze — ale
       gdy kolumn jest wiecej, ta przy ramieniu moze miec inny podzial i polka
       z sasiedniej kolumny konczy sie w powietrzu. */
    const lvls = a.cab.geo.levels || [];
    const przyRamieniu = new Set(armShelfYs(a.side, lvls));
    const wszystkie = new Set();
    lvls.forEach((lv) => (lv.cols || []).forEach((c) =>
      (c.shelves || []).forEach((s) => wszystkie.add(Math.round(s.y)))));
    const wiszace = [...wszystkie].filter((y) => !przyRamieniu.has(y)).sort((p, q) => p - q);
    if (a.len > 0 && wiszace.length)
      out.push({ level: "error", text:
        `${kto}: półka na ${wiszace.map(fmt).join(", ")} mm nie ma pary w kolumnie od strony ramienia, `
        + `więc w ramieniu skończyłaby się w powietrzu. Ustaw ten sam podział półek w kolumnie przy `
        + `ramieniu albo zrób jedną kolumnę na całe wnętrze — narożna to jedna komora.` });
    /* Luz przy licu szafki naroznej. Od strony ramienia nie ma tam zadnej
       szczeliny — przestrzen miedzy frontem korpusu a frontem ramienia zamyka
       maskownica przy wsporniku — wiec tego odcinka nie liczymy. Po drugiej
       stronie brak frontu to zwykla dziura i granica jest ta sama co wszedzie:
       `maxGap`, domyslnie 5 mm. */
    const fronty = (a.cab.geo.doors || []).filter((d) => d.w > 0);
    const maxG = Math.max(0, Math.round(a.cab.cab.maxGap ?? 5));
    if (fronty.length) {
      const odBoku = a.side === "right"
        ? Math.round(Math.min(...fronty.map((d) => d.x)))
        : Math.round(a.cab.geo.W - Math.max(...fronty.map((d) => d.x + d.w)));
      const bok = a.side === "right" ? "lewym" : "prawym";
      if (odBoku > maxG)
        out.push({ level: "error", text:
          `${kto}: między frontem a ${bok} bokiem korpusu zostaje ${fmt(odBoku)} mm luzu — `
          + `o ${fmt(odBoku - maxG)} mm za dużo, granica to ${fmt(maxG)} mm. `
          + `Po tej stronie nie ma ramienia ani maskownicy, więc jest to odsłonięta szczelina.` });
    }
    if (a.bracket && a.front > 0)
      out.push({ level: "info", text:
        `Kątownik narożnika: cztery płyty po ${fmt(a.bracket.w)} mm — dwie w środku na całą wysokość `
        + "wnętrza i dwie na czole, w licu zamkniętych drzwi. "
        + `Od wewnętrznego naroża zabiera ${fmt(a.bracket.odKorpusu - a.bracket.luz)} mm `
        + `po stronie korpusu i ${fmt(a.bracket.odRamienia - a.bracket.luz)} mm po stronie ramienia `
        + `(plus ${fmt(a.bracket.luz)} mm luzu na każde skrzydło), bo formatka nie schodzi poniżej `
        + `${fmt(a.bracket.w)} mm.` });
  }
  /* Blat nad rogiem. Nie da sie polozyc dwoch plaszczyzn na tym samym rogu,
     wiec albo jedna przechodzi, albo obie tnie sie po przekatnej. */
  /* Odsuniecie liczy sie z szafki stojacej w rogu. Jesli ktoras z pozostalych
     szafek tego ciagu jest glebsza, to ona wejdzie na sasiada. */
  const gl = n.pair && n.pair.glRog;
  if (gl != null) {
    const w2 = n.pair.wchodzi;
    const najgl = Math.max(...w2.g.cabs.map((q) => Math.round(q.geo.carcassDepth - q.offset)));
    if (najgl > gl)
      out.push({ level: "error", text:
        `Ciąg „${w2.run.name}" ma szafkę głębszą (${fmt(najgl)} mm) niż ta stojąca w rogu (${fmt(gl)} mm) `
        + `— o róg odsuwa się tylko ${fmt(gl)} mm, więc głębsza szafka weszłaby na drugi ciąg. `
        + `Zwiększ luz w rogu o ${fmt(najgl - gl)} mm albo wyrównaj głębokości.` });
  }
  if (blat) {
    const przez = n.corner.top === "self" ? n : n.corner.top === "of" ? p : n.pair.wchodzi;
    const drugi = przez === n ? p : n;
    if (n.corner.cut === "skos")
      out.push({ level: "info", text:
        `Blat w narożniku na łyżwę: oba kawałki dochodzą do rogu i są cięte pod 45°. `
        + "Tnij je z jednego arkusza i z tej samej partii — po skosie każda różnica koloru i grubości rzuca się w oczy." });
    else
      out.push({ level: "info", text:
        `Blat w narożniku na styk: przechodzi blat ciągu „${przez.run.name}", `
        + `a blat ciągu „${drugi.run.name}" dojeżdża do jego boku i jest o ${fmt(przez.depth)} mm krótszy. `
        + "Widoczne czoło ma wtedy ten przechodzący — ustaw to tak, żeby wypadło od strony, z której się patrzy." });
  }
  return out;
};

const runCornerMsgs = (node, blat) => {
  if (!node) return [];
  return [...cornerPairMsgs(node, blat), ...node.kids.flatMap((k) => cornerPairMsgs(k, blat))];
};

/* ---------- kontrola otwierania ----------

   Skrzydlo obraca sie wokol pionowej osi przy zawiasach, wiec po drodze
   zakresla cwiartke kola: wzdluz sciany nie wychodzi poza wlasny front, a przed
   lico wyjezdza na cala swoja szerokosc. Sprawdzamy wiec te cwiartke, a nie jej
   pudelko — dwa pudelka przy rogu zachodza na siebie prawie zawsze, a same
   skrzydla juz nie.

   Liczymy to w ukladzie calej zabudowy, nie pojedynczej szafki, bo najczestsza
   kolizja jest wlasnie miedzy scianami: zmywarka przy jednej nie otworzy sie,
   gdy szafka zza rogu wystaje bardziej. runLayout zna obrot kazdej sciany, wiec
   jest z czego brac wspolrzedne.

   Wysuniecie z lica przesuwa cala szafke i siedzi juz w tych wspolrzednych. To
   nie jest „sprzet wystajacy z szafki" — ten dostanie wlasna opcje i wtedy
   dolozy sie tu jako kolejna bryla. */

const SWING_TOL = 2;     // ponizej tego to styk na papierze, nie kolizja

// wspolrzedne pokoju z ramki ciagu; obroty sa wielokrotnoscia 90 stopni,
// wiec prostokat po przeliczeniu dalej jest prostokatem rownoleglym do osi
const roomBox = (n, u0, u1, v0, v1, z0, z1, meta) => {
  const p = [n.at(u0, v0), n.at(u1, v0), n.at(u0, v1), n.at(u1, v1)];
  return {
    x0: Math.min(...p.map((q) => q.x)), x1: Math.max(...p.map((q) => q.x)),
    y0: Math.min(...p.map((q) => q.y)), y1: Math.max(...p.map((q) => q.y)),
    z0, z1, ...meta,
  };
};

/* Skrzydlo: os zawiasow w punkcie (hx, hy), promien rowny szerokosci frontu
   i cwiartka wyznaczona przez dwa kierunki — wzdluz frontu w strone wolnej
   krawedzi i przed lico. Kierunki sa osiowe, wiec cwiartka to zwykle dwie
   polplaszczyzny. */
const swingLeaf = (n, hu, hv, sideSign, r, z0, z1, meta) => {
  const h = n.at(hu, hv);
  const f = n.f;
  return {
    hx: h.x, hy: h.y, r, z0, z1,
    sx: f.ux * sideSign + f.vx, sy: f.uy * sideSign + f.vy,
    ...meta,
  };
};

// o ile skrzydlo wchodzi w bryle; 0 gdy sie mijaja
const swingHit = (s, b) => {
  if (Math.min(s.z1, b.z1) - Math.max(s.z0, b.z0) <= SWING_TOL) return 0;
  // pudelko obciete do cwiartki, w ktorej skrzydlo w ogole sie rusza
  let x0 = b.x0, x1 = b.x1, y0 = b.y0, y1 = b.y1;
  if (s.sx > 0) x0 = Math.max(x0, s.hx); else x1 = Math.min(x1, s.hx);
  if (s.sy > 0) y0 = Math.max(y0, s.hy); else y1 = Math.min(y1, s.hy);
  if (x1 - x0 <= SWING_TOL || y1 - y0 <= SWING_TOL) return 0;
  const cx = Math.min(Math.max(s.hx, x0), x1);
  const cy = Math.min(Math.max(s.hy, y0), y1);
  const d = Math.hypot(cx - s.hx, cy - s.hy);
  return d < s.r - SWING_TOL ? s.r - d : 0;
};

/* Wszystko, co stoi w zabudowie, w jednej liscie bryl: korpusy, fronty
   zamkniete, fronty szuflad wysuniete na dlugosc prowadnicy i uchwyty — bo to
   one stykaja sie pierwsze. Kolizja nie jest sprawa dwoch skrzydel: skrzydlo
   sprawdza sie przeciw wszystkiemu, co stoi na jego drodze. */
const swingBodies = (L) => {
  const bryly = [];
  const skrzydla = [];
  L.info.forEach((n) => {
    n.g.cabs.forEach((c) => {
      /* Szafka narozna ma front przyciety do lica przed narozem, ale geometria
         w ukladzie liczy sie bez kontekstu rogu (to z niej dopiero wychodzi
         ramie). Bez tego kontrola otwierania widzi front przez cala szerokosc
         korpusu i zglasza kolizje, ktorej naprawde nie ma. */
      const ctxRog = armCtxOf(L, c.index);
      const geo = ctxRog ? computeGeo(c.cab, c.rawMat || c.mat, ctxRog) : c.geo;
      const nazwa = (c.cab.name || "").trim() || `szafka ${c.index + 1}`;
      // po nazwie nie da sie rozroznic dwoch szafek nazwanych tak samo
      const kto = { cab: nazwa, run: n.run.name, id: `${n.id}#${c.index}` };
      const u0 = n.lead + c.x;
      const cdV1 = n.depth + c.offset;                 // lico korpusu
      const cdV0 = cdV1 - geo.carcassDepth;            // tyl korpusu
      const zBase = c.base;
      bryly.push(roomBox(n, u0, u0 + geo.W, cdV0, cdV1, zBase, zBase + c.cab.H,
        { ...kto, co: "korpus", klucz: `${kto.id}|korpus` }));
      const overlay = c.cab.frontMode !== "inset";
      const lico = overlay ? cdV1 + geo.tf : cdV1;     // przed czym otwiera sie skrzydlo
      // uchwyt wystaje przed lico i to on styka sie pierwszy — dla drzwi i szuflad tak samo
      const uchwyt = handleOutOf(c.cab);
      (geo.doors || []).forEach((d) => {
        if (!(d.w > 0) || !(d.h > 0)) return;
        const klucz = `${kto.id}|${d.key}`;
        const z0 = zBase + d.y;
        const z1 = zBase + d.y + d.h;
        const fv0 = overlay ? cdV1 : cdV1 - geo.tf;
        if (d.handle && uchwyt > 0)
          bryly.push(roomBox(n, u0 + d.x, u0 + d.x + d.w, lico, lico + uchwyt, z0, z1,
            { ...kto, co: "uchwyt", klucz }));
        if (d.type === "drawer") {
          /* Szuflada w trakcie otwierania wyjezdza frontem na dlugosc
             prowadnicy — dla skrzydla obok to przeszkoda jak kazda inna.
             Uchwyt jedzie razem z frontem, wiec siega jeszcze dalej. */
          const wysuw = Math.max(0, num(d.nl) ?? 0);
          const zasieg = wysuw + (d.handle ? uchwyt : 0);
          bryly.push(roomBox(n, u0 + d.x, u0 + d.x + d.w, fv0, lico + zasieg, z0, z1,
            { ...kto, co: "wysunięty front szuflady", klucz }));
          return;
        }
        // front zamkniety stoi w licu i to w niego uderza sasiednie skrzydlo
        bryly.push(roomBox(n, u0 + d.x, u0 + d.x + d.w, fv0, lico, z0, z1,
          { ...kto, co: d.type === "door" ? "front" : "element stały", klucz }));
        if (d.type !== "door") return;
        // zawias po lewej -> wolna krawedz idzie w prawo, i odwrotnie
        const prawe = d.hingeSide === "right";
        const hu = u0 + d.x + (prawe ? d.w : 0);
        skrzydla.push(swingLeaf(n, hu, lico, prawe ? -1 : 1, d.w, z0, z1,
          { ...kto, klucz, szer: d.w }));
      });
    });
    /* Ramie szafki naroznej lezy w pasie sasiedniej sciany, ale jest kawalkiem
       tamtej szafki — a jego drzwi otwieraja sie jak kazde inne. To wlasnie one
       spotykaja sie w rogu z frontem korpusu. */
    (n.arms || []).forEach((a) => {
      if (!(a.len > 0)) return;
      const nazwa = (a.cab.cab.name || "").trim() || "szafka w rogu";
      const kto = { cab: nazwa, run: a.run.run.name, id: `${a.run.id}#${a.cab.index}` };
      const z0 = a.cab.base;
      const z1 = z0 + a.cab.cab.H;
      // lico ramienia stoi w jednej linii z frontami ciagu, w ktorym lezy
      const lico = armFrontV(a);
      bryly.push(roomBox(n, a.u0, a.u0 + a.len, 0, lico, z0, z1,
        { ...kto, co: "ramię", klucz: `${kto.id}|ramie` }));
      if (a.doors === "fix") return;
      /* Katownik siedzi przy samym rogu, front ramienia zaczyna sie za nim i za
         luzem, a zawiasy ida od konca dalszego od naroza — tak jak je rysujemy.
         Maskownica stoi w licu drzwi, wiec dla skrzydel jest przeszkoda i musi
         trafic do bryl, inaczej kontrola otwierania jej nie zobaczy. */
      const mask = a.len - (a.armFront != null ? a.armFront : a.len);
      const przyKoncu = a.outerAtEnd;            // rog przy poczatku ramienia
      if (mask > 0)
        bryly.push(roomBox(n, a.u0 + (przyKoncu ? 0 : a.len - mask),
          a.u0 + (przyKoncu ? mask : a.len), lico - a.cab.geo.tf, lico, z0, z1,
          { ...kto, co: "maskownica kątownika", klucz: `${kto.id}|kat-maskownica` }));
      const fu0 = przyKoncu ? mask : 0;
      const fu1 = przyKoncu ? a.len : a.len - mask;
      const w = fu1 - fu0;
      if (!(w > 0)) return;
      const klucz = `${kto.id}|ramie-front`;
      // fu0/fu1 sa liczone wzdluz samego ramienia, a zawias siedzi w ciagu
      skrzydla.push(swingLeaf(n, a.u0 + (przyKoncu ? fu1 : fu0), lico, przyKoncu ? -1 : 1,
        w, z0, z1, { ...kto, klucz, szer: w, ramie: true }));
    });
  });
  return { bryly, skrzydla };
};

/* Kolizja otwierania jako blad. Na jedno skrzydlo zostawiamy jedna uwage —
   tego, w co wchodzi najglebiej — bo lista rzeczy do poprawy ma byc krotka,
   a poprawka i tak jest ta sama. */
const openingMsgs = (L) => {
  const out = [];
  if (!L || !L.info) return out;
  const { bryly, skrzydla } = swingBodies(L);
  skrzydla.forEach((s) => {
    let g = null;
    bryly.forEach((b) => {
      // wlasny front, wlasny uchwyt i wlasny korpus to nie przeszkoda
      if (b.klucz === s.klucz || (b.id === s.id && b.co === "korpus")) return;
      const ile = swingHit(s, b);
      if (ile > 0 && (!g || ile > g.ile)) g = { b, ile };
    });
    if (!g) return;
    const gdzie = g.b.run === s.run ? "w tym samym ciągu" : `z ciągu „${g.b.run}"`;
    const czyje = g.b.id === s.id ? "tej samej szafki" : `szafki „${g.b.cab}" ${gdzie}`;
    const zostaje = Math.max(0, Math.round(s.szer - g.ile));
    out.push({ level: "error", text:
      `${s.ramie ? "Front ramienia" : "Skrzydło"} szafki „${s.cab}" (ciąg „${s.run}") nie ma się jak `
      + `otworzyć: po drodze stoi ${g.b.co} ${czyje} — brakuje ${fmt(Math.round(g.ile))} mm. `
      + `Przełóż zawiasy na drugą stronę, zwęź front do ${fmt(zostaje)} mm albo odsuń ciągi w rogu.` });
  });
  return out;
};

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
      sheet.parts.push({ name: p.name, x: r.x, y: r.y, w: hit.w, h: hit.h, rot: hit.rot,
        grain: p.rotatable ? false : true });
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
function packSheets(input, { sheetW = USABLE_W, sheetH = USABLE_H } = {}) {
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
  /* Kazdy material moze miec inny arkusz — plyta meblowa 2761 x 2061 po
     okrawaniu, blat roboczy 4100 x 600 albo 4100 x 1200. */
  return [...groups.entries()].map(([matLabel, list]) => {
    const sh = list.find((r) => r.sheet);
    return {
      matLabel,
      ...packSheets(list, sh ? { sheetW: sh.sheet.w, sheetH: sh.sheet.h } : {}),
    };
  });
}

/* rysunek jednego arkusza z ulozonymi formatkami */
function SheetPlan({ sheet, sheetW, sheetH, index, total }) {
  const pad = 40;
  const vb = `${-pad} ${-pad} ${sheetW + 2 * pad} ${sheetH + 2 * pad + 60}`;
  const used = sheet.parts.reduce((s, p) => s + p.w * p.h, 0);
  const pct = (used / (sheetW * sheetH)) * 100;
  // slojenie biegnie wzdluz dluzszego boku arkusza; formatki z wymuszonym
  // kierunkiem nie sa obracane, wiec ich sloje leza tak samo
  const anyGrain = sheet.parts.some((p) => p.grain);
  const grainArrow = (x, y, len) => {
    const a = Math.min(len * 0.6, 300);
    const x0 = x - a / 2;
    const x1 = x + a / 2;
    return (
      <g opacity="0.55">
        <line x1={x0} y1={y} x2={x1} y2={y} stroke={INK} strokeWidth="3" />
        <path d={`M ${x0} ${y} l 16 -9 v 18 z`} fill={INK} />
        <path d={`M ${x1} ${y} l -16 -9 v 18 z`} fill={INK} />
      </g>
    );
  };
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
            {p.grain && p.w > 190 && p.h > 90 &&
              grainArrow(p.x + p.w / 2, p.y + p.h - 34, p.w)}
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
          {anyGrain ? " — ↔ kierunek słojów" : ""}
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

/* `ctx` i `arm` przychodza z ukladu calego projektu: bez nich kartka szafki
   naroznej liczyla front przez cala szerokosc korpusu i nie pokazywala ramienia,
   czyli wydruk mowil co innego niz aplikacja i niz lista formatek. */
function ReportSheet({ cab, mat, projectName, index, total, sharedPlinth, ctx, arm }) {
  const ambig = useMemo(() => ambiguousThickness([mat]), [mat]);
  const geo = useMemo(() => computeGeo(cab, mat, ctx), [cab, mat, ctx]);
  // cokol ciagu jest wspolny — na kartce szafki go nie ma, idzie osobna pozycja
  const panels = useMemo(
    () => groupPanels(sharedPlinth ? geo.panels.filter((p) => p.name !== "Cokół") : geo.panels),
    [geo.panels, sharedPlinth]
  );
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
              showLabels={false} showHardware={false} arm={arm} />)}
          {box("Widok otwarty — wymiary i okucia",
            <FrontView cab={cab} geo={geo} mat={mat} open showDims showGaps={false}
              showLabels={false} showHardware arm={arm} />)}
          {box("Widok z góry — wymiary i okucia",
            <TopView cab={cab} geo={geo} mat={mat} showDims showShelves showHardware arm={arm} />)}
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
                <td>{matLabelOf(mat[p.matKey], p.matKey, ambig)}</td>
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
                  <td className="num">{hwQty(h)} {hwUnit(h)}{hwNote(h)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {(geo.drillPlan || []).length > 0 && (
          <>
            <div style={{ fontSize: "10pt", fontWeight: 600, margin: "10px 0 4px" }}>
              Wiercenia
            </div>
            <div style={{ fontSize: "8.5pt", color: "#78716c", marginBottom: 3 }}>
              Wysokości liczone od dolnej krawędzi wierconej płyty — tak, jak leży na stole.
            </div>
            <table className="rp-tbl">
              <thead>
                <tr>
                  <th>Płyta</th>
                  <th>Otwory pod</th>
                  <th>Wysokości [mm]</th>
                  <th>Uwagi</th>
                </tr>
              </thead>
              <tbody>
                {geo.drillPlan.flatMap((p) =>
                  p.rows.map((r, k) => (
                    <tr key={p.panel + r.kind + k}>
                      <td>{k === 0 ? p.panel : ""}</td>
                      <td>{r.kind}</td>
                      <td className="num">{r.ys.map((v) => fmt(v)).join(", ")}</td>
                      <td>{r.note}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </>
        )}
      </section>
    </>
  );
}

function PrintReport({ project }) {
  const name = (project.name || "").trim() || DEFAULT_PROJECT_NAME;
  // ciagi, ktore maja wspolny cokol — ich szafki nie licza go u siebie
  const runsWithPlinth = useMemo(() => {
    const s = new Set();
    (project.runs || []).forEach((r) => { if (runPlinth(project, r)) s.add(r.id); });
    return s;
  }, [project]);
  /* Szafka narozna liczy sie z kontekstem rogu — tak samo na wydruku jak
     w aplikacji i w liscie formatek. Ramie idzie na kartke razem z nia. */
  const layout = useMemo(() => projectLayout(project), [project]);
  const armOf = useMemo(() => {
    const m = new Map();
    layout.info.forEach((n) => { if (n.arm) m.set(n.arm.cab.index, n.arm); });
    return m;
  }, [layout]);
  return (
    <div className="print-only" style={{ color: "#1c1917", fontFamily: "ui-sans-serif, system-ui, sans-serif" }}>
      <style>{PRINT_CSS}</style>
      {project.items.map((it, i) => (
        <ReportSheet key={i} cab={it.cab} mat={it.mat} projectName={name}
          index={i} total={project.items.length}
          ctx={armCtxOf(layout, i)} arm={armOf.get(i)}
          sharedPlinth={!!runsWithPlinth.has(it.runId || null)} />
      ))}
      {project.items.length > 1 && <ReportProjectSheet project={project} projectName={name} />}
      <ReportCutPlan project={project} projectName={name} />
    </div>
  );
}

/* rozkroj na arkuszach — ostatnie strony zestawienia */
function ReportCutPlan({ project, projectName }) {
  const ambig = useMemo(() => ambiguousThickness(project.items.map((it) => it.mat)), [project]);
  const groups = useMemo(() => {
    const rows = [];
    projectParts(project).forEach((part) => {
      groupPanels(part.panels).forEach((p) => {
        rows.push({
          name: p.name,
          qty: p.qty,
          a: p.a,
          b: p.b,
          rotatable: p.matKey === "back" || !part.grainMatters,
          matLabel: matLabelOf(part.mat[p.matKey], p.matKey, ambig),
          // blat roboczy uklada sie na wlasnym arkuszu, nie na plycie meblowej
          sheet: p.matKey === "worktop"
            ? { w: WORKTOP_LEN, h: worktopDepth(part.mat) } : null,
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
          Rozkrój na płycie — arkusz {fmt(SHEET_W)} × {fmt(SHEET_H)} mm, po okrawaniu
          {" "}{fmt(USABLE_W)} × {fmt(USABLE_H)} mm, rzaz {KERF} mm
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
  const ambig = useMemo(() => ambiguousThickness(project.items.map((it) => it.mat)), [project]);
  const rows = useMemo(() => {
    const map = new Map();
    projectParts(project).forEach((part) => {
      const cabName = part.name;
      part.panels.forEach((p) => {
        const m = part.mat[p.matKey] || {};
        const e = p.edges;
        const key = [m.name, m.thickness, m.color, p.matKey, p.a, p.b, e.a1, e.a2, e.b1, e.b2, p.name].join("|");
        if (map.has(key)) {
          const g2 = map.get(key);
          g2.qty += p.qty;
          g2.from.set(cabName, (g2.from.get(cabName) || 0) + p.qty);
        } else {
          map.set(key, { ...p, matName: matLabelOf(m, p.matKey, ambig), from: new Map([[cabName, p.qty]]) });
        }
      });
    });
    return [...map.values()].map((p) => ({
      ...p,
      fromLabel: [...p.from.entries()]
        .map(([n, q]) => (p.from.size === 1 && q === p.qty ? n : `${n} × ${q}`))
        .join(", "),
    }));
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
    projectParts(project).forEach((part) => {
      part.hardware.forEach((h) => {
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
            <th>Szafka</th>
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
              <td>{p.fromLabel}</td>
              <td>{p.matName}</td>
              <td className="num">{fmt(p.a)}</td>
              <td className="num">{fmt(p.b)}</td>
              <td className="num">{p.qty}</td>
              <td>{edgeText(p)}</td>
            </tr>
          ))}
          <tr>
            <td colSpan={5} style={{ fontWeight: 600 }}>Razem</td>
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
                <td className="num">{hwQty(h)} {hwUnit(h)}{hwNote(h)}</td>
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
  /* projekt = lista szafek (kazda ma swoj cab i mat) + aktywny indeks; runs to
     ciagi, a szafka wskazuje swoj ciag przez runId (null = wolnostojaca) */
  const [project, setProjectRaw] = useState(newProject);
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
  const addCabinet = useCallback((tplId, runId = null) => setProject((p) => {
    // nastepny numer = max z istniejacych "Szafka N" + 1 (odporne na usuwanie)
    const nums = p.items.map((it) => {
      const m = /^Szafka (\d+)$/.exec((it.cab.name || "").trim());
      return m ? Number(m[1]) : 0;
    });
    const next = Math.max(0, ...nums) + 1;
    const base = tplId ? makeFromTemplate(tplId) : { ...defaultCab };
    const run = (p.runs || []).find((r) => r.id === runId);
    /* Szafka zakladana w ciagu bierze jego sposob wieszania, a stojac na podlodze
       dostaje nozki — inaczej aplikacja sama tworzylaby rozjazd i od razu na
       niego narzekala. */
    const stoi = run && !(run.mountY > 0);
    /* Szafka wchodzaca pod blat roboczy nie ma wienca — zamiast niego dostaje
       pare wzmocnien: z przodu plyta na plask, do ktorej przykreca sie blat,
       z tylu stojaca, ktora trzyma korpus w kacie prostym. */
    const podBlat = !!(run && run.worktop);
    const fresh = { cab: { ...base, name: `Szafka ${next}`,
      ...(run ? { hangerMode: run.hangerMode || "listwa" } : {}),
      ...(podBlat ? bezWienca(base) : {}),
      ...(stoi ? { legs: { ...(base.legs || { height: 100, color: "#3f3f46", shape: "box" }), on: true } } : {}) },
      mat: defaultMaterials, runId };
    /* Nowa szafka ciagu ma stanac na jego koncu, a nie na koncu calego projektu —
       inaczej kolejnosc przy scianie zalezalaby od tego, w jakiej kolejnosci
       dokladano szafki do roznych ciagow. */
    const last = p.items.reduce((acc, it, k) => ((it.runId || null) === runId ? k : acc), -1);
    const at = last >= 0 ? last + 1 : p.items.length;
    const items = [...p.items.slice(0, at), fresh, ...p.items.slice(at)];
    /* Szablon narożnika składa cały układ, a nie samą szafkę: za rogiem staje
       drugi ciąg pod kątem prostym. Szafek w nim nie zakładamy — dokłada się je
       samemu — ale sam ciąg musi być, bo to od jego głębokości liczy się
       długość ramienia i szerokość frontu w rogu. */
    const tpl = tplId ? TEMPLATES.find((t) => t.id === tplId) : null;
    if (!tpl || !tpl.corner) return withRunDefaults({ ...p, items, active: at }, runId);
    let runs = p.runs || [];
    /* Narożnik to zawsze dwie ściany, więc szafka dodana poza ciągiem dostaje
       najpierw swój własny — inaczej nie byłoby czego zaginać. */
    let bazowy = runId;
    if (!bazowy) {
      const pierwszy = makeRun(runs);
      runs = [...runs, pierwszy];
      bazowy = pierwszy.id;
      /* Ciag powstaje dopiero teraz, wiec szafka nie przeszla przez zwykla
         sciezke „nowa szafka w ciagu" — blat trzeba jej uwzglednic tutaj,
         inaczej narożnik jako jedyny zostawalby z wiencem. */
      const wRogu = { ...items[at].cab, hangerMode: pierwszy.hangerMode || "listwa",
        legs: { ...(base.legs || { height: 100, color: "#3f3f46", shape: "box" }), on: true } };
      items[at] = { ...items[at], runId: bazowy,
        cab: pierwszy.worktop ? { ...wRogu, ...bezWienca(wRogu) } : wRogu };
    }
    /* Pusty ciag nie ma szafki, od ktorej wzialby glebokosc, wiec dostaje ja od
       razu z szablonu — inaczej ramie nie mialoby o co sie oprzec. */
    const nowy = { ...makeRun(runs), D: tpl.otherD || null,
      corner: { of: bazowy, at: "end", owner: "of", clear: 0 } };
    return withRunDefaults(
      withRunDefaults({ ...p, runs: [...runs, nowy], items, active: at }, bazowy),
      nowy.id);
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

  /* --- ciagi meblowe ---
     Przestawienie szafek zmienia ich numery, wiec aktywna trzymamy po tozsamosci
     obiektu, a nie po indeksie — inaczej po kazdym ruchu skakalibysmy na inna. */
  const reorderItems = (p, from, to) => {
    const items = p.items.slice();
    const [moved] = items.splice(from, 1);
    items.splice(to, 0, moved);
    return { ...p, items, active: Math.max(0, items.indexOf(p.items[p.active])) };
  };

  /* Pusty ciag nie ma jeszcze wymiarow — bierze je od pierwszej szafki, ktora do
     niego trafi. Kolejnym niczego nie narzuca po cichu: rozjazd zglasza uwaga
     z przyciskami, zeby zmiana wymiaru zawsze byla swiadoma. */
  const withRunDefaults = (p, runId) => {
    if (!runId) return p;
    const run = (p.runs || []).find((r) => r.id === runId);
    if (!run || run.H != null) return p;
    const list = runItems(p, runId);
    if (!list.length) return p;
    const c = list[0].it.cab;
    return { ...p, runs: p.runs.map((r) => (r.id === runId
      ? { ...r, H: c.H, D: c.D, plinth: c.plinth ? { ...c.plinth } : null } : r)) };
  };

  const addRun = useCallback(() => setProject((p) => {
    const runs = p.runs || [];
    return { ...p, runs: [...runs, makeRun(runs)] };
  }), [setProject]);

  /* Gorne pietro tej samej sciany. Wysokosc montazu liczy sie z lica dolnego
     plus przeswit — zapisujemy ja od razu, zeby nowa szafka wiedziala, ze wisi. */
  const addUpperRun = useCallback((dolnyId) => setProject((p) => {
    const runs = p.runs || [];
    const dolny = runs.find((r) => r.id === dolnyId);
    if (!dolny || runs.some((r) => r.tier === "gorny" && r.wall === dolnyId)) return p;
    const gorny = makeUpperRun(runs, dolny, 0);
    const mount = tierMountY({ ...p, runs: [...runs, gorny] }, gorny);
    return { ...p, runs: [...runs, { ...gorny, mountY: mount }] };
  }), [setProject]);

  /* Kasowanie ciagu. Idzie z nim wszystko, co bez niego nie ma sensu: jego
     szafki i gorne pietro tej samej sciany. Sasiad, ktory mial tu narożnik,
     zostaje — traci tylko powiazanie z rogiem. Ostatnich szafek w projekcie nie
     zabieramy, bo aplikacja nie ma czego pokazac. */
  const deleteRun = useCallback((id) => setProject((p) => {
    const runs = p.runs || [];
    if (!runs.some((r) => r.id === id)) return p;
    const znikaja = new Set([id,
      ...runs.filter((r) => r.tier === "gorny" && r.wall === id).map((r) => r.id)]);
    const items = p.items.filter((it) => !znikaja.has(it.runId));
    if (!items.length) return p;
    const zostaja = runs.filter((r) => !znikaja.has(r.id))
      .map((r) => (r.corner && znikaja.has(r.corner.of) ? { ...r, corner: null } : r));
    return { ...p, runs: zostaja, items,
      active: Math.max(0, items.indexOf(p.items[p.active])) };
  }), [setProject]);

  const setRun = useCallback((id, patch) => setProject((p) => ({
    ...p, runs: (p.runs || []).map((r) => (r.id === id ? { ...r, ...patch } : r)),
  })), [setProject]);

  /* Przelaczenie styku przechodzi z podzialu automatycznego na reczny — od tego
     momentu ciag trzyma sie dokladnie tych ciec, ktore wskazales. */
  const toggleCut = useCallback((id, key, calc, j) => setProject((p) => ({
    ...p,
    runs: (p.runs || []).map((r) => {
      if (r.id !== id) return r;
      const s = calc(p, r);
      const cur = s ? s.cuts : [];
      const next = cur.includes(j) ? cur.filter((c) => c !== j) : [...cur, j].sort((a, b) => a - b);
      return { ...r, [key]: next };
    }),
  })), [setProject]);

  // wymiar wspolny zmienia sie w ciagu i we wszystkich jego szafkach naraz
  const setRunShared = useCallback((id, patch) => setProject((p) => ({
    ...p,
    runs: (p.runs || []).map((r) => (r.id === id ? { ...r, ...patch } : r)),
    items: p.items.map((it) => ((it.runId || null) === id ? { ...it, cab: { ...it.cab, ...patch } } : it)),
  })), [setProject]);

  const removeRun = useCallback((id) => setProject((p) => ({
    ...p,
    // narożnik wskazujacy na skasowany ciag przestaje cokolwiek znaczyc
    runs: (p.runs || []).filter((r) => r.id !== id)
      .map((r) => (r.corner && r.corner.of === id ? { ...r, corner: null } : r)),
    // rozwiazanie ciagu nie kasuje szafek — wracaja miedzy wolnostojace
    items: p.items.map((it) => ((it.runId || null) === id ? { ...it, runId: null } : it)),
  })), [setProject]);

  /* Narożnik. `of` = ciag, do ktorego sie dostawiamy; brak = ciag stoi osobno.
     Domyslnie w rog wjezdza tamten ciag, bo tak sie zwykle robi kuchnie: jedna
     sciana idzie do konca, druga zaczyna sie za jej glebokoscia. */
  const setCorner = useCallback((id, of, patch) => setProject((p) => ({
    ...p,
    runs: (p.runs || []).map((r) => {
      if (r.id !== id) return r;
      if (!of) return { ...r, corner: null };
      return { ...r, corner: migrateCorner({ at: "end", owner: "of", clear: 0, ...(r.corner || {}), ...patch, of }) };
    }),
  })), [setProject]);

  // przypisanie szafki do ciagu dostawia ja na jego koncu, zeby kolejnosc przy
  // scianie zawsze zgadzala sie z kolejnoscia w projekcie
  const assignCabinet = useCallback((i, runId) => setProject((p) => {
    const cur = p.items[i];
    if (!cur || (cur.runId || null) === (runId || null)) return p;
    const items = p.items.slice();
    items[i] = { ...cur, runId: runId || null };
    const next = { ...p, items, active: p.active === i ? i : p.active };
    const last = items.reduce((acc, it, k) => (k !== i && (it.runId || null) === (runId || null) ? k : acc), -1);
    if (last < 0) return withRunDefaults({ ...next, active: i }, runId);
    const to = last < i ? last + 1 : last;
    return withRunDefaults(reorderItems({ ...next, active: i }, i, to), runId);
  }), [setProject]);

  /* Wysuniecie z lica ciagu. Zwykle 0 — fronty stoja w jednej linii — ale bywa,
     ze jedna szafka ma stac dalej albo blizej sciany i wtedy to jest zabieg
     celowy, a nie blad. */
  const setOffset = useCallback((i, v) => setProject((p) => {
    const items = p.items.slice();
    if (!items[i]) return p;
    items[i] = { ...items[i], offset: Math.round(Number(v) || 0) };
    return { ...p, items };
  }), [setProject]);

  // przesuwanie w obrebie ciagu — sasiadem jest najblizsza szafka tego samego ciagu
  const moveCabinet = useCallback((i, dir) => setProject((p) => {
    const rid = p.items[i] ? p.items[i].runId || null : null;
    let j = i + dir;
    while (j >= 0 && j < p.items.length && (p.items[j].runId || null) !== rid) j += dir;
    if (j < 0 || j >= p.items.length) return p;
    return reorderItems(p, i, j);
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
      { name: project.name, prices: project.prices, items: project.items, runs: project.runs, active: project.active },
      null,
      2
    );
    // nazwa pliku z nazwy projektu — bez znakow, ktore psuja sciezke
    const base =
      (project.name || DEFAULT_PROJECT_NAME).trim().replace(/[\\/:*?"<>|]+/g, "-").slice(0, 60) ||
      "projekt";
    /* W ramce (podglad na cudzej stronie) pobieranie jest zablokowane przez
       piaskownice i klikniecie w link po prostu nic nie robi — bez wyjatku, wiec
       nie da sie tego wylapac w `catch`. Wtedy od razu pokazujemy tekst do
       skopiowania, zamiast udawac, ze plik poszedl. */
    let wRamce = false;
    try { wRamce = window.top !== window.self; } catch (e) { wRamce = true; }
    if (wRamce) {
      setTransfer({ mode: "export", text: json });
      setSaved("podgląd w ramce nie pobiera plików — skopiuj tekst projektu");
      return;
    }
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
  const [scope, setScope] = useState("cab"); // "cab" | "run" | "all"
  const [showDims, setShowDims] = useState(true);
  const [showGaps, setShowGaps] = useState(false);
  const [showLabels, setShowLabels] = useState(false);
  const [showShelves, setShowShelves] = useState(false);
  const [sideWhich, setSideWhich] = useState("left");
  const [showHardware, setShowHardware] = useState(true);
  /* Przeczytane podpowiedzi chowaja sie z listy. To nie jest czesc projektu —
     dotyczy tego, co juz raz przeczytales, wiec siedzi obok, w przegladarce. */
  const [przeczytane, setPrzeczytane] = useState(() => {
    try { return new Set(JSON.parse(localStorage.getItem("szafki:przeczytane") || "[]")); }
    catch (e) { return new Set(); }
  });
  const [pokazPrzeczytane, setPokazPrzeczytane] = useState(false);
  const [pokazPrzeczytaneW, setPokazPrzeczytaneW] = useState(false);
  const oznaczPrzeczytane = useCallback((tekst, czy) => setPrzeczytane((prev) => {
    const next = new Set(prev);
    if (czy) next.add(tekst); else next.delete(tekst);
    try { localStorage.setItem("szafki:przeczytane", JSON.stringify([...next])); } catch (e) {}
    return next;
  }), []);
  // ptaszek „przeczytane" przy uwadze — ten sam przy ostrzezeniach i podpowiedziach
  const znacznik = useCallback((tekst, czyt) => (
    <button onClick={() => oznaczPrzeczytane(tekst, !czyt)}
      title={czyt ? "Oznacz jako nieprzeczytane" : "Oznacz jako przeczytane"}
      className={"mt-0.5 shrink-0 rounded border px-1 text-[10px] leading-4 "
        + (czyt ? "border-teal-600 bg-teal-700 text-white"
          : "border-stone-300 text-stone-400 hover:border-stone-500 hover:text-stone-600")}>
      ✓
    </button>
  ), [oznaczPrzeczytane]);

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
          JSON.stringify({ name: project.name, prices: project.prices, items: project.items, runs: project.runs, active: project.active })
        );
        setSaved("zapisano " + new Date().toLocaleTimeString("pl-PL"));
      } catch (e) {
        setSaved("nie udało się zapisać");
      }
    }, 800);
    return () => clearTimeout(id);
  }, [project, loaded]);

  /* Szafka narozna liczy sie z kontekstem rogu — bez niego jej wzmocnienia
     bylyby dluzsze niz lico, ktore im zostaje. */
  const projLayoutGeo = useMemo(() => projectLayout(project), [project]);
  const geo = useMemo(
    () => computeGeo(cab, mat, armCtxOf(projLayoutGeo, project.active)),
    [cab, mat, projLayoutGeo, project.active]
  );

  /* wiersze paska szafek: kazdy ciag osobno, wolnostojace na koncu. Gdy nie ma
     zadnego ciagu zostaje jeden wiersz i pasek wyglada dokladnie jak dotad. */
  const groupBar = useMemo(() => {
    const runs = project.runs || [];
    /* Sciana z dwoma pietrami pokazuje je osobno i podpisuje, ktore jest ktore —
       samo „Ściana 1" przestaje wystarczac. */
    const rows = runs.map((r) => ({ id: r.id, label: runLabel(runs, r), tier: r.tier,
      maGorny: runs.some((q) => q.tier === "gorny" && q.wall === r.id) }));
    if (!runs.length) rows.push({ id: null, label: "Szafki:" });
    else if (runItems(project, null).length) rows.push({ id: null, label: "Wolnostojące" });
    return rows;
  }, [project]);

  // dane ciagu, w ktorym stoi aktywna szafka (null dla wolnostojacej)
  const runInfo = useMemo(() => {
    const id = project.items[project.active].runId || null;
    const run = (project.runs || []).find((r) => r.id === id);
    if (!run) return null;
    const list = runItems(project, id);
    // szerokosc bierzemy z geometrii, nie z cab.W — przy blacie "do wewnatrz" korpus jest wezszy
    const total = list.reduce((s, { it }) => s + computeGeo(it.cab, it.mat).W, 0)
      + Math.max(0, list.length - 1) * (run.gap || 0);
    return { run, count: list.length, total, pos: list.findIndex(({ i }) => i === project.active) + 1 };
  }, [project]);

  /* Szafka w ciagu nie ma wlasnego cokolu, blatu ani listwy — te ida przez caly
     ciag, wiec ich formatki i metry pokazujemy przy ciagu, a nie przy szafce. */
  const runPl = useMemo(() => (runInfo ? runPlinth(project, runInfo.run) : null), [project, runInfo]);
  const runTp = useMemo(() => (runInfo ? runTop(project, runInfo.run) : null), [project, runInfo]);
  const runRl = useMemo(() => (runInfo ? runRail(project, runInfo.run) : null), [project, runInfo]);
  /* Ciag albo wisi, albo stoi — i tylko jedno z dwoch ustawien ma wtedy sens.
     Stojacy nie potrzebuje zawieszek, wiszacy nie ma na czym postawic cokolu. */
  const ciagWisi = !!runInfo && (runInfo.run.mountY > 0 || !!runRl);
  /* Ta sama zasada przy pojedynczej szafce: nozki albo cokol znacza, ze stoi
     na podlodze, wiec zawieszek nie ma po co pokazywac. */
  const szafkaStoi = !!((cab.legs && cab.legs.on) || (cab.plinth && cab.plinth.on)
    || (runInfo && !ciagWisi));

  const cabHardware = useMemo(
    () => (runRl ? geo.hardware.filter((h) => h.name !== RAIL_NAME) : geo.hardware),
    [geo, runRl]
  );

  /* Zakres rysunku: pojedyncza szafka, jej ciag albo cala zabudowa. Zabudowa ma
     sens dopiero przy kilku ciagach — inaczej byloby to to samo, co ciag. */
  const scopeOpts = useMemo(() => {
    const out = [{ v: "cab", l: "Szafka" }];
    if (runInfo) out.push({ v: "run", l: "Ciąg" });
    if (drawableRuns(project).length > 1)
      out.push({ v: "all", l: "Zabudowa" });
    return out;
  }, [project, runInfo]);

  // ciagi objete rysunkiem; null = rysujemy pojedyncza szafke jak dotad
  /* Sciana z dwoma pietrami: zakres „Ciąg" dostaje jeszcze wybor, ktore z nich
     ogladamy — samo dolne, samo gorne, czy oba naraz. */
  const [tierScope, setTierScope] = useState("calosc");
  const pietraSciany = useMemo(() => {
    if (!runInfo) return null;
    const runs = project.runs || [];
    const dolny = runInfo.run.tier === "gorny"
      ? runs.find((r) => r.id === runInfo.run.wall) : runInfo.run;
    if (!dolny) return null;
    const gorny = runs.find((r) => r.tier === "gorny" && r.wall === dolny.id);
    return gorny ? { dolny, gorny } : null;
  }, [project, runInfo]);

  const scopeRuns = useMemo(() => {
    if (scope === "run" && runInfo) {
      if (!pietraSciany) return [runInfo.run];
      if (tierScope === "dolny") return [pietraSciany.dolny];
      if (tierScope === "gorny") return [pietraSciany.gorny];
      return [pietraSciany.dolny, pietraSciany.gorny];
    }
    if (scope === "all") return drawableRuns(project);
    return null;
  }, [scope, project, runInfo, pietraSciany, tierScope]);

  /* Bryly nie da sie zlozyc z jednego ciagu, gdy w rogu wychodzi z niego ramie:
     lezy ono w pasie sasiada, wiec do 3D dobieramy tez tamten ciag. Rysunki
     plaskie radza sobie bez tego — tam ramie dostawia sie za koniec. */
  const scope3dRuns = useMemo(() => {
    if (!scopeRuns) return scopeRuns;
    const wszystkie = project.runs || [];
    const out = [...scopeRuns];
    const dodaj = (id) => {
      const r = wszystkie.find((q) => q.id === id);
      if (r && !out.some((q) => q.id === id)) out.push(r);
    };
    scopeRuns.forEach((r) => {
      if (r.corner && r.corner.of) dodaj(r.corner.of);
      wszystkie.forEach((o) => { if (o.corner && o.corner.of === r.id) dodaj(o.id); });
    });
    return out;
  }, [scopeRuns, project]);

  const rpOf = useCallback((run) => runPlinth(project, run), [project]);

  // zakres, ktory zniknal (np. po przejsciu na szafke wolnostojaca), wraca na szafke
  useEffect(() => {
    if (!scopeOpts.some((o) => o.v === scope)) setScope("cab");
  }, [scopeOpts, scope]);

  /* Widok z boku ma sens tylko dla pojedynczej szafki — bok ciagu to bok szafki
     skrajnej, wiec przy zabudowie tej pozycji nie pokazujemy. */
  const viewOpts = useMemo(() => {
    const base = [
      { v: "closed", l: "Zamk." },
      { v: "open", l: "Otw." },
      ...(scopeRuns ? [] : [{ v: "side", l: "Z boku" }]),
      { v: "top", l: "Z góry" },
      { v: "rear", l: "Z tyłu" },
      { v: "3d", l: "3D" },
      /* Szybki podglad zlozonej zabudowy: staly widok 3/4, bez obracania —
         chodzi o to, zeby jednym kliknieciem zobaczyc calosc tak samo za
         kazdym razem. */
      ...(scopeRuns ? [{ v: "iso", l: "45°" }] : []),
    ];
    return base;
  }, [scopeRuns]);

  useEffect(() => {
    if (!viewOpts.some((o) => o.v === view)) setView("closed");
  }, [viewOpts, view]);

  /* Uwagi wszystkich szafek naraz. Bez tego uwaga do szafki, ktorej akurat nie
     ogladamy, jest niewidoczna — a przy ciagu to wlasnie sasiadka bywa ta,
     ktora sie rozjechala. Geometrie liczymy raz i uzywamy do obu rzeczy. */
  const projectNotes = useMemo(() => {
    /* Szafka narozna liczy sie z kontekstem rogu — bez niego jej uwagi mowily
       o froncie przez cala szerokosc korpusu, czyli o czyms, czego nie ma. */
    const geos = project.items.map((it, i) =>
      computeGeo(it.cab, it.mat, armCtxOf(projLayoutGeo, i)));
    const ctx = new Map();
    (project.runs || []).forEach((r) => {
      const list = runItems(project, r.id);
      const total = list.reduce((s, { i }) => s + geos[i].W, 0)
        + Math.max(0, list.length - 1) * (r.gap || 0);
      ctx.set(r.id, { run: r, total, rp: runPlinth(project, r) });
    });
    return project.items.map((it, i) => {
      const c = ctx.get(it.runId || null);
      /* Odhaczone ostrzezenia znikaja tez z listy „w innych szafkach" i z paska
         nad projektem — inaczej to samo zdanie, raz przeczytane, dalej wolalo
         o sobie z drugiego konca ekranu. Bledy licza sie zawsze. */
      const msgs = [...runCabMsgs(c && c.run, it.cab), ...geos[i].msgs];
      return {
        i,
        name: (it.cab.name || "").trim() || `Szafka ${i + 1}`,
        err: msgs.filter((m) => m.level === "error").length,
        warn: msgs.filter((m) => m.level === "warn" && !przeczytane.has(m.text)).length,
      };
    });
  }, [project, przeczytane, projLayoutGeo]);

  // uwagi pozostalych szafek — tylko bledy i ostrzezenia, podpowiedzi zostawiamy
  // przy szafce, ktorej dotycza, zeby lista nie spuchla
  const otherNotes = useMemo(
    () => projectNotes.filter((n) => n.i !== project.active && (n.err > 0 || n.warn > 0)),
    [projectNotes, project.active]
  );

  /* Uwagi ciagu ida do tej samej karty co uwagi szafki — z punktu widzenia
     uzytkownika to jedna lista rzeczy do sprawdzenia. */
  /* Rozmieszczenie wszystkich ciagow — narożnik jednego przesuwa drugi, wiec
     karta ciagu i uwagi musza patrzec na cala zabudowe, nie tylko na siebie. */
  const projLayout = useMemo(() => projectLayout(project), [project]);
  const runNode = runInfo ? projLayout.info.get(runInfo.run.id) : null;

  /* Ramie w L moze dostac tylko ta szafka, ktora faktycznie stoi w rogu —
     dlatego pytamy o to rozmieszczenie, a nie uzytkownika. */
  const cornerNode = useMemo(() => {
    const c = project.items[project.active].cab;
    let found = null;
    projLayout.info.forEach((n) => {
      if (n.pair && n.pair.rogowa && n.pair.rogowa.cab === c) found = n;
    });
    return found;
  }, [projLayout, project]);

  /* Do narożnika mozna wskazac kazdy inny ciag oprocz tych, ktore same wisza
     na naszym — inaczej powstalby pierscien scian bez poczatku. */
  const cornerCandidates = useMemo(() => {
    if (!runInfo) return [];
    const runs = (project.runs || []).filter((r) => runItems(project, r.id).length);
    const wisiNaNas = (r) => {
      for (let q = r, n = 0; q && q.corner && n <= runs.length; n++) {
        if (q.corner.of === runInfo.run.id) return true;
        q = runs.find((x) => x.id === q.corner.of);
      }
      return false;
    };
    return runs.filter((r) => r.id !== runInfo.run.id && !wisiNaNas(r));
  }, [project, runInfo]);

  const runMsgs = useMemo(() => {
    if (!runInfo) return [];
    const c = project.items[project.active].cab;
    const node = projLayout.info.get(runInfo.run.id);
    return [...runCabMsgs(runInfo.run, c),
      ...runWideMsgs(runInfo.run, runInfo.total, runPl, runTp, node ? node.len : 0),
      ...worktopMsgs(project, runInfo.run),
      ...tierMsgs(project, runInfo.run),
      ...runCornerMsgs(node, !!runTp),
      /* Kolizje otwierania sa sprawa calej zabudowy, a nie tego jednego ciagu —
         dlatego lecimy po calym rozmieszczeniu i pokazujemy wszystkie. */
      ...openingMsgs(projLayout)];
  }, [project, runInfo, runPl, runTp, projLayout]);

  // przyciski naprawy uwag ciagu: albo szafka idzie za ciagiem, albo ciag za szafka
  const runFix = useCallback((action) => {
    if (!runInfo) return;
    if (action === "plinthauto") { setRun(runInfo.run.id, { plinthCuts: null }); return; }
    if (action === "topauto") { setRun(runInfo.run.id, { topCuts: null }); return; }
    if (action.startsWith("topcut:")) {
      setRun(runInfo.run.id, { topCut: action === "topcut:1" });
      return;
    }
    if (action.startsWith("rundepth:")) {
      const [dRaw, gdzie] = action.slice("rundepth:".length).split("@");
      const d = Math.max(1, Math.round(Number(dRaw) || 0));
      setRunShared(gdzie || runInfo.run.id, { D: d });
      return;
    }
    const [kind, field] = action.split(":");
    if (!RUN_SHARED.includes(field)) return;
    const { run } = runInfo;
    const c = project.items[project.active].cab;
    const fromCab = field === "plinth" ? { ...c.plinth }
      : field === "hangerMode" ? (c.hangerMode || "listwa") : Math.round(c[field]);
    const fromRun = field === "plinth" ? { ...run.plinth }
      : field === "hangerMode" ? (run.hangerMode || "listwa") : run[field];
    if (kind === "runrun") setRunShared(run.id, { [field]: fromCab });
    else setCab((cur) => ({ ...cur, [field]: fromRun }));
  }, [project, runInfo, setRunShared, setCab, setRun]);

  const set = useCallback((patch) => setCab((c) => ({ ...c, ...patch })), [setCab]);
  // szerszy arkusz blatu — zmienia material, wiec dotyczy calego projektu
  const setMatDepth = useCallback((d) =>
    setMat((m) => ({ ...m, worktop: { ...m.worktop, depth: d } })), [setMat]);
  const setGap = (k, v) => setCab((c) => ({ ...c, gaps: { ...c.gaps, [k]: v } }));

  /* --- edycja struktury --- */
  const editLevels = (fn) =>
    setCab((c) => {
      const levels = JSON.parse(JSON.stringify(c.levels));
      fn(levels);
      return { ...c, levels };
    });

  /* To samo, ale dla dowolnej szafki w projekcie — uwagi ciagu widac takze
     z sasiadki, wiec przycisk naprawy musi trafic w te wlasciwa. */
  const editItemLevels = useCallback((i, fn) => setProject((p) => {
    const items = p.items.slice();
    if (!items[i]) return p;
    const levels = JSON.parse(JSON.stringify(items[i].cab.levels));
    fn(levels);
    items[i] = { ...items[i], cab: { ...items[i].cab, levels } };
    return { ...p, items };
  }), [setProject]);

  /* Poprawka z Uwag potrafi ruszyc wiecej niz same poziomy — zamiana wienca na
     wzmocnienia zmienia tez laczenia korpusu. */
  const editItemCab = useCallback((i, fn) => setProject((p) => {
    const items = p.items.slice();
    if (!items[i]) return p;
    const cab = JSON.parse(JSON.stringify(items[i].cab));
    fn(cab);
    items[i] = { ...items[i], cab };
    return { ...p, items };
  }), [setProject]);

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
  const setCol = (i, j, patch) =>
    editLevels((L) => Object.assign(L[i].cols[j], patch));
  /* Wciecie zastepuje uchwyt, wiec wlaczenie go zdejmuje z calej kolumny —
     pojedyncza szuflada moze go potem dostac z powrotem. Wylaczenie wciecia
     oddaje uchwyty, bo inaczej szuflady nie ma za co chwycic. */
  const setFingerGrip = (i, j, v) =>
    editLevels((L) => {
      const col = L[i].cols[j];
      col.fingerGrip = v;
      (col.drawers || []).forEach((d) => { d.handle = !v; });
    });
  const addDrawer = (i, j) => editLevels((L) => L[i].cols[j].drawers.push(newDrawer()));
  const removeDrawer = (i, j, k) => editLevels((L) => L[i].cols[j].drawers.splice(k, 1));
  const addRail = (i, j) => editLevels((L) => { if (!Array.isArray(L[i].cols[j].rails)) L[i].cols[j].rails = []; L[i].cols[j].rails.push(newRail()); });
  /* Szafka bez wienca musi sie czyms usztywnic, a pod blatem robi sie to zawsze
     tak samo: z przodu plyta na plask, zeby bylo do czego przykrecic blat,
     z tylu stojaca, ktora trzyma korpus w kacie prostym. Jednym kliknieciem,
     bo inaczej trzeba to skladac z dwoch wzmocnien i czterech pol. */
  const addRailPair = (i, j) => editLevels((L) => {
    const col = L[i].cols[j];
    col.rails = [...(col.rails || []), ...railPair()];
  });
  const removeRail = (i, j, k) => editLevels((L) => L[i].cols[j].rails.splice(k, 1));
  const setRail = (i, j, k, patch) => editLevels((L) => { L[i].cols[j].rails[k] = { ...L[i].cols[j].rails[k], ...patch }; });
  const setDrawer = (i, j, k, patch) =>
    editLevels((L) => Object.assign(L[i].cols[j].drawers[k], patch));
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
  /* Przelicza liczbe polek tak, jakby kolumna powstawala od nowa: tyle, ile
     zmiesci sie przy swietle co najmniej MIN_OPENING. Wysokosc kolumny bierzemy
     z policzonej geometrii, wiec cokol, wieniec i poziomy sa juz odliczone. */
  const fitShelves = (i, j) => {
    const col = geo.levels[i] && geo.levels[i].cols[j];
    if (!col) return;
    const lv = geo.levels[i];
    const inner = lv.y1 - lv.y0;
    const n = autoShelves(inner, geo.t);
    editLevels((L) => (L[i].cols[j].shelfTargets = Array(n + 1).fill(null)));
  };
  /* To samo dla calej szafki — po zmianie wysokosci wygodniej klinkac raz. */
  const fitShelvesAll = () =>
    editLevels((L) =>
      geo.levels.forEach((lv) => {
        const inner = lv.y1 - lv.y0;
        const n = autoShelves(inner, geo.t);
        lv.cols.forEach((c) => {
          const col = L[lv.i] && L[lv.i].cols[c.j];
          // szuflady i blendy nie maja polek, wiec ich nie ruszamy
          if (col && col.kind !== "drawers" && col.kind !== "blenda")
            col.shelfTargets = Array(n + 1).fill(null);
        });
      })
    );

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

  // grubosc dopisujemy do etykiety tylko tam, gdzie ta sama plyta wystepuje
  // w projekcie w kilku grubosciach
  const ambig = useMemo(() => ambiguousThickness(project.items.map((it) => it.mat)), [project]);

  const cutList = useMemo(() => {
    const gone = [...(runPl ? ["Cokół"] : []), ...(runTp ? ["Blat"] : [])];
    return groupPanels(gone.length ? geo.panels.filter((p) => !gone.includes(p.name)) : geo.panels);
  }, [geo.panels, runPl, runTp]);

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
    projectParts(project).forEach((part) => {
      const cabName = part.name;
      part.panels.forEach((p) => {
        const m = part.mat[p.matKey] || {};
        const e = p.edges;
        const key = [m.name, m.thickness, m.color, p.matKey, p.a, p.b, e.a1, e.a2, e.b1, e.b2, p.name, !!part.grainMatters].join("|");
        if (map.has(key)) {
          const g2 = map.get(key);
          g2.qty += p.qty;
          g2.from.set(cabName, (g2.from.get(cabName) || 0) + p.qty);
        } else {
          map.set(key, { ...p, matName: matLabelOf(m, p.matKey, ambig), matColor: m.color,
            from: new Map([[cabName, p.qty]]),
            rotatable: p.matKey === "back" || !part.grainMatters });
        }
      });
    });
    // czytelny opis "z której szafki" — przy jednej szafce bez liczby
    // Kolejnosc taka sama jak w liscie jednej szafki: blat na gorze, HDF na dole.
    return [...map.values()]
      .map((p, i) => ({ p, i }))
      .sort((x, y) => (MAT_ORDER[x.p.matKey] ?? 2) - (MAT_ORDER[y.p.matKey] ?? 2) || x.i - y.i)
      .map(({ p }) => ({
        ...p,
        fromLabel: [...p.from.entries()]
          .map(([n, q]) => (p.from.size === 1 && q === p.qty ? n : `${n} × ${q}`))
          .join(", "),
      }));
  }, [project, ambig]);

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
    projectParts(project).forEach((part) => {
      part.hardware.forEach((h) => {
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
            // blat roboczy w projekcie jest jeden, wiec jego arkusz bierzemy z materialow
            sheet: p.matKey === "worktop" ? { w: WORKTOP_LEN, h: worktopDepth(mat) } : null,
          }))
        : cutList.map((p) => ({
            name: p.name,
            qty: p.qty,
            a: p.a,
            b: p.b,
            rotatable: p.matKey === "back" || !cab.grainMatters,
            matLabel: matLabelOf(mat[p.matKey], p.matKey, ambig),
            sheet: p.matKey === "worktop"
              ? { w: WORKTOP_LEN, h: worktopDepth(mat) } : null,
          }));
    setCutPlan({ scope, groups: buildCutPlan(rows) });
  }, [cutList, projectCutList, cab.grainMatters, mat, ambig]);

  // --- wycena: ceny trzyma projekt, ilosci biora sie z list i rozkroju ---
  const prices = project.prices || {};
  const setPrice = (key, v) =>
    setProject((p) => ({ ...p, prices: { ...(p.prices || {}), [key]: v === "" ? null : Number(v) } }));
  // wpisana cena wygrywa; puste pole znaczy „weź domyślną", a 0 zeruje pozycję
  const priceOf = (key, def = 0) => {
    const v = prices[key];
    return typeof v === "number" && isFinite(v) ? v : def;
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

  /* Rozkroj grupuje arkusze po samej etykiecie materialu, a cena zalezy jeszcze
     od koloru — stad podreczna mapa etykieta → { kolor, rola }. */
  const matByLabel = useMemo(() => {
    const m = new Map();
    project.items.forEach((it) => {
      Object.entries(it.mat || {}).forEach(([key, v]) => {
        const label = matLabelOf(v, key, ambig);
        if (v && !m.has(label)) m.set(label, { color: v.color, key });
      });
    });
    return m;
  }, [project, ambig]);

  /* Etykieta materialu niesie kolor, wiec zmiana koloru unieważnia policzony
     wczesniej rozkroj — inaczej wycena trzymalaby arkusze pod nazwa, ktorej
     juz nie ma, i liczyla je po zerowej cenie. */
  useEffect(() => {
    if (!cutPlan) return;
    if (!cutPlan.groups.every((g) => matByLabel.has(g.matLabel))) setCutPlan(null);
  }, [matByLabel, cutPlan]);

  const boardDefault = (label) => {
    const info = matByLabel.get(label);
    if (!info) return 0;
    if (info.key === "back") return DEFAULT_PRICES.hdf;
    // blat roboczy ma cene za arkusz, taka sama niezaleznie od koloru
    if (info.key === "worktop") return WORKTOP_PRICES[worktopDepth(mat)] || WORKTOP_PRICES[600];
    return isWhiteBoard(info.color) ? DEFAULT_PRICES.plytaBiala : DEFAULT_PRICES.plytaKolor;
  };

  const quote = useMemo(() => {
    const rows = [];
    // kazda pozycja niesie swoja cene domyslna, wiec dziala tez dla materialow
    // i okuc, ktorych nie da sie z gory wypisac w stalej
    const add = (r) => rows.push({ ...r, def: r.def || 0, price: priceOf(r.key, r.def || 0) });
    if (planSheets)
      Object.entries(planSheets).forEach(([matLabel, n]) => {
        const k = "plyta:" + matLabel;
        add({ key: k, label: matLabel, qty: n, unit: "ark.", def: boardDefault(matLabel) });
      });
    const sheetsTotal = planSheets ? Object.values(planSheets).reduce((a, b) => a + b, 0) : 0;
    if (sheetsTotal)
      add({ key: "ciecie", label: "Formatowanie płyty", spec: "cięcie arkusza na formatki",
        qty: sheetsTotal, unit: "ark.", def: DEFAULT_PRICES.ciecie });
    add({ key: "obrzeze", label: "Obrzeże 22 × 2 mm", spec: "materiał, dokładna długość",
      qty: Math.round(projectEdgeMb * 10) / 10, unit: "mb", def: DEFAULT_PRICES.obrzeze });
    // rozkrojownia liczy oklejanie za kazdy ROZPOCZETY metr, wiec w gore
    if (projectEdgeMb > 0)
      add({ key: "oklejanie", label: "Oklejanie prostoliniowe",
        spec: `usługa, ${fmt(Math.round(projectEdgeMb * 10) / 10)} mb w górę do pełnego metra`,
        qty: Math.ceil(projectEdgeMb), unit: "mb", def: DEFAULT_PRICES.oklejanie });
    projectHardware.forEach((h) => {
      add({ key: "okucie:" + h.name + "|" + h.spec, label: h.name,
        spec: h.spec + (h.pack ? ` — ${h.qty} szt.` : ""),
        qty: hwQty(h), unit: hwUnit(h), def: hwDefaultPrice(h) });
    });
    const sum = rows.reduce((a, r) => a + r.qty * r.price, 0);
    return { rows, sum };
  }, [planSheets, projectEdgeMb, projectHardware, prices, matByLabel]);

  // uwagi ciagu ida przed uwagami szafki — dotycza calej sciany, wiec sa nadrzedne
  const allMsgs = useMemo(() => [...runMsgs, ...geo.msgs], [runMsgs, geo]);
  const errors = allMsgs.filter((m) => m.level === "error");
  const warns = allMsgs.filter((m) => m.level === "warn");
  const infos = allMsgs.filter((m) => m.level === "info");
  /* Odhaczone ostrzezenia i podpowiedzi znikaja z licznika u gory — inaczej
     pasek nad projektem straszy liczba, ktora dawno przeczytales. Bledy licza
     sie zawsze: to nie jest cos, co da sie odklikac. */
  const warnsNowe = warns.filter((m) => !przeczytane.has(m.text));
  const infosNowe = infos.filter((m) => !przeczytane.has(m.text));
  const notesRef = useRef(null);
  const scrollToNotes = () =>
    notesRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });

  // HDF na plecy jest za cienki na obrzeze — nie dajemy nawet klikac
  const EdgeChips = ({ p }) =>
    p.matKey === "back" ? (
      <span className="text-xs text-stone-400">HDF się nie okleja</span>
    ) : (
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
        <div className="mx-auto flex max-w-[1700px] flex-wrap items-center gap-x-3 gap-y-1 px-4 py-2">
          {/* obie nazwy w jednej linii — w waskim oknie naglowek zawijal sie
              na trzy rzedy i zjadal wysokosc potrzebna rysunkowi */}
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <label className="flex min-w-0 flex-1 items-center gap-1.5"
              title="Nazwa całego projektu — kliknij i wpisz dowolną">
              <span aria-hidden="true" className="shrink-0 text-sm text-stone-400">✎</span>
              <input value={project.name ?? ""}
                onChange={(e) => setProject((p) => ({ ...p, name: e.target.value }))}
                placeholder={DEFAULT_PROJECT_NAME}
                className="min-w-0 flex-1 border-b border-stone-300 bg-transparent px-0.5 text-base font-semibold tracking-tight hover:border-stone-400 focus:border-teal-700 focus:outline-none" />
            </label>
            <label className="flex min-w-0 flex-1 items-center gap-1.5"
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
          {warnsNowe.length > 0 && (
            <button onClick={scrollToNotes} title="Przejdź do uwag"
              className="rounded-full px-2.5 py-1 text-xs font-medium transition hover:brightness-95"
              style={{ background: "#fef3c7", color: WARNC }}>
              {warnsNowe.length} {plural(warnsNowe.length, "ostrzeżenie", "ostrzeżenia", "ostrzeżeń")}
            </button>
          )}
          {infosNowe.length > 0 && (
            <button onClick={scrollToNotes} title="Przejdź do podpowiedzi"
              className="rounded-full px-2.5 py-1 text-xs font-medium text-stone-600 transition hover:brightness-95"
              style={{ background: "#e7e5e4" }}>
              {infosNowe.length} {plural(infosNowe.length, "podpowiedź", "podpowiedzi", "podpowiedzi")}
            </button>
          )}
          {errors.length === 0 && warnsNowe.length === 0 && infosNowe.length === 0 && (
            <span className="rounded-full bg-teal-50 px-2.5 py-1 text-xs font-medium text-teal-800">bez uwag</span>
          )}
          {/* czysta szafka to jeszcze nie czysty projekt — sasiadka moze miec uwagi */}
          {otherNotes.length > 0 && (
            <button onClick={scrollToNotes} title="Uwagi w pozostałych szafkach projektu"
              className="rounded-full border border-dashed px-2.5 py-1 text-xs font-medium transition hover:brightness-95"
              style={{ borderColor: "#d6d3d1", color: otherNotes.some((n) => n.err) ? ERRC : WARNC }}>
              + {otherNotes.length} {plural(otherNotes.length, "szafka", "szafki", "szafek")} z uwagami
            </button>
          )}
        </div>
        {/* pasek szafek w projekcie — po jednym wierszu na ciąg, na końcu wolnostojące */}
        <div className="border-t border-stone-200 bg-stone-50/60">
          <div className="mx-auto max-w-[1700px] space-y-1 px-4 py-2">
            {groupBar.map((grp) => {
              const list = runItems(project, grp.id);
              return (
                <div key={grp.id || "free"} className="flex flex-wrap items-center gap-1.5">
                  <span className="mr-1 shrink-0 text-xs font-medium text-stone-400">{grp.label}</span>
                  {list.map(({ it, i }, k) => {
                    const activeTab = i === project.active;
                    const arrow = "px-0.5 leading-none " +
                      (activeTab ? "text-teal-100 hover:text-white" : "text-stone-400 hover:text-stone-700");
                    return (
                      <div key={i}
                        className={"flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-medium transition " +
                          (activeTab ? "border-teal-600 bg-teal-700 text-white" : "border-stone-300 bg-white text-stone-600 hover:border-stone-400")}>
                        {grp.id && list.length > 1 && k > 0 && (
                          <button onClick={() => moveCabinet(i, -1)} title="Przesuń w lewo w ciągu"
                            className={arrow}>‹</button>
                        )}
                        {/* kropka mowi o uwagach w szafce, ktorej akurat nie ogladamy */}
                        {(() => {
                          const n = projectNotes[i] || {};
                          if (!n.err && !n.warn) return null;
                          const kind = n.err ? "błąd" : "ostrzeżenie";
                          return (
                            <span title={`${n.err + n.warn} ${plural(n.err + n.warn, kind, kind === "błąd" ? "błędy" : "ostrzeżenia", kind === "błąd" ? "błędów" : "ostrzeżeń")} w tej szafce`}
                              className="text-[10px] leading-none"
                              style={{ color: n.err ? (activeTab ? "#fecaca" : ERRC) : (activeTab ? "#fde68a" : WARNC) }}>●</span>
                          );
                        })()}
                        <button onClick={() => switchCabinet(i)} className="max-w-[180px] truncate">
                          {it.cab.name || `Szafka ${i + 1}`}
                        </button>
                        {grp.id && list.length > 1 && k < list.length - 1 && (
                          <button onClick={() => moveCabinet(i, 1)} title="Przesuń w prawo w ciągu"
                            className={arrow}>›</button>
                        )}
                        <button onClick={() => duplicateCabinet(i)} title="Duplikuj tę szafkę"
                          className={arrow}>
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
                    onChange={(e) => { if (e.target.value) addCabinet(e.target.value, grp.id); e.target.value = ""; }}
                    className="rounded-full border border-dashed border-teal-500 bg-white px-2 py-1 text-xs text-teal-700 focus:border-teal-700 focus:outline-none">
                    <option value="">+ z szablonu…</option>
                    {TEMPLATES.map((t) => (
                      <option key={t.id} value={t.id}>{t.label} — {t.hint}</option>
                    ))}
                  </select>
                  <button onClick={() => addCabinet(undefined, grp.id)} title="Dodaj nową szafkę"
                    className="rounded-full border border-dashed border-teal-500 px-3 py-1 text-xs font-medium text-teal-700 hover:bg-teal-50">
                    + szafka
                  </button>
                  {/* gorne pietro tej samej sciany — tylko przy ciagu dolnym i tylko raz */}
                  {grp.id && grp.tier !== "gorny" && !grp.maGorny && (
                    <button onClick={() => addUpperRun(grp.id)}
                      title="Górny ciąg nad tym — wisi nad licem dolnego, dziedziczy ścianę i narożnik"
                      className="rounded-full border border-dashed border-stone-400 px-3 py-1 text-xs font-medium text-stone-500 hover:border-stone-500 hover:text-stone-700">
                      + ciąg górny
                    </button>
                  )}
                  {grp.id && (
                    <button onClick={() => deleteRun(grp.id)}
                      title={"Usuń ten ciąg razem z jego szafkami"
                        + (grp.maGorny ? " i z górnym piętrem tej ściany" : "")}
                      className="rounded-full border border-dashed border-stone-300 px-3 py-1 text-xs font-medium text-stone-400 hover:border-red-400 hover:text-red-600">
                      × ciąg
                    </button>
                  )}
                </div>
              );
            })}
            <div className="flex flex-wrap items-center gap-1.5">
              <button onClick={addRun} title="Nowy ciąg — szafki stojące obok siebie przy jednej ścianie"
                className="rounded-full border border-dashed border-stone-400 px-3 py-1 text-xs font-medium text-stone-500 hover:border-stone-500 hover:text-stone-700">
                + ciąg
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="print-hide mx-auto max-w-[1700px] gap-4 px-4 py-4 lg:grid lg:grid-cols-[460px_1fr]">
        <div className="space-y-4">
          {(project.runs || []).length > 0 && (
            <Card title="Ciąg meblowy" collapsible>
              <Field label="Ta szafka"
                hint={runInfo
                  ? `${runInfo.pos} z ${runInfo.count} w ciągu „${runInfo.run.name}". Kolejność zmieniasz strzałkami na pasku szafek.`
                  : "Wolnostojąca — nie wchodzi do żadnego ciągu."}>
                <select value={project.items[project.active].runId || ""}
                  onChange={(e) => assignCabinet(project.active, e.target.value || null)}
                  className="w-full rounded border border-stone-300 bg-white px-2 py-1.5 text-sm text-stone-900 focus:border-teal-600 focus:outline-none">
                  <option value="">Wolnostojąca</option>
                  {(project.runs || []).map((r) => (
                    <option key={r.id} value={r.id}>{r.name}</option>
                  ))}
                </select>
              </Field>
              {runInfo && (
                <>
                  <Field label="Wysunięcie tej szafki z lica"
                    hint="0 = front w jednej linii z ciągiem. Dodatnie wysuwa do przodu, ujemne cofa w głąb.">
                    <Num value={project.items[project.active].offset || 0}
                      onChange={(v) => setOffset(project.active, v)} />
                  </Field>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Nazwa ciągu">
                      <input value={runInfo.run.name}
                        onChange={(e) => setRun(runInfo.run.id, { name: e.target.value })}
                        className="w-full rounded border border-stone-300 bg-white px-2 py-1.5 text-sm text-stone-900 focus:border-teal-600 focus:outline-none" />
                    </Field>
                    <Field label="Długość ściany"
                      hint={runInfo.run.tier === "gorny"
                        ? "Wspólna dla obu pięter — ustawia się przy ciągu dolnym."
                        : undefined}>
                      <AutoNum value={runWallW(project, runInfo.run)} placeholder={fmt(runInfo.total)}
                        fixed={runWallW(project, runInfo.run) != null}
                        onChange={(v) => setRun(runInfo.run.tier === "gorny" && runInfo.run.wall
                          ? runInfo.run.wall : runInfo.run.id,
                          { wallW: v === "" ? null : Math.max(0, Math.round(Number(v))) })} />
                    </Field>
                  </div>
                  {/* Dolne szafki moga zaczynac sie w innym miejscu niz gorne —
                      stad odsuniecie liczone od wybranej krawedzi sciany. */}
                  <Field label="Położenie na ścianie"
                    hint="Odsunięcie całego ciągu od wybranej krawędzi ściany.">
                    <div className="grid grid-cols-2 gap-3">
                      <Num value={runInfo.run.offset || 0} min={0}
                        onChange={(v) => setRun(runInfo.run.id,
                          { offset: Math.max(0, Math.round(Number(v) || 0)) })} />
                      <Seg value={runInfo.run.offsetFrom === "right" ? "right" : "left"}
                        onChange={(v) => setRun(runInfo.run.id, { offsetFrom: v })}
                        options={[{ v: "left", l: "Od lewej" }, { v: "right", l: "Od prawej" }]} />
                    </div>
                  </Field>
                  {runInfo.run.tier === "gorny" && (
                    <div className="grid grid-cols-2 gap-3">
                      <Field label="Prześwit nad blatem"
                        hint="Od góry blatu do spodu szafek górnych.">
                        <Num value={runInfo.run.clearance ?? 500} min={0}
                          onChange={(v) => setRun(runInfo.run.id,
                            { clearance: Math.max(0, Math.round(Number(v) || 0)) })} />
                      </Field>
                      <Field label="Wysokość pomieszczenia"
                        hint="Puste = nie liczymy luzu pod sufitem.">
                        <AutoNum value={runInfo.run.ceiling} placeholder="do sufitu"
                          fixed={runInfo.run.ceiling != null}
                          onChange={(v) => setRun(runInfo.run.id,
                            { ceiling: v === "" ? null : Math.max(0, Math.round(Number(v))) })} />
                      </Field>
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Luz między korpusami"
                      hint="0 przy szafkach skręcanych ze sobą.">
                      <Num value={runInfo.run.gap} min={0}
                        onChange={(v) => setRun(runInfo.run.id, { gap: Math.max(0, Math.round(Number(v) || 0)) })} />
                    </Field>
                    <Field label="Poziom montażu"
                      hint="0 = ciąg stoi na podłodze; wyżej = ciąg wiszący.">
                      <Num value={runInfo.run.mountY || 0} min={0}
                        onChange={(v) => setRun(runInfo.run.id, { mountY: Math.max(0, Math.round(Number(v) || 0)) })} />
                    </Field>
                  </div>
                  <Group label="Narożnik"
                    hint="Ciąg dostawiony pod kątem prostym do innego. Kolejne narożniki układają się w L, U i G.">
                    <div className="space-y-2">
                      <select value={(runInfo.run.corner || {}).of || ""}
                        onChange={(e) => setCorner(runInfo.run.id, e.target.value || null)}
                        className="w-full rounded border border-stone-300 bg-white px-2 py-1.5 text-sm text-stone-900 focus:border-teal-600 focus:outline-none">
                        <option value="">Ciąg stoi osobno</option>
                        {cornerCandidates.map((r) => (
                          <option key={r.id} value={r.id}>Pod kątem prostym do „{r.name}"</option>
                        ))}
                      </select>
                      {runInfo.run.corner && (
                        <>
                          <Seg value={runInfo.run.corner.at}
                            onChange={(v) => setCorner(runInfo.run.id, runInfo.run.corner.of, { at: v })}
                            options={[{ v: "end", l: "Za tamtym" }, { v: "start", l: "Przed tamtym" }]} />
                          <Seg value={runInfo.run.corner.owner}
                            onChange={(v) => setCorner(runInfo.run.id, runInfo.run.corner.of, { owner: v })}
                            options={[{ v: "of", l: "Tamten w róg" }, { v: "self", l: "Ten w róg" }]} />
                          <label className="block">
                            <span className="mb-1 block text-[11px] text-stone-400">Luz w rogu</span>
                            <Num value={runInfo.run.corner.clear || 0} min={0}
                              onChange={(v) => setCorner(runInfo.run.id, runInfo.run.corner.of,
                                { clear: Math.max(0, Math.round(Number(v) || 0)) })} />
                          </label>
                          {runTp && (
                            <>
                              <Seg value={runInfo.run.corner.cut || "prosty"}
                                onChange={(v) => setCorner(runInfo.run.id, runInfo.run.corner.of, { cut: v })}
                                options={[{ v: "prosty", l: "Blat na styk" }, { v: "skos", l: "Na 45° (łyżwa)" }]} />
                              {(runInfo.run.corner.cut || "prosty") !== "skos" && (
                                <Seg value={runInfo.run.corner.top
                                  || (runInfo.run.corner.owner === "self" ? "self" : "of")}
                                  onChange={(v) => setCorner(runInfo.run.id, runInfo.run.corner.of, { top: v })}
                                  options={[{ v: "self", l: "Przechodzi ten blat" },
                                    { v: "of", l: "Przechodzi tamten" }]} />
                              )}
                            </>
                          )}
                          {runNode && (
                            <p className="text-xs text-stone-500">
                              {runNode.lead + runNode.tail > 0
                                ? <>Róg zjada <span className="font-mono text-stone-700">{fmt(runNode.lead + runNode.tail)} mm</span> tego ciągu — pierwsza szafka stoi dopiero za nim.</>
                                : <>Ten ciąg dojeżdża do samego rogu; odsuwa się drugi.</>}
                            </p>
                          )}
                        </>
                      )}
                    </div>
                  </Group>
                  <Field label="Wspólne dla całego ciągu"
                    hint="Zmiana tutaj przestawia od razu wszystkie szafki ciągu. Szafkę, która się rozjedzie, zgłoszą Uwagi.">
                    <div className="grid grid-cols-2 gap-3">
                      <label className="block">
                        <span className="mb-1 block text-[11px] text-stone-400">Wysokość</span>
                        <Num value={runInfo.run.H ?? cab.H}
                          onChange={(v) => setRunShared(runInfo.run.id, { H: Math.max(1, Math.round(Number(v) || 0)) })} />
                      </label>
                      <label className="block">
                        <span className="mb-1 block text-[11px] text-stone-400">Głębokość</span>
                        <Num value={runInfo.run.D ?? cab.D}
                          onChange={(v) => setRunShared(runInfo.run.id, { D: Math.max(1, Math.round(Number(v) || 0)) })} />
                      </label>
                    </div>
                  </Field>
                  {/* Ciag wiszacy nie ma na czym postawic cokolu, a stojacy nie ma
                      po co wieszac — pokazywanie obu opcji zawsze tylko mylilo. */}
                  {!ciagWisi && (
                  <Field label="Cokół ciągu" hint="Cokół idzie przez cały ciąg jedną płaszczyzną.">
                    <div className="space-y-2">
                      <Check checked={!!(runInfo.run.plinth || cab.plinth || {}).on}
                        label="Cokół pod szafkami"
                        onChange={(v) => setRunShared(runInfo.run.id,
                          { plinth: { ...(runInfo.run.plinth || cab.plinth), on: v } })} />
                      {!!(runInfo.run.plinth || cab.plinth || {}).on && (
                        <Num value={(runInfo.run.plinth || cab.plinth).height}
                          onChange={(v) => setRunShared(runInfo.run.id,
                            { plinth: { ...(runInfo.run.plinth || cab.plinth), height: Math.max(0, Math.round(Number(v) || 0)) } })} />
                      )}
                      {runPl && (
                        <p className="text-xs text-stone-500">
                          {/* W rogu cokol, tak samo jak blat, sklada sie z dwoch
                              odcinkow — po jednym na sciane. Ten pod ramieniem
                              idzie wzdluz drugiej sciany i jest osobna plyta. */}
                          {cornerNode && cornerNode.arm ? "Odcinek tej ściany: " : ""}
                          {runPl.n === 1
                            ? <>{cornerNode && cornerNode.arm ? "jedna" : "Jedna"} formatka <span className="font-mono text-stone-700">{fmt(runPl.total)} × {fmt(runPl.h)} mm</span>, oklejona od dołu i na obu końcach.</>
                            : <>{runPl.n} części po <span className="font-mono text-stone-700">{listPl(runPl.lens.map(fmt))} mm</span>, cięte na styku korpusów i oklejone także na łączeniu.</>}
                          {cornerNode && cornerNode.arm && cornerNode.arm.cab.plinthH > 0 && (
                            <> W narożniku dochodzi cokół ramienia, wzdłuż ściany
                              {" "}„{cornerNode.pair ? cornerNode.pair.ustepuje.run.name : "obok"}" —{" "}
                              <span className="font-mono text-stone-700">
                                {fmt(cornerNode.arm.len)} × {fmt(cornerNode.arm.cab.plinthH)} mm
                              </span>.</>
                          )}
                        </p>
                      )}
                    </div>
                  </Field>
                  )}
                  {!ciagWisi && (
                    <SplitPicker label="Podział cokołu" what="cokół" s={runPl}
                      onToggle={(j) => toggleCut(runInfo.run.id, "plinthCuts", runPlinth, j)}
                      onAuto={() => setRun(runInfo.run.id, { plinthCuts: null })} />
                  )}

                  {!ciagWisi && (
                    <Field label="Blat roboczy"
                      hint="Blat idzie nad całym ciągiem. Szafki pod nim nie mają wieńca — usztywnia je para wzmocnień.">
                      <Check checked={!!runInfo.run.worktop} label="Blat roboczy na całym ciągu"
                        onChange={(v) => setRun(runInfo.run.id, { worktop: v })} />
                    </Field>
                  )}
                  {runTp && (() => {
                    /* W rogu blat nigdy nie jest jednym kawalkiem: kazda sciana
                       ma swoj odcinek i tnie sie je osobno. Karta mowi o swoim,
                       wiec musi tez powiedziec, ze obok lezy drugi — inaczej
                       „jedna formatka" czyta sie jak caly blat kuchni. */
                    const rogi = (project.runs || [])
                      .filter((r) => r.id !== runInfo.run.id
                        && ((r.corner && r.corner.of === runInfo.run.id)
                          || (runInfo.run.corner && runInfo.run.corner.of === r.id)))
                      .map((r) => ({ r, rt: runTop(project, r) }))
                      .filter((o) => o.rt);
                    return (
                      <Field label="Blat ciągu"
                        hint={rogi.length
                          ? "Blat tej ściany. W narożniku styka się z blatem sąsiedniej — to osobne odcinki."
                          : "Blat idzie nad całym ciągiem jedną płaszczyzną."}>
                        <p className="text-xs text-stone-500">
                          {rogi.length ? "Odcinek tej ściany: " : ""}
                          {runTp.n === 1
                            ? <>jedna formatka <span className="font-mono text-stone-700">{fmt(runTp.total)} × {fmt(runTp.depth)} mm</span>.</>
                            : <>{runTp.n} części po <span className="font-mono text-stone-700">{listPl(runTp.lens.map(fmt))} mm</span>, cięte na styku korpusów i oklejone także na łączeniu.</>}
                          {rogi.map((o) => (
                            <span key={o.r.id}>
                              {" "}W narożniku dochodzi odcinek ciągu „{o.r.name}" —{" "}
                              <span className="font-mono text-stone-700">
                                {fmt(o.rt.total)} × {fmt(o.rt.depth)} mm
                              </span>.
                            </span>
                          ))}
                        </p>
                      </Field>
                    );
                  })()}
                  <SplitPicker label="Podział blatu" what="blat" s={runTp}
                    onToggle={(j) => toggleCut(runInfo.run.id, "topCuts", runTop, j)}
                    onAuto={() => setRun(runInfo.run.id, { topCuts: null })} />

                  {ciagWisi && (
                    <Field label="Wieszanie ciągu"
                      hint={runRl
                        ? `Jedna listwa ${fmt(runRl.len)} mm na cały ciąg — szafki wiszą w jednej linii.`
                        : "Zawieszki dobiorą się, gdy szafki będą tego potrzebować."}>
                      <Seg value={(runInfo.run.hangerMode || "listwa") === "haczyki" ? "haczyki" : "listwa"}
                        onChange={(v) => setRunShared(runInfo.run.id, { hangerMode: v })}
                        options={[{ v: "listwa", l: "Na listwie" }, { v: "haczyki", l: "Na haczykach" }]} />
                    </Field>
                  )}
                  <p className="text-xs text-stone-500">
                    {runInfo.count} {plural(runInfo.count, "szafka", "szafki", "szafek")} zajmuje{" "}
                    <span className="font-mono text-stone-700">{fmt(runInfo.total)} mm</span>
                    {/* przy narożniku od sciany ubywa jeszcze rog, wiec liczymy od niego */}
                    {runNode && runNode.len > runInfo.total && (
                      <>, a z narożnikiem{" "}
                        <span className="font-mono text-stone-700">{fmt(runNode.len)} mm</span></>
                    )}
                    {runInfo.run.wallW != null && (
                      <> z {fmt(runInfo.run.wallW)} mm ściany — zostaje{" "}
                        <span className="font-mono text-stone-700">
                          {fmt(runInfo.run.wallW - Math.max(runInfo.total, runNode ? runNode.len : 0))} mm</span>.</>
                    )}
                  </p>
                  <button onClick={() => removeRun(runInfo.run.id)}
                    className="text-xs text-stone-500 hover:text-stone-800 hover:underline">
                    Rozwiąż ciąg — szafki zostają, wracają na wolnostojące
                  </button>
                </>
              )}
            </Card>
          )}
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
            {/* Bez wienca nie ma czego ustawiac: przelacznik „Wieniec / Blat"
                pod zlaczami ustawionymi na „brak" mowil o plycie, ktorej w tej
                szafce nie ma. */}
            {geo.hasTop ? (
              <>
              <Field label="Wieniec"
                hint={geo.isBlat
                  ? `Blat leży na bokach i wystaje poza nie — fronty kończą się pod nim. Formatka ${fmt(geo.topX1 - geo.topX0)} × ${fmt(geo.blatDepth)} mm.`
                  : "Zwykły wieniec w obrysie korpusu. Wysunięcia ustawisz po przełączeniu na blat."}>
                <Seg value={(cab.top || {}).mode === "blat" ? "blat" : "wieniec"}
                  onChange={(v) => set({ top: { ...(cab.top || {}), mode: v } })}
                  options={[{ v: "wieniec", l: "Wieniec" }, { v: "blat", l: "Blat" }]} />
              </Field>
              {(cab.top || {}).mode === "blat" && (
                <Field label="Blat z czego"
                  hint={geo.isWorktop
                    ? `Blat roboczy ${fmt(geo.tTop)} mm — układany na własnym arkuszu ${fmt(WORKTOP_LEN)} × ${fmt(worktopDepth(mat))} mm, osobno od płyty meblowej.`
                    : "Blat z płyty meblowej — idzie na arkusz razem z korpusami."}>
                  <Seg value={(cab.top || {}).material === "worktop" ? "worktop" : "board"}
                    onChange={(v) => set({ top: { ...(cab.top || {}), material: v } })}
                    options={[{ v: "board", l: "Z płyty" }, { v: "worktop", l: "Blat roboczy" }]} />
                </Field>
              )}
              {(cab.top || {}).mode === "blat" && (
                <Field label="Podana szerokość to"
                  hint={geo.blatInside
                    ? `Boki chowają się do środka: blat ${fmt(cab.W)} mm, korpus ${fmt(geo.W)} mm.`
                    : `Blat wystaje poza korpus: korpus ${fmt(geo.W)} mm, blat ${fmt(geo.topX1 - geo.topX0)} mm.`}>
                  <Seg value={(cab.top || {}).widthMode === "inside" ? "inside" : "outside"}
                    onChange={(v) => set({ top: { ...(cab.top || {}), widthMode: v } })}
                    options={[{ v: "outside", l: "Szerokość korpusu" }, { v: "inside", l: "Szerokość blatu" }]} />
                </Field>
              )}
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
              </>
            ) : (
              <p className="text-xs text-stone-500">
                Wieńca nie ma — złącza wieńca stoją na „brak"{runTp
                  ? ", bo nad ciągiem idzie blat roboczy i zamiast wieńca korpus trzyma para wzmocnień"
                  : ""}. Ustawienia wieńca i blatu wrócą, gdy któreś złącze wróci
                na „między" albo „na boku".
              </p>
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
            right={
              <div className="flex items-center gap-2">
                <button onClick={fitShelvesAll}
                  title={`Przelicz półki we wszystkich kolumnach — tyle, ile się mieści przy świetle co najmniej ${MIN_OPENING} mm`}
                  className="text-xs text-teal-700 hover:underline">dopasuj półki</button>
                <MiniBtn onClick={addLevel}>+ poziom</MiniBtn>
              </div>
            }>
            <p className="text-xs text-stone-500">
              Poziomy rozdziela półka na całą szerokość. W poziomie możesz postawić przegrodę
              i podzielić go na kolumny. Puste pole wymiaru znaczy „podziel resztę równo".
            </p>

            {cornerNode && (
              <Group label="Ramię narożnika"
                hint="Ramię to dalszy ciąg tej samej szafki, wzdłuż drugiej ściany. Wnętrze ma wspólne z korpusem — półki są te same, bo to te same półki — a osobno ustawia się tylko to, czego korpus nie definiuje.">
                <div className="space-y-2">
                  {/* Ze samej karty szafki nie widac, ze stoi w rogu —
                      dlatego mowimy to wprost, z nazwami obu scian. */}
                  {cornerNode.pair && (
                    <p className="rounded border border-teal-200 bg-teal-50 px-2 py-1.5 text-xs text-teal-900">
                      Ta szafka jest częścią narożnika — stoi w rogu ścian
                      {" "}„{cornerNode.pair.wchodzi.run.name}" i „{cornerNode.pair.ustepuje.run.name}".
                    </p>
                  )}
                  <Check checked={!!(cab.corner || {}).on} label="Korpus wychodzi ramieniem w L"
                    onChange={(v) => set({ corner: { ...cab.corner, on: v } })} />
                  {!!(cab.corner || {}).on && (
                    <>
                      <label className="block">
                        <span className="mb-1 block text-[11px] text-stone-400">Długość ramienia</span>
                        <Num value={cab.corner.arm} min={0}
                          onChange={(v) => set({ corner: { ...cab.corner, arm: Math.max(0, Math.round(Number(v) || 0)) } })} />
                      </label>
                      {/* Sam pasek nie mowil, czego dotyczy — a decyduje o tym,
                          jak w rogu wiszą drzwi korpusu i ramienia. */}
                      <Group label="Drzwi w narożniku — typ montażu"
                        hint="Na wsporniki: dwa osobne fronty, w rogu zostaje słupek. Łamane: skręcone zawiasem narożnym. Skręcone 90°: jeden front zagięty. Fix + jedne drzwi: od jednej ściany stała blenda.">
                        <Seg value={cab.corner.doors || "wsporniki"}
                          onChange={(v) => set({ corner: { ...cab.corner, doors: v } })}
                          options={[{ v: "wsporniki", l: "Na wsporniki" },
                            { v: "lamane", l: "Łamane" }, { v: "skrecone", l: "Skręcone 90°" },
                            { v: "fix", l: "Fix + jedne drzwi" }]} />
                      </Group>
                      {/* Bok od strony ramienia zastepuje katownik przy plecach;
                          da sie go zdjac i zmienic szerokosc ramion. */}
                      <Check checked={(cab.corner.post || {}).on !== false}
                        label="Kątownik w tylnym narożniku"
                        onChange={(v) => set({ corner: { ...cab.corner,
                          post: { ...(cab.corner.post || { w: 150 }), on: v } } })} />
                      {(cab.corner.post || {}).on !== false && (
                        <label className="block">
                          <span className="mb-1 block text-[11px] text-stone-400">Ramiona kątownika</span>
                          <Num value={(cab.corner.post || {}).w ?? 150} min={MIN_PART}
                            onChange={(v) => set({ corner: { ...cab.corner,
                              post: { ...(cab.corner.post || {}), on: true,
                                w: Math.max(MIN_PART, Math.round(Number(v) || 0)) } } })} />
                        </label>
                      )}
                      {/* Pelne plecy z plyty. Plyta trzyma rog sama, wiec
                          stojace wzmocnienie przy tej scianie schodzi —
                          czasem to prostsze niz dokladanie wsporników. */}
                      {(() => {
                        const sc1 = cornerNode.pair
                          ? cornerNode.pair.wchodzi.run.name : "korpusu";
                        const sc2 = cornerNode.pair
                          ? cornerNode.pair.ustepuje.run.name : "ramienia";
                        return (
                          <div className="space-y-1.5 rounded border border-stone-200 px-2 py-1.5">
                            <span className="block text-[11px] text-stone-400">
                              Plecy z pełnej płyty — usztywniają róg i zdejmują wzmocnienie
                              przy tej ścianie
                            </span>
                            <Check checked={cab.back === "board"}
                              label={`Od ściany „${sc1}" (korpus)`}
                              onChange={(v) => set({ back: v ? "board" : "hdf" })} />
                            <Check checked={!!cab.corner.backBoard}
                              label={`Od ściany „${sc2}" (ramię)`}
                              onChange={(v) => set({ corner: { ...cab.corner, backBoard: v } })} />
                          </div>
                        );
                      })()}
                      {(cab.corner.doors || "wsporniki") === "wsporniki" && (
                        <Group label="Nachodząca płyta kątownika">
                          <Seg value={cab.corner.bracket || "krotsze"}
                            onChange={(v) => set({ corner: { ...cab.corner, bracket: v } })}
                            options={[{ v: "krotsze", l: "Od krótszych drzwi" },
                              { v: "dluzsze", l: "Od dłuższych" }]} />
                        </Group>
                      )}
                      {cornerNode.arm && (
                        <p className="text-xs text-stone-500">
                          Korpus <span className="font-mono text-stone-700">{fmt(cornerNode.arm.cab.geo.W)} mm</span>
                          {" "}plus ramię <span className="font-mono text-stone-700">{fmt(cornerNode.arm.len)} × {fmt(cornerNode.arm.depth)} mm</span>.
                          {" "}Fronty: od tej strony{" "}
                          <span className="font-mono text-stone-700">{fmt(cornerNode.arm.front)} mm</span>,
                          {" "}ramienia{" "}
                          <span className="font-mono text-stone-700">{fmt(cornerNode.arm.armFront)} mm</span>.
                        </p>
                      )}
                      {/* Wysokosc, glebokosc i polki ramienia nie sa jego wlasne:
                          bierze je z szafki i z sasiedniego ciagu. Mowimy to
                          wprost, zeby nikt nie szukal tych pol tutaj. */}
                      {cornerNode.arm && (() => {
                        const ys = armShelfYs(cornerNode.arm.side, geo.levels);
                        return (
                          <p className="rounded border border-stone-200 bg-stone-50 px-2 py-1.5 text-xs text-stone-500">
                            Z szafki, bez osobnego ustawienia: wysokość{" "}
                            <span className="font-mono text-stone-700">{fmt(cab.H)} mm</span>,
                            {" "}głębokość ze ściany obok{" "}
                            <span className="font-mono text-stone-700">{fmt(cornerNode.arm.depth)} mm</span>,
                            {" "}cokół i front.{" "}
                            {ys.length
                              ? <>Półki to te same płyty co w kolumnie przy ramieniu —{" "}
                                <span className="font-mono text-stone-700">{listPl(ys.map(fmt))} mm</span>
                                {" "}nad dnem.</>
                              : <>Kolumna przy ramieniu nie ma półek, więc i ramię ich nie ma.</>}
                          </p>
                        );
                      })()}
                      {/* Wzmocnienia ramienia to osobne plyty — polozenie musza
                          miec wspolne z korpusem, zeby sie w rogu spotkaly, ale
                          szerokosc kazdej ustawia sie tutaj. */}
                      {cornerNode.arm && (() => {
                        const ap = armPlan(cornerNode.arm, true);
                        const rw = (cab.corner || {}).railW || {};
                        const setW = (k, v) => set({ corner: { ...cab.corner,
                          railW: { ...rw,
                            [k]: v === "" || v == null ? null : Math.max(1, Math.round(Number(v) || 0)) } } });
                        const grupy = [
                          ["przod", "czołowe — dochodzi do kątownika przy drzwiach",
                            ap.rails.filter((r) => !r.przyTyle)],
                          ["tyl", "tylne — dochodzi do kątownika w tylnym narożniku",
                            ap.rails.filter((r) => r.przyTyle)],
                        ].filter((g) => g[2].length);
                        return (
                          <Group label="Wzmocnienia ramienia">
                            {grupy.length ? (
                              <div className="space-y-2">
                                <p className="text-[11px] text-stone-500">
                                  Osobne płyty od tych w szafce — te same wzmocnienia idą dalej
                                  w ramieniu, tylko dłuższe. Położenie bierze z korpusu, żeby
                                  obie płyty spotkały się w rogu; szerokość ustawiasz tutaj.
                                </p>
                                {grupy.map(([k, opis, rs]) => (
                                  <div key={k} className="space-y-1.5 rounded border border-stone-200 px-2 py-1.5">
                                    <div className="flex items-center gap-2">
                                      <span className="flex-1 text-[11px] text-stone-500">{opis}</span>
                                      <span className="font-mono text-[11px] text-stone-700">
                                        {listPl(rs.map((r) => fmt(Math.round(r.u1 - r.u0))))} mm
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <span className="w-20 shrink-0 text-[11px] text-stone-400">szerokość</span>
                                      <div className="flex-1">
                                        <AutoNum value={rw[k] ?? ""} placeholder={fmt(rs[0].wys)}
                                          fixed={rs[0].wlasna} onChange={(v) => setW(k, v)} />
                                      </div>
                                      <span className="w-5 shrink-0 text-[11px] text-stone-400">mm</span>
                                      {rs[0].wlasna ? (
                                        <MiniBtn onClick={() => setW(k, "")}
                                          title="Wróć do szerokości jak w szafce">×</MiniBtn>
                                      ) : (
                                        <span className="w-6 shrink-0" />
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="rounded border border-stone-200 bg-stone-50 px-2 py-1.5 text-[11px] text-stone-500">
                                {geo.hasTop
                                  ? "Korpus ma wieniec, więc ramię nie potrzebuje wzmocnień pod blatem."
                                  : "Kolumna przy ramieniu nie ma wzmocnień, więc i ramię ich nie ma."}
                              </p>
                            )}
                            {ap.back && ap.back.plyta && (
                              <p className="mt-1 text-[11px] text-stone-400">
                                Plecy z płyty od tej ściany trzymają róg same, więc tylnego
                                wzmocnienia w ramieniu nie ma.
                              </p>
                            )}
                          </Group>
                        );
                      })()}
                    </>
                  )}
                </div>
              </Group>
            )}

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
                          {rawCol.w != null && (
                            <MiniBtn onClick={() => setColW(lv.i, c.j, "")}
                              title="Wróć na szerokość dobieraną automatycznie">auto</MiniBtn>
                          )}
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
                        {c.drawerMode === "inset" && (
                          <div className="flex items-center gap-2 text-xs">
                            <Check checked={!!rawCol.fingerGrip}
                              onChange={(v) => setFingerGrip(lv.i, c.j, v)}
                              label="Wcięcie na palce zamiast uchwytu" />
                            {rawCol.fingerGrip && (
                              <div className="w-20">
                                <Num value={rawCol.gripDepth ?? 18}
                                  onChange={(v) => setCol(lv.i, c.j, { gripDepth: v })} />
                              </div>
                            )}
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
                              // wiersz szuflady ma sporo pol — przy waskim panelu
                              // zawija sie na dwie linie zamiast wystawac poza karte
                              <div key={dr.i} className="flex flex-wrap items-center gap-2">
                                <select value={rawCol.drawers[dr.i]?.h ?? "auto"}
                                  title="Wysokość boku V-BOX — auto dobiera najwyższy mieszczący się w froncie"
                                  onChange={(e) => setDrawerH(lv.i, c.j, dr.i, e.target.value)}
                                  className="rounded border border-stone-300 bg-white px-1.5 py-1 font-mono text-[11px] focus:border-teal-600 focus:outline-none">
                                  <option value="auto">auto {dr.hClass}</option>
                                  {VBOX.heights.map((v) => (
                                    <option key={v} value={v}>{v} mm</option>
                                  ))}
                                </select>
                                <div className="w-20 shrink-0">
                                  <AutoNum value={rawCol.drawers[dr.i]?.front} placeholder={fmt(dr.h)}
                                    fixed={dr.fixed} warn={dr.h < VBOX.minFront[c.drawerMode || cab.frontMode][dr.hClass]}
                                    onChange={(v) => setDrawerFront(lv.i, c.j, dr.i, v)} />
                                </div>
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
                                <label className="flex shrink-0 items-center gap-1 cursor-pointer"
                                  title="Tył podniesiony do wysokości frontu, żeby rzeczy nie wypadały">
                                  <input type="checkbox"
                                    checked={!!rawCol.drawers[dr.i]?.tallBack}
                                    onChange={(e) => setDrawer(lv.i, c.j, dr.i, { tallBack: e.target.checked })}
                                    className="h-3.5 w-3.5 accent-teal-700" />
                                  <span className="text-[11px] text-stone-500">tył</span>
                                </label>
                                {rawCol.drawers[dr.i]?.tallBack && (
                                  <div className="w-20 shrink-0">
                                    <AutoNum value={rawCol.drawers[dr.i]?.backHeight} placeholder={fmt(dr.h)}
                                      onChange={(v) => setDrawer(lv.i, c.j, dr.i, { backHeight: v === "" ? null : Math.round(Number(v)) })} />
                                  </div>
                                )}
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
                              <button onClick={() => fitShelves(lv.i, c.j)}
                                title={`Tyle półek, ile się mieści przy świetle co najmniej ${MIN_OPENING} mm`}
                                className="text-[11px] text-teal-700 hover:underline">dopasuj do wysokości</button>
                            </div>
                          </div>
                        )}

                        {/* elementy wzmacniajace kolumny */}
                        <div className="border-t border-stone-100 pt-2">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-medium text-stone-500">
                              Wzmocnienia{cornerNode && cornerNode.arm ? " korpusu" : ""}
                            </span>
                            <div className="flex gap-2">
                              {/* bez wienca korpus stoi otwarty — para wzmocnien
                                  pod blat to standardowe rozwiazanie */}
                              {!geo.hasTop && lv.i === geo.levels.length - 1 && (
                                <MiniBtn onClick={() => addRailPair(lv.i, c.j)}
                                  title="Płyta na płask z przodu i stojąca z tyłu — zamiast wieńca">
                                  + para pod blat
                                </MiniBtn>
                              )}
                              <MiniBtn onClick={() => addRail(lv.i, c.j)} tone="accent">+ wzmocnienie</MiniBtn>
                            </div>
                          </div>
                          {/* W szafce naroznej te same plyty biegna dalej w ramieniu.
                              Nie ustawia sie ich osobno — sa dluzsze o to, co
                              ramie dokłada — ale trzeba powiedziec, ktore to. */}
                          {cornerNode && cornerNode.arm && lv.i === geo.levels.length - 1
                            && (rawCol.rails || []).length > 0 && (
                            <p className="mt-2 rounded border border-stone-200 bg-stone-50 px-2 py-1.5 text-[11px] text-stone-500">
                              W ramieniu biegną dalej takie same płyty, ale osobne —
                              ich szerokość ustawia się wyżej, w „Wzmocnieniach ramienia".
                            </p>
                          )}
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
                                {/* Odleglosc mierzy sie od tej strony, ktora wybrano
                                    ponizej — podpis szedl zawsze „od lica" i przy
                                    liczeniu od tylu mowil odwrotnie niz rysunek. */}
                                <Field label={r.fromBack ? "Głębokość od tyłu" : "Głębokość od lica"}
                                  hint={r.fromBack ? "0 = przy plecach" : "0 = w licu"}>
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
                <>
                  <Field label="Nałożenie na przegrodę"
                    hint={`Szczelina nad przegrodą: ${fmt(mat.board.thickness - 2 * (cab.gaps.divOverlay ?? 7))} mm`}>
                    <Num value={cab.gaps.divOverlay ?? 7} onChange={(v) => setGap("divOverlay", v)} />
                  </Field>
                  <Field label="Front szuflady na dno"
                    hint="o ile front najniższej szuflady zachodzi na dno korpusu">
                    <Num value={cab.gaps.overBottom ?? 15} onChange={(v) => setGap("overBottom", v)} />
                  </Field>
                  <Field label="Front szuflady na wieniec"
                    hint="o ile front najwyższej szuflady zachodzi na wieniec">
                    <Num value={cab.gaps.overTop ?? 15} onChange={(v) => setGap("overTop", v)} />
                  </Field>
                  <Field label="Front poniżej prowadnicy"
                    hint="szuflada, która nie stoi na dnie ani na przegrodzie">
                    <Num value={cab.gaps.underRail ?? 5} onChange={(v) => setGap("underRail", v)} />
                  </Field>
                </>
              )}
              <Field label="Ostrzegaj powyżej"><Num value={cab.maxGap} onChange={(v) => set({ maxGap: v })} /></Field>
              <Group label="Strona zawiasów"
                hint="Dotyczy wszystkich pojedynczych drzwi w tej szafce. Kolumna z własnym ustawieniem zostaje przy swoim.">
                <Seg value={cab.hinge === "left" || cab.hinge === "right" ? cab.hinge : "auto"}
                  onChange={(v) => set({ hinge: v })}
                  options={[{ v: "auto", l: "Auto" }, { v: "left", l: "Z lewej" }, { v: "right", l: "Z prawej" }]} />
              </Group>
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
              <>
              <Field label="Kształt nóżki">
                <Seg value={legRound(cab) ? "round" : "box"}
                  onChange={(v) => set({ legs: { ...(cab.legs || {}), shape: v } })}
                  options={[{ v: "box", l: "Kwadratowa" }, { v: "round", l: "Okrągła" }]} />
              </Field>
              <Field label="Kolor nóżki" hint="widać go na rysunkach i w 3D">
                <div className="flex flex-wrap items-center gap-1">
                  {LEG_COLORS.map(([nazwa, hex]) => (
                    <button key={hex} title={nazwa}
                      onClick={() => set({ legs: { ...(cab.legs || {}), color: hex } })}
                      className={"h-6 w-6 rounded border transition-transform hover:scale-110 " +
                        (legColorOf(cab).toLowerCase() === hex.toLowerCase()
                          ? "border-teal-700 ring-1 ring-teal-700"
                          : "border-stone-300")}
                      style={{ background: hex }} />
                  ))}
                  <input type="color" value={legColorOf(cab)}
                    onChange={(e) => set({ legs: { ...(cab.legs || {}), color: e.target.value } })}
                    className="h-6 w-8 cursor-pointer rounded border border-stone-300 bg-white" />
                </div>
              </Field>
              </>
            )}
            {cab.legs?.on && (
              <Field label="Wysokość nóżki"
                hint={`Całkowita wysokość z podstawą: ${fmt(cab.H + Math.max(geo.legBelow, cab.plinth.on && !geo.plinthInBody ? geo.plinthH : 0))} mm`
                  + (geo.plinthInBody && geo.legH > 0
                    ? ` — nóżki mieszczą się w świetle cokołu (${fmt(geo.plinthH)} mm)`
                    : "")}>
                <Num value={cab.legs.height ?? 100}
                  onChange={(v) => set({ legs: { ...cab.legs, height: v } })} />
              </Field>
            )}
          </Card>

          <Card title="Montaż półek i zawieszenie" collapsible defaultOpen={false}>
            <Field label="Półki w kolumnach"
              hint={cab.shelfMount === "confirmat"
                ? "skręcane na stałe — bez wierceń pod kołki"
                : "przestawne na kołkach — 4 szt. na półkę"}>
              <Seg value={cab.shelfMount === "confirmat" ? "confirmat" : "pins"}
                onChange={(v) => set({ shelfMount: v })}
                options={[{ v: "pins", l: "Kołki podporowe" }, { v: "confirmat", l: "Konfirmaty" }]} />
            </Field>
            {cab.shelfMount !== "confirmat" && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Otwór od przodu">
                    <Num value={cab.shelfPin?.dFront ?? 37}
                      onChange={(v) => set({ shelfPin: { ...(cab.shelfPin || {}), dFront: v } })} />
                  </Field>
                  <Field label="Otwór od tyłu">
                    <Num value={cab.shelfPin?.dBack ?? 37}
                      onChange={(v) => set({ shelfPin: { ...(cab.shelfPin || {}), dBack: v } })} />
                  </Field>
                </div>
                <Field label="Wysokość otworów liczona od"
                  hint={cab.pinDatum === "bottom"
                    ? "od górnego lica dna, a przy jego braku od spodu wnętrza — tak jak patrzysz na gotową szafkę"
                    : "od dolnej krawędzi boku lub przegrody — tak mierzysz płytę leżącą na stole"}>
                  <Seg value={cab.pinDatum === "bottom" ? "bottom" : "panel"}
                    onChange={(v) => set({ pinDatum: v })}
                    options={[{ v: "panel", l: "Krawędzi boku" }, { v: "bottom", l: "Dna szafki" }]} />
                </Field>
              </>
            )}
            {!szafkaStoi && (
            <Field label="Zawieszki ścienne"
              hint="auto = szafka bez nóżek i bez cokołu jest traktowana jako wisząca">
              <Seg value={cab.hangers === "always" || cab.hangers === "never" ? cab.hangers : "auto"}
                onChange={(v) => set({ hangers: v })}
                options={[{ v: "auto", l: "Auto" }, { v: "always", l: "Zawsze" }, { v: "never", l: "Nigdy" }]} />
            </Field>
            )}
            {!szafkaStoi && cab.hangers !== "never" && (
              <Field label="Zawieszki mocowane"
                hint={cab.hangerMode === "haczyki"
                  ? "bez listwy — każda zawieszka na własnym haku lub wkręcie"
                  : "na listwie przykręconej do ściany na całej szerokości szafki"}>
                <Seg value={cab.hangerMode === "haczyki" ? "haczyki" : "listwa"}
                  onChange={(v) => set({ hangerMode: v })}
                  options={[{ v: "listwa", l: "Na listwie" }, { v: "haczyki", l: "Na haczykach" }]} />
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
                  <input value={mat[k].name} placeholder="Płyta"
                    title={`Nazwa w zestawieniach: ${matLabelOf(mat[k], k, ambig)}`}
                    onChange={(e) => setMat({ ...mat, [k]: { ...mat[k], name: e.target.value } })}
                    className="w-full rounded border border-stone-300 bg-white px-2 py-1.5 text-sm focus:border-teal-600 focus:outline-none" />
                  <span className="mt-1 block font-mono text-[11px] text-stone-400">
                    {matLabelOf(mat[k], k, ambig)}
                  </span>
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
                {COLORED_KEYS.includes(k) && !paletteName(mat[k].color) && (
                  <Field label="Nazwa dekoru"
                    hint="kolor spoza wzornika — bez nazwy do zamówienia poszłoby „kolor własny”">
                    <input value={mat[k].decor || ""} placeholder="np. Dąb halifax naturalny"
                      onChange={(e) => setMat({ ...mat, [k]: { ...mat[k], decor: e.target.value } })}
                      className="w-full rounded border border-stone-300 bg-white px-2 py-1.5 text-sm focus:border-teal-600 focus:outline-none" />
                  </Field>
                )}
                {k !== "mirror" && (
                  <div className="flex flex-wrap gap-1">
                    {PALETA.map(([nazwa, hex]) => (
                      <button key={hex} title={nazwa}
                        onClick={() => setMat({ ...mat, [k]: { ...mat[k], color: hex, decor: "" } })}
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
            {geo.isWorktop && (
              <Field label="Arkusz blatu roboczego"
                hint={`Blat kupuje się w gotowym arkuszu ${fmt(WORKTOP_LEN)} mm długości. Szerszy bierze się pod głębsze zabudowy.`}>
                <Seg value={String(worktopDepth(mat))}
                  onChange={(v) => setMatDepth(Number(v))}
                  options={WORKTOP_DEPTHS.map((d) => ({ v: String(d), l: `${fmt(WORKTOP_LEN)} × ${fmt(d)}` }))} />
              </Field>
            )}
            <Check checked={cab.grainMatters} onChange={(v) => set({ grainMatters: v })}
              label="Kierunek usłojenia ma znaczenie" />
            <Check checked={!!cab.texture} onChange={(v) => set({ texture: v })}
              label="Rysuj strukturę słojów zamiast gładkiego koloru" />
            {cab.texture && (
              <Field label="Kierunek struktury na rysunku"
                hint="tylko wygląd rysunku — o rozkroju decyduje „kierunek usłojenia ma znaczenie”">
                <Seg value={cab.textureDir === "h" ? "h" : "v"}
                  onChange={(v) => set({ textureDir: v })}
                  options={[{ v: "v", l: "Pionowo" }, { v: "h", l: "Poziomo" }]} />
              </Field>
            )}
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
                {/* zakres idzie osobnym wierszem nad wariantami — to dwie różne
                    decyzje: co oglądamy i jak to pokazujemy */}
                <div className="flex w-80 flex-col gap-1.5">
                  {scopeOpts.length > 1 && (
                    <Seg value={scope} onChange={setScope} options={scopeOpts} />
                  )}
                  {/* pietra sciany — dopiero pod nimi ida warianty rysunku */}
                  {scope === "run" && pietraSciany && (
                    <Seg value={tierScope} onChange={setTierScope}
                      options={[{ v: "dolny", l: "Dolny" }, { v: "gorny", l: "Górny" },
                        { v: "calosc", l: "Całość" }]} />
                  )}
                  <Seg value={view} onChange={setView} options={viewOpts} />
                </div>
              </div>
            }>
            <div className="rounded border border-stone-100 bg-stone-50 p-3">
              {scopeRuns ? (
                view === "iso" ? (
                  <div className="space-y-3">
                    {/* Patrzymy od przodu i lekko z gory — przy dodatnim kacie
                        kamera schodzi pod zabudowe i widac spod cokolu. */}
                    <Assembly3D project={project} runs={scope3dRuns} open={open3d}
                      yaw={-Math.PI / 4} pitch={-0.45} angle={angle3d} rpOf={rpOf} />
                    <div className="flex flex-wrap items-center gap-2">
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
                        stały widok — obracanie jest w „3D"
                      </span>
                    </div>
                  </div>
                ) : view === "3d" ? (
                  <div className="space-y-3">
                    <div className="cursor-grab active:cursor-grabbing touch-none"
                      onPointerDown={(e) => {
                        drag.current = { x: e.clientX, y: e.clientY, yaw, pitch };
                        e.currentTarget.setPointerCapture(e.pointerId);
                      }}
                      onPointerMove={(e) => {
                        if (!drag.current) return;
                        setYaw(drag.current.yaw + (e.clientX - drag.current.x) * 0.008);
                        setPitch(Math.max(-1.2, Math.min(1.2,
                          drag.current.pitch + (e.clientY - drag.current.y) * 0.006)));
                      }}
                      onPointerUp={() => (drag.current = null)}
                      onPointerCancel={() => (drag.current = null)}>
                      <Assembly3D project={project} runs={scope3dRuns} open={open3d}
                        yaw={yaw} pitch={pitch} angle={angle3d} rpOf={rpOf} />
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
                ) : view === "top" ? (
                  <AssemblyTopView project={project} runs={scopeRuns} showDims={showDims}
                    showShelves={showShelves} showHardware={showHardware} />
                ) : (
                  <AssemblyView project={project} runs={scopeRuns} rpOf={rpOf}
                    variant={view} showDims={showDims} showHardware={showHardware}
                    showLabels={showLabels} activeCab={cab} />
                )
              ) : view === "3d" ? (
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
                  showHardware={showHardware} arm={cornerNode && cornerNode.arm} />
              ) : view === "rear" ? (
                <RearView cab={cab} geo={geo} mat={mat} showDims={showDims} />
              ) : (
                <FrontView cab={cab} geo={geo} mat={mat} open={view === "open"} showDims={showDims}
                  showGaps={showGaps} showLabels={showLabels} showHardware={showHardware}
                  arm={cornerNode && cornerNode.arm} />
              )}
            </div>
            {/* Podpis pod rysunkiem: co za blat na nim widac. W rogu to nigdy
                nie jest jeden kawalek — kazda sciana ma swoj odcinek i tnie sie
                je osobno, wiec pisanie o „jednej formatce" mylilo. */}
            {scopeRuns && (() => {
              const odcinki = scopeRuns.map((r) => ({ r, rt: runTop(project, r) }))
                .filter((o) => o.rt);
              if (!odcinki.length) return null;
              const jaki = odcinki.some((o) => o.rt.worktop) ? "Blat" : "Wieniec ciągu";
              return (
                <p className="mt-2 text-xs text-stone-500">
                  {jaki}
                  {odcinki.length > 1 ? " — " + odcinki.length + " odcinki, po jednym na ścianę: " : " — "}
                  {odcinki.map((o, i) => (
                    <span key={o.r.id}>
                      {i > 0 ? ", " : ""}
                      {o.r.name}{" "}
                      <span className="font-mono text-stone-700">
                        {fmt(o.rt.total)} × {fmt(o.rt.depth)} mm
                      </span>
                      {o.rt.n > 1 ? ` (${o.rt.n} części)` : ""}
                    </span>
                  ))}
                  {odcinki.length > 1 ? ". Odcinki spotykają się w narożniku i tnie się je osobno." : "."}
                </p>
              );
            })()}
          </Card>

          {(errors.length > 0 || warns.length > 0 || infos.length > 0 || otherNotes.length > 0) && (
            <div ref={notesRef} className="scroll-mt-24">
            <Card title="Uwagi">
              {(errors.length > 0 || warns.length > 0) && (() => {
                /* Ostrzezenie mozna odhaczyc tak samo jak podpowiedz: odhaczone
                   schodzi pod zwijany naglowek i przestaje sie liczyc u gory.
                   Bledow sie nie odhacza — to nie jest cos, co da sie odklikac. */
                const stare = warns.filter((m) => przeczytane.has(m.text));
                const linia = (m, i, czyt) => (
                  <NoteLine key={(czyt ? "wp" : "w") + i} text={m.text} color={WARNC} icon="!"
                    przed={znacznik(m.text, czyt)}
                    editLevels={editLevels} editItemLevels={editItemLevels} editItemCab={editItemCab}
                    cab={cab} setGap={setGap} runFix={runFix} setMatDepth={setMatDepth} />
                );
                return (
                  <>
                    {(errors.length > 0 || warnsNowe.length > 0) && (
                      <ul className="space-y-2">
                        {errors.map((m, i) => (
                          <NoteLine key={"e" + i} text={m.text} color={ERRC} icon="×" editLevels={editLevels} editItemLevels={editItemLevels} editItemCab={editItemCab} cab={cab} setGap={setGap} runFix={runFix} setMatDepth={setMatDepth} />
                        ))}
                        {warnsNowe.map((m, i) => linia(m, i, false))}
                      </ul>
                    )}
                    {stare.length > 0 && (
                      <div className={(errors.length || warnsNowe.length) ? "mt-3 border-t border-stone-100 pt-2" : ""}>
                        <button onClick={() => setPokazPrzeczytaneW((v) => !v)}
                          className="flex items-center gap-2 text-xs text-stone-400 hover:text-stone-600">
                          <span className={"text-[10px] leading-none transition-transform "
                            + (pokazPrzeczytaneW ? "" : "-rotate-90")}>▼</span>
                          Przeczytane ostrzeżenia ({stare.length})
                        </button>
                        {pokazPrzeczytaneW && (
                          <ul className="mt-2 space-y-2 opacity-60">{stare.map((m, i) => linia(m, i, true))}</ul>
                        )}
                      </div>
                    )}
                  </>
                );
              })()}
              {infos.length > 0 && (() => {
                const nowe = infosNowe;
                const stare = infos.filter((m) => przeczytane.has(m.text));
                /* Znacznik idzie do srodka wiersza uwagi, a nie w osobne <li> —
                   zagniezdzone listy dublowaly kazda podpowiedz. */
                const linia = (m, i, czyt) => (
                  <NoteLine key={(czyt ? "p" : "i") + i} text={m.text} color="#78716c" icon="i"
                    przed={znacznik(m.text, czyt)}
                    editLevels={editLevels} editItemLevels={editItemLevels} editItemCab={editItemCab}
                    cab={cab} setGap={setGap} runFix={runFix} setMatDepth={setMatDepth} />
                );
                return (
                  <div className={(errors.length || warns.length) ? "border-t border-stone-100 pt-3" : ""}>
                    <div className="mb-2 text-xs font-medium uppercase tracking-wider text-stone-400">
                      Podpowiedzi — nic nie trzeba poprawiać
                    </div>
                    {nowe.length > 0 && <ul className="space-y-2">{nowe.map((m, i) => linia(m, i, false))}</ul>}
                    {stare.length > 0 && (
                      <div className={nowe.length ? "mt-3 border-t border-stone-100 pt-2" : ""}>
                        <button onClick={() => setPokazPrzeczytane((v) => !v)}
                          className="flex items-center gap-2 text-xs text-stone-400 hover:text-stone-600">
                          <span className={"text-[10px] leading-none transition-transform "
                            + (pokazPrzeczytane ? "" : "-rotate-90")}>▼</span>
                          Przeczytane ({stare.length})
                        </button>
                        {pokazPrzeczytane && (
                          <ul className="mt-2 space-y-2 opacity-60">{stare.map((m, i) => linia(m, i, true))}</ul>
                        )}
                      </div>
                    )}
                  </div>
                );
              })()}
              {otherNotes.length > 0 && (
                <div className={(errors.length || warns.length || infos.length) ? "border-t border-stone-100 pt-3" : ""}>
                  <div className="mb-2 text-xs font-medium uppercase tracking-wider text-stone-400">
                    Do sprawdzenia w innych szafkach
                  </div>
                  <ul className="space-y-1.5">
                    {otherNotes.map((n) => (
                      <li key={n.i} className="text-sm">
                        <button onClick={() => switchCabinet(n.i)}
                          className="text-left hover:underline"
                          style={{ color: n.err ? ERRC : WARNC }}>
                          <span className="font-mono">{n.err ? "×" : "!"}</span>{" "}
                          <span className="font-medium">{n.name}</span>
                          <span className="text-stone-500">
                            {" — "}
                            {[n.err && `${n.err} ${plural(n.err, "błąd", "błędy", "błędów")}`,
                              n.warn && `${n.warn} ${plural(n.warn, "ostrzeżenie", "ostrzeżenia", "ostrzeżeń")}`]
                              .filter(Boolean).join(", ")}
                          </span>
                        </button>
                      </li>
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
                      <td className="py-2 pr-3 font-sans text-stone-500">{matLabelOf(mat[p.matKey], p.matKey, ambig)}</td>
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
                      <th className="py-2 pr-3 font-medium">Szafka</th>
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
                          <td className="py-2 pr-3 font-sans text-xs text-stone-500">{p.fromLabel}</td>
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
                Arkusz {fmt(SHEET_W)} × {fmt(SHEET_H)} mm, okrawany przed rozkrojem do
                {" "}{fmt(USABLE_W)} × {fmt(USABLE_H)} mm, rzaz piły {KERF} mm. Układ jest
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
                          {/* zrzut podajemy w pelnych milimetrach — na dziesiatych
                              i tak nikt nie policzy, ze cos sie z niego wytnie */}
                          {" — zostaje "}{fmt(Math.floor(g.biggestRect.w))}×{fmt(Math.floor(g.biggestRect.h))} mm
                          {g.usefulCount > 1 ? ` i ${g.usefulCount - 1} ${plural(g.usefulCount - 1, "mniejszy zrzut", "mniejsze zrzuty", "mniejszych zrzutów")}` : ""}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          )}

          {/* podpis mowi, czyje to okucia — przy kilku szafkach latwo pomylic karty */}
          <Card title={`Produkty do zamówienia${(cab.name || "").trim() ? " — " + cab.name.trim() : ""}`}>
            {cabHardware.length === 0 ? (
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
                  {cabHardware.map((h, i) => (
                    <tr key={i} className="border-b border-stone-100">
                      <td className="py-2 pr-3">{h.name}</td>
                      <td className="py-2 pr-3 font-mono text-xs text-stone-500">{h.spec}</td>
                      <td className="py-2 text-right font-mono">{hwQty(h)} {hwUnit(h)}{hwNote(h)}</td>
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
            {/* Uchwyt styka sie pierwszy, wiec ten wymiar decyduje o kolizjach
                otwierania — i tak samo dotyczy drzwi, jak i szuflad. */}
            <Field label="Uchwyt wystaje przed front"
              hint="Relingi zwykle 20–35 mm. Muszelki i uchwyty frezowane: 0 — wtedy nic nie wystaje. Ten wymiar wchodzi do kontroli otwierania.">
              <Num value={cab.handleOut ?? 20} min={0}
                onChange={(v) => set({ handleOut: Math.max(0, Math.round(Number(v) || 0)) })} />
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
              Wszystkie ceny są <strong>brutto</strong>. Płyta i formatowanie liczone są od
              arkusza, więc potrzebują policzonego rozkroju — obrzeże, oklejanie i okucia
              wyliczą się od razu. Puste pole bierze cenę domyślną (szara podpowiedź w polu);
              wpisz 0, jeśli pozycja ma nie liczyć się do sumy. Ceny zapisują się razem
              z projektem.
            </p>
            <p className="text-xs text-stone-500">
              Oklejanie rozkrojownia liczy za każdy <strong>rozpoczęty</strong> metr, dlatego
              obrzeża zamawiasz co do dziesiątej części metra, a usługę w pełnych metrach
              w górę.
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
                    <th className="py-2 pr-3 text-right font-medium">Cena jedn. brutto</th>
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
                      <td className="py-1.5 pr-3 text-right font-mono">{qtyFmt(r.qty)} {r.unit}</td>
                      <td className="py-1.5 pr-3 text-right">
                        <input type="number" min={0} step="0.01"
                          value={prices[r.key] ?? ""}
                          placeholder={r.def ? String(r.def) : "0"}
                          title={r.def
                            ? `Cena domyślna: ${zl(r.def)} zł brutto. Wpisz swoją albo 0, żeby wyzerować pozycję.`
                            : "Wpisz cenę jednostkową brutto"}
                          onChange={(e) => setPrice(r.key, e.target.value)}
                          className="w-24 rounded border border-stone-300 bg-white px-1.5 py-1 text-right font-mono text-xs focus:border-teal-600 focus:outline-none" />
                      </td>
                      <td className="py-1.5 text-right font-mono">
                        {r.price ? zl(r.qty * r.price) : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex items-baseline justify-between border-t border-stone-200 pt-3">
              <span className="text-xs uppercase tracking-wider text-stone-500">Razem</span>
              <span className="font-mono text-lg">{zl(quote.sum)} zł brutto</span>
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
                        <td className="py-2 text-right font-mono">{hwQty(h)} {hwUnit(h)}{hwNote(h)}</td>
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
                  replaceProject(newProject());
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
