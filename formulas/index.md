---
layout: default
title: Formulas
nav_order: 8
has_children: true
permalink: /formulas/
description: "The four formulas of Generative Specification, each stated with the status it has earned: a mental model, a model under test, a prediction, or a metric. None is a law."
---

# Formulas

These are mental models and metrics, not results. Four short formulas carry most of the method's reasoning. Each is stated here with the status it has earned, no more. Read the status as part of the formula.

| Formula | Reads as | Status |
|---|---|---|
| [I ∝ (1 − S) / S](/formulas/specificity/) | Expected correction cycles I grow as the specification S leaves more of the output space open | A **mental model**: direction only, no constant, no proof |
| [w = λ · κ](/formulas/weight/) | The expected cost a project carries from a failure family: exposure λ times cost κ | The **revival model**, being tested by a pre-registered program |
| [benefit = coverage · λ](/formulas/benefit/) | A practice pays off only where it both catches the failure and the failure occurs | A **proposed reading**: revival is exposure-gated, not cost-gated. One pilot supports it; a pre-registered grid will test it per practice |
| [cost per correct output](/formulas/cost/) | Tokens spent divided by outputs that pass verification | A **metric**, not a law |

## How to read them

- **Direction, not magnitude.** None of these formulas has a fitted constant. They say which way a quantity moves, not by how much.
- **Four statuses.** A *mental model* is a way to think. A *model under test* has a pre-registered program that can falsify it. A *prediction* says what an experiment should show. A *metric* is something you can measure on your own project today.
- **The same rule is a gate.** The open [gate library](/quality-gates/) includes a notation-audit gate: a formula in mathematical notation must come with a derivation, a citation, or an explicit label as a proposed model not yet empirically fitted. This site holds itself to it.

## Where the derivations live

The [Compendium](/docs/white-paper/GenerativeSpecification_Compendium.html) holds the full derivations and caveats. The [revival model](/docs/discipline-revival-model.html) is the working document behind the last three formulas. The [evidence page](/method/evidence/) says what each experiment established, with its bound.
