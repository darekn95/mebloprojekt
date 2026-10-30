# Poziomy, kolumny, półki

„Struktura wnętrza” dzieli wnętrze korpusu:
- **poziomy** — jeden nad drugim, rozdzielone półką przelotową na całą szerokość;
- **kolumny** — w każdym poziomie obok siebie, rozdzielone przegrodą pionową;
- **półki** — w kolumnie z drzwiami.

Każda kolumna jest „Półki i drzwi”, „Szuflady” albo „Blenda”. Lista w interfejsie idzie od górnego poziomu, kolumny od lewej.

## Co program liczy sam

- **Wysokość poziomów**: wnętrze minus półki przelotowe, dzielone równo. Wpisana wysokość zostaje, reszta dzieli się na poziomy auto.
- **Szerokość kolumn**: światło minus przegrody, dzielone tak samo.
- **Światła między półkami** w kolumnie: tak samo — liczba półek = liczba świateł − 1.
- **Półki nowej szafki** (szablon): tyle, ile wejdzie przy świetle co najmniej 250 mm — niska szafka dostaje jedną, słupek kilka.
- **„dopasuj półki”** (cała szafka albo kolumna, `dopasujPolki`): tyle półek, ile wejdzie przy świetle co najmniej 250 mm, liczone z grubości półek (audyt GPT N96: z grubości korpusu wychodziło 249 mm przy półkach grubszych od korpusu). W kolumnie z podziałem frontów każdy poziom kolumny osobno — granice, fronty i ich ustawienia zostają (N91: wcześniej znikał podział i zostawały jedne drzwi na całą kolumnę); światła niższych poziomów dostają wymiar na stałe, najwyższy jest auto; poziomy szuflad i blendy — bez półek; rura zostaje w swoim poziomie (w jego najwyższym świetle).
- **Nowy poziom / kolumna**:
  - wpisanie wymiaru ostatniemu dokłada nowy pusty (auto), jeśli zostaje co najmniej 100 mm (poziom) albo 200 mm (kolumna);
  - „+ poziom” i „+ przegroda i kolumna” dokładają ręcznie.
- **Usunięcie poziomu / kolumny**: miejsce bierze sąsiad usuniętego (ten nad nim / na prawo, przy ostatnim — pod nim / na lewo), reszta szafki zostaje na swoim miejscu (użytkownik 2026-10-24):
  - usunięty z wpisanym wymiarem i sąsiad z wpisanym — sąsiad rośnie o usunięty i płytę między nimi (klapy 303 / 303 / 302 / auto, usuwasz drugą → 303 / 623 / auto);
  - sąsiad auto — bierze miejsce sam; gdy wszystkie pozostałe mają wpisany wymiar, a usunięty był auto — sąsiad wraca na auto;
  - został jeden — auto. Kolumna szuflad sięga wtedy boku, bo tam idą prowadnice.
- **„Klapy zamiast drzwi”**: gdy klapy wyjdą niższe, niż potrzebuje podnośnik GTV (płytka pod płytą z zawiasami + 15 mm), przy przycisku ostrzeżenie z wysokościami (np. 216 mm przy 257).
- **Para wzmocnień pod blat** (szafka pod blatem) zawsze trzyma się najwyższego poziomu i każdej jego kolumny — przy każdej zmianie struktury.
- **Głębokość półki i przegrody**: głębokość korpusu minus plecy w środku albo we frezie.
  - Półka dodatkowo minus „dodatkowe cofnięcie półek”.
  - Przy frontach wpuszczanych półka jest krótsza o grubość frontu + 5 mm.
  - W szafce w L półka kończy się przed kątownikiem w tylnym rogu.
  - Przy wsporniku pionowym fixu półka zaczyna się za nim — dostajesz o tym ostrzeżenie.
- **Mocowanie półek** (cała szafka, kolumna albo pojedyncza półka graniczna poziomu kolumny): kołki podporowe ⌀5 (domyślnie), konfirmaty albo trójkąty meblowe — po dwa na stronę, przy przedniej i tylnej krawędzi. **Półka graniczna** (granica frontów w kolumnie) ma własne mocowanie w karcie poziomu nad nią — „półka pod nim: kołki / konfirmaty / trójkąty” (`col.podzialMount[poz]`, kolejność jak `col.podzial`, „domyślne” zdejmuje wpis; 2026-10-25); bez wpisu — mocowanie wybrane ręcznie dla całej kolumny (pole „mocowanie” kolumny, przycisk „Półki kolumny N na …”), a gdy go nie ma — **konfirmaty** (`GRANICA_MOCOWANIE`, `mocowanieGranicy`; wybór kolumny — audyt projektu użytkownika 2026-10-25; decyzja użytkownika 2026-10-25: „półki raczej na kołki, a poziomy raczej na konfirmaty”, pod zawiasami klapy musi być sztywno; przy samych drzwiach w pionie granicę można przestawić na kołki). Kreator klap nie przestawia już całej kolumny na konfirmaty — zwykłe półki zostają na kołkach; „Półki kolumny N na …” ustawia wszystkie półki kolumny razem z granicami. Wiercenia, zamówienie, rysunki i kontrole liczą mocowanie każdej półki osobno (`sh.mount`, `mocPolki`). Klapa na granicy na kołkach — ostrzeżenie z „Półka N na konfirmatach” (tylko ta) i „Półki kolumny N na konfirmatach” (wszystkie, także granice).
- **Półka przelotowa**: konfirmaty przez boki w osi półki. Przegrody i wsporniki stoją na płycie pod sobą, konfirmat przez nią w ich czoło.
- **Płyta półek**: z płyty korpusu albo osobnej („Półki z tej samej płyty co korpus”).

## Co ustawiasz ręcznie

- **Wymiary**: wysokość poziomu (× — wróć do równego podziału) i szerokość kolumny („auto”).
- **Kolumna**: rodzaj (Półki i drzwi / Szuflady / Blenda), liczba półek i wysokość każdego światła.
- **Zamiana półek**:
  - „→ poziom” — przy jednej kolumnie półka staje się półką przelotową (nowy poziom); **przy kilku kolumnach dzieli tylko tę kolumnę** (2026-10-24): półka zostaje półką tej kolumny (`col.podzial`; granica domyślnie na konfirmatach, zwykłe półki na kołkach — zob. „Mocowanie półek”; klapa na granicy przestawionej na kołki — ostrzeżenie z „Półka N na konfirmatach” / „Półki kolumny N na konfirmatach”), a front dzieli się na niej — każdy odcinek ma swoje drzwi albo klapę, inne kolumny bez zmian; w Strukturze „granica frontów” z „scal”; **każdy poziom kolumny ma własne ustawienia frontu** (`col.segmenty[nr]` nad ustawieniami kolumny): liczba frontów, skrzydło / klapa, do góry / w dół, podnośniki, siła, kąt, zawiasy, uchwyt, lustro — kolumna pokazuje „fronty N w M poziomach kolumny”; **półki ustawia się w każdym poziomie kolumny** (pole „półki” przy „fronty”) — granice zostają na miejscu: światła innych poziomów dostają obecne wymiary na stałe, światła tego poziomu idą na auto (`ustawPolkiPoziomuKolumny`), rura przesuwa się razem ze swoim światłem; „scal” zostawia ustawienia dolnego odcinka — także przy ostatniej granicy, wtedy przechodzą na kolumnę (audyt GPT N86: wcześniej kolumna wracała do swoich ustawień — znikał tip-on, wracał uchwyt i zawias z lewej); gdy poziomy mają różne wnętrze (szuflady / blenda / drzwi z półkami), „scal” i „×” przy półce granicznej pytają, który zostaje (okno „Zostaw dolny / Zostaw górny / Anuluj”, użytkownik 2026-10-28) — szuflady i blenda zajmują wtedy cały scalony poziom i zabierają jego półki (także granicę); nowa granica kopiuje ustawienia dzielonego; można też obok kolumny szuflad; rura na wieszaki zostaje tylko w swoim poziomie; **każdy poziom kolumny ma pełną strukturę jak kolumna** (2026-10-24: „kolumna jak odrębna szafka”, żeby nie robić osobnych szafek i ich nie scalać): w karcie „poziom N kolumny M” (tak też w Uwagach: „Poziom 1, poziom 4 kolumny 2”, 2026-10-25) wybór „Półki i drzwi / Szuflady / Blenda” (`col.segmenty[nr].kind`). Szuflady w poziomie kolumny liczą się jak kolumna szuflad (ta sama funkcja `szufladyKolumny` w `computeGeo`), tylko w paśmie poziomu: najniższa prowadnica na półce granicznej pod nim (albo na dnie), skrzynka i podfrez kończą się pod półką nad nim, front nakładany zachodzi na półkę graniczną jak na przegrodę (szczelina na środku); w karcie: montaż frontów, podfrez, NL, „+ szuflada”, „dopasuj fronty” i wiersze szuflad jak w kolumnie (adres w przyciskach `<kolumna>s<nr>`, `kolumnaW`). Blenda — jeden front na pasmo poziomu (na korpusie albo w obrysie). Przejście na szuflady albo blendę zdejmuje półki z tego poziomu (granice zostają); półka w środku takiego poziomu — błąd z „Usuń półki z tego poziomu”;
  - „klapy zamiast drzwi…” — kreator: ile klap i na których półkach granice, otwieranie, front, podnośniki (`opisy/klapy.md`); przy jednej kolumnie granice → poziomy, przy kilku — granice frontów tylko w tej kolumnie (zawiasy i podnośnik w półce stałej).
- **Rura na wieszaki** (użytkownik 2026-10-24): w kolumnie z drzwiami albo otwartej, przy świetle od 800 mm — „rura na wieszaki: światło N (… mm)”. Okrągła ⌀25 na 2 rozetach, oś 70 mm pod płytą nad światłem (wygodnie zawiesić wieszak), w połowie głębokości wnętrza, długość = światło kolumny − 2 mm (`DRAZEK_*`, `col.drazki`).
- **Mocowanie i kołki**: mocowanie półek, a przy przegrodzie „dół na trójkątach”; „Otwór od przodu / od tyłu” kołków półek.
- **Plecy kolumny**: jak szafka / HDF / płyta / brak.

## Kontrole i przyciski

- **Światło zero lub ujemne** (2026-10-24): pole nie przyjmuje takiej wartości (wraca do auto, strzałką nie zejdzie poniżej 1); stary zapis daje błąd „światło N ma … mm — musi być większe od zera” z „Wróć do auto”.
- **Rura na wieszaki**:
  - światło, pod którym zmieści się ≥ 1000 mm — podpowiedź „zmieści się rura na wieszaki (pod nią N mm: koszule[, płaszcze i sukienki od 1600])” z „Dodaj rurę na wieszaki”;
  - po usunięciu półki (×) rury nad nią zostają na swoich miejscach (numery świateł schodzą o jeden), rura spod usuniętej półki wisi pod następną płytą (audyt GPT N104);
  - pod rurą mniej niż 1000 mm — ostrzeżenie (koszule ok. 1000, płaszcze ok. 1600 — poradniki) z „Usuń rurę” i „Przenieś do światła N” (najwyższe światło bez rury, pod którym zmieszczą się koszule; gdy takiego nie ma — najwyższe od 800 mm); gdy wystarczy przesunąć półkę, to samo ostrzeżenie mówi o ile i ma „Półka nad rurą wyżej o N mm” / „Półka pod rurą niżej o N mm” — kosztem sąsiedniego światła (zostaje co najmniej 50 mm, bez rury), nie przy półce będącej granicą poziomu kolumny ani przy dnie / wieńcu; niska rura bywa świadoma — wtedy ostrzeżenie się odhacza (użytkownik 2026-10-29); światło z rurą zostaje w Strukturze, nawet gdy zmalało poniżej 800 mm (2026-10-24);
  - wnętrze płytsze niż 500 mm — ostrzeżenie „wieszaki tylko pod skosem”; płytsze niż 400 — błąd z „Usuń rurę” (użytkownik: 43 cm wystarcza, wieszaki pod skosem);
  - rura dłuższa niż 3 m (najdłuższy odcinek w sprzedaży, `RURA_ODCINKI`) — błąd z „Podziel kolumnę przegrodą” i „Usuń rurę”; dłuższa niż 2 m (`DRAZEK_UGINA`) — ostrzeżenie „ugina się pod ubraniami” z „Podziel kolumnę przegrodą” (użytkownik 2026-10-30, audyt GPT N153: plan zakupu składał 3062 z 3 m + 0,5 m). Podział: dwie równe kolumny z przegrodą, obie z tym samym wnętrzem (półki, rura — każda o połowę krótsza), drzwi po połowie, pojedyncze — każda swoje (`kolumnaNaDwie`);
  - rura w poziomie kolumny z szufladami albo blendą — błąd „rura przecina skrzynki” / „za blendą rura nie ma sensu” z „Przenieś do światła N” (do poziomu z drzwiami) i „Usuń rurę” (audyt GPT N89); rura zostaje w danych, dopóki się jej nie przeniesie albo usunie — także po powrocie poziomu na „Półki i drzwi”; podpowiedź „zmieści się rura” i „Przenieś do” wskazują tylko światła poziomów z drzwiami.
- **Poziomy**:
  - nie wypełniają wnętrza albo je przekraczają — błąd z „Górny poziom na auto” / „Podziel poziomy równo”;
  - poziom niższy niż 60 mm — ostrzeżenie; ujemny — błąd.
- **Kolumny**:
  - nie wypełniają szerokości albo ją przekraczają — błąd z „Rozłóż kolumny automatycznie”;
  - szerokość zero lub mniej — błąd z tym samym przyciskiem;
  - kolumna węższa niż 200 mm — ostrzeżenie (nie dotyczy blendy).
- **Światła**:
  - wpisane nie zgadzają się z kolumną — błąd;
  - światło niższe niż 50 mm — ostrzeżenie.
- **Głębokość półki** zero lub mniej — błąd.
- **Kołki półek** nie mieszczą się na najpłytszej półce — błąd z „Ustaw 50 / 50 mm” (domyślnie kołki 50 mm od krawędzi, jak trójkąty).
- **Szczelina nad przegrodą** (fronty nakładane):
  - poniżej 2 mm — błąd;
  - powyżej 5 mm — ostrzeżenie z przyciskami zmiany nałożenia.
- **Konfirmaty z obu stron jednej płyty w tej samej osi** (półki naprzeciw przy przegrodzie, przegrody nad i pod półką przelotową) — błąd z wyborem mocowania drugiej strony: kołki albo trójkąty.
- **Kolumna otwarta od góry** (bez wieńca i wzmocnienia) — ostrzeżenie z „Dodaj parę wzmocnień pod blat”.

## Skąd liczby

- **Progi robocze**: minimum 100 mm (nowy poziom), 200 mm (kolumna), 50 / 60 mm (światło / poziom).
- **Mocowanie**: kołki, konfirmaty i trójkąty to decyzja użytkownika 2026-09-29; mocowanie kolumny — 2026-10-17 (audyt GPT N45).
- **Cofnięcie półki** przy frontach wpuszczanych: grubość frontu + 5 mm.

## Gdzie w kodzie i testy

- **Obliczenia**: `computeGeo` — `distribute` poziomów, kolumn i świateł; `levels`, `sepShelves`, `dividers`, `shelfDepth`, `mocowanieKolumny`; `utrzymajPodBlat`.
- **Interfejs**: `addLevel`, `removeLevel`, `setLevelH`, `addCol`, `removeCol`, `setColW`, `setColKind`, `polkiNaPoziomy`, `zwolnijMiejsce`.
- **Przyciski**: `levauto`, `fixcolauto:`, `fixdiv:`, `kolki:`, `polkimont:`, `przegrtr:`, `parablat:`.
- **Testy**: `leveltest`, `polki`, `polkigr`, `przegroda`, `podzial`, `pins2`, `pins3`, `komentarze1`, `audytszuflad` (usuwanie poziomów i kolumn).
