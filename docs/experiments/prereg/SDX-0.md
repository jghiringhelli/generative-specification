# SDX-0: harness-validity pilot for the substrate durability experiment

Status: DRAFT for registration as a tagged in-repo registration (tier B). Freezing: JC. Expected tag: `prereg/SDX-0-v1`. Protocol: `C:\workspace\PragmaWorks\gs\generative-specification\docs\experiments\EXPERIMENT-PROTOCOL.md`. Main study this pilot serves: `C:\workspace\PragmaWorks\gs\generative-specification\docs\experiments\prereg\SDX-1.md`. Review record: `...\prereg\SDX-REVIEW.md`.

## 1. Purpose (and what it is not)

SDX-0 answers only harness and design questions, so that SDX-1 can be frozen on facts instead of guesses:

1. Does the harness run all arms end to end, hold the scaffold fixed, and detect tampering?
2. Does the oracle work (accepts a correct implementation, rejects degenerate ones, detects mutants, versioned correctly at the spec change and the reversal)?
3. Floor and ceiling: are the comparison arms away from the ceiling on the primary readout? Is the naive arm away from the floor?
4. Cost per chain, session cap-hit rates per arm, hook-block counts, number of questions asked.
5. The between-chain standard deviation of the primary readout and the chain-collapse rate, which fix the n of SDX-1.
6. Does the positive control (amnesia) show a large effect in the expected direction?

SDX-0 does not test any SDX-1 hypothesis. Its data are excluded from the SDX-1 analysis and no arm-contrast verdict is drawn from them. Hypothesis-level numbers are not reported as findings; only the quantities above are.

## 2. Design

- Vendor: one (Claude mid-tier via `claude -p`, headless). Clean configuration directory: no user-level instruction files, no memory, no MCP, no web.
- Benchmark: Pastura, an invented rangeland-rotation API with no public corpus. Source files (existing, in the repo): `C:\workspace\PragmaWorks\gs\generative-specification\experiments\cr\benchmark\DOMAIN_SPEC.md`, oracle probes `...\experiments\cr\benchmark\oracle\`, canary probe `...\experiments\cr\runner\canary_probe.md`. Canary run cold before the pilot; recall result logged (guard c).
- Horizon: CR0 (initial build from the base spec) plus the 9 changes listed in SDX-1 section 4, full horizon, because the state-dependent changes need their antecedents and the ceiling must be measured at the real horizon.
- Arms (names as in SDX-1): A0 naive (floor check, k=2), A1 expert prompt (k=3), A1b duplicate of A1 with its own seed and run order (negative control, k=3), A3 flat context file (k=3), A4 substrate with gates in the loop (k=3), A4x amnesia positive control (A4 with the substrate files removed from the repo before the spec-change change, code left in place; k=3). Total 17 chains.
- Artifacts: P_expert and the flat file are written by an external practitioner (see SDX-1 section 13 for the open dependency). For the pilot only, a provisional author is allowed and the artifacts are revised within the budget below; SDX-1 artifacts are the ones frozen by the external author after the pilot.
- Scaffold, acceptance, scored-state rule, per-session limits, scripted product-owner reply: identical to SDX-1 sections 4 and 5.

## 3. Pass criteria (registered now; none refer to which arm is better)

| ID | Criterion | If failed |
|---|---|---|
| V1 | All arms complete all chains without harness failure; harness failure rate (infrastructure, not model) below 10% of sessions | Fix harness, rerun the affected cells; disclose |
| V2 | Oracle validation: reference implementation passes at least 98% of probes; "always 200" and "always 4xx" stubs each pass at most 60%; at least 90% of 20 hand-made mutants are killed; every probe retired or inverted at the spec change and the reversal is listed in the probe manifest | Repair oracle before anything else; disclose |
| V3 | Scaffold tamper detection fires on 3 planted tamperings (edited helper, edited db client, changed config) in every arm | Fix harness |
| V4 | No arm artifact contains a fact that is not derivable from the base spec, the change texts, or the arm's own recorded decisions (stateless judge from a different family checked every artifact; leaks listed) | Remove leaks, recheck |
| V5 | Content-parity check: every item of the content manifest is present in P_expert, the flat file and the substrate (judge from a different family) | Fix artifact, recheck |
| V6 | Ceiling: A1 and A4 are below 90% on the primary readout at the final change; A0 is below 95% and above 5% | Not a harness failure: it means the SDX-1 design would be INVALID-DESIGN as drafted. Amend SDX-1 (harder changes, longer horizon, registered contingency of 24 changes) before freezing it; log |
| V7 | Cost per chain within 3x of the estimate in section 6 | Amend SDX-1 budget or scope before freezing; do not cut arms silently |
| V8 | Differential cap-hit rate (turn, time or token caps) across arms is at most 10 percentage points | Raise caps equally and rerun, or redesign; log |
| V9 | Positive control A4x differs from A4 on state-dependent probes by at least 20 percentage points in at least 2 of 3 chain pairs | The experiment cannot detect a known state effect at this scale: SDX-1 must be redesigned before freezing |

Information used for SDX-1 freezing (not pass/fail): between-chain SD of the primary readout per arm, collapse rate, A/A difference between A1 and A1b (noise size), hook blocks per arm, circumvention events (`--no-verify`, edited tests or fixtures, forged lock hash), number of questions asked per arm, cost per chain.

## 4. Allowed changes after the pilot

Harness and oracle bugs (disclosed). Arm artifacts within a budget of 3 revisions each, made by the external author or by someone blind to which arm a change favors. Change texts: wording only, for ambiguity, never to move a result. No change may be chosen because of which arm it favors. All changes are listed in `...\LOGBOOK\SDX-0.md` before SDX-1 is frozen.

## 5. Stopping rules

Fixed chains as listed. No additional chains after seeing outcomes. A cell may be rerun only for a harness failure (V1), the rerun disclosed. The pilot ends when V1 to V9 are each marked passed, failed with action taken, or waived by JC with a reason in the logbook.

## 6. Cost and time (estimates; the figures are guesses until measured)

Sessions: 17 chains x 10 steps x about 1.25 attempts, about 215 sessions. Unit-cost anchor: a substrate-arm session on a mid-tier model measured at $0.43, 28 turns, 102 s in an earlier lab run (arms with more reading cost more; assumed $0.4 to $1.2 per session). Estimate $90 to $260; hard cap $250. Plus judge runs (parity, leak, about 30 sessions, $10 to $30). Wall clock 8 to 14 hours with 2 to 3 chains in parallel. Preparation, which is the larger cost: scaffold lock, oracle with versioning and validation, change texts, port of the sensors to the Pastura scaffold, harness: about 60 to 90 agent-assisted hours plus about 8 hours of JC's judgment time (ratify oracle, change list, manifest). Budget approval is a decision for JC.

## 7. Decision table

| Observed | Permitted conclusion | Forbidden conclusion |
|---|---|---|
| V1 to V9 all pass | Harness is fit for SDX-1; freeze SDX-1 with measured SD and n | Any statement about whether the substrate helps |
| V6 fails (ceiling) | SDX-1 as drafted would be INVALID-DESIGN; amend before freeze | "The substrate is not needed because the expert arm does well" |
| V9 fails (positive control not detected) | The planned experiment cannot detect a known state effect at this scale; redesign or enlarge | "State does not matter" |
| V2 or V4 fails and cannot be repaired | The oracle or artifacts cannot be made fair; stop and redesign the benchmark | Running SDX-1 with a known-unfair oracle |
| The pilot shows the whole approach is the wrong experiment (for example, the state-dependent probes cannot be written without leaking the answer into the change text) | `ABANDONED` or `SUPERSEDED-BY` with the named reason; this is a valid result | Hiding the finding or changing the hypothesis silently |

## 8. Registration checklist (tag before the first pilot session)

Commit this file, the change texts, the scaffold hash, the oracle manifest, the pass criteria above, the harness scripts, model id and CLI version; tag `prereg/SDX-0-v1`; push; record tag and commit in `...\LOGBOOK\README.md`. An external timestamp is optional for the pilot because no hypothesis is tested.
