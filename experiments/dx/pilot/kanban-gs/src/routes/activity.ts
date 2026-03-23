import { Router, Request, Response } from 'express'
import jwt from 'jsonwebtoken'
import { getActivityDigest } from '../services/activity.service'

const router = Router()
const JWT_SECRET = process.env.JWT_SECRET ?? 'supersecretkey123'

function getUserIdFromToken(req: Request): number | null {
  const auth = req.headers.authorization
  if (!auth) return null
  try {
    const payload = jwt.verify(auth.replace('Bearer ', ''), JWT_SECRET) as { userId: number }
    return payload.userId
  } catch { return null }
}

/**
 * GET /activity — Returns the last 20 task state changes for the authenticated user's projects.
 */
router.get('/', async (req: Request, res: Response) => {
  const userId = getUserIdFromToken(req)
  if (!userId) return res.status(401).json({ error: 'Unauthorized' })
  try {
    const digest = await getActivityDigest(userId)
    return res.json(digest)
  } catch (err) {
    return res.status(500).json({ error: 'Could not get activity' })
  }
})

export default router
