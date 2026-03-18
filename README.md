# Generative Specification

**Community home for the Generative Specification methodology** — the first programming discipline of the pragmatic dimension, designed for a stateless reader.

→ [White Paper](https://doi.org/10.5281/zenodo.19073543) · [genspec.dev](https://genspec.dev)
→ [Ambient Engineer — articles and essays](https://ambientengineer.substack.com)
→ [Experiment Supplement](docs/white-paper/GS_Experiment_Supplement.md)
→ [Practitioner Protocol](docs/white-paper/GenerativeSpecification_PractitionerProtocol.md)

---

## What Is Here

### Experiments

| Experiment | Description | Status |
|---|---|---|
| [**AX**](experiments/ax/) | Multi-agent adversarial study. Naive to expert prompting to treatment v1-v5 with ForgeCraft. Establishes quality gradient as a function of specification completeness under controlled conditions. Seven conditions. RealWorld Conduit API benchmark. | ✅ Complete |
| [**RX**](experiments/rx/) | Replication Experiment. Independent verification: given the committed GS document, any developer with Docker and an Anthropic API key can reproduce 104 passing tests against a live PostgreSQL instance. | ✅ Complete |
| [**DX**](experiments/dx/) | Human practitioner study. 40 developers. Group A: prompt-driven. Group B: GS + ForgeCraft. Dual rubric. April 2026. | 🔵 April 2026 |

---

### Quality Gates

The [`quality-gates/`](quality-gates/) directory is a community-maintained library of structured quality constraints, each mapped to one of the seven GS properties. Anyone can propose a gate via pull request.

→ [How to contribute a quality gate](quality-gates/CONTRIBUTING.md) · [Gate schema](quality-gates/schema.yaml)

#### Current Gate Library (17 gates)

| Gate | GS Property | Tags | Phase | Trigger |
|---|---|---|---|---|
| [typescript-strict-mode](quality-gates/gates/typescript-strict-mode.yaml) | Self-describing | typescript | development | commit |
| [no-any-type](quality-gates/gates/no-any-type.yaml) | Self-describing | typescript | development | commit |
| [file-length-max-300](quality-gates/gates/file-length-max-300.yaml) | Self-describing | any | development | commit |
| [function-length-max-50](quality-gates/gates/function-length-max-50.yaml) | Self-describing | any | development | commit |
| [jsdoc-public-functions](quality-gates/gates/jsdoc-public-functions.yaml) | Self-describing | javascript, typescript | development | commit |
| [max-function-parameters](quality-gates/gates/max-function-parameters.yaml) | Self-describing | any | development | commit |
| [no-direct-db-in-routes](quality-gates/gates/no-direct-db-in-routes.yaml) | Bounded | any | development | commit |
| [no-circular-dependencies](quality-gates/gates/no-circular-dependencies.yaml) | Composable | any | development | commit |
| [coverage-threshold-80](quality-gates/gates/coverage-threshold-80.yaml) | Verifiable | javascript, typescript, jest | development | pr |
| [jest-no-failed-tests](quality-gates/gates/jest-no-failed-tests.yaml) | Verifiable | javascript, typescript, jest | development | pr |
| [mutation-score-threshold](quality-gates/gates/mutation-score-threshold.yaml) | Verifiable | javascript, typescript | development | pr |
| [tsc-no-emit-exits-zero](quality-gates/gates/tsc-no-emit-exits-zero.yaml) | Verifiable | typescript | development | pr |
| [no-hardcoded-secrets](quality-gates/gates/no-hardcoded-secrets.yaml) | Defended | any | development | commit |
| [npm-audit-no-high-cve](quality-gates/gates/npm-audit-no-high-cve.yaml) | Defended | javascript, typescript | development | pr |
| [no-console-log-production](quality-gates/gates/no-console-log-production.yaml) | Executable | any | staging | pr |
| [adr-files-emitted](quality-gates/gates/adr-files-emitted.yaml) | Auditable | any | development | pr |
| [conventional-commits](quality-gates/gates/conventional-commits.yaml) | Auditable | any | development | commit |

**The Composable and Executable properties are underrepresented — they are the highest-value contribution targets.** See [CONTRIBUTING.md](quality-gates/CONTRIBUTING.md) for the schema and submission process.

---

### White Paper

The published preprint is at [doi.org/10.5281/zenodo.19073543](https://doi.org/10.5281/zenodo.19073543). The source and ancillary files are in [`docs/white-paper/`](docs/white-paper/). Community review is open — see [REVIEWING.md](docs/white-paper/REVIEWING.md) for how to challenge a claim, propose a correction, or map an issue to a section.

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

The GS document (`experiments/rx/spec/conduit-gs.md`) is committed verbatim. ForgeCraft produced it, but you do not need ForgeCraft to run this experiment. The document is the reproducible artifact.

### AX (verify from committed evidence)

The pre-run evidence (scores, evaluation transcripts, session logs) is in `experiments/ax/`. The pre-registration commit timestamps prove rubric and design were locked before any experimental run. Clone the repository and inspect the commit history.

---

## ForgeCraft

[ForgeCraft](https://github.com/jghiringhelli/forgecraft-mcp) is the tool that implements the GS methodology. It reads from this repository's `quality-gates/` library.

**Free tier: 2 active projects.** A merged quality gate PR earns an additional project slot.

```bash
npx forgecraft-mcp setup .
```

---

## Community Convergence

The structural argument developed in §10 of the white paper: when a practitioner community contributes to a shared GS methodology under quality gates, the specification floor across all governed domains rises monotonically and cannot retreat while quality gates hold. That argument applies to this repository. The quality gate library improves with every accepted contribution. ForgeCraft inherits the improvement. Projects governed by ForgeCraft inherit it in turn.

---

## Citation

```
Ghiringhelli, J. C. (2026). Generative Specification: A Pragmatic Programming Paradigm
for the Stateless Reader (1.0). Zenodo. https://doi.org/10.5281/zenodo.19073543
```

Contact: jcghiri@gmail.com · [linkedin.com/in/jghiringhelli](https://linkedin.com/in/jghiringhelli) · [genspec.dev](https://genspec.dev) · [ambientengineer.substack.com](https://ambientengineer.substack.com)