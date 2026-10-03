# Trunk M skeleton: evaluating externalized-specification methods, and what one programme's negative results show (2026-10-03)

Status: skeleton, not a draft. Companion to `TREE.md` (card M) and `MIGRATION-MAP.md`. Every row of section 5 is a logbook entry from `C:\workspace\PragmaWorks\gs\gs-experiment-protocol\docs\experiments\LOGBOOK\README.md` (state 2026-10-02) or a number the white paper reports from committed data; counts are to be recounted from the entries at submission.

## 1. Title options

1. Evaluating Specification-Driven Agent Methods: Fifteen Experiments, Nine Invalid Designs, and a Protocol Built from the Wreckage
2. When the Treatment Writes the Metric: Validity Defects in the Evaluation of Externalized Specifications, from One Programme's Own Record
3. Registered, Untargeted, Cross-Vendor: A Case Series and Checklist for Evaluating Agent-Specification Methods

Recommendation: option 3 for a methods venue; option 1 for a practitioner venue (IEEE Software). Option 2 is the clearest statement of the central lesson.

## 2. Abstract draft (at most 200 words; the counts are placeholders to be recounted)

Evaluating a method whose own text can define the metric invites errors that look like results. We audit the evaluations of one externalized-specification method, run by its author over [N] experiments before any preregistration existed, and classify each by the validity defect that limited what it could show: a metric the treatment instructs, an answer key derived from the structure under test, ceiling and floor effects, an oracle that measured convention rather than function, test infrastructure that dominated a metric, vacuous tasks, conditions designed after seeing earlier gaps, and judges from the generator's family. [K] of the [N] carry an invalid-design label on at least one question, none can be called preregistered, and none refuted the author's expectation except one null. We describe the protocol written in response: invalid design as a first-class outcome, evidence tiers by registration and independence, controls and untargeted primary metrics, cross-vendor judges, external timestamps, independent replicators, and uniform reporting of nulls. We [do / do not yet] report a prospective check. We offer a checklist and argue that the negative-result record is this work's most transferable output. The classification was made by the author's side and is [independently audited / unaudited].

## 3. Contribution list

1. **A documented case series**: one programme's evaluations, all entries listed (selection rule: every entry, not a chosen subset), each classified by validity defect with the entry id as evidence.
2. **A catalogue of defect classes specific to evaluating methods whose treatment defines the metric**, with the "targeted versus untargeted metric" rule and INVALID-DESIGN as a registered outcome.
3. **The protocol as a countermeasure and an artifact**: guards (controls and floor/ceiling; untargeted metrics; non-memorized benchmark; independent stateless judges; falsifiers in advance; intuition-versus-result audits; stopping rules; power and limits; uniform reporting), tiers, roles, freezing mechanics and what each mechanism does not prove.
4. **A checklist** for authors, reviewers and replicators of externalized-specification studies.
5. **If run in time: a prospective check** that the harness-validation step (SDX-0) and a judge-validity measurement (B11) detect the defects the case series says they should.

Not contributions: general advice already in the LLM-in-SE guidelines (Sallou et al., Baltes et al.); any claim that GS works.

## 4. Section outline

| # | Section | Content | Source |
|---|---|---|---|
| 1 | Introduction | why evaluating a method with self-defining metrics is hard; the programme as a case; what the paper does not claim | WP 6; EXPERIMENT-PROTOCOL 0 |
| 2 | Background | guidelines for LLM studies (Sallou et al. ICSE-NIER 2024; Baltes et al. arXiv:2508.15503); same-model judge bias (Panickssery et al. NeurIPS 2024); benchmark verification inflation (Wang, Pradel, Liu arXiv:2503.15223); long-horizon degradation measured by benchmark (SlopCodeBench); construct validity (Ralph and Tempero 2018); registered reports (Chambers 2013); the Empirical Standards | literature map C7 |
| 3 | The case series: method | all entries, backfilled 2026-10-02 from repository files; how classification was done; who classified; what "tier" means; commit dates are author-controlled | logbook README |
| 4 | Defect catalogue | one subsection per class, each with entries as examples (table in section 5) | logbook |
| 5 | The protocol | stages 1 to 9, guards a to i, outcomes and tiers, freezing, roles (expert practitioner, critics, independent reviewer, blind judges, replicator), stop rule; what each mechanism does and does not prove | EXPERIMENT-PROTOCOL; ROLES; PREREG-HOWTO |
| 6 | Prospective check (if run) | SDX-0 harness validity results; B11 judge self-preference and noise | SDX-0; BACKLOG B11 |
| 7 | Checklist | a one-page list | |
| 8 | Threats to validity | below | |
| 9 | Discussion and conclusion | negative results as an asset; what changes for authors of such studies | |

## 5. Claims-evidence table (case series, from the logbook)

| Defect class | Example entries (outcome, tier) | What the entry supports saying |
|---|---|---|
| Metric stated by the treatment | AX-K5 layer violations: SUPPORTED as mechanism only; AX2 same (tier C) | the metric counts the rule the structured prompts state, so it favours both structured arms by construction; reported as targeted |
| Answer key derived from the structure under test | KX accuracy INVALID-DESIGN; BX INCONCLUSIVE, circular for one repository (tier C) | accuracy and validity claims are withdrawn; tokens and cost remain SUPPORTED for KX |
| Ceiling, saturation | AX and AX2 GS vs expert INVALID-DESIGN; MX quality INVALID-DESIGN; RND-1 bounded context INVALID-DESIGN | a tie at the ceiling is not equivalence |
| Floor | NX registered H1 INVALID-DESIGN (floor); RND-1 test-faking NULL by floor | a null where the failure never occurred cannot test the countermeasure |
| Oracle measuring convention not function | AX2 oracle: 0 of 13 on functional apps (INVALID-DESIGN) | runtime sub-metrics withdrawn |
| Infrastructure dominating a metric | AX2 coverage ranged from 1 to 95% across repetitions through test-infrastructure failures | the test environment is itself a source of error |
| Vacuous tasks | CX INVALID-DESIGN: 5 of 5 against 5 of 5, three tasks vacuous | nothing usable |
| Conditions designed after seeing earlier gaps | AX post-hoc series (3/14 to 14/14): DEMONSTRATION; 3 of 10 registered predictions confirmed | a diagnostic series, not an effect size |
| Protocol file dated after the data | AX-K5 (tier C) | pre-specified in intent only |
| Registration the reader cannot inspect | AX original design: commit ids not in the public history; protocol demonstrates a tag stamped with a forged date on one machine | author-attested only |
| Same-family judge; run-to-run noise | AX-K5: audit disagreement up to 6 points between two runs of one prompt; AX kappa 0.62 is run-to-run consistency | judge validity must precede any audit number (B11) |
| Smallest attainable p | AX k=5 against 5: smallest exact two-sided p is 0.008 (2/252) | a Cliff's delta of 1.0 means no overlap in five draws |
| Memorized benchmark; missing canary | Conduit; CR canary result file absent | non-memorization rests on an invented domain, not a measured recall |
| Weak-rung artifacts that did not serve | CR behaviour INVALID-DESIGN | behaviour gradient untested |
| Counting and ratios | closed rows: 15; none tier A or B; nine with INVALID-DESIGN on at least one question; no REFUTED; TX the one null against expectation | recount from the index at submission |

## 6. Threats to validity (outline)

1. **Self-audit.** The author's side classified the author's experiments; the entries were written by an assistant on 2026-10-02 from repository files. Owed: an independent classification by a stateless reader of another vendor and by one human outside the GS orbit, with agreement reported.
2. **Selection and hindsight.** Listing all entries mitigates selection; hindsight bias in labelling remains. The protocol's own definitions (outcome labels, tier rules) are fixed before labelling.
3. **N of one programme.** The catalogue is not a sample of the field. State it as a case series.
4. **Survivorship of the protocol.** The protocol has not yet governed a completed experiment; until SDX-0 closes it is a design, not a track record.
5. **Prospective check is small.** SDX-0 and B11 test the harness and the judges, not the whole protocol.
6. **Novelty.** Much is general advice already published; the claim is the case series and the targeted-metric rule applied to methods that define their own metrics.

## 7. Exactly what must exist before submission

Mandatory:

- [ ] Protocol and logbook merged to `origin/main` and archived with a DOI (shared with R0).
- [ ] Recount of every entry, outcome label and tier from the entries themselves, in a script-generated table.
- [ ] Independent audit of the classification (section 6, item 1), with the disagreements and their resolution reported.
- [ ] Each defect class backed by at least one entry id and, where numbers are quoted, the source data file.
- [ ] The checklist (section 7 of the paper) written and applied to the programme's own SDX-1 preregistration as a worked example.
- [ ] A statement of what the protocol does not prove (OSF, Zenodo, tags; the forged-tag-date demonstration reproduced and its command recorded).

Strengthens (do not claim if absent): SDX-0 closed with its pass criteria (V1 to V13) reported; B11 judge-validity numbers; one external reviewer's critique of the checklist.

If the short NIER version is the first target (deadline 2026-10-23), the mandatory list above must be reduced to what fits, and the paper must say which items are owed; the page limit was not verified.
