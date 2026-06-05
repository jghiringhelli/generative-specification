# project Context Index

## Always Load
@.claude/core.md

## Navigate by Task
Identify the task domain before generating any code.
Load ONLY the node that matches. Do not load siblings.

| Task Domain | Node | When to Use |
|---|---|---|
| Architecture decisions | @.claude/adr/index.md | Before proposing any structural change |
| Quality gates | @.claude/gates/index.md | When running or interpreting gate results |
| Architecture | @.claude/standards/architecture.md | Layer rules, SOLID, patterns |
| API / routes | @.claude/standards/api.md | Route handlers, middleware, validation |
| Protocols | @.claude/standards/protocols.md | Commit convention, branching |

---

## Navigation Protocol — read before any task

1. Read this file (index.md). Identify the task domain from the table above.
2. Read .claude/core.md. Always. It is always relevant.
3. Read the domain index for the matching task domain. One domain only.
4. If the task touches an architecture decision, read .claude/adr/index.md and the relevant ADR.
5. If the task touches quality gates, read .claude/gates/index.md.
6. Do not read nodes outside the identified domain unless the task explicitly spans domains.
   If it spans domains, name them before reading both — do not load the full tree silently.
7. If no node matches the task, read core.md only and flag the missing coverage.