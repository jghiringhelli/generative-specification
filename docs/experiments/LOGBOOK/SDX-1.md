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
(Revision 1 text, superseded by revision 2; see the revision log at the end of this entry.)
H1: arm A4 (substrate) beats A1 (expert prompt) on D = state-dependent minus state-independent probe pass rate; falsified if the upper 95% bound is below the SESOI. H5, gatekept by H1: A4 beats A3 (same content in one flat file); NULL by equivalence test at the SESOI. Full text in the prereg file.

## 2. Intuition behind it
"An expert prompt is GS content without the substrate; they differ only once state must outlive the prompt." Stated in a falsifiable form: on probes that need information recorded in an earlier change, A4 outperforms A1 by at least the SESOI, and a flat file (A3) does not close the gap.

## 7. Design review
Findings F1 to F10 and R1 to R8 with dispositions: `C:\workspace\PragmaWorks\gs\generative-specification\docs\experiments\prereg\SDX-REVIEW.md`. The largest changes from the original draft: the primary readout is a level-minus-control interaction, controls (A/A and amnesia) added, arms cut from 8 to 6 and vendors from 3 to 1 with a replication later, H2, H3 and H4 moved to later experiments, the sellable-claims column removed.

## 8. Deviations log
(empty)

## 9. Result
(not run)

## Revision log (appended, never rewritten)

### 2026-10-02, revision 2 (assistant, on JC's decision), incorporating critic round 1
Hypothesis changed. Old (revision 1): A4 beats A1, A1 being an expert prompt built from GS content, then A4 beats A3, on D = E1-SD minus E1-SI. Why replaced: A1 contained GS content (spec first, tests first, update the README, ask before changing a rule), so "A4 vs A1" could not tell whether GS content or the substrate mattered, and it did not answer JC's question (is the substrate's value only governance?). New: H1 A4 beats A5 on E1-SD adjusted for E1-SI (A5 = external expert prompt with none of the load-bearing elements L1 to L5); H2 A5 differs from naive on E1-SI; old contrasts kept as secondary H3 to H6 in the Full scope; A1 redefined as A5 plus the GS appendix; negative control moved from A1b to A5b; amnesia control A4x demoted to exploratory and replaced as the validity gate by A0S (state restated in text), because A4x could not tell a failed experiment from the true world in which code carries the state; a late state-independent change 10 added (position confound); D demoted to exploratory (it rewards arms that do badly on state-independent probes); classification gains POSITIVE-SMALL and POSITIVE-SIZE-UNRESOLVED (the earlier rule had about 50% power at the SESOI and would label small real effects EQUIVALENT). No outcome data existed, so this is a pre-registration amendment, not a post-hoc change.
Files: `C:\workspace\PragmaWorks\gs\generative-specification\docs\experiments\prereg\SDX-1.md`, `C:\workspace\PragmaWorks\gs\generative-specification\docs\experiments\prereg\SDX-1-ARMS.md` (load-bearing list L1 to L5 with evidence tiers or "hypothesized only", arms, authorship procedure, checks M1 leak and M2 strength), `C:\workspace\PragmaWorks\gs\generative-specification\docs\experiments\prereg\SDX-0.md` (V1 to V13, 24 chains), review dispositions in `C:\workspace\PragmaWorks\gs\generative-specification\docs\experiments\prereg\SDX-REVIEW.md` section 2.
Intuition (falsifiable form): a mid-tier agent under generic expert prompting alone loses state-dependent behaviour by at least the SESOI more than under the substrate, and does better than naive on state-independent hidden correctness. Pre-stated gap ranges: SDX-1 section 2a. Note recorded now: prior behavioural evidence gives no precedent for H2 above about 3 points, so JC's expectation that the expert prompt differs from naive may show only on targeted structure metrics, which do not count; and the modal outcome for H1 is POSITIVE-SMALL, SIZE-UNRESOLVED or INCONCLUSIVE.
Open: external practitioner and independent reviewer not named (A5 and A6 do not exist); different-vendor critic and judge owed (only Claude critics have reviewed revision 2); no freeze.
