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
| `pins2` | 2 BLAD: kołki i etykiety w dwóch kolumnach | do zdiagnozowania |
| `pdf` | crash: `page.goto("file://./report.html")` — względny `file://` | usterka testu |
| `savetest` | szuka `http://127.0.0.1:5199/preview-local.html`, którego nikt nie buduje | usterka testu |
| `d2test`, `fixbtn` | timeout `locator.click` na przycisku, którego nie ma | usterka testu |

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
| 2026-09-27 | `luzy` | podpowiedź o luzie pojawia się przy nierównym podziale; test ustawia luz 3 mm wprost | 3d2690b |

## Do decyzji użytkownika

(pusto)

## Pomysły / optymalizacja

- Podpowiedź „Zrób jedne drzwi na … mm” (`cornerdoor:` w `runCornerMsgs`) jest prawie
  nieosiągalna, odkąd drzwi przy rogu same dopasowują się do lica — do uproszczenia
  albo usunięcia (niepilne, nic nie psuje).

- Zapamiętywanie powiększenia rysunku osobno dla każdego widoku (pomysł użytkownika).
- Sprzęty wystające poza lico (zmywarka, piekarnik) i kontrola otwierania przy nich.
