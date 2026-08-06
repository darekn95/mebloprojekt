# Szafka narożna — co zostało do zrobienia

Lista z testów na prawdziwym projekcie (elewacja + rzut z góry kuchni w L).
Kolejność jest celowa: punkty 1 i 2 ruszają geometrię, reszta się na nich opiera.

## 1. Koniec z kolumną przejścia — jedne drzwi i ich skrócenie

Dziś przycisk w Uwagach wstawia w szafce narożnej drugą kolumnę bez frontu
(`noDiv`), żeby front nie wychodził na całą szerokość korpusu. To myli przy
projektowaniu — szafka narożna to jedna komora, nie dwie kolumny.

Docelowo: jedne drzwi o szerokości dostępnego światła, korpus zostaje jeden.

Do zrobienia:
- szerokość drzwi zadaje się przez `doorWidths` (jest w modelu), ale drzwi
  węższe od kolumny są dziś zgłaszane jako błąd „zadane szerokości drzwi nie
  wypełniają pasma" (`computeGeo`, ok. linii 1255) — dla szafki z ramieniem
  (`cab.corner.on`) ta kontrola musi zniknąć,
- akcję `cornercol:` zastąpić taką, która ustawia `doors: 1` i
  `doorWidths: [dostępne światło]`,
- po wyrzuceniu kolumny półka sama biegnie przez całe wnętrze; dodać kontrolę,
  żeby półka nie kończyła się w powietrzu.

## 2. Wspornik narożnika przebudowany

- obrócić o 90° przeciwnie do ruchu wskazówek zegara, tak żeby wchodził w obie
  części szafki, a nie leżał wzdłuż jednej,
- dołożyć drugą maskownicę na froncie, do której dochodzą drzwi,
- rysować jako płytę, a nie przerywaną kreskę na froncie ramienia (dziś wygląda
  jak podział frontu, którym nie jest),
- szerokość 60 mm — już zrobione.

## 2b. Luz przy maskownicy narożnika

Maskownica zabudowuje przestrzeń między frontem korpusu a frontem ramienia,
więc po jej wstawieniu nie ma tam już żadnej szczeliny — a aplikacja i tak
liczy ten odcinek jako luz między frontami i krzyczy o „zbyt duży luz".
Kontrola musi wiedzieć, że ten kawałek jest zabudowany.

Drugi kierunek tej samej sprawy: luz naprawdę za duży ma być **błędem**, nie
tylko ostrzeżeniem. Granica 5 mm. Dziś służy do tego `cab.maxGap`
(pole „Ostrzegaj powyżej", domyślnie 5) i kończy się na ostrzeżeniu.

Do zrobienia:
- wyłączyć liczenie luzu na odcinku zajętym przez maskownicę narożnika,
- luz ponad 5 mm podnieść z ostrzeżenia do błędu, z podaniem o ile za dużo
  i przy których dwóch frontach wypada.

## 3. Kontrola otwierania

Kolizja skrzydeł w narożniku ma być błędem. Przypadek z projektu: żeby otworzyć
drzwi od lewej ściany, trzeba najpierw otworzyć prawe.

## 4. Drzwi ramienia otwierane

W widoku otwartym front ramienia jest sztywnym prostokątem — ma się odchylać
jak każdy inny front.

## 5. ~~Formatki poniżej 60 mm~~ — zrobione

## 6. Typ „narożnik L" w szablonie

Zamiast ustawiania wszystkiego ręcznie: szablon tworzy część przy jednej
ścianie, zakłada drugi ciąg i dokłada do niego szafkę. Minimum: okienko
mówiące, że ta szafka jest częścią narożnika.
