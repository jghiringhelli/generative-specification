---
layout: default
title: Models and equations
nav_order: 8
has_children: true
permalink: /formulas/
description: "The four models and equations of Generative Specification, each stated with the status it has earned: a mental model, a model under test, a prediction, or a metric. None is a law."
---

# Models and equations

These are mental models and metrics, not results. Four short equations carry most of the method's reasoning. Each is stated here with the status it has earned, no more. Read the status as part of the formula.

| Equation | Reads as | Status |
|---|---|---|
| [I ∝ (1 − S) / S](/formulas/completeness/) | Expected correction cycles I grow as the specification S (completeness, not specificity) leaves more of what must be true unstated | A **mental model**, not tested: direction only, no constant, no proof |
| [w = λ · κ](/formulas/weight/) | The expected cost a project carries from a failure family: exposure λ times cost κ | A **model** with provisional parameters; its pre-registered test has been designed and not run |
| [benefit = Σ coverage · λ · κ](/formulas/benefit/) | A practice pays off only where it both catches the failure and the failure occurs, in cost units | A **proposed model**: one exploratory illustration (NX); the pre-registered test has not been run |
| [cost per correct output](/formulas/cost/) | Tokens spent divided by outputs that pass verification and are accepted | A **metric**, not a law; evidence so far is exploratory |

## How to read them

- **Direction, not magnitude.** None of these equations has a fitted constant. They say which way a quantity moves, not by how much.
- **Four statuses.** A *mental model* is a way to think. A *model* with a pre-registered program has a test that can falsify it; where that program has not run, the page says so. A *prediction* says what an experiment should show. A *metric* is something you can measure on your own project today.
- **The same rule is a gate.** The open [gate library](/quality-gates/) includes a notation-audit gate: a formula in mathematical notation must come with a derivation, a citation, or an explicit label as a proposed model not yet empirically fitted. This site holds itself to it.

## Where the derivations live

The [Compendium](/docs/white-paper/GenerativeSpecification_Compendium.html) holds the derivations for the first and last formulas. The second and third live in the [revival model](/docs/discipline-revival-model.html) working document and are not yet in the Compendium. The [evidence page](/method/evidence/) says what each experiment established, with its bound.

## Two evidence scales, two names

Two lettered scales appear on this site and they do not match. The **experiment logbook** grades each experiment: tier A is registered externally, B is a tag in the repository, C is design text written before the data or author-attested, D is a demonstration or post-hoc. The **Compendium evidence levels** (used on the [lifecycle page](/method/lifecycle/)) are E for an experiment or case study with its limits, C for a case study or self-reported use, D for design only. The letter C means different things on the two. This site always names the scale: "logbook tier C" or "Compendium level C". The two are not unified. The white paper and the IEEE draft use no letter scale at all: they state each result's design type, registration status, number of runs and statistical status in plain words, following the ACM SIGSOFT Empirical Standards (see "How to read the evidence statements" in the white paper, section 5).
