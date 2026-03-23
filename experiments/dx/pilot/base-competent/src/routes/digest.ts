import { Router, Request, Response } from 'express'
import jwt from 'jsonwebtoken'
import prisma from '../db'

const router = Router()

function getUserIdFromToken(req: Request): number | null {
  const auth = req.headers.authorization
  if (!auth) return null
  try {
    const payload = jwt.verify(auth.replace('Bearer ', ''), 'supersecretkey123') as { userId: number }
    return payload.userId
  } catch { return null }
}

// GET /digest
router.get('/', async (req: Request, res: Response) => {
  const userId = getUserIdFromToken(req)
  if (!userId) return res.status(401).json({ error: 'Unauthorized' })

  try {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

    const bookmarks = await prisma.bookmark.findMany({
      where: {
        createdAt: { gte: sevenDaysAgo },
        user: {
          followers: { some: { followerId: userId } },
        },
      },
      include: {
        user: { select: { username: true } },
      },
      orderBy: { savedCount: 'desc' },
      take: 5,
    })

    return res.json({
      generatedAt: new Date().toISOString(),
      bookmarks: bookmarks.map(b => ({
        id: b.id,
        url: b.url,
        title: b.title,
        savedCount: b.savedCount,
        savedBy: b.user.username,
      })),
    })
  } catch (err) {
    console.log('Digest error:', err)
    throw new Error('Could not build digest')
  }
})

// POST /digest/notify
router.post('/notify', async (req: Request, res: Response) => {
  const userId = getUserIdFromToken(req)
  if (!userId) return res.status(401).json({ error: 'Unauthorized' })

  try {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

    const bookmarks = await prisma.bookmark.findMany({
      where: {
        createdAt: { gte: sevenDaysAgo },
        user: { followers: { some: { followerId: userId } } },
      },
      include: { user: { select: { username: true } } },
      orderBy: { savedCount: 'desc' },
      take: 5,
    })

    // Notification stub — easy to swap in a real email sender
    console.log(`[DigestNotify] Would send to userId=${userId}:`, bookmarks.map(b => b.title))

    return res.json({ message: 'Notification sent' })
  } catch (err) {
    console.log('Notify error:', err)
    throw new Error('Could not send notification')
  }
})

export default router
