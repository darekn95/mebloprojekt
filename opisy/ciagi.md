# Ciągi, narożniki, górne szafki

**Ciąg** to szafki ustawione obok siebie pod jedną ścianą, ze wspólną wysokością,
głębokością, cokołem i blatem. Ciągi należą do pomieszczenia. Na jednej ścianie
może być ciąg dolny i górny. Dwa ciągi pod kątem prostym tworzą **narożnik**.

## Co program liczy sam

- **Stoi czy wisi**: ciąg dolny z poziomem montażu 0 stoi na podłodze — także szafki bez nóżek i cokołu (np. RTV): bez zawieszek, haków, listwy i uwag o wieszaniu (`ciagStoi`, `cabDoGeo` → `cab.naPodlodze`; użytkownik 2026-10-24). Ciąg wiszący (także dolny, np. szafki RTV na ścianie) — poziom montażu > 0.
- **Ustawienie**: szafki stoją jedna za drugą od położenia na ścianie, z luzem między korpusami. Wysunięcie z lica i odsunięcie od ściany można ustawić całemu ciągowi albo jednej szafce.
- **Nowa szafka** („+ szafka”):
  - w pustym ciągu ma 560 mm głębokości;
  - obok innych bierze wymiary sąsiedniej;
  - pod blatem dostaje parę wzmocnień zamiast wieńca;
  - szuflady dostaje w systemie z kontekstu (szafka → ciąg → pomieszczenie).
- **Wspólny wieniec** (opcja ciągu, zamiast blatu roboczego; użytkownik 2026-10-24, szafki RTV): jedna płyta korpusu na bokach szafek w najczęstszej wysokości ciągu (`wysokoscWienca`; wyższy słupek i szafka w L zostają przy swoim wieńcu), równo z frontami (nakładane: 2 mm luzu + grubość frontu), przykręcana od spodu na trójkątach. W szafce to „Blat z płyty” oznaczony `top.zCiagu` (`wieniecZCiagu`), wyłączenie wraca do wieńca. W zamówieniu „Wieniec ciągu” (pozycja „Wieniec — ciąg”), dzielony na stykach przy arkuszu 2800, przerywany słupkiem.
- **Wspólne dno** (opcja ciągu): szafki stoją bokami na jednej płycie — dno każdej pod bokami (`dnoZCiagu`, poprzednie złącza wracają po wyłączeniu); w zamówieniu „Dno ciągu” (pozycja „Dno — ciąg”), dzielone na stykach. Jak wieniec — tylko pod szafkami w wysokości ciągu: wyższy słupek i szafka w L mają swoje dno, słupek w środku dzieli dno na odcinki (użytkownik 2026-10-24). Różna głębokość / płyta dna — dna zostają przy szafkach (informacja w karcie ciągu, `runBottom`, `idxs` — szafki na wspólnym dnie).
- **„⊞ Scal szafki w jedną…”** (przycisk w karcie ciągu, „Cały ciąg”, albo znaczek ⊞ przy szafce na pasku — obok ⧉ duplikowania, z dymkiem „Scal z szafką obok w jedną”; użytkownik 2026-10-24): wybór szafek ciągu stojących obok siebie i boków na stykach. Znaczek zaznacza tę szafkę i sąsiada z prawej, rozwija kartę ciągu i przewija do okienka.
  - **Pojedyncze** — jedna szafka (nazwa „S2 + S3 + S4”, szerokość = suma korpusów i luzów) z przegrodami, wspólnym wieńcem i dnem; kolumny i ich wnętrza (półki, drzwi, szuflady, zawiasy) bez zmian; wymiar zewnętrzny zostaje (3 × 600 → 1800), a to, co zwolnił drugi bok i luz między korpusami, dzieli się równo na kolumny, w proporcji do ich szerokości (salon: 564 → 576 / 576 / 576); ostatnia kolumna auto (`scalSzafki`, użytkownik 2026-10-24).
  - Warunki (`scalenieBlad`, „Nie da się scalić: …”): obok siebie w jednym ciągu, ta sama wysokość, głębokość i podział na poziomy, bez szafki w L, wycięć i przeszkód.
  - **Różne płyty** (audyt GPT N88, 2026-10-28): szafka ma jeden zestaw płyt, więc przy różnych płytach zaznaczonych szafek (korpus, fronty, półki, plecy — te, które szafka naprawdę zamawia, z dekorem i grubością) kreator pokazuje różnice i wybór „płyty jak w [szafka]” (domyślnie pierwsza od lewej); scalona szafka bierze płyty, grubość i ustawienia „z tej samej płyty co korpus” z wybranej (`roznePlyty`, `scalSzafki(…, wzor)`). Wcześniej po cichu płyty pierwszej.
  - **Dwie przegrody** (użytkownik 2026-10-29, zamiast dawnych „podwójnych” boków, które zostawiały osobne szafki) — jedna szafka, wspólny wieniec i dno; na każdym styku dwie przegrody obok siebie, jak boki osobnych szafek (`col.przegrodaPodw` na ostatniej kolumnie każdej szafki poza ostatnią), więc wnętrza kolumn zostają jak były (2 × 600 → 564 / 564), a na kolumny idzie tylko luz między korpusami. Fronty zakrywają każdy swoją przegrodę, jak w osobnych szafkach (zawias nakładany, nie półnakładany). Przegrody skręcone 4 wkrętami — zasady w `opisy/korpus.md`. Przegrody „przelotowej” (od dołu do góry, wieniec i dno w kawałkach) nie ma — w praktyce to to samo co jedna przegroda (użytkownik 2026-10-29).
- **Nowa szafka** i szafka przeniesiona do ciągu dostają wspólny wieniec / dno ciągu (`wedlugCiagu`); wyjęta z ciągu — je oddaje.
- **Cokół ciągu**: jedna płaszczyzna przez cały ciąg, podzielona na formatki; w rogu cokoły na zakładkę (`opisy/cokol.md`).
- **Blat ciągu** (`opisy/korpus.md`): kawałki o długości arkusza z miejscem na słupki.
  - Ciąg bez blatu roboczego, a szafki z własnym blatem („Blat” zamiast wieńca): blaty z tej samej płyty łączą się w zamówieniu w jedną płytę ciągu — z płyty szafki, która blat ma (nie pierwszej w ciągu); w 3D każda szafka rysuje swój. Blaty z różnych płyt zostają przy swoich szafkach — informacja w Uwagach (audyt GPT N78, N79).
  - Głębokość: od ściany do lica frontów plus wysunięcie przed drzwi (domyślnie 10 mm).
  - Odsunięcie od ściany inne na dole i na wysokości blatu: blat zaczyna się przy ścianie na wysokości blatu — gdy tam jest dalej (dół 0, blat 100), blat sięga 100 mm za linię ściany przy podłodze, a wysięg z przodu zostaje zwykły (rysunki i 3D, audyt GPT N69).
  - Z arkusza 600 albo 1200 — szersze zamawia się docięte.
- **Narożnik** — kto wjeżdża w róg (`owner`) i z jakim luzem w rogu.
  - **Ślepy róg**: szafka ciągu wjeżdżającego ma zasłoniętą część frontu (głębokość sąsiada + jego front + 30 mm zapasu). Na zasłoniętą część robi się fix, na resztę jedne drzwi z zawiasem od zewnątrz, czyli uchwyt przy fixie.
  - **Szafka w L**: korpus z ramieniem wzdłuż drugiej ściany.
    - Drzwi w narożniku: na wspornikach, łamane (zawias 165° + łamany 90°), skręcone albo fix.
    - Kątownik w tylnym narożniku: ramiona 150 mm, z płyty półek (jej grubość w zamówieniu, rysunkach, 3D, stykach i wzmocnieniach — audyt GPT N70); półki kończą się przed nim.
  - **Wstawka w rogu** między ciągami (bez szafki w L):
    - płaska 18 mm w głąb albo szeroka 60 mm licem do przodu;
    - szeroka na trójkątach, na konfirmatach (w linii korpusu) albo na listwie;
    - konfirmaty co ok. 300 mm, min. 2.
  - **Blat w rogu**: jeden przechodzi, drugi dojeżdża do jego przedniej krawędzi (styk ze złączem) albo oba na łyżwę (cięte pod 45°).
- **Górny ciąg**: wysokość montażu = blat + prześwit nad blatem (domyślnie 500 mm).
  - Wieszanie na listwie montażowej z zawieszkami albo na haczykach.
  - **Szafka wisząca z dala od ściany** (wysunięta z lica albo płytsza od reszty ciągu, więc stoi równo frontami; odstęp = lico ciągu + wysunięcie − głębokość, `odstepOdSciany`) — błąd „zawieszki nie sięgną listwy / haków, szafka zawisłaby w powietrzu” z „Do ściany (wysunięcie N mm)” (wysunięcie, przy którym tył dotyka ściany; bez tego przycisku, gdy przesunęłoby lico całego ciągu) i „Listwa / Haki na dystansie N mm” (`cab.dystans`: dystans równy grubości płyty albo dwóm — formatka „Listwa dystansowa” 60 mm × długość szafki z płyty korpusu, bez okleiny, 1 lub 2 warstwy, w rozkroju z kawałków ze zrzutów; inny — „Kantówka dystansowa” w zamówieniu, przekrój co 5 mm; na hakach — „Klocek dystansowy pod hak”; uwaga mówi, co i gdzie jest; listwa ciągu dzieli się na odcinki przy innej płaszczyźnie; decyzja użytkownika 2026-10-31). Dystans przy szafce dosuniętej do ściany — ostrzeżenie z „Usuń dystans” (użytkownik 2026-10-30, audyt GPT N148).
  - Listwa jedna przez ciąg, na wymiar (nie tniemy jej pod szafki), od pierwszej do ostatniej szafki z zawieszkami; zakup w odcinkach 1 / 2 m — `opisy/zamowienie.md`. Szafka bez zawieszek w ciągu na listwie — ostrzeżenie „może to być pomyłka” (w środku listwa przechodzi za nią, na końcu kończy się przed nią). Szafka z plecami cofniętymi ma listwę w sobie — listwa ciągu kończy się przy niej.
  - Górna szafka w L (szablon) robi się na wzór dolnej, gdy przy rogu stoi szafka w L.
- **Kontrola otwierania w całej zabudowie**: skrzydła, klapy i szuflady sprawdzane względem sąsiadów, ramion, blatu i sufitu (`opisy/drzwi.md`, `opisy/klapy.md`, `opisy/szuflady.md`).

## Co ustawiasz ręcznie

- **Karta „Ciąg meblowy”, cały ciąg**:
  - **Ściana**: nazwa, długość, położenie, odsunięcie od ściany (dół / blat).
  - **Wymiary i montaż**: wysokość i głębokość szafek, luz między korpusami, poziom montażu, prześwit nad blatem, wysokość pomieszczenia.
  - **Narożnik**: z którym ciągiem, kto wjeżdża, luz w rogu, wstawka.
  - **Cokół, blat (roboczy albo wspólny wieniec z płyty), wspólne dno, wieszanie**.
- **Karta „Ciąg meblowy”, ta szafka**: przynależność do ciągu, wysunięcie z lica, odsunięcie od ściany.
- **Kreator rogu** („+ ciąg” przy istniejącym ciągu):
  - do którego ciągu, za nim czy przed nim, kto w róg;
  - szafka w rogu: ślepa z fixem, w L albo bez;
  - szerokość, ramię, wstawka, blat.
- **Pasek ciągów**: „+ nowy ciąg”, „+ szafka”, „+ ciąg górny”, nazwa ściany (kliknięcie), „× usuń ciąg”, przenoszenie do innego pomieszczenia.

## Kontrole i przyciski

- **Szafka inna niż ciąg**:
  - inna wysokość (fronty nie w linii) — ostrzeżenie z „Wyrównaj tę szafkę do ciągu” / „Ustaw cały ciąg”, a przy wyższej także „To słupek — wyjątek w ciągu” (`cab.slupek`): zostaje informacja, wspólna wysokość ciągu słupka nie zmienia, „To jednak zwykła szafka” cofa (użytkownik 2026-10-24);
  - niższa szafka, gdy ciąg ma wysokość od wyższej (salon: ciąg 1600 od pierwszej szafki, reszta 900) — też „Ustaw cały ciąg na 900 mm, wyższe jako słupki” (`ciagslupki:`);
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
  - kilka frontów jeden nad drugim w kolumnie przy ramieniu (dwa poziomy, podział kolumny) — ramię ma tyle samo frontów, w tych samych wysokościach („Front ramienia — dolny / górny”, każdy z zawiasami i uchwytem; maskownica na całą wysokość) — informacja (decyzja użytkownika 2026-10-28, N132);
  - szuflady w kolumnie przy ramieniu — błąd: od strony ramienia nie ma boku pod prowadnicę (N139);
  - własna szerokość wzmocnienia ramienia większa niż wysokość wnętrza (stojące) albo głębokość ramienia (leżące) — błąd z największą wartością (N125);
  - kołki półek nie mieszczą się na półce ramienia (płytkie ramię przy płytkim sąsiednim ciągu) — błąd z „Ustaw 50 / 50 mm” dla szafki w L (N136);
  - za duży luz przy boku — błąd;
  - opisy kątownika i zasięgu od rogu — informacje.
- **Głębokość w rogu**: szafka sąsiedniego ciągu głębsza niż ta w rogu — błąd.
- **Górny ciąg**:
  - wystaje poza dolny — ostrzeżenie;
  - szafka dolna sięga w górne (słupek) — błąd;
  - górne szafki ponad sufit — błąd; luz do sufitu — informacja.
- **Kolizje otwierania w rogu**: przyciski „Przełóż zawiasy” i wstawka 18 / 60 mm — tylko gdy pomagają. Fronty „Skręcone 90°” liczą się jako jeden sztywny zespół na zawiasach korpusu — front ramienia obraca się wokół tej samej osi (audyt GPT N135), bez rady o przełożeniu zawiasów.
- **Ramię szafki w L w zamówieniu**: płyty ramienia mają oklejanie z tabeli formatek jak korpus (N130), zawiasy z grubości płyty frontu ramienia (N123), uchwyt także wpuszczany (wystawanie 0, N124), półki z mocowaniem swojej kolumny i granicy (N131), wzmocnienia z kolumny przy ramieniu bez powtórzeń (N137), plecy ze zszywkami / wkrętami co 100 mm po obwodzie (N138), kątownik od wierzchu dna — też przy cokole w obrysie (N134).
- **Wspólne dno ciągu**: rozpoznanie „dno pod bokami” z osadzenia dna, nie z obrzeży (N118); szafki różnie wysunięte z lica — każda zostaje przy swoim dnie (N133); w 3D jedna płyta „Dno ciągu” jak w zamówieniu (N119); płyta porównywana w całości — nazwa, kolor, **dekor**, grubość (`tozsamoscPlyty`): Oak i Ash o tej samej nazwie i kolorze to różne płyty i dna zostają przy szafkach (N154). Tak samo przy łączeniu własnych blatów szafek w jedną płytę ciągu.
- **Blat roboczy ciągu a własny blat słupka**: zamówienie zdejmuje własny blat tylko z szafek, nad którymi leży blat ciągu (`runTop(...).pokryte`); wyższa szafka (słupek) z blatem z płyty zostaje z nim w formatkach, w PDF i w zamówieniu (N151).
- **Prześwit nad blatem 0** zostaje 0 po zapisie i wczytaniu (N120).
- **Scalanie szafek** z różnym montażem frontów (nakładane / wpuszczane) — zablokowane z powodem (N141). **Różne plecy** (bez pleców / HDF / z płyty, frez, cofnięcie) — w kreatorze jak różne płyty („plecy: A — bez pleców; B — HDF 3 mm”), scalona dostaje plecy szafki wybranej w „płyty jak w” (`POLA_PLECOW`; wcześniej brała po cichu z pierwszej — N152). **Ponowne scalanie**: tryb „jedna / dwie przegrody” dotyczy tylko nowych styków; przegrody w środku scalanej szafki (też podwójne z wcześniejszego scalania i przeloty) zostają (N156).
- **Własne blaty szafek** łączą się w blat ciągu tylko z tej samej płyty i na tej samej wysokości (N142).
- **Blaty ciągów górnych w rogu** porównuje się na rzeczywistej wysokości (montaż automatyczny nad dolnym — `tierMountY`) — przy różnej bez złączy, z uwagą (N146).
- **Listwa montażowa** ciągu dzieli się na odcinki, gdy szafki mają zawieszki na różnych wysokościach (różne H) (N148).

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

## Rysunek ciągu z boku (2026-10-24)

Zakres „Ciąg” ma widok „Z boku” — przekrój ściany: od ściany głębokość, od podłogi wysokość. Każdy inny profil szafki (głębokość, wysokość, zawieszenie) rysuje się raz, wyższe pod spodem; szafki stoją licem równo (lico ciągu jak przy blacie), fronty nakładane 2 mm przed korpusem. Do tego cokół, nóżki, blat roboczy, ciąg górny i ściana (przełączniki „Ukryj blat” / „Ukryj ścianę”). Wymiary: „z frontem” każdego piętra, „blat N (M przed frontem)”, łańcuch wysokości i wysokość całkowita. Zabudowa z rogami tego widoku nie ma (nie ma jednego boku).
