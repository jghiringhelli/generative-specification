import request from 'supertest'
import app from '../index'
import jwt from 'jsonwebtoken'

jest.mock('../db', () => ({
  __esModule: true,
  default: {
    bookmark: {
      findMany: jest.fn().mockResolvedValue([]),
    },
  },
}))

function makeToken(userId: number) {
  return jwt.sign({ userId }, 'supersecretkey123')
}

test('GET /digest returns 401 without token', async () => {
  const res = await request(app).get('/digest')
  expect(res.status).toBe(401)
})

test('GET /digest returns 200 with token', async () => {
  const res = await request(app).get('/digest').set('Authorization', `Bearer ${makeToken(1)}`)
  expect(res.status).toBe(200)
  expect(res.body).toHaveProperty('generatedAt')
  expect(Array.isArray(res.body.bookmarks)).toBe(true)
})

test('POST /digest/notify returns 401 without token', async () => {
  const res = await request(app).post('/digest/notify')
  expect(res.status).toBe(401)
})
