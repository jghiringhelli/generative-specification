# GS condition — fixed prompt sequence

> Verbatim recipe (mirrors AX2 disciplined). Brief prompts; the artifact cascade
> (`gs/CLAUDE.md` + nodes) carries the specification. The agent is given the `gs/` cascade as
> its working context. Same sequence for every model on the ladder. Do not vary between runs.

1. "Read CLAUDE.md (the sentinel) and follow the cascade it routes to. Build the Pastura API
   to the specification in these artifacts, honoring the layered architecture and the
   dependency rule."

2. "Implement the move endpoint and the three grazing rules per use-cases.md. The rule checks
   are acceptance criteria — implement the domain compute functions as pure functions first
   and unit-test them against the criteria, then the service, then the route."

3. "Implement the computed reads (budget, occupancy, history) per use-cases.md and contracts.md."

4. "Wire auth, roles, config, and persistence per nfrs.md and the error contract in contracts.md."

5. "Run the gate per test-architecture.md (types, lint, layer-boundary, all acceptance
   criteria tested). If the gate fails, identify the missing constraint and satisfy it; do not
   patch around it."
