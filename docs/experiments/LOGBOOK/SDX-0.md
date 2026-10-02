# SDX-0: harness-validity pilot for the substrate durability experiment

Protocol: `C:\workspace\PragmaWorks\gs\generative-specification\docs\experiments\EXPERIMENT-PROTOCOL.md`. Registrable file: `C:\workspace\PragmaWorks\gs\generative-specification\docs\experiments\prereg\SDX-0.md`.

| Field | Value |
|---|---|
| Status | DESIGN-REVIEWED (draft; not frozen; not run) |
| Outcome | none yet |
| Evidence tier | none yet (target B) |
| Refines / refined by | refined by SDX-1 (this pilot is its precondition) |
| Registration | none yet; planned tag `prereg/SDX-0-v1` |
| Opened | 2026-10-02 |

## 1. Hypothesis
None. SDX-0 tests no hypothesis; it checks harness, oracle, floor and ceiling, cost, variance, and that a positive control shows a large effect.

## 7. Design review
Three stateless critics reviewed the parent design; findings and dispositions are in `C:\workspace\PragmaWorks\gs\generative-specification\docs\experiments\prereg\SDX-REVIEW.md`. The pilot's arms and pass criteria V1 to V9 incorporate the accepted findings (controls, oracle validation, ceiling on the comparison arms, cap-hit rate).

## 8. Deviations log
(empty)

## 9. Result
(not run)

## 12. Refinement
SDX-1 is the main experiment this pilot unblocks.

## Revision log (appended, never rewritten)

### 2026-10-02, revision 2
Added arms A5 (expert-minus-GS), A5b (A/A, replaces A1b), A0S (state restated in text; the positive control, replacing A4x as the validity gate), A6 (expert, unconstrained); A4x dropped from the pilot; 24 chains at k=3. Pass criteria now V1 to V13: V9 is A0S minus A0 on E1-SD, V10 leak check M1, V11 strength check M2 (targeted metrics only, never the hidden-oracle rate), V12 emergent-substrate detector (a high A5 emergence rate is information, not a failure), V13 harness persistence (planted memory, planted CLAUDE.md, resume token, unique paths). V6 aligned with 100 minus delta and no longer caps the strongest arm. Cost estimate $130 to $400, cap $400. A5 and A6 are never authored by anyone from the GS work; without the external author the pilot runs without them and cannot clear SDX-1 for freezing.
