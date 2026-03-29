---
nav_exclude: true
---

# ADR-0002 — Authentication Strategy

**Status**: Accepted  
**Date**: 2024-01-01  
**Deciders**: Engineering team

---

## Context

The Conduit API requires stateless authentication so that API instances can scale horizontally without shared session state. Users must authenticate once (login or register) and receive a credential that authorizes subsequent requests. The credential must be verifiable without a database lookup on every request.

Passwords must be stored as cryptographic hashes resistant to offline dictionary attacks. The hashing algorithm must be resistant to GPU-accelerated brute force.

---

## Decision

**JWT (JSON Web Tokens) for stateless auth + argon2 for password hashing**

### JWT for stateless authentication

JSON Web Tokens (RFC 7519) are signed, self-contained tokens that encode user identity claims. The API signs tokens with a server-side secret (`JWT_SECRET` from environment). Route handlers verify the signature without a database lookup, enabling horizontal scaling with zero shared session state.

**Token format per RealWorld spec**: `Authorization: Token jwt.token.here`

The `jsonwebtoken@^9` library is used for signing and verification. The `expiresIn` field is typed as `SignOptions['expiresIn']` (not plain `string`) to satisfy TypeScript strict mode — see CLAUDE.md § Known Type Pitfalls for the documented cast pattern.

**Alternatives considered:**
- **Session tokens (server-side)**: Require a shared session store (Redis, DB) for multi-instance deployments. Eliminated because the architecture requires stateless services.
- **OAuth 2.0 / OIDC**: Correct for federated identity (third-party login), but overkill for a self-contained API with its own user registry. Adds external service dependency.
- **Paseto (Platform-Agnostic Security Tokens)**: More secure defaults than JWT (no `alg: none` attack surface), but `jsonwebtoken` is required by the RealWorld spec's `Authorization: Token` header convention and has a larger audit surface at this time.

### argon2 for password hashing

Argon2 is the winner of the Password Hashing Competition (2015) and is OWASP's recommended algorithm for new applications. The `argon2@^0.41` library is used.

**Why argon2 over bcrypt:**

`bcrypt@5` pulls in `@mapbox/node-pre-gyp` as a transitive dependency. `node-pre-gyp` depends on `tar`, which has an active CVE chain with multiple HIGH-severity vulnerabilities related to path traversal during extraction. As of the time of stack selection:

- `node-pre-gyp@1.0.11` → `tar@6.x` → CVE-2021-32803 (HIGH), CVE-2021-32804 (HIGH), CVE-2021-37701 (HIGH), CVE-2021-37712 (HIGH)

Running `npm audit --audit-level=high` on a project with `bcrypt@5` reports these vulnerabilities, which would block the pre-commit hook and CI pipeline per the project's zero-HIGH/CRITICAL-CVE policy. No safe workaround exists without patching the transitive dependency.

`argon2` uses a WebAssembly fallback and does not have native compilation dependencies. `npm audit --audit-level=high` on a project with `argon2@^0.41` reports zero HIGH/CRITICAL vulnerabilities.

Additionally, argon2id (the default variant in `argon2@^0.41`) provides better resistance to both side-channel attacks and GPU-accelerated brute force than bcrypt due to its memory-hard design.

---

## Consequences

**Positive:**
- Stateless auth enables horizontal scaling with no session store dependency
- JWT tokens are self-describing — client can read expiry without a server call
- argon2id is memory-hard — GPU farms are not cost-effective for cracking
- Zero HIGH/CRITICAL CVEs in the auth dependency chain

**Negative:**
- JWT tokens cannot be revoked without a token blacklist (accepted tradeoff; implement logout via client-side token discard per RealWorld spec)
- JWT `expiresIn` TypeScript typing requires a documented cast pattern — mitigated by the Known Type Pitfalls documentation in CLAUDE.md
- argon2 requires a native Node.js addon (WebAssembly fallback available) — Docker image must include build tools or use pre-built binaries

**Security configuration:**
- `JWT_SECRET` must be a cryptographically random string of at least 32 bytes
- `JWT_EXPIRY` defaults to `7d` — configurable via environment variable
- Tokens signed with `HS256` (HMAC-SHA256) — symmetric, suitable for single-service APIs
- Password hashes use argon2id with default memory/time parameters (configurable via environment if needed)

**Risks:**
- JWT secret rotation requires re-login for all users — document the rotation procedure in ops runbook
- argon2 WebAssembly performance on constrained containers — benchmark in production environment
