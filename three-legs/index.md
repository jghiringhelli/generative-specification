---
layout: default
title: The three legs
nav_order: 3
permalink: /three-legs/
description: "Generative Specification has three separate parts: a rubric to compare against, a process to climb, and a recommended implementation. The first two do not depend on the third."
---

# The three legs

Generative Specification is three separate things. Each one can be read, discussed and improved on its own.

- **The rubric** is the yardstick: what makes a project derivable and checkable, and what it looks like when it is not.
- **The process** is the order for climbing: where a team is today and what the next step opens.
- **The recommended implementation** is one way to do it, the one the author has used. It is a recommendation, not a requirement.

The rubric and the process do not depend on the implementation. A team with its own tools and habits can use the first two and ignore the third.

## At a glance

| | The rubric | The process | The recommended implementation |
|---|---|---|---|
| **What it is** | Seven properties that make a project derivable by a reader with no memory, each with what a reviewer looks at and a named way it fails | Five levels of maturity, from ad hoc to self-improving, and what each step up opens | A sentinel, the bridge, hooks, a library of gates, and CI on a protected branch |
| **What it is for** | Comparing a project against a fixed bar, with any tooling | Knowing where a team is and what comes next | A starting point that has been used in practice |
| **Is it required** | It is the bar | It is the order | No. It can be met another way (automated tests, manual checks, a different kind of map) |
| **How it is judged** | Against the properties, with the evidence shown | As of a date, a commit and a version of the spec | It is adopted or replaced; it is not scored |

## Leg 1. The rubric

The yardstick. It asks of any project: can a stateless reader derive it, and can something outside the model show that it did.

1. **The seven properties.** Self-describing, Bounded, Composable, Verifiable, Auditable, Defended, Executable. Each has a named failure: the Empty Map, the Tangled Web, the Spreading Boundary, the Open Gates, the Amnesia Stack, the Unbound Spec and the Frozen Spec. Start with [the rubric](/method/rubric/).
2. **How a project is scored.** The scoring guide, and what "governed as of a date" does and does not claim. See [Lifecycle and debt](/method/lifecycle/).
3. **How complete the specification is.** Three separate numbers, never one. See [Spec completeness](/method/spec-completeness/).

You can meet the rubric with any tool.

## Leg 2. The process

The order for climbing, in five levels: Ad hoc, Documented, Controlled with gaps, Controlled and tied to reality, and Self-improving.

1. **The five levels.** Levels 3, 4 and 5 are described in [Lifecycle and debt](/method/lifecycle/). Levels 1 and 2 are being written and are not published yet.
2. **What each step up opens.** The condition for moving from one level to the next.
3. **The rules for every change.** A debt allowance per change, coverage of acceptance criteria, and a triage when a check fails. See [Refine the spec, triage first](/practice/refinement/).
4. **The recipes.** The process in action, one per situation: a new project, an existing one, a bug fix, a migration. See the [workflow recipes](/docs/recipes/).

## Leg 3. The recommended implementation

Our way of doing it. Use it, adapt it or replace it.

1. **The mechanisms.** The bridge between human language and code, the sentinel that bounds what the assistant reads, and phase collapse. See [The Method](/method/).
2. **Hooks and gates.** The [gate library](/quality-gates/), the portable gate template, and [the Andon method](/method/andon/): stop the line with a check that runs, not with another model's opinion.
3. **Installing it by kind of project.** [New project](/practice/new-project/), [existing project](/practice/existing-project/), [join a codebase](/practice/join-a-codebase/) and [migrate to a new stack](/practice/migrate-stack/).
4. **Domain guides and templates.** [Domain guides](/domains/) and [templates](/templates/).

It is recommended. It can be met another way.

## Across all three

The [evidence](/evidence/), with its models and equations such as [cost per correct output](/formulas/cost/), the [free course](/method/course/), and [about](/about/) are not part of any one leg. They apply to all three.

## What this page does not say

It does not say that any project is certified, and it does not claim measured results for the process or the implementation beyond what the [evidence page](/method/evidence/) reports, with its bounds. The studies are small and written by the method's author.
