---
layout: default
title: The evidence
parent: Evidence and papers
nav_order: 1
permalink: /method/evidence/
description: "The load-bearing findings behind Generative Specification, each stated with its bound. Proponent-authored, small, mostly single-benchmark experiments, published so a reader can re-run them."
---

# The evidence

Each finding below is stated with the bound that goes with it. Read the bounds as part of the finding.

**What this evidence is.** Every experiment here is **proponent-authored**: the method's author designed the specifications, ran the studies and scored most of them. The experiments are **small** (n between 1 and 5 per cell, one to three models, mostly a single benchmark, the RealWorld "Conduit" backend). They demonstrate mechanisms and directions. They are not powered effect sizes, and none is an independent replication. The reason each one is committed with its raw evidence and, where it applies, a pre-registration timestamp is so you can re-run it instead of trusting it. Independent replications, including null results, are welcome by pull request.

The index is the [experiment ledger](/docs/white-paper/EXPERIMENT-LEDGER.md); the full account, including the threats-to-validity discussion, is in [Compendium §7.8](/docs/white-paper/GenerativeSpecification_Compendium.html).

**A note on the scores.** Scores on this page such as "13/14" or "3 to 14 out of 14" come from the legacy 14-point rubric (0, 1 or 2 per property). It is retired as a scorecard, and the [rubric page](../rubric/) describes the current letter grades. It stays here because it is the instrument these experiments were measured with.

**One structural concern first.** The method defines the seven properties, guides the assistant to satisfy them, and scores the result. That is a define/build/measure loop, and no amount of outside checking removes the circularity entirely. The mitigations are partial: tool-computed metrics the rubric never specified (compiler errors, lint, `npm audit`, a community-authored 104-test suite), a blind scoring of three implementations the method never guided (BX), and observational field corroboration. A controlled human-participant study that closes the loop directly is future work.

---

## 1. The boundary that matters is naive versus structured (AX)

Eight conditions on Conduit, one model (claude-sonnet-4-5). The unstructured baseline produced an internally incoherent project: all six of its test suites failed to compile. Both structured conditions produced compilable, layered code. Re-run as five independent generations each, layer violations were a median of 45 (IQR 42-46) for the naive condition against 0 for the GS treatment, with the direction holding under exact Mann-Whitney U and Holm correction. Generation cost rose with structure (median about $0.65 naive, $1.34 expert-prompt control, $1.89 treatment): the discipline costs more to generate, not less.

**Bound.** One benchmark, one model, one author's specifications. Three conditions were pre-registered; the other five were designed after seeing the earlier ones, so the path from 3 to 14 out of 14 is iterated optimization on one benchmark, not independent confirmation. It shows that each gap was diagnosable and closable.

## 2. Against an expert prompt, there is a tie on the median (AX, k=5)

The expert-prompt control and the GS treatment saturated to comparable median audit scores (10 against 11). That is a null on the median and it stays in the record: the separation in AX is naive to disciplined, not GS over an expert prompt. The control breached the layer boundary in 2 of 5 runs and the treatment in 0 of 5; with five runs that difference is not statistically supported (Holm p = 0.89), so it is an observation consistent with a reliability effect, not a demonstrated one. Whether the persisted substrate buys durability over many increments is a separate hypothesis (H-S, tier D, not run). In the first prospective pass the difference was one point (10/14 against 9/14), all of it on the Composable property, and on Executable the control did better.

**Bound.** Same as above, plus an unresolved confound: the expert prompt is arguably a light version of the method, GS content delivered without the persistent substrate. Two blind AI auditors agreed at quadratic-weighted kappa 0.62; no human inter-rater check was run.

## 3. The structural effect appears across vendors (AX2)

With GPT, Gemini and Claude models, naive to disciplined specification took architectural layer violations from 18-35 per project to 0, cut duplication and complexity, and multiplied test files.

**Bound.** This tested disciplined *prompting*, not the enforced verification loop. All three vendors ran through the same agent tool, so it is vendor-plus-tool, not raw model. The coverage and strict-oracle sub-metrics could not be compared across independently generated apps, and the design did not support them, so those claims are retired rather than reported. A weak-local-model tier was incomplete and yielded no number.

## 4. The rubric ranks implementations the same way independent tools do (BX)

Three Conduit implementations were scored blind: two never exposed to the method and one GS-generated. Rubric scores 13/14, 7/14 and 6/14. That order matches independent measures on every axis: 0, 43 and 105 known vulnerabilities, and 104, 27 and 1 test cases. Community reputation (stars) was not a reliable quality proxy.

**Bound.** n=3, one benchmark. This supports the rubric as an *instrument*, not as a mechanism, and the author still defined it.

## 5. The build can be reproduced from a document (RX)

From a single committed specification, the recorded run produced 104 passing tests across seven suites, a clean `tsc --noEmit`, and no hardcoded credentials. The output evidence is committed, so a reader can check it on clone or re-run it with Docker, Node and an API key.

**Bound.** One recorded run on one model. It is a floor for reproducibility, not a distribution.

## 6. The gate holds against a live system (EX)

A Conduit backend was deployed and checked at three levels: 13 of 13 behavioural probes (1,013 assertions), 3 of 3 environment probes, and 6 of 6 service-level objectives under a load ramp. Fifteen defects surfaced and were fixed in the session, each caught by a failing check before the cycle was allowed to close.

**Bound.** A single-project demonstration. It shows the Executable property working end to end against a running system. It does not say how often such a gate catches defects on other projects.

**Provenance.** The author confirms that the AI wrote the tests in this experiment. The repository history supports that only at the level of the whole commit: the experiment is one commit (`10532b5`, 2026-04-17, 141 files) carrying a `Co-Authored-By: Claude Sonnet 4.6` trailer, and it contains the source, the unit tests, the integration tests and the 13 behavioural probes together. Timestamps show ordering, not authorship, and this history shows no ordering between tests and source, no per-file authorship and no stored session transcript. So the claim rests on the author's confirmation plus the commit-level trailer. It also means the tests came from the same AI that wrote the code, which is the circular-oracle risk that a person must ratify against.

## 7. Authored structure beats inferred structure on structural queries (KX)

Forty-five queries generated from the project's own artifacts, three retrieval conditions, fresh session per query. Routed navigation scored macro F1 0.808 at 78.6k tokens per query; the in-context dump scored 0.611 at 100.2k; the no-structure code-search condition 0.431 at 233.6k. The no-structure condition was the most expensive, and on entity lookups, the negative control, code search did best of the three.

**Bound.** One model. The ground truth for structural queries comes from the same structure the navigation tree reads, so the claim is only that explicit structure beats inferred structure on structural questions, not general superiority. Behaviour questions belong to code search.

## 8. Two levers: navigation and bounding (TX, SX)

Chaos costs the machine in two independent ways. The **sentinel** fixes *navigation* (finding the right slice): with the authored map, search cost dropped roughly threefold on a degraded codebase and fell on the clean one too. It does not fix *surface*: with the same map on both twins, the degraded twin still cost about 2.4 times the tokens and 3.5 times the edits (seven against two) to make the same change, because the change had to be applied to five duplicated copies. Only refactoring removes that. Separately, re-layering at constant content did not make a stateless reader cheaper. All cost is reported as tokens to complete the change, never as a token-reduction percentage.

**Bound.** One benchmark, one frontier model, n=2 per cell: a mechanism demonstration, not a powered effect. The frontier model paid the surcharge rather than dropping a copy; the weaker-model failure mode, a missed copy shipping inconsistent output, is outstanding.

## 9. The value of the scaffolding is capacity-relative (TX, CR, MX)

The advantage of a disciplined spec is not constant. It is largest where the model is weakest and recedes as the model strengthens.

- **TX.** On a cross-cutting change, a 3B local model silently truncated the undisciplined codebase, dropping six of eight endpoints while still compiling. The disciplined twin regenerated whole, and its types turned the error into a caught compile failure. A strong model showed no difference.
- **CR** (an invented, non-memorized benchmark, weak to frontier models). The effect held **only on structural cleanliness**, and it receded up the ladder. The behavioural axis was null at the weak rung. The GS arm was high-variance at the weak rung.
- **MX.** For well-specified service work, a mid-tier and a strong model both passed 149 of 149 held-out acceptance assertions on the full backend, with the mid-tier at about one-sixth the cost. Multi-model tiering did not pay off at that task size.

**Bound.** CR is n=3 on one benchmark with one weak model (a larger rung was dropped). TX and MX are single-benchmark pilots. Read together, they say where the scaffolding earns its keep and where the frontier absorbs the difference. They are not a general law, and the site makes no prediction from them.

## 10. Specificity is the load-bearing arm at current capability (RND-1)

Under delivery pressure, a descriptive spec floored the model to the literal minimum (0 of 3 runs matched the held-out intent), and a prescriptive spec with postconditions recovered it (3 of 3), at equal token cost. The other two arms returned honest nulls: bounded context showed no effect at a task size within one-shot capacity (n=2), and under "graded on your own tests" pressure the model did not fake tests (n=2). Those nulls bound the arms; they do not refute them.

**Bound.** Single-shot, n=2 or 3 per sub-experiment, verified by a held-out oracle and stateless external judges.

## 11. Cheap execution revives some disciplines, where the failure occurs (ALX, NX)

- **ALX.** A compiler was derived from the formal specification of its own language. The first pass scored 0.000 because the spec omitted the public API surface; each correction was a spec addition; the run reached 386 of 386 acceptance tests across six phases. **Bound:** one artifact, one author; the correction log is the finding.
- **NX.** N-version generation is dead on a frontier model, where the generator does not err, and revives on a weak one, where it does. Benefit is gated by exposure to the failure, not by cost alone. **Bound:** small k, one practice, two models, a mechanism demonstration and not powered. The pre-registered revival grid, which tests this across practices, has its design frozen and is not yet run.

## 12. What patchability showed (CX)

Five patch tasks, one per structural class, applied to a GS-specified codebase and to the official reference implementation (rubric 13/14 against 7/14). Both codebases passed 5 of 5. The raw pass rate did not separate them. What differed was where the patches landed: validation went to a schema at the boundary in one codebase and inside the service in the other, and a strongly typed domain closed a bug class the untyped one left open.

**Bound.** Five tasks, chosen to probe known compliance gaps, applied by one AI agent. It shows a difference in *where* changes land, not a pass-rate advantage.

---

## Observational only

A four-day workshop with a paying cohort of eight non-senior practitioners is reported in [Compendium §7.8.A](/docs/white-paper/GenerativeSpecification_Compendium.html) as observational: no control, no blind scoring, no pre-registration, one self-selected cohort. It establishes nothing on its own and is not weighed in the rubric or the inference statistics. It is a source of failure modes and objections for the controlled work to test.

## How the numbers are reported

Metrics are objective and tool-computed: mutation score, branch coverage, cyclomatic complexity, duplication and dead-code percentages, type health, `npm audit`. There is no headline "token reduction" percentage. Cost depends on model, task and codebase, and absolute token spend can rise when you work faster. The honest metric is **cost per correct output**: tokens spent divided by outputs that pass verification. That is a metric, not a law.

## What has not been measured

- **The relation I ∝ (1 − S) / S** is a mental model. The AX series is directionally consistent with it; a cross-practitioner test is future work, and no constant is claimed.
- **A controlled human-participant study** (specification written by someone other than its author) is designed and not run.
- **Cross-model replication** beyond the pilots above, and a powered flagship, are still owed.
- **The weak-model coherence-failure arm** of SX, and the **weak-local tier** of AX2, are outstanding.
- **The Defended property** is only partly measurable by generated code and needs human review; automated scores for it are provisional.
- **The revival grid** across practices is pre-registered and not yet run.

**Next:** [The rubric](../rubric/) · [Quality gates](../gates/) · [Spec completeness](../spec-completeness/) · [The course](../course/)
