# Zamówienie i wycena

Karty „Okucia” / „Produkty” (szafka i projekt) oraz „Wycena”. Zakres
zamówienia: „Cały projekt” albo „To pomieszczenie”.

## Co program liczy sam

- **Okucia szafki** wynikają z jej geometrii. Każda pozycja ma nazwę, przeznaczenie, opis i liczbę sztuk:
  - **zawiasy** (nakładane / wpuszczane / półnakładane, 165° i łamane w narożniku);
  - **prowadnice**: V-BOX wg wysokości boku i NL, DXS-3D komplet na szufladę;
  - **reling**, **uchwyty** (po jednym na front z uchwytem), **podnośniki / amortyzatory klap** (z siłą);
  - **konfirmaty 7 × 50 i zaślepki** (też skrzynek DXS), **kołki podporowe ⌀5**, **trójkąty**;
  - **wkręty 4 × 30 do frontu szuflady** — 4 na front DXS-3D, front przykręcany od środka przez przód skrzynki (2026-10-26);
  - **nóżki** (wariant: kształt, wysokość, kolor), **złączki do cokołu**;
  - **zawieszki, listwa montażowa** (za metr), **haki**; przy szafce wiszącej z dala od ściany — pod listwę: dystans równy grubości płyty albo dwóm to formatka „Listwa dystansowa” z płyty (nie produkt), inny — **kantówka dystansowa** (mb, przekrój co 5 mm × 60); pod haki — klocki dystansowe, 1 zł (N148, decyzja użytkownika 2026-10-31);
    - listwa: w sklepie odcinki 1 m i 2 m, tnie się na wymiar (rzazu nie liczymy). Jedna listwa przez ciąg — od pierwszej do ostatniej szafki, która na niej wisi (skrajna bez zawieszek jej nie dostaje, środkowa nie przerywa; obie z ostrzeżeniem); dłuższa niż 2 m — pełne odcinki 2 m i reszta. Osobna szafka — W, ramię szafki w L — swój odcinek przy drugiej ścianie. Plecy z płyty cofnięte (opcja) — listwa w szafce za plecami: szerokość pleców − 2 × 5 mm (`LISTWA_OD_PLECOW`), a listwa ciągu kończy się przy tej szafce (decyzje użytkownika 2026-10-24);
    - **lustro**: grubość (4 / 6 mm) w opisie i wariancie — różne grubości to osobne wiersze (audyt GPT N80);
    - **mocowania pleców w kolumnach** z obwodu każdej płyty (HDF — zszywki, płyta — wkręty), bez płyt — bez mocowań (audyt GPT N81);
    - zakup listwy (`listwaZakup`): najmniej metrów, docinki idą na krótsze kawałki (3 × 660 z jednego 2 m zamiast 3 × 1 m), przy remisie najmniej cięć. Listwa może być krótsza najwyżej o 10 mm (`LISTWA_SKROT`), ale tylko wtedy, gdy dzięki temu kupuje się mniej (3 × 670 = 2010 → jeden odcinek 2 m, jedna 660; za plecami cofniętymi bez skracania). Wiersz podaje „kupić N × 2 m + N × 1 m”, potrzebną długość, odpad i plan cięcia; ilość w mb = kupione metry (audyt GPT N77, decyzja użytkownika 2026-10-22);
  - **wkręty / zszywki do pleców**, **lustro** (za m²), **złącza do blatów**;
  - **rura na wieszaki ⌀25** — każda docięta na światło kolumny − 2 mm; zakup w odcinkach 0,5 / 1 / 1,5 / 2 / 2,5 / 3 m jak listwa (`ruraWiersz`: najmniej metrów, docinki na krótsze rury, najchętniej odcinki do 2 m — 2,5 i 3 m tylko dla rury dłuższej niż 2 m; wiersz „kupić … / potrzeba / odpad / cięcie” — tak samo w zamówieniu pomieszczenia i projektu, z nazwami szafek przy docinkach; audyt GPT N90: tam plan znikał, zostawał opis „drążek na wieszaki w szafie”), 15 zł/m; **rozety** 2 na rurę, 1 zł (ceny użytkownika 2026-10-24); **podpora rury GTV WP-10** — 1 na rurę dłuższą niż 2 m, gdy kliknięto „Podpora rury na środku” (N181/N182), 4 zł (cena użytkownika 2026-10-31).
  - **kątownik Sevroll 40343** — 1 na szufladę V-BOX szerszą niż 600 mm, z 4 wkrętami 3,5 × 13 (N178), 4 zł (cena użytkownika 2026-10-31).
- **Zestawienie projektu**: jeden wiersz na produkt i wariant (nakładany i wpuszczany zawias to dwa wiersze, nóżka 100 kwadratowa i 150 okrągła też). Ilości się sumują. Oznaczenie modelu (tip-on AM-SVN-DL-MG-30, zawieszka ZK-ZAW-R0-10 — pole `model`) zostaje w opisie zbiorczego wiersza przed listą zastosowań; nie wchodzi w klucz ceny (N155).
- **Wycena** (ceny brutto, każdą można nadpisać, 0 zeruje pozycję):
  - **arkusze płyty** — liczba z rozkroju, cena wg materiału: biała 223,10 zł, w kolorze 240 zł (2800 × 2100 × 18), HDF 70 zł;
  - **formatowanie płyty** — 51,66 zł za arkusz;
  - **obrzeże 22 × 2 mm** — 3,38 zł/mb; do każdego oklejanego boku 9 cm zapasu;
  - **oklejanie prostoliniowe** — 8,86 zł za każdy rozpoczęty metr (od okleiny z zapasem, w górę);
  - **blat roboczy**:
    - arkusz 563,99 zł (600) / 1128,22 zł (1200);
    - obrzeże ABS (grubość blatu + 5) × 2 mm na końce — 6,68 zł/mb;
    - oklejanie PCV > 23 mm — 11,81 zł za rozpoczęty metr;
  - **okucia** — cena z cennika domyślnego × liczba:
    - prowadnica V-BOX: 74–126 zł wg boku i NL;
    - DXS-3D: 50 zł za komplet;
    - zawias 3 zł; uchwyt 10 zł; reling 30 zł; podnośnik / amortyzator 10 zł;
    - zawias 165° i łamany po 15 zł; złącze do blatów 9 zł.
- **Konfirmaty**: na styk 1 (krótszy niż 132 mm) albo co ok. 200 mm, min. 2. Zaślepki — tyle samo, w blistrach po 25; także konfirmaty ramienia szafki w L (N168).
- **Wkręty 4 × 30** (wzmocnienia, kątownik, zawieszki, dwie przegrody na styku): w szafce jeden wiersz z rozpisaniem; w liście projektu każde zastosowanie osobno z ilością (`czesci` w `scalOkucia`, audyt GPT N163 — przy samych zawieszkach opis mówił o wzmocnieniach).
- **Dystans szafki wiszącej** (kantówka, klocki pod haki): grubość / przekrój jako wariant — różne grubości to osobne wiersze listy projektu i ceny (N160). Listwa z płyty jest w formatkach.
- **Cena okucia** zapisuje się pod kluczem „nazwa | wariant”, bez ilości — zmiana liczby sztuk jej nie gubi.

## Co ustawiasz ręcznie

- **Ceny**: każdą w karcie „Wycena”, zapisaną w projekcie.
- **Zakres zamówienia**: projekt albo pomieszczenie.
- **Nazwa uchwytu** (karta produktów).
- **Materiały i arkusz blatu** — wpływają na wycenę przez rozkrój.

## Kontrole i przyciski

- **Okucie bez ceny w cenniku** liczy się jako 0. Każda nowa nazwa okucia musi trafić do `DEFAULT_HW_PRICES` (zasada w `SLOWNIK.md`, sekcja 5). Wyjątek: wkręt bez własnego wpisu („Wkręt 3,5 × 13”, wkręt do frontu szuflady DXS, „Wkręt 4 × N” przez dwie przegrody) kosztuje tyle co Wkręt 4 × 30 (decyzja użytkownika 2026-10-31). Klocek dystansowy pod hak — 1 zł.
- **Audyt `audytwycena`** sprawdza, że arkusze w wycenie = rozkrój, obrzeże = suma krawędzi, okucia = lista, wartość = ilość × cena, a „Razem” = suma.
- **Zestawienie projektu** = suma szafek + cokół i blat ciągów; PDF = ekran (audyt `audyt`).

## Skąd liczby

- **Ceny płyt, usług i blatu**: faktury użytkownika (2026-09-29), brutto.
- **Prowadnice V-BOX**: cennik — środek widełek; bok 80 brak w cenniku, przyjęty jak 95.
- **Ceny ustalone z użytkownikiem**: DXS-3D 50 zł (2026-10-21), reling 30 zł (2026-10-14), podnośnik / amortyzator 10 zł (2026-09-28), złącze do blatów 9 zł (2026-10-16).
- **Zapas okleiny 9 cm na bok**: użytkownik 2026-09-29.

## Gdzie w kodzie i testy

- **Okucia szafki**: `computeGeo`, koniec (`hardware.push`); narożnik — `cornerArmParts`; ciąg — `projectParts`, `runTopZlacza`.
- **Zestawienie**: `scalOkucia`, `projectHardware`; wycena — `useMemo` z `rows` w `App` (`DEFAULT_PRICES`, `DEFAULT_HW_PRICES`, `SLIDE_PRICES`, `WORKTOP_PRICES`, `OBRZEZE_ZAPAS`, `priceOf`).
- **Testy**: `ceny`, `ceny2`, `ceny2std`, `audytwycena`, `hw`, `hw2`, `projhw`, `okucia3`, `audyt`.

## Karty zamówienia (2026-10-24)

Formatki, Rozkrój na płycie, Produkty do zamówienia i Wycena — po jednej karcie, pod tytułem przyciski **Szafka / Pomieszczenie / Projekt** (Pomieszczenie tylko przy kilku pomieszczeniach; przy jednej szafce w projekcie bez przycisków). Przyciski są w każdej karcie, ale działają wspólnie — zmiana w jednej zmienia zakres we wszystkich (2026-10-25, decyzja użytkownika); Pomieszczenie / Projekt to zarazem zakres „Zamówienie” na pasku pomieszczeń. Na starcie: Formatki — szafka, Rozkrój, Produkty i Wycena — pomieszczenie (przy jednym pomieszczeniu to cały projekt); wybór przeglądarka pamięta. Rozkrój i wycena „Szafka” liczą arkusze, obrzeże i okucia samej szafki (bez elementów ciągu: cokołu, blatu, listwy).
