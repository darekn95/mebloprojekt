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
| `narjedne` | 2 BLAD: brak podpowiedzi „Ustaw jedne drzwi …”, szerokość NaN | prawdopodobnie błąd aplikacji — w toku |
| `nozki` / `nozkistd` | 2 BLAD: wysokość nóżki pod cokołem w obrysie i pod korpusem w elewacji | do zdiagnozowania |
| `polkigr` | 2 BLAD: światło szuflad 249/242 zamiast 250/241 | do zdiagnozowania (1 mm) |
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
| 2026-09-27 | `luzy` | podpowiedź o luzie pojawia się przy nierównym podziale; test ustawia luz 3 mm wprost | 3d2690b |

## Do decyzji użytkownika

(pusto)

## Pomysły / optymalizacja

- Zapamiętywanie powiększenia rysunku osobno dla każdego widoku (pomysł użytkownika).
- Sprzęty wystające poza lico (zmywarka, piekarnik) i kontrola otwierania przy nich.
