# Domain Model — Conduit

```mermaid
erDiagram
  User {
    int id PK
    string email UK
    string username UK
    string passwordHash
    string bio
    string image
    datetime createdAt
    datetime updatedAt
  }

  Article {
    int id PK
    string slug UK
    string title
    string description
    string body
    int authorId FK
    datetime createdAt
    datetime updatedAt
  }

  Comment {
    int id PK
    string body
    int authorId FK
    int articleId FK
    datetime createdAt
    datetime updatedAt
  }

  Tag {
    int id PK
    string name UK
  }

  ArticleTag {
    int articleId FK
    int tagId FK
  }

  UserFollow {
    int followerId FK
    int followingId FK
  }

  UserFavorite {
    int userId FK
    int articleId FK
  }

  User ||--o{ Article : "authors"
  User ||--o{ Comment : "authors"
  User ||--o{ UserFollow : "follows (as follower)"
  User ||--o{ UserFollow : "followed by (as following)"
  User ||--o{ UserFavorite : "favorites"
  Article ||--o{ Comment : "has"
  Article ||--o{ ArticleTag : "tagged with"
  Article ||--o{ UserFavorite : "favorited by"
  Tag ||--o{ ArticleTag : "appears in"
```

## Key Constraints

- `User.email` and `User.username` are unique
- `Article.slug` is unique and derived from title (lowercased, hyphenated)
- `UserFollow` is a self-referential M:M on User (follower → following)
- `UserFavorite` is M:M between User and Article
- `ArticleTag` is M:M between Article and Tag
