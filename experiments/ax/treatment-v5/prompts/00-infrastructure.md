
# Prompt 0 — Project Infrastructure

This is the **infrastructure pass**. Emit infrastructure files only.
Do NOT emit any route, service, repository, or application logic yet.

A file not emitted as a fenced code block in this response does not exist.
There is no later opportunity to create these files — if they are absent, the project fails §6 and §7 of the Verification Protocol.

## Files to emit (all required)

Emit each as a fenced code block with the file path as the first comment line.

1. **`package.json`** — complete, including all runtime and dev dependencies, scripts (`build`, `test`, `lint`, `prepare`), and the `prepare` husky hook
2. **`tsconfig.json`** — TypeScript config with `strict: true`, `esModuleInterop: true`, `target: ES2022`
3. **`.husky/pre-commit`** — exact content from CLAUDE.md § Commit Hooks: tsc + lint + npm audit + test gate
4. **`.husky/commit-msg`** — commitlint gate
5. **`commitlint.config.js`** — conventional commits config
6. **`.github/workflows/ci.yml`** — full CI pipeline from CLAUDE.md § CI Pipeline: includes `npm audit --audit-level=high`, tsc, lint, prisma migrate, jest coverage, **and the Stryker mutation gate step**
7. **`CHANGELOG.md`** — initial file with `## Unreleased` section and a first entry noting initial project setup
8. **`docs/adrs/ADR-0001-stack.md`** — full ADR (not a stub): Context, Decision, Alternatives Considered, Consequences. Document: TypeScript 5 + Node 20 + Express 4 + Prisma 5 + PostgreSQL 16. Minimum 200 words.
9. **`docs/adrs/ADR-0002-auth.md`** — full ADR: JWT for stateless auth, argon2 for password hashing. Include why bcrypt was rejected (CVE chain via node-pre-gyp). Minimum 150 words.
10. **`docs/approved-packages.md`** — approved package registry from CLAUDE.md § Dependency Registry (seed defaults table, one row per approved package)
11. **`src/repositories/IUserRepository.ts`** — interface with typed method signatures
12. **`src/repositories/IArticleRepository.ts`** — interface with typed method signatures
13. **`src/repositories/ICommentRepository.ts`** — interface with typed method signatures
14. **`src/repositories/IProfileRepository.ts`** — interface with typed method signatures
15. **`src/repositories/ITagRepository.ts`** — interface with typed method signatures
16. **`src/errors/AppError.ts`** — base error class hierarchy (AppError, NotFoundError, UnauthorizedError, ForbiddenError, ValidationError, ConflictError)
17. **`jest.config.js`** — jest configuration with coverage thresholds (80% minimum)
18. **`jest.setup.ts`** — global test setup (prisma disconnect afterAll)
19. **`.env.example`** — required environment variables with descriptions

After emitting all 19 files, emit:
```
Infrastructure complete. 19/19 files emitted. Ready for feature implementation.
```

---
**Verification Protocol — check §6 and §7 before confirming complete.**
§6 Defended: `.husky/pre-commit` and `.github/workflows/ci.yml` emitted with actual content.
§7 Auditable: `docs/adrs/ADR-0001-stack.md` and `docs/adrs/ADR-0002-auth.md` emitted with full content. `CHANGELOG.md` emitted.
