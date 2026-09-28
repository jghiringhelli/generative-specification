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
| [**CX**](experiments/cx/) | Patchability: a GS-specified codebase resolves 5/5 patch tasks vs. 1/5 for the reference | Complete |
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
| [Quality Gates](quality-gates/) | 32-gate community library, contribute via PR |
| [Workflow Recipes](docs/recipes/) | Step-by-step guides for the practitioner scenarios |
| [Domain Guides](domains/) | FINTECH · ML · GAME · Creative · CLI |
| [ForgeCraft](https://github.com/jghiringhelli/forgecraft-mcp) | The open tool that implements the method |
| [Essays](https://ambientengineer.dev) | Ambient Engineer, the long-form writing |

---

## Quality Gates

The [`quality-gates/`](quality-gates/) directory is a community-maintained library of structured quality constraints, each mapped to one of the seven GS properties. Anyone can propose a gate via pull request.

- [How to contribute a quality gate](quality-gates/CONTRIBUTING.md)
- [Gate schema](quality-gates/schema.yaml)

<!-- GATES_TABLE_START -->

### Current Gate Library (32 gates)

| Gate | Description | GS Property | Tags | Phase | Trigger |
|---|---|---|---|---|---|
| [internal-consistency](quality-gates/gates/internal-consistency.yaml) | No two claims in the paper may be logically incompatible. | Self-describing | academic-paper | staging | pr |
| [jsdoc-public-functions](quality-gates/gates/jsdoc-public-functions.yaml) | Every public function and method has a JSDoc comment with a description, typed @param tags, and a @returns tag. | Self-describing | typescript, javascript | development | pr |
| [readme-setup-section](quality-gates/gates/readme-setup-section.yaml) | The repository README includes a Setup or Getting Started section with runnable commands. | Self-describing | any | development | pr |
| [register-consistency](quality-gates/gates/register-consistency.yaml) | Disclaimers on theoretical frames must be honored throughout. | Self-describing | academic-paper | staging | pr |
| [vocabulary-stability](quality-gates/gates/vocabulary-stability.yaml) | Every technical term introduced with a definition must be used with that definition throughout. | Self-describing | academic-paper | staging | pr |
| [claim-scope-calibration](quality-gates/gates/claim-scope-calibration.yaml) | Every claim must be supported by evidence of equivalent scope. | Bounded | academic-paper | staging | pr |
| [file-length-max-300](quality-gates/gates/file-length-max-300.yaml) | No TypeScript or JavaScript source file exceeds 300 lines. | Bounded | javascript, typescript | commit | pre-commit |
| [function-length-max-50](quality-gates/gates/function-length-max-50.yaml) | No function or method body exceeds 50 lines. | Bounded | javascript, typescript | pr | pull_request |
| [max-function-parameters](quality-gates/gates/max-function-parameters.yaml) | No function accepts more than 5 positional parameters. | Bounded | javascript, typescript | pr | pull_request |
| [no-any-type](quality-gates/gates/no-any-type.yaml) | No explicit `: any` type annotations in non-test TypeScript source. | Bounded | typescript | commit | pre-commit |
| [no-direct-db-in-routes](quality-gates/gates/no-direct-db-in-routes.yaml) | Route handlers do not import database clients directly. | Bounded | node, typescript, api | development | commit |
| [coverage-threshold-80](quality-gates/gates/coverage-threshold-80.yaml) | Test line coverage is at or above 80%. | Verifiable | javascript, typescript | development | pr |
| [experimental-design-standards](quality-gates/gates/experimental-design-standards.yaml) | Experimental results sections must state: pre-registration status, N per condition, evaluator independence, statistical inference basis. | Verifiable | academic-paper | staging | pr |
| [mutation-score-threshold](quality-gates/gates/mutation-score-threshold.yaml) | Stryker mutation score ≥65% project-wide, ≥70% on changed files. | Verifiable | javascript, typescript | pr | pull_request |
| [notation-audit](quality-gates/gates/notation-audit.yaml) | Formulas must be derived, cited, or labeled as theoretical. No false precision. | Verifiable | academic-paper | staging | pr |
| [environment-variables-config](quality-gates/gates/environment-variables-config.yaml) | All environment-specific config is read from env vars or config files. | Defended | any | development | commit |
| [no-hardcoded-secrets](quality-gates/gates/no-hardcoded-secrets.yaml) | No credentials or secrets as literal values in source files. | Defended | any | development | commit |
| [npm-audit-no-high-cve](quality-gates/gates/npm-audit-no-high-cve.yaml) | `npm audit --audit-level=high` exits 0. | Defended | node, npm, typescript | development | commit |
| [adr-files-emitted](quality-gates/gates/adr-files-emitted.yaml) | Every referenced ADR must exist as a committed file with substantive content. | Auditable | any | development | pr |
| [conflict-of-interest-disclosure](quality-gates/gates/conflict-of-interest-disclosure.yaml) | Material relationships must be disclosed near the abstract. | Auditable | academic-paper | staging | pr |
| [conventional-commits](quality-gates/gates/conventional-commits.yaml) | Commit messages follow `type(scope): description` format. | Auditable | any | development | commit |
| [no-circular-dependencies](quality-gates/gates/no-circular-dependencies.yaml) | The module dependency graph is acyclic. | Composable | any | development | commit |
| [docker-compose-defined](quality-gates/gates/docker-compose-defined.yaml) | A `docker-compose.yml` exists at the repository root. | Executable | any | development | pr |
| [jest-no-failed-tests](quality-gates/gates/jest-no-failed-tests.yaml) | `jest --json` exits with `numFailedTests === 0`. | Executable | javascript, typescript | development | commit |
| [no-console-log-production](quality-gates/gates/no-console-log-production.yaml) | No `console.log/warn/error` in production source files. | Executable | javascript, typescript | commit | pre-commit |
| [no-localhost-hardcoded](quality-gates/gates/no-localhost-hardcoded.yaml) | No `localhost` or `127.0.0.1` as string literals in application source. | Executable | any | development | commit |
| [tsc-no-emit-exits-zero](quality-gates/gates/tsc-no-emit-exits-zero.yaml) | `tsc --noEmit` exits 0 on every commit. | Executable | typescript | development | commit |
| [typescript-strict-mode](quality-gates/gates/typescript-strict-mode.yaml) | `tsconfig.json` has `compilerOptions.strict: true`. | Executable | typescript | commit | pre-commit |
| [docker-service-boundaries](quality-gates/gates/docker-service-boundaries.yaml) | Each app service in `docker-compose.yml` references an explicitly named database service. | — | — | — | — |
| [extension-manifest-committed](quality-gates/gates/extension-manifest-committed.yaml) | `.vscode/extensions.json` must exist and be committed. | — | — | — | — |
| [python-dependencies-pinned](quality-gates/gates/python-dependencies-pinned.yaml) | Python projects must have a locked dependency file with pinned versions. | — | — | — | — |
| [runtime-version-pinned](quality-gates/gates/runtime-version-pinned.yaml) | A runtime version pin file must exist (`.nvmrc`, `.python-version`, `.tool-versions`). | — | — | — | — |

*Underrepresented properties (highest-value contribution targets): **Composable**.*

<!-- GATES_TABLE_END -->

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
