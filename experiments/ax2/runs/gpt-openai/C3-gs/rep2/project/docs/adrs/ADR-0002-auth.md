# ADR-0002: Stateless Authentication and Password Hashing

## Context

The API must authenticate clients without server-side session storage and must
protect stored credentials if the database is exposed. Authentication is used
by browser, mobile, and automated clients, so the mechanism must travel cleanly
in an HTTP authorization header and scale across multiple application
instances.

## Decision

The application will issue signed JSON Web Tokens after registration and login.
Each token identifies the user through an immutable user ID and has a configured
expiration. API middleware will verify the signature and expiration before
loading authenticated context. The signing secret and lifetime are supplied by
environment configuration and never stored in source control. Tokens make the
HTTP tier stateless, allowing any healthy application instance to process a
request without shared session storage.

Passwords will be hashed with argon2 using the library's secure encoded format.
Argon2 is memory-hard and designed to resist GPU and specialized cracking
hardware. Verification uses the parameters embedded in each encoded hash,
allowing parameters to evolve over time.

## Alternatives Considered

Database-backed sessions were rejected because they introduce shared mutable
session state and an additional lookup for each authenticated request. Opaque
tokens were rejected for the same operational reason. Bcrypt was considered
but rejected because common Node bcrypt distributions have historically relied
on a native binary installation chain involving `node-pre-gyp`; vulnerabilities
in that CVE-prone transitive chain increase supply-chain and installation risk.
Argon2 also provides a stronger memory-hard design.

## Consequences

Token revocation is not immediate unless an additional deny-list or token
version mechanism is introduced. Short, configurable expirations limit this
risk. A leaked signing secret compromises all active tokens, so secret rotation
and protected configuration are operational requirements. Argon2 consumes more
memory and CPU than simpler hashes by design, and authentication capacity must
account for that cost.
