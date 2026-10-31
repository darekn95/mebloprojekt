### N171 [P2] — DO WERYFIKACJI UI: drugi otwór pomijany w nazwie formatki przy dwóch elementach

**Test funkcji**, main `5f0d60075d3be5c27204df86cfbe25b790593432`: syntetyczna szafka 800 × 1200 × 560 mm, dwa poziomy z płytą między nimi, dwa elementy przez całą wysokość: lewy tylny 100 × 100 mm i prawy tylny 150 × 120 mm, oba z ustawioną opcją `otwory:true` odpowiadającą akcji „Wycinam otwory w płytach (na formatkach)”. `computeGeo` pokazuje dwie informacje o otworach, natomiast nazwę jednej formatki „Półka przelotowa — otwór 82 × 100” (przecięcie pierwszego elementu z płytą) i brak nazwy lub opisu drugiego otworu. `otworW` wyszukuje pierwszy pasujący element przez `find`, zamiast zebrać wszystkie. Zestawienie formatek może więc nie oddawać wszystkich operacji. Nie sprawdzono przycisków w interfejsie ani PDF; informacje o obu otworach w Uwagach istnieją, więc nie twierdzę, że informacje znikają całkowicie. Projekt jest syntetyczny.

**Sugestia GPT do weryfikacji, nie decyzja użytkownika:** dla każdej formatki zebrać wszystkie kolizje oznaczone do wycięcia, uwzględnić wymiary i położenia oraz sposób czytelnego przekazania ich do formatek i PDF. **Test odbioru:** dwa i więcej rozłącznych elementów, kolejność, różne wymiary, pojedynczy element jako kontrola, półka/przegroda, kliknięcie każdego przycisku, formatki, rysunek i PDF. NAPRAWIONE po pozytywnym sprawdzeniu.

---

### Dodatkowy niezależny retest N150–N153 i N156 — main `5f0d60075d3be5c27204df86cfbe25b790593432`

Poniższe wyniki uzupełniają i aktualizują wcześniejszy wpis: dla opisanych wariantów nie pozostają już wyłącznie testy funkcji.

- **N150 — NAPRAWIONE w sprawdzonym wariancie UI.** Dwie syntetyczne wolnostojące szafki z blatami 1000 × 300 i 1000 × 700 mm oraz jeden własny kawałek blatu 1000 × 1000 mm. W rozkroju formatka 1000 × 700 zajmuje własny kawałek, a 1000 × 300 osobny kupowany arkusz 4100 × 600; podsumowanie pokazuje 1 własny kawałek i 1 kupowany arkusz. Nie użyto jednej resztki dwukrotnie. Test funkcji dodatkowo sprawdził dwie resztki. Wyceny i pozostałych kombinacji nie sprawdzono.
- **N151 — NAPRAWIONE w sprawdzonym wariancie UI.** Wczytany syntetyczny ciąg: szafka A 600 × 720 × 560 i B 600 × 2000 × 560, własne blaty z płyty i blat roboczy ciągu. Formatki całego projektu pokazują blat ciągu 600 × 600 oraz własny blat B 600 × 590, po 1 sztuce. Własny blat wysokiej szafki nie znika; innych pozycji w ciągu i PDF nie sprawdzono.
- **N152 — NAPRAWIONE w sprawdzonym wariancie UI.** Szafki A bez pleców i B z HDF. Kreator scalania wyjaśnia różnicę i oferuje „płyty jak w A/B”. Po wybraniu B i kliknięciu „Scal” formatki zawierają plecy HDF; po cofnięciu, wybraniu A i ponownym scaleniu pleców HDF nie ma. Wybrany wynik jest jawny. Innych materiałów nie sprawdzono.
- **N153 — NAPRAWIONE w sprawdzonym wariancie UI.** Szafka 3100 × 2000 × 560 mm, drążek 3062 mm. Błąd wyjaśnia, że dwa kawałki nie tworzą jednej rury i oferuje podział oraz usunięcie. Podział przegrodą daje plan 2 odcinków po 1521 mm, każdy z rury 2 m, bez błędu pierwotnej rury. Po cofnięciu i kliknięciu „Usuń rurę” pierwotny błąd oraz rura i rozety z zamówienia znikają. Oddzielne ostrzeżenia o rozmiarach formatek/frontów nie są objęte tym wynikiem.
- **N156 — NAPRAWIONE w sprawdzonym wariancie UI.** Trzy szafki A, B, C po 600 × 720 × 560 mm. W kreatorze scalono A z B z wyborem „dwie przegrody”, następnie wynik A+B z C ponownie z wyborem „dwie przegrody”. Formatki scalonej szafki zawierają 4 przegrody pionowe 684 × 560 mm; poprzednio pierwsza para zmniejszała się do jednej. Innych układów i montażu nie sprawdzono.

**N154 — częściowo naprawione, powiązany problem N170 pozostaje OTWARTY.** W syntetycznym ciągu z dwoma dekorami Oak/Ash, po wyłączeniu i ponownym włączeniu „Wspólne dno”, komunikat prawidłowo informuje „Dno zostaje przy szafkach: szafki mają korpusy z różnych płyt”. Powstają dwa oddzielne dna. Jednak zbiorcze formatki nadal łączą je w jeden wiersz materiału Oak, mimo że druga szafka ma dekor Ash — szczegóły N170 poniżej. Nie zamykać całego problemu zakupowego przed sprawdzeniem N170. N167/N168 nadal wymagają wskazanej oceny montażowej; PDF-1 wymaga kontroli aktualnego PDF.

### N170 [P2] — OTWARTE: zbiorcze formatki i rozkrój łączą różne dekory o tym samym kolorze

**Test UI**, main `5f0d60075d3be5c27204df86cfbe25b790593432`: wczytać syntetyczny projekt dwóch szafek S0/S1 600 × 720 × 500 mm w jednym ciągu, płyta korpusu w obu o nazwie „Płyta”, grubości 18 mm i kolorze `#d8c3a0`, ale dekor S0 `Oak`, S1 `Ash`. Włączyć wspólne dno (w starym zapisie włączone: najpierw wyłączyć, potem włączyć). UI prawidłowo wyjaśnia, że dno zostaje przy szafkach z powodu różnych płyt. W karcie Płyty szafki S1 pokazuje „Płyta Ash”, ale zbiorcze formatki pokazują m.in. „Dno — S0 × 1, S1 × 1 — Płyta Oak — 600 × 500 — 2 szt.”; analogicznie łączone są inne formatki korpusu. Rozkrój projektu pokazuje jedną grupę „Płyta Oak” i jeden arkusz, bez osobnej grupy Ash. Prawidłowe wykrycie różnych dekorów przy wspólnym dnie nie gwarantuje poprawnego zakupowego zestawienia. Danych z rzeczywistego projektu nie użyto. Nie ustalono, czy taka kombinacja dwóch nazw dekoru i identycznego kodu koloru jest osiągalna bezpośrednio w obecnym formularzu; została odtworzona przez wczytanie syntetycznego projektu.

**Sugestia GPT do weryfikacji, nie decyzja użytkownika:** klucz scalania formatek w `projectCutList` porównuje nazwę, grubość, kolor i ID własnej płyty, lecz nie dekor; ocenić zastosowanie pełnej tożsamości płyty także przy tworzeniu wierszy i grup rozkroju, bez niezamierzonej zmiany zasad wyceny. **Test odbioru:** wczytany i ewentualnie utworzony w UI projekt z tymi samymi wymiarami i różnymi dekorami, odwrotna kolejność szafek, identyczny dekor jako kontrola, oddzielne formatki, zakup, własne resztki, PDF i ceny. Oznaczyć NAPRAWIONE po rzeczywistej weryfikacji.

---

# Niezależny retest poprawek — 30.10.2026, main `5f0d60075d3be5c27204df86cfbe25b790593432`

Poniższe statusy są aktualizacją starszych wpisów na tej gałęzi. **NAPRAWIONE w sprawdzonym wariancie** oznacza, że opisany przypadek odtworzono w izolowanej aktualnej aplikacji i sprawdzono faktyczny efekt przycisków; nie jest deklaracją pełnej kontroli wszystkich kombinacji, fizycznego montażu, PDF i wyceny. Wcześniejsze otwarte wpisy pozostawiono jako historię. Propozycje techniczne w raporcie są sugestiami GPT do weryfikacji, nie decyzjami użytkownika.

### N169 — NAPRAWIONE w obu sprawdzonych wariantach UI

- Drzwi: szafka 600 × 720 × 560 mm, trzy fronty, pierwszy zadany 198 mm, pozostałe auto. Aplikacja pokazuje 198/197/197 mm, wyjaśnia ręczny wymiar i oferuje „Wszystkie drzwi równo, luz 4 mm”. Po kliknięciu pokazuje trzy fronty 196 × 714 mm, a ostrzeżenie znika.
- Szuflady: ta sama szafka, trzy V-BOX, pierwszy front ręcznie 238 mm, dwa auto — 238/236/236 mm. Po kliknięciu „Wszystkie fronty równo, luz 3 mm” widoczne są trzy fronty po 236 mm i ostrzeżenie znika. Wcześniejsze przyciski zwiększające rozbieżność w tych wariantach nie są oferowane.

### N158, N159, N164, N165 — NAPRAWIONE w sprawdzonych wariantach UI

- N158: szafka 2100 × 2000 × 560 mm, jedna kolumna, 0 drzwi, drążek 2062 mm. Po kliknięciu „Podziel kolumnę przegrodą” są dwie kolumny po 0 drzwi, drążki pozostają, bez samoczynnego dodania frontów.
- N159/N164/N165: ta sama szerokość, dwa fronty, lewy fix 100 mm ze wspornikiem, pierwsze drzwi ręcznie 600 mm. Po kliknięciu podziału oba pola szerokości drzwi są automatyczne, nie ma błędu niewypełnionego pasma; formatki zawierają po 1 elemencie stałym i wsporniku, a UI pokazuje lewy zawias pierwszego i prawy drugiego skrzydła. Pozostają niezależne ostrzeżenia o dużych frontach poza tabelą. Przypadków z inną liczbą drzwi, prawym fiksem i pełnego zakresu otwierania nie sprawdzono w UI.

### N157 — NAPRAWIONE w sprawdzonym wariancie starszego projektu

Wczytano syntetyczny projekt 600 × 1200 × 560 mm z dwiema otwartymi kolumnami bez przegrody: lewa 1 półka, prawa 2. Komunikat uprzedza o zachowaniu wnętrza jednej kolumny i oferuje osobny wybór lewej/prawej. Kliknięcie prawej daje jedną kolumnę z 2 półkami; po cofnięciu kliknięcie lewej daje jedną kolumnę z 1 półką. W obu testach znika ostrzeżenie o przelocie. Nie badano wszystkich typów wnętrz ani dostępności tworzenia starej konfiguracji w obecnym UI.

### N166 — NAPRAWIONE w sprawdzonym wariancie UI

Szafka 600 × 300 × 80 mm, bez wieńca. „Dodaj parę wzmocnień pod blat” dodaje formatkę poziomą 564 × 62 mm zamiast 564 × 100 mm; ostrzeżenie o otwartym korpusie znika i nie pojawia się poprzedni błąd przekroczenia głębokości. Fizycznego montażu i innych głębokości w UI nie sprawdzono. Test funkcji obejmuje także przycisk korekty wcześniej zadanej formatki 100 mm; tego przycisku w UI w tej rundzie nie klikano.

### N145 — NAPRAWIONE w sprawdzanym zakresie braku płyty montażowej

Szafka 600 × 300 × 80 mm bez dna, wieńca i półek, jedne drzwi tip-on. Przy błędzie braku płyty są dwa przyciski. „Uchwyt zamiast tip-on” usuwa błąd oraz odbojnik z zamówienia, zaznacza uchwyt. Po cofnięciu „Dołóż półkę (tip-on na niej)” usuwa błąd braku płyty i pozostawia tip-on, ale pojawia się osobny błąd 89 mm odbojnika przy D80. Kliknięcie „Głębokość szafki 89 mm” usuwa tę kolizję; niezależny błąd kołków pozostaje i ma własny przycisk. Nie sprawdzano fizycznego montażu. Pozytywny wynik dotyczy również poprzednio sprawdzonego wariantu kolizji z plecami, a nie wszystkich możliwych kombinacji.

### N161 i N162 — NAPRAWIONE w sprawdzonych wariantach UI

- N161: wisząca 600 × 1200 × 560 mm, wycięcie 100 × 100 w górnym poziomie z zabudową, brak wieńca i wybrany wariant trójkątów. Zamiast twierdzić, że ścianka jest połączona z nieistniejącą płytą, ostrzeżenie oferuje „Dodaj wieniec”. Po kliknięciu widnieje informacja o połączeniu z wieńcem dwoma trójkątami oraz pozycja trójkątów w zamówieniu. Rzeczywistej nośności montażu nie oceniano.
- N162: wisząca 600 × 1200 × 560 mm, wycięcie 100 × 100 na całą wysokość wewnątrz zabudowanego elementu 200 × 150 w tym narożniku. Program zgłasza kolizję i kieruje zawieszkę na ściankę zabudowy elementu. „Bez zabudowy wycięcia” usuwa ten błąd bez ostrzeżenia o odsłonięciu; wskazanie zawieszki na ściance elementu pozostaje. Nie oceniano innych wzajemnych położeń ani montażu.

### N160 i N163 — NAPRAWIONE w sprawdzonym zestawieniu projektu

Wczytano syntetyczny górny ciąg z trzema szafkami, dwie z dystansami 50 i 100 mm. Zbiorcze zamówienie zawiera osobne wiersze listwy z grubością 50 i 100 mm (N160). Wkręty 4 × 30 dla zawieszek mają opis „zawieszki, 2 na zawieszkę”, a nie opis nieistniejących wzmocnień (N163). Indywidualne przyciski dystansów były kliknięte w poprzedniej rundzie; w tym reteście użyto wczytanego projektu. PDF i wyceny nie sprawdzono.

### N114 — NAPRAWIONE w sprawdzonych wariantach UI

Szafka 600 × 1200 × 560 mm z dwoma poziomami i syntetycznym elementem przez płytę: po kliknięciu „Wycinam otwory w płytach (na formatkach)” ostrzeżenie przechodzi w informację, a formatki mają oznaczone otwory. W odrębnym teście elementu od 400 do 700 mm kliknięto „Płyta nad element (poziom 1: 700 mm)”: poziom zmienił się na 700 mm i ostrzeżenie przecięcia przelotowej płyty znikło. Po cofnięciu „Płyta pod element (poziom 1: 382 mm)” ustawił 382 mm i również usunął tę uwagę. Inne półki i elementy mogą nadal wymagać osobnego sprawdzenia; rzeczywistego cięcia nie wykonano.

### N167 i N168 — częściowe potwierdzenie, pozostają DO OCENY

N167: po kliknięciu „Dodaj parę wzmocnień pod blat” w syntetycznej szafce narożnej 1000 × 720 × 560 mm, ramię 400, powstały dwie czołowe stojące płyty 60 mm odsunięte o 18 mm, zgodne ze sprawdzaną alternatywną regułą. To rozstrzyga zaobserwowaną różnicę działania przycisków w tym przypadku; poprawności fizycznego montażu jeszcze nie oceniono.

N168: test funkcji pokazuje, że dla ramienia liczba zaślepek odpowiada liczbie konfirmatów, a w zestawieniu szafki z ramieniem jest 16/16. Nie ustalono, które łby są faktycznie widoczne ani czy wszystkie wymagają zaślepek. Ocenę montażową zachować.

### Pozostałe zgłoszenia i zakres automatycznych testów

N150, N151, N152, N154, N156 i szerzej N153: testy funkcji w aktualnej wersji przechodzą dla scenariuszy w zestawie `testy/funkcje.mjs`, ale w tej rundzie nie odtworzono wszystkich wymaganych scenariuszy i przycisków w UI; nie oznaczać ich tu jako w pełni naprawionych. N155 pozostaje NAPRAWIONE w uprzednio sprawdzonym wariancie (zbiorczy model tip-on), teraz potwierdzonym także testem funkcji. PDF-1 pozostaje do osobnej kontroli aktualnego PDF i wydruku.

`node testy/funkcje.mjs`: **156 OK, 0 BLAD**. Zestaw `testy/audytgpt14.mjs` nie uruchomił się w tym środowisku Windows, ponieważ odwołuje się do nieistniejącej lokalnej ścieżki Playwright; powyższe testy UI wykonano niezależnie przez interfejs przeglądarki, nie przez ten skrypt.

---

### Retest przycisków podnośników klapy

**Test UI**, main `c201eb126a7baed70a943c16a3c93db4df62fb70`: zwykła szafka 600 × 400 × 560 mm, jedna klapa do góry 596 × 394 mm o wadze ok. 2,9 kg, jeden ręcznie wybrany podnośnik 50 N. Ostrzeżenie wskazuje zbyt małą siłę i oferuje „Zwiększ siłę do 150 N” oraz „Dołóż drugi — 2 × 80 N”. Kliknięto drugi przycisk: ostrzeżenie zniknęło, ustawienie siły pokazuje auto 80 N, a zamówienie 2 szt. podnośnika 80 N. Po cofnięciu kliknięto pierwszy przycisk: ostrzeżenie zniknęło, ustawienie pokazuje auto 150 N, zamówienie 1 szt. 150 N. Wynik obejmuje tę geometrię i odczyt tabeli aplikacji; nie jest potwierdzeniem fizycznego montażu ani innych wymiarów i kątów.

---

### N155 — NAPRAWIONE w sprawdzonym wariancie: model tip-on w zbiorczym zamówieniu

**Retest UI**, main `c201eb126a7baed70a943c16a3c93db4df62fb70`: syntetyczna zwykła szafka 600 × 720 × 560 mm, jedno skrzydło bez uchwytu z otwieraniem tip-on. Pojedyncze zamówienie pokazuje odbojnik GTV SALTO NOVA z numerem `AM-SVN-DL-MG-30`. Po powieleniu szafki i wybraniu „Produkty do zamówienia — Projekt” zbiorczy wiersz zachowuje opis „długi nakładany z magnesem, szary (AM-SVN-DL-MG-30)”, zastosowanie i prawidłową ilość 2 szt. Wcześniej w teście na `d601d4f` zbiorcze zamówienie gubiło oznaczenie modelu. Aktualny `scalOkucia` dodaje `model` do opisu. PDF, wyceny i innych modeli nie sprawdzono, dlatego status obejmuje wskazany zakres.

---

### N169 — dodatkowy wariant: fronty szuflad

**Dodatkowy wariant tego samego mechanizmu — szuflady, test UI:** zwykła szafka 600 × 720 × 560 mm, trzy szuflady V-BOX, ręczna wysokość pierwszego frontu 238 mm, pozostałe automatyczne; wynikowe wysokości 238, 236 i 236 mm przy luce 2 mm. Ostrzeżenie obiecuje identyczne fronty po zmianie luzu. Kliknięcie „Zwiększ luz do 3 mm” zmienia je na 238, 235 i 235 mm; różnica wzrasta do 3 mm, a ostrzeżenie znika. To ten sam błąd logiki `evenGapOptions`, nie odrębne zgłoszenie. **Test odbioru dodatkowo:** w analogiczny sposób sprawdzić fronty szuflad z różnymi ręcznymi wysokościami i rzeczywiste działanie obu kierunków zmian.

---

### N169 [P2] — OTWARTE: przycisk wyrównania drzwi zwiększa różnicę przy jednym ręcznym wymiarze

**Test UI**, main `c201eb126a7baed70a943c16a3c93db4df62fb70`: nowy syntetyczny projekt, zwykła szafka 600 × 720 × 560 mm, jedna kolumna, trzy drzwi. Ustawić szerokość pierwszych drzwi ręcznie na 198 mm, szerokości dwóch pozostałych zostawić automatyczne, luz między drzwiami 2 mm. Rysunek i formatki pokazują fronty 198, 197 i 197 mm. Ostrzeżenie mówi, że przy równym podziale fronty różnią się o 1 mm i zaleca zmianę luzu, „żeby formatki były identyczne”. Przycisk „Zwiększ luz do 3 mm” faktycznie kliknięto: szerokości stały się 198, 196 i 196 mm, a ostrzeżenie zmieniło różnicę na 2 mm. Kolejne kliknięcie oferowanego „Zwiększ luz do 4 mm” dało 198, 195 i 195 mm i ostrzeżenie zniknęło, mimo różnicy 3 mm. Przycisk „Zmniejsz luz do 2 mm” był dostępny po pierwszym kliknięciu, lecz w tym teście nie został kliknięty. Pierwszy wymiar jest ręczny i może być celowy; problem polega na tym, że komunikat i przyciski obiecują identyczne formatki, choć ich nie uzyskują. Źródło: wyznaczanie propozycji `evenGapOptions` wyrównuje pozostałe automatyczne fronty między sobą, podczas gdy rozrzut ostrzeżenia uwzględnia także wymiar ręczny; ostrzeżenie wyświetla się tylko do 2 mm różnicy.

**Sugestia GPT do weryfikacji, nie decyzja użytkownika:** uwzględnić wszystkie ręczne szerokości przy wyliczaniu i opisie proponowanych działań; proponować przycisk wyrównania tylko, jeśli rzeczywiście daje identyczne fronty, albo jasno wskazać konieczność zmiany ręcznego wymiaru. **Test odbioru:** trzy i więcej drzwi, 0/1/wiele ręcznych wymiarów, przypadki z i bez możliwego rozwiązania, oba przyciski i powtórne kliknięcia; porównać rzeczywiste formatki i pozostałe ostrzeżenia. NAPRAWIONE dopiero po pozytywnym teście.

---


### N153 — dodatkowy retest przycisków: podział przy nieparzystej szerokości

**Test UI**, main `c201eb126a7baed70a943c16a3c93db4df62fb70`: syntetyczna szafka 2101 × 2000 × 560 mm, jedna kolumna z ręczną szerokością 2065 mm, dwa fronty, jedna półka i rura 2063 mm. Kliknięto „Podziel kolumnę przegrodą” przy ostrzeżeniu o uginaniu rury: powstały dwie kolumny, lecz przy zaokrągleniu aplikacja pokazała błąd przekroczenia szerokości wnętrza o 1 mm. Błąd oferował „Rozłóż kolumny automatycznie”. Po kliknięciu przycisku błąd zniknął; w dwóch kolumnach pozostały krótsze rury. Inne uwagi (wysokość pod rurą i fronty poza tabelą zawiasów) pozostały i nie są objęte tym potwierdzeniem. W kontrolnym wariancie z automatyczną szerokością kolumny podział nie spowodował błędu 1 mm. Test funkcji dla W2100–2103 potwierdził, że ręcznie zadana szerokość przy nieparzystych wymiarach może spowodować błąd i przeliczenie na auto go usuwa.

**Wniosek:** w tym konkretnym wariancie komunikat z działającym przyciskiem jest akceptowanym sposobem rozwiązania według kryterium użytkownika; nie zgłaszać samego błędu 1 mm jako osobnego otwartego błędu. N158–N165 dotyczą innych skutków podziału i nie zostały w ten sposób zamknięte. Szerszy zakres N153 wymaga osobnych testów.

**Dodatkowo:** po podziale każda z dwóch kolumn miała ostrzeżenie o 903 mm pod rurą i przycisk „Półka nad rurą wyżej o 97 mm”. Kliknięto go osobno w każdej kolumnie. W każdej światło z rurą zmieniło się z 973 na 1070 mm (1000 mm pod rurą), sąsiednie z 973 na 876 mm, a odpowiadające ostrzeżenie zniknęło. Pierwsze kliknięcie nie zmieniło drugiej kolumny. To pozytywny wynik dla tego układu; innych konfiguracji i pełnego montażu nie sprawdzono.

---

### Retest przycisków — wąskie drzwi, wariant podstawowy

**Test UI**, main `c201eb126a7baed70a943c16a3c93db4df62fb70`: syntetyczna zwykła szafka 300 × 720 × 560 mm z dwojgiem drzwi po 147 mm. Ostrzeżenie proponuje jedne drzwi 296 mm i dwa przyciski wyboru strony zawiasów. Po kliknięciu wariantu prawego powstał jeden front 296 × 714 mm, ustawienie wskazuje „auto (P)” i ostrzeżenie o wąskich frontach znikło. Po cofnięciu i kliknięciu wariantu lewego powstał ten sam wymiar jednego frontu, ustawienie pokazuje „auto (L)” i ostrzeżenie znikło. Potwierdzenie dotyczy tego przypadku, nie przesądza o kolizjach otwierania ani innych konfiguracjach; brak podstaw do nowego błędu w tym wariancie.

---

### N143 — dodatkowy pozytywny retest skrócenia wzmocnienia

**Test UI**, main `c201eb126a7baed70a943c16a3c93db4df62fb70`: syntetyczna szafka 600 × 2000 × 560 mm, jedna półka, rura w dolnym świetle, pionowe wzmocnienie przy lewym boku, wysokość 1200 mm, głębokość 100 mm i 230 mm od lica. Program zgłasza osobno przecięcie półki i rury. Przy kolizji rury proponuje „Wzmocnienie 1: 1043 mm”; po kliknięciu kolizja rury znika, a błąd przecięcia półki pozostaje. Kliknięcie „Wzmocnienie 1: 973 mm” przy tym drugim błędzie ustawia wysokość 973 mm i usuwa oba sprawdzane błędy; niezależne uwagi w projekcie mogą pozostać. Rury nie usunięto. Potwierdza to działanie obydwu przycisków w opisanym wariancie, nie wszystkich wymiarów ani fizycznego montażu. Wcześniejszy status N143 NAPRAWIONE w zakresie przycisku usuwania rury pozostaje, ten wpis rozszerza zakres testu.

---

### N168 [P2] — DO WERYFIKACJI: konfirmaty ramienia narożnika bez odpowiadających zaślepek

**Obserwacja UI**, main `c201eb126a7baed70a943c16a3c93db4df62fb70`: projekt syntetyczny z domyślną szafką stojącą i narożnikiem L z szablonu, blatem ciągu i nóżkami. W „Produkty do zamówienia — Projekt” jest 20 konfirmatów 7 × 50, w tym 3 opisane jako złącza ramienia narożnika; pozycja zaślepek podaje 1 opakowanie (17 szt.). `cornerArmParts` dodaje konfirmaty dna ramienia do boku, lecz w tym miejscu nie dodaje odpowiadających im zaślepek. Opis zaślepek mówi „po jednej na widoczny łeb konfirmatu”, dlatego należy ustalić, czy te trzy łby są widoczne w konkretnym sposobie montażu i wymagają zaślepek; sama różnica 20–17 nie dowodzi tego bez oceny. W przykładzie liczba opakowań pozostaje taka sama, ale przy innych ilościach może mieć znaczenie dla zakupu. Przycisków brak do sprawdzenia w tym przypadku.

**Sugestia GPT do weryfikacji, nie decyzja użytkownika:** ustalić, które łby w boku ramienia i przy półkach są widoczne, i uwzględnić odpowiednie zaślepki, jeśli są potrzebne. **Test odbioru:** ramię z dnem/wieńcem i półkami na konfirmatach, różna głębokość, ukryty i widoczny bok, liczby blisko granicy 25 szt., zamówienie i wycena. NAPRAWIONE po pozytywnej weryfikacji.

---

### N167 [P2] — DO OCENY MONTAŻOWEJ: przycisk pary wzmocnień pomija regułę szafki narożnej

**Test funkcji**, main `c201eb126a7baed70a943c16a3c93db4df62fb70`: szafka narożna 1000 × 720 × 560 mm, ramię 400, oba złącza wieńca `brak`, bez wzmocnień. Ostrzeżenie proponuje akcję `parablat:0:0`, której obsługa dodaje `railPair()` bez argumentów. To tworzy z przodu płaską formatkę 964 × 100 mm i z tyłu stojącą 961 × 100 mm, obie z odsunięciem 0. Natomiast istniejąca funkcja `bezWienca` dla tego samego narożnika tworzy dwie stojące płyty 964 × 60 i 961 × 60, z odsunięciem 18 mm od przodu/tyłu, zgodnie z komentarzem w kodzie o połączeniu z kątownikiem. W UI odtworzono narożnik z szablonu 900 × 720 × 560, ramię 640 i blat ciągu: usunięto istniejącą parę i pojawiły się dwa ostrzeżenia. Kliknięcie „Dodaj parę wzmocnień pod blat” dodało przednią płytę poziomą o głębokości 100 i tylną wysokości 100, z odsunięciami 0; w ramieniu formatki 722 × 100 i 1143 × 100. Po cofnięciu kliknięto drugi przycisk „Dołóż parę wzmocnień”: powstały dwie stojące płyty o wysokości 60 i odsunięciach 18, a w ramieniu formatki 658 × 60 i 1143 × 60. Oba usunęły ostrzeżenie o braku wzmocnień. Rzeczywiste dopasowanie i fizyczny montaż wymagają oceny; różnica sama nie przesądza, który wariant jest właściwy.

**Sugestia GPT do weryfikacji, nie decyzja użytkownika:** porównać działanie przycisku z regułą narożną i po potwierdzeniu zastosować właściwą parę w danym kontekście. **Test odbioru:** lewy i prawy narożnik, różne grubości frontu, z blatem i bez, przycisk, 3D, styki, formatki i zamówienie. NAPRAWIONE dopiero po pozytywnych wynikach.

---

### N166 [P2] — OTWARTE: przycisk dodania pary wzmocnień tworzy błąd przy płytkiej szafce

**Test UI**, main `c201eb126a7baed70a943c16a3c93db4df62fb70`: szafka 600 × 300 × 80 mm bez wieńca, z ostrzeżeniem „nad tą kolumną nie ma wieńca ani wzmocnienia”. Kliknięcie „Dodaj parę wzmocnień pod blat” dodaje wzmocnienie poziome głębokości 100 mm, które wystaje 20 mm poza korpus 80 mm, i pojawia się nowy błąd z instrukcją ręcznej korekty, bez przycisku przy tym błędzie. W tym teście szafka miała także tip-on; po dodaniu pary znika błąd braku płyty, ale pojawia się osobny błąd tip-on wchodzącego w plecy. Powtórzenie bez tip-on daje ten sam błąd. Ręczna zmiana głębokości poziomego wzmocnienia z 100 na 80 mm usuwa wskazany błąd i zmienia formatkę na 564 × 80 mm; niezależne ostrzeżenia o nóżkach i konfirmatach pozostają. Nie sprawdzono fizycznego montażu ani pozostałych konfiguracji.

**Sugestia GPT do weryfikacji, nie decyzja użytkownika:** przy tworzeniu pary uwzględnić dostępną głębokość albo zaoferować wykonalną zmianę; ocenić skutki montażowe przed ustaleniem wymiaru. **Test odbioru:** D80 oraz wartości poniżej, na i powyżej 100 mm, z i bez pleców, wymiar formatek, 3D, mocowanie, zamówienie, wszystkie proponowane przyciski i ewentualne nowe kolizje. Oznaczyć NAPRAWIONE po pozytywnych testach.

---

### N165 [P2] — OTWARTE: podział kolumny zmienia stronę zawiasów prawego skrzydła

**Test funkcji i UI**, main `c201eb126a7baed70a943c16a3c93db4df62fb70`: szafka 2100 × 2000 × 560 mm, jedna kolumna z dwojgiem drzwi z automatycznymi zawiasami i drążkiem 2062 mm. Przed podziałem `computeGeo` wyznacza zawiasy lewego skrzydła po lewej, prawego po prawej. Ostrzeżenie o uginaniu proponuje „Podziel kolumnę przegrodą”. Po kliknięciu powstają dwie kolumny z jednymi drzwiami każda i dwa drążki 1021 mm, ale `computeGeo` wyznacza oba zawiasy po lewej. UI pokazuje dla obu nowych skrzydeł „auto (L)”; nie wyjaśnia zmiany kierunku prawego skrzydła. Przed podziałem i po nim są niezależne ostrzeżenia o dużych frontach poza tabelą GTV. Kliknięcie „z prawej” dla drugiej kolumny w UI zmienia jej ustawienie na „auto (P)” i przywraca stronę prawą; nie sprawdzono całego zakresu otwierania i kolizji.

**Sugestia GPT do weryfikacji, nie decyzja użytkownika:** rozważyć zachowanie rzeczywistych kierunków istniejących skrzydeł lub jasno pokazać ich zmianę z wyborem; sprawdzić wpływ na otwieranie i dobór zawiasów. **Test odbioru:** para automatyczna i ręczne strony, inna liczba drzwi, fix lewy/prawy, otwieranie i kolizje, lista okuć, kliknięcia oraz cofanie; NAPRAWIONE po pozytywnym teście.

---

### N164 [P2] — OTWARTE: podział kolumny sam powiela boczny fix i jego wspornik

**Test UI**, main `c201eb126a7baed70a943c16a3c93db4df62fb70`: szafka 2100 × 2000 × 560 mm, jedna kolumna z dwoma drzwiami, lewy fix 100 mm i pionowy wspornik (dodany działającym przyciskiem przy błędzie zawiasu), drążek 2062 mm. Przed podziałem formatki zawierają jeden element stały 2000 × 100 i jeden wspornik 1964 × 100. Kliknięcie „Podziel kolumnę przegrodą” przy ostrzeżeniu drążka tworzy dwie kolumny z drążkami 1021 mm i usuwa ostrzeżenie o drążku, ale każda z kolumn ma lewy fix 100 i wspornik; formatki obu rosną z 1 do 2 sztuk. Drugi fix pojawia się przy środku frontu, bez uprzedzenia w komunikacie. W UI kliknięcie „brak” przy fiksie drugiej kolumny usuwa dodatkowy fix i wspornik z formatek (po 1 szt.), ale zmienia szerokość drugich drzwi; pozostaje niezależne ostrzeżenie o dużym froncie poza tabelą zawiasów. Nie sprawdzono wszystkich skutków montażowych ani innych stron. Test funkcji wskazał analogiczne powielanie prawego fiksu.

**Sugestia GPT do weryfikacji, nie decyzja użytkownika:** ocenić zachowanie bocznych fiksów i wsporników przy podziale, pokazać skutki lub zachować element tylko po odpowiedniej stronie; sprawdzić zawiasy i pozostałą geometrię. **Test odbioru:** lewy/prawy/górny fix, ze wspornikiem i bez, 0/1/wiele drzwi, kliknięcie akcji i korekt, formatki, okucia, 3D oraz cofanie; NAPRAWIONE dopiero po pozytywnej weryfikacji.

---

### N163 [P3] — OTWARTE: zbiorczy opis wkrętów zawieszek przypisuje je wzmocnieniom

**Test UI**, main `c201eb126a7baed70a943c16a3c93db4df62fb70`: syntetyczny projekt ze standardowymi szafkami, w tym trzy wiszące bez wzmocnień, każda z dwiema zawieszkami. W pojedynczej szafce pozycja „Wkręt 4 × 30” wyjaśnia „zawieszki 2×2 szt.”; w zbiorczej liście projektu ilość 12 szt. jest poprawną sumą, ale specyfikacja brzmi „wzmocnienia i kątownik skręcane na licu — 4 na wzmocnienie, kątownik co ok. 200 mm”, choć w tym projekcie nie ma wzmocnień ani kątownika i wkręty są potrzebne do zawieszek. Nie twierdzę, że liczba jest błędna. `scalOkucia` zastępuje szczegółową specyfikację stałym `use` wiersza, który nie wymienia zawieszek; może to utrudnić przypisanie wkrętów do montażu. PDF nie sprawdzono.

**Sugestia GPT do weryfikacji, nie decyzja użytkownika:** zachować w zbiorczym opisie faktyczne zastosowania i ilości dla zawieszek, wzmocnień i podwójnych przegród, bez zmiany prawidłowej liczby lub klucza ceny. **Test odbioru:** osobno zawieszki, wzmocnienia, podwójne przegrody i mieszane projekty, lista szafki, projekt, PDF i wycena; status NAPRAWIONE po pozytywnych testach.

---

### N162 [P2] — DO WERYFIKACJI UI: zabudowa wycięcia i zawieszka wchodzą w większy element tego samego narożnika

**Test funkcji**, main `c201eb126a7baed70a943c16a3c93db4df62fb70`: wisząca szafka 600 × 1200 × 560 mm, wycięcie lewego tylnego narożnika 100 × 100 mm przez całą wysokość z zabudową oraz element kolizyjny 200 × 150 mm w tym samym narożniku, od boku i tyłu 0, przez całą wysokość. `geoCuts.maskWalls` opisuje ściankę boczną wycięcia jako x=100..118, z=0..100, y=18..1182, natomiast `geoObs` opisuje element jako x=0..200, z=0..150, y=18..1182: bryła ścianki w całości wchodzi w element. Program planuje zawieszkę na tej ściance i podaje informację o jej zamocowaniu; nie zgłasza tego przecięcia jako błędu. Element bez zabudowy wywołuje tylko ogólną uwagę, że nie jest odgrodzony; po włączeniu jego zabudowy program dodatkowo tworzy drugą ściankę przy x=200..218, ale nadal wybiera zawieszkę na pierwszej ściance wewnątrz elementu. Kontrola bez elementu nie ma wskazanego przecięcia. W UI potwierdzono osiągalność podobnego układu: wycięcie 100 × 100 mm w górnym poziomie oraz element 200 × 150 mm na całą wysokość w lewym narożniku, oba zabudowane. Widnieje informacja, że zawieszka jest na ściance zabudowy wycięcia, bez osobnego komunikatu o kolizji tej ścianki z elementem; jest niezależne ostrzeżenie o elemencie przechodzącym przez półkę między poziomami. Powyższe współrzędne dotyczą testu funkcji z wycięciem na całą wysokość; nie potwierdzono niezależnie brył wariantu z UI.

**Sugestia GPT do weryfikacji, nie decyzja użytkownika:** ocenić łączne obrysy przeszkód i zabudów, unikać formatek w kolizji oraz umieścić zawieszkę na rzeczywiście dostępnej ściance albo pokazać wykonalny wybór. **Test odbioru:** obie kolejności i strony, mniejszy/większy element, maski włączone i wyłączone, inne poziomy; kliknąć działania, skontrolować bryły, mocowania, formatki i zamówienie. NAPRAWIONE tylko po pomyślnych testach.

---

### N161 [P2] — OTWARTE: trójkąty ścianki z zawieszką odwołują się do nieistniejącego wieńca

**Test funkcji**, main `c201eb126a7baed70a943c16a3c93db4df62fb70`: szafka 600 × 1200 × 560 mm, dwa poziomy, lewy tylny narożnik wycięty 100 × 100 mm w górnym poziomie, zabudowa włączona, zawieszki, oba złącza górne `none` (brak wieńca). Informacja o ściance z zawieszką proponuje „złącz ją mocno z wieńcem, np. 2 trójkątami” z akcją `zawmoc:wyc:L:trojkaty`. Po ustawieniu odpowiadającego jej `zawMocowanie=trojkaty` informacja twierdzi „Ścianka złączona z wieńcem 2 trójkątami”, plan zawiera „trójkąt meblowy — wieniec”, a zamówienie dwa trójkąty, mimo że w formatkach brak wieńca. Niezależne ostrzeżenie o otwartym korpusie proponuje parę wzmocnień pod blat, ale nie sprawdzono, czy zapewnia właściwe zamocowanie ścianki. Kontrola z wieńcem ma fizyczną formatkę i ten sam plan. Potwierdzono w UI: szafka 600 × 1200 × 560, dwa poziomy, wycięcie 100 × 100 tylko w górnym, zabudowa, nóżki wyłączone i wieniec wyłączony. Po kliknięciu „2 trójkąty pod wieńcem” informacja twierdzi, że ścianka jest złączona z wieńcem, a do zamówienia trafiają dwa trójkąty pomimo braku wieńca. Pozostaje niezależne ostrzeżenie o otwartym korpusie. Kliknięto też „Dodaj parę wzmocnień pod blat”: zniknęło ostrzeżenie o otwartym korpusie, pojawiły się dwie formatki wzmocnień, lecz wieniec nadal nie istnieje, a opis połączenia z wieńcem pozostaje. Nie sprawdzono, czy wzmocnienia dają odpowiednie podparcie w rzeczywistym montażu.

**Sugestia GPT do weryfikacji, nie decyzja użytkownika:** uzależnić propozycję i opis mocowania od faktycznej płyty nośnej; ustalić wykonalną konstrukcję lub jasno wskazać brak możliwości. **Test odbioru:** bez wieńca, zwykły wieniec, blat, wzmocnienia i obie strony; kliknąć oferowane działania i sprawdzić bryły, plan i zamówienie. NAPRAWIONE tylko po pozytywnej weryfikacji.

---

### N160 [P2] — OTWARTE: zbiorcze zamówienie miesza różne grubości dystansów zawieszek

**Test funkcji**, main `c201eb126a7baed70a943c16a3c93db4df62fb70`: syntetyczny ciąg górny, trzy wiszące szafki 600 × 720 × 300 mm z listwą, wysunięcia 0, 50 i 100 mm. Dla drugiej i trzeciej ustawiono odpowiednie dystanse 50 i 100 mm, odpowiadające akcjom przy komunikacie. `odScianyMsgs` pokazuje dwie informacje o dobranych dystansach bez błędu. `projectParts` zawiera dwie listwy dystansowe: 0,6 mb grubości 50 mm i 0,6 mb grubości 100 mm. Jednak `scalOkucia`, wykorzystywane dla zbiorczego zamówienia projektu, łączy je w jedną pozycję 1,2 mb o specyfikacji „szafka wisząca z dala od ściany”, bez żadnej grubości. Nie można z tego wiersza zamówić właściwych odcinków. Po przełączeniu całego ciągu na haki UI pokazuje analogicznie jeden wiersz „Klocek dystansowy pod hak”, 4 szt., bez grubości, mimo że dwie szafki mają dystans 50 i 100 mm. Potwierdzono w UI: dla drugiej i trzeciej szafki ustawiono wysunięcia 50 i 100 mm oraz kliknięto kolejno „Listwa na dystansie 50 mm” i „Listwa na dystansie 100 mm”. Każdy błąd zniknął i indywidualna pozycja pokazała właściwą grubość, jednak „Produkty do zamówienia — Projekt” pokazuje jedną listwę dystansową 1,2 mb ze specyfikacją „szafka wisząca z dala od ściany”, bez grubości. PDF nie sprawdzono.

**Sugestia GPT do weryfikacji, nie decyzja użytkownika:** zachować i rozróżnić grubości przy sumowaniu listw i klocków, sprawdzić długości i oznaczenia dla wielu szafek oraz ceny. **Test odbioru:** różne i jednakowe dystanse, listwy i haki, szafki w ciągach i poza nimi, rzeczywisty wynik po kliknięciu przycisków, zbiorcze zamówienie, wycena i PDF. Oznaczyć NAPRAWIONE po pomyślnym sprawdzeniu.

---

### N159 [P2] — OTWARTE: podział kolumny zostawia niepasującą ręczną szerokość drzwi

**Wersja i test UI:** `standalone.html` z main `c201eb126a7baed70a943c16a3c93db4df62fb70`, syntetyczna szafka 2100 × 2000 × 560 mm, jedna kolumna, dwa drzwi, szerokość pierwszych zadana 600 mm, drugich automatyczna, drążek 2062 mm. Ostrzeżenie o uginaniu oferuje „Podziel kolumnę przegrodą”. Po kliknięciu dwie kolumny mają szerokość światła 1023 mm, lecz pierwsze drzwi nadal mają zadaną szerokość 600 mm. Program zgłasza błąd „zadane szerokości drzwi nie wypełniają pasma — różnica 446 mm” bez przycisku rozwiązania przy tym błędzie. Przed podziałem oba fronty wypełniały pasmo (600 i 1494 mm), choć szerszy miał niezależne ostrzeżenie o tabeli zawiasów. Sama obecność pola do ręcznej zmiany nie jest przetestowanym przyciskiem przy komunikacie. W teście funkcji wariant z obiema szerokościami zadanymi powodował również wystawanie frontów. Sprawdzono w UI: ręczne wyczyszczenie pola szerokości pierwszych drzwi usuwa ten błąd i ustawia dwa fronty po 1046 mm; pozostają niezależne ostrzeżenia o frontach poza tabelą GTV. Nie jest to przycisk przy komunikacie.

**Sugestia GPT do weryfikacji, nie decyzja użytkownika:** przy podziale ocenić ręczne szerokości dla nowego pasma, zaproponować właściwą zmianę lub przycisk przy błędzie; sprawdzić skutki dla frontów i zawiasów. **Test odbioru:** wartości auto/ręczne, jedna i większa liczba drzwi, przycisk rozwiązania i jego skutek, formatki, kolizje, zamówienie i cofanie; oznaczyć NAPRAWIONE dopiero po pozytywnych testach.

---

### N158 [P2] — OTWARTE: podział kolumny z drążkiem sam dodaje drzwi

**Wersja i odtworzenie UI:** lokalny standalone z main `c201eb126a7baed70a943c16a3c93db4df62fb70`; projekt syntetyczny, szafka 2100 × 2000 × 560 mm, jedna kolumna „Półki i drzwi”, liczba drzwi 0, półek 0, jeden drążek. W uwagach ostrzeżenie, że drążek 2062 mm może się uginać, i przycisk „Podziel kolumnę przegrodą”. Przed kliknięciem brak drzwi w formatkach. Po kliknięciu są dwie kolumny i dwa krótsze drążki 1021 mm, ale program sam dodaje po jednych drzwiach: dwie formatki 1994 × 1046 mm, dwa uchwyty, po pięć zawiasów na każde skrzydło oraz dwa nowe ostrzeżenia o frontach poza tabelą GTV. Przycisk nie zapowiada dodania drzwi. Test funkcji `kolumnaNaDwie` potwierdził też kontrolne przypadki 1 i 2 drzwi; przy 0 kod wymusza minimum 1 drzwi na obie nowe kolumny.

**Sugestia GPT do weryfikacji, nie decyzja użytkownika:** zachować brak drzwi przy podziale bezdrzwiowej kolumny; przeanalizować również podział frontów o ręcznych szerokościach, klap i innych wnętrz. **Test odbioru:** kliknąć akcję dla 0, 1, 2 i większej liczby drzwi, sprawdzić fronty, okucia, drążki, formatki, nowe uwagi i cofnięcie; oznaczyć NAPRAWIONE dopiero po pozytywnych wynikach.

---

### N157 [P2] — OTWARTE: akcja „Jedna kolumna” usuwa półki drugiej kolumny bez uprzedzenia

**Wersja i test UI:** lokalna kopia standalone z main `c201eb126a7baed70a943c16a3c93db4df62fb70`, dane syntetyczne. Wczytać starszy projekt szafki 600 × 1200 × 560 mm z dwiema otwartymi kolumnami, w lewej `noDiv=true` i jedna półka (`shelfTargets:[300,null]`), w prawej dwie półki (`shelfTargets:[200,200,null]`). Przed kliknięciem formatki mają 3 półki 282 × 560 mm; uwaga o braku przegrody proponuje „Przywróć przegrodę” i „Jedna kolumna na całą szerokość”. Kliknąć drugi przycisk. Ostrzeżenie znika i widnieje „bez uwag”, ale pozostaje jedna półka 564 × 560 mm, a dwie półki prawej kolumny znikają; kołki zmniejszają się z 12 do 4. Komunikat przed kliknięciem nie wyjaśnia utraty prawej konfiguracji. Test funkcji potwierdza, że `kolumnaZPrzelotu` wybiera wnętrze lewej, gdy obie mają półki. Odtworzono przez wczytanie syntetycznego starszego projektu — nie ustalono, czy taką konfigurację da się utworzyć obecnym interfejsem. Przycisku „Przywróć przegrodę” w tym wariancie nie sprawdzono.

**Sugestia GPT do weryfikacji, nie decyzja użytkownika:** przed połączeniem różnych wnętrz pokazać skutki i pozwolić wybrać zachowywany układ albo zaproponować zachowanie możliwych elementów; ocenić skutki geometrii i podparcia. **Test odbioru:** obie kolumny o różnych półkach i drążkach, jedna pusta, różne rodzaje wnętrza, zmiana kolejności, kontrola przycisku, formatek, okuć i cofania. Oznaczyć NAPRAWIONE dopiero po pozytywnym sprawdzeniu.

---

### N145 — wariant bez płyty montażowej pozostaje OTWARTY

**Test UI, main `c201eb126a7baed70a943c16a3c93db4df62fb70`:** szafka 600 × 300 × 80 mm, bez dna i wieńca (złącza `brak`), bez półek i wzmocnień, jedno skrzydło z tip-on. Błąd „tip-on nie ma płyty do przykręcenia ... Dołóż półkę albo wzmocnienie, albo daj uchwyt” nie ma żadnego przycisku. Odbojnik pozostaje w zamówieniu. Inne ostrzeżenie o otwartej górze ma przycisk „Dodaj parę wzmocnień pod blat”. Po kliknięciu błąd braku płyty znika, lecz w szafce D80 wzmocnienie o głębokości 100 mm wychodzi poza korpus, pojawia się nowy błąd, a dodatkowo pokazuje się błąd tip-on 89 mm wchodzącego w plecy (ten drugi ma przyciski). Ta akcja może pomóc znaleźć płytę montażową, ale nie jest pełnym rozwiązaniem w tym przykładzie. Nie sprawdzono fizycznego montażu.

**Sugestia GPT do weryfikacji, nie decyzja użytkownika:** przy błędzie braku płyty rozważyć wykonalne przyciski, np. zmiana na uchwyt lub dodanie odpowiedniej płyty, po kontroli geometrii i pozostałych kolizji. **Test odbioru:** oba sposoby i ich skutki, płytkie/głębokie szafki, zamówienie i inne błędy. Zachować osobny status od naprawionego wariantu kolizji z plecami.

---

### N145 — NAPRAWIONE w sprawdzonym wariancie: przyciski błędu tip-on w płytkiej szafce

**Retest UI, main `c201eb126a7baed70a943c16a3c93db4df62fb70`:** syntetyczna szafka 600 × 300 × 80 mm, HDF, półka, dwoje drzwi, jedno bez uchwytu z tip-on. Błąd o odbojniku 89 mm wchodzącym w plecy ma dwa przyciski. Kliknięcie „Głębokość szafki 89 mm” ustawiło D=89, usunęło błąd tip-on i zmieniło głębokości formatek; pozostały niezależne ostrzeżenia płytkiego korpusu i błąd kołków. Kliknięcie przycisku „Ustaw 39 / 39 mm” usunęło błąd kołków, a w zamówieniu pokazało 39 mm od obu krawędzi. Po cofnięciu i kliknięciu „Uchwyt zamiast tip-on” zaznaczono uchwyt, zniknął błąd tip-on i odbojnik z zamówienia; pozostał niezależny błąd kołków. Oba przyciski faktycznie kliknięto. Test funkcji 339 kombinacji sugerowanej głębokości (D 40–130, opcje uwzględniania pleców/frontu, tryby frontu i różne plecy) nie pozostawił błędu tip-on po zastosowaniu proponowanej wartości. Wynik dotyczy sprawdzanej kolizji z plecami; wariant braku płyty montażowej opisano osobno powyżej; pełnego 3D i PDF nie zweryfikowano.

---

### N114 — uzupełnienie do weryfikacji przycisku: ostrzeżenie o otworze w półce między poziomami

**Test UI, main `c201eb126a7baed70a943c16a3c93db4df62fb70`:** szafka 600 × 1200 × 560 mm z dwoma poziomami; element kolizyjny 200 × 150 mm przez całą wysokość w lewym tylnym narożniku. Program ostrzega: „Element kolizyjny przechodzi przez płytę między poziomami 1 i 2 ... wytnij w niej otwór 200 × 150 mm albo przesuń poziom”. Przy tym ostrzeżeniu jest tylko przycisk oznaczenia jako przeczytane; nie ma przycisku wykonania sugerowanego działania. W tym projekcie występują też inne, niezależne uwagi. Wcześniejsza naprawa N114 polegająca na wykrywaniu przecięcia nie jest kwestionowana; ten wpis dotyczy późniejszego kryterium użytkownika o sprawdzeniu działających przycisków, nie ponownego zgłoszenia starego braku ostrzeżenia.

**Sugestia GPT do weryfikacji, nie decyzja użytkownika:** ocenić, czy można zaproponować przycisk bezpiecznej zmiany poziomu lub inny wykonalny wybór; nie zakładać automatycznego wycinania ani sposobu montażu. **Test odbioru:** rzeczywisty efekt przycisku i brak nowych kolizji, opis otworu i formatki, różne wymiary i wysokości elementu. Oznaczyć rozwiązanie dopiero po sprawdzeniu.

---

### Uzupełnienie testów UI — N155 i przycisk kołków

W odizolowanej lokalnej kopii aplikacji z main d601d4fe87eb8a2117b8ab1b1c7e3c25e079272e przetestowano syntetyczną szafkę 600 × 300 × 80 mm z tip-on. Lista pojedynczej szafki pokazała model AM-SVN-DL-MG-30; po powieleniu szafki zbiorcza lista projektu pokazała tylko ogólną nazwę odbojnika i ilość 2, bez kodu modelu. N155 potwierdzono także w interfejsie; pozostaje OTWARTE. PDF nie był sprawdzony.

Przycisk ostrzeżenia „Ustaw 35 / 35 mm” w tym samym syntetycznym przypadku został kliknięty: ostrzeżenie zniknęło, a zestawienie pojedynczej szafki pokazało cztery otwory na kołki 35 mm od przodu i tyłu. Potwierdza to działanie przycisku w tym konkretnym przypadku, nie we wszystkich konfiguracjach.

---

### N156 [P2] — OTWARTE: ponowne scalanie usuwa wcześniejszą podwójną przegrodę

**Test funkcji**, main `d601d4fe87eb8a2117b8ab1b1c7e3c25e079272e`: trzy sąsiednie szafki A, B, C 600 × 720 × 560 mm, ten sam ciąg i materiały. Połączyć A i B z opcją dwóch przegród na styku (`scalSzafki(..., „dwie”)`): powstają dwie płyty 684 × 560 i flaga `przegrodaPodw`. Następnie połączyć wynik z C, ponownie wybierając dwie przegrody. `scalenieBlad` nie zgłasza przeszkody, lecz po drugim scaleniu na wcześniejszym styku jest jedna przegroda, na nowym dwie; lista ma 3 zamiast 4 płyt. Funkcja usuwa flagi podwójnych przegród z kopiowanych kolumn. Interfejs, ostrzeżenia i przyciski nie zostały sprawdzone.

**Sugestia GPT do weryfikacji, nie decyzja użytkownika:** zachowywać istniejące przegrody wewnątrz każdej scalanej szafki, a wybrany tryb stosować do nowych styków. **Test odbioru:** kolejne scalanie w obu trybach, wiele poziomów, pozycje i szerokości kolumn, wiercenia, formatki, zamówienie oraz przyciski; NAPRAWIONE dopiero po pozytywnej weryfikacji.

---

### N155 [P3] — OTWARTE: zbiorcza lista okuć gubi numer modelu tip-on

**Test funkcji**, main `d601d4fe87eb8a2117b8ab1b1c7e3c25e079272e`: szafka 600 × 720 × 560 mm z jednymi drzwiami bez uchwytu i otwieraniem tip-on. `computeGeo` generuje pozycję „Odbojnik tip-on GTV SALTO NOVA” o specyfikacji „długi nakładany z magnesem, szary (AM-SVN-DL-MG-30)” i z informacją o szczelinie. Po `scalOkucia` specyfikacja zmienia się na samo „drzwi bez uchwytu — otwieranie przez naciśnięcie”, bez numeru modelu i wariantu. Funkcja jest wykorzystywana w zbiorczej liście okuć; test UI i PDF nie został wykonany. Użytkownik wskazał konkretny model (BLEDY.md, 25.10). Przy zakupie sama nazwa rodziny może być niejednoznaczna.

**Sugestia GPT do weryfikacji, nie decyzja użytkownika:** zachować w zamówieniu identyfikację modelu i wariantu obok zastosowania, sprawdzić inne pozycje z `use` oraz unikać nieprawidłowego sumowania różnych wariantów. **Test odbioru:** osobna szafka, kilka szafek, projekt, PDF, wycena i prawidłowe sumowanie; potem oznaczyć NAPRAWIONE.

---

### N154 [P2] — DO WERYFIKACJI UI: wspólne dno ignoruje różnicę dekoru

**Test funkcji**, main `d601d4fe87eb8a2117b8ab1b1c7e3c25e079272e`: dwie szafki 600 × 720 × 500 mm w ciągu z cokołem, odstęp 20 mm, wspólne dno. Płyty korpusu mają nazwę „Płyta”, kolor `#d8c3a0`, grubość 18 mm, lecz różne dekory `Oak` i `Ash`. Po `wedlugCiagu` funkcja `runBottom` zwraca wspólne dno 1220 × 500 z materiału Oak, a `projectParts` pomija oddzielne dna obu szafek. Przy dwóch jednakowych dekorach wynik wspólnego dna jest kontrolą. Porównanie w `runBottom` uwzględnia nazwę, kolor i grubość, ale nie dekor. Wymaga sprawdzenia dostępności ustawienia, ostrzeżeń i przycisków w UI.

**Sugestia GPT do weryfikacji, nie decyzja użytkownika:** porównywać pełną tożsamość materiału dna i przed połączeniem różnych dekorów pokazać wybór lub zachować oddzielne dna. **Test odbioru:** oba dekory, identyczny dekor jako kontrola, różne własne płyty, formatki i zamówienie; sprawdzić działanie proponowanych przycisków. Po pozytywnym teście oznaczyć NAPRAWIONE.

---

### N153 [P2] — OTWARTE: plan zakupu dzieli pojedynczy drążek na dwie rury

**Test funkcji**, main `d601d4fe87eb8a2117b8ab1b1c7e3c25e079272e`: szafka 3100 × 2000 × 560 mm, jedna kolumna z drążkiem, nóżki 100 mm. `computeGeo` wylicza jeden drążek długości 3062 mm, a `scalOkucia` podaje zakup 1 × 3 m i 1 × 0,5 m oraz cięcie „3 m → cały; 0,5 m → 62”. Dwie osobne części nie są jednym drążkiem 3062 mm i w planie nie ma sposobu ich połączenia ani dodatkowego podparcia. W tym skrajnym przykładzie osobno pojawiają się również błędy za dużych formatek i ostrzeżenie o froncie; nie są to informacje o niemożliwym drążku. Kontrola W2000 daje jeden drążek 1962 z rury 2 m. Interfejs i jego przyciski nie były sprawdzone.

**Sugestia GPT do weryfikacji, nie decyzja użytkownika:** gdy drążek przekracza najdłuższą dostępną rurę, rozważyć osobny komunikat i wykonalną zmianę konstrukcji zamiast przedstawiać dwa kawałki jako jeden drążek. **Test odbioru:** sprawdzić wartości poniżej, na i powyżej 3000 mm, geometrię, podparcie, zakupy oraz faktyczne działanie ewentualnych przycisków. Oznaczyć NAPRAWIONE dopiero po pozytywnym teście.

---

### N148 — dodatkowy wariant do weryfikacji: różna płaszczyzna zawieszenia

Test funkcji na main `d601d4fe87eb8a2117b8ab1b1c7e3c25e079272e`: dwie szafki wiszące 600 × 720 × 560, zawieszki na listwie, w jednym ciągu. Przy `offset` 0 dla obu `runRail` zwraca odcinek 1200 mm. Po wysunięciu drugiej o 100 mm funkcja nadal zwraca ten sam odcinek 1200 mm na wspólnej wysokości, mimo różnych płaszczyzn tyłu. Sprawdzić w interfejsie i dokumentacji rzeczywisty sposób podparcia, istniejące komunikaty i ich przyciski. Ten wariant wiąże się z N148, więc nie jest liczony jako osobny potwierdzony błąd. Sugestia GPT do weryfikacji: uwzględnić płaszczyznę zaczepów lub wyjaśnić wymagane podparcie i przetestować działania użytkownika.

---

### N152 [P2] — DO WERYFIKACJI UI: scalanie może usunąć plecy drugiej szafki

**Test funkcji**, main `d601d4fe87eb8a2117b8ab1b1c7e3c25e079272e`: dwie sąsiednie szafki ciągu 600 × 720 × 560 mm z jednakowymi materiałami i jednym poziomem; pierwsza bez pleców (`back=none`), druga z HDF (`back=hdf`). Przed scaleniem druga ma w formatach plecy HDF 598 × 718; `scalenieBlad` nie blokuje operacji, a `scalSzafki` bierze ustawienie pleców z pierwszej szafki i w wyniku nie ma pleców. Odwrotna kolejność wymaga osobnego sprawdzenia. Sam test funkcji nie wykazuje, jakie wyjaśnienia, wybory lub przyciski pokazuje kreator scalania w UI.

**Sugestia GPT do weryfikacji, nie decyzja użytkownika:** rozważyć rozpoznanie różnych ustawień pleców przed scaleniem i przedstawienie skutków lub zablokowanie nieobsługiwanego wariantu. **Test odbioru:** odtworzyć obie kolejności w interfejsie, sprawdzić wybory i kliknąć ewentualne przyciski, porównać geometrię, formatki oraz zamówienie. Status NAPRAWIONE dopiero po pozytywnej weryfikacji.

---

### N151 [P2] — OTWARTE: własny blat wysokiej szafki znika z zamówienia przy blacie ciągu

**Wersja:** main `d601d4fe87eb8a2117b8ab1b1c7e3c25e079272e`. **Test funkcji, nie test interfejsu:** w syntetycznym projekcie utworzyć jeden ciąg z włączonym blatem roboczym i dwiema szafkami 600 × 720 × 560 i 600 × 2000 × 560 mm, każda z własnym blatem z płyty, wysunięcie przednie 30 mm, nóżki 100 mm. `runTop` produkuje wspólny blat 600 × 600 mm tylko nad niższą szafką; `projectParts` usuwa jednak własny blat także wysokiej szafki, więc brakuje formatki 600 × 590 mm. Kontrola: po wyłączeniu blatu ciągu `projectParts` pokazuje osobny własny blat 600 × 590 obu szafek. Sprawdzić osiągalność w UI, komunikaty i przyciski; test funkcji nie przesądza o ich działaniu.

**Sugestia GPT do weryfikacji, nie decyzja ani propozycja użytkownika:** rozważyć pomijanie własnego blatu tylko dla szafki, której rzeczywiście zastępuje go wspólny blat. **Test odbioru:** sprawdzić niską i wysoką szafkę na końcu i w środku ciągu, listę formatek, geometrię, rozkrój i zamówienie oraz ewentualne przyciski. Po pomyślnym teście można oznaczyć jako NAPRAWIONE.

---

# Nowe ustalenie audytu — 30.10.2026

### N150 [P2] — OTWARTE: ta sama resztka blatu przypisana do dwóch grup rozkroju

**Wersja:** main `d601d4fe87eb8a2117b8ab1b1c7e3c25e079272e`. **Test funkcji, nie test interfejsu:** na danych syntetycznych utworzono rzeczywistymi funkcjami `wierszBlatu` i `matLabelOf` dwa elementy jednego materiału blatu, 1000 × 300 mm i 1000 × 700 mm. Powstały grupy arkusza 4100 × 600 i 4100 × 1200 mm. Przekazano do `buildCutPlan` jedną własną resztkę tego samego materiału 1000 × 1000 mm, ilość 1. Wynik przypisuje tę samą resztkę obu grupom i w obu pokazuje zakup 0. Przy rzazie 3 mm tych dwóch elementów nie da się wyciąć z jednej takiej resztki: 300 + 700 + 3 = 1003 mm. Może to zaniżyć zakupy i dać niewykonalny plan. Wymaga jeszcze odtworzenia przez interfejs i sprawdzenia komunikatów oraz ewentualnych przycisków.

**Sugestia GPT do weryfikacji, nie decyzja ani propozycja użytkownika:** rozważyć wspólne rozliczanie dostępnej liczby i pozostałej geometrii własnych kawałków pomiędzy grupami tego samego materiału. **Test odbioru:** powtórzyć dokładny przypadek w UI i funkcjach, sprawdzić ilości 0, 1 i 2 oraz rozmiary, rzeczywistą wykonalność cięcia, zakup i wycenę; sprawdzić działanie ewentualnych przycisków i dopiero po pozytywnych wynikach oznaczyć NAPRAWIONE.

---

# Przekazanie audytu dla Claude — 30.10.2026

**Pochodzenie sugestii:** poniższe propozycje przycisków i napraw są pomysłami GPT do oceny i weryfikacji technicznej. Nie są decyzją użytkownika, jego propozycją ani poleceniem wdrożenia konkretnego rozwiązania. Użytkownik ustalił jedynie kryterium: błąd lub ostrzeżenie można uznać za rozwiązane, gdy wskazuje działanie i ma działający przycisk; trzeba kliknąć i sprawdzić skutek, z podanymi przez niego wyjątkami dotyczącymi arkusza i blatu.

**Zasada statusów:** po naprawie odtwórz konkretny przypadek na aktualnym kodzie, uruchom odpowiednie testy i kliknij każdy proponowany przycisk. Sprawdź faktyczną zmianę projektu, usunięcie problemu, geometrię, formatki i zamówienie oraz nowe kolizje adekwatnie do przypadku. Dopiero po pozytywnym wyniku oznacz **NAPRAWIONE**, podaj wersję i zakres testu. Sama deklaracja lub obecność przycisku nie wystarcza. Istniejące przypadki ZROBIONE zachowują udokumentowany zakres.

### N143 — NAPRAWIONE w sprawdzonym wariancie

**Odtworzenie i wynik:** lokalny `standalone.html` z main `d601d4fe87eb8a2117b8ab1b1c7e3c25e079272e`; szafka 600×2000×560, pionowe wzmocnienie 400×100, od lica 230, drążek w górnym świetle. Błąd zawierał „Usuń rurę”. Kliknięcie wyłączyło drążek, usunęło błąd oraz rurę i rozety z zamówienia. Opcji skrócenia wzmocnienia nie testowano.

### N145 — OTWARTE: brak przycisku przy błędzie tip-on

**Odtworzenie i wynik:** w lokalnym UI szafka 600×300×80, HDF, drzwi bez uchwytu i tip-on. Pojawia się błąd o długości 89 mm i 80 mm do pleców; przy tym komunikacie brak przycisku, tip-on nadal znajduje się w zamówieniu. Wariant bez płyty montażowej przeszedł tylko test funkcji; nie odtworzono go w UI.

**Sugestie GPT do weryfikacji:** rozważyć akcję zmiany sposobu otwierania na uchwyt lub zaproponowania odpowiedniej głębokości, ale najpierw sprawdzić konsekwencje dla pozostałych elementów, sposób wyboru uchwytu i realne miejsce montażu; nie zakładać wartości ani wdrażać jako decyzji użytkownika. **Test odbioru:** odtworzyć oba warianty, kliknąć dostępne rozwiązania, sprawdzić montaż, geometrię, zamówienie i ewentualne nowe błędy.

### N147 — DO WERYFIKACJI UI

**Odtworzenie:** model dwóch kolumn, pierwsza `noDiv=true`, po półce w obu, bez drzwi. Test funkcji stwierdził brak wiercenia w nieistniejącej przegrodzie i błąd o półkach bez podparcia. Kod komunikatu nie zawiera przypisanej akcji; UI nie sprawdzono.

**Sugestia GPT do weryfikacji:** rozważyć przywrócenie przegrody przyciskiem, jeśli poprawne dla tego modelu. Nie jest to decyzja użytkownika. **Test odbioru:** odtworzyć stary zapis, sprawdzić komunikat i przycisk, po kliknięciu geometrię, podparcie półek, wiercenia, formatki i zamówienie.

### N149 — DO WERYFIKACJI UI

**Odtworzenie:** wisząca 600×1200×560, dwa poziomy, lewe tylne wycięcie 100×100 tylko w górnym poziomie, maska i zawieszki. Test funkcji potwierdził błąd zawieszki w wycięciu; kod komunikatu nie zawiera przypisanej akcji, UI nie sprawdzono.

**Sugestia GPT do weryfikacji:** rozważyć przycisk zmiany zakresu wycięcia, jeśli po sprawdzeniu zapewnia poprawne podparcie. Nie jest to decyzja użytkownika. **Test odbioru:** kliknąć proponowane działanie i sprawdzić obrys wycięcia, płytę pod zawieszką, geometrię, wiercenia, zamówienie i nowe kolizje.

### PDF-1 — OTWARTE

**Odtworzenie i wynik:** aktualny PDF użytkownika, 15 stron A4. Na renderach stron 1 i 5 wymiary i opisy są drobne, niektóre znaki około 2–3 pkt. Nie testowano fizycznego wydruku ani listwy 100 mm. **Sugestie GPT do weryfikacji:** większe opisy, dodatkowy widok lub legenda. **Test odbioru:** aktualny PDF zwykłej szafki, szuflad i arkusza z listwą 100 mm; czytelność w skali A4, brak nakładania i obcinania. Nie publikować prywatnego PDF ani projektu.

Poniższe starsze sekcje zachowują historię i mogą mieć dawne statusy; aktualne rozstrzygnięcia są powyżej.

---

## Retest przycisków — 30.10.2026

- **N143 — ZROBIONE w sprawdzonym wariancie:** w lokalnej kopii `standalone.html` z main `d601d4fe87eb8a2117b8ab1b1c7e3c25e079272e` odtworzono szafkę 600×2000×560, pionowe wzmocnienie 400×100 od lica 230 i drążek w górnym świetle. Błąd miał przycisk „Usuń rurę”. Po kliknięciu checkbox drążka został wyłączony, błąd kolizji zniknął, a rura i rozety zniknęły z zamówienia. Nie testowano osobno przycisku skracania wzmocnienia ani wszystkich kombinacji. Starsze wpisy poniżej o niesprawdzonym przycisku są nieaktualne.
- **N145 — DO UZUPEŁNIENIA DZIAŁANIA:** w UI szafka 600×300×80 z tip-on wyświetla błąd, że 89 mm wchodzi w plecy; przy tym komunikacie brak przycisku. W zamówieniu nadal jest tip-on. Propozycje do rozważenia: przycisk zmiany na uchwyt albo zwiększenia głębokości do poprawnej wartości, z kontrolą konsekwencji. To propozycje, nie przetestowane poprawki. Drugi wariant bez płyty montażowej nie został odtworzony w UI.
- **N147 i N149 — DO DALSZEJ WERYFIKACJI UI:** testy funkcji potwierdzają komunikaty; w kodzie komunikaty nie mają przypisanych akcji. Nie sprawdzono ich w interfejsie. Potencjalnie pomóc mogą przyciski przywrócenia przegrody (N147) lub zmiany zakresu wycięcia (N149), po sprawdzeniu geometrii i skutków.
- **PDF-1 — NADAL OTWARTY:** wcześniejsza kontrola aktualnego PDF wykazała drobne wymiary.

---

## Zasada użytkownika — sprawdzanie przycisków

Ostrzeżenie lub błąd, które wskazują konkretne działanie i mają działający przycisk rozwiązujący problem, są akceptowanym rozwiązaniem. Przycisk trzeba faktycznie kliknąć i sprawdzić zmianę ustawień, usunięcie problemu i ewentualne nowe kolizje; sama obecność przycisku nie wystarcza. Informacje o przekroczeniu arkusza oraz sugestie zmniejszenia wymiarów, aby zmieścić się na poprzednim arkuszu, w tym dla blatu, są wyjątkami wskazanymi przez użytkownika.

**Do sprawdzenia według tej zasady:** N143 — w kodzie przewidziano przycisk usunięcia rury i czasem skrócenia wzmocnienia, ale nie sprawdzono ich kliknięcia w tym przypadku. N145, N147, N149 — w sprawdzonych komunikatach kod zawiera instrukcje tekstowe bez przypisanych przycisków; wymagają sprawdzenia w UI i dalszej oceny. Starszych zgłoszeń oznaczonych ZROBIONE nie otwierać automatycznie ponownie: zakres ich wcześniejszej weryfikacji znajduje się w historii.

---

# Audyt GPT — aktualne statusy

Zgłoszenia oznaczone **ZROBIONE** nie wracają na listę błędów do naprawy, chyba że zostanie wykazana nowa regresja. Status podaje zakres rzeczywiście wykonanego sprawdzenia.

## Otwarte

- **PDF-1 — DO POPRAWY:** napisy i wymiary na stronach z rysunkami są bardzo drobne. Szczegóły kontroli aktualnego PDF poniżej. Kryterium odbioru: czytelne wymiary i podpisy bez nachodzenia oraz obcinania na A4; sprawdzić zwykłą szafkę, szuflady i listwy 100 mm.

## Zrobione — potwierdzone we wskazanym zakresie

- **N69–N138 — ZROBIONE:** zamknięte we wcześniejszym reteście 29.10; nie powtórzono ich wszystkich 30.10. Pełne wcześniejsze przypadki i dowody pozostają w historii raportu.
- **N140, N141, N142, N144, N146, N148 — ZROBIONE w testach funkcji:** poprawione zachowanie potwierdzone uruchomieniem testów 30.10. Nie przeprowadzono pełnego przeglądu UI, 3D i PDF dla tych przypadków.

## Wykrywane błędem — nie automatyczna naprawa konstrukcji

- **N143, N145, N147, N149 — WERYFIKACJA FUNKCJI OK, ograniczenie:** problem jest zgłaszany błędem; automatyczna korekta konstrukcji lub montażu nie została potwierdzona. To nie są niewykryte błędy; nie traktować ostrzeżenia jako poprawionej geometrii. Szczegóły poniżej.
- **N139 — ZAAKCEPTOWANE OGRANICZENIE:** układ bez podparcia prowadnicy jest zgłaszany jako niemontowalny; aplikacja nie tworzy automatycznie poprawnej konstrukcji.

Wcześniejsze opisy poniżej są archiwalne. Ich stare statusy nie nadpisują powyższych. [Pełny raport przed uporządkowaniem](https://github.com/darekn95/mebloprojekt/blob/d55f1209653a50c1cbbed3432c847a4b72de14e7/AUDYT_GPT.md).

---

## Aktualizacja 30.10.2026 — wyniki sprawdzenia

**PDF-1 pozostaje otwarty:** w aktualnym PDF (15 stron A4) wymiary i opisy na rysunkach są bardzo drobne. Na stronach 1 i 5 przykładowe znaki mają około 2–3 pkt; tabele formatek około 9 pkt. Arkusze rozkroju na stronach 11–15 są większe, lecz część podpisów małych elementów nadal drobna. Ocena na renderach ekranowych, bez wydruku na papierze. W tym projekcie nie było listwy 100 mm, więc jej nie sprawdzono. Powiększyć napisy i ponowić kontrolę. Nie publikować prywatnego projektu ani PDF.

**Testy:** main `d601d4fe87eb8a2117b8ab1b1c7e3c25e079272e`, blob `szafki.jsx` `cce173bd1949b2761405ad83185a6b6d0f5e5a72`. Istniejący zestaw `testy/funkcje.mjs`: 86 OK, 0 błędów, w tym 24 asercje N140–N149. To niezależne uruchomienie testów projektu, a nie pełny niezależny retest interfejsu, 3D i zamówień. Publiczny `standalone.html` odpowiada tej wersji kodu.

| Zgłoszenie | Wynik testu funkcji |
|---|---|
| N140 | Różne kolory blatów tworzą osobne grupy i arkusze. |
| N141 | Różny montaż frontów blokuje scalenie. |
| N142 | Blaty na różnych wysokościach pozostają osobne. |
| N143 | Kolizja drążka jest zgłaszana błędem; nie potwierdzono automatycznej korekty. |
| N144 | Kontrola wspornika uwzględnia wybrany NL szuflady. |
| N145 | Brak miejsca lub płyty montażowej tip-on jest zgłaszany błędem; nie potwierdzono automatycznej korekty. |
| N146 | Różne wysokości nie powodują zamówienia złączy w rogu i jest uwaga. |
| N147 | Brak wierceń w nieistniejącej przegrodzie, półki bez podpory zgłaszane błędem; nie potwierdzono automatycznej przebudowy. |
| N148 | Różne wysokości dają osobne odcinki listwy. |
| N149 | Kolizja zawieszki z wycięciem jest zgłaszana błędem; nie potwierdzono automatycznej zmiany mocowania. |

N69–N138 objęto wcześniejszym retestem 29.10, ale nie powtórzono ich wszystkich w tej rundzie. N139 pozostaje zaakceptowanym ograniczeniem. Poniżej zachowano historyczne opisy N140–N149; nie oznaczają, że wszystkie nadal występują.

---

## Stan historyczny przed aktualizacją 30.10

# Audyt GPT — aktualne uwagi

Stan po reteście 29.10.2026. Testowano kod `szafki.jsx` o SHA `9bea2d2643c2284b7b7528a6532cf7b90f1444db`.

- **N140–N149:** pozostawione bez zmian; w tej rundzie nie były sprawdzane na prośbę właściciela.
- **PDF-1:** wymaga ponownego sprawdzenia aktualnego wydruku. Dostępny PDF pochodzi z 21.10 i nie potwierdza aktualnej wersji.
- **N69–N138:** przypadki objęte wcześniejszym i obecnym retestem usunięto z listy otwartych zgłoszeń. W szczególności N117 dobiera odpowiedni wkręt, N122 przesuwa nóżkę poza podcięcie, a N132 tworzy oddzielne fronty poziomów. Testy funkcji do N139: 50 OK, 0 błędów, ok. 1 s w lokalnym środowisku testowym z adapterem parsera JSX. Nie jest to pełna weryfikacja wszystkich rysunków, PDF i interfejsu.
- **N139:** zaakceptowane ograniczenie konstrukcyjne: szuflada obok ramienia bez podparcia prowadnicy jest zgłaszana jako niemontowalna; aplikacja sugeruje zmianę układu. Nie oznacza to obsługi takiej szuflady.
- Opisy starszych zgłoszeń i wcześniejsze wyniki zachowano w [historii raportu](https://github.com/darekn95/mebloprojekt/blob/f1ed73df1da6fd4f559fe8a328200f5ae3599468/AUDYT_GPT.md).

## Szybki test regresji

W aktualnej kopii repozytorium można uruchamiać istniejący zestaw `node testy/funkcje.mjs` po przygotowaniu zależności zgodnie z dokumentacją projektu. Zestaw sprawdza obliczenia, lecz nie zastępuje przeglądu widoków 3D i wydruku. W tej rundzie uruchomiono część do N139; N140–N149 pominięto. Przy kolejnych zmianach warto wykonywać krótki test funkcji, a ręcznie przeglądać tylko widoki i scenariusze związane ze zmianą.

## PDF-1 [P3] Drobne wymiary i podpisy na wydruku A4

**Stan:** do sprawdzenia na aktualnym PDF — starszy wydruk miał problem z czytelnością; część podpisów została później zmieniona.

**Gdzie:** rysunki szafek na stronach 1–12 oraz podpisy długich, wąskich elementów rozkroju, szczególnie strona 18, w sprawdzonym PDF liczącym 21 stron.

**Objaw:** część wymiarów, opisów okuć i podpisów wąskich listew jest zbyt drobna do wygodnego odczytu na wydruku A4 w skali 100%. Osobne strony arkuszy poprawiły czytelność rozkroju, ale nie rozwiązują wszystkich małych podpisów. Nie stwierdzono znikania elementów ani ucięcia ich opisów.

**Wpływ:** podczas montażu lub oznaczania formatek trzeba powiększać dokument na ekranie; wydruk może być mało wygodny.

**Proponowana poprawa:**
- Zwiększyć rozmiar małych wymiarów i opisów na widokach szafki, zachowując odstępy między liniami wymiarowymi.
- Dla wąskich listew zastosować numer elementu powiązany z czytelną legendą albo podpis poza elementem.
- Jeśli powiększenie powoduje nakładanie tekstu, udostępnić dodatkowy wydruk pojedynczego widoku lub większy format strony.

**Kryterium odbioru:** na wydruku A4 w skali 100% można odczytać wymiary i jednoznacznie przypisać opisy do elementów; brak nakładania i obcinania podpisów. Sprawdzić zwykłą szafkę, szuflady oraz arkusz zawierający listwy 100 mm.



## Audyt 28.10.2026 — N140–N149

Dziesięć kolejnych odrębnych przypadków. Źródło `szafki.jsx`, blob `b4ebef6460072cc4d7d8aac0a752acb500996ac7`, sprawdzony także na koniec rundy — nadal niezmieniony. Testy korzystają z funkcji produkcyjnych, planów i brył; 14 ukierunkowanych asercji przeszło (`work/audit140/checks.json`). N144 potwierdzono dodatkowo w UI, gdzie jednocześnie widać zamówione NL400 i błąd o NL550. Pozostałe nie są deklaracją pełnego przeklikania UI. Projekt użytkownika przywrócono po kontroli; używano syntetycznych danych. Dowody lokalne w `work/audit140/`, bez prywatnego projektu w repozytorium. Nie zmieniano kodu ani nie testowano PDF. Trop powtórnego zużycia resztki w dwóch grupach o sztucznie zbieżnych etykietach pozostawiono poza tą listą; N140 dotyczy niezależnego, potwierdzonego łączenia dekorów blatów.

### N140 [P2] Różne kolory blatów roboczych trafiają na jeden arkusz rozkroju

- **Odtworzenie:** dwa blaty po1000×600, taka sama nazwa „Blat roboczy” i grubość, ale jeden biały `#e8e6e1`, drugi czarny `#2b2a28`. Wykorzystać rzeczywiste `matLabelOf` i `wierszBlatu` przy budowie wejścia rozkroju.
- **Wynik:** obie pozycje dostają identyczną etykietę „Blat roboczy” oraz arkusz4100×600. `buildCutPlan` kładzie oba kawałki obok siebie na jednym arkuszu i wylicza zakup jednego. Jeden fizyczny arkusz nie dostarczy obu dekorów. Lista formatek może zachowywać różne kolory, lecz etap grupowania rozkroju je gubi.
- **Przyczyna/poprawa:** `COLORED_KEYS` nie zawiera `worktop`; `ambiguousThickness` rozróżnia kolory osobno tylko dla HDF. Grupa rozkroju powinna nieść jednoznaczną tożsamość dekoru/grubości/produktu, nie samą etykietę. Kontrolna zmiana nazwy drugiego blatu rozdziela zakup na dwa arkusze. To nie N3 o formacie600/1200 ani N95 o dwóch własnych płytach tej samej nazwy. Dowody: `colors.mjs`, `worktopColors.json`, `checks.json`.

### N141 [P2] Scalenie zamienia drzwi wpuszczane drugiej szafki na nakładane

- **Odtworzenie:** dwie szafki600×720×560 z tych samych materiałów, w jednym ciągu. Pierwsza ma drzwi nakładane, druga wpuszczane. Scalić szafki.
- **Wynik:** `scalenieBlad` zwraca brak przeszkód. Przed scaleniem drugi front jest wpuszczany560×680; po scaleniu oba fronty są nakładane596×714. Zmieniają się też wynikające z montażu warianty zawiasów. Zachowanie ustawienia drugiej szafki nie jest proponowane ani wymagane.
- **Przyczyna/poprawa:** kolumny są kopiowane, lecz zależą od `frontMode` skopiowanego wyłącznie z pierwszego korpusu. Przed scaleniem sprawdzać zgodność ustawień, których nie da się zachować per kolumna, albo jawnie przenosić efektywne ustawienia. To osobne od N88 o zamianie materiałów — tu materiały są identyczne. Dowody: `mergeMode.json`, `probe.json:mergeMode`, `checks.json`.

### N142 [P2] Własne blaty szafek na różnych wysokościach łączą się w jedną formatkę

- **Odtworzenie:** ciąg bez wspólnego blatu roboczego; dwie szafki W600, H720 i900, obie z własnym blatem z tej samej płyty18 i wysunięciem przednim30.
- **Wynik:** geometria pojedynczych szafek ma górne płyty na y=702..720 i882..900. `runTop` łączy je w jeden blat1200×590 na wysokości702; `projectParts` usuwa oba własne blaty i zamawia jedną długą płytę. Nie może ona jednocześnie leżeć na dwóch poziomach. `worktopMsgs` nie zgłasza tej sprzeczności; niezależna uwaga o wysokości szafki w ciągu nie naprawia formatek.
- **Przyczyna/poprawa:** klucz łączenia własnych blatów uwzględnia materiał, ale nie efektywną wysokość; wysokość całego wyniku pochodzi z pierwszego źródła. Dzielić blaty według rzeczywistego poziomu albo pozostawiać własne płyty. Kontrolne dwie H720 mogą korzystać z jednej płyty1200. Dowody: `ownHeights.json`, `probe.json:ownDifferentHeights`, `verified.json:topControl`.

### N143 [P2] Drążek na wieszaki przecina pionowe wzmocnienie bez komunikatu

- **Odtworzenie:** 600×2000×560, jedna kolumna, drążek w najwyższym świetle. Dodać lewe wzmocnienie pionowe: wysokość400, głębokość100, od lica230, od góry.
- **Wynik:** drążek ma oś y=1912, z=280 i biegnie przez x=19..581. Wzmocnienie zajmuje x=18..36, y=1582..1982, z=230..330. Rzeczywiste bryły `Scene3D` przecinają się na17×25×25mm. Lista uwag jest pusta, drążek i mocowania pozostają w zamówieniu.
- **Poprawa:** kontrolować pełny przebieg drążka i dostępność płyt dla rozet wobec wzmocnień, zabudów i innych elementów wnętrza; dać wykonalną korektę albo usunięcie. Usunięcie wyłącznie wzmocnienia usuwa wskazane przecięcie. To nie N89 o rurze pozostawionej po zmianie poziomu na szuflady — tu kolumna jest zwykłą garderobą z drzwiami. Dowody: `rodRails.json`, `verified.json:rodHits`.

### N144 [P2] Wspornik szuflady sprawdzany według domyślnego NL zamiast faktycznie wybranego

- **Odtworzenie:** 600×720×560, fix lewy100 nakładany, wspornik gł.400, jedna DXS z ręcznie wybranym NL400; domyślne NL kolumny pozostawić automatyczne.
- **Wynik:** geometria i zamówienie mają prowadnicę400, wspornik również400, lecz aplikacja zgłasza błąd „prowadnica NL550 musi się na nim oprzeć ... daj minimum550” i proponuje powiększenie wspornika. W UI jednocześnie widać produkt „NL400 ... ind.05409” i błąd o550.
- **Przyczyna/poprawa:** kontrola wspornika odczytuje `rawCol.nl ?? maxNL`, ignorując indywidualne `drawers[].nl`. Sprawdzać maksymalną rzeczywistą wymaganą długość spośród szuflad mocowanych na tym wsporniku. Kontrolne wpisanie400 również jako domyślnego NL kolumny usuwa błąd bez zmiany faktycznych prowadnic. Dowody: `supportNl.json`, `more.json:supportNl`, `verified.json:supportControl`, UI.

### N145 [P2] Tip-on nie ma kontroli miejsca montażu i może przeciąć plecy

- **Odtworzenie główne:** szafka600×300×80, standardowe HDF przybijane, drzwi bez uchwytu, tip-on.
- **Wynik:** model odbojnika zajmuje z=0..89, plecy z=80..83. Bryły przecinają się na15×16×3mm, odbojnik wystaje za korpus. Jedyna uwaga dotyczy jednego konfirmatu przy płytkiej szafce; brak uwagi o niepasującym tip-on, który pozostaje do zakupu.
- **Dodatkowa kontrola tego samego braku walidacji:** bez dna, wieńca, półek i wzmocnień odbojnik nadal jest umieszczany pod umownym „sufitem” kolumny, choć według reguły w kodzie ma być mocowany na płycie poziomej. Jest ogólna uwaga o otwartym korpusie, bez wskazania montażu tip-on.
- **Poprawa:** wybierać rzeczywiście istniejącą płytę montażową, uwzględniać jej cofnięcie oraz pełne89mm korpusu odbojnika i dostępne miejsce do pleców. Nie traktować granicy światła jako dowodu istnienia płyty. Dowody: `tipBack.json`, `floatingTip.json`, `verified.json:tipBack`, `more.json:floatingTip`.

### N146 [P2] Złącza blatów w rogu ignorują automatyczną wysokość montażu ciągów górnych

- **Odtworzenie:** dwa ciągi górne połączone rogiem, `mountY=0`, wysokość wyliczana automatycznie od dolnych, prześwit500. Dolne ciągi H720 i900, z blatem38; górne H900 z blatem38.
- **Wynik:** `tierMountY` i rozmieszczenie dają montaż1258 i1438, więc wierzchy górnych blatów leżą na2196 i2376 — różnica180mm. `wierzchBlatu` porównuje jednak938 z938, a `runTopZlacza` zamawia dwa złącza styku w rogu. Nie ma uwagi o braku wspólnego poziomu tych blatów; inne uwagi dotyczą jedynie usztywnienia pod blatem.
- **Przyczyna/poprawa:** `wierzchBlatu` dodaje surowe `run.mountY`, pomijając wysokość obliczoną dla powiązanego piętra. Porównywać rzeczywiste wysokości z `tierMountY(project,run)` lub rozmieszczenia. To odrębny brak obsługi montażu automatycznego w ścieżce, w której N66 obsłużyło różne wysokości wpisane bezpośrednio. Dowody: `upperTopHeight.json`, `upperTopHeight-result.json` (także `layoutMount`), `checks.json`.

### N147 [P2] Projekt z `noDiv` dostaje wiercenia w nieistniejącej przegrodzie

- **Odtworzenie:** wczytać obsługiwany model dwóch kolumn, pierwsza `noDiv=true`, po jednej półce w obu kolumnach, bez drzwi. Pole oznacza przelot bez płyty i nadal jest interpretowane przez silnik; dotyczy również zgodności ze starszymi zapisami, nie twierdzę, że obecny UI udostępnia przełącznik usunięcia tej przegrody.
- **Wynik:** `geo.dividers=[]`, brak formatki przegrody, ale plan zawiera „Przegroda1” z kołkami z obu stron na333mm. Zamówienie daje dwie oddzielne półki282×560, które na styku nie mają podpory. Brak uwag.
- **Przyczyna/poprawa:** `panelsOfCol` wyznacza nośnik według numeru kolumny, bez sprawdzenia rzeczywistej przegrody. Dla przelotu zaplanować wspólną półkę/realne podparcie albo zgłosić nieobsługiwany układ, zamiast wiercić nieistniejącą płytę. Kontrolne usunięcie `noDiv` przywraca jedną przegrodę i uzasadnia ten plan. Dowody: `noDiv.json`, `more.json:noDiv`, `verified.json:noDivControl`.

### N148 [P2] Jedna ciągła listwa montażowa dla szafek z zawieszkami na dwóch wysokościach

- **Odtworzenie:** dwie wiszące szafki W600, H720 i900, ten sam poziom montażu1500, bez nóżek/cokołu, zawieszki na listwie.
- **Wynik:** plany szafek umieszczają górne krawędzie zawieszek702 i882mm od dołu boku, czyli na wysokościach2202 i2382 od podłogi. `runRail` mimo to tworzy jeden prosty odcinek1200, a zbiorcze zamówienie zastępuje nim obie listwy szafek: „jedna listwa1200mm przez ciąg”. Prosta pozioma listwa nie obsłuży tych dwóch poziomów. Ogólna uwaga o różnicy H w ciągu nie zmienia planu zakupu/cięcia.
- **Poprawa:** dzielić listwy według rzeczywistej wysokości i płaszczyzny zaczepów albo jawnie blokować wspólną listwę. Dla jednakowych H720 odcinek1200 jest poprawny; przy różnych wysokościach potrzebne są oddzielne odcinki przy danych szafkach. Dowody: `railHeight.json`, `more.json:railHeight`, `verified.json:railControl`.

### N149 [P2] Zawieszka pozostaje w obszarze górnego wycięcia narożnika

- **Odtworzenie:** wisząca600×1200×560, dwa poziomy, tylne lewe wycięcie100×100 tylko w górnym poziomie, maska włączona, zawieszki zawsze.
- **Wynik:** obszar wycięcia obejmuje y=609..1182 oraz100mm od tyłu przy lewym boku. Plan nadal mocuje lewą zawieszkę górną krawędzią na1182 i tylną10mm od tyłu boku. Zgodnie z wymiarami zawieszki zapisanymi w kodzie57,2×37,5×17,4 jej obrys pod górną krawędzią mieści się w obszarze przeznaczonym na przeszkodę/wycięcie. Mocowanie ma więc wypaść w usuniętym miejscu; zamówienie nadal zawiera obie zawieszki, bez uwag. Prostokątna formatka boku nie oznacza, że po wykonaniu przewidzianego wycięcia pozostaje tam materiał.
- **Poprawa:** sprawdzać rzeczywisty obrys i płytę montażową zawieszki względem wycięć/zabudów, wyznaczać alternatywne podparcie lub zgłaszać brak możliwości montażu. Kontrolne przeniesienie wycięcia do dolnego poziomu usuwa konflikt z górną zawieszką. To inny element i plan niż N122 o nóżce pod pełnym dolnym wycięciem. Dowody: `hangerCut.json`, `more.json:hangerCut`, `verified.json:hangerControl`.


