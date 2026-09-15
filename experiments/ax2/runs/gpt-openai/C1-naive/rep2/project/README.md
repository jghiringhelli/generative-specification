# Conduit API

A TypeScript, Express, Prisma, and PostgreSQL implementation of the RealWorld Conduit backend.

## Setup

1. Copy `.env.example` to `.env` and configure PostgreSQL and the JWT secret.
2. Install dependencies with `npm install`.
3. Create the database with `npx prisma migrate dev --name init`.
4. Start development mode with `npm run dev`.

The API is served below `/api`. Run the integration test suite with `npm test` against a disposable test database.
