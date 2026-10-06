---
layout: default
title: Spec completeness
parent: The Method
nav_order: 2
permalink: /method/spec-completeness/
description: "A specification is complete when a stateless reader can derive the right program from it alone. What a complete spec must carry, what it must not, a self-test, a feature template and an audit prompt."
---

# Spec completeness

Completeness is not length. A specification is complete when a **stateless reader can derive correct output from it alone**, which is the same as saying it **closes the output space to the correct programs**. A model can generate any of a vast space of programs. Every constraint in the spec narrows that space; every degree of freedom left open is a place the reader fills arbitrarily. Restriction is not bureaucracy. It is how correctness becomes the only thing left to generate.

**Assume nothing, but do not specify the how.** Specify intent and constraint, and let the executor derive the implementation.

**What the evidence says, with its bound.** In RND-1, a descriptive, ambiguous spec floored the model to the literal minimum (0 of 3 runs matched the held-out intent), while a prescriptive spec with postconditions recovered the full intent (3 of 3), at equal token cost. That is n=3 on one benchmark, single-shot, proponent-authored. It supports the direction, not a magnitude. The [evidence page](../evidence/) has the full bound. The [expected-cost relation](/models/) I ∝ (1 − S) / S is the mental model behind this: the more of the output space the spec leaves open, the more correction cycles to expect. It gives a direction only, with no constant.

---

## What a complete spec must carry

1. **Identity and boundary.** What the system is, and what it is not. Names announce the domain (screaming architecture). Properties: Self-describing, Bounded.
2. **Normative acceptance criteria per feature.** Phrase each requirement with RFC 2119 keywords (**MUST / SHOULD / MAY**). Every MUST is an acceptance criterion and therefore a probe. Not "the actor needs to see data" but "the endpoint MUST return counts aggregated by type." Property: Verifiable.
3. **Closed decisions, with their why.** Record architectural choices as ADRs or EDRs. An open decision is a degree of freedom the reader will fill. Property: Auditable.
4. **Contracts.** Types, interfaces, error contracts, and tests-as-spec that pin behaviour. Properties: Verifiable, Composable, Executable.
5. **Constraints and prohibitions.** The inviolable rules and forbidden patterns, each tied to a real past incident where possible. Property: Defended.
6. **Navigation.** The [sentinel](/#the-core-in-five-lines) routes the reader to the right slice for each concern. Properties: Self-describing, Bounded.
7. **Verification hooks.** How each obligation is checked: the [gates](../gates/) that verify it.

A specification that only names a hook is not a hook that exists. In the AX series, the three pre-registered conditions all scored 0/2 on Defended because the spec described enforcement infrastructure that the model never emitted. It moved to 2/2 once the spec named the files to emit, with fenced templates (a post-hoc change, one model, one benchmark). If an obligation needs an artifact, name the artifact.

The ALX experiment gives a formal-tier view of what "complete" means. The first derivation of a compiler from a formal spec scored 0.000 because the spec named functions where the tests imported public structs and module paths it never declared. Each correction was a spec addition, not a code patch, and the run reached 386/386 acceptance tests over six phases. The classes of detail that were missing (public API surface, naming conventions, recursive type representations, parameter-name preservation) are a checklist of what a machine-derivable spec must state. One artifact, one author.

## What a complete spec must not carry

Over-specification is a failure mode too.

- **The how.** The implementation procedure. The executor derives it; specifying it removes the leverage and ages badly.
- **Over-marking.** Do not keyword every sentence. Mark the load-bearing obligations only.
- **Restated defaults.** Do not spell out what the activated domain schema already implies.

Both over-marking and restated defaults are the same over-building that degrades any bounded artifact: a spec that outgrows the assistant's read budget is, to the executor, one that does not exist. Match the specificity to the stakes.

## The self-test

Per requirement, ask:

- If I handed only this to a stranger with no context, could they build the *right* thing, or would they guess?
- Where would they guess? That gap is the missing constraint. Add it. (This is the specification-query move.)
- Is any acceptance criterion missing a MUST, SHOULD or MAY? Is any decision still open? Is anything here the *how* that should be derived instead?
- For every past defect: state the constraint that, had it been present, would have ruled it out. Add that constraint to the spec.

To report completeness at a point in time, as three separate numbers (criteria coverage, open questions, places a stranger guessed), see [Lifecycle and debt, section 6](../lifecycle/#6-spec-completeness-three-numbers-kept-apart). It is a snapshot, not a proof, and it does not measure what nobody has thought of.

---

## Template: a complete feature spec

```
# F-NNN: <feature name>
Intent: <one sentence: what this must achieve, in domain terms>
Scope: <what is in / explicitly out (Bounded)>

Acceptance criteria (normative, each a probe):
- MUST <observable, checkable behaviour>
- MUST <...>
- SHOULD <defeasible; deviation needs a recorded reason>
- MAY <permitted, ungated>

Contracts:
- types/interfaces: <signatures, error contract, e.g. Result<Money, Error>>
- tests-as-spec: <the behaviours pinned by tests>

Decisions (ADR/EDR refs): <closed choices + why; "chose X over Y because ...">
Constraints/prohibitions: <inviolable rules, forbidden patterns, tied to incidents>
Verification: <which gates check this; see the gates page>
Routing: <where this lives in the sentinel tree>
```

Keyword only the load-bearing lines. If a stranger could still guess wrong, a constraint is missing.

---

## Audit-and-complete prompt

Point an AI at a specification together with this page.

> **Role.** Audit this specification for *derivability completeness* and complete it, without over-specifying.
>
> **Read.**
> - This page: <https://genspec.dev/method/spec-completeness/>
> - The Field Guide: `docs/white-paper/GenerativeSpecification_FieldGuide.pdf` in the repository
> - The specification to audit: `<FULL PATH TO THE SPEC>`
>
> **Do, in order.**
> 1. For each feature or requirement, flag any that lacks a **normative acceptance criterion** (MUST / SHOULD / MAY). Propose one.
> 2. Find the **degrees of freedom**: places where a stateless reader would *guess*. List each as a specification-query: the missing constraint that, once present, would close the space.
> 3. Flag **open decisions** that belong in an ADR or EDR with their *why*.
> 4. Flag **missing contracts** (types, tests-as-spec).
> 5. Flag **over-specification**: anything that is the *how* (an implementation procedure) that should be derived, or excess keywording. Propose cutting it.
> 6. Return (a) the gaps as specification-queries, (b) the **completed** spec (descriptive turned prescriptive where needed), (c) a note on what you cut as over-specification.
>
> **Rule.** Completeness means closing the output space to the correct programs, not length. Assume nothing, but do not specify the how. Precise technical voice, no filler.

---

**Next:** [The rubric](../rubric/) · [Quality gates](../gates/) · [The evidence](../evidence/) · [The course](../course/)
