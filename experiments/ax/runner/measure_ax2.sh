#!/usr/bin/env bash
# AX2 uniform measurement — every tier through the SAME materialize2 + measure.
# 1) copy the Claude baseline responses into model-namespaced dirs (no re-gen, free)
#    so Claude is measured by materialize2 exactly like the Ollama tiers (dual report);
#    AX's own runs/<cond>/<rep> stay pristine.
# 2) materialize2 + measure every runs/<slug>__<cond>/<rep>. Resumable (skip if
#    metrics.json exists), continue on error.
set -uo pipefail
cd "$(dirname "$0")"
LOG="measure_ax2.log"; : > "$LOG"
CONDS=(naive control treatment)
CLAUDE_SLUG="claude-sonnet-4-5"

echo "=== stage Claude baseline into ${CLAUDE_SLUG}__* ($(date)) ===" | tee -a "$LOG"
for COND in "${CONDS[@]}"; do
  for REP in 0 1 2 3 4; do
    SRC="runs/$COND/$REP"
    [ -f "$SRC/meta.json" ] || continue
    DST="runs/${CLAUDE_SLUG}__${COND}/$REP"
    mkdir -p "$DST"
    cp "$SRC"/response-P*.md "$DST"/ 2>/dev/null || true
    cp "$SRC/meta.json" "$DST/meta.json" 2>/dev/null || true
  done
done

echo "=== materialize2 + measure every AX2 cell ($(date)) ===" | tee -a "$LOG"
for D in runs/*__*/; do
  COND=$(basename "$D")
  for REPDIR in "$D"*/; do
    REP=$(basename "$REPDIR")
    [[ "$REP" =~ ^[0-9]+$ ]] || continue
    [ -f "$REPDIR/response-P1.md" ] || continue
    if [ -f "$REPDIR/metrics.json" ]; then echo "  skip $COND/$REP (done)" | tee -a "$LOG"; continue; fi
    echo ">>> $COND/$REP $(date +%H:%M:%S)" | tee -a "$LOG"
    node materialize2.cjs "$COND" "$REP" >> "$LOG" 2>&1 || echo "    materialize2 failed" | tee -a "$LOG"
    node measure.cjs "$COND" "$REP" >> "$LOG" 2>&1 || echo "    measure failed" | tee -a "$LOG"
  done
done
echo "=== measure_ax2 done ($(date)) ===" | tee -a "$LOG"
node aggregate_ax2.cjs >> "$LOG" 2>&1 || true
echo "wrote results_ax2.csv" | tee -a "$LOG"
