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

async function createArticle(token: string) {
  return request(app).post("/api/articles").set("Authorization", `Token ${token}`).send({
    article: { title: "Discussable", description: "Description", body: "Body" }
  });
}

async function addComment(slug: string, token: string, body = "Insightful") {
  return request(app).post(`/api/articles/${slug}/comments`)
    .set("Authorization", `Token ${token}`)
    .send({ comment: { body } });
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

describe("comment endpoints", () => {
  it("lists comments for an unauthenticated visitor", async () => {
    const author = await register("author");
    const article = await createArticle(author.body.user.token);
    await addComment(article.body.article.slug, author.body.user.token);
    const response = await request(app).get(`/api/articles/${article.body.article.slug}/comments`);
    expect(response.status).toBe(200);
    expect(response.body.comments[0]).toMatchObject({
      body: "Insightful",
      author: { username: "author", following: false }
    });
  });

  it("adds a comment successfully", async () => {
    const author = await register("author");
    const article = await createArticle(author.body.user.token);
    const response = await addComment(article.body.article.slug, author.body.user.token);
    expect(response.status).toBe(201);
    expect(response.body.comment.body).toBe("Insightful");
  });

  it("deletes the current user's comment", async () => {
    const author = await register("author");
    const article = await createArticle(author.body.user.token);
    const comment = await addComment(article.body.article.slug, author.body.user.token);
    const response = await request(app)
      .delete(`/api/articles/${article.body.article.slug}/comments/${comment.body.comment.id}`)
      .set("Authorization", `Token ${author.body.user.token}`);
    expect(response.status).toBe(204);
  });

  it("returns 403 when deleting another user's comment", async () => {
    const author = await register("author");
    const reader = await register("reader");
    const article = await createArticle(author.body.user.token);
    const comment = await addComment(article.body.article.slug, author.body.user.token);
    const response = await request(app)
      .delete(`/api/articles/${article.body.article.slug}/comments/${comment.body.comment.id}`)
      .set("Authorization", `Token ${reader.body.user.token}`);
    expect(response.status).toBe(403);
  });

  it("returns 401 when adding a comment without authentication", async () => {
    const author = await register("author");
    const article = await createArticle(author.body.user.token);
    const response = await request(app)
      .post(`/api/articles/${article.body.article.slug}/comments`)
      .send({ comment: { body: "Anonymous" } });
    expect(response.status).toBe(401);
  });

  it("returns 404 when commenting on a non-existent article", async () => {
    const author = await register("author");
    const response = await addComment("missing", author.body.user.token);
    expect(response.status).toBe(404);
  });
});
