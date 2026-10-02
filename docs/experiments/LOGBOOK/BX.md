# BX: rubric cross-validation on three Conduit implementations (March 2026)

> Backfilled entry, written 2026-10-02 from the repository files. It does not alter the papers or the result files. Protocol: `C:\workspace\PragmaWorks\gs\generative-specification\docs\experiments\EXPERIMENT-PROTOCOL.md`.

| Field | Value |
|---|---|
| Status | CLOSED (backfilled) |
| Outcome | INCONCLUSIVE as validation of the rubric (n = 3 repositories, circular for one of them). Reported scores themselves: DEMONSTRATION |
| Evidence tier | C (hypothesis stated in the README with the results; no separate registration) |
| Registration | None. |
| Data and code | `C:\workspace\PragmaWorks\gs\generative-specification\experiments\bx\` (README.md, scores.json, evidence\) |

## What was asked
Does the 14-point rubric rank GS-generated > official reference > popular community implementation, in agreement with static analysis (CVEs, type health, test counts)?

## What the design could and could not detect
- Three items. If the order is random, a specific predicted order has probability 1/6. A match is weak evidence for validity.
- Repo C is the GS-generated output (RX), so the rubric that rewards GS properties is applied to GS output. The experiment's own claim that it "closes the guidance circularity" rests on the other two repos not being GS, but a rubric author scoring his own method's output is the original circularity.
- Who scored: the scoring was done by the author's session from the rubric, not an independent rater; the README records that the prompt claimed 14/14 for repo C and the evidence gave 13/14, to its credit.
- Static checks differ in dependency age (CVE counts depend on when the repositories were last updated), which is not the same as design quality.
- The 14-point rubric has since been retired as a scorecard; BX scores are in a retired unit.

## What it licenses
Three repositories were scored; the ordering agrees with the static checks. That is a consistency observation, not a validation of the instrument. The experiments index states that BX "closes" two validity layers; the entry's classification does not support that wording.
