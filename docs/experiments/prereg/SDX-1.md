# SDX-1: what does a persistent, structured, enforced substrate add over an expert prompt that lacks GS, once the project lives? (main preregistration)

Status: **DRAFT, NOT FROZEN.** Revision 2 (2026-10-02): adds the expert-minus-GS arm and its contrasts, then incorporates the first round of stateless critics (dispositions in `C:\workspace\PragmaWorks\gs\generative-specification\docs\experiments\prereg\SDX-REVIEW.md` section 2). Freezing (git tag `prereg/SDX-1-v1`, push, external timestamp) is JC's decision and requires SDX-0 to be closed. Every bracketed value `[FROM SDX-0]` is filled from pilot measurements before freezing; no value may be changed after the freeze. Protocol: `C:\workspace\PragmaWorks\gs\generative-specification\docs\experiments\EXPERIMENT-PROTOCOL.md`. Pilot: `C:\workspace\PragmaWorks\gs\generative-specification\docs\experiments\prereg\SDX-0.md`. Load-bearing list, arm definitions, authorship and manipulation checks: `C:\workspace\PragmaWorks\gs\generative-specification\docs\experiments\prereg\SDX-1-ARMS.md` (part of this registration). Logbook entry: `C:\workspace\PragmaWorks\gs\generative-specification\docs\experiments\LOGBOOK\SDX-1.md`. Mechanics of registering: `C:\workspace\PragmaWorks\gs\generative-specification\docs\experiments\PREREG-HOWTO.md`. 

## 1. Question and why this experiment

Earlier single-shot experiments (AX, AX2) found that a disciplined prompt beats a naive one and ties an expert prompt that was itself written from GS content. They could not separate (a) generic engineering expertise, (b) GS content delivered in a prompt, and (c) GS content delivered as a persistent, structured, enforced substrate. SDX-1 separates them on a growing project in which only the repository carries state between sessions.

Questions, in the order JC asked them:

1. Does an expert prompt that contains none of the load-bearing aspects of GS (arm A5, elements L1 to L5, SDX-1-ARMS section 1) behave differently from naive (A0)? JC's field expectation: yes, but less than a year ago, because frontier models have improved. (The "less than a year ago" part is not testable here: one model generation, one date. Only "different from naive now, on this model" is.)
2. Is it also clearly short of the substrate (A4)? JC's field expectation: yes. If not, the value of the substrate on this evidence is governance, not correctness.
3. (Secondary) Does the same content in a prompt (A1), or in one file (A3), close the gap, and what does an unconstrained expert (A6) get?

Construct, deliberately narrow: hidden-oracle correctness of a 10-change invented project. Not code quality, human maintainability, governance, handoff, or production cost-effectiveness. Public wording of any H1 result must say "an expert prompt without project-state documents", because A5 is constrained by design.

Intuition, in falsifiable form (guard f, stage 1): "A mid-tier coding agent working a growing project under generic expert prompting alone loses state-dependent behaviour by at least the SESOI more than under the substrate, and does better than naive on state-independent hidden correctness." It is contradicted by H1 EQUIVALENT or REVERSED, or by H2 EQUIVALENT. The versions that nothing could contradict ("the expert prompt is GS-lite", "structure helps") are not the hypothesis.

## 2. Hypotheses, readouts, falsifiers, controls

### 2.1 Readouts, defined once

Scoring is per change: after the last attempt of change k the harness snapshots the working tree and runs the sealed oracle: "fresh" probes (introduced by change k) and "carried" probes (introduced earlier). Probe tags, fixed before any chain runs, by the mechanical rule in section 6: **state-dependent (SD)**: a correct answer needs information introduced by an earlier change text or recorded decision and absent from the base spec and the current change text (the supersession at change 6 on each earlier surface that used the old rule, the decisions of changes 3 and 7, the reversal at change 9). **State-independent (SI)**: everything else.

- E1-SD = share of SD probes passed, aggregated over snapshots 6 to 10 (where SD probes exist). Conditional scoring: an SD probe counts for a chain only if its antecedent behaviour passed at the antecedent's own snapshot (otherwise the probe would pass vacuously, for example the reversal of a move that was never built); the number of excluded probes is reported per arm and an unconditional (ITT, excluded counts as fail) analysis is a registered sensitivity.
- E1-SI = share of SI probes passed over all snapshots (general capability).
- E1-ALL = share of all probes passed at the final snapshot.
- A chain that fails to build on 2 consecutive changes is collapsed: all later probes score zero (ITT); completers-only is the sensitivity analysis.
- **Primary readout for H1: E1-SD adjusted for E1-SI** (chain-level ANCOVA, E1-SD on arm plus E1-SI). Reported beside it: unadjusted E1-SD and D = E1-SD minus E1-SI (exploratory). Reason for adjustment: removes the head start an arm may have from general capability. Limit stated: E1-SI is itself affected by arm (gates may raise it), so the adjusted contrast is the state-specific part, and the unadjusted one the total.
- **Readout for H2: E1-SI** (general capability, the construct "is generic expertise better than naive", uncontaminated by state). E1-ALL is reported beside it.

### 2.2 Classification of any contrast

Delta = mean difference X minus Y per chain, with a 95% interval for secondary contrasts and a 97.5% interval for the two co-primaries (alpha 0.025 each, Bonferroni). Interval [L, U], point estimate p, SESOI delta:

| Class | Rule |
|---|---|
| POSITIVE-RELEVANT | L > 0 and p >= delta |
| POSITIVE-SMALL | L > 0 and U <= delta (measurable, below the decision-relevant size) |
| POSITIVE-SIZE-UNRESOLVED | L > 0, p < delta < U |
| EQUIVALENT | L <= 0 <= U and the whole interval inside minus delta to plus delta (TOST at half the alpha per side; a small nonzero effect may exist) |
| REVERSED | U < 0 (size reported; REVERSED-RELEVANT if p <= minus delta) |
| INCONCLUSIVE | everything else |

The decision rows treat all three POSITIVE classes as "X is better" with the size class stated; the SESOI governs equivalence and the size wording.

SESOI: on E1-SD (adjusted) 10 percentage points, on E1-SI 5 percentage points, both provisional. Justification to be written at the SDX-0 freeze (open: an expert prompt is nearly free to adopt, so a smaller E1-SI delta may be defensible; that raises n). Tests: Monte Carlo permutation test (100,000 permutations, seed registered, no stratification: one vendor, one model), BCa bootstrap interval (10,000 replicates, seed registered).

| ID | Role | Contrast and readout | Prediction (can fail) | Fails (falsifier) |
|---|---|---|---|---|
| H1 | co-primary | A4 minus A5 on E1-SD adjusted: does the substrate add state-dependent correctness beyond generic expertise | POSITIVE (any size); range in section 2a | EQUIVALENT (row iii) or REVERSED (row iv) |
| H2 | co-primary | A5 minus A0 on E1-SI: is generic expertise different from naive on general hidden correctness | POSITIVE; range in section 2a | EQUIVALENT (row i). A difference only on treatment-targeted structure metrics (layer violations and similar) does not count (guard b) |
| H3 | secondary, Full only, gated by H1 positive, alpha 0.05 | A4 minus A3 on E1-SD adjusted | POSITIVE; EQUIVALENT also informative | n/a (both reported) |
| H4 | secondary, Full only | A4 minus A1 on E1-SD adjusted | POSITIVE | EQUIVALENT or REVERSED |
| H5 | secondary, Full only | A1 minus A5 on E1-SD adjusted (GS content in a prompt vs generic expertise) | small POSITIVE or EQUIVALENT | none attached |
| H6 | secondary, Full only | A6 minus A5 on E1-SD adjusted (what documentation instinct buys) and A4 minus A6 | none pre-stated beyond "report" | none attached |

Exploratory, labelled, no verdict: each contrast on the other readouts (a table of contrasts by readout; where the secondary readout points to a different decision row the result says "readout-dependent" and nothing is strengthened); SD split into propagation probes (recoverable from code by search) and decision probes (information that exists only in the product-owner replies and recorded decisions); dose-response (gap vs distance since the antecedent); introduction-change index as covariate (guards against the late-vs-early confound); recovery share (A4 minus A5) divided by (A0S minus A5); change-failure rate; regression flips; tokens and dollars per hidden-correct change; hidden-suite kill rate; mixed logistic model at probe level; emergent-substrate counts per arm (SDX-1-ARMS section 4); questions asked per arm. Treatment-targeted metrics are reported, never carry a verdict.

### 2a. Pre-stated gap sizes (percentage points), with reasons and why each could be wrong

Written before any run from public evidence only (LOGBOOK AX, AX2, CR, SX, TX, RND-1) and mechanism reasoning. Estimates, not commitments; their purpose is that a result cannot later be called "as expected" without having been stated.

| Gap | Range | Reasoning | Why this range could be wrong |
|---|---|---|---|
| A0S minus A0 on E1-SD (positive control) | at least 20 (validity), expected 25 to 50 | the antecedent information is restated in each later change text, an effect known by construction and independent of any substrate | if code and tests already carry the state the gap is small: then state is not scarce at this size, which is a finding about the benchmark (the experiment cannot reach the SESOI) |
| **H1: A4 minus A5, E1-SD adjusted** | **4 to 18, central about 9** | at 2 to 3 kLOC code and tests carry most state; SX shows a frontier agent finds every duplicated copy itself and the map saves cost, not correctness; what code cannot carry is decisions and the reversal text that names no targets; models have improved since AX | lower (0 to 3) if agents recover everything from code and tests; higher (20 to 35) if the mid-tier model drops propagation, as TX showed for a weak model. The central value is near the SESOI: the modal outcome is POSITIVE-SMALL or POSITIVE-SIZE-UNRESOLVED or INCONCLUSIVE. That is a property of the design, and JC should decide before spending whether such a design is worth its price |
| **H2: A5 minus A0, E1-SI** | **0 to 8, central about 3** | AX2: naive vs disciplined separated on structure, not on behaviour (that oracle was invalid); CR: GS no better than naive on behaviour at hosted rungs. No behavioural precedent exists for a generic-prompt uplift on this model class | higher (8 to 15) if validation and error-contract guidance matters for a mid-tier model; zero if naive is near ceiling. **JC's expectation that A5 differs from naive is not supported by prior behavioural evidence; it may show only on targeted structure metrics, which do not count** |
| A5 minus A0 on E1-SD adjusted (exploratory) | minus 3 to 6 | clean generic structure makes earlier rules easier to find and change | emergent notes by the agent would raise it |
| H3: A4 minus A3 | 0 to 8 | same content; structure and enforcement may matter little at this size | enforcement could matter more if agents leave failing states |
| H4: A4 minus A1 | 4 to 18 | like H1 plus whatever prompt-delivered L content buys | as H1 |
| H5: A1 minus A5 | 0 to 6 | L instructions need persistence to act; "update the README" may yield an emergent record | larger means prompt-delivered GS content matters without a substrate |
| H6: A6 minus A5 | 0 to 8 | documentation instinct creates a partial substrate | larger if natural expert practice already approximates much of L |

These ranges are for a mid-tier model on purpose. A frontier model would likely shrink H1 and H2; that is the capacity-relative claim and a separate cell (SDX-2).

Power. n per contrast arm for 80% power to get L > 0 at a true gap of delta: n = 2 (3.08 x SD / delta)^2 (z 2.24 for alpha 0.025 plus 0.84). E1-SD adjusted, delta 10: SD 8 gives 12, SD 10 gives 19, SD 12 gives 27, SD 15 gives 43. E1-SI, delta 5: SD 4 gives 12, SD 6 gives 27. (If E1-SI strongly predicts E1-SD, the adjusted SD is smaller than the raw one; measured in SDX-0.) The registered rule powers for "direction established", not for the point estimate reaching delta; at a true gap equal to delta, P(POSITIVE-RELEVANT) is about 50% even at planned n. SD estimates from 3 pilot chains per arm are unreliable (interval about 0.5 to 6 times); therefore n is computed from the SD pooled across arms and its upper 80% confidence limit, and one blinded re-estimation (pooled variance, no arm labels, no outcome contrast) is allowed at the interim look, able only to raise n within the approved budget cap. Planning n = 20. If n exceeds 25, delta may be raised only with written justification before freeze, otherwise scope is cut to Core. Equivalence needs the whole interval inside plus or minus delta: at n = 20 and SD 10 the 97.5% half-width is about 7, so a true gap of 3 or less can show EQUIVALENT.

### 2b. Controls (guard a)

- **Positive control A0S ("state in text"):** A0 with the antecedent information (earlier change texts and the product-owner replies relevant to the change) restated in each later change text; its effect is known by construction and does not depend on any substrate. Valid only if A0S minus A0 on E1-SD is at least 20 points; otherwise the experiment cannot detect a known state effect: INVALID-DESIGN. (Replaces the amnesia control as the validity gate, which could not distinguish a failed experiment from the true world "code carries the state".)
- **Exploratory mechanism check A4x (Full only, k=10):** each chain forked from an A4 chain after change 5 with the substrate files, and any hook, script or lock reference to them, removed, then verified to build; reported, not a gate.
- **Negative control A5b:** independent run of A5 (the CLI has no seed parameter; independence comes from separate sessions and interleaved order), n = 10. Noise trigger: |point difference A5 minus A5b| at least delta on E1-SD adjusted and the 95% interval excludes zero: then noise exceeds the effect, INVALID-DESIGN. Stated limit: noise is measured for A5 only; A4 may vary more (gate blocking), and the pooled SD is reported per arm.
- **Floor and ceiling:** if the weaker comparator of a contrast is at or above (100 minus delta)% on its readout (for H1: A5 on E1-SD; for H2: A0 on E1-SI; H3 to H6 the comparator arm) the contrast cannot be tested; if the stronger arm of H1 (A4) is below delta on E1-SD, or E1-SI is at the ceiling in every arm, likewise. A strong arm at the ceiling with a weak one clearly below is not a defect. If A0 is at or above 95% or below 5% on E1-ALL the benchmark does not discriminate: INVALID-DESIGN.
- **Manipulation checks M1 and M2**, SDX-1-ARMS section 4, at freeze and on run outputs.

## 3. Arms

Every change is a fresh session in a fresh configuration directory with auto-memory off, a unique repository path per chain, and no resume; only the repository carries state; vendor memory features, user-level instruction files, web and MCP disabled. SDX-0 verifies this with a planted memory (V13). The harness commits after each change with a neutral message identical in every arm (no arm is told to write informative commit messages; A4's own commit protocol runs through its hooks). The harness never writes substrate content: A4's ledger, specs and decision records are written by the agent under A4's protocol. Content composition (generic G, load-bearing L) and authorship: SDX-1-ARMS sections 2 and 3.

| Arm | What the session gets | Persistent state beyond code |
|---|---|---|
| A0 naive | the base spec and the change text | none |
| **A5 expert minus GS** | A0 plus the externally authored generic prompt, none of L1 to L5 | none instructed |
| A5b | identical to A5, independent run (negative control) | same |
| A0S | A0 with antecedent information restated in later change texts (positive control) | none |
| A1 expert plus GS content (Full) | A5's prompt plus the L appendix | whatever the agent chooses to write |
| A3 flat context file (Full) | A0 plus one auto-loaded file carrying G and L flattened | the one file |
| A6 expert unconstrained (Full) | A0 plus the same practitioner's natural prompt (no constraint) | whatever the agent chooses |
| A4 substrate, gates in the loop | A0 plus sentinel tree, feature specs with acceptance criteria, recorded decisions, fixes ledger, spec lock, hooks, fixture ratchet, red-first, triage rule | the full tree, enforced |
| A4x (Full, exploratory) | fork of A4 after change 5 with the substrate removed | code only |

Scope, chosen by JC at freeze and then fixed: **Core** = A0, A5, A5b, A0S, A4 (H1, H2 and both controls). **Full** = Core plus A1, A3, A6, A4x (H3 to H6). Arms are never dropped after freeze.

Decision points: the scripted product-owner reply for changes 3 and 7 is appended unconditionally to that change's text in every arm (headless sessions cannot ask mid-session); whether the agent also asked, and how often, is logged as a secondary metric. Retry rule (identical for all arms, at most 3 attempts): retry only if the build fails, the server does not start, or the base-spec smoke check fails; never on the arm's own test results. Per-session limits identical `[FROM SDX-0]`; a differential cap-hit above 10 points is an INVALID-DESIGN trigger.

Parity and leaks: SDX-1-ARMS section 4. Artifact sizes and author hours reported per arm; sizes not forced equal (review R1). Authoring tools per artifact are disclosed (threat in section 12).

## 4. Benchmark, scaffold, horizon

Pastura (invented; no public corpus; `C:\workspace\PragmaWorks\gs\generative-specification\experiments\cr\benchmark\DOMAIN_SPEC.md`, canary probe `C:\workspace\PragmaWorks\gs\generative-specification\experiments\cr\runner\canary_probe.md`, run cold per model, recall above zero is INVALID-DESIGN for that model); locked scaffold, identical bytes in every arm, hash-checked after each change (Node, TypeScript strict, `node:http`, `node:sqlite`, vitest, fixed paths and rule-function signatures; Node version and model snapshot pinned, no aliases); horizon CR0 plus 10 changes (table); at least 3 of 10 change texts written or reviewed by an independent person who does not know the arm artifacts. Change 10 is new (critic round 1): a late state-independent feature matched in size to change 4, so state dependence is not confounded with lateness.

| # | Change (orig id) | State dependence | Stress |
|---|---|---|---|
| 1 | Forage budget from the latest reading (1) | SI | duplication trap; constants reused later |
| 2 | Role restrictions across endpoints (2) | SI | cross-cutting rule |
| 3 | Owner emergency move overriding the rest rule, with reason (4); the scripted reply fixes the open choice | SI; creates recorded decision D1 | decision point |
| 4 | Occupancy report over a date range (5) | SI | reuse and layering |
| 5 | Herd split and merge (6) | SI | invariants |
| 6 | SPEC CHANGE: rest period depends on season and forage state, supersedes the constant (7) | SD on every earlier surface using the old rule | propagation |
| 7 | Paddock subdivision (8); scripted reply | SD (decision D2) | decision point |
| 8 | Low-forage alert list (10) | SD (reuse of change-1 logic under the new rule) | reuse |
| 9 | Retire the emergency move (11) | SD (everything change 3 touched; the text names no targets) | reversal |
| 10 | Late independent feature (new; for example a veterinary visit log), no interaction with rest or forage rules | SI | position control |

Acceptance and scored state: the working tree after the last attempt of each change, same rule for every arm; hooks may block commits but the scored state is the working tree, so a hook is not free rollback. Test deletion, weakening and fixture editing are logged in every arm.

## 5. Model

One vendor, one mid-tier model through its headless CLI; dated snapshot id, CLI version and Node version recorded; all chains in a short window; arm order randomized in blocks with A5b interleaved. A second vendor is a replication (SDX-2), not pooled. Judges (M1, parity) are a different vendor from the generator. **One-vendor scope is a stated limit**: the manipulation judge has to come from another vendor, none is installed on this machine, so JC must supply API access before freezing (section 13).

## 6. Oracle (sealed, outside every repo, HTTP level)

Probes derived only from the base spec and change texts 1..k; status-class tolerance (2xx accept, 4xx reject) plus value and list-membership checks wherever the per-change contract defines them (alert-list membership, budget values); fields checked only by names fixed in the contract. Paired probes scored as a pair (accept X and reject Y both required); 2xx/4xx balance is required overall and **within the SD subset**. **SD probes are enumerated by a mechanical rule**, not chosen by the oracle author: one probe per supersession or reversal and per surface listed from the reference implementation's call graph, plus one per recorded decision; the list is frozen before any substrate artifact is designed. Probes versioned at change 6 and change 9: retired or inverted probes are listed in the manifest and never count as regression flips. About 8 to 10 probes per change; sealed holdout; validation in SDX-0 with a reference implementation, degenerate stubs and hand mutants is a precondition.

## 7. Judges

No primary metric is judged. Judges (a different vendor) are used for M1 leak and parity classification only, with the independent human reviewer as the second instrument. Deterministic scripts replace judges wherever they can decide (emergent-substrate detector, hash checks). Governance, reconstruction and defect-detection questions are SDX-3.

## 8. Analysis plan, exactly as registered

1. Controls, manipulation checks and INVALID-DESIGN triggers (section 10) before any contrast.
2. H1 and H2 at the 97.5% level; classify as in section 2.2; assign the decision row from the pair.
3. If H1 is positive and scope is Full: H3 (alpha 0.05). Then H4 to H6 at 95%.
4. Report collapse rate per arm (ITT and completers-only), conditional vs unconditional SD scoring, the contrast-by-readout table, emergent-substrate counts, circumvention events (A4 results are kept under intention to treat; per-protocol is a sensitivity), exploratory list labelled.
5. No further correction; nothing in the secondary list carries a verdict.

## 9. Stopping rules

Fixed n per arm at freeze, no optional stopping, no extra chains after seeing outcome data, except the single blinded variance re-estimation (section 2a). One interim validity look at about half the chains by a script that prints only flags: ceiling or floor, harness failure rate above 15% (action: fix the harness, rerun the affected cells, disclose), cost above 2x (action: stop and amend budget with JC), differential cap-hit, canary, A5 emergence counts. It never prints arm-level outcomes. Budget: if the pilot's cost per chain exceeds 3x the estimate, amend before freeze.

## 10. Decision table (registered)

Rows are assigned by the co-primary pair (H1 on E1-SD adjusted, H2 on E1-SI) after the validity row is cleared. "Positive" means any POSITIVE class with its size class stated. "Claim the paper and offer may then make" is a scope-bound permission, not sales copy; anything not listed is not permitted. **The validity audit (re-run of the stage-2 questions, controls, oracle, harness logs, arm artifacts) is mandatory for every verdict row, favourable ones included**; the falsifiability audit of the intuition is added whenever a result contradicts field experience. Tiers assume freeze and external timestamp precede data.

| Row | Observed | Permitted conclusion (this construct, vendor and model, invented 10-change project) | Claim the paper and offer may then make | Forbidden conclusion |
|---|---|---|---|---|
| (v) INVALID | Any trigger: A0S minus A0 under 20 points; A5 vs A5b noise trigger; ceiling or floor as in 2b; A5 leak (M1); A5 weak by construction (M2) after budget (invalid for H1, H2, H5, H6 only); differential collapse or cap-hit above threshold; parity gap or oracle leak found in an artifact; canary recall above zero; model, CLI or Node changed mid-window; harness persistence found (V13) ; SD probes found to reward one resolution of a decision point; practitioner independence or authorship rule broken | `INVALID-DESIGN`, naming the trigger; redesign and register a linked experiment | none; not cited as evidence either way | Any conclusion about A5, A4 or the substrate |
| (i) | H2 EQUIVALENT and H1 positive | Generic expert prompting adds nothing measurable to general hidden correctness here; the substrate adds state-dependent correctness | "On this construct a generic expert prompt without a project-state mechanism did not beat naive on hidden correctness, while the substrate beat it on state-dependent behaviour." Scope stated, size class stated | "Prompting does not matter" (structure metrics not tested for a verdict); frontier models |
| (ii) | H2 positive and H1 positive | A5 sits between naive and the substrate; the load-bearing elements (as a bundle) are the remaining gap. Both gap sizes with intervals | "Generic expertise helps; the substrate adds a further measured amount on state-dependent behaviour. Which element acts is not shown." SDX-2 ablation named as next step | "Each of L1 to L5 is load-bearing"; production-scale durability |
| (iii) | H1 EQUIVALENT, any H2 | The substrate adds no measurable state-dependent correctness beyond strong generic expertise here; its value, if any, lies outside what was measured (governance, continuity, audit, regenerability, read cost). **Contradicts field observation: the falsifiability audit of the intuition is mandatory in addition to the validity audit** (10a) | The paper drops "the substrate improves durable correctness" and keeps governance and continuity as hypotheses owed to SDX-3. The offer sells assurance, conformance and governance evidence, not "better code than a strong prompt". Field reports stay labelled observational | "The substrate is useless"; rescuing the claim by regimes not pre-registered in 10a |
| (iv) | H1 REVERSED | Gate friction or overhead cost more than they bought at this size; cost secondary becomes central | as (iii), plus a stated cost caveat on enforcement | Rescue by regimes beyond 10a |
| (vi) | H1 INCONCLUSIVE, any H2 | Not enough evidence; state the n that would resolve it from the observed SD | none beyond "inconclusive at n" | Either direction |
| (vi-a) | H1 positive and H2 INCONCLUSIVE or REVERSED | The substrate beats generic expertise on state-dependent behaviour; A5 versus naive is undetermined (or A5 worse, reported prominently) | only the H1 statement | That A5 is between naive and the substrate |
| (vi-b) | A5 self-induced a substrate: at least half of A5 chains show three or more of L1 to L5 at the final state | This is a finding about the expert prompt, not an invalid arm: ITT verdict on H1 and H2 stands, and the arm is described as "an expert prompt that induced its own substrate"; report emergence as a mediator | verdict stands with that description | Calling A5 "minus GS in practice" |
| (vii) | H1 positive and H3 positive (Full) | Structure and enforcement add beyond the same content in one file | as (ii) with the flat-file comparison | "Durability is demonstrated" in general |
| (viii) | H1 positive, H3 EQUIVALENT | Persistence of content is the active ingredient; structure and gates are not shown necessary here | "content persisted in a repository file is enough on this construct and horizon" | "Structure and enforcement are useless" |
| (ix) | Result contradicts field experience (any row) | Both audits, logged, before anything else | none until audits done | Dismissal of the result or of the experience without them |
| (x) | The experiment turns out to be the wrong one | `INVALID-DESIGN` with the named defect; linked redesign | none | Counting it as support or refutation |
| (xi) | A4 circumvention above `[FROM SDX-0]`% | A4 verdict kept under ITT; the word "enforced" is withdrawn for A4; per-protocol sensitivity reported | verdict with that wording | Calling A4's gates enforced |

### 10a. Regimes pre-registered as untested (the only ones that may be named after row iii or iv)

(a) A repository larger than a fresh session reads (BACKLOG B6; at 2 to 3 kLOC this regime is excluded by construction, and a 24-change contingency is registered for SDX-2); (b) multiple contributors or rotating people; (c) governance and audit outcomes (SDX-3); (d) weaker models (CR) and frontier models (SDX-2). Naming one is a statement of what was not tested; a claim about it needs its own registered experiment. Listing them now, before data, is what stops them being post-hoc rescues.

Honest limit across every row: a win shows state-dependent correctness on a 10-change invented project with one vendor and a mid-tier model, not durability of production systems; a null shows only that this design did not find it.

## 11. Cost and time (estimate; replace from SDX-0)

Sessions = chains x 11 steps (CR0 plus 10 changes) x about 1.25 attempts = about 13.75 per chain; $0.4 to $1.2 per session (measured anchor $0.43 for a substrate session). Planning n = 20 per contrast arm, controls 10. **Core:** A0, A5, A4 at 20; A5b, A0S at 10 = 80 chains, about 1,100 sessions, about $440 to $1,320. **Full:** adds A1, A3, A6 at 20 and A4x at 10 = 150 chains, about 2,060 sessions, about $825 to $2,475. If the pilot requires n = 27: Core 101 chains (about $555 to $1,670), Full 192 chains (about $1,060 to $3,170). Judge runs for M1 about $20 to $60. Wall clock 25 to 60 hours with 3 to 4 chains in parallel. All guesses until SDX-0 measures them.

## 12. Threats to validity (declared)

Proponent-authored substrate, sensors, oracle and change list (mitigated by registration, external practitioner, mechanical SD probe rule frozen before the substrate is designed, substrate builder blind to the change texts, parity and leak checks, independent reviewer, published artifacts, an independent rerun as next step; not eliminated). Authoring asymmetry: A4 is built by the GS side, A1, A3, A5, A6 by an outsider, so vehicle is confounded with author skill in H3 and H4 (declared; not resolved). Authoring tools per artifact are disclosed; an artifact drafted with the generator's own vendor may be read more easily by it. "The expert prompt" is not one object: A5 is one practitioner's prompt under a stated constraint. The substrate is tested as a bundle. A5's lack of persistence is by instruction; agents may build their own (detector, row vi-b). Toy scale: a fresh session can read the whole repository, which excludes the regime where the substrate is claimed to matter most. One invented domain, one change order. One vendor, one CLI harness, a judge from another vendor still owed. D and E1-SD adjusted rely on E1-SI as covariate, itself post-treatment. Parity is on content, not form: form is the thing under test. The pre-stated ranges come from a small, mostly tier-C evidence base.

## 13. Open items before freezing (decisions)

1. **Name the external practitioner** (authors A6 first, then A5 derived under the constraint, then the L appendix and flat file) and **the independent reviewer**; both different from JC and from any agent (SDX-1-ARMS section 3).
2. Independent author or reviewer for at least 3 of 10 change texts and a read of the whole list; an independent author for the mechanical SD probe rule check.
3. **A different-vendor critic must re-read this file and SDX-1-ARMS before freezing**, and a different-vendor judge (API key) must be available for M1. Revision 2 was reviewed by Claude critics only; vendor diversity is still owed.
4. Budget approval (SDX-0 about $130 to $400; SDX-1 Core or Full as in section 11) and a decision on whether a design whose modal outcome is POSITIVE-SMALL or INCONCLUSIVE (section 2a) is worth its price.
5. SESOI confirmation with written justification (E1-SD adjusted, E1-SI) and n from SDX-0.
6. Scope choice, Core or Full.
7. External timestamp route (OSF Registries recommended; PREREG-HOWTO) and whether to try a Registered Report track.
8. Vendor, dated model snapshot and Node version at freeze.

## 14. Registration checklist

Commit and tag `prereg/SDX-1-v1`: this file, SDX-1-ARMS.md, change texts and order, scaffold hash, oracle with probe manifest and the mechanical SD rule and its output, content manifest (G and L tags), parity and leak results, frozen A6 and A5 texts with authorship attestation, A1 appendix, flat file, A4 initial substrate (hashed), detector and analysis scripts with seeds, model snapshot, CLI and Node versions, SESOI and n, deviations-log file (empty). Build the package with `C:\workspace\PragmaWorks\gs\gs-experiment-protocol\scripts\build-frozen-package.js` and follow `C:\workspace\PragmaWorks\gs\generative-specification\docs\experiments\PREREG-HOWTO.md`. Log tag, commit, DOI or URL, date and archive SHA-256 in `C:\workspace\PragmaWorks\gs\generative-specification\docs\experiments\LOGBOOK\README.md`.
