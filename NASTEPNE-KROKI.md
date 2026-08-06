# Szafka narożna — co zostało do zrobienia

Testy siedzą w `testy/` — jak je uruchomić, opisuje `testy/README.md`.
Przed zmianami warto przelecieć `bash testy/sweep.sh narozn narozn2 narozn3 otwier`,
żeby wiedzieć, od czego się startuje.

Lista z testów na prawdziwym projekcie (elewacja + rzut z góry kuchni w L).

## 1. ~~Koniec z kolumną przejścia — jedne drzwi i ich skrócenie~~ — zrobione

Szafka narożna jest jedną komorą: przycisk w Uwagach ustawia jedne drzwi
o szerokości dostępnego światła, kontrola „zadane szerokości drzwi nie
wypełniają pasma" nie odzywa się przy szafce z ramieniem, a półka, która nie
ma pary w kolumnie od strony ramienia, jest zgłaszana jako błąd — bo
w ramieniu skończyłaby się w powietrzu.

## 2. ~~Wspornik narożnika przebudowany~~ — zrobione

## 2b. ~~Luz przy maskownicy narożnika~~ — zrobione

Odcinek zabudowany maskownicą nie liczy się jako szczelina (ani w kontroli,
ani na rysunku), a luz ponad `cab.maxGap` (domyślnie 5 mm) jest błędem
z podaniem, o ile za dużo i między którymi frontami. Po stronie bez ramienia
odsłonięta szczelina przy boku korpusu też jest błędem.

## 3. ~~Kontrola otwierania — nie tylko szafka narożna~~ — zrobione

Skrzydło zakreśla ćwiartkę koła wokół osi zawiasów i jest sprawdzane
w układzie całej zabudowy (`projectLayout`), a nie pojedynczej szafki.
Przeciwnikiem jest wszystko, co stoi na drodze: korpusy, ramiona, fronty
zamknięte, fronty szuflad wysunięte na długość prowadnicy i uchwyty. Kolizja
to błąd; suita `otwier` pilnuje i tego, że zwykły ciąg przy jednej ścianie
niczego nie zgłasza.

Ile uchwyt wystaje przed lico, mówi pole „Uchwyt wystaje przed front"
(`cab.handleOut`, domyślnie 20 mm, tak samo dla drzwi i szuflad). Tego samego
wymiaru używa rysunek 3D, więc model kolizji nie rozjeżdża się z tym, co widać.
Uchwyt na wysuwanej szufladzie jedzie razem z frontem, więc sięga dalej niż
sama prowadnica; przy 0 mm (muszelka, frez) uchwyt znika z listy przeszkód.

Wysunięcie z lica dalej jest tylko pozycją całej szafki. Sprzęt wystający
z szafki poza jej lico (zmywarka, piekarnik) nie ma jeszcze własnej opcji —
gdy ją dostanie, dokłada się w `swingBodies` jako kolejna bryła.

## 4. ~~Drzwi ramienia otwierane~~ — zrobione

## ~~Testy do przepisania~~ — zrobione

## 5. ~~Formatki poniżej 60 mm~~ — zrobione

## 6. ~~Typ „narożnik L" w szablonie~~ — zrobione

`+ z szablonu… → Narożnik L` stawia szafkę narożną z ramieniem, zakłada drugi
ciąg pod kątem prostym i dokłada do niego szafkę. Karta szafki mówi wprost,
że stoi w rogu i których dwóch ścian on dotyczy.

## Co dalej

- Sprzęt wystający z szafki poza jej lico jako osobna opcja (zmywarka,
  piekarnik) — i dołożenie go do kontroli otwierania.
- Pięć suit pada niezależnie od narożnika i padało już wcześniej: `pdf`
  (względny adres `file://`), `savetest` (szuka nieistniejącego
  `preview-local.html`), `d2test` i `fixbtn` (timeout na kliknięciu) oraz
  `pins2` (kołki i etykiety w dwóch kolumnach). Sprawdzone na artefakcie
  zbudowanym z `git show HEAD:szafki.jsx`, szczegóły w `AI_NOTES.md`.
