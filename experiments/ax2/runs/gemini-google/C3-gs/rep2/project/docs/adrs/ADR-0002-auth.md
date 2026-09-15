# ADR-0002: Authentication Architecture and Password Hashing

## Status
Accepted

## Date
2026-09-15

## Context
The RealWorld / Conduit specification mandates stateless authentication for user endpoints. Users authenticate with an email and password, receiving a token upon registration and login. Protected endpoints (`/api/user`, `/api/articles` write operations, `/api/profiles/:username/follow`, comments, and favorites) authenticate requests via an `Authorization: Token <jwt>` or `Authorization: Bearer <jwt>` HTTP header. Additionally, user credentials must be stored with modern cryptographic protection resistant to brute-force and hardware-accelerated dictionary attacks.

## Decision
1. **Token Format**: JSON Web Tokens (JWT) using the HMAC-SHA256 (`HS256`) algorithm.
   - Tokens contain the user's primary identity identifier (`id`) in the subject payload.
   - Tokens are signed with a server-side secret (`JWT_SECRET`) and carry a configurable expiration lifetime (`JWT_EXPIRY`, default 7 days).
   - In accordance with ESM/CommonJS compatibility guidelines (§11), `jsonwebtoken` must be imported via default/namespace object destructuring (`import pkg from 'jsonwebtoken'; const { sign } = pkg;` in services and `const { verify } = pkg;` in middleware).
2. **Password Hashing**: `argon2` (Argon2id algorithm).
   - Argon2 won the Password Hashing Competition (PHC) and provides superior resistance against GPU and ASIC cracking by incorporating both memory-hard and CPU-intensive computational constraints.

## Why bcrypt was Rejected
While `bcrypt` is historically common in Node.js applications, it was explicitly evaluated and rejected due to:
- Persistent vulnerabilities and supply-chain attack surface in native build dependencies, specifically the `node-pre-gyp` binary installation toolchain which has been subject to multiple CVEs and remote code execution concerns.
- `node-pre-gyp` falls back to compilation requiring Python and C++ build environments on target hosts, causing non-deterministic CI and production build failures.
- `bcrypt` truncates input passwords silently at 72 bytes, creating edge-case authentication truncation vulnerabilities.
- In contrast, the modern `argon2` npm package utilizes clean pre-built WebAssembly and N-API bindings without `node-pre-gyp`, providing robust supply-chain security and superior cryptographic strength.

## Consequences
- Fast and stateless token verification without distributed session store overhead.
- Safe password storage using state-of-the-art Argon2id hashing.
- Expiration casting requirement: `process.env.JWT_EXPIRY` must be safely typed using `(process.env.JWT_EXPIRY ?? '7d') as SignOptions['expiresIn']` to prevent TypeScript compilation errors.
