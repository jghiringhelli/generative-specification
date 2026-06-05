<!-- ForgeCraft sentinel: spec | 2026-06-04 | npx forgecraft-mcp refresh . --apply to update -->

## Active Release Phase: development
Your phase determines which gates are blocking NOW. Apply every requirement in your phase row.

| Phase | Required now — blocking | Not required yet |
|---|---|---|
| **development** | Unit + integration + lint + tsc --noEmit + npm audit (no HIGH/CRITICAL) | DAST, load/stress, penetration, mutation score gate |
| **pre-release / staging** | All development requirements + smoke → DAST (OWASP ZAP / Burp Suite) + load test at 2× peak (k6 / Locust) + chaos/resilience (Toxiproxy) + mutation score ≥ 80% on changed code | Manual penetration test, full a11y audit |
| **release-candidate** | All staging requirements + manual penetration test (OWASP Top 10, JWT vectors, BOLA/IDOR) + full a11y audit (if UI) + compatibility matrix + mutation score ≥ 80% overall + zero unresolved HIGH/CRITICAL CVEs | Production canary |
| **production** | Canary deploy + automatic rollback on error rate spike + synthetic health probes + incident runbook verified | — |

**Current active phase: `development`**

> If `pre-release`/`release-candidate`: hardening tests (load, DAST, penetration) are REQUIRED this session, not deferred. Do not merge without completing your phase's gate.

## ADR Protocol — Persistent Memory
Every non-obvious architectural decision produces an ADR before implementation.

### Format (minimal)
```markdown
# ADR-NNNN: [Title]
**Date**: YYYY-MM-DD
**Status**: Proposed | Accepted | Deprecated | Superseded by ADR-NNNN
## Context / Decision / Alternatives Considered / Consequences
```

### When to write
Non-obvious choice · tradeoff (perf vs simplicity, security vs UX) · decided after alternatives · future sessions might "fix" it · any change to the constitution.

- Path `docs/adrs/ADR-0001-short-title.md` (zero-padded, kebab). Immutable once Accepted; supersede with a new ADR.
- **Emit in P1** as fenced code blocks (a referenced-but-unwritten ADR is an Auditable violation). Minimum: ADR-0001-stack, ADR-0002-authentication (auth strategy + hashing), ADR-0003-architecture. Real content, not "TBD".
- Also emit **`CHANGELOG.md`** in P1 (Keep a Changelog format) documenting the P1 decisions under `[Unreleased] > Added`.
- Session start: read open ADRs first. Modifying an ADR-governed boundary without reading it = drift, even if it compiles.

## Use Cases — Triple Derivation
One precise use case derives three artifacts:
1. **Implementation contract** — actor/precondition/trigger/postcondition is the spec the service layer is written against.
2. **Acceptance test** — same artifact in test dialect (Playwright/Cucumber). Hard to write the test = underspecified use case.
3. **User documentation** — the same content narrated for a non-technical reader; a rendering pass, not a rewrite.

### Format (minimal)
```markdown
## UC-NNN: [Action] [Domain Object]
**Actor**: / **Precondition**: / **Trigger**:
**Main Flow**: 1. ... 2. ...
**Postcondition**: / **Error Cases**: [Condition]: [response]
**Acceptance Criteria** (machine-checkable): - [ ] ...
```

Diagnostic: write the use case before any service method. Can't state pre/postcondition precisely = don't understand the behavior well enough to implement it.
