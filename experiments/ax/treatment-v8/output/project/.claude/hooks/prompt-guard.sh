#!/usr/bin/env bash
# prompt-guard: runs on every user prompt (UserPromptSubmit).
# Two jobs:
#   1. Detect Tier 2/3 operation signals -> remind about operation-classification.md.
#   2. Detect structural task signals -> remind to read the sentinel first.
set -u
input=$(cat)
if command -v jq >/dev/null 2>&1; then
  user_prompt=$(echo "$input" | jq -r '.prompt // empty')
else
  user_prompt=$(echo "$input" | grep -o '"prompt":"[^"]*"' | cut -d'"' -f4 | head -1)
fi
lower=$(echo "$user_prompt" | tr '[:upper:]' '[:lower:]')
sensitive_signals=("drop table" "truncate" "delete from" "force push" "full resync"
  "backfill" "reset db" "disable rls" "service role" "bypass auth"
  "rm -rf" "drop database" "wipe data")
for signal in "${sensitive_signals[@]}"; do
  if [[ "$lower" == *"$signal"* ]]; then
    printf "🧭 prompt-guard: destructive signal detected (\"%s\").\n" "$signal"
    printf "   Before executing:\n"
    printf "   1. Check docs/operation-classification.md -- classify the operation (Tier 0-3).\n"
    printf "   2. If Tier 2+: confirm with the user before proceeding.\n"
    printf "   3. If Tier 3: require FORGECRAFT_ALLOW_DESTRUCTIVE=1 override + ADR.\n"
    break
  fi
done
structural_signals=("create a new" "add a new" "refactor" "migrate" "new feature"
  "new endpoint" "new module" "change architecture" "add table" "add column"
  "new component" "new service" "new repository")
for signal in "${structural_signals[@]}"; do
  if [[ "$lower" == *"$signal"* ]]; then
    printf "🧭 prompt-guard: structural task detected (\"%s\").\n" "$signal"
    printf "   Before coding:\n"
    printf "   1. Read CLAUDE.md (sentinel) -- architecture rules and prohibited ops.\n"
    printf "   2. Read the relevant section of docs/PRD.md or use-cases.md.\n"
    printf "   3. If decision is non-trivial -> propose an ADR before implementing.\n"
    printf "   4. If the change spans > 3 files -> propose a brief plan first.\n"
    break
  fi
done
exit 0
