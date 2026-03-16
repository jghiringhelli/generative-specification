# C4 Context Diagram — Conduit API

```mermaid
C4Context
  title Conduit Platform — System Context

  Person(user, "User", "A registered or anonymous user interacting with the Conduit platform")
  System(conduit, "Conduit API", "REST API backend. Manages users, articles, comments, profiles, and tags.")
  SystemDb(postgres, "PostgreSQL", "Stores all persistent data: users, articles, comments, follows, favorites, tags")

  Rel(user, conduit, "Makes API calls", "HTTPS/REST/JSON")
  Rel(conduit, postgres, "Reads/writes", "Prisma ORM / TCP")
```

## Key Observations

- The Conduit API is the single entry point for all client interactions
- No external service dependencies (email, storage, CDN) in this scope
- PostgreSQL is the single persistence boundary — all data lives here
- Authentication is stateless JWT — no external session store
