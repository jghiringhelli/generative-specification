---
layout: default
title: Domain Guides
nav_order: 5
has_children: true
description: "GS methodology applied to specific problem domains: FINTECH, ML, GAME, Creative, CLI"
---

# Domain Guides

Generative Specification applies uniformly across all software domains. What changes per domain is:

1. **What "verifiable" means** — assertions, statistical properties, AI rubrics, or performance budgets
2. **Which quality gates are active** — the tag system controls this in ForgeCraft
3. **What the spec must contain** — domain-specific PRD sections that the AI cannot infer

Each guide covers these three dimensions for one domain, lists the active quality gates, and identifies the highest-value gate contribution targets.

---

## Available Guides

| Domain | Tag | Key challenge |
|---|---|---|
| [Fintech & Optimization](fintech/) | `FINTECH` | Statistical correctness, regulatory audit trails, financial precision |
| [Machine Learning](ml/) | `ML` | Non-deterministic output, data leakage, evaluation metrics vs assertions |
| [Game Development](game/) | `GAME` | Frame budget, physics accuracy, save/load integrity |
| [Creative & Generative](creative/) | `CREATIVE` | Subjective quality, AI-evaluated rubrics, long-form coherence |
| [CLI Tools](cli/) | `CLI` | Exit codes, stdin/stdout contracts, non-interactive CI safety |

---

## Contributing a Domain Gate

Each domain page lists the GS properties that are underrepresented for that domain. Those are the highest-value contribution targets. See [CONTRIBUTING.md](../quality-gates/CONTRIBUTING.md) for the gate schema.

A merged domain-specific gate earns a ForgeCraft project slot and is activated automatically for all projects with the corresponding tag.
