# AX: adversarial specification-completeness series (Conduit, single sessions, March 2026)

> Backfilled entry, written 2026-10-02 from the repository files, not from the experimenter's memory. It records what the design could and could not detect. It does not alter the papers or the original result files. Protocol: `C:\workspace\PragmaWorks\gs\generative-specification\docs\experiments\EXPERIMENT-PROTOCOL.md`. "Registered" below means what repository history shows, which is author-attested because commit dates are author-controlled.

| Field | Value |
|---|---|
| Status | CLOSED (backfilled) |
| Outcome | Per question, see "Questions". Headline question (GS beats an expert prompt on the rubric): INVALID-DESIGN (ceiling/floor) |
| Evidence tier | C for the first three conditions; D for treatment-v2 to v8 |
| Registration | Author-attested. Supplement S1 lists commits `bd2c05b`, `7661e62`, `7e06e78`, `6c24f6d`, `482a111`; none resolves in the public repository, whose history starts 2026-03-16, three days after the runs (2026-03-13). The text of the predictions is in Supplement S11. No external timestamp. |
| Data and code | `C:\workspace\PragmaWorks\gs\generative-specification\experiments\ax\` (RESULTS.md, README.md, notes\); Supplement `C:\workspace\PragmaWorks\gs\generative-specification\docs\white-paper\GS_Experiment_Supplement.md` |

## What was asked
Does quality rise with specification completeness (naive, expert-prompt "control", GS treatment, then post-hoc GS versions v2 to v8) on the RealWorld/Conduit benchmark, with one session per condition (claude-sonnet-4-5), scored by a blind audit session on a 7-property rubric (0 to 14) plus a few static metrics?

## What the design could and could not detect
- One run per condition, one model, one benchmark heavily represented in public code. It could detect only a very large difference on a coarse rubric; it could not estimate variance.
- Rubric: the author's own, applied by an audit model of the generator's family. Several properties are instructed by the treatment (hooks, ADRs, interfaces), so a high score partly means "the treatment's instructions were followed".
- Ten predictions were registered (Supplement S11). Three were confirmed. Four failed through ceiling or floor effects: the expert-prompt control scored higher than expected (control 9/14 vs treatment 10/14) and hooks and ADRs were zero in both. That is a design finding: on this scale the experiment could not separate treatment from expert prompt.
- Treatment-v2 to v8 were designed after reading the gaps of earlier conditions ("designed with full knowledge of each prior condition's gaps"). The climb 3/14 to 14/14 is an iterated engineering series, not a test.
- The audit scored what the output claimed; for several conditions the executable property was inferred from static artifacts (one generated report claimed 139 passing tests; 109, later 106 on independent rerun, were verified).
- In this single run the layer-violation count was 0 in all three conditions (Supplement S6), whereas the later k=5 replication (entry AX-K5) found a naive median of 45. The two are not reconciled in the repository.

## Questions
| Question | Result |
|---|---|
| GS (treatment) beats expert prompt on the rubric | INVALID-DESIGN: ceiling/floor; 3 of 10 registered predictions confirmed; single run each |
| GS and expert prompting beat naive | INCONCLUSIVE as an effect estimate (one run each); direction repeated in AX-K5 |
| Progressive 3/14 to 14/14 with specification completeness | DEMONSTRATION (post-hoc, iterated by the author) |
| Mutation score 58.6% to 93.1% | DEMONSTRATION that mutation testing finds weak tests; not evidence that GS caused better tests (tests were fixed until the score rose) |

## What it licenses
That a completeness series can be driven to the top of the author's rubric by an author who sees the gaps, and that a strong expert prompt is a strong competitor. It does not license "GS beats expert prompting" or a paradigm-level claim. Any citation of 14/14 should carry the failed-prediction count.

## Open
Rerun under the protocol on a non-memorized benchmark with metrics the treatment does not target: `C:\workspace\PragmaWorks\gs\generative-specification\docs\experiments\BACKLOG.md`, item B3.
