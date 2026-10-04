# SDX-8: does the substrate's overhead pay for itself as the repository grows? (long growing chain, registered crossover)

Status: **DRAFT, NOT FROZEN, NOT RUN, NOT YET REVIEWED BY ANY VENDOR-DIVERSE CRITIC.** First draft (2026-10-03). Review record: `C:\workspace\PragmaWorks\gs\gs-experiment-protocol\docs\experiments\prereg\SDX-8-9-REVIEW.md` (two Claude critics only; vendor-diverse review is still owed, runbook `C:\workspace\PragmaWorks\gs\gs-experiment-protocol\docs\experiments\COPILOT-CRITIC-RUNBOOK-SDX-8-9.md`). Freezing (git tag `prereg/SDX-8-v1`, push, external timestamp) is JC's decision and requires SDX-0 closed, SDX-1 frozen (for the bytes it shares) and the SDX-8 pilot of section 9 closed. Every bracketed value `[FROM SDX-8-P]` is filled from pilot measurements before freezing; no value may be changed after the freeze. Protocol: `C:\workspace\PragmaWorks\gs\gs-experiment-protocol\docs\experiments\EXPERIMENT-PROTOCOL.md`. Parent design it extends (not edited here): `C:\workspace\PragmaWorks\gs\gs-experiment-protocol\docs\experiments\prereg\SDX-1.md` and `...\SDX-1-ARMS.md`; harness pilot `...\SDX-0.md`. Tree context (outside this branch): `C:\workspace\PragmaWorks\gs\gs-paper-tree\docs\white-paper\tree\P4-skeleton.md` and `...\TREE.md`; origin of the design: `C:\workspace\PragmaWorks\soma\docs\productivity-studies-dissection-2026-10-03.md` section 3 (H-NET-a, H-NET-b, H-NET-c). Sibling draft: `...\prereg\SDX-9.md` (one fixed spec built in stages; shares fixture family, not chains).

## 1. Question, and what it does and does not answer

SDX-1 asks whether the substrate adds state-dependent correctness over ten changes on a project small enough for a fresh session to read whole. It cannot reach the regime where the substrate is claimed to matter most (SDX-1 section 10a (a)), and it says nothing about cost over time. SDX-8 asks the question a buyer and a skeptic both ask: **the substrate costs something to set up and keep true; as the repository grows, does that overhead pay off, and from which change on?**

The part of the METR-type objection it addresses: "a heavy process adds overhead and the AI speed-up is lost as work accumulates". The studies attribute the loss to review burden, accumulating complexity and warnings, and long-horizon erosion (dissection note sections 1 and 4). SDX-8 tests the durable-cost part: does an enforced substrate keep the marginal cost of a **durably accepted** change from rising with repository size, and does cumulative cost, with its own overhead inside, fall below the comparators at a registered change?

What it does NOT answer, and the registration says so in its wording: METR's own finding (experienced humans, mature familiar repositories, tacit knowledge, review and prompting time) is untouched: this is model-only, on an invented domain, and GS cannot supply knowledge nobody wrote down (mechanisms M8, M12, M13 of the dissection note). Not a head-start claim. Not a claim that the spec or the substrate was cheap to write for a human (human authoring hours are reported, section 2.1 view V3). Not a claim about repositories beyond about 18 kLOC (regime (a2) of section 10a).

Honest prior, written before any data (protocol guard f; **DRAFT by the assistant, JC must confirm or overwrite before any data**): the substrate is slower than an expert prompt in the first ten changes (H8-c, a registered risk, not a hope); a net crossover, if any, is in the second half of the chain; "no crossover within 30 changes" is a live outcome with probability I would put near 40%. Evidence for: SX (a map collapses search cost, tier C), SlopCodeBench and the Cursor panel study (cost and complexity rise with size), DORA. Evidence against: Gloaguen and Khatri (context files add more than 20% cost without success gains at the sizes they test), CodeSeeker obsolescence note (frontier models navigate without a map at about 4x cost, which cuts both ways: reading cost grows for the comparators, but a frontier model may make the map unnecessary), no study of a heavy substrate's net effect.

Intuition in falsifiable form: "On a mid-tier coding agent extending a repository from about 3 to about 18 kLOC over 30 scripted changes, the substrate's marginal cost per durably accepted change grows at least 15% less over the chain than under an expert prompt, with or without a generic must-pass gate, and its cumulative net cost per durably accepted change falls below both by change 30." It is contradicted by H8-1 EQUIVALENT or REVERSED, or by H8-2 reporting no crossover. Versions nothing could contradict ("it pays off eventually") are not the hypothesis; the horizon is registered.

## 2. Hypotheses, readouts, falsifiers, controls

### 2.1 Readouts, defined once

Unit: one chain = CR0 plus 30 scripted changes in a fresh session each, only the repository carrying state (the SDX-1 rule), run by the same harness extended per section 4.

**Cost.** Cost of change k = all model spend of every session and every attempt for that change (retries per the SDX-1 retry rule, gate-failure loops, upkeep of the arm's own artifacts), dollars from a price table registered at freeze (input, output, cache creation, cache read; per model snapshot) so that vendor price changes cannot move the result; tokens (same four categories) and agent wall-clock are second and third currencies, reported with the same analysis, never mixed. Three cost views, always reported together:
- **V1 (registered; the verdict view):** all in-chain spend plus **Z_project**, the measured model spend of producing the project-specific bootstrap content of each arm (for A4, the base-spec-derived specs of its initial substrate; for the others zero), charged once per chain as if every chain were a new project. The reusable generic assets (A4's protocol, hooks and templates, A5's prompt, A5g's hook) are not dollars here and are reported in author hours.
- **V2 (labelled, no verdict):** V1 without Z_project (setup amortized away).
- **V3 (labelled, no verdict):** V1 plus all authoring hours of every arm priced at the BACKLOG rate of $75 per hour, charged once per chain (the one-project scenario; expected to be adverse to the substrate and reported so a reader can see how adverse).

**Durably accepted change** (all sealed, arm-blind, deterministic; no judge). Change k is durably accepted for a chain if (1) at the snapshot after change k at least `p_acc` of the change's fresh probes pass, (2) at the snapshot after change min(k+3, 30) and at the final snapshot at least `p_acc` of that change's probes that are still live (not retired or inverted by the manifest) pass, and (3) no held-out open-field probe tagged to change k fails at the final snapshot (an escaped defect cancels the acceptance of the change that introduced it). Provisional `p_acc` = 0.90 `[FROM SDX-8-P]`. Deviation from the dissection note, stated: its third criterion ("no corrective follow-up change") is dropped because the chain is scripted, and a harness-written repair request would have to describe the failing behaviour and leak the oracle; a regression instead cancels the acceptance without any repair session, and the arm pays for the erosion through lost verified output, not through free extra work. A chain whose build fails on two consecutive changes is **collapsed**: later changes count as not accepted and sessions keep running and costing (ITT); completers-only is the sensitivity.

**V_i(k)** = number of durably accepted changes among 1..k in chain i, evaluated with the look-ahead above (changes 28 to 30 use the final snapshot). **C_i(k)** = cumulative cost through change k (CR0 included, view V1 unless stated).

- **Marginal cost per durably accepted change in a window** w of ten changes (W1 = 1..10, W2 = 11..20, W3 = 21..30): m_i(w) = (C_i(end of w) minus C_i(end of the previous window, CR0 cost excluded from W1)) divided by (V_i(end of w) minus V_i(end of the previous window)), with the convention that a zero denominator is replaced by 0.5 (sensitivity: exclude those chains). Z_project and CR0 are excluded from m, so the marginal readout is about **growth**, not about amortizing a fixed cost.
- **Growth ratio** g_i = m_i(W3) / m_i(W1).
- **Net cumulative cost per durably accepted change** R_i(k) = C_i(k) / max(V_i(k), 0.5), view V1. This is the readout that **includes** the overhead and its amortization.
- **Verified throughput within a budget** VT_i(B) = V_i(k_B), where k_B is the last change completed before cumulative cost exceeds B; B = median C(30) of the cheapest arm (secondary).

**Primary readouts:** H8-1 on log g (growth of marginal cost); H8-2 on R at the registered checkpoints (the net crossover).

### 2.2 Classification of any contrast

Same classes as SDX-1 section 2.2, on the **log scale**, Delta = mean of log X minus mean of log Y per chain (negative = X cheaper), 97.5% intervals for the two co-primaries (alpha 0.025 each, Bonferroni), 95% for secondary, BCa bootstrap (10,000 replicates) and Monte Carlo permutation (100,000, seed registered), no stratification. Class names are oriented to cost: CHEAPER-RELEVANT (U < 0 and p <= minus delta), CHEAPER-SMALL (U < 0 and L >= minus delta), CHEAPER-SIZE-UNRESOLVED (U < 0, p > minus delta > L), EQUIVALENT (whole interval inside minus delta to plus delta, TOST), COSTLIER (L > 0; COSTLIER-RELEVANT if p >= delta), INCONCLUSIVE (everything else). SESOI delta = ln(0.85) in magnitude (a 15% difference), provisional. Justification to be written at the freeze, with the open point stated: a smaller saving is probably not worth a heavy process whose human authoring and upkeep time sits outside model dollars, and a 15% target is also what the planned n can resolve (section 2a).

### 2.3 Hypotheses

| ID | Role | Contrast and readout | Prediction (can fail) | Fails (falsifier) |
|---|---|---|---|---|
| H8-1 | co-primary (durability) | log g of A4 minus log g of each comparator, A5 and A5g: does the marginal cost per durably accepted change grow more slowly under the substrate. Both contrasts must be in a CHEAPER class (intersection-union, no further correction); the size class is the weaker of the two | CHEAPER (any size); range in section 2a | EQUIVALENT, COSTLIER or INCONCLUSIVE against either comparator |
| H8-2 | co-primary (net crossover) | R at checkpoints k in {5, 10, 15, 20, 25, 30}, A4 minus each of A5 and A5g, by the fixed-sequence procedure of section 8: **c*** = the earliest checkpoint in the unbroken run of rejections that ends at checkpoint 30 | a crossover exists, c* <= 30; modal location 20 to 30 (section 2a) | no rejection at checkpoint 30 ("no crossover within the registered horizon") |
| H8-c | registered risk, secondary | R(10) of A4 divided by R(10) of A5 and A5g | greater than 1 (the substrate is slower early); size reported | none; a result of at most 1 is reported as the surprise it is |
| H8-3 | secondary, mediators, no verdict alone | does anything move that should move if the mechanism is the stated one: regression-flip rate per change on carried probes, rework share (tokens in retries and gate-failure loops over total), read-token share per session, follow-on task cost (section 4.4), independent erosion metric | A4 below both comparators on the first four and on the erosion metric | mediators unmoved while H8-1 or H8-2 stands: decision row (vi) |
| H8-4 | secondary, sufficiency | SR = (log R_A5 minus log R_A5g) divided by (log R_A5 minus log R_A4) at checkpoint 30 and on log g, defined only if A4 beats A5 in a CHEAPER class | SR below 0.8 | SR at or above 0.8: the claim reduces to "any gate" |
| H8-5 | secondary, Full only | A4 minus A3 (same content in one flat file) on R(30) and log g | none pre-stated beyond "report" | none attached |

Exploratory, labelled, no verdict: the descriptive change-point fit of section 8 (c*_fit); crossover in repository size instead of index (size is controlled by the ballast, section 4.2); the second and third cost views; VT within budget; dose-response of cost on size; completers-only and unconditional analyses; the SDX-1 readouts E1-SD and E1-SI on the first ten changes of every chain (a free second measurement of SDX-1's contrast under changes 1 to 10; **not pooled with SDX-1** and counted once as one bundle, HYPOTHESES section 8); emergent-substrate counts; questions asked; judge-based escape audit (section 7).

### 2a. Pre-stated ranges, with reasons and why each could be wrong

Written before any run from public evidence only (LOGBOOK SX, TX, KX, CR, AX2, RND-1) and mechanism reasoning. Estimates, not commitments; their purpose is that a result cannot later be called "as expected" without having been stated. The chain is a mid-tier model on purpose.

| Quantity | Range | Reasoning | Why it could be wrong |
|---|---|---|---|
| g for A0 (growth-regime positive control) | 1.8 to 4, validity floor 2.0 | reading and orientation cost rise with size; SlopCodeBench and the Cursor study describe rising cost | agents read selectively and cost is dominated by generation: then g near 1 and the experiment has no growth regime (INVALID-DESIGN for H8-1 and H8-2, an honest finding about this fixture) |
| g(A4) / g(A5) (H8-1) | 0.55 to 1.00, central 0.80 | sentinel lowers read growth (SX), gates stop erosion that later costs rework | gates add cost that scales with size (test suite time, ledger upkeep): ratio above 1; frontier-like navigation by the mid-tier model: ratio near 1. The central value is near the SESOI (0.85): the modal outcome is CHEAPER-SMALL, CHEAPER-SIZE-UNRESOLVED or INCONCLUSIVE. JC should decide before spending whether a design with that modal outcome is worth its price |
| g(A5g) / g(A5) | 0.80 to 1.05 | a must-pass gate prevents some erosion, with no map | a generic gate could recover most of the effect (H8-4) |
| R_A4(10) / R_A5(10) (H8-c) | 1.10 to 1.45 | bootstrap cost, ledger upkeep, gate loops (Gloaguen: more than 20% extra cost) | the substrate may be cheaper even early if the expert prompt wastes effort |
| R_A4(20) / R_A5(20) | 0.90 to 1.25 | amortization of Z_project and bootstrap, growth effect begins | |
| R_A4(30) / R_A5(30) | 0.75 to 1.15, central 0.95 | as above, plus fewer cancelled acceptances | a longer chain would be needed if cumulative costs are still converging |
| Registered location of c* (draft prior for JC to overwrite) | none before 15; modal 20 to 30; P(no crossover) about 0.4 | the substrate is slower early, overhead amortizes, durability pays from the middle | everything above |
| Acceptance rate, A0 and A5 (share of changes durably accepted) | 0.55 to 0.90 | erosion cancels some earlier acceptances | near 1.0 (ceiling): durability is then not tested (section 2b) |

**Power.** Per-chain endpoints are log g (one number) and log R(k). For 97.5% two-sided intervals and 80% power to get a CHEAPER class at a true gap equal to delta (ln 0.85 = 0.163): n per arm = 2 (3.08 x SD / 0.163)^2. SD of log g or log R(30): 0.15 gives 16, 0.20 gives 29, 0.25 gives 45, 0.30 gives 64 (guesses; SDX-8-P measures it; SD of a ratio of window sums is probably above 0.2). Planning n = 20 per main arm detects, at 80% power, a gap of about 0.97 SD: 0.19 (about 17%) at SD 0.20 and 0.24 (about 21%) at SD 0.25. **At planning n the design can show "direction established" for a 17 to 21% saving and cannot resolve 10%.** The registered rule is "direction established", not the point estimate reaching delta (at a true gap equal to delta, P(CHEAPER-RELEVANT) is about 50%). Because H8-1 and H8-2 are intersection-union tests over two comparators sharing the A4 arm, joint power at a true gap of delta against both is roughly 0.65 to 0.70 of the single-contrast power; the fixed-sequence procedure of H8-2 needs the checkpoint-30 test to pass before any earlier checkpoint is credited, so the earlier the claimed crossover the lower its power. SD from 3 pilot chains per arm is unreliable (interval about 0.5 to 6 times); n is computed from the pooled SD (arms pooled, no contrast) and its upper 80% confidence limit, one blinded re-estimation is allowed at the interim look and can only raise n inside the approved cap. If the required n exceeds 30 per main arm, delta may be raised only with written justification before freeze, otherwise the scope is cut to Core, or the experiment is declared not worth its price (a decision for JC, section 14).

### 2b. Controls and validity gates (guard a)

- **Growth-regime positive control (A0, in every chain set):** g(A0) at least 2.0 and repository size at change 30 at least 5 times size at CR0. Otherwise INVALID-DESIGN for H8-1 and H8-2 (nothing grows; the question "does overhead pay as it grows" cannot be asked). Not a defect of the method.
- **State positive control A0S** (antecedent texts and scripted replies restated in later change texts, restating only what each state-dependent probe needs, n = 10): A0S minus A0 on E1-SD at snapshot 30 at least 20 points, the SDX-1 rule on the longer chain. Otherwise the oracle or the state regime cannot show a known effect at this length: INVALID-DESIGN for the durability readouts that rely on carried state-dependent probes (H8-3 mediators); the cost readouts H8-1 and H8-2 stay interpretable and are flagged.
- **Negative control A5b** (independent run of A5, n = 10): noise trigger on R(30) and on log g: the point difference between A5 and A5b at least delta with the 95% interval excluding zero means noise exceeds the effect: INVALID-DESIGN. Limit stated: noise is measured for A5 only; per-arm SDs are reported.
- **Negative control A4-stale** (Core, n = 10): A4 whose sentinel routing and recorded rules are wrong for a registered fraction (30% of entries, produced mechanically from the initial substrate by a script with a registered seed, identical file sizes). It must not help: if A4-stale beats A5 in a CHEAPER class on log g or R(30) as strongly as A4 does (its gap at least 0.8 of A4's), the benefit is presence and volume of files, not true content: decision row (vii); not INVALID-DESIGN.
- **Floor and ceiling:** acceptance rate (share of changes durably accepted at chain end) of A5 at or above 0.97 in 80% of chains means durability is not tested (H8-3 not interpretable; H8-1 and H8-2 stay cost-only readouts and are labelled so); acceptance rate of A4 below 0.2 means the strongest arm is at the floor and every cost-per-acceptance readout is unstable: INVALID-DESIGN. Collapse rate (chains collapsed on two consecutive build failures) above 30% in A0 flags a difficulty problem and in any arm above 50% is INVALID-DESIGN for that arm's contrasts.
- **Manipulation checks M1 and M2 and parity**: inherited unchanged from SDX-1-ARMS section 4 for A5, A5b, A4; the same leak check applies to A5g's hook (no L element beyond a generic gate; a hook that checks anything but "tests and type check pass" is a leak) and to A4-stale.
- **Circumvention** (A4 and A5g): `--no-verify`, edited tests or fixtures, forged lock hash; counts per arm; intention to treat for the verdict; above `[FROM SDX-8-P]`% the word "enforced" is withdrawn for that arm (row (xi)).
- **Invalid-design triggers** written before data, each tested by the question "which true world does this label invalid" (Lessons E.2): the triggers above, plus differential cap-hit above 10 points, canary recall above zero, model, CLI, Node or price table changed mid-window, harness persistence found, ballast hash mismatch, tamper-detection failure, probe-versioning error found in the manifest, practitioner independence or authorship rule broken.

## 3. Arms

Every change is a fresh session in a fresh configuration directory with auto-memory off, a unique repository path per chain, no resume, and only the repository carrying state (SDX-1 section 3). The harness commits after each change with a neutral message identical in every arm and never writes substrate content. Content composition, authorship, parity and leak rules: SDX-1-ARMS sections 1 to 4, **unchanged**.

| Arm | What the session gets | Origin |
|---|---|---|
| A0 naive (floor; growth-regime control) | base spec and change text | SDX-1, byte-identical |
| A5 expert minus GS (the "the expert already knows this" rival) | A0 plus the externally authored generic prompt, none of L1 to L5 | SDX-1, byte-identical (see below) |
| A5b (A/A negative control) | identical to A5, independent run | SDX-1 |
| **A5g expert plus a generic must-pass gate (new)** | A5 plus a pre-commit hook that runs the scaffold's own test command and strict type check and blocks the commit on failure; no map, no records, no ledger | new here; the enforcement-only arm that SDX-2 also needs: SDX-2 must adopt these bytes or declare a different arm under a new id |
| A4 substrate, gates in the loop | A0 plus the SDX-1 A4 initial substrate (sentinel tree, feature specs with acceptance criteria, recorded decisions, fixes ledger, spec lock, hooks, fixture ratchet, red-first, triage rule), maintained by the agent | SDX-1, byte-identical |
| A0S (positive control) | A0 with antecedent information restated in later change texts | SDX-1 |
| **A4-stale (negative control, new)** | A4 with a registered fraction of routing and rules wrong | new here, derived mechanically from A4 |
| A3 flat context file (Full scope) | A0 plus one auto-loaded file carrying G and L flattened | SDX-1 Full, byte-identical |

Scope, chosen by JC at freeze: **Core** = A0, A5, A5g, A4 (n = 20) plus A5b, A0S, A4-stale (n = 10). **Full** = Core plus A3 (n = 20). Arms are never dropped after freeze. **Deferred, not dropped:** the team-layer arm of the dissection note (B5, "substrate plus atomic commits, ADR/EDR per decision, halt-the-line, ratification points") needs an artifact definition of its own and its own review; it is a candidate linked experiment (SDX-8b) and is not in this draft. Frontier-tier and second-vendor cells are SDX-2 territory (section 10a).

**A5 at length.** A5 was written for a ten-change project. The practitioner is asked once, in writing, to attest that the prompt is intended for a project of this kind whatever its size. If they want a size-specific variant, that is arm A5-L, a separate arm with the same firewall and the same constraint, not a silent edit of A5.

**A5g's hook** is authored by the external practitioner or a second independent engineer who has not seen the substrate and does not know GS, under the brief "write the simplest generic gate a team would add so that red builds cannot be committed", hashed before any chain, and checked by the M1 leak instrument. It runs the repository's own tests, so the quality of the gate depends on the tests the agent writes; that is by design (a generic gate is as good as the tests behind it) and a stated reason A4 can beat A5g.

**Authors and independent persons (all different from JC and from any agent where stated)**

| Artifact | Author | Reviewer or check |
|---|---|---|
| A5, A5b prompt, A6 where used, A1/A3 text | the external practitioner of SDX-1 (SDX-1-ARMS section 3) | independent reviewer, M1, M2 |
| A5g hook | practitioner or second independent engineer | independent reviewer, M1 |
| A4 initial substrate | GS side, blind to change texts 1 to 30 and to the ballast | independent reviewer, parity check |
| Change texts 11 to 30 and scripted replies D3, D4 | at least 8 of 20 written by an independent person who does not know the arm artifacts; all 20 read by the independent reviewer | reviewer rewrites any text that names an implementation |
| Ballast corpus | independent author or an independent model of another vendor, reviewed by a human who is not a builder | checked: no GS vocabulary, tests green, lint clean, a stateless different-vendor judge for leaks |
| Sealed probes for changes 11 to 30, ballast probes, reference implementation, mutants | a person who is not a builder and does not design the gates | SDX-8-P validation (section 9) |
| Held-out open-field suite | shared with SDX-5 Part B; independent author | as SDX-5 |
| Follow-on tasks (section 4.4) | independent author | reviewer |

## 4. Fixture, chain and growth

### 4.1 Fixture: Pastura, shared with SDX-1

Invented domain, no public corpus, canary run cold per model (recall above zero is INVALID-DESIGN for that model); the locked scaffold (Node, TypeScript strict, `node:http`, `node:sqlite`, vitest, fixed paths and rule-function signatures), identical bytes in every arm, hash-checked after each change; Node version, model snapshot and price table pinned, no aliases. Base spec and benchmark files: `C:\workspace\PragmaWorks\gs\gs-experiment-protocol\experiments\cr\benchmark\DOMAIN_SPEC.md`, `...\oracle\`, canary `...\experiments\cr\runner\canary_probe.md`.

### 4.2 The chain: SDX-1's ten changes, then twenty more, with ballast

**Changes 1 to 10 are SDX-1's, with identical texts, order, scripted replies (D1 at 3, D2 at 7), supersession (6), reversal (9) and late independent feature (10).** SDX-8 therefore extends the same twelve-change-request family SDX-1 draws from (SDX-1 uses nine of the original twelve and adds a late tenth) to a longer growing chain. Changes 11 to 30 are new. **Ballast** is a frozen corpus of arm-neutral inherited code (about 2 kLOC per tranche, written by an independent author, with its own tests and sealed probes, no GS vocabulary, some deliberate realism: a naming convention different from the arm's, a rule implemented twice, a few unremarkable warts) that the harness merges in four tranches (T1 to T4) before the sessions of changes 11, 16, 21 and 26 as a neutral commit, and that the change text announces in identical words in every arm ("the repository has just been merged with module X from another team, directory Y"). Ballast makes size at a given index approximately **arm-independent** (about 8 kLOC of the final size come from ballast) while the arms' own code adds about 5 to 8 kLOC, so the final size is about 17 to 19 kLOC `[FROM SDX-8-P]`; the registered floor is 15 kLOC in every arm at change 30. Size at each snapshot is logged per chain. Ballast files may be edited by agents (cross-cutting changes require it); the tamper check covers the scaffold only, ballast is hash-checked on insertion. The ballast corpus is designed once and shared with SDX-4 (its S, M and L tiers are prefixes; SDX-8 uses S growing to M).

Skeleton of changes 11 to 30 (design draft; texts are written by the independent author under this generation rule: roughly 12 state-independent features and cross-cutting requests, 3 spec changes, 2 decision points, 1 reversal, 2 position controls):

| # | Change | State dependence | Stress |
|---|---|---|---|
| 11 | T1 merge plus integration of the inherited health-records module with herds | SI | reading ballast |
| 12 | cross-cutting audit log on every mutating endpoint | SI | touches all earlier surfaces |
| 13 | water-source scheduling (new surface) | SI | new surface |
| 14 | SPEC CHANGE 2: a new role supersedes the role rule of change 2 on every endpoint | SD on every earlier surface | propagation over about 13 endpoints |
| 15 | feature that uses the change-14 rule | SD | reuse |
| 16 | T2 merge plus decision point D3 (scripted reply fixes an open choice) | SI; creates D3 | decision |
| 17 | feature | SI | |
| 18 | behaviour-preserving restructure of the rules module (the text names no behaviour change) | SI | regression stress on all carried probes |
| 19 | feature that depends on D3 | SD | decision recall |
| 20 | SPEC CHANGE 3: a unit convention change on all numeric inputs and outputs | SD | propagation |
| 21 | T3 merge plus integration | SI | reading ballast |
| 22 | feature | SI | |
| 23 | decision point D4 | SI; creates D4 | decision |
| 24 | feature depending on D4 and on change 20 | SD | recall plus reuse |
| 25 | latency budget on a ballast-heavy endpoint | SI | performance |
| 26 | T4 merge plus SPEC CHANGE 4 relaxing the budget rule of change 1 | SD | propagation into ballast |
| 27 | feature | SI | |
| 28 | REVERSAL: retire the role added at change 14 (the text names no targets) | SD (everything changes 14 and 15 touched) | reversal at length |
| 29 | feature | SI | |
| 30 | late independent feature matched in size to change 4 | SI | position control |

Each change has about 8 to 10 sealed probes; fresh probes are those the change introduces, carried probes those introduced earlier. Probes are versioned at the supersession and reversal changes (6, 9, 14, 20, 26, 28): retired or inverted probes are listed in the manifest and never count as regression flips or as unmet durability.

### 4.3 Scored state and the length of a chain

The working tree after the last attempt of each change (SDX-1 rule); hooks may block commits but the scored state is the working tree. Test deletion, weakening and fixture editing are logged in every arm. Horizon CR0 plus 30 changes, registered; a longer horizon would be a new registration.

### 4.4 Follow-on tasks (the debt observable the treatment does not target)

After change 30, from the final snapshot of every chain, three frozen follow-on tasks (independent author, matched in size, touching areas modified in each arm's own chain through a registered mechanical rule, for example the three files with the most edits) are run by a **neutral executor**: the A0 prompt, no arm artifact beyond what sits in the repository. Cost and hidden-probe pass per task are mediators (H8-3), never a verdict. The repository carries each arm's persisted files, which is the realistic inheritance case and a stated limit (the executor may read them).

## 5. Model

One vendor, one mid-tier model through its headless CLI; dated snapshot id, CLI and Node versions recorded; all chains inside a short window (long chains make drift a larger risk than in SDX-1; the window is registered `[FROM SDX-8-P]` and any vendor change inside it is INVALID-DESIGN for the affected cells); arm order randomized in blocks of one chain per arm with A5b interleaved. A second vendor and a frontier cell are replications and a capacity moderator, SDX-2, not pooled. Judges (M1, parity, ballast leak, escape audit) are from another vendor than the generator; none is installed on this machine, so JC must supply API access before freezing.

## 6. Oracle (sealed, outside every repository, HTTP level)

Inherited from SDX-1 section 6 (status-class tolerance with value and list-membership checks wherever the per-change contract defines them, paired probes scored as pairs, 2xx/4xx balance overall and inside the SD subset, fields checked by the names the contract fixes, mechanical SD rule: one probe per supersession or reversal and surface listed from the reference implementation's call graph, plus one per recorded decision, frozen before any substrate artifact is designed). Extensions: probes for changes 11 to 30 and for ballast behaviours, authored by a person who is not a builder; a **reference implementation extended through change 30 plus ballast**; at least 40 hand mutants (at least 90% killed, including mutants that live only in ballast-touching code and mutants that break an earlier change when a later one is added); "always 200" and "always 4xx" stubs each at most 60%; reference at least 98%; the SD rule re-run for changes 14 to 28 before the substrate is touched. Held-out open-field suite at chain end (restart persistence, migration of a data file written by the previous change, concurrency, calendar and daylight-saving boundaries, volume), shared with SDX-5 Part B, tagged by the change whose behaviour each probe tests, never visible to any arm.

**Convention tolerance and gaming.** An always-4xx server fails the paired probes; a probe may not reward one resolution of a decision point (D3 and D4 probes accept the scripted resolution and are checked by the independent reviewer for neutrality); the oracle checks behaviour only, never structure, never names beyond the contract. Targeted metrics (A4's own sensors: criteria-ledger coverage, hook blocks, layer violations when a gate enforces them, test counts) are reported labelled "targeted" and never carry a verdict. **Untargeted erosion metric:** duplication and cognitive complexity measured by a tool that is installed in no arm and run by no gate (chosen from a list at freeze after the list of A4's sensors is fixed), taken at every checkpoint (secondary, H8-3).

## 7. Judges

No primary readout is judged. Both co-primaries use deterministic sealed probes and recorded costs only. Judges (a different vendor, two vendors for any judged number, B11 validity first) are used for: M1 leak and parity classification, the ballast leak check, and a **secondary independent audit of every final repository** (escaped-defect and erosion findings that the probes cannot see), reported beside the deterministic open-field result, a human spot-check of a registered fraction, no verdict. Deterministic scripts replace judges wherever they can decide.

## 8. Analysis plan, exactly as registered

1. Controls, manipulation checks and INVALID-DESIGN triggers (sections 2b and 9) before any contrast.
2. **H8-1.** Per chain compute log g. Contrast A4 minus A5 and A4 minus A5g (the two comparators are fixed now, not chosen after the data). Classify each (section 2.2); H8-1 holds in the weaker of the two classes (intersection-union).
3. **H8-2, the crossover, by a fixed-sequence procedure (no alpha spending, order fixed now).** Per chain compute log R(k) at k in {30, 25, 20, 15, 10, 5}. Test in that order. At each checkpoint the step passes if both contrasts (A4 minus A5 and A4 minus A5g) have a 97.5% BCa interval with upper limit below zero (A4 cheaper in both). Stop at the first step that fails. **c\*** = the earliest checkpoint of the unbroken run of passing steps that ends at 30. If checkpoint 30 fails, the registered statement is "no crossover within the registered horizon" with the class at 30. Fixed-sequence testing keeps the familywise level at 0.025 without correction, at the price that an early crossover cannot be credited unless the later checkpoints also pass; that is intended ("crossed and stayed crossed").
4. **Descriptive change-point fit (c\*_fit; no verdict).** At every change k from 3 to 30 compute D(k) = mean over chains of log R_A4(k) minus mean over chains of log R_comparator(k); fit a continuous piecewise-linear curve with one knot tau on the grid 6..28 by least squares; c*_fit = the first k at which the fitted D(k) is at or below zero and stays so; 95% interval by chain-level bootstrap (10,000 replicates, seed registered, chains resampled within arm). The decision rows use c* only; if c*_fit and c* differ by more than one checkpoint step the result says so and nothing is chosen after the fact. A crossover in repository size is reported by mapping c* and c*_fit through the arm-neutral ballast schedule (exploratory).
5. Secondary: H8-c, H8-3 (mixed logistic model on regression flips; log cost per change on arm times log size with a random intercept and slope per chain), H8-4, H8-5 (Full), VT within budget; views V2 and V3; ITT and completers-only; contrast-by-readout table (where the cost currency points to a different decision row the result says "currency-dependent" and nothing is strengthened).
6. Exploratory list as in section 2.3. No further correction; nothing in the secondary list carries a verdict.

## 9. Pilot (SDX-8-P), stopping rules and interim look

**Why a pilot of its own.** SDX-0 validates the ten-change harness; it has no ballast, no changes 11 to 30, no long-chain oracle and no cost data at 15+ kLOC. SDX-8-P is a registered pilot (tag `prereg/SDX-8-P-v1`, no hypothesis tested, data excluded from SDX-8): A0, A5, A5g, A4 at k = 3 chains each (12 chains, about $320 to $940, hard cap $1,000). Pass criteria, none refer to which arm is better:

| ID | Criterion | If failed |
|---|---|---|
| W1 | All arms complete all 31 steps with infrastructure failure below 10% of sessions; V13-type persistence check passes over a 31-step chain | fix harness, rerun cells, disclose |
| W2 | Ballast: tranches pass their own tests and probes at insertion, hash matches, no GS vocabulary (judge), size at change 30 at least 15 kLOC in every arm | repair ballast; if not repairable the growth regime cannot be built: stop and redesign |
| W3 | Oracle validation of section 6 (reference at least 98%, stubs at most 60%, at least 90% of 40 mutants killed, versioning manifest complete) | repair oracle first |
| W4 | Growth: g(A0) at least 2.0 in at least 2 of 3 chains | amend ballast or horizon before freeze, or the experiment is declared the wrong experiment (row (x)) |
| W5 | Acceptance rate of A0 and A5 below 0.97 and of A4 above 0.2 (floor and ceiling of 2b) | amend changes or `p_acc` before freeze |
| W6 | Cost per chain within 3x of the estimate of section 11; differential cap-hit at most 10 points | amend budget or scope before freeze |
| W7 | A5g hook leak check (M1) and A4-stale construction check pass; circumvention counters work | fix artifact or detector |
| W8 | SD, collapse rate and pooled SDs of log g and log R(30) measured (information, not pass/fail): they fix n and delta | |

**Fixed n and stopping rules.** Fixed n per arm at freeze, no optional stopping, no extra chains after seeing outcome data, except the single blinded variance re-estimation (section 2a). One interim validity look at about half the chains by a script that prints only flags (never arm-level outcomes): growth regime present yes/no, ceiling or floor yes/no, harness failure rate above 15% (action: fix and rerun the affected cells, disclose), cost above 2x of the estimate (action: stop and amend the budget with JC), differential cap-hit, canary, A5 and A5g emergence counts. Budget: if the pilot's cost per chain exceeds 3x the estimate, amend before freeze. A chain is never stopped for cost; a chain that hits a per-session cap is logged.

## 10. Decision table (registered)

Rows are assigned by the pair (H8-1, H8-2) after the validity row is cleared. "Positive" means any CHEAPER class with the size class stated. **The validity audit (re-run of the stage-2 construct questions, controls, oracle, harness logs, arm artifacts) is mandatory for every verdict row, favourable ones included**; the falsifiability audit of the intuition is added whenever a result contradicts field experience. Tiers assume freeze and external timestamp precede data. "Claim the paper and offer may then make" is a scope-bound permission, not sales copy.

| Row | Observed | Permitted conclusion (this construct, vendor, model, invented chain of 30 changes to about 18 kLOC) | Claim permitted | Forbidden conclusion |
|---|---|---|---|---|
| (v) INVALID | Any trigger of 2b or 9: growth control g(A0) under 2.0; A5 vs A5b noise; floor or ceiling; ballast or oracle defect; leak; differential cap-hit; model, CLI, Node or price change mid-window; persistence found; independence rule broken | `INVALID-DESIGN`, naming the trigger; redesign and register a linked experiment | none; not cited either way | any conclusion about the substrate, the expert prompt or the crossover |
| (i) | H8-1 positive and H8-2 crossover at c* <= 15 | cumulative cost with overhead falls below both comparators early and stays below; marginal cost grows more slowly. Sizes with intervals; location of c* with its interval | "On this fixture and model the substrate's setup and upkeep were repaid by change [c*] in cost per durably accepted change." Scope stated | that it pays on production repositories, or in any other regime of 10a; initial speed |
| (ii) | H8-1 positive and H8-2 crossover at 20 to 30 | as (i), later; the substrate is slower early (H8-c size reported) and repaid late | "repaid by change [c*] of 30, slower before" | as (i); extrapolating beyond 30 |
| (iii) | H8-1 positive, H8-2 no crossover at 30 (checkpoint 30 not CHEAPER) | the growth is slower under the substrate but the overhead is not repaid within 30 changes; **no extrapolation** (a longer horizon is a new registration, regime (f) of section 10a) | "marginal cost grew more slowly; net crossover not reached within 30 changes" | "it eventually pays off"; "it never pays off" |
| (iv) | H8-1 EQUIVALENT and H8-2 no crossover (class at 30 EQUIVALENT) | within this horizon the substrate neither paid nor cost 15% more: its value, if any, lies outside this construct (governance, audit, regeneration, correctness under change in SDX-1/SDX-3). **Contradicts field observation: falsifiability audit mandatory** | the offer sells assurance and governance evidence, not lower cost; the paper drops "the overhead pays off" | "the substrate is useless"; rescue by regimes not pre-registered in 10a |
| (iv-b) | H8-1 or H8-2 COSTLIER-RELEVANT at 30 (A4 costlier than a comparator) | gate friction and upkeep exceeded the benefit at this size and horizon; cost becomes central | as (iv) plus a stated cost caveat on enforcement | rescue beyond 10a |
| (vi) | H8-1 or H8-2 positive but mediators (H8-3) unmoved: regression flips, rework share, read share, follow-on cost, erosion tool all at or above the comparators | the effect stands but the stated mechanism is not what produced it; the causal story is refuted for this version | the cost result only, without a mechanism | a mechanism claim; "durability" |
| (vii) | A4-stale gap at least 0.8 of A4's | the benefit follows presence and volume of files, not true content; the ledger, routing and records story is refuted for this version even if cost stands | the cost result with that qualification | "true project state is what pays" |
| (viii) | H8-4 sufficiency ratio at or above 0.8 (A5g recovers most of A4's gain) | the claim reduces to "any must-pass gate"; the substrate as a bundle is not shown necessary | "a generic must-pass gate captures most of the cost effect on this construct" | "the substrate pays off" |
| (ix) | A4 beats A5 but not A5g (or the reverse of the ratio) | as (viii) with the sign stated | as (viii) | as (viii) |
| (x) | The experiment turns out to be the wrong one: no growth regime (W4 or 2b), durability untestable (acceptance at ceiling), ballast unrealistic or leaking, horizon too short for any arm's cost to move | `INVALID-DESIGN` or `ABANDONED` / `SUPERSEDED-BY` with the named defect; linked redesign (for example a longer horizon, a larger ballast tier, or SDX-4 first) | none | counting it as support or as refutation |
| (xi) | A4 circumvention above `[FROM SDX-8-P]`% | verdict kept under ITT; the word "enforced" withdrawn for A4; per-protocol sensitivity | verdict with that wording | calling A4's gates enforced |
| (xii) | A4 cheaper only in view V2 (setup excluded) or only in tokens (not dollars) | refuted on net terms in the registered view V1; currency-dependent otherwise | the V1 statement | quoting V2 as the result |
| (xiii) | Opposite sign at every checkpoint and for log g | the substrate slows delivery on this construct; report plainly | none | softening |
| (xiv) | Result contradicts field experience (any row) | both audits, logged, before anything else | none until done | dismissal of the result or of the experience without the audits |

### 10a. Regimes pre-registered as untested (the only ones that may be named after rows (iii) to (iv-b))

(a1) A repository beyond about 18 kLOC and a ballast of one kind (SDX-4's L tier at 60 kLOC is a separate registration); (a2) human developers, review burden, tacit knowledge and mature familiar repositories (METR-type results are not the target); (b) multiple contributors; (c) governance and audit outcomes (SDX-3); (d) weaker and frontier models (SDX-2), second vendor; (e) the team-layer practices (SDX-8b, deferred); (f) a longer chain. Naming one is a statement of what was not tested; a claim about it needs its own registered experiment.

Honest limit across every row: a win shows cost per durably accepted change on a 30-change invented project with ballast, one vendor, a mid-tier model, not the productivity of software teams; a null shows only that this design did not find it.

## 11. Cost and time (estimate; replace from SDX-8-P)

Sessions = chains x 31 steps (CR0 plus 30) x about 1.25 attempts = about 38.75 per chain. Session cost: SDX-1's anchor is $0.4 to $1.2 at 2 to 3 kLOC (measured anchor $0.43 for a substrate session); size-driven reading is assumed to raise the chain average to $0.7 to $2.0 (a guess; the growth question is the experiment). Per chain about $27 to $78 (the dissection note's extrapolation was $18 to $56 and "up to double", consistent). **Core:** A0, A5, A5g, A4 at 20 plus A5b, A0S, A4-stale at 10 = 110 chains, about 4,260 sessions, about $2,980 to $8,530; follow-on tasks (3 per chain at about $1 to $3) $330 to $990; judge audit $110 to $330. **Core total about $3,400 to $9,900.** **Full** adds A3 at 20: 130 chains, total about $4,000 to $11,500. If the pilot requires n = 29 per main arm: Core 146 chains, about $4,500 to $12,800; n = 45: 210 chains, about $6,500 to $18,000 (probably not worth buying; see section 14). Pilot SDX-8-P: $320 to $940 (cap $1,000), not included. Wall clock 40 to 100 hours with 3 to 4 chains in parallel (gate waits at size). Preparation, the larger cost: ballast 50 to 80 agent-assisted hours (shared with SDX-4, counted once), changes 11 to 30 and scripted replies 10 to 15, extended oracle, reference implementation and mutants 60 to 100, A5g hook 4 to 8, harness extension (ballast injection, 31-step runner, checkpoint durability scorer, follow-on runner, size logger, erosion tool) 30 to 50: about 160 to 250 agent-assisted hours, plus about 12 to 20 hours of independent-author time, about 10 hours of the independent reviewer and about 12 hours of JC's judgment time. All guesses until SDX-8-P measures them.

## 12. Threats to validity (declared)

Proponent-authored substrate, sensors, oracle and change list (mitigations as SDX-1: registration, external practitioner, mechanical SD rule frozen before the substrate exists, substrate builder blind to the change texts and the ballast, parity and leak checks, independent reviewer, independent authors for ballast and at least 8 of 20 new texts, published artifacts, an independent rerun as next step; not eliminated). Authoring asymmetry between A4 (GS side) and A5, A5g (outsider). **Ballast realism and neutrality:** inherited code written by one independent author is not the diversity of real repositories; its conventions may happen to suit one arm's sentinel; ballast probes and tests are independent of arms. **Index is confounded with size and with ballast schedule**; size is approximately arm-neutral by construction and logged, but index-based comparisons are about this schedule. **Durable acceptance depends on later changes**: a legitimate later change that breaks earlier behaviour is handled by probe versioning; an error in the manifest would charge arms unequally, so versioning is checked in SDX-8-P and audited before analysis. **Cost depends on pricing and caching behaviour**; the price table is pinned and tokens are reported as second currency. **A4's cost may be dominated by gate wait and test-suite time at size**, which dollars do not capture; wall-clock is reported. **Long window:** model drift and vendor changes over a long run (pin and log; INVALID-DESIGN if the snapshot changes). **A5 at length** (attestation, section 3). **The comparators are chosen by us** (A5, A5g); a better advisory arm may exist (a larger A5 with explicit "keep notes" instructions is A1 or A6 territory, Full scope in SDX-1, not here). **Chains from one fixture are not independent confirmations;** SDX-8 and SDX-1 share changes 1 to 10 and counted once. **Toy scale and invented domain:** at most 18 kLOC. **The ratio estimand** (window sums, zero-denominator convention) is noisy; the SD is measured in SDX-8-P and the convention is a registered sensitivity. **Model-only:** misses novelty and abandonment, prompting and waiting time, tacit knowledge and over-trust (dissection note 3.6); GS does not address the first three and the paper says so. **Intersection-union and fixed-sequence procedures are conservative**; low power for early crossovers is a property of the design. **Modal outcome near the SESOI** (section 2a). **Vendor-diverse critique has not happened**; the two Claude critics of SDX-8-9-REVIEW share training.

## 13. Dependencies and sharing with SDX-0 and SDX-1 (and what it implies for the critic counter)

**Depends on SDX-0:** harness (isolation V13, tamper V3, scorer snapshots), oracle machinery with reference implementation, stubs, mutants (V2), mechanical SD rule, cost and variance measurements, the A5 leak and strength checks. SDX-0 must be closed before SDX-8-P; SDX-8-P must be closed before SDX-8 freezes. **Depends on SDX-1 only for its bytes, not for its result:** SDX-8 needs SDX-1 frozen so the shared artifacts are fixed. It does not wait for SDX-1's outcome. If SDX-1 is rescaled to Core, merged into SDX-8 (decision D6 of the tree) or has its arms changed, the sharing table below is rewritten and SDX-8's review reopens on the affected part.

| Item | Shared with SDX-1 | SDX-8 treatment |
|---|---|---|
| Pastura, scaffold, canary, model, harness | yes, identical | unchanged |
| Changes 1 to 10, D1, D2, probes 1 to 10, SD rule, manifest | yes, identical | unchanged; probes carried into longer chain |
| A0, A5, A5b, A0S, A4 initial substrate, A3 (Full) | yes, byte-identical | unchanged; frozen hashes of SDX-1 |
| Practitioner, independent reviewer, M1 and M2 | yes | same persons; one added attestation (A5 at length) |
| Changes 11 to 30, D3, D4, ballast, probes 11 to 30, extended reference implementation and mutants, held-out suite (shared with SDX-5), follow-on tasks, A5g hook, A4-stale, durability scorer | no | new, owned by SDX-8 |
| Chains | no | no SDX-1 chain is reused; the first ten changes of an SDX-8 chain repeat SDX-1's conditions (exploratory second measurement, not pooled, counted once) |

**Implication for the SDX-1 critic counter (ROLES section 6).** SDX-8 is its own registration, so its drafting and its critic rounds do not reset SDX-1's consecutive-clean-round counter, and nothing in SDX-1, SDX-1-ARMS, SDX-0 or the SDX-1 critic runbook materials is edited by it. The converse binds: (1) a **structural change to any shared artifact made under SDX-1** (arm text, A4 substrate, oracle or SD rule, change 1 to 10, decision-table row) reopens the corresponding part of SDX-8 and SDX-9 review, because they inherit the bytes; wording changes do not. (2) Shared artifacts are reviewed under SDX-1's rounds and are **not re-reviewed** in SDX-8's rounds; SDX-8 critics see only the SDX-8 text and cannot check byte-identity, which is stated in the review record. (3) If SDX-8 needs a different version of a shared artifact (for example a substrate extended for a 30-change chain), that is a **fork under a new id** (A4-long) with its own review, never an edit of SDX-1's file. (4) A critic finding on SDX-8 that implies a change to a shared SDX-1 artifact is logged as a cross-registration finding and routed to SDX-1's adjudication, not applied inside SDX-8.

## 14. Open items before freezing (decisions)

1. Confirm or overwrite the draft prior of section 1 and 2a (guard f): the registered location of c* and P(none).
2. Decide whether SDX-8 is worth its price: the modal outcome of H8-1 is near the SESOI and, at planning n = 20, only a 17 to 21% saving is resolvable (section 2a); n of 29 to 45 costs $4,500 to $18,000. Option: freeze Core at n = 20 and accept "direction established" or INCONCLUSIVE.
3. Delta (15%) with written justification; `p_acc`; n from SDX-8-P.
4. Co-primary or primary-plus-secondary: the P4 skeleton registers the crossover as a secondary of P4 and the slope as primary; this draft registers growth (H8-1) and crossover (H8-2) as co-primaries of SDX-8. JC decides and the tree is updated accordingly.
5. Name the independent author of the ballast and of change texts 11 to 30, the independent engineer for A5g, the second reviewer.
6. Different-vendor critic round (runbook) and different-vendor judge API access; budget approval; scope Core or Full; vendor, dated snapshot, price table and Node version at freeze; external timestamp route.
7. Whether SDX-8b (team-layer arm) is drafted next.

## 15. Registration checklist

Commit and tag `prereg/SDX-8-v1`: this file, SDX-1 and SDX-1-ARMS hashes (shared bytes), change texts 1 to 30 and order, ballast corpus and tranche schedule with hashes, scaffold hash, oracle with probe manifest and versioning, reference implementation and mutants, held-out suite hash (not content), A5g hook, A4-stale generator and seed, price table, durability scorer and analysis scripts with seeds, checkpoint list, model snapshot, CLI and Node versions, delta, n, `p_acc`, deviations log (empty), SDX-8-P report. Build with `C:\workspace\PragmaWorks\gs\gs-experiment-protocol\scripts\build-frozen-package.js` and follow `C:\workspace\PragmaWorks\gs\gs-experiment-protocol\docs\experiments\PREREG-HOWTO.md`. Log tag, commit, DOI or URL, date and archive SHA-256 in `C:\workspace\PragmaWorks\gs\gs-experiment-protocol\docs\experiments\LOGBOOK\README.md`.
