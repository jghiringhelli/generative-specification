import request from "supertest";
import { createApp } from "../../src/app";
import { prisma } from "../../src/infrastructure/prisma";

const app = createApp({ jwtSecret: "integration-secret", port: 3000 });

async function createUserAndArticle(tags: string[]) {
  const user = await request(app).post("/api/users").send({
    user: { email: "alice@example.com", username: "alice", password: "password123" }
  });
  return request(app)
    .post("/api/articles")
    .set("Authorization", `Token ${user.body.user.token}`)
    .send({ article: { title: "Tagged", description: "Tags", body: "Body", tagList: tags } });
}

describe("tag endpoint", () => {
  beforeEach(async () => {
    await prisma.article.deleteMany();
    await prisma.user.deleteMany();
    await prisma.tag.deleteMany();
  });

  afterAll(async () => prisma.$disconnect());

  it("returns an empty array when no articles exist", async () => {
    const response = await request(app).get("/api/tags");
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ tags: [] });
  });

  it("lists unique tags from created articles", async () => {
    await createUserAndArticle(["typescript", "express", "typescript"]);
    const response = await request(app).get("/api/tags");
    expect(response.body.tags).toEqual(["express", "typescript"]);
  });

  it("filters articles using a persisted tag", async () => {
    await createUserAndArticle(["typescript"]);
    const response = await request(app).get("/api/articles?tag=typescript");
    expect(response.body.articlesCount).toBe(1);
    expect(response.body.articles[0].tagList).toEqual(["typescript"]);
  });
});
