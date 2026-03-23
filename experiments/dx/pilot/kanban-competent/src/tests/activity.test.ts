import request from 'supertest'
import app from '../index'
import jwt from 'jsonwebtoken'

jest.mock('../db', () => ({
  __esModule: true,
  default: {
    projectMember: { findMany: jest.fn() },
    activityLog: { findMany: jest.fn() },
    task: { findMany: jest.fn(), findUnique: jest.fn(), create: jest.fn(), update: jest.fn() },
    comment: { findMany: jest.fn(), findFirst: jest.fn(), create: jest.fn(), delete: jest.fn() },
    user: { findUnique: jest.fn() },
    $transaction: jest.fn(),
  },
}))

import prisma from '../db'

function makeToken(userId: number) {
  return jwt.sign({ userId }, 'supersecretkey123')
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
        createdAt: new Date(),
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
    expect(res.body.entries[0]).toHaveProperty('task')
    expect(res.body.entries[0]).toHaveProperty('changedBy')
  })
})

describe('POST /tasks/:id/status', () => {
  beforeEach(() => jest.clearAllMocks())

  it('returns 401 without token', async () => {
    const res = await request(app).post('/tasks/1/status').send({ status: 'IN_PROGRESS' })
    expect(res.status).toBe(401)
  })

  it('returns 400 for invalid status', async () => {
    const res = await request(app)
      .post('/tasks/1/status')
      .set('Authorization', `Bearer ${makeToken(1)}`)
      .send({ status: 'INVALID' })
    expect(res.status).toBe(400)
  })
})
