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

beforeEach(async () => {
  await prisma.follow.deleteMany();
  await prisma.user.deleteMany();
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe("profile endpoints", () => {
  it("returns a profile to an unauthenticated visitor", async () => {
    await register("author");
    const response = await request(app).get("/api/profiles/author");
    expect(response.status).toBe(200);
    expect(response.body.profile).toMatchObject({ username: "author", following: false });
  });

  it("returns an authenticated visitor's following status", async () => {
    const reader = await register("reader");
    await register("author");
    const response = await request(app)
      .get("/api/profiles/author")
      .set("Authorization", `Token ${reader.body.user.token}`);
    expect(response.status).toBe(200);
    expect(response.body.profile.following).toBe(false);
  });

  it("follows a user", async () => {
    const reader = await register("reader");
    await register("author");
    const response = await request(app)
      .post("/api/profiles/author/follow")
      .set("Authorization", `Token ${reader.body.user.token}`);
    expect(response.status).toBe(200);
    expect(response.body.profile.following).toBe(true);
  });

  it("unfollows a user", async () => {
    const reader = await register("reader");
    await register("author");
    await request(app)
      .post("/api/profiles/author/follow")
      .set("Authorization", `Token ${reader.body.user.token}`);
    const response = await request(app)
      .delete("/api/profiles/author/follow")
      .set("Authorization", `Token ${reader.body.user.token}`);
    expect(response.status).toBe(200);
    expect(response.body.profile.following).toBe(false);
  });

  it("returns 404 when profile does not exist", async () => {
    const response = await request(app).get("/api/profiles/missing");
    expect(response.status).toBe(404);
  });

  it("returns 401 when following without authentication", async () => {
    await register("author");
    const response = await request(app).post("/api/profiles/author/follow");
    expect(response.status).toBe(401);
  });
});
