# ADR-0002: Authentication Architecture and Password Hashing Strategy

## Status
Accepted

## Context
The RealWorld specification prescribes token-based user authentication. Clients authenticate via an HTTP `Authorization` header formatted as `Token <jwt>` (or optionally `Bearer <jwt>`), requiring stateless token generation and signature verification without session store overhead. Furthermore, user passwords must be hashed using a modern, cryptographically resilient key derivation function that guards against offline dictionary attacks, Rainbow table attacks, and GPU/ASIC-accelerated brute force attempts. We need a secure, auditable, and resilient strategy for password hashing and credential issuance.

## Decision
1. **JSON Web Tokens (JWT)**: We adopt standard signed JSON Web Tokens (`jsonwebtoken` package) carrying the authenticated user's identifier and username in the payload. Tokens are stateless and verified via a shared secret (`JWT_SECRET`) with configurable expiration (`JWT_EXPIRY`, defaulting to 7 days).
2. **Argon2 for Password Hashing**: We adopt Argon2 (using the `argon2` npm package implementing Argon2id), the winner of the Password Hashing Competition (PHC). Argon2 provides state-of-the-art resistance against side-channel attacks and GPU cracking through configurable memory cost, time cost, and parallelism parameters.

## Alternatives Considered
- **Bcrypt**: Bcrypt was explicitly rejected due to significant security and supply chain vulnerabilities. Node implementations of bcrypt (notably `bcrypt` and `bcryptjs`) rely on native C++ addons built with `node-pre-gyp` or legacy tooling. Historically, the `node-pre-gyp` ecosystem has suffered multiple critical CVE chains involving remote code execution during package installation, unauthenticated binary downloads over HTTP, and dependency hijacking. In addition, bcrypt is limited to 72 bytes of password entropy and lacks the memory-hard defense properties provided by Argon2id.
- **PBKDF2**: While available natively in Node.js `crypto`, PBKDF2 is computationally inferior to Argon2 against specialized ASIC hardware attacks.
- **Server-Side Sessions / Redis**: Rejected because the Conduit specification requires standard stateless token exchange suitable for distributed single-page applications and decoupled clients without central session storage dependencies.

## Consequences
- **Positive**: State-of-the-art cryptographic password protection with zero dependency on the vulnerable `node-pre-gyp` toolchain. Stateless horizontal scalability with fast, local cryptographic verification of JWT tokens.
- **Negative**: Argon2 requires native compilation or prebuilt binaries during installation. JWT invalidation before expiration requires token blocklisting if immediate revocation becomes necessary.
