# Member Portal API — SENTINEL (root)

Node/Express backend, in-memory store. This spec is **bounded and navigable**: read this root and enter
each node. **Each node is a set of requirements that MUST end up 100% satisfied** — you do not need to
load everything at once; navigate node by node and satisfy them all.

| Node | Covers |
|---|---|
| [`members.md`](members.md) | Create, validation, duplicates, paginated list, read, delete (R1–R5, R11) |
| [`activity-admin.md`](activity-admin.md) | Activity recording + admin aggregated dashboard (R6, R7, R12) |
| [`ops.md`](ops.md) | Health, consistent error shape, timestamps (R8–R10) |

Rule: no node is optional. The acceptance criterion of each node is part of the contract.
