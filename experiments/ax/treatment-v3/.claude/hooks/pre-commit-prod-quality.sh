#!/bin/bash
STAGED=$(git diff --cached --name-only --diff-filter=ACM)
SOURCE_FILES=$(echo "$STAGED" | grep -E '\.(py|ts|tsx|js|jsx)$' | grep -vE '(test_|\.test\.|\.spec\.|__tests__|tests/|fixtures/|mock|conftest)')
if [ -z "$SOURCE_FILES" ]; then exit 0; fi
VIOLATIONS=0
WARNINGS=0
echo "🔍 Scanning for production code anti-patterns..."
for file in $SOURCE_FILES; do
  if echo "$file" | grep -vqE '(config|settings|\.env)'; then
    if grep -nE '(localhost|127\.0\.0\.1|0\.0\.0\.0)' "$file" | grep -vE '(#|//|""")' > /tmp/violations 2>/dev/null; then
      if [ -s /tmp/violations ]; then
        echo "  ❌ $file — hardcoded URL/host"
        VIOLATIONS=$((VIOLATIONS + 1))
      fi
    fi
  fi
  if grep -nEi '\b(mock_data|fake_data|dummy_data|stub_response)' "$file" > /tmp/violations 2>/dev/null; then
    if [ -s /tmp/violations ]; then
      echo "  ❌ $file — mock/stub data in production code"
      VIOLATIONS=$((VIOLATIONS + 1))
    fi
  fi
  LINE_COUNT=$(wc -l < "$file")
  if [ "$LINE_COUNT" -gt 300 ]; then
    echo "  ⚠️  $file — $LINE_COUNT lines (max 300)"
    WARNINGS=$((WARNINGS + 1))
  fi
done
rm -f /tmp/violations
if [ $VIOLATIONS -gt 0 ]; then
  echo "❌ $VIOLATIONS violation(s) found — commit blocked."
  exit 1
fi
echo "🔍 Production quality scan passed"
