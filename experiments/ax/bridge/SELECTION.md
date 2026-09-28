# Bridge Test — M Twin Selection (provenance)

**Selected M = AX naive rep 4** (`runner/runs/naive/4/project`), frozen at `bridge/M/`.
Selection date: 2026-09-03.

## Why rep 4 is the representative default (not fabricated)
Compared all 5 naive reps (real default-prompt Conduit generations, no bridge signal):

| rep | ts | layer_viol | eslint | tsc exit | audit/14 |
|-----|----|-----------|--------|----------|----------|
| 0 | 14 | 46 | 13 | 0 clean | 5 |
| 1 | 18 | 43 | 10 | 1 | 8 |
| 2 | 12 | 40 | 28 | 1 | 4 |
| 3 | 16 | 46 | 34 | 0 clean | 7 |
| **4** | **16** | **45 (median)** | **34** | **0 clean** | **5** |

Rep 4 chosen because it is simultaneously:
- **Median on the structural smell axis** (layer_violations = 45; group median), so it is the
  central case, not a cherry-picked worst.
- **High documented-smell load** (eslint problems = 34, tied highest) and **low audit** (5/14),
  matching the literature's default profile (Long Method / God Class / poor structure).
- **Behaviorally runnable** (tsc exit 0), required so the Hurl oracle can establish D≡M. Reps 1,2
  have non-zero tsc exit and were excluded on that ground.

## The smell profile (the "mud" the bridge test needs)
- `src/routes/articles.ts` = **489 lines**: a God Class / Long Method — article CRUD, favorites,
  and feed logic all in one route file with **direct Prisma calls** (no repository/service layer).
- Flat structure: `routes/ middleware/ utils/ types/` with **no domain / application /
  infrastructure separation, no interfaces, no ports/adapters**. Layer violations (45) are all in
  `src/routes/*.ts` reaching the DB directly.
- This is exactly the documented default (grounding doc §"natural default"): representative, cited
  as such, NOT hand-degraded.

## Next steps
1. Oracle-baseline M: bring M up (deps + ephemeral Postgres + prisma db push), run the shared
   Hurl suite (`../evidence/hurl/*.hurl`); record green/red. Minimal behavior-only fixes if needed
   (no restructuring); log any fix.
2. Build D-full and D-arch as behavior-preserving refactors of frozen M; oracle must stay green.
3. Author + run the three-DV instruments (see `README.md`).
