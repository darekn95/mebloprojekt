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

(pusto)

## Ustalone — nie ruszać

- Artefakt na claude.ai **nie** potrzebuje pobierania plików (tylko wersja na
  GitHubie). „Wyślij do Claude” jest **tylko** w artefakcie. Szczegóły w `AGENTS.md`.

## Pomysły / optymalizacja

- **Zrobione 2026-09-27:** zapamiętywanie `computeGeo` i `runTop` (niezmienne
  obiekty projektu jako klucz). Pomiar na 24 szafkach w 3 ciągach (mediana
  czasu od zmiany szerokości do narysowania): Szafka/Zamk. 53→33 ms,
  Zabudowa/Zamk. 62→38 ms, Zabudowa/Z góry 47→33 ms, Zabudowa/3D 62→41 ms;
  obrót 3D 53→44 ms. Pełny przebieg testów zielony przed i po zmianie.
  Warunek: nikt nie zmienia szafki, materiałów, projektu ani wyniku w miejscu.
- Podpowiedź „Zrób jedne drzwi na … mm” (`cornerdoor:` w `runCornerMsgs`) jest prawie
  nieosiągalna, odkąd drzwi przy rogu same dopasowują się do lica — do uproszczenia
  albo usunięcia (niepilne, nic nie psuje).

- Powiększenie rysunku: po przełączeniu widoku i powrocie ma wrócić takie, jakie
  było (powiększenie i miejsce), a nie „Dopasuj” (życzenie użytkownika).
- Sprzęty wystające poza lico (zmywarka, piekarnik) i kontrola otwierania przy nich.
