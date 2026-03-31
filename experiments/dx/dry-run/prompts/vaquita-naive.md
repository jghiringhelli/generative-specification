# Simulation: Naive control participant
# Behavior: writes basic structure themselves, uses AI for small pieces only.
# Produces: partial routes, DB calls in handlers, no tests, happy-path only.

Create a basic Express server in src/index.ts on port 3000 with a SQLite database using better-sqlite3.
Create the users table with id, name, email, token columns.

---

Now add a POST /api/users route. It takes { name, email }, creates the user, returns the user with a token.
The token can just be a random uuid. Keep it in the same file for now.

---

Add a users table and a tandas table to the database. Tandas have id, name, organizerId, status (forming/active/completed/cancelled), contributionAmount, totalRounds, currentRound.

---

Add these routes to src/index.ts:
- POST /api/tandas — create a tanda, creator becomes the organizer
- GET /api/tandas/:id — get a tanda

---

Add a participants table that links users to tandas. Then add:
- POST /api/tandas/:id/join — add the user to the tanda (pass userId in body)
- GET /api/tandas/:id/participants — list the participants

---

Add POST /api/tandas/:id/start — change status to active.
Add POST /api/tandas/:id/cancel — change status to cancelled.

---

The server should start and the basic routes should work. Don't add tests.
