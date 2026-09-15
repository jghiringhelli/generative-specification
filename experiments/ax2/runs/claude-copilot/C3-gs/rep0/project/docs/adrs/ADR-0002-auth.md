# ADR-0002: Authentication and Password Hashing

- Status: Accepted
- Date: 2024-08-16

## Context

The Conduit API requires user authentication for most write operations and for
retrieving the current user. The API is a stateless HTTP service that may be
horizontally scaled, so authentication state must not be stored in server
memory. We also need to store user passwords securely, resistant to offline
brute-force and GPU-accelerated cracking attacks.

## Decision

- **JWT (JSON Web Tokens)** for stateless authentication. On successful
  registration or login the service issues a signed JWT containing the user id.
  Clients present it via the `Authorization: Token <jwt>` header (per the
  Conduit spec). Tokens are verified on each protected request; no server-side
  session store is required, which keeps the service stateless and scalable.
  The signing secret comes from `JWT_SECRET` and expiry from `JWT_EXPIRY`.
- **argon2** for password hashing. Argon2id is a modern, memory-hard password
  hashing algorithm and the winner of the Password Hashing Competition. It is
  the current OWASP-recommended default for new applications.

## Alternatives Considered

- **bcrypt** was rejected. Its common Node bindings pull in a native build
  toolchain through `node-pre-gyp`, which has a history of transitive
  dependency CVEs (the node-pre-gyp / tar / minimist chain), complicating
  `npm audit --audit-level=high` gates. bcrypt also has a 72-byte password
  truncation quirk and is not memory-hard, making it weaker against GPU
  attacks than argon2id.
- **Server-side sessions** (cookie + session store) were rejected because they
  require shared session state, adding infrastructure and coupling that the
  stateless JWT approach avoids.
- **scrypt** is a reasonable memory-hard alternative but argon2id is the more
  modern, competition-winning choice with a well-maintained Node binding.

## Consequences

- Tokens are self-contained; revocation before expiry is not supported without
  additional infrastructure (acceptable for this scope). Expiry is kept short
  (`JWT_EXPIRY`, default `7d`).
- The `JWT_SECRET` must be a strong, secret value injected via environment
  configuration and validated at startup (fail fast if missing).
- argon2 is used for both hashing on registration and verification on login;
  password hashes are never returned by the API.
