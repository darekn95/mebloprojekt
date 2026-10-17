# Nowe ustalenia N7-N8 - 17.10.2026

Źródło szafki.jsx blob 688b93c92636d6e5909979d68a8ce9bf5f4e6732. Testy lokalnych funkcji computeGeo i Scene3D, bez końcowego renderowania SVG i pełnego testu kliknięć. Nie zmieniano kodu aplikacji.

## N7 [P2] Front z płyty korpusu ma w geometrii grubość ukrytego materiału frontów

Odtworzenie: korpus 25 mm, osobny materiał frontów 18 mm, zaznaczone „Fronty z tej samej płyty co korpus”. Lista formatek daje Drzwi nakładane z matKey board, czyli materiał 25 mm. computeGeoLiczy ustawia jednak tf = mat.front.thickness bez uwzględnienia flagi. Bryła zamkniętych drzwi Scene3D ma 18 mm grubości.

W drugą stronę: korpus18, zachowany osobny front25, frontSameAsBoard=true: zamówienie board18, geometryT i grubość bryły25. Ukryty materiał może pozostać po odznaczeniu i ponownym zaznaczeniu przełącznika albo po zmianie grubości korpusu; setMat/setCab nie synchronizują tych grubości.

Macierz: flaga true/false x korpus18/25 x materiał frontu12/18/25 (12 przypadków). Przy false geometria odpowiada materiałowi frontów. Przy true wszystkie cztery warianty o różnych grubościach są niespójne. Dodatkowo pojawia się ostrzeżenie o nieużywanym materiale frontów12/25.

Skutek: bezpośrednia rozbieżność rysunek 3D - zamawiana grubość. tf jest też używane w głębokościach, drzwiach wpuszczanych i kontroli ruchów; ich wszystkich nie przetestowano w tym zgłoszeniu, więc to potencjalny dalszy wpływ, nie oddzielne potwierdzone błędy.

Naprawa: efektywny materiał frontu ustalać raz, zgodnie z frontSameAsBoard; na jego podstawie liczyć grubość, masę, geometrię i zamówienie. Zachować możliwość powrotu do osobnego materiału frontów. Regresje: zmiana grubości korpusu przy zaznaczonej fladze oraz zaznaczenie flagi po wcześniejszym osobnym froncie; overlay/inset, drzwi/klapa/szuflada/fix.

## N8 [P3] Nóżki wysokości 0 mają geometrię 0, a w zamówieniu 100 mm

W polu wysokości nóżek można zapisać 0. computeGeo liczy legH=0 i nie zgłasza dla tego przypadku uwagi. Hardware spec używa cab.legs.height || 100, więc daje „kwadratowa, wysokość 100 mm”, qty4. Geometria stosuje num(height) ?? 100, traktując 0 jako rzeczywistą wartość. Ta sama alternatywa ||100 występuje w okuciach ramienia.

Odtworzone na Szafce1 z projektu: legH0, hardware100, messages[]. To błąd wartości granicznej, nie deklaracja, że nóżka0 jest prawidłowym produktem.

Naprawa: uzgodnić dozwolone minimum wysokości; nieprawidłowe0 jawnie odrzucić lub zamienić na jedną wspólną wartość. Wymiar geometrii, pole i specyfikacja zamówienia muszą być zgodne. Regresje: 0, puste, dodatnia wartość; szafka i ramię.

## Ograniczenie wcześniejszego testu 61/61

N7 wyjaśnia, dlaczego zgodność dwóch wymiarów i ilości formatek nie wystarcza do potwierdzenia materiału i grubości. W oryginalnym JSON płyty miały po18 mm, więc ten błąd nie ujawniał się tam. Testy pełnej zgodności powinny obejmować trzeci wymiar i tożsamość materiału.


---

# Kolejne nowe ustalenia N5-N6 - 17.10.2026

Źródło szafki.jsx: blob 688b93c92636d6e5909979d68a8ce9bf5f4e6732. Testy wyodrębnionych funkcji obliczeniowych; nie pełny przebieg UI. Nie zmieniano aplikacji.

## N5 [P2] Różne kolory HDF są łączone na jednym arkuszu rozkroju

Przypadek: dwie szafki z plecami HDF 3 mm, jedna biała, druga czarna, ta sama nazwa materiału HDF. Zmiana koloru jest dostępna w karcie Płyty (paleta obejmuje także plecy).

matLabelOf uwzględnia kolor tylko dla board/front/shelf. Dla obu materiałów back daje „HDF”. buildCutPlan grupuje po tej etykiecie. Dwie formatki 598 x 718 mm różnych kolorów układa na jednym arkuszu HDF: wynik 1 arkusz, 2 sztuki. Oddzielne grupy kolorów wymagają w tym teście dwóch arkuszy, po jednym na kolor. Identyczna cena HDF dla różnych kolorów nie uprawnia do wspólnego rozkroju.

Skutek: niewłaściwa liczba kupowanych arkuszy i formatowania; zamówienie tekstowe nie rozróżnia koloru pleców. Formatki projektu mają color w kluczu, lecz ich etykiety są jednakowe, a rozkrój ponownie je łączy. To nowy problem identyfikacji materiału, niezależny od arkuszy blatów N2-N4.

Naprawa: klucz grupowania musi zachować rolę, kolor/dekor i grubość materiału; opis HDF powinien jednoznacznie wskazywać kolor. Test: białe/czarne HDF z tą samą nazwą i grubością, ekran/PDF/rozkrój/wycena.

## N6 [P2] Ręczne oklejanie wstawki narożnej jest ignorowane

Przypadek z projektu użytkownika: płaska wstawka w rogu Szafki 3, 720 x 60 mm. W tabeli formatek używana jest wspólna kontrolka EdgeChips, która przy kliknięciu zapisuje cab.edgeOverrides według nazwy formatki. Dla wstawki zapis trafia do „Wstawka w rogu”.

Test: cab.edgeOverrides = { „Wstawka w rogu”: { a1:false, b1:false, b2:true } }. projectParts nadal zwraca edges { a1:true, a2:false, b1:true, b2:false }, dokładnie jak przed zmianą. wstawkaParts ustawia obrzeża na sztywno, nie odczytuje overrides. formatkiSzafki również tylko dokłada jej wynik; brak zastosowania ręcznej zmiany w tej ścieżce.

Skutek: kontrolka oferuje zmianę oklejania, ale lista i zamówienie pozostają przy automacie. Nie interpretować tego jako potwierdzenia niewłaściwego domyślnego oklejania; problem dotyczy nieskutecznej ręcznej zmiany.

Naprawa: albo stosować overrides także do dodatkowych elementów przypisanych szafce, albo jawnie zablokować kontrolkę, jeżeli zmiana jest niedozwolona. Test: kliknięcie, zapis JSON, ponowne wczytanie, formatki szafki/projektu/PDF i metry obrzeża. Sprawdzić osobno płyty ramienia L i listwę wstawki; ich nie uznano automatycznie za potwierdzone dodatkowe błędy.


---

# Nowe błędy - 17.10.2026

Wyłącznie nowe ustalenia, bez powtarzania zgłoszeń z 16.10. Źródło: szafki.jsx, blob 688b93c92636d6e5909979d68a8ce9bf5f4e6732 na main. Odtworzono lokalnie na wyodrębnionych funkcjach aktualnego kodu; nie wykonano pełnej suity ani wizualnej reprodukcji tych wariantów w przeglądarce. Nie zmieniano aplikacji. Zapisano w AUDYT_GPT.md na gałęzi audytu.

## N2 [P2] Głęboki blat ciągu gubi właściwy format arkusza

Przypadek: jeden dolny ciąg, szafka W600 H720 D650, blat roboczy włączony, domyślny materiał blatu depth600, pilnowanie słojów włączone. runTop prawidłowo wylicza blat 600 x 683 mm z arkusza 4100 x 1200. projectParts pozostawia jednak part.mat.worktop.depth=600. ReportCutPlan (około 13246) bierze sheet z worktopDepth(part.mat), a ekran rozkroju (około 14802) z materiału aktywnej szafki.

Test funkcji: wejście z arkuszem 600 odrzuca tę formatkę, 0 arkuszy i 0 ułożonych sztuk. Po przekazaniu prawidłowego arkusza 1200: 1 arkusz, 1 sztuka, brak odrzuceń. Przy wyłączonej kontroli słojów niektóre krótkie blaty mogą zostać obrócone i zmieścić się w pasie600; to nie naprawia utraty formatu i wymaga osobnego ustalenia zasad profilu.

Wpływ: poprawna formatka istnieje w zamówieniu, ale może zniknąć z rozkroju i liczby kupowanych arkuszy; planSheets sumuje same sheets.length. ReportCutPlan nie wypisuje listy rejected. To błąd danych, nie znany wcześniej mylący nagłówek B3.

Naprawa: przenosić rzeczywisty arkusz rt.arkusz z blatu ciągu do jego pozycji rozkroju; nie ustalać go na podstawie aktywnej szafki. W przypadku rejected jawnie pokazać niekompletny rozkrój/wycenę.

## N3 [P2] Dwa formaty arkusza blatu są łączone według samej etykiety; wynik zależy od kolejności

buildCutPlan (około 12871) grupuje tylko po matLabel, a arkusz bierze z pierwszego elementu mającego sheet. Ten sam dekor/nazwa/kolor/grubość może mieć format600 i1200; matLabelOf nie uwzględnia głębokości arkusza.

Test wejścia: Blat A 3000 x 600 z arkusza4100x600 oraz Blat B 3000 x1000 z arkusza4100x1200, identyczny matLabel, bez obrotu.

- A przed B: jeden arkusz600, jedna formatka ułożona, B odrzucony.
- B przed A: dwa arkusze1200, obie formatki ułożone.

Kolejność pozycji nie może decydować o utracie formatki. Reguła wyboru materiału handlowego powinna być jawna: osobne grupy formatów albo świadoma wspólna optymalizacja na szerszym arkuszu. Dotyczy także ścieżki PDF, która ma własne łączenie wierszy bez sheet w kluczu.

## N4 [P2] Domyślna cena wszystkich blatów zależy od aktywnej szafki

boardDefault (około 14890) zwraca dla każdej pozycji worktop WORKTOP_PRICES[worktopDepth(mat)], gdzie mat to aktywna szafka, a nie materiał wycenianej pozycji. matByLabel zapisuje tylko color/key, gubiąc depth. Wiersze rozkroju całego projektu również korzystają z tego aktywnego mat.

Test dokładnego fragmentu boardDefault z kodu, dwie różne etykiety blatów:

- aktywny materiał depth600: obie ceny 563,99 zł/arkusz;
- aktywny materiał depth1200: obie ceny 1128,22 zł/arkusz.

W projekcie z różnymi blatami jedna z tych cen jest niewłaściwa; zmiana oglądanej szafki może zmieniać wycenę bez zmiany zamówienia. Różnica jednostkowa 564,23 zł. Odtworzenie dotyczy funkcji; pełnej reakcji komponentu UI i opóźnionego przeliczenia nie testowano.

Naprawa: cena i format muszą wynikać z pozycji/grupy arkusza. Zachować oddzielne klucze cen formatów600/1200, aby ręczna cena też nie łączyła różnych produktów.

## Zalecane regresje

Głęboki ciąg D650 z materiałem depth600 i kontrolą słojów; dwa ciągi z różnymi arkuszami i tą samą etykietą materiału w obu kolejnościach; dwa różne dekory/formaty i zmiana aktywnej szafki. W każdym porównać liczbę formatek wejściowych z ułożonymi + rejected, PDF/ekran, format arkusza, ilość, cenę i niezmienność sumy przy zmianie aktywnej szafki.

N2-N4 są powiązane przez brak tożsamości formatu handlowego, ale wymagają kontroli trzech miejsc: wejścia rozkroju, grupowania i cennika.


---

# Aktualizacja po reteście i kontroli PDF — 16.10.2026

Ta sekcja zastępuje statusy starszego audytu poniżej.

- B1: poprawiony w reteście — jedna propozycja boku 178 mm; po zastosowaniu błąd luzu znika.
- B2: poprawiony w reteście — zamówienie i wiercenia zgodne dla 2/3/4 zawiasów, wartości spoza zakresu walidowane.
- B3: opis zamówienia w UI poprawiony; w PDF pozostaje mylący ogólny nagłówek rozkroju, opisany niżej.
- U1: poprawiony w reteście zakresów 75/90/100 stopni.
- U2: uwaga o dużym nagłówku na wąskim ekranie pozostaje.
- N1 [P3]: nieaktualny tooltip automatycznej liczby zawiasów nadal opisuje stare progi; test frontu 596 × 894 mm daje już 3 zawiasy.
- Szafka testowa H900: automatycznie 3 zawiasy, środkowy przesunięty z 447 do 381 mm względem frontu; przycisk dopisania notatki działa. PDF tej szafki nadal wymaga sprawdzenia.
- Złącza blatów w UI: 2 szt. × 9 zł = 18 zł; cena 0 wyklucza je z sumy.
- 24 warianty obliczeń bez wykrytych rozbieżności liczby zawiasów/geometrii ani niefinitywnych lub ujemnych wymiarów. To testy celowane, nie pełna suita repozytorium.

# Kontrola PDF - 16.10.2026

Źródło: PDF przekazany przez użytkownika, wygenerowany 16.10.2026 o 20:18; 16 stron, 6 szafek. Kontrola tekstu wszystkich stron i renderów; szczegółowy podgląd stron 12, 14, 15, 16. Jest to wynik dla przesłanego dokumentu, bez potwierdzenia wersji kodu użytej do jego wygenerowania.

## Ustalenia

- P2, strona 14: w tabeli „Produkty całego projektu” brak złączy blatów. Projekt ma dwa blaty w narożniku (1799 x 600 i 2300 x 600). W poprzednim teście interfejs pokazywał 2 złącza za 18 zł. Należy porównać eksport z aktualnym interfejsem dla dokładnie tego samego zapisu; możliwe pominięcie eksportu lub starsza wersja strony. Sam PDF nie rozstrzyga przyczyny.
- P3, strona 15: ogólny nagłówek rozkroju podaje arkusz 2800 x 2100 mm, również nad tabelą zawierającą blat roboczy. Rysunki blatów na stronie 16 poprawnie podają 4100 x 600 mm. Dodać format arkusza do każdego wiersza tabeli lub rozdzielić nagłówki materiałów. Poprzedniego B3 nie należy uznawać za w pełni zamknięty dla PDF.
- P3, strony 15-16: nagłówek „HDF” pozostaje na samym dole strony 15, a jego rysunek zaczyna stronę 16. Utrzymać nagłówek wraz z pierwszym rysunkiem (reguły podziału strony).
- Drobna redakcja, strona 13: „6 szafki” -> „6 szafek”.
- Czytelność: podpisy w rozkroju, zwłaszcza przy wąskich listwach, są bardzo małe w wydruku A4. Warto dodać większy wariant wydruku pojedynczego arkusza / legendę z numerami formatek.

## Co wygląda poprawnie

- Brak pustych stron i widocznych poważnych ucięć tabel. Rysunki szafek zachowują proporcje, polskie znaki renderują się prawidłowo.
- Każda szafka ma stronę z czterema widokami i stronę tabel z formatkami, okuciami oraz wierceniami.
- Szafka 5: zamówienie zawiera prowadnice o bokach 238 i 210 mm, po jednym komplecie NL 550. Wysokości prowadnic 18/367 mm w tabeli odpowiadają 0/349 względem górnego lica dna, różnica 18 mm. Nie jest to samo w sobie sprzeczność wymiarów.
- Wstawka narożna 720 x 60 mm występuje w tabeli szafki i zestawieniu projektu.
- Blaty są rozrysowane na dwóch arkuszach 4100 x 600 mm, ze zrzutami 1797 i 2298 mm.

## Zakres, którego ten dokument nie sprawdza

Wszystkie korpusy mają 720 mm wysokości. Nie ma testowej szafki z frontem około 900 mm i trzema zawiasami; PDF nie pozwala potwierdzić jej ostrzeżenia, przesunięcia zawiasu ani notatki montażowej. Nie ma również klap ani testu opcjonalnego relingu. Brak tych elementów w tym dokumencie nie jest automatycznie błędem aplikacji.

Uwagi dopisane do AUDYT_GPT.md na gałęzi raportu; nie zmieniano kodu aplikacji.


---

# Archiwum pierwszego audytu — poniższe statusy są historyczne

# Audyt GPT — MebloProjekt, 16.10.2026

Przeprowadzono testy interfejsu GitHub Pages oraz lokalny audyt obliczeń na przekazanym projekcie: 6 szafek, 2 ciągi, 1 pomieszczenie. Znaleziono trzy potwierdzone błędy oraz dwie uwagi do wizualizacji. Główne przypadki ze zrzutu użytkownika działają.

Raport zapisany na GitHubie na prośbę użytkownika. Nie zmieniano kodu aplikacji. Projekt testowano na kopii; po testach ponownie wczytano oryginalny JSON. Plik projektu, wyniki zawierające jego geometrię i zrzuty pozostają lokalnie — nie są częścią tego commitu.

## 1. Wyniki listy użytkownika

| Obszar | Wynik i dowód |
|---|---|
| Szafka 5 — automatyczny bok górnej szuflady | OK: bok 210 mm, luz nad bokiem i tyłem 30 mm; dolna ma bok 238 mm i luz 91 mm. |
| Szafka 5 — ręczne 238 mm na górze | OK w UI: komunikat o 0 mm luzu do wzmocnienia pod blatem i minimum 5 mm; przycisk zmienia bok na 210 mm. |
| Pełny wysuw Szafki 5 | OK w lokalnej symulacji z repozytorium: obie szuflady na NL 550, co 5 mm, bez kolizji. |
| Reling | OK: ostrzeżenie przy wystawaniu frontu o 145 mm, oba przyciski dostępne i pole „reling” w wierszu szuflady. „Dodaj reling” dodaje 1 komplet NL 550 do produktów szafki i projektu oraz 30,00 zł do wyceny. Ścieżka „Zostaw bez relingu” wymaga powtórzenia w UI — próba kliknięcia nie dała wiarygodnego potwierdzenia. |
| Formatki <60 mm | OK: test szafki W=90 mm daje dno/wieniec i półkę 54 mm, drzwi 42 mm; zamówienie pokazuje odpowiednio 60 mm. Potwierdzenie ręcznej docinki dna/wieńca zmienia błąd w ostrzeżenie, bez zmniejszenia wymiaru zamówienia. |
| Wstawka w Szafce 3 | OK: pole w Strukturze wnętrza. Szeroka ma trójkąty, konfirmaty i konfirmaty z listwą. Konfirmaty: 3 szt. przy wysokości 720 mm. Listwa pojawia się w formatkach. |
| Wstawka 40 mm | OK: pytanie o poprawność wymiaru, przyciski „Popraw na 60 mm” i „Tak, 40 mm — docinam ręcznie”; wstawka i listwa zamawiane jako 720×60. Potwierdzenie pozostawia ostrzeżenie o ręcznej docince. Sam przycisk poprawy na 60 nie został osobno kliknięty. |
| Kolizja drzwi w rogu | OK: bez wstawki, zawias Szafki 3 z prawej → około 74°. Opcje 18 mm i 60 mm opisane „bez kolizji”; zastosowanie 18 mm usuwa komunikat. Zawias z lewej w tej konfiguracji daje około 6°, więc jego brak w propozycjach przy 74° jest prawidłowy. |
| Cokoły | OK w geometrii oryginalnego projektu: 1854×100×18 i 1737×100×18; wspólna płaszczyzna styku, bez szczeliny i bez przenikania objętości. Lokalne sprawdzenie zamkniętej bryły zabudowy nie wykryło przenikań >1 mm. |
| Każde otwarcie 3D od 90° | OK w UI: ustawienie suwaka na 0°, zamknięcie i ponowne otwarcie daje 90°. |
| Klapy — przełączniki i formatka | OK: skrzydło/klapa, następnie góra/dół; formatka „Klapa”, podnośnik lub amortyzator we właściwej pozycji produktów i wyceny. |
| Klapy — dobór i liczby | OK dla sprawdzonych przykładów: 600×400×18 mm, 680 kg/m³ → 2,9376 kg, 1×150 N przy 90°; 901×400 → domyślnie 2 siłowniki/amortyzatory i 3 zawiasy. Ręczna 1 sztuka przy 901 mm daje ostrzeżenie i informację o przekroczeniu udźwigu. Sprawdzono zgodność z tabelami osadzonymi w kodzie, nie wykonano osobnego odczytu oryginalnych PDF producenta. |

## 2. Potwierdzone błędy

### B1 [P2] Przycisk poprawy boku szuflady proponuje wymiar nadal niespełniający luzu

Odtworzenie:

1. Szafka stojąca 600×720×560, zwykły wieniec, 3 szuflady, równy podział, domyślny luz między frontami 2 mm.
2. W dolnej szufladzie ręcznie wybierz bok 238 mm.
3. Pojawiają się jednocześnie dwie poprawki: 210 mm z kontroli wysokości frontu oraz 178 mm z kontroli przestrzeni nad skrzynką.
4. Wybierz „Zmień bok szuflady na 210 mm”.

Wynik: nadal błąd, zostaje 1 mm zamiast minimum 5 mm i dopiero kolejny przycisk proponuje 178 mm. Potwierdzone w UI i ponownie w lokalnych obliczeniach.

Przyczyna: `fitLower` sprawdza tylko wysokość frontu, niezależnie od kontroli drogi skrzynki. [szafki.jsx:2807](https://github.com/darekn95/mebloprojekt/blob/main/szafki.jsx#L2807).

Zalecenie: wyliczać proponowany bok z przecięcia wszystkich ograniczeń albo ukryć słabszą propozycję. Test regresji: po wybraniu proponowanego mniejszego boku nie może pozostać błąd luzu dla tej szuflady. Nie zmieniać wymaganego minimum 5 mm.

### B2 [P2] Ręczna liczba zawiasów klapy różni się od liczby punktów wiercenia

Odtworzenie: klapa 600×400, w polu „zawiasy” wpisz 4. UI przyjmuje wartość i zamawia 4 sztuki. Geometria i plan wierceń zawierają 3 punkty. Przy ręcznym 1 zamówienie zawiera 1 sztukę, ale punkty są 2. Automatyczne 2 i 3 są spójne.

| Wpisano | Zamówienie | Punkty geometrii/wiercenia |
|---|---|---|
| 1 | 1 | 2 |
| 2 | 2 | 2 |
| 3 | 3 | 3 |
| 4 | 4 | 3 |

Przyczyna: `nZaw >= 3 ? [lewy, środek, prawy] : [lewy, prawy]`. [szafki.jsx:2460](https://github.com/darekn95/mebloprojekt/blob/main/szafki.jsx#L2460).

Zalecenie: uzgodnić dozwolony zakres ręcznej liczby zawiasów. Następnie albo walidować pole, albo generować dokładnie N punktów. Liczba w zamówieniu, rysunku i planie musi być identyczna. Nie zgadywać zasad montażu dodatkowych zawiasów.

### B3 [P2] Podsumowanie zamówienia pokazuje błędny rozmiar arkusza blatu

W sekcji „Rozkrój na płycie” → „Płyty do zamówienia” materiał „Blat roboczy” dostaje opis arkusza 2800×2100. Tymczasem rozkrój blatu jest liczony i rysowany na pasie 4100×600 w tym projekcie.

Przyczyna: podsumowanie bezwarunkowo wstawia `SHEET_W` i `SHEET_H` dla każdej grupy. [szafki.jsx:17645](https://github.com/darekn95/mebloprojekt/blob/main/szafki.jsx#L17645).

Zalecenie: etykietę brać z wymiarów arkusza grupy materiałowej. Testować blat 600 i 1200 oraz zwykłą płytę. To błąd opisu zamówienia; nie potwierdzono na tej podstawie błędu samej ceny ani liczby kupowanych pasów.

## 3. Uwagi do wizualizacji

### U1 Kąt klapy w bryle jest ograniczony do 90°

`klapaObrot` stosuje `Math.min(90, angle)`. Lokalny test bryły dla 90° i 100° dał identyczne współrzędne frontu. Tymczasem formularz doboru podnośnika pozwala wybrać 100°, a suwak 3D ma zakres do 110°. [szafki.jsx:9433](https://github.com/darekn95/mebloprojekt/blob/main/szafki.jsx#L9433).

Do ustalenia: czy 3D ma odwzorowywać cały zakres suwaka, czy klapy mają celowo kończyć na 90°? Jeśli ograniczenie jest zamierzone, interfejs powinien je jasno pokazywać. Reset każdego nowego otwarcia do 90° ma zostać niezależnie od tej decyzji.

### U2 Wąski podgląd: nagłówek zajmuje większość wysokości okna

Przy oknie około 600×495 px nagłówek z paskami obu ciągów zajmuje około 377 px. Po „Pokaż rysunek” sam rysunek jest w dużej części zasłonięty. Warto przetestować zwijanie pasków albo mniejszy nagłówek na wąskich ekranach. Zrzut `podglad-przywrocony.png` pozostaje lokalnie, nie jest dołączony do repozytorium. To obserwacja układu; nie zmieniano rozmiaru okna na potrzeby testu.

## 4. Nieaktualne lub niepełne punkty listy

- Plan zawiasów klap już istnieje: dla klapy do góry w sprawdzonym korpusie znajduje się w „Wzmocnienie poziome”, dla klapy w dół w „Dno”; po dwa punkty przy automatycznych 2 zawiasach. Nie przedstawiać tego jako całkowitego braku funkcji. B2 opisuje konkretną pozostałą niespójność.
- Kod ma kontrolę ruchu klap (`klapaHit`, `openingMsgs`) i uwzględnia blat jako przeszkodę. Nie ma podstaw do stwierdzenia, że kontrola klap całkowicie nie istnieje. Wariant klapy do góry na Szafce 3 przy domyślnych 90° nie zgłosił kolizji w lokalnym sprawdzeniu. Scenariusze graniczne z górną szafką oraz rzeczywistą osią zawiasu wymagają osobnego uzgodnienia i testu — nie uznano ich za zaliczone.
- Brak propozycji przełożenia zawiasów przy kącie 74° jest celowy, jeżeli po przełożeniu wynik jest gorszy. W tym projekcie uzyskano około 6°.

## 5. Metoda i ograniczenia

- Przejrzano `AGENTS.md`, `README.md`, `AI_NOTES.md`, `BLEDY.md`, `NASTEPNE-KROKI.md`, `SLOWNIK.md`, spis instrukcji oraz odpowiednie istniejące testy.
- Kod źródłowy: blob SHA `fbae069982232a2b2417fda2fac595e9856554b2`; `standalone.html`: `8d966b92c15bdffe0204a1c12e62fc6ae834ab98`. Osadzony kod standalone jest identyczny z `szafki.jsx` po pominięciu brzegowych białych znaków.
- Lokalny `work/audyt-core.mjs` zawiera wybrane funkcje obliczeniowe z tego źródła. Z funkcji rysujących 3D pominięto końcowy rendering SVG, zachowując budowę brył. Użyto oryginalnej funkcji `symuluj` z `testy/symwysuw.mjs`. To audyt pochodny, a nie uruchomienie pełnej suity Playwright repozytorium.
- Brak przenikań oznacza wynik zastosowanej kontroli prostopadłościanów przy zamkniętej zabudowie i tolerancji >1 mm z wyjątkiem cienkich płyt zgodnym z audytem repozytorium. Nie oznacza certyfikacji wszystkich ruchów, okuć i wariantów konstrukcji.
- Nie wykonano pełnego `pelny.sh`, losowych edycji, całości audytu macierzowego ani eksportu i oględzin PDF. Nie wykonano pełnego porównania każdej formatki z bryłą we wszystkich widokach. Nie zmieniano aplikacji i nie opublikowano żadnych poprawek.
- Konsola: ostrzeżenie Tailwind CDN i komunikat Babel o źródle >500 KB. Nie wykryto w odczytanych logach wyjątku aplikacji; komunikat Babel nie jest awarią funkcji.

## 6. Zalecana kolejność dla Claude

1. Naprawić B2 (spójność liczby zawiasów i wierceń), następnie B1 i B3.
2. Dodać celowane regresje do `klapy`/`audytwierc`, `szuflady` i testu opisu zamówienia blatu.
3. Uzgodnić U1 oraz testy klapy przy górnej szafce/blacie na konkretnym układzie i z określoną osią zawiasu.
4. Przy zmianie `szafki.jsx` wygenerować ponownie `standalone.html`. Pełny przebieg zgodnie z zasadami repozytorium przed wyraźnie zleconym scaleniem. Sam raport nie jest zgodą na modyfikację ani publikację.

Wyniki liczbowe `wyniki-obliczen.json` oraz skrypty audytu pozostają lokalnie. Ten plik na GitHubie zawiera opis wyników i kroki odtworzenia; nie wymaga tych załączników do zrozumienia zgłoszonych błędów.
