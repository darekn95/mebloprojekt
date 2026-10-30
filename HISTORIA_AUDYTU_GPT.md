# Historia audytu GPT — przekazanie do nowej rozmowy

Aktualizacja: 30.10.2026. Projekt: https://github.com/darekn95/mebloprojekt. Aplikacja: https://darekn95.github.io/mebloprojekt/.

## Gdzie jest historia i aktualna lista

- [Raport audytu i lista otwartych zgłoszeń](AUDYT_GPT.md) na gałęzi `gpt/audyt-2026-10-16`.
- [Pełne wcześniejsze opisy N69–N149 i wyniki retestu 28.10](https://github.com/darekn95/mebloprojekt/blob/f1ed73df1da6fd4f559fe8a328200f5ae3599468/AUDYT_GPT.md). Starsze wersje można odnaleźć w historii Git tego pliku.
- [BLEDY.md na main](https://github.com/darekn95/mebloprojekt/blob/main/BLEDY.md) — deklaracje zespołu o poprawkach i decyzjach. Deklaracja poprawki nie zastępuje niezależnego retestu.
- [Szybki test regresji](SZYBKI_TEST_GPT.mjs) — uruchamia zestaw z aktualnej kopii repozytorium; gałąź audytu ma starszy kod i nie należy jej używać jako wersji aplikacji do weryfikacji.

## Dotychczasowe ustalenia

29.10 retest objął starsze przypadki N69–N139. Z aktywnej listy usunięto N69–N138 na podstawie wcześniejszych i późniejszych sprawdzeń. W szczególności N117 (dobór wkrętu), N122 (przesunięcie nóżki) i N132 (oddzielne fronty ramienia) przeszły sprawdzenia funkcji. N139 to zaakceptowane ograniczenie: szuflada bez podparcia prowadnicy przy ramieniu jest zgłaszana jako niemożliwa do montażu, a nie automatycznie naprawiana. Nie jest to gwarancja wszystkich kombinacji ani wszystkich widoków.

W wykonanej 29.10 części testów funkcji do N139 było 50 OK, 0 błędów, około 1 sekundy w lokalnym środowisku z adapterem parsera JSX. Testy funkcji nie zastępują sprawdzenia 3D, interfejsu i PDF.

N140–N149 były pozostawione w raporcie bez retestu na prośbę użytkownika. 30.10 w aktualnym `main/BLEDY.md` są opisane jako naprawione, jednak GPT **nie przeprowadził jeszcze niezależnego retestu tych dziesięciu zgłoszeń**. Przed zmianą statusów powtórzyć przypadki z raportu na aktualnym kodzie i zapisać wyniki, rozróżniając naprawę od ostrzeżenia lub ograniczenia.

PDF-1: czytelność drobnych wymiarów i podpisów wydruku A4 wymaga sprawdzenia na aktualnym PDF. Poprzednio oceniany plik pochodził z 21.10; według `BLEDY.md` zmieniono część podpisów rozkroju, ale aktualny wydruk nie został sprawdzony przez GPT.

## Co dalej

1. Ustalić aktualne SHA kodu `main` i wersję wdrożonej aplikacji.
2. Uruchomić szybkie testy i odtworzyć N140–N149, w tym odpowiednie widoki, formatki, zamówienie i walidacje. Nie twierdzić, że coś naprawiono bez dowodu.
3. Sprawdzić aktualny PDF, najlepiej z reprezentatywnego projektu; ocenić czytelność w skali A4.
4. Uaktualnić `AUDYT_GPT.md` na gałęzi audytu: usunąć lub oznaczyć zweryfikowane poprawki, zachować nierozstrzygnięte przypadki i historię Git.

## Dostęp do ekranu

Użytkownik chce podglądu całego monitora oraz wyskakujących okien. Obsługa komputera i rozszerzenie Chrome były na jego zrzutach włączone. Próby otwarcia natywnego okna Chrome 30.10 zostały automatycznie zatrzymane, ponieważ system nie mógł z wystarczającą pewnością rozpoznać bieżącego adresu przeglądarki. Nie ustalono przyczyny ani nie potwierdzono, że ustawienie CDP rozwiązuje problem. W nowym czacie można ponowić próbę dostępu zgodnie z dostępnymi narzędziami; alternatywa to przesłany PDF lub zrzut ekranu.

Nie publikować prywatnych projektów użytkownika w publicznym repozytorium. Historia i przykłady w repozytorium powinny opierać się na danych syntetycznych.

