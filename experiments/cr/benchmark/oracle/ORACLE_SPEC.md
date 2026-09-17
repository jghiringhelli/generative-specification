# Pastura Conformance Oracle (specification)

> The oracle scores **behavioral conformance** to `../DOMAIN_SPEC.md`. It is the metric that
> Conduit could not give cleanly (contamination + strict-REST-convention unfairness). Design
> rules, pre-registered:
>
> - **Strict** on: the three business rules (R1/R2/R3), the error `code` values, the
>   computed-read arithmetic (§5), and role gating (§2).
> - **Tolerant** on: framework, route casing, field ordering, extra fields, and any 2xx
>   status within the documented family (201/200 interchangeable on create is allowed;
>   204-vs-200 on delete is NOT scored).
> - Each probe is **independent** where possible; ordered probes declare their setup.
> - Score = (probes passed) / (probes total). Report per-group sub-scores too.
>
> Implementation note: probes are authored as Hurl files under `probes/` generated from this
> matrix at setup time, run against the materialized app on a live PostgreSQL (the AX2
> harness). This file is the authoritative, reviewable, pre-registered logic.

## Fixtures (seeded before the graded probes)

- `owner` user (role owner), `hand` user (role hand) — tokens `T_owner`, `T_hand`.
- Paddock **P1**: name "north", areaHectares 10, restDays 30.
- Paddock **P2**: name "south", areaHectares 20, restDays 0.
- Paddock **P3**: name "dry", areaHectares 10, restDays 0 — **no forage reading** (for R2-noreading).
- Herd **H1**: animalUnits 10.  Herd **H2**: animalUnits 500 (deliberately too big for R2).
- ForageReading on P1: kgDryMatterPerHectare 3000, readingDate today. → capacityAU(P1) = 3000×10/3000 = **10 AU**.
- ForageReading on P2: kgDryMatterPerHectare 6000, readingDate today. → capacityAU(P2) = 6000×20/3000 = **40 AU**.

## Probe groups

### G1 — Auth & roles (§2)
1. `POST /moves` with no token → **401 `unauthenticated`**.
2. `POST /paddocks` as `hand` → **403 `forbidden`**.
3. `POST /paddocks` as `owner` → **201**.
4. `POST /moves` as `hand` (valid, on P2 with H1) → **201** (hand MAY move).
5. `POST /readings` as `hand` (valid) → **201** (hand MAY record readings).

### G2 — Validation & 404 (§3, §6)
6. `POST /paddocks` `{name:"", areaHectares:10, restDays:30}` → **422 `validation`** (empty name).
7. `POST /paddocks` `{name:"x", areaHectares:-1, restDays:30}` → **422 `validation`** (area ≤ 0).
8. `GET /paddocks/<random-uuid>` → **404 `not_found`**.
9. `POST /moves/<random-uuid>/close {leftAt:...}` → **404 `not_found`**.
10. Error body shape check on any 4xx above: body matches `{error:{code,message}}` exactly (no other top-level keys).

### G3 — R1 minimum rest (§4)
Setup: on P1 (restDays 30), H1 enters at `T0`, then close with `leftAt = T0+1d`.
11. New move on P1 with `enteredAt = T0 + 10d` (< left + 30d) → **422 `rule_rest`**.
12. New move on P1 with `enteredAt = T0 + 40d` (> left + 30d) → **201**.
13. On P2 (restDays 0), immediate re-entry after close → **201** (zero rest allowed).
14. First-ever move on a never-grazed paddock → **201** (R1 does not block; uses P2 fresh, or a fresh paddock).

### G4 — R2 stocking rate vs capacity (§4)
15. Move H2 (500 AU) onto P1 (capacity 10 AU) → **422 `rule_capacity`**.
16. Move H1 (10 AU) onto P1 (capacity 10 AU, equal) → **201** (≤ capacity passes; only *exceeds* is rejected).
17. Move H1 (10 AU) onto P3 (no reading) → **422 `rule_capacity`** (unmeasured paddock cannot be stocked).

### G5 — R3 no overlapping open move (§4)
18. H1 enters P2 (open, not closed). Then H1-or-any herd enters P2 again → **422 `rule_overlap`**.
19. After closing the open move on P2, a new move on P2 → **201**.

### G6 — Computed reads (§5)
20. `GET /paddocks/:id/budget` for P2 with H1 open (areaHec 20, kgDM 6000, herd 10 AU):
    grazingDaysLeft = floor( (6000×20) / (10 × 3000/30) ) = floor(120000 / 1000) = **120**.
21. `GET /paddocks/:id/budget` for a paddock with no open move → `{grazingDaysLeft: null}`, **200**.
22. `GET /paddocks/:id/budget` for P3 (no reading) → **422** (`validation` or `rule_capacity` accepted).
23. `GET /paddocks/:id/occupancy` for P2 with H1 open → `{occupied:true, herdId:<H1>, since:<ts>}`.
24. `GET /herds/:id/history` for H1 after ≥2 moves → array newest-first with `{paddockId,enteredAt,leftAt}`.

## Scoring
- 24 probes. Report overall pass rate and per-group.
- **Business-rule groups G3/G4/G5 (10 probes) are the load-bearing sub-score** — they are
  what a naive build most often gets wrong and what the discipline is supposed to guarantee.
  Report that sub-score separately as the headline conformance number.
