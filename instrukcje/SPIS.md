# Instrukcje i karty katalogowe

Pliki od użytkownika (instrukcje montażu, karty produktów), z których biorą się
liczby w `szafki.jsx`. Każdy nowy plik dopisz tutaj: co to jest, skąd, co z niego
wzięliśmy i gdzie to siedzi w kodzie.

| Plik | Co to | Co z niego bierzemy | Gdzie w kodzie |
|---|---|---|---|
| `GTV_PD-G00_podnosnik_instrukcja.pdf` | GTV PD-G00, podnośnik gazowy do klapy do góry — instrukcja z tabelą udźwigu | siła podnośnika wg wysokości klapy, jej wagi na jeden podnośnik i kąta otwarcia (75/90/100°) | `GTV_PD_G00`, `dobierzPodnosnik` |
| `GTV_PD-ECGDL_amortyzator_karta.pdf` | GTV PD-ECGDL, amortyzator do klapy opadanej (w dół) — karta produktowa z tabelą | siła amortyzatora wg wysokości i wagi klapy | `GTV_PD_ECGDL`, `dobierzPodnosnik` |
| `Folder-Szuflada-V-BOX-18mm-online.pdf` | Sevroll V-BOX 18 3D Slim (i PUSH II) — folder z instrukcją, str. 6: wymiary elementów dla płyty 18 mm, montaż prowadnic, frontu i ścianki tylnej | wysokości boków 80–238 i tyłu 71–230 (tył równo z górą boku, dół ok. 9–10 mm nad dołem boku, dno dochodzi do tyłu); dno LW−75 × NL−24, tył LW−87; min. wysokości frontów (nakładany/wpuszczany); NL 250–600; min. głębokość korpusu NL+3 (PUSH +4); front wystający >140 mm ponad bok → reling; wpuszczany → prowadnica cofnięta o grubość frontu | `VBOX`, `skrzynkaBryly` (`tylOd`), `maxBack`, „reling boczny” |
