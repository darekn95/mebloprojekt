# Audyt godzinny — N66, 17.10.2026

## N66 [P2] Blaty na różnych wysokościach dostają złącza i opis nieistniejącego styku

**Odtworzenie:** dwa prostopadłe ciągi z blatami600×38 mm, cokół100; pierwszy H720/W1200 z prawidłowo ustawionym ślepym rogiem (fix611 przy rogu, jedne drzwi na resztę), drugi H720/W600. Następnie podnieść drugi korpus oraz wysokość jego ciągu do1000 mm. W obu szafkach brak wieńca i wzmocnienia pod blatem.

**Wynik:** pierwszy blat w3D ma zakres Y820..858, drugi Y1100..1138. Różnica spodów280 mm, brak wspólnej krawędzi na tej samej wysokości. Zamówienie mimo to zawiera2 „Złącza do blatów śrubowe”, opis „róg z blatem C1, na styk —2 szt.”. `worktopMsgs` dla obu ciągów zwraca pustą listę. `runCornerMsgs` nie ostrzega o różnicy wysokości i zapewnia, że drugi blat dojeżdża do przedniej krawędzi pierwszego. Wariant kontrolny obu H720 ma rzeczywisty styk i te same2 złącza prawidłowo.

**Oczekiwane:** złącza dodawać do rzeczywistych styków. Jeśli blaty mają się łączyć, wskazać niezgodność poziomów i możliwość wyrównania. Jeśli różne poziomy są zamierzone, nie opisywać ich jako jednego styku i nie doliczać do niego złączy. `runTopZlacza` sprawdza istnienie obu blatów i narożnika, ale nie ich położenie w pionie.

Źródło `szafki.jsx` blob `688b93c92636d6e5909979d68a8ce9bf5f4e6732`. Dowód lokalny `audit-hour-worktop-heights.json`, dwie wysokości, bryły, produkty i uwagi. Odrębne od B3 (wcześniejszy brak złączy): teraz występują mimo braku styku. Bez zmian aplikacji i projektu użytkownika.

---

# Audyt godzinny — N65, 17.10.2026

## N65 [P3] Blaty łączone na45° pozostają w3D pełnymi prostokątami i nakładają się na siebie

**Odtworzenie:** dwa prostopadłe ciągi, po jednej szafce600×720×560, cokół100, blat600×38. Narożnik at=end, owner=of. Porównać połączenie „Blat na styk” i „Na45° (łyżwa)”.

**Wynik:** na styk bryły blatów mają600×38×600 i581×38×600 mm; ich zakresy kończą/zaczynają się na Z−600 i nie przenikają. Po wybraniu45° zamówienie prawidłowo dopisuje „łyżwa45° — jeden koniec”, a długości zmieniają się na600 i1181 mm. Bryły3D pozostają jednak pełnymi prostokątami: pierwszy zakres X0..600/Y820..858/Z−600..0, drugi X0..600/Y820..858/Z−1181..0. Nakładanie600×38×600 mm. Nie ma ukośnego podziału narożnika.

**Oczekiwane:** model3D odcina naroża według deklarowanego połączenia i pokazuje rzeczywisty styk45°, zamiast dwóch pełnych płyt w tym samym miejscu. Flagi skos0/skos1 trafiają do nazwy formatki, ale nie zmieniają brył `Assembly3D`. Sprawdzić też rzut z góry i dokumentację cięcia; w tym zgłoszeniu bezpośrednio potwierdzono bryły3D i opis zamówienia.

Wniosek dotyczy wizualizacji kształtu, nie braku opisu obróbki w zamówieniu: opis45° istnieje. Nie mylić z N23 (nieciągłość blatu przy słupku). Źródło `szafki.jsx` blob `688b93c92636d6e5909979d68a8ce9bf5f4e6732`. Dowód lokalny `audit-hour-worktop-mitre.json`, dwa warianty z bryłami i formatkami. Bez zmian aplikacji i projektu użytkownika.

---

# Audyt godzinny — N64, 17.10.2026

## N64 [P2] Ciągi ustawione od prawej krawędzi ściany są rysowane ze wspólnym lewym początkiem

**Odtworzenie:** jedna ściana2400 mm, dolny ciąg z dwiema szafkami600 (razem1200), powiązany górny z jedną600. W obu `offsetFrom=right`, `offset=100`, `wallW=2400`. Bez narożnika.

**Oczekiwany układ:** oba kończą się100 mm przed prawą krawędzią: dolny zajmuje1100..2300 mm od lewej ściany, górny1700..2300. Niezależnie od przyjętego wspólnego początku świata górny powinien zaczynać się600 mm na prawo od dolnego i mieć ten sam prawy koniec.

**Wynik:** `runLayout` dolny ma lead0/tail100/len1300, górny lead0/tail100/len700; oba dostają tę samą ramkę dolnej ściany. `Assembly3D` pokazuje dolne korpusy X0..1200 i górny X0..600. Prawy koniec górnego jest600 mm za wcześnie. `tierMsgs` nie zgłasza problemu, ponieważ oblicza zakresy od prawej z użyciem2400 mm, czyli inne niż layout. Przełączenie obu na offsetFrom=left daje prawidłową wspólną lewą krawędź X100 i końce1300/700.

**Przyczyna:** wybór „od prawej” ustawia wyłącznie `tail`; nie przelicza początku krótszego ciągu w tej samej ramce ściany. Uzgodnić wspólny układ współrzędnych ściany dla rysunku, górnego piętra i kontroli zakresów. Sprawdzić przy tym kontrolę otwierania, która korzysta z layoutu.

Źródło `szafki.jsx` blob `688b93c92636d6e5909979d68a8ce9bf5f4e6732`. Dowód lokalny `audit-hour-right-alignment.json`, warianty left/right, węzły layoutu, bryły i uwagi. To nie N46/N47 (wysokość montażu lub usunięty rodzic); oba piętra istnieją, błędne jest poziome wyrównanie. Bez zmian aplikacji i projektu użytkownika.

---

# Audyt godzinny — N63, 17.10.2026

## N63 [P2] Wysunięta szafka dostaje za płytki blat bez ostrzeżenia

**Odtworzenie:** dwie szafki W600/H720/D560, HDF3, fronty nakładane18 mm, wspólny blat roboczy. Brak wieńców, poprawne wzmocnienia czołowe i tylne. Pierwsza szafka offset0; drugą wysunąć z lica o100 mm.

**Wynik:** rzut/kontrola przestrzenna lokują lico drugiego frontu681 mm od ściany (korpus do663, front18). `runTop` nadal zwraca blat głębokości600, `doLica=583`, `wysieg=17`. Zamówienie to „Blat ciągu”1200×600 mm. Blat kończy się więc81 mm PRZED frontem drugiej szafki, zamiast wystawać ponad nim. `worktopMsgs` zwraca pustą listę. Wariant kontrolny offset0 ma taki sam blat, ale fronty581 mm od ściany i pokrycie jest prawidłowe.

**Przyczyna:** dla wysuniętej szafki `runTopLiczy` odejmuje offset od `glebOdSciany`: wymagana głębokość pasa spada593→493 mm. Rzut i kontrola kolizji przeciwnie dodają offset do lica ciągu. Dobór blatu musi korzystać z faktycznych położeń szafek w jednym układzie odniesienia, a uwagi porównywać jego krawędź z każdym frontem.

Odrębne od N62: tam wizualizacja3D pomija przesunięcie; tutaj zamówienie i deklarowany wysięg są błędne nawet po poprawieniu wizualizacji. Nie jest to N48 — wszystkie fronty są nakładane. Źródło `szafki.jsx` blob `688b93c92636d6e5909979d68a8ce9bf5f4e6732`. Dowód lokalny `audit-hour-offset-worktop.json`, warianty0/+100 z formatkami, położeniami frontów i uwagami. Bez zmian aplikacji i projektu użytkownika.

---

# Audyt godzinny — N62, 17.10.2026

## N62 [P2] Wysunięcie szafki z lica jest pomijane w 3D zabudowy

**Odtworzenie:** dwie szafki W600/H720/D560 w jednym prostym ciągu, HDF3; pierwsza `offset=0`, drugą ustawić kolejno na−100,0,+100 mm w polu wysunięcia z lica. Różne kolory korpusów ułatwiają identyfikację.

**Wynik +100:** głębokość odniesienia ciągu563. `swingBodies` prawidłowo przesuwa drugi korpus: odległość od ściany103..663 mm, pierwszy3..563. `Assembly3D` rysuje obie szafki w tym samym pasie Z−563..−3: druga nie wystaje o100 mm.

**Wynik −100:** odniesienie ciągu rośnie do663. Kontrola kolizji ma pierwszy korpus103..663, drugi3..563. `Assembly3D` ponownie rysuje oba identycznie, tym razem Z−663..−103. Druga szafka nie cofa się względem pierwszej. Kontrola0 daje zgodność.

**Przyczyna:** transformacja `Assembly3D` używa `n.depth-p.z`, a bryły poszczególnych szafek nie dostają `c.offset`. Rzut z góry używa `n.depth-cd+c.offset`, kontrola otwierania `cdV1=n.depth+c.offset`. Należy uzgodnić położenie całej szafki (korpusu, wnętrza, frontów i okuć) we wszystkich widokach i kontrolach. Nie wystarczy przesunąć sam front.

Źródło `szafki.jsx` blob `688b93c92636d6e5909979d68a8ce9bf5f4e6732`. Dowód lokalny `audit-hour-offset3d.json`: trzy warianty i porównanie brył wizualizacji z bryłami kontroli kolizji. Bez zmian aplikacji i projektu użytkownika.

---

# Audyt godzinny — N61, 17.10.2026

## N61 [P2] Cokół ramienia nie ma doliczanych mocowań

**Odtworzenie:** narożnik L W900/H720, ramię640, cokół pod korpusem100. Porównać nóżki włączone i wyłączone w obu szafkach.

**Wynik z nóżkami:** zamówienie ramienia zawiera „Cokół ramienia”640×100 oraz4 nóżki, ale ani jednej „Złączki do cokołu”. Dwa przednie miejsca z `armLegPlan` nie dodają klipsów. W całym projekcie jest14 nóżek (10 korpusów +4 ramienia), a5 klipsów pochodzi wyłącznie z korpusów:2 +3. Zasada aplikacji dla korpusu to jeden klips na każdą nóżkę przedniego rzędu; ramię jest pominięte w tej regule. Nie przypisujemy automatycznie klipsów innych płaszczyzn do cokołu ramienia.

**Wynik bez nóżek:** „Cokół ramienia” nadal jest zamawiany, lecz ramię nie dostaje mocowań cokołu. Łącznie9 trójkątów w zamówieniu to dokładnie4 +5 naliczone do cokołów korpusów600 i900 mm. Okucia ramienia obejmują półkę, zawiasy, konfirmaty dna oraz wkręty do wzmocnień/kątownika; nie obejmują cokołu. To jedna luka w kompletności mocowań ramienia dla dwóch sposobów montażu.

**Oczekiwane:** określić i doliczyć mocowania faktycznego odcinka cokołu ramienia: klipsy do przednich nóżek albo mocowania przykręcanego cokołu. Sprawdzić ich pozycje po przycięciu cokołów w rogu, zamiast zakładać, że nadmiar innego odcinka pokrywa brak. Nie mylić z N55/N56 dotyczącymi położenia brył.

Źródło `szafki.jsx` blob `688b93c92636d6e5909979d68a8ce9bf5f4e6732`. Dowód lokalny `audit-hour-arm-plinth-fixings.json`: oddzielne okucia ramienia, korpusów i suma projektu dla obu wariantów. Bez zmian aplikacji i projektu użytkownika.

---

# Audyt godzinny — N60, 17.10.2026

## N60 [P3] Widoki 3D przypisują półkom inny materiał niż zamówienie

**Odtworzenie:** zwykła szafka W600/H1000/D560, korpus i półki18 mm w różnych dekorach, „Półki z tej samej płyty co korpus” wyłączone, realne kolory. Jedna półka w kolumnie; następnie dwa poziomy z jedną półką w każdym. Bez narożnika i frontów.

**Wynik A:** zamawiana „Półka”564×560 mm ma `matKey=shelf`. W `Scene3D` zwykła półka na Y491..509 ma kolor korpusu. W `Assembly3D` ta sama półka ma prawidłowy dekor półek.

**Wynik B:** przy dwóch poziomach „Półka przelotowa” jest konstrukcyjna i ma `matKey=board` (także grubość korpusu). W `Assembly3D` płyta na Y491..509 dostaje jednak `shelfColorOf`, więc wygląda jak materiał półek. `Scene3D` rysuje ją prawidłowo z korpusu, lecz dwie zwykłe półki na Y246..264 i737..755 nadal mają błędny kolor korpusu.

**Oczekiwane:** zwykłe półki korzystają z materiału półek, przelotowa przegroda pozioma z korpusu, jednakowo w obu widokach i zamówieniu. Jedno zgłoszenie dla niespójnego przypisywania materiałów półkom, a nie osobny błąd na każdą płytę. Grubości i wymiary w tej próbie są zgodne; nie stwierdzamy brakujących formatek.

Źródło `szafki.jsx` blob `688b93c92636d6e5909979d68a8ce9bf5f4e6732`. `Scene3D` zwykłe półki rysuje z `bf`; `Assembly3D` półki przelotowe z `shc3`. Dowód lokalny `audit-hour-shelf-material.json`, dwa układy i oba widoki. Odrębne od N59 — tutaj zwykła szafka bez kątowników. Bez zmian aplikacji i projektu użytkownika.

---

# Audyt godzinny — N59, 17.10.2026

## N59 [P2] Materiał wewnętrznego kątownika narożnika różni się w 3D i zamówieniu

**Odtworzenie:** narożnik L W900/H720, ramię640, wsporniki, płyty18. Ustawić inny dekor płyty półek i korpusu, wyłączyć „Półki z tej samej płyty co korpus”. W teście korpus niebieski, półki magenta.

**Wynik:** `cornerArmParts` zamawia „Kątownik narożnika — nachodzący” i „— doczołowy”, po jednej formatce60×684 mm, obie `matKey=board`: materiał korpusu. `Assembly3D` rysuje te same dwie płyty z kolorem `shelfColorOf`, czyli z płyty półek. Bryły oznaczone `katownik`:18×684×60 i60×684×18. W wariancie kontrolnym „półki z korpusu” rysunek i zamówienie są zgodne; po rozdzieleniu materiałów zmienia się wyłącznie rysunek kątownika.

**Oczekiwane:** ustalić materiał konstrukcyjny kątownika i korzystać z niego zarówno w bryłach, jak i formatkach/rozkroju. Komentarz `cornerBracket` mówi o dwóch wewnętrznych płytach półkowych, lecz `cornerArmParts` zamawia korpusowe; nawet jeśli właściwym wyborem jest korpus, wizualizacja nie może pokazywać innego materiału.

Nie mylić z N43 dotyczącym blend ani N53 dotyczącym frontu ramienia z materiału sąsiada. Tu chodzi o dwie wewnętrzne płyty konstrukcyjne, przy jednakowej grubości18 mm. Źródło `szafki.jsx` blob `688b93c92636d6e5909979d68a8ce9bf5f4e6732`. Dowód lokalny: `audit-hour-bracket-material.json`, dwa warianty z pozycjami zamówienia i bryłami. Bez zmian aplikacji i projektu użytkownika.

---

# Audyt godzinny — N58, 17.10.2026

## N58 [P3] Licznik cięć rozkroju pomija docięcie przy ścinku węższym od rzazu

**Odtworzenie:** `packSheets([{name:'Panel',qty:1,a:2760,b:2000,rotatable:false}])`, standardowy arkusz użytkowy2761,2×2061,2 mm, rzaz3 mm. To samo można uzyskać dodatkową formatką i rozkrojem projektu.

**Wynik:** panel mieści się poprawnie, ale `cuts=1`. Do uzyskania2760×2000 z2761,2×2061,2 trzeba dociąć obie osie: dwa cięcia. Po długości pozostaje1,2 mm, więc cięcie jest potrzebne mimo braku użytecznej resztki. Przy panelu2700×2000 kontrola zwraca prawidłowo2.

**Przyczyna:** `sheet.cuts += pieces.length` liczy liczbę wolnych prostokątów zwróconych po odjęciu rzazu, a nie liczbę wykonanych cięć. Gdy różnica wymiarów wynosi od0 do rzazu, resztka nie powstaje, lecz docięcie nadal jest konieczne. Dotyczy pola „cięć” w rozkroju ekranowym i PDF. Nie stwierdzamy na tej podstawie błędnej opłaty za formatowanie: obecna wycena tej usługi jest za arkusz, nie za tę liczbę cięć.

**Oczekiwane:** liczyć osobno operacje docięcia i pozostałe pola. Dla dokładnego wymiaru arkusza nie doliczać cięcia, dla dodatniego nadmiaru doliczać je również wtedy, gdy odpadem jest tylko wąski ścinek/pył.

Źródło `szafki.jsx` blob `688b93c92636d6e5909979d68a8ce9bf5f4e6732`, `nestPass`12780. Dowód lokalny: `audit-hour-cutcount.json`, pięć prób porównawczych. Nie zmieniano aplikacji ani projektu użytkownika.

---

# Audyt godzinny od 12:37:06 — N57, 17.10.2026

Źródło `szafki.jsx` blob `688b93c92636d6e5909979d68a8ce9bf5f4e6732`; test funkcji na lokalnym wariancie, bez zmian aplikacji i danych użytkownika.

## N57 [P2] Front ramienia pozostaje nakładany po wybraniu frontów wpuszczanych

**Odtworzenie:** narożnik L W900/H720, ramię640, płyty18, HDF3; przełączyć `frontMode` szafki narożnej z overlay na inset. Porównać zamknięte bryły frontu ramienia i maskownicy w `Assembly3D`.

**Wynik:** dla overlay front ramienia558×714×18 i maskownica mają Z−581..−563. Po przełączeniu inset wysokość frontu zmienia się na698, lecz front ramienia nadal zajmuje Z−581..−563. Maskownica prawidłowo przechodzi na Z−563..−545. W efekcie front ramienia jest wysunięty o18 mm względem maskownicy, zamiast być wpuszczony w obrys. Front samego korpusu narożnego zmienia swoją płaszczyznę prawidłowo.

**Przyczyna:** `armInset`/`bracketPlan` uwzględniają montaż wpuszczany, natomiast bryła frontu ramienia i jej oś obrotu używają na sztywno zakresu od `-tfA` do0. Należy wspólnie wyznaczać położenie ramienia, maskownic i uchwytu dla obu trybów. Sprawdzić też szerokość i luzy frontu wpuszczanego przy boku ramienia; w tej próbie szerokość nadal558 mm, ale nie liczymy tego jako osobnego błędu.

**Odrębność:** to nie N53 (grubość materiału dawcy): tutaj wszystkie fronty mają18 mm. To nie N48 (dobór blatu) ani N38 (indywidualny montaż szuflad). Dowód lokalny: `audit-hour-arm-inset.json`.

---

# Nowy błąd N56 — 17.10.2026

Źródło `szafki.jsx` blob `688b93c92636d6e5909979d68a8ce9bf5f4e6732`. Test rzeczywistych funkcji na lokalnym wariancie danych, z pominięciem N1–N55.

## N56 [P2] Dno ramienia przy cokole wewnątrz korpusu jest 100 mm poniżej własnych wierceń

**Odtworzenie:** utworzyć narożnik L przez `utworzCiagZRogiem`, W900/H720, ramię 640 mm, płyty 18 mm, HDF 3 mm. W szafkach i ciągach ustawić cokół H100, `mode=inbody`, cofnięcie 0. Porównać z `mode=under`.

**Wynik:** `geo.plinthInBody=true`, `geo.bottomY=100`, baza szafki 0. Plan dodatkowych wierceń ramienia podaje „konfirmat — dno ramienia” na Y109, czyli środek dna na wysokości 100–118 mm. Tymczasem `Assembly3D` rysuje dno ramienia 622×18×560 mm w zakresie świata Y0..18. Środek narysowanej płyty jest na Y9: wiercenia mijają ją o 100 mm. Dno ramienia nie jest na poziomie dna korpusu, mimo że tworzą wspólne wnętrze.

**Kontrola:** przy cokole pod korpusem `bottomY=0`, baza100; dno ramienia leży na Y100..118, a lokalne wiercenia Y9 po dodaniu bazy wypadają prawidłowo na światowym Y109. Problem pojawia się po zmianie trybu cokołu, przy zachowaniu jego wysokości i zerowym cofnięciu.

**Przyczyna:** bryła dna ramienia używa `box(...,y0,...,y0+tA,...)`, pomijając `geo.bottomY`. Plan wierceń poprawnie używa `geo.bottomY+t/2`. Należy uzgodnić konstrukcję ramienia, położenie jego dna i cokołu wewnątrz obrysu ze wspólną geometrią korpusu. To odrębne od N55: tutaj cofnięcie wynosi0, a błędna jest wysokość dna po zmianie trybu.

**Dowód lokalny:** `audit-arm-plinth-inside-results.json`, warianty under/inbody, zakresy brył i plan wierceń. Nie zmieniano kodu aplikacji ani projektu użytkownika.

---

# Seria 3-minutowa — N55, 17.10.2026

Start 12:31:03 czasu polskiego, limit 3 minut. Źródło `szafki.jsx` blob `688b93c92636d6e5909979d68a8ce9bf5f4e6732`. Jeden nowy potwierdzony problem; bez powtarzania N1–N54. Testy funkcji źródłowych na kopiach danych.

## N55 [P2] Cofnięcie cokołu jest ignorowane w 3D zabudowy

**Odtworzenie:** ciąg z cokołem pod korpusem H100, grubość płyty18; porównać `cab.plinth.setback=0` oraz20 mm we wszystkich szafkach. W próbie narożnik L W900/H720, ramię640. Wywołać `Assembly3D` z `rpOf: r => runPlinth(project,r)`.

**Wynik:** `runPlinth` nie zwraca pola `setback`. `Assembly3D` (6921) odczytuje `rp.setback || 0`, więc zawsze rysuje cokół bez cofnięcia. Zmiana 0→20 mm nie zmienia żadnej bryły cokołu: dla odcinka600 mm zakres świata nadal X0..600, Y0..100, Z−563..−545. Cokół ramienia640 mm również pozostaje X600..1240, Y0..100, Z−563..−545; jego bryła osobno ma cofnięcie wpisane na sztywno jako0. Także drugi odcinek355 mm pozostaje w tym samym miejscu.

**Oczekiwane:** przesunięcie cokołu w głąb odpowiedniego ciągu o ustawione20 mm, z poprawnym domknięciem narożnika. Widok boczny pojedynczej szafki odczytuje `cab.plinth.setback` (9130–9136), a `Scene3D` również korzysta z tego parametru (9772+). Należy uzgodnić z nimi widok zabudowy i ramię. Nie jest to ponowne zgłoszenie wcześniejszego styku cokołów przy zerowym cofnięciu; tutaj dowodem jest brak reakcji na edytowalny parametr.

**Dowód lokalny:** `audit-arm-plinth-setback-results.json`, warianty0/20 mm wraz z bryłami i wynikami `runPlinth`. Nie zmieniano projektu użytkownika ani kodu aplikacji.

---

# Kolejna seria 10-minutowa — N49–N54, 17.10.2026

Start 12:16:24 czasu polskiego, limit 10 minut. Źródło `szafki.jsx` blob `688b93c92636d6e5909979d68a8ce9bf5f4e6732`. Pominięto N1–N48 i znane wpisy BLEDY.md. Sześć nowych zgłoszeń odtworzonych na rzeczywistych funkcjach źródłowych, na lokalnych wariantach projektu. To testy geometrii, zamówienia i planów wierceń; nie pełny przebieg UI/PDF. Projekt użytkownika i kod aplikacji nie były zmieniane.

Wspólna baza odtworzenia: przez `utworzCiagZRogiem` utworzyć narożnik L, W900/H720, długość ramienia 640 mm, płyty 18 mm, plecy HDF 3 mm, jedną półkę w polu przy ramieniu. Szczegóły wariantów poniżej. Nie załączono prywatnego JSON projektu.

## N49 [P2] Półka ramienia na konfirmatach nie ma przypisanych mocowań ani wierceń

**Odtworzenie:** wybrać mocowanie półek `confirmat`; porównać z kołkami podporowymi i trójkątami.

**Wynik:** `cornerArmParts` zamawia jedną półkę ramienia, ale konfirmaty ramienia obejmują tylko wieniec i dno do boku (6 szt.). Nie ma pozycji mocowania półki. `wierceniaDodatkowe` nie generuje jej otworów. Przy kołkach/trójkątach pojawiają się osobne 4 mocowania i odpowiedni plan. Dodatkowo zwykły plan korpusu zawiera „Bok prawy”, „konfirmat — półka”, Y360, głębokości 50/270/489, chociaż `postSide=right` usuwa prawy bok z formatek korpusu: istnieje tylko „Bok lewy”. Nie przypisujemy tych otworów do dowolnej innej płyty bez określenia rzeczywistego połączenia.

**Oczekiwane:** określić i policzyć wykonalne mocowanie obu części półki L; wiercenia przypisać wyłącznie istniejącym płytom. Źródło: `cornerArmParts` (11220+) obsługuje półki tylko na pins/trojkaty; `wierceniaDodatkowe` (11405+).

## N50 [P2] Uchwyt frontu ramienia jest rysowany, lecz nie trafia do zamówienia

**Odtworzenie:** narożnik z otwieranym frontem ramienia i włączonymi uchwytami, zwykły front sąsiedniej szafki dwuskrzydłowy.

**Wynik:** zamknięte `Assembly3D` ma 4 bryły oznaczone `uchwyt`: dwa uchwyty sąsiedniej szafki, jeden frontu korpusu narożnego i jeden ramienia. Zsumowane produkty całego projektu zawierają tylko 3 uchwyty. `cornerArmParts` dodaje front ramienia i zawiasy, lecz nie uchwyt.

**Oczekiwane:** uchwyt ramienia uwzględniać w produktach i wycenie zgodnie z jego konfiguracją. To brak produktu, odrębny od N36 dotyczącego wysunięcia uchwytu klapy.

## N51 [P2] Usunięte dno ramienia pozostaje w formatkach i planie wierceń

**Odtworzenie:** zachować wieniec, ustawić oba połączenia dna na `none`.

**Wynik:** `geo.hasBot=false`; w 3D znika dolna płyta ramienia. Pozostaje jedna płyta 622×18×560 mm zamiast dwóch. Zamówienie nadal zawiera „Wieniec i dno ramienia”, ilość 2, 622×560 mm. Plan nadal zawiera „konfirmat — dno ramienia” na Y9. Półka 622×542 mm była liczona osobno, nie została omyłkowo uznana za dno.

**Oczekiwane:** formatki, połączenia i wiercenia ramienia respektują `hasBot` tak jak rysunek. `cornerArmParts` uzależnia ilość płyt wyłącznie od `armTop`; nie sprawdza dna. To odrębna ścieżka od N44, które dotyczyło mocowań pionowych przegród korpusu.

## N52 [P2] Pełne plecy ramienia kolidują z półką; ich wysokość różni się między 3D a zamówieniem

**Odtworzenie:** przy HDF 3 mm korpusu włączyć pełną płytę pleców ramienia (`corner.backBoard=true`), pozostałe płyty 18 mm.

**Wynik:** półka nadal ma 622×542 mm, tak jak przy HDF. Bryła półki ma zakres Z od −545 do −3, pełne plecy od −18 do 0: zachodzenie na siebie na 15 mm, na całej szerokości półki 622 mm. Grubość pełnych pleców nie zastępuje `geo.tb` w głębokości półki. Dodatkowo zamówione plecy mają 1197×684 mm, lecz 3D pokazuje 1197×720×18 mm: różnica wysokości 36 mm.

**Oczekiwane:** półka mieści się przed faktycznymi plecami; ta sama definicja wysokości pleców obowiązuje w 3D i formatkach. Nie jest to N27: tutaj wszystkie płyty mają 18 mm, a problem uruchamia osobna opcja pełnych pleców ramienia.

## N53 [P2] Front ramienia z materiału sąsiedniej ściany ma w 3D złą grubość

**Odtworzenie:** w obu szafkach wyłączyć „front z tej samej płyty co korpus”. Front korpusu narożnego 18 mm, front dawcy z sąsiedniej ściany kolejno 10, 12 i 16 mm; różne kolory ułatwiają identyfikację.

**Wynik:** `frontRamienia` prawidłowo wybiera materiał sąsiada. Formatka ramienia 558×714 mm ma kolejno grubość 10/12/16 mm i właściwy kolor. Bryła frontu ramienia ma w każdym wariancie 558×714×18 mm. Kontrola z frontem dawcy 18 mm daje zgodność. `Assembly3D` używa `const tfA = c.geo.tf` (7086), czyli grubości frontu korpusu, zamiast wybranego materiału ramienia.

**Oczekiwane:** grubość bryły i związana z nią geometria ramienia odpowiadają materiałowi zamawianej formatki. To nie powtórzenie N7: żadna z szafek nie ma włączonego `frontSameAsBoard`; błąd dotyczy pobrania materiału sąsiedniej ściany.

## N54 [P3] Fronty „Skręcone 90°” nie zachowują sztywnego połączenia podczas otwierania

**Odtworzenie:** ustawić narożnik „Skręcone 90°”, otwierać 3D do 30°, 60°, 90°. Wariant jest opisany w aplikacji jako dwa fronty skręcone na stałe pod kątem 90°, na zawiasach z jednej strony.

**Wynik:** odległość środków obu płyt wynosi przy zamknięciu 352,765 mm, przy 30° 269,147 mm, przy 60° 322,227 mm, a przy 90° 451,611 mm. Środki obliczono z zakresów brył świata, osobno identyfikując front korpusu i ramienia kolorami oraz wymiarami. W sztywnym zespole odległość między dowolnymi dwoma punktami płyt musi być stała. Model obraca fronty niezależnie wokół różnych osi i nie odwzorowuje deklarowanego zespołu.

**Oczekiwane:** dla skręconych frontów zastosować wspólny ruch sztywnego zespołu; nie kopiować niezależnego ruchu skrzydeł. Wniosek dotyczy wizualizacji ruchu. Na tej podstawie nie stwierdzamy wymaganej katalogowej liczby zawiasów ani rzeczywistego kąta kolizji.

**Dowody lokalne tej serii:** `audit-corner-new-results.json`, `audit-corner-front-material-results.json`, `audit-corner-coupled-results.json`. Zachowano pełne wyniki wariantów oraz bryły do porównania. Poprzednie wpisy poniżej pozostają bez zmian.

---

# Kolejna seria 10-minutowa — N44–N48, 17.10.2026

Start 11:46:03 czasu polskiego, limit 10 minut. Ponownie sprawdzony main: `szafki.jsx` blob `688b93c92636d6e5909979d68a8ce9bf5f4e6732`. Pominięto znane N1–N43 i wpisy BLEDY.md. Pięć nowych zgłoszeń. Testy rzeczywistych funkcji źródłowych na lokalnych kopiach danych; bez zmian projektu użytkownika, nowych PDF i bez pełnego przebiegu testów UI. N45 dotyczy wykonalności planu połączeń i wymaga szczególnej weryfikacji montażowej przy poprawce.

## N44 [P2] Zamówienie liczy mocowania obu końców przegrody także bez dna lub wieńca

**Odtworzenie:** W800/H1200/D560, dwa pola w jednym poziomie, jedna pionowa przegroda, bez półek, pleców i frontów. Porównać pełne dno/wieniec, brak jednej z płyt oraz blat roboczy na bokach.

**Wynik:** pełny korpus ma 18 konfirmatów: 6 do wieńca, 6 do dna, 6 do obu końców przegrody. Po wyłączeniu wieńca albo dna zamówienie ma 12 konfirmatów, lecz plan przewiduje tylko 9 rzeczywistych pozycji: 6 do pozostałej płyty i 3 do jednego końca przegrody. Po wyłączeniu obu płyt zostaje 6 konfirmatów „przegrody 2×3”, mimo że plan nie ma żadnego połączenia końców przegrody z płytą poziomą. Dla blatu roboczego na bokach i pełnego dna program również liczy 12, choć plan nie przewiduje konfirmatów przez lico blatu: zostaje 9 pozycji.

Kod bezwarunkowo wykonuje `joint(dividers.length * 2, dividerDepth, "przegrody")`; plan wierceń filtruje nieistniejące podpory i blat prawidłowo. Powoduje to także nadmiar zaślepek.

**Oczekiwane:** liczba połączeń przegrody wynika z faktycznych płyt nad i pod nią oraz sposobu mocowania. Jeśli potrzebne jest inne podparcie wolnego końca, należy je określić osobno. Przy wariancie bez wieńca aplikacja zgłasza ogólną uwagę o otwartym korpusie — ten raport nie twierdzi, że uwag nie ma; zgłoszenie dotyczy nadal niezgodnego zamówienia i planu.

Dowód: `audit-next-levels-results.json`, sekcja contacts, sześć wariantów. Nie jest to N40: tam błędna była głębokość mocowania wspornika i półki, tutaj liczba istniejących styków pionowej przegrody.

## N45 [P2, wykonalność planu] Konfirmaty z przeciwnych stron wspólnej płyty trafiają w te same osie

**Próba A:** W800/H1200/D560, jedna pionowa przegroda, po jednej półce z lewej i prawej na tej samej wysokości; mocowanie półek na konfirmatach. Brak pleców i innych wzmocnień.

Plan „Przegroda 1” ma dwa osobne wpisy, od kolumny 1 i 2. Oba podają wysokość 582 mm od dołu przegrody i identyczne pozycje od przodu 50, 280, 510 mm. Program zamawia niezależne konfirmaty 7×50 dla obu półek, bez rozsunięcia otworów, ostrzeżenia ani innego rozwiązania połączenia w tym miejscu. W geometrii obie półki rzeczywiście są naprzeciw siebie: spód Y591, przegroda X391–409.

**Próba B:** dwa poziomy, dolny 300 mm, pionowe przegrody jedna nad drugą przy X391, między nimi ta sama półka przelotowa Y318–336. Jej plan pojawia się jako „nad poziomem 1” oraz „pod poziomem 2”; obydwa wpisy wskazują X382 od wewnętrznego lewego boku i pozycje głębokości 50, 280, 510 mm, lecz w przeciwnych kierunkach w identycznych osiach. Zamówienie znów traktuje je jako dwa niezależne komplety.

**Oczekiwane:** jawnie rozwiązać połączenia w kształcie krzyża: rozsunąć wzór mocowań w wykonalny sposób albo dobrać inny sposób łączenia. Nie można traktować dwóch przeciwnych mocowań w identycznej osi jako niezależnych bez określenia konstrukcji. Przy poprawce zweryfikować także dostęp do łbów i kolejność montażu. Same osobne wpisy „od kolumny” nie rozwiązują konfliktu. Nie wyznaczano z tego audytu nowego rozstawu ani nie zastępowano konsultacji montażowej.

Warianty A/B liczyć jako jeden błąd obsługi przeciwległych połączeń. To nie N33 (powtórzenie punktu przy małej głębokości): korpus ma standardową głębokość 560 mm. Znane rozsuwanie otworów kołków i trójkątów nie obejmuje tu konfirmatów.

Dowód: `audit-next-opposed-results.json`; w obu próbach lista uwag jest pusta. Przejrzeć gałęzie planu konfirmatów półek oraz pionowych przegród.

## N46 [P2] Słupek podnosi górną szafkę stojącą nad inną częścią blatu

**Odtworzenie:** dolny ciąg: trzy szafki po 600 mm, cokół pod korpusem 100 mm, H720, wspólny blat 38 mm; jedna górna szafka szerokości 600 mm nad lewą szafką, przesunięcie 0, „Prześwit nad blatem” 500 mm. Następnie podwyższyć tylko skrajną prawą dolną szafkę do H2000 (słupek poza zakresem górnej).

**Wynik:** przed zmianą górna szafka zaczyna się na 1358 mm. Po dodaniu słupka jej spód idzie na 2638 mm. Tymczasem `runTop` nadal pokazuje blat nad dwiema niskimi szafkami X0–1200 na poziomie 820 mm + 38 mm grubości. Górna szafka zajmuje tylko X0–600, więc nie jest nad słupkiem. Faktyczny prześwit nad blatem wynosi 1780 zamiast wpisanych 500 mm.

**Przyczyna:** `tierMountY` bierze najwyższe lico dowolnej szafki dolnego ciągu (`Math.max`), następnie dokłada grubość blatu i prześwit. Nie korzysta z rzeczywistej wysokości wybranego odcinka blatu ani zakresu górnej szafki. Kontrola sufitu również dostaje tę błędną wysokość.

**Oczekiwane:** dla górnej zabudowy nad niskimi szafkami prześwit mierzony od rzeczywistego blatu, zgodnie z nazwą pola; ewentualne zderzenie górnych ze słupkiem rozpatrywać przestrzennie, a nie podnosić cały ciąg bez względu na jego zakres. To nie N23 (zamawianie blatu przez przerwę): słupek jest na końcu, a blat ma prawidłowo dwa niskie pola.

Dowód: `audit-next-upper-results.json`, tall720/tall2000; `upperSpan` X0/W600, `runTop.y` w obu próbach 820.

## N47 [P2] Rozwiązanie dolnego ciągu zostawia górny z nieistniejącym rodzicem i dawną wysokością

**Odtworzenie:** utworzyć górny ciąg nad dolnym, początkowo H720 + cokół100 + blat38 + prześwit500 — zapisany `mountY` górnego wynosi 1358. Potem zwiększyć wszystkie dolne szafki do H800: aktualne położenie górnego liczy się na 1438 mm. Wybrać „Rozwiąż ciąg — szafki zostają, wracają na wolnostojące” dla dolnego.

**Wynik:** szafki pozostają (4 przed i po operacji), ale dolny ciąg c1 znika. Górny nadal ma `tier: gorny`, `wall: c1`, choć c1 nie istnieje. `tierMountY` przechodzi na dawny zapis `mountY:1358`, więc górny samoczynnie przesuwa się w dół o 80 mm. Zmienia się również podstawa wyliczania szerokości ściany i powiązań pięter.

**Oczekiwane:** operacja musi jawnie rozwiązać zależne piętro albo zachować je jako niezależny ciąg z aktualną wysokością i poprawnymi referencjami. Nie pozostawiać odwołania do nieistniejącego ciągu. Sposób docelowego rozłączenia wymaga decyzji projektowej; potwierdzone są osierocone `wall` i zmiana położenia, nie wskazanie jednej obowiązkowej implementacji.

Dowód: `audit-next-dissolve-results.json`. Test wykonał dokładny kod obiektu stanu z callbacku `removeRun`, wyodrębniony z aktualnego źródła; nie uruchamiano rozwiązywania ciągu w projekcie użytkownika. To osobny mechanizm od N46: tutaj wszystkie dolne szafki mają jednakową wysokość, problem powstaje po usunięciu relacji.

## N48 [P2] Blat przy frontach wpuszczanych bez potrzeby wymaga arkusza 1200 mm

**Odtworzenie:** pojedyncza szafka w ciągu z blatem roboczym, D580, HDF przybijany 3 mm, front 18 mm wpuszczany; głębokość nie obejmuje frontu ani pleców. Bez odsunięcia od ściany. Porównać z frontem nałożonym.

**Wynik:** rzeczywiste lico frontu wpuszczanego jest 583 mm od ściany. Arkusz 600 mm wystaje przed nim o 17 mm, czyli mieści się w przyjętym przez aplikację zakresie wysięgu 10–30 mm. Mimo to `runTop` liczy lico 603 mm i potrzebną głębokość 613 mm: dodaje 18 mm frontu oraz 2 mm luzu dla frontu nałożonego, choć front jest w obrysie. Dostajemy wybór arkusza 1200 i komunikat „szafki są za głębokie”, z propozycją zmniejszenia D580 do 567 mm. Dla obu trybów frontu wychodzi identyczny blat 613 mm, chociaż rzeczywiste lico różni się o 18 mm.

**Oczekiwane:** potrzebna głębokość i dobór arkusza zależą od rzeczywistego lica frontów. Nie wymuszać droższego, szerszego pasa ani zwężenia szafki tam, gdzie standardowy blat 600 mm daje prawidłowy wysięg. Próba dotyczy globalnego, jednolitego montażu wpuszczanego; to nie N38 (indywidualny montaż szuflad w kontroli ruchu). To także nie N2: tutaj pierwotnie błędna jest sama potrzebna głębokość, a nie metadane arkusza dla rzeczywiście głębokiego blatu.

Dowód: `audit-next-inset-top-results.json`, tryby overlay/inset; `runTop` tworzy odcinek jako korpus + HDF + `HINGE_PLAY` + `geo.tf` + wysięg niezależnie od montażu frontu. Wartości 583/601 mm rzeczywistego lica wyliczono z geometrii i położenia ciągu; 603 mm pochodzi z wyniku `runTop`.

## Próby odrzucone jako nowe błędy

Sprawdzono rozdzielenie planów wierceń przegród na różnych poziomach: mają prawidłowe prefiksy „Poziom 1”/„Poziom 2”, więc nie zgłoszono domniemanego zlania tych planów. Nie doliczano kolejnych odmian grubości i materiałów ani znanych usterek fixów, szuflad i maskownic.


---

# Dalsza kontynuacja — N43, 17.10.2026

Po dodatkowym poleceniu „kontynuuj” sprawdzono jeszcze zgodność wykończenia frontów między widokami. Źródło: `szafki.jsx` blob `688b93c92636d6e5909979d68a8ce9bf5f4e6732`. Jedno nowe zgłoszenie, dwa warianty tej samej linii renderowania zabudowy. Pozostałe znane usterki pominięte.

## N43 [P3] Zabudowa 3D gubi właściwe wykończenie blend i frontów z lustrem

**Odtworzenie:** jedna szafka w ciągu, „Realne kolory” włączone, fronty z osobnej płyty. Dla czytelnej próby korpus czerwony, płyta frontowa zielona. Porównać zamknięty widok 3D pojedynczej szafki z widokiem 3D ciągu/zabudowy.

- Zwykłe drzwi bez lustra są zielone w obu widokach — próba kontrolna przechodzi.
- Po zaznaczeniu lustra pojedyncza szafka pokazuje kolor lustra `#c3d0d6`, lecz zabudowa nadal pokazuje zieloną płytę frontu `#00ff00`.
- Po zmianie pola na blendę pojedyncza szafka poprawnie pokazuje zieloną płytę frontową, a zabudowa czerwony korpus `#ff0000`. Zamówienie blendy używa materiału frontu, nie korpusu.

**Przyczyna:** w `Assembly3D` kolor ustawiany jest jako `d.type === "blenda" ? bf : c.frontColor`; pomija flagę `d.mirror` i podstawia blendzie materiał korpusu. `Scene3D` ma inne przypisanie. W efekcie użytkownik widzi inne wykończenie zależnie od zakresu rysunku.

**Oczekiwane:** wspólne ustalanie wykończenia każdego frontu dla szafki i zabudowy, zgodne z jego zamawianą płytą oraz lustrem. Dwa warianty liczyć jako jeden błąd renderowania wykończenia, nie dwa. To inne zgłoszenie niż N34 (masa lustra w doborze okuć) i N17 (kolor samodzielnego blatu).

Dowód: `audit20-finishes-results.json`, porównanie brył odpowiadających dokładnie wymiarom frontu. Próby funkcji `Scene3D`/`Assembly3D`, bez zmiany projektu użytkownika. Kod: `Assembly3D`, linia 7004 aktualnego źródła. Nie zmieniano kodu aplikacji.



---

# Przedłużenie audytu — N38–N42, 17.10.2026

Użytkownik przedłużył testy o 10 minut od ok. 11:30:40 czasu polskiego. Źródło niezmienione: `szafki.jsx` blob `688b93c92636d6e5909979d68a8ce9bf5f4e6732`. Pięć nowych zgłoszeń, odrębnych od N1–N37. Próby funkcji źródłowych na kopiach danych; N39 dodatkowo potwierdzono w działającym interfejsie. W teście UI zmieniono wyłącznie pole kąta, cofnięto zmianę do 90°, cofnięto wybór szafki i przywrócono Szafkę 5 oraz wcześniejszy widok zamknięty.

## N38 [P2] Indywidualny montaż frontów szuflad nie jest spójny z kontrolą kolizji i pasmem pionowym

**Próba A:** jedna szafka W600/H720/D560, HDF 3 mm, pełne dno i wieniec, dwie szuflady. Cała szafka: fronty na korpusie; kolumna szuflad: fronty wpuszczane. Porównać z konfiguracją, gdzie cała szafka i kolumna mają fronty wpuszczane.

W obu wariantach powstają identyczne fronty: X20, W560, Y20/H338 oraz Y362/H338, `inset: true`, NL500. Jednak `swingBodies` umieszcza zamknięte fronty i uchwyty według `cab.frontMode`, pomijając `d.inset`: w pierwszym wariancie fronty zajmują głębokość 563–581 mm od ściany, w drugim 545–563 mm. Kontrola kolizji pierwszego wariantu przesuwa je o 18 mm względem rzeczywistego montażu. Ruch zaczyna się odpowiednio na 581 zamiast 563 mm.

**Próba B:** cała szafka: fronty wpuszczane; kolumna: nakładane. Fronty mają prawidłową szerokość nakładaną 596 mm, ale zachowują pionowe pasmo wpuszczane Y20/H338 zamiast Y3/H355 z wariantu nakładanego. Indywidualna opcja montażu działa inaczej w poziomie i pionie. To dwie obserwacje jednego niepełnego wdrożenia montażu per kolumna, nie dwa liczone osobno błędy.

**Oczekiwane:** położenie frontu, wysokość pasma, uchwytu i strefy ruchu wynikają konsekwentnie z montażu konkretnego frontu. Nie mylić z wcześniej naprawionym rysowaniem szuflad wpuszczanych w 3D — zgłoszenie dotyczy kontroli otwierania i mieszanego montażu.

Dowód: `audit20-drawermode-results.json`; obliczenia pasma ok. 2682–2695, kontrola `swingBodies` ok. 12420–12454. Dodatkowo 244 porównania układów narożnika: w pięciu przypadkach identyczne fronty dają różny wynik komunikatu o otwieraniu. Przykład: luz rogu 26 mm, dwie wpuszczane szuflady w Szafce 3, zawias lewy Szafki 1 c2; komunikat zmienia ok. 5° na 6° tylko po zmianie globalnej opcji, choć montaż i wymiary szuflad pozostają identyczne (`audit20-drawermode-collision-results.json`). Nie znaleziono w tej próbie potwierdzenia zmiany „brak kolizji” na „kolizja”; potwierdzono zmianę geometrii kontroli i raportowanego kąta.

## N39 [P3, potwierdzone w UI] Pole „Kąt otwarcia — do widoku 3D” nie steruje rysunkiem

**Odtworzenie:** Szafka 3, otwarty widok 3D. Pole w „Luzy drzwi”: „Kąt otwarcia”, podpowiedź „do widoku 3D”. Zmienić 90° na 30°.

**Wynik:** pole pokazuje 30°, suwak rysunku nadal 90°. Wszystkie 48 wielokątów SVG zachowują identyczne współrzędne przed i po zmianie. `cab.openAngle` zapisuje się w projekcie, ale nie jest używane przez widoki; przekazują one niezależne `angle3d`.

**Oczekiwane:** usunąć martwe pole albo uzgodnić jego działanie z suwakiem. Zachować przy tym wcześniejszą decyzję użytkownika, że każde nowe otwarcie 3D zaczyna się od 90° — ten raport nie proponuje cofnięcia tej decyzji.

Dowód: `audit20-angle-live.json`, `kat-30-suwak-90-2026-10-17.png`, dodatkowo `audit20-angle-results.json`. Po próbie pole przywrócono przez Cofnij do 90°, a aktywną szafkę do Szafki 5. Kod: pole ok. 16761–16763, niezależny stan ok. 14017–14021, przekazanie kąta do widoków ok. 17273–17374.

## N40 [P2] Konfirmaty wspornika i skróconej półki liczone z pełnej głębokości korpusu

**Odtworzenie:** W600/H720/D560, bez pleców, dno i wieniec między bokami, lewy fix 100 mm na korpusie, pionowy wspornik głębokości 300 mm, jedna półka na konfirmatach, brak innych wzmocnień.

**Wynik:** zamówienie ma wspornik 684×300 mm i półkę 564×260 mm, lecz plan zleca mocowanie wspornika do dna/wieńca w punktach 50, 280, 510 mm od przodu. Punkt 510 mm wypada 210 mm poza głębokością wspornika. Liczba konfirmatów wspornika także bierze D560. Dodatkowo półka ma w planie po dwa punkty na stronę (350, 510 mm w korpusie), natomiast okucia liczą po trzy na stronę. Zamówienie sumuje 24 konfirmaty: 12 korpusu + 6 wspornika + 6 półki. Z własnej reguły programu dla rzeczywistych głębokości wynika 12+4+4=20. Ostateczny rozstaw powinien być sprawdzony po korekcie; ten raport nie zastępuje planu montażu.

**Oczekiwane:** korzystać z głębokości i odsunięcia każdej płyty, nie z globalnego `carcassDepth`/`shelfDepth`. Liczba okuć musi odpowiadać planowi i rzeczywistym stykom. To nie N16 (ręczne odległości kołków) ani N33 (duplikaty przy bardzo płytkiej szafce).

Dowód: `audit20-support-results.json`, wariant depth300. Plan wspornika ok. 4079, ilości wspornika i półek ok. 4318 i 4335.

## N41 [P2] Wspornik fixu może przecinać plecy lub wystawać za korpus bez błędu

**Odtworzenie:** W600/H720/D560, plecy z płyty korpusu 18 mm wewnątrz, jedne drzwi, bez półek i innych wzmocnień; lewy fix 100 mm ze wspornikiem głębokości 550 mm. Sprawdzić fix nałożony i wpuszczany.

**Wynik:** w wariancie nałożonym wspornik zajmuje Z0–550, a plecy Z542–560 mm: fizyczne przecięcie wynosi 8 mm. W wariancie wpuszczanym wspornik zajmuje Z18–568, przecina całe plecy i wystaje 8 mm za korpus. W X i Y bryły również zachodzą. Obie konfiguracje nie mają błędu kolizji. Do zamówienia trafia wspornik 684×550 mm, bez wycięcia rozwiązującego konflikt. Walidacja sprawdza tylko `supportDepth > carcassDepth`, pomijając odsunięcie wspornika i plecy.

**Oczekiwane:** ograniczyć głębokość do rzeczywiście wolnego miejsca albo zgłosić kolizję i zaproponować poprawny wymiar. To nie N27 dotyczące grubości materiału pleców — tutaj oba elementy są z prawidłowej płyty 18 mm.

Dowód: `audit20-support-limit-results.json`, kind doors/back board; zapisane bryły: wspornik nałożony `[82,18,0,100,702,550]`, plecy `[18,18,542,582,702,560]`; wspornik wpuszczany `[102,18,18,120,702,568]`.

## N42 [P2] Fix w kolumnie szuflad nie zmniejsza ich frontów, a włączony wspornik znika

**Odtworzenie:** jedna szafka W600/H720/D560, dwie automatyczne szuflady, fix 100 mm po lewej, po prawej albo u góry. Przy bocznym fixie włączyć pionowy wspornik 550 mm (wystarcza na wybraną NL550). Pełne dno/wieniec, bez pleców i innych wzmocnień.

**Wynik:** boczny fix zajmuje X0–100 albo X500–600, lecz oba fronty pozostają X2–598 i zachodzą na fix po 98 mm. Górny fix zajmuje Y620–720, ale górny front nadal dochodzi do Y717. Aplikacja zgłasza własny konflikt frontów zamiast uwzględnić wybrane pole stałe przy ich doborze. Dla porównania zwykłe drzwi w tej samej konfiguracji są odpowiednio pomniejszane.

W bocznym wariancie z zaznaczonym wspornikiem `c.support` pozostaje puste; wspornika nie ma w formatkach ani w bryle. Gałąź `kind === "drawers"` jedynie sprawdza długość pod prowadnicą i pomija utworzenie płyty. Nie przedstawiać tego jako braku ostrzeżenia o nachodzeniu frontów: ostrzeżenie jest, lecz poprawnie wybrane ustawienia generują nieobsługiwany układ.

**Oczekiwane:** fix zabiera dostępne pasmo także szufladom, a zamówione podparcie prowadnicy istnieje w formatach i geometrii. Jeśli dana kombinacja nie jest wspierana, opcje powinny to jasno komunikować. Boczne/górne odmiany i brak wspornika liczyć jako jedno zgłoszenie obsługi fixa w kolumnie szuflad.

Dowód: `audit20-fix-drawers-results.json`, `audit20-support-limit-results.json`, kind drawers. Kod fixa ok. 2270–2390; gałąź wspornika ok. 2328–2342; szuflady zaczynają się ponownie od bazowych `dsx0/dsx1` ok. 2685–2690.

Te zgłoszenia uzupełniają serię N34–N37. Dowody poza N39 pochodzą z testów funkcji źródłowych; nie wykonano pełnej suity UI, nowych wydruków PDF ani katalogowej certyfikacji okuć.


---

# Seria 20-minutowa — nowe ustalenia N34–N37, 17.10.2026

Start: 11:13:03 czasu polskiego; limit wyszukiwania 20 minut. Sprawdzono aktualny main: `szafki.jsx` blob `688b93c92636d6e5909979d68a8ce9bf5f4e6732`, bez zmian względem poprzedniej serii. Pominięto N1–N33 oraz znane wpisy z BLEDY.md. Cztery nowe ustalenia poniżej; nie powielają wcześniejszych testów grubości, maskownic i blatów.

Metoda: odtworzenia na kopiach danych w rzeczywistych funkcjach `computeGeo`, `Scene3D`, `loadProject`, `uchwytOut`, `projectLayout`, `openingMsgs`. Bez edycji projektu użytkownika i bez zmian kodu aplikacji. Próba otwarcia izolowanej kopii standalone przez przeglądarkę zakończyła się timeoutem po około 11 minutach; nie uznawać jej za test UI. Czas oczekiwania wchodzi w limit sesji. Wyniki poniżej są potwierdzone testami funkcji źródłowych, nie kliknięciami ani oględzinami nowego PDF.

## N34 [P2] Lustro nie zwiększa masy frontu używanej do doboru okuć

**Odtworzenie:** jedna klapa, W800/H400, płyta frontu 18 mm, automatyczna siła i dwa siłowniki. Włączyć lustro na froncie. Rzeczywisty front ma 796×394 mm, a do zamówienia dochodzi lustro 795×393 mm. Porównać masę i okucia przed oraz po włączeniu lustra.

**Wynik:** w obu przypadkach masa pozostaje około 3,84 kg. Klapa do góry nadal dostaje 2×100 N, a klapa w dół 2×150 N. Także zwykłe drzwi W600/H1450 pozostają przy trzech zawiasach po dodaniu lustra. `wagaFrontu` oraz wywołania `zawiasyGtv` uwzględniają tylko płytę frontu; masa zamawianego lustra jest pomijana.

**Oczekiwane:** doliczyć masę lustra (oraz jawnie ustalone dodatki), zanim program porówna obciążenie z tabelą. Nie wpisywać z tego raportu arbitralnej nowej siły: konkretny dobór wymaga przyjęcia parametrów lustra i ponownego sprawdzenia katalogu. Błędem potwierdzonym tutaj jest niezmienna masa mimo dodania fizycznego elementu, nie twierdzenie o konkretnym wymaganym modelu podnośnika.

Dowód: `audit20-fronts-results.json`; kod ok. linii 383, 546–553, 2519–2526 i 2598–2602.

## N35 [P2] Wczytanie bieżącego projektu zmienia ręczne dane jak przy migracji starego pliku

**Odtworzenie A:** projekt z aktualnym `cab.version: 4`, zwykła szafka; górne pionowe wzmocnienie przy plecach, odsunięcie od tyłu ręcznie 18 mm. Zapisać JSON i wczytać go przez `loadProject`.

**Wynik A:** odsunięcie zmienia się z 18 na 0 mm. Przy szafce narożnej ręczna wysokość takiego wzmocnienia 100 mm zmienia się na 60 mm. Kod migracji rozpoznaje wartości jako dawny domyślny układ bez rozróżnienia nowego projektu i świadomej edycji użytkownika.

**Odtworzenie B:** w bieżącym projekcie ustawić własne ceny: formatowanie 42, obrzeże 2,75, oklejanie 7,20. Zapisać i ponownie wczytać.

**Wynik B:** wszystkie trzy własne wpisy znikają z `prices`, bo są równe historycznym cenom netto. Przy następnym przeliczeniu zastępują je aktualne ceny domyślne. Zmiana następuje bez informacji o utracie własnych ustawień.

**Oczekiwane:** zapis–odczyt bieżącego projektu zachowuje świadomie ustawione wymiary i ceny. Migracja potrzebuje identyfikacji wersji/wykonania albo innego rozróżnienia dawnych wartości od nowych danych. A i B traktować jako jedno zgłoszenie niebezpiecznej migracji bieżących danych, nie kilka nowych błędów. To osobny mechanizm od N29: tam cena gubiła się po zmianie ilości, tutaj przy samym wczytaniu niezmienionego JSON.

Dowód: `audit20-roundtrip-results.json`; `migrateCab` ok. 955–976, `loadProject` ok. 1382–1387. Próby na lokalnych kopiach, niczego nie podmieniono w otwartym projekcie.

## N36 [P2] Indywidualne wystawanie uchwytu jest ignorowane dla klap

**Odtworzenie:** uchwyt szafki wystaje globalnie 20 mm. Na jednych drzwiach ustawić osobne wystawanie uchwytu na 0 albo 45 mm, a następnie zmienić front na klapę do góry lub w dół. Pole uchwytu jest dostępne również dla klapy w tym samym wierszu drzwi.

**Wynik:** zwykłe skrzydło respektuje 0 i 45 mm; obie klapy w obu próbach nadal mają 20 mm. Dla wartości 0 bryła nadal zawiera uchwyt 240×12×20 mm, a dla 45 mm głębokość nadal wynosi 20 mm. Obiekt klapy nie przenosi `rawCol.handleOuts[0]` do `d.handleOut`, więc `uchwytOut` bierze wartość całej szafki. Tę samą błędną wartość dostaje kontrola kolizji.

**Oczekiwane:** indywidualny wymiar uchwytu wpływa na klapę w geometrii, rysunkach i kontroli otwierania, tak jak na zwykłe skrzydło. Nie mylić tego z naprawionym U1 dotyczącym maksymalnego kąta klapy.

Dowód: `audit20-handles-results.json`, sekcja `handles`; konstrukcja klapy ok. 2507–2513 i zwykłych drzwi ok. 2545–2555.

## N37 [P2, brak kontroli] Przeszkoda zajmuje miejsce zawiasów, lecz brak ostrzeżenia o tej kolizji

**Odtworzenie:** standardowa szafka W600/H720/D560, jedne lewe drzwi, bez półek i wzmocnień. Przeszkoda wewnętrzna: szerokość 80, głębokość 80, wysokość 684 mm; z lewej, od boku 18, od tyłu 480, od dołu 0; maskowanie wyłączone. Pełne dno i wieniec między bokami.

**Wynik:** przeszkoda zajmuje X18–98 i Y18–702 mm, a po przeliczeniu osi głębokości leży w przednim pasie Z0–80 mm. Zawiasy mają X20 oraz środki Y103 i Y617 mm. Ich gabaryt przyjmowany przez samą aplikację (`HINGE_W=20`, `HINGE_H=55`, `HINGE_D=80`) przecina tę przeszkodę przy obu zawiasach. Nie następuje przełożenie/przesunięcie ani zgłoszenie kolizji. Jest tylko ogólna uwaga „Element kolizyjny nie ma zabudowy…”, a `openingMsgs` zwraca pustą listę.

**Oczekiwane:** kontrolować miejsce zajmowane przez zawiasy i inne okucia w odniesieniu do przeszkód albo jasno wskazać, że ten zakres nie jest sprawdzany. Ogólna uwaga o niezabudowaniu przeszkody nie informuje, że nie ma miejsca na zawias. To brak kontroli okuć we wnętrzu, odrębny od N22 dotyczącego niepotrzebnego skracania górnej szuflady przez dolną przeszkodę. Gabaryty pochodzą z modelu aplikacji, nie z nowej weryfikacji katalogowej producenta.

Dowód: `audit20-handles-results.json`, sekcja `obstacle`; `hObs` ok. 2571–2580 nie zawiera przeszkód geometrycznych.

## Próby bez nowego zgłoszenia

- 350 powtarzalnych, pseudolosowych zestawów rozkroju: ilość elementów, granice arkuszy i nakładanie prostokątów. Nie znaleziono utraty ilości, wyjścia poza arkusz ani nałożenia formatek (`audit20-cutcheck-results.json`). To nie dowodzi optymalności rozkroju i nie obejmuje znanych błędów grupowania materiałów.
- Sprawdzono rozstaw wierceń klap przy różnych podporach. Współrzędnych odnoszących się jawnie do wewnętrznej strony boku nie uznano automatycznie za błędne współrzędne lokalne formatki; brak dostatecznej podstawy do nowego zgłoszenia liczbowego.

Pełne wyniki i skrypty pozostały lokalnie w katalogu audytu. Na GitHub trafia opis odtworzenia, bez prywatnego JSON projektu. Poprawki i regresje powinny być wykonane przez Claude; ten raport nie potwierdza pełnej zgodności wszystkich zamawianych elementów z rysunkami.


---

# Kolejna seria audytu: N22–N33 — 17.10.2026

Źródło: main, szafki.jsx blob `688b93c92636d6e5909979d68a8ce9bf5f4e6732`. Sesja rozpoczęta 11:02:09 czasu polskiego, limit 10 minut. Cel 30 nowych ustaleń nie został osiągnięty; poniżej 12 odrębnych ustaleń, w tym przypadki graniczne. Są to odtworzenia w lokalnie wyodrębnionych funkcjach źródłowych, nie pełne testy interfejsu ani potwierdzenie montażu. Nie zmieniano projektu użytkownika ani kodu aplikacji.

## Korekta przykładów grubości w N7 i N12

25 mm było wartością próby technicznej, nie wymaganiem materiałowym projektu. Powtórzono próby dla wskazanych przez użytkownika 10, 12 i 16 mm. N7 nadal występuje: przy „front jak korpus”, korpusie 18 mm i zapisanej osobnej grubości frontu 10/12/16 mm zamówienie używa 18 mm, a geometria ukrytej grubości frontu. N12 także nadal występuje: dno/tył szuflady z materiału 10/12/16 mm rysowane są jako 18 mm. Nie liczyć tych retestów jako nowych błędów.

## N22 [P2] Przeszkoda poniżej szuflady niepotrzebnie skraca prowadnicę

Próba: H1200, dolne pole 500 mm, szuflada w górnym polu. Przeszkoda przy plecach 80×80×100 mm, od dołu 0, bez pełnej wysokości. Jej zakres Y to 18–118 mm; szuflada zaczyna się powyżej 529 mm. Mimo braku przecięcia wysokości prowadnica zmienia się z NL550 na NL450, a dno z 489×526 na 489×426 mm. `maxNlFor` uwzględnia blokadę głębokości bez zakresu Y. Oczekiwane: skracać wyłącznie kolidującą szufladę.

## N23 [P2] Przerwa na wysoką szafkę znika w zamówieniu blatu

Trzy szafki po 600 mm w jednym ciągu, wysokości 720/2000/720, wspólny blat. `runTop.spans` i 3D pokazują odcinki 0–600 oraz 1200–1800 mm, czyli dwa blaty po 600 mm. Formatki zamawiają jeden „Blat ciągu” 1800×600 mm. Oczekiwane: zamówienie i krawędzie odpowiadają rzeczywistym odcinkom, bez materiału w miejscu wysokiej szafki.

## N24 [P2] Maskownice przeszkód L/U mają inne formatki niż bryły 3D

Macierz 96 wariantów: strona, typ auto/L/U, front nałożony/wpuszczany, narożnik poziomy/pionowy oraz odsunięcia od boku i pleców. W 80 wariantach co najmniej jedna bryła nie odpowiada formatce. Przykład: W800/H1000/D560, przeszkoda lewa 100×100×200, od dołu 100, przy boku i plecach, maskowanie auto/L, front nałożony. Zamówiona płyta 18×100×200 mm nie ma odpowiednika, a 3D zawiera 18×200×118 mm. Wszystkie odmiany traktować jako jeden problem budowy maskownic, nie 80 błędów. Ujednolicić konstrukcję i opcje między obliczeniami a 3D.

## N25 [P2] „Głębokość obejmuje plecy” skraca korpus także przy plecach wewnętrznych

D560, plecy z płyty 18 mm wewnątrz. Bez opcji korpus ma 560 mm; po zaznaczeniu ma 542 mm i nadal odejmowane jest 18 mm zajęcia wnętrza. Plecy wewnętrzne nie zwiększają zewnętrznej głębokości, więc podany wymiar 560 mm nie powinien zmieniać się na 542 mm. Odejmowanie grubości wymaga rozróżnienia pleców wewnętrznych i zewnętrznych.

## N26 [P2] „Głębokość obejmuje front” pomija blendę i pole z samym fixem

D560, bez pleców, front nałożony 18 mm. Dla zwykłych drzwi korpus ma 542 mm. Dla pola typu blenda albo pola bez drzwi z nałożonym fixem korpus nadal ma 560 mm, więc z płytą przednią całość ma 578 mm. Próba nie zalicza uchwytów do głębokości frontu. Wykrywanie `anyFront` powinno obejmować również te elementy.

## N27 [P2] Plecy z materiału półek mają grubość i kolor korpusu w 3D

Korpus 18 mm czerwony, niezależny materiał półek zielony 10/12/16 mm, plecy z płyty z materiału półek. Zamówienie poprawnie wskazuje `shelf`, lecz `geo.tb` oraz bryła pleców mają 18 mm i kolor korpusu. Potwierdzono plecy wewnętrzne i zewnętrzne. To osobny element od N11 (tryb pleców kolumny) i N12 (skrzynka szuflady). Obliczenia zajęcia wnętrza także muszą używać rzeczywistego materiału pleców.

## N28 [P3] Usunięcie wcześniejszej szafki przełącza aktywną na inną

Lokalne wywołanie dokładnego callbacku `removeCabinet` na kopii projektu: aktywna „Szafka 1 c2”, usuwana wcześniejsza „Szafka 1”. Po operacji aktywna staje się „Szafka 4”. Indeks aktywnej szafki nie jest zmniejszany po usunięciu poprzedzającego elementu. Zachować aktywność przez ID lub skorygować indeks. Nie usuwano szafek w projekcie użytkownika.

## N29 [P2] Zmiana ilości wkrętów gubi ręcznie wpisaną cenę jednostkową

Klucz ceny okucia zawiera `name|spec`, a spec zawiera wyliczone ilości. W kopii projektu usunięcie jednego wzmocnienia zmienia Wkręt 4×30 z 52 na 48 szt., w tym opis „48 szt.” na „44 szt.”. Powstaje inny klucz ceny; wcześniejsza własna cena nie jest odszukiwana i wraca cena domyślna. To samo okucie powinno zachowywać cenę niezależnie od potrzebnej ilości. Użyć stabilnego identyfikatora produktu, nie opisów ilości montażowych.

## N30 [P3, przypadek graniczny] Nogi nakładają się przy małej głębokości

D100: przednie i tylne nogi nakładają się na 20 mm. D120: obie pary zajmują identyczne miejsca, mimo czterech nóg w zamówieniu. D150: przecięcie 10 mm. Brak komunikatu o tej kolizji. Jeśli taka płytka konstrukcja nie jest wspierana, potrzebna walidacja; w przeciwnym razie dostosować rozstaw. Nie przedstawiać jako awarii standardowej szafki D560.

## N31 [P2] Błąd szczeliny nad nieistniejącą przegrodą dla płyt 10/12 mm

Jedno pole, jeden poziom, jedna kolumna i jedne drzwi; brak przegrody rozdzielającej fronty. Dla korpusu 10 mm pojawia się błąd szczeliny −4 mm, dla 12 mm −2 mm. Walidacja `divGap` działa bezwarunkowo przy frontach nałożonych, nawet bez odpowiedniej przegrody. Ostrzeżenie katalogowe o grubości innej niż 18 mm jest osobną, zasadną informacją; tutaj błędem jest dodatkowy komunikat o nieistniejącym styku frontów.

## N32 [P3, walidacja danych] Dopuszczona zerowa i ujemna grubość płyty

Przy froncie wpuszczanym, korpusie 0 albo −1 mm obliczenia generują formatki bez błędu wymiaru; widoczne jest tylko ogólne ostrzeżenie „inna niż 18 mm”. Pole grubości nie ustala dodatniego minimum. Oczekiwane: jednoznaczny błąd i brak akceptacji niepoprawnej grubości; sprawdzać również dane importowane.

## N33 [P3, przypadek graniczny] Dwa konfirmaty trafiają w ten sam otwór

D60/80/100, pełne dno i wieniec między bokami. `konfirmatyPoz` daje dwukrotnie 50 mm od przodu; plan wierceń wypisuje „50, 50 mm”, a zamówienie liczy oba mocowania. Nie ma błędu nakładania. Zredukować liczbę/zmienić rozmieszczenie w dopuszczalnym zakresie albo odrzucić zbyt płytką konstrukcję.

Dowody: lokalne wyniki `audit30-new-results.json`, `audit30-obstacle-results.json`, `audit30-depth-results.json`, `audit30-hardware-results.json`, `audit30-delete-results.json`, `audit30-validation-results.json`, `audit30-limit-results.json`; retesty grubości i macierzy osobno. Przed poprawką wykonać test UI i dodać właściwą regresję. Priorytety są oceną audytu, nie potwierdzeniem wymagań katalogowych.



---

# Seria 10 nowych ustaleń N12-N21 - 17.10.2026

Limit użytkownika: 10 nowych błędów albo10 minut. Rozpoczęto10:38:36 czasu polskiego. Znaleziono10 różnych ustaleń w lokalnych testach kodu; nie są jednakowej wagi. N13 i N20 to drobne różnice wymiaru/precyzji, N19 dotyczy importowanego JSON. Nie przedstawiać ich jako dziesięciu krytycznych awarii w standardowym projekcie.

Źródło main ponownie sprawdzone: szafki.jsx blob688b93c92636d6e5909979d68a8ce9bf5f4e6732. Odczytano BLEDY.md, pominięto N1-N11. Testy: wyodrębnione computeGeo/Scene3D/projectParts/scalOkucia/buildCutPlan oraz odczyt DOM strony dla komentarza użytkownika. Macierz45 konstrukcji/wnętrz i216 wariantów położenia zawiasów, celowane próby wartości granicznych. Nie wykonano pełnej suity Playwright ani wszystkich kliknięć UI. Raport nie jest potwierdzeniem fizycznego montażu ani katalogów producenta.

## N12 [P2] Dno i tył szuflady: materiał25 mm w zamówieniu, bryła18 mm

Odtworzenie: korpus18, osobna płyta półek25, shelfSameAsBoard=false, dwie szuflady. Formatki dna489 x526 i tyłu477 x230 mają matKey shelf, czyli grubość25. Scene3D tworzy dno489 x18 x526 i tył477 x230 x18. Obie szuflady: cztery rozbieżne płyty. Kolor poprawnie pochodzi z płyty półek, grubość pozostaje korpusowa18. To inny kod niż N7 (fronty).

Ostrzeżenie o katalogu18 mm istnieje, ale nie usuwa sprzeczności rysunek - zamawiany materiał. Naprawić wspólną geometrię skrzynki albo jawnie ograniczyć dopuszczalny materiał; nie tylko kolor. Regresje: shelf12/18/25 przy korpusie18, a następnie korpus25/półki18; bryła szafki i zabudowy, dno/tył, wysokość skrzynki. Odtworzono Scene3D, nie testowano całego montażu25 mm.

## N13 [P3] HDF po wycięciu tylnego narożnika różni się o1 mm między formatką i bryłą

Szafka600 x720 x560, HDF przybijany, lewe wycięcie100 x100 przez całą wysokość z maskownicą. Formatka HDF498 x718 x3, bryła499 x718 x3. Przy W800:698 kontra699. Powtórzone z drzwiami, szufladami, klapą, fixem i dwiema kolumnami. Bez błędów w uwagach tych prób.

Formatka odejmuje1 mm także przy krawędzi wycięcia, plecyBryla ustawia tę krawędź bez tego odsunięcia. Różnica mała; audyt z tolerancją3 mm jej nie wykryje. Wymaga ujednolicenia konwencji luzu, nie deklaracji awarii montażu.

## N14 [P2] Blenda nad szafką jest zamawiana i pokazana z przodu, ale nie ma jej w bryle3D

topFiller.on=true, height80, W600: formatka „Blenda nad szafką”600 x80 z frontu18. Pełna lista płyt wygenerowana przez Scene3D nie zawiera tej sztuki. Wariant W800 również bez blendy. Występuje z drzwiami, szufladami, klapą, fixem i kolumnami. Kod FrontView/CabFront ma prostokąt blendy, Scene3D nie dodaje odpowiadającej bryły. Sprawdzono wszystkie płyty w tej funkcji, nie tylko widoczne piksele.

Regresja: porównanie formatek z trzema wymiarami bryły przy on/off, osobne płyty frontów, nawis blatu i zakres zabudowy. Dodatkowe formatki ręczne mogą celowo nie mieć pozycji; topFiller jest elementem geometrycznym i nie jest takim przypadkiem.

## N15 [P2] Poprawny długi blat roboczy szafki dostaje błąd arkusza płyty meblowej

Szafka W600, blat na bokach worktop38, wysunięcie w prawo2500, pozostałe0. Formatka blatu3100 x560 mieści się na handlowym4100 x600. computeGeo dodaje jednak błąd „Blat3100 x560 nie mieści się na arkuszu ...2761.2 x2061.2”. P() waliduje każdą formatkę na USABLE_W/H, nie uwzględniając matKey worktop, mimo osobnej późniejszej kontroli WORKTOP_LEN/depth.

Duży nawis może wymagać osobnych podpór; nie twierdzimy, że ta konstrukcja jest gotowa do montażu. Zgłoszenie dotyczy fałszywego powodu odrzucenia materiału. To nie N2: tam gubiony był format blatu ciągu w rozkroju, tutaj błędna walidacja pojedynczej szafki.

## N16 [P2] Plan wierceń może podawać otwory poza płytą bez błędu

Szafka D560 z półką, shelfPin.dFront=700, dBack=700. Plan dla obu boków: „700 i -140 mm od przedniej krawędzi płyty”. Uwagi puste; brak kontroli przedziału0..głębokość płyty. Num tych pól nie ogranicza max do rozmiaru półki.

Niepoprawne dane powinny dać jawny błąd przed zamówieniem/wydrukiem. Regresje: ujemne wartości, poza głębokością, front/back zamienione, dwie osie w jednym punkcie i ograniczenia przy krótszej półce za wspornikiem. Odtworzono niepoprawne współrzędne planu, nie wykonano fizycznych wierceń.

## N17 [P3] Własny blat roboczy na bokach ma w3D kolor korpusu

Realne kolory włączone. Korpus czerwony#ff0000, worktop niebieski#0000ff, blat600 x570 x38. Zamówienie matKey worktop, bryła600 x38 x570 ma color#ff0000. Scene3D rysuje górną płytę przez bf=mat.board.color niezależnie od geo.isWorktop. Złącza/dane handlowe nie są tu kwestionowane.

Naprawa: materiał górnej płyty według jej roli; regresje wieniec/18 mm blat/worktop38, kolory realne w3D szafki/zabudowy. Potwierdzono Scene3D; nie twierdzić, że wszystkie inne widoki mają ten sam błąd.

## N18 [P2] Automatyczne przesuwanie zawiasów może nałożyć je na jeden punkt

Szafka H250, jedne drzwi, pięć półek, liczba zawiasów automatyczna2. hingePts=[115,115] od dołu korpusu. Program zamawia dwa zawiasy w tej samej osi i opisuje przesunięcie z zachowanym luzem30 mm; brak błędu o niemożliwym montażu. Są ostrzeżenia o małych światłach półek, ale nie o zduplikowanych zawiasach. H150/pięć półek również [120,120].

Przeszukanie216 kombinacji H/shelves/hn wykryło44 warianty z powtarzającymi się osiami (część ma dodatkowe błędy, dlatego przykłady wyżej wybrano bez error). hingePositions nie traktuje już ustawionych zawiasów jako przeszkód i po czterech próbach nie weryfikuje końcowego rozwiązania.

Regresja musi sprawdzać unikalność osi, odstępy i końcowe kolizje; jeżeli brak miejsca, zgłosić błąd zamiast tworzyć niemożliwy plan. To inny problem niż B2 (liczba zawiasów klapy) i N7 (grubość frontu).

## N19 [P3] Import przyjmuje nieobsługiwaną długość prowadnicy i tworzy produkt NL325

Tylko ścieżka danych/importu: w JSON kolumna szuflad nl325. computeGeo tworzy prowadnicę V-BOX Slim238 z spec „NL325 mm”, dno489 x301 i sugeruje jedynie głębszą NL550. Brak błędu, że325 nie występuje w wewnętrznej liście VBOX.nl=[250,270,300,350,400,450,500,550,600].

Zwykły selektor UI oferuje wyłącznie długości z listy, więc tego nie przedstawiać jako standardowego błędu wyboru z listy. Import może pochodzić z ręcznej edycji/innej wersji. Regresja walidacji danych:325 oraz inne wartości spoza listy, zgodność kolumny i pojedynczej szuflady. Nie weryfikowano oferty producenta - niespójność z własną tabelą aplikacji wystarcza do zgłoszenia.

## N20 [P3] Zbyt wczesne zaokrąglanie powierzchni luster zaniża sumę

Trzy osobne szafki, każda front596 x714 i lustro595 x713. Rzeczywista powierzchnia jednego0.424235 m², razem1.272705. computeGeo wpisuje qty0.42 na szafkę; scalOkucia sumuje1.26 m². Nawet po zaokrągleniu dopiero końcowej sumy do2 miejsc wyszłoby1.27. Wbudowana cena200 zł/m² daje różnicę2.541 zł przed zaokrągleniem kwoty.

To błąd precyzji wyceny. Nie zmienia wymiarów poszczególnych luster podanych w spec. Ponadto scalony tekst nadal zawiera „x1 szt.” mimo trzech identycznych luster - w ramach tego samego zgłoszenia o agregacji. Przechować dokładną powierzchnię i liczbę sztuk, formatować dopiero sumę.

## N21 [P2] Wyłączenie zawieszek we wszystkich szafkach nie usuwa wspólnej listwy do zawieszek

Dwie szafki600 w jednym ciągu wiszącym, bez nóg i cokołu, run.hangerMode=listwa, cab.hangers=never dla obu. Każda lista szafki poprawnie nie zawiera zawieszek. projectParts mimo to dodaje „Listwa montażowa do zawieszek”, spec1160 mm, qty1.2 mb. runRail sprawdza nogi/cokół i tryb ciągu, lecz nie sprawdza, czy którakolwiek szafka faktycznie korzysta z zawieszek.

Użytkownik jawnie wyłączył system zawieszenia, a nie zamówił samodzielnej listwy. Potrzebna spójna reguła wieszania i zamówienia, również dla częściowego wyłączenia zawieszek. Nie zgłaszano tu oddzielnie zaokrąglenia1160 mm do1.2 mb: może być zamierzoną jednostką zakupu.

## U3 [P3] Komentarz użytkownika: znika nagłówek „Rysunek”

Potwierdzone dodatkowo w bieżącym DOM: viewport714 px, szerokość nagłówka sekcji665.6 px, h2.textContent=Rysunek, h2.width=0 px, scrollWidth51 px. Zrzut użytkownika pokazuje samą strzałkę bez napisu. Card ma przycisk flex-1/min-w-0 i h2.truncate; toolbar zabiera dostępną szerokość. Przenieść toolbar do kolejnego wiersza lub zapewnić minimalną szerokość tytułu. To obserwacja użytkownika, poza dziesięcioma nowymi przypadkami wyżej; odrębna przyczyna od U2 (wysokość przyklejonego nagłówka).

## Zakres dalszej weryfikacji

Wyniki są odtworzone w funkcjach aktualnego kodu, nie pełnym teście UI. Najpierw potwierdzić N12/N14/N16/N18, następnie pozostałe; nie naprawiać zasad katalogowych na wyczucie. Testy regresji powinny sprawdzać trzy wymiary, materiał i liczbę sztuk, nie tylko dopasowanie wymiarów z tolerancją3 mm. Nie publikowano JSON użytkownika ani zmian aplikacji.


---

# N11 [P2] Plecy ustawiane w kolumnie zmieniają formatki, lecz bryła 3D ignoruje to ustawienie

Stan main ponownie zweryfikowany17.10.2026: szafki.jsx blob688b93c92636d6e5909979d68a8ce9bf5f4e6732. Odtworzono lokalnie w aktualnych funkcjach computeGeo i Scene3D na wariantach Szafki1 użytkownika. Nie wykonano testu kliknięć ani wszystkich rysunków2D; nie zmieniano aplikacji.

## Odtworzenie i wyniki

Szafka600 x720 x560, jedna kolumna, plecy poza korpusem. Ustawienie całej szafki cab.back oraz ustawienie „plecy” kolumny col.backMode.

| Cała szafka | Kolumna | Zamówienie | Bryła3D |
|---|---|---|---|
| HDF | brak | brak pleców | HDF598 x718 x3 nadal narysowany |
| brak | HDF | HDF598 x718 x3 | brak pleców |
| HDF | płyta | płyta598 x718 x18 | HDF598 x718 x3 |
| płyta | HDF | HDF598 x718 x3 | płyta600 x720 x18 |
| płyta | brak | brak pleców | płyta600 x720 x18 |
| brak | płyta | płyta598 x718 x18 | brak pleców |
| płyta | płyta (jawnie) | płyta598 x718 x18 | płyta600 x720 x18 |

Macierz3 x3: globalnie HDF/brak/płyta, kolumna HDF/brak/płyta. Zgodne dwa przypadki HDF/HDF i brak/brak; w pozostałych siedmiu różni się obecność, materiał/grubość lub wymiar. Jawne wybranie płyty w kolumnie uruchamia inną gałąź niż dziedziczenie.

## Przyczyna

computeGeo ma backOverride i generuje panele osobno dla poziomów/kolumn, uwzględniając rawCol.backMode. plecyBryla(cab,geo) sprawdza wyłącznie cab.back i zwraca jeden pełny prostokąt. Scene3D oraz Assembly3D używają tego pomocnika bez rozpisania pleców kolumn. W kodzie Assembly3D potwierdzono tę samą ścieżkę; osobny test całej zabudowy dla tych wariantów nie był wykonywany.

## Wpływ i naprawa

To bezpośrednia niezgodność rysowanych i zamawianych elementów, niezależna od N5 (kolory HDF w rozkroju). Może pozostać niewidoczna przy testowaniu tylko domyślnych pleców całej szafki. Nie uznawano automatycznie wyników kolizji i okuć za błędne; trzeba je osobno przetestować.

Geometria powinna zwracać wspólną listę płyt pleców z położeniem, grubością i materiałem, używaną przez formatki, bryły i rysunki2D. Regresje: macierz3x3, dwie kolumny z różnymi plecami, kilka poziomów, frez HDF, plecy wewnątrz/na zewnątrz, szafka z blatem na bokach i wycięciem. Sprawdzić także zamówienie PDF oraz rzeczywistą głębokość półek/szuflad przy takim nadpisaniu.


---

# Nowe ustalenia N9-N10 - 17.10.2026

Źródło szafki.jsx blob 688b93c92636d6e5909979d68a8ce9bf5f4e6732. Odtworzono na lokalnych funkcjach computeGeo/projectParts/scalOkucia aktualnego kodu. Bez pełnej suity i testu kliknięć. Nie zmieniano aplikacji.

## N9 [P2] Różne warianty nóżek tracą specyfikację w zbiorczym zamówieniu

Dwie szafki: pierwsza ma cztery nóżki kwadratowe100 mm, druga cztery okrągłe150 mm. projectParts daje dwie poprawne pozycje z odrębną specyfikacją. scalOkucia daje jeden wiersz: „Nóżka regulowana”, qty8, spec „pod szafką”. Znika wysokość i kształt, a kolor nie był zawarty już w specyfikacji pojedynczej nóżki.

Przyczyna: klucz scalOkucia pomija spec, jeżeli h.use istnieje. Po scaleniu spec jest zastępowany opisem zastosowań. Pozycje o różnych cechach handlowych nie mogą być traktowane jako ten sam produkt tylko dlatego, że służą do tego samego.

Skutek: zbiorcze zamówienie i PDF nie mówią, ile kupić każdego rodzaju. Wycena używa jednej pozycji zamiast umożliwiać osobne ceny wariantów. Potwierdzono utratę height/shape; ceny wariantów nie są w aplikacji odrębnie katalogowane i nie zakładano ich wartości.

Naprawa: osobny stabilny klucz produktu obejmujący wariant handlowy (wysokość/kształt/kolor/model), oddzielny od tekstu zastosowania. Sumować zastosowania tylko w obrębie identycznego produktu. Sprawdzić również inne okucia z use, np. odmiany zawiasów - nie uznano ich tu automatycznie za dodatkowe błędy.

## N10 [P2] Dodatkowa formatka znika po nadaniu nazwy „Cokół” lub „Blat” w ciągu ze wspólnym elementem

Odtworzenie na kopii projektu użytkownika: Szafka1 w ciągu ze wspólnym cokołem. Dopisać dodatkową formatkę z nazwą „Cokół”, wymiarami999 x123, qty1. computeGeo.panels zawiera ją poprawnie z note „formatka dopisana ręcznie”. projectParts usuwa ją całkowicie. Zmiana nazwy na „Cokół dodatkowy” przywraca tę samą formatkę do projectParts.

Przyczyna: drop/projectParts filtruje wszystkie p.name === „Cokół”, jeżeli ciąg ma wspólny cokół, a analogicznie „Blat” dla wspólnego blatu. formatkiSzafki stosuje ten sam filtr nazw. Dodatkowa ręczna formatka nie ma identyfikatora odróżniającego ją od automatycznego elementu korpusu.

Skutek: formatka wypada z listy zamówienia, rozkroju i wyceny oraz z listy szafki po zastosowaniu sharedPlinth/sharedTop. Testem obliczeniowym potwierdzono przypadek „Cokół”; „Blat” wynika z identycznego filtra, do osobnej regresji UI.

Naprawa: oznaczać pochodzenie/rolę elementu i usuwać jedynie automatyczny cokół/blat szafki zastępowany wspólnym. Nie używać edytowalnej nazwy jako identyfikatora. Regresje: nazwy „Cokół”, „Blat”, „Dno”, nazwa pusta i dowolna; z ciągiem i bez; suma ilości i obecność w rozkroju oraz PDF.


---

# Nowe ustalenia N7-N8 - 17.10.2026

Źródło szafki.jsx blob 688b93c92636d6e5909979d68a8ce9bf5f4e6732. Testy lokalnych funkcji computeGeo i Scene3D, bez końcowego renderowania SVG i pełnego testu kliknięć. Nie zmieniano kodu aplikacji.

## N7 [P2] Front z płyty korpusu ma w geometrii grubość ukrytego materiału frontów

Odtworzenie: korpus 25 mm, osobny materiał frontów 18 mm, zaznaczone „Fronty z tej samej płyty co korpus”. Lista formatek daje Drzwi nakładane z matKey board, czyli materiał 25 mm. computeGeoLiczy ustawia jednak tf = mat.front.thickness bez uwzględnienia flagi. Bryła zamkniętych drzwi Scene3D ma 18 mm grubości.

W drugą stronę: korpus18, zachowany osobny front25, frontSameAsBoard=true: zamówienie board18, geometryT i grubość bryły25. Ukryty materiał może pozostać po odznaczeniu i ponownym zaznaczeniu przełącznika albo po zmianie grubości korpusu; setMat/setCab nie synchronizują tych grubości.

Macierz: flaga true/false x korpus18/25 x materiał frontu12/18/25 (12 przypadków). Przy false geometria odpowiada materiałowi frontów. Przy true wszystkie cztery warianty o różnych grubościach są niespójne. Dodatkowo pojawia się ostrzeżenie o nieużywanym materiale frontów12/25.

Skutek: bezpośrednia rozbieżność rysunek 3D - zamawiana grubość. tf jest też używane w głębokościach, drzwiach wpuszczanych i kontroli ruchów; ich wszystkich nie przetestowano w tym zgłoszeniu, więc to potencjalny dalszy wpływ, nie oddzielne potwierdzone błędy.

Naprawa: efektywny materiał frontu ustalać raz, zgodnie z frontSameAsBoard; na jego podstawie liczyć grubość, masę, geometrię i zamówienie. Zachować możliwość powrotu do osobnego materiału frontów. Regresje: zmiana grubości korpusu przy zaznaczonej fladze oraz zaznaczenie flagi po wcześniejszym osobnym froncie; overlay/inset, drzwi/klapa/szuflada/fix.

## N8 [P3] Nóżki wysokości 0 mają geometrię 0, a w zamówieniu 100 mm

W polu wysokości nóżek można zapisać 0. computeGeo liczy legH=0 i nie zgłasza dla tego przypadku uwagi. Hardware spec używa cab.legs.height || 100, więc daje „kwadratowa, wysokość 100 mm”, qty4. Geometria stosuje num(height) ?? 100, traktując 0 jako rzeczywistą wartość. Ta sama alternatywa ||100 występuje w okuciach ramienia.

Odtworzone na Szafce1 z projektu: legH0, hardware100, messages[]. To błąd wartości granicznej, nie deklaracja, że nóżka0 jest prawidłowym produktem.

Naprawa: uzgodnić dozwolone minimum wysokości; nieprawidłowe0 jawnie odrzucić lub zamienić na jedną wspólną wartość. Wymiar geometrii, pole i specyfikacja zamówienia muszą być zgodne. Regresje: 0, puste, dodatnia wartość; szafka i ramię.

## Ograniczenie wcześniejszego testu 61/61

N7 wyjaśnia, dlaczego zgodność dwóch wymiarów i ilości formatek nie wystarcza do potwierdzenia materiału i grubości. W oryginalnym JSON płyty miały po18 mm, więc ten błąd nie ujawniał się tam. Testy pełnej zgodności powinny obejmować trzeci wymiar i tożsamość materiału.


---

# Kolejne nowe ustalenia N5-N6 - 17.10.2026

Źródło szafki.jsx: blob 688b93c92636d6e5909979d68a8ce9bf5f4e6732. Testy wyodrębnionych funkcji obliczeniowych; nie pełny przebieg UI. Nie zmieniano aplikacji.

## N5 [P2] Różne kolory HDF są łączone na jednym arkuszu rozkroju

Przypadek: dwie szafki z plecami HDF 3 mm, jedna biała, druga czarna, ta sama nazwa materiału HDF. Zmiana koloru jest dostępna w karcie Płyty (paleta obejmuje także plecy).

matLabelOf uwzględnia kolor tylko dla board/front/shelf. Dla obu materiałów back daje „HDF”. buildCutPlan grupuje po tej etykiecie. Dwie formatki 598 x 718 mm różnych kolorów układa na jednym arkuszu HDF: wynik 1 arkusz, 2 sztuki. Oddzielne grupy kolorów wymagają w tym teście dwóch arkuszy, po jednym na kolor. Identyczna cena HDF dla różnych kolorów nie uprawnia do wspólnego rozkroju.

Skutek: niewłaściwa liczba kupowanych arkuszy i formatowania; zamówienie tekstowe nie rozróżnia koloru pleców. Formatki projektu mają color w kluczu, lecz ich etykiety są jednakowe, a rozkrój ponownie je łączy. To nowy problem identyfikacji materiału, niezależny od arkuszy blatów N2-N4.

Naprawa: klucz grupowania musi zachować rolę, kolor/dekor i grubość materiału; opis HDF powinien jednoznacznie wskazywać kolor. Test: białe/czarne HDF z tą samą nazwą i grubością, ekran/PDF/rozkrój/wycena.

## N6 [P2] Ręczne oklejanie wstawki narożnej jest ignorowane

Przypadek z projektu użytkownika: płaska wstawka w rogu Szafki 3, 720 x 60 mm. W tabeli formatek używana jest wspólna kontrolka EdgeChips, która przy kliknięciu zapisuje cab.edgeOverrides według nazwy formatki. Dla wstawki zapis trafia do „Wstawka w rogu”.

Test: cab.edgeOverrides = { „Wstawka w rogu”: { a1:false, b1:false, b2:true } }. projectParts nadal zwraca edges { a1:true, a2:false, b1:true, b2:false }, dokładnie jak przed zmianą. wstawkaParts ustawia obrzeża na sztywno, nie odczytuje overrides. formatkiSzafki również tylko dokłada jej wynik; brak zastosowania ręcznej zmiany w tej ścieżce.

Skutek: kontrolka oferuje zmianę oklejania, ale lista i zamówienie pozostają przy automacie. Nie interpretować tego jako potwierdzenia niewłaściwego domyślnego oklejania; problem dotyczy nieskutecznej ręcznej zmiany.

Naprawa: albo stosować overrides także do dodatkowych elementów przypisanych szafce, albo jawnie zablokować kontrolkę, jeżeli zmiana jest niedozwolona. Test: kliknięcie, zapis JSON, ponowne wczytanie, formatki szafki/projektu/PDF i metry obrzeża. Sprawdzić osobno płyty ramienia L i listwę wstawki; ich nie uznano automatycznie za potwierdzone dodatkowe błędy.


---

# Nowe błędy - 17.10.2026

Wyłącznie nowe ustalenia, bez powtarzania zgłoszeń z 16.10. Źródło: szafki.jsx, blob 688b93c92636d6e5909979d68a8ce9bf5f4e6732 na main. Odtworzono lokalnie na wyodrębnionych funkcjach aktualnego kodu; nie wykonano pełnej suity ani wizualnej reprodukcji tych wariantów w przeglądarce. Nie zmieniano aplikacji. Zapisano w AUDYT_GPT.md na gałęzi audytu.

## N2 [P2] Głęboki blat ciągu gubi właściwy format arkusza

Przypadek: jeden dolny ciąg, szafka W600 H720 D650, blat roboczy włączony, domyślny materiał blatu depth600, pilnowanie słojów włączone. runTop prawidłowo wylicza blat 600 x 683 mm z arkusza 4100 x 1200. projectParts pozostawia jednak part.mat.worktop.depth=600. ReportCutPlan (około 13246) bierze sheet z worktopDepth(part.mat), a ekran rozkroju (około 14802) z materiału aktywnej szafki.

Test funkcji: wejście z arkuszem 600 odrzuca tę formatkę, 0 arkuszy i 0 ułożonych sztuk. Po przekazaniu prawidłowego arkusza 1200: 1 arkusz, 1 sztuka, brak odrzuceń. Przy wyłączonej kontroli słojów niektóre krótkie blaty mogą zostać obrócone i zmieścić się w pasie600; to nie naprawia utraty formatu i wymaga osobnego ustalenia zasad profilu.

Wpływ: poprawna formatka istnieje w zamówieniu, ale może zniknąć z rozkroju i liczby kupowanych arkuszy; planSheets sumuje same sheets.length. ReportCutPlan nie wypisuje listy rejected. To błąd danych, nie znany wcześniej mylący nagłówek B3.

Naprawa: przenosić rzeczywisty arkusz rt.arkusz z blatu ciągu do jego pozycji rozkroju; nie ustalać go na podstawie aktywnej szafki. W przypadku rejected jawnie pokazać niekompletny rozkrój/wycenę.

## N3 [P2] Dwa formaty arkusza blatu są łączone według samej etykiety; wynik zależy od kolejności

buildCutPlan (około 12871) grupuje tylko po matLabel, a arkusz bierze z pierwszego elementu mającego sheet. Ten sam dekor/nazwa/kolor/grubość może mieć format600 i1200; matLabelOf nie uwzględnia głębokości arkusza.

Test wejścia: Blat A 3000 x 600 z arkusza4100x600 oraz Blat B 3000 x1000 z arkusza4100x1200, identyczny matLabel, bez obrotu.

- A przed B: jeden arkusz600, jedna formatka ułożona, B odrzucony.
- B przed A: dwa arkusze1200, obie formatki ułożone.

Kolejność pozycji nie może decydować o utracie formatki. Reguła wyboru materiału handlowego powinna być jawna: osobne grupy formatów albo świadoma wspólna optymalizacja na szerszym arkuszu. Dotyczy także ścieżki PDF, która ma własne łączenie wierszy bez sheet w kluczu.

## N4 [P2] Domyślna cena wszystkich blatów zależy od aktywnej szafki

boardDefault (około 14890) zwraca dla każdej pozycji worktop WORKTOP_PRICES[worktopDepth(mat)], gdzie mat to aktywna szafka, a nie materiał wycenianej pozycji. matByLabel zapisuje tylko color/key, gubiąc depth. Wiersze rozkroju całego projektu również korzystają z tego aktywnego mat.

Test dokładnego fragmentu boardDefault z kodu, dwie różne etykiety blatów:

- aktywny materiał depth600: obie ceny 563,99 zł/arkusz;
- aktywny materiał depth1200: obie ceny 1128,22 zł/arkusz.

W projekcie z różnymi blatami jedna z tych cen jest niewłaściwa; zmiana oglądanej szafki może zmieniać wycenę bez zmiany zamówienia. Różnica jednostkowa 564,23 zł. Odtworzenie dotyczy funkcji; pełnej reakcji komponentu UI i opóźnionego przeliczenia nie testowano.

Naprawa: cena i format muszą wynikać z pozycji/grupy arkusza. Zachować oddzielne klucze cen formatów600/1200, aby ręczna cena też nie łączyła różnych produktów.

## Zalecane regresje

Głęboki ciąg D650 z materiałem depth600 i kontrolą słojów; dwa ciągi z różnymi arkuszami i tą samą etykietą materiału w obu kolejnościach; dwa różne dekory/formaty i zmiana aktywnej szafki. W każdym porównać liczbę formatek wejściowych z ułożonymi + rejected, PDF/ekran, format arkusza, ilość, cenę i niezmienność sumy przy zmianie aktywnej szafki.

N2-N4 są powiązane przez brak tożsamości formatu handlowego, ale wymagają kontroli trzech miejsc: wejścia rozkroju, grupowania i cennika.


---

# Aktualizacja po reteście i kontroli PDF — 16.10.2026

Ta sekcja zastępuje statusy starszego audytu poniżej.

- B1: poprawiony w reteście — jedna propozycja boku 178 mm; po zastosowaniu błąd luzu znika.
- B2: poprawiony w reteście — zamówienie i wiercenia zgodne dla 2/3/4 zawiasów, wartości spoza zakresu walidowane.
- B3: opis zamówienia w UI poprawiony; w PDF pozostaje mylący ogólny nagłówek rozkroju, opisany niżej.
- U1: poprawiony w reteście zakresów 75/90/100 stopni.
- U2: uwaga o dużym nagłówku na wąskim ekranie pozostaje.
- N1 [P3]: nieaktualny tooltip automatycznej liczby zawiasów nadal opisuje stare progi; test frontu 596 × 894 mm daje już 3 zawiasy.
- Szafka testowa H900: automatycznie 3 zawiasy, środkowy przesunięty z 447 do 381 mm względem frontu; przycisk dopisania notatki działa. PDF tej szafki nadal wymaga sprawdzenia.
- Złącza blatów w UI: 2 szt. × 9 zł = 18 zł; cena 0 wyklucza je z sumy.
- 24 warianty obliczeń bez wykrytych rozbieżności liczby zawiasów/geometrii ani niefinitywnych lub ujemnych wymiarów. To testy celowane, nie pełna suita repozytorium.

# Kontrola PDF - 16.10.2026

Źródło: PDF przekazany przez użytkownika, wygenerowany 16.10.2026 o 20:18; 16 stron, 6 szafek. Kontrola tekstu wszystkich stron i renderów; szczegółowy podgląd stron 12, 14, 15, 16. Jest to wynik dla przesłanego dokumentu, bez potwierdzenia wersji kodu użytej do jego wygenerowania.

## Ustalenia

- P2, strona 14: w tabeli „Produkty całego projektu” brak złączy blatów. Projekt ma dwa blaty w narożniku (1799 x 600 i 2300 x 600). W poprzednim teście interfejs pokazywał 2 złącza za 18 zł. Należy porównać eksport z aktualnym interfejsem dla dokładnie tego samego zapisu; możliwe pominięcie eksportu lub starsza wersja strony. Sam PDF nie rozstrzyga przyczyny.
- P3, strona 15: ogólny nagłówek rozkroju podaje arkusz 2800 x 2100 mm, również nad tabelą zawierającą blat roboczy. Rysunki blatów na stronie 16 poprawnie podają 4100 x 600 mm. Dodać format arkusza do każdego wiersza tabeli lub rozdzielić nagłówki materiałów. Poprzedniego B3 nie należy uznawać za w pełni zamknięty dla PDF.
- P3, strony 15-16: nagłówek „HDF” pozostaje na samym dole strony 15, a jego rysunek zaczyna stronę 16. Utrzymać nagłówek wraz z pierwszym rysunkiem (reguły podziału strony).
- Drobna redakcja, strona 13: „6 szafki” -> „6 szafek”.
- Czytelność: podpisy w rozkroju, zwłaszcza przy wąskich listwach, są bardzo małe w wydruku A4. Warto dodać większy wariant wydruku pojedynczego arkusza / legendę z numerami formatek.

## Co wygląda poprawnie

- Brak pustych stron i widocznych poważnych ucięć tabel. Rysunki szafek zachowują proporcje, polskie znaki renderują się prawidłowo.
- Każda szafka ma stronę z czterema widokami i stronę tabel z formatkami, okuciami oraz wierceniami.
- Szafka 5: zamówienie zawiera prowadnice o bokach 238 i 210 mm, po jednym komplecie NL 550. Wysokości prowadnic 18/367 mm w tabeli odpowiadają 0/349 względem górnego lica dna, różnica 18 mm. Nie jest to samo w sobie sprzeczność wymiarów.
- Wstawka narożna 720 x 60 mm występuje w tabeli szafki i zestawieniu projektu.
- Blaty są rozrysowane na dwóch arkuszach 4100 x 600 mm, ze zrzutami 1797 i 2298 mm.

## Zakres, którego ten dokument nie sprawdza

Wszystkie korpusy mają 720 mm wysokości. Nie ma testowej szafki z frontem około 900 mm i trzema zawiasami; PDF nie pozwala potwierdzić jej ostrzeżenia, przesunięcia zawiasu ani notatki montażowej. Nie ma również klap ani testu opcjonalnego relingu. Brak tych elementów w tym dokumencie nie jest automatycznie błędem aplikacji.

Uwagi dopisane do AUDYT_GPT.md na gałęzi raportu; nie zmieniano kodu aplikacji.


---

# Archiwum pierwszego audytu — poniższe statusy są historyczne

# Audyt GPT — MebloProjekt, 16.10.2026

Przeprowadzono testy interfejsu GitHub Pages oraz lokalny audyt obliczeń na przekazanym projekcie: 6 szafek, 2 ciągi, 1 pomieszczenie. Znaleziono trzy potwierdzone błędy oraz dwie uwagi do wizualizacji. Główne przypadki ze zrzutu użytkownika działają.

Raport zapisany na GitHubie na prośbę użytkownika. Nie zmieniano kodu aplikacji. Projekt testowano na kopii; po testach ponownie wczytano oryginalny JSON. Plik projektu, wyniki zawierające jego geometrię i zrzuty pozostają lokalnie — nie są częścią tego commitu.

## 1. Wyniki listy użytkownika

| Obszar | Wynik i dowód |
|---|---|
| Szafka 5 — automatyczny bok górnej szuflady | OK: bok 210 mm, luz nad bokiem i tyłem 30 mm; dolna ma bok 238 mm i luz 91 mm. |
| Szafka 5 — ręczne 238 mm na górze | OK w UI: komunikat o 0 mm luzu do wzmocnienia pod blatem i minimum 5 mm; przycisk zmienia bok na 210 mm. |
| Pełny wysuw Szafki 5 | OK w lokalnej symulacji z repozytorium: obie szuflady na NL 550, co 5 mm, bez kolizji. |
| Reling | OK: ostrzeżenie przy wystawaniu frontu o 145 mm, oba przyciski dostępne i pole „reling” w wierszu szuflady. „Dodaj reling” dodaje 1 komplet NL 550 do produktów szafki i projektu oraz 30,00 zł do wyceny. Ścieżka „Zostaw bez relingu” wymaga powtórzenia w UI — próba kliknięcia nie dała wiarygodnego potwierdzenia. |
| Formatki <60 mm | OK: test szafki W=90 mm daje dno/wieniec i półkę 54 mm, drzwi 42 mm; zamówienie pokazuje odpowiednio 60 mm. Potwierdzenie ręcznej docinki dna/wieńca zmienia błąd w ostrzeżenie, bez zmniejszenia wymiaru zamówienia. |
| Wstawka w Szafce 3 | OK: pole w Strukturze wnętrza. Szeroka ma trójkąty, konfirmaty i konfirmaty z listwą. Konfirmaty: 3 szt. przy wysokości 720 mm. Listwa pojawia się w formatkach. |
| Wstawka 40 mm | OK: pytanie o poprawność wymiaru, przyciski „Popraw na 60 mm” i „Tak, 40 mm — docinam ręcznie”; wstawka i listwa zamawiane jako 720×60. Potwierdzenie pozostawia ostrzeżenie o ręcznej docince. Sam przycisk poprawy na 60 nie został osobno kliknięty. |
| Kolizja drzwi w rogu | OK: bez wstawki, zawias Szafki 3 z prawej → około 74°. Opcje 18 mm i 60 mm opisane „bez kolizji”; zastosowanie 18 mm usuwa komunikat. Zawias z lewej w tej konfiguracji daje około 6°, więc jego brak w propozycjach przy 74° jest prawidłowy. |
| Cokoły | OK w geometrii oryginalnego projektu: 1854×100×18 i 1737×100×18; wspólna płaszczyzna styku, bez szczeliny i bez przenikania objętości. Lokalne sprawdzenie zamkniętej bryły zabudowy nie wykryło przenikań >1 mm. |
| Każde otwarcie 3D od 90° | OK w UI: ustawienie suwaka na 0°, zamknięcie i ponowne otwarcie daje 90°. |
| Klapy — przełączniki i formatka | OK: skrzydło/klapa, następnie góra/dół; formatka „Klapa”, podnośnik lub amortyzator we właściwej pozycji produktów i wyceny. |
| Klapy — dobór i liczby | OK dla sprawdzonych przykładów: 600×400×18 mm, 680 kg/m³ → 2,9376 kg, 1×150 N przy 90°; 901×400 → domyślnie 2 siłowniki/amortyzatory i 3 zawiasy. Ręczna 1 sztuka przy 901 mm daje ostrzeżenie i informację o przekroczeniu udźwigu. Sprawdzono zgodność z tabelami osadzonymi w kodzie, nie wykonano osobnego odczytu oryginalnych PDF producenta. |

## 2. Potwierdzone błędy

### B1 [P2] Przycisk poprawy boku szuflady proponuje wymiar nadal niespełniający luzu

Odtworzenie:

1. Szafka stojąca 600×720×560, zwykły wieniec, 3 szuflady, równy podział, domyślny luz między frontami 2 mm.
2. W dolnej szufladzie ręcznie wybierz bok 238 mm.
3. Pojawiają się jednocześnie dwie poprawki: 210 mm z kontroli wysokości frontu oraz 178 mm z kontroli przestrzeni nad skrzynką.
4. Wybierz „Zmień bok szuflady na 210 mm”.

Wynik: nadal błąd, zostaje 1 mm zamiast minimum 5 mm i dopiero kolejny przycisk proponuje 178 mm. Potwierdzone w UI i ponownie w lokalnych obliczeniach.

Przyczyna: `fitLower` sprawdza tylko wysokość frontu, niezależnie od kontroli drogi skrzynki. [szafki.jsx:2807](https://github.com/darekn95/mebloprojekt/blob/main/szafki.jsx#L2807).

Zalecenie: wyliczać proponowany bok z przecięcia wszystkich ograniczeń albo ukryć słabszą propozycję. Test regresji: po wybraniu proponowanego mniejszego boku nie może pozostać błąd luzu dla tej szuflady. Nie zmieniać wymaganego minimum 5 mm.

### B2 [P2] Ręczna liczba zawiasów klapy różni się od liczby punktów wiercenia

Odtworzenie: klapa 600×400, w polu „zawiasy” wpisz 4. UI przyjmuje wartość i zamawia 4 sztuki. Geometria i plan wierceń zawierają 3 punkty. Przy ręcznym 1 zamówienie zawiera 1 sztukę, ale punkty są 2. Automatyczne 2 i 3 są spójne.

| Wpisano | Zamówienie | Punkty geometrii/wiercenia |
|---|---|---|
| 1 | 1 | 2 |
| 2 | 2 | 2 |
| 3 | 3 | 3 |
| 4 | 4 | 3 |

Przyczyna: `nZaw >= 3 ? [lewy, środek, prawy] : [lewy, prawy]`. [szafki.jsx:2460](https://github.com/darekn95/mebloprojekt/blob/main/szafki.jsx#L2460).

Zalecenie: uzgodnić dozwolony zakres ręcznej liczby zawiasów. Następnie albo walidować pole, albo generować dokładnie N punktów. Liczba w zamówieniu, rysunku i planie musi być identyczna. Nie zgadywać zasad montażu dodatkowych zawiasów.

### B3 [P2] Podsumowanie zamówienia pokazuje błędny rozmiar arkusza blatu

W sekcji „Rozkrój na płycie” → „Płyty do zamówienia” materiał „Blat roboczy” dostaje opis arkusza 2800×2100. Tymczasem rozkrój blatu jest liczony i rysowany na pasie 4100×600 w tym projekcie.

Przyczyna: podsumowanie bezwarunkowo wstawia `SHEET_W` i `SHEET_H` dla każdej grupy. [szafki.jsx:17645](https://github.com/darekn95/mebloprojekt/blob/main/szafki.jsx#L17645).

Zalecenie: etykietę brać z wymiarów arkusza grupy materiałowej. Testować blat 600 i 1200 oraz zwykłą płytę. To błąd opisu zamówienia; nie potwierdzono na tej podstawie błędu samej ceny ani liczby kupowanych pasów.

## 3. Uwagi do wizualizacji

### U1 Kąt klapy w bryle jest ograniczony do 90°

`klapaObrot` stosuje `Math.min(90, angle)`. Lokalny test bryły dla 90° i 100° dał identyczne współrzędne frontu. Tymczasem formularz doboru podnośnika pozwala wybrać 100°, a suwak 3D ma zakres do 110°. [szafki.jsx:9433](https://github.com/darekn95/mebloprojekt/blob/main/szafki.jsx#L9433).

Do ustalenia: czy 3D ma odwzorowywać cały zakres suwaka, czy klapy mają celowo kończyć na 90°? Jeśli ograniczenie jest zamierzone, interfejs powinien je jasno pokazywać. Reset każdego nowego otwarcia do 90° ma zostać niezależnie od tej decyzji.

### U2 Wąski podgląd: nagłówek zajmuje większość wysokości okna

Przy oknie około 600×495 px nagłówek z paskami obu ciągów zajmuje około 377 px. Po „Pokaż rysunek” sam rysunek jest w dużej części zasłonięty. Warto przetestować zwijanie pasków albo mniejszy nagłówek na wąskich ekranach. Zrzut `podglad-przywrocony.png` pozostaje lokalnie, nie jest dołączony do repozytorium. To obserwacja układu; nie zmieniano rozmiaru okna na potrzeby testu.

## 4. Nieaktualne lub niepełne punkty listy

- Plan zawiasów klap już istnieje: dla klapy do góry w sprawdzonym korpusie znajduje się w „Wzmocnienie poziome”, dla klapy w dół w „Dno”; po dwa punkty przy automatycznych 2 zawiasach. Nie przedstawiać tego jako całkowitego braku funkcji. B2 opisuje konkretną pozostałą niespójność.
- Kod ma kontrolę ruchu klap (`klapaHit`, `openingMsgs`) i uwzględnia blat jako przeszkodę. Nie ma podstaw do stwierdzenia, że kontrola klap całkowicie nie istnieje. Wariant klapy do góry na Szafce 3 przy domyślnych 90° nie zgłosił kolizji w lokalnym sprawdzeniu. Scenariusze graniczne z górną szafką oraz rzeczywistą osią zawiasu wymagają osobnego uzgodnienia i testu — nie uznano ich za zaliczone.
- Brak propozycji przełożenia zawiasów przy kącie 74° jest celowy, jeżeli po przełożeniu wynik jest gorszy. W tym projekcie uzyskano około 6°.

## 5. Metoda i ograniczenia

- Przejrzano `AGENTS.md`, `README.md`, `AI_NOTES.md`, `BLEDY.md`, `NASTEPNE-KROKI.md`, `SLOWNIK.md`, spis instrukcji oraz odpowiednie istniejące testy.
- Kod źródłowy: blob SHA `fbae069982232a2b2417fda2fac595e9856554b2`; `standalone.html`: `8d966b92c15bdffe0204a1c12e62fc6ae834ab98`. Osadzony kod standalone jest identyczny z `szafki.jsx` po pominięciu brzegowych białych znaków.
- Lokalny `work/audyt-core.mjs` zawiera wybrane funkcje obliczeniowe z tego źródła. Z funkcji rysujących 3D pominięto końcowy rendering SVG, zachowując budowę brył. Użyto oryginalnej funkcji `symuluj` z `testy/symwysuw.mjs`. To audyt pochodny, a nie uruchomienie pełnej suity Playwright repozytorium.
- Brak przenikań oznacza wynik zastosowanej kontroli prostopadłościanów przy zamkniętej zabudowie i tolerancji >1 mm z wyjątkiem cienkich płyt zgodnym z audytem repozytorium. Nie oznacza certyfikacji wszystkich ruchów, okuć i wariantów konstrukcji.
- Nie wykonano pełnego `pelny.sh`, losowych edycji, całości audytu macierzowego ani eksportu i oględzin PDF. Nie wykonano pełnego porównania każdej formatki z bryłą we wszystkich widokach. Nie zmieniano aplikacji i nie opublikowano żadnych poprawek.
- Konsola: ostrzeżenie Tailwind CDN i komunikat Babel o źródle >500 KB. Nie wykryto w odczytanych logach wyjątku aplikacji; komunikat Babel nie jest awarią funkcji.

## 6. Zalecana kolejność dla Claude

1. Naprawić B2 (spójność liczby zawiasów i wierceń), następnie B1 i B3.
2. Dodać celowane regresje do `klapy`/`audytwierc`, `szuflady` i testu opisu zamówienia blatu.
3. Uzgodnić U1 oraz testy klapy przy górnej szafce/blacie na konkretnym układzie i z określoną osią zawiasu.
4. Przy zmianie `szafki.jsx` wygenerować ponownie `standalone.html`. Pełny przebieg zgodnie z zasadami repozytorium przed wyraźnie zleconym scaleniem. Sam raport nie jest zgodą na modyfikację ani publikację.

Wyniki liczbowe `wyniki-obliczen.json` oraz skrypty audytu pozostają lokalnie. Ten plik na GitHubie zawiera opis wyników i kroki odtworzenia; nie wymaga tych załączników do zrozumienia zgłoszonych błędów.
