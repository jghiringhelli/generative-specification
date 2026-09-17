# Pastura — Use Cases (rules & computed reads, with acceptance criteria)

> Each rule is stated prescriptively (MUST/MUST NOT) with acceptance criteria that ARE the
> tests. A defect here is a query to this file. Constants are fixed: forage requirement =
> **3000 kg dry matter per animal-unit**; daily intake = **3000/30 = 100 kg/AU/day**.

## UC-1 — Create a move (the guarded write)
`POST /moves {herdId, paddockId, enteredAt}` as owner or hand.
The service MUST evaluate R1, R2, R3 (below) BEFORE persisting. On any failure it MUST NOT
persist and MUST return `422` with the rule's `code`. On success → `201` with the move.

### R1 — Minimum rest before re-entry
- The target paddock MUST have rested ≥ `restDays` days since the last herd left.
- Acceptance: given the paddock's most recent closed move with `leftAt = L`, a new
  `enteredAt = t` MUST be rejected (`422 rule_rest`) when `t < L + restDays days`, and
  accepted when `t ≥ L + restDays days`. A never-grazed paddock is never blocked by R1.

### R2 — Stocking rate ≤ carrying capacity
- `capacityAU = (latestReading.kgDryMatterPerHectare × paddock.areaHectares) / 3000`.
- Acceptance: the move MUST be rejected (`422 rule_capacity`) when `herd.animalUnits >
  capacityAU`; accepted when `herd.animalUnits ≤ capacityAU` (equal passes). If the paddock
  has NO forage reading, capacity is undefined and the move MUST be rejected (`422 rule_capacity`).

### R3 — No overlapping open move
- A paddock MUST have at most one open (un-`leftAt`) move at a time.
- Acceptance: a move onto a paddock that already has an open move MUST be rejected
  (`422 rule_overlap`). After the open move is closed, a new move is accepted.

## UC-2 — Close a move
`POST /moves/:id/close {leftAt}` → `200` with the updated move; `404 not_found` if the move
id does not exist. Closing sets `leftAt`; a closed move is what R1 reads.

## UC-3 — Forage budget (computed read)
`GET /paddocks/:id/budget`. For the paddock's current open move:
`grazingDaysLeft = floor( (latestReading.kgDryMatterPerHectare × areaHectares) /
(openMove.herd.animalUnits × 100) )`.
- Acceptance: with kgDM=6000, area=20, herd=10 AU → `120`. No open move → `{grazingDaysLeft:null}`,
  `200`. No reading → `422`.

## UC-4 — Occupancy (computed read)
`GET /paddocks/:id/occupancy` → `{occupied, herdId, since}` from the current open move
(`{occupied:false, herdId:null, since:null}` when none). `200`.

## UC-5 — Herd rotation history
`GET /herds/:id/history` → moves for the herd, newest first, each `{paddockId, enteredAt, leftAt}`. `200`.

## UC-6 — Roles
- `hand` MAY: `POST /moves`, `POST /readings`, and all reads.
- `hand` MUST NOT: create/update/delete Paddocks, Herds, RestRules → `403 forbidden`.
- Any endpoint except register/login without a valid token → `401 unauthenticated`.
