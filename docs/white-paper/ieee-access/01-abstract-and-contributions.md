# Abstract, Index Terms & Contributions (IEEE Access)

## Abstract

AI coding assistants generate plausible software quickly, but each session reads the codebase without the accumulated context of the last. Architectural decisions made in one session are invisible to the next, and over time a thousand implicit choices diverge, leaving code that looks correct while quietly losing coherence. Existing disciplines address adjacent problems: structured programming governs syntax, and SOLID, test-driven development, and domain-driven design govern semantics, but none treats derivability by a stateless reader as a binding constraint. This paper introduces Generative Specification, a discipline that organizes established engineering practices under one criterion: a specification from which a reader carrying no prior context, whether a human joining the project or an AI beginning a session, can derive correct output unaided. We evaluate it with a pre-registered study across naive, expert-prompting, and Generative Specification conditions on a RealWorld backend benchmark, with independent stateless generations per condition, reported through rubric-independent objective metrics and a blind audit, and we replicate the structural comparison across three model vendors. Disciplined specification reduced architecture-boundary violations from a median of dozens per project under unstructured use to zero on every vendor tested, and produced more complete and better-tested artifacts, at roughly two to three times the generation cost. Against a strong expert prompt, median quality was statistically indistinguishable, a saturation we pre-registered; the discipline's separable value was reliability and auditability rather than median quality. The benefit is capacity-relative: largest where a model's capacity is smallest relative to the task and receding as models strengthen. We conclude that the durable contribution of the discipline is not better code than a frontier model produces, but a verified, auditable process, arbitrated outside the model and persisted outside the session, for keeping AI-assisted software coherent and accountable over time.

## Index Terms

AI-assisted software engineering; large language models; code generation; software specification; software quality; empirical software engineering; software maintainability; specification-driven development.

## Contributions

This paper makes four contributions, each bounded by what the evaluation supports:

1. **A problem formalization.** We characterize the *stateless reader* as the structural condition of AI-assisted development and argue that derivability under this condition is a binding constraint current disciplines leave implicit.

2. **A discipline that organizes known practice under one criterion.** We define Generative Specification through seven properties. We are explicit that the properties re-purpose established disciplines (self-documenting code, modularity, design-by-contract, traceability, low coupling) rather than invent new ones; the contribution is the organizing criterion (derivability under statelessness) and a checkable scheme, not a claim of new properties.

3. **A pre-registered, reproducible, cross-vendor evaluation with honest findings.** We report a multi-condition study with a blind audit and full replication materials, replicated across three model vendors. The findings include a pre-registered null: disciplined specification and a strong expert prompt saturate on median quality on this benchmark, with the discipline separating on reliability, artifact completeness, and auditability, at a stated generation-cost premium.

4. **The capacity-relative result.** We give direct evidence that the benefit of specification scaffolding scales inversely with model capability: it is large on a weak model, where structure preserves coherence and contracts convert errors into caught failures, and shrinks toward zero on a strong model at small scale, reappearing at the capacity threshold. This is a distinctive empirical claim not reported by the comparable competitive set.
