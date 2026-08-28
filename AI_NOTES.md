# Notatki robocze dla AI i Claude

Ten plik trzyma informacje robocze, żeby nie dopisywać ich za każdym razem do `README.md` ani do kodu aplikacji.

## Zasady wymiany zmian z Claude

- `szafki.jsx` jest głównym kodem aplikacji i źródłem prawdy.
- `claude-zmiany.txt` jest buforem na pełny kod JSX wygenerowany albo testowany w Claude.
- `claude-zmiany.txt` nie jest uruchamiany przez aplikację i nie jest publikowany przez GitHub Pages.
- `standalone.html` jest wygenerowanym podglądem HTML z osadzonym kodem aplikacji; nie wklejaj go do Claude jako źródła.
- Jeśli zmienia się `szafki.jsx`, trzeba zaktualizować także `standalone.html`, żeby podgląd Pages miał tę samą wersję.

## Zasada na przyszłość

Informacje organizacyjne, instrukcje dla AI, workflow i notatki o synchronizacji z Claude dopisuj tutaj, a nie w `README.md`, chyba że są naprawdę potrzebne użytkownikowi końcowemu.

## System oznaczania informacji

Do roboczych informacji używamy prostych tagów tekstowych zamiast dopisywania komentarzy w kodzie aplikacji:

- `[AI-INFO]` — ważna informacja dla kolejnych prac,
- `[AI-TODO]` — rzecz do zrobienia później,
- `[CLAUDE-CHANGE]` — opis zmiany przenoszonej z Claude,
- `[CHECK]` — rzecz do ręcznego sprawdzenia w podglądzie.

Znaczniki `<<<<<<<`, `=======`, `>>>>>>>` nie są naszym systemem oznaczania. To znaczniki konfliktu dodawane automatycznie przez GitHub/Git podczas konfliktów merge i trzeba je usuwać przy rozwiązywaniu konfliktu.

## GitHub Actions i pliki buforowe

[AI-INFO] Zmiany wyłącznie w `claude-zmiany.txt`, `AI_NOTES.md`, `AGENTS.md` albo `README.md` nie powinny uruchamiać workflowów GitHub Actions. Te pliki są ignorowane w triggerze `push` workflowu Pages; workflow Android APK jest tylko ręczny.

[AI-INFO] `claude-zmiany.txt` nie jest kopiowany do artefaktu Pages. Podgląd webowy czyta tylko `standalone.html`, `preview.html` i `szafki.jsx`.

[AI-INFO] Workflow Android APK jest tylko ręczny (`workflow_dispatch`). Na tym etapie nie uruchamiamy automatycznego budowania Androida po pushu, bo aktualny priorytet to webowy podgląd aplikacji.

## Testy Playwright

[AI-INFO] `testy/build-artifact.mjs` potrzebuje paczek w `testy/vendorpkg/node_modules`
(`@babel/standalone`, `react@18`, `react-dom@18`, `@tailwindcss/browser`). Katalog jest
w `.gitignore`, więc w świeżym środowisku trzeba go założyć:
`cd testy/vendorpkg && npm init -y && npm i @babel/standalone react@18 react-dom@18 @tailwindcss/browser`.
Ścieżkę można nadpisać zmienną `VENDOR`.

[AI-INFO] Od kiedy `szafki.jsx` przekroczył 500 KB, Babel drukuje „code generator has
deoptimised the styling" i przestaje formatować wynik. Artefakt testowy jest przez to
o ~100 KB mniejszy niż wcześniej — to nie jest oznaka obciętego builda.

[AI-TODO] Pięć suit pada niezależnie od zmian w narożniku — sprawdzone przez zbudowanie
artefaktu z `git show HEAD:szafki.jsx` i przelecenie ich osobno, wynik identyczny:

- `pdf` — `page.goto("file://./report.html")`, względny adres `file://` jest nieprawidłowy;
  suita potrzebuje ścieżki bezwzględnej,
- `savetest` — szuka `http://127.0.0.1:5199/preview-local.html`, którego nikt nie buduje,
- `d2test`, `fixbtn` — timeout `locator.click` na przycisku, którego nie ma,
- `pins2` — 2 BLAD: kołki i etykiety w dwóch kolumnach.

Pierwsze dwie to braki w samych suitach, nie w aplikacji. Do przejrzenia osobno.

[AI-INFO] `python3 -m http.server` na 5205 potrafi paść w trakcie długiego przelotu.
Objaw: wszystkie suity naraz `CRASH: name: 'Error'`. Zanim uzna się to za regresję,
warto sprawdzić `curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1:5205/mebloprojekt-app.html`.

[AI-INFO] Część suit nie chodzi po 5205, tylko po **5199**: `stdfull`, `stdnew`,
`stdtest` i `narjedne` (przy `STD=1`) czytają `standalone-local.html`, a `interact`
i `savetest` — `preview-local.html`. Bez tego serwera zgłaszają `CRASH: name: 'Error'`,
co wygląda jak regresja, a jest tylko brakiem hosta. `standalone-local.html` robi się
z `standalone.html` przez podmianę czterech adresów CDN na `cdn/…`; po każdej zmianie
w `szafki.jsx` trzeba go odświeżyć razem ze `standalone.html`.

## Kontrola otwierania skrzydeł

[AI-INFO] `swingBodies` / `openingMsgs` w `szafki.jsx` liczą kolizje otwierania
w układzie całej zabudowy (`projectLayout`), a nie pojedynczej szafki. Skrzydło to
ćwiartka koła o promieniu równym szerokości frontu, wokół osi zawiasów; przeszkodą są
korpusy, ramiona, fronty zamknięte, fronty szuflad wysunięte na długość prowadnicy
i uchwyty. Pole „wysunięcie z lica" jest tylko pozycją szafki — sprzęt wystający poza
lico dostanie osobną opcję i wtedy dołoży się tu jako kolejna bryła.

[AI-INFO] Jeśli terminal agenta nie może pobrać aktualnego `claude-zmiany.txt` z GitHuba, można użyć workflow `Promote Claude Changes`. Workflow działa na GitHubie: kopiuje `claude-zmiany.txt` do `szafki.jsx`, uruchamia build Vite jako walidację, regeneruje `standalone.html`, commituje wynik na gałąź i od razu publikuje GitHub Pages. To jest potrzebne, bo push wykonany przez `GITHUB_TOKEN` nie uruchamia kolejnego workflowu Pages automatycznie.

## Narożnik w L — co jest z czego liczone

[AI-INFO] Ramię liczy się **od końca narożnego kwadratu**: przy drugiej ścianie
narożnik zajmuje `głębokość szafki w rogu + arm`. Przy 600 + 600 wychodzi 1200 mm
i tyle odsuwa się tamten ciąg. Pole „Długość ramienia" to `arm`, nie całość.

[AI-INFO] W rogu spotykają się dwa lica frontów i stoi tam **kątownik**: cztery
pionowe płyty (dwie wewnętrzne z płyty półkowej na całą wysokość wnętrza, dwie
maskownice z płyty frontowej na wysokość drzwi). Formatka nie schodzi poniżej
`MIN_PART`, więc jedna płyta nachodzi na czoło drugiej — nachodząca wystaje poza
naroże o grubość płyty **mniej** niż jej szerokość, doczołowa o tyle **więcej**.
Stąd przy 60 mm i froncie 18 mm: 42 mm po jednej stronie, 78 po drugiej.
`cornerBracket()` liczy to raz, `bracketPlan()` daje z tego prostokąty do rzutu.

[AI-INFO] Od strony ramienia korpus **nie ma boku** — przechodzi w ramię. Zamiast
płyty stoi kątownik przy plecach (`corner.post`, ramiona domyślnie 150 mm),
a `corner.side` mówi, która to strona („auto" = prawa).

[AI-INFO] Osie w rysunkach są różne i łatwo o pomyłkę: w **rzucie z góry**
(`CabTop`, `TopView`) `y = 0` to **tył** korpusu, a `y = cd` lico. W **bryle 3D**
(`Scene3D`, `Assembly3D`) `z` liczy się **od lica** w głąb. `rail.z0` w geometrii
jest liczone od lica — w rzucie trzeba je przeliczyć (`cd - (z0 + zLen)`),
w bryle nie. Dwa razy w tej sesji pomyliło to strony płyt.

## Blat roboczy ciągu

[AI-INFO] `run.worktop` włącza blat na całym ciągu; nowe ciągi mają go domyślnie,
stare projekty nie (pola po prostu nie mają). Szafka dokładana do takiego ciągu
przychodzi bez wieńca i z parą wzmocnień (`bezWienca`): z przodu płyta na płask,
z tyłu stojąca. Blat obejmuje szafki tej wysokości lica, która zajmuje w ciągu
najwięcej miejsca; reszta wypada spod niego — różnica od `SLUPEK_MIN` (200 mm)
to zamierzony słupek, poniżej to rozjazd i ostrzeżenie. Głębokość blatu jest
wymiarem rzeczywistym: korpus + grubość frontu + `WORKTOP_OVERHANG` (10 mm).

[AI-INFO] Suity klikające „Cokół pod szafką" albo „Nóżki pod szafką" muszą
**ustawiać stan**, a nie klikać na oślep — nowy projekt startuje z szablonu
„Szafka stojąca", więc cokół bywa już włączony. Tak samo zawieszki: karta pokazuje
je tylko szafce wiszącej, więc najpierw trzeba zdjąć cokół i nóżki.

## Piętra ściany (ciąg dolny i górny)

[AI-INFO] Jedna sciana trzyma dwa ciagi: `run.tier` = „dolny"/„gorny", a gorny
wskazuje `run.wall` na dolny. Dlugosc sciany i narożnik sa wspolne — gorny bierze
je od dolnego. Wysokosci montazu gornego **nie wpisuje sie**: `tierMountY` liczy
ja z lica dolnego (`cabTopY`) plus grubosc blatu plus `run.clearance` (500).
Przy szafce 720 z cokolem 100 i blacie 38 wychodzi 1358.

[AI-INFO] Zakres „Ciąg" przy scianie z dwoma pietrami dostaje podzakladki
dolny / gorny / calosc — wybor siedzi w `tierScope` i przelacza `scopeRuns`.

[AI-INFO] W ukladzie **ramienia** w bryle 3D `z = 0` to LICO, a `z = glebokosc`
plecy — odwrotnie niz podpowiada intuicja i odwrotnie niz w rzucie z gory.
Pomylka w te strone wsadza plecy na front, a wzmocnienia zamienia miejscami.

## Kontekst rogu w geometrii szafki

[AI-INFO] `computeGeo(cab, mat, ctx)` bierze opcjonalny trzeci argument z
rozmieszczenia ciagow: `{ armFree, armSide }`. Sama szafka nie wie, jak gleboki
jest sasiedni ciag, a wlasnie z tego wychodzi, ile jej lica zostaje przed
narozem — bez tego wzmocnienia szafki naroznej biegly przez caly korpus, takze
przez przelot w ramie.

[AI-INFO] Kolejnosc jest dwuprzebiegowa i tak ma byc: `projectLayout` liczy
rozmieszczenie **bez** ctx (inaczej wpadlby w kolo), a rysunki i zestawienie
wolaja `assemblyParts(project, runs, full)` albo `computeGeo(..., armCtxOf(...))`
juz z gotowym rozmieszczeniem. Przyciecie dotyczy tylko `x0`/`x1` wzmocnien,
wiec nie zmienia niczego, z czego liczy sie samo rozmieszczenie.

[AI-INFO] Odsuniecie ciagu na scianie (`offset` + `offsetFrom`) wchodzi w
`runLayout` od razu w `lead` albo `tail` — dalej cala geometria pasa liczy sie
sama, bo idzie wlasnie od tych dwoch liczb. Nie ma osobnej sciezki na
„przesuniety ciag".

[AI-INFO] Dlugosc sciany jest wspolna dla obu pieter (`runWallW`), a pole w
karcie gornego ciagu zapisuje ja do ciagu dolnego — inaczej kazde pietro
trzymaloby wlasna dlugosc tej samej sciany.

## Ramie naroznika: jedno miejsce na plyty, dwa uklady osi

[AI-INFO] `armPlan(a, lokalnie)` liczy wzmocnienia i plecy ramienia — tak samo
jak `bracketPlan` liczy katownik. Rysunek ciagu, rysunek samej szafki, bryla 3D
i formatki biora z niego te same liczby; dopisanie plyty tylko w jednym z tych
miejsc konczy sie tym, ze lista mowi swoje, a rysunek swoje.

[AI-INFO] Plecy i **tylne** wzmocnienie ramienia nie koncza sie na licu korpusu:
wchodza w glab szafki naroznej az do katownika w tylnym narozniku, czyli o
`glebokosc - plecy - ramie katownika` (u ujemne w ukladzie ramienia). Bez tego
wisialy w powietrzu nad przelotem, a wzdluz drugiej sciany zostawal goly pas.

[AI-INFO] Wolne lico przycina w `computeGeo` tylko te wzmocnienia, ktore stoja
**z przodu**. Rozpoznajemy je po `fromBack`: plyta przy plecach idzie przez cala
szafke do katownika w narozniku, plyta przy licu konczy sie na katowniku przy
drzwiach — `ctx.armKat` mowi, ile ten katownik wystaje poza samo lico, i liczy
sie go z `bracketPlan`, zeby nie powtarzac wzoru.

## Blat na rysunkach

[AI-INFO] `runTop` oddaje `spans`, `y` i `th` — odcinki, wysokosc lica i
grubosc. Rysunki wolaja `worktopSpans(rt)`, ktore skleja sasiadujace odcinki
w jedna plyte i dociaga skrajne do konca calego blatu (nad rogiem blat idzie
dalej niz szafki pod nim).

[AI-INFO] W bryle 3D blat dostaje `bias` rowny polowie swojej glebokosci. Sciany
sortuja sie po **sredniej** glebokosci, a blat to jedna wielka plyta: jej srodek
wypada dalej niz wzmocnienia i katowniki tuz pod nia, wiec bez przyciagniecia do
widza przebijaly sie przez wierzch. Polowa glebokosci wygrywa z tym, co lezy pod
blatem, i jest wyraznie mniejsza od przeswitu do szafek gornych.

## Ciagi i uwagi

[AI-INFO] Sa dwie rozne operacje na ciagu i latwo je pomylic: `removeRun`
**rozwiazuje** ciag (szafki zostaja, wracaja na wolnostojace, przycisk w karcie
„Ciąg meblowy"), a `deleteRun` **kasuje** go razem z szafkami i z gornym pietrem
tej samej sciany (przycisk „× ciąg" w naglowku). Ostatnich szafek projektu
`deleteRun` nie zabiera — aplikacja nie ma wtedy czego pokazac.

[AI-INFO] Odhaczanie uwag (`szafki:przeczytane` w localStorage) obejmuje
ostrzezenia i podpowiedzi, ale nie bledy. Licznik nad projektem liczy tylko
nieprzeczytane (`warnsNowe`, `infosNowe`) — inaczej pasek straszy liczba, ktora
dawno przeczytales.

## Plecy z plyty w narozniku

[AI-INFO] Pelne plecy z plyty usztywniaja rog tak samo jak stojace wzmocnienie
przy tej samej scianie, wiec je zdejmuja. Po stronie korpusu robi to zwykle
ustawienie `cab.back === "board"` (checkbox w karcie naroznika jest tylko
skrotem do niego), po stronie ramienia — `cab.corner.backBoard`. Filtr siedzi
w dwoch miejscach: `computeGeo` wyrzuca wtedy wzmocnienie `front` + `fromBack`
z korpusu, a `armPlan` to samo z ramienia. Plaskie wzmocnienie pod blatem
zostaje zawsze — ono nie usztywnia, tylko trzyma blat.

[AI-INFO] Wzmocnienie czolowe ramienia wchodzi w szafke o `atDepth + szerokosc`
tego samego wzmocnienia w korpusie (przy standardzie: 18 + 100 = 118). Dopiero
wtedy obie plyty stykaja sie cala szerokoscia i da sie je skrecic — skrocone do
lica mijaly sie o grubosc frontu.

[AI-INFO] Stojace wzmocnienie przy plecach stoi na zero z tylna krawedzia
korpusu, tak samo jak koncza sie boki; plecy ida na nie normalnie. Byla krotka
wersja z odsunieciem o 18 mm i `migrateCab` sprowadza ja z powrotem do zera.

## Rog: co gdzie stoi

[AI-INFO] Katownik w tylnym narozniku stoi rowno z tylna i boczna plaszczyzna
korpusu (`pOd = geo.backIntrusion`, bez grubosci plecow) — plecy ida na niego,
tak jak na boki. Tylne wzmocnienia sa za to cofniete o grubosc plyty i dolegaja
do jego wewnetrznego lica; tam sie je skreca. W zwyklej szafce tego cofniecia
nie ma: wzmocnienie konczy sie rowno z tylna krawedzia.

[AI-INFO] W szafce naroznej plyta od strony drzwi tez stoi pionowo (60 mm),
a nie lezy na plask — dwie stojace plyty spotykaja sie w kacie i skreca sie je
przez lico jednej w czolo drugiej. `railPair(cofniete, odTylu, pionZPrzodu)`,
a `migrateCab` przestawia stare pary po ich sygnaturze (shelf, top, 100 mm).

[AI-INFO] Nazwy wzmocnien rozroznia `przyTyle` (czyli `fromBack`), a nie sama
orientacja — po zmianie powyzej obie plyty pary sa `orient: "front"` i bez tego
obie nazywalyby sie tak samo.

[AI-INFO] `worktopMsgs` dziala takze dla pasa bez wlasnych szafek: blat nad
ramieniem naroznika liczy sie do sciany za rogiem, wiec to tam wychodzi za
szeroki. Poprawka `rundepth:<mm>@<runId>` umie siegnac do sasiedniego ciagu —
bez tego ostrzezenie nie mialoby gdzie sie pokazac, bo pusty pas nie ma karty.

[AI-INFO] Ustawienia ramienia siedza w karcie „Struktura wnetrza", pod grupa
„Ramię narożnika" — ramie to dalszy ciag tej samej szafki, a nie sprawa ciagu.
W karcie „Ciąg meblowy" zostaje sam narożnik miedzy pasami. Wysokosc, glebokosc,
cokol, front i polki ramienia nie maja tam wlasnych pol, bo bierze je z szafki
i z sasiedniego ciagu — mowi o tym akapit pod ustawieniami. Wzmocnienia maja
tam wlasna podgrupe „Wzmocnienia ramienia" (wymiary z `armPlan`, do czytania —
ustawia sie je w kolumnie szafki, bo to te same plyty). W kolumnie naglowek
mowi „Wzmocnienia korpusu" i odsyla do tamtej podgrupy.

## Blat: co zamawiamy, a co dociera sie na miejscu

[AI-INFO] Blat kupuje sie w gotowym pasie 600 albo 1200 mm. Roznicy do
`WORKTOP_ONSITE` (50 mm) nie zdejmuje zaklad — sciana i tak nie jest prosta,
wiec `runTop` zamawia caly pas (`pelnyArkusz`), a `surowa` trzyma wymiar
wynikajacy z szafek. Uzytkownik moze to odwrocic przelacznikiem `run.topCut`
(poprawka `topcut:0/1` w Uwagach). Wieksza roznica idzie na wymiar.

[AI-INFO] Cokol ciagu rysuje sie na `rp.total`, a nie na `g.total`: w rogu
konczy sie na cokole prostopadlej sciany, a nie na koncu szafki naroznej.
Rysowany na cala dlugosc ciagu wystawal w powietrze — w elewacji i w bryle.

[AI-INFO] Polki w bryle calej zabudowy dostaja ujemny `bias` (pol glebokosci
szafki). Siegaja az do lica, wiec ich przednia krawedz lezy w jednej
plaszczyznie z drzwiami i przy sortowaniu po sredniej glebokosci potrafily
przebic sie na wierzch zamknietych drzwi.

[AI-INFO] Plecy ramienia koncza sie dalej niz jego wzmocnienie: nachodza na
katownik w tylnym narozniku na cala jego dlugosc i urywaja sie dopiero na
tylnej plaszczyznie szafki (`tylPlecy`), a wzmocnienie zatrzymuje sie na
`tylWzm`, czyli na wolnej czesci ramienia katownika.

[AI-INFO] Lico szafki naroznej za maskownica jest otwarte — tam zaczyna sie
przejscie do ramienia. W elewacji zamknietej zaznaczamy je przerywanym polem
z podpisem „przejście do ramienia", bo zostawione puste czytalo sie jak dziura
miedzy drzwiami a wzmocnieniem. Po otwarciu drzwi pola nie ma: wtedy i tak
widac wnetrze.
