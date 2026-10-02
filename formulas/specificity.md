---
layout: default
title: "I ∝ (1 − S) / S"
parent: Formulas
nav_order: 1
permalink: /formulas/specificity/
description: "Expected correction cycles grow as the specification leaves more of the output space open. A mental model: direction only, no constant, no proof."
---

# I ∝ (1 − S) / S

**Status: a mental model.** Direction only. No constant, no units, no proof, and no prediction about magnitude.

## Reads as

I is the expected number of correction cycles. S is how much of the output space the specification closes. The more the specification leaves open (the larger 1 − S), the more correction cycles you should expect before the output is right. Each freedom the specification leaves unclosed is one more correction cycle waiting to happen.

## What it is for

It is a way to see why writing the spec first pays off: every ambiguity you close before generation is one fewer thing the assistant decides on its own, and one fewer thing you correct afterwards.

## What it is not

It is not a result and it is not a claim under test. It does not tell you how many cycles a given spec will cost. It has not been tested across practitioners.

## Evidence

The AX series is **consistent with the direction**: across its conditions, more complete specifications produced better structure. AX did not measure correction cycles, so it is not a test of the formula. A cross-practitioner test, recording correction cycles against specification completeness, is future work.

## Where to read more

- [Spec completeness](/method/spec-completeness/): what a complete spec carries.
- [The evidence](/method/evidence/): what AX showed, with its bounds.
- Compendium section 9.4 (the convergence spiral): the full statement and caveats, in the [Compendium](/docs/white-paper/GenerativeSpecification_Compendium.html).
