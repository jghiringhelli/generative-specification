# ADR-0002: Authentication and Password Hashing

## Context

Conduit clients need to authenticate across independent API requests without server-side
session affinity. Credentials must never be stored in recoverable form, and authorization
must be inexpensive to evaluate at the HTTP boundary. The chosen mechanisms should have
mature Node.js implementations and permit key rotation and configurable token lifetime.

## Decision

The API will issue signed JSON Web Tokens after registration and login. Each token contains
only the user identifier and an expiration time. A configured secret signs tokens, and
middleware verifies the signature and expiration before loading the current user. This
stateless approach allows any application instance to handle a request without shared
session storage. Passwords are hashed with argon2id using the maintained `argon2` package.
Argon2 is memory-hard and designed to resist GPU and specialized cracking attacks. Plain
passwords and password hashes are never returned through API DTOs.

## Alternatives Considered

Database-backed sessions were considered and provide immediate revocation, but they add a
stateful lookup to every authenticated request and require session lifecycle storage.
Opaque tokens backed by Redis have similar operational costs. Bcrypt was rejected despite
its familiarity because common Node bcrypt packaging has historically depended on
`node-pre-gyp`, extending the native-binary installation and vulnerability chain through
additional tooling. Argon2 also offers stronger memory-hard properties.

## Consequences

Authentication scales horizontally and requires no session database. Tokens cannot be
individually revoked before expiration, so expiry remains configurable and the signing
secret must be rotated if compromised. Authorization still reads current user state from
the repository. Argon2 consumes deliberate CPU and memory during login and registration;
deployment sizing must account for that security property.
