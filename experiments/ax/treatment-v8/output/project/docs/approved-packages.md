# Approved Package Registry

> Audit-before-add. A package not listed here requires `npm audit` review and a
> one-line rationale before it may be imported. Pinned to caret ranges; bumping a
> major requires a note here. See `.claude/standards/architecture.md` § Language
> Stack Constraints for seed defaults.

## Runtime Dependencies

| Package | Version | Layer / Purpose | Rationale |
| --- | --- | --- | --- |
| `express` | `^4.19.2` | Adapter (HTTP) | Minimal web framework; thin driving adapter for routes. |
| `@prisma/client` | `^5.18.0` | Adapter (persistence) | Typed DB client generated from schema. |
| `argon2` | `^0.40.3` | Adapter (security) | Argon2id password hashing; avoids bcrypt/node-pre-gyp CVE chain (ADR-0002). |
| `jsonwebtoken` | `^9.0.2` | Adapter (security) | Stateless JWT auth (ADR-0002). Default-import only under ESM. |
| `zod` | `^3.23.8` | Boundary (validation) | DTO validation at layer seams. |
| `slugify` | `^1.6.6` | Domain support | Deterministic article slug generation. |
| `cors` | `^2.8.5` | Adapter (HTTP) | Cross-origin policy for API clients. |
| `helmet` | `^7.1.0` | Adapter (HTTP) | Security response headers. |
| `dotenv` | `^16.4.5` | Infrastructure (config) | Load `.env` for local development. |

## Development Dependencies

| Package | Version | Purpose | Rationale |
| --- | --- | --- | --- |
| `typescript` | `^5.5.4` | Compiler | Strict typing; `^5.4`+ required by standards. |
| `@types/node` | `^20.14.0` | Types | Node 20 LTS type definitions. |
| `prisma` | `^5.18.0` | Tooling | Schema, migrations, client generation. |
| `jest` | `^29.7.0` | Test runner | Unit/integration; ESM via `--experimental-vm-modules`. |
| `ts-jest` | `^29.2.4` | Test transform | TypeScript transform for Jest (ESM). |
| `supertest` | `^7.0.0` | API testing | Subcutaneous HTTP tests without a browser. |
| `@stryker-mutator/core` | `^8.2.6` | Mutation gate | Verifies test quality (MSI), not just execution. |
| `@stryker-mutator/jest-runner` | `^8.2.6` | Mutation gate | Stryker ↔ Jest integration. |
| `@stryker-mutator/typescript-checker` | `^8.2.6` | Mutation gate | Drops uncompilable mutants. |
| `eslint` | `^9.8.0` | Lint | Flat-config ESLint; `^9` required (minimatch CVE in older). |
| `typescript-eslint` | `^8.0.0` | Lint | TS rules; `^8` pairs with ESLint 9. |
| `eslint-config-prettier` | `^9.1.0` | Lint | Disables stylistic rules handled by Prettier. |
| `prettier` | `^3.3.3` | Format | Code formatting (`^3`). |
| `husky` | `^9.1.4` | Git hooks | Installs `pre-commit` / `commit-msg` gates. |
| `lint-staged` | `^15.2.8` | Git hooks | Runs lint/format on staged files. |
| `@commitlint/cli` | `^19.4.0` | Commit gate | Validates Conventional Commits. |
| `@commitlint/config-conventional` | `^19.2.2` | Commit gate | Conventional ruleset. |
| `cross-env` | `^7.0.3` | Tooling | Cross-platform env vars in npm scripts. |
| `ts-node` | `^10.9.2` | Tooling | Local `dev` runner for TS ESM. |

## Transitive Overrides

| Package | Forced version | Reason | Audit status |
| --- | --- | --- | --- |
| `tmp` | `^0.2.7` | High-severity path-traversal CVEs (GHSA-52f5-9888-hmc6, GHSA-ph9p-34f9-6g65) in `tmp@0.0.33`, pulled in transitively only through the dev tool `@stryker-mutator/core` → `@inquirer/prompts` → `external-editor`. Override clears the `npm audit --audit-level=high` commit gate without the breaking `@stryker-mutator@9` major bump. Stryker's interactive prompts (the sole `tmp` consumer) are not used in CI or pre-commit. | `npm audit --audit-level=high` clean (4 moderate remain, all in the dev-only stryker chain). |

## Rejected Packages

| Package | Reason |
| --- | --- |
| `bcrypt` | `node-pre-gyp` transitive CVE chain; CPU-only, 72-byte limit. Replaced by `argon2` (ADR-0002). |
| `tslint` | Deprecated; use `typescript-eslint`. |
| `mocha` + `chai` | Weak TypeScript ergonomics; use Jest. |
| `moment` | Unmaintained / oversized; use native `Intl`/`Date`. |
