# ADR-0002: Authentication and Password Hashing

- **Status:** Accepted
- **Date:** 2026-09-15
- **Deciders:** Backend engineering team

## Context

The Conduit API authenticates users and authorizes access to protected resources
(current user, article mutations, comments, follows, favorites). The RealWorld API
contract expects a bearer token returned on registration and login and supplied via
the `Authorization: Token <jwt>` header. We must also store user passwords securely
at rest. Two decisions are required: the session/token mechanism and the password
hashing algorithm.

## Decision

- **JWT for stateless authentication.** On successful registration or login we issue a
  signed JSON Web Token containing the user id. The token is verified on each protected
  request by middleware that populates the authenticated user context. Statelessness
  removes the need for server-side session storage and horizontal-scaling stickiness.
- **argon2 for password hashing.** Passwords are hashed with argon2id, the current
  Password Hashing Competition winner, with sensible memory/time cost parameters.

## Alternatives Considered

- **Server-side sessions** — require shared session storage and complicate horizontal
  scaling; rejected in favor of stateless JWTs for this API.
- **bcrypt for hashing — rejected.** bcrypt is commonly pulled in via native binding
  toolchains that historically depend on `node-pre-gyp`, which has been the subject of
  a chain of supply-chain and dependency-vulnerability advisories (the node-pre-gyp CVE
  chain). It also caps effective password length at 72 bytes. argon2id is memory-hard,
  resists GPU/ASIC cracking better, and avoids that native-toolchain CVE exposure.
- **PBKDF2 / scrypt** — acceptable but argon2id is the modern recommended default and
  offers stronger resistance to parallelized attacks.

## Consequences

- **Positive:** stateless, horizontally scalable auth; memory-hard hashing with strong
  resistance to offline cracking; reduced supply-chain risk by avoiding the bcrypt/
  node-pre-gyp chain.
- **Negative:** JWTs cannot be trivially revoked before expiry, so we keep token
  lifetime bounded via `JWT_EXPIRY`; argon2 hashing is intentionally CPU/memory costly.
- **Neutral:** the JWT secret and expiry are injected via environment configuration and
  validated at startup.
