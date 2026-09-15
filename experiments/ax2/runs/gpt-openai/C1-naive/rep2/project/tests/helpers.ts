import request from "supertest";
import { app } from "../src/app";
import { prisma } from "../src/database";

export const api = request(app);

export async function clearDatabase(): Promise<void> {
  await prisma.comment.deleteMany();
  await prisma.favorite.deleteMany();
  await prisma.article.deleteMany();
  await prisma.tag.deleteMany();
  await prisma.follow.deleteMany();
  await prisma.user.deleteMany();
}

export async function register(
  username: string,
  email = `${username}@example.com`,
  password = "password123",
) {
  const response = await api.post("/api/users").send({ user: { username, email, password } });
  return response.body.user as { username: string; email: string; token: string };
}

export function authenticated(token: string): { Authorization: string } {
  return { Authorization: `Token ${token}` };
}
