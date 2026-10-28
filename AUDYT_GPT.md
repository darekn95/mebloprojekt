# Audyt GPT — pozostałe uwagi do poprawy

Aktualizacja: 21.10.2026. Lista obejmuje potwierdzone uwagi pozostałe po reteście aplikacji i PDF z 21.10.2026, godz. 14:37. Naprawione zgłoszenia usunięto; ich opisy pozostają w historii Git.

## PDF-1 [P3] Drobne wymiary i podpisy na wydruku A4

**Stan:** do poprawy — czytelność wydruku.

**Gdzie:** rysunki szafek na stronach 1–12 oraz podpisy długich, wąskich elementów rozkroju, szczególnie strona 18, w sprawdzonym PDF liczącym 21 stron.

**Objaw:** część wymiarów, opisów okuć i podpisów wąskich listew jest zbyt drobna do wygodnego odczytu na wydruku A4 w skali 100%. Osobne strony arkuszy poprawiły czytelność rozkroju, ale nie rozwiązują wszystkich małych podpisów. Nie stwierdzono znikania elementów ani ucięcia ich opisów.

**Wpływ:** podczas montażu lub oznaczania formatek trzeba powiększać dokument na ekranie; wydruk może być mało wygodny.

**Proponowana poprawa:**
- Zwiększyć rozmiar małych wymiarów i opisów na widokach szafki, zachowując odstępy między liniami wymiarowymi.
- Dla wąskich listew zastosować numer elementu powiązany z czytelną legendą albo podpis poza elementem.
- Jeśli powiększenie powoduje nakładanie tekstu, udostępnić dodatkowy wydruk pojedynczego widoku lub większy format strony.

**Kryterium odbioru:** na wydruku A4 w skali 100% można odczytać wymiary i jednoznacznie przypisać opisy do elementów; brak nakładania i obcinania podpisów. Sprawdzić zwykłą szafkę, szuflady oraz arkusz zawierający listwy 100 mm.



## Nowy audyt 21.10.2026 — N69–N81

Sprawdzona wersja: main `21b31ce1db3e2f0a5b1afe748e1a8e71f3e6c8c6`, plik `szafki.jsx` (blob `b2d4271da583cc43c47ba41681a1a65f99445562`). Poniższe przypadki potwierdzono przez wykonanie funkcji obliczeń i generowania brył z tej wersji oraz analizę odpowiadających im miejsc w kodzie. Testy syntetyczne, bez zmiany projektu użytkownika. Nie jest to deklaracja przetestowania wszystkich ekranów ani nowy audyt PDF.

### N69 [P2] Blat przesunięty przy większym odstępie od ściany u góry niż u dołu

**Odtworzenie:** jeden ciąg z szafką 600 × 720 × 560 mm, HDF 3 mm, wspólny blat; odstęp od ściany: dół 0 mm, góra 100 mm. Różnica reprezentuje ścianę odsuwającą się od pleców szafki ku górze.

**Wynik:** `runTop` poprawnie zwiększa głębokość blatu do 693 mm, lecz `Assembly3D` umieszcza go od płaszczyzny 0 zamiast od −100 mm względem tylnej płaszczyzny przy podłodze. Blat jest przesunięty o 100 mm do przodu: nie dochodzi do ściany na wysokości blatu, a jego przedni wysięg jest o 100 mm za duży. Podobne ograniczenie występuje w rzucie z góry.

**Przyczyna:** położenie korzysta z `Math.max(0, gs.bottom - gs.top)`; dla 0−100 znika potrzebne ujemne przesunięcie. W `Assembly3D` okolice linii 7741, w rzutach z góry analogiczna reguła.

**Wpływ:** poprawnie policzona formatka jest narysowana w złym miejscu; widoki nie przedstawiają rzeczywistego dopasowania blatu do ściany.

**Kontrola:** dół/góra 0/0 oraz 100/0 nie wykazują tej utraty przesunięcia.

**Kryterium naprawy:** zachować znak różnicy odstępów w położeniu blatu, spójnie w 2D i 3D. Przy 0/100 tylna krawędź dochodzi do ściany na górze, a wysięg przed front nie zwiększa się o dodatkowe 100 mm. Nie zmieniać poprawnej głębokości zamówienia.

### N70 [P2] Tylne wzmocnienie szafki L ma grubość korpusu na rysunku, a płyty półek w zamówieniu

**Odtworzenie:** szafka L 900 × 720 × 560 mm, tylne wzmocnienie 150 mm, wariant A albo B; korpus 18 mm; wyłączyć „Półki z tej samej płyty co korpus”, ustawić płytę półek 12 mm. Jedne drzwi z zawiasem po stronie pełnego boku, bez błędów konfiguracji.

**Wynik:** obie pozycje „Kątownik przy ramieniu — bok/plecy” zamawiane są jako 150 × 684 × **12 mm**. Prostokąty `postRects`, bryła szafki i zabudowy nadal używają **18 mm**. To tylne wzmocnienie, nie przedni kątownik narożnika z dawnego N59.

**Przyczyna:** `postRects` w `computeGeo` (okolice 1957–1965) używa `t`, chociaż formatki tych płyt (3520–3523) mają materiał `shelf`. Sama zmiana koloru nie rozwiązuje grubości.

**Wpływ:** położenie styku płyt, podparcie i wizualizacja nie odpowiadają elementom zamówionym do wykonania.

**Kontrola:** potwierdzone A i B, korpus 12/18 mm oraz półki 12/16/18 mm; przy równej grubości rozbieżność znika. Minimalne przypadki nie mają komunikatów błędu.

**Kryterium naprawy:** wzmocnienie z rzeczywistej płyty półek; wspólna grubość i położenie dla formatek, rzutów, obu widoków 3D oraz zależnych mocowań. Sprawdzić obie strony ramienia.

### N71 [P2] Zabudowa przeszkody liczy styki i bryłę grubością korpusu zamiast swojej płyty

**Odtworzenie:** korpus 800 × 1000 × 560 mm, płyta korpusu 12 mm, osobna płyta półek 18 mm; bez półek/drzwi. Przeszkoda 100 × 150 mm na pełną wysokość wnętrza, zabudowa L przy lewym boku albo U odsunięta o 200 mm od boku; czoło przed bokami.

**Wynik:** formatki zabudowy mają materiał półek **18 mm**, lecz jej ścianki w 3D szafki i zabudowy mają **12 mm**. W wariancie U zamówione czoło ma szerokość **124 mm** (=100+2×12), choć powinno przykrywać dwa boki 18 mm, czyli mieć **136 mm**. To również błąd wymiaru formatki, nie tylko wyglądu.

**Przyczyna:** `buildEnclosure` wybiera `smat = shelfMat`, ale grubość ścianek, naddatki i odsunięcia nadal liczy przez `t` korpusu (okolice 3870–3940). Poprawka dawnego N24 ujednoliciła bryły z pozycjami ścianek, lecz nie obejmuje osobnej grubości ich materiału.

**Kontrola:** L i U, płyta półek 12/16/18 mm przy korpusie 12 mm; zgodność dla 12/12, rozbieżność dla 12/16 i 12/18; bez błędów konfiguracji.

**Wpływ:** zamówiona zabudowa nie składa się według przedstawionego styku; przy U czoło jest o 12 mm za wąskie w powyższym przykładzie.

**Kryterium naprawy:** używać grubości faktycznego materiału zabudowy przy obliczaniu ścianek i ich styków. Uwzględnić, że grubość istniejącego boku korpusu pozostaje niezależna. Sprawdzić L/U, obie strony, czoło przed/między bokami, a także zabudowy wycięć korzystające z tej funkcji.


### N72 [P2] Ręczne wzmocnienia mogą wychodzić poza korpus bez komunikatu

**Stan:** potwierdzony w funkcjach aktualnej wersji `szafki.jsx`, blob `b2d4271da583cc43c47ba41681a1a65f99445562`.

**Odtworzenie:** szafka 600 × 720 × 560 mm, jedna pusta kolumna, bez zawieszek. W „Wzmocnieniach” dodać wzmocnienie poziome: głębokość 200 mm, „Głębokość od lica” 500 mm, położenie u góry. Drugi przykład: pionowe albo czołowe wzmocnienie o wysokości 800 mm w tym samym korpusie.

**Wynik:** pierwsze wzmocnienie zajmuje głębokość od 500 do 700 mm, czyli wychodzi 140 mm za korpus 560 mm. Drugie zajmuje wysokość od −98 do 702 mm: przechodzi przez dno i wystaje poniżej szafki. Obliczenia zwracają w tych przykładach pustą listę uwag, a niewłaściwe formatki trafiają do zamówienia.

**Kontrola granicy:** poziome 200 mm przy odsunięciu 360 mm kończy się poprawnie na 560 mm. Przy 361 mm jest już 1 mm poza korpusem, nadal bez uwagi. Sprawdzono orientacje pozioma/pionowa/czołowa; duża wysokość dotyczy dwóch ostatnich. Nie traktować nieużywanego pola wysokości wzmocnienia poziomego jako błędu.

**Przyczyna:** tworzenie `c.rails` w `computeGeo` (okolice 2311–2354) nie sprawdza zawierania wzmocnienia w świetle kolumny i dopuszczalnej głębokości. Formularz ma pola bez ograniczenia, a `setRail` przekazuje wartości bez korekty. Kontrola rozmiaru arkusza nie zastępuje kontroli montażu.

**Wpływ:** projekt bez uwag może zamawiać wzmocnienie, którego nie da się zamontować w podanym położeniu.

**Kryterium naprawy:** błąd przy wyjściu wzmocnienia poza dostępną przestrzeń, z podaniem maksymalnej wysokości/głębokości/odsunięcia. Uwzględnić plecy i poziom, liczenie od lica/tyłu oraz każdą orientację. Nie zmieniać ustawień użytkownika po cichu.

### N73 [P2] Plecy ustawione osobno w kolumnach nie są uwzględnione w odsunięciu szafki od ściany

**Stan:** potwierdzony w tej samej wersji, oddzielny problem od dawnego N11 (wymiary/obecność płyt) i N27 (materiał pełnych pleców).

**Odtworzenie:** korpus głębokości 560 mm, dla całej szafki „Plecy: brak”; dwie kolumny, w pierwszej „Plecy z płyty”, w drugiej „Brak”. Płyta korpusu 18 mm. Umieścić szafkę w ciągu bez odstępu od ściany.

**Wynik:** `plecyKolumn` poprawnie zawiera płytę 18 mm przybitą za korpusem, ale `geo.glebOdSciany` i głębokość ciągu nadal wynoszą **560 mm**, zamiast **578 mm**. W bryle zabudowy plecy zajmują zakres **0…18 mm za płaszczyzną ściany**; powinny kończyć się na ścianie, a korpus stać przed nimi. Przy HDF w kolumnie analogiczna różnica wynosi 3 mm. Przy globalnym HDF 3 mm i płycie 18 mm w kolumnie pomijane jest dodatkowe 15 mm.

**Przyczyna:** `plecyZa` i `glebOdSciany` (okolice 1817–1826) wynikają z globalnego `cab.back`, a nie z faktycznych płyt tylnych po uwzględnieniu ustawień kolumn. `plecyBryly` rysuje płyty kolumn za korpusem, więc ich geometria nie zgadza się z układem ciągu.

**Kontrola:** globalne HDF + kolumna HDF daje poprawne 563 mm; globalna płyta + kolumna z tą płytą daje 578 mm. Zmiana materiału pleców tylko w kolumnie nie aktualizuje tego wymiaru. Przypadki nie mają komunikatów błędu.

**Wpływ:** błędne ustawienie względem ściany i głębokość zabudowy. Zaniżony wymiar trafia też do obliczeń zależnych od głębokości ciągu, m.in. blatu i odsunięcia w rogu. Po zmianie materiału pleców projekt może fizycznie wymagać większej głębokości niż pokazuje układ.

**Kryterium naprawy:** wyznaczać zajętą głębokość z rzeczywistego kompletu pleców, w tym maksymalnej grubości pleców przybijanych w kolumnach. Sprawdzić mieszane HDF/płyta/brak, kolumny i poziomy, „głębokość obejmuje plecy”, układ przy ścianie, blat i róg. Gdy wszystkie kolumny mają „brak”, nie dodawać grubości nieistniejących globalnych pleców.


### N74 [P2] Niska klapa opuszczana zamawia amortyzator z mocowaniem poza bokiem

**Sprawdzona wersja:** `szafki.jsx`, blob `b2d4271da583cc43c47ba41681a1a65f99445562`. Potwierdzone wykonaniem obliczeń i planu wierceń, bez zmiany projektu użytkownika.

**Odtworzenie:** szafka 400 × 200 × 350 mm, płyta 18 mm, zwykły wieniec i dno między bokami, jedna kolumna bez półek. Jedne drzwi przestawić na klapę opuszczaną w dół; amortyzator automatyczny, jedna sztuka po lewej.

**Wynik:** jedyny komunikat to informacja o poprawnym doborze: front 396 × 194 mm, ok. 0,9 kg, amortyzator 60 N. Produkt trafia do zamówienia. Plan wierceń dla „Bok lewy” wskazuje środek płytki **263 mm od dołu płyty**, choć bok ma tylko **200 mm** wysokości. Mocowanie wypada **63 mm poza płytą**. Nie ma błędu ani ostrzeżenia o braku miejsca na montaż.

**Kontrola:** przy H250 środek nadal jest na 263 mm (13 mm poza płytą), bez uwagi. Przy H300 i H400 jest w obrębie boku. Przypadki nie mają innych błędów konfiguracji. Sam dobór siły z masy klapy nie sprawdza możliwości przykręcenia okucia.

**Przyczyna:** mocowanie amortyzatora wyliczane jest jako `plytaY + AMORTYZATOR_H` (245 mm od płyty z zawiasami; tutaj 18+245=263), bez sprawdzenia zakresu płyty niosącej mocowanie. Kontrola minimalnej wysokości w części zamówienia dotyczy wyłącznie klapy do góry.

**Wpływ:** projekt podaje niewykonalne wiercenie i zamawia okucie, którego nie da się zamontować według własnego planu.

**Kryterium naprawy:** sprawdzać obrys płytki i otwory względem rzeczywistego boku/przegrody/wspornika przy obu kierunkach klapy; zgłaszać brak miejsca zamiast samej informacji o sile. Sprawdzić jedną/dwie sztuki, obie strony, kilka poziomów oraz różne połączenia dna i wieńca. Nie przesuwać mocowania dowolnie — zmienione wymiary muszą wynikać z instrukcji danego okucia.


### N75 [P2] Automatyczne przesunięcie kołków tworzy zbieżne otwory

**Odtworzenie:** korpus 800 × 720 × 240 mm, bez pleców i zawieszek; jeden poziom z dwiema kolumnami, po jednej półce na tej samej wysokości. Kołki podporowe, otwór od przodu 100 mm, od tyłu 100 mm.

**Wynik:** po stronie kolumny 1 przegroda ma otwory na 100 i 140 mm od przedniej krawędzi. Po stronie kolumny 2 mechanizm unikania kolizji przesuwa je o 20 mm do środka i plan podaje **120 i 120 mm** na tej samej wysokości (333 mm od dołu przegrody). Dwa kołki po jednej stronie wymagają więc jednego, identycznego otworu. Zamówienie nadal przewiduje cztery kołki na każdą półkę, bez ostrzeżenia.

**Drugi wariant:** przy głębokości 220 mm plan podaje po jednej stronie 100/120, a po przeciwnej 120/100 mm — oba otwory nadal są naprzeciw siebie. Przesunięcie mające uniknąć kolizji tylko zamienia miejscami dwa otwory.

**Przyczyna:** `pinNoteL` (okolice 4212) dodaje/odejmuje stałe 20 mm. Kontrola `pinF + pinB < gl` sprawdza parametry przed przesunięciem, nie końcowe pary otworów po obu stronach. To nowy przypadek automatycznej korekty, nie dawne N16 dotyczące wejściowych odległości poza półką.

**Kontrola:** głębokość 280 mm daje różne pozycje 120/160; przestawienie drugiej półki na 250 mm usuwa potrzebę przesunięcia i przywraca 100/140 dla D240. Wszystkie opisane konfiguracje zwracają pustą listę uwag.

**Kryterium naprawy:** sprawdzać końcowe pozycje i rozstaw otworów, zarówno na jednej stronie, jak i naprzeciwko po drugiej stronie przegrody. Gdy stałe 20 mm nie rozwiązuje kolizji, dobrać wykonalny rozstaw albo zgłosić błąd z konkretną radą. Objąć analogiczne przesunięcia trójkątów.

### N76 [P2] Wspornik fixu i poziome wzmocnienie przecinają się bez uwagi

**Odtworzenie:** korpus 600 × 720 × 560 mm, płyta 18 mm, jedna pusta kolumna, bez zawieszek. Fix po lewej, szerokość 60 mm, **wpuszczany**, wspornik pionowy o głębokości 100 mm. Dodać wzmocnienie poziome na dole, głębokość 100 mm, 100 mm od lica.

**Wynik:** wspornik ma obrys x=62…80, y=18…702, głębokość od lica 18…118 mm. Wzmocnienie ma obrys x=18…582, y=18…36, głębokość 100…200 mm. Bryły przecinają się w obszarze **18 × 18 × 18 mm**. Formatki obu pełnych płyt są zamawiane; nie ma uwagi o kolizji. Zarówno `computeGeo().msgs`, jak i `openingMsgs` są puste.

**Kontrola:** to samo występuje przy wzmocnieniu na górze. Odsunięcie wzmocnienia do 200 mm usuwa przecięcie. Przy fixie nakładanym i odsunięciu 100 mm płyty tylko dochodzą do siebie (wspornik kończy się na 100 mm), więc tego wariantu nie zgłaszać jako kolizji.

**Przyczyna:** wspornik i ręczne wzmocnienie są liczone niezależnie. Kontrole głębokości wspornika i ograniczeń korpusu nie sprawdzają ich wspólnej objętości wewnątrz kolumny. To inny problem niż N72, w którym wzmocnienie wychodzi poza korpus.

**Wpływ:** zamówionych formatek nie da się złożyć w przedstawionym położeniu bez dodatkowego skrócenia lub wycięcia, którego projekt nie opisuje.

**Kryterium naprawy:** wykrywać rzeczywiste przecięcie wspornika i wzmocnienia; dopasować styk wraz z wymiarami formatek albo zgłosić niewykonalność i podać możliwe przesunięcie. Sprawdzić oba boki, górę/dół, fix nakładany/wpuszczany i położenie wzmocnienia od lica/tyłu.

### N77 [P2] Ilość listwy montażowej zaokrąglana w dół poniżej potrzebnej długości

**Odtworzenie:** wisząca szafka szerokości 680 mm, na zawieszkach z listwą; bez nóżek i cokołu. Alternatywnie ciąg dwóch takich wiszących szafek po 340 mm, bez szczeliny, ze wspólną listwą.

**Wynik:** opis produktu prawidłowo podaje odcinek **640 mm** (szerokość minus 40 mm), ale ilość do zamówienia wynosi **0,6 mb = 600 mm**. Brakuje 40 mm w stosunku do własnej specyfikacji. Wycena korzysta z tej zaniżonej ilości. Powtarzanie takich odcinków sumuje błąd, bo zaokrąglenie zachodzi przed scaleniem zamówienia.

**Kontrola:** W640 daje odcinek 600 mm i prawidłowe 0,6 mb. W700 daje odcinek 660 mm, ale ilość 0,7 mb. To zaokrąglanie do najbliższych 10 cm, nie przeliczenie długości na metry. Wariant pojedynczy i wspólna listwa ciągu potwierdzone niezależnie, bez innych komunikatów błędu.

**Przyczyna:** `Math.round(dlugosc / 100) / 10` zamiast dokładnego `dlugosc / 1000`. Dotyczy listwy szafki (okolice 4917), ramienia narożnego (12181) i wspólnej listwy ciągu w `projectParts` (12503). Wyświetlanie ilości już obsługuje trzy miejsca po przecinku.

**Wpływ:** ilość i cena nie odpowiadają długości opisanej w zamówieniu; zakup dokładnie według ilości może nie wystarczyć do podanego odcinka.

**Kryterium naprawy:** przechowywać i sumować dokładną długość w mb; ewentualny zakup w odcinkach handlowych lub skokach 0,1 mb zaokrąglać dopiero zgodnie z regułą sprzedaży i zawsze tak, aby nie zabrakło materiału. Nie przyjmować długości odcinka handlowego bez ustalenia. Sprawdzić wiele osobnych szafek, ciąg oraz ramię L.


### N78 [P2] Szafka z własnym blatem w ciągu dostaje dodatkowy blat na podłodze w 3D

**Odtworzenie:** jedna szafka 600 × 720 × 560 mm, bez nóżek i cokołu, jedna pusta kolumna. „Wieniec” przełączyć na „Blat”, materiał z płyty meblowej 18 mm, bez wysunięć. Szafka należy do prostego ciągu; wspólny „Blat roboczy na całym ciągu” wyłączony.

**Wynik:** w `Assembly3D` występują dwie bryły 600 × 18 × 560 mm:
- właściwy blat szafki na wysokości **702…720 mm**;
- dodatkowa bryła oznaczona `tag: blat` na wysokości **0…18 mm**, przy podłodze, dodatkowo przesunięta o 3 mm względem własnego blatu przy HDF.

Zamówienie projektu zawiera tylko jedną płytę „Blat ciągu” 600 × 560 mm. Rysunek przedstawia więc dodatkowy element, którego nie zamawiamy. `worktopMsgs`, `runWideMsgs` i kontrola otwierania nie zgłaszają problemu w tym wariancie z płyty.

**Kontrola:** przy dwóch szafkach w ciągu widać dwa indywidualne blaty na górze i dodatkową płytę 1200 × 18 × 560 mm przy podłodze; zamówienie scala blaty w jedną płytę 1200 × 560 mm. Dla własnego blatu roboczego 38 mm dodatkowa bryła jest na 0…38 mm, podczas gdy właściwe blaty są na 682…720 mm. Poza ciągiem zamówienie zachowuje własny blat szafki.

**Przyczyna:** `runTop` tworzy wynik również z własnych blatów szafek przy wyłączonym `run.worktop`, ale wysokość `y` bierze tylko z `worktopLevel` albo ramienia narożnego; zwykły przypadek trafia w domyślne **0** (okolice 11830). `Assembly3D` najpierw rysuje własne blaty szafek, a potem dodatkowo wynik `runTop` (okolice 7733–7761).

**Wpływ:** fałszywy element na podłodze, niespójna liczba/położenie blatów między rysunkiem i zamówieniem; przy wysunięciach indywidualnych blatów dochodzi również do nakładania ich brył.

**Kryterium naprawy:** dla własnych blatów w ciągu ustalić właściwą wysokość i rysować jednokrotnie to, co zamawia projekt. Sprawdzić jedną/dwie szafki, płyty 18 mm i blat roboczy 38 mm, wysunięcia, różne wysokości szafek oraz ciąg podniesiony nad podłogę. Nie usuwać właściwego blatu, zostawiając tylko płytę na wysokości 0.


### N79 [P2] Własny blat szafki przejmuje materiał pierwszej szafki ciągu, która nie ma blatu

**Odtworzenie:** prosty ciąg dwóch szafek 600 × 720 × 560 mm; wspólny blat roboczy wyłączony. Pierwsza szafka ma zwykły wieniec i korpus „Dąb sonoma” 18 mm. Druga ma własny blat z płyty korpusu „Antracyt” 12 mm, bez wysunięć.

**Wynik:** obliczenia samej drugiej szafki prawidłowo wskazują jej własny blat 600 × 560 mm z antracytowej płyty 12 mm. Jednak `projectParts` usuwa go z pozycji szafki i zastępuje pozycją „Blat — C”, która bierze **płytę Dąb sonoma 18 mm z pierwszej szafki**. Pierwsza szafka nie ma własnego blatu i nie wnosi żadnego odcinka do tej powierzchni.

**Kontrola:** po samej zamianie kolejności szafek, bez zmiany materiałów ani ustawień blatu, zamówienie prawidłowo przechodzi na Antracyt 12 mm. Przy obu grubościach równych 18 mm nadal zmienia się błędnie kolor — ten wariant nie ma żadnych uwag. Przy płycie 12 mm jest wyłącznie ogólne ostrzeżenie o wymiarach katalogowych okuć dla 18 mm; nie dotyczy ono zamiany materiału blatu.

**Przyczyna:** `runTop` buduje odcinki z szafek mających `geo.isBlat`, ale potem wybiera `mat0 = list[0].it.mat` z pierwszej szafki całego ciągu (okolice 11817), zamiast z elementu będącego źródłem blatu. Z tej błędnej płyty bierze grubość i materiał zamówienia; `projectParts` filtruje już oryginalny blat szafki.

**Wpływ:** rzeczywiste zamówienie i rozkrój otrzymują niewłaściwą płytę, kolor oraz grubość. Wynik zależy od kolejności szafek, które w ogóle nie uczestniczą w tym blacie. To osobny problem od N78: N78 dotyczy dodatkowej bryły i wysokości w 3D, a N79 błędnego materiału faktycznie zamawianego.

**Kryterium naprawy:** blat pochodzący z konkretnej szafki zachowuje jej wybrany materiał, niezależnie od tego, jaka szafka stoi wcześniej w ciągu. Sprawdzić brak blatu w pierwszej szafce, różne kolory i grubości, przestawienie kolejności oraz kilka własnych blatów z różnymi materiałami. Nie scalać różnych materiałów bez jawnej reguły i informacji dla użytkownika. Nie zmieniać przy tym celowo wybranego wspólnego blatu roboczego.


### N80 [P2] Zamówienie luster pomija grubość i scala lustra 4 oraz 6 mm

**Odtworzenie:** dwie szafki 600 × 900 mm, po jednym skrzydle z lustrem, bez innych różnic. W karcie „Płyty” ustawić „Lustro — Grubość” na 4 mm dla jednej szafki i 6 mm dla drugiej.

**Wynik:** obie szafki generują identyczną pozycję „Lustro na drzwiach” z opisem **595 × 893 mm × 1 szt.**, bez grubości. W zbiorczym zamówieniu powstaje jeden wiersz **595 × 893 mm × 2 szt., 1,06267 m²**. Nie można z niego ustalić, że jedna tafla ma mieć 4 mm, a druga 6 mm.

**Kontrola:** grubość jest rzeczywiście używana przez silnik: w tym samym przykładzie lustro 4 mm daje 3 zawiasy, a 6 mm — 4 zawiasy, ze względu na inną masę. Obie konfiguracje nie mają uwag. Powierzchnia i liczba tafli są poprawne; to nie powrót dawnego N20 dotyczącego ich zaokrąglania.

**Przyczyna:** przy generowaniu pozycji lustra (okolice 4580–4600) nie jest przenoszona `mat.mirror.thickness` ani wariant handlowy. `scalOkucia` scala oba produkty, bo nazwa, jednostka i specyfikacja są identyczne. Tą samą ścieżką idą ekran, wycena oraz zestawienie produktów w PDF.

**Wpływ:** opis do zakupu jest niepełny i łączy różne materiały, mimo że grubość wpływa na działanie i dobór okuć projektu.

**Kryterium naprawy:** przekazywać grubość lustra do jego specyfikacji i klucza wariantu zamówienia; lustra 4 i 6 mm muszą pozostać rozróżnione. Lustra tej samej grubości nadal sumować prawidłowo według rozmiarów i powierzchni. Zachować poprawki liczby tafli i dokładnej powierzchni z N20.


### N81 [P2] Mocowania pleców ignorują ustawienia kolumn

**Sprawdzona wersja:** 22.10.2026, `szafki.jsx` nadal blob `b2d4271da583cc43c47ba41681a1a65f99445562`. Potwierdzone wykonaniem `computeGeo`, `projectParts` i `scalOkucia` na syntetycznych konfiguracjach.

**Odtworzenie:** szafka 600 × 720 mm, dwie puste kolumny, bez zawieszek. Globalnie „Plecy: brak”, w pierwszej kolumnie wybrać HDF, w drugiej pozostawić brak.

**Wynik:** zamówiona jest formatka „Plecy HDF” 299 × 718 mm, opisana jako przybijana, ale w zamówieniu nie ma żadnych gwoździków/zszywek do jej zamocowania. Analogicznie przy płycie w kolumnie nie ma wkrętów do pleców. Oba przypadki nie mają uwag.

**Dodatkowe kontrole tego samego błędu:**
- Globalne HDF, w kolumnach płyta + HDF: zamawiane jest 27 gwoździków/zszywek, lecz brak wkrętów do rzeczywistej płyty.
- Globalne HDF, obie kolumny „brak”: nie ma żadnej formatki pleców, mimo to zamawiane jest 27 gwoździków/zszywek.
- Kontrola: zwykłe pełne HDF bez nadpisania kolumn ma formatkę i 27 mocowań.

**Przyczyna:** lista `plecyKolumn` i formatki respektują `backMode` kolumn (okolice 3775–3813), ale generowanie mocowań (okolice 4957–4966) korzysta wyłącznie z globalnych `hasBack`, `backIsBoard`, `grooved` oraz obwodu całej szafki. Nie liczy istniejących płyt kolumn i ich materiału.

**Wpływ:** produkty do zakupu nie odpowiadają zamawianym plecom: brakuje właściwych mocowań albo kupowane są mocowania do nieistniejącego elementu. To problem kompletności zamówienia, odrębny od N73 dotyczącego zajętej głębokości i ustawienia przy ścianie.

**Kryterium naprawy:** liczyć typ i ilość mocowań z rzeczywistych płyt pleców oraz ich sposobu montażu, w tym nadpisań kolumn i poziomów. Płyta wymaga właściwych wkrętów, HDF odpowiednich mocowań, brak płyt oznacza brak mocowań. Sprawdzić także globalny frez z dzielonymi plecami przybijanymi; nie przyjmować nowego rozstawu montażowego bez uzgodnienia.


---

Nowe otwarte zgłoszenia: N69–N81; PDF-1 pozostaje. N74–N76 potwierdzono w funkcjach obliczeń i generowanej geometrii aktualnego źródła (blob `b2d4271da583cc43c47ba41681a1a65f99445562`), na konfiguracjach syntetycznych. Projekt użytkownika pozostał bez zmian. Test rozkroju 886 650 zestawów nie wykazał naruszeń sprawdzanych własności: liczby/wymiarów formatek, obrotu przy zakazie, granic arkusza, nakładania i odstępów rzazu. Nie jest to gwarancja optymalnego rozkroju ani pełnej poprawności aplikacji.







## Audyt drzwi, klap i poziomów kolumn — 26–27.10.2026

**Wersje:** testy widoków i edycji 26.10 na blobie `517a2ef31b3f4f2730821a5c01ab67fe5344205f`; retest obliczeń 27.10 na aktualnym `szafki.jsx`, blob `7b11faabc89e061b7fc69f78b9a6642dd9d93d68`. Poniższe zgłoszenia są nowe. Poprzednia sekcja N69–N81 opisuje wcześniejszą wersję i nie jest wynikiem ponownego audytu wszystkich tamtych zgłoszeń.

**Zakres:** 104 konfiguracje (fronty nakładane/wpuszczane; skrzydła/klapy góra/dół; uchwyt/brak/wydłużenie/podfrez/tip-on; jedna kolumna, trzy kolumny, trzy poziomy główne i trzy poziomy kolumny), projekt użytkownika — 9 szafek, oraz syntetyczna szafa 1800 × 2100 × 560 mm z dwoma poziomami głównymi i trzema kolumnami. W mieszanej szafie: drzwi, klapy, szuflady DXS w kolumnie i w jej poziomie, podfrez oraz tip-on. Projekt użytkownika pozostaje lokalnie; do repozytorium trafia tylko opis.

**Co przeszło:** dopasowanie wymiarów, grubości i liczby formatek do zamkniętej bryły w 104 konfiguracjach; w projekcie użytkownika również wszystkie 9 szafek (Szafka 6: 27 płyt); mieszana szafa w reteście 27.10: 51 płyt. W zamkniętych bryłach projektu użytkownika i mieszanej szafy nie znaleziono przecięć płyt. Symulacja wysuwu sześciu szuflad projektu nie wykazała kolizji. Obejrzano rzuty zamknięty/otwarty, bok/góra/tył oraz 3D (otwarcie i obrót), bez awarii aplikacji podczas tych działań. Kreator czterech klap zmienił tylko środkową kolumnę — sąsiednie pozostały identyczne. Zmiana jednej klapy na tip-on i kąt 75°/100° zmieniła tylko właściwy segment, z odpowiednim przeliczeniem siły. Nie jest to gwarancja wszystkich możliwych konfiguracji ani audyt nowego wydruku PDF.

### N82 [P2] Wydłużony front wpuszczany przecina dno korpusu bez błędu

**Odtworzenie:** szafka 600 × 600 × 560 mm, płyta 18 mm, dno i wieniec między bokami, front wpuszczany, jedne drzwi, bez półek. Nóżki 100 mm. Odznaczyć uchwyt i wybrać „front dłuższy od dołu”, 20 mm.

**Wynik:** drzwi mają 560 × 580 mm, zaczynają się na y=0, a dno zajmuje y=0…18. Obie płyty leżą na głębokości z=0…18, więc przecinają się w objętości **560 × 18 × 18 mm**. Formatka dłuższych drzwi jest zamawiana, interfejs pokazuje „bez uwag”. To nie tylko rysunek — pełny front nie da się zamknąć w podanym położeniu.

**Kontrole:** to samo dla klapy do góry i w konstrukcjach wielokolumnowych. Nakładany front 20 mm dłuższy przy nóżkach 100 mm nie przecina dna — leży przed korpusem. Wpuszczany z tip-on albo zwykłym uchwytem nie wykazuje tego przecięcia. Potwierdzone geometrią 26 i 27.10 oraz interfejsem.

**Przyczyna:** `otwieranieFrontu` bezwarunkowo obniża `d.y` i zwiększa `d.h`, również przy frontach wpuszczanych. Kontrola wydłużenia szuka frontu pod spodem i podłogi, lecz nie dna ani półki w tej samej płaszczyźnie głębokości.

**Kryterium naprawy:** wydłużenie nie może przecinać dna, półki granicznej ani innego elementu. Przy niewykonalnym wariancie zgłosić błąd i podać wykonalną opcję otwierania; nie zamieniać montażu frontu po cichu. Sprawdzić skrzydła i klapy, dół szafki oraz poziomy kolumn.

### N83 [P2] Front szafki stojącej bez nóżek może zejść pod podłogę

**Odtworzenie:** dolny ciąg na poziomie montażu 0, szafka 600 × 600 × 560 mm, bez nóżek i cokołu. Front nakładany, bez uchwytu, „front dłuższy od dołu”, 20 mm.

**Wynik:** spód korpusu stoi na podłodze, a spód frontu jest na y=−17 mm, czyli **17 mm pod podłogą**. Zamawiana jest formatka wysokości 614 mm. Nie ma błędu ani ostrzeżenia; interfejs pokazuje „bez uwag”. Przy 100 mm wydłużenia front schodzi 97 mm pod podłogę. Potwierdzone w funkcjach i interfejsie, powtórzone na źródle 27.10.

**Przyczyna:** wyznaczenie `podloga` uwzględnia wyłącznie cokół i nóżki. Pomija `cab.naPodlodze`, które aplikacja nadaje szafkom w stojącym dolnym ciągu (`cabDoGeo`/`ciagStoi`). W efekcie taki korpus jest traktowany przez tę kontrolę jak wiszący.

**Kontrola:** szafka na nóżkach 100 mm z wydłużeniem 100 mm poprawnie dostaje błąd niewystarczającego odstępu od podłogi. Prawdziwie wiszący ciąg nie powinien otrzymywać błędu tylko z powodu przejścia frontu poniżej spodu korpusu.

**Kryterium naprawy:** korzystać z rzeczywistej wysokości montażu/podłogi także bez nóżek i cokołu. Sprawdzić dolny ciąg na 0, nóżki/cokół i szafkę wiszącą. Zachować uzgodniony minimalny odstęp frontu od podłogi.

### N84 [P2] Plan wierceń scala różne klapy poziomów kolumny w jedną płytę

**Odtworzenie syntetyczne:** szafka 600 × 900 × 560 mm, jedna kolumna, jedna półka: dolne światło 300 mm, reszta auto. Półka jest granicą dwóch frontów, oba klapami do góry z dwoma podnośnikami; granica na konfirmatach. Klapy mają wysokości **322 i 568 mm**.

**Wynik:** `geo.drillPlan` tworzy jeden panel „Klapa”. Jego wiersz dla lewego mocowania podnośnika zawiera **229, 253, 467 i 491 mm** od dołu, a prawy — ten sam komplet. Pierwsza para należy do niższej klapy, druga do wyższej, ale znika przypisanie do poziomu i rozmiaru frontu. Otwory 467/491 są nawet poza krótszą płytą 322 mm.

**Przyczyna:** `klapaNazwa` rozróżnia tylko kolumnę (albo samo „Klapa”), bez `d.seg.nr`; `drillAdd` i grupowanie planu łączą następnie różne fronty. Plan jest przekazywany do zestawienia bez odzyskania tożsamości segmentu. Potwierdzone wykonaniem generowania planu w obu sprawdzonych wersjach; to ustalenie dotyczące danych planu, nie ocena wyglądu nowego PDF.

**Wpływ:** z planu nie można jednoznacznie wykonać wierceń każdej klapy. Poprawne formatki nie wystarczają, jeżeli otwory różnych frontów są opisane jak otwory jednej płyty.

**Kryterium naprawy:** osobny identyfikator i podpis każdego frontu: poziom główny, kolumna, poziom kolumny, opcjonalnie wymiar. Wysokości wierceń liczone od właściwego frontu; różne płyty pozostają rozdzielone również wtedy, gdy mają te same wymiary. Sprawdzić kilka klap do góry oraz mieszane góra/dół i lewy/prawy podnośnik.

### N85 [P3] Kreator klap w jednej kolumnie zapowiada podział całej szafki

**Odtworzenie:** szafka z trzema kolumnami; w środkowej trzy półki. Otworzyć „klapy zamiast drzwi…”.

**Wynik:** kreator mówi: „Półki zaznaczone jako granice staną się poziomami (płyta przez całą szafkę)”. Po wykonaniu tworzy jednak prawidłowo cztery poziomy tylko środkowej kolumny. Zapis projektu potwierdza: nadal jeden poziom główny, lewa i prawa kolumna bez zmian.

**Wpływ:** użytkownik dostaje błędny opis zakresu operacji — może zrezygnować w obawie przed zmianą całej szafy. To pozostałość starego opisu, a nie ponowne zgłoszenie naprawionego błędu dzielenia sąsiednich kolumn.

**Kryterium naprawy:** przy wielu kolumnach opis mówi o granicach frontów i stałych półkach wybranej kolumny; „przez całą szafkę” tylko przy rzeczywistej zamianie na poziomy główne. Tekst nadal występuje w źródle z 27.10.

## Dalszy audyt 27.10.2026 — N86–N87

Sprawdzona wersja `szafki.jsx`: blob `7b11faabc89e061b7fc69f78b9a6642dd9d93d68`. Oba przypadki odtworzone wykonaniem funkcji aktualnego kodu i w interfejsie GitHub Pages. Konfiguracje syntetyczne; plik projektu użytkownika nie jest publikowany.

### N86 [P2] Scalenie ostatniej granicy kolumny kasuje ustawienia dolnego poziomu

**Odtworzenie:** szafka 600 × 1200 × 560 mm, jedna kolumna, jedna półka jako granica dwóch poziomów kolumny. W dolnym poziomie wybrać jedną szufladę DXS, w górnym dwoje drzwi. Kliknąć „scal” na jedynej granicy.

**Wynik:** zamiast zachować ustawienia dolnego poziomu, aplikacja wraca do ustawień nadrzędnej kolumny. Szuflada znika, znika komplet prowadnic DXS i formatki skrzynki; pojawiają się zwykłe drzwi na całą wysokość. Nie ma pytania o zmianę rodzaju wnętrza. Potwierdzone w interfejsie i danych.

**Druga kontrola:** dolny poziom jako drzwi bez uchwytu z tip-on i zawiasem po prawej — po scaleniu pojawia się uchwyt, zawias wraca na lewo, tip-on znika. Gdy pozostaje więcej granic, usuwany jest tylko górny segment z danej pary; szczególny problem dotyczy likwidacji ostatniej granicy.

**Przyczyna:** `usunGranice` najpierw usuwa górny segment, ale gdy lista `podzial` staje się pusta, kasuje całe `col.segmenty`, nie przenosząc zachowanych ustawień dolnego segmentu do kolumny. To narusza opisaną regułę „scal zostawia ustawienia dolnego odcinka”.

**Wpływ:** utrata wyborów użytkownika oraz niezamierzona zmiana formatek i produktów do zakupu. Nie jest to zamierzona likwidacja samego podziału frontów.

**Kryterium naprawy:** przy usunięciu ostatniej granicy zachować efektywne ustawienia dolnego poziomu w powstałej kolumnie (rodzaj, szuflady i ich system, fronty, otwieranie, strona zawiasów itd.). Osobno sprawdzić półki pozostające we wnętrzu przy zachowaniu szuflad — nie tworzyć po cichu nowej kolizji. Sprawdzić też cofanie operacji oraz scenariusze z dwiema i trzema granicami.

### N87 [P2] Duży podfrez klapy pozostawia mocowanie amortyzatora poza frontem

**Odtworzenie graniczne:** szafka 600 × 300 × 350 mm, korpus i front 18 mm, jedna klapa w dół, dwa amortyzatory, uchwyt wyłączony. Wybrać „podfrez od góry” i wpisać 200 mm. Pole przyjmuje wartość bez ograniczenia górnego.

**Wynik:** zamawiana klapa ma **596 × 79 mm**, ale plan podaje mocowanie amortyzatora **77 i 101 mm od dołu tej klapy** po obu stronach. Otwór 101 mm wypada **22 mm poza płytą**. Mimo tego lista uwag jest pusta. Przy podfrezie 180 mm front ma 99 mm i otwór nadal jest 2 mm poza nim. Liczba i siła amortyzatorów są wyznaczane, produkt trafia do zamówienia.

**Kontrole:** podfrez 20 mm daje front 259 mm, a 100 mm — 179 mm; obie pary otworów mieszczą się w tych frontach. Wysokość korpusu 300 mm pozwala pomieścić płytkę na boku, więc dawna kontrola N74 nie wykrywa tego innego problemu. Tu chodzi o skrócony front, nie o za niski bok korpusu. To przypadek granicznej wartości pola, nie twierdzenie, że standardowe 20 mm jest błędne.

**Przyczyna:** po zmianie wysokości frontu przez `otwieranieFrontu` obliczenia montażu amortyzatora nadal używają stałych odległości od dna, ale kontrola sprawdza miejsce na płytkę w korpusie, a nie zawieranie mocowania frontu w skróconej klapie.

**Wpływ:** konfiguracja „bez uwag” podaje niewykonalne wiercenie poza zamawianą formatką.

**Kryterium naprawy:** sprawdzać otwory i obrys mocowania względem rzeczywistego frontu po podfrezie i innych zmianach wysokości; podać błąd z dopuszczalnym zakresem lub zmianą otwierania. Nie przesuwać mocowania dowolnie — obowiązują wymiary producenta. Sprawdzić klapę pojedynczą oraz poziomy kolumn, jedną/dwie sztuki amortyzatora i obie strony.


## Audyt 28.10.2026 — N88–N89

Wersja `szafki.jsx`: blob `b4ebef6460072cc4d7d8aac0a752acb500996ac7`. Potwierdzone wykonaniem obliczeń i operacji na danych oraz przez interfejs GitHub Pages. Testy syntetyczne; bieżący projekt użytkownika zabezpieczono przed testem i przywrócono po nim.

### N88 [P2] Scalenie szafek z różnymi dekorami po cichu zamienia materiały na materiał pierwszej

**Odtworzenie:** dwie sąsiadujące szafki 600 × 900 × 560 mm w jednym dolnym ciągu; obie z płyty 18 mm, po jednych drzwiach, bez półek. Pierwsza ma płytę Biały mat, druga Czarny mat; fronty z płyty korpusu. Wybrać „Scal szafki w jedną…” i boki pojedyncze.

**Wynik:** kreator pozwala wykonać operację bez ostrzeżenia o różnych materiałach. Powstaje szafka 1200 mm, której wszystkie formatki, także oba fronty, mają Biały mat. Czarny dekor znika z zamawianych elementów. Aplikacja pokazuje „bez uwag”. Kreator zapowiada zachowanie wnętrz kolumn, lecz nie uprzedza o ujednoliceniu materiałów.

**Przyczyna:** `scalSzafki` kopiuje kolumny pozostałych szafek, ale nowy element bierze `mat` wyłącznie z pierwszej (`nowa = {...project.items[idxs[0]], cab: scalona}`). `scalenieBlad` sprawdza wysokości, głębokości i poziomy, ale nie materiały. Kopiowane kolumny nie przenoszą płyt swoich frontów i półek.

**Wpływ:** niezamierzona zmiana dekoru zamawianych frontów/półek/korpusu, a wraz z nim rozkroju i wyceny. To problem operacji scalania, odrębny od dawnego N79 dotyczącego wyboru płyty własnego blatu.

**Kryterium naprawy:** przed scaleniem wykrywać różne materiały i zapewnić jawny wybór/ostrzeżenie albo blokadę tego wariantu. Gdy operacja ma zachować różne fronty i półki, trzeba przenieść ich materiał do powstałych kolumn. Nie zgadywać materiału wspólnych płyt korpusu. Sprawdzić także odrębne płyty frontów/półek, różne grubości oraz kolejność zaznaczenia szafek; nie zmieniać materiałów bez informacji użytkownikowi.

### N89 [P2] Rura na wieszaki pozostaje w poziomie kolumny zamienionym na szuflady i przecina skrzynkę

**Odtworzenie:** szafka 600 × 2400 × 560 mm, płyta 18 mm; jedna kolumna z półką jako granicą dwóch poziomów kolumny (granica na konfirmatach), oba światła 1173 mm. Rura na wieszaki w dolnym świetle. Dolny poziom przestawić z „Półki i drzwi” na „Szuflady”; trzy szuflady DXS-3D, NL 550. Górny poziom zostaje z drzwiami. Odtworzono również przejściem Szuflady → Półki i drzwi → Szuflady w interfejsie, z zapamiętanym systemem DXS.

**Wynik:** rura nadal jest zamawiana (562 mm i dwie rozety) i rysowana na osi y=1121 mm, z=280 mm. Przechodzi przez oba drewniane boki górnej szuflady. Każde przecięcie ma **18 × 25 × 25 mm** (obrys rury); jej oś również przebiega wewnątrz boków, więc nie jest to wyłącznie narożnik prostopadłościennego przybliżenia rury. Rura ma zakres wysokości 1108,5…1133,5 mm, a boki szuflady 823…1186 mm. Aplikacja pokazuje „bez uwag”.

**Kontrola:** ta sama konstrukcja z rurą przeniesioną do górnego poziomu z drzwiami nie ma tych przecięć. Pod dolną rurą jest 1103 mm, więc prawidłowo nie uruchamia się ostrzeżenie o za małym miejscu na ubrania — brakuje innej kontroli, dotyczącej rodzaju wnętrza i kolizji.

**Przyczyna:** `c.drazki` powstaje według `kind` nadrzędnej kolumny i indeksów jej świateł; nie uwzględnia `col.segmenty[nr].kind`. Zmiana rodzaju segmentu usuwa ustawienia klapy, ale pozostawia rurę przypisaną do tego światła. Generowanie skrzynek oraz rury działa niezależnie.

**Wpływ:** zamówienie i bryła zawierają elementy, których nie da się złożyć w pokazanym położeniu; rura blokuje skrzynkę.

**Kryterium naprawy:** po zmianie poziomu kolumny na szuflady sprawdzać rury przypisane do jego świateł; usunąć/przenieść je za świadomą decyzją lub zgłosić jednoznaczny błąd z akcją. Nie ruszać rury w innym poziomie z drzwiami. Sprawdzić zmianę rodzaju w obu kierunkach, blendę, V-BOX/DXS, dodawanie/usuwanie półek i zapis/wczytanie.



## Audyt 28.10.2026 — N90–N99

Źródło: szafki.jsx, blob b4ebef6460072cc4d7d8aac0a752acb500996ac7. Dziesięć odrębnych problemów potwierdzono wykonaniem funkcji produkcyjnych; N90, N91 i N97 dodatkowo w interfejsie. Przypadki N92–N96 oraz N98–N99 potwierdzono testami funkcji i analizą powiązanych formularzy, bez deklaracji pełnego testu tych ścieżek przez UI. To uzupełnienie raportu, nie ponowna weryfikacja wcześniejszych zgłoszeń ani audyt PDF.

### N90 — W zamówieniu całego projektu znika plan zakupu i cięcia rur na wieszaki [P2]

**Potwierdzono 28.10.2026**, źródło `szafki.jsx` blob `b4ebef6460072cc4d7d8aac0a752acb500996ac7` i interfejs GitHub Pages.

**Odtworzenie:** dwie wolnostojące szafy 600 × 2100 × 560 mm, płyta 18 mm, bez półek, po jednej rurze w każdej. W „Produkty do zamówienia” wybierz cały projekt.

**Wynik:** wiersz ma jedynie „drążek na wieszaki w szafie”, ilość 1,5 mb. Znika informacja, jakie odcinki kupić i jak je pociąć. Każda rura ma 562 mm; właściwy plan to jedna sztanga 1500 mm i dwie docinki 562 mm (odpad 376 mm). Lista jednej szafki poprawnie pokazuje zakup 1 m i cięcie na 562 mm — problem dotyczy sumowania projektu/pomieszczenia, a nie wyliczenia długości.

**Przyczyna:** `ruraWiersz` tworzy pełną specyfikację zakupu/cięcia, lecz `scalOkucia` nadpisuje `spec` opisem z `use`. Dla listwy montażowej plan pozostaje, bo jej wiersz nie ma `use`.

**Wpływ:** lista zamówienia nie określa odcinków handlowych ani przypisania docinek do szafek; sama liczba metrów nie wystarcza do realizacji.

**Kryterium naprawy:** zachować plan `ruraWiersz` w zamówieniu projektu i pomieszczenia, z odcinkami, docinkami, odpadem i nazwami szafek. Sprawdzić jedną oraz kilka rur o różnych długościach. Nie zmieniać prawidłowej ilości zakupowej.

**Dowody lokalne:** `work/audit28/rod-order.mjs`, `N90.json`, `N90-dwie.json`; test obliczeń i widok zamówienia.

### N91 — „Dopasuj półki” usuwa podział frontów kolumny [P2]

**Odtworzenie:** szafa 600 × 1800 × 560 mm, 10 półek, granica poziomów kolumny na ósmej półce (`podzial:[7]`). Dolny segment: jedne drzwi, zawias prawy; górny: dwoje drzwi. Kliknij „dopasuj półki” nad strukturą wnętrza.

**Wynik:** liczba półek spada do 5, granica 7 zostaje w danych, ale geometria ją pomija. Zamiast trzech frontów (1300 mm oraz dwa po 490 mm) powstają jedne drzwi 1794 mm z zawiasem lewym. Bez pytania znika odrębna struktura frontów. Potwierdzone obliczeniami i kliknięciem w aplikacji.

**Przyczyna:** `fitShelvesAll` zastępuje `shelfTargets`, nie przelicza granic `podzial` i ich segmentów. `poziomyKolumny` filtruje indeksy półek, które przestały istnieć. Analogiczny zapis jest w `fitShelves`.

**Naprawa/odbiór:** dopasowywać zwykłe półki osobno wewnątrz istniejących segmentów, zachowując granice, fronty i ustawienia. Kontrola bez podziału może nadal przeliczać całą kolumnę. Dowody: `fit-shelves.mjs`, `N91.json`, `N91-projekt.json`.

### N92 — Rozkrój na resztce odejmuje niewłaściwą formatkę i zmienia kierunek słojów [P2]

**Odtworzenie:** dwa wiersze tego samego materiału, oba „Drzwi nakładane”, ilość po 1: najpierw 500 × 800, potem 800 × 500 mm. Kierunek słojów istotny, obrót zabroniony. Własny kawałek 800 × 500 mm, ilość 1.

**Wynik:** na własnym kawałku zostaje poprawnie ułożona formatka 800 × 500. Z pozostałej listy odejmowana jest jednak pierwsza, 500 × 800. Na kupowany arkusz trafia ponownie 800 × 500. Końcowo są dwie takie same orientacje, brakuje 500 × 800. Powierzchnia i liczba sztuk się zgadzają, więc nie ujawniają pomyłki.

**Przyczyna:** `naKawalki` dopasowuje zużytą pozycję po nazwie i wymiarach w obu orientacjach (`tenSam`), pomijając zakaz obrotu/identyfikator pozycji.

**Kontrole:** bez resztki wychodzą obie prawidłowe orientacje; odwrócenie kolejności wejściowych wierszy usuwa pomyłkę. To błąd tożsamości pozycji, nie wydajności pakowania. Test bezpośrednio funkcji produkcyjnego rozkroju; nie deklaruję wykonania tego scenariusza przez formularze.

**Naprawa/odbiór:** przenosić identyfikator pozycji do wyniku pakowania i odejmować dokładnie tę pozycję. Sprawdzić identyczne nazwy, zamienione wymiary, mieszany zakaz obrotu i ilości większe od 1. Dowód: `candidates.mjs`, `candidates92-96.json`, `controls90-99.json`.

### N93 — Podsumowanie rozkroju pomija pracę i wykorzystanie własnych kawałków [P3]

**Odtworzenie:** jedna półka 400 × 300 mm i własny kawałek tego materiału 800 × 500 mm. Całość mieści się na własnym kawałku, nie potrzeba zakupów.

**Wynik:** grupa ma jeden użyty własny kawałek i dwa cięcia, ale podsumowanie zwraca `cuts:0`, `usedPct:0`, brak największego zrzutu. Własny kawałek rzeczywiście ma 30% wykorzystania i zrzut 497 × 500 mm. Widok pojedynczego kawałka jest poprawny; nieprawidłowe jest zbiorcze podsumowanie („wykorzystanie”, „cięć”, największy zrzut). To nie jest zarzut błędnej liczby kupowanych arkuszy ani wyceny cięcia.

**Przyczyna:** `buildCutPlan` bierze statystyki wyłącznie z `packSheets(reszta)` dla kupowanych arkuszy i dopiero potem dokleja własne do `sheets`.

**Naprawa/odbiór:** albo sumować statystyki całego pokazywanego planu, albo wyraźnie oznaczyć, że dotyczą wyłącznie zakupów, i podać osobne dla własnych kawałków. Dowód: `candidates92-96.json`, N93.

### N94 — Dodanie innej grubości płyty odłącza wcześniej zapisane resztki [P2]

**Odtworzenie:** materiał „Płyta Dąb sonoma” 18 mm; dodaj jego własny kawałek 800 × 500 i półkę 400 × 300. Następnie dodaj w innej szafce materiał o tej samej nazwie w grubości 16 mm, zachowując pierwotną szafkę i jej płytę 18 mm.

**Wynik:** etykieta pierwotnego materiału zmienia się na „Płyta Dąb sonoma 18”. Własny kawałek pozostaje zapisany ze starym `matLabel`, przestaje pasować i rozkrój kupuje arkusz zamiast go wykorzystać. W karcie nowej etykiety nie ma go też na liście własnych kawałków. Kontrola z jedną grubością wykorzystuje resztkę.

**Przyczyna:** resztki identyfikują materiał zmienną etykietą prezentacji zależną od `ambiguousThickness`, a nie stałym kluczem materiału i grubością.

**Naprawa/odbiór:** wiązać resztkę ze stałą tożsamością materiału; zmiana etykiety po dodaniu/usunięciu innej grubości nie może zmieniać dostępnego zapasu. Nie przypisywać kawałka 18 mm do 16 mm. Dowód: `candidates92-96.json`, N94; kontrola w `controls90-99.json`.

### N95 — Dwie różne płyty własne o tej samej nazwie trafiają na jeden arkusz [P2]

**Odtworzenie:** dodaj dwie płyty własne o różnych ID, obie z nazwą „Płyta własna”, 18 mm, arkusz 2800 × 2070. Jedna biała, druga czarna (np. ceny 100 i 300 zł). Z każdej potrzebny bok 800 × 500 mm. Formularz `zapiszPlyte` dopuszcza takie same nazwy, również domyślną.

**Wynik:** `matLabelOf` nadaje obu tę samą etykietę; `buildCutPlan` układa obie formatki na jednym kupowanym arkuszu. Nie da się wyciąć białej i czarnej formatki z jednej płyty. `matByLabel` również wybiera pierwszy materiał/cenę. Przy różnych nazwach powstają prawidłowo dwie grupy.

**Przyczyna:** grupowanie zakupu korzysta z etykiety zamiast ID płyty własnej; dla takiej płyty etykieta celowo nie zawiera koloru.

**Naprawa/odbiór:** oddzielać płyty według ID (lub blokować niejednoznaczne nazwy przed zapisem, z jasnym komunikatem). Sprawdzić różne kolory, ceny i formaty arkusza o tej samej nazwie. Dowód: `candidates92-96.json`, N95, kontrola różnych nazw.

### N96 — „Dopasuj półki” nie dotrzymuje minimum 250 mm przy innej grubości półek [P3]

**Odtworzenie:** szafka 600 × 816 × 560 mm; korpus 16 mm, półki osobno 18 mm. Wybierz automatyczne dopasowanie półek.

**Wynik:** dobór daje 2 półki i światła 250, 249, 249 mm, choć opis przycisku obiecuje światło co najmniej 250 mm. Przy korpusie i półkach 16 mm kontrola daje 251, 251, 250 mm. Uwaga ogólna o niestandardowym korpusie dotyczy katalogu szuflad i nie informuje o tym błędzie dopasowania.

**Przyczyna:** `fitShelves` i `fitShelvesAll` wołają `autoShelves(inner,geo.t)`, a półki kolumn zajmują `geo.ts`.

**Naprawa/odbiór:** używać rzeczywistej grubości półek w doborze liczby; dla przykładu z półkami 18 mm wybrać 1 półkę. Sprawdzić również półki cieńsze od korpusu. Dowód: N96 w `candidates92-96.json` i kontrola w `controls90-99.json`.

### N97 — „Dopasuj fronty” zapisuje NaN, gdy choć jeden bok szuflady jest automatyczny [P2]

**Odtworzenie:** szafka 600 × 900 × 560 mm, trzy V-BOX: wysokości boków 95, auto, 210 mm; fronty ręczne 150, 300, 440 mm. Kliknij „dopasuj fronty” (opis: rozdzielenie proporcjonalnie do wysokości boków).

**Wynik:** funkcja wpisuje `NaN` do wysokości wszystkich trzech frontów. Obliczenia awaryjnie traktują je jak auto i tworzą równe fronty 297, 297, 296 zamiast podziału proporcjonalnego. Poprzednie wpisy zostają nadpisane; po zapisie JSON wartości NaN przechodzą w null. Nie jest to awaria całej aplikacji — fallback maskuje błąd.

**Przyczyna:** `fitFronts` używa `Number(d.h)` z danych wejściowych, w których legalnie występuje tekst `auto`, zamiast dobranej wysokości boku z geometrii. `Number('auto')` zatruwa sumę i wszystkie wyniki.

**Kontrola:** przy wszystkich bokach ręcznych 95/178/210 funkcja zwraca skończone wartości 182/327/381. Potwierdzone też kliknięciem w aplikacji.

**Naprawa/odbiór:** obliczać proporcje z rzeczywiście dobranych boków; nigdy nie zapisywać NaN. Sprawdzić mix ręczne/auto, wszystkie auto, DXS oraz poziom kolumny. Dowody: `final-candidates.mjs`, `N97-projekt.json`, `N97-N99.json`.

### N98 — „Głębokość zawiera drzwi” ignoruje własny montaż frontów szuflad [P2]

**Odtworzenie:** głębokość 560 mm, płyta 18 mm, zaznaczone „Podana głębokość zawiera drzwi”, jedna kolumna DXS z dwoma frontami. A: szafka globalnie nakładana, kolumna szuflad „Wewnątrz”. B: szafka globalnie wpuszczana, kolumna „Na korpusie”.

**Wynik:** A ma korpus 542 mm, mimo że wszystkie fronty są wewnątrz i nie wymagają odjęcia 18 mm. B ma korpus 560 mm i fronty przed nim — grubość frontu nie zostaje odjęta. Obie konfiguracje bez uwag. Porównanie dotyczy grubości frontu; nie obejmuje osobnej kwestii luzu między korpusem a frontem.

**Przyczyna:** odjęcie w `computeGeoLiczy` zależy od `cab.frontMode` i samego istnienia szuflad, ignoruje `rawCol.drawerMode` i rzeczywisty montaż frontów. To kontrola głębokości korpusu, nie wcześniej zgłoszona kontrola otwierania N38.

**Naprawa/odbiór:** przy zaznaczonym polu odejmować grubość tylko dla faktycznie wystających frontów; uwzględnić kolumny i segmenty z własnym montażem oraz kombinacje mieszane. Dowód: N98 w `N97-N99.json`.

### N99 — Błąd „formatka nie mieści się” ignoruje większy arkusz płyty własnej [P2]

**Odtworzenie:** własna płyta 18 mm o arkuszu 4000 × 2500 mm, przypisana do korpusu. Otwarta szafka 3100 × 600 × 500 mm, bez pleców i półek, dno/wieniec między bokami.

**Wynik:** Uwagi zgłaszają, że „Dno / wieniec 3064 × 500 mm nie mieści się na arkuszu”, podając standardowy limit 2761,2 × 2061,2 mm. Tymczasem rozkrój poprawnie mieści wszystkie formatki na jednym własnym arkuszu, bez odrzuconych elementów (po okrawaniu 3961,2 × 2461,2). Płyta własna została właśnie wprowadzona po to, żeby można było używać innego formatu.

**Przyczyna:** kontrola `P/laysOn` w `computeGeoLiczy` ma na stałe `USABLE_W/USABLE_H`, natomiast rozkrój korzysta z `arkuszWlasnej`.

**Naprawa/odbiór:** walidować względem arkusza faktycznie wybranego materiału, z jego okrawaniem i kierunkiem słojów. Sprawdzić również mniejszy arkusz, korpus/front/półkę oraz zwykły materiał bez własnego arkusza. Dowód: N99 w `N97-N99.json`.


## Audyt 28.10.2026 — N100–N109

Sprawdzono niezmienione źródło `szafki.jsx`, blob `b4ebef6460072cc4d7d8aac0a752acb500996ac7`. Poniżej 10 kolejnych odrębnych przypadków. Wszystkie odtworzono wykonaniem funkcji produkcyjnych lub ich niezmienionych handlerów; N101, N102, N105, N106 i N107 dodatkowo w interfejsie Pages. Przy N100 sprawdzono też faktyczne bryły 3D. To nie jest retest wcześniejszych zgłoszeń ani nowy audyt PDF. Przypadki i wyniki znajdują się lokalnie w `work/audit100`; prywatnego projektu użytkownika nie publikowano, po testach został przywrócony.

### N100 [P2] Pionowe wzmocnienie przecina półkę bez komunikatu

**Odtworzenie:** otwarta szafka 600 × 720 × 560 mm, korpus/półki 18 mm, dwie półki, bez drzwi i zawieszek. Wzmocnienie pionowe przy lewym boku, wysokość 400 mm, głębokość 100 mm, od lica 0.

**Wynik:** wzmocnienie zajmuje x=18…36, y=302…702, z=0…100 mm. Górna półka zajmuje y=468…486 i pełną szerokość/głębokość kolumny. Rzeczywiste zamknięte bryły przecinają się o **18 × 18 × 100 mm**. Zamówione są pełne półki 564 × 560 oraz wzmocnienie 400 × 100; brak opisu wycięcia/skrócenia. Lista uwag jest pusta.

**Kontrola:** wzmocnienie 100 mm wysokości zaczyna się na y=602 i nie dochodzi do półki — brak przecięcia. To nie wcześniejszy N72 o wyjściu wzmocnienia poza korpus; tutaj cała płyta mieści się wewnątrz. Nie jest to również N76 o wsporniku fixu.

**Przyczyna:** zwykłe półki nie są dopasowane do pionowych wzmocnień; kontrola wzmocnień sprawdza granice korpusu, ale nie przecięcie z półką.

**Naprawa/odbiór:** wykrywać przecięcie i zaproponować zmianę wysokości/położenia albo jednoznacznie opisać i zamówić dopasowane elementy. Sprawdzić oba boki, głębokość od lica/tyłu i różne grubości półek. Dowody: `rails.mjs`, `rails.json`, `controls.mjs`, `controls.json`.

### N101 [P3] Wzmocnienie pionowe w 2D ma dekor półek zamiast zamówionej płyty korpusu

**Odtworzenie:** korpus Biały mat, osobna płyta półek Czarny, „Realne kolory”, pionowe wzmocnienie 400 × 100 mm, bez półek. Otwarty widok z przodu.

**Wynik:** tabela zamawia „Wzmocnienie pionowe” z białej płyty korpusu, a jego prostokąt 18 × 400 na rysunku jest czarny (`fill=#2b2a28`). W 3D wzmocnienie jest generowane z koloru korpusu. Wybór osobnej płyty półek zmienia wygląd elementu, który nie jest z niej wykonywany.

**Przyczyna:** rysunki 2D stosują dla `r.orient === 'vertical'` kolor `shc`, choć formatka wzmocnienia ma `matKey:'board'`. To inny element niż zwykłe/przelotowe półki z dawnego N60.

**Naprawa/odbiór:** kolor wzmocnienia w widokach brać z faktycznie zamawianego materiału. Sprawdzić otwarty przód i bok, osobne dekory i „Realne kolory”. Dowód: `N101-projekt.json`, `geometry-candidates.json`; odczyt SVG w interfejsie potwierdził czarny prostokąt.

### N102 [P3] Widok boczny dodaje drugi, błędnie nakładany obraz fixu wpuszczanego

**Odtworzenie:** szafka 600 × 720 × 560 mm, globalne fronty na korpusie, fix z lewej 100 mm, jego własny montaż „W obrysie”/wpuszczany. Widok z boku.

**Wynik:** geometria ma jeden fix wpuszczany, wysokość 680 mm. Na bocznym SVG są dwa pasy jego wysokości i grubości: prawidłowy x=542…560 oraz dodatkowy x=560…578 mm, z krzyżowym oznaczeniem fixu. Rysunek sugeruje element również przed korpusem, chociaż zamówiony i modelowany jest jeden wpuszczany fix.

**Przyczyna:** ogólny blok frontów uwzględnia `d.inset`, lecz kolejny blok „elementy stałe (fix)” rysuje fix ponownie i liczy `fxx` wyłącznie z `cab.frontMode`, ignorując `c.fix.inset`.

**Naprawa/odbiór:** jeden obraz fixu we właściwej płaszczyźnie; oznaczenie krzyżem nakładać na ten sam obrys, bez drugiego pasa. Sprawdzić fix nakładany/wpuszczany przy obu globalnych montażach. Dowody: `N102-projekt.json`, `geometry-candidates.json` i SVG widoku bocznego.

### N103 [P2] Przyciski usunięcia fixu/dobudowania wspornika nie naprawiają szuflad w poziomie kolumny

**Odtworzenie:** szafa 600 × 1800 × 560 mm, jedna półka jako granica dwóch poziomów kolumny. Fix całej kolumny z lewej 100 mm, bez wspornika. W dolnym poziomie jedna szuflada DXS, w górnym drzwi. Przy błędzie kolizji szuflady z fixem użyć „Dobuduj wspornik pionowy” albo, w osobnym teście, „Usuń element stały”.

**Wynik:** po każdym przycisku rzeczywisty fix i kolizja pozostają. `fixsup:0:0s0:550` wpisuje wspornik do `segmenty[0].fix` z `side:'none'`; `fixdel:0:0s0` również zmienia wyłącznie ten segment. Geometria fixu/wspornika nadal korzysta z fixu nadrzędnej kolumny. Ten sam błąd jest zwracany po przeliczeniu.

**Kontrola:** akcja na nadrzędnej kolumnie `fixsup:0:0:550` usuwa ten błąd i zwęża skrzynkę poprawnie. Problem dotyczy adresu przycisku nowej struktury segmentowej, a nie samego dawnego N42.

**Naprawa/odbiór:** kierować akcję do faktycznego właściciela fixu lub obsłużyć fix lokalny segmentu w geometrii. Po kliknięciu naprawy właściwy błąd znika i zmieniają się odpowiednie formatki/bryły. Dowody: `N103-projekt.json`, `actions.mjs`, `actions-test.mjs`, `candidates.json`.

### N104 [P2] Usunięcie niższej półki kasuje rurę w górnym świetle

**Odtworzenie:** szafa 600 × 2400 × 560 mm, jedna półka, rura w górnym świetle (`drazki:[1]`). Usuń półkę przy dolnym świetle przyciskiem ×.

**Wynik:** rura, która była 70 mm pod wieńcem na y=2312 mm, znika z geometrii oraz zamówienia, choć wieniec i miejsce jej montażu nie zmieniły się. W danych pozostaje indeks `[1]`, podczas gdy po usunięciu półki jedyne światło ma indeks 0. Geometria odrzuca nieistniejący indeks.

**Przyczyna:** `removeShelfAt` aktualizuje światła i granice frontów, ale nie numery świateł w `drazki`. Inna operacja `ustawPolkiPoziomuKolumny` ma taką aktualizację, ten przycisk jej nie wykonuje.

**Kontrola:** po przepisaniu tej samej rury na indeks 0 wraca ona dokładnie na y=2312, długość 562 mm; nie trzeba dodawać nowej rury ani przesuwać jej wysokości. To nie N89 o rurze pozostawionej w segmencie szuflad.

**Naprawa/odbiór:** zachować przypisanie istniejących rur po usuwaniu półek poniżej nich, z odrębną obsługą usunięcia samej płyty niosącej rurę. Sprawdzić kilka rur, dolną/środkową/górną półkę i cofanie. Dowody: `N104-projekt.json`, `candidates.json`, `controls.json`.

### N105 [P2] „Wszędzie N zawiasy” nie zmienia zawiasów zapisanych w poziomach kolumny

**Odtworzenie:** szafa 600 × 1800 × 560 mm, półka jako granica dwóch frontów, oba po 895 mm. Ręcznie ustawić dolnemu 2, górnemu 3 zawiasy. Przy ostrzeżeniu o różnej liczbie wybrać „Wszędzie 2 zawiasy”.

**Wynik:** fronty nadal mają 2 i 3 zawiasy, ostrzeżenie pozostaje; to samo dla ujednolicenia do 3. Potwierdzone wykonaniem handlera i kliknięciem w interfejsie.

**Przyczyna:** grupowanie ostrzeżenia identyfikuje tylko `colKey='0-0'`; akcja `zawiasywszedzie` zmienia `col.hinges`, a jawne `segmenty[n].hinges` nadal nadpisują tę wartość.

**Naprawa/odbiór:** ujednolicać rzeczywiście wskazane fronty, uwzględniając ich segmenty. Nie zmieniać nieobjętych ostrzeżeniem frontów innych wysokości. Po kliknięciu liczby i ilość zamawianych zawiasów mają się zgadzać, a ostrzeżenie znikać. Dowód: `N105-projekt.json`, `candidates.json` oraz interfejs Pages.

### N106 [P2] „Zwiększ siłę do 100 N” pozostawia odziedziczone 50 N w klapie segmentu

**Odtworzenie:** szafka 600 × 900 × 560 mm, półka jako granica dwóch klap do góry, po 445 mm, dwa podnośniki na klapę. Na nadrzędnej kolumnie ręczna siła 50 N; segmenty dziedziczą ustawienie. Przy ostrzeżeniu dolnej klapy wybrać „Zwiększ siłę do 100 N”.

**Wynik:** dolna klapa nadal zamawia podnośniki 50 N i ostrzega o za małej sile. Tak samo po powtórzeniu kliknięcia. Górna również pozostaje przy swoim 50 N, zgodnie z brakiem jej edycji.

**Przyczyna:** `silaauto` wykonuje `delete segment.silaN`. To przywraca dziedziczenie ręcznego 50 N z kolumny, zamiast automatycznego doboru. W tej strukturze `null` jest jawnym auto, a brak pola — dziedziczeniem.

**Kontrola:** wpisanie `segmenty[0].silaN=null` daje prawidłowe 100 N wyłącznie dolnej klapie. Przycisk opisuje konkretną zmianę, ale jej nie wykonuje. Potwierdzone także w interfejsie.

**Naprawa/odbiór:** ustawić jawne auto lub obiecaną siłę we właściwym segmencie; sprawdzić również „Dołóż drugi” z automatycznym doborem, gdy rodzic ma ręczną siłę. Dowody: `N106-projekt.json`, `candidates.json`, `controls.json`.

### N107 [P3] Kreator klap zaniża wysokość górnego poziomu przy cieńszych półkach

**Odtworzenie:** szafka 1200 × 580 × 350 mm, dwie kolumny, fronty wpuszczane. Korpus 18 mm, osobna płyta półek 12 mm. W pierwszej kolumnie jedna półka, dwa rzeczywiste światła po 266 mm. Otworzyć kreator klap i wybrać dwie klapy.

**Wynik:** kreator podaje dolny poziom 266, górny **260 mm**, choć w strukturze oba światła mają 266. Blokuje operację tekstem „klapa 2 ma 260 mm”, wymagając według swojej kontroli ok. 265 mm. To fałszywy wynik tej konkretnej kontroli wysokości, nie deklaracja braku wszystkich innych wymagań dla małej klapy.

**Przyczyna:** budowanie `ys` używa `shelf.y + geo.t` (18 mm), a rzeczywista półka ma `geo.ts` (12). W kolumnowym podziale półka graniczna pozostaje z płyty półek. Nie jest to poprzedni N96 o doborze liczby zwykłych półek — tutaj błędna jest wysokość w kreatorze i blokada wybranych klap.

**Naprawa/odbiór:** liczyć światła i warianty z rzeczywistych grubości oraz rozróżnić granicę w kolumnie od zamiany na konstrukcyjną półkę przelotową. Przykład ma pokazywać 266/266. Dowody: `N107-projekt.json`, `geometry-candidates.json`, interfejs Pages.

### N108 [P2] „Dopasuj fronty” tworzy błąd wysokości przy własnym luzie lub montażu szuflad

**Odtworzenie A:** szafka 600 × 900 × 560 mm, trzy V-BOX z ręcznymi bokami 95/178/210, standardowy luz szafki 2 mm, własny luz kolumny 5 mm. Kliknąć „dopasuj fronty”.

**Wynik A:** funkcja ustawia skończone fronty 182/327/381, lecz ich suma z dwoma luzami po 5 mm przekracza pasmo o 6 mm. Pojawia się błąd „wysokości frontów szuflad nie zgadzają się o 6 mm”.

**Odtworzenie B:** te same szuflady, luz 2 mm, globalnie fronty na korpusie, własny montaż kolumny „Wewnątrz”. **Wynik B:** fronty 181/327/382, błąd sumy o 34 mm; rzeczywiste pasmo tej kolumny ma 860 mm.

**Przyczyna:** dla zwykłej kolumny `fitFronts` bierze `lv.frontHi-frontLo` i `cab.gaps.between`, zamiast `gk.dbandH` i efektywnego luzu kolumny. Dla segmentu funkcja już korzysta z jego `dbandH`. To odrębne od N97: wszystkie boki są ręczne, żadne NaN tu nie występuje.

**Naprawa/odbiór:** dopasowywać fronty do rzeczywistego pasma i luzu konkretnej kolumny/segmentu. Po użyciu przycisku suma frontów i luzów ma wypełniać pasmo bez nowego błędu. Dowody: `N108-gap-projekt.json`, `N108-mount-projekt.json`, `geometry-candidates.json`.

### N109 [P2] Obsługa pary pod blat nie rozpoznaje przedniego wzmocnienia szafki narożnej

**Odtworzenie:** szafka narożna `corner.on=true`, zastosować wariant bez wieńca pod blat. `bezWienca` dodaje w rogu dwa stojące wzmocnienia 60 mm: przednie i tylne. Dodać drugi poziom główny. Osobna kontrola: włączyć z powrotem wieniec zamiast pary.

**Wynik:** przy dodaniu poziomu przednie wzmocnienie zostaje w niższym, a tylko tylne przechodzi do najwyższego. Para jest rozdzielona; nowa góra nie dostaje przedniej płyty przewidzianej dla narożnika. Przy powrocie do wieńca usuwane jest tylko tylne, przednie zostaje w formatkach i geometrii.

**Przyczyna:** `jestParaPodBlat` rozpoznaje przednie poziome wzmocnienie (`shelf`) zwykłej szafki oraz tylne stojące, ale nie przednie stojące (`front`, `fromBack:false`) tworzone przez `railPair(...,pionZPrzodu=true)` w rogu. Ten sam predykat obsługuje przenoszenie i usuwanie pary.

**Kontrola:** dla zwykłej szafki bez narożnika po dodaniu poziomu obie płyty prawidłowo trafiają do najwyższego. W teście zachowano inne ręczne wzmocnienia — nie należy usuwać wszystkich płyt typu front na ślepo.

**Naprawa/odbiór:** oznaczyć parę pod blat w sposób jednoznaczny, również jej wariant narożny. Przenosić i usuwać oba jej elementy; sprawdzić dodanie poziomu, kolumny i powrót do wieńca. Dowody: `actions-test.mjs`, `candidates.json` (N109), `controls.json` (wariant zwykły).



## Audyt 28.10.2026 — N110–N129

20 dodatkowych, potwierdzonych przypadków. Źródło: `szafki.jsx`, blob `b4ebef6460072cc4d7d8aac0a752acb500996ac7`. Testy obliczeń wykonano na funkcjach tego źródła; JSX pominięto w module testowym, zachowując obliczenia i generowanie brył. N110 i N120 odtworzono również w interfejsie aplikacji. Pozostałe są testami funkcji produkcyjnych, geometrii i planów, nie deklaracją pełnego przeklikania UI ani certyfikacją okuć. PDF nie był przedmiotem tej rundy. Przypadki syntetyczne; projekt użytkownika przywrócono po testach. P2: błędny wynik funkcjonalny/produkcyjny; P3: mniejsza rozbieżność wymagająca poprawy. Dowody lokalne: `work/audit110/` (JSON i skrypty; nie są załącznikami do repozytorium).

### N110 [P2] Przycisk naprawy kolizji DXS proponuje niedostępne NL 270

- **Odtworzenie:** szafka 600×720×560, DXS NL300; przeszkoda szer.80, gł.280, wys.100, x=200, od tyłu 0, od dołu 100, bez maskownicy.
- **Wynik:** uwaga proponuje „Zmień głębokość prowadnic do NL270”. Kliknięcie tworzy błąd „nie ma takiej długości w DXS-3D”; dopiero kolejna propozycja prowadzi do NL250. Potwierdzone w UI i handlerze.
- **Przyczyna/poprawa:** kontrola przeszkody używa listy długości zawierającej 270, zamiast katalogu wybranego systemu. Naprawa ma od razu wybierać obsługiwane NL. To błąd generatora naprawy, nie ponowne zgłoszenie importu dowolnego NL. Dowody: `obstacle-dxs.mjs`, `N110.json`, `controls.json`.

### N111 [P2] Fałszywa kolizja przeszkody znajdującej się pod skrzynką DXS

- **Odtworzenie:** 600×720×560, DXS NL550; przeszkoda x=200..280, y=18..28, od tyłu 0, głębokość 280, bez maskownicy.
- **Wynik:** aplikacja każe skrócić NL550 do270. Tymczasem bryły własnego modelu 3D nie przecinają przeszkody: bok skrzynki zaczyna się na y=37, dno na47; przeszkoda kończy się na28. Prostoliniowy wysuw nie zmienia tych wysokości.
- **Poprawa:** sprawdzać rzeczywistą skrzynkę i prowadnice, nie pełny prostokąt frontu/kolumny. To sprzeczność własnych modeli, niezależna od ogólnego ostrzeżenia o braku zabudowy przeszkody. Dowód: `obstacles.json`, N111, lista przecięć pusta.

### N112 [P2] Przegroda z innego poziomu usuwa potrzebny bok zabudowy przeszkody

- **Odtworzenie:** 600×1200×560, dwa poziomy; dolny jedna kolumna, górny dwie. Przeszkoda dolna x=320..400, y=118..218, gł.80 przy plecach, maskownica automatyczna.
- **Wynik:** górna przegroda x=291..309, y=609..1182 jest traktowana jako lewa granica dolnej przeszkody. Powstaje zabudowa L zamiast U i brak lewego boku. Brak komunikatu. Usunięcie wyłącznie górnej przegrody przywraca U i trzeci panel.
- **Poprawa:** przy wyborze granic uwzględniać również zakres wysokości przegród. Dowody: `obstacles.json`, `controls.json:N112_control`.

### N113 [P3] Zabudowa „do półki” ignoruje półkę rozdzielającą poziomy

- **Odtworzenie:** 600×1200×560, przeszkoda y=118..218, maska „do półki”. Porównać jedną kolumnę ze zwykłą półką na y=591 oraz dwa poziomy z płytą rozdzielającą na tym samym y.
- **Wynik:** w pierwszym przypadku maska dochodzi do591; w drugim `shelfAbove=null`, maska kończy się na218. Ta sama fizyczna płyta przestaje być rozpoznawana, ściany maski skracają się o373mm.
- **Poprawa:** wyszukiwać również `sepShelves`, z kontrolą pokrycia przeszkody. Dowody: `control113.mjs`, `obstacles.json:N113`.

### N114 [P2] Przeszkoda przecina płytę między poziomami bez odpowiedniej uwagi

- **Odtworzenie:** 600×1200×560, dwa poziomy, płyta pozioma y=591..609; przeszkoda x=200..280, y=548..648, gł.80 przy plecach.
- **Wynik:** przecięcie 80×18×80mm z płytą rozdzielającą. Jest ogólna uwaga o braku zabudowy, ale brak kolizji tej płyty i instrukcji wycięcia. Kontrola półek obejmuje zwykłe półki kolumn, pomija płyty konstrukcyjne.
- **Poprawa:** objąć kontrolą przeszkód płyty rozdzielające i przegrody, wskazywać rzeczywisty element do zmiany/wycięcia. Dowód: `obstacles.json:N114`.

### N115 [P2] Wiercenia poza płytą przy asymetrycznym osadzeniu dna i wieńca

- **Odtworzenie:** 600×720×560, lewy koniec dna i wieńca między bokami, prawy na boku, płyta18.
- **Wynik:** zamawiana długość dna/wieńca582, ale prawy konfirmat w planie ma591mm od lewego końca płyty: 9mm poza nią. Po uwzględnieniu początku płyty x=18 współrzędna powinna wynosić573. Brak komunikatu.
- **Poprawa:** przeliczać globalne osie boków na lokalne współrzędne każdej płyty; nie stosować `W-t/2` bez odjęcia początku płyty. Dowód: `drill-candidates.json:N115`.

### N116 [P2] Skrócenie wspornika fixa zostawia zawias poza wspornikiem

- **Odtworzenie:** 600×720×560, lewy fix100, wspornik gł.100, zawias po lewej; dolne wzmocnienie frontowe wys.100 na głębokości100.
- **Wynik:** wspornik jest skrócony do y=118..702, wys.584. Dolny zawias pozostaje na y=103, czyli15mm poniżej wspornika. Plan podaje osie85 i599 od dołu wspornika, choć599 przekracza584. Nadal zakłada mocowanie do dna mimo przerwy100mm. Brak uwag.
- **Poprawa:** po skróceniu przeliczyć osie, mocowania i dostępne podłoże; jeśli zawias nie mieści się, zgłosić niemożliwy montaż. To następstwo skracania, odrębne od dawnego samego przecinania wspornika z listwą. Dowód: `drill-candidates.json:N116`.

### N117 [P2] Wkręty 4×30 przebijają cienki front DXS

- **Odtworzenie:** DXS, drewniane czoło skrzynki16mm, osobny front12mm.
- **Wynik:** plan i zamówienie przewidują cztery wkręty4×30 do połączenia tych płyt. Łącznie materiał ma28mm, wkręt przekracza go o2mm. Ogólne ostrzeżenie o niestandardowej grubości nie wskazuje tego problemu ani nie zmienia wkrętów.
- **Poprawa:** dobrać długość do faktycznych dwóch płyt albo zgłosić konkretny błąd montażu. Dla kontrolnych18+18 ten konkretny problem nie występuje. Dowód: `N117.json`, `screws.mjs`.

### N118 [P2] Wyłączenie obrzeża zmienia rozpoznawanie wspólnego dna

- **Odtworzenie:** dwie szafki600×720×500, odstęp20, dno pod bokami, wspólne dno. Wyłączyć obrzeże b1 dna, nie zmieniając połączeń.
- **Wynik:** zamiast wspólnego dna1220 funkcja `runBottom` zwraca „nie każda szafka ma dno pod bokami”. Wybór oklejania wpływa na strukturę zamówienia.
- **Przyczyna/poprawa:** połączenie jest odgadywane z `d.edges.b1/b2`; sprawdzać rzeczywiste `botL/botR`, niezależnie od obrzeży. Dowód: `bottom.json:edgeOff`.

### N119 [P2] Zamówienie zawiera wspólne dno, 3D pokazuje dwie płyty i szparę

- **Odtworzenie:** dwie szafki600×720×500, odstęp20, wspólne dno pod bokami.
- **Wynik:** `projectParts` zamawia jedną płytę1220×500×18 i usuwa indywidualne dna. `Assembly3D` generuje dwa dna600×500×18 w x=0..600 i620..1220. W środku pozostaje rzeczywista szpara20mm; brak bryły1220.
- **Poprawa:** generować wspólne dno 3D z tego samego planu `runBottom` co formatki, z uwzględnieniem podziałów. Dowód: `bottom.json` (zamówienie i bryły), `N119-projekt.json`.

### N120 [P2] Zapis i wczytanie zmienia prześwit 0 na500mm

- **Odtworzenie:** ciąg dolny H720, górny powiązany z nim; w UI ustawić prześwit nad blatem0, zapisać projekt i wczytać zapis.
- **Wynik:** zapis zawiera `clearance:0`, po imporcie pole pokazuje500. W modelu kontrolnym wysokość montażu zmienia się z720 na1220. Potwierdzone pełnym zapisem/wczytaniem w UI, mimo że pole dopuszcza0.
- **Poprawa:** `migrateRun` ma zachowywać skończone wartości >=0; domyślne500 tylko dla braku/niepoprawnej wartości, nie dla zera. Dowody: `rest-candidates.json:N120`, zapis kontrolny pobrany z aplikacji.

### N121 [P3] Plan frezuje rowki HDF mimo usunięcia wszystkich pleców kolumnami

- **Odtworzenie:** 600×720×560, globalnie plecy HDF frezowane16×3, jedyna kolumna ma nadpisanie pleców „brak”.
- **Wynik:** w zamówieniu nie ma pleców, lecz plan nadal frezuje rowki HDF na obu bokach, dnie i wieńcu. Sama uwaga mówi, że frez obowiązuje przy jednym pełnym arkuszu; plan jej nie respektuje.
- **Poprawa:** generować obróbkę na podstawie faktycznych pleców po nadpisaniach, również dla układów mieszanych. Dowód: `rest-candidates.json:N121`.

### N122 [P2] Nóżka zostaje pod narożnikiem usuniętym pełnym wycięciem

- **Odtworzenie:** 600×720×560, nóżki100, pełne wycięcie tylnego lewego narożnika100×100, maska włączona, bez półek i drzwi.
- **Wynik:** tylna lewa nóżka zajmuje x=40..80, z=480..520. Cała znajduje się w obszarze dna do ręcznego wycięcia x=0..100, z=460..560. Po wykonaniu wymaganego pełnego wycięcia nie ma płyty do jej przykręcenia; brak odpowiedniej uwagi. Prostokątne formatki są tu przewidziane do ręcznego cięcia — nie twierdzę, że renderer już wykonuje to cięcie.
- **Poprawa:** przenieść podporę lub wymagać rozwiązania podparcia przy kolizji z wycięciem. Dowód: `rest-candidates.json:N122`, bryły nogi i obszar wycięcia.

### N123 [P2] Liczba zawiasów ramienia liczona z grubości innego frontu

- **Odtworzenie:** prawidłowy narożnik L, H900, front właściciela16mm, sąsiada18mm; ramię zgodnie z regułą pobiera materiał sąsiada.
- **Wynik:** front ramienia560×894×18 potrzebuje według własnego `autoHinges` trzech zawiasów, a `cornerArmParts` zamawia dwa, bo używa16mm właściciela. Dla kontrolnego H720 obie drogi dają dwa.
- **Poprawa:** liczbę i plan zawiasów ramienia oprzeć na rzeczywistej płycie `frontRamienia(a)`, nie `a.cab.geo.tf`. Dowody: `corner-candidates.json:N123`, `extra-controls.json`.

### N124 [P3] Zerowe wystawanie uchwytu usuwa uchwyt wpuszczany z zamówienia ramienia

- **Odtworzenie:** otwierane ramię L, uchwyty włączone, nazwa „Uchwyt wpuszczany”, wystawanie0 (opis pola dopuszcza uchwyt wpuszczany/muszelkę).
- **Wynik:** zwykły front zachowuje uchwyt w zamówieniu, ramię nie ma żadnego. Przy wystawaniu20 uchwyt ramienia wraca.
- **Poprawa:** warunek `handleOutOf(cab)>0` nie może oznaczać obecności uchwytu. Oddzielić obecność od jego obrysu kolizyjnego. To konkretny wariant uchwytu wpuszczanego, nie ogólny dawny brak wszystkich uchwytów ramienia. Dowody: `corner-candidates.json`, `extra-controls.json`.

### N125 [P2] Własna szerokość wzmocnienia ramienia wychodzi pod podłogę

- **Odtworzenie:** ramię L H900, własne wzmocnienie przednie1000, bez wieńca/pod blatem.
- **Wynik:** zamawiana płyta656×1000×18, bryła y=-100..900. Brak konkretnego błędu przekroczenia obrysu ramienia; ogólne uwagi materiałowe tego nie zastępują.
- **Poprawa:** walidować własne szerokości wzmocnień ramienia wobec dostępnego wymiaru i pozycji, analogicznie do głównego korpusu. Kontrolne60 mieści się. Dowody: `corner-candidates.json`, `extra-controls.json:N125`.

### N126 [P3] Półka ramienia zależy od grubości wyłączonych pleców

- **Odtworzenie:** L, obie szafki bez pleców, głębokość ramienia560, wspornik18; zmienić wyłącznie nieużywaną grubość materiału HDF3 na4.
- **Wynik:** `armPlan.tb` pozostaje0, brak pleców w zamówieniu, ale głębokość półki zmienia się539→538. Odejmowana jest grubość nieistniejących pleców.
- **Poprawa:** respektować prawidłowe `tb=0`; fallback do `geo.tb` nie może włączać wyłączonego materiału. Dowód: `controls.json:N126_control`.

### N127 [P2] Model kolizji DXS przyjmuje inny wysuw niż model3D

- **Odtworzenie:** DXS NL550, bez uchwytu. Porównać `wysuwSzuflady` i ruch generowany przez `swingBodies`.
- **Wynik:** 3D używa520mm według tabeli DXS, model kolizji550. Kontrolna przeszkoda10–20mm za rzeczywistym zasięgiem daje20mm kolizji, a przy tym samym teście z zasięgiem520 wynik to0.
- **Poprawa:** wspólna funkcja rzeczywistego wysuwu dla wizualizacji i kolizji, z osobnym uwzględnieniem uchwytów. To test funkcji modelu, nie deklaracja ręcznego sprawdzenia wszystkich ścian w UI. Dowód: `controls.json:N127`.

### N128 [P2] Za wysoki tył DXS przecina wieniec, komunikat nie opisuje niemożliwego montażu

- **Odtworzenie:** 600×300×560, DXS bok80, ręczny tył260.
- **Wynik:** tył jest na y=47..307, wieniec282..300; przecięcie brył515×18×18mm, tył wystaje7mm ponad korpus. Jest tylko ostrzeżenie, że tył260 wystaje190 ponad boki, z propozycją70; brak konkretnego błędu kolizji z wieńcem.
- **Poprawa:** ograniczać ręczną wysokość tyłu DXS rzeczywistą przestrzenią skrzynki/korpusu, nie jedynie porównaniem z bokiem. Dowód: `controls.json:N128`.

### N129 [P2] Automatycznie przeniesiony podnośnik klapy nie aktualizuje strony tip-on i modelu

- **Odtworzenie:** L H600, klapa w górę, jeden podnośnik, zadana strona lewa, brak lewego boku przy rogu, otwieranie tip-on bez uchwytu, wieniec między bokami.
- **Wynik:** plan poprawnie przenosi podnośnik na „Bok prawy” i mocowanie frontu28 od prawej. Model klapy nadal mówi „lewa”; tip-on pozostaje po prawej, czyli po rzeczywistej stronie podnośnika zamiast przeciwnej. Brak uwag. Nie jest to wiercenie w nieistniejącym lewym boku — ten wcześniejszy trop został odrzucony podczas kontroli.
- **Poprawa:** wyznaczać efektywną stronę raz i przekazywać ją do planu, modelu, UI oraz wyboru strony tip-on. Dowód: `controls.json:N129`, `N129-projekt.json` (wariant z tip-on).

## Audyt 28.10.2026 — N130–N139

Kolejne 10 odrębnych przypadków, sprawdzonych na funkcjach źródła `szafki.jsx`, blob `b4ebef6460072cc4d7d8aac0a752acb500996ac7` (źródło nadal niezmienione). Zastosowano syntetyczne projekty; przypadki kontrolne i przecięcia brył opisano poniżej. N130 potwierdzono również kliknięciem w UI. Pozostałe to testy obliczeń, planów i brył produkcyjnych, nie pełne przeklikanie wszystkich widoków. 15 ukierunkowanych asercji kontrolnych przeszło (`checks.json`); sprawdzenia przecięć zapisano w `verified.json`. Dowody lokalne: `work/audit130/`, bez publikowania prywatnego projektu. Bieżący projekt użytkownika przywrócono. Brak zmian kodu aplikacji, brak ponownej oceny PDF.

### N130 [P3] Przyciski oklejania formatek ramienia nie zmieniają wyniku

- **Odtworzenie:** szafka L, w tabeli „Formatki” wiersz „Front ramienia”, kliknąć włączone obrzeże „przód”. Analogicznie „Bok ramienia”.
- **Wynik:** `edgeOverrides` może zawierać wszystkie cztery wartości `false`, lecz `cornerArmParts` nadal zwraca komplet obrzeży frontu i domyślne obrzeża boku. W UI po kliknięciu przycisk nadal ma tytuł „Oklejona — kliknij, aby wyłączyć”. Nie można w ten sposób zmienić zamówienia ani kosztu obrzeża ramienia.
- **Przyczyna/poprawa:** `computeGeo` stosuje nadpisania wyłącznie do własnych płyt; formatki ramienia są dodawane później przez `formatkiSzafki`, a `cornerArmParts` nie stosuje nadpisań. Obsłużyć je przy generowaniu płyt ramienia, zachowując regułę braku obrzeży HDF. Dawne N6 dotyczyło wstawki, której odrębna funkcja już stosuje nadpisania; tu nadal nie działa ramię. Dowody: `edge.json`, `candidates.json:edges`, test UI.

### N131 [P2] Ramię ignoruje własne mocowanie półek kolumny i granicy

- **Odtworzenie:** L, jedna półka w kolumnie przy ramieniu; globalnie kołki, w tej kolumnie wybrać konfirmaty.
- **Wynik:** geometria półki korpusu ma `mount=confirmat`, ale zamówienie ramienia daje cztery kołki, a plan „Bok ramienia” nadal wierci kołki. Zmiana globalnego ustawienia na konfirmaty dopiero przełącza ramię na właściwe złącza. Zatem ustawienie lokalne nie obejmuje powiązanej półki ramienia.
- **Przyczyna/poprawa:** `armShelfYs` gubi informację o mocowaniu, a `cornerArmParts` i `wierceniaDodatkowe` odczytują tylko `mocowaniePolek(cab)`. Przekazywać dla każdej półki wysokość i efektywne `mount`, w tym nadpisanie granicy poziomu kolumny; dobierać okucia i wiercenia osobno dla każdej. Dowody: `mount.json`, `candidates.json:mounts`, kontrola globalna w `checks.json`.

### N132 [P2] Przy dwóch poziomach głównych znika górny front ramienia

- **Odtworzenie:** L H900, dwa poziomy główne, w każdym jedne drzwi; korpus ma po uwzględnieniu narożnika poprawne fronty szer.275: dolny y=3..457, górny461..897.
- **Wynik:** zamówienie zawiera tylko jeden „Front ramienia” 560×454. Model 3D również tworzy tylko bryłę y=3..457; górne otwarcie ramienia pozostaje niezamknięte. Nie powstaje ani drugi front, ani jeden pełny front obejmujący całość.
- **Przyczyna/poprawa:** części i widoki pobierają pierwsze `geo.doors.find(...)` jako wysokość całego ramienia. Jawnie zaplanować fronty ramienia dla wielu pasm albo jeden pełny front z własnym zakresem. Przy nieobsługiwanym wariancie potrzebny jednoznaczny komunikat przed zamówieniem. Dowody: `frontlevels.json`, `verified.json:frontLevelsCorrect` (poprawne fronty korpusu, formatka i rzeczywista bryła ramienia).

### N133 [P2] Wspólne dno nie uwzględnia wysunięcia jednej szafki

- **Odtworzenie:** dwie szafki600×720×500, odstęp20, wspólne dno pod bokami. Drugą wysunąć z lica o100mm, pozostawiając jednakowe głębokości i materiał.
- **Wynik:** `projectLayout` zachowuje wysunięcie100, lecz `runBottom` nadal akceptuje wspólne prostokątne dno1220×500 i obejmuje nim obie szafki. Dwa przesunięte względem siebie obrysy głębokości500 wymagają zakresu600mm; ta płyta nie może stanowić pełnego dna obu korpusów. Własne dna są usuwane z zamówienia.
- **Przyczyna/poprawa:** walidacja sprawdza długości/głębokości płyt i materiał, pomija ich rzeczywiste położenie w głębokości. Albo generować odpowiedni obrys z docinaniem, albo wyłączyć wspólne dno z konkretną przyczyną i zachować indywidualne. To odrębne od N119, które dotyczyło rysowania dwóch płyt mimo poprawnego wspólnego zamówienia. Dowody: `offset.json`, `candidates.json:offset`; kontrolny brak wysunięcia z poprzedniego testu N119.

### N134 [P2] Kątownik narożnika przecina dno i cokół w obrysie

- **Odtworzenie:** L H900, płyta18, cokół100 w obrysie (`mode=inbody`), dno między bokami, wariant ze wspornikami.
- **Wynik:** dno prawidłowo podnosi się do y=100..118, ale wewnętrzne płyty kątownika nadal stoją od18 do882 i mają864mm wysokości. Jedna przecina dno korpusu na18×18×60mm, druga dno ramienia na60×18×18mm oraz cokół na60×82×18mm. Potwierdzone przecięciem rzeczywistych brył `Assembly3D`, nie samą oceną obrazka.
- **Przyczyna/poprawa:** wysokość i początek wewnętrznego kątownika nadal wynikają z `H-2*t` oraz `y0+t`, zamiast rzeczywistego światła nad dnem. Przeliczyć formatki, pozycję brył i mocowania od `bottomY`; sprawdzić też wariant bez wieńca. Dawne N56 podniosło dno i dodało cokół, lecz nie dostosowało tego kątownika. Dowody: `raisedBack.json`, `verified.json:raisedHits`.

### N135 [P2] Kontrola kolizji traktuje fronty „Skręcone 90°” jak dwa niezależne skrzydła

- **Odtworzenie:** prawidłowy L, wybrać „Skręcone 90°”; porównać ruch zabudowy 3D z `swingBodies` używanym przez `openingMsgs`.
- **Wynik:** renderer obraca sztywny zespół wokół zawiasu korpusu, ale model kolizji nadal tworzy dwa osobne sektory z osiami (1224,898) i(600,579) w pokoju testowym. Ramię ma w nim własną nieruchomą oś oddaloną o ok.701mm, choć w rzeczywistym sztywnym zespole ten punkt porusza się wraz z frontem korpusu. Ocena dostępnego otwarcia opiera się na innym ruchu niż prezentowane 3D.
- **Przyczyna/poprawa:** gałąź ramienia w `swingBodies` rozróżnia fix, lecz nie modeluje skręconego zespołu. Badać oba prostokąty obracane wokół wspólnej osi. Dawne N54 naprawiło obrót w rendererze `poPlace`; ten odrębny model kontroli pozostał niespójny. Nie przedstawiam tego jako ponownego błędu samej animacji ani jako zweryfikowanego konkretnego kąta zderzenia z sąsiadem. Dowody: `rigid.json`, `more.json:rigid`, `checks.json`.

### N136 [P2] Otwór pod kołek półki ramienia może wypaść poza bokiem

- **Odtworzenie:** głębokość korpusu narożnego560, sąsiedni ciąg/ramię o głębokości korpusu200 (203 z HDF); półka przy ramieniu, kołki250mm od przodu i50 od tyłu.
- **Wynik:** półka ramienia ma182mm głębokości, bok ramienia200. Plan każe wiercić268 i150mm od przedniej krawędzi boku. Pierwszy otwór leży68mm poza płytą. Walidacja kołków korpusu przechodzi, ponieważ jego półka jest znacznie głębsza. Inne ogólne uwagi o froncie/materiale nie wskazują błędnego wiercenia ramienia.
- **Poprawa:** sprawdzać ustawienia kołków również na rzeczywistych półkach i bokach ramienia. Kontrolne50/50 daje poprawne68 i150. Dawne N16 dotyczyło kontroli zwykłej półki; dodatkowy plan ramienia nadal ją omija. Dowody: `shallowpins.json`, `more.json:shallowpins`, `checks.json`.

### N137 [P2] Dwie kolumny dublują wzmocnienia ramienia w tym samym miejscu

- **Odtworzenie:** narożny korpus z dwiema kolumnami na najwyższym poziomie, zastosować parę wzmocnień pod blat zamiast wieńca. W kolumnie schowanej za narożnikiem można ustawić brak drzwi, aby uniknąć niezależnego błędu szerokości frontu.
- **Wynik:** ramię dostaje cztery płyty zamiast dwóch: po dwa identyczne wzmocnienia656×60 oraz1143×60. Każda para ma dokładnie te same współrzędne `u0/u1/v0/v1/wys`, więc płyty nakładają się całkowicie. Zamówienie dodaje również osiem zbędnych wkrętów (16 do czterech wzmocnień zamiast8 do dwóch).
- **Przyczyna/poprawa:** `armPlan` spłaszcza wzmocnienia wszystkich kolumn i każde przedłuża przez całe ramię. Wybrać właściwe styki/kolumnę i usuwać identyczne fizyczne płyty; nie sumować ich jako oddzielnych. Kontrolna jedna kolumna tworzy prawidłowo dwie. Dowody: `duplicaterails.json`, `duplicaterails-result.json`, `verified.json:railControl`, `checks.json`.

### N138 [P2] Plecy ramienia są zamawiane bez mocowań

- **Odtworzenie:** standardowy L z HDF przybijanym, H900, ramię640.
- **Wynik:** „Plecy ramienia” mają1197×898mm. `cornerArmParts.hardware` nie zawiera żadnych zszywek/gwoździków do tej płyty. Korpus liczy swoje36szt. tylko z własnego obwodu900×900; zamówienie projektu nie dodaje mocowań pleców ramienia. Według stosowanej w aplikacji reguły co100mm sama ta dodatkowa płyta wymaga ok.42szt.
- **Kontrola/poprawa:** wydłużenie ramienia do840 zwiększa plecy do1397×898, a liczba mocowań wciąż pozostaje zerowa. Doliczać mocowania od rzeczywistych pleców ramienia; dla pełnej płyty odrębnie właściwe wkręty, dla braku pleców zero. Nie powielać mocowań korpusu. Dawne N81 dotyczyło nadpisań pleców kolumn, nie dodatkowej płyty ramienia. Dowody: `last.json:armBack`, `checks.json`.

### N139 [P2] Szuflady w korpusie L nie są zwężane do dostępnego frontu i przecinają kątownik

- **Odtworzenie:** L900×900×560 z ramieniem640; zamienić jedyną kolumnę korpusu na DXS, NL400, bok80.
- **Wynik:** przed narożnikiem dostępne275mm lica, ale front szuflady ma896mm, skrzynka jest liczona dla światła864. Bryła zamkniętego frontu przecina maskownicę na16×894×60mm i wewnętrzny kątownik na16×864×18mm. Zamówienie zachowuje te niepasujące wymiary.
- **Uwagi/poprawa:** pojawia się ogólne ostrzeżenie o froncie sięgającym poza lico, lecz proponuje zmianę na jedne drzwi275, zamiast rozwiązania szuflady. Nie twierdzę, że aplikacja całkiem milczy. Obsłużyć rzeczywistą komorę z prowadnicami/wspornikiem przy ograniczonym licu albo jednoznacznie zablokować ten wariant jako niemożliwy do montażu. Kontrolne drzwi tej samej szafki są przycinane do275 w geometrii z kontekstem narożnika; ścieżka szuflad tego nie robi. Dowody: `cornerdrawer.json`, `last.json:drawerCorner`, `verified.json:drawerHits`.
