---
layout: default
title: Home
nav_order: 1
description: "Learn Generative Specification: write down what a system must be so an AI assistant can derive it, and a check outside the model can verify it. A free, open method."
permalink: /
---

<section class="hero" aria-labelledby="hero-title">
  <p class="eyebrow">Generative Specification &middot; the open method</p>
  <h1 id="hero-title" class="hero-title">Write the spec. Let the machine derive the code. Check it from the outside.</h1>
  <p class="hero-lead">AI assistants write code quickly, and every new session decides a thousand small things a little differently. Generative Specification is a discipline for writing down what a system must be, so that an assistant with no memory can derive it and a check outside the model can tell you whether it did. This site is where you learn it: free, open, and plain about what has and has not been tested.</p>
  <p class="hero-actions">
    <a class="btn btn-primary" href="{{ '/START-HERE.html' | relative_url }}">Start with your first hour</a>
    <a class="btn" href="{{ '/method/course/' | relative_url }}">The free course</a>
    <a class="btn" href="{{ '/evidence/' | relative_url }}">See the evidence</a>
  </p>
</section>

## Choose a way in

<div class="path-grid">
  <div class="path-card">
    <h3 class="path-title">I'm new</h3>
    <p>Get the idea in two pages, then try it on a project of your own in one hour: a spec, a sentinel that routes the assistant, a gate that stops the build.</p>
    <p class="path-links"><a href="{{ '/docs/gs-two-pager.html' | relative_url }}">Two-page introduction</a><a href="{{ '/START-HERE.html' | relative_url }}">Your first hour</a></p>
  </div>
  <div class="path-card">
    <h3 class="path-title">I lead a team</h3>
    <p>Grade a project on seven properties, use checks that refuse a bad build, and decide what to enforce first.</p>
    <p class="path-links"><a href="{{ '/method/rubric/' | relative_url }}">The rubric</a><a href="{{ '/method/gates/' | relative_url }}">Quality gates</a><a href="{{ '/method/lifecycle/' | relative_url }}">Lifecycle and debt</a></p>
  </div>
  <div class="path-card">
    <h3 class="path-title">I want to see the evidence</h3>
    <p>Experiments, papers and equations, each with its status and its bound. The studies are small and written by the method's author, so they are published to be re-run.</p>
    <p class="path-links"><a href="{{ '/research/' | relative_url }}">For researchers</a><a href="{{ '/evidence/' | relative_url }}">Evidence and papers</a><a href="{{ '/formulas/' | relative_url }}">Models and equations</a><a href="{{ '/method/evidence/' | relative_url }}">Findings and bounds</a></p>
  </div>
</div>

### Three ways to reach the same lessons

<div class="ways" role="list">
  <a role="listitem" class="way" href="{{ '/learn/by-goal/' | relative_url }}"><span class="way-name">By goal or role</span><span class="way-text">What to read for your situation</span></a>
  <a role="listitem" class="way" href="{{ '/method/course/' | relative_url }}"><span class="way-name">By course sequence</span><span class="way-text">Thirteen short lessons, in order</span></a>
  <a role="listitem" class="way" href="{{ '/learn/by-property/' | relative_url }}"><span class="way-name">By property</span><span class="way-text">One of the seven ideas at a time</span></a>
</div>

{% include course-slot.html %}

## The core in five lines

1. **Derivability.** The reader of the code is stateless. If the correctness of a program can't be ratified from its spec, contracts and trace, it can't be governed.
2. **The substrate.** The spec (a contract root plus a cascade of derived documents), the **sentinel** that routes the assistant to them, hooks and gates, and verification. This is what you build. The *harness* is only the verification and enforcement layer of it.
3. **Three load-bearing mechanisms.** The **bridge** between human language and code (with its read/write asymmetry). The **sentinel**, which bounds context. **Phase collapse**, where spec, design and code stop being separate phases.
4. **The rubric.** Seven properties that make a project derivable. An instrument for measuring the substrate, not a mechanism.
5. **An honest bound.** The value of the scaffolding is capacity-relative: highest where the model is weak, receding as it strengthens. What endures is the guarantee kept outside the model.

## Everything else, one click away

| Section | What is there |
|---|---|
| [The method](/method/) | The rubric, spec completeness, quality gates, the gate library, the working principles |
| [Practice](/practice/) | Paste-and-run guides: new project, existing project, join a codebase, migrate a stack |
| [Models and equations](/formulas/) | Four short models and equations, each with the status it has earned |
| [Recipes](/docs/recipes/) | Step-by-step workflows for common project scenarios |
| [Domain guides](/domains/) | Fintech, machine learning, games, creative work, command-line tools |
| [For researchers](/research/) | The question, the claims with their status, the hypotheses under test, how to replicate and cite |
| [Evidence and papers](/evidence/) | The papers, the experiments, the raw evidence. For readers who want to check the work |
| [Essays and ideas](/learn/essays/) | Longer reading on why the method exists |
| [About](/about/) | Licence, citation, how to contribute, contact |

> **Using this in a company?** Governance, assurance and due diligence built on this method live at [pragmaworks.dev](https://pragmaworks.dev). Here is the method itself, open.
