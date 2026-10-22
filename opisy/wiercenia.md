# Plan wierceń

Kartka „Wiercenia” w PDF szafki i lista w aplikacji. Dla każdej płyty (nazwa jak
w formatkach, przy kilku poziomach z „Poziom N — …”) jest lista otworów i kresek:
rodzaj, wysokość od dołu płyty i opis (odległość od krawędzi, średnica, wkręt).

## Co program liczy sam

Wszystko wynika z geometrii szafki — te same wysokości co na rysunkach i w 3D.

- **Konfirmaty** (łączenia korpusu, półki przelotowe, półki i przegrody na konfirmatach, wsporniki, wstawka, skrzynki DXS):
  - otwór ⌀7 w płycie, w czole łączonej płyty ⌀5 × 50;
  - po 50 mm od krawędzi, co ok. 200 mm, a styk krótszy niż 132 mm — jeden w połowie.
- **Kołki półek** ⌀5:
  - po dwa na stronę półki, domyślnie 37 mm od przedniej i tylnej krawędzi („Otwór od przodu / od tyłu”);
  - wysokość = spód półki, liczona od dolnej krawędzi boku albo od dna („Wysokość otworów liczona od”);
  - na przegrodzie kołki z obu stron na tej samej wysokości są przesunięte o 20 mm do środka półki.
- **Trójkąty meblowe**: półki na trójkątach, wspornik pionowy bez płyty nad sobą (co 300 mm, min. 2), cokół bez nóżek.
- **Zawiasy drzwi**: oś zawiasu na boku, przegrodzie albo wsporniku — puszka ⌀35 we froncie, prowadnik na płycie. Wysokości po ominięciu półek i wzmocnień (`opisy/drzwi.md`).
- **Zawiasy i podnośniki klap**: `opisy/klapy.md`.
- **Prowadnice szuflad** (`opisy/szuflady.md`):
  - V-BOX: kreska na boku, przegrodzie albo wsporniku;
  - DXS-3D: kreska spodu prowadnicy i odsunięcie od czoła, przykręcane bez nawiercania;
  - skrzynka DXS: konfirmaty w bokach, zaczep ⌀6 × 10 w tyle, sprzęgła frontu w dnie.
- **Zawieszki** (szafki wiszące): bez wiercenia — przykręcane wkrętami 4 × 30 od wnętrza, górna krawędź pod wieńcem, 1 cm od pleców (ZK-ZAW-R0-10).
- **Frez pod HDF**: w bokach, wieńcu i dnie, gdy plecy są we frezie.
- **Szafka w L**: dokładka „Bok ramienia” — konfirmaty dna / wieńca ramienia, kołki półek ramienia, zawiasy frontu ramienia; kątownik przy ramieniu ma kołki zamiast boku.

## Co ustawiasz ręcznie

- **Kołki**: „Otwór od przodu / od tyłu” i „Wysokość otworów liczona od” (karta „Montaż półek i zawieszenie”).
- **Mocowanie**: półek (kołki / konfirmaty / trójkąty, szafka albo kolumna) i dołu przegrody (trójkąty).
- **Reszta** wynika z konstrukcji (zawiasy, prowadnice, klapy, zawieszki).

## Kontrole i przyciski

- **Kołki nie mieszczą się na półce** (przód + tył ≥ głębokość najpłytszej) — błąd z „Ustaw 37 / 37 mm”.
- **Konfirmaty z obu stron jednej płyty w tej samej osi** — błąd z wyborem mocowania drugiej strony (`opisy/poziomy.md`).
- **Zawiasy w jednym miejscu** albo na przeszkodzie — błąd (`opisy/drzwi.md`).
- **Zawiasy przesunięte** przez półkę lub wzmocnienie — notatka montażowa w PDF.

## Skąd liczby

- **Konfirmaty, kołki i trójkąty**: zasady robocze ustalone z użytkownikiem (2026-09-29: łączenia korpusu w planie wierceń, mocowanie półek).
- **Zawieszka**: karta ZK-ZAW-R0-10 (`instrukcje/`).
- **Podnośniki GTV i prowadnice DXS-3D**: instrukcje w `instrukcje/` (patrz opisy klap i szuflad).

## Gdzie w kodzie i testy

- **Obliczenia**: `computeGeo` — `drillMap`, `drillAdd(poziom, płyta, podstawa, rodzaj, y, opis)`, `panelsOfCol`; wynik `geo.drillPlan`.
- **Narożnik**: `wierceniaDodatkowe(arm, wstawki)`. Stałe: `KONF_OD_KRAWEDZI`, `KONF_DWA_OD`, `KOLEK_PRZESUN`, `ZAWIESZKA_WKRETY`.
- **PDF**: kartka „Wiercenia” w `ReportSheet`.
- **Testy**: `audytwierc` (plan vs rysunek i bryła na 12 konfiguracjach), `wierc`, `wiercstd`, `dxs` (plan DXS), `pins2`, `pins3`, `klapy`.
