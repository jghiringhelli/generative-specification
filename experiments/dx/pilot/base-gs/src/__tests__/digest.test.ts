import request from 'supertest'
import app from '../index'
import jwt from 'jsonwebtoken'

jest.mock('../db', () => ({
  __esModule: true,
  default: {
    bookmark: {
      findMany: jest.fn(),
    },
  },
}))

import prisma from '../db'

const mockPrisma = prisma as jest.Mocked<typeof prisma>
const JWT_SECRET = 'supersecretkey123'

function makeToken(userId: number): string {
  return jwt.sign({ userId }, JWT_SECRET)
}

describe('GET /digest', () => {
  beforeEach(() => jest.clearAllMocks())

  it('returns 401 without token', async () => {
    const res = await request(app).get('/digest')
    expect(res.status).toBe(401)
  })

  it('returns correct shape with valid token', async () => {
    const mockBookmarks = [
      { id: 1, url: 'https://example.com', title: 'Example', savedCount: 10, user: { username: 'alice' } },
    ]
    ;(mockPrisma.bookmark.findMany as jest.Mock).mockResolvedValue(mockBookmarks)

    const token = makeToken(1)
    const res = await request(app).get('/digest').set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(200)
    expect(res.body).toHaveProperty('generatedAt')
    expect(Array.isArray(res.body.bookmarks)).toBe(true)
    expect(res.body.bookmarks[0]).toHaveProperty('savedBy', 'alice')
  })

  it('returns empty bookmarks when user follows no one', async () => {
    ;(mockPrisma.bookmark.findMany as jest.Mock).mockResolvedValue([])

    const token = makeToken(99)
    const res = await request(app).get('/digest').set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(200)
    expect(res.body.bookmarks).toHaveLength(0)
  })
})

describe('POST /digest/notify', () => {
  beforeEach(() => jest.clearAllMocks())

  it('returns 401 without token', async () => {
    const res = await request(app).post('/digest/notify')
    expect(res.status).toBe(401)
  })

  it('returns 200 with valid token', async () => {
    ;(mockPrisma.bookmark.findMany as jest.Mock).mockResolvedValue([])

    const token = makeToken(1)
    const res = await request(app).post('/digest/notify').set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(200)
    expect(res.body).toHaveProperty('message')
  })
})
