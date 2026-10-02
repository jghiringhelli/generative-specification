# RX: regeneration from a GS document (March 2026)

> Backfilled entry, written 2026-10-02 from the repository files. It does not alter the papers or the result files. Protocol: `C:\workspace\PragmaWorks\gs\generative-specification\docs\experiments\EXPERIMENT-PROTOCOL.md`.

| Field | Value |
|---|---|
| Status | CLOSED (backfilled) |
| Outcome | DEMONSTRATION (one generation passes 104 tests; reproducibility is offered, not independently shown) |
| Evidence tier | D |
| Registration | None. |
| Data and code | `C:\workspace\PragmaWorks\gs\generative-specification\experiments\rx\` (README.md, spec\, runner\, evidence\) |

## What was asked
Can a reader with a database and an API key regenerate a passing project (tsc clean, 104 tests, no hard-coded credentials) from the GS document alone?

## What the design could and could not detect
- Pass criteria are stated before the run in the README (compiles, no failed tests, no hard-coded credentials), but the tests are the ones the generation itself writes: a project can pass its own tests.
- One generation recorded in evidence. A rerun by a third party would turn this into a replication; the repository records the author-run evidence plus a statement elsewhere of an independent reproduction of a different suite (106 of 109 tests on the AX treatment-v5 project).
- The README's relationship section says AX had "40 participants". AX had no human participants. That sentence is an error to be corrected by the owner of the file; it is noted here and the file was not edited.

## What it licenses
That the regeneration procedure ran to a passing state at least once. It does not license a statement about the rate of success or about independent replication.
