---
layout: default
title: "w = λ · κ"
parent: Models and equations
nav_order: 2
permalink: /formulas/weight/
description: "The expected cost a project carries from a failure family is its exposure times its cost. The weight in the revival model: a model with provisional parameters, whose pre-registered test has not been run."
---

# w = λ · κ

**Status: a model with provisional parameters.** A pre-registered test of the model has been designed and has not been run. The only data so far are one exploratory N-version study (NX, logbook tier C/D, inconclusive). The exposure λ is estimated from detector counts, normalized by code size; in NX it was the baseline defect rate of the generator. It depends on the model and the task, not only on the project.

## Reads as

For one family of failures, **w** is the expected cost the project carries. **λ** is the exposure: how prone the project is to that failure. **κ** is the cost if the failure reaches production. Multiply them and you have the weight of that failure family for that project. λ is a density, so w is expected cost per unit of code and per period, not the project's total.

## What it is for

It ranks failure families by what they are worth to a project, so that you spend checking effort where the expected cost is highest. It is the first step of the [revival model](/docs/discipline-revival-model.html), which asks which long-standing engineering practices become worth reviving when an AI executor makes them cheap.

## What to keep in mind

- **λ is conditioned on the generator.** In the revival work, the exposure to a failure depended on the model and on the difficulty of the task, not just on the project. The model is an argument of λ.
- **Not measured means not counted.** If λ or κ cannot be determined, the model records it as not measured and lists it as unknown. It does not guess a penalty.
- **The test has not been run.** The revival program is pre-registered: the design was frozen before any generation, so a reader can check a future result against it. The grid itself has not run. See the [pre-registered design](https://github.com/jghiringhelli/generative-specification/blob/main/experiments/revival/PREREGISTRATION.md).

## Where to read more

- [The revival model (working document)](/docs/discipline-revival-model.html)
- [Benefit = coverage · λ](/formulas/benefit/): the next step of the same model.
- The Compendium mentions the revival model in prose (section 4.6) but does not contain this equation.
