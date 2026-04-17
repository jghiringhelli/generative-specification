# Product Requirements Document — Conduit API

## What It Is

A RESTful JSON API implementing the [RealWorld](https://github.com/gothinkster/realworld) "Conduit" specification — a Medium.com-like blogging platform backend.

## Who It Is For

- Frontend teams building Conduit-compatible UIs (React, Vue, Angular)
- Developers evaluating backend stacks against the RealWorld spec
- The GS experiment treatment condition: a fully spec-derived TypeScript/Express/Prisma implementation

## What Constitutes Success

1. All RealWorld API endpoints implemented and spec-compliant
2. 13/13 harness probes passing across 8 use cases
3. Deployed to Railway with p95 < 2s, error rate < 1% under 3 VUs sustained load
4. Full derivation chain: PRD → use cases → ADRs → implementation → verified probes

## Functional Scope

| Domain | Endpoints |
|---|---|
| Auth | Register, Login, Get/Update current user |
| Profiles | Get profile, Follow/Unfollow user |
| Articles | CRUD, List with filters, Feed |
| Comments | Add, List, Delete |
| Tags | List all tags |
| Favorites | Favorite/Unfavorite article |

## Non-Functional Requirements

- **Latency**: p95 < 2s, p99 < 4s at 3 concurrent users
- **Reliability**: < 1% error rate under sustained load
- **Security**: JWT authentication, bcrypt password hashing, rate limiting in production
- **Deployability**: Single Dockerfile, Railway-compatible, migrations on startup

## Out of Scope

- WebSocket / real-time features
- Email notifications
- File uploads / media storage
- Admin interface
