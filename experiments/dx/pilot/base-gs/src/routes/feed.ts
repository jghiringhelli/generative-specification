import { Router, Request, Response } from 'express'
import jwt from 'jsonwebtoken'
import prisma from '../db'

const router = Router()

function getUserIdFromToken(req: Request): number | null {
  const auth = req.headers.authorization
  if (!auth) return null
  try {
    const payload = jwt.verify(
      auth.replace('Bearer ', ''),
      'supersecretkey123'
    ) as { userId: number }
    return payload.userId
  } catch {
    return null
  }
}

// GET /feed - bookmarks from people you follow, sorted by createdAt
router.get('/', async (req: Request, res: Response) => {
  const userId = getUserIdFromToken(req)
  if (!userId) return res.status(401).json({ error: 'Unauthorized' })

  try {
    console.log('Building feed for user:', userId)

    // Get all follows
    const follows = await prisma.follow.findMany({
      where: { followerId: userId },
    })

    console.log('Following', follows.length, 'people')

    // N+1: one query per followed user
    const feedItems: any[] = []
    for (const follow of follows) {
      const bookmarks = await prisma.bookmark.findMany({
        where: { userId: follow.followingId },
        include: {
          user: { select: { username: true } },
          tags: { include: { tag: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 20,
      })
      feedItems.push(...bookmarks)
    }

    // Sort combined results by createdAt
    feedItems.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())

    console.log('Feed items:', feedItems.length)
    return res.json(feedItems.slice(0, 50))
  } catch (err) {
    console.log('Feed error:', err)
    throw new Error('Could not build feed')
  }
})

export default router
