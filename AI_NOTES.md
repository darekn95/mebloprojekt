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

## Kontrola otwierania skrzydeł

[AI-INFO] `swingBodies` / `openingMsgs` w `szafki.jsx` liczą kolizje otwierania
w układzie całej zabudowy (`projectLayout`), a nie pojedynczej szafki. Skrzydło to
ćwiartka koła o promieniu równym szerokości frontu, wokół osi zawiasów; przeszkodą są
korpusy, ramiona, fronty zamknięte, fronty szuflad wysunięte na długość prowadnicy
i uchwyty. Pole „wysunięcie z lica" jest tylko pozycją szafki — sprzęt wystający poza
lico dostanie osobną opcję i wtedy dołoży się tu jako kolejna bryła.

[AI-INFO] Jeśli terminal agenta nie może pobrać aktualnego `claude-zmiany.txt` z GitHuba, można użyć workflow `Promote Claude Changes`. Workflow działa na GitHubie: kopiuje `claude-zmiany.txt` do `szafki.jsx`, uruchamia build Vite jako walidację, regeneruje `standalone.html`, commituje wynik na gałąź i od razu publikuje GitHub Pages. To jest potrzebne, bo push wykonany przez `GITHUB_TOKEN` nie uruchamia kolejnego workflowu Pages automatycznie.
