import type { PrismaClient } from "@prisma/client";
import type { Application } from "express";
import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

process.env.JWT_SECRET ??= "integration-test-secret";

let app: Application;
let prisma: PrismaClient;

const runId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
const alice = {
  email: `alice-${runId}@example.com`,
  username: `alice-${runId}`,
  password: "password123",
};
const bob = {
  email: `bob-${runId}@example.com`,
  username: `bob-${runId}`,
  password: "password123",
};
const tag = `testing-${runId}`;

async function register(user: typeof alice): Promise<string> {
  const response = await request(app).post("/api/users").send({ user }).expect(201);
  return response.body.user.token;
}

describe("Conduit API", () => {
  beforeAll(async () => {
    ({ app } = await import("../src/app"));
    ({ prisma } = await import("../src/prisma"));
  });

  afterAll(async () => {
    await prisma.user.deleteMany({
      where: { username: { in: [alice.username, bob.username] } },
    });
    await prisma.tag.deleteMany({ where: { name: tag } });
    await prisma.$disconnect();
  });

  it("supports the complete user, profile, article, comment, and tag flow", async () => {
    const aliceToken = await register(alice);
    const bobToken = await register(bob);

    const login = await request(app)
      .post("/api/users/login")
      .send({ user: { email: alice.email, password: alice.password } })
      .expect(200);
    expect(login.body.user.username).toBe(alice.username);

    const updated = await request(app)
      .put("/api/user")
      .set("Authorization", `Token ${aliceToken}`)
      .send({ user: { bio: "Writer", image: "https://example.com/alice.png" } })
      .expect(200);
    expect(updated.body.user.bio).toBe("Writer");

    await request(app)
      .get("/api/user")
      .set("Authorization", `Token ${aliceToken}`)
      .expect(200);

    const followed = await request(app)
      .post(`/api/profiles/${alice.username}/follow`)
      .set("Authorization", `Token ${bobToken}`)
      .expect(200);
    expect(followed.body.profile.following).toBe(true);

    const profile = await request(app)
      .get(`/api/profiles/${alice.username}`)
      .set("Authorization", `Token ${bobToken}`)
      .expect(200);
    expect(profile.body.profile.bio).toBe("Writer");

    const created = await request(app)
      .post("/api/articles")
      .set("Authorization", `Token ${aliceToken}`)
      .send({
        article: {
          title: `Article ${runId}`,
          description: "An integration test article",
          body: "Article body",
          tagList: [tag],
        },
      })
      .expect(201);
    const originalSlug: string = created.body.article.slug;
    expect(created.body.article.tagList).toContain(tag);

    const listed = await request(app)
      .get("/api/articles")
      .query({ tag, author: alice.username, limit: 10, offset: 0 })
      .set("Authorization", `Token ${bobToken}`)
      .expect(200);
    expect(listed.body.articlesCount).toBe(1);

    const feed = await request(app)
      .get("/api/articles/feed")
      .set("Authorization", `Token ${bobToken}`)
      .expect(200);
    expect(feed.body.articles.some((article: { slug: string }) => article.slug === originalSlug))
      .toBe(true);

    const article = await request(app)
      .get(`/api/articles/${originalSlug}`)
      .set("Authorization", `Token ${bobToken}`)
      .expect(200);
    expect(article.body.article.author.following).toBe(true);

    const favorite = await request(app)
      .post(`/api/articles/${originalSlug}/favorite`)
      .set("Authorization", `Token ${bobToken}`)
      .expect(200);
    expect(favorite.body.article.favorited).toBe(true);
    expect(favorite.body.article.favoritesCount).toBe(1);

    const favoritesList = await request(app)
      .get("/api/articles")
      .query({ favorited: bob.username })
      .set("Authorization", `Token ${bobToken}`)
      .expect(200);
    expect(favoritesList.body.articlesCount).toBe(1);

    const comment = await request(app)
      .post(`/api/articles/${originalSlug}/comments`)
      .set("Authorization", `Token ${bobToken}`)
      .send({ comment: { body: "Great article" } })
      .expect(201);
    const commentId: number = comment.body.comment.id;

    const comments = await request(app)
      .get(`/api/articles/${originalSlug}/comments`)
      .set("Authorization", `Token ${bobToken}`)
      .expect(200);
    expect(comments.body.comments).toHaveLength(1);

    await request(app)
      .delete(`/api/articles/${originalSlug}/comments/${commentId}`)
      .set("Authorization", `Token ${bobToken}`)
      .expect(204);

    const updatedArticle = await request(app)
      .put(`/api/articles/${originalSlug}`)
      .set("Authorization", `Token ${aliceToken}`)
      .send({ article: { title: `Updated ${runId}`, body: "Updated body" } })
      .expect(200);
    const updatedSlug: string = updatedArticle.body.article.slug;
    expect(updatedArticle.body.article.body).toBe("Updated body");

    const tags = await request(app).get("/api/tags").expect(200);
    expect(tags.body.tags).toContain(tag);

    const unfavorite = await request(app)
      .delete(`/api/articles/${updatedSlug}/favorite`)
      .set("Authorization", `Token ${bobToken}`)
      .expect(200);
    expect(unfavorite.body.article.favorited).toBe(false);

    await request(app)
      .delete(`/api/profiles/${alice.username}/follow`)
      .set("Authorization", `Token ${bobToken}`)
      .expect(200);

    await request(app)
      .delete(`/api/articles/${updatedSlug}`)
      .set("Authorization", `Token ${aliceToken}`)
      .expect(204);
  });
});
