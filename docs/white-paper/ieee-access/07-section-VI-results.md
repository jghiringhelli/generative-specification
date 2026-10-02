# §VI — Results (draft v0.1)

> Per-RQ structure per the IEEE Access house form + the verified exemplars (ACM TOSEM 10.1145/3697010; IEEE Access 10.1109/ACCESS.2026.3662817): each RQ = descriptive table → statistical test (exact p, Cliff's δ + magnitude band, CI) → a **boxed "Answer to RQx."** Nulls reported in the same voice as positives. **Metrics of record are objective** (the Gate); the blind audit is convergent only.
>
> **Protocol B, k=5 per condition (data committed Sept 2026; analysis plan pre-specified in intent, not independently timestamped, see V.B).** Every cell below is median [IQR] over five independent stateless generations. Tests are exact Mann-Whitney U (full enumeration), effect size Cliff's delta with magnitude band, family-wise correction Holm-Bonferroni within each metric's three pairwise comparisons. Runner, data, and analysis are in the replication package (`experiments/ax/runner/`, `results.csv`, `stats.py`, `stats.json`). Auditor reliability (below) is a quadratic-weighted Cohen's kappa over 105 property-level rating pairs. The static and emission metrics are the evidence of record (the Gate); the seven-property audit is convergent only. Mutation score and executed coverage were not obtained for the replication (V.E).

## Overview table (median [IQR], k=5; Holm-corrected exact p)

| Metric (construct) | Naive | Control (expert prompting) | Treatment (GS) | Naive vs Treatment | Control vs Treatment |
|---|---|---|---|---|---|
| Layer-boundary violations (`prisma.*` in route files), lower better | 45 [41.5, 46] | 0 [0, 49] | **0 [0, 0]** | delta +1.0, p=0.024 | delta +0.40, p=0.89 |
| Layer violations per TS file (size-normalized) | 2.88 [2.60, 3.31] | 0 [0, 1.36] | **0 [0, 0]** | delta +1.0, p=0.024 | delta +0.40, p=0.44 |
| Artifact completeness (files emitted), higher better | 21 [17.5, 21.5] | 41 [40, 46.5] | **55 [46.5, 58]** | delta +1.0, p=0.024 | delta +0.68, p=0.095 |
| Test files emitted, higher better | 5 [5, 5.5] | 11 [10.5, 14] | **13 [10.5, 15]** | delta +1.0, p=0.024 | delta +0.24, p=0.57 |
| Blind seven-property audit (0-14), session 1, higher better | 5 [4.5, 7.5] | 10 [9.5, 11] | **11 [6.5, 12]** | delta +0.60, p=0.27 | delta +0.28, p=0.57 |
| npm audit CVEs (supply chain), lower better | 2 [2, 5] | 0 [0, 1.5] | 0 [0, 2.5] | delta +0.68, p=0.095 | null |
| `tsc --strict` errors (type safety), lower better | 0 [0, 0] | 0 [0, 0.5] | 0 [0, 1] | null (all clean) | null |
| ESLint problems per TS file (size-normalized), lower better | 2.13 [0.74, 2.23] | 0.45 [0.36, 0.80] | 0.62 [0.49, 0.89] | delta +0.60, p=0.27 | delta -0.28, p=0.50 |
| Generation cost (USD per run), lower is cheaper | 0.65 [0.53, 0.70] | 1.34 [1.28, 1.43] | 1.89 [1.67, 1.95] | delta -1.0, p=0.024 | delta -1.0, p=0.024 |

*Evidence tier A for the three base conditions (k=5, one benchmark, one model, one author). The layer-violation metric counts the very rule the control and treatment prompts state; it favors both structured conditions over the naive one by construction (VII.A). Deltas are Cliff's delta, signed so that positive favors the treatment, except cost, where the treatment is more expensive. Source: `experiments/ax/runner/stats.json`.*

## VI.A RQ1 — Does GS beat unstructured (naive) AI use?

On the architectural and completeness metrics, yes: the Treatment (full GS cascade) and the naive baseline do not overlap. Layer-boundary violations are 45 versus 0, files emitted 21 versus 55, test files 5 versus 13 (each Cliff's delta = +1.0, exact p = 0.008, Holm-corrected p = 0.024). At five against five, 0.008 is the smallest exact p that exists, so this reads as "no overlap in five draws" and not as a tightly estimated magnitude. The naive failure is structural, not stylistic: its code carries a median 2.88 direct data-layer calls per source file (the layered boundary is simply absent), and a recurring share of its output never materializes because model-emitted files without an explicit path header are, by the emit rule, files that do not exist. That emit rule was imposed in the structured conditions and not in the naive one, so part of the naive deficit is a prompt-condition difference and not a quality difference. On the other axes the comparison is not significant: the blind audit (5 versus 11, Holm p = 0.27, the treatment scoring from 3 to 12), lint per file (Holm p = 0.27), vulnerabilities (Holm p = 0.095), and strict type errors (all conditions clean). Expert prompting (Control) separates from naive on completeness and, on the first audit, on the score (Holm p = 0.024), so the first-order result is that authored structure of either kind beats unstructured use.

> **Answer to RQ1.** On architecture, artifact completeness and test presence, GS-generated code separates completely from unstructured use (Cliff's delta = 1.0, Holm p = 0.024) on this benchmark and model. On the blind audit, lint and vulnerabilities it does not separate significantly. The naive failure is unmaterialized and unbounded code, which the emit and boundary requirements prevent, in part by construction of the conditions.

## VI.B RQ2 — Does GS beat expert prompting alone? *(the load-bearing question)*

The answer is a tie on median quality, and it is the most important result in the study. The full GS cascade (Treatment) and a strong expert prompt (Control) are **statistically indistinguishable** on this benchmark: no Treatment-versus-Control pairwise comparison survives Holm correction (audit 11 versus 10, files 55 versus 41, tests 13 versus 11, layer violations 0 versus 0; all Holm p >= 0.095). On a mid-complexity, well-specified problem like Conduit, a senior engineer's prompt already recovers most of what the artifacts encode. This is saturation, and it was the expected outcome for a benchmark of this difficulty.

One observation is consistent with a reliability difference and is not established by these data. Across five independent runs the full cascade produced no architecture-boundary failures (0/5) while expert prompting produced two (2/5: 46 and 52 direct data-layer calls in route files); the dispersion is visible (Control's layer-violation IQR is [0, 49] against Treatment's [0, 0]). With five runs the difference is not statistically supported (Holm p = 0.89), and a Fisher exact test on 0/5 versus 2/5 gives p = 0.44. We report it as a hypothesis for a larger run, not as a finding.

The tie must also be read for what the control is. The expert prompt contains GS content (the layering rule, the error contract, the naming and coverage targets) delivered through the prompt, without the persistent artifact cascade. The tie therefore says that, for a single-shot, short-horizon generation of a well-specified mid-complexity system by a capable model, delivering the content through the prompt is as good as delivering it through the cascade. It does not test who knows what to put in the prompt, whether quality persists across many iterations on a large project, continuity across sessions and people, or governance and auditability (Section VIII.B states these as limits and as an open hypothesis).

> **Answer to RQ2.** On median quality, GS and a strong expert prompt are indistinguishable on a mid-complexity, single-shot benchmark (saturation). An observed difference in architecture failures (0 of 5 versus 2 of 5 runs) is not statistically supported and is carried as a hypothesis. The result does not test the conditions under which a persistent substrate would be expected to matter (Section VIII.B).

## VI.C RQ3 — Are quality gaps specifiable and recoverable?

Two lines of within-condition evidence, both single runs (evidence tier C). (1) **Mutation progression:** on the services layer of one treatment project (5 files, 116 effective mutants) the mutation score rose from 58.6% to 93.1% over two rounds in which tests were added against surviving mutants (S9.1). This shows that mutation testing detects weak tests and that they can be repaired; it does not show that GS caused the better tests, because the tests were repaired iteratively until the score rose. (2) **Gap recovery (post-hoc, labelled):** Treatment-v2 template changes (explicit repository interfaces; fenced hook and CI file templates; a requirement that a file referenced but not emitted does not exist) were derived from a gap analysis and closed the predicted gaps (S3, S9.2), while exposing a new emit boundary that is itself specifiable. Each observed defect maps to a missing specification constraint. The conditions were iterated by the author with knowledge of the gaps, so this shows that gaps can be named and closed, not that the process converges independently of the author.

> **Answer to RQ3.** Observed gaps were specifiable and recoverable in the single-run, author-iterated series: each maps to a constraint the specification did not close, and adding the constraint closed it. This is a diagnostic result (tier C). It does not show that the process converges for another author or benchmark.

## VI.D RQ4 — Do objective metrics corroborate the blind audit?

Two fresh sessions of the same model and prompt (not independent raters) scored each materialized project on the seven properties (0-2 each, 0-14 total), seeing only the artifacts, not a condition label (the artifacts themselves usually reveal it). Their per-property ratings agree at a quadratic-weighted Cohen's kappa of **0.62** over 105 rating pairs (15 projects), which is substantial agreement between two runs of one instrument; it measures run-to-run consistency, not agreement between independent raters. The audit's condition ranking is congruent in order with the objective metrics: median seven-property score rises 5 (naive) to 10 (expert prompting) to 11 (GS), the same order the completeness metrics produce, although the naive-versus-GS audit difference is not significant (Holm p = 0.27). The one honest caveat is that the second auditor is systematically harsher and less discriminating than the first (its naive-to-GS separation does not reach significance), and both auditors credit some structure that execution does not confirm, which is why the objective metrics, not the audit, are the evidence of record.

> **Answer to RQ4.** The seven-property audit tracks the completeness metrics in rank order (5 to 10 to 11) with substantial run-to-run reliability (weighted kappa 0.62), giving weak convergent validity. The executed and static objective metrics remain primary, because an auditor can credit described quality that execution or a stricter second reader refutes.

## VI.E Construction invariance: a generated harness matches a hand-built one (AX-T8)

A ninth condition (post-hoc, single run, evidence tier C) replaced the hand-authored GS cascade with one **generated by tooling with zero hand-tuning**, run under the same word-for-word prompts and the same fresh-session, live-execution measurement. On the objective metrics it matched the best hand-authored arm: **211 tests, 99.08% executed statement coverage, 0 layer-boundary violations** (the database client confined to adapters), **11/11 use-case acceptance probes against the live runtime** (the Executable property earned from behavioural contracts, not inferred from compilation), and read-endpoint p99 under 50 ms, at a cost of roughly $52 and 150 minutes across ten sessions.

> **Finding (construction invariance, one run).** In one run a tool-generated specification cascade reached objective quality comparable to the best hand-built one, which is consistent with the effect not depending on *hand* authorship. This parallels the construction-invariance result reported for compact knowledge structures [Yarmoluk and McCreary, 2026] and indicates the effect is a property of the authored structure, not of the author.

## VI.F The economics of authored structure (retrieval) — measured

A complementary study (KX) measures a different cost than generation: the **retrieval economics** of the harness in agentic use, i.e. how efficiently an agent answers questions about the system. Forty-five queries (spanning entity, obligation, layer-path, aggregate, and cross-link types) were each answered in a fresh session under three conditions, scoring token-F1 against a fixed ground truth and reasoning-density (F1 per token):

| Condition | Macro F1 | Tokens / query | Cost / query |
|---|---|---|---|
| Everything-in-context (monolith) | 0.611 | 100,237 | $0.56 |
| **Routed harness (the sentinel)** | **0.808** | **78,603** | **$0.10** |
| Bare code search (no authored structure) | 0.431 | 233,583 | $0.24 |

The routed harness is **both more accurate and cheaper per query** (about 5.5x cheaper than loading everything in context), and the *absence* of authored structure is the most expensive condition, with the bare agent burning up to 492k tokens per query searching for conventions that do not exist. On aggregate-reasoning queries the routed condition scored 0.909 versus 0.006 for bare search, replicating the divergence reported for pre-structured retrieval on other substrates [Yarmoluk and McCreary, 2026].

> **Finding (retrieval economics).** For the retrieval half of the loop, authored structure improves accuracy *and* reduces token cost per correct answer. This is the objective, measured support for the paper's framing that the binding metric is output-per-token, not tokens-generated. **Scope, stated honestly:** this measures retrieval, not generation; it does not claim that GS *generation* consumes fewer absolute tokens (it does not), and the ground truth is derived from the same structure the routed condition reads, so the claim is that *explicit structure beats inferred structure on structural queries*, not general superiority. A negative control (behavioural queries, which belong to code search) confirmed the benchmark is not rigged: bare search won there.


## External-validity note (carried into §VII Threats)
Single benchmark (Conduit), single primary model (Sonnet). Mitigations planned in Protocol B: **stratify Conduit** by feature-area and report per-stratum; add an **open-weights baseline model** (Qwen2.5-Coder via Ollama) to support model-agnosticism. Both owned explicitly under External validity with a future-replication sentence.
