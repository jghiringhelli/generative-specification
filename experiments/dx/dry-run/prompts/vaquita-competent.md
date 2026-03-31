# Simulation: Competent control participant
# Behavior: follows PROMPT_CARDS.md one prompt at a time — this IS the prompt card sequence.
# Produces: working API, service layer (prompted), tests per endpoint.
# Note: this is also the condition JC will run manually for the control dry run.

--- PROMPT 1: Analyse before coding ---

Read docs/spec.md carefully. Then:
1. Describe the domain model in your own words — what entities exist and how they relate
2. List all the API endpoints that need to be built
3. List the business rules that will need code to enforce (not just data validation)
4. Identify the riskiest parts — where a bug would cause money to disappear or rules to be bypassed

Do not write any code yet. Just analyse.

--- PROMPT 2: Project skeleton ---

Set up the project skeleton:
- TypeScript + Express (already in package.json)
- better-sqlite3 for the database
- Write the database schema for all entities from docs/spec.md
- Set up a SQLite dev.db
- Add a .env.example with JWT_SECRET
- Do NOT hardcode any secrets

--- PROMPT 3: Users ---

Implement user management:
- POST /api/users — { email, name } → create user, return token (HMAC-sha256 of id+email using JWT_SECRET)
- GET /api/users — list users
- GET /api/users/:id — get user by ID

Write Vitest tests for these endpoints — happy path and at least one error case each.
Run the tests to confirm they pass.

--- PROMPT 4: Tandas ---

Implement tanda management:
- POST /api/tandas — create a tanda, creator is auto-added as organizer
- GET /api/tandas?userId= — list tandas for a user
- GET /api/tandas/:id — tanda details
- POST /api/tandas/:id/join — join a tanda (auth token in Authorization header)
- POST /api/tandas/:id/start — organizer only, requires >= 3 participants, randomizes rotation order
- POST /api/tandas/:id/cancel — organizer only
- GET /api/tandas/:id/participants — list participants

Enforce all business rules from docs/spec.md.
Route handlers must not contain direct database calls — use a service layer.
Write at least one test per endpoint. Run the tests.

--- PROMPT 5: Contributions and rounds ---

Implement contributions and rounds:
- POST /api/tandas/:id/contributions — record contribution for current round (auth required)
- GET /api/tandas/:id/rounds/:round — round summary
- POST /api/tandas/:id/advance — advance to next round (organizer only), auto-complete after last round
- GET /api/tandas/:id/participants/:pid/history — contribution history

Enforce: late contributions get 5% penalty, 2 consecutive missed contributions = defaulter flag.
Write tests. Run them.
Make sure npm test passes overall.

