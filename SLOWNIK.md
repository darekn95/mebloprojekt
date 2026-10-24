# Słownik MebloProjektu — etykieta w aplikacji ↔ nazwa w kodzie

Ściąga, żeby nie przeszukiwać całego `szafki.jsx` za każdym razem, gdy w
rozmowie pada nazwa z interfejsu. Kolumna „w kodzie" to ścieżka w danych
szafki albo ciągu — po niej szuka się w pliku.

**Zasada: zmieniasz etykietę, pole albo nazwę formatki — dopisz tu wiersz.**
Ten plik jest wart tyle, ile jego aktualność. `AI_NOTES.md` mówi *dlaczego*
coś jest zrobione tak, a nie inaczej; ten plik mówi *jak się to nazywa*;
`opisy/` (spis `opisy/SPIS.md`) mówi *jak to działa* — zasady i liczby jednego obszaru
(szuflady, klapy, …) w kilku akapitach.

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
| **łyżwa** | blat cięty na 45° w rogu | `rt.skos0`, `rt.skos1`; głębokość drugiego blatu (do skosu w 3D) `rt.skosGl0`, `rt.skosGl1` |

---

## 2. Etykieta w aplikacji → ścieżka w danych

### Pasek „Pomieszczenia” (`project.rooms[]`)

| Etykieta | W kodzie |
|---|---|
| „Pomieszczenia”, kafelek pomieszczenia | `project.rooms = [{ id: "p1", name }]`; ciąg `run.roomId`, szafka wolnostojąca `item.roomId` (szafka w ciągu należy do pomieszczenia ciągu — `roomOfItem`) |
| ogladane pomieszczenie | `activeRoomOf(project)` = pomieszczenie aktywnej szafki; `wejdzDoPokoju` (puste dostaje szafkę startową) |
| „▼ Pomieszczenia” (zwijanie paska) | `pokojeZwiniete`, pamięć przeglądarki `mp-pokoje-zwiniete`; zwinięty pokazuje „N pomieszczeń, aktywne: „…”” i kropkę uwag innych pomieszczeń |
| „+ pomieszczenie” | `makeRoom` → „Pomieszczenie N” |
| nazwa szafki — drugie kliknięcie w aktywną szafkę na pasku szafek (pole „Nazwa szafki”; Enter zapisuje, Esc wraca) | `cab.name`, stan edycji `nazwaSzafki` w `App`; w górnym pasku zostaje tylko nazwa projektu `project.name` |
| ✎ (zmień nazwę), × (usuń) | `renameRoom`; `usunPokoj(p, id, cel)` — okno „Usunąć …?”: „Przenieś i usuń pomieszczenie” / „Usuń razem z szafkami” |
| „Przenieś szafkę / zabudowę … do…” | `przeniesDoPokoju` — ciąg idzie z całą grupą (`grupaCiagow`: róg + piętro), „Ściana N” zajęta w celu dostaje wolny numer (`przeniesCiagi`) |
| „Zamówienie: Cały projekt / To pomieszczenie” | `zakresZam` (domyślnie „projekt”), `projZam = projektPomieszczenia(project, pokoj)` — formatki, produkty, rozkrój i wycena |
| „Łazienka: 1 ostrzeżenie” w nagłówku, kropka przy kafelku | `innePokojeNotes` (uwagi szafek z innych pomieszczeń) |

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
| Wstawka w rogu (Struktura wnętrza szafki przy rogu) | pole `data-el="wstawka-szafki"` w szafce stojącej bokiem przy rogu (`n.pair.przyRogu`, w App `rogWstawki`); dane dalej w `run.corner.wstawka = { typ: "plaska" \| "szeroka", w, mocowanie }` ciągu z narożnikiem (`WSTAWKA_W` = 60); `mocowanie` tylko szerokiej (`WSTAWKA_MOCOWANIA`, `data-el="wstawka-mocowanie"`): `trojkaty` — w licu drzwi, trójkąty do boków sąsiadów; `konf` — w linii korpusu (`odLica` = grubość frontu), konfirmaty przez bok w krawędź wstawki; `listwa` — w licu drzwi + „Listwa wstawki” z płyty korpusu za nią, konfirmaty przez bok w krawędź listwy, wkręty listwa→wstawka; konfirmaty `wstawkaKonfIle(H)` co `WSTAWKA_KONF_CO` = 300 mm, min. 2; w karcie ciągu tylko wskazówka `data-el="wstawka-gdzie"`; tylko bez szafki w L; w układzie `n.pair.wstawka` i `n.wstawki[]` ciągu, który ustępuje (u0/u1, v0/v1, z0/z1, `listwa.v0/v1`, `liniaKorpusu`); formatka i okucia `wstawkaParts`; odsuwa ciąg o grubość frontu (płaska) albo `w` (szeroka) |
| Wysokość i głębokość szafek (Wymiary i montaż) | `run.H`, `run.D` |
| Cokół ciągu / Cokół pod szafkami / Podział cokołu | `run.plinth`, `runPlinth`, `runPlinthPanels` |
| Blat roboczy / Blat ciągu / Podział blatu | `run.worktop`, `runTop`, `worktopSpans`, `runTopPanels` |
| Blat w narożniku (przechodzi / dojeżdża / łyżwa) | `run.corner.top`, `run.corner.cut`; `projectLayout` → `topSpan.przez0/przez1` (czyj blat idzie przez róg); `runTop` skraca dojeżdżający do głębokości przechodzącego (`rt.depth`, z docinką arkusza) |
| Złącze do blatów śrubowe (produkt) | `runTopZlacza(project, run)` w `projectParts` → okucia pozycji „Blat — ciąg”: łączenia kawałków blatu w ciągu (`rt.lens.length − 1`) i róg — liczy go ciąg, który trzyma róg (`run.corner`), gdy oba blaty robocze (`matKey` „worktop”); na styk `zlaczNaStyk(gl)`: 2 szt. przy blacie 600, 3 przy głębszym (arkusz 1200); styk i łyżwa; `ZLACZE_BLATU`, cena `DEFAULT_HW_PRICES` 9 zł |
| `kawalkiBlatu(rt)`, `rt.wysokie` | kawałki blatu ciągu do zamówienia: podział na długość arkusza minus miejsca słupków (wyższych szafek); `b1`/`b2` wolne końce, `lacz` — styki kawałek-kawałek (złącza) |
| `geoOb.maskWalls` (`buildEnclosure` → `sciany`) | ścianki zabudowy przeszkody z położeniem `{x0, x1, z0, z1 (od tyłu), y0, y1}` — te same co formatki; 3D szafki i zabudowy rysuje je (tag „zabudowa”) |
| `KONF_DWA_OD` = 132, `pole:<nazwa>` | konfirmaty: krótszy styk — jeden w połowie; ostrzeżenie „Szafka płytka” z przyciskiem „Popraw głębokość” → `mp-karta` {id: "korpus"} rozwija kartę i ustawia kursor w `[data-el="pole-glebokosc"]` |
| klucz ceny okucia | `okucie:<nazwa>|<wariant>` (+ opis produktu dla pozycji bez `use`) — bez ilości; `priceOf` przy braku bierze jedyną cenę zapisaną pod starym kluczem `okucie:<nazwa>|…` |
| blat roboczy — arkusz i obrót | `arkuszBlatu(p, mat)` (formatka niesie `arkusz`: blat ciągu z `rt.arkusz`, własny blat szafki z `worktopDepth(mat)`), `etykietaBlatu` (arkusz 1200 → „… · arkusz 1200”, `bezArkusza` tam, gdzie format stoi obok), `wierszBlatu` (`rotatable: false`, `sheet`) — rozkrój ekranowy szafki i projektu, PDF; `buildCutPlan` grupuje po etykiecie i formacie; `boardDefault` cena z formatu w etykiecie |
| `NOZKA_MIN` = 50, `nozki:<mm>` | najniższa nóżka regulowana (GTV MLA-50, 50–75 mm); poniżej — błąd z „Ustaw 50 mm / Ustaw 100 mm” (`runFix` → `cab.legs.height`); specyfikacja nóżki z `legH` |
| `kolki:<od przodu>:<od tyłu>` | błąd „Kołki półek … nie mieszczą się na półce” (przód + tył ≥ głębokość najpłytszej półki albo ujemne) → „Ustaw 50 / 50 mm” (na płytkiej półce mniej; `cab.shelfPin`, domyślnie 50 / 50, stare 37 / 37 → 50 / 50 przy wczytaniu, `version` 6) |
| `maZawieszki(cab)` / `naListwie(cab)`, `zawieszki:<listwa\|haczyki>` | `runRail` — listwa tylko gdy choć jedna szafka ciągu wisi na listwie; `runCabMsgs(run, c, inne)` — szafka bez zawieszek przy innych na listwie: ostrzeżenie „Zawieszki na listwie / na haczykach” (`hangers: "auto"`, `hangerMode`) |
| `wspgl:<poziom>:<kolumna>:<mm>` | przycisk „Wspornik na … mm głębokości” przy błędzie za głębokiego wspornika fixu (do pleców za fixem: `dividerDepth − z0`; audyt GPT N41) |
| `rawCol.shelfMount` / `mocowanieKolumny(cab, rawCol)` / `c.shelfMount` | mocowanie półek kolumny: własne (`pins` / `confirmat` / `trojkaty`) albo jak szafka — pole „mocowanie” w kolumnie; plan wierceń, okucia i kołki na rysunkach per kolumna (N45) |
| `polkimont:<poziom>:<kolumna>:<trojkaty\|pins>` / `przegrtr:<poziom>:<kolumna>` / `rawCol.divDolMount` | przyciski przy błędzie krzyżowych konfirmatów: półki kolumny na trójkątach / kołkach; dół przegrody (z prawej kolumny) na trójkątach — pole „przegroda z prawej: dół na trójkątach” |
| `fixdel:<poziom>:<kolumna>` / `fixsup:<poziom>:<kolumna>[:<mm>]` | „Usuń element stały” / „Dobuduj wspornik pionowy” (4. pole — głębokość, przy szufladach długość NL); błąd fixu w kolumnie szuflad bez wspornika (N42) |
| „→ poziom” (poziom zamiast półki) / „klapy zamiast drzwi” pod polem drzwi (`polkiNaPoziomy(i, j, ks, naKlapy)`, `daSiePodzielic(lv)`, `data-el="polki-na-klapy"`) | półka kolumny `j` staje się przelotową granicą poziomów — dzieli cały poziom, inne kolumny dostają tyle półek, ile wypadło w paśmie; nie ma go w poziomie z kolumną szuflad; klapy (tylko jedna kolumna) — każda półka → nowy poziom, w każdym klapa do góry (komentarze 2026-10-17) |
| „Usuń poziom” / „Usuń kolumnę” (`removeLevel(i)`, `removeCol(i, j)`, `zwolnijMiejsce(lista, i, pole)`) | gdy wszystkie pozostałe poziomy (kolumny) mają wpisaną wysokość (szerokość), sąsiad usuniętego wraca na auto i bierze zwolnione miejsce — kolumna szuflad sięga boku (prowadnice), para wzmocnień spod blatu zostaje na górze (zgłoszenie 2026-10-21) |
| „Szuflady” w kolumnie (`setColKind(i, j, v)`, `POLA_KLAPY`) | zmiana z drzwi kasuje ustawienia klapy (`klapa`, `klapaUchwyt`, `silowniki`, `silaN`, `katKlapy`, `podnosnikStrona`; `migrateCab` czyści je też w starych projektach); nowe szuflady — system z `systemKontekstu`, liczba 3, 2 albo 1: najwięcej, przy których szafka ma najmniej błędów (próbne `computeGeo`) |
| `podswietl` / `kluczeFormatki(nazwa)` / `PODSWIETL` (`data-el="formatka-nazwa"`, `data-el="podswietlona"`) | klik w nazwę formatki w „Formatki do zamówienia” — widok 3D szafki, płyty tej formatki na niebiesko; drugi klik zdejmuje (komentarz 2026-10-17) |
| `uwagiRozkroju(g)` / `PROG_ODPADU` (15 %) / `BLAT_BRAKUJE` (200 mm), `data-el="rozkroj-odpad"` | ostrzeżenia w „Rozkrój”: blat na arkusz za dużo, a brakuje do 200 mm; arkusz płyty wykorzystany poniżej 15 % (komentarze 2026-10-17) |
| `SplitPicker` — `data-el="podzial-cokół"` / `"podzial-blat"` | podział cokołu i blatu zwinięty za polem wyboru, z podsumowaniem cięć; rozwinięty sam przy ręcznych cięciach (komentarz 2026-10-17) |
| „Rozwiąż ciąg” przy ciągu z górnym (`rozwiazPyt`, `data-el="rozwiaz-ostrzezenie"`) | ostrzeżenie z „Rozwiąż mimo to / Anuluj”; `removeRun` zamienia górny na samodzielny ciąg wiszący (`mountY` = obecne `tierMountY`, `wallW` dolnego; audyt GPT N47) |
| `geo.plecyKolumn`, `plecyBryly(cab, geo)` | plecy ustawione w kolumnach (`col.backMode`): lista płyt `{x0, x1, y0, y1, mode, grub}` z `computeGeo` — formatki i bryła 3D (szafka, zabudowa) z tej samej listy; `plecyBryla` (rysunki 2D) — ich obrys |
| `wariant` (okucie) | cecha handlowa w kluczu `scalOkucia` — nóżka (`nozkaWariant`: kształt, wysokość, kolor), zawias nakładany / wpuszczany; inny wariant = osobny wiersz zbiorczego zamówienia |
| `sztuk` / `specSzt` (lustro) | liczba luster i opis z `{n}` — sumowane przy scalaniu; powierzchnia dokładna, zaokrąglenie dopiero w `hwQty` |
| `rola: "cokol" / "blat"` (formatka) | automatyczny cokół / blat szafki — tylko je zastępuje wspólny cokół / blat ciągu (`projectParts`, `formatkiSzafki`); dodatkowa formatka o tej nazwie zostaje |
| PDF rozkrój — „Arkusz (do rozkroju)” | `ReportCutPlan`: nagłówek strony tylko z rzazem (`KERF`), format arkusza każdego materiału `arkuszOpis(g)` (`g.arkusz` do zamówienia, `g.sheetW/sheetH` po okrawaniu) w tabeli i nad rysunkami; każdy arkusz na własnej stronie (`section.rp-page.rp-arkusz`, `data-el="rozkroj-material"`), obrócony o 90° (`.rp-obrot` w `PRINT_CSS`) — `SheetPlan` z `maxH="168mm"` (na ekranie domyślnie 420) |
| PDF — rysunki szafki (4 widoki, napisy w druku) | `ReportSheet` → `box()` z klasą `rp-widok`, widoki z `druk={DRUK_WIDOK_MM}` (90 mm). Skala napisów `kz` z `drukKUkladu` (cel `DRUK_PISMO_MM` 2,6 mm, maks. `DRUK_K_MAX` 3) → `--k` na `<svg>`, CSS w `PRINT_CSS` (`.rp-widok svg text`: `scale(var(--k))` od zaczepienia; `wym-nad` / `wym-pod` w `DimH`). Układ w druku: `FrontView` → `uklad(kz)` (kolumny `kolumnaDruk`, długie opisy `kDlugie` / `DRUK_DLUGIE`, obrys z zasięgu napisów), `wyTop`/`wyBlat`/`padTop`, `legendyU` (`ulozLegendy`), `szerSzuflad` (szerokość wnętrza szuflad pod szafką), `xSzcz` (miejsce opisu szczeliny); `RearView` → `lewoDruk`, `opisyU`; `TopView` → `ukladT`, `podpisU`. Opis, który musi się zmieścić w płycie: `kNapisu`, drobne 16–18 → `kMaly`; `DimH`/`DimV` → `kd`. Na ekranie `kz = 1`. Test: `pdfczytelnosc` |
| dymek pola „zawiasy” | `ZAWIASY_ZASADA` — opis tabeli GTV i zasady klapy; zmieniasz progi `ZAWIASY_GTV` — popraw i jego |
| „Zawiasy przesunięte” (PDF) / „Dopisz do notatki montażowej” | `geo.zawiasyMontaz` (z `hingePositions(...).moved`, `co` = z czym kolizja) → linia na stronie szafki w `ReportSheet` (`data-el="notatka-zawiasy"`); przy ostrzeżeniu „zawias przesunięty” akcja `notatka:<tekst w encodeURIComponent>` → `runFix` dopisuje do `cab.note` (już dopisana — bez przycisku) |
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
| Montaż pleców / Szerokość / Głębokość / Luz | `cab.backGroove = { on, offset, depth, play, wreg }` — plecy „We frezie” to frez od tyłu na krawędzi boków, wieńca i dna (w UI zawsze „frez”; `wreg` to tylko znacznik migracji): „Szerokość” = `depth` (16 z 18 mm płyty), „Głębokość” = `offset` (3, w stronę drzwi — HDF zlicowany z tyłem), „Luz” = `play` na stronę; HDF W−6 × H−6. W geometrii `grDep`/`grOff`/`grPlay`; stare {16, 4} bez `wreg` migrują na {3, 16} (`migrateCab`) |
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
| siła (lista, `select data-el="klapa-sila"`) | `col.silaN` (puste = auto z tabeli: PD-G00 do góry, PD-ECGDL w dół); opcje `dobierzPodnosnik().opcje` (siła, udźwig, „za słaby”); za słaby — przyciski `silaauto:` („Zwiększ siłę do …”) i `klapa2:` („Dołóż drugi”, `col.silowniki` = 2, `geo.klapy[].dobor2`) |
| kąt 75° / 90° / 100° (klapa do góry) | `col.katKlapy` (puste = 90) |
| uchwyt klapy: na dole / na górze (`data-el="klapa-uchwyt"`) | `col.klapaUchwyt` (`"dol"` / `"gora"`, puste = wolna krawędź: klapa do góry — dół, w dół — góra); w geometrii `d.uchwytKrawedz`, rysunek `klapaUchwytY`, `uchwytObrys` (`data-el="uchwyt-klapy-dol|gora"`) |
| jeden podnośnik / amortyzator: na lewym / na prawym | `col.podnosnikStrona` (puste = lewa, `"right"`) — tylko przy jednym (`data-el="klapa-strona"`); `geo.klapy[].strona`, plan wierceń |
| uwaga „półka … stoi na drodze podnośnika” / przycisk „Dodatkowe cofnięcie półek N mm” | w `computeGeo` przy wierceniach klapy: półka w zasięgu podnośnika (płytka `KLAPA_PLYTKA_R`, mocowanie `KLAPA_MOC_ZAPAS`) bliżej frontu niż `KLAPA_POLKA_ZA_FRONTEM` (50); akcja `polkicof:<mm>` ustawia `cab.shelfExtraSetback` |
| „Zawias — półnakładany” w okuciach | `hingePol`, `polnakladany(naCzolo, grubPlyty)` w `computeGeo`: front na płycie z zawiasem ≤ pół grubości + 2 mm (przegroda, półka pod klapą); reszta „nakładany” |
| uchwyt / lustro | `col.handles[]`, `col.mirrors[]` — w wierszu okuć pod szerokością skrzydła (`data-el="drzwi-okucia"`): zawiasy, uchwyt, lustro |
| uchwyt: … mm, na boku / górze | `col.handleOuts[]` (puste = `cab.handleOut`, 20), `col.handlePos[]` (`"bok"` / `"gora"`); liczy `uchwytOut(d, cab)` i `uchwytObrys(d)` — rysunek z przodu (`data-el="uchwyt-bok|gora"`), 3D, rzut z góry, kontrola otwierania |
| własny luz między drzwiami | `col.gapBetween` |
| światło 1 / światło 2 … | `col.shelfTargets[]` |
| Wcięcie na palce zamiast uchwytu | `col.gripDepth` |
| tył (przy szufladzie) | `drawer.tallBack`, `drawer.backHeight` |
| system szuflady: V-BOX / DXS-3D (pierwsze pole wiersza, `select data-el="szuflada-system"`) | `drawer.system` (`"dxs"`; brak = V-BOX) — `systemSzuflady(d)`; zmiana: `setDrawerSystem` → `zmienSystemSzuflady` (bok i tył wracają na auto, reling i podniesiony tył zdjęte, NL spoza listy systemu → auto) |
| bok (DXS-3D, mm; `data-el="dxs-bok"`) | `drawer.h` — liczba (V-BOX: z listy `VBOX.heights`), `"auto"` = najwyższy z luzem `SZUFLADA_ZAPAS` pod tym, co wyżej |
| tył (DXS-3D, mm; `data-el="dxs-tyl"`) | `drawer.backHeight` (puste = bok − 10, góra równo z bokami) |
| NL szuflady / głębokość NL kolumny | `drawer.nl` / `col.nl` — lista z systemu (`nlSystemu`: V-BOX z 270, DXS-3D bez) |
| nowa szuflada („+ szuflada”, kolumna → „Szuflady”) | system z `systemKontekstu(project, idx, col)`: kolumna → szafka → ciąg → pomieszczenie → V-BOX |
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
| Nazwa uchwytu (karta produktów) / wystawanie uchwytu (przy drzwiach; domyślne 20 mm) | `cab.handleName`, `cab.handleOut` (pola globalnego od 2026-09-29 nie ma — jest `col.handleOuts[]` przy drzwiach) |

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
| `projectLayout(project)` | rozstawia ciągi w rzucie z góry, liczy rogi — **osobno w każdym pomieszczeniu** (`.pokoje` = Map pomieszczenie → układ, `.info` = wszystkie ciągi); kolizje otwierania biorą układ pomieszczenia |
| `plytaFrontu(cab)` | płyta frontów szafki: `"board"` przy „Fronty z tej samej płyty co korpus” (domyślnie), inaczej `"front"` — dla elementów poza `computeGeo` (wstawka w rogu, front ramienia, maskownice kątownika); w `computeGeo` robi to `P()` (`sameBoard`) |
| `frontRamienia(a, real)` / `sasiadRamienia(a)` | front ramienia szafki L: płyta i kolor frontów szafki sąsiedniej ściany stojącej przy ramieniu (inne fronty → z niej), inaczej szafki w rogu. Formatka niesie własną płytę w `zPlyty`, a listy czytają ją przez `plytaFormatki(p, mat)` |
| `szufladaDxs` (w `computeGeo`, kolumna szuflad) | szuflada DXS-3D: kreska prowadnicy (`rail.y0`), bok auto/ręcznie, NL z `DXS.nl` (wzmocnienie przy plecach skraca NL), tył, kontrole z przyciskami (`fixh`, `fixback`, `fixnl`), `dr.skrzynka` (`system: "dxs"`, `bokDl`, `bokT`, `szer` = SKW, `dno`, `tyl`), formatki (bok ×2, dno, tył), `dxsGroups` (komplety), `dxsKonf` (konfirmaty dna i tyłu przez boki — do wiersza konfirmatów korpusu) |
| `szufladaOdCzola(c, dr)` / `szufladaZGory(c, dr)` / `szerWnetrzaSzuflady(c, dr)` | prowadnice (V-BOX: pas 21 mm; DXS: 33 × 27 pod dnem) i boki skrzynki DXS do rysunków z przodu (szafka, ciąg) i z góry; światło szerokości szuflady (V-BOX c.w − 42, DXS SKW). Pion: `dr.bokOd`, `dr.dnoOd`, `dr.gora` (oba systemy) |
| `systemKontekstu` / `naSystemSzuflad` / `szufladyMsgs` | system nowej szuflady z kontekstu; wszystkie szuflady szafki na jeden system; uwaga ciągu „szuflady tej szafki są na X, a w ciągu / pomieszczeniu na Y” |
| `shelfColorOf(cab, mat)` | kolor płyty półek na rysunkach: półki, półka ramienia, kątownik w tylnym narożniku L, dno i tył szuflady |
| `projektPomieszczenia(project, roomId)` | wycinek projektu z jednym pomieszczeniem — listy „To pomieszczenie” i rozdziały PDF |
| `formatkiSzafki(geo, { bezCokolu, bezBlatu, arm })` | lista formatek jednej szafki — **ta sama** w karcie „Formatki do zamówienia” i na wydruku; cokół i blat wspólne dla ciągu wypadają (są w liście projektu), ramię szafki w L dochodzi (`cornerArmParts`) |
| `calyProjekt(project)` | czy pokazać „Formatki / Produkty całego projektu”, rozkrój całości i stronę projektu w PDF: 2+ szafki **albo** cokół/blat ciągu/ramię — przy jednej szafce w ciągu to jedyne miejsce, gdzie są blat i cokół |
| `audytBryly` | tylko dla testów: gdy strona ma `window.__audytBryl`, bryły 3D (szafka i zabudowa) dopisują tam wymiary; `testy/formatki.mjs` sprawdza, czy każda narysowana płyta jest w formatkach |
| `runLayout` / `runJoints` / `runPlinth` / `runTop` | układ ciągu, złącza między szafkami, wspólny cokół, wspólny blat. `runTop` zapamiętany przy obiekcie projektu i ciągu (`runTopCache`, liczy `runTopLiczy`) — jak przy `computeGeo`: wynik tylko do odczytu |
| „Podział blatu / cokołu” (pola styków + „własne cięcie”) | `run.topCuts` / `run.plinthCuts` (styki), `run.topCutsWlasne` / `run.plinthCutsWlasne` (mm od lewego końca) → `splitAtJoints(total, joints, want, max, wlasne)` |
| narożnik górnych ciągów (`runLayout`, `corner.gorny`) / `gornyPodRamie` | górny ciąg nie ma własnego narożnika; gdy przy rogu wisi szafka z ramieniem, para górnych dostaje narożnik jak dolna (w róg wjeżdża ten, w którym stoi szafka w L), ciąg kończący się w rogu dosuwa się do niego (`pair.dosuniety`, uwaga), a pusty górny ciąg za rogiem jest rysowany (leży na nim ramię). Bez szafki w L — stare odsunięcie o głębokość górnego (`dolny`) |
| „Ustawienie kątownika” A / B (karta szafki narożnej) | `cab.corner.post.typ` → `geo.postTyp`, `geo.postRects` | płyty wzmocnienia tylnego szafki w L w rzucie z góry (`x0..x1`, `v0..v1` od tyłu, `nazwa` bok/plecy) — jedno źródło dla rysunków, bryły i planu wierceń; B tylko przy wieńcu |
| półka „wycięty tylny róg W × D” | `col.shNotch`, `polkaCzesci` | przy wzmocnieniu B półka kolumny przy ramieniu ma wycięty tylny róg; w bryle i na rzucie dwie części |
| „Zawieszki przy wzmocnieniu B” / „Pod zawieszką ramienia” | `cab.corner.zawieszki` (ramie/korpus), `cab.corner.armHanger` (listwa/hak) → `geo.zawieszki` | liczba i położenie zawieszek (plan wierceń, okucia), odcinek listwy albo hak pod ramieniem w `cornerArmParts` |
| `projectParts(project)` | **jedyne** źródło formatek i okuć całego projektu (zestawienia, wycena, rozkrój) |
| `scalOkucia(lista)` | scala okucia do jednego wiersza na produkt, z rozpisanymi zastosowaniami (pole `use`) |
| `cornerArmParts(arm)` | formatki i okucia ramienia narożnika |
| `cornerBracket(arm)` | kątownik narożnika przy froncie: szerokość, luz, która płyta nachodzi |
| `armFrontPlan(arm)` | gdzie zaczyna się i jak szeroki jest front ramienia — jedno miejsce dla formatki i rysunków |
| `armPlan(arm)` / `bracketPlan` | wzmocnienia i kątownik ramienia w układzie „od naroża" |
| `legPlan(cab, W)` / `autoLegs(W)` | rozstaw i liczba nóżek |
| `armLegPlan(arm)` | nóżki ramienia narożnika jak w szafce tej długości (`legPlan`): przy rogu, pod końcem, od 900 mm na środku; `us` od rogu, `vs` od ściany — jedno źródło dla zamówienia, elewacji i bryły |
| `ulozSciany(solids, proj)` | kolejność rysowania i cieniowanie w obu widokach 3D (zabudowa i szafka) |
| `autoHinges(h, w, grub, szeroki)` / `zawiasyGtv` / `ZAWIASY_GTV` | liczba zawiasów na skrzydło wg tabeli GTV (katalog 2023 s. 68): większa z liczb z wysokości frontu (750 / 1500 / 2100 / 2500 mm) i jego wagi (`wagaFrontu`; 6 / 12 / 17 / 20 kg), front do 600 mm; `szeroki` (skrzydło szafki narożnej na zawiasie 165°) — 4,5 / 9 / 12,5 / 15 kg, front do 450 mm; `zawiasyGtv` zwraca też `kg` i `poza` (ponad tabelę: wysokość, waga albo szerokość) |
| `wagaLustra(w, h, mat)` / `GESTOSC_SZKLA` | masa lustra na froncie (szkło 2500 kg/m³, grubość z materiału lustra) — dodatek `dodatekKg` w `zawiasyGtv` / `autoHinges` i w masie klapy (audyt GPT N34) |
| `PROJEKT_WERSJA` / `cab.version` (5) | wersja zapisu projektu i szafki — prostowanie dawnych cen netto (`LEGACY_NET_PRICES`) i wzmocnień w `migrateCab` tylko dla zapisów starszych (audyt GPT N35) |
| `autoShelves(innerH, t)` | liczba półek przy automacie |
| `distribute` / `evenGapOptions` | podział pasma na fronty + propozycja luzu bez resztek |
| `bezWienca(cab, tf)` | zamiana wieńca na parę wzmocnień (szafka pod blatem) |
| `runPlinth(project, run)` | cokół ciągu: `total` (długość), `x0` (początek w układzie ciągu — w rogu może zaczynać się za szafką albo przed nią), `cuts`/`joints` w układzie ciągu. Róg na zakładkę: ciąg odsunięty przedłużony do lica cokołu sąsiada + jego grubość, ciąg wjeżdżający w róg kończy się na licu cokołu odsuniętego (ślepy róg) albo za wolnym licem szafki w L + 2 grubości (strona wg `arm.outerAtEnd`) |
| `jestParaPodBlat(r)` / `utrzymajPodBlat(cab, levels)` | rozpoznaje parę wzmocnień pod blat (płaskie z przodu + stojące z tyłu, `pos: "top"`) i przy każdej zmianie poziomów/kolumn (`editLevels`) trzyma ją tylko w kolumnach najwyższego poziomu |
| `c.support` (`computeGeo`) | wspornik pionowy fixu: `{ d, z0, side, y0, y1, h }` — `y0/y1` kończą się na wzmocnieniach w jego drodze (pod blatem), `z0` = grubość fixu, gdy fix jest wpuszczany; rysunki biorą `y1/h/z0` |
| wymiar „… z blatem” (widok z przodu) | wysokość od podłogi do wierzchu blatu ciągu nad szafką (`blatSzafki`), najdalej z lewej |
| `wysuwSzuflady(d)` | pełny wysuw V-BOX: NL szuflady — 3D szafki i zabudowy (jak `wysuwHit`) |
| `blatNadSzafka(project, layout, index, arm)` / `blatSzafki` | odcinek blatu ciągu nad aktywną szafką (`korpus`, `ramie`, `kolor`, `th`, `roboczy`) — widok z góry, z przodu, z boku, z tyłu i 3D samej szafki (`data-el="blat"`, w 3D tag `blat`); przełącznik „Ukryj blat” |
| `frezY0` / `frezY1` (`computeGeo`) | dół i góra HDF we frezie: frez tylko w płytach, które są (bez wieńca / pod blatem na bokach — 1 mm pod górą; bez dna — 1 mm nad dołem); formatka, `plecyBryla`, widok z tyłu |
| `front-bok` / `front-gora` (`data-el`) | fronty w widoku z boku / z góry — każdy osobno, łączone tylko przy styku, żeby było widać szczeliny |
| `tW` (`computeGeo`) | grubość górnej płyty w H: wieniec — płyta (18), blat na bokach — blat (`tTop`, roboczy 38); boki, wnętrze, rysunki i 3D liczą od niej |
| `wspornikTrojkaty(h)` / `WSPORNIK_TROJKAT_CO` | wspornik pionowy fixu bez płyty nad sobą: trójkąty do fixa co 300 mm, min. 2 (+1 do dna); `supportParts[].nad/pod/trojkatyFix` |
| `SZAFKA_KUCHENNA_D` | 560 — głębokość „+ szafka” w pustym ciągu dolnym, gdy w pomieszczeniu nie ma innego ciągu dolnego z głębokością |
| `sufitPrzod` (`computeGeo`, szuflady) | to, co jest nad szufladą z przodu: następna szuflada albo góra światła/płaskie wzmocnienie; bok „auto” = najwyższy, który się pod nim mieści |
| `migrateCab(cab, mat)` / `migrateRun` / `migrateCorner` | podnoszenie starych projektów do bieżącego formatu |
| `splitAtJoints` | dzieli wspólny cokół/blat na odcinki |
| `buildCutPlan` / `packSheets` / `nestPass` | rozkrój na arkusze |
| `swingBodies` / `openingMsgs` | kontrola otwierania: skrzydła (`swingHit` — czy wchodzi; `swingKat` — kąt pierwszego styku; `swingStop` — przeszkoda, w którą uderza najwcześniej; komunikat „otworzy się tylko do ok. N°”), szuflady (`wysuwHit`), klapy (`klapaHit`, kąt co 1°) przeciw korpusom, frontom, uchwytom, wstawkom, ramionom i blatowi |
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
| `skrzynkaBryly(d, t, zFront)` | skrzynka szuflady w 3D (boki metalowe od `bokOd`, dno i tył od `tylOd` nad dołem prowadnicy) z `dr.skrzynka` (te same wymiary co formatki); zaczyna się tuż za frontem; na widoku z boku kontur `data-el="skrzynka"` |
| `okuciaSzafki(geo, { bezListwy, arm, wstawki })` | okucia jednej szafki — ekran i PDF: bez listwy wspólnej ciągu, z okuciami ramienia szafki w L i wstawki (jak `formatkiSzafki`) |
| wymiar „N z wstawką” | rzut z góry ciągu/zabudowy: wstawka jako odcinek w łańcuchu wymiarów i wymiar całości z nią (`data-el="wymiar-wstawki"`) |
| `wstawkiSzafki(wstawki, geo)` | wstawka w rogu w układzie samej szafki (lewy bok, gdy szafka zaczyna ciąg od rogu, inaczej prawy) — dla `FrontView`, `TopView`, `SideView` (bok od strony wstawki), `RearView`, `Scene3D` i arkusza PDF; `data-el="wstawka"` |
| `KlapaElewacja` | klapa na widoku z przodu (szafka i ciąg): trójkąt z wierzchołkiem przy krawędzi zawiasów, uchwyt poziomy przy wolnej; otwarta — pasek frontu przy zawiasach. `data-el="klapa"` |
| `rotAboutX` / `klapaObrot` / `klapaUchwytY` | klapa w bryle 3D: obrót wokół krawędzi zawiasów (do góry +, w dół −, najwyżej 90°), uchwyt przy wolnej krawędzi |
| `TopHardware` | okucia w widoku z góry (szafka i zabudowa, pod „Pokaż okucia”): uchwyty przed frontem, zawiasy przy boku od frontu, nóżki przerywane; `data-el="okucia-gora"` |
| `worktopMsgs` / `runCornerMsgs` / `cornerPairMsgs` / `tierMsgs` | uwagi na poziomie ciągu i narożnika |
| `hwDefaultPrice(h)` | cena okucia — klucz to `h.pk` albo `h.name` |
| „Pokaż rysunek” (górny pasek) | przewija do karty `Card id="rysunek"` (`scrollMarginTop` pod przyklejony pasek) — przycisk roboczy; w niskim oknie (`niskieOkno`) prosto do samego rysunku (`svg`) |
| górny pasek (`header data-el="naglowek"`) przyklejony / nie | `przyklejony` = wysokość paska ≤ `NAGLOWEK_MAX` (0,4) wysokości okna (`wysNaglowka` z `ResizeObserver`); inaczej przewija się ze stroną (audyt GPT U2) |
| „Ciągi i szafki” — zwijanie paska (`data-el="pasek-ciagow"`, lista `pasek-ciagow-lista`) | `pasekZwiniety` (pamięta `localStorage` „mp-pasek-zwiniety”); w oknie niższym niż `NISKIE_OKNO` (640 px) — `pasekNisko`, domyślnie zwinięty, kliknięcie bez zapamiętywania; razem `pasekZw` |
| widok „Z tyłu”: podpisy półek, półek przelotowych i przegród (`data-el="tyl-polka"`, `tyl-polka-przelotowa`, `tyl-przegroda`) | wysokość od dołu korpusu: półka — spód (`sh.y`, jak w planie wierceń), przegroda — od–do (`d.y0`, `d.y1`), podpis w największej przerwie między półkami |
| zwijanie pasków przy przewijaniu w dół | `autoPokoje`, `autoPasek`, `zwinPrzyPrzewijaniu()`; widok: `pokojeWidokZw`, `pasekWidokZw`; ręcznie rozwinięty — `recznie.current` + `RECZNIE_ROZWINIETY_MS` (60 s); powrót na górze (`PRZEWIN_GORA`); przyciski `data-el="pasek-pokoi"` / `"pasek-ciagow"` (`przelaczPokoje`, `przelaczPasek`); w testach wyłączone (`window.__mpBezZwijania`, `testy/pw.mjs`) |
| nazwa ściany na pasku ciągów (`data-el="nazwa-sciany"`, pole `nazwa-sciany-pole`) | `nazwaSciany` ({ wiersz, stara }), `zmienNazweSciany(id, name)` — nazwa ciągu dolnego (`grp.sciana`) i górnego o tej samej nazwie |
| „+ nowy ciąg” / „× usuń ciąg” (pasek ciągów) | `otworzKreator` / `deleteRun(id)` |
| „+ z szablonu…” (`data-el="z-szablonu"`) | pole szerokości napisu (7,5 rem), rozwinięta lista na najdłuższą pozycję; `TEMPLATES` |
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
| `MIN_DOCIECIE` | 30 | najwęższa formatka do ręcznego docięcia (2026-10-21): węższa — błąd; 30–60 — ostrzeżenie (zamawiana 60, docinana ręcznie) |
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
| `CORNER_LG_W` / `CORNER_LG_ARM` | 650 / 350 | szablon „Górna narożna L” (`naroznikLgorny`, 300 w głąb): oba fronty ponad 250 mm; dołożony w górnym ciągu staje przy rogu i zakłada górny ciąg drugiej ściany |
| `SHEET_W` × `SHEET_H` | 2800 × 2100 | arkusz płyty |
| `USABLE_W` × `USABLE_H` | 2761,2 × 2061,2 | po okrawaniu |
| `KERF` | 3 | rzaz piły |
| `WORKTOP_LEN` | 4100 | długość pasa blatu |
| `WORKTOP_DEPTHS` / `WORKTOP_PRICES` | 600, 1200 / 563,99, 1128,22 | głębokości i ceny blatu brutto (obie z faktur użytkownika) |
| `KONF_OD_KRAWEDZI` / `konfirmatyNaStyk` / `konfirmatyPoz` | 50 mm / co 200, min. 2 | konfirmaty: liczba na styk (okucia i plan wierceń) i ich położenia od przedniej krawędzi |
| `rt.przed` | ile przed korpus wychodzi luz przy zawiasach i front (0 przy frontach wpuszczanych) — głębokość blatu ciągu i uwagi o wysięgu (audyt GPT N48) |
| Plan wierceń: „podnośnik klapy” / „amortyzator klapy” (`PODNOSNIK_H`, `PODNOSNIK_L`, `AMORTYZATOR_H`, `AMORTYZATOR_L`, `KLAPA_PLYTKA_OD_KRAWEDZI`, `KLAPA_MOC_OD_BOKU`, `KLAPA_MOC_ROZSTAW`) | w `computeGeo`, wiercenia klapy: płytka na boku kolumny (bok, przegroda, wspornik) i mocowanie na klapie („Klapa” / „Klapa — kolumna N”, od dołu klapy); wiersz tabeli H wg nałożenia klapy na płytę z zawiasami; jeden podnośnik — lewa strona |
| Sufit w kontroli otwierania (`swingBodies`, bryła `co: "sufit"`) | wysokość pomieszczenia z ciągu górnego tej ściany (`run.ceiling`); przeszkoda dla klapy do góry otwieranej ponad 90° |
| uwaga „blat … leży na N mm, a w tym pomieszczeniu …” / przyciski „Wyrównaj cokołem i nóżkami”, „Wyrównaj wysokością szafek” | `worktopMsgs` (ciągi pomieszczenia poza grupą rogu, `grupaCiagow`, `runsInRoom`), `wyrownajBlatAkcje(run, rt, lvl, cel)` → akcja `blatwys:<ciąg>:<cokol|h>:<różnica>:<nowa wartość>` (runFix: szafki `lvl.pod` + ciąg) |
| `wierzchBlatu(run, rt)` / `blatyRoznaWys` | wierzch blatu nad podłogą (montaż ciągu + lico + grubość); złącza w rogu tylko przy tej samej wysokości, inaczej ostrzeżenie w `worktopMsgs` (N66) |
| `plytaSkos` (Assembly3D) / `wysun` / `poPlace` | blat na łyżwę ścięty w 3D (N65); wysunięcie szafki z lica w 3D zabudowy (N62); front ramienia „Skręcone 90°” obracany wokół zawiasu frontu korpusu (N54) |
| PDF „Wiercenia” (kartka szafki) | `geo.drillPlan` + `wierceniaDodatkowe(arm, wstawki)` | plan wierceń korpusu (`computeGeo`) i dokładka: „Bok ramienia” szafki w L (konfirmaty dna/wieńca ramienia, kołki półek ramienia, zawiasy frontu ramienia), „Fix ramienia” i „Wstawka w rogu” (trójkąty); wiersz bez wysokości (frez pod HDF) ma „—” |
| `KOLEK_PRZESUN` | 10 mm | kołki / trójkąty po drugiej stronie przegrody, gdy półki na tej samej wysokości: krok przesunięcia i najmniejszy odstęp otworów (`rozsun` w `computeGeo`: do środka albo — na wąskiej półce — na zewnątrz, potem drugi kierunek, w tył / w przód, 20 mm) |
| „Zostaw N zawiasy” | `rawCol.hingesOk[skrzydło]` = przyjęta liczba (akcja `zawiasyzostaw:<poziom>:<kolumna>:<skrzydło>:<ile>`) — ostrzeżenie GTV przechodzi w informację „zostawione celowo” |
| „To słupek — wyjątek w ciągu” | `cab.slupek` (akcja `slupek:1`, cofnięcie `slupek:0`) — `runCabMsgs`: informacja zamiast ostrzeżenia o wysokości; `setRunShared` nie zmienia mu `H` |
| `zWiencem(cab, joints)` / `bezParyPodBlat` / `maParePodBlat` | odwrotność `bezWienca`: wieniec wraca, para wzmocnień pod blat (`jestParaPodBlat`) znika — przy włączeniu wieńca w „Złączach korpusu” i z przycisku `wieniec` („Wieniec zamiast wzmocnień”, `runCabMsgs`: ciąg bez blatu roboczego) |
| `KOLEK_R` / `KONF_R` / `OTW_SCIANKA` | 2,5 / 3,5 / 5 mm | promienie otworów w przegrodzie (kołek ⌀5, konfirmat ⌀7) i najmniejsza ścianka między otworami z obu stron — `rozsun` sprawdza odległość środków w płaszczyźnie przegrody (`otworySasiada`); `polkimont:<poziom>:<kolumna>:<pins\|trojkaty\|confirmat>` — „Półki kolumny N na kołkach / trójkątach / konfirmatach” |
| `POLKA_WASKA` | 300 mm | półka do tej głębokości: kołki drugiej strony przegrody najpierw na zewnątrz (50 → 40), głębsza — do środka |
| `blatSzafkiKlucz({ it, geo })` | płyta własnego blatu szafki (rodzaj, kolor, grubość, nazwa) — `runTop` łączy w blat ciągu tylko te same; `rt.zWlasnych` — blat ciągu z własnych blatów (3D zabudowy go nie rysuje, rysują szafki); różne — informacja w `worktopMsgs` |
| `geoCut.maskWalls` / `geoOb.maskWalls` | ścianki zabudowy wycięcia / elementu z `buildEnclosure` (x, y, z od tyłu, grubość płyty półek `ts`) — rzut z góry (`ScianyZabudowyTop`), 3D szafki |
| `k.plytkaPoza` | klapa, której płytka podnośnika / amortyzatora wypada poza płytą poziomu — błąd przy planie wierceń, bez ostrzeżenia o 290 mm |
| „Cofnięcie pleców” (karta Korpus, płyta wewnątrz) | `cab.backRecess` (mm, domyślnie 0) → `geo.backRecess`, `backIntrusion` = płyta + cofnięcie; bryła i rzuty pleców (`plecyBryla`, `py`); listwa w szafce `wewnatrz` (szerokość pleców − 2 × `LISTWA_OD_PLECOW`) |
| `LISTWA_SKROT` / `LISTWA_OD_PLECOW` | 10 / 5 mm | listwa krótsza najwyżej o 10 mm, gdy `listwaZakup` kupi przez to mniej (kawałek `min`); listwa za plecami cofniętymi po 5 mm od pleców z każdej strony |
| `runRail(project, run)` | `{ odcinki: [{ od, do, len }], len }` — listwa ciągu od pierwszej do ostatniej szafki na listwie, przerwana szafką z plecami cofniętymi; pozycje „Listwa — ciąg” w `projectParts`; szafki ciągu zostawiają tylko listwę `wewnatrz` |
| `KOLEK_OD_KRAWEDZI` | 20 mm | przesunięty otwór kołka / trójkąta zostaje co najmniej tyle od krawędzi półki (audyt GPT N75, użytkownik 2026-10-24) |
| `LISTWA_ODCINKI` | 1000, 2000 mm | odcinki listwy montażowej w sklepie; `listwaZakup(kawalki)` dobiera zakup (najmniej metrów, potem najmniej cięć), `listwaWiersz` — wiersz zamówienia „kupić … / potrzeba / odpad / cięcie” (w `scalOkucia` i `okuciaSzafki`; kawałki z `odcinek` i `gdzie`) |
| `DEFAULT_PRICES.obrzezeBlat` / `.oklejanieBlat` | 6,68 / 11,81 zł | obrzeże ABS 43 × 2 na końce blatu roboczego (za mb) i usługa „oklejanie PCV > 23 mm” (za rozpoczęty mb); końce blatu wolne = `rt.wolny0/wolny1` |
| `ROZKROJ_ZWLOKA` / `ROZKROJ_ZWLOKA_DUZY` / `ROZKROJ_DUZY` / `autoPlan` / `rozkrojKlucz` | 1000 ms / 5000 ms / 40 szafek | rozkrój liczy się sam tyle po ostatniej zmianie listy formatek (z płytą i kolorem); wycena bierze arkusze z `autoPlan`, a karta „Rozkrój na płycie” (`pokazPlan` = `autoPlan`) jest cały czas — bez przycisków „Pokaż rozkrój” i „Rozkrój na płycie” (2026-09-30); zakres = zakres zamówienia |
| `OBRZEZE_ZAPAS` | 90 mm | zapas okleiny na każdy oklejany bok (oklejarka wypuszcza ją z przodu i z tyłu) — doliczany do materiału „Obrzeże 22 × 2 mm” / „Obrzeże ABS … — blat” (do 1 mm, `qtyFmt` do 3 miejsc) i do usługi oklejania (od okleiny z zapasem, w górę do metra) |
| `ZAWIESZKA_MODEL` / `ZAWIESZKA_OD_PLECOW` / `ZAWIESZKA_WKRETY` / `zawieszkaNote` | ZK-ZAW-R0-10 / 10 mm / 2 | zawieszka z karty w `instrukcje/` (57,2 × 37,5 × 17,4, otwory ⌀4,1 co 32 mm): w planie wierceń bez wiercenia, górna krawędź pod wieńcem, 1 cm od pleców; 2 wkręty 4 × 30 na zawieszkę w „Wkręt 4 × 30” |
| `ZAWIESZKA_SZEROKA` / `geo.zawieszki.naPrzegrodach` | 900 mm | od tej szerokości zawieszka także na przegrodzie pionowej górnego poziomu — po jednej na przegrodę, najwyżej dwie (przy 3+ skrajne) |
| „Półki w kolumnach”: Kołki / Konfirmaty / Trójkąty meblowe | `cab.shelfMount` pins/confirmat/trojkaty → `mocowaniePolek(cab)` | plan wierceń (kołek półki / konfirmat — półka / trójkąt meblowy), okucia, rysowanie kołków tylko przy „pins”; ramię szafki w L tak samo |
| `WORKTOP_OVERHANG` / `WORKTOP_MAX_OVERHANG` | 10 / 30 | wysięg blatu przed drzwi: standard / granica, ponad którą ostrzeżenie i docinanie |
| `HINGE_PLAY` | 2 | luz między korpusem a drzwiami przy zawiasach — tylko do głębokości blatu, nie do rysunków |
| `SCIANA_GR` / `ScianaDefs` | 100 | ściana na rysunkach: pas 100 mm z szarym kreskowaniem (`url(#sciana-kreski)`) — rzut z góry (z nazwą ściany i ciągu górnego) i widok z boku; zasięg w rzucie liczy `scianaZasieg` (róg: do narożnika muru, wolny koniec: koniec ciągu albo „Długość ściany”); przełącznik „Ukryj / Pokaż ścianę” (`showWall`) |
| `BACK_CLEAR` | 20 | luz nad podniesionym tyłem szuflady (tylko podniesionym — zwykły tył ma górę równo z bokami i mieści się tam, gdzie skrzynka). Sufit nad najwyższą szufladą: góra światła albo płaskie wzmocnienie przy licu (szafka pod blatem); boki skrzynki muszą się pod nim zmieścić (błąd z przyciskiem `fixh`). Brak miejsca na podniesienie → ostrzeżenie z przyciskami `fixh` (niższy bok, gdy da wyższy tył) i `tylstd` („Wyłącz podniesiony tył”) |
| `DXS` / `dxsBokOd` | — | Sevroll DXS-3D Synchro (katalog 2026 s. 110–113; ustalenia w BLEDY.md „Ustalone”): `nl` 250–600 co 50, `indeks` kompletów, `wysuw` (B) i `dlKorpus` (A) z tabeli, `odBoku` 6,5, `dnoOd` 27 (spód prowadnicy → spód dna i tyłu), `bokPodDnem` 10 (`dxsBokOd` = 17: spód prowadnicy → dół boku), `nadDnem` 2, `odCzola` 4, `krotsza` 10 (skrzynka NL − 10), `zaTylem` 3, `wkretGora` 37, `zaczepY`/`zaczepX` 11/7, `wolneOdBoku` 75, `szerProw` 33, `minTyl` 20 |
| `VBOX` | — | dane katalogowe Sevroll V-BOX 3D Slim, **dla płyty 18 mm** (instrukcja: `instrukcje/Folder-Szuflada-V-BOX-18mm-online.pdf`). Pion skrzynki od dołu prowadnicy (2026-10-05): `vboxGora(bok)` = min. front nakładany (do góry boku), `vboxOdProw(bok)` = dół boku (13–15), `vboxDno(bok)` = spód dna i tyłu (23–24); kontrola miejsca nad szufladą i auto bok liczą `rail.y0 + vboxGora` |

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
Blenda nad szafką · Drzwi nakładane · Drzwi wpuszczane · Klapa · Cokół · Cokół ciągu · Element stały (fix) ·
Front szuflady · Dno szuflady · Tył szuflady · Bok szuflady (DXS-3D) · Plecy HDF · Plecy HDF we frezie ·
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
Prowadnica Sevroll V-BOX 3D Slim … mm (`SLIDE_PRICES` wg NL) ·
Prowadnica Sevroll DXS-3D Synchro (50 za komplet bez względu na NL; NL i indeks w specyfikacji)

---

## 6. Szybkie poprawki w Uwagach

Kod akcji dopisuje się do tekstu uwagi po znaku `|`; obsługuje je `NoteLine`.

| Kod | Co robi |
|---|---|
| `fixgap:<lv>:<col>:<v>:<up\|down>` | ustawia luz między drzwiami, żeby fronty wyszły równe |
| `fixh:` / `fixnl:` / `fixback:` / `fixnodoor:` | wysokość, NL prowadnicy, tył szuflady, kolumna bez drzwi |
| `fixdiv:` / `fixsup:` / `fixcolauto:` | przegroda, wspornik, kolumna na automat |
| `szufbrak:<poziom>:<kolumna>` → `szufmniej:<poziom>:<kolumna>:<n>` / `szufdxs:<poziom>:<kolumna>` | szuflada bez miejsca na żadną skrzynkę (V-BOX: żaden niższy bok nie wchodzi albo front za niski nawet na 80; DXS-3D: auto nie mieści boku 40 / tyłu 30 — „nie ma miejsca na skrzynkę DXS-3D”): `computeGeo` dokleja znacznik, `przyciskiSzuflad` w `App` zamienia go na „Zmniejsz do N szuflad” (zostają dolne, fronty od nowa) i „Zmień na DXS-3D” (`zmienSystemSzuflady`), każdy tylko gdy po nim kolumna nie ma błędów, tylko przy pierwszej takiej uwadze kolumny; bez `App` (np. inne widoki) znacznik nie daje przycisku. „Zwiększ do 60 mm” przy skrzynce DXS tylko, gdy bok 60 się mieści (decyzja użytkownika 2026-10-22: oba przyciski) |
| `frontyauto:<poziom>:<kolumna>` | „Podziel fronty równo” przy „wysokości frontów szuflad nie zgadzają się o N mm”: `drawer.front = null` dla wszystkich szuflad kolumny; przy „luz między szufladami 0 mm” (błąd) i „tylko 1 mm” (ostrzeżenie) — „Zwiększ luz do 2 mm” (`fixgap:`, `col.gapBetween`) |
| `levauto` | przy „Zadane wysokości poziomów nie wypełniają wnętrza / przekraczają wnętrze”: „Górny poziom na auto” (górny `level.h = null`), a gdy górny już jest auto — „Podziel poziomy równo” (wszystkie `h = null`) |
| `wspornikoff:<poziom>:<kolumna>:<strona zawiasu albo ->` | przy półce skróconej do wspornika fixu: „Przełóż zawiasy na drugą stronę i usuń wspornik” albo „Usuń wspornik” |
| `slepyfix:<nr szafki>:<strona>:<szerokość>` | „Popraw fix na N mm” — fix szafki w ślepym rogu inny niż zasłonięta część (bez tolerancji) |
| `hingeflip:<lv>:<col>:<side>` | przekłada zawiasy na drugą stronę |
| `parablat:<poziom>:<kolumna>` | „Dodaj parę wzmocnień pod blat” — przy otwartej górze kolumny (bez wieńca i wzmocnienia) i przy klapie do góry bez czego zawiesić zawiasy |
| `tylstd:<poziom>:<kolumna>:<szuflada>` | „Wyłącz podniesiony tył” — gdy nad skrzynką nie ma 20 mm na podniesienie |
| `hingeflipcab:<nr szafki>:<lv>:<col>:<side>:<ok\|kąt>` | w uwadze o kolizji otwierania: „Przełóż zawiasy na lewą/prawą — bez kolizji / otworzy się do ok. N°”; tylko pojedyncze drzwi i tylko gdy przełożenie pomaga (kolizja znika albo kąt rośnie o `POPRAWKA_KAT` = 20°; `wynikPoprawki`, liczone w `swingBodies` → `s.alt`); gdy nie pomaga, rady o zawiasach nie ma |
| `slepyrog:<nr szafki>:<strona fixu>:<fix mm>:<ciąg z narożnikiem albo ->` | „Ustaw szafkę w rogu”: w każdym poziomie kolumna od rogu dostaje fix na zasłoniętą część, jedne drzwi i zawias od zewnątrz (uchwyt przy fixie), a narożnik — płaską wstawkę; blok „Szafka w rogu do ustawienia” (`cornerPairMsgs`) pokazuje się, dopóki `slepyUstawiony(z)` nie jest spełnione, a kolizje otwierania w tym rogu czekają |
| `wstawka:<ciąg z narożnikiem>:<plaska\|szeroka>:<mm>:<ok\|kąt>` | przy kolizji otwierania między ciągami w rogu (bez szafki w L): „Dodaj wstawkę 18 mm — bez kolizji” i „Wstawka 60 mm (na trójkątach) — …” (każda, która pomaga — obie naraz, gdy obie pomagają; przy płaskiej już ustawionej tylko szeroka); tylko gdy pomaga — sprawdzane na próbę w `openingMsgs` (`zWstawka`: projekt z wstawką → `projectLayout` → to samo skrzydło); obsługa w `runFix` przez `setCorner` |
| `SZUFLADA_ZAPAS` = 5 | luz nad bokiem skrzynki V-BOX ponad minimum z katalogu (`vboxGora`) — wymóg: auto bok tylko z nim (sufit `sufitDla(hc)` z całej drogi skrzynki, też wzmocnienie przy plecach), `miesciSie` z nim; mniejszy luz — błąd „nad bokiem skrzynki X mm zostaje N mm luzu… potrzeba min. 5 mm” z `fixh:` |
| `reling:<poziom>:<kolumna>:<szuflada>:<0\|1>` | przy froncie > 140 mm ponad bokiem: 0 — „Zostaw bez relingu” (`drawer.bezRelingu = true`, ostrzeżenie → informacja), 1 — „Wróć do ostrzeżenia o relingu” |
| `szufsys:<vbox\|dxs>` / `szufmix` / `szufmixnie` / `szufinne` / `szufinnenie` | „Wszystkie szuflady szafki na V-BOX / DXS-3D” (`naSystemSzuflad`), „Zostaw różne systemy” (`cab.szufladyMieszane`, uwaga szafki), „Zostaw tak” (`cab.szufladyInne`, uwaga ciągu), „Wróć do ostrzeżenia” — wykonuje `runFix` (aktywna szafka) |
| `relingdodaj:` / `relingusun:<poziom>:<kolumna>:<szuflada>` | „Dodaj reling” / „Usuń reling”: `drawer.reling` (też pole „reling” w wierszu szuflady) → produkt „Reling boczny do szuflady” (`relingGroups` w `computeGeo`, komplet na szufladę, NL w specyfikacji), cena `DEFAULT_HW_PRICES` 30 zł bez względu na długość |
| „Wczytaj wysłany do Claude” (tylko artefakt) | `pobierzOdClaude` → `dbClaude.doc(PROJEKT_DLA_CLAUDE).get()` → pytanie `data-el="wczytaj-od-claude-pytanie"` → `applyImportText(json)`; na innym komputerze wczytuje ostatnio wysłany projekt zamiast projektu startowego |
| `ZAWIAS_MAX_ODSTEP` = 600, `zawiasowWystarczy(dl)` | tylko klapa: ostrzeżenie „za dużo zawiasów” przy 3+ zawiasach, gdy nominalny odstęp środków (`HINGE_REF` od krawędzi, reszta równo) < 600 mm; przycisk `zawiasy:<poziom>:<kolumna>:<skrzydło>:<ile>` („Ustaw N zawiasy”, `col.hinges[skrzydło]`) |
| drzwi — zawiasy wpisane ręcznie (`col.hinges[i]`) | inna liczba niż `zawiasyGtv` — ostrzeżenie „za dużo / za mało zawiasów wg tabeli GTV — N zamiast M (front szer. × wys. mm, ok. X kg)” z tym samym przyciskiem `zawiasy:`; front ponad tabelę — ostrzeżenie „poza tabelą zawiasów GTV … liczba orientacyjna” |
| klapa — zawiasy (`klapaZawiasy`) | ręcznie 2–4 (`col.hinges[0]`), poza zakresem błąd + `zawiasy:`; punkty = liczba w zamówieniu; 3D: `klapaObrot` do `min(d.kat, suwak)` |
| `dociacpanel:<@ albo id ciągu>:<klucz>` | „Tak, docinam ręcznie” przy formatce węższej niż `MIN_PART` (60): klucz `kluczDociecia(nazwa, a, b)` (właściwy wymiar) dopisany do `cab.dociac` aktywnej szafki (`@`, też ramię szafki w L) albo `run.dociac` (cokół ciągu); uwagi `maleFormatkiMsgs` — od 2026-10-21: poniżej `MIN_DOCIECIE` (30) błąd „nie da się dociąć ręcznie”, 30–60 ostrzeżenie z „Tak, docinam ręcznie” (i „Zwiększ do 60 mm”, gdy formatka ma `zw60`), po potwierdzeniu informacja; do zamówienia `naZamowienie` (bok 60, `p.dociac` = właściwy wymiar) w `computeGeo` (`panels`), `cornerArmParts`, `runPlinthPanels`; własny cokół/blat szafki w ciągu z cokołem/blatem ciągu — `bezWspolnychFormatek` |
| `zwieksz60:<b\|t>:<poziom>:<kolumna>:<szuflada>[,…]` | „Zwiększ do 60 mm” przy formatce boku (b) albo tyłu (t) skrzynki DXS-3D węższej niż `MIN_PART`: `drawer.h` / `drawer.backHeight` = 60 (formatki z `zw60` z `dpZw60` w `computeGeo`) |
| `wstawkaw:<ciąg z narożnikiem>:<mm>` / `wstawkadociac:<ciąg z narożnikiem>:<mm>` | przy wstawce węższej niż `MIN_PART` (60): „Popraw na 60 mm” (zmienia `w`, kasuje `dociac`) / „Tak, 50 mm — docinam ręcznie” (`corner.wstawka.dociac` = ta szerokość; inna szerokość — znowu pytanie); uwagi `wstawkaMsgs(layout, nr szafki)` — poniżej 30 błąd, 30–60 ostrzeżenie, po potwierdzeniu informacja; do zamówienia (`wstawkaParts`) wstawka i listwa min. 60 |
| `hingewstawka:<nr szafki>:<lv>:<col>:<side>:<ciąg z narożnikiem>:<typ>:<mm>:<ok\|kąt>` | „Zawiasy na lewą/prawą + wstawka 18 mm / 60 mm (na trójkątach) — …”: obie zmiany naraz; tylko gdy razem dają więcej niż każda osobno (np. uchwyt 80 mm: same zawiasy 37°, razem 73°) |
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
| `narozn3` | blat w narożniku: na styk, przełączenie, łyżwa, U; złącza do blatów (2 / 3, U, prosty ciąg w 2 kawałkach, płyta 18 bez, wycena 9 zł) |
| `narkat` | kątownik w tylnym narożniku: bok znika, ramiona regulowane |
| `rogplecy` | plecy z płyty w narożniku, osobno od każdej ściany |
| `ramplec` / `ramkarta` | wzmocnienia i plecy ramienia; karta ustawień ramienia |
| `rysrog` | rysunki narożnika: front na bok z luzem, zawiasy, rzut z góry, tył, nóżki ramienia |
| `blatrog` / `blatrys` / `blat` / `blatciag` | blat roboczy: róg, rysunki, ciąg, wieniec |
| `okucia3` | liczby okuc z wymiaru: klipsy, trójkąty, fix, zawiasy 165°/90°; tabela GTV dla 165° (skrzydło 579 × 1994 mm: 5, na zwykłym zawiasie 4) |
| `bryla3d` | co widać na wierzchu w 45° i 3D: blat, maskownice, uchwyty; nóżki; zero wymuszeń kolejności z ośmiu stron |
| `wyslij` | przycisk „Wyślij do Claude”: bez magazynu go nie ma, z atrapą zapisuje pełny projekt |
| `opisy` | żaden napis na rysunku nie jest przykryty płytą, nóżką ani blatem — wszystkie zakresy i widoki szafki narożnej |
| `zoom` | powiększanie i przesuwanie rysunku, „Dopasuj”, pamięć powiększenia i przewinięcia każdego widoku, pełny ekran z Esc, 3D: obrót vs Shift + przesuwanie |
| `wasdrzwi` | podpowiedź „dwoje wąskich drzwi” (300, 500 tak; 600 i jedne drzwi nie), przyciski zawiasy z lewej/prawej |
| `formatki` | **audyt**: każda płyta z rysunku 3D (szafka i zabudowa) ma parę w formatkach szafki/projektu — drzwi, szuflady, fix ze wspornikiem, fix u góry, blendy, maskownica wycięcia, plecy z płyty, przegrody, ciąg z blatem i cokołem, szablony (w tym szafka w L); ramię w liście szafki narożnej |
| `wstawka` | wstawka w rogu: przyciski przy kolizji, formatka 720 × 60 w liście szafki i projektu, wkręty/trójkąty, rzut 18 × 60 / 60 × 18, elewacja, odsunięcie ciągu o 18/60, pole w Strukturze wnętrza szafki przy rogu (nie w karcie ciągu — tam wskazówka), mocowania szerokiej (trójkąty / konfirmaty w linii korpusu / z listwą: okucia, formatka listwy, rzut, bryła przylega do boku), wstawka węższa niż 60 (błąd z pytaniem, zamówienie 60, „Tak” → ostrzeżenie, „Popraw na 60 mm”), brak przy szafce w L; widoki samej szafki (przód zamk./otw. przy prawym boku 18 × 720, z góry 18 × 60, bryła 3D), a szafka nie przy rogu bez wstawki |
| `minform` | formatki węższe niż 60 mm: wąska szafka (dno/wieniec 54) — ostrzeżenie, w zamówieniu nic poniżej 60, „Tak, docinam ręcznie” → informacja i `cab.dociac`; szafka 60 (dno 24) — błąd „poniżej 30 mm nie da się dociąć”; cokół ciągu 50 mm — ostrzeżenie, w zamówieniu 60, potwierdzenie w `run.dociac` |
| `gorne` | ciągi górne w L: górny drugiej ściany wisi na niej (bez kolizji z górnym pierwszej), odsunięcie 300 w rogu, gdy górny ściany wjeżdżającej sięga rogu; „+ szafka” bierze H/D/cokół ciągu (górny 300, dolny 570) |
| `gornaL` | górna szafka w L: szablon tylko w górnym ciągu, staje przy rogu (koniec/początek ciągu), zakłada górny ciąg drugiej ściany, ramię po właściwej stronie, dosunięcie do rogu, bez kolizji i bez „wystaje poza dolny”, formatki ramienia z wieńcem, 2 zawieszki; górny ślepy róg bez szafki w L po staremu |
| `zwijanie` | karty (rysunek, notatka, formatki i produkty szafki i projektu) zwijają się i rozwijają; „Uwagi” bez zwijania; kolejność: notatka pod rysunkiem, wycena pod produktami całego projektu, bez „Kontrola frontów” |
| `szuflady` | audyt szuflad (z symulacją wysuwu `testy/symwysuw.mjs`: każda szuflada osobno co 5 mm na pełną NL, reszta zamknięta, blat nad szafką; tabela luzów nad bokami i tyłem; każda kolizja z symulacji musi być zgłoszona w uwagach; 2 próby kontrolne, w których kolizja jest naprawdę — NL 550 przy tylnym wzmocnieniu, bok 238 pod płaskim; układy dodatkowe: szuflady pod półką z drzwiami nad nimi, obok drzwi za przegrodą, H 820 i 600, D 500): 1–4 szuflady × szafka z wieńcem / pod blatem × podniesiony tył × fronty nakładane i wpuszczane — pas frontów 3 mm od dołu i od góry (nie w blat), bez „nie wysunie się”, każda uwaga z przyciskiem, w 3D skrzynka (otwarta) i fronty (zamknięte) nie wchodzą w korpus ani wzmocnienia; NL górnej szuflady przed tylnym wzmocnieniem; przycisk „Wyłącz podniesiony tył”; drzwi wpuszczane pod blatem |
| `kolory` | audyt płyt i kolorów: 3 ustawienia (realne kolory / „Rozróżnij fronty”, fronty i półki z płyty korpusu albo własnych) × wszystkie widoki i zakresy (56), 3D, PDF, formatki projektu i karty szafki L, rozkrój — każdy element z płyty swojej roli; plus front ramienia z płyty sąsiedniej ściany |
| `pomieszczenia` | stary projekt → „Pomieszczenie 1”, dodawanie, zmiana nazwy, pasek tylko z szafkami pomieszczenia, „Zabudowa” i kolizje w obrębie pomieszczenia, licznik uwag innych pomieszczeń, przenoszenie zabudowy (z Cofnij), usuwanie z pytaniem (przenieś / z szafkami), zakres zamówienia, PDF z rozdziałami i zbiorczym zamówieniem |
| `podzial` | podział blatu/cokołu (pola + własne cięcie), wymiar „Ciąg” bez rogu, długości ścian osobno, „Rozwiąż ciąg” u góry, zwijany pasek ciągów i szafek |
| `kreator` | kreator rogu: ślepa szafka 1000 z fixem 618 od rogu, jedne drzwi, zawias od zewnątrz, wstawka płaska — bez bloku „do ustawienia”; szafka w L 900 + ramię 630 bez wstawki; osobny ciąg; przycisk „Ustaw szafkę w rogu” w istniejącym projekcie |
| `audyt` | audyt całości na ~20 konfiguracjach: nachodzenie brył 3D (szafka i zabudowa, zamknięte), formatki ↔ rysunek w obie strony z ilościami (szuflady w bryle otwartej), formatki projektu = suma szafek + cokół/blat ciągu, okucia projektu vs suma, PDF = ekran (formatki i okucia szafek i projektu). HDF we frezie może wchodzić krawędzią do 16 mm (w grubość płyty) i 4 mm (w głąb); `znane` — przypadki czekające na decyzję (BLEDY.md). Trwa ok. 4 min |
| `audytmacierz` | **audyt macierzowy** (analiza braków kontroli 2026-10-04): 10 konstrukcji (stojąca, pod blatem z parą wzmocnień w ciągu, wisząca, cokół w obrysie, plecy z płyty, HDF we frezie, fronty wpuszczane, blat na bokach, blat roboczy 38 na bokach, bez dna) × 11 wnętrz (drzwi, półki, szuflady 1–4, klapy, fix ze wspornikiem, przegrody, blenda…) + 6 skrajnych wymiarów; w każdym: nachodzenie brył 3D, formatki ↔ bryła w obie strony, fronty nie wyżej niż korpus, symulacja wysuwu szuflad, plan wierceń z PDF ↔ formatki, brak błędów (×) w uwagach poza `OCZEKIWANE`. Filtr `TYLKO=<regex>`. Trwa ok. 10 min |
| `audytzabudowa` | kuchnia składana przyciskami jak przez użytkownika („+ ciąg”, „+ szafka”, kreator rogu ślepa / L, „+ ciąg górny”, cokół pod korpusem): brak błędów w uwagach każdej szafki, nachodzenie brył w całej zabudowie, cokoły w rogu na zakładkę (koniec każdego na płaszczyźnie drugiego) i pod wszystkimi szafkami swojej ściany, formatki projektu ↔ bryła (cokół ciągu dzielony na kawałki), 3 szuflady w szafce pod blatem z symulacją wysuwu. Ok. 1,5 min |
| `audytprojektu` | audyt projektu wysłanego z artefaktu (`PROJEKT=plik node testy/audytprojektu.mjs`, plik ze scratchpadu — projekt nie idzie do repozytorium): każda szafka — uwagi, nachodzenie brył, formatki ↔ bryła, wysuw szuflad (luzy nad bokami i tyłem); zabudowa każdego pomieszczenia; błędy strony. Nie jest w pełnym przebiegu |
| `losowe` | **test losowych edycji** (w pełnym przebiegu, czyli przed scaleniem): 3 ziarna × 22 kroki — szafka stojąca albo pod blatem, losowe wymiary, wnętrza, fronty, plecy, cokół, nóżki, dno, blat, półki, NL, czasem przycisk naprawy; gdy uwagi nie mają błędu (×) — nic nie nachodzi, formatki = bryła, szuflady się wysuwają. Powtórka: `LOSOWE_ZIARNO=7` (kilka: `1,2,3`), `LOSOWE_KROKOW`, `LOSOWE_ZRZUT=katalog` (projekt z błędem do pliku). Ok. 2,5 min |
| `decyzje` | decyzje z 2026-10-04: blat 38 na bokach w H (bok 682, 3D, górny ciąg 1320), wspornik pod blatem na trójkątach (okucia 1 + 3, plan wierceń, kontrola z wieńcem), „+ szafka” w pustym ciągu 560 / jak ciąg obok, szafka w L z kreatora z głębokością sąsiedniej ściany, pełny wysuw szuflad w 3D (= NL), informacja o różnych NL w kolumnie |
| `podblatem` | szafka pod blatem przy zmianach struktury: „+ poziom” przenosi parę wzmocnień do najwyższego poziomu, „+ przegroda i kolumna” daje nowej kolumnie parę, otwarta góra → ostrzeżenie z przyciskiem `parablat`, ręcznie usunięta para nie wraca sama |
| `symwysuw.mjs` | (pomocnik, nie suita) `symuluj(bryly, { H, blat, nl })` — wysuw każdej szuflady co 5 mm na pełną NL; zwraca luzy nad bokami i tyłem oraz kolizje; używają `szuflady`, `audytmacierz`, `audytzabudowa` |
| `audytwycena` | rozkrój i wycena na 7 projektach (hook `window.__audytRozkroj` = ostatni `autoPlan` z `aktualny`): każda formatka na arkuszach tyle razy, ile zamawiamy, nic odrzuconego, bez nachodzenia, rzaz 3 mm, słoje; arkusze = rozkrój, formatowanie, obrzeże 22 mm = suma krawędzi płyty, blat osobno, oklejanie w górę, okucia = lista, wartość = ilość × cena, Razem = suma |
| `audytwierc` | plan wierceń z PDF vs rysunek i bryła na 12 konfiguracjach: zawiasy (ile, wysokości, na wsporniku po stronie fixu, klapy w wieńcu/dnie), podnośnik / amortyzator klapy (płytka na boku i mocowanie na klapie wg instrukcji GTV), kołki (wysokość spodu półki, odległości od przedniej krawędzi płyty), prowadnice (wysokość, otwory wg NL z instrukcji V-BOX), płyty z planu w formatkach, zawiasy = okucia; konfirmaty i trójkąty = okucia; szafka w L i wstawka w rogu (kartka aktywnej szafki); frez pod HDF |
| `audyt2d` | rysunki 2D = rzut bryły 3D, w obie strony, dla widoków szafki (z przodu zamkn./otw., z góry, z boku, z tyłu) na 23 konfiguracjach — także szafka pod blatem w ciągu (wzór z aplikacji: drzwi, szuflady, fix ze wspornikiem, dwa poziomy; blat w 3D obowiązkowy), bez dna, blat 38 na bokach, szuflady wpuszczane; szuka przesunięcia układu sam; **ściśle**: kilka brył jednym prostokątem tylko przy styku ≤ 0,5 mm (fronty ze szczelinami muszą być osobno), obrysy przerywane = obwiednia kilku brył, zasłonięte bryły pomija (szczeliny do 3 mm). Trwa ok. 3 min |
| `ruchy` | kontrola otwierania szuflad i klap: prosty ciąg bez kolizji, klapa do góry pod blatem (otworzy się na kilkanaście stopni), klapa w dół w górnej wolna, szuflada w zasłoniętej części ślepego rogu trafia w korpus sąsiada, drzwi w zasłoniętej części i szuflady obok — wolne; klapa na 100° pod sufitem (sufit z ciągu górnego) |
| `wreg` | plecy „We frezie” jako frez 16 × 3 na krawędzi: HDF W−6 × H−6, półka o 3 mm płytsza, HDF w rzucie na tyle korpusu, pola 16/3/1, ostrzeżenie przy frezie płytszym niż HDF, migracja starego {16, 4} |
| `wspornik` | półka przy wsporniku fixu płytsza (564 × 460 zamiast 564 × 560), ostrzeżenie, oba warianty przycisku, kołki półki w bokach w planie wierceń (PDF) |
| `uchwyt` | wiersz okuć skrzydła (zawiasy, uchwyt, lustro), wysunięcie i położenie uchwytu per skrzydło — zapis, rysunek z przodu, bryła 3D |
| `klapy` | klapa do góry: siła z tabeli GTV (test liczy ją sam), waga frontu (680 kg/m³), 1 podnośnik przy 600, 2 przy 900, ręcznie 1 → ostrzeżenie; zawiasy 2 / 3 powyżej 900; formatka „Klapa”; UI „skrzydło / klapa”, potem „do góry / w dół”; klapa w dół: amortyzator z tabeli PD-ECGDL, po wpisaniu 80 N pozycja w okuciach; klapa użytkownika 560 × 750 — poza tabelą i za ciężka, z uwagą o kącie 45°; ostrzeżenia >600 mm i <290 mm; bryła otwarta szafki i ciągu bez błędów; drzwi wg tabeli GTV (wysokości, „za dużo / za mało”, „poza tabelą”, trzeci zawias z samej wagi przy froncie 25 mm), dymek „Liczba zawiasów”, notatka montażowa zawiasu (przycisk i linia w PDF); strona jednego podnośnika, półka na drodze podnośnika (z przyciskiem), zawias półnakładany (przegroda, klapa pod półką) |
| `zawiasy` | przycisk przełożenia zawiasów przy kolizji tylko, gdy pomaga (17 mm z lewej → bez przycisku; 564 z prawej → „na lewą — zostaje 17 mm”), przełącznik „zawias” przy kolumnie z jednymi drzwiami |
| `odsuniecie` | odsunięcie od ściany: głębokość blatu, wysięg przed drzwi (10 / <10 uwaga / >30 ostrzeżenie), krzywa ściana w widoku z boku, róg przesunięty o odstęp, wyjątek jednej szafki |
| `hw2` / `cokol` / `cokolstd` / `ceny` / `ceny2` | okucia, cokół, cennik |
| `ciag`…`ciag10` | ciągi: zakładanie, rozjazdy, cokół ciągu, światła |
| `pietra` | dolny i górny ciąg na tej samej ścianie |
| `tylkol` / `tylkolstd` | podniesiony tył szuflady |
| `otwier` | kolizje przy otwieraniu skrzydeł |
| `uwagiptak` | odhaczanie uwag |
| `migr` / `reload` | migracja starych projektów, przeładowanie |
| `arkusz` / `cutplan` / `fit` / `fitall` | mieszczenie się w arkuszu i rozkrój; `cutplan` też PDF rozkroju (nagłówek, kolumna arkusza, nagłówek materiału z rysunkiem, „N szafek”, złącza blatu w produktach projektu); prawdziwy wydruk rozkroju do PDF — 1 strona tabeli + dokładnie 1 strona na arkusz; „6 szafek” |
| `audytgpt2` | audyt GPT 2026-10-17 N5–N21 i U3: HDF w kolorach, oklejanie wstawki, front z płyty korpusu, nóżki < 50, warianty nóżek i zawiasów, „Cokół”/„Blat” dodatkowe, plecy kolumn w 3D, dno szuflady 25, HDF przy wycięciu, blenda w 3D, kołki, kolor blatu, zawiasy w jednym miejscu, NL spoza listy, lustra, listwa i zawieszki w ciągu, nagłówek „Rysunek” |
| `audytgpt3` | audyt GPT 2026-10-17 N22–N33 i podpowiedzi → ostrzeżenia: NL przy przeszkodzie, blat przy słupku, zabudowa przeszkody 3D (48 wariantów), głębokość z plecami / frontem, plecy z płyty półek, usunięcie szafki, cena okucia, nóżki i konfirmaty w płytkiej szafce, szczelina nad przegrodą, grubość ≤ 0 |
| `audytgpt4` | audyt GPT 2026-10-17 N34–N48 (bez N45): lustro w masie frontu, wczytanie bieżącego zapisu, uchwyt klapy, przeszkoda przy zawiasach, montaż frontów szuflad w kolumnie, konfirmaty wspornika / półki / przegrody, wspornik a plecy, fix przy szufladach, kolory zabudowy 3D, górny ciąg nad słupkiem, rozwiązanie ciągu z górnym, blat przy frontach wpuszczanych, brak pola „Kąt otwarcia” |
| `audytgpt6` | audyt GPT 2026-10-21 N69–N81: blat przy ścianie dalej u góry (N69), kątownik L z płyty półek 12 mm (N70), zabudowa 18 w korpusie 12 (N71), wzmocnienie poza korpusem (N72), plecy w kolumnie a ściana (N73), płytka amortyzatora niskiej klapy (N74), wspornik fixu a wzmocnienie (N76), własne blaty w ciągu (N78, N79), lustra 4 / 6 mm (N80), mocowania pleców w kolumnach (N81), plecy z płyty cofnięte, listwa montażowa (na wymiar, skrót 10 mm, skrajna bez zawieszek, plecy cofnięte) w odcinkach 1 / 2 m (jedna szafka, trzy osobne z jednego 2 m, ciąg > 2 m z docinkiem na osobną szafkę), kołki po obu stronach przegrody (D240 / D220 na zewnątrz z podpowiedzią, D280 i D560 do środka, trójkąty) |
| `audytgpt5` | audyt GPT 2026-10-17 N38 (kąt w rogu przy luzie 26), N42 (wspornik), N45, N49–N68, łyżwa przy różnych głębokościach, podpowiedź blatu z wysunięciem szafki: krzyżowe konfirmaty, fix w kolumnie szuflad, szafka w L (półki, uchwyt, dno, plecy, cokół), cofnięty cokół 3D, kolory półek 3D, wysunięta szafka (3D, blat), ciągi od prawej, blaty na łyżwę, złącza blatów a wysokość, luz szuflad, brak NL |
| `blatwys` | wysokość blatów: narożnik (cokół 110, wysokość 735 — przyciski wyrównania, cokół i nóżki razem), to samo pomieszczenie bez rogu (ostrzeżenie z obu stron, wyrównanie), słupek bez zmian, inne pomieszczenie bez uwagi |
| `przewijanie` | paski zwijają się przy przewijaniu w dół i nie skaczą, ręcznie rozwinięty zostaje minutę (zegar Playwrighta), powrót na górze, „Pokaż rysunek”, nazwa ściany (Enter, Esc, pusta, wiersz górny), „+ nowy ciąg”, „× usuń ciąg” |
| `niskieokno` | audyt GPT U2: okno 600 × 495 — pasek ciągów zwinięty sam, nagłówek ≤ 40% i przyklejony, „Pokaż rysunek” tuż pod paskiem, rozwinięcie kliknięciem (bez zapamiętywania) odkleja nagłówek; 640 × 300 — nieprzyklejony; 1500 × 1000 bez zmian, zmniejszenie i powiększenie okna |
| `dxs` | szuflady DXS-3D: liczby z instrukcji liczone w teście (SKW = LW − 49, boki NL − 10, dno do tyłu, tył bok − 10, NL + 3 / + front wpuszczany), kreski prowadnic (2 mm nad dnem, front + 5), bok auto z luzem 5, zamówienie (komplet z indeksem, konfirmaty i zaślepki, cena 50), plan wierceń (kreska, odsunięcie 4 / 22, konfirmaty skrzynki, otwór zaczepu, sprzęgła), 3D (wysuw B, skrzynka 6,5 od boku, bez kolizji), przyciski bok / tył / NL 270, wybór systemu, „+ szuflada”, różne systemy w szafce i w ciągu, V-BOX bez zmian. DXS jest też w `formatki`, `audyt2d` i `losowe` |
| `macierzszuflad` | **macierz szuflad** (317 układów; `TYLKO=<regex>`, `SHARD=k/n` — co n-ty układ, 3 przebiegi naraz ok. 5 min, `PELNE=1`): 9 konstrukcji (stojąca, pod blatem, wpuszczane, wisząca 350, cokół w obrysie, plecy z płyty, HDF we frezie, blat 38 na bokach, pod blatem + wpuszczane) × warianty w V-BOX i DXS-3D (1–5 szt., bez uchwytów, front ręczny, luzy, NL kolumny / szuflady, dwie kolumny, obok / pod / nad drzwiami, fix ze wspornikiem / u góry, montaż frontów, plecy kolumny, boki i tył ręcznie, reling, 1000 mm, mieszane, uchwyt frezowany) + wymiary skrajne (W 300–1200, D 300–650, H 400–2100, płyta 16 / 19) + rzadkie opcje (wycięcie narożnika, rura, płyta półek 16, front 22, front poniżej prowadnicy 0 / 20, bez nałożenia, dwa poziomy, trzy kolumny). Na każdym: nachodzenie, formatki ↔ 3D, fronty w obrysie, skrzynka poza korpusem, wysuw (`symwysuw`), prowadnice w zamówieniu = szuflady, kreski w planie wierceń = 2 × szuflady, brak błędów; układ celowo zły — oczekiwany błąd, klik w jego przycisk usuwa go bez nowych błędów, potem geometria jeszcze raz |
| `audytszuflad` | szuflady klikane jak użytkownik (`TYLKO=D,O` — wybrane scenariusze, `PELNE=1` — całe treści błędów): nowa szafka w ciągu i startowa, wisząca z klapą, „klapy zamiast drzwi” (szuflady w dolnym i górnym poziomie, usunięcie drugiego), dwa i trzy poziomy, dwie kolumny (usunięcie przegrody, też przy wpisanych szerokościach), słupek, druga szafka w ciągu DXS, szuflady → drzwi → szuflady, edycje DXS (+ szuflada, front, ×, bok i tył ręcznie i auto), wpuszczane, 1000 mm, „Górny poziom na auto” / „Podziel poziomy równo”, za dużo szuflad w niskim poziomie („Zmniejsz do N szuflad”, „Zmień na DXS-3D”, 6 × DXS); po każdym kroku V-BOX i DXS: brak błędów w Uwagach, płyty 3D ↔ formatki, skrzynka i front poza korpusem, wysuw `symwysuw`, wzmocnienia spod blatu na górze, kolumna bez drzwi bez ustawień klapy |
| `pdfczytelnosc` | czytelność rysunków szafki w PDF (audyt GPT PDF-1): okno 190 mm, media „print”, 13 typów szafek (drzwi, szuflady, klapa, 1100 z fixem, 300, L w prawo i w lewo, słupek 2000, 2 i 3 kolumny, wpuszczane z frezem, blenda) + ciąg z blatem: 4 widoki na szafkę, wymiary ≥ 2,3 mm, każdy napis ≥ 1,8 mm, napisy nie nachodzą na siebie i nie wychodzą poza pole widoku; `PROJEKT=plik` dokłada projekt użytkownika, `SZCZEGOLY=1` wypisuje skalę i najmniejsze napisy |
| `komentarze1` | komentarze z artefaktu 2026-10-17: kolejność kart, podświetlenie formatki, półka → poziom / klapy (też poziom z dwiema kolumnami; z szufladami — bez), podział zwinięty, zużycie blatu i odpad arkusza, opis „Luz w rogu” |
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
# Długie suity idą w częściach (SHARD przez `jedna.sh`, lista w pelny.sh):
# macierzszuflad → macierzszuflad@0-4 … @3-4 (w całości ponad 600 s przy 5 naraz).
cd testy && bash pelny.sh /tmp/pelny            # albo: bash pelny.sh /tmp/p narozn2 zoom
```
