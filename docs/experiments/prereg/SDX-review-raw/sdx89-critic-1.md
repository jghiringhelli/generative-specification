# SDX-8 and SDX-9 critique: anthropic claude opus (headless)

## 0. Header
- VENDOR: anthropic
- MODEL_ID_AS_SHOWN: claude opus (headless)
- HARNESS: claude-cli-stateless-no-tools
- ROUND: not stated to the reviewer
- DATE_UTC: 2026-10-03
- REPO_HEAD: not available
- BRANCH: experiment-protocol-2026-10-02
- FILES_READ:
  - docs/experiments/prereg/SDX-8.md  sha256=not computed
  - docs/experiments/prereg/SDX-9.md  sha256=not computed
  - docs/experiments/EXPERIMENT-PROTOCOL.md  sha256=not computed
- FILES_NOT_READ_ATTESTATION: I read no other file. The three files were supplied inline in the prompt between markers. I used no tools and ran no git or hash commands, so byte identity with the repository is not attested.
- PRIOR_EXPOSURE: none
- NOTES: SDX-1, SDX-1-ARMS, SDX-0, SDX-5, the P4/P6 skeletons and the dissection note were not available. Claims about inherited bytes (oracle rules, A4 substrate, A5 prompt) were not checked.

## 1. Verdict in at most five sentences
I would register neither design as written.

In SDX-8, the most serious defect is in H8-1's growth ratio g. Durable acceptance is judged against the final snapshot, so early changes are exposed to cancellation for about 29 changes and late changes for 0 to 9. Erosion therefore inflates m(W1) more than m(W3) and lowers g mechanically, which rewards the eroding comparators and penalises the substrate on its own primary. A single collapsed chain under the 0.5-denominator convention can move the mean log g by about one SESOI.

In SDX-9, the most serious defect is that the primary "cost to verified COMPLETE" is not a cost measure. Its value is driven by an undefined censoring value, by a scorer gate that requires the agent to have asked about hidden ambiguities, and by an escape band that tolerates failing a large share of held-out variants. In both drafts, the invalidity triggers keyed to the treatment arm's own failure (A4 floor, C4 floor and censoring, differential cap-hit) turn the most likely adverse results into INVALID-DESIGN instead of REFUTED.

## 2. Findings (ranked: all BLOCKER first, then MAJOR, MINOR, NIT)

### F-01
- SEVERITY: BLOCKER
- TARGET: SDX-8
- CATEGORY: construct-validity
- DIRECTION: HANDICAPS-GS
- FILE_AND_SECTION: SDX-8.md section 2.1, "Durably accepted change", and the m_i(w) and g_i definitions
- QUOTE: "(2) at the snapshot after change min(k+3, 30) and at the final snapshot at least `p_acc` of that change's probes that are still live (not retired or inverted by the manifest) pass, and (3) no held-out open-field probe tagged to change k fails at the final snapshot (an escaped defect cancels the acceptance of the change that introduced it)"
- PROBLEM: Exposure to cancellation depends on the window. A W1 change must survive 20 to 29 later changes; a W3 change survives 0 to 9. Suppose each later change breaks a given earlier change with probability 1%. W1 survival is then about 0.78 and W3 survival about 0.96. So m(W1) is inflated by about 1/0.78, m(W3) only slightly, and g falls by about 18%, which is more than the SESOI. The arm that erodes more therefore looks as if its marginal cost grows more slowly, and H8-1 is biased against the arm predicted to erode less. Criterion (3) also tags escapes by the behaviour tested, not by the change that introduced the defect. Most open-field behaviours (persistence, migration) belong to early changes, which deepens the W1 penalty.
- FIX: For m and g, define acceptance at a fixed lag for every change: "change k is accepted for the marginal readout if probes pass at k and at k+L", with L=3 and changes 28 to 30 using a registered extension snapshot of 3 neutral no-op sessions. Keep final-snapshot durability as a separate cumulative readout (R and its own secondary). Attribute escapes by first-failing snapshot, not by behaviour tag.
- CONFIDENCE: high

### F-02
- SEVERITY: BLOCKER
- TARGET: SDX-8
- CATEGORY: power-stats
- DIRECTION: NEUTRAL-DEFECT
- FILE_AND_SECTION: SDX-8.md section 2.1, marginal cost and collapse rule
- QUOTE: "with the convention that a zero denominator is replaced by 0.5 (sensitivity: exclude those chains)"
- PROBLEM: A collapsed chain gets zero accepted changes in W3, so m(W3) = cost/0.5 instead of cost/8 or so. That raises log g by about ln 16 ≈ 2.8. With n=20, one such chain shifts the arm mean of log g by about 0.14, close to the SESOI of 0.163. Collapse is permanent ("later changes count as not accepted") even if the build is repaired. H8-1 and R(k) are then decided by how many chains collapse, not by growth. BCa intervals on such point masses are unstable.
- FIX: Make the H8-1 primary a rank-based or trimmed estimand. For example, use the Hodges-Lehmann shift of log g, with collapsed chains assigned the worst rank in their arm. Alternatively, set the denominator floor to max(ΔV, 2) and report collapse rate as its own co-reported outcome. Make collapse reversible (acceptance resumes when the build is green), and register "result must hold with and without collapsed chains" as a condition of rows (i) to (iii).
- CONFIDENCE: high

### F-03
- SEVERITY: BLOCKER
- TARGET: SDX-9
- CATEGORY: oracle-scorer
- DIRECTION: NEUTRAL-DEFECT
- FILE_AND_SECTION: SDX-9.md sections 2a (Power), 2.1 (COMPLETE, Censoring) and 4.4 (Cap)
- QUOTE: "**Cap:** 40 sessions or 3 times B_4, whichever first"; "censored chains contribute the log cap cost"; "A chain that verifies S4 but exceeds the upper band is a **premature COMPLETE** and counts as not complete."
- PROBLEM: "Cap cost" is undefined when the 40-session cap binds before the dollar cap. A chain of cheap idle sessions would then enter at its own low cost, which makes failing arms look cheap. Agents never see scorer output, so a chain that believes it is done keeps receiving "continue", and idle sessions are likely. A premature COMPLETE chain ends at S4 with no rule for its primary value. Row (iii) implies it is charged the cap, but nothing says so. The cap is 3×B_4, so the primary becomes a censoring-weighted mixture whose weight depends on a pilot number.
- FIX: Register this rule: "every chain that does not reach COMPLETE (censored by either cap, or premature) enters the primary at log(3×B_4) dollars." Also register a second, rank-based primary sensitivity in which non-completers are tied at the worst rank. Report completion rate as a co-primary rate with its own class.
- CONFIDENCE: high

### F-04
- SEVERITY: BLOCKER
- TARGET: SDX-9
- CATEGORY: favors-GS
- DIRECTION: FAVORS-GS
- FILE_AND_SECTION: SDX-9.md section 4.3, column (d), and section 4.2
- QUOTE: "every ambiguity touching S1 asked and answered"; "A planted ambiguity never asked about stays **open**."
- PROBLEM: Stages S1 to S4 cannot be verified unless the agent emitted a QUESTION line about each planted ambiguity's section. The task prompt gives no thresholds and does not tell agents that asking is mandatory. An arm that implements a sensible resolution without asking can never reach COMPLETE and is censored at the cap. This rewards a specific behaviour, not behaviour correctness. C4's open-questions gate and spec-ledger culture plausibly prompt asking. The pilot check ("at least one arm" asks about 80%) does not protect the arms that do not ask. The scorer gate therefore partly measures the treatment's instructed behaviour, which violates protocol guard (b).
- FIX: Remove column (d) from the scorer. Score AMB probes as passing under any resolution in a registered admissible set, and under the scripted resolution only once it has been delivered. Report asking rate per arm as a secondary. If asking must matter, state it in the identical task prompt ("unresolved ambiguities must be asked about") so every arm knows the rule.
- CONFIDENCE: high

### F-05
- SEVERITY: BLOCKER
- TARGET: BOTH
- CATEGORY: falsifiability
- DIRECTION: UNINFORMATIVE
- FILE_AND_SECTION: SDX-8.md section 2b and SDX-9.md section 2b, invalid-design triggers
- QUOTE: "the above, plus differential cap-hit above 10 points, canary recall above zero"
- PROBLEM: In SDX-9, cap-hit is censoring, and a difference in reaching COMPLETE within the cap is part of the treatment effect. A substrate that completes 85% of chains against 65% for the expert prompt, or the reverse, is labelled INVALID-DESIGN. In SDX-8, gate loops are an expected mechanism, so per-session cap-hits differ by arm by design, and an A4 that hits caps through gate friction (the H8-c risk) is invalidated rather than counted COSTLIER. Under the protocol's question "which true world does this label invalid", the answer is the world with a large effect in either direction.
- FIX: Delete differential cap-hit as an INVALID trigger in both drafts. Replace it with "cap-hit rates are reported per arm as an outcome; censored values enter per F-03". Keep an INVALID trigger only for cap-hits caused by infrastructure (harness-classified, logged before unblinding).
- CONFIDENCE: high

### F-06
- SEVERITY: BLOCKER
- TARGET: BOTH
- CATEGORY: favors-GS
- DIRECTION: FAVORS-GS
- FILE_AND_SECTION: SDX-8.md section 2b, Floor and ceiling; SDX-9.md section 2b, Floor and ceiling
- QUOTE: "acceptance rate of A4 below 0.2 means the strongest arm is at the floor and every cost-per-acceptance readout is unstable: INVALID-DESIGN" (SDX-8); "Censoring above 50% of chains in C2 or C4 at COMPLETE: the cap is too low for the primary: INVALID-DESIGN (a higher cap is a new registration). C4 fails S0 in more than 50% of its chains: C4 is at the floor, INVALID-DESIGN for its contrasts." (SDX-9)
- PROBLEM: These triggers fire on the treatment arm's own failure. If gate friction makes A4 or C4 fail, the result becomes INVALID instead of REFUTED or COSTLIER. The arm is called "strongest" before any data. SDX-8's collapse trigger ("in any arm above 50%") does the same. The SDX-9 censoring trigger also omits C3, an IUT comparator: C3 can be 90% censored, which makes C4 − C3 pass easily because censored C3 chains enter at the cap.
- FIX: Base floor triggers on arm-independent evidence: the reference implementation, A0S, and the maximum over all arms. If only A4/C4 is at the floor, assign the COSTLIER/REFUTED rows. Apply the censoring trigger symmetrically: "censoring above 50% in any arm entering a primary contrast (C2, C3, C4, C5 if run)". Add: "a trigger that fires only in the treatment arm is reported as an outcome, not as invalidity."
- CONFIDENCE: high

### F-07
- SEVERITY: BLOCKER
- TARGET: SDX-9
- CATEGORY: oracle-scorer
- DIRECTION: NEUTRAL-DEFECT
- FILE_AND_SECTION: SDX-9.md section 4.5 (Margins, item 1) and section 9 (X7)
- QUOTE: "Band: E at or below **(1 - q) + delta_e** (provisional delta_e = 0.05) is **within the spec's admitted incompleteness**"; "The band of 4.5 is not vacuous and not unreachable: some arm above and some below it, or the band is rescaled before freeze"
- PROBLEM: E pools held-out variants (share q of the suite) and uncovered behaviours (share 1−q). Agents pass many uncovered behaviours by default. Take q=0.7 and an agent passing 80% of uncovered behaviours: it may fail about 41% of variants of the visible criteria and stay "in band". Overfitting to visible criteria, which is what premature COMPLETE is meant to catch, goes undetected. X7 then tunes delta_e on unblinded pilot arm data so that "some arm" is above. The proponents can choose which arm that is, and they also declare q, which sets both the suite composition and the band.
- FIX: Use two bands, registered separately: variant failure rate ≤ delta_v (fixed from the reference implementation and the stage mutants, e.g. 0.05), and uncovered-behaviour failure rate reported with no band. Set delta_v from arm-free data only (reference implementation, mutants, stubs). Delete X7's "some arm above and some below". Have q declared by the independent reviewer, not the spec authors.
- CONFIDENCE: high

### F-08
- SEVERITY: BLOCKER
- TARGET: BOTH
- CATEGORY: construct-validity
- DIRECTION: UNINFORMATIVE
- FILE_AND_SECTION: SDX-8.md section 4.3; SDX-9.md section 3 (harness commit; A4-S9 delta (ii))
- QUOTE: "hooks may block commits but the scored state is the working tree" (SDX-8); "the gate blocks a commit that claims a stage while an OPEN item exists" (SDX-9)
- PROBLEM: The harness commits after each session, and the working tree is scored whether or not a commit was blocked. It is undefined whether the harness's own commit runs the arm's hooks, what happens if a hook blocks it, and whether agents commit at all. If agents leave committing to the harness, C4's gates never execute and C4 ≡ C3 by construction, so H9-1's IUT against C3 fails for a harness reason. The same applies to A5g against A5. "A commit that claims a stage" is undefined, because CLAIM lives in the final message, not in a commit.
- FIX: Register that the identical task prompt says "commit your work before ending the session". Snapshot commits by the harness go to a separate ref with --no-verify and never touch hooks. Log gate executions per session per arm as a manipulation check: if fewer than a registered share of A4/C4/A5g/C5 sessions execute a gate, "enforced" is withdrawn. Redefine the open-questions gate to block a commit while the ledger lists OPEN items and the commit message contains a CLAIM tag.
- CONFIDENCE: high

### F-09
- SEVERITY: MAJOR
- TARGET: BOTH
- CATEGORY: falsifiability
- DIRECTION: UNINFORMATIVE
- FILE_AND_SECTION: SDX-8.md section 10 header and rows; SDX-9.md section 10 rows; SDX-8.md section 2a (H8-1 row)
- QUOTE: "Rows are assigned by the pair (H8-1, H8-2) after the validity row is cleared." (SDX-8); "the modal outcome is CHEAPER-SMALL, CHEAPER-SIZE-UNRESOLVED or INCONCLUSIVE" (SDX-8 2a)
- PROBLEM: No row covers H8-1 INCONCLUSIVE, which is the authors' own modal outcome. Nor does any row cover H8-1 negative with H8-2 positive, or H8-1 EQUIVALENT with the class at 30 INCONCLUSIVE. SDX-9 has no row for H9-1 INCONCLUSIVE, because row (xi) requires EQUIVALENT or COSTLIER at every stage. Protocol section 6 mandates an INCONCLUSIVE row naming the n that would resolve it. The most probable result is therefore unassigned, and an unassigned result is free for interpretation.
- FIX: Add to both tables: "Primary INCONCLUSIVE (any comparator): INCONCLUSIVE; state the n that resolves it at the observed SD; permitted claim none; forbidden: 'trend toward', 'promising'." Add "H8-1 not positive, H8-2 positive: crossover without slower growth; claim the crossover only; forbidden: growth or durability claims." Add a completeness check that every (H8-1 class × H8-2 class) cell maps to exactly one row.
- CONFIDENCE: high

### F-10
- SEVERITY: MAJOR
- TARGET: BOTH
- CATEGORY: falsifiability
- DIRECTION: FAVORS-GS
- FILE_AND_SECTION: SDX-8.md sections 2.2 and 10; SDX-9.md sections 2.2 and 10; EXPERIMENT-PROTOCOL.md section 6
- QUOTE: "\"Positive\" means any CHEAPER class with the size class stated." (SDX-8 10); "CHEAPER-SMALL (U < 0 and L >= minus delta)" and "EQUIVALENT (whole interval inside minus delta to plus delta, TOST)" (SDX-8 2.2); "Controls pass, effect >= SESOI, interval excludes zero | `SUPPORTED` at the stated scope" (protocol)
- PROBLEM: CHEAPER-SMALL is an effect confidently below the SESOI. The drafts justify the SESOI as the smallest saving worth a heavy process, and the protocol would call such a result NULL (equivalence). Yet the drafts count it as "positive" and permit "setup and upkeep were repaid by change c*". The classes also overlap: an interval inside (−δ, 0) is both CHEAPER-SMALL and EQUIVALENT, and no precedence is registered, so the favourable label can be chosen.
- FIX: Make the classes mutually exclusive, with EQUIVALENT taking precedence over CHEAPER-SMALL. Define "positive" as CHEAPER-RELEVANT or CHEAPER-SIZE-UNRESOLVED. Map CHEAPER-SMALL to the row (iv)/(xi) wording: "a saving smaller than the registered minimum worth having."
- CONFIDENCE: high

### F-11
- SEVERITY: MAJOR
- TARGET: BOTH
- CATEGORY: power-stats
- DIRECTION: UNINFORMATIVE
- FILE_AND_SECTION: SDX-8.md section 2a (Power); SDX-9.md section 2a (Power)
- QUOTE: "SD of log g or log R(30): 0.15 gives 16, 0.20 gives 29, 0.25 gives 45, 0.30 gives 64" (SDX-8); "SD of the endpoint 0.15 gives 14, 0.20 gives 24, 0.25 gives 37, 0.30 gives 53" (SDX-9)
- PROBLEM: These SD ranges are implausibly low.
  - SDX-8: log g is a difference of two log-ratios with binomial denominators. With ΔV ~ Bin(10, 0.75), acceptance counts alone give SD ≈ √2 × 0.18 ≈ 0.26. Adding a per-window cost log-SD of 0.25 gives SD ≈ 0.44, so n ≈ 138 per arm.
  - SDX-9: censored chains entered at about ln 3 above completers produce a mixture SD near 0.44 at 20% censoring, so n ≈ 114.
  - The planned n=20 resolves gaps of about 30 to 40%, not 17 to 21%. Three pilot chains per arm (8 df) cannot pin the SD, so the escape route "raise delta" will be decided on noise.
- FIX: In both sections, replace the SD grid with a simulation from the registered estimands: binomial acceptance, the censoring mixture, the 0.5 rule (or F-02's replacement). Register "if simulated n at the pilot SD's upper 80% limit exceeds the budgeted n, the primary is downgraded to descriptive" before freeze. Raising delta after the pilot should be forbidden.
- CONFIDENCE: medium

### F-12
- SEVERITY: MAJOR
- TARGET: BOTH
- CATEGORY: informativeness
- DIRECTION: UNINFORMATIVE
- FILE_AND_SECTION: SDX-8.md section 2a (R_A4(30)/R_A5(30) and c* rows); SDX-9.md section 2a (COMPLETE and c* rows)
- QUOTE: "0.75 to 1.15, central 0.95" and "P(no crossover) about 0.4" (SDX-8 2a)
- PROBLEM: The priors give the probability of a true crossover, not of a registered one. At SDX-8's central 0.95 (|log| = 0.051), SD 0.2 and n=20, single-contrast power at 97.5% is about 0.08. SDX-9's central 0.90 at SD 0.25 gives about 0.26, and the IUT against two comparators gives less. By the authors' own numbers, "no crossover within the horizon" is reported with probability above 0.75. That result is consistent with every prior here, so the modal outcome changes no decision. The text's "P(none) about 0.4/0.35" will be read as the expected verdict rate.
- FIX: Add a registered line in each 2a: "Probability that the registered procedure reports a crossover, given the central prior and the planned n: [simulated value]." State in section 14 that if this value is below 0.5, the experiment is bought as an estimation study: report c*_fit and intervals, no verdict row for H8-2/H9-2, and require JC's signed acceptance of that.
- CONFIDENCE: high

### F-13
- SEVERITY: MAJOR
- TARGET: BOTH
- CATEGORY: crossover-test
- DIRECTION: FAVORS-GS
- FILE_AND_SECTION: SDX-8.md section 9 (W4, W5, W8); SDX-9.md sections 4.4 and 9 (X5, X7, X8)
- QUOTE: "B_k = the SDX-9-P median cost of the cheapest arm to reach verified stage k" (SDX-9 4.4); "amend changes or `p_acc` before freeze" (SDX-8 W5)
- PROBLEM: Both pilots run the treatment and the comparators unblinded, and report per-arm cost, acceptance, censoring and E. The cap, d_k, delta_e, p_acc, delta, the ballast and the change texts may then all be amended before freeze. That is post-hoc fixture tuning with arm outcomes in view, and the rule "no change may be chosen because of which arm it favors" cannot be audited. B_4 comes from the "cheapest arm", which may be C4, with n=3. C3 is not piloted at all, so its censoring under the chosen cap is unknown.
- FIX: Report pilot outcomes to decision-makers only as arm-pooled or arm-masked statistics (labels replaced by random letters, key held by the independent reviewer). Set B_k as the pooled median across arms. Pilot every arm in the primary contrasts, C3 included. Register an amendment ladder now (which parameter moves, in which order and by how much), conditional on pooled flags only.
- CONFIDENCE: high

### F-14
- SEVERITY: MAJOR
- TARGET: BOTH
- CATEGORY: falsifiability
- DIRECTION: UNINFORMATIVE
- FILE_AND_SECTION: SDX-9.md section 2b (PC1); SDX-8.md section 2b (growth-regime and A0S controls); EXPERIMENT-PROTOCOL.md section 3 (a)
- QUOTE: "C2 run at half the cap (n = 10): its median verified stage must be below that of C2 at the full cap" (SDX-9); "If the experiment cannot detect it at the planned n, any null is `INVALID-DESIGN`, not `NULL`." (protocol)
- PROBLEM: Neither draft has a positive control for the primary contrast, a known cost difference between arms. PC1 is almost guaranteed: halving the budget truncates the same process, so it tests monotonicity, not sensitivity. A0's growth and A0S's E1-SD gap are not cost contrasts. Rows (iv) and (xi) nevertheless permit equivalence-type conclusions ("neither paid nor cost 15% more"). The A/A trigger "noise exceeds the effect" is also misnamed: a significant A/A difference signals drift or order effects, not variance.
- FIX: Add a planted cost manipulation at n=10 in each draft. For example, A5 plus a fixed instruction to read every source file at session start (SDX-8; known cost growth with size), or C2 with a registered extra 30% of injected filler context (SDX-9). The pre-registered requirement: detect it as COSTLIER at the planned n, else rows (iv)/(xi) become INVALID-DESIGN. Rename the A/A trigger "systematic drift".
- CONFIDENCE: medium

### F-15
- SEVERITY: MAJOR
- TARGET: SDX-8
- CATEGORY: favors-GS
- DIRECTION: FAVORS-GS
- FILE_AND_SECTION: SDX-8.md section 2b, Growth-regime positive control
- QUOTE: "g(A0) at least 2.0 and repository size at change 30 at least 5 times size at CR0. Otherwise INVALID-DESIGN for H8-1 and H8-2"
- PROBLEM: H8-2, the net crossover, does not require growth. If cost does not grow at about 18 kLOC, the overhead cannot be repaid by growth, which is an informative adverse answer to the buyer's question. Invalidating H8-2 in that world shields the substrate from its most likely failure mode (the CodeSeeker/Gloaguen world the authors cite as evidence against). It also makes g(A0) a control computed with the F-01-biased estimand.
- FIX: Restrict the trigger to H8-1. For H8-2, add a row: "g(A0) < 2.0: no cost-growth regime at this size; H8-2 interpreted as 'net cost at ≤18 kLOC without growth'; permitted claim: 'on this fixture cost did not grow enough for the overhead to be repaid by growth'."
- CONFIDENCE: high

### F-16
- SEVERITY: MAJOR
- TARGET: BOTH
- CATEGORY: falsifiability
- DIRECTION: FAVORS-GS
- FILE_AND_SECTION: SDX-8.md section 10 row (x); SDX-9.md section 10 row (xiv)
- QUOTE: "ballast unrealistic or leaking, horizon too short for any arm's cost to move" (SDX-8); "completeness is gameable by arms that infer the probes" (SDX-9)
- PROBLEM: These are open-ended judgments with no registered test, so they can be invoked after unblinding. "Ballast unrealistic" and "horizon too short" can be asserted of any null. Combined with the guard-f validity audit, which runs whenever a result "contradicts field experience" (the proponents' experience), they form an asymmetric post-hoc exit available mainly for unfavourable results.
- FIX: Replace each with a mechanical, pre-specified criterion evaluated before unblinding. For example: "horizon too short = the pooled-arm cost per change at W3 below 1.2× W1"; "gameable = any arm's repository contains ≥ N probe-identical request bodies (script X)". Any defect not on the list cannot convert a verdict; it opens a linked experiment and the verdict stands.
- CONFIDENCE: high

### F-17
- SEVERITY: MAJOR
- TARGET: SDX-9
- CATEGORY: oracle-scorer
- DIRECTION: NEUTRAL-DEFECT
- FILE_AND_SECTION: SDX-9.md section 4.3, columns (b) and (c)
- QUOTE: "S0 gates plus the repository's own tests green"; "line and branch coverage above a floor registered from SDX-0"; "no unresolved gate waiver"; "the scorer's verdict never reads any file the arm wrote about itself"
- PROBLEM: The scorer reads arm-authored artifacts.
  - "Own tests green" rewards writing few tests, or deleting failing ones, which is legal and not counted as circumvention. That penalises C4, whose coverage gate forces a test per criterion.
  - The coverage floor rewards the same coverage gate, which favours C4. Both are targeted metrics inside the primary scorer, against guard (b).
  - "Gate waiver" is a GS ledger concept, so the scorer must read an arm file about itself, contradicting the last quoted sentence.
- FIX: Remove own-tests-green, the coverage floor and the waiver check from the scorer. Keep only sealed probes, the clean-clone build and start, type check, the open-field suite, the independent unit suite and the quickstart. Report own-test status and coverage as "targeted".
- CONFIDENCE: high

### F-18
- SEVERITY: MAJOR
- TARGET: BOTH
- CATEGORY: falsifiability
- DIRECTION: NEUTRAL-DEFECT
- FILE_AND_SECTION: SDX-9.md section 10 row (vi); SDX-8.md section 10 row (ix)
- QUOTE: "C4 beats C2 but not C3 (H9-e: structure suffices; enforcement not shown)" (SDX-9); "A4 beats A5 but not A5g (or the reverse of the ratio)" (SDX-8)
- PROBLEM: Row (vi) permits "persisted structure without blocking gates is enough" when C4 − C3 merely fails to be CHEAPER (possibly INCONCLUSIVE), and C3 − C2 is never tested. That is a positive claim for C3 drawn from absence of evidence, and it favours the substrate content. Row (ix) does the same for "a generic gate captures most of the effect" without testing A5g − A5.
- FIX: Row (vi) should require C3 − C2 CHEAPER and C4 − C3 EQUIVALENT (TOST). Row (ix) should require A5g − A5 CHEAPER and A4 − A5g EQUIVALENT. Otherwise assign "A4/C4 beats one comparator only; the mechanism is unresolved; no component claim".
- CONFIDENCE: high

### F-19
- SEVERITY: MAJOR
- TARGET: BOTH
- CATEGORY: falsifiability
- DIRECTION: FAVORS-GS
- FILE_AND_SECTION: SDX-8.md section 2b (A4-stale) and 2.3 (H8-4); SDX-9.md section 2b (C4-stale) and 2.3 (H9-d)
- QUOTE: "if A4-stale beats A5 in a CHEAPER class on log g or R(30) as strongly as A4 does (its gap at least 0.8 of A4's)"
- PROBLEM: The content story survives unless an n=10 control reaches a CHEAPER class and its gap is at least 0.8 of A4's. Both conditions have low power, so the refutation row rarely fires by construction. The ratios (gap ratio, SR) have no interval and are undefined or sign-flipping when denominators are small (SR is negative if A5g is worse than A5, which then "passes"). In the other direction, the stale arm cannot distinguish "content does not matter" from "the agent repairs stale content cheaply", which would handicap GS.
- FIX: Reverse the burden. The content claim requires A4 − A4-stale CHEAPER (n=20 each), otherwise "true content not shown". Replace SR with a direct contrast A4 − A5g and its class. Log the repaired share of stale entries per checkpoint; if more than half are repaired by change 10, label the stale control "self-repaired, uninformative".
- CONFIDENCE: medium

### F-20
- SEVERITY: MAJOR
- TARGET: BOTH
- CATEGORY: procedure
- DIRECTION: NEUTRAL-DEFECT
- FILE_AND_SECTION: SDX-9.md section 10 header; SDX-8.md section 10
- QUOTE: "Rows are assigned by H9-1 and H9-2 first, then H9-a and H9-b, after the validity row is cleared."
- PROBLEM: Several rows can hold at once, with conflicting permissions. SDX-8 (ii) permits "repaid by change c*" while (viii) forbids "the substrate pays off". SDX-9 (i) and (v), (viii) or (x) can co-occur. No precedence or combination rule is registered, so the reporter chooses which permitted claim survives.
- FIX: Register a precedence: validity, then the refutation/qualification rows ((vi), (vii), (viii), (x) and their SDX-9 counterparts), then the verdict rows. The permitted claim is the verdict row's claim with every applicable qualification appended verbatim, and any claim forbidden by any applicable row is forbidden.
- CONFIDENCE: high

### F-21
- SEVERITY: MAJOR
- TARGET: SDX-8
- CATEGORY: favors-GS
- DIRECTION: FAVORS-GS
- FILE_AND_SECTION: SDX-8.md section 3, Authors table, and section 4.2 skeleton
- QUOTE: "at least 8 of 20 written by an independent person who does not know the arm artifacts; all 20 read by the independent reviewer"
- PROBLEM: Up to 12 of 20 new change texts may be written by the GS side, who know the sentinel and ledger conventions. The skeleton itself is proponent-chosen and heavy in exactly what a sentinel map is claimed to help: four propagation changes "on every earlier surface", a reversal "at length" and a restructure. The reviewer's check ("names an implementation") does not catch wording tuned to a ledger's vocabulary or granularity.
- FIX: All 20 texts should be written by the independent author from the skeleton. Alternatively, write two independent versions per slot and assign one by registered coin flip. Have the independent reviewer rebalance the skeleton against a list of change types drawn from a public change-request taxonomy, with the GS side's skeleton marked as one input.
- CONFIDENCE: medium

### F-22
- SEVERITY: MAJOR
- TARGET: SDX-8
- CATEGORY: construct-validity
- DIRECTION: UNINFORMATIVE
- FILE_AND_SECTION: SDX-8.md section 2.1 (windows) and section 4.2 (skeleton)
- QUOTE: "(W1 = 1..10, W2 = 11..20, W3 = 21..30)"; "late independent feature matched in size to change 4"
- PROBLEM: W1 is SDX-1's chain, with no ballast and different authors. W3 holds two ballast merges, a spec change propagating into ballast, a latency budget and a long reversal. g therefore compares windows of different difficulty, not the same work at different sizes. The A0 control g ≥ 2 can be met by harder changes alone. A single position-control pair (change 30 vs change 4) cannot separate size from difficulty; this is not covered by the declared index/size confound, whose mitigation addresses only arm-neutrality.
- FIX: Add matched "twin" changes: for each of 4 W1 changes, a W3 change of registered equivalent specification on a different entity. Compute a twin-based growth ratio g_twin as a registered secondary, and report it beside g. Alternatively, randomise ballast tier per chain (see H-C).
- CONFIDENCE: medium

### F-23
- SEVERITY: MAJOR
- TARGET: SDX-8
- CATEGORY: handicaps-GS
- DIRECTION: HANDICAPS-GS
- FILE_AND_SECTION: SDX-8.md section 4.2, Ballast
- QUOTE: "that the harness merges in four tranches (T1 to T4) before the sessions of changes 11, 16, 21 and 26 as a neutral commit"
- PROBLEM: Several interactions are undefined. Does the harness's merge commit run A4's and A5g's hooks? What happens when ballast (with its own tests and no red-first history) trips A4's fixture ratchet, spec lock or red-first rules, given the substrate was built blind to ballast? Gate loops caused by harness-inserted code would be charged to A4 as upkeep. Ballast's own sealed probes are assigned to no change, so breaking ballast costs nothing in V for any arm, and durability of inherited code is unmeasured.
- FIX: Register that ballast commits bypass hooks, and that arm gates see ballast only when the agent touches it. Assign each ballast tranche's probes to its merge change (11, 16, 21, 26) under the F-01 fixed-lag rule. In SDX-8-P, report gate-failure loops attributable to ballast per arm (blinded, F-13).
- CONFIDENCE: medium

### F-24
- SEVERITY: MAJOR
- TARGET: SDX-9
- CATEGORY: oracle-scorer
- DIRECTION: FAVORS-GS
- FILE_AND_SECTION: SDX-9.md section 2.1, Claim and verdict; H9-a
- QUOTE: "**False-complete share** = (claims of stage k at a checkpoint whose verified stage is below k) / (all claims of a stage), per chain"
- PROBLEM: The share is gameable by abstention: an arm that rarely claims (CLAIM: NONE) has a tiny denominator. C4's open-questions gate is designed to suppress claims, so the readout is targeted by the treatment yet carries a refutation row (viii) and a condition of row (i). "Verified" is retrospective under stickiness, so a correct claim later invalidated by a regression counts as false. The harness nudge after three checkpoints "with no new passing probe" also leaks hidden-oracle progress to every agent.
- FIX: Replace the share with a per-checkpoint calibration score over all checkpoints, NONE included: mean of (claimed stage − scorer stage at that checkpoint, non-sticky), with over-claims and under-claims reported separately. Label it "targeted" for C3/C4. Trigger nudges on session count, not on probe results.
- CONFIDENCE: medium

### F-25
- SEVERITY: MAJOR
- TARGET: SDX-9
- CATEGORY: handicaps-GS
- DIRECTION: HANDICAPS-GS
- FILE_AND_SECTION: SDX-9.md section 10 row (vii)
- QUOTE: "or H9-b EQUIVALENT with premature chains present"
- PROBLEM: If every arm has a similar share of premature COMPLETE chains (equal quality) and C4 is cheaper, row (vii) declares the cost win "refuted at constant quality". Equal quality is the opposite of a quality confound. Premature chains are also already handled inside the primary (counted not complete), so quality is penalised twice.
- FIX: Delete the quoted clause. Row (vii) should apply only when C4's premature-COMPLETE share exceeds a comparator's by at least the 10-point SESOI, with the interval excluding zero.
- CONFIDENCE: high

### F-26
- SEVERITY: MINOR
- TARGET: SDX-8
- CATEGORY: favors-GS
- DIRECTION: FAVORS-GS
- FILE_AND_SECTION: SDX-8.md section 2.1, view V1
- QUOTE: "The reusable generic assets (A4's protocol, hooks and templates, A5's prompt, A5g's hook) are not dollars here and are reported in author hours."
- PROBLEM: The boundary between "project-specific" (charged in V1) and "generic" (free) is drawn by the proponents and not registered as a file list. Z_project is the "measured model spend" of an authoring process that may have been human-led, and can be made arbitrarily small. Unlike SDX-9, which regenerates the substrate mechanically, nothing ties Z_project to a reproducible generation run.
- FIX: Register at freeze the file-by-file classification of A4's initial substrate, with reasons reviewed by the independent reviewer. Define Z_project as the median dollar cost of regenerating the project-specific files from the base spec with a registered generator script and model, run 3 times.
- CONFIDENCE: medium

### F-27
- SEVERITY: MINOR
- TARGET: SDX-9
- CATEGORY: construct-validity
- DIRECTION: NEUTRAL-DEFECT
- FILE_AND_SECTION: SDX-9.md section 2.1, Stage reached and verified time
- QUOTE: "a stage that later regresses is re-opened and the cost between the first pass and the final stable pass is charged to that stage"
- PROBLEM: One flaky S1 probe failing in the confirmation session moves cost-to-S1 to almost the full chain cost. The early-stage steps of the fixed sequence (S0, S1) are thus contaminated by late events, and arms that refactor late (gate-driven C4) are penalised at early stages. The crossover stage then partly measures late stability, not early progress.
- FIX: Register cost-to-stage as the first pass followed by at least M=2 consecutive passes (non-terminal stickiness). Report late regressions separately as a regression count per stage.
- CONFIDENCE: medium

### F-28
- SEVERITY: MINOR
- TARGET: BOTH
- CATEGORY: crossover-test
- DIRECTION: NEUTRAL-DEFECT
- FILE_AND_SECTION: SDX-8.md sections 8 step 4 and 2.2; SDX-9.md section 2.2
- QUOTE: "D(k) = mean over chains of log R_A4(k) minus mean over chains of log R_comparator(k)" (SDX-8 8); "BCa bootstrap (10,000 replicates) and Monte Carlo permutation (100,000, seed registered), no stratification" (SDX-8 2.2)
- PROBLEM: "Comparator" is singular, so c*_fit can be reported against A5 only, the easier comparator, and that is the number most likely to be quoted. Two inference methods are registered for the same decision with no rule if they disagree; BCa is fragile with point masses (censoring at the cap, the 0.5 convention).
- FIX: Define c*_fit as the later of the two fits (A5 and A5g; C2 and C3), with both reported. Register one decisive method: the permutation test for the class decision, with BCa as the reported interval. If they disagree on the class, report the less favourable class.
- CONFIDENCE: high

### F-29
- SEVERITY: MINOR
- TARGET: SDX-8
- CATEGORY: falsifiability
- DIRECTION: FAVORS-GS
- FILE_AND_SECTION: SDX-8.md section 10 row (vi); section 2.1 (p_acc)
- QUOTE: "regression flips, rework share, read share, follow-on cost, erosion tool all at or above the comparators"
- PROBLEM: The mechanism story is refuted only if all five mediators are unmoved, so any one moving by chance saves it. Separately, with 8 to 10 probes per change and p_acc = 0.90, acceptance requires 100% for changes with 8 or 9 probes. Change 18 introduces no fresh probes, so criterion (1) is 0/0.
- FIX: Pre-designate two primary mediators (regression-flip rate, read-token share). Row (vi) fires if neither is in a CHEAPER/lower class. Express p_acc as "at most one fresh probe failing". Define acceptance for no-new-behaviour changes as carried probes only.
- CONFIDENCE: medium

### F-30
- SEVERITY: MINOR
- TARGET: BOTH
- CATEGORY: sharing
- DIRECTION: NEUTRAL-DEFECT
- FILE_AND_SECTION: SDX-9.md sections 4.3 (S3) and 13; SDX-8.md section 6
- QUOTE: "S4 repositories of SDX-9 may seed SDX-8 chains only if declared, and then count once" (SDX-9 13); "the sealed open-field suite (shared with SDX-5 Part B)" (SDX-9 4.3)
- PROBLEM: The same open-field suite is three things at once: a stage gate in SDX-9 (with an extension package E writing its classes into spec criteria), a held-out escape check in SDX-8, and SDX-5's target. One defect in it moves all three results in the same direction. SDX-8 lacks SDX-9's "never cited as support for one another" sentence. Seeding SDX-8 from arm-specific SDX-9 repositories would make SDX-8's CR0 arm-dependent, contradicting SDX-8's CR0 design.
- FIX: Add to SDX-8 section 10 the SDX-9 sentence on non-mutual support, extended to SDX-5. Delete the seeding option from SDX-9 section 13 and open item 5; seeding would be a new registration. Declare the suite a single shared instrument in a cross-registration table with one defect log.
- CONFIDENCE: medium

## 3. Mandatory sections

### 3a. Ways the designs favour GS by construction
- SDX-9 scorer column (d) requires asking about hidden ambiguities (F-04).
- The scorer coverage floor rewards C4's coverage gate (F-17).
- Floor and censoring INVALID triggers fire on A4/C4 failure, and SDX-9 omits C3 from the censoring trigger (F-06).
- g(A0) < 2 invalidates H8-2, which needs no growth (F-15).
- CHEAPER-SMALL is counted "positive" despite the SESOI, with no precedence over EQUIVALENT (F-10).
- Open-ended post-hoc INVALID rows (F-16).
- The stale and sufficiency controls default to the GS story (F-19).
- Row (vi) credits structure from an absent C4 − C3 effect (F-18).
- Up to 12 of 20 change texts are GS-authored over a proponent skeleton (F-21).
- The Z_project boundary is proponent-drawn (F-26).
- False-complete share is gameable by abstention, and C4's gate suppresses claims (F-24).
- Unblinded pilot tuning of cap, band, p_acc and ballast (F-13).
- The mediator row needs all five mediators to fail (F-29).
- Tried and found not to be problems: the arm text parity rules (inherited, could not check), the identical task prompt and CLAIM protocol, the mechanical ledger generation from the spec (no information beyond the spec), the price-table pinning, and the different-vendor judges (no primary judged readout).

### 3b. Ways the designs handicap GS, or are rigged against it
- The final-snapshot look-ahead lowers g for eroding comparators (F-01).
- Harness ballast insertion can trip A4's gates and charge the loops to A4 (F-23).
- An undefined commit path can make C4 ≡ C3 and A5g ≡ A5 (F-08).
- "Own tests green" in the scorer rewards writing few tests (F-17).
- Row (vii) refutes a cost win at equal quality (F-25).
- Late regressions are charged to early stages, hitting late-refactoring gated arms (F-27).
- The stale control conflates self-repair with irrelevance (F-19).
- The differential cap-hit trigger invalidates a large completion advantage (F-05).
- Declared items not re-raised: one mid-tier model, about 18 kLOC, the fixed-sequence penalty for early crossover, V3 authoring charges.

### 3c. Ways the designs are unfalsifiable, cannot inform, or have a modal outcome that changes no decision
- The authors' modal outcome (INCONCLUSIVE) has no row in either table (F-09).
- At the authors' central priors, the probability of a registered crossover is about 0.08 (SDX-8) and about 0.26 before the IUT (SDX-9), so "no crossover" is expected under every prior and changes no decision (F-12).
- The SDs are likely about 0.44, which puts the needed n above 100 (F-11).
- No positive control for a cost difference exists, so equivalence rows are unsupported (F-14).
- Rows conflict without precedence (F-20).
- The differential cap-hit trigger makes large effects in either direction uninterpretable (F-05).
- The escape band cannot detect overfit to visible criteria (F-07).

## 4. Better hypotheses (at most three)

### H-A
- STATEMENT: In SDX-8, the slope of log per-change cost (each change's own cost, fixed-lag acceptance) on log repository size is lower under A4 than under A5, with A5g a secondary contrast.
- WHY MORE INFORMATIVE: It uses all 30 changes per chain instead of two window ratios with integer denominators. A mixed model with random chain slopes cuts the endpoint SD substantially, removes the 0.5 convention and the exposure bias of F-01, and estimates the growth effect itself rather than its sign.
- WHAT IT NEEDS (arms, n, readout): A0, A5, A4 at n=25, A5g at n=15, A5b at n=10; readout is the arm × log-size interaction on log cost per accepted change, with acceptance at lag 3 and collapse handled by rank. Budget is similar to Core because A0S and A4-stale move to a later study.

### H-B
- STATEMENT: In SDX-9, analysed as a 2×2 factorial, content (spec-derived ledger and sentinel present or absent) and enforcement (blocking must-pass gate present or absent) each reduce cost to COMPLETE, and their interaction is positive.
- WHY MORE INFORMATIVE: C2, C3, C5 and C4 already form the four cells. Main effects use all 80 chains instead of IUT pairs, which roughly doubles power for "what part matters". Rows (v), (vi) and (ix) then become estimable effects rather than absence-of-evidence statements.
- WHAT IT NEEDS (arms, n, readout): C2, C3, C5, C4 at n=20 each, with C5 moved into Core and C1 dropped to n=10. Readout is a two-way model on log cost to COMPLETE with F-03 censoring, plus completion rate as a co-primary.

### H-C
- STATEMENT: With the number of changes held fixed and ballast tier (S, M, L from SDX-4) randomised per chain, the A4 − A5 cost difference per accepted change decreases with repository size.
- WHY MORE INFORMATIVE: It separates size from index and from change difficulty (F-22), which is the actual claim "pays as the repository grows". It also shares the ballast corpus already budgeted.
- WHAT IT NEEDS (arms, n, readout): A5 and A4, 15 chains per arm per tier (90 chains), 15 changes each with ballast merged at CR0. Readout is the arm × tier interaction on log cost per fixed-lag accepted change.

## 5. Convince-me statements
- WHAT RESULT WOULD CONVINCE ME THE SUBSTRATE PAYS ITS OVERHEAD: A CHEAPER-RELEVANT or CHEAPER-SIZE-UNRESOLVED class for A4 against both A5 and A5g on R(30), in view V1. This must hold with a registered cost positive control detected, A4 − A4-stale also CHEAPER, robustness with and without collapsed chains, a fixed-lag acceptance estimand, and gate executions confirmed in most A4 sessions. For SDX-9, the same on cost to COMPLETE, with completion rate not lower and variant-escape rate not higher.
- WHAT RESULT WOULD CONVINCE ME IT DOES NOT: Under the same validity conditions, A4/C4 EQUIVALENT (TOST, exclusive of CHEAPER-SMALL) or COSTLIER against A5 or C2 at checkpoint 30 or at COMPLETE. This must hold with the cost positive control detected and with no INVALID trigger that fires only in the treatment arm.
- WHAT THE DESIGNS AS WRITTEN WOULD NEED, SO THAT BOTH ARE POSSIBLE: Five changes are needed. First, triggers keyed to treatment-arm failure and differential cap-hit must stop being INVALID, so adverse results stay adverse (F-05, F-06, F-15, F-16). Second, the estimands need the SDX-8 exposure bias and collapse leverage removed (F-01, F-02), and the SDX-9 primary needs a defined censoring value with no behaviour gates in the scorer (F-03, F-04, F-17). Third, both designs need a planted cost positive control at the planned n (F-14). Fourth, the classes must be mutually exclusive, with rows for INCONCLUSIVE and a precedence rule (F-09, F-10, F-20). Fifth, sample sizes must come from simulated SDs of the registered estimands, so that a favourable or unfavourable registered verdict has a real probability of occurring (F-11, F-12).

## 6. What I could not assess, and what I checked and found sound
Could not assess:
- the inherited SDX-1 oracle rules (status-class tolerance, paired probes, mechanical SD rule)
- byte identity of A0, A5, A4 and A3
- the A5 prompt's strength
- the SDX-0 harness
- the SDX-5 open-field suite content
- the B11 judge-validity procedure
- whether the dissection note's H-NET designs match these drafts

No hashes were computed.

Checked and found sound:
- The SDX-8 n formula (3.08 for 97.5% two-sided at 80% power) and its arithmetic (16, 29, 45, 64; 0.97 SD at n=20).
- The SDX-9 equivalents (2.80; 14, 24, 37, 53).
- The fixed-sequence procedure's familywise validity, given a fixed order and the "crossed and stayed crossed" reading.
- Intersection-union testing over the comparators without correction.
- The pinned price table and the currency-dependence rule preventing a post-hoc switch of currency or view.
