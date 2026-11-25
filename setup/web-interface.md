---
layout: default
title: Web interface
parent: Set up GS
nav_order: 2
permalink: /setup/web-interface/
description: "Setting up GS on something a person uses in a browser: what to write in the spec, which library gates apply to the code, and what the library does not cover yet."
---

# Set up GS: web interface

For something a person uses in a browser. Read [Set up GS](/setup/) first for the three questions and the shared base. If the project also has a service behind it, read [API or service](/setup/api-service/) as well.

## What to write in the spec

- The screens and the path a person takes between them.
- For each screen: what it shows, what the person can do, and what happens when something goes wrong or is empty.
- The shared pieces (buttons, forms, layout) and where they live, so they are reused and not rewritten.
- Who may see what.
- The browsers and screen sizes that must work.

## Gates from the library

The library has no gate written for the browser itself today. What applies is the gate set for the code, so the interface is built on the same footing as everything else:

- The [shared base](/setup/#step-2-the-shared-base-every-project).
- If the code is TypeScript or JavaScript, the [language gates](/setup/library-cli/#typescript-and-javascript-gates): strict types, no untyped escapes, size and complexity limits, dependency audit, no debug output left in production.

## What the library does not cover yet

This is the largest gap for this kind of project. The library has no gate for accessibility, visual changes, how the interface behaves in a real browser, page weight or text copy. Write each as a rule in the spec. If you find a check that enforces one and works on your project, [propose it as a gate](/quality-gates/CONTRIBUTING.html): this page is the first place that would benefit.

## Next

[Refine the spec when the assistant repeats a mistake](/practice/refinement/).
