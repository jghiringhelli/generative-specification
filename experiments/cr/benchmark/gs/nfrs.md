# Pastura — NFRs & wiring

## Config
- All secrets/config from env: `DATABASE_URL` (Postgres via `127.0.0.1`, not `localhost`),
  `JWT_SECRET` (≥32 chars), `PORT`.
- JWT expiry is a duration string `"24h"` (a bare number is read as milliseconds by the `ms`
  library and will expire tokens immediately — a known trap).

## Persistence
- One schema migration defines all tables. `repositories/` is the only layer importing the
  data client. Unique constraints on `Paddock.name`, `Herd.name`, `User.email`.

## Auth
- Passwords hashed (bcrypt/argon2). `passwordHash` never serialized. Bearer token on every
  endpoint except register/login. Middleware sets `req.user = {userId, role}`.

## Performance
- Read endpoints (`/budget`, `/occupancy`, `/history`) SHOULD respond under 100 ms p99 on the
  seeded fixture. Indexes on `Move.paddockId`, `Move.herdId`, `ForageReading.paddockId`.

## Determinism
- Rule checks and computes are pure functions in `domain/` taking already-fetched data;
  no clock/random inside them (pass `enteredAt`/`now` in). This makes them unit-testable.
