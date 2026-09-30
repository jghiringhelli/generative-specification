---
layout: default
title: Lifecycle and debt
parent: The Method
nav_order: 9
permalink: /method/lifecycle/
description: "Three working definitions: no new debt per change, criteria coverage, and what the method covers across the software lifecycle, with what is not yet covered stated plainly."
---

# Lifecycle and debt: three definitions

These are **definitions**, not results. They say what a claim means so that it can be checked, and so that no page here can say more than a run produced. Where the method does not yet cover something, the table says so.

## 1. No new debt per change (the debt ratchet)

Let `M` be a fixed set of objective, tool-measured measures, and let `B` be the subset of `M` that blocks. For a change `c`, and for each measure `i` in `M`, scoped to the code the change touches:

```
delta_i(c) = m_i(after c) - m_i(before c)

the change is admitted  iff  delta_i(c) <= 0  for every i in B
```

Measures for `M` and the tools that produce them (see [Quality gates](../gates/) and [Run structural gates at the right moment](/practice/structural-gates/)):

| Measure | Typical tool |
|---|---|
| Duplicated lines introduced in the diff | `jscpd` |
| Cyclomatic complexity of touched functions | eslint complexity |
| Unused exports introduced | `knip`, `ts-prune` |
| Layer-rule violations and import cycles | `dependency-cruiser`, `madge` |
| Touched lines without test coverage | `c8`, istanbul |

Rules:

- Measures that exist only at repository level (an import cycle, a layer rule) are compared on the repository before and after the change.
- **Advisory measures** are reported and do not block, until their false-positive rate has been measured and is near zero. Only then do they join `B`.
- The **baseline is stored, and the executor cannot edit it.** It moves only downward: when a change lowers a measure, the floor tightens.
- **Measured, not asserted.** The definition holds only if a run produced numbers against the stored baseline and the result is in the audit trail. A sentence in a status file saying "no new debt" is not a gate.

What it does not mean:

- It does **not** mean zero debt overall. A repository with a large debt remains admissible; it cannot get worse through new changes. Repaying existing debt needs a separate remediation scope.
- It does not cover what no tool measures: design quality, pattern fit, naming, and architectural erosion beyond the rules that were written down. Those are review-only.

Status: the definition is design. The complexity gate is in the library; the diff-scoped duplication and dead-code gates were added recently; no single gate yet combines all measures against a stored baseline. What has been measured is the cost of duplicated code (experiment SX: about 2.4 times the tokens and 3.5 times the edits, n=2, one benchmark, one frontier model), not the ratchet as a whole.

## 2. Criteria coverage (intent to staging)

For one build in one environment, with `C` the set of ratified acceptance criteria:

```
coverage = |{ c in C : c has a verification method and its derived check passes }| / |C|
```

- A criterion **with no verification method counts as uncovered.** It stays in the denominator.
- A verification method is an executable probe, a static gate, or a manual check signed with a date and its evidence.
- **Who ratifies:** the criteria, and the acceptance examples derived from them, are ratified by a person in the product or business role. The executor that writes the code has no write access to them or to the gate configuration; otherwise the check would not be independent of what it judges.
- Coverage is reported together with the identity of the build and the environment it was measured on.
- 100% coverage means every ratified criterion has a passing check. It says nothing about criteria that were never written; whether the criteria are complete is a judgment the ratifier makes.

Status: definition, design only. It is not yet a published gate or report.

## 3. What the lifecycle covers today

Evidence tiers: **E** = experiment or case study in our own material, with its n and design limits; **C** = case study or self-reported production use; **D** = design only, no evidence.

| Stage | State | Where it is covered | Evidence |
|---|---|---|---|
| Ideation | Partly | Idea to spec is in the "new project without spec" recipe; a pre-spec artifact (intent with a measurable outcome) is not in the canon | Spec-first step: E. Intent layer: D |
| Creation | Covered | [New project](/practice/new-project/), recipes, the initialization loop | E (AX series, ALX self-application); C (greenfield cases, one builder) |
| Extension | Covered | Recipe `brownfield-new-feature`, the short loop, commit-time cascade hooks | C (one extension case); SX shows the cost of extending average code, not the cascade itself |
| Environments and release | Covered for one stack | Environment tiers, the hardening suite | C (one project); no controlled study; intent-to-staging traceability not in canon |
| Evolution in production | Covered | Tiers for production and evolution, external triggers treated as spec deltas | C for production; evolution is self-application, not independent |
| **Keep the lights on** | **Not yet covered** | Only implicit: dependency and CVE deltas | D |
| Brownfield remediation | Covered by the practice pages and recipes, not by the course | [Existing project](/practice/existing-project/), [Remediate](/practice/remediation/), recipes | E for the cost mechanism (SX, n=2); C for the takeover cases (one engineer each, self-reported) |
| Migration | Covered by the practice page and a recipe, not by the course | [Migrate a stack](/practice/migrate-stack/) | C: one case, no comparison arm |
| **Disposal** | **Not yet covered** | Nothing found | D |
| Post-mortem | Partly | The hotfix loop and the ratchet (every defect leaves a test and a rule); no incident template | D for the template |
| Constant auditability | Partly | ADRs, commit trail, gate results | C; a single "chain for change X" query is not verified |
| Debt per change | Definition only | Section 1 above | E for the cost of duplication; D for the combined gate |

Absence of a hit in our search is not proof that nothing exists elsewhere; it is what we found.

See also: [the rubric](../rubric/), [quality gates](../gates/), [the evidence](../evidence/).
