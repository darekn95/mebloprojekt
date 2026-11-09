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
[AI-INFO] Po restarcie kontenera (2026-10-11) znikają `testy/vendorpkg`, `testy/cdn`
i zbudowane strony. CDN-y (unpkg, cdn.tailwindcss.com) są zablokowane przez proxy —
`testy/cdn/*.js` kopiuje się z `vendorpkg/node_modules`: `react/umd/react.development.js`
→ `react.js`, `react-dom/umd/react-dom.development.js` → `react-dom.js`,
`@babel/standalone/babel.min.js` → `babel.min.js`, `@tailwindcss/browser/dist/index.global.js`
→ `tailwind.js`. Serwer 5205 potrafi nie wystartować albo paść — przed pełnym
przebiegiem sprawdź oba porty (`curl …/mebloprojekt-app.html`, `…/standalone-local.html`)
i odpalaj go w pętli: `setsid nohup bash -c 'while true; do python3 -m http.server 5205;
sleep 1; done' &` (z katalogu `testy`). Masowe „name: 'Error'” w pełnym przebiegu =
`ERR_CONNECTION_REFUSED`, nie błąd aplikacji.

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

[AI-INFO] Od 2026-10-11 miarą kolizji skrzydła jest **kąt pierwszego styku**
(`swingKat`), a nie „ile mm wchodzi w przeszkodę” — ta odwracała ocenę (uchwyt
przy zawiasie: „brakuje 534 mm” przy otwarciu do 74°; uchwyt przed wolną krawędzią:
„mało”, a drzwi stają po 6°). Uwaga mówi o przeszkodzie, w którą skrzydło uderza
najwcześniej (`swingStop`). Przyciski (zawiasy, wstawka 18, wstawka 60, zawiasy + wstawka — lista opcji z wynikiem) są tylko, gdy pomagają
(`wynikPoprawki`: kolizja znika albo kąt rośnie o `POPRAWKA_KAT`); wstawkę
sprawdza się na kopii projektu z ustawioną wstawką (`zWstawka` w `openingMsgs`).

[AI-INFO] Wstawka w rogu (2026-10-11): pole jest w Strukturze wnętrza szafki
przy rogu (`rogWstawki` w App, `n.pair.przyRogu` w `runLayout`), ale dane zostały
w `run.corner.wstawka` ciągu z narożnikiem — z nich liczy się odsunięcie ciągu,
próba wstawki w kontroli kolizji (`zWstawka`) i kreator rogu. Gdy zmieni się
kolejność szafek, wstawka przechodzi na szafkę, która stanie przy rogu.
Szeroka: `mocowanie` (`trojkaty` / `konf` / `listwa`) przesuwa ją w głąb
(`odLica`) albo dokłada listwę (`listwa` w obiekcie z układu, rysunki i bryły).

[AI-INFO] Liczba zawiasow drzwi wg wagi frontu — zrobione 2026-10-16 z katalogu GTV
2023 (`instrukcje/Katalog-produktow-2023-...pdf`, s. 68 = PDF 70): `ZAWIASY_GTV`,
`zawiasyGtv`, `autoHinges(h, w, grub, szeroki)`. Klapa zostaje 2 / 3 od 900 mm.
Zlacza blatow (`runTopZlacza`): rog i laczenia kawalkow w prostym ciagu (ustalone).

[AI-INFO] Audyt GPT 2026-10-17 (ta sama galaz, N2–N21 i U3): wszystkie odtworzone
w aplikacji i poprawione (BLEDY.md, „Naprawione”); testy: `cutplan` (blat N2–N4, N15),
`audytgpt2` (reszta). Skrypt odtwarzajacy z przegladarki byl w scratchpadzie — wzorzec
w `testy/audytgpt2.mjs` (bryly przez `window.__audytBryl`, uwagi, tabele).
[AI-INFO] Audyt GPT N22–N68 (2026-10-17): suity `audytgpt3`, `audytgpt4`, `audytgpt5`;
komentarze z artefaktu — `komentarze1` (uzytkownik pozwolil robic je od razu, nie
dopiero na „realizuj komentarze”). Decyzje N42/N45/N49 w BLEDY.md („Ustalone”).
Zapis projektu ma `wersja` (PROJEKT_WERSJA), szafka `version` 5 — test seedujacy bez
nich dostaje dawne prostowanie (ceny netto, wzmocnienia), jak stary plik.
[AI-INFO] (2026-10-19) Paski u gory zwijaja sie przy przewijaniu w dol. `testy/pw.mjs`
wylacza to wszystkim testom (`window.__mpBezZwijania = true` w init script) — inaczej
klikniecie kafelka szafki po przewinieciu do karty nizej trafia w zwiniety pasek.
Test, ktory to sprawdza, wlacza je swoim `ctx.addInitScript` (jak `przewijanie`).
Nazwa sciany na pasku to przycisk `data-el="nazwa-sciany"` (nie `span`).
[AI-INFO] Podzial cokolu/blatu jest zwiniety za polem wyboru: testy klikajace styki
musza go najpierw rozwinac (`label[data-el^="podzial-"] input`, jak w `ciag4`).
[AI-INFO] `window.__audytBryl` ma teraz takze `v` (wierzcholki, zaokraglone) — do brył
nieprostopadlosciennych (blat na lyzwe).
[AI-INFO] Audyt GPT (2026-10-16, galaz `gpt/audyt-2026-10-16`, plik `AUDYT_GPT.md`):
B1, B2, B3 odtworzone i poprawione, U1 poprawione; U2 (waski podglad) — nie ruszane.

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
90 stopni) licza sie przez `autoHinges(wysokosc, szerokosc, grubosc)` — kazde skrzydlo
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

[AI-INFO] (2026-10-29) Rog ze zwyklymi szafkami SPRAWDZONY na projekcie uzytkownika
(pomieszczenie 1: „Ściana 2” wjezdza w rog za koncem „Ściana 1”, „Szafka 1 c2” 1095 z fixem
611 i drzwiami 480 z zawiasem od zewnatrz, wstawka plaska przy „Szafka 3”, ktorej drzwi maja
zawias od strony dalszej od rogu): bez bledow i kolizji, formatki = bryla. Poprawiony tylko
opis „ciąg … kończy się N mm przed rogiem” (bylo „zaczyna się … od rogu” przy rogu na koncu
ciagu). Pomysl 2 ponizej jest w praktyce zrobiony przez „Ustaw szafkę w rogu”; zostaja 3 i 4.
[AI-INFO] (ZAMKNIETE 2026-10-29, uzytkownik: „zamykamy wszystkie tematy poza szafka skosna i sprzetami”)
Rog ze zwyklymi szafkami (bez szafki w L) — na realnym projekcie
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
[AI-INFO] (2026-10-29) Klapy — uzytkownik: „wstepnie wytestowane”. Podnosniki /
amortyzatory rysowane na otwartej klapie (elewacja „Otw.”, ciag, 3D) — `d.podnosniki`,
`podnosnikOdcinek`, `podnosnikBryly`. Rozbudowa: uzytkownik 2026-10-29 „nie dodajemy nic” z listy
(podnosnik gazowy krotki, mechaniczny Easy Up, waga uchwytu w sile, rozworka do klapy w dol) —
nie proponowac ponownie bez nowej potrzeby.
[AI-INFO] (ZAMKNIETE 2026-10-29) Klapy — uzytkownik sprawdzi je sam w innym terminie (2026-09-28);
do tego czasu nie rozbudowywac bez pytania. PDF amortyzatora (PD-ECGDL)
dotarl i jest w `GTV_PD_ECGDL`. Karta PD-ECGDL podaje zgodny zawias barkowy
PD-MD-ZB, ale uzytkownik chce zwyklych zawiasow jak przy skrzydlach.
[AI-INFO] (2026-10-16) Plan wiercen dla zawiasow klapy JEST („zawias klapy” w wiencu/
wzmocnieniu albo w dnie) — poprzedni wpis byl nieaktualny (wytknal to audyt GPT).
[AI-INFO] (2026-10-17) Klapy — braki z poprzedniego wpisu zrobione: mocowania
podnosnika / amortyzatora w planie wiercen (stale `PODNOSNIK_*`, `AMORTYZATOR_*`,
`KLAPA_*` wg instrukcji GTV, s. 3 obu PDF), sufit z ciagu gornego jako przeszkoda
w kontroli otwierania. Gorna szafka i blat juz byly przeszkoda (gorna jest plytsza,
klapa dolnej otwiera sie przed nia); klapa w szafce z kilkoma poziomami dziala
(kazda klapa to osobny ruch, fronty i uchwyty innych poziomow to przeszkody).
[AI-INFO] (2026-10-17) Decyzje uzytkownika o klapach — w BLEDY.md „Ustalone”
(„Montaz podnosnika i amortyzatora”, „Zawias polnakladany”): strona jednego
podnosnika `col.podnosnikStrona`, polka na drodze podnosnika tylko w jego
zasiegu (akcja `polkicof:`), wpuszczana 25 + grubosc frontu, zawias polnakladany
osobno (`hingePol`). Wspornik przy fixie zostaje z wariantem szafki.

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
[AI-TODO] (2026-10-19, na pozniej — prosba uzytkownika ze zdjeciami kuchni; 2026-10-29: DUZO POZNIEJ, po sprzetach) Szafka
narozna SKOSNA: front pod katem 45° w rogu, dolna (pod zlewem) i gorna (wiszaca).
Ze zdjec: obrys korpusu to pieciokat; jedne drzwi ramiakowe na skosie (dolna —
uchwyt na gornej ramie, gorna — na dolnej); po obu stronach drzwi waskie paski
w kolorze frontow pod katem 135° (czola bokow albo maskownice); blat ma na rogu
odcinek przedniej krawedzi pod 45°, zlew okragly z ociekaczem w rogu; cokol idzie
skosem; obok z lewej kolumna 3 szuflad, z prawej drzwi; gorna od spodu — dno
pieciokatne, widoczny bok przy okapie.
Projekt (szkic): nowy rodzaj narożnika ciagu obok „szafki w L” i slepego rogu.
Pola: A (wzdluz sciany 1), B (wzdluz sciany 2), glebokosci D1/D2 (z ciagow: 560
dolne, 300 gorne). Obrys (0,0) (A,0) (A,D1) (D2,B) (0,B); skos z (A,D1) do (D2,B),
dlugosc √((A−D2)² + (B−D1)²) — 900×900×560 → ok. 481 mm, 600×600×300 → ok. 424 mm.
Ciagi zaczynaja sie za A i za B (jak przy szafce w L). Formatki: dno, wieniec/
wzmocnienia i polki — pieciokat zamawiany jako prostokat A×B ze scietym rogiem
(A−D2)×(B−D1), oklejany na skosie; 2 boki D×H; plecy na obie sciany (A i B − t);
1 front na skos; cokol — odcinek skosny z polaczeniami 135°; blat — skos przedniej
krawedzi na rogu, oklejenie skosu. Okucia: zawias katowy 45° GTV (HCKT hydrauliczny
kat. s. 79–80, KT kat. s. 90) na boku, jesli drzwi wisza na boku pod 135°.
Bryla 3D i rzut z gory: pryzmy z wierzcholkow (`v` w `__audytBryl`, jak `plytaSkos`
przy lyzwie). Kontrola otwierania: `swingLeaf` dziala na osiach — dla skosu trzeba
cwiartki obroconej o 45° (uchwyty szuflad obok — realna kolizja). Pytania do
uzytkownika w BLEDY.md („Do decyzji” — Szafka narozna skosna). Zdjecia (za zgoda
uzytkownika): `zdjecia/naroznik-skosny/` z opisem `OPIS.md`.
[AI-INFO] (2026-10-21) ZROBIONE ponizsze TODO — szuflady DXS-3D Synchro. Jak to dziala:
`drawer.system === "dxs"` (bez pola = V-BOX); w `computeGeo` kolumna szuflad woła dla
takiej szuflady `szufladaDxs` (zamiast galezi V-BOX) — wspolne zostaja fronty, pas,
luzy i NL z przeszkod (`maxNlFor(..., lista)`). `dr.bokOd/dnoOd/gora` sa w obu
systemach i z nich korzystaja rysunki (nie `vboxGora(dr.rail.h)` — tego nie dodawaj
w nowych miejscach). Rysunki prowadnic: `szufladaOdCzola`, `szufladaZGory`,
`szerWnetrzaSzuflady`; bryla: `skrzynkaBryly` (galaz `sk.system === "dxs"`); wysuw:
`wysuwSzuflady` (B z `DXS.wysuw`). Zmiana systemu: `zmienSystemSzuflady` /
`naSystemSzuflad`; uwagi: w `computeGeo` (dwa systemy w szafce) i `szufladyMsgs`
(ciag/pomieszczenie), akcje `szufsys:` itd. przez `runFix`. `audytwierc` ma
scenariusze tylko V-BOX (sprawdza otwory i boki metalowe) — plan wiercen DXS
sprawdza suita `dxs`.
[AI-INFO] (2026-10-20, szkic sprzed budowy — zrobione 2026-10-21, wyzej) Szuflady na prowadnicach
dolnego montazu, obok V-BOX. Szkic: przy kolumnie szuflad wybor systemu („V-BOX” /
„dolny montaż”); skrzynka z plyty — formatki boki, przod, tyl, dno (oklejanie
gornych krawedzi), wymiary wg karty prowadnicy (szerokosc skrzynki = swiatlo minus
luz z karty, dno wpuszczone, tyl skrocony / z wycieciem, otwory na zaczepy); okucia:
komplet prowadnic + zaczepy na szuflade; NL z listy dlugosci z karty (jak `VBOX.nl`);
plan wiercen: prowadnica na boku korpusu (otwory od dolnej krawedzi i od przodu),
skrzynka (wyciecie i otwor w tyle); kontrola wysuwu i luzu nad skrzynka jak przy
V-BOX; bryla 3D i rysunki skrzynki z plyty. Katalog GTV (kat. s. 128–135):
Modern Slide Pro, 0SHX-18 3D, 0SHX, GCHX18-H, push to open (Modern Slide Pro, 0FPO18),
G10HX-H — pytania w BLEDY.md („Do decyzji”), przed liczbami z karty sprawdz, czy
instrukcja montazu jest w `instrukcje/`.
[AI-INFO] (2026-10-21) Uzytkownik wybral Sevroll DXS-3D Synchro (miekki domyk) —
instrukcja montazu w `instrukcje/Katalog-Akcesoria_PL_2026_online-skompresowany (1).pdf`,
s. 112 (rysunek obrazem 144 dpi, liczby warstwa tekstu: `pdftotext -f 112 -l 112 -layout`),
wyciag w `instrukcje/SPIS.md`.
[AI-INFO] (2026-10-21) DXS-3D — odczyt rysunku s. 112 (powiekszenia: `pdftoppm -r 400 -x … -y …`;
obraz ma 144 dpi, wiec wiecej szczegolow nie bedzie). Pewne z liczb na rysunku:
bok szuflady 18, od boku korpusu do wnetrza szuflady 24,5 → miedzy bokiem szuflady
a bokiem korpusu 6,5; prowadnica pod dnem szuflady, przy boku, przykrecona katownikiem
do boku korpusu (dwa rzedy wkretow co 12); dno szuflady miedzy bokami, 10–12 nad ich
dolna krawedzia; 27 = od spodu prowadnicy do spodu dna; 2 (min.) = od dna korpusu do
spodu prowadnicy. Tabela A/B: A = dlugosc czesci na korpusie (250…380 — przy NL 600
tylko 380!), B = wysuw (200…570). Otwory prowadnicy NL 600 od krawedzi korpusu:
10, 19, 28, 37 | 60, 69 | 165 | 243, 252, 261 | 275, 284 | 339 (z wymiarow 4, 37, 9, 32,
128, 96, 64, 78), przod prowadnicy 4 mm za krawedzia. Niepewne: 37 (do wierzchu dna albo
do gornego rzedu wkretow — na rysunku ta sama wysokosc; jesli wierzch dna, to dno 10 mm),
ktore otwory przykrecac i ile wkretow, otwory dla krotszych NL (tylko rysunek bez liczb),
front wpuszczany (22 / X / 2), tyl skrzynki (⌀6 × 10, 11 i 7 — od ktorych krawedzi;
33 i max 12), zaczep przedni (min. 75 — od czego), otwory ⌀2 pod sprzegla (s. 113, bez
wymiarow), bok 16 / 19 (SKW = LW − 45 / − 51 to tylko wniosek z 6,5 mm luzu), co jest
w komplecie. Brak w instrukcji: luz nad skrzynka, z czego i jak skrzynka (przod/tyl
miedzy bokami?, grubosc i mocowanie dna), polozenie frontu wzgledem prowadnicy.
[AI-INFO] (2026-10-21) DXS-3D — odpowiedzi uzytkownika na powyzsze sa w BLEDY.md
(„Ustalone” → Szuflady DXS-3D Synchro): „37” = gorny rzad wkretow, X = grubosc frontu,
tyl do spodu dna (bok − 10), dno na konfirmaty przez boki, 33 = szerokosc prowadnicy,
75 od boku dna wolne, komplet = wszystko. Najwazniejsze dla planu wiercen: kreska
spodu prowadnicy na boku + odsuniecie od czola (4 / X + 4), bez otworow.
Zrzut z zaznaczonym „37” byl w scratchpadzie sesji (pdftoppm s. 112, -r 300,
-x 150 -y 950, opisy ImageMagick `convert -draw/-annotate`).
[AI-INFO] (2026-11-04) Sprzety w zabudowie — etap 1 zrobiony: piekarnik i mikrofala jako rodzaj
kolumny „Sprzęt” (`col.sprzet`, opis `opisy/sprzety.md`), bryly i drzwi w `swingBodies`.
Szafka luzem (bez ciagu) nadal nie ma kontroli otwierania — `openingMsgs` idzie po ukladzie ciagow.
[AI-INFO] (2026-11-05) Lodowka w kolumnie zrobiona: typ „Lodówka” — front slizgowo / na stale /
bez frontu (wolnostojaca we wnece), 1 albo 2 fronty (dolny z pola). Decyzje uzytkownika 2026-11-05:
mocowanie do wyboru, takze bez frontu („wolnostojąca lodówka może stać sama we wnęce pomiędzy bokami
lub bokiem a ścianą lub w ogóle wolnostojąca”); „1 albo 2, podział z pola”; zmywarka — „Cokół ciągu
idzie dalej”; plyta i zlew — „Nad szafką, z przesunięciem” (wyciecie na srodku wybranej szafki,
typowo 50 mm od przodu blatu, pola przesuniecia).
[AI-INFO] (2026-11-05) Plyta i zlew zrobione: wyciecia w blacie roboczym ciagu (`cab.blatWyciecia`),
opis w `opisy/sprzety.md`. Tylko blat roboczy ciagu (nie wlasny blat szafki); kawalek z lyzwa w rogu
rysuje sie w 3D bez otworu (`plytaSkos`).
[AI-INFO] (2026-11-05) Sprzet w ciagu zrobiony: `cab.sprzetCiagu` (zmywarka / lodowka wolnostojaca),
`computeGeo` → `geoSprzetuCiagu` (`geo.bezKorpusu`) — geometria z pustej szafki tej szerokosci, bez plyt
korpusu, okuc i wiercen. Kazde nowe miejsce, ktore pyta o korpus szafki w ciagu (wieniec, plecy,
wieszanie, scalanie), musi pominac `bezKorpusu`; lodowka wolnostojaca liczy sie jak slupek
(`lodowkaCiagu`: poza blatem, bez wspolnych wymiarow ciagu, cokol z przerwa `rp.segmenty`).
Pod wycieciem w blacie (2026-11-05): kontrola nachodzenia w `worktopMsgs` (bryla do `podBlatem`),
lezace wzmocnienie — przyciski stojace / z wycieciem (`rail.podWyciecie`), laczniki przestawiane
(`lacznikiWzmocnienia`). Od 2026-11-06 wzmocnienia poziome, czolowe i tylne sa na konfirmatach (2 na koniec,
plan wiercen), pionowe i z wyborem „Wkręty 4 × 30” na wkretach. Przy przegrodzie (2026-11-08, poprawione tego
samego dnia): przesuniecie konfirmatow z obu stron NIE DA SIE SKRECIC po kolei (uzytkownik) — domyslnie trojkaty
(`trojkatyNaKoncu`), ostrzezenie z przyciskami „Prawa na 1 konfirmacie” (`przyPrzegrodzie`, `montazKolejnosc`),
„Przegroda niższa” (`przegrodaNizsza`, jedna formatka nad przegroda), dwie przegrody (wspolne / osobne dna),
„Tak zostaje”. [AI-INFO] Zasada w AGENTS.md: kazde laczenie sprawdzac pod katem kolejnosci montazu.
Na pozniej: sprzet w poziomie kolumny (odcinku), wiersz sprzetu w zamowieniu (teraz poza zamowieniem).

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

[AI-INFO] Audyt 2D rogu (`audyt2d`, `tylkoInfo`), stan 2026-10-11 — zostaje tak (decyzja użytkownika, BLEDY.md „Ustalone”): slepy rog i szafka
w L w rogu przechodza scisle; „szafka w L sama z gory — 15 mm cokolu” juz nie wystepuje
(wyjatek ZNANE zdjety). Zostaje tylko widok „Ciąg” (elewacja jednej sciany), gdy szafka
z sasiedniej sciany stoi przed koncem tej sciany (rog „wjezdza” sasiad: U z trzech
scian, gorne ciagi w L): elewacja jej nie rysuje (gorne w L) albo rysuje przekrojem
z krzyzem (U) — bez jej boku, uchwytu i nozek. Bryla 3D „Ciąg”, rzut zabudowy, formatki,
okucia i kontrola kolizji sa poprawne; to tylko rysunek elewacji.

[AI-INFO] Rozkroj automatyczny (2026-09-29): `autoPlan` liczy `buildCutPlan` po
`ROZKROJ_ZWLOKA` (1 s; powyzej `ROZKROJ_DUZY` = 40 szafek — 5 s) od ostatniej zmiany
`rozkrojKlucz` = JSON calego wejscia rozkroju (formatki z wymiarami, iloscia,
plyta z kolorem, slojami, arkuszem blatu). Arkusz 2800 × 2100, okrawanie i rzaz sa
stale — gdyby staly sie ustawieniem, trzeba je dopisac do klucza. Mozliwy powod
przycinania — patrz BLEDY.md „Do decyzji”.

[AI-INFO] Warstwa „Pomieszczenia” ZROBIONA 2026-09-29 (opis w SLOWNIK.md, pasek
„Pomieszczenia”; zasady w BLEDY.md „Ustalone”). Niezmiennik: ciagi polaczone rogiem
(`corner.of`) albo pietrem (`wall`) sa zawsze w jednym pomieszczeniu — pilnuje tego
loadProject (migracja), `makeRun(runs, roomId)`, kandydaci rogu i kreator (tylko
ciagi pomieszczenia) oraz `przeniesCiagi` (cala `grupaCiagow`). Dzieki temu
`projectLayout(project).info` moze laczyc uklady pomieszczen bez kolizji kluczy.
Pierwotny plan (dla porownania):
Projekt → Pomieszczenia → ciagi/sciany → szafki. Decyzje uzytkownika: istniejace
projekty otwieraja sie jako „Pomieszczenie 1”; rozkroj i wycena domyslnie dla
calego projektu (jedno zamowienie), podglad pomieszczenia osobno; usuwanie
pomieszczenia z szafkami — zawsze pytanie: usun z szafkami albo przenies do innego.
Zakres: `project.rooms`, `run.roomId`, `item.roomId` (szafka w ciagu dziedziczy po
ciagu), wybor pomieszczenia nad paskiem ciagow („+ pomieszczenie”, „Cały projekt”),
Zabudowa/rogi/kolizje/blaty tylko w obrebie pomieszczenia (`drawableRuns`,
`projectLayout`), formatki/produkty/wycena z przelacznikiem pomieszczenie/calosc,
uwagi pomieszczenia + licznik bledow w innych, PDF z rozdzialami na pomieszczenia
i zbiorczym zamowieniem, nowa suita, migracja starych projektow. Nazwa w UI:
„Pomieszczenie” („Zabudowa” zajeta przez widok).

[AI-INFO] Analiza brakow kontroli (2026-10-04). Wczesniejsze audyty sprawdzaly
konstrukcje i wnetrza osobno, na szafkach wpisanych recznie z wiencem i dnem —
bledy wychodzily na skrzyzowaniach (szuflady pod blatem bez wienca, wspornik pod
wzmocnieniem, NL przy plecach z plyty, klapa bez wienca). Stad dwa nowe audyty:
`audytmacierz` (konstrukcja × wnetrze × skrajne wymiary) i `audytzabudowa`
(kuchnia skladana przyciskami, tak jak robi to uzytkownik). Zasada na przyszlosc:
nowa konstrukcja albo nowy rodzaj wnetrza = nowy wiersz w `KONSTRUKCJE`/`WNETRZA`
w `audytmacierz.mjs`, a nie osobny test na jednej szafce. Oczekiwane bledy (np.
klapa w dol bez dna) idą do mapy `OCZEKIWANE`, nie do wyjatkow w sprawdzeniach.
Pomocnik `symwysuw.mjs` wymaga kolorow rol plyt (K/F/P) — bez nich nie odrozni
frontu od korpusu i zwraca 0 szuflad (patrz `audytzabudowa`, ustawianie `mat`).
[AI-INFO] Zrobione 2026-10-04 (decyzje uzytkownika): szafka w L z kreatora bierze
glebokosc sasiedniej sciany, pusty ciag dolny — glebokosc ciagu obok albo 560,
blat roboczy 38 na bokach miesci sie w H (BLEDY.md „Ustalone”).

[AI-INFO] Druga runda braków kontroli (2026-10-04, zgłoszenie użytkownika: brak blatu
w widoku szafki, zlane fronty z boku, wysuw, tył szuflady). Wnioski:
- audyt porównujący 2D z 3D nic nie da, jeśli obie strony mają ten sam brak (blat nie
  istniał ani w 2D, ani w 3D samej szafki) — dlatego `audyt2d` sprawdza też wprost,
  że blat ciągu jest w 3D szafki pod blatem;
- tolerancje w audytach chowały błędy: „pas frontów ze szczelinami do 4 mm” przepuszczał
  zlane fronty — przy nowej tolerancji zawsze napisz, jaki błąd mogłaby schować;
- scenariusze audytów brały szafkę wolnostojącą z wieńcem; szafka, którą robi
  użytkownik (pod blatem, z parą wzmocnień), musi być w każdym audycie — wzór bierz
  z aplikacji („+ ciąg”, „+ szafka”), nie składaj ręcznie;
- test losowych edycji (`losowe`) znajduje kombinacje, których nikt nie wypisał
  (HDF we frezie × pod blatem) — przy nowej opcji dopisz ją do `ZMIANY` w `losowe.mjs`.
[AI-INFO] Geometria skrzynki V-BOX w pionie — zrobione 2026-10-05 (niżej).

[AI-INFO] Skrzynka V-BOX w pionie (2026-10-05). Rysunki w folderze V-BOX są
schematyczne: pomiar wektorów dał 22,5–32,5 mm dla tej samej wielkości — nie mierz
z nich. W skali są tylko otwory frontu (32 / 47,5) na rysunku „Front do szuflady
80 mm” i tam góra boku wypada 95 mm nad dołem prowadnicy = min. front. Stąd
`vboxGora/vboxOdProw/vboxDno` liczone z tabel `VBOX.minFront.overlay` i `VBOX.backH`.
Użytkownik sam zwrócił uwagę, że bok stoi na górnej części prowadnicy — przy
wątpliwościach co do okuć pytaj o pomiar prawdziwej szuflady.

[AI-INFO] Napisy rysunków szafki w PDF (2026-10-21, audyt GPT PDF-1). W druku
`FrontView`/`RearView`/`TopView` dostają `druk` (szerokość widoku w mm) i liczą
skalę napisów `kz` (`drukKUkladu`); CSS `PRINT_CSS` powiększa każdy `<text>` w
`.rp-widok` o `--k` od jego zaczepienia. Zasady przy nowym napisie w tych widokach:
- **nie dawaj `transform` na `<text>`** — w druku CSS `transform` go nadpisuje
  (obrót znikał); obróć grupę `<g transform=…>`, a napis zostaw bez atrybutu;
- napis w środku płyty/frontu: `style={kz > 1 ? { "--k": kNapisu(kz, txt, fs, wolneMiejsce) } : undefined}`,
  drobny (16–18): `kMaly`; opis wymiaru z innym powiększeniem: `DimH`/`DimV` `kd`;
- nowa kolumna wymiarów przy szafce: `kolumnaDruk(szerEkranu, liczbaZnakow, kz)`
  w `uklad(kz)`, inaczej w druku wejdzie na sąsiednią;
- na ekranie `kz === 1` i każda zmiana układu ma iść gałęzią `kz > 1`;
- sprawdzenie: `node testy/pdfczytelnosc.mjs` (z `PROJEKT=` na projekcie użytkownika),
  podgląd zrzutów widoków z druku — pomocnik w scratchpadzie sesji (`pdfzrzut.mjs`:
  wydruk przechwycony w `window.print`, `.print-only` wklejone w body, zrzut `.rp-widok`).

[AI-INFO] Audyt szuflad przez interfejs (2026-10-21, zgłoszenie użytkownika po
DXS-3D). `testy/audytszuflad.mjs` klika jak użytkownik i po każdym kroku sprawdza
Uwagi, formatki ↔ 3D, kolizje skrzynek i frontów, wysuw (`symwysuw`), wzmocnienia
spod blatu i resztki ustawień klapy. Cały przebieg ok. 5 min — przy poprawkach
puszczaj wybrane scenariusze: `TYLKO=D,O PELNE=1 node testy/audytszuflad.mjs`.
Na co uważać przy pisaniu nowych scenariuszy:
- poziomy w Strukturze są od góry (`[...geo.levels].reverse()`), kolumny od lewej —
  `wStrukturze(nazwa, odDolu, title, odGory)` liczy od końca albo od początku listy;
- dane wpisane wprost do localStorage (`doZapisu`) omijają `editLevels`, więc para
  wzmocnień spod blatu nie przechodzi sama do górnego poziomu — buduj poziomy z nią
  w górnym albo klikaj przyciski;
- „błąd” w audycie przy ręcznie ustawionym układzie, który zawsze jest zły (np. 3 V-BOX
  w połowie szafki pod blatem), to poprawna uwaga aplikacji, nie błąd — taki stan
  albo testuj jako oczekiwany błąd, albo nie ustawiaj go.

## Makieta „Dodaj” (2026-11-08)

[AI-INFO] `makiety/dodaj.html` — osobna strona bez obliczen (artefakt https://claude.ai/artifact/5m43AjCMCw141KoT2AypyJ),
nie podlaczona do aplikacji ani do GitHub Pages. Zakladki „Dodaj” po lewej, paleta AGD z lista i opisem „Co zrobi
program”, rysunek ciagu (blat z gory + widok z przodu) po prawej; przeciaganie wskaznikiem (mysz i palec, `pointer*`),
na telefonie „dotknij sprzet, potem miejsce”, „Przesuń” dla postawionego. Uzgodnienia z uzytkownikiem: jedna wspolna
makieta, najpierw AGD, potem „klocki” (szafka z miniaturami wzorow, polki, drzwi/klapy, szuflady, przegroda,
wzmocnienie — „budowa jak dla amatora”); w aplikacji zakladka AGD pod karta „Płyty”, stare miejsca zostaja.
[AI-INFO] Wersja 2 (uwagi uzytkownika 2026-11-08): sciana z szerokoscia (pole, ±100, „wolne N mm” / „brakuje N mm”,
„Poszerz ścianę do …”, „Usuń …”), koniec ciagu = cale wolne miejsce, „+” przy stykach i podglad, gdzie stanie sprzet,
waska szyna zakladek z ikonami (wiecej miejsca na rysunek).
[AI-INFO] Wersja 3 (2026-11-08): wymiary sprzetu do wyboru (`ROZM`: plyta 30/60/80/90, zlew 1 komora / z ociekaczem /
2 komory, piekarnik 60 / kompakt 45, mikrofala 38/45, lodowka 178/122, zmywarka 60/45, wolnostojaca 60/70/90), w slupku
sama mikrofala / sam piekarnik na wysokosci blatu, oba — piekarnik nizej (700), „Zamień miejscami”, wlasna wysokosc
(`a.y0`, ±50, „Na wysokość blatu”), przelaczniki „AGD i zlew” (wylaczone: wyciecia i puste wneki), „Ciąg górny”,
„Ciąg dolny” (zawsze jeden widoczny).
[AI-INFO] Wersja 4 (2026-11-08): okap (`OKAP`: podszafkowy / teleskopowy / wklad / kominowy, 50/60/90, odleglosc od
plyty z wymiarem, min. 650 nad indukcja — EN 60335-2-31 wg instrukcji Solgaz, gaz 750; przycisk „Szafka nad okapem
krótsza, dół na …” / „Okap wyżej”), rzut szafek gornych (320) i okapu na blat z gory przy „Ciąg górny”, „Pod blat”
w slupku (gora sprzetu rowno z blatem) i ostrzezenie o wysokiej mikrofali (`MIKRO_MAX` 1300 — prog ustalony z uzytkownikiem
2026-11-08; uzytkownik: „kiedyś będzie musiało być ostrzeżeniem w aplikacji głównej”). Zapis: localStorage
(`makieta-dodaj-v1`) + „Wyślij do Claude” / „Wczytaj wysłaną” — artefakt z `db`, dokument `makieta/biezaca`
(pola `json`, `uwagi`, `kiedy`, `okno`, `zaznaczony`). Odczyt: `ArtifactData get` (collection `makieta`, doc
`biezaca`), potem wczytac stan do makiety lokalnie (localStorage przed zaladowaniem) i zrobic zrzut w szerokosci `okno`.
[AI-INFO] Wersja 5: w slupku „Góra do dołu szafek górnych” (gora wneki = dol szafek gornych 1400 — polka nad sprzetem
w linii den szafek gornych, doly frontow w jednej linii; przerywana linia na rysunku), drugi sprzet zjezdza pod spod.
To samo trzeba bedzie miec w aplikacji (wnęka w słupku: dół / pod blat / na wysokość blatu / do dołu szafek górnych).
[AI-INFO] Wersja 6: kazda zmiana wysokosci w slupku przez `ustawWys` — drugi sprzet, ktory by nachodzil, sam zjezdza
pod spod / nad (przerwa 35); „Razem” (`slupek.razem`) — piekarnik i mikrofala jako blok z polka 18 miedzy nimi,
przesuwane razem (kotwica: dolny sprzet); „Zamień miejscami” zostawia dol bloku na miejscu.
[AI-INFO] Wersja 7: okap na dowolnej wysokosci (pole „dół okapu”, ±50, „= dół szafek górnych”, „650 nad płytą”;
przy okapie w szafce / pod szafka przesuwa sie dno szafki nad nim — `gorne[id].y0`, kominowy — sam `a.y0`).
[AI-INFO] Wersja 8 — klocki (uzytkownik 2026-11-08: „budowa jak dla amatora”): zakladki Szafka / Półki / Drzwi i klapy /
Szuflady / Przegroda / Wzmocnienie. Szafka: miniatury `WZORY` (1 drzwi 450, 2 drzwi 800, szuflady 600, zlewowa 800,
slupek 600) przeciagane w ciag jak zmywarka (grupa „ciag”). Pozostale klocki (`KLOCKI`, grupa „szafka”) upuszczane na
korpus: polka +1 (max 6), przegroda, wzmocnienia (`q.wzm`: lezace / stojace / pionowe, „para pod blat”), front
(`q.front`: drzwi1 / drzwi2 / klapaG / klapaD / otwarta), szuflady (`q.drawers`, `q.szuflDrzwi` — zastepuja front,
pelne szuflady kasuja polki i przegrode). Bez celow: szafki ze sprzetem we wnece (front ustawia program), szuflady
i wzmocnienia pod blat w slupkach, polki/przegroda w pelnych szufladach. Karta szafki (dotknieta szafka, w kazdej
zakladce, tez w AGD): szerokosc, front, polki −/+, przegroda, wzmocnienia, „Co zrobi program”, „Przesuń w ciągu”,
„Usuń szafkę”. Przelacznik „Fronty” (wylaczony — wnetrze); na zakladkach polek, przegrody i wzmocnien wnetrze widac
samo. Szafke przesuwa sie przeciagnieciem korpusu (`.szaf`, typ `szafkaPrzes`).
[AI-INFO] Wersja 10 (uwagi uzytkownika 2026-11-08): zmywarka wolnostojaca (`zmywarkaW`, 60/45, „Pod blatem” — pokrywa
zdjeta, ok. 815–820, blat nad nia / „Z własną pokrywą” — ok. 850, blat konczy sie przy boku; cokol ciagu z przerwa,
bez frontu meblowego). Plyta i zlew: pola wymiarow z karty modelu (`a.wym` nadpisuje `ROZM`, wybor rozmiaru wraca do
typowych): plyta — szklo sw × sd, kaseta z elektronika kw × kd, wyciecie ww × wd, wysokosc h od wierzchu blatu
(typowo 51–54, slim 44 — Samsung / Electrolux Slim-Fit, z okapem w plycie 150–230, np. Samsung CC90H84 217);
zlew — rant, wyciecie, glebokosc komory (typowo ok. 200, np. Franke UBG 611-78: 780 × 500, wyciecie 760 × 480,
komora 220). Wyciecie 50 od przodu blatu. Kontrole w makiecie: wyciecie plyty szersze niz wnetrze szafki, kaseta
wieksza niz wyciecie, szklo / rant nie zakrywa wyciecia, za malo blatu z tylu, kaseta / komora pod blatem a lezace
wzmocnienie, szuflady (> 30 mm pod blatem), polka pod zlewem, plyta gleboka (> 120). Widok z przodu: kaseta i komora
przerywane pod blatem (pomaranczowe, gdy cos przeszkadza).
[AI-INFO] Wersja 11 (uzytkownik 2026-11-08, „opcja 2, ale z głębokością kasety — przy kontroli nachodzenia dzieją się
cyrki”): plyta bez pola wyciecia — wyciecie = kaseta + `WYC_LUZ` (3 mm z kazdej strony, przykladowo, do potwierdzenia);
pola: szklo, kaseta szer. × glab., kaseta w dol od wierzchu blatu. Karta pokazuje wyciecie i polozenie kasety w blacie
(od przodu 53, do tylu, w dol / pod blat) oraz uwage przy stojacym wzmocnieniu. Zlew bez zmian (wyciecie z szablonu).
[AI-INFO] Wersja 12 (uwagi uzytkownika 2026-11-08): luz wyciecia 3 mm ustalony. Przelacznik rodzaju zabudowy
(„przełącznik rodzaju”, a nie pelne pomieszczenia — te przyjda z aplikacji): Kuchnia / Szafa (bez blatu) / Szafka
wolnostojaca; kazdy rodzaj ma swoj uklad (`rodzaj`, `inne`), wlasne wzory (`WZORY[k].rodz`), szafa bez AGD, blatu
i ciagu gornego, szuflady w szafie na dole (220) pod drzwiami, klocek „Drążek na wieszaki” (`q.drazek`); wolnostojaca
bez sciany, na nozkach, wysokosc `q.h`. Zakladki „Dodaj / zmień”, przypiete przy przewijaniu, podswietlenie po
najechaniu tylko przy myszy (na dotyku zostawalo), „Szuflady” nad „Półkami”, klocek „1 szuflada”. Zlew z ociekaczem —
ociekacz z lewej / z prawej. Szafki gorne klikalne: `gorne[id] = { y0, front, polki, przegroda, brak }`, karta (dol od
podlogi, front, polki, przegroda, „Bez szafki górnej”), klocki (polki, przegroda, fronty) upuszczane tez na gorne.
Lodowki: wolnostojaca — w × h × d + luzy (boki 50, nad 100, tyl 50 — typowo), miejsce = w + 2 × luz, „wystaje przed
blat”; do zabudowy — wneki 88/102/122/140/158/178/194 (178 typowo), wlasna wysokosc wneki, front slizgowo / na stale /
bez frontu, 1 albo 2 fronty (wysokosc dolnego), zawiasy L / P (symbol otwierania — wierzcholek po stronie zawiasu).
Plyta i zlew: polozenie na blacie — od poczatku blatu (lewy koniec odcinka) do lewej krawedzi wyciecia i od przodu
(`a.przes` od srodka szafki jak w aplikacji, `a.odPrzodu`), wymiar na rzucie z gory, kontrole: poza wnetrzem szafki,
< 50 od poczatku / konca / tylu blatu, nachodzenie albo < 50 miedzy wycieciami.
[AI-INFO] Wersja 13: „Szuflada + drzwi” — szuflada u gory (170) albo na dole (200, `q.szuflDol`), w reszcie 1 albo
2 drzwi (`q.drzwiIle`, domyslnie 2 przy szer. > 500); we wnetrzu polki i przegroda tylko w strefie drzwi, skrzynka
szuflady w swojej strefie (wczesniej rysowala sie jedna szuflada na cala szafke).
[AI-INFO] Wersja 14 (uwagi uzytkownika 2026-11-08): okienko „Co zmienić?” — dotkniety element nie pasuje do otwartej
zakladki (np. szafka przy „AGD”, gorna przy „Szufladach”) → lista zakladek (+ sprzet w szafce), wybor przelacza
zakladke; sprzet dotkniety poza AGD — od razu AGD. W zakladce Szafka listy „Ciąg dolny” i „Ciąg górny” (zaznaczona gorna
— jej lista pierwsza, „×” = bez szafki gornej), pola calego ciagu gornego (dol / gora, `ciagGorny` w zapisie; `GORNE0`,
`GORNE` sa teraz zmienne). Wysokosc korpusu slupka (`q.h`, „= równo z górnymi”, wlasna, do 2200). Slupek ze sprzetem:
strefy „Pod sprzętem” / „Nad sprzętem” (`q.strefy.dol/gora`: front, szuflady, polki) — klocki upuszczane na strefy
i przyciski w karcie. Polki w kolumnach przy przegrodzie (`polkiL`, `polkiP`; kolumna z miejsca upuszczenia). Lodowka
podblatowa do zabudowy w ciagu jak zmywarka (`lodowkaP`, wneka typowo 820 × 600 × 550 — Bosch KU22LVFD0, Smeg U8L080DE)
i lodowka do zabudowy w szafce dolnej (wneka „82 pod blat”, boki do podlogi, bez dna, kratka w cokole); wolnostojaca
„na równo z meblami” (Kitchen Fit: ok. 2,5 mm z boku, 15 nad, uchwyty z zestawu, szafka nad nia). Rzut szafek gornych
na blacie nie lapie dotkniec (plyta pod nim byla nieklikalna). W panelu AGD lista „W projekcie” na dole, opcje wyzej.
[AI-TODO] Pomysl uzytkownika do rozwazenia przy scalaniu makiety z aplikacja (2026-11-08): przelacznik „Tryb: makieta /
zaawansowany” — makieta (przeciaganie, klocki, proste karty) i tryb zaawansowany (obecna aplikacja), na tych samych
danych projektu.
[AI-INFO] Wersja 15 (uzytkownik 2026-11-08: wysokosci polek „teraz: przeciąganie”): polke we wnetrzu chwyta sie
i przesuwa w gore / dol (co 10 mm, najmniej 60 od sasiednich, 40 od dolu / gory strefy); `pozPolek[k]` (k: "" / L / P)
od dolu strefy polek, dziala w szafkach dolnych, gornych i strefach slupka; przy zaznaczonej szafce wymiar przy polce;
„Półki po równo” w kartach; zmiana liczby polek wraca do rownych odstepow. W aplikacji polozenia polek juz sa — przy
scalaniu przeciaganie ma pisac w nie (rzedy otworow, swiatlo).
[AI-INFO] Wersja 16 (uwagi uzytkownika 2026-11-09): uchwyty polek i szuflady tylko w zaznaczonej szafce (inna najpierw
sie zaznacza — obraz nie skacze w trakcie przeciagania). „Szuflada + drzwi”: szuflade przeciagasz pod / nad drzwi
(`szuflDol`), linie podzialu — wysokosc szuflady (`szuflH`, 100–400, „Szuflada typowa” wraca do 170 / 200). Jedna
„Lodówka” w palecie AGD (`lodowkaM`: slupek / szafka dolna albo miejsce w ciagu) i „Rodzaj lodówki” w karcie (jak okap):
do zabudowy w slupku / podblatowa w szafce / podblatowa w ciagu / wolnostojaca / na rowno z meblami — `zmienLodowke`
przestawia miejsce (slupek 600 albo szafka 600 z wneka w miejscu pozycji ciagu i odwrotnie).
[AI-TODO] Przy scalaniu makiety z aplikacja (uzytkownik 2026-11-09): w makiecie domyslnie WSZYSTKIE widoki jak
w aplikacji — zamkniety, otwarty, z boku, z gory, 3D — z funkcji rysujacych aplikacji, na tych samych danych (nie
budowac ich osobno w makiecie przed scaleniem).
[AI-INFO] Wersja 17 (uzytkownik 2026-11-09: „zawsze wybieramy, co chcemy zmienić, i aktywne tylko to, co wybrane”):
karta szafki / gornej pokazuje tylko czesc otwartej zakladki (Szafka i AGD — cala; Szuflady, Drzwi i klapy, Polki,
Przegroda, Wzmocnienie — swoja), polki chwyta sie tylko w zakladce Polki, szuflade tylko w Szufladach. Pojedyncze
klikniecie tylko zaznacza (nie odznacza); szafka spoza zakladki (np. przy AGD) — w panelu wybor „Co zmienić?”;
dwuklik / podwojne dotkniecie (wlasne wykrywanie — rysunek przerysowuje sie miedzy kliknieciami) albo prawy przycisk —
okienko „Co zmienić?”. Dwuklik na polce — okienko swiatla: najnizsza od dna szafki (dno 18), wyzsza od polki ponizej
(polka 18); etykiety przy polkach pokazuja swiatlo (↕).
[AI-INFO] Wersja 18 (uzytkownik 2026-11-09): przeciagana polka najechana na polke innej szafki (albo drugiej kolumny,
w promieniu 45 mm) staje na tej samej wysokosci od podlogi (bez zaokraglania do 10), linia pomocnicza „równo” przez
caly rysunek; kazda narysowana polka ma `.polkaV` z polozeniem (data-yy, x0, x1). W aplikacji: to samo jako wyrownanie
do polek sasiednich szafek (te same rzedy otworow).
[AI-INFO] Wersja 19 (uzytkownik 2026-11-09: „luz z boku każdy — raczej z lewej, z prawej i od tyłu”): lodowka
wolnostojaca ma luz z lewej (`lL`) i z prawej (`lP`) osobno (stary `lb` czytany jako oba), miejsce w ciagu = lL + szer.
+ lP; lodowka stoi od lewego luzu; na rysunku obrys miejsca (przerywany) i wymiary luzow w szczelinach (z boku pionowo,
nad lodowka poziomo), z gory obrys miejsca z luzem z tylu. „Na równo z meblami” — 3 / 3 / 15.
[AI-INFO] Wersja 20 (uzytkownik 2026-11-09: „brakuje mikrofali wolnostojącej i ekspresu do zabudowy i wolnostojącego”):
ekspres do zabudowy (`ekspres`, wneka 45 w slupku; typowo 560 × 450 × 550, front 595 × 455 — np. Electrolux KKK994500T),
mikrofala wolnostojaca (`mikrofalaW`, 20 / 23 / 25 l, np. Teka 20 l 440 × 258 × 340) i ekspres wolnostojacy (`ekspresW`,
24 / 22 cm, np. De'Longhi Magnifica Evo 240 × 360 × 440) — grupa „stoi”: na blacie nad szafka dolna / zmywarka, bez plyty
i zlewu nad nia; karta mowi, ile zostaje do szafki gornej. Slupek miesci do 3 sprzetow (`stosSlupka`, kolejnosc
`q.kolejnosc`, „Zamień miejscami z: …” z sasiadem).
[AI-INFO] Wersja 21 (uzytkownik 2026-11-09): przegroda przesuwana — `przegX` = swiatlo lewej kolumny (brak = srodek,
kolumna min 100, co 10 mm, ±15 od srodka przyciaga na srodek); uchwyt na przegrodzie w zakladce Przegroda przy zaznaczonej
szafce (dolne, gorne `g:id`, strefy slupka), dwuklik — okienko lewa / prawa; w karcie pola „Kolumny — światło” i
„Przegroda na środek”. Polki w kolumnie z drazkiem przeciagane jak inne (`polkiDom`: najwyzsza 300 pod gora, drazek 60 pod
nia jedzie za nia, reszta co 400/n na dole; „pod drążkiem ↕N”). Wysokosci szuflad (`szuflWys`, od dolu): w szafie linia
nad najwyzsza przesuwa granice drzwi (drzwi min 300), miedzy szufladami — zmienia obie sasiednie; min 100, co 10; dwuklik
na linii — wysokosc frontu; „Szuflady po równo / typowe (po 220)”. Wolnostojace: „Szafa” 800 × 2000, 5 polek, 2 drzwi,
cokol w obrysie (`cokolObrys`: boki do podlogi, dno na cokole 100, nozki za cokolem — jak tryb „w obrysie” w aplikacji,
`h` = wysokosc calkowita) i „Biurko” 1200 × 750 × 600 jak szablon „Biurko” w aplikacji (blat 18 na bokach, 50 na boki,
30 do przodu, bez dna / plecow / drzwi / nozek; tylko szerokosc i wysokosc, bez klockow).
[AI-INFO] Wersja 22 (uzytkownik 2026-11-09, odpowiedz o biurku: „zostaje jak jest, ale wzmocnienie od tyłu pod blatem na
wysokość 30 cm od góry dla stabilizacji” + „z kontenerem szuflad”): biurko ma wzmocnienie z plyty z tylu miedzy bokami
(albo bokiem i kontenerem), od spodu blatu do 300 mm od wierzchu blatu (`BIURKO_WZM`; odczyt „30 cm od góry” = dol
wzmocnienia 300 od wierzchu — do potwierdzenia przy aplikacji). „Biurko z kontenerem”: kontener szuflad pod blatem zamiast
boku (`kontener` L / P, `kontW` 400 / 450 / 500, `kontSz` 2–4), w karcie biurka przelaczniki i „Miejsce na nogi”.
Kolejnosc: bok(i) / kontener ze wzmocnieniem, potem blat od spodu.
[AI-INFO] Wersja 23–24 (uzytkownik 2026-11-09):
- wzmocnienie biurka to PLYTA 300 mm wysokosci, wewnatrz miedzy bokami, od blatu w dol (poprawione z „dol 300 od wierzchu”);
  laczenie z bokami do wyboru `wzmLacz`: konfirmaty + zaslepki (domyslnie) / kolki z mimosrodami;
- szuflady: chwyta sie cala szuflade (gorna polowa — linia nad nia, dolna — pod nia), dwuklik — jej wysokosc; w okienku
  „Ta szuflada typowa / jak po równo” zmienia TYLKO te szuflade (karta: „po równo” dla wszystkich); szuflady kontenera
  biurka tez (`kontD`, wl „k:id”);
- najwyzsza polka: w okienku drugie pole „Światło od góry (do wieńca)”, przy drazku napis „↕N od góry”;
- wymiary szafki w zakladce Szafka: z przodu prawa krawedz — szerokosc, gorna — wysokosc (nie dolna w kuchni — pod blat),
  z gory przod — glebokosc (`q.gl`, domyslnie dolna 560 / slupek, szafa, biurko 600 / wolnostojaca 450); pola „własna”
  w karcie; zielone znaczki na rysunku;
- BLAD naprawiony: przypiety rysunek byl wyzszy niz okno (krotki ciag wolnostojacych, ekran ~830 px) — dol (szuflady,
  podloga) byl niedostepny; teraz `dopasujRysunek()` ogranicza wysokosc rysunku do okna.
[AI-INFO] Lista brakow makieta <-> aplikacja: `makiety/BRAKI.md` (2026-11-09). Ustalone z uzytkownikiem: makieta bedzie
osobnym trybem aplikacji z dwoma poziomami — prostym i szczegolowym; w szczegolowym wszystkie funkcje aplikacji.
[AI-INFO] Tryb makiety w aplikacji — krok 1 (2026-11-09): przelacznik „Makieta prosta / szczegolowa / Techniczny” w naglowku
(stan `tryb`, `mp-tryb`), `MakietaWidok` (zakladki, karta do odczytu, rysunek z `AssemblyView` / `AssemblyTopView` z `onPick`,
wolnostojace `MakietaWolnostojace`), listy pomieszczenie / ciag / szafka / widok (`Rozwijana`). Techniczny bez zmian (domyslny).
Opis: `opisy/makieta.md`, test `testy/makieta.mjs`. Artefakt MebloProjekt publikujemy jako `$SP/MebloProjekt.html` = naglowek
z poprzedniej wersji (tytul + ziarno projektu na pustym magazynie, do `<div id="root">`) + `testy/mebloprojekt-app.html`.
Nastepne kroki: uchwyty na rysunku (wymiary, polki, przegroda = szerokosc kolumny, szuflady = fronty), karty z polami, paleta,
AGD (`makiety/BRAKI.md` D).
[AI-INFO] Tryb makiety — krok 2 (2026-11-09): uchwyty na rysunku zapisuja prawdziwe dane (szer./wys. z przodu, glebokosc
z gory, polka → `shelfTargets`, przegroda → `col.w`, linia szuflad → `drawers[].front`; ostatnie na auto), pola W/H/D w karcie,
„… po rowno”, domyslnie ciag zaznaczonej szafki. Opis `opisy/makieta.md`, testy `makieta.mjs`, `makieta2.mjs`.
[AI-INFO] Tryb makiety — krok 3 i 4 (2026-11-09): widok jak w makiecie „Dodaj” (z gory nad widokiem z przodu, przelaczniki
„Z gory / Ciag gorny / Ciag dolny / Fronty” — `Przelacznik`, `mp-mak-przel`; „Tylko zaznaczona szafka”; pytanie o wysokosc
w ciagu i w narozniku — `testy/makieta3.mjs`). Krok 4: przyciski w `MakietaKarta` (fronty, uchwyt / tip-on, szuflady 1–5,
polki ± i drazek, kolumny 1–4, cokol i nozki, blat ciagu). Ciag: cokol przez `setRunShared` (`run.plinth` + szafki — inaczej
uwaga „Cokol tej szafki nie zgadza sie z ciagiem”), blat przez `setRun` (`wedlugCiagu`, wspolny wieniec off) — oba
przekazane z `App` jako prop `ciag`. Test `testy/makieta4.mjs`. Nastepne: paleta i klocki (krok 5), AGD i szczegolowa (krok 6).
[AI-INFO] Tryb makiety — krok 5 (2026-11-09): zakladka „Dodaj” = `MakietaPaleta` (`MAK_PALETA` — szablony aplikacji i brakujace
z makiety jako szablon + `mod`; `MAK_KLOCKI`). HTML5 drag and drop na `[data-el=makieta-rysunek]` (cel z `elementFromPoint` +
`punkt` jak uchwyty) albo klik. `addCabinet(tplId, runId, opcje)` ma teraz `opcje`: `zmien`, `nazwa`, `wymiaryCiagu`, `przed`
(indeks w items; nie dla naroznikow), `naGorny`. Widok (uzytkownik 2026-11-09): „Duzy rysunek” — prop `skala` w AssemblyView /
AssemblyTopView (svg o stalym rozmiarze), okno `mak-plotno` z przewijaniem; karta chowana klikiem w otwarta zakladke (`mp-mak-karta`);
bez wiersza „Ciag” w karcie. Test `testy/makieta5.mjs`.
[AI-TODO] Paleta makiety: brak „Biurko z kontenerem” (kontener szuflad zamiast boku, plyta wzmacniajaca 300) i „Szafa z szufladami”
(dwa poziomy: szuflady na dole + polki) — do zrobienia razem z szablonem Biurka w aplikacji (TODO wyzej).
[AI-INFO] Ustalone z uzytkownikiem 2026-11-09: od teraz poprawki makiety robimy W APLIKACJI (artefakt MebloProjekt, tryb makiety);
artefakt „Makieta „Dodaj”” (`makiety/dodaj.html`) zamrozony jako wzor wygladu i obsugi — nie wyrownujemy go z aplikacja.
[AI-TODO] Aplikacja glowna, szablon „Biurko” (uzytkownik 2026-11-09): dolozyc plyte wzmacniajaca z tylu (300 mm wysokosci,
miedzy bokami pod blatem; laczenie do wyboru, domyslnie konfirmaty + zaslepki — lby na zewnatrz boku; przy kontenerze
konfirmat od srodka kontenera, przed wlozeniem szuflad) i wariant z kontenerem szuflad.
[AI-TODO] W aplikacji glownej lodowka wolnostojaca ma dzis jeden luz z boku (50) — przy scalaniu: z lewej / z prawej osobno.
[AI-TODO] W aplikacji glownej (gdy dojdziemy do sprzetu): zmywarka wolnostojaca jako pozycja ciagu (dzis jest tylko
do zabudowy z frontem); wyciecia w blacie maja dzis tylko wyciecie w × d + „Pod blat (od wierzchu)” — dolozyc szklo /
rant i kasete szer. × glab. × w dol (bryla pod blatem = kaseta, nie obrys wyciecia; wyciecie plyty = kaseta + luz),
zgodnie z polami makiety.
[AI-TODO] Ustalone z uzytkownikiem 2026-11-08: makieta AGD i klocki gotowe do ogladania (v8; uzytkownik oglada i przysle
uwagi przez „Wyślij do Claude”), potem w aplikacji nowy widok obok Zamk./Otw. — przód ciagu + blat z gory — z przelacznikami „AGD i zlew”
(nazwa ustalona 2026-11-08: „Wyposażenie”), „Ciąg górny” (domyslnie widoczny) i „Ciąg dolny”.

[AI-TODO] Pomysl uzytkownika na pozniej (2026-11-08): makieta jako tryb w aplikacji glownej — drag and drop zamiast
wyklikiwania, polaczony w obie strony z karta szafki. Zasada: makieta NIE ma wlasnych danych — to drugi widok
i edytor tego samego `project` (`project.runs[]`, szafki), akcje klockow wolaja te same funkcje co karta (ta sama
historia Cofnij/Ponów, te same uwagi i kontrole). Podzial: makieta — uklad i budowa z grubsza (co gdzie stoi,
szerokosci, fronty, polki, sprzet), karta — szczegoly (luzy, okucia, laczenia, wiercenia, material). Trudne miejsca:
cel upuszczenia = konkretna kolumna / poziom, a nie cala szafka; akcja uproszczona nie moze kasowac szczegolow
(fronty per poziom, podzial kolumny) — wtedy pytanie albo odeslanie do karty; narozniki, ramiona, kilka scian,
ciag gorny. Kolejnosc: 1) widok przod ciagu + blat z gory w stylu makiety (juz ustalony) — tylko podglad,
2) przeciaganie sprzetu i przesuwanie szafek, 3) klocki na kolumny / poziomy, 4) karta w makiecie = skrot do pelnej.