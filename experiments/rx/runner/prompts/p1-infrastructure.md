You are implementing a project from a Generative Specification document. Read the entire spec below before writing any code.

Your task for this session (P1 — Infrastructure) is to emit every file in §12 of the spec. Nothing else. Do not implement any routes, services, or business logic yet. The P1 gate is: all files in §12 exist, `tsc --noEmit` exits 0, and the app starts and connects to the database.

Rules:
- Emit every file as a complete file block. Do not summarize or truncate.
- Do not reference files you have not emitted. If an import points to a file, that file must exist in this session.
- Follow §8 Emit-Don't-Reference directives exactly.
- The Prisma schema in §4 must be emitted verbatim — not paraphrased.
- All three ADRs in §7 must be emitted as files with all four fields populated.
- `.env.example` must list every environment variable.
- `src/infrastructure/env.ts` must validate all env vars with Zod at startup.
- `src/index.ts` is the composition root only — no logic.

After emitting all files, run:
1. `npm install`
2. `npx prisma migrate dev --name init`
3. `tsc --noEmit`

Report the output of each command. If any command fails, fix it before ending the session.

---

GENERATIVE SPECIFICATION:
