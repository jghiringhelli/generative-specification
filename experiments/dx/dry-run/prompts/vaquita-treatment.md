# Simulation: Treatment participant — ForgeCraft governance
# Behavior: spec authoring conversation FIRST, then ForgeCraft setup, then implementation from roadmap.
# The key variable: spec quality drives everything downstream.
# Note: this is also the condition JC will run manually for the treatment dry run.

--- PHASE 1: Domain understanding (no code) ---

Read README.md and docs/spec.md.

Before we write any code, let's make sure we understand the domain deeply.

Write your answers to these questions to docs/DOMAIN-NOTES.md:
1. What is a tanda in real life? What problem does this API solve?
2. What can go wrong? List every way a user could lose money or be cheated if the rules aren't enforced.
3. What are the most ambiguous business rules — the ones where you're not sure exactly what the code should do?
4. What edge cases in the lifecycle (forming → active → completed/cancelled) are risky?
5. What would make a good acceptance test for this system? (think from a user's perspective, not a developer's)

Do not write any implementation code yet.

--- PHASE 2: Generate the spec documents ---

Based on your domain analysis, write these documents:

docs/PRD.md — Product Requirements Document:
- Problem statement
- User stories (as a user I want to... so that...)
- Acceptance criteria for each user story
- Out of scope items

docs/use-cases.md — Use Cases:
- One use case per major flow (create tanda, join tanda, start tanda, record contribution, advance round)
- Each use case: actor, preconditions, main flow, alternative flows, postconditions

docs/TechSpec.md — Technical Specification:
- Data model with all fields and constraints
- API contract (all endpoints, request/response shapes, error codes)
- Business rule implementations (how each rule maps to code)
- Authentication mechanism

These documents are the source of truth. The code will follow from them.

--- PHASE 3: ForgeCraft setup ---

Use the forgecraft MCP tool to run setup_project on this project directory.
Answer any questions it asks using the documents you just wrote as the source of truth.

Once setup_project completes, read CLAUDE.md carefully.
Run: npx forgecraft-mcp audit .
Fix any issues flagged before writing any implementation code.

--- PHASE 4: Implement from the roadmap ---

Follow the Greenfield Setup workflow from CLAUDE.md.

Scaffold the architecture layers first (src/domain/, src/services/, src/ports/, src/adapters/, src/api/).
Commit the scaffold. Run forgecraft audit. Target 0 failing checks before writing any feature code.

Implement one domain at a time, using your PRD and use-cases as the spec:
- Users (create, get by token, list)
- Tanda lifecycle (create, join, start, cancel, get, list, participants)
- Contributions and rounds (record, round summary, advance, history)

After each domain: run forgecraft audit. Fix violations before moving on.

Write Vitest tests for every use case in docs/use-cases.md.
Tests should verify the acceptance criteria from docs/PRD.md.
Run npm test before finishing. All tests must pass.

Commit with conventional commit messages at each phase boundary.

