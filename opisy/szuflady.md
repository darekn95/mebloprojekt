# Szuflady

Kolumna w „Strukturze wnętrza” → **Szuflady**. Każda szuflada ma swój system
(pierwsze pole wiersza):
- **V-BOX** — Sevroll V-BOX 3D Slim, boki metalowe, dno i tył z płyty;
- **DXS-3D** — Sevroll DXS-3D Synchro, skrzynka cała z płyty na prowadnicach pod dnem, cichy domyk.

Liczby katalogowe obu systemów są dla płyty 18 mm.

## Wspólne dla obu systemów

### Co program liczy sam
- **Liczba nowych szuflad** po kliknięciu „Szuflady”: 3, a gdy się nie mieszczą — 2 albo 1, czyli najwięcej, przy których szafka ma najmniej błędów.
- **System nowej szuflady** (też „+ szuflada”): jak w tej kolumnie, potem jak w szafce, ciągu, pomieszczeniu; gdy nigdzie nie ma szuflad — V-BOX.
- **Ustawienia klapy kolumny** znikają przy zmianie z drzwi na szuflady.
- **Fronty**: pasmo kolumny dzielone równo. Front wpisany ręcznie zostaje, reszta pasma dzieli się na pozostałe.
- **Nałożenie frontu na dno / wieniec**: front nakładany dolnej szuflady zachodzi 15 mm na dno, a górnej — 15 mm na wieniec (karta „Luzy drzwi”; pod blatem bez wieńca nie wychodzi ponad korpus). Fronty: „jak szafka”, „na korpusie” albo „wewnątrz”.
- **Prowadnice w pionie**:
  - najniższa szuflada siada na dnie (albo przegrodzie) poziomu;
  - każda wyższa ma prowadnicę 5 mm nad dołem swojego frontu („Front poniżej prowadnicy”).
- **Szerokość**: szuflada wypełnia kolumnę, bo prowadnice przykręca się do boku szafki albo przegrody. Po usunięciu przegrody kolumna z wpisaną szerokością wraca na auto.
- **NL (długość prowadnicy)**: najdłuższa z listy systemu, która się zmieści.
  - Do pleców potrzeba NL + 3 mm, przy froncie wpuszczanym także + grubość frontu.
  - Wzmocnienie przy plecach na wysokości skrzynki skraca NL (4 mm luzu przed nim).
- **Wysokość boku „auto”**: najwyższa, która mieści się pod tym, co wyżej, z luzem 5 mm (`SZUFLADA_ZAPAS`). Nad szufladą może być następny front, góra światła albo wzmocnienie pod blatem na całej drodze skrzynki.

### Co ustawiasz ręcznie
- **System**: V-BOX albo DXS-3D. Przy zmianie bok i tył wracają na auto, reling i podniesiony tył znikają, a NL spoza listy nowego systemu wraca na auto.
- **Bok**: V-BOX z listy, DXS-3D w mm.
- **Front**: wysokość frontu każdej szuflady.
- **Uchwyt**: włączany osobno na każdym froncie.
- **Wcięcie na palce (podfrez) zamiast uchwytu** — w kolumnie, przy frontach wpuszczanych i nakładanych (nakładane od 2026-10-24, decyzja użytkownika): każdy front niższy od góry o podaną głębokość (domyślnie 18 mm), prowadnice i podział pasma bez zmian, uchwyty kolumny znikają (pojedynczy można włączyć z powrotem); wyłączenie oddaje uchwyty. W szczelinie nad frontem widać skrzynkę.
- **Tył**: V-BOX — podniesiony, DXS-3D — wysokość w mm.
- **NL**: dla całej kolumny albo dla jednej szuflady.
- **Luz między frontami**: wspólny z drzwiami, domyślnie 2 mm.
- **„dopasuj fronty”**: dzieli pasmo proporcjonalnie do wysokości boków.

### Kontrole i przyciski
- **Luz między frontami**:
  - 0 lub mniej — błąd z „Zwiększ luz do 2 mm”;
  - 1 mm — ostrzeżenie z tym samym przyciskiem;
  - więcej niż „Ostrzegaj powyżej” (5 mm) — błąd z przyciskiem;
  - przy równym podziale fronty różniące się o 1–2 mm — ostrzeżenie z przyciskami zmiany luzu.
- **Fronty nie wypełniają pasma** (wpisane ręcznie) — błąd z „Podziel fronty równo” (wpisane wysokości wracają na auto).
- **Szuflada się nie mieści** (żadna wysokość skrzynki nie wchodzi) — błąd z przyciskami „Zmniejsz do N szuflad” (zostają dolne, fronty dzielą się od nowa) i „Zmień na DXS-3D”. Każdy przycisk pokazuje się tylko wtedy, gdy usuwa błąd.
- **Za mało luzu nad bokiem** (< 5 mm) — błąd z przyciskiem niższego boku, jeśli taki się zmieści.
- **NL**:
  - za długa (nie ma tyle głębokości albo wjeżdża we wzmocnienie) — błąd z przyciskiem krótszej;
  - krótsza, niż się zmieści — ostrzeżenie „zmieści się głębsza NL”;
  - korpus za płytki na najkrótszą NL — błąd.
- **Element stały (fix) w kolumnie szuflad**: bez wspornika — błąd z „Usuń element stały” / „Dobuduj wspornik pionowy”. Ze wspornikiem szuflada jest węższa, a prowadnica idzie na wspornik.
- **Kolumna węższa niż 200 mm** — ostrzeżenie.
- **Różne systemy**:
  - w szafce — ostrzeżenie z „Wszystkie szuflady szafki na …” / „Zostaw różne systemy”;
  - szafka inna niż ciąg / pomieszczenie — ostrzeżenie z „Zostaw tak”.
- **Wysuw** (błąd, kontrola ruchu w zabudowie): wysunięta szuflada nie może trafić w blat, korpus sąsiada (ślepy róg) ani inny front → „nie wysunie się do końca … wysunie się tylko N z M mm”.
- **Poziomy** po zmianach struktury nie wypełniają wnętrza — błąd z „Górny poziom na auto” / „Podziel poziomy równo”.

## V-BOX

- **Boki**: 80, 95, 127, 178, 210, 238 mm.
  - Auto bierze najwyższy bok, który front uniesie i który się zmieści.
  - Minimalny front zależy od boku i od tego, czy front jest nakładany czy wpuszczany: bok 80 → 95 / 93 mm, …, bok 238 → 253 / 251 mm.
- **Pion od dołu prowadnicy**:
  - góra boku = minimalny front nakładany (bok 80 → 95 mm);
  - bok zaczyna się 13–15 mm nad dołem prowadnicy;
  - spód dna = spód tyłu.
- **NL**: 250, 270, 300, 350, 400, 450, 500, 550, 600. Wysuw = NL.
- **Skrzynka z płyty półek**:
  - dno: (światło kolumny − 75) × (NL − 24), bez okleiny;
  - tył: (światło − 87) × wysokość z tabeli (bok 80 → 71, 95 → 86, 127 → 118, 178 → 169, 210 → 200, 238 → 230), oklejona góra.
- **Podniesiony tył**:
  - sięga do frontu, ale nie wyżej niż jego góra;
  - nad nim musi być 20 mm wolnego (`BACK_CLEAR`); gdy nie ma — błąd z „Wyłącz podniesiony tył”.
- **Kontrole tylko V-BOX**:
  - front za niski na bok — błąd z „Zmień bok szuflady na …”;
  - ręcznie wybrany bok niższy, niż front uniesie — ostrzeżenie z przyciskiem wyższego;
  - front ponad 140 mm wyżej niż bok — ostrzeżenie z „Dodaj reling” / „Zostaw bez relingu” (reling w zamówieniu: komplet, 30 zł);
  - szuflada szersza niż 600 mm — ostrzeżenie „wzmocnij dno kątownikiem (Sevroll 40343)”;
  - płyta inna niż 18 mm — ostrzeżenie, bo liczby z katalogu są dla 18.
- **Zamówienie**: „Prowadnica Sevroll V-BOX 3D Slim … mm”, cena z cennika wg wysokości boku i NL.
- **Plan wierceń**: kreska prowadnicy na boku, przegrodzie albo wsporniku.

## DXS-3D

- **Skrzynka z płyty półek**:
  - boki na zewnątrz, długość NL − 10, oklejona górna krawędź;
  - dno i tył między bokami, na konfirmaty przez boki od zewnątrz;
  - dno dochodzi do tyłu.
- **Szerokość dna i tyłu** = światło kolumny − 2 × (6,5 + grubość płyty); przy płycie 18 mm to światło − 49. Od boku szafki do boku skrzynki jest 6,5 mm.
- **Pion od spodu prowadnicy**:
  - dół boku na +17 mm;
  - spód dna i tyłu na +27 mm, więc boki schodzą 10 mm poniżej dna;
  - najniższa prowadnica stoi 2 mm nad dnem szafki;
  - front zawsze sięga spodu prowadnicy (27 mm poniżej spodu dna) i ją zasłania.
- **Bok**: auto jak wyżej (najwyższy z luzem 5 mm) albo ręcznie w mm. Puste pole pokazuje „auto N”.
- **Tył**: auto = bok − 10, góra równo z bokami. Ręcznie można niżej; wyżej daje ostrzeżenie z przyciskiem powrotu.
- **Najniższa możliwa skrzynka**: bok 40 / tył 30 mm. Gdy auto nie mieści nawet takiej — błąd „nie ma miejsca na skrzynkę DXS-3D” z przyciskami „Zmniejsz do N szuflad” / „Zmień na DXS-3D”.
- **Wąskie formatki skrzynki** (reguła wszystkich formatek):
  - poniżej 30 mm — błąd;
  - 30–60 mm — ostrzeżenie z „Tak, docinam ręcznie”, a przy boku / tyle także „Zwiększ do 60 mm”, gdy bok 60 mm się mieści.
- **NL**: 250–600 co 50, bez 270. Wysuw (B z tabeli) jest krótszy od NL, np. NL 500 → 470 mm.
- **Inne kontrole**: płyta inna niż 16 / 18 / 19 mm — ostrzeżenie; kolumna za wąska na skrzynkę — błąd.
- **Zamówienie**:
  - „Prowadnica Sevroll DXS-3D Synchro”, komplet na szufladę (NL i indeks w opisie), 50 zł bez względu na NL;
  - konfirmaty skrzynek doliczone do konfirmatów („dno i tył przez boki”).
- **Plan wierceń**:
  - kreska spodu prowadnicy na boku szafki; prowadnicę przykłada się do kreski i przykręca 3 wkrętami bez nawiercania;
  - przód prowadnicy 4 mm za krawędzią szafki (przy froncie wpuszczanym + grubość frontu);
  - boki skrzynki: konfirmaty dna i tyłu;
  - tył: otwór zaczepu ⌀6 × 10 mm, 11 mm nad dołem;
  - dno: sprzęgła (20415), 75 mm od boku.

## Skąd liczby

- **V-BOX**: `instrukcje/Folder-Szuflada-V-BOX-18mm-online.pdf`, str. 6. Pion skrzynki to decyzja użytkownika 2026-10-05.
- **DXS-3D**: katalog Sevroll 2026, s. 110–113 (`instrukcje/Katalog-Akcesoria_PL_2026…`). Odczyty i odpowiedzi użytkownika są w `BLEDY.md`, „Ustalone: Szuflady DXS-3D Synchro”, oraz w `AI_NOTES.md` (2026-10-21).
- **Decyzje użytkownika** (w `BLEDY.md`):
  - luz 5 mm nad bokiem;
  - reling przy froncie > 140 mm nad bokiem;
  - reguła 60 / 30 mm;
  - cena DXS 50 zł;
  - V-BOX domyślny;
  - przyciski „Zmniejsz” / „Zmień na DXS-3D” (2026-10-22).

## Gdzie w kodzie i testy

- **Obliczenia**: `computeGeo`, kolumna szuflad (gałąź V-BOX, `szufladaDxs`); stałe `VBOX`, `DXS`, `SZUFLADA_ZAPAS`, `BACK_CLEAR`, `MIN_DOCIECIE`.
- **Interfejs**: `setColKind`, `addDrawer`, `setDrawerSystem`; przyciski w `NoteLine` (`fixh`, `fixnl`, `fixback`, `szufmniej`, `szufdxs`, `szufsys`, `reling…`, `zwieksz60`) i `przyciskiSzuflad` w `App`.
- **Rysunki i 3D**: `szufladaOdCzola`, `szufladaZGory`, `szerWnetrzaSzuflady`; bryła 3D `skrzynkaBryly`, wysuw `wysuwSzuflady`.
  - Z przodu (otwarte) skrzynka DXS ma boki, tył i dno; przy uchwycie frezowanym skrzynkę widać też przy zamkniętych frontach (pod frezem).
  - Kolumny szuflad o innym podziale mają osobne kolumny wymiarów (`grupySzuflad`); kolumny o tym samym podziale — wspólną.
  - Z boku i z góry każdy front rysuje się wg swojego montażu (`d.inset`) — front szuflad na korpusie w szafce wpuszczanej stoi przed korpusem; obrys skrzynki z góry od `dr.bx0` (np. za wspornikiem fixu).
- **Testy**: `macierzszuflad` (317 układów, każdy przycisk naprawy sprawdzany), `audyt2d` (rysunki = rzut brył 3D; pełna lista szuflad z `SZUF2D=1`), `szuflady`, `dxs`, `audytszuflad` (klikane jak użytkownik), `tylkol`, `bokszuf`, `audytwierc` (plan wierceń V-BOX), `ruchy`, `audytmacierz`.
