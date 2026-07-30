# GS Book — StoryCraft chapter briefs

> Paste **Standing Instructions** + one **Chapter brief** into StoryCraft per generation.
> Spec = the book bible (`gs-book-bible.md`, the chapter's section) + the brief below.
> Source map + staleness detail: [`consolidation-plan.md`](consolidation-plan.md).

---

## STANDING INSTRUCTIONS (prepend to every chapter)

- **Spec authority:** follow the chapter's definition in `gs-book-bible.md` for scope, key points, numbers, and tier framing. The bible wins any conflict; other sources supply **prose and evidence only**.
- **Audience:** senior devs, tech leads, EMs.
- **Voice/Tone:** apply bible §13 (Voice & Tone) continuously — do not draft it as a chapter.
- **Honesty guardrails:** label *measured* vs *pilot*; never assert the ~70% token-reduction figure (conceded unproven); attribute **CKG to McCreary**; the author's genuine contributions are **the bridge, the sentinel (CNT), phase collapse** (+ read-asymmetry, the stateless-reader naming) — everything else is honest synthesis of a converging industry.
- **The controlled practitioner study (codename DX) is RETIRED — do NOT include it anywhere** in the book (conducted at the author's employer; adds nothing publishable). The practitioner-transfer story uses **McBrokers only** (observational — the workshop cohort). This affects Ch 9 (Case Studies) and Ch 10 — drop any such material the sources still carry.
- **Canonical numbers:** 7 properties / 14 points (threshold 11/14); **six-tier T1–T6, harness cross-cutting**. Normalize any legacy "12/12", four-tier, or seven-tier framing from older sources to this. (Operational strings like `t4-signal` = Production/T3 — annotate, don't rewrite the code strings.)
- **Output:** the full chapter in the book's voice; flag any bible-required point the sources don't cover as **[NEEDS ORIGINAL AUTHORSHIP]**.

---

## Ch 1 — The Problem

**Bible section:** §1. **Status:** partially drafted (assembly + citation hookup).

**Consolidate from (best base first):**
- **Base prose:** scaffolding `ch01 the-diagnosis` (near-final 84-line draft — strongest prose).
- **Citable framing:** White Paper §1 (Stateless Reader) + §3.1 concept map.
- **Secondary:** Compendium Prologue (Mars Climate Orbiter, $327.6M) + §1 Intro + §3 (theoretical gap); Field Guide §1 ("the reader is stateless").

**Notes:** open the book on the stateless-reader problem + the Orbiter as the drift-at-generation-speed hook. This chapter unblocks everything — set the vocabulary (architectural drift, stateless reader, derivability) the rest of the book reuses.

---

## Ch 2 — The Core Inversion

**Bible section:** §2. **Status:** partially drafted.

**Consolidate from (best base first):**
- **Base prose:** scaffolding `ch02 the-inversion` + Foreword "The inversion".
- **Citable framing:** White Paper §2 (Discipline of Removal), **§2.2 Phase Collapse**, **§4.2 Cost Inversion**.
- **Secondary:** Compendium §2 (Abstraction Ladder), §4 (The Principle); Field Guide "Restriction is activation".

**Notes:** the load-bearing ideas are **cost inversion** and **phase collapse** — make them land as the book's premise. Use WP §4.2's resolved framing (spec unrecoverable from a non-GS codebase; a fully compliant one near-reconstructable = feature). A `cost-inversion` sim exists in scaffolding to reference.

---

## Ch 5 — The Seven Properties

**Bible section:** §5 (the fullest spec in the whole bible — failure-mode-first, score progression, calibration anchors). **Status:** richest / most source-ready.

**Consolidate from (best base first):**
- **Base:** **Bible §5** (canonical, deepest) + scaffolding `ch08` (165-line draft, second-fullest).
- **Citable framing:** White Paper §3 + §3.1 concept→property map.
- **Secondary:** Field Guide "seven properties"; the ForgeCraft 14-point rubric.

**Notes:** the conceptual core — nearly every later chapter references it, so nail the seven names, the 0–2 scoring, and the failure-mode-per-property derivation. Fold in WP §3.1's concept→property map (bridge, sentinel, read-asymmetry, phase collapse each carried by which properties). Keep the "what the rubric does *not* measure" honesty beat (dependency governance) from the Field Guide.

---

## After the top 3 (order from the plan)
Ch 7 Closed Loop → Ch 8 Doc-JIT → Ch 6 Tool Kit → Ch 3 Spec Stack → Ch 10 Formal → Ch 9 Case Studies → **then** Ch 4 Six-Tier Cascade (heaviest reconciliation), Ch 11 Bio Isomorphisms (needs BioIso paper + ALX), Ch 12 Research Horizon (mostly original). Briefs for these to be added as the top 3 land.
