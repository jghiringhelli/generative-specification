# EX: executable sprint, live deployment of a GS-specified Conduit (April 2026)

> Backfilled entry, written 2026-10-02 from the repository files. It does not alter the papers or the result files. Protocol: `C:\workspace\PragmaWorks\gs\generative-specification\docs\experiments\EXPERIMENT-PROTOCOL.md`.

| Field | Value |
|---|---|
| Status | CLOSED (backfilled) |
| Outcome | DEMONSTRATION (feasibility; no comparator) |
| Evidence tier | D |
| Registration | None. |
| Data and code | `C:\workspace\PragmaWorks\gs\generative-specification\experiments\ex\` (README.md, evidence\harness-run.json and others, project\) |

## What was asked
Can the specification-to-production chain close at four tiers on a public benchmark: 13 of 13 behavioural probes (1,013 assertions), 3 of 3 environment probes, a load ramp with six thresholds green, on a live managed deployment, in one session of about 8 hours?

## What the design could and could not detect
- No comparison condition and one model, one session. It shows the chain can work once; it cannot say the method caused it or how often it works.
- The behavioural oracle is the public Hurl suite for a benchmark present in training data; the probes were also available to the builder during the session.
- "15 defects the gate caught" (index and papers) are counted by the builder; no rate and no baseline.

## What it licenses
Feasibility of the toolchain on one case. Cite as a demonstration only.
