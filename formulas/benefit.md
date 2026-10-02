---
layout: default
title: "benefit = coverage · λ"
parent: Formulas
nav_order: 3
permalink: /formulas/benefit/
description: "A practice pays off only where it both catches the failure (coverage) and the failure occurs (exposure). Revival is exposure-gated, not cost-gated."
---

# benefit = coverage · λ

**Status: supported by one experiment (NX), predicted per practice by a pre-registered grid.** A cheap practice that catches everything still pays nothing where there is nothing to catch.

## Reads as

A practice's benefit on a project is how well it catches a failure (**coverage**) times how often that failure occurs there (**exposure**, λ). If either is near zero, the benefit is near zero.

## The claim in one line

In one pilot (NX), a practice paid off only where its target failure occurred; this is not yet generalized. The proposed reading is that revival is exposure-gated, not cost-gated. The common story is that practices such as N-version programming died because a human could not afford them, and revive now that an AI executor makes them cheap. The formula says cost is only half the question: a practice revives where it has failures to catch.

## What the experiment showed

In the NX work, a practice that caught the failures it targeted gave no benefit on the model and task where those failures did not occur. The coverage was real and the exposure was missing. The result is bounded by that experiment's design; see its page for the limits.

## What is still open

The pre-registered revival grid predicts, per practice, where the benefit should appear. Until it has run, the formula is a model with one supporting experiment, not a general result.

## Where to read more

- [The revival model (working document)](/docs/discipline-revival-model.html)
- [w = λ · κ](/formulas/weight/): the weight of a failure family.
- [The evidence](/method/evidence/) and the [experiment ledger](/docs/white-paper/EXPERIMENT-LEDGER.html).
- The [pre-registered design](https://github.com/jghiringhelli/generative-specification/blob/main/experiments/revival/PREREGISTRATION.md).
