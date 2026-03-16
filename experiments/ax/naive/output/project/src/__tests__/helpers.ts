import { PrismaClient } from '@prisma/client';
import { hashPassword } from '../utils/password';

const prisma = new PrismaClient();

export async function createUser(data: {
  email: string;
  username: string;
  password: string;
  bio?: string;
  image?: string;
}) {
  const hashedPassword = await hashPassword(data.password);
  return prisma.user.create({
    data: {
      email: data.email,
      username: data.username,
      password: hashedPassword,
      bio: data.bio,
      image: data.image
    }
  });
}

export async function createArticle(authorId: number, data: {
  slug: string;
  title: string;
  description: string;
  body: string;
  tagList?: string[];
}) {
  return prisma.article.create({
    data: {
      slug: data.slug,
      title: data.title,
      description: data.description,
      body: data.body,
      authorId,
      tags: data.tagList ? {
        connectOrCreate: data.tagList.map(tag => ({
          where: { name: tag },
          create: { name: tag }
        }))
      } : undefined
    },
    include: {
      tags: true
    }
  });
}

export async function cleanup() {
  await prisma.comment.deleteMany();
  await prisma.favorite.deleteMany();
  await prisma.article.deleteMany();
  await prisma.tag.deleteMany();
  await prisma.follow.deleteMany();
  await prisma.user.deleteMany();
}
