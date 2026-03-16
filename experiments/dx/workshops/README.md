# DX Experiment Workshops

The DX experiment uses two workshop repositories as controlled development tasks.

---

## Workshop 1 — gs-workshop-base

**Repository:** https://github.com/jghiringhelli/gs-workshop-base  
**Task:** Social bookmarking API (Linkmark). Add Weekly Digest feature.

**What participants implement:**
- `GET /digest` — returns a signed-in user's recent bookmarks formatted as a weekly digest (`{generatedAt, bookmarks[]}`)
- `POST /digest/notify` — sends a notification to the user's email (stubbed OK response)

**Group A (prompt-driven):** Five structured expert prompts provided in README.  
**Group B (GS treatment):** Run `setup_project`, issue one instruction, record interventions.

**Automated verification:**
```bash
npm test
grep -rn "prisma\." src/routes/
```

---

## Workshop 2 — gs-workshop-kanban

**Repository:** https://github.com/jghiringhelli/gs-workshop-kanban  
**Task:** Task management API with 11 intentional architectural issues. Two objectives.

**What participants implement:**
1. `GET /activity` — returns recent task activity log (`{generatedAt, entries[]}`)
2. Fix broken `POST /tasks/:id/status` — must be atomic (missing `$transaction`)

**Known issues (present in the scaffold intentionally):**
- Direct Prisma in routes (6 locations)
- Missing error middleware
- No request validation
- No response DTOs
- No ADRs
- Hard-coded config values
- Missing ownership checks on task operations
- Partial test coverage
- No retry on Prisma transaction failures
- No API versioning strategy
- Missing activity logging on mutations

**Group A (prompt-driven):** Five structured expert prompts provided in README.  
**Group B (GS treatment):** Run `setup_project`, issue one instruction, record interventions.

---

## Note on timing

The Dx workshops repos will be made public after the self-administered pilot (March 2026). The pilot run verifies rubric calibration and baseline scores. Group A/B allocations for April 2026 are blinded: participants see only their group's instructions.
