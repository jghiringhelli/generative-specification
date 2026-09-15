import { PrismaClient } from "@prisma/client";
import request from "supertest";
import { createApp } from "../src/app";

const prisma = new PrismaClient();
const app = createApp({ prisma, jwtSecret: "tag-integration-secret" });

async function register(): Promise<string> {
  const response = await request(app).post("/api/users").send({
    user: {
      username: "alice",
      email: "alice@example.com",
      password: "password123"
    }
  });
  return response.body.user.token;
}

async function createArticle(token: string, title: string, tagList: string[]): Promise<void> {
  await request(app)
    .post("/api/articles")
    .set("Authorization", `Token ${token}`)
    .send({
      article: { title, description: "Description", body: "Body", tagList }
    });
}

describe("tag endpoints", () => {
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

  it("lists an empty array when no articles or tags exist", async () => {
    const response = await request(app).get("/api/tags");

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ tags: [] });
  });

  it("lists unique tags after articles are created", async () => {
    const token = await register();
    await createArticle(token, "First", ["typescript", "api"]);
    await createArticle(token, "Second", ["typescript", "postgres"]);

    const response = await request(app).get("/api/tags");

    expect(response.status).toBe(200);
    expect(response.body.tags).toEqual(["api", "postgres", "typescript"]);
  });

  it("filters articles against persisted tags", async () => {
    const token = await register();
    await createArticle(token, "TypeScript article", ["typescript"]);
    await createArticle(token, "Database article", ["postgres"]);

    const response = await request(app).get("/api/articles?tag=postgres");

    expect(response.body.articlesCount).toBe(1);
    expect(response.body.articles[0].title).toBe("Database article");
  });
});
