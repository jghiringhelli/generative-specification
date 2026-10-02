---
layout: default
title: Full program outline (earlier draft)
parent: Learn
nav_exclude: true
search_exclude: true
nav_order: 5
permalink: /method/course-full/
description: "GS Core: the open path into Generative Specification. Sixteen short theory lessons intercut with five hands-on labs, ending with a small project running under the method."
---

# The course: GS Core

> **Earlier outline.** This is the first outline of a longer program. It is in preparation and the lesson list may change. The short, free course is on the [course page](/method/course/).

The open path into the method. Sixteen short theory lessons intercut with five hands-on labs. You do not need the course to benefit from the work (a [readiness assessment or remediation](https://pragmaworks.dev/services) puts the method on your codebase for you), but if you want to practice it yourself, this is the way in.

## What you finish with

A small project running under Generative Specification:

- **A spec written before the code.** The WHAT, stated as business rules and testable acceptance criteria, before the machine builds anything.
- **A sentinel that routes.** The root file that tells the assistant what the system is, which standards apply, the constraints, and where to read next.
- **A gate that stops the build.** A non-LLM check that turns a written rule into something the build can refuse.
- **The rubric applied.** Your spec scored against the [seven properties](../rubric/), by a reader that has only the spec.

## Who it is for

Developers and tech leads who already work with an AI assistant and want the discipline behind it. Bring a small project, or use *Cancha Libre*, a small public court-booking app you download and repeat step by step: [github.com/jghiringhelli/cancha-libre](https://github.com/jghiringhelli/cancha-libre). Each lab closes with one question to ask your AI, and you can run the same steps on your own codebase.

Bringing a legacy codebase? That has its own path in the [workflow recipes](../../docs/recipes/); the course builds the muscle on a small project first.

## What is published today

| Item | Status |
|---|---|
| [Course index](https://pragmaworks.dev/course) | Published |
| [Lab 1: Turn the order around](https://pragmaworks.dev/course/lab-1) | Published (steps, prompts and the spec file from the recorded session) |
| Labs 2 to 5 | Written as scripts; dedicated lab pages ship alongside each lab video |
| Lesson videos | **Being published.** No lesson video is linked here until it is live |
| [Field testimonials (video)](https://www.youtube.com/playlist?list=PLFeJjg91nGzg) | Published |

The lesson scripts are written in Spanish first; the English edition is in preparation.

## The syllabus

Lessons are marked **C** (theory) and **P** (practice lab).

| # | Title | What it covers |
|---|---|---|
| P0 | Prepare your project (optional) | Pick your lane: follow along on Cancha Libre, or prepare your own project |
| C1 | The $327 million contract | The Mars Climate Orbiter loss as a case of a contract nobody could ratify |
| C2 | The inversion | Build top-down: write the what, let the machine derive the how |
| C3 | Why only now | Spec-driven development is old; what changed to make it viable |
| P1 | Turn the order around in ten minutes | Lab: the same request with and without a written spec |
| C4 | The discipline that combines | What GS takes from waterfall (rigor) and from agile (iteration) |
| C5 | The substrate | The retrieve, generate, verify loop and what the assistant stands on |
| C6 | The loop and generative execution | The AI brings up the live system and checks a use case layer by layer |
| C7 | Phase collapse | Specify, implement and verify stop being separate phases |
| P2 | Make the AI test your live app | Lab: generative execution on a running app |
| C8 | Leave nothing to chance | Why "the AI cuts corners" is often an under-specification problem |
| C9 | The ratchet | Every miss leaves something permanent; a defect is a query to the spec |
| P3 | One MUST, one gate, one turn of the ratchet | Lab: turn a written rule into a check that stops the build |
| C10 | The bridge and the asymmetry | Why the model follows a structured spec, and why reading is easier than writing |
| C11 | The disciplines that activate | Name SOLID, hexagonal, TDD in the spec to invoke what the model already knows |
| C12 | The sentinel | The root file: what belongs in it and why size matters |
| P4 | Your sentinel in fifteen minutes | Lab: write and test your root file |
| C13 | The layers that rise | One spec, verified differently at each environment |
| C14 | The rubric | The seven properties and the stranger test |
| P5 | Score your spec | Lab: a reader with only your spec scores it |
| C15 | What you're buying | What changes in value and in cost when the specification is the work |
| C16 | What is left to you | Specify, generate and verify are one movement; what stays human is turning a conversation into a complete spec, and signing off on the evidence |

## After the course

- [The rubric](../rubric/): the seven properties in full, with the failure named for each.
- [Spec completeness](../spec-completeness/): when a spec is complete enough for a stateless reader.
- [Quality gates](../gates/): the non-LLM checks that make it enforceable.
- [Workflow recipes](../../docs/recipes/): the method on a real project, greenfield or existing.
