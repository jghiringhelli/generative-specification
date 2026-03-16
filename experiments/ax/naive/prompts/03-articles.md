# Prompt 3 — Articles

Add articles. Users can create, read, update, and delete articles. Articles have a title, description, body, and tags. They can be favorited.

- GET /api/articles — list articles (with filters: tag, author, favorited, limit, offset)
- GET /api/articles/feed — get feed of articles from followed users
- GET /api/articles/:slug — get article
- POST /api/articles — create article
- PUT /api/articles/:slug — update article
- DELETE /api/articles/:slug — delete article
- POST /api/articles/:slug/favorite — favorite article
- DELETE /api/articles/:slug/favorite — unfavorite article
