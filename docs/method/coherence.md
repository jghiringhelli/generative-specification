---
layout: default
title: Coherence between spec and code
parent: The Method
nav_order: 10
permalink: /method/coherence/
description: "Five checks that detect when a specification and the code stopped saying the same thing: identifiers in both directions, the lock (tags in code, hashes in a file), a co-change gate, an inverse inventory and an intent diff. A design verified on one sample project."
---

# Coherence between spec and code

> **Status: design.** The five checks below were implemented as deterministic scripts, with no model, in one sample project, and verified on 35 crafted scenarios and on the recorded states of that project. That shows they detect what they are defined to detect. It does not show that they reduce defects: no effect was measured. The definitions are in the Compendium, Section 8.20.

## The problem

A specification and the code under it can stop saying the same thing without anyone deciding that they should. A rule is reworded and the old test keeps passing. A patch is made by hand on a Friday afternoon. A route is built that no document claims.

This is a problem of **verification**, not of generation. It does not matter how the code was generated. What matters is to detect that the code and the document no longer coincide. That is cheaper than controlling generation, and it is where GS already lives: artifacts in the repository and checks outside the model.

The mechanism cannot live in the session. A mechanism that lives in a session is a habit, because the session forgets. It has to live in files and in the continuous integration that runs on the shared branch. This is the same idea as guides and sensors in the [lifecycle definitions](/method/lifecycle/): the guide asks, the sensor checks.

## The five checks, from the cheapest to the strongest

1. **Identifiers in both directions.** Every acceptance criterion has an identifier. The forward direction (every criterion has a passing check) is [criteria coverage](/method/lifecycle/). The inverse: every test that cites an identifier cites a live one. A test whose criterion was retired is an *orphan*: it passes, it is green, and it proves something that is no longer asked. A few lines of script find it.
2. **The lock.** Each *living* derived artifact (a test, a module document, a source file that implements a rule) carries a stable tag in a comment, `@gs F-007.R1 docs/spec/F-007.md#rules`: the criterion or rule it derives from and the spec section, **and no hash**. A spec change never forces an edit in the code, and a comment never changes behavior (verified: the transpiled JavaScript is identical with and without the tags, and the tests and the type check give the same result). The hashes live in one file, the lock (`docs/spec.lock`, one line per spec section and per artifact): the hash of each section after normalization (markup, list markers, tick state and whitespace removed) and the hash each artifact was derived against. A check recomputes the section hashes. If the section changed after the artifact, the artifact is *stale* and the build does not pass until it is regenerated or re-ratified. It is a lockfile for specifications. The tag also helps the executor, human or model, relate code to the spec and to the cascade documents; that benefit is a hypothesis, not a measurement.
   - **Records are not locked.** An ADR or an EDR is append-only. It is superseded, not regenerated.
   - **The escape path leaves a trail.** For a cosmetic change you do not switch the check off: you run a ratification, which needs a reason and appends who, when and why to a record that only grows.
   - **An agent could run that command.** The real enforcement is a human review of that record on a protected branch (for example, required review by the owners of the file), because a local hook can be skipped.
3. **Co-change gate.** A commit that changes behavior cites a criterion identifier, or stages the spec change that is its citation, or declares itself a refactor. A refactor must pass the tests of its **parent commit, unchanged**, against the new source. This is stronger than forbidding edits to test files: that rule would forbid a rename that needs an import change in a test, and it would let a behavior change hide inside the source. It is only as strong as the tests: a change at an edge that no test pins passes as a refactor. The remedy is a criterion and a test at that edge, not a cleverer check.
4. **Inverse inventory.** Enumerate the public surface (routes, exported symbols, commands, tables) and check that each element is claimed by some identifier or rule of the spec. An unclaimed element was built and never specified. It needs an adapter per stack, so it starts as a report.
5. **Intent diff in the review.** Not a gate: a report for the person who signs. It lists the criteria touched, the derived artifacts that became stale, and the criteria that have no test, marking those that are ticked. It is cheap, and it is what the signer looks at.

## What was found when they were built

- A typo fix in a criterion is a change: derived artifacts go stale and need a ratification. The tool cannot tell a typo from a change of intent, and that is the price.
- Inserting a criterion before another shifts positional identifiers and makes later artifacts stale, with a confusing message. Explicit, stable identifiers per criterion would be better. Not built.
- In the sample project the public symbols were all unclaimed, because the specs name behaviors, not symbols. Expect a first-run triage and keep it a report.
- The refactor proof is as strong as the tests: moving a refund window from 24 to 12 hours passed, because no test pinned the edge.
- The lock merges worse than a dependency lockfile. Two branches that edit different sections of the spec still conflict in the lock on neighboring lines; a `resolve` command keeps both sides with their real hashes. The ratification record merges without conflict (union merge). Two branches that edit the same section conflict in the spec text itself, which is correct: a person decides.
- The tag carries no hash, so it can lie by omission: a file tagged with a rule it never implemented stays current. The lock says which spec version the file was derived against, not that it satisfies it. That is the work of the tests.

## What it does not do

- It detects that the spec and the code stopped coinciding. **It does not detect that the spec is wrong.** That is the [triage of a failure](/practice/refinement/) (cases b and c).
- It does not detect a test that proves nothing. That is the work of mutation testing and live probes.
- The granularity of the hash decides what it catches. A smaller section means fewer false alarms and more artifacts to stamp.

## Install

The scripts are in the course repository, in the sensors kit for Node and TypeScript: `media/curso-gs-v2/materiales/sensores/node-typescript/scripts/sensors/` (`orphan-tests.mjs`, `lock.mjs`, `tag-neutrality.mjs`, `commit-cascade.mjs`, `refactor-check.mjs`, `surface.mjs`, `intent-diff.mjs`), with its README. They were verified in one Node and TypeScript project; other stacks need their own route reader and test runner. The kit's self-test uses the sample project's files: adapt the paths.

See also: [Lifecycle and debt](/method/lifecycle/), [Refinement](/practice/refinement/), [Quality gates](/method/gates/).
