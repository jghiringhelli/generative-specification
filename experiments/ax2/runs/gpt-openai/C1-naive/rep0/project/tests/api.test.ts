import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { app } from "../src/app";
import { prisma } from "../src/prisma";

const alice = {
  email: "alice@example.com",
  username: "alice",
  password: "password",
};
const bob = {
  email: "bob@example.com",
  username: "bob",
  password: "password",
};

async function register(user: typeof alice) {
  return request(app).post("/api/users").send({ user });
}

describe("Conduit API", () => {
  let aliceToken: string;
  let bobToken: string;
  let commentId: number;

  beforeAll(async () => {
    await prisma.favorite.deleteMany();
    await prisma.comment.deleteMany();
    await prisma.article.deleteMany();
    await prisma.tag.deleteMany();
    await prisma.follow.deleteMany();
    await prisma.user.deleteMany();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("registers and logs in users", async () => {
    const aliceResponse = await register(alice);
    expect(aliceResponse.status).toBe(201);
    aliceToken = aliceResponse.body.user.token;

    const bobResponse = await register(bob);
    expect(bobResponse.status).toBe(201);
    bobToken = bobResponse.body.user.token;

    const login = await request(app)
      .post("/api/users/login")
      .send({ user: { email: alice.email, password: alice.password } });
    expect(login.status).toBe(200);
    expect(login.body.user.username).toBe("alice");
  });

  it("gets and updates the current user", async () => {
    const current = await request(app)
      .get("/api/user")
      .set("Authorization", `Token ${aliceToken}`);
    expect(current.body.user.email).toBe(alice.email);

    const updated = await request(app)
      .put("/api/user")
      .set("Authorization", `Token ${aliceToken}`)
      .send({ user: { bio: "Writer", image: "https://example.com/alice.png" } });
    expect(updated.body.user.bio).toBe("Writer");
    aliceToken = updated.body.user.token;
  });

  it("gets, follows, and unfollows profiles", async () => {
    const profile = await request(app).get("/api/profiles/bob");
    expect(profile.body.profile.following).toBe(false);

    const followed = await request(app)
      .post("/api/profiles/bob/follow")
      .set("Authorization", `Token ${aliceToken}`);
    expect(followed.body.profile.following).toBe(true);

    const unfollowed = await request(app)
      .delete("/api/profiles/bob/follow")
      .set("Authorization", `Token ${aliceToken}`);
    expect(unfollowed.body.profile.following).toBe(false);

    await request(app)
      .post("/api/profiles/bob/follow")
      .set("Authorization", `Token ${aliceToken}`);
  });

  it("creates, lists, reads, updates, and feeds articles", async () => {
    const created = await request(app)
      .post("/api/articles")
      .set("Authorization", `Token ${bobToken}`)
      .send({
        article: {
          title: "Hello World",
          description: "A greeting",
          body: "Hello from Conduit",
          tagList: ["welcome", "testing"],
        },
      });
    expect(created.status).toBe(201);
    expect(created.body.article.slug).toBe("hello-world");

    const list = await request(app).get("/api/articles?tag=welcome&author=bob");
    expect(list.body.articlesCount).toBe(1);

    const article = await request(app).get("/api/articles/hello-world");
    expect(article.body.article.title).toBe("Hello World");

    const updated = await request(app)
      .put("/api/articles/hello-world")
      .set("Authorization", `Token ${bobToken}`)
      .send({ article: { title: "Updated Article" } });
    expect(updated.body.article.slug).toBe("updated-article");

    const feed = await request(app)
      .get("/api/articles/feed")
      .set("Authorization", `Token ${aliceToken}`);
    expect(feed.body.articlesCount).toBe(1);
  });

  it("favorites and filters articles", async () => {
    const favorite = await request(app)
      .post("/api/articles/updated-article/favorite")
      .set("Authorization", `Token ${aliceToken}`);
    expect(favorite.body.article.favorited).toBe(true);
    expect(favorite.body.article.favoritesCount).toBe(1);

    const list = await request(app).get("/api/articles?favorited=alice");
    expect(list.body.articlesCount).toBe(1);

    const unfavorite = await request(app)
      .delete("/api/articles/updated-article/favorite")
      .set("Authorization", `Token ${aliceToken}`);
    expect(unfavorite.body.article.favorited).toBe(false);
  });

  it("adds, gets, and deletes comments", async () => {
    const created = await request(app)
      .post("/api/articles/updated-article/comments")
      .set("Authorization", `Token ${aliceToken}`)
      .send({ comment: { body: "Nice article" } });
    expect(created.status).toBe(201);
    commentId = created.body.comment.id;

    const comments = await request(app).get("/api/articles/updated-article/comments");
    expect(comments.body.comments).toHaveLength(1);

    const deleted = await request(app)
      .delete(`/api/articles/updated-article/comments/${commentId}`)
      .set("Authorization", `Token ${aliceToken}`);
    expect(deleted.status).toBe(204);
  });

  it("lists tags and deletes an article", async () => {
    const tags = await request(app).get("/api/tags");
    expect(tags.body.tags).toEqual(["testing", "welcome"]);

    const deleted = await request(app)
      .delete("/api/articles/updated-article")
      .set("Authorization", `Token ${bobToken}`);
    expect(deleted.status).toBe(204);
  });
});
