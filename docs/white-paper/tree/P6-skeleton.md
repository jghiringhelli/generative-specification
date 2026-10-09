# Trunk P6 skeleton: spec-to-implementation throughput, in stages, to COMPLETE and verified (2026-10-03)

Status: PROPOSAL (JC's addition of 2026-10-03). Nothing here is registered, run or frozen. Companion to `C:\workspace\PragmaWorks\gs\gs-paper-tree\docs\white-paper\tree\TREE.md` (card P6, orthogonality ledger section 5). Experiment id proposed: **SDX-9** (SDX-8 is already reserved in the tree for P4's long chain, so P6 takes the next unused id; ids are never reused). The protocol branch (`C:\workspace\PragmaWorks\gs\gs-experiment-protocol`, another worktree) is NOT edited by this branch; a paste-ready BACKLOG entry is in section 10 for JC to carry over.

Inputs: `C:\workspace\PragmaWorks\soma\docs\reports\2026-10\productivity-studies-dissection-2026-10-03.md` (sections 1 to 3, mechanisms M1 to M14, H-NET), `C:\workspace\PragmaWorks\gs\gs-experiment-protocol\docs\experiments\HYPOTHESES-2026-10-02.md`, `...\BACKLOG.md`, `...\prereg\SDX-1.md`, `...\prereg\SDX-1-ARMS.md`.

## 1. The claim, in one sentence

Given a fixed, reviewed set of specification documents with acceptance criteria, how fast and at what cost does a coding assistant under each regime reach each stage's completeness criteria, where "reached" is decided by a frozen scorer and not by the author or the assistant, and how many defects escape after the final stage is declared complete?

What it is NOT: not a head-start claim (the substrate has setup and upkeep cost that is counted inside); not a claim about change over time (that is P4); not a claim that the spec was cheap to write (the spec is an input; the cost of producing it is outside this trunk and is reported as not measured); not a claim about human developers (the model-only version comes first; the field version is `FIELD-STUDY-TEAMS.md`).

It is the second of the two translations (spec to code and pipeline; the first, intent to spec, is outside) in the two-translations framing: it asks how well the machine-cheap translation behaves under each regime.

## 2. Setup

- **Fixed input.** One specification package, authored and reviewed before any run by people who are not the builders: product description, feature specs, each with numbered acceptance criteria (stable ids), non-functional requirements, a deliberately small set of planted ambiguities with scripted product-owner answers (registered before data, so that asking a question and waiting is distinguishable from guessing), and the spec's own declared completeness estimate q (the share of the intended behaviour the authors claim the criteria cover; the definition of "spec completeness" is in Compendium section 8.19, wording to be checked). All arms receive identical information content. No arm receives the sealed probes.
- **Fixture.** Pastura-full (invented domain, non-memorized, cold canary logged), the locked scaffold and the sealed convention-tolerant oracle of SDX-0, extended so that every acceptance criterion has at least one sealed executable probe and every probe carries the criterion id and stage tag. Size: large enough that the build does not fit in one session (provisional: at least 60 criteria; final size from SDX-0 variance). Authoring: probes by someone who is not a builder and does not design the gates.
- **Unit.** One chain = one build from an empty repository plus the spec, run by a stateless harness that opens fresh sessions until the stage-scorer reports S4 verified or the budget cap is hit. Sessions are fresh; only the repository carries state (the SDX-1 rule).
- **Builder and scorer separated.** The assistant may claim "stage k complete" at any time (the claim time is logged). The stage is declared by the scorer script only. The gap between claim and verdict is itself an outcome (false-complete).

## 3. The stages and their machine-checkable completeness criteria

Each criterion of the spec is tagged to exactly one stage by an independent reviewer before data, by a written rule. A stage is **verified complete** when all four checks below pass at the same checkpoint and still pass at the next checkpoint (stickiness: a stage that regresses is re-opened and the lost time is charged).

| Stage | What it covers (tagging rule) | (a) acceptance-criteria coverage by sealed probes, over criteria tagged to this stage and earlier | (b) executed behavioural checks | (c) gates | (d) open-questions gate |
|---|---|---|---|---|---|
| S0 skeleton / walking slice | the thinnest end-to-end path through every layer (one create, one read, the process starts, one persisted record) | 100% of S0 criteria | clean-clone build and start succeeds; one real HTTP round trip | build and type check green | zero planted ambiguities that block S0 left unasked |
| S1 core behaviour | the remaining happy-path behaviour of every feature | at least 1 - d1 of S0+S1 criteria (provisional d1 = 0.05) | the sealed S1 probe suite runs black box over HTTP | S0 gates plus own tests green | every ambiguity touching S1 asked and answered or recorded |
| S2 edge cases and non-functional | validation and error paths, boundaries, pagination, idempotence, latency and size budgets stated in the spec | at least 1 - d2 of S0..S2 (provisional d2 = 0.10) | the NFR probes (latency, size) executed on a real data volume | lint and static checks green; no new gate failures versus S1 | all S2 ambiguities closed |
| S3 hardening and verification | the real-runtime classes from an external defect taxonomy: persistence across restart, migration of data written by the previous build, concurrency, calendar and encoding boundaries | at least 1 - d3 of S0..S3 (provisional d3 = 0.10) | open-field execution: real process, real data file, restart, network boundary (the H-PHASE definition), by a stateless executor that sees no manifest | all gates green on a clean clone; measured line and branch coverage above a floor registered from SDX-0; the independent unit suite (D2b) passes | no open question |
| S4 release-ready | everything above, plus run-from-clean-clone documentation executable by a stranger script, no failing or skipped probe, no unresolved gate waiver | at least 1 - d4 of all criteria (provisional d4 = 0.05) | the full sealed suite plus a clean-clone installation script | all gates green on a clean clone | empty |

The thresholds d_k are the **pre-declared allowed deviations**; they are provisional placeholders to be justified at freeze from SDX-0 measurements (SESOI discipline of SDX-1 section 2.2 applies). Coverage by the arm's own tests (criteria-coverage ledger) is reported as **targeted** (the substrate states it) and never carries a verdict; only sealed probes decide.

## 4. Margins (tolerance bands registered before data)

1. **Completeness band from the spec itself.** The spec declares q before data. Post-S4 escaped defects are expected, by the spec's own admission, at a rate related to 1 - q. The pre-registered band for "escapes" is [ (1 - q) - delta_e, (1 - q) + delta_e ] on the held-out post-complete suite (provisional delta_e = 0.05). Escapes at or below the band: **within the spec's admitted incompleteness**. Above the band: **premature COMPLETE** (the arm declared and verified done while more is wrong than the spec said it left out).
2. **Stage deviation d_k** (section 3), the allowed shortfall per stage.
3. **Budget band per stage.** Reference cost B_k = the SDX-0 pilot median cost of the cheapest arm to reach stage k. Each arm is reported against bands 1 to 1.5x, 1.5 to 3x, beyond 3x (cap). A chain that does not reach a stage by the cap is censored there (survival analysis), never dropped.
4. **Open-question margin.** Zero unresolved questions at S4; a registered number allowed at earlier stages.

## 5. Outcomes

Per chain, per stage, in every currency:

- time (agent wall-clock; sessions; in the human version developer minutes), tokens (input, output, cache creation, all attempts, including setup and upkeep of the substrate), dollars;
- **interventions**: scripted product-owner replies used, gate-failure loops, restarts and rollbacks, harness nudges (a nudge is a defined event, not free text);
- claim time versus verified time per stage (false-complete delta; share of premature claims);
- regressions of an earlier stage after it was verified (re-opened stages);
- **verified throughput** VT = criteria-weighted verified criteria per dollar and per token, at each stage and cumulatively;
- **escaped defects discovered after S4**: by a held-out post-complete suite (real-runtime classes and held-out variants of acceptance criteria, authored independently) plus an independent audit of the final repository by two stateless judges from other vendors with a human spot-check (judge validity B11 first).

**Primary (one per trunk):** cost (dollars, with tokens as second currency) to **verified COMPLETE** (S4 verified and escapes inside the band), as a restricted-mean or hazard analysis with censoring, arm by stage. Everything else is secondary or targeted. The crossover (section 7) is a registered secondary.

## 6. Arms

| Arm | Description | Map to existing arms | Why |
|---|---|---|---|
| C1 | AI plus a generic harness (agent product default, the spec package, no repository-resident discipline) | A0 | the floor |
| C2 | AI plus an expert prompt written by an external practitioner who does not know GS, delivered every session | A5 | the "the expert already knows this" rival |
| C3 | AI plus the GS substrate delivered as persisted structure, with the gates present but advisory (sentinel, criteria ledger with ids, decision records, lock; scripts exist, nothing blocks) | new, proposed A4-adv | separates structure from enforcement |
| C4 | AI plus the GS substrate with enforced gates (executed gates, criteria-coverage gate, open-questions gate, halt on failure) | A4 | the substrate |
| C5 (optional) | C2 plus a generic must-pass hook (tests and lint green to proceed) | enforcement-only arm of SDX-2 | separates "any gate" from "the substrate" |

Substrate construction rule: the sentinel and the criteria ledger are generated mechanically from the spec package by a script, so C3 and C4 do not receive more information than C1 and C2; the generation cost is counted at S0. One mid-tier model as primary plus a frontier cell (capacity moderator); pin model versions and log any vendor change.

## 7. The honest prior and the registered crossover

The substrate has an overhead: it is expected to be **slower or no faster** at S0 and S1 than C2 (setup, ledger generation, gate loops; Gloaguen et al. report more than 20% extra cost from context files without a success gain, the dissection note section 1.13). The claim is about reaching COMPLETE and verified, not about a head start. The registered question is at which stage, if any, cumulative cost with all setup and upkeep inside crosses below the comparators:

- **Crossover stage c\***: the first stage k at which C4's cumulative cost to verified stage k is at or below C2's and C3's with the 95% interval excluding zero difference in the wrong direction. Prior (to be written down by JC before any data, protocol guard f): no earlier than S2; modal S3 (where machine-checkable evidence of the real-runtime classes is cheap when gates exist and costly to discover otherwise); and "none by S4 within the cap" is a live outcome, not a failure of the method's honesty.
- **Registered risk (H-P6-c):** in S0 and S1 the substrate is slower than the expert prompt; the size is reported.
- Two further registered hypotheses: **H-P6-a** the false-complete rate (claim ahead of verdict) is lower under C4 than under C1 and C2; **H-P6-b** escapes after S4 are inside the band under C4 and outside it under C1 and C2.

## 8. How P6 differs from P4, and the distinguishing prediction row

| | P4 durability (SDX-1, SDX-2, SDX-8) | P6 spec-to-implementation (SDX-9) |
|---|---|---|
| Question | does quality erode as change requests accumulate | how fast and at what cost does a build reach COMPLETE and verified |
| Input | a stream of change requests, revealed one at a time, with scripted replies; the spec evolves | one complete reviewed spec, fixed from the start |
| Time axis | change index along a chain (K = 9, then 30) | stage index inside one build (S0 to S4) |
| Repository | starts from a base, grows by changes | starts empty, grows to the spec |
| Primary outcome | slope of regression flips on sealed carried probes and an independent erosion metric | cost to verified COMPLETE with escapes inside the band |
| Failure it detects | erosion, regressions, forgotten decisions | premature completion, false claims of done, escapes |
| Components that carry it | L4 ratchet; L2 and L5 secondary | L2 criteria ledger (completion accuracy), L4 gates (verified evidence at S3 and S4), L1 (cost at S2 and later) |
| Components predicted to do nothing | L1 alone | L5 lock and L3 decision records (the spec does not change; few decisions) |
| Ends | at the horizon K | at S4 verified or the cap |

A positive P4 with a negative P6, or the reverse, is possible and informative: a substrate that preserves quality under change but slows delivery to COMPLETE (value is durability); or one that reaches COMPLETE more reliably but then erodes as fast as the others (value is assurance at delivery). Reported separately.

**Distinguishing row for the prediction matrix** (added to TREE.md section 5 and to the dissociations in `HYPOTHESES-2026-10-02.md` section 8 when the protocol branch is next edited):

| Component | P4 predicts | P6 predicts |
|---|---|---|
| L1 sentinel | little (single-change reading is P1) | lowers cost at S2 and later as the repository grows beyond a session; none at S0 |
| L2 criteria ledger and ids | secondary | lowers the false-complete rate and the criteria missed at S1 and S2 |
| L3 decision records | carries "why was this decided" over time | little (few decisions; the spec is fixed) |
| L4 executed gates | carries the slope | carries verified S3 and S4 and the escapes band; costs time at S0 and S1 |
| L5 coherence lock | secondary | nothing (no spec change to drift from) |

If removing L5 and L3 changes P6 as much as removing L2 and L4, the dissociation fails and P6 is the same effect as P4 measured differently, counted once (HYPOTHESES section 8).

**Overlap with P1** (cost): P1 isolates read cost by manipulating size on single-change sessions; P6 holds the spec fixed and lets size grow endogenously. P1's primary stays tokens per accepted change across S, M, L; P6's cost is to COMPLETE. Declared, not hidden. **Overlap with SDX-8**: SDX-8 is a growing-repository chain of 30 change requests with a crossover in change index; SDX-9 is a single-spec build with a crossover in stage. They share the fixture, the oracle and the arm manifest; they do not share chains; the S4 repositories of SDX-9 may seed SDX-8 chains only if declared, and then count once.

## 9. Refutation criteria and controls

Registered rows (thresholds provisional):

1. C4 does not reach verified COMPLETE at lower cost than C2 and C5 by the SESOI with the interval excluding it, and no crossover stage exists: "faster to COMPLETE" is refuted for this fixture, model and cap.
2. C5 (any generic gate) recovers at least 0.8 of C4's gain (sufficiency ratio, HYPOTHESES section 9): the claim reduces to "gates".
3. C4 wins only when setup and upkeep are excluded: refuted on net terms (the with-setup view is the registered one).
4. C4 reaches S4 faster but escapes exceed the band: counted as refuted at constant quality ("complete" was not verified).
5. The false-complete rate does not differ: the criteria ledger story is refuted even if cost differs.
6. Opposite sign at all stages: report plainly.

Controls: **positive** (a dose check: a halved-budget arm must reach fewer stages; and a scorer sensitivity check on planted mutants with known stage, which the scorer must grade correctly); **negative** (an A/A repeat of C2; a stale-ledger arm whose criteria ids are wrong for a registered fraction, which must not help); **floor and ceiling** (C1 must not reach S4 at under the cap in every chain, nor fail S0 in every chain: otherwise INVALID-DESIGN for that stage); **invalid-design triggers** written before data and each tested by "which true world does this label invalid" (Lessons E.2).

## 10. Practicalities

- **Order and gates.** Depends on SDX-0 (harness, oracle with criteria tags), the expert-prompt author (shared with SDX-1), the independent reviewer (tags, probes) and B11 for the audit of escapes. Does not depend on SDX-1 outcomes. It can be drafted in parallel with the SDX-1 critic rounds because it is its own registration (adding it to SDX-1 would be structural and reset the critic counter, ROLES section 6).
- **Cost (extrapolation from BACKLOG prices, not a quote):** a chain is longer than an SDX-0 chain; plan roughly $15 to $60 per chain, 4 arms times 20 chains = 80 chains, about $1,200 to $4,800 of model spend, plus about 80 to 120 agent-assisted hours to author the spec package, probes and the held-out suite, plus the independent reviewer. A frontier cell and the optional C5 only after a first result.
- **Venues.** ESEM, EMSE; IEEE Software for a practitioner version (this is the claim a buyer asks for; it must be written at its tier). Earliest data: after SDX-0, plausibly Q1 to Q2 2027; submission after SDX-1 and SDX-9 pilots, not before the UOC application window closes (so no acceptance is promised for it).
- **Paste-ready BACKLOG entry for the protocol branch (not applied here):** "B17. SDX-9, H-P6, spec-to-implementation throughput in stages: DRAFT. Fixed reviewed spec with numbered acceptance criteria, sealed probes with criterion ids and stage tags, stages S0 to S4 with machine-checkable completeness (criteria coverage, executed behavioural checks, gates, open-questions gate), margins (spec's declared completeness q, allowed deviations d_k, budget bands), arms C1 to C4 (C5 optional), primary cost to verified COMPLETE with escapes inside the band, registered crossover stage. Shares Pastura, the oracle and the arm manifest. New: criteria-tagged oracle, stage scorer, held-out post-complete suite, planted-ambiguity set, A4-adv arm. Depends on SDX-0 and B11. Cost about $1,200 to $4,800 plus preparation."
- **Human and field versions.** The same stage definitions, with developer minutes as a currency, are the completeness measurements of the field study in `FIELD-STUDY-TEAMS.md`. A controlled human version is not proposed now.

## 11. Threats to validity (outline)

- **Targeted gates.** C4's gates execute the arm's own tests and the criteria-coverage ledger; the scorer uses sealed probes the arm never sees. Criteria coverage is reported as targeted, with no verdict.
- **Spec quality and proponent authorship.** The spec package is written by us; the reviewer is independent; the same package for every arm; a stateless judge checks that the package contains no GS vocabulary that would favour C3 and C4.
- **Spec given, not produced.** The trunk cannot show that producing the spec costs less than it saves; it says so.
- **One fixture, one model, one oracle** (HYPOTHESES section 8): chains are not independent confirmations across trunks.
- **Cap and censoring.** A low cap hides a late crossover; the cap and the horizon are registered; a longer horizon would be a new registration.
- **Self-declared completeness.** The design exists to remove it; the scorer must be validated on mutants before any chain is read.
- **Model drift and vendor changes** (METR 2026 notes measurement problems of this kind): pin and log.
