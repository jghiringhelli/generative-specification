# Pastura oracle — executable Hurl probes

Generated from `../ORACLE_SPEC.md`. Six files, one per probe group, run per generated app by
`../../../runner/conformance_cr.cjs` (one file per group = one graded conformance unit, matching
the AX2 per-file convention). Each file is self-contained: it seeds its own uid-namespaced
fixtures (`{{uid}}` is injected per run so parallel/repeated runs never collide on the unique
`name`/`email` constraints), so no shared seed step is required across a reset DB.

| File | Probes (ORACLE_SPEC) | Group |
|---|---|---|
| `g1_auth_roles.hurl` | P1-P5 | Auth & roles |
| `g2_validation_404.hurl` | P6-P10 (P10 error-shape folded into P6) | Validation & 404 |
| `g3_rule_rest.hurl` | P11-P14 | **R1 rest (load-bearing)** |
| `g4_rule_capacity.hurl` | P15-P17 | **R2 capacity (load-bearing)** |
| `g5_rule_overlap.hurl` | P18-P19 | **R3 overlap (load-bearing)** |
| `g6_computed_reads.hurl` | P20-P24 | Computed reads |

## Strict vs tolerant (pre-registered, ORACLE_SPEC header)
- **STRICT** (assert exact value): the three rule error codes (`rule_rest`/`rule_capacity`/
  `rule_overlap`), the other error codes (`unauthenticated`/`forbidden`/`not_found`/`validation`),
  the budget arithmetic (`grazingDaysLeft == 120`, `== null`), and role gating (403).
- **TOLERANT**: creates and reads use `HTTP *` + `status >= 200 status < 300`, so 200-vs-201 and
  framework/route casing/field order/extra fields do not fail a probe. Only the contract points
  above are strict.

## Headline number
`conformance_cr.cjs` reports overall pass/6 AND the **business-rule sub-score = pass over
{g3,g4,g5} / 3**, which is the load-bearing conformance figure per PREREGISTRATION section 6.

## Note on `HTTP *`
Requires Hurl >= 4.x (the version at `/c/Program Files/Hurl/hurl.exe` used by AX2 supports it).
If a probe cannot capture an `id` because a create returned an envelope shape, that is a real
conformance miss (the DOMAIN_SPEC returns the entity at the top level), not an oracle bug.
