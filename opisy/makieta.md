# Tryb makiety

Makieta to drugi sposób pracy w tej samej aplikacji: rysunek pomieszczenia, klikanie
i przeciąganie zamiast formularzy. Działa na **tych samych danych projektu** co tryb
techniczny — nic nie jest kopiowane ani liczone osobno. Plan i ustalenia:
`makiety/BRAKI.md` (sekcja E), wzór wyglądu i obsługi: `makiety/dodaj.html`.

## Trzy tryby

Przełącznik w nagłówku: **Makieta prosta · Makieta szczegółowa · Techniczny**.
Wybór pamięta przeglądarka; nowy użytkownik zaczyna w trybie technicznym.

- **Makieta prosta**:
  - wymiary szafki, fronty (drzwi, klapy, szuflady), uchwyty i tip-on;
  - półki, przegroda, drążek, cokół i nóżki;
  - blat roboczy (tylko czy jest), AGD.
  - Ustawień, których nie pokazuje (wzmocnienia, wycięcia, kolizje), **nie kasuje**.
- **Makieta szczegółowa**: wszystkie funkcje aplikacji w kartach w stylu makiety. Na rysunku
  też wzmocnienia, wycięcia i elementy kolizyjne.
- **Techniczny**: dotychczasowa aplikacja, bez zmian.

## Co program robi sam (krok 1)

- Rysuje ciągi oglądanego pomieszczenia z prawdziwej geometrii (te same rysunki co widok
  ciągu w trybie technicznym): zamknięty, otwarty albo z góry. Szafki wolnostojące stoją obok,
  z odstępem.
- Rysunek mieści się w oknie pod paskiem.
- Klik w szafkę (albo wybór z listy „Szafka ▾”) robi ją aktywną szafką projektu — po przejściu
  do trybu technicznego otwiera się właśnie ona.

## Co ustawiasz ręcznie

- Pomieszczenie, ciąg (wszystkie albo jeden), szafka i widok — przyciski z rozwijaną listą.
- Zakładka po lewej wybiera, co pokazuje karta: Szafka, Szuflady, Półki, Drzwi i klapy,
  Przegroda, Cokół i nóżki; w szczegółowej także Korpus i plecy, Wzmocnienia, Wycięcia i kolizje.

## Kontrole

Na razie brak — karta jest do odczytu. Uwagi projektu (błędy, ostrzeżenia) zostają w nagłówku.

## Czego jeszcze nie ma

Krok 1 to podgląd. Kolejne kroki (`makiety/BRAKI.md`, D):
- uchwyty na rysunku zapisujące dane;
- paleta i klocki;
- AGD;
- karty z polami do zmiany.

## Gdzie w kodzie i testy

- **Kod**: `MakietaWidok`, `MakietaKarta`, `MakietaWolnostojace`, `Rozwijana`; `onPick` / `zazn` / `maxH`
  w `AssemblyView` i `AssemblyTopView`; stan `tryb` w `App`.
- **Test**: `testy/makieta.mjs`.
