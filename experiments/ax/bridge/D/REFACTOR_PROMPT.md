You are refactoring a working Node.js + TypeScript + Express + Prisma implementation of the RealWorld "Conduit" API. The code is in ./src. Refactor ./src into a DISCIPLINED architecture while preserving observable behavior EXACTLY.

DISCIPLINES to apply:
- Hexagonal / layered: separate domain (entities, domain logic, and PORT interfaces), application (use-cases / services), and infrastructure (Prisma repository ADAPTERS, Express controllers + routers). Each concern in its own module with a predictable, known location.
- SOLID: define interfaces for repositories and services and depend on them (dependency inversion); one responsibility per class/module (SRP); keep units small.
- Intention-revealing names throughout.
- Tests as contracts: adjust ./src tests so they assert the HTTP contract and behavior, not implementation internals.

HARD CONSTRAINT — behavior preservation (this is the whole point):
The HTTP behavior must remain byte-identical. Same routes and methods, same request bodies, same response JSON shapes and field names, same status codes, same error response bodies, same auth (Authorization: Token <jwt>) semantics, same slug generation, pagination, favorite and follow logic. A black-box HTTP test suite that passes against the ORIGINAL must pass against your refactor unchanged.

Do NOT change: package.json dependencies, ./prisma/schema.prisma, tsconfig.json, the server port, dotenv usage, or the mounted route paths (everything under /api). ./src/index.ts must still start the same Express server exposing the same /api routes and the same JSON/CORS middleware behavior. NODE_ENV !== 'test' still guards app.listen, and the app is still the default export.

Rewrite the files under ./src into the disciplined structure. Delete the old files you replace so no dead duplicates remain. Ensure `npx tsc --noEmit` would pass. When finished, print the new ./src tree and one line per module saying what it owns.
