# Pastura — Test Architecture & Gate

## Layers of testing
1. **Domain unit tests (pure).** The rule and compute functions in `domain/` — capacity,
   budget, rest-window, overlap — tested in isolation with table-driven cases. These MUST
   cover the acceptance criteria in `use-cases.md` exactly, including the boundary cases:
   equal-capacity passes (R2), never-grazed paddock passes (R1), no-reading rejects (R2).
2. **Service tests.** Each rule enforced end-to-end through the service with a repository
   double, asserting the correct `code` on rejection and persistence only on success.
3. **Integration tests (live Postgres).** Each endpoint against a real DB (Docker), covering
   the happy path, the auth/role gates (401/403), and each business-rule rejection
   (`rule_rest`, `rule_capacity`, `rule_overlap`).

## Gate (Defended — the quality bar)
- All tests green; `tsc --strict` zero errors; ESLint clean.
- Zero layer-boundary violations (no data-client calls in `routes/`).
- Every acceptance criterion in `use-cases.md` has a corresponding test.
- The gate is a non-LLM check: it passes or fails mechanically. Generation is not "done"
  until the gate is green; a failing gate is a missing constraint to add to the spec, not a
  patch to the code.

## Phase collapse note
Tests are authored together with the code in one derivation; the RED phase is not a separate
moment. The gate reconstitutes, as a mechanical check, the guarantee that temporal
test-first separation used to provide.
