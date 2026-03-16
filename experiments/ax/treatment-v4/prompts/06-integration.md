# Prompt 6 — Integration & Hardening

Now:
1. Run all tests and fix any failures
2. Check that every route handler delegates to a service (no direct DB calls in routes)
3. Verify error responses conform to the API spec format: `{"errors": {"body": ["message"]}}`
4. Add any missing test coverage for edge cases and error paths (401, 403, 404, 422)
5. Produce a summary of: test count, any layer violations found and fixed, coverage %

---
**Before committing:** run the Verification Protocol (see CLAUDE.md § Verification Protocol).
This is the final hardening pass — all 5 steps must pass cleanly before the final commit.
