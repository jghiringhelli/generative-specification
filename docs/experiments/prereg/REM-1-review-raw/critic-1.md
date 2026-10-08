- **F1. BLOCKER. Section 11 (decision table)**
  - **Quoted:** "precedence: row (i) INVALID first, then the rest top to bottom within the pooled estimate" together with row (vi) "saving interval not above zero with R positive", row (vii) "m_B - m_A positive, interval excluding zero (overhead exceeds the gross saving)", row (viii) "cost rows (v)-(vi) but acceptance or regression better in B/C beyond 10 points, interval excluding zero", and row (iii) "the C comparison inside a margin of 20% of m_A".
  - **Problem:** The rows are neither exclusive nor fully reachable.
    - Row (vii) can never fire. Any interval for m_B − m_A that is above zero means the saving interval is below zero, so row (vi) catches it first.
    - Row (viii) can never fire. It is defined as the case where rows (v) or (vi) already hold, and those rows come before it.
    - Rows (ii) and (iii) overlap. If m_C − m_B is significant but small, row (ii) says "GS ahead" even though the difference is inside the 20% equivalence margin.
    - Row (iii) can say "equal" while m_C − m_B is significantly negative, so it pre-empts row (iv) "Cheap fix wins".
    - Row (iv) "k\*_C interval entirely below k\*_B" compares an interval with something unstated: a point or an interval?
    - If B pays back within 60 but the B-versus-C interval is wide, the result falls through to (ix), "Inconclusive", even though the payback itself is clear.
  - **Fix:** Split the table into three independent axes and register them as a cross-product:
    - Axis 1, B payback: PAYS ≤60 / LATE 60–200 / NOT ≤200 / REVERSED / INCONCLUSIVE.
    - Axis 2, B vs C, using the interval of (m_C − m_B)/m_A: GS AHEAD (interval above +0.20) / EQUIVALENT (whole interval inside ±0.20) / C AHEAD (interval below −0.20) / SMALL-DIFFERENCE (excludes 0, inside margin) / INCONCLUSIVE.
    - Axis 3, quality modifier: attached to any cost row.
    - Write out "k\*_C interval entirely below k\*_B" as "the upper 97.5% bound of k\*_C is below the lower bound of k\*_B".

- **F2. BLOCKER. Section 11, row (vi)**
  - **Quoted:** "lower bound k\*_B above 200, or saving interval not above zero with R positive | **"Within 200 changes the remediation does not repay its token cost."**"
  - **Problem:** The second clause turns absence of evidence into a strong negative claim. A saving interval of [−0.05, +0.40] change-units with R = 10 is "not above zero", yet it includes true break-evens of 25 changes. Row (vi) would still declare "does not repay within 200". The simulation shows this region is common: "With R = 10 and s of 0 to 0.05 it is inconclusive 0.31 to 0.41". This biases the conclusion against remediation whenever the data are noisy.
  - **Fix:** Replace the clause with "or the upper 97.5% bound of the saving is below R_B/200". Saving intervals that include zero but whose upper bound is at least R_B/200 go to (ix), "Inconclusive".

- **F3. BLOCKER. Sections 9 and 10.2 (interval validity)**
  - **Quoted:** "The bootstrap interval covered the conditional truth 0.68 to 0.94 of the time (liberal at the hard points); the registered intervals are widened to 97.5% to compensate." and "resampling items within cell stratified by item type and trap class, and remediation replicates within cell".
  - **Problem:** The mitigation does not work.
    - Going from 95% to 97.5% widens a normal-type interval by a factor of 2.24/1.96 ≈ 1.14. Coverage of 0.68 means an effective z of about 1.0, so the interval needs roughly double the width.
    - The cause is structural. Resampling 2 replicates gives only 3 distinct resamples and a variance of s²/4 against the true s²/2.
    - Because "items in B and C assigned at random across the two replicates", m_B is nested in the replicate. Resampling items within cell treats about 30 items per replicate as independent, which understates the replicate random effect on m_B, not only on R.
    - The interval is the product of the study, so it is invalid at the hard points whatever the data say.
  - **Fix:**
    - Register a two-stage cluster bootstrap that resamples replicates and then items within the resampled replicate, with a variance inflation of n/(n−1), or a parametric model with a replicate random effect on both R and m_B.
    - Before freezing, re-run `simulate.py` with exactly the registered procedure, the 97.5% level and a nonzero replicate effect on m_B. Require coverage ≥ 0.93 at every grid point.
    - If that fails, raise B and C to 4 replicates per cell or change the analysis.

- **F4. MAJOR. Sections 6 and 10.2 (ratio estimand)**
  - **Quoted:** "Break-even k\*_B = R_B / (m_A - m_B)** (infinite if the denominator is not positive)" and "draws with a nonpositive saving are infinite".
  - **Problem:**
    - A percentile interval for a ratio whose denominator can approach zero is unstable. Once more than 1.25% of draws have a nonpositive saving, the upper bound becomes ∞ and rows (ii) and (v) cannot be reached. That happens whenever the saving is within about 2.2 SE of zero.
    - Small positive savings produce huge but finite k\* values, so the bound depends on the tail of the denominator, not on the data's information about R.
    - Coverage of percentile intervals for ratios is poor in exactly this region, which matches the 0.68 coverage in F3.
  - **Fix:**
    - Make the registered primary the net cumulative difference D_B(k) = k(m_A − m_B) − R_B at k = 60 and k = 200, with its interval. It is linear in the estimates, has no singularity, and is what the decision rows actually ask about (PAYS ≤60 ⇔ the lower bound of D_B(60) > 0).
    - Report the k\* interval by Fieller's method, which correctly returns unbounded or two-piece sets, as a descriptive translation.

- **F5. MAJOR. Section 5 against section 10.1 (pooling)**
  - **Quoted:** "the pooled k\* is the equal-weight mean over vendor cells" and "Pooled = equal-weight mean over cells (vendor strata and codebases)" against "never summed across vendors without conversion".
  - **Problem:**
    - The two pooling rules contradict each other: mean of the cell k\* values, or mean of the cell m and R values?
    - A mean of ratios is undefined (∞) as soon as one cell has a nonpositive saving.
    - It is biased upward by Jensen's inequality when savings are small.
    - Pooling m_A and m_B "in tokens" across vendors sums tokens across vendors, which section 6 forbids.
  - **Fix:** "Pooled estimate: equal-weight mean of cell R and of cell saving, in dollars at the pinned list prices; pooled D(k) and k\* are computed from those pooled means. Pooled token figures are not computed; token k\* is reported per vendor only."

- **F6. MAJOR. Sections 2 and 6 (budget matching)**
  - **Quoted:** "A C that stops early records the unspent budget." and "(with R_C = R_B by matching, the curve difference is `k (m_C - m_B)`)".
  - **Problem:**
    - Under the arm's own rule, R_C ≤ R_B, so the registered B-versus-C formula drops the R_C − R_B term. Every early-stopping C run is analysed as if it had spent the full budget, which charges C money it did not spend and biases the comparison toward B.
    - Matching "in four categories" exactly cannot be enforced, because the cache-read and cache-write split is an outcome of the agent's behaviour.
  - **Fix:**
    - Register D_BC(k) = (R_C − R_B) + k(m_C − m_B) using the realized R_C, with matching on total dollars at the pinned list price, and report the category mix.
    - Add the line: "the C practitioner is told the budget is a ceiling, not a target."

- **F7. MAJOR. Section 6 (cost per accepted change)**
  - **Quoted:** "`m` = (all tokens spent in change sessions, failed and second attempts included, plus the arm's per-change substrate upkeep) divided by the number of accepted items." and "Cumulative cost after k accepted changes: `C_A(k) = k m_A`".
  - **Problem:**
    - m mixes spend and acceptance. An arm with identical spend per attempt but 10 points more acceptance gets a lower m, as the section 9 sensitivity shows. So k\* partly measures acceptance, even though quality is said to be "co-reported, not folded into cost".
    - C_A(k) = k·m_A assumes the items A failed eventually get done at A's average cost. They are the harder items, and their true cost is censored by the cap.
    - The session cap ("`[FROM REM-0]`") turns overhead into non-acceptance: a B session that spends its budget reading substrate hits the cap and becomes "unaccepted" rather than "expensive".
    - "Per-change substrate upkeep" has no measurement rule when sessions are fresh and nothing carries over.
  - **Fix:**
    - Register m = (spend per attempted item) / (acceptance rate) and report both factors.
    - Give every unaccepted item a registered fallback cost, frozen `[AT FREEZE]` (for example, 2× the cap plus the human-proxy cost of a manual fix), so that C(k) counts all tickets delivered.
    - Define upkeep as the classifier categories (b)+(c) inside the change sessions.
    - Add a validity trigger: cap-hit share above 15% in any arm → raise the cap and rerun the cell.

- **F8. MAJOR. Sections 8 and 11 (remediation filtered by the hidden oracle)**
  - **Quoted:** "Remediation that changes observable behaviour (sealed suite red after remediation) is a failed remediation, reported and, for B and C, rerun once; two failures mark the cell." and row (i) "remediation changed behaviour in more than half of runs".
  - **Problem:**
    - The sealed characterization suite, which is the regression oracle, chooses which remediated state enters the item phase. B and C are screened against the oracle and A is not, so B and C start their items from oracle-certified states.
    - Remediation that breaks behaviour is a substantive negative result about remediation. Calling it INVALID-DESIGN hides it, which is rigged for B and C.
    - "Mark the cell" has no analytic meaning.
    - Arm C is told to write "characterization tests", the same construct as the oracle, so C's treatment targets the measure.
  - **Fix:**
    - Intention-to-treat: the first remediation's final state enters the items whatever the suite says. The rerun is a sensitivity analysis only.
    - Report the post-remediation regression rate as a quality-guard outcome, not as INVALID.
    - Remove that clause from row (i).
    - Compute the behaviour overlap between tests written by B and C and the sealed suite, and report acceptance separately on non-overlapping behaviours.

- **F9. MAJOR. Section 10.4 (one-sided growth sensitivity)**
  - **Quoted:** "Sensitivity: continue-arm cost grows by g per change (g in {0, 0.5%, 1%}); the primary uses g = 0".
  - **Problem:**
    - Only A is allowed to get worse over time. B's per-change cost should also grow: the ledger, decision records and spec grow with every change and are read in category (a). C's test-suite run time grows too.
    - Because sessions start fresh from the point-1 snapshot, B's substrate is always at its leanest. So the sensitivity can only move the result toward remediation, and the design flatters B.
  - **Fix:** Register symmetric growth parameters g_A, g_B, g_C, and estimate g_B from the chain probe (category (a)+(b) tokens against item index). Report k\* on the grid g_A, g_B ∈ {0, 0.5%, 1%}, including g_B > g_A.

- **F10. MAJOR. Section 9 (staging and REM-0)**
  - **Quoted:** "REM-0 (1 codebase, 1 vendor, 20 items, 1 replicate of B and C, about `$400 to $1.5k`) measures R, m, the SDs" and "the full study runs only if REM-0 puts the plausible k\* range outside the 40 to 150 band".
  - **Problem:**
    - With one replicate, the between-replicate SD cannot be estimated. With one codebase, the between-codebase SD cannot be estimated. Those are the two variance components that drive the inconclusive rate (F3) and the stratum disagreement. So "the SDs" cannot fill the brackets that the power claims rest on.
    - "Plausible k\* range" is undefined, and with 20 items it will be very wide.
    - Running only when the pilot's point estimate lies in a favourable region conditions the study on its own effect estimate, which is a selection effect.
  - **Fix:**
    - REM-0 runs 2 replicates of B and C on 2 codebases (1 R, 1 S).
    - Any variance component REM-0 cannot estimate is varied in the simulation over a registered range.
    - Go/no-go uses only the variance estimates: "run if the simulated inconclusive probability for rows on both axes is ≤ 0.30 across the registered prior range of s". The pilot's point estimate is not used.

- **F11. MAJOR. Section 9 (power coverage)**
  - **Quoted:** "R in units of one accepted continue-arm change; s = per-change saving of B over A" and "if B passes 10 points more items than A".
  - **Problem:**
    - The simulation covers only k\*_B against A. The B-versus-C contrast, which is primary for the study's second question and decides rows (ii)–(iv), has no simulation, no margin-based power and no misclassification rate.
    - The only acceptance scenario is B better than A. There is no scenario where B's acceptance is lower (gate false blocks, cap hits), and none where C beats B.
  - **Fix:**
    - Extend `simulate.py` to arm C with (m_C − m_B)/m_A ∈ {−0.2, −0.1, 0, +0.1, +0.2} and acceptance differences of ±10 points in both directions.
    - Report, for each scenario, the probability of each cell of the F1 cross-product, including P(GS AHEAD | truly equivalent) and P(C AHEAD | truly equivalent).
    - Do not freeze unless both are ≤ 0.05.

- **F12. MAJOR. Section 2, arm B (stop rule)**
  - **Quoted:** "until `gs-check --strict` reads the registered status or the registered cap is reached".
  - **Problem:**
    - Neither "the registered status" nor "the registered cap" is given or marked with a bracket. R_B is the numerator of k\* and also sets C's budget, so it can be tuned after REM-0 without breaking any registered rule.
    - Declared threat 11 says "The registered cap bounds this", but that mitigation has nothing to bound with yet.
  - **Fix:** Write "until `gs-check --strict` reports status `[AT FREEZE: exact string]` or spend reaches `[AT FREEZE]` dollars per kLOC, whichever comes first". Record the stop reason per run and report k\* separately for status-stopped and cap-stopped runs.

- **F13. MAJOR. Section 8 (headroom)**
  - **Quoted:** "Arm A acceptance at point 1 must be between 30% and 85% on the pilot; above 85% the items are too easy and below 30% too hard: INVALID-DESIGN for that codebase until items are replaced (data excluded)."
  - **Problem:**
    - The pilot covers one codebase, so the other three are never checked.
    - Replacing items according to A's pass or fail selects the item set on the control arm's outcome. That causes regression to the mean, and the choice of which items to replace is open, which can tilt the set toward items A fails and remediation might pass.
    - No ceiling or floor is defined for B or C.
  - **Fix:**
    - Check headroom per codebase on 10 calibration items that are never used in the study.
    - Replacement items are drawn at random from a reserve pool authored and hashed before freezing (pool size `[AT FREEZE]`, at least 15 per codebase). The criterion applies to the whole set, never to individual items.
    - Add a matching ceiling trigger: any arm above 95% acceptance in a cell is reported as a ceiling for that contrast.

- **F14. MINOR. Sections 6 and 11(i) (overhead classifier)**
  - **Quoted:** "its validity is checked on 40 hand-labelled turns (agreement at least 0.9)" and row (i) "classifier agreement below 0.9".
  - **Problem:**
    - With n = 40, an observed agreement of 0.90 has a 95% interval of about 0.76–0.97.
    - Raw agreement is inflated when one class, (d) "work", dominates.
    - Turn-level labels ignore token weight and mixed turns.
    - The labeller is not specified.
    - The classifier feeds only the overhead decomposition, yet its failure voids the primary k\*, which does not use it.
  - **Fix:** 200 turns stratified by arm and class, labelled by two people who are blind to arm and are not from the GS side; criterion: token-weighted Cohen's κ with a lower 95% bound of at least 0.75. If it fails, only the overhead decomposition is unevaluable; remove the classifier from row (i).

- **F15. MINOR. Section 6 (human-time proxy)**
  - **Quoted:** "the number of decisions put to a human (ratifications requested, questions asked; answered by scripted replies)".
  - **Problem:**
    - The treatment drives this proxy: GS formulas require ratifications, so B is penalized by construction.
    - The text of the scripted replies is not registered. If the scripts always approve, B gets governance for free.
    - Diff lines include the remediation's own tests and spec, so the proxy is dominated by remediation diff volume.
    - No minutes per unit are registered, so the hourly rate converts nothing.
  - **Fix:**
    - Hash the scripted reply texts at freeze.
    - Count production-code diff lines separately from test, doc and substrate diff lines.
    - Register minutes per decision and per 100 diff lines `[AT FREEZE]`, calibrated by making the timed sample mandatory (at least 4 runs).
    - Report the proxy only as a sensitivity, never in a row condition.

- **F16. MINOR. Section 11, row (x)**
  - **Quoted:** "R and S strata differ in the class of the row by more than one row or in sign".
  - **Problem:** The rows are not an ordinal scale, so "more than one row" has no meaning. For example, (ii)→(iv) and (v)→(vii) are equally far apart in position but mean very different things.
  - **Fix:** "Strata disagree when the 97.5% intervals of stratum D_B(60) (or D_B(200)) do not overlap, or the stratum point savings have opposite signs and at least one interval excludes zero."

- **F17. MINOR. Section 11(i) against section 14.3 (metered vendors)**
  - **Quoted:** "or fewer than two metered vendors" against "otherwise the cost outcome is declared Anthropic-only and the others descriptive".
  - **Problem:** With one metered vendor, one passage declares the study INVALID and the other says it runs with an Anthropic-only cost outcome. That leaves analytic freedom after the data are in.
  - **Fix:** Pick one. Recommended: "with one metered vendor the cost outcome is single-vendor, labelled as such, and only per-vendor rows are assigned"; delete the clause from row (i).

- **F18. MINOR. Sections 6 and 10.6 (multiplicity and the token scalar)**
  - **Quoted:** "The dollar-denominated and token-denominated k\* are both primary and reported side by side" and "Tokens in four categories (uncached input, cache write, cache read, output) as primary".
  - **Problem:**
    - Two co-primary metrics, plus per-stratum, per-vendor and 7 sensitivity analyses, all at an unadjusted 97.5% level, and the decision table does not say which metric assigns rows.
    - A single "token k\*" requires summing the four categories with equal weight, which treats a cache read as equal to an output token. Arms differ systematically here: B rereads substrate that is cached.
  - **Fix:** "Rows are assigned on the dollar metric at pinned list prices only; token k\* is reported per category and per vendor as descriptive; sensitivities are descriptive and cannot change a row."

- **F19. MINOR. Section 4 (attempts)**
  - **Quoted:** "if the hidden tests fail, one second attempt receives only the names of the failed behaviours (not the tests)".
  - **Problem:**
    - The second attempt gets feedback from the hidden oracle, so acceptance after the second attempt partly measures how well the agent follows oracle hints.
    - The arm with more first-attempt failures receives more oracle information.
    - Behaviour names from the characterization suite leak implicit rules, which defeats the trap items.
  - **Fix:** Make first-attempt acceptance and cost co-primary. If the first-attempt and two-attempt results disagree in row, report both and claim neither. Withhold behaviour names from characterization-suite failures on trap items, and return only "a regression was detected".

- **F20. MINOR. Section 8 (positive control)**
  - **Quoted:** "One synthetic item class where a documented rule exists in the remediated repository and a naive change violates it: the remediation arms must pass it more often than A".
  - **Problem:**
    - There is no number of items, no threshold and no interval.
    - It does not say who puts the rule into the repository. If the experimenters insert it, the control does not test remediation. If the remediation must find it, it duplicates the "discoverable trap" class.
    - "The remediation arms" does not say whether B and C each must pass, or only one of them.
  - **Fix:** "At least 8 items whose rule is stated in code comments or behaviour at point 1 (discoverable). Each of B and C must exceed A's pass rate by at least 20 points, with the 97.5% interval excluding zero. If that fails, the premise is reported as failed for that arm and its rows carry the label 'premise failed'."

Checked and sound: the separation of R and S strata with a no-pooling rule on disagreement; sealed, hashed, surface-level hidden tests that are the same for every arm, including D; fresh sessions per item with randomized order; the cross-vendor judge requirement, with judged outcomes declared unevaluable rather than substituted; and the requirement that cost cells be metered.
