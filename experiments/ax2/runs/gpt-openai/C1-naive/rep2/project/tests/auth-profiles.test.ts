import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { prisma } from "../src/database";
import { api, authenticated, clearDatabase, register } from "./helpers";

beforeEach(clearDatabase);
afterAll(() => prisma.$disconnect());

describe("authentication", () => {
  it("registers, logs in, reads, and updates the current user", async () => {
    const registered = await register("alice");
    expect(registered).toMatchObject({ username: "alice", email: "alice@example.com" });
    expect(registered.token).toBeTruthy();

    const login = await api.post("/api/users/login").send({
      user: { email: "alice@example.com", password: "password123" },
    });
    expect(login.status).toBe(200);

    const current = await api.get("/api/user").set(authenticated(login.body.user.token));
    expect(current.body.user.username).toBe("alice");

    const updated = await api
      .put("/api/user")
      .set(authenticated(login.body.user.token))
      .send({ user: { bio: "Writer", image: "https://example.com/alice.png" } });
    expect(updated.body.user).toMatchObject({ bio: "Writer", image: "https://example.com/alice.png" });
  });

  it("rejects invalid credentials and unauthenticated requests", async () => {
    await register("alice");
    const login = await api.post("/api/users/login").send({
      user: { email: "alice@example.com", password: "wrong" },
    });
    expect(login.status).toBe(401);
    expect((await api.get("/api/user")).status).toBe(401);
  });
});

describe("profiles", () => {
  it("gets, follows, and unfollows a profile", async () => {
    const alice = await register("alice");
    await register("bob");

    const profile = await api.get("/api/profiles/bob");
    expect(profile.body.profile).toMatchObject({ username: "bob", following: false });

    const followed = await api
      .post("/api/profiles/bob/follow")
      .set(authenticated(alice.token));
    expect(followed.body.profile.following).toBe(true);

    const unfollowed = await api
      .delete("/api/profiles/bob/follow")
      .set(authenticated(alice.token));
    expect(unfollowed.body.profile.following).toBe(false);
  });
});
