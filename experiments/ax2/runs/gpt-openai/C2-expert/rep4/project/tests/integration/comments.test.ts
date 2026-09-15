import request from "supertest";
import { createApp } from "../../src/app";
import { prisma } from "../../src/infrastructure/prisma";

const app = createApp({ jwtSecret: "integration-secret", port: 3000 });

async function register(username: string) {
  return request(app).post("/api/users").send({
    user: { email: `${username}@example.com`, username, password: "password123" }
  });
}

async function createArticle(token: string) {
  return request(app).post("/api/articles").set("Authorization", `Token ${token}`).send({
    article: { title: "Comments", description: "Discussion", body: "Body", tagList: [] }
  });
}

describe("comment endpoints", () => {
  beforeEach(async () => {
    await prisma.comment.deleteMany();
    await prisma.article.deleteMany();
    await prisma.user.deleteMany();
  });

  afterAll(async () => prisma.$disconnect());

  it("lists comments without authentication", async () => {
    const alice = await register("alice");
    const created = await createArticle(alice.body.user.token);
    await request(app)
      .post(`/api/articles/${created.body.article.slug}/comments`)
      .set("Authorization", `Token ${alice.body.user.token}`)
      .send({ comment: { body: "Hello" } });
    const response = await request(app).get(`/api/articles/${created.body.article.slug}/comments`);
    expect(response.status).toBe(200);
    expect(response.body.comments[0].body).toBe("Hello");
  });

  it("adds a comment to an article", async () => {
    const alice = await register("alice");
    const created = await createArticle(alice.body.user.token);
    const response = await request(app)
      .post(`/api/articles/${created.body.article.slug}/comments`)
      .set("Authorization", `Token ${alice.body.user.token}`)
      .send({ comment: { body: "Hello" } });
    expect(response.status).toBe(201);
    expect(response.body.comment.author.username).toBe("alice");
  });

  it("deletes the current user's comment", async () => {
    const alice = await register("alice");
    const created = await createArticle(alice.body.user.token);
    const comment = await request(app)
      .post(`/api/articles/${created.body.article.slug}/comments`)
      .set("Authorization", `Token ${alice.body.user.token}`)
      .send({ comment: { body: "Delete me" } });
    const response = await request(app)
      .delete(`/api/articles/${created.body.article.slug}/comments/${comment.body.comment.id}`)
      .set("Authorization", `Token ${alice.body.user.token}`);
    expect(response.status).toBe(204);
  });

  it("returns 403 when deleting another user's comment", async () => {
    const alice = await register("alice");
    const bob = await register("bob");
    const created = await createArticle(alice.body.user.token);
    const comment = await request(app)
      .post(`/api/articles/${created.body.article.slug}/comments`)
      .set("Authorization", `Token ${alice.body.user.token}`)
      .send({ comment: { body: "Protected" } });
    const response = await request(app)
      .delete(`/api/articles/${created.body.article.slug}/comments/${comment.body.comment.id}`)
      .set("Authorization", `Token ${bob.body.user.token}`);
    expect(response.status).toBe(403);
  });

  it("returns 401 when adding a comment without authentication", async () => {
    const alice = await register("alice");
    const created = await createArticle(alice.body.user.token);
    const response = await request(app)
      .post(`/api/articles/${created.body.article.slug}/comments`)
      .send({ comment: { body: "Unauthorized" } });
    expect(response.status).toBe(401);
  });

  it("returns 404 when commenting on a non-existent article", async () => {
    const alice = await register("alice");
    const response = await request(app)
      .post("/api/articles/missing/comments")
      .set("Authorization", `Token ${alice.body.user.token}`)
      .send({ comment: { body: "Nowhere" } });
    expect(response.status).toBe(404);
  });

  it("returns 404 when listing comments for a non-existent article", async () => {
    const response = await request(app).get("/api/articles/missing/comments");
    expect(response.status).toBe(404);
  });

  it("returns 401 when deleting a comment without authentication", async () => {
    const response = await request(app).delete("/api/articles/missing/comments/1");
    expect(response.status).toBe(401);
  });

  it("returns 422 when a comment body is empty", async () => {
    const alice = await register("alice");
    const created = await createArticle(alice.body.user.token);
    const response = await request(app)
      .post(`/api/articles/${created.body.article.slug}/comments`)
      .set("Authorization", `Token ${alice.body.user.token}`)
      .send({ comment: { body: "" } });
    expect(response.status).toBe(422);
  });
});
