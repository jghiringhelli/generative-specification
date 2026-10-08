---
layout: default
title: Scale-adaptive depth
parent: Practice
nav_order: 11
permalink: /practice/scale-adaptive-depth/
description: "How much of the method a change needs, from the size and risk of the change and of the project: a tiny change goes through on automatic checks, a normal change needs a spec delta and the gate, a risky change needs a named person. A 30-second decision table, the three installer levels, and what is enforced versus only asked. Design, installer tested, not yet in a registered run."
---

# Scale-adaptive depth

**Status: design, installer tested, not yet in a registered run.** The installer (`tools/gs-init/`, 19 tests on Windows and in a Linux container, no model) writes the three levels below. Nobody has yet run this triage on a model-written project and registered what happened, and nothing here shows that right-sizing the method saves cost or raises quality. Read "What this does not show" before relying on the numbers in the table: they are defaults chosen by the author, not measurements.

## The idea

The whole method on a one-line typo fix is waste, and a typo-sized process on a change to the login code is negligence. The depth of the method should follow the size and the risk of the **change**, and the weight of what you install should follow the size and the risk of the **project**. Both are the same dial turned in two places: the specificity dial sets how much control a part of the system warrants, and the more latitude the executor gets, the heavier the verification must be (Compendium 4.5.1). Here the dial is applied to the process itself: match the depth to the stakes, neither maximised nor skipped.

## A change: the 30-second table

Ask the questions in this order. The first "yes" decides.

| Ask | If yes, the change is | What it needs |
|---|---|---|
| 1. Does it touch a **protected path**: the spec or a decision record, a gate, hook, CI or lint configuration, the ratchet floor, a waiver, a dependency list, a migration or schema, security, money or data handling, secrets or environment configuration? | **Risky** | The spec delta, the test, the gate, **and a named person who records that they accept it** before it merges. |
| 2. Does anyone outside this file notice it: new, changed or removed behaviour, a public interface, a data shape, a message a user reads? | **Normal** | A spec delta (a criterion id added or changed, in the spec, first), a test that cites the id, the gate. The commit cites the id. |
| 3. Otherwise: a typo, a comment, a rename inside one unit, formatting, a wording fix in a document. | **Tiny** | Nothing written by hand. It goes straight through; **the automatic checks are the only review** (the hooks, and the tests if you have them). |

Two rules make it safe to use quickly.

- **When unsure, go one level up.** The cost of a spec line is minutes; the cost of an unreviewed risky change is not.
- **A tiny change that the checks refuse is not tiny.** If the gate, the tests or the ratchet fail, treat it as normal. Also treat a "tiny" change as normal when it touches more than one module or more than about 50 changed lines (a default, not a measured threshold).

A refactor sits in the middle: it is **tiny** only if the parent's tests, unchanged, pass against the new source (the co-change gate's own refactor proof, installed from day 7 to 30 with `gs-lock`); otherwise it is normal.

### What each depth runs

| Depth | Written by a person or the assistant | Runs by itself | A person signs | Tools |
|---|---|---|---|---|
| Tiny | one commit with a typed subject | commit-msg hook (typed subject), pre-commit gate (spec shape, open questions, ratchet, your tests) | no | `scripts/gs-gate.mjs` |
| Normal | spec delta with id, then test, then code; commit cites the id | the same, plus the co-change gate (a behaviour change must cite or stage a spec change) once the lock is on | no | gate; `gs-lock` and `gs-cochange` from day 7 to 30 |
| Risky | all of normal, plus a decision entry naming who accepts it and why | the same, plus the ratification check: the commit is refused with no entry; CI re-checks | yes | `gs-decide` (L2) |

## Tied to the review surface

The review surface is the specification of a small deterministic tool, `gs-review-surface` (`docs/experiments/REVIEW-SURFACE-SPEC.md` in the protocol repository), that would print the places a human must still read in a diff, with no model. **It is a specification only: no code exists and nothing has been run.** Its output maps onto the three depths, which is why the table above is meant to be computed one day rather than judged:

| What the tool would print | Depth |
|---|---|
| Nothing (exit 0) | Tiny |
| Only SHOULD items (exit 11): no criterion id cited (S7), new externally visible surface (S10), a large or unstructured change (S11) | Normal |
| At least one MUST item (exit 10): spec or decision records (S1), gate, hook or CI configuration (S2), ratchet floor (S3), new dependencies (S4), migrations (S5), security paths (S6), tests deleted or loosened (S8), configuration and secrets (S9) | Risky |

Until it exists, a person (or the assistant, which proposes and never decides) applies the table by hand. The protected-path list that `gs-decide` already evaluates (`gs-decide.mjs protected`) is the part of "risky" that **is** mechanical today.

## A project: the three installer levels

The same idea for the project as a whole: install the depth the project can carry, and move up when the lower one has been boring for a while.

| Level | Fits | You get |
|---|---|---|
| **L0** | A throwaway, a weekend project, a solo experiment, a project you are not yet sure about | The sentinel, a spec with ids, a first decision record, an open-questions list, and the trailer rule. Nothing runs by itself. |
| **L1** (default) | A product with users, a team of two or more, any project where an assistant commits regularly | L0 plus the gate, the hooks (chained with yours), the ratchet floor and copies of the tools. |
| **L2** | Money, personal data, regulation, several teams, or an assistant committing under people's names | L1 plus ratifications recorded for risky changes, assistant-commit marking, and a CI re-check. Signed ratifications start when you give a public key. |

These match the three levels of [agent commit marking](/practice/agent-commit-marking/) (trailers; trailers and the hook; signed ratifications and CI). One command installs a level and proves what it claims:

```
node tools/gs-init/gs-init.mjs --dry-run          # see what it would do
node tools/gs-init/gs-init.mjs --level L1         # do it; then it runs gs-check --strict on a copy
```

What stays absent at each level is stated by the installer, not hidden: at L0 and L1 the spec lock and the co-change gate are **day 7 to 30** (they need code with ids); at L0 and L1 nobody has signed anything; at every level a person has to replace the placeholder requirement with a true one. See `tools/gs-init/README.md` for the full list.

## Method versus enforcement: which depth is asked and which is enforced

The depth decision is made by a person or by the assistant. What differs is whether anything stops a wrong decision. In the vocabulary of [the functions map](/method/functions-map/) (M1 by hand, M2 a file the assistant reads, M5 a hook, M6 a CI gate, M7 an enforced gate with a floor the executor cannot lower):

| Depth | At L0 | At L1 | At L2 |
|---|---|---|---|
| Choosing the depth | M1/M2: the sentinel's "which case it is" table | M1/M2, the same | M1/M2, the same |
| Tiny goes through on checks | no checks | **M5**: hooks run on every commit | M5 and **M6** |
| Normal needs the spec delta | M2: asked | M5 for the spec's shape, open questions, a typed subject, a test count that only goes up; the *citation* of an id is M2 until the co-change gate is on | the same plus the CI re-check |
| Risky needs a named person | M2: asked | M2: asked (a convention) | **M5/M6**: a protected change with no entry is refused locally and in CI |

The honest reading: **only the risky class has a mechanical trigger, and only at L2.** Nothing in the installer classifies a change; if the assistant (or you) calls a risky change tiny, only the protected-path list can catch it, and only where `gs-decide` is wired. `git commit --no-verify` skips every local hook; the CI file is a re-check only if you make it a required status check. These limits are the ones in [agent commit marking](/practice/agent-commit-marking/).

## How BMAD describes its scale-adaptive behaviour, and what is different here

BMAD-METHOD (bmad-code-org, MIT) says the same thing in its own words. Read from the repository files at commit `bda3c59` (2026-10-06), on 2026-10-08:

- README: "the process sizes itself to the work. Small changes go straight to build. Complex work gets the depth it needs." ([README.md](https://github.com/bmad-code-org/BMAD-METHOD/blob/main/README.md))
- Build a Change, "Size the Work": "Use the smallest amount of BMad that safely fits the change... For a trivial edit you are willing to review yourself, skip the process and ask the agent to make it directly. But if a bug could escape into production, `bmad-build` is likely worth it." After investigation `bmad-build` "routes to the smallest safe path. It reports three facts about the settled design: intent gaps, irreversible actions, and footprint. A design clean on all three takes the light path... Anything flagged gets a full written plan first." ([docs/build/build-a-change.md](https://github.com/bmad-code-org/BMAD-METHOD/blob/main/docs/build/build-a-change.md))
- Choose a Planning Path, "Size Follows the Intent": scope "is only one signal: use more planning when the work has high risk, unclear requirements, broad architectural reach, cross-system effects, or coordination between people or teams." ([docs/plan/choose-a-planning-path.md](https://github.com/bmad-code-org/BMAD-METHOD/blob/main/docs/plan/choose-a-planning-path.md))
- CHANGELOG, v6.12.0: "Build decides how much ceremony a change needs after investigating it, not before."

**What is the same.** The principle: the smallest safe path, decided from risk and reach as well as size, with the heavy path reserved for what is irreversible or unclear. Our table's three questions (protected, noticed outside, neither) and BMAD's three facts (irreversible actions, intent gaps, footprint) are close cousins, and BMAD's is shipped, documented and used by a large community; ours is not.

**What is different here.**

1. **Who decides, and what stops a wrong decision.** In BMAD the router is the model: it investigates and reports the three facts, and the human approves the plan. The adaptation lives in skill instructions (the file the model reads, M2 in our scale). For the trivial path the guard is the human's own review ("a trivial edit you are willing to review yourself"). Here the classification may also be made by the assistant, but the *risky* class is defined by a list of paths and patterns that a program evaluates (`gs-decide protected`, and in time the review surface), and at L2 a hook refuses the commit without a person's recorded acceptance. The executor cannot lower the depth by editing the gate, because the gate's own files are protected paths.
2. **The test of "light" is not the model's report.** BMAD's three facts are what the model says after investigating. Ours, once the review surface exists, would be a deterministic list from the diff, with no model. Until then ours is a table a person applies, which is weaker than BMAD's investigation, not stronger.
3. **Depth covers verification and approval, not only planning.** BMAD's adaptation is chiefly how much planning artifact is produced. Here the depth also sets what runs automatically and who signs.
4. **The evidence is equally thin on both sides.** Neither the BMAD docs nor this page shows that right-sizing improves outcomes. The one related result in this project, the specificity dial, has so far tied on a single shot (functions map, "under test").

## What this does not show

- That the table classifies changes correctly. It is a design; the 50-line threshold and the "more than one module" rule are the author's defaults, unmeasured.
- That an assistant follows the sentinel's "which case it is" table. That is the M2 channel; whether it holds over time and across people is untested (lifecycle page, section 7).
- That tiny changes are safe. "The automatic checks are the only review" is only as good as the checks; a project at L0 has none, and the installer says so.
- That the installer works on a stack it was not tested on. It was tested on throwaway node and python projects; go, dotnet and other are detected but not exercised end to end, and the tests command is only recognised for `npm test`, `pytest`, `go test ./...` and `dotnet test` when the tool is on the machine.
- That anyone but the author can install it in a minute. It has not been tried by a stranger.

## Where it fits

In the [functions map](/method/functions-map/) this is the **dial** under **Decide** ("how strict to be for each part"), operated through **Say** (the sentinel's triage block) and **Check** (the hooks). See also [the whole lifecycle](/method/lifecycle-whole/), [agent commit marking](/practice/agent-commit-marking/) and the formula draft `docs/formulas-drafts/init-and-levels.md`.
