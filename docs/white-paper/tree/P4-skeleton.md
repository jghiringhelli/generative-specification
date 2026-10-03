# Trunk P4 skeleton (flagship): durability under iteration, with the net-throughput crossover (2026-10-03)

Status: skeleton, not a draft. Companion to `TREE.md` (card P4). Sources: `C:\workspace\PragmaWorks\soma\docs\gs-contributions-literature-map-2026-10-02.md` (sections 1.3, 2 and 4), `C:\workspace\PragmaWorks\soma\docs\productivity-studies-dissection-2026-10-03.md` (sections 2, 3 and 4), and under `C:\workspace\PragmaWorks\gs\gs-experiment-protocol\docs\experiments\`: `prereg\SDX-1.md`, `prereg\SDX-1-ARMS.md`, `HYPOTHESES-2026-10-02.md`, `BACKLOG.md`, `LOGBOOK\README.md`. No result for P4 exists. SDX-1 is a draft, design-reviewed by Claude critics only, not frozen; SDX-8 (the long-chain experiment) is a proposal in the dissection note and is not drafted or registered; its id is provisional (JC may rename it).

## 1. Title options

1. Does Enforcement Outlast Advice? A Preregistered Study of Erosion in Iterated Agent-Built Software
2. Advice Moves the Intercept, Gates Move the Slope? Durability under a Persistent, Enforced Specification Substrate
3. When Does the Substrate Pay for Itself? Durability and a Registered Crossover in Agent-Built Software

Question-form titles are deliberate: the paper must read the same whichever outcome label arrives.

## 2. Abstract draft (at most 200 words; no results; slots in brackets)

Agent-built code degrades as an agent extends its own earlier work, and benchmark evidence reports that prompt-level quality guidance lowers the starting point without changing the rate of degradation. We ask whether the same obligations, delivered as enforcement rather than advice, change the rate. In a preregistered, cross-session study on an invented domain with a sealed, convention-tolerant oracle, an agent extends a growing repository over a long chain of changes under five channels: no guidance; an expert prompt that instructs no persistent artifact; the same content in one persisted file; an expert prompt with a generic must-pass hook; and the full substrate (sentinel, specification ledger, decision records, executed gates with a ratchet, coherence lock). The primary outcomes are the slope, across checkpoints, of regression flips on sealed carried probes and of an erosion measure computed by a tool the gates do not use. Registered secondary hypotheses ask for the change index at which cumulative verified throughput, counting all setup and upkeep, overtakes the best advisory arm. Outcome: [SUPPORTED / NULL / REFUTED / INCONCLUSIVE / INVALID-DESIGN per the registered decision table]. Scope is one vendor and one mid-tier model [plus a frontier cell]; a human-developer extension is [reported / owed]. We report the result in the same voice whichever label applies.

## 3. Contribution list

1. **The channel-versus-content test.** Identical obligations delivered as advice, as persisted text, as enforcement and as the full substrate, so that a difference is attributable to the channel and not to what the obligations say.
2. **Durability measured as slopes**, not single-shot scores, with an erosion metric the treatment does not target (a SlopCodeBench-style measure from an independent tool) and sealed carried probes for regression flips.
3. **A registered net-throughput crossover**: the change index after which the substrate, charged for setup and upkeep, delivers more durably accepted changes per unit cost than the best advisory arm, or the statement that none occurs within the registered horizon.
4. **A sufficiency analysis**: how much of any gain a cheap alternative (the enforcement-only arm; the flat file) recovers, with the claim reduced accordingly (sufficiency ratio at or above 0.8 reduces "the substrate" to "gates").
5. **A refutation record**: pre-stated gap ranges, falsifiers and a decision table, so a result cannot later be described as "as expected".

Not contributions: any speed or productivity claim; any claim about experienced developers on mature repositories (METR-type results are explained by mechanisms GS does not touch, per the dissection note); any claim about human teams unless the human extension reports.

## 4. Section outline

| # | Section | Content |
|---|---|---|
| 1 | Introduction | agent erosion; why advice and enforcement differ; why a crossover; what is not claimed |
| 2 | Background | SlopCodeBench; He et al. MSR 2026 (debt-to-velocity loop; prescribes metric-triggered refactoring, test requirements that scale and self-throttling); Agarwal et al.; RAMP; SWE-Milestone and SWE-CI; DORA on batch size and stability; context-file studies (Gloaguen, Khatri, Lulla) as the cost preview; the 2026 study cited in the bridge-grounding note on prompt specificity not affecting structural quality (check at source) |
| 3 | The channels and the substrate | L1 to L5; the manifest of generic (G) and load-bearing (L) content; parity and leak checks; what is enforced and what is advised |
| 4 | Design | fixture (Pastura, locked scaffold, sealed oracle); arms; chain length and growth; ballast; pinned models; archives of every snapshot and transcript; blinding; judges |
| 5 | Outcomes and analysis plan | primary: slopes; secondary: cost per durably accepted change, crossover index with bootstrap interval, follow-on task time in modified areas, rework share; mixed model (arm by log size or index, random intercept per chain); permutation tests; SESOI and equivalence tests |
| 6 | Controls and validity gates | positive control (state restated in text; known effect); negative control (A/A; stale substrate); growth-regime check (bare agent cost at the large size at least twice the small); floor and ceiling; circumvention rate under intention to treat |
| 7 | Results (one subsection per experiment: SDX-1, SDX-2, SDX-8; registered label first) | |
| 8 | Sufficiency, moderator and mediators | enforcement-only recovery; model-tier by arm; do mediators (rework share, follow-on time, flips) move |
| 9 | Threats to validity | below |
| 10 | Discussion | what each decision row permits; the implications for P3 and the product claim; what was not tested (regimes of SDX-1 section 10a) |

## 5. Claims-evidence table (from the logbook; external literature separated)

Logbook rows (the only GS evidence the paper may cite as such):

| Id | Claim | Logbook entry, outcome, tier | May state | May not state |
|---|---|---|---|---|
| P4-L1 | An expert prompt ties the cascade on single-shot quality | AX and AX2: GS vs expert INVALID-DESIGN (ceiling, saturation), tier C | the single-shot comparison could not have shown a difference; its limits are why this study exists | equivalence; that the substrate adds nothing; that it adds something |
| P4-L2 | Structured guidance beats none on structure | AX layer violations, AX2: SUPPORTED as mechanism on a targeted metric, tier C | at the starting point, structure helps on the metric the prompt states | durability; behaviour |
| P4-L3 | Enforcement works in a live deployment | EX DEMONSTRATION, tier D (15 builder-counted defects, no baseline) | one deployment closed its cycle with executed gates | a catch rate or a comparison |
| P4-L4 | Independent verification adds value | RND-1 independent-verification arm NULL by floor, n=2, tier C/D | the pilot had nothing for an independent verifier to catch | gates add or do not add |
| P4-L5 | The advantage depends on capacity | CR duplication and complexity INCONCLUSIVE, direction as predicted, tier C; AX2 and MX saturate | direction consistent with a moderator; a frontier cell is registered | a capacity law |
| P4-L6 | The substrate halts erosion; the crossover exists | no entry (SDX-1 designed; SDX-2 and SDX-8 not drafted) | hypotheses with refutation criteria | any durability or throughput claim |
| P4-L7 | A change in one developer's repositories | personal-repos census: exploratory, tier D, not yet a logbook entry | only after it is logged and anonymized: direction of a few descriptive ratios, labelled hypothesis-generating | any statement of speed, of GS causing anything, or of transfer (baseline is not "before AI"; sentinel present from the first commit in most repositories; one subject) |

External motivation (cited as literature, never as GS evidence; verification status from the literature map and the dissection note): SlopCodeBench (arXiv:2603.24755, verified abstract: erosion rises in most trajectories; anti-slop prompt cut initial erosion and verbosity but did not stop the degradation rate; cost rose and correctness fell slightly); He et al. (arXiv:2511.04427, full text read: velocity gain transient, warnings and complexity persistent, complexity predicts later slowdown; the authors say the debt loop alone likely does not explain the fade); Agarwal et al. (arXiv:2601.13597); RAMP (arXiv:2608.25241, observational); Gloaguen et al. (arXiv:2602.11988: context files raise cost over 20% without general success gains). METR 2025 and 2026 are cited for design lessons only (selection by refusal, difficulty imbalance), not as targets: its slowdown is mostly review overhead and tacit knowledge, which GS does not claim to address.

## 6. Design summary (what is registered or to be registered)

| Experiment | Question | Arms and manipulation | Primary readout | Status |
|---|---|---|---|---|
| SDX-0 | harness validity (oracle discriminates, no ceiling or floor, variance and cost plausible) | pilot of the SDX-1 harness | pass criteria V1 to V13; no research claim | DESIGN-REVIEWED draft rev 2 |
| SDX-1 | does the substrate add state-dependent correctness over an expert prompt lacking the load-bearing elements, over 10 changes | A0, A5 (expert minus GS), A5b (A/A), A0S (state restated; positive control), A4 (substrate); Full adds A1, A3 (flat file), A6, A4x | E1-SD adjusted for E1-SI (H1, SESOI 10 points, provisional); E1-SI (H2, 5 points) | draft rev 2, not frozen, vendor-diverse critic round 1 pending |
| SDX-2 | which element acts; does it hold at a frontier model; does a generic gate recover it | enforcement-only arm (expert prompt plus must-pass hook); component arms A4-L1, A4-L23, A4-open; frontier cell | sufficiency ratio; gap per tier | PROPOSED |
| SDX-8 (provisional id) | durability and crossover over a growing chain | K=30 changes, repository from about 3 to 15 kLOC; arms no guidance, expert prompt, expert prompt plus generic gate, substrate, substrate plus team-layer practices (atomic commits, decision records, halt-the-line); placebo directory for human version | slopes (primary); cost per durably accepted change and crossover index (secondary, H-NET-b); H-NET-c registers the expected slowness at the start | NOT DRAFTED; no registration |
| TRF-1 (provisional) | does it transfer to other developers | prospective stepped-wedge adoption, at least 20 developers, frozen scripts, added measures (coverage, sampled mutation score, independent defect counts, clean-clone executability) | within-developer change in untargeted metrics | NOT DESIGNED beyond the protocol sketch in the personal-repos note |

Orthogonality: P4's primary is the slope; the cost metric of SDX-8 overlaps P1, so P1 is restricted to single-change sessions across size. P3 reuses SDX-1 chains: counted once.

## 7. Outcome-conditional claim forms (written before any data)

| SDX-1 decision row (`prereg\SDX-1.md` section 10) | What P4 may say | What P4 must stop saying |
|---|---|---|
| (i) H2 equivalent, H1 positive | generic expert prompting did not beat naive on hidden correctness here; the substrate beat it on state-dependent behaviour | that prompting does not matter; frontier |
| (ii) both positive | generic expertise helps; the substrate adds a measured amount; which element acts is not shown | that each of L1 to L5 is load-bearing |
| (iii) H1 equivalent | the substrate adds no measurable state-dependent correctness beyond strong generic expertise on this construct; value, if any, lies in governance, continuity, audit, regeneration and read cost (P3, P1); both audits mandatory | "durable correctness" as a claim; rescue by regimes not pre-registered in 10a |
| (iv) H1 reversed | gate friction cost more than it bought at this size | same, plus a stated cost caveat |
| (vi) inconclusive | inconclusive at n; state the n | either direction |
| (vii) H1 and H3 positive (Full) | structure and enforcement add beyond the same content in one file | that durability is demonstrated in general |
| (viii) H1 positive, H3 equivalent | persisting content in a repository file is enough on this construct and horizon | that structure and gates are useless |
| (v) invalid | nothing; redesign | any conclusion |

For SDX-8: refutation rows 1 to 7 of the dissection note section 3.7 (no win over the expert prompt and the generic-gate arm at the large end by the SESOI; crossover beyond the horizon; a generic gate recovers at least 0.8 of the effect; win only when setup and upkeep are excluded; effect with unmoved mediators; faster but more escapes; opposite direction at all horizons).

## 8. Threats to validity (outline)

1. Proponent-authored substrate, sensors, oracle and change list; authoring asymmetry (the substrate by the GS side, the other arms by an outsider), so vehicle is confounded with author skill in H3 and H4. Mitigations: preregistration, an external practitioner, a builder blind to the change texts, mechanical derivation of state-dependent probes frozen before the substrate exists, parity and leak checks, an independent reviewer, published artifacts, an independent rerun.
2. Toy scale: at about 2 to 3 kLOC a fresh session can read everything, which excludes the regime where the substrate is claimed to matter (SDX-1 section 10a); SDX-8 exists to reach it, and is not yet written.
3. The modal SDX-1 outcome sits near its SESOI (pre-stated central gap about 9 points against 10): positive-small or inconclusive is the likely result; the paper must be written to carry that.
4. One vendor and a mid-tier model; the effect is predicted to shrink with capacity; a frontier cell is a separate registered cell; capacity is one story across trunks.
5. One invented domain, one change order; chains from one fixture are not independent confirmations.
6. Treatment-aligned metrics: if complexity or warnings are used as gates they cannot carry the verdict; use an independent tool and follow-on task time.
7. A ratchet may freeze a mediocre state (high quality, low throughput): report both, and the crossover.
8. Circumvention of gates: intention to treat; the word "enforced" is withdrawn if circumvention exceeds the registered rate.
9. The model-only design misses novelty and abandonment (a stated mechanism in the Cursor study), prompting, waiting and idle time, tacit knowledge and over-trust; GS does not address the first three, and the paper says so.
10. Human extension: selection by refusal, difficulty imbalance, learning curve, contamination of a working tree (the dissection note section 3.5 lists the designed fixes); not part of the first submission.
11. Overhead: setup, upkeep, gate waits and extra output are inside cost; report with and without one-off setup, labelled.
12. Model drift and judge bias: pinned snapshots, a judge from another vendor, no primary metric judged.

## 9. Exactly what must exist before submission

Mandatory for a P4 results paper:

- [ ] SDX-0 CLOSED with its pass criteria reported (harness, oracle with reference implementation, stubs and mutants, controls, cost and variance).
- [ ] SDX-1 frozen before any main-run data: git tag `prereg/SDX-1-v1`, an OSF registration or Zenodo deposit that cites the tag, the commit and the archive hash, the registered hash-check script, and the Roles and independence record in its logbook entry. Prerequisites that are JC decisions: an external practitioner and an independent reviewer named; a second-vendor API key; budget approved; SESOI and n fixed from SDX-0 with written justification; at least two consecutive vendor-diverse critic rounds with no accepted blocker (stop rule: at most four rounds).
- [ ] The transcript-and-tool-use extractor and archives of every snapshot and session transcript (needed by P1, P3 and P2 Part C as well).
- [ ] SDX-1 run, analysed as registered, with controls and validity audit completed, the decision row assigned and the outcome label written in the logbook entry.
- [ ] SDX-2 enforcement-only arm and frontier cell registered and reported (the sufficiency ratio needs them); the component ablation if H1 is positive.
- [ ] SDX-8 drafted, critic-reviewed, frozen, run, with its positive control (bare-agent cost at the large size at least twice the small) passing; if it is not run, the paper's claim is limited to what SDX-1 and SDX-2 show and the title must not say "iterated".
- [ ] Deviations log for every experiment; raw data and runner packages with DOIs; analysis scripts with registered seeds.
- [ ] Claims-evidence table of this skeleton updated from the logbook; claim forms per section 7 applied.
- [ ] Copy-edit and venue-specific assembly.

Strongly recommended: an independent rerun of the primary contrast (B9; replicator recruited with a conflict-of-interest declaration at the freeze) or an explicit "author-run, not independently replicated" statement in the abstract.

Not required for the first submission: the human-developer extension (TRF-1, SDX-7), I-1, the branch papers.

Registered-report route (alternative gate): a Stage-1 protocol at the MSR (with EMSE; initial report 2026-11-20, stage-1 notice 2027-02-04, verified) or ESEM (2027 dates not found) registered-reports track needs the frozen protocol and the SDX-0 pilot but no outcome data; in-principle acceptance commits the journal to publish a sound protocol's results either way.

## 10. Honest timeline (estimates, not commitments; each step depends on the previous gate)

SDX-0: 1 to 2 weeks after the prerequisites above. Critic rounds: 1 to 2 hours of JC's time per round, up to four rounds. SDX-1 freeze: plausibly December 2026 to January 2027 if the decisions are made now. SDX-1 run: 25 to 60 hours wall clock (BACKLOG), analysis within weeks. SDX-8: drafting and critic review, ballast construction about 60 to 100 agent-assisted hours, run in the second quarter of 2027. Earliest P4 results submission: the third quarter of 2027, which is after the January 2027 application window.
