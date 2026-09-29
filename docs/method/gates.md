---
layout: default
title: Quality gates
parent: The Method
nav_order: 3
permalink: /method/gates/
description: "The deterministic, non-LLM checkers that make Generative Specification enforceable, grouped by the rubric property each one defends, with the matching gates in the open community library."
---

# Quality gates

A specification is only as strong as what a machine can **verify**. Gates are the deterministic checkers that make the method enforceable: standard CI hooks, grouped here by the [rubric](../rubric/) property each one defends. An LLM may write the code, but a **non-LLM checker verifies it**. These are those checkers. They are the verification and enforcement layer of the substrate (the *harness*), the part that keeps the guarantee outside the model.

**Terminology: guides and sensors.** Böckeler (2026) divides an agent's harness into *guides* (feedforward) and *sensors* (feedback), each computational or inferential. Here the sentinel, specifications, instruction files and skills are guides; tests, linters, structural checks and gates are sensors, and "harness" used for the verification layer means the sensors. An instruction file is advisory, a hook is deterministic; both layers should derive from the same ratified specification, with the guides kept minimal. Böckeler, B. (2026). Harness engineering. martinfowler.com. https://martinfowler.com/articles/harness-engineering.html

You do not need a proprietary tool. Point a capable assistant at the [white paper](https://doi.org/10.5281/zenodo.21726017) and this page, and ask it to wire the gates that apply to your stack. The tools below are the JavaScript/TypeScript defaults; the assistant substitutes per language.

**Blocking versus advisory.** A *blocking* gate fails the build. An *advisory* gate reports and does not stop the merge. A gate that can be skipped under deadline pressure is a suggestion, which is the failure the rubric calls Open Gates. Advisory rows below are the ones where a hard threshold is still project-specific.

---

## The gates, by property

The library column names real gates in [`quality-gates/`](/quality-gates/), where one exists. A dash means the row is a practice with no library entry yet.

### Bounded

| Gate | Standard tool | Rule | Level | Library gate |
|---|---|---|---|---|
| File length | `wc` / loc | at most about 300 lines | blocking | `file-length-max-300` |
| Function length and parameters | `eslint` | `max-lines-per-function`, `max-params` | blocking | `function-length-max-50`, `max-function-parameters` |
| Cyclomatic complexity | `eslint` complexity | function complexity at most 10 | blocking | `cyclomatic-complexity-max-10` |
| Code duplication | `jscpd` | no new duplication in the diff above a stored baseline (ratchet) | advisory | `no-duplicated-code-in-diff` |
| Dead code | `ts-prune` / `knip` | no unused exports | advisory | `no-unused-exports-dead-code` |

### Composable

| Gate | Standard tool | Rule | Level | Library gate |
|---|---|---|---|---|
| Layer boundaries | `dependency-cruiser` | controller does not reach the repository; domain stays pure | blocking | `no-direct-db-in-routes` |
| Circular imports | `madge` | no cycles | blocking | `no-circular-dependencies` |

### Verifiable

| Gate | Standard tool | Rule | Level | Library gate |
|---|---|---|---|---|
| Type strictness | `tsc --strict` | strict passes; no `any` | blocking | `typescript-strict-mode`, `no-any-type` |
| Line and branch coverage | `c8` / istanbul | at or above a target | blocking | `coverage-threshold-80` |
| Mutation score | `stryker` | at or above a target (the library uses 65% overall, 70% on changed files) | advisory on the site's reference set; blocking in the library | `mutation-score-threshold` |

Coverage and mutation score are complementary, not interchangeable. Coverage measures execution; mutation score measures detection. In the AX study the first GS treatment reported 93.1% line coverage but a 58.62% mutation score; after three rounds of assertion improvements the mutation score converged to 93.10%. Both gates are needed.

### Executable

| Gate | Standard tool | Rule | Level | Library gate |
|---|---|---|---|---|
| Behavioural probes against a live system | `hurl` (or `newman`) | acceptance criteria pass on deploy | blocking | `hurl-contract-tests-pass`, `contract-tests-against-live-env` |
| Module boot smoke | CI boot script | every module boots | blocking | `smoke-test-passes`, `health-endpoint-responds` |

Executable is scored only when a formal behavioral contract exists to run; the [rubric page](../rubric/) has the rule. Related library gates that the library files under this property: `jest-no-failed-tests`, `tsc-no-emit-exits-zero`, `docker-compose-defined`.

### Defended

| Gate | Standard tool | Rule | Level | Library gate |
|---|---|---|---|---|
| Secrets scan | `gitleaks` | no secrets in the diff | blocking | `no-hardcoded-secrets` |
| Dependency audit | `npm audit` / `osv` | no high or critical vulnerabilities | blocking | `npm-audit-no-high-cve`, `container-image-no-critical-cve` |
| Forbidden patterns | `eslint` custom rules | for example no `eval`, no database access in controllers | blocking | `no-debug-routes-in-production`, `tls-enforced` |

A dependency audit and an architecture audit are independent checks. In AX, Treatment-v2, the first condition to reach 12/12 on the rubric, also carried nine high-severity vulnerabilities against zero for the control, from a dev-dependency chain; one prescriptive directive plus an `npm audit` gate took it to zero (single model, single benchmark). Neither check subsumes the other.

Defended has a human ceiling. CI can verify six of the seven properties automatically; whether adversarial challenge has been anticipated needs human review, so an automated Defended score is provisional. CI runners are also external infrastructure that generated code cannot itself provision, which is why a spec must name the hook and gate files to be emitted rather than merely describe them.

### Self-describing

| Gate | Standard tool | Rule | Level | Library gate |
|---|---|---|---|---|
| Sentinel present, names announce the domain | structure check | the root sentinel routes to the spec slices | advisory | none |
| Setup and configuration documented | file / section check | a runnable setup section; every environment variable documented | blocking | `readme-setup-section`, `env-vars-documented`, `jsdoc-public-functions` |

### Auditable

| Gate | Standard tool | Rule | Level | Library gate |
|---|---|---|---|---|
| Conventional commits | `commitlint` | commits parse by type and scope | blocking | `conventional-commits` |
| Decision records | commit-history and file hook | every referenced ADR exists as a committed file with content | blocking | `adr-files-emitted` |
| TDD phase order | commit-history hook | `test:[RED]` before `feat:` | advisory | none |

---

When to run each check, and how to remediate a finding without weakening the gate: [Run structural gates and remediate](/practice/structural-gates/).

## The ratchet

Each new defect that slips through becomes a new blocking gate, derived from a real incident. The set only grows and only tightens. In the AX series, each gap a run exposed was closed as a template or gate change (mutation gate, emit-don't-reference, dependency governance, a DRY gate) that then applied to every governed project. That accumulation, not any single gate, is the value.

## The community library

The [`quality-gates/`](/quality-gates/) directory is an open library of structured gates, each mapped to a GS property, with a schema and a contribution path. The gate files are the source of truth: the [library page](/quality-gates/) is generated from them, so it is always the current list, and this page deliberately states no count. The library also holds gates for academic papers (for example `claim-scope-calibration`, `notation-audit`), which apply the same idea to a document instead of code.

A note on classification: the library files some gates under a different property than the grouping above (for example `no-any-type` under Bounded, `typescript-strict-mode` under Executable). The grouping here follows what each gate defends in the method; the library follows its schema. Composable is the least represented property and the highest-value place to contribute.

[Browse the library](/quality-gates/){: .btn .btn-primary .mr-2 }
[How to contribute a gate](https://github.com/jghiringhelli/generative-specification/blob/main/quality-gates/CONTRIBUTING.md){: .btn }

## What gates do not claim

- Gates verify. They do not make a specification correct; a gate only checks the obligations someone wrote down. The completeness of the spec is a separate question, covered in [spec completeness](../spec-completeness/).
- Raising a score by the letter of a check, without the underlying property, is the failure the rubric exists to catch.
- No claim is made here about how many gates a project needs. The [evidence page](../evidence/) says what has been measured and what has not.

**Next:** [The evidence](../evidence/) · [The rubric](../rubric/) · [Spec completeness](../spec-completeness/)
