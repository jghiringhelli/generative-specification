# Simulation: Competent control participant — brownfield
# Behavior: reads README, understands the task, follows a structured multi-step approach.
# Produces: working feature that fits existing patterns, tests for new endpoints.
# Note: this is also the condition JC will run manually for the control dry run.

Set up: cp .env.example .env, npm install, npm run db:push, npm run db:seed.
Verify npm test passes before touching anything.

--- PROMPT 1: Understand the codebase ---

Read README.md and the existing source code. Then answer:
1. What is the existing architecture? (routes → service → DB? routes → DB directly?)
2. What tables exist in prisma/schema.prisma?
3. What endpoints already exist?
4. What tests exist and what do they cover?

Do not change any code yet.

--- PROMPT 2: Add the activities schema ---

Add the activities table to prisma/schema.prisma:
- id, boardId, actorId, eventType (card_created | card_moved | card_commented)
- cardId, cardTitle, fromListName (nullable), toListName (nullable), timestamp
- boardId and actorId are foreign keys to Board and User

Run: npx prisma migrate dev --name add-activity-feed

--- PROMPT 3: Implement the endpoints ---

Implement following the existing patterns in the codebase:
- GET /boards/:id/activity — all activity for the board, newest first, auth required
- GET /boards/:id/activity/preview — same, no auth (for testing)
- POST /cards/:id/move — move card to a different list, write card_moved activity atomically

Activity events must be written in the same DB transaction as the card move.
Look at README.md for the exact response shape expected.

Write Vitest tests for all three endpoints.
Run the tests.

--- PROMPT 4: Instrument existing events ---

Look at where cards are created and where comments are created.
Add activity writes for card_created and card_commented events.

Run the full npm test suite. All existing + new tests must pass.

