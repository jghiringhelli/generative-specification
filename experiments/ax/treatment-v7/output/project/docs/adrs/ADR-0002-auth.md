# ADR-0002: Authentication — JWT (Stateless) + Argon2 Password Hashing

## Status

Accepted

## Date

2025-01-01

## Context

The Conduit API must authenticate users for protected endpoints and store password credentials safely at rest. Two decisions are required:

1. **Token mechanism** for API authentication across stateless HTTP requests.
2. **Password hashing algorithm** for credential storage.

The RealWorld specification explicitly mandates JWT-based authentication, with tokens passed in the `Authorization: Token <jwt>` header format. This eliminates session-based authentication as a conformant option.

## Decision

### Token Mechanism: JWT via `jsonwebtoken@^9`

JSON Web Tokens provide stateless authentication: the server signs a payload containing the user's `id` and `email` at login; subsequent requests carry this token. The server verifies the signature without a database lookup, enabling horizontal scaling with zero shared session state.

`jsonwebtoken@9` passes `npm audit --audit-level=high` with zero HIGH or CRITICAL CVEs.

The JWT payload carries `{ id, email }`. The signing secret is sourced exclusively from `process.env.JWT_SECRET` — never hardcoded. Startup validation rejects any secret shorter than 32 characters.

**ESM Import Safety**: `jsonwebtoken` is a CommonJS module. In TypeScript projects with `esModuleInterop: true`, named imports (`import { sign } from 'jsonwebtoken'`) fail at runtime with "Named export not found". The project enforces the documented safe import pattern in all files that use this module:

```typescript
import pkg from 'jsonwebtoken';
const { sign } = pkg;
// or
const { verify } = pkg;
```

This pattern is applied in `AuthService.ts` (signing) and `middleware/auth.ts` (verification).

### Password Hashing: Argon2 via `argon2@^0.41`

Argon2 is the winner of the Password Hashing Competition (2015) and the OWASP-recommended algorithm for new projects as of 2024. It is memory-hard by design, which makes GPU and ASIC brute-force attacks economically impractical compared to bcrypt or SHA-family algorithms.

`argon2@0.41` uses `napi-rs` bindings with no transitive native compilation dependency chain, eliminating the CVE exposure that disqualified bcrypt (see below).

## Why Bcrypt Was Rejected

`bcrypt@5` was evaluated and rejected after `npm audit` reported three HIGH-severity vulnerabilities introduced via its transitive dependency chain:

```
bcrypt@5
  └── @mapbox/node-pre-gyp
        └── tar
              ├── CVE-2021-37713 (HIGH) — arbitrary file creation via symlink attack
              ├── CVE-2021-32803 (HIGH) — path traversal via symlink
              └── CVE-2021-32804 (HIGH) — path traversal via link following
```

Per project policy (§ Dependency Registry), zero HIGH/CRITICAL CVEs are permitted without a named ADR security exception. No safe version of `bcrypt` in the `^5` range resolves this chain. `argon2` avoids the chain entirely because it has no `node-pre-gyp` dependency.

## Alternatives Considered

| Alternative | Rejected because |
|---|---|
| `bcrypt@5` | 3 HIGH CVEs via `@mapbox/node-pre-gyp` → `tar` transitive chain. See above. |
| `express-session` + database sessions | Contradicts RealWorld spec JWT requirement; adds server-side state that complicates horizontal scaling. |
| Paseto (Platform-Agnostic Security Tokens) | RealWorld spec explicitly requires JWT; Paseto tokens would break client compatibility. |
| `scrypt` (Node.js built-in `crypto.scrypt`) | No community-standardized API; requires manual parameter tuning (N, r, p) without published OWASP defaults for the specific version; no ecosystem tooling for migration from bcrypt. |
| `jose` (JWT library) | ESM-only package creates additional bundling complexity; `jsonwebtoken@9` is the more established choice with broader production deployment history. |

## Consequences

**Positive**:
- Stateless JWT auth scales horizontally with zero shared session state.
- Argon2 is GPU-resistant by design; default parameters (`argon2.hash()` without options) provide safe OWASP-compliant security margins.
- Zero HIGH/CRITICAL CVEs in auth dependencies at time of adoption.

**Negative**:
- JWT tokens cannot be invalidated before expiry without a token denylist. A logged-out token remains valid until its `exp` claim passes. This is an accepted limitation for this API scope — adding a denylist (Redis or DB table) is a documented future enhancement.

**Risk and Mitigation**:
- _Risk_: JWT secret exposure compromises all active tokens simultaneously. _Mitigation_: Secret sourced from `process.env.JWT_SECRET` only; minimum 32-character length enforced at startup; secret never logged; `.env` is gitignored.
- _Risk_: Argon2 default parameters may require tuning as hardware improves. _Mitigation_: Document current parameters in a comment; OWASP guidance is reviewed at each dependency upgrade.
