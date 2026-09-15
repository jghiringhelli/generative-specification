# ADR-0002: Authentication and Password Hashing Strategy

## Status
Accepted

## Context
The Conduit specification mandates stateless token-based authentication across API endpoints. Clients transmit credentials during registration and login, receiving a bearer token that must accompany subsequent authorized requests. Secure user authentication demands a secure, cryptographically sound password hashing algorithm that resists GPU-accelerated brute-force attacks, alongside an efficient, industry-standard stateless token mechanism.

## Decision
We select **JSON Web Tokens (JWT)** for stateless API authorization and **Argon2 (via argon2 npm package)** for password hashing.
1. **Stateless JWT**: Signed using HMAC-SHA256 with a cryptographically secure server-side secret (`JWT_SECRET`). Tokens encapsulate the user's primary identity claims (`id`, `username`, `email`) and an expiration period (`JWT_EXPIRY`), allowing distributed, stateless verification across request pipelines without per-request database lookups.
2. **Argon2 Password Hashing**: Utilizes the Argon2id variant, the winner of the Password Hashing Competition (PHC). Argon2 provides state-of-the-art resistance against both side-channel attacks and GPU/ASIC-assisted brute force attacks by requiring significant, tuneable memory and compute time.

## Alternatives Considered
- **bcrypt / bcryptjs vs. Argon2**: `bcrypt` relies on native bindings that historically suffered from dependency-chain vulnerabilities and compilation failures through `node-pre-gyp` (specifically remote code execution and supply chain risks in prebuilt binary fetch pipelines). Furthermore, bcrypt's memory cost is fixed, making it increasingly vulnerable to modern parallelized hardware cracking. Argon2 avoids these legacy pitfalls and is the modern cryptographic standard.
- **Session Cookies vs. JWT**: The RealWorld API specification explicitly dictates `Token <jwt>` or `Bearer <jwt>` authorization headers in HTTP requests, making cookie-based session stores incompatible with the specification.

## Consequences
- **Positive**: Stateless horizontal scalability; elimination of insecure native dependency chains; modern password protection; full compliance with the RealWorld API authorization protocol.
- **Negative**: JWT revocation before expiration requires token blacklisting if needed; Argon2 hashing requires calibrated memory and CPU usage on server hardware.
