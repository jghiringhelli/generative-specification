# HYPOTHESES-2026-10-02: five falsifiable hypotheses from JC's four sharpened questions

Status: **DRAFT, NOT FROZEN, PROPOSAL.** Written 2026-10-02, before any run, by the assistant from JC's statement of what he wants tested. Nothing here is registered; each hypothesis becomes registered only through its own preregistration under `C:\workspace\PragmaWorks\gs\gs-experiment-protocol\docs\experiments\EXPERIMENT-PROTOCOL.md`. Mapping to experiment ids, order and costs: `C:\workspace\PragmaWorks\gs\gs-experiment-protocol\docs\experiments\BACKLOG.md` (section "Added 2026-10-02, second pass"). Shared arms and the load-bearing list: `C:\workspace\PragmaWorks\gs\gs-experiment-protocol\docs\experiments\prereg\SDX-1-ARMS.md`. Main preregistration these build on: `C:\workspace\PragmaWorks\gs\gs-experiment-protocol\docs\experiments\prereg\SDX-1.md`. Logbook: `C:\workspace\PragmaWorks\gs\gs-experiment-protocol\docs\experiments\LOGBOOK\README.md`. Replication package: `C:\workspace\PragmaWorks\gs\gs-experiment-protocol\docs\experiments\REPLICATOR-BRIEF.md`.

## 0. How to read this file

JC's four questions, in substance:

1. If expert prompts do not constantly state that the code must be built with the bridge disciplines, is there a MAP (the sentinel) so the context window does not degrade and the assistant does not burn tokens searching?
2. Without PHASE COLLAPSE (verifying behaviour by really executing it in the open field, outside the test environment), one does not know whether the code works as expected.
3. If true, GS is a CONTAINMENT NET that raises the whole discipline independently of the practitioner; the team would not need to learn it, only experience it or state intent.
4. GOVERNANCE: different memoryless actors keep the project clean as it grows and can produce reports and say at any moment what happened; the value is the substrate, automated and persisted.

These are four intuitions plus one corollary. Formalized as five hypotheses (the third question splits into a variance claim and a learning claim, because they have different estimands, different participants and different costs):

| Id | Short name | Question | One-line claim | Test mode |
|---|---|---|---|---|
| H-CONTEXT | the map | 1 | A routed authored map keeps the cost and quality of changes from degrading as the repository outgrows a fresh session, without the prompt restating the disciplines | Models only |
| H-PHASE | the open field | 2 | Executed verification in the real runtime catches a share of real-world-behaviour defects that unit-level checks, static checks and model review miss | Models only (humans optional as reviewers) |
| H-FLOOR | the floor | 3a | Between-practitioner spread in project outcomes is smaller, and the lowest-skill practitioners' outcomes higher, with the substrate than without | Humans needed as prompt and intent authors; models run the work. A model-persona version is a pilot only |
| H-GOV | the audit | 4 | Stateless auditors reconstruct what happened and detect an injected divergence better in a substrate project than in comparable projects without one | Models only (humans optional as blind raters) |
| H-LEARN | the experience | 3b | People who only state intent and work inside the substrate do as well as people trained in the discipline working without it | Humans only |

Words used the same way everywhere (operational, so a result cannot be reinterpreted later):

- **Substrate** = the repository-resident, harness-delivered set L1 to L5 of SDX-1-ARMS section 1 (sentinel, spec ledger, decision records, enforced gates, coherence lock), exactly as arm A4 delivers it. Where a hypothesis needs a component, it names it (L1 etc.).
- **Containment net** (question 3) = operationally the substrate delivered by the harness without any instruction in the practitioner's prompt. "Independently of the practitioner" means: the practitioner's prompt may be anything; the substrate is not part of it.
- **Bridge disciplines** = the manifest items tagged G and L in SDX-1-ARMS (about 25 items). The bridge itself (the canon's account of why the disciplines work: they connect human language to code) is an explanation, not an operational term. No experiment here tests the bridge theory; they test consequences it predicts. If a result is cited, cite the consequence, not the theory.
- **Phase collapse** in the canon (Compendium, glossary and section on the sprint chain, `C:\workspace\PragmaWorks\gs\generative-specification\docs\white-paper\GenerativeSpecification_Compendium.md`) means compressing planning, implementation, testing, review and deploy into one session, made safe by a complete specification and by external verification. H-PHASE tests only the second part (the external guarantee: executed verification in the open). It does not test the compression (speed) part. Public wording must say "executed verification", not "phase collapse proven".
- **In the open field** = the built artifact runs as a real process, with a real persistent store file that survives restarts, over a real network boundary, with realistic data volumes, dates and encodings, and no mocks or in-memory substitutes; observed behaviour is compared with the specification. A test suite running in-process against a fake is the **test environment**.
- **Memoryless actor** = a fresh session with no memory, no earlier chat, no vendor persistence; only the repository carries state (the SDX-1 rule, `SDX-1.md` section 3).
- **Practitioner** = the person who writes the intent (change requests, session-start instructions) and ratifies. Skill = defined per H-FLOOR below, never self-reported.

## 0a. H-FORM (added 2026-10-05, JC's new first priority): the precondition of all five

JC (2026-10-05, in substance): create projects from scratch, apply the GS formulas to produce complete and correct substrates, and only then test whether the substrates make a difference. The first thing to establish is that the formulas produce, with high confidence, all the elements of the substrate. It goes in the Field Guide and on genspec.dev.

**Claim (an estimation target, not a comparison).** Following the canonical formula (frozen, tagged prompt templates for setting up a new project, adopting GS in an existing one, and adding a feature) yields a repository in which each of the twelve substrate elements is present **and working**, with a per-element probability whose 95 percent Wilson lower bound is at least 0.90 (and, as a separate target, all twelve together with a lower bound of at least 0.80), across five invented project types, three model vendors, two entry paths (greenfield from a brief; brief to MVP to formulas, JC's practice) and two prompt languages (English and neutral Spanish, separate artifacts).

**What is NOT claimed.** That the substrate improves anything (that is H-CONTEXT to H-GOV), that the twelve elements are the right ones, that a present document is a good one, that the result holds for other models, project sizes or interactive use.

**Operational definitions, thresholds, falsifiers, sample size (n = 210 runs per stream from simulation, after a diagnostic stage FX-0), failure taxonomy (checker fault, infrastructure fault, formula failure, model failure, project-type failure), decision table:** `C:\workspace\PragmaWorks\gs\gs-experiment-protocol\docs\experiments\prereg\FX-1.md`. Instrument: `C:\workspace\PragmaWorks\gs\gs-experiment-protocol\docs\experiments\FX-1-CHECKER-SPEC.md`. Experiment id: **FX-1** (pilot FX-0 is the harness-and-checker validity pilot).

**Why it is a precondition.** Each of H-CONTEXT, H-PHASE, H-FLOOR, H-GOV and H-LEARN compares a project with the substrate against one without, and "the substrate" is operationally arm A4, today built by hand by the GS side. The statement "the substrate must be installed correctly before any difference is measured" has a testable form: those experiments may call their enforced arm **formula-built** only for elements that reached the `RELIABLE` rung in FX-1 for the formula that builds them; otherwise they must call it hand-built, and a reader learns that a user following the formula would not obtain what the experiment measured. A formula step that fails is rewritten and re-estimated (FX-1b) before the dependent experiment is frozen.

**Existing evidence.** None at tier A or B. Lab runs of the formulas are single observations on one model (the formulas audit of 2026-10-02: only the course practicals and the published audit prompt were ever executed; the new-project and existing-project prompts have no recorded run). A private day-one census of four author-built projects found no project with all twelve elements on its first day (descriptive, not citable).

**What would refute it.** Any element whose upper 95 percent bound is below 0.90 in a stream (the formula step is named and rewritten), or the all-twelve rate with a lower bound below 0.80 (registered rung `NOT-YET` or `OFTEN`). The experiment is the wrong one if the checker fails its validity conditions (FX-1 section 6).

## 1. Conventions shared by all five

1. **Classification of contrasts, SESOI, TOST, intervals, permutation tests, Bonferroni**: as in `SDX-1.md` section 2.2 unless a section here overrides it. All SESOI values below are provisional placeholders (`[FROM PILOT]`) chosen so a reader can see the order of magnitude; each must be justified in writing at its own freeze.
2. **Untargeted metric rule** (protocol guard b): a verdict rests only on a metric the treatment does not directly optimize or state. Treatment-targeted metrics are reported beside it and never carry a verdict. Each hypothesis lists both.
3. **Controls**: each has a positive control (a known effect the design must detect, or the experiment is INVALID-DESIGN) and a negative control (a no-effect arm that must show none).
4. **A hypothesis can be refuted, or the experiment can be the wrong one.** Both are logged. Equivalence ("an expert prompt or the cheap alternative does as well") is a registered possible outcome of every hypothesis, not a failure.
5. **Tiers.** Existing evidence below uses the logbook tiers (A registered externally before data, B in-repo tag before data, C design text before data or no registration, D demonstration or observation). No existing entry is tier A or B. Nothing below is cited as support for the hypothesis in public wording; it is cited to show what is and is not already known.
6. **Shared fixture**: Pastura (invented, no public corpus), locked scaffold, sealed convention-tolerant HTTP oracle, stateless judges from a vendor other than the generator's, arms from SDX-1-ARMS (A0, A5, A5b, A0S, A1, A3, A4, A6). New arms and probes each hypothesis needs are listed per hypothesis and consolidated in BACKLOG.
7. **Pre-freeze rule**: adding any new arm, readout or hypothesis to SDX-1 is a structural change and resets the critic-round counter (`ROLES.md` section 6). Therefore the new hypotheses live in their own registrations (BACKLOG ids SDX-4 to SDX-7, plus SDX-3). The only thing recommended for SDX-1 itself is a data-capture requirement (section 9, item 1): log everything now that cannot be reconstructed later.

---

## 2. H-CONTEXT: the map keeps context from degrading

**Claim (one sentence).** As a repository grows beyond what one fresh session can read, a routed authored map (sentinel tree, L1) keeps the total cost per accepted change, and the correctness of changes, from degrading as fast as it does without a map, even when the session prompt does not restate the disciplines.

**What is NOT claimed.**
- Not that a file differs from a prompt as a channel: the sentinel reaches the model as context just as a prompt does. The claim is about persistence, routing and size, which only separate from "put it all in the prompt" once the content is larger than one wants loaded every session.
- Not that structure alone (layering, small units) lowers reading cost (TX measured a null at small scale; this hypothesis does not revive it).
- Not that frontier models cannot navigate unaided (SX showed a frontier model navigated, at higher cost).
- Not a claim about correctness at any size unless the correctness metric shows it; a cost-only result is stated as cost-only.
- Not that the map is free: its authoring and upkeep tokens are inside the primary metric.

**Operational definitions.**
- Project size: source plus tests tokens (one fixed tokenizer) and file count at three registered levels, S (about 3 kLOC, the whole repository fits in a session), M (about 15 kLOC, borderline) and L (about 60 kLOC, cannot be read in a session). Size is manipulated by a frozen "ballast" corpus of extra, realistic, tested modules in the Pastura domain, identical bytes in every arm (design item for SDX-4: it must not be a strawman twin, the SX threat; it is generated once, reviewed by the independent reviewer, and its realism is checked by a stateless judge against a list of properties).
- Map: the L1 artifact as defined in SDX-1-ARMS (a persistent, routed entry and navigation file or small tree that a fresh session reads first). "Prompt does not restate the disciplines": the session prompt is identical to the naive arm (base spec plus the change text); all discipline content sits in repository files.
- Accepted change: the change's fresh hidden-oracle probes all pass and there is no regression flip on carried probes.
- Search and read tokens: tokens in tool results of read, search and listing tool calls (and shell commands that read files), extracted from the CLI transcript by a script.
- Context fill: peak input tokens in any turn divided by the model's window.
- Degradation: slope of fresh-probe pass rate (or of regression flips) on log size, per arm.

**Variables.**
- Independent: arm (A0 naive; A5 expert-minus-GS; A3-scaled flat file whose content grows with the project and is auto-loaded; A4-L1 sentinel only; A4 full substrate) by size (S, M, L), and task type (T1 a cross-cutting change needing several edits; T2 a localized fix; T3 a state-dependent change).
- Dependent, primary (verdict): **total tokens per accepted change** (input, output and cache-creation, summed over all attempts, including A4's map upkeep), and fresh-probe pass rate; interaction contrast: how the arm gap changes from S to L.
- Secondary: search and read tokens, turns, files read, wall clock, context fill, missed-copy count on T1 (edits against the minimal ground-truth edit set), regression flips, a fixed set of "needle" retrieval questions answered from the repository (answer key from the ballast generator, not from any map).

**Metrics the treatment does NOT target.** Hidden-oracle correctness, regression flips, total cost per accepted change including upkeep. **Targeted (reported, no verdict):** search and read tokens, files read, turns, any "did the session read the map first" compliance count.

**Controls.**
- Positive: size manipulation check. A0 cost per accepted change at L must be at least 2 times S (otherwise there is no growth regime for a map to counter: INVALID-DESIGN for that task). Also a "mechanical oracle map" arm (a map auto-generated from the ground-truth file list and symbol index, the best a map can possibly be) shows the ceiling of the effect.
- Negative: a stale-map arm (same size and form as the real map, routing deliberately wrong for a registered fraction of entries) that must not help and probably hurts (measures that content correctness, not mere presence, is what acts); A/A repeat of A5.

**What would refute it.** At L, A4-L1 does not lower tokens per accepted change against A5 by at least SESOI (provisional 20 percent) with the 95 percent interval excluding it, or lowers cost but lowers fresh-probe pass by more than 5 points (a cheaper but worse result is not a win), or the slope with size is not flatter than A5's. EQUIVALENT to the flat file A3-scaled at L would mean routing adds nothing over loading everything (then the map claim reduces to "persistent content", which is itself informative). The experiment is the wrong one if the positive control fails or the ballast is judged unrealistic.

**Existing evidence (logbook; all tier C, none registered externally).**
- KX (SUPPORTED on tokens and cost per structural query, single model; accuracy INVALID-DESIGN because the answer key came from the structure under test): routed 78,603 tokens per query against 100,237 monolith and 233,583 bare. Shows an authored route is cheaper to query. Does not show correctness, whole-session cost, authoring and upkeep cost, or a growing project.
- TX (sentinel SUPPORTED k=5; structure alone NULL at 16 to 37 files): with a map, 3 files read and zero search against 4 to 5 without, turns about 45 percent fewer, cost about 40 percent lower. Shows the map, not layering, carries the read economy at small scale. Does not show anything above 37 files.
- SX (sentinel on search cost SUPPORTED as demonstration, n=2): map on the lean twin only (S1): 351k mean tokens on lean against 2,175k on the chaotic twin without a map; map on both (S2): 302k against 731k, so the map shrinks the gap but a residual remains. The chaotic twin was built by the author. S0 variance was high even for the lean twin. Direction only.
- What these do not show: correctness effects, the scale regime where a fresh session cannot read the whole repository (excluded by construction in SDX-1 at 2 to 3 kLOC, section 10a of SDX-1), the cost of keeping the map true over many changes, and any model besides one frontier model. They are why this is a mechanism hypothesis with a scale manipulation (BACKLOG B6 gave the same idea).

**Test mode.** Models only. Human participants add nothing.

**Main threats.** Ballast realism; authoring the map is a proponent task (use the SDX-1 rule: builder blind to the change texts, reviewed by the independent reviewer); the model may navigate unaided at L at acceptable cost (that is a legitimate null: the frontier cell of SDX-2 then asks the same at capacity); map and discipline content are confounded in A4 (A4-L1 isolates the map).

---

## 3. H-PHASE: executed verification in the open field

**Claim (one sentence).** Among defects that appear only when the built artifact runs in its real runtime, verification by executing it in the open catches a larger share, per unit of cost, than unit-level checks, static checks, test-environment integration tests, and model code review of the same builds.

**What is NOT claimed.**
- Not that real-world-behaviour defects are common; prevalence is a separate natural-sample question (Part C below) and this hypothesis is conditional on a defect being present.
- Not that executing replaces tests or review (the claim is about the share that the others miss, so the layers are complements unless the data say otherwise).
- Not the speed or compression part of phase collapse.
- Not that open-field execution is cheap: its cost per catch is measured, not assumed.
- Not that the agent which builds should verify (the canon's own account says same-context authorship of tests and code collapses the red phase; independent verification is a variable here, not an assumption).

**Operational definitions.**
- Real-world-behaviour (RWB) defect: a defect whose manifestation requires the real runtime: persistence across a restart, a schema or data migration with data written by the previous build, concurrency, clock and calendar boundaries (season boundary, daylight-saving shift, leap day), volume and pagination, process and environment configuration, text encoding, partial failure. The taxonomy is registered before defects are authored and must come from an external source of defect classes (a published defect taxonomy cited in the registration, not the GS canon); instances are authored by a person who does not design the layers.
- Layers: **D1** static (typecheck, lint); **D2a** the build agent's own unit tests; **D2b** an independently authored unit suite; **D3** test-environment integration tests (in-process server, in-memory store, mocks), authored by the build agent; **D4** model code review (stateless, two vendors, two runs, diff plus spec, blind to whether a defect was injected); **D4+** effort-matched agentic review with tool access to read, search and run static tools but **execution of the application forbidden**, given the same token budget as D5; **D5** open-field execution: a stateless agent with the ability to start the real process on a real data file, drive real HTTP, restart it, and compare observed behaviour with the spec, without seeing the defect manifest.
- Detection: the layer reports a defect with the right location or behaviour per the injection manifest. A report that names no defect, or the wrong one, is a miss; a report on a clean item is a false positive.
- Unique catch share: the share of RWB defects caught by D5 and by none of D1 to D4+.

**Variables.**
- Independent: layer (D1 to D5, D4+); defect class (registered classes: RWB classes and two control classes); item (clean or one injected defect).
- Dependent, primary (verdict): **unique catch share of D5** and **D5 detection rate minus the best of D2b, D3, D4 and D4+**, on RWB defects.
- Secondary: false-positive rate per layer on clean items; tokens, wall clock and dollars per true catch; defects found per layer pairwise overlap (Venn of detection); in Part B, the RWB pass rate of agent-built projects.

**Metrics the treatment does NOT target.** Ground truth comes from the injection manifest and from sealed open-field probes written by someone other than the D5 agent. The functional hidden-oracle pass rate (SDX-1 oracle) is untargeted. **Targeted (reported, no verdict):** the count of "executed the app" events in the transcript.

**Controls.**
- Positive: a unit-catchable class (planted logic errors) that D2b must catch at 90 percent or more and a type-error class that D1 must catch at 90 percent or more; if not, the harness is broken.
- Negative: (a) clean items, giving the false-positive rate of every layer; (b) a **spec-level defect class** (a misunderstood requirement, behaviour wrong in the same way in every environment) where execution has no reason to beat review; if D5 beats D4 there as much as on RWB defects, the D5 advantage is generic effort and not the open field; (c) D4+ as the effort-matched control (same budget, execution forbidden).

**What would refute it.** Unique catch share of D5 on RWB defects below SESOI (provisional 10 points) or D4+ within SESOI of D5, or a D5 false-positive rate high enough that cost per true catch exceeds D4+'s. If D5 catches the same defects D2b and D3 already catch, the open field adds nothing for this class. If D5 catches them but only because D4+ was given less budget, the experiment is INVALID-DESIGN.

**Parts.** A: layer study on a reference implementation plus injected defects (cheap, no chains). B: agent-in-loop arms on the chain (A5 and A4 with and without an explicit execute-in-the-open step, and a sealed open-field probe suite): does adding the step change the RWB pass rate of what the agent delivers? Note the SDX-1 oracle is itself executed black-box over HTTP, so SDX-1 cannot test this hypothesis; all its arms are scored by execution. C: natural escape study: among agent-built final repositories from SDX-0 and SDX-1, how many oracle-failing or open-field-failing behaviours passed the agent's own test suite (the natural prevalence of tests-pass-but-wrong).

**Existing evidence.**
- EX (DEMONSTRATION, tier D): a live deployment with 13 of 13 behavioural probes (1,013 assertions), 3 of 3 environment probes, a load ramp with six thresholds, "15 defects the gate caught" counted by the builder; no baseline and no rate. The only instance of in-the-open verification in the logbook; shows feasibility, not advantage.
- RX (DEMONSTRATION, tier D): a project passed 104 tests that the generation wrote itself: "a project can pass its own tests". Relevant to why D2a is weak evidence; it does not test anything.
- RND-1 sub-experiment 3 (NULL by floor, n=2, tier C/D): independent verification had no behaviour to catch because the model did not game its tests. Also sub-experiment 1: a stateless code-reading judge caught an approximation of a field that the held-out oracle missed, an example of one layer catching what another missed in the opposite direction.
- AX2 (tier C): coverage ranged from 1 to 95 percent across repetitions because of test-infrastructure failures, and the strict oracle measured convention rather than function; both are reminders that the test environment itself is a source of error, not evidence for the hypothesis.
- CX (INVALID-DESIGN): 5 of 5 against 5 of 5, three tasks vacuous. Nothing usable.
- Nothing in the logbook compares verification layers on the same defects. The hypothesis is untested.

**Test mode.** Models only. Optionally a human review layer (D4-h, a paid reviewer on a subset) to calibrate model review against people.

**Main threats.** Circularity: if defects are chosen to be invisible to everything but execution, D5 wins by construction; mitigations are the external taxonomy, instance authoring by someone who does not build the layers, the spec-level control class, the unit-catchable positive control, and reporting no prevalence. D5 depends on the quality of the agent that executes; D5 variants (scripted journey versus agent-driven) are both reported. Detection judged against an injected manifest does not generalize to defects nobody thought to inject; Part C is the guard.

---

## 4. H-FLOOR: the substrate narrows the spread between practitioners

**Claim (one sentence).** With the substrate delivered by the harness, outcomes of projects driven by practitioners of different skill vary less between practitioners, and the outcomes of the lowest-skill practitioners are higher, than with the same practitioners' intent and no substrate.

**What is NOT claimed.**
- Not that the mean outcome rises (that is SDX-1) or that the substrate makes everyone expert.
- Not that intent quality does not matter: a practitioner who states the wrong requirement gets the wrong software; the claim is about the discipline of construction, not about what to build.
- Not that the practitioner is dispensable: ratification and judgment stay human; H-LEARN and the canon agree on that.
- Not that variance reduction is good if it is only compression at a ceiling (see refutation).

**Operational definitions.**
- Practitioner outcome Y(p,a): mean over k chains (planned 3) of the hidden-oracle pass rate at the final change (E1-ALL), with E1-SD, regression flips and maintainability proxies as secondary, for practitioner p under arm a.
- Practitioner skill: measured before the main task, never self-reported, by two independent measures (a) years of professional development experience plus prior use of coding agents, and (b) a baseline work sample: the practitioner's own intent texts and session-start instructions for a different small project than Pastura, run once with no substrate, scored by a hidden test suite (their baseline performance). Strata (low, mid, high) are the registered tertiles of a registered combination of (a) and (b). Skill is a **blocking and moderating factor, not randomized**: the causal contrast is arm within stratum (randomized), the skill gradient is observational.
- Spread: SD of Y(p,a) across practitioners within arm and stratum; ratio R = SD under substrate over SD under no substrate. Floor: the mean of the low stratum and the 10th percentile of Y.
- Arm for this study: **N** (the practitioner's texts, no substrate), **P** (placebo: an inert directory of the same size and shape, no routing, no gates), **S** (same texts plus the A4 substrate). Because the humans write text and do not interact (they write the change requests and a session-start instruction once, in advance), the same texts are replayed under all three arms: a paired design, cheap and strong. This is the "prompt-author" version; the live, interactive version is part of the H-LEARN study (SDX-7).
- Regression to the mean: low-stratum members were chosen partly on noisy baseline scores and will rise anyway; the same selection acts on N and P, so the **arm by stratum interaction**, not the low stratum's rise, is the estimand.

**Variables.**
- Independent: arm (N, P, S) by stratum (L, M, H), within practitioner.
- Dependent, primary (verdict): R (with BCa interval) and the arm by stratum interaction (low-minus-high gap under N minus the gap under S) from a mixed model Y ~ arm * stratum + (1 | practitioner), the 10th percentile of Y as a floor check.
- Secondary: E1-SD, regression flips, duplication and complexity, cost per accepted change, count of discipline items present in the practitioner's own text (how much of the discipline they stated).

**Metrics the treatment does NOT target.** Hidden-oracle pass rates, regression flips, maintainability proxies (duplication, complexity). **Targeted (reported, no verdict):** layer-rule compliance, presence of records.

**Controls.**
- Positive: a practitioner-sensitivity check. Under N, between-practitioner spread must exceed the within-practitioner noise (estimated from replicate chains of the same text, an A5b-style repeat): ICC of practitioner at least 0.2. If not, practitioners do not matter on this task and model, **there is no spread to shrink**: report that as "practitioner independence already holds at baseline here" and the hypothesis cannot be tested. This outcome is a finding in its own right and bears on the value claim.
- Negative: arm P (placebo substrate) must not shrink R; if it does, any shrinkage is attention or overhead, not substrate.
- Ceiling guard: if the mean of Y under S is at or above 95 percent in every stratum, narrowing may be compression; report the mean and the 10th percentile; the claim is not supported by variance shrinkage alone at the ceiling.

**What would refute it.** R with a 95 percent interval including or above 0.9 and no raise of the 10th percentile of Y by SESOI (provisional 10 points); or an interaction of the wrong sign (the substrate helps high-skill practitioners more); or R below 1 only because every S outcome is at the ceiling. EQUIVALENT is possible and informative.

**Where "constantly states" comes from.** In SDX-1 the expert prompt (A5) is delivered by the harness in every session and is written by an expert, so it is stable and good by construction. In real use a practitioner must remember to state the disciplines every time and varies in how well. SDX-1 therefore flatters the expert prompt relative to field conditions. H-FLOOR is the experiment that lets the prompt vary, which is exactly the situation question 1 describes.

**Existing evidence.** No direct test. AX2 (tier C): disciplined versus naive prompts separated on structure across three vendors (n=5 per cell, partly targeted metric), so prompt content matters for structure; RND-1 sub-experiment 1 (tier C/D, n=3): descriptive versus prescriptive specification 0 of 3 against 3 of 3, near-definitional, so the way the human writes requirements moves outcomes; CR (tier C): GS no better than naive on behaviour at hosted rungs. These show there is a practitioner effect to shrink on some metrics; they say nothing about whether a substrate shrinks it.

**Test mode.** Humans are needed as prompt and intent authors (about 2 to 3 hours each, text only, the harness runs the models). A pilot with model-simulated personas (a ladder of persona prompts: terse novice, mid, expert) is allowed to debug the pipeline and the skill-by-arm analysis, **labelled a proxy**: a model playing a novice is not a novice, so it cannot establish or refute H-FLOOR. The interactive version (people working live with the agent) needs participants and shares its pool with H-LEARN.

**Main threats.** Skill measurement validity (two independent measures; strata fixed in advance); recruiting a real skill range; the writers know they are in a study about prompts and may write unusually carefully; text replay removes the practitioner's reactions to the agent's output (which the interactive version restores); the substrate arm S is author-built (SDX-1 threat, same mitigations).

---

## 5. H-GOV: memoryless actors, reconstruction and detection

**Claim (one sentence).** In a project built and changed by a sequence of memoryless actors, a stateless auditor given only the repository reconstructs what was changed and decided, and detects an injected divergence, more accurately when the substrate is present than in projects with the expert prompt alone or with the cheap alternatives (the same content in one file, or a harness-written commit log).

**What is NOT claimed.**
- Not legal or regulatory compliance, not that reports are useful to an executive, not that governance of people follows from governance of code. Report usefulness is a secondary blind-rating question only.
- Not that the substrate prevents divergence (prevention is SDX-1's territory); the claim is detection and reconstruction.
- Not that the auditor sees intent that was never recorded: reconstruction is scored against the recorded ground truth, and an arm with no record is expected to do worse by design; that is part of what is tested, and the cheap alternatives are in the design so the result cannot be a strawman.

**Operational definitions.**
- Actors: each change is made by a fresh session. Default: one vendor, mid-tier (SDX-1). Extension arm: rotating actors, a different model or vendor per change (tests "different memoryless actors" literally).
- Auditor: a stateless fresh session from a **vendor other than the generator and the author**, given the final repository (and optionally an intermediate snapshot, "at any moment") and the base spec, nothing else; no change texts, no replies, no arm label. Run twice per item (judge instability: AX-K5 showed up to 6 points between two runs of one prompt).
- Ground truth: the change list, the scripted product-owner replies and the recorded decisions (D1, D2, the reversal) turned into a fact list of about 40 atomic facts (what changed, which rule superseded which, why).
- Reconstruction score: fact-level recall and precision against the fact list; decision-recovery (the rationale of D1, D2 and the reversal) scored separately; "false-fact rate" (facts asserted that are not true).
- Injected divergence: a post-hoc scripted edit of a snapshot that creates a divergence between what the base spec, change list or a recorded decision say and what the repository does or records. Families (defined against the shared base spec and change list, not against the substrate's sensors, per SDX-REVIEW F3): (i) code contradicts an accepted requirement, (ii) a supersession applied on all surfaces but one, (iii) a test deleted or weakened, (iv) behaviour added that no change asked for, (v) a requirement or decision silently dropped. At least two families are chosen so the substrate's own deterministic sensors would not fire; sensor detections are reported separately and carry no verdict.
- Detection: the auditor names the divergence (family and location) with quoted evidence; clean items measure false positives.

**Variables.**
- Independent: arm (A5 expert-minus-GS; **A7 commits-as-ledger**, a new cheap arm where the harness commits each change with the full change text and product-owner reply as the message, written by the harness not the agent; A3 flat file; A4 substrate; optionally A1), snapshot (after change 5, after 9, final), item type (clean or one divergence of a family), actor regime (fixed or rotating).
- Dependent, primary (verdict): reconstruction F1 and divergence detection sensitivity at a registered false-positive rate; contrasts A4 minus A7 and A4 minus A5.
- Secondary: tokens and time to audit, report completeness as rated blind by a human, project-cleanliness metrics after growth (duplication, dead code, test count, regression flips) per arm as the "keeping the project clean" outcome.

**Metrics the treatment does NOT target.** Detection of families outside the substrate's sensors, false-fact rate, cost to audit, regression flips and cleanliness metrics. **Targeted (reported, no verdict):** reconstruction of recorded decisions in A4 (it wrote them), sensor detections.

**Controls.**
- Positive: the auditor given the ground-truth change log must reconstruct at least 95 percent (otherwise the instrument fails). Divergence families must each be detected at least 90 percent when the auditor also receives the base spec and the exact change text (an "oracle auditor").
- Negative: clean items (false-positive rate); a repository from a different chain given with this chain's label (the auditor must not "reconstruct" facts from the wrong project; measures confabulation); A/A repeat of A5 chains.

**What would refute it.** A4 EQUIVALENT to A7 within SESOI on reconstruction and detection (git history carrying the change text already gives the audit; the substrate's governance value then reduces to "write the change text into the commit", cheaper and itself a result), or A4 not above A5, or A4's advantage confined to the targeted facts. Cost: if A4's audit is better but its upkeep tokens make it more than a registered multiple of A7's, report the trade. The experiment is the wrong one if the judge validity check (BACKLOG B11) shows audit noise as large as the effect.

**Existing evidence.** BACKLOG B10 states there is a design but no clean test. EX and RX (tier D) are demonstrations with no comparator. AX-K5 (tier C): audit noise as large as the gap between the top two arms; judge validity must precede any audit-based number. BX (INCONCLUSIVE, n=3, circular). RND-1 sub-experiment 1: a stateless reader catching what the oracle missed (one case). SDX-REVIEW F3 records that the earlier H4 (reconstruction plus injected defects) measured the substrate's own vocabulary and was moved out of SDX-1; this design is that H4 corrected: facts and families defined against the base spec and change list, A3 and A7 as cheap comparators, sensors reported apart.

**Test mode.** Models only. Humans optional: blind raters of report completeness and a small human-auditor calibration sample.

**Main threats.** The substrate was designed to be auditable, so favourable results on recorded facts are partly by construction (hence families outside its sensors and the cheap comparators); the auditor's stability; the injection script can leave artifacts a model notices (use a second injector and an A/A check); one vendor of generators unless the rotating arm runs.

---

## 6. H-LEARN: experiencing the substrate substitutes for learning the discipline

**Claim (one sentence).** People who only state intent and work inside the substrate deliver outcomes at least as good (within a registered margin) as people trained in the discipline who work without it, and better than untrained people working without it.

**What is NOT claimed.**
- Not that nobody needs to understand the discipline: reviewers and ratifiers remain human and may need it.
- Not that engineering skill is irrelevant (stating intent well is a skill, measured, see H-FLOOR).
- Not that learning is useless in the long run; a transfer sub-question asks whether people who worked inside the substrate later do better without it (exploratory).
- Not that models can stand in for the participants. They cannot.

**Operational definitions.**
- Arms (between-participant, randomized within skill stratum): **U** untrained, no substrate; **T** trained in the discipline (a fixed course of registered length, delivered by a trainer who is not the author, with a time-matched generic-engineering training as the active control **T0** if budget allows), no substrate; **S** untrained, substrate present, told only to state intent and review results; optionally **TS** trained plus substrate.
- Task: a fixed multi-change task on a Pastura-like project (one session of 3 to 4 hours, same task for all), done with a coding agent on their own tools within a locked harness.
- Outcomes: hidden behavioural oracle (E1-ALL and E1-SD), independent maintainability review by at least two blind raters recruited outside GS's orbit, time to completion, and intent quality is **not** an outcome (it is an input covariate).
- Intervention fidelity: pilot with 3 to 5 people and check that each arm received what the claim says (T was trained, S received the substrate and not the training).

**Variables.**
- Independent: arm (U, T, S, optionally T0, TS); stratum (skill, as in H-FLOOR) as a blocking factor.
- Dependent, primary (verdict): E1-ALL difference S minus T (equivalence, TOST with margin Delta, provisional 10 points) and S minus U (superiority); co-primary maintainability review score on the same contrasts.
- Secondary: time, cost, transfer task without substrate (S versus U after the main task), self-reported load, dropout.

**Metrics the treatment does NOT target.** Hidden oracle, blind maintainability review, time. **Targeted (reported, no verdict):** presence of substrate artifacts in what participants deliver, vocabulary used in their requests.

**Controls.**
- Positive: T must beat U by at least the margin (training works at all). If T is not better than U the study cannot discriminate and is INVALID-DESIGN for the equivalence claim (and bears on whether training is needed anywhere).
- Negative: a placebo substrate (inert, as in H-FLOOR) for a subset; blind raters also score a set of planted known-good and known-bad deliveries for calibration.

**What would refute it.** S below T by more than the margin (lower bound of the interval below minus Delta), or S not better than U. Equivalence of T and U would mean training does not matter on this task (that undercuts the premise that there is a discipline to learn).

**Existing evidence.** Observational only: workshop observation that one participant made an ADR a merge prerequisite (SDX-1-ARMS L3 row, tier D). No controlled human study exists; BACKLOG B12 holds the design principles (intervention fidelity, locked arms, outcome not defined by the treatment's vocabulary, independent blind raters, external registration, positive control, null reported). This hypothesis is the most expensive and the least testable with models; it should be run last and only if the model-only results justify it.

**Test mode.** Humans only. Ethics or institutional review is likely needed if run through a university; participants paid; no confidential material.

**Main threats.** Recruitment and skill range; trainer effects (an author-trained arm would favor T and an author-built substrate S: both bias, in opposite directions, declare and use a non-author trainer); learning inside the session in arm S; participants' prior experience with agents; realism of a 3 to 4 hour task; the equivalence claim needs a justified margin and about 30 per arm under assumed SD of 15 points and margin of 10 (to be fixed by a pilot).

---

## 7. Evidence already in the logbook, one table

| Entry | Tier | What it shows | Bears on |
|---|---|---|---|
| KX | C | Routed map cheaper per structural query than monolith or none, one model; accuracy circular | H-CONTEXT |
| TX | C | Map lowers read cost and removes search at 16 to 37 files; structure alone NULL | H-CONTEXT |
| SX | C | Map collapses search cost in a demonstration (n=2) on an author-built twin | H-CONTEXT |
| AX, AX-K5, AX2 | C/D | Disciplined prompt beats naive on structure, saturated against expert; targeted metrics; audit noise up to 6 points | H-FLOOR (weakly), H-GOV (instrument) |
| CR | C | Benefit receded with capability on duplication; behaviour no better than naive at hosted rungs | H-FLOOR, section 9 |
| RND-1 | C/D | Descriptive spec resolved to literal minimum; independent verification had nothing to catch; one stateless-reader catch | H-FLOOR, H-PHASE |
| EX | D | Open-field chain closed once, gate caught 15 builder-counted defects, no baseline | H-PHASE, H-GOV (feasibility) |
| RX | D | One regeneration passed 104 self-written tests | H-PHASE (own tests are not independence) |
| SDX-0, SDX-1 | none yet | Designed, not run | H-FLOOR, H-GOV via SDX-1 chains |

No protocol tier A or B entry exists. Every hypothesis above starts at "untested" in the strict sense.

---

## 8. Could this all be the same effect measured four ways?

Honest answer: partly yes, and the experiments as grouped could make four confirmations of one thing look like four findings.

**Where they overlap.**
1. **One common cause.** "Persistent, structured information reaches a fresh session" can explain H-CONTEXT (the map), H-GOV (records to reconstruct from), part of H-FLOOR (defaults the practitioner does not have to supply) and, through them, H-LEARN. H-PHASE is the most independent: it concerns how verification is done, not what persists.
2. **One bundle.** A4 is a bundle of L1 to L5. A positive result for A4 on any hypothesis is a bundle result; four positive results for A4 are one bundle measured on four outcomes unless components are separated.
3. **One fixture, one model, one oracle.** Pastura, a mid-tier model and the hidden oracle feed all of H-CONTEXT, H-FLOOR and H-GOV; a ceiling, a floor or a quirk of that model contaminates all of them at once. Four hypotheses tested on the same chains are not independent confirmations.
4. **One capacity story.** Each is expected to shrink as model capacity grows (the capacity-relative claim); a frontier cell tests all of them together, so they are not separate.
5. **Shared noise.** Outcomes in the same chain are correlated; several tests on one chain multiply the apparent evidence.

**How to separate them (all registered in the respective preregistrations).**
- **Distinct manipulations, distinct outcome families.** Project size (H-CONTEXT), defect class and verification layer (H-PHASE), practitioner skill (H-FLOOR, H-LEARN), actor regime and divergence injection (H-GOV). Each primary outcome differs; none is read from another's data.
- **Component arms with dissociating predictions.** The prediction matrix below is the test. If the same single component removal destroys all four effects together, they are one effect.

| Component | H-CONTEXT predicts | H-PHASE predicts | H-GOV predicts | H-FLOOR predicts |
|---|---|---|---|---|
| L1 sentinel only (A4-L1) | carries the whole effect | nothing | little | little |
| L2 and L3 records only (A4-L23) | little | nothing | carries reconstruction | little |
| L4 gates with an execute-in-the-open step (A4-open) | nothing | carries the effect | divergence detection only if sensors fire | some (guards low-skill failures) |
| Expert prompt plus execute-in-the-open instruction (A5-open) | nothing | the cheap competitor: if it gets the effect, H-PHASE is a prompt-level practice, not a substrate effect | nothing | tests whether prompt-level discipline equals the net |
| Full A4 | all | all | all | all |

- **Single-effect verdict, registered.** If in the pooled component ablation each component's removal loses the same fraction of every primary effect, or if chain-level residuals of the four primary outcomes load on one factor and no component arm dissociates, the four are reported as one effect measured four ways and counted once. Factor analysis needs many chains and is exploratory.
- **Counting rule for public wording.** Count independent confirmations as experiments with a distinct manipulation and a distinct primary outcome run on distinct sessions; chains shared between registrations count once for the correlated outcomes.

**What is likely truly distinct.** H-PHASE (verification mode), and H-LEARN versus H-FLOOR (the same population but a mean-equivalence estimand versus a variance estimand, so different failures can occur: a substrate can narrow variance by raising the floor and still fall short of trained people on the mean).

---

## 9. What if an expert prompt plus a modern frontier model already achieves most of it?

This is the first rival, not a footnote, and it can be true for any of the five.

1. **What would show it.** For each hypothesis the registration states a sufficiency ratio: the share of the substrate's gain that the cheap alternative recovers, (A5 or A5-open or A7 minus A0) divided by (A4 minus A0) on the primary outcome, with an interval. If the ratio's lower bound is at or above a registered level (provisional 0.8), the hypothesis is reported as "mostly achieved by prompt practice" for that dimension. The decision rows of SDX-1 section 10 (rows iii and iv) already carry this logic for correctness; the sufficiency ratio extends it.
2. **Where each hypothesis meets the rival.** H-CONTEXT: A5 and the flat file at L (a frontier model may simply navigate at acceptable cost: SX shows it could, at a higher cost, and cost is measured). H-PHASE: A5-open, a prompt that says "run it for real before you finish" is the obvious cheap competitor and is in the design. H-FLOOR: a frontier model may lift the baseline for all practitioners, leaving no spread to narrow (positive control ICC check). H-GOV: A7 (git history as ledger) is the cheapest alternative. H-LEARN: capable agents may make training irrelevant (T equals U).
3. **Capacity is not tested in SDX-1.** SDX-1 uses one mid-tier model by design; its pre-stated gap sizes would likely shrink at the frontier (SDX-1 section 2a). A frontier cell (SDX-2, BACKLOG B8) and a repeat of the highest-value cells with a frontier model are needed before any statement that the substrate matters "with modern models". Until then the safe wording is "on a mid-tier model".
4. **SDX-1 flatters the expert prompt, and that cuts the other way.** The expert prompt there is stable and excellent in every session (section 4, "constantly states"). Field conditions are worse for it, so SDX-1 may understate the substrate relative to practice, which is H-FLOOR's question. Say both directions of bias.
5. **What the result changes.** If the sufficiency ratio is high on the correctness-type outcomes but low on H-GOV, the finding is the same shape as SDX-1 row iii: the substrate's value sits in audit and continuity. If it is high everywhere, the defensible offer is assurance and evidence, not better code than a strong prompt. Neither is a reason to avoid running the experiments.

---

## 10. Open decisions for JC (nothing below is decided here)

1. Accept the five hypotheses and the new ids (BACKLOG): H-CONTEXT as SDX-4 (absorbing B6), H-PHASE as SDX-5, H-FLOOR as SDX-6, H-LEARN as SDX-7, H-GOV as SDX-3 (existing id), SDX-2 stays replication and ablation.
2. Whether to ask the SDX-1 critics to require a transcript-and-tool-use capture in the harness (a data-capture requirement, not an arm or readout, so not structural; recommended: logging now is free, retrofitting is impossible).
3. Whether "execute in the open field" is added to the load-bearing list as L6 for the follow-on experiments only. Adding it to SDX-1-ARMS now would be a structural change and reset the critic counter, so it is proposed only for SDX-5 and SDX-2.
4. Whether the human studies (SDX-6 human phase and SDX-7) are worth their price before any model-only result exists. Recommended gate: run them only if SDX-1 shows H1 positive or SDX-3 or SDX-5 shows a gap; the replicator recruitment (REPLICATOR-BRIEF) can start earlier.
5. Margins and SESOI values (all provisional here) and the skill measurement for H-FLOOR.
6. Who is the independent reviewer and the trainer for H-LEARN (not authors).

## 11. Registration status

None. Each hypothesis gets its own registration file under `C:\workspace\PragmaWorks\gs\gs-experiment-protocol\docs\experiments\prereg\` when JC decides, with this file as its parent, a logbook entry (status PROPOSED until then) and no run before the freeze. This file is itself a design document, not a registration, and is revised in place with dated notes until the first dependent registration is frozen.

## 12. Proposal 2026-10-07: method versus its enforcement (channel contrasts) — PROPOSAL, NOT FROZEN

Source: JC, 2026-10-07. Full note (private): `C:\workspace\PragmaWorks\soma\docs\method-vs-enforcement-2026-10-07.md`. Nothing here alters the preregistered SDX-1 materials (`C:\workspace\PragmaWorks\gs\gs-experiment-protocol\docs\experiments\prereg\SDX-1-ARMS.md`); these are candidate additions for later registrations (P1 to P4 of the 2026-10-04 portfolio decision).

**Framing.** The method (what must hold) is separate from its enforcement (the channel that makes it hold). Channels, most manual to most automated: M1 per-prompt by hand, M2 root instruction file, M3 retrieval tool or MCP, M4 tool-use instruction, M5 hook, M6 CI gate, M7 enforced gate with ratchet. Failure modes by channel: forgotten, drifted, ignored, bypassed.

**Existing arms read as channel contrasts.** A5/A1 = M1; A3 = M2 flat; A4 = M2 routed plus M5 plus lock; P1 flat file vs sentinel vs stale map = M2 variants; P4 none / advisory / generic gate / enforced = M2 vs M5-M6 vs M7 with content held constant.

**H-CHANNEL (candidate).** With content held constant, regression and drift over a long chain, and across a practitioner change or memoryless sessions, order as none > advisory (M2) ~ tool-instructed (M4) > hook or CI (M5, M6) > enforced with ratchet (M7), the gap widening with chain length. Refuted if a manual expert arm (M1-expert) is within 10 points of M7 at the registered length, or if the gap does not widen after a practitioner swap. A tie at short horizon is reported as a statement of when the substrate pays, not as a rescue.

**Candidate new arms (content-matched to the existing manifest L).**
- A-M1X: manual expert. The same L content pasted by an expert human in every prompt, with the human's best manual checks; hours logged. Human required; a model-persona version is a pilot only.
- A-M3: MCP navigation instead of a sentinel (P1), with a no-tool-no-map arm beside it.
- A-M4: tool-instructed verification instead of hooks (P2 or P4); executed vs claimed read from transcripts (requires transcript capture).
- A-M5/M6/M7 split (P4, optional): hook only, CI only, hook plus ratchet.
- A-STEEL: steelman = expert human with best manual practice plus MCP search plus CI.

**Fair-test additions (proposals).** Steelman arm; token parity of artifacts across arms; human minutes and substrate setup cost in the cost endpoint; a second task family chosen by a GS skeptic; a second vendor and a frontier cell for the primary contrast; novice and experienced GS users reported separately; a "GS loses" outcome stated in advance; symmetric tables of false-blocks, upkeep failures and abandoned runs; headroom check in a pilot. The 18-item checklist with current status: section 6 of the private note above.

Open for JC: which arms go first; practitioner for A-M1X and A-STEEL; who picks the second task family; whether the 5.0 white paper gets a "method versus enforcement" box (separate proposal, not applied).
