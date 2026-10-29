# Klapy

Front uchylny zamiast skrzydła — tylko przy **jednych drzwiach w kolumnie**:
„front: skrzydło / klapa”, a przy klapie „otwierana: do góry / w dół”.

**„klapy zamiast drzwi…”** (pod polem drzwi) otwiera kreator
(użytkownik 2026-10-24): **ile klap** (1 … liczba pasm; zmiana dzieli równo),
**granice** — które półki stają się granicami klap: przy jednej kolumnie poziomami
(płyta przez całą szafkę), przy kilku kolumnach stałymi półkami tej kolumny (poziomy
kolumny, inne kolumny bez zmian — tak też mówi opis w kreatorze, audyt GPT N85);
półki to półki, a poziomy to poziomy — pozostałe półki zostają w środku klapy, **otwierane** do góry /
w dół, **front** nakładany / wpuszczany (dla całej szafki — klapy nie mają frontu na
kolumnę) i **podnośniki / amortyzatory** auto / 1 / 2. Pod spodem wysokość każdej klapy
z ✓ albo „za nisko, podnośnik potrzebuje ok. N mm” (światła z grubości półek; przy jednej kolumnie granica staje się półką przelotową z płyty korpusu, więc górna klapa traci różnicę grubości — audyt GPT N107) (wpuszczane 265, bliźniacze 257,
górna nakładana 249, amortyzator 260); gdy któraś za niska — „Nie da się …” i bez
przycisku „Zrób”. Na start: najwięcej klap, które się mieszczą. Dolne poziomy dostają
wpisaną wysokość, górny jest auto. Gdy nawet jedna klapa na całą kolumnę jest za niska —
szary przycisk z dopiskiem „za nisko na klapy” (liczby w dymku), bez ostrzeżenia przy
wybranych drzwiach.

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
  - dobrana z tabeli albo wybrana z listy (nie słabsza) — bez uwagi; siła, wymiar i waga klapy są w Produktach (podpowiedź „klapa … — 1 × podnośnik 150 N (tabela …)” usunięta, użytkownik 2026-10-26: zbędna);
  - wybrana słabsza niż z tabeli — ostrzeżenie z „Zwiększ siłę do N N” i (przy jednym) „Dołóż drugi — 2 × N N”; w poziomie kolumny oba zapisują jawne auto (`silaN: null`) — bez pola klapa dziedziczy ręczną siłę kolumny (audyt GPT N106);
  - klapa za ciężka nawet na najmocniejszy — ostrzeżenie (przy jednym podnośniku też z „Dołóż drugi”).
- **Wymiary klapy**:
  - wyższa niż 600 mm — ostrzeżenie „poza tabelą”: siła liczona jak dla 600, do sprawdzenia u producenta;
  - do góry niższa niż 290 mm — ostrzeżenie: podnośnik potrzebuje co najmniej 290 mm korpusu na boku;
  - płytka podnośnika / amortyzatora wypada poza płytą w tym poziomie (do góry: H z tabeli pod płytą z zawiasami, w dół: 245 mm nad płytą pod klapą, plus 15 mm płytki) — błąd „podwyższ poziom o N mm albo daj drzwi” (audyt GPT N74; wtedy bez ostrzeżenia o 290 mm);
  - mocowanie na klapie (oba otwory i ok. 10 mm okucia poza nimi, `KLAPA_MOC_ZAPAS`) wypada poza zamawianym frontem — np. klapa w dół z podfrezem 200 mm ma 79 mm, a otwory są 77 i 101 mm od jej dołu (audyt GPT N87); błąd z „Podfrez N mm” (największy, przy którym okucie się mieści — wymiary producenta zostają) i „Tip-on zamiast podfrezu”;
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
- **Liczba stron**: jeden podnośnik — na wybranym boku; dwa — po obu stronach. W szafce w L po stronie ramienia nie ma boku — jeden podnośnik idzie na drugi bok; ta strona trafia do planu, modelu, wyboru w karcie i tip-on (po przeciwnej), z podpowiedzią (audyt GPT N129).
- **Płyta klapy w planie**: „Klapa”, przy kilku kolumnach „Klapa — kolumna N”, w kolumnie podzielonej na poziomy „Klapa — poziom M kolumny N” — każda klapa osobno, wysokości od dołu tej klapy (audyt GPT N84: dwie klapy jednej kolumny zlewały się w jedną płytę z otworami obu).

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

- **Podnośnik na rysunkach** (zgłoszenie użytkownika 2026-10-29: „nie rysują się na otwartym siłowniki”): przy otwartej klapie — widok „Otw.” szafki i ciągu oraz 3D otwarte — rysowany jest każdy podnośnik / amortyzator po swojej stronie (jeden — po wybranej). Kulka płytki na boku (wysokość i 25 mm od przedniej krawędzi jak w planie wierceń), kulka mocowania na klapie (środek między jej otworami, 17,5 mm za klapą) obraca się z klapą; tłoczysko ⌀6 od boku, siłownik ⌀15 (150 mm) przy klapie — wymiary z PD-G00 s. 3. Przy zamkniętej klapie nie jest rysowany (za frontem).

## Gdzie w kodzie i testy

- **Obliczenia**: `computeGeo`, kolumna z drzwiami (front typu `"klapa"`, `klapaZawiasy`) i lista `geo.klapy`; stałe `GTV_PD_G00`, `GTV_PD_ECGDL`, `KLAPA_*`, `PODNOSNIK_*`, `AMORTYZATOR_*`; `dobierzPodnosnik`; do rysunków `d.podnosniki` (przy wierceniach klapy), `podnosnikOdcinek`, `podnosnikBryly`, `KlapaElewacja` (`data-el="podnosnik"`), bryła 3D tag `podnosnik`.
- **Interfejs**: `polkiNaPoziomy(…, naKlapy)` („klapy zamiast drzwi”); przyciski w `NoteLine` (`zawiasy`, `silaauto`, `klapa2`, `polkicof`, `parablat`).
- **Kontrola otwierania**: `swingBodies` / `openingMsgs` (`klapaHit`, kąt co 1°).
- **W kodzie klapa to front typu `"klapa"`, nie `"door"`**: tam, gdzie kod filtruje drzwi, klapa jest pominięta celowo. Ma osobną formatkę „Klapa” i nie ma skrzydła w kontroli otwierania drzwi.
- **Testy**: `klapy` (też podnośniki na rysunkach otwartej klapy), `audytwierc` (zawiasy i mocowania podnośnika), `ruchy` (otwieranie), `komentarze1` („klapy zamiast drzwi”), `audytgpt7` (klapy poziomów kolumny w planie, opis kreatora, wpuszczana dłuższa od dołu), `audytgpt8` (mocowanie amortyzatora po podfrezie).
