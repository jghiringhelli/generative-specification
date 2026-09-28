#!/usr/bin/env bash
# run_bx.sh [K]  — k replications of the comprehension probe on each twin (M, D), read-breadth instrumented.
BR="$(cd "$(dirname "$0")" && pwd)"
K="${1:-5}"
TASK="${2:-comp}"
PROMPT="${3:-COMPREHENSION_PROBE.md}"
mkdir -p "$BR/runs"
echo "TX read-breadth batch: K=$K per twin, task=$TASK, prompt=$PROMPT"
for rep in $(seq 0 $((K-1))); do
  for twin in M D; do
    out="$BR/runs/${twin}_${TASK}_${rep}.json"
    if [ -f "$out" ]; then echo "[rep $rep $twin] skip (exists)"; continue; fi
    printf "[rep %s %s] " "$rep" "$twin"
    node "$BR/run_probe.cjs" "$BR/$twin" "$BR/$PROMPT" "$out"
  done
done
echo "=================================================="
node "$BR/agg_bx.cjs" "$BR/runs" "$TASK"
