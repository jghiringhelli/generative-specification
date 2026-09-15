import request from "supertest";
import { Express } from "express";
import { prisma } from "../lib/prisma";
import {
  TestUser,
  authHeader,
  registerUser,
  resetDatabase,
  testApp,
} from "./helpers";

let app: Express;

beforeAll(() => {
  app = testApp();
});

beforeEach(async () => {
  await resetDatabase();
});

afterAll(async () => {
  await prisma.$disconnect();
});

/**
 * Create an article through the HTTP API.
 * @param author The authenticated author.
 * @param overrides Optional article field overrides.
 * @returns The created article response body's `article`.
 */
async function createArticle(
  author: TestUser,
  overrides: Partial<{
    title: string;
    description: string;
    body: string;
    tagList: string[];
  }> = {},
): Promise<Record<string, unknown>> {
  const res = await request(app)
    .post("/api/articles")
    .set("Authorization", authHeader(author.token))
    .send({
      article: {
        title: overrides.title ?? "How to Train Dragons",
        description: overrides.description ?? "An intro",
        body: overrides.body ?? "You have to believe",
        tagList: overrides.tagList ?? ["dragons", "training"],
      },
    });
  return res.body.article;
}

describe("POST /api/articles", () => {
  it("creates an article and returns it with a slug", async () => {
    const author = await registerUser(app);
    const res = await request(app)
      .post("/api/articles")
      .set("Authorization", authHeader(author.token))
      .send({
        article: {
          title: "My First Post",
          description: "desc",
          body: "content",
          tagList: ["intro"],
        },
      });
    expect(res.status).toBe(201);
    expect(res.body.article.slug).toContain("my-first-post");
    expect(res.body.article.tagList).toEqual(["intro"]);
  });

  it("returns 401 when creating without auth", async () => {
    const res = await request(app)
      .post("/api/articles")
      .send({ article: { title: "x", description: "y", body: "z" } });
    expect(res.status).toBe(401);
  });

  it("returns 422 when required fields are missing", async () => {
    const author = await registerUser(app);
    const res = await request(app)
      .post("/api/articles")
      .set("Authorization", authHeader(author.token))
      .send({ article: { title: "only title" } });
    expect(res.status).toBe(422);
  });
});

describe("GET /api/articles", () => {
  it("lists articles without a body field in list items", async () => {
    const author = await registerUser(app);
    await createArticle(author);
    const res = await request(app).get("/api/articles");
    expect(res.status).toBe(200);
    expect(res.body.articlesCount).toBe(1);
    expect(res.body.articles[0].body).toBeUndefined();
  });

  it("filters articles by tag", async () => {
    const author = await registerUser(app);
    await createArticle(author, { title: "Tagged", tagList: ["special"] });
    await createArticle(author, { title: "Other", tagList: ["plain"] });
    const res = await request(app).get("/api/articles?tag=special");
    expect(res.status).toBe(200);
    expect(res.body.articlesCount).toBe(1);
    expect(res.body.articles[0].tagList).toContain("special");
  });

  it("filters articles by author", async () => {
    const author = await registerUser(app, { username: "writer" });
    const other = await registerUser(app, { username: "other" });
    await createArticle(author);
    await createArticle(other, { title: "Other Post" });
    const res = await request(app).get("/api/articles?author=writer");
    expect(res.status).toBe(200);
    expect(res.body.articlesCount).toBe(1);
    expect(res.body.articles[0].author.username).toBe("writer");
  });

  it("filters articles by favorited username", async () => {
    const author = await registerUser(app);
    const fan = await registerUser(app, { username: "fan" });
    const article = await createArticle(author);
    await request(app)
      .post(`/api/articles/${article.slug}/favorite`)
      .set("Authorization", authHeader(fan.token));
    const res = await request(app).get("/api/articles?favorited=fan");
    expect(res.status).toBe(200);
    expect(res.body.articlesCount).toBe(1);
  });

  it("applies limit and offset pagination", async () => {
    const author = await registerUser(app);
    await createArticle(author, { title: "One" });
    await createArticle(author, { title: "Two" });
    await createArticle(author, { title: "Three" });
    const res = await request(app).get("/api/articles?limit=1&offset=1");
    expect(res.status).toBe(200);
    expect(res.body.articles.length).toBe(1);
    expect(res.body.articlesCount).toBe(3);
  });

  it("returns 422 when offset is negative", async () => {
    const res = await request(app).get("/api/articles?offset=-1");
    expect(res.status).toBe(422);
  });
});

describe("GET /api/articles/feed", () => {
  it("returns articles from followed authors", async () => {
    const author = await registerUser(app, { username: "followed" });
    const follower = await registerUser(app);
    await createArticle(author);
    await request(app)
      .post(`/api/profiles/${author.username}/follow`)
      .set("Authorization", authHeader(follower.token));
    const res = await request(app)
      .get("/api/articles/feed")
      .set("Authorization", authHeader(follower.token));
    expect(res.status).toBe(200);
    expect(res.body.articlesCount).toBe(1);
    expect(res.body.articles[0].body).toBeUndefined();
  });

  it("returns 401 when requesting the feed without auth", async () => {
    const res = await request(app).get("/api/articles/feed");
    expect(res.status).toBe(401);
  });
});

describe("GET /api/articles/:slug", () => {
  it("returns a single article including its body", async () => {
    const author = await registerUser(app);
    const article = await createArticle(author);
    const res = await request(app).get(`/api/articles/${article.slug}`);
    expect(res.status).toBe(200);
    expect(res.body.article.body).toBe("You have to believe");
  });

  it("returns 404 for an unknown slug", async () => {
    const res = await request(app).get("/api/articles/does-not-exist");
    expect(res.status).toBe(404);
  });
});

describe("PUT /api/articles/:slug", () => {
  it("updates an article for its author", async () => {
    const author = await registerUser(app);
    const article = await createArticle(author);
    const res = await request(app)
      .put(`/api/articles/${article.slug}`)
      .set("Authorization", authHeader(author.token))
      .send({ article: { title: "Updated Title" } });
    expect(res.status).toBe(200);
    expect(res.body.article.title).toBe("Updated Title");
  });

  it("returns 403 when a non-author updates the article", async () => {
    const author = await registerUser(app);
    const intruder = await registerUser(app);
    const article = await createArticle(author);
    const res = await request(app)
      .put(`/api/articles/${article.slug}`)
      .set("Authorization", authHeader(intruder.token))
      .send({ article: { title: "Hijacked" } });
    expect(res.status).toBe(403);
  });

  it("returns 401 when updating without auth", async () => {
    const author = await registerUser(app);
    const article = await createArticle(author);
    const res = await request(app)
      .put(`/api/articles/${article.slug}`)
      .send({ article: { title: "nope" } });
    expect(res.status).toBe(401);
  });
});

describe("DELETE /api/articles/:slug", () => {
  it("deletes an article for its author", async () => {
    const author = await registerUser(app);
    const article = await createArticle(author);
    const res = await request(app)
      .delete(`/api/articles/${article.slug}`)
      .set("Authorization", authHeader(author.token));
    expect(res.status).toBe(200);
  });

  it("returns 403 when a non-author deletes the article", async () => {
    const author = await registerUser(app);
    const intruder = await registerUser(app);
    const article = await createArticle(author);
    const res = await request(app)
      .delete(`/api/articles/${article.slug}`)
      .set("Authorization", authHeader(intruder.token));
    expect(res.status).toBe(403);
  });

  it("returns 401 when deleting without auth", async () => {
    const author = await registerUser(app);
    const article = await createArticle(author);
    const res = await request(app).delete(`/api/articles/${article.slug}`);
    expect(res.status).toBe(401);
  });
});

describe("Article favoriting", () => {
  it("favorites and unfavorites an article", async () => {
    const author = await registerUser(app);
    const fan = await registerUser(app);
    const article = await createArticle(author);
    const favorited = await request(app)
      .post(`/api/articles/${article.slug}/favorite`)
      .set("Authorization", authHeader(fan.token));
    expect(favorited.status).toBe(200);
    expect(favorited.body.article.favorited).toBe(true);
    expect(favorited.body.article.favoritesCount).toBe(1);

    const unfavorited = await request(app)
      .delete(`/api/articles/${article.slug}/favorite`)
      .set("Authorization", authHeader(fan.token));
    expect(unfavorited.status).toBe(200);
    expect(unfavorited.body.article.favorited).toBe(false);
    expect(unfavorited.body.article.favoritesCount).toBe(0);
  });

  it("returns 401 when favoriting without auth", async () => {
    const author = await registerUser(app);
    const article = await createArticle(author);
    const res = await request(app).post(
      `/api/articles/${article.slug}/favorite`,
    );
    expect(res.status).toBe(401);
  });
});
