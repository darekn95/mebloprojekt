# Lista błędów, poprawek i decyzji

Jedno miejsce na znane błędy aplikacji i testów, ich przyczyny i to, co z nimi
zrobiono. Wpis dopisuje się przy znalezieniu błędu, a przenosi do „Naprawione”
razem z commitem, który go usuwa. Sprawy, które wymagają decyzji użytkownika,
idą do „Do decyzji” z konkretnymi opcjami — nie wstrzymują reszty pracy.

Pełny przebieg testów: `SLOWNIK.md`, sekcja 8. Suity padające tak samo na czystym
`main` to błędy sprzed zmiany — trzeba to sprawdzić, zanim uzna się coś za regresję.

## Do naprawy

| Suita | Objaw | Przyczyna / stan |
|---|---|---|
| — | wszystkie znane usterki z listy naprawione 2026-09-27; nowe dopisywać tutaj | |

## Naprawione

| Data | Suita / miejsce | Przyczyna | Commit |
|---|---|---|---|
| 2026-09-29 | układ kart (`App`) | prośba użytkownika: notatka montażowa pod rysunkiem (była w lewej kolumnie), „Uwagi” bez zwijania, karta „Kontrola frontów” zdjęta z ekranu (liczby zostają w `geo.doors` dla testów), wycena na końcu — pod produktami całego projektu. `zwijanie` sprawdza kolejność i brak zwijania uwag; `etest` bez „Kontrola frontów” | (ten commit) |
| 2026-09-29 | rozkrój i wycena, karty (`autoPlan`, `ROZKROJ_ZWLOKA`, `Card`), nowa suita `zwijanie` | na prośbę użytkownika: rozkrój liczy się sam 1 s po ostatniej zmianie formatek — klucz to lista formatek z płytą i kolorem (zmiana koloru korpusu/półek/frontów to inne arkusze), więc lustro, uchwyty, zawiasy czy plan wierceń go nie ruszają; wycena ma arkusze bez klikania, „Pokaż rozkrój” otwiera gotowe okno, otwarte okno odświeża się samo. Pomiar: 15 szafek 20–40 ms, 60 szafek ok. 130 ms. Każda karta da się zwinąć (domyślnie rozwinięta). Testy z „Policz rozkrój” → „Pokaż rozkrój”; `dupquote` sprawdza płytę w wycenie bez klikania | (ten commit) |
| 2026-09-29 | wycena oklejania, zawieszki, mocowanie półek (`quote`, `zawieszki`, `mocowaniePolek`) | decyzje użytkownika z przykładami rozliczenia firmy: usługa oklejania liczy się od okleiny razem z zapasem 9 cm na bok, w górę do pełnego metra (bok 1000 → 1,09 mb → 2 mb; 1000+1000+500+500 → 3,36 → 4) — wcześniej od samych krawędzi; szafka wisząca od 900 mm z przegrodą pionową dostaje zawieszkę na przegrodzie (po jednej na przegrodę, najwyżej dwie — dwie na jednej przegrodzie kolidowałyby wkrętami), bez przegrody dwie na bokach (wcześniej 4 przy ≥ 900); trzecia opcja mocowania półek: trójkąty meblowe (4 na półkę, 50 mm od krawędzi, przy przegrodzie jedna strona przesunięta o 20 mm). Testy `audytwycena`, `ceny`, `gornaL`, `audytwierc` | (ten commit) |
| 2026-09-29 | wycena obrzeża, zawieszki (`OBRZEZE_ZAPAS`, `qtyFmt`, `ZAWIESZKA_MODEL`/`ZAWIESZKA_MONTAZ`) | decyzje użytkownika: obrzeże (22 mm i ABS na blat) liczone do 1 mm, a do każdego oklejanego boku doliczone 90 mm okleiny — oklejarka wypuszcza ją z przodu i z tyłu i potem odcina; usługa oklejania dalej od samych krawędzi, w górę do metra. Ilości w wycenie do 3 miejsc. Zawieszka ZK-ZAW-R0-10 (karta w `instrukcje/`) przykręcana 2 wkrętami 4 × 30 (doliczone do „Wkręt 4 × 30”) — w planie wierceń „bez wiercenia”, górna krawędź pod wieńcem, 1 cm od pleców. Testy `audytwycena`, `ceny`, `hw2` (dawna zasada „bez wkrętów” — teraz 2 na zawieszkę), `gornaL` | (ten commit) |
| 2026-09-29 | wzmocnienie tylne B, zawieszki, blat 1200 (`postRects`, `polkaCzesci`, `zawieszki`, `cornerArmParts`) | decyzje użytkownika: przełącznik A/B wzmocnienia tylnego szafki w L z wieńcem (B — kąt prosty do środka szafki; półka „wycięty tylny róg W × D” w nazwie formatki, w bryle i na rzucie dwa prostokąty; kołki w płytach wzmocnienia); zawieszki w planie wierceń (górny tylny róg boku), w szafce w L: A — bok korpusu + bok ramienia, B — obie w części ramienia (domyślnie) albo w części szafki; pod zawieszką ramienia odcinek listwy (domyślnie) albo hak; blat 1200 × 38 — 1128,22 zł brutto z faktury (`blatrob` miał jeszcze 470/780). Szablon 650/350 zatwierdzony. Płyty wzmocnienia liczone raz w `computeGeo` — sześć rysunków liczyło je osobno. `audyt` rozkłada półkę z wycięciem na dwie bryły | (ten commit) |
| 2026-09-29 | szafka w L po stronie ramienia (`computeGeo`: `topX0/botX0`, zawias, `drillPlan`, okucia) | decyzja użytkownika po audycie planu wierceń: boku od strony ramienia nie ma, więc (1) wieniec i dno sięgają do zewnętrznego lica kątownika (wcześniej kończyły się na płaszczyźnie boku i nachodziły na kątownik 3 mm) i idą konfirmatem w czoło obu jego płyt — okucia 16 zamiast 18 przy szafce 900; (2) drzwi korpusu domyślnie na jego boku, z dala od ramienia, a zawias od strony ramienia to błąd z przyciskiem przełożenia; (3) kołki półki po stronie ramienia we wzmocnieniu tylnym (po jednym w każdej płycie kątownika). `audytwierc`: plan nie wierci w boku, którego nie ma | (ten commit) |
| 2026-09-29 | górna szafka narożna (`runLayout`, szablon `naroznikLgorny`, `tierMsgs`), nowa suita `gornaL` | na prośbę użytkownika: szafka w L w górnym ciągu nie miała ramienia — górne ciągi brały z dolnych samo odsunięcie o głębokość. Teraz para górnych z szafką w L w rogu dostaje narożnik jak dolna (ramię, kątownik, sąsiad odsunięty o głębokość i ramię), górny ciąg kończący się w rogu dosuwa się do niego, pusty górny ciąg za rogiem jest rysowany. Szablon „Górna narożna L” 650 × 720 × 300, ramię 350. Kontrola „ciąg górny wystaje poza dolny” liczyła same szafki bez narożnika — górna szafka nad ramieniem dolnej szafki w L dostawała fałszywe ostrzeżenie; teraz dolny ciąg liczy się razem z rogiem. Zawieszki szafki w L: jedna na boku korpusu, druga na boku ramienia (wariant A) | (ten commit) |
| 2026-09-29 | plan wierceń szafki w L i wstawki (`wierceniaDodatkowe`) | ramię szafki w L i wstawka w rogu nie miały nic w planie wierceń — teraz „Bok ramienia” (konfirmaty dna i wieńca ramienia, kołki półek ramienia, zawiasy frontu ramienia), „Fix ramienia” i „Wstawka w rogu” (trójkąty, 2 rzędy); frez pod HDF (16 × 3) jako wiersz przy bokach, wieńcu i dnie. `audytwierc`: kartka aktywnej szafki w PDF (wcześniej czytał pierwszą), 3 scenariusze z rogiem | (ten commit) |
| 2026-09-29 | elewacje szafki w L i rogu (`audyt2d`) | front ramienia i maskownica kątownika na elewacji ciągu i na rysunku szafki miały pełną wysokość korpusu — teraz pas drzwi szafki (`pasFrontu`, luzy jak w bryle i formatce); uchwyt ramienia w rzucie zabudowy z góry miał stare 20/32 mm — teraz `UCHWYT_OD_KRAWEDZI`; na elewacji ciągu przy ślepym rogu brakowało uchwytu szafki sąsiada wystającego z przekroju (o niego zahaczają drzwi) — dorysowany. Audyt: ślepy róg i szafka w L w rogu sprawdzane ściśle | (ten commit) |
| 2026-09-29 | plan wierceń (`drillPlan`) | na życzenie użytkownika: kołki z obu stron przegrody na tej samej wysokości — jedna strona 20 mm bliżej środka; konfirmaty (wieniec, dno, półki przelotowe, przegrody, wsporniki, półki na konfirmatach) z odległościami od krawędzi i trójkąty (blat, cokół) w planie; `audytwierc`: plan = okucia dla konfirmatów i trójkątów, 3 nowe konfiguracje | (ten commit) |
| 2026-09-28 | elewacja ciągu, otwarte (`ciag8`, pełny przebieg) | po dołożeniu uchwytów otwartych skrzydeł i szuflad w widoku szafki elewacja ciągu ich nie miała — rysunki rozjechały się (test parytetu); teraz te same uchwyty w obu | (ten commit) |
| 2026-09-28 | rysunki szafki w L, uchwyty (audyt2d) | z przodu rysowany był pełny prawy bok, którego w szafce w L nie ma (stoi tam kątownik) — teraz bez boku, a po otwarciu widać obie płyty kątownika; z tyłu kątownik bez 3 mm za plecami; uchwyt skrzydła przy zawiasie po prawej 20 mm od wolnej krawędzi, po lewej 32 — teraz z obu stron 30 mm (`UCHWYT_OD_KRAWEDZI` = oś 36), też na ramieniu w L (3D, elewacje, rzut z góry). Audyt 2D obejmuje teraz też widoki „Ciąg” i „Zabudowa z góry” (przy rogach jako INFO — AI_NOTES) | (ten commit) |
| 2026-09-28 | wycena, znalazł nowy `audytwycena` | krawędzie blatu roboczego (38 mm) wliczały się do „Obrzeże 22 × 2 mm” i usługi oklejania — teraz osobna pozycja „Obrzeże blatu roboczego” (cena 0 do ustalenia, pytanie do użytkownika), suma „Obrzeże PCV” bez blatu. Reszta wyceny i rozkroju zgodna na 7 projektach: każda formatka na arkuszach tyle razy, ile zamawiamy, bez nachodzenia, z rzazem 3 mm, bez obrotu przy pilnowanych słojach; arkusze/formatowanie/obrzeże/oklejanie/okucia/suma | (ten commit) |
| 2026-09-28 | plan wierceń (`drillPlan`), znalazł nowy `audytwierc` | zawias po stronie fixu ze wspornikiem był wpisany na bok zamiast na wspornik; zawiasów klap nie było wcale (teraz w wieńcu/dnie, wzdłuż szerokości); kołki półek podawane „od przodu półki” — teraz od przedniej krawędzi płyty (półka bywa cofnięta albo płytsza); prowadnice bez otworów — teraz wg instrukcji V-BOX (37 + 96/128/192/224, przy NL 600 trzy otwory, cofnięte przy frontach wpuszczanych); przegroda z półkami z obu stron miała otwory zlane w jeden wpis — teraz „(od kolumny N)” | (ten commit) |
| 2026-09-28 | skrzynka szuflady (`skrzynkaBryly`, widok z boku, `maxBack`) | tył stał na dnie — przy górnej szufladzie wchodził 14 mm w wieniec; wg instrukcji V-BOX tył jest równo z górą boku, a dno dochodzi do niego. Wysokość podniesionego tyłu liczona od jego dołu (`tylOd`), nowy błąd „tył wyżej niż górna krawędź frontu szuflady” z przyciskiem, domyślny podniesiony tył o 20 mm niżej niż front. Testy: `tylkol` (reguła frontu), `audyt` i `audyt2d` (scenariusz z podniesionym tyłem, bez „znanych”) | (ten commit) |
| 2026-09-28 | rysunki 2D, znalazł nowy `audyt2d` | rysunek płaski porównany z rzutem bryły 3D w obie strony (z przodu zamknięte/otwarte, z góry, z boku, z tyłu; 15 konfiguracji). Poprawione: uchwyty z przodu miały własne wymiary (120 zamiast 180 mm, przy prawych drzwiach 10 mm obok) — teraz `UchwytElewacja` z `uchwytObrys`, też w elewacji ciągu i przy klapie; z boku HDF przybijany stał w korpusie zamiast za nim, cokół był klockiem na całą głębokość zamiast płyty przy licu, brakowało uchwytów, tył szuflady stał przy froncie zamiast z tyłu skrzynki; HDF we frezie z góry i z boku bez części we frezie; z góry obrys skrzynki szuflady wchodził w boki (szerokość frontu zamiast światła); z tyłu bez pleców nie było widać frontów; otwarte skrzydła i klapy bez uchwytów, otwarta klapa po złej stronie osi. Skrzynka szuflady jest teraz też w zamkniętej bryle 3D. Kontrola klap: oś w licu, grubość po stronie korpusu (jak skrzydła i 3D) — klapa pod blatem się otwiera | (ten commit) |
| 2026-09-28 | kontrola otwierania (`swingBodies`, `openingMsgs`) | szuflady były tylko przeszkodą dla skrzydeł, a klapy nie były sprawdzane wcale. Teraz: szuflada wysuwa się prosto na prowadnicę z uchwytem (`wysuwHit`) — np. w zasłoniętej części ślepego rogu trafia w korpus sąsiada; klapa obraca się z grubością frontu co 1° (`klapaHit`) — pod blatem otworzy się tylko na kilkanaście stopni; blat ciągu jest przeszkodą. Uchwyt liczony tam, gdzie naprawdę jest (`uchwytObrys`), a nie paskiem przez cały front — test `otwier` „grubszy uchwyt” przerobiony na układ z płaską wstawką. Nowa suita `ruchy` | (ten commit) |
| 2026-09-28 | plecy we frezie (`computeGeo`, rysunki, 3D) | frez liczony jak rowek odsunięty 16 mm od tyłu i 4 mm w płytę (HDF 570 × 690 w szafce 600 × 720, półki 19 mm płytsze) — a u użytkownika to frez 16 × 3 na tylnej krawędzi, HDF zlicowany z tyłem. Domyślne {16, 4} były zamienione; teraz {3, 16}, stare zapisy z {16, 4} migrują (`migrateCab`, znacznik `wreg`). Frez płytszy niż HDF — ostrzeżenie i plecy liczone za korpusem. Nowa suita `wreg`; audyt dopuszcza HDF 15 mm w płycie | (ten commit) |
| 2026-09-28 | róg (`projectLayout`, `glRog`), znalazł `audyt` | odsunięcie drugiego ciągu liczone od ściany do lica samej szafki w rogu, jakby stała przy ścianie — a szafki ciągu stoją wyrównane do lica, więc płytsza szafka w rogu stoi dalej od ściany. Szafka w L 560 w ciągu szafek 570 wchodziła ramieniem 10 mm w pierwszą szafkę drugiego ciągu. Teraz `glRog` = lico ciągu + wysunięcie szafki w rogu. Uwaga „Od rogu szafka zajmuje…” rozpisuje też plecy / dosunięcie do lica (wcześniej składniki nie sumowały się do podanej liczby). Testy: `narozn2` ramię „500 × 600” (korpus), `narkat` wzmocnienie czołowe o plecy pustego ciągu krótsze | (ten commit) |
| 2026-09-28 | szafka w L, pusty ciąg, półka przy wsporniku | szablon szafki w L 560 w głąb jak stojąca (`CORNER_L_D`, ramię 640, razem nadal 1200); pusty ciąg za rogiem liczony od ściany razem z domyślnymi plecami HDF (ramię było o 3 mm płytsze niż szafki obok); uwaga „szafka w L … ramię N × M” podaje głębokość korpusu ramienia (`armKorpus`), nie z plecami; półka przy wsporniku fixu — na całą szerokość, płytsza o wspornik, na zwykłych kołkach w bokach (poprawka użytkownika; wcześniej węższa z kołkiem we wsporniku). Przesunięte liczby w testach: `kreator` ramię 640, `odsuniecie` 1210 od rogu i „ramię 640 × 537”, `blatrog` 633 i uwaga o 7 mm przy ręcznie ustawionych 570, `wspornik` 564 × 460 | (ten commit) |
| 2026-09-28 | przegląd wartości na sztywno | wstawka w rogu: opis bloku i przycisk „Ustaw szafkę w rogu” miały „18 mm” na sztywno, a przycisk wstawki przy kolizji brał grubość frontu z pierwszej szafki ciągu, nie tej przy rogu — teraz `tfPrzyRogu` | (ten commit) |
| 2026-09-28 | audyt całości (`testy/audyt.mjs`) | nowa suita: nachodzenie brył w 3D (szafka i zabudowa), formatki ↔ rysunek w obie strony z ilościami, projekt = suma szafek, PDF = ekran; 20 konfiguracji. Znalezione i poprawione: plecy w bryle zabudowy wchodziły 3 mm w boki/dno/półki (`plecyBryla`); półki i przegrody w bryle szafki odkładane od lica (przy frontach wpuszczanych wchodziły w drzwi); plecy z płyty wewnątrz nie skracały półek (półka 18 mm za głęboka w formatce); plecy z płyty wewnątrz rysowane na cały tył; okucia ramienia szafki w L i wstawki tylko w projekcie, nie na liście szafki (`okuciaSzafki`); listwa wspólna ciągu na kartce szafki w PDF; szafka w L ze stroną „auto” zawsze z kątownikiem po prawej — przy ramieniu w lewo (kreator rogu) pełny bok stał po stronie ramienia; dno i tył szuflady nie były nigdzie rysowane (`skrzynkaBryly`) | (ten commit) |
| 2026-09-28 | plecy za korpusem | HDF przybijany (i płyta na zewnątrz) stoi za korpusem, więc szafka stoi o jego grubość od ściany — układ ciągu, róg, blat ciągu, ramię szafki w L i kreator rogu liczą teraz z `geo.glebOdSciany` (decyzja użytkownika). Przesunięte liczby w testach (+3 mm): narozn 621/671/249/651, narozn2 621→1103, narozn3 1097/1521/918, wstawka 591/609/651, gorne 321, narjedne 235, blatciag/blatrys 533, blatrog (uwaga „tylko 7 mm”), odsuniecie (korpusy o 3 mm płytsze, odległości te same); kreator fix 621 liczony z układu | (ten commit) |
| 2026-09-28 | przegląd wszystkich rysunków projektu użytkownika | wstawki brakowało na widoku z boku (prawy bok), z tyłu szafki i z tyłu ciągu; podpis „bok „Ściana 2” 606” liczył wstawkę, która stoi przed bokiem i jest rysowana osobno — teraz 588. Reszta widoków (przód, z góry, 3D, 45°, zabudowa) i audyt 3D ↔ formatki bez uwag; suita `wstawka` | (ten commit) |
| 2026-09-28 | ślepy róg (`projectLayout`) | drugi ciąg odsuwał się od rogu o sam korpus szafki w rogu (570), bez jej frontu (18) — bok sąsiada stał w miejscu fixu, a płaska wstawka na niego nachodziła i nic nie odsuwała (zgłoszenie użytkownika: „nie widać wstawki, bok do boku”). Teraz `frontRog` (front szafki w rogu, gdy nakładany; nie przy szafce w L) i to samo w górnych ciągach. Przesunięte liczby w testach: `narozn` 618/668, `narozn2` 618, `narozn3` blaty 918/1518, `wstawka` 588/606/648, `gorne` 318; `otwier` i `zawiasy` — kolizja z uchwytem liczona bez wstawki (z płaską 18 mm przy uchwycie 20 mm jej nie ma) | (ten commit) |
| 2026-09-28 | widoki „Szafka” (przód, z góry, 3D, PDF) | wstawka w rogu była w formatkach szafki, do której się przykręca, i w widoku ciągu, ale nie na rysunku samej szafki (zgłoszenie użytkownika) — widoki dostają `wstawki` (`wstawkiSzafki`); suita `wstawka` | (ten commit) |
| 2026-09-28 | `tylkol` | test szukał przycisku po nazwie „auto” bez dokładnego dopasowania i łapał nowy „auto (L)” przełącznika zawiasu — selektor `exact: true`; aplikacja dobra | (ten commit) |
| 2026-09-28 | `blat`, `fromcab`, `stdfull` | testy zakładały szablon „Szafka stojąca” 500 w głąb — od zmiany na 570 (prośba użytkownika) głębokość blatu to 620, prowadnica w rzucie 52..552, a druga szafka dostaje w teście 570, żeby boki były wspólne; aplikacja dobra | (ten commit) |
| 2026-09-28 | `otwier`, `wstawka` | kolizje w nieustawionym ślepym rogu czekają na „Ustaw szafkę w rogu” — scenariusze mają szafkę w rogu już ustawioną (fix, jedne drzwi, zawias od zewnątrz); kolizja z uchwytem sprawdzana w układzie użytkownika | (ten commit) |
| 2026-09-28 | róg ze zwykłymi szafkami (`kreator`) | po dodaniu drugiego ciągu na górze były trzy kolizje z osobnymi przyciskami wstawki, a informacja o ślepym narożniku ginęła w podpowiedziach — nic o fixie, jednych drzwiach, uchwycie i zawiasie; teraz blok „Szafka w rogu do ustawienia” z jednym przyciskiem (fix + drzwi + zawias od zewnątrz + wstawka), kolizje w tym rogu czekają na ustawienie, a „+ ciąg” otwiera kreator rogu z gotową szafką | (ten commit) |
| 2026-09-28 | ślepy róg (`narozn`) | zasłonięta część liczona tylko do korpusu sąsiada (570) — jego drzwi stoją 18 mm dalej, a fix robi się jeszcze szerszy na uchwyt; teraz korpus + front + 30 mm (np. 900 przy sąsiedzie 600: 252 dostępu zamiast 300) | (ten commit) |
| 2026-09-28 | **ciągi górne w L** (`gorne`) | górny ciąg drugiej ściany trafiał na pierwszą ścianę (układ nie brał ramki od dolnego, choć kod o tym mówił) — nachodził na tamten górny, rysunki i kontrola otwierania pokazywały bzdury; teraz górny stoi w ramce swojego dolnego, a w rogu odsuwa się o głębokość górnego ciągu ściany wjeżdżającej | (ten commit) |
| 2026-09-28 | „+ szafka” w ciągu (`gorne`) | nowa szafka miała domyślne 500 w głąb (w górnym ciągu 300, w dolnym 570) i bez cokołu ciągu — od razu ostrzeżenie o rozjeździe, który zrobiła sama aplikacja; teraz bierze H/D/cokół ciągu | (ten commit) |
| 2026-09-28 | `otwier`: kolizja w rogu | rada „zwęź front do 0 mm” (14, 44 mm) przy wąskiej szafce w ślepym rogu — teraz tylko, gdy zostaje ≥ `MIN_COL` (200); „odsuń ciągi w rogu” wskazuje pole „Luz w rogu” | (ten commit) |
| 2026-09-28 | rzut z góry: ślepy róg | napis „30 dostępu” nad wąskim wymiarem przecinał wymiary drugiego ciągu — przy dostępie < 160 mm stoi obok, nad zasłoniętą częścią szafki (`data-el="dostep-waski"`) | (ten commit) |
| 2026-09-27 | **formatki: jedna szafka w ciągu** | blat i cokół ciągu wypadały z listy szafki (liczą się w ciągu), a „Formatki całego projektu”, produkty, rozkrój całości i strona projektu w PDF pokazywały się dopiero od 2 szafek — blatu i cokołu nie było **nigdzie**; teraz warunek `calyProjekt` (2+ szafki albo części ciągu/ramię) i informacja pod listą szafki | (ten commit) |
| 2026-09-27 | **formatki: szafka w L** | płyty ramienia były tylko w liście projektu, nie w liście szafki (ani na jej kartce PDF); teraz `formatkiSzafki` dokłada ramię | (ten commit) |
| 2026-09-27 | **formatki ramienia** | formatki ramienia (bok 552 × 684 między dnem a górą, dno i półka o 18 mm płytsze, plecy 684) nie zgadzały się z rysunkiem; użytkownik: „ma być tak, jak wygląda” — bok na pełną wysokość i głębokość, dno/wieniec między korpusem a bokiem na pełną głębokość, plecy HDF H − 2 jak w korpusie; rysunek: front ramienia i maskownice w linii drzwi, kątownik między dnem a górą, dno i półka nie wchodzą pod bok | (ten commit) |
| 2026-09-27 | wydruk szafki | kartka szafki w ciągu z blatem liczyła „Blat” szafki, choć aplikacja go pomija (blat ciągu) — ta sama `formatkiSzafki` w obu miejscach | (ten commit) |
| 2026-09-27 | `wygl`, `wyglstd` | test sprawdzał dawną zasadę „z góry bez nóżek”; teraz przerywany obrys pod „Pokaż okucia” | 30d1c93 |
| 2026-09-27 | `drobnestd` | test oczekiwał dawnego luzu 3 mm między drzwiami (domyślnie 2) | 30d1c93 |
| 2026-09-27 | `ciag5`, `grain` | kreskowanie „przejścia do ramienia” (`<pattern id="mp-przejscie">`) brane za szew cokołu i za strukturę słojów — aplikacja dobra | b89e078 |
| 2026-09-27 | `ciag7` | nowy format opisu („jedna formatka” w środku zdania, listwa w mb w zestawieniu) | e46e01b |
| 2026-09-27 | `narjedne` | nie błąd aplikacji: jedne drzwi przy rogu same wypełniają lico do maskownicy (ręczna szerokość celowo pomijana), więc podpowiedź „Zrób jedne drzwi” nie ma czego naprawiać; test sprawdza teraz dopasowanie drzwi (238 mm), brak szpary i błędu pasma | (ten commit) |
| 2026-09-27 | `nozki`, `nozkistd` | test zakładał 2 nóżki od czoła, a szafka 900 mm ma od wcześniejszej zmiany parę na środku (3 widoczne); wysokości i przygaszenie były dobre | (ten commit) |
| 2026-09-27 | `polkigr` | rachunki testu liczone przy dawnym luzie 3 mm między frontami; przy 2 mm podział pasma szuflad przesuwa się o 1 mm (suma ta sama) — sprawdzone: z luzem 3 mm wychodzą 250/241; test ustawia luz 3 mm wprost | (ten commit) |
| 2026-09-27 | `pins2` | nowa kolumna startuje bez półek, a „+ półka” jest tylko w kolumnie, która już je ma — test klikał go w pierwszej; podpisy otworów mają dziś postać „otw. 527”. Test ustawia pole „półki” drugiej kolumny i czyta nowy format; kołki i podpisy były dobre | (ten commit) |
| 2026-09-27 | `pdf` | względny adres `file://./report.html` — teraz bezwzględny; `zestawienie.pdf` w `.gitignore` | (ten commit) |
| 2026-09-27 | `savetest`, `interact` | szukały `preview-local.html`, którego nikt nie buduje — teraz build testowy (lub standalone przy `STD=1`); `savetest` ma jawne OK/BLAD (zapis, wczytanie po przeładowaniu) | (ten commit) |
| 2026-09-27 | `d2test` | „Zaślepka nad szafką” to dziś „Blenda nad szafką” w zwiniętej karcie; test rozwija kartę, ma jawne OK/BLAD (blenda, fix u góry skraca drzwi, wzmocnienie pionowe, widoki) | (ten commit) |
| 2026-09-27 | `fixbtn` | przycisk „Usuń drzwi z tej kolumny” to dziś „Usuń kolidujące skrzydło”; test ma jawne OK/BLAD (błąd o zawiasie na fixie znika po obu poprawkach) | (ten commit) |
| 2026-09-27 | `luzy` | podpowiedź o luzie pojawia się przy nierównym podziale; test ustawia luz 3 mm wprost | 3d2690b |

## Do decyzji użytkownika

- **Przycinanie albo zawieszanie po zmianach — pierwszy podejrzany: automatyczny
  rozkrój** (2026-09-29). Liczy się sam 1 s po zmianie formatek (powyżej 40 szafek
  — 5 s). Pomiar: 40 szafek niezauważalnie, 100 szafek jedno przytrzymanie ok.
  0,3–0,45 s. Gdy program zacznie przycinać: zmierzyć (`scratchpad` skrypt jak
  `czas_auto` — Long Tasks po zmianie wymiaru), wydłużyć `ROZKROJ_ZWLOKA*` albo
  przenieść liczenie do Web Workera. Decyzja użytkownika: tak zostaje, dopóki nie
  będzie źle.

- **Kontrola kolizji otwierania — sprzęty w zabudowie** (użytkownik 2026-09-28):
  drzwi, szuflady i klapy są już sprawdzane (2026-09-28). Wrócić, gdy pojawi
  się kategoria „sprzęty” (lodówka, piekarnik, mikrofala) — dołożyć je jako
  bryły w `swingBodies`, a ich drzwi/klapy jako ruchy.

- **Klapy do góry i w dół — do sprawdzenia przez użytkownika w innym terminie**
  (prośba 2026-09-28). Zrobione i w artefakcie (wersja 48), ale użytkownik
  jeszcze ich nie oglądał. Do przejrzenia razem: przełącznik „otwieranie”,
  dobór siły z tabeli GTV PD-G00, liczba podnośników i zawiasów, uwagi,
  formatka „Klapa”, rysunki i bryła 3D. Poprawki po pierwszym spojrzeniu
  (wybór w dwóch krokach, amortyzator z tabeli PD-ECGDL, ostrzeżenie przy
  jednym podnośniku, cena 10 zł, gęstość 680) już wprowadzone. Braki spisane w `AI_NOTES.md` ([AI-TODO] Klapy).

## Ustalone — nie ruszać

- **Wycięcie w narożniku a formatka boku** (2026-09-29): wycięcie na całą wysokość boku → zamawiamy krótszą formatkę (zmienia rozkrój); wycięcie tylko na części wysokości (jeden poziom wysokiej szafki) → bok w całości, bez zmiany rozkroju (`registerCorner`, `fullHeight`).
- **Scalanie do `main`** tylko na wyraźną prośbę użytkownika (AGENTS.md).
- **Rozkrój automatyczny** (2026-09-29): 1 s po ostatniej zmianie formatek (lista formatek z płytą i kolorem); jeśli okaże się zauważalny — wydłużyć `ROZKROJ_ZWLOKA`. Każda karta ma zwijanie poza „Uwagi” (zawsze na wierzchu). Kolejność: rysunek, notatka montażowa, uwagi, formatki, produkty, wycena na końcu; „Kontrola frontów” nie jest wyświetlana.
- **Obrzeże** (2026-09-29): materiał do 1 mm + 9 cm na każdy oklejany bok (zapas oklejarki); usługa oklejania od tej okleiny z zapasem, w górę do pełnego metra (przykłady rozliczenia firmy). Zawieszki ZK-ZAW-R0-10 przykręcane 2 wkrętami 4 × 30, bez wiercenia, na samej górze pod wieńcem, 1 cm od pleców; od 900 mm dodatkowa na przegrodzie pionowej (po jednej na przegrodę, najwyżej dwie), para trzyma 95 kg. Półki: kołki, konfirmaty albo trójkąty meblowe.
- **Górna szafka w L** (2026-09-29): szablon 650 × 720 × 300, ramię 350; wzmocnienie tylne A albo B (B tylko przy wieńcu); zawieszki A: bok korpusu + bok ramienia, B: obie w części ramienia albo obie w części szafki; pod zawieszką ramienia listwa (domyślnie) albo hak. Koniec blatu przy ścianie oklejany zawsze. Blat 1200: 1128,22 zł brutto.
- **Szafka w L po stronie ramienia** (2026-09-29): wieniec i dno do zewnętrznego lica kątownika, po jednym konfirmacie w czoło każdej jego płyty; drzwi korpusu na boku korpusu, front ramienia na boku ramienia (zawsze z dala od rogu); kołki (albo trójkąty) półki we wzmocnieniu tylnym — przy wariancie A po obu jego płytach, przy B z wyciętym tylnym rogiem półki.
- **Półka przy wsporniku pionowym fixu** (2026-09-28): na całą szerokość
  szafki, ale płytsza — zaczyna się za wspornikiem (nikt nie wycina „U”), na
  zwykłych kołkach w bokach; ostrzeżenie
  z przyciskiem „Przełóż zawiasy na drugą stronę i usuń wspornik” (albo „Usuń
  wspornik”, gdy zawiasy już są po drugiej stronie), `wspornikoff:`.
- **Plecy „We frezie” = frez 16 × 3 na tylnej krawędzi** (2026-09-28; w aplikacji zawsze „frez”, nie „wręg”): z płyty 18 frezuje się
  16 mm (zostają 2 mm od zewnątrz), 3 mm w głąb w stronę drzwi — HDF 3 mm
  zlicowany z tyłem korpusu; frez też w wieńcu i dnie; luz 1 mm na stronę.
  HDF = W − 6 × H − 6. Pola: „Szerokość” 16, „Głębokość” 3, „Luz” 1.
- **Kołki z obu stron przegrody na tej samej wysokości** (2026-09-29): po
  stronie kolumny z prawej przesunięte o 20 mm do środka półki (`KOLEK_PRZESUN`),
  półki zostają na swoich wysokościach. Wysokość w planie = spód półki, zawsze.
- **Konfirmaty i trójkąty w planie wierceń** (2026-09-29): konfirmaty co ok.
  200 mm styku (min. 2), skrajne 50 mm od przedniej i tylnej krawędzi
  (`KONF_OD_KRAWEDZI`), reszta równo; trójkąty (blat od spodu, cokół bez nóżek)
  jako wiersze tabeli. Liczby = okucia.
- **Blat roboczy — oklejanie** (2026-09-29, faktura użytkownika): oklejane tylko
  wolne końce (przód z fabrycznym profilem, tył przy ścianie; nie w rogu, przy
  słupku ani na łączeniu kawałków) — obrzeże ABS 43 × 2 (6,68 zł/mb, dokładna
  długość) i usługa „oklejanie PCV > 23 mm” (11,81 zł/mb, w górę do pełnego
  metra). Blat 600 × 38: 563,99 zł. Formatowanie 51,66 zł za arkusz (też blat).
- **Tył szuflady V-BOX** (2026-09-28, instrukcja w `instrukcje/`): standardowy
  tył ma górę równo z górą boku, dół `tylOd` (9–10 mm) nad dołem boku, dno
  dochodzi do tyłu. Tył nigdy wyżej niż górna krawędź frontu szuflady (błąd),
  domyślny podniesiony — o `BACK_CLEAR` niżej; nie niżej niż bok; wyższy tył
  dopuszczamy, jeśli przejdzie pod tym, co wyżej, z luzem na wyjęcie.
- **Słupek 600 w głąb** (2026-09-28): szablon zostaje; głębsza szafka w ciągu
  to ostrzeżenie mówiące, że pozostałe odsuną się od ściany (lico wyznacza
  najgłębsza), z przyciskami wyrównania.
- **Szafka w L 560 w głąb** (2026-09-28), jak stojąca; ramię 640 (razem 1200).
  Półki ramienia płytsze o kątowniki.
- **Kontrola kolizji nigdy nie jest wstrzymywana** (2026-09-28): przy
  nieustawionej szafce w rogu kolizje stoją obok bloku „do ustawienia”.
- **Fix w ślepym rogu bez tolerancji** (2026-09-28): każda różnica od
  zasłoniętej części daje podpowiedź z przyciskiem „Popraw fix na N mm”
  (`slepyfix:`); szafka z fixem i jednymi drzwiami liczy się jako ustawiona.

- **Ślepy róg** (2026-09-28): zasłonięta część frontu szafki w rogu = głębokość
  sąsiedniego ciągu + jego front + `SLEPY_ZAPAS` (30 mm) na uchwyt. U użytkownika
  fix w ślepej części jest ok. 5 cm szerszy, ale 30 mm wystarcza.
- **Wstawka szeroka**: oklejona tylko dolna krawędź (boki stykają się z bokami
  szafek); trójkąty po 2 z każdej strony (przy 720 — 4 szt.). **Wstawka płaska**:
  wkręty 4 × 30 co ok. 200 mm, krawędź przednia i dolna.

- Podpowiedź „Zrób jedne drzwi na … mm” przy szafce narożnej w L (`cornerdoor:`
  w `runCornerMsgs`) zostaje **celowo** jako zabezpieczenie, choć dziś praktycznie
  się nie pojawia: pas frontu szafki narożnej sam kończy się na maskownicy kątownika,
  więc jedne drzwi, dwoje i ręczna szerokość mieszczą się w licu (sprawdzone
  2026-09-27 na szablonie `naroznikL`). Nie usuwać (decyzja użytkownika).

- **Plecy za korpusem** (2026-09-28): HDF przybijany stoi za korpusem, szafka
  o jego grubość od ściany (lico 560 + 3 + 18 = 581). Szablon „Szafka stojąca”
  ma 560 w głąb — lepiej dociąć tył blatu do kąta ściany niż żeby zabrakło,
  zawsze można odsunąć szafki od ściany.
- **Półki w szafce w L** (2026-09-28): półka korpusu płytsza o kątownik przy
  plecach i kątownik narożnika z przodu (na całej szerokości), od strony
  kątownika węższa o grubość pleców; półka ramienia kończy się za kątownikiem
  narożnika.
- **Skrzynka szuflady** (2026-09-28): rysowana w 3D po otwarciu i na widoku
  z boku (dno, tył, boki metalowe), wymiary jak formatki.

- **Klapy** (2026-09-28): najpierw wybór „skrzydło / klapa”, przy klapie
  „do góry / w dół”. Zawiasy te same co przy skrzydłach, 2 szt. (powyżej
  900 mm szerokości 3). Podnośnik (do góry) / amortyzator (w dół) 1 szt.,
  powyżej 600 mm domyślnie 2, do zmiany; jeden przy ponad 600 mm to
  **ostrzeżenie**. Siła z tabel GTV (karty od użytkownika): do góry PD-G00,
  w dół amortyzator olejowy PD-ECGDL (60/80/150 N, 90°). Waga frontu
  z wymiarów, grubości i gęstości 680 kg/m³ (użytkownik: 660–680), dzielona na
  sztuki, najmniejsza siła, która uniesie. Klapa użytkownika 560 × 750 na
  jednym 80 N wg tabeli jest za ciężka — działa, bo otwiera się tylko na ok.
  45° (dlatego uwaga o kącie przy za ciężkiej klapie w dół). Cena standardowa
  podnośnika i amortyzatora: 10 zł. Strona Kornera (waga płyty) zablokowana
  przez sieć kontenera — gęstość od użytkownika.

- Artefakt na claude.ai **nie** potrzebuje pobierania plików (tylko wersja na
  GitHubie). „Wyślij do Claude” jest **tylko** w artefakcie. Szczegóły w `AGENTS.md`.

## Pomysły / optymalizacja

- **Zrobione 2026-09-28: wstawka w rogu** (`run.corner.wstawka`, suita `wstawka`) —
  płaska 18 × 60 na wkręty i szeroka 60 na trójkąty, przy pierwszej szafce ciągu,
  który nie wjeżdża w róg; formatka z płyty frontowej na wysokość korpusu, rysunki,
  kontrola otwierania, przyciski przy kolizji, pole w karcie ciągu (Narożnik).

- **Zrobione 2026-09-27:** zapamiętywanie `computeGeo` i `runTop` (niezmienne
  obiekty projektu jako klucz). Pomiar na 24 szafkach w 3 ciągach (mediana
  czasu od zmiany szerokości do narysowania): Szafka/Zamk. 53→33 ms,
  Zabudowa/Zamk. 62→38 ms, Zabudowa/Z góry 47→33 ms, Zabudowa/3D 62→41 ms;
  obrót 3D 53→44 ms. Pełny przebieg testów zielony przed i po zmianie.
  Warunek: nikt nie zmienia szafki, materiałów, projektu ani wyniku w miejscu.

- **Zrobione 2026-09-27:** powiększenie rysunku wraca po przełączeniu widoku
  (osobno dla każdej szafki i widoku, razem z miejscem przewinięcia).
- **Zrobione 2026-09-27:** podpowiedź „dwoje wąskich drzwi” (każde < 250 mm,
  jedne ≤ 600 mm) z przyciskami „Jedne drzwi … — zawiasy z lewej / z prawej”.
  To co innego niż „Zrób jedne drzwi” przy rogu (poniżej).
- **Później, po szablonie słupka:** nowa kategoria „Sprzęty” (płyta indukcyjna,
  piekarnik, lodówka, zmywarka, mikrofala itd.), a z nią sprzęty wystające poza
  lico i kontrola otwierania przy nich. Do tego czasu sprzętów nie ruszamy
  (decyzja użytkownika 2026-09-27).
