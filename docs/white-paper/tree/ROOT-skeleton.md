# ROOT (R0) skeleton: framework, evidence ledger and preregistered programme (2026-10-03)

Status: skeleton, not a draft of the paper. Companion to `TREE.md` (section 4, card R0) and `MIGRATION-MAP.md` (section 3, "What the IEEE draft becomes"). Every result below is taken from the logbook index (`C:\workspace\PragmaWorks\gs\gs-experiment-protocol\docs\experiments\LOGBOOK\README.md`, state of 2026-10-02) and the hypotheses file (`...\HYPOTHESES-2026-10-02.md`). Nothing is invented; items marked "recount" must be re-derived from the entry or data file before print.

## 1. Title options

1. Generative Specification: A Framework, an Evidence Ledger and a Preregistered Programme for Specification-Driven Agent Development
2. What Does an Externalized Specification Buy? A Falsifiable Decomposition for Agent-Built Software
3. Derivability, Durability and the Substrate: A Research Programme with its Evidence Stated at Face Value

Recommendation: option 1 (it states the three things the paper is, and promises no result). The earlier working title ("A Discipline of Derivability for the Stateless Reader") promises more than a framework-and-ledger paper delivers.

## 2. Abstract draft (target at most 200 words; no numbers)

AI coding agents begin each session with no memory of the last, so specification-driven development depends on what the repository, rather than the model or the prompt, carries between sessions. We present Generative Specification (GS) as a framework and a research programme, not as a result. The framework has four parts: a derivability criterion (a reader with no memory can determine correct output from the artifacts alone); a seven-property instrument whose validity is not established; a substrate of five operationally defined components (navigation map, specification ledger, decision records, enforced gates, coherence lock); and five hypotheses, each with its own construct, an outcome the treatment does not target, and a refutation criterion, so that removing one component should move one outcome and not the others. We then report, in one evidence ledger with registration tiers, every experiment run to date: none was preregistered externally, several are invalid designs, and the one comparison against an expert prompt was uninformative because both arms saturated. We describe the protocol, roles and replication terms that will update the ledger. We claim no speed advantage, no superiority over an expert prompt, and no instrument validity. The contribution is a falsifiable decomposition and an honest record.

(Word count of the draft above: 199, at the limit; re-verify at assembly.)

## 3. Contribution list

1. **Framing, not a new criterion.** The stateless reader named as the structural condition of agent-built software, and derivability stated as the obligation it creates. The paper does not claim the criterion is new (literature map: novelty risk HIGH); it claims the naming, and the decomposition that follows.
2. **An operational decomposition of the substrate** into L1 sentinel, L2 specification ledger, L3 decision record, L4 enforced gates, L5 coherence lock, with an observable test for each (`prereg\SDX-1-ARMS.md` section 1) and a stated evidence status per component.
3. **Six orthogonal hypotheses** (P1 navigation economy, P2 executed-verification yield, P3 coherence and reconstructability, P4 durability, P5 practitioner variance, P6 spec-to-implementation throughput to a verified COMPLETE; P6 added 2026-10-03, see `P6-skeleton.md`) plus the methods trunk M, with a component-by-outcome prediction matrix, the double dissociations that would refute the component story, and refutation criteria.
4. **An evidence ledger** of every logbook entry with outcome label and tier quoted verbatim, including nulls, invalid designs and demonstrations, and the rule that nothing is cited above its tier.
5. **A preregistered programme and an update rule**: the protocol (guards a to i, outcome labels, tiers), roles that must be independent, independent-replication terms, and the living-ledger rule (dated changelog; journal version is a snapshot).

Explicit non-contributions (stated in the paper): speed or productivity gains; superiority over an expert prompt; superiority over spec-driven tools (Kiro, Spec Kit, traceSDD); validity of the rubric; that the bridge theory is true; that governance is the durable value.

## 4. Section outline

| # | Section | Content | Source | Budget |
|---|---|---|---|---|
| 1 | Introduction | the stateless-reader condition; why a framework and a ledger; what the paper does not claim | WP 1; IEEE I | 0.75 p |
| 2 | Premise: derivability | the criterion; the stateless reader as vivid case; what is ours and what is the field's (honesty beat); lineage (Parnas and Clements, Meyer, Lahiri) | WP 2.3; IEEE III | 1 p |
| 3 | The instrument | seven properties, compact; status: unvalidated; discriminant-validity programme (leaf I-1) | WP 3; IEEE IV.A; ScoringGuide | 1 p |
| 4 | The substrate L1 to L5 | operational definitions and evidence status each; the bridge, sentinel and phase-collapse as explanations with consequences mapped to trunks | SDX-1-ARMS 1; WP 4.1 | 1.5 p |
| 5 | Evidence ledger | one row per logbook entry (table 1); AX k=5, AX2 and CR condensed tables as tier C detail (D1 option "ROOT with data") | logbook; IEEE VI | 2.5 p |
| 6 | Hypotheses and prediction matrix | P1 to P6, M, moderator, instrument; dissociations; refutation criteria; sufficiency ratio (expert prompt rival) | HYPOTHESES; literature map 4.3 | 2 p |
| 7 | The programme | protocol, roles, tiers, preregistration mechanics, replicator terms, the tree, update rule | EXPERIMENT-PROTOCOL; ROLES; REPLICATOR-BRIEF | 1 p |
| 8 | Related work | condensed; 2026 competitors (Gloaguen, Khatri, Lulla, Farrag, RAMP, traceSDD, Canedo, SlopCodeBench) | IEEE II; literature map | 1.5 p |
| 9 | Threats to validity | below | WP 6; IEEE VII | 1 p |
| 10 | Conclusion | what a reader may and may not take from the paper | | 0.5 p |
| | Data availability; AI disclosure | replication package DOI; logbook archive DOI; disclosure line | IEEE | |

Estimated length: 12 to 14 pages in the IEEE two-column format, inside the 20-page limit given in the existing checklist.

## 5. Claims-evidence table (from the logbook; nothing invented)

"May state" is the strongest sentence the paper may print. "May not" lists the nearby claims the entry does not support.

| Id | Claim | Logbook entry, outcome, tier | May state | May not state |
|---|---|---|---|---|
| R1 | A specification can be driven to a passing regeneration | RX DEMONSTRATION, tier D; ALX DEMONSTRATION, tier D (backfilled from the ledger, primary record unchecked) | one reproducible regeneration passed its tests (104 for RX; recount); a formal-tier compiler was derived from its own spec (ALX, record to be checked) | that derivability is measured; that regeneration generalizes; ALX's curve as an effect (specification edited until tests pass) |
| R2 | The seven-property rubric measures something real | BX INCONCLUSIVE, n=3, circular for one repository, tier C | the instrument is proposed; its validity is untested; a discriminant-validity programme is registered as future work | any validity or author-independence claim |
| R3 | L1, a routed authored map, lowers read cost | KX tokens and cost SUPPORTED (accuracy INVALID-DESIGN, circular key), tier C, one model; TX sentinel SUPPORTED, structure alone NULL at 16 to 37 files, tier C; SX sentinel on search cost SUPPORTED as demonstration (n=2), surface residual INCONCLUSIVE, tier C | on small repositories and one frontier model, a routed map lowered tokens per structural query and removed search; layering alone did not (KX: 78,603 vs 100,237 vs 233,583 tokens per query, recount) | any correctness effect; any effect once a repository outgrows a session; whole-session cost including upkeep |
| R4 | L2, per-feature specifications, help | RND-1 prescriptive vs descriptive wording SUPPORTED (near-definitional), n=3, tier C/D | wording of the specification matters (3 of 3 vs 0 of 3, recount) | that a persistent per-feature ledger helps (untested) |
| R5 | L3, decision records, help | no entry; workshop observation (an ADR made a merge prerequisite), tier D | hypothesized only | any effect |
| R6 | L4, enforced gates, help | EX DEMONSTRATION, tier D (gate caught 15 builder-counted defects, no baseline); RND-1 independent verification NULL by floor, n=2, tier C/D | one deployment closed its cycle with gates; no behaviour for an independent verifier to catch arose in the pilot | that gates catch more than other layers (P2); that they halt erosion (P4) |
| R7 | L5, coherence lock, helps | no entry | hypothesized only (newest component) | any effect |
| R8 | Structured specification beats unstructured use on structure | AX layer violations SUPPORTED as mechanism on a targeted metric, tier C; AX2 naive vs disciplined SUPPORTED as mechanism across three vendors, tier C | on one benchmark, k=5 (AX) and five per cell (AX2), layer-boundary violations fell from medians of 30 to 45 to 0 (recount from `stats.json` and `static_ax2.json`); the metric is stated by the treatment | quality improvement beyond the targeted metric; the audit score (INCONCLUSIVE) |
| R9 | GS beats an expert prompt | AX and AX2 GS vs expert INVALID-DESIGN (ceiling, saturation), tier C | the two arms were indistinguishable on single-shot median quality and both were saturated; the comparison could not have shown a difference | equivalence; advantage; that the substrate adds nothing (H-S is untested) |
| R10 | The value of the scaffold recedes as capacity rises | CR duplication and complexity INCONCLUSIVE, direction as predicted; behaviour INVALID-DESIGN, tier C; MX quality INVALID-DESIGN, tiering INCONCLUSIVE, tier C/D | direction consistent with the moderator hypothesis on structure; k=3, one benchmark | a capacity law; model-agnosticism |
| R11 | The substrate halts erosion or preserves intent over a long chain | none run (SDX-1 designed, not frozen) | hypothesis P4 with registered refutation criteria | any durability claim |
| R12 | Governance and audit value | none clean (AX-K5 audit noise up to 6 points between two runs of one prompt) | hypothesis P3 | any audit or reconstruction claim |
| R13 | Practitioner independence | none | hypothesis P5; an explicit statement that the thesis is unmeasured | variance reduction |
| R14 | Practitioner transfer in the field | workshop observation, tier D, private source | observational context only, if anonymized | any effect; not evidence |
| R15 | Provenance of the properties | six production projects, tier D; two confidential | where the properties came from | any effect |
| R16 | Speed or productivity | not tested | the paper does not claim it | any statement of speed |
| R17 | Generation cost premium | AX objective cost metric, tier C | the cascade cost more per generation than naive and expert arms on this task (ratios from `stats.json`, recount) | that GS is cheaper overall |

Ledger summary (logbook index, recount at submission): 15 closed rows, none tier A or B, nine with an INVALID-DESIGN label on at least one question, no REFUTED, TX the one null against the author's expectation; SDX-0 and SDX-1 designs reviewed by Claude critics only.

## 6. Threats to validity (outline, one paragraph each)

1. **Proponent authorship.** Method, specifications, rubric, audit prompts, experiments and scoring are by one author (WP 6). Mitigations in the programme (not in the ledger): preregistration with an external timestamp, an external practitioner for the expert arm, an independent reviewer, different-vendor critics and judges, independent replicators.
2. **Retrospective tiers.** Every ledger entry was backfilled from repository files; commit dates are author-controlled (the protocol demonstrates a forged tag date on one machine). No entry may be called preregistered.
3. **Targeted metrics and circular keys** (AX layer metric; KX answer key; rubric as treatment vocabulary): stated per row; M carries the catalogue.
4. **Ceiling and floor** (AX, AX2, MX, RND-1, NX): "equivalent" is never printed where the design could not have detected a difference.
5. **Benchmark contamination.** Conduit is probably memorized; Pastura is invented and its canary result is owed (CR has no canary result file).
6. **One vendor, one family, mid-tier or one frontier model**; heterogeneous harness; model drift.
7. **No human participants** in any controlled study; the field evidence is observational.
8. **The substrate is tested as a bundle** until the component ablation (SDX-2).
9. **The classification of past entries** is itself author-produced; an independent audit is owed (shared with M).
10. **Competing explanations:** the rubric as a proxy for general engineering hygiene (RAMP's authors say this of theirs); the model navigating unaided (SX); the effect being AI compression and not the substrate (P5).

## 7. Exactly what must exist before submission

Mandatory:

- [ ] JC decisions D1 to D3 of `TREE.md` section 10 recorded (ROOT scope, orthogonal set, tier relabelling), with a dated entry in `PAPER-DECISIONS.md`.
- [ ] The protocol, logbook, prereg drafts and hypotheses merged to `origin/main` (they are on branch `experiment-protocol-2026-10-02` today) and archived with a Zenodo DOI, so every citation resolves.
- [ ] Every evidence label in the manuscript converted to logbook tiers and outcome labels, verbatim (MIGRATION-MAP section 1, items 1 to 7).
- [ ] Every number recomputed from `experiments/ax/runner/stats.json`, `experiments/ax/runner/static_ax2.json` and `experiments/cr/RESULTS-final.md`, and the KX token figures from the KX entry.
- [ ] The ALX row downgraded to what the backfilled entry supports, or replaced after reading the primary record in the Loom repository.
- [ ] L1 to L5 definitions and the prediction matrix copied from the preregistration files, not paraphrased.
- [ ] A claims-evidence check (section 5) passed by a stateless external reader who sees only the manuscript and the logbook index.
- [ ] The IEEE Access hard requirements already listed in `ieee-access\SUBMISSION-CHECKLIST.md` section B: ORCID (recorded), two-column template, abstract 150 to 250 words, index terms, AI-disclosure line, CrossCheck against the Zenodo v4.0 preprint (DOI 10.5281/zenodo.21726017), replication-package DOI, APC approval, human copy-edit, cover letter.
- [ ] Fix `ieee-access\supplement\S1-AX-replication-protocol.md` (stale text) before it ships in the package.
- [ ] The Zenodo DOI usage reconciled (BRANCHES.md decision 7).

Not required for R0 (and must not be implied): any new experiment; any trunk result; SDX-0 or SDX-1 completion.

Should have: the white paper and Compendium corrected in the same pass so that no published text uses the retired labels; a one-page "what changed" note for readers of v4.0 and v5.0.
