---
layout: default
title: Twelve Working Principles
parent: The Method
nav_order: 7
permalink: /method/principles/
description: "Twelve working principles for specification-governed practice, carried over from the retired Harness Manifesto. Practice, not process; two carry evidence caveats."
---

# Twelve Working Principles

*How a practitioner works under Generative Specification. Carried over from the "Harness Manifesto" of June 2026, which has been retired.*

> **Status.** These are working principles, not findings and not a process. The original page carried a signatory table that no third party had signed, so no signatures are carried over. Its vocabulary predates the current canon, in which "harness" names only the verification and enforcement layer of the substrate. The same text appears as §8.17 of the [Compendium](/evidence/#the-papers). The team-level process that would turn them into roles, artifacts and ceremonies is a separate, still-unproven effort: see [The Andon Method](../andon/).

1. **The specification is the prompt.** Every AI session, and every new team member, derives from the same written source of truth. Context never depends on who is in the room.
2. **The specification is written before the code it governs.** A spec written to describe existing behavior is documentation; a spec written to direct behavior not yet built is discipline.
3. **A bounded specification delivers only what is relevant to the current task.** Size is a symptom; irrelevance is the disease. Bounded is not a length limit; it is a relevance contract. *Caveat: the mechanism (the model silently deprioritizes distant instructions such as tests and architectural rules) is a hypothesis, not a measured result.*
4. **The test suite proves what the system does under real conditions, not that it compiles.** Green CI on broken behavior is not passing; it is Test Theater.
5. **Every non-obvious architectural decision has a recorded rationale.** The AI cannot correct what it was never told was intentional.
6. **Irreversible operations have human confirmation gates.** Consequence is classified in the specification, not inferred at runtime.
7. **New contributors, human or AI, derive full context from artifacts alone.** Knowledge that requires a colleague to transmit it is Bus Factor debt.
8. **Given the same specification and the same requirement, structural decisions converge.** When sessions diverge, the specification is incomplete. *Caveat: supported directionally by AX and AX2 only; not established as a general property.*
9. **Technical debt exists in auditable artifacts or it does not exist for the AI.** A debt the model cannot see is a debt it will compound.
10. **Every interface between systems is a written contract, not an implicit agreement.** The contract must exist in an artifact, not in the memory of the engineer who built both sides. The 1999 Mars Climate Orbiter loss is the standard illustration of an implicit unit contract between two teams.
11. **Code and specification are mirrors of each other.** When either changes, the other must follow.
12. **AI amplifies what the specification directs.** Without a specification it amplifies whatever preceded the session, including every prior mistake.

## How these relate to the rest of the method

- Principles that can be checked mechanically (4 and 6, for example) belong in [quality gates](../gates/), not in intention.
- Principle 12 is the premise behind the [Andon Method](../andon/): if the machine amplifies what it is directed by, the judge must sit outside it.
