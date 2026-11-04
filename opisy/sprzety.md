# Sprzęty w zabudowie

Piekarnik i mikrofala (użytkownik 2026-11-04). Siedzą we wnęce, czyli w kolumnie
poziomu szafki — zwykle w słupku między szufladami a drzwiami. Lodówka, zmywarka,
płyta i zlew dojdą później, każde osobno.

W karcie „Struktura wnętrza” kolumna ma cztery rodzaje: „Półki i drzwi /
Szuflady / Blenda / **Sprzęt**”. Przy „Sprzęt” wybierasz typ: **Piekarnik /
Mikrofala**. Powrót na inny rodzaj zdejmuje sprzęt, a kolumna wraca do tego, co
miała wcześniej.

## Co program liczy sam

- **Wnęka**:
  - szerokość — szerokość kolumny (w szafce z jedną kolumną: szafka − 2 boki);
  - wysokość — światło poziomu;
  - głębokość — korpus do pleców.

  Karta sprzętu pokazuje „Wnęka teraz: szer. × wys. × głęb.”.
- **Kolumna sprzętu** jest pusta: bez drzwi, półek, szuflad, rury i podziału. Nie ma
  więc zawiasów ani uchwytów szafki. Sprzęt stoi na płycie pod wnęką (półka
  przelotowa poziomu albo dno).
- **Front sprzętu** jest na środku wnęki, a dołem na płycie pod nią. Wystaje przed lico
  o 20 mm (`SPRZET_FRONT_GR`). Front zakrywa krawędzie płyt wokół wnęki: przy
  piekarniku 595 we wnęce 564 to po 15,5 mm na boki.
- **Typowe wymiary** (`SPRZETY`, sprzęt do zabudowy 60 cm):

  | | front | wnęka: szer. | wys. min. | głęb. min. | drzwi | uchwyt |
  |---|---|---|---|---|---|---|
  | piekarnik | 595 × 595 | 560–568 | 585 | 550 | w dół, 480 | 40 |
  | mikrofala | 594 × 382 | 560–568 | 362 | 300 | zawias z lewej, 450 szer. | — |

## Co ustawiasz ręcznie

Każdy typowy wymiar możesz zmienić polem w karcie sprzętu. Puste pole oznacza
wartość typową, a podpowiedź pod polem ją podaje. Pola:
- **Front** — szerokość i wysokość;
- **Wnęka** — szerokość od / do, wysokość min. i głębokość min.;
- **drzwi** — w dół / zawias z lewej / zawias z prawej;
- **Drzwi** — wysokość albo szerokość;
- **Uchwyt** przed frontem.

Zmiana typu (piekarnik ↔ mikrofala) czyści wszystkie własne wymiary.
Wpisuj liczby z karty swojego modelu.

## Kontrole (Uwagi w karcie szafki)

- × **wnęka za wąska** albo ! **za szeroka** — szersza niż „do” znaczy, że sprzęt nie
  przykręci się do boków.
  - Przycisk przy jednej kolumnie: „Szafka N mm (wnęka M)”. Wnęka dostaje środek
    zakresu, np. 564.
  - Przycisk przy kilku kolumnach: „Kolumna M mm”.
- × **wnęka za niska** — w nawiasie podana jest wysokość, przy której front sprzętu nie
  wchodzi na front nad nim (z luzem 2 mm).
  - Przycisk przy kilku poziomach: „Poziom N mm”.
  - Przycisk przy jednym poziomie: „Wysokość szafki N mm (wnęka M)”.
- ! **otwarta wnęka nad sprzętem** — gdy nad frontem zostaje ponad 20 mm, np. mikrofala
  382 we wnęce 590. Rada: obniż poziom albo zamknij resztę blendą. Przycisk „Poziom N mm”
  ustawia najniższą wnękę, przy której front zakrywa krawędź płyty nad nim.
- × **wnęka za płytka** — przycisk „Głębokość szafki N mm”.
- × **front sprzętu zachodzi na front** szafki:
  - na drzwi, front szuflady, klapę albo blendę nad nim (np. własny front 610) —
    przycisk „Poziom N mm” podnosi płytę nad wnęką;
  - na drzwi obok — w szafce z kolumnami front sprzętu kryje prawie całą przegrodę,
    a drzwi sąsiedniej kolumny nakładają się na jej połowę. Rada: osobna szafka 600.
- × **otwieranie** (kontrola całej zabudowy, jak przy skrzydłach i klapach):
  - drzwi piekarnika opadają jak klapa w dół;
  - drzwi mikrofali to skrzydło z zawiasem z wybranej strony.

  Przeszkodą jest reszta zabudowy, a z własnej szafki tylko uchwyty. Komunikat:
  „Drzwi sprzętu (…) nie otworzą się wcale / do końca …”. Przy przeszkodzie z innego
  ciągu rada brzmi: przesuń sprzęt dalej od rogu albo odsuń ciągi. Front i uchwyt
  sprzętu są też przeszkodą dla drzwi i szuflad dookoła.

## Rysunki

- **Front szafki i ciągu**: ciemny front z obrysem drzwi, uchwytem i nazwą.
- **Z boku**: bryła w głąb wnęki (kreskowana) i front przed licem.
- **Z góry**: obrys sprzętu i frontu.
- **3D szafki i zabudowy**: bryła (`sprzet`) i front (`sprzet-front`) w kolorze
  `SPRZET_KOLOR`. To sprzęt, a nie formatka, więc audyt płyt go pomija.

## Czego jeszcze nie ma

- Sprzęt tylko w całej kolumnie poziomu — nie w poziomie kolumny (odcinku).
- Sprzęt nie trafia do zamówienia ani wyceny (kupuje się go osobno).
- Liczby z karty konkretnego modelu wpisujesz ręcznie. Katalogu modeli nie ma.

## Skąd liczby

Typowe wymiary sprzętu do zabudowy 60 cm. Decyzja użytkownika 2026-11-04: „Typowe,
do zmiany w polach”, a każdy wymiar trzeba sprawdzić z kartą modelu. Luz 2 mm przy
frontach to zapas, żeby front sprzętu nie dotykał frontu nad nim.

## Gdzie w kodzie i testy

- **Kod**:
  - stałe i parametry: `SPRZETY`, `SPRZET_POLA`, `sprzetKolumny`, `kolumnaSprzetu`;
  - kontrole: `computeGeo`, blok „Sprzety w zabudowie” przed formatkami;
  - przyciski: `sprzetw:` / `sprzeth:` w `NoteLine` i `runFix`;
  - karta: `uiSprzetu`;
  - rysunki: `SprzetElewacja`, `SideView`, `TopView`, `Scene3D`, `Assembly3D`;
  - otwieranie: `swingBodies` / `openingMsgs`.
- **Testy**:
  - `funkcje` — wnęka, uwagi i przyciski, front na drzwiach nad nim i obok, ślepy róg;
  - `sprzety` — klikane w aplikacji.
- Pola w danych: `SLOWNIK.md`.
