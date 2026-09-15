import request from "supertest";
import { createApp } from "../../src/app";
import { prisma } from "../../src/infrastructure/prisma";

const app = createApp({ jwtSecret: "integration-secret", port: 3000 });
const registration = {
  user: { email: "alice@example.com", username: "alice", password: "password123" }
};

describe("authentication endpoints", () => {
  beforeEach(async () => {
    await prisma.user.deleteMany();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("registers a user successfully", async () => {
    const response = await request(app).post("/api/users").send(registration);
    expect(response.status).toBe(201);
    expect(response.body.user).toMatchObject({ email: "alice@example.com", username: "alice" });
    expect(response.body.user.token).toEqual(expect.any(String));
  });

  it("logs in with valid credentials", async () => {
    await request(app).post("/api/users").send(registration);
    const response = await request(app).post("/api/users/login").send({
      user: { email: registration.user.email, password: registration.user.password }
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
      user: { ...registration.user, username: "another" }
    });
    expect(response.status).toBe(422);
  });

  it("returns 422 when the login password is wrong", async () => {
    await request(app).post("/api/users").send(registration);
    const response = await request(app).post("/api/users/login").send({
      user: { email: registration.user.email, password: "wrong-password" }
    });
    expect(response.status).toBe(422);
  });

  it("returns 401 when the current user request has no token", async () => {
    const response = await request(app).get("/api/user");
    expect(response.status).toBe(401);
  });

  it("returns 401 when updating a user without a token", async () => {
    const response = await request(app).put("/api/user").send({ user: { bio: "No access" } });
    expect(response.status).toBe(401);
  });

  it("returns 422 with the API error shape when registration is invalid", async () => {
    const response = await request(app).post("/api/users").send({
      user: { email: "invalid", username: "", password: "short" }
    });
    expect(response.status).toBe(422);
    expect(response.body.errors.body).toEqual(expect.any(Array));
  });
});
