# Raw output of stateless critic 1 (claude -p, model opus, no tools, saw only the protocol and the 2026-10-01 SDX design draft)

Unedited. Focus prompt: YOUR FOCUS (critic 1, construct validity and arm fairness): (a) construct-validity holes: what does each primary metric ...

# Adversarial review of SDX: construct validity and arm fairness (critic 1)

## CRITICAL

**C1. The primary readout measures how good the final state is, not durability (§1 H1, §6 E1, §9).** H1 claims that A1 *degrades* over time while A4 *holds*. The primary test is E1 at CR12, which is a single level. If A4 starts ahead at CR0 because it has more content (see C3), it wins H1 with zero difference in degradation. P1 states a CR4→CR12 loss, but neither the falsifier nor the primary test uses it. As written, "durability" is just "better at the end".
*Fix:* Make the primary test the arm × CR-index interaction. Two options: the slope of E1, or E4 regression flips per CR, from the mixed model, with the CR0–CR3 level as a covariate. Rewrite the H1 falsifier in terms of that slope difference.

**C2. Commit hooks give A4 a free rollback (§4 acceptance rule, §2 A4).** Pre-commit and pre-push hooks with red-first and the ratchet refuse to commit a failing state. A1, A2 and A3 have no hooks, so they keep failing states ("otherwise the failing state stays"). If the state that gets scored is the last commit, A4 automatically reverts to its last green state. That produces better E2, E4 and E1 by construction. It comes from the harness and is not the substrate working. The design also never says whether the scored state is HEAD or the working tree.
*Fix:* Score the working tree for every arm, and apply one harness-level rule to all arms ("if own tests fail after 3 attempts, revert to last green" or "never revert"). Report how often A4's hooks blocked a commit.

**C3. Content parity is broken in A4's favour (§3).** The token match is to the substrate *sentinel*. A4 also gets the feature specs with acceptance criteria, ADRs, contracts.md, use-cases.md and test-architecture.md. P_expert has to squeeze about 25 manifest items into the length of the sentinel alone. Worse, contracts.md and use-cases.md come from the same Pastura cascade as the oracle. The oracle's field names are "fixed in the per-CR contract". So A4 may be carrying information the oracle checks, and the other arms only get the README.
*Fix:*
- Strip all product and contract information out of the substrate. Product knowledge comes only from the base spec and R_k, identical in every arm.
- Match the total tokens of all method content across arms, not just the sentinel.
- Have a judge check that no arm artifact contains oracle-relevant facts.

**C4. The guard-(a) controls the protocol requires are missing (§10, §13).** There is no planted positive control and no A/A negative control. The ceiling check covers only A0 (≥95%). But this program's own past failure was a ceiling between the *expert* arm and the treatment. If A1 and A4 both sit near 95–100% E1, the study will report "no difference" when it is really a ceiling.
*Fix:*
- Add a positive control: an A4 variant whose substrate has sabotaged rules, or injected regressions at a known rate.
- Add an A/A pair: two independent A1 cells.
- Apply the ceiling and floor rule to A1 and A3 as well. If A1 is at ≥90% E1 at CR12, the outcome is INVALID-DESIGN.

## HIGH

**H1. The H4 metrics are circular (§8).**
- *Reconstruction* scores whether recorded rationale can be found. A4 is told to keep ADRs and a ratifications file; A1 is told nothing of the kind. That is a targeted metric labelled as primary.
- *Defect taxonomy*: the five injected classes ("renumbered criterion with stale derived test", "unclaimed public route", "stale doc claim") mirror sensors S1–S4. A1 has no criteria to renumber.

*Fix:* Label reconstruction as targeted. Make query (ii) primary. Use only defect classes defined against the shared base spec and CR list, such as behaviour contradicting a CR, or a regression in an untouched rule. Have the taxonomy authored by someone without access to the sensors.

**H2. The H3 result is fixed by construction (§1 H3, §7).** The falsifier compares A4 against *A1-no-prompt*. Removing the prompt removes A1's whole treatment, while A4's treatment stays in the repo. From CR7 onward A1-no-prompt is effectively A0, so a large drop is guaranteed. The quiz is also "keyed from experimenter logs" about decisions that only A4 is told to record. Finally, a different-vendor handoff mixes the vendor change with the handoff itself.
*Fix:*
- Make A1-with-prompt the primary comparator.
- Key quiz questions only to *behaviour* that can be checked by probe.
- Add a same-vendor fresh-session handoff so the vendor effect can be estimated separately.

**H3. A3 and A1 are deliberately weakened (§2).**
- A3 is "unstructured prose". No competent practitioner writes a flat context file without headings. This inflates H5 (A4 over A3).
- A1 is barred from keeping notes, but real experts persist decisions. The H1 contrast then reduces to "state vs no state", which is a trivial claim.
- The external P_expert author is only "preferably".
- The equal 3-revision budget hides an asymmetry: the substrate inherits months of Open Diamond refinement, and the prompt and flat file start from scratch.
- The pilot runs on Claude only, is tuned by JC (who knows the hypotheses), and its pass criterion is "A0 below **A4**".

*Fix:*
- Let A3 be the best structured single file, written by the external practitioner.
- Make the external P_expert author mandatory, and give that author the same pilot iterations and transcripts.
- Change the pilot criterion to "A0 below the best arm".
- Have all three artifacts revised by someone blind to which arm a change favours.

**H4. Benchmark and metrics are aligned to GS (§4 CR table, §6 E5).** Every CR is annotated with the substrate mechanism it stresses (case c, triage, D1/D2). None stresses gate friction or overhead, so the A1>A4 row in §17 is hard to reach. E5 (mutation score with the arm's *own* tests) is directly targeted by red-first and the ratchet, yet it is listed as primary.
*Fix:*
- Have an independent party write or sample half the CRs from a brief, including CRs where heavy process is a cost (rapid throwaway features, frequent small reversals).
- Move E5-own-tests to targeted; keep only the hidden-suite kill rate as primary.

## MEDIUM

**M1. Decision points have no answer channel (§4 CR4/CR8, §2 A1 "ask before changing a rule").** Every session is headless, so nobody answers the agent's question. How D1/D2 get resolved depends on the arm (A4 has a triage rule; A1 can only stall). That stalling burns turns and is a handicap.
*Fix:* Use a scripted oracle-PO responder that gives identical answers to any arm that asks. Log whether each arm asked.

**M2. H2 mixes expertise with prompt variability (§2 A2).** P_novice is regenerated on every CR, while P_expert is frozen. The interaction therefore measures author expertise plus consistency across CRs. An LLM told to be a "senior engineer" is not a novice.
*Fix:* Add a frozen-novice prompt (written once) and call the construct "non-GS author".

**M3. H5 cannot isolate enforcement (§2, §1 H5).** There is no arm with enforcement but no structure (A1 plus a pre-commit hook that requires `npm test` to pass). The H1 and H5 falsifiers say "within SESOI", which needs a TOST equivalence test (protocol guard h, §6 row 3). The H1 falsifier only fires if the upper CI bound is below 8 pp; at n=15 per arm that will almost never happen, so falsification is close to impossible.
*Fix:*
- Add arm A1g (expert prompt plus a generic test-must-pass hook).
- Use TOST for every "within SESOI" claim.
- Make the falsifier symmetric with the support rule.

**M4. Token and turn caps cut both ways (§4).** A4 reads more, so the same token cap may truncate its sessions.
*Fix:* Pre-register a check that cap-hit rates are similar across arms, and treat a large imbalance as a validity defect.

## Better hypotheses than H1–H5

1. **Persistence vs structure, at full strength:** an expert prompt plus a self-maintained decision log (agent-chosen format) versus A4, on regression-flip slope. This is the contrast a buyer would actually face.
2. **Enforcement-only:** a generic test gate (A1g) recovers at least X% of the A4–A1 gap on E2 and E4. If true, the substrate's value is the hook, not the tree.
3. **Spec-change propagation:** after CR7, the share of hidden probes that encode the *new* rule and pass, measured over CR7–CR12. No residue counting, which is a targeted metric.
4. **Dose–response:** the A4–A1 gap grows monotonically with CR index (primary test on the interaction term). This is the real durability claim and is falsifiable by a flat gap.
5. **Overhead:** cost per hidden-correct change is not higher in A4 over CR0–CR12. This is a pre-registered way the substrate can lose, not a footnote under P9.
