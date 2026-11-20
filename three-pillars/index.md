---
layout: default
title: The three pillars
nav_order: 3
permalink: /three-pillars/
description: "Generative Specification rests on three pillars: a rubric to compare against, a process to climb, and a defined moment where a person decides. Each can be used on its own."
---

# The three pillars

Generative Specification rests on three pillars. Each one can be read, discussed and improved on its own, and this page is an open draft: the third pillar in particular has not been tested yet.

- **Pillar 1, the rubric.** The yardstick: what makes a project derivable and checkable, and what it looks like when it is not.
- **Pillar 2, the process.** The order for climbing: where a team is today and what the next step opens.
- **Pillar 3, the human in the loop.** The moment a person decides, and the rule for when that is needed and when it is not.

Above the three sits the **lifecycle**: the path a change follows from intent to a checked build. The pillars say what to measure, in what order, and who decides. How you carry them out is yours to choose. We also publish **our default way of running the process**, the one the author has used (see the end of this page). It is a recommendation, not a requirement.

## At a glance

| | 1. The rubric | 2. The process | 3. The human in the loop |
|---|---|---|---|
| **What it is** | Seven properties that make a project derivable by a reader with no memory, each with what a reviewer looks at and a named way it fails | Five levels of maturity, from ad hoc to self-improving, and what each step up opens | The moments where a person decides, and a rule for when a person is needed |
| **What it is for** | Comparing a project against a fixed bar, with any tooling | Knowing where a team is and what comes next | Spending scarce human attention where no check can decide |
| **Is it required** | It is the bar | It is the order | It is the rule for who decides |
| **How it is judged** | Against the properties, with the evidence shown | As of a date, a commit and a version of the spec | Draft. Not yet measured |

## Pillar 1. The rubric

The yardstick. It asks of any project: can a stateless reader derive it, and can something outside the model show that it did.

1. **The seven properties.** Self-describing, Bounded, Composable, Verifiable, Auditable, Defended, Executable. Each has a named failure: the Empty Map, the Tangled Web, the Spreading Boundary, the Open Gates, the Amnesia Stack, the Unbound Spec and the Frozen Spec. Start with [the rubric](/method/rubric/).
2. **How a project is scored.** The scoring guide, and what "governed as of a date" does and does not claim. See [Lifecycle and debt](/method/lifecycle/).
3. **How complete the specification is.** Three separate numbers, never one. See [Spec completeness](/method/spec-completeness/).

You can meet the rubric with any tool.

## Pillar 2. The process

The order for climbing, in five levels: Ad hoc, Documented, Controlled with gaps, Controlled and tied to reality, and Self-improving.

1. **The five levels.** Levels 3, 4 and 5 are described in [Lifecycle and debt](/method/lifecycle/). Levels 1 and 2 are being written and are not published yet.
2. **What each step up opens.** The condition for moving from one level to the next.
3. **The rules for every change.** A debt allowance per change, coverage of acceptance criteria, and a triage when a check fails. See [Refine the spec, triage first](/practice/refinement/).
4. **The recipes.** The process in action, one per situation: a new project, an existing one, a bug fix, a migration. See the [workflow recipes](/docs/recipes/).

## Pillar 3. The human in the loop {#pillar-3}

*Draft design. It has not been measured, and it is open to change.*

Automation does the checking. A person is the scarcest resource in the system, so the question is where that person's time goes.

> Everything that can be checked is checked. A person decides what no check can decide, and what cannot be undone.

**Where a person decides.**

1. **The specification.** What the system must be. It is the first step of the person in the loop, and nobody else holds the intent.
2. **The interpretation.** Whether what the assistant understood is what was meant.
3. **The gaps and the assumptions.** What is missing, what is being assumed, what is clarified.
4. **Improvements, the scope of each milestone, and taste.** Decisions of value, not of correctness. They are decided and recorded, so they are not argued twice.
5. **Irreversible actions.** Approving what cannot be undone (see principle 6 in [the working principles](/method/principles/)).

**When a decision deserves a person.** It deserves one to the degree that three things hold: no check that runs can decide it, a mistake is costly or cannot be undone, and the mistake spreads to what comes after. A decision that meets all three is the best use of a person's time. One that meets none is not reviewed; it is checked.

**When the person leaves.** When a set of criteria can be automated, a person ratifies them once and they become checks that run. From then on that zone no longer needs a person to review each instance. The person comes back only to tighten the ratchet (a stricter criterion, a lower debt threshold) or when a failure is triaged as a missing or wrong specification.

**What is not solved.** Interpretation has no check yet; today a person verifies it by reading. One idea to test is that the assistant returns its reading as acceptance examples that the person ratifies, so they become checks. It is a hypothesis. The claim that a few decisions at the top hold most of the value of human review is also a hypothesis, and we have no data for it.

## The default implementation

Our way of running the process. Use it, adapt it or replace it.

1. **The mechanisms.** The bridge between human language and code, the sentinel that bounds what the assistant reads, and phase collapse. See [The Method](/method/).
2. **Hooks and gates.** The [gate library](/quality-gates/), the portable gate template, and [the Andon method](/method/andon/): stop the line with a check that runs, not with another model's opinion.
3. **Installing it by kind of project.** [New project](/practice/new-project/), [existing project](/practice/existing-project/), [join a codebase](/practice/join-a-codebase/) and [migrate to a new stack](/practice/migrate-stack/).
4. **Domain guides and templates.** [Domain guides](/domains/) and [templates](/templates/).

It is recommended. It can be met another way, with automated tests, manual checks or a different kind of map.

## Across all three

The [evidence](/evidence/), with its models and equations such as [cost per correct output](/formulas/cost/), the [free course](/method/course/), and [about](/about/) apply to every pillar.

## What this page does not say

It does not say that any project is certified or governed beyond what the rubric states for a date. It claims no measured results for the process, the human-in-the-loop rule or the implementation beyond what the [evidence page](/method/evidence/) reports, with its bounds. The studies are small and written by the method's author. This is an open working draft, not a standard.
