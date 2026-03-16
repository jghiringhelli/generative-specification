# Code Quality Comparison

*Side-by-side analysis of generated code across conditions.*
*All code excerpts are directly from `experiments/{condition}/output/project/`.*

---

## Finding 1: Dependency Injection Pattern (Composable dimension, +1 for Treatment)

This is the only dimension where GS differentiated from expert prompting.

### Control — Constructor injection against concrete types

**`src/services/userService.ts`:**
```typescript
import { UserRepository } from '../repositories/userRepository';

export class UserService {
  constructor(private userRepository: UserRepository) {}
  // ...
}
```

**`src/routes/profiles.ts` (dependency wiring — scattered across 5 route files):**
```typescript
import { UserRepository } from '../repositories/userRepository';

const userRepository = new UserRepository(prisma);
const profileService = new ProfileService(profileRepository, userRepository);
```

**Problem:** `UserService` depends on the _concrete_ `UserRepository` class.
To swap implementations (e.g., for testing, for a different DB adapter), you must modify the service.
Dependencies are wired at the route level, duplicated across 5 files — no single composition root.

---

### Treatment — Interface-based DI + explicit composition root

**`src/repositories/user.repository.ts`:**
```typescript
export interface IUserRepository {
  findById(id: number): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  findByUsername(username: string): Promise<User | null>;
  create(data: { email: string; username: string; passwordHash: string }): Promise<User>;
  update(id: number, data: UpdateUserDTO & { passwordHash?: string }): Promise<User>;
}

export class UserRepository implements IUserRepository {
  constructor(private readonly prisma: PrismaClient) {}
  // ...
}
```

**`src/services/auth.service.ts`:**
```typescript
export class AuthService {
  constructor(private readonly userRepository: IUserRepository) {}
  // ...
}
```

**`src/app.ts` (single composition root — all wiring in one place):**
```typescript
// Dependency injection setup
const userRepository = new UserRepository(prisma);
const profileRepository = new ProfileRepository(prisma);
const articleRepository = new ArticleRepository(prisma);
const commentRepository = new CommentRepository(prisma);
const tagRepository = new TagRepository(prisma);

const authService = new AuthService(userRepository);
const profileService = new ProfileService(userRepository, profileRepository);
const articleService = new ArticleService(articleRepository, tagRepository, profileRepository);
const commentService = new CommentService(commentRepository, articleRepository, profileRepository);
const tagService = new TagService(tagRepository);
```

**Why this matters:** `AuthService` accepts any `IUserRepository`. In tests:
```typescript
const mockUserRepository = jest.mocked<IUserRepository>(...)
const sut = new AuthService(mockUserRepository);
```
No module patching, no spy injection — pure constructor substitution.
The treatment's services layer achieved **100% unit test isolation** (auth.service: 100% MSI, comment.service: 100% MSI).

**Root cause — traceable to ADR-003 text:**
> *"Dependency Inversion: Depend on abstractions. Concrete classes are injected, never instantiated inside business logic."*

---

## Finding 2: Error Response Format (ADR-004 vs inline prompt instruction)

### Control (80% compliant — from inference of inline README instruction)

```typescript
// From src/services/userService.ts
throw new HttpError(422, { errors: { body: ['Email already taken'] } });
```

4/20 sampled endpoints returned non-compliant formats (direct string messages, wrong HTTP codes).

### Treatment (100% compliant — from ADR-004 commitment)

```typescript
// From src/errors/AppError.ts
export class AppError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
    public readonly field?: string
  ) { super(message); }

  toJSON() {
    return { errors: { body: [this.message] } };
  }
}
```

ADR-004 committed the format as an architectural decision in the project's "constitution."
The model could not deviate from it without writing a new ADR superseding it.

---

## Finding 3: Schema Pre-Specification vs Incremental Discovery

### Control — Schema evolved over 4 prompts

- P1: `User` model only
- P3: `Article`, `Tag` models; `ArticleFavorite` join table added
- P4: `Comment` model; relationship adjustments to handle cascade requirements
- Result: Minor inconsistencies in relation naming that contributed to the TS error at `articleService.ts:159`

### Treatment — Complete 6-model schema in P1

```prisma
// Emitted in full in Prompt 1 (auth prompt — before any application code)
model User {
  id        Int       @id @default(autoincrement())
  email     String    @unique
  username  String    @unique
  password  String
  bio       String?
  image     String?
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt
  articles  Article[]
  comments  Comment[]
  following Follow[]  @relation("follower")
  followers Follow[]  @relation("following")
  favorites ArticleFavorite[]
}
// ... Article, Comment, Tag, Follow, ArticleFavorite all defined in P1
```

All relations, indices, and cascades agreed upfront. No schema drift across 6 prompts.
Services used the schema contracts from P1 onward — no mid-stream adjustments.

---

## Finding 4: Coverage Hallucination (both structured conditions)

This is not a code quality difference between conditions — it is a shared model-level failure.

### What both models wrote in their documentation

Control (`docs/IMPLEMENTATION_SUMMARY.md`):
```
Test Coverage: 94.52%
All endpoints covered with integration and unit tests.
```

Treatment (Status.md):
```
Current test coverage: ~93% (above 80% threshold)
All service layer methods covered with unit tests.
```

### What real measurement showed

| Condition | Reported in docs | Real (Jest + DB) |
|---|---|---|
| Control | 94.52% | **34.12% lines** |
| Treatment | ~93% | **27.63% lines** |

**The pattern:** Both models state the goal as if it were an achievement. This is not
malicious — it reflects training on documentation that describes intended system states.
The model writes documentation the same way it would write it for a completed system.

**Implication for AI-generated code trust:** Documentation quality (including coverage reports
and architecture descriptions) cannot be taken as evidence of implementation quality.
External measurement is required. This finding motivated adding mutation testing as a hard gate
to GS templates — a gate that cannot be satisfied by AI-written documentation.

---

## Finding 5: What Naive Condition Is Expected to Show (PENDING)

Based on the pattern, the naive condition is expected to produce:

- **Self-Describing:** Reduced — likely README and inline comments only, no separate docs
- **Bounded:** Likely mixed — model may or may not use layers without explicit guidance
- **Verifiable:** Reduced — no test requirements means fewer or no tests
- **Defended:** 0 — not present even in guided conditions
- **Auditable:** 0 — no mention of ADRs, no CHANGELOG
- **Composable:** 0 or 1 — DI patterns unlikely without explicit instruction

Expected total: **2–4/12**, compared to Control's 8 and Treatment's 9.

The naive baseline makes the *floor* visible. Without it, a reader might conclude that
expert prompting (Control: 8/12) is "good enough." The naive condition documents
what the actual cost of current default AI usage patterns is.
