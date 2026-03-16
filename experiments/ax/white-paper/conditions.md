# Experimental Conditions

Three pre-registered conditions plus one post-hoc GS v2 condition, all using the same benchmark
(RealWorld Conduit API in TypeScript) and same model (claude-sonnet-4-5).

---

## Condition 1: Naive

**Design intent:** Baseline. No structure, no guidance. Represents *vibe coding*: the actual  
pattern in most organizations where AI tools are pushed to junior developers (and non-engineers)  
without structured methodology, while senior engineers are still catching up on AI adoption.

**What the model received:**
- The RealWorld API spec (`REALWORLD_API_SPEC.md`)
- A 3-line README: "Build a REST API for Conduit. Use Node.js and TypeScript."

**Prompt style:** Feature-by-feature (6 prompts), each 2–4 lines. No architecture, no error  
format, no test requirements, no layer rules, no stack specification.

**Example prompt:**
```
Set up the project and implement user authentication.
Users should be able to register, log in, get their profile, and update it.
Make sure authentication works with JWT tokens.
```

**Files:** `experiments/naive/README.md`, `experiments/naive/prompts/`

**Status:** Complete. Session `236a3efd-94ba-45af-b399-bca79f4b1e2e`, March 13 2026.
Result: 5/12 GS audit score. **0% real coverage** — all test suites fail TS2339 compilation
errors (Article/Comment/Tag/Favorite models absent from schema due to annotation failure).
See [conclusions.md §5](./conclusions.md) for the annotation failure analysis.

---

## Condition 2: Control (Expert Prompting)

**Design intent:** Best-practice prompting as a skilled senior engineer would write.  
No GS artifacts — only inline text guidance in the README and prompts.  
This is the comparison point for GS: is GS better than *good* human prompting?

**What the model received:**
- The RealWorld API spec
- A detailed README: tech stack (Node/TS/Express/Prisma/Jest/Zod), layered architecture  
  diagram with hard boundary rules, error format (`{"errors": {"body": [...]}}` / HTTP 422),  
  naming conventions, test naming style, coverage target (80%)
- 7 prompts, each 20–40 lines with architectural requirements per feature

**Example prompt excerpt:**
```
Route files must NOT call prisma. directly — use a UserRepository class.
Validate all inputs with Zod; return {"errors": {"body": ["..."]}} on failure.
Hash passwords with bcryptjs (12 rounds — use a named constant, not a magic number).
```

**Files:** `experiments/control/README.md`, `experiments/control/prompts/`

**Results:** 8/12 GS audit score. 34.12% real coverage (52/186 tests pass).

---

## Condition 3: Treatment (Generative Specification)

**Design intent:** Full GS artifact cascade. The model receives the same problem plus a  
complete structured specification: CLAUDE.md, ADRs, C4 diagrams, NFRs, pre-defined schema,  
test architecture, and a verification protocol. Prompts are brief (the artifacts carry context).

**What the model received:**
- The RealWorld API spec
- 17 context files: CLAUDE.md (GS instructions), Status.md, Prisma schema (pre-defined),  
  4 ADRs (stack, auth, layers, errors), C4 context + container + domain-model diagrams,  
  sequence diagrams, use-cases doc, test-architecture doc, NFR doc, TechSpec doc
- 6 prompts, each 6–10 lines — brief because artifacts carry the specification

**Example prompt:**
```
Implement user authentication:
- POST /api/users (register)
- POST /api/users/login (login)
- GET /api/user (get current user, auth required)
- PUT /api/user (update user, auth required)

Before committing: run the Verification Protocol (see CLAUDE.md).
```

**Files:** `experiments/treatment/` (full GS artifact cascade), `experiments/treatment/prompts/`

**Results:** 9/12 GS audit score. 27.63% real coverage (33/33 tests pass — but fewer tests).

---

## Condition 4: Treatment-v2 (GS v2 — Post-Hoc)

**Design intent:** Re-run of the GS condition using updated template artifacts that apply the
"Emit, Don't Reference" principle to infrastructure files (hooks, CI, CHANGELOG, IRepository interfaces).
Not pre-registered. Purpose: verify that the §4 gap analysis predictions in [conclusions.md](./conclusions.md)
are correct and sufficient to achieve a perfect score.

**Changes from treatment (v1):**
1. **DI bullet expanded** — `IUserRepository`, `IArticleRepository`, `ICommentRepository`, `IProfileRepository`
   explicitly named; "Emit these interfaces in P1 alongside schema" stated as a requirement.
2. **Commit Protocol rewritten** — "Commit Hooks — Emit, Don't Reference" section replaced the
   3-line protocol, providing fenced file templates for `.husky/pre-commit`, `.husky/commit-msg`,
   `commitlint.config.js`, and `.github/workflows/ci.yml` with `npx stryker run` as a mutation gate step.
3. **First Response Requirements section** — 9 mandatory P1 artifacts listed: schema, hooks, CI, CHANGELOG,
   IRepository interfaces, package.json with prepare script. Framing: "A file referenced in documentation
   but not emitted as a code block does not exist."

**What the model received:**
- The RealWorld API spec
- 18 context files: updated CLAUDE.md (with the three changes above), Status.md, Prisma schema,
  4 ADRs, C4 context + container + domain-model diagrams, sequence diagrams, use-cases,
  test-architecture, NFR, TechSpec docs
- 6 prompts (same as treatment)

**Files:** `experiments/treatment-v2/` (updated GS artifact cascade), `experiments/treatment-v2/prompts/`

**Results:** **12/12 GS audit score** — first perfect score in the series.
Test suite coverage: 1/9 suites passed, 2/2 tests (8 suites blocked by missing test
helper/error class files — same "Emit vs. Reference" failure applied to a different artifact class).

---

## Condition Comparison Matrix

| Dimension | Naive | Control | Treatment | Treatment-v2 |
|---|---|---|---|---|
| Context artifacts | API spec + 3-line README | API spec + detailed README | API spec + 17 GS documents | API spec + 18 GS documents (updated) |
| Prompt length (avg) | ~4 lines | ~30 lines | ~8 lines | ~8 lines |
| Prompt count | 6 | 7 | 6 | 6 |
| Architecture guidance | None | Inline text in README and prompts | GS artifacts (CLAUDE.md, ADRs) | GS artifacts (updated CLAUDE.md, ADRs) |
| Error format specified | No | Yes (inline) | Yes (ADR-004) | Yes (ADR-004) |
| Pre-defined schema | No | No | Yes (Prisma schema in context) | Yes (same schema) |
| Test requirements | No | Per-feature in prompts | Per-feature + test-architecture doc | Per-feature + test-architecture doc |
| Commit hooks | No mention | No mention | Specified in prose | **Emitted as files in P1** |
| CI pipeline | No mention | No mention | No mention | **Emitted as file in P1** |
| IRepository interfaces | None | None | In context ADRs | **Named + required in P1** |
| CHANGELOG | None | None | None | **Required in P1** |
| ADRs | None | None | 4 pre-written | 4 pre-written |
| GS audit score | 5/12 | 8/12 | 9/12 | **12/12** |
