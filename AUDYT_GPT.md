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

