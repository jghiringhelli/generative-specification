import { PrismaClient } from "@prisma/client";
import request from "supertest";
import { createApp } from "../src/app";

const prisma = new PrismaClient();
const app = createApp(prisma, { jwtSecret: "integration-secret", port: 3000 });
const exampleUser = {
  email: "reader@example.com",
  username: "reader",
  password: "secure-password"
};

async function registerUser() {
  return request(app).post("/api/users").send({ user: exampleUser });
}

beforeEach(async () => {
  await prisma.follow.deleteMany();
  await prisma.user.deleteMany();
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe("authentication endpoints", () => {
  it("registers a user successfully", async () => {
    const response = await registerUser();
    expect(response.status).toBe(201);
    expect(response.body.user).toMatchObject({
      email: exampleUser.email,
      username: exampleUser.username
    });
    expect(response.body.user.token).toEqual(expect.any(String));
  });

  it("logs in a registered user successfully", async () => {
    await registerUser();
    const response = await request(app).post("/api/users/login").send({
      user: { email: exampleUser.email, password: exampleUser.password }
    });
    expect(response.status).toBe(200);
    expect(response.body.user.token).toEqual(expect.any(String));
  });

  it("returns the current user for a valid token", async () => {
    const registration = await registerUser();
    const response = await request(app)
      .get("/api/user")
      .set("Authorization", `Token ${registration.body.user.token}`);
    expect(response.status).toBe(200);
    expect(response.body.user.email).toBe(exampleUser.email);
  });

  it("updates the current user", async () => {
    const registration = await registerUser();
    const response = await request(app)
      .put("/api/user")
      .set("Authorization", `Token ${registration.body.user.token}`)
      .send({ user: { bio: "A curious reader" } });
    expect(response.status).toBe(200);
    expect(response.body.user.bio).toBe("A curious reader");
  });

  it("returns 422 when email is already registered", async () => {
    await registerUser();
    const response = await registerUser();
    expect(response.status).toBe(422);
  });

  it("returns 422 when password is incorrect", async () => {
    await registerUser();
    const response = await request(app).post("/api/users/login").send({
      user: { email: exampleUser.email, password: "wrong-password" }
    });
    expect(response.status).toBe(422);
  });

  it("returns 401 when current user is requested without a token", async () => {
    const response = await request(app).get("/api/user");
    expect(response.status).toBe(401);
  });
});
