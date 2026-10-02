# TX: bridge test, structure and sentinel as read-side derivability (September 2026)

> Backfilled entry, written 2026-10-02 from the repository files. It does not alter the papers or the result files. Protocol: `C:\workspace\PragmaWorks\gs\generative-specification\docs\experiments\EXPERIMENT-PROTOCOL.md`.

| Field | Value |
|---|---|
| Status | CLOSED (backfilled) |
| Outcome | "Disciplined structure alone lowers read cost": NULL, direction slightly against, at small scale. "Authored sentinel lowers read cost": SUPPORTED (k=5). "Interfaces needed for comprehension": INCONCLUSIVE (priors confound) |
| Evidence tier | C (exploratory; design changed after the first probe) |
| Registration | None as a registration. `experiments\ax\bridge\README.md` states a protocol, but `RESULTS.md` shows the design was rebuilt after an n=1 probe contradicted the prediction (metric changed from tokens to read-breadth; a sentinel arm added). That is legitimate exploration and must be read as exploration. |
| Data and code | `C:\workspace\PragmaWorks\gs\generative-specification\experiments\ax\bridge\` (README.md, RESULTS.md, runs\); specificity-dial prompts in `...\experiments\ax\bridge-strong\` and `...\bridge-weak\` |

## What was asked
Does a behaviour-preserving disciplined refactor (twin D) of a default-prompt Conduit generation (twin M) lower a stateless reader's cost to locate and understand things, and how much of the read economy is due to an authored navigation map?

## What the design could and could not detect
- Twins proven equal on the Hurl suite: 13 of 13 files with identical results, including the same 12 strict-spec failures. That is a differential check, not conformance.
- Read-breadth, k=5: M median 4 files, D median 5. With a map: 3 and 3, zero variance, searches 0, turns about 45% fewer, cost about 40% lower. Cost without the map equal. Residual D advantage with the map about 12%, with overlapping distributions.
- Scale: 16 to 37 files. A full sweep is cheap either way; a structural advantage would appear only at larger scale, which the design could not see.
- Priors: Conduit is a famous benchmark; intent answers can come from training, contaminating comprehension tests (the results file says so).
- Curated-surface arm (k=3): both twins sufficient, no token reduction; not powered.
- The maps were authored by the author of the hypothesis, "as precise as each twin's structure allows".

## Questions
| Question | Result |
|---|---|
| Structure alone lowers location cost | NULL, direction against the prediction at this scale (n = 5 per twin) |
| Authored map lowers read cost and removes search | SUPPORTED (k=5), mechanism level |
| Interface layer needed for comprehension | INCONCLUSIVE |

## What it licenses
In this setting the read economy comes from the map and from tests-as-contracts, not from layering. The paper's phrase "structure alone does not cheapen reading" is the measured result and was reported against the author's initial intuition.

## Intuition versus result
The first logged case where a result contradicted the author's expectation and the design was audited (scale, metric, priors). The audit found real limits; none overturned the null at this scale. Under the protocol the next step is a larger-scale redesign (BACKLOG B6), not a reinterpretation.
