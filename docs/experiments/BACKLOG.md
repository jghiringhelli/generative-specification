# Experiment backlog (prioritized, dependency order)

2026-10-02. Everything here is a PROPOSAL until it has a logbook entry and a frozen registration. Cost figures are estimates in model spend plus agent-assisted preparation; the time to prepare is usually the larger cost. Protocol: `C:\workspace\PragmaWorks\gs\generative-specification\docs\experiments\EXPERIMENT-PROTOCOL.md`. Index: `C:\workspace\PragmaWorks\gs\generative-specification\docs\experiments\LOGBOOK\README.md`.

## Ordering logic

0. **(2026-10-05, JC's new first priority) Establish that the formulas install the substrate before measuring any difference it makes.** FX-1 (below) comes first; SDX-0, SDX-1 and the P1 to P4 family of the 2026-10-04 portfolio decision (registrations not yet written) are downstream of it: the substrate must be installed correctly before any difference is measured. FX-1 is a reliability and estimation study of the formulas (prompt templates), not a comparison of arms.
1. Fix the instrument before using it: one harness (locked scaffold, convention-tolerant hidden oracle, non-memorized benchmark, stateless judges, controls) is reused by almost everything below.
2. Run the cheapest experiment that can change a decision first.
3. A result that would only be believable after an independent party reruns it gets that rerun scheduled, not assumed.
4. Nothing in this list needs to appear in the paper, the site or the course; each ends as a logbook entry.

## Items

### B-FX. FX-1, the formulas produce a complete, working substrate (reliability study; FIRST; about $2,100 central, range $900 to $4,100, hard cap $3,500; about 1,040 runs; preparation 60 to 90 agent-assisted hours plus independent persons) DRAFT, 2026-10-05
Registrable draft: `C:\workspace\PragmaWorks\gs\gs-experiment-protocol\docs\experiments\prereg\FX-1.md`; instrument: `...\docs\experiments\FX-1-CHECKER-SPEC.md` and its prototype `C:\workspace\PragmaWorks\gs\gs-experiment-protocol\experiments\fx1\checker\` (36 control variants, deterministic, no model); fixtures: `...\experiments\fx1\fixtures\` (five invented project types); simulation: `...\experiments\fx1\simulation\`; review: `...\prereg\FX-1-REVIEW.md` (two Claude critics; vendor-diverse review owed, runbook `...\docs\experiments\COPILOT-CRITIC-RUNBOOK-FX1.md`).
- Estimation targets with pre-stated thresholds: per element and per stream (entry path x language, English and neutral Spanish separate) the 95 percent lower bound of the per-element "present and working" rate at least 0.90 ("high confidence", defined operationally and justified in FX-1 section 2.2); all twelve together at least 0.80; three interval methods (Wilson, cell bootstrap, audit-adjusted); n = 210 runs per stream (5 fixtures x 3 vendors x 14), 840 confirmatory runs plus two small descriptive arms (generic prompt, checklist told exactly) that separate formula failure from model failure from checker failure.
- Width goal and decisiveness (from simulation): full Wilson width at most 0.10 at a stream rate of 0.90 or more. Probability that an element's interval contains 0.90 (indecisive): 0.01 if its true rate is 0.80 or 0.97, 0.72 at 0.93, 0.95 at 0.90. The study is inconclusive about 0.90 only when a true rate sits near 0.90; one rung down (at least 0.80) it is decisive. The headline "all twelve" is certified with probability 0.87 to 0.99 if every element truly sits at 0.97 and 0.03 to 0.75 at 0.95.
- Licenses: per-formula, per-language success rates with intervals and named failure modes, in plain words, for the Field Guide and genspec.dev; or the named formula step that fails and must be rewritten (a good outcome); or "the checker was wrong". Does not license any claim that the substrate helps.
- Blocked on: frozen formulas tag and `SUBSTRATE-CHECKLIST` (branch `formulas-2026-10-05`), independent persons (brief reader, control author, auditor), automated access to three vendors, budget, thresholds, the FX-0 pilot, vendor-diverse critic rounds (FX-1 section 13).
- FX-0 (pilot, about $50 to $100, 24 runs): checker audit by an independent human on real model output, cost per run, caps; data excluded. FX-1b: linked re-estimation after a formula step is rewritten (only affected streams).

### B0. Adopt the protocol (1 day, no model spend)
Create the OSF account and project, decide the tag convention (`prereg/<ID>-v<N>`), add a script that verifies registered hashes before each run batch. Decide whether any flagship gets a Registered Report (stage-1 review at an MSR or ESEM registered-reports track; dates not verified here). Licenses: nothing yet; it makes every later result usable.

### B1. SDX-0, the harness pilot (about $130 to $400 model spend after revision 2: 24 chains, adds the expert-minus-GS arm A5, A6 and A0S plus 60 to 90 agent-assisted hours of preparation, 1 to 2 weeks calendar)
File: `...\prereg\SDX-0.md`. Why first: it builds and validates the harness every later item reuses (Pastura scaffold lock, oracle with reference implementation, stubs and mutants, positive and negative controls, cost and variance). It also tells us whether the benchmark is at ceiling for the expert arm, which would make SDX-1 invalid before spending on it. Licenses: no research claim; it licenses freezing SDX-1 (or redesigning it).

### B2. Ordering note: B3 runs before B4
Reasoning: the single-shot comparison (B3) costs a fraction of SDX-1 and settles the question the papers currently handle badly (does GS beat an expert prompt on an untargeted, hidden-oracle metric?). It is run with the SDX-0 harness, only the first build. Order after B1 (and B11): B3, then B4 (SDX-1).

### B3. AX-redux: redesigned single-shot comparison (replaces AX and AX-K5 as evidence) (about $60 to $200, 2 to 4 days after B1)
- Hypothesis (proposal, replaces "GS beats expert prompting on a rubric"): on a non-memorized benchmark, a GS specification cascade, an expert prompt written by a practitioner who does not know GS, and a naive prompt differ on hidden behavioural pass rate and on a fixed-scope mutation kill rate of the hidden suite by at least a SESOI. State both directions: GS above expert, and equivalence (TOST) of GS and expert.
- Redesign points against the known defects: primary metrics are not targeted by the treatment (hidden-oracle behaviour, hidden-suite kill rate; layer violations reported as targeted only); an expert-prompt author external to the project; judged items scored by a different-vendor judge with arm labels removed, two vendors, kappa, human spot-check; positive control (a degraded arm) and A/A control; n from the pilot SD (k=5 is not enough for the corrected p-value to reach 0.05 with several comparisons).
- Licenses: either "GS content beats an expert prompt on an untargeted metric", "they are equivalent within SESOI", or "the instrument cannot tell". Any of the three replaces the current saturation story.

### B4. SDX-1 (see `...\prereg\SDX-1.md` and `...\prereg\SDX-1-ARMS.md`; Core about $440 to $1,320, Full about $825 to $2,475, about 3 weeks including preparation already done in B1)
Revision 2 (2026-10-02): the lead contrast is the substrate (A4) against an expert prompt that contains none of the five listed load-bearing GS elements (A5, authored by an external practitioner), plus A5 against naive. Earlier contrasts (A4 vs a GS-content prompt, A4 vs a flat file) stay as secondary contrasts in the Full scope. Licenses (if valid): one of the pre-registered decision rows (SDX-1 section 10), including the row where the value of the substrate on this evidence is governance only. Blocked on: the external practitioner and independent reviewer (JC names them), a different-vendor judge, budget, and SDX-0.
Licenses (if valid): whether persistent structured enforced state beats an expert prompt and the same content in one file on state-dependent facts, one vendor, one invented 9-change project. This is the experiment that decides whether the substrate claim (as opposed to the content claim) survives.

### B4a. SDX-1 pre-freeze sequence (added 2026-10-02 on JC's decision: budget is no object, refine longer, critics from other vendors)
Order, each step a gate for the next: (1) vendor-diverse critic rounds (at least 3 vendors, at least 2 not Anthropic; `COPILOT-CRITIC-RUNBOOK.md`; adjudicate, revise, repeat) until two consecutive rounds leave no accepted BLOCKER, at most four rounds, then JC chooses freeze-with-declared-limits, Core scope or shelve; (2) practitioner artifacts: human A6 and A5 (`HUMAN-PRACTITIONER-BRIEF.md`), L appendix and flat file, model-authored A5-m1 and A5-m2 per non-Anthropic vendor (`COPILOT-PRACTITIONER-RUNBOOK.md`, `PRACTITIONER-HANDLING.md`), then leak (M1) and strength (M2) checks with a different-vendor judge and the independent reviewer; (3) SDX-0 pilot (B1); (4) SESOI and n fixed from SDX-0 with justification; (5) final critic round on the complete package; (6) freeze: tag, OSF registration of record, Zenodo mirror (JC has both accounts). Roles: `C:\workspace\PragmaWorks\gs\gs-experiment-protocol\docs\experiments\ROLES.md`. Cost: model spend for critics and practitioner sessions is small (tens of dollars); the cost is JC's driving time (about 1 to 2 hours per critic round, about 15 minutes per practitioner session) and the human practitioner and reviewer (about 6 to 10 hours each, paid). Licenses: nothing by itself; it is what lets SDX-1 reach tier A with independence conditions met.
Open design items this sequence creates (for the next SDX-1 and SDX-1-ARMS revision, not edited yet): add the A5-m and A6-m arms and the rule that at most two A5-m enter the run (best m1 by the M2 rule, plus its m2 twin if budget allows); update SDX-1-ARMS section 3 step 2 so the human brief says that nobody answers questions during a session (the model and human briefs now state it); record the practitioner-independence rule for a practitioner who has read GS material (informed variant, outside H1 and H2).

### B5. CR rerun at power (about $300 to $800; needs a machine with enough VRAM for the weak rungs)
Redesign of the existing capacity-relative study: k of at least 5, a second invented domain, the registered trend test actually run, the canary result logged, a behaviour-first oracle (convention-tolerant) so the weak rung's apps are scored, layer metric replaced by untargeted metrics. Proposal for a better hypothesis than the monotone law: ablate the specification cascade components (sentinel, acceptance criteria, ADRs, hooks) per capability tier, so the result says which component acts at which capacity. Licenses: the capacity-relative claim, or its narrower form. Depends on B1 (harness).

### B6. Twin studies at scale (TX, SX, CX family) (about $300 to $1,000)
Update 2026-10-02 (second pass, DRAFT): the scale-threshold idea is now SDX-4 (H-CONTEXT), run on the Pastura fixture with a frozen ballast corpus instead of author-built twins; see "Added 2026-10-02, second pass" below. B6 stays as the twin-based variant if JC prefers it.
Larger codebase (hundreds of files), twins matched on behaviour with seeded defects present in both, hidden oracle, a modification dependent variable, a sentinel arm, k at least 5. Proposal for a better hypothesis than "structure lowers reading cost": a scale threshold: state or structure effects bind only once the repository exceeds what a fresh session reads; manipulate repository size or read budget directly and look for the crossing point. Licenses: where, if anywhere, structure alone pays. The TX null stays in force until then.

### B7. Revival grid (registered design in `C:\workspace\PragmaWorks\gs\generative-specification\experiments\revival\PREREGISTRATION.md`) (about $200 to $600, local models)
Run after B1 harness exists. Fixed difficulty tiers and a model ladder, per-cell numeric predictions and falsifiers. Better hypothesis than "N-version revives": the exposure statement itself, a per-cell prediction of defect exposure from model tier and difficulty, tested out of sample. Licenses: a calibrated claim about when cheap rigor pays, or evidence that the model does not predict. NX stays classified as a floor result until the grid supersedes it.

### B8. SDX-2: replication and extensions (about $700 to $2,000)
Update 2026-10-02 (second pass, DRAFT): SDX-2 keeps this meaning (ablation, second vendor, frontier cell, enforcement-only arm). It also carries the frontier cell that every hypothesis in `C:\workspace\PragmaWorks\gs\gs-experiment-protocol\docs\experiments\HYPOTHESES-2026-10-02.md` needs for its sufficiency ratio, and the component arms A4-L1, A4-L23, A4-open (below).
Added by revision 2: a per-element ablation of L1 to L5 (the bundle gap in SDX-1 cannot say which element acts; run only if SDX-1 shows a gap) and a frontier-model cell for A5 vs A4 (the gap is predicted to shrink with capability).
Second vendor as a replication (not pooled), enforcement-only arm (expert prompt plus a generic must-pass hook; does the gate explain the effect?), frontier tier (does the effect recede with capability?), same-vendor handoff fork, a longer horizon if SDX-1 hit a ceiling. Depends on B4 outcome.

### B9. Independent rerun of the primary contrast (calendar-bound: weeks)
A disinterested party reruns the SDX-1 primary contrast from the published package without author help. Cheaper and stronger than an extra internal vendor. Licenses: moves tier from author-run to independently replicated. Schedule when B4 is frozen.

### B10. SDX-3: governance and audit (about $300 to $800)
Update 2026-10-02 (second pass, DRAFT): SDX-3 is H-GOV. New cheap comparator arm A7 (commits as ledger) and an optional rotating-actor arm; cost revised to about $500 to $1,800. See below.
Reconstruction of decisions and injected-defect detection by stateless fixed-vendor judges, with A3 as the comparator (both arms can record rationale), defects defined against the shared base spec and change list, deterministic sensors reported separately. Licenses: the audit claim that currently has design but no clean test.

### B11. Judge validity check (about $20 to $60, 2 days)
Measure self-preference and run-to-run noise of the audit rubric across judge vendors on a fixed set of already generated repositories, with a human-scored subset. Why: AX-K5 showed audit disagreement of up to 6 points between two runs of the same prompt. Licenses: whether any audit-based number can be used at all and with what interval. Cheap enough to precede B3.

### B12. Human-rater study (about $6,000 to $10,000, 6 to 8 weeks; needs institutional review if run through a university)
Update 2026-10-02 (second pass, DRAFT): split into SDX-6 (prompt-author version of H-FLOOR, cheaper) and SDX-7 (live human study for H-LEARN and the interactive H-FLOOR). The $6,000 to $10,000 here is the floor for a 12 to 16 person pilot; an adequately powered equivalence study is estimated higher (below).
Cannot be automated and cannot be outsourced to the author's orbit. Proposal: a design principle list rather than a design.

Principles (public-safe):
1. Test the thing the hypothesis is about. If the hypothesis is about a method, the intervention is the method as written, not the tooling, onboarding, or setup sessions around it. Pilot the intervention with 3 to 5 people and check they received what the hypothesis says they receive (intervention fidelity).
2. One task and one project for all arms, so project type cannot confound the arm.
3. Arms and condition labels fixed and locked before enrollment; random assignment recorded; sample size capped and confirmed before the window opens (no uncapped walk-ins).
4. Primary outcome not defined by the treatment's own vocabulary: a hidden behavioural test suite and independent maintainability review, not a rubric made of the treatment's instructions. A treatment-aligned rubric may be secondary.
5. At least two blind raters recruited independently of the author's orbit (no students, no commercial partners), a pre-registered rubric, kappa reported, and a disinterested adjudicator for disagreements.
6. Registration at an external registry before enrollment, including the decision table and the "wrong experiment" triggers (for example: intervention not delivered as written, differential dropout, floor or ceiling on the primary outcome).
7. A positive control: a known effect (for example an arm with an obviously helpful aid) that the study must detect before a null on the real contrast is believed.
8. Realistic duration; measure time-to-completion as an outcome and do not stop participants mid-task in one arm only.
9. Compensate participants; run a conflict-of-interest and organizational-permission check before recruiting; collect no confidential material.
10. Report null and negative results in the same voice, with the raw data, whatever they are.
Licenses: the human-validation claim reviewers asked for, scoped to the studied population.

## Which existing results need a redesigned rerun (not a patch)

| Existing | Why it cannot be patched | Replacement |
|---|---|---|
| AX and AX-K5 headline claims | Ceiling, treatment-targeted metric, memorized benchmark, non-independent audit, protocol after data | B3 (after B11) |
| AX2 GS vs expert and behavioural quality | Saturation; oracle measured convention; heterogeneous scaffolds | B3 and SDX-1 on the locked scaffold |
| CR behaviour and trend claim | n=3, weak-rung apps did not serve, trend test not run, canary missing | B5 |
| TX, SX, CX | Small scale, author-built twin, vacuous tasks | B6 |
| NX | Floor; post-hoc problem | B7 |
| MX | Ceiling on a memorized task | folded into B8 (frontier and tier cells) or a harder-task rerun |

## Added 2026-10-02: the replacement hypothesis if SDX-1 returns row (iii)
If an expert prompt without the load-bearing elements ties the substrate (SDX-1 section 10, row iii), the replacement hypothesis is that the substrate pays in governance and continuity outcomes (audit reconstruction, ratification, regeneration), not in correctness. That is SDX-3 (B10), to be designed and registered before any such claim is made; the validity audit and the intuition-falsifiability check (guard f) come first.

## Hypotheses that may be better replaced (proposals, not decisions)

| Current | Concern | Proposed replacement |
|---|---|---|
| GS beats an expert prompt (single shot) | Expert prompt contains GS content; saturates; cannot separate content from substrate | Persistence of content vs structure vs enforcement on state-dependent probes (SDX-1) |
| Disciplined structure alone is cheaper to read | Refuted at small scale | Scale-threshold hypothesis (B6) |
| Capacity-relative monotone law | Single aggregate curve hides which component acts where | Component ablation per capability tier (B5) |
| N-version revives on weak models | Exposure floor; post-hoc selection | Out-of-sample exposure prediction (B7) |
| Rubric validated by three repositories | n=3, circular | Judge validity and hidden-outcome correlation: does the rubric score predict a hidden behavioural or maintenance outcome across many repositories? (new, follows B11) |
| "Governed" as maturity level L4 | Never measured as a predictor | Does a level predict regression flips or audit detection across projects (observational, after SDX-3) |

## Added 2026-10-02, second pass: JC's four sharpened questions (DRAFT, nothing frozen, nothing run)

Source and formal statements: `C:\workspace\PragmaWorks\gs\gs-experiment-protocol\docs\experiments\HYPOTHESES-2026-10-02.md`. In short: H-CONTEXT (the map), H-PHASE (executed verification in the open), H-FLOOR (spread between practitioners), H-GOV (stateless audit and reconstruction), H-LEARN (experience instead of training). Independent replicators for the frozen ones: `C:\workspace\PragmaWorks\gs\gs-experiment-protocol\docs\experiments\REPLICATOR-BRIEF.md`. Cost figures are estimates, same convention as above (model spend plus agent-assisted preparation; preparation is usually the larger cost; human figures assume paid participants at about $75 per hour and are the least certain).

### Hypothesis to experiment map

| Hypothesis | Test mode | Experiment id | Relation to existing items | Folded into SDX-1? |
|---|---|---|---|---|
| H-CONTEXT | Models | **SDX-4** (new; absorbs B6) | B6 twin studies at scale | Only a data-capture requirement: tokens by tool-result category, turns and files read, per session. Descriptive secondary, no verdict (size is confounded with change index) |
| H-PHASE | Models (humans optional as reviewers) | **SDX-5** (new): Part A layer study, Part B agent-in-loop, Part C natural escapes | none | No. SDX-1's oracle is itself an executed check on every arm, so SDX-1 cannot test it. Part C reads SDX-0 and SDX-1 final repositories (archive them) |
| H-FLOOR | Humans as prompt authors, models run; model-persona pilot is a proxy only | **SDX-6** (new): P0 model-persona pilot, then the human prompt-author study | part of B12 | No (needs people). SDX-1's A5b replicate chains give the within-text noise for its ICC check |
| H-GOV | Models (humans optional as blind raters) | **SDX-3** (existing id, B10) | B10, B11 first | Partly: A5, A3 and A4 final repositories from SDX-1 are reused as audit subjects if archived |
| H-LEARN | Humans only | **SDX-7** (new) | B12 | No |
| Sufficiency ratio and frontier cell (all five) | Models | SDX-2 (existing, B8) | B8 | No |

Cheap folds: nothing is folded into SDX-1 as an arm or readout (any addition is structural and resets the critic counter, `ROLES.md` section 6). What is cheap and recommended is that SDX-1's harness archive every per-change working-tree snapshot and every session transcript with its tool-use and token breakdown (a few GB, no extra model spend). That lets SDX-3 (audit subjects), SDX-4 (descriptive size trend), SDX-5 Part C and SDX-6 (noise estimate) reuse chains. Tier caveat: an outcome registered after SDX-1 outcome data are unblinded is tier C, not B; register the SDX-3, SDX-5 and SDX-6 analysis plans before SDX-1 is unblinded if reuse is intended.

### Items

#### B13. SDX-5, H-PHASE: executed verification in the open (Part A about $250 to $600 and 40 to 70 agent-assisted hours, 1 to 2 weeks; Part B about $700 to $2,000, about 3 weeks; Part C about $50 to $150 after SDX-1) DRAFT
- Part A: the reference implementation of Pastura (it exists for the SDX-0 oracle validation, V2) plus a registered set of injected defects: about 8 real-world-behaviour classes from an external taxonomy times 5, two control classes (planted logic and type errors; spec-level misunderstanding), and 20 clean items, about 80 items. Layers D1 static, D2a own tests, D2b independent unit suite, D3 test-environment integration, D4 model review (two vendors, two runs), D4+ effort-matched agentic review that may not execute, D5 open-field execution.
- Part B: arms A5, A5-open (A5 plus an instruction to run the real process on a real data file and restart it before finishing), A4, A4-open (A4 with an execute-in-the-open step as an enforced gate); sealed open-field probe suite (restart persistence, migration of a data file written by the previous change, concurrency, season and daylight-saving boundaries, volume). n = 20 chains per arm plus controls (A0, A5b), about 120 chains.
- New arms and probes beyond SDX-1: A5-open, A4-open, an L6 tag (execute-in-the-open gate) for follow-on experiments only, the defect taxonomy and instances, the sealed open-field probe suite, the layer harness.
- Shares: Pastura, scaffold, base oracle, A0, A5, A5b, A4.
- Licenses: whether the open field adds unique catches over review and test-environment checks, per unit cost; or that it does not. Depends on SDX-0 (harness, oracle V2) and B11. Does not depend on SDX-1 results, so Part A can run in parallel with the SDX-1 critic phase.

#### B14. SDX-4, H-CONTEXT: the map at scale (about $600 to $1,800, 2 to 3 weeks; ballast construction 50 to 80 agent-assisted hours) DRAFT
- Size manipulation S (about 3 kLOC), M (about 15), L (about 60) by a frozen ballast corpus; arms A0, A5, A3-scaled (flat file that grows with the project), A4-L1 (sentinel only), A4 full, plus a mechanical-oracle map (ceiling), a stale-map arm (negative control) and an A/A. Tasks T1 cross-cutting, T2 localized, T3 state-dependent, plus needle questions. n = 12 sessions per cell to start (re-planned from SDX-0 variance). Single-change sessions, plus a short 3-change drift mini-chain at L.
- Primary: total tokens per accepted change including map upkeep, and fresh-probe pass rate; arm by size interaction. Targeted (no verdict): search and read tokens, files, turns.
- New arms and probes: A3-scaled, A4-L1, mechanical-oracle map, stale map, ballast corpus, needle set, transcript extractor (also the SDX-1 data-capture requirement).
- Shares: Pastura and its oracle; A0, A5, A3, A4.
- Licenses: where, if anywhere, a map pays (scale threshold), as cost-only or cost-and-correctness. Depends on SDX-0. Can run before SDX-1 data exist; its A4-L1 arm is the L1 component of the SDX-2 ablation.

#### B15. SDX-6, H-FLOOR: spread between practitioners (P0 pilot about $150 to $400, 1 week; human version about $8,000 to $12,000, 8 to 12 weeks including recruitment, likely ethics review) DRAFT
- P0: a model-persona prompt ladder (terse novice, mid, expert) to debug the pipeline and the arm-by-stratum analysis; labelled proxy, no verdict on the hypothesis.
- Human version: about 30 practitioners in three pre-assessed skill strata (about 10 each), each writing change requests and a session-start instruction once (2 to 3 hours, text only). Their texts are replayed under arms N (no substrate), P (placebo substrate) and S (A4) on Pastura, k = 3 chains per text and arm, about 270 chains (about $1,500 to $4,300 model spend) plus practitioner pay (about $6,750).
- New arms and probes: P (placebo substrate), the skill assessment instrument (experience plus a baseline work sample on a different small project with its own hidden tests), the text-replay harness.
- Shares: Pastura, oracle, A4, A5b-style replicate chains for the within-text noise.
- Licenses: whether the substrate narrows practitioner spread and raises the floor, or that practitioners do not matter here (no spread to shrink). Depends on SDX-0 and on a gate: run the human version only if SDX-1 shows H1 positive or SDX-3 or SDX-5 shows a gap.

#### B16. SDX-7, H-LEARN (and the live, interactive H-FLOOR): the human study (about $25,000 to $45,000 adequately powered; 3 to 5 months; ethics review likely) DRAFT
- Arms U, T, S (optional T0 time-matched generic training, TS), blocked on skill; about 30 per arm under an assumed SD of 15 points and a margin of 10 (TOST), so 90 to 120 participants, a 3 to 4 hour task each, paid; non-author trainer; two blind maintainability raters recruited outside GS's orbit; an intervention-fidelity pilot of 3 to 5 people first. B12's $6,000 to $10,000 buys a 12 to 16 person pilot only.
- Shares: the Pastura-like task family and hidden oracle; arm S is A4.
- Licenses: the human-validation claim scoped to the studied population, or that training matters, or that the substrate does not stand in for it. Depends on SDX-6 P0, a registered fixture and a funding decision. Last in line.

#### B10 revised (SDX-3, H-GOV): about $500 to $1,800 DRAFT
Chains: reuse archived SDX-1 A5, A3 and A4 repositories; new A7 chains (commits as ledger, n = 20, about $110 to $330); optional rotating-actor chains for A5 and A4 (about 40 chains, about $220 to $660); audits: arms times chains times (clean plus injected variants) times two auditor vendors times two runs, about 1,000 to 1,300 audits at $0.5 to $1.5 each. New arms and probes: A7, the fact list and divergence families, two injection scripts, the confabulation control. Depends on B11 (judge validity) and SDX-1 chains. Licenses: whether the audit and reconstruction value belongs to the substrate or to the commit log.

#### B17. SDX-9, H-P6, spec-to-implementation throughput in stages: DRAFT (design draft revision 2, 2026-10-03, not frozen; about $1,900 to $7,400 Core plus a $180 to $720 pilot and 135 to 205 agent-assisted preparation hours; at the authors' central prior the registered procedure would rarely report a crossover at n = 20, so a pilot-informed simulation decides whether to buy it, SDX-9 section 14)
Registrable draft: `C:\workspace\PragmaWorks\gs\gs-experiment-protocol\docs\experiments\prereg\SDX-9.md`. Fixed reviewed spec with numbered acceptance criteria, sealed probes with criterion ids and stage tags, stages S0 to S4 with machine-checkable completeness (criteria coverage, executed behavioural checks, gates, open-questions gate), margins (the spec's declared completeness q, allowed deviations d_k, budget bands, escape band on a held-out suite), arms C1 to C4 (C5 optional), primary cost to verified COMPLETE with escapes inside the band, registered crossover stage by a fixed-sequence procedure. Shares Pastura, the scaffold, the harness, A0, A5 and A5b with SDX-1 byte-identically; A4 is a fork (A4-S9) so SDX-1 is not edited. New: criteria-tagged oracle manifest, stage scorer, held-out post-complete suite, planted-ambiguity set, advisory-gate arm C3, stale-ledger and half-cap controls. Depends on SDX-0 and its own pilot SDX-9-P (SDX-0 has no build-from-empty data), B11 (escape audit), SDX-5 Part B open-field suite (S3). Does not depend on SDX-1 results; needs SDX-1 frozen for the shared bytes. Licenses: whether the substrate reaches a verified complete build at lower cost with setup and upkeep counted, and from which stage; or that it does not.

#### B18. SDX-8, H-NET, durability and the net-cost crossover over a growing chain: DRAFT (design draft revision 2, 2026-10-03, not frozen; about $4,000 to $11,700 Core plus a $320 to $940 pilot and 170 to 260 agent-assisted preparation hours; same caveat on power, and the SDX-4 pilot at sizes S and L is its premise check, SDX-8 section 14)
Registrable draft: `C:\workspace\PragmaWorks\gs\gs-experiment-protocol\docs\experiments\prereg\SDX-8.md`. CR0 plus 30 changes (SDX-1's ten, then twenty more) on a repository growing from about 3 to about 18 kLOC with an arm-neutral ballast corpus (four tranches) shared with SDX-4; arms A0, A5, A5g (expert prompt plus a generic must-pass hook), A4 (n = 20 each) plus A5b, A0S, A4-stale controls (n = 10); Full adds A3. Co-primaries: growth of marginal cost per durably accepted change across ten-change windows, and the registered net crossover (fixed-sequence over checkpoints 30 to 5, comparators A5 and A5g, cost views V1 to V3, setup and upkeep inside V1). Answers the part of the METR-type objection that asks whether process overhead pays off as the repository grows; does not address METR's own finding (experienced humans, tacit knowledge). Shares fixture, scaffold, harness, changes 1 to 10, A0, A5, A5b, A0S, A4, A3 with SDX-1 byte-identically; new: changes 11 to 30, ballast, long-chain oracle and reference implementation, A5g hook (the enforcement-only arm SDX-2 needs, so SDX-2 adopts these bytes or uses a new id), A4-stale, durability scorer, follow-on tasks. Depends on SDX-0, its own pilot SDX-8-P, SDX-4's ballast, SDX-5's open-field suite, B11. At planning n = 20 the resolvable saving depends on the pilot SD (about 17 to 21% only if the SD of the primary is 0.20 to 0.25): whether to buy a larger n, sign the estimation-study label or not buy it is JC's decision (SDX-8 section 14). Two Claude critics reviewed round 1 (`prereg\SDX-8-9-REVIEW.md`); vendor-diverse review owed. Licenses: whether and from which change the substrate's overhead is repaid in this regime, or that it is not within 30 changes.

### Shared fixture and arms

One fixture: Pastura, the locked scaffold, the sealed oracle, arms A0, A5, A5b, A0S, A4 and the SDX-1-ARMS manifest (`C:\workspace\PragmaWorks\gs\gs-experiment-protocol\docs\experiments\prereg\SDX-1-ARMS.md`) are reused unchanged. Arms and probes to add, none of which touches SDX-1:

| New arm or probe | Used by | Note |
|---|---|---|
| A7 commits-as-ledger (harness writes the change text and reply as the commit message) | SDX-3 (also a candidate Full-scope arm of SDX-1 if the critics want it) | cheapest rival to the substrate for audit |
| A4-L1, A4-L23, A4-open component arms | SDX-2 (ablation), SDX-4, SDX-5 | A4 minus components; makes the prediction matrix of HYPOTHESES section 8 testable |
| A5-open (expert plus execute-in-the-open instruction) | SDX-5, SDX-2 | the cheap rival for H-PHASE |
| A3-scaled flat file, stale-map arm, mechanical-oracle map | SDX-4 | negative and positive controls |
| P placebo substrate | SDX-6, SDX-7 | inert directory of the same size |
| Open-field probe suite, defect set, layer harness | SDX-5 | sealed |
| Ballast corpus, needle set, transcript extractor | SDX-4 (extractor also SDX-1 data capture) | the extractor must exist before SDX-1 runs |
| Skill assessment instrument, text-replay harness | SDX-6, SDX-7 | measured, not self-reported |
| A5g expert plus generic must-pass hook (tests and strict type check) | SDX-8 (defined there), SDX-9 as C5, SDX-2 (enforcement-only arm) | same bytes in all three or a new id |
| A4-stale (routing and rules wrong for a registered fraction, n = 20) and the planted cost controls A5-read (SDX-8) and C2-pad (SDX-9) | SDX-8 (30%), SDX-9 (25%, ledger ids) | negative and positive controls |
| A4-S9 fork (spec-generated ledger and sentinel, criteria-coverage gate, open-questions gate), C3 advisory-gate arm | SDX-9 only | a fork under a new id so SDX-1's A4 is untouched |
| Changes 11 to 30, long-chain oracle and reference implementation, durability scorer, follow-on tasks | SDX-8 only | ballast corpus shared with SDX-4 |
| Spec package, extension package E, planted ambiguities, stage scorer, held-out post-complete suite | SDX-9 only | open-field suite shared with SDX-5 Part B and SDX-8 |
| Divergence families, fact list, injectors, confabulation control | SDX-3 | defined against the base spec and change list |

### Dependency order and recommended sequencing

0. **FX-0 (checker and harness pilot), then FX-1 (B-FX).** Everything below is downstream of FX-1 (added 2026-10-05): the substrate must be installed correctly before any difference is measured. SDX-0 can be prepared in parallel (harness work is shared in spirit) but SDX-1 and the P1 to P4 family may call their enforced arm "formula-built" only for elements FX-1 certified; otherwise it is declared hand-built.
1. B0 protocol adoption and B1 SDX-0 (harness, oracle with reference implementation, V1 to V13). Everything depends on it. Unchanged.
2. B11 judge validity (about $20 to $60). Needed before any audit or review number: SDX-3 and the D4 layers of SDX-5.
3. In parallel with the SDX-1 critic phase and before SDX-1 data: **SDX-5 Part A** (cheap, independent of SDX-1, answers question 2 directly) and an **SDX-4 pilot at sizes S and L only** (checks the positive control: does A0 cost grow with size?). Each is registered and frozen on its own.
4. B4 SDX-1 (Core or Full). Archive snapshots and transcripts. Decide A7 for Full.
5. SDX-3 (H-GOV) on archived and new chains; SDX-4 in full; SDX-5 Part B and C. Order among these by what SDX-1 says: under row (iii) (no added state-dependent correctness) SDX-3 and SDX-5 become the main evidence (see "replacement hypothesis" above); under row (i) or (ii), SDX-4 and SDX-5 Part B refine where the value sits.
5b. SDX-8 (long chain, crossover in change index) and SDX-9 (spec to verified COMPLETE, crossover in stage), both DRAFT designs (2026-10-03), each its own registration and its own pilot (SDX-8-P, SDX-9-P) after SDX-0; neither waits for an SDX-1 result, both need SDX-1 frozen for the shared bytes. SDX-9 is cheaper per chain and could run first; decide the order after the critic rounds. Their critic rounds are separate review targets and do not reset SDX-1's counter.
6. SDX-2 (ablation, frontier cell, second vendor) when SDX-1 shows a gap; it supplies the sufficiency ratios.
7. SDX-6 human version, then SDX-7, only if steps 4 to 6 justify human money. Start independent-replicator recruitment (B9, `REPLICATOR-BRIEF.md`) as soon as SDX-1 is frozen, not after its result.

Model-only spend through step 6 is on the order of $2,500 to $8,000 with SDX-1 Full; the human studies add about $33,000 to $57,000. All are guesses until SDX-0 measures cost per chain.

### Overlap risk (HYPOTHESES section 8)

Four positive results for A4 on one set of chains are one bundle measured four ways unless component arms (SDX-2) separate them. Sequencing therefore puts H-PHASE (the most independent hypothesis: verification mode, not persistence) first, and the component ablation before any public count of confirmations.

## Standing rule for this list

An item moves from PROPOSED to REGISTERED only through the protocol. If an earlier item's result shows a later item is the wrong experiment, the later item is edited here, with the reason, before any spend.
