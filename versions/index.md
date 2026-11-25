---
layout: default
title: Versions
nav_order: 9.5
permalink: /versions/
description: "The published versions of the GS rubric and method, with date, commit and what changed. A genspec.json declaration must name a version listed here."
---

# Versions of the rubric and the method

One place lists every version of the rubric and of the method, so that a declaration such as [Built with GS](/badge/) can say exactly which one it used. The same list is in [`versions.json`](https://genspec.dev/versions/versions.json) for scripts and assistants.

**Status: draft. The numbering below is proposed and has not been ratified by the maintainers.**

## The rule

- A **major** version changes when a property is added, removed or redefined, or when how a letter is assigned changes. Declarations made under another major version are not comparable.
- A **minor** version changes when wording, examples or checks are clarified without changing what a letter means.
- Every entry has a date and the commit of this repository where the text is.
- An entry is never rewritten. A change is a new entry.

## Rubric

| Version | Date | Commit | What it is |
|---|---|---|---|
| `rubric-1.0` | 2026-11-25 | `943e9ec` | The seven properties (self-describing, auditable, verifiable, executable, defended, composable, bounded) as written in [The rubric](/method/rubric/), graded A to F, as of a date, a commit and a spec version |

## Method

| Version | Date | Commit | What it is |
|---|---|---|---|
| `method-1.0` | 2026-11-25 | `943e9ec` | The method pages under [The Method](/method/): principles, lifecycle, gates, rubric and evidence, as they stand at this commit |

## How to use it

In a `genspec.json`, write the identifier in the `rubric_version` field, for example `"rubric_version": "rubric-1.0"`. A declaration with a version that is not in this list is not valid. When a new version is published, existing declarations stay as they are: they say which version they followed.

Earlier text that refers to "rubric vX" without a number is read as `rubric-1.0` from this page on.
