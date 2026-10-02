---
layout: default
title: "w = λ · κ"
parent: Formulas
nav_order: 2
permalink: /formulas/weight/
description: "The expected cost a project carries from a failure family is its exposure times its cost. The weight in the revival model, under test by a pre-registered program."
---

# w = λ · κ

**Status: the revival model.** A model under test, not an established result. The exposure λ is measured by detectors and depends on the model and the task, not only on the project.

## Reads as

For one family of failures, **w** is the expected cost the project carries. **λ** is the exposure: how prone the project is to that failure. **κ** is the cost if the failure reaches production. Multiply them and you have the weight of that failure family for that project.

## What it is for

It ranks failure families by what they are worth to a project, so that you spend checking effort where the expected cost is highest. It is the first step of the [revival model](/docs/discipline-revival-model.html), which asks which long-standing engineering practices become worth reviving when an AI executor makes them cheap.

## What to keep in mind

- **λ is conditioned on the generator.** In the revival work, the exposure to a failure depended on the model and on the difficulty of the task, not just on the project. The model is an argument of λ.
- **Not measured means not counted.** If λ or κ cannot be determined, the model records it as not measured. It does not guess a penalty.
- **It is being tested.** The revival program is pre-registered: the design was frozen before any generation, so a reader can check the result against it. See the [pre-registered design](https://github.com/jghiringhelli/generative-specification/blob/main/experiments/revival/PREREGISTRATION.md).

## Where to read more

- [The revival model (working document)](/docs/discipline-revival-model.html)
- [Benefit = coverage · λ](/formulas/benefit/): the next step of the same model.
- [The Compendium](/docs/white-paper/GenerativeSpecification_Compendium.html)
