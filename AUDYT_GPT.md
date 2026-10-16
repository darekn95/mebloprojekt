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
