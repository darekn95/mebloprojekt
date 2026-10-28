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
  - widok zamknięty (2026-10-25, decyzje użytkownika): wymiar frontu tylko napisem w jego środku (W×H) — linie wysokości i szerokości frontów tylko przy froncie za małym na napis (także na ekranie); wymiary całości (szerokość, korpus, z nóżkami) zostają; szczeliny w PDF tylko nietypowe — poniżej 2 mm albo ponad „Ostrzegaj powyżej” (np. 38 nad podfrezem), zwykłe bez opisu; na ekranie „Pokaż szczeliny” pokazuje wszystkie;
  - szeroka szafka (np. 1600 mm) ma w siatce 2 × 2 wymiary ok. 2,0 mm zamiast 2,3 — decyzja użytkownika 2026-10-25: może zostać;
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
- **Uwagi z rozkroju a pomieszczenia** (użytkownik 2026-10-24): przy kilku pomieszczeniach i zakresie „Cały projekt” uwaga o płycie (grupie rozkroju) jest w Uwagach tylko tam, gdzie ta płyta jest; w innych pomieszczeniach — niżej, „Do sprawdzenia w innych pomieszczeniach”, z nazwą pomieszczenia do kliknięcia (`rozkrojUwagi`, `data-el="uwagi-inne-pomieszczenia"`).
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

## Własne płyty (2026-10-24)

W karcie „Płyty” przy kolorach płyty jest kwadrat „+”: płyta spoza wzornika (np. Egger na zamówienie) z własną nazwą, grubością, wymiarem arkusza (domyślnie 2800 × 2070), ceną za arkusz i kolorem na rysunkach. Lista jest w projekcie (`project.plyty`), pod wzornikiem w osobnym rzędzie „Własne płyty” (ramka przerywana, znak „W”). Szafka wskazuje płytę (`mat[k].plyta`) — rozkrój układa jej formatki na jej arkuszu (okrawanym jak zwykły, po 19,4 mm z każdej strony), wycena bierze jej cenę. Zmiana płyty (✎) przechodzi do wszystkich szafek z nią; kolor z wzornika, własny kolor, nazwa albo grubość wpisane ręcznie odpinają szafkę od płyty; usunięcie płyty z listy zostawia szafkom jej nazwę i kolor.

## Własne kawałki płyty (2026-10-24)

Przy każdej płycie w rozkroju jest „+ mam własny kawałek tej płyty” (długość, szerokość, sztuki; `project.resztki`). Rozkrój najpierw kładzie formatki na własne kawałki (większe najpierw, bez okrawania — wpisujesz wymiar użyteczny), resztę na arkusze do kupienia. W „Płyty do zamówienia” i w wycenie liczą się tylko kupowane arkusze („+ N z własnych kawałków”), formatowanie liczy także własne kawałki. Rysunek własnego kawałka ma podpis „własny kawałek … — nie kupujesz”; ostrzeżenie o dużym odpadzie dotyczy tylko kupowanych arkuszy.

Szczegóły (audyt GPT 2026-10-28):
- kawałek jest przypięty do płyty stałą tożsamością (`resztki[].matId` = `tozsamoscPlyty`: własna płyta — jej id, inna — nazwa, kolor, dekor, grubość), a nie etykietą — etykieta dostaje grubość („… 18”), gdy w projekcie pojawi się ta sama nazwa w innej grubości, i kawałek przestawał pasować (N94); stare zapisy bez `matId` dostają go przy wczytaniu z materiału o tej etykiecie;
- z listy zdejmuje się dokładnie ta formatka, która leży na kawałku (numer pozycji `src` z pakowania) — wcześniej po nazwie i wymiarze w obu ułożeniach, więc przy zakazie obrotu schodziła czasem druga orientacja (N92);
- podsumowanie grupy (wykorzystanie, cięcia, zrzut) liczy cały plan — kupione arkusze i własne kawałki (N93); „Płyty do zamówienia” i wycena — dalej tylko kupione.

Własne płyty: nazwa jest etykietą w rozkroju i cenniku, więc dwie o tej samej nazwie szły na jeden arkusz i miały wspólną cenę (N95). Formularz nie pozwala zapisać drugiej o tej samej nazwie („już jest — nadaj inną nazwę”), pusta nazwa dostaje kolejny numer („Płyta własna 2”), a stary zapis z powtórzoną nazwą dostaje przy wczytaniu dopisek „(2)”; grupy rozkroju dla własnych płyt rozdziela też ich id. Arkusz własnej płyty jest w materiale szafki (`mat[k].arkusz`), więc kontrola „formatka nie mieści się na arkuszu” liczy z niego (okrawanego jak wzornik), a nie z 2800 × 2100 (N99).
