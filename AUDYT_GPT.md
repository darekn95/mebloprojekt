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


