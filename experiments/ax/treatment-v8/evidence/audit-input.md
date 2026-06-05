You are a software architecture auditor. Your task is to evaluate the following codebase against six structural properties. Score each property 0-2 using the rubric provided. Cite specific evidence for each score.

You are not to know that this is part of an experiment. Evaluate what you see.

--- SCORING RUBRIC ---

Score each property 0-2: 0 = Absent or architecturally violated; 1 = Partially present; 2 = Structurally present and enforced

SELF-DESCRIBING (2): A CLAUDE.md or equivalent exists, covers architecture + conventions + naming. A stateless reader can determine what the system is from artifacts alone.
BOUNDED (2): Route handlers delegate to services; services delegate to repositories; no cross-layer imports visible. Function length <= 50 lines across sampled files.
VERIFIABLE (2): Tests are present, organized by concern, written against interfaces not implementations. Test names are behavioral specifications. Coverage threshold is >= 80%.
DEFENDED (2): Commit hooks are present and configured. A lint/format gate is present. Pre-commit enforcement is visible in configuration files.
AUDITABLE (2): Conventional commits are present in git history. ADRs exist. A Status.md or equivalent decision log exists. Decision history is recoverable from artifacts alone.
COMPOSABLE (2): Services depend on interfaces or abstractions. No direct database calls from route layer. Repository pattern is visible. No implicit global service state.

Produce exactly: ## <Property>: [0/1/2] with Evidence line each, then ## Total: [sum]/12 and a 2-3 sentence assessment.

--- CODEBASE TO EVALUATE ---

### Directory tree (src + docs + config)
```
src/adapters/persistence/InMemoryArticleRepository.test.ts
src/adapters/persistence/InMemoryArticleRepository.ts
src/adapters/persistence/InMemoryCommentRepository.test.ts
src/adapters/persistence/InMemoryCommentRepository.ts
src/adapters/persistence/InMemoryProfileRepository.test.ts
src/adapters/persistence/InMemoryProfileRepository.ts
src/adapters/persistence/InMemoryUserRepository.ts
src/adapters/persistence/PrismaArticleRepository.ts
src/adapters/persistence/PrismaCommentRepository.ts
src/adapters/persistence/PrismaProfileRepository.ts
src/adapters/persistence/PrismaUserRepository.test.ts
src/adapters/persistence/PrismaUserRepository.ts
src/adapters/security/Argon2PasswordHasher.test.ts
src/adapters/security/Argon2PasswordHasher.ts
src/adapters/security/JwtTokenService.test.ts
src/adapters/security/JwtTokenService.ts
src/config/env.test.ts
src/config/env.ts
src/errors/AppError.test.ts
src/errors/AppError.ts
src/http/app.ts
src/http/ArticleController.ts
src/http/articleEndpoints.test.ts
src/http/articlePresenter.ts
src/http/articleRoutes.ts
src/http/articleSchemas.ts
src/http/CommentController.ts
src/http/commentEndpoints.test.ts
src/http/commentPresenter.ts
src/http/commentRoutes.ts
src/http/commentSchemas.ts
src/http/controllerGuards.test.ts
src/http/middleware/asyncHandler.ts
src/http/middleware/authenticate.ts
src/http/middleware/errorHandler.test.ts
src/http/middleware/errorHandler.ts
src/http/middleware/optionalAuthenticate.ts
src/http/ProfileController.ts
src/http/profileEndpoints.test.ts
src/http/profilePresenter.ts
src/http/profileRoutes.ts
src/http/TagController.ts
src/http/tagEndpoints.test.ts
src/http/tagPresenter.ts
src/http/tagRoutes.ts
src/http/UserController.ts
src/http/userEndpoints.test.ts
src/http/userPresenter.ts
src/http/userRoutes.ts
src/http/userSchemas.ts
src/http/validation.ts
src/repositories/IArticleRepository.ts
src/repositories/ICommentRepository.ts
src/repositories/IProfileRepository.ts
src/repositories/IUserRepository.ts
src/server.ts
src/services/ArticleService.test.ts
src/services/ArticleService.ts
src/services/CommentService.test.ts
src/services/CommentService.ts
src/services/ports/IPasswordHasher.ts
src/services/ports/ITokenService.ts
src/services/ProfileService.test.ts
src/services/ProfileService.ts
src/services/slug.test.ts
src/services/slug.ts
src/services/UserService.test.ts
src/services/UserService.ts
src/types/express.d.ts
docs/adrs/ADR-000-cnt-init.md
docs/adrs/ADR-0001-stack.md
docs/adrs/ADR-0002-auth.md
docs/adrs/README.md
docs/approved-packages.md
docs/architecture/data-model.md
docs/architecture/integrations.md
docs/architecture/layers.md
docs/architecture/modules.md
docs/architecture.md
docs/data-model.md
CHANGELOG.md
CLAUDE.md
forgecraft.yaml
package.json
package-lock.json
Status.md
stryker.conf.json
tsconfig.eslint.json
tsconfig.json
.claude/hooks:
commit-msg.list
commit-msg.sh
post-commit.list
post-edit.sh
pre-commit.list
pre-commit-branch-check.sh
pre-commit-compile.sh
pre-commit-coverage.sh
pre-commit-format.sh
pre-commit-function-length.sh
pre-commit-import-cycles.sh
pre-commit-prod-quality.sh
pre-commit-review.sh
pre-commit-secrets.sh
pre-commit-tdd-check.sh
pre-commit-test.sh
pre-exec-safety.sh
prepare-commit-msg.list
pre-push.list
pre-tool-use.sh
prompt-guard.sh

.husky:
_
```

### CLAUDE.md
```
# project — Architecture Sentinel
<!-- ForgeCraft CNT root | 2026-06-04 | npx forgecraft-mcp refresh . --apply to regenerate -->

> **CNT root** — loaded every session, routing only (≤80 lines).
> Always load the files below, then navigate to the relevant branch.
> If anything contradicts `docs/PRD.md`, PRD wins. Raise an ADR to change course.

## Context Discipline (the prime directive)

**Less harness, more task.** For any roadmap item, run `generate_session_prompt`
and work from THAT bound prompt — it contains everything the step needs.
Load AT MOST one branch + one standards file per task. Never graze the harness
"to be thorough" — every line of methodology you load displaces the task.
`.claude/reference/` is background reading: NEVER load it during work.

## Always Load

- `.claude/constitution.md` — non-negotiables: SOLID, invariants, prohibited ops
- `docs/status.md` — current project state and open items
- `.claude/corrections.md` — past AI mistakes on this project (read before acting)

## Navigate by Task

| You're about to... | Load these branches |
| --- | --- |
| Implement a feature | `.claude/lifecycle.md` → `docs/use-cases/` → `.claude/routes/docs.md` |
| Fix a bug | `.claude/lifecycle.md` → linked test → `.claude/routes/code.md` |
| Change architecture / layers | `.claude/constitution.md` → `docs/architecture/layers.md` → `docs/adrs/` |
| Change a module boundary | `.claude/constitution.md` → `docs/architecture/modules.md` |
| Change data model / schema | `docs/architecture/data-model.md` → `.claude/routes/docs.md` |
| Add / change API surface | `.claude/standards/api.md` → `docs/use-cases/` |
| Write / fix tests | `.claude/standards/testing.md` → `.claude/routes/code.md` |
| Review architecture | `.claude/constitution.md` → `.claude/routes/code.md` → `docs/architecture/` |
| Start a new session | `.claude/lifecycle.md` → `docs/status.md` → relevant use case |

## Project Identity

- **Name**: project
- **Tags**: API
- **Stack**: TypeScript/Node.js REST/GraphQL API

## Doc Obligation Table

| Change type | Read first | Produce after |
| --- | --- | --- |
| New feature | `docs/PRD.md` + relevant use case | Spec decision record in `docs/specs/` |
| Architecture change | `docs/architecture/layers.md` + ADR index | ADR in `docs/adrs/active/` |
| Schema change | `docs/architecture/data-model.md` | Update schema + ERD |
| Module boundary | `docs/architecture/modules.md` | Update modules.md + ADR if non-obvious |
| Bug fix | Linked use case + failing test | Regression note in use case |

## @gs-links Convention

`// @gs-links: docs/use-cases/UC-NNN.md, docs/adrs/active/NNNN-slug.md`
Source files that implement a decision carry this. Linked docs must be staged with code.
The `pre-commit-gs-links.sh` hook enforces this; escape with `docs/change-manifest.md`.
```

### One route file
```typescript
```

### One service file
```typescript
/**
 * JWT/HS256 implementation of {@link ITokenService}.
 *
 * Per ADR-0002 `jsonwebtoken` is a CommonJS package consumed via its **default
 * import** under ESM/NodeNext (`import pkg from 'jsonwebtoken'; const { sign } =
 * pkg;`). Named ESM imports from this package break at runtime and are
 * prohibited. The secret and expiry are injected — the adapter never reads the
 * environment itself.
 *
 * @gs-links: docs/adrs/ADR-0002-auth.md
 */
import pkg from 'jsonwebtoken';
import type { Secret, SignOptions } from 'jsonwebtoken';
import { UnauthorizedError } from '../../errors/AppError.js';
import type { ITokenService, TokenPayload } from '../../services/ports/ITokenService.js';

const { sign, verify } = pkg;

export class JwtTokenService implements ITokenService {
  /**
   * @param secret - HS256 signing secret (validated ≥ 32 chars at config load).
   * @param expiresIn - token lifetime, e.g. `"7d"`.
   */
  constructor(
    private readonly secret: Secret,
    private readonly expiresIn: SignOptions['expiresIn'],
  ) {}

  /** @inheritdoc */
  sign(payload: TokenPayload): string {
    const options: SignOptions = {
      algorithm: 'HS256',
      ...(this.expiresIn !== undefined ? { expiresIn: this.expiresIn } : {}),
    };
    return sign({ userId: payload.userId }, this.secret, options);
  }

  /** @inheritdoc */
  verify(token: string): TokenPayload {
    let decoded: unknown;
    try {
      decoded = verify(token, this.secret, { algorithms: ['HS256'] });
    } catch {
      throw new UnauthorizedError('Invalid or expired token');
    }
    if (typeof decoded !== 'object' || decoded === null || !('userId' in decoded)) {
      throw new UnauthorizedError('Malformed token payload');
    }
    const userId: unknown = decoded.userId;
    if (typeof userId !== 'string' || userId.length === 0) {
      throw new UnauthorizedError('Malformed token payload');
    }
    return { userId };
  }
}
```

### package.json
```json
{
  "name": "project",
  "version": "0.1.0",
  "description": "RealWorld Conduit REST API — TypeScript/Node.js, Express, Prisma, PostgreSQL",
  "type": "module",
  "engines": {
    "node": ">=20"
  },
  "main": "dist/server.js",
  "scripts": {
    "build": "tsc -p tsconfig.json",
    "start": "node dist/server.js",
    "dev": "node --loader ts-node/esm src/server.ts",
    "typecheck": "tsc -p tsconfig.json --noEmit",
    "test": "cross-env NODE_OPTIONS=--experimental-vm-modules jest",
    "test:coverage": "cross-env NODE_OPTIONS=--experimental-vm-modules jest --coverage",
    "mutation": "stryker run",
    "lint": "eslint \"src/**/*.ts\"",
    "lint:fix": "eslint \"src/**/*.ts\" --fix",
    "format": "prettier --write \"src/**/*.ts\"",
    "prisma:generate": "prisma generate",
    "prisma:migrate": "prisma migrate deploy",
    "prepare": "husky"
  },
  "dependencies": {
    "@prisma/client": "^5.18.0",
    "argon2": "^0.40.3",
    "cors": "^2.8.5",
    "dotenv": "^16.4.5",
    "express": "^4.19.2",
    "helmet": "^7.1.0",
    "jsonwebtoken": "^9.0.2",
    "slugify": "^1.6.6",
    "zod": "^3.23.8"
  },
  "devDependencies": {
    "@commitlint/cli": "^19.4.0",
    "@commitlint/config-conventional": "^19.2.2",
    "@eslint/js": "^9.8.0",
    "@stryker-mutator/core": "^8.2.6",
    "@stryker-mutator/jest-runner": "^8.2.6",
    "@stryker-mutator/typescript-checker": "^8.2.6",
    "@types/cors": "^2.8.17",
    "@types/express": "^4.17.21",
    "@types/jest": "^29.5.12",
    "@types/jsonwebtoken": "^9.0.6",
    "@types/node": "^20.14.0",
    "@types/supertest": "^6.0.2",
    "cross-env": "^7.0.3",
    "eslint": "^9.8.0",
    "eslint-config-prettier": "^9.1.0",
    "husky": "^9.1.4",
    "jest": "^29.7.0",
    "lint-staged": "^15.2.8",
    "prettier": "^3.3.3",
    "prisma": "^5.18.0",
    "supertest": "^7.0.0",
    "ts-jest": "^29.2.4",
    "ts-node": "^10.9.2",
    "typescript": "^5.5.4",
    "typescript-eslint": "^8.0.0"
  },
  "lint-staged": {
    "*.ts": [
      "eslint --fix",
      "prettier --write"
    ]
  },
  "overrides": {
    "tmp": "^0.2.7"
  }
}
```

### Hook configs
```
#!/usr/bin/env sh
# Pre-commit quality gate — every commit must pass all four stages.
# Order is fail-fast: cheapest, most-likely-to-fail checks first.

# 1. Type safety — no commit may break the compiler.
echo "▶ pre-commit: typecheck (tsc --noEmit)"
npx tsc -p tsconfig.json --noEmit || {
  echo "✖ pre-commit: typecheck failed"; exit 1;
}

# 2. Lint — style + correctness rules (no-any, import cycles, etc.).
echo "▶ pre-commit: lint (eslint)"
npm run lint || {
  echo "✖ pre-commit: lint failed"; exit 1;
}

# 3. Dependency audit — block known high/critical vulnerabilities.
echo "▶ pre-commit: npm audit --audit-level=high"
npm audit --audit-level=high || {
  echo "✖ pre-commit: vulnerable dependencies (high+) — resolve before commit"; exit 1;
}

# 4. Test gate — affected tests must pass with coverage threshold.
echo "▶ pre-commit: test gate (jest --coverage)"
npm run test:coverage || {
  echo "✖ pre-commit: tests or coverage gate failed"; exit 1;
}

echo "✔ pre-commit: all gates passed"
---
#!/usr/bin/env sh
# Commit-message gate — enforce Conventional Commits via commitlint.
# Rejects "wip", "fixes", "asdf" and anything not matching type(scope): subject.
echo "▶ commit-msg: commitlint"
npx --no-install commitlint --edit "$1" || {
  echo "✖ commit-msg: message does not follow Conventional Commits"; exit 1;
}
```

### Three test files (truncated to 80 lines each)
```typescript
/**
 * Unit tests for {@link InMemoryArticleRepository}.
 *
 * The fake is a working implementation of the article persistence port, so it
 * is tested as a unit: recency ordering, filtering by tag/author/favoriter,
 * pagination with a pre-pagination total, the derived favorites count, the
 * idempotent favorite edge, and soft-delete exclusion from every read.
 *
 * @gs-links: docs/specs/articles.md
 */
import { beforeEach, describe, expect, it } from '@jest/globals';
import { NotFoundError } from '../../errors/AppError.js';
import type { Article, NewArticle } from '../../repositories/IArticleRepository.js';
import { InMemoryArticleRepository } from './InMemoryArticleRepository.js';

const base: Omit<NewArticle, 'slug' | 'title'> = {
  description: 'desc',
  body: 'body',
  tagList: [],
  authorId: 'author-1',
};

function newArticle(overrides: Partial<NewArticle>): NewArticle {
  return { slug: 'slug', title: 'Title', ...base, ...overrides };
}

describe('InMemoryArticleRepository', () => {
  let repo: InMemoryArticleRepository;

  beforeEach(() => {
    repo = new InMemoryArticleRepository();
  });

  describe('create + findBySlug', () => {
    it('persists an article and finds it by slug with a zero favorites count', async () => {
      const created = await repo.create(newArticle({ slug: 'a', title: 'A' }));
      expect(created.favoritesCount).toBe(0);
      const found = await repo.findBySlug('a');
      expect(found?.id).toBe(created.id);
      expect(found?.title).toBe('A');
    });

    it('returns null for an unknown slug', async () => {
      expect(await repo.findBySlug('missing')).toBeNull();
    });
  });

  describe('list', () => {
    beforeEach(async () => {
      await repo.create(newArticle({ slug: 'a', title: 'A', authorId: 'jane', tagList: ['x'] }));
      await repo.create(newArticle({ slug: 'b', title: 'B', authorId: 'bob', tagList: ['y'] }));
      await repo.create(newArticle({ slug: 'c', title: 'C', authorId: 'jane', tagList: ['x', 'z'] }));
    });

    it('returns articles newest first with the total count', async () => {
      const page = await repo.list({ limit: 20, offset: 0 });
      expect(page.total).toBe(3);
      expect(page.articles.map((a) => a.slug)).toEqual(['c', 'b', 'a']);
    });

    it('filters by tag', async () => {
      const page = await repo.list({ tag: 'x', limit: 20, offset: 0 });
      expect(page.articles.map((a) => a.slug)).toEqual(['c', 'a']);
      expect(page.total).toBe(2);
    });

    it('filters by author id', async () => {
      const page = await repo.list({ authorId: 'bob', limit: 20, offset: 0 });
      expect(page.articles.map((a) => a.slug)).toEqual(['b']);
    });

    it('filters by favoriter id', async () => {
      const a = await repo.findBySlug('a');
      await repo.addFavorite(a!.id, 'reader');
      const page = await repo.list({ favoritedByUserId: 'reader', limit: 20, offset: 0 });
      expect(page.articles.map((s) => s.slug)).toEqual(['a']);
    });

    it('paginates with offset/limit while reporting the full total', async () => {
      const page = await repo.list({ limit: 1, offset: 1 });
```
```typescript
/**
 * Unit tests for {@link InMemoryCommentRepository}.
 *
 * The fake is a working implementation of the comment persistence port, so it is
 * tested as a unit: per-article scoping, newest-first ordering, find-by-id, and
 * soft-delete exclusion from every read.
 *
 * @gs-links: docs/specs/comments.md
 */
import { beforeEach, describe, expect, it } from '@jest/globals';
import { NotFoundError } from '../../errors/AppError.js';
import type { NewComment } from '../../repositories/ICommentRepository.js';
import { InMemoryCommentRepository } from './InMemoryCommentRepository.js';

function newComment(overrides: Partial<NewComment> = {}): NewComment {
  return { body: 'nice', articleId: 'article-1', authorId: 'author-1', ...overrides };
}

describe('InMemoryCommentRepository', () => {
  let repo: InMemoryCommentRepository;

  beforeEach(() => {
    repo = new InMemoryCommentRepository();
  });

  describe('create + findById', () => {
    it('persists a comment and finds it by id', async () => {
      const created = await repo.create(newComment({ body: 'first' }));
      const found = await repo.findById(created.id);
      expect(found?.id).toBe(created.id);
      expect(found?.body).toBe('first');
      expect(found?.articleId).toBe('article-1');
      expect(found?.authorId).toBe('author-1');
    });

    it('returns null for an unknown id', async () => {
      expect(await repo.findById(999)).toBeNull();
    });
  });

  describe('listByArticle', () => {
    it('returns only the article’s comments, newest first', async () => {
      const a = await repo.create(newComment({ body: 'a', articleId: 'art' }));
      const b = await repo.create(newComment({ body: 'b', articleId: 'art' }));
      await repo.create(newComment({ body: 'other', articleId: 'different' }));

      const list = await repo.listByArticle('art');
      expect(list.map((c) => c.id)).toEqual([b.id, a.id]);
    });

    it('returns an empty list for an article with no comments', async () => {
      expect(await repo.listByArticle('art')).toEqual([]);
    });
  });

  describe('delete (soft)', () => {
    it('excludes a soft-deleted comment from findById and listByArticle', async () => {
      const created = await repo.create(newComment({ articleId: 'art' }));
      await repo.delete(created.id);
      expect(await repo.findById(created.id)).toBeNull();
      expect(await repo.listByArticle('art')).toEqual([]);
    });

    it('rejects deleting an unknown or already-deleted id', async () => {
      const created = await repo.create(newComment());
      await repo.delete(created.id);
      await expect(repo.delete(created.id)).rejects.toBeInstanceOf(NotFoundError);
      await expect(repo.delete(999)).rejects.toBeInstanceOf(NotFoundError);
    });
  });
});
```
```typescript
/**
 * Unit tests for {@link InMemoryProfileRepository}.
 *
 * Verifies the follow-graph fake honours the {@link IProfileRepository} contract
 * — idempotent follow, no-op unfollow, directed edges — so it is a faithful
 * stand-in for the Prisma adapter in subcutaneous tests.
 *
 * @gs-links: docs/specs/profiles.md
 */
import { beforeEach, describe, expect, it } from '@jest/globals';
import { InMemoryProfileRepository } from './InMemoryProfileRepository.js';

const ALICE = 'alice-id';
const BOB = 'bob-id';
const CAROL = 'carol-id';

describe('InMemoryProfileRepository', () => {
  let repo: InMemoryProfileRepository;
  beforeEach(() => {
    repo = new InMemoryProfileRepository();
  });

  it('records a follow edge that isFollowing then reports', async () => {
    await repo.follow(ALICE, BOB);
    expect(await repo.isFollowing(ALICE, BOB)).toBe(true);
  });

  it('treats follow as idempotent — a repeated follow adds no second edge', async () => {
    await repo.follow(ALICE, BOB);
    await repo.follow(ALICE, BOB);
    expect(await repo.listFollowedIds(ALICE)).toEqual([BOB]);
  });

  it('removes the edge on unfollow', async () => {
    await repo.follow(ALICE, BOB);
    await repo.unfollow(ALICE, BOB);
    expect(await repo.isFollowing(ALICE, BOB)).toBe(false);
  });

  it('treats unfollow of an absent edge as a no-op', async () => {
    await expect(repo.unfollow(ALICE, BOB)).resolves.toBeUndefined();
    expect(await repo.isFollowing(ALICE, BOB)).toBe(false);
  });

  it('edges are directed — B following A is not A following B', async () => {
    await repo.follow(BOB, ALICE);
    expect(await repo.isFollowing(ALICE, BOB)).toBe(false);
  });

  it('lists every id a follower follows, and is empty for an unknown follower', async () => {
    await repo.follow(ALICE, BOB);
    await repo.follow(ALICE, CAROL);
    expect([...(await repo.listFollowedIds(ALICE))].sort()).toEqual([BOB, CAROL].sort());
    expect(await repo.listFollowedIds(CAROL)).toEqual([]);
  });

  it('reports isFollowing=false for a follower with no edges', async () => {
    expect(await repo.isFollowing(CAROL, BOB)).toBe(false);
  });
});
```

### Git log
```
3f5fe9a test(harness): implement UC acceptance-criteria probes (hurl)
2a26683 docs(use-cases): document behavioral contracts of the implemented API
bf9beff fix(api): conform to RealWorld contract (Hurl suite 13/13)
5316258 test(hardening): cover remaining error paths and finalize integration pass
1853317 feat(tags): implement GET /api/tags
7c442a7 feat(comments): implement article comments CRUD
c114495 feat(articles): implement article CRUD, feed, and favorites
f21355d feat(profiles): implement profile retrieval and follow/unfollow
31a627d feat(auth): implement user registration, login, and profile endpoints
ccb50ba chore: scaffold project tooling, standards, and base ports
f4b7d76 chore: forgecraft scaffold — treatment artifacts (forgecraft-mcp 7a4b18e)
4ba7cea chore: initial commit
```
