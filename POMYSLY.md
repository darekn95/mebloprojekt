# Pomysły do rozwinięcia i sprawy z analiz

Lista rzeczy, które program robi poprawnie, ale mógłby lepiej, oraz braków znalezionych przy analizach całych projektów.
Błędy naprawione i sprawy do decyzji — `BLEDY.md`. Przy wdrożeniu punktu: przenieś go do `BLEDY.md` (naprawione) albo skreśl tu.

## Pełna analiza 2026-11-21 (prośba użytkownika: „od rozpoczęcia nowego projektu przez kuchnię, salon, pokój dziecka, szafy na
zawiasach i zabudowy przesuwne na całą ścianę; wysokie pomieszczenia — ogranicza nas płyta”)

Scenariusze (projekty w scratchpadzie, nie w repozytorium) przepuszczone przez `testy/audytprojektu.mjs`: kuchnia ze wzorów makiety
(dolne, szuflady, zlewowa, słupek, 3 wiszące), salon (RTV, komoda, regał, szafa wolnostojąca), pokój dziecka (biurko z kontenerem,
biurko, szafa 2 drzwi, szafka nocna, regały), szafy na zawiasach w ciągu (2 × 2 drzwi, 1 drzwi, z szufladami), zabudowa przesuwna
2000 × 2500, 3000 × 2600, 3600 × 2700 (z szufladami), 4500 × 2600, 6500 × 2500, 2400 × 2900 i 2400 × 3000.
Wynik: kuchnia, salon, szafy na zawiasach — bez błędów, nic nie nachodzi, formatki = bryła, szuflady się wysuwają.

### Decyzje (odpowiedzi użytkownika 2026-11-21)

1. **Zabudowa przesuwna na całą ścianę szerszą niż płyta (ponad 2761 mm)** — dno, wieniec, cokół i plecy jednej szafy nie mieszczą się
   na arkuszu. Decyzja: **obie drogi** — (a) kilka korpusów obok siebie i jeden komplet drzwi przesuwnych na całą ścianę (tor do 6000 mm);
   (b) jedna szafa z dnem i wieńcem z dwóch kawałków łączonych na przegrodzie. Do zrobienia; przed robotą pytania o szczegóły
   (styk modułów: podwójne boki czy jedna wspólna przegroda; czym łączyć kawałki dna i wieńca; tory na modułach czy na suficie).
   **Zrobione 2026-11-22 (b)**: przycisk „Dno i wieniec z kawałków — dwie przegrody na styku” (decyzja: podwójna przegroda; jedna
   przegroda z konfirmatami z obu stron odpada — drugiej strony nie dokręcisz). Zostaje (a) moduły z jednym kompletem drzwi.
   **Odpowiedzi 2026-11-22:**
   - moduły — **do wyboru**: pełne korpusy skręcone bokami (dwa boki na styku) albo wspólna przegroda; przy wspólnej przegrodzie dno
     raczej wewnątrz (między bokiem a przegrodą), a wieniec też wewnątrz albo „na pół” na przegrodzie (9 mm);
   - jedna szafa z dnem / wieńcem z dwóch kawałków — dno raczej wewnątrz, gdy przegroda pojedyncza (przegroda do dna, kawałki dna między
     nią a bokami); wieniec może wejść „na pół płyty” na przegrodę styku, o ile ten kawałek ma wcześniej (poza bokiem) jeszcze jedną
     przegrodę, do której jest przykręcony; jeśli nie ma — program sugeruje wieniec wewnątrz boków albo podwójną przegrodę na styku.
2. **Wysoki pokój (sufit ponad ok. 2770 mm)** — szafa najwyżej 2761 mm (zrobione: uwaga i przycisk „Wysokość szafy N mm”). Nad szafą
   decyzja: **do wyboru** — blenda do sufitu albo nadstawka (osobny korpus na szafie). **Odpowiedź 2026-11-22:** nadstawka domyślnie
   z drzwiami na zawiasach. **Zrobione 2026-11-22** (przyciski „Blenda do sufitu” / „Nadstawka do sufitu”; łączenie z szafą — wkręty
   od środka przez dno do wieńca, do potwierdzenia przez użytkownika).
3. **Słupek z palety w kuchni** — zrobione 2026-11-21: „słupek nie ma blatu” — tył przy ścianie, drzwi równo z blatem, blat reszty bez zmian.
4. **Kolumny pod skrzydłami w szafie przesuwnej** — zrobione 2026-11-21: przycisk „Przegrody na stykach skrzydeł” (tyle kolumn, ile
   skrzydeł), dodatkowe przegrody pomiędzy wolno, kolumna pod dwoma skrzydłami — ostrzeżenie (było: informacja).
   Do rozważenia: samo przestawianie przegród przy zmianie szerokości (dziś po zmianie jest ostrzeżenie z przyciskiem).

### Szuflady Blum — co znalazłem (2026-11-22, #45; użytkownik: „poszukaj sam”, wdrożenie później — „nowe typy szuflad na później”)

**2026-11-23** (użytkownik: „push to open i tandem z bluma trzeba wyszukać i dodać do listy prowadnic … vbox i dxs też są chyba w wersjach na
cichy domyk i push to open”): instrukcje Blum pobrane do `instrukcje/blum/` (TANDEMBOX antaro — zamawianie i planowanie, TANDEM, TANDEM
z TIP-ON; opis w `instrukcje/SPIS.md`). Wersje PUSH obecnych systemów Sevroll były już w katalogu w `instrukcje/` i **są w programie**
(V-BOX PUSH II, DXP-3D PUSH — wybór przy szufladzie). Blum — do wdrożenia jako osobne systemy (formatki skrzynki, NL, wiercenia, rysunki,
audyt szuflad); kolejność i ceny do ustalenia z użytkownikiem.

Do pobrania i dopisania do `instrukcje/` (karty z katalogu Blum 2024–2025), zanim wejdą do programu:
- **TANDEMBOX antaro** (skrzynka ze stalowymi bokami, jak V-BOX): wymiary z dna i tyłu z płyty 16 mm od światła szafki LW —
  tył z płyty LW − 87, dno LW − 75 × (NL − 24), tył stalowy NL − 22; wysokość tyłu zależy od wysokości skrzynki (np. 199 mm przy D,
  135 mm w starszym wydaniu) — sprawdzić tabelę „Cutting dimensions for 16 mm chipboard” dla każdej wysokości.
  Źródła: [katalog Blum 2024–2025, s. 313–315](https://publications.blum.com/2024/catalogue/en/313/),
  [TANDEMBOX antaro — program](https://www.blum.com/eu/en/products/boxsystems/tandembox/tandembox-antaro/programme/).
- **TANDEM** (prowadnice pod dnem szuflady drewnianej, 550H / 560H / 563H): wnętrze szuflady = światło szafki − 42 mm (tolerancja
  0 … +1,5), bok szuflady najwyżej 16 mm, wysokość szuflady najwyżej światło − 20 mm; dno wpuszczone we wręg / podcięte pod
  prowadnicę — szczegóły i wiercenia w karcie modelu. Źródła: [katalog Blum 2022, s. 261–277](https://publications.blum.com/2022/catalogue/en/265/),
  [Blum TANDEM plus 563H — specyfikacja (PDF)](https://cdn.shopify.com/s/files/1/0709/8495/8225/files/Blum-Tandem-Plus-563H-Specs.pdf).
- Przy wdrożeniu: osobny `systemSzuflady` (jak V-BOX / szuflady drewniane), formatki skrzynki z powyższych wzorów, NL z listy
  prowadnic, kontrola wysuwu (audyt szuflad) i ceny.

### Pomysły

- **Propozycje z przeglądu 2026-11-24** (do wyboru przez użytkownika):
  - ~~szafka w L — ramię także w 3D pojedynczej szafki~~ — zrobione 2026-11-26 (`brylyRamienia3D`);
  - Blum AVENTOS (podnośniki klap: HK-XS, HK top, HF, HL, HS) jako alternatywa dla GTV — katalog w `instrukcje/blum/katalog-2027-2028/02_…`;
  - kolejne systemy szuflad z katalogu Blum: LEGRABOX (boki stalowe proste), MERIVOBOX — jak TANDEMBOX (tabele z katalogu);
  - eksport listy formatek do pliku dla piły / hurtowni (CSV: nazwa, wymiary, okleina, usłojenie, płyta) — mniej przepisywania przy zamawianiu cięcia;
    **na liście następnych zadań** (użytkownik 2026-11-26: „eksport też musimy dodać na listę następnych zadań, ale to później” — po lakierowaniu);
  - kosztorys z robocizną i marżą (dziś: materiały i okucia), osobno dla klienta;
  - wcześniej ustalone na później: szafa z modułów z jednym kompletem drzwi, lakierowanie formatek, szafka narożna skośna, wizualizacja pokoju.

- **Wizualizacja projektu (kierunek, #46 — użytkownik 2026-11-24)**: zamiast sztywnych ścian A–D — osobny kafelek „Wizualizacja” albo
  dodatkowy widok na bieżącym rysunku, gdy meble są już zaprojektowane. Pokój z **dowolną liczbą ścian** (nie zawsze 4), na ściany nanosi
  się zabudowy (ciągi), a do tego **drzwi, okna, podejścia wody, otwory wentylacyjne, zabudowę WC** — „prawdziwa wizualizacja projektu
  meblowego, ale uproszczona”. Do przemyślenia: osobny rysunek czy warstwa na obecnym; jak przypisać ciąg do ściany (odległość od rogu);
  kontrole (szafka na oknie, zawór za szafką, wentylacja zasłonięta). Na razie (24.11): osobne ciągi w pokoju stoją obok siebie, nie
  nachodzą (`runLayout`).

- ~~**Lakierowanie formatek**~~ — zrobione 2026-11-26 (przy każdej szafce: fronty / opaski / cokół / korpus / półki z MDF lakierowanego, poza
  rozkrojem, lista „Do lakierni”, 400 zł/m² formatki z płytą; `opisy/formatki.md`). Do ewentualnej decyzji: czy niewidoczne elementy
  (wzmocnienia, skrzynki szuflad) przy lakierowanym korpusie też z MDF — dziś z płyty.

- ~~**Plecy HDF za duże na arkusz**~~ — zrobione 2026-11-22: przycisk „Plecy z kawałków” (kawałki na kolumnę i poziom, łączenia na
  przegrodach i półkach). Do rozważenia: mniej kawałków (łączyć tylko tam, gdzie trzeba), „bez pleców” w zabudowie przy ścianie.
- **Osobne ciągi w jednym pokoju** — 2026-11-24 krok pośredni: stoją obok siebie z odstępem, każdy na swojej ścianie (już nie nachodzą); pełny układ ścian (#46) — do ustalenia z użytkownikiem. (np. szafa przy jednej ścianie, regał przy drugiej) — w widoku „Zabudowa” 3D stoją w tym samym
  miejscu i nachodzą na siebie (audyt pokoju), bo pokój nie ma układu ścian. Pomysł: ściany pokoju (A–D z długościami) i ciągi
  przypisane do ścian; na razie choćby rozstawić osobne ciągi obok siebie z odstępem.
- ~~**Regał / szafa z palety „Szafa w zabudowie” przy zaznaczonej szafce wolnostojącej**~~ — zrobione 2026-11-24 (na koniec ciągu tego rodzaju w pokoju). Dawny opis: zakłada nowy ciąg („Ściana 2”), zamiast dołożyć
  się do istniejącej zabudowy w pokoju — do rozważenia: dokładać do ostatniego ciągu „szafa” w pokoju.
- ~~**Wzory bez uwag od razu po wstawieniu**~~ — zrobione 2026-11-22 (`wzorBezUwag`: półki poza zawiasami, luz frontów szuflad).
  „Narożnik L” — sprawdzone 2026-11-26: w rogu drzwi korpusu mają 285 mm (dół) i 2 zawiasy; 896 / 646 wychodziło z liczenia bez kontekstu rogu
  (makieta i ta kontrola) — w szafce takich drzwi nie ma. Zostaje tylko ostrzeżenie „zawias 614 → 600” przez stojące wzmocnienie czołowe.
- **Szafa na zawiasach w wysokim pokoju** — 2026-11-24: przycisk „Półki poza zawiasami” i 6 zawiasów ponad 2500 mm (decyzja użytkownika); prostownica — nie. Dawny opis: (1200 × 2761, 4 półki): fronty 2755 mm są poza tabelą zawiasów GTV (do 2500 mm) —
  jest ostrzeżenie, a 3 z 5 zawiasów na skrzydło przesuwa się przez półki (6 ostrzeżeń „zawias przesunięty”). Pomysł: przycisk
  „Półki poza zawiasami” (przesuwa półki o kilka centymetrów zamiast zawiasów); do sprawdzenia w katalogu — prostownik do wysokich
  drzwi (fronty z płyty powyżej ok. 2,2 m lubią się wyginać).
- ~~**Szuflady V-BOX w jednej kolumnie z różnymi bokami**~~ — **nie robimy** (użytkownik 2026-11-24: „nie zawsze tak musi być, to raczej są rzadkie przypadki”; „auto” zostaje osobno dla każdej szuflady). Dawny opis: (127 i 178 — „auto” dobiera osobno dla każdej szuflady): jeden bok dla całej
  kolumny wygląda równo i to jedna pozycja w zamówieniu.
- ~~**Start nowego projektu**~~ (zrobione 2026-11-22 — okno „Nowy projekt — co projektujesz?”): otwierał się tryb Techniczny z jedną szafką 600 × 720 poza ciągiem. Pomysł: na start pytanie „Co
  projektujesz?” (kuchnia / szafa w zabudowie / pokój) z szerokością i wysokością ściany — od razu makieta z właściwą paletą
  i znanym sufitem (wtedy działają kontrole sufitu).
- ~~**Uwaga o odpadzie rozkroju**~~ — zrobione 2026-11-24 (blok „Cały projekt — rozkrój płyt” w Uwagach). Dawny opis: („Arkusz N wykorzystany tylko w X %”) powtarza się przy każdej szafce — wystarczy raz, w projekcie.
- ~~**Tor dłuższy niż 6000 mm**~~ — decyzja użytkownika 2026-11-24: „max 6 m i koniec, i następna szafa” — błąd z „Podziel na dwie szafy”. Dawny opis: (ściana 6,5 m) zamówienie bierze 2 tory, ale bez informacji, gdzie i jak je łączyć.
