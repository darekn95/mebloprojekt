# Ciągi, narożniki, górne szafki

**Ciąg** to szafki ustawione obok siebie pod jedną ścianą, ze wspólną wysokością,
głębokością, cokołem i blatem. Ciągi należą do pomieszczenia. Na jednej ścianie
może być ciąg dolny i górny. Dwa ciągi pod kątem prostym tworzą **narożnik**.

## Co program liczy sam

- **Ustawienie**: szafki stoją jedna za drugą od położenia na ścianie, z luzem między korpusami. Wysunięcie z lica i odsunięcie od ściany można ustawić całemu ciągowi albo jednej szafce.
- **Nowa szafka** („+ szafka”):
  - w pustym ciągu ma 560 mm głębokości;
  - obok innych bierze wymiary sąsiedniej;
  - pod blatem dostaje parę wzmocnień zamiast wieńca;
  - szuflady dostaje w systemie z kontekstu (szafka → ciąg → pomieszczenie).
- **Cokół ciągu**: jedna płaszczyzna przez cały ciąg, podzielona na formatki; w rogu cokoły na zakładkę (`opisy/cokol.md`).
- **Blat ciągu** (`opisy/korpus.md`): kawałki o długości arkusza z miejscem na słupki.
  - Głębokość: od ściany do lica frontów plus wysunięcie przed drzwi (domyślnie 10 mm).
  - Z arkusza 600 albo 1200 — szersze zamawia się docięte.
- **Narożnik** — kto wjeżdża w róg (`owner`) i z jakim luzem w rogu.
  - **Ślepy róg**: szafka ciągu wjeżdżającego ma zasłoniętą część frontu (głębokość sąsiada + jego front + 30 mm zapasu). Na zasłoniętą część robi się fix, na resztę jedne drzwi z zawiasem od zewnątrz, czyli uchwyt przy fixie.
  - **Szafka w L**: korpus z ramieniem wzdłuż drugiej ściany.
    - Drzwi w narożniku: na wspornikach, łamane (zawias 165° + łamany 90°), skręcone albo fix.
    - Kątownik w tylnym narożniku: ramiona 150 mm; półki kończą się przed nim.
  - **Wstawka w rogu** między ciągami (bez szafki w L):
    - płaska 18 mm w głąb albo szeroka 60 mm licem do przodu;
    - szeroka na trójkątach, na konfirmatach (w linii korpusu) albo na listwie;
    - konfirmaty co ok. 300 mm, min. 2.
  - **Blat w rogu**: jeden przechodzi, drugi dojeżdża do jego przedniej krawędzi (styk ze złączem) albo oba na łyżwę (cięte pod 45°).
- **Górny ciąg**: wysokość montażu = blat + prześwit nad blatem (domyślnie 500 mm).
  - Wieszanie na listwie montażowej z zawieszkami albo na haczykach.
  - Górna szafka w L (szablon) robi się na wzór dolnej, gdy przy rogu stoi szafka w L.
- **Kontrola otwierania w całej zabudowie**: skrzydła, klapy i szuflady sprawdzane względem sąsiadów, ramion, blatu i sufitu (`opisy/drzwi.md`, `opisy/klapy.md`, `opisy/szuflady.md`).

## Co ustawiasz ręcznie

- **Karta „Ciąg meblowy”, cały ciąg**:
  - **Ściana**: nazwa, długość, położenie, odsunięcie od ściany (dół / blat).
  - **Wymiary i montaż**: wysokość i głębokość szafek, luz między korpusami, poziom montażu, prześwit nad blatem, wysokość pomieszczenia.
  - **Narożnik**: z którym ciągiem, kto wjeżdża, luz w rogu, wstawka.
  - **Cokół, blat, wieszanie**.
- **Karta „Ciąg meblowy”, ta szafka**: przynależność do ciągu, wysunięcie z lica, odsunięcie od ściany.
- **Kreator rogu** („+ ciąg” przy istniejącym ciągu):
  - do którego ciągu, za nim czy przed nim, kto w róg;
  - szafka w rogu: ślepa z fixem, w L albo bez;
  - szerokość, ramię, wstawka, blat.
- **Pasek ciągów**: „+ nowy ciąg”, „+ szafka”, „+ ciąg górny”, nazwa ściany (kliknięcie), „× usuń ciąg”, przenoszenie do innego pomieszczenia.

## Kontrole i przyciski

- **Szafka inna niż ciąg**:
  - inna wysokość (fronty nie w linii) — ostrzeżenie;
  - inna głębokość — ostrzeżenie: lico zostaje w linii, cofa się tył, blat liczony na najgłębszą;
  - inny cokół (cokół idzie jedną płaszczyzną) — ostrzeżenie;
  - inny sposób wieszania (bez zawieszek przy innych na listwie, listwa / haczyki) — ostrzeżenie z przyciskami.
- **Ustawienie w ciągu**:
  - szafka wyżej / niżej od reszty — informacja;
  - odstaje od ciągu, więc blat jej nie obejmie — ostrzeżenie;
  - inna odległość od ściany niż reszta — informacja.
- **Ciąg za długi na ścianę** — błąd.
- **Cokół / blat dłuższy niż formatka / arkusz**:
  - dzieli się sam na styku korpusów — ostrzeżenie „pójdzie z N części po … mm, ciętych na styku korpusów (… mm od lewej) i oklejonych także na łączeniu”;
  - odcinek nadal za długi — błąd z przyciskiem „dołóż podział”;
  - nie ma styku, na którym dałoby się podzielić — błąd („zwęź szafkę albo potnij poza stykiem”).
- **Blat**:
  - za głęboki na arkusz albo za mało / za dużo wysunięcia przed drzwi — ostrzeżenia;
  - różna głębokość blatów sąsiednich ścian w rogu — ostrzeżenie;
  - różna wysokość blatów w rogu i w pomieszczeniu — ostrzeżenie z „Wyrównaj cokołem i nóżkami” / „Wyrównaj wysokością szafek”;
  - szafka pod blatem z wieńcem albo bez wzmocnień — ostrzeżenie z „Dołóż parę wzmocnień”.
- **Ślepy róg**:
  - szafka cała za ciągiem (nie da się otworzyć) — błąd;
  - zasłonięta część bez fixu — ostrzeżenie z „Ustaw szafkę w rogu: fix N mm + drzwi (+ wstawka)”;
  - fix inny niż zasłonięta część — „Popraw fix na N mm”;
  - po ustawieniu — informacja.
- **Szafka w L**:
  - brak frontu albo za mało frontu od strony ciągu — błąd / ostrzeżenie;
  - ramię krótsze niż 200 mm — ostrzeżenie;
  - drzwi ramienia szersze niż ok. 600 mm — ostrzeżenie;
  - front węższy niż 250 mm — ostrzeżenie;
  - półka bez pary od strony ramienia (skończyłaby się w powietrzu) — błąd;
  - za duży luz przy boku — błąd;
  - opisy kątownika i zasięgu od rogu — informacje.
- **Głębokość w rogu**: szafka sąsiedniego ciągu głębsza niż ta w rogu — błąd.
- **Górny ciąg**:
  - wystaje poza dolny — ostrzeżenie;
  - szafka dolna sięga w górne (słupek) — błąd;
  - górne szafki ponad sufit — błąd; luz do sufitu — informacja.
- **Kolizje otwierania w rogu**: przyciski „Przełóż zawiasy” i wstawka 18 / 60 mm — tylko gdy pomagają.

## Skąd liczby

- **Decyzje użytkownika** (`BLEDY.md` „Ustalone”, `NASTEPNE-KROKI.md`):
  - zapas ślepego rogu 30 mm (użytkownik robi ok. 50, 30 wystarcza);
  - wstawka 60 mm jako najwęższa formatka do oklejenia;
  - mocowania szerokiej wstawki (2026-10-11);
  - szafka w L i jej drzwi;
  - wysokość blatów w rogu (2026-10-19).
- **Prześwit nad blatem**: 500 mm domyślnie.
- **Zawieszka**: ZK-ZAW-R0-10 (`instrukcje/ZK-ZAW-R0-10_zawieszka_karta.pdf`).

## Gdzie w kodzie i testy

- **Układ**: `projectLayout`, `runLayout`, `runFrontDepth`, `wallGapOf`; róg — `run.corner`, `cornerPairMsgs`, `armCtxOf`, `cornerSpan`, `wstawkiOf`, `wstawkaMsgs`.
- **Uwagi ciągu**: `runCabMsgs`, `wallGapMsgs`, `worktopMsgs`, `openingMsgs`, `szufladyMsgs`; cokół / blat ciągu: `runPlinth`, `runTop`.
- **Testy**: `ciag`…`ciag10`, `ciagarm`, `pietra`, `gorne`, `gornaL`, `narozn`, `narozn2`, `narozn3`, `narjedne`, `narkat`, `rogplecy`, `rysrog`, `wstawka`, `blatrog`, `blatwys`, `otwier`, `audytzabudowa`, `kreator`, `odsuniecie`, `pomieszczenia`.
