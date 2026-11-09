# Makieta „Dodaj / zmień” a aplikacja — lista braków (2026-11-09)

Stan: makieta v24 (`makiety/dodaj.html`, artefakt „Makieta „Dodaj””) i `szafki.jsx` z gałęzi roboczej.
Cel ustalony z użytkownikiem 2026-11-09: makieta wejdzie do aplikacji jako **osobny tryb** z dwoma
poziomami — **prostym** i **szczegółowym**. W poziomie szczegółowym mają być **wszystkie funkcje
aplikacji**.

## A. Jest w makiecie, brakuje w aplikacji

To trzeba dorobić w aplikacji, bo makieta tylko rysuje i niczego nie liczy.

### A1. Sprzęty AGD
| Makieta | Aplikacja dziś |
|---|---|
| Ekspres do zabudowy (wnęka 45 w słupku) | brak typu (są: piekarnik, mikrofala, lodówka) |
| Mikrofala i ekspres wolnostojące na blacie (miejsce do szafki górnej) | brak |
| Zmywarka wolnostojąca (pod blat / z pokrywą) | tylko zmywarka do zabudowy |
| Okap: podszafkowy, w szafkę, kominowy; wysokość nad płytą, szafka nad nim | brak okapu |
| Płyta: szkło (na blacie) i kaseta (pod blatem) osobno, wycięcie = kaseta + 3 mm, głębokość kasety | jedno wycięcie szer. × głęb. + „pod blat” |
| Zlew: rant i komora osobno, 1 komora / z ociekaczem (L / P) / 2 komory | jedno wycięcie szer. × głęb. + „pod blat” |
| Wycięcie liczone od początku blatu (wymiar na rysunku) | „Przesunięcie w bok” od środka szafki |
| Lodówka wolnostojąca: luz z lewej i z prawej osobno, „na równo z meblami” | jeden luz z boku (50) |
| Lodówka: rodzaje w jednym miejscu (słupek / podblatowa w szafce / podblatowa w ciągu / wolnostojąca) | słupek i wolnostojąca w ciągu; podblatowej brak |
| Słupek: do 3 sprzętów, „razem — półka między”, „zamień miejscami”, „na wysokość blatu / pod blat / do górnych” | sprzęt w kolumnie poziomu; ustawianie ręcznie przez poziomy |

### A2. Szablony szafek
W aplikacji: Szafka stojąca, Szafka wisząca, Biurko, Słupek, Narożnik L, Górna narożna L, Zmywarka,
Lodówka wolnostojąca. **Brak**:
- Dolna z szufladami, Zlewowa;
- Szafa 2 drzwi z drążkiem, Szafa 1 drzwi, Szafa z szufladami, Regał otwarty (w zabudowie);
- Komoda, Szafka RTV, Szafka nocna, Regał, Szafa wolnostojąca (cokół w obrysie + nóżki);
- Biurko z kontenerem szuflad; w zwykłym biurku płyta wzmacniająca 300 mm z tyłu (łączenie:
  konfirmaty + zaślepki albo mimośrody).

### A3. Obsługa (to jest główna wartość makiety)
- Paleta i klocki przeciągane na rysunek (sprzęt, szafki, półki, drążek, fronty, szuflady,
  przegroda, wzmocnienia).
- Zakładki „aktywne tylko to, co wybrane”; dwuklik / prawy przycisk — „Co zmienić?”.
- Uchwyty na rysunku:
  - szerokość, wysokość i głębokość szafki;
  - półki (z „równo z półką obok”), światło od dołu i od góry;
  - przegroda (światła kolumn);
  - szuflady (chwyt całej szuflady, „typowa” dla jednej).
- Przełącznik rodzaju zabudowy: kuchnia / szafa / wolnostojąca — zmienia paletę.

## B. Jest w aplikacji, brakuje w makiecie (poziom szczegółowy)

Tego **nie warto dorabiać w makiecie** — te funkcje już działają w aplikacji, z liczeniem.
- **Projekt**:
  - pomieszczenia, wiele ciągów;
  - narożniki (ślepy róg, szafka w L, wstawka, blat w rogu);
  - piętra ciągu górnego, przenoszenie między pomieszczeniami.
- **Korpus**:
  - złącza (wieniec / dno na boku albo między), plecy (HDF / płyta / brak, frez);
  - wieniec jako blat, fronty nakładane / wpuszczane, scalanie szafek.
- **Wnętrze**:
  - wiele kolumn o dowolnej szerokości, poziomy i poziomy kolumn, blenda, „→ poziom”;
  - mocowanie półek (kołki / konfirmaty / trójkąty), otwory kołków, plecy kolumny.
- **Drzwi**: luzy, liczba zawiasów (tabela GTV), strona, uchwyty i ich wystawanie, lustro, tip-on,
  podfrez, front dłuższy.
- **Klapy**: do góry / w dół, podnośniki / amortyzatory, siła, kąt, strona, kreator klap.
- **Szuflady**: system V-BOX / DXS-3D, bok, tył, reling, NL, „dopasuj fronty”, podfrez, kątownik pod
  dnem > 600 mm.
- **Cokół i nóżki**:
  - cokół: wysokość, cofnięcie, pod korpusem / w obrysie, podział;
  - nóżki: liczba, kształt i kolor.
- **Ściana**: zawieszki, listwa montażowa (też dystansowa), odsunięcie od ściany.
- **Kolizje**: wzmocnienia z wymiarami, wycięcie w narożniku, elementy kolizyjne (rura, gniazdko).
- **Materiały**: płyty, kolory, usłojenie, własne płyty (resztki).
- **Blat roboczy**: podział, łączenia, złącza.
- **Uwagi**: błędy i ostrzeżenia z przyciskami poprawek, kolejność montażu.
- **Wyniki**: formatki, rozkrój, okucia i zamówienie, wycena, plan wierceń, PDF.
- **Widoki**: zamknięty, otwarty, z boku, z góry, 3D (makieta ma tylko „z góry” i „z przodu”).

## C. W obu, ale działa inaczej (ujednolicić przy łączeniu)

| Co | Makieta | Aplikacja |
|---|---|---|
| Przegroda | jedna, `przegX` = światło lewej kolumny | dowolnie wiele kolumn, `col.w` |
| Wysokość szuflad | linie na rysunku, w szafie typowo 220 | wysokość frontu każdej szuflady, „dopasuj fronty” do boków |
| Drążek | 60 mm pod najwyższą półką | oś 70 mm pod płytą, od światła 800 mm, ostrzeżenia rury |
| Półki | odstęp min. 60, światło od dna / półki / do wieńca | światła (`shelfTargets`), kontrole |
| Głębokość | dolna 560, słupek / szafa 600, wolnostojąca 450 | `run.D` ciągu, `cab.D` szafki |
| Ciąg górny | dół 1400, góra 2120 | prześwit nad blatem 500, poziom montażu |
| Wysokość dolnej w kuchni | stała 720 (pod blat) | `run.H` ciągu |

## D. Propozycja kolejności

Poziom szczegółowy **nie** powstaje w makiecie od nowa. To karty aplikacji, które już istnieją
i liczą — tryb makiety tylko je otwiera po zaznaczeniu elementu. Dzięki temu „wszystkie funkcje
aplikacji” są od razu, bez pisania ich drugi raz.

1. **Tryb makiety w aplikacji — podgląd i zaznaczanie**:
   - rysunek ciągu z prawdziwych danych;
   - klik zaznacza; poziom prosty pokazuje kartę z makiety, szczegółowy — kartę z aplikacji.
2. **Uchwyty na rysunku zapisują dane aplikacji**:
   - wymiary szafki;
   - półki → światła;
   - przegroda → szerokość kolumny;
   - szuflady → wysokość frontów.
3. **Paleta i klocki** → szablony aplikacji (dopisać brakujące z A2).
4. **AGD**: dorobić w aplikacji to, czego brak (A1), i podpiąć do palety.

Makieta (artefakt) zostaje wzorem wyglądu i obsługi. Poprawiamy ją tylko wtedy, gdy trzeba pokazać
nowy pomysł, zanim trafi do aplikacji.

## E. Ustalenia z użytkownikiem (2026-11-09)

- **Trzy tryby**: Makieta prosta · Makieta szczegółowa · Techniczny (dzisiejsza aplikacja).
- **Makieta prosta**:
  - wymiary szafki, fronty (drzwi, klapy, szuflady), uchwyty i tip-on;
  - półki, przegroda, drążek, cokół i nóżki;
  - blat roboczy: tylko „jest / nie ma” (bez podziałów), AGD.
  - Scalania szafek tu nie ma.
- **Makieta szczegółowa**: **wszystkie** funkcje aplikacji, w **nowych kartach w stylu makiety**
  (nie karty z trybu technicznego). Na rysunku też to, czego prosta nie pokazuje:
  wzmocnienia, wycięcia, elementy kolizyjne itd.
- **Wygląd**: jak dzisiejsza makieta (zakładki po lewej, paleta i karta, rysunek). Do tego, jak
  w aplikacji: nazwa projektu, pomieszczenia, szafki, ciągi, widoki. Każde z nich na przycisku
  z rozwijaną listą, w stylu przełączników „Wyposażenie / Ciąg górny / Ciąg dolny / Fronty”.
- **Ustawienia spoza prostej**: makieta prosta ich nie kasuje (przyjęte domyślnie);
  szczegółowa je pokazuje i pozwala zmieniać.
- **Kolejność**: krok 1 — tryb makiety w aplikacji, podgląd z prawdziwych danych i zaznaczanie;
  potem uchwyty, paleta i klocki, AGD.
