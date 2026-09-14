#!/usr/bin/env bash
# AX2 Ollama arm — generate the weak-local capacity tier for RQ3.
# One model fully before the next (never both loaded: memory). Continue on a
# cell failure (a weak model failing IS data). Resumable: a done rep is skipped.
set -uo pipefail
cd "$(dirname "$0")"

K="${1:-3}"                       # reps per cell
MODELS=("llama3.1:8b" "llama3.2:3b")
CONDS=(naive control treatment)
LOG="run_ollama_arm.log"
echo "=== AX2 ollama arm start $(date) K=$K ===" | tee -a "$LOG"

for MODEL in "${MODELS[@]}"; do
  for COND in "${CONDS[@]}"; do
    for REP in $(seq 0 $((K-1))); do
      echo ">>> $MODEL $COND rep$REP $(date +%H:%M:%S)" | tee -a "$LOG"
      node ollama_generate.cjs "$COND" "$REP" "$MODEL" >> "$LOG" 2>&1 || echo "    (cell failed, continuing)" | tee -a "$LOG"
    done
  done
  # free the model between models
  curl -s http://127.0.0.1:11434/api/chat -d "{\"model\":\"$MODEL\",\"keep_alive\":0,\"messages\":[]}" >/dev/null 2>&1 || true
done
echo "=== AX2 ollama arm done $(date) ===" | tee -a "$LOG"
