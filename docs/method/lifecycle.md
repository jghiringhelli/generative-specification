---
layout: default
title: Lifecycle and debt
parent: The Method
nav_order: 9
permalink: /method/lifecycle/
description: "Six working definitions: no new debt per change, criteria coverage, what the method covers across the software lifecycle, the triage of a failure, what 'governed as of' means for a score, and how to measure spec completeness, with what is not yet covered stated plainly."
---

# Lifecycle and debt: six definitions

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

## 4. Triage of a failure (which case is it)

For a failure or a missing element `f`, and the ratified specification `S`, the case depends on one predicate: does `S` require the correct behavior?

```
case(f) = a  if S requires the correct behavior and the implementation violates it
          b  if S is silent or ambiguous about it
          c  if S requires something other than what was intended
          d  if f is a missing tool or sensor
          e  if f is a way around an existing gate
```

| Case | Required artifact | Spec change? |
|---|---|---|
| a | A regression test that cites the violated criterion, seen failing against the current code | No |
| b | The gap stated as a criterion or a numbered fix entry, ratified by a person, then the derived test | Yes |
| c | A change event: the decision recorded, ratified again, every check rerun | Yes |
| d | The tool or sensor added and named in the sentinel, ratified by a person | No |
| e | A new permanent test case for the gate; the count of such cases never decreases | No |

Rules:

- The case is **stated before** the change, not inferred afterward.
- Only b and c change the specification. A defect that is real but that no criterion covers is case b, not case a.
- In a, b and c the test is seen failing against the current code **before** the design changes. A test that cannot load is not a failing test.
- A person ratifies b, c and d. A hook can require a marker of that ratification; it cannot verify it.

What it does not mean: it does not say the agent will classify correctly, and it does not remove the need for review. Skipping local hooks (`--no-verify`) is not stopped by any local check; only a check on the shared branch stops it.

Status: definition, design. The rule was checked deterministically on one small sample project, with crafted commits accepted or rejected for the intended reason, and run once with a real agent that stated the case for two of five findings. It is not a measured effect. The working rule and the enforcement table are on [Refine the spec, triage first](/practice/refinement/).

## 5. Governed as of (a score is a snapshot)

A project is never finished. Code, specification and environment keep changing, so a score describes one moment, not the project. "Done" belongs to a feature (every one of its criteria has a passing check), never to a project or to a score.

A report is a snapshot against the specification in force:

```
snapshot = ( level, grade per property, score ± confidence,
             rubric version, commit, spec version, date )
```

Written as one line: `level · score ± confidence @ rubric vX @ commit <sha> @ spec vN @ date`. It extends the form the [rubric](../rubric/) already uses (`level · score ± confidence @ rubric vX`) with the commit and the spec version, because the same repository scores differently a week later and against a different spec.

- **"Governed as of `<date>`"** means: at that commit and against that spec version, the measured properties meet the target the team declared, and the evidence is in the audit trail. It says nothing about later commits and nothing about what the spec does not state. A repository can be governed against a thin spec.
- **The target is a team decision.** For example, a maturity level on a stated set of properties. This page does not fix it; it must be recorded next to the specification. *Pending: to be decided.*
- **A snapshot ages.** Every commit can change the result. A report states how many commits separate it from the current head, so a stale snapshot is not read as the present.
- **Inferential scoring.** Where a property is scored by an AI reader, the score is a guide. Run it independently more than once and quote the range, not one value.

Status: definition, design. No gate or report yet produces this exact line; the sensors used in the course produce part of the evidence behind it (see [Run structural gates at the right moment](/practice/structural-gates/)).

## 6. Spec completeness (three numbers, kept apart)

A specification is complete when a stateless reader can derive the right program from it alone ([Spec completeness](../spec-completeness/)). That page gives the self-test; this section makes it something that can be reported at a snapshot. For the specifications `S` in force at time `t`:

```
completeness(S, t) = ( coverage(S, t), open(S, t), gaps(S, t) )
```

| Number | What it counts | Where it comes from |
|---|---|---|
| `coverage` | Ratified criteria with a passing check, over all ratified criteria | Section 2 of this page; the criteria-coverage sensor |
| `open` | Unresolved `OPEN` markers in the specification files in force | The open-questions sensor; a spec with any open marker is not implemented |
| `gaps` | Places where a stateless reader guessed, listed one by one | A stranger test on `S` alone: a fresh session with only the spec, requirement by requirement |

Rules:

- **The three stay separate.** No single score: they answer different questions, and a combined number would hide which one is failing.
- Each gap is a missing constraint or criterion. It goes back into the spec (case b of the [triage](#4-triage-of-a-failure-which-case-is-it)), and a person ratifies it.
- `gaps` comes from an inferential reader. Report the count, the list and the identity of the run, and repeat the run to see the spread.
- "Complete as of the snapshot" means coverage 100%, no open markers and no gaps in the runs made. It is a snapshot, not a proof.

What it does not measure:

- **What nobody thought of.** It counts what is written and what a reader guesses. A reader that shares the model's blind spots will not guess where the model is confident and wrong. Asking the model what dimensions of correctness the spec does not yet address (meta-completeness querying, Compendium §8.10) helps, and is also inferential.
- **Enough for the stakes.** How complete is complete enough depends on what an error costs and whether it can be undone; a directional relation, not a threshold (Compendium §9.4).

Related models, both directional and not results: the expected-cost relation `I ∝ (1 − S) / S`, and the RND-1 comparison of a descriptive and a prescriptive spec (n=3, one benchmark) on the [evidence page](../evidence/).

Status: definition, design. The coverage and open-question counts come from sensors checked on two small sample projects. The gap count has been produced in two runs on one sample specification (13 and 14 places, one of them with git history visible to the reader); that shows the count can be produced, not that it is stable.

See also: [the rubric](../rubric/), [quality gates](../gates/), [the evidence](../evidence/).
