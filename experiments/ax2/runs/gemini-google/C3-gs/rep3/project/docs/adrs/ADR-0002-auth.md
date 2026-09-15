# ADR-0002: Authentication Mechanism and Password Hashing Strategy

## Status
Accepted

## Context
The RealWorld Conduit specification mandates stateless authentication for protected endpoints (profile following, article creation, commenting, favoriting) alongside credential-based user registration and login. Passwords must be hashed and stored securely to prevent rainbow table attacks, offline brute-force attempts, and side-channel timing attacks. Furthermore, external native dependencies must be evaluated against supply-chain security vulnerabilities and long-term maintenance hygiene.

## Decision
We adopt the following cryptographic and authentication strategy:
1. **Stateless Authorization Tokens**: JSON Web Tokens (JWT) signed via HMAC-SHA256 (`HS256`). Tokens carry user identification (`userId`, `username`) and an explicit expiration timestamp (`exp`). Tokens are transmitted via the standard HTTP `Authorization: Token <jwt>` or `Authorization: Bearer <jwt>` header.
2. **Password Hashing**: Argon2 (via the `argon2` npm library implementing Argon2id). Argon2 won the Password Hashing Competition (PHC) and provides superior resistance against GPU-accelerated and ASIC-based attacks through memory-hard operations and time-cost configurability.

## Alternatives Considered
- **bcrypt / bcryptjs**: While traditionally popular, `bcrypt` relies on native binaries compiled via `node-pre-gyp`, which has a history of transitive supply-chain CVE vulnerabilities and complex platform-dependent build failures. `bcryptjs` avoids native compilation but exhibits significantly lower hashing throughput and lack of memory hardness. Argon2 offers modern cryptographic guarantees and clean native bindings without legacy `node-pre-gyp` baggage.
- **Stateful Session Cookies**: Stateful sessions require centralized session storage (e.g., Redis) or sticky sessions, adding operational complexity and running counter to the stateless API expectations of the Conduit specification and test harness.

## Consequences
- **Positive**: State-of-the-art password security with memory hardness resistant to hardware cracking. Completely stateless verification minimizes database lookups on authenticated requests.
- **Negative**: JWT revocation before expiration requires token blacklisting if needed in future enhancements. Native Argon2 bindings require compatible build environments, though prebuilt binaries mitigate this across common architectures.
