---
layout: default
title: New Project without Spec
parent: Workflow Recipes
nav_order: 2
description: "Start a new project from scratch when you have an idea but no specification document"
---

# New Project without Spec

**Scenario**: You have an idea, a feature request, or a general direction — but no written requirements. You want ForgeCraft to help you generate the spec before writing code.

**This is the highest-leverage scenario** for GS methodology: writing the spec first, even when it feels slower, prevents the most expensive rework.

---

## Step 1 — Initialize the project

```
forgecraft_actions({
  action: "setup_project",
  project_dir: "/path/to/your-project"
})
```

This generates the scaffold including stub `docs/PRD.md` and `docs/use-cases.md`.

---

## Step 2 — Describe your intent to the AI

In a Claude session with the project context loaded, describe what you want to build in plain language. Then ask:

> "Using the GS methodology, help me fill out `docs/PRD.md` with: numbered testable goals, explicit non-goals, and a constraints section. Then fill `docs/use-cases.md` with use cases in UC-NNN format."

The AI will ask clarifying questions. **Answer them fully** — each question represents a decision that would otherwise be made implicitly (and likely incorrectly) during implementation.

**Common AI clarifications and why they matter:**
- "What should happen when [edge case]?" — Without an answer, the AI will invent a behavior
- "Is [feature X] in scope?" — Without an answer, the AI may implement it or not, unpredictably
- "What performance targets are required?" — Without a number, the AI has no gate to fail against

---

## Step 3 — Write one ADR

Before running cascade, you need at least one Architecture Decision Record. Even for a new project, there are always decisions to record:

```markdown
# ADR-0001: Technology Stack Selection

## Status
Accepted

## Context
Building [your project]. Need to choose primary language and framework.

## Decision
Use [language/framework] because [reasons].

## Consequences
[What this enables and what it constrains]
```

Save to `docs/adr/0001-technology-stack.md`.

---

## Step 4 — Run cascade check

```
forgecraft_actions({
  action: "check_cascade",
  project_dir: "/path/to/your-project"
})
```

The cascade will tell you exactly what is still missing. Common blockers at this stage:
- PRD goals are too vague ("build a great app" is not testable)
- Use cases are still template placeholders
- Constraints section is empty

Fix each blocker. The cascade output is the spec quality gate.

---

## Step 5 — Continue with loops

Once cascade passes, follow Steps 4–6 from [New Project with Spec](../new-project-with-spec/).

---

## The Spec Investment

Writing a complete spec before any code feels slow. In practice, a 1–2 hour spec session:
- Eliminates the most expensive class of rework (wrong feature, wrong API shape)
- Produces the test assertions before the code (TDD at the spec level)
- Creates the evaluation rubric that tells you when you're done

The AX experiment quantified this: spec completeness is the primary predictor of output quality. Expert prompt engineering without a spec scores 40–60% below a complete GS document.

---

## When to Break This Rule

This recipe is appropriate when:
- Building something new where the requirements are negotiable
- You want AI to help clarify requirements, not just implement them

Use [Brownfield: New Feature](../brownfield-new-feature/) instead if:
- Adding to an existing system where the architecture is fixed
- The requirements are externally defined and non-negotiable
