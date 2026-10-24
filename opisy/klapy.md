# Klapy

Front uchylny zamiast skrzydła — tylko przy **jednych drzwiach w kolumnie**:
„front: skrzydło / klapa”, a przy klapie „otwierana: do góry / w dół”.

**„klapy zamiast drzwi”** (pod polem drzwi) zamienia każdą półkę kolumny w granicę
poziomów, a w każdym nowym poziomie stawia klapę do góry. Działa tylko w poziomie
z jedną kolumną. Dolne poziomy dostają wpisaną wysokość, górny jest auto.
Gdy klapa na każdej półce byłaby niższa, niż potrzebuje podnośnik (wpuszczane 265,
bliźniacze 257, górna nakładana 249 mm), przycisk jest szary z dopiskiem „za nisko
na klapy na każdej półce” (liczby w dymku) — bez ostrzeżenia przy wybranych drzwiach.
Obok warianty z mniejszą liczbą klap, które się mieszczą (`wariantyKlap`): „N klapy
zamiast drzwi” (pasma dzielone równo, półki w środku zostają) i „jedna klapa zamiast
drzwi” (cała kolumna, półki zostają) — użytkownik 2026-10-24.

## Co program liczy sam

- **Zawiasy**: te same co przy skrzydłach.
  - Do góry — na górnej krawędzi, w wieńcu albo płaskim wzmocnieniu nad klapą.
  - W dół — na dolnej krawędzi, w dnie pod klapą.
  - Liczba: 2, przy szerokości ponad 900 mm 3.
  - Rozstaw: 100 mm od krawędzi (`HINGE_REF`), reszta równo.
- **Zawias półnakładany**: gdy front zachodzi na płytę z zawiasem najwyżej na pół jej grubości (przegroda, półka pod klapą), idzie osobną pozycją „Zawias — półnakładany”.
- **Podnośnik / amortyzator**:
  - klapa do góry — podnośnik gazowy GTV PD-G00;
  - klapa w dół — amortyzator olejowy GTV PD-ECGDL;
  - liczba: 1, przy szerokości ponad 600 mm 2 (po jednym na bok).
- **Waga klapy**: płyta frontu 680 kg/m³ (górna granica od użytkownika, ok. 12,2 kg/m² przy 18 mm) plus lustro, jeśli jest.
- **Siła auto**: najsłabsza z tabeli producenta, która uniesie wagę przypadającą na jeden podnośnik.
  - Tabela zależy od wysokości frontu (300–600 mm, pomiędzy liczona proporcjonalnie, poniżej 300 jak 300) i od kąta.
  - PD-G00 (do góry): 50–150 N, kąt 75 / 90 / 100°.
  - PD-ECGDL (w dół): 60 / 80 / 150 N, tylko 90°.
- **Kąt otwarcia** klapy do góry: 90°.
- **Uchwyt**: na wolnej krawędzi — przy klapie do góry na dole, w dół na górze.
- **Jeden podnośnik**: na lewym boku.

## Co ustawiasz ręcznie

- **Kierunek**: do góry / w dół.
- **Kąt** (do góry): 75°, 90° albo 100°.
- **Liczba zawiasów**: 2–4.
- **Podnośniki / amortyzatory**: auto / 1 / 2.
- **Siła**: lista sił z karty producenta. Przy każdej jest udźwig przy tej klapie i znacznik „za słaby”.
- **Strona jednego podnośnika**: lewy / prawy.
- **Uchwyt**: na dole / na górze, wystawanie, uchwyt wyłączony.
- **Lustro**: na froncie (dolicza się do wagi).

## Kontrole i przyciski

- **Zawiasy**:
  - wpisano mniej niż 2 albo więcej niż 4 — błąd z „Ustaw N zawiasy”;
  - 3 lub 4 przy odstępie poniżej 600 mm — ostrzeżenie „za dużo zawiasów” z przyciskiem;
  - nie ma w czym zawiesić zawiasów (do góry: brak wieńca / płaskiego wzmocnienia nad klapą; w dół: brak dna) — błąd; przy klapie do góry z przyciskiem „Dodaj parę wzmocnień pod blat”.
- **Siła**:
  - wybrana słabsza niż z tabeli — ostrzeżenie z „Zwiększ siłę do N N” i (przy jednym) „Dołóż drugi — 2 × N N”;
  - klapa za ciężka nawet na najmocniejszy — ostrzeżenie (przy jednym podnośniku też z „Dołóż drugi”).
- **Wymiary klapy**:
  - wyższa niż 600 mm — ostrzeżenie „poza tabelą”: siła liczona jak dla 600, do sprawdzenia u producenta;
  - do góry niższa niż 290 mm — ostrzeżenie: podnośnik potrzebuje co najmniej 290 mm korpusu na boku;
  - płytka podnośnika / amortyzatora wypada poza płytą w tym poziomie (do góry: H z tabeli pod płytą z zawiasami, w dół: 245 mm nad płytą pod klapą, plus 15 mm płytki) — błąd „podwyższ poziom o N mm albo daj drzwi” (audyt GPT N74; wtedy bez ostrzeżenia o 290 mm);
  - szersza niż 600 mm z jednym podnośnikiem — ostrzeżenie „dają się dwa”.
- **Półka na drodze podnośnika** (bliżej frontu niż 50 mm, w zasięgu od płytki do mocowania na klapie) — ostrzeżenie z „Dodatkowe cofnięcie półek N mm”.
- **Otwieranie** (błąd): łuk klapy do jej kąta, sprawdzany co 1°. Przeszkody to blat, górna szafka, sufit z górnego ciągu, fronty i uchwyty innych poziomów → „nie otworzy się na 90°: po drodze stoi … — otworzy się tylko na ok. N°”. Pod blatem klapa do góry dostaje radę „zrób szufladę albo drzwi”.
- **Informacja** z wynikiem: „klapa do góry / w dół W × H — N × podnośnik X N”.

## Plan wierceń

- **Zawiasy klapy**: puszka ⌀35 w klapie, prowadnik na płycie nad klapą (do góry) albo pod nią (w dół).
- **Podnośnik PD-G00** — płytka na boku (albo przegrodzie / wsporniku):
  - wysokość: H mm pod spodem płyty z zawiasami; H zależy od kąta i nałożenia frontu, np. nakładane 90° → 234, wpuszczane 90° → 250;
  - 25 mm od przedniej krawędzi boku, przy wpuszczanych + grubość frontu.
- **Mocowanie podnośnika na klapie**: L mm pod spodem tej płyty (75° → 72, 90° → 62, 100° → 52) i drugi wkręt 24 mm niżej, 12 mm od wewnętrznej strony boku.
- **Amortyzator PD-ECGDL**: płytka 245 mm nad płytą pod klapą, mocowanie na klapie 62 i 86 mm, te same 25 / 12 / 24 mm.
- **Liczba stron**: jeden podnośnik — na wybranym boku; dwa — po obu stronach.

## Skąd liczby

- **Instrukcje**: `instrukcje/GTV_PD-G00_podnosnik_instrukcja.pdf` (tabela udźwigu, montaż s. 3) i `instrukcje/GTV_PD-ECGDL_amortyzator_karta.pdf` (tabela, s. 3).
  - W tabeli PD-G00 dla 50 N / 400 mm / 75° wydrukowano „12” — to literówka, liczymy 1,2.
- **Zawiasy**: katalog GTV 2023 (`instrukcje/Katalog-produktow-2023…`).
- **Decyzje użytkownika** (w `BLEDY.md` „Ustalone”):
  - zwykłe zawiasy, nie barkowe;
  - strona jednego podnośnika;
  - półka tylko w zasięgu podnośnika;
  - zawias półnakładany osobno;
  - siła z listy;
  - opisy uchwytu „na dole / na górze”.

## Gdzie w kodzie i testy

- **Obliczenia**: `computeGeo`, kolumna z drzwiami (front typu `"klapa"`, `klapaZawiasy`) i lista `geo.klapy`; stałe `GTV_PD_G00`, `GTV_PD_ECGDL`, `KLAPA_*`, `PODNOSNIK_*`, `AMORTYZATOR_*`; `dobierzPodnosnik`.
- **Interfejs**: `polkiNaPoziomy(…, naKlapy)` („klapy zamiast drzwi”); przyciski w `NoteLine` (`zawiasy`, `silaauto`, `klapa2`, `polkicof`, `parablat`).
- **Kontrola otwierania**: `swingBodies` / `openingMsgs` (`klapaHit`, kąt co 1°).
- **W kodzie klapa to front typu `"klapa"`, nie `"door"`**: tam, gdzie kod filtruje drzwi, klapa jest pominięta celowo. Ma osobną formatkę „Klapa” i nie ma skrzydła w kontroli otwierania drzwi.
- **Testy**: `klapy`, `audytwierc` (zawiasy i mocowania podnośnika), `ruchy` (otwieranie), `komentarze1` („klapy zamiast drzwi”).
