# Generative Specification

Community home for the Generative Specification methodology — the first programming discipline of the pragmatic dimension, designed for a stateless reader.

- [White Paper (PDF)](docs/white-paper/GenerativeSpecification_WhitePaper.pdf) · [Zenodo preprint](https://doi.org/10.5281/zenodo.19073543)
- [Ambient Engineer — articles and essays](https://ambientengineer.substack.com)
- [Experiment Supplement](docs/white-paper/GS_Experiment_Supplement.md)
- [Practitioner Protocol](docs/white-paper/GenerativeSpecification_PractitionerProtocol.md)

---

## Repository Structure

```
docs/
  white-paper/          Primary research documents
                          GenerativeSpecification_WhitePaper.md   — source (Markdown)
                          GenerativeSpecification_WhitePaper.pdf  — current release build
                          GS_Experiment_Supplement.md             — extended experiment data
                          GenerativeSpecification_PractitionerProtocol.md — how-to guide
                          REVIEWING.md                            — how to challenge a claim
  recipes/              Step-by-step guides for common GS scenarios
                          (brownfield, greenfield, migration, bug-fix, takeover, hardening)
  templates/            Reusable specification artifacts
                          project-constitution.md, module-constraints.md, workspace-claude.md

experiments/
  ax/                   Multi-agent adversarial study (eight conditions, AX series)
    notes/              Raw source notes and data used to write the paper
    naive/              Condition 1: no specification, no tooling
    control/            Condition 2: competent prompting, no GS
    treatment/          Condition 3: GS v1 (ForgeCraft treatment)
    treatment-v2..v6/   Conditions 4–8: incremental GS improvements
    realworld-spec/     RealWorld Conduit API spec (hurl files)
    EXTERNAL_ANALYSIS.md  Independent external tool validation across all 8 conditions
    RESULTS.md          Scored results table
  dx/                   Human practitioner study (April 2026)
    pilot/              Self-administered calibration run (6 conditions, 2 repos)
    scoring/            Automated scoring script (score-fork.js)
    workshops/          Workshop repo links and participant materials
    design.md           Study design and rubric
  rx/                   Replication experiment — any reader can reproduce
    spec/               The committed GS document (conduit-gs.md)
    runner/             run.sh / run.ps1 — clone, install, run
    evidence/           Pre-committed output (jest-output.json, build logs)
    score/              Rubric and scoring logic

quality-gates/          Community-maintained gate library
  gates/                One YAML file per gate, mapped to a GS property
  schema.yaml           Gate definition schema
  CONTRIBUTING.md       How to propose a new gate

domains/                Domain-specific GS guidance (CLI, fintech, game, ML, creative)
scripts/                Repository utilities
  generate-gates-table.py  Reads quality-gates/gates/*.yaml, regenerates README table
```

---

## What Is Here

### Experiments

| Experiment | Description | Status |
|---|---|---|
| [**AX**](experiments/ax/) | Multi-agent adversarial study. Naive to expert prompting to treatment v1–v6 with ForgeCraft. Establishes quality gradient as a function of specification completeness under controlled conditions. Eight conditions. RealWorld Conduit API benchmark. | Complete |
| [**RX**](experiments/rx/) | Replication Experiment. Independent verification: given the committed GS document, any developer with Docker and an Anthropic API key can reproduce 104 passing tests against a live PostgreSQL instance. | Complete |
| [**DX**](experiments/dx/) | Human practitioner study. 40 developers. Group A: prompt-driven. Group B: GS + ForgeCraft. Dual rubric. April 2026. | April 2026 |

---

### Quality Gates

The [`quality-gates/`](quality-gates/) directory is a community-maintained library of structured quality constraints, each mapped to one of the seven GS properties. Anyone can propose a gate via pull request.

- [How to contribute a quality gate](quality-gates/CONTRIBUTING.md)
- [Gate schema](quality-gates/schema.yaml)

<!-- GATES_TABLE_START -->

#### Current Gate Library (32 gates)

| Gate | Description | GS Property | Tags | Phase | Trigger |
|---|---|---|---|---|---|
| [internal-consistency](quality-gates/gates/internal-consistency.yaml) | No two claims in the paper may be logically incompatible. | Self-describing | academic-paper | staging | pr |
| [jsdoc-public-functions](quality-gates/gates/jsdoc-public-functions.yaml) | Every public function and method has a JSDoc comment with a description, typed @param tags, and a @returns tag. | Self-describing | typescript, javascript | development | pr |
| [readme-setup-section](quality-gates/gates/readme-setup-section.yaml) | The repository README includes a Setup or Getting Started section containing at least one fenced code block with runnable commands sufficient to get the project running locally. | Self-describing | any | development | pr |
| [register-consistency](quality-gates/gates/register-consistency.yaml) | If the paper disclaims a theoretical frame in its opening (e.g., "paradigm carries Martin's sense, not Kuhn's"), that disclaimer must be honored in every subsequent section. | Self-describing | academic-paper | staging | pr |
| [vocabulary-stability](quality-gates/gates/vocabulary-stability.yaml) | Every technical term introduced with a definition must be used with that definition throughout. | Self-describing | academic-paper | staging | pr |
| [claim-scope-calibration](quality-gates/gates/claim-scope-calibration.yaml) | Every claim in the paper must be supported by evidence of equivalent scope. | Bounded | academic-paper | staging | pr |
| [file-length-max-300](quality-gates/gates/file-length-max-300.yaml) | No TypeScript or JavaScript source file exceeds 300 lines. | Bounded | javascript, typescript, any | commit | pre-commit |
| [function-length-max-50](quality-gates/gates/function-length-max-50.yaml) | No function or method body exceeds 50 lines of code. | Bounded | javascript, typescript, eslint | pr | pull_request |
| [max-function-parameters](quality-gates/gates/max-function-parameters.yaml) | No function or constructor accepts more than 5 positional parameters. | Bounded | javascript, typescript, eslint | pr | pull_request |
| [no-any-type](quality-gates/gates/no-any-type.yaml) | No explicit ': any' type annotations appear in non-test TypeScript source files. | Bounded | typescript | commit | pre-commit |
| [no-direct-db-in-routes](quality-gates/gates/no-direct-db-in-routes.yaml) | Route handlers do not import or call database clients (Prisma, Sequelize, TypeORM, mongoose, raw SQL) directly. | Bounded | node, typescript, javascript, api, express, fastify | development | commit |
| [coverage-threshold-80](quality-gates/gates/coverage-threshold-80.yaml) | Test line coverage is at or above 80% for the entire project. | Verifiable | javascript, typescript, jest | development | pr |
| [experimental-design-standards](quality-gates/gates/experimental-design-standards.yaml) | Any section presenting experimental results must clearly state: (1) whether conditions were pre-registered or post-hoc; (2) N per condition; (3) whether the auditor/evaluator is independent of the treatment generator (same-family AI auditing same-family AI output is a confound that must be disclosed); (4) whether statistical inference is claimed and if so whether sample size supports it. | Verifiable | academic-paper | staging | pr |
| [mutation-score-threshold](quality-gates/gates/mutation-score-threshold.yaml) | The Stryker mutation testing score (Mutation Score Indicator) is at or above 65% for the full project, and at or above 70% for changed files on a pull request. | Verifiable | javascript, typescript, stryker, mutation-testing | pr | pull_request |
| [notation-audit](quality-gates/gates/notation-audit.yaml) | Any formula presented in mathematical notation (LaTeX, symbolic expressions) must be accompanied by either (a) a derivation, (b) a citation to a source containing the derivation, or (c) an explicit label as "proposed theoretical model, not yet empirically fitted." Specific numerical predictions derived from unfitted formulas must be removed or labeled "illustrative only." Two-decimal precision in estimates described as "order-of-magnitude" is false precision and must be rounded. | Verifiable | academic-paper | staging | pr |
| [environment-variables-config](quality-gates/gates/environment-variables-config.yaml) | All environment-specific configuration (URLs, ports, credentials, feature flags, thresholds) is read from environment variables or a config file, not hardcoded in source. | Defended | any | development | commit |
| [no-hardcoded-secrets](quality-gates/gates/no-hardcoded-secrets.yaml) | No credentials, API keys, JWT secrets, passwords, or connection strings appear as literal values in source files. | Defended | any | development | commit |
| [npm-audit-no-high-cve](quality-gates/gates/npm-audit-no-high-cve.yaml) | npm audit --audit-level=high exits 0. | Defended | node, npm, javascript, typescript | development | commit |
| [adr-files-emitted](quality-gates/gates/adr-files-emitted.yaml) | Every Architecture Decision Record referenced in the specification or README must exist as a committed file with substantive content — context, options considered, decision, and consequences. | Auditable | any | development | pr |
| [conflict-of-interest-disclosure](quality-gates/gates/conflict-of-interest-disclosure.yaml) | Any material relationship between the author and tools, products, or organizations central to the paper's claims must be disclosed in a dedicated section near the abstract ΓÇö not buried in a single sentence mid-paper. | Auditable | academic-paper | staging | pr |
| [conventional-commits](quality-gates/gates/conventional-commits.yaml) | Commit messages follow the conventional commit format: type(scope): description. | Auditable | any | development | commit |
| [no-circular-dependencies](quality-gates/gates/no-circular-dependencies.yaml) | The module dependency graph is acyclic. | Composable | any | development | commit |
| [docker-compose-defined](quality-gates/gates/docker-compose-defined.yaml) | A docker-compose.yml exists at the repository root with at least one named service. | Executable | any | development | pr |
| [jest-no-failed-tests](quality-gates/gates/jest-no-failed-tests.yaml) | jest --json exits with numFailedTests === 0. | Executable | javascript, typescript, jest | development | commit |
| [no-console-log-production](quality-gates/gates/no-console-log-production.yaml) | No console.log, console.warn, or console.error calls appear in non-test production source files. | Executable | javascript, typescript, any | commit | pre-commit |
| [no-localhost-hardcoded](quality-gates/gates/no-localhost-hardcoded.yaml) | No occurrence of 'localhost' or '127.0.0.1' appears as a string literal in application source code. | Executable | any | development | commit |
| [tsc-no-emit-exits-zero](quality-gates/gates/tsc-no-emit-exits-zero.yaml) | tsc --noEmit exits 0 on every commit. | Executable | typescript | development | commit |
| [typescript-strict-mode](quality-gates/gates/typescript-strict-mode.yaml) | The project's tsconfig.json has compilerOptions.strict set to true. | Executable | typescript | commit | pre-commit |
| [docker-service-boundaries](quality-gates/gates/docker-service-boundaries.yaml) | Each application service in docker-compose.yml must reference an explicitly named database service. | — |  | — | — |
| [extension-manifest-committed](quality-gates/gates/extension-manifest-committed.yaml) | .vscode/extensions.json must exist and be committed to the repository. | — |  | — | — |
| [python-dependencies-pinned](quality-gates/gates/python-dependencies-pinned.yaml) | Python projects must have a locked dependency file with pinned versions. | — |  | — | — |
| [runtime-version-pinned](quality-gates/gates/runtime-version-pinned.yaml) | A runtime version pin file must exist: .nvmrc for Node.js projects, .python-version for Python projects, .tool-versions for multi-runtime. | — |  | — | — |

*Underrepresented properties (highest-value contribution targets): Composable.*
<!-- GATES_TABLE_END -->

See [CONTRIBUTING.md](quality-gates/CONTRIBUTING.md) for the schema and submission process.

---

### Production Evidence Repositories

Filtered exports of the production codebases used in the experiments. Prior and subsequent history is omitted. Copyright belongs to the respective owners.

| Repository | Description | Role in Paper |
|---|---|---|
| [**brad-gs-build**](https://github.com/jghiringhelli/brad-gs-build) | BRAD legal intelligence engine. 37 commits, Feb 27-Mar 4. Built from scratch under GS methodology. | Case study ss4.1 |
| [**scp-gs-experiment**](https://github.com/jghiringhelli/scp-gs-experiment) | SafetyCore Pro quality gate pass. 4 experiment commits, Mar 16-18. Test files and config only. | Adversarial experiment ss5 |

Commit timestamps are cryptographically signed by GitHub. BRAD shows the full build arc from initial commit to production-grade application in 6 days. SCP shows the experiment window: expert-prompt control condition followed by the GS quality gate pass.

### White Paper

The published preprint is at [doi.org/10.5281/zenodo.19073543](https://doi.org/10.5281/zenodo.19073543). The source and ancillary files are in [`docs/white-paper/`](docs/white-paper/). Community review is open -- see [REVIEWING.md](docs/white-paper/REVIEWING.md) for how to challenge a claim, propose a correction, or map an issue to a section.

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

[ForgeCraft](https://github.com/jghiringhelli/forgecraft-mcp) implements the GS methodology as a local MCP server. It reads from this repository's `quality-gates/` library. Open source, free to use.

```bash
npx forgecraft-mcp setup .
```

---

## Community Convergence

The structural argument developed in ss10 of the white paper: when a practitioner community contributes to a shared GS methodology under quality gates, the specification floor across all governed domains rises monotonically and cannot retreat while quality gates hold. That argument applies to this repository. The quality gate library improves with every accepted contribution. ForgeCraft inherits the improvement. Projects governed by ForgeCraft inherit it in turn.

---

## Citation

```
Ghiringhelli, J. C. (2026). Generative Specification: A Pragmatic Programming Paradigm for the Stateless Reader (1.1). Zenodo. https://doi.org/10.5281/zenodo.19073543
```

Contact: jcghiri@gmail.com - [linkedin.com/in/jghiringhelli](https://linkedin.com/in/jghiringhelli) - [genspec.dev](https://genspec.dev) - [ambientengineer.substack.com](https://ambientengineer.substack.com)