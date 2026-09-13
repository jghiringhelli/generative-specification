#!/usr/bin/env bash
SX="C:/workspace/PragmaWorks/gs/generative-specification/experiments/sx"
export PATH="$PATH:/c/Program Files/Hurl"
for COND in S0 S1 S2; do
  echo "=== $COND rep1 START $(date +%H:%M:%S) ==="
  bash "$SX/run_sx.sh" 1 claude-sonnet-4-5 "$COND" 1
  powershell -NoProfile -Command "Get-Process node,tsx,esbuild -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue" 2>/dev/null
  rm -f "$SX/.run_sx.lock"
  sleep 6
done
echo "=== EXTRA REPS DONE ==="
