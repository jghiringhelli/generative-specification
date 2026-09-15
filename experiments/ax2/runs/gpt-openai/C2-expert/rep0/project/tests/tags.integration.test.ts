import { PrismaClient } from "@prisma/client";
import request from "supertest";
import { createApp } from "../src/app";

const prisma = new PrismaClient();
const app = createApp(prisma, { jwtSecret: "integration-secret", port: 3000 });

async function register() {
  return request(app).post("/api/users").send({
    user: { username: "author", email: "author@example.com", password: "secure-password" }
  });
}

async function createArticle(token: string, title: string, tagList: string[]) {
  return request(app).post("/api/articles").set("Authorization", `Token ${token}`).send({
    article: { title, description: "Description", body: "Body", tagList }
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

describe("tag endpoints", () => {
  it("returns an empty array when no articles exist", async () => {
    const response = await request(app).get("/api/tags");
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ tags: [] });
  });

  it("lists unique tags after articles are created", async () => {
    const author = await register();
    await createArticle(author.body.user.token, "First", ["typescript", "api"]);
    await createArticle(author.body.user.token, "Second", ["api", "testing"]);
    const response = await request(app).get("/api/tags");
    expect(response.body.tags).toEqual(["api", "testing", "typescript"]);
  });

  it("filters articles against persisted tags", async () => {
    const author = await register();
    await createArticle(author.body.user.token, "TypeScript", ["typescript"]);
    await createArticle(author.body.user.token, "Node", ["node"]);
    const response = await request(app).get("/api/articles?tag=typescript");
    expect(response.body.articles).toHaveLength(1);
    expect(response.body.articles[0].tagList).toEqual(["typescript"]);
  });

  it("persists and returns tags when an article is updated", async () => {
    const author = await register();
    const created = await createArticle(author.body.user.token, "Original", ["old"]);
    const response = await request(app)
      .put(`/api/articles/${created.body.article.slug}`)
      .set("Authorization", `Token ${author.body.user.token}`)
      .send({ article: { tagList: ["new"] } });
    expect(response.body.article.tagList).toEqual(["new"]);
  });
});
