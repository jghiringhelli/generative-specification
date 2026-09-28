---
layout: default
title: Home
nav_order: 1
description: "The open home of Generative Specification: the method, the papers, the formulas, the experiments, the course."
permalink: /
---

# Generative Specification

**The method for software you can ratify without reading the implementation.** Write the specification as a contract, derive the code from it, and keep the guarantee outside the model: external, non-LLM checks plus a spec that can regenerate the rest. This site is the open home of the method: the papers, the formulas, the experiments, the course, and the tools.

[Read the paper (v4.0)](https://doi.org/10.5281/zenodo.21726017){: .btn .btn-primary .mr-2 }
[The paper tree](#the-papers){: .btn .mr-2 }
[Take the course](https://pragmaworks.dev/course){: .btn }

> **Using this in a company?** Governance, assurance and due diligence built on this method live at [pragmaworks.dev](https://pragmaworks.dev). Here is the method itself, open.

---

## The core in five lines

1. **Derivability.** The reader of the code is stateless. If the correctness of a program can't be ratified from its spec, contracts and trace, it can't be governed.
2. **The substrate.** The spec (a contract root plus a cascade of derived documents), the **sentinel** that routes the assistant to them, hooks and gates, and verification. This is what you build. The *harness* is only the verification and enforcement layer of it.
3. **Three load-bearing mechanisms.** The **bridge** between human language and code (with its read/write asymmetry). The **sentinel**, which bounds context. **Phase collapse**, where spec, design and code stop being separate phases.
4. **The rubric.** Seven properties that make a project derivable. An instrument for measuring the substrate, not a mechanism.
5. **An honest bound.** The value of the scaffolding is capacity-relative: highest where the model is weak, receding as it strengthens. What endures is the guarantee kept outside the model.

---

## The papers

One base, focused derivatives, and one superset that holds everything. Each paper carries one claim; a claim lives in exactly one paper. The full plan, with what each paper says and does not say, is in the [paper tree](https://github.com/jghiringhelli/generative-specification/blob/main/docs/white-paper/PAPER-TREE.md).

| Paper | Focus | Status |
|---|---|---|
| **Base**: *Derivable Correctness* | The stateless-reader discipline, the substrate, bridge / sentinel / phase collapse, the seven-property rubric, honest capacity-relative bounds | [Preprint v4.0 (Zenodo)](https://doi.org/10.5281/zenodo.21726017) · revised base in preparation |
| **D1**: *The Externalized Guarantee* | What endures under strong models: the check that lives outside the model | Planned · gated on a pre-registered experiment |
| **D2**: *Cheap Rigor* | Why cheap execution revives validated-but-abandoned disciplines, and when (a capacity-gated model) | Planned · [pre-registered design](https://github.com/jghiringhelli/generative-specification/blob/main/experiments/revival/PREREGISTRATION.md) |
| **D3**: *The Pragmatic Tier* | A semiotic placement for AI-era programming discipline (position paper) | Planned |
| **[Compendium](docs/white-paper/GenerativeSpecification_Compendium.html)** | The coherent superset every paper is cut from. Not a submission | [PDF](docs/white-paper/GenerativeSpecification_Compendium.pdf) |

Companions: [Field Guide](docs/white-paper/GenerativeSpecification_FieldGuide.pdf) · [Practitioner Protocol](docs/white-paper/GenerativeSpecification_PractitionerProtocol.pdf) · [Rubric scoring guide](docs/white-paper/GS_Rubric_ScoringGuide.pdf) · [Experiment supplement](docs/white-paper/GS_Experiment_Supplement.pdf) · [Experiment ledger](docs/white-paper/EXPERIMENT-LEDGER.md)

---

## The formulas

Stated with the status each one has earned, no more.

| Formula | Reads as | Status |
|---|---|---|
| I ∝ (1 − S) / S | Expected correction cycles I grow as the specification S leaves more of the output space open | A **mental model**: direction only, no constant, no proof. Directionally supported by the AX series; a cross-practitioner test is future work |
| w = λ · κ | The expected cost a project carries from a failure family: exposure λ times cost κ | The **revival model**. λ is measured by detectors and is conditioned on the model and the task, not only the project. Being tested by the pre-registered revival program |
| benefit = coverage · λ | A practice pays off only where it both catches the failure (coverage) and the failure occurs (exposure) | **Revival is exposure-gated, not cost-gated.** Supported by NX; predicted, per practice, by the pre-registered grid |
| cost per correct output | Tokens spent divided by outputs that pass verification | A **metric**, not a law. The right denominator for the token-cost objection |

Full derivations and caveats: [Compendium](docs/white-paper/GenerativeSpecification_Compendium.html) and the [revival model](docs/discipline-revival-model.md).

---

## The evidence

Every experiment is committed with its pre-registration timestamp and raw evidence, so a reader can verify rather than trust. The [experiment ledger](docs/white-paper/EXPERIMENT-LEDGER.md) is the index.

| Experiment | What it tests | Status |
|---|---|---|
| [**AX**](experiments/ax/) | Specification completeness vs. structural quality, eight conditions on the RealWorld Conduit benchmark | Complete |
| [**BX**](experiments/bx/) | Author-independence of the rubric: three implementations scored blind | Complete |
| [**CX**](experiments/cx/) | Patchability: a GS-specified and a non-GS codebase both resolve 5/5 patch tasks. No pass-rate advantage; the difference is where the patches land (the architecture directed each one to the right layer) | Complete |
| [**RX**](experiments/rx/) | Reproducibility: anyone with Docker and an API key can reproduce 104 passing tests | Complete |
| **KX · SX · TX · EX · ALX** | Sentinel and retrieval economics · navigation vs. bounding · the bridge · production · the formal tier | Complete or reported in the Compendium |
| **MX · RND-1 · NX · CR** | Model-agnosticism · prescriptive specs · N-version revival · capacity-relative datum | Pilots |
| [**Revival grid**](experiments/revival/) | The capacity-gated revival model, pre-registered before any generation | Design frozen, running next |

**Replicate us.** The experiments are proponent-authored. That is a limitation, and the reason each one is published as a pre-registered artifact you can re-run. See the [publishing playbook](docs/white-paper/EXPERIMENT-PUBLISHING-PLAYBOOK.md). Independent replications, including null results, are welcome by pull request.

---

## The course

**GS Core**: theory intercut with five hands-on labs. You finish with a small project running under the method: a spec written before the code, a sentinel that routes, a gate that stops the build, and the rubric applied.

[Start the course](https://pragmaworks.dev/course){: .btn .btn-primary .mr-2 }
[Field testimonials (video)](https://www.youtube.com/playlist?list=PLFeJjg91nGzg){: .btn }

The video lessons are being published; the course page tracks them.

---

## Also here

| Section | Contents |
|---|---|
| [The Method](method/) | The rubric, spec completeness, quality gates, the evidence, the course |
| [Gate library](quality-gates/) | Community gate library, contribute via PR |
| [Workflow Recipes](docs/recipes/) | Step-by-step guides for the practitioner scenarios |
| [Domain Guides](domains/) | FINTECH · ML · GAME · Creative · CLI |
| [ForgeCraft](https://github.com/jghiringhelli/forgecraft-mcp) | The open tool that implements the method |
| [Essays](https://ambientengineer.dev) | Ambient Engineer, the long-form writing |

---

## Quality Gates

The [`quality-gates/`](quality-gates/) directory is a community-maintained library of structured quality constraints, each mapped to one of the seven GS properties. Anyone can propose a gate via pull request.

- [How to contribute a quality gate](quality-gates/CONTRIBUTING.md)
- [Gate schema](quality-gates/schema.yaml)

The full, always-current list is on the [gate library page](quality-gates/).

See [CONTRIBUTING.md](quality-gates/CONTRIBUTING.md) for the schema and submission process.

---

## Production Evidence Repositories

| Repository | Description | Role in Paper |
|---|---|---|
| [**brad-gs-build**](https://github.com/jghiringhelli/brad-gs-build) | BRAD legal intelligence engine. 37 commits, Feb 27–Mar 4. Built from scratch under GS methodology. | Case study §4.1 |
| [**scp-gs-experiment**](https://github.com/jghiringhelli/scp-gs-experiment) | SafetyCore Pro quality gate pass. 4 experiment commits, Mar 16–18. | Adversarial experiment §5 |

Commit timestamps are cryptographically signed by GitHub. BRAD shows the full build arc from initial commit to production-grade application in 6 days.

---

## Reproducing the Experiments

### RX (any reader can reproduce)

Requirements: Docker, Node.js 20+, Anthropic API key.

```bash
git clone https://github.com/jghiringhelli/generative-specification
cd generative-specification/experiments/rx
docker compose up -d postgres
./runner/run.sh
cat evidence/jest-output.json   # verify: numFailedTests === 0
```

### AX (verify from committed evidence)

The pre-run evidence (scores, evaluation transcripts, session logs) is in `experiments/ax/`. Pre-registration commit timestamps prove the rubric was locked before any experimental run.

---

## ForgeCraft

[ForgeCraft](https://github.com/jghiringhelli/forgecraft-mcp) is the tool that implements the GS methodology. It reads from this repository's `quality-gates/` library.

**Free tier: 2 active projects.** A merged quality gate PR earns an additional project slot.

Access via the ForgeCraft service at [forgecraft.dev](https://forgecraft.dev) — API key required.

---

## Community Convergence

When a practitioner community contributes to a shared GS methodology under quality gates, the specification floor across all governed domains rises monotonically and cannot retreat while quality gates hold (§10 of the white paper). The quality gate library improves with every accepted contribution. ForgeCraft inherits the improvement. Projects governed by ForgeCraft inherit it in turn.

---

## Citation

```
Ghiringhelli, J. C. (2026). Generative Specification: A Discipline of Derivability
for the Stateless Reader (4.0). Zenodo. https://doi.org/10.5281/zenodo.21726017
```

Contact: [juan@pragmaworks.dev](mailto:juan@pragmaworks.dev) · [LinkedIn](https://linkedin.com/in/jghiringhelli) · [genspec.dev](https://genspec.dev) · [Ambient Engineer](https://ambientengineer.substack.com)
