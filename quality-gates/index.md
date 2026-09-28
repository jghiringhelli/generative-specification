---
layout: default
title: Gate library
parent: The Method
nav_order: 6
permalink: /quality-gates/
description: "The open community library of structured quality gates for Generative Specification: one YAML file per gate, mapped to a rubric property, with a schema and a contribution path."
---

# The gate library

An open, community-contributed library of quality gates: deterministic, non-LLM checks that turn a written rule into something the build can refuse. Each gate is one YAML file, mapped to a [rubric](/method/rubric/) property, validated against a shared schema. The registry currently holds **42 gates**.

- [Browse the gates](https://github.com/jghiringhelli/generative-specification/tree/main/quality-gates/gates) (one file per gate)
- [The schema](https://github.com/jghiringhelli/generative-specification/blob/main/quality-gates/schema.yaml) every gate must satisfy
- [The registry index](https://github.com/jghiringhelli/generative-specification/blob/main/quality-gates/index.json) (machine-readable)
- [How to contribute a gate](https://github.com/jghiringhelli/generative-specification/blob/main/quality-gates/CONTRIBUTING.md), by pull request

For how gates fit the method, and the standard tools behind each property, see [Quality gates](/method/gates/).
