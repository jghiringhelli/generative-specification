# Experiment backlog (prioritized, dependency order)

2026-10-02. Everything here is a PROPOSAL until it has a logbook entry and a frozen registration. Cost figures are estimates in model spend plus agent-assisted preparation; the time to prepare is usually the larger cost. Protocol: `C:\workspace\PragmaWorks\gs\generative-specification\docs\experiments\EXPERIMENT-PROTOCOL.md`. Index: `C:\workspace\PragmaWorks\gs\generative-specification\docs\experiments\LOGBOOK\README.md`.

## Ordering logic

1. Fix the instrument before using it: one harness (locked scaffold, convention-tolerant hidden oracle, non-memorized benchmark, stateless judges, controls) is reused by almost everything below.
2. Run the cheapest experiment that can change a decision first.
3. A result that would only be believable after an independent party reruns it gets that rerun scheduled, not assumed.
4. Nothing in this list needs to appear in the paper, the site or the course; each ends as a logbook entry.

## Items

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
Larger codebase (hundreds of files), twins matched on behaviour with seeded defects present in both, hidden oracle, a modification dependent variable, a sentinel arm, k at least 5. Proposal for a better hypothesis than "structure lowers reading cost": a scale threshold: state or structure effects bind only once the repository exceeds what a fresh session reads; manipulate repository size or read budget directly and look for the crossing point. Licenses: where, if anywhere, structure alone pays. The TX null stays in force until then.

### B7. Revival grid (registered design in `C:\workspace\PragmaWorks\gs\generative-specification\experiments\revival\PREREGISTRATION.md`) (about $200 to $600, local models)
Run after B1 harness exists. Fixed difficulty tiers and a model ladder, per-cell numeric predictions and falsifiers. Better hypothesis than "N-version revives": the exposure statement itself, a per-cell prediction of defect exposure from model tier and difficulty, tested out of sample. Licenses: a calibrated claim about when cheap rigor pays, or evidence that the model does not predict. NX stays classified as a floor result until the grid supersedes it.

### B8. SDX-2: replication and extensions (about $700 to $2,000)
Added by revision 2: a per-element ablation of L1 to L5 (the bundle gap in SDX-1 cannot say which element acts; run only if SDX-1 shows a gap) and a frontier-model cell for A5 vs A4 (the gap is predicted to shrink with capability).
Second vendor as a replication (not pooled), enforcement-only arm (expert prompt plus a generic must-pass hook; does the gate explain the effect?), frontier tier (does the effect recede with capability?), same-vendor handoff fork, a longer horizon if SDX-1 hit a ceiling. Depends on B4 outcome.

### B9. Independent rerun of the primary contrast (calendar-bound: weeks)
A disinterested party reruns the SDX-1 primary contrast from the published package without author help. Cheaper and stronger than an extra internal vendor. Licenses: moves tier from author-run to independently replicated. Schedule when B4 is frozen.

### B10. SDX-3: governance and audit (about $300 to $800)
Reconstruction of decisions and injected-defect detection by stateless fixed-vendor judges, with A3 as the comparator (both arms can record rationale), defects defined against the shared base spec and change list, deterministic sensors reported separately. Licenses: the audit claim that currently has design but no clean test.

### B11. Judge validity check (about $20 to $60, 2 days)
Measure self-preference and run-to-run noise of the audit rubric across judge vendors on a fixed set of already generated repositories, with a human-scored subset. Why: AX-K5 showed audit disagreement of up to 6 points between two runs of the same prompt. Licenses: whether any audit-based number can be used at all and with what interval. Cheap enough to precede B3.

### B12. Human-rater study (about $6,000 to $10,000, 6 to 8 weeks; needs institutional review if run through a university)
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

## Standing rule for this list

An item moves from PROPOSED to REGISTERED only through the protocol. If an earlier item's result shows a later item is the wrong experiment, the later item is edited here, with the reason, before any spend.
