# Testy

Suity Playwright, którymi sprawdzamy aplikację. Każda drukuje linie `  OK` i
`  BLAD`, więc widać od razu, co przeszło, a co nie.

## Jak uruchomić

Testy gadają z aplikacją przez przeglądarkę, więc najpierw trzeba ją zbudować
i podać na porcie.

```bash
cd testy
node build-artifact.mjs                 # buduje mebloprojekt-app.html ze szafki.jsx
setsid python3 -m http.server 5205 >/dev/null 2>&1 < /dev/null & disown
bash sweep.sh narozn narozn2 narozn3    # dowolna lista suit, bez rozszerzenia
```

`sweep.sh` drukuje jedną linię na suitę: `narozn2   50 OK, 0 BLAD`, a przy
błędach dopisuje pod spodem, które asercje padły.

Pojedynczą suitę odpala się wprost: `node narozn2.mjs`.

## Wersja standalone

`standalone.html` to build dla GitHub Pages i trzeba go sprawdzać osobno, bo
powstaje inną drogą niż artefakt testowy.

```bash
node scripts/generate-standalone.mjs    # z katalogu głównego repo
```

Potem podmienia się w nim cztery adresy CDN na lokalne pliki, zapisuje jako
`standalone-local.html`, podaje na porcie 5199 i uruchamia suity z `STD=1`.
Poprawny build różni się od `standalone.html` **dokładnie ośmioma liniami** —
to te cztery tagi `<script>` razy dwa.

## Suity narożnika

- `narozn` — narożniki ciągów: L, U, G, ślepy narożnik, rozwinięcie elewacji
- `narozn2` — szafka narożna w L: ramię, warianty drzwi, jedne drzwi zamiast
  kolumny przejścia, półki i cokół ramienia
- `narozn3` — blat w narożniku: na styk, na łyżwę, który blat przechodzi
- `ciagarm` — ramię widoczne w widoku samego ciągu, zawiasy tylko w otwartym
- `zawpow` — błąd, gdy zawiasy wypadają od strony przelotu
- `zawias` — strona zawiasów jako ustawienie całej szafki
- `minform` — formatki poniżej 60 mm

## Uwaga o ścieżkach

Suity zapisują zrzuty ekranu obok siebie (`./shot-*.png`), więc uruchamiaj je
z katalogu `testy`. `sweep.sh` sam do niego wchodzi.
