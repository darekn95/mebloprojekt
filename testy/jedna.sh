#!/bin/sh
# Jedna suita pelnego przebiegu (`pelny.sh`): nazwa albo nazwa@k-n — dluga suita
# dzielona na n czesci (SHARD=k/n), bo w calosci nie miesci sie w limicie czasu.
# Uzycie: sh jedna.sh <nazwa[@k-n]> <log> <limit s>
n="$1"; log="$2"; t="$3"; s="${n%@*}"
if [ "$s" != "$n" ]; then
  SHARD="$(echo "${n#*@}" | tr - /)" timeout "$t" node "$s.mjs" > "$log" 2>&1
else
  timeout "$t" node "$n.mjs" > "$log" 2>&1
fi
