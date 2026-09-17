# §I — Introduction (draft v0.1)

> IEEE Access house form: "I. INTRODUCTION" — problem, gap, what GS is, **numbered contributions**, **the research questions the empirical study answers**, and a one-sentence organization paragraph. Enforces the Gate (seven properties, objective metrics, no decagon/SAVED, no token-%, no confidential material). No em-dashes. Cites the Zenodo v4.0 preprint (CrossCheck).

## I. INTRODUCTION

An AI coding assistant now produces a working interface in seconds. The code compiles, the types check, the tests pass. Underneath, invisible, are a thousand decisions the model resolved on its own: which unit a value carries, what a null means, which layer owns which responsibility. Each is defensible in isolation; summed across sessions, teams, and services, they do not cohere. The failure is not that the model writes bad code. It is that the model writes *plausible* code, and plausibility is not correctness a reader can verify.

The root cause is structural. An AI executor is a **stateless reader**: it begins each session with no memory of the decisions made before it, no access to the context its human team carries, and no way to ask. Everything the author did not write down, for the model, does not exist. The consequence has a name, **architectural drift**: locally reasonable decisions that, accumulated, diverge. Drift is not a model defect to be patched by a larger model; it is a property of asking any stateless reader to infer what was never externalized.

The disciplines that make software verifiable, types, tests, contracts, specifications, formal methods, have long existed to carry human meaning across to executable behaviour. They were built, however, for a human next reader, and a human maintained them by hand until, under deadline, they were skipped. What has changed is the reader. A transformer is the first executor fluent on both shores, the corpus of language and the corpus of code, able to cross the bridge over and over without tiring. The opportunity, and the problem, is that the bridge is asymmetric: the model, like the human, is far stronger at human meaning than at exact code, where a single token breaks the output. Specifying in human-conceptual terms therefore routes the hard half of the work through the model's strong shore. Capturing that idea as a repeatable discipline is the subject of this paper.

**Generative Specification (GS)** is a discipline for authoring specifications from which a stateless reader can *derive* correct output. It makes derivability a binding design constraint, operationalized as a small set of named specification properties, and it externalizes architectural intent as structure the executor retrieves rather than re-infers. GS is not a new development methodology competing with agile or waterfall, and it is not a prompting technique; it is a constraint on what a specification must make derivable, situated at the pragmatic tier of the sign relation [Morris, 1938].

This paper makes four contributions:

- **C1. The stateless-reader paradigm and derivability as a binding constraint** — a precise account of why AI-assisted code degrades (drift as inference by a context-less reader) and of derivability as the obligation that removes it.
- **C2. The seven specification properties** — a named, teachable, and measurable instrument (Self-describing, Bounded, Verifiable, Defended, Auditable, Composable, Executable) that operationalizes derivability, with two properties (Self-describing, Bounded) carrying disproportionate weight by activating the model's relevant prior knowledge.
- **C3. The bridge and its read-asymmetry, and the sentinel** — the mechanism that explains *why* externalizing intent works (routing the hard half through the model's strong shore), and the sentinel navigational tree that bounds session context against degradation.
- **C4. A pre-registered, blind-audited, objective-metric evaluation** — a controlled multi-agent study comparing unstructured use, expert prompting, and GS on rubric-independent metrics (mutation score, executed coverage, static analysis), with a replication package.

The empirical study answers four research questions:

- **RQ1 (vs unstructured):** Does a GS artifact cascade produce higher-quality code than unstructured ("vibe coding") AI use?
- **RQ2 (vs expert prompting):** Does GS produce higher-quality code than expert-level prompting without GS artifacts, i.e. does the structure add value over good prompting alone? *(the load-bearing question.)*
- **RQ3 (specifiability):** Are observed quality gaps specifiable and recoverable, attributable to what the specification did or did not close rather than to model nondeterminism?
- **RQ4 (convergence):** Do objective, rubric-independent metrics corroborate a blind expert assessment of the same artifacts?

A shorter, non-empirical preprint of the conceptual framework is available [Ghiringhelli, 2026, Zenodo 10.5281/zenodo.21726017]; this paper is a distinct, empirically-grounded contribution.

The remainder of the paper is organized as follows. Section II positions GS against spec-driven development, the structural disciplines, and the LLM code-generation literature; Section III formalizes the stateless-reader constraint; Section IV presents the discipline and its seven properties; Sections V and VI give the pre-registered study design and results; Section VII discusses threats to validity; and Sections VIII and IX give implications for practice and conclusions.
