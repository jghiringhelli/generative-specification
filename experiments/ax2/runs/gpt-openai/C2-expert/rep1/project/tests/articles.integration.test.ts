import { PrismaClient } from "@prisma/client";
import request from "supertest";
import { createApp } from "../src/app";

const prisma = new PrismaClient();
const app = createApp({ prisma, jwtSecret: "article-integration-secret" });

async function register(username: string): Promise<string> {
  const response = await request(app).post("/api/users").send({
    user: {
      username,
      email: `${username}@example.com`,
      password: "password123"
    }
  });
  return response.body.user.token;
}

async function createArticle(token: string, title: string, tagList = ["testing"]) {
  const response = await request(app)
    .post("/api/articles")
    .set("Authorization", `Token ${token}`)
    .send({
      article: {
        title,
        description: `${title} description`,
        body: `${title} body`,
        tagList
      }
    });
  return response.body.article;
}

describe("article endpoints", () => {
  beforeEach(async () => {
    await prisma.comment.deleteMany();
    await prisma.favorite.deleteMany();
    await prisma.article.deleteMany();
    await prisma.tag.deleteMany();
    await prisma.follow.deleteMany();
    await prisma.user.deleteMany();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("lists articles without body fields", async () => {
    const token = await register("alice");
    await createArticle(token, "First article");

    const response = await request(app).get("/api/articles");

    expect(response.status).toBe(200);
    expect(response.body.articlesCount).toBe(1);
    expect(response.body.articles[0]).not.toHaveProperty("body");
  });

  it("lists articles with a tag filter", async () => {
    const token = await register("alice");
    await createArticle(token, "TypeScript", ["typescript"]);
    await createArticle(token, "Postgres", ["database"]);

    const response = await request(app).get("/api/articles?tag=typescript");

    expect(response.body.articlesCount).toBe(1);
    expect(response.body.articles[0].title).toBe("TypeScript");
  });

  it("lists articles with an author filter", async () => {
    const alice = await register("alice");
    const bob = await register("bob");
    await createArticle(alice, "Alice article");
    await createArticle(bob, "Bob article");

    const response = await request(app).get("/api/articles?author=alice");

    expect(response.body.articlesCount).toBe(1);
    expect(response.body.articles[0].author.username).toBe("alice");
  });

  it("lists articles with a favorited filter", async () => {
    const alice = await register("alice");
    const bob = await register("bob");
    const article = await createArticle(alice, "Favorite article");
    await request(app)
      .post(`/api/articles/${article.slug}/favorite`)
      .set("Authorization", `Token ${bob}`);

    const response = await request(app).get("/api/articles?favorited=bob");

    expect(response.body.articlesCount).toBe(1);
    expect(response.body.articles[0].slug).toBe(article.slug);
  });

  it("paginates article lists with limit and offset", async () => {
    const token = await register("alice");
    await createArticle(token, "First");
    await createArticle(token, "Second");
    await createArticle(token, "Third");

    const response = await request(app).get("/api/articles?limit=1&offset=1");

    expect(response.body.articles).toHaveLength(1);
    expect(response.body.articlesCount).toBe(3);
  });

  it("lists a feed of articles from followed users without bodies", async () => {
    const alice = await register("alice");
    const bob = await register("bob");
    await createArticle(bob, "Followed article");
    await request(app)
      .post("/api/profiles/bob/follow")
      .set("Authorization", `Token ${alice}`);

    const response = await request(app)
      .get("/api/articles/feed")
      .set("Authorization", `Token ${alice}`);

    expect(response.body.articlesCount).toBe(1);
    expect(response.body.articles[0]).not.toHaveProperty("body");
  });

  it("gets a single article including its body", async () => {
    const token = await register("alice");
    const article = await createArticle(token, "Detailed article");

    const response = await request(app).get(`/api/articles/${article.slug}`);

    expect(response.status).toBe(200);
    expect(response.body.article.body).toBe("Detailed article body");
  });

  it("creates an article for the authenticated user", async () => {
    const token = await register("alice");

    const article = await createArticle(token, "Created article", ["news"]);

    expect(article.title).toBe("Created article");
    expect(article.slug).toMatch(/^created-article-\d+$/);
    expect(article.tagList).toEqual(["news"]);
  });

  it("updates an article and regenerates its slug when the title changes", async () => {
    const token = await register("alice");
    const article = await createArticle(token, "Original title");

    const response = await request(app)
      .put(`/api/articles/${article.slug}`)
      .set("Authorization", `Token ${token}`)
      .send({ article: { title: "Updated title" } });

    expect(response.status).toBe(200);
    expect(response.body.article.title).toBe("Updated title");
    expect(response.body.article.slug).toMatch(/^updated-title-\d+$/);
  });

  it("updates and returns an article's persisted tags", async () => {
    const token = await register("alice");
    const article = await createArticle(token, "Tagged article", ["old"]);

    const response = await request(app)
      .put(`/api/articles/${article.slug}`)
      .set("Authorization", `Token ${token}`)
      .send({ article: { tagList: ["new", "updated"] } });

    expect(response.status).toBe(200);
    expect(response.body.article.tagList).toEqual(
      expect.arrayContaining(["new", "updated"])
    );
  });

  it("returns 403 when a non-author deletes an article", async () => {
    const alice = await register("alice");
    const bob = await register("bob");
    const article = await createArticle(alice, "Protected article");

    const response = await request(app)
      .delete(`/api/articles/${article.slug}`)
      .set("Authorization", `Token ${bob}`);

    expect(response.status).toBe(403);
  });

  it("deletes an article when requested by its author", async () => {
    const token = await register("alice");
    const article = await createArticle(token, "Disposable article");

    const response = await request(app)
      .delete(`/api/articles/${article.slug}`)
      .set("Authorization", `Token ${token}`);

    expect(response.status).toBe(204);
    await expect(prisma.article.count()).resolves.toBe(0);
  });

  it("favorites and unfavorites an article idempotently", async () => {
    const alice = await register("alice");
    const bob = await register("bob");
    const article = await createArticle(alice, "Popular article");

    const favorited = await request(app)
      .post(`/api/articles/${article.slug}/favorite`)
      .set("Authorization", `Token ${bob}`);
    const unfavorited = await request(app)
      .delete(`/api/articles/${article.slug}/favorite`)
      .set("Authorization", `Token ${bob}`);

    expect(favorited.body.article.favorited).toBe(true);
    expect(favorited.body.article.favoritesCount).toBe(1);
    expect(unfavorited.body.article.favorited).toBe(false);
    expect(unfavorited.body.article.favoritesCount).toBe(0);
  });

  it.each([
    ["gets the feed", "get", "/api/articles/feed"],
    ["creates an article", "post", "/api/articles"],
    ["updates an article", "put", "/api/articles/missing"],
    ["deletes an article", "delete", "/api/articles/missing"],
    ["favorites an article", "post", "/api/articles/missing/favorite"],
    ["unfavorites an article", "delete", "/api/articles/missing/favorite"]
  ])("returns 401 when an unauthenticated user %s", async (_behavior, method, path) => {
    const response = await request(app)[method as "get"](path).send({
      article: {
        title: "Unauthorized",
        description: "Unauthorized",
        body: "Unauthorized"
      }
    });

    expect(response.status).toBe(401);
  });

  it("returns 422 for negative pagination values", async () => {
    const response = await request(app).get("/api/articles?limit=-1&offset=0");

    expect(response.status).toBe(422);
  });
});
