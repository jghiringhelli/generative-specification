#!/usr/bin/env bash
# measure_cr.sh — orchestrate the CR (capacity-relative) measurement.
#
# Two entry paths, matching how AX2 actually ran:
#   (A) LOCAL rungs (ollama): generation + measurement here. Set GEN_OLLAMA=1 and pass the
#       ollama model + reps; this generates, materializes, then measures.
#   (B) FRONTIER/MID rungs (Copilot arm / CLI): generated on the other PC and STAGED as
#       runs/<slug>__<cond>/<rep>/project (the AX2 vendor pattern). This script then just
#       measures whatever is staged.
#
# Measurement per staged cell = static_cr.cjs (clean cross-capacity signal) + conformance_cr.cjs
# (behavioural oracle). Resumable: static_cr/conformance_cr skip cells already in their .json.
# Serial + memory-safe on the weak rung. NEVER kills claude.exe.
#
# Usage:
#   Measure everything staged:                 ./measure_cr.sh
#   Generate+measure a local ollama rung:      GEN_OLLAMA=1 OLLAMA_MODEL=qwen2.5-coder:7b REPS=3 ./measure_cr.sh
set -uo pipefail
cd "$(dirname "$0")"
LOG="measure_cr.log"; : >> "$LOG"
REPS="${REPS:-3}"
echo "=== CR measurement start $(date) ===" | tee -a "$LOG"

if [ "${GEN_OLLAMA:-0}" = "1" ]; then
  MODEL="${OLLAMA_MODEL:?set OLLAMA_MODEL, e.g. qwen2.5-coder:7b}"
  SLUG="$(echo "$MODEL" | sed 's/[^A-Za-z0-9]\+/-/g; s/^-//; s/-$//')"
  for COND in naive gs; do
    for REP in $(seq 0 $((REPS-1))); do
      CELL="${SLUG}__${COND}/${REP}"
      echo ">>> GEN $CELL $(date +%H:%M:%S)" | tee -a "$LOG"
      # one generation at a time; kill stray node between cells (never claude.exe)
      node ollama_generate_cr.cjs "$COND" "$REP" "$MODEL" >> "$LOG" 2>&1 || echo "    gen failed $CELL" | tee -a "$LOG"
      node materialize_cr.cjs "${SLUG}__${COND}" "$REP" >> "$LOG" 2>&1 || echo "    materialize failed $CELL" | tee -a "$LOG"
      taskkill //F //IM node.exe >/dev/null 2>&1 || true
    done
  done
fi

# Materialize any staged cell that has response-P*.md but no project/ yet (e.g. pulled ollama runs)
for d in runs/*__naive runs/*__gs; do
  [ -d "$d" ] || continue
  base="$(basename "$d")"
  for rep in "$d"/*/; do
    r="$(basename "$rep")"
    if ls "$rep"response-P*.md >/dev/null 2>&1 && [ ! -d "${rep}project" ]; then
      echo ">>> materialize staged $base/$r" | tee -a "$LOG"
      node materialize_cr.cjs "$base" "$r" >> "$LOG" 2>&1 || echo "    materialize failed $base/$r" | tee -a "$LOG"
    fi
  done
done

echo "=== static (clean signal) $(date) ===" | tee -a "$LOG"
node static_cr.cjs >> "$LOG" 2>&1 || echo "    static_cr failed" | tee -a "$LOG"
echo "=== conformance (oracle) $(date) ===" | tee -a "$LOG"
node conformance_cr.cjs >> "$LOG" 2>&1 || echo "    conformance_cr failed" | tee -a "$LOG"
echo "=== done $(date) — see static_cr.json + conformance_cr.json ===" | tee -a "$LOG"
echo "Next: compute Delta(m)=naive-gs per metric across ladder.json rungs and the monotone-trend test (PREREGISTRATION section 7)." | tee -a "$LOG"
