# SDX-1 / SDX-0 design review (Stage 3 critic)

**Scope.** I reviewed only the protocol and the three design files you pasted. I didn't read the repository, the oracle or any arm artifacts. I'm a Claude model, which is the same vendor as the generator, so this review does not count toward the different-vendor critic still owed under SDX-1 §13.3.

Each finding below has a suggested disposition (accept, reject or defer) for the review record.

---

## A. Rules that route results unfavourable to the thesis into INVALID-DESIGN

Several validity rules turn the outcomes that would hurt the thesis into INVALID-DESIGN instead of NULL or REFUTED. Each rule can be defended alone. Together they make row (iii) (substrate adds nothing) hard to reach.

**A1. The positive control is the hypothesis itself.** A4x removes the substrate and requires A4 − A4x ≥ 20 on D. If code alone carries the state, A4x ≈ A4. That is exactly the world where H1 is EQUIVALENT, but the design labels it INVALID-DESIGN. §2a says so directly: "the control fails … INVALID-DESIGN, not a result". A positive control has to show a known effect that does not depend on the treatment.

There are also two internal problems:
- You expect A4 − A4x ≥ 20 but A4 − A5 of only about 9. A4x after change 6 looks like A5 started late, so no reasoning is given for why its gap would be twice as large.
- Deleting the substrate can leave dangling hooks, package scripts or lock-check references that break the build. The "effect" would then come from harness breakage, not lost state.

*Fix:* use a substrate-independent memory control:
- **H+ (perfect history):** A0 plus all earlier change texts and the product-owner replies appended to the prompt.
- **H− (degraded):** A0 with code comments and test names stripped before change 6, or a similar planted loss.

Require H+ − A0 ≥ X on E1-SD. This also gives a useful normalised readout: the share of the recoverable state gap that A4 closes, (A4 − A5)/(H+ − A5). Keep A4x as an exploratory mechanism check, not a validity gate. *Suggested: accept.*

**A2. The M2 strength check pre-filters H2.** The calibration probe requires A5 to separate from A0, including on hidden-oracle pass rate at change 3. That is the H2 construct, measured early. The practitioner then revises A5 after seeing A0 and A5 outputs until it separates. Two consequences:
- The arm is tuned against naive on the outcome construct, which biases toward A5 BETTER.
- If A5 can't beat A0, the outcome is "weak by construction → INVALID", so row (i) (A5 ≈ naive) is mostly filtered out before the main study.

*Fix:* M2 should use only the expert review plus targeted manipulation metrics (does the prompt change the behaviours it targets?). Drop the hidden-oracle metric from M2. Not separating on the oracle must never trigger a revision. *Suggested: accept.*

**A3. The emergence trigger.** If ≥ half of A5 chains build ≥ 3 of L1–L5 on their own, the A5 contrasts become INVALID. An agent that documents spontaneously is a real finding, and it would shrink H1, so this again sends a thesis-unfavourable outcome to invalid. *Fix:* analyse intention-to-treat; report emergence as a mediator; relabel the arm in the write-up if needed, but keep the verdict. *Suggested: accept.*

**A4. The circumvention trigger.** Gate circumvention in A4 above threshold makes the run INVALID ("A4 not enforced"). Agents bypassing gates is a property of the substrate as deployed. *Fix:* keep the A4 verdict under ITT; only the word "enforced" is withdrawn. *Suggested: accept.*

**A5. The ceiling rule is misapplied, and this one goes the other way.** "If A5 *or A4* has E1-SD ≥ 90% → H1 untestable" would invalidate a large positive result (A4 at 92%, A5 at 70%). Per protocol guard (a), only the weaker arm at the ceiling, or the stronger at the floor, hides an effect. *Fix:* invalidate only if A5's E1-SD is ≥ 100 − SESOI, or if the observed interval is truncated by the ceiling. *Suggested: accept.*

## B. The primary readout D

**B1. D does not increase with quality.** D = E1-SD − E1-SI:
- An arm that does worse on state-independent probes gets a higher D, so gate friction that breaks earlier features would look like substrate benefit.
- Collapsed chains under ITT probably score 0 on both, giving D = 0. If D is typically negative (state-dependent probes are harder), collapse raises D.

*Fix:* make E1-SD primary with E1-SI as a covariate (ANCOVA at chain level), or use a probe-level mixed logistic model with an arm × probe-type interaction. In either case, state the score of a collapsed chain explicitly. *Suggested: accept.*

**B2. State dependence is confounded with position.** All state-dependent changes are 6–9 and all state-independent ones are 1–5. D therefore also measures lateness, codebase size and recency. *Fix:* add 1–2 late state-independent changes (for example, after change 6), or include change index as a covariate. *Suggested: accept.*

**B3. Scoring only the final state hides transitions.** A chain that never implemented the emergency move (change 3) passes the change-9 reversal probes free. One that never implemented the constant rest rule passes some supersession probes. *Fix:* score the snapshot after every change. For change 6 and 9 probes, count a pass only where the antecedent passed at its own snapshot, or score transitions. This also gives regression flips. *Suggested: accept.*

**B4. Probe balance.** Paired 2xx/4xx balance is required overall, but not inside the state-dependent subset. A permissive or restrictive arm then shifts E1-SD for reasons unrelated to state. *Fix:* require balance within each subset. *Suggested: accept.*

## C. Power and the decision rule do not match

**C1. Power at the SESOI is about 50%, not 80%.** The n formula targets "interval excludes zero" at the SESOI. BETTER also requires the point estimate ≥ δ. At a true effect equal to δ, the point estimate is ≥ δ only about half the time. With H1's central estimate of 9 < δ = 10, P(BETTER) is under 50% even at the planned n. *Fix:* either power for the rule actually used (roughly a test against the SESOI, which needs about 4 times the n), or add a named class "POSITIVE, BELOW SESOI" for an interval that excludes zero with the point estimate under δ, with its own decision row. Then decide, before spending about $1k, whether a design whose modal outcome is INCONCLUSIVE is worth running at this scale. *Suggested: accept.*

**C2. Sample size from k = 3 SDs is unreliable.** With 2 degrees of freedom, the 95% interval for an SD runs from about 0.5× to about 6×. *Fix:* pool SDs across arms, use an upper confidence limit, and/or register a blinded internal-pilot SD re-estimation at the interim look. The look is validity-only and uses blinded variance, so it is compatible with guard (g). *Suggested: accept.*

**C3. The negative control has a high false-alarm rate.** For A5 (n = 20) vs A5b (n = 10), the SD of the difference is 0.39 × SD. At SD = 15, P(|diff| ≥ 10) is about 8.5% under pure noise. The rule is also on a point estimate, which is not stated. A/A also measures noise only for A5, not for A4, which may vary more because of gate blocking. *Fix:* use an interval-based rule and a stated false-alarm rate; consider A/A pairs for A4 too. *Suggested: accept.*

**C4. Unspecified details:**
- The alpha for H3 under gatekeeping.
- Bootstrap type, number of replicates and seed. Percentile intervals undercover at n = 20; use BCa or a t-interval.
- "Stratified permutation (strata none)" is self-contradictory.
- The 97.5% interval for EQUIVALENT is TOST at α = 0.0125 per side; say so.

*Suggested: accept.*

**C5. SESOI justifications are thin.** An expert prompt costs almost nothing to adopt, so the 5 pp threshold for "a decision to adopt an expert prompt" is hard to defend; a smaller gain would justify adoption. The 10 pp "buyer's decision" threshold has no source. *Suggested: defer to the SDX-0 freeze, but write the reasoning down.*

## D. Construct validity of the arms

**D1. A5 is "an expert forbidden to document", not "an expert".** L2/L3 are defined to include "update the README" and "keep notes". So minus-GS also means minus-documentation, which no practitioner does. Combined with probes that measure recall of earlier change texts, H1 drifts toward "persisted information helps recall persisted information", which is close to the circularity guard (b) warns about.

The field-relevant comparison is A4 vs an **unconstrained expert (A6)**: same practitioner, no constraint, written first and frozen before the constrained version. Then:
- A6 − A5 shows what generic documentation instinct buys.
- A4 − A6 shows what GS adds over real practice.

*Suggested: accept. At minimum, H1's public wording must say "expert without project-state documents".*

**D2. Who writes A4's ledger?** If the harness or a hook writes change texts into the ledger, A4 gets the history by construction while other arms don't. The treatment then equals the information the probes test. Also specify whether the harness commits with the change text as the commit message; this affects every arm's access through `git log`. *Suggested: accept, specify in §3.*

**D3. The decision-point channel differs by arm.** The product-owner reply arrives only if the agent asks. A4 has a triage rule, A5 is allowed to "ask if ambiguous", and A0 has neither. Arms therefore receive different information at D1 and D2, and a fixed HTTP oracle can't score consistency with whatever an arm decided on its own. Headless `claude -p` also has no ask channel, so the mechanism (question file, resume, does it count as an attempt?) is undefined. *Fix:* deliver the reply unconditionally to every arm as part of the change, and record asking as a secondary metric. *Suggested: accept.*

**D4. Authorship asymmetry.** A4 is built by the GS side; A1 and A3 by an outsider working from manifest L. A4 − A3 (H3) and A4 − A1 (H4) therefore confound vehicle with author skill in the method. *Fix:* have the practitioner also build A4 from a written procedure, or have the GS side also write A3. *Suggested: defer, or declare as a threat.*

**D5. "Blind to arm" probe tagging is not blind.** The oracle author tags probes blind to arm but designed, or knows, what the substrate records. They can pick state-dependent probes that match what a ledger captures rather than what code carries. *Fix:* tag by a mechanical rule, freeze the probe list before A4 artifacts exist, or use an independent probe author. *Suggested: accept.*

## E. Smaller items

- **Interim look:** state what each flag triggers (for example, emergence counts or cap-hit). A mid-run stop or redesign is outcome-adjacent.
- **Untestable part of the intuition:** JC's "less than a year ago" can't be tested by this design; say so in §1.
- **Uniform reporting (guard i):** row (ii) is labelled "JC's expectation" in the decision table. Remove the label from the table.
- **Pinning:** pin the exact model snapshot (not an alias), the CLI version and the Node version. `node:sqlite` needs a recent Node and was experimental.
- **Stale text in SDX-0:**
  - §1 item 7: path without backslashes (`C:workspacePragmaWorks…`).
  - V4/V5: "P_expert" is the revision-1 name.
  - V6: "primary readout" is ambiguous now that there are two.
  - V9 is listed after V12.
  - V6 checks A5 below 90%, but the SDX-1 ceiling rule uses 100 − SESOI. Align them.
- **Scale:** at 2–3 kLOC a fresh session can read the whole repository, so the regime where the substrate is claimed to matter (10a-a) is excluded by construction. Consider whether a longer horizon (the 24-change contingency) should be the primary design rather than a fallback.

## F. Highest-value changes, if only a few are adopted

1. A substrate-independent positive control (H+/H−) instead of A4x as the validity gate (A1).
2. E1-SD with an E1-SI covariate instead of D, per-change snapshot scoring, and a defined score for collapsed chains (B1, B3).
3. Remove the hidden-oracle metric from M2, and stop routing emergence and circumvention to INVALID (A2–A4).
4. Make power match the classification rule, and add a "positive, below SESOI" class (C1).
5. Add an unconstrained-expert arm A6 and deliver product-owner replies unconditionally (D1, D3).
