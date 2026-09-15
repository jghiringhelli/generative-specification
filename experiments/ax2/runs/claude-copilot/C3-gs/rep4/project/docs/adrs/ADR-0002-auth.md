# ADR-0002: Authentication and Password Hashing

- Status: Accepted
- Date: 2024-08-16

## Context

The RealWorld API is a stateless JSON service consumed by SPA and mobile clients. Protected
endpoints expect an `Authorization: Token <jwt>` header. We need an authentication scheme
that scales horizontally without server-side session storage, and a password hashing
strategy that resists offline brute-force and GPU cracking while remaining maintainable and
free of fragile native build chains.

## Decision

We use **JSON Web Tokens (JWT)** for stateless authentication and **argon2** (argon2id) for
password hashing.

JWTs are signed with a secret loaded from configuration (`JWT_SECRET`) and carry the user id
and a configurable expiry (`JWT_EXPIRY`, default `7d`). Because the token is self-contained
and verifiable with only the secret, any instance can authenticate a request without shared
session state, satisfying the stateless, horizontally scalable requirement.

argon2id is the winner of the Password Hashing Competition and the OWASP-recommended default.
It is memory-hard, tunable via time/memory/parallelism cost, and computes a self-describing
encoded hash so we never manage salts manually.

## Why bcrypt Was Rejected

The common Node `bcrypt` package compiles native bindings through **node-pre-gyp**, which has
carried a chain of transitive advisories and supply-chain risk, and frequently breaks on new
Node releases and CI images because prebuilt binaries lag. This installation fragility and the
associated CVE chain via node-pre-gyp make it a liability in a security-gated pipeline that
runs `npm audit --audit-level=high`. bcrypt also caps input at 72 bytes and is not memory-hard.
argon2 avoids the node-pre-gyp toolchain concerns and offers stronger, tunable resistance.

## Consequences

- Positive: stateless auth, no session store, simple horizontal scaling.
- Positive: memory-hard hashing with modern, audited defaults; clean `npm audit`.
- Negative: JWTs cannot be revoked before expiry without an extra denylist; mitigated by short
  expiry and re-issuing on sensitive changes.
- Negative: argon2 still ships a native addon but without the node-pre-gyp advisory chain.
