import request from 'supertest'
import app from '../index'
import jwt from 'jsonwebtoken'

jest.mock('../db', () => ({
  __esModule: true,
  default: {
    projectMember: { findMany: jest.fn() },
    activityLog: { findMany: jest.fn(), create: jest.fn() },
    task: { findMany: jest.fn(), findUnique: jest.fn(), create: jest.fn(), update: jest.fn() },
    comment: { findMany: jest.fn(), findFirst: jest.fn(), create: jest.fn(), delete: jest.fn(), findUnique: jest.fn() },
    user: { findUnique: jest.fn() },
    $transaction: jest.fn(),
  },
}))

import prisma from '../db'
const JWT_SECRET = 'supersecretkey123'

function makeToken(userId: number): string {
  return jwt.sign({ userId }, JWT_SECRET)
}

describe('GET /activity', () => {
  beforeEach(() => jest.clearAllMocks())

  it('returns 401 without token', async () => {
    const res = await request(app).get('/activity')
    expect(res.status).toBe(401)
  })

  it('returns correct shape with valid token', async () => {
    ;(prisma.projectMember.findMany as jest.Mock).mockResolvedValue([{ projectId: 1 }])
    ;(prisma.activityLog.findMany as jest.Mock).mockResolvedValue([
      {
        id: 1,
        action: 'STATUS_CHANGE',
        fromStatus: 'TODO',
        toStatus: 'IN_PROGRESS',
        createdAt: new Date('2026-03-17T10:00:00Z'),
        task: { id: 1, title: 'Test task', projectId: 1, project: { name: 'Test project' } },
        user: { id: 1, username: 'alice' },
      },
    ])

    const res = await request(app)
      .get('/activity')
      .set('Authorization', `Bearer ${makeToken(1)}`)

    expect(res.status).toBe(200)
    expect(res.body).toHaveProperty('generatedAt')
    expect(Array.isArray(res.body.entries)).toBe(true)
    const entry = res.body.entries[0]
    expect(entry).toHaveProperty('task')
    expect(entry).toHaveProperty('changedBy')
    expect(entry.task).toHaveProperty('projectName', 'Test project')
    expect(entry.changedBy).toHaveProperty('username', 'alice')
  })

  it('returns empty entries when user has no memberships', async () => {
    ;(prisma.projectMember.findMany as jest.Mock).mockResolvedValue([])
    ;(prisma.activityLog.findMany as jest.Mock).mockResolvedValue([])

    const res = await request(app)
      .get('/activity')
      .set('Authorization', `Bearer ${makeToken(99)}`)

    expect(res.status).toBe(200)
    expect(res.body.entries).toHaveLength(0)
  })
})

describe('POST /tasks/:id/status', () => {
  beforeEach(() => jest.clearAllMocks())

  it('returns 401 without token', async () => {
    const res = await request(app).post('/tasks/1/status').send({ status: 'IN_PROGRESS' })
    expect(res.status).toBe(401)
  })

  it('returns 400 for invalid status value', async () => {
    const res = await request(app)
      .post('/tasks/1/status')
      .set('Authorization', `Bearer ${makeToken(1)}`)
      .send({ status: 'INVALID_STATUS' })
    expect(res.status).toBe(400)
  })

  it('returns 404 when task not found', async () => {
    ;(prisma.task.findUnique as jest.Mock).mockResolvedValue(null)

    const res = await request(app)
      .post('/tasks/999/status')
      .set('Authorization', `Bearer ${makeToken(1)}`)
      .send({ status: 'IN_PROGRESS' })

    expect(res.status).toBe(404)
  })

  it('atomically updates status and logs activity', async () => {
    ;(prisma.task.findUnique as jest.Mock).mockResolvedValue({ id: 1, status: 'TODO' })
    ;(prisma.$transaction as jest.Mock).mockResolvedValue([
      { id: 1, status: 'IN_PROGRESS' },
      { id: 1, action: 'STATUS_CHANGE' },
    ])

    const res = await request(app)
      .post('/tasks/1/status')
      .set('Authorization', `Bearer ${makeToken(1)}`)
      .send({ status: 'IN_PROGRESS' })

    expect(res.status).toBe(200)
    expect(res.body).toMatchObject({ taskId: 1, previousStatus: 'TODO', status: 'IN_PROGRESS' })
    expect(prisma.$transaction).toHaveBeenCalledTimes(1)
  })
})

describe('POST /comments', () => {
  beforeEach(() => jest.clearAllMocks())

  it('returns 403 when user is not a project member', async () => {
    ;(prisma.task.findUnique as jest.Mock).mockResolvedValue({
      id: 1,
      project: { members: [{ userId: 2 }] },
    })

    const res = await request(app)
      .post('/comments')
      .set('Authorization', `Bearer ${makeToken(1)}`)
      .send({ taskId: 1, content: 'Hello' })

    expect(res.status).toBe(403)
  })
})
