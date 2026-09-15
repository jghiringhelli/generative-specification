# ADR-0002: Authentication and Password Security Architecture

## Status
Accepted

## Date
2026-09-15

## Context
The Conduit API specification specifies a stateless token-based authentication mechanism. Endpoints require selective access control: public reading of articles, profile viewing with optional authentication, and strictly authenticated write operations (such as creating articles, posting comments, favoriting, and following users). Furthermore, user credentials must be protected against credential stuffing, offline dictionary attacks, rainbow tables, and side-channel vulnerabilities.

Selecting authentication token mechanics and password hashing algorithms requires balancing security rigor, execution performance, dependency chain integrity, and deployment resilience.

## Decision
We decide to adopt:
1. **JSON Web Tokens (JWT)**: Used for stateless, cryptographically signed Bearer token authentication via HMAC SHA-256 (`HS256`). Tokens encode user identity claims (`id`, `email`, `username`) and carry an expiration timestamp, eliminating the need for server-side session stores or distributed cache lookup latency on every API request.
2. **Argon2 (`argon2id`)**: Used for password hashing and verification. Argon2 is the winner of the Password Hashing Competition (PHC) and provides superior resistance against GPU/ASIC-assisted brute-force attacks through memory-hard cryptographic functions.

## Rejection of Bcrypt (CVE Chain and Build Fragility)
`bcrypt` and `bcryptjs` were explicitly rejected:
- Traditional native `bcrypt` relies on `node-pre-gyp` / `node-gyp` toolchains to fetch or compile native C++ binaries during installation. This build dependency chain has historically introduced multiple CVE vulnerabilities, remote binary execution risks during install phases, and intermittent compilation failures in lightweight Alpine-based container environments.
- Pure JavaScript alternatives such as `bcryptjs` suffer from severe timing-attack vulnerabilities and lack the memory-hardness required to withstand contemporary GPU-accelerated cracking clusters.
- `argon2` provides modern memory-hard key derivation with stable, audited bindings and robust resistance against side-channel analysis.

## Consequences
- **Positive**: Stateless JWT tokens enable horizontal API scalability. Argon2 delivers industry-leading cryptographic defense against password compromise.
- **Negative**: Argon2 hashing requires calibrated memory and CPU usage per hash operation. Tokens cannot be revoked before expiration without maintaining a token denylist or rotating secrets.
