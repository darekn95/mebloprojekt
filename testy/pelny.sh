#!/bin/bash
# Pelny przebieg testow: wszystkie suity szybko (po 5 naraz, ok. 3 min), potem
# tylko te z bledem jeszcze raz wolno (PW_WOLNO=1 — sztywne pauzy, patrz pw.mjs).
#   pada tez wolno     -> PRAWDZIWY BLAD (aplikacji albo testu) — do naprawy
#   wolno przechodzi   -> FALSZYWY ALARM z czekania — poprawic `zajeta` w pw.mjs
# Uzycie:  bash pelny.sh [katalog-na-logi] [nazwy suit...]
#   bez nazw — wszystkie suity (pliki z "'  OK   '"), logi domyslnie w /tmp/pelny
# Wymaga serwerow: python3 -m http.server 5205 i 5199 w katalogu testy/.
cd "$(dirname "$0")"
L=${1:-/tmp/pelny}; shift 2>/dev/null
rm -rf "$L" && mkdir -p "$L"
if [ $# -gt 0 ]; then printf '%s\n' "$@" > "$L/lista.txt"
else grep -l "'  OK   '" *.mjs | sed 's/\.mjs$//' | grep -v '^pw$\|^build-artifact$\|^runner$' > "$L/lista.txt"; fi
n=$(wc -l < "$L/lista.txt")

zly() { grep -qE '^  BLAD|Error:|TimeoutError|triggerUncaughtException' "$1" || ! grep -q '  OK' "$1"; }

t0=$(date +%s)
xargs -P 5 -I{} sh -c "timeout 600 node {}.mjs > '$L/{}.log' 2>&1" < "$L/lista.txt"
t1=$(date +%s)
: > "$L/bledy.txt"
while read -r s; do zly "$L/$s.log" && echo "$s" >> "$L/bledy.txt"; done < "$L/lista.txt"
ok=$(cat "$L"/*.log | grep -c '^  OK')
echo "Szybko: $n suit w $((t1 - t0)) s, $ok OK, z bledem: $(wc -l < "$L/bledy.txt")"

[ -s "$L/bledy.txt" ] || { echo "WSZYSTKO ZIELONE"; exit 0; }
echo "Powtorka wolno (PW_WOLNO=1): $(tr '\n' ' ' < "$L/bledy.txt")"
xargs -P 5 -I{} sh -c "PW_WOLNO=1 timeout 900 node {}.mjs > '$L/{}.wolno.log' 2>&1" < "$L/bledy.txt"
prawdziwe=0
while read -r s; do
  if zly "$L/$s.wolno.log"; then
    prawdziwe=1
    echo "  PRAWDZIWY BLAD  $s"
    grep -E '^  BLAD|Error' "$L/$s.wolno.log" | head -5 | sed 's/^/      /'
  else
    echo "  FALSZYWY ALARM  $s — wolno przechodzi; popraw czekanie w pw.mjs"
    grep -E '^  BLAD|Error' "$L/$s.log" | head -3 | sed 's/^/      szybko: /'
  fi
done < "$L/bledy.txt"
exit $prawdziwe
