# AX-K5: AX replication, k=5 per condition, naive / expert prompt / GS (September 2026)

> Backfilled entry, written 2026-10-02 from the repository files. It does not alter the papers or the result files. Protocol: `C:\workspace\PragmaWorks\gs\generative-specification\docs\experiments\EXPERIMENT-PROTOCOL.md`.

| Field | Value |
|---|---|
| Status | CLOSED (backfilled) |
| Outcome | Layer violations naive vs GS: SUPPORTED as mechanism only (treatment-targeted metric). Rubric, GS vs expert and GS vs naive: INCONCLUSIVE. Failure-rate 0 of 5 vs 2 of 5: INCONCLUSIVE. Planned mutation and coverage metrics: INVALID-DESIGN (not collected) |
| Evidence tier | C |
| Registration | Author-attested and weak: the data are dated 2026-09-14 and the k=5 protocol file is dated 2026-09-17, so the protocol was written after the data. "Pre-specified in intent" at most. No external timestamp. |
| Data and code | `C:\workspace\PragmaWorks\gs\generative-specification\experiments\ax\runner\` (results.csv, stats.json, stats.py, runs\{naive,control,treatment}\0..4) |

## What was asked
With 5 independent stateless chains per condition, does GS differ from naive and from an expert prompt on objective metrics and on a blind audit?

## What the design could and could not detect
- Re-derived from `results.csv` on 2026-10-02. Layer violations (count of data-client calls in route files): naive [46, 43, 40, 46, 45], median 45; expert prompt [0, 0, 46, 0, 52], median 0; GS [0, 0, 0, 0, 0]. The metric is exactly the rule the treatment states, so it measures compliance with the instruction, not a quality outcome. The expert prompt stated the same rule, yet 2 of 5 expert chains violated it about 50 times.
- Audit totals (two audit runs of one prompt by the generator's own model family: "blind" means "without the arm label", not independent). Audit 1 medians: naive 5, expert 10, GS 11, GS range [3, 12]. A GS chain scored 3 on audit 1 and 5 on audit 2; an expert chain scored 11 on audit 1 and 5 on audit 2. The auditor's run-to-run noise is as large as the difference between the top two arms.
- With 5 vs 5 the smallest attainable exact two-sided Mann-Whitney p is 2/252 = 0.0079, and a Holm correction over several comparisons can push a complete separation above 0.05. Naive vs GS on the audit total was not significant after correction (Holm p 0.27 reported in the paper-fixes work).
- Mutation score and executed coverage were planned but are empty for expert and GS chains (coverage exists for three naive chains only).
- Median cost per chain, USD: naive 0.65, expert 1.34, GS 1.89.

## Questions
| Question | Result |
|---|---|
| GS vs naive on layer violations | SUPPORTED as a mechanism check (targeted metric; 45 vs 0) |
| GS vs expert prompt on audit total | INCONCLUSIVE (11 vs 10, wide GS range, noisy auditor); the reading that fits is saturation of the top two arms |
| Expert reliability (2 of 5 violating) vs GS (0 of 5) | INCONCLUSIVE (Fisher exact p about 0.44) |
| Mutation score, executed coverage | INVALID-DESIGN: not collected |

## What it licenses
Expert prompt and GS saturate on median audit score; GS followed its own layering rule in 5 of 5 chains and the expert prompt in 3 of 5. Anything stronger needs a metric the treatment does not target and an independent judge.

## Open
Redesigned rerun: BACKLOG B3.
