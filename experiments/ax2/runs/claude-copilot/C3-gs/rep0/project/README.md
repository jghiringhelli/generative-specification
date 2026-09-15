# Conduit Backend

A [RealWorld](https://github.com/gothinkster/realworld) / Conduit backend implemented in
TypeScript with Express, Prisma, and PostgreSQL, following a ports-and-adapters
(hexagonal) architecture.

## Architecture

```
Routes (driving adapters)  ->  Services (business logic)  ->  Repository ports (interfaces)
                                                                     ^
                                     Prisma repositories (driven adapters) implement the ports
```

- **Domain** (`src/domain`): plain entity/DTO types, no framework or I/O coupling.
- **Ports** (`src/repositories/I*.ts`): persistence contracts owned by the domain.
- **Services** (`src/services`): orchestration; depend only on ports.
- **Adapters** (`src/repositories/Prisma*.ts`): Prisma-backed implementations.
- **Routes** (`src/routes`): thin Express handlers that delegate to services.
- **Composition root** (`src/config/container.ts`): wires everything via DI.

## Requirements

- Node.js 20+
- PostgreSQL 16

## Setup

```bash
npm install
cp .env.example .env    # then edit values
npx prisma generate
npx prisma migrate deploy
```

## Scripts

| Script | Purpose |
|---|---|
| `npm run build` | Compile TypeScript to `dist/` |
| `npm start` | Run the compiled server |
| `npm test` | Run the Jest test suite |
| `npm run test:coverage` | Run tests with coverage (80% thresholds) |
| `npm run mutation` | Run Stryker mutation testing (break at 65% MSI) |
| `npm run lint` | Lint the codebase |

## API

See [`docs/hardening-summary.md`](docs/hardening-summary.md) for the full endpoint list
and the Conduit error format. Architecture decisions are recorded under
[`docs/adrs`](docs/adrs).
