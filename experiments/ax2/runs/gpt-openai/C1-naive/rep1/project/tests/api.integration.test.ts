import { randomUUID } from "node:crypto";

import request from "supertest";
import { afterAll, beforeEach, describe, expect, it } from "vitest";

import { app } from "../src/app";
import { prisma } from "../src/prisma";

interface RegisteredUser {
  username: string;
  token: string;
}

async function register(prefix: string): Promise<RegisteredUser> {
  const suffix = randomUUID().slice(0, 8);
  const username = `${prefix}-${suffix}`;
  const response = await request(app)
    .post("/api/users")
    .send({
      user: {
        username,
        email: `${username}@example.com`,
        password: "password",
      },
    })
    .expect(201);
  return { username, token: response.body.user.token };
}

describe("Conduit API", () => {
  beforeEach(async () => {
    await prisma.comment.deleteMany();
    await prisma.article.deleteMany();
    await prisma.tag.deleteMany();
    await prisma.user.deleteMany();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("registers, logs in, reads, and updates the current user", async () => {
    const user = await register("alice");
    const login = await request(app)
      .post("/api/users/login")
      .send({
        user: {
          email: `${user.username}@example.com`,
          password: "password",
        },
      })
      .expect(200);
    expect(login.body.user.username).toBe(user.username);

    await request(app)
      .get("/api/user")
      .set("Authorization", `Token ${user.token}`)
      .expect(200);

    const update = await request(app)
      .put("/api/user")
      .set("Authorization", `Token ${user.token}`)
      .send({ user: { bio: "Writer" } })
      .expect(200);
    expect(update.body.user.bio).toBe("Writer");
  });

  it("follows and unfollows profiles", async () => {
    const alice = await register("alice");
    const bob = await register("bob");

    const followed = await request(app)
      .post(`/api/profiles/${bob.username}/follow`)
      .set("Authorization", `Token ${alice.token}`)
      .expect(200);
    expect(followed.body.profile.following).toBe(true);

    const profile = await request(app)
      .get(`/api/profiles/${bob.username}`)
      .set("Authorization", `Token ${alice.token}`)
      .expect(200);
    expect(profile.body.profile.following).toBe(true);

    const unfollowed = await request(app)
      .delete(`/api/profiles/${bob.username}/follow`)
      .set("Authorization", `Token ${alice.token}`)
      .expect(200);
    expect(unfollowed.body.profile.following).toBe(false);
  });

  it("creates, filters, updates, favorites, and deletes articles", async () => {
    const author = await register("author");
    const reader = await register("reader");
    const created = await request(app)
      .post("/api/articles")
      .set("Authorization", `Token ${author.token}`)
      .send({
        article: {
          title: "Testing Conduit",
          description: "An integration test",
          body: "Article body",
          tagList: ["testing", "typescript"],
        },
      })
      .expect(201);
    const slug = created.body.article.slug;

    const listed = await request(app)
      .get(`/api/articles?tag=testing&author=${author.username}`)
      .expect(200);
    expect(listed.body.articlesCount).toBe(1);

    const favorite = await request(app)
      .post(`/api/articles/${slug}/favorite`)
      .set("Authorization", `Token ${reader.token}`)
      .expect(200);
    expect(favorite.body.article.favorited).toBe(true);

    const filtered = await request(app)
      .get(`/api/articles?favorited=${reader.username}`)
      .expect(200);
    expect(filtered.body.articlesCount).toBe(1);

    const updated = await request(app)
      .put(`/api/articles/${slug}`)
      .set("Authorization", `Token ${author.token}`)
      .send({ article: { description: "Updated" } })
      .expect(200);
    expect(updated.body.article.description).toBe("Updated");

    await request(app)
      .delete(`/api/articles/${slug}`)
      .set("Authorization", `Token ${author.token}`)
      .expect(204);
  });

  it("returns followed authors in the feed", async () => {
    const author = await register("author");
    const reader = await register("reader");
    await request(app)
      .post(`/api/profiles/${author.username}/follow`)
      .set("Authorization", `Token ${reader.token}`)
      .expect(200);
    await request(app)
      .post("/api/articles")
      .set("Authorization", `Token ${author.token}`)
      .send({
        article: {
          title: "Feed Article",
          description: "Visible in feed",
          body: "Body",
          tagList: [],
        },
      })
      .expect(201);

    const feed = await request(app)
      .get("/api/articles/feed")
      .set("Authorization", `Token ${reader.token}`)
      .expect(200);
    expect(feed.body.articlesCount).toBe(1);
  });

  it("adds, lists, and deletes comments and lists tags", async () => {
    const author = await register("author");
    const article = await request(app)
      .post("/api/articles")
      .set("Authorization", `Token ${author.token}`)
      .send({
        article: {
          title: "Commented Article",
          description: "Description",
          body: "Body",
          tagList: ["comments"],
        },
      })
      .expect(201);
    const slug = article.body.article.slug;
    const created = await request(app)
      .post(`/api/articles/${slug}/comments`)
      .set("Authorization", `Token ${author.token}`)
      .send({ comment: { body: "First comment" } })
      .expect(201);

    const comments = await request(app)
      .get(`/api/articles/${slug}/comments`)
      .expect(200);
    expect(comments.body.comments).toHaveLength(1);

    const tags = await request(app).get("/api/tags").expect(200);
    expect(tags.body.tags).toContain("comments");

    await request(app)
      .delete(`/api/articles/${slug}/comments/${created.body.comment.id}`)
      .set("Authorization", `Token ${author.token}`)
      .expect(204);
  });
});
