# Założenia makiety „Dodaj” i ich stan w aplikacji

Spis wszystkiego, co ustaliliśmy przy makiecie testowej (`makiety/dodaj.html`) i później przy makiecie w aplikacji. Każdy punkt
jest porównany z aplikacją (`szafki.jsx`, tryb Makieta). Prośba użytkownika 2026-11-15: „zrób sobie plik założeń, jakie tam były
i co poprawialiśmy, i porównaj z tym, co mamy”.

Źródła: komentarze z datą w `makiety/dodaj.html` (43 decyzje), „Wersja 2–24” w `AI_NOTES.md`, `makiety/BRAKI.md`, rozmowy
z użytkownikiem do 2026-11-15.

Stan: **jest** — działa w aplikacji (test w nawiasie); **dorobione 15.11** — brakowało, dodane w tej zmianie; **inaczej** —
działa, ale inaczej niż w makiecie (powód); **do decyzji** — czeka na odpowiedź użytkownika.

Zasada na przyszłość: przy każdym porównaniu z makietą sprawdzamy nie tylko napisy i przyciski, ale też **zachowanie przy
przeciąganiu i dwukliku** (przyciąganie, linie pomocnicze, okienka). Tego zabrakło w rundach 3–4.

## 1. Rysunek — przeciąganie, dotknięcie, dwuklik

| Założenie (makieta) | Stan w aplikacji |
|---|---|
| Sprzęt / klocek / wzór z palety przeciągany na rysunek; zielone ramki tam, gdzie może stanąć | jest (`makieta4`, `makieta5`) |
| „Dotknij, potem miejsce” (telefon); pasek „Wybrany” | jest (13.11, `makieta16`) |
| Postawiony sprzęt przesuwany przeciąganiem (w słupku, na blacie, wycięcia), też w widoku „Z góry” | jest (`makieta12`, `makieta16`) |
| „Przesuń” w karcie (przesuwanie dotknięciem) | jest (`agd-przesun`) |
| Wzór upuszczony przed / za szafką (połowa szafki — „+” przy styku) | jest (`wstawWzor`, `przed`) |
| Szafka przesuwana w ciągu przeciągnięciem korpusu, znacznik „przed / za” | jest (`makieta6`) |
| Uchwyt szerokości (prawa krawędź), co 10 mm | jest |
| Uchwyt wysokości (górna krawędź; w kuchni nie dolna — pod blat), co 10 mm | jest |
| **Wysokość łapie górę szafki obok** (użytkownik 15.11: „moment złapania do wysokości szafki obok”) — 40 mm, napis „równo z „…””, ciągła zielona linia | dorobione 15.11 (`makLapanieWys`, `makieta17`); w pliku makiety uchwyt wysokości szedł co 10 mm bez łapania — łapała półka (45 mm) i przegroda (±15) |
| **Uchwyt dołu szafki górnej** (użytkownik 15.11: „górę szafki da się przesuwać, a dołu nie”) — łapie „jak inne”; po puszczeniu pytanie: tylko ta / cały ciąg (dół) / cały ciąg przesuń (decyzja 15.11) | dorobione 15.11 (`makLapanieDol`, `makieta-pytanie-dol`, `makieta18`) |
| **Blenda — górna krawędź przeciągana, łapie sufit i górę szafek obok** (użytkownik 15.11: „ręcznie nie da się złapać, żeby blenda była do sufitu”) | dorobione 15.11 (`makLapanieBlendy`, cały ciąg z tą samą górą, `makieta18`) |
| **Wysokość łapie sufit** („do sufitu”, z blendą) | dorobione 15.11 (`makieta18`) |
| Uchwyt głębokości z góry | jest |
| Przegroda przeciągana, co 10 mm, kolumna ≥ 100 | jest (`makieta15`) |
| **Przegroda ±15 mm od środka — przyciąga na środek** (Wersja 21) | dorobione 15.11 („— na środku”) |
| Szuflady: chwyt całej szuflady (górna połowa — linia nad nią, dolna — pod nią), linie między szufladami | jest (`makieta11`) |
| „Szuflada + drzwi”: szuflada przeciągana pod / nad drzwi, linia podziału (100–400) | jest (`makieta13`) |
| Półki przeciągane co 10 mm, ≥ 60 od sąsiednich, 40 od dołu / góry | jest (`makieta9`) |
| **„Równo z półką obok”** — półka najechana na półkę innej szafki / kolumny staje na tej wysokości, linia pomocnicza (Wersja 18) | dorobione 15.11 (`makLapaniePolek`, 45 mm, tylko z wskaźnikiem nad tamtą szafką / kolumną — jak w makiecie; `makieta17`) |
| Drążek przeciągany między półkami | jest |
| Uchwyty tylko w zaznaczonej szafce i tylko w swojej zakładce (Wersja 16–17) | jest |
| Pojedyncze kliknięcie tylko zaznacza; dwuklik / prawy przycisk — „Co zmienić?” | jest (`makieta8`) |
| Dwuklik na półce — światło pod / nad nią (najwyższa: od góry), „Usuń tę półkę” | jest |
| **W okienku półki „Półki po równo”** | dorobione 15.11 (`mak-polki-rowno`) |
| Dwuklik na przegrodzie — światła kolumn, „Przegroda na środek” | jest (`makieta15`) |
| Dwuklik na szufladzie — wysokość frontu | jest |
| **W okienku szuflady „Ta szuflada jak po równo”** (zmienia tylko tę) | dorobione 15.11 (`mak-szuflada-rowno`) |
| Esc przerywa przeciąganie | jest (`makieta15`) |
| Zielone ramki w miejscu szafek (też w widoku „Z góry”) | poprawione 14.11 (legenda przesuwała rysunek, `makieta17`) |

## 2. Widoki i przełączniki

| Założenie | Stan |
|---|---|
| „Z góry” + „Z przodu” razem; Z boku, 3D, 45° | jest |
| Przełączniki: Z góry, Ciąg górny, Ciąg dolny, Fronty, Blat, Wyposażenie, Kolory płyt, Wymiary | jest |
| **Panel nad rysunkiem zwijany jak paski w technicznym** (użytkownik 17.11: „zasłania rysunek”) — „▼”, jedna linia ze streszczeniem, zoom zostaje, pamięta przeglądarka | dorobione 17.11 (`mak-panel-zwin`, `makieta19`) |
| Blat z góry zasłania szafki dolne, podział na kawałki | jest (13.11) |
| **Ciąg górny widoczny na blacie z góry** (użytkownik 15.11: „blat zasłania ciąg górny”) | poprawione 15.11 |
| Rzut szafek górnych na blacie, „↑ górne N / ↓ wolne N” | jest |
| Ściana z szerokością (pole, ±100), „wolne / brakuje N mm”, „Poszerz ścianę”, „Usuń …” | jest (`makieta15`) |
| Lista „Ciąg” = ściany (ciąg górny idzie ze swoją ścianą) | poprawione 14.11 |
| W zakładkach z wnętrzem (Półki, Przegroda, Wzmocnienie) drzwi otwarte, szuflady zamknięte | poprawione 14.11 |
| Legenda nad rysunkiem | jest |

## 3. Karta Szafka

| Założenie | Stan |
|---|---|
| Wzory (1 drzwi 450, 2 drzwi 800, szuflady 600, zlewowa 800, słupek 600, szafa, komoda, biurko, biurko z kontenerem) | jest |
| Szerokość (chipy), front, wnętrze (półki, przegroda, drążek), wzmocnienia (para pod blat), „Co zrobi program”, „Przesuń w ciągu”, „Usuń” | jest (runda 3, `makieta15`) |
| Listy „Ciąg dolny / Ciąg górny” | jest |
| Szafka górna: dół od podłogi, front, półki, przegroda, „Bez szafki górnej” | jest |
| Cały ciąg górny: dół / góra od podłogi | jest |
| **Od blatu do dołu szafek górnych (prześwit) — pole** (użytkownik 15.11: „brak opcji wymiaru od blatu, stały 500”) | dorobione 15.11 (`mak-gorny-od-blatu`) |
| **Ciąg górny „do sufitu”** (użytkownik 15.11: „brak opcji przesunięcia szafki do samego sufitu”) | dorobione 15.11 (`mak-gorny-do-sufitu`) — na styk; na zawieszkach ostrzeżenie i „Blenda 100 mm do sufitu” (decyzja 15.11) |
| **Blenda nad szafką w karcie szafki górnej i słupka, „do sufitu”** (użytkownik 15.11: „gdzie jest opcja blendy nad górnymi?”) | dorobione 15.11 (było tylko w zakładce Ciąg i w szczegółowej) |
| Ciąg górny wzdłuż ściany: od lewej / od prawej, mm, „przy słupku” | dorobione 14.11 |
| **Ciąg górny to osobny ciąg** — jego wysokość idzie za jego szafkami (użytkownik 14.11) | poprawione 15.11 (bez „nie zgadza się z ciągiem” przy jednej szafce, bez „To słupek” przy górnej) |
| Wysokość słupka 1800 / 2000 / 2120 / 2200, „= równo z górnymi” | jest |
| Rodzaj zabudowy: kuchnia / szafa / wolnostojąca | jest |

## 4. Szuflady i półki

| Założenie | Stan |
|---|---|
| Szuflady 1–5, „usuń szuflady”, „Fronty po równo” | jest |
| **Wysokość każdej szuflady z osobna w karcie** (użytkownik 15.11: „szybka wysokość każdej z osobna”) | dorobione 15.11 (`mak-szufl-fronty`) |
| „Szuflada + drzwi”: u góry 170 / na dole 200, 1 / 2 drzwi, „Szuflada typowa” | jest |
| Szuflady w szafie na dole, typowo po 220 mm (Wersja 12, 21) | jest — po 220 też w słupku (decyzja 15.11: „220 wszędzie”, `MAK_SZUFL_SLUPEK`) |
| Półki po równo, półki w kolumnach przy przegrodzie, „pod drążkiem ↕N”, „↕N od góry” | jest |
| Drążek 60 mm pod półką (makieta) | jest — oś rury 60 mm pod płytą (decyzja 15.11: „to robimy 60”, `DRAZEK_POD_PLYTA`; było 70) |

## 5. AGD

| Założenie | Stan |
|---|---|
| Jeden kafelek na rodzaj (lodówka, mikrofala, ekspres, zmywarka), rodzaj w karcie | jest (10.11) |
| Płyta / zlew: rozmiary, wymiary z karty modelu, położenie od początku blatu i od przodu, ociekacz L / P | jest |
| Kontrole wycięć: szersze niż wnętrze, < 30 od końca blatu, nachodzenie / < 50 między, za blisko przodu / tyłu | jest (30 mm — decyzja 13.11) |
| Kaseta / komora pod blatem a wzmocnienie leżące — pomarańczowo na rysunku | jest |
| Słupek: piekarnik / mikrofala / ekspres, „Na wysokość blatu”, „Pod blat”, „Góra do dołu szafek górnych”, „Zamień miejscami”, „Razem”, −/+50 | jest |
| **Mikrofala wysoko (dół > 1300) — ostrzeżenie „w aplikacji też”** (08.11) | było tylko w karcie AGD; dorobione 15.11 w Uwagach |
| **Piekarnik za wysoko** (użytkownik 15.11) | dorobione 15.11 w Uwagach, próg 1100 (dół) — potwierdzony 15.11 |
| Okap: rodzaje, 50 / 60 / 90, dół okapu (pole, ±50, „650 nad płytą”), min. 650 / 750, szerszy niż szafka | jest |
| Lodówka: do zabudowy (wnęki 88–194, ślizgowo / na stałe / bez frontu, 1 / 2 fronty), podblatowa w ciągu, podblatowa w szafce (mała na dnie), wolnostojąca (luzy L / P / nad / tył, „na równo”) | jest (14.11) |
| Zmywarka do zabudowy 60 / 45, wolnostojąca pod blatem / z pokrywą | jest |
| Zmywarka: uchwyt i otwieranie klapą w dół | dorobione 14.11 |
| Mikrofala / ekspres wolnostojące na blacie: rozmiary, „wystaje przed blat” | jest |

## 6. Decyzje późniejsze (rozmowy 10–15.11)

| Decyzja | Stan |
|---|---|
| Para pod blat: płaskie z przodu, stojące z tyłu | jest |
| „Wystaje” lodówki — od przodu blatu | jest |
| Blat: zalecenie odsunięcia szafek od ściany; od końca blatu 30 mm; różne głębokości w rogu — informacja | jest |
| Głębokość dolnych kuchennych 550; nowy ciąg kuchenny 17 mm od ściany; szuflady NL 500 | jest (14.11) |
| Skrzydło a wysunięta szuflada obok — informacja, nie błąd | jest (14.11) |
| Złącze Sevroll Blendo do cokołu i blendy nad szafkami | jest (15.11): cokół — opcja, domyślnie klipsy, pod dnem; blenda nad szafką — domyślnie Blendo, opcja nóżki i klipsy jak cokół; co ok. 600 mm (zrzuty z filmu w `instrukcje/sevroll-blendo/`). Blenda przy ścianie — nowy element (15.11, `makieta18`): sama do ściany, w licu drzwi, pas w głąb wzdłuż boku szafki (bez Blendo — decyzja użytkownika) |
| Sufit ściany: pole „wys.” nad rysunkiem działa też dla ciągu górnego (uwaga o suficie liczy blendę) | poprawione 15.11 (`sufitSciany`) |
| Wzór „Szafa do zabudowy” w palecie „Szafa w zabudowie”: 2000 mm, drzwi przesuwne, cokół, bez blendy, do sufitu z luzem 5 mm (przy znanym suficie); karta Drzwi: „na zawiasach / przesuwne”, skrzydła (same / 2 / 3 / 4), szczotka odbojowa | jest (16.11, `makieta19`, `opisy/przesuwne.md`); szuflady na dół kolumny za drzwiami przesuwnymi — zabudowa pod szuflady (boki + wieniec), front wewnętrzny z podfrezem cofnięty o 80, prowadnica 18 nad dnem; bok V-BOX jaki się zmieści, opcja niski 127; wzór „Szafa do zabudowy z szufladami”; podwójne boki (zewnętrzny do podłogi, wewnętrzny cofnięty o 80), osobno z lewej / z prawej, we wzorach włączone, cokół w obrysie, bez nóżek; 17.11: wzór z szufladami — szuflady po obu stronach, bez drążka (wzór bez szuflad — z drążkiem); „odsuń skrzydło” w karcie Drzwi (2, 3, 4 skrzydła — rysunek, z góry, 3D), bez frontów front szuflady przygaszony jak wszędzie, pod nim prowadnice (decyzja 17.11) |
