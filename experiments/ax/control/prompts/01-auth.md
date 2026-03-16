# Prompt 1 — Project Setup & Authentication

Set up the project skeleton first, then implement user authentication.

## Project Setup

Generate these files:
- `prisma/schema.prisma` — User model with: id, email (unique), username (unique), password, bio (nullable), image (nullable), createdAt, updatedAt
- `package.json` with dependencies: express, @prisma/client, jsonwebtoken, bcryptjs, zod; devDependencies: typescript, @types/*, jest, ts-jest, supertest, @types/supertest, prisma
- `tsconfig.json` — target ES2022, strict: true, esModuleInterop: true
- `jest.config.ts` — ts-jest preset, testEnvironment: node, coverage thresholds: 80% lines
- `.env.example` with: DATABASE_URL, JWT_SECRET, PORT
- `src/index.ts` — Express app entry point

Use the layered architecture from the README: routes → services → repositories.

## Authentication Endpoints

Implement:
- `POST /api/users` (register)
- `POST /api/users/login` (login)
- `GET /api/user` (auth required)
- `PUT /api/user` (auth required)

Requirements:
- Validate all inputs with Zod; return `{"errors": {"body": ["..."]}}` on failure (HTTP 422)
- Hash passwords with bcryptjs (12 rounds — use a named constant, not a magic number)
- JWT secret from `process.env.JWT_SECRET`; expiry 30 days (named constant)
- Route files must NOT call `prisma.` directly — use a UserRepository class

## Tests to Write Now

- Unit: `hashPassword` + `verifyPassword`, `signToken` + `verifyToken`
- Integration (Supertest against a real test DB): register success, login success, get current user (valid token), update user, register duplicate email (422), login wrong password (422), get user without token (401)
- Test names must describe behavior: e.g. `returns 422 when email is already registered`
