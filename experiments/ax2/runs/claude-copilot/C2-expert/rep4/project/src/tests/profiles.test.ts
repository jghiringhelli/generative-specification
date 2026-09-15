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

describe("GET /api/profiles/:username", () => {
  it("returns a profile for an unauthenticated viewer with following false", async () => {
    const target = await registerUser(app, { username: "celeb" });
    const res = await request(app).get(`/api/profiles/${target.username}`);
    expect(res.status).toBe(200);
    expect(res.body.profile.username).toBe("celeb");
    expect(res.body.profile.following).toBe(false);
  });

  it("returns a profile for an authenticated viewer", async () => {
    const target = await registerUser(app, { username: "celeb" });
    const viewer = await registerUser(app);
    const res = await request(app)
      .get(`/api/profiles/${target.username}`)
      .set("Authorization", authHeader(viewer.token));
    expect(res.status).toBe(200);
    expect(res.body.profile.following).toBe(false);
  });

  it("returns 404 when profile does not exist", async () => {
    const res = await request(app).get("/api/profiles/ghost");
    expect(res.status).toBe(404);
  });
});

describe("POST /api/profiles/:username/follow", () => {
  it("follows a user and reports following true", async () => {
    const target = await registerUser(app, { username: "celeb" });
    const viewer = await registerUser(app);
    const res = await request(app)
      .post(`/api/profiles/${target.username}/follow`)
      .set("Authorization", authHeader(viewer.token));
    expect(res.status).toBe(200);
    expect(res.body.profile.following).toBe(true);
  });

  it("is idempotent when following twice", async () => {
    const target = await registerUser(app, { username: "celeb" });
    const viewer = await registerUser(app);
    await request(app)
      .post(`/api/profiles/${target.username}/follow`)
      .set("Authorization", authHeader(viewer.token));
    const res = await request(app)
      .post(`/api/profiles/${target.username}/follow`)
      .set("Authorization", authHeader(viewer.token));
    expect(res.status).toBe(200);
    expect(res.body.profile.following).toBe(true);
  });

  it("returns 401 when following without auth", async () => {
    const target = await registerUser(app, { username: "celeb" });
    const res = await request(app).post(
      `/api/profiles/${target.username}/follow`,
    );
    expect(res.status).toBe(401);
  });
});

describe("DELETE /api/profiles/:username/follow", () => {
  it("unfollows a user and reports following false", async () => {
    const target = await registerUser(app, { username: "celeb" });
    const viewer = await registerUser(app);
    await request(app)
      .post(`/api/profiles/${target.username}/follow`)
      .set("Authorization", authHeader(viewer.token));
    const res = await request(app)
      .delete(`/api/profiles/${target.username}/follow`)
      .set("Authorization", authHeader(viewer.token));
    expect(res.status).toBe(200);
    expect(res.body.profile.following).toBe(false);
  });

  it("is idempotent when unfollowing someone not followed", async () => {
    const target = await registerUser(app, { username: "celeb" });
    const viewer = await registerUser(app);
    const res = await request(app)
      .delete(`/api/profiles/${target.username}/follow`)
      .set("Authorization", authHeader(viewer.token));
    expect(res.status).toBe(200);
    expect(res.body.profile.following).toBe(false);
  });
});
