import request from "supertest";
import { createApp } from "../../src/app";
import { prisma } from "../../src/infrastructure/prisma";

const app = createApp({ jwtSecret: "integration-secret", port: 3000 });

async function user(username: string) {
  return request(app).post("/api/users").send({
    user: { email: `${username}@example.com`, username, password: "password123" }
  });
}

async function article(token: string, title: string, tags: string[] = []) {
  return request(app).post("/api/articles").set("Authorization", `Token ${token}`).send({
    article: { title, description: `${title} description`, body: `${title} body`, tagList: tags }
  });
}

describe("article endpoints", () => {
  beforeEach(async () => {
    await prisma.favorite.deleteMany();
    await prisma.article.deleteMany();
    await prisma.follow.deleteMany();
    await prisma.user.deleteMany();
    await prisma.tag.deleteMany();
  });

  afterAll(async () => prisma.$disconnect());

  it("lists articles without body fields", async () => {
    const author = await user("alice");
    await article(author.body.user.token, "First");
    const response = await request(app).get("/api/articles");
    expect(response.body.articlesCount).toBe(1);
    expect(response.body.articles[0].body).toBeUndefined();
  });

  it("lists articles filtered by tag", async () => {
    const author = await user("alice");
    await article(author.body.user.token, "Tagged", ["typescript"]);
    await article(author.body.user.token, "Other", ["express"]);
    const response = await request(app).get("/api/articles?tag=typescript");
    expect(response.body.articles.map((item: { title: string }) => item.title)).toEqual(["Tagged"]);
  });

  it("lists articles filtered by author", async () => {
    const alice = await user("alice");
    const bob = await user("bob");
    await article(alice.body.user.token, "Alice article");
    await article(bob.body.user.token, "Bob article");
    const response = await request(app).get("/api/articles?author=bob");
    expect(response.body.articles[0].author.username).toBe("bob");
  });

  it("lists articles filtered by the user who favorited them", async () => {
    const alice = await user("alice");
    const bob = await user("bob");
    const created = await article(alice.body.user.token, "Favorite");
    await request(app)
      .post(`/api/articles/${created.body.article.slug}/favorite`)
      .set("Authorization", `Token ${bob.body.user.token}`);
    const response = await request(app).get("/api/articles?favorited=bob");
    expect(response.body.articlesCount).toBe(1);
  });

  it("applies limit and offset pagination", async () => {
    const author = await user("alice");
    await article(author.body.user.token, "First");
    await article(author.body.user.token, "Second");
    const response = await request(app).get("/api/articles?limit=1&offset=1");
    expect(response.body.articles).toHaveLength(1);
    expect(response.body.articlesCount).toBe(2);
  });

  it("lists a feed of followed authors without body fields", async () => {
    const alice = await user("alice");
    const bob = await user("bob");
    await request(app)
      .post("/api/profiles/bob/follow")
      .set("Authorization", `Token ${alice.body.user.token}`);
    await article(bob.body.user.token, "Followed");
    const response = await request(app)
      .get("/api/articles/feed")
      .set("Authorization", `Token ${alice.body.user.token}`);
    expect(response.body.articlesCount).toBe(1);
    expect(response.body.articles[0].body).toBeUndefined();
  });

  it("gets a single article including its body", async () => {
    const author = await user("alice");
    const created = await article(author.body.user.token, "Single");
    const response = await request(app).get(`/api/articles/${created.body.article.slug}`);
    expect(response.status).toBe(200);
    expect(response.body.article.body).toBe("Single body");
  });

  it("creates an article with a unique slug", async () => {
    const author = await user("alice");
    const response = await article(author.body.user.token, "Hello World");
    expect(response.status).toBe(201);
    expect(response.body.article.slug).toMatch(/^hello-world-\d+$/);
  });

  it("updates an article owned by the current user", async () => {
    const author = await user("alice");
    const created = await article(author.body.user.token, "Original");
    const response = await request(app)
      .put(`/api/articles/${created.body.article.slug}`)
      .set("Authorization", `Token ${author.body.user.token}`)
      .send({ article: { title: "Updated" } });
    expect(response.status).toBe(200);
    expect(response.body.article.title).toBe("Updated");
  });

  it("returns 403 when updating another author's article", async () => {
    const alice = await user("alice");
    const bob = await user("bob");
    const created = await article(alice.body.user.token, "Protected");
    const response = await request(app)
      .put(`/api/articles/${created.body.article.slug}`)
      .set("Authorization", `Token ${bob.body.user.token}`)
      .send({ article: { title: "Stolen" } });
    expect(response.status).toBe(403);
  });

  it("deletes an article owned by the current user", async () => {
    const alice = await user("alice");
    const created = await article(alice.body.user.token, "Disposable");
    const response = await request(app)
      .delete(`/api/articles/${created.body.article.slug}`)
      .set("Authorization", `Token ${alice.body.user.token}`);
    expect(response.status).toBe(204);
  });

  it("returns 403 when deleting another author's article", async () => {
    const alice = await user("alice");
    const bob = await user("bob");
    const created = await article(alice.body.user.token, "Protected");
    const response = await request(app)
      .delete(`/api/articles/${created.body.article.slug}`)
      .set("Authorization", `Token ${bob.body.user.token}`);
    expect(response.status).toBe(403);
  });

  it("favorites and unfavorites an article", async () => {
    const alice = await user("alice");
    const bob = await user("bob");
    const created = await article(alice.body.user.token, "Popular");
    const path = `/api/articles/${created.body.article.slug}/favorite`;
    const favorite = await request(app).post(path).set("Authorization", `Token ${bob.body.user.token}`);
    expect(favorite.body.article).toMatchObject({ favorited: true, favoritesCount: 1 });
    const unfavorite = await request(app).delete(path).set("Authorization", `Token ${bob.body.user.token}`);
    expect(unfavorite.body.article).toMatchObject({ favorited: false, favoritesCount: 0 });
  });

  it("returns 404 when an article does not exist", async () => {
    const response = await request(app).get("/api/articles/missing");
    expect(response.status).toBe(404);
  });

  it("returns 422 when pagination is negative", async () => {
    const response = await request(app).get("/api/articles?limit=-1&offset=-2");
    expect(response.status).toBe(422);
    expect(response.body.errors.body).toEqual(expect.any(Array));
  });

  it("returns 422 when an article request is invalid", async () => {
    const alice = await user("alice");
    const response = await request(app)
      .post("/api/articles")
      .set("Authorization", `Token ${alice.body.user.token}`)
      .send({ article: { title: "", description: "", body: "" } });
    expect(response.status).toBe(422);
  });

  it.each([
    ["GET", "/api/articles/feed"],
    ["POST", "/api/articles"],
    ["PUT", "/api/articles/missing"],
    ["DELETE", "/api/articles/missing"],
    ["POST", "/api/articles/missing/favorite"],
    ["DELETE", "/api/articles/missing/favorite"]
  ])("returns 401 for unauthenticated %s %s", async (method, path) => {
    const agent = request(app);
    const response = method === "GET"
      ? await agent.get(path)
      : method === "POST"
        ? await agent.post(path).send({})
        : method === "PUT"
          ? await agent.put(path).send({})
          : await agent.delete(path);
    expect(response.status).toBe(401);
  });
});
