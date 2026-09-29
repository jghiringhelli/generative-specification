---
layout: default
title: "Orient"
parent: Practice
nav_order: 5
permalink: /practice/orient/
description: "Before specifying: for an existing codebase, a cold read and audit; for a new idea, a guided discussion that makes it concrete."
---

# Orient: read what exists, or ground the idea

> In the workshop this is called **Heating** (Stage 1).

Before you specify anything, orient. For an existing codebase, that means reading it cold and running a full diagnostic: you cannot specify what you have not seen clearly. For a new project, it means grounding a fuzzy idea into something concrete enough to specify. Pick your track.

## Track A — New Project: Ground the Idea

A guided discussion before the spec

A new project has no code to read — but it usually has a fuzzy idea. Before the specification, bring it down to earth. This guided discussion turns "I want to build X" into the concrete raw material the spec interview needs. If your idea is already sharp, skip straight to the interview in [New project](../new-project/).

**Paste this: ground the idea**

```
Be my thinking partner, not a yes-man. I have a project idea I want to ground before writing a specification. Ask me one question at a time, and push back when an answer is vague.

1. In one sentence — what is it, and who is it for?
2. What is the single most important thing it must do well? (if everything is important, nothing is)
3. Who is the user the day it ships, and what do they do in the first five minutes?
4. What is explicitly NOT in version one? Name three things you are tempted to build but will not.
5. What is the riskiest assumption — the thing that, if wrong, sinks the project?
6. What does "good enough to show someone" look like? Be concrete.

After my answers, reflect back: the one-sentence pitch, the MVP scope, the top three non-goals, and the riskiest assumption. If any answer was hand-wavy, tell me which and why. Do not write any spec or code yet.
```

This is the only stage a new project may skip — if the idea is already concrete, go straight to the interview in [New project](../new-project/). But most fuzzy ideas get sharper here, and a sharper idea makes a tighter specification.

## Track B — Existing Project: Cold Read + Audit

See what the AI sees — then grade it

An existing codebase must be read before it can be specified. First the cold read — three questions that expose the gap between what's implicit and what's written. Then the full GS audit — eight dimensions, a SAVED report card, and a remediation roadmap.

### Sub-step 1 — Cold Read

**Paste this: cold read**

```
Ask me these three questions about this codebase, one at a time. Read the code to answer — do not ask me.
1. In one paragraph: what does this system do and who uses it?
2. Pick a structural decision visible in the code (a module boundary, a data model, a service split). Explain why it was made that way.
3. What should this system never do? What are its explicit constraints and non-goals?
```

Where the AI answers with silence, invention, or low confidence — that is exactly what your sentinel will need to make explicit.

### Sub-step 2 — Full GS Audit

Now run the full audit. It grades eight dimensions and ends with a prioritized remediation plan. The complete paste-able template is on the GS Audit page.

- [GS Audit Report](https://pragmaworks.dev/audit): the full 8-section template, paste-able, no tools required.
- [Diagnose](https://pragmaworks.dev/diagnose): report card plus named failure patterns, about 30 minutes.

The eight sections:

1. SAVED report card (letter grades)
2. Report card summary
3. Structural disciplines
4. Test pyramid
5. Documentation health
6. Security and logging
7. Team habits (git history)
8. Remediation plan

Next: [New project](../new-project/) or [Existing project](../existing-project/).

