# KX: retrieval economics, routed authored navigation tree vs monolith vs no structure (June 2026)

> Backfilled entry, written 2026-10-02 from the repository files. It does not alter the papers or the result files. Protocol: `C:\workspace\PragmaWorks\gs\generative-specification\docs\experiments\EXPERIMENT-PROTOCOL.md`.

| Field | Value |
|---|---|
| Status | CLOSED (backfilled) |
| Outcome | Token and cost economics: SUPPORTED (single model). Accuracy gap: INVALID-DESIGN as an effect estimate (ground truth derived from the structure under test) |
| Evidence tier | C (no registration; method replicated from a published benchmark) |
| Registration | None. The design follows the published CKG benchmark method; the first commit (2026-06-05) already contains results. |
| Data and code | `C:\workspace\PragmaWorks\gs\generative-specification\experiments\kx\` (README.md, RESULTS.md, WHITEPAPER-FINDINGS.md, evidence\) |

## What was asked
Does an authored, routed navigation structure answer structural questions with fewer tokens and higher token-level F1 than loading a monolith or having no structure (45 queries per condition, one model)?

## What the design could and could not detect
- Macro results (RESULTS.md): F1 monolith 0.611, routed 0.808, bare 0.431; tokens per query 100,237 / 78,603 / 233,583; cost per query $0.56 / $0.10 / $0.24. The routed vs monolith token gap is 1.3x while the dollar gap is 5.5x, explained by cache-creation billing in the monolith arm; token and dollar claims are not interchangeable.
- Obligation, aggregate and cross-link query truths are computed from the same structure the routed arm reads. The accuracy difference is partly built in; the experiment could not separate "structure helps" from "the answer key is the structure".
- The breakdown by query type is uneven (the bare arm wins entity and cross-link tokens on some types); the macro mean hides this.
- The bare arm had a session-limit interruption and a sandbox-escape incident (WHITEPAPER-FINDINGS.md), disclosed.

## Questions
| Question | Result |
|---|---|
| Routed structure costs fewer tokens per query than monolith and no structure | SUPPORTED (single model, 45 queries, token counts independent of the answer key) |
| Routed structure is more accurate | INVALID-DESIGN as an estimate (circular ground truth) |

## What it licenses
The retrieval economy of an authored map on structural questions on this codebase with this model. Nothing about whole-session cost.
