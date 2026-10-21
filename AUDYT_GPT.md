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



## Nowy audyt 21.10.2026 — N69–N71

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


---

Nowe otwarte zgłoszenia: N69–N77; PDF-1 pozostaje. N74–N76 potwierdzono w funkcjach obliczeń i generowanej geometrii aktualnego źródła (blob `b2d4271da583cc43c47ba41681a1a65f99445562`), na konfiguracjach syntetycznych. Projekt użytkownika pozostał bez zmian. Test rozkroju 886 650 zestawów nie wykazał naruszeń sprawdzanych własności: liczby/wymiarów formatek, obrotu przy zakazie, granic arkusza, nakładania i odstępów rzazu. Nie jest to gwarancja optymalnego rozkroju ani pełnej poprawności aplikacji.


