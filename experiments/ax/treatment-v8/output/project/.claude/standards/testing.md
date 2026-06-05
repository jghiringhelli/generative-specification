<!-- ForgeCraft sentinel: testing | 2026-06-04 | npx forgecraft-mcp refresh . --apply to update -->

## Testing Pyramid
Unit 60-75% (fast, isolated, every public fn) · Integration 20-30% (real deps at boundaries) · E2E 5-10% (core journeys only).

### Coverage Targets
- Overall: 80% line (blocks commit). New/changed: 90% on diff. Critical paths (auth, data pipelines, financial): 95%+.
- Mutation score (MSI): overall ≥ 65% (blocks PR merge), new/changed ≥ 70% on diff.
- Line coverage AND MSI both required (80% line can coexist with 58% MSI). Run mutation after each test batch. Tooling: stryker-mutator (JS/TS), mutmut (Python), Pitest (Java).

### Test Rules
- Test name = spec: `test_rejects_duplicate_member_ids` not `test_validation`.
- No empty catch, no `assert True`, no tests that can't fail.
- Colocate `[module].test.[ext]` or mirror src in `tests/`. Flaky tests are bugs — fix or quarantine.
- Run Stryker per module after writing its tests; surviving mutants = missing assertions.

### Test Doubles
- Stub (canned data), Spy (record+assert calls), Fake (in-memory working impl), Mock (preprogrammed expectations — use sparingly). Prefer stubs/fakes.
- Test data via Builder/Factory (`UserBuilder.anAdmin().build()`), one per entity, centralized in `tests/builders/`. No scattered literals.
- Property tests (fast-check, Hypothesis) for pure functions: assert invariants, not examples. Complement example tests.

## Test-Driven Development (TDD)
- **RED**: write a failing test, run it, confirm it fails (if it passes, the test is wrong).
- **GREEN**: minimum code to pass. No more.
- **REFACTOR**: clean up while green; no new behavior.
Repeat for every feature, function, and bug fix.

- Tests are specs: write against expected behavior, never current implementation. Never weaken an assertion to match the code. Never write after-the-fact tests that lock in unverified behavior.
- Bug fix: starts with a failing reproducing test (fails before fix, passes after). Can't reproduce = don't understand it.
- One behavior per test; test name = spec (`rejects_expired_tokens`, not `test_auth`).

## TDD Enforcement — Forbidden Patterns and Gate Protocol

### Forbidden (non-negotiable)
- NEVER write an implementation file before running and showing a failing test. "Would fail" ≠ ran it.
- NEVER write tests after implementation (except bug-fix repro on pre-existing code: write, show fail, fix, show pass).
- NEVER weaken an assertion to pass a test.
- NEVER skip the refactor phase.
- NEVER commit `feat:`/`fix:` without a preceding `test:` commit in the same branch.

### Gate Protocol — paste actual runner output at each gate, not a summary
- RED: write test → run, paste full failure → commit `test(scope): [RED] describe behavior`.
- GREEN: minimum impl → run, paste full pass → commit `feat(scope): implement to satisfy test`.
- REFACTOR: improve structure → run full suite, paste summary → commit `refactor(scope): clean without behavior`.

The git log per feature reads as the audit trail (test → feat → refactor). `pre-commit-tdd-check.sh` detects a `feat:` with no preceding `test:`.

## Data Guardrails ⚠️
- NEVER sample, truncate, or subset data unless explicitly instructed.
- NEVER make simplifying assumptions about distributions, scales, or schemas.
- State exact row counts, column sets, and filters for every data operation.
- If data is too large for in-memory, say so — don't silently downsample.

## Techniques
Named techniques, algorithms, and domain frameworks active in this project.
Each name activates the AI's full training on that technique — no explanation needed.
A technique named here is available at the full depth of the model's training on it.
### Active Techniques
<!-- Add project-specific techniques below.
     Examples: RAPTOR indexing · BM25+vector hybrid with RRF fusion ·
     PCA geometric validation · deontic modal logic · CQRS · Saga pattern -->
- [Add named techniques here]

## Testing Architecture

### Test Types by Scope and Purpose (fast/isolated → slow/integrated)

| Type | Description | Tooling |
|---|---|---|
| **Unit — Solitary** | Single unit; mock all collaborators. | Jest, Vitest, pytest |
| **Unit — Sociable** | Single unit; allow fast non-I/O collaborators (no mocking real logic). | Jest, Vitest, pytest |
| **Integration — Narrow (DB)** | Exercise one layer against a real local DB; no external services. | Testcontainers, SQLite, in-process Postgres |
| **Integration — Service** | Service + stubs for external deps via WireMock or equivalent. | WireMock, Wiremock-rs, msw |
| **Contract / Consumer-Driven (CDC)** | Consumer writes pact file; provider verifies. Prevents API breakage without full E2E infra. | Pact, Spring Cloud Contract |
| **API / Subcutaneous** | HTTP or WebSocket layer below the UI; tests the full request-response cycle without browser. | Supertest, Playwright APIRequestContext, httpx |
| **Acceptance / BDD** | Given-When-Then; orthogonal to pyramid — level is a performance choice, not semantic. | Cucumber, behave, should-style assertions |
| **E2E** | Full user flows in a real browser. Keep minimal — expensive and brittle. Reserve for highest-value journeys. | Playwright, Cypress |
| **Visual Regression** | Pixel-diff baseline + LLM visual analysis for judgment-requiring defects. | Percy, Chromatic, Playwright snapshots |
| **Smoke** | Deployed environment only. Strictly happy-path. Binary pass/fail deploy gate. | Playwright, custom health check suite |
| **Regression** | Discipline: full suite green before merge. Not a test type — a required gate. | All layers |
| **Security — SAST** | Static analysis at commit: code pattern scanning and dep vulnerability scanning. | Semgrep, SonarQube, ESLint security plugins, npm audit, Snyk |
| **Security — DAST** | Dynamic analysis at staging: automated attack surface probing. | OWASP ZAP, Burp Suite |
| **Security — Penetration** | Adversarial session at release candidate gate; OWASP Top 10 coverage. | Manual + OWASP ZAP, Burp Suite |
| **Mutation** | Tests the tests: injects code mutations and verifies the suite catches them. Tracked at PR; required above threshold at RC. | Stryker (JS), PIT (Java), mutmut (Python) |
| **Property-Based / Fuzz** | Auto-generates input space against stated invariants. Fuzzing is the adversarial variant. | fast-check (JS), Hypothesis (Python) |
| **Accessibility / a11y** | WCAG 2.1 AA. Automated at PR; full manual audit at RC. | axe-core, Playwright @axe-core, Lighthouse |
| **Performance: Load / Stress / Soak** | At staging. Required before production on systems with SLAs. | k6, Locust, Gatling |
| **Chaos / Resilience** | Random fault injection against deployed environment; named resilience contracts. | Toxiproxy, ChaosMesh, custom fault injection |
| **Exploratory** | Manual, session-based, scheduled. Charter-driven. Findings become regression tests. | Manual + session notes |

### Variant Coverage Dimensions
Happy path · Sad/Negative · Edge/BVA (max/min/empty/null/coercion) · Corner (intersecting edges) · State transition (needs state diagram) · Equivalence partition · Error path (timeout/500/DB refused) · Security/Adversarial (SQLi, XSS, path traversal, oversized, malformed tokens) · Random/Monkey (via property-based).

**Variant coverage matrix** (✓ required, ~ structural, — n/a):

| Variant | Unit | Integration | Contract | API | E2E | Smoke | Chaos |
|---|---|---|---|---|---|---|---|
| Happy path | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | — |
| Sad / Negative | ✓ | ✓ | ✓ | ✓ | ~ | ~ happy-path only | — |
| Edge / BVA | ✓ | ✓ | — | ✓ | — | — | — |
| Corner case | ✓ | — | — | ✓ | — | — | — |
| State transition | ✓ | ✓ | — | ✓ | ✓ | — | — |
| Equivalence partition | ✓ | — | — | ✓ | — | — | — |
| Error path | ✓ | ✓ | — | ✓ | — | — | ✓ |
| Security / Adversarial | — | — | — | ✓ | — | — | ~ always adversarial |
| Random / Monkey | via property-based | — | — | — | — | — | ✓ |

### Test Pipeline Mapping (each gate accumulates prior gates; none skippable)

| Trigger | Gate Contents | Target Duration |
|---|---|---|
| **File save** | Unit only | ~seconds |
| **git commit / push** | Unit + integration + SAST + dependency scan + lint + regression gate | ~2–5 min |
| **Pull request** | All prior + contract + API/subcutaneous + E2E (core flows) + acceptance + visual regression + a11y (automated) + property-based | ~10–20 min |
| **Deploy to staging** | Smoke → DAST → performance baseline → chaos/resilience | ~45–60 min |
| **Release candidate** | All layers blocking + penetration test + full a11y audit + mutation score gate + compatibility matrix | Per schedule |
| **Production deploy** | Canary deploy + synthetic monitoring + A/B if applicable | Continuous |

> Mutation score gate: minimum 70% at PR, 80% at RC on changed code. Stryker/mutmut reports block promotion below threshold.

## Generative Specification: Testing Techniques
- **Adversarial posture**: write tests to FAIL on incorrect code; against interfaces, not internal state.
- **Expose-store-to-window**: for shared-state UIs (Redux/Zustand/Pinia), set `window.__store` in test env so Playwright asserts internal state, not just DOM. Catches "renders right, stored wrong".
- **Vertical chain test**: one UI action → assert service response → DB state + indexes → back to UI. Surfaces a defect anywhere in the chain in one pass. Name which critical flows get it.
- **Mutation as adversarial audit**: run Stryker (JS/TS) / mutmut (Python) on every AI-generated suite. Gates: 70% at PR, 80% at RC on changed code.
- **Multimodal quality gates** (generated assets): executable acceptance, not manual review. Visual: PCA orientation (≤15°), SSIM symmetry (≥0.85). Audio: LUFS ±1 dB, frequency profile, silence detection. MCP-mediated inspection for judgment-requiring defects.
