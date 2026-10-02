---
layout: default
title: Cost per correct output
parent: Formulas
nav_order: 4
permalink: /formulas/cost/
description: "Tokens spent divided by outputs that pass verification. A metric, not a law, and the right denominator for the token-cost objection."
---

# Cost per correct output

**Status: a metric.** Not a law and not a result. It is something you can measure on your own project.

## Reads as

Tokens spent, divided by the number of outputs that pass verification.

## Why this denominator

The common objection to specification-first work is token cost: writing a spec and its supporting documents spends tokens before any code exists. That counts tokens **generated**. The metric that matters is tokens per **correct** output. Without a specification, tokens also go to code that gets discarded and to re-explaining context at the start of every cold session. With one, some of that spend moves into authored structure.

Whether it comes out cheaper is an empirical question, and this site does not claim a percentage. Cost depends on the model, the task and the codebase.

## What the evidence says, with its bound

In one controlled comparison, disciplined layering alone, holding content constant, did not make a stateless reader cheaper: on the tasks measured, reading breadth and tokens were equal or slightly higher. That is a finding against a simple version of the claim, and it stays in the record. The argument for the metric is that it measures the right thing, not that the method wins on it. An experiment that fixes the denominator is still needed.

## How to use it

Pick a task you repeat. Count the tokens an assistant spends to get one output that passes your checks, with and without the spec and the sentinel. Report both numbers and the model you used.

## Where to read more

- [Structural disciplines](/practice/structural-disciplines/#the-token-question): the token question in full.
- [The evidence](/method/evidence/): what was measured, with its bounds.
