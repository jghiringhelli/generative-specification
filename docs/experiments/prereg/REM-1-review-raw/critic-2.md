# REM-1 adversarial review (critic 2: construct validity and fairness)

### F1. BLOCKER. Sections 2, 4 and 8: the bug-fix steelman contradicts the rule that remediation must not change behaviour
- **Quoted:** §2, arm C: "fixes of bugs found while testing"; §8: "Remediation that changes observable behaviour (sealed suite red after remediation) is a failed remediation, reported and, for B and C, rerun once"; §4: "Bugs: at least two thirds found by an independent tester or by differential execution".
- **Problem:** The characterization suite is captured from the original code, so it records the original bugs. If C fixes a bug, which its brief tells it to do, the suite turns red and the run counts as a failed remediation. B fixing "findings" under formula 5 has the same problem. The study therefore penalizes the field case's own steelman. There is a second effect. If a remediation happens to fix one of the 20 bug items, that item becomes nearly free in B or C. This favours remediation, at a rate set by how much the tester's bug pool overlaps with what the remediation finds. Nobody controls that overlap.
- **Fix:** Add to §8: "Behaviours that are targets of the 20 bug items are excluded from the sealed characterization suite. A remediation may change other behaviours only through a bug log, not code. Any bug item found already fixed after remediation is scored 'pre-solved', its cost is 0, and results are reported with and without pre-solved items. If one arm pre-solves more than 3 items, that is reported as a finding." Apply the same rule to B and C.

### F2. BLOCKER. Sections 1, 2 and 6: matching C's budget to B makes the cheaper-rival question untestable and breaks the formula
- **Quoted:** §2(b): "C is budget-matched to B's realized spend per cell and replicate: B runs first, C gets exactly that token budget, in four categories (section 6). A C that stops early records the unspent budget."; §6: "with R_C = R_B by matching, the curve difference is `k (m_C - m_B)`"; §1, prior (4): "a cheap fix (tests and a README, no substrate) gets most of the saving at lower cost".
- **Problem:**
  1. Prior (4) is about *lower cost*, but R_C is fixed to R_B, so the design cannot test it. The one-third variant that could test it is "optional and descriptive".
  2. If C stops early, R_C < R_B, and the curve identity in §6 is false.
  3. C's budget is set by how long B took to satisfy the GS checker. A bloated B therefore forces C to overspend, which inflates k\*_C.
  4. Nobody can enforce a budget split over four token categories. An agent cannot choose its cache-read share.
- **Fix:**
  - Make the primary C arm "C-natural": the practitioner's prompt runs to its own declared completion, capped at B's dollar spend at pinned prices. Its R_C is measured, not imposed.
  - Keep "C-matched" (forced to spend B's dollar budget) as the secondary arm.
  - Replace the §6 sentence with: "k\*_C = R_C / (m_A − m_C) with the measured R_C; the B-vs-C curve difference is (R_C − R_B) + k (m_C − m_B)."
  - Match budgets in dollars, not in four token categories.

### F3. MAJOR. Sections 2, 12.11 and 14.5: the GS checker decides B's stopping point, and the declared mitigation does not fix this
- **Quoted:** §2: "until `gs-check --strict` reads the registered status or the registered cap is reached"; §12.11: "The registered cap bounds this and the stop status is reported."; §14.5: "FX-1 and `gs-check` validated enough that B's stop condition is meaningful".
- **Problem:** The cap limits how much B can spend. It does not check that the work done before stopping was useful. Through the budget matching in F2, the GS instrument also sets C's budget. "Validated enough" has no threshold, so the precondition cannot fail.
- **Fix:** Add a threshold to §14.5: "gs-check is validated if, in FX-1, its strict status agrees with blind human labels on at least 0.85 of seeded findings, with sensitivity of at least 0.8. Otherwise B stops on a GS-independent rule: a fixed share of the cap (e.g. 100% of the cap) or a fixed number of findings fixed." Also report m_B separately for runs that stopped on status and runs that stopped on the cap.

### F4. MAJOR. Section 2: the cheap-fix steelman is crippled
- **Quoted:** §2, arm C: "spent by an external practitioner's prompt"; "it may not install ids, a ledger, hooks, a lock or a ratchet".
- **Problem:**
  - Pre-commit hooks that run tests and lint, and coverage ratchets, are ordinary non-GS practice. Forbidding them strips the steelman of standard tools.
  - B gets a custom tool (`gs-check`) plus formulas built over months. C gets one prompt written by a practitioner who has no pilot to iterate on.
  - The detector "reports what it built anyway", but the rule tells C not to build these things in the first place.
- **Fix:** Change the rule to: "C may install anything a non-GS practitioner would use, including pre-commit hooks, linters, coverage ratchets and an instruction file. It may not copy GS artifacts (ids, spec ledger, gs-lock)." Give the practitioner the same preparation budget as was spent tuning formulas 2 and 5, in hours, plus one pilot codebase outside the study to iterate on the prompt. Log both.

### F5. MAJOR. Section 8: the acceptance ceiling and item replacement select items that favour remediation
- **Quoted:** "above 85% the items are too easy and below 30% too hard: INVALID-DESIGN for that codebase until items are replaced (data excluded)."
- **Problem:** The primary outcome is cost, which needs no headroom in acceptance. Throwing out item sets where A succeeds removes the very world described by rival (3), "frontier models navigate unfamiliar code natively". Replacing items after seeing A's pilot results pushes the item set toward items A fails. Failed attempts count toward cost, so this inflates m_A and shortens k\*.
- **Fix:** Rewrite as: "A acceptance above 85% does not invalidate the cost outcome; acceptance-based rows ((viii) and trap rates) are declared unevaluable for that codebase. Below 30%, items are replaced only from a reserve written in advance, drawn at random by the independent author, never chosen by inspecting which items A failed."

### F6. MAJOR. Sections 4, 10.4 and 12.3: the snapshot design also flatters remediation, and the declared threat covers only one direction
- **Quoted:** §12.3: "the continue arm is flattered (its cost does not grow) and so is the claim "pays back late": true savings could be larger over a long chain."; §10.4: "Sensitivity: continue-arm cost grows by g per change (g in {0, 0.5%, 1%})".
- **Problem:** Every B and C item starts from a freshly remediated snapshot. The docs, characterization tests and spec are therefore in sync with the code on every item, and substrate drift never happens. Linear extrapolation to 200 changes assumes m_B and m_C stay at their fresh-substrate value, which flatters both remediation arms. The sensitivity analysis lets only A's cost grow.
- **Fix:**
  - Add to §12.3: "...and the remediation arms are flattered too: their substrate is never stale."
  - Add to §10.4 a symmetric parameter h (B and C cost grows by h per change, h in {0, 0.5%, 1%}) and report the full g × h grid.
  - Estimate g and h from the chain probe and pre-register that the probe's slopes are used, not just shown.

### F7. MAJOR. Sections 2 and 11: the wrapper confound is not resolved, but row (iii) makes a component claim anyway
- **Quoted:** §2(a): "B' (default: added on 2 of 4 codebases, because it reuses B's remediation and costs only change sessions) separates the substrate from the formula-5 text"; row (iii): "the substrate was not what repaid it; ordinary tests and docs did the same."
- **Problem:** A gets a neutral preamble, B gets formula 5, and C gets the practitioner's own wrapper. All three wrappers differ. B' runs on only two codebases, is optional, and appears in no decision row. A' (point 1 with the formula-5 wrapper) and C' (C's repo with the A wrapper) do not exist. Row (iii) therefore cannot attribute anything to the substrate.
- **Fix:** Make B' mandatory on all four codebases, add C' (C's repository with the A wrapper), and register a row: "if m_B' − m_A interval includes 0 while m_B − m_A excludes it, the saving is attributed to the formula-5 text, not the substrate." Otherwise reword row (iii) to "the GS package (substrate plus wrapper) was not what repaid it".

### F8. MAJOR. Sections 5, 6 and 10: the token k\* and the pooled k\* are not well defined
- **Quoted:** §5: "the pooled k\* is the equal-weight mean over vendor cells."; §6: "never summed across vendors without conversion"; §10.1: "Pooled = equal-weight mean over cells (vendor strata and codebases)."
- **Problem:**
  1. The token k\* has no rule for combining the four token categories. Agentic sessions are dominated by cache reads, so an unweighted sum makes cache-friendly substrate reading look as expensive as output.
  2. §5 pools k\* values, while §10.1 pools the cell-level quantities. These are different estimators.
  3. A mean of ratios is infinite whenever one cell has a non-positive saving.
- **Fix:** Define "token k\* = R/(m_A − m_B) with tokens weighted by a fixed reference price vector pinned at freeze; unweighted per-category k\* is secondary." Pool as "the ratio of equal-weight means of R and of (m_A − m_B) over cells", stated once in §10.1, and delete the §5 sentence.

### F9. MAJOR. Section 5: harness heterogeneity, a home-vendor advantage, and contradictory fallbacks
- **Quoted:** §5: "each in its own coding-agent CLI or an API harness of ours"; §14.3: "otherwise the cost outcome is declared Anthropic-only and the others descriptive."; row (i): "or fewer than two metered vendors".
- **Problem:**
  - Vendor CLIs auto-load different instruction files and inject their own system prompts. This changes how much C's instruction file and B's substrate get used, so vendor and harness are confounded.
  - The formulas were presumably developed with Claude, so an Anthropic-only fallback is the most favourable possible cell for B.
  - §14.3 and row (i) contradict each other on what happens with fewer than two metered vendors.
- **Fix:**
  - Use one API harness of ours for all metered vendors, with identical tool schemas and system text, and no auto-loading of instruction files (the wrapper names the files to read, identically in every arm).
  - Delete the Anthropic-only fallback in §14.3. Fewer than two metered vendors, at least one of them not Anthropic, means INVALID per row (i).
  - Log which vendor's models were used to develop formulas 2 and 5, and report that vendor's cell apart.

### F10. MAJOR. Section 4 (and §9 preparation): item authors are not independent enough
- **Quoted:** §4: "written as user-facing tickets in plain language by someone who does not design the substrate"; "with the GS side holding a logged veto for ambiguity only"; §9: "a guess of `[150 to 300]` agent-assisted hours".
- **Problem:**
  - "Does not design the substrate" still lets GS-side people, or GS-side agent sessions, write items.
  - An ambiguity veto held by an interested party is a lever, and nobody arbitrates it.
  - 240 items, hidden tests and suites written with agent help, from vendors also under test, are not independent of the models being measured.
- **Fix:**
  - Apply the §3 independence definition to all item and test authors ("not JC, not the GS side, no exposure to the formulas").
  - Vetoes are decided by the skeptic, and vetoed items are run anyway as a reported sensitivity.
  - Any model assistance in authoring uses a vendor not among the experiment vendors, logged per item.

### F11. MAJOR. Section 11: the decision-table logic is broken in four places
- **Quoted:** header: "precedence: row (i) INVALID first, then the rest top to bottom within the pooled estimate"; row (viii): "cost rows (v)-(vi) but acceptance or regression better in B/C beyond 10 points"; row (iii): "the C comparison inside a margin of 20% of m_A"; row (x): "differ in the class of the row by more than one row or in sign".
- **Problem:**
  1. Under top-to-bottom precedence, (v) or (vi) always fires first, so (viii) can never be reached.
  2. A ±20%-of-m_A margin is about two thirds of a saving of s = 0.3. That calls C "equal" even if C saves a third of what B saves, which tilts the table against GS.
  3. Row (iii) asserts that C repaid itself without checking k\*_C.
  4. The rows are not ordinal, so "more than one row" has no meaning.
- **Fix:**
  1. Make (viii) a modifier co-reported with (v) or (vi).
  2. Row (iii): "upper bound of k\*_B and of k\*_C at most 60, and the interval of (m_C − m_B)/(m_A − m_B) inside [−0.2, 0.2]."
  3. Row (x): "R and S strata land in different rows among {(ii)–(iv)}, {(v)}, {(vi)–(vii)}, or their savings have opposite signs."

### F12. MAJOR. Section 13: no result is committed to change the offer
- **Quoted:** §13: "See the private report, section 6."; row (vi): "Any case for it is governance, risk or quality, not savings."
- **Problem:** What each result licenses for the offer is kept in a private document that the preregistration does not freeze. Every adverse row leaves the offer standing on grounds the study does not measure. The authors' decisions are therefore unfalsifiable by this study.
- **Fix:** Move the offer consequences into §13, hashed. For example: "Rows (iv), (vi) or (vii) → the claim 'remediation pays for itself' is withdrawn from all sales material, and GS remediation is not priced on token savings. Row (iii) → the cheap tier is offered first."

### F13. MAJOR. Section 3: the S fixtures depend on an unchosen generator vendor and a regrowth loop with no rule
- **Quoted:** "a fixed vendor, no spec, no tests, no architecture guidance, no refactoring request".
- **Problem:**
  - If the generator is one of the three test vendors, that vendor reads its own style. This creates a vendor × codebase interaction inside the S stratum.
  - Modern models write fairly tidy code. If the maturity script fails, nothing says what happens next, so repeated regrowth would select the messiest outcome.
- **Fix:** "S is grown by a vendor not among the experiment vendors (or one S codebase per experiment vendor, with generator-vendor cells reported apart). If maturity fails, regrow with the next registered seed, at most 3 seeds, and report every attempt. If all 3 fail, the S stratum is reported as 'model-grown code does not reach maturity'."

### F14. MINOR. Section 3: the maturity reference set and criteria are underspecified
- **Quoted:** (6): "above the 75th percentile of a reference set of ten open projects chosen by the same independent person"; (1): "R at least 300 commits, S at least 40 feature rounds".
- **Problem:** No rule defines the reference population, so a set of clean projects would let almost anything pass. Commits and feature rounds are not commensurable. Criterion (7) rests on one attester.
- **Fix:** "The reference set is a seeded random draw of 10 projects in the same language, 8–40 kLOC, at least 300 commits, with test coverage of at least 50%." Make (7) require two attesters who agree independently.

### F15. MINOR. Section 3: the contamination canary has no baseline and fires too easily
- **Quoted:** "recall above zero for a model-codebase pair marks that pair as contaminated and it is reported apart."
- **Problem:** A model can infer conventions from the code itself, so "above zero" fires on inference, not memorization. With no control, false positives are likely, and row (i) can then invalidate a whole stratum.
- **Fix:** Run the canary without code access, against a fabricated control project of matched style. Contamination means recall exceeds the control by at least 2 of 5 probes. Screen candidate R projects with the canary before selection, not after.

### F16. MINOR. Sections 4 and 8: trap classification has no named rater, and the positive control is ambiguous
- **Quoted:** §4: "Traps are classified before freezing as *discoverable* (a remediation that characterizes the code could find the rule) or *latent*"; §8: "One synthetic item class where a documented rule exists in the remediated repository".
- **Problem:** No one is named as the classifier. "A remediation" is undefined, and B and C would discover different rules. The positive control does not say who documents the rule. It also has no consequence in §11.
- **Fix:** "Two independent raters (the tester and the skeptic) classify traps using only the original code and a black-box run. Kappa is reported, and disagreements count as latent." Positive control: "the rule document is planted identically in B, C and an A-control branch. Failure → row (i)."

### F17. MINOR. Section 7: blinding is claimed where it is impossible
- **Quoted:** "blind to arm, calibrated on a planted-flaw set first"; "JC reads 30 blind pairs".
- **Problem:** GS remediation output (ids, ledger, decision records) identifies the arm at a glance. JC is the stakeholder.
- **Fix:** "Maintainability readings of remediation outputs are declared unblinded. Diff-level judging strips substrate paths before judging. JC's 30 pairs are replaced by the skeptic's reading or reported as unblinded."

### F18. MAJOR. Sections 9 and 10: widening the interval does not fix its coverage, and codebases are never resampled
- **Quoted:** §9: "the registered intervals are widened to 97.5% to compensate."; §10.2: "resampling items within cell".
- **Problem:** At the hard points, the simulated coverage is 0.68. Moving from 95% to 97.5% does not lift that to nominal. The interval also ignores codebase-level variance, yet pooled rows are assigned from it.
- **Fix:** Add a precondition: "the interval method (bootstrap-t or Fieller on the ratio) reaches ≥0.93 simulated coverage at every grid point, using REM-0 SDs." Pooled rows use a codebase-cluster bootstrap. With 4 codebases, if that interval is too wide, only per-codebase rows are assigned.

### F19. MINOR. Sections 6 and 11: a secondary instrument can invalidate the whole study
- **Quoted:** §6: "its validity is checked on 40 hand-labelled turns (agreement at least 0.9)"; row (i): "classifier agreement below 0.9".
- **Problem:** The net saving (m_A − m_B) does not use the classifier, yet classifier failure voids every cost statement. 40 turns gives a very wide interval on agreement. The labeller is not named.
- **Fix:** If agreement falls below 0.9, mark only the overhead decomposition unevaluable. Use 150 turns labelled by a non-GS person, stratified by arm.

### F20. MAJOR. Section 9: missing rival designs that would be more informative for the same money
- **Quoted:** "Plan: 4 codebases x 3 vendors = 12 cells; 60 items per cell and arm".
- **Problem:** §9 itself says codebases are the binding units. Even so, the budget goes to items, which barely move the inconclusive rate (0.25 → 0.10 at 100 items), and to a third vendor.
- **Fix:** Consider these alternatives:
  - (a) 8 codebases × 30 items × 2 vendors, about the same session count, which allows a statement about a population of codebases.
  - (b) 3 cumulative chains of 40 items per arm per codebase, measuring g and h (F6) directly instead of assuming g = 0.
  - (c) A factorial at one vendor over the 4 codebases (A, A+formula-5, B', B, C-natural, C-matched). This settles the wrapper and budget questions (F2, F7) for less than the third vendor costs.

Checked and sound: the black-box hidden acceptance (sealed and hashed before any run), counting failed-attempt spend in cost and unaccepted items in the acceptance denominator, fresh sessions with memory off and a persistence test, the emergent-substrate detector run on both A and C, reporting dollar and token results side by side with price sensitivity, and registering "does not pay back" as a result are fair to both sides.
