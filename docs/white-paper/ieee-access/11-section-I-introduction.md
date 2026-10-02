# §I — Introduction (draft v0.3)

## I. INTRODUCTION

An AI coding assistant now produces a working interface in seconds. The code compiles, the types check, the tests pass. Underneath are a thousand decisions the model resolved on its own: which unit a value carries, what a null means, which layer owns which responsibility. Each is defensible in isolation; summed across sessions, teams and services, they need not cohere. The failure is not that the model writes bad code but that it writes plausible code, and plausibility is not correctness that a reader can verify.

The structural cause is that an AI coding agent is a **stateless reader**: it begins each session with no memory of earlier sessions and no way to ask a question. What the author did not write down does not exist for it. The consequence is **architectural drift** [8], [9], [10]: locally reasonable decisions that accumulate and diverge. Recent benchmarks measure this erosion in agent output directly [25], so we take the problem as established and ask about a remedy.

The disciplines that make software verifiable (types, tests, contracts, specifications) have long carried human meaning into executable behavior [2], [5], [3]. They were built for a human next reader and were maintained by hand until, under deadline, they were skipped. We call the practice of forcing them for a reader that cannot compensate **Generative Specification (GS)**: authoring specifications from which a stateless reader can *derive* correct output. GS is not a new methodology competing with agile development and it is not a prompting technique. It is a constraint on what a specification must make derivable, with seven named properties as a gradable instrument. We use *discipline* in R. C. Martin's sense of a practice defined by what it removes [13], and we make no claim about paradigms.

**Terms.** A reader is *stateless* if it carries no memory across sessions. A project is *derivable* if such a reader can determine the correct output from its artifacts alone. The *sentinel* is a project's root instruction file (for example `CLAUDE.md` or `AGENTS.md`) with the tree of scoped child files it routes to, so that a session loads only the slice a task needs. The *substrate* is the externalized composite that keeps intent outside the model and the session: specification, document cascade, sentinel, gates and verification harness. A *gate* is an automated check whose failure blocks a change.

This paper makes four contributions (listed in the front matter): (C1) a problem formalization; (C2) a discipline that organizes known practice under one criterion; (C3) a replicated comparison with its null reported, including the finding that a strong expert prompt ties GS on single-shot median quality; and (C4) a bounded capacity-relative result on a non-memorized benchmark. The empirical study answers four research questions.

- **RQ1.** Does a GS artifact cascade produce higher-quality code than unstructured AI use?
- **RQ2.** Does it produce higher-quality code than expert prompting without GS artifacts? *(the load-bearing question)*
- **RQ3.** Are observed quality gaps specifiable and recoverable?
- **RQ4.** Do objective metrics corroborate a seven-property audit of the same artifacts?

A shorter, non-empirical preprint of the conceptual framework is available [Ghiringhelli, 2026, Zenodo 10.5281/zenodo.21726017]; this paper is a distinct, empirical contribution. Section II positions GS against related work; Section III formalizes the constraint; Section IV presents the discipline; Sections V and VI give the design and results; Section VII states threats to validity; Sections VIII and IX discuss and conclude.
