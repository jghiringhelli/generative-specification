# ADR-0002: Authentication and Password Hashing

- Status: Accepted
- Date: 2024-08-16

## Context

The Conduit API requires user authentication for protected endpoints
(current user, profile follow, article create/update/delete, favorites,
comments). The RealWorld spec mandates token-based authentication using the
`Authorization: Token <jwt>` header scheme. We must choose a token strategy and
a password-hashing algorithm that are secure, stateless where possible, and free
of known vulnerable dependency chains.

## Decision

- **JWT (JSON Web Tokens) for stateless authentication.** Tokens are signed with
  a server-side secret (`JWT_SECRET`) and carry the user id and username. A
  configurable expiry (`JWT_EXPIRY`, default `7d`) bounds token lifetime. Because
  JWTs are self-contained and verified by signature, no server-side session
  store is required, which keeps the API horizontally scalable.
- **argon2 for password hashing.** argon2id is the current OWASP-recommended
  password hashing function, memory-hard and resistant to GPU/ASIC attacks. It
  is used to hash passwords at registration and to verify them at login.

## Why Not bcrypt

bcrypt was rejected primarily due to its historically fragile native build
chain. The common `bcrypt` npm package depends on `node-pre-gyp`, which has
pulled in a chain of transitively vulnerable dependencies (advisories flowing
through `node-pre-gyp` and its download/tar helpers). This CVE chain has
repeatedly forced consumers to patch or pin transitive packages. Beyond the
supply-chain risk, bcrypt truncates inputs beyond 72 bytes and is not
memory-hard, making argon2id the stronger and cleaner choice. `argon2` provides
prebuilt binaries with a smaller and better-maintained dependency surface.

## Consequences

- `JWT_SECRET` becomes a required, validated environment variable; the app fails
  fast at startup if it is missing.
- Token verification is centralized in an authentication middleware that
  populates the request with the authenticated user id.
- argon2 requires a native module; CI and production images must support its
  prebuilt binaries.
- Password hashes are never returned across any layer boundary or serialized in
  responses.
