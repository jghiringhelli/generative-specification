# Experiment logbook

The one place where the detail of every experiment lives: hypothesis, design, what was registered, what the design could and could not detect, deviations, result, and what the result licenses. Papers, the site and courses cite an entry by id and carry only what its outcome label and evidence tier support. They do not each have to show every experiment.

- Protocol that governs entries: `C:\workspace\PragmaWorks\gs\generative-specification\docs\experiments\EXPERIMENT-PROTOCOL.md`
- New entry: copy `C:\workspace\PragmaWorks\gs\generative-specification\docs\experiments\LOGBOOK\ENTRY-TEMPLATE.md`
- Next experiments, in dependency order: `C:\workspace\PragmaWorks\gs\generative-specification\docs\experiments\BACKLOG.md`
- Registrable designs: `C:\workspace\PragmaWorks\gs\generative-specification\docs\experiments\prereg\`

Rules: entries are appended, never rewritten; corrections are dated notes; every outcome uses the same template and the same tone. "We ran the wrong experiment" (`INVALID-DESIGN`) is a valid result. Backfilled entries (everything dated before 2026-10-02) were written from repository files on 2026-10-02 and say so. In them "registered" means what history shows, which is author-attested because commit dates are author-controlled; none has an external timestamp.

Outcome labels: SUPPORTED, REFUTED, NULL, INCONCLUSIVE, INVALID-DESIGN, DEMONSTRATION (no hypothesis test). Tiers: A registered externally before data; B in-repo tag pushed before data; C design text before data in history or no registration (author-attested); D demonstration or observation.

## Index

| Id | Hypothesis or question | Status | Registration (tag / commit) | Result | Entry |
|---|---|---|---|---|---|
| AX | Quality rises with specification completeness (naive, expert prompt, GS, then iterated GS versions), one session each | CLOSED, backfilled | Author-attested; commits cited in the Supplement do not resolve publicly | GS vs expert: INVALID-DESIGN (ceiling); series: DEMONSTRATION; 3 of 10 registered predictions confirmed. Tier C/D | [AX](AX.md) |
| AX-K5 | AX replicated at k=5: GS vs expert vs naive on objective metrics and audit | CLOSED, backfilled | Protocol file dated after data | Layer violations: SUPPORTED as mechanism (targeted metric); rubric: INCONCLUSIVE; runtime metrics: INVALID-DESIGN. Tier C | [AX-K5](AX-K5.md) |
| AX2 | Cross-vendor (GPT, Gemini, Claude) replication on structural metrics | CLOSED, backfilled | `experiments\ax2\PROTOCOL.md` before harness commit (2026-09-14); n differs from protocol | Naive vs disciplined: SUPPORTED as mechanism; GS vs expert: INVALID-DESIGN (saturated); oracle and coverage: INVALID-DESIGN. Tier C | [AX2](AX2.md) |
| KX | Routed authored navigation tree vs monolith vs no structure | CLOSED, backfilled | none | Tokens and cost: SUPPORTED; accuracy: INVALID-DESIGN (circular key). Tier C | [KX](KX.md) |
| TX | Does disciplined structure (and a sentinel) lower a stateless reader's read cost | CLOSED, backfilled | none; design rebuilt after first probe | Structure alone: NULL (small scale); sentinel: SUPPORTED. Tier C | [TX](TX.md) |
| SX | Chaos-twin study: surface vs navigation cost, sentinel ablation | CLOSED, backfilled | `52dd8ac` (2026-09-12, protocol before results) | Sentinel on search cost: SUPPORTED as demonstration; surface residual: INCONCLUSIVE (n=2). Tier C | [SX](SX.md) |
| CR | GS benefit declines with model capability on a non-memorized benchmark | CLOSED, backfilled | `c4c855e` (2026-09-17, before generation) | Duplication and complexity: INCONCLUSIVE, direction as predicted; behaviour and layer metric: INVALID-DESIGN. Tier C | [CR](CR.md) |
| NX | N-version revival when AI writes the versions | CLOSED, backfilled | `8b4577a` (2026-09-21, 27 minutes before first run) | Registered H1: INVALID-DESIGN (floor); one post-hoc problem: INCONCLUSIVE. Tier C/D | [NX](NX.md) |
| RVX / revival grid | Revival model across a capability ladder with fixed difficulty tiers | Design registered in-repo (`a89b2c0`, 2026-09-28); grid not run as far as the files show | `a89b2c0` | none | `C:\workspace\PragmaWorks\gs\generative-specification\experiments\revival\PREREGISTRATION.md` (no logbook entry yet; open one before running) |
| BX | Rubric ranks three Conduit implementations in agreement with static analysis | CLOSED, backfilled | none | INCONCLUSIVE (n=3, circular for one repo). Tier C | [BX](BX.md) |
| CX | GS-specified vs community Conduit on five patch tasks | CLOSED, backfilled | none | INVALID-DESIGN (5/5 vs 5/5; 3 tasks vacuous). Tier C | [CX](CX.md) |
| EX | Spec-to-production chain at four tiers on a live deployment | CLOSED, backfilled | none | DEMONSTRATION. Tier D | [EX](EX.md) |
| RX | Regeneration from a GS document passes 104 tests | CLOSED, backfilled | none | DEMONSTRATION. Tier D | [RX](RX.md) |
| ALX | Compiler derived from a formal specification (other repository) | Backfilled from ledger only; primary record unchecked | unknown | DEMONSTRATION. Tier D | [ALX](ALX.md) |
| MX | Model tiering vs all-strong vs all-mid | CLOSED, backfilled | none found | Quality: INVALID-DESIGN (ceiling); tiering: INCONCLUSIVE. Tier C/D | [MX](MX.md) |
| RND-1 | Which GS arm suppresses pressure failure modes | CLOSED, backfilled | none found | Prescriptive spec: SUPPORTED (near-definitional); bounded context: INVALID-DESIGN (ceiling); test-faking: NULL by floor. Tier C/D | [RND-1](RND-1.md) |
| SDX-0 | Harness-validity pilot for SDX-1 | DESIGN-REVIEWED, draft, not frozen | none yet | none | [SDX-0](SDX-0.md) |
| SDX-1 | Does persistent structured enforced state matter once the project lives (A4 vs A1, A4 vs A3) | DESIGN-REVIEWED, draft, not frozen | none yet | none | [SDX-1](SDX-1.md) |

## Reading the index honestly

- Of the 15 closed rows above, none is tier A or B, so none may be called pre-registered in a public document. The wording to use is "author-attested design, committed before the runs" for CR, NX and SX, and "no registration" for the rest.
- Nine of the closed rows carry an `INVALID-DESIGN` label on at least one question. That is a statement about what the experiments could detect, not about whether the research ideas are right.
- No row is `REFUTED`. TX contains the one null that ran against the author's expectation.
- A new run starts from the protocol, not from these entries; these entries cannot be upgraded in tier.
