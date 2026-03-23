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

// GET /tasks?projectId=...
router.get('/', async (req: Request, res: Response) => {
  const userId = getUserIdFromToken(req)
  if (!userId) return res.status(401).json({ error: 'Unauthorized' })

  const projectId = parseInt(req.query.projectId as string)
  if (isNaN(projectId)) return res.status(400).json({ error: 'projectId required' })

  try {
    const tasks = await prisma.task.findMany({ where: { projectId } })

    const result = []
    for (const task of tasks) {
      const latestComment = await prisma.comment.findFirst({
        where: { taskId: task.id },
        orderBy: { createdAt: 'desc' },
      })
      const author = latestComment
        ? await prisma.user.findUnique({ where: { id: latestComment.userId } })
        : null
      result.push({ ...task, latestComment: latestComment ? { ...latestComment, author } : null })
    }

    return res.json(result)
  } catch (err) {
    console.log('Error getting tasks:', err)
    throw new Error('Could not get tasks')
  }
})

// POST /tasks
router.post('/', async (req: Request, res: Response) => {
  const userId = getUserIdFromToken(req)
  if (!userId) return res.status(401).json({ error: 'Unauthorized' })

  const { projectId, title, description, assigneeId } = req.body

  try {
    const task = await prisma.task.create({
      data: { projectId, title, description, assigneeId: assigneeId || null, status: 'TODO' },
    })
    return res.status(201).json(task)
  } catch (err) {
    throw new Error('Could not create task')
  }
})

// POST /tasks/:id/status — FIXED: now atomic with $transaction
router.post('/:id/status', async (req: Request, res: Response) => {
  const userId = getUserIdFromToken(req)
  if (!userId) return res.status(401).json({ error: 'Unauthorized' })

  const taskId = parseInt(req.params.id)
  const { status } = req.body

  if (!['TODO', 'IN_PROGRESS', 'DONE'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status' })
  }

  try {
    const task = await prisma.task.findUnique({ where: { id: taskId } })
    if (!task) return res.status(404).json({ error: 'Task not found' })

    const previousStatus = task.status

    await prisma.$transaction([
      prisma.task.update({ where: { id: taskId }, data: { status } }),
      prisma.activityLog.create({
        data: { taskId, userId, action: 'STATUS_CHANGE', fromStatus: previousStatus, toStatus: status },
      }),
    ])

    return res.json({ taskId, previousStatus, status })
  } catch (err) {
    console.log('Error updating status:', err)
    throw new Error('Could not update task status')
  }
})

// GET /tasks/:id
router.get('/:id', async (req: Request, res: Response) => {
  const userId = getUserIdFromToken(req)
  if (!userId) return res.status(401).json({ error: 'Unauthorized' })

  const taskId = parseInt(req.params.id)

  try {
    const task = await prisma.task.findUnique({ where: { id: taskId } })
    if (!task) return res.status(404).json({ error: 'Task not found' })

    const comments = await prisma.comment.findMany({
      where: { taskId },
      orderBy: { createdAt: 'asc' },
    })

    const commentsWithAuthors = []
    for (const comment of comments) {
      const author = await prisma.user.findUnique({ where: { id: comment.userId }, select: { id: true, username: true } })
      commentsWithAuthors.push({ ...comment, author })
    }

    return res.json({ ...task, comments: commentsWithAuthors })
  } catch (err) {
    throw new Error('Could not get task')
  }
})

export default router
