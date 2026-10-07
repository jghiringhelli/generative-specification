---
layout: default
title: Formulas
nav_order: 5
has_children: true
permalink: /formulas/
description: "Copy-paste prompts for using Generative Specification on a project of your own, in English and neutral Spanish: set up the substrate from a spec, adopt it after an MVP, change code with the triage, verify, wire a gate, audit, and run a small experiment. Each with a check that it worked."
---

# Formulas

A formula is a **prompt you paste into your assistant** to do one job of the method on your own project. Each one comes with a way to check that it worked that does not rely on the assistant's say-so. They are written for any assistant that can read and write files and run commands, in English and in neutral Spanish side by side.

> **Status of every formula here: written to the canon, not yet tested in a registered run.** Nothing on these pages is a validated procedure. Only the course practicals (from which some wording is adapted) have been run in the course lab, once each, on a sample project, with one assistant: one observation, not a rate. Where a formula has a lab relative, its page says so. The equations that used to live at this address are now at [Models and equations](/models/).

## Where to start

Most people write the spec, build an MVP, and **then** apply the method. Both orders are covered.

| Your situation | Start with |
|---|---|
| **A.** You have a spec and an empty folder: build the substrate and the code together | [1. Greenfield](/formulas/greenfield/) |
| **B.** You have an MVP that runs: add the substrate without changing what it does | [2. Adopt after an MVP](/formulas/adopt/) |
| You just inherited or joined a codebase and may not change it | [3. Join a codebase](/formulas/join/) |
| Your code has no GS and you want the project to become a greenfield one (code to spec to substrate), or a project has an older GS layout to bring to the current one | [12. Migrate](/formulas/migrate/) |
| You want a first look at the project's health | [9. Audit](/formulas/audit/) |
| You want a program, not the assistant, to say which of the twelve items are there and work | [13. Verify the substrate](/formulas/verify-substrate/) |

## The formulas, in the order a project lives

| # | Formula | Use it when |
|---|---|---|
| 1 | [Greenfield: spec to substrate and code](/formulas/greenfield/) | Path A. You wrote the spec; nothing else exists |
| 2 | [Adopt after an MVP](/formulas/adopt/) | Path B. The code exists |
| 3 | [Join a codebase (read-only)](/formulas/join/) | You need to understand it before touching it |
| 4 | [Refine and ratify](/formulas/refine/) | The spec is thin, or a check failed because it was silent |
| 5 | [Change: feature, fix, refactor](/formulas/change/) | Every change after the substrate exists, with the triage (a to e) for fixes |
| 6 | [Verify a use case in layers](/formulas/verify/) | "Tests pass" is not enough |
| 7 | [Wire a gate, red then green](/formulas/gate/) | To make a rule mechanical, one gate at a time |
| 8 | [Lock and co-change gate](/formulas/lock/) | Day 7 to 30, once there is code with ids. Installs the reference tool in `tools/gs-lock/` |
| 9 | [Audit: the free scorecard](/formulas/audit/) | A first look, or before and after |
| 10 | [Self-experiment: before and after](/formulas/experiment/) | You want to see what it did on your own project |
| | [Substrate checklist](/formulas/substrate-checklist/) | The twelve items the formulas aim to produce, as machine-checkable definitions |
| 12 | [Migrate](/formulas/migrate/) | A: existing code becomes a recovered spec and a characterization suite, then a greenfield substrate, equivalence checked by a program. B: an older GS layout to the current canon |
| 13 | [Verify the substrate](/formulas/verify-substrate/) | After any of the above: a program checks the twelve items and the assistant pastes its raw output |

## How to run a formula

1. **Open a fresh session in the project folder.** A session with a long history carries decisions the files do not. Fresh is the point.
2. **Fill the `[brackets]`**, paste the whole prompt, and read what comes back. Answer the stops: where a prompt says STOP it is waiting for your ratification.
3. **Keep everything in the project**, in files and commits, not in the chat. A session forgets; the repository does not.
4. **Run the check on the page yourself.** The assistant's report is a claim; the check is the evidence.
5. **One run is not a rate.** Language models are not replicable. Your run will resemble another, not equal it. If it matters, run it twice and keep both.
6. **The assistant never ratifies.** Every prompt tells it so. Ratifying criteria, changes and decisions is a person's act.

The prompts are tight on purpose: a prompt that tries to say everything is a harness that degrades the agent it was meant to steer. If something is missing for your stack, add one line, not a section.

## One text for the triage

Formulas [1](/formulas/greenfield/), [2](/formulas/adopt/), [5](/formulas/change/) and [12](/formulas/migrate/) (case B) each carry the five-case triage block, so each prompt works alone. The canonical text is on the [refinement page](/practice/refinement/); if the copies drift, that page wins. The block ends every sentinel these formulas write.

## The audit is not copied here

The audit prompt stays at [pragmaworks.dev/audit](https://pragmaworks.dev/audit) until a coordinated release aligns it with the canon. [Formula 9](/formulas/audit/) says how to run it and how to check the result; it does not fork the text.

## What this section does not do yet

- **No formula for the lock without the substrate.** The [spec lock](/method/coherence/) is design status as to its effect; formula 8 installs a reference implementation (`tools/gs-lock/`, tested on its own scenarios, never run on a model-written project in a registered run).
- **No Value Ledger, no maturity levels, no governance claim.** A scorecard letter is not "governed".
- **No production-hardening formula.** Hardening lives at pragmaworks.dev with an untested label. [Migrate](/formulas/migrate/) case A has development runs only, case B none.
- **Two small tools, no package.** `tools/gs-lock/` (the lock and the co-change gate) and `tools/gs-check/` (the checker of the twelve items) are single files for Node, MIT, with their own tests. Older pages that depended on a retired tool are marked superseded (see [Recipes](/docs/recipes/) and [Templates](/templates/)).

## Licence and language

The prompt text on these pages is offered under the **MIT licence**. That is the default for now: the licence for prompts is a pending decision and may change before the coordinated release. The rest of this site is under CC BY 4.0. Spanish is written in a neutral register, with tuteo and no regional idiom; the words a check reads (`OPEN:`, `verified by:`, `Derived from:`, table column names) stay in English in both versions. The sentinel is called the *centinela* in Spanish, as in the course kit.
