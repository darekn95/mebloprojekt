# Makieta „Dodaj / zmień” a aplikacja — lista braków (2026-11-09)

Stan: makieta v24 (`makiety/dodaj.html`, artefakt „Makieta „Dodaj””) i `szafki.jsx` z gałęzi roboczej.
Cel ustalony z użytkownikiem 2026-11-09: makieta wejdzie do aplikacji jako **osobny tryb** z dwoma
poziomami — **prostym** i **szczegółowym**. W poziomie szczegółowym mają być **wszystkie funkcje
aplikacji**.

## A. Jest w makiecie, brakuje w aplikacji

To trzeba dorobić w aplikacji, bo makieta tylko rysuje i niczego nie liczy.

### A1. Sprzęty AGD
> 2026-11-10: wszystko z tabeli jest już w aplikacji (karta AGD makiety i tryb techniczny); ostatni punkt — rodzaj lodówki
> w jednym miejscu — jako wiersz „Rodzaj lodówki” w karcie (`opisy/makieta.md`). Tabela zostaje jako historia.
| Makieta | Aplikacja dziś |
|---|---|
| Ekspres do zabudowy (wnęka 45 w słupku) | brak typu (są: piekarnik, mikrofala, lodówka) |
| Mikrofala i ekspres wolnostojące na blacie (miejsce do szafki górnej) | brak |
| Zmywarka wolnostojąca (pod blat / z pokrywą) | tylko zmywarka do zabudowy |
| Okap: podszafkowy, w szafkę, kominowy; wysokość nad płytą, szafka nad nim | brak okapu |
| Płyta: szkło (na blacie) i kaseta (pod blatem) osobno, wycięcie = kaseta + 3 mm, głębokość kasety | jedno wycięcie szer. × głęb. + „pod blat” |
| Zlew: rant i komora osobno, 1 komora / z ociekaczem (L / P) / 2 komory | jedno wycięcie szer. × głęb. + „pod blat” |
| Wycięcie liczone od początku blatu (wymiar na rysunku) | „Przesunięcie w bok” od środka szafki |
| Lodówka wolnostojąca: luz z lewej i z prawej osobno, „na równo z meblami” | jeden luz z boku (50) |
| Lodówka: rodzaje w jednym miejscu (słupek / podblatowa w szafce / podblatowa w ciągu / wolnostojąca) | słupek i wolnostojąca w ciągu; podblatowej brak |
| Słupek: do 3 sprzętów, „razem — półka między”, „zamień miejscami”, „na wysokość blatu / pod blat / do górnych” | sprzęt w kolumnie poziomu; ustawianie ręcznie przez poziomy |

### A2. Szablony szafek
> 2026-11-09: w palecie makiety (zakładka „Dodaj”) są już wszystkie poniżej poza biurkiem z kontenerem
> i szafą z szufladami na dole — `MAK_PALETA` w `szafki.jsx`, opis `opisy/makieta.md`.

W aplikacji: Szafka stojąca, Szafka wisząca, Biurko, Słupek, Narożnik L, Górna narożna L, Zmywarka,
Lodówka wolnostojąca. **Brak**:
- Dolna z szufladami, Zlewowa;
- Szafa 2 drzwi z drążkiem, Szafa 1 drzwi, Szafa z szufladami, Regał otwarty (w zabudowie);
- Komoda, Szafka RTV, Szafka nocna, Regał, Szafa wolnostojąca (cokół w obrysie + nóżki);
- Biurko z kontenerem szuflad; w zwykłym biurku płyta wzmacniająca 300 mm z tyłu (łączenie:
  konfirmaty + zaślepki albo mimośrody).

### A3. Obsługa (to jest główna wartość makiety)
- Paleta i klocki przeciągane na rysunek (sprzęt, szafki, półki, drążek, fronty, szuflady,
  przegroda, wzmocnienia).
- Zakładki „aktywne tylko to, co wybrane”; dwuklik / prawy przycisk — „Co zmienić?”.
- Uchwyty na rysunku:
  - szerokość, wysokość i głębokość szafki;
  - półki (z „równo z półką obok”), światło od dołu i od góry;
  - przegroda (światła kolumn);
  - szuflady (chwyt całej szuflady, „typowa” dla jednej).
- Przełącznik rodzaju zabudowy: kuchnia / szafa / wolnostojąca — zmienia paletę.

## B. Jest w aplikacji, brakuje w makiecie (poziom szczegółowy)

Tego **nie warto dorabiać w makiecie** — te funkcje już działają w aplikacji, z liczeniem.
- **Projekt**:
  - pomieszczenia, wiele ciągów;
  - narożniki (ślepy róg, szafka w L, wstawka, blat w rogu);
  - piętra ciągu górnego, przenoszenie między pomieszczeniami.
- **Korpus**:
  - złącza (wieniec / dno na boku albo między), plecy (HDF / płyta / brak, frez);
  - wieniec jako blat, fronty nakładane / wpuszczane, scalanie szafek.
- **Wnętrze**:
  - wiele kolumn o dowolnej szerokości, poziomy i poziomy kolumn, blenda, „→ poziom”;
  - mocowanie półek (kołki / konfirmaty / trójkąty), otwory kołków, plecy kolumny.
- **Drzwi**: luzy, liczba zawiasów (tabela GTV), strona, uchwyty i ich wystawanie, lustro, tip-on,
  podfrez, front dłuższy.
- **Klapy**: do góry / w dół, podnośniki / amortyzatory, siła, kąt, strona, kreator klap.
- **Szuflady**: system V-BOX / DXS-3D, bok, tył, reling, NL, „dopasuj fronty”, podfrez, kątownik pod
  dnem > 600 mm.
- **Cokół i nóżki**:
  - cokół: wysokość, cofnięcie, pod korpusem / w obrysie, podział;
  - nóżki: liczba, kształt i kolor.
- **Ściana**: zawieszki, listwa montażowa (też dystansowa), odsunięcie od ściany.
- **Kolizje**: wzmocnienia z wymiarami, wycięcie w narożniku, elementy kolizyjne (rura, gniazdko).
- **Materiały**: płyty, kolory, usłojenie, własne płyty (resztki).
- **Blat roboczy**: podział, łączenia, złącza.
- **Uwagi**: błędy i ostrzeżenia z przyciskami poprawek, kolejność montażu.
- **Wyniki**: formatki, rozkrój, okucia i zamówienie, wycena, plan wierceń, PDF.
- **Widoki**: zamknięty, otwarty, z boku, z góry, 3D (makieta ma tylko „z góry” i „z przodu”).

## C. W obu, ale działa inaczej (ujednolicić przy łączeniu)

| Co | Makieta | Aplikacja |
|---|---|---|
| Przegroda | jedna, `przegX` = światło lewej kolumny | dowolnie wiele kolumn, `col.w` |
| Wysokość szuflad | linie na rysunku, w szafie typowo 220 | wysokość frontu każdej szuflady, „dopasuj fronty” do boków |
| Drążek | 60 mm pod najwyższą półką | oś 70 mm pod płytą, od światła 800 mm, ostrzeżenia rury |
| Półki | odstęp min. 60, światło od dna / półki / do wieńca | światła (`shelfTargets`), kontrole |
| Głębokość | dolna 560, słupek / szafa 600, wolnostojąca 450 | `run.D` ciągu, `cab.D` szafki |
| Ciąg górny | dół 1400, góra 2120 | prześwit nad blatem 500, poziom montażu |
| Wysokość dolnej w kuchni | stała 720 (pod blat) | `run.H` ciągu |

## D. Propozycja kolejności

Poziom szczegółowy **nie** powstaje w makiecie od nowa. To karty aplikacji, które już istnieją
i liczą — tryb makiety tylko je otwiera po zaznaczeniu elementu. Dzięki temu „wszystkie funkcje
aplikacji” są od razu, bez pisania ich drugi raz.

1. **Tryb makiety w aplikacji — podgląd i zaznaczanie**:
   - rysunek ciągu z prawdziwych danych;
   - klik zaznacza; poziom prosty pokazuje kartę z makiety, szczegółowy — kartę z aplikacji.
2. **Uchwyty na rysunku zapisują dane aplikacji**:
   - wymiary szafki;
   - półki → światła;
   - przegroda → szerokość kolumny;
   - szuflady → wysokość frontów.
3. **Paleta i klocki** → szablony aplikacji (dopisać brakujące z A2).
4. **AGD**: dorobić w aplikacji to, czego brak (A1), i podpiąć do palety.

Makieta (artefakt) zostaje wzorem wyglądu i obsługi. Poprawiamy ją tylko wtedy, gdy trzeba pokazać
nowy pomysł, zanim trafi do aplikacji.

## E. Ustalenia z użytkownikiem (2026-11-09)

- **Trzy tryby**: Makieta prosta · Makieta szczegółowa · Techniczny (dzisiejsza aplikacja).
- **Makieta prosta**:
  - wymiary szafki, fronty (drzwi, klapy, szuflady), uchwyty i tip-on;
  - półki, przegroda, drążek, cokół i nóżki;
  - blat roboczy: tylko „jest / nie ma” (bez podziałów), AGD.
  - Scalania szafek tu nie ma.
- **Makieta szczegółowa**: **wszystkie** funkcje aplikacji, w **nowych kartach w stylu makiety**
  (nie karty z trybu technicznego). Na rysunku też to, czego prosta nie pokazuje:
  wzmocnienia, wycięcia, elementy kolizyjne itd.
- **Wygląd**: jak dzisiejsza makieta (zakładki po lewej, paleta i karta, rysunek). Do tego, jak
  w aplikacji: nazwa projektu, pomieszczenia, szafki, ciągi, widoki. Każde z nich na przycisku
  z rozwijaną listą, w stylu przełączników „Wyposażenie / Ciąg górny / Ciąg dolny / Fronty”.
- **Ustawienia spoza prostej**: makieta prosta ich nie kasuje (przyjęte domyślnie);
  szczegółowa je pokazuje i pozwala zmieniać.
- **Kolejność**: krok 1 — tryb makiety w aplikacji, podgląd z prawdziwych danych i zaznaczanie;
  potem uchwyty, paleta i klocki, AGD.

## F. Porównanie po zgłoszeniach użytkownika (2026-11-11)

Użytkownik: „czemu to, co było dobre na makiecie testowej, tutaj nie działa?”. Przyczyna wspólna: makieta trzyma sprzęt
jako klocek z własną wysokością, aplikacja — w poziomie szafki; szafka bez gotowych poziomów miała jeden poziom na
całą wysokość.

Wyrównane 2026-11-11:
- sprzęt w słupku na własnym poziomie (drugi nie kasuje pierwszego), szuflady pod sprzętem na własnym niskim poziomie;
- „Na wysokość blatu”, „Pod blat”, „Do szafek górnych”, „Zamień”, „Razem” — także dla sprzętu wstawionego dawniej na
  cały poziom; kroki −/+ 50 mm przy „dół wnęki od podłogi”;
- postawiony sprzęt w słupku chwytany na rysunku (góra / dół), płyta / zlew / sprzęt na blacie — przeciągane na inną
  szafkę (rysunek z góry);
- ostrzeżenie „Mikrofala wysoko” (dół ponad 1300 mm); sprzęt na blacie: góra od podłogi, miejsce do szafek górnych,
  ostrzeżenia (nie mieści się, ekspres poniżej 150 mm, mikrofala poniżej 100 mm);
- wygląd piekarnika, mikrofali i ekspresu jak w makiecie; słupek w ciągu z blatem ma wieniec (bez pary pod blat).

Wyrównane później tego samego dnia (użytkownik: „wszystko zrób”; opis: `opisy/makieta.md`, test `makieta13`):
- chwyt całej szuflady (górna połowa — linia nad nią, dolna — pod nią), dwuklik na szufladzie — wpisanie wysokości,
  „Szuflada typowa”;
- front „Szuflada + drzwi” (szuflada u góry / na dole, 1 / 2 drzwi) jednym przyciskiem i wzór palety;
- przeciąganie piekarnika / mikrofali / ekspresu / lodówki do INNEJ szafki z zielonymi ramkami miejsc;
- tryb dotykowy „Przesuń” (sprzęt, płyta, zlew, sprzęt na blacie, szafka w ciągu);
- opis „Co zrobi program” w karcie sprzętu i szafki;
- płyta indukcyjna jak w makiecie (ciemne szkło, pola grzewcze; z przodu szkło i kaseta), zlew z baterią;
- lodówka do zabudowy: pole „dolny front” przy 2 frontach — było, sprawdzone testem.


## G. Porównanie makiety (v24) z aplikacją — 2026-11-13

Użytkownik: „czy wszystkie funkcje, wygląd i działanie z artefaktu testowego makiety działa?”. Napisy, przyciski i opcje
makiety porównane z `szafki.jsx`. Dorobione: położenie wycięcia („do końca blatu, do tyłu”), okap — od płyty do okapu,
„pod okapem nie ma płyty”, wysokość okapu −/+50, lodówka wolnostojąca — rozmiary i luzy nad / z tyłu, „pod drążkiem ↕N”,
przełącznik „Wyposażenie”, legenda nad rysunkiem (test `makieta14`).

Decyzje użytkownika (2026-11-13), zrobione:
- „Bez szafki górnej” / „Przywróć szafkę górną” — pozycja „wolne miejsce” w ciągu górnym (bez korpusu, nic w zamówieniu);
- wysokość okapu w szafce — przesuwa się tylko szafka z okapem (krótsza, góra równo z innymi, `cab.dolGorny`);
- sprzęt do zabudowy nigdy za drzwiami — stoi na płycie, nad nim płyta (było: za niska wnęka mikrofali, 250 mm, i drzwi nad nią
  na jej froncie — teraz wnęka rośnie sama).

Inaczej z nazwy, działa tak samo: „Przegroda na środek” → „Kolumny po równo”, „Szuflady po równo” → „po równo”.

Runda 2 (2026-11-13, porównanie akcji makiety i zrzutów tej samej kuchni): dorobione „↑ górne / ↓ wolne” na rzucie z góry,
podpis słupka z góry, dół jednej szafki górnej i góra całego ciągu górnego, klocki wzmocnień, nazwy nie na uchwytach i komorze.
Łączenie płyty wzmacniającej biurka z bokami — decyzja użytkownika 2026-11-13: dorobione „kołki z mimośrodami”, oś 34 mm
(trzpień 6,3 × 45 wg katalogu GTV). Inaczej, bez zmian: makieta ma ciemny motyw (gdy telefon / system jest ciemny), aplikacja — jasny.

Runda 3 (2026-11-13, użytkownik: „czy są jeszcze jakieś braki względem makiety testowej — sprawdź wszystko po kolei, żeby już nie
wracać”): przejrzane po kolei karta szafki (`kartaSzafki`), karta szafki górnej, karty AGD, zakładki z klockami, rysunek z przodu
i z góry, nagłówek ciągu. Dorobione: pełna karta Szafka (front, szuflady, „Szuflada + drzwi”, wnętrze — półki, przegroda, drążek,
kolumny — światło, wzmocnienia, podpowiedzi przy wysokości i szufladach), biurko — szuflady kontenera 2 / 3 / 4 i miejsce na nogi,
klocki nad kartą w każdej zakładce, „Co zrobi program” i „Całą szafkę … w zakładce Szafka” wszędzie, wzory szafek (zwinięte) nad
kartą i lista ciągu z × pod kartą, przegroda — pola światła, dwuklik / prawy przycisk z wpisaniem; rysunek — od płyty do okapu
(poniżej 650 pomarańczowo), lodówka wolnostojąca z miejscem i luzami, „wystaje N” z góry, kaseta / komora pomarańczowo przy
kolizji i z głębokością, wymiary zaznaczonego wycięcia, „szersza niż szafka”; alarm „Ciąg nie mieści się na ścianie” z „Poszerz
ścianę” i „Usuń …”; Esc przerywa przeciąganie (test `makieta15`). Zostaje inaczej (bez zmian): ciemny motyw makiety.

Runda 4 (2026-11-13, użytkownik: „czy jeszcze mamy jakieś różnice? braki w działaniu, wyświetlaniu, elementach?”): porównane
wszystkie napisy makiety (183) i karty AGD każdego sprzętu, zrzuty tej samej kuchni. Dorobione: wymiary z karty modelu dla mikrofali /
ekspresu na blacie i lodówki wolnostojącej, „wystaje przed blat” przy sprzęcie na blacie, podpowiedzi lodówki do zabudowy, „Kaseta
schodzi …”, okap szerszy niż szafka, „Przesuń w ciągu” przy pozycji ciągu, uwagi o dwóch wycięciach blisko siebie i o wycięciu przy
przedniej krawędzi, podpowiedzi w karcie Szafka (test `makieta16`). Decyzje użytkownika: ciemny motyw — zostaje jasny; para pod blat —
płaskie z przodu i stojące z tyłu (jak w aplikacji). Do decyzji: „wystaje” lodówki — od blatu (makieta) czy od korpusów; dotknięcie
klocka / sprzętu, potem miejsca na rysunku (telefon); lodówka „podblatowa w szafce” (korpus z bokami do podłogi, bez dna).
