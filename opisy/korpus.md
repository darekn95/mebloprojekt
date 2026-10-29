# Korpus, wzmocnienia, plecy, blat

Karta „Korpus” i pola korpusu w karcie „Ciąg meblowy”. Wnętrze (poziomy,
kolumny) — `opisy/poziomy.md`; ciąg i narożnik — `opisy/ciagi.md`.

## Co program liczy sam

- **Wymiary**: szerokość, wysokość i głębokość korpusu.
  - Głębokość może zawierać plecy i front („Podana głębokość zawiera plecy / front”) — wtedy korpus jest o nie płytszy. Front odejmuje się, gdy któryś naprawdę wystaje przed korpus (`frontyWystaja`): drzwi i klapy przy frontach nakładanych szafki, szuflady według montażu kolumny / poziomu kolumny („Na korpusie” / „Wewnątrz”), blenda i fix nakładane (audyt GPT N98: liczył się tylko montaż szafki); pole widać też przy szafce wpuszczanej z szufladami na korpusie.
  - Wysokość to korpus. Cokół „pod dnem, w obrysie” mieści się w niej (boki do podłogi, dno nad cokołem). Cokół „pod korpusem” i nóżki dokładają się pod spodem — szczegóły w `opisy/cokol.md`.
- **Złącza korpusu** (każde osobno: wieniec z lewej / z prawej, dno z lewej / z prawej):
  - „między bokami” — płyta między bokami;
  - „na boku” — płyta na czołach boków;
  - brak (szafka pod blatem bez wieńca, szafka bez dna).
- **Szafka pod blatem roboczym** (w ciągu z blatem): wieniec znika, a każda kolumna najwyższego poziomu dostaje parę wzmocnień (znacznik `paraPodBlat` — para idzie razem do nowego najwyższego poziomu i razem znika przy powrocie wieńca; w szafce narożnej także stojąca z przodu, audyt GPT N109).
  - Z przodu: płaskie, 100 mm głębokości, przy licu.
  - Z tyłu: stojące, 100 mm wysokości, przy plecach.
  - W szafce narożnej przednie jest pionowe i cofnięte o grubość frontu, a tylne odsunięte o grubość płyty — dochodzi do kątownika.
  - Para zawsze siedzi w najwyższym poziomie, także po zmianach struktury.
- **Wzmocnienie stojące przy plecach** na wysokości szuflady skraca jej NL; to przy licu — wysokość boku skrzynki.
- **Tylne wzmocnienie przy wycięciu i rurze** (decyzja użytkownika 2026-10-22):
  - wycięcie tylnego narożnika — wzmocnienie jest krótsze i kończy się na ściance wycięcia;
  - element kolizyjny (rura) — wzmocnienie stoi przed nim i dalej idzie od boku do boku.
- **Plecy**:
  - **HDF** nabijany z tyłu — zszywki / gwoździki;
  - **HDF we frezie** — wręg od tyłu w bokach, wieńcu i dnie, domyślnie 16 × 3 mm, zlicowany z tyłem;
  - **płyta** w środku między bokami albo na zewnątrz — wkręty 3,5 × 30;
  - **brak**.
  - Kolumna może mieć własne plecy („jak szafka / HDF / płyta / brak”).
  - **Cofnięcie pleców** (płyta wewnątrz, opcja do specjalnego zastosowania, domyślnie 0 — równo z bokami): płyta cofnięta o N mm od tyłu boków, półki, przegrody i szuflady o tyle płytsze; za plecami w każdej szafce listwa montażowa (`opisy/zamowienie.md`). Za duże (z płytą ≥ głębokość korpusu) — błąd (użytkownik 2026-10-24).
  - Plecy w środku albo we frezie skracają głębokość półek, przegród i szuflad.
  - Plecy ustawione w kolumnach są zawsze przybijane za korpusem: szafka stoi od ściany o najgrubsze z nich (płyta 18 w jednej kolumnie → 578 mm przy korpusie 560), wszystkie „brak” — przy samej ścianie; zszywki do HDF i wkręty do płyty liczone z obwodu każdej płyty (audyt GPT N73, N81).
- **Konfirmaty na styku płyt**: jeden w połowie, gdy styk jest krótszy niż 132 mm; dłuższy — co ok. 200 mm, min. 2, po 50 mm od krawędzi.
- **Wieniec lub blat z płyty** (`top.mode`): z wysunięciami w lewo / prawo / do przodu / do tyłu; „podana szerokość to” — korpus albo całość z wysunięciami.
- **Blat roboczy** (ciąg z blatem albo własny blat szafki):
  - 38 mm grubości, z arkusza 4100 × 600 albo 4100 × 1200 mm;
  - ciąg dzieli blat na kawałki o długości arkusza, z miejscem na słupki;
  - styki kawałków i róg łączy „Złącze do blatów śrubowe”;
  - w rozkroju się nie obraca, bo przód ma fabryczny profil;
  - ceny arkuszy z faktur użytkownika: 563,99 zł (600) i 1128,22 zł (1200).
- **Blenda nad szafką**: pas nad korpusem o podanej wysokości.

- **Dwie przegrody na styku** (scalanie „dwie przegrody”, użytkownik 2026-10-29): dwie płyty obok siebie między wieńcem a dnem, każda z własnymi konfirmatami, kołkami i zawiasami (w planie wierceń „Przegroda N — lewa” / „— prawa”). Skręcone ze sobą 4 wkrętami 4 × 30 (przy płycie 16 mm — 4 × 25, żeby nie wyszedł z drugiej): po dwa przy dole i przy górze poziomu, z przodu i z tyłu. Każdy wkręt:
  1. nad kołkiem półki, w jej grubości (łeb zasłania półka), gdy półka jest do 300 mm od dołu / od góry poziomu, 70 mm od krawędzi — wkręcany od strony tej półki;
  2. inaczej (tylko przedni) 20 mm pod dolnym / nad górnym zawiasem na tej parze, w osi zawiasu — w połowie części przykręcanej do boku (80 mm, więc 40 mm od przedniej krawędzi);
  3. inaczej 100 mm od dołu / od góry poziomu, 50 mm od krawędzi.

## Co ustawiasz ręcznie

- **Karta „Korpus”**: wymiary, złącza, wieniec / blat z czego i wysunięcia, fronty nakładane / wpuszczane, plecy (rodzaj, montaż, frez, pozycja, materiał).
- **Wzmocnienia** („+ wzmocnienie” w kolumnie):
  - rodzaj: pionowe w licu („trawers”), leżące jak półka albo stojące jak bok;
  - położenie: góra / dół, przy boku;
  - wysokość lub głębokość, odsunięcie od lica albo od tyłu;
  - „skraca drzwi”.
- **Wycięcie tylnego narożnika** (lewego i prawego osobno): szerokość, głębokość, na całą wysokość albo w jednym poziomie, maskownica.
- **Element kolizyjny** (rura, słup): wymiary i położenie, zabudowa z maskownicą. Granicą zabudowy jest tylko przegroda na wysokości elementu (nie z innego poziomu — audyt GPT N112); płyta między poziomami nad elementem to „półka nad” dla zabudowy „do półki” (N113); element przechodzący przez płytę między poziomami albo przez przegrodę — ostrzeżenie z wymiarem otworu (N114). Ścianki zabudowy (też wycięcia) są z płyty półek — jej grubość liczy styki, czoło („przed bokami” = element + 2 × płyta zabudowy), rzuty i 3D (`maskWalls`, audyt GPT N71).
- **Płyty**: grubości i dekory korpusu, frontów, półek, pleców, lustra; arkusz blatu 600 / 1200; „fronty / półki z tej samej płyty co korpus”; usłojenie.

## Kontrole i przyciski

- **Wymiary**:
  - szerokość albo wysokość mniejsza niż dwie grubości płyty — błąd;
  - głębokość korpusu zero lub mniej — błąd;
  - wysunięcia blatu zjadają całą szerokość — błąd.
- **Frez pleców**:
  - szerszy niż płyta — błąd;
  - luz większy niż frez — błąd;
  - poza głębokością korpusu — błąd;
  - płytszy niż HDF — ostrzeżenie „plecy wystają za tył”.
- **Szafka płytka**:
  - na styku mieści się jeden konfirmat (poniżej 132 mm) — ostrzeżenie z „Popraw głębokość”;
  - dwa rzędy nóżek nachodzą na siebie — ostrzeżenie.
- **Kolumna otwarta od góry** (bez wieńca i wzmocnienia) — ostrzeżenie z „Dodaj parę wzmocnień pod blat”.
- **Wzmocnienie poza korpusem** (ręcznie wpisana wysokość większa niż poziom, głębokość z odsunięciem większa niż korpus do pleców) — błąd z największą wysokością / głębokością / odsunięciem; ustawień program nie zmienia (audyt GPT N72).
- **Pionowe wzmocnienie przecina półkę** (stoi przy boku od wieńca w dół i dochodzi do półki w tej samej głębokości) — błąd z „Wzmocnienie N: X mm” (najwyższe, które kończy się nad półką; od 60 mm) albo radą „przesuń półkę” (audyt GPT N100). Wzmocnienia — także pionowe — są z płyty korpusu i tak też wyglądają na rysunkach (N101; wcześniej pionowe miało kolor półek).
- **Szafka pod blatem ciągu z wieńcem** albo bez wieńca i bez wzmocnień — ostrzeżenie z „Dołóż parę wzmocnień” (wieniec znika, dochodzi para).
- **Ciąg bez blatu roboczego, a szafka bez wieńca z parą wzmocnień pod blat** (np. po wyłączeniu blatu) — ostrzeżenie z „Wieniec zamiast wzmocnień”. Wieniec włączony w „Złączach korpusu” (z „brak” na „między” / „na boku”) sam zdejmuje parę wzmocnień pod blat (`zWiencem`; użytkownik 2026-10-24).
- **Płyta inna niż 18 mm** — ostrzeżenie (liczby katalogowe szuflad są dla 18).
- **Wycięcie narożnika na całą wysokość nad nóżką** (przechodzi przez dno) — nóżka przesuwa się sama 10 mm za wycięcie (wzdłuż boku albo w głąb, gdzie bliżej), na wszystkich rysunkach i w 3D, z informacją; gdy obok nie ma miejsca — ostrzeżenie (decyzja użytkownika 2026-10-28, N122).
- **Wycięcie narożnika tylko w jednym poziomie a zawieszka** — zawieszka w górnym tylnym rogu boku wypadająca w wycięciu to błąd (N149).
- **Przelot bez przegrody** (`noDiv`): po stronie przelotu nie ma wierceń; półki albo rura kończące się w przelocie — błąd (N147).
- **Rura na wieszaki a wzmocnienie** w jej drodze — błąd z „Wzmocnienie N: X mm” albo „Usuń rurę” (N143).
- **Tip-on**: przykręcany tylko do płyty, która jest (bez dna / wieńca dół i góra światła to nie płyta) — bez płyty błąd; odbojnik 89 mm w głąb dłuższy niż do pleców — błąd (N145).
- **Blat roboczy**: kontrola wysokości blatów w rogu i w pomieszczeniu („odstaje o N mm”) z przyciskami wyrównania, zużycie arkusza (brakuje do 200 mm), odpad — opisane w `opisy/ciagi.md` i `opisy/rozkroj.md`.

## Skąd liczby

- **Blat**: arkusze 4100 × 600 / 1200 i ceny PB0090 Śnieżna biel z faktur użytkownika (2026-09-29); brak obracania blatu w rozkroju (2026-10-17).
- **Wzmocnienia pod blat**: para 100 mm i jej położenie — ustalone z użytkownikiem (narożnik: cofnięcie o front, odsunięcie o płytę).
- **Frez**: wręg 16 × 3 zlicowany z tyłem (zmiana starych ustawień przy wczytaniu).
- **Konfirmaty**: 50 mm od krawędzi, odstęp ok. 200 mm, min. 32 mm między dwoma.

## Gdzie w kodzie i testy

- **Obliczenia**: `computeGeo` — początek (wymiary, `joints`, `top`, plecy, `backIntrusion`, frez), `c.rails` (wzmocnienia), formatki na końcu (`P(...)`); `bezWienca`, `railPair`, `utrzymajPodBlat`, `konfirmatyNaStyk`.
- **Blat roboczy**: `runTop`, `kawalkiBlatu`, `worktopSpans`, `runTopPanels`, `runTopZlacza`, `worktopMsgs`; stałe `WORKTOP_LEN`, `WORKTOP_DEPTHS`, `WORKTOP_PRICES`.
- **Testy**: `podblatem`, `bezwienca`, `blat`, `blatrob`, `blatciag`, `blatmix`, `blatrog`, `blatwys`, `wreg`, `freztest`, `setback`, `topfixtest`, `nobot`, `audytmacierz`.
