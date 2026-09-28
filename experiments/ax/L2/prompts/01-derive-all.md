---
nav_exclude: true
---

# Prompt 1 — Derive the Complete Implementation, Tests as the Gate

You have the complete Conduit API specification in your context.

Derive the **entire** backend implementation from it in this single pass: project
setup, data model, and every endpoint in the specification — authentication and the
current-user endpoints, profiles (get, follow, unfollow), articles (create, read,
update, delete, list, feed, favorite, unfavorite), comments (add, list, delete), and
tags.

**Tests are the gate, not an afterthought.** The system is not done until it is verified:

- Write **unit tests** for every piece of pure logic — password hashing, token
  sign/verify, slug derivation, pagination math.
- Write **integration tests** for every endpoint, covering the success path plus the
  validation (422), unauthorized (401), and not-found (404) failure paths.
- Target **at least 80% statement coverage** on the source.
- Name each test for the behavior it checks (`returns 422 when email is already
  registered`), not the route it hits.

Treat a green suite as the definition of done. Emit every source file and every test
file the running, verified system needs. Use Node.js and TypeScript.
