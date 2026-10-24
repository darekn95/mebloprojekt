# Rozkrój i PDF

Karta „Rozkrój” (układ formatek na arkuszach) i przycisk „Zestawienie PDF”
(wydruk przez okno drukowania przeglądarki).

## Co program liczy sam

### Rozkrój

- **Grupy**: osobno dla każdego materiału i formatu arkusza. Ten sam dekor z blatu 600 i 1200 to dwie grupy.
- **Arkusz płyty**: 2800 × 2100 mm, po okrawaniu zostaje 2761,2 × 2061,2 mm — to realne maksimum jednej formatki. Rzaz piły 3 mm.
- **Układ**: formatki układane tak, żeby dało się je wyciąć prostymi cięciami piły panelowej.
  - Formatka obraca się, chyba że „Kierunek usłojenia ma znaczenie” — wtedy słoje biegną wzdłuż dłuższego boku arkusza.
  - Plecy z HDF obracają się zawsze.
- **Blat roboczy**: własny arkusz 4100 × 600 albo 4100 × 1200 mm, nigdy nie obracany (fabryczny profil z przodu). Rzaz 3 mm liczy się tak samo jak na płycie: kawałki 2300 + 1799 = 4099 mm z rzazem to 4102 — nie wejdą w jeden arkusz 4100 (ostrzeżenie „brakuje 2 mm”).
- **Przeliczanie** samo: 1 s po ostatniej zmianie formatek, przy ponad 40 szafkach 5 s.
- **Liczba arkuszy** idzie do wyceny („arkusze płyty”, „formatowanie”).

### Zestawienie PDF

- **Strona szafki**:
  - 4 widoki w siatce 2 × 2: zamknięty (wymiary, szczeliny, kolory), otwarty (wymiary i okucia), z góry, z tyłu;
  - lista formatek i okuć szafki;
  - notatka montażowa (np. zawiasy przesunięte przez półkę);
  - plan wierceń (`opisy/wiercenia.md`).
- **Strony projektu**: formatki całego projektu (z szafką, płytą i oklejaniem PCV 2 mm, suma) i „Produkty całego projektu”. Wycena zostaje w aplikacji, w karcie „Wycena”.
- **Rozkrój**: strona tabeli i dokładnie jedna strona na każdy arkusz z rysunkiem układu.
- **Napisy w druku** są powiększane, a układ wymiarów liczony z powiększonych napisów:
  - widok ma ok. 90 mm, wymiary ok. 2,6 mm, minimum 2,3 mm;
  - drobne opisy co najmniej 1,8 mm;
  - napisy nie nachodzą na siebie i nie wychodzą poza pole widoku.
  - Na ekranie układ bez zmian.

## Co ustawiasz ręcznie

- **Materiały i arkusz blatu** (karta „Płyty”), usłojenie.
- **Zakres zamówienia**: cały projekt albo to pomieszczenie.
- **Wydruk**: okno drukowania przeglądarki („Zapisz jako PDF”).

## Kontrole i przyciski

- **Formatka większa niż arkusz po okrawaniu** — błąd z jej nazwą i wymiarem; blat dłuższy niż arkusz — błąd z podziałem (`opisy/ciagi.md`).
- **Zużycie blatu**: gdy do zmieszczenia na jednym arkuszu mniej brakuje najwyżej 200 mm — ostrzeżenie „brakuje N mm … nie trzeba kupować kolejnego blatu”, z przykładem skrócenia najdłuższego kawałka.
- **Odpad arkusza**: arkusz płyty wykorzystany poniżej 15% przy kilku arkuszach — ostrzeżenie „duży odpad, po niewielkiej zmianie wszystko może się zmieścić na N − 1”.
- **Ostrzeżenia rozkroju** są też w Uwagach („Rozkrój — <płyta>: …”).

## Skąd liczby

- **Arkusz 2800 × 2100 i okrawanie do 2761,2 × 2061,2**: rozkrojownia użytkownika.
- **Rzaz 3 mm**: grubość piły.
- **Blat 4100 × 600 / 1200**: arkusze z faktur użytkownika (2026-09-29).
- **Progi 200 mm i 15%**: komentarze użytkownika 2026-10-17.
- **Czytelność PDF**: decyzja użytkownika 2026-10-21 (audyt GPT PDF-1: „4 widoki zostają, napisy nie nachodzą”).

## Gdzie w kodzie i testy

- **Rozkrój**: `buildCutPlan`, `autoPlan`, `uwagiRozkroju`, `arkuszBlatu`, `wierszBlatu`; stałe `SHEET_W/H`, `USABLE_W/H`, `KERF`, `PROG_ODPADU`, `BLAT_BRAKUJE`, `ROZKROJ_ZWLOKA*`.
- **PDF**: `ReportSheet` (strona szafki, klasy `rp-page`, `rp-widok`), strony rozkroju `rp-arkusz`, `PRINT_CSS`; skala napisów `drukKUkladu`, `kolumnaDruk`, `ulozLegendy`.
- **Testy**: `cutplan`, `arkusz`, `arkuszstd`, `fit`, `fitall`, `fitstd`, `fitallstd`, `audytwycena`, `pdf`, `pdfczytelnosc`, `grain`.
