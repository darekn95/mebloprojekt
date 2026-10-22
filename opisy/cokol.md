# Cokół i nóżki

Karty „Cokół” i „Nóżki” szafki oraz podsekcja „Cokół” w karcie ciągu.

## Co program liczy sam

- **Cokół szafki**: płyta korpusu o podanej wysokości (domyślnie 100 mm), cofnięta od lica o „Cofnięcie w głąb”. Dwa sposoby montażu:
  - **„Pod korpusem”** — pod dnem, dokłada się do wysokości szafki;
  - **„Pod dnem, w obrysie”** — boki schodzą do podłogi, dno stoi nad cokołem, a cokół mieści się w wysokości korpusu. Wymaga dna między bokami.
- **Cokół ciągu**: jedna płaszczyzna pod całym ciągiem, z tym samym sposobem montażu.
  - Dłuższy niż formatka dzieli się na styku korpusów i jest oklejony także na łączeniu.
  - W rogu cokoły dwóch ciągów idą na zakładkę: koniec każdego dochodzi do płaszczyzny drugiego.
  - Szafka w L ma osobny cokół ramienia.
- **Nóżki**: regulowane, pod dnem.
  - Domyślnie 100 mm wysokości.
  - Liczba: 4, plus 2 na każde pełne 900 mm szerokości, czyli od 900 mm para pośrodku.
  - Stoją w dwóch rzędach, 40 mm od krawędzi korpusu.
  - Przy cokole w obrysie nóżka podnosi szafkę tylko o tyle, o ile jest wyższa od cokołu.
  - Zamówienie łączy tylko te same warianty (kształt, wysokość, kolor).
- **Mocowanie cokołu**:
  - na nóżkach — wpina się klipsami („Złączka do cokołu”, po jednej na nóżkę przedniego rzędu);
  - bez nóżek — skręcany do korpusu na trójkąty: po 1 na krótki bok i co ok. 300 mm wzdłuż, min. 2.

## Co ustawiasz ręcznie

- **Cokół** (szafka i ciąg): włączony, montaż, wysokość, cofnięcie; podział cokołu ciągu.
- **Nóżki**: włączone, kształt (kwadratowa / okrągła), kolor (czarny, grafit, aluminium, chrom, biały, złoty), wysokość, liczba.

## Kontrole i przyciski

- **Nóżki niższe niż 50 mm** — błąd: najniższe regulowane w katalogu GTV to MLA-50 (50–75 mm). Przyciski „Ustaw 50 mm” / „Ustaw 100 mm”.
- **Cokół cofnięty w pas nóżek** (głębiej niż przedni rząd minus grubość płyty) — błąd: cokół wpięty w nóżki stoi przed nimi.
- **Za mało nóżek wpisanych ręcznie** (środek dna bez podpory przy szerokiej szafce) — ostrzeżenie z „Dołóż nóżkę na środku” / „parę na środku”.
- **Szafka płytka**: przedni i tylny rząd nóżek nachodzą na siebie (poniżej 160 mm) — ostrzeżenie z „Popraw głębokość”.
- **Cokół tej szafki inny niż ciągu** — ostrzeżenie: cokół ciągu idzie jedną płaszczyzną.
- **Cokół ciągu dłuższy niż formatka** — ostrzeżenie o podziale albo błąd, gdy nie ma gdzie podzielić (`opisy/ciagi.md`).
- **Wysokość blatów w rogu / pomieszczeniu**: przycisk „Wyrównaj cokołem i nóżkami (N mm)” zmienia cokół i nóżki razem.

## Skąd liczby

- **Nóżka MLA-50**: katalog GTV 2023, s. 481 (regulacja 50–75 mm); błąd z przyciskiem to decyzja użytkownika 2026-10-17.
- **Rozstaw**: 40 mm od krawędzi i para co 900 mm to zasada robocza programu.
- **Mocowanie**: klipsy na nóżki przedniego rzędu i trójkąty co ok. 300 mm — ustalone z użytkownikiem.

## Gdzie w kodzie i testy

- **Obliczenia**: `computeGeo` — `plinthInBody`, `plinthH`, `legH`, `legBelow`, `legPlan`, formatka „Cokół”, okucia „Nóżka regulowana”, „Złączka do cokołu”, „Trójkąt meblarski”; stałe `NOZKA_MIN`, `LEG_INSET`, `LEG_W`, `autoLegs`.
- **Ciąg**: `runPlinth`, `runPlinthPanels`; róg — `cornerArmParts` (cokół ramienia).
- **Testy**: `cokol`, `cokolstd`, `nozki`, `nozkistd`, `ciag2`–`ciag4` (cokół ciągu), `audytzabudowa` (cokoły w rogu na zakładkę), `blatwys` (wyrównanie).
