# Tryb makiety

Makieta to drugi sposób pracy w tej samej aplikacji: rysunek pomieszczenia, klikanie
i przeciąganie zamiast formularzy. Działa na **tych samych danych projektu** co tryb
techniczny — nic nie jest kopiowane ani liczone osobno. Plan i ustalenia:
`makiety/BRAKI.md` (sekcja E), wzór wyglądu i obsługi: `makiety/dodaj.html`.

## Trzy tryby

Przełącznik w nagłówku: **Makieta prosta · Makieta szczegółowa · Techniczny**.
Wybór pamięta przeglądarka; nowy użytkownik zaczyna w trybie technicznym.

- **Makieta prosta**:
  - wymiary szafki, fronty (drzwi, klapy, szuflady), uchwyty i tip-on;
  - półki, przegroda, drążek, cokół i nóżki;
  - blat roboczy (tylko czy jest), AGD.
  - Ustawień, których nie pokazuje (wzmocnienia, wycięcia, kolizje), **nie kasuje**.
- **Makieta szczegółowa**: wszystkie funkcje aplikacji w kartach w stylu makiety. Na rysunku
  też wzmocnienia, wycięcia i elementy kolizyjne.
- **Techniczny**: dotychczasowa aplikacja, bez zmian.

## Co program robi sam (krok 1)

- Rysuje ciągi oglądanego pomieszczenia z prawdziwej geometrii (te same rysunki co widok
  ciągu w trybie technicznym), jak w makiecie „Dodaj”: **z góry nad widokiem z przodu**.
  Przełączniki: „Z góry”, „Ciąg górny” / „Ciąg dolny” (gdy jest piętro), „Fronty” (wyłączone —
  wnętrze); wybór pamięta przeglądarka. Szafki wolnostojące stoją obok, z odstępem.
- Nagłówek w makiecie jest zwarty: bez „Zwiń wszystkie” i „Pokaż rysunek” (to przyciski kart
  trybu technicznego).
- **Duży rysunek** (przełącznik, domyślnie włączony; użytkownik 2026-11-09): widok ciągu z przodu ma
  wysokość okna, widok z góry tę samą skalę nad nim. Oba siedzą w oknie z przewijaniem (`mak-plotno`):
  szeroki ciąg przewija się w bok, oba widoki razem — w dół. Zaznaczona szafka sama wjeżdża w okno.
  Wyłączony — cały ciąg w szerokości okna, jak dawniej. „Tylko zaznaczona szafka” zawsze w oknie.
- **Kartę można schować**: klik w otwartą zakładkę albo „‹” w karcie; rysunek dostaje całą szerokość.
  Klik w zakładkę otwiera kartę z powrotem. Pamięta przeglądarka.
- W karcie „Szafka” nie ma wiersza „Ciąg” — widać go na przycisku „Ciąg ▾” nad rysunkiem.
- Klik w szafkę (albo wybór z listy „Szafka ▾”) robi ją aktywną szafką projektu — po przejściu
  do trybu technicznego otwiera się właśnie ona.

## Uchwyty na rysunku (krok 2)

Przeciągasz tylko w zaznaczonej szafce; zakładka mówi, co:
- **Szafka**: prawa krawędź — szerokość, górna — wysokość; w widoku z góry przód — głębokość.
  Te same liczby w polach karty (Enter albo wyjście z pola zapisuje).
- **Półki**: półka w górę / w dół — zmienia światło pod nią i nad nią (`shelfTargets`).
- **Przegroda**: w lewo / w prawo — zmienia szerokość kolumn obok (`col.w`).
- **Szuflady**: linia między frontami — zmienia front pod nią i nad nią (`drawers[].front`).

Zasada zapisu:
- To te same pola co w trybie technicznym.
- Przeciągnięta rzecz i jej sąsiad dostają liczby. Pozostałe zostają na tym, co teraz widać.
- **Ostatnie** światło, kolumna i front idą na auto i biorą resztę — sumy się zgadzają, bez błędu
  „nie zgadzają się o …”.
- Co 10 mm. Światło i front mają najmniej 60 mm, kolumna 100 mm.
- W trakcie przeciągania widać tylko podgląd (linia i liczby); zapis jest po puszczeniu.
  „Cofnij” cofa całe przeciągnięcie.
- Przyciski „Półki / Fronty / Kolumny po równo” wracają do auto.
- Kolumny podzielone na poziomy kolumny (granice frontów) przeciąga się dopiero w trybie technicznym.

Polki i przegrody widać we wnętrzu, więc te zakładki same przełączają rysunek na „Otwarty”.

**Wysokość szafki w ciągu** (użytkownik 2026-11-09): po zmianie (uchwyt albo pole) od razu pytanie:
- „Cały ciąg” — `run.H` ciągu i szafki o tej samej wysokości co zmieniona przed zmianą;
- „Ten ciąg i połączone w narożniku” — to samo we wszystkich ciągach dolnych połączonych `corner.of`
  (szafka narożna albo dwie szafki w rogu — wspólny blat), także dalej, np. w U;
- „Tylko ta szafka” (albo Esc).

Słupki (`slupek`) i lodówka w ciągu zostają. Szafka sama w ciągu — wysokość ciągu idzie za nią bez
pytania. Wolnostojąca i ciąg górny — bez pytania.

## Przyciski w karcie (krok 4)

Jak w makiecie „Dodaj”: rząd przycisków na kolumnę (w szafce z jedną kolumną bez podpisu).
Zapis do tych samych pól co tryb techniczny; liczy aplikacja.
- **Drzwi i klapy**: „1 drzwi / 2 drzwi / Klapa ↑ / Klapa ↓ / Bez frontu” (`col.doors`, `col.klapa`);
  przy frontach „uchwyt / tip-on” (`col.handles[i]`, `col.otwieranie[i] = "tipon"`). Tip-on zostaje
  przy zmianie liczby drzwi i przy klapie. Szuflady w kolumnie zmieniają się w drzwi.
- **Szuflady**: 1–5 w kolumnie (`col.drawers`, fronty auto, system z szafki / ciągu jak w trybie
  technicznym — `systemKontekstu`).
- **Półki**: „− N +” (`shelfTargets`, wszystkie światła na auto) i „drążek” (`col.drazki`) w najwyższym
  świetle — przy zmianie liczby półek zostaje na górze.
- **Przegroda**: 1–4 kolumny w poziomie; szerokości na auto, nowa kolumna jak ostatnia (drzwi, półki).
- **Cokół i nóżki**: cokół brak / pod korpusem / w obrysie i wysokość, nóżki brak / są i wysokość.
  W ciągu — **cały ciąg** naraz, jak karta ciągu: cokół przez `run.plinth` (bez uwagi „nie zgadza się
  z ciągiem”), nóżki we wszystkich szafkach ciągu; lodówka wolnostojąca w ciągu zostaje. Szafka
  wolnostojąca — tylko ona. Ciąg wiszący: cokołu i nóżek nie ma (jak `ciagWisi`).
- **Szafka**: „Blat roboczy ciągu: jest / nie ma” (`run.worktop` przez `setRun` — wspólny wieniec
  wyłączony, szafki ciągu dopasowane do blatu, jak w karcie ciągu). Tylko ciąg stojący.

Kolumny złożone (podział na poziomy kolumny, sprzęt) zmienia się w trybie technicznym — karta to mówi.

## Paleta i klocki (krok 5)

Zakładka **Dodaj** (pierwsza). Kafelki można przeciągnąć na rysunek albo kliknąć.
- **Szafki** — szablony aplikacji (`TEMPLATES`) i brakujące z makiety „Dodaj” jako szablon + zmiany
  (`MAK_PALETA`):
  - kuchnia dół: Dolna 1 drzwi 450, Dolna 2 drzwi 800, Dolna z szufladami 600 (3), Zlewowa 800 (bez półek),
    Słupek, Narożnik L, Zmywarka, Lodówka wolnostojąca;
  - kuchnia góra: Szafka wisząca, Górna narożna L;
  - szafa w zabudowie (ze Słupka: 2000, cokół 100, 600 w głąb): Szafa 2 drzwi 1000 (dwie kolumny: 4 półki;
    półka 300 pod wieńcem i drążek pod nią), Szafa 1 drzwi 500 (5 półek), Regał otwarty 600 (5 półek);
  - wolnostojące (450 w głąb, jak w makiecie): Komoda 800 × 800 (4 szuflady), Szafka RTV 1600 × 450 (dwie
    kolumny, klapy w dół), Szafka nocna 450 × 500 (2 szuflady), Regał 800 × 1700 (4 półki), Szafa 800 × 2000
    (600 w głąb, 5 półek, 2 drzwi, cokół w obrysie i nóżki), Biurko.
- Gdzie ląduje szafka (`addCabinet` z `opcje`):
  - upuszczona na szafkę w ciągu — przed nią (lewa połowa) albo za nią (prawa);
  - klik — na koniec ciągu zaznaczonej szafki;
  - kuchenne dolne i wisząca biorą wysokość, głębokość i cokół ciągu (`wymiaryCiagu`);
  - wisząca na ciąg dolny — do ciągu górnego nad nim (zakładany, gdy go nie ma — `addUpperRun`); bez ciągu —
    komunikat;
  - wolnostojące — zawsze obok, w oglądanym pomieszczeniu; nazwa z palety („Komoda”, „Komoda 2”).
- **Klocki** (`MAK_KLOCKI`): półka (+1), drążek, 1 / 2 drzwi, klapa ↑ / ↓, bez frontu, 1–4 szuflady, przegroda
  (nowa kolumna za tą, szerokości auto). Upuszczony — na kolumnę pod kursorem; klik — pierwsza pasująca
  kolumna zaznaczonej szafki. Półka i drążek tylko do kolumny z drzwiami / otwartej — inaczej komunikat.
  Te same zmiany co przyciski karty (`makUstawFront`, `makUstawSzuflady`, `makUstawPolki`, `makDodajPrzegrode`).
- W trakcie przeciągania nad rysunkiem widać, gdzie spadnie („upuść: przed „Szafka 2””).
- Jeszcze nie ma: biurko z kontenerem szuflad, szafa z szufladami na dole (dwa poziomy).

## Co ustawiasz ręcznie

- Pomieszczenie, ciąg, szafka i widok — przyciski z rozwijaną listą. Ciąg domyślnie: ciąg
  zaznaczonej szafki z piętrem nad nim (cały pokój na raz jest za drobny do chwytania półek);
  „Wszystkie ciągi” — cały pokój i szafki wolnostojące; „Tylko zaznaczona szafka” — duży rysunek
  jednej szafki do przeciągania półek i szuflad.
- Zakładka po lewej wybiera, co pokazuje karta: Szafka, Szuflady, Półki, Drzwi i klapy,
  Przegroda, Cokół i nóżki; w szczegółowej także Korpus i plecy, Wzmocnienia, Wycięcia i kolizje.

## Kontrole

Własnych nie ma — liczy aplikacja, a uwagi (błędy, ostrzeżenia) widać w nagłówku od razu po zmianie.

## Czego jeszcze nie ma

Kolejne kroki (`makiety/BRAKI.md`, D):
- AGD (brakujące w aplikacji, A1);
- karty szczegółowej ze wszystkimi funkcjami.

## Gdzie w kodzie i testy

- **Kod**: `MakietaWidok`, `MakietaKarta`, `MakietaPaleta` (`MAK_PALETA`, `MAK_KLOCKI`), `MakietaWolnostojace`, `MakietaUchwyty`, `makWylicz`, `Rozwijana`;
  `makietaZmien` w `App`; `onPick` / `zazn` / `maxH` / `nakladka`
  w `AssemblyView` i `AssemblyTopView`; stan `tryb` w `App`.
- **Test**: `testy/makieta.mjs` (tryb, rysunek, zaznaczanie), `testy/makieta2.mjs` (uchwyty i zapis),
  `testy/makieta3.mjs` (pytanie o wysokość w ciągu i w narożniku), `testy/makieta4.mjs` (przyciski karty),
  `testy/makieta5.mjs` (paleta, klocki, karta do schowania, duży rysunek).
