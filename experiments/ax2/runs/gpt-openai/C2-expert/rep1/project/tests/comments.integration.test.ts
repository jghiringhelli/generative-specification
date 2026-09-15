import { PrismaClient } from "@prisma/client";
import request from "supertest";
import { createApp } from "../src/app";

const prisma = new PrismaClient();
const app = createApp({ prisma, jwtSecret: "comment-integration-secret" });

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
        title: "Commented article",
        description: "Description",
        body: "Body",
        tagList: []
      }
    });
  return response.body.article.slug;
}

async function addComment(token: string, slug: string, body = "A comment") {
  return request(app)
    .post(`/api/articles/${slug}/comments`)
    .set("Authorization", `Token ${token}`)
    .send({ comment: { body } });
}

describe("comment endpoints", () => {
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

  it("lists comments without authentication", async () => {
    const token = await register("alice");
    const slug = await createArticle(token);
    await addComment(token, slug);

    const response = await request(app).get(`/api/articles/${slug}/comments`);

    expect(response.status).toBe(200);
    expect(response.body.comments).toHaveLength(1);
    expect(response.body.comments[0]).toMatchObject({
      body: "A comment",
      author: {
        username: "alice",
        bio: null,
        image: null,
        following: false
      }
    });
  });

  it("adds a comment to an article", async () => {
    const token = await register("alice");
    const slug = await createArticle(token);

    const response = await addComment(token, slug, "Excellent article");

    expect(response.status).toBe(201);
    expect(response.body.comment.body).toBe("Excellent article");
    expect(response.body.comment.id).toEqual(expect.any(Number));
  });

  it("deletes the authenticated user's own comment", async () => {
    const token = await register("alice");
    const slug = await createArticle(token);
    const comment = await addComment(token, slug);

    const response = await request(app)
      .delete(`/api/articles/${slug}/comments/${comment.body.comment.id}`)
      .set("Authorization", `Token ${token}`);

    expect(response.status).toBe(204);
    await expect(prisma.comment.count()).resolves.toBe(0);
  });

  it("returns 403 when deleting another user's comment", async () => {
    const alice = await register("alice");
    const bob = await register("bob");
    const slug = await createArticle(alice);
    const comment = await addComment(alice, slug);

    const response = await request(app)
      .delete(`/api/articles/${slug}/comments/${comment.body.comment.id}`)
      .set("Authorization", `Token ${bob}`);

    expect(response.status).toBe(403);
  });

  it("returns 401 when adding a comment without authentication", async () => {
    const token = await register("alice");
    const slug = await createArticle(token);

    const response = await request(app)
      .post(`/api/articles/${slug}/comments`)
      .send({ comment: { body: "Unauthorized comment" } });

    expect(response.status).toBe(401);
  });

  it("returns 404 when commenting on a non-existent article", async () => {
    const token = await register("alice");

    const response = await addComment(token, "missing-article");

    expect(response.status).toBe(404);
  });
});
