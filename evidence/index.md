---
layout: default
title: Evidence and papers
nav_order: 9
has_children: true
permalink: /evidence/
description: "The papers, the experiments and the raw evidence behind Generative Specification, each with its bound. Proponent-authored, small, and published so a reader can re-run them."
---

# Evidence and papers

The academic side of the method: the papers, the experiments and the evidence behind the claims. It is here for readers who want to check the work. If you want to learn the method, start with [Learn](/learn/).

**Read the bounds as part of the findings.** Every experiment is proponent-authored, small, and mostly run on one benchmark. That is a limitation, and the reason each one is published as an artifact you can re-run. The [evidence page](/method/evidence/) states each finding with its bound.

## The papers

The paper is being split into one base paper and focused derivatives, because one document was carrying too much. Each paper carries one claim, and a claim lives in exactly one paper. The [paper tree](/docs/white-paper/PAPER-TREE.html) says what each paper will and will not say.

| Paper | Focus | Status |
|---|---|---|
| **Base**: *Derivable Correctness* | The stateless-reader discipline, the substrate, bridge / sentinel / phase collapse, the seven-property rubric, honest capacity-relative bounds | Archived preprint on [Zenodo](https://doi.org/10.5281/zenodo.21726017) (July 2026) · revised base in preparation |
| **D1**: *The Externalized Guarantee* | What endures under strong models: the check that lives outside the model | Planned · gated on a pre-registered experiment |
| **D2**: *Cheap Rigor* | Why cheap execution revives validated-but-abandoned disciplines, and when | Planned · [pre-registered design](https://github.com/jghiringhelli/generative-specification/blob/main/experiments/revival/PREREGISTRATION.md) |
| **D3**: *The Pragmatic Tier* | A semiotic placement for AI-era programming discipline (position paper) | Planned |
| **[Compendium](/docs/white-paper/GenerativeSpecification_Compendium.html)** | The coherent superset every paper is cut from. Not a submission | [PDF](/docs/white-paper/GenerativeSpecification_Compendium.pdf) |

**About the Zenodo record.** It is an archived preprint from July 2026, kept as a citable snapshot. It is not the revised base paper. The [white paper working text](/docs/white-paper/GenerativeSpecification_WhitePaper.html) on this site is a long-form draft and is not a published release.

Companions: [Field guide](/docs/white-paper/GenerativeSpecification_FieldGuide.pdf) · [Practitioner protocol](/docs/white-paper/GenerativeSpecification_PractitionerProtocol.pdf) · [Rubric scoring guide](/docs/white-paper/GS_Rubric_ScoringGuide.pdf) · [Experiment supplement](/docs/white-paper/GS_Experiment_Supplement.pdf) · [Experiment ledger](/docs/white-paper/EXPERIMENT-LEDGER.html)

## The experiments

Every experiment is committed with its pre-registration timestamp and raw evidence, so a reader can verify rather than trust. The [experiment ledger](/docs/white-paper/EXPERIMENT-LEDGER.html) is the index and the [experiments page](/experiments/) lists each one.

| Experiment | What it tests | Status |
|---|---|---|
| [**AX**](/experiments/ax/) | Specification completeness vs. structural quality, eight conditions on the RealWorld Conduit benchmark | Complete |
| [**BX**](/experiments/bx/) | Author-independence of the rubric: three implementations scored blind | Complete |
| [**CX**](/experiments/cx/) | Patchability: a GS-specified and a non-GS codebase both resolve 5/5 patch tasks. No pass-rate advantage; the difference is where the patches land (the architecture directed each one to the right layer) | Complete |
| [**RX**](/experiments/rx/) | Reproducibility: anyone with Docker and an API key can reproduce 104 passing tests | Complete |
| **KX · SX · TX · EX · ALX** | Sentinel and retrieval economics · navigation vs. bounding · the bridge · production · the formal tier | Complete or reported in the Compendium |
| **MX · RND-1 · NX · CR** | Model-agnosticism · prescriptive specs · N-version revival · capacity-relative datum | Pilots |
| [**Revival grid**](https://github.com/jghiringhelli/generative-specification/tree/main/experiments/revival) | The capacity-gated revival model, pre-registered before any generation | Design frozen, running next |

**Replicate us.** The experiments are proponent-authored. That is a limitation, and the reason each one is published as a pre-registered artifact you can re-run. See [how to replicate an experiment](/docs/white-paper/EXPERIMENT-PUBLISHING-PLAYBOOK.html). Independent replications, including null results, are welcome by pull request.

### Reproduce RX

Requirements: Docker, Node.js 20+, an Anthropic API key.

```bash
git clone https://github.com/jghiringhelli/generative-specification
cd generative-specification/experiments/rx
docker compose up -d postgres
./runner/run.sh
cat evidence/jest-output.json   # verify: numFailedTests === 0
```

### Verify AX from committed evidence

The pre-run evidence (scores, evaluation transcripts, session logs) is in `experiments/ax/`. Pre-registration commit timestamps show the rubric was locked before any experimental run.

## Production evidence repositories

| Repository | Description | Role in the papers |
|---|---|---|
| [**brad-gs-build**](https://github.com/jghiringhelli/brad-gs-build) | BRAD legal intelligence engine. 37 commits, Feb 27–Mar 4. Built from scratch under the method. | Case study |
| [**scp-gs-experiment**](https://github.com/jghiringhelli/scp-gs-experiment) | SafetyCore Pro quality gate pass. 4 experiment commits, Mar 16–18. | Adversarial experiment |

Commit timestamps are signed by GitHub.

## Models and equations

The models and equations have their own section, with the status each has earned: [Models and equations](/formulas/).
