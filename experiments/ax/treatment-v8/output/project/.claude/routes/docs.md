<!-- CNT branch: routes/docs | 2026-06-04 | load when navigating documents or before implementing -->

## Navigation Mode — How to Read This Codebase

This project follows Clean Architecture with TDD. **The contracts are trustworthy.**

- **Read interfaces, not implementations first.** Types and signatures tell you what
  a module promises. Read those before reading the body.
- **Use-cases are the spec.** Before touching business logic, read the relevant UC in
  `docs/use-cases/`. The code is derived from the use case, not the reverse.
- **ADRs explain the why.** Check `docs/adrs/active/` before making structural decisions.
  The answer may already exist.
- **Skip implementation reads when contracts are green.** If tests pass and types compile,
  treat a module as a black box.
- **Raise an ADR rather than deviating silently.** If the correct action contradicts the
  architecture, write an ADR — do not silently break the contract.

## Document Map — Where Docs Live

| What you need | Where to find it |
| --- | --- |
| What to build | `docs/PRD.md` |
| Architecture overview | `docs/TechSpec.md` |
| Layer and boundary rules | `docs/architecture/layers.md` |
| Module ownership | `docs/architecture/modules.md` |
| Data model / schema / ERD | `docs/architecture/data-model.md` |
| External integrations | `docs/architecture/integrations.md` |
| Behavioral contracts | `docs/use-cases/` |
| Why a decision was made | `docs/adrs/active/` |
| Current project state | `docs/status.md` |
| Non-functional requirements | `docs/nfr-contracts.md` |
| Test architecture | `docs/test-architecture.md` |

## Reading Order (before starting implementation)

1. `docs/status.md` — what's done, what's in progress, recent decisions
2. Relevant use case in `docs/use-cases/`
3. Relevant spec section in `docs/specs/` or `docs/PRD.md`
4. Relevant ADR if the area has prior decisions in `docs/adrs/active/`
5. `.claude/constitution.md` — verify your approach doesn't violate invariants
