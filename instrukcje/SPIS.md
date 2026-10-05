# Instrukcje i karty katalogowe

Pliki od użytkownika (instrukcje montażu, karty produktów), z których biorą się
liczby w `szafki.jsx`. Każdy nowy plik dopisz tutaj: co to jest, skąd, co z niego
wzięliśmy i gdzie to siedzi w kodzie.

| Plik | Co to | Co z niego bierzemy | Gdzie w kodzie |
|---|---|---|---|
| `GTV_PD-G00_podnosnik_instrukcja.pdf` | GTV PD-G00, podnośnik gazowy do klapy do góry — instrukcja z tabelą udźwigu | siła podnośnika wg wysokości klapy, jej wagi na jeden podnośnik i kąta otwarcia (75/90/100°) | `GTV_PD_G00`, `dobierzPodnosnik` |
| `GTV_PD-ECGDL_amortyzator_karta.pdf` | GTV PD-ECGDL, amortyzator do klapy opadanej (w dół) — karta produktowa z tabelą | siła amortyzatora wg wysokości i wagi klapy | `GTV_PD_ECGDL`, `dobierzPodnosnik` |
| `Folder-Szuflada-V-BOX-18mm-online.pdf` | Sevroll V-BOX 18 3D Slim (i PUSH II) — folder z instrukcją, str. 6: wymiary elementów dla płyty 18 mm, montaż prowadnic, frontu i ścianki tylnej | wysokości boków 80–238 i tyłu 71–230 (tył równo z górą boku, dół ok. 9–10 mm nad dołem boku, dno dochodzi do tyłu: 6 + NL−24 + 18 = NL); **bok stoi na górnej części prowadnicy — od dołu prowadnicy do góry boku = min. front nakładany** (95/110/142/192/223/253; na rysunku „Front do szuflady 80 mm” góra boku 95 mm nad dołem prowadnicy — otwory 32/47,5 w skali), więc bok zaczyna się 13–15 mm nad dołem prowadnicy, a spód dna = spód tyłu (23–24 mm); pozostałe rysunki są schematyczne (nie mierzyć); pełny wysuw (str. 4); dno LW−75 × NL−24, tył LW−87; min. wysokości frontów (nakładany/wpuszczany); NL 250–600; min. głębokość korpusu NL+3 (PUSH +4); front wystający >140 mm ponad bok → reling; wpuszczany → prowadnica cofnięta o grubość frontu | `VBOX`, `vboxGora` / `vboxOdProw` / `vboxDno`, `skrzynkaBryly` (`bokOd`, `tylOd`), `maxBack`, `wysuwSzuflady`, „reling boczny” |
| `ZK-ZAW-R0-10_zawieszka_karta.pdf` | Zawieszka kuchenna R0 z regulacją ZK-ZAW-R0-10 (biała; R0-30 brąz) — karta produktu | wymiary 57,2 × 37,5 × 17,4 mm, dwa otwory ⌀4,1 w rozstawie 32 mm (19 mm od końca, 28 mm wysokości); w płycie się nie wierci, przykręca się 2 wkrętami 4 × 30, na samej górze pod wieńcem, 1 cm od pleców (użytkownik 2026-09-29) | `ZAWIESZKA_MODEL`, `zawieszkaNote` (plan wierceń, okucia) |
