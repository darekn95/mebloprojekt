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

### Pomysły

- **Lakierowanie formatek** (użytkownik 2026-11-22, „na przyszłość, nie na dzisiaj”): opcja lakierowania frontów, korpusów i półek —
  do przemyślenia (które formatki, z obu stron czy z jednej, krawędzie, cena za m², osobna pozycja w zamówieniu / wycenie).

- ~~**Plecy HDF za duże na arkusz**~~ — zrobione 2026-11-22: przycisk „Plecy z kawałków” (kawałki na kolumnę i poziom, łączenia na
  przegrodach i półkach). Do rozważenia: mniej kawałków (łączyć tylko tam, gdzie trzeba), „bez pleców” w zabudowie przy ścianie.
- **Osobne ciągi w jednym pokoju** (np. szafa przy jednej ścianie, regał przy drugiej) — w widoku „Zabudowa” 3D stoją w tym samym
  miejscu i nachodzą na siebie (audyt pokoju), bo pokój nie ma układu ścian. Pomysł: ściany pokoju (A–D z długościami) i ciągi
  przypisane do ścian; na razie choćby rozstawić osobne ciągi obok siebie z odstępem.
- **Regał / szafa z palety „Szafa w zabudowie” przy zaznaczonej szafce wolnostojącej** zakłada nowy ciąg („Ściana 2”), zamiast dołożyć
  się do istniejącej zabudowy w pokoju — do rozważenia: dokładać do ostatniego ciągu „szafa” w pokoju.
- ~~**Wzory bez uwag od razu po wstawieniu**~~ — zrobione 2026-11-22 (`wzorBezUwag`: półki poza zawiasami, luz frontów szuflad).
  Zostaje „Narożnik L” (dół 896 / góra 646 mm — jedne drzwi poza tabelą zawiasów GTV; jest przycisk „Dwoje drzwi”) — do decyzji.
- **Szafa na zawiasach w wysokim pokoju** (1200 × 2761, 4 półki): fronty 2755 mm są poza tabelą zawiasów GTV (do 2500 mm) —
  jest ostrzeżenie, a 3 z 5 zawiasów na skrzydło przesuwa się przez półki (6 ostrzeżeń „zawias przesunięty”). Pomysł: przycisk
  „Półki poza zawiasami” (przesuwa półki o kilka centymetrów zamiast zawiasów); do sprawdzenia w katalogu — prostownik do wysokich
  drzwi (fronty z płyty powyżej ok. 2,2 m lubią się wyginać).
- **Szuflady V-BOX w jednej kolumnie z różnymi bokami** (127 i 178 — „auto” dobiera osobno dla każdej szuflady): jeden bok dla całej
  kolumny wygląda równo i to jedna pozycja w zamówieniu.
- ~~**Start nowego projektu**~~ (zrobione 2026-11-22 — okno „Nowy projekt — co projektujesz?”): otwierał się tryb Techniczny z jedną szafką 600 × 720 poza ciągiem. Pomysł: na start pytanie „Co
  projektujesz?” (kuchnia / szafa w zabudowie / pokój) z szerokością i wysokością ściany — od razu makieta z właściwą paletą
  i znanym sufitem (wtedy działają kontrole sufitu).
- **Uwaga o odpadzie rozkroju** („Arkusz N wykorzystany tylko w X %”) powtarza się przy każdej szafce — wystarczy raz, w projekcie.
- **Tor dłuższy niż 6000 mm** (ściana 6,5 m): zamówienie bierze 2 tory, ale bez informacji, gdzie i jak je łączyć.
