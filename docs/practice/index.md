---
layout: default
title: Practice
nav_order: 4
has_children: true
permalink: /practice/
description: "Tool-free, paste-and-run guides for applying Generative Specification: a new project, an existing one, joining a codebase, migrating a stack, and the disciplines that hold it together."
---

# Practice

[The Method](/method/) says what the pieces are. These pages say what to do on Monday morning. Each one is a sequence of steps with copy-paste prompts for any AI coding assistant. None of them needs a particular tool.

## Pick your path

| Your situation | Start here |
|---|---|
| Empty folder, new idea | [New project](new-project/): interview, spec, cascade documents, sentinel, verification, first feature |
| A codebase that exists and needs discipline | [Existing project](existing-project/): cold read, audit, spec from code, sentinel, verification, oracle tests, remediation |
| You inherited or just joined a codebase | [Join a codebase](join-a-codebase/): a read-only, one-hour briefing |
| Moving a system to a new stack | [Migrate to a new stack](migrate-stack/): audit the source, refine, bootstrap the target |
| Not sure what you have | [Orient](orient/): read what exists, or ground the idea before specifying |
| Want the reasoning behind the structure | [Structural disciplines](structural-disciplines/) |
| Existing system already under spec and verification | [Remediate an existing system](remediation/) |
| Structural checks (complexity, duplication, dead code, cycles) at the right moment | [Run structural gates and remediate](structural-gates/): pre-commit, pre-push, CI, and a safe remediation loop |
| A check failed or a rule was missing, and you need to decide whether the spec changes | [Refine the spec, triage first](refinement/): five cases, a regression test is enough for some, and what a hook can and cannot enforce |

New to the whole thing? Grade a codebase first with the free audit at [pragmaworks.dev/audit](https://pragmaworks.dev/audit), then pick a row above.

## The stages, in neutral names

The flow has the same shape on every path. The workshop at [pragmaworks.dev](https://pragmaworks.dev) uses a metalworking vocabulary for the same stages; these pages use plain names.

| Stage here | What happens | Workshop name |
|---|---|---|
| Orient | Read what exists, or make the idea concrete | Heating |
| Specify | Spec, cascade documents, sentinel | Mold |
| Build | Verification layer in place, features built under it | Temple |
| Disciplines | Structural disciplines applied and enforced | Temper |
| Harden | Non-functional gates on top of the structure | Harden |
| Remediate | Oracle tests, prioritized fixes, incremental replacement | Anneal |

## Relation to the workflow recipes

The [workflow recipes](/docs/recipes/) cover similar ground as tool-call sequences for [ForgeCraft](https://github.com/jghiringhelli/forgecraft-mcp). The pages here are the tool-free versions, written as prompts you paste into any assistant.

| Practice page | Overlapping recipe |
|---|---|
| [New project](new-project/) | [New project, no spec](/docs/recipes/new-project-no-spec/) and [with spec](/docs/recipes/new-project-with-spec/) |
| [Existing project](existing-project/) | [Brownfield new feature](/docs/recipes/brownfield-new-feature/) |
| [Join a codebase](join-a-codebase/) | [Project takeover](/docs/recipes/project-takeover/) |
| [Migrate to a new stack](migrate-stack/) | [Migration](/docs/recipes/migration/) |

## Where the concepts are defined

The pages here use, and do not redefine, the terms defined in [The Method](/method/): the [rubric](/method/rubric/), [spec completeness](/method/spec-completeness/) and the [quality gates](/method/gates/). Choose the recipes if you already use ForgeCraft, and these pages if you don't.
