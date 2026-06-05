#!/usr/bin/env bash
# commit-msg: enforce conventional commit format
# ForgeCraft — generated hook

COMMIT_MSG_FILE="$1"
COMMIT_MSG=$(cat "$COMMIT_MSG_FILE")

# Skip merge commits and fixup commits
if echo "$COMMIT_MSG" | grep -qE "^(Merge|Revert|fixup!|squash!)"; then
  exit 0
fi

# Skip empty messages and comments-only
STRIPPED=$(echo "$COMMIT_MSG" | sed '/^#/d' | sed '/^$/d')
if [ -z "$STRIPPED" ]; then
  exit 0
fi

PATTERN="^(feat|fix|refactor|docs|test|chore|perf|ci|build|revert)(\([a-z0-9/_-]+\))?(!)?: .{1,72}"

if ! echo "$COMMIT_MSG" | grep -qE "$PATTERN"; then
  echo ""
  echo "  ✗ Commit message does not follow conventional commit format."
  echo ""
  echo "  Required format: <type>(<scope>): <description>"
  echo "  Types: feat | fix | refactor | docs | test | chore | perf | ci | build | revert"
  echo "  Examples:"
  echo "    feat(auth): add JWT refresh token support"
  echo "    fix(api): handle null response from payment gateway"
  echo "    docs: update README with setup instructions"
  echo ""
  echo "  Your message: $COMMIT_MSG"
  echo ""
  exit 1
fi

# ── TDD [RED]/[GREEN] phase enforcement ────────────────────────────────
SUBJECT=$(echo "$COMMIT_MSG" | head -1)
BODY=$(echo "$COMMIT_MSG" | tail -n +3)
TYPE=$(echo "$SUBJECT" | sed -E 's/^([a-z]+).*/\1/')
SCOPE=$(echo "$SUBJECT" | sed -nE 's/^[a-z]+\(([^)]+)\).*/\1/p')

# If subject contains [GREEN] and type is feat|fix, verify preceding [RED] commit
if echo "$SUBJECT" | grep -q '\[GREEN\]'; then
  if echo "$TYPE" | grep -qE '^(feat|fix)$'; then
    # Allow explicit tdd-skip annotation in body
    if echo "$BODY" | grep -q '\[tdd-skip:'; then
      echo "  ⚠️  TDD skip recorded: $(echo "$BODY" | grep '\[tdd-skip:' | head -1)"
    else
      # Look for a test(scope): [RED] commit in recent history (7 days)
      SEARCH_SCOPE="${SCOPE:-}"
      if [ -n "$SEARCH_SCOPE" ]; then
        RED_FOUND=$(git log --since="7 days ago" --pretty="%s" 2>/dev/null | grep -E "^test\(${SEARCH_SCOPE}\):.*\[RED\]" | head -1)
      else
        RED_FOUND=$(git log --since="7 days ago" --pretty="%s" 2>/dev/null | grep -E "^test[:(].*\[RED\]" | head -1)
      fi
      if [ -z "$RED_FOUND" ]; then
        echo ""
        echo "  ✗ TDD [GREEN] gate: no preceding test(${SCOPE:-*}): [RED] commit found in the last 7 days."
        echo ""
        echo "  A [GREEN] commit must follow a [RED] test commit for the same scope."
        echo "  Expected: test(${SCOPE:-scope}): [RED] <description>"
        echo ""
        echo "  To bypass (document the reason): add [tdd-skip: reason] in the commit body."
        echo "  Example body line: [tdd-skip: brownfield module without test harness]"
        echo ""
        exit 1
      fi
      echo "  ✅ TDD gate: found preceding RED commit — $RED_FOUND"
    fi
  fi
fi

exit 0
