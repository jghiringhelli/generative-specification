# Abstract, Index Terms & Contributions (IEEE Access) — v0.3

## Abstract

In five independent generations per condition on the RealWorld "Conduit" backend, a structured specification cut layer-boundary violations from a median of 45 per project under unstructured prompting to 0 and raised emitted files from 21 to 55, but did not separate from a strong expert prompt on median quality (blind-audit score 11 versus 10, Holm-corrected p = 0.57). AI coding agents begin each session with no memory of earlier ones, so decisions left implicit are completed from the model's prior and drift across sessions. Generative Specification (GS) organizes established engineering practices under one criterion: a specification from which such a stateless reader can derive correct output unaided, graded on seven properties. We evaluate it with a three-condition study (naive, expert prompt, GS) on static and emission metrics, replicate the structural comparison across three model vendors (median violations 30 to 35 under naive prompting, none in all 30 disciplined runs), and test capacity dependence on an invented, non-memorized benchmark, where the structural benefit (duplication, complexity) was largest on the weakest model and near zero at the frontier while behavioural conformance showed no such gradient. The expert prompt is GS content delivered without a persistent substrate, so the tie says nothing about long-horizon, cross-session or governance value; we state that as an unrun, falsifiable hypothesis. Threats include a single author, a probably memorized benchmark, a metric the treatment targets, and model-written tests. Materials are public.

*(Word count 233; target 150 to 250. Every number above is checked against `experiments/ax/runner/stats.json`, `static_ax2.json` and `experiments/cr/RESULTS-final.md`.)*

## Index Terms

Software engineering; artificial intelligence; software quality; software architecture; formal specifications; large language models. *(Unverified against the IEEE Thesaurus; see SUBMISSION-CHECKLIST.)*

## Contributions

This paper makes four contributions, each bounded by what the evaluation supports. It does not claim new properties of software, new mechanisms for any single practice, or superiority over spec-driven tools.

1. **A problem formalization.** We characterize the *stateless reader* as the structural condition of AI-assisted development and argue that derivability under this condition is a constraint that existing disciplines leave implicit.

2. **A discipline that organizes known practice under one criterion.** GS is defined through seven properties. They re-purpose established practice (self-documenting code, modularity, design by contract, traceability, low coupling); the contribution is the organizing criterion and a gradable scheme.

3. **A replicated comparison with its null reported.** A three-condition study at five generations per condition, a cross-vendor structural replication, and full replication materials. The findings include a tie: GS and a strong expert prompt are indistinguishable on single-shot median quality on this benchmark. We state what the tie does not test and carry the substrate-versus-prompt question as an explicit, falsifiable, unrun hypothesis (Section VIII.B), at a stated generation-cost premium.

4. **A bounded capacity-relative result.** On an invented, non-memorized benchmark and a ladder from a small local model to frontier models, the structural benefit (duplication, complexity) is largest on the weakest model and near zero at the frontier; behavioural conformance shows no such gradient. This is a small-sample mechanism demonstration (k = 3, one benchmark, one weak model, high dispersion at the weak rung), not a powered effect.
