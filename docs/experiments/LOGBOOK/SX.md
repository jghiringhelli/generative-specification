# SX: chaos-twin study, surface versus navigation cost (September 2026, n=2 pilot)

> Backfilled entry, written 2026-10-02 from the repository files. It does not alter the papers or the result files. Protocol: `C:\workspace\PragmaWorks\gs\generative-specification\docs\experiments\EXPERIMENT-PROTOCOL.md`.

| Field | Value |
|---|---|
| Status | CLOSED (backfilled) |
| Outcome | Sentinel cuts search cost: SUPPORTED as demonstration. Residual surface cost after a map (about 2.4x tokens, 3.5x edits): INCONCLUSIVE (n = 2). Weak-model coherence failure: not run |
| Evidence tier | C (protocol text before the runs; pilot only) |
| Registration | `experiments\sx\PROTOCOL.md` commit `52dd8ac` 2026-09-12 14:34; pilot results `d4ea562` 2026-09-12 23:16. Protocol precedes results in history. The twins' sources were lost in a concurrency race and rebuilt before the runs (`e448e22`, `218b08c`, `0979fe3`). No external timestamp. |
| Data and code | `C:\workspace\PragmaWorks\gs\generative-specification\experiments\sx\` (PROTOCOL.md, RESULTS.md, runs\, twins\) |

## What was asked
Does degrading a clean Conduit to an "average real project" (the chaotic twin: 8 scripted dimensions, each with a cited norm) raise a stateless agent's token cost for one cross-cutting change, with and without an authored sentinel (S0 none, S1 map on lean only, S2 map on both)?

## What the design could and could not detect
- n = 2 per cell, one frontier model, one benchmark, one change task (add a field that exists in 5 live duplicated copies on the chaotic twin and in 1 on lean). Differences large enough to see at n = 2: S1 lean 351k mean tokens vs chaotic 2,175k; S2 302k vs 731k; edits 2 vs 7. S0 is high-variance even for the clean twin (802k vs 2,104k), so S0 means are not pinned.
- The chaotic twin was built by the author. The citations make it defensible, but its badness is the author's choice and the task was chosen to hit the duplication the twin was built with.
- Coherence 6 of 6 on all runs: the frontier model pays rather than fails; the failure mode predicted for weak models was not tested.

## Questions
| Question | Result |
|---|---|
| An authored map lowers search and localization cost | SUPPORTED as demonstration (consistent with KX and TX) |
| Surface cost persists after a map | INCONCLUSIVE as an effect size (n = 2, one task, author-built twin); direction consistent |
| Weak-model coherence failure | NOT RUN |

## What it licenses
A mechanism sketch with magnitudes labelled pilot. "A map does not remove duplicated copies" is supported; "2.4x" is not a number to quote without its n.
