---
nav_exclude: true
---

# Prompt 1 — Derive the Complete Implementation (Conceptual Requirements)

You have the complete Conduit API specification in your context. Derive the entire
backend implementation from it in one pass — project setup, data model, and every
endpoint. Node.js + TypeScript.

The following behaviors are the ones that most often go wrong. They are stated here at
the level of **what must be true**. Realize them however is idiomatic and correct:

1. **Slugs.** Each article has a URL-safe slug derived from its title, and no two
   articles collide on it.
2. **Passwords.** A stored password cannot be recovered from the database; a login
   succeeds only when the presented password matches the one set at registration.
3. **Tokens.** A request authenticates only with a currently-valid token issued by this
   service; expired or tampered tokens are refused, not honored.
4. **The feed.** A user's feed contains articles authored by the users they follow and
   no one else, most recent first, and is paginated.
5. **Relational flags.** Article and profile responses reflect the *requesting* user's
   relationship to the resource — whether they favorited the article, whether they
   follow the author — and are correct for anonymous requests too.
6. **List projections.** Article *list* responses omit the full article body; the
   single-article response includes it.

Emit every file the running system needs. Do not stop at a subset.
