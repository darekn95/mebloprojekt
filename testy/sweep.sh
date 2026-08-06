#!/bin/bash
cd "$(dirname "$0")"
for f in "$@"; do
  out=$(node "$f.mjs" 2>&1)
  bl=$(echo "$out" | grep -cE "^  BLAD")
  okc=$(echo "$out" | grep -cE "^  OK")
  if echo "$out" | grep -q "triggerUncaughtException"; then
    printf "%-9s  CRASH: %s\n" "$f" "$(echo "$out" | grep -m1 -E 'Error|Timeout' | cut -c1-90)"
  else
    printf "%-9s  %2d OK, %d BLAD\n" "$f" "$okc" "$bl"
    [ "$bl" -gt 0 ] && echo "$out" | grep -E "^  BLAD" | sed 's/^/            /'
  fi
done
