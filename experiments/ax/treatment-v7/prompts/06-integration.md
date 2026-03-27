
# Prompt 6 — Integration & Hardening

Now:
1. Run all tests and fix any failures
2. Check that every route handler delegates to a service (no direct DB calls in routes)
3. Verify error responses conform to the API spec format: `{"errors": {"body": ["message"]}}`
4. Add any missing test coverage for edge cases and error paths (401, 403, 404, 422)
5. Produce a summary of: test count, any layer violations found and fixed, coverage %

---
**Before committing:** run the Verification Protocol (see CLAUDE.md § Verification Protocol).
This is the final hardening pass — all 7 steps must pass cleanly before the final commit.
Pay special attention to §6 (Defended) and §7 (Auditable): if `.husky/pre-commit`,
`.github/workflows/ci.yml`, `docs/adrs/ADR-0001-stack.md`, `docs/adrs/ADR-0002-auth.md`,
or `CHANGELOG.md` are missing, emit them now. A project without enforcement gates and
decision records fails at the GS specification level regardless of how good the code is.
