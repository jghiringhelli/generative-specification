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

// POST /follows/:id - follow a user
router.post('/:id', async (req: Request, res: Response) => {
  const followerId = getUserIdFromToken(req)
  if (!followerId) return res.status(401).json({ error: 'Unauthorized' })

  const followingId = parseInt(req.params.id)

  try {
    console.log('Follow:', followerId, '->', followingId)

    const target = await prisma.user.findUnique({ where: { id: followingId } })
    if (!target) return res.status(404).json({ error: 'User not found' })

    if (followerId === followingId) {
      return res.status(400).json({ error: 'Cannot follow yourself' })
    }

    await prisma.follow.create({
      data: { followerId, followingId },
    })

    return res.status(201).json({ message: 'Now following' })
  } catch (err: any) {
    if (err.code === 'P2002') {
      return res.status(400).json({ error: 'Already following' })
    }
    console.log('Follow error:', err)
    throw new Error('Could not follow user')
  }
})

// DELETE /follows/:id - unfollow
router.delete('/:id', async (req: Request, res: Response) => {
  const followerId = getUserIdFromToken(req)
  if (!followerId) return res.status(401).json({ error: 'Unauthorized' })

  const followingId = parseInt(req.params.id)

  try {
    await prisma.follow.delete({
      where: { followerId_followingId: { followerId, followingId } },
    })

    console.log('Unfollow:', followerId, '->', followingId)
    return res.status(204).send()
  } catch (err) {
    console.log('Unfollow error:', err)
    return res.status(404).json({ error: 'Not following' })
  }
})

// GET /follows/:userId/followers
router.get('/:userId/followers', async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.params.userId)

    const follows = await prisma.follow.findMany({
      where: { followingId: userId },
    })

    // N+1: fetch each follower separately
    const followers = []
    for (const f of follows) {
      const user = await prisma.user.findUnique({ where: { id: f.followerId } })
      followers.push(user)
    }

    console.log('Followers for user', userId, ':', followers.length)
    return res.json(followers)
  } catch (err) {
    console.log('Get followers error:', err)
    throw new Error('Could not get followers')
  }
})

export default router
