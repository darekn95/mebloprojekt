# Zamówienie i wycena

Karty „Okucia” / „Produkty” (szafka i projekt) oraz „Wycena”. Zakres
zamówienia: „Cały projekt” albo „To pomieszczenie”.

## Co program liczy sam

- **Okucia szafki** wynikają z jej geometrii. Każda pozycja ma nazwę, przeznaczenie, opis i liczbę sztuk:
  - **zawiasy** (nakładane / wpuszczane / półnakładane, 165° i łamane w narożniku);
  - **prowadnice**: V-BOX wg wysokości boku i NL, DXS-3D komplet na szufladę;
  - **reling**, **uchwyty** (po jednym na front z uchwytem), **podnośniki / amortyzatory klap** (z siłą);
  - **konfirmaty 7 × 50 i zaślepki** (też skrzynek DXS), **kołki podporowe ⌀5**, **trójkąty**;
  - **nóżki** (wariant: kształt, wysokość, kolor), **złączki do cokołu**;
  - **zawieszki, listwa montażowa** (za metr), **haki**;
  - **wkręty / zszywki do pleców**, **lustro** (za m²), **złącza do blatów**.
- **Zestawienie projektu**: jeden wiersz na produkt i wariant (nakładany i wpuszczany zawias to dwa wiersze, nóżka 100 kwadratowa i 150 okrągła też). Ilości się sumują.
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
- **Konfirmaty**: na styk 1 (krótszy niż 132 mm) albo co ok. 200 mm, min. 2. Zaślepki — tyle samo, w blistrach po 25.
- **Cena okucia** zapisuje się pod kluczem „nazwa | wariant”, bez ilości — zmiana liczby sztuk jej nie gubi.

## Co ustawiasz ręcznie

- **Ceny**: każdą w karcie „Wycena”, zapisaną w projekcie.
- **Zakres zamówienia**: projekt albo pomieszczenie.
- **Nazwa uchwytu** (karta produktów).
- **Materiały i arkusz blatu** — wpływają na wycenę przez rozkrój.

## Kontrole i przyciski

- **Okucie bez ceny w cenniku** liczy się jako 0. Każda nowa nazwa okucia musi trafić do `DEFAULT_HW_PRICES` (zasada w `SLOWNIK.md`, sekcja 5).
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
