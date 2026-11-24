# Drzwi przesuwne w szafach (GTV NOVO S, tor dolny EVO) i szafa do zabudowy

Stan: 2026-11-17. Decyzje użytkownika z 2026-11-16 i 2026-11-17 (w `BLEDY.md`, „Ustalone”). Szczegóły pól → dane → funkcje: `SLOWNIK.md`.

## Co program liczy sam

- **Gdzie drzwi.** Tory są w korpusie (nie na wnęce):
  - tor górny pod wieńcem, tor dolny na dnie;
  - otwór to światło korpusu: SO = szerokość między bokami, WO = wysokość między dnem a wieńcem.
- **Liczba skrzydeł** („same”): do 2000 mm otworu 2, do 3000 mm 3, wyżej 4 (skrzydło ok. 1000 mm, `PRZES.SKRZ_MAX`).
  Z wyboru także 5 i 6 (użytkownik 2026-11-22): 6 jak 4 — dwie połowy po 3 (środkowe na jednym torze, na styk), 5 naprzemiennie
  jak 3 (`PRZES_SKRZ`). Przy szerokim / ciężkim skrzydle przyciski „5 (6) skrzydeł” i „Podziel na dwie szafy” (`przesdziel`:
  po połowie szerokości, każda z własnymi drzwiami, podwójny bok tylko od ściany, przegrody na stykach skrzydeł).
- **Wymiary** według instrukcji GTV NOVO S (18), s. 23 (`przesuwneWymiary`):
  - szerokość skrzydła SD = (SO − 3 + k·34) / n ze szczotką odbojową albo (SO + k·34) / n bez niej;
    - k = n − 1;
    - przy 4 skrzydłach — symetrycznie, liczone jak 2 na pół otworu;
  - wysokość skrzydła WD = WO − 40;
  - wypełnienie z płyty frontu 18 mm: SW = SD − 36, WW = WD − 3; formatka „Wypełnienie drzwi przesuwnych”, bez okleiny;
  - listwy poziome DLP = SD − 52;
  - rączki DR = WD.
- **Tory.** Skrzydła jadą na dwóch torach co 24 mm, w strefie 8–52 mm od lica korpusu:
  - 2 skrzydła: lewe na tylnym torze;
  - 3 skrzydła: środkowe z tyłu;
  - 4 skrzydła: środkowe dwa z tyłu.
- **Wnętrze cofnięte za tory.** Półki, przegrody i drążki są o 80 mm za licem (`PRZES.STREFA`): tor górny ma 76 mm, 80 mm zostawiono dla bezpieczeństwa.
  - Kolumny tracą drzwi na zawiasach i klapy; szuflady i sprzęt zostają.
- **Okucia** (`geoPrzesuwne`):
  - tor górny A-TG, tor dolny A-TDEVO i jego maskownica:
    - długości 1700 / 2350 / 3000 / 4050 / 6000, dociąć do SO;
    - otwór ponad 6000 — błąd z przyciskiem „Podziel na dwie szafy” (użytkownik 2026-11-24: „max 6 m i koniec, i następna szafa” — torów nie łączymy);
  - po 2 rączki NOVO S, 2 wózki dolne EVO i 2 prowadniki górne na skrzydło;
  - pozycjoner górny — 1 na skrzydło;
  - kątownik 18 mm na listwy poziome (sztangi 3000 mm);
  - szczotka odbojowa — 2 szt. (przy bokach).
- **Odsunięte skrzydło** (`przesuwneOdsun`, użytkownik 2026-11-17: „brak opcji otwarcia — przesunięcia jednych drzwi”; „mogą być
  3 lub 4 skrzydła”). Wybrane skrzydło jedzie za albo przed najbliższe skrzydło z drugiego toru, ale nie minie skrzydła na swoim
  torze ani krawędzi otworu; kierunek — tam, gdzie odsłania więcej (po równo — w lewo). Przy otworze 1964:
  - 2 skrzydła: lewe za prawe (odsłania 0–967), prawe przed lewe (997–1964);
  - 3 skrzydła: skrajne są na przednim torze, więc skrajne staje na drugim skrajnym — każde odsłania 612 (SD − 2 zakładki);
    środkowe chowa się za lewe;
  - 4 skrzydła: każde za albo przed sąsiada ze swojej połowy — odsłania 476.
  Na rysunkach i w 3D skrzydło stoi tam, gdzie dojedzie (`przesuwne.odsun`, numer od 0); formatki i okucia bez zmian. Z tego samego
  liczenia idzie kontrola dostępu do kolumn.
- **Widok bez frontów** (przełącznik „Fronty” wyłączony; użytkownik 2026-11-17: „może być jak wszędzie przygaszony front szuflad,
  ale nie było widać prowadnic w szafie z drzwiami przesuwnymi”): skrzydła tylko przerywanym obrysem, front szuflady wewnętrznej
  przygaszony jak wszędzie, a pod nim prowadnice (skrzynka od czoła, `SkrzynkaZaPrzesuwnymi`) — także w makiecie, gdzie innych
  okuć się nie rysuje. Prowadnice V-BOX z przodu stoją przy boku zabudowy / boku wewnętrznym (`dr.bx0`, `dr.bx1`). W 3D przy
  wyłączonych frontach szuflady są wysunięte.
- **Waga skrzydła** = płyta wypełnienia (gęstość z `wagaFrontu`) + 0,5 kg na metr profili. Te 0,5 kg/mb przyjęto z góry, bez karty — do potwierdzenia.

## Szuflady za drzwiami przesuwnymi

Jak w szafie użytkownika (2026-11-16): „dołożona zabudowa pod szuflady — boki i wieniec jako pierwsza półka; szuflady wewnętrzne z podfrezem na palce; zabudowa cofnięta o 80 mm od czoła; dolna szyna 18 mm od dna (łatwo wyznaczyć ręcznie)”; „szuflady w szafie mam V-BOX, jedne z niższych” (bok ok. 12 cm).

- **Zabudowa pod szuflady** (`rawCol.__zabudowa` z `L` / `R`, `listwyPrz`) w każdej kolumnie i poziomie kolumny z szufladami — jak u użytkownika: „od strony boku szafy prowadnice na drugiej płycie [boku wewnętrznym], od strony przegrody dołożona płyta na wysokość wieńca szuflad, na całą głębokość, przykręcona wkrętami do przegrody”:
  - bok zabudowy (18 mm, płyta korpusu) tylko przy przegrodzie, od dna poziomu do półki nad szufladami;
  - przy boku szafy prowadnice idą na bok (wewnętrzny przy podwójnych bokach);
  - głębokość jak przegrody, cofnięty o 80 mm;
  - wieniec zabudowy to półka nad szufladami (granica poziomu kolumny albo góra poziomu): od strony boku konfirmaty, od strony przegrody 2 trójkąty meblowe od dołu do boku zabudowy (konfirmatu nie da się wkręcić); z przegrody jego złącze znika, w zamówieniu mniej konfirmatów, plus trójkąty;
  - szuflada jest węższa o bok zabudowy;
  - formatka „Bok zabudowy szuflad — kolumna N”, wkręty 4 × 30 co ok. 300 mm w dwóch rzędach;
  - szuflady po obu stronach jednej przegrody (wzór z szufladami): oba wieńce zabudowy od przegrody na trójkątach, więc kontrola
    „konfirmaty po obu stronach przegrody” ich nie liczy; boki zabudowy z obu stron — wkręty drugiej strony przesunięte o ok. 20 mm (ustalone z użytkownikiem 2026-11-21)
    (wkręt 4 × 30 przez bok 18 wchodzi 12 mm w przegrodę 18 mm; z obu stron w tym samym miejscu spotkałyby się) — w formatce,
    zamówieniu i uwagach. Kolejność: najpierw bok zabudowy jednej kolumny, potem drugiej (każdy od środka swojej zabudowy), trójkąty
    od dołu przed szufladami;
  - w planie wierceń prowadnice na boku zabudowy, z odległościami od jego przedniej krawędzi.
- **Front wewnętrzny, cofnięty o 80 mm** za tory (`cab.__szuflPrzes.cof` → `d.cof`).
  - Prowadnice i skrzynka cofają się razem z frontem (`rail.setback` = grubość frontu + 80).
  - NL dobiera się z głębokości, która została.
  - Domyślnie podfrez na palce, bez uchwytów. Gdy w kolumnie wybrano uchwyty (wcięcie wyłączone), a uchwyt wystaje więcej niż miejsce do skrzydeł (28 mm, z luzem 3), pojawia się ostrzeżenie.
- **Dolna prowadnica 18 mm nad dnem** (`PRZES.SZYNA_DOL`, `spz.szyna`). Front schodzi 5 mm poniżej niej (13 mm nad dnem, nad torem dolnym 8 mm). Górny front najwyżej 43 mm pod wieńcem (tor górny 38 + 5).
- **Bok V-BOX „auto”** — najwyższy, jaki się zmieści (jak wszędzie). Opcja szafy przesuwnej „niski 127” (`przesuwne.niskieSzuflady`, `PRZES.VBOX_BOK`; karta Szuflady `mak-przes-bok`, techniczny: karta „Drzwi przesuwne”) — jak w szafie użytkownika; włączona w szablonie „Szafa do zabudowy z szufladami”. Ręcznie wybrany bok zostaje.
- **Dostęp.** Front musi przejść obok krawędzi odsuniętego skrzydła z luzem 5 mm (`PRZES.LUZ_SZUFL`). Przy 2 skrzydłach i przegrodzie na środku bok zabudowy przy przegrodzie (18) to zapewnia.
- **Szuflady na dół kolumny** (karta Szuflady albo klocek „N szuflad”, szafa z przegrodą; `makSzufladyNaDoleKolumny`):
  - nowa półka graniczna (wieniec zabudowy) 220 mm na szufladę nad dnem kolumny;
  - pod nią poziom kolumny z szufladami;
  - nad nią zostaje, co było (półki, drążek, górne 300);
  - wysokość dobrana o 0–n−1 mm tak, żeby fronty wyszły równe.
- **Kontrole:**
  - (i) zabudowa pod szuflady, prowadnica 18 nad dnem, podfrez;
  - (!) kolumna szuflad pod dwoma skrzydłami (nawet z bokami zabudowy) — „szuflada się nie wysunie”;
  - (!) uchwyt szuflady wystaje do skrzydeł.
- **Klocki frontów** (1 / 2 drzwi, klapy, bez frontu, lustro, uchwyt, tip-on) w szafie przesuwnej — komunikat, nic się nie zmienia.
- **Kolejność montażu:**
  - bok zabudowy przykręca się do przegrody od środka zabudowy, zanim wejdą prowadnice;
  - wieniec zabudowy: od boku konfirmaty przez bok (wewnętrzny — łby schowane za bokiem zewnętrznym), od przegrody trójkąty od dołu;
  - tory i skrzydła na końcu — dostęp do wkrętów jest.

## Podwójne boki (szafa do zabudowy)

Jak w szafie użytkownika (2026-11-16, zdjęcia): „cała szafa ma od zewnętrznych stron podwójną płytę — jedną wewnątrz mniejszą o 80 mm, a drugą na zewnątrz do ziemi, tak żeby nie było widać konfirmatów, tylko jest kręcona od wewnątrz”; „nie zawsze jest to potrzebne — czasem bok jest zasłonięty”.

- `przesuwne.podwBoki = { L, R }` — osobno z lewej i z prawej (karta Drzwi: „podwójny bok — z lewej / z prawej”, techniczny: karta „Drzwi przesuwne”). We wzorach szafy do zabudowy włączone z obu stron.
- **Bok zewnętrzny** — bok korpusu, na pełną głębokość; przy cokole w obrysie (wzór) do podłogi, cokół między bokami.
- **Bok wewnętrzny** (formatka „Bok wewnętrzny lewy / prawy”) — od dna do wieńca (w każdym poziomie — między płytami przelotowymi), głębokość jak przegrody, cofnięty o 80 mm (za drzwiami przesuwnymi).
- **Dno i wieniec między bokami zewnętrznymi.** Bok wewnętrzny stoi na dnie pod wieńcem: konfirmaty od spodu dna i od góry wieńca w jego czoło (130 / 340 / 550 mm od lica dna). Przez bok zewnętrzny konfirmatów nie ma.
- **Bok wewnętrzny do zewnętrznego** — wkręty 4 × 30 od środka szafy, dwa rzędy co ok. 400 mm (plan wierceń, zamówienie).
- **Kolumny** zaczynają się za bokiem wewnętrznym (`__bokWewn` w `computeGeoLiczy`): kołki, rozety rury i prowadnice w kolumnie przy boku idą na bok wewnętrzny, z odległościami od jego przedniej krawędzi.
- **Drzwi przesuwne** — między bokami zewnętrznymi (otwór jak bez podwójnych boków); boki wewnętrzne chowają się za skrzydłami.
- **Wzór bez nóżek** (`bezNozek`): boki stoją na podłodze, cokół w obrysie między nimi.

## Wiercenia przegród cofniętych

Przegrody i boki wewnętrzne za drzwiami przesuwnymi są cofnięte o 80 mm. W planie wierceń odległości na nich liczą się od ich własnej przedniej krawędzi (`odPrzoduPlyty`: kołki, konfirmaty półek, rozeta rury, prowadnice). Konfirmaty z dna i wieńca w przegrodę: od lica dna z cofnięciem (130 / 340 / 550 przy głębokości 600). Do 2026-11-16 plan liczył je od lica korpusu (błąd, `BLEDY.md`).

## Szafa do zabudowy (wzór w palecie „Szafa w zabudowie”)

- Korpus na całą wnękę: 2000 mm szerokości, 600 mm głębokości.
- Cokół 100 w obrysie (boki do podłogi), bez nóżek; podwójne boki z obu stron.
- Drzwi przesuwne włączone, bez blendy.
- W środku przegroda: z jednej strony półki, z drugiej drążek z półką 300 mm nad nim (bez szuflad).
- Wysokość korpusu:
  - sufit ściany znany (pole „wys.”) — do sufitu z luzem 5 mm: sufit − 5 (cokół w obrysie — w wysokości; pod korpusem — sufit − 5 − cokół),
    ale najwyżej 2761 mm — bok idzie na całą wysokość, a arkusz 2800 po okrawaniu ma 2761 (analiza 2026-11-21: przy suficie 2900 wzór dawał bok 2895);
  - sufit nieznany — 2400.
- Dodana bez zaznaczonego ciągu zakłada nowy ciąg „szafa”.

Drugi wzór: „Szafa do zabudowy z szufladami” — to samo, ale bez drążka: w obu kolumnach na dole po 2 szuflady w zabudowie (V-BOX niski 127), nad nimi półki (użytkownik 2026-11-17: „szafa z szufladami bez drążka, za to szuflady po obu stronach; druga szafa w szablonie z drążkiem bez szuflad”).

## Co ustawiasz ręcznie

- **Makieta, karta „Drzwi”** (szafa wysoka, ciąg szafy):
  - „na zawiasach / przesuwne”;
  - „skrzydła”: same, 2, 3 albo 4;
  - „odsuń skrzydło”: zamknięte, 1, 2… (od lewej) — tylko rysunek i 3D;
  - „podwójny bok”: z lewej / z prawej;
  - „szczotka odbojowa”: jest / nie ma;
  - pod przyciskami opis skrzydła i wypełnienia z wymiarami.
- **Tryb Techniczny:** karta „Drzwi przesuwne (GTV NOVO S)” z tymi samymi polami (w tym „Odsunięte skrzydło”).
- **Uwagi:** wysokość korpusu do sufitu — przycisk „Do sufitu z luzem 5 mm”.

## Kontrole

- × Skrzydło cięższe niż 50 kg (wózki EVO). Przycisk dokłada skrzydło (`przesn:<n>`).
- ! Skrzydło szersze niż ok. 1150 mm. Przycisk jak wyżej. Przy 4 skrzydłach przycisku nie ma (więcej system nie przewiduje) —
  rada „podziel zabudowę na dwie szafy” (analiza 2026-11-21).
- × Otwór za mały: wypełnienie ≤ 0.
- × Skrzydło wyższe niż rączka NOVO S (A-R18NOVS-270, 2700 mm, `PRZES.RACZKA_DL`) — przycisk „Wysokość szafy N mm”
  (`szafah:<H>`): niższa z granic — rączka albo bok z arkusza (`szafaMaxH`). Z płytą 2800 granicą jest bok (2761 mm),
  rączka dopiero przy dłuższym arkuszu własnej płyty (np. 3050 → szafa najwyżej 2876 mm).
- × Wypełnienie drzwi nie mieści się na arkuszu płyty frontu (formatka dodawana w `geoPrzesuwne`, poza kontrolą arkusza korpusu).
- Dostęp do kolumn (`przesuwneOdslania`). Kolumna musi się zmieścić w miejscu, które odsłania jedno skrzydło odsunięte do oporu
  (`przesuwneOdsun`; przy 3 skrzydłach skrajne odsłania 612, nie 644 — staje na drugim skrajnym):
  - (!) kolumna z półkami zasłonięta o więcej niż 50 mm — „ustaw przegrody na stykach skrzydeł albo zmień liczbę skrzydeł”
    (do 2026-11-21 informacja; użytkownik: przegroda zdjęta ze styku skrzydeł — ostrzeżenie);
  - (!) kolumna z szufladami zasłonięta o więcej niż 2 mm — „szuflada się nie wysunie”;
  - przycisk „Przegrody na stykach skrzydeł” (`przesprzeg`, `przesuwneKolumny`), gdy w żadnym poziomie nie ma więcej kolumn niż skrzydeł:
    tyle kolumn, ile skrzydeł (brakujące — kopie ostatniej), przegroda na środku przerwy między miejscami odsłanianymi przez sąsiednie
    skrzydła; dodatkowe przegrody pomiędzy wolno (kolumna w obrębie jednego skrzydła nie daje uwagi). Np. 2400 mm, 3 skrzydła:
    kolumny 751 / 791 / reszta.
- Sufit (`sufitSzafyMsgs`, szafy powyżej 1500 mm w ciągu dolnym):
  - × szafa wyżej niż sufit;
  - ! luz poniżej 5 mm;
  - (i) szafa przesuwna bez blendy, luz ponad 30 mm — „może sięgać sufitu”;
  - wszystkie trzy z przyciskiem „Do sufitu z luzem 5 mm” (`szafasufit:<i>`) — przycisk nie podnosi ponad najwyższą szafę z arkusza
    (`szafaMaxH`: bok najwyżej 2761 mm, przy drzwiach przesuwnych też rączka 2700 mm);
  - sufit wyżej, niż sięgnie najwyższa szafa (pokój ok. 2770 mm i wyższy) — zamiast „może sięgać sufitu”: (i) „do sufitu się nie da …
    szafa najwyżej N mm; nad nią blenda albo nadstawka” z przyciskiem „Wysokość szafy N mm” (`szafah:<H>:<i>`) i (2026-11-22, #41,
    decyzja użytkownika „do wyboru”) „Blenda do sufitu” (`szafablenda:<i>` — blenda nad szafą na cały luz, docinana na miejscu) oraz
    „Nadstawka do sufitu (drzwi na zawiasach)” (`nadstawka:<i>`, gdy zostaje co najmniej 150 mm). Dotyczy też szafy na zawiasach.
    **Nadstawka** (`nadstawkaNaSzafie`, `cab.nadstawka`): szafka w ciągu górnym nad ciągiem szafy (prześwit 0, przesunięcie od lewej
    nad tę szafę), szerokość i głębokość szafy, do sufitu z luzem 5 mm, kolumny po najwyżej 1200 mm z drzwiami po ok. 500–600 mm
    (tabela zawiasów), bez zawieszek; blenda szafy znika. Montaż (uwaga i okucia): stawiasz ją na szafie, gdy szafa już stoi,
    i przykręcasz od środka przez dno do wieńca szafy wkrętami 4 × 30 (dwa rzędy, co ok. 500 mm) — dostęp przez otwarte drzwi
    nadstawki. Nad szafą już coś jest (ciąg górny ma szafki) — bez tej rady;
  - szafa wyższa niż najwyższa z arkusza — obok błędu formatki „Bok … nie mieści się” (i) z tym samym przyciskiem.
- Szafa przesuwna, sufit nieznany — (i) „podaj wysokość ściany”.
- **Kolejność montażu.** Korpus skręcony na leżąco stawia się, obracając go na podłodze obok cokołu, i wsuwa na cokół:
  - przekątna boku (wysokość × głębokość) ponad wysokość sufitu — (i) „skręcaj na stojąco, na miejscu”;
  - mieści się tylko bez nóżek — (i) „nóżki przykręć dopiero po postawieniu”.

## Skąd liczby

- `instrukcje/gtv-przesuwne/GTV_NOVO_S_18_instrukcja.pdf`, s. 22–25: wzory, kody, regulacja 10 mm, do 50 kg.
- Katalog GTV 2023, s. 510–512: tor górny 76 × 38, tor dolny EVO 45 × 8, długości torów.
- Użytkownik 2026-11-16:
  - tory w korpusie;
  - auto ok. 1000 mm na skrzydło, z podpowiedzią o dostępie do półek i szuflad;
  - strefa 80 mm („tor górny ma 76 mm, dla bezpieczeństwa 80”);
  - szafa do zabudowy bez domyślnej blendy, do sufitu z luzem min. 5 mm.

## Gdzie w kodzie i testy

- Kod:
  - szuflady: `cab.__szuflPrzes` (cof, szyna, y0, y1, bokMax), `rawCol.__zabudowa`, `listwyPrz` w `szufladyKolumny` (`computeGeoLiczy`); `makSzufladyNaDoleKolumny`, `slupekSzuflady` (karta Szuflady);
  - stałe i wymiary: `PRZES`, `przesuwneOn`, `przesuwneLiczba`, `przesuwneWymiary`, `przesuwneTor`, `przesuwneOdsun`, `przesuwneOdslania`;
  - geometria: `geoPrzesuwne` (wywoływana z `computeGeoLiczy`);
  - rysunki: `PrzesuwneElew` (przód), `SkrzynkaZaPrzesuwnymi` (prowadnice szuflady wewnętrznej bez frontów), grupa `przesuwne-z-gory` w `CabTop`, `przesuwneBryly` (3D: `Scene3D`, `Assembly3D`);
  - sufit: `sufitSzafyMsgs`;
  - wzór: `szafaZab` w `MAK_PALETA` (`doSufitu`).
- Testy:
  - `testy/funkcje.mjs` — bloki „drzwi przesuwne GTV NOVO S” i „szuflady za drzwiami przesuwnymi”;
  - `testy/funkcje.mjs` — blok „odsunięcie jednego skrzydła” (2, 3, 4 skrzydła);
  - `testy/makieta19.mjs` — wzór, sufit, karta Drzwi, szuflady na dół kolumny (zabudowa, klocek), widok bez frontów, odsuwanie skrzydła, 3D, karta techniczna.
- Audyt projektu (`testy/audytprojektu.mjs`): skrzydła przesuwne (znacznik bryły `drzwi-przesuwne`) poza symulacją wysuwu — dostęp sprawdza aplikacja. Tory (`tor`) i metal skrzydeł nie są płytami.
