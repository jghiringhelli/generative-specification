import request from "supertest";
import { Express } from "express";
import { prisma } from "../lib/prisma";
import { authHeader, registerUser, resetDatabase, testApp } from "./helpers";

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

describe("GET /api/tags", () => {
  it("returns an empty array when no articles exist", async () => {
    const res = await request(app).get("/api/tags");
    expect(res.status).toBe(200);
    expect(res.body.tags).toEqual([]);
  });

  it("returns the unique tags after articles are created", async () => {
    const author = await registerUser(app);
    await request(app)
      .post("/api/articles")
      .set("Authorization", authHeader(author.token))
      .send({
        article: {
          title: "First",
          description: "d",
          body: "b",
          tagList: ["alpha", "beta"],
        },
      });
    await request(app)
      .post("/api/articles")
      .set("Authorization", authHeader(author.token))
      .send({
        article: {
          title: "Second",
          description: "d",
          body: "b",
          tagList: ["beta", "gamma"],
        },
      });
    const res = await request(app).get("/api/tags");
    expect(res.status).toBe(200);
    expect(res.body.tags.sort()).toEqual(["alpha", "beta", "gamma"]);
  });

  it("filters articles by a persisted tag", async () => {
    const author = await registerUser(app);
    await request(app)
      .post("/api/articles")
      .set("Authorization", authHeader(author.token))
      .send({
        article: {
          title: "Tagged",
          description: "d",
          body: "b",
          tagList: ["findme"],
        },
      });
    const res = await request(app).get("/api/articles?tag=findme");
    expect(res.status).toBe(200);
    expect(res.body.articlesCount).toBe(1);
    expect(res.body.articles[0].tagList).toContain("findme");
  });
});
