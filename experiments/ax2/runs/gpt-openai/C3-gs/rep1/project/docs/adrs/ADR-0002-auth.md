# ADR-0002: Stateless Authentication and Password Hashing

## Context

The Conduit API must authenticate requests from browser and mobile clients without maintaining server-side session state. Credentials must never be stored in recoverable form, and authentication tokens must be verifiable by any application instance so that the service can scale horizontally. The chosen password algorithm must resist GPU and memory-optimized cracking while offering maintained Node.js bindings. The API also needs a standard token format that clients can send with each protected request.

## Decision

The application will issue signed JSON Web Tokens after successful registration and login. Tokens will contain only the user identifier and will use an expiration configured through the environment. A secret of adequate length is required at startup. Protected routes will verify the token and load the current user; no mutable authentication state is stored in process memory. Passwords will be hashed and verified with argon2, using the library's secure defaults. Plaintext passwords will exist only for the duration of a request and will never be logged or persisted.

## Alternatives Considered

Database-backed sessions were considered but rejected because they add shared session storage, cleanup, and an additional lookup to every authenticated request. Opaque tokens were rejected for the same operational reason. Bcrypt was rejected despite its familiarity because common Node.js bcrypt packaging has historically depended on node-pre-gyp and its associated vulnerability chain and binary distribution surface. Argon2 provides a modern memory-hard algorithm and avoids choosing bcrypt solely for legacy familiarity.

## Consequences

Authentication remains stateless and application instances are interchangeable. Token revocation before expiration is not immediate, so token lifetimes must remain bounded and secret rotation requires an operational plan. JWT payloads must never contain secrets because they are encoded rather than encrypted. Argon2 hashing intentionally consumes CPU and memory, which improves resistance to brute force but requires sensible capacity planning. Environment validation becomes mandatory because a missing or weak signing secret would invalidate the security model.
