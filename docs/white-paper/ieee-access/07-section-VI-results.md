# §VI — Results (draft v0.1)

> Per-RQ structure per the IEEE Access house form + the verified exemplars (ACM TOSEM 10.1145/3697010; IEEE Access 10.1109/ACCESS.2026.3662817): each RQ = descriptive table → statistical test (exact p, Cliff's δ + magnitude band, CI) → a **boxed "Answer to RQx."** Nulls reported in the same voice as positives. **Metrics of record are objective** (the Gate); the blind audit is convergent only.
>
> **Protocol B, k=5 per condition (Sept 2026).** Every cell below is median [IQR] over five independent stateless generations. Tests are exact Mann-Whitney U (full enumeration), effect size Cliff's delta with magnitude band, family-wise correction Holm-Bonferroni within each metric's three pairwise comparisons. Runner, data, and analysis are in the replication package (`experiments/ax/runner/`, `results.csv`, `stats.py`, `stats.json`). Auditor reliability (below) is a quadratic-weighted Cohen's kappa over 105 property-level rating pairs. The objective metrics are the evidence of record (the Gate); the seven-property blind audit is convergent only.

## Overview table (objective metrics, median [IQR], k=5)

| Metric (construct) | Naive | Control (expert prompting) | Treatment (GS) | Naive vs Treatment |
|---|---|---|---|---|
| Layer-boundary violations (`prisma.*` in route files), lower better | 45 [42, 46] | 0 [0, 49] | **0 [0, 0]** | delta +1.0, p=0.024 (Holm) |
| Layer violations per TS file (size-normalized) | 2.88 [2.60, 3.31] | 0 [0, 1.36] | **0 [0, 0]** | delta +1.0, p=0.024 |
| Artifact completeness (files emitted), higher better | 21 [18, 22] | 41 [40, 47] | **55 [47, 58]** | delta +1.0, p=0.024 |
| Test files emitted, higher better | 5 [5, 6] | 11 [11, 14] | **13 [11, 15]** | delta +1.0, p=0.024 |
| Blind seven-property audit (0-14), higher better | 5 [4.5, 7.5] | 10 [9.5, 11] | **11 [6.5, 12]** | delta +0.60, p=0.27 |
| npm audit CVEs (supply chain), lower better | 2 [2, 5] | 0 [0, 1.5] | 0 [0, 2.5] | delta +0.68, p=0.095 |
| `tsc --strict` errors (type safety), lower better | 0 [0, 0] | 0 [0, 0] | 0 [0, 1] | null (all clean) |
| ESLint problems per TS file (size-normalized), lower better | 2.13 [0.74, 2.23] | 0.45 [0.36, 0.80] | 0.62 [0.49, 0.89] | delta +0.60, p=0.27 |
| Generation cost (USD), lower is cheaper | 0.65 [0.53, 0.70] | 1.34 [1.28, 1.43] | 1.89 [1.67, 1.95] | delta -1.0, p=0.024 |

## VI.A RQ1 — Does GS beat unstructured (naive) AI use?

Yes, and the separation is complete. On the architectural and completeness metrics the Treatment (full GS cascade) and the naive baseline do not overlap: layer-boundary violations 45 vs 0, files emitted 21 vs 55, test files 5 vs 13 (each Cliff's delta = +1.0, exact p = 0.008, Holm-corrected p = 0.024). The naive failure mode is structural, not stylistic: its code carries a median 2.88 direct data-layer calls per source file (the layered boundary is simply absent), and a recurring share of its output never materializes at all because model-emitted files without an explicit path header are, by the emit rule, files that do not exist. Expert prompting (Control) also separates from naive on completeness and auditability, so the first-order result is that authored structure of either kind beats unstructured use.

> **Answer to RQ1.** GS-generated code is objectively and significantly higher quality than unstructured AI use, with complete separation (Cliff's delta = 1.0, Holm p < 0.05) on architecture, artifact completeness, and test presence. The naive failure is unmaterialized and unbounded code, which the discipline's emit and boundary requirements structurally prevent.

## VI.B RQ2 — Does GS beat expert prompting alone? *(the load-bearing question)*

Here the honest answer is a nuance, and it is the most important result in the study. On **median quality** the full GS cascade (Treatment) and a strong expert prompt (Control) are **statistically indistinguishable** on this benchmark: no Treatment-vs-Control pairwise comparison survives Holm correction (audit 11 vs 10, files 55 vs 41, tests 13 vs 11, layer 0 vs 0; all Holm p > 0.09). On a mid-complexity, well-specified problem like Conduit, a senior engineer's prompt already recovers most of what the artifacts encode. This is saturation, and it was pre-registered as the expected outcome for a benchmark of this difficulty.

Where Treatment does separate from Control is **reliability, not the median**. Across five independent runs the full cascade produced **zero architecture-boundary failures (0/5)**, while expert prompting produced **two (2/5: 46 and 52 direct data-layer calls in route files)**. The dispersion makes this visible: Control's layer-violation IQR is [0, 49] against Treatment's [0, 0]. Expert prompting reaches the same peak but does not reach it every time; the artifact cascade removes the tail. The value of the cascade on this benchmark is a guaranteed floor, a variance reduction, not a higher ceiling.

> **Answer to RQ2.** On median quality, GS and a strong expert prompt are indistinguishable on a mid-complexity benchmark (saturation, pre-registered). GS's separable contribution is reliability: it eliminated the architecture failures that expert prompting still produced in 2 of 5 runs (dispersion [0,0] vs [0,49]). This both bounds the claim honestly and motivates the harder second benchmark of §VII, on which the top ablation rungs are expected to separate on the median as well.

## VI.C RQ3 — Are quality gaps specifiable and recoverable?

Two lines of within-condition evidence, drawn from the deep single-construction line (the AX-T8 run of §VI.E) rather than the k=5 baseline, since recoverability is a within-condition question about closing a specific gap. (1) **Mutation progression:** the Treatment suite rose 58.6% → 93.1% as targeted assertions were added against surviving mutants (§S9.1), and the final 93.1% *coincides with the number the documentation had hallucinated* — the aspirational figure was the quality the spec had to actually reach. (2) **Gap recovery (post-hoc, labelled):** Treatment-v2 template changes (explicit repository interfaces; fenced hook/CI file templates; a First-Response-Requirements list enforcing "a file referenced but not emitted does not exist") were derived from a gap analysis and closed the predicted gaps (§S3/S9.2), while exposing a new emit boundary that is itself specifiable. Each defect maps to a missing specification constraint, not to model nondeterminism.

> **Answer to RQ3.** Observed gaps are specifiable and recoverable: each maps to a constraint the specification did not close, and adding the constraint closes it. This supports the paper's core claim — *a defect is a query to the specification*.

## VI.D RQ4 — Do objective metrics corroborate the blind audit?

Two blind, context-free auditors independently scored each materialized project on the seven properties (0-2 each, 0-14 total), seeing only the artifacts, not the condition label. Their per-property ratings agree at a quadratic-weighted Cohen's kappa of **0.62** over 105 rating pairs (15 projects), which is substantial agreement and establishes the instrument's reliability. The audit's condition ranking is congruent with the objective metrics: median seven-property score rises 5 (naive) to 10 (expert prompting) to 11 (GS), the same order the objective completeness and architecture metrics produce. The one honest caveat is that the second auditor is systematically harsher and less discriminating than the first (its naive-to-GS separation does not reach significance), and both auditors credit some structure that execution does not confirm, which is why the objective metrics, not the audit, are the evidence of record.

> **Answer to RQ4.** The seven-property blind audit tracks the objective metrics in rank order (5 to 10 to 11) with substantial inter-auditor reliability (weighted kappa 0.62), giving convergent validity. The executed and static objective metrics remain primary, because an auditor can credit described quality that execution or a stricter second reader refutes.

## VI.E Construction invariance: a generated harness matches a hand-built one (AX-T8)

A ninth condition (post-hoc, labelled) replaced the hand-authored GS cascade with one **generated by tooling with zero hand-tuning**, run under the same word-for-word prompts and the same fresh-session, live-execution measurement. On the objective metrics it matched the best hand-authored arm: **211 tests, 99.08% executed statement coverage, 0 layer-boundary violations** (the database client confined to adapters), **11/11 use-case acceptance probes against the live runtime** (the Executable property earned from behavioural contracts, not inferred from compilation), and read-endpoint p99 under 50 ms, at a cost of roughly $52 and 150 minutes across ten sessions.

> **Finding (construction invariance).** The discipline's effect does not depend on *hand* authorship: a tool-generated specification cascade reached the same objective quality as the best hand-built one. This parallels the construction-invariance result reported for compact knowledge structures [Yarmoluk and McCreary, 2026] and indicates the effect is a property of the authored structure, not of the author.

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
