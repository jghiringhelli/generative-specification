# GS Gate Template — the hard-won quality gates, portable

> The durable residue of ForgeCraft (deprecated Sep 2026): the set of deterministic gates that catch the GS
> pathology catalog, extracted from `forgecraft-mcp/src/analyzers/` and aligned with the VairixDX reference
> harness and the 29-pathology diagnostic catalog. This is a **template a model wires from the spec**, not a
> runtime. Each gate is a **standard CI hook** (no proprietary tool). The Andon keystone holds: an LLM may
> author code, but a **non-LLM checker verifies it** — these gates are those checkers. Wire them as pre-commit
> hooks + commit-msg hook + CI, blocking where marked.

## How to use
Point a capable assistant at the GS white paper + field guide and this template, and ask it to wire the
applicable gates for the project's stack (the tools below are the JS/TS defaults; the assistant substitutes
per language). Enforce **blocking** gates as pre-commit/CI failures; **advisory** gates as warnings that feed
the ratchet (each new defect that slips becomes a new blocking gate — the discipline only tightens).

## The gates, by property

| Property | Gate (what it checks) | Standard tool | Threshold / rule | Level | Pathology it prevents |
|---|---|---|---|---|---|
| **Bounded** (keystone) | file length | loc probe / wc | file <= ~300 lines | blocking | God Class |
| **Bounded** | function length + params | eslint (`max-lines-per-function`, `max-params`) | function bounded; params small | blocking | Long Method |
| **Bounded** | cyclomatic complexity | eslint (`complexity`) | function CC <= 10 | blocking | unmaintainable branches |
| **Bounded** | code duplication | jscpd | duplication under threshold (~5-10%) | advisory->blocking | copy-paste sprawl |
| **Bounded** | dead code | ts-prune / knip | no unused exports/functions | advisory | vestigial code |
| **Bounded / Composable** | circular imports | madge / dependency-cruiser | no cycles | blocking | tangle |
| **Composable** | layer boundaries | dependency-cruiser (`depcruise`) | controller !-> repo; domain pure; ports/adapters respected | blocking | Architectural Drift |
| **Composable** | frontend boundaries | eslint-plugin-boundaries | feature/layer isolation | blocking | component reinvention |
| **Verifiable** | type strictness | tsc `--strict`, no `any` | strict passes; no explicit `any` | blocking | Implicit Contract Syndrome |
| **Verifiable** | line/branch coverage | c8 / istanbul (`coverage-summary.json`) | line coverage >= target (e.g. 70%+), branch tracked | blocking | vacuous tests |
| **Verifiable** | mutation score | stryker | mutation score >= target | advisory | roulette tests |
| **Verifiable** | test pyramid + real coverage | jest/vitest + harness | unit/integration/e2e present; tests hit real code | advisory | test theater |
| **Executable** | behavioural probes vs live | Hurl (or Postman/newman) against a running service | acceptance criteria pass on the deployed app | blocking | "compiles but fails integration" |
| **Executable** | module boot smoke | a boot script in CI | every module imports/boots | blocking | dependency-injection breakage |
| **Defended** | secrets scan | gitleaks / trufflehog | no secrets in diff | blocking | leaked credentials |
| **Defended** | dependency audit | `npm audit` / osv-scanner | no high/critical vulns | blocking | AI Security Blindspot |
| **Defended** | forbidden patterns | eslint custom rules / grep hooks | no eval, no direct-DB-in-controller, no unsafe patterns | blocking | Shadow AI / Phase Collapse |
| **Self-describing** | screaming architecture | folder-structure check | directory names announce the domain; predictable placement | advisory | Implicit Architecture |
| **Self-describing** | the sentinel present | file check | a CLAUDE.md sentinel tree exists and routes | advisory | Session Amnesia |
| **Auditable** | conventional commits | commitlint (commit-msg hook) | commits parse by type/scope | blocking | Undisciplined Commits |
| **Auditable** | TDD phase order | commit-history hook | `test:[RED]` precedes `feat:` | advisory | untested features |
| **Auditable** | decision records | presence check | ADR/EDR for architecture/spec decisions | advisory | undocumented decisions |
| **Reproducible** (CORE) | regression fixtures + determinism | jest snapshots / seeded runs | flaky tests fail CI; fixtures pinned | advisory | non-deterministic tests |
| **Observable** (CORE) | structured-logging / trace presence | lint/presence check | key paths emit structured logs | **not yet gated** (gateable next) | (report as not-yet-evaluated) |

## Notes
- **Blocking vs advisory** mirrors the VairixDX manifest's "% structurally defended" (blocking + advisory over
  total). The Readiness Report scores a codebase by which of these gates are actually enforced.
- **Observable** is the honest ungated gap today (see `soma/docs/gtm/forge-dx-scoring-map.md`); Reproducible is
  thin/partial. Do not invent scores for ungated properties — mark "not yet evaluated".
- **The ratchet:** community-contributed gates (each derived from a real past incident) accumulate and only
  grow. That accumulation is the value ForgeCraft-the-product could not carry but a shared template can.
- Provenance: extracted from `forgecraft-mcp/src/analyzers/{probes,scorers,folder-structure,anti-pattern,completeness}.ts`
  (deprecated) + the VairixDX reference (internal) + the 29-pathology catalog (`pragmaworks.dev/diagnostico`).
