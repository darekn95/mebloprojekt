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

- **Kontrola kolizji otwierania — cały zakres** (użytkownik 2026-09-28): ma
  obejmować otwieranie WSZYSTKICH drzwi, klap i szuflad, a potem też wystające
  sprzęty w zabudowie (lodówka, piekarnik, mikrofala itd.). Dziś liczymy
  skrzydła drzwi przeciw wszystkiemu (korpusy, fronty, uchwyty, wysunięte
  szuflady, wstawki); szuflady są tylko przeszkodą, same nie są sprawdzane
  przy wysuwaniu; klapy nie są sprawdzane wcale; sprzętów jeszcze nie ma.
  Do zaplanowania razem z kategorią „sprzęty”.

- **Klapy do góry i w dół — do sprawdzenia przez użytkownika w innym terminie**
  (prośba 2026-09-28). Zrobione i w artefakcie (wersja 48), ale użytkownik
  jeszcze ich nie oglądał. Do przejrzenia razem: przełącznik „otwieranie”,
  dobór siły z tabeli GTV PD-G00, liczba podnośników i zawiasów, uwagi,
  formatka „Klapa”, rysunki i bryła 3D. Poprawki po pierwszym spojrzeniu
  (wybór w dwóch krokach, amortyzator z tabeli PD-ECGDL, ostrzeżenie przy
  jednym podnośniku, cena 10 zł, gęstość 680) już wprowadzone. Braki spisane w `AI_NOTES.md` ([AI-TODO] Klapy).

## Ustalone — nie ruszać

- **Półka przy wsporniku pionowym fixu** (2026-09-28): na całą szerokość
  szafki, ale płytsza — zaczyna się za wspornikiem (nikt nie wycina „U”), na
  zwykłych kołkach w bokach; ostrzeżenie
  z przyciskiem „Przełóż zawiasy na drugą stronę i usuń wspornik” (albo „Usuń
  wspornik”, gdy zawiasy już są po drugiej stronie), `wspornikoff:`.
- **Plecy „We frezie” = frez 16 × 3 na tylnej krawędzi** (2026-09-28; w aplikacji zawsze „frez”, nie „wręg”): z płyty 18 frezuje się
  16 mm (zostają 2 mm od zewnątrz), 3 mm w głąb w stronę drzwi — HDF 3 mm
  zlicowany z tyłem korpusu; frez też w wieńcu i dnie; luz 1 mm na stronę.
  HDF = W − 6 × H − 6. Pola: „Szerokość” 16, „Głębokość” 3, „Luz” 1.
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
