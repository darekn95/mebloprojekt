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
  - po dwa na stronę półki, domyślnie 50 mm od przedniej i tylnej krawędzi, jak trójkąty („Otwór od przodu / od tyłu”; do 2026-10-24 było 37 — stare 37 / 37 przy wczytaniu zmienia się na 50 / 50, inne wpisane liczby zostają);
  - wysokość = spód półki, liczona od dolnej krawędzi boku albo od dna („Wysokość otworów liczona od”);
  - na przegrodzie, gdy po obu stronach półki są na tej samej wysokości, otwory jednej strony (od kolumny z prawej) przesuwa się tak, żeby mijały się co najmniej o 10 mm — między sobą i z otworami po drugiej stronie (`KOLEK_PRZESUN`) — i były co najmniej 20 mm od krawędzi półki (`KOLEK_OD_KRAWEDZI`):
    - zwykle o 10 mm: na półce głębszej niż 300 mm do środka (50 → 60), na wąskiej (do 300 mm, `POLKA_WASKA`) na zewnątrz (50 → 40) — tylko w planie wierceń;
    - gdy ten kierunek nie wychodzi — drugi, potem oba w tył / w przód, potem o 20 mm; takie przesunięcie ma informację w Uwagach z „Półki kolumny N na trójkątach”;
    - nic nie pasuje — błąd „przesuń półkę o 10 mm albo zmień mocowanie” z przyciskami „Półki kolumny N na trójkątach / na konfirmatach” (konfirmatów nie, gdy sąsiad jest na konfirmatach — N45);
    - po drugiej stronie konfirmaty półki sąsiedniej kolumny (⌀7 przez przegrodę w osi półki): kołki i trójkąty omijają je tak samo — ścianka między otworami min. 5 mm (`OTW_SCIANKA`; kołek obok kołka 10 mm między środkami, obok konfirmatu 11); przesuwa się strona z kołkami, także prawa (użytkownik 2026-10-24: „przesuwamy albo trójkąty albo konfirmaty”, przy konfirmatach sprawdzić, czy nie nachodzą).
  - Trójkąty pod półką tak samo (50 mm od krawędzi półki, przesunięcie jak wyżej).
- **Trójkąty meblowe**: półki na trójkątach, wspornik pionowy bez płyty nad sobą (co 300 mm, min. 2), cokół bez nóżek.
- **Zawiasy drzwi**: oś zawiasu na boku, przegrodzie albo wsporniku — puszka ⌀35 we froncie, prowadnik na płycie. Wysokości po ominięciu półek i wzmocnień (`opisy/drzwi.md`).
- **Zawiasy i podnośniki klap**: `opisy/klapy.md` (każda klapa osobną płytą — w kolumnie z poziomami „Klapa — poziom M kolumny N”).
- **Prowadnice szuflad** (`opisy/szuflady.md`):
  - V-BOX: kreska na boku, przegrodzie albo wsporniku;
  - DXS-3D: kreska spodu prowadnicy i odsunięcie od czoła, przykręcane bez nawiercania;
  - skrzynka DXS: konfirmaty w bokach, zaczep ⌀6 × 10 w tyle, sprzęgła frontu w dnie.
- **Rura na wieszaki**: rozeta na boku / przegrodzie po obu stronach kolumny — wysokość osi rury, oś w połowie głębokości wnętrza, 2 wkręty 3,5 × 16 („rura na wieszaki”).
- **Zawieszki** (szafki wiszące): bez wiercenia — przykręcane wkrętami 4 × 30 od wnętrza, górna krawędź pod wieńcem, 1 cm od pleców (ZK-ZAW-R0-10).
- **Frez pod HDF**: w bokach, wieńcu i dnie, gdy plecy są we frezie.
- **Szafka w L**: dokładka „Bok ramienia” — konfirmaty dna / wieńca ramienia, kołki półek ramienia, zawiasy frontu ramienia; kątownik przy ramieniu ma kołki zamiast boku.

## Co ustawiasz ręcznie

- **Kołki**: „Otwór od przodu / od tyłu” i „Wysokość otworów liczona od” (karta „Montaż półek i zawieszenie”).
- **Mocowanie**: półek (kołki / konfirmaty / trójkąty, szafka albo kolumna) i dołu przegrody (trójkąty).
- **Reszta** wynika z konstrukcji (zawiasy, prowadnice, klapy, zawieszki).

## Kontrole i przyciski

- **Kołki nie mieszczą się na półce** (przód + tył ≥ głębokość najpłytszej) — błąd z „Ustaw 50 / 50 mm” (na płytkiej półce mniej — tyle, ile się zmieści).
- **Kołki / trójkąty po obu stronach przegrody** trafiłyby w siebie (albo w konfirmaty z drugiej strony): przesunięte inaczej niż zwykle — informacja z przyciskami „Półki kolumny N na trójkątach / na konfirmatach”; nie da się rozsunąć — błąd z tymi przyciskami (audyt GPT N75, decyzje użytkownika 2026-10-22 i 2026-10-24).
- **Konfirmaty z obu stron jednej płyty w tej samej osi** — błąd z wyborem mocowania drugiej strony (`opisy/poziomy.md`).
- **Zawiasy w jednym miejscu** albo na przeszkodzie — błąd (`opisy/drzwi.md`).
- **Zawiasy przesunięte** przez półkę lub wzmocnienie — notatka montażowa w PDF.

## Skąd liczby

- **Konfirmaty, kołki i trójkąty**: zasady robocze ustalone z użytkownikiem (2026-09-29: łączenia korpusu w planie wierceń, mocowanie półek; 2026-10-22: kołki na zewnątrz, gdy do środka się nie da, z podpowiedzią o trójkątach; 2026-10-24: kołki 50 mm od krawędzi jak trójkąty, mijają się o 10 mm, wąska półka — na zewnątrz do 40 mm).
- **Zawieszka**: karta ZK-ZAW-R0-10 (`instrukcje/`).
- **Podnośniki GTV i prowadnice DXS-3D**: instrukcje w `instrukcje/` (patrz opisy klap i szuflad).

## Gdzie w kodzie i testy

- **Obliczenia**: `computeGeo` — `drillMap`, `drillAdd(poziom, płyta, podstawa, rodzaj, y, opis)`, `panelsOfCol`; wynik `geo.drillPlan`.
- **Narożnik**: `wierceniaDodatkowe(arm, wstawki)`. Stałe: `KONF_OD_KRAWEDZI`, `KONF_DWA_OD`, `KOLEK_PRZESUN`, `ZAWIESZKA_WKRETY`.
- **PDF**: kartka „Wiercenia” w `ReportSheet`.
- **Testy**: `audytwierc` (plan vs rysunek i bryła na 12 konfiguracjach), `wierc`, `wiercstd`, `dxs` (plan DXS), `pins2`, `pins3`, `klapy`.
