import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcrypt'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding...')

  const alice = await prisma.user.create({
    data: {
      email: 'alice@example.com',
      username: 'alice',
      passwordHash: await bcrypt.hash('password123', 10),
    },
  })

  const bob = await prisma.user.create({
    data: {
      email: 'bob@example.com',
      username: 'bob',
      passwordHash: await bcrypt.hash('password123', 10),
    },
  })

  const carol = await prisma.user.create({
    data: {
      email: 'carol@example.com',
      username: 'carol',
      passwordHash: await bcrypt.hash('password123', 10),
    },
  })

  // Alice follows Bob and Carol
  await prisma.follow.createMany({
    data: [
      { followerId: alice.id, followingId: bob.id },
      { followerId: alice.id, followingId: carol.id },
    ],
  })

  const tags = await Promise.all([
    prisma.tag.create({ data: { name: 'typescript' } }),
    prisma.tag.create({ data: { name: 'architecture' } }),
    prisma.tag.create({ data: { name: 'testing' } }),
    prisma.tag.create({ data: { name: 'devtools' } }),
  ])

  // Bob saves some bookmarks
  const bm1 = await prisma.bookmark.create({
    data: {
      userId: bob.id,
      url: 'https://www.typescriptlang.org/docs/',
      title: 'TypeScript Docs',
      savedCount: 14,
    },
  })
  await prisma.bookmarkTag.create({ data: { bookmarkId: bm1.id, tagId: tags[0].id } })

  const bm2 = await prisma.bookmark.create({
    data: {
      userId: bob.id,
      url: 'https://martinfowler.com/bliki/AnemicDomainModel.html',
      title: 'Anemic Domain Model — Fowler',
      savedCount: 9,
    },
  })
  await prisma.bookmarkTag.create({ data: { bookmarkId: bm2.id, tagId: tags[1].id } })

  // Carol saves some bookmarks
  const bm3 = await prisma.bookmark.create({
    data: {
      userId: carol.id,
      url: 'https://vitest.dev/',
      title: 'Vitest — Fast Unit Testing',
      savedCount: 22,
    },
  })
  await prisma.bookmarkTag.create({ data: { bookmarkId: bm3.id, tagId: tags[2].id } })

  const bm4 = await prisma.bookmark.create({
    data: {
      userId: carol.id,
      url: 'https://github.com/prisma/prisma',
      title: 'Prisma ORM',
      description: 'Next-generation Node.js and TypeScript ORM',
      savedCount: 31,
    },
  })
  await prisma.bookmarkTag.createMany({
    data: [
      { bookmarkId: bm4.id, tagId: tags[0].id },
      { bookmarkId: bm4.id, tagId: tags[3].id },
    ],
  })

  console.log('Seed complete. Users: alice / bob / carol (password: password123)')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
