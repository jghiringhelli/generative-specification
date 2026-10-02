# SDX-1: does persistent, structured, enforced project state matter once the project lives?

Protocol: `C:\workspace\PragmaWorks\gs\generative-specification\docs\experiments\EXPERIMENT-PROTOCOL.md`. Registrable file: `C:\workspace\PragmaWorks\gs\generative-specification\docs\experiments\prereg\SDX-1.md` (DRAFT, not frozen; freezing is JC's decision).

| Field | Value |
|---|---|
| Status | DESIGN-REVIEWED (draft; not frozen; not run) |
| Outcome | none yet |
| Evidence tier | none yet (target A) |
| Refines / refined by | refines the 2026-10-01 private design draft; follows SDX-0; replication and extensions SDX-2, SDX-3 (BACKLOG) |
| Registration | none yet; planned tag `prereg/SDX-1-v1` plus an external timestamp |
| Opened | 2026-10-02 |

## 1. Hypothesis and falsifier
H1: arm A4 (substrate) beats A1 (expert prompt) on D = state-dependent minus state-independent probe pass rate; falsified if the upper 95% bound is below the SESOI. H5, gatekept by H1: A4 beats A3 (same content in one flat file); NULL by equivalence test at the SESOI. Full text in the prereg file.

## 2. Intuition behind it
"An expert prompt is GS content without the substrate; they differ only once state must outlive the prompt." Stated in a falsifiable form: on probes that need information recorded in an earlier change, A4 outperforms A1 by at least the SESOI, and a flat file (A3) does not close the gap.

## 7. Design review
Findings F1 to F10 and R1 to R8 with dispositions: `C:\workspace\PragmaWorks\gs\generative-specification\docs\experiments\prereg\SDX-REVIEW.md`. The largest changes from the original draft: the primary readout is a level-minus-control interaction, controls (A/A and amnesia) added, arms cut from 8 to 6 and vendors from 3 to 1 with a replication later, H2, H3 and H4 moved to later experiments, the sellable-claims column removed.

## 8. Deviations log
(empty)

## 9. Result
(not run)
