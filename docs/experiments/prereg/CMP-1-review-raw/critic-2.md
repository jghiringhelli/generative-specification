**CRITIC:** Claude Opus 5.5 (claude-opus-5-5, Anthropic). This is the same vendor family as the author and the earlier critic round, so this review does **not** count toward the vendor-diverse requirement of section 18.
**PRIOR_EXPOSURE:** None recognized. I have no memory of CMP-1, E2E-1, REM-1, FX-1 or earlier reviews. I know GitHub spec-kit in general from training data, but not release v1.1.x.
**CONFIDENCE:**
- Medium-high on the logic of the decision table and the metric definitions.
- Medium on the numbers I derive. They are hand arithmetic from the published `results.md` rows, assuming rough independence between cells, and should be confirmed by simulating the composites directly.
- Low on spec-kit specifics such as the existence and behaviour of `converge`.

I checked these and found them sound as designed: the sealing of probes outside every repository, the hashing of scripts before data, the third-vendor judges being barred from changing decision rows, and the rule that runs where an arm did not complete its method are scored rather than excluded.

---

### F-01
**SEVERITY:** BLOCKER
**SECTION:** 2 (pre-stated outcomes) and 13 (composite outcomes)

**QUOTE:** "G costs more than B while G-B is not "G AHEAD" on either (the substrate bought nothing measured here)."

**PROBLEM:** The composite labels cannot tell the hypotheses apart, because they combine an outcome the pilot measures well with outcomes it measures badly.
- Cost at a ratio of about 2 (the section 11 prior for G/B) is called COSTLIER with probability 0.98.
- "G AHEAD" on P-ESC for a true 20-point reduction (twice Delta, the GS side's own hypothesis) has probability 0.34.
- From the published rows, my rough figures for P(GS LOSES fires):
  - about 0.9 when G truly equals B on both quality outcomes;
  - about 0.6 when G truly cuts trap violations by 20 points against both comparators;
  - about 0.35 at 30 points.
- BARE WINS is likewise about 0.55 under a global null. It is blocked only by a tool AHEAD or SUGGESTED at about 0.11 (P-ACC) or 0.16 (P-ESC) per cell.

So the most likely published headline is "GS LOSES", whether or not GS's thesis is true. The likelihood ratio between "GS works as hypothesised" and "GS does nothing" is about 1.5. The label also turns "not resolved" into "loses", which contradicts section 13's own rule that an unresolved quality interval is INCONCLUSIVE and section 10's statement that "a null here means 'not resolved'".

**FIX:**
1. Before freezing, simulate the operating characteristics of every composite (P(label | scenario)) under at least four scenarios: global null; G +Delta on P-ESC only; G +2·Delta on P-ESC; K = G and both beat B. Publish the table in section 10.
2. Require a composite label to have a likelihood ratio of at least about 3 between the scenario it names and the global null; otherwise drop the label.
3. Concretely, split the cost clause into "GS COSTLIER, QUALITY UNRESOLVED" (both quality cells INCONCLUSIVE or SUGGESTED) and "GS LOSES" (G behind, or a TIE on quality with G COSTLIER). Do the same for BARE WINS.

---

### F-02
**SEVERITY:** BLOCKER
**SECTION:** 14 (public statements)

**QUOTE:** "GS AHEAD or SUGGESTED on a quality outcome | "In a pilot of 5 runs per arm and vendor on one invented task with two models, GS scored [d, interval] points higher than [arm] on [measure] (hidden tests / traps violated); the cost was [ratio].""

**PROBLEM:** The rules for what may be said publicly are asymmetric.
- A GS SUGGESTED result (interval includes zero) gets the same affirmative sentence as AHEAD. Section 13 prescribes a different sentence for SUGGESTED: "the interval includes zero; the pilot cannot tell".
- The adverse rows ("GS LOSES") trigger only on K or B being **AHEAD**. A K SUGGESTED or B SUGGESTED over G produces no named public sentence; it falls into MIXED.
- From `results.md` at true difference 0: P(ahead) is 0.08 on P-ACC; on P-ESC, P(ahead) is 0.04 and P(suggest) is 0.12. That gives about 0.25 per G contrast across both outcomes, so roughly a 40% chance under a **true global null** of a publishable sentence reading "GS scored d points higher".

This is the single most GS-favouring element in the document.

**FIX:**
1. Split the row. "GS AHEAD" keeps the sentence. "GS SUGGESTED" must use section 13's wording verbatim, including "the pilot cannot tell", and may not appear without the interval.
2. Add mirror rows "K SUGGESTED over G" and "B SUGGESTED over G" with the same wording and prominence.
3. State in section 14 the null probability of each publishable row, taken from the simulation in F-01.

---

### F-03
**SEVERITY:** BLOCKER
**SECTION:** 7 (co-primary) and 12 (analysis plan)

**QUOTE:** "no multiplicity adjustment; there are six pooled intervals, three contrasts on two outcomes, and the pilot's word for them is "estimates""

**PROBLEM:** Calling them "estimates" does not help when the same intervals feed mechanical labels (section 13) and pre-written public sentences (section 14).
- Under the simulation's own interaction assumption (vendor × arm SD 0.3), a single P-ACC contrast at true 0 is AHEAD in a given direction 0.08 of the time and excludes zero on the wrong side 0.088 of the time. That is about 0.18 two-sided, not 0.05.
- Across six quality cells, P(at least one AHEAD in either direction | global null) is roughly 0.4–0.5 by my arithmetic. It is about 0.8 if SUGGESTED is counted.
- The rate **rises with k**: wrong-sign at null is 0.088, 0.154 and 0.227 for k = 5, 10 and 20. Section 10's "Interval check" defends this as coverage of the two-vendor conditional truth. That defence is valid for the interval but not for the labels and sentences, which are read as statements about the tools.

**FIX:**
1. Report the family-wise null rate of each label (from simulation) beside the decision table.
2. Either apply a Holm or max-t adjustment to the intervals used for **labels** (keeping unadjusted intervals as descriptive), or require AHEAD to hold in both vendor-specific intervals, not only in the pooled one.
3. State in the label text that the reference population is "these two models", and remove any phrasing that implies tool-level generality.

---

### F-04
**SEVERITY:** BLOCKER
**SECTION:** 7 (P-ESC)

**QUOTE:** "the share of the 6 planted traps that were violated, i.e. the step's probes on the trap rule failed at its own step or a carried probe that passed earlier fails at the end (a trap counts only if the carried behaviour passed at its own earlier step; excluded traps are reported per arm, with an intention-to-treat sensitivity that counts them as failures)"

**PROBLEM:** There are two biases, in opposite directions, and the primary outcome is exposed to both.

1. **Vacuous passes.** A rule probe of the form "this action must be rejected" passes with status-class tolerance when the feature was never built (404, 405, 500 → error class) or was half-built. An arm that delivers less scores better on P-ESC.
2. **Post-treatment conditioning.** A carried trap counts only if the arm succeeded at the earlier introducing step. An arm that fails early is scored on fewer, and different, traps. The intention-to-treat version that fixes this is only a sensitivity analysis.

The direction of the net bias depends on which arm under-delivers. That is unknown before data, and so the outcome is not interpretable whatever the data say.

**FIX:**
1. Score every trap step in three categories: *correct* (feature probes pass **and** rule probes pass); *violated* (feature passes, rule fails); *not delivered* (feature probes fail).
2. Make the primary "share of trap steps not correct", which is the intention-to-treat version, with the three-way split descriptive.
3. Validate each trap probe against a "natural violation" variant and a "not implemented" stub of the reference (see F-20).

---

### F-05
**SEVERITY:** MAJOR
**SECTION:** 9 (CMP-0 headroom)

**QUOTE:** "above 85% (ceiling) harder traps are added, chosen using arm B only, never a contrast"

**PROBLEM:** "Using arm B only" is presented as neutral, but it is not.
- Items selected because B failed them in a noisy sample are, by regression to the mean and by item-arm interaction, items that are specifically hard **for B**. The tool arms' difficulty on the same items is not selected.
- This biases the selected item set toward the tools on both co-primaries.
- It is also unclear which fixture is meant. CMP-0 runs on a *sibling fixture*, so headroom measured there says nothing about CMP-1's items. If the harder traps are added to CMP-1, they were chosen blind; if they are added to the sibling fixture, the rule has no effect on CMP-1.

**FIX:**
1. Choose difficulty from a frozen item bank, by an arm-blind rule (difficulty rated by the skeptic before any run), or using all three arms pooled.
2. Never select an individual item on one arm's observed failures.
3. State which fixture is adjusted. If it is CMP-1's, the adjusting runs must be on CMP-1 items and excluded from CMP-1 data.

---

### F-06
**SEVERITY:** MAJOR
**SECTION:** 13 (class table and composites)

**QUOTE:** "lo > 0 and d < Delta (or hi < 0 and d > -Delta)" (SMALL); "UNINFORMATIVE: every contrast INCONCLUSIVE on both quality outcomes."; "MIXED: any other combination with at least one AHEAD or SUGGESTED"

**PROBLEM:** The class table is neither mutually exclusive nor exhaustive.
- **Overlap.** The interval [lo = 2, hi = 8] is both TIE and SMALL. No precedence order is given for classes, only for composites.
- **Undefined class.** VENDOR-DEPENDENT says "either interval excludes zero" without saying whether that means the per-vendor intervals or the pooled one.
- **Pooled interval excluding zero but signs differ.** A pooled interval that excludes zero, with vendor signs that disagree and neither vendor interval excluding zero, becomes INCONCLUSIVE, which is wrong.
- **Composite gap.** A pilot whose cells are only SMALL, TIE on one outcome, or VENDOR-DEPENDENT satisfies no composite: not UNINFORMATIVE (not all INCONCLUSIVE) and not MIXED (no AHEAD or SUGGESTED).
- **Evaluation order.** Composites are "evaluated in the order …" yet "all satisfied are reported". The order has no defined effect.

**FIX:**
1. Write the class assignment as an ordered if/elif chain in the hashed script, with precedence VENDOR-DEPENDENT > AHEAD > SMALL > TIE > SUGGESTED > INCONCLUSIVE, and state the per-vendor interval explicitly.
2. Add a residual composite (for example "NO LARGE DIFFERENCE SEEN").
3. Prove exhaustiveness by enumerating all class combinations in a test of the analysis script.
4. Delete the evaluation-order sentence, or say what it does.

---

### F-07
**SEVERITY:** MAJOR
**SECTION:** 2 (falsifiers H1–H3)

**QUOTE:** "G-K falsified if the interval of (K minus G violations) lies below +Delta with a point estimate at or below 0"; "falsified for a contrast if its 95% interval lies entirely outside [-Delta, +Delta]"; "prior falsified for an arm if the upper bound of its ratio to B is below 1.1"

**PROBLEM:** With the declared precision, all three registered falsifiers are practically unreachable, and that asymmetry protects the GS hypothesis.

- **H2.** With a half-width of about 23 points, "hi < +10" requires d < about −13. Under a true zero effect that happens about 13% of the time. **The GS side's own hypothesis survives a true null about 87% of the time.** The "point estimate at or below 0" clause is redundant.
- **H1.** Requires |d| > about 22 points.
- **H3.** With a half-width of about 1.34-fold, "upper bound < 1.1" requires a point ratio below about 0.82, meaning the tool must be measurably *cheaper* than bare. The prior "at least 1.25" therefore cannot be falsified by "no measurable overhead". It can be falsified only by a negative overhead.

Presenting these as "registered falsifiers" overstates the pilot's falsifiability.

**FIX:**
1. For each falsifier, state in section 2 its probability of firing under the null and under the prior, from the simulation.
2. Where that probability is below about 0.5 under the hypothesis it targets, relabel the row "not testable at k = 5".
3. Specifically, write "H2 cannot be falsified by this pilot unless G is substantially worse than K or B". That is honest and costs nothing.

---

### F-08
**SEVERITY:** MAJOR
**SECTION:** 12 (interval method)

**QUOTE:** "Welch-Satterthwaite on the vendor-stratified difference (as in the sketch) for P-ACC, P-ESC and the log-cost ratio"

**PROBLEM:** P-ESC per run takes 7 values (0/6 … 6/6), from 5 runs per cell.
- Cells where all 5 runs score 0 violations are plausible: in a working G arm, and per the positive control by design. They have zero sample variance.
- Welch then degenerates. With both arms at 0, the interval is [0, 0] and the class is mechanically **TIE**, from no information.
- With one arm at 0, Satterthwaite's degrees of freedom collapse onto the other arm.
- The P-ACC interval scale is unstated (points or logit). The sketch simulates on the logit scale and reports points.

**FIX:**
1. Register a method that handles boundary counts. Options: a binomial or beta-binomial GLMM with vendor fixed effects and a run random effect, using profile or Wilson-type intervals; or a cluster bootstrap with a stated minimum-variance floor.
2. State the scale of every interval.
3. Add an explicit rule: a cell with zero variance in both arms is INCONCLUSIVE, never TIE.

---

### F-09
**SEVERITY:** MAJOR
**SECTION:** 7 (P-ACC)

**QUOTE:** "Share of the sealed probes passed by the repository at the end of phase 2 (phase 1 and phase 2 behaviour together)."

**PROBLEM:** P-ACC is diluted and also double-counts trap behaviour.
- With "4 or more per use case" over about 20 use cases, roughly 80 probes, P-ACC is dominated by phase 1 behaviour. Section 4 says phase 1 "will probably saturate", and section 1 says phase 2 is "the only place where a difference is expected". A 30-point phase 2 effect therefore appears as a few points of P-ACC.
- Trap-rule probes are presumably inside the sealed set, so P-ACC and P-ESC share items. The two co-primaries are not separate evidence, yet the composites count them as two chances ("either quality outcome").

**FIX:**
1. Make the co-primary P-ACC-2: the share of **phase 2 step probes** passing at the end, weighted equally per step.
2. Report end-of-run phase 1 probes as a separate regression measure.
3. Exclude trap-rule probes from P-ACC, or state the overlap and treat "either outcome" composites as one test.

---

### F-10
**SEVERITY:** MAJOR
**SECTION:** 9 (negative control) and 13 (axis 0)

**QUOTE:** "If B minus B-b is as large as Delta on either co-primary with an interval excluding zero, noise exceeds the effect and the pilot is INVALID-DESIGN for that vendor" (section 9) vs. "the A/A control shows noise at or above Delta" (section 13)

**PROBLEM:** There are four distinct defects.
1. **Inconsistent wording.** Section 13 drops the "interval excluding zero" condition. Taken alone, a |d| ≥ 10 at 5 vs 3 runs is common.
2. **Wrong inference.** An A/A difference tests non-stationarity (time, order, harness drift), not "noise exceeding the effect". Run-to-run noise is already in each cell's SD.
3. **False-trigger rate.** Taken literally, with 4 tests (2 vendors × 2 outcomes), each about 5%, the pilot is voided by chance about 15–18% of the time. With 3 runs per vendor, the Welch degrees of freedom are tiny.
4. **Unstated pooling.** It is not stated whether B-b runs pool into B for the contrasts.

**FIX:**
1. Re-purpose the control as a drift check: B-b interleaved and compared to B with an equivalence or a pre-stated |d| threshold, reporting the family-wise false-trigger rate.
2. Make section 13 quote section 9 exactly.
3. State that B-b is not pooled into B.
4. Better: drop B-b and spend the 6 runs per F-24.

---

### F-11
**SEVERITY:** MAJOR
**SECTION:** 9 (CMP-0) and 17.8

**QUOTE:** "One cheaper vendor, a sibling fixture (same machinery, a different invented domain by the same independent author, smaller"; "(e) a rough run-level SD of the two co-primaries to replace the assumptions of the power sketch"

**PROBLEM:** CMP-0 cannot deliver the variances the design relies on.
- Two runs per arm give 1 degree of freedom per SD, on a different fixture, with a cheaper model, 3 traps instead of 6, and 5 change requests.
- The resulting SD's 95% interval spans more than an order of magnitude.
- Vendor and vendor × arm variance, which drive H5 and the false-positive rates in F-03, are not estimable from one vendor.
- Precondition 17.8 ("rerun with CMP-0 variances") will substitute noise for assumptions and may move the trap count either way arbitrarily.

**FIX:**
1. Either state that CMP-0 checks only feasibility and keep the simulation's assumptions as registered, adding a sensitivity grid over run SD 0.3–1.0 logit, or
2. Spend part of CMP-0 on about 6 B runs per builder vendor on the CMP-1 fixture's phase 1 only (excluded from data) to estimate run SD with usable degrees of freedom.

---

### F-12
**SEVERITY:** MAJOR
**SECTION:** 10 and `results.md`

**QUOTE:** "What k = 10 and 20 would buy (for the full study): P-ACC half-width 8 and 5.5 points, a 10-point gain called ahead 0.43 and 0.42 (the "ahead" rule also demands the point estimate reach the margin)"

**PROBLEM:** Four problems with the sketch and how it is read.
1. **The AHEAD rule caps power.** Requiring d ≥ Delta caps P(AHEAD | true = Delta) near 0.5 at any k. A true Delta-sized effect lands in SMALL, which has no label, about half the time, permanently. The rule reports a margin-crossing point estimate, not a margin-sized effect.
2. **Infeasible rows.** At comparator 0.85, true differences of 20 and 30 points imply 105% and 115%. The table's flat 0.85–0.89 "ahead" for 15/20/30 shows truncation. These rows should not be printed.
3. **Missing overdispersion.** P-TRAP is modelled as independent Bernoulli traps with logit run noise. The cascades (section 15, threat 5) and the exclusion rule (F-04) add overdispersion, so half-widths are optimistic.
4. **Mixed estimands.** "True diff" is marginal over random vendor × arm draws, but the intervals target the two-vendor conditional value. The full-study table therefore implies that more k buys generality. It does not; only more models do (F-03).

I have not seen `simulate.py` or `results.json`.

**FIX:**
1. Redefine AHEAD as "lo > 0 and both vendor signs agree", and report d against Delta descriptively. Alternatively, keep the rule and state "P(AHEAD | true = Delta) ≤ 0.5 at every k".
2. Delete the infeasible rows.
3. Add a cascade parameter: correlated trap failures, and a step-failure → later-exclusion process.
4. Add a full-study table varying the **number of models** (2, 4, 6) at fixed cost.

---

### F-13
**SEVERITY:** MAJOR
**SECTION:** 7 (cost, upkeep)

**QUOTE:** "upkeep = tokens spent in phase 2 on files that are not production code, by a frozen, hashed, neutral path classifier"

**PROBLEM:** Tokens are not spent "on files".
- A turn's input tokens are the whole context: system, history and all files read.
- Output tokens span reasoning plus several tool calls.
- Cache reads are shared across turns.

Without an attribution rule, this metric is whatever the script's author decides. It can be tuned for either arm, since K's and G's artefacts live in classified paths.

**FIX:** Register an attribution rule before freezing. For example:
- *output* tokens of tool calls whose write target is classified non-production;
- *input* tokens of read results of non-production files;
- report unattributed tokens as their own category.

Give a worked example on a CMP-0 transcript, and hash it.

---

### F-14
**SEVERITY:** MAJOR
**SECTION:** 7 (cost per accepted change; human time)

**QUOTE:** "An accepted phase 2 step is one whose own step probes all pass. Cost per accepted change = phase 2 dollars over accepted steps"; "Valued at one stated rate `[AT FREEZE]` and reported with and without."

**PROBLEM:** The cost accounting has five gaps.
1. **Undefined ratios.** Zero accepted steps gives an undefined ratio, and per-run ratios averaged over runs are unstable near zero.
2. **Unequal bar.** "All probes pass" is a harder bar for steps with more probes.
3. **Unstated composite input.** It is not stated which version (with or without human time) enters the cost composites.
4. **Experiment overhead charged to K.** K's 8–16 practitioner hours include reading for the attestation and experiment overhead, and are charged to K as "setup cost the tool asks of its user".
5. **Development cost uncounted for G.** G's formula development and fill-in script are mostly uncounted ("none by hand").

**FIX:**
1. Compute cost per accepted change as a ratio of sums per cell (total dollars over total accepted steps), with a delta-method or bootstrap interval; a cell with zero accepted steps is "not estimable".
2. Register that composites use model dollars only.
3. Count, for human time, only the hours a user of each tool would spend (constitution and policy text for K; any filling or answering for G), logged by task category.

---

### F-15
**SEVERITY:** MAJOR
**SECTION:** 3 (K pins) and 13 (axis 0)

**QUOTE:** "Spec-kit changes daily; a release change mid-window is INVALID-DESIGN for K." and "positive control failed for an arm"

**PROBLEM:** The INVALID-DESIGN triggers are asymmetric between arms.
- Spec-kit is pinned via `uv tool install` at a fixed release, so an *upstream* release during the window affects nothing. As written, though, it voids K. Given the release cadence, that is likely, and it gives the authors an option to void an unfavourable K result for reasons outside the experiment.
- G's tag is under the authors' own control, so G carries no comparable risk.
- Separately, section 9 says a failed positive control labels that arm's P-ESC rows "premise failed", while section 13 makes it a whole-pilot INVALID-DESIGN.

**FIX:**
1. INVALID-DESIGN for K only if the **installed** version or template hash in a run differs from the pin, checked per run.
2. Reconcile the positive-control consequence to one rule. I recommend section 9's per-arm label.

---

### F-16
**SEVERITY:** MAJOR
**SECTION:** 7 (review surface) and 2 (H4)

**QUOTE:** "computed by a neutral script as the tokens of the diff plus the tokens of every non-code document created or changed in the step (K: spec, plan, tasks, checklists; G: ledger, criteria, decisions; B: none)"; "falsified if the non-production share of the review surface in a tool arm is within 5 points of B's"

**PROBLEM:** The metric is neither neutral nor well-defined.
- It is defined by per-arm vocabulary lists, which section 7 elsewhere forbids.
- It hardcodes B as "none", although B "may write tests and notes".
- It does not say whether a *changed* document counts in full or as a diff. Counting in full penalises G's growing ledger on every step; counting new files in full penalises K's per-change spec, plan and tasks.
- H4's "non-production" lumps in tests, so a B that writes tests may fall within 5 points of a tool arm.
- H4 has a falsifier but no interval or uncertainty rule.

**FIX:**
1. Use the path classifier for all arms: the diff tokens of every changed file, split into production / tests / docs-and-specs / tool-config.
2. Count whole-document tokens only for files created in the step.
3. Give H4 a 95% interval on the share difference, with the same class logic as the cost ratio.

---

### F-17
**SEVERITY:** MAJOR
**SECTION:** 3 (K row), 2 (SPEC-KIT WINS) and 11

**QUOTE:** "constitution, specify, clarify, plan, checklist, tasks, analyze, implement, converge (repeat implement and converge until "Converged", capped)"; "or K is at least not behind on both quality outcomes and its cost ratio to G has an interval below 1"

**PROBLEM:** K's default makes K the most expensive arm by construction (section 11: K $55–150 vs G $28–75), so the cost clauses involving K are dead.
- SPEC-KIT WINS-by-cost and GS LOSES-by-cost-vs-K are unreachable under the authors' own prior.
- Per-session caps are shared, while K runs nine skills in one phase 1 conversation and five per change. K therefore meets caps more often, and the scored state is then whatever exists at the cap.
- The "maximal path" default is a choice the GS side made. The practitioner may deviate, but the default anchors the choice.
- I cannot verify that `converge` and "Converged" exist as documented spec-kit steps at v1.1.2.

**FIX:**
1. Let the practitioner choose the path with no GS-authored default.
2. Express caps per method step, not per session, or as a multiple of each arm's CMP-0 median.
3. Report cap hits per arm as a co-reported outcome next to P-ACC.
4. Delete composite clauses that are unreachable under the registered cost prior, or state their probability.

---

### F-18
**SEVERITY:** MAJOR
**SECTION:** 2 (H5)

**QUOTE:** "disagreement of signs on a contrast is itself a registered result (the pooled number then carries the label "vendor-dependent")"

**PROBLEM:** By the simulation, P(vendors disagree on sign) is 0.50 at true 0 and 0.36 at 10 points.
- Across 6 contrast-outcome cells, at least one disagreement is near-certain under every scenario.
- With two vendors, sign agreement is a coin flip that carries almost no information about vendor × arm interaction.
- The prior "mostly yes" cannot be falsified meaningfully.

**FIX:**
1. Replace H5 with an estimate of the vendor × arm variance and its interval, reported as non-estimable at 2 vendors if so.
2. Apply the "vendor-dependent" label only when the two per-vendor intervals exclude each other's point estimates.
3. Say plainly that the full study needs ≥ 4 models to say anything about vendor dependence.

---

### F-19
**SEVERITY:** MAJOR
**SECTION:** 10 (plan); three better designs for about the same money

**QUOTE:** "Plan: 2 vendors x 3 arms x 5 runs = 30 runs, plus 6 negative-control runs (B-b) = 36"

**PROBLEM:** The budget goes to the outcome the pilot measures worst. Repeating full cumulative runs spends most tokens on phase 1, which is expected to saturate, while only 6 trap observations per run are bought, on the outcome where the GS thesis lives (P-ESC half-width 23). Generality is capped by 2 models regardless of k.

**FIX:** Three alternatives for about $3k.

**(1) Checkpointed trap episodes.**
- 2 vendors × 3 arms × 2 builds.
- From each arm's own phase 1, branch about 20 independent trap episodes. Carried traps start from a checkpoint taken after the rule-introducing change request, verified by probes.
- Analyse with build as the cluster.
- This gives about 6× the trap observations per dollar, and separates cascade from trap behaviour.
- Keep one cumulative run per cell as a descriptive drift check.

**(2) Models over runs.**
- 5–6 models from ≥ 3 vendors × 3 arms × 2 runs.
- Estimate the across-model contrast with a model random effect.
- This makes vendor dependence estimable and puts the intervals on a population of models rather than on two.
- Drop B-b.

**(3) Mechanism ablation of the GS thesis.**
- Arms: G vs G with the executed checks disabled (hooks, ratchet, lock and gate off; same formula text) vs K+ (stock plus one community enforcement extension chosen by the practitioner). Keep B small (k = 2) as a floor.
- This tests section 1's stated hypothesis ("enforced, executed checks … reduce regressions"), which the current three-arm design cannot attribute.
- It also answers section 15 threat 6 instead of declaring it.

---

### F-20
**SEVERITY:** MINOR
**SECTION:** 4 (oracle validation)

**QUOTE:** "validated with a reference implementation (must pass 100%), stubs (must fail) and mutants (must kill at least `[90]`%)"

**PROBLEM:** Generic mutants do not show that each **trap** probe detects the *natural* violating implementation, which is the defining property of a trap. Nor do they show that the probe fails a "not implemented" variant (see F-04). With convention tolerance, a trap probe can pass both of these.

**FIX:** For each trap, add a reference variant implementing the natural violation, which must fail exactly that trap's rule probes, and a variant with the feature absent, which must fail its feature probes. Log both as hashed fixtures.

---

### F-21
**SEVERITY:** MINOR
**SECTION:** 9 (positive control)

**QUOTE:** "each arm must avoid it in at least `[90]`% of runs of its cell"

**PROBLEM:**
- With 5 runs per cell, 90% means 5 of 5. One stochastic miss fails the premise for an arm.
- The step's position in the cumulative sequence is unstated, so its code can contaminate later steps.
- The same applies to the discoverable-rule item.

**FIX:**
1. State the threshold as a count across both vendors (for example ≥ 9 of 10).
2. Run the positive-control step last, or on a branched checkpoint that does not feed forward.

---

### F-22
**SEVERITY:** MINOR
**SECTION:** 7 (P-ESC naming) and 2 (H2)

**QUOTE:** "P-ESC, escaped defects." and "share of failures that escaped the arm's own net (probe failing at the end while the arm's own test suite and its own gates were green at its last commit)"

**PROBLEM:**
- The primary named "escaped defects" is trap violation. The "escaped the net" quantity is a separate descriptive measure.
- H2 defines P-ESC as "traps violated, or carried probes regressed", which differs from section 7.
- "Gates green" is undefined for K (model-run analyze has no green state) and for B.

**FIX:**
1. Rename the primary "P-TRAP" (as `results.md` already does).
2. Make H2 quote section 7.
3. Define "own net green" as the arm's own test command exiting 0, with gates reported separately where executable.

---

### F-23
**SEVERITY:** MINOR
**SECTION:** 4 (canary)

**QUOTE:** "recall above zero on the invented project is INVALID-DESIGN for that model"

**PROBLEM:** Generic guesses ("port 8080", "returns 404 for missing") score as recall. Without a scoring rule and a chance baseline, the trigger is arbitrary.

**FIX:** Register the canary items as ones with a near-zero chance of being guessed (invented identifiers, odd values), a scoring rubric, and a threshold above a chance baseline measured on a decoy brief.

---

### F-24
**SEVERITY:** MINOR
**SECTION:** 14 (courtesy review)

**QUOTE:** "it triggers a linked CMP-1b run for the affected cell, or a stated limitation"

**PROBLEM:** The authors keep the choice between re-running and merely noting the issue after they have seen the results. That is an outcome-dependent option.

**FIX:** Pre-commit: a factual correction about the documented use always triggers CMP-1b for the affected cell, unless it is infeasible for a reason logged before the results are seen.

---

### F-25
**SEVERITY:** NIT
**SECTION:** 4 (trap classification)

**QUOTE:** "classified before freezing by two raters (the author and the skeptic) from the brief and a black-box run, as visible, implicit-in-code or carried; kappa reported"

**PROBLEM:** Kappa on 6 to 10 items with three categories is uninterpretable. Its interval spans nearly the full range.

**FIX:** Report the raw agreement table instead of kappa, or classify a larger pool of candidate traps so that kappa is estimable.

---

## What I could not assess

- **`simulate.py` and `results.json`.** I could not check whether "P(excludes 0, right sign)" at true 0 is one-sided, how the 0.85 rows were truncated, whether the Welch degrees of freedom use the four cell variances, or how P-TRAP draws traps. Several numbers in F-01, F-03 and F-07 are my approximations from the tables and should be re-derived by simulating the composites themselves.
- **Spec-kit v1.1.x behaviour.** I could not confirm that `converge` and "Converged" exist, what `docs/guides/existing-projects.md` actually recommends as the short path, or whether vendor CLIs can invoke the skills headless. These bear on F-17 and on whether the K default is the documented use.
- **GS formulas 1 and 5, and the FX-1 conformance checker.** Without them I cannot judge whether the STOP points and "next step" scripting give G more guided turns than K's operator policy, or whether G's executed gates inspect files that overlap the sealed probes' behaviour.
- **E2E-1, REM-1, FX-1, `ROLES.md` and `method-vs-enforcement-2026-10-07.md`.** The reused machinery (trap pipeline, metered harness, the planted-memory test SDX-0 V13) and the checklist mapping are referenced but not shown. Defects inherited from them are invisible to me.
- **The earlier critic round, `CMP-1-REVIEW.md`.** I cannot tell which of these findings were already raised and answered.
- **Vendor terms of service on publishing benchmarks.** These are not assessable without the texts. If restrictive, they could force selective publication that conflicts with "all runs published".
