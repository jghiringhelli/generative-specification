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
    article: { title: "Article", description: "Description", body: "Body" }
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

describe("endpoint error paths", () => {
  it("returns 422 in the API error shape for invalid registration input", async () => {
    const response = await request(app).post("/api/users").send({
      user: { username: "", email: "invalid", password: "" }
    });
    expect(response.status).toBe(422);
    expect(response.body).toEqual({ errors: { body: expect.any(Array) } });
  });

  it("returns 422 when article pagination is negative", async () => {
    const response = await request(app).get("/api/articles?limit=-1");
    expect(response.status).toBe(422);
    expect(response.body).toEqual({ errors: { body: expect.any(Array) } });
  });

  it("returns 404 when an article does not exist", async () => {
    const response = await request(app).get("/api/articles/missing");
    expect(response.status).toBe(404);
  });

  it("returns 403 when a non-author updates an article", async () => {
    const author = await register("author");
    const reader = await register("reader");
    const article = await createArticle(author.body.user.token);
    const response = await request(app).put(`/api/articles/${article.body.article.slug}`)
      .set("Authorization", `Token ${reader.body.user.token}`)
      .send({ article: { title: "Stolen" } });
    expect(response.status).toBe(403);
  });

  it("returns 404 when following a profile that does not exist", async () => {
    const reader = await register("reader");
    const response = await request(app).post("/api/profiles/missing/follow")
      .set("Authorization", `Token ${reader.body.user.token}`);
    expect(response.status).toBe(404);
  });

  it("returns 401 when deleting a comment without authentication", async () => {
    const response = await request(app).delete("/api/articles/missing/comments/1");
    expect(response.status).toBe(401);
  });

  it("returns 404 when deleting a comment that does not exist", async () => {
    const author = await register("author");
    const article = await createArticle(author.body.user.token);
    const response = await request(app)
      .delete(`/api/articles/${article.body.article.slug}/comments/999`)
      .set("Authorization", `Token ${author.body.user.token}`);
    expect(response.status).toBe(404);
  });

  it("returns 422 when updating a user with an empty body", async () => {
    const reader = await register("reader");
    const response = await request(app).put("/api/user")
      .set("Authorization", `Token ${reader.body.user.token}`)
      .send({ user: {} });
    expect(response.status).toBe(422);
  });
});
