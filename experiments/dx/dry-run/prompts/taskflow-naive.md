# Simulation: Naive control participant — brownfield
# Behavior: barely reads the existing code, asks AI for small targeted pieces.
# Produces: activity table added somewhere, endpoints bolted on, likely breaks on edge cases.

Set up the project: cp .env.example .env, npm install, npm run db:push, npm run db:seed.

---

I need to add an activities table to track when cards move. Add it to the Prisma schema:
- id, boardId, eventType, cardId, actorId, timestamp

Run npx prisma migrate dev --name add-activities.

---

Add a GET /boards/:id/activity route that returns all the activities for that board.
Put it in the same file as the other board routes.

---

Add a POST /cards/:id/move route. It should move the card to a different list (takes targetListId in the body).
Also write an activity record when a card moves.

---

Add GET /boards/:id/activity/preview — same as activity but no auth needed.

---

Start the server and make sure it doesn't crash.

