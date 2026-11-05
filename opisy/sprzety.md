# Sprzęty w zabudowie

Piekarnik i mikrofala (użytkownik 2026-11-04) oraz lodówka (2026-11-05). Siedzą we
wnęce, czyli w kolumnie poziomu szafki — zwykle w słupku. Płyta grzewcza i zlew to
wycięcia w blacie roboczym nad szafką (niżej). Zmywarka i lodówka wolnostojąca w ciągu
dojdą później.

W karcie „Struktura wnętrza” kolumna ma cztery rodzaje: „Półki i drzwi /
Szuflady / Blenda / **Sprzęt**”. Przy „Sprzęt” wybierasz typ: **Piekarnik /
Mikrofala / Lodówka**. Powrót na inny rodzaj zdejmuje sprzęt, a kolumna wraca do tego, co
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

## Lodówka

Mocowanie frontu (pole „front”, użytkownik 2026-11-05: do wyboru, także bez frontu):
- **ślizgowo** (domyślnie) — front meblowy na zawiasach szafki (liczba z tabeli GTV, jak
  drzwi), z drzwiami lodówki łączy go prowadnica ślizgowa z kompletu lodówki;
- **na stałe** — front przykręcony do drzwi lodówki okuciami z kompletu, bez zawiasów
  meblowych (w zamówieniu ich nie ma, plan wierceń bez puszek);
- **bez frontu (wolnostojąca)** — lodówka z własnymi drzwiami stoi we wnęce między
  bokami szafki.

Przy lodówce z frontem:
- **1 front** na całą wnękę albo **2 fronty** (dolny i górny, bez płyty między nimi, luz
  jak między drzwiami). Wysokość dolnego wpisujesz z karty lodówki; bez niej — po równo
  i ostrzeżenie.
- Formatki: „Front lodówki” albo „Front lodówki — dolny / górny”, z uwagą o mocowaniu.
- Zawiasy z lewej albo z prawej, uchwyt na froncie (do odznaczenia).
- Wnęka lodówki 177 cm: szerokość 560–570, wysokość 1772–1790, głębokość od 550 —
  każda poza zakresem to uwaga z przyciskiem („Szafka … / Kolumna …”, „Poziom 1781 mm”,
  „Głębokość szafki …”). W kolumnie lodówki nie ma podpowiedzi rury na wieszaki.

Lodówka wolnostojąca we wnęce: 600 × 1850 × 650 mm, luz z boków 50, nad nią 100, z tyłu
50 mm (typowo z instrukcji — model może chcieć inaczej). Za wąska wnęka (mniej niż
lodówka) — błąd, za mało luzu — ostrzeżenie, oba z przyciskiem szerokości / wysokości.
Głębsza niż wnęka — informacja, ile wystaje przed lico; w kontroli otwierania jej
drzwi otwierają się od wysuniętego przodu.

## Płyta grzewcza i zlew — wycięcia w blacie

Wycięcie zapisuje się w szafce, nad którą leży (karta szafki → „Wycięcia w blacie nad
szafką”, tylko przy szafce pod blatem roboczym ciągu; użytkownik 2026-11-05: „nad szafką,
z przesunięciem”). Przyciski „+ płyta grzewcza” / „+ zlew”, przy każdym: szerokość
i głębokość wycięcia, odległość od przedniej krawędzi blatu, przesunięcie w bok od
środka szafki (+ w prawo), „usuń”.

- Typowo: płyta 60 cm 560 × 490, zlew jednokomorowy z ociekaczem 780 × 480, oba 50 mm od
  przodu blatu (`WYCIECIA_BLATU`) — do zmiany z karty sprzętu.
- Blat: kawałek z wycięciem idzie osobną pozycją „Blat ciągu — wycięcie pod płytę
  560 × 490” (przy dwóch: „wycięcia pod płytę … i zlew …”) z otworami — widać je na
  arkuszu rozkroju (otwory liczone od tylnej krawędzi), w 3D zabudowy i na rzucie
  z góry ciągu (przerywany prostokąt z podpisem).
- Kontrole (Uwagi):
  - × wycięcie na łączeniu kawałków blatu, ! za blisko łączenia (mniej niż 50 mm) —
    przyciski przesunięcia w jedną albo drugą stronę;
  - × poza blatem / ! za blisko końca blatu — przycisk przesunięcia;
  - × poza tyłem blatu / ! za tylną krawędzią mniej niż 50 mm — przycisk „Wycięcie N mm
    od przodu blatu”;
  - × płyta grzewcza szersza niż wnętrze szafki albo wychodząca nad bok — jej korpus nie
    zmieści się pod blatem („Wycięcie na środku szafki”, gdy pomaga); zlew nad bokiem —
    tylko informacja (komora we wnętrzu, ociekacz nad sąsiednią);
  - ! wycięcie nad leżącym wzmocnieniem przednim pary pod blat — sprzęt w nie trafi
    (bez przycisku, sprawdź z kartą sprzętu). Wieniec pod blatem roboczym ma swoją
    uwagę z „Dołóż parę wzmocnień”.

## Co ustawiasz ręcznie

Każdy typowy wymiar możesz zmienić polem w karcie sprzętu. Puste pole oznacza
wartość typową, a podpowiedź pod polem ją podaje. Pola:
- **Front** — szerokość i wysokość;
- **Wnęka** — szerokość od / do, wysokość min. i głębokość min.;
- **drzwi** — w dół / zawias z lewej / zawias z prawej;
- **Drzwi** — wysokość albo szerokość;
- **Uchwyt** przed frontem.

Lodówka: patrz wyżej (mocowanie, fronty, wnęka od–do, wymiary wolnostojącej i luzy).

Zmiana typu (piekarnik / mikrofala / lodówka) czyści wszystkie własne wymiary.
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
do zmiany w polach”, a każdy wymiar trzeba sprawdzić z kartą modelu. Lodówka 177 cm:
wnęki z kart Bosch / Beko / Bora (1772–1790 × 560–570 × 550); lodówka wolnostojąca —
luzy 50 / 100 mm z poradników producentów (Samsung), decyzje o mocowaniu i frontach
2026-11-05. Luz 2 mm przy
frontach to zapas, żeby front sprzętu nie dotykał frontu nad nim.

## Gdzie w kodzie i testy

- **Kod**:
  - stałe i parametry: `SPRZETY`, `SPRZET_POLA`, `sprzetKolumny`, `kolumnaSprzetu`;
  - kontrole: `computeGeo`, blok „Sprzety w zabudowie” przed formatkami;
  - przyciski: `sprzetw:` / `sprzeth:` w `NoteLine` i `runFix`;
  - lodówka: `lodowkaWneki` (kontrole wnęki), `pasmaPodzialu` (dwa fronty), drzwi
    z `d.lodowka` (bez zawiasów przy „na stałe”), formatka „Front lodówki”;
  - wycięcia w blacie: `WYCIECIA_BLATU`, `wycieciaSzafki` (`cab.blatWyciecia`), `runTop` → `rt.wyciecia`,
    `wycieciaKawalka` (otwory i nazwa kawałka w `runTopPanels`), kontrole w `worktopMsgs`,
    przycisk `wycblatu:`, rysunek w `AssemblyTopView` (`blatPasa`) i `Assembly3D` (`boxOtw`);
  - karta: `uiSprzetu`;
  - rysunki: `SprzetElewacja`, `SideView`, `TopView`, `Scene3D`, `Assembly3D`;
  - otwieranie: `swingBodies` / `openingMsgs`.
- **Testy**:
  - `funkcje` — wnęka, uwagi i przyciski, front na drzwiach nad nim i obok, ślepy róg,
    lodówka (fronty, zawiasy, wnęka, wolnostojąca);
  - `funkcje` — wycięcia w blacie (położenie, formatka z otworami, łączenie, tył, bok, wzmocnienie);
  - `sprzety` — klikane w aplikacji (też lodówka i wycięcia w blacie).
- Pola w danych: `SLOWNIK.md`.
