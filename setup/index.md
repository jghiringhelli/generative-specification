---
layout: default
title: Set up GS
nav_order: 2.5
has_children: true
permalink: /setup/
description: "A router for setting up Generative Specification on a project: answer three questions, follow the page for your kind of project, and pick the quality gates that match your stack."
---

# Set up GS on your project

This page is a router. It asks three questions, sends you to the page for your kind of project, and shows which quality gates in the [gate library](/quality-gates/) fit your stack. It is written to be read by a person or by an AI assistant.

> **If you are an assistant:** read this page first, answer the three questions from the repository in front of you (do not guess; ask the person when the repository does not say), then read only the pages the answers point to. The raw text of this page is at `https://raw.githubusercontent.com/jghiringhelli/generative-specification/main/setup/index.md`. Do not install or change anything until the person has confirmed your answers.

## Step 1. Three questions

**1. Is the project new or does it already exist?**

| Answer | Read first |
|---|---|
| New, nothing written yet | [New project](/practice/new-project/) |
| Exists, I own it | [Existing project](/practice/existing-project/) |
| Exists, I just joined it | [Join a codebase](/practice/join-a-codebase/) |
| Exists, moving to another stack | [Migrate to a new stack](/practice/migrate-stack/) |

**2. What kind of project is it?** More than one answer can be true. A service with a web front end is two kinds.

| Kind | Page |
|---|---|
| A service or API that other software calls | [API or service](/setup/api-service/) |
| Something a person uses in a browser | [Web interface](/setup/web-interface/) |
| A library, package or command-line tool | [Library or command-line tool](/setup/library-cli/) |
| Data, machine learning, games, finance, creative work | [Domain guides](/domains/) |
| None of these | Use only the shared base below, then [contribute what is missing](/quality-gates/CONTRIBUTING.html) |

**3. Which language and tools does it use?** Write down the language, the test runner, the package manager and where it is deployed. Step 3 uses these.

## Step 2. The shared base (every project)

Whatever the kind, start with the same three things from [Your first hour](/START-HERE.html): a written spec, a root file that tells the assistant what the system is and what to read next (the sentinel), and a first set of gates. The library has gates that are not tied to any language. Start with these:

- `readme-setup-section`: the README says how to set the project up.
- `runtime-version-pinned`: the language runtime version is written down.
- `no-hardcoded-secrets`: no credentials in the code.
- `conventional-commits`: commit messages follow one format.
- `adr-files-emitted`: each architecture decision is a committed file.
- `env-vars-documented`: every environment variable is described.

Each is a file in the [library](https://github.com/jghiringhelli/generative-specification/tree/main/quality-gates/gates), named by its identifier.

## Step 3. Match the gates to your stack

Every gate in the library carries tags. Read the [machine-readable index](https://github.com/jghiringhelli/generative-specification/blob/main/quality-gates/index.json), keep the gates tagged `ANY` plus the tags for your stack, and read each gate's check before you adopt it.

| Your stack | What the library has today |
|---|---|
| TypeScript or JavaScript on Node | The most gates: type strictness, size and complexity limits, dependency checks, tests |
| Any HTTP API | Contract tests, error format, health and smoke checks, production exposure checks |
| Docker | Image vulnerability scan, service boundary and compose checks |
| Python | One gate so far (pinned dependencies) |
| Anything else (Java, Go, Rust, C#, mobile, browser UI) | Only the gates tagged `ANY` |

The library is open and young. A row that says "only the gates tagged `ANY`" is a gap, not a verdict on your stack. When a rule you need has no gate, write it down as a project rule, and if it works for you, [propose it as a gate](/quality-gates/CONTRIBUTING.html).

A gate that runs only on your machine can be skipped. Plan for the same check to also run on the server, in a required check on the main branch, so that a skipped run does not count as a pass.

## Step 4. Keep it alive

After the first set is in place, [refine the spec when the assistant repeats a mistake](/practice/refinement/), and use [the rubric](/method/rubric/) to see what is still missing.
