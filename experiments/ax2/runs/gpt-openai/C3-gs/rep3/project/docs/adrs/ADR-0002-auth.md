# ADR-0002: Authentication and Password Hashing

## Context

Conduit clients need to authenticate API calls without server-side session
storage. Credentials must never be stored in plaintext, and password verification
must use a memory-hard algorithm suitable for modern hardware. The mechanism
must work consistently across horizontally scaled application instances and
remain simple for browser and native clients.

## Decision

The API will issue signed JSON Web Tokens after successful registration or
login. Clients send the token through the `Authorization: Token <jwt>` header.
Tokens contain only the user identifier and expiration metadata. The signing
secret and lifetime are environment configuration, and authentication middleware
verifies every protected request. This stateless design avoids shared session
storage and lets any application instance process a request.

Passwords will be hashed and verified with argon2. Argon2 provides memory-hard
password derivation, incorporates salts automatically, and exposes safe defaults
through its maintained Node package. Plaintext passwords are accepted only at
the API boundary and are never returned or persisted.

## Alternatives Considered

Database-backed sessions were considered but rejected because they introduce
shared mutable session state and cleanup requirements. OAuth was not selected as
the primary mechanism because the RealWorld contract requires direct email and
password authentication.

bcrypt was rejected despite its familiarity. Common Node bcrypt distribution
paths historically depended on `node-pre-gyp`, which has been associated with a
chain of vulnerable transitive dependencies and CVE remediation pressure.
Argon2 avoids adopting that legacy dependency chain while providing a modern,
memory-hard algorithm.

## Consequences

JWT revocation is not immediate without adding a denylist or rotating the
signing secret, so token lifetimes must be bounded. Secret rotation requires an
operational plan. Password hashes are intentionally computationally expensive,
which increases login cost but reduces offline attack efficiency. Authentication
logic must consistently reject malformed, expired, and incorrectly signed
tokens without leaking verification details.
