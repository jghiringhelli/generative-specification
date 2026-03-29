---
nav_exclude: true
---

# Linkmark API — Architectural Constitution

## Project
Social bookmarking REST API. Express 4 / TypeScript / Prisma / SQLite.

## Architecture — Hexagonal (Ports & Adapters)
Routes → Services → Repositories → Database.
Routes: thin, auth only, delegate to services.
Services: business logic, depend on repository interfaces.
Repositories: all Prisma calls live here.

## Rules
- Zero `prisma.*` in src/routes/
- Every public function has JSDoc
- Errors: custom classes, no bare throws
- Tests: one per public function, colocated in __tests__/
- Commits: conventional format (feat|fix|refactor|test|chore)

## Models
User, Bookmark, Tag, BookmarkTag, Follow (see prisma/schema.prisma)
