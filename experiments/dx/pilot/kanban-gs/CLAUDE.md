# Kanban API — Architectural Constitution

## Project
Task management REST API. Express 4 / TypeScript / Prisma / SQLite.
Workshop brownfield codebase. 11 intentional architectural issues to fix.

## Architecture — Hexagonal (Ports & Adapters)
Routes → Services → Repositories → Database.
- Routes: auth check only, delegate to services, return DTOs
- Services: business logic, own all constraints and validations
- Repositories: ALL Prisma calls live here, nowhere else

## Non-Negotiable Rules
- Zero `prisma.*` in src/routes/
- All status changes must use `prisma.$transaction`
- Membership check required before any comment operation
- Custom error classes — no bare throw new Error()
- Zero console.log in routes — use structured error handling
- Every public function has JSDoc
- Commits: conventional format (feat|fix|refactor|test|chore)

## Known Issues (to fix)
- authorId/body schema mismatches in comments.ts and tasks.ts
- Non-atomic status change in POST /tasks/:id/status
- No error middleware
- No membership guard on comments
- N+1 queries throughout
- Hardcoded JWT secret
