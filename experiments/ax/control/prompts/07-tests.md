# Prompt 7 — Test Completion & Coverage Gate

You have been writing tests alongside each feature. This is the final pass to complete the test suite and reach the coverage target.

**Steps:**

1. Run the full test suite and report which tests are currently passing/failing.
2. For any endpoints that do NOT yet have tests, write them now:
   - Unit tests: any service-layer functions not yet covered (auth logic, slug generation, pagination math, error formatting)
   - Integration tests: any endpoint still missing tests for its error paths (401, 403, 404, 422)
3. Verify test names all describe behavior, not implementation:
   - ✅ `returns 422 when email is already registered`
   - ❌ `test POST /api/users validation`
   - Rename any test that describes implementation rather than behavior.
4. Run `jest --coverage` and report the coverage summary.
   - If line coverage is below 80%, identify the uncovered code and add tests until the threshold is met.

**Produce a final summary:**
- Total test count (unit / integration breakdown)
- Coverage: lines %, functions %, branches %
- Any coverage gap you chose not to close and why
