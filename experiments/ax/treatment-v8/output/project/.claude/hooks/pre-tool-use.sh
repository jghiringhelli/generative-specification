#!/usr/bin/env bash
# pre-tool-use: block Tier 3 destructive operations.
# Invoked by Claude Code PreToolUse hook before Bash tool executes.
set -u
input=$(cat)
if command -v jq >/dev/null 2>&1; then
  tool_name=$(echo "$input" | jq -r '.tool_name // empty')
  cmd=$(echo "$input" | jq -r '.tool_input.command // empty')
else
  tool_name=$(echo "$input" | grep -o '"tool_name":"[^"]*"' | cut -d'"' -f4)
  cmd=$(echo "$input" | grep -o '"command":"[^"]*"' | cut -d'"' -f4)
fi
[[ "$tool_name" != "Bash" ]] && exit 0
[[ "${FORGECRAFT_ALLOW_DESTRUCTIVE:-0}" == "1" ]] && exit 0
block() {
  echo "🚫 BLOCKED by pre-tool-use hook: $1" >&2
  echo "   Command: $cmd" >&2
  echo "   See docs/operation-classification.md" >&2
  echo "   To override (use with care): FORGECRAFT_ALLOW_DESTRUCTIVE=1 <command>" >&2
  exit 2
}
[[ "$cmd" =~ DROP[[:space:]]+TABLE ]] && block "DROP TABLE — Tier 3 irreversible"
[[ "$cmd" =~ TRUNCATE[[:space:]] ]] && block "TRUNCATE — Tier 3 irreversible"
if [[ "$cmd" =~ git[[:space:]]+push ]] && [[ "$cmd" =~ (-f|--force) ]] && [[ "$cmd" =~ (main|master) ]]; then
  block "force push to main — Tier 3 irreversible"
fi
if [[ "$cmd" =~ rm[[:space:]]+-rf ]] && [[ "$cmd" =~ (src|docs|migrations|\.git)[/[:space:]] ]]; then
  block "rm -rf on protected path — Tier 3"
fi
if [[ "$cmd" =~ git[[:space:]]+push[[:space:]]+origin[[:space:]]+(main|master) ]]; then
  echo "⚠️  Direct push to main detected. Use a PR instead." >&2
fi
exit 0
