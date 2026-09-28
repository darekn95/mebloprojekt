# Lista błędów, poprawek i decyzji

Jedno miejsce na znane błędy aplikacji i testów, ich przyczyny i to, co z nimi
zrobiono. Wpis dopisuje się przy znalezieniu błędu, a przenosi do „Naprawione”
razem z commitem, który go usuwa. Sprawy, które wymagają decyzji użytkownika,
idą do „Do decyzji” z konkretnymi opcjami — nie wstrzymują reszty pracy.

Pełny przebieg testów: `SLOWNIK.md`, sekcja 8. Suity padające tak samo na czystym
`main` to błędy sprzed zmiany — trzeba to sprawdzić, zanim uzna się coś za regresję.

## Do naprawy

| Suita | Objaw | Przyczyna / stan |
|---|---|---|
| — | wszystkie znane usterki z listy naprawione 2026-09-27; nowe dopisywać tutaj | |

## Naprawione

| Data | Suita / miejsce | Przyczyna | Commit |
|---|---|---|---|
| 2026-09-28 | **ciągi górne w L** (`gorne`) | górny ciąg drugiej ściany trafiał na pierwszą ścianę (układ nie brał ramki od dolnego, choć kod o tym mówił) — nachodził na tamten górny, rysunki i kontrola otwierania pokazywały bzdury; teraz górny stoi w ramce swojego dolnego, a w rogu odsuwa się o głębokość górnego ciągu ściany wjeżdżającej | (ten commit) |
| 2026-09-28 | „+ szafka” w ciągu (`gorne`) | nowa szafka miała domyślne 500 w głąb (w górnym ciągu 300, w dolnym 570) i bez cokołu ciągu — od razu ostrzeżenie o rozjeździe, który zrobiła sama aplikacja; teraz bierze H/D/cokół ciągu | (ten commit) |
| 2026-09-28 | `otwier`: kolizja w rogu | rada „zwęź front do 0 mm” (14, 44 mm) przy wąskiej szafce w ślepym rogu — teraz tylko, gdy zostaje ≥ `MIN_COL` (200); „odsuń ciągi w rogu” wskazuje pole „Luz w rogu” | (ten commit) |
| 2026-09-28 | rzut z góry: ślepy róg | napis „30 dostępu” nad wąskim wymiarem przecinał wymiary drugiego ciągu — przy dostępie < 160 mm stoi obok, nad zasłoniętą częścią szafki (`data-el="dostep-waski"`) | (ten commit) |
| 2026-09-27 | **formatki: jedna szafka w ciągu** | blat i cokół ciągu wypadały z listy szafki (liczą się w ciągu), a „Formatki całego projektu”, produkty, rozkrój całości i strona projektu w PDF pokazywały się dopiero od 2 szafek — blatu i cokołu nie było **nigdzie**; teraz warunek `calyProjekt` (2+ szafki albo części ciągu/ramię) i informacja pod listą szafki | (ten commit) |
| 2026-09-27 | **formatki: szafka w L** | płyty ramienia były tylko w liście projektu, nie w liście szafki (ani na jej kartce PDF); teraz `formatkiSzafki` dokłada ramię | (ten commit) |
| 2026-09-27 | **formatki ramienia** | formatki ramienia (bok 552 × 684 między dnem a górą, dno i półka o 18 mm płytsze, plecy 684) nie zgadzały się z rysunkiem; użytkownik: „ma być tak, jak wygląda” — bok na pełną wysokość i głębokość, dno/wieniec między korpusem a bokiem na pełną głębokość, plecy HDF H − 2 jak w korpusie; rysunek: front ramienia i maskownice w linii drzwi, kątownik między dnem a górą, dno i półka nie wchodzą pod bok | (ten commit) |
| 2026-09-27 | wydruk szafki | kartka szafki w ciągu z blatem liczyła „Blat” szafki, choć aplikacja go pomija (blat ciągu) — ta sama `formatkiSzafki` w obu miejscach | (ten commit) |
| 2026-09-27 | `wygl`, `wyglstd` | test sprawdzał dawną zasadę „z góry bez nóżek”; teraz przerywany obrys pod „Pokaż okucia” | 30d1c93 |
| 2026-09-27 | `drobnestd` | test oczekiwał dawnego luzu 3 mm między drzwiami (domyślnie 2) | 30d1c93 |
| 2026-09-27 | `ciag5`, `grain` | kreskowanie „przejścia do ramienia” (`<pattern id="mp-przejscie">`) brane za szew cokołu i za strukturę słojów — aplikacja dobra | b89e078 |
| 2026-09-27 | `ciag7` | nowy format opisu („jedna formatka” w środku zdania, listwa w mb w zestawieniu) | e46e01b |
| 2026-09-27 | `narjedne` | nie błąd aplikacji: jedne drzwi przy rogu same wypełniają lico do maskownicy (ręczna szerokość celowo pomijana), więc podpowiedź „Zrób jedne drzwi” nie ma czego naprawiać; test sprawdza teraz dopasowanie drzwi (238 mm), brak szpary i błędu pasma | (ten commit) |
| 2026-09-27 | `nozki`, `nozkistd` | test zakładał 2 nóżki od czoła, a szafka 900 mm ma od wcześniejszej zmiany parę na środku (3 widoczne); wysokości i przygaszenie były dobre | (ten commit) |
| 2026-09-27 | `polkigr` | rachunki testu liczone przy dawnym luzie 3 mm między frontami; przy 2 mm podział pasma szuflad przesuwa się o 1 mm (suma ta sama) — sprawdzone: z luzem 3 mm wychodzą 250/241; test ustawia luz 3 mm wprost | (ten commit) |
| 2026-09-27 | `pins2` | nowa kolumna startuje bez półek, a „+ półka” jest tylko w kolumnie, która już je ma — test klikał go w pierwszej; podpisy otworów mają dziś postać „otw. 527”. Test ustawia pole „półki” drugiej kolumny i czyta nowy format; kołki i podpisy były dobre | (ten commit) |
| 2026-09-27 | `pdf` | względny adres `file://./report.html` — teraz bezwzględny; `zestawienie.pdf` w `.gitignore` | (ten commit) |
| 2026-09-27 | `savetest`, `interact` | szukały `preview-local.html`, którego nikt nie buduje — teraz build testowy (lub standalone przy `STD=1`); `savetest` ma jawne OK/BLAD (zapis, wczytanie po przeładowaniu) | (ten commit) |
| 2026-09-27 | `d2test` | „Zaślepka nad szafką” to dziś „Blenda nad szafką” w zwiniętej karcie; test rozwija kartę, ma jawne OK/BLAD (blenda, fix u góry skraca drzwi, wzmocnienie pionowe, widoki) | (ten commit) |
| 2026-09-27 | `fixbtn` | przycisk „Usuń drzwi z tej kolumny” to dziś „Usuń kolidujące skrzydło”; test ma jawne OK/BLAD (błąd o zawiasie na fixie znika po obu poprawkach) | (ten commit) |
| 2026-09-27 | `luzy` | podpowiedź o luzie pojawia się przy nierównym podziale; test ustawia luz 3 mm wprost | 3d2690b |

## Do decyzji użytkownika

Pytania z pracy nocnej 2026-09-28 — do zadania rano przyciskami.

1. **Ślepy róg — ile frontu naprawdę zasłania drugi ciąg?** Dziś zasłonięta część
   szafki w rogu = głębokość korpusu drugiego ciągu (570). Jego drzwi stoją jednak
   18 mm dalej (570 + front 18 = 588), więc „N dostępu” jest zawyżone o grubość
   frontu, a pierwsze drzwi szafki w rogu (i wstawka) mogą zahaczać o front sąsiada.
   Opcje: (a) liczyć do lica frontów sąsiada (588) — zmieni podpisy „dostępu”
   i szerokości drzwi przy rogu o 18 mm; (b) zostawić od korpusu (570).
   Rekomendacja: (a).
2. **Wstawka szeroka (60 licem) — oklejanie i trójkąty.** Przyjąłem: oklejona krawędź
   pionowa od strony drzwi i dolna; trójkąty meblarskie w jednym rzędzie co ok.
   400 mm (przy 720 — 2 szt.). Opcje oklejania: (a) tak jak jest; (b) obie krawędzie
   pionowe i dolna. Trójkąty: (a) jeden rząd; (b) dwa rzędy (od góry i od dołu po 2).
3. **Wstawka płaska — wkręty.** Przyjąłem „Wkręt 4 × 30” od środka szafki przez bok,
   co ok. 200 mm (przy 720 — 4 szt.). Czy tak, czy inna długość/rozstaw?

## Ustalone — nie ruszać

- Podpowiedź „Zrób jedne drzwi na … mm” przy szafce narożnej w L (`cornerdoor:`
  w `runCornerMsgs`) zostaje **celowo** jako zabezpieczenie, choć dziś praktycznie
  się nie pojawia: pas frontu szafki narożnej sam kończy się na maskownicy kątownika,
  więc jedne drzwi, dwoje i ręczna szerokość mieszczą się w licu (sprawdzone
  2026-09-27 na szablonie `naroznikL`). Nie usuwać (decyzja użytkownika).

- Artefakt na claude.ai **nie** potrzebuje pobierania plików (tylko wersja na
  GitHubie). „Wyślij do Claude” jest **tylko** w artefakcie. Szczegóły w `AGENTS.md`.

## Pomysły / optymalizacja

- **Zrobione 2026-09-28: wstawka w rogu** (`run.corner.wstawka`, suita `wstawka`) —
  płaska 18 × 60 na wkręty i szeroka 60 na trójkąty, przy pierwszej szafce ciągu,
  który nie wjeżdża w róg; formatka z płyty frontowej na wysokość korpusu, rysunki,
  kontrola otwierania, przyciski przy kolizji, pole w karcie ciągu (Narożnik).

- **Zrobione 2026-09-27:** zapamiętywanie `computeGeo` i `runTop` (niezmienne
  obiekty projektu jako klucz). Pomiar na 24 szafkach w 3 ciągach (mediana
  czasu od zmiany szerokości do narysowania): Szafka/Zamk. 53→33 ms,
  Zabudowa/Zamk. 62→38 ms, Zabudowa/Z góry 47→33 ms, Zabudowa/3D 62→41 ms;
  obrót 3D 53→44 ms. Pełny przebieg testów zielony przed i po zmianie.
  Warunek: nikt nie zmienia szafki, materiałów, projektu ani wyniku w miejscu.

- **Zrobione 2026-09-27:** powiększenie rysunku wraca po przełączeniu widoku
  (osobno dla każdej szafki i widoku, razem z miejscem przewinięcia).
- **Zrobione 2026-09-27:** podpowiedź „dwoje wąskich drzwi” (każde < 250 mm,
  jedne ≤ 600 mm) z przyciskami „Jedne drzwi … — zawiasy z lewej / z prawej”.
  To co innego niż „Zrób jedne drzwi” przy rogu (poniżej).
- **Później, po szablonie słupka:** nowa kategoria „Sprzęty” (płyta indukcyjna,
  piekarnik, lodówka, zmywarka, mikrofala itd.), a z nią sprzęty wystające poza
  lico i kontrola otwierania przy nich. Do tego czasu sprzętów nie ruszamy
  (decyzja użytkownika 2026-09-27).
