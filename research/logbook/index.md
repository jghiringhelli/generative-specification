---
layout: default
title: Experiment logbook (working copy)
parent: Research
nav_order: 2
permalink: /research/logbook/
description: "Working copy of the experiment logbook index: every experiment with its registration, outcome label and evidence tier."
---

# Experiment logbook (working copy)

{: .note }
This is a **working copy of the logbook index**, published so the statuses on the [Research page](/research/) can be checked. The canonical version is in the repository (`docs/experiments/LOGBOOK/README.md`). The per-experiment entry files are not published yet; they will appear in the same folder when that work is merged, and the Entry column names them by id until then. Where this copy and the repository differ, the repository wins.

The logbook is the one place where the detail of every experiment lives: hypothesis, design, what was registered, what the design could and could not detect, deviations, result, and what the result licenses. Papers and this site cite an entry by id and carry only what its outcome label and evidence tier support.

**Standing fact (2026-10-02):** there are no earlier preregistration records. Every experiment from SDX-0 onward is preregistered under the protocol (tag, then external record). The backfilled entries below stay at the tiers they earned.

**Rules.** Entries are appended, never rewritten; corrections are dated notes; every outcome uses the same template and the same tone. "We ran the wrong experiment" (`INVALID-DESIGN`) is a valid result. Backfilled entries (everything dated before 2026-10-02) were written from repository files on 2026-10-02 and say so. In them "registered" means what history shows, which is author-attested because commit dates are author-controlled; none has an external timestamp.

**Outcome labels:** SUPPORTED, REFUTED, NULL, INCONCLUSIVE, INVALID-DESIGN, DEMONSTRATION (no hypothesis test).

**Logbook tiers:** A registered externally before data; B in-repo tag pushed before data; C design text before data in history or no registration (author-attested); D demonstration or observation. These are not the A to D tiers of the white paper and Compendium, which grade study design; see the [Research page](/research/#what-is-claimed-on-what-evidence).

## Index

| Id | Hypothesis or question | Status | Registration (tag / commit) | Result | Entry |
|---|---|---|---|---|---|
| AX | Quality rises with specification completeness (naive, expert prompt, GS, then iterated GS versions), one session each | CLOSED, backfilled | Author-attested; commits cited in the Supplement do not resolve publicly | GS vs expert: INVALID-DESIGN (ceiling); series: DEMONSTRATION; 3 of 10 registered predictions confirmed. Tier C/D | AX |
| AX-K5 | AX replicated at k=5: GS vs expert vs naive on objective metrics and audit | CLOSED, backfilled | Protocol file dated after data | Layer violations: SUPPORTED as mechanism (targeted metric); rubric: INCONCLUSIVE; runtime metrics: INVALID-DESIGN. Tier C | AX-K5 |
| AX2 | Cross-vendor (GPT, Gemini, Claude) replication on structural metrics | CLOSED, backfilled | `experiments\ax2\PROTOCOL.md` before harness commit (2026-09-14); n differs from protocol | Naive vs disciplined: SUPPORTED as mechanism; GS vs expert: INVALID-DESIGN (saturated); oracle and coverage: INVALID-DESIGN. Tier C | AX2 |
| KX | Routed authored navigation tree vs monolith vs no structure | CLOSED, backfilled | none | Tokens and cost: SUPPORTED; accuracy: INVALID-DESIGN (circular key). Tier C | KX |
| TX | Does disciplined structure (and a sentinel) lower a stateless reader's read cost | CLOSED, backfilled | none; design rebuilt after first probe | Structure alone: NULL (small scale); sentinel: SUPPORTED. Tier C | TX |
| SX | Chaos-twin study: surface vs navigation cost, sentinel ablation | CLOSED, backfilled | `52dd8ac` (2026-09-12, protocol before results) | Sentinel on search cost: SUPPORTED as demonstration; surface residual: INCONCLUSIVE (n=2). Tier C | SX |
| CR | GS benefit declines with model capability on a non-memorized benchmark | CLOSED, backfilled | `c4c855e` (2026-09-17, before generation) | Duplication and complexity: INCONCLUSIVE, direction as predicted; behaviour and layer metric: INVALID-DESIGN. Tier C | CR |
| NX | N-version revival when AI writes the versions | CLOSED, backfilled | `8b4577a` (2026-09-21, 27 minutes before first run) | Registered H1: INVALID-DESIGN (floor); one post-hoc problem: INCONCLUSIVE. Tier C/D | NX |
| RVX / revival grid | Revival model across a capability ladder with fixed difficulty tiers | Design registered in-repo (`a89b2c0`, 2026-09-28); grid not run as far as the files show | `a89b2c0` | none | [revival preregistration](https://github.com/jghiringhelli/generative-specification/blob/main/experiments/revival/PREREGISTRATION.md) (no logbook entry yet) |
| BX | Rubric ranks three Conduit implementations in agreement with static analysis | CLOSED, backfilled | none | INCONCLUSIVE (n=3, circular for one repo). Tier C | BX |
| CX | GS-specified vs community Conduit on five patch tasks | CLOSED, backfilled | none | INVALID-DESIGN (5/5 vs 5/5; 3 tasks vacuous). Tier C | CX |
| EX | Spec-to-production chain at four tiers on a live deployment | CLOSED, backfilled | none | DEMONSTRATION. Tier D | EX |
| RX | Regeneration from a GS document passes 104 tests | CLOSED, backfilled | none | DEMONSTRATION. Tier D | RX |
| ALX | Compiler derived from a formal specification (other repository) | Backfilled from ledger only; primary record unchecked | unknown | DEMONSTRATION. Tier D | ALX |
| MX | Model tiering vs all-strong vs all-mid | CLOSED, backfilled | none found | Quality: INVALID-DESIGN (ceiling); tiering: INCONCLUSIVE. Tier C/D | MX |
| RND-1 | Which GS arm suppresses pressure failure modes | CLOSED, backfilled | none found | Prescriptive spec: SUPPORTED (near-definitional); bounded context: INVALID-DESIGN (ceiling); test-faking: NULL by floor. Tier C/D | RND-1 |
| SDX-0 | Harness-validity pilot for SDX-1 (rev 2: adds the expert-minus-GS arm, a state-in-text positive control and validity checks V10 to V13) | DESIGN-REVIEWED, draft rev 2, not frozen | none yet | none | SDX-0 |
| SDX-1 | Does a persistent structured enforced substrate (A4) add over an expert prompt with none of the load-bearing GS elements (A5), and is A5 different from naive (rev 2; earlier contrasts A4 vs A1, A4 vs A3 kept as secondary) | DESIGN-REVIEWED by Claude critics only, draft rev 2, not frozen; vendor-diverse critic round 1 pending | none yet | none | SDX-1 |

## Reading the index honestly

- Of the 15 closed rows above, none is tier A or B, so none may be called pre-registered in a public document. The wording to use is "author-attested design, committed before the runs" for CR, NX and SX, and "no registration" for the rest.
- Nine of the closed rows carry an `INVALID-DESIGN` label on at least one question. That is a statement about what the experiments could detect, not about whether the research ideas are right.
- No row is `REFUTED`. TX contains the one null that ran against the author's expectation.
- A new run starts from the protocol, not from these entries; these entries cannot be upgraded in tier.
