Test the API endpoint specified in $ARGUMENTS.

Steps:
1. Find the route handler and read the implementation
2. Identify the request schema (params, query, body)
3. Run these test scenarios:
   - **Happy path**: valid request with expected response
   - **Validation**: missing required fields, wrong types, boundary values
   - **Auth**: unauthenticated, wrong role, expired token (if applicable)
   - **Edge cases**: empty body, large payload, special characters
4. For each scenario, report:
   - Request: method, path, headers, body
   - Expected: status code, response shape
   - Actual: what happened
   - Verdict: PASS / FAIL

Use `curl` or the project's test framework. If tests don't exist for this endpoint, offer to create them.
