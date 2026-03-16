# GS Artifact Set — Treatment Condition

*The full set of structured artifacts passed to the model in the treatment condition.*
*These are what distinguish GS from expert prompting. Each file is in `experiments/treatment/`.*

---

## Core Identity + Instruction File

**`CLAUDE.md`** — The GS instruction file. Equivalent to a developer constitution.  
Key sections: project identity, code standards (50-line functions, 300-line files),  
SOLID principles, zero mocks rule, interfaces-first protocol, dependency injection pattern,  
CI/CD pipeline requirements, testing pyramid (unit 60-75% / integration 20-30% / E2E 5-10%),  
coverage targets (80% lines, 65% MSI), commit protocol, verification protocol, GS property definitions.  
Length: ~270 lines.

**`Status.md`** — Session memory. Records current implementation state, completed features,  
open issues, next steps. Prevents state bleed between AI sessions.

---

## Architectural Decision Records (ADRs)

Pre-written decisions passed as context. The model cannot revisit these without writing a new ADR.

| File | Decision |
|---|---|
| `docs/adrs/001-stack.md` | Node.js 18, TypeScript 5, Express 4, Prisma 5, PostgreSQL 16, Jest 29, Zod 3 |
| `docs/adrs/002-auth.md` | JWT with 30-day expiry; bcrypt with 12 rounds; `process.env.JWT_SECRET` validation at startup |
| `docs/adrs/003-layers.md` | Route → Service → Repository; Prisma isolated to repositories; domain errors carry no HTTP codes |
| `docs/adrs/004-errors.md` | RealWorld error envelope `{"errors": {"body": [...]}}` at 422; custom `AppError` hierarchy |

---

## Domain Diagrams

| File | Content |
|---|---|
| `docs/diagrams/c4-context.md` | System context: Conduit ↔ Browser/Mobile client, external SMTP |
| `docs/diagrams/c4-container.md` | Container diagram: Express API ↔ Prisma ↔ PostgreSQL |
| `docs/diagrams/domain-model.md` | Entities: User, Article, Comment, Tag, Follow, Favorite with cardinalities |
| `docs/diagrams/sequences.md` | Key interaction sequences: auth flow, article publish, follow/unfollow |

---

## Specification Documents

| File | Content |
|---|---|
| `docs/use-cases.md` | 18 use cases derived from the API spec (actor, trigger, success condition, failure conditions) |
| `docs/test-architecture.md` | Test pyramid for this project: which files go to unit vs. integration; test naming rules; mock boundary definition |
| `docs/nfr.md` | Non-functional requirements: response time p95 < 200ms, DB connection pool sizes, security headers |
| `docs/TechSpec.md` | Full technical specification: folder structure, naming conventions, authentication spec, slug generation algorithm, pagination contracts |

---

## Pre-Defined Prisma Schema

**`prisma/schema.prisma`** — Complete 6-model schema emitted in Prompt 1 (before any implementation):
`User`, `Article`, `Comment`, `Tag`, `Follow`, `ArticleTag`.  
All relations, indices, and cascades pre-specified.

This is a key GS mechanism: the schema is established as a decision, not discovered prompt-by-prompt.  
The control condition accumulated its schema over 4 prompts.

---

## What These Artifacts Produced

**Directly traceable GS → code translations:**

1. ADR-003 "Dependency Inversion" → `IUserRepository`, `IArticleRepository`, `ICommentRepository`,  
   `IProfileRepository`, `ITagRepository` interfaces (TypeScript) + explicit composition root in `app.ts`.
   Control had constructor injection but against concrete types — no interfaces.

2. ADR-004 "Error format" → consistent `AppError.toJSON()` → `{"errors": {"body": [...]}}` structure  
   across all 19 endpoints. Control had 80% compliance (16/20 sampled).

3. `docs/TechSpec.md` slug algorithm → identical `title → lowercase → strip special chars → hyphenate`  
   logic across create and update. No divergence between prompts because the spec was in context.

4. `prisma/schema.prisma` pre-specification → all 4 domain models consistent from Prompt 1 onward.  
   Control's schema evolved: `ArticleFavorite` added in P3, relationship adjustments in P4.

---

## Post-Experiment GS Template Improvements

Based on experiment findings, three additions were made to `templates/universal/instructions.yaml`:

1. **`noUncheckedIndexedAccess: true`** added to TypeScript code standards.  
   Rationale: `"strict": true` does not narrow `process.env.*` from `string | undefined`.  
   This flag would have caught the treatment TS error (`JWT_SECRET` type) at compile time.

2. **"Commit Hooks — Emit, Don't Reference"** section added to commit-protocol block.  
   Rationale: Treatment referenced `.husky/pre-commit` in prose but never emitted the file.  
   Template now explicitly instructs: emit as a fenced code block in P1.

3. **"ADR Stubs — Emit in P1"** added to adr-protocol block.  
   Rationale: Same mechanism. ADRs referenced in README but not written to disk.  
   Template now instructs: ADR stub files must be emitted as fenced code blocks alongside  
   `prisma/schema.prisma` and `package.json` in the first response.
