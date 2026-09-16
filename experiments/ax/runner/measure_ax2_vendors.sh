#!/usr/bin/env bash
# Measure the AX2 cross-vendor cells (RQ2). They are agent-written project trees
# (no response.md), so no materialize step: stage each project/ into the runner's
# runs/ under a normalized name and run measure.cjs directly. Resumable (skip cells
# with metrics.json), continue on error. No mutation (too heavy for 45 cells);
# coverage stays best-effort. One cell at a time = memory-safe.
set -uo pipefail
cd "$(dirname "$0")"
LOG="measure_ax2_vendors.log"; : > "$LOG"
AX2="../../ax2/runs"   # relative to runner/ (runner -> ax -> experiments, then ax2/runs)
VENDORS=(gpt-openai gemini-google claude-copilot)
# frozen-folder condition -> canonical name (naive/control/treatment) so aggregate_ax2 matches
MAP=("C1-naive:naive" "C2-expert:control" "C3-gs:treatment")

echo "=== AX2 vendor measurement start $(date) ===" | tee -a "$LOG"
for V in "${VENDORS[@]}"; do
  for M in "${MAP[@]}"; do
    SRCCOND="${M%%:*}"; NORM="${M##*:}"
    DSTCOND="${V}__${NORM}"
    for REP in 0 1 2 3 4; do
      SRC="$AX2/$V/$SRCCOND/rep$REP/project"
      [ -d "$SRC" ] || { echo "  miss $V/$SRCCOND/rep$REP" | tee -a "$LOG"; continue; }
      DST="runs/$DSTCOND/$REP"
      if [ -f "$DST/metrics.json" ]; then echo "  skip $DSTCOND/$REP (done)" | tee -a "$LOG"; continue; fi
      mkdir -p "$DST"
      [ -d "$DST/project" ] || cp -r "$SRC" "$DST/project"
      echo ">>> $DSTCOND/$REP $(date +%H:%M:%S)" | tee -a "$LOG"
      node measure.cjs "$DSTCOND" "$REP" >> "$LOG" 2>&1 || echo "    measure failed" | tee -a "$LOG"
    done
  done
done
echo "=== aggregate $(date) ===" | tee -a "$LOG"
node aggregate_ax2.cjs >> "$LOG" 2>&1 || true
echo "=== done $(date) — see results_ax2.csv ===" | tee -a "$LOG"
