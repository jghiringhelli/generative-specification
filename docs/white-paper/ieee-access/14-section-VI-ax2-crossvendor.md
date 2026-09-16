# Section VI.I. Cross-vendor structural robustness (AX2)

**Research question.** Does the disciplined-specification advantage hold across model vendors, or is it a
single-model artifact? A recurring reviewer concern for methods evaluated on one model family is external
validity across vendors. AX2 addresses this directly.

**Design.** We generated 45 implementations of the RealWorld/Conduit backend specification (TypeScript,
Express, Prisma/PostgreSQL). Three vendors (an OpenAI GPT model, a Google Gemini model, and an Anthropic
Claude model) each produced five independent implementations under each of three prompting conditions:
naive prompting (C1), an expert prompt (C2, control), and mature Generative Specification (C3). All three
vendors ran inside the same agent harness (GitHub Copilot agent mode), holding the authoring harness constant
so that the only variable across vendors is the model itself.

**Metrics of record.** Because the 45 implementations are independently generated and heterogeneous in their
runtime conventions and test infrastructure, we report only **convention-independent, statically computed**
metrics, which are comparable across implementations by construction: architectural layer-boundary violations
(data-access calls made directly inside route or controller files), code duplication (jscpd), cyclomatic
complexity (eslint), and emitted test-file count. These do not depend on runtime behaviour, HTTP status-code
conventions, or per-project test harnesses.

**Result.** The effect of disciplined specification is consistent across all three vendors. Moving from naive
prompting to a disciplined condition (control or treatment), on every vendor:

| Vendor | Layer violations (naive to disciplined) | Duplication % (naive to disciplined) | Cyclomatic mean (naive to disciplined) | Test files (naive to disciplined) |
|---|---|---|---|---|
| GPT | 18.8 to 0 | 5.2 to 0.8 to 1.6 | 2.4 to 1.5 | 1.4 to 7 to 11 |
| Gemini | 35.4 to 0 | 17.1 to 2.6 to 6.3 | 4.3 to 2.0 | 4.2 to 11 to 12 |
| Claude | 33.0 to 0 | 7.9 to 0.4 to 1.0 | 2.4 to 1.5 | 1.0 to 9 to 13 |

Architectural layer-boundary violations are eliminated (18 to 35 per project reduced to zero) on all three
vendors; duplication falls roughly two to four fold; cyclomatic complexity falls; and the emitted test count
rises several fold. The structural effect of the discipline is therefore **cross-vendor and not a single-model
artifact**, which is the external-validity claim the competitive set demands.

**Honest scope.** The separation is between **naive prompting and disciplined specification**. The expert
control (C2) and the GS treatment (C3) are largely **saturated** on this mid-complexity benchmark, both near
zero on layer violations and low on duplication and complexity, so AX2 does not establish that GS improves on
a strong expert prompt on these structural metrics. This is consistent with the saturation observed in the AX
replication (Section VI). Runtime-quality metrics (mutation score, branch coverage) and behavioural
conformance did **not** yield numbers comparable across the 45 heterogeneous implementations: a strict
behavioural oracle measures REST-convention conformance rather than functional correctness (all three vendors'
backends are functional but adopt different status-code and null conventions), and coverage is confounded by
each project's own test infrastructure. Obtaining comparable runtime-quality and lifecycle metrics requires
controlling the substrate, a fixed scaffold in which only the implementation varies plus a convention-tolerant
behavioural oracle, which we name as the next experiment.

**Threats.** One benchmark, a single shared agent harness (so the comparison is cross-vendor within one
harness rather than cross-harness), and n = 5 per cell. As with the twin studies, each conceded limit is
reported beside its result.
