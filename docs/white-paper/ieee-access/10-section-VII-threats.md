# VII. THREATS TO VALIDITY

> Structured on the four-category scheme of Wohlin et al. [14], one paragraph per
> category, each stating the threat and then its mitigation. The rigor scaffold is
> Wohlin et al. [14] for the four buckets, Kitchenham et al. [16] for empirical
> reporting, and the community "Guidelines for Empirical Studies in Software
> Engineering involving LLMs" (arXiv:2508.15503) [15] for the LLM-specific
> obligations: named model and version, logged seeds and prompts, human validation
> of automated outputs, and an open-model baseline. Single-author and
> single-benchmark scope is owned here rather than hidden. No em-dashes per house voice.

## VII.A Construct validity

The central construct-validity threat is that no single metric measures "code
quality," and each metric of record proxies a narrower construct that could be
satisfied without the quality it stands for. Mutation score proxies
behavioural-fault detection, but a suite can catch injected mutants while still
missing faults the mutation operators do not model. Executed coverage proxies how
much behaviour the tests exercise, but coverage rewards execution rather than
assertion, so a high figure can coexist with weak oracles. The static-analysis
counts (strict type errors, lint problems, CVE counts) proxy defect density along
axes their tools happen to check, and a program can be type-clean and lint-clean
yet behaviourally wrong. A further, specific threat is the divergence between
AI-reported and measured quantities: the study observed reported coverage figures
(for example a claimed 93.1%) that execution against a live database could not
support until assertions were added, so any construct built on self-reported
numbers would be invalid. The mitigation is triangulation. No construct rests on a
single instrument: the metrics of record are objective, execution-based, and
computed by committed automated runners rather than by human or model judgement,
and they are cross-checked against a blind adversarial audit conducted by a
context-free model session that scores only what is materially present in the
output directory, giving convergent validity (RQ4). Each metric's individual
construct limitation is stated where the metric is defined (Study Design, §V.E),
before a reviewer reaches it, and self-reported quantities are explicitly excluded
from the evidence of record in favour of their executed counterparts.

## VII.B Internal validity

The primary internal-validity threat is that an observed quality gap could arise
from something other than the specification context that the design intends to
isolate. Three mechanisms are salient. First, model nondeterminism: the same model
under the same configuration can produce different outputs across sessions, so a
single run per condition cannot separate a specification effect from a lucky or
unlucky draw. Second, materialisation and harness bias: the naive baseline's 0%
executed coverage arises because the model wrote schema definitions in unannotated
prose blocks that were never emitted to files. This is a genuine emit-discipline
failure and not a measurement artifact or a runner bug, but it must be reported as
such so that it is not read either as a defect of the harness or as cherry-picking;
the scoring rule (materialisation scored as emitted) is pre-registered so the
decision cannot be made after seeing the outcome. Third, proponent bias: the study
is authored by the proponents of the method, which could bias condition
construction, prompt effort, or interpretation, most acutely in favour of the
treatment over the deliberately strong expert-prompting control. The mitigations
are a fixed model and configuration (claude-sonnet-4-5, identical tool config,
identical Docker and PostgreSQL infrastructure, with only the specification context
varied); pre-registration of the rubric, conditions, and point predictions in
version control before any run, with the two post-hoc conditions labelled and
reported separately and never merged into the pre-registered comparison; the
k-replication protocol (Protocol B, §V and the replication appendix) that repeats
each condition to quantify nondeterminism as within-condition variance; and a
context-free blind auditor with no knowledge of the experiment, the method, or the
paper, which removes the proponents from the scoring loop for the convergent
instrument.

## VII.C External validity

The external-validity threats are the ones the study owns most directly, because
its scope is deliberately narrow. The evaluation uses a single benchmark target
(the RealWorld "Conduit" API), a single primary model (claude-sonnet-4-5), and a
single language and stack (TypeScript on Node.js), so the results generalise, as
observed, only to systems, models, and stacks resembling these. The most serious
specific threat is benchmark contamination: Conduit is a widely known reference
application, and the models evaluated were very likely pre-trained on public
Conduit implementations (Supplement §S10), which means measured quality on this
target may overstate what the same conditions would achieve on a domain absent from
pre-training data. A finding consistent with this hypothesis is that the layer
discipline held even for the naive baseline, which is what one would expect if the
model had internalised idiomatic Conduit structure. These limits are stated plainly
rather than qualified away: a single controlled target with a single model supports
an existence-and-direction claim, not a claim of general effect. The planned
mitigations are to stratify Conduit by feature area (authentication, articles,
comments, social following) and report per-stratum so that at least within-target
heterogeneity is exercised; to add an open-weights baseline model (Qwen2.5-Coder)
to support any model-agnostic framing and to test whether the effect is specific to
one vendor's model, as the LLM-empirical guidelines [15] recommend; and, where
resources permit, to add a second target specification drawn from a domain less
likely to be memorised. The paper carries an explicit future-replication statement:
the present results should be read as a pre-registered demonstration whose
generalisation is a matter for the replication, not as a claim already established
across models, benchmarks, and stacks.

## VII.D Conclusion validity

The conclusion-validity threat follows from the design as first run: with a single
generation run per condition there is no sampling distribution, so no inferential
test can honestly be applied, and reporting p-values on one observation per cell
would fabricate the very rigor the paper argues for. The basis for confidence in
the single-run design is therefore limited to the reproducibility and objectivity
of the metrics together with the size and direction of the effects (for example 41
strict type errors reduced to 0, executed coverage moving from 0% to a materialised
suite, and a mutation score rising from 58.6% toward the level the documentation
had only claimed), corroborated by the blind audit. A second threat is multiple
comparisons: several metrics are compared across three conditions, which inflates
the family-wise error rate if each contrast is read independently. The mitigation
is the k-replication protocol (Protocol B), which yields a distribution per
condition per metric and thereby permits honest inference: non-parametric tests
appropriate to small k (Kruskal-Wallis across the three conditions, then pairwise
Mann-Whitney U for the two contrasts of record, or Wilcoxon signed-rank where runs
are paired by task stratum), reported with Cliff's delta effect sizes and their
magnitude bands, Holm-Bonferroni correction across the comparison family, and exact
p-values with confidence intervals at alpha = 0.05, following the analysis pattern
of accepted work in this space [14], [15]. Two further commitments protect the
conclusions regardless of design: effects are reported as large only where they are
also reproducible, and null results are reported in the same voice as positive ones
(for example the tie with the expert-prompting control on lint problems, 40 versus
40, and the orthogonality of the CVE count to the specification context), so that
the study neither overclaims where a strong prompt already suffices nor conceals the
axes on which the method does not separate.

---

## References to add to §04 (rigor scaffold cited above)

> These three are cited in this section as [14], [15], [16] and are not yet in
> `04-references.md`. Slot them in at assembly (renumbering as needed).

[14] C. Wohlin, P. Runeson, M. Höst, M. C. Ohlsson, B. Regnell, and A. Wesslén,
*Experimentation in Software Engineering*. Berlin, Germany: Springer, 2012, doi:
10.1007/978-3-642-29044-2.

[15] S. Baltes et al., "Guidelines for empirical studies in software engineering
involving LLMs," arXiv:2508.15503, 2025. [Online]. Available:
https://llm-guidelines.org (accessed Sep. 2026).

[16] B. A. Kitchenham et al., "Preliminary guidelines for empirical research in
software engineering," *IEEE Transactions on Software Engineering*, vol. 28, no. 8,
pp. 721–734, Aug. 2002, doi: 10.1109/TSE.2002.1027796.
