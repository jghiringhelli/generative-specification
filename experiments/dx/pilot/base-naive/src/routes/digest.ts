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

router.get('/', async (req: Request, res: Response) => {
  const userId = getUserIdFromToken(req)
  if (!userId) return res.status(401).json({ error: 'Unauthorized' })

  const follows = await prisma.follow.findMany({
    where: { followerId: userId },
  })

  const followingIds = follows.map(f => f.followingId)
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

  const bookmarks = await prisma.bookmark.findMany({
    where: {
      userId: { in: followingIds },
      createdAt: { gte: sevenDaysAgo },
    },
    include: {
      user: true,
    },
    orderBy: { savedCount: 'desc' },
    take: 5,
  })

  return res.json({
    generatedAt: new Date(),
    bookmarks: bookmarks.map(b => ({
      id: b.id,
      url: b.url,
      title: b.title,
      savedCount: b.savedCount,
      savedBy: b.user.username,
    })),
  })
})

router.post('/notify', async (req: Request, res: Response) => {
  const userId = getUserIdFromToken(req)
  if (!userId) return res.status(401).json({ error: 'Unauthorized' })

  console.log(`Sending digest notification to user ${userId}`)
  return res.json({ message: 'Notification sent' })
})

export default router
