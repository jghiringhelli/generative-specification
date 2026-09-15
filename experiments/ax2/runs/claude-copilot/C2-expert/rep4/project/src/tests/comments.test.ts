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
 * Create an article and return its slug.
 * @param author The authenticated author.
 * @returns The created article slug.
 */
async function createArticleSlug(author: TestUser): Promise<string> {
  const res = await request(app)
    .post("/api/articles")
    .set("Authorization", authHeader(author.token))
    .send({
      article: {
        title: "Commentable Article",
        description: "desc",
        body: "body",
        tagList: [],
      },
    });
  return res.body.article.slug;
}

describe("GET /api/articles/:slug/comments", () => {
  it("lists comments for an unauthenticated viewer", async () => {
    const author = await registerUser(app);
    const slug = await createArticleSlug(author);
    await request(app)
      .post(`/api/articles/${slug}/comments`)
      .set("Authorization", authHeader(author.token))
      .send({ comment: { body: "First!" } });
    const res = await request(app).get(`/api/articles/${slug}/comments`);
    expect(res.status).toBe(200);
    expect(res.body.comments.length).toBe(1);
    expect(res.body.comments[0].body).toBe("First!");
  });

  it("returns 404 when listing comments on a non-existent article", async () => {
    const res = await request(app).get("/api/articles/ghost/comments");
    expect(res.status).toBe(404);
  });
});

describe("POST /api/articles/:slug/comments", () => {
  it("adds a comment with the author profile", async () => {
    const author = await registerUser(app);
    const slug = await createArticleSlug(author);
    const res = await request(app)
      .post(`/api/articles/${slug}/comments`)
      .set("Authorization", authHeader(author.token))
      .send({ comment: { body: "Nice article" } });
    expect(res.status).toBe(201);
    expect(res.body.comment.body).toBe("Nice article");
    expect(res.body.comment.author.username).toBe(author.username);
  });

  it("returns 401 when commenting without auth", async () => {
    const author = await registerUser(app);
    const slug = await createArticleSlug(author);
    const res = await request(app)
      .post(`/api/articles/${slug}/comments`)
      .send({ comment: { body: "no auth" } });
    expect(res.status).toBe(401);
  });

  it("returns 404 when commenting on a non-existent article", async () => {
    const author = await registerUser(app);
    const res = await request(app)
      .post("/api/articles/ghost/comments")
      .set("Authorization", authHeader(author.token))
      .send({ comment: { body: "hi" } });
    expect(res.status).toBe(404);
  });
});

describe("DELETE /api/articles/:slug/comments/:id", () => {
  it("deletes a comment authored by the requester", async () => {
    const author = await registerUser(app);
    const slug = await createArticleSlug(author);
    const created = await request(app)
      .post(`/api/articles/${slug}/comments`)
      .set("Authorization", authHeader(author.token))
      .send({ comment: { body: "delete me" } });
    const res = await request(app)
      .delete(`/api/articles/${slug}/comments/${created.body.comment.id}`)
      .set("Authorization", authHeader(author.token));
    expect(res.status).toBe(200);
  });

  it("returns 403 when deleting another user's comment", async () => {
    const author = await registerUser(app);
    const intruder = await registerUser(app);
    const slug = await createArticleSlug(author);
    const created = await request(app)
      .post(`/api/articles/${slug}/comments`)
      .set("Authorization", authHeader(author.token))
      .send({ comment: { body: "mine" } });
    const res = await request(app)
      .delete(`/api/articles/${slug}/comments/${created.body.comment.id}`)
      .set("Authorization", authHeader(intruder.token));
    expect(res.status).toBe(403);
  });
});
