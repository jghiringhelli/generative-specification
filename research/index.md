---
layout: default
title: Research
nav_order: 8.5
has_children: true
permalink: /research/
description: "For researchers: the research question behind Generative Specification, what is claimed, on what evidence and with what status, what is not shown, and how to check and cite it."
---

# For researchers

A five-minute reading for a researcher in software engineering, AI-assisted development or lightweight formal methods. It is deliberately plain about status. The research artifacts are open and separable from any commercial work, which lives elsewhere ([pragmaworks.dev](https://pragmaworks.dev)).

## The research question

When an AI assistant writes most of the code, what must be externalized and checkable so that a reader with no memory can ratify correctness without reading the implementation? The property sought is *derivability*; the reader is the "stateless reader".

## What is claimed, on what evidence

Status uses the **logbook tier** (A registered externally before data; B in-repo tag pushed before data; C design text before data, or none, author-attested; D demonstration or observation). No result here is tier A or B. The [white paper and Compendium](/docs/white-paper/GenerativeSpecification_WhitePaper.html#5-evidence) use a different A to D scale that grades study design, so a letter means different things in the two documents. Statuses come from the [logbook index](/research/logbook/) (a working copy) and the corrected white paper.

| Claim | Status (logbook tier) | Where |
|---|---|---|
| A disciplined specification beats a naive prompt on structural metrics (layer violations, duplication, complexity), across three model vendors | **SUPPORTED as mechanism**, tier C. The best-supported effect. The layer metric is targeted by the treatment | AX-K5, AX2 · [AX2 results](/experiments/ax2/RESULTS.html) · [WP 5.2](/docs/white-paper/GenerativeSpecification_WhitePaper.html#52-controlled-experiments-testing) |
| A routed navigation file (the sentinel) lowers a reader's search and read cost | **SUPPORTED for read cost only**, tier C. Small scale; SX is n=2 and a demonstration; structure alone was a **null** in TX; KX accuracy was an invalid design | TX, SX, KX · [SX results](/experiments/sx/RESULTS.html) · [KX results](/experiments/kx/RESULTS.html) |
| A good expert prompt does as well as the specification in single-shot generation | **Tie, but the design could not separate them** (ceiling or saturation): not evidence that the specification adds over an expert prompt | AX, AX2 · [WP 5.4](/docs/white-paper/GenerativeSpecification_WhitePaper.html#54-what-the-expert-prompt-tie-does-and-does-not-test) |
| The seven-property rubric ranks projects in agreement with static analysis | **INCONCLUSIVE**, tier C (three repositories, circular for one) | BX · [BX](/experiments/bx/) |
| Derivation from a specification works end to end (104 tests regenerated; a compiler derived from a formal spec) | **DEMONSTRATION**, tier D. Existence proofs, not effects | RX, ALX · [RX](/experiments/rx/) |
| Benefit shrinks as model capability grows | **INCONCLUSIVE**, direction as predicted, tier C | CR · [CR results](/experiments/cr/RESULTS-final.html) |

Nine of the fifteen closed experiments carry an INVALID-DESIGN label on at least one question: the experiment could not have answered it. That is a statement about the experiments, not about the ideas.

## Hypotheses under test: not results

These are the author's working hypotheses. None has been tested by a registered experiment. The value claims that motivate them (that such a substrate lifts every practitioner, that it is worth paying for) are unmeasured motivation, not findings.

| Hypothesis | Could be falsified by | Planned test |
|---|---|---|
| **H-floor.** The substrate raises the quality floor independently of the practitioner's expertise | Practitioners of different expertise, with and without the substrate, showing the same spread in hidden-test correctness | No design yet; SDX-1 uses one externally authored expert prompt, not a range of practitioners |
| **H-context.** A map such as the sentinel prevents context degradation and search spend as a project grows | No difference in search tokens or accuracy between mapped and unmapped repositories once the project exceeds what a fresh session reads | Scale-threshold study, proposed (backlog B6); TX null stands until then |
| **H-phase.** Without phase collapse (executing and verifying behavior outside the test environment, "in the open field") one cannot know the code works as intended | Verification inside the test environment alone catching the same seeded defects as open-field execution | No design yet |
| **H-gov.** Different memoryless actors can keep a project clean as it grows and report what happened at any moment | Stateless judges reconstructing decisions and finding injected defects no better with the substrate than with a decision log | SDX-3, proposed |

The main designed test is **SDX-1**: does a persistent, structured, enforced substrate add correctness on a growing project over an expert prompt that contains none of five listed load-bearing elements, with an external practitioner writing that prompt? It is a draft, not frozen, and has not run. Its own pre-stated estimate puts the likely gap near the smallest effect it can resolve; one outcome it registers is that the substrate's value is governance, not correctness.

## Methods discipline, and limits

From SDX-0 onward every experiment is preregistered under a [written protocol](https://github.com/jghiringhelli/generative-specification/blob/main/docs/experiments/EXPERIMENT-PROTOCOL.md) (tag, then an external record on OSF with a Zenodo mirror). Wrong-design results count and are logged in the same voice as the others. Critics come from other vendors, and the expert prompt is written by someone outside the project.

Limits and threats:

- One author designed the method, wrote the specifications, ran every experiment and scored the results.
- Earlier runs are not verifiably preregistered. Their records are author-attested; commit dates are author-controlled.
- Early runs used a benchmark the models have probably seen in training.
- The "blind" auditors were one model, run twice.
- Results are mostly one model family and small samples.
- Nothing is peer reviewed. Field observations from practitioners are anecdotal.

## Replicate it

Experiments, runners and oracles are public under [`experiments/`](https://github.com/jghiringhelli/generative-specification/tree/main/experiments) (for example `ax2`, `sx`, `kx`, `cr`, `nx`, `rx`), with the [replication guide](/docs/white-paper/EXPERIMENT-PUBLISHING-PLAYBOOK.html), the [experiment ledger](/docs/white-paper/EXPERIMENT-LEDGER.html), the [logbook index](/research/logbook/) and the protocol. Independent replicators, including those who expect a null, are invited to open an issue in the [GitHub repository](https://github.com/jghiringhelli/generative-specification/issues). Credit is intended and co-authorship criteria are to be agreed; nothing more is promised here.

## Publications and how to cite

There is no peer-reviewed publication yet. The [Zenodo preprint](https://doi.org/10.5281/zenodo.21726017) (July 2026) is an archived snapshot that predates the corrections described above. A revised base paper is in preparation; no venue is promised.

```
Ghiringhelli, J. C. (2026). Generative Specification: A Discipline of
Derivability for the Stateless Reader. Zenodo (preprint).
https://doi.org/10.5281/zenodo.21726017
```

Machine-readable: [`CITATION.cff`](https://github.com/jghiringhelli/generative-specification/blob/main/CITATION.cff).

## About the author

J.C. Ghiringhelli is an independent researcher and software engineer. He holds a degree in Computer Engineering (Universidad de la Rep&uacute;blica, Uruguay) and a Master's in Data Science (Universitat Oberta de Catalunya).
