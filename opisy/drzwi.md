# Drzwi i zawiasy

Kolumna „Półki i drzwi” w „Strukturze wnętrza”. W kolumnie może być 0, 1, 2 albo
więcej drzwi (skrzydeł); przy jednych można zamiast skrzydła dać klapę (`opisy/klapy.md`).

## Co program liczy sam

- **Szerokość drzwi**: pasmo kolumny dzielone równo; szerokość wpisana ręcznie zostaje, reszta dzieli się na pozostałe skrzydła.
- **Luzy** (karta „Luzy drzwi”, cała szafka):
  - od krawędzi korpusu 2 mm;
  - między drzwiami 2 mm (musi być parzysty, bo dzieli się na dwa fronty);
  - u góry i u dołu 3 mm;
  - dookoła frontu wpuszczanego 2 mm;
  - nałożenie na przegrodę 7 mm z każdej strony.
- **Liczba zawiasów** (tabela GTV, `ZAWIASY_GTV`): większa z dwóch liczb.
  - Z wysokości frontu: 2 do 750 mm, 3 do 1500, 4 do 2100, 5 do 2500.
  - Z wagi frontu: 2 do 6 kg, 3 do 12, 4 do 17, 5 do 20 kg.
  - Tabela obowiązuje dla frontu do 600 mm szerokości. Szafka narożna ze skrzydłami łamanymi ma ostrzejszą tabelę (do 450 mm, do 15 kg).
  - Waga: płyta frontu 680 kg/m³ plus lustro (szkło 2500 kg/m³).
- **Rozstaw zawiasów**: środek 100 mm od górnej i dolnej krawędzi frontu, reszta równo.
  - Gdy przy 100 mm zawiasy wypadłyby bliżej niż ich wysokość (55 mm) — przy dwóch zawiasach front niższy niż ok. 255 mm — rozkładają się na całą wysokość frontu (środek 27,5 mm od krawędzi).
  - Zawias, który trafia na półkę albo wzmocnienie przy licu, jest przesuwany nad nią lub pod nią z luzem 30 mm.
  - Przesunięte zawiasy idą do notatki montażowej w PDF.
- **Strona zawiasów** przy jednych drzwiach, po kolei:
  1. ustawiona przy kolumnie („zawias”);
  2. ustawiona dla całej szafki;
  3. po stronie przeciwnej do elementu stałego (fix);
  4. w szafce w L — z dala od ramienia;
  5. w pozostałych przypadkach lewa.
  - Przy dwojgu i więcej drzwi: lewa połowa skrzydeł na lewym boku, prawa na prawym.
- **Zawias siedzi** na boku, przegrodzie albo wsporniku pionowym przy elemencie stałym.
- **Typ zawiasu w zamówieniu**:
  - nakładany albo wpuszczany — wg ustawienia frontów szafki;
  - półnakładany (bliźniaczy) — dwa fronty na jednej płycie: przegroda między kolumnami albo półka pod klapą;
  - szafka narożna ze skrzydłami łamanymi: 165° na boku i łamany 90° (po 15 zł).

## Co ustawiasz ręcznie

- **W kolumnie**: liczba drzwi, liczba półek, szerokość każdego skrzydła.
- **Przy skrzydle**: liczba zawiasów, uchwyt (wystawanie, na boku / na górze), lustro.
- **Strona zawiasów**: przy kolumnie z jednymi drzwiami albo dla całej szafki.
- **Luzy i kąt otwarcia** (domyślnie 90°) w karcie „Luzy drzwi”; luz między drzwiami może też mieć sama kolumna.
- **Element stały (fix)** zamiast części frontu:
  - z lewej, z prawej albo u góry, o szerokości w mm;
  - na korpusie albo wpuszczany;
  - opcjonalnie z wspornikiem pionowym (głębokość w mm), na którym wiszą zawiasy albo prowadnica.
- **Blenda**: kolumna-wypełnienie bez drzwi, na korpusie albo wpuszczana.

## Kontrole i przyciski

- **Liczba zawiasów**:
  - wpisana inaczej niż tabela GTV — ostrzeżenie „za dużo / za mało zawiasów wg tabeli GTV” z „Ustaw N zawiasy”;
  - front poza tabelą (szerszy, wyższy, cięższy) — ostrzeżenie „liczba orientacyjna”.
- **Zawiasy nie mieszczą się** między półkami (po ominięciu wypadają w jednym miejscu) — błąd.
- **Zawias na przeszkodzie** (rura, wycięcie bliżej lica niż 80 mm zabudowy zawiasu; przy wpuszczanych + grubość frontu) — błąd; przy jednych drzwiach z „Przełóż zawiasy na drugą stronę”.
- **Zawiasy od strony przelotu** (brak płyty, np. przejście do ramienia szafki w L) — błąd z „Przełóż zawiasy”.
- **Zawias na elemencie stałym bez wspornika** — błąd z „Dobuduj wspornik pionowy” / „bez drzwi”.
- **Dwoje wąskich drzwi** (każde poniżej 250 mm, a jedne miałyby najwyżej 600) — ostrzeżenie z „Jedne drzwi N mm — zawiasy z lewej / z prawej”.
- **Szerokości drzwi**:
  - przy równym podziale różnią się o 1–2 mm — ostrzeżenie z przyciskami zmiany luzu („formatki identyczne”);
  - zero lub mniej — błąd.
- **Wysokość drzwi zero lub mniej** — błąd.
- **Szczelina między frontami** w poziomie: 0 lub mniej (fronty się stykają) — błąd, 1 mm — ostrzeżenie, w jednej kolumnie więcej niż „Ostrzegaj powyżej” (5 mm) — błąd „o N mm za dużo”. Luz z karty „Luzy drzwi” powyżej 5 mm — ostrzeżenie.
- **Otwieranie** (błąd): skrzydło zakreśla ćwiartkę koła wokół zawiasów, sprawdzane w całej zabudowie. Przeszkodą jest korpus, ramię szafki w L, front i uchwyt sąsiada, front szuflady (też wysunięty), blat, maskownica kątownika, wstawka w rogu, sufit.
  - Wynik: „nie otworzy się wcale / do końca … — otworzy się tylko do ok. N°”.
  - Gdy pomaga, przyciski: „Przełóż zawiasy na lewą / prawą” (tylko gdy kąt rośnie o co najmniej 20° albo kolizja znika) i wstawka w rogu.

## Plan wierceń

- **Zawiasy**: oś zawiasu na boku, przegrodzie albo wsporniku — puszka ⌀35 we froncie, prowadnik na płycie; wysokości od dołu płyty.

## Skąd liczby

- **Tabela zawiasów**: katalog GTV 2023 (`instrukcje/Katalog-produktow-2023…`); liczba wg wysokości i wagi to decyzja użytkownika 2026-10-16 („za dużo / za mało wg tabeli, z przyciskiem”).
- **Ciężar płyty**: 680 kg/m³ od użytkownika (górna granica 660–680).
- **Szerokości**: 250 mm (wąski front) i 600 mm (szerokie skrzydło) to progi robocze ustalone z użytkownikiem.

## Gdzie w kodzie i testy

- **Obliczenia**: `computeGeo`, kolumna z drzwiami (`d.type === "door"`, `hingeSide`, `hingePts`), `zawiasyGtv` / `autoHinges`, `hingePositions`; stałe `HINGE_*`, `ZAWIASY_GTV`, `WASKI_FRONT`, `SZEROKI_FRONT`; okucia na końcu `computeGeo` (`hardware`).
- **Kontrola otwierania**: `swingBodies` / `openingMsgs` (`swingHit`, `swingKat`).
- **Przyciski**: `zawiasy:`, `hingeflip:`, `hingeflipcab:`, `onedoor:`, `fixgap:`, `fixsup:`, `fixnodoor:`.
- **Testy**: `zawiasy`, `zawias`, `hinge`, `hinge2`, `otwier`, `wasdrzwi`, `gaps`, `fixmode`, `wspornik`, `audytwierc`.
