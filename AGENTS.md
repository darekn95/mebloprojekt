# Instrukcje dla agentów w tym repozytorium

- Nie dopisuj roboczych notatek AI/Claude do `README.md`, jeśli nie są konieczne dla użytkownika końcowego.
- Robocze informacje, procedury wymiany zmian i kontekst dla kolejnych agentów zapisuj w `AI_NOTES.md`.
- `szafki.jsx` jest głównym źródłem kodu aplikacji webowej.
- `claude-zmiany.txt` jest tylko buforem porównawczym dla kodu wklejanego z Claude; nie podłączaj go do aplikacji ani GitHub Pages.
- Po zmianie `szafki.jsx` zaktualizuj `standalone.html`, bo workflow Pages publikuje `standalone.html` jako `index.html`.

- **Nie wiesz albo nie rozumiesz — pytaj, zamiast zgadywać.** Dotyczy to
  zwłaszcza wymiarów, liczby okuć i zasad montażu: lepiej jedno pytanie niż
  poprawka wpisana na wyczucie, która potem wraca jako błąd w zamówieniu.
  Pytanie zadawaj konkretne — powiedz, co już sprawdziłeś w kodzie, gdzie
  widzisz dwa możliwe odczyty i co zrobisz przy każdym z nich.
- Zanim zaczniesz szukać po całym `szafki.jsx`, zajrzyj do `SLOWNIK.md`:
  wiąże etykietę z interfejsu ze ścieżką w danych i funkcją, która to liczy.
  Dokładasz nowe pole albo nazwę formatki — dopisz tam wiersz w tej samej zmianie.
- Gdy pytasz o decyzję, która sprowadza się do kilku opcji, dawaj pytanie
  z przyciskami do kliknięcia (narzędzie pytań z opcjami), a nie tekst do
  odpisania — użytkownik woli kliknąć niż wpisywać odpowiedź.
- **Dwie wersje aplikacji, dwie role** (ustalone z użytkownikiem):
  - **Artefakt na claude.ai** służy do pokazywania i testów na projekcie
    użytkownika. **Musi** mieć przycisk „Wyślij do Claude”. **Nie potrzebuje**
    pobierania plików — „Zapisz do pliku” może tam zostać przy obecnym
    zastępstwie (tekst do skopiowania), nie dokładaj do tego zdolności `downloads`.
  - **GitHub Pages / `standalone.html`** to wersja do pracy. Tu działa zapis do
    pliku, a przycisku „Wyślij do Claude” **nie może być** (brak `window.claude`,
    a tokenu GitHuba w stronie nie wolno umieszczać).
- Projekt użytkownika do testów: w artefakcie na claude.ai jest przycisk
  „Wyślij do Claude” (tylko tam — nie na GitHub Pages ani w standalone).
  Odczyt: `ArtifactData`, dokument `projekt/biezacy`, pole `json`. Trzymaj go
  w scratchpadzie; do repozytorium tylko za zgodą użytkownika.
- Gdy coś potrwa dłużej niż ok. 3 minuty (pełny przebieg testów, duży build,
  seria zrzutów), napisz o tym **przed** startem, z przybliżonym czasem —
  np. „Testy lecą (~25 min)” — i co w tym czasie robisz albo na co czekasz.
  Pełny przebieg obu buildów to ok. 20–30 min, pojedyncza suita 1–3 min.
- Znane błędy (aplikacji i testów), ich przyczyny i sprawy do decyzji użytkownika
  trzymaj w `BLEDY.md` — sprawdź go przed pełnym przebiegiem testów i dopisuj tam
  każdy nowy błąd razem z commitem, który go usuwa.
- Jeśli zapisujesz roboczą informację, używaj tagów `[AI-INFO]`, `[AI-TODO]`, `[CLAUDE-CHANGE]` albo `[CHECK]` w `AI_NOTES.md` zamiast znaczników podobnych do konfliktów Git.
