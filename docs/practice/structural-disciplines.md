---
layout: default
title: Structural disciplines
parent: Practice
nav_order: 6
permalink: /practice/structural-disciplines/
description: "Why long-standing structural disciplines (SOLID, hexagonal, TDD, ADRs and others) help an AI reader for the same reasons they help a human one, and the token-cost objection."
---

# Structural disciplines: the same ones that help you help the AI

> In the workshop this is called **Temper** (Stage 4).


SOLID, hexagonal architecture, TDD, ADRs, intentional naming — these existed for 30 years and were never fully adopted because humans couldn't sustain them under pressure. The AI reader that benefits from them is also the executor that enforces them. The friction of adoption disappeared. The benefit doubled.

## Why this matters

The structural disciplines are, in our reading, the core of the practice; the specification, the cascade documents and the verification layer exist to make them sustainable. The structural disciplines below were invented over thirty years to make code legible to the next human reader. A stateless AI reader has the exact same problem: it arrives knowing nothing about what you meant. The disciplines that help the human help the AI — for the same reason, by the same mechanism.

But there is a difference that changes everything. Humans could never fully sustain these disciplines under deadline pressure. The AI reader that benefits from them is also the AI executor that enforces them on every file it touches. The discipline that required willpower is now structural. That is why we treat them as the core: it is where a thirty-year-old promise of software engineering can finally be enforced.

## The Structural Disciplines

Each named for its real origin — and the mechanical advantage it gives the AI reader

Grouped by what they govern. For each: what it does for humans is well known — the column that matters is what it does for the AI reader. (Two notes: the doc-first cascade is GS's own discipline, covered in [New project](../new-project/); hooks and quality gates are enforcement — part of the verification layer (see hardening, below) — not a design discipline, so they are not listed here.)

### Object & Class Design

| Discipline | Mechanical advantage for the AI reader |
| --- | --- |
| SOLID (Martin) — 5 principles: SRP · OCP · LSP · ISP · DIP | The AI reads the contract (the interface), not the implementation. By Single Responsibility, a class is its own complete spec — no call-graph traversal. By Dependency Inversion, coupling is explicit rather than hidden, which removes one common source of hallucinated assumptions about private state. |

### Architecture

| Discipline | Mechanical advantage for the AI reader |
| --- | --- |
| Hexagonal / Clean Architecture (Cockburn; Martin) — ports & adapters + the dependency rule (DIP at architectural scale) | The domain core is isolated from infrastructure behind ports (interfaces); adapters are the glue to the database, UI, and external APIs. The AI reads and changes business logic through the port contract without reading or understanding the adapters — and the same ports let the verification layer drive the domain in isolation, with no real infrastructure. This is the Dependency Inversion Principle applied at the scale of the system. |
| Convention over Configuration / Screaming Architecture (Rails; Martin) | Predictable structure means the AI's first guess about where code lives is right — `controllers/` holds controllers. No discovery traversals; the project layout itself announces its intent. |

### Types & Contracts

| Discipline | Mechanical advantage for the AI reader |
| --- | --- |
| Type-Driven Design (Minsky; King, “Parse, don't validate”) | The type signature is a machine-checked contract — a free harness layer. Illegal states do not compile; every failure mode lives in the type (`Result<T, E>`), not hidden in exceptions. The AI reads the type; the compiler enforces it. |
| Design by Contract (Meyer) | Preconditions, postconditions, and invariants stated inline. The contract is the executable spec the AI generates against and the harness checks — and it is the lineage of the F-NNN specification format itself. |

### Domain Modeling

| Discipline | Mechanical advantage for the AI reader |
| --- | --- |
| DDD — Ubiquitous Language (Evans) | Names in code map to the model's training distribution for the same domain. Higher generation quality, fewer mistranslations between business and code. |
| CQRS (Young) | Reads and writes are separate types. The AI cannot accidentally mutate state in a query path; the intent of each operation is visible in its type. |

### Testing & Specification by Example

| Discipline | Mechanical advantage for the AI reader |
| --- | --- |
| TDD (Beck) | Each test is a behavioral declaration the AI reads before the implementation. Intent is stated, not inferred from existing code. |
| BDD (North) | Given/When/Then scenarios are executable acceptance criteria. The AI generates against the scenario, not against a guess. |

### Code Craft

| Discipline | Mechanical advantage for the AI reader |
| --- | --- |
| Clean Code (Martin) — intentional naming, small functions | `calculateMonthlyCost(userId, period): Result<Money, Error>` — domain, operation, inputs, output, and error contract, all in the signature. The AI reads zero implementation to use it correctly. |
| GoF Design Patterns (Gamma et al.) — named in the spec | The pattern name activates the AI's full trained knowledge of the canonical structure, interface contracts, and invariants. The name IS the specification. |
| Immutability / Functional Core, Imperative Shell (Bernhardt) | No hidden state mutation to track across the call graph. A value object is fully described by its construction; the pure core is trivially testable and side effects are quarantined at the edges. |

### History & Decisions

| Discipline | Mechanical advantage for the AI reader |
| --- | --- |
| Conventional + Atomic Commits | Two disciplines: Conventional Commits standardizes the message (`type(scope): description`) so the git log is queryable and cascade triggers fire from parseable types; atomic commits keep each commit to one logical change, so history is a clean, bisectable, revertible sequence of intent. |
| ADRs (Nygard) | The AI reads the why behind decisions. It cannot "optimize" an intentional tradeoff that looks suboptimal without the context the ADR records. |

> **These disciplines existed for thirty years and were never fully adopted** — not because they were wrong, but because humans could not sustain them under pressure. The AI reader that benefits from them is also the executor that enforces them. The friction of adoption disappeared. The benefit doubled.

## The token question

The one real objection, and why we think the metric is wrong

The most common objection to Generative Specification: it looks token-expensive. You write a specification, cascade documents, and tests — then regenerate code from the spec. Surely that burns more tokens than simply asking the AI to write the code?

We argue the metric is wrong. What matters is not tokens generated — it is tokens per correct, merged line of code. Without a specification, the AI spends tokens on code that gets discarded, on re-explaining context at the start of every cold session, on debugging hallucinations, and on redoing work lost to drift. GS front-loads the spend into a specification written once and read every session, then collapses the waste downstream. The line of code that ships on the first try is far cheaper than the line written three times.

**For a solo developer this barely matters** — your own time dominates the cost. For an enterprise running AI across many engineers, tokens-per-correct-line is a real budget line, and it is where we expect GS to pay off. This is an argument, not a result: the experiment that would measure it is in design.

### Why authored structure may be cheaper: the mechanism

There is a plausible deeper reason GS spends fewer tokens, with independent support from one benchmark in an adjacent task. The sentinel, the CNT, and the cascade documents are, in effect, a **compact knowledge graph of your codebase** — structure authored once. A session *without* that structure must re-read thousands of tokens of code and re-derive the architecture every time. A session *with* it navigates directly to what it needs.

The Yarmoluk–McCreary CKG benchmark (April 2026) compared retrieval from a pre-authored knowledge structure against chunked-prose retrieval (RAG) and re-deriving structure from text each time (GraphRAG), for knowledge retrieval. The authors report a large token saving and an accuracy gain for the authored structure; those are their figures on their task, we have not replicated them, and they should not be read as a measurement of GS on code. The direction is what we cite: when expert structure is authored once, re-deriving it every session is wasted work. The token cost people fear may be less the price of GS than the price of working *without* authored structure, paid again every session.

## Enforce it

The disciplines are enforced by the verification layer, not by willpower. The sentinel (your tool's entry file) names them in its structural-disciplines section. Hooks reject violations before they land. The CI gate fails the build.

## Where to go next

- Generate the sentinel that names these disciplines: [New project, step 4](../new-project/).
- Install the verification layer: [New project, step 5](../new-project/).
- Add non-functional requirement gates on top (Tier 2 hardening): [workshop reference page](https://pragmaworks.dev/harden).
- Measure how legible your code already is to an AI reader: [Diagnose](https://pragmaworks.dev/diagnose).

