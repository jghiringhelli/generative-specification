---
layout: default
title: "benefit = Σ coverage · λ · κ"
parent: Models and equations
nav_order: 3
permalink: /formulas/benefit/
description: "A practice pays off only where it both catches the failure (coverage) and the failure occurs (exposure). Exposure is necessary, not sufficient. A proposed model with one exploratory illustration."
---

# benefit of a practice = Σ coverage · λ · κ

**Status: a proposed model with one exploratory illustration.** The zero case is true by the definition (no exposure, no benefit). In NX, one problem chosen after seeing the results showed the practice catching every wrong answer on the weak model (logbook tier C/D, inconclusive); the registered hypothesis could not be tested because the problems were too easy. The pre-registered grid that would test it has not been run.

## Reads as

`benefit of practice j = Σ_i a_ji · λ_i · κ_i = Σ_i a_ji · w_i`

For each failure family i, **a** is how well the practice catches it (coverage, between 0 and 1), **λ** is how often it occurs on the project (exposure), and **κ** is the cost if it reaches production. Benefit is in the same units as w, so it can be compared with what the practice costs. If coverage or exposure is near zero, the benefit is near zero.

## The claim in one line

Exposure is necessary: where the failure does not occur, a free practice buys nothing. It is not sufficient: a practice revives only where its benefit exceeds what it still costs to run and to ratify, and a weaker model that creates more failures to catch also creates more waste to discard, so the gain peaks in a middle capability band (Compendium section 4.6). The common story is that practices such as N-version programming died because a human could not afford them, and revive now that an AI executor makes them cheap. This formula is only half of that question.

## What the experiment showed

In the NX work, a practice gave no benefit on the model and task where the failures it targets did not occur. That is true by the definition of the formula, whatever the data. The non-zero side rests on one problem chosen after seeing the weak-model run, rerun with a small k: exploratory, inconclusive. It illustrates the model; it does not test it. The weak model also produced many unusable versions, which is the cost side showing up.

## What is still open

The pre-registered revival grid predicts, per practice, where the benefit should appear. It has not been run. Until it has, this is a model with one exploratory illustration, not a general result. The full revival filter (a practice is dead before AI where its benefit is below its cost, and live now where its marginal benefit exceeds the AI and ratification cost) is in the working document and is not stated on this page.

## Where to read more

- [The revival model (working document)](/docs/discipline-revival-model.html)
- [w = λ · κ](/formulas/weight/): the weight of a failure family.
- This equation is not in the Compendium, which treats the revival model in prose (section 4.6).
- [The evidence](/method/evidence/) and the [experiment ledger](/docs/white-paper/EXPERIMENT-LEDGER.html).
- The [pre-registered design](https://github.com/jghiringhelli/generative-specification/blob/main/experiments/revival/PREREGISTRATION.md).
