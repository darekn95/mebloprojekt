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

### Do decyzji (pytania zadane 2026-11-21)

1. **Zabudowa przesuwna na całą ścianę szerszą niż płyta (ponad 2761 mm).** Dno, wieniec, cokół i plecy jednej szafy nie mieszczą się
   na arkuszu — program to zgłasza, ale nie mówi, jak to zrobić. Możliwości: (a) przycisk „Podziel na dwie szafy” — każda z własnymi
   drzwiami przesuwnymi; (b) kilka korpusów obok siebie i jeden komplet drzwi na całą ścianę (tor do 6000 mm); (c) dno i wieniec
   z dwóch kawałków łączonych na przegrodzie.
2. **Wysoki pokój (sufit ponad ok. 2770 mm).** Szafa sięga najwyżej 2761 mm (bok z arkusza); nad nią: (a) blenda do sufitu
   (maskownica, jak nad szafkami górnymi); (b) nadstawka — osobny korpus z drzwiami na zawiasach albo klapą (np. jak ciąg górny nad
   szafą); (c) oba do wyboru przyciskiem.
3. **Słupek z palety w kuchni 550 mm** ma 600 mm głębokości: blat wychodzi 650 mm (za dużo na arkusz 600) i są dwie uwagi
   z przyciskami. Czy słupek ze wzoru brać głęboki jak ciąg, czy zostawić 600 i od razu ustawić „tył przy ścianie”.
4. **Kolumny pod skrzydłami w szafie przesuwnej.** Wzór ma zawsze przegrodę na środku; przy 3 skrzydłach (szafa 2400–3000)
   każda kolumna wypada pod dwoma skrzydłami — jest tylko informacja. Możliwości: przycisk „Przegrody na stykach skrzydeł”
   albo wzór dzielący na tyle kolumn, ile skrzydeł.

### Pomysły

- **Plecy HDF za duże na arkusz** (szafa 2400 × 2500 → plecy 2398 × 2398): dziś tylko błąd. Rada z przyciskiem: plecy z dwóch kawałków
  łączonych na przegrodzie / półce (listwa łącząca) albo bez pleców w zabudowie przy ścianie.
- **Osobne ciągi w jednym pokoju** (np. szafa przy jednej ścianie, regał przy drugiej) — w widoku „Zabudowa” 3D stoją w tym samym
  miejscu i nachodzą na siebie (audyt pokoju), bo pokój nie ma układu ścian. Pomysł: ściany pokoju (A–D z długościami) i ciągi
  przypisane do ścian; na razie choćby rozstawić osobne ciągi obok siebie z odstępem.
- **Regał / szafa z palety „Szafa w zabudowie” przy zaznaczonej szafce wolnostojącej** zakłada nowy ciąg („Ściana 2”), zamiast dołożyć
  się do istniejącej zabudowy w pokoju — do rozważenia: dokładać do ostatniego ciągu „szafa” w pokoju.
- **Wzory bez uwag od razu po wstawieniu:** „Szafa” wolnostojąca i „Szafa, 1 drzwi” — zawias przesunięty, bo koliduje z półką
  (ostrzeżenie); „Dolna z szufladami” — fronty różnią się o 1 mm (przycisk „Zwiększ luz do 3 mm”). Wzór mógłby od razu ustawić półki
  poza zawiasami i luz, przy którym fronty są równe.
- **Szuflady V-BOX w jednej kolumnie z różnymi bokami** (127 i 178 — „auto” dobiera osobno dla każdej szuflady): jeden bok dla całej
  kolumny wygląda równo i to jedna pozycja w zamówieniu.
- **Start nowego projektu**: otwiera się tryb Techniczny z jedną szafką 600 × 720 poza ciągiem. Pomysł: na start pytanie „Co
  projektujesz?” (kuchnia / szafa w zabudowie / pokój) z szerokością i wysokością ściany — od razu makieta z właściwą paletą
  i znanym sufitem (wtedy działają kontrole sufitu).
- **Uwaga o odpadzie rozkroju** („Arkusz N wykorzystany tylko w X %”) powtarza się przy każdej szafce — wystarczy raz, w projekcie.
- **Tor dłuższy niż 6000 mm** (ściana 6,5 m): zamówienie bierze 2 tory, ale bez informacji, gdzie i jak je łączyć.
