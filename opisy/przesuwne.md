# Drzwi przesuwne w szafach (GTV NOVO S, tor dolny EVO) i szafa do zabudowy

Stan: 2026-11-16. Decyzje użytkownika z 2026-11-16 (w `BLEDY.md`, „Ustalone”). Szczegóły pól → dane → funkcje: `SLOWNIK.md`.

## Co program liczy sam

- **Gdzie drzwi.** Tory są w korpusie (nie na wnęce):
  - tor górny pod wieńcem, tor dolny na dnie;
  - otwór to światło korpusu: SO = szerokość między bokami, WO = wysokość między dnem a wieńcem.
- **Liczba skrzydeł** („same”): do 2000 mm otworu 2, do 3000 mm 3, wyżej 4 (skrzydło ok. 1000 mm, `PRZES.SKRZ_MAX`).
- **Wymiary** według instrukcji GTV NOVO S (18), s. 23 (`przesuwneWymiary`):
  - szerokość skrzydła SD = (SO − 3 + k·34) / n ze szczotką odbojową albo (SO + k·34) / n bez niej;
    - k = n − 1;
    - przy 4 skrzydłach — symetrycznie, liczone jak 2 na pół otworu;
  - wysokość skrzydła WD = WO − 40;
  - wypełnienie z płyty frontu 18 mm: SW = SD − 36, WW = WD − 3; formatka „Wypełnienie drzwi przesuwnych”, bez okleiny;
  - listwy poziome DLP = SD − 52;
  - rączki DR = WD.
- **Tory.** Skrzydła jadą na dwóch torach co 24 mm, w strefie 8–52 mm od lica korpusu:
  - 2 skrzydła: lewe na tylnym torze;
  - 3 skrzydła: środkowe z tyłu;
  - 4 skrzydła: środkowe dwa z tyłu.
- **Wnętrze cofnięte za tory.** Półki, przegrody i drążki są o 80 mm za licem (`PRZES.STREFA`): tor górny ma 76 mm, 80 mm zostawiono dla bezpieczeństwa.
  - Kolumny tracą drzwi na zawiasach i klapy; szuflady i sprzęt zostają.
- **Okucia** (`geoPrzesuwne`):
  - tor górny A-TG, tor dolny A-TDEVO i jego maskownica:
    - długości 1700 / 2350 / 3000 / 4050 / 6000, dociąć do SO;
    - otwór ponad 6000 — po dwa kawałki;
  - po 2 rączki NOVO S, 2 wózki dolne EVO i 2 prowadniki górne na skrzydło;
  - pozycjoner górny — 1 na skrzydło;
  - kątownik 18 mm na listwy poziome (sztangi 3000 mm);
  - szczotka odbojowa — 2 szt. (przy bokach).
- **Waga skrzydła** = płyta wypełnienia (gęstość z `wagaFrontu`) + 0,5 kg na metr profili. Te 0,5 kg/mb przyjęto z góry, bez karty — do potwierdzenia.

## Szafa do zabudowy (wzór w palecie „Szafa w zabudowie”)

- Korpus na całą wnękę: 2000 mm szerokości, 600 mm głębokości.
- Pod spodem cokół 100 i nóżki, jak każda szafka stojąca w ciągu.
- Drzwi przesuwne włączone, bez blendy.
- W środku przegroda: z jednej strony półki, z drugiej drążek z półką 300 mm nad nim.
- Wysokość korpusu:
  - sufit ściany znany (pole „wys.”) — do sufitu z luzem 5 mm: sufit − 5 − cokół;
  - sufit nieznany — 2400.
- Dodana bez zaznaczonego ciągu zakłada nowy ciąg „szafa”.

## Co ustawiasz ręcznie

- **Makieta, karta „Drzwi”** (szafa wysoka, ciąg szafy):
  - „na zawiasach / przesuwne”;
  - „skrzydła”: same, 2, 3 albo 4;
  - „szczotka odbojowa”: jest / nie ma;
  - pod przyciskami opis skrzydła i wypełnienia z wymiarami.
- **Tryb Techniczny:** karta „Drzwi przesuwne (GTV NOVO S)” z tymi samymi polami.
- **Uwagi:** wysokość korpusu do sufitu — przycisk „Do sufitu z luzem 5 mm”.

## Kontrole

- × Skrzydło cięższe niż 50 kg (wózki EVO). Przycisk dokłada skrzydło (`przesn:<n>`).
- ! Skrzydło szersze niż ok. 1150 mm. Przycisk jak wyżej.
- × Otwór za mały: wypełnienie ≤ 0.
- Dostęp do kolumn (`przesuwneOdslania`). Kolumna musi się zmieścić w miejscu, które odsłania jedno odsunięte skrzydło:
  - (i) kolumna z półkami zasłonięta o więcej niż 50 mm — „ustaw przegrodę na styku skrzydeł albo zmień liczbę skrzydeł”;
  - (!) kolumna z szufladami zasłonięta o więcej niż 2 mm — „szuflada się nie wysunie”.
- Sufit (`sufitSzafyMsgs`, szafy powyżej 1500 mm w ciągu dolnym):
  - × szafa wyżej niż sufit;
  - ! luz poniżej 5 mm;
  - (i) szafa przesuwna bez blendy, luz ponad 30 mm — „może sięgać sufitu”;
  - wszystkie trzy z przyciskiem „Do sufitu z luzem 5 mm” (`szafasufit:<i>`).
- Szafa przesuwna, sufit nieznany — (i) „podaj wysokość ściany”.
- **Kolejność montażu.** Korpus skręcony na leżąco stawia się, obracając go na podłodze obok cokołu, i wsuwa na cokół:
  - przekątna boku (wysokość × głębokość) ponad wysokość sufitu — (i) „skręcaj na stojąco, na miejscu”;
  - mieści się tylko bez nóżek — (i) „nóżki przykręć dopiero po postawieniu”.

## Skąd liczby

- `instrukcje/gtv-przesuwne/GTV_NOVO_S_18_instrukcja.pdf`, s. 22–25: wzory, kody, regulacja 10 mm, do 50 kg.
- Katalog GTV 2023, s. 510–512: tor górny 76 × 38, tor dolny EVO 45 × 8, długości torów.
- Użytkownik 2026-11-16:
  - tory w korpusie;
  - auto ok. 1000 mm na skrzydło, z podpowiedzią o dostępie do półek i szuflad;
  - strefa 80 mm („tor górny ma 76 mm, dla bezpieczeństwa 80”);
  - szafa do zabudowy bez domyślnej blendy, do sufitu z luzem min. 5 mm.

## Gdzie w kodzie i testy

- Kod:
  - stałe i wymiary: `PRZES`, `przesuwneOn`, `przesuwneLiczba`, `przesuwneWymiary`, `przesuwneTor`, `przesuwneOdslania`;
  - geometria: `geoPrzesuwne` (wywoływana z `computeGeoLiczy`);
  - rysunki: `PrzesuwneElew` (przód), grupa `przesuwne-z-gory` w `CabTop`, `przesuwneBryly` (3D: `Scene3D`, `Assembly3D`);
  - sufit: `sufitSzafyMsgs`;
  - wzór: `szafaZab` w `MAK_PALETA` (`doSufitu`).
- Testy:
  - `testy/funkcje.mjs` — blok „drzwi przesuwne GTV NOVO S”;
  - `testy/makieta19.mjs` — wzór, sufit, karta Drzwi, 3D, karta techniczna.
- Szuflady za drzwiami przesuwnymi (front za strefą torów, najniższa nad torem dolnym, listwa od strony skrzydła) — osobny krok, zob. `AI_NOTES.md`.
