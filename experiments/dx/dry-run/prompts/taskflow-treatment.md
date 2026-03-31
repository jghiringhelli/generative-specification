# Simulation: Treatment participant — ForgeCraft governance, brownfield
# Behavior: spec authoring conversation first, then ForgeCraft brownfield integration, then feature.
# Key variable: how well the team documents the existing system and the new feature spec.
# Note: this is also the condition JC will run manually for the treatment dry run.

Set up: cp .env.example .env, npm install, npm run db:push, npm run db:seed.
Verify npm test passes.

--- PHASE 1: Understand and document the existing system (no changes) ---

Read the full codebase and README.md. Then write docs/SYSTEM-NOTES.md with:
1. What does this system do? (in plain language, not developer speak)
2. Who uses it and how? (describe alice, bob, carol using it)
3. What is the current architecture? What layers exist?
4. What works well? What smells wrong?
5. What is missing? What would users want next?

Then write docs/ACTIVITY-FEED-SPEC.md for the feature you're about to add:
- Why does an activity feed matter to users of this system?
- User stories for the activity feed
- Acceptance criteria (specific, testable)
- The event shape (from README.md) and what each event type means
- Edge cases: what if a move fails midway? What if there's no activity yet?
- What NOT to build (out of scope)

Do not change any code yet.

--- PHASE 2: ForgeCraft brownfield integration ---

Use the forgecraft MCP tool to run setup_project on this project directory.
When it asks about the project, refer to docs/SYSTEM-NOTES.md and docs/ACTIVITY-FEED-SPEC.md.

Once setup_project completes, read CLAUDE.md.
Run: npx forgecraft-mcp audit .

This first pass is structural only — do not change existing behavior.
For each failing check in priority order:
1. Missing docs → write skeletons from the existing code
2. Hardcoded values → extract to .env
3. File length violations → split by responsibility

Commit each fix type separately. Re-run audit after each. Target score >= 70 before feature work.

--- PHASE 3: Implement from the spec ---

Follow CLAUDE.md. Use docs/ACTIVITY-FEED-SPEC.md as the source of truth.

Before any code: define the ActivityEvent type and any interfaces for the new layer.
Write failing tests against the acceptance criteria from your spec doc. They should fail now — that's correct.

Implement:
- GET /boards/:id/activity (auth) — newest first
- POST /cards/:id/move — atomic: card move + card_moved event in one transaction
- GET /boards/:id/activity/preview (no auth)
- Instrument card creation and comment creation for card_created, card_commented events

After implementing: run forgecraft audit. Fix any new violations.
Run npm test — all tests must pass.

Commit with conventional commit messages. Update docs/ACTIVITY-FEED-SPEC.md if the implementation diverged.

