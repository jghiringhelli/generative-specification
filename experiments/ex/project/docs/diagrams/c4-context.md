# C4 Context Diagram — Conduit API

```mermaid
C4Context
  title Conduit API — System Context

  Person(user, "API Consumer", "Frontend app or harness client making HTTP requests")

  System(conduit, "Conduit API", "Express/TypeScript REST API implementing the RealWorld spec. Handles auth, articles, comments, profiles, tags, favorites.")

  SystemDb(postgres, "PostgreSQL", "Persistent store for users, articles, comments, tags, favorites. Managed by Prisma ORM.")

  Rel(user, conduit, "HTTPS JSON", "REST over HTTPS")
  Rel(conduit, postgres, "TCP", "Prisma queries via DATABASE_URL")
```

## Container View

```mermaid
C4Container
  title Conduit API — Containers

  Person(client, "Client")

  Container(api, "Express App", "TypeScript / Node 20", "Routes → Services → Repositories. Hexagonal architecture.")
  Container(prisma, "Prisma Client", "ORM", "Type-safe query builder. Migrations via prisma migrate deploy.")
  ContainerDb(db, "PostgreSQL", "Railway managed", "Schema: User, Article, Comment, Tag, UserFollow, UserFavorite, ArticleTag")

  Rel(client, api, "HTTPS / JSON")
  Rel(api, prisma, "function calls")
  Rel(prisma, db, "SQL / TCP")
```

## Key Boundaries

- **API layer**: Express routes — validation only, delegates to services
- **Service layer**: Business logic — orchestrates repositories, throws domain errors
- **Repository layer**: Prisma adapters — single responsibility per aggregate
- **Domain errors**: `AuthenticationError`, `AuthorizationError`, `NotFoundError`, `ValidationError`, `ConflictError` — each with `toJSON()` per RealWorld spec
