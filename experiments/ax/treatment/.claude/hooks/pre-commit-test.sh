#!/bin/bash
COVERAGE_MIN=80
echo "🧪 Running tests with coverage..."
if [ -f "package.json" ]; then
  if grep -q '"vitest"' package.json 2>/dev/null; then
    npx vitest run --reporter=verbose 2>&1
    if [ $? -ne 0 ]; then
      echo "❌ Tests failed."
      exit 1
    fi
    echo "  ✅ Tests passed"
  elif grep -q '"jest"' package.json 2>/dev/null; then
    npx jest --passWithNoTests --coverage \
      --coverageThreshold="{\"global\":{\"lines\":$COVERAGE_MIN}}" \
      --silent 2>&1
    if [ $? -ne 0 ]; then
      echo "❌ Jest tests failed or coverage below ${COVERAGE_MIN}%."
      exit 1
    fi
    echo "  ✅ Jest tests passed"
  fi
fi
if [ -f "pyproject.toml" ] || [ -f "setup.py" ]; then
  if command -v pytest &> /dev/null; then
    pytest --tb=short --quiet --cov=src --cov-fail-under=$COVERAGE_MIN 2>&1
    if [ $? -ne 0 ]; then
      echo "❌ Tests failed or coverage below ${COVERAGE_MIN}%."
      exit 1
    fi
    echo "  ✅ Python tests passed"
  fi
fi
echo "🧪 All tests passed"
