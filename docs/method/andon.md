---
layout: default
title: The Andon Method
parent: The Method
nav_order: 6
permalink: /method/andon/
description: "A proposed method for software built by the machine and judged by the people: state the intent, derive the system, stop the line on a failing check. A thesis and a set of principles; a team process is not yet defined."
---

# The Andon Method

*The rigor we could never afford may finally be cheap to attempt. A method for software built by the machine and judged by the people.*

> **Status: proposed.** This page states a thesis and ten principles. It is not yet a process a team can follow the way a team follows Extreme Programming, which comes with named practices, artifacts and ceremonies. What exists and what is missing is set out in [the last section](#what-exists-and-what-does-not). The evidence behind the thesis is bounded on the [evidence page](../evidence/).

## The graveyard

Three methods, invented separately, decades apart.

**Cleanroom** (Harlan Mills, IBM, 1980s): specify each unit precisely, verify it by disciplined human review before the code runs, and certify the result by usage-based statistical testing instead of hope. On a handful of IBM and NASA projects it produced defect rates most teams never see. It faded: it asked more sustained discipline than teams would give, and it arrived just as iterative, test-first practice was winning the culture.

**Correctness by Construction** (Praxis, in SPARK/Ada): write a formal specification, refine it toward code, and let a prover discharge whole classes of error, such as no runtime exceptions and contracts satisfied. Used where failure is not an option (the C-130J avionics; the Tokeneer secure-station study for the NSA). It worked for decades and stayed boutique, because writing the contracts and finding the invariants took engineers there were never enough of.

**The B-method**, which still runs a driverless line under Paris: prove the refinement from abstract model to implementation, then generate the code from the proven implementation. Line 14 (Météor, 1998) is about 110,000 lines of B model refined to about 86,000 lines of Ada, a project-reported record (we have not independently checked it) of no defect found in operation since it opened.

They differ in one way that matters later. Cleanroom certifies partly by human review and partly by statistics, while Correctness by Construction and B certify by mechanical proof a machine can check. But all three share one sequence: state the intent precisely, derive the system from it, certify by evidence and not by confidence. Each was buried for the same reason. Not that it failed, but that the human labor it demanded outweighed what that labor was worth.

## The cost was never fixed

Some methods are known on paper long before they are usable. Monte Carlo was described in the 1940s and waited for a machine to run it; when the machine came, the method did not change, its cost did. (The caution is real too: Richardson computed a weather forecast by hand over six weeks in 1922 and got it wrong, for reasons speed alone would not have fixed. Affordability opens a method; it does not, by itself, make it correct.)

The graveyard disciplines also demanded careful labor: writing specs, finding invariants, building test harnesses, discharging proof obligations, in ruinous quantity. Much of that labor is authorship, and authorship is what an executor can now draft cheaply. That is the wager of this method, and we intend to measure it, not assert it: that cheap authorship moves these disciplines from boutique to ordinary. The measurement is the pre-registered [revival grid](https://github.com/jghiringhelli/generative-specification/blob/main/experiments/revival/PREREGISTRATION.md), which has not been run yet. Two pilots so far point the same way and no further: benefit follows exposure to the failure, not cost alone (see [evidence](../evidence/)).

## The machine does not certify itself

Generation is cheap; assurance is not cheap by the same act. A model can draft a spec, propose an invariant, even propose a proof, and do each of those wrongly while looking right. So the executor writes and something else judges: a sound checker, a type system, a test oracle, a prover discharging obligations, a statistical test against a real usage profile. The guarantee lives in the gate, never in the author. When we say rigor is cheap, we mean the writing is cheap and the checking is automatable, not that the model's confidence counts as proof. This is the [externalized guarantee](/evidence/#the-papers) of the paper tree.

## Toyota already named it

*Jidoka*: automation with a human touch. Sakichi Toyoda's loom stopped itself the moment a thread broke; Taiichi Ohno generalized it to a line any worker could halt by pulling the andon cord. Here the executor is the machine, the gate is the cord that stops the line, and the human judges and lets it run again.

## We value

- **A specification the system is built from**, over documentation written to describe it afterward.
- **Correctness a machine can check**, over correctness a person asserts.
- **A machine that stops itself**, over a team that pushes through.
- **Human judgment at the gate**, over human labor at the keyboard.
- **The rigor we can now attempt**, over the speed we never made safe.

## Principles

1. The specification is the source of truth.
2. The machine builds; the human judges.
3. A failing check stops the line.
4. Correctness is built in and checked by a machine, not inspected in by eye.
5. Independence is mechanical: nothing passes on a single reading or a single model. Use different checkers (proof, tests, types, runtime), not repeated passes of the same one.
6. Irreversible actions require a human signature.
7. Every escaped defect becomes a permanent check.
8. Reliability is certified by measurement against a real usage profile, not asserted by confidence.
9. The rigor matches the stakes.
10. The claims are held to the same standard as the code: what is proven we state as proven; what we are still measuring we state as hypothesis.

## What this is not

Not Waterfall, whose rigor was front-loaded and could not adapt. Not Agile, which traded rigor for the freedom to move because rigor cost too much. The graveyard methods were right and they were early: what had not been built was a machine that makes their authorship cheap. The machine that checks a proof already existed; what was missing was a cheap way to write what it checks.

## What exists and what does not

Extreme Programming became a method a team could adopt because it shipped a complete kit: named practices, the artifacts they produce, and the ceremonies that give a team its rhythm. This method does not have that yet, and it would be a mistake to pretend it does.

**What exists.** Each of these is defined and, at some level, tested:

- the [substrate](/#the-core-in-five-lines): a specification, the sentinel that routes the assistant to it, and the gates and verification that stop the line;
- the [rubric](../rubric/), which scores whether a project's substrate is in the condition a stateless reader needs;
- the [quality gates](../gates/) and the [gate library](/quality-gates/), which are the andon cord in practice;
- decision records and commit conventions, which are the audit trail;
- the [experiments](../evidence/), which say what has and has not been measured.

**What is missing.** A team-level process: who holds which role, what the cadence is, which artifacts are produced at which step and reviewed by whom, what the recurring ceremonies are, and, above all, evidence that a team other than the author's can run it and get the results reported here. The experiments so far are proponent-authored and were run by one practitioner. Whether a team can follow this method is an open question, not a finding.

**How it will be settled.** By designing the team process explicitly (artifacts and ceremonies), trying it with a team that is not its author, and reporting the result, including a negative one. Until then, treat the principles above as a position to test against your own work, and the substrate and rubric as the parts you can use today.
