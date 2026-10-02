---
layout: default
title: The Method
nav_order: 7
has_children: true
permalink: /method/
description: "The concepts of Generative Specification: the rubric, spec completeness, the gates, and how a project stays derivable over time."
---

# The Method

The concepts, stated once and defined by what a machine can check. The papers ([base, derivatives, Compendium](/evidence/)) carry the arguments; these pages carry the working definitions.

| Page | What it answers |
|---|---|
| [The rubric](rubric/) | Seven properties that make a project derivable, and the failure named for each |
| [Spec completeness](spec-completeness/) | When is a specification complete enough for a stateless reader |
| [Quality gates](gates/) | The non-LLM checks that make the discipline enforceable |
| [Gate library](/quality-gates/) | The open, community-contributed library of gates, one YAML file per gate |
| [Portable gate template](/docs/gate-template.html) | The deterministic gates that catch the common failures, written so an assistant can wire them to your stack |
| [The Andon Method](andon/) | A proposed method built on the same thesis: the machine builds, a gate stops the line, the human judges. Team process not yet defined |
| [Twelve working principles](principles/) | How a practitioner works under the method, in twelve lines; two carry evidence caveats |
| [Lifecycle and debt](lifecycle/) | Six definitions: no new debt per change, criteria coverage, what the method covers across the lifecycle (with what is not yet covered), the triage of a failure, what "governed as of" means for a score, and the three numbers of spec completeness |
| [Coherence between spec and code](coherence/) | Five checks, none using a model, that detect when the spec and the code stopped saying the same thing: identifiers in both directions, the lock (tags in code, hashes in a file), a co-change gate, an inverse inventory and an intent diff. Design, verified on one sample project |

Looking for how to do it on a real project? See [Practice](/practice/). Want the evidence? See [Evidence and papers](/evidence/). Want the lessons in order? See the [free course](/method/course/).

**Using this in a company?** Governance, assurance and due diligence built on this method live at [pragmaworks.dev](https://pragmaworks.dev).
