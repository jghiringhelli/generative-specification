---
layout: default
title: Run structural gates and remediate
parent: Practice
nav_order: 8
permalink: /practice/structural-gates/
description: "Which structural checks (complexity, duplication, dead code, cycles, layers) to run at which moment (pre-commit, pre-push, CI, weekly review), how to ratchet them on the diff, and how to remediate findings safely."
---

# Run structural gates at the right moment and remediate

This page answers two questions: **when** each structural check should run, and **what happens** when one fails. The checks themselves are listed on [Quality gates](/method/gates/). The system they protect is one that already has a [spec, a sentinel and a verification layer](../remediation/).

## Step 01: run each check at the cheapest moment that still catches it

*A check that is slow or noisy at commit time gets skipped. Put it where its cost is acceptable.*

| Moment | What runs | Blocks? |
|---|---|---|
| Pre-commit (fast, touched files only) | Format, lint, type check, complexity on touched files, import cycles | Yes, but only checks with near-zero false positives |
| Pre-push (slower, the diff against the base branch) | Duplication on changed files against a stored baseline, dead code, layer rules | Ratchet: **new** duplication or **new** unused code blocks; the existing backlog does not |
| Pull request in CI | Full analysis, coverage, mutation testing on changed files, and optionally a server-side analysis such as SonarQube | As the gate table says |
| Weekly gate review | Gate firings, false positives, the whole-repository duplication report; retire or relax gates | A human decision |

Three rules govern the table:

1. **Gate at the diff.** Scope to new and touched code and keep a ratchet, so a legacy backlog does not stop new work.
2. **Only checks with near-zero false positives block.** A new gate starts advisory and is promoted when its false positives are measured and found close to zero. Duplication detection is noisy, so it stays a ratchet on new duplicated lines, not an absolute percentage.
3. **The executor cannot edit the gates.** The gate configuration, the baseline files and any waiver list are outside what the AI (or the developer under time pressure) may change in the same change set. Changing them takes a reviewed decision.

The library holds the matching gates: `cyclomatic-complexity-max-10`, `no-circular-dependencies`, `no-duplicated-code-in-diff` and `no-unused-exports-dead-code`. The library's trigger values are `commit`, `pr` and `release`, so the "pre-push" checks above are wired as `pr` gates in the library and run from a pre-push hook or in CI.

## Step 02: remediate a finding in a loop that cannot cheat

*Refactoring without a behavior check is a rewrite. Do not run this loop unless the behavior oracle exists.*

1. **Write the finding down.** The failed gate produces a file with the rule, the location, the evidence, and the acceptance criterion or non-functional requirement it protects.
2. **Work it in a fresh session** that sees only that finding and the files it names, plus the sentinel.
3. **Run the behavior oracle before and after.** The oracle (Hurl probes, or Playwright for a UI) must pass unchanged. In the SX experiment the Hurl oracle passing 13 of 13 is what showed the change preserved behavior.
4. **Cap the attempts.** After a small fixed number of tries, the executor raises a **Flag** and stops. A human decides. The executor never weakens the gate to make it pass.
5. **Log the remediation** in the Line Log with the time from red to green.

A red gate is an incident, not a state: it has an owner and a time-to-green.

Before you remediate, name the case. If the spec already required the right behavior, a regression test seen failing first is enough and the spec does not change. If the spec was silent, refine it first and derive the test from the new rule. A newly found way around a gate becomes a permanent test case for that gate. [Refine the spec, triage first](/practice/refinement/) sets out the five cases and what a hook can and cannot enforce.

## Step 03: smallest change that works

*Order and the least functional code that does the job are part of the method.*

> « Il semble que la perfection soit atteinte non quand il n'y a plus rien à ajouter, mais quand il n'y a plus rien à retrancher. »
> Antoine de Saint-Exupéry, *Terre des hommes* (1939).

English rendering (a translation, not a quotation from a published English edition): *perfection seems to be reached not when there is nothing left to add, but when there is nothing left to take away.* Translations vary, and the exact wording should be checked against a printed edition before this line goes into a paper.

The practical form is a check at the end of every change, in every recipe:

- **Is anything in this change unnecessary?** Code the feature does not need, a helper with one caller, a parameter no one passes.
- **Did the change add a second copy of something that already exists?** Reuse or extract; do not copy.
- **Did it leave anything dead behind?** Remove what the change made obsolete, in the same change.
- **Is the structure in the place a reader would look for it?** Order is part of the footprint.

What we measured, and what we did not: in the SX experiment, duplicated code cost about 2.4 times the tokens and 3.5 times the edits of the clean twin for the same change, even with a navigation map on both (n=2, one benchmark, one frontier model, so a mechanism, not an effect size). That result concerns duplication. That a smaller footprint is more efficient and clearer in general is a **design principle** of the method, not a measured result.

## Sentinel tooling examples by environment

The sentinel names which command to run and at which moment; the tools below are examples per environment. Tools marked *to verify* should be confirmed against current documentation before you wire them.

| Environment | Duplication | Complexity | Dead code | Cycles and layers |
|---|---|---|---|---|
| TypeScript / JavaScript | `jscpd` | ESLint `complexity` rule | `knip` | `madge` (cycles), `dependency-cruiser` (layers) |
| Python | `jscpd` (multi-language) or pylint duplicate-code check *(to verify)* | `radon`, flake8 `mccabe` (C901) | `vulture` | `import-linter` |
| Java / Kotlin | PMD CPD | Checkstyle or PMD cyclomatic-complexity rules; `detekt` for Kotlin *(to verify)* | *to verify* (IDE inspections; PMD covers only unused private members) | ArchUnit |
| .NET | `jscpd` (C# support) *(to verify)* | Roslyn analyzer CA1502 *(to verify rule id)* | Roslyn unused-member analyzers, for example IDE0051 *(to verify rule id)* | ArchUnitNET or NetArchTest *(to verify)* |
| Go | `dupl` | `gocyclo` or `gocognit`, or via `golangci-lint` | `staticcheck` unused check, or `deadcode` *(to verify)* | The Go compiler rejects import cycles; `depguard` via `golangci-lint` for layers *(to verify)* |

Across environments, a server-side platform such as SonarQube can run the same analyses centrally. Treat it as an integration for a client that already uses it, not a default, and check its current licensing and capabilities first.
