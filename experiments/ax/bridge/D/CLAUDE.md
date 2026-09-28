# Conduit API — navigation (hexagonal / ports and adapters)

Each concern has a known location:

- `src/domain/entities/` — domain entities (Article, User, Comment).
- `src/domain/repositories/` — repository INTERFACES (ports): IArticleRepository, IUserRepository, ICommentRepository, ITagRepository.
- `src/application/services/` — business logic / use-cases: ArticleService, UserService, ProfileService, CommentService, TagService. Article response building, which includes the `favorited` and author `following` flags, is in `ArticleService`.
- `src/infrastructure/repositories/` — Prisma repository ADAPTERS (PrismaArticleRepository, ...).
- `src/infrastructure/security/` — `JwtTokenService` (token sign / verify), `PasswordHasher`.
- `src/infrastructure/utils/` — `SlugGenerator` (slug generation and uniqueness).
- `src/presentation/controllers/` — HTTP controllers.
- `src/presentation/routes/` — Express route wiring.
- `src/presentation/middleware/AuthMiddleware.ts` — authentication middleware (verifies the request token).
- `src/DependencyContainer.ts` — composition root.
- `prisma/schema.prisma` — data model (Article.slug is unique).
