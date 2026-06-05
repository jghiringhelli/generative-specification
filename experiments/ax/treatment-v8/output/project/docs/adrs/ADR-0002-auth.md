# ADR-0002: Authentication & Password Hashing

- **Status**: Accepted
- **Date**: 2026-06-04
- **Deciders**: Architecture Sentinel
- **Depends on**: ADR-0001

## Context

The RealWorld API is stateless and token-based: clients authenticate once and
present a bearer token (`Authorization: Token <jwt>`) on subsequent requests.
We need (1) a token mechanism that requires no server-side session store and
(2) a password-hashing scheme that resists offline brute-force and GPU attacks,
while keeping the dependency surface free of known-vulnerable transitive
packages (the constitution mandates `npm audit --audit-level=high` as a commit
gate).

## Decision

- **Tokens**: JSON Web Tokens (JWT) via `jsonwebtoken@^9`, signed with HS256
  using a `JWT_SECRET` injected from the environment and validated at startup
  (fail fast if absent). Tokens are stateless, carrying the user id and a short
  expiry; no session table is required. Because `jsonwebtoken` is a CommonJS
  package, it is consumed via a **default import** under our ESM/NodeNext setup:
  `import pkg from 'jsonwebtoken'; const { sign } = pkg;` in the signing service
  and `const { verify } = pkg;` in the auth middleware. Named ESM imports from
  this package break at runtime and are prohibited.
- **Password hashing**: `argon2@^0.40` using the Argon2id variant. Argon2id won
  the Password Hashing Competition and is memory-hard, providing strong
  resistance to GPU/ASIC cracking with tunable memory, time, and parallelism
  cost parameters. Hashes are self-describing (parameters embedded), simplifying
  future cost increases.

## Alternatives Considered

- **bcrypt — rejected.** The common `bcrypt` npm package compiles native code
  via `node-pre-gyp`, which has pulled in a chain of advisories (the
  `node-pre-gyp` → `tar`/`node-tar` path traversal CVE line, plus repeated
  `npm audit` high findings through transitive build deps). That conflicts
  directly with our high-severity audit gate. bcrypt is also limited to a 72-byte
  input and is only CPU-hard, not memory-hard. `argon2` avoids the
  `node-pre-gyp` chain and offers a stronger security profile.
- **Server-side sessions (cookies + store)**: rejected — adds a stateful store
  and does not match the RealWorld token contract.
- **PBKDF2 / scrypt**: acceptable fallbacks but weaker (PBKDF2 is not
  memory-hard) or less ergonomic than Argon2id; not chosen.

## Consequences

Authentication scales horizontally with no shared session state. The auth
boundary lives in a thin middleware adapter that verifies the token and attaches
the user id; services depend only on that resolved identity, never on HTTP.
The `argon2` native dependency must build on CI runners (Node 20 prebuilds are
available). The HS256 secret is a single point of trust and must be managed as a
secret in every environment; rotating it invalidates outstanding tokens, which
is acceptable given their short lifetime.
