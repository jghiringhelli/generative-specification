<!-- ForgeCraft sentinel: protocols | 2026-06-04 | npx forgecraft-mcp refresh . --apply to update -->

## Dependency Registry
- File: **`docs/approved-packages.md`** — emit in P1, update on every add/upgrade. Columns: Package, Version range, Purpose, Alternatives rejected, Rationale, Audit status.
- Before adding any package: run the audit command (table) for CVEs. HIGH/CRITICAL → pick an alternative and document the rejection. No clean alternative → ADR naming the approver.
- After adding: add a row with audit status.
- Commit gate: pre-commit hook runs audit; HIGH/CRITICAL blocks. Not in the hook = gate does not exist.
- Version pins live in the committed lockfile (package-lock.json, uv.lock, Cargo.lock).

| Ecosystem | Audit command | Threshold |
|---|---|---|
| npm | `npm audit --audit-level=high` | HIGH/CRITICAL |
| pnpm | `pnpm audit --audit-level=high` | HIGH/CRITICAL |
| yarn | `yarn npm audit --severity high` | HIGH/CRITICAL |
| pip | `pip-audit --fail-on-severity high` | HIGH/CRITICAL |
| uv | `uv audit` | HIGH/CRITICAL |
| Rust | `cargo audit` | HIGH/CRITICAL |
| Go | `govulncheck ./...` | Any direct |
| Maven | `mvn dependency-check:check -DfailBuildOnCVSS=7` | CVSS ≥ 7 |
| Ruby | `bundle audit` | HIGH/CRITICAL |

## Adversarial Testing Posture
- Write tests that FAIL on incorrect code, not tests that pass on any reasonable impl. Hard to make fail = underspecified.
- Name as behaviors: `rejects_expired_tokens` not `test_validate_token`; `returns_empty_list_not_null_when_no_results` not `test_query`.
- Per public function/endpoint, cover: valid boundaries (min/max/zero/single) · invalid boundaries (below/above/empty/null) · constraint violations (negative balance, future birth date) · ordering/concurrency · authorization boundaries.
- Happy-path-only suite is documentation, not spec. Every surviving mutant = a missing adversarial test.

## Property-Based Testing
Add property tests for: pure functions with wide input domains (serialization, parsing, math, sorting); encoder/decoder pairs (`decode(encode(x)) === x`); sort idempotence (`sort(sort(xs)) === sort(xs)`); financial calculations (bounded results for all valid inputs).

| Ecosystem | Tool |
|---|---|
| TS/JS | `fast-check` |
| Python | `hypothesis` |
| Java/Kotlin | `jqwik` / `kotest` |
| Go | `gopter` / `rapid` |
| Rust | `proptest` |
| Scala | `scalacheck` |

A property failure is a bug — add the failing input as a regression example test, do not suppress.

## Clarification Protocol
Before writing code for any new feature or significant change:
- If the request implies architectural trade-offs that are not explicit, **ask one targeted
  question** before proceeding. Do not silently choose an architecture.
- If the domain model is ambiguous (cardinality, ownership, event ordering, shared state),
  state your assumption and ask for confirmation before implementing.
- If the request has two or more meaningfully different interpretations, present the options
  briefly and ask — do not guess and hide the choice.
- Do NOT ask about mechanical details (naming conventions, file placement, test structure) —
  apply the conventions already in this document without asking.
- Maximum one clarification round. If told "use your judgment," proceed with the most
  conservative interpretation and record the assumption in a code comment or new ADR.

## Feature Completion Protocol
1. **Verify** (local): `npx forgecraft-mcp verify .` (or `npm test` + manual HTTP check). Not done until it passes; don't proceed to docs on failure.
2. **Commit** (code only) after verify passes: `feat(scope): <description>`. Triggers CI + staging deploy.
3. **Smoke gate**: after staging deploy, `npx playwright test --config playwright.smoke.config.ts --grep @smoke`. On failure: revert the deploy, do not cascade docs.
4. **Doc sync cascade** in order (skip non-existent): spec.md → docs/adrs/ (if new decision) → docs/diagrams/c4-*.md → docs/diagrams/sequence|state|flow-*.md → docs/TechSpec.md → docs/use-cases.md → Status.md (always). Diagrams written to disk as real Mermaid (named participants/states/nodes); `<!-- UNFILLED -->` is a gap, not a diagram.

## MCP-Powered Tooling
### CodeSeeker — graph-powered code intelligence (hybrid vector+text+path, RRF)
- Semantic search (beyond grep), graph traversal (imports/calls/extends), auto-detected standards, `get_file_context` contextual reads.
- Auto-indexes on first search (~30s–5min). Most valuable on 10K+ file projects.
- Install: `npx codeseeker install --vscode` — https://github.com/jghiringhelli/codeseeker

## Engineering Preferences
These calibrate the AI assistant's judgment on subjective trade-offs.
- **DRY is important** — flag repetition aggressively.
- **Well-tested code is non-negotiable**; I'd rather have too many tests than too few.
- **"Engineered enough"** — not under-engineered (fragile, hacky) and not over-engineered
  (premature abstraction, unnecessary complexity).
- **Handle more edge cases**, not fewer; thoughtfulness > speed.
- **Bias toward explicit over clever** — readability wins over brevity.
- When in doubt, ask rather than assume.

## Agent Mechanical Constraints — Non-Negotiable Overrides
1. **Dead code first**: before any refactor on a file > 300 LOC, strip dead props/exports/imports/logs and commit `chore(scope): strip dead code` separately.
2. **Phase limit — 5 files max** per response. Complete a phase, verify compile+tests, await approval before the next. (Compaction fires ~167K tokens and discards intermediate reasoning.)
3. **Senior dev override**: explicitly counter the "simplest approach / don't refactor beyond ask" defaults when quality requires — "What would a perfectionist senior reject in review? Fix all of it."
4. **Sub-agent parallelism**: for > 5 independent files, launch parallel sub-agents (5–8 files each) for isolated context windows.
5. **File read budget — 2,000-line cap** (silent truncation beyond). For files > 500 LOC, read in `offset`/`limit` chunks.
6. **Tool result truncation**: results > ~50K chars truncate to a 2K preview. On suspiciously few results, re-run narrower and state when truncation may have occurred.
7. **Grep is not an AST**: on rename/signature change, search separately for direct calls, type-level refs, string literals, dynamic imports/`require()`, re-exports/barrels (`index.ts`/`__init__.py`), and test files/mocks.

## Code Generation — Verify Before Returning
Show the evidence — do not claim without running.
1. **Compile**: `tsc --noEmit` / `mypy` / equiv — 0 errors.
2. **Test suite**: full run (`jest --runInBand`, `pytest`) — 0 failures.
3. **Interface consistency**: when changing a signature, fix ALL callers in the same pass (else oscillation).
4. **DRY check**: duplication < 5% (min-tokens 50) on `src/` — see project-gates.yaml `no-code-duplication`; extract above threshold.
5. **Interface completeness**: every interface method implemented by its concrete class — see `interface-contract-completeness`.

Required evidence:
```
tsc --noEmit: 0 errors
Jest: 109 passed, 0 failed, 11 suites
```

### Test-setup pitfalls (TS/Prisma)
- Use `prisma db push --accept-data-loss`, not `migrate deploy` (no-ops without a migrations folder).
- Reset via ordered `deleteMany()` in FK order, not `DROP SCHEMA` (pg error 42601 on multi-statement).
- JWT_SECRET ≥ 32 chars (HS256) in test env.

## Known Pitfalls
Recurring type errors and runtime traps specific to this project's stack.
Resolve exactly as documented — no `any` casts, ignore directives, or unlisted workarounds.

### jsonwebtoken — `expiresIn` is not assignable from a plain `string`
`@types/jsonwebtoken@^9` types `SignOptions['expiresIn']` as `number | ms.StringValue`
(a template-literal union like `` `${number}d` ``), not `string`. `process.env.JWT_EXPIRY`
is `string | undefined`, so it is **not** directly assignable. Validate the value first,
then assert through the target type (this is a *typed* assertion, not `any`):
```ts
// ❌ wrong — TS2322: 'string' not assignable to 'number | StringValue | undefined'
const options: SignOptions = { expiresIn: process.env.JWT_EXPIRY };
```
```ts
// ✅ correct — see src/config/env.ts (validated, then cast through the type)
import type { SignOptions } from 'jsonwebtoken';
const JWT_EXPIRY = (process.env.JWT_EXPIRY ?? '7d') as SignOptions['expiresIn'];
```

### jsonwebtoken — CommonJS package under ESM/NodeNext (ADR-0002)
`jsonwebtoken` is CommonJS; **named** ESM imports break at runtime. Use the default import:
```ts
// ❌ wrong — throws at runtime under NodeNext
import { sign, verify } from 'jsonwebtoken';
```
```ts
// ✅ correct
import pkg from 'jsonwebtoken';
const { sign, verify } = pkg;
```
