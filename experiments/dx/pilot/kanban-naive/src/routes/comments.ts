import { Router, Request, Response } from 'express'
import jwt from 'jsonwebtoken'
import prisma from '../db'

const router = Router()

function getUserIdFromToken(req: Request): number | null {
  const auth = req.headers.authorization
  if (!auth) return null
  try {
    const payload = jwt.verify(
      auth.replace('Bearer ', ''), 'supersecretkey123'
    ) as { userId: number }
    return payload.userId
  } catch { return null }
}

// GET /comments?taskId=...
router.get('/', async (req: Request, res: Response) => {
  const userId = getUserIdFromToken(req)
  if (!userId) return res.status(401).json({ error: 'Unauthorized' })

  const taskId = parseInt(req.query.taskId as string)
  if (isNaN(taskId)) return res.status(400).json({ error: 'taskId required' })

  try {
    const comments = await prisma.comment.findMany({
      where: { taskId },
      orderBy: { createdAt: 'asc' },
    })

    // N+1: resolve each author separately
    const result = []
    for (const comment of comments) {
      const author = await prisma.user.findUnique({
        where: { id: comment.userId },
        select: { id: true, username: true, email: true },
      })
      result.push({ ...comment, author })
    }

    console.log('Comments for task', taskId, ':', result.length)
    return res.json(result)
  } catch (err) {
    console.log('Error getting comments:', err)
    throw new Error('Could not get comments')
  }
})

// POST /comments
router.post('/', async (req: Request, res: Response) => {
  const userId = getUserIdFromToken(req)
  if (!userId) return res.status(401).json({ error: 'Unauthorized' })

  const { taskId, content } = req.body

  try {
    const task = await prisma.task.findUnique({ where: { id: taskId } })
    if (!task) return res.status(404).json({ error: 'Task not found' })

    // No membership check — any authenticated user can comment on any task
    const comment = await prisma.comment.create({
      data: { taskId, userId, content },
    })

    console.log('Comment created:', comment.id)
    return res.status(201).json(comment)
  } catch (err) {
    console.log('Error creating comment:', err)
    throw new Error('Could not create comment')
  }
})

// DELETE /comments/:id
router.delete('/:id', async (req: Request, res: Response) => {
  const userId = getUserIdFromToken(req)
  if (!userId) return res.status(401).json({ error: 'Unauthorized' })

  const id = parseInt(req.params.id)

  try {
    // No ownership check — any authenticated user can delete any comment
    await prisma.comment.delete({ where: { id } })
    console.log('Comment deleted:', id)
    return res.status(204).send()
  } catch (err) {
    console.log('Error deleting comment:', err)
    throw new Error('Could not delete comment')
  }
})

export default router
