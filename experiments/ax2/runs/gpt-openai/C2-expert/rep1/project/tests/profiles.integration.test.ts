import { PrismaClient } from "@prisma/client";
import request from "supertest";
import { createApp } from "../src/app";

const prisma = new PrismaClient();
const JWT_SECRET = "profile-integration-secret";
const app = createApp({ prisma, jwtSecret: JWT_SECRET });

async function register(username: string, email: string): Promise<string> {
  const response = await request(app).post("/api/users").send({
    user: { username, email, password: "password123" }
  });
  return response.body.user.token;
}

describe("profile endpoints", () => {
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

  it("gets a profile without authentication", async () => {
    await register("alice", "alice@example.com");

    const response = await request(app).get("/api/profiles/alice");

    expect(response.status).toBe(200);
    expect(response.body.profile).toEqual({
      username: "alice",
      bio: null,
      image: null,
      following: false
    });
  });

  it("gets a profile with authenticated following status", async () => {
    const aliceToken = await register("alice", "alice@example.com");
    await register("bob", "bob@example.com");
    await request(app)
      .post("/api/profiles/bob/follow")
      .set("Authorization", `Token ${aliceToken}`);

    const response = await request(app)
      .get("/api/profiles/bob")
      .set("Authorization", `Token ${aliceToken}`);

    expect(response.status).toBe(200);
    expect(response.body.profile.following).toBe(true);
  });

  it("follows a user idempotently", async () => {
    const token = await register("alice", "alice@example.com");
    await register("bob", "bob@example.com");

    await request(app)
      .post("/api/profiles/bob/follow")
      .set("Authorization", `Token ${token}`);
    const response = await request(app)
      .post("/api/profiles/bob/follow")
      .set("Authorization", `Token ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.profile.following).toBe(true);
  });

  it("unfollows a user idempotently", async () => {
    const token = await register("alice", "alice@example.com");
    await register("bob", "bob@example.com");

    const response = await request(app)
      .delete("/api/profiles/bob/follow")
      .set("Authorization", `Token ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.profile.following).toBe(false);
  });

  it("returns 404 when profile does not exist", async () => {
    const response = await request(app).get("/api/profiles/missing");

    expect(response.status).toBe(404);
  });

  it("returns 401 when following without authentication", async () => {
    await register("bob", "bob@example.com");

    const response = await request(app).post("/api/profiles/bob/follow");

    expect(response.status).toBe(401);
  });
});
