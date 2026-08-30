# Słownik MebloProjektu — etykieta w aplikacji ↔ nazwa w kodzie

Ściąga, żeby nie przeszukiwać całego `szafki.jsx` za każdym razem, gdy w
rozmowie pada nazwa z interfejsu. Kolumna „w kodzie" to ścieżka w danych
szafki albo ciągu — po niej szuka się w pliku.

**Zasada: zmieniasz etykietę, pole albo nazwę formatki — dopisz tu wiersz.**
Ten plik jest wart tyle, ile jego aktualność. `AI_NOTES.md` mówi *dlaczego*
coś jest zrobione tak, a nie inaczej; ten plik mówi *jak się to nazywa*.

---

## 1. Pojęcia, które łatwo pomylić

W szafce narożnej stoją **dwa różne kątowniki** i to jest najczęstsze źródło
nieporozumień:

| Potocznie | Gdzie stoi | W kodzie | Etykieta w karcie |
|---|---|---|---|
| **kątownik w tylnym narożniku** (słupek) | w tylnym, wewnętrznym rogu — zastępuje bok korpusu od strony, w którą wychodzi ramię; chowa się za plecami z obu ścian | `cab.corner.post = { on, w }`, w geometrii `postSide`, `postW`, `postBack` | „Kątownik w tylnym narożniku" + „Ramiona kątownika" (domyślnie 150 mm) |
| **kątownik narożnika** (przy froncie) | w zewnętrznym rogu, na styku lica korpusu i lica ramienia; zasłania przelot do ramienia | `cornerBracket(arm)`, `cab.corner.bracket` („krotsze"/„dluzsze"), szerokość `cab.corner.bracketW` | „Nachodząca płyta kątownika" + „Szerokość wsporników w rogu" (domyślnie 60 mm) |

Uwaga na nazewnictwo: **„wspornik w rogu" w interfejsie = ramię kątownika
narożnika przy froncie**, a nie wzmocnienie. To nie to samo co:

| Potocznie | Co to | W kodzie |
|---|---|---|
| **wzmocnienie** | listwa albo płyta spinająca korpus tam, gdzie nie ma wieńca (pod blatem roboczym) | `c.rails[]`, `newRail()`, `railPair()`, `bezWienca()` |
| **wspornik pionowy** | pionowa płyta podpierająca, formatka „Wspornik pionowy" | `supportParts` |
| **maskownica kątownika** | widoczna płyta z frontu, zakrywająca kątownik narożnika | formatki „Maskownica kątownika — nachodząca / doczołowa" |
| **ramię** | przedłużenie szafki narożnej wzdłuż drugiej ściany | `cab.corner.arm` (długość), `armPlan`, `armFrontPlan`, `cornerArmParts`, `armCtxOf` |
| **przelot / przejście** | otwarte lico szafki narożnej za maskownicą — wejście do ramienia | `PrzejscieDefs`, podpis „przejście do ramienia" |
| **lico** | płaszczyzna frontów (nie korpusu) | `licoOd0`, `bracketPozaLico` |
| **pasmo frontu** | szerokość, którą fronty mają wypełnić = szerokość korpusu − 2 × luz brzegowy | `sx0`..`sx1` w `computeGeo` |
| **fix** | nieotwierana płyta zamiast drzwi | `cab.corner.doors === "fix"`, `col.fix`, formatka „Element stały (fix)" |
| **blenda** | wąska płyta wypełniająca lukę | formatki „Blenda", „Blenda nad szafką" (`cab.topFiller`) |
| **ciąg** | rząd szafek wzdłuż jednej ściany | `project.runs[]`, `runLayout`, `projectLayout` |
| **piętro / tier** | dolny albo górny ciąg na tej samej ścianie | `run.tier`, `run.mountY` |
| **łyżwa** | blat cięty na 45° w rogu | `rt.skos0`, `rt.skos1` |

---

## 2. Etykieta w aplikacji → ścieżka w danych

### Karta „Ciąg meblowy" (`project.runs[]`)

| Etykieta | W kodzie |
|---|---|
| Ta szafka | `item.runId` |
| Wysunięcie tej szafki z lica | `item.offset` |
| Nazwa ciągu | `run.name` |
| Długość ściany | `run.wallW` (efektywna: `runWallW`) |
| Położenie na ścianie | `run.offset` |
| Prześwit nad blatem | `run.clearance` (domyślnie 500) |
| Wysokość pomieszczenia | `run.ceiling` |
| Luz między korpusami | `run.gap` |
| Poziom montażu | `run.mountY` |
| Narożnik / Luz w rogu | `run.corner = { of, at, owner, clear }` |
| Wysokość / Głębokość (wspólne dla ciągu) | `run.H`, `run.D` |
| Cokół ciągu / Cokół pod szafkami / Podział cokołu | `run.plinth`, `runPlinth`, `runPlinthPanels` |
| Blat roboczy / Blat ciągu / Podział blatu | `run.worktop`, `runTop`, `worktopSpans`, `runTopPanels` |
| Wieszanie ciągu | `run.hangerMode` („listwa" / „haczyki") |

### Karta „Korpus" (`cab`)

| Etykieta | W kodzie |
|---|---|
| Szerokość / Wysokość / Głębokość | `cab.W`, `cab.H`, `cab.D` |
| Złącza korpusu | `cab.joints` (`topL`, `topR`, `botL`, `botR`) |
| Wieniec / Blat z czego | `cab.top.mode` („wieniec" / „blat") |
| Podana szerokość to | `cab.top.widthMode` |
| Wysunięcie w lewo / prawo / do przodu / do tyłu | `cab.top.overL/overR/overFront/overBack` |
| Drzwi (nakładane / wpuszczane) | `cab.frontMode` („overlay" / „inset") |
| Plecy | `cab.back` („hdf" / „board" / „none") |
| Montaż pleców / Szerokość / Głębokość / Luz | `cab.backGroove = { on, offset, depth, play }` |
| Pozycja pleców | `cab.backPos` („inside" / „outside") |
| Materiał pleców | `cab.backBoardMat` |
| Podana głębokość zawiera plecy | `cab.depthIncludesBack`, `cab.depthIncludesFront` |

### Karta „Struktura wnętrza" — grupa „Ramię narożnika"

| Etykieta | W kodzie |
|---|---|
| Korpus wychodzi ramieniem w L | `cab.corner.on` |
| Długość ramienia | `cab.corner.arm` |
| Drzwi w narożniku — typ montażu | `cab.corner.doors`: `wsporniki` / `lamane` / `skrecone` / `fix` |
| Kątownik w tylnym narożniku | `cab.corner.post.on` |
| Ramiona kątownika | `cab.corner.post.w` (domyślnie 150, min `MIN_PART`) |
| Szerokość wsporników w rogu | `cab.corner.bracketW` (puste = `CORNER_BRACKET_W` = 60) |
| Nachodząca płyta kątownika | `cab.corner.bracket` („krotsze" / „dluzsze") |
| Wzmocnienia ramienia | `cab.corner.railW = { przod, tyl }` |

### Karta „Struktura wnętrza" — kolumny i poziomy

| Etykieta | W kodzie |
|---|---|
| szerokość (kolumny) | `col.w` |
| drzwi 1 / drzwi 2 … | `col.doorWidths[]` |
| zaw. | `col.hinges[]` (puste = `autoHinges`) |
| uchwyt / lustro | `col.handles[]`, `col.mirrors[]` |
| własny luz między drzwiami | `col.gapBetween` |
| światło 1 / światło 2 … | `col.shelfTargets[]` |
| Wcięcie na palce zamiast uchwytu | `col.gripDepth` |
| tył (przy szufladzie) | `drawer.tallBack`, `drawer.backHeight` |
| Wzmocnienia korpusu: Wysokość / Głębokość / Położenie / Przy boku / Liczone od tyłu / Skraca drzwi | `rail.h`, `rail.depth`, `rail.pos`, `rail.side`, `rail.fromBack`, `rail.reducesDoor` |

### Karta „Luzy drzwi" (`cab.gaps`)

| Etykieta | W kodzie | Domyślnie |
|---|---|---|
| Od krawędzi korpusu | `gaps.edge` | 2 |
| Między drzwiami | `gaps.between` | **2 — musi być parzysty**, patrz niżej |
| U góry / U dołu | `gaps.top`, `gaps.bottom` | 3 |
| Dookoła drzwi (wpuszczane) | `gaps.inset` | 2 |
| Nałożenie na przegrodę | `gaps.divOverlay` | 7 |
| Front szuflady na dno / na wieniec | `gaps.overBottom`, `gaps.overTop` | 15 |
| Front poniżej prowadnicy | `gaps.underRail` | 5 |
| Ostrzegaj powyżej | `cab.maxGap` | 5 |
| Strona zawiasów | `cab.hinge` | „auto" |
| Kąt otwarcia | `cab.openAngle` | 90 |

`gaps.between` obsługuje też odstęp między frontami szuflad ORAZ luz między
frontami a kątownikiem narożnika (`cornerBracket`), więc jego zmiana rusza
szerokość frontu w rogu i przycięcie podniesionych tyłów szuflad.

### Karty „Cokół", „Nóżki", „Montaż półek i zawieszenie", „Płyty"

| Etykieta | W kodzie |
|---|---|
| Cokół pod szafką / Montaż / Wysokość / Cofnięcie w głąb | `cab.plinth = { on, mode, height, setback }` |
| Nóżki pod szafką / Kształt / Kolor / Wysokość | `cab.legs = { on, shape, color, height }` |
| **Liczba nóżek** | `cab.legs.count` (puste = `autoLegs(W)`; plan w `legPlan`) |
| Półki w kolumnach (kołki / konfirmat) | `cab.shelfMount` |
| Otwór od przodu / od tyłu | `cab.shelfPin = { dFront, dBack }` |
| Wysokość otworów liczona od | `cab.pinDatum` („panel" / „bottom") |
| Zawieszki ścienne / mocowane | `cab.hangers`, `cab.hangerMode` |
| Blenda nad szafką / Wysokość blendy | `cab.topFiller = { on, height }` |
| Fronty z tej samej płyty co korpus | `cab.frontSameAsBoard` |
| Półki z tej samej płyty co korpus | `cab.shelfSameAsBoard` |
| Grubość / Nazwa dekoru | `mat.board/front/shelf/back/mirror.thickness`, `.decor` |
| Arkusz blatu roboczego | `mat.worktop`, `worktopDepth(mat)` |
| Kierunek usłojenia ma znaczenie | `cab.grainMatters`, `cab.texture`, `cab.textureDir` |
| Nazwa uchwytu / Uchwyt wystaje przed front | `cab.handleName`, `cab.handleOut` |

### Karta „Wycięcie w narożniku (tylne)" i „Elementy kolizyjne"

Oba tylne narożniki są osobnymi polami szafki — **`cab.cutout` (lewy) i
`cab.cutoutR` (prawy)**, każdy `{ on, w, d, levelIndex, maskCorner }`.
W geometrii wyniki siedzą w `geo.geoCuts` (`onLeft` mówi, który to narożnik).

| Etykieta | W kodzie |
|---|---|
| Wytnij narożnik lewy / prawy | `cab.cutout.on`, `cab.cutoutR.on` |
| Szerokość od boku / Głębokość od tyłu | `.w`, `.d` |
| Wycięcie przez całą wysokość / Poziom z wycięciem | `.levelIndex` |
| Zabuduj otwór maskownicą / Widoczna ścianka | `.maskCorner` („horizontal" / „vertical") |
| Elementy kolizyjne (rura, gniazdko) | `cab.obstacles[] = { w, d, h, side, fromBack, fromBottom, maskType, maskH, maskFront, maskCorner }` |

---

## 3. Kto co liczy — funkcje, od których się zaczyna

| Funkcja | Co robi |
|---|---|
| `computeGeo(cab, mat, ctx)` | **serce aplikacji** — z opisu szafki robi geometrię, formatki, okucia i uwagi. `ctx` (z `armCtxOf`) jest OBOWIĄZKOWY dla szafki narożnej |
| `armCtxOf(layout, index)` | kontekst rogu dla szafki narożnej: `armFront`, `armSide`, `armFree` |
| `projectLayout(project)` | rozstawia ciągi w rzucie z góry, liczy rogi |
| `runLayout` / `runJoints` / `runPlinth` / `runTop` | układ ciągu, złącza między szafkami, wspólny cokół, wspólny blat |
| `projectParts(project)` | **jedyne** źródło formatek i okuć całego projektu (zestawienia, wycena, rozkrój) |
| `scalOkucia(lista)` | scala okucia do jednego wiersza na produkt, z rozpisanymi zastosowaniami (pole `use`) |
| `cornerArmParts(arm)` | formatki i okucia ramienia narożnika |
| `cornerBracket(arm)` | kątownik narożnika przy froncie: szerokość, luz, która płyta nachodzi |
| `armFrontPlan(arm)` | gdzie zaczyna się i jak szeroki jest front ramienia — jedno miejsce dla formatki i rysunków |
| `armPlan(arm)` / `bracketPlan` | wzmocnienia i kątownik ramienia w układzie „od naroża" |
| `legPlan(cab, W)` / `autoLegs(W)` | rozstaw i liczba nóżek |
| `autoHinges(h, w)` | liczba zawiasów na skrzydło |
| `autoShelves(innerH, t)` | liczba półek przy automacie |
| `distribute` / `evenGapOptions` | podział pasma na fronty + propozycja luzu bez resztek |
| `bezWienca(cab, tf)` | zamiana wieńca na parę wzmocnień (szafka pod blatem) |
| `migrateCab(cab, mat)` / `migrateRun` / `migrateCorner` | podnoszenie starych projektów do bieżącego formatu |
| `splitAtJoints` | dzieli wspólny cokół/blat na odcinki |
| `buildCutPlan` / `packSheets` / `nestPass` | rozkrój na arkusze |
| `swingBodies` / `openingMsgs` | kontrola otwierania skrzydeł, kolizje |
| `worktopMsgs` / `runCornerMsgs` / `cornerPairMsgs` / `tierMsgs` | uwagi na poziomie ciągu i narożnika |
| `hwDefaultPrice(h)` | cena okucia — klucz to `h.pk` albo `h.name` |

Widoki: `CabElevation`, `FrontView`, `RearView`, `TopView`, `SideView`,
`CabTop`, `AssemblyView`, `AssemblyTopView`, `Assembly3D`, `Scene3D`.
Wydruk: `ReportSheet`, `PrintReport`, `ReportCutPlan`, `ReportProjectSheet`.

---

## 4. Stałe

| Nazwa | Wartość | Co znaczy |
|---|---|---|
| `MIN_PART` | 60 | najwęższa formatka, jaką da się uciąć i okleić |
| `MIN_OPENING` | 250 | najmniejsze światło między półkami przy automacie |
| `MIN_LEVEL` | 100 | najniższy sensowny poziom |
| `WASKI_FRONT` | 250 | poniżej tego front jest wąski — podpowiedź, nie błąd |
| `CORNER_BRACKET_W` | 60 | domyślna szerokość wsporników w rogu |
| `ROG_WZM_H` | 60 | wysokość wzmocnień w szafce narożnej |
| `LEG_W` / `LEG_INSET` | 40 / 40 | nóżka i jej odsunięcie od krawędzi |
| `CORNER_L_W` / `CORNER_L_D` / `CORNER_L_TOTAL` | 900 / 570 / 1200 | szablon „narożnik L" |
| `SHEET_W` × `SHEET_H` | 2800 × 2100 | arkusz płyty |
| `USABLE_W` × `USABLE_H` | 2761,2 × 2061,2 | po okrawaniu |
| `KERF` | 3 | rzaz piły |
| `WORKTOP_LEN` | 4100 | długość pasa blatu |
| `WORKTOP_DEPTHS` / `WORKTOP_PRICES` | 600, 1200 / 470, 780 | głębokości i ceny blatu |
| `BACK_CLEAR` | 20 | luz nad podniesionym tyłem szuflady |
| `VBOX` | — | dane katalogowe Sevroll V-BOX 3D Slim, **dla płyty 18 mm** |

Rozstawy okuć (wzorzec `max(2, ceil(długość / skok))`): konfirmat co 200 mm,
wkręt 4 × 30 do kątownika co 200 mm, trójkąt pod cokołem co 300 mm, trójkąt
pod blatem i pod fixem co 400 mm w dwóch rzędach, zszywki co 100 mm.

---

## 5. Dokładne nazwy formatek i okuć

Nazwy są kluczami — grupowanie zestawienia, ceny i testy dopasowują się po nich
co do znaku (łącznie ze spacjami wokół „×").

**Formatki:** Bok · Bok lewy · Bok prawy · Dno / wieniec · Blat · Blat roboczy ·
Półka · Półka przelotowa · Przegroda pionowa · Wspornik pionowy · Blenda ·
Blenda nad szafką · Cokół · Cokół ciągu · Element stały (fix) ·
Front szuflady · Dno szuflady · Tył szuflady · Plecy HDF · Plecy HDF we frezie ·
Plecy z płyty (na zewnątrz) · Plecy z płyty (wewnątrz) ·
Kątownik przy ramieniu — bok · Kątownik przy ramieniu — plecy ·
Bok ramienia · Półka ramienia · Cokół ramienia · Front ramienia · Fix ramienia ·
Plecy ramienia · Plecy ramienia z płyty ·
Kątownik narożnika — nachodzący · Kątownik narożnika — doczołowy ·
Maskownica kątownika — nachodząca · Maskownica kątownika — doczołowa

**Okucia** (każde musi mieć wpis w `DEFAULT_HW_PRICES`, inaczej wycena liczy 0):
Zawias (3) · Zawias 165° (15) · Zawias łamany 90° (15) · Uchwyt (10) ·
Konfirmat 7 × 50 (0,10) · Zaślepka na konfirmat (0,70, blister 25) ·
Kołek podporowy ⌀5 (0,10) · Nóżka regulowana (2,30) · Trójkąt meblarski (0,25) ·
Złączka do cokołu (0,30) · Zawieszka meblowa regulowana (3) ·
Listwa montażowa do zawieszek (9/mb) · Hak / wkręt z kołkiem do ściany (1) ·
Wkręt 4 × 30 (0,08) · Wkręt 3,5 × 30 do pleców (0,05) ·
Zszywka / gwoździk do pleców (0,05) · Lustro na drzwiach (200/m²) ·
Prowadnica Sevroll V-BOX 3D Slim … mm (`SLIDE_PRICES` wg NL)

---

## 6. Szybkie poprawki w Uwagach

Kod akcji dopisuje się do tekstu uwagi po znaku `|`; obsługuje je `NoteLine`.

| Kod | Co robi |
|---|---|
| `fixgap:<lv>:<col>:<v>:<up\|down>` | ustawia luz między drzwiami, żeby fronty wyszły równe |
| `fixh:` / `fixnl:` / `fixback:` / `fixnodoor:` | wysokość, NL prowadnicy, tył szuflady, kolumna bez drzwi |
| `fixdiv:` / `fixsup:` / `fixcolauto:` | przegroda, wspornik, kolumna na automat |
| `hingeflip:<lv>:<col>:<side>` | przekłada zawiasy na drugą stronę |
| `cornerdoor:<w>:<idx>` | ustawia jedne drzwi szafki narożnej na podaną szerokość |
| `noTop:<idx>` | zamienia wieniec na parę wzmocnień |
| `rundepth:<mm>[@runId]` / `runcab:` / `runrun:` | wyrównuje głębokość / szafkę / cały ciąg |
| `plinthauto` / `topauto` / `topcut:0\|1` / `worktop:` | cokół, wieniec, cięcie blatu |

---

## 7. Testy — co która suita pilnuje

Uruchamianie: `cd testy && bash sweep.sh <nazwy>` (bez `.mjs`).
`STD=1` przełącza na `standalone-local.html` (port 5199), domyślnie
`mebloprojekt-app.html` (port 5205).

| Suita | Pilnuje |
|---|---|
| `narozn` | dwa ciągi pod kątem prostym, kto wjeżdża w róg, luz w rogu, lustrzane L, U z trzech ścian |
| `narozn2` | ramię odsuwa drugi ciąg, formatki ramienia, cztery warianty drzwi, za wąski korpus |
| `narozn3` | blat w narożniku: na styk, przełączenie, łyżwa, U |
| `narkat` | kątownik w tylnym narożniku: bok znika, ramiona regulowane |
| `rogplecy` | plecy z płyty w narożniku, osobno od każdej ściany |
| `ramplec` / `ramkarta` | wzmocnienia i plecy ramienia; karta ustawień ramienia |
| `rysrog` | rysunki narożnika: front na bok z luzem, zawiasy, rzut z góry, tył, nóżki ramienia |
| `blatrog` / `blatrys` / `blat` / `blatciag` | blat roboczy: róg, rysunki, ciąg, wieniec |
| `okucia3` | liczby okuc z wymiaru: klipsy, trójkąty, fix, zawiasy 165°/90° |
| `hw2` / `cokol` / `cokolstd` / `ceny` / `ceny2` | okucia, cokół, cennik |
| `ciag`…`ciag10` | ciągi: zakładanie, rozjazdy, cokół ciągu, światła |
| `pietra` | dolny i górny ciąg na tej samej ścianie |
| `tylkol` / `tylkolstd` | podniesiony tył szuflady |
| `otwier` | kolizje przy otwieraniu skrzydeł |
| `uwagiptak` | odhaczanie uwag |
| `migr` / `reload` | migracja starych projektów, przeładowanie |
| `arkusz` / `cutplan` / `fit` / `fitall` | mieszczenie się w arkuszu i rozkrój |
| `drobne` | luzy domyślne, nazwa uchwytu, dekor, wkręt do pleców |
| `stdfull` / `stdnew` | wersja standalone (ścieżka GitHub Pages) |

---

## 8. Komendy

```bash
node testy/build-artifact.mjs        # szafki.jsx -> testy/mebloprojekt-app.html (0 znaków spoza ASCII)
node scripts/generate-standalone.mjs # szafki.jsx -> standalone.html
# testy/standalone-local.html = standalone.html z 4 adresami CDN podmienionymi na cdn/*.js
#   (dokładnie 8 linii różnicy w diff)
cd testy && python3 -m http.server 5205   # dla mebloprojekt-app.html
cd testy && python3 -m http.server 5199   # dla standalone-local.html
cd testy && bash sweep.sh narozn2 okucia3 # wynik: „NN OK, N BLAD"
```
