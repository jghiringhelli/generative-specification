# Technical Specification — Conduit API

**Status:** Living document — updated after each implementation milestone  
**Spec authority:** `../REALWORLD_API_SPEC.md` is canonical. This document records *how* we implement it.

---

## Module Structure

| Module | Path | Responsibility |
|---|---|---|
| *(to be filled as modules are created)* | | |

---

## API Endpoint Status

| Method | Path | Auth | Status | Test file |
|---|---|---|---|---|
| POST | /api/users | No | — | — |
| POST | /api/users/login | No | — | — |
| GET | /api/user | Yes | — | — |
| PUT | /api/user | Yes | — | — |
| GET | /api/profiles/:username | Optional | — | — |
| POST | /api/profiles/:username/follow | Yes | — | — |
| DELETE | /api/profiles/:username/follow | Yes | — | — |
| GET | /api/articles | Optional | — | — |
| GET | /api/articles/feed | Yes | — | — |
| POST | /api/articles | Yes | — | — |
| GET | /api/articles/:slug | Optional | — | — |
| PUT | /api/articles/:slug | Yes | — | — |
| DELETE | /api/articles/:slug | Yes | — | — |
| POST | /api/articles/:slug/favorite | Yes | — | — |
| DELETE | /api/articles/:slug/favorite | Yes | — | — |
| GET | /api/articles/:slug/comments | Optional | — | — |
| POST | /api/articles/:slug/comments | Yes | — | — |
| DELETE | /api/articles/:slug/comments/:id | Yes | — | — |
| GET | /api/tags | No | — | — |

**Status legend:** `—` not started · `✓` implemented · `✓✓` implemented + tested · `🔴` spec deviation found

---

## Key Invariants

- Auth header format: `Authorization: Token <jwt>` (not Bearer)
- `/api/articles` and `/api/articles/feed` do **not** include `body` field in article objects (spec 2024-08-16)
- Error envelope: `{"errors": {"body": ["message"]}}` — never a bare string
- Slug derived from title (kebab-case), must be unique across all articles
- JWT payload carries `userId` (numeric Prisma ID), signed with `JWT_SECRET` env var

---

## Dependencies

| Package | Version | Purpose |
|---|---|---|
| *(to be filled as packages are installed)* | | |

---

## Open Decisions

*(Record architectural questions that arise during implementation here — link to ADR once resolved)*
