# Pastura API — Domain Specification (ground truth)

> **Invented domain, authored 2026-09-17 for the CR study. No public reference
> implementation exists.** This file is the shared ground truth: BOTH conditions (naive and
> GS) build to this behavioral contract, and the conformance oracle is derived from it. Do
> not publish until after the runs (contamination control, see PREREGISTRATION §2).

Pastura is a REST API for **rotational grazing management** on a ranch: it tracks paddocks,
herds, the moves of herds between paddocks, forage (biomass) readings, and enforces three
grazing rules that protect the land. The value is that the API **refuses** moves that would
overgraze or under-rest a paddock, and it **computes** how many grazing days each paddock
has left.

The domain is invented for measurement. It is chosen for structural surface (five entities,
role-based auth, three temporal/computed business rules, a fixed error contract) and for a
checkable oracle, not for realism beyond what the rules state.

---

## 1. Stack contract (fixed for all conditions)

- Language/runtime: TypeScript on Node.js.
- HTTP: any framework (Express/Fastify/etc.) — framework choice is NOT scored.
- Persistence: PostgreSQL. A data-access layer (ORM or query builder) is allowed; **direct
  data-client calls in route/controller files are a layer violation** (scored).
- Auth: JWT bearer tokens. Secret from env `JWT_SECRET` (treat as ≥32 chars). Token expiry
  expressed as a duration string (e.g. `"24h"`), never a bare number.
- All request/response bodies are JSON.

## 2. Roles and auth

Two roles, one ranch (single-tenant for this benchmark; no cross-ranch isolation required):

- **owner** — full access to all endpoints.
- **hand** — MAY create Moves and ForageReadings; MUST NOT create/update/delete Paddocks,
  Herds, or RestRules (403 on attempt).

`POST /register` and `POST /login` issue a JWT. The JWT payload MUST carry the user id and
role. All endpoints except register/login require a valid bearer token (401 if missing or
invalid).

## 3. Entities

### 3.1 User
`id` (uuid), `email` (unique), `passwordHash`, `role` (`owner`|`hand`), `createdAt`.

### 3.2 Paddock — a fenced grazing area
`id` (uuid), `name` (unique, non-empty), `areaHectares` (number > 0),
`restDays` (integer ≥ 0 — the minimum rest this paddock requires; see Rule R1),
`createdAt`.

### 3.3 Herd — a group of animals
`id` (uuid), `name` (unique, non-empty), `animalUnits` (number > 0 — total stocking weight
of the herd, in animal-units), `createdAt`.

### 3.4 ForageReading — a dated biomass measurement of a paddock
`id` (uuid), `paddockId` (fk), `readingDate` (date), `kgDryMatterPerHectare` (number ≥ 0),
`createdAt`. Multiple readings per paddock over time; the **latest by `readingDate`** is the
current one.

### 3.5 Move — a herd occupying a paddock for an interval
`id` (uuid), `herdId` (fk), `paddockId` (fk), `enteredAt` (timestamp),
`leftAt` (timestamp, nullable — null means the herd is still there = an **open** move),
`createdAt`. Closing a move = setting `leftAt`.

## 4. Business rules (the oracle's teeth)

### R1 — Minimum rest before re-entry
A paddock MUST rest at least `restDays` days after a herd leaves before another herd may
enter. Precisely: a `POST /moves` with `enteredAt = t` on paddock P is **rejected (422)** if
there exists a closed move on P with `leftAt = L` such that `t < L + restDays_of_P (days)`
and no later closed move supersedes it. If the paddock has never been grazed, R1 does not
block.

### R2 — Stocking rate must not exceed carrying capacity
A paddock's **carrying capacity** (in animal-units) is computed from its latest ForageReading:
`capacityAU = (kgDryMatterPerHectare_latest × areaHectares) / 3000`.
(3000 kg dry matter per animal-unit is the fixed forage requirement constant for this
benchmark.) A `POST /moves` is **rejected (422)** if the entering herd's `animalUnits`
exceeds `capacityAU` for the target paddock. If the paddock has **no** ForageReading,
capacity is undefined and the move is **rejected (422)** (cannot stock an unmeasured
paddock).

### R3 — No overlapping open move
A paddock MUST have at most one open (un-left) move at a time. A `POST /moves` on a paddock
that already has an open move is **rejected (422)**.

## 5. Computed reads

### 5.1 Forage budget — grazing days left
`GET /paddocks/:id/budget` returns, for the paddock's current open move (if any):
`grazingDaysLeft = floor( (kgDryMatterPerHectare_latest × areaHectares) /
(herd.animalUnits × 3000 / 30) )`
i.e. total dry matter available divided by the herd's daily consumption (an animal-unit eats
`3000/30 = 100` kg dry matter per day). If no open move: `grazingDaysLeft = null`. If no
reading: `422`.

### 5.2 Paddock occupancy
`GET /paddocks/:id/occupancy` → `{ occupied: boolean, herdId: string|null, since: ts|null }`
from the current open move.

### 5.3 Herd rotation history
`GET /herds/:id/history` → moves for the herd, newest first: `[{paddockId, enteredAt, leftAt}]`.

## 6. Error contract (fixed; the oracle checks convention here)

Every error response body is exactly:
```json
{ "error": { "code": "<machine_code>", "message": "<human message>" } }
```
Codes and statuses:
- `401` `unauthenticated` — missing/invalid token.
- `403` `forbidden` — role not permitted.
- `404` `not_found` — entity id does not exist.
- `422` `validation` — bad input (missing/invalid fields).
- `422` `rule_rest` (R1), `rule_capacity` (R2), `rule_overlap` (R3) — a business rule
  rejected the move. (The `code` distinguishes which rule fired.)

Success bodies return the entity (or list) as JSON with `201` on create, `200` on
read/update, `204` on delete.

## 7. Endpoints (complete list)

```
POST   /register            {email,password,role}            -> 201 {token}
POST   /login               {email,password}                 -> 200 {token}

POST   /paddocks            owner  {name,areaHectares,restDays} -> 201 paddock
GET    /paddocks                                              -> 200 [paddock]
GET    /paddocks/:id                                          -> 200 paddock | 404
GET    /paddocks/:id/budget                                   -> 200 {grazingDaysLeft} | 422
GET    /paddocks/:id/occupancy                                -> 200 {occupied,herdId,since}

POST   /herds               owner  {name,animalUnits}         -> 201 herd
GET    /herds/:id/history                                     -> 200 [move]

POST   /readings            owner|hand {paddockId,readingDate,kgDryMatterPerHectare} -> 201 reading

POST   /moves               owner|hand {herdId,paddockId,enteredAt}  -> 201 move | 422(rule_*)
POST   /moves/:id/close     owner|hand {leftAt}               -> 200 move | 404
```

## 8. What is scored (see PREREGISTRATION §6)

Static suite (layer violations, duplication, complexity, tests) + the oracle pass rate over
§4–§6. The oracle is **convention-tolerant on framework/naming** and **strict on the three
business rules and the error contract** — because R1/R2/R3 and the error codes ARE the
behavioral contract, and everything else is implementation freedom.
