import { Router, Request, Response } from 'express'
import jwt from 'jsonwebtoken'
import { buildDigest, sendDigestNotification } from '../services/digest.service'

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
 * GET /digest — Returns the weekly digest for the authenticated user.
 */
router.get('/', async (req: Request, res: Response) => {
  const userId = getUserIdFromToken(req)
  if (!userId) return res.status(401).json({ error: 'Unauthorized' })
  try {
    const digest = await buildDigest(userId)
    return res.json(digest)
  } catch (err) {
    return res.status(500).json({ error: 'Could not build digest' })
  }
})

/**
 * POST /digest/notify — Triggers a digest notification for the authenticated user.
 */
router.post('/notify', async (req: Request, res: Response) => {
  const userId = getUserIdFromToken(req)
  if (!userId) return res.status(401).json({ error: 'Unauthorized' })
  try {
    await sendDigestNotification(userId)
    return res.json({ message: 'Notification queued' })
  } catch (err) {
    return res.status(500).json({ error: 'Could not send notification' })
  }
})

export default router
