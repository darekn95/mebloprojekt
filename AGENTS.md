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
- Jeśli zapisujesz roboczą informację, używaj tagów `[AI-INFO]`, `[AI-TODO]`, `[CLAUDE-CHANGE]` albo `[CHECK]` w `AI_NOTES.md` zamiast znaczników podobnych do konfliktów Git.
