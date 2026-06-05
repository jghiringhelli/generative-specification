# ADR-000: Context Navigation Tree Initialization

**Date**: 2026-06-04
**Status**: Accepted
**Decided by**: ForgeCraft setup

## Context

This project was initialized with ForgeCraft. The Context Navigation Tree (CNT)
structure was selected to provide O(log N) context load in the average case.

## Decision

Use CNT: CLAUDE.md (3-line root) + .claude/index.md (routing) + .claude/core.md
(always-loaded invariants) + domain leaf nodes (≤30 lines each).

## Consequences

- CLAUDE.md stays ≤3 lines always
- New concerns get a leaf node via `add_node`
- core.md must never exceed 50 lines; excess moves to domain nodes
- Stateless agents navigate by task domain, not by loading everything

## Tags
UNIVERSAL, API