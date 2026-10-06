---
layout: default
title: "I ∝ (1 − S) / S"
parent: Models and equations
nav_order: 1
permalink: /models/completeness/
redirect_from:
  - /formulas/completeness/
  - /formulas/specificity/
description: "Expected correction cycles grow as the specification leaves more of what must be true unstated. S is completeness, not specificity. A mental model: direction only, no constant, no proof, no test."
---

# I ∝ (1 − S) / S

*Completeness, not specificity.*

**Status: a mental model, not tested.** Direction only. No experiment tests this relation (logbook: no tier, nothing to grade). No constant, no proof, and no prediction about magnitude.

## Reads as

I is the expected number of correction cycles. S is **completeness**: how much of what must be true the specification states. The more the specification leaves open (the larger 1 − S), the more correction cycles you should expect before the output is right. The count grows faster as S approaches zero. The formula gives the direction, not a count per freedom.

S is not the specificity dial. Completeness is how much of what must be true the spec states; specificity is how much of the *how* it pins, and the two are independent (Compendium section 4.5.1). The course also uses the word "dial", for how much of the disciplines you apply, which is a third, separate thing. The per-project proxy S_realized is a different quantity again and does not validate the formula.

## What it is for

It is a way to see why writing the spec first pays off: every ambiguity you close before generation is one fewer thing the assistant decides on its own, and one fewer thing you correct afterwards.

## What it is not

It is not a result and it is not a claim under test. It does not tell you how many cycles a given spec will cost. In its stricter form it is I = k · (1 − S) / S with k unknown, in cycles, and S has no operational definition beyond the proxy S_realized. It has not been tested across practitioners.

## Evidence

No experiment tests this relation. The AX conditions were improved by the author as they went, and AX scored structure on the retired 14-point rubric (logbook tier D, a demonstration, for the later conditions); it did not record correction cycles, so it is not offered as support. A cross-practitioner study that records correction cycles against specification completeness is future work.

## Where to read more

- [Spec completeness](/method/spec-completeness/): what a complete spec carries.
- [The evidence](/method/evidence/): what AX showed, with its bounds.
- Compendium section 9.4 (the convergence spiral): the statement and caveats, in the [Compendium](/docs/white-paper/GenerativeSpecification_Compendium.html). Its wording of the evidence is looser than this page; this page follows the experiment logbook and the White Paper.
