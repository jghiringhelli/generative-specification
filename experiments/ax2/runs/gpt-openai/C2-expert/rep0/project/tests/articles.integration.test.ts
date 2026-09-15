import { PrismaClient } from "@prisma/client";
import request from "supertest";
import { createApp } from "../src/app";

const prisma = new PrismaClient();
const app = createApp(prisma, { jwtSecret: "integration-secret", port: 3000 });

async function register(username: string) {
  return request(app).post("/api/users").send({
    user: { username, email: `${username}@example.com`, password: "secure-password" }
  });
}

async function createArticle(token: string, title: string, tagList = ["testing"]) {
  return request(app).post("/api/articles").set("Authorization", `Token ${token}`).send({
    article: { title, description: `${title} description`, body: `${title} body`, tagList }
  });
}

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

describe("article endpoints", () => {
  it("lists articles without body fields", async () => {
    const author = await register("author");
    await createArticle(author.body.user.token, "First");
    const response = await request(app).get("/api/articles");
    expect(response.body.articlesCount).toBe(1);
    expect(response.body.articles[0].body).toBeUndefined();
  });

  it("lists articles matching a tag filter", async () => {
    const author = await register("author");
    await createArticle(author.body.user.token, "Tagged", ["typescript"]);
    await createArticle(author.body.user.token, "Other", ["node"]);
    const response = await request(app).get("/api/articles?tag=typescript");
    expect(response.body.articles.map((article: { title: string }) => article.title)).toEqual(["Tagged"]);
  });

  it("lists articles matching an author filter", async () => {
    const author = await register("author");
    const other = await register("other");
    await createArticle(author.body.user.token, "Authored");
    await createArticle(other.body.user.token, "Other");
    const response = await request(app).get("/api/articles?author=author");
    expect(response.body.articles).toHaveLength(1);
    expect(response.body.articles[0].author.username).toBe("author");
  });

  it("lists articles favorited by a user", async () => {
    const author = await register("author");
    const reader = await register("reader");
    const created = await createArticle(author.body.user.token, "Favorite");
    await request(app).post(`/api/articles/${created.body.article.slug}/favorite`)
      .set("Authorization", `Token ${reader.body.user.token}`);
    const response = await request(app).get("/api/articles?favorited=reader");
    expect(response.body.articles).toHaveLength(1);
  });

  it("applies limit and offset pagination", async () => {
    const author = await register("author");
    await createArticle(author.body.user.token, "First");
    await createArticle(author.body.user.token, "Second");
    const response = await request(app).get("/api/articles?limit=1&offset=1");
    expect(response.body.articles).toHaveLength(1);
    expect(response.body.articlesCount).toBe(2);
  });

  it("returns a feed of followed authors without body fields", async () => {
    const author = await register("author");
    const reader = await register("reader");
    await createArticle(author.body.user.token, "Followed");
    await request(app).post("/api/profiles/author/follow")
      .set("Authorization", `Token ${reader.body.user.token}`);
    const response = await request(app).get("/api/articles/feed")
      .set("Authorization", `Token ${reader.body.user.token}`);
    expect(response.body.articles).toHaveLength(1);
    expect(response.body.articles[0].body).toBeUndefined();
  });

  it("returns a single article including its body", async () => {
    const author = await register("author");
    const created = await createArticle(author.body.user.token, "Single");
    const response = await request(app).get(`/api/articles/${created.body.article.slug}`);
    expect(response.body.article.body).toBe("Single body");
  });

  it("creates an article", async () => {
    const author = await register("author");
    const response = await createArticle(author.body.user.token, "Created");
    expect(response.status).toBe(201);
    expect(response.body.article.slug).toMatch(/^created-\d+$/);
  });

  it("updates an article", async () => {
    const author = await register("author");
    const created = await createArticle(author.body.user.token, "Original");
    const response = await request(app).put(`/api/articles/${created.body.article.slug}`)
      .set("Authorization", `Token ${author.body.user.token}`)
      .send({ article: { title: "Updated" } });
    expect(response.body.article.title).toBe("Updated");
  });

  it("returns 403 when a non-author deletes an article", async () => {
    const author = await register("author");
    const reader = await register("reader");
    const created = await createArticle(author.body.user.token, "Protected");
    const response = await request(app).delete(`/api/articles/${created.body.article.slug}`)
      .set("Authorization", `Token ${reader.body.user.token}`);
    expect(response.status).toBe(403);
  });

  it("deletes an article owned by the current user", async () => {
    const author = await register("author");
    const created = await createArticle(author.body.user.token, "Disposable");
    const response = await request(app).delete(`/api/articles/${created.body.article.slug}`)
      .set("Authorization", `Token ${author.body.user.token}`);
    expect(response.status).toBe(204);
  });

  it("favorites and unfavorites an article", async () => {
    const author = await register("author");
    const reader = await register("reader");
    const created = await createArticle(author.body.user.token, "Favorite");
    const favorite = await request(app).post(`/api/articles/${created.body.article.slug}/favorite`)
      .set("Authorization", `Token ${reader.body.user.token}`);
    expect(favorite.body.article.favorited).toBe(true);
    const unfavorite = await request(app).delete(`/api/articles/${created.body.article.slug}/favorite`)
      .set("Authorization", `Token ${reader.body.user.token}`);
    expect(unfavorite.body.article.favorited).toBe(false);
  });

  it.each([
    ["GET", "/api/articles/feed"],
    ["POST", "/api/articles"],
    ["PUT", "/api/articles/missing"],
    ["DELETE", "/api/articles/missing"],
    ["POST", "/api/articles/missing/favorite"],
    ["DELETE", "/api/articles/missing/favorite"]
  ])("returns 401 for unauthenticated %s %s", async (method, path) => {
    const response = await request(app)[method.toLowerCase() as "get"](path);
    expect(response.status).toBe(401);
  });
});
