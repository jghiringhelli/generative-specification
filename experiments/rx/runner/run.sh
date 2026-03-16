#!/usr/bin/env bash
# RX Runner — generate → build → test → score via Claude CLI
#
# Usage:
#   ./runner/run.sh              full run (P1 + P2 + P3)
#   ./runner/run.sh --phase 1   infrastructure only
#   ./runner/run.sh --phase 2   features only (requires P1 complete)
#   ./runner/run.sh --phase 3   tests + evidence (requires P2 complete)
#   ./runner/run.sh --verify    score existing generated/ output only
#
# Prerequisites:
#   npm install -g @anthropic-ai/claude-code
#   ANTHROPIC_API_KEY set in environment
#   docker compose up -d postgres (from experiments/rx/)

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
RX_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
GENERATED_DIR="$RX_DIR/generated"
EVIDENCE_DIR="$RX_DIR/evidence"
SPEC_FILE="$RX_DIR/spec/conduit-gs.md"
PROMPT_DIR="$SCRIPT_DIR/prompts"

PHASE="all"
VERIFY_ONLY=false
while [[ $# -gt 0 ]]; do
  case $1 in
    --phase) PHASE="$2"; shift 2 ;;
    --verify) VERIFY_ONLY=true; shift ;;
    *) echo "Unknown argument: $1"; exit 2 ;;
  esac
done

# Claude CLI uses its own stored auth — ANTHROPIC_API_KEY optional if already logged in
if [[ -z "${ANTHROPIC_API_KEY:-}" ]]; then
  claude --version &>/dev/null || { echo "[rx] ERROR: claude CLI not authenticated. Run: claude login"; exit 1; }
  echo "[rx] Using claude CLI stored auth (no ANTHROPIC_API_KEY env var)"
fi
[[ -f "$SPEC_FILE" ]] || { echo "[rx] ERROR: spec not found at $SPEC_FILE"; exit 1; }
mkdir -p "$GENERATED_DIR" "$EVIDENCE_DIR"

run_session() {
  local name="$1" prompt_file="$2"
  echo "[rx] ── $name ────────────────────────────────────────"
  local full_prompt
  full_prompt="$(cat "$prompt_file")"$'\n\n'"$(cat "$SPEC_FILE")"
  cd "$GENERATED_DIR"
  claude -p "$full_prompt" \
    --dangerously-skip-permissions \
    --output-format text \
    2>&1 | tee "$EVIDENCE_DIR/${name}.log"
  cd "$RX_DIR"
}

run_p1() {
  run_session "p1-infrastructure" "$PROMPT_DIR/p1-infrastructure.md"
  cd "$GENERATED_DIR"
  npm install 2>&1 | tee "$EVIDENCE_DIR/build-log.txt"
  npx prisma migrate dev --name init 2>&1 | tee -a "$EVIDENCE_DIR/build-log.txt"
  npx tsc --noEmit 2>&1 | tee -a "$EVIDENCE_DIR/build-log.txt"
  cd "$RX_DIR"
  echo "[rx] P1 gate: passed"
}

run_p2() {
  run_session "p2-features" "$PROMPT_DIR/p2-features.md"
  cd "$GENERATED_DIR"
  npx tsc --noEmit 2>&1 | tee -a "$EVIDENCE_DIR/build-log.txt"
  npm audit --audit-level=high 2>&1 | tee -a "$EVIDENCE_DIR/build-log.txt" || { echo "[rx] FAIL: high CVEs"; exit 1; }
  cd "$RX_DIR"
  echo "[rx] P2 gate: passed"
}

run_p3() {
  run_session "p3-tests" "$PROMPT_DIR/p3-tests.md"
  cd "$GENERATED_DIR"
  DATABASE_URL="postgresql://rx_user:rx_password@localhost:5447/rx_conduit" \
    npx jest --json --outputFile="$EVIDENCE_DIR/jest-output.json" --forceExit 2>&1 \
    | tee -a "$EVIDENCE_DIR/p3-tests.log" || true
  cd "$RX_DIR"
}

run_score() {
  cat > "$EVIDENCE_DIR/run-metadata.json" <<EOF
{
  "runDate": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "model": "claude-opus-4-5",
  "specFile": "experiments/rx/spec/conduit-gs.md"
}
EOF
  npx ts-node score/score.ts \
    --jest "$EVIDENCE_DIR/jest-output.json" \
    --build "$EVIDENCE_DIR/build-log.txt" \
    --rubric score/rubric.json \
    --output "$EVIDENCE_DIR/score.json"
  echo ""
  echo "[rx] Evidence artifacts:"
  ls -la "$EVIDENCE_DIR/"
  echo ""
  echo "[rx] Commit: git add experiments/rx/evidence/ && git commit -m 'test(rx): run evidence $(date +%Y-%m-%d)'"
}

if [[ "$VERIFY_ONLY" == "true" ]]; then run_score; exit 0; fi

case "$PHASE" in
  all) run_p1; run_p2; run_p3; run_score ;;
  1)   run_p1 ;;
  2)   run_p2 ;;
  3)   run_p3; run_score ;;
  *)   echo "Invalid phase: $PHASE"; exit 2 ;;
esac
