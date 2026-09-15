import request from "supertest";
import { Express } from "express";
import { prisma } from "../lib/prisma";
import { authHeader, resetDatabase, testApp } from "./helpers";

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

const validUser = {
  email: "jane@example.com",
  username: "jane",
  password: "password123",
};

describe("POST /api/users (register)", () => {
  it("creates a user and returns a token", async () => {
    const res = await request(app)
      .post("/api/users")
      .send({ user: validUser });
    expect(res.status).toBe(201);
    expect(res.body.user.email).toBe(validUser.email);
    expect(res.body.user.username).toBe(validUser.username);
    expect(typeof res.body.user.token).toBe("string");
  });

  it("returns 422 when email is already registered", async () => {
    await request(app).post("/api/users").send({ user: validUser });
    const res = await request(app)
      .post("/api/users")
      .send({ user: { ...validUser, username: "different" } });
    expect(res.status).toBe(422);
    expect(res.body.errors.body).toContain("email has already been taken");
  });

  it("returns 422 when the email is invalid", async () => {
    const res = await request(app)
      .post("/api/users")
      .send({ user: { ...validUser, email: "not-an-email" } });
    expect(res.status).toBe(422);
    expect(Array.isArray(res.body.errors.body)).toBe(true);
  });
});

describe("POST /api/users/login", () => {
  beforeEach(async () => {
    await request(app).post("/api/users").send({ user: validUser });
  });

  it("returns a token for valid credentials", async () => {
    const res = await request(app)
      .post("/api/users/login")
      .send({ user: { email: validUser.email, password: validUser.password } });
    expect(res.status).toBe(200);
    expect(typeof res.body.user.token).toBe("string");
  });

  it("returns 422 when the password is wrong", async () => {
    const res = await request(app)
      .post("/api/users/login")
      .send({ user: { email: validUser.email, password: "wrong-password" } });
    expect(res.status).toBe(422);
  });
});

describe("GET /api/user", () => {
  it("returns the current user for a valid token", async () => {
    const register = await request(app)
      .post("/api/users")
      .send({ user: validUser });
    const token = register.body.user.token;
    const res = await request(app)
      .get("/api/user")
      .set("Authorization", authHeader(token));
    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe(validUser.email);
  });

  it("returns 401 when no token is provided", async () => {
    const res = await request(app).get("/api/user");
    expect(res.status).toBe(401);
  });
});

describe("PUT /api/user", () => {
  it("updates the current user's bio", async () => {
    const register = await request(app)
      .post("/api/users")
      .send({ user: validUser });
    const token = register.body.user.token;
    const res = await request(app)
      .put("/api/user")
      .set("Authorization", authHeader(token))
      .send({ user: { bio: "Hello there" } });
    expect(res.status).toBe(200);
    expect(res.body.user.bio).toBe("Hello there");
  });

  it("returns 401 when updating without a token", async () => {
    const res = await request(app)
      .put("/api/user")
      .send({ user: { bio: "nope" } });
    expect(res.status).toBe(401);
  });
});
