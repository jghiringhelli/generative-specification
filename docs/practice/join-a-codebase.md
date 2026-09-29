---
layout: default
title: Join a codebase
parent: Practice
nav_order: 3
permalink: /practice/join-a-codebase/
description: "A read-only, roughly one-hour briefing for someone who just inherited or joined a codebase."
---

# Join a codebase

> In the workshop this is called **Onboarding**.

You inherited a codebase. Or you are returning after leave. Or you are a consultant taking over a system someone else built. You don't need a full audit yet. You need to know **what the project is, how it works, and where to start.**

This is read-only: a briefing, not a remediation. About one hour, no code changes.

## 01. Open your AI assistant in the project root

Any assistant that can read the repository and run `git` works. Do the exploration on a branch, in case the assistant writes notes or memory files into the repo.

## 02. Ask for the onboarding briefing

The discipline here is naming what the briefing must contain, so two AI sessions land on the same shape.

**Prompt: onboarding briefing (edit your role and level)**

```
Onboard me to this project. Use git CLI to create a branch first
(onboarding-YYYY-MM-DD); do not touch main. Then produce an onboarding
briefing at reports/onboarding.md covering:

  My role: [frontend / backend / full-stack / data / devops]
  Experience level: [junior / mid / senior / staff]
  Module I'm starting on: [optional]

  1. WHAT — three sentences naming the project, its users, and the
     business outcome it produces.
  2. ARCHITECTURE — one ASCII or mermaid diagram showing the major
     components and the data flow between them. Cite file:line for
     each component.
  3. CONVENTIONS — naming, file layout, error handling, logging
     format, test style, commit-message style. Each one cited to a
     representative file:line.
  4. WHAT SURPRISES NEW DEVS — the 3-5 things in this codebase that
     look idiomatic but aren't, or that look weird but are
     load-bearing. Cite file:line.
  5. FIRST TASKS — 2-3 concrete suggestions sized to my role and
     level. For each: the files involved, what to read first, rough
     effort estimate.
  6. CHEAT SHEET — environment setup commands, where to find what,
     useful greps. Concrete enough to act on without rereading
     this document.

Cite files and lines liberally. The briefing should be reproducible
by anyone who can read the code; that's the test.
```

## 03. Read the briefing

A markdown file of a few pages, designed to be read in 20 to 30 minutes: architecture diagram, conventions, what surprises new developers, where to start. Every claim cites files and lines, so you can verify it by reading.

## 04. Pick a first task

The briefing ends with 2 to 3 concrete options sized to your role. Pick one and start.

## 05. Optional: team-habit analysis (for takeovers)

If you are a consultant or freelancer adopting a codebase from another team, you also want to know who to trust on which areas and where the recent fires were. The same signals come from `git log` directly.

**Prompt: team-habit section**

```
Append a team-habit section to the onboarding briefing. Compute from
git log of the last 90 days: PR review density per author, regression
test coverage of fix: commits, AI-introduced bug rate (detect AI
co-authorship signals, correlate with subsequent fix: commits within
14 days), commit-size distribution, collaboration adjacency table.
For each metric, one-line interpretation pitched at "who do I trust
on what" decisions. Cite the git log queries used.
```

> Onboarding is read-only and proposes no code changes. If you also want a remediation analysis (what is wrong with this project, what to fix), start with [Existing project](../existing-project/).

## Next

- [New project](../new-project/): spec, cascade, sentinel, verification, build.
- [Existing project](../existing-project/): audit, spec from code, sentinel, verification, remediation.
- [Score a codebase on the seven GS properties](https://pragmaworks.dev/diagnose) (free diagnostic).
