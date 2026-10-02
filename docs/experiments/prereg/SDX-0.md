# SDX-0: harness-validity pilot for the substrate durability experiment

Status: DRAFT, revision 2 (2026-10-02: adds the expert-minus-GS arm A5, the state-in-text control A0S, the unconstrained expert A6, the new late change 10, and the first critic round), for registration as a tagged in-repo registration (tier B). Freezing: JC. Expected tag: `prereg/SDX-0-v1`. Protocol: `C:\workspace\PragmaWorks\gs\generative-specification\docs\experiments\EXPERIMENT-PROTOCOL.md`. Main study this pilot serves: `C:\workspace\PragmaWorks\gs\generative-specification\docs\experiments\prereg\SDX-1.md` (arm and check definitions: `C:\workspace\PragmaWorks\gs\generative-specification\docs\experiments\prereg\SDX-1-ARMS.md`). Review record: `C:\workspace\PragmaWorks\gs\generative-specification\docs\experiments\prereg\SDX-REVIEW.md`.

## 1. Purpose (and what it is not)

SDX-0 answers only harness and design questions, so that SDX-1 can be frozen on facts instead of guesses:

1. Does the harness run all arms end to end, hold the scaffold fixed, detect tampering, and keep every session free of vendor persistence (memory, resume, auto-loaded files the harness did not place)?
2. Does the oracle work (accepts a correct implementation, rejects degenerate ones, detects mutants, versioned correctly at the spec change and the reversal; SD probes enumerated by the mechanical rule)?
3. Floor and ceiling: are the comparison arms away from the ceiling on the readouts E1-SD and E1-SI at the final change? Is the naive arm away from the floor?
4. Cost per chain, session cap-hit rates per arm, hook-block counts, number of questions asked.
5. The between-chain standard deviation of E1-SD (adjusted for E1-SI) and of E1-SI, pooled across arms, and the chain-collapse rate: these fix the n of SDX-1.
6. Does the positive control A0S (state restated in text) show a large effect on E1-SD, independent of any substrate?
7. Arm validity of the expert-minus-GS arm A5: does it pass the leak check M1 and the strength check M2 (targeted-metric calibration probe), defined in SDX-1-ARMS section 4? Is the emergent-substrate detector working, and how often does an A5 agent build its own substrate?

SDX-0 does not test any SDX-1 hypothesis. Its data are excluded from the SDX-1 analysis and no arm-contrast verdict is drawn from them. Hypothesis-level numbers are not reported as findings; only the quantities above are.

## 2. Design

- Vendor: one (Claude mid-tier via `claude -p`, headless), a dated snapshot id. Each session runs in a fresh configuration directory with auto-memory off, no user-level instruction files, no MCP, no web, no resume, and a unique repository path per chain.
- Benchmark: Pastura, an invented rangeland-rotation API with no public corpus. Source files (existing, in the repo): `C:\workspace\PragmaWorks\gs\generative-specification\experiments\cr\benchmark\DOMAIN_SPEC.md`, oracle probes `C:\workspace\PragmaWorks\gs\generative-specification\experiments\cr\benchmark\oracle\`, canary probe `C:\workspace\PragmaWorks\gs\generative-specification\experiments\cr\runner\canary_probe.md`. Canary run cold before the pilot; recall result logged (guard c).
- Horizon: CR0 plus the 10 changes of SDX-1 section 4, full horizon, because state-dependent changes need their antecedents and the ceiling must be measured at the real horizon.
- Arms (names as in SDX-1 revision 2), k=3 each: A0 naive, A5 expert-minus-GS, A5b (independent run of A5), A0S (state in text), A1 expert-plus-GS-content, A3 flat context file, A4 substrate with gates in the loop, A6 expert-unconstrained. Total 24 chains. (A4x is exploratory in SDX-1 and not piloted.)
- Artifacts: A6, A5, the A1 appendix and the flat file are written by an external practitioner (SDX-1-ARMS section 3; open dependency in SDX-1 section 13). For the pilot only, a provisional author is allowed for the A1 appendix, the flat file and the substrate, **but A6 and A5 are never authored by anyone from the GS work**: a pilot without the external author runs without A5, A5b and A6, V10 to V12 are then not assessed and SDX-1 cannot be frozen. Revisions are triggered only by a failed V criterion, made by the artifact's author, who sees only that arm's outputs (symmetric firewall); SDX-1 artifacts are the ones frozen after the pilot.
- Scaffold, acceptance, scored-state rule, retry rule, unconditional product-owner replies, per-session limits: identical to SDX-1 sections 3 and 4.

## 3. Pass criteria (registered now; none refer to which arm is better)

| ID | Criterion | If failed |
|---|---|---|
| V1 | All arms complete all chains without harness failure; harness failure rate (infrastructure, not model) below 10% of sessions | Fix harness, rerun the affected cells; disclose |
| V2 | Oracle validation: reference implementation passes at least 98% of probes; "always 200" and "always 4xx" stubs each pass at most 60%; at least 90% of 20 hand-made mutants are killed; paired probes scored as pairs; 2xx/4xx balance holds overall and within the SD subset; every probe retired or inverted at change 6 and change 9 is in the probe manifest; the SD list is the output of the mechanical rule, frozen before any substrate artifact exists | Repair oracle before anything else; disclose |
| V3 | Scaffold tamper detection fires on 3 planted tamperings (edited helper, edited db client, changed config) in every arm | Fix harness |
| V4 | No arm artifact contains a fact not derivable from the base spec, the change texts, or the arm's own recorded decisions (stateless judge from a different vendor checked every artifact; leaks listed) | Remove leaks, recheck |
| V5 | Content parity: every manifest item is present in the arms that carry it and absent where it must not be (A1, A3, A4 carry G and L; A5, A6-constrained none of L; A0 nothing) (judge from a different vendor plus the human reviewer) | Fix artifact, recheck |
| V6 | Ceiling: A0, A1, A3, A5, A6 are below (100 minus delta)% on E1-SD at the final change, and A0 is below 95% and above 5% on E1-ALL; the strongest arm A4 is allowed to be high | Not a harness failure: it means the SDX-1 design would be INVALID-DESIGN as drafted. Amend SDX-1 (harder changes, longer horizon, the registered 24-change contingency) before freezing it; log |
| V7 | Cost per chain within 3x of the estimate in section 6 | Amend SDX-1 budget or scope before freezing; do not cut arms silently |
| V8 | Differential cap-hit rate (turn, time or token caps) across arms is at most 10 percentage points | Raise caps equally and rerun, or redesign; log |
| V9 | Positive control A0S differs from A0 on E1-SD by at least 20 percentage points in at least 2 of 3 chain pairs | The experiment cannot detect a known state effect at this scale (or state is not scarce here): SDX-1 must be redesigned before freezing |
| V10 | Leak check M1 (SDX-1-ARMS section 4): the human reviewer and, when available, a different-vendor judge find zero PARTIAL or PRESENT items of L1 to L5 in A5 and A0, all items PRESENT in A1, A3, A4; the judge classified 10 planted artifacts 100% correctly | A5's author revises (budget); judge replaced if miscalibrated; recheck. Without the different-vendor judge V10 is recorded as human-only and guard (d) stays open |
| V11 | Strength check M2: independent expert review of A5 passes; targeted-metric calibration probe (CR0 to change 3, A0 vs A5, k=3): layer-violation ranges do not overlap and A5's median duplication is not above A0's. The hidden-oracle pass rate is never part of V11 | Revise A5 within budget (author sees A0 and A5 outputs only). If still failing: A5 is weak by construction and SDX-1 H1, H2, H5, H6 are INVALID-DESIGN as drafted; do not freeze with A5 |
| V12 | Emergent-substrate detector runs on every chain, flags any agent-created `CLAUDE.md` or `AGENTS.md`, and its counts per arm are logged | Fix detector. A high A5 emergence rate is information for decision row (vi-b), not a failure |
| V13 | Harness persistence check: a planted memory item, a planted `CLAUDE.md` outside the repo and a planted resume token are not seen by any session; repository paths are unique per chain | Fix harness; rerun everything affected |

Information used for SDX-1 freezing (not pass/fail): pooled and per-arm SD of E1-SD adjusted and of E1-SI (with their uncertainty, since k=3 per arm gives a very rough SD), correlation of E1-SI with E1-SD, collapse rate, A5 vs A5b difference (noise size), hook blocks per arm, circumvention events (`--no-verify`, edited tests or fixtures, forged lock hash), questions asked per arm, cost per chain, A5 and A6 emergence counts, count of SD probes excluded by conditional scoring per arm.

## 4. Allowed changes after the pilot

Harness and oracle bugs (disclosed). Arm artifacts within a budget of 3 revisions each, made by that artifact's author (external practitioner for A5, A6, A1 appendix, flat file), triggered only by a failed V criterion, the author seeing only that arm's outputs and never a hidden-oracle number or an arm contrast. Change texts: wording only, for ambiguity, never to move a result. No change may be chosen because of which arm it favors. Every change is listed with its trigger in `C:\workspace\PragmaWorks\gs\generative-specification\docs\experiments\LOGBOOK\SDX-0.md` before SDX-1 is frozen.

## 5. Stopping rules

Fixed chains as listed. No additional chains after seeing outcomes. A cell may be rerun only for a harness failure (V1, V13), the rerun disclosed. The pilot ends when V1 to V13 are each marked passed, failed with action taken, or waived by JC with a reason in the logbook.

## 6. Cost and time (estimates; the figures are guesses until measured)

Sessions: 24 chains x 11 steps x about 1.25 attempts, about 330 sessions. Unit-cost anchor: a substrate-arm session on a mid-tier model measured at $0.43, 28 turns, 102 s in an earlier lab run (assumed $0.4 to $1.2 per session). Estimate $130 to $400; hard cap $400. Plus judge runs (parity, leak, M1 classification, about 60 sessions, $20 to $60). Wall clock 10 to 18 hours with 2 to 3 chains in parallel. Preparation, the larger cost: scaffold lock, oracle with versioning, validation and the mechanical SD rule, change texts including the new change 10, port of the sensors to the Pastura scaffold, harness including the isolation checks and the emergent-substrate detector: about 70 to 100 agent-assisted hours plus about 8 hours of JC's judgment time (ratify oracle, change list, manifest). Budget approval is a decision for JC.

## 7. Decision table

| Observed | Permitted conclusion | Forbidden conclusion |
|---|---|---|
| V1 to V13 all pass | Harness is fit for SDX-1; freeze SDX-1 with measured SD and n | Any statement about whether the substrate helps |
| V6 fails (ceiling) | SDX-1 as drafted would be INVALID-DESIGN; amend before freeze | "The substrate is not needed because the expert arm does well" |
| V9 fails (positive control not detected) | The planned experiment cannot detect a known state effect at this scale, or state is not scarce on this benchmark; redesign or enlarge | "State does not matter" |
| V11 fails after the revision budget | A5 is weak by construction; the A5 contrasts of SDX-1 would be INVALID-DESIGN; do not freeze with A5 | "Expert prompting does not help" |
| V10 fails and cannot be repaired | The arm cannot be made free of GS elements; redefine the arm or the list | Calling A5 "minus GS" |
| V13 fails | Sessions were not isolated; nothing from the pilot is usable until fixed | Any cross-arm comparison |
| V2 or V4 fails and cannot be repaired | The oracle or artifacts cannot be made fair; stop and redesign the benchmark | Running SDX-1 with a known-unfair oracle |
| The pilot shows the whole approach is the wrong experiment (for example, state-dependent probes cannot be written without leaking the answer into the change text) | `ABANDONED` or `SUPERSEDED-BY` with the named reason; this is a valid result | Hiding the finding or changing the hypothesis silently |

## 8. Registration checklist (tag before the first pilot session)

Commit this file, the change texts, the scaffold hash, the oracle manifest, the pass criteria above, the harness scripts, the dated model snapshot, CLI and Node versions; tag `prereg/SDX-0-v1`; push; record tag and commit in `C:\workspace\PragmaWorks\gs\generative-specification\docs\experiments\LOGBOOK\README.md`. An external timestamp is optional for the pilot because no hypothesis is tested; mechanics in `C:\workspace\PragmaWorks\gs\generative-specification\docs\experiments\PREREG-HOWTO.md`.
