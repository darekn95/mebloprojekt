# Sprzęty w zabudowie

Piekarnik i mikrofala (użytkownik 2026-11-04) oraz lodówka (2026-11-05). Siedzą we
wnęce, czyli w kolumnie poziomu szafki — zwykle w słupku. Płyta grzewcza i zlew to
wycięcia w blacie roboczym nad szafką (niżej). Zmywarka i lodówka wolnostojąca stoją
w ciągu jako osobne pozycje bez korpusu (niżej, „Sprzęt w ciągu”).

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
  | ekspres | 595 × 455 | 560–568 | 450 | 550 | nie sprawdzane | — |

  Ekspres do zabudowy (użytkownik 2026-11-09, z makiety — przykładowo, Electrolux KKK994500T / AEG). Jak się otwiera —
  z karty modelu (użytkownik 2026-11-09: „wysuwa się” albo drzwi z zawiasem z boku; w sieci nisze 45 się zgadzają —
  Siemens CT636LES1 449 × 558 × 356, AEG KKE884500M 45 × 56 × 55 — sposób otwierania nie): „nie sprawdzaj” (domyślnie)
  pomija go w kontroli otwierania; **„wysuwa się”** — ekspres jedzie do przodu o „Wysuw do przodu” z karty modelu
  i sprawdza się jak szuflada (× „Sprzęt (ekspres) … nie wysunie się do końca”); albo w dół / zawias z lewej / z prawej. **Rozmiar** piekarnika (60 / kompakt 45) i mikrofali (38 / 45): 45 to front 455 i wnęka od 450
  (`SPRZET_ROZM`, z makiety — przykładowo).

## Lodówka

Mocowanie frontu (pole „front”, użytkownik 2026-11-05: do wyboru, także bez frontu):
- **ślizgowo** (domyślnie) — front meblowy na zawiasach szafki (liczba z tabeli GTV, jak
  drzwi), z drzwiami lodówki łączy go prowadnica ślizgowa z kompletu lodówki;
- **na stałe** — front przykręcony do drzwi lodówki okuciami z kompletu, bez zawiasów
  meblowych (w zamówieniu ich nie ma, plan wierceń bez puszek);
- **bez frontu (wolnostojąca)** — lodówka z własnymi drzwiami stoi we wnęce między
  bokami szafki.

Przy lodówce z frontem:
- **Wysokość wnęki** (użytkownik 2026-11-09, z makiety — przykładowo): 82 pod blat / 88 / 102 / 122 / 140 / 158 /
  178 / 194 cm (`LODOWKA_WNEKI`) — ustawia „wysokość od / do” na −8 / +10 mm (jak 178: 1772–1790, `lodowkaWnekaZakres`);
  178 wraca do typowych.
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

### Lodówka podblatowa — w ciągu albo w szafce (użytkownik 2026-11-14)

Dwa rodzaje podblatowej: **w ciągu** — jak zmywarka, wypełnia całe miejsce, bez boków i wzmocnień
(`sprzetCiagu.typ: "lodowkaP"`, niżej), i **w szafce** — mniejsza lodówka (np. na wino) w zwykłej szafce dolnej
z dnem i bokami, „jakbyśmy wpakowali mikrofalę na dół” (`lodowkaMalaUstaw`, `lodowkaMalaWSzafce`):
- lodówka z własnymi drzwiami („bez frontu”) stoi na dnie, w poziomie o jej wysokości + 20 mm luzu; nad nią płyta
  i otwarta wnęka (decyzja 2026-11-14 — szuflada nad lodówką 520 nie mieści się pod wzmocnieniem pod blatem; front
  zmienia się w karcie Szafka);
- wymiary przykładowe 440 × 520 × 450 (`LODOWKA_MALA`; małe lodówki / minibary do zabudowy, np. Dometic RH 4xx:
  szer. ok. 420–445, wys. 435–560, głęb. 385–485), wysokości w karcie 45 / 52 / 56 / 64 cm (zmiana przestawia też
  płytę nad wnęką), szerokość i głębokość w polach;
- lodówka równo z licem korpusu — za nią luz (D − 3 − głębokość lodówki, co najmniej 20); uwaga: otwory wentylacyjne
  z tyłu dołem i górą (zwykle co najmniej 200 cm² każdy), od tyłu co najmniej 20 mm;
- szafka z ciągu: wysokość, głębokość, nóżki i cokół jak ciąg (cokół ciągu na spinkach do nóżek, jak przy innych).

Wariant „boki do podłogi, bez dna, cokół z kratką między bokami” (2026-11-13) wycofany — użytkownik: to jest
„w ciągu”, a cokół trzyma się nóżek na spinkach, nie boków. Z tamtej zmiany zostało: wnęka lodówki liczy się do
spodu wzmocnienia nad nią (`nadL` w kontroli lodówki), nie do góry poziomu.

## Sprzęt w ciągu: zmywarka i lodówka wolnostojąca

Pozycja ciągu bez korpusu (użytkownik 2026-11-05: „zależnie od sprzętu” — zmywarka i lodówka
wolnostojąca jako pozycja w ciągu). Dodajesz ją z „+ z szablonu…” przy ciągu: **Zmywarka**
albo **Lodówka wolnostojąca**. Dostaje nazwę sprzętu („Zmywarka”, „Lodówka 2”). Karta
szafki ma wtedy zamiast „Korpus” / „Struktura wnętrza” kartę „Sprzęt w ciągu”: typ, miejsce
(szerokość, wysokość, głębokość) i wymiary sprzętu (typowe, do zmiany). Sąsiednie szafki stoją
przy niej bokami; „Scal szafki” jej nie łączy.

**Zmywarka** (do zabudowy 60 albo 45 cm, typowo wysokość 815–875, głębokość od 550):
- w zamówieniu tylko „Front zmywarki” — wymiar drzwi szafki tej szerokości (te same luzy co
  fronty obok, np. 714 × 596), z płyty frontów, oklejony dookoła, przykręcany do drzwi
  zmywarki okuciami z jej kompletu. Bez korpusu, okuć i wierceń;
- **cokół ciągu idzie dalej** przed zmywarką (decyzja użytkownika); blat ciągu leży nad nią;
- bryła: nad cokołem od lica w głąb, a w strefie cokołu stopa cofnięta za płytę cokołu;
- kontrole: × miejsce węższe niż zmywarka, ! szersze o ponad 5 mm — przycisk „Miejsce
  600 mm”; × od podłogi do spodu blatu poza 815–875; × za płytko — „Głębokość …”;
- otwieranie: drzwi opadają w dół jak klapa (przed cokołem).

**Lodówka podblatowa** (użytkownik 2026-11-09, z makiety — przykładowo, np. Bosch KU22LVFD0, Smeg U8L080DE; szablon
„Lodówka podblatowa”): jak zmywarka do zabudowy — bez korpusu, w zamówieniu tylko „Front lodówki” przykręcany do jej
drzwi, cokół i blat ciągu idą dalej (wentylacja — wg instrukcji modelu). Wnęka typowo 820 × 600 × 550: × od podłogi
do spodu blatu mniej niż 820, × / ! szerokość poza 600–605, × za płytko. Drzwi to skrzydło (zawias z lewej / z prawej)
— w kontroli otwierania jak drzwi szafki.

**Zmywarka wolnostojąca** (użytkownik 2026-11-09, z makiety — wartości przykładowe; szablon „Zmywarka
wolnostojąca”, typ w karcie „Sprzęt w ciągu”):
- własne drzwi, bez korpusu i bez frontu meblowego — w zamówieniu nic do niej; stoi na podłodze, bez cokołu
  i nóżek (wspólne wymiary ciągu jej nie zmieniają), **cokół ciągu ma pod nią przerwę** (drzwi i listwa
  sięgają podłogi);
- **montaż „pod blatem”** (domyślnie) — pokrywa zdjęta, ok. 815 mm (pole „Wysokość bez pokrywy”), blat ciągu
  idzie nad nią; × od podłogi do spodu blatu mniej niż 815 — „Wysokość 815 mm”;
- **montaż „z własną pokrywą”** — 850 mm, blat kończy się przy jej boku (informacja jak przy lodówce:
  na końcu / w środku ciągu); ! inna wysokość pozycji — „Wysokość 850 mm”;
- model 60 / 45 cm; × miejsce węższe, ! szersze o ponad 5 mm — „Miejsce N mm”;
- otwieranie: drzwi opadają w dół jak klapa (od lica, w linii frontów szafek obok).

**Lodówka wolnostojąca** (typowo 600 × 1850 × 650 w miejscu 700, luzy 50 z boków, 100 nad nią,
50 z tyłu):
- **luz z lewej i z prawej osobno** (użytkownik 2026-11-09, z makiety; puste = luz z boku 50). Lodówka stoi
  o luz z lewej od sąsiada, nadmiar miejsca dzieli się po równo; za ciasno — wolne miejsce w proporcji luzów.
  Karta pokazuje „Miejsce w ciągu: luz + lodówka + luz = N mm”. ! za mało luzu — „Miejsce N mm”
  (przy równych luzach stary tekst „zostaje … z boku”);
- **rodzaj: wolnostojąca / na równo z meblami** (np. Samsung Kitchen Fit) — typowo 3 mm z boków i 15 nad
  nią (przykładowo, z makiety — wg instrukcji modelu), ciepło oddaje tyłem i dołem; informacja o mocowaniu
  do sąsiednich szafek uchwytami producenta;
- stoi na podłodze — bez cokołu i nóżek, bez formatek; wspólne wymiary ciągu (wysokość,
  głębokość, cokół) jej nie zmieniają i nie dają uwag o niezgodności;
- blat ciągu kończy się przy jej boku (nie wyznacza wysokości blatu);
- **cokół ciągu**: na końcu ciągu kończy się przy niej, w środku ciągu (np. między szafkami
  a słupkiem) ma przerwę — dwa odcinki, każdy dzielony osobno (`runPlinth`: `segmenty`,
  `luki`); karta ciągu pisze „Przerwa pod lodówkę wolnostojącą: …”;
- uwagi: i „stoi na końcu ciągu / w środku ciągu …”, i ile wystaje przed korpusy i fronty;
  × za wąskie miejsce, ! za mało luzu z boku — „Miejsce N mm”; ! za niska pozycja —
  „Wysokość N mm”; × górny ciąg nad nią (jak nad słupkiem);
- otwieranie: drzwi to skrzydło od wysuniętego przodu (zawias z lewej / prawej).

Rysunki: front ciągu (front zmywarki, bryła lodówki), z boku ciągu (profil sprzętu: zmywarka do
podłogi, lodówka wysunięta), z góry, 3D pozycji i 3D zabudowy (`sprzet`, `sprzet-stopa`,
`sprzet-front`, `front-zmywarki`). PDF pomija pozycję w arkuszach szafek; front zmywarki jest
w formatkach.

## Płyta grzewcza i zlew — wycięcia w blacie

Wycięcie zapisuje się w szafce, nad którą leży (karta szafki → „Wycięcia w blacie nad
szafką”, tylko przy szafce pod blatem roboczym ciągu; użytkownik 2026-11-05: „nad szafką,
z przesunięciem”). Przyciski „+ płyta grzewcza” / „+ zlew”, przy każdym: szerokość
i głębokość wycięcia, odległość od przedniej krawędzi blatu, przesunięcie w bok od
środka szafki (+ w prawo), „usuń”.

- **Rozmiar** (użytkownik 2026-11-09, liczby z makiety „Dodaj” — przykładowe, z kart Bosch / Neff /
  Electrolux / Samsung / Franke; wpisz z karty swojego modelu), `ROZM_WYCIEC`:

  | płyta | szkło na blacie | kaseta pod blatem | kaseta od wierzchu | wycięcie |
  |---|---|---|---|---|
  | 30 cm | 290 × 520 | 262 × 484 | 51 | 268 × 490 |
  | 60 cm (domyślnie) | 590 × 520 | 554 × 484 | 51 | 560 × 490 |
  | 60 slim | 590 × 520 | 554 × 484 | 44 | 560 × 490 |
  | 80 cm | 800 × 520 | 744 × 484 | 51 | 750 × 490 |
  | 90 cm | 900 × 520 | 854 × 484 | 51 | 860 × 490 |
  | 80 z okapem | 830 × 520 | 754 × 484 | 230 | 760 × 490 |

  Wycięcie pod płytę = kaseta + 3 mm z każdej strony (`WYC_LUZ`, użytkownik 2026-11-08).

  | zlew | rant na blacie | wycięcie | komora od wierzchu |
  |---|---|---|---|
  | 1 komora | 500 × 500 | 480 × 480 | 200 |
  | z ociekaczem (domyślnie) | 780 × 500 | 760 × 480 | 200 |
  | 2 komory | 860 × 500 | 840 × 480 | 200 |

  Zlew z ociekaczem: ociekacz z lewej albo z prawej (komora po drugiej stronie) — na rzucie z góry linia
  podziału i podpis. Oba 50 mm od przodu blatu.
- Karta pokazuje wycięcie (szer. × głęb.) i **odległość od lewego końca blatu** (jak wymiar na rysunku);
  ustawiasz nadal „przesunięcie w bok” od środka szafki.
- Szkło płyty / rant zlewu na rzucie z góry (pełny obrys) nad wycięciem (przerywany). × szkło / rant
  wystaje przed blat albo poza jego tył — przycisk „Wycięcie N mm od przodu blatu”.
- Wycięcia zapisane przed 2026-11-09 (bez rozmiaru): samo wycięcie w × d i „Pod blat (od wierzchu)”, typowo
  płyta 560 × 490 / 60 mm, zlew 780 × 480 / 200 mm (`WYCIECIA_BLATU`) — karta pokazuje stare pola, wybór
  rozmiaru przechodzi na nowe.
- Blat: kawałek z wycięciem idzie osobną pozycją „Blat ciągu — wycięcie pod płytę
  560 × 490” (przy dwóch: „wycięcia pod płytę … i zlew …”) z otworami — widać je na
  arkuszu rozkroju (otwory liczone od tylnej krawędzi), w 3D zabudowy i na rzucie
  z góry ciągu (przerywany prostokąt z podpisem).
- Kontrole (Uwagi):
  - × wycięcie na łączeniu kawałków blatu, ! za blisko łączenia (mniej niż 50 mm blatu) —
    przyciski przesunięcia w jedną albo drugą stronę;
  - × poza blatem / ! za blisko końca blatu (mniej niż 30 mm blatu od końca do wycięcia — `WYCIECIE_KONIEC`, użytkownik 2026-11-13:
    „30 mm wystarczy”) — przycisk przesunięcia;
  - × poza tyłem blatu / ! za tylną krawędzią mniej niż 50 mm — przycisk „Wycięcie N mm
    od przodu blatu”;
  - ! do przedniej krawędzi blatu mniej niż 30 mm (`WYCIECIE_PRZOD_MIN`; gdy szkło / rant nie wystaje już przed
    blat) — przycisk „50 mm od przodu” (typowo); z makiety „Dodaj”, 2026-11-13;
  - × dwa wycięcia na jednym blacie nachodzą na siebie, ! między nimi mniej niż 50 mm płyty — raz na parę (przy lewym),
    przycisk przesuwa lewe w lewo, gdy zostaje zapas od końca blatu; z makiety „Dodaj”, 2026-11-13;
  - × płyta grzewcza szersza niż wnętrze szafki albo wychodząca nad bok — jej korpus nie
    zmieści się pod blatem („Wycięcie na środku szafki”, gdy pomaga); zlew nad bokiem —
    tylko informacja (komora we wnętrzu, ociekacz nad sąsiednią);
  - × **nachodzenie pod blatem** (użytkownik 2026-11-05) — bryła sprzętu to obrys wycięcia na
    głębokość „Pod blat (od wierzchu)” (typowo płyta 60 mm, zlew 200 mm; blat 38 → płyta
    22 mm pod blat). Sprawdzana z elementami szafki pod nią:
    - leżące wzmocnienie przednie — przyciski „Wzmocnienie stojące” (na sztorc przy licu,
      60 mm jak w szafce narożnej) i „Wycięcie we wzmocnieniu” (gdy zostaje pasek co najmniej 30 mm;
      inaczej „Wycięcie N mm od przodu blatu”, które robi miejsce na pasek);
    - stojące wzmocnienie przednie / tylne — przycisk przesunięcia wycięcia do tyłu / przodu;
    - wieniec — „Dołóż parę wzmocnień”;
    - szuflada (górna krawędź skrzynki), półka, półka przelotowa, przegroda — opis, ile
      obniżyć albo co zmienić (bez przycisku).
    Mniej niż grubość blatu — sprzęt nie sięga pod blat, bez kontroli.
- **Wzmocnienie z wycięciem** (`rail.podWyciecie`): w leżącym wzmocnieniu wycięcie tam, gdzie
  wchodzi w nie obrys wycięcia w blacie — formatka „Wzmocnienie poziome — wycięcie 560 × 50
  z tyłu, 2 mm od lewej” z otworem (rozkrój), w 3D i na rzucie z góry. Łączniki (konfirmaty przez
  boki w czoło wzmocnienia, po 2 na koniec — `opisy/korpus.md`) są przestawiane poza wycięcie: gdy
  wycięcie zaczyna się bliżej końca, niż łącznik wchodzi w czoło (konfirmat 35 mm, wkręt 15 mm),
  tylko przed nim albo za nim (pasek 50 mm — konfirmaty 13 i 38 mm od lica); mieści się jeden —
  zostaje po jednym na stronę (uwaga z położeniem od lica, plan wierceń i zamówienie z tym, co się
  zmieściło). Przy uwadze przycisk „Wkręty 4 × 30” (użytkownik 2026-11-06: „przy takich
  wzmocnieniach warto zamienić na 4 × 30, ale na przycisku”) — wkręty wchodzą płycej.
  Uwagi: ! pasek przy wycięciu węższy niż 30 mm, × wycięcie przez całą głębokość albo brak
  miejsca na łącznik — przycisk „Wzmocnienie stojące” (i „Wkręty 4 × 30”).

## Sprzęt wolnostojący na blacie (tylko rysunek)

Użytkownik 2026-11-09: mikrofala i ekspres wolnostojące stoją na blacie — **tylko rysunek, bez kontroli**. Karta szafki
pod blatem → „Na blacie (tylko rysunek)”: „+ mikrofala” / „+ ekspres”, rozmiar i przesunięcie w bok od środka szafki.
Rysowane na widoku ciągu z przodu (na wierzchu blatu) i z góry (przy ścianie). Rozmiary z makiety, przykładowo (`NA_BLACIE`):
mikrofala 20 l 440 × 258 × 340, 23 l 489 × 275 × 377, 25 l 483 × 280 × 419; ekspres 24 cm 240 × 360 × 440,
22 cm 220 × 350 × 420.

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
  - wycięcia w blacie: `WYCIECIA_BLATU`, `ROZM_WYCIEC` / `WYC_LUZ` (rozmiary płyt i zlewów), `wycieciaSzafki` (`cab.blatWyciecia`), `runTop` → `rt.wyciecia`,
    `wycieciaKawalka` (otwory i nazwa kawałka w `runTopPanels`), kontrole w `worktopMsgs`,
    przycisk `wycblatu:`, rysunek w `AssemblyTopView` (`blatPasa`) i `Assembly3D` (`boxOtw`);
  - pod wycięciem: `wycieciaWSzafce` (obrys w układzie szafki), kontrola nachodzenia w `worktopMsgs`,
    `rail.podWyciecie` → `otwory`, `laczniki` (`lacznikiWzmocnienia`) w `computeGeo`, przyciski
    `wzmblat:` / `wzmstoj:`, rysunek `WycieciaWzmocnienia` (rzut z góry), 3D `boxOtw`;
  - karta: `uiSprzetu`;
  - sprzęt w ciągu: `SPRZETY_CIAGU` (zmywarka, zmywarkaW, lodowka), `sprzetCiagu`, `lodowkaCiagu`, `naPodlodzeCiagu`
    (lodówka i zmywarka wolnostojąca — cokół z przerwą, bez wspólnych wymiarów), `bezBlatuCiagu` (blat kończy się przy niej), `geoSprzetuCiagu` (`geo.bezKorpusu`,
    `geo.sprzetCiagu`), szablony `zmywarka` / `lodowka-wolno`, karta `uiSprzetuCiagu`, cokół z przerwą
    w `runPlinth`, blat w `worktopLevel`, uwagi w `worktopMsgs` / `runCabMsgs`, przyciski `sprzetcw:` /
    `sprzetch:`, rysunki `SprzetCiaguElew`, `SprzetCiaguWidok`, `SprzetCiagu3D`, `AssemblySideView`,
    `Assembly3D`;
  - rysunki: `SprzetElewacja`, `SideView`, `TopView`, `Scene3D`, `Assembly3D`;
  - otwieranie: `swingBodies` / `openingMsgs`.
- **Testy**:
  - `funkcje` — wnęka, uwagi i przyciski, front na drzwiach nad nim i obok, ślepy róg,
    lodówka (fronty, zawiasy, wnęka, wolnostojąca);
  - `funkcje` — wycięcia w blacie (położenie, formatka z otworami, łączenie, tył, bok, wzmocnienie);
  - `funkcje` — pod wycięciem: nachodzenie (wzmocnienie, szuflada, półka), wzmocnienie z wycięciem,
    łączniki po jednym na stronę, liczba wkrętów;
  - `funkcje` — sprzęt w ciągu (front zmywarki, kontrole, cokół z przerwą, blat, uwagi, scalanie);
  - `sprzety` — klikane w aplikacji (też lodówka, wycięcia w blacie i sprzęt w ciągu z szablonu).
- Pola w danych: `SLOWNIK.md`.

## Okap w szafce górnej (2026-11-10)

`cab.okap = { typ, rozm, wycW, wycD, odPrzodu }` w szafce ciągu górnego; `okapSzafki(cab)` (stałe `OKAPY`, `OKAP_ROZM`,
liczby z makiety „Dodaj” — przykładowo). Teleskopowy i wkład: wycięcie w dnie (`okapOtw` w `computeGeoLiczy`, razem
z otworami elementów — nazwa i `otwory` formatki „Dno”); podszafkowy bez wycięcia. Kontrola `okapMsgs`: odległość wierzch
blatu → dół okapu (dół szafek górnych `tierMountY`, podszafkowy niżej o `h`): < `OKAP_MIN_IND` 650 — ostrzeżenie,
< `OKAP_MIN_GAZ` 750 — informacja; płyta szukana pod szafką w układzie ściany (przesunięcie ciągu + szafki przed nią,
bez narożników — przybliżenie).

## Okap kominowy (2026-11-10)

Pozycja **ciągu górnego bez korpusu** (`cab.sprzetCiagu = { typ: "okapK", szer, dol, h, gl, kominW, kominD }`, szablon
„Okap kominowy” — tylko w ciągu górnym, `tylkoGorny`), jak zmywarka w dolnym: na ścianie zamiast szafki, szafki górne obok
kończą się przy nim. Liczby z makiety „Dodaj” (przykładowo, z karty modelu): okap 60 / 90 / 50 cm na środku miejsca,
daszek 90 mm × 500 mm od ściany (wystaje przed szafki górne), komin 280 × 250 od daszka do góry pozycji (z kompletu okapu,
regulowany — do sufitu wg instrukcji). `dol` — dół okapu nad dołem szafek górnych (może być ujemny); nowy okap dostaje
650 nad wierzchem blatu (`okapKDol`), bez blatu pod ciągiem — 150.
- Geometria `geoSprzetuCiagu` (gałąź `okapK`): bez formatek, okuć i wierceń; daszek jak przód lodówki (`fz0` = głębokość
  korpusu − `gl`), `komin`. Uwagi: miejsce węższe niż okap — błąd z „Miejsce N mm”; daszek ponad górę szafek — ostrzeżenie.
- Listwa zawieszek ciągu ma przy okapie przerwę (`runRail`: komin na ścianie) — kończy się przed nim i zaczyna za nim.
- Wysokość nad płytą — `okapMsgs` jak przy okapie w szafce (dół = `tierMountY` + `dol`); „za nisko” ma przycisk
  „Okap 650 mm nad płytą” (`okapdol:<dol>:650`).
- Rysunki: przód (`SprzetCiaguElew` — daszek zwężany ku górze, komin `data-el="komin-okapu"`), z boku, z góry, 3D szafki,
  ciągu i pomieszczenia (bryły „okap” i „komin okapu” — nachodzenie).
- Makieta: w karcie okapu w szafce rodzaj „kominowy (zamiast szafki)” zamienia szafkę na okap (to samo miejsce: szerokość,
  wysokość, głębokość; `cabOkapuKominowego`), w karcie kominowego inny rodzaj wstawia z powrotem szafkę wiszącą z okapem
  (`cabSzafkiZOkapem`); karta: wymiar 60 / 90 / 50, „dół okapu nad blatem” (przelicza `dol`). Tryb techniczny — karta
  „Okap kominowy” (miejsce, wysokość, głębokość, dół okapu, daszek, komin).
