#!/usr/bin/env bash
# post-edit: enforce Bounded property after every file write/edit.
set -u
input=$(cat)
if command -v jq >/dev/null 2>&1; then
  file_path=$(echo "$input" | jq -r '.tool_input.file_path // .tool_input.path // empty')
else
  file_path=$(echo "$input" | grep -o '"file_path":"[^"]*"' | cut -d'"' -f4 | head -1)
fi
[[ -z "$file_path" ]] && exit 0
[[ ! -f "$file_path" ]] && exit 0
echo "$file_path" | grep -qE '(node_modules|pnpm-lock|package-lock|\.d\.ts$|\.min\.|/generated/)' && exit 0
line_count=$(wc -l < "$file_path")
if [[ "$line_count" -gt 300 ]]; then
  echo "⚠️  BOUNDED: $file_path has $line_count lines (max 300). Extract to sub-modules before commit." >&2
fi
if [[ "$file_path" =~ \.(ts|tsx|js|jsx)$ ]] && [[ ! "$file_path" =~ \.(test|spec)\. ]] && [[ ! "$file_path" =~ /scripts/ ]]; then
  grep -q 'console\.\(log\|debug\)' "$file_path" && echo "⚠️  console.log in $file_path — use structured logger" >&2
  grep -nE '^[^/]*:\s*any\b|\bas\s+any\b' "$file_path" >/dev/null 2>&1 && echo "⚠️  'any' type in $file_path — prefer 'unknown' + narrowing" >&2
fi
exit 0
