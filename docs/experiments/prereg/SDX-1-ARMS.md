# SDX-1-ARMS: the load-bearing list, the expert-minus-GS arm (A5), and the manipulation checks

Status: **DRAFT, NOT FROZEN.** Part of the SDX-1 registration package (frozen together with it). Written 2026-10-02, before any run. Parent: `C:\workspace\PragmaWorks\gs\generative-specification\docs\experiments\prereg\SDX-1.md`. Pilot: `C:\workspace\PragmaWorks\gs\generative-specification\docs\experiments\prereg\SDX-0.md`. Protocol: `C:\workspace\PragmaWorks\gs\generative-specification\docs\experiments\EXPERIMENT-PROTOCOL.md`. Worktree where this was written: `C:\workspace\PragmaWorks\gs\gs-experiment-protocol`.

Why this file exists. The earlier SDX-1 draft called arm A1 an "expert prompt" but built it from GS content (layering, spec first, tests first, update the README, ask before changing a rule). That is GS delivered through a prompt, not an expert who does not know GS. The papers (white paper section 5.4, corrected version at `C:\workspace\PragmaWorks\gs\gs-paper-fixes\docs\white-paper\GenerativeSpecification_WhitePaper.md`) say the same: the AX control "is GS without its substrate". The question JC wants answered is different: does an expert prompt that contains **none of the load-bearing aspects of GS** behave differently from both naive and GS? He accepts any outcome, provided it is tested rigorously (neither forcing the truth nor giving up in advance).

## 1. The load-bearing list (defined before any run)

"Load-bearing" is used operationally: an element is on this list if (a) the method's own account says the substrate's value rests on it, and (b) it can be present or absent in a repository and in a prompt, and a reader can tell which. Evidence tiers are the protocol tiers from the LOGBOOK (`C:\workspace\PragmaWorks\gs\generative-specification\docs\experiments\LOGBOOK\`), not the paper's A-D labels (the paper's "Tier A" is a replication label; none of these entries is protocol tier A or B).

| Id | Element (operational definition) | Evidence that it is load-bearing | Status |
|---|---|---|---|
| L1 SENTINEL | A persistent, routed entry and navigation file (or small tree) in the repository that a fresh session reads first and that says where things live and what to read for what | KX (LOGBOOK KX): tokens and cost per structural query SUPPORTED, single model, tier C; accuracy INVALID-DESIGN. TX: authored map lowers read cost, SUPPORTED k=5, tier C. SX: map collapses search cost, SUPPORTED as demonstration n=2, tier C | Mechanism evidence, read cost only, frontier model. Nothing measures correctness or durability. The strongest of the five, still modest |
| L2 SPEC-LEDGER | Per-feature specifications kept in the repository with stable ids and acceptance criteria, written before the code and updated at every change, so earlier requirements remain readable | RND-1: prescriptive vs descriptive specification 3/3 vs 0/3, n=3, tier C/D. That result concerns the wording of the spec given to the model. In SDX-1 the base spec and the change texts are identical in every arm, so this part is held constant and not tested. The persistence of a per-feature ledger is untested | Hypothesized (persistence); wording effect measured elsewhere |
| L3 DECISION-RECORD | Recorded decisions with rationale and supersession (an ADR-style record), ratified by the human, consulted before a rule is changed | No controlled test. Workshop observation (an ADR made a merge prerequisite by one participant), tier D, observational. AX had zero ADRs in both arms, so AX could not test it | Hypothesized only |
| L4 ENFORCED-GATES | Machine-enforced checks in the loop that block a failing state: commit or push hooks, tests-must-pass, red-first ordering, a fixture ratchet. Self-reported "I ran the tests" is not a gate | EX: gate caught 15 defects in one deployment, counted by the builder, no baseline, tier D. RND-1 independent-verification arm: honest null, n=2 (model did not reward-hack), tier C/D. AX2: the GS condition delivered the cascade as prompting and did not run an enforced loop | Hypothesized; one demonstration, one null |
| L5 COHERENCE-LOCK | A mechanism that binds specification to code (hash or lock) and detects drift between them, forcing reconciliation | None. RX shows regeneration from a spec (demonstration, tier D), which is not the lock. The newest mechanism in the method | Hypothesized only |

Honest reading of the table: only L1 has controlled evidence, and only for read cost. The list is therefore mostly a list of hypotheses about which parts of the substrate matter, and SDX-1 is the first test of any of L2 to L5. SDX-1 tests the five as a bundle (A4 versus A5). It cannot say which element acts. A per-element ablation is the next experiment (SDX-2, BACKLOG) and only makes sense if the bundle shows a gap.

Items deliberately NOT on the list (they are generic engineering, allowed in the expert-minus-GS arm): layering and boundary rules, SOLID, DRY and small units, naming, validation and error contract, security basics, writing automated tests for new behaviour, running the tests before declaring done (self-discipline, not enforcement), reading the existing code before editing, minimal consistent changes, asking a clarifying question when a requirement is ambiguous, code comments. SX and AX2 say these reduce structural cost and violations; they are what an expert prompt is for.

Grey cases, decided now: "update the README" and "keep notes for the next session" are L2/L3 (persistent project-state documents) and are excluded from A5 by instruction; conventional-commit discipline as decision memory is excluded; "ask before changing an existing rule" is L3 (it presupposes a record) and is excluded, while the generic "ask if ambiguous" is allowed. The line is: instruction to create, maintain, consult or enforce a persistent project-state artifact other than source code and tests.

## 2. Arms that isolate content, vehicle and substrate

All arms use fresh sessions; only the repository carries state; same scaffold, change texts, limits (SDX-1 section 4).

| Arm | Generic engineering content (manifest G) | Load-bearing content (manifest L: L1 to L5) | Vehicle for L | Persistent substrate created |
|---|---|---|---|---|
| A0 naive | none | none | none | none |
| **A5 EXPERT-MINUS-GS** | yes, authored by an external practitioner | **none** | none | **none instructed** |
| A1 EXPERT-PLUS-GS-CONTENT (Full scope) | byte-identical to A5's generic body | yes, as an appendix to the prompt | the prompt, per session | whatever the agent chooses to write |
| A6 EXPERT-UNCONSTRAINED (Full scope) | the same practitioner's natural prompt, written first and frozen before A5 | whatever the practitioner's habits include (classified by M1, descriptive only) | the prompt | whatever the agent chooses to write |
| A0S state-in-text (positive control) | none | none; the earlier change texts and product-owner replies are restated in each later change text | the change text | none |
| A3 flat context file | same G | same L, flattened | one auto-loaded file | the one file |
| A4 substrate | same G | same L, as structure | sentinel tree, ledger, records, hooks, lock | the full tree, enforced |
| A5b | identical to A5, own seed and run order | | | A/A negative control |
| A4x | A4, substrate files removed before change 6 | | | positive control |

A1 is A5 plus the L appendix, so A1 minus A5 isolates "GS content delivered as a prompt". A5 is delivered by the harness in every session and is not written into the repository by the harness. Git history is readable by every arm; no arm except A4 is told to write informative commit messages.

Manifest: about 25 items, each tagged G or L1 to L5 before any artifact exists, by the manifest author, then re-tagged independently by the independent reviewer and a different-vendor judge. Disagreements are settled before the manifest is hashed. Items that are product facts must be derivable from the base spec (the leak rule of SDX-1 section 3).

## 3. Authorship of A5 (the external practitioner)

**PLACEHOLDER AUTHORSHIP PROCEDURE. No A5 prompt exists. Nobody involved in the GS work (JC, the assistant, any agent) may write or edit the final A5 text as if independent. JC names the practitioner; until then A5 is unauthored and SDX-1 cannot be frozen.**

1. Selection (JC): a senior practitioner who writes prompts and agent instructions for coding agents professionally, with no prior role in GS and no commercial tie to it. Record in the logbook: name, relationship to JC, prior exposure to GS (none / read some / trained), paid or unpaid. A practitioner who knows GS well is a validity risk for "minus GS" and is disclosed; one with none is preferred.
2. Brief given to the practitioner (this is the whole of what they get; it does not list L1 to L5 and does not mention GS):
   - The base spec of Pastura and the change-process description: a fresh agent session starts each change; it sees the repository as the previous sessions left it.
   - Task 1 (gives A6, frozen and hashed first): "Write the strongest prompt you can, from your own expertise, that a coding agent receives at the start of every session so that it builds and extends this service well."
   - Task 2 (gives A5): "Take your prompt and produce the version for a study arm in which the agent may not be told to create, maintain or consult any file other than source code and automated tests (so no notes, plans, README or decision records), nor to install or require hooks, CI or other enforcement. Remove what that rules out; change nothing else, and add nothing." A5 is therefore A6 minus the persistence and enforcement instructions, which makes A6 minus A5 exactly the delta the constraint removes.
   - They write blind to A4, A3, A1 and to any result.
3. The practitioner freezes A6 and A5 (SHA-256 recorded) before seeing anything from steps 4 to 6.
4. Only then do they receive manifest L and write the L appendix (giving A1) and the flat file (A3) with the instruction "write the strongest possible artifact". The substrate (A4) is built from the same manifest L by the GS side, by a builder who has seen only the base spec and **not the change texts** (A4's initial substrate holds structure, protocol, hooks, templates and base-spec-derived specs; no content derived from any change text, which the agent adds itself during the run); hashed before the change texts are shared with that builder; the independent reviewer reviews it blind to arm.
5. Revisions: at most 3 per artifact, each triggered only by a failed pre-declared check (a V criterion of SDX-0 or M1 or M2), made by that artifact's author, who sees outputs of its own arm only and never any hidden-oracle number or any contrast between arms (symmetric firewall for A5, A6, A1, A3, A4). Every revision is logged with its trigger.
6. The practitioner attests in writing that the delivered text is their own, discloses any AI tool used in drafting, and records hours. The same disclosure is recorded for A4, A3 and the A1 appendix. The independent reviewer (different person) is named by JC and sees all artifacts blind to arm labels where feasible; the reviewer also edits or reads A4's prose as a human (vendor-of-author concern).

Known cost of this design, stated openly: the constraint in step 2 makes A5 a prompt that a real expert, left unconstrained, would probably enrich with "keep the docs current". A1 is the arm that carries those persistence instructions. If the A5 result is read as "expert prompting", this constraint is the first thing a critic will say, and the answer is that A5 defines the contrast "generic expertise without any project-state mechanism", and A1 the contrast with persistence instructions added.

## 4. Manipulation checks (arm validity, run before freezing and again on run outputs)

### M1. Leak check (A5 must contain no L element; A0 none; A1/A3/A4 must contain all)

- Instrument 1, human: the independent reviewer classifies A5's text and each other artifact per element L1 to L5 as ABSENT / PARTIAL / PRESENT, quoting the sentence, using sections 1 and the grey-case rule.
- Instrument 2, stateless judge from a **different vendor than the generator**, blind to arm label, sees only the artifact and section 1. Run twice per artifact. Judge calibration first: it must classify correctly 100% of 10 planted artifacts (A5 with one L sentence inserted for each element, a clean A5, A4's sentinel file, a flat file), else the judge is replaced.
- Rule: A5 or A0 with any PARTIAL or PRESENT from either instrument is **leaking**; the practitioner revises (counts against budget) and both instruments rerun; at freeze the leak count must be zero. A1, A3 and A4 must show every element PRESENT (content parity with the same judge).
- On run outputs: a deterministic detector (file-pattern script, no judge) counts emergent substrate in the final repository of every chain: instruction or sentinel files (any `CLAUDE.md` or `AGENTS.md` an agent creates counts, because the CLI auto-loads it), spec or ledger directories, ADR or decision files, hooks or CI, lock files, notes; "Decision:" code comments are counted separately as exploratory (ordinary comments are allowed in A5). Chains are not excluded for this; it is reported per arm. **Emergence is a finding, not an invalidation** (critic round 1): if at least half of A5 chains show three or more of L1 to L5 at the final state, decision row (vi-b) applies: the intention-to-treat verdict stands and the arm is described as an expert prompt that induced its own substrate; emergence is reported as a mediator.
- Vendor status: no non-Claude judge CLI is installed on this machine (checked 2026-10-02). Different-vendor judging requires an API key held by JC. Until then M1 instrument 2 is **owed**; the human instrument alone does not satisfy guard (d).

### M2. Strength check (A5 must not be weak by construction)

1. Independent expert review: the independent reviewer, who did not write A5, answers in writing against a checklist: coverage of manifest G items (all must be present), absence of obvious errors, and the question "is this at least as good as what you would write for this task if you may not use project documents or enforcement? yes / no, and what is missing". A "no" with a named gap returns the prompt to the practitioner (budget).
2. Calibration probe (in SDX-0, pilot data, not main data): chains of CR0 plus changes 1 to 3 with A0 and A5, k=3 each. The probe asks only whether the prompt changes the behaviours an expert prompt exists to change, using **targeted metrics only**: A5 passes if its range of layer-boundary violations does not overlap A0's and its median duplication rate is not above A0's. **The hidden-oracle pass rate is never part of M2** and never triggers a revision (critic round 1: using it would tune A5 against the H2 outcome and filter out the "A5 is no better than naive" result before the main run). If A5 is worse than A0 on the oracle by 10 points or more in the pilot, that is flagged for a harness investigation only.
3. If A5 still fails the targeted-metric probe or the expert review after the revision budget, A5 is **weak by construction** and SDX-1 is declared INVALID-DESIGN for every contrast involving A5 (H1, H2, H5, H6). Contrasts not involving A5 remain interpretable. This is logged, not hidden.
4. Not a validity defect, by design: A5 failing to beat A0 on hidden correctness. That is the outcome H2 tests (decision row i).

Both checks are repeated at freeze on the final text. Independent reviewer and practitioner must be two different people, neither being JC nor an agent.

## 5. What this design does not do

It does not show which element of L1 to L5 matters (bundle only). It does not test governance, audit, handoff or human maintainability. It does not test a larger repository than a fresh session reads (BACKLOG B6). It uses one vendor, one mid-tier model and one invented project.
