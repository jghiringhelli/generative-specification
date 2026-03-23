---
layout: default
title: Creative & Generative
parent: Domain Guides
nav_order: 4
description: "GS methodology for creative tools, content generation systems, and artistic software"
---

# GS for Creative & Generative Systems

## Why This Domain Is Different

Creative and generative software produces **outputs that cannot be verified with assertions**. A story chapter, a generated melody, or a stylized image is not "correct" in the boolean sense — it is better or worse against criteria that are inherently subjective or multi-dimensional.

This requires a new evaluation type: **AI-rubric** gates, where an LLM evaluator scores the generated artifact against a structured rubric and the gate passes only if the score exceeds a threshold.

Storycraft (a GS + ForgeCraft reference project) is the working prototype of this pattern.

## Relevant Tag

`CREATIVE` — activates creative-specific gates, AI-rubric evaluation support, and RAPTOR guidance.

## Active Quality Gates

| Gate | Why it matters here |
|---|---|
| [coverage-threshold-80](../quality-gates/gates/coverage-threshold-80.yaml) | The generation pipeline logic is fully testable; only the final artifact is subjective |
| [no-hardcoded-secrets](../quality-gates/gates/no-hardcoded-secrets.yaml) | LLM API keys, content moderation service keys |
| [environment-variables-config](../quality-gates/gates/environment-variables-config.yaml) | Model IDs, temperature, token limits, rubric thresholds |
| [adr-files-emitted](../quality-gates/gates/adr-files-emitted.yaml) | Aesthetic decisions (genre, tone, POV) require documented rationale |

### Domain-Specific Gates Needed (Contribution Targets)

| Gate ID (proposed) | GS Property | Evaluation type |
|---|---|---|
| `ai-rubric-chapter-quality` | Verifiable | AI evaluator scores chapter against rubric; pass if score ≥ threshold |
| `genre-consistency` | Coherent | RAPTOR: AI verifies tone/genre is consistent across all generated content |
| `no-plot-contradiction` | Coherent | RAPTOR: AI verifies no factual contradiction between chapters/scenes |
| `character-arc-completeness` | Complete | AI verifies each named character has an observable arc |
| `content-moderation-clean` | Defended | Generated content passes content moderation API for deployment context |

## AI-Rubric Evaluation Type

The gate schema supports an `evaluation_type: "ai-rubric"` field (RM-054 in the ForgeCraft roadmap). A gate of this type specifies:

```yaml
evaluation_type: ai-rubric
rubric:
  - criterion: "Internal consistency"
    weight: 0.4
    prompt: "Does the generated content contradict any prior content in the context?"
  - criterion: "Adherence to style guide"
    weight: 0.3
    prompt: "Does the tone, POV, and vocabulary match the style parameters?"
  - criterion: "Quality of prose"
    weight: 0.3
    prompt: "Rate the prose quality on a scale of 1-10. Be critical. Apply Strunk and White."
pass_threshold: 0.75
```

The gate runner calls the LLM with the rubric and the generated artifact, normalizes the scores, and passes/fails based on the threshold.

## RAPTOR Integration

[RAPTOR (Recursive Abstractive Processing for Tree-Organized Retrieval)](https://arxiv.org/abs/2401.18059) enables hierarchical analysis of long documents. For creative projects with chapters, scenes, and series arcs:

- **Chapter-level critique**: standard adversarial techniques on a single chapter
- **Book-level critique**: RAPTOR summarization of all chapters → evaluate arc, structure, consistency
- **Series-level critique**: RAPTOR across multiple books → evaluate series promise fulfillment, character evolution, thematic coherence

The `CREATIVE` domain gates include RAPTOR-level gates that only activate after sufficient content exists (`minimum_content_threshold` in gate config).

## Spec Patterns

A GS PRD for a creative system must include:

1. **Aesthetic contract** — genre, tone, POV, tense, style constraints (the AI will make up defaults if absent)
2. **Evaluation rubric** — the criteria against which generated output is judged, with weights
3. **Critique scope** — which techniques apply at chapter, book, and series levels
4. **Content policy** — what content is in scope and out of scope for generation
5. **Context window strategy** — how much prior content is injected for consistency (RAPTOR vs sliding window vs full context)

## Contribute a Gate

Most underrepresented GS property for CREATIVE: **Verifiable** with `evaluation_type: ai-rubric`. This entire evaluation type is new territory.

See [CONTRIBUTING.md](../quality-gates/CONTRIBUTING.md).
