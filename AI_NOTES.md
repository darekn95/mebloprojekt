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

[AI-INFO] Znane błędy aplikacji i testów, ich przyczyny i decyzje: **`BLEDY.md`**.

[AI-INFO] Pełny przebieg: wszystkie suity, które wypisują „  OK / BLAD” (ok. 90, z czego
18 z końcówką `std` i `stdfull`/`stdnew` chodzi po 5199), po 5 naraz w tle — polecenie
w `SLOWNIK.md`, sekcja 8. Serwery najlepiej trzymać jako proces w tle narzędzia
(`exec python3 -m http.server …`), bo uruchomione przez `setsid … &` znikały przy
przeładowaniu kontenera. Przy 5 naraz pojedyncza suita potrafi raz paść na czasie
(np. `narozn3` bez listy blatów) — zanim uzna się to za regresję, puścić ją osobno.

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
narożnik zajmuje `odsunięcie od ściany + głębokość szafki w rogu + arm` (+ „Luz
w rogu”, jeśli ustawiony). Przy 0 + 570 + 1200 wychodzi 1770 mm i tyle odsuwa się
tamten ciąg (`glRog + armLen + clear`). Pole „Długość ramienia" to `arm`, nie całość.

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
wymiarem rzeczywistym od ściany na wysokości blatu: odsunięcie od ściany + korpus
+ `HINGE_PLAY` (2 mm) + grubość frontu + `WORKTOP_OVERHANG` (10 mm) — szczegóły
w sekcji „Blat: co zamawiamy…”.

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

[AI-INFO] Regula: wszystko, co pokazuje albo liczy szafke NAROZNA, musi wziac
geometrie z kontekstem (`computeGeo(cab, mat, armCtxOf(layout, index))`). Bez
kontekstu front idzie przez cala szerokosc korpusu i wychodza z tego zjawy:
za dlugie wzmocnienia, kolizje otwierania, ktorych nie ma, i uwagi o czyms, co
nie istnieje. Kontekst maja juz: karta szafki, `assemblyParts`, `projectParts`
(czyli formatki, ceny i rozkroj), uwagi projektu, kontrola otwierania i kartka
wydruku. Bez kontekstu zostaja tylko te miejsca, ktorym wystarcza `geo.W` albo
gorne lico (`runJoints`, `worktopLevel`, paski szerokosci) — tam kontekst
niczego nie zmienia.

[AI-INFO] Pasmo frontu szafki naroznej jest przyciete do lica przed narozem:
`ctx.armFront` (z `armCtxOf`) konczy je tam, gdzie zaczyna sie maskownica
katownika. Wczesniej szerokosc drzwi wpisywal na sztywno szablon — po zmianie
glebokosci sasiedniego ciagu maskownica jechala z licem, a liczba zostawala
i miedzy nimi robila sie szpara (to byla „dziura miedzy drzwiami a wspornikiem").
Jedne drzwi w kolumnie przy rogu ignoruja wpisana szerokosc i biora cale pasmo,
wiec stare projekty prostuja sie same przy wczytaniu. Uwaga o rozjezdzie liczy
sie w obie strony (za szeroki front i szpara) i liczy `zajete` z geometrii
policzonej JESZCZE RAZ z kontekstem — ta z `projectLayout` kontekstu nie ma,
bo to z niej dopiero wychodzi ramie.

[AI-INFO] Front ramienia liczy `armFrontPlan(a)` — `odRogu` (gdzie sie zaczyna,
mierzone od naroza) i `w` (szerokosc). Przy katowniku luz siedzi tylko na wolnym
koncu: front zachodzi tam na bok ramienia dokladnie tak, jak drzwi szafki na jej
bok. Tej jednej funkcji uzywaja formatka i wszystkie rysunki (elewacja szafki
i ciagu, oba rzuty z gory, bryla) — wczesniej kazdy rysowal `armFront` rowno
z koncem ramienia, wiec bok byl rysowany na froncie.

[AI-INFO] Puszki zawiasow ramienia siedza na wewnetrznym licu boku na wolnym
koncu (`licoBoku`), a nie na krawedzi skrzydla — tak samo jak `d.hingeX` przy
drzwiach szafki, gdzie zawias niesie bok albo przegroda.

[AI-INFO] W rzutach z gory front szafki naroznej konczy sie nie na `arm.free`,
tylko przed maskownica katownika (`arm.free - (odKorpusu - luz)`). Ciagniety do
`free` nachodzil z gory na wspornik. W elewacji tego problemu nie ma, bo tam
front bierze sie z `geo.doors`.

[AI-INFO] Otwarte lico przy rogu (przejscie do ramienia) rysuje sie polem
`PrzejscieDefs` — kreskowanie na ukos plus podpis. Podpis idzie na koncu, nad
polkami i wzmocnieniami: pod nimi byl zaslaniany i puste lico czytalo sie jak
dziura miedzy drzwiami a wzmocnieniem.

[AI-INFO] Widok od tylu pojedynczej szafki pokazuje wzmocnienia kreska, na
wierzchu plecow — sa za nimi, wiec inaczej nie widac ich wcale.

[AI-INFO] `worktopMsgs` dziala takze dla pasa bez wlasnych szafek: blat nad
ramieniem naroznika liczy sie do sciany za rogiem, wiec to tam wychodzi za
szeroki. Poprawka `rundepth:<mm>@<runId>` umie siegnac do sasiedniego ciagu —
bez tego ostrzezenie nie mialoby gdzie sie pokazac, bo pusty pas nie ma karty.

[AI-INFO] Ustawienia ramienia siedza w karcie „Struktura wnetrza", pod grupa
„Ramię narożnika" — ramie to dalszy ciag tej samej szafki, a nie sprawa ciagu.
W karcie „Ciąg meblowy" zostaje sam narożnik miedzy pasami. Wysokosc, glebokosc,
cokol, front i polki ramienia nie maja tam wlasnych pol, bo bierze je z szafki
i z sasiedniego ciagu — mowi o tym akapit pod ustawieniami. Wzmocnienia maja
tam wlasna podgrupe „Wzmocnienia ramienia". W rogu sa cztery plyty: dwie w
korpusie (ustawiane w kolumnie) i dwie w ramieniu — osobne formatki, wiec ich
szerokosc siedzi w `cab.corner.railW = { przod, tyl }` (puste = jak w korpusie,
czyta to `armPlan`). Polozenie zostaje wspolne, bo obie plyty musza sie spotkac
w rogu. Domyslnie oba wzmocnienia pary w rogu stoja pionowo i maja `ROG_WZM_H`
(60 mm); stare 100 mm prostuje `migrateCab`.

## Blat: co zamawiamy, a co dociera sie na miejscu

[AI-INFO] Blat kupuje sie w gotowym pasie 600 albo 1200 mm. Roznicy do
`WORKTOP_ONSITE` (50 mm) nie zdejmuje zaklad — sciana i tak nie jest prosta,
wiec `runTop` zamawia caly pas (`pelnyArkusz`), a `surowa` trzyma wymiar
wynikajacy z szafek. Uzytkownik moze to odwrocic przelacznikiem `run.topCut`
(poprawka `topcut:0/1` w Uwagach). Wieksza roznica idzie na wymiar.

[AI-INFO] Glebokosc blatu (ustalone z uzytkownikiem): od sciany na wysokosci
blatu = odsuniecie od sciany (`wallGapOf(run, item).top`) + korpus +
`HINGE_PLAY` (2 mm luzu przy zawiasach) + front + `WORKTOP_OVERHANG` (10).
Luz przy zawiasach to wytyczna montazowa: nie ma go na rysunkach ani
w wymiarach. `runTop` liczy `doLica` (sciana → lico drzwi) i `wysiegArkusza`
(ile arkusz wystaje przed drzwi): <10 mm uwaga, 10–30 bez uwag i caly arkusz,
>30 ostrzezenie (zle odsuniecie, zla glebokosc albo blat do dociecia)
i domyslnie blat na wymiar. `run.topCut` jest trojstanowy: true = docięty,
false = caly arkusz, null = dobiera sam. Dawna regula „do 50 mm zdejmujemy przy
scianie" (`WORKTOP_ONSITE`) wyleciala. `topCut` wczesniej gubil sie przy
wczytaniu projektu (nie bylo go w `migrateRun`).

[AI-INFO] Odsuniecie od sciany: `run.wallGap = { bottom, top }` i wyjatek
w szafce `item.wallGap` (null = jak ciag). Dwie wartosci, bo krzywa sciana
daje inny odstep przy podlodze (polozenie szafki, rog) i inny pod blatem
(glebokosc blatu). Rog: `glRog` w `projectLayout` zawiera odstep szafki
naroznej przy podlodze, a styk blatow — roznice dol/blat przechodzacego ciagu.
Widok z boku rysuje sciane (`data-el="sciana"`) ukosem albo pionowo.
`runFrontDepth` (czyli `n.depth` w `runLayout`) liczy od sciany do lica
RAZEM z odstepem przy podlodze — dlatego rzut z gory i bryla 3D przesuwaja
szafki od sciany same. Ramie szafki w L ma glebokosc samego korpusu
(`other.depth` minus odstep sasiada), a cala szafka w L odsuwa sie od
sciany sasiada o jego odstep (`n.pair.odSasiada` dochodzi do `tail`/`lead`
ciagu, ktory wjezdza w rog). Blat w rzucie i w bryle zaczyna sie przy scianie
na wysokosci blatu, czyli o `bottom - top` blizej pokoju. Elewacja z przodu
odstepu nie pokazuje — nie ma w niej glebokosci.

[AI-INFO] Wymiary szafki w L (ustalone z uzytkownikiem): ramie w programie
liczy sie od frontu korpusu, nie od sciany — wzdluz sciany ramienia szafka
zajmuje odstep od sciany + glebokosc korpusu + ramie (np. 570 + 1200 = 1770).
Typowa narozna to 900 × 900 od rogu (ramie ok. 330). `cornerSpan` podaje oba
wymiary w uwagach i w karcie narożnika; front ramienia > `SZEROKI_FRONT`
(600) daje ostrzezenie z propozycja skrocenia ramienia (bez dzielenia frontu —
uzytkownik wybral samo ostrzezenie).

[AI-INFO] Powiekszanie rysunku (`ZoomBox`): 100% to rozmiar dopasowany do karty,
kroki liczone od tresci SVG (proporcja viewBox), nie od szerokosci elementu —
inaczej pierwszy krok skakal. Ramka ma `contain: inline-size`, bo bez tego
kolumna strony rosla pod rysunek i nie bylo czego przewijac. Pelny ekran to
nakladka `fixed inset-0` z `margin: 0` (odstepy miedzy kartami dokladaly
margines i spod nakladki wystawaly inne karty).
[AI-INFO] Kazdy rysunek pamieta powiekszenie i przewiniecie (`ZOOM_PAMIEC`,
klucz `resetKey` = zakres|widok|szafka, zyczenie uzytkownika: po powrocie do
widoku ma byc tak, jak zostawiono). Pamiec w module, do przeladowania strony.
Przewiniecie ustawia efekt po kazdym rysowaniu, dopiero gdy powiekszenie ramki
zgadza sie z docelowym (`poScroll.z`).
[AI-INFO] Ctrl + kolko nad rysunkiem przybliza rysunek w miejscu kursora (1–4×,
plynnie), zamiast powiekszac cala strone — wlasny nasluch `wheel` z
`passive: false`, bo React podpina kolko pasywnie i `preventDefault` by nie
zadzialal. Szczypanie na touchpadzie przychodzi jako Ctrl + kolko.

[AI-INFO] Rzut z gory w zakresie „ciag": ramie szafki w L, ktorego sciany nie
rysujemy, stoi w prawdziwym polozeniu — obrocone wzdluz drugiej sciany, z jej
kawalkiem. `AssemblyTopView` liczy macierz: uklad pasa ramienia (z `full`) →
rzut calosci → uklad rysowanego ciagu (`cudzeRamiona`), a kadr je obejmuje.
Wczesniej ramie bylo „dostawione" rozlozone za koncem ciagu (`armsIn`,
`dostawione`), kadr je ucinal, a plecy i wzmocnienie siegajace w rog nachodzily
na szafke narozna. Elewacja nadal uzywa dostawionych ramion z `armsIn`. Dostawione ramie
w elewacji dostaje blat swojego pasa (przesuniety o `u0 - u0Pasa`), a po
otwarciu — wzmocnienia z `armPlan`. W rzucie: blaty (`blatPasa`) i wymiary
rysuja sie w osobnych przebiegach po wszystkich szafkach i ramionach, zeby nic
ich nie zaslanialo; ramie ma w rzucie nozki, uchwyt i zawiasy pod „Pokaz okucia".

[AI-INFO] Blat w rogu „na styk": przechodzacy przez rog ma glebokosc
`rt.depth` (korpus + front + wysieg, a przy pelnym arkuszu 600), a nie
glebokosc szafek ciagu. `projectLayout` zapisuje w `topSpan.przez0/przez1`,
czyj blat przechodzi, a `runTop` skraca dojezdzajacy o roznice — wczesniej
oba blaty zachodzily na siebie o ok. 30 mm (w bryle jeden wystawal nad
drugim) i dojezdzajacy byl o tyle za dlugi w zamowieniu. `worktopSpans`
przycina odcinki do `rt.x0 … rt.x0 + rt.total`. Lyzwa (`cut: "skos"`) bez zmian.

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

[AI-INFO] Regula po audycie: zadna liczba okuc nie moze byc wpisana na sztywno,
jesli da sie ja wyprowadzic z wymiaru. Wzorzec jest wszedzie ten sam — para na
koncach plus jedna sztuka co ustalony odcinek, czyli
`Math.max(2, Math.ceil(dlugosc / skok))`. Skoki, ktore juz sa w kodzie:
trojkat pod cokolem co 300 mm, trojkat pod blatem co 400 mm w dwoch rzedach,
trojkat pod fixem ramienia co 400 mm w dwoch rzedach, wkret 4 x 30 do
katownika co 200 mm, konfirmat co 200 mm. Zawiasy (takze 165 stopni i lamane
90 stopni) licza sie przez `autoHinges(wysokosc, szerokosc)` — kazde skrzydlo
ze SWOJEJ wielkosci, wiec skrzydlo przy boku i skrzydlo na ramieniu moga miec
rozna liczbe zawiasow. Nogi licza sie przez `legPlan`, a klipsy cokolu to
`legs.xs.length`, czyli nozki przedniego rzedu.

[AI-INFO] Kazda pozycja okucia musi miec wpis w `DEFAULT_HW_PRICES` — inaczej
`hwDefaultPrice` zwraca 0 i wycena po cichu zaniza sume, bez zadnego
ostrzezenia. Klucz to `h.pk` albo `h.name`, wiec nazwa pozycji i klucz ceny
musza sie zgadzac co do znaku (takze co do spacji wokol znaku „x").

[AI-INFO] Grubosci plyty nie wpisujemy w kodzie. `bezWienca(cab, tf)` bierze ja
od wolajacego (`editItemCab` podaje material tej szafki drugim argumentem
callbacku), `migrateCab` z materialu projektu, a ostatnia deska ratunku to
`defaultMaterials.front.thickness`, nigdy goly literal 18.

[AI-INFO] Szafka narozna ze skrzydlami lamanymi ma DWA rodzaje zawiasow i
zaden z nich nie jest zwykly: pierwsze skrzydlo wisi na boku na zawiasie
165 stopni (nazwa pozycji „Zawias 165°", liczona w `computeGeo` przez
`skrzydlaLamane`), drugie wisi na pierwszym na „Zawias lamany 90°" liczonym
w `cornerArmParts`. W tym trybie ramie NIE dostaje zwyklej pozycji „Zawias" —
kiedys dostawalo i zawiasy liczyly sie podwojnie.

[AI-INFO] Fix ramienia przykreca sie od srodka na trojkaty meblarskie, tak samo
jak cokol bez nozek — nie na zadne osobne zlaczki. Wiersz jest podpisany
„fix ramienia", zeby odroznic go od trojkatow cokolu; zestawienie grupuje
pozycje po nazwie ORAZ opisie, wiec te dwa uzycia zostaja osobno.

[AI-INFO] Luz miedzy drzwiami musi byc parzysty, jesli luz brzegowy tez jest
parzysty. Pasmo frontu to szerokosc minus dwa luzy brzegowe, czyli liczba
parzysta; po odjeciu nieparzystego luzu srodkowego nie dzieli sie na rowno i
jedno skrzydlo wychodzi o milimetr szersze. Dlatego domyslny `gaps.between`
to 2, a nie 3 — przy 3 podpowiedz „drzwi roznia sie o 1 mm" wyskakiwala na
KAZDEJ swiezej szafce o parzystej szerokosci. Ten sam luz dziala miedzy
frontami szuflad, wiec jego zmiana rusza tez przyciecie podniesionych tylow. Testy, ktore licza szerokosc
frontu w rogu, musza brac `gaps.between` z projektu, a nie wpisywac liczbe.

[AI-INFO] Dane katalogowe (skrzynki V-BOX, minimalne wysokosci frontow) sa
podane dla plyty 18 mm. Innej grubosci nie blokujemy, ale `computeGeo` daje
wtedy ostrzezenie „Plyta inna niz 18 mm" — 99 procent projektow idzie na 18,
wiec to nie jest szum, tylko sygnal, ze liczby z katalogu wymagaja sprawdzenia.

[AI-INFO] Zestawienie okuc calego projektu (i wydruk) idzie przez
`scalOkucia` — JEDEN wiersz na produkt. Pozycja z polem `use` (krotki opis
zastosowania wraz z rozstawem, np. „cokol skrecany do korpusu (bez nozek),
po obwodzie co ok. 300 mm") laczy sie z innymi o tej samej nazwie, a opis
wiersza wypisuje wszystkie zastosowania z ich liczbami. Etykieta `use` NIE
moze zawierac wymiaru konkretnej szafki — inaczej wiersze znowu sie rozjada.
Pozycja bez `use` (prowadnice, lustra) zostaje osobno, bo tam inny opis
znaczy inny produkt do kupienia. Szczegoly z wymiarami zostaja w `spec` i
widac je w karcie pojedynczej szafki, ktora sie nie scala.

[AI-INFO] Dodajac nowa pozycje okucia: nadaj jej `use`, jesli ten sam produkt
moze wejsc w projekt z kilku powodow, i dopisz cene do `DEFAULT_HW_PRICES`.

[AI-INFO] `SLOWNIK.md` to sciaga: etykieta w aplikacji -> sciezka w danych ->
funkcja, ktora to liczy, plus dokladne nazwy formatek i okuc, kody szybkich
poprawek i spis, co pilnuje ktora suita. Zajrzyj tam ZANIM zaczniesz szukac
po calym `szafki.jsx` — szczegolnie przy narozniku, gdzie sa dwa rozne
katowniki i latwo trafic w niewlasciwy. Zmieniasz etykiete, pole albo nazwe
formatki — dopisz tam wiersz w tej samej zmianie.

[AI-INFO] Regula „minimum 2 na styku": kazdy styk dwoch plyt dostaje co
najmniej dwa laczniki, bo na jednym plyta sie obraca. Stad wzorzec
`Math.max(2, Math.ceil(dlugosc / skok))` wszedzie, gdzie liczymy zlacza —
konfirmaty korpusu i ramienia, trojkaty pod blatem i pod fixem (dwa rzedy,
kazdy z minimum dwoma), wkrety do katownika. Tam, gdzie licznik jest staly,
i tak wychodzi po dwa na styk: wkret 4 x 30 to 4 na wzmocnienie, czyli 2 na
kazdy koniec, a kolek podporowy to 4 na polke, czyli 2 na bok.

JEDYNY udokumentowany wyjatek: cokol skrecany bez nozek dostaje po JEDNYM
trojkacie na kazdy krotki bok (plus rzad wzdluz dlugiego co ok. 300 mm).
Wolno tak, bo cokol jest mocowany z trzech stron naraz — oba konce i dlugi
bok — wiec pojedynczy trojkat na koncu nie ma sie jak obrocic i calosc
zostaje sztywna. To nie jest przeoczenie: nie „poprawiaj" tego przy kolejnym
audycie. Kazdy nowy wyjatek wymaga takiego samego uzasadnienia z geometrii,
a nie samego „tak wystarczy".

[AI-INFO] Oba widoki 3D (bryla zabudowy `Assembly3D` z widokiem 45° i „3D",
oraz pojedyncza szafka `Scene3D`) rysuja przez wspolne `ulozSciany(solids,
proj)`. Nie sortuj scian po sredniej glebokosci — przy duzych plytach (blat,
dno ramienia) srodek lezy daleko i drobne elementy przy krawedzi wychodzily
na wierzch: paski wzmocnien na blacie, styk blatow w rogu, schowana
maskownica ramienia, znikajacy co drugi uchwyt. `ulozSciany` uklada cale
bryly: para, ktorej rzuty (wypukle obrysy) naprawde na siebie nachodza, jest
rozdzielona wzdluz ktorejs osi i ta os mowi, ktora jest dalej. Bryly, ktore
sie przenikaja (plecy w ostatnich 3 mm glebokosci korpusu, plecy we frezie),
rozstrzyga os najmniejszego zakladu. Sciany tylem do widza sa pomijane, poza
bryla polprzezroczysta (alpha < 0.5). Cien zalezy od kierunku sciany, nie od
jej pola na ekranie — inaczej waska maskownica w licu wygladala jak szpara.

`box(...)` w `Assembly3D` przyjmuje na koncu `tag` (np. „blat", „uchwyt",
„noga", „noga-ramie", „maska-korpus", „maska-ramie", „katownik"). Wielokaty
dostaja `data-el` i `data-b` (numer bryly), a `<svg>` — `data-cykle`, czyli
ile razy kolejnosc trzeba bylo wymusic. Suita `bryla3d` pyta przegladarke
(`elementFromPoint`), co lezy na wierzchu, i wymaga zera wymuszen z osmiu
stron. Dokladasz bryle, ktora ma byc widoczna — nadaj jej `tag` i dopisz ja
do testu.

[AI-INFO] Nozki ramienia liczy `armLegPlan(a)`: ramie stoi jak samodzielna
szafka swojej dlugosci — rozstaw z `legPlan({}, len)`, czyli para przy rogu,
para pod wolnym koncem i od 900 mm para posrodku (ramie 1200 = 6 nozek).
Przy rogu ramie mogloby sie oprzec na nozkach szafki naroznej (stoja 40-80 mm
za licem), ale uzytkownik wybral wlasna pare: ramie nie zalezy wtedy od tego,
jak stanie szafka obok. Z tej funkcji biora zamowienie (`cornerArmParts`),
elewacja zabudowy (`AssemblyView`), elewacja szafki naroznej (`FrontView`)
i bryla — wczesniej kazdy z tych widokow rysowal nozki po swojemu.

[AI-INFO] Recznie wpisana liczba nozek (`cab.legs.count`) mniejsza o dwie lub
wiecej od `autoLegs(W)` przy szafce od 900 mm daje podpowiedz z przyciskami
`|legs:<n>` — obsluguje je `NoteLine` przez `setLegs`. Jedna nozka na srodku
dna (liczba nieparzysta) tez sie liczy jako podpora, stad prog „o dwie".

[AI-INFO] „Wyslij do Claude" to opcja TYLKO do pracy na artefakcie wewnatrz
claude.ai — NIE na GitHub Pages i nie w standalone. Artefakt publikujemy
z `capabilities: {db: {}}`; strona pyta `window.claude.use("db")` i dopiero
gdy dostanie magazyn, pokazuje przycisk obok „Zapisz do pliku". Klikniecie
zapisuje dokument `projekt/biezacy` (stala `PROJEKT_DLA_CLAUDE`) z polami
`json` (caly projekt jak z „Zapisz do pliku"), `nazwa`, `szafek`, `wyslano`.
Claude czyta go narzedziem `ArtifactData` (akcja `get`, kolekcja `projekt`,
dokument `biezacy`) na adresie artefaktu MebloProjekt, zapisuje `json` do
scratchpada jako projekt do testow i NIE wrzuca go do repozytorium bez zgody
uzytkownika — to jego prywatny projekt.

Na GitHub Pages przycisku nie ma i nie bedzie: zapis do repozytorium
z przegladarki wymagalby tokenu GitHuba zaszytego w stronie, ktory kazdy
moglby z niej wyciagnac. Tam zostaje „Zapisz do pliku" i wklejenie tekstu
w rozmowie. Uwaga: artefakt z zadeklarowanym `db` jest widoczny tylko w
organizacji wlasciciela — nie da sie go udostepnic publicznym linkiem.
Suita `wyslij` sprawdza oba przypadki (bez magazynu przycisku nie ma,
z atrapa magazynu zapis ma pelny projekt).

[AI-INFO] Przeglad projektu uzytkownika jednym poleceniem:
`node testy/projekt.mjs <plik.json> [katalog-na-zrzuty]` (plik = dokument
z ArtifactData `projekt/biezacy` zapisany w scratchpadzie — skrypt sam wyjmie
pole `json`). Wypisuje ciagi i szafki, bledy/ostrzezenia kazdej szafki,
kolizje otwierania, audyt rysunek 3D ↔ formatki projektu i robi zrzuty
(3D, rzut z gory, elewacja). Wymaga serwera 5205 i swiezego buildu.

[AI-TODO] Rog ze zwyklymi szafkami (bez szafki w L) — na realnym projekcie
uzytkownika (zapowiedzial przyklad w artefakcie, 2026-09-28). Stan i pomysly,
zeby nie odtwarzac ustalen od nowa:
- Ustalone: slepa czesc szafki w rogu = glebokosc sasiada + jego front +
  `SLEPY_ZAPAS` 30 mm (u uzytkownika fix jest ok. 5 cm szerszy niz lico
  sasiada, 3 cm wystarcza). Wstawka w rogu: na boku szafki ciagu, ktory NIE
  wjezdza w rog (u uzytkownika w rog wjezdza sciana 2, wiec wstawka jest
  przy ostatniej szafce sciany 1); plaska 18 × 60 na wkrety 4 × 30 co 200,
  szeroka 60 licem na trojkatach (po 2 z kazdej strony), szeroka oklejona
  tylko od dolu. Szczegoly w BLEDY.md „Ustalone — nie ruszac”.
- ZROBIONE 2026-09-28 (pomysl 1): przycisk „Ustaw szafkę w rogu” (akcja
  `slepyrog:`) i kreator rogu przy „+ ciąg” (`utworzCiagZRogiem`) — fix na
  zaslonieta czesc, jedne drzwi, zawias od zewnatrz, uchwyt przy fixie,
  wstawka plaska. Gdy 18 mm nie wystarcza (np. uchwyt szafki w rogu na drodze
  skrzydla sasiada), zostaje kolizja z przyciskiem „Wstawka 60 mm”.
- Pomysl 2: zawiasy drzwi przy rogu domyslnie po stronie dalszej od rogu
  (skrzydlo otwiera sie od rogu) — dzis kolizje otwierania czesto znikaja po
  „Przełóż zawiasy”. Mozna to proponowac automatycznie przy dodaniu szafki
  na koncu ciagu przy rogu.
- Pomysl 3: „Luz w rogu” a wstawka — dzis sumuja sie (luz + wstawka). Na
  realnym projekcie sprawdzic, czy ktokolwiek uzywa luzu bez wstawki; moze
  luz powinien sam proponowac wstawke tej szerokosci.
- Pomysl 4: gorne ciagi w rogu — gorny ciag, ktory w rogu sie KONCZY (stoi od
  poczatku sciany), nie przesuwa sie sam; jesli wchodzi w rog, powie o tym
  tylko kontrola otwierania. Brak gornej szafki naroznej (L albo slepej
  z fixem) — temat na osobna rozmowe.
- Narzedzia do tego tematu: `testy/projekt.mjs` (przeglad), suity `otwier`,
  `narozn`, `wstawka`, `gorne`, `formatki` (audyt, scenariusze wstawki
  i gornych ciagow w L).

[AI-INFO] Klapy (2026-09-28): `col.klapa` "gora"/"dol" przy 1 drzwiach w kolumnie,
front typu "klapa" (nie "door") — dlatego wszedzie, gdzie kod filtruje
`d.type === "door"`, klapa jest pomijana celowo (formatka „Klapa” osobno,
zawiasy bez rozstawu na boku, bez skrzydla w kontroli otwierania; w kolizjach
klapa zamknieta liczy sie jako „front”). Dobor sily: `dobierzPodnosnik`,
tabela `GTV_PD_G00`. Suita `testy/klapy.mjs`.
[AI-TODO] Klapy — uzytkownik sprawdzi je sam w innym terminie (2026-09-28);
do tego czasu nie rozbudowywac bez pytania. PDF amortyzatora (PD-ECGDL)
dotarl i jest w `GTV_PD_ECGDL`. Karta PD-ECGDL podaje zgodny zawias barkowy
PD-MD-ZB, ale uzytkownik chce zwyklych zawiasow jak przy skrzydlach.
[AI-TODO] Klapy — czego jeszcze nie ma: plan wiercen dla zawiasow klapy
(na wiencu/dnie) i mocowan podnosnika na boku; kolizja otwartej klapy do gory
z gorna szafka/sufitem i opadanej z blatem; wsparcie klapy w szafce z kilkoma
poziomami w kontroli otwierania. Do omowienia z uzytkownikiem, gdy zacznie
uzywac klap na projekcie.

[AI-INFO] Audyt calosci: `testy/audyt.mjs` (ok. 4 min, sekwencyjnie). Hook
`audytBryly` zapisuje teraz tez obrys bryly na miejscu (`p`, po obrocie
skrzydla i ustawieniu ciagu w rogu) — po nim audyt szuka brył nachodzacych na
siebie. Nowy scenariusz = jedna linia `await scenariusz(...)`. Przypadki
czekajace na decyzje uzytkownika oznaczaj `znane` (regex), zeby suita byla
zielona, i opisz je w BLEDY.md „Do decyzji”.
[AI-INFO] Plecy za korpusem: `geo.plecyZa` / `geo.glebOdSciany`. W ukladzie
ciagu (odleglosc od sciany) uzywaj `glebOdSciany`, w geometrii szafki dalej
`carcassDepth` (formatki bokow sie nie zmieniaja). Szablon stojacej: 560.

[AI-INFO] Kontrola otwierania (2026-09-28): skrzydla (`swingHit`, cwiartka),
szuflady (`wysuwHit`, prosty wysuw na `d.nl` + uchwyt), klapy (`klapaHit`,
prostokat klapy z gruboscia frontu obracany co 1° wokol wewnetrznej krawedzi
— zwraca ostatni wolny kat). Przeszkody w `swingBodies`: korpusy, fronty,
uchwyty (`uchwytObrys`), wstawki, ramiona, maskownice, blat ciagu. Szuflady
i klapy nie sprawdzaja sie przeciw innym ruchom (nie otwiera sie naraz).
[AI-TODO] Sprzety w zabudowie (lodowka, piekarnik, mikrofala): gdy powstanie
kategoria „sprzety”, dolozyc ich bryly i drzwi do `swingBodies` — prosba
uzytkownika, zeby wrocic. Szafka luzem (bez ciagu) nie ma kontroli
otwierania — `openingMsgs` idzie po ukladzie ciagow.

[AI-INFO] Szafka w L: `CORNER_L_D` = 560 (jak stojaca), ramie 640. Pusty ciag
za rogiem liczy glebokosc od sciany z domyslnymi plecami HDF (`runFrontDepth`).
W uwagach i UI glebokosc ramienia = `armKorpus(a)` (bez plecow).
[AI-INFO] Polka przy wsporniku pionowym fixu: na cala szerokosc, plytsza o
wspornik (`c.shFront`/`c.shD`), kolki w bokach — tak ustalil uzytkownik.
[AI-INFO] Frez pod HDF (`cab.backGroove`) = frez od tylu na krawedzi bokow,
wienca i dna (w UI zawsze „frez”, nie „wręg” — prosba uzytkownika): `depth` 16 (z grubosci plyty), `offset` 3 (w strone drzwi, HDF
zlicowany z tylem), `play` 1 na strone. `backIntrusion = grOff`, HDF z0 =
cd - grOff. Stare {16, 4} bez `wreg` migruja w `migrateCab`. Suita `wreg`.

[AI-INFO] Audyt rysunkow 2D (`testy/audyt2d.mjs`): prostokaty SVG w jednostkach
viewBox przez getCTM, porownanie z rzutami `window.__audytBryl` (bryla samej
szafki, zamknieta i otwarta) oraz widoki „Ciąg” i „Zabudowa z góry” (uklad osi szukany wsrod obrotow).
Uchwyty na elewacjach rysuje `UchwytElewacja` (wspolny obrys `uchwytObrys`).
[AI-INFO] Szuflada V-BOX wg instrukcji (instrukcje/Folder-Szuflada-V-BOX-18mm-online.pdf,
str. 6): tyl rowno z gora boku, `tylOd` = bok - tyl (9-10 mm) nad dolem boku, dno
dochodzi do tylu. Podniesiony tyl: nie wyzej niz gora frontu szuflady (blad), nie
nizej niz bok, pod tym co wyzej z luzem BACK_CLEAR. Instrukcje trzymamy w `instrukcje/` (spis: `instrukcje/SPIS.md`).
[AI-INFO] Gorna szafka w L (2026-09-29): szablon `naroznikLgorny` (CORNER_LG_W/ARM),
narożnik pary gornych w `runLayout` tylko gdy przy rogu stoi szafka z `corner.on`
(`corner.gorny`, owner wg tego, gdzie stoi szafka w L), `pair.dosuniety` dosuwa
gorny ciag do konca dolnego, `gornyPodRamie` rysuje pusty gorny ciag pod ramie.
Zrobiony wariant A ponizej; B i reszta pytan — BLEDY.md „Do decyzji”. Suita `gornaL`.
[AI-INFO] Wariant B wzmocnienia tylnego i zawieszki zrobione 2026-09-29 (`postRects`,
`shNotch`/`polkaCzesci`, `geo.zawieszki`). Nowe miejsce rysujace katownik ma czytac
`geo.postRects`, nie liczyc polozenia samo. Dokladne wymiary otworow zawieszek — gdy
uzytkownik przysle karte zawieszki (wtedy do `instrukcje/`).
[AI-INFO] (historia) Gorna szafka narozna (uzytkownik 2026-09-28) — na wzor dolnej, te same
zasady (slepy rog z fixem/drzwiami/wstawka albo szafka w L z ramieniem). Roznice:
wieniec zamiast wzmocnien, dno widoczne od dolu, bez cokolu i blatu, gl. ok. 300.
Tylne wzmocnienie w tylnym narozniku — dwie opcje do wyboru w UI:
  A) jak w dolnej: na dnie, po kacie plyty;
  B) dwie plyty skrecone pod 90°, obrocone o 180° — kat prosty skierowany do
     srodka szafki (od zbiegu scian 1 i 2).
Zawieszki: przy A — jedna po lewej stronie „szafki” (korpusu), druga po prawej
stronie „ramienia”; przy B — dwie w czesci „ramienia” (na boku wzmocnienia i na
boku ramienia) albo analogicznie obie w czesci „szafki”.
[AI-INFO] Slupek (szablon) zostaje 600 w glab (uzytkownik 2026-09-28); glebsza
szafka w ciagu daje ostrzezenie, ze reszta odsunie sie od sciany (`runCabMsgs`).

[AI-TODO] Audyt 2D rogu (`audyt2d`, `tylkoInfo`): szafka w L w rogu juz scisle
(front i maskownica ramienia w pasie drzwi `pasFrontu`, uchwyt ramienia z
`UCHWYT_OD_KRAWEDZI`). Jako INFO zostaja roznice sposobu rysowania: w slepym
rogu elewacja ciagu nie pokazuje uchwytu szafki sasiada wystajacego z
przekroju; w U i gornych w L sasiad za rogiem jest na elewacji przekrojem
z krzyzem (bryla 3D „Ciąg” jest poprawna — sprawdzone zrzutem 2026-09-29).
Szafka w L sama z gory: rog bez boku odslania ~15 mm cokolu (ZNANE).

[AI-INFO] Rozkroj automatyczny (2026-09-29): `autoPlan` liczy `buildCutPlan` po
`ROZKROJ_ZWLOKA` (1 s; powyzej `ROZKROJ_DUZY` = 40 szafek — 5 s) od ostatniej zmiany
`rozkrojKlucz` = JSON calego wejscia rozkroju (formatki z wymiarami, iloscia,
plyta z kolorem, slojami, arkuszem blatu). Arkusz 2800 × 2100, okrawanie i rzaz sa
stale — gdyby staly sie ustawieniem, trzeba je dopisac do klucza. Mozliwy powod
przycinania — patrz BLEDY.md „Do decyzji”.
