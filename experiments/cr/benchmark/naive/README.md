# Pastura API

A REST API for rotational grazing management. Build it in TypeScript on Node with
PostgreSQL. It tracks paddocks, herds, forage readings, and moves of herds between paddocks,
and it enforces grazing rules (minimum rest, stocking capacity, no overlap). See the domain
description handed to you.

Run it locally against a Postgres database. Use JWT auth.

(That is the whole naive condition: this thin README + the DOMAIN description delivered as
plain prose in the prompts. No architecture guidance, no error-contract detail beyond prose,
no test guidance, no navigation structure. This mirrors the AX2 naive recipe verbatim: it is
"vibe coding" from a short brief.)
