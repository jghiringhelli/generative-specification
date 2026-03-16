# ADR-001: Technology Stack Selection

**Date:** 2026-03-11  
**Status:** Accepted  
**Deciders:** Experiment team

## Context

Building a spec-compliant backend for the RealWorld (Conduit) benchmark. Must implement ~15 REST endpoints with JWT auth, relational data model (User, Article, Comment, Tag), and pagination. The stack must be TypeScript-native to leverage the full ForgeCraft `[API]` template and produce the clearest comparison with the control condition.

## Decision

**TypeScript 5 + Node.js + Express 4 + Prisma 5 + PostgreSQL**

## Alternatives Considered

| Option | Rejected Reason |
|---|---|
| NestJS | Too opinionated and decorator-heavy — would inject framework patterns that obscure the specification's architectural contribution |
| Fastify | Valid alternative, but Express is used in more RealWorld reference implementations — maximizes comparability with ground truth |
| Hono | Modern and fast, but ecosystem maturity lower than Express for this use case |
| Raw SQL (node-postgres) | Rejects Prisma's type-safe layer — increases accidental complexity without benefit for this scope |
| MongoDB | RealWorld's data model is inherently relational (follow graph, favorites, comments with authors) — forced into a document model adds unnecessary mapping work |
| Drizzle ORM | Newer and type-safe, but fewer reference implementations for comparability |

## Consequences

**Positive:**
- Prisma provides type-safe DB access with schema-as-source-of-truth
- Express + TypeScript is well-understood by the AI agents running both conditions
- Maximizes comparability against 100+ existing RealWorld reference implementations
- Jest is the natural test runner for this stack

**Negative:**
- Express requires more boilerplate than Fastify/Hono for middleware chains
- Prisma's generated client must be kept in sync with migrations

## Notes

This ADR governs both the treatment implementation and the evaluation baseline for the experiment. The control condition will also use this stack (same prompts); the architectural outcome difference will come from whether the agent was given a CLAUDE.md that enforces the layered architecture.
