import { PrismaClient } from "@prisma/client";
import request from "supertest";
import { createApp } from "../src/app";

const prisma = new PrismaClient();
const app = createApp({ prisma, jwtSecret: "error-path-secret" });

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

async function createArticle(token: string): Promise<string> {
  const response = await request(app)
    .post("/api/articles")
    .set("Authorization", `Token ${token}`)
    .send({
      article: {
        title: "Error paths",
        description: "Description",
        body: "Body",
        tagList: []
      }
    });
  return response.body.article.slug;
}

describe("endpoint error paths", () => {
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

  it("returns 422 when registration input is invalid", async () => {
    const response = await request(app).post("/api/users").send({
      user: { username: "", email: "invalid", password: "short" }
    });

    expect(response.status).toBe(422);
    expect(response.body.errors.body).toEqual(expect.any(Array));
  });

  it("returns 401 when updating a user without authentication", async () => {
    const response = await request(app).put("/api/user").send({
      user: { bio: "Unauthorized" }
    });

    expect(response.status).toBe(401);
  });

  it("returns 422 when updating to another user's email", async () => {
    const alice = await register("alice");
    await register("bob");

    const response = await request(app)
      .put("/api/user")
      .set("Authorization", `Token ${alice}`)
      .send({ user: { email: "bob@example.com" } });

    expect(response.status).toBe(422);
  });

  it("returns 401 when unfollowing without authentication", async () => {
    await register("alice");

    const response = await request(app).delete("/api/profiles/alice/follow");

    expect(response.status).toBe(401);
  });

  it("returns 404 when following a profile that does not exist", async () => {
    const token = await register("alice");

    const response = await request(app)
      .post("/api/profiles/missing/follow")
      .set("Authorization", `Token ${token}`);

    expect(response.status).toBe(404);
  });

  it("returns 404 when getting an article that does not exist", async () => {
    const response = await request(app).get("/api/articles/missing");

    expect(response.status).toBe(404);
  });

  it("returns 422 when creating an article with invalid input", async () => {
    const token = await register("alice");

    const response = await request(app)
      .post("/api/articles")
      .set("Authorization", `Token ${token}`)
      .send({ article: { title: "", description: "", body: "" } });

    expect(response.status).toBe(422);
  });

  it("returns 403 when a non-author updates an article", async () => {
    const alice = await register("alice");
    const bob = await register("bob");
    const slug = await createArticle(alice);

    const response = await request(app)
      .put(`/api/articles/${slug}`)
      .set("Authorization", `Token ${bob}`)
      .send({ article: { title: "Not allowed" } });

    expect(response.status).toBe(403);
  });

  it.each([
    ["updates", "put", "/api/articles/missing", { article: { title: "Missing" } }],
    ["deletes", "delete", "/api/articles/missing", undefined],
    ["favorites", "post", "/api/articles/missing/favorite", undefined],
    ["unfavorites", "delete", "/api/articles/missing/favorite", undefined]
  ])(
    "returns 404 when an authenticated user %s a missing article",
    async (_behavior, method, path, body) => {
      const token = await register("alice");
      const response = await request(app)[method as "get"](path)
        .set("Authorization", `Token ${token}`)
        .send(body);

      expect(response.status).toBe(404);
    }
  );

  it("returns 404 when listing comments for a missing article", async () => {
    const response = await request(app).get("/api/articles/missing/comments");

    expect(response.status).toBe(404);
  });

  it("returns 422 when adding an empty comment", async () => {
    const token = await register("alice");
    const slug = await createArticle(token);

    const response = await request(app)
      .post(`/api/articles/${slug}/comments`)
      .set("Authorization", `Token ${token}`)
      .send({ comment: { body: "" } });

    expect(response.status).toBe(422);
  });

  it("returns 401 when deleting a comment without authentication", async () => {
    const token = await register("alice");
    const slug = await createArticle(token);

    const response = await request(app).delete(`/api/articles/${slug}/comments/1`);

    expect(response.status).toBe(401);
  });

  it("returns 404 when deleting a comment that does not exist", async () => {
    const token = await register("alice");
    const slug = await createArticle(token);

    const response = await request(app)
      .delete(`/api/articles/${slug}/comments/999`)
      .set("Authorization", `Token ${token}`);

    expect(response.status).toBe(404);
  });
});
