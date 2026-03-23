import { Router, Request, Response } from 'express'
import jwt from 'jsonwebtoken'
import prisma from '../db'

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
      include: { user: { select: { id: true, username: true } } },
    })
    return res.json(comments)
  } catch {
    return res.status(500).json({ error: 'Could not get comments' })
  }
})

// POST /comments
router.post('/', async (req: Request, res: Response) => {
  const userId = getUserIdFromToken(req)
  if (!userId) return res.status(401).json({ error: 'Unauthorized' })

  const { taskId, content } = req.body

  try {
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: { project: { include: { members: true } } },
    })
    if (!task) return res.status(404).json({ error: 'Task not found' })

    const isMember = task.project.members.some(m => m.userId === userId)
    if (!isMember) return res.status(403).json({ error: 'Not a project member' })

    const comment = await prisma.comment.create({
      data: { taskId, userId, content },
    })
    return res.status(201).json(comment)
  } catch {
    return res.status(500).json({ error: 'Could not create comment' })
  }
})

// DELETE /comments/:id
router.delete('/:id', async (req: Request, res: Response) => {
  const userId = getUserIdFromToken(req)
  if (!userId) return res.status(401).json({ error: 'Unauthorized' })

  const id = parseInt(req.params.id)

  try {
    const comment = await prisma.comment.findUnique({ where: { id } })
    if (!comment) return res.status(404).json({ error: 'Comment not found' })
    if (comment.userId !== userId) return res.status(403).json({ error: 'Forbidden' })

    await prisma.comment.delete({ where: { id } })
    return res.status(204).send()
  } catch {
    return res.status(500).json({ error: 'Could not delete comment' })
  }
})

export default router
