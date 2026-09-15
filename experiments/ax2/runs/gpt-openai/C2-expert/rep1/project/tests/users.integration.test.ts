import { PrismaClient } from "@prisma/client";
import request from "supertest";
import { createApp } from "../src/app";

const prisma = new PrismaClient();
const JWT_SECRET = "integration-test-secret";
const app = createApp({ prisma, jwtSecret: JWT_SECRET });

const registration = {
  user: {
    email: "alice@example.com",
    username: "alice",
    password: "password123"
  }
};

describe("user endpoints", () => {
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

  it("registers a new user", async () => {
    const response = await request(app).post("/api/users").send(registration);

    expect(response.status).toBe(201);
    expect(response.body.user).toMatchObject({
      email: registration.user.email,
      username: registration.user.username
    });
    expect(response.body.user.token).toEqual(expect.any(String));
  });

  it("logs in with valid credentials", async () => {
    await request(app).post("/api/users").send(registration);

    const response = await request(app).post("/api/users/login").send({
      user: {
        email: registration.user.email,
        password: registration.user.password
      }
    });

    expect(response.status).toBe(200);
    expect(response.body.user.token).toEqual(expect.any(String));
  });

  it("gets the current user with a valid token", async () => {
    const registered = await request(app).post("/api/users").send(registration);

    const response = await request(app)
      .get("/api/user")
      .set("Authorization", `Token ${registered.body.user.token}`);

    expect(response.status).toBe(200);
    expect(response.body.user.email).toBe(registration.user.email);
  });

  it("updates the current user", async () => {
    const registered = await request(app).post("/api/users").send(registration);

    const response = await request(app)
      .put("/api/user")
      .set("Authorization", `Token ${registered.body.user.token}`)
      .send({ user: { bio: "Writer" } });

    expect(response.status).toBe(200);
    expect(response.body.user.bio).toBe("Writer");
  });

  it("returns 422 when email is already registered", async () => {
    await request(app).post("/api/users").send(registration);

    const response = await request(app).post("/api/users").send({
      user: { ...registration.user, username: "other-user" }
    });

    expect(response.status).toBe(422);
  });

  it("returns 422 when password is wrong", async () => {
    await request(app).post("/api/users").send(registration);

    const response = await request(app).post("/api/users/login").send({
      user: { email: registration.user.email, password: "wrong-password" }
    });

    expect(response.status).toBe(422);
  });

  it("returns 401 when getting a user without a token", async () => {
    const response = await request(app).get("/api/user");

    expect(response.status).toBe(401);
  });
});
