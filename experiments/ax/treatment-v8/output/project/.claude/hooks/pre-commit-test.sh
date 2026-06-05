#!/bin/bash
# pre-commit: run only affected tests using --changed flag.
# Full suite runs pre-push. TDD_RED=1 bypasses for [RED] commits.

# TDD RED bypass: skip test run when committing a failing test (RED phase)
if [ "${TDD_RED:-0}" = "1" ]; then
  echo "🔴 TDD_RED=1: bypassing test run for RED commit."
  exit 0
fi

# Collect staged files once.
STAGED=$(git diff --cached --name-only --diff-filter=ACM)

# Determine what kinds of files are staged.
CODE_STAGED=0
while IFS= read -r file; do
  if echo "$file" | grep -qE '^(src|tests?|lib|app)/'; then
    CODE_STAGED=1
    break
  elif echo "$file" | grep -qE '\.(ts|tsx|js|jsx|py|rs)$'; then
    CODE_STAGED=1
    break
  fi
done <<< "$STAGED"

# If no code files at all are staged (docs-only, config-only, etc.) skip the run.
if [ "$CODE_STAGED" -eq 0 ]; then
  echo "🧪 No code files staged — skipping test run."
  exit 0
fi

echo "🧪 Running affected tests (--changed)..."
if [ -f "package.json" ]; then
  if grep -q '"vitest"' package.json 2>/dev/null; then
    npx vitest run --changed --passWithNoTests 2>&1
    if [ $? -ne 0 ]; then
      echo "❌ Affected tests failed."
      echo "   To bypass for a RED commit: TDD_RED=1 git commit ..."
      exit 1
    fi
    echo "  ✅ Affected tests passed"
  elif grep -q '"jest"' package.json 2>/dev/null; then
    npx jest --passWithNoTests --onlyChanged --silent 2>&1
    if [ $? -ne 0 ]; then
      echo "❌ Jest affected tests failed."
      exit 1
    fi
    echo "  ✅ Jest affected tests passed"
  fi
fi
if [ -f "pyproject.toml" ] || [ -f "setup.py" ]; then
  if command -v pytest &> /dev/null; then
    # pytest doesn't have --changed; run only staged test files as best-effort
    STAGED_TESTS=$(echo "$STAGED" | grep -E '(test_.*\.py|.*_test\.py)$')
    if [ -n "$STAGED_TESTS" ]; then
      pytest --tb=short --quiet $STAGED_TESTS 2>&1
      if [ $? -ne 0 ]; then
        echo "❌ Python tests failed."
        exit 1
      fi
      echo "  ✅ Python staged tests passed"
    else
      echo "🧪 No Python test files staged — skipping pytest."
    fi
  fi
fi
if [ -f "Cargo.toml" ]; then
  cargo test --quiet 2>&1
  if [ $? -ne 0 ]; then
    echo "❌ Rust tests failed."
    exit 1
  fi
  echo "  ✅ Rust tests passed"
fi
echo "🧪 Affected tests passed"
