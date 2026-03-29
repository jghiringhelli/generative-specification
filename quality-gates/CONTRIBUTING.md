---
nav_exclude: true
---

# Contributing Quality Gates

Quality gates are structured constraints on software development work, mapped to one of the seven GS properties. This library is community-maintained. Anyone can propose a gate.

---

## What Makes a Good Quality Gate

A good gate is:
- **Specific**: a reader knows exactly what passes and what fails
- **Automatable**: the check field has a concrete command, or the manual criteria are unambiguous
- **Grounded**: it enforces a constraint that has broken real projects without it
- **Minimal**: one constraint per gate; if you need two checks, write two gates

A gate that says "write good code" is not a gate. A gate that says "`tsc --noEmit` exits 0 on every commit" is.

---

## How to Propose a New Gate

1. Fork this repository
2. Copy the template below into `quality-gates/gates/<your-gate-id>.yaml`
3. Fill in all required fields (see `schema.yaml` for the full spec)
4. Open a pull request — title: `gate: <gate-name>`

The PR validation action will check schema conformance automatically. A maintainer reviews and merges.

```yaml
id: your-gate-id
name: Your Gate Name
description: >
  What this gate enforces. Be specific. 1–4 sentences.
  A reader should know exactly what passes and what fails.
property: Self-describing  # or Bounded | Verifiable | Defended | Auditable | Composable | Executable
tags: [typescript]         # at least one; use "any" for language-agnostic
phase: development         # or staging | production
trigger: commit            # or pr | release
blocking: true
check:
  type: lint               # or test | script | audit | manual
  command: "your command here"
```

---

## How to Supersede an Existing Gate

If your gate replaces an existing one:

1. Add `supersedes: <existing-id>` to your new gate file
2. In the same PR, add `deprecated: true` to the superseded gate file
3. Explain the improvement in the PR description

```yaml
# your new gate
id: typescript-strict-v2
supersedes: typescript-no-any
# ...

# the gate being replaced (edit it)
id: typescript-no-any
deprecated: true
# ...
```

---

## Other Operations

| Operation | How |
|---|---|
| **Split** | PR adding 2+ new gates + deprecating the original with `deprecated: true` |
| **Merge** | PR adding 1 new gate that covers 2+ deprecated ones; deprecate the originals |
| **Deprecate** | PR adding `deprecated: true` to the gate file; explain in PR description |
| **Correct** | PR fixing description, command, or metadata; no id change needed |

---

## ForgeCraft Integration

ForgeCraft reads from this library. When a new gate is merged, all ForgeCraft projects tagged with the relevant tags receive the updated gate on the next `refresh_project`. Contributing a gate that ForgeCraft adopts improves the quality floor for every project in its ecosystem.

Contributors with merged gates earn additional ForgeCraft project slots. See [forgecraft.dev](https://forgecraft.dev) for details.

---

## Conduct

Be precise. Be helpful. Don't propose gates that require proprietary tooling. Don't propose gates you haven't used in a real project. The goal is a library that makes every practitioner's work better — not a list of aspirational rules.
