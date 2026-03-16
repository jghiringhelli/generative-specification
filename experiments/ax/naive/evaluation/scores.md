# Adversarial Audit Scores — naive

*Generated: 2026-03-15T00:30:57.538Z*
*Method: blind Claude API session (auditor received only output + property definitions)*

---
## 1. Self-Describing
**Score:** 0/2

**Evidence:** The codebase contains no architectural documentation. The markdown files present (01-auth-response.md through 06-complete-response.md) are implementation conversation logs, not contributor-facing documentation. There is no README.md, no architecture overview, no conventions guide, and no onboarding documentation. While `.env.example` exists, there are no setup instructions or system overview documents.

**Suggestion:** Add a README.md with architecture overview, setup instructions, and API documentation. Create a docs/architecture.md explaining the layered structure (routes → controllers → services → database). Include a conventions guide covering naming patterns, error handling, and the JWT authentication flow.

---

## 2. Bounded
**Score:** 1/2

**Evidence:** The codebase exhibits partial layer separation with a routes → controllers → services pattern. Controllers properly delegate to services (e.g., `userController.ts` calls `authService.register()`). However, services directly instantiate and query Prisma throughout:

```typescript
// authService.ts
const prisma = new PrismaClient();
export async function register(data: RegisterData) {
  const existingUser = await prisma.user.findFirst({...});
```

This violates the ports & adapters architecture prescribed in CLAUDE.md. There is no repository abstraction layer separating business logic from data access.

**Suggestion:** Introduce a repository layer. Create `UserRepository`, `ArticleRepository`, etc., that encapsulate all Prisma calls. Services should depend on repository interfaces, not concrete Prisma implementations. Move all `prisma.*` calls into repositories.

---

## 3. Verifiable
**Score:** 1/2

**Evidence:** Comprehensive integration tests exist covering all endpoints with descriptive names:
- `auth.test.ts`: "should register a new user", "should reject duplicate email"
- `articles.test.ts`: "should create an article", "should reject update by non-author"
- 100+ test cases across 5 test files

Jest configuration requires 80% coverage. However, **all tests are integration tests using supertest**—there are zero unit tests for individual service functions. The test pyramid is inverted. Coverage cannot be verified without execution.

**Suggestion:** Add unit tests for service functions (e.g., `authService.register()` with mocked repositories). Extract pure functions (slug generation, data formatting) and test them in isolation. Aim for 60%+ unit tests, 30% integration tests per the testing pyramid in CLAUDE.md.

---

## 4. Defended
**Score:** 0/2

**Evidence:** No automated gates are present. There is no `.husky` directory, no pre-commit hooks, no `.github/workflows` CI configuration, and no `lint-staged` in package.json. Nothing prevents broken code from being committed.

**Suggestion:** Add Husky pre-commit hooks to run `tsc --noEmit` and `npm test`. Configure GitHub Actions to run linting, type-checking, and tests on every push. Add `lint-staged` to run ESLint on staged files. Minimum: add `.husky/pre-commit` that runs tests.

---

## 5. Auditable
**Score:** 0/2

**Evidence:** None of the three required elements are present:
1. ❌ No conventional commit format enforced or documented
2. ❌ No architectural decision records (ADRs) in `docs/decisions/`
3. ❌ No CHANGELOG.md or Status.md tracking project state

The markdown files (01-auth-response.md, etc.) are implementation logs from the development conversation, not ADRs documenting architectural choices.

**Suggestion:** Add CHANGELOG.md following Keep a Changelog format. Create `docs/decisions/` and document key decisions (e.g., "ADR-001: Use Prisma for ORM", "ADR-002: JWT authentication strategy"). Configure commitlint to enforce conventional commits. Add Status.md summarizing current implementation state.

---

## 6. Composable
**Score:** 0/2

**Evidence:** Services exhibit tight coupling and global state:

```typescript
// Every service file
const prisma = new PrismaClient();
```

This creates multiple singleton instances (implicit global state). There is:
- ❌ No dependency injection (services never receive dependencies)
- ❌ No repository interfaces (services directly use Prisma)
- ❌ No composition root/DI container
- ❌ Controllers import concrete service functions, not interfaces

This violates Dependency Inversion and makes testing without real database impossible.

**Suggestion:** Create a single Prisma instance in `src/infrastructure/database.ts`. Pass it to repositories via dependency injection. Define repository interfaces in `src/domain/repositories/`. Create a composition root in `src/index.ts` that wires dependencies. Example: `const userRepo = new PrismaUserRepository(prisma); const authService = new AuthService(userRepo);`

---

## 7. Executable
**Score:** 1/2

**Evidence:** The code is syntactically correct with valid TypeScript and Prisma schema. Type augmentation for `Express.Request` exists. However:

1. **Incomplete refactoring**: The final response mentions "Delete the old src/routes/users.ts file" but this cleanup isn't reflected in the artifacts, potentially causing import conflicts.

2. **Cannot verify compilation**: Without running `tsc --noEmit`, type errors may exist (e.g., from the route refactoring).

3. **Cannot verify tests pass**: The test suite is comprehensive but may have runtime failures (e.g., if the old `users.ts` import isn't removed).

4. **Multiple PrismaClient instances**: Each service creating its own `PrismaClient()` may cause connection pool exhaustion at runtime.

**Suggestion:** Complete the refactoring (remove old `users.ts`). Run `tsc --noEmit` to verify compilation. Create a single shared Prisma instance. Run the test suite to verify 80% coverage threshold is met. Add a `npm run validate` script that runs type-checking, linting, and tests.

---

## Summary

**Total:** 3/14

**Strongest dimension:** Bounded (1/2) — The codebase establishes a clear routes → controllers → services layering pattern with proper delegation, though it lacks the repository abstraction layer for full ports & adapters compliance.

**Weakest dimension:** Four-way tie at 0/2 (Self-Describing, Defended, Auditable, Composable) — The codebase has zero architectural documentation, no automated commit gates, no decision history tracking, and tight coupling with global state throughout services.

**Overall assessment:** This is a functionally complete API implementation with comprehensive integration test coverage, but it lacks the engineering scaffolding for maintainability at scale. The absence of documentation, dependency injection, and automated quality gates means onboarding friction is high and architectural drift is likely. The code works but isn't engineered for team collaboration or long-term evolution—classic "naive" implementation that prioritizes feature delivery over architectural rigor.