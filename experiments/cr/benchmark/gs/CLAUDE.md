# Pastura API — Sentinel (root)

> GS cascade for the Pastura benchmark. This root is the sentinel: read it first, then
> descend only the node relevant to the current task. The tree is lossless — the leaves
> together specify the whole system. Stay within your read budget; do not load all nodes.

## Architectural identity
Pastura is a single-tenant REST API for rotational grazing management. It protects rangeland
by **refusing** herd moves that violate three rules and by **computing** grazing budgets.
The system of record is PostgreSQL. The API is stateless per request; all state is in the DB.

**Scope boundary:** paddocks, herds, forage readings, moves, and the three grazing rules.
Out of scope: multi-ranch tenancy, billing, weather, GIS/mapping, notifications.

## Architecture (layered — MUST hold)
```
routes/        HTTP only: parse, authorize, call a service, format the response. NO data-client calls here.
services/      business logic: the three rules (R1/R2/R3) and the computed reads live here.
repositories/  the ONLY layer that touches the data client (Prisma/Knex/pg). One repo per entity.
domain/        types + the rule/compute pure functions (capacity, budget, rest window).
```
**Dependency rule (Defended):** routes → services → repositories → data client. A data-client
call (`prisma.*`, `knex(...)`, raw `pg`) in a `routes/` or controller file is a **boundary
violation** and MUST NOT occur. The compute functions in `domain/` are pure (no I/O) so they
are unit-testable in isolation.

## Standards
- TypeScript strict. JWT: secret from `JWT_SECRET` (≥32 chars), expiry as a duration string
  `"24h"` (never a bare number). Postgres reached via `127.0.0.1` (not `localhost`).
- Error contract is normative — see `contracts.md`. Every error body is `{error:{code,message}}`.
- Naming: entities singular (`Paddock`), repos `<Entity>Repository`, services `<Area>Service`.

## Constraints & prohibitions (Defended)
- MUST NOT allow a move that violates R1, R2, or R3 (see `use-cases.md`) — the rule check is
  in the service and MUST run before persisting.
- MUST NOT expose `passwordHash`. MUST NOT let a `hand` mutate Paddocks/Herds/RestRules (403).
- MUST NOT put SQL or data-client calls outside `repositories/`.

## Routing (descend only what you need)
| Node | Read when you are… |
|---|---|
| `contracts.md` | defining endpoints, request/response shapes, or the error contract |
| `use-cases.md` | implementing a rule (R1/R2/R3) or a computed read — has acceptance criteria |
| `nfrs.md` | wiring auth, DB, config, or performance concerns |
| `test-architecture.md` | writing tests or setting the quality gate |

## Tool sequencing
1. Read this root, then `contracts.md` for the surface.
2. For any move endpoint, read `use-cases.md` — the rules are acceptance criteria, not prose.
3. Implement domain compute functions first (pure), unit-test them, then the service, then
   the route. Tests are authored with the code (phase collapse), gated per `test-architecture.md`.
