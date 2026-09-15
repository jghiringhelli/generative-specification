import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  await prisma.comment.deleteMany();
  await prisma.favorite.deleteMany();
  await prisma.article.deleteMany();
  await prisma.tag.deleteMany();
  await prisma.follow.deleteMany();
  await prisma.user.deleteMany();

  const passwordHash = await bcrypt.hash('password123', 10);

  const user1 = await prisma.user.create({
    data: {
      username: 'jake',
      email: 'jake@example.com',
      password: passwordHash,
      bio: 'I work at statefarm',
      image: 'https://i.stack.imgur.com/xHWG8.jpg'
    }
  });

  const user2 = await prisma.user.create({
    data: {
      username: 'jane',
      email: 'jane@example.com',
      password: passwordHash,
      bio: 'Software engineer & tech enthusiast',
      image: 'https://api.realworld.io/images/demo-avatar.png'
    }
  });

  await prisma.follow.create({
    data: {
      followerId: user2.id,
      followingId: user1.id
    }
  });

  const tag1 = await prisma.tag.create({ data: { name: 'dragons' } });
  const tag2 = await prisma.tag.create({ data: { name: 'training' } });
  const tag3 = await prisma.tag.create({ data: { name: 'realworld' } });

  const article = await prisma.article.create({
    data: {
      slug: 'how-to-train-your-dragon',
      title: 'How to train your dragon',
      description: 'Ever wonder how?',
      body: 'It takes a Jacobian',
      authorId: user1.id,
      tags: {
        connect: [{ id: tag1.id }, { id: tag2.id }]
      }
    }
  });

  await prisma.favorite.create({
    data: {
      userId: user2.id,
      articleId: article.id
    }
  });

  await prisma.comment.create({
    data: {
      body: 'Great article on training dragons!',
      articleId: article.id,
      authorId: user2.id
    }
  });

  console.log('Seed data inserted successfully.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
