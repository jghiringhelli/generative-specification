# SDX-1: does persistent, structured, enforced project state matter once the project lives? (main preregistration)

Status: **DRAFT, NOT FROZEN.** Freezing (git tag `prereg/SDX-1-v1`, push, external timestamp) is JC's decision and requires SDX-0 to be closed. Every bracketed value `[FROM SDX-0]` is filled from pilot measurements before freezing; no value may be changed after the freeze. Protocol: `C:\workspace\PragmaWorks\gs\generative-specification\docs\experiments\EXPERIMENT-PROTOCOL.md`. Pilot: `...\prereg\SDX-0.md`. Review and dispositions: `...\prereg\SDX-REVIEW.md`. Logbook entry: `...\LOGBOOK\SDX-1.md`.

## 1. Question and why this experiment

Earlier single-shot experiments (AX, AX2) found that a disciplined prompt beats a naive one and ties a strong expert prompt. A single shot cannot separate GS content delivered in a prompt from GS content delivered as a persistent, structured, enforced substrate (sentinel tree, specs, recorded decisions, gates). The two should differ only where state must outlive the prompt: a growing project, a changed rule, a reversed decision.

SDX-1 asks one question: **on facts that a fresh session can only get right by using state recorded in the repository earlier in the project's life, does the substrate (A4) beat an expert prompt (A1), and does it beat the same content held in one flat context file (A3)?** The second comparison is the one that matters for the claim; the first is a sanity check that persistence matters at all.

The construct is deliberately narrow: probe-level correctness on state-dependent behavior, with state-independent behavior as the within-chain control. It does not measure code quality, human maintainability, governance, handoff to a new person, or cost-effectiveness at production scale.

## 2. Hypotheses, falsifiers, controls

Primary readout, defined once: for each chain, E1-SD = share of **state-dependent probes** passed by the final state, and E1-SI = share of **state-independent probes** passed by the final state, both from the sealed oracle (section 6). Probes are tagged state-dependent or state-independent before any chain runs, by the oracle author, blind to arm. Definition: a probe is state-dependent if a correct answer requires information that was introduced in an earlier change request or an earlier recorded decision and is not stated in the base spec or in the current change request text.

Statistic: D = E1-SD minus E1-SI per chain (within-chain control removes general capability and the head start an arm may have). Contrast of interest per pair of arms: difference in mean D, by stratified permutation test (strata = nothing in stage 1, single vendor), with a bootstrap interval.

| ID | Claim | Test | Falsified (REFUTED) if | Equivalence (NULL) if |
|---|---|---|---|---|
| H1 (primary, sanity) | A4 has a higher D than A1: persistence matters | A4 minus A1 on D | upper 95% bound of A4 minus A1 below the SESOI [FROM SDX-0] | not used for NULL; if A4 does not beat A1 the A4 vs A3 question is uninterpretable and the experiment stops with `INCONCLUSIVE` or `NULL` on H1 |
| H5 (key secondary, gatekept: tested only if H1 is SUPPORTED) | A4 has a higher D than A3: structure and enforcement add beyond the same content in one file | A4 minus A3 on D | upper 95% bound below SESOI | TOST equivalence: both one-sided tests reject at the SESOI bound, then the conclusion is "A3 is as good as A4 on this construct here" |

SESOI: provisional 10 percentage points on D, justified as the smallest difference that would change a buyer's decision on whether to maintain a substrate; confirmed or revised from the pilot's measured SD before freeze. Registered power statement and n: `n = [FROM SDX-0]` chains per arm, computed for the SESOI at 80% power with the measured between-chain SD and collapse rate; if the required n exceeds 20 per arm, SDX-1 is reduced in scope (fewer arms) rather than run underpowered. Planning figure before the pilot: 15 per arm.

Secondary and exploratory (labelled in the entry, cannot carry a verdict): dose-response (gap on state-dependent probes versus distance in changes since the antecedent); spec-change propagation share (probes on surfaces that used the superseded rule); change-failure rate (share of changes whose accepted snapshot fails hidden probes of that change or flips an earlier-passing probe); regression flips per change; tokens and dollars per change and per hidden-correct change (no prediction attached); hidden-suite kill rate on a fixed set of mutants. Treatment-targeted metrics are reported but never carry a verdict: layer violations, duplication, complexity tail, residue of the superseded rule in code and docs, mutation score with the arm's own tests, documentation-claim accuracy, gate-circumvention events.

Controls (guard a):
- Negative control A1b: identical to A1, separate seed and run order. The A1 vs A1b difference on D estimates noise. If it is at least the SESOI, the experiment is `INVALID-DESIGN` (noise exceeds the effect).
- Positive control A4x (amnesia): A4 with the substrate files (sentinel, specs, ADRs, ledger, lock) deleted from the repository immediately before change 6 (the spec change), code left in place. A known large effect is expected: A4x should fall to about A1 on D from change 6 onward. If A4 minus A4x on D is less than 20 percentage points, the experiment cannot detect a known state effect: `INVALID-DESIGN`.
- Floor and ceiling: if A1 or A3 has E1-SD at or above (100 - SESOI)% at the final change, H1 and H5 cannot be tested: `INVALID-DESIGN`. If A0 is at or above 95% on E1 overall or below 5%, the benchmark does not discriminate: `INVALID-DESIGN`.

## 3. Arms

Every change is a fresh session; only the repository carries state. Vendor memory features, user-level instruction files, web and MCP disabled; clean configuration directory.

| Arm | What the session gets | Persistent state beyond code |
|---|---|---|
| A0 naive (floor check only, k=3) | the base spec and the change request text | none |
| A1 expert prompt (reused) | A0 plus P_expert (frozen; GS content as a prompt: layering, spec first, tests first, update the README, ask before changing a rule). The agent is free to edit any file including documentation (not forbidden, not instructed) | whatever the agent chooses to write |
| A1b A/A duplicate of A1 | identical to A1 | same |
| A3 flat context file | A0 plus one auto-loaded file (`CLAUDE.md`), the best structured single file a practitioner would write, carrying the same total content as the substrate flattened; the agent may edit it | the one file |
| A4 substrate, gates in the loop | A0 plus sentinel tree, feature specs with acceptance criteria, recorded decisions, fixes ledger, spec lock, commit and push hooks from the Open Diamond sensors, fixture ratchet, red-first, triage rule | the full tree, enforced |
| A4x amnesia (positive control) | A4 until change 5, then the substrate files removed | code only from change 6 |

Artifact authorship (R2 of the review): P_expert and the flat file are written by an external practitioner given the content manifest and the instruction "write the strongest possible artifact for this task"; the substrate is built from the same manifest. All three get the same pilot transcripts and the same revision budget (3), and every revision is made by someone blind to which arm it favors. If no external practitioner is available the experiment is not frozen (it would be tier C at best).

Content parity (guard against construct leak): a manifest of about 25 items (rules, constraints, structure decisions, process rules) drawn from the Pastura cascade. A stateless judge from a different family confirms every item is present in each arm artifact. A second check confirms no artifact states a fact that is not derivable from the base spec, the change texts, or the agent's own recorded decisions, by comparing it with the oracle probe list. Artifact sizes (tokens) and setup effort (author hours) are recorded and reported per arm; sizes are not forced equal (rationale in the review, R1).

## 4. Benchmark, scaffold, horizon

- Domain: Pastura (invented; no public corpus). Reuse `C:\workspace\PragmaWorks\gs\generative-specification\experiments\cr\benchmark\DOMAIN_SPEC.md` and the canary probe `...\experiments\cr\runner\canary_probe.md` (run cold per model; recall near zero required; result logged; recall above zero is an `INVALID-DESIGN` trigger for the affected model).
- Locked scaffold, identical bytes in every arm, hash-checked after every change (tampering reverted and logged): Node + TypeScript strict + `node:http` + `node:sqlite` + vitest; `npm start` on `PORT`; `POST /__reset`; route registration helper and single data client at fixed paths; pure rule functions in `src/rules/` with fixed names and signatures. Internal architecture beyond that is free; layering is part of the treatment content, not imposed.
- Horizon: CR0 (initial build) plus 9 changes. Original ids refer to the 12-change draft (private). Tag SD/SI is provisional until the oracle author, blind to arm, finalizes it in SDX-0.

| # | Change (orig id) | State dependence of its probes | Stress |
|---|---|---|---|
| 1 | Forage budget from the latest reading (1) | SI | duplication trap; creates constants reused later |
| 2 | Role restrictions across endpoints (2) | SI | cross-cutting rule |
| 3 | Owner emergency move overriding the rest rule, with reason; under-specified on purpose (4) | SI; creates recorded decision D1 | decision point |
| 4 | Occupancy report over a date range (5) | SI | reuse and layering |
| 5 | Herd split and merge (6) | SI | invariants (overlap, stocking) |
| 6 | SPEC CHANGE: rest period depends on season and forage state, supersedes the earlier constant (7) | SD on every earlier surface that used the old rule | propagation |
| 7 | Paddock subdivision (8) | SD (capacity and rest interplay; decision D2) | decision point |
| 8 | Low-forage alert list (10) | SD (reuse of the change-1 logic under the new rule) | reuse across changes |
| 9 | Retire the emergency move (11) | SD (everything change 3 touched; the change text does not enumerate it) | reversal |

At least 3 of the 9 change texts are written or reviewed by an independent person who does not know the arm artifacts; the whole list is reviewed by an independent reader for ambiguity and for including cases where heavy process is a cost (a small throwaway change is allowed in place of change 4 if the independent reviewer asks).

- Decision points (3 and 7): a single scripted product-owner reply, identical for every arm that asks, is available in-session. Whether an arm asked, and how often, is logged.
- Acceptance and scored state: for every arm the harness snapshots the working tree after the final attempt of each change (at most 3 attempts; a retry sees only the arm's own test output, never the oracle). Hooks may block commits; the scored state is the working tree, not HEAD, so a hook cannot act as free rollback. A chain that fails to build on 2 consecutive changes is `collapsed`: remaining probes score zero (intention to treat); a completers-only sensitivity analysis is also reported.
- Per-session limits identical across arms: [FROM SDX-0] turns, minutes, token cap. Cap-hit rate per arm is logged; a differential above 10 percentage points is a registered `INVALID-DESIGN` trigger.
- Test deletion, weakening and fixture editing are logged in every arm, not only A4.

## 5. Model

Stage 1: one vendor, one mid-tier model in the vendor's headless CLI, model id, CLI version and dates recorded; all chains in a short window; arm order randomized in blocks. A second vendor is a replication (SDX-2), not pooled. Generator and any judge are different vendors where a judge is used (parity and leak checks only).

## 6. Oracle (sealed, outside every repo, HTTP level)

- Probes derived only from the base spec and change texts 1..k. Status-class tolerance (any 2xx accept, any 4xx reject); bodies checked only for field names fixed in the per-change contract.
- Paired probes (must accept X, must reject Y) and a 2xx/4xx balance per rule, so an always-rejecting or always-accepting server cannot score well.
- Probes versioned per change: the probe manifest lists those retired or inverted at change 6 (supersession) and change 9 (reversal); intended changes never count as regression flips.
- Cumulative scoring: probes of changes 1..k at change k; about 8 to 10 probes per change; sealed holdout (never shown to artifact authors).
- Validation in SDX-0 (reference implementation, degenerate stubs, hand mutants) is a precondition.

## 7. Judges

No primary metric is judged. Judges (a different vendor from the generator) are used for the parity and leak checks only, and any probe or script that can decide a question replaces a judge. Governance, reconstruction and defect-detection questions are SDX-3.

## 8. Analysis plan, exactly as registered

1. Check controls and triggers (section 10 INVALID-DESIGN rows) before any contrast.
2. H1: stratified permutation test and bootstrap interval for A4 minus A1 on D; effect size reported.
3. If H1 is SUPPORTED: H5: A4 minus A3 on D with interval and TOST at the SESOI.
4. Report collapse rate per arm; ITT and completers-only.
5. Secondary and exploratory analyses as listed, labelled.
6. No correction across hypotheses (H5 is gatekept by H1). Multiplicity inside the secondary list is not corrected and nothing in it carries a verdict.

## 9. Stopping rules

Fixed n per arm, no optional stopping, no extra chains after seeing outcome data. One interim validity look at roughly half the chains, executed by a script that outputs only these flags and never arm-level outcomes: ceiling/floor flags, harness failure rate above 15%, cost above 2x estimate, differential cap-hit rate, canary. Budget rule: if the pilot's cost per chain exceeds 3x the estimate, amend before freeze.

## 10. Decision table

Evidence tiers assume freeze and external timestamp precede data.

| Observed | Permitted conclusion | Forbidden conclusion |
|---|---|---|
| INVALID-DESIGN triggers: positive control A4x not detected; A/A difference at or above SESOI; A1 or A3 at ceiling; A0 at ceiling or floor; differential collapse or cap-hit above threshold; parity judge finds a gap after the fact; oracle leak found in an artifact; canary recall above zero; CLI or model version changed mid-window; circumvention in A4 above [FROM SDX-0]% (then A4 is not "enforced"); pilot or run shows the state-dependent probes reward one resolution of a decision point | `INVALID-DESIGN`, naming the trigger; this experiment could not answer; redesign and register a new linked experiment | Any conclusion about the substrate |
| H1 SUPPORTED, H5 SUPPORTED | Under this construct, in this vendor, on this invented 9-change project, the structured enforced substrate preserves state-dependent behavior better than both a prompt and the same content in one file | "Durability is demonstrated" in general; production-scale claims; other vendors; human maintainers |
| H1 SUPPORTED, H5 NULL by equivalence | Persistence of content is the active ingredient on this construct; structure and gates are not shown necessary here | "Structure and enforcement are useless" (they were measured only on D); "the flat file is enough" beyond this horizon |
| H1 SUPPORTED, H5 INCONCLUSIVE | Not enough evidence to separate structure from content; state the n that would | Either direction on H5 |
| H1 NULL or REFUTED (A4 does not beat the expert prompt on D) | On this construct and horizon, persistence did not matter for the agent; run guard-f audits; consider a longer horizon or larger repository (scale threshold, BACKLOG) | "The substrate has no value" (only: no value on this construct, here); reinterpreting D after the fact |
| H1 INCONCLUSIVE | Report; do not continue to H5 | Either direction |
| A1 beats A4 on D with controls valid | The gate friction or overhead cost more than they bought at this size; report prominently; cost secondary becomes central | Rescuing the claim by naming untested regimes (larger teams, weaker models) as the explanation |
| The result contradicts field experience | Guard-f audits first, both logged | Dismissal of either |
| The experiment turns out to be the wrong one (for example D does not isolate state, or probes were found to encode information only available through one arm) | `INVALID-DESIGN` with the named defect; linked redesign | Counting it as support or refutation |

Honest limit across every row: a win shows state-dependent correctness on a 9-change invented project, with one vendor and a mid-tier model, not durability of production systems; a null shows only that this design did not find it.

## 11. Cost and time (estimate, to be replaced from SDX-0)

Planning: 5 arms of interest x 15 chains + A0 k=3, about 80 chains x 10 steps x about 1.25 attempts, about 1,000 sessions at $0.4 to $1.2: roughly $400 to $1,200; wall clock 20 to 30 hours with 3 to 4 chains in parallel. Preparation is carried over from SDX-0.

## 12. Threats to validity (declared)

Proponent-authored substrate, sensors and oracle (mitigated by registration, the external artifact author, parity and leak checks, an independent change reviewer, published artifacts, and an independent rerun of the primary contrast as the stated next step; not eliminated). The strength of "the expert prompt" is unbounded. Toy scale (about 2 to 3 kLOC): a null may be a horizon or size effect. One invented domain and one fixed change order; order effects unknown. One vendor and one CLI harness. Agents may circumvent gates (counted, reported). Locked scaffold may blunt architecture differences. The state-dependence tag is an author construct (finalized blind to arm, audited in SDX-0). Parity is on content, not form: form is the thing under test.

## 13. Open items before freezing (decisions)

1. External practitioner for P_expert and the flat file (mandatory).
2. Independent author or reviewer for at least 3 of 9 change texts and a read of the whole list.
3. A reviewer from a different vendor family to re-read this file (the design review used one family).
4. Budget approval (SDX-0 about $90 to $260 plus preparation; SDX-1 about $400 to $1,200).
5. SESOI confirmation and n from SDX-0.
6. External timestamp route: OSF Registries or Zenodo deposit (the protocol, section 4), and whether to also submit to a Registered Report track.
7. Registration of vendor and model ids at freeze time.

## 14. Registration checklist

Commit and tag `prereg/SDX-1-v1`: this file, change texts and order, scaffold hash, oracle and its manifest and tolerance rules, content manifest and parity result, frozen P_expert, flat file, substrate, analysis scripts, model id and CLI version, SESOI and n, deviations-log file (empty). Push. External timestamp citing tag, commit hash and the SHA-256 of the registration zip. Log tag, commit, DOI or URL and date in `...\LOGBOOK\README.md`.
