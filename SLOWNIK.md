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
| **piętro / tier** | dolny albo górny ciąg na tej samej ścianie | `run.tier`, `run.mountY`; w układzie górny ma `n.dolny` i **ramkę oraz numer ściany swojego dolnego**; w rogu górny ciąg, który się tam zaczyna, odsuwa się o głębokość górnego ciągu ściany wjeżdżającej (gdy ten sięga rogu) |
| **łyżwa** | blat cięty na 45° w rogu | `rt.skos0`, `rt.skos1` |

---

## 2. Etykieta w aplikacji → ścieżka w danych

### Karta „Ciąg meblowy" (`project.runs[]`)

Dwie części (`CardPart`): u góry **„Ta szafka w ciągu"** (pola jednej szafki),
niżej **„Cały ciąg „…""** z podsekcjami (`CardSub`): Ściana · Wymiary i montaż ·
Narożnik · Cokół · Blat · Wieszanie. Pusta podsekcja się nie pokazuje.

| Etykieta | W kodzie |
|---|---|
| Należy do ciągu | `item.runId` |
| Wysunięcie tej szafki z lica | `item.offset` |
| Odsunięcie tej szafki od ściany (dół / blat) | `item.wallGap = { bottom, top }`; `null` = jak ciąg; rozwiązuje `wallGapOf(run, item)` |
| Odsunięcie od ściany (dół / blat) | `run.wallGap = { bottom, top }`; `top: null` = jak na dole; wchodzi do `runFrontDepth` (rzut, 3D, róg); widok z boku rysuje ścianę (`data-el="sciana"`), uwagi: `wallGapMsgs`; szafka w L odsuwa się od ściany sąsiada o jego odstęp (`pair.odSasiada`) |
| Nazwa ciągu | `run.name` |
| Długość ściany | `run.wallW` (efektywna: `runWallW`) |
| Położenie na ścianie | `run.offset` |
| Prześwit nad blatem | `run.clearance` (domyślnie 500) |
| Wysokość pomieszczenia | `run.ceiling` |
| Luz między korpusami | `run.gap` |
| Poziom montażu | `run.mountY` |
| Narożnik / Luz w rogu | `run.corner = { of, at, owner, clear }` |
| Kreator rogu („+ ciąg” przy istniejącym ciągu) | okienko `kreator` (`data-el="kreator-rogu"`): do którego ciągu, za/przed, kto w róg, szafka w rogu (ślepa z fixem / w L / bez), szerokość, ramię, wstawka, blat; tworzy `utworzCiagZRogiem(p, o)` (domyślne `KREATOR_DOMYSLNY`) |
| Wstawka w rogu | `run.corner.wstawka = { typ: "plaska" \| "szeroka", w }` (`WSTAWKA_W` = 60); tylko bez szafki w L; w układzie `n.pair.wstawka` i `n.wstawki[]` ciągu, który ustępuje (u0/u1, v0/v1, z0/z1); formatka i okucia `wstawkaParts`; odsuwa ciąg o grubość frontu (płaska) albo `w` (szeroka) |
| Wysokość i głębokość szafek (Wymiary i montaż) | `run.H`, `run.D` |
| Cokół ciągu / Cokół pod szafkami / Podział cokołu | `run.plinth`, `runPlinth`, `runPlinthPanels` |
| Blat roboczy / Blat ciągu / Podział blatu | `run.worktop`, `runTop`, `worktopSpans`, `runTopPanels` |
| Blat w narożniku (przechodzi / dojeżdża / łyżwa) | `run.corner.top`, `run.corner.cut`; `projectLayout` → `topSpan.przez0/przez1` (czyj blat idzie przez róg); `runTop` skraca dojeżdżający do głębokości przechodzącego (`rt.depth`, z docinką arkusza) |
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
| front: skrzydło / klapa, a przy klapie „otwierana: do góry / w dół” | `col.klapa` = brak / `"gora"` / `"dol"` (samo „klapa” zaczyna od `"gora"`) — tylko przy 1 drzwiach w kolumnie (`data-el="klapa-kolumny"`); w geometrii front typu `"klapa"` z `klapaZawiasy` (x zawiasów), lista `geo.klapy[]` |
| podnośniki (do góry) / amortyzatory (w dół): auto / 1 / 2 | `col.silowniki` (puste = 1, powyżej 600 mm szerokości 2; jeden przy ponad 600 mm — ostrzeżenie) |
| siła N | `col.silaN` (puste = z tabeli: PD-G00 do góry, PD-ECGDL w dół) — `data-el="klapa-sila"` |
| kąt 75° / 90° / 100° (klapa do góry) | `col.katKlapy` (puste = 90) |
| uchwyt / lustro | `col.handles[]`, `col.mirrors[]` — w wierszu okuć pod szerokością skrzydła (`data-el="drzwi-okucia"`): zawiasy, uchwyt, lustro |
| uchwyt: … mm, na boku / górze | `col.handleOuts[]` (puste = `cab.handleOut`, 20), `col.handlePos[]` (`"bok"` / `"gora"`); liczy `uchwytOut(d, cab)` i `uchwytObrys(d)` — rysunek z przodu (`data-el="uchwyt-bok|gora"`), 3D, rzut z góry, kontrola otwierania |
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
| Strona zawiasów | `cab.hinge` | „auto" — w karcie „Luzy drzwi” (cała szafka, pojedyncze drzwi); przy kolumnie z jednymi drzwiami przełącznik „zawias” w Strukturze wnętrza (`col.hinge`, `data-el="zawias-kolumny"`) |
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
| `computeGeo(cab, mat, ctx)` | **serce aplikacji** — z opisu szafki robi geometrię, formatki, okucia i uwagi. `ctx` (z `armCtxOf`) jest OBOWIĄZKOWY dla szafki narożnej. Wynik zapamiętany (`geoCache`: szafka → materiały → `JSON(ctx)`), liczy `computeGeoLiczy` — **wyniku nie wolno zmieniać**, a szafki ani materiałów nie zmienia się w miejscu (zawsze nowy obiekt) |
| `armCtxOf(layout, index)` | kontekst rogu dla szafki narożnej: `armFront`, `armSide`, `armFree` |
| `projectLayout(project)` | rozstawia ciągi w rzucie z góry, liczy rogi |
| `formatkiSzafki(geo, { bezCokolu, bezBlatu, arm })` | lista formatek jednej szafki — **ta sama** w karcie „Formatki do zamówienia” i na wydruku; cokół i blat wspólne dla ciągu wypadają (są w liście projektu), ramię szafki w L dochodzi (`cornerArmParts`) |
| `calyProjekt(project)` | czy pokazać „Formatki / Produkty całego projektu”, rozkrój całości i stronę projektu w PDF: 2+ szafki **albo** cokół/blat ciągu/ramię — przy jednej szafce w ciągu to jedyne miejsce, gdzie są blat i cokół |
| `audytBryly` | tylko dla testów: gdy strona ma `window.__audytBryl`, bryły 3D (szafka i zabudowa) dopisują tam wymiary; `testy/formatki.mjs` sprawdza, czy każda narysowana płyta jest w formatkach |
| `runLayout` / `runJoints` / `runPlinth` / `runTop` | układ ciągu, złącza między szafkami, wspólny cokół, wspólny blat. `runTop` zapamiętany przy obiekcie projektu i ciągu (`runTopCache`, liczy `runTopLiczy`) — jak przy `computeGeo`: wynik tylko do odczytu |
| `projectParts(project)` | **jedyne** źródło formatek i okuć całego projektu (zestawienia, wycena, rozkrój) |
| `scalOkucia(lista)` | scala okucia do jednego wiersza na produkt, z rozpisanymi zastosowaniami (pole `use`) |
| `cornerArmParts(arm)` | formatki i okucia ramienia narożnika |
| `cornerBracket(arm)` | kątownik narożnika przy froncie: szerokość, luz, która płyta nachodzi |
| `armFrontPlan(arm)` | gdzie zaczyna się i jak szeroki jest front ramienia — jedno miejsce dla formatki i rysunków |
| `armPlan(arm)` / `bracketPlan` | wzmocnienia i kątownik ramienia w układzie „od naroża" |
| `legPlan(cab, W)` / `autoLegs(W)` | rozstaw i liczba nóżek |
| `armLegPlan(arm)` | nóżki ramienia narożnika jak w szafce tej długości (`legPlan`): przy rogu, pod końcem, od 900 mm na środku; `us` od rogu, `vs` od ściany — jedno źródło dla zamówienia, elewacji i bryły |
| `ulozSciany(solids, proj)` | kolejność rysowania i cieniowanie w obu widokach 3D (zabudowa i szafka) |
| `autoHinges(h, w)` | liczba zawiasów na skrzydło |
| `autoShelves(innerH, t)` | liczba półek przy automacie |
| `distribute` / `evenGapOptions` | podział pasma na fronty + propozycja luzu bez resztek |
| `bezWienca(cab, tf)` | zamiana wieńca na parę wzmocnień (szafka pod blatem) |
| `migrateCab(cab, mat)` / `migrateRun` / `migrateCorner` | podnoszenie starych projektów do bieżącego formatu |
| `splitAtJoints` | dzieli wspólny cokół/blat na odcinki |
| `buildCutPlan` / `packSheets` / `nestPass` | rozkrój na arkusze |
| `swingBodies` / `openingMsgs` | kontrola otwierania skrzydeł, kolizje |
| `wallGapOf(run, item)` / `migrateWallGap` | odsunięcie od ściany szafki: własne albo z ciągu; `{ bottom, top }` (`top` = pod blatem, domyślnie jak `bottom`) |
| `cudzeRamiona` (w `AssemblyTopView`) | ramię szafki w L, którego ściany nie rysujemy (zakres „Ciąg”) — przeniesione macierzą na swoje prawdziwe miejsce, z kawałkiem ściany i blatem |
| `cornerSpan(n)` / `SZEROKI_FRONT` (600) | ile szafka w L zajmuje od rogu wzdłuż obu ścian (odstęp + głębokość korpusu + ramię; odstęp + szerokość korpusu) i ostrzeżenie o froncie ramienia szerszym niż 600 mm |
| `blatNadSzafka(project, full, index, arm)` | blat ciągu nad jedną szafką w jej rzucie z góry (i blat sąsiedniej ściany nad ramieniem); przełącznik „Ukryj / Pokaż blat” (`showBlat`) także w rzucie zabudowy; wymiary ramienia w rzucie szafki: `data-el="wymiary-ramienia"` |
| `dobierzPodnosnik(hFrontu, kgNaJeden, kat, kierunek)` | najmniejsza siła z `GTV_PD_G00` (do góry) albo `GTV_PD_ECGDL` (w dół), która uniesie wagę na jeden podnośnik (między wierszami proporcjonalnie; poniżej 300 jak 300, powyżej 600 → `poza`) |
| `geo.plecyZa`, `geo.glebOdSciany` | grubość pleców stojących za korpusem (HDF przybijany, płyta na zewnątrz; 0 dla frezu i płyty wewnątrz) i głębokość od ściany do lica korpusu z nimi — tej używa układ ciągu (`runFrontDepth`, róg `glRog`, blat ciągu `runTop`, kontrola głębszej szafki w rogu) |
| `plecyBryla(cab, geo)` | położenie pleców w bryle 3D (szafka i zabudowa) — jedna zasada z widokiem z tyłu i formatkami |
| `geo.shelfBack`, `c.shX0/shX1/shW` | półki: odsunięcie od tyłu (w szafce w L przed kątownikiem) i zasięg w kolumnie (przy kątowniku węższa o plecy); formatka „Półka” ma szerokość `shW` |
| `armKorpus(a)` | głębokość korpusu ramienia szafki w L: głębokość sąsiada od ściany bez pleców ramienia (bok, dno ramienia) |
| `c.shFront`, `c.shD` | półka przy wsporniku pionowym fixu: o ile zaczyna się dalej od lica (za wspornikiem) i jej głębokość; formatki grupują półki po `shW|shD` |
| pusty ciąg (`runFrontDepth`) | bez szafek: `run.D` + domyślne plecy HDF + odstęp od ściany — ramię szafki w L stoi tak daleko od ściany jak szafki obok |
| `skrzynkaBryly(d, t, zFront)` | skrzynka szuflady w 3D po otwarciu (boki metalowe, dno, tył) z `dr.skrzynka` (te same wymiary co formatki); na widoku z boku kontur `data-el="skrzynka"` |
| `okuciaSzafki(geo, { bezListwy, arm, wstawki })` | okucia jednej szafki — ekran i PDF: bez listwy wspólnej ciągu, z okuciami ramienia szafki w L i wstawki (jak `formatkiSzafki`) |
| wymiar „N z wstawką” | rzut z góry ciągu/zabudowy: wstawka jako odcinek w łańcuchu wymiarów i wymiar całości z nią (`data-el="wymiar-wstawki"`) |
| `wstawkiSzafki(wstawki, geo)` | wstawka w rogu w układzie samej szafki (lewy bok, gdy szafka zaczyna ciąg od rogu, inaczej prawy) — dla `FrontView`, `TopView`, `SideView` (bok od strony wstawki), `RearView`, `Scene3D` i arkusza PDF; `data-el="wstawka"` |
| `KlapaElewacja` | klapa na widoku z przodu (szafka i ciąg): trójkąt z wierzchołkiem przy krawędzi zawiasów, uchwyt poziomy przy wolnej; otwarta — pasek frontu przy zawiasach. `data-el="klapa"` |
| `rotAboutX` / `klapaObrot` / `klapaUchwytY` | klapa w bryle 3D: obrót wokół krawędzi zawiasów (do góry +, w dół −, najwyżej 90°), uchwyt przy wolnej krawędzi |
| `TopHardware` | okucia w widoku z góry (szafka i zabudowa, pod „Pokaż okucia”): uchwyty przed frontem, zawiasy przy boku od frontu, nóżki przerywane; `data-el="okucia-gora"` |
| `worktopMsgs` / `runCornerMsgs` / `cornerPairMsgs` / `tierMsgs` | uwagi na poziomie ciągu i narożnika |
| `hwDefaultPrice(h)` | cena okucia — klucz to `h.pk` albo `h.name` |
| „Pokaż rysunek” (górny pasek) | przewija do karty `Card id="rysunek"` (`scrollMarginTop` pod przyklejony pasek) — przycisk roboczy |
| `ZoomBox` / `ZOOM_KROKI` | powiększanie rysunku: „− / % / + / Dopasuj” nad rysunkiem, przeciąganie przesuwa (w 3D z Shiftem); każdy rysunek (`resetKey` = zakres | widok | szafka) pamięta powiększenie, przewinięcie i szerokość przy 100% w `ZOOM_PAMIEC` (do przeładowania strony), nowy startuje od „Dopasuj”; Ctrl + kółko nad rysunkiem przybliża w miejscu kursora; „Pełny ekran” (`pelnyRys`, Esc zamyka) |
| `wyslijDoClaude` / `PROJEKT_DLA_CLAUDE` | przycisk „Wyślij do Claude” — **tylko w artefakcie na claude.ai**: zapis projektu do wspólnego magazynu (`projekt/biezacy`, pole `json`) |

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
| `WASKI_FRONT` | 250 | poniżej tego front jest wąski — podpowiedź, nie błąd; też próg podpowiedzi „dwoje wąskich drzwi” |
| `n.pair.frontRog` | tf / 0 | ślepy róg: front szafki w rogu (nakładany) — drugi ciąg zaczyna się za nim: korpus + front + luz + wstawka; przy szafce w L 0 (róg domyka ramię) |
| `SLEPY_ZAPAS` | 30 | ślepy róg: zasłonięta część frontu = głębokość sąsiada + jego front + ten zapas na uchwyt (`n.blind.covered`, pełna wartość `zaslania`) |
| `GTV_PD_G00`, `KLAPA_WYS`, `KLAPA_SILY` | tabela | udźwig [kg] jednego podnośnika GTV PD-G00 wg kąta (75/90/100°), siły (50–150 N) i wysokości frontu (300–600 mm); instrukcja od użytkownika. „12” dla 50 N/400 mm/75° to literówka → 1,2 |
| `GTV_PD_ECGDL` | tabela | amortyzator olejowy klapy opadanej: 60 / 80 / 150 N, tylko 90°, liczby jak PD-G00 dla 90° (karta od użytkownika) |
| `GESTOSC_FRONTU` | 680 | kg/m³ płyty frontu do wagi klapy (`wagaFrontu`; gęstość robocza od użytkownika 660–680, bierzemy górną; 18 mm ≈ 12,2 kg/m²) |
| `KLAPA_MIN_KORPUS` | 290 | instrukcja GTV: tyle korpusu na boku pod podnośnik klapy do góry |
| `WSTAWKA_W` | 60 | wstawka w rogu: płaska tyle w głąb, szeroka tyle licem do przodu |
| `CORNER_BRACKET_W` | 60 | domyślna szerokość wsporników w rogu |
| `ROG_WZM_H` | 60 | wysokość wzmocnień w szafce narożnej |
| `LEG_W` / `LEG_INSET` | 40 / 40 | nóżka i jej odsunięcie od krawędzi |
| `CORNER_L_W` / `CORNER_L_D` / `CORNER_L_TOTAL` | 900 / 560 / 1200 | szablon „narożnik L" |
| `SHEET_W` × `SHEET_H` | 2800 × 2100 | arkusz płyty |
| `USABLE_W` × `USABLE_H` | 2761,2 × 2061,2 | po okrawaniu |
| `KERF` | 3 | rzaz piły |
| `WORKTOP_LEN` | 4100 | długość pasa blatu |
| `WORKTOP_DEPTHS` / `WORKTOP_PRICES` | 600, 1200 / 470, 780 | głębokości i ceny blatu |
| `WORKTOP_OVERHANG` / `WORKTOP_MAX_OVERHANG` | 10 / 30 | wysięg blatu przed drzwi: standard / granica, ponad którą ostrzeżenie i docinanie |
| `HINGE_PLAY` | 2 | luz między korpusem a drzwiami przy zawiasach — tylko do głębokości blatu, nie do rysunków |
| `SCIANA_GR` / `ScianaDefs` | 100 | ściana na rysunkach: pas 100 mm z szarym kreskowaniem (`url(#sciana-kreski)`) — rzut z góry (z nazwą ściany i ciągu górnego) i widok z boku; zasięg w rzucie liczy `scianaZasieg` (róg: do narożnika muru, wolny koniec: koniec ciągu albo „Długość ściany”); przełącznik „Ukryj / Pokaż ścianę” (`showWall`) |
| `BACK_CLEAR` | 20 | luz nad podniesionym tyłem szuflady |
| `VBOX` | — | dane katalogowe Sevroll V-BOX 3D Slim, **dla płyty 18 mm** |

Rozstawy okuć (wzorzec `max(2, ceil(długość / skok))`): konfirmat co 200 mm,
wkręt 4 × 30 do kątownika co 200 mm, trójkąt pod cokołem co 300 mm, trójkąt
pod blatem i pod fixem co 400 mm w dwóch rzędach, zszywki co 100 mm.

**Zasada „minimum 2 na styku"**: każdy styk dwóch płyt dostaje co najmniej dwa
łączniki, bo na jednym płyta się obraca. Wkręt 4 × 30 to 4 na wzmocnienie
(czyli 2 na koniec), kołek podporowy 4 na półkę (2 na bok).
Jedyny wyjątek: **cokół skręcany bez nóżek** ma po 1 trójkącie na każdym
krótkim boku — wolno, bo jest mocowany z trzech stron naraz, więc się nie
przekręci. Nie „poprawiaj" tego przy audycie.

---

## 5. Dokładne nazwy formatek i okuć

Nazwy są kluczami — grupowanie zestawienia, ceny i testy dopasowują się po nich
co do znaku (łącznie ze spacjami wokół „×").

**Formatki:** Bok · Bok lewy · Bok prawy · Dno / wieniec · Blat · Blat roboczy ·
Półka · Półka przelotowa · Przegroda pionowa · Wspornik pionowy · Blenda ·
Blenda nad szafką · Klapa · Cokół · Cokół ciągu · Element stały (fix) ·
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
Podnośnik gazowy N N / Podnośnik gazowy — siła do dobrania (cena po `pk` „Podnośnik gazowy do klapy”, 10) ·
Amortyzator do klapy opadanej N N (`pk` „Amortyzator do klapy opadanej”, 10) ·
Prowadnica Sevroll V-BOX 3D Slim … mm (`SLIDE_PRICES` wg NL)

---

## 6. Szybkie poprawki w Uwagach

Kod akcji dopisuje się do tekstu uwagi po znaku `|`; obsługuje je `NoteLine`.

| Kod | Co robi |
|---|---|
| `fixgap:<lv>:<col>:<v>:<up\|down>` | ustawia luz między drzwiami, żeby fronty wyszły równe |
| `fixh:` / `fixnl:` / `fixback:` / `fixnodoor:` | wysokość, NL prowadnicy, tył szuflady, kolumna bez drzwi |
| `fixdiv:` / `fixsup:` / `fixcolauto:` | przegroda, wspornik, kolumna na automat |
| `wspornikoff:<poziom>:<kolumna>:<strona zawiasu albo ->` | przy półce skróconej do wspornika fixu: „Przełóż zawiasy na drugą stronę i usuń wspornik” albo „Usuń wspornik” |
| `slepyfix:<nr szafki>:<strona>:<szerokość>` | „Popraw fix na N mm” — fix szafki w ślepym rogu inny niż zasłonięta część (bez tolerancji) |
| `hingeflip:<lv>:<col>:<side>` | przekłada zawiasy na drugą stronę |
| `hingeflipcab:<nr szafki>:<lv>:<col>:<side>:<ile zostaje>` | w uwadze o kolizji otwierania: „Przełóż zawiasy na lewą/prawą — zostaje N mm / bez kolizji”; tylko pojedyncze drzwi i tylko gdy przełożenie zmniejsza kolizję (liczone w `swingBodies` → `s.alt`); gdy nie pomaga, rady o zawiasach nie ma |
| `slepyrog:<nr szafki>:<strona fixu>:<fix mm>:<ciąg z narożnikiem albo ->` | „Ustaw szafkę w rogu”: w każdym poziomie kolumna od rogu dostaje fix na zasłoniętą część, jedne drzwi i zawias od zewnątrz (uchwyt przy fixie), a narożnik — płaską wstawkę; blok „Szafka w rogu do ustawienia” (`cornerPairMsgs`) pokazuje się, dopóki `slepyUstawiony(z)` nie jest spełnione, a kolizje otwierania w tym rogu czekają |
| `wstawka:<ciąg z narożnikiem>:<plaska\|szeroka>:<mm>` | przy kolizji otwierania między ciągami w rogu (bez szafki w L): „Dodaj wstawkę 18 mm”, a gdy płaska już jest — „Wstawka 60 mm (na trójkątach)”; obsługa w `runFix` przez `setCorner` |
| `onedoor:<lv>:<col>:<szer>:<side>` | dwoje wąskich drzwi (każde < `WASKI_FRONT`, jedne ≤ `SZEROKI_FRONT`) zamienia na jedne z zawiasami z lewej/prawej; podpowiedź „dwoje wąskich drzwi” w `computeGeo` (nie w szafce narożnej ani przy rogu) |
| `cornerdoor:<w>:<idx>` | ustawia jedne drzwi szafki narożnej na podaną szerokość |
| `noTop:<idx>` | zamienia wieniec na parę wzmocnień |
| `rundepth:<mm>[@runId]` / `runcab:` / `runrun:` | wyrównuje głębokość / szafkę / cały ciąg |
| `plinthauto` / `topauto` / `topcut:0\|1` / `worktop:` | cokół, wieniec, cięcie blatu (`topcut:1` → `run.topCut = true` docięty, `topcut:0` → `false` cały arkusz; `null` = sam dobiera) |
| `armlen:<mm>:<idx>:<drzwi>` | skraca ramię szafki w L (`cab.corner.arm`) — przyciski przy drzwiach ramienia szerszych niż 600 mm |
| `legs:<n>` | wpisuje liczbę nóżek (podpowiedź przy ręcznie za małej liczbie) |

---

## 7. Testy — co która suita pilnuje

Znane błędy suit i ich przyczyny: `BLEDY.md`.

Uruchamianie: `cd testy && bash sweep.sh <nazwy>` (bez `.mjs`).
`STD=1` przełącza na `standalone-local.html` (port 5199), domyślnie
`mebloprojekt-app.html` (port 5205).

Testy importują Playwrighta przez `testy/pw.mjs`: `page.waitForTimeout(N)` kończy
się, gdy strona jest bezczynna (narysowana, bez oczekujących zegarów aplikacji,
bez trwającego przewijania), a `N` jest tylko limitem. `PW_WOLNO=1` przywraca
sztywne pauzy — gdy test sypie się tylko w szybkim trybie, znaczy to, że czeka
na coś, czego `pw.mjs` nie widzi (dopisz to do `zajeta` w `pw.mjs`, nie wydłużaj
pauzy w teście). Nowy test: `import pw from './pw.mjs';`.

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
| `bryla3d` | co widać na wierzchu w 45° i 3D: blat, maskownice, uchwyty; nóżki; zero wymuszeń kolejności z ośmiu stron |
| `wyslij` | przycisk „Wyślij do Claude”: bez magazynu go nie ma, z atrapą zapisuje pełny projekt |
| `opisy` | żaden napis na rysunku nie jest przykryty płytą, nóżką ani blatem — wszystkie zakresy i widoki szafki narożnej |
| `zoom` | powiększanie i przesuwanie rysunku, „Dopasuj”, pamięć powiększenia i przewinięcia każdego widoku, pełny ekran z Esc, 3D: obrót vs Shift + przesuwanie |
| `wasdrzwi` | podpowiedź „dwoje wąskich drzwi” (300, 500 tak; 600 i jedne drzwi nie), przyciski zawiasy z lewej/prawej |
| `formatki` | **audyt**: każda płyta z rysunku 3D (szafka i zabudowa) ma parę w formatkach szafki/projektu — drzwi, szuflady, fix ze wspornikiem, fix u góry, blendy, maskownica wycięcia, plecy z płyty, przegrody, ciąg z blatem i cokołem, szablony (w tym szafka w L); ramię w liście szafki narożnej |
| `wstawka` | wstawka w rogu: przyciski przy kolizji, formatka 720 × 60 w liście szafki i projektu, wkręty/trójkąty, rzut 18 × 60 / 60 × 18, elewacja, odsunięcie ciągu o 18/60, pole w Narożniku, brak przy szafce w L; widoki samej szafki (przód zamk./otw. przy prawym boku 18 × 720, z góry 18 × 60, bryła 3D), a szafka nie przy rogu bez wstawki |
| `gorne` | ciągi górne w L: górny drugiej ściany wisi na niej (bez kolizji z górnym pierwszej), odsunięcie 300 w rogu, gdy górny ściany wjeżdżającej sięga rogu; „+ szafka” bierze H/D/cokół ciągu (górny 300, dolny 570) |
| `kreator` | kreator rogu: ślepa szafka 1000 z fixem 618 od rogu, jedne drzwi, zawias od zewnątrz, wstawka płaska — bez bloku „do ustawienia”; szafka w L 900 + ramię 630 bez wstawki; osobny ciąg; przycisk „Ustaw szafkę w rogu” w istniejącym projekcie |
| `audyt` | audyt całości na ~20 konfiguracjach: nachodzenie brył 3D (szafka i zabudowa, zamknięte), formatki ↔ rysunek w obie strony z ilościami (szuflady w bryle otwartej), formatki projektu = suma szafek + cokół/blat ciągu, okucia projektu vs suma, PDF = ekran (formatki i okucia szafek i projektu). HDF we frezie może wchodzić krawędzią do 4 mm; `znane` — przypadki czekające na decyzję (BLEDY.md). Trwa ok. 4 min |
| `wspornik` | półka przy wsporniku fixu płytsza (564 × 460 zamiast 564 × 560), ostrzeżenie, oba warianty przycisku, kołki półki w bokach w planie wierceń (PDF) |
| `uchwyt` | wiersz okuć skrzydła (zawiasy, uchwyt, lustro), wysunięcie i położenie uchwytu per skrzydło — zapis, rysunek z przodu, bryła 3D |
| `klapy` | klapa do góry: siła z tabeli GTV (test liczy ją sam), waga frontu (680 kg/m³), 1 podnośnik przy 600, 2 przy 900, ręcznie 1 → ostrzeżenie; zawiasy 2 / 3 powyżej 900; formatka „Klapa”; UI „skrzydło / klapa”, potem „do góry / w dół”; klapa w dół: amortyzator z tabeli PD-ECGDL, po wpisaniu 80 N pozycja w okuciach; klapa użytkownika 560 × 750 — poza tabelą i za ciężka, z uwagą o kącie 45°; ostrzeżenia >600 mm i <290 mm; bryła otwarta szafki i ciągu bez błędów |
| `zawiasy` | przycisk przełożenia zawiasów przy kolizji tylko, gdy pomaga (17 mm z lewej → bez przycisku; 564 z prawej → „na lewą — zostaje 17 mm”), przełącznik „zawias” przy kolumnie z jednymi drzwiami |
| `odsuniecie` | odsunięcie od ściany: głębokość blatu, wysięg przed drzwi (10 / <10 uwaga / >30 ostrzeżenie), krzywa ściana w widoku z boku, róg przesunięty o odstęp, wyjątek jednej szafki |
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
# standalone-local.html z standalone.html (podmiana 4 adresów CDN):
python3 -c "s=open('standalone.html').read()
for a,b in [('https://cdn.tailwindcss.com','cdn/tailwind.js'),('https://unpkg.com/react@18/umd/react.development.js','cdn/react.js'),('https://unpkg.com/react-dom@18/umd/react-dom.development.js','cdn/react-dom.js'),('https://unpkg.com/@babel/standalone/babel.min.js','cdn/babel.min.js')]: s=s.replace(a,b)
open('testy/standalone-local.html','w').write(s)"
# pełny przebieg: wszystkie suity szybko (po 5 naraz, ok. 3 min), potem tylko te
# z błędem jeszcze raz wolno (PW_WOLNO=1). Wynik: „WSZYSTKO ZIELONE” albo dla
# każdej padającej suity „PRAWDZIWY BLAD” (pada też wolno — naprawić) lub
# „FALSZYWY ALARM” (wolno przechodzi — poprawić czekanie w pw.mjs). Kod wyjścia 1
# tylko przy prawdziwym błędzie. Logi: <katalog>/<suita>.log i .wolno.log.
cd testy && bash pelny.sh /tmp/pelny            # albo: bash pelny.sh /tmp/p narozn2 zoom
```
