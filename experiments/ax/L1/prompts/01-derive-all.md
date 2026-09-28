---
nav_exclude: true
---

# Prompt 1 — Derive the Complete Implementation

You have the complete Conduit API specification in your context.

Derive the **entire** backend implementation from it in this single pass: project
setup, data model, and every endpoint in the specification — authentication and the
current-user endpoints, profiles (get, follow, unfollow), articles (create, read,
update, delete, list, feed, favorite, unfavorite), comments (add, list, delete), and
tags.

Use Node.js and TypeScript. Emit every file the running system needs. Do not stop at a
subset; the specification defines the whole surface and you are deriving all of it now.
