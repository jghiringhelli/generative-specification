# Simulation: Expert control participant
# Behavior: architecture-aware, gives AI clear structural guidance, writes tests up front.
# Produces: service layer, custom errors, solid test coverage — but no formal hexagonal DI.
# Difference from treatment: no spec authoring phase, no ForgeCraft governance.

Read docs/spec.md and understand the full domain before writing anything.

Then implement the Tanda API with these architecture constraints:
- Separate service layer: src/services/users.ts, src/services/tandas.ts
- Route handlers only: validate input (Zod), call service, return response — no business logic
- Custom error types: AppError base class, then NotFoundError, ValidationError, ForbiddenError, ConflictError
- Config module that reads JWT_SECRET and DB_PATH from env, fails fast if JWT_SECRET is missing
- Server listen() guarded by NODE_ENV !== 'test'
- Centralized error handler middleware

Implement in this order:
1. src/errors.ts — error hierarchy
2. src/config.ts — env validation
3. src/db.ts — schema and connection
4. src/services/users.ts + src/services/tandas.ts — all business logic
5. src/routes/ — thin handlers
6. src/index.ts — wire it all together

Endpoints: everything in docs/spec.md.
Business rules: enforce all of them, especially the min 3 participants, rotation randomization, auto-complete on last round, 5% late penalty, 2-miss defaulter flag.

Tests: write Vitest tests covering happy paths, auth failures, role violations, and the edge cases above.
Target 80%+ line coverage. Run npm test before finishing, fix any failures.

