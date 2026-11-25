---
layout: default
title: API or service
parent: Set up GS
nav_order: 1
permalink: /setup/api-service/
description: "Setting up GS on a service that other software calls: what to write in the spec, and which library gates fit an HTTP API, a database and a container."
---

# Set up GS: API or service

For a service that other software calls over HTTP. Read [Set up GS](/setup/) first for the three questions and the shared base.

## What to write in the spec

- Each endpoint: method, path, inputs, outputs and every error it can return.
- The error format, once, for the whole service.
- Where the layers are and which direction calls may go (routes call services; services call data access; nothing skips a layer).
- Which fields may be empty and what an empty field means.
- How the service is started, how it reports it is healthy, and how a bad release is rolled back.

## Gates from the library

The checks below are in the library today. Read each gate's file for its exact command and adjust paths to your project.

**Contract and behavior**
- `hurl-contract-tests-pass`: run the contract files against the service.
- `api-error-envelope-resource-scoped`: errors follow one envelope.
- `api-nullable-field-coercion`: empty fields behave as written.
- `contract-tests-against-live-env`: the same contract runs against the deployed environment.

**Structure**
- `no-direct-db-in-routes`: routes do not reach the database directly.
- `no-circular-dependencies`: modules do not depend on each other in a loop.

**Operation**
- `health-endpoint-responds` and `smoke-test-passes`: the running service answers.
- `no-debug-routes-in-production`: nothing left over from debugging is exposed.
- `tls-enforced`: plain HTTP is refused.
- `rollback-plan-documented`: the way back is written down.

**Data and containers**
- `db-migrations-reversible`: every migration can be undone.
- `container-image-no-critical-cve`: the image is scanned for serious known vulnerabilities.
- `docker-compose-defined` and `docker-service-boundaries`: the local stack is described and bounded.

**Language gates**
For TypeScript or JavaScript on Node, add the gates on the [library and command-line page](/setup/library-cli/#typescript-and-javascript-gates) (strict types, size limits, dependency audit). For Python, the library has `python-dependencies-pinned` only.

## What the library does not cover yet

Authentication and authorization rules, rate limits, data privacy rules and observability have no gate in the library today. Write them in the spec as rules, and if you turn one into a check that works, [propose it](/quality-gates/CONTRIBUTING.html).

## Next

[Refine the spec when the assistant repeats a mistake](/practice/refinement/).
