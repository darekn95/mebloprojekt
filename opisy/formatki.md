# Formatki i oklejanie

Formatka to prostokąt płyty do zamówienia w firmie, która tnie i okleja. Lista
formatek jest w kartach „Formatki do zamówienia” (szafka) i „Formatki całego
projektu” (wszystkie szafki plus cokół i blat ciągów).

## Co program liczy sam

- **Lista** powstaje z tej samej geometrii co rysunki i 3D, więc każda płyta z rysunku ma swoją formatkę. Pilnują tego audyty `formatki` i `audyt`.
- **Nazwy formatek** są stałe i od nich zależy grupowanie, ceny i testy (spis w `SLOWNIK.md`, sekcja 5).
  - Korpus: Bok / Bok lewy / Bok prawy, Dno / wieniec, Blat, Półka, Półka przelotowa, Przegroda pionowa, Wspornik pionowy, Blenda, Cokół, Plecy …
  - Fronty: Drzwi nakładane / Drzwi wpuszczane, Klapa, Front szuflady, Element stały (fix).
  - Szuflady: Dno, Tył i Bok szuflady.
  - Narożnik: Kątownik, Maskownica, Bok ramienia i inne.
  - Te same wymiary i okleina łączą się w jeden wiersz z liczbą sztuk.
- **Wymiary**: długość × szerokość w mm, z grubością i materiałem z karty „Płyty”.
  - **Korpus** — płyta korpusu.
  - **Fronty** — płyta frontów albo „z tej samej płyty co korpus”.
  - **Półki, dno i tył szuflad, boki skrzynki DXS** — płyta półek albo korpusu.
  - **Plecy** — HDF albo płyta.
  - **Blat roboczy** — arkusz blatu.
- **Okleina** (krawędzie oklejane PVC):
  - **boki korpusu**: czoło zawsze; tył, gdy szafka nie ma pleców; góra i dół, gdy wieniec / dno stoi między bokami;
  - **dno / wieniec, półki, półka przelotowa, przegroda**: krawędź przednia;
  - **fronty** (drzwi, klapa, front szuflady, fix): wszystkie krawędzie;
  - **blat z płyty**: przód (blat roboczy ma fabryczny profil — oklejane końce), oba końce, tył gdy wystaje albo szafka stoi wolno;
  - **wzmocnienie**: jedna długa (przednia) krawędź;
  - **tył szuflady i bok skrzynki DXS**: krawędź górna; dno szuflady: bez okleiny;
  - **plecy HDF**: bez okleiny.
  - Metry okleiny liczy zamówienie — osobno okleina płyty i blatu.
- **Kolory płyt** (karta „Płyty”) są w każdej szafce osobno. Po zmianie koloru program pyta: „Zmienić ten kolor także w innych szafkach?” — cały ciąg, całe pomieszczenie, cały projekt albo tylko ta szafka. Kopiuje kolor i dekor tam, gdzie ta płyta jest używana (fronty i półki — tylko w szafkach z osobną płytą). Nowa szafka w ciągu bierze płyty ostatniej szafki ciągu, poza ciągiem — aktywnej (użytkownik 2026-10-24).
- **Kolory na rysunkach**: „Realne kolory” / „Rozróżnij fronty” przełącza wszystkie szafki projektu naraz. Fronty z płyty korpusu w „Rozróżnij fronty” mają odcień korpusu (jasna płyta ciemniej, ciemna jaśniej), a nie ukryty kolor płyty frontów. PDF zawsze w realnych kolorach. Struktura słojów — wzory każdej szafki także na rysunku ciągu; 3D słojów nie rysuje, tylko kolor płyty.
- **Usłojenie**: gdy „Kierunek usłojenia ma znaczenie”, formatka nie obraca się w rozkroju; plecy i bez usłojenia — mogą.
- **W ciągu z cokołem / blatem ciągu** własny cokół i blat szafki nie idą do zamówienia — zastępuje je wspólna formatka ciągu.
- **Dodatkowe formatki** (karta „Dodatkowe formatki”): wpisane ręcznie, z własną nazwą (puste — „Dodatkowa formatka N”), materiałem i okleiną.

## Wąskie formatki (reguła 60 / 30 mm)

Firma nie tnie i nie okleja formatek węższych niż 60 mm (`MIN_PART`). Węższą niż
30 mm (`MIN_DOCIECIE`) trudno dociąć ręcznie.

| Wymiar | Uwaga | Przyciski | Do zamówienia |
|---|---|---|---|
| poniżej 30 mm | błąd „węższej niż 30 mm nie da się dociąć ręcznie … Popraw wymiar” | „Zwiększ do 60 mm” (boki / tył skrzynki DXS, gdy się mieści) | — |
| 30–60 mm | ostrzeżenie „w zamówieniu zostanie 60, a do N trzeba ją dociąć ręcznie po odbiorze” | „Tak, docinam ręcznie”, „Zwiększ do 60 mm” (jw.) | 60 mm |
| 30–60 mm, potwierdzone | informacja „do ręcznego docięcia (potwierdzone)” | — | 60 mm |

- Potwierdzenie jest zapisane przy tej formatce: nazwa i właściwy wymiar w szafce albo w ciągu (cokół ciągu).
- Wstawka w rogu ma te same progi.

## Kontrole i przyciski

- **Reguła 60 / 30 mm** — tabela wyżej.
- **Formatka nie mieści się w arkuszu** — w rozkroju (`opisy/rozkroj.md`).
- **Klik w nazwę formatki** podświetla ją na rysunku 3D.

## Skąd liczby

- **60 mm**: ograniczenie firmy tnącej i oklejającej (użytkownik); 30 mm i podział na błąd / ostrzeżenie / informację to decyzja użytkownika 2026-10-21.
- **Okleina wzmocnień i boków ramienia**: komentarz użytkownika 2026-10-17; blat roboczy — 2026-09-29.

## Gdzie w kodzie i testy

- **Obliczenia**: `computeGeo`, koniec — `P(...)` (formatki z `edges`, `noteOf`), `drawerParts` / `dpGroups`; `maleFormatkiMsgs`, `naZamowienie`, `kluczDociecia`, `bezWspolnychFormatek`, `formatkiSzafki`; ciąg — `runPlinthPanels`, `runTopPanels`; narożnik — `cornerArmParts`.
- **Przyciski**: `dociacpanel:`, `zwieksz60:`, `wstawkadociac`.
- **Testy**: `formatki` (3D ↔ formatki), `audyt`, `minform`, `wstawka`, `extra`, `custom`, `grain`, `mats`, `paneltest`.
