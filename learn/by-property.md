---
layout: default
title: By property
parent: Learn
nav_order: 3
permalink: /learn/by-property/
description: "The seven properties of a derivable project, each with where to read its definition, where to practise it and where to find the checks that defend it."
---

# Learn by property

The method grades a project on seven properties, one letter each. Study them one at a time: for each, read what it means, see the checks that enforce it, and practise it on a project.

Five of the seven are the ones a non-engineer can care about, because they decide whether a system survives scrutiny. They spell **SAVED**: Self-describing, Auditable, Verifiable, Executable, Defended. The other two, Bounded and Composable, keep the five true under change. The [rubric](/method/rubric/) holds the full definitions.

| Property | The question it asks | Read the definition | See the checks | Practise it |
|---|---|---|---|---|
| **Self-describing** | Can a stranger, human or AI, understand the system from its own artifacts? | [Rubric](/method/rubric/#self-describing) | [Gates](/method/gates/#self-describing) | [Spec completeness](/method/spec-completeness/) · [Your first hour](/START-HERE.html) · [Templates](/templates/) |
| **Auditable** | Are the decisions on the record: what, why and what was ruled out? | [Rubric](/method/rubric/#auditable) | [Gates](/method/gates/#auditable) | [Repository discipline](/docs/repository-discipline.html) · [Existing project](/practice/existing-project/) |
| **Verifiable** | Is correctness computed, not claimed? | [Rubric](/method/rubric/#verifiable) | [Gates](/method/gates/#verifiable) | [New project](/practice/new-project/) |
| **Executable** | Is the spec bound to the running system, not to a description of an older one? | [Rubric](/method/rubric/#executable) | [Gates](/method/gates/#executable) | [Coherence between spec and code](/method/coherence/) |
| **Defended** | Are the rules enforced, not suggested? | [Rubric](/method/rubric/#defended) | [Gates](/method/gates/#defended) · [Gate library](/quality-gates/) | [Run structural gates and remediate](/practice/structural-gates/) |
| **Bounded** | Does every unit of work have explicit scope and seams? | [Rubric](/method/rubric/#bounded) | [Gates](/method/gates/#bounded) | [Structural disciplines](/practice/structural-disciplines/) |
| **Composable** | Can a change stay local, without unexpected coupling? | [Rubric](/method/rubric/#composable) | [Gates](/method/gates/#composable) | [Structural disciplines](/practice/structural-disciplines/) · [Migrate to a new stack](/practice/migrate-stack/) |

## Related ideas, each in one place

- **The sentinel**, the small map that bounds what the assistant loads: taught in the [free course](/method/course/) and set up in [Your first hour](/START-HERE.html).
- **The ratchet**, so every miss leaves something permanent: [Quality gates](/method/gates/#the-ratchet) and [Refine the spec, triage first](/practice/refinement/).
- **Enforcement versus suggestion**: [The Andon Method](/method/andon/), a proposed team method built on the same thesis.
- **Grades and honesty**: the [rubric](/method/rubric/#what-the-rubric-does-not-claim) says what its letters do not claim.
