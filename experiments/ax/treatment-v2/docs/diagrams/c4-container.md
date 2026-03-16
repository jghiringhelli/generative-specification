# C4 Container Diagram — Conduit API

```mermaid
C4Container
  title Conduit API — Container View

  Person(user, "User", "API consumer")

  Container_Boundary(api, "Conduit API (Node.js/TypeScript)") {
    Component(routes, "Route Handlers", "Express 4", "Parse HTTP request, delegate to service, return response")
    Component(middleware, "Middleware", "Express 4", "JWT auth, CORS, rate limit, error handler")
    Component(services, "Services", "TypeScript", "Business logic. Orchestrate repositories. No HTTP awareness.")
    Component(repos, "Repositories", "TypeScript + Prisma", "Data access layer. Single-resource CRUD operations.")
    Component(prisma, "Prisma Client", "Prisma 5", "Type-safe ORM. Generated from schema.prisma.")
  }

  SystemDb(postgres, "PostgreSQL 15", "All persistent data")

  Rel(user, routes, "HTTP requests", "REST/JSON")
  Rel(routes, middleware, "via Express pipeline")
  Rel(routes, services, "calls")
  Rel(services, repos, "reads/writes via interface")
  Rel(repos, prisma, "uses")
  Rel(prisma, postgres, "SQL", "TCP")
```

## Layer Rules (enforced by CLAUDE.md)

- Routes → Services only (never Routes → Repos, never Routes → Prisma)
- Services → Repositories via interface (never Services → Prisma directly)
- Dependencies flow downward only
- Prisma Client is private to the Repository layer
