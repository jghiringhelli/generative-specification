# SDX-8 and SDX-9 critique: anthropic claude opus (headless)

## 0. Header
- VENDOR: anthropic
- MODEL_ID_AS_SHOWN: claude opus (headless)
- HARNESS: claude-cli-stateless-no-tools
- ROUND: not stated in the assignment
- DATE_UTC: 2026-10-03
- REPO_HEAD: not available
- BRANCH: experiment-protocol-2026-10-02
- FILES_READ:
  - docs/experiments/prereg/SDX-8.md  sha256=not computed
  - docs/experiments/prereg/SDX-9.md  sha256=not computed
  - docs/experiments/EXPERIMENT-PROTOCOL.md  sha256=not computed
- FILES_NOT_READ_ATTESTATION: The three files were supplied inline between markers. I read no other file, used no tool, and ran no git or hash commands. I have not seen SDX-1, SDX-1-ARMS, SDX-0, the review record, the P4/P6 skeletons or the dissection note.
- PRIOR_EXPOSURE: none
- NOTES: The SDX-1 rules these drafts inherit by reference (retry rule, M1/M2, parity, SD rule, A5 text) cannot be checked here, so any finding that depends on them is marked low or medium confidence.

## 1. Verdict in at most five sentences
I would register neither design as written.

SDX-8's single worst defect is that its co-primary growth ratio g is computed with final-snapshot durability. Late erosion therefore inflates the first-window denominator, and g penalises exactly the arm that erodes less. This is a construct inversion against the method's claimed mechanism.

SDX-9's single worst defect is that its stage scorer requires behaviours the treatment arm is engineered to produce and the comparators are never told about: the planted ambiguities must be asked, and an own-test coverage floor sits behind hidden thresholds. Cost-to-COMPLETE is then partly a measure of the treatment's instructions.

Both drafts also have three shared problems:
- Their cost classes overlap (CHEAPER-SMALL is a subset of EQUIVALENT).
- Their decision tables have no row for the modal INCONCLUSIVE outcome.
- Their INVALID-DESIGN triggers are asymmetric: they relabel substrate failure and comparator efficiency as "invalid" instead of as evidence against the method.

## 2. Findings (ranked: all BLOCKER first, then MAJOR, MINOR, NIT)

### F-01
- SEVERITY: BLOCKER
- TARGET: SDX-8
- CATEGORY: construct-validity
- DIRECTION: HANDICAPS-GS
- FILE_AND_SECTION: SDX-8.md §2.1 (durably accepted change; growth ratio)
- QUOTE: "(2) at the snapshot after change min(k+3, 30) and at the final snapshot at least `p_acc` of that change's probes that are still live" … "g_i = m_i(W3) / m_i(W1)"
- PROBLEM: Acceptance of a W1 change is tested against the final snapshot, so it is exposed to about 20 later changes, all four ballast tranches, the change-18 restructure and the held-out suite. A W3 change is exposed to at most 9 later changes, and changes 28–30 to almost none. Erosion therefore cancels mostly W1 acceptances. That shrinks the W1 denominator, inflates m(W1) and *lowers* g. An eroding comparator looks as if its marginal cost grew slowly. An arm that prevents erosion (the substrate's claimed mechanism) is charged a relatively higher g. H8-1 is biased against the method whatever the data say. R(k) at early checkpoints also uses future information, so "crossover at change 15" is not a statement about cost at change 15.
- FIX: For m and g, evaluate acceptance with an identical fixed look-ahead for every change: fresh pass at k and survival at k+3. Define W3 as changes 20–27 so every change has a full look-ahead. Keep final-snapshot durability only in R and in a separate "late cancellation" readout. Register this before freeze.
- CONFIDENCE: high

### F-02
- SEVERITY: BLOCKER
- TARGET: BOTH
- CATEGORY: crossover-test
- DIRECTION: NEUTRAL-DEFECT
- FILE_AND_SECTION: SDX-8.md §2.2 (inherited verbatim by SDX-9 §2.2)
- QUOTE: "CHEAPER-SMALL (U < 0 and L >= minus delta)" … "EQUIVALENT (whole interval inside minus delta to plus delta, TOST)"
- PROBLEM: Any interval with L ≥ −δ and U < 0 lies inside (−δ, +δ), so every CHEAPER-SMALL result is also EQUIVALENT (CHEAPER-SMALL is a subset of EQUIVALENT). The two classes are not mutually exclusive and no precedence is stated. For H8-1 the same data satisfy the prediction ("CHEAPER (any size)") and the falsifier ("EQUIVALENT"). For SDX-8 the same data map to row (i)/(ii) or row (iv). The authors can choose the row after seeing data. The same holds for COSTLIER with U < δ against EQUIVALENT.
- FIX: Make the classes a partition with explicit precedence. One option: "EQUIVALENT applies only if the interval also contains 0; an interval inside (−δ, 0) is CHEAPER-SMALL and is mapped to the EQUIVALENT-family row for any claim about practical relevance." State the mapping of every class to exactly one decision row.
- CONFIDENCE: high

### F-03
- SEVERITY: BLOCKER
- TARGET: BOTH
- CATEGORY: falsifiability
- DIRECTION: UNINFORMATIVE
- FILE_AND_SECTION: SDX-8.md §10; SDX-9.md §10
- QUOTE: "Rows are assigned by the pair (H8-1, H8-2) after the validity row is cleared." / "(iv) | H8-1 EQUIVALENT and H8-2 no crossover (class at 30 EQUIVALENT)" / SDX-9 "(xi) | H9-1 EQUIVALENT or COSTLIER, no crossover at any stage (step 1 fails and every class is EQUIVALENT or COSTLIER)"
- PROBLEM: Both drafts call INCONCLUSIVE the modal outcome (§2a), yet neither table has an INCONCLUSIVE row, which the protocol §6 requires ("state the n that would resolve it"). The following combinations are also unmapped:
  - SDX-8: H8-1 INCONCLUSIVE or EQUIVALENT with H8-2 crossing; COSTLIER-SMALL; H8-1 INCONCLUSIVE with no crossover.
  - SDX-9: rows (i)/(ii) require "H9-a positive", and §2a gives H9-a about 40% power, so H9-1 positive with H9-a INCONCLUSIVE has no row.
  - Precedence between verdict rows and qualifier rows (vi), (vii), (viii) is unstated.

  The most probable result therefore produces no registered conclusion.
- FIX: Add a complete grid in each draft: every class of the primary crossed with every outcome of the crossover maps to exactly one row. Include an INCONCLUSIVE row with the claim "none; required n = …" and the forbidden conclusions "either direction" and "trend". Declare qualifier rows as modifiers applied after the verdict row, in a stated order.
- CONFIDENCE: high

### F-04
- SEVERITY: BLOCKER
- TARGET: SDX-9
- CATEGORY: favors-GS
- DIRECTION: FAVORS-GS
- FILE_AND_SECTION: SDX-9.md §4.3 column (d); §4.2; §3 A4-S9 delta; §12
- QUOTE: "every ambiguity touching S1 asked and answered"
- PROBLEM: A stage cannot verify unless the arm *asks* about each planted ambiguity. Asking is a behaviour, not a behavioural outcome of the software. C4 carries an open-questions gate, a triage rule and a sentinel that plausibly instruct asking. C1 and C2 get only the line protocol. An arm that resolves an ambiguity sensibly but never asks can never pass S1 and is censored at the cap. §12 also concedes that "a strategy of asking about every section is legitimate behaviour and not penalized". The primary endpoint thus rewards a targeted behaviour, against protocol guard (b). Dropping "or recorded" from P6 does not cure this, because asking is still required.
- FIX: Remove column (d) from stage verification. Deliver every scripted answer to all arms in the prompt of a fixed registered session (for example session 2), or score ambiguities only through probes that accept any resolution consistent with the spec text. Report asking as an exploratory metric only.
- CONFIDENCE: high

### F-05
- SEVERITY: BLOCKER
- TARGET: SDX-9
- CATEGORY: oracle-scorer
- DIRECTION: FAVORS-GS
- FILE_AND_SECTION: SDX-9.md §4.3 S1 and S3 rows; §3 task prompt
- QUOTE: "line and branch coverage above a floor registered from SDX-0; an independent unit suite (SDX-5 D2b) passes" … "the public stage definitions of section 4.1, never thresholds, probes or tags"
- PROBLEM: The S3 scorer requires the arm's *own* tests to reach a coverage floor, and S1 requires "the repository's own tests green". C4's red-first rule and criteria-coverage gate are designed to drive exactly these. C1 and C2 are never told the threshold. The scorer therefore embeds a metric the treatment targets, contradicting §6 ("targeted metrics … carry no verdict"). An arm that writes no tests passes "own tests green" vacuously at S1 but fails S3 for reasons unrelated to the behaviour of the software.
- FIX: Remove own-test coverage and own-test status from scorer checks. Verify every stage only with sealed black-box probes, the independent unit suite and the clean-clone build. If coverage must stay, state the exact floor in the identical task prompt for all arms and label S3 "targeted".
- CONFIDENCE: high

### F-06
- SEVERITY: BLOCKER
- TARGET: BOTH
- CATEGORY: favors-GS
- DIRECTION: FAVORS-GS
- FILE_AND_SECTION: SDX-8.md §2b floor/ceiling and triggers; SDX-9.md §2b floor/ceiling and triggers
- QUOTE: "acceptance rate of A4 below 0.2 means the strongest arm is at the floor and every cost-per-acceptance readout is unstable: INVALID-DESIGN" / "Collapse rate … in any arm above 50% is INVALID-DESIGN for that arm's contrasts" / SDX-9 "C4 fails S0 in more than 50% of its chains: C4 is at the floor, INVALID-DESIGN for its contrasts."
- PROBLEM: These triggers assume A4/C4 is "the strongest arm". If the substrate's gates, upkeep or headless friction make the agent collapse, never get accepted, or hit caps (the "differential cap-hit above 10 points" trigger), the outcome is labelled INVALID ("not cited either way") instead of REFUTED (row xiii, "slows delivery"). Applying the protocol's own test, "which true world does this label invalid", the answer is: the world where the method breaks the agent. Each trigger shields the method from its worst plausible outcome.
- FIX: Apply floor triggers only to the floor and comparator arms (A0, A5, C1, C2). When A4/C4 alone is at the floor, collapses, or causes a differential cap-hit while the comparators are healthy, route the result to row (xiii) or (iv-b) "substrate fails on this construct", reported with ITT.
- CONFIDENCE: high

### F-07
- SEVERITY: BLOCKER
- TARGET: BOTH
- CATEGORY: falsifiability
- DIRECTION: FAVORS-GS
- FILE_AND_SECTION: SDX-8.md §2b growth control; SDX-9.md §2b PC1 and §4.4 cap
- QUOTE: "Otherwise INVALID-DESIGN for H8-1 and H8-2 (nothing grows; the question "does overhead pay as it grows" cannot be asked). Not a defect of the method." / "C2 run at half the cap (n = 10): its median verified stage must be below that of C2 at the full cap" / "3 times B_4, whichever first, B_k = the SDX-9-P median cost of the cheapest arm"
- PROBLEM:
  - SDX-8: if a mid-tier agent's cost does not grow with size, the premise that overhead is repaid by growth is false on this fixture. That is substantive evidence against the selling argument, yet it is labelled invalid and uncitable.
  - SDX-9: the half cap equals 1.5 × B_4. If C2 is the cheapest or near-cheapest arm, most C2-half chains still reach S4, the medians tie, PC1 fails, and the design is INVALID. The positive control fails precisely when the expert prompt is efficient.
- FIX:
  - SDX-8: add a citable row: "no growth regime: on this fixture to about 18 kLOC, marginal cost per accepted change does not rise for A0/A5; the growth premise is not supported here."
  - SDX-9: set PC1's reduced cap at 0.5 × the pooled S2 median, or replace it with a planted-degraded arm whose stage deficit is known.
- CONFIDENCE: high

### F-08
- SEVERITY: MAJOR
- TARGET: BOTH
- CATEGORY: crossover-test
- DIRECTION: FAVORS-GS
- FILE_AND_SECTION: SDX-8.md §10 preamble and §8 step 3; SDX-9.md §8 step 2
- QUOTE: "\"Positive\" means any CHEAPER class with the size class stated."
- PROBLEM: CHEAPER-SMALL (the interval excludes any saving as large as the SESOI) counts as positive and unlocks rows (i)/(ii) and the claim "repaid by change [c*]". Each fixed-sequence step passes on "upper limit below zero" alone. A 2% saving, shown to be below the registered smallest effect worth having, therefore licenses the headline claim. This contradicts protocol §6 ("SUPPORTED: effect >= SESOI, interval excludes zero") and the drafts' own reasoning that "a smaller saving is probably not worth a heavy process".
- FIX: Permit the "repaid" and "cheaper" claims only for CHEAPER-RELEVANT, with CHEAPER-SIZE-UNRESOLVED worded as "direction established, size unresolved". Map CHEAPER-SMALL to a row with the claim "cheaper by less than 15%; below the registered threshold of relevance", and forbid "pays off".
- CONFIDENCE: high

### F-09
- SEVERITY: MAJOR
- TARGET: BOTH
- CATEGORY: procedure
- DIRECTION: FAVORS-GS
- FILE_AND_SECTION: SDX-9.md §9 X7; SDX-8.md §9 W5, W8; §14
- QUOTE: "The band of 4.5 is not vacuous and not unreachable: some arm above and some below it, or the band is rescaled before freeze" / "amend changes or `p_acc` before freeze"
- PROBLEM: The pilots run A4/C4 next to the comparators with arm-level outcomes visible to the proponents. delta_e, p_acc, d_k, delta, the cap and the change texts are then tuned on arm-level results: X7 is literally defined on which arm falls on which side of the band. With 3 chains per arm, a proponent can set thresholds that sit where the observed arms separate. "No change may be chosen because of which arm it favors" is not enforceable once arm-level data are seen.
- FIX: Have pilot outputs that fix parameters computed by a script that prints only pooled, arm-blind quantities (pooled E distribution, pooled acceptance, pooled SD). Seal arm-level pilot results until after the main analysis. Rewrite X7 as "pooled E has non-zero mass on both sides of the band".
- CONFIDENCE: high

### F-10
- SEVERITY: MAJOR
- TARGET: BOTH
- CATEGORY: favors-GS
- DIRECTION: FAVORS-GS
- FILE_AND_SECTION: SDX-8.md §2.1 V1; SDX-9.md §3 A4-S9 delta
- QUOTE: "the measured model spend of producing the project-specific bootstrap content of each arm (for A4, the base-spec-derived specs of its initial substrate; for the others zero)" / "the generation cost is counted at S0 (script run time is negligible in dollars; author hours are reported)"
- PROBLEM:
  - SDX-8: the A4 initial substrate is written by the GS side with human curation. V1 charges only "model spend", so the human project-specific work is invisible in the verdict view, and how a past, partly human process gets a "measured" dollar figure is undefined. Authors can choose a low Z.
  - SDX-9: the ledger generator and two gates are built by someone who "has seen the spec package". That spec-specific engineering is charged nothing in V1.
- FIX: Define Z_project as the spend of a registered, reproducible agent run that regenerates the project-specific substrate from the base spec, executed by the harness at freeze. Separately, charge project-specific human hours (not generic assets) at the registered rate in V1, for all arms symmetrically.
- CONFIDENCE: medium

### F-11
- SEVERITY: MAJOR
- TARGET: SDX-8
- CATEGORY: favors-GS
- DIRECTION: FAVORS-GS
- FILE_AND_SECTION: SDX-8.md §3 authors table; §4.2 skeleton
- QUOTE: "at least 8 of 20 written by an independent person who does not know the arm artifacts" / "texts are written by the independent author under this generation rule: roughly 12 state-independent features and cross-cutting requests, 3 spec changes, 2 decision points, 1 reversal, 2 position controls"
- PROBLEM: Up to 12 of the 20 new change texts may be written by people who know the substrate. The skeleton itself was designed by the proponents and is loaded with events the substrate claims to handle best: spec changes propagating over about 13 endpoints, decision recall, reversal "naming no targets", restructure. Blinding the substrate builder to the texts does not help when the text authors can see the substrate. The cost contrast is then about a chain shaped to the method's strengths.
- FIX: Have all 20 texts written by independent authors blind to the arm artifacts. Derive the event mix from an external source (for example sampled from real repository histories, or a published change taxonomy) with a registered sampling seed. Have a different-vendor judge rate each text for "suits a persisted spec ledger" before freeze.
- CONFIDENCE: medium

### F-12
- SEVERITY: MAJOR
- TARGET: SDX-9
- CATEGORY: favors-GS
- DIRECTION: FAVORS-GS
- FILE_AND_SECTION: SDX-9.md §12 versus §3 authors table; §4.1
- QUOTE: "the spec package is written by us; the reviewer is independent" … "the spec's criterion style may suit a ledger"
- PROBLEM: The authors table says the spec authors "are not builders and do not design gates", while §12 says the spec is written by us. These contradict. In either case the fixture's format (numbered acceptance criteria) is the exact input from which C4's ledger and coverage gate are mechanically generated. "Same information content" is true, but the fixture was chosen in the form the treatment consumes natively. The result cannot generalise to the specs buyers actually have.
- FIX: Resolve the contradiction by naming spec authors outside the GS team. Add a second registered fixture form (the same requirements as narrative prose without ids, from which C4 must build its own ledger, with that cost charged), or declare in every claim row: "on a spec already in numbered-criteria form".
- CONFIDENCE: high

### F-13
- SEVERITY: MAJOR
- TARGET: BOTH
- CATEGORY: favors-GS
- DIRECTION: FAVORS-GS
- FILE_AND_SECTION: SDX-8.md §3 "A5 at length"; SDX-9.md §3 "C2 and the build-task shape"
- QUOTE: "If they want a size-specific variant, that is arm A5-L, a separate arm with the same firewall and the same constraint, not a silent edit of A5."
- PROBLEM: A5 was written for ten-change extension. It is reused for a 30-change chain with ballast, and for building from a spec, on the strength of a yes/no attestation. If the practitioner writes A5-L or C2-B, it sits outside the intersection-union test, so the possibly weaker A5 remains the rival. Meanwhile A4 keeps a substrate built for its task family. The M2 strength check is inherited from SDX-1, not re-run at length or for builds.
- FIX: Re-run M2 on the new task shapes. If the practitioner supplies A5-L or C2-B, make it the registered comparator inside the IUT, replacing A5/C2. Otherwise, add a row qualifier: "rival prompt not adapted to task shape".
- CONFIDENCE: medium

### F-14
- SEVERITY: MAJOR
- TARGET: BOTH
- CATEGORY: falsifiability
- DIRECTION: FAVORS-GS
- FILE_AND_SECTION: SDX-8.md §2b A4-stale and row (vii); SDX-9.md §2b C4-stale and row (x)
- QUOTE: "if A4-stale beats A5 in a CHEAPER class on log g or R(30) as strongly as A4 does (its gap at least 0.8 of A4's)"
- PROBLEM: The content story is refuted only if A4-stale, at n = 10, reaches a CHEAPER class (power far below the main arms' already-marginal power) *and* a noisy point ratio is at least 0.8. This row is nearly unreachable, so "true project state is what pays" is effectively unfalsifiable. Mechanical scrambling with "identical file sizes" may also be easy for the agent to detect and ignore, which makes A4-stale an implausibly weak placebo.
- FIX: Test A4 against A4-stale directly, at the main-arm n, with the classes of §2.2. Permit the content claim only if A4 is CHEAPER than A4-stale. Otherwise state "content effect not shown". Generate stale entries with a different-vendor model as plausible-but-wrong content, not shuffles.
- CONFIDENCE: high

### F-15
- SEVERITY: MAJOR
- TARGET: SDX-8
- CATEGORY: falsifiability
- DIRECTION: FAVORS-GS
- FILE_AND_SECTION: SDX-8.md §10 row (vi)
- QUOTE: "regression flips, rework share, read share, follow-on cost, erosion tool all at or above the comparators"
- PROBLEM: The mechanism is refuted only if *all five* mediators fail to move against *both* comparators. With five noisy secondary measures, at least one will almost always point the right way by chance, so the mechanism claim survives in nearly every world. That gives the proponents a free mechanism claim.
- FIX: Register one primary mediator now (regression-flip rate on carried probes is the closest to the claimed mechanism) with its own class. Write row (vi) as "primary mediator not CHEAPER/lower: mechanism claim withdrawn". Report the others as exploratory.
- CONFIDENCE: high

### F-16
- SEVERITY: MAJOR
- TARGET: SDX-8
- CATEGORY: handicaps-GS
- DIRECTION: HANDICAPS-GS
- FILE_AND_SECTION: SDX-8.md §3 authors table; §4.2 ballast
- QUOTE: "A4 initial substrate | GS side, blind to change texts 1 to 30 and to the ballast" / "the harness merges in four tranches (T1 to T4) before the sessions of changes 11, 16, 21 and 26 as a neutral commit"
- PROBLEM: About 8 kLOC of code arrive that A4's sentinel, specs, spec lock and criteria ratchet do not cover. A4 must either pay upkeep to absorb each tranche (charged) or work with routing that is now partially false. A4's hooks may also block the next commit, since ballast has no spec entries or lock entries. The comparators carry no state that ballast can invalidate. The substrate is also frozen to SDX-1 bytes built for 3 kLOC, while A5 has a size-variant option (F-13). Part of any A4 penalty is an artifact of injection, not of growth.
- FIX: Measure and report per arm the cost of the change immediately after each tranche. Register a sensitivity excluding changes 11, 16, 21 and 26. Verify in the pilot that A4's gates do not fail purely because of ballast insertion. Alternatively, allow a registered, arm-neutral "integration note" in the change text for all arms.
- CONFIDENCE: medium

### F-17
- SEVERITY: MAJOR
- TARGET: SDX-9
- CATEGORY: oracle-scorer
- DIRECTION: NEUTRAL-DEFECT
- FILE_AND_SECTION: SDX-9.md §2.1 COMPLETE; §4.5 item 1
- QUOTE: "A chain that verifies S4 but exceeds the upper band is a **premature COMPLETE** and counts as not complete." / "an agent that gets every variant right and misses all uncovered behaviour has E = 1 - q"
- PROBLEM:
  - The band only bites on failures of *variants of covered criteria* beyond about 5% of the suite, and only when the uncovered part also fails. An arm with good defaults on uncovered behaviour may fail many criterion variants and stay "in band". The band therefore does not measure "within admitted incompleteness".
  - Held-out variants of criteria are what a test-per-criterion gate targets.
  - The cost assigned to a premature-COMPLETE chain is unspecified (actual cost or cap cost?). The chain has already ended, so it cannot repair, and the imputation can swing the primary endpoint.
- FIX: Score the two held-out components separately: a variant-failure rate with its own band, and an uncovered-behaviour rate reported descriptively. Register that a premature-COMPLETE chain enters the primary endpoint at the cap cost, and add a sensitivity at its actual cost.
- CONFIDENCE: medium

### F-18
- SEVERITY: MAJOR
- TARGET: SDX-8
- CATEGORY: power-stats
- DIRECTION: UNINFORMATIVE
- FILE_AND_SECTION: SDX-8.md §2.1 marginal cost; §2a Power
- QUOTE: "with the convention that a zero denominator is replaced by 0.5 (sensitivity: exclude those chains)" / "SD of log g or log R(30): 0.15 gives 16"
- PROBLEM: m(w) is a ratio of window sums with denominators of 0 to 10. A window with 1 accepted change versus 8 shifts log m by about 2.1, and the 0.5 convention adds a further ln 2. log g is a difference of two such logs. SDs of 0.15 to 0.30 are implausible: values near 0.5 to 1.0 are more likely. That implies n in the hundreds, and the planning n = 20 resolves only effects around 50%. The power statement understates this. W8 measures SD from 3 chains per arm, which §2a itself admits is unreliable.
- FIX: Replace g with a per-chain slope from a registered model fitted to all 30 changes (log cost per change on log size, accepted-change weighting). Its SD is far smaller. Alternatively, state in §2a the n required at SD 0.6, and make "not worth buying" the default unless the pilot's upper limit is at most 0.3.
- CONFIDENCE: medium

### F-19
- SEVERITY: MAJOR
- TARGET: BOTH
- CATEGORY: sharing
- DIRECTION: NEUTRAL-DEFECT
- FILE_AND_SECTION: SDX-9.md §4.3 S3 row and §13 table; SDX-8.md §6
- QUOTE: SDX-9 "the sealed open-field suite (shared with SDX-5 Part B)"; SDX-8 "shared with SDX-5 Part B, tagged by the change whose behaviour each probe tests, never visible to any arm"; SDX-9 "S4 repositories of SDX-9 may seed SDX-8 chains only if declared, and then count once"
- PROBLEM: The same open-field suite is a *stage target* in SDX-9, scored every session and coupled to nudges, and a *held-out escape detector* in SDX-8 and SDX-5. If SDX-9 runs first (§14 item 5 leans that way), proponents see per-criterion results on the suite before SDX-8's GS-written change texts (F-11) and SDX-5 artifacts are frozen. The seeding option lets SDX-8's starting repository be chosen after SDX-9 data exist.
- FIX: Use separate suites (SDX-9 S3 suite ≠ SDX-8/SDX-5 held-out suite), or freeze SDX-8 and SDX-5 completely before any SDX-9 main-run session. Delete the seeding option, or register it now with the seed rule fixed.
- CONFIDENCE: high

### F-20
- SEVERITY: MAJOR
- TARGET: BOTH
- CATEGORY: sharing
- DIRECTION: FAVORS-GS
- FILE_AND_SECTION: SDX-9.md §10 closing paragraph and §12; SDX-8.md §2.3 exploratory and §12
- QUOTE: "they are reported separately and never cited as support for one another" / SDX-8 "**not pooled with SDX-1** and counted once as one bundle" / SDX-9 "which makes C4 here a different object from SDX-1's A4 (declared, a fork)"
- PROBLEM:
  - SDX-8 has no reciprocal clause about SDX-9.
  - C4 (A4 plus two gates plus a mechanically generated ledger) and A4 are different treatments, yet every claim row says "the substrate".
  - Both experiments share A5 bytes, the practitioner, the fixture and the oracle machinery. A weak A5 or an oracle quirk produces correlated "wins" that a reader will count as two.
  - "Counted once" does not say *which* measurement of SDX-1's contrast is cited if SDX-1 and SDX-8's first ten changes disagree.
- FIX: Add to SDX-8 the same non-support clause naming SDX-9 and SDX-5. Name the treatment in each claim row ("A4 as frozen in SDX-1", "A4-S9"). Register a cross-experiment rule: SDX-1's registered result is the only citable one, and SDX-8's first-ten result must be printed beside any citation of SDX-1.
- CONFIDENCE: high

### F-21
- SEVERITY: MAJOR
- TARGET: BOTH
- CATEGORY: favors-GS
- DIRECTION: FAVORS-GS
- FILE_AND_SECTION: SDX-8.md §2.1 Cost; §8 step 5; SDX-9.md §2.1 (inherits)
- QUOTE: "dollars from a price table registered at freeze (input, output, cache creation, cache read; per model snapshot)"
- PROBLEM: Cache reads are priced at a fraction of input. Sessions in a chain run back to back with identical auto-loaded prefixes, so a large, stable substrate preamble is read largely at the cache rate, both within and possibly across sessions. Dollars then discount exactly the reading overhead the comparison is meant to charge. The "currency-dependent … nothing is strengthened" rule leaves unstated whether a dollar win with a token loss is still the verdict.
- FIX: Register a sensitivity price table with cache reads charged at the uncached input rate. Register that the verdict row applies only if the dollar result and that sensitivity agree in class family; otherwise the row is "currency-dependent: no cost claim".
- CONFIDENCE: medium

### F-22
- SEVERITY: MINOR
- TARGET: SDX-9
- CATEGORY: power-stats
- DIRECTION: HANDICAPS-GS
- FILE_AND_SECTION: SDX-9.md §4.4 Cap; §2.1 Censoring
- QUOTE: "40 sessions or 3 times B_4, whichever first"
- PROBLEM: Chains censored by the session cap carry their own accumulated cost, and that differs by arm. C4 sessions are more expensive, so a censored C4 chain is recorded as costlier than a censored C2 chain at the same "cap". "Censored at the cap cost" is ambiguous between the dollar cap and the actual cost at censoring. With many ties at the cap, BCa intervals become degenerate.
- FIX: Use a single dollar cap (3 × B_4) for all arms and remove the session cap, or impute every censored chain at the same registered dollar value. State the tie-handling rule for BCa.
- CONFIDENCE: medium

### F-23
- SEVERITY: MINOR
- TARGET: SDX-9
- CATEGORY: oracle-scorer
- DIRECTION: NEUTRAL-DEFECT
- FILE_AND_SECTION: SDX-9.md §2.1 Interventions
- QUOTE: "harness nudges (one fixed text, in every arm, issued after three consecutive checkpoints with no new passing probe, at most three per chain"
- PROBLEM: The nudge is triggered by the sealed scorer, so it leaks information about hidden-probe progress to the agent. Arms that respond to "you are stuck" differently (C4 can consult its ledger) receive differential value from oracle information. This contradicts the claim that the scorer is never seen.
- FIX: Trigger nudges on a scorer-independent signal (for example three sessions with no commit), or remove nudges and let the cap handle stalls.
- CONFIDENCE: medium

### F-24
- SEVERITY: MINOR
- TARGET: SDX-9
- CATEGORY: oracle-scorer
- DIRECTION: FAVORS-GS
- FILE_AND_SECTION: SDX-9.md §2.1 Claim and verdict
- QUOTE: "(claims of stage k at a checkpoint whose verified stage is below k) / (all claims of a stage), per chain"
- PROBLEM: An arm whose instructions favour `CLAIM: NONE`, or claiming low stages, gets a zero or undefined false-complete share. C4's open-questions gate explicitly couples claiming to blocking, so the treatment directly targets this metric (guard b). H9-a then measures claiming policy, not verification.
- FIX: Define the share over all session ends, counting NONE as no claim, with 0/0 chains reported and excluded by a registered rule. Add a complementary under-claim rate (verified stage above the claimed stage). Label H9-a "targeted".
- CONFIDENCE: medium

### F-25
- SEVERITY: MINOR
- TARGET: BOTH
- CATEGORY: procedure
- DIRECTION: NEUTRAL-DEFECT
- FILE_AND_SECTION: SDX-8.md §9 interim look; SDX-9.md §9
- QUOTE: "canary, A5 and A5g emergence counts"
- PROBLEM: The "flags only" interim look prints arm-level behavioural counts. Emergent-substrate counts are outcome-adjacent (they are listed as exploratory readouts), which violates guard (g)'s "never for outcome". SDX-9 likewise prints "C1 and C2 emergence counts".
- FIX: Print only pooled counts at the interim look, or move emergence counts to the final analysis.
- CONFIDENCE: medium

### F-26
- SEVERITY: MINOR
- TARGET: BOTH
- CATEGORY: power-stats
- DIRECTION: NEUTRAL-DEFECT
- FILE_AND_SECTION: SDX-8.md §2.2; SDX-9.md §2.2
- QUOTE: "BCa bootstrap (10,000 replicates) and Monte Carlo permutation (100,000, seed registered)"
- PROBLEM: Two inferential procedures are registered, but the classes are defined by intervals and no rule says which governs if they disagree. BCa at n = 10–20 with 97.5% intervals undercovers on skewed ratio data, and the A/A trigger at n = 10 inherits that.
- FIX: State "classes are decided by the BCa interval; the permutation p is reported only". Add a registered check of BCa coverage on pilot-shaped simulated data, with a fallback to percentile-t if coverage falls below 0.93.
- CONFIDENCE: medium

### F-27
- SEVERITY: MINOR
- TARGET: BOTH
- CATEGORY: falsifiability
- DIRECTION: NEUTRAL-DEFECT
- FILE_AND_SECTION: SDX-8.md §1 vs §2.3; SDX-9.md §2.3 H9-1
- QUOTE: "It is contradicted by H8-1 EQUIVALENT or REVERSED, or by H8-2 reporting no crossover." / SDX-9 "EQUIVALENT, COSTLIER or INCONCLUSIVE against any comparator (refutation rows 1, 2)"
- PROBLEM: The falsifier lists differ between sections: §1 omits INCONCLUSIVE, while §2.3 counts it as falsification, contrary to protocol §1, where INCONCLUSIVE is not REFUTED. "REVERSED" is not a defined class, and "refutation rows 1, 2" do not exist. Readers can cite whichever list suits them.
- FIX: Use one falsifier list everywhere: "EQUIVALENT or COSTLIER: REFUTED; INCONCLUSIVE: INCONCLUSIVE with required n". Replace the row references with the actual row ids.
- CONFIDENCE: high

### F-28
- SEVERITY: NIT
- TARGET: SDX-8
- CATEGORY: other
- DIRECTION: NEUTRAL-DEFECT
- FILE_AND_SECTION: SDX-8.md §2b Invalid-design triggers
- QUOTE: "model, CLI, Node or price table changed mid-window"
- PROBLEM: The price table is registered at freeze specifically so that vendor price changes cannot move the result. A vendor price change therefore cannot invalidate anything, and treating it as a trigger is incoherent. Only a change to the registered table would matter.
- FIX: Replace with "the registered price table or its application script edited after freeze".
- CONFIDENCE: high

### F-29
- SEVERITY: NIT
- TARGET: BOTH
- CATEGORY: other
- DIRECTION: NEUTRAL-DEFECT
- FILE_AND_SECTION: SDX-9.md §3 arms table; SDX-8.md §4.2
- QUOTE: "SDX-1 A0, byte-identical" / "a naming convention different from the arm's"
- PROBLEM: C1 receives a different task and a spec package, so it cannot be byte-identical to A0; only the arm-specific layer can be. Ballast is authored once, before any arm has formed a convention, so it cannot differ from "the arm's" convention.
- FIX: Write "arm layer byte-identical to SDX-1 A0 (empty); task prompt differs". Write "a naming convention different from the scaffold's".
- CONFIDENCE: high

## 3. Mandatory sections

### 3a. Ways the designs favour GS by construction
- SDX-9 stage gate (d) requires asking, which C4 is built to do (F-04).
- SDX-9 S3 uses an own-test coverage floor with hidden thresholds (F-05).
- Floor, collapse and cap-hit triggers relabel substrate failure as INVALID (F-06).
- Positive controls fail in worlds where the comparator is efficient or nothing grows (F-07).
- CHEAPER-SMALL counts as positive (F-08).
- Arm-informed pilot tuning of band, p_acc, d_k and cap (F-09).
- Human and spec-specific bootstrap is excluded from V1 (F-10).
- Proponents may write 12 of 20 change texts, and the event mix plays to the substrate (F-11).
- The numbered-criteria fixture is the treatment's native input (F-12).
- The rival prompt is not adapted to the task shape, and A5-L sits outside the IUT (F-13).
- The stale-content control is nearly unreachable (F-14).
- The mechanism row needs all five mediators unmoved (F-15).
- Correlated "wins" across SDX-8 and SDX-9 can be double-counted (F-20).
- Cache pricing discounts substrate reading (F-21).
- False-complete is targeted by C4's claiming coupling (F-24).

Also checked: the scripted D3/D4 replies and probe neutrality are left to an independent reviewer I cannot audit. Retry rules are inherited from SDX-1 and unseen.

### 3b. Ways the designs handicap GS, or are rigged against it
- g penalises the arm that erodes less (F-01).
- Ballast injection invalidates A4's state and may trip its gates (F-16).
- Censoring at the session cap charges C4 more per censored chain (F-22).
- INCONCLUSIVE is listed as a falsifier in §2.3 (F-27).
- Declared and not re-argued: one mid-tier model; intersection-union plus fixed-sequence conservatism; Z_project charged once per chain; V3 adverse by design.

I checked whether the strict crossover rule (cheaper, interval excludes zero) handicaps GS beyond what is declared. It does not, given that F-08 makes the same rule lenient on size. I also checked whether the H8-1 requirement to beat A5g is unfair to GS. It is not: it is the right control.

### 3c. Ways the designs are unfalsifiable, cannot inform, or have a modal outcome that changes no decision
- The modal outcome (INCONCLUSIVE, per both §2a) has no decision row in either table (F-03).
- Overlapping classes let the same data be both prediction and falsifier (F-02).
- The SDX-9 rows (i)/(ii) need H9-a positive at about 40% power.
- Content and mechanism rows are close to unreachable (F-14, F-15).
- log g is likely far noisier than planned (F-18).
- The "no growth" world is unciteable (F-07).

At the planned n, the most probable result for both drafts is INCONCLUSIVE or CHEAPER-SIZE-UNRESOLVED on the primary. As written, that maps to no row and changes no decision about the paper or the offer. The roughly $3–10k per draft buys a direction at best.

## 4. Better hypotheses (at most three)

### H-A
- STATEMENT: Forked-state marginal cost. At registered repository states (snapshots of A5 chains at 3, 9 and 18 kLOC, plus ballast tiers), the same next change costs less per accepted change with the substrate (bootstrapped onto that state, bootstrap charged) than with A5 or A5g. The advantage grows with log size.
- WHY MORE INFORMATIVE: It removes path dependence and the look-ahead asymmetry (F-01). Each state is shared across arms, so contrasts are paired and SD falls sharply. It tests the growth slope directly and also measures what retrofitting the substrate onto an existing repository costs, which is the buyer's case.
- WHAT IT NEEDS (arms, n, readout): A4-bootstrap, A5, A5g. Use 3 size levels × 10 source states × 4 next changes, paired. Readout: the arm × log-size interaction on log cost per change accepted at k+3, analysed with a mixed model, with one random effect per source state.

### H-B
- STATEMENT: A component factorial on the build task. Map (yes/no) × enforced gate (yes/no) × spec ledger (yes/no), so 2³ = 8 cells. The primary readout is cost to COMPLETE verified by black-box probes only.
- WHY MORE INFORMATIVE: It replaces the C2/C3/C4/C5 comparisons and their noisy point ratios (sufficiency ratio, stale ratio) with estimated main effects and interactions. It answers "which part pays" with power shared across cells, and it removes the dependence on rows (v), (vi) and (x).
- WHAT IT NEEDS (arms, n, readout): 8 cells × 10 chains = 80 chains, comparable in cost to SDX-9 Core. The scorer is stripped of targeted checks (F-04, F-05). Readout: factorial effects on log cost to COMPLETE.

### H-C
- STATEMENT: Premise test first. Measure whether marginal cost per accepted change rises with repository size for A0, A5 and a frontier model at 3, 9, 18 and 36 kLOC (ballast tiers) before any substrate arm is run.
- WHY MORE INFORMATIVE: Both drafts assume a growth regime and label its absence INVALID. A cheap, citable premise test decides whether SDX-8 is worth $3–18k. If cost does not grow for a mid-tier model, the "pays off as it grows" argument fails before the substrate is ever tested.
- WHAT IT NEEDS (arms, n, readout): A0 and A5 on 2 models, 4 size tiers × 10 states × 3 changes. Readout: slope of log cost on log size with an equivalence bound.

## 5. Convince-me statements
- WHAT RESULT WOULD CONVINCE ME THE SUBSTRATE PAYS ITS OVERHEAD: With every arm healthy, V1 net cost per durably accepted change for A4 is CHEAPER-RELEVANT against both A5 and A5g at change 30. A4 is also cheaper than A4-stale at the main-arm n, and the registered primary mediator (regression flips) moves in the same direction. On the cache-neutral price table the class is unchanged. On SDX-9, cost to COMPLETE scored by black-box probes only is CHEAPER-RELEVANT against C2 and C3.
- WHAT RESULT WOULD CONVINCE ME IT DOES NOT: Any of the following:
  - V1 at change 30 is EQUIVALENT or COSTLIER against A5 with comparators healthy.
  - A4 collapses or hits caps while comparators do not, counted as REFUTED and not INVALID.
  - Marginal cost does not grow with size for A5, so the premise fails.
  - A4-stale performs as well as A4.
- WHAT THE DESIGNS AS WRITTEN WOULD NEED, SO THAT BOTH ARE POSSIBLE: The following changes are needed so that both directions are possible:
  - **Classes and rows:** a partition of the classes with one decision row per class combination, including INCONCLUSIVE, and "positive" restricted to CHEAPER-RELEVANT or CHEAPER-SIZE-UNRESOLVED (F-02, F-03, F-08).
  - **Symmetric triggers:** INVALID-DESIGN triggers that do not fire on treatment-arm failure or comparator efficiency (F-06, F-07).
  - **Growth readout:** a fixed look-ahead or slope-based growth readout (F-01, F-18).
  - **Clean scorer:** an SDX-9 scorer free of questioning and own-test checks (F-04, F-05).
  - **Blinded pilot:** a pilot that sets parameters from pooled, arm-blind outputs (F-09).
  - **Authorship:** independent authorship of all change texts and the spec (F-11, F-12).
  - **Direct controls:** direct A4-vs-stale contrasts at the main n (F-14).

## 6. What I could not assess, and what I checked and found sound
I could not assess any of the following:
- The inherited SDX-1 rules (retry rule, M1/M2 instruments, parity, SD rule, A5 text, D1/D2).
- Whether shared bytes are truly identical.
- The content of the ballast, the probes or the held-out suites.
- Compendium §8.19 (q) or the P4/P6 skeletons.
- Whether hooks run inside headless sessions as assumed.
- The per-session cap value.

I checked and found sound: the power formulas (2(z_{0.9875}+z_{0.8})² = 2·3.08² and 2·2.80² scalings, and the "0.97 SD" and "0.89 SD" detectable gaps), the fixed-sequence ordering as a familywise-error control at the stated alpha, and the Bonferroni split between H8-1 and H8-2.
