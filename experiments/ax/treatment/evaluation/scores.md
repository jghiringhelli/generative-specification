# Adversarial Audit Scores — treatment

*Generated: 2026-03-15T00:35:08.638Z*
*Method: blind Claude API session (auditor received only output + property definitions)*

---
# Code Review: RealWorld Conduit API

## 1. Self-Describing
**Score:** 2/2

**Evidence:** 
The README.md provides:
- Clear architecture diagram: "Routes (HTTP) → Services (Logic) → Repositories (Data) → Domain Models"
- Tech stack overview (TypeScript 5, Express 4, Prisma 5, PostgreSQL)
- Complete API endpoint listing with auth requirements
- Project structure with directory purposes
- Key architectural principles: "No database calls in route handlers, Dependency injection throughout, All config from environment variables"

A stateless reader can determine the system is a RealWorld API backend implementation following hexagonal architecture without needing to run it.

**Suggestion:** None needed.

---

## 2. Bounded
**Score:** 2/2

**Evidence:** 
The verification protocol confirms: "grep -r 'prisma\.' src/routes/ — Result: No matches found"

Examining route handlers:
- `user.routes.ts`: Only calls `authService.register()`, `authService.login()`, etc.
- `article.routes.ts`: Only calls `articleService.createArticle()`, `articleService.listArticles()`, etc.
- `comment.routes.ts`: Only calls `commentService.getComments()`, `commentService.addComment()`, etc.

Service layer (e.g., `ArticleService`): Calls repositories only (`this.articleRepository.create()`, `this.tagRepository.upsertMany()`)

Repository layer: Contains all Prisma calls (`this.prisma.article.findMany()`)

**Suggestion:** None needed.

---

## 3. Verifiable
**Score:** 2/2

**Evidence:** 
- **Total tests:** 148 (48 unit, 100 integration)
- **Coverage:** Statements 92.5%, Branches 88.3%, Functions 91.7%, Lines 93.1% — all exceed 80% threshold
- **Test organization:** Unit tests in `src/services/*.test.ts`, integration tests in `tests/integration/*.test.ts`
- **Behavioral naming:** `create_article_with_valid_data_returns_201_and_article`, `follow_user_twice_is_idempotent`, `delete_comment_by_non_author_returns_403`
- **Error path coverage:** 401 (15+ cases), 403 (8+ cases), 404 (12+ cases), 422 (20+ cases)

**Suggestion:** None needed.

---

## 4. Defended
**Score:** 0/2

**Evidence:** 
The `package.json` includes `"lint": "eslint src/**/*.ts"` and `"test": "jest --coverage"` scripts, but there is **no evidence** of automated enforcement:
- No `.git/hooks/` configuration shown
- No `.github/workflows/` or CI config files
- No `husky` in dependencies
- No `lint-staged` configuration
- No pre-commit/pre-push hooks

Tests and linting exist but can be bypassed — nothing blocks a failing test from being committed.

**Suggestion:** Add automated gates:
```bash
npm install --save-dev husky lint-staged
npx husky install
npx husky add .husky/pre-commit "npx lint-staged"
npx husky add .husky/pre-push "npm test"
```

Configure `lint-staged` in `package.json`:
```json
"lint-staged": {
  "src/**/*.ts": ["eslint --fix", "npm test -- --findRelatedTests"]
}
```

Or add GitHub Actions CI:
```yaml
# .github/workflows/ci.yml
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: npm ci
      - run: npm run lint
      - run: npm test
```

---

## 5. Auditable
**Score:** 0/2

**Evidence:** 
The README references ADRs: "See `docs/adrs/` for architectural decision records: ADR-001: Stack selection, ADR-002: JWT authentication strategy, ADR-003: Layered architecture, ADR-004: Error handling strategy"

However:
- **The ADR files themselves are not included** in the codebase output
- **No CHANGELOG.md** present
- **No Status.md** or equivalent tracking document shown
- **No commit history** provided to verify conventional commit format usage

Only references to decision artifacts exist, not the artifacts themselves.

**Suggestion:** 
1. **Create the referenced ADRs:**
   ```markdown
   # docs/adrs/001-stack-selection.md
   # Decision: TypeScript + Express + Prisma + PostgreSQL
   ## Status: Accepted
   ## Context: [why these choices]
   ## Decision: [what was decided]
   ## Consequences: [trade-offs]
   ```

2. **Add CHANGELOG.md:**
   ```markdown
   # Changelog
   ## [1.0.0] - 2024-01-15
   ### Added
   - Initial implementation of RealWorld API spec
   - All 19 endpoints (auth, profiles, articles, comments, tags)
   ```

3. **Enforce conventional commits** with commitlint:
   ```bash
   npm install --save-dev @commitlint/cli @commitlint/config-conventional
   echo "module.exports = {extends: ['@commitlint/config-conventional']}" > commitlint.config.js
   npx husky add .husky/commit-msg 'npx --no -- commitlint --edit "$1"'
   ```

---

## 6. Composable
**Score:** 2/2

**Evidence:** 
All services use constructor injection with interface dependencies:
```typescript
export class ArticleService {
  constructor(
    private readonly articleRepository: IArticleRepository,
    private readonly tagRepository: ITagRepository,
    private readonly profileRepository: IProfileRepository
  ) {}
}
```

All repositories implement interfaces:
```typescript
export interface IArticleRepository {
  findBySlug(slug: string): Promise<ArticleWithRelations | null>;
  // ... other methods
}

export class ArticleRepository implements IArticleRepository {
  constructor(private readonly prisma: PrismaClient) {}
}
```

Wiring in `app.ts`:
```typescript
const userRepository = new UserRepository(prisma);
const profileRepository = new ProfileRepository(prisma);
const authService = new AuthService(userRepository);
const profileService = new ProfileService(userRepository, profileRepository);
```

No global singletons (PrismaClient instantiated once in `server.ts`, passed to repositories). No service locator pattern.

**Suggestion:** None needed.

---

## 7. Executable
**Score:** 2/2

**Evidence:** 
The final verification section reports:
- **Test execution:** "Test Suites: 7 passed, 7 total | Tests: 148 passed, 148 total"
- **Compilation:** "Ready for: npm run build (Clean TypeScript compilation)"
- **TypeScript config:** `"strict": true` enabled in `tsconfig.json`
- **Migrations:** "Database migrations ready" in checklist

Code inspection shows:
- All imports resolve to defined modules
- Type definitions are complete (no `any` types in business logic)
- No syntax errors visible
- Test structure is valid (uses Jest/Supertest correctly)

While actual terminal output is not shown, the code quality and reported verification results indicate the system compiles and runs successfully.

**Suggestion:** None needed.

---

## Summary
**Total:** 10/14

**Strongest dimension:** **Bounded** — Exemplary layer separation with zero ORM calls in routes, strict delegation to services, and repositories handling all data access. The architecture is enforced consistently across all 19 endpoints.

**Weakest dimension:** **Defended** and **Auditable** (tied at 0/2) — No automated gates prevent broken code from being committed, and referenced architectural decision records are missing. The project lacks enforcement mechanisms despite having good testing and documentation infrastructure.

**Overall assessment:** This is a well-architected, thoroughly tested implementation with excellent separation of concerns and dependency injection. The codebase demonstrates strong engineering discipline in its layering and test coverage (92%). However, it lacks the guardrails (pre-commit hooks, CI) and historical artifacts (ADRs, changelog) that would make it production-hardened and maintainable by a team. Adding automated enforcement and completing the decision documentation would elevate this from a solid individual implementation to a team-ready codebase.