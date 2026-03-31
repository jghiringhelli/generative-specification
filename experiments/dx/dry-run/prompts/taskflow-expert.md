# Simulation: Expert control participant — brownfield
# Behavior: audits existing architecture first, fits new feature into it cleanly, tests up front.
# Produces: proper service integration, atomic transactions, comprehensive tests.

Set up: cp .env.example .env, npm install, npm run db:push, npm run db:seed.
Verify npm test passes.

Read the full codebase before touching anything. Understand:
- The layering (does a service layer exist or are routes talking to Prisma directly?)
- The error handling pattern
- The auth middleware
- What test patterns are used

Then implement the Activity Feed without breaking existing behavior:

Schema: add to prisma/schema.prisma:
- Activity: id, boardId (FK), actorId (FK), eventType (card_created|card_moved|card_commented), cardId?, cardTitle?, fromListName?, toListName?, timestamp
- Run: npx prisma migrate dev --name add-activity-feed

Architecture:
- If a service layer exists, add an ActivityService and use it from routes
- Activity writes are atomic with the triggering operation — card move and activity write in one transaction
- New code follows the same patterns as existing code exactly (don't introduce a new layer that doesn't exist yet)

Implement:
- GET /boards/:id/activity (auth) — newest first
- POST /cards/:id/move — atomic move + activity write
- GET /boards/:id/activity/preview (no auth)
- Instrument card creation and comment creation for their event types

Tests:
- Happy path for each new endpoint
- Atomicity: if move fails, no activity event written
- Auth: /activity without token returns 401
- Empty feed returns [] not 404
- Existing tests must still pass

Run npm test. Fix failures. Aim for 80%+ coverage on changed files.

