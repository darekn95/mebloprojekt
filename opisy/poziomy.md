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
- **Mocowanie półek** (cała szafka albo kolumna): kołki podporowe ⌀5 (domyślnie), konfirmaty albo trójkąty meblowe — po dwa na stronę, przy przedniej i tylnej krawędzi.
- **Półka przelotowa**: konfirmaty przez boki w osi półki. Przegrody i wsporniki stoją na płycie pod sobą, konfirmat przez nią w ich czoło.
- **Płyta półek**: z płyty korpusu albo osobnej („Półki z tej samej płyty co korpus”).

## Co ustawiasz ręcznie

- **Wymiary**: wysokość poziomu (× — wróć do równego podziału) i szerokość kolumny („auto”).
- **Kolumna**: rodzaj (Półki i drzwi / Szuflady / Blenda), liczba półek i wysokość każdego światła.
- **Zamiana półek**:
  - „→ poziom” — półka staje się półką przelotową;
  - „klapy zamiast drzwi…” — kreator: ile klap i na których półkach granice (te półki → poziomy), otwieranie, front, podnośniki (tylko poziom z jedną kolumną; `opisy/klapy.md`).
- **Rura na wieszaki** (użytkownik 2026-10-24): w kolumnie z drzwiami albo otwartej, przy świetle od 800 mm — „rura na wieszaki: światło N (… mm)”. Okrągła ⌀25 na 2 rozetach, oś 70 mm pod płytą nad światłem (wygodnie zawiesić wieszak), w połowie głębokości wnętrza, długość = światło kolumny − 2 mm (`DRAZEK_*`, `col.drazki`).
- **Mocowanie i kołki**: mocowanie półek, a przy przegrodzie „dół na trójkątach”; „Otwór od przodu / od tyłu” kołków półek.
- **Plecy kolumny**: jak szafka / HDF / płyta / brak.

## Kontrole i przyciski

- **Rura na wieszaki**:
  - światło, pod którym zmieści się ≥ 1000 mm — podpowiedź „zmieści się rura na wieszaki (pod nią N mm: koszule[, płaszcze i sukienki od 1600])” z „Dodaj rurę na wieszaki”;
  - pod rurą mniej niż 1000 mm — ostrzeżenie (koszule ok. 1000, płaszcze ok. 1600 — poradniki);
  - wnętrze płytsze niż 500 mm — ostrzeżenie „wieszaki tylko pod skosem”; płytsze niż 400 — błąd z „Usuń rurę” (użytkownik: 43 cm wystarcza, wieszaki pod skosem).
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
