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
  ostrzeżenie, gaz 750 — informacja), bez płyty pod okapem — informacja. Kominowy (w ciągu górnym bez szafki) — jeszcze nie;
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
- **Dwuklik na półce** (zakładka Półki) — wpisanie światła pod nią (najniższa — od dna, wyższa — od półki niżej);
  reszta przechodzi do światła nad nią, ostatnie zostaje auto (jak przy przeciąganiu, `makWylicz` z `d.sw`).
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
  przy frontach „uchwyt / tip-on” (`col.handles[i]`, `col.otwieranie[i] = "tipon"`). Tip-on zostaje
  przy zmianie liczby drzwi i przy klapie. Szuflady w kolumnie zmieniają się w drzwi.
- **Szuflady**: 1–5 w kolumnie (`col.drawers`, fronty auto, system z szafki / ciągu jak w trybie
  technicznym — `systemKontekstu`).
- **Półki**: „− N +” (`shelfTargets`, wszystkie światła na auto) i „drążek” (`col.drazki`) w najwyższym
  świetle — przy zmianie liczby półek zostaje na górze.
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
  - piekarnik, mikrofala, ekspres, lodówka do zabudowy — sprzęt w kolumnie, na którą upuścisz
    (klik — pierwsza prosta kolumna zaznaczonej szafki);
  - lodówka podblatowa i wolnostojąca, zmywarka i zmywarka wolnostojąca — pozycja w ciągu jak szafka;
  - mikrofala i ekspres wolnostojące — na blat (tylko rysunek);
  - okap — w przygotowaniu.
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
    (600 w głąb, 5 półek, 2 drzwi, cokół w obrysie i nóżki), Biurko.
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
- Jeszcze nie ma: biurko z kontenerem szuflad.

## Co ustawiasz ręcznie

- Pomieszczenie, ciąg, szafka i widok — przyciski z rozwijaną listą. Ciąg domyślnie: ciąg
  zaznaczonej szafki z piętrem nad nim (cały pokój na raz jest za drobny do chwytania półek);
  „Wszystkie ciągi” — cały pokój i szafki wolnostojące; „Tylko zaznaczona szafka” — duży rysunek
  jednej szafki do przeciągania półek i szuflad.
- Zakładka po lewej wybiera, co pokazuje karta: Szafka, Szuflady, Półki, Drzwi i klapy,
  Przegroda, Cokół i nóżki; w szczegółowej także Korpus i plecy, Wzmocnienia, Wycięcia i kolizje.

## Kontrole

Własnych nie ma — liczy aplikacja, a uwagi (błędy, ostrzeżenia) widać w nagłówku od razu po zmianie.

## Czego jeszcze nie ma

Kolejne kroki (`makiety/BRAKI.md`, D):
- AGD (brakujące w aplikacji, A1);
- karty szczegółowej ze wszystkimi funkcjami.

## Gdzie w kodzie i testy

- **Kod**: `MakietaWidok`, `MakietaKarta`, `MakietaPaleta` (`MAK_PALETA`, `MAK_KLOCKI`), `MakietaWolnostojace`, `MakietaUchwyty`, `makWylicz`, `Rozwijana`;
  `makietaZmien` w `App`; `onPick` / `zazn` / `maxH` / `nakladka`
  w `AssemblyView` i `AssemblyTopView`; stan `tryb` w `App`.
- **Test**: `testy/makieta.mjs` (tryb, rysunek, zaznaczanie), `testy/makieta2.mjs` (uchwyty i zapis),
  `testy/makieta3.mjs` (pytanie o wysokość w ciągu i w narożniku), `testy/makieta4.mjs` (przyciski karty),
  `testy/makieta5.mjs` (paleta, klocki, karta do schowania, duży rysunek).
