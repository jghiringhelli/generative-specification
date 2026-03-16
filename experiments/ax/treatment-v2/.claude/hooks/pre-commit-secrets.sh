#!/bin/bash
PATTERNS=(
  'AKIA[0-9A-Z]{16}'
  'password\s*=\s*["\x27][^"\x27]+'
  'BEGIN RSA PRIVATE KEY'
  'sk-[a-zA-Z0-9]{48}'
  'ghp_[a-zA-Z0-9]{36}'
)
STAGED=$(git diff --cached --name-only)
for file in $STAGED; do
  for pattern in "${PATTERNS[@]}"; do
    if grep -qE "$pattern" "$file" 2>/dev/null; then
      echo "❌ Potential secret found in $file matching pattern"
      exit 1
    fi
  done
done
