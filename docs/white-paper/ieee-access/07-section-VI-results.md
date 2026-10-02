# §VI — Results (draft v0.3)

> Per-RQ structure. Every cell is median [IQR] over five independent generations (Protocol B); exact Mann-Whitney U, Cliff's delta, Holm correction within each metric's three comparisons. Source: `experiments/ax/runner/stats.json`. Nulls are reported in the same voice as positives. Evidence tiers: A for the base comparison, C for single runs.

## VI. RESULTS

**TABLE II. Replication, k = 5 per condition (median [IQR]; Holm-corrected exact p).**

| Metric | Naive | Control (expert prompt) | Treatment (GS) | Naive vs GS | Control vs GS |
|---|---|---|---|---|---|
| Layer-boundary violations, lower better | 45 [41.5, 46] | 0 [0, 49] | **0 [0, 0]** | delta +1.0, p=0.024 | delta +0.40, p=0.89 |
| Layer violations per TS file | 2.88 [2.60, 3.31] | 0 [0, 1.36] | **0 [0, 0]** | delta +1.0, p=0.024 | delta +0.40, p=0.44 |
| Files emitted | 21 [17.5, 21.5] | 41 [40, 46.5] | **55 [46.5, 58]** | delta +1.0, p=0.024 | delta +0.68, p=0.095 |
| Test files emitted | 5 [5, 5.5] | 11 [10.5, 14] | **13 [10.5, 15]** | delta +1.0, p=0.024 | delta +0.24, p=0.57 |
| Seven-property audit (0-14), session 1 | 5 [4.5, 7.5] | 10 [9.5, 11] | **11 [6.5, 12]** | delta +0.60, p=0.27 | delta +0.28, p=0.57 |
| npm audit CVEs, lower better | 2 [2, 5] | 0 [0, 1.5] | 0 [0, 2.5] | delta +0.68, p=0.095 | null |
| `tsc --strict` errors | 0 [0, 0] | 0 [0, 0.5] | 0 [0, 1] | null | null |
| ESLint problems per TS file, lower better | 2.13 [0.74, 2.23] | 0.45 [0.36, 0.80] | 0.62 [0.49, 0.89] | delta +0.60, p=0.27 | delta -0.28, p=0.50 |
| Generation cost, USD per run | 0.65 [0.53, 0.70] | 1.34 [1.28, 1.43] | 1.89 [1.67, 1.95] | delta -1.0, p=0.024 | delta -1.0, p=0.024 |

*Deltas are signed so that positive favors GS, except cost. The layer-violation metric counts the rule that the control and treatment prompts state, so it favors both over the naive condition by construction (VII). Fig. 3 plots the individual runs (`figures/fig3-strip-plot.svg`).*

### A. RQ1: Does GS beat unstructured use?

On architecture and completeness, yes. Layer-boundary violations are 45 versus 0, files 21 versus 55, test files 5 versus 13 (each delta = 1.0, exact p = 0.008, Holm 0.024); 0.008 is the smallest exact p at five against five, so this means no overlap in five draws. The naive failure is structural: a median 2.88 direct data-layer calls per source file, and output that never materializes because blocks lacking a path header are not files. That emit rule was imposed in the structured conditions only, so part of the naive deficit is a condition difference and not a quality difference. On the audit (5 versus 11, Holm p = 0.27; GS runs ranged 3 to 12), lint and vulnerabilities the comparison is not significant, and strict type errors are clean in all conditions.

> **Answer to RQ1.** On this benchmark and model, GS separates completely from unstructured use on architecture, completeness and test presence, and does not separate significantly on the audit, lint or vulnerabilities, in part by construction of the conditions.

### B. RQ2: Does GS beat expert prompting? (the load-bearing question)

No, on median quality. The cascade and the expert prompt are statistically indistinguishable: no comparison survives correction (audit 11 versus 10, files 55 versus 41, tests 13 versus 11, layer violations 0 versus 0; all Holm p >= 0.095). On a mid-complexity, well-specified problem a senior engineer's prompt recovers most of what the artifacts encode. Across five runs the cascade produced no architecture-boundary failure (0/5) and the expert prompt two (2/5: 46 and 52 direct data-layer calls). That difference is not statistically supported (Holm p = 0.89; Fisher exact p = 0.44) and we carry it as a hypothesis. The expert prompt contains GS content delivered through the prompt without the persistent substrate, so the tie bounds the claim to single-shot, short-horizon generation (Section VIII.B).

> **Answer to RQ2.** On single-shot median quality, GS and a strong expert prompt are indistinguishable. The observed difference in architecture failures (0 of 5 versus 2 of 5 runs) is not statistically supported. The result does not test when a persistent substrate would be expected to matter.

### C. RQ3: Are gaps specifiable and recoverable? (tier C, single runs)

On the services layer of one treatment project (5 files, 116 effective mutants) mutation score rose from 58.6% to 93.1% over two rounds in which tests were added against surviving mutants. This shows that mutation testing detects weak tests and that they can be repaired; it does not show that GS caused better tests, because they were repaired until the score rose. Post-hoc template changes derived from a gap analysis (explicit repository interfaces, fenced hook and CI templates, a rule that a file referenced but not emitted does not exist) closed the predicted gaps and exposed a new emit boundary that was itself specifiable. The conditions were iterated by the author with knowledge of the gaps.

> **Answer to RQ3.** In a single-run, author-iterated series each gap mapped to a constraint the specification did not close, and adding it closed the gap. This is a diagnostic result, not evidence that the process converges for another author or benchmark.

### D. RQ4: Do objective metrics corroborate the audit?

Two sessions of one prompt scored each of 15 projects on seven properties; agreement is a quadratic-weighted kappa of 0.62 over 105 pairs, which is run-to-run consistency of one instrument and not agreement of independent raters. The audit's median rises 5, 10, 11 from naive to control to GS, the same order as the completeness metrics, although the naive-versus-GS audit difference is not significant. The second session is harsher and less discriminating, and both credit some structure that execution does not confirm.

> **Answer to RQ4.** The audit tracks the completeness metrics in rank order with substantial run-to-run reliability, giving weak convergent validity.

### E. Post-hoc series and construction invariance (tier C)

In the original single run the naive condition scored 3/14 on the audit scale (its suites did not compile because schema models were never emitted), the control 9/14 and GS v1 10/14; GS's only audit advantage was Composable, the control's executed line coverage was higher (34% versus 28%), and of ten registered predictions three were confirmed. Five post-hoc conditions, one run each and each designed after a gap analysis, scored 13, 14, 11, 14 and 13 out of 14; the v5 score is runner-verified (109 tests). This is the origin of the "3/14 to 14/14" figure, and it is a diagnostic series and not an effect size. One further run replaced the hand-authored cascade with one generated by tooling and reached comparable objective results (211 tests, 99.08% executed statement coverage, no layer violations, 11 of 11 live use-case probes), consistent with the effect not depending on hand authorship at n = 1.

### F. Retrieval economics (KX, tier B)

Forty-five queries (entity, obligation, layer-path, aggregate and cross-link types) were each answered in a fresh session under three conditions against a fixed ground truth.

**TABLE III. KX retrieval.**

| Condition | Macro F1 | Tokens per query | Cost per query |
|---|---|---|---|
| Everything in context | 0.611 | 100,237 | $0.56 |
| **Routed (sentinel)** | **0.808** | **78,603** | **$0.10** |
| Bare code search | 0.431 | 233,583 | $0.24 |

The routed condition is more accurate and cheaper, and two cost figures are reported because they differ. In tokens (all token classes counted equally) it used 1.3 times fewer than the monolith and 3.0 times fewer than bare search. In dollars it was 5.5 times cheaper than the monolith and 2.4 times cheaper than bare search. The dollar gap to the monolith exceeds its token gap because, on average, about 78k of the monolith's 100k tokens were billed as cache creation against about 7k for the routed condition, which mostly read cached tokens; dollars depend on provider cache pricing and are the less portable figure. On aggregate queries the routed condition scored 0.909 (as did the monolith) against 0.006 for bare search, replicating the divergence of the benchmark it follows [43]. A negative control (behavioural queries) behaved: bare search won there. Scope: this measures retrieval, not generation, which costs more under GS (Table II). The ground truth derives from the same structure the routed condition reads, so the claim is that explicit structure beats inferred structure on structural queries, not general superiority.
