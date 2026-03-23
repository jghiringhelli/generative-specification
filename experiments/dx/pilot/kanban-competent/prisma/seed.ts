import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcrypt'

const prisma = new PrismaClient()

async function main() {
  const password = await bcrypt.hash('password123', 10)

  // --- Users ---
  const alice = await prisma.user.create({
    data: { username: 'alice', email: 'alice@example.com', password },
  })
  const bob = await prisma.user.create({
    data: { username: 'bob', email: 'bob@example.com', password },
  })
  const carol = await prisma.user.create({
    data: { username: 'carol', email: 'carol@example.com', password },
  })

  // --- Project 1: API Redesign ---
  const apiProject = await prisma.project.create({
    data: { name: 'API Redesign', description: 'Refactor legacy REST endpoints', ownerId: alice.id },
  })
  await prisma.projectMember.createMany({
    data: [
      { projectId: apiProject.id, userId: alice.id, role: 'OWNER' },
      { projectId: apiProject.id, userId: bob.id, role: 'MEMBER' },
    ],
  })

  const task1 = await prisma.task.create({
    data: {
      projectId: apiProject.id,
      title: 'Define OpenAPI schema',
      description: 'Write the full OpenAPI 3.0 spec before touching code',
      status: 'DONE',
      creatorId: alice.id,
      assigneeId: alice.id,
    },
  })
  const task2 = await prisma.task.create({
    data: {
      projectId: apiProject.id,
      title: 'Refactor user routes',
      description: 'Move to service layer, add input validation',
      status: 'IN_PROGRESS',
      creatorId: alice.id,
      assigneeId: bob.id,
    },
  })
  const task3 = await prisma.task.create({
    data: {
      projectId: apiProject.id,
      title: 'Add rate limiting middleware',
      description: 'Prevent abuse on auth endpoints',
      status: 'TODO',
      creatorId: bob.id,
      assigneeId: null,
    },
  })

  // --- Project 2: Mobile App MVP ---
  const mobileProject = await prisma.project.create({
    data: { name: 'Mobile App MVP', description: 'First version of the mobile client', ownerId: carol.id },
  })
  await prisma.projectMember.createMany({
    data: [
      { projectId: mobileProject.id, userId: carol.id, role: 'OWNER' },
      { projectId: mobileProject.id, userId: alice.id, role: 'MEMBER' },
    ],
  })

  const task4 = await prisma.task.create({
    data: {
      projectId: mobileProject.id,
      title: 'Set up React Native project',
      description: 'Expo managed workflow, TypeScript strict mode',
      status: 'DONE',
      creatorId: carol.id,
      assigneeId: carol.id,
    },
  })
  const task5 = await prisma.task.create({
    data: {
      projectId: mobileProject.id,
      title: 'Implement auth screens',
      description: 'Login, register, forgot password',
      status: 'IN_PROGRESS',
      creatorId: carol.id,
      assigneeId: alice.id,
    },
  })

  // --- Comments ---
  const comment1 = await prisma.comment.create({
    data: { taskId: task1.id, authorId: bob.id, body: 'Reviewed the schema — looks solid.' },
  })
  const comment2 = await prisma.comment.create({
    data: { taskId: task2.id, authorId: alice.id, body: 'Starting with the login endpoint first.' },
  })
  const comment3 = await prisma.comment.create({
    data: { taskId: task2.id, authorId: bob.id, body: 'Watch out for the password hashing legacy path.' },
  })
  const comment4 = await prisma.comment.create({
    data: { taskId: task5.id, authorId: carol.id, body: 'Design mocks shared in Figma.' },
  })

  // --- Activity Logs ---
  await prisma.activityLog.createMany({
    data: [
      {
        taskId: task1.id,
        userId: alice.id,
        action: 'STATUS_CHANGE',
        fromStatus: 'TODO',
        toStatus: 'IN_PROGRESS',
      },
      {
        taskId: task1.id,
        userId: alice.id,
        action: 'STATUS_CHANGE',
        fromStatus: 'IN_PROGRESS',
        toStatus: 'DONE',
      },
      {
        taskId: task4.id,
        userId: carol.id,
        action: 'STATUS_CHANGE',
        fromStatus: 'TODO',
        toStatus: 'DONE',
      },
    ],
  })

  console.log('Seed complete.')
  console.log(`alice: id=${alice.id}, bob: id=${bob.id}, carol: id=${carol.id}`)
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
