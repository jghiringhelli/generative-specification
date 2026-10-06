# ADR 0001: use the Node test runner

## Status

Accepted.

## Context

The library has no dependencies and the project must install from a clean clone without a network round trip.

## Decision

Use the test runner built into Node (`node --test`). Record criteria in docs/spec/SPEC.md.

## Consequences

No third-party test framework to install or keep current.
