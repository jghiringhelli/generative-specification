# ADR-0002: Authentication and Password Hashing

- Status: Accepted
- Date: 2024-08-16

## Context

The Conduit API is a stateless REST service. Clients authenticate with a token supplied on
each request via the `Authorization: Token <jwt>` header. We must choose a token mechanism
and a password-hashing algorithm that are secure, well-supported, and appropriate for a
horizontally scalable, session-less backend.

## Decision

- **JWT (JSON Web Tokens)** for stateless authentication. Tokens are signed with an HMAC
  secret (`JWT_SECRET`) and carry the user id and username claims. Because verification needs
  only the shared secret, no server-side session store is required, and any instance can
  validate a request. Token lifetime is configurable through `JWT_EXPIRY` (default `7d`).
- **argon2** (argon2id) for password hashing. Argon2 is the winner of the Password Hashing
  Competition and is memory-hard, giving strong resistance to GPU and ASIC brute-force attacks.
  We store only the argon2 hash and verify candidates at login time.

## Why bcrypt was rejected

The popular `bcrypt` npm package depends on native bindings historically built through
`node-pre-gyp`, which pulled in a chain of transitive dependencies carrying published CVEs
(including advisories in `node-pre-gyp` and its `tar`/`https-proxy-agent` dependency chain).
This inflates the audit surface and repeatedly trips `npm audit --audit-level=high` in CI.
bcrypt also caps the effective password length at 72 bytes and is not memory-hard. `argon2`
provides a modern, memory-hard algorithm with a cleaner dependency tree, avoiding the
node-pre-gyp CVE chain while offering stronger security guarantees.

## Consequences

- We depend on the `argon2` native module, which requires a compile toolchain during install;
  CI and production images must accommodate this.
- JWTs are bearer credentials: they cannot be revoked before expiry, so we keep lifetimes
  bounded and rely on `JWT_SECRET` rotation for emergency invalidation.
- The `JWT_SECRET` becomes a critical secret; it is injected via environment configuration and
  never committed to source control.
