# DX — Human Practitioner Experiment

**Status:** Scheduled — April 2026  
**Design version:** 1.0 (March 2026)  
**Related:** [AX](../ax/) (adversarial study, complete) · [RX](../rx/) (replication, complete)

---

## Purpose

DX tests whether the Generative Specification methodology transfers to engineers other than its author. AX established the quality gradient under controlled conditions. RX proved independent reproducibility. DX establishes between-practitioner replication: do 40 engineers from different backgrounds, using the same methodology, produce better outcomes than 40 engineers using unstructured AI prompting?

This is the experiment the single-author practitioner cases cannot supply. It is the controlled condition the adversarial study was designed to precede.

---

## Design

### Participants
- 40 developers (target)
- Self-selected from conference workshop registration
- Mix of experience levels; no pre-screening on AI tool familiarity
- Randomly assigned to groups A or B within each workshop session

### Tasks

**Session 1 (morning, 90 min):** [`gs-workshop-base`](https://github.com/jghiringhelli/gs-workshop-base)  
Social bookmarking API (Linkmark). Add Weekly Digest feature: `GET /digest` + `POST /digest/notify`.

**Session 2 (afternoon, 90 min + 3.5 hr):** [`gs-workshop-kanban`](https://github.com/jghiringhelli/gs-workshop-kanban)  
Task management API with 11 intentional architectural issues. Add `GET /activity` + fix broken `POST /tasks/:id/status` atomicity.

Groups swap between sessions (A→B, B→A): every participant experiences both conditions.

### Conditions

| Group | Condition | Protocol |
|---|---|---|
| **A** | Prompt-driven | Structured expert prompts as provided in README. Record all prompt modifications in PROMPT_LOG.md. |
| **B** | GS + ForgeCraft | Run `setup_project` → issue one instruction → do not intervene. Record interventions in INTERVENTION_LOG.md. |

---

## Hypotheses

**H1 (primary):** Group B participants score higher on the 7-property rubric than Group A participants on the same task.

**H2:** Group B participants require fewer human interventions (measured by INTERVENTION_LOG entries) to produce a working implementation.

**H3:** Group B participants produce more architecturally complete implementations (measured by Bounded: zero `prisma.*` in routes, and Composable: correct response shape).

**H4:** The quality gap between groups widens on the more complex brownfield task (kanban) compared to the greenfield-adjacent task (base).

---

## Dual Rubric

### Automated scoring (runs against every fork after the session)

| Check | Property | Points |
|---|---|---|
| `npm test` passes, coverage ≥ 60% | Verifiable | 2 |
| Zero `prisma.*` in `src/routes/` | Bounded | 2 |
| `CLAUDE.md` exists in repo root | Self-describing | 1 |
| ADR in `docs/adr/` or `adrs/` | Auditable | 1 |
| ≥ 50% of new commits: conventional format | Auditable | 1 |
| Feature endpoint returns correct JSON shape | Composable | 3 |
| **Total** | | **10** |

### Observer-scored (during session)

| Observation | Bonus |
|---|---|
| Transaction present in status-change endpoint (kanban) | +1 |
| Membership check enforced before comment operations (kanban) | +1 |
| Error middleware present | +1 |
| Zero `console.log` in routes | +1 |

---

## Data Collection

Every participant forks the workshop repo. After the session:
1. Push fork to GitHub
2. Fork URL submitted to session coordinator
3. Automated scoring script runs against fork (see `scoring/`)
4. Results aggregated in `results/` (populated post-April 2026)

---

## Verification Commands (per fork, per task)

```bash
# 1. Tests
npm test

# 2. Bounded: direct Prisma in routes (should be 0 in GS group)
grep -rn "prisma\." src/routes/ | grep -v "//.*prisma"

# 3. Self-describing: CLAUDE.md exists
test -f CLAUDE.md && echo "PASS" || echo "FAIL"

# 4. Feature works (base — digest)
TOKEN=$(curl -s http://localhost:3000/users/login \
  -H "Content-Type: application/json" \
  -d '{"email":"alice@example.com","password":"password123"}' | \
  node -e "let d='';process.stdin.on('data',c=>d+=c).on('end',()=>console.log(JSON.parse(d).token))")
curl -s http://localhost:3000/digest -H "Authorization: Bearer $TOKEN"

# 5. Feature works (kanban — activity)
TOKEN=$(curl -s http://localhost:3001/users/login \
  -H "Content-Type: application/json" \
  -d '{"email":"alice@example.com","password":"password123"}' | \
  node -e "let d='';process.stdin.on('data',c=>d+=c).on('end',()=>console.log(JSON.parse(d).token))")
curl -s http://localhost:3001/activity -H "Authorization: Bearer $TOKEN"
```

---

## Timeline

| Date | Event |
|---|---|
| March 2026 | Design complete; workshop repos ready; scoring automation built |
| April 2026 | Workshop session (exact date TBD) |
| April–May 2026 | Results aggregated, scored, and committed to `results/` |
| May 2026 | DX results incorporated into white paper §7.7.A |
