---
nav_exclude: true
---

You are continuing implementation of a project started in a previous session. Read the spec below and then read `Status.md` to understand what has already been built.

Your task for this session (P2 — Features) is to implement all routes, services, and adapters listed in §3 of the spec. Work layer by layer in this order: ports → adapters → services → routes. Do not write tests yet.

Rules:
- Read every existing file before modifying it. Do not assume the previous session's output.
- Follow the layer boundaries in §1.2 exactly. A service that imports from an adapter fails the Composable gate.
- Every public function must have JSDoc.
- The jsonwebtoken StringValue pitfall in §5.5 must be handled at every jwt.verify() call site — no exceptions.
- No hardcoded values. All configuration from `src/infrastructure/env.ts`.
- No `console.log` — use a logger interface.
- No `any` types.

After implementing all features, run:
1. `tsc --noEmit`
2. `npm audit --audit-level=high`

Report the output. Fix all errors before ending the session. Update `Status.md`.

---

GENERATIVE SPECIFICATION:
