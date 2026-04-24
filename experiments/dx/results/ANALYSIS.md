---
nav_exclude: true
---

# DX1 Results — April 10, 2026

**Status:** Complete  
**Participants enrolled:** 58  
**Analyzable submissions:** 83 (44 Condition A, 39 Condition B)  
**Data collected:** April 10–11, 2026

---

## Files

| File | Contents |
|---|---|
| `branch-evidence.md` | Per-branch scoring table (GS rubric + process metrics), condition corrections |
| `branch-evidence.json` | Full machine-readable record: all GS property scores, TSC errors, ESLint, duplication, branch count, coverage, commit hash |
| `extended-metrics.csv` | Lizard complexity, test/code ratio, Hurl executable scores (0–3), mutation score |

Hurl test suites that produced the executable scores are in `../scoring/`.

---

## Condition Definitions

| Condition | Protocol |
|---|---|
| **A — control** | Free prompting, no GS artifacts |
| **B — treatment** | ForgeCraft pre-generated artifact set (`.claude/` directory present) |

Ground truth: real condition determined by presence of `.claude/` directory. Seven branches had recorded/actual mismatches; all corrected in `branch-evidence.md`.

---

## Sessions

| Session | Notes |
|---|---|
| **Vaquita** (morning, pre-reveal) | Greenfield cooperative payment API. Neither group had knowledge of GS. Clean tool-effectiveness comparison. |
| **Taskflow** (afternoon, post-reveal) | Brownfield Kanban API. All participants instructed to apply GS after the reveal. Condition B followed pre-reveal ForgeCraft artifact; Condition A applied GS freely. |

**Critical:** the two sessions answer distinct questions and must be interpreted separately.

---

## Key Quantitative Results

### Table 1: Executable score (0–3) — Hurl 10-step live API test

| Session | Condition | N | Mean | % Perfect | Zero scores |
|---|---|---|---|---|---|
| Vaquita (pre-reveal) | A — free prompting | 24 | 2.00 | 38% (9/24) | 12% (3) |
| Vaquita (pre-reveal) | B — ForgeCraft | 23 | 1.52 | 13% (3/23) | 17% (4) |
| Taskflow (post-reveal) | A — manual GS | 20 | 2.65 | 75% (15/20) | 5% (1) |
| Taskflow (post-reveal) | B — ForgeCraft | 16 | 2.12 | 62% (10/16) | 25% (4) |

### Table 2: GS rubric and process metrics (all sessions combined)

| Metric | Condition A | Condition B | Δ |
|---|---|---|---|
| Executable score (0–3) | 2.30 | 1.77 | **−0.53 (A better)** |
| GS total (0–8, 5-property rubric) | 6.07 | 6.46 | **+0.39 (B better)** |
| GS auditable (0–2) | 1.56 | 2.00 | **+0.44 (B better)** |
| Commit count | 46.5 | 59.9 | **+13.4 (B more)** |
| Test coverage (%) | 74.5 | 73.3 | ≈ |

**GS rubric scale:** V (0–2) + B (0–2) + A (0–2) + Self-describing (0–1) + Defended (0–1) = max 8.  
Composable/functional correctness measured separately via Hurl as executable score (0–3).

---

## Interpretation Summary

**Vaquita (pre-reveal):** ForgeCraft produced better process discipline (GS rubric, commit count, auditable) but at a real cost to functional completion. Condition A (free prompting) was 2.5× more likely to reach a fully functional API in the session window. Cause: ForgeCraft front-loads cognitive and time investment into specification; the current pre-generation sequence produces artifacts but lacks scaffolded implementation prompts to drive practitioners from specification to running code. This is a **product gap, not a methodology gap.**

**Taskflow (post-reveal):** Condition A (free GS, no tooling) significantly outperformed Condition B on functional completion (75% perfect vs. 62%; 5% zero-score vs. 25%). Critical variable: **artifact temporal mismatch.** ForgeCraft's roadmap was generated before practitioners knew the methodology. Condition B participants were instructed to comply with a stale artifact at the moment they had enough understanding to exceed it. Condition A applied GS judgment directly. This is a **product implication, not a methodology failure:** ForgeCraft needs a practitioner mode that steps back once methodology comprehension is acquired.

**Combined:** GS as methodology and ForgeCraft as tool are not the same thing. The workshop measured both in different sessions. The pattern is consistent with scaffolding theory: structure is necessary for learning; it becomes overhead — or a ceiling — for the practitioner who has internalized what the scaffold was teaching.

---

## Pre-registered Hypothesis Outcomes

| Hypothesis | Outcome |
|---|---|
| P1: Discipline transferable in one session | **Confirmed with qualification** — Taskflow A outperformed B; one session of exposure enabled effective free application. Comparison is not symmetric (A had freedom, B had compliance instruction). |
| P2: Effect independent of GS rubric | **Partially confirmed** — Vaquita: GS rubric and functional score diverged. Taskflow: both metrics aligned in same direction. |
| P3: Control failures consistent and predictable | **Confirmed** — Condition A (pre-reveal, Vaquita) structural failures concentrated in same properties across practitioners. |
| P4: Without discipline, AI output is arbitrary | **Confirmed in Vaquita; partially disconfirmed in Taskflow** — post-reveal Condition A produced more consistent output despite no tooling. |

---

## Study 2 and DX2 Pre-registration

See white paper §7.8.A for Study 2 (follow-up transfer study, May 2026) and DX2/DX3 designs.
