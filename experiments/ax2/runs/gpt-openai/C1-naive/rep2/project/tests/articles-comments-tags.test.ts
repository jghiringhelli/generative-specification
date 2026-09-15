import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { prisma } from "../src/database";
import { api, authenticated, clearDatabase, register } from "./helpers";

beforeEach(clearDatabase);
afterAll(() => prisma.$disconnect());

describe("articles", () => {
  it("creates, reads, filters, updates, favorites, and deletes an article", async () => {
    const alice = await register("alice");
    const bob = await register("bob");
    const created = await api
      .post("/api/articles")
      .set(authenticated(alice.token))
      .send({ article: {
        title: "Hello World",
        description: "A greeting",
        body: "Hello from Conduit",
        tagList: ["welcome", "testing"],
      } });
    expect(created.status).toBe(201);
    const slug = created.body.article.slug;

    const listed = await api.get("/api/articles").query({ tag: "welcome", author: "alice" });
    expect(listed.body.articlesCount).toBe(1);
    expect(listed.body.articles[0].slug).toBe(slug);

    const favorited = await api
      .post(`/api/articles/${slug}/favorite`)
      .set(authenticated(bob.token));
    expect(favorited.body.article).toMatchObject({ favorited: true, favoritesCount: 1 });

    const favorites = await api.get("/api/articles").query({ favorited: "bob" });
    expect(favorites.body.articlesCount).toBe(1);

    const updated = await api
      .put(`/api/articles/${slug}`)
      .set(authenticated(alice.token))
      .send({ article: { title: "Updated title", body: "Updated body" } });
    expect(updated.body.article.title).toBe("Updated title");
    expect(updated.body.article.body).toBe("Updated body");

    await api
      .delete(`/api/articles/${updated.body.article.slug}/favorite`)
      .set(authenticated(bob.token))
      .expect(200);
    await api
      .delete(`/api/articles/${updated.body.article.slug}`)
      .set(authenticated(alice.token))
      .expect(204);
  });

  it("returns a feed containing articles from followed users", async () => {
    const alice = await register("alice");
    const bob = await register("bob");
    await api.post("/api/profiles/alice/follow").set(authenticated(bob.token));
    await api.post("/api/articles").set(authenticated(alice.token)).send({
      article: { title: "Feed article", description: "In feed", body: "Body" },
    });

    const feed = await api.get("/api/articles/feed").set(authenticated(bob.token));
    expect(feed.body.articlesCount).toBe(1);
    expect(feed.body.articles[0].author.username).toBe("alice");
  });
});

describe("comments and tags", () => {
  it("adds, lists, and deletes comments and lists tags", async () => {
    const alice = await register("alice");
    const article = await api.post("/api/articles").set(authenticated(alice.token)).send({
      article: {
        title: "Discussion",
        description: "Comments",
        body: "Talk here",
        tagList: ["discussion", "community"],
      },
    });
    const slug = article.body.article.slug;
    const added = await api
      .post(`/api/articles/${slug}/comments`)
      .set(authenticated(alice.token))
      .send({ comment: { body: "First comment" } });
    expect(added.status).toBe(201);

    const comments = await api.get(`/api/articles/${slug}/comments`);
    expect(comments.body.comments).toHaveLength(1);
    expect(comments.body.comments[0].body).toBe("First comment");

    await api
      .delete(`/api/articles/${slug}/comments/${added.body.comment.id}`)
      .set(authenticated(alice.token))
      .expect(204);
    const tags = await api.get("/api/tags");
    expect(tags.body.tags).toEqual(["community", "discussion"]);
  });
});
