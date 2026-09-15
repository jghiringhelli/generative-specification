import request from "supertest";
import { createApp } from "../../src/app";
import { prisma } from "../../src/infrastructure/prisma";

const app = createApp({ jwtSecret: "integration-secret", port: 3000 });

async function register(email: string, username: string) {
  return request(app).post("/api/users").send({
    user: { email, username, password: "password123" }
  });
}

describe("profile endpoints", () => {
  beforeEach(async () => {
    await prisma.follow.deleteMany();
    await prisma.user.deleteMany();
  });

  afterAll(async () => prisma.$disconnect());

  it("gets a profile without authentication", async () => {
    await register("alice@example.com", "alice");
    const response = await request(app).get("/api/profiles/alice");
    expect(response.status).toBe(200);
    expect(response.body.profile).toEqual({
      username: "alice", bio: null, image: null, following: false
    });
  });

  it("reports following status for an authenticated viewer", async () => {
    const alice = await register("alice@example.com", "alice");
    await register("bob@example.com", "bob");
    await request(app)
      .post("/api/profiles/bob/follow")
      .set("Authorization", `Token ${alice.body.user.token}`);
    const response = await request(app)
      .get("/api/profiles/bob")
      .set("Authorization", `Token ${alice.body.user.token}`);
    expect(response.body.profile.following).toBe(true);
  });

  it("follows a user", async () => {
    const alice = await register("alice@example.com", "alice");
    await register("bob@example.com", "bob");
    const response = await request(app)
      .post("/api/profiles/bob/follow")
      .set("Authorization", `Token ${alice.body.user.token}`);
    expect(response.status).toBe(200);
    expect(response.body.profile.following).toBe(true);
  });

  it("unfollows a user", async () => {
    const alice = await register("alice@example.com", "alice");
    await register("bob@example.com", "bob");
    const authorization = `Token ${alice.body.user.token}`;
    await request(app).post("/api/profiles/bob/follow").set("Authorization", authorization);
    const response = await request(app).delete("/api/profiles/bob/follow").set("Authorization", authorization);
    expect(response.status).toBe(200);
    expect(response.body.profile.following).toBe(false);
  });

  it("returns 404 when profile does not exist", async () => {
    const response = await request(app).get("/api/profiles/missing");
    expect(response.status).toBe(404);
  });

  it("returns 401 when following without authentication", async () => {
    await register("bob@example.com", "bob");
    const response = await request(app).post("/api/profiles/bob/follow");
    expect(response.status).toBe(401);
  });

  it("returns 401 when unfollowing without authentication", async () => {
    await register("bob@example.com", "bob");
    const response = await request(app).delete("/api/profiles/bob/follow");
    expect(response.status).toBe(401);
  });
});
