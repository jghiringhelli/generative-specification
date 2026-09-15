# ADR-0002: JWT Authentication and Argon2 Password Hashing

## Status

Accepted

## Context

The API serves clients that may be browser, mobile, or command-line applications. Authentication therefore needs to remain independent of server-side sessions and must support the RealWorld `Token` authorization scheme. User passwords must never be stored or compared in plaintext, and the hashing algorithm must resist both CPU- and memory-optimized attacks. Authentication configuration must be supplied by the deployment environment.

## Decision

The application will issue signed JSON Web Tokens after registration, login, and authenticated user updates. Tokens contain only the user identifier and an expiration, are signed with an environment-provided secret, and are verified on every protected request. This keeps application instances stateless and allows horizontal scaling without a shared session store.

Passwords will be hashed and verified with argon2 using the library's secure defaults. Argon2 is memory-hard, has modern password-hashing design goals, and exposes a direct asynchronous API. Password hashes are never included in API responses.

## Alternatives Considered

Database-backed sessions were rejected because they add stateful storage and cleanup requirements that the API does not need. Opaque tokens were rejected for the same shared lookup requirement. bcrypt was considered because it is familiar, but rejected due to its CPU-only design and the historical vulnerability and maintenance chain associated with native binary distribution through `node-pre-gyp`, including CVEs in transitive tooling. Argon2 offers stronger contemporary resistance characteristics without choosing bcrypt's legacy dependency path.

## Consequences

The JWT signing secret becomes critical deployment configuration and must be rotated carefully because rotation invalidates existing tokens. Revocation is not immediate without an additional denylist mechanism. Token payloads must remain minimal because they are readable by clients. Argon2 consumes intentional memory and CPU during authentication, so deployment resources and rate limiting must account for that cost.
