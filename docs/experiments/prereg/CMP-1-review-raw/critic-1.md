# CMP-1 adversarial review

**CRITIC:** Claude Opus 5.5 (`claude-opus-5-5`, Anthropic). This critic is from the same vendor family as the protocol's author, so it does not count toward the "two not Anthropic" requirement of section 18.

**PRIOR_EXPOSURE:** None recognized. I have no memory of Generative Specification, PragmaWorks, CMP-1, FX-1, E2E-1, REM-1 or earlier reviews of them. I know GitHub spec-kit only from general training data up to mid-2026.

**CONFIDENCE:** High on the internal-consistency, decision-table and public-statement findings, which rest only on the text supplied. Medium on findings that depend on how spec-kit and the vendor CLIs behave (F-01, F-08, F-18), because I cannot check the pinned release, the existing-projects guide or the CLIs. Each of those findings says what to verify.

Quoting note: quotes are verbatim, with Markdown bold markers (`**`) removed.

I checked these and found them sound as designed: the sealed-oracle validation chain (reference, stubs, mutants), the third-vendor blind-judge rule, and the "barred own-vocabulary indicators" list in section 7.

---

### F-01
- **SEVERITY:** BLOCKER
- **SECTION:** 5 (rule 3); 3 (K setup package); 2 (H2 prior)
- **QUOTE:** "Default: ratifications are scripted approvals ("Approved. Continue."), logged." together with "the operator policy for the points where spec-kit expects a human (clarify questions, the reviewer-owned checklist, the "unchecked items, proceed?" prompt of implement, what to do with analyze findings)" and, in H2, "K is close to B because its checks are model-run"
- **PROBLEM:** The departure is called symmetric ("the pilot measures the tools' machine side only"), but it removes different amounts from each arm.
  - In spec-kit, analyze and the checklist report findings. They pay off only when someone acts on them before implement.
  - Scripted approval turns those steps into token cost that buys nothing.
  - GS's claimed mechanism ("hooks, ratchet, lock, co-change gate") runs without a human, so approving its STOPs by script takes almost nothing away from it.
  - The design therefore builds in H2's prior: K's checks are made inert, and then K is predicted to be close to B.
  - The proposed mitigation, a practitioner-written policy, does not fix this. The protocol sets the approve-only default, and the practitioner is never told that a remediation policy is allowed.
- **FIX:**
  - Delete the approve-only default for K.
  - Require the practitioner to write a deterministic remediation policy before CMP-0. For example: on analyze findings rated CRITICAL or HIGH, reply "Remediate these findings in spec/plan/tasks, then rerun analyze", once, capped. On unchecked checklist items, reply "Resolve or record each unchecked item, then continue".
  - Apply the same "act on what the check reports" rule to G's STOPs where they surface a failure.
  - In CMP-0, run both K policies (approve-only and remediate) and register the one the practitioner attests as competent.

### F-02
- **SEVERITY:** BLOCKER
- **SECTION:** 2 (pre-stated outcomes); 13 (composites)
- **QUOTE:** "G costs more than B while G-B is not "G AHEAD" on either (the substrate bought nothing measured here)"; "BARE WINS: B is not behind either tool on either quality outcome (no "AHEAD" or "SUGGESTED" for a tool against B) and B is CHEAPER than both."; "G costs more than K (ratio interval above 1) while G-K is not "G AHEAD" on either quality outcome"; "K is at least not behind on both quality outcomes and its cost ratio to G has an interval below 1"
- **PROBLEM:** Three faults combine here.
  1. **"Not AHEAD" is the expected state at this sample size, not evidence.** Section 10 gives P(AHEAD) of 0.34 for a true 20-point P-ESC gain. GS LOSES condition 4 therefore reduces to "G is COSTLIER than B", which the authors' own H3 prior predicts. The same holds for BARE WINS, which reduces to "B is CHEAPER". Under the authors' priors, both outcomes are close to certain before any run, and they say nothing about quality.
  2. **Two rows are close to unreachable by the authors' own estimates.** Section 11 puts K at $55–150 and G at $28–75 per run. So GS LOSES condition 3 (G costlier than K) and SPEC-KIT WINS clause 2 (K cheaper than G) will almost never fire.
  3. **The composites are asymmetric.**
     - There is no "SPEC-KIT LOSES" mirror of condition 4 (K costlier than B with no K AHEAD), so K escapes a label that GS receives.
     - The evidential thresholds differ. GS LOSES on quality needs K AHEAD, but BARE WINS is blocked by a mere SUGGESTED for a tool.
     - The asymmetry cuts against GS on labels and against nothing on evidence. Either way, the composites are not measuring quality.
- **FIX:**
  - Rebuild the composites from symmetric per-arm templates, applied identically to K and G: "T BEHIND Y" (Y AHEAD) and "T COSTLIER WITHOUT DETECTED GAIN".
  - Every "without gain" label must print the pilot's power for a 20-point gain next to it.
  - Use a single evidential threshold everywhere: AHEAD only, or AHEAD-or-SUGGESTED, not a mix.
  - Before freezing, compute from `simulate.py` the probability of each composite under (a) the global null and (b) the authors' stated priors, and publish both numbers in section 13.

### F-03
- **SEVERITY:** BLOCKER
- **SECTION:** 14 (public-statement table)
- **QUOTE:** Row "GS AHEAD or SUGGESTED on a quality outcome": "In a pilot of 5 runs per arm and vendor on one invented task with two models, GS scored [d, interval] points higher than [arm] on [measure] (hidden tests / traps violated); the cost was [ratio]." Row BARE WINS: "For this small task a bare model with the same brief did as well as either tool at [x] of the cost; specification overhead bought no measured gain here."
- **PROBLEM:**
  - **GS's suggestive results get headline wording that nobody else's do.** Section 13 says a SUGGESTED result may only be described as "A difference favouring X of about d points was seen but the interval includes zero; the pilot cannot tell." Yet a GS SUGGESTED result gets the same "scored higher" sentence as AHEAD. No row lets a K-over-G or B-over-G SUGGESTED result be published as "scored higher": GS LOSES requires AHEAD, so those results fall into MIXED.
  - **The BARE WINS row asserts equivalence.** "did as well as" is the claim the TIE row forbids ("Never 'equivalent'"), and per F-02 BARE WINS fires on non-detection.
- **FIX:**
  - Replace the GS-specific row with generic "X AHEAD" and "X SUGGESTED" rows that apply to every arm and contrast.
  - The SUGGESTED rows reuse the section 13 sentence verbatim.
  - Reword BARE WINS: "A quality advantage of either tool over the bare model was not detected (pilot power for a 20-point difference: [p]); the bare model cost [x] of [tool]."

### F-04
- **SEVERITY:** BLOCKER
- **SECTION:** 2 (H2, H3 falsifiers)
- **QUOTE:** "G-K falsified if the interval of (K minus G violations) lies below +Delta with a point estimate at or below 0" and "prior falsified for an arm if the upper bound of its ratio to B is below 1.1 ("no measurable overhead")"
- **PROBLEM:** Both falsifiers are written as if they were reachable. In practice neither is.
  - **H2.** The P-ESC half-width is about 23 points (section 10). An upper bound below +10 needs a point estimate of about −13, meaning G must be measurably *worse* than K. If the true G advantage is exactly zero, this happens in roughly one pilot in eight. If G helps a little, it almost never happens. The GS side's own hypothesis is therefore effectively unfalsifiable here, while the text says it is "Reported as 'the GS side's expected advantage did not appear'".
  - **H3.** With a half-width of 1.34-fold, an upper bound below 1.1 needs a point ratio of about 0.82: a tool that costs about 18% less than bare despite paying for setup.
- **FIX:**
  - State in H2 and H3, as numbers taken from the simulation, P(falsifier fires | true effect 0) and P(falsifier fires | prior true).
  - Replace the H2 falsifier with one that is reachable at k = 5 and labelled as weak. For example: "expected advantage not seen" if the pooled point estimate is below Delta/2 and both per-vendor estimates are below Delta.
  - Or declare H2 and H3 estimation-only, with no falsification claim.

### F-05
- **SEVERITY:** MAJOR
- **SECTION:** 3 (K row, phase 2; setup package)
- **QUOTE:** "the documented shorter path for a bounded change in an existing project (per `docs/guides/existing-projects.md` and the Quick Start): specify with the change text and the compatibility boundaries, plan, tasks, implement, converge" and "the practitioner may choose differently, with a written reason tied to the documentation"
- **PROBLEM:**
  - **K loses its consistency checks exactly where the traps are.** All six traps sit in phase 2. The default phase-2 path drops analyze and checklist, K's only cross-artifact consistency passes, while G runs formula 5 in full.
  - **The default is anchored by the GS side.** It is written by the GS side, and the practitioner must justify any departure from it in writing.
  - **"the compatibility boundaries" has no author.** If anyone who has seen the change list writes them, trap rules can leak into K. If the practitioner writes them per change, K receives content that B and G never get (checklist item 2).
  - I cannot check the existing-projects guide to see whether it omits analyze.
- **FIX:**
  - Remove the GS-authored defaults. The practitioner picks both paths from the documentation, blind to section 2's priors.
  - Define "compatibility boundaries" as either generated by K itself inside specify, or a fixed template written by the practitioner before CMP-0 that contains no per-change content.
  - Record the guide's text at the pinned commit in the frozen package.

### F-06
- **SEVERITY:** MAJOR
- **SECTION:** 3 (common to all arms); 9 (CMP-0 item b)
- **QUOTE:** "the same per-session and per-run caps `[FROM CMP-0]`"; "(repeat implement and converge until "Converged", capped)"; "above 15% in any arm raises the cap by a rule `[AT FREEZE]`"
- **PROBLEM:**
  - An identical per-session cap penalizes the arm that the design itself makes put nine steps into one conversation (K). An identical per-run cap penalizes the arm the authors expect to be costliest (K, at 2–4 times B).
  - A cap hit scores the working tree as is, so every cap is a hidden quality penalty.
  - The converge iteration cap has no number.
  - The cap-raising rule is unwritten, and its 15% trigger means a 14% cap-hit rate in K is an accepted handicap.
- **FIX:**
  - Set caps per arm as a registered multiple of that arm's CMP-0 median use (for example, 3 times per session and per run), or as a common cap that no arm reached in CMP-0.
  - Write the converge iteration cap and the raising rule into the draft now.
  - Report cap-hit steps per arm beside both co-primaries, with a sensitivity that excludes them.

### F-07
- **SEVERITY:** MAJOR
- **SECTION:** 3 (G); 17.5
- **QUOTE:** "CMP-1 therefore waits for FX-1's diagnostic stage on formulas 1 and 5 (precondition 17.5)"; "Any change to a formula text is a new formula version made through FX-1's revision budget, never inside CMP-1"; "the branch `formulas-2026-10-05`, commit `76092e0` on 2026-10-08, to be tagged"
- **PROBLEM:**
  - **G is tuned by its own authors on the same models that will run the pilot.** Before the freeze, the GS authors may revise the formulas through FX-1, on the same two builder vendors (17.5: "with the two builder vendors"). K gets a stock release, 8–16 practitioner hours and two CMP-0 runs on a different, cheaper vendor.
  - "No hand-tuning beyond the formula" is true only because the tuning goes into the formula.
  - **FX-1 effort is uncounted.** FX-1 hours are missing from "Equal preparation effort, logged".
  - **The pin is inconsistent.** The pinned commit `76092e0` cannot be both "frozen" and subject to FX-1 revision.
- **FIX:**
  - Choose one of these, before CMP-0:
    - (a) freeze the formula tag before the builder vendors are chosen; or
    - (b) require FX-1 to use fixtures from a domain disjoint from CMP-1's, and count FX-1 revision hours as G's preparation.
  - Give the K practitioner an equal, logged opportunity: CMP-0-style runs on both builder vendors with package revision allowed.
  - State that the pinned G commit is FX-1's output, not `76092e0`.

### F-08
- **SEVERITY:** MAJOR
- **SECTION:** 3 (last bullet); 6 (harness); 9 (CMP-0)
- **QUOTE:** "The same check applies to the formulas (they are plain prompts, no issue)."
- **PROBLEM:**
  - **The prompts are plain, but G's tested mechanism is not.** It is executed enforcement (hooks, ratchet, lock), and that works only if each vendor's CLI honours what the formula installs. Agent hooks differ by CLI. Whether the non-Claude CLI has an equivalent, and whether a "Fresh configuration directory per run" in headless mode loads project-level hooks, is unchecked. If they do not fire, G on vendor 2 is a prompt-only method, and "home cell" disagreement becomes a mechanism difference rather than tuning.
  - **K has a matching risk.** spec-kit's command or skill registration can depend on the CLI's configuration location, and that location is reset each run.
  - **CMP-0 cannot catch either risk.** It uses "One cheaper vendor", so it never exercises the second builder CLI.
- **FIX:**
  - Run CMP-0's feasibility items on both builder CLIs.
  - For G, add a planted-violation test per CLI: each enforcement element must block a seeded violation, or that vendor's G cell is labelled "enforcement absent".
  - For K, verify that each command resolves on each CLI under the fresh-config regime.

### F-09
- **SEVERITY:** MAJOR
- **SECTION:** 5 (policy review); 9 (CMP-0 item f); 11 (harness authorship)
- **QUOTE:** "K's policy by the independent practitioner, reviewed by the assistant for determinism" and "(f) a fidelity attestation: the independent spec-kit practitioner reads the K transcripts and signs that they are a competent use of the tool, and lists anything the harness prevented."
- **PROBLEM:**
  - **The attestation covers the wrong runs.** It covers only CMP-0: two K runs, on one cheaper vendor, on a sibling fixture. K's main runs on the two builder models and CLIs are never attested.
  - **The harness is GS-side code.** The harness that decides when a turn has ended, expands templates in the headless fallback, resolves placeholders and detects "Converged" is built with GS-side agent hours. No independent party reviews it.
  - **The GS side can edit K's policy.** A GS-side assistant has editing authority over it under the label "determinism".
- **FIX:**
  - The practitioner reviews the K driver code and the template-expansion fallback before freeze.
  - The practitioner attests a random sample of at least two main-run K transcripts per vendor before any probe result is unsealed, without seeing results.
  - The assistant's determinism review may only flag problems; the practitioner decides the wording.
  - Mirror this for G: the K practitioner checks that the G driver sends the formula steps faithfully.

### F-10
- **SEVERITY:** MAJOR
- **SECTION:** 9 (CMP-0, headroom)
- **QUOTE:** "above 85% (ceiling) harder traps are added, chosen using arm B only, never a contrast"
- **PROBLEM:**
  - **The selection is biased against B.** Choosing new items because B failed them selects on B's specific weaknesses. The comparison then runs on a set enriched for items B finds hard, which favours both tools by construction. Using "B only" avoids peeking at a contrast, but it does not avoid this bias.
  - **The target fixture is unstated.** It is unclear whether items are added to the sibling fixture or the main one. If the main one, the authors peek at main items. If the sibling, it is unclear how difficulty transfers.
- **FIX:**
  - Before CMP-0, the skeptic writes a reserve pool of extra traps.
  - If the ceiling rule fires, draw from the reserve at random, or by a difficulty rule computed on all arms pooled. Never use one arm's failures.
  - Name the fixture that receives the items.

### F-11
- **SEVERITY:** MAJOR
- **SECTION:** 7 (P-ESC)
- **QUOTE:** "a trap counts only if the carried behaviour passed at its own earlier step; excluded traps are reported per arm, with an intention-to-treat sensitivity that counts them as failures" and "(probe failing at the end while the arm's own test suite and its own gates were green at its last commit)"
- **PROBLEM:**
  - **The exclusion helps the weaker arm.** The denominator depends on the outcome. An arm that fails to implement the change introducing a rule has that carried trap dropped, which lowers its violation share. This systematically favours the arm that is worse at implementing changes.
  - **Each exclusion moves the score a lot.** With three carried traps per run, one exclusion moves a run's P-ESC by up to about 17 points. The simulation assumes a fixed denominator of six.
  - **"its own gates" is GS vocabulary** and is undefined for B.
- **FIX:**
  - Make intention-to-treat primary: failing to establish a rule counts as failing to carry it.
  - Report the conditional version as a secondary measure, with its per-arm denominator.
  - Rerun the simulation with variable denominators.
  - Define the "own net" for every arm as the arm's own test command at its last commit, plus any blocking hook if present.

### F-12
- **SEVERITY:** MAJOR
- **SECTION:** 4 (phase 2 table; phase 1)
- **QUOTE:** "the natural implementation breaks a rule that an earlier change request in phase 2 introduced; a fresh session must carry it through the repository (this is where persistence can matter)" and "Phase 1 is a ceiling and floor check, and a cost measurement; it carries no verdict outcome alone"
- **PROBLEM:**
  - **The GS side fixed the design choices that decide where effects can appear.** It set:
    - the trap mix, with half the traps in the only place the GS thesis predicts an effect;
    - the unit of a fresh session per change;
    - the demotion of phase 1, where spec-kit's main claim (better specification leads to a more correct build) would show.
  - **The skeptic picks only which traps fill the slots.** They do not choose the mix or the conversation unit.
  - **The task asks GS's question, yet section 13 hands out tool-wide labels** such as SPEC-KIT WINS.
- **FIX:**
  - Let the skeptic and the practitioner jointly set the trap mix and decide whether phase 1 acceptance is co-primary.
  - Report visible traps (T-V) and carried traps (T-C) as separate primary estimands, not one pooled P-ESC.
  - Add a spec-kit-side registered hypothesis, written by the practitioner.

### F-13
- **SEVERITY:** MAJOR
- **SECTION:** 9 (positive control); 13 (Axis 0)
- **QUOTE:** "each arm must avoid it in at least `[90]`% of runs of its cell, or the trap measure does not work for that arm and its P-ESC rows carry the label "premise failed"" versus Axis 0 "positive control failed for an arm"
- **PROBLEM:**
  - **The threshold is all-or-nothing.** 90% of 5 runs means 5 out of 5, so a single miss in any of six cells triggers the control.
  - **The two sections contradict each other.** Section 9 labels one arm; Axis 0 invalidates the whole pilot.
  - **It works as an escape hatch.** The arm that misses a stated rule is the arm most likely to violate traps, and its P-ESC loss then becomes unreportable. This could protect G as easily as anyone.
  - **Placement is undefined.** Where the extra step sits in the cumulative sequence is unstated, and it changes the repository that later steps inherit.
- **FIX:**
  - Pool the control per arm across vendors with a threshold of at least 8 out of 10.
  - Always report P-ESC, with the label attached, never suppressed.
  - Pick one consequence and remove the contradiction.
  - Run the control step on a throwaway copy of the repository at a fixed point, so it does not change the cumulative state.

### F-14
- **SEVERITY:** MAJOR
- **SECTION:** 7 (review surface); 2 (H4)
- **QUOTE:** "computed by a neutral script as the tokens of the diff plus the tokens of every non-code document created or changed in the step (K: spec, plan, tasks, checklists; G: ledger, criteria, decisions; B: none)"
- **PROBLEM:** The metric is called neutral but is not.
  - It uses per-arm document lists written in each arm's vocabulary.
  - "B: none" contradicts "may write tests and notes".
  - It counts whole documents for non-code files that changed but only diffs for code. An append-only ledger or a re-emitted spec is charged in full at every step, a cost that grows over the run and hits G and K differently.
  - H4 holds by construction, since both tools exist to produce these documents.
- **FIX:**
  - Use one rule for all arms, driven by the path classifier: diff tokens for every changed file, and full tokens for new files, split by class.
  - Drop the arm lists.
  - Mark H4 as descriptive and confirmatory by design.

### F-15
- **SEVERITY:** MAJOR
- **SECTION:** 7 (cost, upkeep)
- **QUOTE:** "upkeep = tokens spent in phase 2 on files that are not production code, by a frozen, hashed, neutral path classifier"
- **PROBLEM:**
  - **The metric cannot be measured as defined.** Metered tokens belong to requests, not files, and no rule assigns a request's tokens to paths. Whatever rule the GS-side harness builder picks is an unregistered analytic choice.
  - **Tests are classed as non-production,** so a B arm that writes tests looks like it spends on "upkeep".
- **FIX:**
  - Register the attribution algorithm. For example: output tokens of edit and write tool calls go to their target path; input tokens of read results go to the path read; everything else is "unattributed" and reported.
  - Validate it in CMP-0.
  - Split tests out from docs/specs and tool directories.

### F-16
- **SEVERITY:** MAJOR
- **SECTION:** 3 (equal preparation); 7 (human time)
- **QUOTE:** "Hours spent preparing each arm's package (K's practitioner, G's fill-in script and operator replies, B's none) are logged and reported beside the results, as the setup cost the tool asks of its user." and "Valued at one stated rate `[AT FREEZE]` and reported with and without."
- **PROBLEM:**
  - **K is charged for the experiment's fairness overhead.** K's 8–16 practitioner hours exist because the design requires an independent attestor, not because spec-kit demands them.
  - **G's real preparation is left out.** G's "fill-in script" is cheap because formula engineering and FX-1 are excluded (F-07).
  - Calling these hours "the setup cost the tool asks of its user" biases cost against K.
  - **The decision table's input is unclear.** It is not stated whether CHEAPER and COSTLIER use the with-human-time total.
- **FIX:**
  - Cost classes in section 13 use model dollars only.
  - Report human time descriptively, as an estimate of a typical user's time per tool (constitution writing for K, bracket filling for G).
  - Exclude attestation and review hours.
  - If G's preparation is counted, count FX-1 too.

### F-17
- **SEVERITY:** MAJOR
- **SECTION:** 5 (rule 1)
- **QUOTE:** "the operator answers from the answer sheet, a document written by the brief's author listing the intended answer to each ambiguity of the brief" and "("Use your best judgment from the brief, record the assumption in the project documents, and do not ask again.")"
- **PROBLEM:**
  - **The answer sheet is an information channel toward the oracle.** The same person writes the probes and the answer sheet, so every answered question passes probe-relevant intent that is absent from the brief.
  - **The channel helps whichever arm asks most.** spec-kit's clarify asks systematically. A headless B rarely asks. G's behaviour depends on the formula.
  - "The same brief" is therefore not the same input across arms. This is a real tool feature, but it is unmeasured.
  - **The fallback reply is not neutral.** "record the assumption in the project documents" pushes every arm, including B, toward writing documents, which feeds the review-surface and emergent-substrate counts.
- **FIX:**
  - Before freeze, map each answer-sheet entry to the probes it touches.
  - Report, per arm, the probes covered by answers that arm received.
  - Add a sensitivity on probes that no arm received an answer for.
  - Shorten the fallback to "Use your best judgment from the brief."

### F-18
- **SEVERITY:** MAJOR
- **SECTION:** 4 (phase 2)
- **QUOTE:** "applied cumulatively to the repository of the run (so carry-over and drift can occur, as in E2E-1), one attempt each, no retry, the scored state being the working tree when the conversation ends on its own or hits the cap"
- **PROBLEM:**
  - **spec-kit's branching meets a design with no merge step.** In the versions I know, specify creates a numbered feature branch per feature and assumes a human merges it. The design never merges.
  - **The risk falls on K alone.** Depending on where each new specify branches from and where HEAD is left, K's later changes may build on a stale tree, or the oracle may score a tree missing earlier features. That is a cascade handicap only K faces.
  - **G's branch behaviour is unstated.**
- **FIX:**
  - Register an arm-neutral operator action after each step, approved by the practitioner: merge to main, or stay on the current branch.
  - Verify it in CMP-0.
  - Run the oracle on a defined ref, not "the working tree".

### F-19
- **SEVERITY:** MAJOR
- **SECTION:** 10 and `results.md` (power sketch); 12
- **QUOTE:** P-ACC row "| 5 | 0 | 0.08 | 0.03 | 0.09 | 0.088 | 0.02 | 11.9 | 0.50 |" and ceiling rows "| 5 | 20 | 0.85 | 0.00 | 1.00 | 0.000 | 0.02 | 5.9 | 0.00 |" / "| 5 | 30 | 0.86 | 0.00 | 1.00 | 0.000 | 0.02 | 5.9 | 0.00 |"
- **PROBLEM:**
  - **False AHEAD calls are frequent and never added up.** Under a true difference of zero, AHEAD is called about 8% of the time in each direction, roughly three times the nominal one-sided rate, because of vendor-by-arm interaction with two fixed vendors. The AHEAD rule requires both vendors to agree in sign, so VENDOR-DEPENDENT does not catch these. Across 3 contrasts, 2 outcomes and both directions, the chance that some AHEAD appears under the global null is substantial, and nowhere computed. GS LOSES, with four any-of conditions, inherits the largest false-trigger rate.
  - **Some simulated scenarios are impossible.** Comparator 0.85 plus 20 or 30 points means 105% or 115%. The identical rows show clamping, so the ceiling claims ("a 10-point gain is called ahead 0.53") come from a partly invalid grid.
- **FIX:**
  - Add to `results.md`, per composite and per class, the probability under the global null and under the authors' prior scenario.
  - Remove the infeasible rows; cap the true difference at 100 minus the comparator.
  - Model P-ESC with the variable denominator (F-11).
  - I have not seen `simulate.py`; it should be checked for clamping logic.

### F-20
- **SEVERITY:** MAJOR
- **SECTION:** 1 (purpose); 13 (UNINFORMATIVE)
- **QUOTE:** "It exists to (1) find out whether a larger fair comparison is worth its cost" and "the next step is whether to enlarge (trap count, k), not a statement about the tools."
- **PROBLEM:** No registered rule maps pilot results to go or no-go. The pilot's first purpose is therefore decided after unblinding, by the GS side, while it can see the contrasts. Checklist item 18 ("Post-hoc iteration: M") does not hold for this decision.
- **FIX:** Register a rule based on variances and budget only. For example: proceed if the CMP-0 and CMP-1 variances imply k ≤ N per cell for a P-ESC half-width ≤ 12 within $X; otherwise do not proceed. Publish the go or no-go decision with the results, whatever the point estimates are.

### F-21
- **SEVERITY:** MINOR
- **SECTION:** 13 (class table); 2 vs 13 (BARE WINS)
- **QUOTE:** "-Delta < lo and hi < Delta" (TIE) and "lo > 0 and d < Delta (or hi < 0 and d > -Delta)" (SMALL); section 2 "B is not behind either tool on both quality outcomes and costs less than both" versus section 13 "B is not behind either tool on either quality outcome"
- **PROBLEM:**
  - TIE and SMALL overlap (for example lo = 2, hi = 8), so assignment is not "mechanical".
  - BARE WINS is worded differently in the two sections. "both" and "either" mean the same thing only by accident of phrasing, and readers will diverge.
- **FIX:** Add a precedence order (for example, SMALL before TIE) and use one canonical wording, referenced from section 2 rather than restated.

### F-22
- **SEVERITY:** MINOR
- **SECTION:** 9 (A/A, headroom); 13 (Axis 0)
- **QUOTE:** "If B minus B-b is as large as Delta on either co-primary with an interval excluding zero, noise exceeds the effect and the pilot is INVALID-DESIGN for that vendor" versus Axis 0 "the A/A control shows noise at or above Delta"; "must lie between 30% and 85%" versus "bare arm at a floor (below 20%) or ceiling (above 90%)"
- **PROBLEM:**
  - With 3 B-b runs per vendor, the P-ESC interval is wider than ±25, so the A/A trigger almost never fires.
  - The Axis 0 wording is a different, looser rule.
  - The bands 20–30% and 85–90% fall under no rule.
- **FIX:**
  - Restate the A/A control as a comparison of between-run SDs (B against B-b), with a registered ratio threshold.
  - Use one wording in both sections.
  - Close the threshold gaps.

### F-23
- **SEVERITY:** MINOR
- **SECTION:** 14 (row GS LOSES; etiquette 3)
- **QUOTE:** "It is published in the same place and the same week as a GS-favourable result would be" and "it triggers a linked CMP-1b run for the affected cell, or a stated limitation"
- **PROBLEM:**
  - "would be" is a counterfactual that cannot be checked.
  - The choice between rerunning and merely noting a limitation, after maintainers show the setup was not documented use, is left to the GS side.
- **FIX:**
  - Record a fixed venue and a deadline (for example, 30 days after the last run) in the external registry before data, whatever the outcome.
  - Register that a documented-use correction triggers CMP-1b unless its estimated cost exceeds a stated amount.

### F-24
- **SEVERITY:** MINOR
- **SECTION:** 3 (common preamble)
- **QUOTE:** "work in this repository, keep existing behaviour working, run the project's tests, commit when done"
- **PROBLEM:** The preamble is prepended to K's first skill message (constitution) and to G's first formula step. It tells the agent to run tests and commit at points where each method has its own sequencing. That can cause premature commits, or skipped steps that the fidelity check will count as method failures.
- **FIX:** In CMP-0, compare the first skill or step with and without the preamble. If it changes behaviour, prepend it only to the brief or change-text message, not to method-control messages.

### F-25
- **SEVERITY:** NIT
- **SECTION:** 2, 13, 14 (composite names; etiquette)
- **QUOTE:** "SPEC-KIT WINS if" / "GS LOSES" alongside "we never write "X is better than Y" from this pilot, in either direction, whatever the numbers"
- **PROBLEM:** The registered outcome names are contest labels that name a third party's product. The frozen preregistration is public, and these labels will be quoted as verdicts, which works against etiquette item 6 and the "never better than" rule.
- **FIX:** Use neutral codes (for example, C1 "G behind or costlier without detected gain") and keep product names in the descriptive text only.

---

## What I could not assess

- **spec-kit details at the pinned release:**
  - whether `converge` exists and what "Converged" means;
  - whether `specify init` accepts `--integration` and `--non-interactive`;
  - whether `docs/guides/existing-projects.md` prescribes the "shorter path" as quoted or includes analyze;
  - how specify handles branches.

  F-01, F-05, F-08 and F-18 depend on these.
- **Formulas 1 and 5:** whether they install CLI-specific hooks, ask questions, branch, or rely on human STOPs carrying substantive decisions. F-08 and F-17 depend on this.
- **FX-1** (its revision budget, fixtures and vendors) and **E2E-1** (rule 1, trap pipeline, arm X). F-07 depends on FX-1.
- **`simulate.py`:** whether infeasible scenarios are clamped, and how vendor interaction enters the AHEAD rule. F-19 depends on this.
- **`ROLES.md`, `method-vs-enforcement-2026-10-07.md` section 6, `CMP-1-REVIEW.md`:** I could not check whether the checklist mapping in section 16 matches the source, or whether earlier critics already raised these points.
- **Vendor terms** for publishing benchmark comparisons, and whether the second vendor's CLI exposes per-request token categories.
