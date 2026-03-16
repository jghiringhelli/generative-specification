# Prompt 6 — Integration & Hardening

Now:
1. Start the server and manually verify every endpoint is reachable and returns the correct HTTP status codes
2. Check that every route handler delegates to a service — no direct database calls in route files
3. Verify error responses conform to the API spec format: `{"errors": {"body": ["message"]}}`
4. Produce a summary of: every endpoint implemented, any layer violations found and fixed
