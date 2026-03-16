# Roadmap — Conduit API (Treatment Condition)

Each milestone corresponds to one implementation prompt. Run `npx forgecraft-mcp verify .` after each.

---

## M1 — Auth & User Management
**Prompt:** `prompts/01-auth.md`  
**Endpoints:** POST /api/users · POST /api/users/login · GET /api/user · PUT /api/user  
**Decisions to record:** Stack ADR, auth strategy ADR, error shape ADR  
**Status:** Not started

---

## M2 — Profiles & Follow
**Prompt:** `prompts/02-profiles.md`  
**Endpoints:** GET /api/profiles/:username · POST/DELETE /api/profiles/:username/follow  
**Decisions to record:** Repository interface pattern (if not already in M1)  
**Status:** Not started

---

## M3 — Articles (Core)
**Prompt:** `prompts/03-articles.md`  
**Endpoints:** GET /api/articles · GET /api/articles/feed · POST/GET/PUT/DELETE /api/articles/:slug + favorites  
**Key hazards:** `body` field must be absent from list responses · slug uniqueness · `articlesCount` pagination  
**Status:** Not started

---

## M4 — Comments
**Prompt:** `prompts/04-comments.md`  
**Endpoints:** GET/POST /api/articles/:slug/comments · DELETE /api/articles/:slug/comments/:id  
**Key hazards:** Author populated on GET, check ownership on DELETE  
**Status:** Not started

---

## M5 — Tags
**Prompt:** `prompts/05-tags.md`  
**Endpoints:** GET /api/tags  
**Note:** Tags are derived from published articles only; verify response shape `{tags: string[]}`  
**Status:** Not started

---

## M6 — Integration & Smoke
**Prompt:** `prompts/06-integration.md`  
**Deliverables:** Playwright smoke suite · end-to-end happy path · `forgecraft verify` final score  
**Status:** Not started

---

## Final Scorecard

| Milestone | verify score | Spec conformance | Mutation score |
|---|---|---|---|
| M1 | /12 | | |
| M2 | /12 | | |
| M3 | /12 | | |
| M4 | /12 | | |
| M5 | /12 | | |
| M6 | /12 | RealWorld Postman | Stryker |
