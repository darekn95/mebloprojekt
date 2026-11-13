# Tryb makiety

Makieta to drugi sposób pracy w tej samej aplikacji: rysunek pomieszczenia, klikanie
i przeciąganie zamiast formularzy. Działa na **tych samych danych projektu** co tryb
techniczny — nic nie jest kopiowane ani liczone osobno. Plan i ustalenia:
`makiety/BRAKI.md` (sekcja E), wzór wyglądu i obsługi: `makiety/dodaj.html`.

## Trzy tryby

Przełącznik w nagłówku: **Makieta prosta · Makieta szczegółowa · Techniczny**.
Wybór pamięta przeglądarka; nowy użytkownik zaczyna w trybie technicznym.

- **Makieta prosta**:
  - wymiary szafki, fronty (drzwi, klapy, szuflady), uchwyty i tip-on;
  - półki, przegroda, drążek, cokół i nóżki;
  - blat roboczy (tylko czy jest), AGD.
  - Ustawień, których nie pokazuje (wzmocnienia, wycięcia, kolizje), **nie kasuje**.
- **Makieta szczegółowa**: wszystkie funkcje aplikacji w kartach w stylu makiety. Na rysunku
  też wzmocnienia, wycięcia i elementy kolizyjne.
- **Techniczny**: dotychczasowa aplikacja, bez zmian.

## Co program robi sam (krok 1)

- Rysuje ciągi oglądanego pomieszczenia z prawdziwej geometrii (te same rysunki co widok
  ciągu w trybie technicznym), jak w makiecie „Dodaj”: **z góry nad widokiem z przodu**.
  Przełączniki: „Z góry”, „Ciąg górny” / „Ciąg dolny” (gdy jest piętro), „Fronty” (wyłączone —
  wnętrze); wybór pamięta przeglądarka. Szafki wolnostojące stoją obok, z odstępem.
- Nagłówek w makiecie jest zwarty: bez „Zwiń wszystkie” i „Pokaż rysunek” (to przyciski kart
  trybu technicznego).
- **Widok jak w makiecie „Dodaj”** (użytkownik 2026-11-09: „popraw widok żeby był jak w artefakcie makieta”):
  - nad rysunkiem nagłówek: „Ciąg „…”” i jego długość, **ściana** (− / pole / +, co 100 mm → `run.wallW`)
    i „wolne N mm” (albo „brakuje N mm”); przy szafkach wolnostojących — „Szafki wolnostojące”;
  - widok z góry i z przodu w **tej samej skali, jeden nad drugim** (szafki w tych samych miejscach), skala na
    szerokość okna rysunku i tak, żeby oba widoki zmieściły się na ekranie;
  - z przodu ściana do 2300 mm (`MAK_SCIANA`) w tle, do długości ściany — wolne miejsce przerywane z „wolne N”;
  - szafki wolnostojące też z widokiem z góry nad nimi;
  - **przybliżanie** (użytkownik 2026-11-09: „powiększ jako domyślny … jak w technicznym większe powiększenie,
    dopasowanie i pełny ekran”): „Powiększ” (przełącznik, **domyślnie włączony**) — widok z przodu na wysokość okna,
    przewijany w bok i w dół; „− 100 % +” — dalsze kroki jak w trybie technicznym (do 400 %), Ctrl + kółko nad
    rysunkiem przybliża w miejscu kursora; „Dopasuj” — cały rysunek w oknie (bez „Powiększ”, 100 %); „Pełny ekran” —
    rysunek na całe okno, Esc zamyka. Pamięta przeglądarka (`mp-mak-zoom`).
    Przybliżanie działa w każdym widoku, także „Tylko zaznaczona szafka”.
  - szafka wolnostojąca z cokołem pod korpusem — cokół narysowany pod nią (zasłania nóżki za nim); drążek
    (rura na wieszaki) rysuje się jak w widoku szafki — za drzwiami zasłania go front.
- **Układ na ekranie** (zgłoszenie 2026-11-09: „suwak rysunku na dole, ale suwak okna nie, ucina rysunek”): na
  szerokim ekranie zakładki, karta i rysunek stoją pod górnym paskiem (jego prawdziwa wysokość, jak „rysunek
  przypięty” w trybie technicznym), rysunek sięga do dołu okna i ma własne suwaki; długa karta przewija się sama.
- **Uwagi** (zgłoszenie 2026-11-09: „brak w prostym ostrzeżeń, błędów i podpowiedzi”): pod makietą ta sama karta
  „Uwagi” co w trybie technicznym (błędy, ostrzeżenia z przyciskami poprawek, podpowiedzi, inne szafki) — dla
  zaznaczonej (aktywnej) szafki; przycisk „N ostrzeżeń” w pasku przewija do niej.
- Zakładki po lewej z ikonami i podpisem „Dodaj / zmień”, kafelki palety z miniaturami szafek, nagłówki sekcji
  wielkimi literami — jak w makiecie.
- **Kartę można schować**: klik w otwartą zakładkę albo „‹” w karcie; rysunek dostaje całą szerokość.
  Klik w zakładkę otwiera kartę z powrotem. Pamięta przeglądarka.
- W karcie „Szafka” nie ma wiersza „Ciąg” — widać go na przycisku „Ciąg ▾” nad rysunkiem.
- Klik w szafkę (albo wybór z listy „Szafka ▾”) robi ją aktywną szafką projektu — po przejściu
  do trybu technicznego otwiera się właśnie ona.

## Podstawy kreatora (przegląd braków 2026-11-09)

- **Szafka**: pole „Nazwa”, „Kopiuj obok” (kopia za nią w tym samym ciągu, „… (kopia)”, zaznaczona — `duplicateCabinet`),
  „Usuń szafkę” (`removeCabinet`; ostatnia szafka pomieszczenia zostaje; po usunięciu nic nie jest zaznaczone —
  widać paletę). Cofnij (Ctrl + Z) przywraca.
- **Przegroda → poziomy szafki** (półka przez całą szerokość, np. szuflady na dole szafy): „+” dodaje poziom na górze
  (dotychczasowe dostają obecne wysokości, ostatni oddaje połowę), „−” zdejmuje najwyższy; wysokość — przeciągnij
  przegrodę poziomą na rysunku (zielony znaczek; `makWylicz` `u: "poziom"` → `levels[].h`, najwyższy auto).
- **Półki → „równo z kol. J”** (makieta „Dodaj”: „równo z półką obok”): półki wybranej kolumny na tych samych
  wysokościach co w sąsiedniej (światła sąsiada, najwyższe auto; drążek zostaje w najwyższym świetle).
- **Paleta → Szafa w zabudowie → „Szafa z szufladami”** (z makiety): 800 mm, poziom dolny 600 mm z 3 szufladami,
  nad nim 2 drzwi i 2 półki.

## Karta sprzętu AGD (krok 1 planu wyrównania)

W „Dodaj → AGD”, nad listą „W projekcie” — karta wybranego sprzętu. Wybór: klik w listę, klik w płytę / zlew /
sprzęt na blacie na rysunku (otwiera „Dodaj → AGD”), „Co zmienić?” → sprzęt, przy otwartym AGD klik w kolumnę ze
sprzętem albo w zmywarkę / lodówkę w ciągu. Zapis w te same pola co tryb techniczny:
- **płyta / zlew** (`cab.blatWyciecia[k]`): rozmiar do kliknięcia (`ROZM_WYCIEC`), wymiary z karty modelu (szkło /
  rant, kaseta / wycięcie, w dół od wierzchu; puste — typowe), „Wróć do typowych”, ociekacz z lewej / z prawej,
  **położenie od początku blatu do lewej krawędzi wycięcia** (zmienia `przesun`), od przodu blatu, „Na środek szafki”,
  „Usuń”;
- **na blacie** (`cab.naBlacie[k]`): rozmiar, przesunięcie w bok, „Usuń”;
- **w kolumnie** (`col.sprzet`): rozmiar (`SPRZET_ROZM`), otwieranie (w dół / zawias z lewej / z prawej / wysuwa się /
  nie sprawdzaj) i wysuw; lodówka — front (ślizgowo / na stałe / bez frontu), 1 / 2 fronty, wnęka, zawiasy; „Usuń”;
- **w słupku** (sprzęt w poziomie szafki wyższej niż 1500, decyzja 2026-11-10): „dół wnęki od podłogi”, „Na wysokość
  blatu” (dół = wierzch blatu ciągu), „Pod blat” (góra = spód blatu, jak szafki dolne), „Góra do dołu szafek górnych”,
  „Zamień miejscami” (z najbliższym sprzętem w słupku), „Razem — półka między” (sprzęty w sąsiednich poziomach).
  Wnękę przesuwa zmiana poziomu pod nią (brak — dochodzi poziom z drzwiami); poziomy dostają obecne wysokości, najwyższy
  bez sprzętu zostaje auto (`makSlupekWneka`);
- **okap** (`cab.okap`, decyzja 2026-11-10): kafelek „Okap” wstawia go do szafki górnej (klik — zaznaczonej, przeciągnięcie —
  na szafkę); rodzaj podszafkowy (pod dnem, 150 w dół) / teleskopowy / wkład (w szafce, **wycięcie w dnie** — propozycja
  szerokość okapu − 40 × 290, czyli 560 × 290 dla 60 cm, na środku, 20 mm od przedniej krawędzi; pola z karty modelu),
  rozmiar 60 / 90 / 50; wycięcie idzie do formatki „Dno”. Uwagi: od wierzchu blatu do okapu (indukcja min. 650 —
  ostrzeżenie, gaz 750 — informacja), bez płyty pod okapem — informacja. **Kominowy** — w karcie okapu „kominowy (zamiast
  szafki)”: szafka staje się okapem na ścianie (pozycja ciągu górnego bez korpusu, to samo miejsce), karta: wymiar,
  „dół okapu nad blatem” (650 domyślnie); inny rodzaj wraca do szafki wiszącej z okapem (`opisy/sprzety.md`);
- **rodzaj lodówki** (krok 6 planu, 2026-11-10, jak „Rodzaj lodówki” w makiecie „Dodaj”): w karcie lodówki w kolumnie
  i w ciągu wiersz „do zabudowy (słupek) / podblatowa w ciągu / wolnostojąca / na równo z meblami” — inny rodzaj wstawia
  nową pozycję z szablonu na miejsce starej (słupek z wnęką 1780; na równo — luzy 3 / 3 / 15, miejsce 606); szafka
  z innymi sprzętami zostaje, lodówka tylko wychodzi z kolumny (`zamienLodowke`, `MAK_LOD_RODZ`). „Podblatowa w szafce”
  z makiety: wnęka 82 cm w kolumnie (wybór „Wnęka”) albo pozycja w ciągu;
- **w ciągu** (`cab.sprzetCiagu`): zmywarka — model 60 / 45, wolnostojąca — montaż pod blatem / z pokrywą; lodówka
  podblatowa — drzwi; wolnostojąca — rodzaj, luzy z lewej / z prawej, drzwi; „Usuń” (cała pozycja ciągu).
- Pozostałe pola z karty modelu — w trybie Technicznym (karta to mówi).
- Rysunek z góry: płyta z polami grzewczymi (30 — 2, 90 — 5, inne — 4), zlew z komorą / komorami i odpływem
  (ociekacz po swojej stronie). Uwagi (wycięcie poza wnętrzem szafki, za blisko końca blatu…) — w karcie „Uwagi”.

## Poziomy kolumny w makiecie prostej

Użytkownik 2026-11-09: „dodawanie i usuwanie poziomów prosto … nie da się zrobić 1 drzwi dla 2 poziomów”. W „Drzwi
i klapy”, pod frontami wybranej kolumny / poziomu:
- **podziel na półce** (wysokość półki od dołu) — półka zostaje półką graniczną, każdy poziom dostaje swój front
  (nowy z ustawieniami dzielonego) — jak „→ poziom” w trybie technicznym (`makPodzielKolumne`);
- **scal z wyższym / z niższym** — dwa poziomy w jeden (np. jedne drzwi na dwa poziomy); zostają ustawienia
  wybranego poziomu; półka graniczna zostaje zwykłą półką, a gdy zostają szuflady / blenda — półki i drążek
  z tego poziomu znikają (`makScalPoziomy`, jak „scal” w technicznym);
- **Drążek**: przeciągnij jego zielony znaczek (zakładka Półki) do innego światła — zawiśnie 70 mm pod płytą nad nim
  (tylko światła z drzwiami / półkami); półka przeciągnięta ponad drążek zabiera go w dół — drążek wisi wtedy pod nią
  (zgłoszenia 2026-11-09).
- „Bez frontu” działa też w poziomie kolumny (otwarty poziom, `segmenty[nr].doors = 0`).
- **Półki** wybiera się po kolumnie (cała kolumna, wszystkie jej poziomy naraz) — użytkownik: „w półkach wybór
  kolumny, a nie konkretnej półki”.

## Kolory rysunku

Użytkownik 2026-11-09: „zależnie od trybu — w prostym jak jest [w makiecie], w szczegółowej już z kolorami płyt jak
w technicznym, na przełączniku”:
- **prosta** — jasne jak makieta „Dodaj” (płyta #fbfaf8, front #f3f0eb, plecy #ece7e1, blat #8b6f56), bez słojów;
- **szczegółowa** — przełącznik „Kolory płyt” (domyślnie włączony): kolory materiałów jak w trybie technicznym,
  wyłączony — jasne;
- **wybór płyty** (użytkownik 2026-11-10: tylko w szczegółowej): w karcie „Szafka” wzornik płyty korpusu i frontów
  (`PALETA`, jak w trybie technicznym — kolor, dekor czyści się, własna płyta zdejmuje), „cały ciąg” — ten sam kolor
  we wszystkich szafkach ciągu;
- zmienia się tylko rysunek makiety (kopia `mat` — `makJasneMat`, `projRys`); kolory w projekcie, formatkach, PDF
  i trybie technicznym zostają.

## Rodzaj zabudowy (na ciąg)

Jak „Rodzaj zabudowy” w makiecie „Dodaj”, ale **na ciąg** (użytkownik 2026-11-09), `run.zabudowa`:
- przełącznik „Kuchnia / Szafa (bez blatu) / Wolnostojąca” w nagłówku ciągu (`mak-rodzaj`); ciąg górny — jak dolny;
  szafka bez ciągu — wolnostojąca;
- **Kuchnia**: blat roboczy ciągu włączony (ciąg stojący), w „Dodaj” jest AGD, paleta zaczyna od „Kuchnia — dół / góra”,
  szerokości do kliknięcia 300–900 (słupek 400–600);
- **Szafa**: blat ciągu wyłączony, nagłówek „Zabudowa „…””, paleta od „Szafa w zabudowie”, szerokości 400–1200,
  AGD schowane (podpowiedź „AGD — w ciągu kuchennym”);
- **Wolnostojąca**: bez ściany (pole ściany, „wolne”, tło), paleta od „Wolnostojące”, szerokości 400–1600 i wysokości
  450–2000 do kliknięcia (w ciągu — z pytaniem o cały ciąg), AGD schowane;
- pole „Szerokość” zostaje — przyciski to skrót (`MAK_SZER`, `MAK_WYS_WOLNA`, liczby z makiety „Dodaj”).

## „Co zmienić?”, światło półki, przesuwanie (krok 2 planu wyrównania)

Jak w makiecie „Dodaj” (zgłoszenie 2026-11-09: „nie działa dwuklik lewym i prawy myszy”):
- **Dwuklik albo prawy przycisk na szafce** — okienko „Co zmienić?”: Szafka, Szuflady, Półki, Drzwi i klapy,
  Przegroda, Cokół i nóżki (w szczegółowej także Korpus i plecy, Wzmocnienia, Wycięcia i kolizje); sprzęt w tej
  szafce (wycięcia w blacie, sprzęt w kolumnie, na blacie, sprzęt w ciągu) — prowadzi do „Dodaj → AGD”. Wybór
  zaznacza szafkę i przełącza zakładkę. Esc albo klik obok zamyka. Sprzęt w ciągu (zmywarka, lodówka) — tylko
  wymiary, cokół i AGD.
- **Dwuklik albo prawy przycisk na półce** (zakładka Półki; użytkownik 2026-11-10) — okienko „Półka N”: światło
  **pod nią** (najniższa — od dna, wyższa — od półki niżej) i **nad nią** (do półki wyżej albo do płyty u góry);
  wpisujesz jedno, drugie przejmuje resztę, ostatnie światło kolumny zostaje auto (`makWylicz` z `d.sw`).
  „Usuń tę półkę” łączy światło pod i nad nią w jedno (z grubością półki, `makUsunPolke`), reszta półek zostaje na
  miejscu; drążek nad nią schodzi do połączonego światła. Granicy poziomu kolumny (`podzial`) tak się nie usuwa —
  to zmiana poziomów („Drzwi i klapy”).
- **Przesuwanie szafki w ciągu**: chwyć szafkę (nie uchwyt) i przeciągnij — zielona kreska z napisem
  „przed / za „…”” pokazuje, gdzie stanie (tylko w tym samym ciągu); po puszczeniu zmienia się kolejność szafek
  w ciągu, szafka zostaje zaznaczona. Ta sama zielona kreska pokazuje miejsce szafki przeciąganej z palety.

## Uchwyty na rysunku (krok 2)

Przeciągasz tylko w zaznaczonej szafce; zakładka mówi, co:
- **Szafka**: prawa krawędź — szerokość, górna — wysokość; w widoku z góry przód — głębokość.
  Te same liczby w polach karty (Enter albo wyjście z pola zapisuje).
- **Półki**: półka w górę / w dół — zmienia światło pod nią i nad nią (`shelfTargets`).
- **Przegroda**: w lewo / w prawo — zmienia szerokość kolumn obok (`col.w`).
- **Szuflady**: linia między frontami — zmienia front pod nią i nad nią (`drawers[].front`).

Zasada zapisu:
- To te same pola co w trybie technicznym.
- Przeciągnięta rzecz i jej sąsiad dostają liczby. Pozostałe zostają na tym, co teraz widać.
- **Ostatnie** światło, kolumna i front idą na auto i biorą resztę — sumy się zgadzają, bez błędu
  „nie zgadzają się o …”.
- Co 10 mm. Światło i front mają najmniej 60 mm, kolumna 100 mm.
- W trakcie przeciągania widać tylko podgląd (linia i liczby); zapis jest po puszczeniu.
  „Cofnij” cofa całe przeciągnięcie.
- Przyciski „Półki / Fronty / Kolumny po równo” wracają do auto.
- Kolumny podzielone na poziomy kolumny (granice frontów) przeciąga się dopiero w trybie technicznym.

Polki i przegrody widać we wnętrzu, więc te zakładki same przełączają rysunek na „Otwarty”.

**Wysokość szafki w ciągu** (użytkownik 2026-11-09): po zmianie (uchwyt albo pole) od razu pytanie:
- „Cały ciąg” — `run.H` ciągu i szafki o tej samej wysokości co zmieniona przed zmianą;
- „Ten ciąg i połączone w narożniku” — to samo we wszystkich ciągach dolnych połączonych `corner.of`
  (szafka narożna albo dwie szafki w rogu — wspólny blat), także dalej, np. w U;
- „Tylko ta szafka” (albo Esc).

Słupki (`slupek`) i lodówka w ciągu zostają. Szafka sama w ciągu — wysokość ciągu idzie za nią bez
pytania. Wolnostojąca i ciąg górny — bez pytania.

## Przyciski w karcie (krok 4)

Jak w makiecie „Dodaj”: rząd przycisków kolumny (w szafce z jedną kolumną bez podpisu).
**Drzwi i klapy, Szuflady, Półki — tylko wybrana kolumna** (użytkownik 2026-11-09: „za duży sajgon — po wybraniu na
rysunku konkretnych opcje konkretnych, a nie wszystko naraz”; „szuflady tak samo, półki powinny dotyczyć kolumny”):
klik na rysunku w kolumnę albo poziom kolumny wybiera ją (przerywana ramka na rysunku), karta pokazuje tylko jej
przyciski; nad nimi małe „kol. J · poz. N” do zmiany bez klikania w rysunek. Szafka z jedną kolumną — od razu jej
opcje.
Zapis do tych samych pól co tryb techniczny; liczy aplikacja.
- **Drzwi i klapy**: „1 drzwi / 2 drzwi / Klapa ↑ / Klapa ↓ / Bez frontu” (`col.doors`, `col.klapa`);
  przy frontach „uchwyt / tip-on” (`col.handles[i]`, `col.otwieranie[i] = "tipon"`) i „lustro” (`col.mirrors` na
  wszystkich skrzydłach — waga lustra idzie do doboru zawiasów). Pojedyncze drzwi (nie klapa): „zawiasy z lewej /
  z prawej” (`col.hinge`; zaznaczona strona z rysunku, także domyślna). Tip-on zostaje przy zmianie liczby drzwi
  i przy klapie. Szuflady w kolumnie zmieniają się w drzwi.
- **Szuflady**: 1–5 w kolumnie (`col.drawers`, fronty auto, system z szafki / ciągu jak w trybie
  technicznym — `systemKontekstu`).
- **Półki**: „− N +” (`shelfTargets`, wszystkie światła na auto). Nad kartą klocki **„Półka”** i **„Drążek”**
  (użytkownik 2026-11-10: „klocek do przeciągnięcia w wybrane miejsce, drążek nie jako przycisk obok każdej
  przestrzeni”): półka upuszczona na kolumnę dzieli światło pod kursorem — staje na wysokości upuszczenia (co 10 mm,
  światła co najmniej 60 mm, `makWstawPolke`; półki i granice wyżej przesuwają numer, drążek zostaje w górnej
  części); drążek trafia do światła pod kursorem (`col.drazki`). Działa też w poziomie kolumny z drzwiami. Klik
  w klocek — do wybranej kolumny (półka po równo, drążek w najwyższym świetle). W wierszu kolumny tylko „usuń drążek”,
  gdy jest. W szczegółowej także **mocowanie półek**: kołki / konfirmaty / trójkąty dla wybranej kolumny
  (`col.shelfMount`) albo całej szafki (`cab.shelfMount`, kolumny wracają do szafki).
- **Przegroda**: 1–4 kolumny w poziomie; szerokości na auto, nowa kolumna jak ostatnia (drzwi, półki).
- **Cokół i nóżki**: cokół brak / pod korpusem / w obrysie i wysokość, nóżki brak / są i wysokość.
  W ciągu — **cały ciąg** naraz, jak karta ciągu: cokół przez `run.plinth` (bez uwagi „nie zgadza się
  z ciągiem”), nóżki we wszystkich szafkach ciągu; lodówka wolnostojąca w ciągu zostaje. Szafka
  wolnostojąca — tylko ona. Ciąg wiszący: cokołu i nóżek nie ma (jak `ciagWisi`).
- **Szafka**: „Blat roboczy ciągu: jest / nie ma” (`run.worktop` przez `setRun` — wspólny wieniec
  wyłączony, szafki ciągu dopasowane do blatu, jak w karcie ciągu). Tylko ciąg stojący.

**Kolumna podzielona na poziomy** (`col.podzial`, `col.segmenty`; zgłoszenie 2026-11-09: „w szafie nie widzi kolumn”):
każdy poziom kolumny to osobny wiersz „kolumna J · poziom N” (najpierw kolumna — użytkownik: „bo się można zgubić”), od góry jak na rysunku; poziomy liczone od dołu, jak w trybie technicznym.
- Półki „− N +” zmieniają półki tylko w tym poziomie (`polkiWPoziomie`): światła innych poziomów dostają obecne
  wymiary na stałe (z narysowanej geometrii), granice idą razem z nimi; „drążek” — w najwyższym świetle poziomu.
- Fronty: „1 drzwi / 2 drzwi / Klapa ↑ / Klapa ↓” w `col.segmenty[nr]` (bez „Bez frontu” — poziom kolumny ma front,
  jak w technicznym); szuflady i blenda poziomu zamieniają się w drzwi; tip-on poziomu osobno.
- Szuflady 1–5: poziom dostaje szuflady, półki i drążek z tego poziomu znikają.
- Na rysunku: półki takiej kolumny przeciąga się jak zwykłe (także granice), linie między szufladami — w swoim poziomie.
- Liczbę poziomów kolumny i sprzęt w kolumnie zmienia się w trybie technicznym.

## Paleta, AGD i klocki (krok 5)

Zakładki (użytkownik 2026-11-09: „wraca stare Dodaj, ale z modyfikacjami”): **Dodaj**, Szafka, Szuflady, Półki,
Drzwi i klapy, Przegroda, Cokół i nóżki.
- **Dodaj** rozwija wybór (jeden naraz, pamięta przeglądarka — `mp-mak-dodaj`): **AGD**, **Nowe szafki** (Kuchnia —
  dół, Kuchnia — góra, Szafa w zabudowie, Wolnostojące), **Elementy szafki** (klocki: szuflady, półki i drążek,
  drzwi i klapy, przegroda).
- **Zaznaczona szafka** (klik w szafkę, wybór z „Szafka ▾”, nowa szafka z palety): pozostałe zakładki pokazują tylko
  jej opcje (karta). **Bez zaznaczenia** (klik w puste miejsce rysunku, „odznacz” w karcie, „Szafka ▾ → Żadna”):
  „Szafka” pokazuje nowe szafki, „Szuflady / Półki / Drzwi i klapy / Przegroda” — swoje klocki do przeciągnięcia;
  klik klocka bez zaznaczonej szafki — komunikat „przeciągnij na szafkę”. Aktywna szafka projektu zostaje (tryb
  techniczny otwiera ją jak dotąd).
- **AGD** — sprzęt (`MAK_AGD`) i lista „W projekcie” (klik zaznacza szafkę, × usuwa wycięcie / sprzęt
  na blacie / sprzęt z kolumny):
  - płyta, zlew — wycięcie w blacie nad szafką (tylko pod blatem roboczym, inaczej komunikat);
  - piekarnik — sprzęt w kolumnie, na którą upuścisz (klik — pierwsza prosta kolumna zaznaczonej szafki);
  - **mikrofala, ekspres — po jednym kafelku** (decyzja 2026-11-10: „połącz wszystkie”): na szafkę pod blatem roboczym —
    wolnostojąca na blat, na słupek / szafkę górną / inną — do zabudowy w kolumnie; w karcie „Rodzaj”: do zabudowy ↔
    wolnostojąca na blacie (`zamienSprzet`: z kolumny na blat najbliższej szafki pod blatem, z blatu do najbliższego słupka
    z wolną prostą kolumną; brak — komunikat);
  - **lodówka — jeden kafelek** (decyzja 2026-11-10, jak w makiecie „Dodaj”): na wysoką szafkę (słupek) — do zabudowy
    w jej kolumnie, na niższą albo bez celu — wolnostojąca w ciągu (przed / za szafką, klik — na koniec ciągu); rodzaj
    (podblatowa w ciągu, na równo z meblami…) — w karcie, wiersz „Rodzaj lodówki”;
  - **zmywarka — jeden kafelek**: do zabudowy w ciągu; w karcie „Rodzaj” do zabudowy ↔ wolnostojąca (nowa pozycja z szablonu
    w to samo miejsce);
  - sprzęt na blacie (mikrofala / ekspres wolnostojące) — tylko rysunek;
  - okap — w szafkę górną (rodzaj w karcie, także kominowy zamiast szafki).
- Zaznaczona zakładka ma znaczek „‹” (karta otwarta — klik zwija) albo „›” (schowana — klik rozwija).

Kafelki można przeciągnąć na rysunek albo kliknąć.
- **Szafki** — szablony aplikacji (`TEMPLATES`) i brakujące z makiety „Dodaj” jako szablon + zmiany
  (`MAK_PALETA`):
  - kuchnia dół: Dolna 1 drzwi 450, Dolna 2 drzwi 800, Dolna z szufladami 600 (3), Zlewowa 800 (bez półek),
    Słupek, Narożnik L, Zmywarka, Lodówka wolnostojąca;
  - kuchnia góra: Szafka wisząca, Górna narożna L;
  - szafa w zabudowie (ze Słupka: 2000, cokół 100, 600 w głąb): Szafa 2 drzwi 1000 (dwie kolumny: 4 półki;
    półka 300 pod wieńcem i drążek pod nią), Szafa 1 drzwi 500 (5 półek), Regał otwarty 600 (5 półek);
  - wolnostojące (450 w głąb, jak w makiecie): Komoda 800 × 800 (4 szuflady), Szafka RTV 1600 × 450 (dwie
    kolumny, klapy w dół), Szafka nocna 450 × 500 (2 szuflady), Regał 800 × 1700 (4 półki), Szafa 800 × 2000
    (600 w głąb, 5 półek, 2 drzwi, cokół w obrysie i nóżki), Biurko, Biurko z kontenerem (3 szuflady z prawej,
    wnętrze 400).
- Gdzie ląduje szafka (`addCabinet` z `opcje`):
  - upuszczona na szafkę w ciągu — przed nią (lewa połowa) albo za nią (prawa);
  - klik — na koniec ciągu zaznaczonej szafki;
  - kuchenne dolne i wisząca biorą wysokość, głębokość i cokół ciągu (`wymiaryCiagu`);
  - wisząca na ciąg dolny — do ciągu górnego nad nim (zakładany, gdy go nie ma — `addUpperRun`); bez ciągu —
    komunikat;
  - wolnostojące — zawsze obok, w oglądanym pomieszczeniu; nazwa z palety („Komoda”, „Komoda 2”).
- **Klocki** (`MAK_KLOCKI`): półka (+1), drążek, 1 / 2 drzwi, klapa ↑ / ↓, bez frontu, 1–4 szuflady, przegroda
  (nowa kolumna za tą, szerokości auto). Upuszczony — na kolumnę pod kursorem; klik — pierwsza pasująca
  kolumna zaznaczonej szafki. Półka i drążek tylko do kolumny z drzwiami / otwartej — inaczej komunikat.
  Te same zmiany co przyciski karty (`makUstawFront`, `makUstawSzuflady`, `makUstawPolki`, `makDodajPrzegrode`).
- W trakcie przeciągania nad rysunkiem widać, gdzie spadnie („upuść: przed „Szafka 2””).
- **Biurko** (szablony „Biurko” i „Biurko z kontenerem”, decyzja 2026-11-10): blat z płyty na bokach, bez dna i pleców;
  z tyłu pod blatem płyta wzmacniająca 300 mm (wzmocnienie tylne pod blatem — konfirmaty przez boki w jej czoła,
  zaślepki); biurko stoi — bez zawieszek. **Kontener** (decyzja 2026-11-10): bok biurka zostaje bokiem, dochodzi przegroda
  do podłogi; na dole dwa wzmocnienia 100 mm — czołowe w obrysie i tylne, na nich „Dno kontenera” (półka graniczna dwóch
  poziomów kolumny, na konfirmatach), nad nim szuflady; prowadnice na boku biurka i na przegrodzie. W karcie Szafka:
  „Kontener szuflad” bez / z lewej / z prawej (kolumny zamieniane, wzmocnienie 300 zostaje przy nogach —
  `biurkoUstawKontener`) i szerokość wnętrza 400 / 450 / 500; liczba szuflad — zakładka Szuflady (poziom 2 kolumny).
  Uwaga „kolejność montażu” (`biurkoMsgs`): (1) wzmocnienie 300 do przegrody — konfirmaty od strony kontenera, zanim stanie
  bok po tej stronie; (2) bok przy nogach; (3) dno i wzmocnienia 100 do przegrody — od strony nóg; (4) bok przy kontenerze;
  (5) blat — trójkąty od spodu; (6) prowadnice i szuflady. Konfirmaty z obu stron przegrody są na różnych wysokościach
  (300 u góry, 100 i dno na dole), więc się nie zasłaniają.
  **Łączenie płyty z tyłu** (makieta „Dodaj”, decyzja użytkownika 2026-11-13): w karcie biurka „Wzmocnienie z tyłu — łączenie
  z bokami”: „konfirmaty + zaślepki” (domyślnie) albo „kołki z mimośrodami” (`biurkoUstawLaczenie`, `mocowanie: "mimosrody"`
  tylnych wzmocnień kolumny nóg). Mimośrody wg katalogu GTV 2023 s. 248–249: mimośród ⌀15 w płycie (×13 do płyty 18 — na
  zamówienie, ×12 do 16; do 16 mm komplet WK-CAM-15-DOW63X45-KPL-1T), oś `MIMO_OS` = 34 mm od czoła, trzpień 6,3 × 45 (gwint
  11 mm w boku, 45 − 11 = 34). Położenia jak konfirmaty (2 na koniec płyty 300). Plan wierceń: w boku / przegrodzie ⌀5 × 12,
  we wzmocnieniu w czole ⌀8 × 34 i od wnętrza ⌀15 × 13. Zamówienie: mimośród + trzpień na złącze (bez konfirmatów i zaślepek
  płyty). Kolejność montażu (`biurkoMsgs`): trzpienie w boki → płyta na trzpienie jednej płyty (przegrody kontenera) → dosuń
  drugi bok → mimośrody od przodu pod blatem → blat (trzpienie wystają 34 mm, więc płyty nie wsunie się między stojące boki).
  W zamówieniu jedna pozycja „Mimośród z trzpieniem” (`MIMO_NAME`, kody GTV w opisie) — cena 0,30 zł za komplet
  (użytkownik 2026-11-13: „100 szt. za 30 zł”, `DEFAULT_HW_PRICES`).

## Co ustawiasz ręcznie
- Pomieszczenie, ciąg, szafka i widok — przyciski z rozwijaną listą. Ciąg domyślnie: ciąg
  zaznaczonej szafki z piętrem nad nim (cały pokój na raz jest za drobny do chwytania półek);
  „Wszystkie ciągi” — cały pokój i szafki wolnostojące; „Tylko zaznaczona szafka” — duży rysunek
  jednej szafki do przeciągania półek i szuflad.
- Zakładka po lewej wybiera, co pokazuje karta: Szafka, Szuflady, Półki, Drzwi i klapy,
  Przegroda, Cokół i nóżki; w szczegółowej także Korpus i plecy, Wzmocnienia, Wycięcia i kolizje.
- **Nagłówek karty** (krok 4 planu, 2026-11-10): ikona szafki (miniatura jak w palecie — `makIkonaSzafki`), nazwa,
  wymiary i opis: szerokości kolumn każdego poziomu, liczba drzwi, szuflad, półek, przegród i wzmocnień
  (`makOpisSzafki`, z geometrii liczonej w karcie na bieżąco — `geoKarty`).
- **Karty szczegółowe** (do zmiany, te same pola co w technicznym):
  - Korpus i plecy — plecy HDF / płyta / brak, HDF przybijane / we frezie, fronty na korpusie / wewnątrz, góra wieniec /
    blat z płyty (gdy szafka ma górę; pod blatem roboczym — napis);
  - Wzmocnienia — w wybranej kolumnie przełączniki (`MAK_WZM`): leżące u góry, stojące z przodu u góry, tylne u góry,
    na dole z przodu, na dole z tyłu, pionowe — każdy dodaje / zdejmuje jedno wzmocnienie (100 mm); mocowanie całej kolumny
    konfirmaty / wkręty 4 × 30; wymiary i strona pionowego — w technicznym;
  - Wycięcia i kolizje — wycięcie tylnego narożnika z lewej / z prawej (jest / brak, szer. × głęb.); elementy kolizyjne —
    liczba, zmiana w technicznym.

## Kontrole

Własnych nie ma — liczy aplikacja, a uwagi (błędy, ostrzeżenia) widać w nagłówku od razu po zmianie.

## Uwagi 2026-11-10 (lista użytkownika po pierwszych testach)

- **Zawiasy**: uwaga „za mało zawiasów wg tabeli GTV” przy jednych drzwiach w kolumnie podpowiada dwoje drzwi, gdy
  połówka (szerokość minus szczelina, przez 2, co najmniej 200 mm) potrzebuje mniej zawiasów albo mieści się
  w tabeli, z której jedno skrzydło wychodzi — przycisk „2 drzwi w kolumnie (po N zawiasy)” (`drzwi2:`; uchwyt,
  tip-on i lustro przechodzą na oba skrzydła). Przykład: 596 × 1994 (14,5 kg) — 4 zawiasy; dwoje po 297 mm (7,2 kg) — po 3.
- **Dodaj**: klik w zakładkę otwiera ją ze zwiniętymi sekcjami; prawy przycisk na szafce — „Elementy szafki”
  (przełącza na Dodaj → Elementy szafki). „Nowe szafki”: kolejność grup wg rodzaju zabudowy ciągu (kuchnia —
  kuchnia, wolnostojące, szafy; wolnostojąca — wolnostojące, szafy, kuchnia; szafa — szafy, wolnostojące,
  kuchnia), nagłówki grup zwijane; na start rozwinięte: nowy projekt (najwyżej jedna szafka) — wszystkie, kuchnia —
  tylko kuchnia, wolnostojąca — wolnostojące i szafy, szafa — szafy i wolnostojące. Wybór pamięta przeglądarka
  osobno dla każdego ciągu (`mp-mak-grupy`).
- **Ikony wzorów** mają podstawę z tego, co szablon tworzy (`bazaWzoru`): nóżki, cokół pod korpusem (cofnięty pasek)
  albo w obrysie (linia w korpusie); wzór „w ciąg” bierze cokół ciągu, jak `addCabinet`.
- **Elementy szafki**: klocki „Lustro”, „Uchwyt”, „Tip-on” (na drzwi / klapę kolumny).
- **Płyty (szczegółowa)**: płyta korpusu zawsze; „Fronty inne niż korpus” i „Półki inne niż korpus”
  (`frontSameAsBoard`, `shelfSameAsBoard` jak w technicznym) — dopiero wtedy paleta frontów / półek.
- **Wzmocnienia (szczegółowa)**: na rysunku każde wzmocnienie w ramce z wymiarem (czołowe szer. × wys., leżące —
  głębokość, pionowe — wys. × gł.); klik otwiera kartę Wzmocnienia jego kolumny. Trójkąty meblowe tam, gdzie program
  je liczy: przy przegrodzie z wzmocnieniami z obu stron („trójkąty meblowe / 1 konfirmat w środku”,
  `rail.przyPrzegrodzie`) i pod przegrodą niższą o płytę (`col.przegrodaNizszaMoc`). Mocowanie do boków /
  przegród całej kolumny: konfirmaty / wkręty 4 × 30 / trójkąty meblowe (`rail.mocowanie`, decyzja użytkownika
  2026-11-10 — trójkąty wszędzie, jak w technicznym; opis w `opisy/korpus.md`).
- **Elementy kolizyjne (szczegółowa)**: plan szafki z góry — klik dodaje element 80 × 80 w tym miejscu,
  przeciągnięcie przesuwa (co 5 mm, od bliższego boku i od tyłu), wybrany: szer. / gł. / od boku / od tyłu,
  wysokość cała albo część (od dna, wys.), zabudowa bez / auto / L / U, usuń (`cab.obstacles`, `MakPlanKolizji`).
- **Rysunek**: „Widok” zamiast „Powiększ” — z przodu (makieta z uchwytami), z boku, z góry, 3D (obracany
  przeciąganiem), 45° (cała zabudowa, stały widok); poza „z przodu” to podgląd jak w technicznym. Powiększony
  rysunek przesuwa się przytrzymanym lewym przyciskiem (poza szafką w ciągu — tę się przestawia). W szczegółowej
  przełącznik „Wymiary” (domyślnie włączony): wymiary ciągu jak w technicznym, szafki wolnostojącej (z blatem
  z płyty) jak jej widok z przodu.
- **Z góry**: wieniec / blat z płyty rysowany na wierzchu (półprzezroczysty, pełny obrys) — wcześniej leżał pod
  półkami i przegrodami i wyglądał jak osobny w każdej kolumnie, a blat biurka jak pod spodem.

## Uwagi 2026-11-11 (wymiary, ciąg, zamówienie)

- **Lista „Wymiary”** (szczegółowa, nad rysunkiem; `MakWymiaryMenu`, `MAK_WYM`, stan `przel.wym`): zaznaczasz, co ma być
  na rysunku — szerokości (szafki, ciąg), wysokości (nóżki / cokół, korpus, blat i razem), wymiary frontów, światła
  półek i wnętrza, wzmocnienia, blat nad zaznaczoną szafką; „wszystkie” / „żadne”. Na przycisku licznik „4/6”.
- **Wysokości** (`mak-wysokosci`): z lewej strony ciągu łańcuch dla zaznaczonej szafki — nóżki albo cokół, korpus,
  blat roboczy (gdy ją przykrywa) i obok cała wysokość od podłogi. Szafka wolnostojąca: wysokość z nóżkami / cokołem.
- **Światło poziomu** („wnętrze 684”): rysowane w środku zaznaczonej szafki, przy prawym boku, nisko nad dnem — nie
  obok szafki, gdzie wyglądało jak wymiar ciągu. Przy samych szufladach go nie ma (są wysokości frontów).
- **Wielkość napisów**: napis na froncie rośnie z frontem (`fsNapisuFrontu`, 20–46), a każdy napis rysunku ma na ekranie
  co najmniej ok. 10 px (`MakietaWidok`, najwyżej 48 jednostek rysunku — w bardzo szerokim widoku trzeba powiększyć).
  Wymiary (`text.wym`) mają 52 jednostki; liczba pod linią wymiarową stoi pod linią, nie na niej.
- **Wzmocnienia na rysunku** tylko przy otwartych frontach (przełącznik „Fronty” wyłączony albo zakładka
  „Wzmocnienia”, która sama otwiera fronty) i nie w zakładkach Szuflady / Półki / Drzwi / Przegroda (tam są ich
  uchwyty i napisy).
- **Zakładka „Ciąg”** (tylko przy zaznaczonej szafce z ciągu; `MAK_ZAKLADKA_CIAG`): nazwa ciągu, ile szafek i długość,
  wysokość i głębokość szafek (`setRunShared`), luz między korpusami, odsunięcie od ściany, blat roboczy;
  w szczegółowej także wspólny wieniec, wspólne dno i blenda nad szafkami całego ciągu (`cab.topFiller` każdej
  szafki); „Wyłącz szafkę z ciągu” (`assignCabinet(idx, null)` — szafka zostaje w pomieszczeniu jako wolnostojąca
  i oddaje wieniec / dno ciągu). Ten sam przycisk jest w karcie Szafka. Narożnik, podział blatu i cokołu,
  wieszanie — w trybie technicznym.
- **Półki (szczegółowa)**: przy kołkach — otwór od przodu / od tyłu i od czego liczona wysokość otworów
  (`shelfPin`, `pinDatum`); szafka, która nie stoi — zawieszki ścienne auto / zawsze / nigdy i na listwie /
  na haczykach (`hangers`, `hangerMode`) — jak karta „Montaż półek i zawieszenie”.
- **Korpus i plecy (szczegółowa)**: blenda nad szafką (jest / nie ma, wysokość).
- **Szafka (szczegółowa)**: notatka montażowa (`cab.note`, idzie do PDF) i pod nią kolejność montażu z projektu.
- **Kafelek „Zamówienie”** (szczegółowa): zamiast rysunku pokazuje karty Formatki, Rozkrój na płycie, Produkty do
  zamówienia i Wycena — te same co w trybie technicznym (`kartyZamowienia` w `App`, rysowane w jednym miejscu naraz:
  `zamWMak`). Klik w inny kafelek wraca do rysunku.

- **„Wszystkie opcje: … ›”** (szczegółowa, na dole karty; `MAK_PELNE`, `mak-pelne-otworz`): karta trybu technicznego
  wysuwa się z prawej jako szuflada nad makietą (`makPelne` w `App`, `main[data-szuflada]`, zamknięcie przyciskiem albo
  klikiem w tło) — te same pola i kontrole, bez drugiej implementacji. Ciąg → „Ciąg meblowy” (narożnik, podział blatu
  i cokołu, wieszanie, poziom montażu, położenie na ścianie, prześwit, wysunięcie szafki); Szafka → „Ciąg meblowy”
  i „Korpus”; Korpus i plecy → „Korpus”; Cokół i nóżki → „Cokół” i „Nóżki”; Szuflady / Półki / Drzwi / Przegroda /
  Wzmocnienia → „Struktura wnętrza”. Decyzja użytkownika 2026-11-11 (dołożyć: ciąg, korpus / cokół / nóżki, drzwi
  i szuflady; płyty i luzy drzwi zostają w technicznym).
- **„Kolory płyt” wyłączone** (szczegółowa): neutralna szarość (`MAK_SZARE`), blat roboczy zostaje brązowy, wieniec
  i blat z płyty jak reszta korpusu (decyzja użytkownika 2026-11-11). Makieta prosta — jasna paleta `MAK_JASNE`.

- **Sprzęt upuszczony na słupek** (szafka wyższa niż 1500 albo `slupek`; 2026-11-11): dostaje własny poziom szafki
  o wysokości swojej wnęki (środek zakresu z karty albo front − 9 mm) — nad sprzętem, na który go upuszczono, albo na
  dole poziomu bez sprzętu; poziomy dostają obecne wysokości, najwyższy bez sprzętu zostaje auto (`wstawAgd`).
  Wcześniej drugi sprzęt zastępował pierwszy.
- **Szuflady**: „usuń szuflady” (`mak-szuflady-usun`) — kolumna / poziom wraca do jednych drzwi.
- **Ściana**: wysokość (`run.ceiling`, pole `mak-sciana-wys` nad rysunkiem i w zakładce Ciąg); bez niej tło ściany
  kończy się 300 mm nad szafkami; niższa niż szafki — ostrzeżenie i „wyrównaj do szafek” (`mak-sciana-wyrownaj`).
  Za krótka ściana: „wydłuż do N” w zakładce Ciąg i przycisk przy uwadze (`wallw:<mm>:<ciąg>`).
- **Kolory płyt włączone** = prawdziwe kolory płyt (`realColors` w `projRys`). Karta Drzwi — grupy w osobnych wierszach.
  Nazwy szafek pod blatem na froncie. Napis „W × H” przy uchwytach tylko bez wymiarów na rysunku.

- **Szuflady w słupku**: w poziomie wyższym niż 900 mm szafki ponad 1500 przycisk liczby szuflad zakłada własny
  niski poziom na dole (po 180 mm na szufladę), reszta zostaje nad nim (`slupekSzuflady`). Sprzęt kliknięty z palety
  staje nad najwyższym sprzętem słupka albo w najniższym poziomie z drzwiami; po wstawieniu otwiera się jego karta.
- **Słupek głębszy niż ciąg** (decyzja 2026-11-11): przy uwadze o głębokości przycisk „To słupek — tył przy ścianie,
  front wysunięty o N mm” (`slupekgl:<mm>:<pozycja>` → `item.offset`, `cab.slupek`); pozostałe szafki zostają przy
  ścianie. Potem kontrola tylko z blatem: korpus głębszy niż blat — „Za głęboki słupek”. Opis reguły: `opisy/ciagi.md`.
- **Za szeroki blat przez wysunięcie szafki**: przyciski „Zmniejsz wysunięcie szafki o N mm” — o cały nadmiar (nawis
  10 mm) albo tyle, żeby arkusz kończył się 1 mm przed frontem (`wysun:<mm>:<ciąg>`); blat zawsze zakrywa front.

- **Słupek w ciągu z blatem** (2026-11-11): dostaje wieniec, para wzmocnień pod blat znika (`slupkiZWiencem`, po każdej
  zmianie projektu) — blat kończy się przy jego boku. Sprzęt wstawiony dawniej na cały poziom słupka: przyciski
  wysokości i nowy sprzęt najpierw zmniejszają ten poziom do wnęki (`makWnekaH`).
- **Linia między poziomami szafki** do przeciągania także w zakładkach Szuflady i Dodaj (AGD); nad linią sprzęt —
  jego wnęka zostaje, różnicę bierze najwyższy poziom (sprzęt jedzie w górę / w dół).
- **Płyta, zlew, sprzęt na blacie**: przeciągnięcie na rysunku z góry na inną szafkę pod blatem przenosi pozycję
  (`przenAgd`). **Wygląd sprzętów** jak w makiecie „Dodaj”: szyba piekarnika, szyba i pokrętła mikrofali
  (`SprzetElewacja`).
- „Wolne / brakuje” na ścianie liczone z miejscem na narożnik.

- **Reszta różnic z makietą „Dodaj”** (użytkownik 2026-11-11: „wszystko zrób”):
  - **cała szuflada do chwycenia** (zakładka Szuflady, `data-u="szuflSz"`): górna połowa ciągnie linię nad nią, dolna —
    pod nią; linia to granica z sąsiednią szufladą (`szufl`) albo — na skraju poziomu szafki z jedną kolumną — przegroda
    do poziomu obok (`poziom`), jak „Szuflada + drzwi” (`makSzuflLinie`). **Dwuklik / prawy przycisk** na szufladzie —
    okienko z wysokością frontu (`mak-szuflada-wys`, `makSzuflWys`): różnicę bierze szuflada obok albo poziom obok;
  - **„Szuflada + drzwi”** jednym przyciskiem (Szuflady i Drzwi i klapy, szafka dolna z jedną kolumną; wzór palety
    „Dolna, szuflada + drzwi”): dwa poziomy szafki — szuflada i drzwi (1 albo 2, półki zostają przy drzwiach);
    front szuflady 170 mm u góry, 200 na dole (`MAK_SZ_G`, `MAK_SZ_D`; wysokość poziomu dobrana z geometrii tak,
    żeby front miał tyle). W Szufladach: u góry / na dole, 1 / 2 drzwi, „Szuflada typowa (170 / 200 mm)” po zmianie
    (`makSzufDrzwiUklad`, `makUstawSzufDrzwi`). Wzór palety dopasowuje front po wstawieniu (`opcje.poDodaniu`
    w `addCabinet` — dopiero wtedy szafka ma wysokość ciągu i blat zamiast wieńca);
  - **sprzęt do innej szafki**: piekarnik / mikrofala / ekspres / lodówka chwycone na rysunku (z przodu; w słupku
    także za uchwyt `sprzetY` w Dodaj) — po 8 px zielone ramki na szafkach, gdzie może stanąć (`makCelPrzeniesienia`:
    słupek — własny poziom; szafka z wolną prostą kolumną, piekarnik nie w ciągu górnym; mikrofala / ekspres nad
    szafką pod blatem — na blat; lodówka do zabudowy — tylko słupek); upuszczony na ramce wychodzi ze starej szafki
    (`makWyjmijSprzet`: w słupku jego poziom znika, inaczej kolumna wraca do drzwi) i staje w nowej z tymi samymi
    ustawieniami (`wstawAgd` z `a.dane`). Geometria szafki, która nie jest zaznaczona, liczona na miejscu (`geoSzafki`);
  - **„Przesuń” dotknięciem** (telefon): w karcie sprzętu „Przesuń do innej szafki” (sprzęt w kolumnie, płyta, zlew,
    sprzęt na blacie), w karcie Szafka „Przesuń w ciągu”; pasek na dole („Przesuwasz: … — dotknij zieloną ramkę”,
    Anuluj / Esc), dotknięcie szafki w ramce kończy (`przesunNa`). Ramki przycięte do widocznej części rysunku;
  - **„Co zrobi program”** w karcie sprzętu (`makCoZrobiSprzet`) i w karcie Szafka (`makCoZrobiSzafka`) — tylko to,
    co wynika z danych i co program naprawdę sprawdza;
  - **płyta indukcyjna** jak w makiecie: z góry ciemne szkło i jasne pola grzewcze (dwa większe, dwa mniejsze),
    z przodu cienkie szkło na blacie i przerywana kaseta pod nim; zlew z przodu — bateria i przerywana komora
    (`wyciecie-front`, tylko makieta);
  - lodówka do zabudowy: pole „dolny front — wysokość” przy 2 frontach było już w karcie (`agd-lod-dolny`) — sprawdzone
    testem (zapis i front 700 na rysunku).
- **Sprzęt w słupku jak klocki** (użytkownik 2026-11-12: „mikrofala w słupku dalej w kosmosie”, „nie widzę, żeby były
  razem”): poziom ze sprzętem ma zawsze wysokość swojej wnęki (`makWnekaH`), przerwa pod sprzętem albo między sprzętami
  to osobny poziom z frontem („wypełnienie”), najwyższy poziom bez sprzętu bierze resztę (auto). Przesunięcie sprzętu
  (pole „dół wnęki”, −/+50, „Na wysokość blatu”, „Pod blat”, „Do szafek górnych”, uchwyt na rysunku; `makSlupekWneka`)
  zmienia tylko wypełnienie pod nim — w górę rośnie albo dochodzi nowe (najmniej 60 mm), w dół maleje albo znika
  i sprzęt siada na tym, co pod nim; sprzęt nie wyjdzie nad szafkę i nie wejdzie w sprzęt pod nim. Wcześniej rósł poziom
  pod sprzętem — gdy stał tam piekarnik, jego poziom puchł (1982 mm), a mikrofala lądowała nad słupkiem. „Razem”
  (`makSlupekRazem`) usuwa wypełnienia między dwoma sprzętami (półka między nimi), „Zamień” zamienia poziomy. Karta
  sprzętu idzie za nim, gdy dochodzi wypełnienie (zmieniony numer poziomu). W dół: wypełnienia pod nim maleją albo
  znikają od najbliższego — sprzęt pod nim zjeżdża razem (jak w makiecie: sprzęty, które by nachodziły, przesuwają się).
  **Domyślne wysokości jak w makiecie „Dodaj”** (stos jeszcze nieustawiany): sam piekarnik / sama mikrofala — dół na
  wysokości blatu roboczego (858), dwa sprzęty — dolny na 700 od podłogi, drugi na nim (półka między). Projekt w stanie „w kosmosie” (poziom sprzętu
  ponad 60% szafki, a nad nim drugi sprzęt) naprawia się przy wczytaniu i każdej zmianie (`slupkiSprzetNorma`).
- **Razem bez odstępu** (2026-11-12: „razem to razem — tylko półka między nimi, bez przestrzeni; jak chcę osobno, dodam
  półkę”): w makiecie poziom sprzętu w słupku ma dokładnie wysokość wnęki (`makSlupekNorma`, `makSlupekWneka`), sprzęty
  jeden na drugim jadą razem (przesuwa się dół stosu), linii między poziomami przy sprzęcie nie ma (przeciągnięta robiła
  pustą wnękę nad sprzętem) — sprzęt ma swój uchwyt (turkusowy chwyt u góry, zakładki Dodaj / Szafka / Przegroda /
  Szuflady). Projekt z pustą wnęką między dwoma sprzętami naprawia się przy wczytaniu (`slupkiSprzetNorma`). Dwa sprzęty
  domyślnie: dolny nisko tak, żeby górny (mikrofala) miał dół do 1300 od podłogi (makieta: 700 — mikrofala wypadała 1308).
- **Jak w makiecie „Dodaj”** (porównanie 2026-11-12): wysokości słupka 1800 / 2000 / 2120 / 2200 i „równo z górnymi”
  (`mak-slupek-wys`); dół szafek górnych od podłogi z −/+50 i „jak domyślnie” w kartach Szafka i Ciąg szafki górnej
  (`mak-gorny-dol` — prześwit nad blatem `run.clearance`, cały ciąg górny; w aplikacji szafki górne wiszą ciągiem, więc
  nie pojedynczo jak w makiecie); płyta / zlew „50 od przodu (typowo)”. Inaczej niż w makiecie: „bez szafki górnej”
  to w aplikacji usunięcie szafki z ciągu górnego; łączenie wzmocnienia biurka — konfirmaty / wkręty / trójkąty
  (zakładka Wzmocnienia), kołków z mimośrodem aplikacja nie ma.
- **Rzut z góry z wymiarami** (szczegółowa, „Wymiary → z góry”; 2026-11-12: „brakuje wymiarów od ściany do ciągu,
  słupka i blatu”): przy wolnym końcu ciągu łańcuch — odsunięcie od ściany, korpus (+ plecy przybijane), front; obok
  blat od ściany; szafka głębsza albo wysunięta (słupek) — od ściany do jej lica i „wysunięty N” (`mak-wym-zgory`).
  W karcie Szafka pole „wysunięcie przed lico ciągu” (`item.offset`); cały ciąg — „Odsunięcie od ściany” w zakładce Ciąg.
- **Przełącznik „AGD”** (jak w makiecie „Dodaj”, 2026-11-12): wyłączony — bez sprzętu na rysunku (wnęki puste, płyta i zlew
  jako samo wycięcie, bez sprzętu na blacie); domyślnie włączony (`przel.agd !== false`).
- **3D i 45°**: przycisk „otwarte / zamknięte” (ten sam co „Fronty”) i suwak kąta 0–110° (`kat3d`), jak w trybie technicznym.
- **Z makiety „Dodaj” (porównanie 2026-11-13)**: karta płyty / zlewu — „Do końca blatu zostaje N mm, do tyłu N mm; środek
  wycięcia … od środka szafki” (`agd-polozenie`); karta okapu w szafce — „Od płyty do okapu: N mm” (poniżej 650 na pomarańczowo),
  „Pod okapem nie ma płyty”, „Wysokość okapu”: dół okapu od podłogi z −/+50 (`agd-okap-krok`) — przesuwa tylko szafkę z okapem
  (decyzja użytkownika 2026-11-13, jak w makiecie): szafka krótsza albo dłuższa, góra równo z innymi górnymi (`cab.dolGorny`,
  `dolGornej`; „jak inne szafki górne” wraca); lodówka wolnostojąca — rozmiary
  60 × 185 / 60 × 203 / 70 × 203 / side by side 91 (`LODOWKI_WOLNE`), luzy z lewej / z prawej / nad / z tyłu, miejsce
  w ciągu = luzy + lodówka (zmiana luzu albo rozmiaru zmienia szerokość pozycji); drążek — „pod drążkiem ↕N” w Półkach
  (`mak-pod-drazkiem`); przełącznik „Wyposażenie” (wcześniej „AGD”) i legenda nad rysunkiem (`mak-legenda`: zielone ramki,
  „góra: blat z góry · dół: widok z przodu”, „„Wyposażenie” wyłączone”).
- **Z makiety „Dodaj” — runda 2 (2026-11-13: „jeszcze coś do wyrównania? sprawdź, żebym nie był rozczarowany”)**:
  rzut z góry — przy końcu blatu „↑ górne N” (ile głębokości zasłaniają szafki górne z frontem albo okap kominowy) i „↓ wolne N”,
  przerywana linia frontów szafek górnych (`gorne-nad-blatem`), słupek podpisany „słupek”; opis zlewu z góry w makiecie bez
  „ociekacz z prawej” (był dłuższy niż zlew); szafka górna — „dół tej szafki od podłogi (góra zostaje)” −/+50 i „Jak inne”
  (`cab.dolGorny`, ta sama zasada co okap) oraz „góra szafek górnych od podłogi — cały ciąg górny” (wysokość szafek ciągu,
  szafka z własnym dołem zostaje z górą równo — `setRunShared`); nazwa szafki pod komorą zlewu / kasetą płyty i nie na uchwycie
  szuflady (`makNazwaOd`); klocki wzmocnień w makiecie szczegółowej („Para pod blat”, „Leżące”, „Stojące”, „Pionowe” — dokładają,
  zdejmuje zakładka Wzmocnienia).
- **Z makiety „Dodaj” — runda 3 (2026-11-13: „sprawdź wszystko po kolei, żeby już nie wracać”)**:
  - **karta Szafka w pełnej wersji** (szafka z jednym poziomem): przy wysokości podpowiedź („Wysokość 720 — pod blat, jak cały ciąg
    dolny.”, szafa — „cokół / nóżki pod spodem”, wolnostojąca — „całkowita z cokołem w obrysie” / „korpus — nóżki pod spodem”,
    biurko — „Do wierzchu blatu”); **Front**: 1 / 2 drzwi, klapy, bez frontu, 1–4 szuflady, „Szuflada + drzwi” (słupek w kuchni —
    bez szuflad, z podpowiedzią; w układzie „szuflada + drzwi” inny front wraca do jednego poziomu); przy szufladach „Wysokości
    szuflad od dołu: …”, „Szuflady po równo”, „Same szuflady — półek ani przegrody tu nie ma”; **Wnętrze**: półki − N + (osobno
    lewa / prawa przy przegrodzie, za drzwiami w „szuflada + drzwi”), „Przegroda” (wł. / wył., druga kolumna jak pierwsza),
    „Drążek” (szafa albo szafka od 1400 mm), „Półki po równo”; **Kolumny — światło** (`mak-kol-swiatlo`): pola lewa / prawa
    (jedno liczy drugie, każda ≥ 100 mm — `MAK_MIN_KOL`), „Przegroda na środek”; **Wzmocnienia**: dolna w kuchni — „wzm. leżące /
    stojące / pionowe” i „para pod blat” (leżące z przodu + tylne stojące, jak klocek), szafa i wysoka — tylko pionowe; przełącza we
    wszystkich kolumnach. Szafka z poziomami, ze sprzętem albo z kolumną z poziomami — podpowiedź, w której zakładce to zmienić.
    Szafka górna — jak karta górnej w makiecie: front 1 / 2 drzwi, Klapa ↑, Bez frontu, półki i „Przegroda”; bez szuflad, drążka
    i wzmocnień (te — w swoich zakładkach); w innych zakładkach „Wysokość i całą szafkę górną zmienisz w zakładce Szafka.”
  - **biurko**: szuflady w kontenerze 2 / 3 / 4 (`mak-kontener-sz`), ich wysokości od dołu, „Szuflady po równo”, „Miejsce na nogi
    między bokiem a kontenerem: N mm”.
  - **każda zakładka szafki** (Drzwi, Szuflady, Półki, Przegroda, Wzmocnienia): klocki nad kartą także przy zaznaczonej szafce,
    pod kartą „Co zrobi program” i „Całą szafkę (szerokość, wysokość, przesuwanie) zmienisz w zakładce Szafka.”; w Szafce —
    zwinięte „Wzory szafek — dołóż do ciągu” nad kartą (`mak-wzory-przelacz`, pamięta przeglądarka) i pod kartą lista „Ciąg dolny
    (N) / Ciąg górny (N) / W ciągu / Na rysunku” z × przy każdej pozycji (`MakListaCiagu`).
  - **Przegroda**: „Kolumny — światło” w zakładce, dwuklik / prawy przycisk na przegrodzie — okienko „z lewej / z prawej”, „Na środek”
    (`mak-przegroda-okno`, `makWylicz` z `d.sw`); Esc zamyka.
  - **rysunek**: z przodu wymiar „od płyty do okapu” przy szafce z okapem / okapie kominowym (`mak-okap-plyta`; poniżej 650 —
    pomarańczowo „N < 650”, `okapNadPlyta`); lodówka wolnostojąca — przerywane miejsce w ciągu i luzy z lewej / z prawej / nad
    (`lodowka-miejsce-rys`, `lodowka-luz`); z góry „wystaje N przed korpusy” (`lodowka-wystaje`); kaseta płyty / komora zlewu na
    pomarańczowo, gdy uwagi blatu mają przy niej błąd (`wyciecie-pod-blatem[data-zle]`), głębokość komory podpisana; zaznaczone
    wycięcie (Dodaj → AGD) — z góry wymiar od początku blatu i „od przodu N” (`wyciecie-wymiary`); płyta szersza niż szafka —
    z góry pomarańczowa ramka „szersza niż szafka”; „↑ górne / ↓ wolne” za końcem całego ciągu (nie na lodówce).
  - **alarm nad rysunkiem**: „Ciąg nie mieści się na ścianie — N mm na ścianie M mm, brakuje K mm” z „Poszerz ścianę do N mm”
    i „Usuń …” (ostatnia pozycja ciągu; `mak-alarm-sciana`).
  - **Esc** w trakcie przeciągania na rysunku (półka, szuflada, przegroda, szafka, sprzęt, przewijanie) — przerywa bez zmian.
  - Inaczej, bez zmian: makieta ma ciemny motyw (gdy system jest ciemny), aplikacja — jasny.
- **Z makiety „Dodaj” — runda 4 (2026-11-13: „czy jeszcze mamy jakieś różnice?”)**: porównane wszystkie napisy makiety (183) i karty
  AGD każdego sprzętu. Dorobione: mikrofala / ekspres na blacie — „szer. × głęb.” i „wysokość” z karty modelu (`naBlacie[k].w / d / h`,
  „Wróć do typowych”) i „Głęboka: N mm + 40 od ściany — wystaje N mm przed blat”; lodówka wolnostojąca — szerokość, głębokość
  i wysokość w karcie (szerokość zmienia miejsce w ciągu: luz + lodówka + luz); lodówka do zabudowy — „Wnęka: szer. 560–570, głęb.
  od 550…”, typowe wnęki, przy 2 frontach bez wpisanego dolnego — uwaga; płyta / zlew — „Kaseta schodzi N mm od wierzchu blatu —
  M mm pod blat”; okap szerszy niż szafka — w karcie i w uwagach (`okapSzerszyMsgs`); zmywarka / lodówka / okap kominowy w ciągu —
  „Przesuń w ciągu” w karcie AGD; uwagi blatu: dwa wycięcia nachodzą / mniej niż 50 mm między nimi, wycięcie bliżej niż 30 mm
  przedniej krawędzi (opis w `sprzety.md`); karta Szafka — nazwy sprzętu w szafce („W szafce stoi sprzęt (piekarnik)”), pozycja
  ciągu bez korpusu i okap kominowy — „zmienisz w karcie sprzętu: Dodaj → AGD”, szafka górna z okapem — „Pod szafką okap —
  przesuwa się razem z dnem szafki”. Z góry „wystaje N” w obrysie lodówki (wcześniej wychodził poza rysunek bez ciągu górnego).
  **Para pod blat** (decyzja użytkownika 2026-11-13): płaskie wzmocnienie z przodu i stojące z tyłu — tak jak dotąd w aplikacji
  (makieta: leżące + stojące z przodu — nie przenosimy). Ciemny motyw makiety — zostaje bez zmian (decyzja użytkownika).
- **„Bez szafki górnej”** (decyzja użytkownika 2026-11-13, z makiety „Dodaj”): w karcie Szafka szafki z ciągu górnego —
  zamienia ją na **wolne miejsce** tej samej szerokości (np. okno albo otwarta ściana; pozycja bez korpusu `sprzetCiagu.typ = "wolne"`,
  w zamówieniu nic, na rysunku przerywany obrys „wolne — np. okno”, w 3D / z boku nic, listwa zawieszek ma przerwę);
  „Przywróć szafkę górną” wraca do poprzedniej szafki (`cab.poprzednia`) z obecną szerokością (`cabWolnegoMiejsca`, `cabZWolnegoMiejsca`).
- **Klik w widokach podglądu** (2026-11-12: „na widoku 45 stopni nie da się zaznaczyć szafki”, „klikalność szafek poza 3D”):
  z boku, z góry i 45° klik w szafkę ją zaznacza (45° — obrys bryły na zielono, każda ściana bryły ma numer szafki;
  z boku — profil wspólny dla kilku szafek: kolejny klik zaznacza następną), klik obok nie zdejmuje zaznaczenia;
  w 3D (obracanym) — bez zaznaczania. W widokach podglądu nie ma przeciągania (zmiany — w widoku „Z przodu”).
- **Wyposażenie we wszystkich widokach**: 45° i 3D — płyta (ciemne szkło, pola grzewcze jako kwadraty, kaseta pod blatem),
  zlew (rant, komory, bateria), sprzęt na blacie, sprzęt w słupku; z boku — sprzęt w słupku (bryła i front), szkło płyty i
  kaseta, komora zlewu z baterią, sprzęt na blacie (klik — karta sprzętu) oraz wzmocnienia pod blatem; kaseta / komora
  wchodząca we wzmocnienie szafki pod nią — część wspólna na czerwono i „kaseta we wzmocnieniu” (to samo, co błąd w uwagach).
  Przełącznik „AGD” chowa to wszystko także w 45°, 3D i z boku.
- **Karta płyty**: kaseta między bokami szafki — „Kaseta 554 mm we wnętrzu szafki 564 mm: zapas 5 / 5 mm”; wycięcie na boku —
  błąd w „Uwagach” (to sprawdzał program już wcześniej).
- **Wnęka sprzętu w słupku niższa niż sprzęt** — program sam ją podnosi do wnęki sprzętu (`slupkiSprzetNorma`).
- **Sprzęt do zabudowy nigdy za drzwiami** (mikrofala, piekarnik, ekspres; użytkownik 2026-11-13: „ma stać na półce i od góry też
  mieć półkę, tak by była w środku”): poziom sprzętu to jego wnęka między dwiema płytami, front sprzętu zamiast drzwi; za niska
  wnęka rośnie sama, a front wchodzący na drzwi, klapę albo szufladę to błąd w „Uwagach” z przyciskiem „Poziom N mm”.
  W projekcie użytkownika (wersja 42) mikrofala miała wnękę 250 mm i drzwi nad nią zasłaniały jej front — po wczytaniu
  wnęka ma 373 mm.
- Na rzucie z góry blat nie przechwytuje kliknięć (szafkę pod nim da się wybrać); napis przy ścianie: „na ścianie wolne
  N mm długości” / „brakuje N mm długości”.
- **Bok szafki z sąsiedniej ściany w rogu** (widok z przodu): wysokość szafki w rogu (albo szafek ciągu bez słupków) —
  wcześniej najwyższej szafki ciągu, po dodaniu słupka „bok 581” szedł do 2000 mm.
- **Płyta / zlew / sprzęt na blacie przeciągane z góry** (2026-11-12: „zginęły podświetlenia, gdzie można ją przenieść”):
  zielone ramki na szafkach pod blatem (z góry i z przodu), pod wskaźnikiem podpis „Płyta … → „Szafka 2” — puść”
  albo „upuść na zielonej ramce” (`mak-niesiesz`; tak samo przy sprzęcie w kolumnie).
- W zakładce Półki przy wymiarach świateł (szczegółowa) bez napisów „↕N” przy półkach — dublowały wymiary i wchodziły
  na „wnętrze N”; „gł. N” w rzucie z góry w środku szafki (wchodził na rzut ciągu pod szafką wiszącą).
- Klik po przeciągnięciu jest tłumiony tylko raz (`tlumKlikNa`, 60 ms) — wcześniej blokada zostawała, gdy po
  puszczeniu nie przyszedł klik, i zjadała następny prawdziwy klik.

## Czego jeszcze nie ma

Kolejne kroki (`makiety/BRAKI.md`, D):
- złącza boków, wysokość / głębokość wzmocnienia i strona pionowego (zostają w technicznym).

## Gdzie w kodzie i testy

- **Kod**: `MakietaWidok`, `MakietaKarta`, `MakietaPaleta` (`MAK_PALETA`, `MAK_KLOCKI`), `MakietaWolnostojace`, `MakietaUchwyty`, `makWylicz`, `Rozwijana`;
  `makietaZmien` w `App`; `onPick` / `zazn` / `maxH` / `nakladka`
  w `AssemblyView` i `AssemblyTopView`; stan `tryb` w `App`.
- **Test**: `testy/makieta.mjs` (tryb, rysunek, zaznaczanie), `testy/makieta2.mjs` (uchwyty i zapis),
  `testy/makieta3.mjs` (pytanie o wysokość w ciągu i w narożniku), `testy/makieta4.mjs` (przyciski karty),
  `testy/makieta5.mjs` (paleta, klocki, karta do schowania, duży rysunek), `testy/makieta11.mjs` (uwagi 2026-11-10),
  `testy/makieta12.mjs` (lista „Wymiary”, wysokości, zakładka „Ciąg”, zawieszki, blenda, notatka, „Zamówienie”,
  napisy nieucięte i czytelne), `testy/makieta15.mjs` (runda 3 z makietą „Dodaj”: pełna karta Szafka, biurko, klocki i „Co zrobi”
  w zakładkach, lista ciągu, przegroda, rysunek — okap–płyta, lodówka, kaseta / komora, wycięcie, alarm ściany, Esc),
  `testy/makieta16.mjs` (runda 4: karty AGD, kontrole wycięć, karta Szafka przy sprzęcie i pozycji ciągu).
